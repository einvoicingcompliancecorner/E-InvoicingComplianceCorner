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

import { themeBootScript } from "./palette.mjs";
import { ldScript, countryPageLd, breadcrumbLd } from "./structured-data.mjs";
// The five headline facts, shared with the compliance guide. A LEAF
// module: guides-render.mjs imports from THIS file, so the tiles could
// not live there and be imported back. See shared/headline-facts.mjs.
import { headlineTiles, HEADLINE_DARK_STYLE } from "./headline-facts.mjs";

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
  "Angola": "angola",
  "Thailand": "thailand",
  "Hong Kong": "hong-kong",
  "Switzerland": "switzerland",
  "Ghana": "ghana",
  "Liechtenstein": "liechtenstein",
  "Botswana": "botswana",
  "Argentina": "argentina", "Australia": "australia", "Austria": "austria", "Belgium": "belgium", "Brazil": "brazil", "Bulgaria": "bulgaria", "Canada": "canada",
  "Chile": "chile", "China": "china", "Colombia": "colombia", "Costa Rica": "costa-rica", "Croatia": "croatia", "Cyprus": "cyprus", "Czech Republic": "czech-republic", "Denmark": "denmark",
  "Dominican Republic": "dominican-republic", "Estonia": "estonia",
  "Kenya": "kenya",
  "Nigeria": "nigeria", "Ecuador": "ecuador", "Egypt": "egypt", "Finland": "finland",
  "France": "france", "Germany": "germany", "Greece": "greece", "Hungary": "hungary", "Iceland": "iceland", "India": "india", "Indonesia": "indonesia", "Ireland": "ireland", "Israel": "israel",
  "Italy": "italy", "Japan": "japan", "Jordan": "jordan", "Kazakhstan": "kazakhstan", "Latvia": "latvia", "Lithuania": "lithuania", "Luxembourg": "luxembourg", "Malta": "malta", "Netherlands": "netherlands", "Malaysia": "malaysia", "Mexico": "mexico", "New Zealand": "new-zealand",
  "Norway": "norway", "Oman": "oman", "Pakistan": "pakistan", "Peru": "peru", "Philippines": "philippines", "Poland": "poland", "Portugal": "portugal", "Romania": "romania",
  "Saudi Arabia": "saudi-arabia", "Serbia": "serbia", "Singapore": "singapore", "Slovakia": "slovakia", "Slovenia": "slovenia", "South Korea": "south-korea",
  "Spain": "spain", "Sweden": "sweden", "Taiwan": "taiwan", "Turkey": "turkey", "United Arab Emirates": "uae",
  "United Kingdom": "uk", "United States": "united-states", "Uruguay": "uruguay", "Vietnam": "vietnam",
  "Bahrain": "bahrain", "Qatar": "qatar",
  "Uzbekistan": "uzbekistan", "Azerbaijan": "azerbaijan",
  // NOT A COUNTRY, AND DELIBERATELY IN A COUNTRY TABLE. Dan, 28 August
  // 2026: "The European Union, side menu does not link. Although I think
  // we built a deep-dive for it." He had. Eleven cards, five stats, six
  // registration steps, two portals and a complete set of DE/ES/FR
  // translations, reachable by nothing at all: this table is what decides
  // whether an incoming path is a country page before any D1 round-trip,
  // the EU was not in it, and /european-union answered 404 while the
  // content behind it sat above the corpus average on every dimension
  // the whole corpus has.
  //
  // IT IS LINKED FROM THE SIDE MENU LIKE ANY OTHER ROW. The first
  // attempt was not: I offered him "publish, don't link" and described
  // it as the sidebar keeping the EU as plain text, he chose it, and
  // when he saw it he said what he had actually meant --
  //
  //   "the European Union sidebar menu item that lives among other
  //    deep-dives does not link to a deep dive on the European Union...
  //    the deep-dive alone was considered to provide EU wide information
  //    from EU sources, without it having to be replicated across all
  //    member states. ... the European Union menu item in the side bar,
  //    still does nothing."
  //
  // The EU is excluded from SUBSCRIPTION and from COUNTS -- no checkbox
  // in the monthly digest, not in the ROI picker, not in "76
  // jurisdictions", not on the choropleth, which has no shape for it.
  // Those are in_picker's job. Being linked to is not.
  "European Union": "european-union",
};

export const SLUG_TO_COUNTRY = Object.fromEntries(
  Object.entries(COUNTRY_DEEP_DIVE_SLUGS).map(([name, slug]) => [slug, name])
);

