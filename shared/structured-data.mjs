// structured-data.mjs — the JSON-LD this site publishes about itself.
//
// Added 22 August 2026, after an outside strategy review pointed out that
// a site whose entire asset is structured regulatory data was publishing
// none of it in a machine-readable form. It was right: there were zero
// files containing application/ld+json.
//
// ---- THE RULE THIS FILE IS WRITTEN AGAINST ---------------------------
//
// MARKUP MAY ONLY SAY WHAT THE PAGE SAYS. Structured data is the easiest
// place on a website to make a claim nobody checks, and the temptation is
// the whole reason it gets abused: aggregateRating with no ratings,
// FAQPage with no questions, datePublished invented because the field
// wanted filling. Every value below comes from the same D1 row the
// visible page renders from, and where there is no honest value the
// property is omitted rather than guessed.
//
// TWO THINGS ARE DELIBERATELY ABSENT.
//
// FAQPage. The obvious play for a compliance site is to mark up "Is
// e-invoicing mandatory in Germany?" as an FAQ and harvest the rich
// result. Our country pages are not written as questions and answers --
// they are cards and a timeline -- and FAQ markup that does not match
// visible on-page Q&A is exactly what search engines penalise. If the
// deep dives are ever rewritten around questions, this becomes honest and
// can be added then.
//
// aggregateRating, review, offers. Nothing on this site is rated, sold or
// reviewed.
//
// ---- WHAT IS HERE ----------------------------------------------------
//
// Organization and WebSite once, on the tracker. A Dataset on /sources,
// which is defensible because there is a real machine-readable
// distribution behind it (/map-data.json) rather than a claim that the
// HTML is a dataset. WebPage plus BreadcrumbList on the country pages,
// carrying the real last_updated date. Article on the insights pieces,
// with the published date they already display.
//
// publishingPrinciples points at /methodology. That property exists for
// exactly this -- a statement of the editorial standards a publisher
// holds itself to -- and it is the machine-readable half of the page Dan
// asked for the same day.

const ORIGIN = "https://e-invoicingcompliancecorner.com";

/**
 * Serialise for embedding in a <script type="application/ld+json"> block.
 *
 * `</` IS THE ONLY DANGEROUS SEQUENCE, and it is dangerous everywhere: a
 * country name, a card title or a source description containing "</script"
 * would close the block early and drop the rest of the page's markup into
 * the document as text. JSON.stringify does not escape it because it is
 * valid JSON; the HTML parser does not care that it is valid JSON.
 *
 * The other two are belt and braces against a document.write context.
 */
export function ldJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Wrap one or more nodes in the script tag, or "" for nothing to say. */
export function ldScript(nodes) {
  const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
  if (!list.length) return "";
  const payload = list.length === 1 ? list[0] : { "@context": "https://schema.org", "@graph": list };
  return `<script type="application/ld+json">${ldJson(payload)}</script>`;
}

/**
 * The publisher. Referenced by @id from everything else rather than
 * repeated, so a change to the name or the principles URL moves in one
 * place and every page follows.
 */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${ORIGIN}/#organization`,
    name: "The E-Invoicing Compliance Corner",
    url: ORIGIN,
    description: "Independent tracking of e-invoicing mandates, legislation and "
      + "deadlines across global jurisdictions.",
    // THE MACHINE-READABLE HALF OF /methodology. schema.org defines this
    // as the statement of editorial principles a publisher works to,
    // which is precisely what that page is.
    publishingPrinciples: `${ORIGIN}/methodology`,
    founder: { "@id": `${ORIGIN}/#founder` },
  };
}

/**
 * The founder, as an addressable entity rather than an inline blob.
 *
 * WHY IT GAINED AN @id (24 August 2026). It was nested inside
 * Organization, which means the same person described on the Article
 * nodes would have been a SECOND, unrelated Person to a consumer. One
 * node, referenced from both, says they are the same human — which is
 * the entire point of using @id.
 *
 * THE PHOTO IS REAL AND THE LOGO IS NOT. images/dan-young.png exists and
 * is him, so it is asserted here. The Organization has no logo asset at
 * all, and inventing a URL for one — or pointing `logo` at a portrait —
 * would be a structured-data claim this site cannot support. Left off
 * until there is a logo to name.
 */
export function personLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${ORIGIN}/#founder`,
    name: "Dan Young",
    description: "25 years in financial software transformation, focused on "
      + "invoice digitisation and Accounts Payable automation.",
    image: `${ORIGIN}/images/dan-young.png`,
    // The one profile this site actually links to, from the tracker's
    // own footer. sameAs belongs on the PERSON, not the Organization:
    // it is his profile, not the publication's, and claiming otherwise
    // is the kind of small overstatement this site does not make.
    sameAs: ["https://www.linkedin.com/in/danielyoung76/"],
    worksFor: { "@id": `${ORIGIN}/#organization` },
  };
}

export function webSiteLd(lang = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${ORIGIN}/#website`,
    name: "The E-Invoicing Compliance Corner",
    url: ORIGIN,
    inLanguage: lang,
    publisher: { "@id": `${ORIGIN}/#organization` },
  };
}

