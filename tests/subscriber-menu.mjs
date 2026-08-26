#!/usr/bin/env node
// subscriber-menu.mjs — the Menu's Subscribers item, and the relay behind it.
//
//   node tests/subscriber-menu.mjs
//
// WHY THIS EXISTS. Dan, 26 August 2026: "please could you add a Menu entry
// on the tracker for signed in readers ... labelled as 'Subscribers', in
// the same way the Compliance Guide, Specification Register and ROI & Wave
// Planner shows in the menu. I would also like the ability to manage
// removed from the newsletter archive."
//
// Three things had to be true at once and none of them is visible by
// reading one file:
//
//   1. THE ITEM EXISTS ONLY FOR A READER WITH A SESSION. The tracker is a
//      static asset and cannot know that, so site-worker injects it into a
//      marker. A marker that stops matching fails silently and every
//      subscriber loses the menu entry with nothing logged as an error.
//
//   2. THE RELAY CARRIES A WRITE. /api/preferences is the first POST on
//      this origin that reaches members-worker. It must forward one exact
//      path, must not invent a session, and must not answer methods
//      nobody asked it to.
//
//   3. THE OLD ROUTE IS GONE. The archive's manage-preferences link was
//      removed at Dan's request, so the injected item is now the ONLY
//      in-site route to preferences. If the injection breaks and the
//      archive link is gone, subscribers have no way in at all except the
//      welcome email — which is why 1 is checked against the real worker
//      rather than by reading the template.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";
import { signToken, SESSION_COOKIE } from "../shared/session.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("subscriber menu");

const SECRET = "test-secret-not-a-real-one";
const TRACKER = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");

// ---- 0. the marker the injection depends on ----------------------------
t.check("the tracker asset carries the subscriber-menu marker",
  TRACKER.includes("<!-- SUBSCRIBER MENU -->"),
  "site-worker replaces this marker; without it the injection logs and "
  + "serves a menu with no Subscribers item, which looks like the feature "
  + "was never built");

const { d1 } = await openReplayDb();
const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;

// A members-worker stand-in that records what reached it.
const seenByMembers = [];
const membersStub = {
  async fetch(req) {
    const body = req.method === "POST" ? await req.text() : "";
    seenByMembers.push({ url: req.url, method: req.method, cookie: req.headers.get("Cookie") || "", body });
    return new Response("<html><body><div class=\"wrap\">prefs</div></body></html>",
      { status: 200, headers: { "content-type": "text/html" } });
  },
};

const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8"),
        { headers: { "content-type": "text/html" } }); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: SECRET,
  MEMBERS: membersStub,
  ROI_PUBLIC: "true",
};

const session = await signToken(SECRET, { purpose: "session", email: "dan@example.com" }, 3600);
const get = (path, opts = {}) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`, opts), env, { waitUntil() {} });
const asSubscriber = (path, opts = {}) => get(path, {
  ...opts, headers: { ...(opts.headers || {}), Cookie: `${SESSION_COOKIE}=${session}` } });

// ---- 1. the item appears only with a session ---------------------------
{
  const anon = await (await get("/")).text();
  const signed = await (await asSubscriber("/")).text();

  t.check("a signed-out reader is offered no Subscribers item",
    !/id="ddSubscribers"/.test(anon),
    "a menu item pointing at a page the reader cannot use is the false "
    + "promise the padlock was removed for in August");
  t.check("and a signed-in reader is",
    /id="ddSubscribers"/.test(signed) && /data-i18n="menu\.subscribers"/.test(signed));

  // THE MARKER IS CONSUMED, not merely appended next to. If the injection
  // ever left the comment behind AND added the item, this passes; if it
  // left the comment behind and added nothing, the check above catches it.
  // Both are worth separating because they fail for different reasons.
  t.check("the injected menu item is a real link to the panel route",
    /id="ddSubscribers"[^>]*href="\/subscribers"|href="\/subscribers"[^>]*id="ddSubscribers"/.test(signed),
    signed.split("ddSubscribers")[0].slice(-120));
}

// ---- 2. the route the panel pushes is actually served ------------------
{
  const direct = await asSubscriber("/subscribers");
  t.check("/subscribers serves the tracker rather than a 404",
    direct.status === 200,
    `status ${direct.status} — a refresh on the panel's own URL would break`);
}

