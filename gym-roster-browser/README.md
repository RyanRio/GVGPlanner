# GVG Roster Browser

Static companion tool for browsing a gym's SyncPairsTracker exports without Supabase.

## Local usage
1. `npm install`
2. `npm run build:data`
3. `npm run dev`

The static snapshot is generated from `../mastersofdiscord` by default and written to `public/data/rosters.json`.

## Deploy
- `npm run deploy`

This publishes the app's `dist/` folder to the `gh-pages` branch, following the same lightweight pattern used by `GauntletPlanner`.
