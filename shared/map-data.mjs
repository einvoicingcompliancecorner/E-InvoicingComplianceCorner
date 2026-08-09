// ================================================================
// SHARED MAP-DATA MODULE
// ================================================================
// Backs "The Map" (/map) — the choropleth view of every tracked
// jurisdiction's mandate status. Two pieces of logic live here:
//
//   1. computeCountryMapStatus(milestones, todayISO) — derives one of
//      five statuses (inforce / upcoming / b2gonly / nomandate /
//      tracked) for a country from its raw milestone rows (date,
//      mandate_scope, confidence). This is the live equivalent of the
//      hand-curated COUNTRIES status values in the original map
//      mock-up (eicc-map-mockup-v2.html) — every value below was
//      cross-checked against that mock-up's verified data and matches
//      exactly, with one deliberate exception documented inline (the
//      United States).
//
//   2. getMapCountries(db, lang) — the D1 query that builds the full
//      per-country dataset the map page renders: translated name (from
//      country_translations — no separate hardcoded translation
//      dictionary needed, unlike the mock-up's COUNTRY_TRANSLATIONS),
//      slug, region, flag, and the computed status above.
//
// Only countries with a slug are included (matches every other D1-
// rendered surface's "slug IS NOT NULL" convention — see the standing
// warning on the countries table in schema.sql) — this is what
// excludes the European Union row, which isn't a real country on a
// choropleth map anyway.
// ================================================================

import { deriveFlagFromCode } from "./deep-dive-render.mjs";

// ----------------------------------------------------------------
// Status computation
// ----------------------------------------------------------------
// Precedence, in order — the first branch that matches wins:
//
//   1. inforce   — any 'b2b' milestone already past (date <= today).
//   2. upcoming  — any 'b2b' milestone still future AND *firm*
//                  (confidence !== 'expected').
//   3. b2gonly   — any 'b2g_only' milestone already past. Checked
//                  here, between the firm- and tentative-upcoming
//                  branches, specifically so a country with a real
//                  past B2G fact (Luxembourg) but only draft/'expected'
//                  future B2B milestones reports the real B2G fact
//                  rather than an unconfirmed "upcoming".
//   4. upcoming  — any 'b2b' milestone still future with confidence
//                  'expected' (a fallback for countries like Ireland
//                  or Spain that have no B2G fact to report instead —
//                  demoting them to "no mandate" would undersell real,
//                  if not-yet-firm, regulatory movement).
//   5. nomandate — the country has on_tracker milestones, but none of
//                  them established any of the above (e.g. the United
//                  States: a discretionary B2G procurement directive
//                  and a voluntary industry network, neither a real
//                  mandate).
//   6. tracked   — the country has no on_tracker milestones at all yet
//                  (a very recently added deep-dive-only country).
//
// `milestones` must be pre-filtered to on_tracker = 1 rows only (see
// getMapCountries below) — NOT every milestone row for the country.
// Deep-dive-timeline-only "anchor" entries (on_tracker = 0: historical
// context, superseded steps) vastly outnumber on_tracker rows for most
// countries and are not individually reviewed for mandate_scope
// accuracy the way on_tracker rows are (migration 255's backfill only
// covers on_tracker milestones, plus a handful of incidental on_tracker
// = 0 rows it happened to touch) — feeding them all in here left every
// unclassified anchor at the mandate_scope column's 'b2b' schema
// default, which silently forced nearly every country to "inforce"
// regardless of its real on_tracker status (caught by replaying 254/255
// against a full local copy of the migration chain and diffing against
// the map mock-up's independently-verified statuses — see PROGRESS.md).
// on_tracker is already exactly the right boundary: per
// ADDING-A-COUNTRY.md, "milestones that should appear on the main
// board get on_tracker = 1; deep-dive-timeline-only context entries
// stay 0" — the map's status is a board-level summary, so it should
// read the same on_tracker population the board itself does.
export function computeCountryMapStatus(milestones, todayISO) {
  const hasInforce = milestones.some((m) => m.mandate_scope === "b2b" && m.date <= todayISO);
  if (hasInforce) return "inforce";

  const firmUpcoming = milestones.some(
    (m) => m.mandate_scope === "b2b" && m.date > todayISO && m.confidence !== "expected"
  );
  if (firmUpcoming) return "upcoming";

  const hasB2G = milestones.some((m) => m.mandate_scope === "b2g_only" && m.date <= todayISO);
  if (hasB2G) return "b2gonly";

  const tentativeUpcoming = milestones.some(
    (m) => m.mandate_scope === "b2b" && m.date > todayISO && m.confidence === "expected"
  );
  if (tentativeUpcoming) return "upcoming";

  if (milestones.length > 0) return "nomandate";
  return "tracked";
}

