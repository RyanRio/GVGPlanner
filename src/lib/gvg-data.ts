import { supabase } from "./supabase";
import type {
  CatalogPair,
  GymChallenge,
  ImportedMember,
  ImportedPair,
  ManualLeaderAssignments,
  PairCatalog,
  PremiumCategory
} from "../types";

function emptyPremiumCounts(): Record<PremiumCategory | "all", number> {
  return {
    all: 0,
    general: 0,
    master_fair: 0,
    arc_fair: 0,
    poke_fair: 0,
    seasonal: 0,
    variety: 0,
    special_costume: 0
  };
}

function buildPremiumCounts(pairs: ImportedPair[]) {
  return pairs.reduce<Record<PremiumCategory | "all", number>>((counts, pair) => {
    counts.all += pair.premiumCategory === "general" ? 0 : 1;
    counts[pair.premiumCategory] += 1;
    return counts;
  }, emptyPremiumCounts());
}

function isImportedPair(value: unknown): value is ImportedPair {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.pairId === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.syncLevel === "number" &&
    typeof candidate.isEx === "boolean" &&
    typeof candidate.rawValue === "string" &&
    typeof candidate.roleCategory === "string" &&
    typeof candidate.roleLabel === "string" &&
    typeof candidate.exRoleCategory === "string" &&
    typeof candidate.exRoleLabel === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.premiumCategory === "string"
  );
}

export function normalizeMemberSlug(displayName: string) {
  return displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function fetchCatalog() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("sync_pairs")
    .select(
      "id, display_label, trainer_name, trainer_alt, pokemon_name, pokemon_form, role_category, role_label, ex_role_category, ex_role_label, type, region, acquisition, premium_category"
    )
    .order("display_label");

  if (error) throw error;

  const byId = new Map<string, CatalogPair>();

  data.forEach((pair) => {
    byId.set(pair.id, {
      pairId: pair.id,
      label: pair.display_label,
      trainerName: pair.trainer_name,
      trainerAlt: pair.trainer_alt ?? "",
      pokemonName: pair.pokemon_name,
      pokemonForm: pair.pokemon_form ?? "",
      roleCategory: pair.role_category,
      roleLabel: pair.role_label,
      exRoleCategory: pair.ex_role_category ?? "",
      exRoleLabel: pair.ex_role_label ?? "",
      type: pair.type,
      region: pair.region,
      acquisition: pair.acquisition,
      premiumCategory: pair.premium_category
    });
  });

  const catalog: PairCatalog = {
    byId,
    totalPairs: byId.size
  };

  return catalog;
}

export async function fetchImportedMembers() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const [membersResult, importsResult] = await Promise.all([
    supabase
      .from("gym_roster_members")
      .select(
        `
          id,
          member_slug,
          display_name,
          member_current_roster (
            pair_id,
            sync_level,
            is_ex,
            metadata,
            sync_pairs (
              id,
              display_label,
              premium_category,
              role_category,
              role_label,
              ex_role_category,
              ex_role_label,
              type
            )
          )
        `
      )
      .eq("is_active", true)
      .order("display_name"),
    supabase
      .from("roster_imports")
      .select("member_id, unmatched_keys, created_at")
      .order("created_at", { ascending: false })
  ]);

  if (membersResult.error) throw membersResult.error;
  if (importsResult.error) throw importsResult.error;

  const latestImports = new Map<string, string[]>();
  importsResult.data.forEach((item) => {
    if (!latestImports.has(item.member_id)) {
      latestImports.set(
        item.member_id,
        Array.isArray(item.unmatched_keys)
          ? item.unmatched_keys.filter((value): value is string => typeof value === "string")
          : []
      );
    }
  });

  return membersResult.data.map((member) => {
    const pairs = (member.member_current_roster ?? [])
      .map((entry) => {
        const pair = Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs;
        if (!pair) return null;

        const importedPair: ImportedPair = {
          pairId: pair.id,
          label: pair.display_label,
          syncLevel: entry.sync_level,
          isEx: entry.is_ex,
          rawValue:
            entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
              ? String((entry.metadata as Record<string, unknown>).raw_value ?? "")
              : "",
          roleCategory: pair.role_category,
          roleLabel: pair.role_label,
          exRoleCategory: pair.ex_role_category ?? "",
          exRoleLabel: pair.ex_role_label ?? "",
          type: pair.type,
          premiumCategory: pair.premium_category
        };

        return isImportedPair(importedPair) ? importedPair : null;
      })
      .filter((value): value is ImportedPair => Boolean(value))
      .sort((a, b) => a.label.localeCompare(b.label));

    const importedMember: ImportedMember = {
      id: member.member_slug,
      displayName: member.display_name,
      pairs,
      unmatchedKeys: latestImports.get(member.id) ?? [],
      premiumCounts: buildPremiumCounts(pairs)
    };

    return importedMember;
  });
}

