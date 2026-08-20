// ================================================================
// The E-Invoicing Compliance Corner — i18n loader
// ================================================================
// A small, dependency-free loader that:
//   1. Determines the active language (URL ?lang=, then the shared
//      eicc_lang cookie, then a legacy localStorage value, then
//      English).
//   2. Fetches that language's JSON file from /i18n/<lang>.json.
//   3. Applies translated text to any element carrying a
//      data-i18n="section.key" attribute.
//   4. Renders the single, site-wide language banner at the very top
//      of the page (see renderBanner() below) — the same banner also
//      appears on the dynamically-rendered pages (country deep dives,
//      the members subdomain), all reading/writing the same eicc_lang
//      cookie, so a language choice made anywhere on the site applies
//      everywhere. This replaced each page's own separate
//      .lang-switcher / .lang-switcher-inline markup (2 August 2026).
//   5. Shows a visible banner if the active language's content
//      hasn't yet been marked as human-reviewed — this is
//      deliberate: AI-assisted translations should never look
//      indistinguishable from reviewed ones on a compliance site.
//
// HOW TO USE ON A PAGE:
//   1. Include this script: <script src="i18n/i18n.js" defer></script>
//   2. Tag translatable elements: <p data-i18n="brand.description"></p>
//   3. For attributes (e.g. placeholders), use:
//        data-i18n-attr="placeholder:search.placeholder"
//   4. That's it — the language banner and language detection/loading
//      run automatically on DOMContentLoaded. Pages with no
//      data-i18n content at all (e.g. index.html) can still include
//      this script just to get the shared banner and keep the
//      language choice consistent site-wide.
//
// ADDING A NEW LANGUAGE LATER:
//   1. Copy i18n/en.json to i18n/<code>.json (e.g. pt.json)
//   2. Translate every value — keep every key identical
//   3. Set "_meta.reviewed": false until a human has checked it
//   4. Add the language to SUPPORTED_LANGUAGES below
//   No other code changes needed.
// ================================================================

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  // Planned, not yet added: pt (Portuguese), zh (Chinese — needs a
  // non-Latin font stack), ar (Arabic — needs RTL layout support).
];
const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "eicc_lang";
const COOKIE_NAME = "eicc_lang";
// Leading dot makes this cookie visible to e-invoicingcompliancecorner.com
// AND every subdomain (in particular members.e-invoicingcompliancecorner.com)
// — this is what makes "pick a language once, anywhere" actually work
// across both Cloudflare Workers behind the site. A page can only ever
// set a cookie for its own domain or a parent of it, so this only takes
// effect when the site is loaded on the real custom domain — harmless
// no-op fallback (silently not set) on a bare *.workers.dev preview URL.
const COOKIE_DOMAIN = ".e-invoicingcompliancecorner.com";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

// Optional per-page content namespace, set via a data-namespace attribute
// on this script's own <script> tag, e.g.:
//   <script src="i18n/i18n.js" data-namespace="edu-mandate-types"></script>
// When set, files are loaded as i18n/<lang>-<namespace>.json instead of
// the tracker's shared i18n/<lang>.json — lets other pages have their own
// translation files without bloating (or colliding with) the tracker's.
const CONTENT_NAMESPACE = document.currentScript?.dataset?.namespace || "";

// Reads the LAST matching cookie, not the first. This matters because a
// browser can hold two *different* cookies with the same name at once --
// e.g. a stale host-only "eicc_lang" cookie left over from before this
// site scoped the cookie to Domain=.e-invoicingcompliancecorner.com (see
// writeCookie below), sitting alongside the current domain-scoped one.
// Per RFC 6265 5.4, cookies with equal-length paths are sent oldest-
// first, so the newer (correct, domain-scoped) cookie is always the
// LAST occurrence in document.cookie -- taking the first match is what
// caused the "picks English, refresh, back to Spanish" bug: the stale
// host-only cookie from an earlier visit was always read instead of
// whatever was just chosen. See clearLegacyHostOnlyCookie() below for
// the other half of the fix (actually removing the stale duplicate).
function readCookie(name) {
  const re = new RegExp(`(?:^|; )${name}=([^;]+)`, "g");
  let match, last = null;
  while ((match = re.exec(document.cookie)) !== null) last = match;
  return last ? decodeURIComponent(last[1]) : null;
}

function writeCookie(name, value) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch (e) {
    /* ignore — e.g. cookies disabled */
  }
}