// A handful of countries' display name doesn't match their name in the
// world-atlas topojson dataset (countries-50m.json) — see map-panel.js's
// own header comment for the topoName concept. Kept here, next to the
// status logic, since both feed the same getMapCountries() output the
// map page consumes; map-panel.js itself has no D1 access and can't
// derive this.
const TOPO_NAME_OVERRIDES = {
  "United States": "United States of America",
  "Czech Republic": "Czechia",
  "Dominican Republic": "Dominican Rep.",
};

// Countries whose real shape is too small to reliably render/hover/
// click at the map's zoom level get a fallback [lon, lat] marker
// position instead of relying on the topology's own (tiny or, for a
// handful of very small states, entirely absent) feature geometry.
// Only Singapore needs this today; add an entry here rather than in
// map-panel.js if the topology has no feature at all for a future
// very small addition.
const MARKER_LONLAT_OVERRIDES = {
  Singapore: [103.82, 1.35],
};

// ----------------------------------------------------------------
// Recent news (the in-page tracker panel's sidebar, replacing the
// country list there -- see getMapCountries' own header comment and
// map-panel.js's buildSidebar()/isEmbedded() for why: the tracker's
// permanent left-hand sidebar already lists every country and already
// links to its deep dive, so repeating that list inside the map's own
// sidebar is redundant there. The standalone /map page has no such
// left sidebar, so it keeps the country list -- this function is only
// consumed in embedded (panel) mode.
// ----------------------------------------------------------------

// Mirrors members-worker/src/index.js's own deriveTitleFromHtml() --
// duplicated rather than imported, since story_translations always
// has a title for a story's own language in practice, and this is a
// defensive fallback only (a story published without an 'en'
// translation row, or requested in a language it has no row for).
function deriveStoryTitle(html) {
  const match = /<h3>(?:[^<a-zA-Z]*)([^<]+)<\/h3>/.exec(html || "");
  return match ? match[1].trim() : "Untitled";
}

