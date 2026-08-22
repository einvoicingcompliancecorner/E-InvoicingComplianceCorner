// ================================================================
// Worker — serves e-invoicingcompliancecorner.com.
// ================================================================
// This is a Cloudflare "Workers with static assets" project (the
// production resource is named "eicc-public" (renamed from its
// auto-generated "winter-fog-ff16" default), NOT Cloudflare
// Pages. Static files (index.html, the tracker, education pages,
// i18n/, etc.) are served automatically from the [assets] binding
// configured in wrangler.toml whenever a request matches a real file
// — this script only runs for requests that don't match any static
// asset, which today means exactly the 30 country deep-dive slugs
// (spain, croatia, uae, ...) since their old .html files were deleted.
//
// Requires a D1 database binding named `eicc_content` (see
// wrangler.toml), pointed at the same `eicc-content` database
// (id d1d10bd0-e90a-44a3-9494-a63689e8d32e) members-worker uses.
//
// Language: an explicit ?lang= query param always wins (and refreshes
// the persistence cookie); otherwise a previously-set cookie is used;
// otherwise the browser's own Accept-Language header picks the best
// supported match; otherwise English. This is what makes "route every
// visitor, in any language, straight to the D1 version" work without
// needing a query param on first visit.
// ================================================================

import {
  SUPPORTED_LANGS,
  SLUG_TO_COUNTRY,
  deriveFlagFromCode,
  getDeepDiveContent,
  getMilestonesForCountry,
  renderFullDeepDivePage,
} from "../../shared/deep-dive-render.mjs";
import {
  getMapCountries,
  getRecentStories,
  REGION_ORDER,
  REGION_BOUNDS,
  MAP_UI,
} from "../../shared/map-data.mjs";
import {
  getPublishedArticles,
  getArticleBySlug,
  renderInsightsListFragment,
  renderArticleFragment,
  INSIGHTS_STYLE,
} from "../../shared/resources-render.mjs";
// IDENTITY ONLY. This Worker gets SESSION_SECRET and no subscribers
// binding: it can verify who a reader is from the token's signature and
// cannot read or change anything about their account. See the header of
// shared/session.mjs for why that split, and what it deliberately trades.
import { sessionEmail, sessionDiagnostic, readCookie, signOutCookies, SESSION_COOKIE } from "../../shared/session.mjs";
import {
  getRoiCountries,
  getRoiBenchmarks,
  getRoiPhases,
  getRoiStrings,
  resolveRoiLang,
  getRoiFxRates,
  renderRoiPage,
  ROI_STYLE,
} from "../../shared/roi-render.mjs";
import {
  getGuideBundle,
  renderGuideDocument,
  GUIDE_STYLE,
  GUIDE_FIT_SCRIPT,
} from "../../shared/guides-render.mjs";
import {
  renderPickerBody,
  PICKER_STYLE,
  PICKER_SCRIPT,
} from "../../shared/guides-picker.mjs";

const LANG_COOKIE = "eicc_lang";
const LANG_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

// ================================================================
// DYNAMIC TRACKER (Stage 5) — the tracker page itself, rendered with
// D1 data at request time.
//
// The approach is "static shell, injected data": the tracker's HTML,
// CSS, and all of its own client-side JS (board rendering, filters,
// the in-page panels, menus) stay exactly as authored in the static
// asset. This Worker only swaps out two inline data blobs before
// serving — the `const DATA = [...]` milestones array and the
// `const DEEP_DIVES = {...}` slug map — for equivalents built from D1
// (milestones WHERE on_tracker = 1, and countries.slug respectively;
// see migrations 198 and 201–204). Editing milestone content or adding
// a country in D1 now updates the live board with no HTML regeneration
// and no redeploy.
//
// The static blobs remain in the asset as a graceful-degradation
// fallback: if the D1 queries fail for any reason, the unmodified
// static page is served instead (its data snapshot goes stale over
// time, but only ever matters mid-outage). The same pattern covers
// /i18n/{lang}-data.json (the board's milestone translations, fetched
// client-side by i18n.js on language switch): served from
// milestone_translations, falling back to the static file.
// ================================================================

const TRACKER_PATH = "/einvoicing-compliance-tracker.html";
// Cloudflare's static-assets serving can canonicalize .html URLs to
// extensionless ones (html_handling auto-trailing-slash) — so the same
// page is reachable at both forms, and the router must treat both as
// the tracker or the redirect target silently falls through to the
// plain static asset (no error, no log — just the fallback page).
const TRACKER_PATHS = new Set([TRACKER_PATH, "/einvoicing-compliance-tracker"]);
const DATA_JSON_RE = /^\/i18n\/(es|de|fr)-data\.json$/;

// ASSETS.fetch itself may answer with a redirect between the two forms;
// follow it (once) so callers always end up with the page body.
async function fetchAssetFollowingRedirect(env, request) {
  let resp = await env.ASSETS.fetch(request);
  if (resp.status >= 300 && resp.status < 400) {
    const loc = resp.headers.get("Location");
    if (loc) resp = await env.ASSETS.fetch(new Request(new URL(loc, request.url), { headers: request.headers }));
  }
  return resp;
}

async function buildTrackerData(db) {
  // Ordering matters in one subtle place: the board's region filter
  // chips render in first-appearance order over DATA. The static array
  // happens to first-appear regions in exactly Europe → Middle East /
  // Africa → Asia-Pacific → Americas, so the generated array orders by that same
  // fixed region sequence (then date, then id for determinism) to keep
  // the chips identical. Everything else on the page either sorts DATA
  // itself (the board cards, the sidebar) or is order-insensitive (the
  // stats strip).
  const { results } = await db.prepare(`
    SELECT m.id, c.name_en AS country, c.code, c.region, m.date,
           m.portals, m.confidence,
           mt.system, mt.desc, mt.actions
    FROM milestones m
    JOIN countries c ON c.id = m.country_id
    LEFT JOIN milestone_translations mt ON mt.milestone_id = m.id AND mt.lang = 'en'
    WHERE m.on_tracker = 1
    ORDER BY CASE c.region
      WHEN 'Europe' THEN 0 WHEN 'Middle East / Africa' THEN 1
      WHEN 'Asia-Pacific' THEN 2 WHEN 'Americas' THEN 3 ELSE 4 END,
      m.date, m.id
  `).all();
  return results.map((r) => {
    const entry = {
      id: r.id,
      country: r.country,
      flag: deriveFlagFromCode(r.code),
      code: r.code,
      region: r.region,
      system: r.system,
      date: r.date,
      desc: r.desc,
      actions: JSON.parse(r.actions || "[]"),
      portals: JSON.parse(r.portals || "[]"),
    };
    // The board checks `e.confidence==='expected'` — absent keys and
    // undefined behave identically, so only set it when present, which
    // also keeps the generated array closer in shape to the static one.
    if (r.confidence) entry.confidence = r.confidence;
    return entry;
  });
}

async function buildDeepDives(db) {
  const { results } = await db.prepare(`
    SELECT name_en, slug FROM countries WHERE slug IS NOT NULL ORDER BY name_en
  `).all();
  return Object.fromEntries(results.map((r) => [r.name_en, "/" + r.slug]));
}

async function renderTracker(request, env) {
  // Always fetch the static asset first — it's both the shell we inject
  // into and the complete fallback if anything below throws. Fetch via
  // the redirect-following helper: asking ASSETS for the .html form can
  // itself answer with a redirect to the extensionless form.
  const assetResp = await fetchAssetFollowingRedirect(env, new Request(new URL(TRACKER_PATH, request.url), { headers: request.headers }));
  if (!assetResp.ok) return assetResp;
  const html = await assetResp.text();
  try {
    const [data, deepDives] = await Promise.all([
      buildTrackerData(env.eicc_content),
      buildDeepDives(env.eicc_content),
    ]);
    // Sanity guards: if D1 comes back implausibly empty (e.g. migrations
    // 201–204 not yet applied, so on_tracker matches nothing), serve the
    // static page rather than an empty board.
    if (data.length === 0 || Object.keys(deepDives).length === 0) throw new Error("empty tracker data from D1");
    // </script> inside a JSON string would terminate the inline script
    // block early — escape the slash the standard way (JSON-legal, and
    // JS string semantics are unchanged).
    const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
    // Track replacement success via the callback actually firing — the
    // injected JSON itself begins with `const DATA = [`, so re-checking
    // for that substring afterwards would always "find" it. (Caught by
    // the golden test suite: the original guard did exactly that and
    // would have made every request fall back to static.)
    let replacedData = false, replacedDeepDives = false;
    let out = html.replace(/const DATA = \[[\s\S]*?\n\];/, () => { replacedData = true; return `const DATA = ${safe(data)};`; });
    out = out.replace(/const DEEP_DIVES = \{[\s\S]*?\n\};/, () => { replacedDeepDives = true; return `const DEEP_DIVES = ${safe(deepDives)};`; });
    // Both replacements must have actually landed — if the static page's
    // shape ever changes such that a regex no longer matches, fall back
    // loudly rather than serving a half-injected page.
    if (!replacedData || !replacedDeepDives) throw new Error("tracker data blob not replaced");
    return new Response(out, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        // SIXTY SECONDS, NOT FIVE MINUTES, matching the planner.
        //
        // This page's cache has now been implicated in three confused
        // deploy checks in two days: Middle East countries "missing" from
        // the sidebar on 3 August, the planner's gating change "not
        // taking effect" on the 19th, and the sign-in button on the 20th
        // — every one of them a browser serving HTML from disk while the
        // deploy sat there working perfectly.
        //
        // The tracker is the page every check starts from, and the one
        // that changes most often. A cache that makes a good deploy look
        // like a failed one costs more than it saves here.
        //
        // NOT a correctness problem, and worth being precise about that:
        // this HTML is identical for every reader. The greeting and the
        // sign-in button are rendered client-side from a cookie, which is
        // exactly what keeps this response shareable between them. Only
        // the planner's route varies by session, and only that route goes
        // private.
        //
        // Worth revisiting when the site stops changing daily.
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("Dynamic tracker render failed, serving static fallback:", err);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "public, max-age=60" },
    });
  }
}

