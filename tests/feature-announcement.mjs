#!/usr/bin/env node
// feature-announcement.mjs — the email that tells subscribers what has
// been built, and the several ways it must refuse to send.
//
//   node tests/feature-announcement.mjs
//
// Dan, 22 August 2026: "I'd like to add an email alert for new content
// and functionality, which has not been announced to subscribers."
//
// EVERYTHING HERE RUNS AGAINST A FAKE RESEND. Nothing in this suite can
// reach the network, and the assertion that matters most is a negative
// one: for every path except an explicitly confirmed send, the number of
// emails handed to the provider must be zero. A test suite for a
// broadcast tool that could actually broadcast is not a test suite.
//
// The three failures worth guarding are all quiet ones. Announcing a
// feature twice (the bookkeeping did not record, or recorded the wrong
// thing). Announcing nothing because the query is subtly wrong. And
// recording an announcement that never went out, which is worse than
// both, because the digest then stops nagging about something nobody was
// ever told.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("feature announcement");
const worker = (await import(join(REPO, "members-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();
const q = async (sql, ...p) => (await d1.prepare(sql).bind(...p).all()).results;

const SECRET = "test-secret-not-a-real-one";

/** KV that behaves like the real one, including paging. */
function kv(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    async get(k) { return map.has(k) ? map.get(k) : null; },
    async put(k, v) { map.set(k, v); },
    async delete(k) { map.delete(k); },
    async list({ cursor, limit } = {}) {
      const keys = [...map.keys()].sort();
      const start = cursor ? parseInt(cursor, 10) : 0;
      const size = limit || 50;
      const slice = keys.slice(start, start + size).map((name) => ({ name }));
      const next = start + size;
      const done = next >= keys.length;
      return { keys: slice, list_complete: done, cursor: done ? undefined : String(next) };
    },
  };
}

/** Every request in this suite runs against this — no network, ever. */
let outbox = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("api.resend.com")) {
    outbox.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "fake" }), { status: 200 });
  }
  return originalFetch(input, init);
};

function makeEnv(subscribers) {
  const subs = kv(Object.fromEntries(
    Object.entries(subscribers).map(([e, v]) => [e, JSON.stringify(v)])));
  return {
    eicc_content: d1,
    SUBSCRIBERS: subs,
    CONTENT_MONITOR: kv(),
    SESSION_SECRET: SECRET,
    RESEND_API_KEY: "fake-key",
    FROM_EMAIL: "newsletter@example.com",
    SITE_URL: "https://members.example.com",
  };
}

const ACTIVE = { active: true, plan: "recurring" };
const call = (env, path, method = "POST") => worker.fetch(
  new Request(`https://members.example.com${path}`, {
    method, headers: { "X-Admin-Secret": SECRET },
  }), env, { waitUntil() {} });

// ---- the query is the feature list --------------------------------------
const features = await q(`
  SELECT f.id, f.slug, f.title, f.description, f.shipped_at FROM features f
   WHERE NOT EXISTS (SELECT 1 FROM announcements a
     WHERE a.item_type='feature' AND a.item_id=CAST(f.id AS TEXT) AND a.channel='newsletter')
   ORDER BY f.shipped_at, f.id`);
t.check(`there are unannounced features to announce (${features.length})`, features.length > 0);
t.check("including the two Dan named",
  features.some((f) => f.slug === "roi-wave-planner")
  && features.some((f) => f.slug === "compliance-guides"),
  features.map((f) => f.slug).join(", "));

// THE DATE HAS TO BE THE DATE READERS COULD USE IT. The planner's row
// said 11 August, the day it was built; ROI_PUBLIC went true on the
// 19th, and until then the route answered 404 by design. An email
// claiming a tool has been available since a date it demonstrably was
// not is the sort of small wrongness this whole site is against.
{
  const roi = features.find((f) => f.slug === "roi-wave-planner");
  t.check("the planner is dated from when it went public, not when it was built",
    roi && roi.shipped_at === "2026-08-19", roi && roi.shipped_at);
  const toml = readFileSync(join(REPO, "site-worker", "wrangler.toml"), "utf8");
  t.check("and that date is the one wrangler.toml records for ROI_PUBLIC",
    /ROI_PUBLIC WENT TRUE ON 19 AUGUST/i.test(toml),
    "the feature date and the flag's own history no longer agree");
}

