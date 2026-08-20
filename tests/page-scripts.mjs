#!/usr/bin/env node
// page-scripts.mjs — the shared scripts and each page's own inline script
// share one global scope, and must not fight over a name.
//
//   node tests/page-scripts.mjs
//
// THE BUG THIS EXISTS FOR, from 20 August 2026 and caught the same hour.
//
// The signed-in greeting was added to i18n/i18n.js with a top-level
// `const MEMBERS_ORIGIN`. The tracker's own inline script has declared
// that exact name since the archive panel was built. Both are classic
// scripts, so both land in the same global scope, and the second one
// throws:
//
//     SyntaxError: Identifier 'MEMBERS_ORIGIN' has already been declared
//
// WHICH KILLS THE WHOLE SCRIPT, not the one line. Every in-page panel,
// the filters, the carousel, the deep dives — none of it runs. And the
// page still LOOKS fine on first glance, because the HTML and CSS are
// untouched and the board renders from static markup. It stops behaving,
// which is much harder to see than it stopping rendering.
//
// It was found by watching for page errors during a browser check, not by
// looking at the page. Nothing in this repository would have failed.
//
// The rule is cheap to state and cheap to check: no identifier declared
// at the top level of a shared script may also be declared at the top
// level of any page's inline script.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { suite } from "./lib/browser.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));

// Scripts every page pulls in, whose scope the page then shares.
//
// auth-overlay.js joined on 20 August 2026. It is written as an IIFE and
// therefore declares NOTHING at the top level today — which is exactly
// why it belongs on this list rather than being left off it. The rule
// this suite enforces is cheap while a file is clean and expensive to
// retrofit after someone has hoisted one constant out of the closure.
const SHARED = ["i18n/i18n.js", "countries.js", "map-panel.js", "auth-overlay.js"];

/** Top-level declarations only — column zero, no leading whitespace.
 *  Anything indented is inside a function, an object or a block, and
 *  cannot collide. Deliberately crude: a real parser would be more
 *  accurate and this catches the shape that actually bites, which is
 *  someone adding a module-level constant to a shared file. */
function topLevelNames(src) {
  const names = new Map();
  src.split("\n").forEach((line, i) => {
    const m = line.match(/^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/);
    if (m && !names.has(m[1])) names.set(m[1], i + 1);
  });
  return names;
}

/** The inline scripts of an HTML page, with the line each one starts on
 *  so a collision can be reported where it lives. */
function inlineScripts(html) {
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ code: m[1], line: html.slice(0, m.index).split("\n").length });
  }
  return out;
}

const t = suite("page scripts");

const sharedNames = new Map();  // name -> file it came from
for (const rel of SHARED) {
  let src;
  try { src = readFileSync(join(REPO, rel), "utf8"); } catch { continue; }
  for (const [name] of topLevelNames(src)) {
    if (!sharedNames.has(name)) sharedNames.set(name, rel);
  }
}
t.check(`the shared scripts declare ${sharedNames.size} top-level name(s)`,
  sharedNames.size > 0);

const pages = readdirSync(REPO).filter((f) => f.endsWith(".html"));
let checked = 0;
for (const page of pages) {
  const html = readFileSync(join(REPO, page), "utf8");
  // Only pages that actually load the shared scripts share their scope.
  if (!SHARED.some((s) => html.includes(s))) continue;
  checked++;
  const clashes = [];
  for (const { code, line } of inlineScripts(html)) {
    for (const [name, at] of topLevelNames(code)) {
      if (sharedNames.has(name)) {
        clashes.push(`${name} (line ~${line + at}, also top-level in ${sharedNames.get(name)})`);
      }
    }
  }
  t.check(`${page} declares nothing the shared scripts already do`,
    clashes.length === 0,
    clashes.length
      ? `\n         ${clashes.join("\n         ")}`
        + "\n         A duplicate top-level const throws, and the throw kills the"
        + "\n         ENTIRE inline script — every panel, filter and handler on the"
        + "\n         page — while the page still renders and looks fine."
      : "");
}
t.check(`${checked} page(s) share scope with a shared script and were checked`,
  checked > 0, checked);