async function renderTrackerDataJson(request, env, lang) {
  try {
    const { results } = await env.eicc_content.prepare(`
      SELECT m.id, mt.system, mt.desc, mt.actions
      FROM milestones m
      JOIN milestone_translations mt ON mt.milestone_id = m.id AND mt.lang = ?
      WHERE m.on_tracker = 1
      ORDER BY m.date, m.id
    `).bind(lang).all();
    if (results.length === 0) throw new Error(`no ${lang} tracker translations in D1`);
    const out = {};
    for (const r of results) {
      out[r.id] = { system: r.system, desc: r.desc, actions: JSON.parse(r.actions || "[]") };
    }
    return new Response(JSON.stringify(out), {
      headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    console.error(`Dynamic ${lang}-data.json failed, serving static fallback:`, err);
    return env.ASSETS.fetch(request);
  }
}

// Returns the LAST matching cookie value, not the first, and reports
// whether more than one same-named cookie was present. A browser can
// send two *different* cookies with the same name at once -- e.g. a
// stale host-only "eicc_lang" cookie left over from before this site
// scoped the cookie to Domain=.e-invoicingcompliancecorner.com,
// sitting alongside the current domain-scoped one. Per RFC 6265 5.4,
// cookies with equal-length paths are sent oldest-first, so the newer
// (correct, domain-scoped) cookie is always the LAST occurrence in the
// Cookie header -- reading the first match is what caused a user's
// language choice to always revert to whatever the stale cookie held
// on refresh. See the duplicate-clearing Set-Cookie logic below for
// the other half of the fix (actually removing the stale duplicate).
function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const matches = [...cookieHeader.matchAll(new RegExp(`(?:^|; )${name}=([^;]+)`, "g"))];
  return {
    value: matches.length ? matches[matches.length - 1][1] : null,
    duplicated: matches.length > 1,
  };
}

// Parses a standard Accept-Language header ("fr-FR,fr;q=0.9,en;q=0.8")
// and returns the highest-weighted language this site actually
// supports, or null if nothing matches.
function pickBestSupportedLanguage(header) {
  if (!header) return null;
  const candidates = header.split(",").map((part) => {
    const [tag, qPart] = part.trim().split(";q=");
    const q = qPart ? parseFloat(qPart) : 1;
    const base = (tag || "").trim().split("-")[0].toLowerCase();
    return { base, q: isNaN(q) ? 1 : q };
  }).sort((a, b) => b.q - a.q);
  for (const { base } of candidates) {
    if (SUPPORTED_LANGS.includes(base)) return base;
  }
  return null;
}

// ================================================================
// /sources — the "sources of truth" page: the official reference URLs
// monitored for announcements per tracked country, rendered from D1's
// tracking_sources tables (migration 214) at request time. Like the
// country deep-dive routes, this path matches NO asset file, so the
// Worker always runs — no run_worker_first entry needed.
// ================================================================

const SOURCES_UI = {
  en: { title: "Tracking sources", eyebrow: "Sources of truth",
        intro: "The official government and authority pages we monitor for announcements and notifications, for every jurisdiction in the tracker. Each update on the board and in the newsletter traces back to one of these.",
        back: "\u2190 Back to global tracker", visit: "Visit source" },
  es: { title: "Fuentes de seguimiento", eyebrow: "Fuentes de referencia",
        intro: "Las p\u00e1ginas oficiales de gobiernos y autoridades que supervisamos para captar anuncios y notificaciones, para cada jurisdicci\u00f3n del rastreador. Cada actualizaci\u00f3n del panel y del bolet\u00edn se remonta a una de ellas.",
        back: "\u2190 Volver al rastreador global", visit: "Visitar fuente" },
  de: { title: "\u00dcberwachte Quellen", eyebrow: "Referenzquellen",
        intro: "Die offiziellen Beh\u00f6rden- und Regierungsseiten, die wir f\u00fcr Ank\u00fcndigungen und Meldungen beobachten \u2014 f\u00fcr jede Rechtsordnung im Tracker. Jede Aktualisierung auf der Tafel und im Newsletter geht auf eine dieser Quellen zur\u00fcck.",
        back: "\u2190 Zur\u00fcck zum globalen Tracker", visit: "Quelle \u00f6ffnen" },
  fr: { title: "Sources suivies", eyebrow: "Sources de r\u00e9f\u00e9rence",
        intro: "Les pages officielles des gouvernements et autorit\u00e9s que nous surveillons pour capter les annonces et notifications, pour chaque juridiction du tracker. Chaque mise \u00e0 jour du tableau et de la newsletter remonte \u00e0 l'une d'elles.",
        back: "\u2190 Retour au tracker mondial", visit: "Voir la source" },
};
const SOURCES_REGION_ORDER = ["Europe", "Middle East / Africa", "Asia-Pacific", "Americas"];

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ================================================================
// INSIGHTS — public, SEO-indexable blog/whitepaper/sponsored-content
// hub (see shared/resources-render.mjs for the full design writeup
// and migrations/338_insights_articles_table.sql for the schema).
//
// Same "D1-backed, no asset file behind it" pattern as /sources and
// the country deep-dives: this Worker only runs because the path
// matches no static asset, and every visitor (logged in or not) gets
// a real, crawlable page — gated pieces show a teaser + a link over
// to members.e-invoicingcompliancecorner.com/members/insights/<slug>,
// never a blank/redirected page, so Google always has something to
// index.
// ================================================================
const INSIGHTS_UI = {
  en: { title: "Insights & Whitepapers", eyebrow: "From the Compliance Corner",
        intro: "Original analysis, recaps, and whitepapers on global e-invoicing mandates — some free to everyone, some for subscribers (still free to join).",
        back: "← Back to global tracker" },
  es: { title: "Análisis e informes técnicos", eyebrow: "Desde Compliance Corner",
        intro: "Análisis originales, resúmenes e informes técnicos sobre los mandatos globales de facturación electrónica — algunos abiertos a todos, otros solo para suscriptores (la suscripción sigue siendo gratuita).",
        back: "← Volver al rastreador global" },
  de: { title: "Analysen & Whitepapers", eyebrow: "Aus der Compliance Corner",
        intro: "Eigene Analysen, Rückblicke und Whitepapers zu globalen E-Invoicing-Pflichten — einige frei zugänglich, andere nur für Abonnenten (weiterhin kostenlos).",
        back: "← Zurück zum globalen Tracker" },
  fr: { title: "Analyses et livres blancs", eyebrow: "Depuis la Compliance Corner",
        intro: "Analyses originales, récapitulatifs et livres blancs sur les obligations mondiales de facturation électronique — certains ouverts à tous, d'autres réservés aux abonnés (l'abonnement reste gratuit).",
        back: "← Retour au tracker mondial" },
};

function resolveInsightsLang(request) {
  const url = new URL(request.url);
  let lang = url.searchParams.get("lang");
  let shouldSetCookie = false;
  const { value: cookieLang, duplicated: cookieDuplicated } = getCookie(request, LANG_COOKIE);
  if (lang && SUPPORTED_LANGS.includes(lang)) {
    shouldSetCookie = true;
  } else if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) {
    lang = cookieLang;
  } else {
    lang = pickBestSupportedLanguage(request.headers.get("Accept-Language")) || "en";
  }
  return { lang, shouldSetCookie, cookieDuplicated };
}

function insightsPageShell({ titleTag, metaDescription, bodyHtml, lang, backHref }) {
  return `<!DOCTYPE html>
<html lang="${escHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(titleTag)} — The E-Invoicing Compliance Corner</title>
<meta name="description" content="${escHtml(metaDescription)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* Same dark shell as /sources and the country deep-dive pages. */
  :root{
    --ink:#0f1a2b; --ink-2:#152238; --line:#2b3c5a;
    --paper:#efe9db; --paper-2:#e4dcc6; --paper-line:#c9bd9e;
    --text-lo:#f2f0e8; --muted:#93a3c0;
    --stamp:#b5432f; --stamp-dim:#7c3628; --radius:10px;
  }
  *{box-sizing:border-box;} html,body{margin:0;padding:0;}
  body{background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.55;}
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800;}
  .wrap{max-width:820px; margin:0 auto; padding:0 5vw 60px;}
  .top-bar{display:flex; justify-content:space-between; align-items:center; padding-top:20px;}
  .back-link{font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;}
  .back-link:hover{color:var(--paper);}
  .eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--stamp); margin:30px 0 6px;}
  h1{font-size:42px; letter-spacing:0.04em; margin:0 0 12px; color:var(--text-lo);}
  .intro{font-size:15px; line-height:1.6; color:var(--muted); max-width:660px; margin:0 0 8px;}
  .langs{font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted); margin:14px 0 8px;}
  .langs a{color:var(--muted); text-decoration:none;} .langs a:hover{color:var(--paper);}
  .lang-current{color:var(--stamp); font-weight:600;}
  ${INSIGHTS_STYLE}
</style>
</head>
<body>
<div class="wrap">
  <div class="top-bar"><a class="back-link" href="${escHtml(backHref)}">← Back</a></div>
  ${bodyHtml}
</div>
</body>
</html>`;
}