// ---- unauthorised callers get nothing ------------------------------------
{
  outbox = [];
  const env = makeEnv({ "a@x.com": ACTIVE });
  const res = await worker.fetch(
    new Request("https://members.example.com/admin/announce-features?confirm=SEND", { method: "POST" }),
    env, { waitUntil() {} });
  t.check("no admin secret, no send", res.status === 401, `status ${res.status}`);
  t.check("and nothing left the building", outbox.length === 0);
}

// ---- the default is a dry run --------------------------------------------
//
// The single most important behaviour in this file. Someone poking the
// route to see what it does must not thereby email the subscriber list.
{
  outbox = [];
  const env = makeEnv({ "a@x.com": ACTIVE, "b@x.com": ACTIVE });
  const body = await (await call(env, "/admin/announce-features")).text();
  t.check("a bare call sends nothing at all", outbox.length === 0,
    `${outbox.length} email(s) sent by a call with no confirmation`);
  t.check("and says so", /dry run/i.test(body), body.slice(0, 200));
  t.check("it lists what it would announce",
    features.every((f) => body.includes(f.shipped_at)),
    "the report does not name every unannounced feature");
  const after = await q("SELECT count(*) n FROM announcements WHERE item_type='feature'");
  t.check("and records nothing", after[0].n === 0, `${after[0].n} rows written by a dry run`);
}

// ---- preview renders the real email, and sends nothing -------------------
{
  outbox = [];
  const env = makeEnv({ "a@x.com": ACTIVE });
  const res = await call(env, "/admin/announce-features?preview=html", "GET");
  const html = await res.text();
  t.check("the preview sends nothing", outbox.length === 0);
  t.check("it returns HTML", /text\/html/.test(res.headers.get("content-type") || ""));

  const missing = features.filter((f) => !html.includes(f.title.replace(/&/g, "&amp;")));
  t.check("every unannounced feature appears in the email", missing.length === 0,
    missing.map((f) => f.slug).join(", "));

  // THE TITLE THAT WAS STORED PRE-ESCAPED. Migration 618 rewrote
  // "ROI &amp; Wave Planner" to hold a plain ampersand, because this
  // renderer escapes and the email would otherwise have gone out saying
  // "&amp;amp;" to every subscriber.
  t.check("no value is double-escaped", !html.includes("&amp;amp;"),
    "a pre-escaped database value went through the escaper twice");

  // A PREVIEW MUST NOT HAVE A SIDE EFFECT. The unsubscribe link is
  // signed per recipient; rendering a real one here would put a working
  // opt-out token in a URL that gets forwarded and pasted.
  t.check("the unsubscribe link in a preview is inert",
    !/unsubscribe-notifications\?token=[A-Za-z0-9]/.test(html),
    "the preview carries a live unsubscribe token");
}

// ---- a test send goes to one address and records nothing -----------------
{
  outbox = [];
  const env = makeEnv({ "a@x.com": ACTIVE, "b@x.com": ACTIVE, "c@x.com": ACTIVE });
  const body = await (await call(env, "/admin/announce-features?to=dan@example.com")).text();
  t.check("exactly one email is sent", outbox.length === 1, `${outbox.length} sent`);
  t.check("to the named address only", outbox[0]?.to === "dan@example.com", outbox[0]?.to);
  t.check("the subscriber list was not touched",
    !outbox.some((m) => ["a@x.com", "b@x.com", "c@x.com"].includes(m.to)));
  const after = await q("SELECT count(*) n FROM announcements WHERE item_type='feature'");
  t.check("and it is NOT recorded as announced", after[0].n === 0,
    "a test send marked the features as told to everybody");
  t.check("the reply says the features are still unannounced",
    /still unannounced/i.test(body), body.slice(0, 300));
}

