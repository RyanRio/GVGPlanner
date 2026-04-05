# GVGPlanner Guide

## Product Goal
Build a collaborative planner for Pokemon Masters EX Pasio Gym Battles, starting with a shared roster planner for gym members.

## Phase 1 Focus
- Import each member's roster from SyncPairsTracker-style exports or a guided manual form.
- Normalize sync pair identity using stable pair ids from SyncPairsTracker data where possible.
- Show overlap, scarcity, and unique ownership across the gym.
- Highlight important subsets such as Master Fairs, Poke Fairs, EX roles, and likely battle specialists.

## Architecture Bias
- Prefer a static frontend with a hosted backend service for auth, storage, and shared state.
- Keep the frontend deployable independently from the backend so it can later be hosted on GitHub Pages, Vercel, or Netlify.
- Model data around gyms, members, roster snapshots, and sync pair ownership records.

## Data Rules
- SyncPairsTracker is the current source of truth for pair metadata and asset naming.
- Avoid storing only display names; keep a canonical pair id plus denormalized labels for UI.
- Design imports so a member can refresh their roster without destroying history.

## UX Rules
- Start with read clarity over battle simulation.
- The first dashboard should answer:
  - Who owns each premium or unusual pair?
  - Which pairs are abundant versus scarce?
  - Which members are best candidates for a given weakness or limitation set?

## Coordination With Other Projects
- `../RyanRio.github.io/` should link to this project after it has a live deploy.
- `../GauntletPlanner/SyncPairsTracker/` should be reused for metadata, icons, and export compatibility when practical.
