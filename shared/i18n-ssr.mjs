// ================================================================
// SERVER-SIDE i18n — the same substitution i18n.js does, done first
// ================================================================
//
// WHY THIS EXISTS. Until 29 August 2026 every translatable string on the
// tracker and the five education pages was substituted in the BROWSER:
// i18n.js walks `[data-i18n]` and sets each element's innerHTML from
// `i18n/<lang>.json`. That works perfectly for a reader and not at all
// for anything that does not run JavaScript.
//
// An independent review of the German site reported the navigation as
// untranslated and listed eleven items. Every one of them IS translated;
// the reviewer had read the HTML source rather than the rendered page,
// and the list matched the source exactly. Measuring it turned a wrong
// finding into a right one:
//
//     /?lang=de                          <html lang="en">  canonical -> /
//     /education-mandate-types?lang=de    <html lang="en">  canonical -> /education-mandate-types
//     /germany?lang=de                    <html lang="de">  canonical -> /germany?lang=de
//
// The country pages are rendered from D1 per language and were always
// right. The other six declare a German alternate in the sitemap while
// serving HTML that announces itself as English and points its canonical
// at the English URL. That is not slow indexing -- it is an instruction
// to fold the German version into the English one, and it is why no
// amount of copy-editing the German would have helped.
//
// It also costs the AI crawlers entirely: GPTBot, ClaudeBot and
// PerplexityBot read the first HTML response and never execute scripts,
// so roughly 1,350 already-translated strings across five education
// pages in three languages had never been seen by any of them.
//
// SO THE SUBSTITUTION HAPPENS TWICE, AND THAT IS FINE. This runs at the
// edge; i18n.js runs again on load and writes the same values into the
// same elements. Idempotent by construction, because both read the same
// JSON and target the same attribute. Deliberately NOT a replacement for
// the client half: the language can still change without a round trip,
// and a cookie-only reader (no ?lang= on the URL) is still served the
// one cached English document and translated in place.
//
// THE PAGE DECLARES ITS OWN NAMESPACE, so there is no path list here.
// i18n.js reads `data-namespace` off its own <script> tag and loads
// `i18n/<lang>-<namespace>.json`; this reads the same attribute out of
// the markup and asks for the same file. A new static page that opts in
// by adding the script tag is handled without editing this module --
// which is the difference between one rule and twenty-six literals.

/** Dotted-path lookup, matching i18n.js's `t(key)`. */
export function lookup(strings, key) {
  return String(key).split(".").reduce(
    (o, part) => (o && typeof o === "object" ? o[part] : undefined), strings);
}

// SCRIPT AND STYLE ARE MASKED BEFORE ANYTHING IS REWRITTEN, and that is
// not caution for its own sake. The tracker builds markup in JavaScript
// -- renderSidebar() and the carousel emit `data-i18n="..."` inside
// template literals -- so four of its eighty-four occurrences live in a
// <script>. Rewriting those would edit the page's own source code at the
// edge, which is precisely how the palette generator once ate 459 lines
// of site-worker: a pattern that is safe against markup and catastrophic
// against the code that produces markup.
//
// The mask preserves length, so every offset outside it is unchanged and
// the replacement can be spliced back over the original.
const MASKED = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

function maskCode(html) {
  return html.replace(MASKED, (m) => " ".repeat(m.length));
}

// A translatable element. Non-greedy to its own closing tag, which is
// safe here because no `[data-i18n]` element in this tree contains a
// nested element of the SAME name -- checked across all six pages, and
// asserted by tests/lang-alternates.mjs so it stays true.
//
// Replacing the whole of the inner content is not an approximation of
// what the client does; it is exactly what the client does. i18n.js sets
// `el.innerHTML = value`, so whatever markup sits inside is discarded
// there too.
const EL = /<(\w+)((?:[^>"']|"[^"]*"|'[^']*')*?\sdata-i18n="([^"]+)"(?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/\1>/g;
const ATTR_EL = /<(\w+)((?:[^>"']|"[^"]*"|'[^']*')*?\sdata-i18n-attr="([^"]+)"(?:[^>"']|"[^"]*"|'[^']*')*)>/g;

/** Substitute every [data-i18n] string in `html`, outside script/style.
 *
 *  Returns { html, applied, missing } -- `missing` is the keys the page
 *  asked for and the language file does not have, which is how a
 *  half-translated page announces itself instead of silently shipping
 *  English fragments. */
export function localiseHtml(html, strings) {
  const code = maskCode(html);
  let applied = 0;
  const missing = [];

  // Collect replacements against the MASKED copy so nothing inside a
  // <script> can match, then splice them into the real string by offset.
  const edits = [];
  for (const m of code.matchAll(EL)) {
    const value = lookup(strings, m[3]);
    if (value === undefined || value === null) { missing.push(m[3]); continue; }
    const open = `<${m[1]}${m[2]}>`;
    edits.push([m.index, m.index + m[0].length, `${open}${value}</${m[1]}>`]);
    applied += 1;
  }
  for (const m of code.matchAll(ATTR_EL)) {
    let tag = m[0];
    for (const pair of m[3].split(",")) {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      const value = lookup(strings, key);
      if (!attr || value === undefined || value === null) {
        if (key) missing.push(key);
        continue;
      }
      const re = new RegExp(`\\s${attr}="[^"]*"`);
      const next = `${` ${attr}="${String(value).replace(/"/g, "&quot;")}"`}`;
      tag = re.test(tag) ? tag.replace(re, next) : tag.replace(/>$/, `${next}>`);
      applied += 1;
    }
    if (tag !== m[0]) edits.push([m.index, m.index + m[0].length, tag]);
  }

  edits.sort((a, b) => b[0] - a[0]);
  let out = html;
  for (const [start, end, text] of edits) {
    out = out.slice(0, start) + text + out.slice(end);
  }
  return { html: out, applied, missing };
}

/** The namespace the page's own <script data-namespace> declares, or "".
 *
 *  Read from the markup rather than from a table keyed by path, so this
 *  module never has to learn about a new page. */
export function namespaceOf(html) {
  const m = maskCode(html).match(/<script[^>]*\bdata-namespace="([^"]+)"/i)
    // maskCode blanks <script>...</script> pairs; the i18n tag is
    // self-contained with a src, so match against the raw string too.
    || html.match(/<script[^>]*\bdata-namespace="([^"]+)"/i);
  return m ? m[1] : "";
}

