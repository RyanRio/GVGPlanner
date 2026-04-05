import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const projectRoot = resolve(__dirname, "..");
const seedScript = resolve(projectRoot, "scripts", "generate-sync-pairs-seed.mjs");
const seedSql = resolve(projectRoot, "supabase", "seed.sql");

execFileSync("node", [seedScript], {
  cwd: projectRoot,
  stdio: "inherit"
});

const seedSqlText = await readFile(seedSql, "utf8");

execFileSync(
  "docker",
  [
    "exec",
    "-i",
    "supabase_db_gvgplanner",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-f",
    "-"
  ],
  {
    cwd: projectRoot,
    stdio: ["pipe", "inherit", "inherit"],
    input: seedSqlText
  }
);

console.log("Synced local sync_pairs catalog from SyncPairsTracker.");
