#!/usr/bin/env node
// structured-data.mjs — the JSON-LD must say what the page says.
//
//   node tests/structured-data.mjs
//
// Added 22 August 2026. An outside strategy review pointed out that a
// site whose entire asset is structured regulatory data published none of
// it machine-readably — zero files contained application/ld+json — and it
// was right.
//
// WHAT THIS SUITE IS ACTUALLY GUARDING. Not "is there markup": that is
// the easy half and a grep would do it. Structured data is the cheapest
// place on a website to assert something nobody checks, and the failure
// mode is not an error — it is a page quietly telling a crawler a date,
// a rating or an answer that is not on the page and not in the database.
// So every check below compares the markup against either the visible
// page or the row it came from.
//
// The three claims most worth refusing are the three this site could
// plausibly have made: an FAQPage with no questions on the page, a
// publication date on a reference page that has none, and a piece marked
// freely readable while the wall is up.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("structured data");
const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();

const env = {
  eicc_content: d1,
  SESSION_SECRET: "test-secret-not-a-real-one",
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
};
const get = (path) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`), env, { waitUntil() {} });

const BLOCKS = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
function ldOf(html, label) {
  const nodes = [];
  for (const m of html.matchAll(BLOCKS)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); }
    catch (e) {
      t.check(`${label}: the JSON-LD parses`, false, e.message);
      continue;
    }
    nodes.push(...(parsed["@graph"] || [parsed]));
  }
  return nodes;
}
const typeOf = (nodes, type) => nodes.find((n) => n["@type"] === type);

// ---- the front door -----------------------------------------------------
{
  const html = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
  const nodes = ldOf(html, "tracker");
  const org = typeOf(nodes, "Organization");
  const site = typeOf(nodes, "WebSite");
  t.check("the tracker declares an Organization", !!org);
  t.check("and a WebSite", !!site);
  t.check("the WebSite points at the Organization by @id",
    site?.publisher?.["@id"] === org?.["@id"],
    "a dangling reference is worse than no reference");

  // THE MACHINE-READABLE HALF OF /methodology. If that page ever moves or
  // goes, this property points at a 404 and the site claims editorial
  // principles it does not publish.
  t.check("publishingPrinciples points at the methodology page",
    org?.publishingPrinciples === "https://e-invoicingcompliancecorner.com/methodology");
  const method = await get("/methodology");
  t.check("and that page is actually served", method.status === 200, `status ${method.status}`);
}

// ---- a country page -----------------------------------------------------
{
  const html = await (await get("/germany")).text();
  const nodes = ldOf(html, "/germany");
  const page = typeOf(nodes, "WebPage");
  t.check("a country page declares a WebPage", !!page);
  t.check("it references the site and publisher by @id",
    page?.isPartOf?.["@id"] && page?.publisher?.["@id"]);

  // WebPage, NOT Article. An Article asserts a publication date and an
  // author; a deep dive is a continuously revised reference and has
  // neither. Inventing them to fill the schema is the exact failure this
  // suite exists for.
  t.check("it is not marked up as an Article",
    !typeOf(nodes, "Article"),
    "a reference page claiming a byline and a publication date it does not have");
  t.check("and asserts no datePublished", !page?.datePublished);

  // dateModified must be the date the page displays, not today.
  const row = await d1.prepare(`
    SELECT ddp.last_updated FROM deep_dive_pages ddp
      JOIN countries c ON c.id = ddp.country_id WHERE c.name_en = 'Germany'`).bind().first();
  t.check(`dateModified is the row's own last_updated (${row?.last_updated})`,
    page?.dateModified === row?.last_updated,
    `markup says ${page?.dateModified}`);

  const crumb = typeOf(nodes, "BreadcrumbList");
  t.check("it has a breadcrumb ending on itself",
    crumb?.itemListElement?.slice(-1)[0]?.item?.endsWith("/germany"));

  // THE ONE MARKUP TYPE THIS SITE MUST NOT USE UNTIL THE PAGES CHANGE.
  // Our country pages are cards and a timeline, not questions and
  // answers, and FAQ markup that does not match visible Q&A is what
  // search engines penalise.
  t.check("no FAQPage on a page with no questions on it",
    !typeOf(nodes, "FAQPage"),
    "FAQ markup with nothing on the page to match it");
}

// ---- the dataset --------------------------------------------------------
{
  const html = await (await get("/sources")).text();
  const nodes = ldOf(html, "/sources");
  const ds = typeOf(nodes, "Dataset");
  t.check("/sources declares a Dataset", !!ds);

  // HONEST ONLY BECAUSE THERE IS A DISTRIBUTION. A Dataset node whose
  // only content is a web page is a claim that a page is data. This one
  // names an endpoint — so the endpoint has to answer.
  const url = ds?.distribution?.contentUrl || "";
  t.check("the distribution names a real endpoint",
    url.endsWith("/map-data.json"), url);
  const data = await get("/map-data.json");
  t.check("and that endpoint serves JSON",
    data.status === 200 && /json/.test(data.headers.get("content-type") || ""),
    `status ${data.status}, ${data.headers.get("content-type")}`);
  const payload = await data.json();
  t.check("the endpoint returns the country array it claims",
    Array.isArray(payload) && payload.length > 50, `${payload?.length} entries`);

  // The count in the description is generated, not typed. This project
  // had a jurisdiction count sit stale across thirty files for two days.
  const live = await d1.prepare(
    "SELECT count(*) AS n FROM countries WHERE code != 'EU'").bind().first();
  t.check(`the described jurisdiction count matches the database (${live.n})`,
    (ds?.description || "").includes(String(live.n)),
    ds?.description);
}