export async function importMemberRoster(
  member: ImportedMember,
  rawPayload: Record<string, string>
) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const payload = member.pairs.map((pair) => ({
    pair_id: pair.pairId,
    sync_level: pair.syncLevel,
    is_ex: pair.isEx,
    raw_value: pair.rawValue
  }));

  const { error } = await supabase.rpc("import_member_roster", {
    p_member_slug: member.id,
    p_display_name: member.displayName,
    p_raw_payload: rawPayload,
    p_imported_pairs: payload,
    p_unmatched_keys: member.unmatchedKeys
  });

  if (error) throw error;
}

export async function deleteRosterMember(memberSlug: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("delete_roster_member", {
    p_member_slug: memberSlug
  });

  if (error) throw error;
}

function mapChallenge(record: {
  id: string;
  name: string;
  notes: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  gym_challenge_leaders: Array<{
    id: string;
    slot_number: number;
    leader_name: string;
    weakness_type: string;
    gym_challenge_leader_pairs:
      | Array<{
          sync_pairs:
            | {
                id: string;
                display_label: string;
                trainer_name: string;
                trainer_alt: string | null;
                pokemon_name: string;
                pokemon_form: string | null;
                role_category: string;
                role_label: string;
                ex_role_category: string | null;
                ex_role_label: string | null;
                type: string;
                region: string;
                acquisition: string;
                premium_category: PremiumCategory;
              }
            | Array<{
                id: string;
                display_label: string;
                trainer_name: string;
                trainer_alt: string | null;
                pokemon_name: string;
                pokemon_form: string | null;
                role_category: string;
                role_label: string;
                ex_role_category: string | null;
                ex_role_label: string | null;
                type: string;
                region: string;
                acquisition: string;
                premium_category: PremiumCategory;
              }>;
        }>
      | null;
    gym_challenge_leader_setup_pairs:
      | Array<{
          sync_pairs:
            | {
                id: string;
                display_label: string;
                trainer_name: string;
                trainer_alt: string | null;
                pokemon_name: string;
                pokemon_form: string | null;
                role_category: string;
                role_label: string;
                ex_role_category: string | null;
                ex_role_label: string | null;
                type: string;
                region: string;
                acquisition: string;
                premium_category: PremiumCategory;
              }
            | Array<{
                id: string;
                display_label: string;
                trainer_name: string;
                trainer_alt: string | null;
                pokemon_name: string;
                pokemon_form: string | null;
                role_category: string;
                role_label: string;
                ex_role_category: string | null;
                ex_role_label: string | null;
                type: string;
                region: string;
                acquisition: string;
                premium_category: PremiumCategory;
              }>;
        }>
      | null;
  }> | null;
  gym_challenge_modifiers:
    | {
        modifier_1: string;
        modifier_2: string;
        modifier_3: string;
      }
    | Array<{
        modifier_1: string;
        modifier_2: string;
        modifier_3: string;
      }>
    | null;
  gym_challenge_setup_pairs:
    | Array<{
        setup_category: string;
        sync_pairs:
          | {
              id: string;
              display_label: string;
              trainer_name: string;
              trainer_alt: string | null;
              pokemon_name: string;
              pokemon_form: string | null;
              role_category: string;
              role_label: string;
              ex_role_category: string | null;
              ex_role_label: string | null;
              type: string;
              region: string;
              acquisition: string;
              premium_category: PremiumCategory;
            }
          | Array<{
              id: string;
              display_label: string;
              trainer_name: string;
              trainer_alt: string | null;
              pokemon_name: string;
              pokemon_form: string | null;
              role_category: string;
              role_label: string;
              ex_role_category: string | null;
              ex_role_label: string | null;
              type: string;
              region: string;
              acquisition: string;
              premium_category: PremiumCategory;
            }>;
      }>
    | null;
  gym_challenge_setup_duty_members:
    | Array<{
        member_slug: string;
      }>
    | null;
  gym_challenge_manual_assignments:
    | Array<{
        leader_slot_number: number;
        primary_member_slug: string | null;
        secondary_member_slug: string | null;
      }>
    | null;
}): GymChallenge {
  const modifiers = Array.isArray(record.gym_challenge_modifiers)
    ? record.gym_challenge_modifiers[0]
    : record.gym_challenge_modifiers;
  const setupEntries = record.gym_challenge_setup_pairs ?? [];
  const manualAssignments = (record.gym_challenge_manual_assignments ?? []).reduce<ManualLeaderAssignments>(
    (assignments, entry) => {
      assignments[entry.leader_slot_number] = {
        primaryMemberId: entry.primary_member_slug ?? "",
        secondaryMemberId: entry.secondary_member_slug ?? ""
      };
      return assignments;
    },
    {}
  );

  function mapCatalogPair(
    pair:
      | {
          id: string;
          display_label: string;
          trainer_name: string;
          trainer_alt: string | null;
          pokemon_name: string;
          pokemon_form: string | null;
          role_category: string;
          role_label: string;
          ex_role_category: string | null;
          ex_role_label: string | null;
          type: string;
          region: string;
          acquisition: string;
          premium_category: PremiumCategory;
        }
      | null
      | undefined
  ) {
    if (!pair) return null;

    return {
      pairId: pair.id,
      label: pair.display_label,
      trainerName: pair.trainer_name,
      trainerAlt: pair.trainer_alt ?? "",
      pokemonName: pair.pokemon_name,
      pokemonForm: pair.pokemon_form ?? "",
      roleCategory: pair.role_category,
      roleLabel: pair.role_label,
      exRoleCategory: pair.ex_role_category ?? "",
      exRoleLabel: pair.ex_role_label ?? "",
      type: pair.type,
      region: pair.region,
      acquisition: pair.acquisition,
      premiumCategory: pair.premium_category
    };
  }

  const physicalBreakPairs = setupEntries
    .filter((entry) => entry.setup_category === "physical_breaks")
    .map((entry) => mapCatalogPair(Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs))
    .filter((pair): pair is CatalogPair => Boolean(pair))
    .sort((a, b) => a.label.localeCompare(b.label));
  const specialBreakPairs = setupEntries
    .filter((entry) => entry.setup_category === "special_breaks")
    .map((entry) => mapCatalogPair(Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs))
    .filter((pair): pair is CatalogPair => Boolean(pair))
    .sort((a, b) => a.label.localeCompare(b.label));
  const debuffChipPairs = setupEntries
    .filter((entry) => entry.setup_category === "debuffs_chip")
    .map((entry) => mapCatalogPair(Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs))
    .filter((pair): pair is CatalogPair => Boolean(pair))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    id: record.id,
    name: record.name,
    notes: record.notes ?? "",
    isCurrent: record.is_current,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    leaders: (record.gym_challenge_leaders ?? [])
      .map((leader) => ({
        id: leader.id,
        slotNumber: leader.slot_number,
        leaderName: leader.leader_name,
        weaknessType: leader.weakness_type,
        importantPairs: (leader.gym_challenge_leader_pairs ?? [])
          .map((entry) =>
            mapCatalogPair(Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs)
          )
          .filter((pair): pair is CatalogPair => Boolean(pair))
          .sort((a, b) => a.label.localeCompare(b.label)),
        rebuffPairs: (leader.gym_challenge_leader_setup_pairs ?? [])
          .map((entry) =>
            mapCatalogPair(Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs)
          )
          .filter((pair): pair is CatalogPair => Boolean(pair))
          .sort((a, b) => a.label.localeCompare(b.label))
      }))
      .sort((a, b) => a.slotNumber - b.slotNumber),
    modifiers: {
      modifier1: modifiers?.modifier_1 ?? "",
      modifier2: modifiers?.modifier_2 ?? "",
      modifier3: modifiers?.modifier_3 ?? ""
    },
    setupPairs: {
      physicalBreakPairs,
      specialBreakPairs,
      debuffChipPairs
    },
    setupDutyMemberIds: (record.gym_challenge_setup_duty_members ?? [])
      .map((entry) => entry.member_slug)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .sort((a, b) => a.localeCompare(b)),
    manualAssignments
  };
}

