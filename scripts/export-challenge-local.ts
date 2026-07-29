import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx-js-style";
import { buildGreedyLeaderAssignments, buildLeaderRecommendations } from "../src/lib/recommendations";
import { buildGymChallengeWorkbook, defaultWorkbookFileName } from "../src/lib/workbook-core";
import type {
  CatalogPair,
  GymChallenge,
  ImportedMember,
  ImportedPair,
  ManualLeaderAssignments,
  PremiumCategory
} from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.resolve(projectRoot, ".env.local");

function parseDotEnv(text: string) {
  const env: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    env[key] = value;
  }
  return env;
}

async function loadEnv() {
  try {
    return parseDotEnv(await readFile(envPath, "utf8"));
  } catch {
    return {};
  }
}

function parseArgs(argv: string[]) {
  const options = { round: 4, out: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--round" || arg === "-r") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (!Number.isNaN(value) && value >= 1) options.round = value;
      index += 1;
      continue;
    }
    if (arg === "--out" || arg === "-o") {
      options.out = argv[index + 1] ?? "";
      index += 1;
    }
  }
  return options;
}

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

type RawCatalogPair = {
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
};

type RawRoundStat = {
  round_number: number;
  points: number;
  cumulative_points: number;
  middle_hp: number;
  middle_offenses: number;
  middle_defenses: number;
  middle_speed: number;
  side_hp: number;
  side_offenses: number;
  side_defenses: number;
  side_speed: number;
};