// ---- an insights piece --------------------------------------------------
{
  const row = await d1.prepare(`
    SELECT slug, gated, is_sponsored FROM articles WHERE published = 1 ORDER BY published_at DESC`)
    .bind().first();
  if (!row) {
    t.check("there is a published article to check", false, "none found");
  } else {
    const html = await (await get(`/insights/${row.slug}`)).text();
    const nodes = ldOf(html, `/insights/${row.slug}`);
    const art = typeOf(nodes, "Article");
    t.check("an insights piece declares an Article", !!art);
    t.check("with a headline", !!art?.headline);

    // isAccessibleForFree must match the wall. A gated piece marked free
    // is a promise the next click breaks.
    const locked = !!row.gated && !row.is_sponsored;
    t.check(`isAccessibleForFree matches the gate (locked: ${locked})`,
      art?.isAccessibleForFree === !locked,
      `markup says ${art?.isAccessibleForFree}`);
  }
}

// ---- the framed methodology copy ---------------------------------------
//
// It is noindex. Two nodes sharing an @id while describing the same URL
// is the one way this markup can actively mislead rather than merely
// under-describe, so the framed render carries none.
{
  const plain = await (await get("/methodology")).text();
  const framed = await (await get("/methodology?frame=1")).text();
  t.check("the canonical methodology page carries markup",
    ldOf(plain, "/methodology").length > 0);
  t.check("the framed copy carries none",
    ldOf(framed, "/methodology?frame=1").length === 0,
    "a second node claiming the same @id, on a noindex page");
}

// ---- the insights hub's CollectionPage ----------------------------------
//
// The rule this file is written against is that markup may only say what
// the page says. An ItemList is the easiest place on this site to break
// it, because nothing visible would change: a list re-sorted, padded or
// truncated for the markup looks identical on screen to a correct one.
{
  const { collectionPageLd } = await import(join(REPO, "shared", "structured-data.mjs"));

  // AN EMPTY HUB GETS NO ItemList. "Nothing published yet" is what the
  // page says; numberOfItems: 0 is the same statement made less clearly,
  // and consumers treat empty lists inconsistently.
  const empty = collectionPageLd({ articles: [], lang: "en" });
  t.check("an empty hub publishes no list at all",
    !empty.mainEntity, JSON.stringify(empty.mainEntity));

  const articles = [{ slug: "b", title: "Newer" }, { slug: "a", title: "Older" }];
  const node = collectionPageLd({ articles, lang: "de", title: "Einblicke" });
  t.check("the count is the length of the list, not a number written beside it",
    node.mainEntity.numberOfItems === node.mainEntity.itemListElement.length,
    `${node.mainEntity.numberOfItems} vs ${node.mainEntity.itemListElement.length}`);
  // POSITION IS THE DISPLAYED ORDER. The hub renders published_at DESC and
  // the node declares Descending; a list re-sorted here would assert an
  // order the page does not have.
  t.check("positions follow the order the page rendered",
    node.mainEntity.itemListElement.map((e) => e.position).join(",") === "1,2"
      && node.mainEntity.itemListElement[0].url.endsWith("/insights/b"));
  t.check("and the declared order matches how the hub actually sorts",
    node.mainEntity.itemListOrder === "https://schema.org/ItemListOrderDescending");
  // NO NESTED Article NODES. The full description lives on each piece's own
  // page; a thinner second copy here is one more thing to reconcile.
  t.check("entries are links, not a second thinner copy of each Article",
    node.mainEntity.itemListElement.every((e) => e["@type"] === "ListItem" && !e.item));
  t.check("the hub is part of the site and names its publisher",
    node.isPartOf["@id"].endsWith("/#website") && node.publisher["@id"].endsWith("/#organization"));
  t.check("and it reports the language it was rendered in", node.inLanguage === "de");
}

// ---- escaping -----------------------------------------------------------
//
// `</` inside a JSON string closes the script block and drops the rest of
// the document into the page as text. JSON.stringify does not escape it,
// because it is valid JSON — the HTML parser is the one that cares.
{
  const { ldScript } = await import(join(REPO, "shared", "structured-data.mjs"));
  const out = ldScript({ "@type": "Thing", name: "</script><img src=x onerror=alert(1)>" });
  t.check("a closing tag in a value cannot break out of the block",
    !out.includes("</script><img"),
    "markup built from a country name or card title could end the block early");
  t.check("and the block still parses as JSON",
    (() => {
      try { JSON.parse(out.replace(/^<script[^>]*>|<\/script>$/g, "")); return true; }
      catch { return false; }
    })());
}

process.exit(t.report() ? 0 : 1);
