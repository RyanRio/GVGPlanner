import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { SYNCPAIRS } from "../../GauntletPlanner/SyncPairsTracker/js/syncpairs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const SYNC_LEVELS = [1, 2, 3, 4, 5, 5, 5, 5, 5, 5];

function parseArgs(argv) {
  const options = {
    input: path.resolve(projectRoot, "mastersofdiscord"),
    out: path.resolve(projectRoot, "gym-roster-browser", "public", "data", "rosters.json")
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" || arg === "-i") {
      options.input = path.resolve(projectRoot, argv[index + 1] ?? options.input);
      index += 1;
      continue;
    }
    if (arg === "--out" || arg === "-o") {
      options.out = path.resolve(projectRoot, argv[index + 1] ?? options.out);
      index += 1;
    }
  }

  return options;
}

function parseDotEnv(text) {
  const env = {};
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
    return parseDotEnv(await readFile(path.resolve(projectRoot, ".env.local"), "utf8"));
  } catch {
    return {};
  }
}

async function walkJsonFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];
  const ignoredDirs = new Set(["node_modules", ".git", "dist", "supabase", "exports"]);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      files.push(...(await walkJsonFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function isSyncPairsTrackerExport(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const entries = Object.entries(payload);
  if (!entries.length) return false;

  return entries.every(([key, value]) => typeof key === "string" && typeof value === "string" && /^\d+\|/.test(key));
}

function normalizeRoleCategory(roleLabel) {
  const lower = (roleLabel || "").toLowerCase();
  if (lower.startsWith("strike")) return "strike";
  if (lower.startsWith("tech")) return "tech";
  if (lower.startsWith("support")) return "support";
  if (lower.startsWith("sprint")) return "sprint";
  if (lower.startsWith("field")) return "field";
  if (lower.startsWith("multi")) return "multi";
  return "unknown";
}

function normalizeAcquisitionCategory(acquisition) {
  if (!acquisition) return "general_pool";
  if (acquisition.includes("Arc Suit Fair")) return "arc_suit_fair";
  if (acquisition.includes("EX Master Fair")) return "ex_master_fair";
  if (acquisition.includes("Master Fair")) return "master_fair";
  if (acquisition.includes("EX Fair")) return "ex_fair";
  if (acquisition.includes("Pok\u00e9 Fair") || acquisition.includes("Poke Fair")) return "poke_fair";
  if (acquisition.includes("Seasonal")) return "seasonal";
  if (acquisition.includes("Special Costume")) return "special_costume";
  if (acquisition.includes("Variety")) return "variety";
  if (acquisition.includes("Spotlight")) return "spotlight";
  if (acquisition.includes("Trainer Lodge")) return "trainer_lodge";
  if (acquisition.includes("Battle Points")) return "battle_points";
  if (acquisition.includes("Training Ticket")) return "ticket_exchange";
  if (acquisition.includes("Gym Scout")) return "gym_scout";
  if (acquisition.includes("Event Reward")) return "event_reward";
  if (acquisition.includes("Main Story")) return "main_story";
  if (acquisition.includes("Legendary Adventures")) return "legendary_adventures";
  if (acquisition.includes("General Pool")) return "general_pool";
  return "general_pool";
}

function buildDisplayLabel(pair) {
  const alt = pair.trainerAlt ? ` (${pair.trainerAlt})` : "";
  const form = Array.isArray(pair.pokemonForm) && pair.pokemonForm.length ? ` ${pair.pokemonForm.join(" ")}` : "";
  return `${pair.trainerName}${alt} & ${pair.pokemonName}${form}`;
}

function buildCatalog() {
  const byId = new Map();

  for (const pair of SYNCPAIRS) {
    const pairId = `${pair.dexNumber}|${pair.pokemonNumber}`;
    const pokemonForm = Array.isArray(pair.pokemonForm) ? pair.pokemonForm.join(" ") : "";
    const imagePaths = Array.isArray(pair.images) ? pair.images : [];
    const normalImage = imagePaths.find((imagePath) => !imagePath.includes("_EX")) ?? imagePaths[0] ?? "";
    const exImage = imagePaths.find((imagePath) => imagePath.includes("_EX")) ?? "";
    byId.set(pairId, {
      pairId,
      label: buildDisplayLabel(pair),
      trainerName: pair.trainerName,
      trainerAlt: pair.trainerAlt ?? "",
      pokemonName: pair.pokemonName,
      pokemonForm,
      primaryImagePath: normalImage ? `https://pomasters.github.io/SyncPairsTracker/${normalImage}` : "",
      exImagePath: exImage ? `https://pomasters.github.io/SyncPairsTracker/${exImage}` : "",
      roleCategory: normalizeRoleCategory(pair.syncPairRole),
      roleLabel: pair.syncPairRole ?? "",
      exRoleCategory: pair.syncPairRoleEX ? normalizeRoleCategory(pair.syncPairRoleEX) : "",
      exRoleLabel: pair.syncPairRoleEX ?? "",
      type: pair.pokemonType ?? "",
      region: pair.syncPairRegion ?? "",
      acquisition: pair.syncPairAcquisition ?? "",
      acquisitionCategory: normalizeAcquisitionCategory(pair.syncPairAcquisition),
      imagePaths
    });
  }

  return byId;
}

function parseRoster(displayName, payload, catalog) {
  const unmatchedKeys = [];
  const pairs = [];

  for (const [pairId, rawValue] of Object.entries(payload)) {
    const catalogPair = catalog.get(pairId);
    if (!catalogPair) {
      unmatchedKeys.push(pairId);
      continue;
    }

    const values = String(rawValue).split("|");
    const syncLevelIndex = Number.parseInt(values[0] ?? "0", 10);
    const imageIndex = Number.parseInt(values[1] ?? "0", 10);

    pairs.push({
      ...catalogPair,
      syncLevel: Number.isNaN(syncLevelIndex) ? 1 : SYNC_LEVELS[syncLevelIndex] ?? 1,
      isEx:
        !Number.isNaN(imageIndex) &&
        imageIndex >= 0 &&
        typeof catalogPair.imagePaths?.[imageIndex] === "string" &&
        catalogPair.imagePaths[imageIndex].includes("_EX"),
      rawValue: String(rawValue)
    });
  }

  pairs.sort((a, b) => a.label.localeCompare(b.label));

  return {
    id: displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    displayName,
    pairCount: pairs.length,
    unmatchedKeys: unmatchedKeys.sort((a, b) => a.localeCompare(b)),
    pairs
  };
}

async function fetchCurrentChallengeSnapshot() {
  try {
    const env = await loadEnv();
    const client = createClient(
      env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321",
      env.VITE_SUPABASE_ANON_KEY ?? ""
    );
    const email = env.LOCAL_MEMBER_EMAIL ?? "member@gvgplanner.local";
    const password = env.LOCAL_MEMBER_PASSWORD ?? "GauntletMember123!";
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    const { data, error } = await client
      .from("gym_challenges")
      .select(`
        id,
        name,
        notes,
        gym_challenge_modifiers (
          modifier_1,
          modifier_2,
          modifier_3
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
        gym_challenge_leaders (
          slot_number,
          leader_name,
          boss_type,
          weakness_type,
          battle_1_effect,
          battle_2_effect,
          battle_3_effect,
          gym_challenge_leader_pairs (
            sync_pairs ( id, display_label )
          ),
          gym_challenge_leader_setup_pairs (
            sync_pairs ( id, display_label )
          )
        ),
        gym_challenge_setup_pairs (
          setup_category,
          sync_pairs ( id, display_label )
        )
      `)
      .eq("is_current", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const significantPairs = [];
    const seen = new Set();
    const pushPair = (pair, category, leaderName = "") => {
      if (!pair?.id || seen.has(`${category}:${pair.id}:${leaderName}`)) return;
      seen.add(`${category}:${pair.id}:${leaderName}`);
      significantPairs.push({
        pairId: pair.id,
        label: pair.display_label,
        category,
        leaderName
      });
    };

    for (const leader of data.gym_challenge_leaders ?? []) {
      for (const entry of leader.gym_challenge_leader_pairs ?? []) {
        const pair = Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs;
        pushPair(pair, "important", leader.leader_name);
      }
      for (const entry of leader.gym_challenge_leader_setup_pairs ?? []) {
        const pair = Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs;
        pushPair(pair, "rebuff", leader.leader_name);
      }
    }

    for (const entry of data.gym_challenge_setup_pairs ?? []) {
      const pair = Array.isArray(entry.sync_pairs) ? entry.sync_pairs[0] : entry.sync_pairs;
      pushPair(pair, entry.setup_category ?? "setup");
    }

    const significantPairIds = Array.from(new Set(significantPairs.map((pair) => pair.pairId))).sort((a, b) => a.localeCompare(b));
    const modifiers = Array.isArray(data.gym_challenge_modifiers)
      ? data.gym_challenge_modifiers[0]
      : data.gym_challenge_modifiers;

    return {
      id: data.id,
      name: data.name,
      notes: data.notes ?? "",
      modifiers: {
        modifier1: modifiers?.modifier_1 ?? "",
        modifier2: modifiers?.modifier_2 ?? "",
        modifier3: modifiers?.modifier_3 ?? ""
      },
      roundStats: (data.gym_challenge_round_stats ?? [])
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
      leaders: (data.gym_challenge_leaders ?? [])
        .map((leader) => ({
          slotNumber: leader.slot_number,
          leaderName: leader.leader_name,
          bossType: leader.boss_type ?? "",
          weaknessType: leader.weakness_type,
          battle1Effect: leader.battle_1_effect ?? "",
          battle2Effect: leader.battle_2_effect ?? "",
          battle3Effect: leader.battle_3_effect ?? ""
        }))
        .sort((a, b) => a.slotNumber - b.slotNumber),
      significantPairIds,
      significantPairs
    };
  } catch (error) {
    console.warn("Could not load current challenge snapshot for static browser:", error?.message ?? error);
    return null;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const catalog = buildCatalog();
  const files = await walkJsonFiles(options.input);
  const currentChallenge = await fetchCurrentChallengeSnapshot();

  const members = [];
  for (const filePath of files) {
    const basename = path.basename(filePath, path.extname(filePath));
    const text = await readFile(filePath, "utf8");
    const payload = JSON.parse(text);
    if (!isSyncPairsTrackerExport(payload)) continue;
    members.push(parseRoster(basename, payload, catalog));
  }

  members.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const snapshot = {
    generatedAt: new Date().toISOString(),
    gymName: path.basename(options.input),
    memberCount: members.length,
    pairCount: members.reduce((sum, member) => sum + member.pairCount, 0),
    currentChallenge,
    members
  };

  await mkdir(path.dirname(options.out), { recursive: true });
  await writeFile(options.out, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Wrote static roster snapshot to ${options.out}`);
}

await main();
