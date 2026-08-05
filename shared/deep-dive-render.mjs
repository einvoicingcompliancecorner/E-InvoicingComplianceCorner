// ================================================================
// SHARED DEEP-DIVE RENDERING MODULE
// ================================================================
// Single source of truth for building a country deep-dive page's HTML
// from D1 content. Imported by two independent runtimes:
//   1. members-worker/src/index.js — the admin preview routes
//      (/admin/preview/deep-dive?country=X&lang=Y), unchanged in
//      behaviour, now just importing instead of defining these inline.
//   2. functions/[country].js — the Cloudflare Pages Function that
//      serves the real, public country pages (e-invoicingcompliancecorner.com/spain)
//      directly from D1, replacing the old static HTML files.
//
// Both runtimes pass in a D1Database binding directly (not an `env`
// object), so this module has no assumptions about binding names,
// which differ between the two Cloudflare projects.
//
// A handful of small primitives (escapeHtml, d1All/d1First,
// translateCountryName + its dictionary) are deliberately duplicated
// here rather than imported from members-worker/src/index.js, matching
// this codebase's existing precedent (see the COUNTRY_DEEP_DIVE_SLUGS
// comment in index.js) of tolerating small, stable, cross-runtime
// copies rather than tightly coupling two independently-deployed
// Cloudflare projects together.
// ================================================================

export const SUPPORTED_LANGS = ["en", "es", "de", "fr"];

// Maps a country's canonical English name to its deep-dive page slug.
// members-worker's own copy of this map is gone (it reads the slug
// column D1's countries table gained in migration
// 198_country_slugs_and_picker.sql) — this map remains as site-worker's
// synchronous routing table (SLUG_TO_COUNTRY below decides whether an
// incoming path is a country page at all, before any D1 round-trip) and
// for the canonical-URL tag rendered further down. Keep it in sync with
// D1's countries.slug column and countries.js when adding a country.
// It's a hand-maintained table rather than a derived transform because
// uae, uk, and united-states aren't simple lowercase-and-hyphenate.
export const COUNTRY_DEEP_DIVE_SLUGS = {
  "Argentina": "argentina", "Australia": "australia", "Austria": "austria", "Belgium": "belgium", "Brazil": "brazil", "Canada": "canada",
  "Chile": "chile", "China": "china", "Colombia": "colombia", "Costa Rica": "costa-rica", "Croatia": "croatia", "Cyprus": "cyprus", "Czech Republic": "czech-republic", "Denmark": "denmark", "Ecuador": "ecuador", "Egypt": "egypt", "Finland": "finland",
  "France": "france", "Germany": "germany", "Greece": "greece", "Hungary": "hungary", "India": "india", "Indonesia": "indonesia", "Ireland": "ireland", "Israel": "israel",
  "Italy": "italy", "Japan": "japan", "Jordan": "jordan", "Luxembourg": "luxembourg", "Netherlands": "netherlands", "Malaysia": "malaysia", "Mexico": "mexico", "New Zealand": "new-zealand",
  "Norway": "norway", "Oman": "oman", "Pakistan": "pakistan", "Peru": "peru", "Philippines": "philippines", "Poland": "poland", "Portugal": "portugal", "Romania": "romania",
  "Saudi Arabia": "saudi-arabia", "Singapore": "singapore", "Slovakia": "slovakia", "South Korea": "south-korea",
  "Spain": "spain", "Sweden": "sweden", "Taiwan": "taiwan", "Turkey": "turkey", "United Arab Emirates": "uae",
  "United Kingdom": "uk", "United States": "united-states", "Uruguay": "uruguay", "Vietnam": "vietnam",
};

export const SLUG_TO_COUNTRY = Object.fromEntries(
  Object.entries(COUNTRY_DEEP_DIVE_SLUGS).map(([name, slug]) => [slug, name])
);

