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
- **Saved events** — sign in with Google (studio accounts only) to save
  event records to Firestore, load them back, and delete them.
- **Google push** — "Add to Google Calendar" creates the event on the
  signed-in Google account's primary calendar; "Add row to Google Sheet"
  appends the record to a configured sheet. Needs the OAuth setup below.
- **Tutorial** — a short overlay on first open only (Close dismisses
  it for good). **Help** in fine print at the bottom opens the manual
  (`manual.html`).

Full documentation: `DOCUMENTATION.md` (same content as `manual.html`).

## Files

- `index.html` — the whole app (single static page).
- `manual.html` — the help/manual page.
- `DOCUMENTATION.md` — the documentation.
- `firestore.rules` — the Firestore rules for the project. The Firebase
  console is the source of truth for the live ruleset; this copy is kept
  in sync with it.
- `netlify.toml` — Netlify publish settings.

## Firebase

- Project: `fired-arts-dashboard` (shared with Arts Fired).
- Collection: `mainEvent_events` — one doc per saved event record.
- Sign-in: Google, allowlisted to `kylematthewberry@gmail.com` and
  `rochelleberry731@gmail.com`. The same allowlist is enforced by the
  Firestore rules, so the client-side check is only for the message.
- The Netlify domain (`main-eventer.netlify.app`) is in the Firebase
  Auth authorized-domains list.

## Google Calendar / Sheets push (one-time setup)

The push buttons need a Google OAuth client. Until it is set, they say
what is still needed.

1. In Google Cloud Console, open the `fired-arts-dashboard` project.
2. Enable the **Google Calendar API** and the **Google Sheets API**
   (APIs & Services → Library).
3. Create an **OAuth 2.0 Client ID** (APIs & Services → Credentials →
   Create Credentials → OAuth client ID), type **Web application**.
4. Add `https://main-eventer.netlify.app` to **Authorized JavaScript
   origins**. No redirect URI is needed (the app uses a token client).
5. Copy the client ID into `GOOGLE_OAUTH_CLIENT_ID` in `index.html`.
6. For Sheets: create a sheet, copy its ID from its URL, and put it in
   `GOOGLE_SHEET_ID` in `index.html`. The first row should be:
   `title, date, weekday, start_time, end_time, price, ages, host,
   location, description, link`.

## Deploy

- Site: Netlify, from this repo. Publish directory is the repo root.
- The Netlify badge ("Powered by Netlify") is off: it is opt-in in
  Netlify site settings and is not enabled for this site. If it ever
  appears, turn it off in Site settings → General → Site details.
