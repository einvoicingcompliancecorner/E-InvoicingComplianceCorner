// guides-picker.mjs — the page a reader chooses countries on.
//
// Dan, 21 August 2026: "I'd like to create a new page under Resources menu
// option. The page should be called - compliance guides. Effectively this
// page lets the user select the countries they are interested in, and
// download a PDF guide for each country, which would be based on content
// from the deep-dives. This should be a gated page."
//
// The guide document itself lives in guides-render.mjs. This is only the
// chooser, and it is deliberately its own module: the document is printed
// prose with an absolute-pt stylesheet and a browser-side fitter, and the
// chooser is a dark-chrome web page with checkboxes. Two audiences, two
// media, no shared CSS worth the coupling.
//
// ---- WHY THE COUNTRY LIST IS NOT PAGINATED, FILTERED OR LAZY ----------
//
// Seventy checkboxes is a small page. The temptation was a search box and
// a virtualised list; what a reader actually does here is scan for the
// four or five markets they operate in, and a plain grouped grid does
// that with the browser's own find-in-page, in every language, offline,
// and with no JavaScript at all. The only script on this page keeps the
// count and the button label honest.
//
// IT MUST WORK WITH THE SCRIPT DEAD. The form is a real GET form with a
// real submit button. If the script never loads, the reader ticks boxes
// and presses the button and gets their guide -- they just do not see a
// running total. That is the whole degradation.

import { escapeHtml, translateCountryName } from "./deep-dive-render.mjs";

const esc = escapeHtml;

/** The chooser's own styles, on top of ROI_STYLE's chrome. */
export const PICKER_STYLE = `
.gp-note{color:var(--muted);font-size:13px;margin:0 0 20px;max-width:74ch}
.gp-region{margin:0 0 22px}
.gp-region h2{font-size:19px;margin:0 0 10px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.gp-region h2 button{background:none;border:0;padding:0;cursor:pointer;font-family:'IBM Plex Mono',monospace;
  font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);
  text-decoration:underline;text-underline-offset:3px}
.gp-region h2 button:hover{color:var(--soon)}
.gp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:6px 14px}
/* EVERY DECLARATION HERE IS UNDOING ONE FROM ROI_STYLE, which carries a
   bare label{} element rule for the planner's field captions: monospace, muted,
   letter-spaced and UPPERCASE. That is right for "ANNUAL INVOICE VOLUME"
   and wrong for a country: CZECH REPUBLIC is harder to scan than Czech
   Republic, and uppercasing strips the accents readers navigate by in the
   three non-English editions. */
.gp-grid label{display:flex;align-items:flex-start;gap:8px;padding:5px 8px;border:1px solid transparent;
  border-radius:6px;cursor:pointer;font-size:14px;min-width:0;margin:0;line-height:1.35;
  font-family:'IBM Plex Sans',system-ui,sans-serif;text-transform:none;
  letter-spacing:normal;color:var(--text-lo)}
.gp-grid label:hover{border-color:var(--line);background:var(--ink-2)}
.gp-grid input{accent-color:var(--soon);width:15px;height:15px;flex:none;margin:2px 0 0}
/* WRAPS RATHER THAN TRUNCATES. The first version clipped with an
   ellipsis and the German edition printed "Dominikanische Republ…" --
   a country a reader is scanning for, cut off at the point that
   distinguishes it. A second line costs a few pixels in a grid that
   already has auto rows. */
.gp-grid span{overflow-wrap:anywhere}
.gp-grid .saved span::after{content:'\\00a0\\2605';color:var(--soon);font-size:11px}
/* THE BAR IS STICKY BECAUSE THE DECISION IS MADE AT THE BOTTOM.
   A reader scrolls to Vietnam, ticks it, and the button is 1,400px back
   up the page. Sticky-bottom is the one piece of chrome this page needs
   and it is why the count is worth a script at all. */
.gp-bar{position:sticky;bottom:0;background:var(--ink-2);border-top:1px solid var(--line);
  margin:24px -20px 0;padding:14px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.gp-count{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:1px;
  text-transform:uppercase;color:var(--muted)}
.gp-bar .sp{flex:1 1 auto}
.gp-go{background:var(--soon);color:#1a1206;border:0;border-radius:8px;padding:11px 22px;
  font-family:'Big Shoulders Display',sans-serif;font-weight:800;font-size:17px;
  letter-spacing:.8px;text-transform:uppercase;cursor:pointer}
.gp-go:disabled{opacity:.45;cursor:not-allowed}
.gp-lite{background:none;border:1px solid var(--line);color:var(--muted);border-radius:8px;
  padding:9px 14px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.2px;
  text-transform:uppercase;cursor:pointer}
.gp-lite:hover{color:var(--text-lo);border-color:var(--muted)}
.gp-back{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.6px;
  text-transform:uppercase;color:var(--muted);text-decoration:none;margin:0 0 18px}
.gp-back:hover{color:var(--soon)}
@media print{.gp-bar{position:static}}
`;

/**
 * The chooser.
 *
 * countries: [{ code, name_en, region }]
 * saved:     array of country names the reader already follows
 */