const COUNTRY_NAME_TRANSLATIONS = {
  es: {
    "Austria": "Austria", "Belgium": "Bélgica", "Croatia": "Croacia", "Cyprus": "Chipre", "Czech Republic": "República Checa", "Denmark": "Dinamarca",
    "Egypt": "Egipto", "Finland": "Finlandia", "France": "Francia",
    "Germany": "Alemania", "Greece": "Grecia", "Hungary": "Hungría", "Ireland": "Irlanda", "Israel": "Israel", "Italy": "Italia", "Jordan": "Jordania", "Luxembourg": "Luxemburgo",
    "Netherlands": "Países Bajos", "Norway": "Noruega", "Oman": "Omán",
    "Poland": "Polonia", "Portugal": "Portugal", "Romania": "Rumania", "Slovakia": "Eslovaquia", "Spain": "España",
    "Sweden": "Suecia", "Turkey": "Turquía", "United Kingdom": "Reino Unido", "Saudi Arabia": "Arabia Saudita",
    "United Arab Emirates": "Emiratos Árabes Unidos", "Australia": "Australia", "China": "China",
    "India": "India", "Indonesia": "Indonesia", "Japan": "Japón", "Malaysia": "Malasia", "New Zealand": "Nueva Zelanda", "Pakistan": "Pakistán", "Philippines": "Filipinas", "Singapore": "Singapur", "South Korea": "Corea del Sur",
    "Taiwan": "Taiwán", "Vietnam": "Vietnam",
    "Argentina": "Argentina", "Brazil": "Brasil", "Canada": "Canadá", "Chile": "Chile", "Colombia": "Colombia", "Costa Rica": "Costa Rica", "Ecuador": "Ecuador", "Mexico": "México", "Peru": "Perú",
    "United States": "Estados Unidos", "Uruguay": "Uruguay", "European Union": "Unión Europea"
  },
  de: {
    "Austria": "Österreich", "Belgium": "Belgien", "Croatia": "Kroatien", "Cyprus": "Zypern", "Czech Republic": "Tschechien", "Denmark": "Dänemark",
    "Egypt": "Ägypten", "Finland": "Finnland", "France": "Frankreich",
    "Germany": "Deutschland", "Greece": "Griechenland", "Hungary": "Ungarn", "Ireland": "Irland", "Israel": "Israel", "Italy": "Italien", "Jordan": "Jordanien", "Luxembourg": "Luxemburg",
    "Netherlands": "Niederlande", "Norway": "Norwegen", "Oman": "Oman",
    "Poland": "Polen", "Portugal": "Portugal", "Romania": "Rumänien", "Slovakia": "Slowakei", "Spain": "Spanien",
    "Sweden": "Schweden", "Turkey": "Türkei", "United Kingdom": "Vereinigtes Königreich", "Saudi Arabia": "Saudi-Arabien",
    "United Arab Emirates": "Vereinigte Arabische Emirate", "Australia": "Australien", "China": "China",
    "India": "Indien", "Indonesia": "Indonesien", "Japan": "Japan", "Malaysia": "Malaysia", "New Zealand": "Neuseeland", "Pakistan": "Pakistan", "Philippines": "Philippinen", "Singapore": "Singapur", "South Korea": "Südkorea",
    "Taiwan": "Taiwan", "Vietnam": "Vietnam",
    "Argentina": "Argentinien", "Brazil": "Brasilien", "Canada": "Kanada", "Chile": "Chile", "Colombia": "Kolumbien", "Costa Rica": "Costa Rica", "Ecuador": "Ecuador", "Mexico": "Mexiko", "Peru": "Peru",
    "United States": "Vereinigte Staaten", "Uruguay": "Uruguay", "European Union": "Europäische Union"
  },
  fr: {
    "Austria": "Autriche", "Belgium": "Belgique", "Croatia": "Croatie", "Cyprus": "Chypre", "Czech Republic": "République tchèque", "Denmark": "Danemark",
    "Egypt": "Égypte", "Finland": "Finlande", "France": "France",
    "Germany": "Allemagne", "Greece": "Grèce", "Hungary": "Hongrie", "Ireland": "Irlande", "Israel": "Israël", "Italy": "Italie", "Jordan": "Jordanie", "Luxembourg": "Luxembourg",
    "Netherlands": "Pays-Bas", "Norway": "Norvège", "Oman": "Oman",
    "Poland": "Pologne", "Portugal": "Portugal", "Romania": "Roumanie", "Slovakia": "Slovaquie", "Spain": "Espagne",
    "Sweden": "Suède", "Turkey": "Turquie", "United Kingdom": "Royaume-Uni", "Saudi Arabia": "Arabie saoudite",
    "United Arab Emirates": "Émirats arabes unis", "Australia": "Australie", "China": "Chine",
    "India": "Inde", "Indonesia": "Indonésie", "Japan": "Japon", "Malaysia": "Malaisie", "New Zealand": "Nouvelle-Zélande", "Pakistan": "Pakistan", "Philippines": "Philippines", "Singapore": "Singapour", "South Korea": "Corée du Sud",
    "Taiwan": "Taïwan", "Vietnam": "Viêt Nam",
    "Argentina": "Argentine", "Brazil": "Brésil", "Canada": "Canada", "Chile": "Chili", "Colombia": "Colombie", "Costa Rica": "Costa Rica", "Ecuador": "Équateur", "Mexico": "Mexique", "Peru": "Pérou",
    "United States": "États-Unis", "Uruguay": "Uruguay", "European Union": "Union européenne"
  }
};

export function translateCountryName(lang, name) {
  return COUNTRY_NAME_TRANSLATIONS[lang]?.[name] || name;
}

