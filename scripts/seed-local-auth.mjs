import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadDotEnv(filePath) {
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

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is required. Put it in .env.seed.local or your shell environment before running seed-local-auth."
  );
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function waitForAuthReady() {
  let lastError = null;

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const { error } = await client.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (!error) {
      return;
    }

    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw lastError ?? new Error("Auth service did not become ready.");
}

async function ensureUser({ email, password, displayName }) {
  const { data: listData, error: listError } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (listError) throw listError;

  const existing = listData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    const { data: updatedData, error: updateError } = await client.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName }
    });

    if (updateError) throw updateError;
    return updatedData.user;
  }

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName }
  });

  if (error) throw error;
  return data.user;
}

async function main() {
  await waitForAuthReady();

  const adminUser = await ensureUser({
    email: "admin@gvgplanner.local",
    password: "GauntletAdmin123!",
    displayName: "GVG Admin"
  });

  const memberUser = await ensureUser({
    email: "member@gvgplanner.local",
    password: "GauntletMember123!",
    displayName: "GVG Members"
  });

  const { data: profileData, error: profileError } = await client
    .from("profiles")
    .upsert(
      [
        { id: adminUser.id, display_name: "GVG Admin", app_role: "admin" },
        { id: memberUser.id, display_name: "GVG Members", app_role: "member" }
      ],
      { onConflict: "id" }
    )
    .select("id");

  if (profileError) throw profileError;
  if (!profileData?.length) throw new Error("Failed to seed profiles.");

  const { data: gymData, error: gymError } = await client
    .from("gyms")
    .upsert(
      {
        slug: "gauntlet-gym",
        name: "Gauntlet Gym",
        created_by: adminUser.id
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (gymError) throw gymError;

  const { error: gymMembersError } = await client.from("gym_members").upsert(
    [
      { gym_id: gymData.id, profile_id: adminUser.id, role: "admin" },
      { gym_id: gymData.id, profile_id: memberUser.id, role: "member" }
    ],
    { onConflict: "gym_id,profile_id" }
  );

  if (gymMembersError) throw gymMembersError;

  console.log("Seeded local auth users and gym memberships.");
}

await main();
