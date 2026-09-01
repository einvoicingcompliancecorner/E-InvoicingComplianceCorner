// ================================================================
// SHARED HEADLINE FACTS
// ================================================================
// The five facts every country page states in the same order, in the
// same words: the e-invoicing mandate (B2G, B2B, B2C), e-reporting,
// archiving, and digital signature. Read from country_headline_facts.
//
// ---- WHY THIS IS ITS OWN MODULE (25 August 2026) ---------------------
//
// It lived in guides-render.mjs, which is where it was born: the compliance
// guide printout was the first surface to show these tiles. Dan then asked
// for the same information on the country deep-dive pages, and the obvious
// move -- import headlineTiles from guides-render -- is a CIRCULAR IMPORT,
// because guides-render already imports escapeHtml and translateCountryName
// from deep-dive-render.
//
// So the vocabulary moved to a leaf that imports nothing. Both renderers
// depend on it and it depends on neither, which is also the honest shape:
// these five facts are not a property of the guide, they are a property of
// the country, and two surfaces now say so.
//
// THE POINT IS THAT BOTH SURFACES SAY THE SAME WORDS. A deep dive that
// renders "ACTIVE" where the guide for the same country renders something
// else is worse than a deep dive that renders nothing -- and it is exactly
// what two copies of these maps would eventually produce. There is one
// copy. The markup is shared too; only the stylesheet differs, because the
// guide is a printed white page and the deep dive is a dark screen.
//
// esc() IS LOCAL AND DELIBERATELY A COPY. Importing escapeHtml from
// deep-dive-render would re-create the cycle this module exists to break.
// It is four replaces, it is stable, and this codebase already documents
// the precedent for tolerating small cross-runtime copies over coupling.
// ================================================================

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * The five facts for ONE country, in the caller's language.
 *
 * The guide fetches these for a whole selection at once (see
 * getGuideBundle); a deep dive renders one country and needs one row.
 *
 * NOTES FALL BACK TO ENGLISH PER COLUMN, not per row. A country whose
 * German translation covers four notes and not the fifth should show four
 * German notes and one English one, rather than five English ones --
 * which is what a row-level COALESCE would do.
 *
 * RETURNS null RATHER THAN THROWING when there is no row. Migration 608
 * filled the last seven and asserts all 70 now have one, so in production
 * this never misses; but the harness runs against fixtures and a new
 * country can arrive before its facts do. The renderer treats null as
 * "show nothing here", which loses a strip rather than a page.
 */
export async function getCountryHeadlineFacts(db, countryName, lang = "en") {
  const stmt = db.prepare(`
    SELECT f.b2g_status, f.b2g_date, f.b2b_status, f.b2b_date,
           f.b2c_status, f.b2c_date, f.archiving_years, f.archiving_status,
           f.signature_status, f.last_verified,
           f.ereporting_status, f.ereporting_frequency, f.ereporting_system,
           f.ereporting_date,
           COALESCE(ht.b2g_note, ht_en.b2g_note)             AS b2g_note,
           COALESCE(ht.b2b_note, ht_en.b2b_note)             AS b2b_note,
           COALESCE(ht.b2c_note, ht_en.b2c_note)             AS b2c_note,
           COALESCE(ht.archiving_note, ht_en.archiving_note) AS archiving_note,
           COALESCE(ht.signature_note, ht_en.signature_note) AS signature_note,
           COALESCE(ht.ereporting_note, ht_en.ereporting_note) AS ereporting_note
      FROM country_headline_facts f
      JOIN countries c ON c.id = f.country_id
      LEFT JOIN country_headline_fact_translations ht
        ON ht.country_id = f.country_id AND ht.lang = ?2
      LEFT JOIN country_headline_fact_translations ht_en
        ON ht_en.country_id = f.country_id AND ht_en.lang = 'en'
     WHERE c.name_en = ?1`).bind(countryName, lang);
  return (await stmt.first()) || null;
}

export function shortDate(d) {
  if (!d) return "";
  const [y, m] = String(d).split("-");
  return `${MONTHS[parseInt(m, 10) - 1] || ""} ${y}`;
}