const challengeSelect = `
  id,
  name,
  notes,
  is_current,
  created_at,
  updated_at,
    gym_challenge_leaders (
      id,
      slot_number,
      leader_name,
      weakness_type,
    gym_challenge_leader_pairs (
      sync_pairs (
        id,
        display_label,
        trainer_name,
        trainer_alt,
        pokemon_name,
        pokemon_form,
        role_category,
        role_label,
        ex_role_category,
        ex_role_label,
        type,
        region,
        acquisition,
        premium_category
      )
    ),
    gym_challenge_leader_setup_pairs (
      sync_pairs (
        id,
        display_label,
        trainer_name,
        trainer_alt,
        pokemon_name,
        pokemon_form,
        role_category,
        role_label,
        ex_role_category,
        ex_role_label,
        type,
        region,
        acquisition,
        premium_category
      )
    )
  ),
  gym_challenge_modifiers (
    modifier_1,
    modifier_2,
    modifier_3
  ),
  gym_challenge_setup_pairs (
    setup_category,
    sync_pairs (
      id,
      display_label,
      trainer_name,
      trainer_alt,
      pokemon_name,
      pokemon_form,
      role_category,
      role_label,
      ex_role_category,
      ex_role_label,
      type,
      region,
      acquisition,
      premium_category
    )
  ),
  gym_challenge_setup_duty_members (
    member_slug
  ),
  gym_challenge_manual_assignments (
    leader_slot_number,
    primary_member_slug,
    secondary_member_slug
  )
`;

