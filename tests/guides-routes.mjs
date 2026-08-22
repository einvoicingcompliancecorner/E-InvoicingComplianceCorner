#!/usr/bin/env node
// guides-routes.mjs — the compliance guides are gated, and the gate is the
// route.
//
//   node tests/guides-routes.mjs
//
// Written in the shape roi-gate.mjs argued for and for the same reason:
// it drives site-worker's default export rather than the renderers, and it
// asks "is the document absent" rather than "is the wall present". A
// response can contain both, and only the first question is the gate.
//
// THE DOCUMENT ROUTE IS THE ONE THAT MATTERS MORE HERE. The picker is a
// list of country names, which is public information on every other page
// of this site. /compliance-guides/guide?c=... with seventy codes is six
// D1 queries over every jurisdiction tracked -- the whole corpus, in one
// printable file. That is the thing a session has to be required for, and
// it is required BEFORE the queries run, not after.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { signToken, SESSION_COOKIE } from "../shared/session.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("compliance guides routes");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const SECRET = "test-secret-not-a-real-one";
const { d1 } = await openReplayDb();

// COUNTING THE QUERIES, because "the gate is the route" is a claim about
// work that does not happen, and a test that only reads the HTML cannot
// see the difference between a page that queried D1 and threw the result
// away and one that never asked. This wrapper is the only way to check
// the sentence the code comment actually makes.
let queries = 0;
const countingDb = {
  prepare(sql) {
    queries++;
    return d1.prepare(sql);
  },
};

const env = {
  eicc_content: countingDb,
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: SECRET,
  // No MEMBERS binding: saved countries are documented to fail soft, so
  // its absence exercises that path rather than hiding it.
  ROI_PUBLIC: "true",
};

