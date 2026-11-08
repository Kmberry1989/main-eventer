# Main Event

One event record is the source of truth. Every channel's copy is generated
from it, and any post already written can be checked against it, field by
field, before it goes out.

## What it does

- **The event record** — name, date, start/end times, price, ages, location,
  description, registration link. Everything on the page reads from it.
- **Generated from the record** — matching copy for Google Calendar, the
  website listing, Facebook, Instagram, Threads, TikTok, Pinterest, and
  flyer text. Each has a Copy button. Also: an "Open in Google Calendar"
  link, a downloadable .ics, and a CSV row for Canva bulk create.
- **Check a post against the record** — paste any live listing, caption, or
  flyer text, pick its channel, and it flags date, day of week, times,
  price, and ages as Match, Conflict, or Not stated.
- **Saved events** — sign in with Google (studio accounts only) to save
  event records to Firestore, load them back, and delete them.
- **Google push** — "Add to Google Calendar" creates the event on the
  signed-in Google account's primary calendar; "Add row to Google Sheet"
  appends the record to a configured sheet. Needs the OAuth setup below.

## Files

- `index.html` — the whole app (single static page).
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
- The Netlify domain (`main-event.netlify.app`) is already in the Firebase
  Auth authorized-domains list.

## Google Calendar / Sheets push (one-time setup)

The push buttons need a Google OAuth client. Until it is set, they say
what is still needed.

1. In Google Cloud Console, open the `fired-arts-dashboard` project.
2. Enable the **Google Calendar API** and the **Google Sheets API**
   (APIs & Services → Library).
3. Create an **OAuth 2.0 Client ID** (APIs & Services → Credentials →
   Create Credentials → OAuth client ID), type **Web application**.
4. Add `https://main-event.netlify.app` to **Authorized JavaScript
   origins**. No redirect URI is needed (the app uses a token client).
5. Copy the client ID into `GOOGLE_OAUTH_CLIENT_ID` in `index.html`.
6. For Sheets: create a sheet, copy its ID from its URL, and put it in
   `GOOGLE_SHEET_ID` in `index.html`. The first row should be:
   `title, date, weekday, start_time, end_time, price, ages, location,
   description, link`.

## Deploy

- Site: Netlify, from this repo. Publish directory is the repo root.
- The Netlify badge ("Powered by Netlify") is off: it is opt-in in
  Netlify site settings and is not enabled for this site. If it ever
  appears, turn it off in Site settings → General → Site details.
