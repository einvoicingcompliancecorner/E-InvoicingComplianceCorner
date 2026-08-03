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
//   archiveUrl / backUrl — base URLs for the two footer/header links
//                     (differ by runtime: absolute members-subdomain
//                     URL for the archive either way, but the "back to
//                     tracker" link's behavior differs between modes —
//                     see openMapPage()'s override).
// ================================================================
(function (global) {
  "use strict";

  const WIDTH = 720, HEIGHT = 620, PAD = 16, SMALL_PX = 18;

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

  // The world-atlas topology is large (~750KB) and identical regardless
  // of language or which mode (standalone vs panel) requests it — fetch
  // it at most once per page load no matter how many MapPanel instances
  // get created (e.g. closing and reopening the tracker's panel).
  let topoPromise = null;
  function loadTopology(url) {
    if (!topoPromise) topoPromise = fetch(url).then((r) => r.json());
    return topoPromise;
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
      this.byName = new Map();
      this.sidebarBlocks = {};
      this.smallMarkerRegistry = {};
      this.activeRegion = "Europe";
      this._indexCountries();
      this._boot();
    }

    // rootEl.getElementById / querySelectorAll work identically on
    // `document` and a `ShadowRoot`.
    $(id) { return this.root.getElementById(id); }
    $$(sel) { return this.root.querySelectorAll(sel); }
    ui() { return this.uiDict[this.lang] || this.uiDict.en; }

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
      this.focusSidebarRegion(this.activeRegion);

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

    // ---------- sidebar (regions flex to the active map's region) ----------
    buildSidebar() {
      const root = this.$("sidebarList");
      if (!root) return;
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
        inforce: "var(--live)", upcoming: "var(--upcoming)", b2gonly: "var(--b2gonly)",
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
      this.focusSidebarRegion(region);
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
    buildLangSwitch() {
      const host = this.$("langSwitch");
      if (!host) return;
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
      set("sidebarHeading", (el) => (el.textContent = u.allJurisdictions));
      set("footerText", (el) => (el.textContent = u.footerText));
      const suffix = this.lang !== "en" ? "?lang=" + this.lang : "";
      set("backToTrackerLink", (el) => {
        el.textContent = u.backToTracker;
        if (!this.opts.navigate) el.href = (this.opts.backUrl || "/einvoicing-compliance-tracker.html") + suffix;
      });
      set("archiveBtnLink", (el) => {
        el.textContent = u.archiveBtn;
        el.href = (this.opts.archiveUrl || "https://members.e-invoicingcompliancecorner.com/members/archive") + suffix;
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

      for (const { c, feature } of smallEntries) {
        let centroid;
        if (feature) centroid = path.centroid(feature);
        else if (c.markerLonLat) centroid = projection(c.markerLonLat);
        else { console.warn("The Map: no map position for", c.nameEn, "-- add a markerLonLat override."); continue; }

        const dx = centroid[0] - centerX, dy = centroid[1] - centerY;
        const mag = Math.max(1, Math.hypot(dx, dy));
        const dirX = dx / mag, dirY = dy / mag;
        const rawX = centroid[0] + dirX * 42;
        const rawY = centroid[1] + dirY * 34;
        const anchorEnd = dirX < 0;
        const estWidth = (c.flag.length + c.name.length + 2) * 6.5;
        const [labelX, labelY] = clampLabel(rawX, rawY, anchorEnd, estWidth);

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
