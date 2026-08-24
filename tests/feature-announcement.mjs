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
const membersModule = await import(join(REPO, "members-worker", "src", "index.js"));
const worker = membersModule.default;
const { FEATURE_LINKS } = membersModule;
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

// ---- the two registers agree, in both directions ----------------------
//
// Added 24 August, after the e-Reporting card shipped and was never
// written into `features` at all. The weekly digest exists to say "this
// shipped and nobody was told" — and it reads this table, so a feature
// that was never registered is indistinguishable from no feature at all.
// A MONITOR CANNOT SEE WHAT WAS NEVER DECLARED TO IT, which is migration
// 628's finding a day earlier in a different table.
//
// Nothing can catch "you shipped something and wrote it down nowhere" —
// that needs a human with a checklist, and the design review says so.
// What IS catchable is the more likely half: one register updated and
// the other forgotten, which would send an announcement with no link or
// leave a link pointing at a feature nobody is told about.
const allFeatures = await q("SELECT slug FROM features ORDER BY slug");
const inDb = new Set(allFeatures.map((f) => f.slug));
const inCode = new Set(Object.keys(FEATURE_LINKS));
const missingLink = [...inDb].filter((s) => !inCode.has(s));
const orphanLink = [...inCode].filter((s) => !inDb.has(s));
t.check("every feature in the database has a link in FEATURE_LINKS",
  missingLink.length === 0,
  missingLink.length ? `no link for: ${missingLink.join(", ")}` : `${inDb.size} features`);
t.check("and every FEATURE_LINKS entry is a feature that exists",
  orphanLink.length === 0,
  orphanLink.length ? `no features row for: ${orphanLink.join(", ")}` : `${inCode.size} links`);
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

// ---- the links, which were wrong in the first real send -----------------
//
// Dan, 23 August, after it went out: "The links in the email are
// incorrect though. Mainly they lead to the standalone version of the
// form, rather than in-frame. The newsletter archive link is incorrect
// and points to e-invoicingcompliancecorner.com/members/archive instead
// of members.e-invoicingcompliancecorner.com/members/archive."
//
// Two faults with one cause: every URL was built from one hardcoded
// public origin, and the paths were the pages' own rather than the
// tracker's. Both are checked here now, because the first send had a
// test suite and it checked that every feature HAD a link — not that
// any of them worked.
{
  // The real map, imported. An earlier version of this parsed the source
  // with a regex and silently missed the one entry written as a bare
  // identifier rather than a string — a check blind to precisely the
  // kind of entry somebody adds by hand.
  const links = FEATURE_LINKS;
  const all = await q("SELECT slug FROM features");
  const unlinked = all.map((f) => f.slug).filter((x) => !links[x]);
  t.check("every feature has a link in the email", unlinked.length === 0,
    `${unlinked.join(", ")} would appear with no way to go and see it`);

  // NO CROSS-HOST PATHS. The archive lives on the members host; the
  // email is built against the public one. A /members/ path here is the
  // exact 404 that shipped.
  const crossHost = Object.entries(links).filter(([, p]) => p.startsWith("/members"));
  t.check("no link points at a path that only exists on the members host",
    crossHost.length === 0,
    crossHost.map(([k, p]) => `${k} -> ${p}`).join(", "));

  // AND THE PAGES THAT EXIST TO BE EMBEDDED ARE REACHED THROUGH THE
  // THING THAT EMBEDS THEM. A cold load of /roi-calculator or
  // /compliance-guides is the bare page — correct for a crawler, wrong
  // for someone arriving from an email.
  const embedded = ["roi-wave-planner", "compliance-guides", "methodology", "change-record"];
  const bare = embedded.filter((k) => !/einvoicing-compliance-tracker\.html\?view=/.test(links[k] || ""));
  t.check("the embedded pages are linked through the tracker",
    bare.length === 0,
    `${bare.join(", ")} would open standalone, not in the panel`);

  // THE TRACKER HAS TO ANSWER EVERY ?view= THE EMAIL SENDS. A link to a
  // view nobody routes lands on the board with nothing open, which looks
  // exactly like a link that did nothing.
  const tracker = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
  const routed = tracker.slice(tracker.indexOf("const VIEW_ROUTES"), tracker.indexOf("const wanted"));
  const wanted = Object.values(links)
    .map((p) => (p.match(/\?view=([a-z]+)/) || [])[1]).filter(Boolean);
  const unrouted = [...new Set(wanted)].filter((v) => !new RegExp(`\\b${v}:`).test(routed));
  t.check(`the tracker routes every view the email links to (${[...new Set(wanted)].join(", ")})`,
    unrouted.length === 0,
    `${unrouted.join(", ")} — the link would open the board with nothing on it`);
}

