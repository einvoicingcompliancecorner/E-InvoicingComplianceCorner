#!/usr/bin/env node
// seo-crawlability.mjs — what a crawler that does not run JavaScript
// can actually reach.
//
//   node tests/seo-crawlability.mjs
//
// WHY THIS EXISTS. The 24 August SEO audit found the site's primary
// page serving 718 words of indexable HTML with NO link to any of the
// seventy country deep dives — the board is built by renderBoard() from
// a JavaScript array, and DEEP_DIVES is injected as a JS object literal,
// so every country link on the tracker existed only after JavaScript
// ran. Forty-two of those seventy pages were in neither sitemap.xml nor
// any anchor anywhere on the site: to anything that reads HTML rather
// than executing it, they were not on the internet.
//
// Both halves of that were invisible to every existing check, and for
// the same reason: the suites here call renderers directly or drive a
// real browser, and a real browser runs the JavaScript that hides the
// problem. THIS FILE READS THE SERVED HTML AS TEXT, which is the only
// way to see what a non-rendering crawler sees.
//
// It guards three things, all of which were wrong on 24 August:
//
//   1. The tracker carries real anchors to every country page.
//   2. The sitemap covers exactly what the router serves — it was 28 of
//      70, and it was hand-maintained, which is why.
//   3. Every country page has a meta description and social tags. All
//      seventy had none, so every share rendered as a bare URL.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("seo crawlability");

const worker = (await import(join(REPO, "site-worker", "src", "index.js"))).default;
const { d1 } = await openReplayDb();
const all = async (sql) => (await d1.prepare(sql).bind().all()).results || [];

