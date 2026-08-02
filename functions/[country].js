// ================================================================
// Cloudflare Pages Function — dynamic, D1-backed country deep-dive pages.
// ================================================================
// Replaces the old hand-written static HTML files (spain.html,
// croatia.html, etc.) with a single dynamic route. Cloudflare Pages
// only invokes this Function when no static asset matches the
// requested path first — since the old per-country .html files have
// been deleted, every /<slug> request for a known country now lands
// here instead.
//
// Requires a D1 database binding named `eicc_content` configured on
// this Pages project (Cloudflare dashboard → Pages project → Settings
// → Functions → D1 database bindings), pointed at the same `eicc-content`
// database (id d1d10bd0-e90a-44a3-9494-a63689e8d32e) the members-worker
// Cloudflare Worker already uses — this is the one manual setup step
// that can't be done from a repo commit alone.
//
// Language: an explicit ?lang= query param always wins (and refreshes
// the persistence cookie); otherwise a previously-set cookie is used;
// otherwise the browser's own Accept-Language header picks the best
// supported match; otherwise English. This is what makes "route every
// visitor, in any language, straight to the D1 version" actually work
// without needing a query param on first visit.
// ================================================================

import {
  SUPPORTED_LANGS,
  SLUG_TO_COUNTRY,
  deriveFlagFromCode,
  getDeepDiveContent,
  getMilestonesForCountry,
  renderFullDeepDivePage,
} from "../shared/deep-dive-render.mjs";

const LANG_COOKIE = "eicc_lang";
const LANG_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
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

function renderLangSwitcher(lang, slug) {
  const links = SUPPORTED_LANGS.map((code) => {
    const isActive = code === lang;
    return `<a href="/${slug}?lang=${code}" style="color:${isActive ? "#c98a3a" : "#93a3c0"}; font-weight:${isActive ? "700" : "400"}; text-decoration:none; margin-left:10px;">${code.toUpperCase()}</a>`;
  }).join("");
  return `<span style="font-family:'IBM Plex Mono',monospace; font-size:11.5px;">🌐${links}</span>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Accept both the clean-URL slug (/spain) and an old-style .html
  // request (/spain.html) landing here, since a bookmarked or indexed
  // .html URL with no matching static file also falls through to this
  // Function — normalize before the lookup either way.
  let slug = String(context.params.country || "").toLowerCase();
  if (slug.endsWith(".html")) slug = slug.slice(0, -5);

  const countryName = SLUG_TO_COUNTRY[slug];
  if (!countryName) {
    return new Response("Not found", { status: 404 });
  }

  if (!env.eicc_content) {
    return new Response(
      "This page requires a D1 database binding named 'eicc_content' on the Pages project (Settings → Functions → D1 database bindings) — see the comment at the top of functions/[country].js.",
      { status: 500 }
    );
  }
  const db = env.eicc_content;

  let lang = url.searchParams.get("lang");
  let shouldSetCookie = false;
  if (lang && SUPPORTED_LANGS.includes(lang)) {
    shouldSetCookie = true;
  } else {
    const cookieLang = getCookie(request, LANG_COOKIE);
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
  const langSwitcherHtml = renderLangSwitcher(lang, slug);

  const html = await renderFullDeepDivePage(
    countryName, flag, countryRow.code, countryRow.region, content, milestones, lang,
    "/einvoicing-compliance-tracker.html", langSwitcherHtml
  );

  const headers = new Headers({
    "Content-Type": "text/html; charset=UTF-8",
    // Short edge cache — keeps D1 read volume sane under real traffic
    // without risking stale content for more than a few minutes after
    // a content update.
    "Cache-Control": "public, max-age=300",
  });
  if (shouldSetCookie) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${LANG_COOKIE_TTL_SECONDS}; SameSite=Lax`);
  }
  return new Response(html, { headers });
}
