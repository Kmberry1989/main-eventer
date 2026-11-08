# Main Eventer — Direct API preparation

The direct-API path: calling Facebook, Threads, and Google Business
Profile's own APIs to post, instead of (or alongside) Make. Make's
modules already call these same APIs under the hood, so this document
is the underlying access — what to apply for, what permissions are
needed, and what the user must submit. Nothing here bypasses any app
review or approval.

Instagram, Pinterest, and TikTok direct posting are out of scope for
now: Instagram and Pinterest need a media image (Main Eventer does
not produce one yet), and TikTok's direct API is not worth it for one
studio (app review plus a separate audit, and unaudited posts are
forced private). Their copy stays copy-paste until an image workflow
exists.

## Facebook Graph API (Pages)

The most realistic direct API to attempt. Text-only posts work, and
scheduling is supported through the API.

### What it needs

- A Meta app at developers.facebook.com (create an app, type
  **Business**).
- The app connected to the studio's Facebook Page.
- Permissions: `pages_manage_posts` (post to the Page) and
  `pages_show_list` (list the Pages the user manages).
- Posting is to a **Page only** — personal profiles cannot be posted
  to through the API.
- Endpoint: `POST /{page-id}/feed` with `message` (the post text)
  and optional `link`.

### App Review — the single-user nuance

Meta's App Review is mandatory only before people *without a role on
the app* can grant a permission. If the tool is used only by the
owner (added as an app admin, developer, or tester), App Review is
**not required** for these permissions. That is the case here — only
Kyle and Rochelle use Main Eventer.

Confirm this in Meta's App Review documentation for the exact
permissions before relying on it. If the tool is ever used by anyone
else, App Review and Business Verification become required.

### Business Verification

Free. A document check (legal name and address, incorporation,
bank statement or utility bill). Decision reported up to 14 business
days. Only needed if the app ever needs Advanced Access for
non-role users.

### What the user must do

1. Create the Meta app and add the Facebook Page.
2. Add Kyle (and Rochelle) as an app admin/developer/tester.
3. Grant `pages_manage_posts` and `pages_show_list` to the app.
4. Get a Page access token (Graph API Explorer, or the app's token
   flow) and keep it somewhere safe — never in Git or in the page
   source. For a static site, the token belongs in a server-side
   secret (a Netlify Function or Firebase secret), not in the
   browser.
5. If the token is ever used directly from Main Eventer, it must go
   through a server-side call — do not put a Page token in
   `index.html`.

## Threads API

The most approachable text API. Text-only posts work.

### What it needs

- A Meta app (same app as Facebook can host it) with the Threads
  product added.
- Permissions: `threads_basic` and `threads_content_publish`.
- Endpoint: `POST /{threads-user-id}/threads` (create a container),
  then `POST /{threads-user-id}/threads_publish` to publish. Text-only
  posts can use `auto_publish_text`.
- **500-character limit** per post (maximum 5 links). Main Eventer's
  Threads text is already the short version; keep it under 500
  characters.
- Rate limit: 250 posts per 24 hours.
- Tokens: a 1-hour short-lived token is exchanged for a 60-day
  long-lived token. The long-lived token must be refreshed before it
  expires.

### App Review

Same single-user nuance as Facebook: Threads Testers can grant
permissions without review. Some guides cite a separate Tech Provider
Verification (about 1 week); October 2026 reports say Meta removed
that separate access review. **Verify in the developer dashboard**
before relying on either claim.

### What the user must do

1. Add the Threads product to the Meta app.
2. Grant `threads_basic` and `threads_content_publish`.
3. Exchange the short-lived token for a 60-day long-lived token and
   store it server-side (never in Git or in the page source).
4. Refresh the long-lived token before the 60 days expire.

## Google Business Profile — Basic API Access application

The GBP API's `EVENT` post type maps exactly onto Main Eventer's
record (title, start and end). This is a single application form, not
a screencast review — but the API quota is **0 until Google approves
the project**, so nothing can post until the approval lands.

### What it needs

- A Google Cloud project (the studio already has
  `fired-arts-dashboard`).
- The Google Business Profile API enabled in that project.
- The **Application for Basic API Access** form submitted to Google.
  There is no published approval timeline.
- Scope: `business.manage`.
- Endpoint: `accounts.locations.localPosts.create` with
  `topicType: EVENT`.

### Requirements to apply

- The applicant must manage a Google Business Profile that is
  **verified and active for 60+ days**, with a website listed.
- The application must come from an owner or manager email of that
  profile.
- There is no sandbox. Use `validateOnly` to dry-run a post without
  publishing it.

### Limits

- Post text: 1,500 characters.
- Photo by public URL only, 1 image maximum, no video.

### What the user must do

1. Confirm the studio's Google Business Profile has been verified
   and active for 60+ days. If it has not, wait until it has been —
   the application will not be accepted before then.
2. In Google Cloud Console, open the `fired-arts-dashboard` project
   and enable the **Google Business Profile API**.
3. Submit the **Application for Basic API Access** form, from an
   owner/manager email of the profile.
4. Wait for Google's approval. There is no published timeline.
5. Once approved, the API quota is granted and the GBP module in Make
   (or a direct call) can post. Until then, GBP posting stays manual
   (copy-paste into Google Business Profile).

## What is not being pursued

- **Instagram Graph API** — needs a media image for every post (no
  text-only posts) and has no API scheduling. Deferred until Main
  Eventer stores a public image URL per event.
- **Pinterest API v5** — needs a media image and Standard access.
  Trial access pins are sandbox-only (visible only to their creator),
  so they do not reach followers. Deferred until an image workflow
  exists and Standard access is granted.
- **TikTok Content Posting API** — not worth it. App review plus a
  separate Content Posting audit; until the audit passes, every post
  is forced private. TikTok also states apps must not be for
  private/personal use, which is a direct hit on a single-studio
  private tool. Use TikTok's native desktop scheduler instead.
- **Zapier Pro, n8n self-hosted, Pipedream, Firebase Extensions** —
  not pursued. Zapier Pro is $20/month for what Make's free tier
  does; n8n self-hosted is an ops burden; Pipedream Workflows and
  Firebase Extensions both shut down in 2026–2027.

## Sources

Prices, quotas, and approval steps in this document come from the
research in `~/workspace/research_notes/main-eventer-integration-options-20261108-0937/report.md`
(secondary guides checked October–November 2026). Re-check the
vendor's own developer page before submitting anything — several
prices and review processes changed in 2025–2026.