async function renderInsightsHub(request, env) {
  if (!env.eicc_content) return new Response("Missing D1 binding", { status: 500 });
  const { lang, shouldSetCookie, cookieDuplicated } = resolveInsightsLang(request);
  const ui = INSIGHTS_UI[lang] || INSIGHTS_UI.en;
  const articles = await getPublishedArticles(env.eicc_content, lang);

  const langLinks = SUPPORTED_LANGS.map((l) =>
    l === lang ? `<span class="lang-current">${l.toUpperCase()}</span>` : `<a href="/insights?lang=${l}">${l.toUpperCase()}</a>`
  ).join(" · ");

  const listFragment = articles.length
    ? renderInsightsListFragment(articles, lang, { articleHref: (slug) => `/insights/${slug}${lang !== "en" ? `?lang=${lang}` : ""}` })
    : `<p class="intro">Nothing published yet — check back soon.</p>`;

  const bodyHtml = `
    <p class="eyebrow">${escHtml(ui.eyebrow)}</p>
    <h1 class="display">${escHtml(ui.title)}</h1>
    <p class="intro">${escHtml(ui.intro)}</p>
    <p class="langs">${langLinks}</p>
    ${listFragment}`;

  const html = insightsPageShell({
    titleTag: ui.title, metaDescription: ui.intro, bodyHtml, lang,
    backHref: "/einvoicing-compliance-tracker.html",
  });

  const headers = new Headers({ "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "public, max-age=300" });
  if (shouldSetCookie) headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Domain=.e-invoicingcompliancecorner.com; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  if (cookieDuplicated) headers.append("Set-Cookie", `${LANG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return new Response(html, { headers });
}

async function renderInsightsArticle(request, env, slug) {
  if (!env.eicc_content) return new Response("Missing D1 binding", { status: 500 });
  const { lang, shouldSetCookie, cookieDuplicated } = resolveInsightsLang(request);
  const article = await getArticleBySlug(env.eicc_content, slug, lang);
  if (!article) return new Response("Not found", { status: 404 });

  // Public page: only actually gate readers when the piece is gated
  // AND not sponsored (a sponsor is paying for reach — see migration
  // 254's comment). Everything else renders in full, right here, on
  // the indexable root domain.
  const locked = !!article.gated && !article.is_sponsored;
  const unlockUrl = `https://members.e-invoicingcompliancecorner.com/members/insights/${slug}${lang !== "en" ? `?lang=${lang}` : ""}`;

  const langLinks = SUPPORTED_LANGS.map((l) =>
    l === lang ? `<span class="lang-current">${l.toUpperCase()}</span>` : `<a href="/insights/${slug}?lang=${l}">${l.toUpperCase()}</a>`
  ).join(" · ");

  const bodyHtml = `<p class="langs">${langLinks}</p>${renderArticleFragment(article, lang, { locked, unlockUrl })}`;

  const html = insightsPageShell({
    titleTag: article.title, metaDescription: article.dek, bodyHtml, lang,
    backHref: "/insights",
  });

  const headers = new Headers({ "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "public, max-age=300" });
  if (shouldSetCookie) headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Domain=.e-invoicingcompliancecorner.com; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  if (cookieDuplicated) headers.append("Set-Cookie", `${LANG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return new Response(html, { headers });
}

async function renderSourcesPage(request, env) {
  if (!env.eicc_content) return new Response("Missing D1 binding", { status: 500 });
  const url = new URL(request.url);
  let lang = url.searchParams.get("lang");
  let shouldSetCookie = false;
  const { value: cookieLang, duplicated: cookieDuplicated } = getCookie(request, LANG_COOKIE);
  if (lang && SUPPORTED_LANGS.includes(lang)) {
    shouldSetCookie = true;
  } else if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) {
    lang = cookieLang;
  } else {
    lang = pickBestSupportedLanguage(request.headers.get("Accept-Language")) || "en";
  }
  const ui = SOURCES_UI[lang] || SOURCES_UI.en;

  const { results } = await env.eicc_content.prepare(`
    SELECT c.name_en, c.code, c.region, ct.display_name,
           ts.url, COALESCE(tst.description, tste.description, ts.url) AS description
    FROM tracking_sources ts
    JOIN countries c ON c.id = ts.country_id
    LEFT JOIN country_translations ct ON ct.country_id = c.id AND ct.lang = ?
    LEFT JOIN tracking_source_translations tst ON tst.source_id = ts.id AND tst.lang = ?
    LEFT JOIN tracking_source_translations tste ON tste.source_id = ts.id AND tste.lang = 'en'
    WHERE ts.active = 1
    ORDER BY CASE c.region
      WHEN 'Europe' THEN 0 WHEN 'Middle East / Africa' THEN 1
      WHEN 'Asia-Pacific' THEN 2 WHEN 'Americas' THEN 3 ELSE 4 END,
      c.name_en, ts.sort_order
  `).bind(lang, lang).all();

  const byRegion = new Map();
  for (const r of results) {
    if (!byRegion.has(r.region)) byRegion.set(r.region, new Map());
    const countries = byRegion.get(r.region);
    const key = r.name_en;
    if (!countries.has(key)) countries.set(key, { display: r.display_name || r.name_en, flag: deriveFlagFromCode(r.code), sources: [] });
    countries.get(key).sources.push({ url: r.url, description: r.description });
  }

  let body = "";
  for (const region of [...SOURCES_REGION_ORDER.filter((x) => byRegion.has(x)), ...[...byRegion.keys()].filter((x) => !SOURCES_REGION_ORDER.includes(x))]) {
    body += `<h2 class="region">${escHtml(region)}</h2>`;
    for (const [, c] of byRegion.get(region)) {
      const items = c.sources.map((s) =>
        `<li><a href="${escHtml(s.url)}" target="_blank" rel="noopener">${escHtml(s.description)}</a><span class="src-url">${escHtml(s.url)}</span></li>`
      ).join("");
      body += `<div class="country"><h3><span class="flag" aria-hidden="true">${c.flag}</span>${escHtml(c.display)}</h3><ul>${items}</ul></div>`;
    }
  }

  const langLinks = SUPPORTED_LANGS.map((l) =>
    l === lang ? `<span class="lang-current">${l.toUpperCase()}</span>` : `<a href="/sources?lang=${l}">${l.toUpperCase()}</a>`
  ).join(" \u00b7 ");

  const html = `<!DOCTYPE html>
<html lang="${escHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(ui.title)} \u2014 The E-Invoicing Compliance Corner</title>
<meta name="description" content="${escHtml(ui.intro)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* Same dark shell as the country deep-dive pages (shared/deep-dive-
     render.mjs) -- and the same structural contract: a single <style>
     with :root{ and body{ rules (the tracker's in-page injector scopes
     both to :host{), all content inside .wrap, .top-bar first (the
     injector strips it and adds its own close control), and the .langs
     row (stripped in-page too -- the tracker's own language banner
     takes over there). */
  :root{
    --ink:#0f1a2b; --ink-2:#152238; --line:#2b3c5a;
    --paper:#efe9db; --paper-2:#e4dcc6; --paper-line:#c9bd9e;
    --text-lo:#f2f0e8; --muted:#93a3c0;
    --stamp:#b5432f; --stamp-dim:#7c3628; --radius:10px;
  }
  *{box-sizing:border-box;} html,body{margin:0;padding:0;}
  body{background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.55;}
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800;}
  .wrap{max-width:980px; margin:0 auto; padding:0 5vw 60px;}
  .top-bar{display:flex; justify-content:space-between; align-items:center; padding-top:20px;}
  .back-link{font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;}
  .back-link:hover{color:var(--paper);}
  .eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--stamp); margin:30px 0 6px;}
  h1{font-size:42px; letter-spacing:0.04em; margin:0 0 12px; color:var(--text-lo);}
  .intro{font-size:15px; line-height:1.6; color:var(--muted); max-width:660px; margin:0 0 8px;}
  .langs{font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted); margin:14px 0 8px;}
  .langs a{color:var(--muted); text-decoration:none;} .langs a:hover{color:var(--paper);}
  .lang-current{color:var(--stamp); font-weight:600;}
  h2.region{font-family:'IBM Plex Mono',monospace; font-size:13px; letter-spacing:0.24em; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--line); padding-bottom:8px; margin:38px 0 4px;}
  .country{border-bottom:1px solid var(--line); padding:16px 0 14px;}
  .country h3{font-size:17px; margin:0 0 8px; display:flex; align-items:center; gap:9px; color:var(--text-lo);}
  .country .flag{font-size:19px;}
  .country ul{list-style:none; margin:0; padding:0 0 0 30px;}
  .country li{margin:0 0 9px;}
  .country li a{color:var(--paper); font-weight:600; font-size:14.5px; text-decoration:none; border-bottom:1px solid var(--line);}
  .country li a:hover{color:var(--stamp); border-color:var(--stamp);}
  .src-url{display:block; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--muted); word-break:break-all; margin-top:2px;}
  @media(max-width:600px){ h1{font-size:30px;} .country ul{padding-left:0;} }
</style>
</head>
<body>
<div class="wrap">
  <div class="top-bar"><a class="back-link" href="/einvoicing-compliance-tracker.html">${ui.back}</a></div>
  <p class="eyebrow">${escHtml(ui.eyebrow)}</p>
  <h1 class="display">${escHtml(ui.title)}</h1>
  <p class="intro">${escHtml(ui.intro)}</p>
  <p class="langs">${langLinks}</p>
  ${body}
</div>
</body>
</html>`;

  const headers = new Headers({
    "Content-Type": "text/html; charset=UTF-8",
    "Cache-Control": "public, max-age=300",
  });
  if (shouldSetCookie) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Domain=.e-invoicingcompliancecorner.com; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  }
  if (cookieDuplicated) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  }
  return new Response(html, { headers });
}

// ================================================================
// /map — "The Map", a live D1-rendered choropleth of every tracked
// jurisdiction's mandate status (shared/map-data.mjs's
// computeCountryMapStatus, driven by the milestones.mandate_scope
// column added in migration 254/255). Like /sources and the country
// deep-dive pages, this matches no asset file, so the Worker always
// runs here -- no run_worker_first entry needed.
//
// The page embeds its own initial-language country data as a
// <script type="application/json"> blob (inert either way, so it
// survives being dropped into a shadow root's innerHTML when the
// tracker's in-page panel fetches this same page -- see
// einvoicing-compliance-tracker.html's openMapPage()), plus real
// <script src> tags for d3, topojson-client, and this repo's own
// map-panel.js. /map-data.json?lang=xx (renderMapDataJson below)
// serves the same per-language country array for every subsequent
// language switch, matching the /i18n/{lang}-data.json precedent for
// the tracker board itself.
// ================================================================

const MAP_PATHS = new Set(["/map", "/map.html"]);
const MAP_DATA_JSON_RE = /^\/map-data\.json$/;

const MAP_STYLE = `
  :root{
    --live:#3f7d5c; --live-dim:#274a38; --soon:#c98a3a; --soon-dim:#6e4c22;
    --upcoming:#6b7a95; --upcoming-dim:#3a4864; --tracked:#4a5568; --tracked-dim:#2c333d;
    --b2gonly:#c98a3a; --b2gonly-dim:#6e4c22; --nomandate:#8a5a75; --nomandate-dim:#4a2f3d;
  }
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800; letter-spacing:0.01em;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  .map-back-row{padding-top:20px;}
  .back-link{font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;}
  .back-link:hover{color:var(--paper);}
  .map-topbar{padding:14px 0 20px; border-bottom:1px solid var(--line); display:flex; flex-wrap:wrap; gap:16px 32px; align-items:flex-start; justify-content:space-between;}
  .map-topbar-brand{flex:1 1 480px; min-width:0;}
  .brand-eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--soon); margin:0 0 6px;}
  .brand-title{font-size:clamp(28px,4vw,44px); margin:0; text-transform:uppercase; line-height:0.95; white-space:nowrap;}
  @media (max-width:640px){ .brand-title{white-space:normal;} }
  .brand-sub{color:var(--muted); font-size:14.5px; max-width:640px; margin:10px 0 0;}
  .map-topbar-right{font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--muted); text-align:right;}
  .map-topbar-right a{color:var(--soon); text-decoration:underline;}
  .map-main{padding:28px 0 60px; max-width:1400px; margin:0 auto;}
  .layout{display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:24px; align-items:start;}
  @media (max-width:980px){ .layout{grid-template-columns:1fr;} }
  .card{background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:20px 22px;}
  .section-heading{font-size:15px; margin:0 0 14px; text-transform:uppercase; display:flex; align-items:baseline; gap:10px;}
  .section-heading span{font-size:11.5px; color:var(--muted); font-family:'IBM Plex Mono',monospace; text-transform:none; letter-spacing:0.02em;}
  .region-tabs{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;}
  .region-tab{font-family:'IBM Plex Mono',monospace; font-size:11.5px; text-transform:uppercase; letter-spacing:0.06em; background:var(--ink-3); border:1px solid var(--line); color:var(--muted); padding:8px 14px; border-radius:999px; cursor:pointer; transition:all .12s ease; display:flex; align-items:center; gap:7px;}
  .region-tab:hover{border-color:var(--soon); color:var(--text-lo);}
  .region-tab.active{background:var(--soon); border-color:var(--soon); color:#1a1207; font-weight:600;}
  .region-tab .count{opacity:.75; font-size:10.5px;}
  .map-wrap{position:relative;}
  .region-map-svg{width:100%; height:auto; display:none; background:var(--ink); border-radius:8px; border:1px solid var(--line);}
  .region-map-svg.active{display:block;}
  .geo-country{stroke:var(--ink); stroke-width:0.6; cursor:default; transition:filter .12s ease;}
  .geo-country.clickable{cursor:pointer;}
  .geo-country.clickable:hover{filter:brightness(1.28);}
  .geo-untracked{fill:var(--ink-3); stroke:var(--line); stroke-width:0.5;}
  .status-inforce{fill:var(--live);} .status-upcoming{fill:var(--upcoming);} .status-tracked{fill:var(--tracked);}
  .status-b2gonly{fill:var(--b2gonly);} .status-nomandate{fill:var(--nomandate);}
  .small-country-marker{cursor:pointer;}
  .small-country-marker circle{stroke:var(--ink); stroke-width:1.2; transition:filter .12s ease;}
  .small-country-marker:hover circle{filter:brightness(1.3);}
  .small-country-marker text{font-family:'IBM Plex Mono',monospace; font-size:9.5px; fill:var(--text-lo); letter-spacing:0.02em;}
  .leader-line{stroke:var(--muted); stroke-width:0.7; stroke-dasharray:2,2; pointer-events:none;}
  .map-tooltip{position:absolute; pointer-events:none; background:var(--paper); color:#241d10; border-radius:8px; padding:10px 12px; font-size:12.5px; max-width:220px; box-shadow:0 8px 20px rgba(0,0,0,.35); opacity:0; transition:opacity .1s ease; z-index:20;}
  .map-tooltip .tt-name{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:16px; margin:0 0 3px; text-transform:uppercase;}
  .map-tooltip .tt-status{font-family:'IBM Plex Mono',monospace; font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px; display:inline-block; padding:2px 7px; border-radius:999px;}
  .map-tooltip .tt-status.st-inforce{background:var(--live-dim); color:#bfe6cf;}
  .map-tooltip .tt-status.st-upcoming{background:var(--upcoming-dim); color:#dbe2ee;}
  .map-tooltip .tt-status.st-tracked{background:var(--tracked-dim); color:#c7ccd3;}
  .map-tooltip .tt-status.st-b2gonly{background:var(--b2gonly-dim); color:#ffe0b3;}
  .map-tooltip .tt-status.st-nomandate{background:var(--nomandate-dim); color:#f0d6e6;}
  .map-tooltip .tt-cta{font-size:11.5px; color:#6b5f3f; margin:2px 0 0;}
  .legend{display:flex; flex-wrap:wrap; gap:16px; margin-top:14px; font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted);}
  .legend-item{display:flex; align-items:center; gap:7px;}
  .legend-swatch{width:12px; height:12px; border-radius:3px; display:inline-block;}
  .map-note{margin-top:14px; font-size:12px; color:var(--muted); line-height:1.5;}
  .region-block{margin-bottom:6px; padding:2px 4px 6px; border-radius:8px; transition:background .15s ease;}
  .region-block:last-child{margin-bottom:0;}
  .region-block.active-region{background:rgba(201,138,58,0.08);}
  .region-name-toggle{all:unset; box-sizing:border-box; cursor:pointer; width:100%; font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted); margin:0 0 6px; padding:4px 4px; border-radius:6px; display:flex; align-items:center; gap:8px;}
  .region-name-toggle:hover{color:var(--text-lo);}
  .region-block.active-region .region-name-toggle{color:var(--soon);}
  .region-name-toggle::after{content:""; flex:1; height:1px; background:var(--line);}
  .region-count{font-size:10px; opacity:.75; flex:0 0 auto;}
  .chevron{font-size:9px; flex:0 0 auto; transition:transform .15s ease; display:inline-block;}
  .region-block.collapsed .chevron{transform:rotate(-90deg);}
  .region-rows{overflow:hidden; max-height:1200px; opacity:1; transition:max-height .18s ease, opacity .15s ease;}
  .region-block.collapsed .region-rows{max-height:0; opacity:0; pointer-events:none;}
  .country-row{display:flex; align-items:center; gap:9px; padding:6px 8px; border-radius:6px; text-decoration:none; font-size:13.5px; color:var(--text-lo); transition:background .1s ease;}
  .country-row:hover{background:var(--ink-3);}
  .country-row .flag{font-size:15px;}
  .country-row .name{flex:1; min-width:0;}
  .country-row .dot{width:8px; height:8px; border-radius:50%; flex:0 0 auto;}
  .dot.status-inforce{background:var(--live);} .dot.status-upcoming{background:var(--upcoming);} .dot.status-tracked{background:var(--tracked);}
  .dot.status-b2gonly{background:var(--b2gonly);} .dot.status-nomandate{background:var(--nomandate);}
  .news-row{display:flex; flex-direction:column; gap:3px; padding:10px 8px; border-bottom:1px solid var(--line); text-decoration:none; color:var(--text-lo); transition:background .1s ease; cursor:pointer;}
  .news-row:last-child{border-bottom:none;}
  .news-row:hover{background:var(--ink-3);}
  .news-date{font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.05em; text-transform:uppercase; color:var(--soon);}
  .news-countries{font-size:12px; color:var(--muted);}
  .news-title{font-size:13.5px; line-height:1.4;}

  /* Story pop-out modal -- same interaction pattern (and CSS) as the
     newsletter archive's own story modal (members-worker/src/index.js),
     ported here so a click on a news-row item behaves identically
     rather than leaving the page. */
  .modal-overlay{
    display:none; position:fixed; inset:0; z-index:200; background:rgba(6,10,18,0.72);
    align-items:flex-start; justify-content:center; padding:5vh 5vw 60px; overflow-y:auto;
  }
  .modal-overlay.open{display:flex;}
  .modal-card{
    position:relative; background:var(--paper); color:#241d10; border-radius:var(--radius);
    padding:32px; max-width:640px; width:100%; border:1px solid var(--paper-line);
  }
  .modal-close{
    position:absolute; top:14px; right:16px; background:none; border:none; font-size:26px;
    line-height:1; color:#6b5f3f; cursor:pointer; padding:4px;
  }
  .modal-close:hover{color:var(--stamp);}
  .modal-loading{color:#8a7d5a; font-size:13.5px; font-style:italic;}
  .footer-cta{margin-top:28px; display:flex; flex-wrap:wrap; gap:16px 28px; align-items:center; justify-content:space-between; background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:20px 24px;}
  .footer-cta p{margin:0; font-size:14px; color:var(--muted); max-width:520px;}
  .footer-cta-buttons{display:flex; gap:12px; flex-wrap:wrap;}
  .archive-btn{font-family:'IBM Plex Mono',monospace; font-size:12.5px; text-transform:uppercase; letter-spacing:0.08em; background:var(--stamp); color:#fff; padding:11px 20px; border-radius:999px; text-decoration:none; white-space:nowrap; font-weight:600;}
  .archive-btn:hover{background:var(--stamp-dim);}
  .subscribe-btn{font-family:'IBM Plex Mono',monospace; font-size:12.5px; text-transform:uppercase; letter-spacing:0.08em; background:var(--soon); color:#1a1207; padding:11px 20px; border-radius:999px; text-decoration:none; white-space:nowrap; font-weight:600;}
  .subscribe-btn:hover{background:var(--soon-dim); color:var(--paper);}
  .lang-switch{display:flex; gap:6px; margin-top:10px; justify-content:flex-end; flex-wrap:wrap;}
  .lang-btn{font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.05em; text-transform:uppercase; background:var(--ink-3); border:1px solid var(--line); color:var(--muted); padding:4px 10px; border-radius:999px; cursor:pointer;}
  .lang-btn:hover{border-color:var(--soon); color:var(--text-lo);}
  .lang-btn.active{background:var(--soon); border-color:var(--soon); color:#1a1207; font-weight:600;}
`;

function mapPageBodyHtml() {
  return `
<div class="map-back-row"><a class="back-link" href="/einvoicing-compliance-tracker.html" id="backToTrackerLink"></a></div>
<div class="map-topbar">
  <div class="map-topbar-brand">
    <p class="brand-eyebrow" id="brandEyebrow"></p>
    <h1 class="brand-title display" id="brandTitle"></h1>
    <p class="brand-sub" id="brandSub"></p>
  </div>
  <div class="map-topbar-right">
    <div class="lang-switch" id="langSwitch"></div>
  </div>
</div>
<div class="map-main">
  <div class="layout">
    <div class="card map-wrap">
      <div class="region-tabs" id="regionTabs"></div>
      <h2 class="section-heading display" id="mapHeading"></h2>
      <div id="mapSvgHost"></div>
      <div class="map-tooltip" id="tooltip"></div>
      <div class="legend" id="legendHost"></div>
      <p class="map-note" id="mapNote"></p>
    </div>
    <div class="card" id="sidebarList">
      <h2 class="section-heading display" id="sidebarHeading"></h2>
    </div>
  </div>
  <div class="footer-cta">
    <p id="footerText"></p>
    <div class="footer-cta-buttons">
      <a class="archive-btn" href="https://members.e-invoicingcompliancecorner.com/members/archive" id="archiveBtnLink"></a>
      <a class="subscribe-btn" href="/subscribe.html" id="subscribeBtnLink"></a>
    </div>
  </div>
</div>
<div class="modal-overlay" id="storyModalOverlay">
  <div class="modal-card">
    <button class="modal-close" id="storyModalClose" aria-label="Close">&times;</button>
    <div id="storyModalBody"></div>
  </div>
</div>`;
}

const ROI_PATHS = new Set(["/roi-calculator", "/roi-calculator.html", "/roi", "/roi.html"]);

// ---- compliance guides --------------------------------------------------
//
// Two routes, both gated, and the split is the point: /compliance-guides is
// a web page a reader chooses on, /compliance-guides/guide is a printable
// document. Same feature, opposite media, so they share no chrome at all.
//
// NO ENV FLAG ON THESE, unlike ROI_PUBLIC, and that is a deliberate
// difference rather than an oversight. ROI_PUBLIC exists because the
// planner spent ten days being road-tested while its route had to answer
// 404 to the world. These routes answer a sign-up wall to anyone without a
// session from their first deploy, so there is nothing a flag would hide
// that the gate does not already hold back -- and menu-routes.mjs makes a
// flagged, menu-linked route promise things (in-page interception, a frame
// protocol) that a plain navigation link should not have to keep.
const GUIDES_PATHS = new Set(["/compliance-guides", "/compliance-guides.html"]);

// ---- methodology --------------------------------------------------------
//
// Public, indexable, and deliberately not gated. It is the page a reader
// goes to when they want to argue with a status, and the one another
// publication would cite -- neither of which works behind a wall or
// inside the About modal, which has no URL at all.
const METHOD_PATHS = new Set(["/methodology", "/methodology.html"]);
const GUIDE_DOC_PATHS = new Set(["/compliance-guides/guide"]);

// The members subdomain, written once. It appears in four other places
// in this file as a literal; this is the first that is read by shared
// code rather than emitted into markup here, so it gets a name.
const MEMBERS_ORIGIN = "https://members.e-invoicingcompliancecorner.com";

// ---- the auth relay -----------------------------------------------------
//
// A MAP, NOT A PREFIX REWRITE. The tempting version of this route is
// "anything under /api/auth/ goes to members-worker with the same path",
// and it is one typo in members-worker's router away from exposing an
// admin endpoint to the public origin. Two entries, both written out,
// and adding a third is a deliberate act.
const AUTH_RELAY = new Map([
  ["/api/auth/code/request", "/members/api/code/request"],
  ["/api/auth/code/verify", "/members/api/code/verify"],
]);

// ---- and the archive, for the same reason ------------------------------
//
// THE BUG, reported by Dan on 21 August 2026: the newsletter archive
// showed "You're viewing the full archive for free — no account needed"
// to everyone, "regardless of whether you are subscribed or not, or
// logged in or not."
//
// members-worker was right. The tracker's in-page archive panel fetched
// it CROSS-ORIGIN with no credentials option, so fetch()'s default of
// `same-origin` applied and the cookie was never sent. Every request
// arrived anonymous, so the promo banner rendered and the "Signed in as"
// line never did — for subscribers, on the page their subscription is
// most for.
//
// It has been like that since the panel was built. Nothing pointed at it
// until 20 August, because until then the tracker had no signed-in state
// for the banner to contradict. A defect can sit in plain sight for
// weeks and only become visible when something else grows a memory.
//
// THE FIX IS NOT CORS-WITH-CREDENTIALS. That is what this codebase has
// twice declined to turn on, and it would mean relaxing the one header
// standing between a subscriber's session and any page that can talk to
// members-worker. It is a relay instead — the same service binding the
// auth panel and the saved-countries lookup already use, so the browser
// talks to its own origin and the cookie travels as a first-party one.
const ARCHIVE_RELAY_PREFIX = "/api/archive";

/** GET relay for the archive, list and single issue.
 *
 *  Deliberately narrower than the auth relay's exact-path map: the issue
 *  route carries a slug, so a prefix is unavoidable. The slug is
 *  re-encoded rather than pasted, and anything with a slash in it is
 *  refused — a relay that forwards "../../admin/..." is a relay that
 *  hands the public origin whatever the other Worker will answer. */
async function relayArchive(request, env, url) {
  if (!env.MEMBERS) return new Response("Not found", { status: 404 });
  const rest = url.pathname.slice(ARCHIVE_RELAY_PREFIX.length);   // "" or "/<slug>"
  let target;
  if (rest === "" || rest === "/") {
    target = "/members/archive";
  } else {
    const slug = decodeURIComponent(rest.slice(1));
    if (!slug || slug.includes("/") || slug.includes("..")) {
      return new Response("Not found", { status: 404 });
    }
    target = "/members/archive/" + encodeURIComponent(slug);
  }
  const qs = url.searchParams.toString();

  let upstream;
  try {
    upstream = await env.MEMBERS.fetch(new Request(
      MEMBERS_ORIGIN + target + (qs ? "?" + qs : ""),
      { headers: { Cookie: request.headers.get("Cookie") || "" } }));
  } catch (err) {
    console.warn(`archive relay: service binding failed — ${err && err.message}`);
    return new Response("Archive unavailable", { status: 503 });
  }

  // PRIVATE AND Vary: Cookie, because this response now differs per
  // reader — a signed-in subscriber gets their name and their preferred
  // countries where an anonymous visitor gets the promo banner. This is
  // trap 1 from the logged-in-site evaluation, arriving for real: a
  // personalised response that is publicly cacheable serves one
  // subscriber's page to the next person along.
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Vary", "Cookie");
  return new Response(upstream.body, { status: upstream.status, headers });
}

// Headers that must survive the hop, and nothing else.
//
// Cookie carries the browser-binding cookie on the way in; Set-Cookie
// carries the session on the way out. Content-Type because the body is
// JSON. The client IP is forwarded EXPLICITLY under our own name --
// behind a service binding the connecting address members-worker sees is
// Cloudflare's, not the reader's, so without this every relayed request
// would land in one rate-limit bucket and the twentieth signup of the
// hour would lock out the twenty-first reader anywhere in the world.
async function relayToMembers(request, env, path) {
  if (!env.MEMBERS) {
    // No binding means one of the two Workers has not been deployed.
    // Said plainly rather than as a 404, because the panel needs to tell
    // the reader something true and "not found" is not it.
    return new Response(JSON.stringify({ ok: false, error: "unavailable" }), {
      status: 503, headers: { "Content-Type": "application/json; charset=UTF-8" },
    });
  }
  const headers = new Headers();
  headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
  headers.set("Cookie", request.headers.get("Cookie") || "");
  headers.set("X-EICC-Client-IP", request.headers.get("CF-Connecting-IP") || "unknown");

  let upstream;
  try {
    upstream = await env.MEMBERS.fetch(new Request(MEMBERS_ORIGIN + path, {
      method: "POST",
      headers,
      body: await request.text(),
    }));
  } catch (err) {
    console.warn(`auth relay: service binding failed — ${err && err.message}`);
    return new Response(JSON.stringify({ ok: false, error: "unavailable" }), {
      status: 503, headers: { "Content-Type": "application/json; charset=UTF-8" },
    });
  }

  // getSetCookie() rather than get("Set-Cookie"). The sign-in response
  // carries FOUR Set-Cookie headers -- session, display name, the legacy
  // host-only clear, and the binding cookie's own clear -- and get()
  // returns them folded into one comma-joined string that no browser
  // will parse back into four. Reading them as a list is the difference
  // between signing someone in and appearing to.
  const out = new Headers({ "Content-Type": "application/json; charset=UTF-8" });
  const cookies = typeof upstream.headers.getSetCookie === "function"
    ? upstream.headers.getSetCookie()
    : [];
  for (const c of cookies) out.append("Set-Cookie", c);
  // Never cached. Obvious, and exactly the kind of obvious that gets
  // missed: a cached 200 from this route would hand one reader's
  // Set-Cookie to the next one.
  out.set("Cache-Control", "no-store");
  return new Response(await upstream.text(), { status: upstream.status, headers: out });
}

// ---- the signup panel's own strings, for the planner --------------------
//
// The panel is one file shared by the static pages and the planner, but
// the two get their translations by different routes. The static pages
// have i18n.js, which loads i18n/<lang>.json already; the planner is a
// Worker-rendered document with no i18n.js at all, so this hands it the
// same data inline.
//
// ONE SOURCE, TWO TRANSPORTS. The strings are NOT copied into D1 for
// this. A second copy is the defect this project keeps meeting; a second
// way of delivering one copy is not, and the asset layer already holds
// the file. env.ASSETS.fetch() reads it exactly as a browser would.
//
// FLATTENED TO DOTTED KEYS, because that is the shape auth-overlay.js's
// t() looks things up by. i18n.js walks the nested object instead, which
// is why the file itself is nested — the flattening belongs here, at the
// one consumer that wants it otherwise.
async function authStrings(env, lang, subtree = "auth") {
  if (!env.ASSETS) return {};
  try {
    const res = await env.ASSETS.fetch(
      new Request(`https://assets.local/i18n/${encodeURIComponent(lang)}.json`));
    if (!res.ok) return {};
    const doc = await res.json();
    const out = {};
    const walk = (node, prefix) => {
      for (const [k, v] of Object.entries(node || {})) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object") walk(v, key);
        else if (typeof v === "string") out[key] = v;
      }
    };
    walk(doc[subtree], "");
    return out;
  } catch (err) {
    // FAILS SOFT, like the saved-countries lookup. A missing or malformed
    // language file means the panel falls back to its own English, which
    // is a worse panel and still a working one. Taking the planner down
    // over a translation would be the wrong trade by a wide margin.
    console.warn(`auth strings: could not load i18n/${lang}.json — ${err && err.message}`);
    return {};
  }
}

// The wall's own styles. Sized like a PAGE rather than a dialog: it is
// what the reader navigated to, not something interrupting them.
//
// These moved here from the tracker, where they had been dead since the
// panel-level gate was removed on 20 August -- CSS for markup that no
// longer existed, sitting in the file waiting to be mistaken for live
// rules. Now that the gate is the route, the rules live with the thing
// they style and there is only one copy.
const ROI_GATE_STYLE = `
.roi-gate{max-width:60ch; margin:0 auto; padding:64px 0 80px; text-align:center}
.roi-gate-eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:2px;
  text-transform:uppercase; color:var(--soon); margin:0 0 8px}
.roi-gate-title{font-family:'Big Shoulders Display',sans-serif; font-weight:800;
  font-size:clamp(26px,4vw,38px); text-transform:uppercase; letter-spacing:.5px;
  margin:0 0 14px; color:var(--text-lo)}
.roi-gate-body{color:var(--muted); margin:0 0 22px; line-height:1.6}
.roi-gate-actions{margin:0 0 12px}
.roi-gate-cta{display:inline-block; background:var(--soon); border:1px solid var(--soon);
  color:#231a09; font-weight:700; border-radius:6px; padding:11px 20px; cursor:pointer;
  font-family:inherit; font-size:15px}
.roi-gate-cta:hover{filter:brightness(1.08)}
.roi-gate-signin{font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--muted); margin:0}
/* A button that has to read as a link, because it does a link's job in a
   place where a link would be wrong -- see the note by the wiring. */
.roi-gate-signin button{background:none; border:0; padding:0; cursor:pointer;
  font:inherit; color:var(--muted); text-decoration:underline; text-underline-offset:2px}
.roi-gate-signin button:hover{color:var(--soon)}
`;

// ---- THE GATE, AND THIS TIME IT ACTUALLY WITHHOLDS SOMETHING ----------
//
// Dan, 21 August 2026, choosing between leaving the planner open and
// walling it: "gate the whole roi-calculator page, rather than show any
// of it."
//
// THIS IS THE THIRD TIME A GATE HAS BEEN BUILT FOR THIS PAGE, and the
// first two are the reason this one is here rather than in the tracker.
//
//   591  put a wall in the PLANNER, in front of the results only.
//   -    a wall in the TRACKER's menu panel, in front of the frame.
//   -    both removed on 20 August, when Dan settled on "results
//        immediately with the code protecting the account".
//
// The tracker's version withheld NOTHING. It was client-side markup in a
// panel, and /roi-calculator answered anyone who typed it -- so it turned
// readers away from a page it could not actually close. Its own comment
// claimed "the real gate is on the route itself, server-side", and that
// was never true: ROI_PUBLIC decides whether the route EXISTS, not who
// may have it.
//
// So the rule this time: THE GATE IS THE ROUTE. A signed-out request
// never causes the planner to be rendered at all -- not hidden, not
// disabled, not overlaid. It returns before the five D1 queries that
// build the tool, which also means the wall is cheaper than the page it
// replaces. There is no URL to type past, because there is nothing behind
// the URL to reach.
//
// IT COSTS SOMETHING, RECORDED HONESTLY because I argued against it and
// was overruled, which is exactly the kind of decision that gets
// rediscovered later as a bug. Nobody now sees the tool before deciding
// whether to sign up, on a page that is unindexed and marked Beta, so
// most arrivals have no account and nothing to judge it by. If signups do
// not move, that is the thing to revisit first -- and the middle option
// (show the case, gate the dated wave plan and the PDF) is the one that
// was on the table.
//
// EVERY STRING IS ALREADY TRANSLATED. roiPanel.gate* has existed in all
// four languages since the tracker's version, and survived the removal
// precisely because deleting five translated strings on Monday and asking
// for them again on Tuesday is not tidiness -- see the note left in
// migration 600's place. The sign-in label is auth.signin.eyebrow rather
// than a sixth string saying the same word.
//
// AND IT IS THE SAME PANEL BEHIND IT, not a hop to the members origin.
// That is the part of the 20 August design that survives intact: the
// reader subscribes or signs in with a 6-digit code, in place, without a
// second window. On success the page reloads and the planner is simply
// there.
// PARAMETERISED ON 22 AUGUST, when the compliance guides needed the same
// wall. The alternative was a second copy of ninety lines whose only
// differences were four strings and a canonical URL -- and "a second copy"
// is the defect this project keeps meeting, most recently as the gate CSS
// that sat dead in the tracker for two days after the markup it styled was
// deleted. One wall, two callers.
//
// What is NOT parameterised: the buttons, the panel wiring, the noindex and
// the fail-soft fallback to /subscribe.html. Those are the parts that were
// argued about and got right, and a caller that could vary them would
// eventually vary them.
async function renderSubscriberGate(request, env, lang, framed, spec) {
  const [panel, gate] = await Promise.all([
    authStrings(env, lang, "auth"),
    authStrings(env, lang, spec.namespace),
  ]);
  // The file is the source; these are the fallbacks for a missing or
  // malformed language file, which authStrings answers with {}.
  const g = (k, fallback) => (typeof gate[k] === "string" && gate[k]) || fallback;
  const signIn = (typeof panel["signin.eyebrow"] === "string" && panel["signin.eyebrow"]) || "Sign in";

  const body = `<div class="wrap"><div class="roi-gate">
<p class="roi-gate-eyebrow">${g("gateEyebrow", spec.eyebrow)}</p>
<h1 class="roi-gate-title">${g("gateTitle", spec.title)}</h1>
<p class="roi-gate-body">${g("gateBody", spec.blurb)}</p>
<p class="roi-gate-actions"><button type="button" class="roi-gate-cta" id="roiGateSubscribe">${g("gateSubscribe", "Subscribe free")}</button></p>
<p class="roi-gate-signin">${g("gateSignedUp", "Already subscribed?")} <button type="button" id="roiGateSignin">${escHtml(signIn)}</button></p>
</div></div>`;

  // BUTTONS, NOT LINKS, and the difference is the whole point of the 20
  // August design. A link goes somewhere; these open the panel where the
  // reader already is. There is no href to fall back to because there is
  // no second page to fall back TO -- the members login is the one route
  // that still emails a link rather than a code, and sending people there
  // is the exact bug Dan reported on 21 August.
  //
  // If auth-overlay.js somehow fails to load, the buttons do nothing and
  // say nothing, which is worse than a dead link. So the wiring checks,
  // and falls back to the subscribe page rather than to silence.
  const script = `
(function(){
  function go(mode){
    if(window.EICC_AUTH && window.EICC_AUTH.open){
      // No onSuccess: the panel's DEFAULT on success is to reload, and
      // here that is exactly right. It is suppressed inside the planner
      // because a reload there would throw away ten minutes of typed
      // business case -- but this page has nothing to protect, and the
      // reload is what replaces the wall with the tool.
      window.EICC_AUTH.open({ mode: mode });
      return;
    }
    window.top.location.href = '/subscribe.html';
  }
  var sub = document.getElementById('roiGateSubscribe');
  var sin = document.getElementById('roiGateSignin');
  if(sub) sub.addEventListener('click', function(){ go('subscribe'); });
  if(sin) sin.addEventListener('click', function(){ go('signin'); });
})();`;

  const html = `<!DOCTYPE html><html lang="${escHtml(lang)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(spec.docTitle)} — The E-Invoicing Compliance Corner</title>
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="https://e-invoicingcompliancecorner.com${escHtml(spec.canonical)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${ROI_STYLE}${framed ? FRAMED_ROI_STYLE : ""}${ROI_GATE_STYLE}</style></head><body${framed ? ' data-framed="1"' : ""}>${body}<script>window.EICC_AUTH_STRINGS=${JSON.stringify(panel).replace(/<\//g, "<\\/")};</script><script src="/auth-overlay.js?v=3"></script><script>${script}</script>${framed ? `<script>${ROI_FRAME_REPORTER}</script>` : ""}</body></html>`;

  // NOINDEX UNCONDITIONALLY, and not because ROI_INDEXABLE says so.
  //
  // ROI_INDEXABLE is a decision about the PLANNER. This is a wall, and a
  // wall is never the thing to put in an index: the one outcome worse
  // than not ranking for the planner is ranking for it and landing every
  // arrival on a page that does not contain it. If the planner is ever
  // opened to search engines, the answer is to serve them the planner,
  // not to let them index the door.
  return new Response(html, { headers: {
    "content-type": "text/html; charset=utf-8",
    // Anonymous and identical for everyone in this language, so it caches
    // the same sixty seconds the anonymous planner used to. Vary stays,
    // because the very next request may carry a cookie and must not be
    // answered from here.
    "cache-control": "public, max-age=60",
    vary: "Cookie",
    "x-eicc-session": await sessionDiagnostic(request, env.SESSION_SECRET),
  }});
}

const renderRoiGate = (request, env, lang, framed) =>
  renderSubscriberGate(request, env, lang, framed, {
    namespace: "roiPanel",
    canonical: "/roi-calculator",
    docTitle: "E-Invoicing ROI & Wave Planner",
    eyebrow: "Subscriber tool",
    title: "ROI &amp; Wave Planner",
    blurb: "Subscribing is free. The planner builds a board-ready business case from your own invoice volumes and country footprint, with a delivery wave plan back-planned from the real published deadlines this site tracks &mdash; and an evidence grade against every benchmark it uses.",
  });

const renderGuidesGate = (request, env, lang, framed) =>
  renderSubscriberGate(request, env, lang, framed, {
    namespace: "guides",
    canonical: "/compliance-guides",
    docTitle: "Compliance guides",
    eyebrow: "Subscriber tool",
    title: "Compliance guides",
    blurb: "Subscribing is free. Pick the markets you care about and we will build a one-page briefing for each &mdash; the mandate as it stands, the dated timeline, the penalties, the key facts and what to do next &mdash; ready to print or save as a PDF.",
  });

// ================================================================
// COMPLIANCE GUIDES
// ================================================================
//
// THE GATE IS THE ROUTE HERE TOO. Both handlers below check the session
// before they touch D1, so a signed-out request never causes a bundle to
// be built. That is the rule migration-era note in renderSubscriberGate
// spells out, and it matters more on the document route than it did on
// the planner: /compliance-guides/guide?c=... with seventy codes is six
// queries over every country this site tracks, and an ungated version of
// it would be the cheapest way anyone has ever had to make this Worker do
// a lot of work.

/**
 * Which countries can be in a guide: those with a deep dive to build one
 * from. The European Union is a bloc rather than a jurisdiction and has
 * no page of its own here, the same exclusion the fit harness makes.
 */
async function getGuideCountries(db) {
  const { results } = await db.prepare(
    `SELECT c.code, c.name_en, c.region
       FROM countries c
       JOIN deep_dive_pages ddp ON ddp.country_id = c.id
      WHERE c.code != 'EU'
      ORDER BY c.region, c.name_en`).all();
  return results || [];
}

/** Their followed countries, or nothing. Fails soft, like the planner's. */
async function savedCountriesFor(request, env) {
  if (!env.MEMBERS) return [];
  try {
    const r = await env.MEMBERS.fetch(new Request(
      MEMBERS_ORIGIN + "/members/api/saved-countries",
      { headers: { Cookie: request.headers.get("Cookie") || "" } }));
    if (!r.ok) {
      console.warn(`guides: saved countries answered ${r.status}`);
      return [];
    }
    const body = await r.json();
    return Array.isArray(body.countries) ? body.countries : [];
  } catch (err) {
    console.warn(`guides: saved countries failed — ${err && err.message}`);
    return [];
  }
}

/**
 * Build a t() over one flattened i18n subtree, with the caller's English
 * as the fallback. Same contract guides-render.mjs's makeT() has, so the
 * picker and the document read strings identically.
 */
// {0}/{1} substitution for text that is escaped afterwards. Named apart
// from the guides' fill() because that one is used inside HTML templates
// where the arguments are already escaped; here the whole result goes
// through escHtml, so this must NOT escape or the page prints &amp;.
function fillPlain(template, ...args) {
  return String(template).replace(/\{(\d+)\}/g, (m, i) =>
    args[Number(i)] === undefined ? m : String(args[Number(i)]));
}

function subtreeT(strings) {
  return (key, fallback) =>
    (typeof strings[key] === "string" && strings[key]) || fallback;
}

// THE NUMBERS ON THIS PAGE ARE QUERIED, NOT WRITTEN.
//
// A page about evidence standards that prints a stale figure about
// itself is an argument against itself. This site has also been bitten
// by exactly that: the jurisdiction count sat at 62 across thirty-odd
// files for two days in August because it was hand-swept, and
// tests/jurisdiction-count.mjs exists because of it.
//
// So "18 of 350 facts are recorded as not confirmed" is counted at
// request time. If somebody researches Bahrain tomorrow, the sentence
// changes by itself.
async function renderMethodologyPage(request, env) {
  if (!env.eicc_content) return new Response("Missing D1 binding", { status: 500 });
  const { lang, shouldSetCookie } = resolveInsightsLang(request);
  // TWO SUBTREES, and the second is the point of the section it feeds.
  // The five status words are defined on this page and PRINTED on every
  // country page and every guide, so they have to be the same strings --
  // if the page explaining ACTIVE says a different word from the tile
  // saying ACTIVE, the explanation is worse than none. They live in the
  // guides subtree because that is where the tiles read them from.
  const [strings, guideStrings] = await Promise.all([
    authStrings(env, lang, "method"),
    authStrings(env, lang, "guides"),
  ]);
  const t = subtreeT(strings);
  const g = subtreeT(guideStrings);

  const row = await env.eicc_content.prepare(`
    SELECT count(*) AS countries,
           count(*) * 5 AS facts,
           sum((b2g_status = 'unknown') + (b2b_status = 'unknown') + (b2c_status = 'unknown')
             + (archiving_status = 'unknown') + (signature_status = 'unknown')) AS unknowns,
           max(last_verified) AS latest
      FROM country_headline_facts`).first();
  const countries = row?.countries ?? 0;
  const facts = row?.facts ?? 0;
  const unknowns = row?.unknowns ?? 0;

  const p = (key, en) => `<p>${escHtml(t(key, en))}</p>`;
  const h = (key, en) => `<h2>${escHtml(t(key, en))}</h2>`;
  const status = (word, key, en) =>
    `<div class="st"><span class="w">${escHtml(word)}</span><span>${escHtml(t(key, en))}</span></div>`;

  const body = `
  ${h("src.h", "What counts as a source")}
  ${p("src.p1", "A citation has to substantiate the specific claim it is attached to, not the general topic.")}
  ${p("src.p2", "We prefer the government or authority text over anyone's summary of it.")}
  ${p("src.p3", "This standard was written after auditing our own citations.")}

  ${h("unk.h", "“Not confirmed” is an answer")}
  ${p("unk.p1", "Where we could not confirm a fact, we say so and record why.")}
  <p class="fig">${escHtml(fillPlain(t("unk.count",
    "Right now {0} of the {1} headline facts we publish are recorded as not confirmed."),
    unknowns, facts))}</p>

  ${h("st.h", "What a status means")}
  ${p("st.lead", "Every jurisdiction we track carries the same five facts.")}
  <div class="sts">
    ${status(g("hl.active", "ACTIVE"), "st.active", "In force now for the segment named.")}
    ${status(g("hl.planned", "PLANNED"), "st.planned", "Enacted and dated, not yet in force.")}
    ${status(g("hl.voluntary", "VOLUNTARY"), "st.voluntary", "A real, operating, optional scheme.")}
    ${status(g("hl.none", "NO MANDATE"), "st.none", "No obligation and no operating voluntary scheme.")}
    ${status(g("hl.unknown", "NOT CONFIRMED"), "st.unknown", "Researched and unconfirmable, or not yet researched.")}
  </div>

  ${h("iss.h", "A status describes the duty to issue")}
  ${p("iss.p1", "Being obliged to receive an e-invoice is not the same as being obliged to send one.")}
  ${p("iss.p2", "Where public bodies must accept but suppliers may still send paper, we record no mandate.")}
  ${p("iss.p3", "The duty to receive is never dropped.")}

  ${h("strict.h", "Where we are deliberately stricter")}
  ${p("strict.p1", "A draft bill is not a plan.")}
  ${p("strict.p2", "The effect is that we sometimes publish a less exciting answer than the market does.")}

  ${h("ev.h", "Graded evidence, where we have it")}
  ${p("ev.p1", "The ROI planner grades every benchmark it uses from A to D.")}

  ${h("gap.h", "What we do not do yet")}
  ${p("gap.p1", "We do not publish a grade against each country claim.")}
  ${p("gap.p2", "We also cannot yet show you what a fact used to say.")}

  ${h("fix.h", "Tell us when we are wrong")}
  ${p("fix.p1", "Mandates move and we get things wrong.")}
  <p class="cta"><a href="/feedback.html">${escHtml(t("fix.cta", "Send a correction"))}</a>
     <a href="/sources">${escHtml(t("link.sources", "The sources we monitor"))}</a></p>
  <p class="fig">${escHtml(fillPlain(t("verified",
    "Covering {0} jurisdictions. Last fact-check recorded {1}."), countries, row?.latest || "—"))}</p>`;

  const langLinks = SUPPORTED_LANGS.map((l) =>
    l === lang ? `<span class="lang-current">${l.toUpperCase()}</span>`
      : `<a href="/methodology?lang=${l}">${l.toUpperCase()}</a>`).join(" · ");

  const html = `<!DOCTYPE html>
<html lang="${escHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(t("title", "Methodology"))} — The E-Invoicing Compliance Corner</title>
<meta name="description" content="${escHtml(t("intro", "What we require of a source, what our status words mean, and where we are stricter than other trackers."))}">
<link rel="canonical" href="https://e-invoicingcompliancecorner.com/methodology">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* The same structural contract as /sources: one style block with
     :root{ and body{ (the tracker's in-page injector rewrites both to
     :host{), everything inside .wrap, .top-bar first, .langs stripped
     in-page. */
  :root{
    --ink:#0f1a2b; --ink-2:#152238; --line:#2b3c5a;
    --paper:#efe9db; --text-lo:#f2f0e8; --muted:#93a3c0;
    --stamp:#b5432f; --live:#3f7d5c; --soon:#c98a3a; --upcoming:#6b7a95;
  }
  *{box-sizing:border-box;} html,body{margin:0;padding:0;}
  body{background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.6;}
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800;}
  .wrap{max-width:760px; margin:0 auto; padding:0 5vw 70px;}
  .top-bar{display:flex; justify-content:space-between; align-items:center; padding-top:20px;}
  .back-link{font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;}
  .back-link:hover{color:var(--paper);}
  .eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--stamp); margin:30px 0 6px;}
  h1{font-size:42px; letter-spacing:0.04em; margin:0 0 12px;}
  h2{font-family:'Big Shoulders Display',sans-serif; font-weight:700; font-size:23px; letter-spacing:.03em;
     text-transform:uppercase; margin:38px 0 10px; padding-bottom:7px; border-bottom:1px solid var(--line);}
  p{font-size:15.5px; color:#dfe4ee; margin:0 0 13px;}
  .intro{font-size:16.5px; color:var(--muted); margin:0 0 8px;}
  .langs{font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted); margin:14px 0 8px;}
  .langs a{color:var(--muted); text-decoration:none;} .langs a:hover{color:var(--paper);}
  .lang-current{color:var(--stamp); font-weight:600;}
  .fig{font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted);
       border-left:2px solid var(--line); padding-left:12px; margin:16px 0 0;}
  .sts{margin:14px 0 0;}
  .st{display:grid; grid-template-columns:11.5em 1fr; gap:12px; padding:9px 0; border-bottom:1px solid var(--line);}
  .st .w{font-family:'IBM Plex Mono',monospace; font-size:11.5px; letter-spacing:.12em;
         color:var(--paper); padding-top:2px;}
  .st span:last-child{font-size:14.5px; color:#dfe4ee;}
  .cta{margin:18px 0 0; display:flex; gap:22px; flex-wrap:wrap;}
  .cta a{color:var(--paper); font-weight:600; font-size:14.5px; text-decoration:none; border-bottom:1px solid var(--line);}
  .cta a:hover{color:var(--stamp); border-color:var(--stamp);}
  @media(max-width:600px){ h1{font-size:30px;} .st{grid-template-columns:1fr; gap:2px;} }
</style>
</head>
<body>
<div class="wrap">
  <div class="top-bar"><a class="back-link" href="/einvoicing-compliance-tracker.html">${
    escHtml(t("back", "← Back to global tracker"))}</a></div>
  <p class="eyebrow">${escHtml(t("eyebrow", "How we decide"))}</p>
  <h1 class="display">${escHtml(t("title", "Methodology"))}</h1>
  <p class="intro">${escHtml(t("intro", "What we require of a source, and what our status words mean."))}</p>
  <p class="langs">${langLinks}</p>
  ${body}
</div>
</body>
</html>`;

  const headers = new Headers({
    "Content-Type": "text/html; charset=UTF-8",
    // Indexable and identical for everyone in a language, so it caches
    // properly -- unlike the guides, there is nothing per-reader here.
    "Cache-Control": "public, max-age=600",
  });
  if (shouldSetCookie) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Domain=.e-invoicingcompliancecorner.com; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  }
  return new Response(html, { headers });
}

async function renderComplianceGuidesPicker(request, env) {
  const { lang } = resolveInsightsLang(request);
  // frame=1, the same plain query parameter the planner uses. A referrer
  // check would make a bookmarked ?frame=1 behave differently from one
  // reached through the menu, and a page that renders differently
  // depending on how you arrived is a page nobody can debug.
  const framed = new URL(request.url).searchParams.get("frame") === "1";
  const signedInAs = await sessionEmail(request, env.SESSION_SECRET);
  if (!signedInAs) return renderGuidesGate(request, env, lang, framed);

  const [countries, saved, strings, regionNames] = await Promise.all([
    getGuideCountries(env.eicc_content),
    savedCountriesFor(request, env),
    authStrings(env, lang, "guides"),
    authStrings(env, lang, "regionNames"),
  ]);
  const t = subtreeT(strings);
  const body = renderPickerBody({
    countries, saved, lang, t, framed,
    regionName: (r) => (typeof regionNames[r] === "string" && regionNames[r]) || r,
  });

  const html = `<!DOCTYPE html><html lang="${escHtml(lang)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(t("pick.title", "Compliance guides"))} — The E-Invoicing Compliance Corner</title>
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="https://e-invoicingcompliancecorner.com/compliance-guides">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${ROI_STYLE}${framed ? FRAMED_ROI_STYLE : ""}${PICKER_STYLE}</style></head><body${
    framed ? ' data-framed="1"' : ""}>${body}<script>${PICKER_SCRIPT}</script>${
    framed ? `<script>${ROI_FRAME_REPORTER}</script>` : ""}</body></html>`;

  return new Response(html, { headers: {
    "content-type": "text/html; charset=utf-8",
    // PRIVATE, and this is the one place the guides differ from the gate.
    // The picker is rendered per reader -- their followed countries are
    // ticked -- so a shared cache holding it would hand one subscriber's
    // footprint to the next. no-store rather than private, because the
    // page is cheap and being wrong here is not.
    "cache-control": "no-store",
    vary: "Cookie",
    "x-eicc-session": await sessionDiagnostic(request, env.SESSION_SECRET),
  }});
}

// A GUIDE OF NOTHING IS NOT AN ERROR, and neither is a guide of seventy.
//
// The cap is the number of countries this site tracks, because that is
// the largest honest request: "all of them" is a thing a reader will
// legitimately ask for and the fitter has been calibrated on exactly that
// document. What the cap stops is a hand-typed URL repeating the same
// code four hundred times -- deduplicated first, so a reader who does
// that gets their guide rather than a refusal.
const GUIDE_MAX_COUNTRIES = 70;

async function renderComplianceGuideDocument(request, env) {
  const url = new URL(request.url);
  const { lang } = resolveInsightsLang(request);
  const signedInAs = await sessionEmail(request, env.SESSION_SECRET);
  // NEVER FRAMED, whatever the chooser was. The document opens in its own
  // window (the chooser's form targets _blank) precisely so a reader meets
  // it full-width with their own print dialogue and nothing between them
  // and the paper.
  if (!signedInAs) return renderGuidesGate(request, env, lang, false);

  const countries = await getGuideCountries(env.eicc_content);
  const byCode = new Map(countries.map((c) => [String(c.code).toUpperCase(), c.name_en]));

  // ?c=DE&c=FR and ?c=DE,FR both work. The form emits the first; a person
  // sharing a link by hand writes the second, and refusing them would be
  // a rule with no reason behind it.
  const wanted = [];
  const seen = new Set();
  for (const raw of url.searchParams.getAll("c")) {
    for (const part of String(raw).split(",")) {
      const code = part.trim().toUpperCase();
      if (!code || seen.has(code)) continue;
      seen.add(code);
      const name = byCode.get(code);
      if (name) wanted.push(name);
    }
  }
  // ORDERED AS THE SITE ORDERS THEM, not as the reader typed them. The
  // cover page is a summary table of the same set, and a document whose
  // table and whose pages disagree about order is one a reader has to
  // cross-reference by eye.
  const order = countries.map((c) => c.name_en).filter((n) => wanted.includes(n));
  const chosen = order.slice(0, GUIDE_MAX_COUNTRIES);

  const strings = await authStrings(env, lang, "guides");
  const t = subtreeT(strings);

  if (!chosen.length) {
    // The picker's script prevents this; a typed URL does not. Say what
    // happened and offer the way back, rather than printing an empty
    // document that reads as a fault.
    const html = `<!DOCTYPE html><html lang="${escHtml(lang)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(t("pick.title", "Compliance guides"))} — The E-Invoicing Compliance Corner</title>
<meta name="robots" content="noindex,nofollow"><style>${ROI_STYLE}${PICKER_STYLE}</style></head>
<body><div class="wrap"><p class="eyebrow">${escHtml(t("pick.eyebrow", "Subscriber tool"))}</p>
<h1>${escHtml(t("doc.emptyTitle", "Nothing selected"))}</h1>
<p class="gp-note">${escHtml(t("doc.emptyBody", "No countries were named in that link, so there is nothing to build. Choose the markets you want and we will make the guide."))}</p>
<p><a class="gp-back" href="/compliance-guides">${escHtml(t("doc.emptyBack", "← Choose countries"))}</a></p>
</div></body></html>`;
    return new Response(html, { status: 400, headers: {
      "content-type": "text/html; charset=utf-8", "cache-control": "no-store", vary: "Cookie" }});
  }

  const today = new Date().toISOString().slice(0, 10);
  const bundle = await getGuideBundle(env.eicc_content, chosen, lang);
  const { html: doc } = renderGuideDocument({
    bundle, order: chosen, lang, strings, today,
    siteOrigin: "https://e-invoicingcompliancecorner.com",
    membersOrigin: MEMBERS_ORIGIN,
  });

  // THE TOOLBAR IS SCREEN-ONLY AND SAYS SO IN CSS, not in JavaScript.
  // Dan's requirement is a printable document; a print button that
  // printed itself onto page one would be a small joke at the reader's
  // expense on every one of seventy pages.
  const toolbar = `<div class="gp-tools">
  <a href="/compliance-guides">${escHtml(t("doc.change", "← Change countries"))}</a>
  <span class="sp"></span>
  <button type="button" id="gpPrint">${escHtml(t("doc.print", "Print / save as PDF"))}</button>
</div>`;

  const html = `<!DOCTYPE html><html lang="${escHtml(lang)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(t("doc.title", "Compliance guide"))} — The E-Invoicing Compliance Corner</title>
<meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${GUIDE_STYLE}
.gp-tools{position:sticky;top:0;z-index:9;display:flex;align-items:center;gap:14px;
  background:#111a29;color:#e9edf4;padding:10px 16px;font-family:'IBM Plex Sans',sans-serif;font-size:13px}
.gp-tools .sp{flex:1 1 auto}
.gp-tools a{color:#c8d2e4;text-decoration:none}
.gp-tools a:hover{color:#fff;text-decoration:underline}
.gp-tools button{background:#c98a3a;color:#1a1206;border:0;border-radius:6px;padding:8px 16px;
  font-weight:700;cursor:pointer;font-size:13px}
@media print{.gp-tools{display:none}}
</style></head><body>${toolbar}${doc}
<script>${GUIDE_FIT_SCRIPT}</script>
<script>(function(){var b=document.getElementById('gpPrint');if(b)b.addEventListener('click',function(){window.print();});})();</script>
</body></html>`;

  return new Response(html, { headers: {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    vary: "Cookie",
    "x-eicc-session": await sessionDiagnostic(request, env.SESSION_SECRET),
  }});
}

// ---- the planner, framed inside the tracker -----------------------------
//
// Dan, 19 August 2026: wire the planner into the site "under the Resources
// menu option and have it open 'in-frame' like other pages".
//
// `?frame=1` is a plain query parameter rather than a Referer check, so a
// bookmarked framed URL behaves exactly like one reached from the menu.
// A page that renders differently depending on how you arrived is a page
// nobody can reproduce a bug in.
//
// Two things change and nothing else does. The page loses its own outer
// padding, because the tracker's panel supplies it and doubling them puts
// a wasted inch down each side of a phone. And it reports its height,
// because nothing on the other side can measure a cross-document frame --
// the planner grows by thousands of pixels when results render and again
// when a wave table opens, so a fixed height would either clip it or
// leave a screen of empty navy underneath.
const FRAMED_ROI_STYLE = `
body[data-framed]{padding:0}
body[data-framed] .wrap{padding-left:5vw;padding-right:5vw;max-width:none}
`;

// ResizeObserver on the body rather than a load-time measurement: almost
// every height change here happens long after load, when a reader presses
// Calculate. rAF-coalesced because the observer fires per frame during a
// chart redraw and posting a message per frame is how a smooth page
// becomes a janky one.
const ROI_FRAME_REPORTER = `
(function(){
  if(window.parent === window) return;
  var last = 0, queued = false;
  function send(){
    queued = false;
    var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    if(Math.abs(h - last) < 8) return;
    last = h;
    try { window.parent.postMessage({ type: 'eicc:roi-height', height: h }, window.location.origin); }
    catch(e){ /* a parent on another origin simply does not get resized */ }
  }
  function queue(){ if(queued) return; queued = true; requestAnimationFrame(send); }
  if(window.ResizeObserver) new ResizeObserver(queue).observe(document.body);
  window.addEventListener('load', queue);
  document.addEventListener('click', function(){ setTimeout(queue, 60); }, true);
  queue();

  // ---- IN-PAGE ANCHORS HAVE TO BE HANDED TO THE PARENT ----------------
  //
  // This frame is sized to its own full content height, so it never
  // scrolls: its viewport IS the document. A fragment jump therefore has
  // nowhere to go, and the browser falls back to scroll chaining -- the
  // PARENT scrolls, by the least it can get away with, which puts the
  // target at the BOTTOM edge of the reader's screen.
  //
  // Found by clicking the legend's new link in a framed render. It
  // "worked": the assumptions panel opened and the page moved. It also
  // left the heading half-clipped on the last row of pixels with every
  // field the sentence asks the reader to review below the fold -- on
  // the one link whose entire job is to send them to those fields.
  //
  // Every step chip has the same problem for the same reason. So this is
  // a general handler for any in-page anchor, not a special case for one
  // link, and it lives HERE rather than in roi-render.mjs because it is
  // true only of the framed copy. The standalone page scrolls itself
  // perfectly well and must keep doing so.
  //
  // ORDER MATTERS, and getting it wrong is silent. The click that follows
  // an anchor here usually also OPENS something -- the assumptions panel
  // is a <details> and the legend's link expands it -- so the frame grows
  // by hundreds of pixels in the same tick. Send the scroll first and the
  // parent scrolls a document that is still short, gets clamped by its
  // own height, and stops a few hundred pixels above the target. Measured
  // exactly that: asked for 1416, landed at 1137, because the frame had
  // not been resized yet.
  //
  // So: force a height send, let the observer and the parent's resize
  // land, and only then measure and ask for the scroll. The delay is the
  // same 60ms the height path above already uses for click-driven growth,
  // plus a frame -- long enough to be after the reflow, short enough to
  // feel like part of the click.
  function relayScrollTo(el){
    if(!el) return;
    setTimeout(function(){
      queue();
      requestAnimationFrame(function(){
        var top = 0, n = el;
        while(n){ top += n.offsetTop; n = n.offsetParent; }
        try { window.parent.postMessage({ type: 'eicc:roi-scroll', top: top }, window.location.origin); }
        catch(err){ /* cross-origin parent: leave the default behaviour alone */ }
      });
    }, 80);
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if(!a) return;
    var id = a.getAttribute('href').slice(1);
    if(!id) return;
    var el = document.getElementById(id);
    if(!el) return;
    e.preventDefault();
    relayScrollTo(el);
  });

  // ---- AND THE PAGE'S OWN SCRIPT NEEDS THE SAME ROUTE ------------------
  //
  // Dan, 21 August 2026: "ensure that upon clicking 'calculate business
  // case' focus is given to the results in the executive summary, and not
  // the top of the page."
  //
  // Calculate is a BUTTON, so the anchor handler above never saw it, and
  // showResults() reached for scrollIntoView() instead. That is the same
  // dead end the handler above exists for: this frame cannot scroll, so
  // the request chains to the parent and the parent does the least it can
  // -- which is not where the reader was sent.
  //
  // Exposed rather than reimplemented in roi-render.mjs, because the
  // hard part is not the postMessage. It is the ordering: Calculate grows
  // the frame by thousands of pixels in the same tick, so a scroll sent
  // before the parent has resized gets clamped by a height that no longer
  // applies. That reasoning is written out above the timeout and should
  // exist once.
  //
  // roi-render.mjs checks for this and falls back to scrollIntoView, which
  // is correct for the standalone page and is why this is not simply
  // called from there unconditionally.
  window.EICC_FRAME_SCROLL = relayScrollTo;
})();
`;

async function renderRoiCalculatorPage(request, env) {
  if (!env.eicc_content) return new Response("Missing D1 binding", { status: 500 });
  const url = new URL(request.url);
  const framed = url.searchParams.get("frame") === "1";
  let lang = url.searchParams.get("lang");
  const { value: cookieLang } = getCookie(request, LANG_COOKIE);
  if (!(lang && SUPPORTED_LANGS.includes(lang))) {
    lang = (cookieLang && SUPPORTED_LANGS.includes(cookieLang))
      ? cookieLang
      : (pickBestSupportedLanguage(request.headers.get("Accept-Language")) || "en");
  }

  // COMPLETE OR ENGLISH, and this route was missed when the rule was
  // written. Migration 589 built resolveRoiLang() and wired it into the
  // members-worker; the public page kept passing the raw language to all
  // four getters, which is the exact defect 589 exists to prevent -- a
  // country picker reading BELGIEN and DEUTSCHLAND with every sentence
  // around it in English. It went unnoticed because the members page is
  // the one anybody signed in was looking at.
  //
  // It matters more now than it did this morning: the tracker's menu item
  // passes the reader's chosen language straight into the frame, so this
  // is the route three of the four site languages will arrive by.
  // A signed-in reader gets the planner unlocked in place -- no gate, no
  // hop to another origin. This is the whole point of the change: the
  // page could always have done this, it just had no way to know who was
  // asking.
  const signedInAs = await sessionEmail(request, env.SESSION_SECRET);

  // THE WALL RETURNS BEFORE THE TOOL IS BUILT. Not a hidden panel, not a
  // disabled control, not an overlay over a rendered page -- a signed-out
  // request never causes the planner to exist. See renderRoiGate above
  // for why this is a route-level decision and not a markup one.
  if (!signedInAs) return renderRoiGate(request, env, lang, framed);

  // ---- THEIR SAVED COUNTRIES, ASKED FOR RATHER THAN READ -------------
  //
  // This Worker has no subscribers binding and is not getting one. It
  // asks members-worker over a service binding instead, forwarding the
  // reader's own cookie, so the Worker that owns accounts stays the only
  // thing that reads one.
  //
  // WHY NOT JUST GIVE THIS WORKER THE BINDING. Because the boundary is
  // worth something even though it is not absolute: this Worker already
  // holds SESSION_SECRET, which can mint a token for any address, so an
  // ATTACKER with the secret could reach the same data anyway. What the
  // separation still buys is protection from ACCIDENTS -- a bug on any
  // public page can leak what this Worker directly holds, and cannot
  // spontaneously forge a session and go querying the other one.
  //
  // IT FAILS SOFT, DELIBERATELY. No binding, a deploy skew, an error, a
  // slow response: the reader gets the planner with the control disabled
  // and an honest label, rather than no planner. A convenience that takes
  // the page down with it when it breaks is not a convenience.
  let subscribed = [];
  if (signedInAs && env.MEMBERS) {
    try {
      const r = await env.MEMBERS.fetch(
        new Request("https://members.e-invoicingcompliancecorner.com/members/api/saved-countries", {
          headers: { Cookie: request.headers.get("Cookie") || "" },
        })
      );
      if (r.ok) {
        const body = await r.json();
        if (Array.isArray(body.countries)) subscribed = body.countries;
      } else {
        console.warn(`saved countries: members-worker answered ${r.status}`);
      }
    } catch (err) {
      console.warn(`saved countries: service binding failed — ${err && err.message}`);
    }
  }

  const roiLang = await resolveRoiLang(env.eicc_content, lang);

  const [countries, benchmarks, phases, strings, fx, panelStrings] = await Promise.all([
    getRoiCountries(env.eicc_content, null, roiLang.lang),
    getRoiBenchmarks(env.eicc_content, roiLang.lang),
    getRoiPhases(env.eicc_content, roiLang.lang),
    getRoiStrings(env.eicc_content, roiLang.lang),
    getRoiFxRates(env.eicc_content),
    // THE SITE'S LANGUAGE, NOT THE PLANNER'S — corrected 21 August 2026.
    //
    // This was roiLang.lang, on the reasoning that a Spanish panel on an
    // English page is the half-translated render migration 589 exists to
    // prevent. That reasoning was wrong, and wrong in a way worth
    // recording rather than quietly reversing.
    //
    // 589's rule is about a DOCUMENT: the planner's own prose, its
    // headings, its country names. The panel is not part of that
    // document. It is site chrome that opens on top of it — the same
    // component, from the same file, that opens on the tracker and on
    // every education page, all of which are fully translated.
    //
    // Following the planner meant the SAME PANEL appeared in German from
    // one button and in English from another, on one site, for one
    // reader. That inconsistency is worse than the mixed-language screen
    // it was avoiding, because nothing explains it: the planner at least
    // prints a line saying why IT is in English, and that line has never
    // covered the panel.
    //
    // And the roi namespace has no non-English rows at all, so
    // roiLang.lang was ALWAYS "en". This was not a rare edge — it was
    // every non-English reader who ever opened the panel from the
    // planner.
    authStrings(env, lang),
  ]);

  const { body, script } = renderRoiPage({
    countries,
    benchmarks,
    phases,
    strings,
    fx,
    lang: roiLang.lang,
    langAsked: roiLang.asked,
    // NOT `locked`, and not inverted by accident: renderRoiPage throws if
    // it sees the old name, because the meaning flipped when the gate
    // stopped withholding the results. It says "do we know who this is",
    // and it drives the saved-countries control and the prompt.
    signedIn: !!signedInAs,
    subscribed,
    // Where the gate's CTA sends people. The ORIGIN only -- the rest of
    // the URL is assembled in the browser at click time, because it has
    // to describe what the reader has typed, and at render time they have
    // typed nothing. This is why the old unlockUrl (a complete URL built
    // here, which nothing ever read) could not have served this even if
    // it had been wired up. See migration 591.
    membersUrl: MEMBERS_ORIGIN,
  });

  // roiLang.lang, not lang: the document must declare the language it is
  // actually written in. Declaring de on an English page is what tells a
  // screen reader to read English prose with German phonemes.
  const html = `<!DOCTYPE html><html lang="${roiLang.lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>E-Invoicing ROI &amp; Wave Planner — The E-Invoicing Compliance Corner</title>
<meta name="description" content="Build an e-invoicing business case from your own invoice volumes and country footprint. Delivery waves back-planned from real published mandate deadlines, with an evidence grade against every benchmark used.">
<link rel="canonical" href="https://e-invoicingcompliancecorner.com/roi-calculator">
<meta name="robots" content="${env.ROI_INDEXABLE === "true" ? "index,follow" : "noindex,nofollow"}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${ROI_STYLE}${framed ? FRAMED_ROI_STYLE : ""}</style></head><body${framed ? ' data-framed="1"' : ""}>${body}<!--
  The signup panel, loaded BEFORE the page's own script.

  Same file the tracker loads, from the same origin -- this page is
  served at /roi-calculator on the public host, so /auth-overlay.js is
  simply an asset here. That is what makes one implementation possible
  across a Worker-rendered document and a static one, with no build step
  and no second copy of a signup form to drift.

  ORDER MATTERS: the planner's script wires the two prompt controls at
  parse time and asks for window.EICC_AUTH inside the click handler, so
  a later load would still work -- but a reader who clicks in the gap
  would get the fallback navigation instead of the panel, which is a
  silent downgrade rather than a failure. Loading it first closes the
  gap. --><script>window.EICC_AUTH_STRINGS=${JSON.stringify(panelStrings).replace(/<\//g, "<\\/")};</script><script src="/auth-overlay.js?v=3"></script><script>${script}</script>${framed ? `<script>${ROI_FRAME_REPORTER}</script>` : ""}</body></html>`;

  // SIXTY SECONDS, NOT FIVE MINUTES, while this is Beta.
  //
  // The five-minute cache has now been implicated in two confusing bug
  // reports. On 3 August Dan reported Middle East countries missing from
  // the tracker sidebar after a deploy; it was a stale page and resolved
  // on refresh. On 19 August he reported a change to this page as not
  // having taken effect at all.
  //
  // A cache that makes a fresh deploy look like a failed one costs more
  // than it saves on a page nobody has bookmarked yet: it is unindexed,
  // marked Beta, and its whole reason for being in the menu is to collect
  // feedback from people looking at whatever shipped this morning. Sixty
  // seconds still absorbs a reader clicking between the tracker and the
  // planner; it does not survive a deploy-and-check.
  //
  // Worth raising again when this leaves Beta and stops changing daily.
  // ---- THE CACHING RULE, AND IT IS THE DANGEROUS ONE -----------------
  //
  // The moment a response depends on who is asking, a shared cache
  // holding it is a bug that serves one reader's page to another. Not
  // theoretical: Cloudflare, a corporate proxy and a shared browser
  // profile would all happily do it, and the symptom -- seeing someone
  // else's session -- is the worst-looking failure this site could have.
  //
  // So a personalised render is private and uncacheable, and Vary tells
  // any cache that the cookie is part of the key even so. The anonymous
  // render keeps its sixty seconds, because it is the same for everyone.
  // A cookie that will not verify is never normal in bulk: it means the
  // secret does not match the one that signed it, which looks exactly
  // like "not signed in" from a browser. Logged so `wrangler tail` says
  // so out loud. No token, no address -- the fact alone.
  //
  // AND THE COOKIES ARE CLEARED, which is the half that matters to the
  // reader rather than to the operator.
  //
  // The display cookie is validated by nothing -- that is exactly what
  // lets a static page read it. So when a session stops verifying, the
  // greeting carries on regardless: the site says "Signed in as ..." at
  // the top while everything gated refuses. Dan sat in precisely that
  // state after rotating the secret, and it is the same half-right shape
  // that made the mismatch so hard to see in the first place.
  //
  // A token that will not verify is never going to. Nothing is lost by
  // clearing both cookies, and what is gained is a page that tells the
  // truth: the greeting goes, the Sign in button returns, and the next
  // click leads somewhere that works.
  let staleSession = false;
  if (!signedInAs && env.SESSION_SECRET) {
    const { value: presented } = readCookie(request, SESSION_COOKIE);
    if (presented) {
      staleSession = true;
      console.warn("ROI: a session cookie was presented and could not be verified — "
        + "clearing it. In bulk, this means SESSION_SECRET does not match "
        + "members-worker's.");
    }
  }

  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": signedInAs ? "private, no-store" : "public, max-age=60",
    vary: "Cookie",
    // A DIAGNOSTIC, because "it still shows the gate" has three different
    // causes that look identical from a browser: the secret is unset on
    // this Worker, the reader's cookie predates the parent-domain change,
    // or a cache served them somebody else's anonymous copy.
    //
    // Boolean only, never the address. It reveals nothing a reader cannot
    // already infer from whether the gate appeared -- and it turns a
    // round-trip of guesses into:
    //     curl -sI https://e-invoicingcompliancecorner.com/roi-calculator
    //
    // "no-secret" is its own answer rather than being folded into "none",
    // because a missing secret is a deployment step nobody did, and a
    // missing cookie is a reader who is not signed in. Those need
    // different fixes and should not share a symptom.
    "x-eicc-session": await sessionDiagnostic(request, env.SESSION_SECRET),
  };
  const res = new Response(html, { headers });
  if (staleSession) {
    for (const c of signOutCookies()) res.headers.append("Set-Cookie", c);
  }
  return res;
}

async function renderMapPage(request, env) {
  if (!env.eicc_content) return new Response("Missing D1 binding", { status: 500 });
  const url = new URL(request.url);
  let lang = url.searchParams.get("lang");
  let shouldSetCookie = false;
  const { value: cookieLang, duplicated: cookieDuplicated } = getCookie(request, LANG_COOKIE);
  if (lang && SUPPORTED_LANGS.includes(lang)) {
    shouldSetCookie = true;
  } else if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) {
    lang = cookieLang;
  } else {
    lang = pickBestSupportedLanguage(request.headers.get("Accept-Language")) || "en";
  }
  const ui = MAP_UI[lang] || MAP_UI.en;
  // Both fetched regardless of whether this request is a direct visit to
  // the standalone page or the tracker's in-page panel fetching this same
  // URL in the background -- the server can't tell which, so it always
  // supplies both datasets; map-panel.js's isEmbedded() decides client-
  // side which one the sidebar actually renders (see its header comment).
  const [countries, recentStories] = await Promise.all([
    getMapCountries(env.eicc_content, lang),
    getRecentStories(env.eicc_content, lang),
  ]);

  // </script> inside the JSON would terminate the blob early.
  const safe = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");

  const html = `<!DOCTYPE html>
<html lang="${escHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(ui.eyebrow)} — The E-Invoicing Compliance Corner</title>
<meta name="description" content="${escHtml(ui.subtitle)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* Same dark shell as the country deep-dive pages and /sources
     (shared/deep-dive-render.mjs's structural contract): :root{ and
     body{ rules -- the tracker's in-page injector rewrites both to
     :host{ when this page is fetched into the shadow-scoped panel. */
  :root{
    --ink:#0f1a2b; --ink-2:#152238; --ink-3:#1c2c48; --line:#2b3c5a;
    --paper:#efe9db; --paper-2:#e4dcc6; --paper-line:#c9bd9e;
    --text-lo:#f2f0e8; --muted:#93a3c0;
    --stamp:#b5432f; --stamp-dim:#7c3628; --radius:10px;
  }
  *{box-sizing:border-box;} html,body{margin:0;padding:0;}
  body{background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.5;}
  a{color:inherit;}
  .wrap{max-width:1400px; margin:0 auto; padding:0 5vw 0;}
  .top-bar{display:none;} /* no separate top-bar here -- .map-topbar IS the header, kept visible in both standalone and in-page-panel modes (unlike /sources, whose whole top-bar is the panel's own close control) */
  ${MAP_STYLE}
</style>
</head>
<body>
<div class="wrap">${mapPageBodyHtml()}</div>
<script type="application/json" id="mapDataBlob">${safe({ countries, recentStories, lang, ui: MAP_UI, regionOrder: REGION_ORDER, regionBounds: REGION_BOUNDS })}</script>
<script src="/vendor/d3.min.js"></script>
<script src="/vendor/topojson-client.min.js"></script>
<script src="/map-panel.js"></script>
<script>
(function(){
  // Everything this bootstrap needs (country data, UI copy, region
  // geometry) comes from the single #mapDataBlob JSON island above --
  // deliberately, so the tracker's in-page map panel (see
  // einvoicing-compliance-tracker.html's openMapPage()) can extract the
  // exact same blob from this page's fetched HTML and call
  // EICCMap.init(shadow, ...) itself. This inline script never runs in
  // that path (script tags injected via innerHTML don't execute), but
  // the JSON island does survive -- keeping all init data in that one
  // inert blob, rather than split between it and plain JS literals
  // here, is what makes that possible.
  var blob = JSON.parse(document.getElementById('mapDataBlob').textContent);
  window.EICCMap.init(document, {
    countries: blob.countries,
    recentStories: blob.recentStories,
    lang: blob.lang,
    ui: blob.ui,
    regionOrder: blob.regionOrder,
    regionBounds: blob.regionBounds,
    topologyUrl: '/vendor/countries-50m.json',
    fetchCountries: function(lang){
      return fetch('/map-data.json?lang=' + lang).then(function(r){ return r.json(); });
    }
  });
})();
</script>
</body>
</html>`;

  const headers = new Headers({
    "Content-Type": "text/html; charset=UTF-8",
    "Cache-Control": "public, max-age=300",
  });
  if (shouldSetCookie) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Domain=.e-invoicingcompliancecorner.com; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  }
  if (cookieDuplicated) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  }
  return new Response(html, { headers });
}

async function renderMapDataJson(request, env) {
  if (!env.eicc_content) return new Response("Missing D1 binding", { status: 500 });
  const url = new URL(request.url);
  const lang = SUPPORTED_LANGS.includes(url.searchParams.get("lang")) ? url.searchParams.get("lang") : "en";
  const countries = await getMapCountries(env.eicc_content, lang);
  return new Response(JSON.stringify(countries), {
    headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "public, max-age=300" },
  });
}

async function renderCountryDeepDive(request, env, slug) {
  if (!env.eicc_content) {
    return new Response(
      "This page requires a D1 database binding named 'eicc_content' on this Worker (Cloudflare dashboard → eicc-public → Bindings) — see wrangler.toml.",
      { status: 500 }
    );
  }
  const db = env.eicc_content;
  const url = new URL(request.url);
  const countryName = SLUG_TO_COUNTRY[slug];

  let lang = url.searchParams.get("lang");
  let shouldSetCookie = false;
  const { value: cookieLang, duplicated: cookieDuplicated } = getCookie(request, LANG_COOKIE);
  if (lang && SUPPORTED_LANGS.includes(lang)) {
    shouldSetCookie = true;
  } else {
    if (cookieLang && SUPPORTED_LANGS.includes(cookieLang)) {
      lang = cookieLang;
    } else {
      lang = pickBestSupportedLanguage(request.headers.get("Accept-Language")) || "en";
    }
  }

  const countryRow = await db.prepare(`SELECT code, region FROM countries WHERE name_en = ?`).bind(countryName).first();
  if (!countryRow) return new Response("Not found", { status: 404 });

  const content = await getDeepDiveContent(db, countryName, lang);
  if (!content) return new Response("Not found", { status: 404 });

  const milestones = await getMilestonesForCountry(db, countryName, lang);
  const flag = deriveFlagFromCode(countryRow.code);

  const html = await renderFullDeepDivePage(
    countryName, flag, countryRow.code, countryRow.region, content, milestones, lang,
    "/einvoicing-compliance-tracker.html"
  );

  const headers = new Headers({
    "Content-Type": "text/html; charset=UTF-8",
    // Short edge cache — keeps D1 read volume sane under real traffic
    // without risking stale content for more than a few minutes after
    // a content update.
    "Cache-Control": "public, max-age=300",
  });
  if (shouldSetCookie) {
    // Domain=.e-invoicingcompliancecorner.com (not host-only) is what
    // makes the shared language banner actually shared — this same
    // cookie is then visible to members.e-invoicingcompliancecorner.com
    // too, and vice versa (see members-worker/src/index.js's
    // withLangCookie and i18n.js's writeCookie).
    headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Domain=.e-invoicingcompliancecorner.com; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  }
  if (cookieDuplicated) {
    // Self-heal: the visitor is carrying both a stale host-only
    // "eicc_lang" cookie (from before Domain scoping existed) and the
    // current domain-scoped one. getCookie() already reads the correct
    // (newer) value regardless, but clear the stale host-only one here
    // too so the browser stops sending two of them on every request.
    headers.append("Set-Cookie", `${LANG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  }
  return new Response(html, { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // The tracker page itself renders dynamically from D1 (Stage 5) —
    // static shell with the DATA/DEEP_DIVES blobs injected at request
    // time, falling back to the untouched static asset on any D1
    // failure. See renderTracker above.
    if (TRACKER_PATHS.has(url.pathname)) {
      return renderTracker(request, env);
    }

    // The board's per-language milestone translations, fetched by
    // i18n.js on language switch — served from milestone_translations,
    // same fallback contract.
    const dataJsonMatch = url.pathname.match(DATA_JSON_RE);
    if (dataJsonMatch) {
      return renderTrackerDataJson(request, env, dataJsonMatch[1]);
    }

    // ---- THE AUTH RELAY ------------------------------------------------
    //
    // Signing up and signing in now happen in a panel on whatever page
    // the reader is already on, which means the request has to be
    // SAME-ORIGIN to the browser. It cannot be: accounts live on
    // members-worker, on the other host.
    //
    // The two ways to bridge that are CORS-with-credentials, which this
    // codebase has twice refused to do and would certainly not start
    // doing for the one endpoint that hands out sessions, or a relay.
    // This is the relay, and it is the same service binding the planner
    // already uses to ask for a reader's saved countries, pointed the
    // other way.
    //
    // The browser talks to its own origin. members-worker still owns
    // every decision and stays the only thing that can mint a session or
    // touch an account. This Worker forwards a body and copies back
    // headers; it inspects, decides and shortcuts nothing.
    if (request.method === "POST" && AUTH_RELAY.has(url.pathname)) {
      return relayToMembers(request, env, AUTH_RELAY.get(url.pathname));
    }
    if (request.method === "GET"
        && (url.pathname === ARCHIVE_RELAY_PREFIX
            || url.pathname.startsWith(ARCHIVE_RELAY_PREFIX + "/"))) {
      return relayArchive(request, env, url);
    }

    // The tracking-sources page — D1-rendered, no asset file behind it.
    if (url.pathname === "/sources" || url.pathname === "/sources.html") {
      return renderSourcesPage(request, env);
    }

    // Insights hub + individual articles/whitepapers — D1-rendered,
    // public and SEO-indexable (see shared/resources-render.mjs).
    if (url.pathname === "/insights" || url.pathname === "/insights.html") {
      return renderInsightsHub(request, env);
    }
    if (url.pathname.startsWith("/insights/")) {
      const slug = decodeURIComponent(url.pathname.slice("/insights/".length)).replace(/\.html$/, "");
      if (slug) return renderInsightsArticle(request, env, slug);
    }

    // ROI & Wave Planner — public teaser, currently SWITCHED OFF.
    //
    // Dan asked (11 Aug 2026) to keep this off the public site while he
    // road-tests the output and iterates. The tool itself stays fully
    // usable at members.e-invoicingcompliancecorner.com/members/roi-calculator,
    // which requires a real session, so he can work with it without any
    // of it being reachable or indexable from the public site.
    //
    // Same env-var toggle pattern as members-worker's ARCHIVE_PUBLIC:
    // flip ROI_PUBLIC to "true" in site-worker/wrangler.toml (or in the
    // Cloudflare dashboard for an immediate effect, remembering that the
    // next `wrangler deploy` resyncs from the file) to expose it.
    //
    // Deliberately a 404 rather than a redirect or a "coming soon" page:
    // a soft response still gets crawled, indexed and shared, which is
    // exactly what "hidden" is meant to prevent.
    if (ROI_PATHS.has(url.pathname)) {
      if (env.ROI_PUBLIC !== "true") return new Response("Not found", { status: 404 });
      return renderRoiCalculatorPage(request, env);
    }

    // Compliance guides — the chooser, then the printable document. Both
    // gated on the session rather than on an env flag; see the note above
    // GUIDES_PATHS for why this one differs from ROI_PUBLIC.
    if (METHOD_PATHS.has(url.pathname)) {
      return renderMethodologyPage(request, env);
    }

    if (GUIDES_PATHS.has(url.pathname)) {
      return renderComplianceGuidesPicker(request, env);
    }
    if (GUIDE_DOC_PATHS.has(url.pathname)) {
      return renderComplianceGuideDocument(request, env);
    }

    // The Map — D1-rendered choropleth, no asset file behind it either.
    if (MAP_PATHS.has(url.pathname)) {
      return renderMapPage(request, env);
    }
    if (MAP_DATA_JSON_RE.test(url.pathname)) {
      return renderMapDataJson(request, env);
    }

    // Only a single path segment can ever be a country slug
    // (/spain, /spain.html) — anything else falls straight through to
    // static assets below.
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 1) {
      let slug = segments[0].toLowerCase();
      if (slug.endsWith(".html")) slug = slug.slice(0, -5);
      if (SLUG_TO_COUNTRY[slug]) {
        return renderCountryDeepDive(request, env, slug);
      }
    }

    // Static assets binding handles everything else (index.html, the
    // tracker, education pages, i18n/, css/js/images, and the final
    // not-found fallback for anything that matches nothing at all).
    return env.ASSETS.fetch(request);
  },
};
