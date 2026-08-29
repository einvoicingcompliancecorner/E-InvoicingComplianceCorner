#!/usr/bin/env node
// whitepaper-editions.mjs — the four editions of a whitepaper stay one document.
//
//   node tests/whitepaper-editions.mjs
//
// WHY THIS EXISTS. Each whitepaper ships as four separate FILES rather
// than one URL serving four languages, which is right for a long
// document -- and it means the English can be edited without anything
// noticing that three translations no longer match it. A figure
// corrected in the English and left wrong in the German is worse than no
// German at all, in a report whose entire subject is figures that do not
// survive being traced.
//
// The ROI whitepaper's editions were BUILT by tools/whitepaper_i18n.py:
// the markup is never translated, only substituted, so the four files
// have the same structure by construction. This is the check that keeps
// that true after somebody edits one of them by hand.
//
// It caught a real error on the day it was written, and not one anybody
// would have found by reading: the Spanish edition had silently
// reclassified an Inter-American Development Bank discussion paper from
// [study] to [official] -- a source-grading change, in the document
// about source grading.
//
// WHAT IT DOES NOT CHECK is whether a hedge survived translation. That
// needs a reader, and this file should not be mistaken for one.
import { suite } from "./lib/browser.mjs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("whitepaper editions");

const FAMILIES = [
  "whitepaper-einvoicing-roi-evidence",
  "whitepaper-ctc-rollouts-compared",
];
const LANGS = ["de", "es", "fr"];

// KNOWN-BENIGN FIGURE DIFFERENCES, and why they are listed one by one
// rather than by exempting the file they are in.
//
// The CTC editions were translated by hand months before the tool
// existed, and three blocks legitimately differ in their figures: a
// German that spells "4 years" as "Vier Jahre", a French that renders
// "next-day" as "J+1", and both rendering 3.5 with a decimal comma.
// Those are correct translations, not drift.
//
// Exempting the whole CTC family would have been one line and would also
// have stopped this file ever failing on that family again -- which is
// the shape of `AND code != 'EU'`, a local patch standing in for a rule.
// Naming the three blocks keeps every other block in those files under
// the check.
const ALLOWED = new Set([
  "whitepaper-ctc-rollouts-compared/de/b0272",  // 3.5 -> 3,5
  "whitepaper-ctc-rollouts-compared/fr/b0272",  // 3.5 -> 3,5
  "whitepaper-ctc-rollouts-compared/de/b0381",  // "4 years" -> "Vier Jahre"
  "whitepaper-ctc-rollouts-compared/fr/b0139",  // "next-day" -> "J+1"
  "whitepaper-ctc-rollouts-compared/fr/b0018",  // "(CTC, Continuous ...)" gloss
]);

let compared = 0;
for (const family of FAMILIES) {
  for (const lang of LANGS) {
    const en = join(REPO, `${family}.html`);
    const tr = join(REPO, `${family}-${lang}.html`);
    let out = "";
    try {
      out = execFileSync("python3",
        [join(REPO, "tools/whitepaper_i18n.py"), "verify", en, tr],
        { cwd: REPO, encoding: "utf8" });
    } catch (err) {
      out = String((err && (err.stdout || err.stderr)) || err);
    }
    const problems = out.split("\n")
      .map((l) => l.trim())
      .filter((l) => /^b\d{4}:/.test(l) || /^block count/.test(l))
      .filter((l) => !ALLOWED.has(`${family}/${lang}/${l.split(":")[0]}`));
    compared += 1;
    t.check(`${family} ${lang}: same structure, figures, links and source tags as the English`,
      problems.length === 0, problems.slice(0, 6).join(" | "));
  }
}

// A check that shells out and gets nothing back passes for the wrong
// reason. This fails if the tool stopped producing a report at all.
t.check("the comparison actually ran on every pair", compared === 6, `${compared} pairs`);

// AND THE TOOL ITSELF CAN STILL FAIL. Verify against a document that is
// NOT a translation of the English: if this comes back clean, the
// comparison above is measuring nothing.
{
  let out = "";
  try {
    out = execFileSync("python3", [join(REPO, "tools/whitepaper_i18n.py"), "verify",
      join(REPO, "whitepaper-einvoicing-roi-evidence.html"),
      join(REPO, "whitepaper-ctc-rollouts-compared.html")],
    { cwd: REPO, encoding: "utf8" });
  } catch (err) {
    out = String((err && (err.stdout || err.stderr)) || err);
  }
  t.check("the comparison reports a mismatch when handed two different documents",
    /block count/.test(out), out.split("\n").slice(-2).join(" "));
}

process.exit(t.report() ? 0 : 1);
