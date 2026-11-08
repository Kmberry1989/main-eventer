# Main Eventer — Documentation

Main Eventer is Fired Arts Studio's event-uniformity tool. One event record
produces matching copy for every channel, and any text already written can be
checked against that record, field by field.

Live site: https://main-eventer.netlify.app
Repo: https://github.com/Kmberry1989/main-event

## The event record

The form on the left is the event record. Every output on the page reads
from it. All fields are optional — nothing is required to save or generate.
When a field is left blank, it is omitted from the generated outputs: no
empty labels, no stray punctuation, no blank lines where the detail would
have gone.

Fields:

- **Event name** — the event's title. Flagged when blank.
- **Date** — the event date. Flagged when blank.
- **Start time** — when the event begins. Flagged when blank.
- **End time** — when the event ends. Flagged when blank.
- **Price** — what it costs (for example `$25`, `$45`, `Free`). Flagged
  when blank.
- **Ages** — who it is for (for example `6-12`, `18+`). Flagged when
  blank.
- **Host** — the person hosting the event (host or hostess, just a name).
- **Location** — where it happens (for example `111 W Sycamore St,
  Kokomo`).
- **Description** — a short description of the event.
- **Link** — the registration or event page link.

### Canonical line

Below the form, the canonical line is the record reduced to one line:
name, date, times, host, price, ages, location — joined with `·`. It is
the single line every channel's copy is built from.

### Caution flags

When an important field is left blank, a warning triangle (⚠) appears
next to its label and the field's border turns amber: name, date, start
time, end time, price, ages. Host, location, description, and link do
not get a flag. The flag is a warning only — it never blocks saving or
generating.

## Outputs

Each channel's text is generated from the record and shown in its own
card, with a **Copy** button:

- **Google Calendar** — event description for the calendar, plus an
  **Open in Google Calendar** link and a **Download .ics** button.
- **Website listing** — title, date and times, price, ages, host,
  location, description, registration link.
- **Facebook post** — title with short date and time, description,
  details, registration link.
- **Instagram caption** — title with short date and time, description,
  details, "Link in bio to register", and the hashtags
  `#FiredArtsStudio #KokomoIN #PaintYourOwnPottery`.
- **Threads post** — title, short date and time, price, ages, host,
  link, joined with `·`.
- **TikTok caption** — title, short date and time, location, host,
  registration link, and the hashtags `#FiredArtsStudio #KokomoIN
  #PYOP`.
- **Pinterest description** — title with long date, description,
  details, link.
- **Flyer text** — title in capitals, long date, time range, price,
  ages, host, location, link. This is the text to put on a graphic.

**Download CSV** downloads one CSV row of the record (columns: title,
date, weekday, start time, end time, price, ages, host, location,
description, link) for Canva bulk create.

The **Open in Google Calendar** link and the **Download .ics** button
need a name, date, and start time; otherwise they stay inactive.

## Google push

The **Google** card has one button, **Push to Google**, that sends
the record to a Google Apps Script web app (`Code.gs`). The web app
appends one row to a Google Sheet, creates a Google Calendar event,
and (if configured) POSTs the event to a Make webhook, which fans it
out to Facebook, Threads, and Google Business Profile. It runs as the
script owner, so no sign-in is needed in the tool. The web app URL is
`APPS_SCRIPT_URL` in `index.html`; the Sheet ID and Calendar ID live
in `Code.gs`.

- **Sheet row**: title, date, weekday, start time, end time, price,
  ages, host, location, description, signup link, Facebook text,
  Threads text, calendar description.
- **Calendar event**: title, start/end time (end defaults to start +
  1 hour), location, description (the generated calendar text plus
  the signup link), timezone America/Indiana/Indianapolis.
- **Guard**: the button needs a name, date, and start time; without
  them it says so. If `APPS_SCRIPT_URL` is empty it says the web app
  URL is still needed. A shared secret (`APPS_SCRIPT_KEY` /
  `SECRET_KEY`) is optional; if set, the two must match.
- **POST format**: `Content-Type: text/plain` (no CORS preflight —
  Apps Script web apps do not answer preflights). The body is a JSON
  string; `Code.gs` parses it.
- **Failure**: if the Sheet write or Calendar creation fails, the
  response says which one and why. The Make webhook is called only
  after both succeed.
- **Make**: the social fan-out is a Make scenario that watches for
  the webhook the Apps Script calls. The full blueprint is in
  `MAKE_SCENARIO.md`.
- **Direct APIs**: the Facebook Graph API, Threads API, and Google
  Business Profile Basic API Access are the underlying access. The
  preparation doc is in `DIRECT_API.md`. The custom Google OAuth
  client approach is superseded — do not set one up.

One-time setup (see `README.md` for the short version):

1. Create a new Apps Script project (script.google.com) and paste
   `Code.gs` in as the code.
2. Set the script timezone to America/Indiana/Indianapolis:
   Project Settings → Time zone.
3. Fill in `SHEET_ID` and `CALENDAR_ID` in `Code.gs`. Create a blank
   Google Sheet first and copy its ID from its URL; the Calendar ID
   is in Calendar Settings → Integrate calendar.
