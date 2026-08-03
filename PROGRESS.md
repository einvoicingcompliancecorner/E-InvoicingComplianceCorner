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
- **13 zero-coverage countries** identified via a full country-by-country
  story-count audit, then given 3 newsletter stories each (sourced to
  official government portals, translated): Italy, United Kingdom, India,
  Romania, European Union, China, Canada, United States, Ireland, Norway,
  Singapore, Sweden, and finally **Peru** (2 August 2026, migrations
  199-200 — Resolutions 000075/000048/000143-2026/SUNAT: the day-one
  e-invoicing rule, the SEE overhaul with the single-comprobante
  credit-note rule, and the 31 July postponements to April 2027; sourced
  to the official SUNAT CPE portal, corroborated against El Peruano and
  Deloitte). **The audit is fully closed — every tracked country now has
  story coverage.** Deploy pending:

  ```
  cd members-worker
  wrangler d1 execute eicc-content --remote --file=migrations/199_peru_stories.sql
  wrangler d1 execute eicc-content --remote --file=migrations/200_peru_story_translations.sql
  ```

  No Worker redeploy needed — stories render from D1 at request time,
  and the deep-dive link on each story comes from the countries.slug
  column (migration 198), so no code was touched at all. Spot-check:
  the three Peru stories appear in the newsletter archive with working
  language switching and a "read the deep dive" link to /peru.

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

### Site-wide language banner (2 August 2026)

Every page used to build its own language switcher separately — the tracker had
one style (instant switch, no reload), subscribe/feedback/education pages had
another (reload-based), and index.html/privacy-policy.html had none at all.
Worse, the two Cloudflare Workers behind the site (site-worker for the public
site, members-worker for the members subdomain) each persisted the choice in
a differently-scoped `eicc_lang` cookie, and the static pages persisted it in
`localStorage` — three unsynced copies of the same preference.

Replaced with one shared banner (a thin bar at the very top of every page)
and one shared `eicc_lang` cookie, scoped to `.e-invoicingcompliancecorner.com`
so it's visible on the apex domain and the members subdomain alike:
- `i18n/i18n.js` now injects the banner and reads/writes the shared cookie
  (falling back to a legacy `localStorage` value once, then migrating it into
  the cookie) — covers the tracker, subscribe, feedback, the 5 education
  pages, and privacy-policy.html (newly added to the i18n system for this).
  index.html is a pure redirect stub with no meaningful render time, so it
  was left out deliberately.
- `shared/deep-dive-render.mjs`'s `renderFullDeepDivePage()` renders the same
  banner server-side — covers site-worker's real country pages and
  members-worker's admin deep-dive preview route in one place.
- `members-worker/src/index.js`'s `pageShell()` renders it too — covers
  login, the newsletter archive, preferences, and individual issue pages.
  This also let 4 separate hand-built inline switchers in that file get
  deleted in favor of the one shared version.

### In-page country deep-dive panel (2 August 2026)

Clicking a country's "Deep Dive" link (sidebar or the top "Deep Dives" menu)
used to navigate away to a brand-new page. It now fetches that same page and
swaps it into a panel directly on the tracker, so the sidebar/menu stay
reachable and there's no full page reload — closing it (or the browser back
button) returns to the board exactly where it was. The links themselves still
carry real hrefs, so a crawler, a JS-disabled visitor, or anyone who
middle-clicks/opens in a new tab still gets the real, fully server-rendered
standalone page, unaffected.

Deep-dive pages and the tracker each define their own full-page CSS, with 8
overlapping class names between them (`.stat`, `.display`, `.num`, `.lbl`,
`.upcoming`, `.inforce`, `.portal-btn`, `.portal-row`) that would silently
collide if injected directly into the tracker's `<head>`. Fetched content is
injected into a shadow root instead, which fully isolates it — no auditing or
renaming needed in either stylesheet. Verified with a real jsdom-driven test
(not just code review): click-through, shadow DOM CSS scoping, the close
control, browser back/forward via `popstate`, and the fetch-failure fallback
to a normal navigation.

---

## Current state — what's actually live vs. in progress

- 31 countries' Stage 4 D1 content and mandate-summary translations are
  live in production D1. **Luxembourg is a 32nd country, fully built but
  not yet deployed** — see "Luxembourg added" below.
- **The cutover is fully deployed and live** — `eicc-public` now has the
  `eicc_content` D1 binding and the ASSETS binding, real country URLs
  (e.g. `/spain`, `/croatia?lang=fr`) render dynamically from D1, and
  static assets (index.html, the tracker, education pages, etc.) serve
  normally alongside them. Confirmed with a live spot-check post-deploy.
- The newsletter/tracker's core static content (all countries' `DATA`
  entries, stories, translations) is live and current.

### Luxembourg added (2 August 2026, deployed & verified)

Luxembourg has been fully built out as the site's 32nd country, following
the same real-research discipline as every other Stage 4 country (B2G
legal basis, phased rollout, and the 17 July 2026 proposed B2B mandate
were all sourced from the EU Digital Building Blocks Luxembourg page,
the Luxembourg government's own e-invoicing information page, and
VATupdate's coverage — not fabricated):

- `einvoicing-compliance-tracker.html`: 4 new `DATA` entries (`lx-b2g`,
  `lx-b2b-receipt`, `lx-b2b-issue-large`, `lx-b2b-issue-all`) plus a
  `DEEP_DIVES` entry — all validated with `node --check` and an HTML
  parse pass.
- `countries.js` and `members-worker/src/index.js`'s three hardcoded
  touchpoints (`COUNTRIES_BY_REGION`, `COUNTRY_NAME_TRANSLATIONS`,
  `COUNTRY_DEEP_DIVE_SLUGS`) and `shared/deep-dive-render.mjs`'s own
  slug map all updated in sync.
- `i18n/{en,es,de,fr}.json` `countryNames`, plus `i18n/{es,de,fr}-data.json`
  tracker-milestone translations for the 4 new `DATA` entries — all
  JSON-validated.
- Hardcoded country-count references (site meta descriptions, the
  subscribe page, the four education pages, and their i18n files) bumped
  from a stale "30" to 32 across all 4 languages.
- D1 migrations `191`–`195` (country row, milestones, deep-dive content,
  and ES/DE/FR translations for both) and `196`–`197` (one sourced
  newsletter story on the 17 July 2026 draft B2B law, plus its
  translations) — replayed locally against a full copy of `schema.sql` +
  every existing migration with zero Luxembourg-related errors (4
  pre-existing, unrelated errors from older migrations were also present
  in this replay and are not new).
- Luxembourg has no `deep_dive_penalty_rows` table entries — no fixed
  B2G fine schedule was found in research (non-compliant invoices are
  rejected/returned unpaid rather than fined under a published scale),
  so penalties are covered narratively instead, unlike Belgium.
- **Not yet run against production D1, and the two Workers have not been
  redeployed** — see the exact commands under "Open items" below.

### Resources menu + temporary open newsletter archive (2 August 2026, deployed & verified)

Two related tracker/members-worker changes, built together:

- The tracker's top-level "Deep Dives" button is now a "Resources" menu,
  with Deep Dives nested inside it as a flyout submenu item (opens
  beside the Resources panel on desktop; collapses to an inline
  accordion under 640px). Leaves room to add the previously-discussed
  accredited-providers list and RFI template as siblings later without
  a new top-level button each time.
- The newsletter archive is unhidden and added as a second item in the
  new Resources menu, linking straight to
  `https://members.e-invoicingcompliancecorner.com/members/archive`.
  It's deliberately open to anyone for a period of time — no login or
  active subscription required — to build page traction, controlled by
  a new `ARCHIVE_PUBLIC` var in `members-worker/wrangler.toml`
  (currently `"true"`). Anonymous visitors see a "free for a limited
  time — subscribe for email alerts" banner in place of the usual
  "Signed in as ___" line and don't get the logout button or manage-
  preferences link; genuine signed-in subscribers see the normal view
  either way, unaffected.
- To end the promo: set `ARCHIVE_PUBLIC = "false"` (or delete the line)
  in `members-worker/wrangler.toml` and redeploy. It can also be
  flipped in the Cloudflare dashboard (Workers & Pages → eicc-members →
  Settings → Variables) for an instant effect with no redeploy — but
  the next `wrangler deploy` from this repo will resync from whatever's
  in `wrangler.toml`, overwriting a dashboard-only change. Fine for a
  quick end-of-day flip; update the file too if you want it to stick.
- fr.json's "Education" menu label was "Ressources" before this change
  (a reasonable French rendering on its own, chosen by whoever set up
  that translation) — renamed to "Formation" to free up "Ressources"
  for the new Resources menu itself, avoiding two identically-labelled
  buttons in the French UI.
- **Bug fix (same day):** the Deep Dives flyout didn't visually pop out
  at all, despite its open/close state toggling correctly — the
  Resources panel it's nested inside has `overflow:hidden` (inherited
  from the base `.dropdown-panel` rule, there to clip item hover
  backgrounds to the rounded corners), which was silently clipping the
  absolutely-positioned flyout child too, even though it's positioned
  against its own `.dd-flyout` wrapper. Fixed with a `#resourcesPanel{
  overflow:visible;}` override. Confirmed via computed-style assertion
  in a jsdom test, since jsdom doesn't do real layout/paint and the
  earlier class-toggle-only test had missed this.