const get = (path, cookie) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`,
    { headers: cookie ? { Cookie: cookie } : {} }), env, { waitUntil() {} });

const session = async (email = "dan@example.com", ttl = 3600) =>
  `${SESSION_COOKIE}=${await signToken(SECRET, { email, purpose: "session" }, ttl)}`;

// ---- signed out: neither route builds anything -------------------------
for (const path of ["/compliance-guides", "/compliance-guides/guide?c=DE&c=FR"]) {
  queries = 0;
  const res = await get(path);
  const html = await res.text();
  t.check(`signed out ${path}: a page, not a 404`, res.status === 200, `status ${res.status}`);
  t.check(`signed out ${path}: no D1 query ran at all`, queries === 0,
    `${queries} queries ran before the wall — the gate is not the route`);
  t.check(`signed out ${path}: no country page was rendered`,
    !html.includes('class="country"') && !html.includes("statstrip"),
    "guide content reached an anonymous request");
  t.check(`signed out ${path}: no picker form either`,
    !html.includes('id="gpForm"'), "the chooser reached an anonymous request");
  t.check(`signed out ${path}: the wall is noindex`,
    /<meta name="robots" content="noindex,nofollow">/.test(html));
  t.check(`signed out ${path}: the sign-up panel is loaded so the buttons work`,
    /auth-overlay\.js\?v=\d+/.test(html) && html.includes("EICC_AUTH_STRINGS"));
}

// ---- an expired or forged cookie is signed out -------------------------
for (const [label, cookie] of [
  ["expired", await session("dan@example.com", -10)],
  ["forged", `${SESSION_COOKIE}=notatoken.atall`],
]) {
  const html = await (await get("/compliance-guides", cookie)).text();
  t.check(`a ${label} session gets the wall, not the chooser`,
    !html.includes('id="gpForm"'), `${label} cookie was treated as a session`);
}

// ---- signed in: the chooser ---------------------------------------------
{
  const res = await get("/compliance-guides", await session());
  const html = await res.text();
  t.check("signed in: the chooser is served", res.status === 200 && html.includes('id="gpForm"'),
    `status ${res.status}`);

  // A FORM THAT WORKS WITH THE SCRIPT DEAD. The module claims this; here
  // is the check. A real method+action and a real submit button mean the
  // page degrades to "no running total" rather than to "nothing happens".
  t.check("the chooser is a real GET form with a real action",
    /<form method="get" action="\/compliance-guides\/guide"/.test(html));
  t.check("and a real submit button",
    /<button type="submit" class="gp-go"/.test(html));

  const boxes = [...html.matchAll(/<input type="checkbox" name="c" value="([^"]+)"/g)].map((m) => m[1]);
  t.check("every tracked jurisdiction with a deep dive is offered",
    boxes.length >= 60, `${boxes.length} checkboxes`);
  t.check("the European Union is not offered as a country",
    !boxes.includes("EU"), "the bloc is in the picker");
  t.check("no country is offered twice", new Set(boxes).size === boxes.length);

  // PER-READER, SO NEVER IN A SHARED CACHE. The picker ticks the reader's
  // own followed countries; a proxy holding it would hand one
  // subscriber's footprint to the next.
  t.check("the chooser is not cached in a shared cache",
    /no-store|private/.test(res.headers.get("cache-control") || ""),
    res.headers.get("cache-control"));
}

// ---- signed in: the document --------------------------------------------
{
  const res = await get("/compliance-guides/guide?c=DE&c=FR", await session());
  const html = await res.text();
  t.check("signed in: the document is served", res.status === 200, `status ${res.status}`);
  const sections = (html.match(/<section class="country"/g) || []).length;
  t.check("one section per country asked for", sections === 2, `${sections} sections`);

  // THE FIVE TILES ARE THE FEATURE. guides-fit-harness.mjs checks they
  // survive the browser-side fitter; this checks the route emits them at
  // all, which is the half that a broken query would silently drop.
  const tiles = (html.match(/class="statstrip hl"/g) || []).length;
  t.check("both countries carry the headline strip", tiles === 2, `${tiles} strips`);

  t.check("the fitter is shipped with the document",
    html.includes("data-fitted") || html.includes("querySelectorAll('.country')")
      || html.includes('querySelectorAll(".country")'),
    "no fit script — countries would spill onto second pages");
  t.check("the print toolbar is screen-only",
    /@mediaprint\{\.gp-tools\{display:none\}\}/.test(html.replace(/\s+/g, "")),
    "the toolbar would print onto page one");
}

// ---- framed, at Dan's request 22 August ---------------------------------
//
// The chooser opens inside the tracker's panel now, the same way the
// planner does. Three things have to be true of the framed render, and
// each was a real bug in one panel or another on this site first.
{
  const cookie = await session();
  const framed = await (await get("/compliance-guides?frame=1", cookie)).text();
  const plain = await (await get("/compliance-guides", cookie)).text();

  t.check("framed: the page reports its own height to the parent",
    framed.includes("eicc:roi-height"),
    "no reporter — the iframe would keep whatever height the parent guessed");
  t.check("framed: the body is marked so the outer padding can go",
    /<body data-framed="1"/.test(framed));

  // ONE BACK LINK, NOT TWO. The tracker's panel supplies its own above the
  // iframe, because a frame cannot be closed from inside it. A second one
  // in the fetched page would reload the whole tracker INSIDE the frame.
  t.check("framed: the page does not print its own back link",
    !framed.includes('class="gp-back"'),
    "two back links a centimetre apart, doing different things");
  t.check("standalone: it still does",
    plain.includes('class="gp-back"'),
    "the standalone page has no other way out");

  // THE DOCUMENT IS NEVER THE THING IN THE FRAME. It is printable, and a
  // print dialogue inside a content-sized iframe is the experience this
  // whole feature exists to avoid.
  t.check("the chooser sends the guide to a new window",
    /<form[^>]*id="gpForm"[^>]*target="_blank"/.test(framed)
    || /<form[^>]*target="_blank"[^>]*id="gpForm"/.test(framed));

  // A STICKY BAR IS DEAD IN A CONTENT-SIZED FRAME, because the parent does
  // the scrolling and the frame has no scrollport. The framed render
  // therefore carries a second, non-sticky copy at the top -- otherwise
  // the only way to reach Build my guide is to scroll past all seventy
  // countries in the parent window.
  const barsFramed = (framed.match(/class="gp-bar /g) || []).length;
  const barsPlain = (plain.match(/class="gp-bar /g) || []).length;
  t.check("framed: the action bar is reachable without scrolling to the end",
    barsFramed === 2, `${barsFramed} bars`);
  t.check("standalone: one bar, because sticky works there",
    barsPlain === 1, `${barsPlain} bars`);
}

// ---- the wall is framed too ---------------------------------------------
//
// Dan: "When not subscribed, can the subscribe now page launch in-frame,
// similar to the roi-calculator behaviour." The subscribe panel is the
// auth overlay, so what makes it open in-frame is the WALL being framed --
// the overlay then mounts inside the frame instead of the reader being
// sent to another page.
{
  const framedGate = await (await get("/compliance-guides?frame=1")).text();
  t.check("signed out and framed: the wall reports its height too",
    framedGate.includes("eicc:roi-height"));
  t.check("signed out and framed: the sign-up panel loads inside the frame",
    /auth-overlay\.js\?v=\d+/.test(framedGate) && framedGate.includes("EICC_AUTH_STRINGS"));
  t.check("signed out and framed: still no chooser and no guide",
    !framedGate.includes('id="gpForm"') && !framedGate.includes('class="country"'));
}

// ---- the same set, however it is written --------------------------------
//
// ?c=DE&c=FR is what the form emits; ?c=DE,FR is what a person writes.
// Refusing the second would be a rule with no reason behind it.
{
  const cookie = await session();
  const a = await (await get("/compliance-guides/guide?c=DE&c=FR", cookie)).text();
  const b = await (await get("/compliance-guides/guide?c=DE,FR", cookie)).text();
  const names = (h) => [...h.matchAll(/<section class="country">[\s\S]*?<h2>([^<]+)<\/h2>/g)].map((m) => m[1]);
  t.check("comma-separated and repeated parameters mean the same thing",
    JSON.stringify(names(a)) === JSON.stringify(names(b)),
    `${names(a)} vs ${names(b)}`);

  // ORDER IS THE SITE'S, NOT THE READER'S. The cover page is a summary of
  // the same set; a document whose table and pages disagree about order
  // is one a reader has to cross-reference by eye.
  const rev = await (await get("/compliance-guides/guide?c=FR,DE", cookie)).text();
  t.check("the order does not depend on how the reader typed it",
    JSON.stringify(names(rev)) === JSON.stringify(names(a)),
    `${names(rev)} vs ${names(a)}`);
}

// ---- junk in the query string is not an error ---------------------------
{
  const cookie = await session();
  const res = await get("/compliance-guides/guide?c=ZZ&c=DE&c=DE&c=", cookie);
  const html = await res.text();
  const sections = (html.match(/<section class="country"/g) || []).length;
  t.check("unknown codes are dropped and duplicates collapse", res.status === 200 && sections === 1,
    `status ${res.status}, ${sections} sections`);
}

// ---- and nothing at all is answered, not printed ------------------------
{
  const res = await get("/compliance-guides/guide", await session());
  const html = await res.text();
  t.check("an empty selection gets an explanation and a 400, not a blank document",
    res.status === 400 && !html.includes('class="country"') && html.includes("/compliance-guides"),
    `status ${res.status}`);
}

// ---- the strings the two pages promise actually exist -------------------
//
// Both read i18n/<lang>.json's `guides` subtree with English fallbacks, so
// a missing file degrades rather than breaks. That is the right runtime
// behaviour and it is also how a translation gap ships unnoticed: every
// page renders, in English, in four languages. So the file is checked
// here instead.
{
  const KEYS = ["pick.title", "pick.lede", "pick.build", "pick.clear", "pick.all",
    "gateEyebrow", "gateTitle", "gateBody", "gateSubscribe", "doc.print", "doc.change"];
  for (const lang of ["en", "es", "de", "fr"]) {
    let doc = {};
    try { doc = JSON.parse(readFileSync(join(REPO, "i18n", `${lang}.json`), "utf8")); } catch { /* reported below */ }
    const flat = {};
    const walk = (node, prefix) => {
      for (const [k, v] of Object.entries(node || {})) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object") walk(v, key);
        else if (typeof v === "string") flat[key] = v;
      }
    };
    walk(doc.guides, "");
    const missing = KEYS.filter((k) => typeof flat[k] !== "string");
    t.check(`i18n/${lang}.json carries the guides strings`, missing.length === 0,
      `missing: ${missing.join(", ")}`);
  }
}

process.exit(t.report() ? 0 : 1);
