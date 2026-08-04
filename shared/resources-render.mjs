// ================================================================
// "Insights" — shared data access + fragment rendering for owned
// blog posts, whitepapers, and (ungated) sponsored content.
//
// Split of responsibility, deliberately:
//   - THIS module: D1 queries against `articles` (migration 338),
//     and the article/list HTML *fragments* that look identical
//     wherever they're shown.
//   - site-worker/src/index.js: wraps renderArticleFragment() in the
//     public, SEO-indexable page shell (root domain, no login) — the
//     dark-ink theme shared with /sources and the country deep-dives.
//   - members-worker/src/index.js: wraps the SAME fragment (called
//     with locked=false, since a session was already verified) in
//     its own pageShell()/BASE_STYLE — the gated "keep reading" view.
//
// Neither Worker needs to duplicate the article markup itself; only
// the outer <html> shell differs, which is the same split every other
// shared page (deep dives, sources) already uses.
// ================================================================

import { escapeHtml, d1All, d1First } from "./deep-dive-render.mjs";

export async function getPublishedArticles(db) {
  return d1All(db, `
    SELECT slug, type, title, dek, gated, is_sponsored, sponsor_name,
           author, published_at
    FROM articles
    WHERE published = 1
    ORDER BY published_at DESC
  `);
}

export async function getArticleBySlug(db, slug) {
  return d1First(db, `SELECT * FROM articles WHERE slug = ? AND published = 1`, slug);
}

const INSIGHTS_I18N = {
  en: { badgeSponsored: "Sponsored", badgeSubscriber: "Subscriber Content Only",
        whitepaper: "Whitepaper", blog: "Article",
        lockedTitle: "Subscriber Content Only",
        lockedBody: "The rest of this piece is for subscribers — free to join, no card required.",
        unlockCta: "Subscribe free to keep reading", by: "By" },
  es: { badgeSponsored: "Contenido patrocinado", badgeSubscriber: "Solo para suscriptores",
        whitepaper: "Informe técnico", blog: "Artículo",
        lockedTitle: "Solo para suscriptores",
        lockedBody: "El resto de este contenido es para suscriptores — gratis, sin tarjeta.",
        unlockCta: "Suscríbase gratis para seguir leyendo", by: "Por" },
  de: { badgeSponsored: "Gesponserter Inhalt", badgeSubscriber: "Nur für Abonnenten",
        whitepaper: "Whitepaper", blog: "Artikel",
        lockedTitle: "Nur für Abonnenten",
        lockedBody: "Der Rest dieses Beitrags ist Abonnenten vorbehalten — kostenlos, keine Kreditkarte nötig.",
        unlockCta: "Kostenlos abonnieren und weiterlesen", by: "Von" },
  fr: { badgeSponsored: "Contenu sponsorisé", badgeSubscriber: "Réservé aux abonnés",
        whitepaper: "Livre blanc", blog: "Article",
        lockedTitle: "Réservé aux abonnés",
        lockedBody: "La suite de cet article est réservée aux abonnés — gratuit, sans carte bancaire.",
        unlockCta: "S'abonner gratuitement pour continuer", by: "Par" },
};
function ui(lang) { return INSIGHTS_I18N[lang] || INSIGHTS_I18N.en; }

function formatDate(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00Z").toLocaleDateString(
      lang === "en" ? "en-GB" : lang, { year: "numeric", month: "long", day: "numeric" }
    );
  } catch { return iso; }
}

// The hub listing — used only by site-worker (public /insights index).
// Locked pieces still show title + dek + a small badge; nothing about
// the listing itself requires a session.
export function renderInsightsListFragment(articles, lang, { articleHref }) {
  const u = ui(lang);
  const items = articles.map((a) => {
    const badge = a.is_sponsored
      ? `<span class="insight-badge sponsored">${escapeHtml(u.badgeSponsored)}</span>`
      : a.gated ? `<span class="insight-badge gated">${escapeHtml(u.badgeSubscriber)}</span>` : "";
    const typeLabel = a.type === "whitepaper" ? u.whitepaper : u.blog;
    return `<a class="insight-card" href="${escapeHtml(articleHref(a.slug))}">
      <div class="insight-card-meta"><span class="insight-type">${escapeHtml(typeLabel)}</span>${badge}</div>
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.dek)}</p>
      <div class="insight-card-byline">${escapeHtml(u.by)} ${escapeHtml(a.author)} · ${escapeHtml(formatDate(a.published_at, lang))}</div>
    </a>`;
  }).join("");
  return `<div class="insight-grid">${items}</div>`;
}

