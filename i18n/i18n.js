// ================================================================
// The E-Invoicing Compliance Corner — i18n loader
// ================================================================
// A small, dependency-free loader that:
//   1. Determines the active language (URL ?lang=, then a saved
//      preference, then falls back to English).
//   2. Fetches that language's JSON file from /i18n/<lang>.json.
//   3. Applies translated text to any element carrying a
//      data-i18n="section.key" attribute.
//   4. Shows a visible banner if the active language's content
//      hasn't yet been marked as human-reviewed — this is
//      deliberate: AI-assisted translations should never look
//      indistinguishable from reviewed ones on a compliance site.
//
// HOW TO USE ON A PAGE:
//   1. Include this script: <script src="i18n/i18n.js" defer></script>
//   2. Tag translatable elements: <p data-i18n="brand.description"></p>
//   3. For attributes (e.g. placeholders), use:
//        data-i18n-attr="placeholder:search.placeholder"
//   4. Call window.EICC_I18N.init() once the DOM is ready (or just
//      let it auto-run on DOMContentLoaded, which it does by default).
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

// Optional per-page content namespace, set via a data-namespace attribute
// on this script's own <script> tag, e.g.:
//   <script src="i18n/i18n.js" data-namespace="edu-mandate-types"></script>
// When set, files are loaded as i18n/<lang>-<namespace>.json instead of
// the tracker's shared i18n/<lang>.json — lets other pages have their own
// translation files without bloating (or colliding with) the tracker's.
const CONTENT_NAMESPACE = document.currentScript?.dataset?.namespace || "";

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

  async setLanguage(code) {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      /* ignore if localStorage unavailable */
    }
    await this.loadLanguage(code);
    this.applyToDom();
    document.dispatchEvent(new CustomEvent("eicc:languageChanged", { detail: { lang: code } }));
  },

  async init() {
    const lang = this.detectLanguage();
    await this.loadLanguage(lang);
    this.applyToDom();
    // Dispatch the same event used for manual switches, so any page-specific
    // code that renders dynamic content (cards, boards, sidebars) in the
    // current language also runs once on initial load — not just when the
    // user actively changes languages later.
    document.dispatchEvent(new CustomEvent("eicc:languageChanged", { detail: { lang: this.currentLang } }));
  },
};

window.EICC_I18N = EICC_I18N;
window.EICC_SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => EICC_I18N.init());
} else {
  EICC_I18N.init();
}
