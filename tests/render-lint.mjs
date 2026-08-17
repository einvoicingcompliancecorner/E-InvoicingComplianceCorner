#!/usr/bin/env node
// render-lint.mjs — the trap roi-render.mjs sets for anyone editing it.
//
//   node tests/render-lint.mjs
//
// The client script in shared/roi-render.mjs lives inside a template
// literal, so a plain JavaScript comment in that region is NOT a comment
// as far as the outer module is concerned — it is template text. Write
//
//     // the `scroll` argument is opt-in
//
// and the first backtick ENDS the literal. The module then fails to
// parse, four suites die at import time, and the message you get is
// "SyntaxError: Unexpected identifier 'scroll'" pointing at a comment,
// which reads like the parser has lost its mind.
//
// This happened twice in one afternoon (14 Aug 2026), both times while
// writing a comment explaining a fix. Backticks around identifiers are a
// habit everywhere else in this repo, which is exactly why the rule needs
// a check rather than discipline.
//
// Cheap and specific: find the template literals, and refuse any
// unescaped backtick or ${ on a comment line inside them.
//
// TWO REGIONS, NOT ONE, since 17 August 2026. This lint was written for
// the client script and ROI_STYLE is a template literal too -- with its
// own comments, written in CSS /* */ rather than //, which the original
// line filter did not even look at. Three of the four times this trap
// fired that day, it fired in the stylesheet, and the lint that exists
// for exactly this had nothing to say.
//
// The same shape as the i18n suite covering one direction and not the
// other: the check was right and its ITINERARY was short. Extending it
// cost four lines; noticing the second region was the work.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const FILE = join(REPO, "shared", "roi-render.mjs");
const src = readFileSync(FILE, "utf8").split("\n");

// The region is delimited by the script template's own boundaries. Rather
// than parse JavaScript, anchor on the two landmarks that have been
// stable since the file was written and would be loud if they moved.
const start = src.findIndex((l) => /^\s*const script = `/.test(l));
const end = src.findIndex((l, i) => i > start && /^\s*\.replace\("__ROI_COUNTRIES__"/.test(l));
// ROI_STYLE's own template literal. Its comments are CSS block comments,
// so the comment test differs; the backtick rule is identical.
const sStart = src.findIndex((l) => /^export const ROI_STYLE = `/.test(l));
const sEnd = src.findIndex((l, i) => i > sStart && /^`;\s*$/.test(l));

const bad = [];
if (start < 0 || end < 0) {
  bad.push([0, "could not find the client script template — this lint needs updating, "
    + "and silently passing would be worse than failing"]);
} else {
  for (let i = start + 1; i < end; i++) {
    const line = src[i];
    if (!/^\s*\/\//.test(line)) continue;          // comment lines only
    if (/(^|[^\\])`/.test(line)) bad.push([i + 1, "unescaped backtick in a comment: " + line.trim()]);
    else if (/(^|[^\\])\$\{/.test(line)) bad.push([i + 1, "unescaped ${ in a comment: " + line.trim()]);
  }
}
if (sStart < 0 || sEnd < 0) {
  bad.push([0, "could not find the ROI_STYLE template — this lint needs updating, "
    + "and silently passing would be worse than failing"]);
} else {
  // Inside a CSS block comment, or on a line that is only a comment. A
  // backtick anywhere in the stylesheet region ends the literal, comment
  // or not, so this is deliberately broader than the script check: no
  // CSS rule on this page has any business containing one.
  let inComment = false;
  for (let i = sStart + 1; i < sEnd; i++) {
    const line = src[i];
    if (/(^|[^\\])`/.test(line)) {
      bad.push([i + 1, "unescaped backtick in the stylesheet: " + line.trim()]);
    } else if ((inComment || /\/\*/.test(line)) && /(^|[^\\])\$\{/.test(line)) {
      bad.push([i + 1, "unescaped ${ in a stylesheet comment: " + line.trim()]);
    } else if (/content\s*:\s*['"]\\[0-9a-fA-F]/.test(line)) {
      // A CSS unicode escape -- content:'\25B8' -- is an OCTAL ESCAPE to
      // the JavaScript parser, which is a syntax error inside a template
      // literal. Twice now. The parser's own message is "Octal escape
      // sequences are not allowed in template strings", which does not
      // mention CSS, the stylesheet, or the line you actually wrote.
      // Write the character literally: ▸ rather than \25B8.
      bad.push([i + 1, "CSS unicode escape in a template literal -- write the "
        + "character itself, not a backslash escape: " + line.trim()]);
    }
    if (/\/\*/.test(line) && !/\*\//.test(line)) inComment = true;
    else if (/\*\//.test(line)) inComment = false;
  }
}

// ---- t() INSIDE A SINGLE-QUOTED STRING ---------------------------------
//
// The client script embeds translations two ways: inside backtick
// templates, where t() is fine, and inside single-quoted JavaScript
// strings, where it is not -- an apostrophe in the value closes the
// literal and the whole script fails to parse. tj() escapes it.
//
// Migration 571 fixed 109 of these. Two more were reintroduced on 17
// August, both by someone who had just written the migration, and both
// caught by the i18n suite's hostile-translation render -- correctly, and
// three minutes and a full browser launch after the edit. This is the
// same check for a fraction of the cost, and it names the line.
// DELIBERATELY NARROW: only an interpolation IMMEDIATELY preceded by an
// opening single quote. Deciding properly whether a given ${t(...)} sits
// inside a single-quoted string means tracking quote and backtick state
// through JavaScript that is itself being generated inside a template
// literal, and a first attempt at that flagged five savings-table rows
// that are perfectly correct. A lint that cries wolf gets switched off,
// so this one only reports the shape it can be sure of.
//
// That catches the common case and not the other one -- an interpolation
// inside an attribute inside a single-quoted string. The i18n suite's
// hostile-translation render catches both; this is the cheap early
// warning, not the guarantee.
const quoted = [];
for (let i = start + 1; i < end; i++) {
  const line = src[i];
  if (/^\s*\/\//.test(line)) continue;
  if (/'\$\{t\("/.test(line)) quoted.push([i + 1, line.trim().slice(0, 110)]);
}
quoted.forEach(([ln, txt]) => bad.push([ln,
  "t() inside a single-quoted string -- use tj(), which escapes the apostrophe "
  + "that would otherwise end the literal:\n        " + txt]));

// And the belt-and-braces check: it actually parses. The lint above is a
// better error message; this is the ground truth.
let parses = true;
try { await import(`file://${FILE}`); } catch (e) { parses = false; bad.push([0, e.message]); }

if (bad.length) {
  console.log(`  FAIL  shared/roi-render.mjs (${bad.length} problem(s))`);
  bad.forEach(([ln, msg]) => console.log(`        ${ln ? `line ${ln}: ` : ""}${msg}`));
  console.log("\n  Inside the client script template, write comments without backticks —"
    + "\n  name the identifier plainly, or escape it as \\`.");
  process.exit(1);
}
console.log(`  PASS  no backticks or \${ in comments inside the client script `
  + `(lines ${start + 2}-${end})`);
console.log(`  PASS  no backticks in ROI_STYLE (lines ${sStart + 2}-${sEnd})`);
console.log("  PASS  no t() inside a single-quoted string (use tj there)");
console.log("  PASS  shared/roi-render.mjs parses");
console.log(`\nRender lint: 4/4 passed${parses ? "" : ""}`);
