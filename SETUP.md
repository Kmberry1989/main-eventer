# Main Eventer — Setup wizard: what it automates, what stays manual

The setup wizard (`setup.html`) lets any Google user set Main
Eventer up for their own events. The Fired Arts studio workspace is
untouched: studio accounts (`kylematthewberry@gmail.com`,
`rochelleberry731@gmail.com`) never see the wizard and keep the
existing `mainEvent_events` collection and the existing Apps Script
endpoint.

## What the wizard automates

- **Sign-in.** Any Google account signs in with Firebase Auth. No
  allowlist, no invite, no admin step. The studio allowlist still
  exists, but it now only picks which workspace a signed-in user
  gets — it no longer signs anyone out.
- **Workspace.** One Firestore doc per user,
  `mainEvent_workspaces/{uid}` (doc id is the Firebase Auth uid),
  plus an `events` subcollection for their saved records. The rules
  are owner-scoped: a signed-in user can read/write only the doc
  whose id is their own uid. A copy is also kept on the device
  (localStorage) so the tool keeps working if the cloud save is
  briefly unavailable.
- **Business defaults.** Name, location, timezone, default host,
  hashtags — saved to the workspace and applied in the tool:
  location and host prefill new events, hashtags replace the
  Fired Arts tags in the Instagram/TikTok copy, timezone replaces
  `America/Indiana/Indianapolis` in the .ics file and the Google
  Calendar link.
- **Sheet ID.** The user pastes their Sheet link; the ID is
  extracted from it (a bare ID is accepted too).
- **Calendar ID.** Prefilled with the user's email — their primary
  calendar. They can change it.
- **Personalized Apps Script.** The wizard fetches `Code.gs`,
  fills in the user's Sheet ID, Calendar ID, Make webhook URL, and
  shared secret, rewrites the timezone instruction to their
  timezone, and copies the result to the clipboard (a raw download
  is offered as a fallback).
- **Connection test.** A read-only GET to the deployed web app
  (doGet) shows whether the Sheet and Calendar are configured.
  Current `Code.gs` (version 2+) also answers a write-free
  `{"action":"ping"}` POST that proves the Sheet and Calendar can
  actually be opened — no row is written, no event is created.
- **Social (optional).** A Make webhook URL is stored in the
  workspace and baked into the generated `Code.gs`. Skipping it
  changes nothing else.

## What stays manual (and why)

A static site cannot do these in the user's Google account without
their own authorization flow:

1. **Creating the Sheet.** One click (`sheets.new`), then paste the
   link back. Google won't let a web page create files in a user's
   Drive without an OAuth grant.
2. **Creating the Apps Script project and deploying it.** The user
   opens Apps Script, pastes the generated file, sets the project
   timezone, and deploys as a web app (Execute as: Me, Anyone).
   Deploying a script into someone else's account is an account
   action, not something a static page can do on their behalf.
3. **Creating the Make scenario.** One scenario, free tier, per
   `MAKE_SCENARIO.md`. Same reason: it lives in the user's Make
   account.
4. **Google Business Profile Basic API Access.** An application the
   user files with Google (see `DIRECT_API.md`); quota is 0 until
   approved.

Each manual step is one short prompt with a link, in the wizard
itself. Nothing is faked: if a step isn't done, the wizard says so
and the tool says what is still needed.

## What would fully automate it

A small backend — a Netlify Function or a Firebase Cloud Function —
holding a verified Google OAuth client. After the user grants
Drive/Sheets/Calendar scopes once, the backend could create the
Sheet, write rows, and create Calendar events directly from the
server, with per-user tokens stored encrypted. That removes the
Apps Script project and deploy entirely: the wizard would be sign
in → business details → grant access → done.

That needs three things that don't exist yet:

- A Google Cloud project whose OAuth consent screen is **verified**
  for public use (privacy policy, app review). The current project
  (`fired-arts-dashboard`) is an unverified internal project; an
  external user would hit the "unverified app" screen and the
  100-user testing cap.
- A server-side token store (encrypted, per user) — the tokens
  must never live in page source.
- The Sheet/Calendar write paths moved server-side (the Apps Script
  becomes optional, kept only for the Make webhook fan-out).

Until that backend exists, the wizard's guided Apps Script path is
the honest setup: the user does four short manual steps, the wizard
does everything else.