// ---- and the greeting is actually wired to something -------------------
//
// A PAIRING CHECK, written after the feature disappeared and nothing
// noticed. The signed-in greeting is two halves in two files: i18n.js
// renders it, the tracker provides the element it renders into. During
// this same change a stray `git checkout` reverted the i18n.js half —
// and FOURTEEN SUITES PASSED with the feature entirely absent, because
// every one of them checks something else. The element sat in the page
// with nothing to fill it, the translation keys sat in four JSON files
// with nothing to read them, and it all looked perfectly healthy.
//
// Neither half is worth anything alone, so this asserts the pair. It is
// deliberately specific rather than a general "is every id driven by
// something" rule: that version is noisy, and noise is how a check gets
// switched off.
const i18nSrc = readFileSync(join(REPO, "i18n/i18n.js"), "utf8");
const trackerSrc = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");

t.check("i18n.js still defines the signed-in greeting",
  /EICC_WHO\s*=\s*\{/.test(i18nSrc) && /getElementById\("whoAmI"\)/.test(i18nSrc));
t.check("and the tracker still provides the element it renders into",
  /id="whoAmI"/.test(trackerSrc));
t.check("and it re-renders when the language changes, or the label freezes",
  /eicc:languageChanged[\s\S]{0,120}EICC_WHO\.render/.test(i18nSrc));
t.check("and the greeting's own strings resolve in every language",
  ["en", "es", "de", "fr"].every((l) => {
    const d = JSON.parse(readFileSync(join(REPO, `i18n/${l}.json`), "utf8"));
    return d.who && d.who.signedInAs && d.who.signOut;
  }));

// ---- and nothing links to a POST-only route ---------------------------
//
// THE BUG: the greeting's sign-out was written as
// <a href=".../members/logout">. That route is POST-only, so the link
// 404'd — and left the reader believing they had signed out while the
// session was completely untouched. The worst of both: a dead end that
// looks like success.
//
// /members/logout is POST-only on purpose. A GET logout can be fired by
// any page anywhere with an <img src="...logout">, signing people out of
// a site they were using. Every in-page logout button on the members side
// has always been a form for exactly that reason — the rule existed and
// was well understood, and the new control simply did not follow it.
//
// So the check is the rule, not the instance: read the POST-only paths
// out of members-worker's router, and refuse an anchor pointing at any of
// them from the shared scripts or the pages.
const workerSrc = readFileSync(join(REPO, "members-worker/src/index.js"), "utf8");
const postOnly = new Set();
const getPaths = new Set();
for (const m of workerSrc.matchAll(
  /request\.method === "(GET|POST)" && url\.pathname === "([^"]+)"/g)) {
  (m[1] === "POST" ? postOnly : getPaths).add(m[2]);
}
// A path served for BOTH verbs is fine to link to.
for (const p of getPaths) postOnly.delete(p);
t.check(`members-worker has ${postOnly.size} POST-only route(s) to protect`,
  postOnly.size > 0, [...postOnly].join(", "));

const linkSources = [
  ["i18n/i18n.js", i18nSrc],
  ["einvoicing-compliance-tracker.html", trackerSrc],
];
const badLinks = [];
for (const [name, src] of linkSources) {
  for (const path of postOnly) {
    // An <a href> or a JS-built anchor string pointing at the route.
    const re = new RegExp(`<a[^>]*href=["'\`][^"'\`]*${path.replace(/\//g, "\\/")}`, "g");
    if (re.test(src)) badLinks.push(`${name} links to ${path}`);
  }
}
t.check("nothing renders an <a> to a POST-only route",
  badLinks.length === 0,
  badLinks.length
    ? `\n         ${badLinks.join("\n         ")}`
      + "\n         That route answers POST only, so the link 404s — and the"
      + "\n         reader believes the action succeeded. Use a form."
    : "");

// And the specific pairing, since sign-out is the one that bit.
t.check("sign-out is a form POST, not a link",
  /method="POST"[\s\S]{0,200}\/members\/logout/.test(i18nSrc)
    || /\/members\/logout[\s\S]{0,200}method="POST"/.test(i18nSrc),
  "the greeting must submit sign-out, not link to it");

process.exit(t.report() ? 0 : 1);