const env = {
  eicc_content: d1,
  ASSETS: {
    async fetch(req) {
      const p = new URL(req.url).pathname;
      try { return new Response(readFileSync(join(REPO, p.replace(/^\//, "")), "utf8")); }
      catch { return new Response("not found", { status: 404 }); }
    },
  },
  SESSION_SECRET: "test-secret-not-a-real-one",
  ROI_PUBLIC: "true",
};
const get = (path) => worker.fetch(
  new Request(`https://e-invoicingcompliancecorner.com${path}`), env, { waitUntil() {} });

const tracked = await all(
  "SELECT slug, name_en FROM countries WHERE slug IS NOT NULL AND code != 'EU' ORDER BY slug");
t.check("there are countries to be reachable", tracked.length >= 50, `${tracked.length} slugs`);

// ---- 1. the tracker, read as text --------------------------------------

const trackerHtml = await (await get("/einvoicing-compliance-tracker.html")).text();

// SCRIPTS STRIPPED FIRST. This is the whole point of the file: a country
// slug inside a JS array is not a link, and counting it as one is how
// the gap survived. Everything below looks only at markup.
const markup = trackerHtml.replace(/<script[\s\S]*?<\/script>/gi, " ");

{
  const hrefs = new Set([...markup.matchAll(/href="\/([a-z0-9-]+)"/g)].map((m) => m[1]));
  const missing = tracked.filter((c) => !hrefs.has(c.slug));
  t.check("every country is reachable by a real anchor, with no JavaScript",
    missing.length === 0,
    `${tracked.length - missing.length}/${tracked.length} linked; missing: `
    + missing.slice(0, 8).map((c) => c.slug).join(", "));
}

{
  // And they are in the index, not scattered — so the check above cannot
  // start passing because a country name happened to appear elsewhere.
  const nav = (markup.match(/<nav class="country-index"[\s\S]*?<\/nav>/) || [""])[0];
  const links = [...nav.matchAll(/href="\/([a-z0-9-]+)"/g)].length;
  t.check("and they are inside the country index",
    links === tracked.length, `${links} anchors in the index, ${tracked.length} countries`);
  t.check("the index says what it is, in words the reader can read",
    /data-i18n="index.heading"/.test(nav) && /data-i18n="index.intro"/.test(nav));
}

{
  // AND EVERY DATE IN IT IS STILL AHEAD. The first version of the index
  // printed each country's EARLIEST milestone under a heading promising
  // its next one, so the United States advertised 2003-03-01 as a thing
  // to prepare for. Both the label and the data were individually true;
  // together they were wrong, which is the shape of defect only a
  // rendered read catches.
  const today = new Date().toISOString().slice(0, 10);
  const nav = (markup.match(/<nav class="country-index"[\s\S]*?<\/nav>/) || [""])[0];
  const dates = [...nav.matchAll(/class="ci-date">([^<]+)</g)].map((m) => m[1].trim());
  const past = dates.filter((d) => d < today);
  t.check("every date the index shows is still in the future",
    past.length === 0,
    `${dates.length} dated rows, ${past.length} already passed: ${past.slice(0, 5).join(", ")}`);
  t.check("and enough rows carry one to be worth printing",
    dates.length >= 10, `${dates.length} of ${tracked.length} have a future milestone`);
}

{
  // The failure this replaces: an empty <ul> served because the marker
  // stopped matching. The injection fails soft in the worker on purpose
  // — a missing index must not take the whole tracker back to its
  // frozen snapshot — so the loud half of that bargain lives here.
  t.check("the index is populated, not an empty shell",
    !/<ul id="countryIndexList"><\/ul>/.test(markup),
    "the marker did not match and the worker served the page without it");
}

// ---- 2. the sitemap -----------------------------------------------------

const sitemap = await (await get("/sitemap.xml")).text();
const locs = [...sitemap.matchAll(/<loc>https:\/\/e-invoicingcompliancecorner\.com([^<]*)<\/loc>/g)]
  .map((m) => m[1]);

t.check("the sitemap is served and well-formed",
  sitemap.startsWith("<?xml") && /<urlset/.test(sitemap) && locs.length > 70,
  `${locs.length} URLs`);

{
  // THE CHECK THAT WOULD HAVE CAUGHT 42 MISSING COUNTRIES. Asked against
  // the router's own source of slugs, so the two cannot drift again.
  const inMap = new Set(locs);
  const absent = tracked.filter((c) => !inMap.has(`/${c.slug}`));
  t.check("every routed country is in the sitemap",
    absent.length === 0,
    `${absent.length} missing: ` + absent.slice(0, 8).map((c) => c.slug).join(", "));

  // And the converse: a sitemap URL the router cannot serve is a 404
  // offered to Google. Country-shaped entries only — the static list
  // holds real files the asset layer serves.
  const known = new Set(tracked.map((c) => `/${c.slug}`));
  const staticish = /\.(html|xml)$|^\/$|^\/(map|sources|insights|methodology|changes)/;
  const orphan = locs.filter((l) => !known.has(l) && !staticish.test(l) && !l.startsWith("/insights/"));
  t.check("and nothing in it is a country the router does not know",
    orphan.length === 0, orphan.join(", "));
}

{
  // Gated pages must never be advertised: all three answer a sign-up
  // wall and emit noindex, so listing them asks Google to index a page
  // that tells it not to.
  const gated = ["/roi-calculator", "/compliance-guides", "/spec-register"];
  const leaked = gated.filter((g) => locs.includes(g));
  t.check("no gated page is advertised in the sitemap", leaked.length === 0, leaked.join(", "));
}

{
  // The two pages the hand-maintained file forgot entirely.
  t.check("the home page and /sources are declared",
    locs.includes("/") && locs.includes("/sources"),
    `/ ${locs.includes("/")}, /sources ${locs.includes("/sources")}`);
  // lastmod comes from each page's own row rather than a typed date.
  const dated = locs.filter((l, i) => /<lastmod>/.test(sitemap.split("<url>")[i + 1] || ""));
  // WITHIN GERMANY'S OWN <url> BLOCK, not "somewhere after its <loc>".
  // The first version matched loc immediately followed by lastmod, and
  // broke the moment hreflang alternates were inserted between them —
  // which is the correct markup, so the test was asserting the absence
  // of a feature rather than the presence of a date.
  const germany = (sitemap.match(/<url>(?:(?!<\/url>)[\s\S])*\/germany<\/loc>[\s\S]*?<\/url>/) || [""])[0];
  t.check("country entries carry a lastmod from the database",
    /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(germany),
    `${dated.length} entries with lastmod; germany block: ${germany.slice(0, 120)}`);
}

// ---- 2b. one URL, one language -----------------------------------------
//
// The change of 24 August: the cookie no longer decides what a URL
// returns. Before it, one URL served four documents on a
// `public, max-age=300` response with no Vary — so a shared cache could
// hand the German copy to the next English reader, and every German page
// pointed its canonical at the English URL.
{
  const bare = await get("/germany");
  const withCookie = await worker.fetch(
    new Request("https://e-invoicingcompliancecorner.com/germany",
      { headers: { Cookie: "eicc_lang=de" } }), env, { waitUntil() {} });
  const bareHtml = await bare.text();
  const cookieHtml = await withCookie.text();

  t.check("a cookie cannot change what a URL returns",
    bareHtml === cookieHtml,
    "the same URL served two different documents — the cache bug is back");
  t.check("and no language cookie is set on a cacheable page",
    !bare.headers.get("set-cookie"),
    `Set-Cookie: ${bare.headers.get("set-cookie")}`);

  const de = await (await get("/germany?lang=de")).text();
  t.check("the query parameter still chooses the language",
    /<html lang="de"/.test(de) && /<html lang="en"/.test(bareHtml));

  // SELF-REFERENTIAL, both of them. A variant that canonicalises to
  // another language is the defect this whole change exists to remove.
  const canon = (h) => (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  t.check("each variant is its own canonical",
    canon(bareHtml) === "https://e-invoicingcompliancecorner.com/germany"
    && canon(de) === "https://e-invoicingcompliancecorner.com/germany?lang=de",
    `en: ${canon(bareHtml)} | de: ${canon(de)}`);

  // THE CLUSTER MUST CONTAIN THE PAGE ITSELF. An hreflang set that omits
  // the current URL is the most common way a cluster is silently
  // ignored, and it looks complete from any single page.
  for (const [label, html, self] of [["en", bareHtml, "/germany"], ["de", de, "/germany?lang=de"]]) {
    const alts = [...html.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => m[2]);
    t.check(`the ${label} page's hreflang cluster names all four and itself`,
      alts.length === 5 && alts.includes(`https://e-invoicingcompliancecorner.com${self}`),
      `${alts.length} alternates: ${alts.join(" ")}`);
  }

  // Public pages that had no canonical at all before today.
  for (const path of ["/sources", "/map", "/insights"]) {
    const html = await (await get(path)).text();
    t.check(`${path} declares a canonical and its languages`,
      /<link rel="canonical"/.test(html) && /hreflang="x-default"/.test(html));
  }
}

{
  // The sitemap says the same thing as the pages. A cluster in the head
  // and no cluster in the sitemap is not wrong, but the two disagreeing
  // about which URLs exist is.
  const germanyBlock = (sitemap.match(/<url>(?:(?!<\/url>)[\s\S])*\/germany<\/loc>[\s\S]*?<\/url>/) || [""])[0];
  const alts = [...germanyBlock.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
  t.check("the sitemap declares each page's language variants",
    alts.length === 5 && alts.includes("x-default"),
    `germany alternates in sitemap: ${alts.join(", ")}`);
}

// ---- 3. the country pages ----------------------------------------------

{
  // Three countries rather than seventy: this suite runs on every commit
  // and each page is a real render. The structural claim is per-renderer,
  // so three prove it and seventy would only prove it more slowly.
  const sample = ["germany", "poland", "japan"];
  const problems = [];
  for (const slug of sample) {
    const html = await (await get(`/${slug}`)).text();
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (!desc) { problems.push(`${slug}: no meta description`); continue; }
    if (desc.length < 50) problems.push(`${slug}: description is ${desc.length} chars`);
    if (desc.length > 200) problems.push(`${slug}: description is ${desc.length} chars, too long to be shown`);
    for (const tag of ["og:title", "og:description", "og:url", "og:site_name", "twitter:card"]) {
      if (!html.includes(`"${tag}"`)) problems.push(`${slug}: no ${tag}`);
    }
    // The og:url must agree with the canonical, or a share and a search
    // result claim two different addresses for one page.
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    const ogUrl = (html.match(/<meta property="og:url" content="([^"]*)"/) || [])[1];
    if (canonical !== ogUrl) problems.push(`${slug}: og:url ${ogUrl} != canonical ${canonical}`);
  }
  t.check("country pages carry a description and social tags",
    problems.length === 0, problems.join("; "));
}

{
  // AND THE DESCRIPTION IS TRANSLATED WITH THE PAGE. It is cut from the
  // COALESCEd mandate_summary, so a German page must not be describing
  // itself in English to a German search result.
  const de = await (await get("/germany?lang=de")).text();
  const en = await (await get("/germany?lang=en")).text();
  const dDe = (de.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const dEn = (en.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  t.check("and it is translated with the page, not left in English",
    dDe.length > 50 && dDe !== dEn, `de: "${dDe.slice(0, 60)}…"`);
  t.check("and og:locale follows the language",
    /content="de_DE"/.test(de) && /content="en_GB"/.test(en));
}

// ---- 4. the static pages ------------------------------------------------
//
// Their bodies have been translated for months; their titles,
// descriptions and <html lang> never were. Those three are what a search
// engine reads before it reads a word of the page.
{
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(REPO).filter((f) => f.endsWith(".html"));
  const problems = [];

  for (const file of files) {
    const html = readFileSync(join(REPO, file), "utf8");
    const pageKey = (html.match(/<body[^>]*data-page="([^"]*)"/) || [])[1];
    const loadsI18n = /i18n\/i18n\.js/.test(html);
    const ns = (html.match(/i18n\/i18n\.js"[^>]*data-namespace="([^"]*)"/) || [])[1] || "";
    const hasCluster = /rel="alternate" hreflang/.test(html);
    const byFile = /data-lang-mode="files"/.test(html);

    // THE DEFECT THIS CATCHES, because it shipped for ten minutes today:
    // a page with an hreflang cluster advertising ?lang= variants but no
    // i18n loader serves the SAME ENGLISH DOCUMENT at all four URLs.
    // That is worse than saying nothing — it invites a crawler to index
    // four addresses for one page.
    if (hasCluster && !byFile && !loadsI18n) {
      problems.push(`${file}: advertises ?lang= variants but loads no i18n loader`);
    }
    if (pageKey && !loadsI18n) {
      problems.push(`${file}: declares data-page but cannot translate anything`);
    }
    // And a page that CAN translate should say which strings are its own.
    if (loadsI18n && !pageKey && file !== "einvoicing-compliance-tracker.html") {
      problems.push(`${file}: loads i18n but declares no data-page, so its title stays English`);
    }

    if (!pageKey) continue;
    // The strings must be in the file this page actually loads — not the
    // main one, unless that is what it loads. Getting this wrong gives a
    // German page with a German lang attribute and an English title, and
    // nothing anywhere fails.
    for (const lang of ["en", "de", "fr", "es"]) {
      const name = ns ? `${lang}-${ns}.json` : `${lang}.json`;
      let doc;
      try { doc = JSON.parse(readFileSync(join(REPO, "i18n", name), "utf8")); }
      catch { problems.push(`${file}: loads i18n/${name}, which is missing`); continue; }
      const meta = (doc.pages || {})[pageKey];
      if (!meta || !meta.title || !meta.description) {
        problems.push(`${file}: no pages.${pageKey} in i18n/${name}`);
      }
    }
  }
  t.check("every static page can describe itself in all four languages",
    problems.length === 0, problems.slice(0, 8).join("\n        "));

  // The loader has to actually do it, or the strings sit unused.
  const loader = readFileSync(join(REPO, "i18n", "i18n.js"), "utf8");
  t.check("and the loader rewrites the head, not only the body",
    /applyHead\(\)/.test(loader) && /document\.title = head\.title/.test(loader)
    && /doc\.setAttribute\("lang"/.test(loader));
  t.check("and restores a reader's language without redirecting a crawler",
    /redirectToPreferredLanguage\(\)/.test(loader)
    && /if \(params\.has\("lang"\)\) return false;/.test(loader)
    && /location\.replace/.test(loader),
    "the redirect must be cookie-gated, skip ?lang= URLs, and not stack history");
}

// ---- 5. the members subdomain -------------------------------------------
//
// It emitted no noindex anywhere and served no robots.txt, and a MISSING
// robots.txt reads to a crawler as "everything allowed". The public
// tracker links here, so the path in was already open: sign-in pages,
// preferences and every magic-link landing page were one crawl from a
// search result.
{
  const members = (await import(join(REPO, "members-worker", "src", "index.js"))).default;
  const mEnv = { ...env, ARCHIVE_PUBLIC: "true", MEMBERS: null };
  const mGet = (path, e = mEnv) => members.fetch(
    new Request(`https://members.e-invoicingcompliancecorner.com${path}`), e, { waitUntil() {} });

  const robots = await mGet("/robots.txt");
  const body = await robots.text();
  t.check("the members subdomain serves a robots.txt",
    robots.status === 200 && /Disallow: \//.test(body), `status ${robots.status}: ${body}`);

  // THE ARCHIVE IS THE DELIBERATE EXCEPTION, and it follows the flag
  // rather than a second decision someone has to remember.
  t.check("and allows the archive while the promo is on",
    /Allow: \/members\/archive/.test(body), body);
  const offBody = await (await mGet("/robots.txt", { ...mEnv, ARCHIVE_PUBLIC: "false" })).text();
  t.check("and stops allowing it the moment the promo ends",
    !/Allow:/.test(offBody), offBody);

  // The header, on a page that must never be indexed.
  const prefs = await mGet("/members/preferences");
  t.check("a members page carries X-Robots-Tag: noindex",
    /noindex/.test(prefs.headers.get("x-robots-tag") || ""),
    `X-Robots-Tag: ${prefs.headers.get("x-robots-tag")}`);

  const archive = await mGet("/members/archive");
  t.check("and the public archive does not, while it is public",
    !archive.headers.get("x-robots-tag"),
    `X-Robots-Tag: ${archive.headers.get("x-robots-tag")}`);
  const archiveClosed = await mGet("/members/archive", { ...mEnv, ARCHIVE_PUBLIC: "false" });
  t.check("but does the moment it is not",
    /noindex/.test(archiveClosed.headers.get("x-robots-tag") || ""),
    `X-Robots-Tag: ${archiveClosed.headers.get("x-robots-tag")}`);
}

// ---- 6. the structured-data entities --------------------------------------
{
  const sd = await import(join(REPO, "shared", "structured-data.mjs"));
  const org = sd.organizationLd();
  const person = sd.personLd();
  // ONE PERSON, REFERENCED TWICE. Nested inline on the Organization and
  // repeated on each Article, the same human would have been two
  // unrelated entities to any consumer.
  t.check("the founder is one addressable entity, not two inline copies",
    org.founder && org.founder["@id"] === person["@id"] && !org.founder.name,
    JSON.stringify(org.founder));
  const article = sd.articleLd({ slug: "x", headline: "H", lang: "en" });
  t.check("and every article names an author",
    article.author && article.author["@id"] === person["@id"], JSON.stringify(article.author));
  t.check("the founder carries a real photo and a real profile",
    /dan-young\.png$/.test(person.image) && Array.isArray(person.sameAs) && person.sameAs.length > 0);

  // AND THE TRACKER'S STATIC GRAPH CONTAINS THE NODE IT REFERENCES.
  // Organization, Person and WebSite are hardcoded in the asset; the
  // @id references on every other page resolve to them or to nothing.
  const tracker = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
  const graph = JSON.parse((tracker.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [, "{}"])[1]
    .replace(/\\u003c/g, "<"));
  const ids = (graph["@graph"] || []).map((n) => n["@id"]);
  t.check("the tracker's graph defines every entity the site references",
    ids.includes(person["@id"]) && ids.includes(org["@id"]),
    `graph holds: ${ids.join(", ")}`);
}

console.log(`  note  ${tracked.length} countries linked from the tracker and listed in `
  + `${locs.length} sitemap URLs`);

process.exit(t.report() ? 0 : 1);
