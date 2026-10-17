# French Life MVP

A React + TypeScript MVP for testing the **real-human language simulation** concept.

## What is included

- Learner view
- Speaker view
- Synchronized role-specific mission briefings
- Full Café A1 mission
- Manual stage progression
- Hints
- Sold-out event
- Price discovery
- Purchase decision
- Mission result
- Responsive desktop/mobile UI
- Mission content separated into `src/data/cafeMission.ts` for easy editing

This MVP deliberately does **not** include login, AI, speech recognition, payment, matchmaking, or internal video. Supabase Realtime synchronizes the briefing and shared game state between players.

The intended test is:

1. Learner and native partner join the same Google Meet.
2. Each opens this app.
3. Learner chooses **Learner** and marks themselves ready in the briefing.
4. The claimed Speaker chooses **Speaker** and starts the mission.
5. They play the Café mission while speaking on Meet.

Both clients must be configured to use the same Supabase project. Briefing readiness, mission start, stage changes, and restart are stored in the shared Supabase session.

## Run it

You need Node.js 20+.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your local `.env` file. Do not put a Supabase `service_role` key in the frontend.

For an existing Supabase project, run [`supabase/migrations/20261017120000_mission_briefing.sql`](./supabase/migrations/20261017120000_mission_briefing.sql) in the Supabase SQL Editor before using the updated app. For a new database, [`supabase/schema.sql`](./supabase/schema.sql) contains the full schema.

### Windows

Double-click:

`START_WINDOWS.bat`

Or open a terminal in this folder:

```bash
npm install
npm run dev
```

Then open the local address Vite shows, usually:

`http://localhost:5173`

### macOS / Linux

```bash
npm install
npm run dev
```

## Build production version

```bash
npm run build
```

The deployable files will be created in `dist/`.

## Where to change things

### Mission content
Edit:

`src/data/cafeMission.ts`

This is where the mission context, goal, budget, prices, and hint phrases live.

### Learner flow
Edit:

`src/components/LearnerGame.tsx`

The component renders the learner content for the current shared game state.

### Native flow
Edit:

`src/components/NativeGame.tsx`

The Speaker flow is data-driven by the shared game state and mission content.

### Visual design
Edit:

`src/styles/global.css`

Main design tokens are at the top:

- `--ink`
- `--muted`
- `--blue`
- `--blue-soft`
- `--surface`
- `--line`

## Project structure

```text
src/
├─ components/
│  ├─ LearnerGame.tsx
│  ├─ MissionBriefing.tsx
│  ├─ NativeGame.tsx
│  ├─ RolePicker.tsx
├─ data/
│  └─ cafeMission.ts
├─ hooks/
│  └─ useGameSession.ts
├─ lib/
│  └─ supabase.ts
├─ styles/
│  └─ global.css
├─ App.tsx
├─ main.tsx
└─ types.ts
```

The raw Speaker claim token stays in that browser's local storage; only its hash is stored in the shared session row.