/**
 * The tracker's mandate data as a Dataset.
 *
 * HONEST BECAUSE THERE IS A DISTRIBUTION. A Dataset node whose only
 * content is a web page is a claim that a page is data; this one points
 * at /map-data.json, which is a real endpoint serving the per-country
 * status array the map itself consumes. If that endpoint is ever removed,
 * remove the distribution rather than leaving it pointing at a 404.
 *
 * `countryCount` is passed in from a live query for the same reason the
 * methodology page queries its own figures: this project has had a
 * jurisdiction count sit stale across thirty files for two days.
 */
export function datasetLd({ countryCount, lang = "en", modified }) {
  const node = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${ORIGIN}/sources#dataset`,
    name: "Global e-invoicing mandate tracker",
    description: `Mandate status, dated obligations, formats, penalties and official `
      + `sources for ${countryCount} jurisdictions, each claim carrying the source it `
      + `was verified against.`,
    url: `${ORIGIN}/sources`,
    inLanguage: lang,
    isAccessibleForFree: true,
    creator: { "@id": `${ORIGIN}/#organization` },
    publisher: { "@id": `${ORIGIN}/#organization` },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${ORIGIN}/map-data.json`,
    },
  };
  // Omitted rather than invented when the caller has no real date.
  if (modified) node.dateModified = modified;
  return node;
}

export function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * A country deep dive.
 *
 * WebPage, not Article. An Article asserts authorship and a publication
 * date; these pages are a continuously revised reference built from a
 * database, and the only date we genuinely hold is when the content was
 * last updated. Claiming a byline and a publication date to fill the
 * schema would be the exact failure this file's header is about.
 */
export function countryPageLd({ countryName, displayName, slug, lang, lastUpdated }) {
  const node = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${ORIGIN}/${slug}#webpage`,
    url: `${ORIGIN}/${slug}`,
    name: `${displayName} e-invoicing requirements`,
    inLanguage: lang,
    isPartOf: { "@id": `${ORIGIN}/#website` },
    publisher: { "@id": `${ORIGIN}/#organization` },
    about: { "@type": "Country", name: countryName },
    // The rule the page is written to, machine-readable from every page
    // that states a mandate status.
    publishingPrinciples: `${ORIGIN}/methodology`,
  };
  if (lastUpdated && /^\d{4}-\d{2}-\d{2}$/.test(String(lastUpdated))) {
    node.dateModified = String(lastUpdated);
  }
  return node;
}

/**
 * An insights piece. Article is right here and wrong on a country page:
 * these genuinely are written pieces with a publication date the page
 * already displays.
 */
export function articleLd({ slug, headline, description, published, modified, lang, isFree }) {
  const node = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${ORIGIN}/insights/${slug}#article`,
    url: `${ORIGIN}/insights/${slug}`,
    headline,
    inLanguage: lang,
    isPartOf: { "@id": `${ORIGIN}/#website` },
    publisher: { "@id": `${ORIGIN}/#organization` },
    // AUTHOR, added 24 August 2026. Google lists it as required for
    // Article rich-result eligibility and these pieces had none — every
    // whitepaper on this site was published by an organisation and
    // written, as far as any consumer could tell, by nobody.
    author: { "@id": `${ORIGIN}/#founder` },
    publishingPrinciples: `${ORIGIN}/methodology`,
  };
  if (description) node.description = description;
  if (published && /^\d{4}-\d{2}-\d{2}/.test(String(published))) {
    node.datePublished = String(published).slice(0, 10);
  }
  if (modified && /^\d{4}-\d{2}-\d{2}/.test(String(modified))) {
    node.dateModified = String(modified).slice(0, 10);
  }
  // isAccessibleForFree is only stated where we know the answer. A gated
  // piece marked free is a promise the paywall breaks.
  if (typeof isFree === "boolean") node.isAccessibleForFree = isFree;
  return node;
}

/**
 * The change record.
 *
 * A WebPage, not a Dataset and not an ItemList. It is a page listing
 * corrections; claiming it is a dataset would be the same overreach the
 * header of this file refuses on /sources, where the claim is honest only
 * because a real distribution stands behind it. There is no endpoint here.
 */
export function changesLd({ lang = "en", modified } = {}) {
  const node = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${ORIGIN}/changes#webpage`,
    url: `${ORIGIN}/changes`,
    name: "What changed",
    description: "Every change to the five headline facts this site publishes — "
      + "what each said before, when it changed, and why.",
    inLanguage: lang,
    isPartOf: { "@id": `${ORIGIN}/#website` },
    publisher: { "@id": `${ORIGIN}/#organization` },
    publishingPrinciples: `${ORIGIN}/methodology`,
  };
  // The newest recorded change, not today. A page about being accurate
  // with dates cannot stamp itself with one it has not earned.
  if (modified && /^\d{4}-\d{2}-\d{2}$/.test(String(modified))) {
    node.dateModified = String(modified);
  }
  return node;
}

/** The methodology page itself. */
export function methodologyLd(lang = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${ORIGIN}/methodology#webpage`,
    url: `${ORIGIN}/methodology`,
    name: "Methodology",
    description: "What we require of a source, what our status words mean, and where "
      + "we are deliberately stricter than other trackers.",
    inLanguage: lang,
    isPartOf: { "@id": `${ORIGIN}/#website` },
    publisher: { "@id": `${ORIGIN}/#organization` },
  };
}