/** The <title> and the meta description, from `pages.<data-page>`.
 *
 *  THE HALF THAT MATTERS MOST TO A SEARCH ENGINE, and the half that was
 *  furthest behind. i18n.js has always done this (applyHead), keyed on
 *  the page's own `data-page` attribute — but it runs in the browser, so
 *  a crawler that does not render has only ever seen the English title
 *  and description of a page declaring itself German.
 *
 *  og: and twitter: follow the same words, so a share in German is not a
 *  share of the English summary. Same set applyHead touches, so the two
 *  cannot drift.
 *
 *  Returns the html unchanged when the page declares no `data-page` or
 *  the language file has no entry for it — an untranslated head is worse
 *  than an English one only if you claim otherwise. */
export function localiseHead(html, strings, englishStrings) {
  const key = (html.match(/<body[^>]*\bdata-page="([^"]+)"/i) || [])[1];
  const head = key && strings && strings.pages && strings.pages[key];
  if (!head) return html;
  // AN UNTRANSLATED FIELD MUST NOT CLOBBER AN AUTHORED ONE. `pages.home`
  // carries the same title in all four languages -- it is the brand
  // name -- while the tracker's own <title> is "Global E-Invoicing
  // Mandate Tracker — The E-Invoicing Compliance Corner". Applying the
  // first version of this replaced a descriptive title with a bare brand
  // name on the German homepage and called it localisation. So a head
  // field is only used when it actually differs from the English file's
  // value for the same key; where it does not, the page keeps what its
  // author wrote.
  const en = englishStrings && englishStrings.pages && englishStrings.pages[key];
  if (en) {
    for (const f of ["title", "description"]) {
      if (head[f] && en[f] && head[f] === en[f]) head[f] = null;
    }
  }
  let out = html;
  if (head.title) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i,
      `<title>${escapeText(head.title)}</title>`);
    for (const p of ['property="og:title"', 'name="twitter:title"']) {
      out = setMeta(out, p, head.title);
    }
  }
  if (head.description) {
    out = setMeta(out, 'name="description"', head.description);
    for (const p of ['property="og:description"', 'name="twitter:description"']) {
      out = setMeta(out, p, head.description);
    }
  }
  return out;
}

const escapeText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

function setMeta(html, selector, value) {
  const [attr, want] = selector.split("=");
  const re = new RegExp(
    `(<meta[^>]*\\b${attr}=${want}[^>]*\\bcontent=")[^"]*(")`, "i");
  return re.test(html)
    ? html.replace(re, `$1${String(value).replace(/"/g, "&quot;")}$2`)
    : html;
}

/** `<html lang="xx">`, and a canonical that points at THIS URL.
 *
 *  Both halves matter and the canonical is the one that was actively
 *  harmful: a German alternate whose canonical names the English page is
 *  a request to drop it from the index. */
export function stampLanguage(html, lang, canonicalHref) {
  let out = html.replace(/<html\b([^>]*)>/i, (m, attrs) => {
    const cleaned = attrs.replace(/\slang="[^"]*"/i, "");
    return `<html lang="${lang}"${cleaned}>`;
  });
  if (canonicalHref) {
    out = out.replace(/(<link[^>]*\brel="canonical"[^>]*\bhref=")[^"]*(")/i,
      `$1${canonicalHref}$2`);
  }
  return out;
}
