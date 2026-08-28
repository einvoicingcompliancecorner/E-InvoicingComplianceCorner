#!/usr/bin/env node
// palette.mjs — one palette, in sync, contrast-checked, in both themes.
//
//   node tests/palette.mjs
//
// ---- THE CHECK THIS FILE EXISTS FOR ------------------------------------
//
// On 28 August 2026 I told Dan the palette was defined sixteen times and
// that all sixteen were byte-identical, so consolidating them would be
// mechanical. Both halves were wrong. It was 23 :root blocks across 18
// files, and `--stamp-dim` was #7c3648 in four education pages against
// #7c3628 in the other fourteen places -- a deltaE76 of 19.8 where a
// just-noticeable difference is about 2.3, rendering live on the
// pitfall-card border of education-preparing-for-mandate.
//
// I produced that claim by comparing four properties -- ink, paper,
// stamp, soon -- finding them identical and concluding the palette was.
// Those four have never drifted. The check could not have failed on the
// one that did, which is the seventh time this repository has found a
// check satisfied by something other than the thing it claimed to test.
//
// So: check 1 below asserts that NO property is ever defined with two
// different values anywhere in the tree, which is the check that would
// have caught it, and it is break-tested in its own comment.
import { suite, launch } from "./lib/browser.mjs";
import { openReplayDb } from "./lib/replay-db.mjs";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import { extname, normalize } from "node:path";
import { DARK, LIGHT, PARTNER_THEMES, CONTRAST_PAIRS, contrast } from "../shared/palette.mjs";
import { PALETTE_FILES, BOOT_FILES } from "../tools/sync-palette.mjs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const t = suite("palette");

// ---- 1. no property has two values anywhere in the tree ---------------
//
// Break-tested: changing one --stamp-dim back to #7c3648 in a single
// education page fails this with both values and both filenames named.
const SCAN = [...PALETTE_FILES, "index.html", "map-panel.js", "i18n/i18n.js"];
const defs = new Map();
for (const rel of SCAN) {
  let src;
  try { src = readFileSync(join(REPO, rel), "utf8"); } catch { continue; }
  for (const block of src.match(/:root(?:\[[^\]]*\])?\s*\{(?:\s*--[\w-]+\s*:[^;{}]*;)+\s*\}/g) || []) {
    // Partner blocks are allowed to differ -- that is what a theme IS.
    if (/:root\[/.test(block)) continue;
    for (const [, prop, val] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const v = val.trim();
      if (!defs.has(prop)) defs.set(prop, new Map());
      const m = defs.get(prop);
      if (!m.has(v)) m.set(v, []);
      m.get(v).push(rel);
    }
  }
}
const conflicts = [...defs.entries()]
  .filter(([, vals]) => vals.size > 1)
  .map(([prop, vals]) => `${prop}: ` + [...vals.entries()]
    .map(([v, files]) => `${v} in ${files.length} file(s) (${files[0]})`).join(" vs "));
t.check("no property is defined with two different values", conflicts.length === 0,
  conflicts.join("; "));

// ---- 2. the generated blocks match the module -------------------------
let syncOut = "";
try {
  syncOut = execFileSync("node", [join(REPO, "tools/sync-palette.mjs"), "--check"],
    { cwd: REPO, encoding: "utf8" });
} catch (err) {
  syncOut = String((err && (err.stdout || err.stderr)) || err);
}
t.check("every file's palette block matches shared/palette.mjs",
  /in sync/.test(syncOut), syncOut.trim().split("\n").slice(0, 3).join(" | "));

// ---- 3. no page defines a palette the generator does not know about ---
//
// A page that grows its own :root is the mechanism that produced the
// drift in the first place. This fails on the page rather than waiting
// for the values to disagree.
const strayFiles = [];
for (const rel of ["index.html", "map-panel.js", "i18n/i18n.js"]) {
  let src;
  try { src = readFileSync(join(REPO, rel), "utf8"); } catch { continue; }
  if (/:root\s*\{(?:\s*--[\w-]+\s*:[^;{}]*;)+\s*\}/.test(src)) strayFiles.push(rel);
}
t.check("no file outside the generator's list defines the palette",
  strayFiles.length === 0, strayFiles.join(", "));