// `limit` here bounds the whole pool fetched once per page load, not
// how many are shown at a time -- map-panel.js's buildRecentNewsList()
// filters this pool down to whichever countries are in the active map
// region (a story with no country match anywhere in the pool for the
// currently selected region just doesn't appear), so the pool needs to
// be large enough to still have several matches per region, not just
// per site-wide "recent" cutoff. 40 comfortably covers a few weeks of
// publishing across all 4 regions at this site's current pace.
export async function getRecentStories(db, lang, limit = 40) {
  const { results: storyRows } = await db.prepare(`
    SELECT s.id, s.date, s.html_en,
           COALESCE(st.title, NULL) as title_translated,
           COALESCE(st.html, s.html_en) as html
    FROM stories s
    LEFT JOIN story_translations st ON st.story_id = s.id AND st.lang = ?
    WHERE s.published = 1
    ORDER BY s.date DESC
    LIMIT ?
  `).bind(lang, limit).all();

  if (!storyRows.length) return [];

  // One story can cover several countries (a handful of genuinely
  // cross-cutting stories do -- e.g. a shared ViDA milestone) -- fetched
  // separately and grouped, rather than a join that would duplicate
  // story rows per country. Mirrors members-worker's
  // getStoriesWithCountries() query shape.
  const { results: countryRows } = await db.prepare(`
    SELECT sc.story_id, c.code, c.name_en, c.region, COALESCE(ct.display_name, c.name_en) as name
    FROM story_countries sc
    JOIN countries c ON c.id = sc.country_id
    LEFT JOIN country_translations ct ON ct.country_id = c.id AND ct.lang = ?
  `).bind(lang).all();

  const countriesByStory = new Map();
  for (const row of countryRows) {
    if (!countriesByStory.has(row.story_id)) countriesByStory.set(row.story_id, []);
    countriesByStory.get(row.story_id).push({
      name: row.name,
      nameEn: row.name_en,
      region: row.region,
      flag: deriveFlagFromCode(row.code),
    });
  }

  return storyRows.map((s) => {
    const countries = countriesByStory.get(s.id) || [];
    return {
      id: s.id,
      date: s.date,
      title: s.title_translated || deriveStoryTitle(s.html),
      countries,
      // A story with no linked countries at all (rare) has no region
      // to be filtered under, and so simply won't surface in any of
      // the region-filtered views -- see buildRecentNewsList().
      regions: [...new Set(countries.map((c) => c.region))],
    };
  });
}

export async function getMapCountries(db, lang) {
  const { results: countryRows } = await db.prepare(`
    SELECT c.id, c.name_en, c.code, c.region, c.slug, ct.display_name
    FROM countries c
    LEFT JOIN country_translations ct ON ct.country_id = c.id AND ct.lang = ?
    WHERE c.slug IS NOT NULL
    ORDER BY c.name_en
  `).bind(lang).all();

  const { results: milestoneRows } = await db.prepare(`
    SELECT country_id, date, mandate_scope, confidence FROM milestones WHERE on_tracker = 1
  `).all();

  const byCountry = new Map();
  for (const m of milestoneRows) {
    if (!byCountry.has(m.country_id)) byCountry.set(m.country_id, []);
    byCountry.get(m.country_id).push(m);
  }

  const todayISO = new Date().toISOString().slice(0, 10);

  return countryRows.map((c) => ({
    name: c.display_name || c.name_en,
    nameEn: c.name_en,
    slug: c.slug,
    region: c.region,
    code: c.code,
    flag: deriveFlagFromCode(c.code),
    topoName: TOPO_NAME_OVERRIDES[c.name_en] || c.name_en,
    markerLonLat: MARKER_LONLAT_OVERRIDES[c.name_en] || null,
    status: computeCountryMapStatus(byCountry.get(c.id) || [], todayISO),
  }));
}

export const REGION_ORDER = ["Europe", "Middle East / Africa", "Asia-Pacific", "Americas"];

// One hand-picked lon/lat bounding box per region — see map-panel.js's
// calibrateProjection() header comment for why these are hand-sized
// rather than derived from real feature geometry (overseas exclaves
// blow a feature-derived bbox out to nearly a whole hemisphere).
//
// The Middle East / Africa box was widened west (22 -> 0 deg E, for
// Nigeria's ~2.7 deg E west edge) and south (14 -> -6 deg S, for
// Kenya's ~-4.9 deg S extent) when the region was renamed from
// "Middle East / North Africa" and gained its first Sub-Saharan
// countries (7 Aug 2026, migration 451).
//
// Europe's east edge was widened from 35 to 46 deg E when Turkey joined
// this region (3 August 2026) -- Turkey's own extent runs to roughly
// 45 deg E (Igdir Province), which the original box would have clipped.
export const REGION_BOUNDS = {
  "Europe": [[-11, 34], [46, 34], [46, 71.5], [-11, 71.5]],
  "Middle East / Africa": [[0, -6], [58, -6], [58, 34], [0, 34]],
  "Asia-Pacific": [[65, -48], [179, -48], [179, 55], [65, 55]],
  "Americas": [[-173, -57], [-33, -57], [-33, 75], [-173, 75]],
};

