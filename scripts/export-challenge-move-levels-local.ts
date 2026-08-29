import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx-js-style";
import type { CatalogPair, ImportedMember, PremiumCategory } from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.resolve(projectRoot, ".env.local");
const seedEnvPath = path.resolve(projectRoot, ".env.seed.local");

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

type RawChallengeRecord = {
  id: string;
  name: string;
  gym_challenge_leaders:
    | Array<{
        slot_number: number;
        weakness_type: string;
        gym_challenge_leader_pairs: Array<{ sync_pairs: RawCatalogPair | RawCatalogPair[] | null }> | null;
        gym_challenge_leader_setup_pairs: Array<{ sync_pairs: RawCatalogPair | RawCatalogPair[] | null }> | null;
      }>
    | null;
  gym_challenge_setup_pairs:
    | Array<{ setup_category: string; sync_pairs: RawCatalogPair | RawCatalogPair[] | null }>
    | null;
};

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
  const merged: Record<string, string> = {};

  for (const filePath of [seedEnvPath, envPath]) {
    try {
      Object.assign(merged, parseDotEnv(await readFile(filePath, "utf8")));
    } catch {
      // ignore missing local env files
    }
  }

  return merged;
}

function parseArgs(argv: string[]) {
  const options = { out: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out" || arg === "-o") {
      options.out = argv[index + 1] ?? "";
      index += 1;
    }
  }
  return options;
}

function defaultOutputPath(challengeName: string) {
  const safeName = challengeName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return path.resolve(projectRoot, "exports", `${safeName || "challenge"}_move_levels.xlsx`);
}

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

function abbreviateAlt(trainerAlt: string) {
  const normalized = trainerAlt.trim().toLowerCase();
  const map: Record<string, string> = {
    "neo champion": "NC",
    "sygna suit": "SS",
    "arc suit": "Arc",
    "special costume": "SC",
    anniversary: "Anni",
    variety: "V.",
    summer: "Summer",
    holiday: "Holiday",
    "palentine's": "Pal",
    "new year": "NY",
    lodge: "Lodge",
    costume: "Cost",
    fall: "Fall",
    spring: "Spring",
    winter: "Winter"
  };
  return map[normalized] ?? trainerAlt;
}

function shortenTrainerName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 7) return trimmed;
  return trimmed.slice(0, 7);
}

function buildShortUnitLabel(pair: CatalogPair) {
  const trainer = shortenTrainerName(pair.trainerName);
  if (pair.trainerAlt) {
    return `${abbreviateAlt(pair.trainerAlt)} ${trainer}`.trim();
  }
  return trainer;
}

function buildBorder() {
  return {
    top: { style: "thin", color: { rgb: "8A8A8A" } },
    bottom: { style: "thin", color: { rgb: "8A8A8A" } },
    left: { style: "thin", color: { rgb: "8A8A8A" } },
    right: { style: "thin", color: { rgb: "8A8A8A" } }
  };
}

function buildFill(type: string) {
  const fills: Record<string, string> = {
    Bug: "D9E8BF",
    Dark: "D6D6D6",
    Dragon: "BFD8FF",
    Electric: "FFF3A8",
    Fairy: "F8D7E8",
    Fighting: "F8D0B2",
    Fire: "FFC3C3",
    Flying: "D8EEFF",
    Ghost: "D7CCE6",
    Ice: "DFF4FF",
    Normal: "EAEAEA",
    Steel: "D8D8D8",
    Water: "D6EBFF"
  };
  return fills[type] ?? "EAF1F8";
}

function styleCell(
  ws: XLSX.WorkSheet,
  address: string,
  options?: {
    fill?: string;
    bold?: boolean;
    align?: "left" | "center";
    wrap?: boolean;
    fontSize?: number;
  }
) {
  if (!ws[address]) return;
  ws[address].s = {
    font: {
      name: "Calibri",
      sz: options?.fontSize ?? 11,
      bold: options?.bold ?? false,
      color: { rgb: "000000" }
    },
    fill: { fgColor: { rgb: options?.fill ?? "FFFFFF" } },
    alignment: {
      vertical: "center",
      horizontal: options?.align ?? "left",
      wrapText: options?.wrap ?? true
    },
    border: buildBorder()
  };
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

function buildPremiumCounts() {
  return emptyPremiumCounts();
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
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.label.localeCompare(b!.label)) as ImportedMember["pairs"];

    return {
      id: member.member_slug,
      displayName: member.display_name,
      pairs,
      unmatchedKeys: latestImports.get(member.id) ?? [],
      premiumCounts: buildPremiumCounts()
    };
  });
}