// Minimal UI-string set — only the keys the deep-dive template itself
// needs, a subset of members-worker's much larger WORKER_I18N (which
// also covers login/archive/preferences pages this module never touches).
const DEEP_DIVE_I18N = {
  en: {
    backToTracker: "← Back to global tracker",
    inEffect: "In effect", upcoming: "Upcoming",
    penaltyFailure: "Failure", penaltyFine: "Fine", penaltyAnnualCap: "Annual cap",
    secTimeline: "Compliance timeline", secFileFormat: "File format & data specification",
    secScope: "Scope & transmission", secSteps: "Getting compliant", secPenalties: "Penalties & enforcement",
    countryDeepDiveEyebrow: "Country deep dive", lastUpdatedLabel: "Last updated", complianceModelLabel: "Compliance model",
  },
  es: {
    backToTracker: "← Volver al panel general",
    inEffect: "En vigor", upcoming: "Próximamente",
    penaltyFailure: "Incumplimiento", penaltyFine: "Multa", penaltyAnnualCap: "Límite anual",
    secTimeline: "Cronología de cumplimiento", secFileFormat: "Formato de archivo y especificación de datos",
    secScope: "Alcance y transmisión", secSteps: "Cómo cumplir", secPenalties: "Sanciones y aplicación",
    countryDeepDiveEyebrow: "Análisis del país", lastUpdatedLabel: "Última actualización", complianceModelLabel: "Modelo de cumplimiento",
  },
  de: {
    backToTracker: "← Zurück zur Übersicht",
    inEffect: "In Kraft", upcoming: "Bevorstehend",
    penaltyFailure: "Verstoß", penaltyFine: "Bußgeld", penaltyAnnualCap: "Jahresobergrenze",
    secTimeline: "Compliance-Zeitachse", secFileFormat: "Dateiformat & Datenspezifikation",
    secScope: "Anwendungsbereich & Übermittlung", secSteps: "So werden Sie compliant", secPenalties: "Sanktionen & Durchsetzung",
    countryDeepDiveEyebrow: "Länderanalyse", lastUpdatedLabel: "Zuletzt aktualisiert", complianceModelLabel: "Compliance-Modell",
  },
  fr: {
    backToTracker: "← Retour au suivi global",
    inEffect: "En vigueur", upcoming: "À venir",
    penaltyFailure: "Manquement", penaltyFine: "Amende", penaltyAnnualCap: "Plafond annuel",
    secTimeline: "Chronologie de conformité", secFileFormat: "Format de fichier et spécification des données",
    secScope: "Champ d'application et transmission", secSteps: "Comment se conformer", secPenalties: "Sanctions et application",
    countryDeepDiveEyebrow: "Analyse par pays", lastUpdatedLabel: "Dernière mise à jour", complianceModelLabel: "Modèle de conformité",
  },
};

export function t(lang, key) {
  return DEEP_DIVE_I18N[lang]?.[key] ?? DEEP_DIVE_I18N.en[key];
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Derives the flag emoji from an ISO country code algorithmically
// (combining two Unicode regional indicator symbols) rather than a
// hardcoded per-country map.
export function deriveFlagFromCode(code) {
  return code.toUpperCase().replace(/./g, (ch) =>
    String.fromCodePoint(127397 + ch.charCodeAt(0))
  );
}

// `db` is a D1Database binding, passed in directly by the caller —
// this module makes no assumption about what it's called in either
// runtime's `env`.
export async function d1All(db, sql, ...params) {
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const { results } = await stmt.all();
  return results;
}

export async function d1First(db, sql, ...params) {
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return await stmt.first();
}

export async function getMilestonesForCountry(db, countryName, lang) {
  const rows = await d1All(db, `
    SELECT m.id, m.date, m.anchor, m.source_url,
           COALESCE(mt.system, mt_en.system) as system,
           COALESCE(mt.desc, mt_en.desc) as desc,
           COALESCE(mt.actions, mt_en.actions) as actions
    FROM milestones m
    JOIN countries c ON c.id = m.country_id
    LEFT JOIN milestone_translations mt ON mt.milestone_id = m.id AND mt.lang = ?
    LEFT JOIN milestone_translations mt_en ON mt_en.milestone_id = m.id AND mt_en.lang = 'en'
    WHERE c.name_en = ?
    ORDER BY m.date ASC
  `, lang, countryName);
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    anchor: !!r.anchor,
    sourceUrl: r.source_url,
    system: r.system,
    desc: r.desc,
    actions: JSON.parse(r.actions || "[]"),
  }));
}

function formatMilestoneDate(dateStr) {
  const [y, m] = dateStr.split("-");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
}