// Static UI copy for the map page, one dict per supported language —
// same pattern as site-worker/src/index.js's SOURCES_UI. Country
// names and statuses are D1-sourced (getMapCountries above); this is
// just page chrome.
export const MAP_UI = {
  en: {
    langName: "English",
    eyebrow: "Resources · The Map",
    titleHtml: "The Compliance Map",
    subtitle: "A visual front door onto every jurisdiction this site tracks, one region at a time — click a country for its full deep dive, or use the list for anywhere.",
    backToTracker: "← Back to the tracker",
    allJurisdictions: "All jurisdictions",
    recentNews: "Latest updates",
    noRecentNews: "No recent updates yet.",
    modalLoading: "Loading…",
    modalOfficialSource: "Official source",
    jurisdictionsOf: "{count} of {total} tracked jurisdictions",
    tooltipCta: "Click for the full deep dive →",
    footerText: "Every country here links through to its full deep dive. For the underlying research as it's published — new mandates, deadline changes, source-of-truth updates — it's all in the newsletter archive.",
    archiveBtn: "Browse the newsletter archive →",
    subscribeBtn: "Subscribe to the newsletter →",
    regionNames: { "Europe": "Europe", "Middle East / Africa": "Middle East / Africa", "Asia-Pacific": "Asia-Pacific", "Americas": "Americas" },
    status: { inforce: "In force (B2B)", upcoming: "Upcoming (B2B)", b2gonly: "B2G only — no B2B mandate", nomandate: "No mandate confirmed", tracked: "Tracked — no data yet" },
    legend: [
      { key: "inforce", text: "In force — real, binding B2B mandate today" },
      { key: "upcoming", text: "Upcoming — B2B mandate confirmed, not yet binding" },
      { key: "b2gonly", text: "B2G only — government mandate real, no B2B mandate" },
      { key: "nomandate", text: "No mandate confirmed" },
      { key: "tracked", text: "Tracked — no data yet" },
    ],
    regionNotes: {
      "Europe": "Small jurisdictions (Luxembourg, Cyprus) get an enlarged marker and leader line — their real shape is too small to reliably hover/click at this zoom otherwise.",
      "Middle East / Africa": "Now spanning two continents — from the Gulf's clearance regimes to Sub-Saharan Africa's first mandates in Kenya and Nigeria.",
      "Asia-Pacific": "Spans Malaysia to New Zealand — mostly ocean between them by real geography, not a rendering gap.",
      "Americas": "Spans the Canadian Arctic to southern Chile — the map is capped at 75°N (Canada's true extent reaches ~83°N via uninhabited Arctic islands) to keep the rest of the region readable.",
    },
  },
  es: {
    langName: "Español",
    eyebrow: "Recursos · El Mapa",
    titleHtml: "El Mapa de Cumplimiento",
    subtitle: "Una puerta de entrada visual a todas las jurisdicciones que rastrea este sitio, una región a la vez — haz clic en un país para ver su análisis completo, o usa la lista para cualquier otro lugar.",
    backToTracker: "← Volver al panel de seguimiento",
    allJurisdictions: "Todas las jurisdicciones",
    recentNews: "Últimas actualizaciones",
    noRecentNews: "Aún no hay actualizaciones recientes.",
    modalLoading: "Cargando…",
    modalOfficialSource: "Fuente oficial",
    jurisdictionsOf: "{count} de {total} jurisdicciones rastreadas",
    tooltipCta: "Haz clic para ver el análisis completo →",
    footerText: "Cada país aquí enlaza a su análisis completo. Para la investigación subyacente a medida que se publica — nuevos mandatos, cambios de plazos, actualizaciones de fuentes — todo está en el archivo del boletín.",
    archiveBtn: "Ver el archivo del boletín →",
    subscribeBtn: "Suscríbete al boletín →",
    regionNames: { "Europe": "Europa", "Middle East / Africa": "Oriente Medio / África", "Asia-Pacific": "Asia-Pacífico", "Americas": "América" },
    status: { inforce: "Vigente (B2B)", upcoming: "Próximo (B2B)", b2gonly: "Solo B2G — sin mandato B2B", nomandate: "Sin mandato confirmado", tracked: "Rastreado — sin datos aún" },
    legend: [
      { key: "inforce", text: "Vigente — mandato B2B real y vinculante hoy" },
      { key: "upcoming", text: "Próximo — mandato B2B confirmado, aún no vigente" },
      { key: "b2gonly", text: "Solo B2G — mandato gubernamental real, sin mandato B2B" },
      { key: "nomandate", text: "Sin mandato confirmado" },
      { key: "tracked", text: "Rastreado — sin datos aún" },
    ],
    regionNotes: {
      "Europe": "Las jurisdicciones pequeñas (Luxemburgo, Chipre) reciben un marcador ampliado y una línea guía — su forma real es demasiado pequeña para pasar el cursor o hacer clic de forma fiable a este nivel de zoom.",
      "Middle East / Africa": "Ahora abarca dos continentes — desde los regímenes de clearance del Golfo hasta los primeros mandatos subsaharianos en Kenia y Nigeria.",
      "Asia-Pacific": "Abarca desde Malasia hasta Nueva Zelanda — mayormente océano entre ambos por geografía real, no un error de renderizado.",
      "Americas": "Abarca desde el Ártico canadiense hasta el sur de Chile — el mapa se limita a 75°N (la extensión real de Canadá llega a ~83°N vía islas árticas deshabitadas) para mantener legible el resto de la región.",
    },
  },
  de: {
    langName: "Deutsch",
    eyebrow: "Ressourcen · Die Karte",
    titleHtml: "Die Compliance-Karte",
    subtitle: "Ein visueller Einstiegspunkt zu allen von dieser Website erfassten Ländern, jeweils eine Region auf einmal — klicken Sie auf ein Land für die vollständige Länderanalyse, oder nutzen Sie die Liste für alle anderen.",
    backToTracker: "← Zurück zur Übersicht",
    allJurisdictions: "Alle Länder",
    recentNews: "Neueste Updates",
    noRecentNews: "Noch keine aktuellen Updates.",
    modalLoading: "Wird geladen…",
    modalOfficialSource: "Offizielle Quelle",
    jurisdictionsOf: "{count} von {total} erfassten Ländern",
    tooltipCta: "Klicken für die vollständige Länderanalyse →",
    footerText: "Jedes Land hier verlinkt zu seiner vollständigen Länderanalyse. Für die zugrunde liegende Recherche, sobald sie veröffentlicht wird — neue Mandate, Fristenänderungen, aktualisierte Quellen — alles im Newsletter-Archiv.",
    archiveBtn: "Newsletter-Archiv durchsuchen →",
    subscribeBtn: "Newsletter abonnieren →",
    regionNames: { "Europe": "Europa", "Middle East / Africa": "Naher Osten / Afrika", "Asia-Pacific": "Asien-Pazifik", "Americas": "Amerika" },
    status: { inforce: "In Kraft (B2B)", upcoming: "Bevorstehend (B2B)", b2gonly: "Nur B2G — kein B2B-Mandat", nomandate: "Kein Mandat bestätigt", tracked: "Erfasst — noch keine Daten" },
    legend: [
      { key: "inforce", text: "In Kraft — heute geltendes, verbindliches B2B-Mandat" },
      { key: "upcoming", text: "Bevorstehend — B2B-Mandat bestätigt, noch nicht verbindlich" },
      { key: "b2gonly", text: "Nur B2G — reales Regierungsmandat, kein B2B-Mandat" },
      { key: "nomandate", text: "Kein Mandat bestätigt" },
      { key: "tracked", text: "Erfasst — noch keine Daten" },
    ],
    regionNotes: {
      "Europe": "Kleine Länder (Luxemburg, Zypern) erhalten eine vergrößerte Markierung und eine Hilfslinie — ihre tatsächliche Form ist bei diesem Zoom sonst zu klein, um zuverlässig zu klicken oder zu hovern.",
      "Middle East / Africa": "Umfasst jetzt zwei Kontinente — von den Clearance-Regimen am Golf bis zu den ersten Mandaten Subsahara-Afrikas in Kenia und Nigeria.",
      "Asia-Pacific": "Erstreckt sich von Malaysia bis Neuseeland — dazwischen größtenteils Ozean, bedingt durch die reale Geografie, kein Darstellungsfehler.",
      "Americas": "Erstreckt sich von der kanadischen Arktis bis Südchile — die Karte ist auf 75°N begrenzt (Kanadas tatsächliche Ausdehnung reicht über unbewohnte arktische Inseln bis ~83°N), um den Rest der Region lesbar zu halten.",
    },
  },
  fr: {
    langName: "Français",
    eyebrow: "Ressources · La Carte",
    titleHtml: "La Carte de Conformité",
    subtitle: "Une porte d'entrée visuelle vers toutes les juridictions suivies par ce site, une région à la fois — cliquez sur un pays pour son analyse complète, ou utilisez la liste pour n'importe où ailleurs.",
    backToTracker: "← Retour au suivi",
    allJurisdictions: "Toutes les juridictions",
    recentNews: "Dernières mises à jour",
    noRecentNews: "Aucune mise à jour récente pour le moment.",
    modalLoading: "Chargement…",
    modalOfficialSource: "Source officielle",
    jurisdictionsOf: "{count} sur {total} juridictions suivies",
    tooltipCta: "Cliquez pour l'analyse complète →",
    footerText: "Chaque pays ici renvoie vers son analyse complète. Pour la recherche sous-jacente au fur et à mesure de sa publication — nouveaux mandats, changements d'échéances, mises à jour des sources — tout est dans les archives de la newsletter.",
    archiveBtn: "Parcourir les archives de la newsletter →",
    subscribeBtn: "S'abonner à la newsletter →",
    regionNames: { "Europe": "Europe", "Middle East / Africa": "Moyen-Orient / Afrique", "Asia-Pacific": "Asie-Pacifique", "Americas": "Amériques" },
    status: { inforce: "En vigueur (B2B)", upcoming: "À venir (B2B)", b2gonly: "B2G uniquement — aucun mandat B2B", nomandate: "Aucun mandat confirmé", tracked: "Suivi — pas encore de données" },
    legend: [
      { key: "inforce", text: "En vigueur — mandat B2B réel et contraignant aujourd'hui" },
      { key: "upcoming", text: "À venir — mandat B2B confirmé, pas encore contraignant" },
      { key: "b2gonly", text: "B2G uniquement — mandat gouvernemental réel, aucun mandat B2B" },
      { key: "nomandate", text: "Aucun mandat confirmé" },
      { key: "tracked", text: "Suivi — pas encore de données" },
    ],
    regionNotes: {
      "Europe": "Les petites juridictions (Luxembourg, Chypre) reçoivent un marqueur agrandi et une ligne de rappel — leur forme réelle est trop petite pour être survolée ou cliquée de manière fiable à ce niveau de zoom.",
      "Middle East / Africa": "Couvre désormais deux continents — des régimes de clearance du Golfe aux premiers mandats d'Afrique subsaharienne au Kenya et au Nigéria.",
      "Asia-Pacific": "S'étend de la Malaisie à la Nouvelle-Zélande — essentiellement de l'océan entre les deux, une réalité géographique et non un problème de rendu.",
      "Americas": "S'étend de l'Arctique canadien au sud du Chili — la carte est plafonnée à 75°N (l'étendue réelle du Canada atteint environ 83°N via des îles arctiques inhabitées) afin de garder le reste de la région lisible.",
    },
  },
};
