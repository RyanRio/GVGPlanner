import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.resolve(projectRoot, ".env.local");
const SYNC_LEVELS = [1, 2, 3, 4, 5, 5, 5, 5, 5, 5];

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
    const envText = await readFile(envPath, "utf8");
    return parseDotEnv(envText);
  } catch {
    return {};
  }
}

async function walkJsonFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];
  const ignoredDirs = new Set(["node_modules", ".git", "dist", "supabase"]);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }
      files.push(...(await walkJsonFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function normalizeMemberSlug(displayName) {
  return displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function fetchCatalog(client) {
  const { data, error } = await client
    .from("sync_pairs")
    .select("id, display_label, premium_category");

  if (error) throw error;

  return new Map(
    data.map((pair) => [
      pair.id,
      {
        pairId: pair.id,
        label: pair.display_label,
        premiumCategory: pair.premium_category
      }
    ])
  );
}

function parseRoster(displayName, payload, catalog) {
  const importedPairs = [];
  const unmatchedKeys = [];

  for (const [rawKey, rawValue] of Object.entries(payload)) {
    const pair = catalog.get(rawKey);
    if (!pair) {
      unmatchedKeys.push(rawKey);
      continue;
    }

    const values = String(rawValue).split("|");
    const syncLevelIndex = Number.parseInt(values[0] ?? "0", 10);
    const exState = Number.parseInt(values[1] ?? "0", 10);

    importedPairs.push({
      pair_id: pair.pairId,
      sync_level: Number.isNaN(syncLevelIndex) ? 1 : SYNC_LEVELS[syncLevelIndex] ?? 1,
      is_ex: Number.isNaN(exState) ? false : exState > 0,
      raw_value: String(rawValue)
    });
  }

  return {
    memberSlug: normalizeMemberSlug(displayName),
    displayName,
    importedPairs,
    unmatchedKeys: unmatchedKeys.sort((a, b) => a.localeCompare(b))
  };
}

function isSyncPairsTrackerExport(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const entries = Object.entries(payload);
  if (!entries.length) return false;

  return entries.every(([key, value]) => {
    if (typeof key !== "string" || typeof value !== "string") return false;
    return /^\d+\|/.test(key) && value.includes("|");
  });
}

async function main() {
  const env = await loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const publishableKey = env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
  const memberEmail = env.LOCAL_MEMBER_EMAIL ?? "member@gvgplanner.local";
  const memberPassword = env.LOCAL_MEMBER_PASSWORD ?? "GauntletMember123!";
  const inputDir = path.resolve(process.argv[2] ?? path.resolve(projectRoot, "..", "GauntletPlanner"));

  const client = createClient(supabaseUrl, publishableKey);

  const { error: signInError } = await client.auth.signInWithPassword({
    email: memberEmail,
    password: memberPassword
  });

  if (signInError) throw signInError;

  const catalog = await fetchCatalog(client);
  const files = await walkJsonFiles(inputDir);

  if (!files.length) {
    console.log(`No JSON files found in ${inputDir}`);
    return;
  }

  let importedCount = 0;

  for (const filePath of files) {
    const basename = path.basename(filePath, path.extname(filePath));
    const text = await readFile(filePath, "utf8");
    const payload = JSON.parse(text);
    if (!isSyncPairsTrackerExport(payload)) {
      console.log(`Skipped ${filePath} (not a SyncPairsTracker export)`);
      continue;
    }
    const roster = parseRoster(basename, payload, catalog);

    const { error } = await client.rpc("import_member_roster", {
      p_member_slug: roster.memberSlug,
      p_display_name: roster.displayName,
      p_raw_payload: payload,
      p_imported_pairs: roster.importedPairs,
      p_unmatched_keys: roster.unmatchedKeys
    });

    if (error) {
      console.error(`Failed to import ${filePath}: ${error.message}`);
      continue;
    }

    importedCount += 1;
    console.log(
      `Imported ${roster.displayName} from ${filePath} (${roster.importedPairs.length} matched, ${roster.unmatchedKeys.length} unmatched)`
    );
  }

  console.log(`Finished importing ${importedCount} roster file(s).`);
}

await main();
