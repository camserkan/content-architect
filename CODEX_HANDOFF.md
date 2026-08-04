# Codex Handoff: Content Architect

This file is the project memory for Codex. In a new Codex session, read this file first, then inspect `src/App.jsx`, `server/index.js`, `src/supabaseClient.js`, and `package.json` before making changes.

## Project Location Note

The working project folder found on this machine is:

```text
/Users/serkancam/content-architect_restore copy_BACKUP_20260228_220512
```

There is also a clean backup folder named:

```text
/Users/serkancam/content-architect_restore_BACKUP_20260228_220512
```

Unless the user clarifies otherwise, continue development in the `copy` folder because it contains the current auth, paid access, credits, and routing work.

## Project Summary

Content Architect is a React + Vite app with a Node/Express API for generating content scripts, time maps, B-roll guidance, production structure, and provider-backed AI output.

The user usually speaks Turkish. Keep conversation in Turkish unless they ask otherwise.

## Main Files

- `src/App.jsx`: Main UI, auth/account routes, generation flow, access/credit handling, teleprompter, inventory, script and time-map logic.
- `src/supabaseClient.js`: Supabase browser client configuration.
- `server/index.js`: Express API, provider calls, Supabase service-role user validation, and credit decrement RPC.
- `package.json`: Vite, server, build, lint, and dependency setup.
- `.env`: Local secrets. Never commit this file.

## Current Setup

Run locally:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Current State

- React Router has been added.
- Supabase auth/profile handling has been added in the app.
- Server generation now expects a Bearer token and validates the user with Supabase admin auth.
- Generation consumes a credit through `consume_credit_for`.
- `.env` has local values and must stay out of commits.
- There is an untracked backup file `src/App.jsx.bak.20260225-174703`; keep it unless the user asks to remove it.

## Development Notes For Codex

1. Read this file before editing.
2. Inspect `src/App.jsx` and `server/index.js` before changing auth, credits, or generation behavior.
3. Use `apply_patch` for manual edits.
4. Do not commit `.env`.
5. Do not weaken auth, paid access, profile, or credit checks without explicit user request.
6. After frontend/server changes, run:

```bash
npm run build
```

If server-only changes are made, also run:

```bash
node --check server/index.js
```

## How To Continue On Another Computer

1. Clone or pull the GitHub repository.
2. Recreate `.env` locally with the needed Supabase and AI provider secrets.
3. Run `npm install`.
4. Open the folder in Codex.
5. Tell Codex: "Read `CODEX_HANDOFF.md` first, then continue development."
