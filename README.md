# Daybell Cloudflare Web App — 1.4.0

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

For a NEW local database only, apply all five SQL files once, in filename order:

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_skinny_cannonball.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_special_rick_jones.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_fluffy_jocasta.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_watery_jackpot.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0004_opposite_starjammers.sql
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

## Recurring events and to-dos

Choose Make a plan > Repeat. Supports daily, weekly on selected weekdays, or monthly on the same date; repeat every 1–52 periods. Select one time per series; create a second series for another time. Leave the last date empty to repeat indefinitely, or set an inclusive end date. The timezone selected by the browser when the series is created is retained across devices. Daylight-saving changes keep the local clock time; nonexistent spring-forward times move forward, and ambiguous fall-back times use the first occurrence. Monthly dates missing from a month are skipped.

Calendar pages expand recurrence dynamically. Checking a recurring to-do completes that date only. Editing or deleting an entry changes the whole series; editing a single occurrence independently is not supported. Native apps refresh and schedule the earliest 60 upcoming reminders within the next year when opened; reopen regularly to replenish reminders. Web/Windows reminder behavior retains its existing running-app requirement.

Existing deployments need drizzle/0003_watery_jackpot.sql applied once before deploying this source. It adds a recurrence column and an occurrence-completion table without rewriting old entries. Fresh databases need migrations 0000 through 0003 in order. Never reapply a migration already installed. The Daybell production database has already received migration 0003.

Validation: seven recurrence unit tests (weekdays, intervals, inclusive end date, month-end, leap year, DST and completion isolation), authenticated API tests, and a local browser editor/calendar check passed. Native projects compile and synchronize; actual device delivery testing remains pending.

## Owner dashboard and usage reporting

Open /admin while signed into the configured owner account. The calendar shows an Owner dashboard link only for that account. The server checks the DAYBELL_OWNER_ID Worker secret on every metrics and email-change request. This is the permanent users.id value, not an email address. Changing the owner's email inside the dashboard requires the current password and preserves account identity, entries, sessions and dashboard access. A deleted/recreated account does not inherit owner access by reusing an email address. Email verification is not configured.

For another deployment, identify the verified owner's users.id and configure it with `npx wrangler secret put DAYBELL_OWNER_ID --config wrangler.production.json`. Never infer ownership from first signup or an unverified matching email. The production Daybell binding is already configured; no owner ID or credential is included in this archive. Keep this secret when deploying updates.

Apply drizzle/0004_opposite_starjammers.sql once to existing databases before deploying this version. Fresh databases need 0000 through 0004. It adds daily account activity and tracking-start metadata. The current production database already has this migration.

Metrics include currently registered accounts, registrations today, unique active accounts today and in the last 30 UTC calendar days, last recorded use, and a 30-day table. Active means a signed-in foreground app opening or interaction, reported at most once every five minutes per client. Multiple tabs cannot inflate daily unique counts. Background reminder polling and signed-out visitors do not count. Mobile activity requires the updated native source build. Earlier activity is unknown, not zero. Counts include the owner. Deleting an account also deletes its usage history and removes it from registration totals.

Activity records contain only account ID, UTC date and approximate last activity time. The owner sees aggregates and their own email, without account-email lists or calendar contents. Older records are removed during subsequent activity to maintain a 90-day date window; Cloudflare operational logs/backups have their own retention configuration. Update the store privacy disclosures to mention this first-party usage collection. /usage-privacy explains it in the web app.

Validation includes owner/non-owner access checks, deduplication, request-origin checks, local password-confirmed email changes retaining owner access, a browser rendering check, and live denial checks using a temporary non-owner account that was deleted afterward. The real owner's email was not changed.
