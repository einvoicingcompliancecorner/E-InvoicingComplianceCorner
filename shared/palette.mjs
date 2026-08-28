// ================================================================
// THE PALETTE — one definition, two themes
// ================================================================
//
// Until 28 August 2026 the palette was written out by hand in 23 :root
// blocks across 18 files. It was believed to be identical everywhere. It
// was not: `--stamp-dim` was #7c3648 in four education pages and #7c3628
// in the other fourteen places -- a deltaE76 of 19.8 against a
// just-noticeable difference of about 2.3, rendering live on the
// pitfall-card border of education-preparing-for-mandate.
//
// THE CHECK THAT MISSED IT compared four properties -- ink, paper, stamp,
// soon -- found them identical, and concluded the palette was identical.
// Those four have never drifted. Nothing was watching the one that did.
// `tests/palette.mjs` now asserts that no property is ever defined with
// two different values anywhere in the tree, which is the check that
// would have caught it, and `tools/sync-palette.mjs` writes these blocks
// so a hand edit cannot reintroduce the problem.
//
// ---- WHY THERE ARE -ink NAMES NOW -------------------------------------
//
// A status pill is a coloured ground with text on it. On the dark theme
// the ground is the dim variant and the text was a LITERAL hex, repeated:
// #bfe6cf for in-force, #ffe0b3 for upcoming, #eec4ba for alert, 24
// distinct values across 87 uses. Literals cannot be themed, and on a
// light ground every one of them becomes invisible.
//
// So each status now owns three values rather than two:
//
//     --x         the colour used as text ON THE PAGE GROUND
//     --x-dim     the pill's own ground
//     --x-ink     the text on that ground
//
// Component CSS reads the pair and never names a colour, so a theme is a
// set of values rather than a second stylesheet.

/** The shipped theme. These are the values the site has always had, plus
 *  the -ink names for text that used to be hardcoded. Every -ink value
 *  here is one of the literals it replaces, so the default theme renders
 *  exactly as it did before this refactor. */
export const DARK = {
  "--ink": "#0f1a2b",
  "--ink-2": "#152238",
  "--ink-3": "#1c2c48",
  "--line": "#2b3c5a",
  "--text-lo": "#f2f0e8",
  "--muted": "#93a3c0",
  "--paper": "#efe9db",
  "--paper-2": "#e4dcc6",
  "--paper-line": "#c9bd9e",
  "--card-ink": "#241d10",
  "--card-key": "#6b5f3f",
  "--accent": "#c98a3a",
  "--live": "#3f7d5c",
  "--live-dim": "#274a38",
  "--live-ink": "#bfe6cf",
  "--soon": "#c98a3a",
  "--soon-dim": "#6e4c22",
  "--soon-ink": "#ffe0b3",
  "--stamp": "#b5432f",
  "--stamp-dim": "#7c3628",
  "--stamp-ink": "#eec4ba",
  "--upcoming": "#6b7a95",
  "--upcoming-dim": "#3a4864",
  "--upcoming-ink": "#dbe2ee",
  "--neutral-dim": "#3a4864",
  "--neutral-ink": "#c3cddd",
  // The two map statuses that are their own colour rather than an alias
  // of a status above. Consolidating the 23 blocks nearly lost these:
  // they lived only in site-worker's map-tooltip block, and the first
  // pass replaced that block with a palette that did not define them.
  "--nomandate": "#8a5a75",
  "--nomandate-dim": "#4a2f3d",
  "--nomandate-ink": "#f0d6e6",
  "--tracked": "#4a5568",
  "--tracked-dim": "#2c333d",
  "--tracked-ink": "#c7ccd3",
  // Text that sits on a SOLID status colour rather than on its tint.
  // There is deliberately no --on-live: nothing in the tree puts text on
  // solid --live, and an unused property carrying an assertion is a check
  // that protects nothing while being able to fail the build. It was
  // added for symmetry, failed at 4.28:1 against today's green, and was
  // removed rather than have the floor lowered to accommodate it.
  // Rendering both themes and scanning every element found five places
  // doing this -- the portal button on --stamp, the active filter pill on
  // --soon, and the arrivals-board flaps. The -ink names were the wrong
  // fit: those are for the pale -dim grounds, and reusing them put
  // #8f1c2d on #bf263c at 1.50:1. A separate name is the honest fix.
  "--on-stamp": "#f2f0e8",
  "--on-soon": "#1a1207",
  // The arrivals board is its own visual language and keeps its own two
  // colours, so the default theme stays byte-identical rather than
  // inheriting the slightly different --stamp-ink.
  "--flap-ink": "#f2f0e8",
  "--flap-alert": "#e88a76",
  "--radius": "10px",
};

