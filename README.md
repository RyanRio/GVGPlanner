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