// ---- the five headline tiles -----------------------------------------
//
// THE POINT OF THESE IS THAT THEY ARE THE SAME FIVE EVERY TIME.
//
// What they replace was five free-form value/label pairs chosen per
// country: Germany offered "2 formats / No CTC / 8 yrs / EUR 5,000 /
// 2028", Azerbaijan offered a launch date and a VAT rate. Interesting,
// and not comparable -- a reader with eleven markets could not line
// eleven pages up against each other, which was Dan's complaint.
//
// Those per-country stats are not thrown away; they move to an optional
// second strip that a page shows only if it has room (see the renderer).
//
// AN UNKNOWN PRINTS AS "NOT CONFIRMED" AND NEVER AS BLANK. 18 of the 350
// stored facts are unknown, each with a recorded reason. A blank tile
// would read as "no requirement", which is a different claim and the one
// that gets somebody fined. This is the whole argument for the enum
// carrying 'unknown' as a value rather than using NULL.
const HL_STATUS = {
  active:     ["hl.active",     "ACTIVE",       "on"],
  planned:    ["hl.planned",    "PLANNED",      "soon"],
  voluntary:  ["hl.voluntary",  "VOLUNTARY",    "opt"],
  no_mandate: ["hl.none",       "NO MANDATE",   "off"],
  unknown:    ["hl.unknown",    "NOT CONFIRMED", "unk"],
};
// The e-Reporting card prints a CADENCE where the others print a status,
// so the status table only has to cover the states that are not one.
// 'active' never reaches it: an active row always has a frequency, which
// 626 asserts, and the frequency is what the card shows.
const HL_EREPORTING = {
  active:     [null,             null,            "on"],
  planned:    ["hl.er.planned",  "PLANNED",       "soon"],
  // An audit file is a real obligation that is not a schedule. Blue,
  // the same tone VOLUNTARY uses on the mandate card, because both mean
  // "this applies to you conditionally" -- and pointedly not the grey of
  // NO MANDATE beside it.
  on_request: [null,             null,            "opt"],
  voluntary:  ["hl.voluntary",   "VOLUNTARY",     "opt"],
  no_mandate: ["hl.er.none",     "NO MANDATE",    "off"],
  unknown:    ["hl.unknown",     "NOT CONFIRMED", "unk"],
};
const HL_FREQUENCY = {
  real_time:      ["hl.freq.real_time",      "REAL-TIME"],
  near_real_time: ["hl.freq.near_real_time", "NEAR REAL-TIME"],
  daily:          ["hl.freq.daily",          "DAILY"],
  monthly:        ["hl.freq.monthly",        "MONTHLY"],
  quarterly:      ["hl.freq.quarterly",      "QUARTERLY"],
  annual:         ["hl.freq.annual",         "ANNUAL"],
  varies:         ["hl.freq.varies",         "VARIES"],
  on_request:     ["hl.freq.on_request",     "ON REQUEST"],
};

const HL_SIGNATURE = {
  required:     ["hl.sig.required",    "REQUIRED",     "on"],
  conditional:  ["hl.sig.conditional", "CONDITIONAL",  "soon"],
  not_required: ["hl.sig.not",         "NOT REQUIRED", "off"],
  unknown:      ["hl.unknown",         "NOT CONFIRMED", "unk"],
};

/**
 * `wrapperClass` is how the two surfaces differ, and it is the ONLY way
 * they are allowed to differ. The guide passes nothing and keeps
 * "statstrip hl", which GUIDE_STYLE dresses for a printed white page; the
 * deep dive passes "hl-strip", which HEADLINE_DARK_STYLE below dresses
 * for a dark screen. Everything inside — the classes, the structure, the
 * words, the tone each status maps to — is identical, because a reader
 * with both open must not be able to find a discrepancy.
 */