// A single article/whitepaper. `locked` controls whether the full
// body renders or a teaser + subscribe CTA does — callers decide
// `locked` themselves (site-worker: locked = article.gated &&
// !article.is_sponsored; members-worker: locked = false, since it
// only ever calls this after requireSession()+isCurrentlyActive()
// already passed).
export function renderArticleFragment(article, lang, { locked, unlockUrl }) {
  const u = ui(lang);
  const badge = article.is_sponsored
    ? `<span class="insight-badge sponsored">${escapeHtml(u.badgeSponsored)}</span>`
    : article.gated ? `<span class="insight-badge gated">${escapeHtml(u.badgeSubscriber)}</span>` : "";
  const byline = `${escapeHtml(u.by)} ${escapeHtml(article.author)} · ${escapeHtml(formatDate(article.published_at, lang))}`;
  const sponsorNote = article.is_sponsored && article.sponsor_name
    ? `<p class="insight-sponsor-note">${escapeHtml(u.badgeSponsored)} — ${
        article.sponsor_url
          ? `<a href="${escapeHtml(article.sponsor_url)}" target="_blank" rel="noopener sponsored">${escapeHtml(article.sponsor_name)}</a>`
          : escapeHtml(article.sponsor_name)
      }</p>`
    : "";

  let bodyBlock;
  if (article.type === "whitepaper" && article.pdf_url && !locked) {
    bodyBlock = `${article.teaser_html}<p><a class="insight-download" href="${escapeHtml(article.pdf_url)}" target="_blank" rel="noopener">${escapeHtml(u.whitepaper)} → PDF</a></p>`;
  } else if (locked) {
    bodyBlock = `<div class="insight-teaser">${article.teaser_html}</div>
      <div class="insight-locked-card">
        <p class="insight-locked-title">${escapeHtml(u.lockedTitle)}</p>
        <p>${escapeHtml(u.lockedBody)}</p>
        <a class="insight-unlock-cta" href="${escapeHtml(unlockUrl)}">${escapeHtml(u.unlockCta)}</a>
      </div>`;
  } else {
    bodyBlock = article.body_html || article.teaser_html;
  }

  return `<article class="insight-article">
    <div class="insight-card-meta">${badge}</div>
    <h1>${escapeHtml(article.title)}</h1>
    <p class="insight-dek">${escapeHtml(article.dek)}</p>
    <p class="insight-byline">${byline}</p>
    ${sponsorNote}
    ${bodyBlock}
  </article>`;
}

// Shared CSS for the fragments above — appended into each Worker's own
// <style> block (both already use the same --ink/--paper/--stamp
// custom-property palette, so this only adds the insight-specific
// classes, not a competing theme).
export const INSIGHTS_STYLE = `
  .insight-grid{display:grid; gap:18px; margin-top:24px;}
  .insight-card{display:block; border:1px solid var(--line); border-radius:var(--radius,10px); padding:18px 20px; text-decoration:none; color:inherit; background:rgba(255,255,255,0.02);}
  .insight-card:hover{border-color:var(--stamp);}
  .insight-card h3{margin:8px 0 6px; font-size:19px; color:var(--text-lo,var(--paper));}
  .insight-card p{margin:0 0 10px; color:var(--muted); font-size:14px;}
  .insight-card-meta{display:flex; gap:8px; align-items:center;}
  .insight-type{font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted);}
  .insight-badge{font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; padding:2px 8px; border-radius:20px;}
  .insight-badge.sponsored{background:rgba(181,67,47,0.18); color:var(--stamp);}
  .insight-badge.gated{background:rgba(147,163,192,0.18); color:var(--muted);}
  .insight-card-byline{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--muted);}
  .insight-article h1{font-size:34px; margin:10px 0 8px; color:var(--text-lo,var(--paper));}
  .insight-dek{font-size:16px; color:var(--muted); margin:0 0 10px;}
  .insight-byline{font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted); margin:0 0 24px;}
  .insight-sponsor-note{font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted); border-left:3px solid var(--stamp); padding-left:10px; margin:0 0 20px;}
  .insight-article p{line-height:1.7; margin:0 0 16px;}
  .insight-download{display:inline-block; padding:10px 18px; border-radius:8px; background:var(--stamp); color:#fff; text-decoration:none; font-weight:600;}
  .insight-teaser{margin-bottom:6px;}
  .insight-locked-card{border:1px dashed var(--line); border-radius:var(--radius,10px); padding:22px 24px; margin-top:6px; text-align:center;}
  .insight-locked-title{font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:var(--stamp); margin:0 0 8px;}
  .insight-unlock-cta{display:inline-block; margin-top:10px; padding:11px 22px; border-radius:8px; background:var(--stamp); color:#fff; text-decoration:none; font-weight:600;}
`;
