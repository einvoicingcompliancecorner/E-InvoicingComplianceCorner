#!/usr/bin/env node
// roi-gate.mjs — a signed-out request for the planner does not receive the
// planner, and a signed-in one does.
//
//   node tests/roi-gate.mjs
//
// WHY THIS EXISTS, AND WHY IT DRIVES THE ROUTER RATHER THAN THE RENDERER.
//
// Dan, 21 August 2026: "gate the whole roi-calculator page, rather than
// show any of it." This is the THIRD gate built for this page, and the
// first two are the reason the check is written this way.
//
// The previous one lived in the tracker's own markup: it drew an offer in
// a panel instead of mounting the frame. It looked exactly right and it
// withheld nothing, because /roi-calculator answered anyone who typed it.
// A test of that gate's MARKUP would have passed on every commit of its
// life while the thing it claimed to protect stood wide open.
//
// The lesson menu-routes.mjs already wrote down, in a different place:
// "the page was perfect and the site was refusing to serve it, and those
// are tested by different things." Same shape here, inverted. The page is
// fine; the question is what the ROUTE hands out. So this imports
// site-worker's default export and calls fetch() — the real router, the
// real flag, the real session check — and then asks not "is the gate
// present" but "is the tool absent".
//
// THOSE ARE DIFFERENT QUESTIONS AND ONLY THE SECOND ONE IS THE GATE.
// A response can contain both.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { signToken, SESSION_COOKIE } from "../shared/session.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("roi gate");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const SECRET = "test-secret-not-a-real-one";

// The asset layer, answering exactly what the real one answers: the
// checked-in i18n file. Reading the real file rather than a fixture is
// deliberate — the gate's strings come from there, so a missing
// roiPanel.gate* key should fail HERE rather than in production.
// The REAL replayed database, not a stub returning nothing. The gate
// path never touches D1 -- that is rather the point of it -- but the
// signed-in path renders the whole planner, and renderRoiPage() refuses
// to build a scorecard out of zero benchmarks and says so by throwing.
// A stub thin enough for the branch under test would have made the
// control case impossible to run, which is its own kind of answer.
const { d1 } = await openReplayDb();

const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: SECRET,
  // No MEMBERS binding on purpose: saved countries are documented to fail
  // soft, so its absence exercises that path rather than hiding it.
  ROI_PUBLIC: "true",
  ROI_INDEXABLE: "false",
};

const get = (path, cookie) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`,
    { headers: cookie ? { Cookie: cookie } : {} }), env, { waitUntil() {} });

// ---- signed out --------------------------------------------------------
{
  const res = await get("/roi-calculator");
  const html = await res.text();
  t.check("a signed-out request still gets a page, not a 404 or a redirect",
    res.status === 200, `status ${res.status}`);

  // THE TOOL IS ABSENT. Named by the ids the planner's own script drives,
  // because those are what make it a working tool rather than a picture of
  // one: no Calculate button, no results container, no country picker, no
  // inputs to type into.
  for (const id of ["run", "results", "countryList", "summary", "gantt", "scope"]) {
    t.check(`signed out: the planner's #${id} is not in the response`,
      !html.includes(`id="${id}"`), `#${id} was served to an anonymous request`);
  }
  t.check("signed out: no benchmark data is shipped either",
    !html.includes("ROI_BENCHMARKS") && !html.includes("__ROI_SUBSCRIBED__"),
    "the page shipped its data even though it did not ship its tool");

  // AND THE OFFER IS PRESENT, which is the half a reader sees. Checked
  // against the real i18n file rather than a copy of the sentence.
  const en = JSON.parse(readFileSync(join(REPO, "i18n", "en.json"), "utf8"));
  const gate = en.roiPanel || {};
  t.check("the four gate strings still exist in i18n/en.json",
    ["gateEyebrow", "gateTitle", "gateBody", "gateSubscribe"].every((k) => typeof gate[k] === "string"),
    JSON.stringify(Object.keys(gate)));
  t.check("signed out: the offer's own words are on the page",
    html.includes(gate.gateEyebrow) && html.includes(gate.gateSubscribe),
    "the gate rendered without the strings it is supposed to use");

  // The panel is what the two controls open, so it has to be loaded.
  t.check("signed out: the sign-up panel is loaded, so the buttons can do something",
    /auth-overlay\.js\?v=\d+/.test(html) && html.includes("EICC_AUTH_STRINGS"),
    "no auth-overlay.js — the gate's buttons would be dead");

  // A WALL MUST NEVER BE INDEXED. Ranking for the planner and landing
  // every arrival on a page that does not contain it is worse than not
  // ranking at all.
  t.check("signed out: the wall is noindex regardless of ROI_INDEXABLE",
    /<meta name="robots" content="noindex,nofollow">/.test(html));
}

// ---- and with ROI_INDEXABLE on, the wall stays out of the index --------
{
  const res = await worker.fetch(
    new Request("https://e-invoicingcompliancecorner.com/roi-calculator"),
    { ...env, ROI_INDEXABLE: "true" }, { waitUntil() {} });
  const html = await res.text();
  t.check("the wall is noindex even when the planner is indexable",
    /content="noindex,nofollow"/.test(html),
    "ROI_INDEXABLE leaked into the gate — search engines would index the door");
}

// ---- signed in ---------------------------------------------------------
//
// The D1 stub returns no rows, so the planner renders empty. That is
// fine and is the point: what is under test is WHICH BRANCH ran, and the
// planner's own correctness has ten other suites. If the gate ever
// swallowed a signed-in reader, this is what would say so.
{
  const token = await signToken(SECRET, { email: "dan@example.com", purpose: "session" }, 3600);
  const res = await get("/roi-calculator", `${SESSION_COOKIE}=${token}`);
  const html = await res.text();
  t.check("a signed-in request gets the planner", res.status === 200 && html.includes('id="run"'),
    `status ${res.status}, has #run: ${html.includes('id="run"')}`);
  t.check("and not the wall",
    !html.includes("roi-gate-cta"), "the gate was served to a signed-in reader");
  t.check("and it is not cached in a shared cache",
    /private|no-store/.test(res.headers.get("cache-control") || ""),
    res.headers.get("cache-control"));
}

// ---- an expired or forged cookie is signed out, not signed in ----------
{
  const stale = await signToken(SECRET, { email: "dan@example.com", purpose: "session" }, -10);
  const forged = "notatoken.atall";
  for (const [label, cookie] of [["expired", stale], ["forged", forged]]) {
    const html = await (await get("/roi-calculator", `${SESSION_COOKIE}=${cookie}`)).text();
    t.check(`${label === "expired" ? "an" : "a"} ${label} session gets the wall, not the planner`,
      !html.includes('id="run"') && html.includes("roi-gate-cta"),
      `${label} cookie was treated as a session`);
  }
}

// ---- the flag still wins ----------------------------------------------
//
// ROI_PUBLIC decides whether the route EXISTS; the gate decides who may
// have what is behind it. Those are different questions and the previous
// gate's comment confused them out loud, claiming the flag was the gate.
{
  const res = await worker.fetch(
    new Request("https://e-invoicingcompliancecorner.com/roi-calculator"),
    { ...env, ROI_PUBLIC: "false" }, { waitUntil() {} });
  t.check("ROI_PUBLIC=false is still a 404, for the gate as well as the planner",
    res.status === 404, `status ${res.status}`);
}

process.exit(t.report() ? 0 : 1);
