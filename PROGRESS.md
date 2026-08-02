# The E-Invoicing Compliance Corner — Project Progress

Last updated: 2 August 2026. This is the top-level "where things stand"
document for the whole project — for narrower, deeper detail on specific
areas, see `ADDING-A-COUNTRY.md` (the country-adding runbook — partly
superseded now that deep-dive pages are dynamic, see its own updated note)
and `DEEP-DIVE-MIGRATION-CHECKLIST.md` (the Stage 4 dynamic-architecture
migration, schema reference, cutover details, and lessons learned).

---

## What this product is

A subscription newsletter and compliance tracker targeting compliance
professionals and finance teams in B2B SaaS, tracking e-invoicing mandates
across global jurisdictions in English, Spanish, German, and French.

**Infrastructure:**
- Frontend: `e-invoicingcompliancecorner.com` is served by a Cloudflare
  **Worker with static assets** (`eicc-public`, renamed 2 August 2026 from
  its auto-generated name `winter-fog-ff16`) — not Cloudflare Pages, as
  earlier versions of this doc assumed. That was corrected once the live
  dashboard was actually inspected during the Stage 4 cutover (see
  `DEEP-DIVE-MIGRATION-CHECKLIST.md`). Static files (tracker, subscribe,
  education pages, etc.) live in the repo root and deploy via
  `wrangler deploy` from `site-worker/`, run by hand from a local
  machine — there's no GitHub-triggered auto-deploy for this project, and
  the earlier "blocked by an account flag" item below no longer applies
  now that the project isn't on Pages at all. Country deep-dive pages are
  the one part of the frontend that's no longer static — they render at
  request time from D1, via this same Worker (see Stage 4 below).
- Backend: Cloudflare Workers (`members-worker/src/index.js`), deployed
  the same way (`wrangler deploy`, by hand)
- Database: D1 SQLite (`eicc-content`, ID `d1d10bd0-e90a-44a3-9494-a63689e8d32e`)
  — shared by both Workers
- Payments: Lemon Squeezy (still in test mode — see Open Items)
- Email: Resend
- Repo: `https://github.com/danielyoung76/E-InvoicingComplianceCorner`
  (public, `main` branch)

---

## Completed work

### Content: countries and newsletter stories

- Full D1 schema for country/story content, with 40+ original newsletter
  stories across the initial country set, in all 4 languages
- **Portugal and Finland** added as new tracked countries (tracker DATA,
  countries.js, members-worker touchpoints, deep-dive pages, newsletter
  stories, full translations)
- **12 zero-coverage countries** identified via a full country-by-country
  story-count audit, then given 3 newsletter stories each (sourced to
  official government portals, translated): Italy, United Kingdom, India,
  Romania, European Union, China, Canada, United States, Ireland, Norway,
  Singapore, Sweden
- Only **Peru** remains from that original gap-audit list

### Site features (static + Worker)

- Newsletter archive: region-grouped country checkboxes (auto-wrapping to
  two columns for regions with many countries), edition filtering
  (defaulting to "This Year"), preference pre-checking, per-story language
  switcher
- Source/deep-dive link auto-rendering, fixing a double-render bug that
  had affected the original stories
- 60-day free trial subscription flow, bypassing Lemon Squeezy, with
  abuse-prevention (email-based blocking preserved through paid
  conversion)
- Monthly notification cron fully migrated from the old ISSUES KV
  namespace (now retired) to D1 stories

### Stage 4: dynamic tracker/deep-dive architecture

Country deep-dive pages used to exist as **static HTML files**, regenerated
by hand and re-uploaded on every change — a major source of friction, since
even a single date correction required a full site re-upload. Stage 4
replaced this with a D1-backed, dynamically-rendered system.

**All 31 tracker countries are now fully migrated** — content,
translations, and structure verified against the static originals:
Portugal, France, Germany, Poland, Spain, Malaysia, United Kingdom,
Romania, Belgium, Finland, Croatia, Denmark, Ireland, Norway, Slovakia,
Sweden, Australia, China, India, New Zealand, Singapore, Brazil, Mexico,
Peru, Chile, United States, Canada, European Union, Italy, Saudi Arabia,
United Arab Emirates. Every country also has a `mandate_summary`
status-banner tile (added 2 August 2026), translated into ES/DE/FR.