// ---- 4. every theme meets every contrast floor ------------------------
//
// The pairs are declared in shared/palette.mjs beside the values, and
// each names a place two of them actually meet in the CSS. A partner
// palette cannot be registered without being measured.
for (const [name, theme] of [["default", DARK], ...Object.entries(PARTNER_THEMES)]) {
  const missing = CONTRAST_PAIRS.filter(([, a, b]) => !theme[a] || !theme[b])
    .map(([label]) => label);
  t.check(`${name}: every property a contrast pair names is defined`,
    missing.length === 0, missing.join(", "));
  const failed = CONTRAST_PAIRS
    .filter(([, a, b]) => theme[a] && theme[b])
    .map(([label, a, b, need]) => [label, contrast(theme[a], theme[b]), need])
    .filter(([, got, need]) => got < need)
    .map(([label, got, need]) => `${label} ${got.toFixed(2)} < ${need}`);
  t.check(`${name}: every contrast pair clears its floor`, failed.length === 0,
    failed.join("; "));
}

// ---- 5. the themes agree on which properties exist --------------------
//
// A partner theme missing a property inherits the default's value for it,
// which across a light/dark boundary means dark-theme text on a light
// surface. Invisible, and invisible only to that partner's readers.
for (const [slug, theme] of Object.entries(PARTNER_THEMES)) {
  const missing = Object.keys(DARK).filter((k) => !(k in theme));
  const extra = Object.keys(theme).filter((k) => !(k in DARK));
  t.check(`${slug} defines exactly the properties the default does`,
    missing.length === 0 && extra.length === 0,
    [missing.length ? `missing ${missing.join(",")}` : "",
      extra.length ? `extra ${extra.join(",")}` : ""].filter(Boolean).join(" | "));
}

// ---- 6. D1 and the module agree --------------------------------------
//
// The migration's rows are generated from the module. If somebody edits
// one without the other, the site would theme from D1 while every test
// measured the module -- the two-sources problem this whole file exists
// to prevent, one level up.
const { d1 } = await openReplayDb();
const rows = (await d1.prepare(
  `SELECT p.slug, pp.prop, pp.value FROM partner_palette pp
     JOIN partners p ON p.id = pp.partner_id`).all()).results || [];
const byPartner = {};
for (const r of rows) (byPartner[r.slug] ||= {})[r.prop] = r.value;
for (const [slug, theme] of Object.entries(PARTNER_THEMES)) {
  const stored = byPartner[slug] || {};
  const diffs = Object.entries(theme)
    .filter(([k]) => k !== "--radius")
    .filter(([k, v]) => stored[k] !== v)
    .map(([k, v]) => `${k}: module ${v} vs D1 ${stored[k] ?? "(absent)"}`);
  t.check(`${slug}'s palette in D1 matches the module`, diffs.length === 0,
    diffs.slice(0, 3).join("; "));
}

// ---- 7. the boot script cannot be fooled ------------------------------
const boot = (await import("../shared/palette.mjs")).themeBootScript();
t.check("the boot script is inline and sets the attribute",
  boot.startsWith("<script>") && boot.includes("data-eicc-theme"));
t.check("the boot script only honours a registered slug",
  Object.keys(PARTNER_THEMES).every((s) => boot.includes(s))
  && boot.includes("indexOf"));

// ---- 7b. the pages carry the CURRENT boot script -----------------------
//
// THE DEFECT THIS EXISTS FOR. Check 7 reads themeBootScript() and asserts
// things about its output, which is the module. The fourteen static pages
// carry a PASTED COPY -- the renderers interpolate it, a static file
// cannot -- and from the moment it was pasted they stopped tracking the
// module. Adding ?skin= to the module on 28 August therefore did nothing
// at all on the tracker, which is a static page, while check 7 and every
// other check here passed.
//
// Same shape as the palette drift one level down: a value that exists in
// two places with only one of them generated. The boot script is
// generated now, and this fails when a page's copy is stale.
const bootWanted = "<!-- theme:boot -->" + boot;
const staleBoot = BOOT_FILES.filter((rel) => {
  const src = readFileSync(join(REPO, rel), "utf8");
  return !src.includes(bootWanted);
});
t.check("every static page carries the current boot script",
  staleBoot.length === 0, staleBoot.join(", "));