export async function fetchCurrentChallenge() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("gym_challenges")
    .select(challengeSelect)
    .eq("is_current", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapChallenge(data);
}

export async function fetchChallengeList() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("gym_challenges")
    .select(challengeSelect)
    .order("is_current", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data.map(mapChallenge);
}

export async function saveGymChallenge(challenge: {
  id: string;
  name: string;
  notes: string;
  leaders: GymChallenge["leaders"];
  modifiers: GymChallenge["modifiers"];
  setupPairs: GymChallenge["setupPairs"];
}) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.rpc("save_gym_challenge", {
    p_challenge_id: challenge.id || null,
    p_name: challenge.name,
    p_notes: challenge.notes,
    p_leaders: challenge.leaders.map((leader) => ({
      slot_number: leader.slotNumber,
      leader_name: leader.leaderName,
      weakness_type: leader.weaknessType,
      important_pair_ids: leader.importantPairs.map((pair) => pair.pairId),
      rebuff_pair_ids: leader.rebuffPairs.map((pair) => pair.pairId)
    })),
    p_modifier_1: challenge.modifiers.modifier1,
    p_modifier_2: challenge.modifiers.modifier2,
    p_modifier_3: challenge.modifiers.modifier3,
    p_setup_pairs: {
      physical_breaks: challenge.setupPairs.physicalBreakPairs.map((pair) => pair.pairId),
      special_breaks: challenge.setupPairs.specialBreakPairs.map((pair) => pair.pairId),
      debuffs_chip: challenge.setupPairs.debuffChipPairs.map((pair) => pair.pairId)
    }
  });

  if (error) throw error;

  return data as string;
}

export async function setCurrentChallenge(challengeId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("set_current_gym_challenge", {
    p_challenge_id: challengeId
  });

  if (error) throw error;
}

export async function saveChallengeSetupDutyMembers(challengeId: string, memberSlugs: string[]) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("set_challenge_setup_duty_members", {
    p_challenge_id: challengeId,
    p_member_slugs: memberSlugs
  });

  if (error) throw error;
}

export async function saveChallengeManualAssignment(
  challengeId: string,
  slotNumber: number,
  assignment: { primaryMemberId: string; secondaryMemberId: string }
) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("set_challenge_manual_assignment", {
    p_challenge_id: challengeId,
    p_leader_slot_number: slotNumber,
    p_primary_member_slug: assignment.primaryMemberId || null,
    p_secondary_member_slug: assignment.secondaryMemberId || null
  });

  if (error) throw error;
}