Along the way, the shared architecture itself evolved substantially:
- A unified light-paper visual theme across all countries (a deliberate
  choice over per-country styling)
- A "tracker phrasing wins" rule for milestones that exist in both the
  tracker's `DATA` array and a deep-dive page
- Badge status simplified to 2 states (in-effect/upcoming), dropping a
  3rd "due soon" state that existed on some static pages
- A generalized lifecycle/pill-list card system (supporting any number of
  cards per country, in pill or plain-list display style) — built after
  Malaysia revealed a genuine one-card-per-country limitation in the
  original design
- A genuine tabular penalty schedule system, for countries with sourced
  fine data
- Inline badge tags on card headings (e.g. the UK's "Confirmed"/"Pending
  Budget 2026")

**The cutover is live (deployed 2 August 2026).** The 30 static
per-country `.html` files have been deleted from the repo,
`einvoicing-compliance-tracker.html` and `sitemap.xml` point at the new
extensionless URLs (`/spain`, not `/spain.html`), and a Worker script
(`site-worker/src/index.js`) renders every country page from D1 at
request time, with automatic language routing (query param → cookie →
`Accept-Language` header → English). Deployed via `wrangler deploy` and
spot-checked live. See `DEEP-DIVE-MIGRATION-CHECKLIST.md`'s "Cutover to
production" section for the full architecture.

**Full detail, schema reference, and every lesson learned**: see
`DEEP-DIVE-MIGRATION-CHECKLIST.md`.

---

## Current state — what's actually live vs. in progress

- All 31 countries' Stage 4 D1 content and mandate-summary translations
  are live in production D1.
- **The cutover is fully deployed and live** — `eicc-public` now has the
  `eicc_content` D1 binding and the ASSETS binding, real country URLs
  (e.g. `/spain`, `/croatia?lang=fr`) render dynamically from D1, and
  static assets (index.html, the tracker, education pages, etc.) serve
  normally alongside them. Confirmed with a live spot-check post-deploy.
- The newsletter/tracker's core static content (all countries' `DATA`
  entries, stories, translations) is live and current.

---

## Open items / next steps

### Stage 4 continuation
- Stage 4 and the cutover are both complete — nothing outstanding here.
- Peru is fully migrated to Stage 4, but is still uncovered by newsletter
  stories specifically — a separate, older gap, not a Stage 4 one
- The tracker's **own** full-page dynamic rendering was never built —
  only the timeline *section* has been proven to render dynamically. The
  tracker page itself remains static HTML, regenerated by hand.

### Broader architecture (discussed, not yet built)
- Stages 1-3 of the original country-adding architecture rework (a
  migration-tracking table, universal `INSERT OR IGNORE`, and a real
  `/admin/add-country` endpoint) were discussed but superseded in
  priority by the Stage 4 work — still worth doing once Stage 4's
  cutover is complete, since the two efforts overlap
- Eliminate the 3 hardcoded duplicates in `members-worker/src/index.js`
  (`COUNTRIES_BY_REGION`, `COUNTRY_NAME_TRANSLATIONS`,
  `COUNTRY_DEEP_DIVE_SLUGS`) in favor of querying D1 directly

### Business & strategy (discussed, genuinely undecided)
- Competitive review of theinvoicinghub.com
- Pricing reconsideration ($5/$8 vs. current)
- Vendor registration/advertising feature (country-matched banners
  alongside email alerts, "gold member" placement)
- Resources menu reorganization: move Deep Dives under it, add a
  published list of accredited sources, add a vendor-assessment RFI
  template

### Smaller pending items
- Lemon Squeezy still in test mode — "Copy to Live Mode" not yet done;
  Subscribe/Archive links still marked "Coming Soon" on the tracker
  until this happens
- Cloudflare Web Analytics not yet set up
- Content-monitoring Worker (designed in `CONTENT-MONITORING.md`, never
  built)
- Privacy policy Section 4 has placeholder ESP references needing a fix
- Translation frameworks for other static site pages and deep-dive pages
  more broadly (separate from the Stage 4 dynamic-architecture effort)