// ---- 7c. ?skin= resolves in the right order, and is not remembered -----
t.check("the boot script reads the skin parameter",
  /URLSearchParams/.test(boot) && /"skin"/.test(boot));
// THE SKIN IS THE URL'S, NOT THE VISITOR'S. The first version held it in
// per-tab sessionStorage so it survived a click. Dan saw that running and
// asked for the opposite, so the boot script now writes NOTHING: no
// cookie, no sessionStorage, no localStorage. This is the check that
// stops the storage layer coming back by accident -- and check 8 below
// proves the consequence in a browser rather than in a regex.
t.check("the boot script stores the skin nowhere at all",
  !/document\.cookie\s*=/.test(boot)
  && !/sessionStorage/.test(boot)
  && !/localStorage/.test(boot),
  "the boot script must not persist the skin");
// Order matters: the cookie is a verified claim, ?skin= is only a
// referral, and a subscriber following someone else's skinned link must
// keep their own colours.
t.check("the cookie is consulted before the URL",
  boot.indexOf("eicc_theme") < boot.indexOf("skin"));

// ---- 8. and it works in a browser, both ways --------------------------
//
// SERVES ITSELF ON AN EPHEMERAL PORT. A fixed port is a trap this repo has
// already paid for: map-labels.mjs assumed a `npm run preview` on 8788,
// was green twice, and failed the day that server was not running. It also
// has to be http rather than file://, because a cookie is the whole
// mechanism under test and file:// has no cookie jar.
//
// Reading the module tells you what the code says. Loading the page with
// the cookie set tells you what a reader gets, which is the only version
// of this that can fail on a boot script that throws.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const rel = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(REPO, rel);
  if (!existsSync(file) || !statSync(file).isFile()) file += ".html";
  if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end("nope"); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

