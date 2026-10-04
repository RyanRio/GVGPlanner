# GVGPlanner

Collaborative planning tool for Pokemon Masters EX Pasio Gym Battles.

## Initial scope
- Collect roster submissions from gym members.
- Normalize submitted sync pairs against SyncPairsTracker metadata.
- Show overlap across the gym.
- Highlight unique ownership, especially premium sync pairs such as Master Fairs and Poke Fairs.
- Help assign members to high-value gym battles based on roster scarcity and matchup fit.

## Recommended architecture
- Frontend: static web app
- Backend: hosted database/auth service for shared roster data
- Portfolio site: add a link from `RyanRio.github.io`, but keep the app itself separate

## Local development
1. Install Docker Desktop.
2. Install the Supabase CLI.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run seed:catalog` to regenerate the SQL catalog seed from SyncPairsTracker data.
5. Start local Supabase with `npx supabase start`.
6. Reset the local database with `npx supabase db reset --local --yes`.
7. Seed the shared auth users and gym membership with `npm run seed:auth-local`.
8. Start the frontend with `npm run dev`.

The local frontend expects the Supabase API URL and publishable key in `.env.local`.

## Import Gym Battle datamines

### Keep Excel and browser rosters in sync

Excel exporters read `member_current_roster` in Supabase. The static roster browser reads JSON files in `mastersofdiscord` directly, so rebuilding the browser does not refresh database ownership. When new pairs or roster files arrive, refresh the catalog **before** importing rosters:

```sh
npm run sync:catalog-local
npm run import:rosters-local
npm run export:challenge-move-levels-local
npm run browser:data
```

The roster importer defaults to the same `mastersofdiscord` folder as the browser; pass another directory as a positional argument if needed. Catalog updates alone do not recover pairs previously recorded as unmatched. Reimporting preserves import history and refreshes ownership without altering challenge pair selections.

In Challenge Admin, each leader has separate **Physical damage**, **Special damage**, and **Sub DPS** important-pair inputs. Sub DPS is for pairs providing important effects such as EX zones without being the main damage dealer. Adding a pair to Sub DPS moves it out of the primary damage lists; adding it back to a damage list reclassifies it. Add a mixed attacker to both damage lists; ownership and recommendation scoring still count it once. Existing selections appear as **Unclassified** with buttons to classify them. Categories are saved per leader, displayed in the planner and standard challenge workbook, and preserved by datamine reimports. Setup-pair inputs are unchanged. Recommendations remain overall leader coverage; categories do not automatically filter recommendations by the selected round.

For an existing database, apply `npx supabase migration up --local` before using these inputs (migrations `20260930020000_important_pair_damage_categories.sql` and `20260930030000_sub_dps_important_pairs.sql`). Category tests run with `npx tsx --test scripts/lib/important-pairs.test.ts`; `scripts/lib/important-pairs.integration.sql` verifies database saves and rollback against local Supabase in a rolled-back transaction.

The `vendor/pokemas-datamine` submodule pins [absolutelypm's game datamines](https://github.com/absolutelypm/pokemas-datamine).
Use the helper instead of a recursive checkout on Windows: upstream has filenames containing colons and pipes. The helper configures a sparse checkout containing only Gym Battle text files.

```sh
npm run datamine:sync
# Explicitly fetch a newer upstream revision when needed:
npm run datamine:sync -- --latest
npx supabase migration up --local
npm run import:gvg-local
npm run import:gvg-local -- --apply
```

The default source is `2.73/🥊 Pasio Gym Battle No. 4.txt`. Override it with `--source "2.74/…txt"`. Commit the updated submodule pointer with any reviewed source update. Imports read the pinned Git blob, so working-tree edits cannot silently change source provenance.

Without `--apply`, this only writes `exports/gvg-datamine-preview.json`; no credentials or database connection are needed. `--output` changes that path. Applying uses the existing `.env.seed.local` / `.env.local` settings and requires `SUPABASE_SERVICE_ROLE_KEY`. Supply `--gym-id UUID` when multiple gyms exist. `apply:gvg-meta-local` now invokes this same importer rather than overwriting the current challenge with hard-coded Johto metadata.

Imports create a separate, initially inactive challenge. Select it as current in the app when ready. Reimporting the same source path for the same gym updates it in one database transaction, retaining leader IDs, curated notes, pair selections, and assignments. The previous current challenge is preserved.

The planner's eight leaders, three battle effects, rotating modifier labels, and 30 round-stat rows are populated. The source's final “and onward” tier supplies stats/points for rounds 15–30; cumulative points count all eight leaders. The `gym_challenges.datamine` JSON also retains all 15 source tiers, per-leader rules, separate center/side passives and adjustments, ticket effects, schedule strings, original text (including rewards), source URL, commit, and SHA-256. Schedule strings retain the source's day/month/year notation without assuming a timezone.

The current UI still displays its existing global modifier cycle. Detailed per-tier restrictions, schedules, ticket effects, and rewards are stored in the database and preview, but do not yet have dedicated UI. For No. 4, super-effective-only restrictions start at Extra Battle 4; the imported notes flag this.

Validation rejects incomplete files and stats that the current shared-round schema cannot represent. Run `npm run test:gvg-datamine` after initializing the submodule. The database RPC is executable only by the service role; frontend users retain their existing gym-scoped read access.

## Local auth users
- Member login: `member@gvgplanner.local` / `GauntletMember123!`
- Admin login: `admin@gvgplanner.local` / `GauntletAdmin123!`

## Bulk local roster import
- Run `npm run import:rosters-local -- "<directory>"` to recursively import every `.json` roster file in a folder.
- The member name is taken from the filename stem.
- Example: `Ryan.json` imports as member `Ryan`.
- If you omit the directory, it defaults to `../GauntletPlanner`.

## Current architecture
- `sync_pairs` is the database-owned catalog and is seeded from SyncPairsTracker data.
- `gym_roster_members` stores the stable list of roster owners for the single gym.
- `roster_imports` stores import provenance and unmatched keys.
- `member_current_roster` stores the normalized latest roster state used by the UI.

## Why not GitHub Pages alone?
GitHub Pages can host the frontend, but it does not provide shared writable storage for gym members to submit or update roster data. A collaborative planner needs a backend or managed data service.

## Likely next milestones
1. Define the roster import format and canonical sync pair ids.
2. Build a member roster upload flow.
3. Build overlap and uniqueness views.
4. Add filters for type, role, region, fair status, and battle-relevant tags.
5. Add gym battle assignment views once roster coverage is solid.
