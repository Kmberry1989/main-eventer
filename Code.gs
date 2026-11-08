/**
 * Main Eventer — Google Apps Script web app
 *
 * One endpoint that does the Google side of Main Eventer:
 *  - appends the event as a row in a Google Sheet (the hub Make reads)
 *  - creates the event on a Google Calendar
 *  - optionally POSTs the same event to a Make webhook (social fan-out)
 *
 * Setup (one time, in the studio's Google account):
 *  1. Create a new Apps Script project (script.google.com) and paste
 *     this file in as Code.gs.
 *  2. Set the script timezone to America/Indiana/Indianapolis:
 *     Project Settings (gear icon) -> Time zone.
 *  3. Fill in SHEET_ID and CALENDAR_ID below. Optionally set
 *     SECRET_KEY and MAKE_WEBHOOK_URL.
 *  4. Deploy -> New deployment -> type Web app -> Execute as: Me ->
 *     Who has access: Anyone -> Deploy. Copy the Web app URL.
 *  5. Paste that URL into APPS_SCRIPT_URL in Main Eventer's index.html.
 *     If SECRET_KEY is set here, paste the same value into
 *     APPS_SCRIPT_KEY in index.html.
 *
 * Setup-wizard users: the wizard at /setup.html fills in SHEET_ID,
 * CALENDAR_ID, and MAKE_WEBHOOK_URL for you (and the script timezone
 * in step 2) — paste the generated file as-is.
 *
 * Health check: GET the web app URL (doGet below) or POST
 * {"action":"ping"} — both answer with the config status and write
 * nothing. The wizard uses this to test the connection.
 *
 * Actions the tool can POST:
 *  - {"action":"ping"} — write-free health check (no secret needed).
 *  - {"action":"listCalendars", "key": SECRET_KEY} — returns the
 *    calendars this account can write to, as
 *    {ok:true, calendars:[{id, name, primary}]}. "primary" marks the
 *    configured default calendar (CALENDAR_ID below, or the account's
 *    default calendar when CALENDAR_ID is empty). Needs the secret,
 *    like a push. Scripts older than version 3 do not know this
 *    action and treat it as a push — the tool only sends it to a
 *    script whose GET reports version 3 or higher.
 *  - a push payload (no "action", or any other action) — appends the
 *    sheet row, creates the calendar event, and POSTs to Make.
 *    A push may include an optional "calendarId": the event is
 *    created on that calendar instead of CALENDAR_ID. An unknown or
 *    empty calendarId falls back to CALENDAR_ID, so older tools that
 *    never send calendarId keep working unchanged.
 *
 * The tool calls this endpoint with Content-Type: text/plain (not
 * application/json) so the browser does not send a CORS preflight,
 * which Apps Script web apps do not answer. The body is still a JSON
 * string, and doPost parses it.
 *
 * The Sheet's first row (written automatically on first use):
 *  title, date, weekday, start_time, end_time, price, ages, host,
 *  location, description, link, facebook_text, threads_text
 */

// ===== CONFIG — fill these in =====
var SHEET_ID = "";         // Google Sheet ID (the part of the sheet URL between /d/ and /edit)
var CALENDAR_ID = "";      // Google Calendar ID (Calendar settings -> Integrate calendar -> Calendar ID)
var SECRET_KEY = "";       // Optional. If set, requests must include a matching "key" field.
var MAKE_WEBHOOK_URL = ""; // Optional. If set, the event is also POSTed here (Make webhook).

var SHEET_COLUMNS = ["title", "date", "weekday", "start_time", "end_time", "price", "ages", "host", "location", "description", "link", "facebook_text", "threads_text"];
var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function doGet() {
  return jsonOut({
    ok: true,
    service: "Main Eventer Apps Script",
    version: 3,
    sheet: !!SHEET_ID,
    calendar: !!CALENDAR_ID,
    make: !!MAKE_WEBHOOK_URL
  });
}

