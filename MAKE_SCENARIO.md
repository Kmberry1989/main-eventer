# Main Eventer — Make scenario blueprint

The social fan-out for Main Eventer. One Make scenario watches for a
new event and posts it to Facebook, Threads, and Google Business
Profile, using Make's built-in modules (which call those platforms'
own APIs). Instagram, TikTok, and Pinterest are not in this scenario —
they need a media image first, so their copy stays copy-paste for now.

## Why a webhook trigger, not Sheet polling

Make's free tier is 1,000 credits a month, and every module run costs
1 credit. A Google Sheets "Watch Rows" trigger polls the sheet on a
schedule — every 15 minutes on the free tier, about 2,880 runs a
month even when nothing new was posted. That alone would burn the
whole free allowance on empty checks.

So this scenario uses a **Custom Webhook** trigger instead. It runs
only when a new event is pushed:

- Main Eventer posts the event to the Apps Script web app (`Code.gs`).
- The Apps Script writes the Sheet row and creates the Calendar
  event, then POSTs the same event JSON to the Make webhook URL
  (`MAKE_WEBHOOK_URL` in `Code.gs`).
- Make receives it and posts to the three platforms.

One event costs about 5 credits (webhook + Router + 3 post modules).
At studio volume that is well inside the free 1,000 credits a month.

The Sheet is still the record and the hub — the Apps Script writes
every pushed event there first, so Canva Bulk Create and the studio
can read it. Make just does not poll it.

## Prerequisites (what the user must have / authorize)

- A free Make account (make.com). Free tier: 1,000 credits/month,
  2 active scenarios, 15-minute minimum interval (irrelevant here —
  the webhook runs on demand).
- The Apps Script web app deployed, with `MAKE_WEBHOOK_URL` filled in
  (`Code.gs`). See `README.md`.
- A Facebook Page for Fired Arts Studio, connected in Make
  (Facebook Pages connection).
- A Threads account, connected in Make (Threads connection).
- A Google Business Profile location for the studio, connected in
  Make (Google Business Profile connection). **Note: the GBP module
  uses the Google Business Profile API, whose quota is 0 until Google
  approves the project — see `DIRECT_API.md` ("Google Business
  Profile Basic API Access"). Until that approval lands, the GBP
  branch will fail; Facebook and Threads are unaffected.**

## Scenario (one scenario, free tier)

### 1. Trigger — Webhooks: Custom Webhook

- Add a **Webhooks → Custom Webhook** module as the trigger.
- Make generates a webhook URL. Copy it into `MAKE_WEBHOOK_URL` in
  `Code.gs` and redeploy the Apps Script web app (a new deployment is
  not needed for a config change — edit the value and save; the
  deployed web app reads the current script).
- Send one test event from Main Eventer (Push to Google) so Make
  learns the payload shape. The payload is the event JSON:

  ```json
  {
    "key": "",
    "title": "Santa's Little Wheel Potters",
    "date": "2026-11-21",
    "startTime": "10:00",
    "endTime": "11:30",
    "price": "$55",
    "ages": "6-10",
    "host": "",
    "location": "111 W Sycamore St, Kokomo",
    "description": "...",
    "link": "https://firedartsstudio.com/...",
    "facebookText": "...",
    "threadsText": "...",
    "calendarDescription": "..."
  }
  ```

### 2. Router

- Add a **Flow Control → Router** after the webhook. Three branches,
  one per platform, so a failure in one does not block the others.

### 3. Branch A — Facebook Pages: Create a Post

- Module: **Facebook Pages → Create a Post**.
- Connection: the studio's Facebook Page.
- Fields:
  - Message: `facebookText` (from the webhook payload).
  - Link: `link` (if the event has one; leave empty otherwise).
- The Facebook text is already the full post Main Eventer generates,
  so no text building is needed in Make.

### 4. Branch B — Threads: Create a Post

- Module: **Threads → Create a Post**.
- Connection: the studio's Threads account.
- Fields:
  - Text: `threadsText`, truncated to 500 characters (Threads' limit).
    In Make, use `substring(threadsText; 1; 500)` on the mapped value.
  - Link: `link` (if the event has one).
- The Threads text is already the short version Main Eventer
  generates. The 500-character truncation is a safeguard only.

### 5. Branch C — Google Business Profile: Create a Post

- Module: **Google Business Profile → Create a Post**.
- Connection: the studio's GBP location.
- Fields:
  - Location: select the studio's location.
  - Topic Type: `EVENT`.
  - Title: `title`.
  - Summary: `description` (the event description).
  - Start date-time: combine `date` and `startTime`
    (use Make's `parseDate(date + " " + startTime)`).
  - End date-time: combine `date` and `endTime` the same way. If the
    event has no end time, use start time + 1 hour.
  - Call to action: `BOOK`, URL `link` (if the event has one).
- **This branch will fail until Google approves Basic API Access**
  (quota is 0 before approval). See `DIRECT_API.md`. Leave the branch
  in place; it starts working once the approval lands.

## Turning it on

1. In Make, create the scenario above and switch it **ON**.
2. In the Apps Script project, set `MAKE_WEBHOOK_URL` to the webhook
   URL from step 1 and save.
3. In Main Eventer, push one event (Push to Google). Confirm the Sheet
   row and Calendar event appear, then check Make's run history: one
   run, three branches, each post live.
4. If a branch fails, Make's run history shows which module and why.
   The Sheet row and Calendar event are unaffected — they were
   written before the webhook was called.

## Credit estimate (free tier)

- Per event: 1 (webhook) + 1 (Router) + 3 (post modules) = 5 credits.
- 10 events a month = 50 credits. 100 events = 500 credits. The free
  1,000 credits a month covers studio volume with room to spare.
- No polling cost: the webhook only runs when an event is pushed.

## Alternative: Sheet "Watch Rows" trigger

If the webhook route is ever unwanted, the same three post modules can
hang off a **Google Sheets → Watch Rows** trigger instead (new row in
the events sheet). That is the design the research first described.
It works, but on the free tier the 15-minute poll burns about 2,880
credits a month on empty checks alone, so either schedule it no more
than once a day (posts arrive up to a day late) or accept that it will
exhaust the free allowance. The webhook trigger above is the
recommended path for that reason.

## What this does not do

- Instagram, TikTok, Pinterest: not in this scenario. They need a
  media image, which Main Eventer does not produce yet. Their copy is
  still generated for copy-paste.
- It does not post to the website or to Google Calendar — the Apps
  Script already handles the Sheet and Calendar, and the website
  listing is copy-paste from Main Eventer.
