# Daybell 1.1 — private calendars and repeating alarms

Use your own ChatGPT account to sign in. Everyone gets a separate calendar. The server checks the signed-in account for every read, edit and delete. The hosting dispatcher must supply trusted identity headers: do not expose this Worker directly without an equivalent authentication gateway.

Browser alarms repeat until Stop ringing. Enable alerts after opening the page. A minimized running tab can keep playing, but browser suspension, closing, sleep, muting and phone background restrictions can interrupt it. Installing the web app does not turn it into a system alarm service.

## Development

Node 22.13+ required.

1. npm run install:ci
2. npm run build
3. Initialize a new local database by applying each migration once, in order:

       node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_skinny_cannonball.sql
       node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_special_rick_jones.sql

4. npm run dev

Local preview simulates a single test identity. Real hosting uses dispatch-owned ChatGPT sign-in.

Run account authorization tests with Node 24+:

    node tests/account-isolation.mjs

## Source map

- app/page.tsx: server-rendered sign-in gate.
- app/chatgpt-auth.ts: hosting sign-in helpers.
- app/planner.tsx: calendar UI and continuous audio loop.
- app/api/entries/route.ts: account-scoped API.
- db/entry-queries.ts: prepared SQL statements.
- db/schema.ts and drizzle/: schema and append-only migrations.
- public/manifest.webmanifest and public/sw.js: installation support; no private calendar responses are cached.

## Migration of the original calendar

LEGACY_OWNER_EMAIL is configured only as a server-side hosting secret. It identifies the verified original owner's email for claiming old unowned records. Unowned records are never listed to any account. No first-visitor claim is allowed. New projects without old records do not need this setting.

The source export removes the original hosting project ID. It contains no private records, credentials or installed dependencies.