// ---- 3. the relay ------------------------------------------------------
{
  seenByMembers.length = 0;
  const g = await asSubscriber("/api/preferences");
  t.check("the relay forwards a GET to members-worker",
    g.status === 200 && seenByMembers.length === 1
      && seenByMembers[0].url.endsWith("/members/preferences"),
    JSON.stringify(seenByMembers[0] || null));

  // THE COOKIE IS THE WHOLE POINT. Cross-origin fetch omits it by
  // default, which is the defect the archive relay was built to fix; a
  // relay that dropped it would answer every subscriber the sign-in wall.
  t.check("and carries the reader's cookie across the hop",
    (seenByMembers[0] || {}).cookie.includes(SESSION_COOKIE));

  // AND IT IS NOT PUBLICLY CACHEABLE. This response is one reader's
  // country selection.
  t.check("the relayed response is private and varies on Cookie",
    /private/.test(g.headers.get("Cache-Control") || "")
      && /Cookie/i.test(g.headers.get("Vary") || ""),
    `${g.headers.get("Cache-Control")} / ${g.headers.get("Vary")}`);

  seenByMembers.length = 0;
  const p = await asSubscriber("/api/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "countries=France&countries=T%C3%BCrkiye&notificationsEnabled=on",
  });
  t.check("the relay forwards a POST, body intact",
    p.status === 200 && seenByMembers.length === 1
      && seenByMembers[0].method === "POST"
      && seenByMembers[0].body.includes("countries=France")
      && decodeURIComponent(seenByMembers[0].body).includes("Türkiye"),
    JSON.stringify(seenByMembers[0] || null));

  // ONE PATH, AND ONLY THE TWO METHODS IT NEEDS. This is the first write
  // relay on the public origin; the shape of the mistake it must not make
  // is becoming a general door into members-worker.
  seenByMembers.length = 0;
  const del = await asSubscriber("/api/preferences", { method: "DELETE" });
  t.check("and answers nothing else",
    del.status !== 200 && seenByMembers.length === 0,
    `DELETE got ${del.status} and ${seenByMembers.length} upstream call(s)`);

  // IT AUTHORISES NOTHING. Without a session the relay still forwards --
  // members-worker is what refuses, and it must be given the chance to.
  // What matters is that the relay does not manufacture a cookie.
  seenByMembers.length = 0;
  await get("/api/preferences");
  t.check("a signed-out request reaches members-worker with no session",
    seenByMembers.length === 1 && !seenByMembers[0].cookie.includes(SESSION_COOKIE),
    JSON.stringify(seenByMembers[0] || null));

  // With no binding at all it is a 404, not a 500 — the same fail-soft
  // shape as the archive relay.
  const unbound = await worker.fetch(
    new Request("https://e-invoicingcompliancecorner.com/api/preferences"),
    { ...env, MEMBERS: null }, { waitUntil() {} });
  t.check("and is simply absent when members-worker is not bound",
    unbound.status === 404, `status ${unbound.status}`);
}

// ---- 4. the archive no longer offers the old route ---------------------
{
  const members = readFileSync(join(REPO, "members-worker", "src", "index.js"), "utf8");
  t.check("the newsletter archive no longer links to preferences",
    !/archive\.managePrefs/.test(members),
    "Dan asked for this removed: \"It does not make sense to exist there "
    + "now, as we have so many other subscriber features.\"");
  // And the string went with it rather than being left to drift.
  t.check("and its translations went with it",
    !/managePrefs:/.test(members),
    "four unused strings in a table nothing reads is the state migration "
    + "589's sweep exists to prevent");
  // THE WELCOME EMAIL IS THE OTHER ROUTE AND MUST SURVIVE. With the
  // archive link gone and the menu item only visible to a signed-in
  // reader, this is what a brand-new subscriber has.
  t.check("the welcome email still offers a preferences link",
    /Manage my preferences/.test(members) && /members\/preferences/.test(members));
}

process.exit(t.report() ? 0 : 1);