// Deep-dive-style rendering: matches the static pages' original
// timeline section CSS classes (.rtimeline, .rmonth-marker, .rcard, .rbadge).
export function renderDeepDiveStyleMilestones(milestones, lang) {
  let lastMonthMarker = "";
  const cards = milestones.map((m) => {
    const marker = formatMilestoneDate(m.date);
    const markerHtml = marker !== lastMonthMarker
      ? `<div class="rmonth-marker">${escapeHtml(marker.split(" ")[1])}</div>`
      : "";
    lastMonthMarker = marker;
    const badgeClass = new Date(m.date) <= new Date() ? "inforce" : "upcoming";
    const badgeLabel = badgeClass === "inforce" ? t(lang, "inEffect") : t(lang, "upcoming");
    return `${markerHtml}<div class="rcard">
      <div class="rcard-top"><span class="rcard-date">${escapeHtml(m.date)}</span><span class="rbadge ${badgeClass}">${badgeLabel}</span></div>
      <div class="rcard-title">${escapeHtml(m.system)}</div>
      <p class="rcard-desc">${escapeHtml(m.desc)}</p>
    </div>`;
  }).join("");
  return `<div class="rtimeline">${cards}</div>`;
}

export async function getDeepDiveContent(db, countryName, lang) {
  const page = await d1First(db, `
    SELECT COALESCE(dpt.compliance_model, dpt_en.compliance_model) as compliance_model,
           COALESCE(dpt.footer_disclaimer, dpt_en.footer_disclaimer) as footer_disclaimer,
           COALESCE(dpt.timeline_intro, dpt_en.timeline_intro) as timeline_intro,
           COALESCE(dpt.file_format_intro, dpt_en.file_format_intro) as file_format_intro,
           COALESCE(dpt.scope_intro, dpt_en.scope_intro) as scope_intro,
           COALESCE(dpt.steps_intro, dpt_en.steps_intro) as steps_intro,
           COALESCE(dpt.penalties_intro, dpt_en.penalties_intro) as penalties_intro,
           COALESCE(dpt.mandate_summary, dpt_en.mandate_summary) as mandate_summary,
           COALESCE(dpt.mandate_summary_icon, dpt_en.mandate_summary_icon) as mandate_summary_icon,
           ddp.last_updated
    FROM countries c
    JOIN deep_dive_pages ddp ON ddp.country_id = c.id
    LEFT JOIN deep_dive_page_translations dpt ON dpt.country_id = c.id AND dpt.lang = ?
    LEFT JOIN deep_dive_page_translations dpt_en ON dpt_en.country_id = c.id AND dpt_en.lang = 'en'
    WHERE c.name_en = ?
  `, lang, countryName);
  if (!page) return null;

  const stats = await d1All(db, `
    SELECT COALESCE(dst.stat_value, dst_en.stat_value) as stat_value,
           COALESCE(dst.stat_label, dst_en.stat_label) as stat_label
    FROM deep_dive_stats ds
    JOIN countries c ON c.id = ds.country_id
    LEFT JOIN deep_dive_stat_translations dst ON dst.stat_id = ds.id AND dst.lang = ?
    LEFT JOIN deep_dive_stat_translations dst_en ON dst_en.stat_id = ds.id AND dst_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY ds.sort_order
  `, lang, countryName);

  const cardRows = await d1All(db, `
    SELECT dc.section,
           COALESCE(dct.title, dct_en.title) as title,
           COALESCE(dct.rows_json, dct_en.rows_json) as rows_json,
           COALESCE(dct.note, dct_en.note) as note,
           COALESCE(dct.body, dct_en.body) as body,
           COALESCE(dct.badge_label, dct_en.badge_label) as badge_label,
           COALESCE(dct.badge_type, dct_en.badge_type) as badge_type
    FROM deep_dive_cards dc
    JOIN countries c ON c.id = dc.country_id
    LEFT JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = ?
    LEFT JOIN deep_dive_card_translations dct_en ON dct_en.card_id = dc.id AND dct_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dc.section, dc.sort_order
  `, lang, countryName);
  const cards = { file_format: [], scope_transmission: [], penalties_related: [] };
  for (const r of cardRows) {
    (cards[r.section] ||= []).push({
      title: r.title,
      rows: r.rows_json ? JSON.parse(r.rows_json) : null,
      note: r.note,
      body: r.body,
      badgeLabel: r.badge_label,
      badgeType: r.badge_type,
    });
  }

  const steps = await d1All(db, `
    SELECT COALESCE(dstt.title, dstt_en.title) as title,
           COALESCE(dstt.description, dstt_en.description) as description
    FROM deep_dive_steps dst
    JOIN countries c ON c.id = dst.country_id
    LEFT JOIN deep_dive_step_translations dstt ON dstt.step_id = dst.id AND dstt.lang = ?
    LEFT JOIN deep_dive_step_translations dstt_en ON dstt_en.step_id = dst.id AND dstt_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dst.sort_order
  `, lang, countryName);

  const portals = await d1All(db, `
    SELECT dp.url, COALESCE(dpt.label, dpt_en.label) as label
    FROM deep_dive_portals dp
    JOIN countries c ON c.id = dp.country_id
    LEFT JOIN deep_dive_portal_translations dpt ON dpt.portal_id = dp.id AND dpt.lang = ?
    LEFT JOIN deep_dive_portal_translations dpt_en ON dpt_en.portal_id = dp.id AND dpt_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dp.sort_order
  `, lang, countryName);

  const lifecycleCardRows = await d1All(db, `
    SELECT dlc.id, dlc.section, dlc.sort_order, dlc.display_style,
           COALESCE(dlct.title, dlct_en.title) as title,
           COALESCE(dlct.intro_text, dlct_en.intro_text) as intro_text,
           COALESCE(dlct.outro_text, dlct_en.outro_text) as outro_text
    FROM deep_dive_lifecycle_cards dlc
    JOIN countries c ON c.id = dlc.country_id
    LEFT JOIN deep_dive_lifecycle_card_translations dlct ON dlct.card_id = dlc.id AND dlct.lang = ?
    LEFT JOIN deep_dive_lifecycle_card_translations dlct_en ON dlct_en.card_id = dlc.id AND dlct_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dlc.section, dlc.sort_order
  `, lang, countryName);

  const lifecycleCards = [];
  for (const row of lifecycleCardRows) {
    const statuses = await d1All(db, `
      SELECT dls.is_special, COALESCE(dlst.label, dlst_en.label) as label
      FROM deep_dive_lifecycle_statuses_v2 dls
      LEFT JOIN deep_dive_lifecycle_status_v2_translations dlst ON dlst.status_id = dls.id AND dlst.lang = ?
      LEFT JOIN deep_dive_lifecycle_status_v2_translations dlst_en ON dlst_en.status_id = dls.id AND dlst_en.lang = 'en'
      WHERE dls.card_id = ? ORDER BY dls.sort_order
    `, lang, row.id);
    lifecycleCards.push({ section: row.section, sortOrder: row.sort_order, title: row.title, intro: row.intro_text, outro: row.outro_text, statuses, displayStyle: row.display_style });
  }

  const penaltyRows = await d1All(db, `
    SELECT COALESCE(dprt.failure_description, dprt_en.failure_description) as failure_description,
           COALESCE(dprt.fine_amount, dprt_en.fine_amount) as fine_amount,
           COALESCE(dprt.annual_cap, dprt_en.annual_cap) as annual_cap
    FROM deep_dive_penalty_rows dpr
    JOIN countries c ON c.id = dpr.country_id
    LEFT JOIN deep_dive_penalty_row_translations dprt ON dprt.row_id = dpr.id AND dprt.lang = ?
    LEFT JOIN deep_dive_penalty_row_translations dprt_en ON dprt_en.row_id = dpr.id AND dprt_en.lang = 'en'
    WHERE c.name_en = ? ORDER BY dpr.sort_order
  `, lang, countryName);

  return { ...page, stats, cards, steps, portals, lifecycleCards, penaltyRows };
}

