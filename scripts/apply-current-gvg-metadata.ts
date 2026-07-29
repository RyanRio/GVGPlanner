import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadDotEnv(filePath: string) {
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(path.join(projectRoot, ".env.seed.local"));
loadDotEnv(path.join(projectRoot, ".env.local"));

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in .env.seed.local for apply-current-gvg-metadata.");
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const leaderMetadata = [
  {
    slotNumber: 1,
    leaderName: "Falkner",
    bossType: "Flying",
    weaknessType: "Ice",
    battle1Effect: "Acuity",
    battle2Effect: "Bedazzle 1",
    battle3Effect: "Discombobulate 9"
  },
  {
    slotNumber: 2,
    leaderName: "Bugsy",
    bossType: "Bug",
    weaknessType: "Electric",
    battle1Effect: "Headstrong",
    battle2Effect: "Enfeeble 1",
    battle3Effect: "Defense Crush 9"
  },
  {
    slotNumber: 3,
    leaderName: "Whitney",
    bossType: "Normal",
    weaknessType: "Fighting",
    battle1Effect: "Unflappable",
    battle2Effect: "Aggravation 1",
    battle3Effect: "Trip Up 9"
  },
  {
    slotNumber: 4,
    leaderName: "Morty",
    bossType: "Ghost",
    weaknessType: "Dark",
    battle1Effect: "Wide Awake",
    battle2Effect: "Piercing Gaze",
    battle3Effect: "Mind Games 9"
  },
  {
    slotNumber: 5,
    leaderName: "Chuck",
    bossType: "Fighting",
    weaknessType: "Fairy",
    battle1Effect: "Flameproof",
    battle2Effect: "Debut: Continuous Fighting Zone",
    battle3Effect: "Fighting Zone: All Stats ↓ Immunity"
  },
  {
    slotNumber: 6,
    leaderName: "Jasmine",
    bossType: "Steel",
    weaknessType: "Fire",
    battle1Effect: "Debut: Endure",
    battle2Effect: "Team Sentry Entry 2",
    battle3Effect: "Defense ↑: Moves ↑ 3"
  },
  {
    slotNumber: 7,
    leaderName: "Pryce",
    bossType: "Ice",
    weaknessType: "Steel",
    battle1Effect: "Antifreeze",
    battle2Effect: "Debut: Continuous Ice Zone",
    battle3Effect: "Ice Zone: Attack Move DR 5"
  },
  {
    slotNumber: 8,
    leaderName: "Clair",
    bossType: "Dragon",
    weaknessType: "Dragon",
    battle1Effect: "Steady Aim",
    battle2Effect: "Ferocious Entry 1",
    battle3Effect: "S-Move: Team Crit Next"
  }
] as const;

const pointRows = [
  [1, 10000, 80000],
  [2, 35000, 360000],
  [3, 80000, 1000000],
  [4, 100000, 1800000],
  [5, 125000, 2800000],
  [6, 150000, 4000000],
  [7, 175000, 5400000],
  [8, 200000, 7000000],
  [9, 225000, 8800000],
  [10, 260000, 10880000],
  [11, 295000, 13240000],
  [12, 330000, 15880000],
  [13, 370000, 18840000],
  [14, 410000, 22120000],
  [15, 450000, 25720000],
  [16, 450000, 29320000],
  [17, 450000, 32920000],
  [18, 450000, 36520000],
  [19, 450000, 40120000],
  [20, 450000, 43720000],
  [21, 450000, 47320000],
  [22, 450000, 50920000],
  [23, 450000, 54520000],
  [24, 450000, 58120000],
  [25, 450000, 61720000],
  [26, 450000, 65320000],
  [27, 450000, 68920000],
  [28, 450000, 72520000],
  [29, 450000, 76120000],
  [30, 450000, 79720000]
] as const;

const statRows = [
  [1, 500500, 960, 83, 67, 250250, 768, 83, 204],
  [2, 3465000, 1152, 83, 67, 1732500, 960, 83, 204],
  [3, 5544000, 1536, 83, 67, 2772000, 1248, 83, 204],
  [4, 7983360, 1920, 83, 67, 3991680, 1920, 83, 204],
  [5, 10866240, 2304, 83, 67, 5433120, 2304, 83, 204],
  [6, 14192640, 2304, 83, 67, 7096320, 2304, 83, 204],
  [7, 17962560, 2304, 83, 67, 8981280, 2304, 83, 204],
  [8, 22176000, 2304, 83, 67, 11088000, 2304, 83, 204],
  [9, 26832960, 2304, 83, 67, 13416480, 2304, 83, 204],
  [10, 31933440, 2880, 83, 67, 15966720, 2880, 83, 204],
  [11, 37477440, 2880, 83, 67, 18738720, 2880, 83, 204],
  [12, 43464960, 2880, 83, 67, 21732480, 2880, 83, 204],
  [13, 49896000, 3456, 83, 67, 24948000, 3456, 83, 204],
  [14, 56770560, 3456, 83, 67, 28385280, 3456, 83, 204],
  [15, 64088640, 3456, 83, 67, 32044320, 3456, 83, 204]
] as const;

const statByRound = new Map(statRows.map((row) => [row[0], row]));
const finalStatRow = statRows[statRows.length - 1];

const roundStats = pointRows.map(([roundNumber, points, cumulativePoints]) => {
  const statRow = statByRound.get(roundNumber) ?? finalStatRow;
  return {
    challenge_id: "",
    round_number: roundNumber,
    points,
    cumulative_points: cumulativePoints,
    middle_hp: statRow[1],
    middle_offenses: statRow[2],
    middle_defenses: statRow[3],
    middle_speed: statRow[4],
    side_hp: statRow[5],
    side_offenses: statRow[6],
    side_defenses: statRow[7],
    side_speed: statRow[8]
  };
});

async function main() {
  const { data: challenge, error: challengeError } = await client
    .from("gym_challenges")
    .select("id, name")
    .eq("is_current", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (challengeError) throw challengeError;
  if (!challenge) throw new Error("No current challenge found. Set a current challenge first.");

  const { error: notesError } = await client
    .from("gym_challenges")
    .update({ notes: "Only Effective" })
    .eq("id", challenge.id);

  if (notesError) throw notesError;

  for (const leader of leaderMetadata) {
    const { error: leaderError } = await client
      .from("gym_challenge_leaders")
      .update({
        leader_name: leader.leaderName,
        boss_type: leader.bossType,
        weakness_type: leader.weaknessType,
        battle_1_effect: leader.battle1Effect,
        battle_2_effect: leader.battle2Effect,
        battle_3_effect: leader.battle3Effect
      })
      .eq("challenge_id", challenge.id)
      .eq("slot_number", leader.slotNumber);

    if (leaderError) throw leaderError;
  }

  const { error: deleteStatsError } = await client
    .from("gym_challenge_round_stats")
    .delete()
    .eq("challenge_id", challenge.id);

  if (deleteStatsError) throw deleteStatsError;

  const { error: insertStatsError } = await client.from("gym_challenge_round_stats").insert(
    roundStats.map((round) => ({
      ...round,
      challenge_id: challenge.id
    }))
  );

  if (insertStatsError) throw insertStatsError;

  console.log(`Applied current GVG metadata to challenge "${challenge.name}" (${challenge.id}).`);
}

await main();