export function headlineTiles(h, t, wrapperClass = "statstrip hl") {
  if (!h) return "";

  // ---- THREE CARDS, NOT FIVE ------------------------------------------
  //
  // Dan, 22 August 2026: "from a section arrangement standard - we should
  // only have 5 boxes / cards at the top of the page. We can combine B2G,
  // B2B and B2C into one card."
  //
  // He was counting ten. Nine countries were also showing the demoted
  // per-country stats as a second strip directly underneath, in a
  // different style, and on Brazil, Bahrain and Romania it restated the
  // tiles above it -- Romania printed "5 yrs" in one strip and "10 yrs" in
  // the other, 15mm apart, for the same fact. That strip is gone; see the
  // renderer below.
  //
  // COMBINING THE THREE SEGMENTS IS A READABILITY FIX, not just a count.
  // As three separate tiles they were three identical boxes: Kenya and
  // Uruguay both printed ACTIVE / ACTIVE / ACTIVE across the top with
  // nothing to tell them apart, because the qualifying lines are the first
  // thing the fitter takes. Read as one card with three labelled rows,
  // the segments are compared against each other -- which is the actual
  // question, "does this apply to me" -- instead of against the same
  // segment on another country's page.
  const seg = (status, date, label, note) => {
    const [key, en, tone] = HL_STATUS[status] || HL_STATUS.unknown;
    // The date rides WITH the word rather than replacing it: "Jan 2027"
    // alone does not say whether that is a start or a deadline, and
    // "PLANNED" alone is the omission migration 600's CHECK refuses to
    // store.
    const value = status === "planned" && date
      ? `${esc(t(key, en))} <span class="dt">${esc(shortDate(date))}</span>`
      : esc(t(key, en));
    return `<div class="seg ${tone}"><span class="sl">${esc(label)}</span>
      <span class="sv">${value}</span>
      <span class="sn">${note ? esc(note) : ""}</span></div>`;
  };

  const card = (value, tone, label, note, system) =>
    `<div class="hcard ${tone}"><div class="v">${value}</div>${
      system ? `<div class="sys">${esc(system)}</div>` : ""
    }<div class="l">${esc(label)}</div>${
      note ? `<div class="n">${esc(note)}</div>` : ""}</div>`;

  // ---- e-Reporting -----------------------------------------------------
  //
  // Dan, 23 August 2026: a fourth card "for e-Reporting, and will alert
  // the user to any e-Reporting mandates that are in place such as
  // SAF-T" -- and, when the first cut leaned on SAF-T: "I was just using
  // SAF-T as an example ... ensure if there is a B2B e-Reporting
  // requirement, it is listed, regardless of whether SAF-T or another."
  //
  // Only four of the thirty-nine live regimes ARE SAF-T, which is why
  // the card leads with the cadence and names the system underneath
  // rather than the other way round. MONTHLY tells a reader what they
  // have to build; "SAF-T" only tells them so if their country happens
  // to use it.
  const erep = (() => {
    const st = h.ereporting_status || "unknown";
    const [key, en, tone] = HL_EREPORTING[st] || HL_EREPORTING.unknown;
    const label = t("hl.lbl.ereporting", "E-reporting");
    // A cadence, where there is one. `active` and `on_request` carry no
    // status word of their own precisely so the card cannot print
    // "ACTIVE" over a system name and leave the reader to guess how
    // often -- which is the thing this card exists to answer.
    const freq = HL_FREQUENCY[h.ereporting_frequency];
    if (key === null && freq) {
      return card(esc(t(freq[0], freq[1])), tone, label,
                  h.ereporting_note, h.ereporting_system);
    }
    // PLANNED rides with its date, the same way the mandate segments do:
    // "PLANNED" alone is the omission migration 600's CHECK refuses to
    // store, and 626 restates it for this column.
    const value = st === "planned" && h.ereporting_date
      ? `${esc(t(key, en))} <span class="dt">${esc(shortDate(h.ereporting_date))}</span>`
      : esc(t(key || "hl.unknown", en || "NOT CONFIRMED"));
    return card(value, tone, label, h.ereporting_note,
                st === "planned" ? h.ereporting_system : null);
  })();

  const arch = (() => {
    if (h.archiving_status === "years" && h.archiving_years != null) {
      // NOT the same green as an in-force mandate. A retention period is
      // not a compliance status, and painting "7 yrs" the colour that
      // means ACTIVE two cards to the left made the strip say something it
      // did not mean. Neutral, because a number is just a number.
      return card(`${esc(String(h.archiving_years))} <span class="dt">${
        esc(t("hl.yrs", "yrs"))}</span>`, "num", t("hl.lbl.archiving", "Archiving"), h.archiving_note);
    }
    const map = {
      // "VARIES" used to print in the amber that means "a deadline is
      // coming" everywhere else on the page. It is not a warning.
      varies:         ["hl.arch.varies", "VARIES",         "num"],
      no_requirement: ["hl.arch.none",   "NO REQUIREMENT", "off"],
      unknown:        ["hl.unknown",     "NOT CONFIRMED",  "unk"],
    };
    const [key, en, tone] = map[h.archiving_status] || map.unknown;
    return card(esc(t(key, en)), tone, t("hl.lbl.archiving", "Archiving"), h.archiving_note);
  })();

  const [sk, sen, stone] = HL_SIGNATURE[h.signature_status] || HL_SIGNATURE.unknown;

  return `<div class="${wrapperClass}">
    <div class="hcard mand"><div class="l">${esc(t("hl.lbl.mandate", "E-invoicing mandate"))}</div>
      ${seg(h.b2g_status, h.b2g_date, t("hl.seg.b2g", "B2G"), h.b2g_note)}
      ${seg(h.b2b_status, h.b2b_date, t("hl.seg.b2b", "B2B"), h.b2b_note)}
      ${seg(h.b2c_status, h.b2c_date, t("hl.seg.b2c", "B2C"), h.b2c_note)}
    </div>
    ${erep}
    ${arch}
    ${card(esc(t(sk, sen)), stone, t("hl.lbl.signature", "Digital signature"), h.signature_note)}
  </div>`;
}