function renderSpecCard(card) {
  const rowsHtml = (card.rows || []).map(([k, v]) => `<div class="spec-row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`).join("");
  // file_format/scope_transmission cards are usually rows-based, but a
  // handful (e.g. Pakistan's "Where actual compliance stands") are
  // body-only narrative cards with no rows_json at all -- without this,
  // such a card silently rendered as an empty box (title + no content),
  // since only renderRelatedCard (penalties_related) used to read .body.
  const bodyHtml = card.body ? `<p class="body-text">${escapeHtml(card.body)}</p>` : "";
  const badgeHtml = card.badgeLabel ? ` <span class="badge-tag ${escapeHtml(card.badgeType || "")}">${escapeHtml(card.badgeLabel)}</span>` : "";
  return `<div class="spec-card"><h3>${escapeHtml(card.title)}${badgeHtml}</h3>${rowsHtml}${bodyHtml}${card.note ? `<p class="note">${escapeHtml(card.note)}</p>` : ""}</div>`;
}

function renderRelatedCard(card) {
  return `<div class="related-card"><h4>${escapeHtml(card.title)}</h4><p>${escapeHtml(card.body)}</p></div>`;
}

function renderLifecycleCard(card) {
  if (!card.statuses || card.statuses.length === 0) return "";
  const itemsHtml = card.displayStyle === "list"
    ? `<ul class="lifecycle-list">${card.statuses.map((s) => `<li${s.is_special ? ' class="rej"' : ""}>${escapeHtml(s.label)}</li>`).join("")}</ul>`
    : `<div class="lifecycle">${card.statuses.map((s) => `<span${s.is_special ? ' class="rej"' : ""}>${escapeHtml(s.label)}</span>`).join("")}</div>`;
  return `<div class="spec-card">
    ${card.title ? `<h3>${escapeHtml(card.title)}</h3>` : ""}
    ${card.intro ? `<p class="note" style="margin-top:0; padding-top:0; border-top:none;">${escapeHtml(card.intro)}</p>` : ""}
    ${itemsHtml}
    ${card.outro ? `<p class="note">${escapeHtml(card.outro)}</p>` : ""}
  </div>`;
}

function renderLifecycleCardsForSection(lifecycleCards, section) {
  return (lifecycleCards || [])
    .filter((c) => c.section === section)
    .map(renderLifecycleCard)
    .join("");
}

