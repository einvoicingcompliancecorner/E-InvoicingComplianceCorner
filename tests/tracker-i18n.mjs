#!/usr/bin/env node
// tracker-i18n.mjs — every translation key the static pages ask for
// exists, and every language file holds the same key set.
//
//   node tests/tracker-i18n.mjs
//
// THE BUG CLASS THIS CLOSES, and it was live when this file was written.
// `t('backLink')` is called from eleven places in the tracker — it is the
// "← Back to global tracker" control on every in-page panel — and no
// language file had ever defined it. Every call site is written
//
//     const closeLabel = (i18n && i18n.t('backLink')) || '← Back to global tracker';
//
// so the miss is invisible in English and invisible in the console: the
// loader returns null for a key it does not have, the `||` supplies the
// English, and a German reader gets an English control on seven panels
// with nothing anywhere reporting a problem. `archive.loading` and
// `archive.officialSource` were missing the same way.
//
// That fallback is the right pattern — a panel with no back link at all
// would be worse — but it turns a missing translation from a visible
// failure into a silent one, and a silent failure needs a check or it is
// not caught at all. This is that check.
//
// TWO HALVES, because neither is sufficient alone.
//
//   1. RESOLUTION. Every literal key a page references resolves in that
//      page's own English file. Catches a key that was never added, and a
//      key whose name drifted from its definition.
//
//   2. PARITY. Every language file holds exactly English's key set, no
//      more and no less. Catches a key added to English and forgotten in
//      the other three — and it is also what covers the references half 1
//      cannot see, the ones built at runtime like
//      `carousel.${s.i18nKey}Title`. Those are reported as uncheckable
//      rather than passed over in silence, because a check that quietly
//      skips things reads exactly like a check that covers them.
//
// NAMESPACES. A page picks its file with a data-namespace attribute on
// the loader script tag (see CONTENT_NAMESPACE in i18n/i18n.js), so
// privacy-policy.html resolves against i18n/en-privacy-policy.json and
// the tracker, which sets none, resolves against i18n/en.json. The
// mapping is read from the pages rather than listed here: a list stays
// correct and stops being complete, which is the failure mode of every
// registry this repository has had to repair.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const I18N = join(REPO, "i18n");

// THE LANGUAGE LIST IS READ FROM THE LOADER, not repeated here. i18n.js's
// SUPPORTED_LANGUAGES is what actually decides which files the site will
// ever fetch, and its own header ends "No other code changes needed" —
// which stays true only if this check discovers a new language rather
// than waiting to be told about it. Migration 589 deleted a duplicate
// SUPPORTED_LANGS for the same reason: a runbook line telling someone to
// keep two lists in step is a defect with documentation attached.
const LOADER = readFileSync(join(I18N, "i18n.js"), "utf8");
const LANGS = [...LOADER.slice(LOADER.indexOf("const SUPPORTED_LANGUAGES = ["),
  LOADER.indexOf("];", LOADER.indexOf("const SUPPORTED_LANGUAGES = [")))
  .matchAll(/code:\s*"([a-z-]+)"/g)].map((m) => m[1]);
if (LANGS.length < 2 || !LANGS.includes("en")) {
  console.error("could not read SUPPORTED_LANGUAGES out of i18n/i18n.js — if it was "
    + "renamed or restructured, fix it here rather than letting this check pass on "
    + "an empty list.");
  process.exit(1);
}

const PAGES = readdirSync(REPO)
  .filter((f) => f.endsWith(".html"))
  .map((f) => ({ file: f, text: readFileSync(join(REPO, f), "utf8") }))
  .filter((p) => p.text.includes("data-i18n") || p.text.includes("EICC_I18N"))
  .map((p) => ({
    ...p,
    ns: (p.text.match(/data-namespace="([^"]*)"/) || [, ""])[1],
  }));

const fileFor = (lang, ns) => join(I18N, ns ? `${lang}-${ns}.json` : `${lang}.json`);
const load = (lang, ns) => JSON.parse(readFileSync(fileFor(lang, ns), "utf8"));

/** Every dotted leaf path in a language file, `_meta` excluded — it is
 *  the file's own bookkeeping (label, reviewed flag) and never a lookup. */
function leaves(node, prefix = "") {
  const out = new Set();
  for (const [k, v] of Object.entries(node)) {
    if (!prefix && k === "_meta") continue;
    const path = prefix + k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const sub of leaves(v, path + ".")) out.add(sub);
    } else if (typeof v === "string") {
      out.add(path);
    }
  }
  return out;
}