/**
 * THE FOUR CHANNELS AS WORDS, for the guide's front-page summary table.
 *
 * WHY IT LIVES HERE rather than in guides-render. The front table used to
 * decide its own vocabulary — one word derived from three of the statuses
 * — and that is what broke it. Dan, 1 September 2026, on the Netherlands:
 * "IN FORCE seem incorrect here." It was, and not because the data was
 * wrong: NL's B2G is genuinely `active` and correctly sourced ("Central-
 * government suppliers must issue; other public bodies need only
 * receive"). The table collapsed four channels into one word, so a real
 * but narrow B2G duty printed as an unqualified obligation, and the note
 * that says which suppliers it binds was a page away.
 *
 * SO THIS IS THE SAME TABLE THE TILES READ, not a second one. HL_STATUS
 * is right there above it. A summary that resolves its own words is a
 * summary that can disagree with the thing it summarises, which is the
 * rule guides-render's own header already states and the reason the
 * previous fix (27 August) did not hold: it swapped a milestone heuristic
 * for a headline-fact heuristic and kept the collapse.
 *
 * E-REPORTING IS INCLUDED, and its absence was the sharper half of the
 * same bug. `mandateStateOf` read b2g/b2b/b2c only, so Taiwan — voluntary
 * on all three, ACTIVE on e-Reporting — printed "No mandate" on the front
 * page and ACTIVE on its own tile one page later. Bulgaria, Czech
 * Republic, the Philippines and Slovakia are in the same state and are
 * only hidden by having a future date to show instead. Understating a
 * live obligation is the error this file's own comment warns about.
 *
 * IT PRINTS A STATUS WHERE THE TILE PRINTS A CADENCE. The e-Reporting
 * card deliberately shows MONTHLY rather than ACTIVE, because a cadence
 * is what a reader has to build for; HL_EREPORTING carries a null word
 * for `active` and `on_request` to force that. One line in a summary cell
 * has no room for both, and a column whose other three rows are statuses
 * cannot suddenly answer a different question, so the status word is
 * restored here. ACTIVE and MONTHLY are the same fact at two
 * resolutions — not a disagreement — and the cadence is on the page below.
 *
 * Returns null when a country has no stored facts, which migration 662's
 * standing invariant makes impossible in production but the harness can
 * still build. The caller decides what an absent row prints; it must not
 * be a blank, for the reason at the top of this file.
 */
export function channelStatuses(h, t) {
  if (!h) return null;
  const word = (status, map) => {
    const [key, en, tone] = map[status] || map.unknown;
    return { word: t(key, en), tone };
  };
  const erep = (() => {
    const st = h.ereporting_status || "unknown";
    // The two the tile answers with a cadence instead. Both reuse a key
    // that already exists and is already translated in all four
    // languages — no new string is introduced by this column.
    if (st === "active") return { word: t("hl.active", "ACTIVE"), tone: "on" };
    if (st === "on_request") return { word: t("hl.freq.on_request", "ON REQUEST"), tone: "opt" };
    return word(st, HL_EREPORTING);
  })();
  return [
    { label: t("hl.seg.b2g", "B2G"), ...word(h.b2g_status, HL_STATUS) },
    { label: t("hl.seg.b2b", "B2B"), ...word(h.b2b_status, HL_STATUS) },
    { label: t("hl.seg.b2c", "B2C"), ...word(h.b2c_status, HL_STATUS) },
    { label: t("hl.lbl.ereporting", "E-reporting"), ...erep },
  ];
}