function renderPenaltyTable(rows, lang) {
  if (!rows || rows.length === 0) return "";
  const rowsHtml = rows.map((r) => `<tr><td>${escapeHtml(r.failure_description)}</td><td>${escapeHtml(r.fine_amount || "—")}</td><td>${escapeHtml(r.annual_cap || "—")}</td></tr>`).join("");
  return `<div class="penalty-card">
    <table class="penalty-table">
      <tr><th>${t(lang, "penaltyFailure")}</th><th>${t(lang, "penaltyFine")}</th><th>${t(lang, "penaltyAnnualCap")}</th></tr>
      ${rowsHtml}
    </table>
  </div>`;
}

// Shared site-wide language banner — a thin bar at the very top of the
// page, above everything else. Same markup/colours as the banner
// members-worker's pageShell() renders and the one i18n.js injects on
// the static pages (2 August 2026) — this is the single, consistent
// language switcher for the whole site, replacing what used to be a
// bespoke inline switcher built separately by each caller. Links carry
// a plain "?lang=code" href (works with JS disabled, drops any other
// query params) and a tiny inline script upgrades them on load to
// preserve the current page's other query params (e.g. the preview
// route's ?country=). Clicking always reloads the page — unlike the
// static pages, this HTML is baked server-side per request, so there's
// no way to switch language without a fresh render.
export function renderLangBanner(lang) {
  const links = SUPPORTED_LANGS.map((code) => {
    const active = code === lang;
    const color = active ? "#c98a3a" : "#93a3c0";
    const weight = active ? "700" : "400";
    return `<a href="?lang=${code}" data-lang="${code}" style="color:${color}; font-weight:${weight}; text-decoration:none;">${code.toUpperCase()}</a>`;
  }).join("");
  return `<div id="eiccLangBanner" style="background:#152238; padding:7px 18px; display:flex; align-items:center; justify-content:flex-end; gap:14px; font-family:'IBM Plex Mono',monospace; font-size:11.5px; position:relative; z-index:70;">
    <span style="color:#93a3c0;">🌐</span>${links}
  </div>
  <script>(function(){var p=new URLSearchParams(window.location.search);document.querySelectorAll('#eiccLangBanner a[data-lang]').forEach(function(a){p.set('lang',a.getAttribute('data-lang'));a.href=window.location.pathname+'?'+p.toString();});})();</script>`;
}

// Full deep-dive page render, sourced entirely from D1. `backLinkHref`
// is parameterised: the Worker's admin preview uses the absolute
// production tracker URL (different origin), while the real production
// page (site-worker) uses a same-origin relative link instead. The
// language banner itself is no longer a caller-supplied parameter —
// see renderLangBanner() above — since both runtimes now render the
// exact same shared banner.
export async function renderFullDeepDivePage(countryName, flag, code, region, content, milestones, lang, backLinkHref) {
  const timelineHtml = renderDeepDiveStyleMilestones(milestones, lang);
  const statsHtml = content.stats.map((s) => `<div class="stat"><div class="num display">${escapeHtml(s.stat_value)}</div><div class="lbl">${escapeHtml(s.stat_label)}</div></div>`).join("");
  const fileFormatHtml = content.cards.file_format.map(renderSpecCard).join("") + renderLifecycleCardsForSection(content.lifecycleCards, "file_format");
  const scopeHtml = content.cards.scope_transmission.map(renderSpecCard).join("") + renderLifecycleCardsForSection(content.lifecycleCards, "scope_transmission");
  const relatedHtml = renderPenaltyTable(content.penaltyRows, lang) + content.cards.penalties_related.map(renderRelatedCard).join("");
  const stepsHtml = content.steps.map((s) => `
    <div class="step"><div class="step-num"></div><div class="step-body"><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.description)}</p></div></div>`).join("");
  const portalsHtml = content.portals.map((p) => `<a class="portal-btn" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.label)}</a>`).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(translateCountryName(lang, countryName))} E-Invoicing Requirements — The E-Invoicing Compliance Corner</title>
