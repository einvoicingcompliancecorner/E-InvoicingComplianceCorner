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
