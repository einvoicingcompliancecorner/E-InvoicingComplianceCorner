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
const DATA_JSON_RE = /^\/i18n\/(es|de|fr)-data\.json$/;

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
  // into and the complete fallback if anything below throws.
  const assetResp = await env.ASSETS.fetch(new Request(new URL(TRACKER_PATH, request.url), request));
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
    if (url.pathname === TRACKER_PATH) {
      return renderTracker(request, env);
    }

    // The board's per-language milestone translations, fetched by
    // i18n.js on language switch — served from milestone_translations,
    // same fallback contract.
    const dataJsonMatch = url.pathname.match(DATA_JSON_RE);
    if (dataJsonMatch) {
      return renderTrackerDataJson(request, env, dataJsonMatch[1]);
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
