# Daybell Cloudflare Web App — 1.2.0

This is the WEB APP source, separate from the Windows Electron desktop source.
Production: https://daybell.techyimpressions.workers.dev/

## Login repair

The previous /signin-with-chatgpt endpoint depended on the original hosting platform. A standalone Cloudflare Worker does not provide that endpoint. This version uses its own /login page and email/password accounts stored in D1. Old sign-in links redirect to /login.

Each account has a separate calendar enforced in server-side SQL. Passwords use salted scrypt (N=16384, r=8, p=5). Sessions are random, hashed in the database, persist for up to one year of inactivity and renew during calendar use, and use Secure/HttpOnly/SameSite cookies in production. Authentication requests have origin checks and account/IP rate limits.

Email is an account identifier; it is not verified. No email delivery service is configured. Signup displays a one-time recovery key. Save it in your password manager: password recovery requires that key and rotates it. Recovery revokes existing sessions. Never assign an old calendar based only on an unverified email address.

## Run locally

Requires Node 22.13 or newer.

    npm run install:ci
    npm run build

For a NEW local database only, apply all three SQL files once, in filename order:

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_skinny_cannonball.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_special_rick_jones.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_fluffy_jocasta.sql
    npm run dev

Open the localhost URL printed by the dev server. Create a local account; no identity is simulated. For the integration suite, start the server on port 5182 (`npm run dev -- --port 5182`), then run `npm run test:auth`. The tests create temporary local accounts. `node tests/continuous-alarm.mjs` checks the alarm loop.

## Redeploy the existing Daybell Worker

    npx wrangler login
    npm run build
    npm run deploy

Use wrangler.production.json, not dist/server/wrangler.json: the latter contains development placeholder bindings. The production config names the existing Daybell Worker and database. IDs in that file are resource identifiers, not credentials. For a different Cloudflare account, replace account_id, Worker name, database_name, and database_id before deploying.

Database changes are separate from code deployment. Do not reapply SQL migrations already present. Inspect the schema and back up the database before upgrades. A fresh deployment needs all three migrations, applied remotely with `npx wrangler d1 execute DB --remote --config wrangler.production.json --file <migration-file>`. This repair added owner_id and account tables to the existing Daybell database. It preserved all seven existing entries as unassigned records. Those records are deliberately invisible until an administrator transfers them to a confirmed owner's user ID. Do not auto-assign them to the first signup.

## Important files

- app/login/page.tsx: login, signup and recovery UI.
- app/api/auth/[action]/route.ts: authentication endpoints.
- lib/auth.ts and lib/password.ts: session and password handling.
- app/api/entries/route.ts and db/entry-queries.ts: private calendar API.
- app/planner.tsx: calendar, tasks and repeating ringtone.
- drizzle/: database migrations.
- wrangler.production.json: standalone Cloudflare deployment.

The build retains helper files from its original framework export; runtime login no longer uses ChatGPT identity headers. The archive excludes database contents, credentials, installed dependencies and generated builds.

## Alarm and platform behavior

Enable alerts after opening the app. Once started, the sound loops until Stop ringing. A minimized running browser can keep playing, but suspension, browser closure, operating-system sleep, muting and mobile background restrictions can interrupt it. Installing the PWA does not provide an always-running native alarm service.

This package is a web app, not a Windows installer or an Apple/Google store binary. The separately supplied Windows package is a different deliverable and may still point to the original hosting URL. Sharing calendars across installations requires that they use this same backend and account.


Use the Password-Sign-In archive for future deployments. Older web source packages use platform-specific authentication and can restore the 404 problem if redeployed. Clearing cookies, using a different browser, explicitly signing out or recovering the password requires signing in again. Saved entries remain in D1 independently of sessions.
