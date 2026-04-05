import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SYNCPAIRS } from "../../GauntletPlanner/SyncPairsTracker/js/syncpairs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = resolve(__dirname, "../supabase/seeds/sync_pairs_catalog.sql");
const seedTemplatePath = resolve(__dirname, "../supabase/seed.template.sql");
const seedOutputPath = resolve(__dirname, "../supabase/seed.sql");

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function sqlText(value) {
  if (value === null || value === undefined || value === "") {
    return "null";
  }
  return `'${escapeSql(String(value))}'`;
}

function sqlJson(value) {
  return `'${escapeSql(JSON.stringify(value ?? []))}'::jsonb`;
}

function normalizeRoleCategory(roleLabel) {
  const lower = (roleLabel || "").toLowerCase();
  if (lower.startsWith("strike")) return "strike";
  if (lower.startsWith("tech")) return "tech";
  if (lower.startsWith("support")) return "support";
  if (lower.startsWith("sprint")) return "sprint";
  if (lower.startsWith("field")) return "field";
  if (lower.startsWith("multi")) return "multi";
  throw new Error(`Unknown role label: ${roleLabel}`);
}

function normalizePremiumCategory(acquisition) {
  if (!acquisition) return "general";
  if (acquisition.includes("Arc Suit Fair")) return "arc_fair";
  if (acquisition.includes("Master Fair")) return "master_fair";
  if (acquisition.includes("Poké Fair")) return "poke_fair";
  if (acquisition.includes("Seasonal")) return "seasonal";
  if (acquisition.includes("Variety")) return "variety";
  if (acquisition.includes("Special Costume")) return "special_costume";
  return "general";
}

function buildDisplayLabel(pair) {
  const alt = pair.trainerAlt ? ` (${pair.trainerAlt})` : "";
  const form = Array.isArray(pair.pokemonForm) && pair.pokemonForm.length ? ` ${pair.pokemonForm.join(" ")}` : "";
  return `${pair.trainerName}${alt} & ${pair.pokemonName}${form}`;
}

function pairId(pair) {
  return `${pair.dexNumber}|${pair.pokemonNumber}`;
}

const header = [
  "insert into public.sync_pairs (",
  "  id,",
  "  display_label,",
  "  trainer_name,",
  "  trainer_alt,",
  "  pokemon_name,",
  "  pokemon_form,",
  "  role_category,",
  "  role_label,",
  "  ex_role_category,",
  "  ex_role_label,",
  "  star_rarity,",
  "  premium_category,",
  "  acquisition,",
  "  type,",
  "  weakness,",
  "  region,",
  "  release_date,",
  "  primary_image_path,",
  "  image_paths,",
  "  themes,",
  "  tags,",
  "  metadata",
  ")",
  "values"
];

const values = SYNCPAIRS.map((pair) => {
  const form = Array.isArray(pair.pokemonForm) && pair.pokemonForm.length ? pair.pokemonForm.join(" ") : null;
  const images = Array.isArray(pair.images) ? pair.images : [];
  const themes = Array.isArray(pair.themes) ? pair.themes : [];
  const tags = Array.isArray(pair.tags) ? pair.tags : [];
  const metadata = {
    pokemon_gender: pair.pokemonGender ?? null,
    sync_pair_ex_pose: pair.syncPairEXPose ?? null,
    sync_pair_ex_color: pair.syncPairEXColor ?? null,
    sync_pair_superawakening: pair.syncPairSuperawakening ?? null,
    sync_pair_icon: pair.syncPairIcon ?? null,
    internal_trainer_name: pair.internalTrainerName ?? null,
    internal_pokemon_name: pair.internalPokemonName ?? null
  };

  return [
    "  (",
    `    ${sqlText(pairId(pair))},`,
    `    ${sqlText(buildDisplayLabel(pair))},`,
    `    ${sqlText(pair.trainerName)},`,
    `    ${sqlText(pair.trainerAlt || null)},`,
    `    ${sqlText(pair.pokemonName)},`,
    `    ${sqlText(form)},`,
    `    ${sqlText(normalizeRoleCategory(pair.syncPairRole))}::public.pair_role,`,
    `    ${sqlText(pair.syncPairRole)},`,
    `    ${pair.syncPairRoleEX ? `${sqlText(normalizeRoleCategory(pair.syncPairRoleEX))}::public.pair_role` : "null"},`,
    `    ${sqlText(pair.syncPairRoleEX || null)},`,
    `    ${pair.syncPairRarity ? Number.parseInt(pair.syncPairRarity, 10) : "null"},`,
    `    ${sqlText(normalizePremiumCategory(pair.syncPairAcquisition))}::public.pair_premium_category,`,
    `    ${sqlText(pair.syncPairAcquisition)},`,
    `    ${sqlText(pair.pokemonType)},`,
    `    ${sqlText(pair.pokemonWeak || null)},`,
    `    ${sqlText(pair.syncPairRegion)},`,
    `    ${sqlText(pair.releaseDate || null)}::date,`,
    `    ${sqlText(images[0] || null)},`,
    `    ${sqlJson(images)},`,
    `    ${sqlJson(themes)},`,
    `    ${sqlJson(tags)},`,
    `    ${sqlJson(metadata)}`,
    "  )"
  ].join("\n");
});

const footer = [
  "on conflict (id) do update",
  "set",
  "  display_label = excluded.display_label,",
  "  trainer_name = excluded.trainer_name,",
  "  trainer_alt = excluded.trainer_alt,",
  "  pokemon_name = excluded.pokemon_name,",
  "  pokemon_form = excluded.pokemon_form,",
  "  role_category = excluded.role_category,",
  "  role_label = excluded.role_label,",
  "  ex_role_category = excluded.ex_role_category,",
  "  ex_role_label = excluded.ex_role_label,",
  "  star_rarity = excluded.star_rarity,",
  "  premium_category = excluded.premium_category,",
  "  acquisition = excluded.acquisition,",
  "  type = excluded.type,",
  "  weakness = excluded.weakness,",
  "  region = excluded.region,",
  "  release_date = excluded.release_date,",
  "  primary_image_path = excluded.primary_image_path,",
  "  image_paths = excluded.image_paths,",
  "  themes = excluded.themes,",
  "  tags = excluded.tags,",
  "  metadata = excluded.metadata,",
  "  updated_at = now();",
  ""
];

const sql = `${header.join("\n")}\n${values.join(",\n")}\n${footer.join("\n")}`;
const template = await readFile(seedTemplatePath, "utf8");
const seedSql = `${template.trim()}\n\n${sql}`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, sql, "utf8");
await writeFile(seedOutputPath, seedSql, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`Wrote ${seedOutputPath}`);