const browser = await launch();
const results = [];
const jsErrors = [];
//
// THE FOURTH COLUMN IS THE POINT OF THIS BLOCK. Each case says what the
// landing page resolves to AND what the NEXT page resolves to, navigated
// to with no parameter. Those two differ for exactly one source: the
// cookie is a property of the reader and follows them, while ?skin= is a
// property of the URL and does not. Asserting one number for both --
// which is what this loop did until Dan asked for the change -- cannot
// tell a skin that persists from one that does not.
for (const [tag, slug, expect, qs, expectNext] of [
  ["no cookie", null, DARK["--ink"], "", DARK["--ink"]],
  ["tradeshift", "tradeshift", LIGHT["--ink"], "", LIGHT["--ink"]],
  ["forged slug", "not-a-partner", DARK["--ink"], "", DARK["--ink"]],
  // A visitor arriving from a partner's own website, not signed in. The
  // landing page wears the partner's colours; the moment they navigate on
  // their own, they are on the site's own site.
  ["?skin=tradeshift", null, LIGHT["--ink"], "?skin=tradeshift", DARK["--ink"]],
  ["?skin=nonsense", null, DARK["--ink"], "?skin=nonsense", DARK["--ink"]],
  // Identity beats provenance: a verified subscriber keeps their own
  // colours through a link skinned for somebody else -- and keeps them
  // afterwards too, because the cookie is still there.
  ["cookie over skin", "tradeshift", LIGHT["--ink"], "?skin=nonsense", LIGHT["--ink"]]]) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
  if (slug) {
    await ctx.addCookies([{ name: "eicc_theme", value: slug, domain: "127.0.0.1", path: "/" }]);
  }
  const page = await ctx.newPage();
  // pageerror only, not t.watch(). The tracker pulls a font and a
  // favicon that this bare static server does not carry, and a console
  // 404 for those is a fact about the harness rather than about the
  // theme. A thrown boot script IS a fact about the theme, and that is
  // what pageerror reports.
  page.on("pageerror", (e) => jsErrors.push(`${tag}: ${e.message}`));
  await page.goto(`${ORIGIN}/einvoicing-compliance-tracker.html${qs || ""}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const ink = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--ink").trim());
  // Second navigation, same tab, no parameter. A cookie survives it; a
  // skin must not.
  await page.goto(`${ORIGIN}/education-mandate-types.html`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const inkNext = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--ink").trim());
  results.push([tag, ink, expect, inkNext, expectNext]);
  await ctx.close();
}
await browser.close();
t.check("the boot script throws nothing in any of the three cases",
  jsErrors.length === 0, jsErrors.join("; "));
for (const [tag, got, expect, next, expectNext] of results) {
  t.check(`in a browser, "${tag}" resolves --ink to ${expect}`, got === expect, `got ${got}`);
  t.check(`and on the next page with no parameter, "${tag}" resolves to ${expectNext}`,
    next === expectNext, `got ${next}`);
}

// ---- 9. a session that predates the theme still gets one --------------
//
// THE DEFECT THIS CHECK EXISTS FOR. Phase two applied the theme purely
// from the eicc_theme cookie, which is written when a session is MINTED.
// Every reader already signed in when it deployed had no such cookie and
// therefore no theme on any page -- which is every reader, since the
// feature shipped to a live site. Dan reported it as five separate pages
// not reacting; the shared cause was that the cookie is never issued to a
// session that already exists.
//
// Checks 1-8 all passed while that was true, because every one of them
// set the cookie first. A check that arranges the precondition it is
// meant to be testing cannot fail on the precondition being absent.
//
// So this asserts the two properties that fix it, on the render path
// rather than on the cookie: a page rendered FOR A KNOWN READER stamps
// the attribute itself, and it hands back a cookie so the public cached
// pages learn who is reading.
const STAMP = /<html(?![^>]*data-eicc-theme)([^>]*)>/i;
const sample = '<!DOCTYPE html><html lang="en"><head></head><body></body></html>';
const stamped = sample.replace(STAMP, '<html$1 data-eicc-theme="tradeshift">');
t.check("the stamp regex adds the attribute to a bare <html>",
  stamped.includes('<html lang="en" data-eicc-theme="tradeshift">'), stamped.slice(0, 70));
t.check("and does not add a second one",
  stamped.replace(STAMP, '<html$1 data-eicc-theme="x">') === stamped);

// Both Workers must carry the stamp AND issue the cookie. Asserted
// against the source, because the alternative is a fixture that mounts
// two Workers and a KV, and the property is structural: the code either
// contains both halves on the per-reader paths or it does not.
const members = readFileSync(join(REPO, "members-worker/src/index.js"), "utf8");
const site = readFileSync(join(REPO, "site-worker/src/index.js"), "utf8");
t.check("members-worker stamps every authenticated HTML page",
  /withPartnerTheme\(request, env,/.test(members) && /data-eicc-theme="\$\{slug\}"/.test(members));
t.check("members-worker issues the cookie on those pages",
  /headers\.append\("Set-Cookie", themeCookie\(slug/.test(members));
t.check("site-worker stamps its two gated pages",
  (site.match(/withPartnerTheme\(html,/g) || []).length >= 2);
t.check("site-worker issues the cookie on both of them",
  (site.match(/themeCookieHeader\(/g) || []).length >= 3);

// ---- 10. and it reaches a page opened IN-FRAME ------------------------
//
// THE SECOND DEFECT CHECK 8 COULD NOT SEE. Dan, 28 August: "launching
// these pages in standalone mode shows the new branding, however when
// launched in-frame the old branding is shown." Deep dives, the map, the
// sources page and everything under the Education menu open in a shadow
// root, and the mount rewrote the fetched page's :root{...} to :host{...}
// -- which re-declared the DEFAULT palette inside the shadow, where it
// beat the values inherited from the outer document. The partner block
// was not rewritten at all, because /:root\{/ does not match
// `:root[data-eicc-theme="x"]{`.
//
// Check 8 loads pages standalone and could never have seen it. This one
// opens a panel the way the menu does and reads the computed value INSIDE
// the shadow root, which is the only place the bug existed.
const ifrBrowser = await launch();
const frameResults = [];
for (const [tag, slug, expect] of [["no cookie", null, DARK["--ink"]],
  ["tradeshift", "tradeshift", LIGHT["--ink"]]]) {
  const ctx = await ifrBrowser.newContext({ viewport: { width: 1200, height: 900 } });
  if (slug) {
    await ctx.addCookies([{ name: "eicc_theme", value: slug, domain: "127.0.0.1", path: "/" }]);
  }
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/einvoicing-compliance-tracker.html`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  const opened = await page.evaluate(() => {
    const link = [...document.querySelectorAll("a.dropdown-item")]
      .find((a) => /education|mandate-types|provider/i.test(a.getAttribute("href") || ""));
    if (!link) return false;
    link.click();
    return true;
  });
  await page.waitForTimeout(2200);
  const ink = await page.evaluate(() => {
    const host = [...document.querySelectorAll("*")].find((e) => e.shadowRoot);
    if (!host) return "(no shadow root)";
    return getComputedStyle(host).getPropertyValue("--ink").trim();
  });
  frameResults.push([tag, opened, ink, expect]);
  await ctx.close();
}
await ifrBrowser.close();
for (const [tag, opened, got, expect] of frameResults) {
  t.check(`a panel opened in-frame, "${tag}", inherits --ink ${expect}`,
    opened && got === expect, opened ? `got ${got}` : "the menu item was not found");
}

// The mount must not re-declare the palette at all -- inheritance is the
// mechanism, and a :host{--ink:...} block inside the shadow is the defect
// wearing a different selector.
const tracker = readFileSync(join(REPO, "einvoicing-compliance-tracker.html"), "utf8");
t.check("every shadow mount goes through the one scoping helper",
  (tracker.match(/scopeForShadow\(/g) || []).length >= 10,
  `${(tracker.match(/scopeForShadow\(/g) || []).length} references`);
t.check("no mount rewrites :root to :host by hand any more",
  !/\.replace\(\/?:?root/.test(tracker.replace(/function scopeForShadow[\s\S]*?\n\}/, "")));

// ---- 11. the side menu and the menu buttons are actually themed -------
//
// Contrast pairs prove the VALUES are legible together. They cannot prove
// the components read them: a rule still pointing at --ink-2 would pass
// every pair in check 4 while the sidebar sat on the page ground. So this
// renders the tracker under both themes and reads the computed colours
// off the real elements.
//
// Dan asked for #242DC2 with white text on the side menu, then for the
// three menu buttons to match. Both are asserted against the value he
// gave rather than against the palette, so a future edit to the palette
// that quietly moves either one fails here with the old and new values.
const compBrowser = await launch();
const seen = {};
for (const [tag, slug] of [["default", null], ["tradeshift", "tradeshift"]]) {
  const ctx = await compBrowser.newContext({ viewport: { width: 1200, height: 900 } });
  if (slug) {
    await ctx.addCookies([{ name: "eicc_theme", value: slug, domain: "127.0.0.1", path: "/" }]);
  }
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/einvoicing-compliance-tracker.html`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  seen[tag] = await page.evaluate(() => {
    const g = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : "(missing)";
    };
    return {
      sidebarBg: g(".sidebar", "backgroundColor"),
      countryInk: g(".sidebar-country .c-name", "color"),
      navBg: g(".menu-trigger", "backgroundColor"),
      navInk: g(".menu-trigger", "color"),
    };
  });
  await ctx.close();
}
await compBrowser.close();

const rgb = (hex) => {
  const h = hex.replace("#", "");
  return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`;
};
t.check("default: the side menu keeps the page's raised surface",
  seen.default.sidebarBg === rgb(DARK["--ink-2"]), seen.default.sidebarBg);
t.check("default: the menu buttons keep the alert red",
  seen.default.navBg === rgb(DARK["--stamp"]), seen.default.navBg);
t.check('tradeshift: the side menu is #242DC2',
  seen.tradeshift.sidebarBg === rgb("#242dc2"), seen.tradeshift.sidebarBg);
t.check("tradeshift: side-menu country names are white",
  seen.tradeshift.countryInk === rgb("#ffffff"), seen.tradeshift.countryInk);
t.check("tradeshift: the menu buttons are the same #242DC2",
  seen.tradeshift.navBg === rgb("#242dc2"), seen.tradeshift.navBg);
t.check("tradeshift: menu-button text is white",
  seen.tradeshift.navInk === rgb("#ffffff"), seen.tradeshift.navInk);

// ---- 10. an iframe is a second document and must be told -------------
//
// THE DEFECT THIS EXISTS FOR, reported by Dan the day the storage went:
// "The menu -> methodology, does not retain partner branding." Six
// routes on this page open in an iframe rather than a shadow root --
// methodology, what changed, the whitepaper pop-out, and the shared
// panel that hosts the planner, the compliance guides and the spec
// register. A shadow root inherits custom properties from this
// document; an iframe inherits nothing and resolves its own theme from
// its own URL.
//
// While ?skin= lived in sessionStorage those frames worked without
// anyone arranging it, because same-origin frames in one tab share it.
// Taking the storage out took the theme out of all six at once, and
// every check in this file stayed green -- none of them opens a frame.
for (const [what, re] of [
  ["the doc pop-outs (methodology, what changed)",
    /const src = withThemeParam\(`\$\{route\}\?frame=1/],
  ["the framed panel (planner, guides, spec register)",
    /const src = withThemeParam\(`\$\{cfg\.src\}/],
  ["the whitepaper pop-out",
    /const themed = withThemeParam\(target\)/]]) {
  t.check(`${what} carries the theme into the frame`, re.test(tracker));
}

// AND A SEVENTH WOULD SLIP THROUGH. The three checks above name the
// three call sites, so they cannot notice a fourth being added -- the
// exact shape this file has been caught by twice. This counts every
// place the page writes a src at all and fails when the number moves,
// so a new one has to be looked at and classified rather than landing
// silently. Six today: three themed above, one about:blank teardown,
// and two <script> loads, which are not documents and have no theme.
const srcWrites = tracker.match(/setAttribute\('src'|\w+\.src = |src="\$\{src\}"/g) || [];
t.check("every place the tracker writes a src is accounted for",
  srcWrites.length === 6,
  `found ${srcWrites.length}, expected 6 — if you added an iframe, route its `
  + "src through withThemeParam() and raise this number; if you added a "
  + "<script>, just raise it");

// ---- 10b. and it behaves, in a browser -------------------------------
const iframeBrowser = await launch();
{
  const ctx = await iframeBrowser.newContext({ viewport: { width: 1100, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/einvoicing-compliance-tracker.html?skin=tradeshift`,
    { waitUntil: "load" });
  await page.waitForTimeout(500);
  const seen = await page.evaluate(() => ({
    same: withThemeParam("/methodology?frame=1&lang=en"),
    external: withThemeParam("https://example.com/sponsored.html"),
    already: withThemeParam("/x?skin=tradeshift"),
  }));
  t.check("a same-site frame URL gains the slug",
    seen.same === "/methodology?frame=1&lang=en&skin=tradeshift", seen.same);
  // A sponsored whitepaper's doc_url is data and can point anywhere.
  // Appending the reader's partner to it would tell a third party who
  // they work for, which is not a thing this feature is entitled to do.
  t.check("a third-party URL is left exactly as it was",
    seen.external === "https://example.com/sponsored.html", seen.external);
  t.check("a URL that already carries the slug is not doubled",
    seen.already === "/x?skin=tradeshift", seen.already);

  // The whitepaper pop-out end to end: this static server can serve the
  // document it frames, so the assertion is on the framed page's
  // resolved colour rather than on the string that got it there.
  await page.evaluate(() =>
    openWhitepaperPopout("/whitepaper-einvoicing-roi-evidence.html"));
  await page.waitForTimeout(1200);
  const framed = page.frames().find((f) => f.url().includes("whitepaper-einvoicing-roi-evidence"));
  const inFrame = framed
    ? await framed.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--ink").trim())
    : "no frame loaded";
  t.check(`a framed document inherits nothing and resolves ${LIGHT["--ink"]} from its own URL`,
    inFrame === LIGHT["--ink"], inFrame);
  await ctx.close();
}
{
  // And an unskinned reader's frames stay clean: no parameter is
  // appended when there is no theme to carry.
  const ctx = await iframeBrowser.newContext({ viewport: { width: 1100, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/einvoicing-compliance-tracker.html`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const plain = await page.evaluate(() => withThemeParam("/methodology?frame=1&lang=en"));
  t.check("with no theme active, nothing is appended",
    plain === "/methodology?frame=1&lang=en", plain);
  await ctx.close();
}
await iframeBrowser.close();

server.close();
process.exit(t.report() ? 0 : 1);