const COUNTRY_NAME_TRANSLATIONS = {
  es: { "Angola": "Angola", "Thailand": "Tailandia", "Hong Kong": "Hong Kong", "Switzerland": "Suiza", "Ghana": "Ghana", "Liechtenstein": "Liechtenstein",
     "Botswana": "Botsuana","Austria": "Austria", "Belgium": "Bélgica", "Bulgaria": "Bulgaria", "Croatia": "Croacia", "Cyprus": "Chipre", "Czech Republic": "República Checa", "Denmark": "Dinamarca", "Estonia": "Estonia",
    "Egypt": "Egipto", "Finland": "Finlandia", "France": "Francia",
    "Germany": "Alemania", "Greece": "Grecia", "Hungary": "Hungría", "Iceland": "Islandia", "Ireland": "Irlanda", "Israel": "Israel", "Italy": "Italia", "Jordan": "Jordania", "Luxembourg": "Luxemburgo",
    "Latvia": "Letonia", "Lithuania": "Lituania", "Malta": "Malta", "Netherlands": "Países Bajos", "Norway": "Noruega", "Oman": "Omán",
    "Poland": "Polonia", "Portugal": "Portugal", "Romania": "Rumania", "Serbia": "Serbia", "Slovakia": "Eslovaquia", "Slovenia": "Eslovenia", "Spain": "España",
    "Sweden": "Suecia", "Turkey": "Turquía", "United Kingdom": "Reino Unido", "Saudi Arabia": "Arabia Saudita",
    "United Arab Emirates": "Emiratos Árabes Unidos", "Australia": "Australia", "China": "China",
    "India": "India", "Indonesia": "Indonesia", "Japan": "Japón", "Kazakhstan": "Kazajistán", "Malaysia": "Malasia", "New Zealand": "Nueva Zelanda", "Pakistan": "Pakistán", "Philippines": "Filipinas", "Singapore": "Singapur", "South Korea": "Corea del Sur",
    "Taiwan": "Taiwán", "Vietnam": "Vietnam",
    "Argentina": "Argentina", "Brazil": "Brasil", "Canada": "Canadá", "Chile": "Chile", "Colombia": "Colombia", "Costa Rica": "Costa Rica", "Dominican Republic": "República Dominicana",
    "Kenya": "Kenia",
    "Nigeria": "Nigeria", "Ecuador": "Ecuador", "Mexico": "México", "Peru": "Perú",
    "United States": "Estados Unidos", "Uruguay": "Uruguay", "European Union": "Unión Europea",
    "Bahrain": "Baréin", "Qatar": "Catar",
    "Uzbekistan": "Uzbekistán", "Azerbaijan": "Azerbaiyán"
  },
  de: { "Angola": "Angola", "Thailand": "Thailand", "Hong Kong": "Hongkong", "Switzerland": "Schweiz", "Ghana": "Ghana", "Liechtenstein": "Liechtenstein",
     "Botswana": "Botsuana","Austria": "Österreich", "Belgium": "Belgien", "Bulgaria": "Bulgarien", "Croatia": "Kroatien", "Cyprus": "Zypern", "Czech Republic": "Tschechien", "Denmark": "Dänemark", "Estonia": "Estland",
    "Egypt": "Ägypten", "Finland": "Finnland", "France": "Frankreich",
    "Germany": "Deutschland", "Greece": "Griechenland", "Hungary": "Ungarn", "Iceland": "Island", "Ireland": "Irland", "Israel": "Israel", "Italy": "Italien", "Jordan": "Jordanien", "Luxembourg": "Luxemburg",
    "Latvia": "Lettland", "Lithuania": "Litauen", "Malta": "Malta", "Netherlands": "Niederlande", "Norway": "Norwegen", "Oman": "Oman",
    "Poland": "Polen", "Portugal": "Portugal", "Romania": "Rumänien", "Serbia": "Serbien", "Slovakia": "Slowakei", "Slovenia": "Slowenien", "Spain": "Spanien",
    "Sweden": "Schweden", "Turkey": "Türkei", "United Kingdom": "Vereinigtes Königreich", "Saudi Arabia": "Saudi-Arabien",
    "United Arab Emirates": "Vereinigte Arabische Emirate", "Australia": "Australien", "China": "China",
    "India": "Indien", "Indonesia": "Indonesien", "Japan": "Japan", "Kazakhstan": "Kasachstan", "Malaysia": "Malaysia", "New Zealand": "Neuseeland", "Pakistan": "Pakistan", "Philippines": "Philippinen", "Singapore": "Singapur", "South Korea": "Südkorea",
    "Taiwan": "Taiwan", "Vietnam": "Vietnam",
    "Argentina": "Argentinien", "Brazil": "Brasilien", "Canada": "Kanada", "Chile": "Chile", "Colombia": "Kolumbien", "Costa Rica": "Costa Rica", "Dominican Republic": "Dominikanische Republik",
    "Kenya": "Kenia",
    "Nigeria": "Nigeria", "Ecuador": "Ecuador", "Mexico": "Mexiko", "Peru": "Peru",
    "United States": "Vereinigte Staaten", "Uruguay": "Uruguay", "European Union": "Europäische Union",
    "Bahrain": "Bahrain", "Qatar": "Katar",
    "Uzbekistan": "Usbekistan", "Azerbaijan": "Aserbaidschan"
  },
  fr: { "Angola": "Angola", "Thailand": "Thaïlande", "Hong Kong": "Hong Kong", "Switzerland": "Suisse", "Ghana": "Ghana", "Liechtenstein": "Liechtenstein",
     "Botswana": "Botswana","Austria": "Autriche", "Belgium": "Belgique", "Bulgaria": "Bulgarie", "Croatia": "Croatie", "Cyprus": "Chypre", "Czech Republic": "République tchèque", "Denmark": "Danemark", "Estonia": "Estonie",
    "Egypt": "Égypte", "Finland": "Finlande", "France": "France",
    "Germany": "Allemagne", "Greece": "Grèce", "Hungary": "Hongrie", "Iceland": "Islande", "Ireland": "Irlande", "Israel": "Israël", "Italy": "Italie", "Jordan": "Jordanie", "Luxembourg": "Luxembourg",
    "Latvia": "Lettonie", "Lithuania": "Lituanie", "Malta": "Malte", "Netherlands": "Pays-Bas", "Norway": "Norvège", "Oman": "Oman",
    "Poland": "Pologne", "Portugal": "Portugal", "Romania": "Roumanie", "Serbia": "Serbie", "Slovakia": "Slovaquie", "Slovenia": "Slovénie", "Spain": "Espagne",
    "Sweden": "Suède", "Turkey": "Turquie", "United Kingdom": "Royaume-Uni", "Saudi Arabia": "Arabie saoudite",
    "United Arab Emirates": "Émirats arabes unis", "Australia": "Australie", "China": "Chine",
    "India": "Inde", "Indonesia": "Indonésie", "Japan": "Japon", "Kazakhstan": "Kazakhstan", "Malaysia": "Malaisie", "New Zealand": "Nouvelle-Zélande", "Pakistan": "Pakistan", "Philippines": "Philippines", "Singapore": "Singapour", "South Korea": "Corée du Sud",
    "Taiwan": "Taïwan", "Vietnam": "Viêt Nam",
    "Argentina": "Argentine", "Brazil": "Brésil", "Canada": "Canada", "Chile": "Chili", "Colombia": "Colombie", "Costa Rica": "Costa Rica", "Dominican Republic": "République dominicaine",
    "Kenya": "Kenya",
    "Nigeria": "Nigéria", "Ecuador": "Équateur", "Mexico": "Mexique", "Peru": "Pérou",
    "United States": "États-Unis", "Uruguay": "Uruguay", "European Union": "Union européenne",
    "Bahrain": "Bahreïn", "Qatar": "Qatar",
    "Uzbekistan": "Ouzbékistan", "Azerbaijan": "Azerbaïdjan"
  }
};

