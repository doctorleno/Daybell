# Daybell

**Big plans. Little reminders.**

A responsive calendar and to-do web app with configurable advance reminders and synthesized ringtones.

## Run locally

Requirements: Node.js 22.13 or newer, npm, and an internet connection for the first dependency installation.

1. Extract this archive and open a terminal in the extracted folder.
2. Install the locked dependencies:

       npm run install:ci

3. Build the app and generate the local Worker configuration:

       npm run build

4. Initialize the local database (run this migration only once per fresh local database):

       node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_skinny_cannonball.sql

5. Start development mode:

       npm run dev

6. Open the Local URL printed in the terminal.

To preview the production build locally, use npm start instead. It uses the same local database.

## Main source files

- app/page.tsx: calendar, agenda, entry editor, task completion, sound generation and reminder scheduling.
- app/globals.css: responsive layouts, colors, typography and interactive states.
- app/api/entries/route.ts: validated create/update, list and delete API.
- db/schema.ts: database schema.
- db/raw.ts: D1 database access.
- drizzle/0000_skinny_cannonball.sql: initial database migration.
- app/layout.tsx: document title, metadata and favicon.
- public/favicon.svg: Daybell brand icon.
- components/ui/: reusable accessible interface components.
- build/, scripts/, vite.config.ts: framework and Cloudflare build integration.

## Technology

React 19, TypeScript, Vinext/Vite, Tailwind CSS, Radix UI components, Lucide icons, Zod validation, Drizzle migrations and Cloudflare D1. Exact dependency versions are recorded in package-lock.json.

## Using reminders

Create an event or to-do with a date and local time. Choose 0, 5, 15, 30, 60, or a custom number of minutes before the start. Preview Chime, Marimba or Bell; choose Silent for a visual alert.

Click **Enable alerts** after opening or reloading the app. Allow notifications for desktop pop-ups. An in-app reminder is available even when desktop notification permission is denied. Keep the page open and the computer awake. Browser throttling, OS notification settings and muted audio can delay or suppress notifications or sound.

Times are saved as UTC and displayed in the browser's local timezone. Completed tasks do not trigger reminders. Notifications are checked in the open browser, not sent by a background push service.

## Deployment and privacy

The existing hosted app is owner-private and relies on its hosting access controls. The entry API itself has no independent account system or per-user data separation. Keep deployment private. Add authentication and per-user ownership checks before deploying publicly or sharing it with multiple users.

Cloudflare D1 is required for persistent storage. A generic static file host is insufficient. The .openai/hosting.json manifest in this export declares the logical DB binding but intentionally omits the original hosted project's ID. Register a new project for your own deployment, or use the original working checkout to update the existing hosted app.

This download contains source and migration files only: no calendar records, credentials, installed dependencies or Git history.

## Current scope

Calendar and agenda, event/to-do editing, task completion, custom reminder timing, ringtone previews, browser notification support and online persistence. Google/Outlook synchronization, native desktop packaging, recurring events and closed-browser push notifications are not implemented.