4. Optionally set `SECRET_KEY` and `MAKE_WEBHOOK_URL` in `Code.gs`.
5. Deploy → New deployment → type Web app → Execute as: Me → Who
   has access: Anyone → Deploy. Copy the Web app URL.
6. Paste that URL into `APPS_SCRIPT_URL` in `index.html`. If a
   `SECRET_KEY` is set in the script, paste the same value into
   `APPS_SCRIPT_KEY` in `index.html`.

## Check a post

Paste the text of anything already written or already live — a website
listing, a caption, the words on a flyer — pick where the text lives,
and run **Check it**. Each field is compared against the record and
flagged **Match**, **Conflict**, or **Not stated**:

- **Date** — month and day.
- **Day of week** — the weekday the record's date falls on.
- **Times** — start and end times. A PM time where the record says AM
  (or the reverse) is a conflict.
- **Price** — dollar amounts, or `Free`.
- **Ages** — the age range.
- **Host** — a name after `Host:`, `Host`, or `Hosted by`.

A field the pasted text never states is flagged **Not stated**, not
passed: a post that omits the time can't conflict with it, but it can't
confirm it either. A field the record leaves blank is skipped the same
way — it shows as **Not stated**, never as a conflict.

The verdict line reads **Uniform.** when every stated field matches,
**N conflicts with the record.** when anything disagrees, or **No
conflicts — M fields match, N not stated.** when nothing conflicts but
something was left out.

## Saved events

**Sign in with Google** (top of the page) signs in with any Google
account. Studio accounts (`kylematthewberry@gmail.com` and
`rochelleberry731@gmail.com`) get the Fired Arts workspace; everyone
else gets their own personal workspace, set up on first sign-in by the
[setup wizard](setup.html). Each workspace sees only its own saved
events.

- **Save event** saves the current record to Firestore (studio:
  collection `mainEvent_events`; personal:
  `mainEvent_workspaces/{uid}/events`, project
  `fired-arts-dashboard`). Saving a record that is already loaded
  updates it; saving a new one creates it.
- **Saved events** lists the saved records. Tap one to load it into
  the form. **Delete** removes it.
- **New event** clears the form.

## Setup wizard

[Setup](setup.html) walks a new user through five steps: sign in with
Google; business details (name, location, timezone, default host,
hashtags); Google (Sheet, Calendar, Apps Script); social fan-out
(optional); done. It fills in the Apps Script file with the user's own
Sheet and Calendar IDs, and tests the connection before finishing.
The Fired Arts studio workspace is untouched — studio accounts never
see the wizard. What the wizard automates, what stays manual, and
what would fully automate it are in `SETUP.md`.

## Tutorial and Help

The first time the tool is opened, a short tutorial overlay appears:
enter the event once, copy the matching posts and calendar event, check
live posts against the record. It has a **Close** button and does not
reappear after being dismissed.

A small **Help** link sits in fine print at the bottom of the page. It
opens the manual (`manual.html`), which is this documentation in page
form.

## Deploy

- Site: Netlify, from this repo. Publish directory is the repo root.
- The Netlify badge ("Powered by Netlify") is off: it is opt-in in
  Netlify site settings and is not enabled for this site. If it ever
  appears, turn it off in Site settings → General → Site details.
- Firebase project: `fired-arts-dashboard` (shared with Arts Fired).
  The Netlify domain (`main-eventer.netlify.app`) is in the Firebase
  Auth authorized-domains list.

## Text removed from the UI

The following text used to appear in the tool and was moved here on
2026-11-08, so the UI carries only labels, buttons, and output:

- "Enter an event once. Every channel's copy is generated from that
  single record — and any post already written can be checked against
  it, field by field, before it goes out."
- "This is the source of truth. Everything on this page reads from
  it."
- "Tap one to load it. Saving needs sign-in."
- "Copy a channel's text and paste it into that channel. Nothing is
  typed twice, so nothing can disagree."
- "Push this record straight to Google Calendar or a Google Sheet."
- "Paste the text of anything already written or already live — a
  website listing, a caption, the words on a flyer — and it gets
  compared field by field."
- "Checks date, day of week, start and end times, price, and ages. A
  field the pasted text never states is flagged "not stated" rather
  than passed — a post that omits the time can't conflict with it, but
  it can't confirm it either."
- "Fill in the record and the canonical line appears here."
- "Fill in the name, date, and start time, and the canonical line
  appears here."
- "Waiting on the record — name, date, and start time."
- "Sign in to save events" (the sign-in label when signed out).
- "Download CSV row (Canva bulk create)" (button, now "Download CSV").
- "Fill in the event record first — name, date, and start time — then
  run the check."
- "Paste the {channel} text first, then run the check."
- "N conflicts with the record in the {channel} text. Fix the text —
  or, if the text is right, fix the record and regenerate everything
  from it."
- "No conflicts in the {channel} text — M fields match, N fields are
  not stated and can't be confirmed."
- "Uniform. Every stated field in the {channel} text matches the
  record."
- "Fill in the name, date, and start time first." (save / Google push
  guard)