// Deletes the host-only variant of a cookie (no Domain attribute), i.e.
// exactly the kind this site used to set before it started scoping the
// language cookie to the whole domain. Setting a cookie via document.cookie
// with no Domain only ever affects the host-only cookie for the exact
// current host -- it can't touch (or accidentally delete) the real
// Domain=.e-invoicingcompliancecorner.com cookie, since those are two
// distinct cookies as far as the browser is concerned. Safe to call
// unconditionally: a no-op if no stale host-only cookie exists.
function clearLegacyHostOnlyCookie(name) {
  try {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch (e) {
    /* ignore — e.g. cookies disabled */
  }
}

const EICC_I18N = {
  currentLang: DEFAULT_LANGUAGE,
  strings: {},
  meta: {},
  entryData: {}, // per-id translations of {system, desc, actions} for the current language — tracker only

  detectLanguage() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("lang");
    if (fromUrl && SUPPORTED_LANGUAGES.some((l) => l.code === fromUrl)) {
      return fromUrl;
    }
    // The shared cookie is the real source of truth — set by this same
    // loader and by both server-rendered Workers (site-worker,
    // members-worker), so it's consistent no matter where the user last
    // picked a language.
    const fromCookie = readCookie(COOKIE_NAME);
    if (fromCookie && SUPPORTED_LANGUAGES.some((l) => l.code === fromCookie)) {
      return fromCookie;
    }
    // Legacy fallback for anyone with a saved preference from before the
    // cookie existed — read it once and let persistLanguage() below
    // migrate it into the cookie so this branch stops being needed for
    // that visitor.
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch (e) {
      /* localStorage unavailable — fall through to default */
    }
    return DEFAULT_LANGUAGE;
  },

  // Writes the chosen language to both the shared cookie (so
  // server-rendered pages on any subdomain see it) and localStorage
  // (harmless redundancy, keeps working if cookies are ever blocked).
  persistLanguage(code) {
    writeCookie(COOKIE_NAME, code);
    // Clean up any stale host-only duplicate every time we persist (which
    // happens on every page load via init(), not just an explicit
    // switch) so the site self-heals for anyone still carrying one from
    // before the Domain-scoped cookie existed, without needing to clear
    // cookies by hand.
    clearLegacyHostOnlyCookie(COOKIE_NAME);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      /* ignore if localStorage unavailable */
    }
  },

  async loadLanguage(code) {
    const suffix = CONTENT_NAMESPACE ? `-${CONTENT_NAMESPACE}` : "";
    const filePath = `i18n/${code}${suffix}.json`;
    try {
      const res = await fetch(filePath);
      if (!res.ok) throw new Error(`Failed to load ${filePath}`);
      const data = await res.json();
      this.strings = data;
      this.meta = data._meta || {};
      this.currentLang = code;
    } catch (err) {
      console.warn(`i18n: could not load "${code}", falling back to English.`, err);
      if (code !== DEFAULT_LANGUAGE) {
        await this.loadLanguage(DEFAULT_LANGUAGE);
        return;
      }
    }

    // Load the per-country DATA translations too — this only applies to
    // the main tracker (no namespace set), which has a DATA array to
    // translate entry-by-entry. Namespaced content pages don't have this.
    this.entryData = {};
    if (!CONTENT_NAMESPACE && this.currentLang !== DEFAULT_LANGUAGE) {
      try {
        const res = await fetch(`i18n/${this.currentLang}-data.json`);
        if (res.ok) this.entryData = await res.json();
      } catch (err) {
        console.warn(`i18n: could not load i18n/${this.currentLang}-data.json — DATA entries will stay in English.`, err);
      }
    }
  },

  // Look up a dotted key path, e.g. "brand.description"
  t(keyPath) {
    const parts = keyPath.split(".");
    let node = this.strings;
    for (const part of parts) {
      if (node && typeof node === "object" && part in node) {
        node = node[part];
      } else {
        return null; // missing key — caller should keep existing text
      }
    }
    return typeof node === "string" ? node : null;
  },

  // Translate a country or region name via the loaded dictionary,
  // falling back to the original English name if no translation exists.
  translateCountry(name) {
    return this.strings?.countryNames?.[name] || name;
  },
  translateRegion(name) {
    return this.strings?.regionNames?.[name] || name;
  },

  // Given a DATA entry object (with .id, .system, .desc, .actions), return
  // the translated {system, desc, actions} for the current language, or
  // the entry's own English fields if no translation is available for
  // that specific entry (e.g. a country added after this language's data
  // file was last updated).
  translateEntry(entry) {
    const t = this.entryData[entry.id];
    return {
      system: t?.system || entry.system,
      desc: t?.desc || entry.desc,
      actions: t?.actions || entry.actions,
    };
  },

  applyToDom() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = this.t(key);
      if (value !== null) el.innerHTML = value;
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      // Format: "attr1:key1,attr2:key2"
      const pairs = el.getAttribute("data-i18n-attr").split(",");
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        const value = this.t(key);
        if (attr && value !== null) el.setAttribute(attr, value);
      });
    });

    this.renderUnreviewedBanner();
  },

  renderUnreviewedBanner() {
    const existing = document.getElementById("i18nUnreviewedBanner");
    if (existing) existing.remove();

    if (this.meta && this.meta.reviewed === false) {
      const bannerText = this.t("languageSwitcher.unreviewedBanner") || this.strings?.languageSwitcher?.unreviewedBanner;
      if (!bannerText) return;
      const banner = document.createElement("div");
      banner.id = "i18nUnreviewedBanner";
      banner.setAttribute(
        "style",
        "background:#6e4c22; color:#ffe9c7; font-family:'IBM Plex Mono',monospace; font-size:12.5px; " +
        "text-align:center; padding:9px 16px; position:relative; z-index:60;"
      );
      banner.textContent = "⚠ " + bannerText;
      document.body.insertBefore(banner, document.body.firstChild);
    }
  },

  // ----------------------------------------------------------------
  // Shared site-wide language banner — a thin bar at the very top of
  // every page (above everything else, including the unreviewed-
  // translation banner). This is the ONE place to change language,
  // replacing what used to be a separately hand-built .lang-switcher
  // on every static page. Visually and behaviourally consistent with
  // the equivalent banner server-rendered on the dynamic country
  // pages and the members subdomain (see shared/deep-dive-render.mjs
  // and members-worker/src/index.js's pageShell()) — same markup,
  // same colours, same active-language highlighting. The only
  // difference here is that switching language never reloads the
  // page: it calls setLanguage() directly, same as the old tracker-
  // only switcher did.
  // ----------------------------------------------------------------
  renderBanner() {
    let bar = document.getElementById("eiccLangBanner");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "eiccLangBanner";
      bar.setAttribute(
        "style",
        "background:#152238; padding:7px 18px; display:flex; align-items:center; " +
        "justify-content:flex-end; gap:14px; font-family:'IBM Plex Mono',monospace; " +
        "font-size:11.5px; position:relative; z-index:70;"
      );
      document.body.insertBefore(bar, document.body.firstChild);
      bar.addEventListener("click", (e) => {
        const link = e.target.closest("[data-lang]");
        if (!link) return;
        e.preventDefault();
        this.setLanguage(link.getAttribute("data-lang"));
      });
    }
    const links = SUPPORTED_LANGUAGES.map(({ code }) => {
      const active = code === this.currentLang;
      const color = active ? "#c98a3a" : "#93a3c0";
      const weight = active ? "700" : "400";
      return `<a href="?lang=${code}" data-lang="${code}" style="color:${color}; font-weight:${weight}; text-decoration:none;">${code.toUpperCase()}</a>`;
    }).join("");
    bar.innerHTML = `<span style="color:#93a3c0;">🌐</span>${links}`;
  },

  async setLanguage(code) {
    this.persistLanguage(code);
    await this.loadLanguage(code);
    this.applyToDom();
    this.renderBanner();
    document.dispatchEvent(new CustomEvent("eicc:languageChanged", { detail: { lang: code } }));
  },

  async init() {
    const lang = this.detectLanguage();
    // Migrate a legacy localStorage-only preference (or a fresh ?lang=
    // URL visit) into the shared cookie, so the very next page — on
    // this domain or the members subdomain — already sees it.
    this.persistLanguage(lang);
    await this.loadLanguage(lang);
    this.applyToDom();
    this.renderBanner();
    // Dispatch the same event used for manual switches, so any page-specific
    // code that renders dynamic content (cards, boards, sidebars) in the
    // current language also runs once on initial load — not just when the
    // user actively changes languages later.
    document.dispatchEvent(new CustomEvent("eicc:languageChanged", { detail: { lang: this.currentLang } }));
  },
};