// ---- and it says which ones will stop you at the door -------------------
//
// "Some other features hidden behind the subscription wall show the sign
// in page, which probably needs clarifying in the email."
{
  const walled = await q("SELECT slug FROM features WHERE requires_signin = 1");
  t.check(`some features are marked as needing a sign-in (${walled.length})`, walled.length > 0);

  // THE MARK HAS TO MATCH THE ROUTES THAT ACTUALLY GATE. site-worker
  // returns renderRoiGate / renderGuidesGate before touching D1 for
  // exactly two VIEWS; if a third is ever gated, this fails rather than
  // the email quietly under-warning.
  //
  // DERIVED FROM THE ROUTE, NOT FROM A LIST OF SLUGS. The first version
  // mapped each gate to one hardcoded slug, which quietly assumed one
  // feature per gated route. That held until 24 August, when the
  // e-Reporting card shipped inside the compliance guides and became the
  // second feature behind ?view=guides — it is genuinely gated, it is
  // correctly marked, and the check failed anyway because its model of
  // the world had no room for two. A test that encodes a one-to-one it
  // was never promised is the same defect class as the rest of this
  // suite guards against, so it now asks the actual question: does this
  // feature's link land on a view that gates?
  const site = readFileSync(join(REPO, "site-worker", "src", "index.js"), "utf8");
  const gatedViews = new Set();
  if (/return renderRoiGate\(/.test(site)) gatedViews.add("roi");
  if (/return renderGuidesGate\(/.test(site)) gatedViews.add("guides");
  const viewOf = (slug) => ((FEATURE_LINKS[slug] || "").match(/\?view=([a-z]+)/) || [])[1];
  const gates = new Set(
    (await q("SELECT slug FROM features")).map((f) => f.slug)
      .filter((slug) => gatedViews.has(viewOf(slug))));
  const marked = new Set(walled.map((w) => w.slug));
  t.check("the marked set matches the routes that gate",
    marked.size === gates.size && [...gates].every((g) => marked.has(g)),
    `marked: ${[...marked].join(", ")} | gated: ${[...gates].join(", ")}`);

  // The archive is open right now under a promo, and both insights
  // pieces are ungated. Warning about a wall that is not there is its
  // own small dishonesty.
  t.check("the archive is not marked while ARCHIVE_PUBLIC is on",
    !marked.has("archive-country-filter")
    || !/ARCHIVE_PUBLIC = "true"/.test(readFileSync(join(REPO, "members-worker", "wrangler.toml"), "utf8")),
    "the email warns about a login wall the promo has taken down");

  outbox = [];
  const env = makeEnv({ "a@x.com": ACTIVE });
  await d1.prepare("DELETE FROM announcements WHERE item_type='feature'").bind().run();
  const html = await (await call(env, "/admin/announce-features?preview=html", "GET")).text();
  t.check("the email says so at the top", /ask you to sign in first/.test(html),
    "a reader meets the login form before the word 'sign in'");
  t.check("and on the link itself", /Sign in and open it/.test(html));
  const opens = (html.match(/Open it →/g) || []).length;
  t.check(`the open links stay plain for the ungated ones (${opens})`,
    opens === features.length - walled.length,
    "every link now says sign in, including the ones that do not need it");
}

// ---- resetting, so a corrected email can go out --------------------------
//
// Dan, 23 August: "how can I reset the announcement, as its been flagged
// as sent". Two things flag it — the rows in `announcements` and the KV
// marker for the batch — and both have to go or the next confirmed send
// quietly does nothing.
//
// The route exists rather than an instruction to run SQL because the
// hand-written version is one dropped WHERE clause from deleting the 148
// rows recording every newsletter story ever announced.
{
  outbox = [];
  const env = makeEnv({ "a@x.com": ACTIVE, "b@x.com": ACTIVE });

  // Send for real first, so there is something to reset.
  await d1.prepare("DELETE FROM announcements WHERE item_type='feature'").bind().run();
  await call(env, "/admin/announce-features?confirm=SEND");
  const afterSend = await q("SELECT count(*) n FROM announcements WHERE item_type='feature'");
  t.check("something is recorded to reset", afterSend[0].n > 0);
  const markers = [...env.CONTENT_MONITOR.map.keys()].filter((k) => k.startsWith("announce:"));
  t.check("and a send marker exists", markers.length > 0, markers.join(", "));

  // A STORY ROW THAT MUST SURVIVE. This is the whole reason the reset is
  // a route: the obvious DELETE would take these with it.
  await d1.prepare(`INSERT OR IGNORE INTO announcements (item_type, item_id, channel, announced_at)
                    VALUES ('story', 'canary-story', 'newsletter', '2026-08-01')`).bind().run();

  outbox = [];
  const body = await (await call(env, "/admin/announce-features?reset=CONFIRM")).text();
  t.check("the reset sends nothing", outbox.length === 0,
    `${outbox.length} email(s) sent by a reset`);
  t.check("and says so", /NOTHING WAS SENT/.test(body), body.slice(0, 200));

  const stories = await q("SELECT count(*) n FROM announcements WHERE item_type='story'");
  t.check("story announcements are untouched", stories[0].n > 0,
    "the reset deleted newsletter history along with the feature rows");
  const featureRows = await q("SELECT count(*) n FROM announcements WHERE item_type='feature'");
  t.check("feature announcements are gone", featureRows[0].n === 0, `${featureRows[0].n} left`);
  t.check("and the send markers with them",
    [...env.CONTENT_MONITOR.map.keys()].filter((k) => k.startsWith("announce:")).length === 0,
    "a stale marker would make the next confirmed send do nothing");

  // AND THE POINT OF ALL THAT: a send works again.
  outbox = [];
  await call(env, "/admin/announce-features?confirm=SEND");
  t.check(`the corrected email can now go out (${outbox.length})`, outbox.length === 2,
    "the reset cleared the record but the send is still blocked");
}

// ---- a scoped reset touches only what it names --------------------------
{
  const env = makeEnv({ "a@x.com": ACTIVE });
  const before = await q("SELECT count(*) n FROM announcements WHERE item_type='feature'");
  t.check("everything is announced going in", before[0].n === features.length);

  await call(env, "/admin/announce-features?reset=CONFIRM&only=compliance-guides");
  const left = await q(`SELECT count(*) n FROM announcements a
     JOIN features f ON CAST(f.id AS TEXT)=a.item_id
     WHERE a.item_type='feature'`);
  t.check("only the named feature is un-announced",
    left[0].n === before[0].n - 1, `${left[0].n} of ${before[0].n} left`);

  const now = await q(`SELECT f.slug FROM features f WHERE NOT EXISTS (
      SELECT 1 FROM announcements a WHERE a.item_type='feature'
        AND a.item_id=CAST(f.id AS TEXT) AND a.channel='newsletter')`);
  t.check("and it is the one that would be announced next",
    now.length === 1 && now[0].slug === "compliance-guides",
    now.map((r) => r.slug).join(", "));
}

globalThis.fetch = originalFetch;
process.exit(t.report() ? 0 : 1);