/** The partner theme, read out of Tradeshift's own brand template
 *  (ppt/theme/theme1.xml, "Tradeshift Master Template", and slides 8, 9,
 *  13 and 29 of the deck). See claude/tradeshift-palette-derived.md.
 *
 *  IT IS A LIGHT THEME BECAUSE THEIR BRAND IS ONE. White field, near-black
 *  type, one saturated blue. Taking their colours onto this site's dark
 *  ground was measured first and failed: the alert pill -- their Go red on
 *  their master blue -- comes out at 2.08:1 against a 3:1 floor, and that
 *  is the colour the site uses to say a penalty applies. Dan chose the
 *  light reading on 28 August, which is also the faithful one.
 *
 *  VERBATIM FROM THEIR TEMPLATE: the ground, the raised surface, the
 *  hairline, both text colours, the master blue, and Engage and Go at
 *  their published dark steps.
 *
 *  DERIVED, AND NOT THEIRS TO STAND BEHIND: --live and --upcoming. Buy
 *  mint reads 2.52:1 as text on white at its darkest published step and
 *  Pay cyan 3.02:1, so neither can carry a status label. Both are held at
 *  their own hue and taken down until they clear the floor. The pale -dim
 *  tints are also derived. Anyone signing this off should be told which
 *  half is which. */
export const LIGHT = {
  "--ink": "#f9f9f9",
  "--ink-2": "#ffffff",
  "--ink-3": "#f0f0f0",
  "--line": "#e3e3e3",
  "--text-lo": "#1e1e1e",
  "--muted": "#5c5c5c",
  "--paper": "#ffffff",
  "--paper-2": "#f9f9f9",
  "--paper-line": "#e3e3e3",
  "--card-ink": "#1e1e1e",
  "--card-key": "#5c5c5c",
  "--accent": "#0a37f0",
  "--live": "#0d8162",
  "--live-dim": "#e2faf2",
  "--live-ink": "#0b5c45",
  "--soon": "#a36416",
  "--soon-dim": "#fdefdd",
  "--soon-ink": "#7a4a10",
  "--stamp": "#bf263c",
  "--stamp-dim": "#fde8eb",
  "--stamp-ink": "#8f1c2d",
  "--upcoming": "#007c96",
  "--upcoming-dim": "#e2f4f9",
  "--upcoming-ink": "#0b5c6e",
  "--neutral-dim": "#f0f0f0",
  "--neutral-ink": "#5c5c5c",
  // Both already clear the floor on a light ground unchanged (5.25:1 and
  // 7.15:1), so they carry over verbatim rather than being re-derived.
  // Their tints are derived.
  "--nomandate": "#8a5a75",
  "--nomandate-dim": "#f6ecf2",
  "--nomandate-ink": "#6b4159",
  "--tracked": "#4a5568",
  "--tracked-dim": "#eef0f3",
  "--tracked-ink": "#3a4351",
  "--on-stamp": "#ffffff",
  "--on-soon": "#ffffff",
  "--flap-ink": "#1e1e1e",
  "--flap-alert": "#8f1c2d",
  "--radius": "10px",
};

/** Which theme a partner slug selects. A slug that is not here gets the
 *  default, which is the right answer for a partner registered before its
 *  palette has been signed off -- they get the mark on their PDFs and the
 *  site they already knew, rather than a half-applied theme. */
export const PARTNER_THEMES = { tradeshift: LIGHT };

/** The pairs a theme has to satisfy, and the floor for each.
 *
 *  DERIVED FROM WHAT THE COMPONENTS ACTUALLY DO, not from a general
 *  accessibility checklist: each entry names a place where two of these
 *  values meet in the CSS. `tests/palette.mjs` asserts every registered
 *  theme against this table, so a partner palette cannot be added without
 *  being measured.
 *
 *  The status colours carry a 3.0 floor rather than 4.5 because they are
 *  used for pill grounds and short emphasised labels rather than running
 *  text. Today's shipped values would not clear 4.5 -- --stamp is 3.17:1
 *  as text on the ground and --live 3.57:1 -- and raising the floor here
 *  would fail the site as it stands rather than protecting anything. That
 *  is worth revisiting on its own; it is not this change. */