function doPost(e) {
  var result = { ok: false };
  try {
    var data = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (data.action === "ping") {
      // Health check: answers the config status, writes nothing.
      var ping = { ok: true, service: "Main Eventer Apps Script", sheet: false, calendar: false, make: !!MAKE_WEBHOOK_URL };
      if (SHEET_ID) {
        try { SpreadsheetApp.openById(SHEET_ID); ping.sheet = true; }
        catch (err) { ping.sheetError = String(err && err.message ? err.message : err); }
      }
      if (CALENDAR_ID) {
        try { ping.calendar = !!CalendarApp.getCalendarById(CALENDAR_ID); }
        catch (err) { ping.calendarError = String(err && err.message ? err.message : err); }
      }
      return jsonOut(ping);
    }
    if (SECRET_KEY && data.key !== SECRET_KEY) {
      result.error = "unauthorized";
      return jsonOut(result);
    }
    if (data.action === "listCalendars") {
      // Read-only list of the account's calendars. No sheet row, no
      // event, no Make post — and no lock needed.
      return jsonOut(listCalendars());
    }
    if (!SHEET_ID && !CALENDAR_ID) {
      result.error = "not configured";
      return jsonOut(result);
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      result.sheet = appendSheetRow(data);
      result.calendar = createCalendarEvent(data);
    } finally {
      lock.releaseLock();
    }
    result.make = postToMake(data);
    var sheetOk = !SHEET_ID || result.sheet.ok;
    var calOk = !CALENDAR_ID || result.calendar.ok;
    result.ok = sheetOk && calOk;
    if (!result.ok) result.error = "one or more destinations failed";
  } catch (err) {
    result.ok = false;
    result.error = String(err && err.message ? err.message : err);
  }
  return jsonOut(result);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseDateParts(dateStr) {
  // "YYYY-MM-DD" -> { y, m, d }
  var p = String(dateStr || "").split("-");
  if (p.length !== 3) return null;
  return { y: +p[0], m: +p[1], d: +p[2] };
}

function parseTimeParts(timeStr) {
  // "HH:MM" -> { h, min }
  var p = String(timeStr || "").split(":");
  if (p.length < 2) return null;
  return { h: +p[0], min: +p[1] };
}

function makeDate(dp, tp) {
  if (!dp || !tp) return null;
  // Uses the script timezone — set it to America/Indiana/Indianapolis
  // in Project Settings (see the header comment).
  return new Date(dp.y, dp.m - 1, dp.d, tp.h, tp.min);
}

function fmtTime12(tp) {
  if (!tp) return "";
  var h12 = tp.h % 12;
  if (h12 === 0) h12 = 12;
  var ap = tp.h >= 12 ? "PM" : "AM";
  var mm = tp.min < 10 ? "0" + tp.min : String(tp.min);
  return h12 + ":" + mm + " " + ap;
}

function appendSheetRow(data) {
  if (!SHEET_ID) return { ok: false, skipped: true, reason: "no sheet configured" };
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_COLUMNS);
  }
  var dp = parseDateParts(data.date);
  var st = parseTimeParts(data.startTime);
  var en = parseTimeParts(data.endTime);
  var dObj = (dp && st) ? makeDate(dp, st) : null;
  var dateStr = "";
  var weekday = "";
  if (dp && dObj) {
    dateStr = MONTHS[dp.m - 1] + " " + dp.d + ", " + dp.y;
    weekday = DAYS[dObj.getDay()];
  }
  var row = [
    data.title || "",
    dateStr,
    weekday,
    fmtTime12(st),
    fmtTime12(en),
    data.price || "",
    data.ages || "",
    data.host || "",
    data.location || "",
    data.description || "",
    data.link || "",
    data.facebookText || "",
    data.threadsText || ""
  ];
  sheet.appendRow(row);
  return { ok: true, row: sheet.getLastRow() };
}

function listCalendars() {
  var out = { ok: true, calendars: [] };
  try {
    var defId = "";
    try { defId = CalendarApp.getDefaultCalendar().getId(); } catch (e) {}
    // "primary" = the configured default: CALENDAR_ID when set, else
    // the account's default calendar. That is the calendar pushes use
    // when the tool sends no calendarId.
    var primaryId = CALENDAR_ID || defId;
    var cals = CalendarApp.getAllCalendars();
    for (var i = 0; i < cals.length; i++) {
      var c = cals[i];
      var id = "";
      try { id = c.getId(); } catch (e) { continue; }
      var name = id;
      try { name = c.getName() || id; } catch (e) {}
      out.calendars.push({ id: id, name: name, primary: id === primaryId });
    }
    // If the configured calendar is not in the list (e.g. shared with
    // the account but not returned here), still offer it first so the
    // picker can show the calendar pushes already use.
    var seen = false;
    for (var j = 0; j < out.calendars.length; j++) {
      if (out.calendars[j].id === primaryId) { seen = true; break; }
    }
    if (CALENDAR_ID && !seen) {
      out.calendars.unshift({ id: CALENDAR_ID, name: CALENDAR_ID, primary: true });
    }
  } catch (err) {
    out.ok = false;
    out.error = String(err && err.message ? err.message : err);
  }
  return out;
}

function createCalendarEvent(data) {
  if (!CALENDAR_ID) return { ok: false, skipped: true, reason: "no calendar configured" };
  var dp = parseDateParts(data.date);
  var st = parseTimeParts(data.startTime);
  if (!dp || !st || !data.title) {
    return { ok: false, skipped: true, reason: "needs a name, date, and start time" };
  }
  var en = parseTimeParts(data.endTime);
  var start = makeDate(dp, st);
  var end = en ? makeDate(dp, en) : new Date(start.getTime() + 60 * 60 * 1000);
  // A push may name its own calendar; anything unknown or empty falls
  // back to the configured CALENDAR_ID.
  var calId = (data.calendarId && String(data.calendarId).trim()) || CALENDAR_ID;
  var cal = null;
  try { cal = CalendarApp.getCalendarById(calId); } catch (e) { cal = null; }
  if (!cal && calId !== CALENDAR_ID) {
    calId = CALENDAR_ID;
    try { cal = CalendarApp.getCalendarById(calId); } catch (e) { cal = null; }
  }
  if (!cal) return { ok: false, skipped: true, reason: "calendar not found: " + calId };
  var ev = cal.createEvent(data.title, start, end, {
    location: data.location || "",
    description: data.calendarDescription || ""
  });
  return { ok: true, id: ev.getId(), calendarId: calId };
}

function postToMake(data) {
  if (!MAKE_WEBHOOK_URL) return { ok: false, skipped: true, reason: "no webhook configured" };
  try {
    var resp = UrlFetchApp.fetch(MAKE_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    });
    var code = resp.getResponseCode();
    return { ok: code >= 200 && code < 300, status: code };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}