async function fetchCurrentChallenge(client: ReturnType<typeof createClient>): Promise<RawChallengeRecord> {
  const { data, error } = await client
    .from("gym_challenges")
    .select(`
      id,
      name,
      gym_challenge_leaders (
        slot_number,
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
      )
    `)
    .eq("is_current", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("No current challenge found.");
  return data as RawChallengeRecord;
}

function dedupeChallengePairs(challenge: RawChallengeRecord) {
  const pairById = new Map<string, CatalogPair>();
  const typeOrder = new Map<string, number>();
  let nextOrder = 0;

  for (const leader of challenge.gym_challenge_leaders ?? []) {
    const weaknessType = leader.weakness_type;
    if (weaknessType && !typeOrder.has(weaknessType)) {
      typeOrder.set(weaknessType, nextOrder);
      nextOrder += 1;
    }

    for (const source of [leader.gym_challenge_leader_pairs ?? [], leader.gym_challenge_leader_setup_pairs ?? []]) {
      for (const entry of source) {
        const rawPair = Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs;
        const pair = mapCatalogPair(rawPair);
        if (!pair) continue;
        if (!pairById.has(pair.pairId)) {
          pairById.set(pair.pairId, pair);
        }
        if (pair.type && !typeOrder.has(pair.type)) {
          typeOrder.set(pair.type, nextOrder);
          nextOrder += 1;
        }
      }
    }
  }

  for (const entry of challenge.gym_challenge_setup_pairs ?? []) {
    const rawPair = Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs;
    const pair = mapCatalogPair(rawPair);
    if (!pair) continue;
    if (!pairById.has(pair.pairId)) {
      pairById.set(pair.pairId, pair);
    }
    if (pair.type && !typeOrder.has(pair.type)) {
      typeOrder.set(pair.type, nextOrder);
      nextOrder += 1;
    }
  }

  const grouped = new Map<string, CatalogPair[]>();
  for (const pair of pairById.values()) {
    const type = pair.type || "Unknown";
    const current = grouped.get(type) ?? [];
    current.push(pair);
    grouped.set(type, current);
  }

  for (const pairs of grouped.values()) {
    pairs.sort((a, b) => a.label.localeCompare(b.label));
  }

  const orderedTypes = Array.from(grouped.keys()).sort((a, b) => {
    const aOrder = typeOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = typeOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b);
  });

  return {
    orderedTypes,
    grouped
  };
}

