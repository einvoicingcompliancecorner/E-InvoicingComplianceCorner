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
// Cheap and specific: find the client-script template, and refuse any
// unescaped backtick or ${ on a comment line inside it.
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
console.log("  PASS  shared/roi-render.mjs parses");
console.log(`\nRender lint: 2/2 passed${parses ? "" : ""}`);