export function renderPickerBody({ countries, saved = [], lang, t, regionName = (r) => r, action = "/compliance-guides/guide" }) {
  const savedSet = new Set(saved.map((s) => String(s)));

  // GROUPED BY THE SAME REGIONS THE TRACKER USES, in the order they come
  // out of the query. Not alphabetical across all seventy: a reader
  // shopping for "our European footprint" wants Europe together, and the
  // regions are how every other page on this site cuts the world.
  const byRegion = new Map();
  for (const c of countries) {
    const r = c.region || "";
    if (!byRegion.has(r)) byRegion.set(r, []);
    byRegion.get(r).push(c);
  }

  const regions = [...byRegion.entries()].map(([region, list]) => {
    const items = list
      .map((c) => ({ c, label: translateCountryName(lang, c.name_en) }))
      // SORTED BY THE NAME THE READER SEES, not by name_en. In German the
      // list would otherwise read Belgium, Croatia, Cyprus... rendered as
      // Belgien, Kroatien, Zypern -- alphabetical in a language nobody on
      // the page is reading. localeCompare with the page's own language.
      .sort((a, b) => a.label.localeCompare(b.label, lang));
    return `<section class="gp-region">
  <h2>${esc(regionName(region))} <button type="button" data-all="${esc(region)}">${
      esc(t("pick.all", "Select all"))}</button></h2>
  <div class="gp-grid">${items.map(({ c, label }) => `
    <label class="${savedSet.has(c.name_en) ? "saved" : ""}"><input type="checkbox" name="c" value="${
      esc(c.code)}"${savedSet.has(c.name_en) ? " checked" : ""}><span>${esc(label)}</span></label>`).join("")}
  </div>
</section>`;
  }).join("");

  const savedNote = saved.length
    ? `<p class="gp-note">${esc(t("pick.savedNote",
        "The countries you follow are ticked already and marked with a star. Add or remove any you like."))}</p>`
    : "";

  return `<div class="wrap">
  <a class="gp-back" href="/einvoicing-compliance-tracker.html">${esc(t("back", "← Back to global tracker"))}</a>
  <p class="eyebrow">${esc(t("pick.eyebrow", "Subscriber tool"))}</p>
  <h1>${esc(t("pick.title", "Compliance guides"))}</h1>
  <p class="gp-note">${esc(t("pick.lede",
    "Pick the markets you care about and we will build a one-page briefing for each: the mandate as it stands, the dated timeline, the penalties, the key facts and what to do next. It opens ready to print or save as a PDF."))}</p>
  ${savedNote}
  <form method="get" action="${esc(action)}" id="gpForm">
    <input type="hidden" name="lang" value="${esc(lang)}">
    ${regions}
    <div class="gp-bar">
      <span class="gp-count" id="gpCount" data-one="${esc(t("pick.countOne", "1 country selected"))}"
        data-many="${esc(t("pick.countMany", "{0} countries selected"))}"
        data-none="${esc(t("pick.countNone", "No countries selected"))}"></span>
      <span class="sp"></span>
      <button type="button" class="gp-lite" id="gpClear">${esc(t("pick.clear", "Clear"))}</button>
      <button type="submit" class="gp-go" id="gpGo">${esc(t("pick.build", "Build my guide"))}</button>
    </div>
  </form>
</div>`;
}

/**
 * The only script on the page: keep the count truthful and stop an empty
 * submit. Everything else works without it.
 */
export const PICKER_SCRIPT = `
(function(){
  var form = document.getElementById('gpForm');
  if(!form) return;
  var count = document.getElementById('gpCount');
  var go = document.getElementById('gpGo');
  function boxes(){ return form.querySelectorAll('input[name="c"]'); }
  function update(){
    var n = 0, all = boxes();
    for(var i=0;i<all.length;i++) if(all[i].checked) n++;
    if(count){
      count.textContent = n === 0 ? count.getAttribute('data-none')
        : n === 1 ? count.getAttribute('data-one')
        : count.getAttribute('data-many').replace('{0}', String(n));
    }
    // AN EMPTY SUBMIT IS THE ONE THING WORTH PREVENTING. Without this the
    // reader lands on a guide of nothing at all and has to work out that
    // the page is not broken, it is empty -- which reads as broken.
    if(go) go.disabled = n === 0;
  }
  form.addEventListener('change', update);
  form.addEventListener('click', function(e){
    var t = e.target;
    if(t && t.getAttribute && t.getAttribute('data-all') !== null){
      // Select-all is really a toggle. A button that only ever adds is a
      // button a reader presses once by accident and then undoes by hand
      // seventeen times.
      var sec = t.closest('.gp-region');
      var list = sec ? sec.querySelectorAll('input[name="c"]') : [];
      var every = true;
      for(var i=0;i<list.length;i++) if(!list[i].checked) every = false;
      for(var j=0;j<list.length;j++) list[j].checked = !every;
      update();
    }
  });
  var clear = document.getElementById('gpClear');
  if(clear) clear.addEventListener('click', function(){
    var all = boxes();
    for(var i=0;i<all.length;i++) all[i].checked = false;
    update();
  });
  update();
})();`;