export function translateCountryName(lang, name) {
  return COUNTRY_NAME_TRANSLATIONS[lang]?.[name] || name;
}

// The four region names D1 holds, which are stored in English because
// they are also a sort key (see buildTrackerData's CASE). Added with the
// related-jurisdictions block, whose heading names the region it grouped
// by — and a German page reading "Weitere Jurisdiktionen — Middle East /
// Africa" is the same half-translated sentence this project has shipped
// twice before. Falls through to the stored value for anything not
// listed, so a new region appears in English rather than not at all.
const REGION_TRANSLATIONS = {
  es: { "Europe": "Europa", "Middle East / Africa": "Oriente Medio / África",
        "Asia-Pacific": "Asia-Pacífico", "Americas": "América" },
  de: { "Europe": "Europa", "Middle East / Africa": "Naher Osten / Afrika",
        "Asia-Pacific": "Asien-Pazifik", "Americas": "Amerika" },
  fr: { "Europe": "Europe", "Middle East / Africa": "Moyen-Orient / Afrique",
        "Asia-Pacific": "Asie-Pacifique", "Americas": "Amériques" },
};

export function translateRegion(lang, region) {
  return REGION_TRANSLATIONS[lang]?.[region] || region;
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
    euVatArea: "EU VAT area",
    relatedHeading: "Related jurisdictions",
    relatedIntro: "Other countries in the same region, ordered by their next dated milestone. Each links to a full briefing.",
  },
  es: {
    backToTracker: "← Volver al panel general",
    inEffect: "En vigor", upcoming: "Próximamente",
    penaltyFailure: "Incumplimiento", penaltyFine: "Multa", penaltyAnnualCap: "Límite anual",
    secTimeline: "Cronología de cumplimiento", secFileFormat: "Formato de archivo y especificación de datos",
    secScope: "Alcance y transmisión", secSteps: "Cómo cumplir", secPenalties: "Sanciones y aplicación",
    countryDeepDiveEyebrow: "Análisis del país", lastUpdatedLabel: "Última actualización", complianceModelLabel: "Modelo de cumplimiento",
    euVatArea: "Territorio IVA de la UE",
    relatedHeading: "Jurisdicciones relacionadas",
    relatedIntro: "Otros países de la misma región, ordenados por su próximo hito con fecha. Cada enlace lleva a un informe completo.",
  },
  de: {
    backToTracker: "← Zurück zur Übersicht",
    inEffect: "In Kraft", upcoming: "Bevorstehend",
    penaltyFailure: "Verstoß", penaltyFine: "Bußgeld", penaltyAnnualCap: "Jahresobergrenze",
    secTimeline: "Compliance-Zeitachse", secFileFormat: "Dateiformat & Datenspezifikation",
    secScope: "Anwendungsbereich & Übermittlung", secSteps: "So werden Sie compliant", secPenalties: "Sanktionen & Durchsetzung",
    countryDeepDiveEyebrow: "Länderanalyse", lastUpdatedLabel: "Zuletzt aktualisiert", complianceModelLabel: "Compliance-Modell",
    euVatArea: "EU-Mehrwertsteuergebiet",
    relatedHeading: "Weitere Jurisdiktionen",
    relatedIntro: "Andere Länder derselben Region, sortiert nach ihrem nächsten datierten Meilenstein. Jeder Eintrag führt zu einem vollständigen Briefing.",
  },
  fr: {
    backToTracker: "← Retour au suivi global",
    inEffect: "En vigueur", upcoming: "À venir",
    penaltyFailure: "Manquement", penaltyFine: "Amende", penaltyAnnualCap: "Plafond annuel",
    secTimeline: "Chronologie de conformité", secFileFormat: "Format de fichier et spécification des données",
    secScope: "Champ d'application et transmission", secSteps: "Comment se conformer", secPenalties: "Sanctions et application",
    countryDeepDiveEyebrow: "Analyse par pays", lastUpdatedLabel: "Dernière mise à jour", complianceModelLabel: "Modèle de conformité",
    euVatArea: "Territoire TVA de l'UE",
    relatedHeading: "Juridictions liées",
    relatedIntro: "Les autres pays de la même région, classés par prochaine échéance datée. Chaque entrée mène à un dossier complet.",
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

/**
 * The other jurisdictions in this country's region.
 *
 * WHY THIS EXISTS (25 August 2026). Every one of the seventy deep dives
 * linked UP to the tracker and nowhere sideways. There was no path from
 * Germany to France, or from Saudi Arabia to the UAE, even though the
 * clusters are in the data as `region` and a reader working one GCC
 * mandate is very often working the others. Two costs: a reader who
 * wanted the neighbour had to go back to the board and find it, and a
 * crawler reaching any country page found exactly one link out of it, so
 * the whole set hung off the sitemap and one index rather than off each
 * other.
 *
 * JOINED TO milestones ON on_tracker, not left-joined. A country with no
 * tracked milestone is not on the board, and listing it here would put
 * seventy-first and seventy-second jurisdictions in front of a reader
 * that every other surface on this site says do not exist.
 *
 * `next_date` IS THE NEXT ONE, NOT THE FIRST ONE. The tracker's country
 * index shipped on 24 August printing each country's EARLIEST milestone
 * under a heading promising its next — the United States was listed as
 * March 2003. The CASE below filters to dates from today forward before
 * MIN sees them, so a country whose milestones are all in the past
 * sorts last with no date rather than with an ancient one.
 */
export async function getRelatedJurisdictions(db, region, countryName) {
  if (!region) return [];
  return d1All(db, `
    SELECT c.name_en AS name, c.code, c.slug,
           MIN(CASE WHEN m.date >= date('now') THEN m.date END) AS next_date
    FROM countries c
    JOIN milestones m ON m.country_id = c.id AND m.on_tracker = 1
    WHERE c.region = ?
      AND c.name_en != ?
      AND c.slug IS NOT NULL
      AND c.code != 'EU'
    GROUP BY c.id, c.name_en, c.code, c.slug
    ORDER BY (next_date IS NULL), next_date, c.name_en
  `, region, countryName);
}

/**
 * The related block. Chips, not a nav list: each carries the next dated
 * milestone, so it tells a reader something before they click.
 *
 * NO CAP, DELIBERATELY. Europe is around thirty entries and that is four
 * rows of chips. A "top 8 related" would be a silent truncation of the
 * exact thing this block exists to provide, and this repository has a
 * standing rule against bounding coverage without saying so.
 *
 * COUNTRY NAMES ARE TRANSLATED SERVER-SIDE HERE, unlike the tracker's
 * country index, which server-renders English and translates after load.
 * It can be done properly here because this whole page is already
 * rendered per language — `lang` is in hand and translateCountryName is
 * two functions up.
 *
 * Renders nothing at all when there is nothing to show, rather than a
 * heading over an empty row.
 */
export function renderRelatedJurisdictions(related, lang, region) {
  if (!related || !related.length) return "";
  const chips = related.map((r) => {
    const label = escapeHtml(translateCountryName(lang, r.name));
    const when = r.next_date ? formatMilestoneDate(r.next_date) : "";
    return `<a class="rj-chip" href="/${escapeHtml(r.slug)}${lang === "en" ? "" : `?lang=${escapeHtml(lang)}`}">`
      + `<span class="rj-flag">${deriveFlagFromCode(r.code)}</span>`
      + `<span class="rj-name">${label}</span>`
      + (when ? `<span class="rj-when">${escapeHtml(when)}</span>` : "")
      + `</a>`;
  }).join("");
  // The heading names the region, so the block says what it grouped by
  // rather than leaving the reader to infer it from the members.
  const heading = `${t(lang, "relatedHeading")} — ${escapeHtml(region)}`;
  return `
  <div class="section rj-section">
    <div class="section-head"><span class="num mono">06</span><h2 class="display">${heading}</h2></div>
    <p class="section-intro">${escapeHtml(t(lang, "relatedIntro"))}</p>
    <div class="rj-grid">${chips}</div>
  </div>`;
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

// The penalties_related renderer, and the mirror of a bug already fixed
// once above.
//
// renderSpecCard's comment records that file_format and
// scope_transmission cards were rendering an empty box when a country
// authored a body-only card, "since only renderRelatedCard
// (penalties_related) used to read .body". That fix taught spec cards to
// read bodies. It did not teach related cards to read ROWS -- so a
// penalties_related card authored with rows_json and no body printed the
// literal string "null" where its content should be, because
// escapeHtml(null) is "null".
//
// Dan found it on Ghana on 27 August 2026. Kenya and Nigeria had been
// shipping it since they were added, twelve cards across five countries.
// Half a fix is how the second half survives.
//
// Now mirrors the compliance guide, which has always rendered all three
// and skipped a card with none of them -- one vocabulary across the two
// surfaces, which is the same rule the front-page table was corrected to
// obey the day before.
function renderRelatedCard(card) {
  const rowsHtml = (card.rows || []).map(([k, v]) =>
    `<div class="related-row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`).join("");
  const bodyHtml = card.body ? `<p>${escapeHtml(card.body)}</p>` : "";
  const noteHtml = card.note ? `<p class="note">${escapeHtml(card.note)}</p>` : "";
  // A card with a title and nothing else is a worse artefact than no
  // card: it reads as content that failed to load.
  if (!rowsHtml && !bodyHtml && !noteHtml) return "";
  return `<div class="related-card"><h4>${escapeHtml(card.title)}</h4>${rowsHtml}${bodyHtml}${noteHtml}</div>`;
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
    const color = active ? "var(--soon)" : "var(--muted)";
    const weight = active ? "700" : "400";
    return `<a href="?lang=${code}" data-lang="${code}" style="color:${color}; font-weight:${weight}; text-decoration:none;">${code.toUpperCase()}</a>`;
  }).join("");
  return `<div id="eiccLangBanner" style="background:var(--ink-2); padding:7px 18px; display:flex; align-items:center; justify-content:flex-end; gap:14px; font-family:'IBM Plex Mono',monospace; font-size:11.5px; position:relative; z-index:70;">
    <span style="color:var(--muted);">🌐</span>${links}
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
// Locale codes for og:locale. Not the same thing as our language codes,
// and Facebook/LinkedIn ignore a bare "en" — so the mapping is explicit
// rather than derived, and en is en_GB because this site is written in
// British English and spells it that way throughout.
const OG_LOCALE = { en: "en_GB", de: "de_DE", fr: "fr_FR", es: "es_ES" };

/**
 * A meta description, cut from the country's own mandate summary.
 *
 * WHY THIS SOURCE AND NOT A TEMPLATE. Every one of the 70 countries has
 * a `mandate_summary` in all four languages -- reviewed prose that
 * already says what the mandate is, and that the reader sees at the top
 * of the page. A generated sentence ("E-invoicing requirements for X")
 * would be unique-ish, accurate and worthless; this is the sentence a
 * human wrote about that jurisdiction.
 *
 * CUT AT A WORD BOUNDARY, near 155 characters. Search engines truncate
 * around there and a description severed mid-word reads as broken --
 * the ellipsis says the sentence continues on the page, which it does.
 */
export function deepDiveDescription(summary, cap = 155) {
  const text = String(summary || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= cap) return text;
  const cut = text.slice(0, cap);
  const lastSpace = cut.lastIndexOf(" ");
  // A summary with no space inside the cap is not a sentence we should
  // be guessing at; hard-cut rather than return the whole thing.
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\u2014-]+$/, "") + "\u2026";
}

/**
 * `related` is the ninth argument and it is OPTIONAL on purpose.
 *
 * Two runtimes call this — site-worker for the public page and
 * members-worker for the admin preview — and they are deployed
 * separately. An argument the caller must supply would mean a page that
 * throws, or renders a block of `undefined`, in whichever of the two
 * shipped second. Omitted, it renders nothing, which is the same page
 * this function produced yesterday.
 */
export async function renderFullDeepDivePage(countryName, flag, code, region, content, milestones, lang, backLinkHref, extras = {}) {
  // ONE OPTIONS BAG, NOT A NINTH AND TENTH POSITIONAL ARGUMENT. `related`
  // was added positionally yesterday and `headline` would have made three
  // trailing optionals whose order two independently-deployed callers
  // would have to agree on. Both callers live in this repository and were
  // updated in the same commit.
  //
  // EVERY MEMBER IS OPTIONAL AND ABSENCE RENDERS NOTHING. The two runtimes
  // deploy separately, so whichever ships second must not throw or print
  // `undefined` into a country page.
  const { related, headline, guideStrings, euMember } = extras;
  const relatedJurisdictionsHtml = renderRelatedJurisdictions(related, lang, translateRegion(lang, region));
  // t(key, English) against the `guides` subtree, which is where these
  // words are defined and where the methodology page reads them from —
  // so the tile saying ACTIVE and the page explaining ACTIVE cannot drift.
  // With no strings supplied every call falls back to the English written
  // into headline-facts.mjs, which is what the admin preview gets.
  const gt = (key, fallback) => {
    const v = guideStrings && guideStrings[key];
    return typeof v === "string" && v ? v : fallback;
  };
  const headlineHtml = headline ? headlineTiles(headline, gt, "hl-strip") : "";
  const timelineHtml = renderDeepDiveStyleMilestones(milestones, lang);
  const statsHtml = content.stats.map((s) => `<div class="stat"><div class="num display">${escapeHtml(s.stat_value)}</div><div class="lbl">${escapeHtml(s.stat_label)}</div></div>`).join("");
  const fileFormatHtml = content.cards.file_format.map(renderSpecCard).join("") + renderLifecycleCardsForSection(content.lifecycleCards, "file_format");
  const scopeHtml = content.cards.scope_transmission.map(renderSpecCard).join("") + renderLifecycleCardsForSection(content.lifecycleCards, "scope_transmission");
  const relatedHtml = renderPenaltyTable(content.penaltyRows, lang) + content.cards.penalties_related.map(renderRelatedCard).join("");
  const stepsHtml = content.steps.map((s) => `
    <div class="step"><div class="step-num"></div><div class="step-body"><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.description)}</p></div></div>`).join("");
  const portalsHtml = content.portals.map((p) => `<a class="portal-btn" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.label)}</a>`).join("");

  const slug = COUNTRY_DEEP_DIVE_SLUGS[countryName] || "";
  // SELF-REFERENTIAL PER LANGUAGE, since 24 August 2026. This was hard-
  // coded to the bare slug, so /germany?lang=de rendered German, declared
  // inLanguage "de" in its own JSON-LD, and told Google to index the
  // English URL instead — a page arguing against itself inside one
  // response, on all seventy countries in three languages.
  const base = `https://e-invoicingcompliancecorner.com/${slug}`;
  const forLang = (l) => (l === "en" ? base : `${base}?lang=${l}`);
  const canonicalUrl = forLang(lang);
  // English is x-default: it is the bare URL, the one the sitemap lists
  // and the one a crawler without a language preference should land on.
  const hreflang = SUPPORTED_LANGS
    .map((l) => `<link rel="alternate" hreflang="${escapeHtml(l)}" href="${escapeHtml(forLang(l))}">`)
    .concat([`<link rel="alternate" hreflang="x-default" href="${escapeHtml(base)}">`])
    .join("\n");
  const pageTitle = `${translateCountryName(lang, countryName)} E-Invoicing Requirements — The E-Invoicing Compliance Corner`;
  // Translated with the page. The description is cut from the same
  // COALESCEd mandate_summary the reader sees, so a German page gets a
  // German description -- which matters more here than it looks, since
  // the description is the one piece of page text a search engine may
  // show without the reader ever loading the page.
  const description = deepDiveDescription(content.mandate_summary);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><!-- theme:boot -->${themeBootScript()}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
