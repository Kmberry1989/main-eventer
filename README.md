# Main Eventer

One event record. Matching copy for every channel, and a check for anything
already written. Live at https://main-eventer.netlify.app.

## What it does

- **Event** — name, date, start/end times, price, ages, host, location,
  description, link. All fields are optional; blank fields are omitted
  from the outputs. Name, date, start time, end time, price, and ages
  get a caution flag (⚠) when left blank — a warning only, never a
  block.
- **Outputs** — matching copy for Google Calendar, the website listing,
  Facebook, Instagram, Threads, TikTok, Pinterest, and flyer text.
  Each has a Copy button. Also: an "Open in Google Calendar" link, a
  downloadable .ics, and a CSV row for Canva bulk create.
- **Check a post** — paste any live listing, caption, or flyer text,
  pick its channel, and it flags date, day of week, times, price,
  ages, and host as Match, Conflict, or Not stated. Fields the record
  leaves blank are skipped, never conflicts.
- **Saved events** — sign in with Google (any account) to save
  event records to Firestore, load them back, and delete them.
  Studio accounts get the Fired Arts workspace; everyone else gets
  their own personal workspace, set up by the setup wizard.
- **Google push** — "Push to Google" sends the record to a Google Apps
  Script web app, which appends the Sheet row and creates the Calendar
  event (and triggers Make, if configured). Needs the Apps Script setup
  below.
- **Tutorial** — a short overlay on first open only (Close dismisses
  it for good). **Help** in fine print at the bottom opens the manual
  (`manual.html`).

Full documentation: `DOCUMENTATION.md` (same content as `manual.html`).

## Files

- `index.html` — the whole app (single static page).
- `setup.html` — the setup wizard for new users (five steps: sign
  in, business details, Google, social, done).
- `SETUP.md` — what the wizard automates, what stays manual, and
  what would fully automate it.
- `manual.html` — the help/manual page.
- `DOCUMENTATION.md` — the documentation.
- `Code.gs` — the Google Apps Script web app (Sheet + Calendar push,
  and the Make webhook trigger).
- `MAKE_SCENARIO.md` — the Make scenario blueprint (social fan-out).
- `DIRECT_API.md` — direct-API preparation (Facebook, Threads,
  Google Business Profile).
- `firestore.rules` — the Firestore rules for the project. The Firebase
  console is the source of truth for the live ruleset; this copy is kept
  in sync with it.
- `netlify.toml` — Netlify publish settings.

## Firebase

- Project: `fired-arts-dashboard` (shared with Arts Fired).
- Studio collection: `mainEvent_events` — one doc per saved event
  record, read/write restricted to `kylematthewberry@gmail.com`,
  `rochelleberry731@gmail.com`, and `media@firedartsstudio.com`.
- Personal workspaces: `mainEvent_workspaces/{uid}` — one doc per
  user (doc id is the Firebase Auth uid), with an `events`
  subcollection. Owner-scoped rules: any signed-in Google user can
  read/write only their own doc and its events. No allowlist.
- Sign-in: Google, any account. Studio accounts get the Fired Arts
  workspace; everyone else gets a personal workspace via the setup
  wizard (`setup.html`). The Netlify domain
  (`main-eventer.netlify.app`) is in the Firebase Auth
  authorized-domains list.

## Setup wizard (for any user)

`setup.html` — five steps, no account needed beyond Google sign-in:

1. **Sign in** — any Google account. Studio accounts are told
   they're already set up and sent to the tool.
2. **Business** — name, location, timezone, default host, hashtags
   (suggested from the business name). Saved to the user's workspace.
3. **Google** — create a Sheet (one click), paste its link (the ID
   is extracted), Calendar ID (prefilled with their email — their
   primary calendar), then copy a personalized `Code.gs` (their Sheet
   and Calendar IDs already filled in), paste it into a new Apps
   Script project, deploy as a web app, paste the URL back, and test
   the connection (read-only check, then a write-free ping).
4. **Social** — optional, skippable. A Make webhook URL for the
   social fan-out (see `MAKE_SCENARIO.md`); Google Business Profile
   needs Basic API Access approval first (see `DIRECT_API.md`).
5. **Done** — summary, then into the tool with their defaults in
   place (location/host prefilled, their hashtags, their timezone,
   their Apps Script wired for Push to Google).

What the wizard automates vs what stays manual, and the backend
that would fully automate it, are in `SETUP.md`.

## Hybrid setup (one-time)

The hybrid is three parts: Apps Script for Google, Make for the
social fan-out, and the direct APIs underneath. The custom Google
OAuth client approach is superseded — do not set one up.

### 1. Apps Script — Google push

Until this is set, the Push to Google button says what is still
needed.

1. Create a new Apps Script project (script.google.com) and paste
   `Code.gs` in as the code.
2. Set the script timezone to America/Indiana/Indianapolis:
   Project Settings (gear icon) → Time zone.
3. Fill in `SHEET_ID` and `CALENDAR_ID` in `Code.gs`. Create a blank
   Google Sheet first and copy its ID from its URL; the Calendar ID
   is in Calendar Settings → Integrate calendar.
4. Optionally set `SECRET_KEY` and `MAKE_WEBHOOK_URL` in `Code.gs`.
5. Deploy → New deployment → type Web app → Execute as: Me → Who
   has access: Anyone → Deploy. Copy the Web app URL.
6. Paste that URL into `APPS_SCRIPT_URL` in `index.html`. If a
   `SECRET_KEY` is set in the script, paste the same value into
   `APPS_SCRIPT_KEY` in `index.html`.

### 2. Make — social fan-out

See `MAKE_SCENARIO.md` for the full blueprint. In short: create a
free Make account, build one scenario with a Custom Webhook trigger
→ Router → Facebook Pages, Threads, and Google Business Profile
post modules, copy the webhook URL into `MAKE_WEBHOOK_URL` in
`Code.gs`, and switch the scenario on. Connect the Facebook Page,
Threads account, and GBP location in Make when asked. The GBP branch
needs Google's Basic API Access approval before it can post (see
below).

### 3. Direct APIs

See `DIRECT_API.md`. In short: the Facebook Graph API and Threads
API are realistic direct paths (single-user use needs no App Review);
Google Business Profile needs the Basic API Access application
(profile verified/active 60+ days, quota is 0 until approved).
Instagram, Pinterest, and TikTok direct posting are out of scope
(they need a media image first; TikTok is not worth it).

## Deploy

- Site: Netlify, from this repo. Publish directory is the repo root.
- The Netlify badge ("Powered by Netlify") is off: it is opt-in in
  Netlify site settings and is not enabled for this site. If it ever
  appears, turn it off in Site settings → General → Site details.
