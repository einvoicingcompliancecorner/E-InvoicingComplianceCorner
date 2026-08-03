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
  // happens to first-appear regions in exactly Europe → Middle East →
  // Asia-Pacific → Americas, so the generated array orders by that same
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
      WHEN 'Europe' THEN 0 WHEN 'Middle East' THEN 1
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
        // Same short edge cache as the country deep-dive pages.
        "Cache-Control": "public, max-age=300",
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
const SOURCES_REGION_ORDER = ["Europe", "Middle East", "Asia-Pacific", "Americas"];

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
      WHEN 'Europe' THEN 0 WHEN 'Middle East' THEN 1
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

    // The tracking-sources page — D1-rendered, no asset file behind it.
    if (url.pathname === "/sources" || url.pathname === "/sources.html") {
      return renderSourcesPage(request, env);
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