- **The newsletter archive now opens in the main frame**, same as a
  country deep dive, sidebar still visible throughout — not just a
  live link that navigates away. This was more involved than the deep
  dive panel because the archive is a genuinely interactive page
  (search box, edition filter, country checkboxes) driven by its own
  script, and it lives on a different origin (members subdomain):
  - `members-worker` now sends `Access-Control-Allow-Origin:
    https://e-invoicingcompliancecorner.com` on exactly the two
    archive GET routes (`withCors()`), so the tracker's own JS is
    allowed to read the response body cross-origin. No other route
    gets this header.
  - The tracker doesn't inject and re-run the archive's fetched
    `<script>` as-is — that script looks things up via the global
    `document`, which can't see inside a shadow root. Instead,
    `openArchive()` extracts the embedded `ARCHIVE_STORIES` JSON (and
    the two translated empty-state strings) straight out of the
    fetched HTML via a targeted regex against our own known
    `JSON.stringify` output format, and a new `renderArchiveGrid()`
    ports the same filtering logic (search + union country match +
    edition filter) scoped against the shadow root instead of
    `document`.
  - Relative `/members/...` links inside the fetched markup (e.g. a
    signed-in visitor's manage-preferences link) are rewritten to
    absolute members-subdomain URLs before injection, since the shadow
    content now lives on the tracker's own origin. Individual issue
    cards link to the real, full standalone issue page on the members
    subdomain rather than opening in-page too — only the archive list
    itself was asked for.
  - If the fetch fails, or succeeds but the response doesn't contain
    `.archive-wrap` (which is what happens if `ARCHIVE_PUBLIC` is ever
    turned off and the request gets transparently redirected to the
    login page instead), it falls back to a real navigation rather
    than showing something broken — same defensive pattern the country
    deep-dive panel already used.
  - Supports back/forward and a real, shareable URL via a
    `?view=archive` query param on the tracker's own page (there's no
    dedicated tracker-side path for it the way countries each have
    their own slug), detected both on `popstate` and on initial page
    load.
  - Validated with a jsdom test that mocks the cross-origin fetch using
    the *actual* `renderArchiveList()` output (extracted from
    members-worker's own source and required into the test, not a
    hand-written approximation) — confirms the panel opens with the
    sidebar still visible, search and the edition filter both work
    against the shadow-rendered grid, issue links carry the correct
    absolute URL, and close restores the board view. A second test
    confirms the missing-`.archive-wrap` fallback path is reached
    without an unrelated exception first.
  - **Bug fix (same day):** opening a country deep dive while the
    archive was already open left the archive's old content sitting
    there too, visible underneath the newly-opened deep dive —
    `openArchive()` already closed a deep dive if one was open first,
    but `openDeepDive()` never had the reverse guard, so the two
    panels (siblings in the DOM, both `display:''` when "open") could
    both end up visible at once. Fixed by adding the same
    `if(archiveOpen) closeArchive(...)` guard to the top of
    `openDeepDive()`, mirroring the one already in `openArchive()`.
    Verified with a jsdom test reproducing the exact repro steps (open
    archive, then open a country) confirming `archiveView` ends up
    hidden and cleared, not just the new deep-dive panel showing on
    top of stale content.
  - **Bug fix (same day):** the embedded archive defaulted to the left
    edge instead of centering. The standalone archive page centers
    `.archive-wrap` via `body{display:flex; align-items:center;}` —
    but the `:root`/`body` → `:host` rewrite (shared with the deep-dive
    panel above) only ever converts the *first* literal `body{` it
    finds, which is the earlier `html,body{margin:0;padding:0;}` reset
    rule, not this one — so the real centering rule never survives
    into the shadow root. The deep-dive panel doesn't hit this because
    its own `.wrap` has `margin:0 auto` directly on the class, not
    reliant on `body`'s flexbox at all. Fixed by appending
    `.archive-wrap{margin:0 auto;}` directly to the scoped CSS in
    `openArchive()`, rather than touching the shared rewrite (which the
    deep-dive panel doesn't need fixed). Confirmed the exact rule text
    lands correctly in the injected `<style>`, targeting the right
    selector, with nothing else in the stylesheet setting `margin` on
    `.archive-wrap` to conflict with it — jsdom's `getComputedStyle`
    can't verify the actual rendered result itself (confirmed via a
    trivial isolated shadow-root test that it doesn't resolve *any*
    shadow CSS in this environment, not just this rule), so this was
    checked at the source level rather than a full render.
  - **Bug fix (same day):** after the centering fix above, the
    "← Back to global tracker" close link (in its own `.topbar
    .topbar-wide` row above `.archive-wrap`) stayed flush against the
    left edge instead of lining up with the now-centered content
    below it. That row is built entirely by `openArchive()`'s own JS,
    not extracted from the fetched archive page, so it never picked
    up the same `margin:0 auto` treatment. Fixed by widening the
    appended CSS override to `.archive-wrap, .topbar-wide{margin:0
    auto;}`. Verified with a jsdom test asserting the exact rule text
    lands in the injected `<style>`, that `.topbar.topbar-wide` and
    the close link are present in the shadow root, and that the link
    text is the back-to-tracker label; re-ran the full existing
    archive/menu test suite with no regressions.
- **Not yet deployed** — `site-worker` needs a redeploy to pick up the
  tracker/i18n changes, and `members-worker` needs one for the new
  `ARCHIVE_PUBLIC` var, the CORS header, and the archive-rendering
  changes. See "Open items" below for the exact commands.

### Language cookie bug fix + deep-dive header portal link (2 August 2026, deployed & verified)

Two unrelated fixes, done together:

- **Bug fix:** picking a language (e.g. English) and refreshing the
  page kept reverting to Spanish, no matter what was chosen. Root
  cause: before today, both Workers set the `eicc_lang` cookie
  host-only (no `Domain=`); the site-wide banner change earlier today
  switched to `Domain=.e-invoicingcompliancecorner.com` so the choice
  is shared across subdomains, but never cleared the old host-only
  cookie. A browser holds both as genuinely separate cookies (same
  name, different scope) once that happens, and per RFC 6265 §5.4,
  same-length-path cookies are sent oldest-first — so the stale
  host-only cookie (from whenever a language was last auto-detected
  or picked before today) was always the *first* match in the `Cookie`
  header/`document.cookie`, and every read (`i18n.js`'s `readCookie`,
  both Workers' `getCookie`) took the first match, permanently
  shadowing whatever the new domain-scoped cookie actually held.
  Fixed two ways together: (1) all three cookie readers now take the
  *last* match instead of the first, which per the same RFC ordering
  rule is always the newer, correct, domain-scoped cookie — this fixes
  it immediately, with no extra request round-trip; (2) each reader
  also now reports if a duplicate was found, and when it is, an
  explicit `Set-Cookie` clearing just the host-only variant (no
  `Domain=`, `Max-Age=0`) is sent — client-side on every `persistLanguage()`
  call (i.e. every page load, via `clearLegacyHostOnlyCookie()`), and
  server-side on the next response from either Worker — so affected
  visitors self-heal down to a single cookie within one page load,
  rather than the fix permanently relying on cookie-ordering behaviour.
  Verified with targeted Node tests feeding a synthetic duplicate
  `eicc_lang=es; eicc_lang=en` cookie/header into the actual
  `getCookie`/`readCookie` functions extracted from the real source
  (confirming the last-match value and duplicate detection), plus a
  source-level check that `clearLegacyHostOnlyCookie` never sets
  `Domain=` (which would delete the *good* cookie instead of the stale
  one). Re-ran the full existing archive/menu test suite afterward —
  no regressions.
- **Feature:** the government portal link on country deep-dive pages
  moved from a `.portal-row` at the very bottom of the page (below the
  penalties section, above the footer disclaimer) up into the page
  header, in a new right-aligned column beneath the existing "Last
  updated" / "Compliance model" text — same `.portal-btn` pill styling
  as before, just relocated. Implemented in
  `shared/deep-dive-render.mjs` (the one shared template used by both
  `site-worker`'s real country pages and the tracker's in-page shadow-
  DOM deep-dive panel, so no separate client-side change was needed —
  the panel just fetches and reuses this same HTML/CSS). The old
  now-unused `.portal-row` CSS rule was removed along with it. Verified
  by rendering the real template with mock content and asserting: the
  portal link is inside the new `.country-meta-col` header column and
  sits after (beneath) the last-updated/compliance-model text; the old
  bottom-of-page wrapper is gone; the link appears exactly once (moved,
  not duplicated); and the new CSS rules are present and correctly
  scoped. Re-ran the existing tracker HTML parse-validity check too.

### Sidebar simplified to a plain country list (2 August 2026, deployed & verified)

The tracker's sidebar ("Jump to portal / Government portals") used to
show, per country: the name, then a link to every government portal
for that country, then a separate "Country deep dive →" link — up to
three lines each, for 32 countries. Simplified on request:

- Renamed the sidebar header (`filters.jumpToPortal` /
  `filters.governmentPortals`) to "Learn more about / Country
  compliance legislation", across all 4 languages, plus the mobile
  toggle button (`filters.mobilePortalsToggle`: "☰ Portals" → "☰
  Countries") and the matching "Nav tips" copy
  (`navTips.tip3Title`/`tip3Desc`) that used to describe the sidebar as
  linking to government portals.
- Removed the per-country government portal link(s) entirely — they're
  redundant now that the deep-dive page's own header surfaces the
  portal link prominently (see the fix above).
- Removed the separate "Country deep dive →" link; the country name
  itself is now that link, going straight to `DEEP_DIVES[country]`
  (e.g. `/spain`). No new click-handling code was needed — the
  existing generic click-interception logic (`slugFromHref()` in
  `wireDeepDiveInPagePanel()`) already recognizes any `<a>` whose href
  matches a known deep-dive slug and opens it in-page, regardless of
  which element it's attached to.
- European Union has no deep-dive page of its own (covered by its
  member states' pages instead) — its row correctly falls back to
  plain, non-linked text rather than a dead link; every other country
  (31 of 32) is now a single-line link.
- Net effect: each country in the sidebar collapsed from up to 3 lines
  down to 1, so the full list is visible with far less scrolling.
- Implemented in `renderSidebar()` in `einvoicing-compliance-tracker.html`,
  plus matching CSS (`.c-name` as a real link with a hover state; the
  old `.sidebar-portal-link` rule removed as unused). Verified with a
  jsdom test asserting: the header/toggle text changed; zero
  `.sidebar-portal-link` elements remain; every country row has
  exactly one child element; exactly one country (European Union)
  falls back to plain text while the other 31 are real links; Spain's
  link points to `/spain`; and clicking a country name in the sidebar
  correctly triggers the existing in-page deep-dive panel (board view
  hides, deep-dive view shows) via the pre-existing click-interception
  logic, unchanged. Re-ran the full existing archive/menu/topbar test
  suite afterward — no regressions. Re-ran the tracker HTML
  parse-validity and inline-script syntax checks too.

### Education menu pages now open in-page too (2 August 2026, deployed & verified)

The 5 Education menu pages (Types of Mandate, Impact of Mandate,
Preparing for a Mandate, Types of Provider, Government Certified
Providers) used to be full page navigations away from the tracker,
losing the sidebar (and therefore quick access to the country list)
for the duration. They now open in the same main frame as a country
deep dive, sidebar still visible, via the same fetch + shadow-DOM
pattern already used for country deep dives:

- New `openEducationPage()` / `closeEducationPage()` functions in
  `einvoicing-compliance-tracker.html`, and a third sibling panel
  container, `#educationView`, alongside the existing
  `#countryDeepDiveView` and `#archiveView`. All three panels are now
  mutually exclusive with each other (symmetric guards added in all
  three open functions).
- These pages are same-origin static files (unlike the newsletter
  archive, which lives on the members subdomain and needed CORS) --
  the fetch itself needed no new server-side changes.
- One real wrinkle, unlike the country deep-dive pages: deep-dive
  pages are rendered server-side already in the requested language
  (`site-worker`'s `renderCountryDeepDive()` takes `?lang=`), but the
  Education pages are static, English-authored HTML that `i18n.js`
  translates client-side at runtime by matching `data-i18n="key"`
  attributes against `i18n/<lang>-<namespace>.json` once its own
  `<script>` executes on the real standalone page. Since this panel
  deliberately only fetches and parses raw HTML (never executing the
  fetched page's own script, same reasoning as the archive panel),
  that translation step would otherwise never run. Added
  `applyI18nToShadow()`, a small port of just that one piece of
  `i18n.js`'s logic (the `data-i18n` / `data-i18n-attr` lookup-and-
  replace loop from `applyToDom()`), scoped to run against the shadow
  root directly, fetching the correct per-page namespace file (e.g.
  `i18n/es-edu-mandate-types.json`) the same way `i18n.js` would.
  Skipped entirely when the active language is English, since the raw
  fetched markup's own text already is that.
- Reused the existing generic click-interception, `popstate`, and
  `eicc:languageChanged` handling in `wireDeepDiveInPagePanel()` --
  extended with an `educationPageFromHref()` lookup (an
  `EDUCATION_PAGES` map of the 5 real page paths to their namespace),
  mirroring `slugFromHref()`'s existing role for country slugs.
- Real per-page URLs (e.g. `/education-mandate-types.html`) are used
  for history, same as country deep dives (not a query param like the
  archive) -- these already exist as real, directly-loadable standalone
  pages served by `site-worker`'s static assets binding, so browser
  back/forward and direct/bookmarked links keep working exactly as
  before; the in-page panel is purely a progressive enhancement for
  clicks made from within the tracker itself.
- One structural difference from the deep-dive pages handled directly:
  Education pages' own "← Back to global tracker" link is a direct
  child of `.wrap` (not wrapped in its own `.top-bar` row like the
  deep-dive pages), so it's located and removed via `.back-link`
  directly rather than removing a `.top-bar` wrapper.
- Verified with jsdom tests: clicking an Education menu link opens the
  panel, hides the board view, hides the topbar's site-description
  block, and leaves the sidebar untouched and visible; the shadow root
  contains exactly one `.back-link` (the panel's own close control,
  not a duplicate of the original page's); the close link restores the
  board view; switching the active language and reopening the same
  page correctly fetches and applies the matching namespace's
  translated title/eyebrow text via `applyI18nToShadow()`; and the new
  panel is correctly mutually exclusive with the country deep-dive
  panel in both directions (opening one closes the other, content
  cleared, not just hidden). Re-ran the full existing archive/menu/
  sidebar/topbar test suite afterward — no regressions. Re-ran the
  tracker HTML parse-validity and inline-script syntax checks too.

### Topbar menus now collapse properly (2 August 2026, deployed & verified)

Dan reported that clicking multiple topbar menus (Resources, Education,
the "Menu" actions dropdown) left them all expanded at once, and that
selecting an item inside a menu didn't collapse it. Two separate root
causes, both in the click-handling for these dropdowns:

- **Multiple menus staying open at once:** each trigger's own
  `e.stopPropagation()` call -- needed so a menu's *own* toggle isn't
  immediately undone by its `document`-level "click outside closes it"
  listener -- had the side effect of also stopping that click from
  ever bubbling up to *other* menus' `document`-level listeners, since
  the event never travels past the element that called
  `stopPropagation()`. So opening Education while Resources was
  already open never reached Resources' own listener at all, and it
  stayed open. Fixed with a small shared registry
  (`topLevelMenuClosers`) of each top-level menu's `close()` function;
  each trigger now explicitly closes its siblings via
  `closeOtherTopLevelMenus()` before toggling itself, rather than
  relying on the click bubbling somewhere else to do it.
- **Selecting an item not collapsing its menu:** dropdown items are
  *inside* their menu's container, so the existing "click outside
  closes it" check (`!menu.contains(e.target)`) never applied to them
  in the first place -- this was true even before the bug above.
  Fixed by adding a delegated click listener on each panel that
  collapses it when a real `<a>` link inside is clicked. The nested
  Deep Dives flyout inside Resources needed no separate listener of
  its own: its country links bubble up into the Resources panel's new
  delegate, which collapses both the flyout and the parent Resources
  menu together when a country is selected. The flyout's own toggle
  *button* isn't an `<a>`, so expanding it correctly does not trigger
  this and collapse the menu out from under the user.
- The "About this site" item in the Menu dropdown is a `<button>`, not
  a link, so it keeps its own explicit `close()` call (unchanged,
  already correct); "Give feedback" (a real `<a>`) is now covered by
  the same delegate as every other menu.
- Changed only `einvoicing-compliance-tracker.html` (the 4
  `wireResourcesMenu()`/`wireDeepDiveMenu()`/`wireEducationMenu()`/
  `wireActionsMenu()` functions) -- no HTML/CSS changes needed.
  Verified with a new jsdom test: opening Resources then Education
  auto-closes Resources; opening the Menu dropdown after that
  auto-closes Education; at most one top-level menu is ever open at
  once; selecting an Education link collapses that menu; expanding the
  nested Deep Dives flyout does *not* collapse its parent Resources
  menu; and selecting a country inside that flyout collapses both the
  flyout and the parent Resources menu together. Re-ran the full
  existing archive/menu/sidebar/topbar/education test suite afterward
  — no regressions (including the pre-existing Resources/Deep-Dives
  flyout test, confirming click-outside-closes-it and the nested
  flyout's own open/close behaviour are both unaffected). Re-ran the
  tracker HTML parse-validity and inline-script syntax checks too.

### Feedback page now opens in-page too (2 August 2026, deployed & verified; submit wiring later replaced — see the feedback-pipeline entry)

Extended the same treatment to `feedback.html`, the 4th and last of
the menu links to still be a full page navigation (subscribe.html was
deliberately left alone for now -- see below). This one is different
from the Education pages: it has real interactive behaviour of its
own (form validation, and toggling between the form and a "thanks"
success view), implemented by its own `<script>` running against the
global `document`.

- A `#feedbackView` panel, a 4th sibling of `#countryDeepDiveView`/
  `#archiveView`/`#educationView` -- all four panels are now mutually
  exclusive with each other.
- Since this panel deliberately never executes the fetched page's own
  `<script>` (same reasoning as the archive and Education panels),
  `feedback.html`'s form validation and success-view toggle would
  otherwise never run. Added `wireFeedbackForm()`, porting that logic
  (email/subject/comments validation, the `window.storage` best-effort
  local save, and the form ⇄ success view swap) to run against the
  shadow root directly -- mirrors `feedback.html`'s own script almost
  line for line, just scoped via `shadow.getElementById` instead of
  `document.getElementById`.
- One new wrinkle the Education pages didn't have: the success view's
  own "Back to tracker" link is a real, separate `<a>` *inside* the
  fetched content (not just the panel's own close control at the
  top). A plain click listener on the outer tracker document can't
  see it -- clicks originating inside an open shadow root retarget to
  the shadow host by the time they reach a listener outside it, so
  `e.target.closest('a')` in the usual document-level delegate would
  never find it. Wired a direct listener on that specific link inside
  the shadow root instead, same treatment as the panel's own top close
  link.
- Reused `applyI18nToShadow()` (built for the Education panels) as-is
  for `feedback.html`'s own `i18n/<lang>-feedback.json` translations --
  no changes needed there.
- **`subscribe.html` deliberately NOT changed.** It's substantially
  more involved than `feedback.html` or the Education pages: it embeds
  the Lemon Squeezy checkout SDK (`lemon.js`), which scans the page for
  `.lemonsqueezy-button` elements to intercept -- almost certainly
  unable to find anything inside a shadow root without extra
  workarounds, since that script has no reason to know to look there --
  plus a real POST submission to `members-worker`'s `/members/start-trial`
  endpoint and a two-step checkout flow. It's also still gated behind
  `class="coming-soon"` with no real `href` at all today (Lemon Squeezy
  is still in test mode), so there's no live entry point to break in
  the first place. Raised this with Dan directly rather than guessing;
  he confirmed: hold off until Lemon Squeezy is live and it's a real
  link, rather than risk building throwaway checkout-flow code twice.
- Verified with jsdom tests: clicking "Give feedback" opens the panel,
  hides the board and topbar site-description block, sidebar stays
  visible; submitting the form empty shows validation errors and stays
  on the form view; submitting valid values shows the success view
  with the submitted email; the success view's own back-link (not the
  panel's top close link) correctly closes the panel; reopening in
  Spanish renders the Spanish form title via `applyI18nToShadow()`;
  and the panel is correctly mutually exclusive with the country
  deep-dive panel in both directions. Re-ran the full existing
  archive/menu/sidebar/topbar/education test suite afterward — no
  regressions. Re-ran the tracker HTML parse-validity and
  inline-script syntax checks too.

### Subscribe went live, free-only, no Lemon Squeezy (2 August 2026, deployed & verified)

Dan asked to remove the "60-day free trial" framing and unhook Lemon
Squeezy so he can go live with free sign-ups now, deferring any paid
plan to an unspecified later date once there's a critical mass of
subscribers. This touched both the frontend page and the backend
account semantics:

- **Backend (`members-worker/src/index.js`):** `handleStartTrial()`
  (function/route name kept as-is -- `/members/start-trial` -- to
  avoid touching a URL the form already posts to) now stores
  `plan: "free"` with **no `expiresAt`** at all, instead of
  `plan: "trial"` with a 60-day expiry. `isCurrentlyActive()` only
  expires an account when *both* its plan is `"onetime"`/`"trial"`
  *and* it has an `expiresAt` set -- simply never setting `expiresAt`
  for free sign-ups is what makes them non-expiring, confirmed with a
  unit test covering: a fresh free sign-up (active forever), a
  hypothetical legacy `"trial"` record with a past `expiresAt` (still
  correctly expires -- backward compatible), and one with a future
  `expiresAt` (still active). The one-signup-per-email guard
  (`hadTrial`, kept as the internal field name to avoid touching the
  Lemon Squeezy webhook handler's own references to it) is unchanged.
  Since the Lemon Squeezy checkout step (the only other place that
  used to collect first/last name, job title, and company) is gone,
  `handleStartTrial()` now stores those fields directly against the
  subscriber record too, rather than collecting and silently
  discarding them. The "this email already signed up" page and its
  4-language i18n strings were reworded away from "trial" framing
  (was: "already had a free 60-day trial... subscribe for full
  access"; now: "already signed up... use the sign-in link instead"),
  and its button now points at the login page (`/members`) instead of
  back to `subscribe.html`, since someone who already has an account
  should sign in, not sign up again.
- **Frontend (`subscribe.html`):** removed the Lemon Squeezy checkout
  step entirely -- the `lemon.js` SDK include, the `checkoutStep` div
  (confirm-details summary, "Continue to checkout" button, the
  separate `trialForm`, "Edit my details" link), and the JS that built
  the Lemon Squeezy checkout URL and toggled between the two steps.
  What's left is one step: `detailsForm` now posts directly to
  `/members/start-trial` (`method="POST"
  action="https://members.e-invoicingcompliancecorner.com/members/start-trial"`)
  -- its firstName/lastName/email/jobTitle/company fields already had
  matching `name=` attributes, so only one new hidden `<input
  name="countries">` was needed, populated from the checked boxes by
  the existing client-side validation handler just before it calls
  `form.submit()` (which bypasses the `submit` event so it can't
  re-enter the same handler). Reworded the trial badge, the form's
  intro line, and its fineprint (previously about Lemon Squeezy/VAT/
  card details) to reflect "free, no payment" instead. The trial badge
  text turned out to have no `benefits.trialBadge` key in any of the 4
  language JSON files at all (it was only ever the HTML's own
  unlocalized fallback text) -- added it properly this time, alongside
  the other updated `card.*` keys, across en/es/de/fr.
- **Activated the "Subscribe" link,** which was previously disabled
  (`<span class="dropdown-item coming-soon">`, no `href`, labelled
  "Subscribe (Coming soon)") in two places: the Menu dropdown and the
  subscriber-perks callout in the topbar. Both already had `TEMPORARY`
  comments with exact restore instructions from when they were
  disabled, which this followed -- real `<a href="subscribe.html">`
  links now, `coming-soon` class removed, "(Coming soon)" dropped from
  the label across all 4 languages. The now-unused `.coming-soon` CSS
  is left in place as a ready-made disabled-item treatment for
  whatever's next, with an updated comment explaining that (rather
  than describing it as about to be removed, which it no longer is).
  `subscribe.html` itself stays a real navigation for now, not an
  in-page panel like Education/feedback -- that was deliberately
  deferred earlier specifically because of the Lemon Squeezy SDK; now
  that it's gone, bringing this one in-page too would be
  straightforward, but that's a separate ask.
- Verified with: a jsdom test against the real `subscribe.html`
  confirming the checkout step and every Lemon-Squeezy-related element
  are gone, `detailsForm` posts to the correct URL/method, an empty
  submit is blocked by validation without calling `form.submit()`, and
  a valid submit populates the hidden countries field correctly before
  calling the real `form.submit()`; a Node unit test against the real,
  extracted `handleStartTrial()` confirming the stored record's exact
  shape (`plan: "free"`, no `expiresAt`, all 4 new fields present) and
  that a second sign-up with the same email is correctly blocked
  without a second KV write; and the `isCurrentlyActive()` unit test
  described above. Re-ran the full existing archive/menu/sidebar/
  topbar/education/feedback test suite afterward — no regressions.
  Re-ran HTML parse-validity and inline-script syntax checks on both
  `subscribe.html` and the tracker, and a syntax check on
  `members-worker/src/index.js`.

### Feedback panel centering fix, stale jurisdiction count, and subscribe brought in-page (2 August 2026, code complete, deploy pending)

Three follow-ups once Lemon Squeezy was out of the picture.

- **Feedback panel wasn't centered.** Same bug class as the earlier
  newsletter-archive centering fix: `feedback.html`'s standalone page
  centers its `.wrap` purely via `body{display:flex;
  align-items:center;}`, and the shadow-DOM embedding's `:host`
  rewrite only ever converts the *first* literal `body{` match in the
  stylesheet (the `html,body{margin:0;padding:0;}` reset rule) -- the
  real centering rule never survives into the panel. Fixed at the
  root this time rather than patching around it: added `margin:0
  auto;` directly onto `.wrap` in `feedback.html`'s own stylesheet, a
  self-contained rule that centers correctly in both the standalone
  page and the shadow-DOM panel regardless of the `:host`-rewrite
  quirk. Also widened `.wrap`'s `max-width` from 520px to 1040px
  (doubled, per the request).
- **Subscribe page's "28 jurisdictions" stat was stale** -- the site
  moved to 32 tracked jurisdictions earlier this session (Luxembourg),
  but `subscribe.html`'s benefit-stat-strip still hardcoded 28. Fixed,
  and found + fixed the same stale "28" in
  `education-mandate-types.html`'s stats strip while in there -- same
  bug, just not the one Dan happened to spot.
- **Subscribe page brought in-page**, the last of the 5 menu
  destinations to get this treatment (deep dives, archive, Education,
  feedback, now subscribe). New `#subscribeView` panel, mutually
  exclusive with all 4 existing panels (updated every existing
  `open*()` function's guards symmetrically). Two new wrinkles this
  page had that the others didn't:
  - It loads `countries.js` (a plain global, `EICC_COUNTRIES_BY_REGION`)
    via its own `<script src>` tag, which the tracker page doesn't
    load at all normally. Added `loadCountriesJs()`, which injects that
    script tag into the real document `<head>` (once, promise-cached)
    the first time the panel opens, and lets the checklist renderer
    degrade gracefully (same message `subscribe.html` itself shows) if
    it fails to load.
  - Unlike `feedback.html`'s fetch-based in-panel success view, this
    form does a **real** POST navigation to
    `members-worker`'s `/members/start-trial` on submit -- deliberately
    left as-is, since that's a genuine cross-origin hop to the members
    subdomain that has to happen regardless of how the form got filled
    in. The "in-page" benefit here is Browse/filling-in UX before
    that final submit, not avoiding the navigation entirely.
  - Ported `renderCountryChecklist()`, select-all/clear-all, form
    validation + hidden-field population + `form.submit()`, and the
    sample-issue modal (open/close via button, overlay click, and
    Escape) into a `wireSubscribeForm(shadow)` function scoped to the
    shadow root. The modal's Escape-key handler is the one exception --
    wired once, globally, inside `wireDeepDiveInPagePanel()` (checking
    a module-level `subscribePageOpen`/`currentSubscribeShadow` pair)
    rather than inside `wireSubscribeForm()` itself, since that
    function reruns on every panel open and a `document`-level listener
    added there would accumulate across repeated open/close cycles.
  - `subscribe.html` also had the same centering bug as `feedback.html`
    (`.wrap` relying solely on `body`'s flexbox) -- fixed the same way,
    `margin:0 auto;` added directly to `.wrap`, before building the
    panel around it. Also removed a vestigial empty `<style></style>`
    tag left over from the Lemon Squeezy removal (subscribe.html had
    two `<style>` blocks; the first, empty one would otherwise have
    been the one the panel's `doc.querySelector('style')` picked up,
    silently dropping all the real CSS).
- Verified with jsdom tests: the feedback panel's scoped CSS now
  contains `.wrap{margin:0 auto; ...}`; clicking either the perks CTA
  or the Menu "Subscribe" link opens the subscribe panel with the
  board/topbar hidden and sidebar intact; the country checklist
  renders real regions/checkboxes once `countries.js` loads,
  select-all/clear-all work; an empty submit shows validation errors
  and does *not* call the real `form.submit()`; a valid submit with a
  country checked calls the real `form.submit()` and correctly
  populates the hidden countries field first; the sample-issue modal
  opens/closes via its button, an overlay click, and the global
  Escape handler; reopening in Spanish renders the translated title;
  and the panel is correctly mutually exclusive with the deep-dive and
  feedback panels in both directions (opening subscribe closes an open
  deep dive, opening feedback closes an open subscribe, reopening
  subscribe closes feedback). Re-ran the full existing regression
  suite (archive, menus, sidebar, topbar, education, feedback,
  subscribe standalone-page tests) afterward -- no regressions.
  Re-ran HTML parse-validity and inline-script syntax checks on the
  tracker, `subscribe.html`, `feedback.html`, and
  `education-mandate-types.html`.

### Removed the main tracker's top-level "Last updated" line (2 August 2026, code complete, deploy pending)

Now that country deep dives (and their own "last updated" + compliance
model info in the deep-dive header, added earlier this session) open
in-frame, having the main tracker page's own "Last updated: <date>"
line visible at the same time as a panel's own date was confusing --
two different "last updated" dates on screen at once, for two
different things. Removed the line entirely from `.topbar-brand`
(which is hidden anyway whenever any in-page panel is open, so it
was really only ever the *board* view's own date -- redundant with
each deep dive already stating its own last-updated date up front).
Also removed the now-unused `renderTodayLabel()` function and its two
call sites (initial load + the `eicc:languageChanged` re-render list).
Left the `menu.lastUpdated` i18n key in place in the translation
files, unused but harmless, same as other orphaned keys elsewhere in
this project.

Verified: re-ran the full existing regression suite (16 jsdom tests,
covering the archive, menus, sidebar, topbar, education, feedback, and
subscribe panels) — no regressions. Re-validated HTML parse-validity
and inline-script syntax on the tracker.

### Privacy policy updated for the free, no-Lemon-Squeezy model (2 August 2026, code complete, deploy pending)

`privacy-policy.html` still described the old paid-subscription setup
(Lemon Squeezy as payment provider/merchant of record, Zapier syncing
subscription status, a "[FILL IN] email service provider", 12-month
one-time/recurring plan retention language). Updated it to match the
actual current, free-only architecture:

- Section 1: "paid monthly compliance newsletter" → "free monthly
  compliance newsletter".
- Section 2: removed the "Payment details" row from the data-collected
  table entirely — no payment details are collected.
- Section 3 (legal basis): reworded away from "necessary to perform
  our contract" (billing/cancellation framing) to **consent** for the
  opt-in free newsletter signup, and **legitimate interest** for
  feedback submissions.
- Section 4 (who we share data with): removed the Lemon Squeezy and
  Zapier bullets outright, and replaced the still-unfilled "[FILL IN:
  your email service provider]" placeholder with the actual provider
  in use — checked `members-worker/src/index.js` directly rather than
  guessing: emails (magic links + monthly newsletter) send via
  **Resend** (`sendViaResend()`, `RESEND_API_KEY`), and subscriber
  records live directly in Cloudflare KV, not a separate ESP or a
  Zapier-synced list. Broadened the Cloudflare bullet to mention
  subscriber data storage accordingly.
- Section 5 (retention): dropped the "recurring or within the 12-month
  one-time period" language (no such plans exist now) — the free
  subscription simply runs until the subscriber unsubscribes, with no
  expiry or renewal.
- Section 6 (international transfers): swapped Lemon Squeezy/Zapier
  for Resend/Cloudflare, matching Section 4's actual current providers.
- Bumped the "Last updated" date to 2 August 2026, and added a dated
  note to the file's own setup comment (which developers see, not
  site visitors) flagging that Sections 2/3/4/6 will need revisiting
  again if a paid plan is reintroduced later.

This is still a template needing a solicitor's review before relying
on it for real (that caveat is unchanged and still prominent on the
page) — this pass only brings the described data flows back in line
with what the site actually does today.

Verified: HTML parses cleanly (lenient parser) with balanced tags —
14 `<div>` / 14 `</div>`. No jsdom test coverage needed — this is a
static informational page with no interactive behaviour of its own.

### members-worker's 3 hardcoded country tables eliminated (2 August 2026, code complete, deploy pending)

The long-deferred architectural cleanup: `members-worker/src/index.js`'s
three hardcoded duplicates (`COUNTRIES_BY_REGION`,
`COUNTRY_NAME_TRANSLATIONS`, `COUNTRY_DEEP_DIVE_SLUGS`) — each needing a
manual edit per new country — are deleted in favor of D1 as the single
source of truth. Adding a country no longer touches this file at all.

- **Migration 198** (`198_country_slugs_and_picker.sql`) adds two columns
  to `countries`: `slug` (deep-dive page path, backfilled verbatim from
  the hand-maintained map in `shared/deep-dive-render.mjs` — verified
  byte-identical, 31 entries; NULL = no page, EU only) and `in_picker`
  (default 1; 0 = story-taggable umbrella entity not offered in the
  country checklists — EU only, preserving the deliberate behaviour that
  EU is excluded from both the subscribe and preferences pickers). A
  semantic flag was chosen over every consumer hardcoding
  `WHERE name_en != 'European Union'`.
- **Preferences page**: new `loadCountryPicker(env, lang)` (one query,
  countries + translated display names, `in_picker = 1` only, English-
  alphabetical within region, `REGION_ORDER` presentation order — now a
  single module-level constant instead of also being redefined locally in
  `renderArchiveList`). Both preferences handlers load it and pass it
  into `renderPreferencesPage`, which no longer reads any globals.
- **Issue-page deep-dive links**: the existing story-country query gained
  `c.slug` (zero extra queries); `renderIssue` filters on the carried
  slug instead of the deleted map. NULL-slug countries are skipped, same
  contract as the old map's missing-key behaviour.
- `translateCountryName` and its dictionary deleted; `translateRegionName`
  (4 fixed UI strings, not per-country data) deliberately kept.
- Stale cross-reference comments updated in `countries.js` (which still
  needs manual updates for the *subscribe* page's checklist — that's a
  static-site file, out of scope here) and `shared/deep-dive-render.mjs`
  (whose own slug map remains as site-worker's synchronous routing table
  — a deliberate, documented duplicate, not an accidental one).
- **Validated before any code was touched**: full migration-chain replay
  in in-memory SQLite, diffing D1's regions/translations/slugs against
  all three hardcoded maps — exact parity (EU being D1's one extra row,
  as expected; the 4 known pre-existing replay errors documented in the
  Luxembourg section were present, no new ones). Then a golden parity
  test: the OLD implementation (extracted from git HEAD) and the NEW one
  run against equivalent inputs — real D1 replay rows, not hand-written
  data — with the rendered preferences page required byte-identical in
  all 4 languages, and the issue page byte-identical for a multi-country
  story including slug-less EU. Plus content sanity checks (31 country
  checkboxes, no EU option, correct region order, pre-checking works, a
  real EU-only story renders zero deep-dive links with no broken URL)
  and `node --check` on all touched files.
- **Deploy ordering matters**: migration 198 must run against remote D1
  BEFORE `wrangler deploy` of members-worker, or the preferences and
  issue pages will 500 on "no such column". See Open items.

Remaining hand-maintained country lists after this change (all outside
members-worker): `countries.js` (subscribe page checklist),
`shared/deep-dive-render.mjs`'s slug map (site-worker's routing table),
the tracker's `DATA` array, and the i18n JSON files. Collapsing any of
those into D1 is future work with different trade-offs (site-worker's
routing is deliberately synchronous; the static pages can't query D1 at
all).

---

### Arrivals-board view for the hero (2 August 2026, deployed & verified)

Dan's "Compliance Terminal" concept, reviewed as a standalone mockup and
then built into the tracker as a second view of the hero's "Next
clearance dates" section. Two views, toggled by a pill control in the
hero-label row: the **arrivals board** (default on load, per Dan's spec)
and **list view** (the pre-existing 6-row next-clearance board,
unchanged). The choice persists via a best-effort
`localStorage['eicc_tracker_view']`.

- The arrivals view renders from the page's own `DATA` — already
  D1-injected since Stage 5 — so it needed **no worker or data-model
  changes at all**. Statuses compute from milestone dates with the same
  day arithmetic as `computeStatus`: FINAL CALL (≤90 days, matching the
  board's "due soon" window), NOW BOARDING (≤1 year), JUST ARRIVED (in
  force within the last 120 days), SCHEDULED (beyond a year); older
  in-force entries age off the board. Today: 43 rows over 8 pages of 6.
- Rotation every 8s with a staggered split-flap cascade; clickable page
  dots; pause on hover and keyboard focus; stops in hidden tabs
  (`visibilitychange`); `prefers-reduced-motion` disables both the flip
  and the auto-rotation. Mobile stacks each row into a labelled card.
- Styled entirely from the site's existing tokens — the terminal
  statuses map onto the tracker's own semantic palette (`--stamp` /
  `--soon` / `--live` / `--upcoming`).
- Full i18n: a new `terminal.*` namespace in all four `i18n/{lang}.json`
  files (view labels, column headers, the four statuses using real
  airport announcement vocabulary — ÚLTIMA LLAMADA / LETZTER AUFRUF /
  DERNIER APPEL — legend text, aria labels); country and system text
  reuse the existing `translateCountry` / `translateEntry` mechanism, so
  language switching just works.
- Verified with a jsdom suite: default-arrivals load, toggle both ways,
  localStorage persistence across loads, dot navigation, language-change
  re-render (Spanish status labels), reduced-motion render, and
  regression checks (timeline, sidebar, region chips untouched); inline
  script syntax and all four JSON files validated; and — since this
  edits the tracker HTML — confirmed site-worker's Stage 5 DATA/
  DEEP_DIVES injection regexes still match.

Deploy: `cd site-worker && wrangler deploy` (static asset change only —
the tracker HTML and i18n files ship with the Worker's assets; no
migrations, no members-worker). Spot-check: the hero shows the arrivals
board by default with rotating pages; "List view" restores the familiar
next-clearance list and the choice sticks across reloads; switch to
Spanish and confirm ÚLTIMA LLAMADA / translated countries; the standalone
mockup file this grew from is not part of the site.

### Country-adding rework, Stages 1-3 re-scoped and built (2 August 2026)

The pre-Stage-4 three-stage plan, re-scoped against the current
architecture and completed in one pass:

- **Stage 1 — migration tracking (built as planned)**: migration 205
  creates `schema_migrations` (name / sha256 checksum / applied_at);
  `migrations/apply_migrations.py` is the runner: always validates the
  full in-memory replay first (aborting on any error beyond the 4
  documented pre-existing ones), computes pending from the table,
  applies strictly in order via wrangler, records each apply, refuses
  double-applies, warns on checksum drift for files edited after apply,
  and supports `--dry-run` and `--baseline` (one-time: record all ~205
  existing files as applied without running them — required first step
  on the production DB). Tested end-to-end against a fake-wrangler shim
  over a replayed SQLite copy: baseline, nothing-pending, new-file
  apply+record, double-apply refusal, drift warning.
- **Stage 2 — universal INSERT OR IGNORE (re-scoped)**: retrofitting
  200+ applied migrations was churn with no benefit, and OR IGNORE
  cannot protect the autoincrement-PK content tables at all — the
  tracking table is the real re-run safety. OR IGNORE survives as the
  pattern the scaffolder emits for all new files (every table it
  touches has a natural PK).
- **Stage 3 — /admin/add-country endpoint (deliberately NOT built)**:
  post-198/Stage-5, country creation is migration authoring; an HTTP
  endpoint would duplicate that path and add an auth surface. Its
  spirit ships as `migrations/new_country_scaffold.py`: JSON spec in →
  correctly numbered, idempotent country + milestones migrations out
  (incl. the Stage 5 on_tracker/portals/confidence columns), with the
  ES/DE/FR milestone-translation stub generated into
  `migrations/drafts/` — pre-filled with English but deliberately
  outside the numbered sequence, so the runner cannot apply
  untranslated rows; translate, renumber, move up. Spec validation
  covers region spelling, code/slug shape, ISO dates, unique ids,
  portals required for board milestones, and same-as-English name
  warnings. Tested: bad-spec rejection, generation, full-chain replay
  of generated files, idempotent re-apply, picker/board/slug
  integration, and runner drafts-exclusion; test country removed.

`ADDING-A-COUNTRY.md` updated: Phase 1 now starts with the scaffolder,
Phase 4 uses the runner, with the one-time `--baseline` documented.

**First-use note (before adding today's countries):** run
`python3 apply_migrations.py --remote --baseline` once from
`members-worker/migrations/` — it creates the table, records history,
runs nothing. From then on, `python3 apply_migrations.py --remote` is
the only apply command you need.

### Egypt added as country #33 (2 August 2026, deployed & verified)

First country through the new scaffolder + runner workflow, complete in
one session. Placed in **Middle East** (standard MENA classification;
the site has no Africa region — flagged and approved by Dan).

- **Migrations 206-208** (scaffolded + hand-translated): country row
  (slug `egypt`, in_picker), 5 milestones — 4 on the board (universal
  B2B/B2G mandate in force since April 2023 with the July 2023
  VAT-deduction cutover, the B2C e-receipt eighth sub-phase under
  Decision 281/2025, the 1 January 2026 enforcement stage, the EGP
  250,000 threshold with its passed 31 March deadline) plus the 2020
  Law 206 anchor — all four languages.
- **Migrations 209-210**: full deep-dive page (mandate-summary tile,
  5 stats, 10 cards, 6 steps, 2 ETA portals), penalties as narrative
  cards suiting Egypt's mixed fixed/daily/consequence-based landscape,
  all four languages, exact-count and rows_json validation.
- **Migration 211 — jurisdiction counts, and a significant catch**:
  D1's `translations` table was stale at **30** — the 31 and 32 bumps
  were only ever applied to live files, never written back to D1: the
  exact failure mode migration 024 fixed once before, recurring. 211
  corrects 40 rows straight to 33, each UPDATE pinned to the exact old
  value (no-op if already fixed). Live files swept to 33 in the same
  pass (HTML metas, stat tiles, all i18n JSONs, four languages), with
  a loose-proximity audit confirming zero stale counts remain anywhere
  and D1 now byte-identical with live files on shared keys. The sweep
  itself needed three passes — English "all 32 tracked" and German
  wide-window phrasings escaped the first patterns — which is exactly
  why the audit step exists.
- **Migration 212**: launch story in all four languages ("Egypt joins
  the tracker: the ETA's regime enters its enforcement era"), sourced
  to eta.gov.eg, deep-dive link auto-derived from the slug column.
- **Static files**: countries.js (Middle East, alphabetical), shared
  slug map (SLUG_TO_COUNTRY derives automatically), i18n countryNames
  in all 8 files (main + subscribe, four languages).

Deploy (from your machine):
```
cd members-worker/migrations
python3 apply_migrations.py --remote     # applies 206-212, records each
cd ../../site-worker && wrangler deploy  # ships countries.js, i18n, count updates
```
Spot-check: Egypt on the tracker board (arrivals + list views, Middle
East region), /egypt and /egypt?lang=de render, subscribe picker and
preferences show Egipto/Ägypten/Égypte, the archive shows the launch
story with its deep-dive link, and "33" appears on subscribe/education
pages in all languages.

### Incident: the dynamic tracker never actually ran in production (found & fixed 2 August 2026)

Egypt's rollout surfaced it: the archive showed Egypt (members-worker,
D1-direct) but the tracker sidebar/flyout didn't, and the served page
contained no Egypt milestones despite D1 holding all 83 board rows.

**Root cause:** with Cloudflare "Workers with static assets", requests
whose URL matches an existing asset file are served directly by the
asset layer by default — **the Worker never executes**. The tracker URL
maps to a real file, so `renderTracker` had never once run in
production: no error, no log, no fallback message — the code simply
never executed. The deep-dive pages always worked because `/luxembourg`
etc. match no asset file and fall through to the Worker. Every Stage 5
"verified in production" observation was actually the static snapshot,
byte-equivalent to the dynamic output by design — indistinguishable
until Egypt became the first D1-only data.

**Fixes** (both committed):
- `run_worker_first` in site-worker's `wrangler.toml`, scoped to the
  tracker (glob covering .html and extensionless forms) and the three
  i18n data.json paths — everything else keeps direct asset serving.
- En route, a second real bug: the route check was an exact `.html`
  match while the asset layer canonicalizes to extensionless URLs; the
  router now matches both forms and the asset fetch follows redirects.

Confirmed live: curl of the extensionless URL now contains the Egypt
milestones. This also means two Stage 5 behaviours are visible in
production for the first time: the alphabetical Deep Dives flyout and
the tracker-wins milestone wording in ES/DE/FR (the -data.json files
now genuinely serve from D1).

**Lesson for the record:** the Stage 5 test suite mocked ASSETS and
proved the worker code correct — but nothing tested that production
routing would ever *invoke* that code. "The function works" and "the
function runs" are different claims; for anything intercepting an
asset-backed path, verify the production behaviour differs from the
static file (e.g. grep for D1-only content), not just that the page
looks right.

### Feedback form actually wired up (2 August 2026, deployed & verified)

Dan asked where feedback goes; the answer was **nowhere** — the form was
demo scaffolding calling a `window.storage` API that doesn't exist in
browsers, swallowing the error, and showing success anyway. Every
submission since the page went live was silently discarded.

Now real: migration 213 creates a `feedback` table; a new
`POST /members/feedback` endpoint validates (email format, length caps),
rate-limits (5/hour per IP via the indexed table itself), **stores the
row first** (durable — a Resend outage can't lose a message), then
emails it to einvoicingcompliancecorner@gmail.com via the existing
sendViaResend with reply-to set to the submitter. feedback.html now does
a form-encoded fetch (CORS simple request, no preflight needed) with an
honest error state (new `form.submitError` i18n key, 4 languages) and a
disabled-while-sending button. Handler behavior-tested: valid path,
stored fields, email shape, bad-email 400, empty-subject 400, 429.

Deploy:
```
cd members-worker/migrations && python3 apply_migrations.py --remote
cd .. && wrangler deploy          # members-worker: the endpoint
cd ../site-worker && wrangler deploy   # feedback.html + i18n
```
Spot-check: submit real feedback from the site (in-page panel or
/feedback.html), confirm it arrives in the gmail inbox with reply-to
working, and `SELECT * FROM feedback` shows the row. Submissions predating
this fix are unrecoverable — they never left the browser.

### Tracking-sources page (/sources) — the "sources of truth" registry (2 August 2026, deployed & verified)

Dan's request: a public page listing, per country, the official
reference URLs used to capture announcements and notifications — the
site's sources of truth. Built with today's lessons applied:

- **Migration 214**: `tracking_sources` (country_id, url, sort_order,
  `active`) + `tracking_source_translations` (per-language
  descriptions), **seeded from `deep_dive_portals`** — 38 sources, all
  33 countries, 152 translations, verified clean (no dupes) — so the
  page launches fully populated. The two tables may now diverge
  deliberately: monitoring wants announcement pages, deep dives want
  onboarding portals. The `active` column makes this table the
  designed input for the future content-monitoring Worker
  (CONTENT-MONITORING.md) — that project's foundation is now laid.
- **`/sources` is a site-worker route with NO asset file** (also
  answers /sources.html) — like the country deep-dive pages, the
  Worker always runs; no run_worker_first entry needed, and D1 edits
  appear live within the 300s edge cache. Language resolution mirrors
  the deep-dive pattern exactly (?lang param sets the shared
  domain-scoped cookie, then cookie, then Accept-Language; duplicate
  host-only cookie self-heal included). Paper-theme standalone page:
  region-grouped (Europe → Middle East → Asia-Pacific → Americas),
  flag + translated country name, linked description + visible URL,
  4-language UI strings, lang switcher, back link to the tracker.
- **Menu**: "Tracking sources" (📡) in the Resources dropdown, with
  menu.sources keys in all four i18n files. Initially shipped as a
  plain navigation link; per Dan's review, upgraded the same evening
  to the **full in-page treatment mirroring the country deep dives**
  (fetch /sources?lang= → strip its own top-bar and standalone langs
  row → scope CSS to :host in a shadow root → panel with close
  control, history pushState, popstate open/close branches, mutual
  exclusion with all five other panels, and the eicc:languageChanged
  re-fetch — so the tracker's language banner drives it in-frame).
  The duplicated-wiring risk that ruled panels out for feedback
  doesn't apply here: the page is static content + links with no
  form, and the panel injects the server-rendered page rather than
  re-implementing it. The page itself was also restyled from the
  paper theme to the **dark deep-dive shell** (Dan's review: it
  didn't match the site) — same tokens, and the same structural
  contract the injector relies on (single style element, :root/body
  rules, .wrap/.top-bar), stated in a comment in the renderer.
  jsdom-tested: menu click → panel with injected shadow content,
  stripped chrome, scoped CSS, history, ES re-fetch on language
  change, close restoring the board.
- **Tested**: migration replay (exact counts), the real
  renderSourcesPage against the replayed dataset via a D1 shim (33
  countries, 38 links, region order, Egypt/ETA present, ES UI +
  cookie), tracker script syntax + Stage 5 injection regexes intact
  after the menu edit, all i18n JSONs valid.

Deploy:
```
cd members-worker/migrations && python3 apply_migrations.py --remote   # applies 214
cd ../../site-worker && wrangler deploy                                # route + menu item
```
Spot-check: /sources and /sources?lang=es render grouped and
translated; the Resources menu shows "Tracking sources" in all four
languages; source curation from here = UPDATE/INSERT migrations against
tracking_sources (not deep_dive_portals).

### Netherlands added as country #34 (2 August 2026, code complete, deploy pending)

Full country build via the scaffolder + runner workflow, completed
before deploying anything (per Dan's request to build first, ship
once). Placed in Europe. Deliberately shaped differently from most of
the tracker: `compliance_model` is voluntary/market-driven, not a
clearance regime, since B2B e-invoicing remains genuinely optional in
the Netherlands today.

- **Migrations 216-218** (scaffolded + hand-translated): country row
  (slug `netherlands`), 5 milestones — 4 on the board (B2G universal
  since April 2019, B2B's voluntary-but-high-Peppol-adoption status,
  the March 2026 government report recommending a domestic mandate,
  and the confirmed 1 July 2030 ViDA cross-border floor) plus the 2017
  B2G anchor — all four languages.
- **Migrations 219-220**: full deep-dive page (mandate-summary tile,
  5 stats, 9 cards, 5 steps, 2 Logius/Peppol-Authority portals).
  Penalties covered narratively (contractual exclusion + the
  approaching EU floor) since there's no domestic B2B penalty regime
  to tabulate — the one page on the site with nothing to fine.
- **Migrations 221-222**: a 5-story arc spanning Aug 2025 to Jul 2026
  (the roadmap letter, the EY report's publication, the cabinet's
  formal endorsement, the still-pending final decision, and a
  backgrounder on why the mandate doesn't exist yet), giving the new
  country's archive real depth on day one rather than a single launch
  post. All four languages, all fact-checked against the milestone
  dates already on the board.
- **Static files**: countries.js (Europe, alphabetical), shared slug
  map, i18n countryNames in all 8 files.
- Named "Netherlands" (not "The Netherlands") per Dan's explicit
  instruction, for consistency with the rest of the picker.

**A genuine bug found and fixed while doing the count sweep:** the
true number of tracked jurisdictions has been **31 at the Luxembourg
era and 32 after Egypt — not 32 and 33** as today's earlier commits
and this file claimed. Migration 211 (Egypt's count-sweep, deployed
and verified live earlier today) set the site's jurisdiction-count
text to "33" when the correct value at that time was 32 — a real,
currently-live off-by-one. Confirmed by direct D1 replay at each era
(31 → 32 → 33, cross-checked against both `slug IS NOT NULL` and
`in_picker=1`, which agree with zero mismatches).

**Root cause (identified by Dan):** the `countries` table also holds a
row for the European Union itself — added deliberately, with
`slug=NULL` and `in_picker=0`, specifically so EU-level directive
content can be referenced without the EU counting as a tracked
jurisdiction. `COUNT(*)` on the whole table (32 → 33 → 34) matches the
erroneous figures exactly; the correct query filters on
`slug IS NOT NULL` (31 → 32 → 33). Somewhere the prose text was
generated from the former instead of the latter. No script in the
repo currently runs the unfiltered count (checked `generate_files.py`
and grepped site-wide) — this reads as a one-off manual miscount
rather than a recurring tool bug, but worth remembering: **any future
"how many countries do we track" query must filter on
`slug IS NOT NULL` (or `in_picker=1`), never a bare `COUNT(*)` on
`countries`.**

By coincidence, the true post-Netherlands count (33) equals the
currently-live incorrect value (33), so **no further digit change is
needed** — the error and the legitimate new addition cancel out. An
initial migration 221 (sweeping the live "33" to "34") was written,
found to be built on the false "33 was correct" premise, and deleted
before being applied anywhere; the live-file edits it required were
symmetrically reverted. Nothing incorrect was ever deployed as a
result of this — caught entirely during this session's build, before
any migration touched production.

Deploy (from your machine, once you're ready):
```
cd members-worker/migrations && python3 apply_migrations.py --remote
cd ../../site-worker && wrangler deploy
```
This one apply covers everything still pending: 215 (EC factsheets)
and 216-222 (all of Netherlands). Spot-check: Netherlands on the
tracker board (Europe region, both hero views), /netherlands and
/netherlands?lang=de render, subscribe picker and preferences show
Países Bajos/Niederlande/Pays-Bas, the archive shows all 5 new stories
with working deep-dive links, "33" appears correctly everywhere
(subscribe, education pages, tracker), and /sources shows the EC
factsheet rows plus the dark in-frame panel.

### Content-monitoring Worker built (2 August 2026, code complete, deploy pending)

The "known-page watcher" designed in CONTENT-MONITORING.md, built as an
addition to members-worker rather than a new Worker. Detection only —
matches the design doc's core requirement exactly: nothing here writes
to milestones, deep-dive content, or stories; its only output is one
internal weekly digest email telling a human what changed, never
anything sent to subscribers.

- **Watch list**: `tracking_sources WHERE active = 1` — today's earlier
  build turned out to be this project's foundation; one registry now
  serves both the public `/sources` page and monitoring.
- **Weekly cron** (Monday 08:00 UTC), added as a second schedule string
  on the same Worker; `event.cron` distinguishes it from the existing
  monthly notification job in one `scheduled()` handler.
- **Fetch → strip to comparable text → SHA-256 hash → compare** against
  a **new, dedicated `CONTENT_MONITOR` KV namespace** (deliberately not
  reusing `SUBSCRIBERS` — monitoring hashes and subscriber PII shouldn't
  share a keyspace; caught and corrected during the build, before it
  shipped).
- First-ever check per source silently baselines (doesn't fire as
  "changed"); a failed fetch is reported as `failed`, distinct from
  `unchanged` — never a silent blind spot, per the design doc's
  explicit requirement.
- A crude prefix/suffix diff snippet for human context, not a real diff
  algorithm.
- Single weekly digest via the existing Resend integration, to a new
  `CONTENT_MONITOR_EMAIL` wrangler.toml var — always sends, even on a
  quiet week, so the email doubles as a heartbeat.
- Manual trigger: `POST /admin/run-content-monitor`, same
  `X-Admin-Secret` pattern as the existing notification job's trigger.
- `robots.txt` treated as a one-time editorial check before setting a
  source `active = 1` (not a runtime parse per fetch) — the Worker
  identifies itself with an honest User-Agent string so any site
  operator can recognize and block it if they choose.
- Tested: pure functions (text extraction, hashing, diff isolation),
  `checkOneSource`'s full state machine across real transitions
  (baseline → unchanged → changed → failed) with mocked KV/fetch, the
  digest HTML in both a quiet and an eventful week, and the
  `scheduled()` dispatcher choosing the right job by cron string —
  26 checks total, all passing.

**One-time setup before this can run for real** (from your machine):
```
cd members-worker
wrangler kv namespace create CONTENT_MONITOR
```
Paste the printed `id` into `wrangler.toml`'s `CONTENT_MONITOR` binding
(currently a placeholder), then:
```
wrangler deploy
```
Test it immediately without waiting for Monday:
```
curl -X POST https://members.e-invoicingcompliancecorner.com/admin/run-content-monitor \
  -H "X-Admin-Secret: <your SESSION_SECRET value>"
```
Check the inbox at CONTENT_MONITOR_EMAIL (defaults to
einvoicingcompliancecorner@gmail.com) for the first digest — it should
report every active tracking source baselining, with nothing to review
yet. Run it again (or wait a week) to see real change detection kick in.

### New-subscriber welcome email (3 August 2026, code complete, deploy pending)

Signing up previously sent only the bare magic-link email — no
orientation, no links, nothing explaining what the site actually
offers. Added a genuinely separate welcome email, sent alongside (not
merged into) the magic link, since the magic link has one narrow,
urgent job (click within 15 minutes) that a longer tour would only
dilute. Sent first, so the magic link — the thing needing immediate
action — lands as the newest message in the inbox.

Content: a personalised greeting (first name if given, else generic),
a one-line explanation of what the site does, four link cards (the
tracker, country deep dives — explained via the sidebar/Deep Dives
menu since there's no single central deep-dive URL, the newsletter
archive, and the tracking sources page), all five education pages
listed by their real menu titles and linked individually, an honest
statement of the subscriber's chosen countries (or the no-preference
default, explained plainly) with a preferences-page button, and a
feedback link in the footer.

Branding: reuses the site's bold masthead (extracted into a shared
`buildBoldMastheadHtml()`, now used by both this and the content
monitor's digest, rather than duplicated) via `buildEmailShell`'s
optional header override — zero change to the existing magic-link and
monthly-notification emails, which don't pass a header override and
keep their small default eyebrow exactly as before.

English-only, matching the existing precedent — none of this site's
transactional email is currently localized.

Tested (16 checks): correct recipient/subject, personalised and
generic-fallback greetings, every link present and pointing at a real
URL, all 5 education pages listed and linked, the chosen-countries
sentence, the bold masthead applied, and — since first name and
countries are user-supplied — HTML-escaping verified so a subscriber
typing `<script>` into the sign-up form can't inject anything into
their own welcome email.

Deploy: `cd members-worker && wrangler deploy`. Spot-check: sign up
with a test email (a fresh, previously-unused address, since sign-up
is one-per-email) and confirm two emails arrive — the welcome email
first, an honest reflection of any countries chosen at sign-up, all
links live — then the magic-link email on top of it.

### Consistent email branding + a real archive-link bug caught in the same pass (3 August 2026)

Applied the bold masthead (built for the content monitor, then reused
for the welcome email) to the two remaining system emails: the
magic-link email and the monthly notification. The internal feedback
notification (to Dan) wasn't using `buildEmailShell` at all — wrapped
it properly too, so all five emails this system ever sends now share
one consistent visual identity.

**A real, pre-existing bug found while checking "does the archive link
need to change":** both the welcome email's archive/preferences links
and the monthly notification's archive button + every individual story
link were bare `/members/...` URLs. `/members/preferences` has always
required an active session; `/members/archive` only *appears* to work
without one today because of the temporary `ARCHIVE_PUBLIC` promo.
Anyone reading the welcome email on a different device than they
signed up on, or the monthly notification any time after their last
login, would hit a login wall on links that looked like they should
just work — and once the promo ends, this breaks for everyone.

**Fix**: a new `CONVENIENCE_LINK_TTL_SECONDS` (7 days) — the same
signed-token pattern the unsub-notifications link already used
successfully, just with a shorter, still-generous window rather than
that link's near-permanent 5 years. `handleVerify` gained an optional,
carefully allow-listed `?next=` parameter (`isSafeVerifyNextPath`:
exact match on `/members/archive` or `/members/preferences`, or a
same-origin prefix match for individual story pages —
never an off-site or protocol-relative redirect). Every affected link —
welcome email's archive and preferences buttons, the monthly
notification's archive button, and critically its per-story links (the
actual point of that email) — now signs a real login token instead of
assuming a session exists, so all of them log the subscriber in and
land on the right page regardless of `ARCHIVE_PUBLIC`'s state or how
long ago they last visited (within the 7-day window).

Tested: the open-redirect guard itself (off-site and protocol-relative
URLs rejected, real internal paths incl. per-story slugs accepted),
`handleVerify` honouring a safe `next=` and safely falling back to the
archive for an unsafe one, and the full welcome/monthly-notification
email content end to end. ~78 checks total across 8 test files, all
passing.

Deploy: `cd members-worker && wrangler deploy`. Spot-check: sign up
fresh and confirm both welcome-email buttons (archive, preferences)
log you in and land correctly even from a browser with no existing
session; trigger the monthly notification manually and confirm its
archive button and at least one per-story link do the same.

### Tracking-source description curation (3 August 2026, deploy pending)

The seeded descriptions (from the deep_dive_portals bulk seed and the
215 EC-factsheet sweep) were portal *names* — accurate but unhelpful
for deciding what a source actually announces. Migration 225 rewrites
all 54 descriptions to say what kind of update each source carries
(e.g. "ETA e-invoicing platform notices — wave announcements, threshold
changes, and technical circulars" instead of "ETA e-invoicing portal"),
in all four languages.

The 17 EC-factsheet sources (ec.europa.eu/digital-building-blocks)
share one description via a single `WHERE url LIKE` UPDATE per
language rather than being individually curated, since they're
genuinely the same *kind* of source regardless of country. The
remaining 37 were curated individually, drawing on today's research
into each country's mandate where applicable (Egypt, Netherlands,
Poland, Belgium, Spain, Malaysia, Saudi Arabia, Brazil, Australia,
India) and established general knowledge for the rest.

This is exactly the metadata the content-monitoring Worker's digest
benefits from now that it's live: a detected change on a source
described as "wave announcements and threshold changes" carries a
different implied urgency than one described as "technical bulletins,"
helping a quick read of the digest triage what's worth a closer look.

Validated: full-chain replay, idempotent re-apply, all 54 EN
descriptions confirmed no longer matching any of the old generic
labels, all 216 rows present (54 sources × 4 languages), no
suspiciously short/truncated descriptions.

Deploy: `cd members-worker/migrations && python3 apply_migrations.py --remote`
— data only, no worker deploy needed; `/sources` and the content
monitor's digest will reflect the new descriptions within the 5-minute
cache window (sources page) or from the next run (digest).

### Tracking-source URL audit, round 2 (3 August 2026) — Portugal fixed, Malaysia/Romania/Chile checked with no action, ~40 remain

Continuing the "does this URL ever surface real news" audit from the
Brazil/Australia/Ireland/Poland/Saudi Arabia round.

**Fixed**: Portugal (migration 227) — swapped the unverified
`menu.action?pai=5075` page for the Autoridade Tributária's actual
"Destaques" feed, confirmed live with continuous dated entries since
2024 and recurring genuine e-Fatura/SAF-T deadline news.

**Checked, deliberately left as-is** (both are cases where the
"obvious" better-looking alternative turned out worse on verification
— logged so the same dead ends aren't re-walked later):
- **Chile** — SII's own "Normativa Factura Electrónica" list page looks
  exactly right by title, but its most recent entry is from 2016 while
  real current resolutions exist elsewhere (a 2025 and a 2026 one seen
  in passing) — the list has quietly stopped being maintained. Swapping
  to it would trade a noisy-but-live source for a definitively dead
  one. No confident better URL found.
- **Malaysia** — found LHDN's genuine "Kenyataan Media" (press
  statements) feed, dated through January 2026 — but it's disallowed
  by `robots.txt`. The monitor respects that by design (see
  CONTENT-MONITORING.md's "never fetch somewhere a site has said not
  to" policy) — a robots-blocked source is out of bounds regardless of
  content quality. No confident allowed alternative found.
- **Romania** — ANAF's static e-factura info page (static.anaf.ro) is
  a genuine dated list but hasn't been updated since ~2022 (references
  only up to Law 139/2022) — same staleness pattern as Chile. Left as
  the current mfinante.gov.ro page pending a better find.

**~40 sources not yet checked.** This is a genuinely slow, real-fetch
task (each source takes several search+verify calls to confirm
properly, not a quick guess) — logged here as an explicit ongoing
background item rather than attempted in one sitting. Suggested
approach for whoever picks this up next: prioritise sources shaped like
"bare authority homepage" (highest risk of either missing real news or
drowning it in unrelated noise) over sources that are already specific
sub-pages, and always verify a replacement candidate live (fetch it,
check actual dates) before swapping — three separate "looks perfect,
turns out stale" near-misses (Chile, Romania, and initially the SII
normativa page) happened this session alone.

### Cloudflare Web Analytics enabled on both hostnames (3 August 2026, members-worker deploy pending)

Public site: zero-code automatic setup (e-invoicingcompliancecorner.com
is Cloudflare-proxied, selectable straight from the "Add a site"
dropdown). Members-worker: automatic setup wasn't available
(members.e-invoicingcompliancecorner.com is a Worker custom-domain
route, not its own zone record) — used the manual JS-snippet path
instead, inserted once into `pageShell()`, the single shared template
all 8 of members-worker's render* functions route through. Covers
login, archive, preferences, and every other members-subdomain page
in one change rather than needing per-page edits.

### Austria added as country #35 (3 August 2026, code complete, deploy pending)

Full country build (migrations 228-236). Europe's earliest B2G
adopter in this tracker (federal mandate since 1 January 2014,
IKTKonG §5 — years before the Netherlands' 2017 or most peers) and
the only country here accepting two entirely distinct formats for the
same obligation (ebInterface, its own national XML standard since
2009, or Peppol BIS 3.0 — both EN 16931-aligned since ebInterface 5.0).

- **Migrations 228-230**: country row (slug `austria`), 5 milestones —
  4 on the board (the 2018 extension to all central contracting
  authorities, the upcoming ebInterface 7.0 release with formal EN
  16931 syntax binding, the expected-but-not-yet-published Q3 2026
  domestic B2B proposal, and the confirmed 2030 ViDA cross-border
  floor) plus the 2014 B2G anchor — all four languages. Cross-checked
  against a rigorously-dated (2 July 2026) industry country booklet
  that explicitly flagged and corrected less careful competing claims
  about ViDA's adoption date and Austria's own B2B timeline — used
  its more conservative, better-sourced account throughout.
- **Migrations 231-232**: full deep-dive page — 5 stats, 9 cards
  (notably the dual-format acceptance and Land-level B2G variation),
  5 steps, 2 portals. A dedicated card on the pending Q3 2026 proposal
  mirrors the Netherlands' equivalent "genuinely undecided" treatment.
- **Migrations 234-235**: a 3-story arc (the decade-plus B2G
  backgrounder, the BMF's Peppol signal — doubling as launch coverage
  — and the ebInterface 7.0 update).
- **Migration 236**: tracking sources (USP, WKO ebInterface, EC
  factsheet) added deliberately this time, not left as a gap the way
  Netherlands' were — exactly the process fix ADDING-A-COUNTRY.md's
  step 4 exists for. One EC-factsheet URL was initially guessed by
  extrapolating neighbouring page IDs and turned out wrong (Austria's
  factsheet uses an older, different page-ID scheme) — caught by
  verifying against a real search result before shipping, not assumed.
- **Migration 233**: jurisdiction count 33→34. Caught and fixed a real
  mistake mid-sweep: initially assumed the pre-Austria baseline was
  34 and swept straight to 35, but the actual corrected baseline (per
  the EU-row-inflation fix found during the Netherlands session) was
  33 — verified directly against that session's own confirmed value
  before trusting the assumption, reverted the incorrect 35s, and
  widened the audit regex, which had a blind spot that let the error
  through silently the first time.
- Static files: countries.js (Europe, alphabetically first), shared
  slug map, i18n countryNames in all 8 files.

Final audit against the full ADDING-A-COUNTRY.md checklist (the same
one run against Netherlands): all items pass — country_translations,
milestones, deep-dive content, stories, tracking sources, true
jurisdiction count, slug/in_picker.

Deploy (from your machine, once ready):
```
cd members-worker/migrations && python3 apply_migrations.py --remote
```
Data only — no worker deploy needed. Spot-check: Austria on the
tracker board (Europe, first alphabetically), /austria and
/austria?lang=de render, subscribe picker shows Österreich/Autriche,
the archive shows all 3 new stories, /sources lists Austria's 3
sources, and "34" reads correctly everywhere.

## Open items / next steps

### Real open work

1. **Coverage expansion** — Netherlands and Austria shipped. Still
   not tracked: Bulgaria, Cyprus, Czechia, Estonia, Greece, Hungary,
   Latvia, Lithuania, Malta, Slovenia, Iceland, Liechtenstein. The
   scaffolder + runner make each addition a fraction of the old
   effort.
2. **Tracking-source URL audit, continued** — ~40 of 54 sources not
   yet verified for whether they'll ever actually surface real news.
   Two rounds done (Brazil/Australia/Ireland/Poland/Saudi
   Arabia/Portugal fixed; Chile/Romania/Malaysia checked, correctly
   left as-is). Genuinely slow, real-fetch work — see the dated
   entries above for the method and the near-misses to avoid
   repeating (a page can look exactly right by title and still have
   silently stopped being updated years ago; always verify live).
3. **Translation frameworks for the remaining static pages** — the
   pages not yet covered by the i18n system.
4. **Business threads** (decisions, not code): theinvoicinghub.com
   competitive review; pricing (free vs the shelved $5/$8 tiers);
   the vendor registration/advertising concept; the two remaining
   Resources ideas (accredited-sources list, vendor-assessment RFI
   template).

### Dormant until decided

- Ending the ARCHIVE_PUBLIC promo (one variable flip in
  members-worker's wrangler.toml + the coming-soon treatment notes in
  the tracker's Resources comment).
- Re-hooking Lemon Squeezy if/when a paid tier returns.