// ================================================================
// WHO IS SIGNED IN — rendered client-side, on every page
// ================================================================
// Dan, 19 August 2026: show "You are logged in as <user>" at the top of
// the tracker, next to the menus.
//
// IT LIVES HERE, IN THE i18n LOADER, for a reason that is easy to miss:
// most of this site is served straight from Cloudflare's asset layer and
// the Worker never runs for it. The education pages, subscribe.html and
// feedback.html cannot be personalised server-side at all. This script is
// already on every one of them, so putting the greeting here is what
// makes it appear everywhere rather than only on the two rendered routes.
//
// IT READS A COOKIE THAT CARRIES NO AUTHORITY. `eicc_who` is set beside
// the real session cookie at sign-in and is deliberately readable by
// JavaScript. Forging it changes the name in the corner and nothing else:
// the session cookie is HttpOnly, and every decision that matters is made
// against it, server-side. This is display, not access control — which is
// also why it can be trusted to a static page in the first place.
//
// Sign-out is a real link to the members Worker, because only that side
// can clear an HttpOnly cookie.
//
// EVERY NAME IS SCOPED INSIDE THE OBJECT, not declared at the top level.
// This file and each page's inline script share one global scope, and the
// tracker has had its own MEMBERS_ORIGIN since the archive panel was
// built. Two top-level consts of the same name throw
// "Identifier has already been declared", which kills BOTH scripts on
// that page — every panel, filter and handler — while the page still
// renders and looks perfectly fine. That happened on the first render
// after this was written. See tests/page-scripts.mjs.
const EICC_WHO = {
  cookieName: "eicc_who",
  membersOrigin: "https://members.e-invoicingcompliancecorner.com",

  read() {
    // Built from the constant rather than written twice — a literal
    // beside the name it has to agree with is this project's most
    // frequent defect.
    const m = (document.cookie || "").match(
      new RegExp("(?:^|; )" + this.cookieName + "=([^;]*)"));
    if (!m) return null;
    try {
      const v = decodeURIComponent(m[1]).trim();
      return v || null;
    } catch (err) {
      return null; // a malformed cookie is the same as no cookie
    }
  },

  // The full address is the truth and is what the tooltip shows, but a
  // long one would push the menus around on a narrow header — so the
  // visible text is the local part, which is what people recognise
  // anyway.
  shortName(email) {
    const at = email.indexOf("@");
    return at > 0 ? email.slice(0, at) : email;
  },

  /** True when a display cookie is present. Display only — never a
   *  gate. Anything that must actually be withheld is decided
   *  server-side against the HttpOnly session, not against this. */
  isSignedIn() { return !!this.read(); },

  render() {
    const email = this.read();

    // The signed-out counterpart to the greeting: one control, shown to
    // exactly the people the greeting is not. Dan, 20 August 2026: "show
    // a Sign-In button on the main tracker page, to the left of the menu
    // boxes." Toggled here rather than in the page's own script so it
    // stays in step with the greeting by construction — two places
    // deciding the same thing is how they come to disagree.
    const signIn = document.getElementById("signInBtn");
    if (signIn) signIn.hidden = !!email;

    // Marks on menu items that need an account. Any element carrying
    // data-needs-session is revealed only when signed OUT, so a reader
    // knows before they click rather than after.
    document.querySelectorAll("[data-needs-session]").forEach((el) => {
      el.hidden = !!email;
    });

    const host = document.getElementById("whoAmI");
    if (!host) return;
    if (!email) { host.innerHTML = ""; host.hidden = true; return; }
    host.hidden = false;
    const label = (window.EICC_I18N && window.EICC_I18N.t("who.signedInAs"))
      || "Signed in as";
    const out = (window.EICC_I18N && window.EICC_I18N.t("who.signOut")) || "Sign out";
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    host.innerHTML =
      `<span class="who-label">${esc(label)}</span> `
      + `<span class="who-name" title="${esc(email)}">${esc(this.shortName(email))}</span> `
      + `<a class="who-out" href="${this.membersOrigin}/members/logout">${esc(out)}</a>`;
  },
};

window.EICC_WHO = EICC_WHO;
// Re-rendered on a language change as well as at load, or the label would
// stay in whatever language the page opened in.
document.addEventListener("eicc:languageChanged", () => EICC_WHO.render());

window.EICC_I18N = EICC_I18N;
window.EICC_SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => EICC_I18N.init());
} else {
  EICC_I18N.init();
}