/**
 * The same markup, dressed for a dark screen.
 *
 * THE PRINT STYLESHEET IS IN GUIDE_STYLE and stays there; this is its
 * counterpart, and the two are deliberately the only things that differ
 * between the guide's tiles and the deep dive's. Same classes, same
 * structure, same words — because a reader who has both open must not be
 * able to find a discrepancy, and the fastest way to create one is to let
 * two renderers each decide what "planned" looks like.
 *
 * THE STATE IS NEVER ONLY A COLOUR, which is inherited from the print
 * sheet for a different reason. There it was photocopying; here it is
 * that roughly one man in twelve cannot separate the green from the
 * amber. Each state is a distinct word as well as a distinct left rule,
 * and NOT CONFIRMED is additionally the only dashed border on the strip.
 *
 * COLOURS ARE THE PAGE'S OWN TOKENS where one exists (--soon for amber),
 * and chosen against --ink-2 for contrast where one does not. The values
 * below sit at 7:1 or better against #152238, comfortably past AA.
 */
export const HEADLINE_DARK_STYLE = `
  /* TWO ROWS, NOT THE GUIDE'S SIX COLUMNS — and the reason is that a
     screen is not an A4 page.
     The guide packs the mandate card and three single cards into one
     six-column strip because a printed page has a fixed height and
     vertical space is the scarce thing. Here the page scrolls, so
     vertical space is cheap and horizontal space is not: at six columns a
     single card is 135px wide with a 103px content box, and MEASURED, the
     German ERFORDERLICH needs 135px at this size. It cannot fit, at any
     font size a headline value should use — the fix is width, not type.
     Given a full row, the mandate card's three segments get the whole
     container to line up in, and each single card gets a third. */
  .hl-strip{display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:0 0 22px;}
  .hl-strip > .hcard{background:var(--ink-2); border:1px solid var(--line);
    border-left:3px solid #5d6b83; border-radius:var(--radius); padding:12px 14px; min-width:0;}
  .hl-strip > .mand{grid-column:1/-1; display:grid;
    grid-template-columns:4.4em minmax(max-content,auto) 1fr; gap:4px 14px; align-content:start;}
  .hl-strip > .mand > .l{grid-column:1/-1; margin:0 0 6px;}
  /* 17px AND ALLOWED TO BREAK, both measured rather than chosen.
     At 19px with no wrapping allowance a single long status word does not
     fit a sixth of this container and is CLIPPED, not wrapped: at 1280px
     the French and Spanish CONDITIONNELLE / CONDICIONAL, the German
     NICHT ERFORDERLICH and MONATLICH, and the plain English CONDITIONAL
     all lost their tails. The element's height is unchanged and the text
     is all still in the DOM, so nothing but a fit measurement sees it —
     which is why tests/headline-facts-fit.mjs now runs one.
     overflow-wrap is the backstop, not the plan: 17px fits every word the
     four languages currently produce, and a longer one added later breaks
     mid-word instead of vanishing. */
  .hl-strip .v{font-family:'Big Shoulders Display',sans-serif; font-weight:800;
    font-size:17px; line-height:1.12; color:var(--text-lo);
    /* hyphens BEFORE overflow-wrap, because the browser tries hyphenation
       during normal line breaking and only falls back to breaking anywhere
       when a word still cannot fit. Without it the German signature card
       read "NICHT ERFORDERL / ICH". The page carries a real lang attribute,
       so Chromium has the right dictionary to break at ERFOR-DERLICH. */
    hyphens:auto; -webkit-hyphens:auto; overflow-wrap:anywhere;}
  .hl-strip .l{font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:500;
    text-transform:uppercase; letter-spacing:0.09em; color:var(--muted); margin-top:6px;}
  .hl-strip .sys{font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--muted);
    line-height:1.2; margin-top:3px; overflow-wrap:anywhere;}
  .hl-strip .dt{font-family:'IBM Plex Sans',sans-serif; font-weight:600; font-size:12px;
    letter-spacing:0; color:var(--muted); white-space:nowrap;}
  /* The qualifier. Without it ACTIVE and NO MANDATE are more confident
     than the underlying law usually is, so it is not decoration and is
     not allowed to be the smallest thing on the card. */
  .hl-strip .n{font-size:11px; color:var(--muted); line-height:1.4; margin-top:7px;
    border-top:1px solid var(--line); padding-top:6px; overflow-wrap:anywhere;}
  /* The mandate card's three rows share one grid so B2G, B2B and B2C
     start at the same x and read down as a column — which is the actual
     question a visitor has, "does this apply to me". */
  .hl-strip .seg{display:contents;}
  .hl-strip .seg .sl{font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.08em;
    color:var(--muted); padding:2px 0 0 7px; border-left:3px solid #5d6b83;}
  /* NOT nowrap, which is what the print sheet uses. There the column is a
     fixed A4 sixth and the type is 10.5pt; here the container is fluid and
     nowrap made the mandate card's min-content wider than its third of the
     strip, so the whole strip overflowed its wrap by ~33px on the German
     pages. Wrapping costs a second line on the longest words and keeps the
     page free of a horizontal scrollbar. */
  .hl-strip .seg .sv{font-family:'Big Shoulders Display',sans-serif; font-weight:800;
    font-size:15px; color:var(--text-lo); line-height:1.15; overflow-wrap:anywhere;}
  .hl-strip .seg .sn{font-size:11px; color:var(--muted); line-height:1.35; overflow-wrap:anywhere;}
  .hl-strip .seg.on .sl{border-left-color:#4f9d6d;}
  .hl-strip .seg.soon .sl{border-left-color:var(--soon);}
  .hl-strip .seg.opt .sl{border-left-color:#6f93c9;}
  .hl-strip .seg.unk .sl{border-left-style:dashed;}
  .hl-strip .seg.unk .sv{color:var(--muted);}
  .hl-strip > .hcard.on{border-left-color:#4f9d6d;}
  .hl-strip > .hcard.soon{border-left-color:var(--soon);}
  .hl-strip > .hcard.opt{border-left-color:#6f93c9;}
  .hl-strip > .hcard.off{border-left-color:#5d6b83;}
  /* A retention period is not a compliance status: "7 yrs" must not print
     in the green that means ACTIVE two cards to its left. Neutral. */
  .hl-strip > .hcard.num{border-left-color:#7f8fab;}
  /* Not-confirmed is the only dashed card on the strip, and must never be
     mistaken for the solid grey NO MANDATE beside it. */
  .hl-strip > .hcard.unk{border-left-color:#5d6b83; border-style:dashed;}
  .hl-strip > .hcard.unk .v{color:var(--muted);}
  /* SIX COLUMNS DO NOT FIT A PHONE. The guide never had to care — it is
     a printed A4 page. Below 900px the strip goes to two columns with the
     mandate card spanning both, and below 560px to one. */
  /* Three abreast needs about 200px each to hold a status word. Below
     that they stack; the mandate card spans whatever the row is. */
  @media (max-width:700px){
    .hl-strip{grid-template-columns:1fr;}
  }
  /* And on a narrow phone the mandate card's own three columns stop
     fitting too: 4.4em of label plus a status word plus a qualifier is
     more than 300px. Each segment becomes its own small block. */
  @media (max-width:460px){
    .hl-strip > .mand{grid-template-columns:1fr;}
    .hl-strip .seg{display:block; padding-left:9px; border-left:3px solid #5d6b83; margin-top:8px;}
    .hl-strip .seg.on{border-left-color:#4f9d6d;}
    .hl-strip .seg.soon{border-left-color:var(--soon);}
    .hl-strip .seg.opt{border-left-color:#6f93c9;}
    .hl-strip .seg.unk{border-left-style:dashed;}
    .hl-strip .seg .sl{border-left:0; padding:0; display:block;}
    .hl-strip .seg .sv{display:block; margin-top:1px;}
    .hl-strip .seg .sn{display:block; margin-top:2px;}
  }
`;