${hreflang}
<!-- Social cards. Until 24 August a shared country page rendered as a
     bare URL with no title, description or site name -- on LinkedIn,
     which is where this site's readers actually pass links to each
     other.

     THE IMAGE IS THE SITE'S, NOT THE COUNTRY'S, and that is a reversal
     of what this comment said for a day. The argument against a generic
     image was that seventy identical cards tell a recipient nothing.
     True, but it compared the wrong two things: the choice is not
     between a generic card and a per-country one, it is between a
     generic card and NO CARD -- a grey rectangle. The title beside it
     already says "Germany E-Invoicing Requirements", so the recipient
     is not relying on the picture to tell them which country it is.

     Per-country artwork remains the upgrade and is on the list. It
     needs a decision about whether the card carries the next dated
     milestone, because that is the difference between seventy images
     generated once and seventy images that go stale.

     summary_large_image now that there is something to show. -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="The E-Invoicing Compliance Corner">
<meta property="og:title" content="${escapeHtml(pageTitle)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:locale" content="${escapeHtml(OG_LOCALE[lang] || OG_LOCALE.en)}">
<meta property="og:image" content="https://e-invoicingcompliancecorner.com/images/og-default.png">
<meta property="og:image:width" content="2400">
<meta property="og:image:height" content="1260">
<meta property="og:image:alt" content="The E-Invoicing Compliance Corner">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(pageTitle)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="https://e-invoicingcompliancecorner.com/images/og-default.png">
${ldScript([
  countryPageLd({
    countryName,
    displayName: translateCountryName(lang, countryName),
    slug: COUNTRY_DEEP_DIVE_SLUGS[countryName] || "",
    lang,
    lastUpdated: content.last_updated,
  }),
  breadcrumbLd([
    { name: "The E-Invoicing Compliance Corner", url: "https://e-invoicingcompliancecorner.com/" },
    { name: region || "Jurisdictions", url: "https://e-invoicingcompliancecorner.com/map" },
    { name: translateCountryName(lang, countryName),
      url: `https://e-invoicingcompliancecorner.com/${COUNTRY_DEEP_DIVE_SLUGS[countryName] || ""}` },
  ]),
])}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* palette:start */
  :root{
    --ink:#0f1a2b;
    --ink-2:#152238;
    --ink-3:#1c2c48;
    --line:#2b3c5a;
    --text-lo:#f2f0e8;
    --muted:#93a3c0;
    --paper:#efe9db;
    --paper-2:#e4dcc6;
    --paper-line:#c9bd9e;
    --card-ink:#241d10;
    --card-key:#6b5f3f;
    --accent:#c98a3a;
    --live:#3f7d5c;
    --live-dim:#274a38;
    --live-ink:#bfe6cf;
    --soon:#c98a3a;
    --soon-dim:#6e4c22;
    --soon-ink:#ffe0b3;
    --stamp:#b5432f;
    --stamp-dim:#7c3628;
    --stamp-ink:#eec4ba;
    --upcoming:#6b7a95;
    --upcoming-dim:#3a4864;
    --upcoming-ink:#dbe2ee;
    --neutral-dim:#3a4864;
    --neutral-ink:#c3cddd;
    --nomandate:#8a5a75;
    --nomandate-dim:#4a2f3d;
    --nomandate-ink:#f0d6e6;
    --tracked:#4a5568;
    --tracked-dim:#2c333d;
    --tracked-ink:#c7ccd3;
    --on-stamp:#f2f0e8;
    --on-soon:#1a1207;
    --flap-ink:#f2f0e8;
    --flap-alert:#e88a76;
    --sidebar:#152238;
    --sidebar-ink:#f2f0e8;
    --sidebar-muted:#93a3c0;
    --sidebar-accent:#c98a3a;
    --sidebar-line:#2b3c5a;
    --nav:#b5432f;
    --nav-ink:#f2f0e8;
    --radius:10px;
  }
  :root[data-eicc-theme="tradeshift"]{
    --ink:#f9f9f9;
    --ink-2:#ffffff;
    --ink-3:#f0f0f0;
    --line:#e3e3e3;
    --text-lo:#1e1e1e;
    --muted:#5c5c5c;
    --paper:#ffffff;
    --paper-2:#f9f9f9;
    --paper-line:#e3e3e3;
    --card-ink:#1e1e1e;
    --card-key:#5c5c5c;
    --accent:#0a37f0;
    --live:#0d8162;
    --live-dim:#e2faf2;
    --live-ink:#0b5c45;
    --soon:#a36416;
    --soon-dim:#fdefdd;
    --soon-ink:#7a4a10;
    --stamp:#bf263c;
    --stamp-dim:#fde8eb;
    --stamp-ink:#8f1c2d;
    --upcoming:#007c96;
    --upcoming-dim:#e2f4f9;
    --upcoming-ink:#0b5c6e;
    --neutral-dim:#f0f0f0;
    --neutral-ink:#5c5c5c;
    --nomandate:#8a5a75;
    --nomandate-dim:#f6ecf2;
    --nomandate-ink:#6b4159;
    --tracked:#4a5568;
    --tracked-dim:#eef0f3;
    --tracked-ink:#3a4351;
    --on-stamp:#ffffff;
    --on-soon:#ffffff;
    --flap-ink:#1e1e1e;
    --flap-alert:#8f1c2d;
    --sidebar:#242dc2;
    --sidebar-ink:#ffffff;
    --sidebar-muted:#c7ccf5;
    --sidebar-accent:#ffd9a3;
    --sidebar-line:#4a52d4;
    --nav:#242dc2;
    --nav-ink:#ffffff;
    --radius:10px;
  }
  /* palette:end */
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
  /* SEPARATE CARDS, NOT ONE DIVIDED SLAB — changed 25 August 2026.
     The old strip was a single bordered block whose tiles were grid
     tracks sharing a 1px gap over a background, so each tile's width was
     the container divided by however many tiles that country happened to
     have. That was tolerable when every country had five. After the
     deduplication it is not: Cyprus keeps two and got 434px tiles holding
     the word "2x", while Azerbaijan's five sat at 173px — the same
     furniture at two and a half times the size, page to page.
     As flex items with a max width they stay the same size everywhere and
     simply wrap. It also settles an inconsistency the headline strip
     introduced directly above: that one is separate rounded cards, and
     these are now the same object rather than a different one. */
  .stat-strip{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:36px;}
  .stat-strip .stat{background:var(--ink-2); border:1px solid var(--line);
    border-radius:var(--radius); padding:14px 16px;
    flex:1 1 190px; max-width:280px; min-width:0;}
  .stat-strip .stat .num{font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:22px; line-height:1.15;}
  .stat-strip .stat .lbl{font-size:10.8px; color:var(--muted); text-transform:uppercase; letter-spacing:0.07em; margin-top:5px;}
  .status-banner{background:var(--soon-dim); border:1px solid var(--soon); color:var(--soon-ink); border-radius:var(--radius); padding:14px 18px; margin-bottom:32px; font-size:13.3px; display:flex; gap:12px; align-items:flex-start;}
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
  .rbadge.inforce{background:var(--live-dim); color:var(--live-ink);}
  .rbadge.upcoming{background:var(--upcoming-dim); color:var(--upcoming-ink);}
  .rcard-title{font-weight:600; margin-bottom:4px;}
  .rcard-desc{color:#4a4030; font-size:13.5px; margin:0;}
  /* TWO CARDS TO A ROW, AND THE KEY ABOVE ITS VALUE.
     Dan, 28 August 2026: "The File format & data specification is getting
     very long. See poland and malaysia... Is it better to have two boxes,
     rather than three in the row, and widening the box so text is not
     wrapped as much?"

     Measured rather than judged, across ten countries at 1440px, counting
     rendered line boxes with Range.getClientRects() -- the real wrap after
     the real font loaded, not a characters-per-line estimate:

                                    lines  worst value  values > 5 lines
       three up, key beside value     660     15 lines         42     <- shipped
       two up, key beside value       416      8 lines         21
       three up, key above value      367      7 lines         16
       TWO UP, KEY ABOVE VALUE        256      4 lines          0     <- this

     So two columns is right and is half the answer. The other half is that
     a 269px card spent 122px of itself on the key column and right-aligned
     the value into what was left, and 88% of section-02 row values are
     longer than that ribbon holds on one line. Widening the card alone
     still leaves Poland with an eight-line value.

     THIS IS THE THIRD TIME THIS FILE'S SIBLINGS HAVE LEARNED IT. Look
     twenty lines down at .related-row: "Stacked rather than the spec-card's
     two columns: penalty rows carry sentences, not values, and a
     right-aligned 58% column breaks them into ribbons." The compliance
     guide's .kv .rows learned it a third way, with a fixed left key column.
     Section 02 and 03 were the only key/value rows on the site still
     ribboning, and half a fix is how the second half survives.

     A conditional shape -- inline for short values, stacked for long ones
     -- measured slightly shorter still and was rejected on measurement:
     45% of the corpus's 468 cards mix short and long rows, so nearly half
     of them would render two different row shapes inside one card. That is
     the exact inconsistency the framework exists to stop.

     On a phone this is the ONLY half that helps. At 390px the grid is
     already one column, so the column count changes nothing; the key
     column was still eating 170px of a 351px card, and Thailand's worst
     value ran to nine lines. Stacking takes it to five.

     300px, not 260px: the .wrap content box is 836px (max-width 980 is
     border-box and the 5vw padding comes out of it), so three columns fit
     while the floor is <= 269px and two while it is <= 411px. The
     shorthand columns:300px 2 reads as "columns at least 300px wide, never
     more than two", so the page still drops to one column on a phone by
     itself. No media query, because this file has none -- the page is
     fluid throughout. (And no backticks in this comment: they end the
     template literal this stylesheet lives inside, which is a trap already
     recorded for shared/roi-render.mjs and which I have just walked into.)

     A COLUMN FLOW, NOT GRID ROWS. Dan, 28 August 2026, on the deployed
     two-up layout: "the poland file format section now includes gaps,
     which could be filled with boxes moving up."

     He is right, and the first version of this comment argued the other
     way -- it called ragged bottoms "the cheaper cost" and left it there.
     That was a judgement where a measurement was available. Two kinds of
     empty space had been scored as one, and they are not the same thing: a
     hole with content BELOW it reads as broken, and a section ending
     unevenly does not. Separated, across all 76 countries, sections 02
     and 03, measured in the browser:

                    holes with content below   ragged bottom
       grid rows            4,763px               23,198px
       column flow             39px               25,211px

     So the flow removes 4,724px of the space that reads as broken and pays
     2,013px into the space that does not. align-items:start had removed
     the empty BOXES; only the flow removes the empty SPACE.

     Two other packings were measured and rejected. CSS masonry, in all
     three of its spellings, is unsupported by the Chromium the suite runs
     against (141), so it could not be tested even if it rendered. A
     shortest-column fill computed in the renderer scores better than both
     -- no holes, and a BETTER bottom edge than today -- and a height
     estimated from the text alone picks the same column as perfect
     knowledge in 97% of sections, at a cost of 86px across the corpus. It
     was still rejected: it puts a calibrated pixel model of this
     stylesheet inside the renderer, where a later font change degrades it
     silently, in exchange for 0.6% of a page's whitespace. The measurement
     is in the commit message if that trade ever looks different.

     break-inside:avoid is what keeps a card whole across a column
     boundary; measured, no card in the corpus splits. Section 05's
     .related-grid is deliberately NOT changed: its cards stretch to a
     shared height, which is why it has no holes to remove. */
  .spec-grid{columns:300px 2; column-gap:14px;}
  .spec-card{background:var(--paper); color:#241d10; border:1px solid var(--paper-line); border-radius:var(--radius); padding:16px 18px 18px; min-width:0; break-inside:avoid; margin:0 0 14px;}
  .spec-card h3{font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.09em; color:#6b5f3f; margin:0 0 10px; display:flex; align-items:center; gap:8px;}
  .spec-card h3::after{content:""; flex:1; height:1px; background:var(--paper-line);}
  .spec-row{padding:7px 0; border-top:1px dashed var(--paper-line); font-size:13px;}
  .spec-row:first-of-type{border-top:none; padding-top:2px;}
  .spec-row .k{display:block; color:#6b5f3f; font-weight:600; margin-bottom:2px;}
  .spec-row .v{display:block; color:#241d10; min-width:0; overflow-wrap:break-word; word-break:break-word;}
  .spec-card p.body-text{font-size:13px; line-height:1.6; color:#241d10; margin:4px 0 0;}
  .note{font-size:12.6px; color:#5a5138; margin:10px 0 0; padding-top:10px; border-top:1px dashed var(--paper-line); line-height:1.5;}
  .badge-tag{display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:9.5px; text-transform:uppercase; letter-spacing:0.06em; padding:2px 7px; border-radius:4px; margin-left:6px; vertical-align:middle;}
  .badge-tag.confirmed{background:var(--live-dim); color:var(--live-ink);}
  .badge-tag.pending{background:var(--upcoming-dim); color:var(--upcoming-ink);}
  .lifecycle{display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;}
  .lifecycle span{font-family:'IBM Plex Mono',monospace; font-size:11px; background:var(--soon-dim); color:var(--soon-ink); padding:5px 11px; border-radius:14px; white-space:normal; max-width:100%; overflow-wrap:break-word; word-break:break-word; line-height:1.4;}
  .lifecycle span.rej{background:var(--stamp-dim); color:var(--stamp-ink);}
  .lifecycle-list{list-style:none; margin:4px 0 0; padding:0; display:flex; flex-direction:column; gap:6px;}
  .lifecycle-list li{font-size:13px; color:#241d10; padding:6px 10px; background:var(--paper-2); border-radius:6px;}
  .lifecycle-list li.rej{background:var(--stamp-dim); color:var(--stamp-ink);}
  .steps{counter-reset:step; display:flex; flex-direction:column; gap:0;}
  .step{display:flex; gap:16px; padding:16px 0; border-top:1px dashed var(--line);}
  .step:first-child{border-top:none;}
  .step-num{counter-increment:step; flex:0 0 auto; width:30px; height:30px; border-radius:50%; background:var(--soon-dim); color:var(--soon-ink); display:flex; align-items:center; justify-content:center; font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:14px;}
  .step-num::before{content:counter(step);}
  .step-body h4{margin:2px 0 4px; font-size:14.5px;} .step-body p{margin:0; font-size:13.3px; color:var(--muted);}
  .related-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px;}
  .related-card{background:var(--ink-2); border:1px solid var(--line); border-radius:var(--radius); padding:16px 18px;}
  .related-card h4{margin:0 0 6px; font-size:14px;} .related-card p{margin:0; color:var(--muted); font-size:13px;}
  /* Stacked rather than the spec-card's two columns: penalty rows carry
     sentences, not values, and a right-aligned 58% column breaks them
     into ribbons. */
  .related-row{padding:7px 0; border-top:1px dashed var(--line); font-size:13px; color:var(--muted);}
  .related-row:first-of-type{border-top:none; padding-top:2px;}
  .related-row .k{display:block; color:var(--text-lo); font-weight:600; margin-bottom:2px;}
  .related-row .v{display:block; overflow-wrap:break-word;}
  .related-card p.note{margin-top:8px; font-style:italic;}
  .penalty-table{width:100%; border-collapse:collapse; font-size:13px;}
  .penalty-table th, .penalty-table td{text-align:left; padding:9px 10px; border-bottom:1px dashed var(--paper-line);}
  .penalty-table th{font-family:'IBM Plex Mono',monospace; font-size:10.5px; text-transform:uppercase; letter-spacing:0.06em; color:#6b5f3f;}
  .penalty-table td{color:#241d10;}
  .penalty-card{background:var(--paper); color:#241d10; border-radius:var(--radius); border:1px solid var(--paper-line); padding:16px 18px; grid-column:1 / -1;}
  .portal-btn{display:inline-block; background:var(--ink-2); border:1px solid var(--line); border-radius:999px; padding:9px 18px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; text-decoration:none; color:var(--text-lo);}
  /* Related jurisdictions. Chips rather than cards: there can be thirty
     of them in Europe, and thirty cards would be a second page. The
     chip's own colours match .portal-btn, which is the existing pattern
     on this page for "a compact thing you click through". */
  .rj-grid{display:flex; flex-wrap:wrap; gap:9px;}
  .rj-chip{display:inline-flex; align-items:baseline; gap:8px; background:var(--ink-2); border:1px solid var(--line); border-radius:999px; padding:8px 15px; text-decoration:none; color:var(--text-lo); font-size:13px; line-height:1.2;}
  .rj-chip:hover{border-color:var(--soon); color:var(--soon);}
  .rj-flag{font-size:14px;}
  .rj-name{font-weight:500;}
  /* The date is secondary and must never be mistaken for the country.
     inherit on hover so the whole chip lights up as one control. */
  .rj-when{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--muted);}
  .rj-chip:hover .rj-when{color:inherit;}
${HEADLINE_DARK_STYLE}
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
        <!-- "VAT area: EU" WAS HARDCODED HERE and printed on every country
             page on the site, Brazil and Japan included, in English in all
             four languages. Found on 4 September 2026 by reading Angola's
             page the day it was built; nothing else could have caught it,
             because the string was a literal and agreed with itself.
             The segment now appears only where it is true, and is dropped
             rather than negated: "not in the EU VAT area" is not a fact a
             reader of the Japan page needs stated. -->
        <div class="country-region">${escapeHtml(region)} · ${escapeHtml(code)}${
          euMember ? ` · ${escapeHtml(t(lang, "euVatArea"))}` : ""}</div>
      </div>
    </div>
    <div class="country-meta-col">
      <div class="country-meta">${t(lang, "lastUpdatedLabel")}: ${escapeHtml(content.last_updated)}<br>${t(lang, "complianceModelLabel")}: ${escapeHtml(content.compliance_model)}</div>
      <div class="portal-row-header">${portalsHtml}</div>
    </div>
  </div>

  ${content.mandate_summary ? `<div class="status-banner"><span class="icon">${escapeHtml(content.mandate_summary_icon || "ℹ️")}</span><span>${escapeHtml(content.mandate_summary)}</span></div>` : ""}

  ${headlineHtml}
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
${relatedJurisdictionsHtml}
  <footer><p>${escapeHtml(content.footer_disclaimer)}</p></footer>
</div>
</body>
</html>`;
}