function buildWorkbook(challengeName: string, members: ImportedMember[], orderedTypes: string[], grouped: Map<string, CatalogPair[]>) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);
  const merges: XLSX.Range[] = [];

  const memberPairs = new Map(
    members.map((member) => [member.id, new Map(member.pairs.map((pair) => [pair.pairId, pair.syncLevel]))])
  );

  let currentRow = 0;
  const maxPairCount = Math.max(1, ...orderedTypes.map((type) => grouped.get(type)?.length ?? 0));

  ws["!cols"] = [{ wch: 18 }, ...Array.from({ length: maxPairCount }, () => ({ wch: 12 }))];

  orderedTypes.forEach((type, typeIndex) => {
    const pairs = grouped.get(type) ?? [];
    if (!pairs.length) return;

    ws[XLSX.utils.encode_cell({ r: currentRow, c: 0 })] = { t: "s", v: "Type:" };
    styleCell(ws, XLSX.utils.encode_cell({ r: currentRow, c: 0 }), { bold: true, align: "right", fill: "FFFFFF" });

    ws[XLSX.utils.encode_cell({ r: currentRow, c: 1 })] = { t: "s", v: type };
    merges.push(XLSX.utils.decode_range(XLSX.utils.encode_range({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: Math.max(1, pairs.length) } })));
    styleCell(ws, XLSX.utils.encode_cell({ r: currentRow, c: 1 }), {
      bold: true,
      align: "center",
      fill: buildFill(type),
      fontSize: 12
    });

    currentRow += 1;

    ws[XLSX.utils.encode_cell({ r: currentRow, c: 0 })] = { t: "s", v: "Unit" };
    styleCell(ws, XLSX.utils.encode_cell({ r: currentRow, c: 0 }), { bold: true, align: "right", fill: "FFFFFF" });

    pairs.forEach((pair, pairIndex) => {
      const ref = XLSX.utils.encode_cell({ r: currentRow, c: pairIndex + 1 });
      ws[ref] = { t: "s", v: buildShortUnitLabel(pair) };
      styleCell(ws, ref, { bold: true, align: "center", fill: buildFill(type) });
    });

    currentRow += 1;

    members.forEach((member) => {
      const nameRef = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
      ws[nameRef] = { t: "s", v: member.displayName };
      styleCell(ws, nameRef, { bold: true, fill: "FFFFFF" });

      pairs.forEach((pair, pairIndex) => {
        const level = memberPairs.get(member.id)?.get(pair.pairId) ?? 0;
        const ref = XLSX.utils.encode_cell({ r: currentRow, c: pairIndex + 1 });
        ws[ref] = { t: "n", v: level };
        styleCell(ws, ref, {
          align: "center",
          fill: level > 0 ? "FFFFFF" : "F5F5F5"
        });
      });

      currentRow += 1;
    });

    currentRow += 2;

    if (typeIndex === orderedTypes.length - 1) {
      ws["!ref"] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: currentRow - 1, c: maxPairCount }
      });
    }
  });

  ws["!merges"] = merges;
  ws["!rows"] = Array.from({ length: currentRow + 1 }, () => ({ hpt: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, "Move Levels");

  const referenceRows = [["Type", "Short Label", "Full Pair", "Pair ID"]];
  for (const type of orderedTypes) {
    for (const pair of grouped.get(type) ?? []) {
      referenceRows.push([type, buildShortUnitLabel(pair), pair.label, pair.pairId]);
    }
  }
  const referenceWs = XLSX.utils.aoa_to_sheet(referenceRows);
  referenceWs["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 42 }, { wch: 16 }];
  referenceRows.forEach((row, rowIndex) => {
    row.forEach((_value, colIndex) => {
      styleCell(referenceWs, XLSX.utils.encode_cell({ r: rowIndex, c: colIndex }), {
        bold: rowIndex === 0,
        fill: rowIndex === 0 ? "D9EAF7" : "FFFFFF",
        align: colIndex === 0 ? "center" : "left"
      });
    });
  });
  referenceWs["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: referenceRows.length - 1, c: 3 }
  });
  XLSX.utils.book_append_sheet(wb, referenceWs, "Reference");

  return wb;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = await loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const publishableKey = env.VITE_SUPABASE_ANON_KEY ?? "";
  const memberEmail = env.LOCAL_MEMBER_EMAIL ?? "member@gvgplanner.local";
  const memberPassword = env.LOCAL_MEMBER_PASSWORD ?? "GauntletMember123!";

  const client = createClient(supabaseUrl, serviceRoleKey || publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  if (!serviceRoleKey) {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: memberEmail,
      password: memberPassword
    });
    if (signInError) throw signInError;
  }

  const [challenge, members] = await Promise.all([fetchCurrentChallenge(client), fetchImportedMembers(client)]);
  const { orderedTypes, grouped } = dedupeChallengePairs(challenge);
  const workbook = buildWorkbook(challenge.name, members, orderedTypes, grouped);
  const outputPath = args.out ? path.resolve(projectRoot, args.out) : defaultOutputPath(challenge.name);
  await mkdir(path.dirname(outputPath), { recursive: true });
  XLSX.writeFile(workbook, outputPath);
  console.log(`Exported move level workbook to ${outputPath}`);
}

await main();
