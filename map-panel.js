// ================================================================
// map-panel.js — the client-side rendering engine behind The Map.
// ================================================================
// A single reusable component (window.EICCMap.init(rootEl, opts))
// used in TWO different places:
//
//   1. The standalone /map page (site-worker/src/index.js's
//      renderMapPage) — rootEl is `document`, and this script is
//      loaded normally via <script src="/map-panel.js">, so it
//      executes exactly like any other page script.
//
//   2. The tracker's in-page map panel (einvoicing-compliance-
//      tracker.html's openMapPage()) — rootEl is a ShadowRoot. The
//      fetched /map page's own inline bootstrap <script> is discarded
//      when dropped into shadow.innerHTML (script tags injected via
//      innerHTML never execute — the same reason every other in-page
//      panel on this site ports its interactivity into the tracker's
//      OWN script instead of relying on the fetched page's). This file
//      is loaded ONCE, for real, in the tracker's own <head> — its
//      openMapPage() then calls window.EICCMap.init(shadow, {...})
//      directly after injecting the shadow content, exactly like
//      wireArchiveStoryModal(shadow) is called for the archive panel.
//
// Because both call sites use the same DOM ids/classes (the tracker's
// panel is built from the exact same server-rendered .wrap markup as
// the standalone page — see renderMapPage's HTML), one implementation
// covers both. rootEl.getElementById / rootEl.querySelectorAll work
// identically whether rootEl is `document` or a ShadowRoot (both
// implement the same interface).
//
// opts:
//   countries      — initial array from getMapCountries() (shared/
//                     map-data.mjs), already translated for `lang`.
//   fetchCountries — async (lang) => same-shaped array, for the
//                     panel's own EN/ES/DE/FR switch (independent of
//                     the tracker's global language state — same
//                     accepted limitation as the sources/archive/deep-
//                     dive panels, none of which auto-refresh on an
//                     outer language change either).
//   ui             — the MAP_UI dict (shared/map-data.mjs), all 4
//                     languages.
//   regionOrder / regionBounds — from shared/map-data.mjs.
//   lang           — initial language.
//   topologyUrl    — where to fetch the world-atlas topojson from.
//   navigate(slug, nameEn) — called on a country click/tap. Standalone
//                     mode omits this (default: same-tab navigation to
//                     the real deep-dive URL). The tracker's panel
//                     passes `(slug) => openDeepDive(slug)` so a click
//                     opens the existing in-page deep-dive panel
//                     instead of leaving the page.
//   archiveUrl / subscribeUrl / backUrl — base URLs for the footer/
//                     header links (differ by runtime: absolute
//                     members-subdomain URL for the archive either way,
//                     but the "back to tracker" link's behavior differs
//                     between modes — see openMapPage()'s override).
//   openArchive() / openSubscribe() — called on a click on the footer's
//                     "Browse the newsletter archive" / "Subscribe to
//                     the newsletter" buttons. Standalone mode omits
//                     both (the buttons stay plain links to archiveUrl/
//                     subscribeUrl). The tracker's panel passes
//                     `() => openArchive()` / `() => openSubscribePage()`
//                     so a click opens that existing in-page panel
//                     instead of leaving the page — see wireFooterCta().
// ================================================================
(function (global) {
  "use strict";

  const WIDTH = 720, HEIGHT = 620, PAD = 16, SMALL_PX = 18;
  const MEMBERS_ORIGIN = "https://members.e-invoicingcompliancecorner.com";
  const NEWS_DATE_LOCALE = { en: "en-GB", es: "es-ES", de: "de-DE", fr: "fr-FR" };

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Calibrates a Mercator projection from raw corner points rather than
  // via d3's fitExtent(extent, feature) — fitExtent measures the real
  // (possibly exclave-polluted) feature bounds, which blows a region's
  // zoom out to nearly a whole hemisphere for countries like France
  // (French Guiana) or Norway (Svalbard). Projecting the four corner
  // points directly at scale=1 and measuring pixel span ourselves
  // works uniformly for any region's bounding box instead.
  function calibrateProjection(corners) {
    const probe = d3.geoMercator().translate([0, 0]).scale(1);
    const px = corners.map((c) => probe(c));
    const minX = Math.min(...px.map((p) => p[0])), maxX = Math.max(...px.map((p) => p[0]));
    const minY = Math.min(...px.map((p) => p[1])), maxY = Math.max(...px.map((p) => p[1]));
    const scale = Math.min((WIDTH - 2 * PAD) / (maxX - minX), (HEIGHT - 2 * PAD) / (maxY - minY));
    const translate = [WIDTH / 2 - scale * (minX + maxX) / 2, HEIGHT / 2 - scale * (minY + maxY) / 2];
    return d3.geoMercator().translate(translate).scale(scale);
  }

  // Clamps a candidate small-country marker label position so its text
  // never runs outside the visible map, regardless of which corner of
  // the region it sits in.
  function clampLabel(x, y, anchorEnd, estWidth) {
    const minX = anchorEnd ? PAD + estWidth : PAD + 14;
    const maxX = anchorEnd ? WIDTH - PAD - 14 : WIDTH - PAD - estWidth;
    return [Math.max(minX, Math.min(maxX, x)), Math.max(PAD + 10, Math.min(HEIGHT - PAD - 6, y))];
  }

  // The label's real footprint on screen: the 7px dot, a 12px gap, and
  // the text running away from the dot in whichever direction it is
  // anchored. Used to keep two small-country labels off each other.
  function labelBox(x, y, anchorEnd, estWidth) {
    return anchorEnd
      ? { x0: x - 12 - estWidth, x1: x + 7, y0: y - 9, y1: y + 9 }
      : { x0: x - 7, x1: x + 12 + estWidth, y0: y - 9, y1: y + 9 };
  }
  const boxesOverlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const rotate = (x, y, a) =>
    [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

  // Candidate label positions, nearest first: the natural radial spot,
  // then progressively further out and rotated to either side.
  //
  // WHY THIS EXISTS. Every small-country label was pushed a fixed 42 by
  // 34 pixels straight out from the centre of the map. Two markers close
  // together and pointing the same way therefore landed on top of each
  // other -- Hong Kong and Taiwan in Asia-Pacific, found by Dan on 27
  // August 2026, the day after Hong Kong was added. It was never a Hong
  // Kong problem: the placement had no idea any other label existed, so
  // the collision was waiting for whichever two countries happened to be
  // near neighbours. Singapore and Malaysia would have done it too.
  //
  // The leader line still points at the true centroid, so moving the
  // label costs no accuracy -- only the label moves, never the country.
  const LABEL_PLACEMENTS = [];
  for (const grow of [1, 1.45, 1.9, 2.4, 3]) {
    for (const turn of [0, -0.35, 0.35, -0.7, 0.7, -1.05, 1.05]) {
      LABEL_PLACEMENTS.push([grow, turn]);
    }
  }

  // The world-atlas topology is large (~750KB) and identical regardless
  // of language or which mode (standalone vs panel) requests it — fetch
  // it at most once per page load no matter how many MapPanel instances
  // get created (e.g. closing and reopening the tracker's panel).
  let topoPromise = null;
  function loadTopology(url) {
    if (!topoPromise) topoPromise = fetch(url).then((r) => r.json());
    return topoPromise;
  }

  // The story pop-out modal's Escape-key handling is wired once at
  // module scope, not per MapPanel instance -- registering a fresh
  // document-level listener every time the tracker's in-page panel is
  // reopened (a fresh MapPanel each time) would accumulate one stale
  // listener per open/close cycle, same pitfall einvoicing-compliance-
  // tracker.html's own wireArchiveStoryModal() comment already flags for
  // exactly this reason. Whichever MapPanel booted most recently is the
  // only one that can have its modal open, so it's simply the target.
  let activePanelForEscape = null;
  let escapeListenerWired = false;
  function wireGlobalEscapeHandler() {
    if (escapeListenerWired) return;
    escapeListenerWired = true;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activePanelForEscape) activePanelForEscape.closeStoryModal();
    });
  }

  class MapPanel {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts;
      this.regionOrder = opts.regionOrder;
      this.regionBounds = opts.regionBounds;
      this.uiDict = opts.ui;
      this.lang = opts.lang || "en";
      this.countries = opts.countries || [];
      this.recentStories = opts.recentStories || [];
      this.byName = new Map();
      this.sidebarBlocks = {};
      this.smallMarkerRegistry = {};
      this.activeRegion = "Europe";
      this._indexCountries();
      activePanelForEscape = this;
      wireGlobalEscapeHandler();
      this._boot();
    }

    // rootEl.getElementById / querySelectorAll work identically on
    // `document` and a `ShadowRoot`.
    $(id) { return this.root.getElementById(id); }
    $$(sel) { return this.root.querySelectorAll(sel); }
    ui() { return this.uiDict[this.lang] || this.uiDict.en; }

    // True only for the tracker's in-page panel (which always passes
    // navigate() so a country click opens the existing deep-dive panel
    // instead of leaving the page) -- false for the standalone /map
    // page. Reused for every place this component's behavior differs
    // between the two contexts: hiding the panel's own language switch
    // (buildLangSwitch, the tracker already has one at the top of the
    // real page), swapping the sidebar's country list for a recent-news
    // list (buildSidebar -- the tracker's permanent left sidebar already
    // lists every country and links to its deep dive, so repeating that
    // here is redundant only in this context), and backToTrackerLink's
    // close-panel-instead-of-navigate behavior in applyStaticText().
    isEmbedded() { return !!this.opts.navigate; }

    _indexCountries() {
      this.byName.clear();
      for (const c of this.countries) this.byName.set(c.nameEn, c);
    }

    countriesInRegion(region) {
      return this.countries.filter((c) => c.region === region).sort((a, b) => a.name.localeCompare(b.name));
    }

    deepDiveUrl(c) {
      const suffix = this.lang !== "en" ? "?lang=" + this.lang : "";
      return "/" + c.slug + suffix;
    }

    navigate(c) {
      if (this.opts.navigate) this.opts.navigate(c.slug, c.nameEn);
      else global.location.href = this.deepDiveUrl(c);
    }

    _boot() {
      this.buildLangSwitch();
      this.applyStaticText();
      this.buildTabs();
      this.buildSidebar();
      // buildSidebar() already renders for this.activeRegion in
      // embedded (news) mode; country mode's buildCountryList() builds
      // all regions unordered, so focusSidebarRegion() still needs to
      // run once to bring the initial region's block to the front.
      if (!this.isEmbedded()) this.focusSidebarRegion(this.activeRegion);
      this.wireStoryModal();
      this.wireFooterCta();

      const host = this.$("mapSvgHost");
      loadTopology(this.opts.topologyUrl).then((topo) => {
        const world = topojson.feature(topo, topo.objects.countries);
        for (const region of this.regionOrder) this.renderRegionMap(region, world);
        this.setActiveRegion("Europe");
      }).catch((err) => {
        console.error("The Map: world topology failed to load", err);
        if (host) host.innerHTML = '<p style="color:var(--muted); padding:20px;">Map data failed to load — the country list still has live links.</p>';
      });
    }

    // ---------- sidebar ----------
    // Standalone /map keeps the full region-grouped country list (its
    // only accessible/crawlable way to reach a deep dive -- the SVG map
    // itself has no keyboard/screen-reader path to a country). The
    // tracker's in-page panel shows recent news instead: its permanent
    // left sidebar already lists every country and links to its deep
    // dive, so repeating that list here would be pure duplication.
    buildSidebar() {
      const root = this.$("sidebarList");
      if (!root) return;
      if (this.isEmbedded()) this.buildRecentNewsList(root, this.activeRegion);
      else this.buildCountryList(root);
    }

    // `region` filters the pool getRecentStories() already fetched
    // (see shared/map-data.mjs's header comment on that function) down
    // to stories touching at least one country in that region -- a
    // story covering several countries across regions can appear under
    // more than one tab, which is correct (it's genuinely relevant to
    // both). Rebuilt on every region-tab switch (see setActiveRegion())
    // rather than kept as pre-built per-region blocks like
    // buildCountryList()'s accordion, since there's no need to preserve
    // DOM state across tabs the way the country list's collapse/expand
    // toggles do.
    buildRecentNewsList(root, region) {
      const old = this.$("sidebarBlocks");
      if (old) old.remove();
      const doc = root.ownerDocument;
      const wrap = doc.createElement("div");
      wrap.id = "sidebarBlocks";
      root.appendChild(wrap);
      this.sidebarBlocks = {};

      const matching = this.recentStories.filter((s) => s.regions.includes(region)).slice(0, 10);

      if (!matching.length) {
        const empty = doc.createElement("p");
        empty.className = "map-note";
        empty.textContent = this.ui().noRecentNews || "";
        wrap.appendChild(empty);
        return;
      }

      for (const story of matching) {
        const row = doc.createElement("a");
        row.className = "news-row";
        row.href = this.storyUrl(story);
        row.target = "_blank";
        row.rel = "noopener";
        row.addEventListener("click", (e) => {
          e.preventDefault();
          this.openStoryModal(story.id);
        });
        const countryLabel = story.countries.map((c) => c.flag + " " + c.name).join(", ");
        row.innerHTML =
          '<span class="news-date">' + escHtml(this.formatNewsDate(story.date)) + "</span>" +
          (countryLabel ? '<span class="news-countries">' + escHtml(countryLabel) + "</span>" : "") +
          '<span class="news-title">' + escHtml(story.title) + "</span>";
        wrap.appendChild(row);
      }
    }

    storyUrl(story) {
      const suffix = this.lang !== "en" ? "?lang=" + this.lang : "";
      return MEMBERS_ORIGIN + "/members/archive/" + encodeURIComponent(story.id) + suffix;
    }

    formatNewsDate(dateStr) {
      try {
        const locale = NEWS_DATE_LOCALE[this.lang] || "en-GB";
        return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateStr + "T00:00:00Z"));
      } catch (e) {
        return dateStr;
      }
    }

    // ---------- story pop-out modal ----------
    // Same interaction and markup contract as the newsletter archive's
    // own story modal (members-worker's renderArchiveList /
    // einvoicing-compliance-tracker.html's wireArchiveStoryModal): a
    // #storyModalOverlay/#storyModalBody/#storyModalClose triplet
    // (mapPageBodyHtml()) fetches the real story permalink, pulls
    // `.wrap .card`'s innerHTML out of the response, and drops it into
    // the modal body -- so a click on a news-row item behaves exactly
    // like clicking a story in the newsletter archive itself, just
    // without leaving The Map. Escape/backdrop/close-button handling is
    // wired once in wireStoryModal(); the Escape listener itself is a
    // module-level singleton (see wireGlobalEscapeHandler() above).
    openStoryModal(id) {
      const overlay = this.$("storyModalOverlay");
      const modalBody = this.$("storyModalBody");
      if (!overlay || !modalBody) return;
      modalBody.innerHTML = '<p class="modal-loading">' + escHtml(this.ui().modalLoading) + "</p>";
      overlay.classList.add("open");
      const suffix = this.lang !== "en" ? "?lang=" + this.lang : "";
      const url = MEMBERS_ORIGIN + "/members/archive/" + encodeURIComponent(id);
      fetch(url + suffix)
        .then((res) => {
          if (!res.ok) throw new Error("fetch failed: " + res.status);
          return res.text();
        })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const card = doc.querySelector(".wrap .card");
          if (!card) throw new Error("story card not found in response");
          modalBody.innerHTML = card.innerHTML;
        })
        .catch((err) => {
          console.error("The Map: story modal failed to load", err);
          modalBody.innerHTML = '<p class="modal-loading">' + escHtml(this.ui().modalOfficialSource) + ': <a href="' + url + '">' + url + "</a></p>";
        });
    }

    closeStoryModal() {
      const overlay = this.$("storyModalOverlay");
      if (overlay) overlay.classList.remove("open");
    }

    wireStoryModal() {
      const overlay = this.$("storyModalOverlay");
      const closeBtn = this.$("storyModalClose");
      if (!overlay || !closeBtn) return;
      closeBtn.addEventListener("click", () => this.closeStoryModal());
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.closeStoryModal();
      });
    }

    // The footer's "Browse the newsletter archive" and "Subscribe to
    // the newsletter" buttons open the tracker's own existing in-page
    // panels for those (openArchive()/openSubscribePage(), passed in as
    // opts.openArchive/opts.openSubscribe by openMapPage()) instead of
    // leaving the page -- same idea as navigate()/closePanel() above.
    // Standalone /map has neither opt, so both buttons stay plain links
    // (there's no in-page panel system to open into there). Wired once
    // here rather than in applyStaticText(), which re-runs on every
    // language switch and would otherwise stack a fresh listener on the
    // same persistent element each time.
    wireFooterCta() {
      if (!this.isEmbedded()) return;
      const archiveLink = this.$("archiveBtnLink");
      if (archiveLink && this.opts.openArchive) {
        archiveLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.opts.openArchive();
        });
      }
      const subscribeLink = this.$("subscribeBtnLink");
      if (subscribeLink && this.opts.openSubscribe) {
        subscribeLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.opts.openSubscribe();
        });
      }
    }

    // ---------- sidebar (regions flex to the active map's region) ----------
    buildCountryList(root) {
      const old = this.$("sidebarBlocks");
      if (old) old.remove();
      const doc = root.ownerDocument;
      const wrap = doc.createElement("div");
      wrap.id = "sidebarBlocks";
      root.appendChild(wrap);
      this.sidebarBlocks = {};

      for (const region of this.regionOrder) {
        const list = this.countriesInRegion(region);
        if (!list.length) continue;
        const block = doc.createElement("div");
        block.className = "region-block";
        block.dataset.region = region;

        const toggle = doc.createElement("button");
        toggle.type = "button";
        toggle.className = "region-name-toggle";
        toggle.innerHTML =
          '<span class="region-name-text">' + escHtml(this.regionName(region)) + "</span>" +
          '<span class="region-count">' + list.length + "</span>" +
          '<span class="chevron">▾</span>';
        toggle.addEventListener("click", () => block.classList.toggle("collapsed"));
        block.appendChild(toggle);

        const rows = doc.createElement("div");
        rows.className = "region-rows";
        for (const c of list) {
          const row = doc.createElement("a");
          row.className = "country-row";
          row.href = this.deepDiveUrl(c);
          if (this.opts.navigate) {
            row.addEventListener("click", (e) => { e.preventDefault(); this.navigate(c); });
          }
          row.innerHTML =
            '<span class="flag">' + c.flag + "</span>" +
            '<span class="name">' + escHtml(c.name) + "</span>" +
            '<span class="dot status-' + c.status + '" title="' + escHtml(this.ui().status[c.status]) + '"></span>';
          rows.appendChild(row);
        }
        block.appendChild(rows);
        wrap.appendChild(block);
        this.sidebarBlocks[region] = block;
      }
    }

    // Re-orders the sidebar so `region`'s block is first (DOM reorder
    // via appendChild, which moves existing nodes), expands it, and
    // collapses the rest — independent of any block's own manual
    // collapse toggle, which switching the active map re-asserts over.
    focusSidebarRegion(region) {
      const wrap = this.$("sidebarBlocks");
      if (!wrap) return;
      const order = [region, ...this.regionOrder.filter((r) => r !== region)];
      for (const r of order) {
        const b = this.sidebarBlocks[r];
        if (b) wrap.appendChild(b);
      }
      for (const r of this.regionOrder) {
        const b = this.sidebarBlocks[r];
        if (!b) continue;
        b.classList.toggle("active-region", r === region);
        b.classList.toggle("collapsed", r !== region);
      }
    }

    // ---------- region tabs ----------
    buildTabs() {
      const root = this.$("regionTabs");
      if (!root) return;
      const doc = root.ownerDocument;
      root.innerHTML = "";
      for (const region of this.regionOrder) {
        const count = this.countriesInRegion(region).length;
        const btn = doc.createElement("button");
        btn.type = "button";
        btn.className = "region-tab" + (region === this.activeRegion ? " active" : "");
        btn.dataset.region = region;
        btn.innerHTML = escHtml(this.regionName(region)) + ' <span class="count">' + count + "</span>";
        btn.addEventListener("click", () => this.setActiveRegion(region));
        root.appendChild(btn);
      }
    }

    regionName(region) { return this.ui().regionNames[region] || region; }

    // ---------- legend ----------
    buildLegend() {
      const host = this.$("legendHost");
      if (!host) return;
      const swatchFor = {
        inforce: "var(--live)", upcoming: "var(--upcoming)", b2gonly: "var(--soon)",
        nomandate: "var(--nomandate)", tracked: "var(--tracked)",
      };
      host.innerHTML = this.ui().legend.map((item) =>
        '<div class="legend-item"><span class="legend-swatch" style="background:' + (swatchFor[item.key] || "var(--ink-3)") + '"></span> ' + escHtml(item.text) + "</div>"
      ).join("");
    }

    setActiveRegion(region) {
      this.activeRegion = region;
      this.$$(".region-tab").forEach((b) => b.classList.toggle("active", b.dataset.region === region));
      this.$$(".region-map-svg").forEach((s) => s.classList.toggle("active", s.dataset.region === region));
      this.updateMapHeadingAndNote(region);
      if (this.isEmbedded()) {
        const root = this.$("sidebarList");
        if (root) this.buildRecentNewsList(root, region);
      } else {
        this.focusSidebarRegion(region);
      }
    }

    updateMapHeadingAndNote(region) {
      const heading = this.$("mapHeading");
      const note = this.$("mapNote");
      const count = this.countriesInRegion(region).length;
      const total = this.countries.length;
      const jurisdictionsText = this.ui().jurisdictionsOf.replace("{count}", count).replace("{total}", total);
      if (heading) heading.innerHTML = escHtml(this.regionName(region)) + " <span>" + escHtml(jurisdictionsText) + "</span>";
      if (note) note.textContent = this.ui().regionNotes[region] || "";
    }

    // ---------- language switch ----------
    // In panel mode the page's own EN/ES/DE/FR row is hidden: the
    // tracker already has ONE language switcher at the top of the real
    // page, and every other in-page panel (/sources, deep-dive, archive,
    // education, feedback, subscribe) relies on that single switcher
    // rather than showing a second one inside the panel itself -- see
    // the `eicc:languageChanged` listener wired in openMapPage()'s
    // caller, which already re-renders this panel on an outer language
    // change. Standalone /map has no outer nav, so it keeps its own.
    buildLangSwitch() {
      const host = this.$("langSwitch");
      if (!host) return;
      if (this.isEmbedded()) {
        host.style.display = "none";
        host.innerHTML = "";
        return;
      }
      host.style.display = "";
      const doc = host.ownerDocument;
      host.innerHTML = "";
      for (const code of ["en", "es", "de", "fr"]) {
        const btn = doc.createElement("button");
        btn.type = "button";
        btn.className = "lang-btn" + (code === this.lang ? " active" : "");
        btn.dataset.lang = code;
        btn.textContent = code.toUpperCase();
        btn.title = (this.uiDict[code] || {}).langName || code;
        btn.addEventListener("click", () => this.setLang(code));
        host.appendChild(btn);
      }
    }

    applyStaticText() {
      const u = this.ui();
      const set = (id, fn) => { const el = this.$(id); if (el) fn(el); };
      set("brandEyebrow", (el) => (el.textContent = u.eyebrow));
      set("brandTitle", (el) => (el.innerHTML = u.titleHtml));
      set("brandSub", (el) => (el.textContent = u.subtitle));
      set("sidebarHeading", (el) => (el.textContent = this.isEmbedded() ? u.recentNews : u.allJurisdictions));
      set("footerText", (el) => (el.textContent = u.footerText));
      const suffix = this.lang !== "en" ? "?lang=" + this.lang : "";
      set("backToTrackerLink", (el) => {
        el.textContent = u.backToTracker;
        if (!this.isEmbedded()) el.href = (this.opts.backUrl || "/") + suffix;
      });
      set("archiveBtnLink", (el) => {
        el.textContent = u.archiveBtn;
        el.href = (this.opts.archiveUrl || "https://members.e-invoicingcompliancecorner.com/members/archive") + suffix;
      });
      set("subscribeBtnLink", (el) => {
        el.textContent = u.subscribeBtn;
        el.href = (this.opts.subscribeUrl || "/subscribe.html") + suffix;
      });
      this.buildLegend();
      this.$$(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === this.lang));
    }

    setLang(lang) {
      if (!this.uiDict[lang] || lang === this.lang) return;
      this.lang = lang;
      const apply = () => {
        this.applyStaticText();
        this.buildTabs();
        this.buildSidebar();
        this.focusSidebarRegion(this.activeRegion);
        this.updateMapHeadingAndNote(this.activeRegion);
        this.refreshMapLabels();
        this.hideTooltip();
      };
      if (this.opts.fetchCountries) {
        this.opts.fetchCountries(lang).then((countries) => {
          this.countries = countries;
          this._indexCountries();
          apply();
        }).catch((err) => {
          console.error("The Map: language switch failed to fetch translated country names", err);
          apply();
        });
      } else {
        apply();
      }
    }

    // ---------- tooltip ----------
    showTooltip(evt, nameEn) {
      const tooltip = this.$("tooltip");
      const info = this.byName.get(nameEn);
      if (!tooltip || !info) return;
      tooltip.innerHTML =
        '<p class="tt-name">' + info.flag + " " + escHtml(info.name) + "</p>" +
        '<span class="tt-status st-' + info.status + '">' + escHtml(this.ui().status[info.status]) + "</span>" +
        '<p class="tt-cta">' + escHtml(this.ui().tooltipCta) + "</p>";
      tooltip.style.opacity = 1;
      this.positionTooltip(evt);
    }
    positionTooltip(evt) {
      const tooltip = this.$("tooltip");
      const wrapEl = this.root.querySelector ? this.root.querySelector(".map-wrap") : null;
      if (!tooltip || !wrapEl) return;
      const wrap = wrapEl.getBoundingClientRect();
      const x = evt.clientX - wrap.left + 16;
      const y = evt.clientY - wrap.top + 16;
      tooltip.style.left = Math.min(x, wrap.width - 230) + "px";
      tooltip.style.top = y + "px";
    }
    hideTooltip() {
      const tooltip = this.$("tooltip");
      if (tooltip) tooltip.style.opacity = 0;
    }

    // Small-country marker <text> elements, keyed by region, so a
    // language switch can relabel them in place (they're baked into the
    // SVG once at load and never rebuilt otherwise).
    refreshMapLabels() {
      for (const region of Object.keys(this.smallMarkerRegistry)) {
        for (const { textSel, nameEn } of this.smallMarkerRegistry[region]) {
          const info = this.byName.get(nameEn);
          if (info) textSel.text(info.flag + " " + info.name);
        }
      }
    }

    // ---------- map rendering (generic across all 4 regions) ----------
    renderRegionMap(region, world) {
      const host = this.$("mapSvgHost");
      if (!host) return;
      const svg = d3.select(host)
        .append("svg")
        .attr("class", "region-map-svg" + (region === "Europe" ? " active" : ""))
        .attr("data-region", region)
        .attr("viewBox", "0 0 " + WIDTH + " " + HEIGHT);

      const projection = calibrateProjection(this.regionBounds[region]);
      const path = d3.geoPath(projection);
      const regionCountries = this.countriesInRegion(region);

      svg.append("g").selectAll("path.bg")
        .data(world.features)
        .join("path")
        .attr("class", "geo-country geo-untracked")
        .attr("d", path);

      this.smallMarkerRegistry[region] = [];
      const smallEntries = []; // drawn after every normal filled country,
                                // so marker labels always paint on top.

      for (const c of regionCountries) {
        const feature = world.features.find((f) => f.properties.name === c.topoName);
        let isSmall = !feature;
        if (feature) {
          const bounds = path.bounds(feature);
          const w = bounds[1][0] - bounds[0][0], h = bounds[1][1] - bounds[0][1];
          isSmall = w < SMALL_PX || h < SMALL_PX;
        }
        if (feature && !isSmall) {
          svg.append("path")
            .datum(feature)
            .attr("class", "geo-country clickable status-" + c.status)
            .attr("d", path)
            .on("mousemove", (evt) => this.showTooltip(evt, c.nameEn))
            .on("mouseleave", () => this.hideTooltip())
            .on("click", () => this.navigate(this.byName.get(c.nameEn) || c));
          continue;
        }
        smallEntries.push({ c, feature });
      }

      const markerLayer = svg.append("g");
      const centerX = WIDTH / 2, centerY = HEIGHT / 2;

      // Place every label BEFORE drawing any of them, so each one can see
      // where the others went. Sorted by name rather than by query order,
      // so the same data always produces the same layout.
      const placed = [];
      for (const { c, feature } of [...smallEntries].sort((a, b) => a.c.nameEn.localeCompare(b.c.nameEn))) {
        let centroid;
        // No markerLonLat fallback: it existed for three countries that
        // all have real geometry, so it never once ran. A country that
        // reaches here without a feature has a topoName matching nothing
        // in the topology, and the repair is a TOPO_NAME_OVERRIDES entry
        // -- real geometry beats a hand-picked point. tests/map-tiles-
        // agree.mjs fails before it can ship, so this warning is a
        // backstop and not the notification.
        if (feature) centroid = path.centroid(feature);
        else { console.warn("The Map: no topology feature for", c.nameEn, "-- add a TOPO_NAME_OVERRIDES entry."); continue; }

        const dx = centroid[0] - centerX, dy = centroid[1] - centerY;
        const mag = Math.max(1, Math.hypot(dx, dy));
        const dirX = dx / mag, dirY = dy / mag;
        const estWidth = (c.flag.length + c.name.length + 2) * 6.5;

        let spot = null;
        for (const [grow, turn] of LABEL_PLACEMENTS) {
          const [ux, uy] = rotate(dirX, dirY, turn);
          const anchorEnd = ux < 0;
          const [lx, ly] = clampLabel(centroid[0] + ux * 42 * grow,
                                      centroid[1] + uy * 34 * grow, anchorEnd, estWidth);
          const box = labelBox(lx, ly, anchorEnd, estWidth);
          const candidate = { c, centroid, labelX: lx, labelY: ly, anchorEnd, estWidth, box };
          if (!spot) spot = candidate;                    // the natural spot, kept as fallback
          if (!placed.some((p) => boxesOverlap(p.box, box))) { spot = candidate; break; }
        }
        // If every candidate collides, take the natural position anyway.
        // A label on top of another is bad; a country missing from the
        // map is worse, and silently dropping one is how a reader
        // concludes we do not track it.
        placed.push(spot);
      }

      for (const { c, centroid, labelX, labelY, anchorEnd, estWidth } of placed) {
        markerLayer.append("line")
          .attr("class", "leader-line")
          .attr("x1", centroid[0]).attr("y1", centroid[1])
          .attr("x2", labelX).attr("y2", labelY);

        const g = markerLayer.append("g")
          .attr("class", "small-country-marker status-" + c.status)
          .on("mousemove", (evt) => this.showTooltip(evt, c.nameEn))
          .on("mouseleave", () => this.hideTooltip())
          .on("click", () => this.navigate(this.byName.get(c.nameEn) || c));

        g.append("circle").attr("cx", labelX).attr("cy", labelY).attr("r", 7).attr("class", "status-" + c.status);
        const labelText = g.append("text")
          .attr("x", labelX + (anchorEnd ? -12 : 12))
          .attr("y", labelY + 3)
          .attr("text-anchor", anchorEnd ? "end" : "start")
          .text(c.flag + " " + c.name);
        this.smallMarkerRegistry[region].push({ textSel: labelText, nameEn: c.nameEn });
      }
    }
  }

  global.EICCMap = {
    init(rootEl, opts) { return new MapPanel(rootEl, opts); },
  };
})(window);