<link rel="canonical" href="https://e-invoicingcompliancecorner.com/${COUNTRY_DEEP_DIVE_SLUGS[countryName] || ""}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0f1a2b; --ink-2:#152238; --line:#2b3c5a;
    --paper:#efe9db; --paper-2:#e4dcc6; --paper-line:#c9bd9e;
    --text-lo:#f2f0e8; --muted:#93a3c0;
    --stamp:#b5432f; --stamp-dim:#7c3628;
    --live-dim:#274a38; --soon:#c98a3a; --soon-dim:#6e4c22;
    --upcoming-dim:#3a4864; --radius:10px;
  }
  *{box-sizing:border-box;} html,body{margin:0;padding:0;}
  body{background:var(--ink); color:var(--text-lo); font-family:'IBM Plex Sans',sans-serif; line-height:1.55;}
  .display{font-family:'Big Shoulders Display',sans-serif; font-weight:800;}
  .wrap{max-width:980px; margin:0 auto; padding:0 5vw 60px;}
  .top-bar{display:flex; justify-content:space-between; align-items:center; padding-top:20px;}
  .back-link{display:inline-flex; align-items:center; gap:6px; margin:0; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--muted); text-decoration:none;}
  .back-link:hover{color:var(--soon);}
  .country-head{display:flex; flex-wrap:wrap; gap:18px; align-items:flex-start; justify-content:space-between; padding:18px 0 26px; border-bottom:1px solid var(--line); margin-bottom:28px;}
  .country-flag{font-size:46px; line-height:1;}
  .country-eyebrow{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--soon); margin:0 0 4px;}
  .country-title{font-size:clamp(28px,4.5vw,42px); margin:0; text-transform:uppercase; line-height:0.95;}
  .country-region{font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--muted); margin-top:6px;}
  .country-meta{font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--muted); text-align:right;}
  .country-meta-col{display:flex; flex-direction:column; align-items:flex-end; gap:10px;}
  .portal-row-header{display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end;}
  .stat-strip{display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; margin-bottom:36px;}
  .stat-strip .stat{background:var(--ink-2); padding:16px 18px;}
  .stat-strip .stat .num{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:22px; line-height:1.15;}
  .stat-strip .stat .lbl{font-size:10.8px; color:var(--muted); text-transform:uppercase; letter-spacing:0.07em; margin-top:5px;}
  .status-banner{background:var(--soon-dim); border:1px solid var(--soon); color:#ffe9c7; border-radius:var(--radius); padding:14px 18px; margin-bottom:32px; font-size:13.3px; display:flex; gap:12px; align-items:flex-start;}
  .status-banner .icon{font-size:18px; line-height:1;}
  .section{margin-bottom:44px;}
  .section-head{display:flex; align-items:baseline; gap:12px; margin-bottom:6px;}
  .section-head .num{color:var(--soon); font-size:13px;}
  .section-head h2{margin:0; font-size:clamp(20px,3vw,28px); text-transform:uppercase;}
  .section-intro{color:var(--muted); font-size:14.5px; max-width:760px; margin:0 0 20px;}
  .rtimeline{position:relative; padding-left:20px; border-left:2px solid var(--line);}
  .rmonth-marker{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--soon); text-transform:uppercase; letter-spacing:0.08em; margin:22px 0 8px -20px; padding-left:20px;}
  .rmonth-marker:first-child{margin-top:0;}
  .rcard{background:var(--paper); color:#241d10; border:1px solid var(--paper-line); border-radius:var(--radius); padding:14px 18px; margin-bottom:10px;}
  .rcard-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;}
  .rcard-date{font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:600; color:#4a3f22;}
  .rbadge{font-family:'IBM Plex Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; padding:3px 9px; border-radius:999px; font-weight:600;}
  .rbadge.inforce{background:var(--live-dim); color:#bfe6cf;}
  .rbadge.upcoming{background:var(--upcoming-dim); color:#dbe2ee;}
  .rcard-title{font-weight:600; margin-bottom:4px;}
  .rcard-desc{color:#4a4030; font-size:13.5px; margin:0;}
  .spec-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px;}
  .spec-card{background:var(--paper); color:#241d10; border:1px solid var(--paper-line); border-radius:var(--radius); padding:16px 18px 18px; min-width:0;}
  .spec-card h3{font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.09em; color:#6b5f3f; margin:0 0 10px; display:flex; align-items:center; gap:8px;}
  .spec-card h3::after{content:""; flex:1; height:1px; background:var(--paper-line);}
  .spec-row{display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-top:1px dashed var(--paper-line); font-size:13px;}
  .spec-row:first-of-type{border-top:none;}
  .spec-row .k{color:#6b5f3f; flex:0 0 42%;} .spec-row .v{color:#241d10; text-align:right; font-weight:500; flex:1 1 auto; min-width:0; overflow-wrap:break-word; word-break:break-word;}
  .spec-card p.body-text{font-size:13px; line-height:1.6; color:#241d10; margin:4px 0 0;}
  .note{font-size:12.6px; color:#5a5138; margin:10px 0 0; padding-top:10px; border-top:1px dashed var(--paper-line); line-height:1.5;}
  .badge-tag{display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:9.5px; text-transform:uppercase; letter-spacing:0.06em; padding:2px 7px; border-radius:4px; margin-left:6px; vertical-align:middle;}
  .badge-tag.confirmed{background:var(--live-dim); color:#bfe6cf;}
  .badge-tag.pending{background:var(--upcoming-dim); color:#dbe2ee;}
  .lifecycle{display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;}
  .lifecycle span{font-family:'IBM Plex Mono',monospace; font-size:11px; background:var(--soon-dim); color:#ffe0b3; padding:5px 11px; border-radius:14px; white-space:normal; max-width:100%; overflow-wrap:break-word; word-break:break-word; line-height:1.4;}
  .lifecycle span.rej{background:var(--stamp-dim); color:#ffd7cc;}
  .lifecycle-list{list-style:none; margin:4px 0 0; padding:0; display:flex; flex-direction:column; gap:6px;}
  .lifecycle-list li{font-size:13px; color:#241d10; padding:6px 10px; background:var(--paper-2); border-radius:6px;}
  .lifecycle-list li.rej{background:var(--stamp-dim); color:#ffd7cc;}
  .steps{counter-reset:step; display:flex; flex-direction:column; gap:0;}
  .step{display:flex; gap:16px; padding:16px 0; border-top:1px dashed var(--line);}
  .step:first-child{border-top:none;}
  .step-num{counter-increment:step; flex:0 0 auto; width:30px; height:30px; border-radius:50%; background:var(--soon-dim); color:#ffe0b3; display:flex; align-items:center; justify-content:center; font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:14px;}
  .step-num::before{content:counter(step);}
  .step-body h4{margin:2px 0 4px; font-size:14.5px;} .step-body p{margin:0; font-size:13.3px; color:var(--muted);}
  .related-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px;}
  .related-card{background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:16px 18px;}
  .related-card h4{margin:0 0 6px; font-size:14px;} .related-card p{margin:0; color:var(--muted); font-size:13px;}
  .penalty-table{width:100%; border-collapse:collapse; font-size:13px;}
  .penalty-table th, .penalty-table td{text-align:left; padding:9px 10px; border-bottom:1px dashed var(--paper-line);}
  .penalty-table th{font-family:'IBM Plex Mono',monospace; font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em; color:#6b5f3f;}
  .penalty-table td{color:#241d10;}
  .penalty-card{background:var(--paper); color:#241d10; border-radius:var(--radius); border:1px solid var(--paper-line); padding:16px 18px; grid-column:1 / -1;}
  .portal-btn{display:inline-block; background:var(--ink-2); border:1px solid var(--line); border-radius:999px; padding:9px 18px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; text-decoration:none; color:var(--text-lo);}
  footer{border-top:1px solid var(--line); padding-top:20px; color:var(--muted); font-size:12px; line-height:1.6;}
</style>
</head>
<body>
${renderLangBanner(lang)}
<div class="wrap">
  <div class="top-bar">
    <a class="back-link" href="${backLinkHref}">${t(lang, "backToTracker")}</a>
  </div>
  <div class="country-head">
    <div style="display:flex; gap:16px; align-items:center;">
      <div class="country-flag">${flag}</div>
      <div>
        <p class="country-eyebrow">${t(lang, "countryDeepDiveEyebrow")}</p>
        <h1 class="country-title display">${escapeHtml(translateCountryName(lang, countryName))}</h1>
        <div class="country-region">${escapeHtml(region)} · ${escapeHtml(code)} · VAT area: EU</div>
      </div>
    </div>
    <div class="country-meta-col">
      <div class="country-meta">${t(lang, "lastUpdatedLabel")}: ${escapeHtml(content.last_updated)}<br>${t(lang, "complianceModelLabel")}: ${escapeHtml(content.compliance_model)}</div>
      <div class="portal-row-header">${portalsHtml}</div>
    </div>
  </div>

  ${content.mandate_summary ? `<div class="status-banner"><span class="icon">${escapeHtml(content.mandate_summary_icon || "ℹ️")}</span><span>${escapeHtml(content.mandate_summary)}</span></div>` : ""}

  <div class="stat-strip">${statsHtml}</div>

  <div class="section">
    <div class="section-head"><span class="num mono">01</span><h2 class="display">${t(lang, "secTimeline")}</h2></div>
    <p class="section-intro">${escapeHtml(content.timeline_intro)}</p>
    ${timelineHtml}
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">02</span><h2 class="display">${t(lang, "secFileFormat")}</h2></div>
    <p class="section-intro">${escapeHtml(content.file_format_intro)}</p>
    <div class="spec-grid">${fileFormatHtml}</div>
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">03</span><h2 class="display">${t(lang, "secScope")}</h2></div>
    <p class="section-intro">${escapeHtml(content.scope_intro)}</p>
    <div class="spec-grid">${scopeHtml}</div>
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">04</span><h2 class="display">${t(lang, "secSteps")}</h2></div>
    <p class="section-intro">${escapeHtml(content.steps_intro)}</p>
    <div class="steps">${stepsHtml}</div>
  </div>

  <div class="section">
    <div class="section-head"><span class="num mono">05</span><h2 class="display">${t(lang, "secPenalties")}</h2></div>
    <p class="section-intro">${escapeHtml(content.penalties_intro)}</p>
    <div class="related-grid">${relatedHtml}</div>
  </div>

  <footer><p>${escapeHtml(content.footer_disclaimer)}</p></footer>
</div>
</body>
</html>`;
}