export const CONTRAST_PAIRS = [
  ["primary text on the ground", "--text-lo", "--ink", 4.5],
  ["secondary text on the ground", "--muted", "--ink", 4.5],
  ["primary text on a raised bar", "--text-lo", "--ink-2", 4.5],
  ["card body text on the card", "--card-ink", "--paper", 4.5],
  ["card key text on the card", "--card-key", "--paper", 4.5],
  ["in-force pill", "--live-ink", "--live-dim", 4.5],
  ["upcoming pill", "--soon-ink", "--soon-dim", 4.5],
  ["alert pill", "--stamp-ink", "--stamp-dim", 4.5],
  ["neutral pill", "--neutral-ink", "--neutral-dim", 4.5],
  ["upcoming-blue pill", "--upcoming-ink", "--upcoming-dim", 4.5],
  ["no-mandate pill", "--nomandate-ink", "--nomandate-dim", 4.5],
  ["tracked pill", "--tracked-ink", "--tracked-dim", 4.5],
  ["text on solid stamp", "--on-stamp", "--stamp", 4.5],
  ["text on solid soon", "--on-soon", "--soon", 4.5],
  ["arrivals flap text", "--flap-ink", "--ink-3", 4.5],
  ["arrivals flap alert", "--flap-alert", "--ink-3", 3.0],
  ["live colour as text", "--live", "--ink", 3.0],
  ["soon colour as text", "--soon", "--ink", 3.0],
  ["stamp colour as text", "--stamp", "--ink", 3.0],
  ["hairline against the ground", "--line", "--ink", 1.2],
  ["card edge against the ground", "--paper", "--ink", 1.05],
];

/** WCAG relative luminance, and the ratio between two colours. Used by
 *  the test and by the tools; kept here so the palette and the thing
 *  that judges it cannot come from two different definitions. */
export function luminance(hex) {
  const h = String(hex).replace("#", "");
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const MARK_START = "/* palette:start */";
const MARK_END = "/* palette:end */";
export const PALETTE_MARKERS = { start: MARK_START, end: MARK_END };

/** The CSS every page carries: the default theme on :root, and the
 *  partner themes behind a data-theme attribute.
 *
 *  ATTRIBUTE ON THE ROOT ELEMENT, SET BEFORE FIRST PAINT. The public site
 *  is one cached document for everyone -- per-reader markup was tried,
 *  found to be a caching defect and reverted -- so the branded reader's
 *  document is the same document, and only the attribute differs. Every
 *  partner's palette therefore ships to every reader. That is a few
 *  hundred bytes at the number of partners this will ever have, and it is
 *  the price of not varying the cached response. See themeBootScript(). */
export function paletteCss(indent = "") {
  const block = (sel, vars) =>
    `${indent}${sel}{\n`
    + Object.entries(vars).map(([k, v]) => `${indent}  ${k}:${v};`).join("\n")
    + `\n${indent}}`;
  const themes = Object.entries(PARTNER_THEMES)
    .map(([slug, vars]) => block(`:root[data-eicc-theme="${slug}"]`, vars));
  return [`${indent}${MARK_START}`, block(":root", DARK), ...themes, `${indent}${MARK_END}`].join("\n");
}

/** The inline script that sets the attribute, for the <head> of every page.
 *
 *  IT MUST BE INLINE AND IT MUST BE IN THE HEAD. A branded reader whose
 *  theme is applied after first paint sees the dark site flash to light,
 *  which is worse than not theming at all. An external script or a
 *  deferred one cannot make that guarantee; this runs before the body is
 *  parsed.
 *
 *  IT TRUSTS NOTHING, and it reads its OWN cookie. The obvious move was
 *  to append the slug to eicc_who, which is already readable and already
 *  in the head -- but that cookie's value is parsed elsewhere as a display
 *  name, and widening its format to "name|slug" would have meant every
 *  existing reader's greeting reading through a separator that was not
 *  there when their cookie was written. A second cookie costs one line at
 *  sign-in and cannot break the first.
 *
 *  eicc_theme carries no authority, exactly as eicc_who carries none: the
 *  worst a forged value can do is show the forger a different colour
 *  scheme on their own screen. Everything that matters is decided server
 *  side against the HttpOnly token.
 *
 *  A SLUG WITH NO REGISTERED THEME IS IGNORED, deliberately: an unknown
 *  attribute value would match no rule and leave the reader on the
 *  default, but saying so here means the failure is a no-op rather than
 *  something that depends on CSS matching behaviour. */
export function themeBootScript() {
  const slugs = JSON.stringify(Object.keys(PARTNER_THEMES));
  return `<script>(function(){try{`
    + `var m=document.cookie.match(/(?:^|; )eicc_theme=([^;]*)/);if(!m)return;`
    + `var s=decodeURIComponent(m[1]);if(${slugs}.indexOf(s)<0)return;`
    + `document.documentElement.setAttribute("data-eicc-theme",s);`
    + `}catch(e){}})();</script>`;
}