/** The three reference forms the site uses, all of them from one line:
 *    data-i18n="a.b"                    applied by applyToDom() at init
 *    data-i18n-attr="placeholder:a.b"   same, onto an attribute
 *    t('a.b') / t("a.b")                called for markup built later
 *  Returns [key, isDynamic] pairs. */
function* references(line) {
  // A comment describing the mechanism is not a call site. i18n.js's own
  // header says data-i18n="key" while explaining how to use it, and the
  // tracker repeats it — a literal "key" would otherwise fail this check
  // forever, which teaches everyone to ignore it.
  const code = line.replace(/^\s*(\/\/|\*|<!--).*$/, "");
  for (const m of code.matchAll(/data-i18n="([^"]+)"/g)) yield m[1];
  for (const m of code.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(",")) {
      const [, key] = pair.split(":").map((s) => s.trim());
      if (key) yield key;
    }
  }
  for (const m of code.matchAll(/\.t\(\s*'([^']+)'\s*\)/g)) yield m[1];
  for (const m of code.matchAll(/\.t\(\s*"([^"]+)"\s*\)/g)) yield m[1];
}

const t = suite("tracker i18n");
const dynamic = new Set();
let totalRefs = 0;

// ---- half 1: every literal reference resolves in its own namespace -----
for (const page of PAGES) {
  const enKeys = leaves(load("en", page.ns));
  const unresolved = [];
  page.text.split("\n").forEach((line, i) => {
    for (const key of references(line)) {
      if (key.includes("${")) { dynamic.add(`${key} (${page.file})`); continue; }
      totalRefs++;
      if (!enKeys.has(key)) unresolved.push(`${key}   line ${i + 1}`);
    }
  });
  t.check(
    `${page.file} — every key resolves in ${page.ns ? `en-${page.ns}` : "en"}.json`,
    unresolved.length === 0,
    unresolved.map((u) => `\n         ${u}`).join(""),
  );
}

// Not a pass or a fail — a statement of what half 1 could not see, put in
// front of whoever reads the output rather than left implicit.
console.log(`  note  ${totalRefs} literal references checked; `
  + `${dynamic.size} runtime-built pattern(s) not resolvable from source, `
  + `covered by parity below: ${[...dynamic].join(", ") || "none"}`);

// ---- half 2: the four files of each namespace hold the same keys ------
//
// `<lang>-data.json` is deliberately not here. It is the DATA-entry
// dictionary keyed by country id, not a translation namespace — it has no
// English file at all, because English lives in the tracker's own DATA
// array. Named rather than silently filtered, so nobody has to work out
// whether its absence is an oversight.
const NAMESPACES = [...new Set(PAGES.map((p) => p.ns))].sort();
for (const ns of NAMESPACES) {
  const enKeys = leaves(load("en", ns));
  for (const lang of LANGS.filter((l) => l !== "en")) {
    const path = fileFor(lang, ns);
    if (!existsSync(path)) {
      t.check(`${lang}${ns ? `-${ns}` : ""}.json exists`, false, "no such file");
      continue;
    }
    const keys = leaves(load(lang, ns));
    const missing = [...enKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !enKeys.has(k));
    t.check(
      `i18n/${lang}${ns ? `-${ns}` : ""}.json holds exactly English's ${enKeys.size} keys`,
      missing.length === 0 && extra.length === 0,
      [
        missing.length ? `\n         missing ${missing.length}: ${missing.slice(0, 8).join(", ")}` : "",
        extra.length ? `\n         extra ${extra.length}: ${extra.slice(0, 8).join(", ")}` : "",
      ].join(""),
    );
  }
}

// ---- and the empty-string trap ----------------------------------------
//
// A key present with an empty value passes both halves above and renders
// nothing, which on a back link is a control that exists, occupies space
// and cannot be seen. Cheap to state, so it is stated.
const blanks = [];
for (const ns of NAMESPACES) {
  for (const lang of LANGS) {
    const path = fileFor(lang, ns);
    if (!existsSync(path)) continue;
    const data = load(lang, ns);
    for (const k of leaves(data)) {
      let node = data;
      for (const part of k.split(".")) node = node[part];
      if (String(node).trim() === "") blanks.push(`${lang}${ns ? `-${ns}` : ""}.json:${k}`);
    }
  }
}
t.check("no translation anywhere is an empty string", blanks.length === 0, blanks.join(", "));

process.exit(t.report() ? 0 : 1);