function mapCatalogPair(pair: RawCatalogPair | null | undefined): CatalogPair | null {
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

function mapChallenge(record: {
  id: string;
  name: string;
  notes: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  gym_challenge_leaders:
    | Array<{
        id: string;
        slot_number: number;
        leader_name: string;
        boss_type: string | null;
        weakness_type: string;
        battle_1_effect: string | null;
        battle_2_effect: string | null;
        battle_3_effect: string | null;
        gym_challenge_leader_pairs: Array<{ sync_pairs: RawCatalogPair | RawCatalogPair[] | null }> | null;
        gym_challenge_leader_setup_pairs: Array<{ sync_pairs: RawCatalogPair | RawCatalogPair[] | null }> | null;
      }>
    | null;
  gym_challenge_modifiers:
    | { modifier_1: string; modifier_2: string; modifier_3: string }
    | Array<{ modifier_1: string; modifier_2: string; modifier_3: string }>
    | null;
  gym_challenge_setup_pairs:
    | Array<{ setup_category: string; sync_pairs: RawCatalogPair | RawCatalogPair[] | null }>
    | null;
  gym_challenge_setup_duty_members:
    | Array<{ member_slug: string }>
    | null;
  gym_challenge_round_stats: RawRoundStat[] | null;
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

  const filterSetupPairs = (category: string) =>
    setupEntries
      .filter((entry) => entry.setup_category === category)
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
        bossType: leader.boss_type ?? "",
        weaknessType: leader.weakness_type,
        battle1Effect: leader.battle_1_effect ?? "",
        battle2Effect: leader.battle_2_effect ?? "",
        battle3Effect: leader.battle_3_effect ?? "",
        importantPairs: (leader.gym_challenge_leader_pairs ?? [])
          .map((entry) => mapCatalogPair(Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs))
          .filter((pair): pair is CatalogPair => Boolean(pair))
          .sort((a, b) => a.label.localeCompare(b.label)),
        rebuffPairs: (leader.gym_challenge_leader_setup_pairs ?? [])
          .map((entry) => mapCatalogPair(Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs))
          .filter((pair): pair is CatalogPair => Boolean(pair))
          .sort((a, b) => a.label.localeCompare(b.label))
      }))
      .sort((a, b) => a.slotNumber - b.slotNumber),
    modifiers: {
      modifier1: modifiers?.modifier_1 ?? "",
      modifier2: modifiers?.modifier_2 ?? "",
      modifier3: modifiers?.modifier_3 ?? ""
    },
    roundStats: (record.gym_challenge_round_stats ?? [])
      .map((round) => ({
        roundNumber: round.round_number,
        points: round.points,
        cumulativePoints: round.cumulative_points,
        middleHp: round.middle_hp,
        middleOffenses: round.middle_offenses,
        middleDefenses: round.middle_defenses,
        middleSpeed: round.middle_speed,
        sideHp: round.side_hp,
        sideOffenses: round.side_offenses,
        sideDefenses: round.side_defenses,
        sideSpeed: round.side_speed
      }))
      .sort((a, b) => a.roundNumber - b.roundNumber),
    setupPairs: {
      physicalBreakPairs: filterSetupPairs("physical_breaks"),
      specialBreakPairs: filterSetupPairs("special_breaks"),
      debuffChipPairs: filterSetupPairs("debuffs_chip"),
      offTypePairs: filterSetupPairs("off_type")
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
    boss_type,
    weakness_type,
    battle_1_effect,
    battle_2_effect,
    battle_3_effect,
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
  gym_challenge_round_stats (
    round_number,
    points,
    cumulative_points,
    middle_hp,
    middle_offenses,
    middle_defenses,
    middle_speed,
    side_hp,
    side_offenses,
    side_defenses,
    side_speed
  ),
  gym_challenge_manual_assignments (
    leader_slot_number,
    primary_member_slug,
    secondary_member_slug
  )
`;

function buildWorkbookManualAssignments(members: ImportedMember[], manualAssignments: ManualLeaderAssignments) {
  const memberNames = new Map(members.map((member) => [member.id, member.displayName]));

  return Object.fromEntries(
    Object.entries(manualAssignments).map(([slotNumber, assignment]) => [
      Number(slotNumber),
      {
        primary: memberNames.get(assignment.primaryMemberId) ?? "",
        secondary: memberNames.get(assignment.secondaryMemberId) ?? ""
      }
    ])
  );
}

async function fetchCurrentChallenge(client: ReturnType<typeof createClient>) {
  const { data, error } = await client
    .from("gym_challenges")
    .select(challengeSelect)
    .eq("is_current", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapChallenge(data) : null;
}

async function fetchImportedMembers(client: ReturnType<typeof createClient>): Promise<ImportedMember[]> {
  const [membersResult, importsResult] = await Promise.all([
    client
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
    client.from("roster_imports").select("member_id, unmatched_keys, created_at").order("created_at", { ascending: false })
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
        return {
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
        } satisfies ImportedPair;
      })
      .filter((pair): pair is ImportedPair => Boolean(pair))
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      id: member.member_slug,
      displayName: member.display_name,
      pairs,
      unmatchedKeys: latestImports.get(member.id) ?? [],
      premiumCounts: buildPremiumCounts(pairs)
    };
  });
}

function defaultOutputPath(challengeName: string, roundNumber: number) {
  const safeName = challengeName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return path.resolve(projectRoot, `${safeName || "gym_challenge"}_round_${roundNumber}.xlsx`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = await loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const publishableKey = env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
  const memberEmail = env.LOCAL_MEMBER_EMAIL ?? "member@gvgplanner.local";
  const memberPassword = env.LOCAL_MEMBER_PASSWORD ?? "GauntletMember123!";

  const client = createClient(supabaseUrl, publishableKey);
  const { error: signInError } = await client.auth.signInWithPassword({
    email: memberEmail,
    password: memberPassword
  });
  if (signInError) throw signInError;

  const challenge = await fetchCurrentChallenge(client);
  if (!challenge) throw new Error("No current gym challenge found.");

  const members = await fetchImportedMembers(client);
  const recommendations = buildLeaderRecommendations(challenge, members);
  const assignmentPlan = buildGreedyLeaderAssignments(challenge, recommendations, members, {
    setupDutyMemberIds: challenge.setupDutyMemberIds,
    manualAssignments: challenge.manualAssignments
  });
  const workbook = buildGymChallengeWorkbook({
    challenge,
    members,
    selectedRound: args.round,
    recommendations,
    assignmentPlan,
    manualAssignments: buildWorkbookManualAssignments(members, challenge.manualAssignments)
  });

  const outputPath = args.out ? path.resolve(projectRoot, args.out) : defaultOutputPath(challenge.name, args.round);
  await mkdir(path.dirname(outputPath), { recursive: true });
  XLSX.writeFile(workbook, outputPath || defaultWorkbookFileName(challenge.name, args.round));
  console.log(`Exported workbook to ${outputPath}`);
}

await main();