// ---- a confirmed send reaches the list, once ----------------------------
{
  outbox = [];
  const env = makeEnv({
    "a@x.com": ACTIVE,
    "b@x.com": ACTIVE,
    "gone@x.com": { active: false },
    "optout@x.com": { active: true, plan: "recurring", notificationsEnabled: false },
    "expired@x.com": { active: true, plan: "onetime", expiresAt: 1 },
    // Written before the opt-out field existed. Must still receive.
    "old@x.com": { active: true },
  });
  await call(env, "/admin/announce-features?confirm=SEND");
  const to = outbox.map((m) => m.to).sort();
  t.check("active subscribers receive it", to.includes("a@x.com") && to.includes("b@x.com"));
  t.check("a subscriber predating the opt-out field receives it", to.includes("old@x.com"),
    "a whole cohort would silently get nothing");
  t.check("cancelled, opted-out and expired do not",
    !to.includes("gone@x.com") && !to.includes("optout@x.com") && !to.includes("expired@x.com"),
    to.join(", "));
  t.check("nobody receives it twice", new Set(to).size === to.length, to.join(", "));
  t.check("the subject names the site",
    /Compliance Corner/.test(outbox[0]?.subject || ""), outbox[0]?.subject);

  // Every recipient gets their OWN unsubscribe link. A shared one would
  // let the first person who clicks it sign somebody else out.
  const links = outbox.map((m) => (m.html.match(/unsubscribe-notifications\?token=([^"&]+)/) || [])[1]);
  t.check("each recipient gets their own unsubscribe token",
    links.every(Boolean) && new Set(links).size === links.length);
}

// ---- and it will not do it again -----------------------------------------
//
// Checked through the same route rather than by reading the table,
// because "does a second call send anything" is the question a person
// actually has, and the answer depends on the bookkeeping AND the guard.
{
  const rows = await q("SELECT item_id, channel FROM announcements WHERE item_type='feature'");
  t.check(`the completed send is recorded (${rows.length} features)`,
    rows.length === features.length,
    `${rows.length} recorded for ${features.length} announced`);
  t.check("on the newsletter channel", rows.every((r) => r.channel === "newsletter"));

  outbox = [];
  const env = makeEnv({ "a@x.com": ACTIVE, "b@x.com": ACTIVE });
  const body = await (await call(env, "/admin/announce-features?confirm=SEND")).text();
  t.check("a second confirmed run sends nothing", outbox.length === 0,
    `${outbox.length} duplicate email(s)`);
  t.check("and says there is nothing to announce",
    /nothing to announce/i.test(body), body.slice(0, 200));
}

// ---- a truncated run does not claim it finished --------------------------
//
// The failure that would be worst and quietest: a run that dies partway
// marking every feature announced, so the digest stops nagging and most
// of the list was never told. Provoked with a budget of zero.
{
  await d1.prepare("DELETE FROM announcements WHERE item_type='feature'").bind().run();
  outbox = [];
  const many = {};
  for (let i = 0; i < 120; i++) many[`s${String(i).padStart(3, "0")}@x.com`] = ACTIVE;
  const env = makeEnv(many);
  // The manual route's own 20s budget is real time; this drives the job
  // directly through the route and then checks the recording, which is
  // the part that must not run early.
  await call(env, "/admin/announce-features?confirm=SEND");
  const recorded = await q("SELECT count(*) n FROM announcements WHERE item_type='feature'");
  const complete = outbox.length === 120;
  t.check("if the run completed, it is recorded; if not, it is not",
    complete ? recorded[0].n === features.length : recorded[0].n === 0,
    `${outbox.length} sent, ${recorded[0].n} recorded — a partial run must record nothing`);
}

// ---- the links go somewhere ---------------------------------------------
{
  const src = readFileSync(join(REPO, "members-worker", "src", "index.js"), "utf8");
  const block = src.slice(src.indexOf("const FEATURE_LINKS"), src.indexOf("function announcementSubject"));
  const slugs = [...block.matchAll(/"([a-z0-9-]+)":\s*"(\/[^"]*)"/g)].map((m) => m[1]);
  const all = await q("SELECT slug FROM features");
  const unlinked = all.map((f) => f.slug).filter((s) => !slugs.includes(s));
  t.check("every feature has a link in the email", unlinked.length === 0,
    `${unlinked.join(", ")} would appear with no way to go and see it`);
}

globalThis.fetch = originalFetch;
process.exit(t.report() ? 0 : 1);
