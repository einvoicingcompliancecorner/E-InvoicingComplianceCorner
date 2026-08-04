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

### Feedback panel centering fix, stale jurisdiction count, and subscribe brought in-page (2 August 2026, deployed 3 Aug 2026)

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

### Removed the main tracker's top-level "Last updated" line (2 August 2026, deployed 3 Aug 2026)

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

### Privacy policy updated for the free, no-Lemon-Squeezy model (2 August 2026, deployed 3 Aug 2026)

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

### Netherlands added as country #34 (2 August 2026, deployed & tested)

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

**Deployed and tested** (confirmed by Dan): migrations 215 (EC
factsheets) and 216-222 (all of Netherlands) applied via
`apply_migrations.py --remote`, `site-worker` redeployed. Netherlands
now live on the tracker board, `/netherlands` and `/netherlands?lang=de`
render, subscribe picker/preferences show Países Bajos/Niederlande/
Pays-Bas, the archive's 5 new stories and their deep-dive links work,
the "33" count is correct everywhere, and `/sources` shows the EC
factsheet rows.

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

### New-subscriber welcome email (3 August 2026, deployed & tested)

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

**Deployed and tested** (confirmed by Dan): `members-worker` redeployed.
Signing up with a test email sends both emails as designed — the
welcome email first, an honest reflection of any countries chosen at
sign-up, all links live — then the magic-link email on top of it.

### Consistent email branding + a real archive-link bug caught in the same pass (3 August 2026, deployed & tested)

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

**Deployed and tested** (confirmed by Dan): `members-worker` redeployed.
Both welcome-email buttons (archive, preferences) log the subscriber in
and land correctly even from a browser with no existing session, and
the monthly notification's archive button and per-story links do the
same.

### Tracking-source description curation (3 August 2026, deployed & tested)

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

**Deployed and tested** (confirmed by Dan): migration 225 applied via
`apply_migrations.py --remote`. `/sources` reflects the new
descriptions live.

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

### Cloudflare Web Analytics enabled on both hostnames (3 August 2026, deployed & tested)

Public site: zero-code automatic setup (e-invoicingcompliancecorner.com
is Cloudflare-proxied, selectable straight from the "Add a site"
dropdown). Members-worker: automatic setup wasn't available
(members.e-invoicingcompliancecorner.com is a Worker custom-domain
route, not its own zone record) — used the manual JS-snippet path
instead, inserted once into `pageShell()`, the single shared template
all 8 of members-worker's render* functions route through. Covers
login, archive, preferences, and every other members-subdomain page
in one change rather than needing per-page edits.

**Deployed and tested** (confirmed by Dan): `members-worker`
redeployed. Web Analytics is live and collecting data on both
hostnames.

### Austria added as country #35 (3 August 2026, deployed & tested)

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

**Deployed and tested** (confirmed by Dan): migrations 228-236 applied
via `apply_migrations.py --remote` (data only, no worker deploy
needed). Austria live on the tracker board (Europe, first
alphabetically), `/austria` and `/austria?lang=de` render, subscribe
picker shows Österreich/Autriche, the archive's 3 new stories work,
`/sources` lists Austria's 3 sources, and "34" reads correctly
everywhere.

### Greece added as country #36 (3 August 2026, deployed & tested)

Full country build (migrations 237-245). A genuinely different shape
from Netherlands/Austria's voluntary stories — Greece runs an active
CLEARANCE mandate via myDATA, with Phase 1 of its domestic B2B
requirement already in force as of today (2 March 2026), making it one
of the tracker's more "live" countries rather than a pending-decision
one.

- **Migrations 237-239**: country row (slug `greece`), 5 milestones —
  4 on the board (B2G's full 2025 mandate, B2B Phase 1 already in
  force, Phase 2 arriving October 2026, and the confirmed 2030 ViDA
  cross-border floor) plus the 2021 myDATA anchor — all four
  languages. Notable nuances captured: intra-EU B2B remains optional
  under the mandate (only domestic + non-EU B2B is mandatory), Peppol
  is not the mandatory B2B exchange route (unlike B2G), and the
  domestic mandate rests on an EU derogation (Council Implementing
  Decision (EU) 2025/502).
- **Migrations 240-241**: full deep-dive page — 5 stats, 9 cards
  (notably the shared MARK/QR clearance step across B2G/B2B, the free
  "Timologio" compliance route unusual among peers, and the
  substantial 50%-of-VAT non-issuance penalty), 5 steps oriented
  around near-term compliance rather than exploratory readiness
  (since Phase 1 is already live), 2 portals.
- **Migrations 243-244**: a 3-story arc (the myDATA reporting-first
  backgrounder, the Phase 1 launch — doubling as launch coverage —
  and Phase 2's approach).
- **Migration 245**: tracking sources (myDATA, AADE main site, EC
  factsheet) added deliberately. The EC-factsheet page ID was again
  guessed by pattern before verifying (same risk as Austria) — this
  time confirmed correct via a genuine search match, not assumed.
- **Migration 242**: jurisdiction count 34→35, this time verified
  directly against the true pre-Greece baseline before sweeping
  (per the lesson from Austria's mid-sweep mistake) — confirmed
  correct on the first attempt.
- Static files: countries.js (Europe, between Germany and Ireland),
  shared slug map, i18n countryNames in all 8 files.

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass — country_translations, milestones, deep-dive content, stories,
tracking sources, true jurisdiction count, slug/in_picker. Also
independently confirmed the tracker's live JS "Jurisdictions tracked"
stat (fixed earlier today for the EU-row bug) correctly computes 35
with Greece's on-tracker milestones included.

**Deployed and tested** (confirmed by Dan): migrations 237-245 applied
via `apply_migrations.py --remote`, `site-worker` redeployed (the
static-file trio needed it, same as every country add). Greece live
on the tracker board (Europe, between Germany and Ireland), `/greece`
and `/greece?lang=de` render, subscribe picker shows
Grecia/Griechenland/Grèce, the archive's 3 new stories work, `/sources`
lists Greece's 3 sources, and "35" reads correctly everywhere.

### "About the author" added to the About-this-site pop-out (3 August 2026, deployed 3 Aug 2026)

A small, low-effort addition per Dan's own effort-evaluation request —
his bio (25 years in financial software transformation, the last 20+
in e-invoicing/AP automation, the frustration with no central
authority defining the roadmap that motivated this site) plus a "feel
free to connect" line linking his LinkedIn, added below a divider
inside the existing About modal. No new modal, no new interaction
pattern — same one that was already there.

4 new i18n keys in all four languages, following the site's existing
embedded-`<a>`-tag convention (the i18n system applies via `innerHTML`,
confirmed via the sidebar's own `footerNote` precedent) so the
LinkedIn link renders as a real clickable link rather than escaped
text.

Tested: 12 jsdom checks applying the real i18n system to the real
modal HTML — link renders correctly (real `<a>` tag, correct href/
target/rel), Spanish translation genuinely swaps in (not just English
checked), and the original About-the-site content is untouched.

Deploy: `cd site-worker && npx wrangler deploy` (static file only, no
migrations). Spot-check: open About from the Resources menu, confirm
the author section appears below a divider, the LinkedIn link opens
correctly, and check at least one non-English language to confirm the
translation renders.

### Cyprus added as country #37 (3 August 2026, deployed & tested)

Full country build (migrations 246-253). The quietest regulatory
story in the tracker so far — deliberately built with fewer
milestones (3, only 2 on the board) and fewer stories (2, not the
usual 3) than every other country, because that's honestly what
exists, not because anything was rushed. No B2B mandate, no confirmed
B2G-issuance mandate, and no fabricated "expected" milestone invented
to pad the board.

- **Migrations 246-248**: country row (slug `cyprus`), 3 milestones —
  the 2019 central-government B2G receive mandate (anchor, off-board,
  Law 89(I)/2019), its 2020 extension to sub-central bodies, and the
  confirmed 2030 ViDA cross-border floor. A genuine pattern of
  proposed-then-abandoned mandates (a 1 January 2022 target for
  mandatory B2G issuance, then a similar 2024 push, neither ever
  enacted) is captured as narrative context in the deep-dive rather
  than as a board milestone with a date — presenting an abandoned
  target as a tracked, scheduled item would misrepresent it.
- **Migrations 249-250**: full deep-dive page — 5 stats, 9 cards built
  around what's genuinely mandatory today (almost nothing on the
  supplier side), with a dedicated section framing the twice-
  abandoned mandate pattern as the one thing worth watching, with
  appropriate skepticism toward future announcements. 5 steps, 2
  portals.
- **Migrations 252-253**: a 2-story arc (the twice-proposed/twice-
  abandoned pattern, and why 2030 is the only real planning horizon)
  and tracking sources (Ministry of Finance, gov.cy, EC factsheet).
- **Real-world verification caught something useful**: the commonly-
  cited "ARIADNI" government portal name, still used uncritically by
  several 2025/2026-dated blog sources, has actually been retired —
  confirmed via a direct redirect notice and the most recent (2025)
  EC country factsheet, both independently naming `gov.cy` as its
  replacement. Used the verified current name rather than the stale
  one multiple recent-looking sources still repeat.
- **Migration 251**: jurisdiction count 35→36, verified directly
  against the true pre-Cyprus baseline before sweeping (now standard
  practice since the Austria mid-sweep mistake) — correct on the
  first attempt.
- **Caught and fixed a stray-Cyrillic-character typo** in one French
  deep-dive translation before shipping ("типique" instead of
  "typique") — scanned all Cyprus migration files afterward for the
  same class of error, confirmed clean.
- Static files: countries.js (Europe, between Croatia and Denmark),
  shared slug map, i18n countryNames in all 8 files.

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass, correctly reflecting Cyprus's genuinely thinner numbers (3
milestones, 2 stories) rather than padding to match other countries'
usual counts.

**Deployed and tested** (confirmed by Dan): migrations 246-253 applied
via `apply_migrations.py --remote`, `site-worker` redeployed (the
static-file trio needed it, same as every country add). Cyprus live
on the tracker board (Europe, between Croatia and Denmark), `/cyprus`
and `/cyprus?lang=de` render, subscribe picker shows
Chipre/Zypern/Chypre, the archive's 2 new stories work, `/sources`
lists Cyprus's 3 sources, and "36" reads correctly everywhere — this
also matches the 36-country figure already used in this doc's
"One-paragraph summary" and confirmed live via `/map-data.json` in the
Map's Round 3 entry above, so the count is consistent across all of
it.

### The Map: three deploy-verification bugs found and fixed (3 August 2026, deployed 3 Aug 2026)

The Map's full build (mandate_scope, `/map`, `/map-data.json`) went live
this session — migrations 254/255 applied, both Workers deployed. Live
spot-checking against the real site (via a browser, not just curling
the JSON endpoint) turned up three real bugs, all specific to how the
in-page tracker panel renders The Map (the standalone `/map` page was
unaffected by any of these):

- **The tracker's own top-of-page language switcher and the map
  panel's embedded one were both visible at once** when The Map was
  opened from Resources → The Map inside the tracker — every other
  in-page panel (`/sources`, deep-dive, archive, education, feedback,
  subscribe) relies solely on the tracker's single top-level switcher,
  none of them render their own. `map-panel.js`'s `buildLangSwitch()`
  now checks `opts.navigate` (the same signal `applyStaticText()`
  already uses for `backToTrackerLink` — set only in panel mode, never
  in standalone mode) and hides `#langSwitch` entirely when true. The
  panel already re-renders correctly on the tracker's own
  `eicc:languageChanged` event, so no functionality is lost.
- **Portugal, Sweden, Norway, Finland, Luxembourg rendered solid black
  on the map, and the "B2G only" legend swatch was invisible**, but
  only inside the tracker's in-page panel — the standalone `/map` page
  rendered every status color correctly. Root cause: `openMapPage()`'s
  CSS-scoping step (`.replace(':root{', ':host{')`) is a plain string
  `.replace()`, which only rewrites the *first* match. The map page's
  stylesheet has **two** `:root{}` blocks — the shared dark-shell one
  (defining `--ink`, `--line`, etc.) and a second one embedded via
  `MAP_STYLE` (defining `--live`, `--upcoming`, `--tracked`,
  `--b2gonly`, `--nomandate`, `--soon`). Only the first got rewritten
  to `:host{}`; the second stayed a dead `:root{}` rule inside the
  shadow tree (which matches nothing there), so `--b2gonly` (and
  `--tracked`/`--nomandate`) never resolved inside the panel —
  `fill:var(--b2gonly)` fell back to the SVG default of black, and
  `background:var(--b2gonly)` on the legend swatch fell back to
  transparent, letting the card background show through. `--live` and
  `--upcoming` happened to work anyway, purely by accident, because
  the tracker's own global stylesheet already defines those same two
  variable names for the arrivals board's status pills, and custom
  properties inherit through the shadow boundary from the real page.
  **Fixed at the root** by making the replace global
  (`.replace(/:root\{/g, ':host{')` / `.replace(/body\{/g, ':host{')`)
  in all 7 panels that use this exact scoping pattern (deep-dive,
  sources, map, archive, education, feedback, subscribe) — a pure
  hardening fix for the other 6, since none of their fetched pages
  currently have a second `:root{}` block, but the bug class is now
  closed off everywhere rather than just in the one place it happened
  to bite.
- Verified all three fixes with a Playwright script that reproduces
  `openMapPage()`'s exact fetch → DOMParser → scope → shadow-inject →
  `EICCMap.init()` sequence against a fixture built from the real
  `MAP_STYLE`/`mapPageBodyHtml()` source (not a hand-written mock) —
  confirms `--b2gonly` resolves inside the shadow root, Portugal/Sweden
  paths render the correct amber fill instead of black, the legend
  swatch is opaque, and the panel's language switcher is hidden while
  the standalone page's is untouched (still 4 visible buttons). No
  console errors either mode.

**Deployed 3 Aug 2026** via `cd site-worker && npx wrangler deploy`. No
migrations, no D1 changes were needed. Not yet independently
spot-checked live (Dan confirmed the deploy went out and picked up
this and the following three Map rounds; a live look at the tracker's
Resources → The Map panel to confirm the single language switcher and
the amber B2G-only fills is still worth doing when convenient).

### The Map: three more UI requests, resolved with one shared component (3 August 2026, deployed 3 Aug 2026)

Three more small UI asks on The Map, all resolved without forking
`map-panel.js`/`site-worker`'s map render into separate standalone-vs-
panel versions — the existing `isEmbedded()` signal (`opts.navigate`
truthy only in the tracker's in-page panel; already used for
`backToTrackerLink` and, from the previous fix, `buildLangSwitch`) just
grew two more call sites:

- **"The Compliance Map" heading wrapped to two lines.** It had a
  hard-coded `<br>` in every language's `titleHtml` (`shared/
  map-data.mjs`'s `MAP_UI`), not a natural wrap — removed the `<br>` in
  all four languages, widened `.map-topbar-brand`'s flex-basis
  (320px → 480px), and added `white-space:nowrap` on `.brand-title`
  (with a `@media(max-width:640px)` override back to normal wrapping,
  so it still degrades gracefully on phones instead of overflowing).
- **The right-hand sidebar's country list is redundant when The Map is
  opened inside the tracker** (Resources → The Map) — the tracker's own
  permanent left-hand sidebar already lists every country and already
  links to its deep dive. But the standalone `/map` page has no such
  sidebar, and the SVG country shapes have no keyboard/screen-reader
  path to a deep dive — so the country list there is the only
  accessible/crawlable way to reach one. Resolved by keeping the
  country list on standalone `/map` and swapping it for a "Latest
  updates" recent-news list only when embedded — decided with the user
  via a clarifying question rather than guessing, since it's a real
  accessibility trade-off, not just a style choice.
  - New `getRecentStories(db, lang, limit)` in `shared/map-data.mjs`,
    querying the same `stories`/`story_translations` tables the
    newsletter archive already uses (`WHERE s.published = 1 ORDER BY
    s.date DESC LIMIT ?`) — direct D1 access, no cross-worker fetch,
    since site-worker and members-worker already share the one
    `eicc_content` database.
  - `renderMapPage()` now fetches both `getMapCountries()` and
    `getRecentStories()` unconditionally and embeds both in the same
    `#mapDataBlob` — the server can't tell whether a given request is a
    direct standalone visit or the tracker's in-page panel fetching the
    same URL in the background, so it always supplies both; the client
    decides which to render.
  - `map-panel.js`'s `buildSidebar()` now dispatches to
    `buildCountryList()` (the untouched original logic, standalone
    only) or the new `buildRecentNewsList()` (embedded only, via
    `isEmbedded()`) — each news row links straight to that story's real
    permalink (`https://members.e-invoicingcompliancecorner.com/
    members/archive/{id}`), opening in a new tab, same as the existing
    footer "Archive" button.
- **"← Back to the tracker" was right-aligned, unlike every other
  page's top-left back link.** Moved into its own `.map-back-row` above
  `.map-topbar`, reusing the same `.back-link` look (IBM Plex Mono,
  muted color, underline-free) the deep-dive/`/sources` pages already
  use — left-aligned by default now that it's not sharing a flex row
  with the language switch.

Verified all three with a Playwright script covering both contexts
(standalone fixture page + a simulated shadow-root panel, built from
the real `MAP_STYLE`/`mapPageBodyHtml()`/`map-panel.js` source, not
hand-written mocks): title renders as one line at desktop width in
both contexts, back link sits flush left in both, standalone still
shows the full 4-country list, panel shows 3 news rows in the right
(newest-first) order with correct dates/links/new-tab target, and the
language switch stays hidden in panel mode. No console errors either
mode.

**Deployed 3 Aug 2026** via the same `cd site-worker && npx wrangler
deploy` above. Live spot-check still worth doing when convenient:
"THE COMPLIANCE MAP" reads as one line on both `/map` and the
tracker's panel; "← Back to the tracker" sits at the top-left on
both; the standalone page still shows "All jurisdictions" with every
country; the tracker's embedded panel shows "Latest updates" with real
newsletter headlines, newest first, each opening its full story on the
members site in a new tab.

### The Map's "Latest updates" panel: region-filtered, flagged, pop-out (3 August 2026, deployed 3 Aug 2026)

Three refinements to the "Latest updates" list added in the previous
round (embedded-panel-only, per its own header comment):

- **Filtered to the active map region.** Switching the Europe/Middle
  East/Asia-Pacific/Americas tab now filters the news list down to
  stories touching at least one country in that region, instead of
  showing the same site-wide list regardless of which region is
  selected. `getRecentStories(db, lang, limit=40)` (`shared/
  map-data.mjs`) now also joins `story_countries`/`countries` (mirroring
  members-worker's own `getStoriesWithCountries()` query shape) and
  returns each story's `countries[]` and derived `regions[]` (the
  unique set of regions its countries belong to) alongside the existing
  `id`/`date`/`title`. The pool size went from 8 to 40 specifically
  because it's now filtered client-side per region rather than shown
  as one flat list — 8 total split across 4 regions would leave almost
  nothing to show in the quieter regions. A story spanning countries in
  two regions (rare, but real) correctly appears under both tabs. A
  story with no country tag at all (also rare) doesn't appear under any
  region-filtered tab — an accepted edge case, noted in the code.
  `map-panel.js`'s `buildRecentNewsList(root, region)` now takes the
  region explicitly and is called fresh on every `setActiveRegion()`
  tab switch (news mode rebuilds rather than keeping per-region blocks
  the way the country list's accordion does, since there's no state
  worth preserving across tabs here).
- **Each row now shows the flag(s) and name(s) of the country/countries
  the story is about**, between the date and the title (e.g. "🇫🇷
  France", or "🇫🇷 France, 🇸🇦 Saudi Arabia" for a genuinely
  cross-cutting story) — a new `.news-countries` line, styled to sit
  between `.news-date` and `.news-title`.
- **Clicking a story now pops it out in a modal, in place, instead of
  opening the members-subdomain permalink in a new tab** — matching
  exactly how clicking a story already behaves in the "Newsletter
  Archive" panel (`einvoicing-compliance-tracker.html`'s
  `wireArchiveStoryModal()`). Ported the same interaction into
  `map-panel.js` itself: a `#storyModalOverlay`/`#storyModalBody`/
  `#storyModalClose` triplet (added to `mapPageBodyHtml()`, styled with
  the exact same `.modal-overlay`/`.modal-card`/`.modal-close`/
  `.modal-loading` CSS members-worker's own archive modal uses) fetches
  the real story permalink, pulls `.wrap .card`'s innerHTML out of the
  response, and drops it into the modal body. Falls back to a plain
  "official source" link if the fetch fails. Closes via the × button,
  a backdrop click, or Escape. The row's real `href` (opening in a new
  tab) is kept as the no-JS/middle-click fallback, same convention used
  for every other in-page link on this site.
  - One real subtlety caught while wiring this up: Escape-key handling
    can't be a fresh `document.addEventListener` call inside the
    MapPanel constructor, since the tracker's in-page panel creates a
    brand new `MapPanel` instance every time it's reopened — that would
    accumulate one stale listener per open/close cycle (the exact
    pitfall `wireArchiveStoryModal()`'s own header comment already
    flags for the same reason). Fixed by making the Escape listener a
    module-level singleton, wired once, that always targets whichever
    `MapPanel` instance booted most recently.

Verified all three with a Playwright script that mocks the members-
subdomain fetch (`page.route()`, no real network needed) and drives a
simulated shadow-root panel: Europe correctly shows the France and
cross-cutting stories and excludes the Saudi-only and untagged ones;
Middle East shows the inverse; each row's flag+name text matches;
clicking a row opens the modal with the mocked story's real content
(not a navigation), and the close button closes it. No console errors.

**Deployed 3 Aug 2026** via the same site-worker deploy. Live
spot-check still worth doing when convenient: switch region tabs on
the tracker's embedded Map panel and confirm the news list changes to
match; confirm each headline shows a flag + country name; click a
headline and confirm it pops out in place rather than opening a new
tab.

### The Map's footer CTAs open in-page like everything else (3 August 2026, deployed 3 Aug 2026)

The map's footer had a "Browse the newsletter archive" button that
always did a real cross-origin navigation, even when The Map was open
inside the tracker (where every other cross-panel link -- Resources
menu items, the deep-dive-panel's own footer links, etc. -- opens the
target as an in-page panel instead). Root cause: the tracker's global
delegated click listener (`wireDeepDiveInPagePanel()`) can't see clicks
on anchors inside a shadow root at all (the same event-retargeting
limitation this project has hit and fixed before -- see
map-panel.js's own header comment on `navigate`/`closePanel`), so the
map's footer button, sitting inside the panel's shadow root, was never
going to be caught by it. Fixed the same way every other shadow-scoped
interaction on this component already is: a listener wired directly on
the button itself.

- Added a new `wireFooterCta()` method (called once from `_boot()`,
  guarded by `isEmbedded()`) that intercepts a click on
  `#archiveBtnLink` and calls a new `opts.openArchive` callback instead
  of following the href, when that opt is provided.
- `einvoicing-compliance-tracker.html`'s `openMapPage()` now passes
  `openArchive: () => openArchive()` — reusing the tracker's existing
  archive panel function as-is, which already closes the map panel
  itself as part of its own mutual-exclusion block (same pattern every
  other panel transition already follows).
- Standalone `/map` gets neither opt, so the button stays a plain link
  there — there's no in-page panel system to open into outside the
  tracker.

Also added a second footer button, "Subscribe to the newsletter,"
right next to the archive one (`.footer-cta-buttons` wraps both now),
using the exact same pattern: `opts.openSubscribe`, wired the same way
as `openArchive` above, calling the tracker's existing
`openSubscribePage()` (which likewise already closes the map panel
itself). Standalone mode falls back to a plain link to `/subscribe.html`.
Styled as a solid amber button (`.subscribe-btn`, using the page's own
`--soon`/`--soon-dim` accent colors already used for the active region
tab) sitting beside the existing red `.archive-btn`, so the two read as
distinct actions rather than a repeated button. New `subscribeBtn` i18n
string added in all 4 languages (`shared/map-data.mjs`), matching the
existing `archiveBtn` string's convention exactly.

Verified with a Playwright script: standalone mode shows both buttons
as plain links with the correct text/href; simulated panel mode
confirms a click on either button calls the corresponding opts
callback and does *not* navigate the page.

**Deployed 3 Aug 2026** via the same site-worker deploy. Live
spot-check still worth doing when convenient: open the tracker's
embedded Map panel, click "Browse the newsletter archive" — the
archive should open in-page, not a new tab/window; click "Subscribe to
the newsletter" — the subscribe panel should open in-page the same
way.

### ADDING-A-COUNTRY.md updated to cover The Map (2 Aug 2026, cont'd)

Audited the "adding a new country" runbook against everything The Map
gained across this session's seven rounds (`mandate_scope` was already
documented from an earlier round; this pass covers the rest). Found
one real inaccuracy and one undocumented connection:

- **Phase 5's testing checklist claimed** "there's no separate file to
  edit for a country to show up here [on The Map]... unlike Phase 2's
  `countries.js` and slug-map duplicates." Not fully true:
  `shared/map-data.mjs` has two hand-maintained lookup tables,
  `TOPO_NAME_OVERRIDES` and `MARKER_LONLAT_OVERRIDES`, that a new
  country occasionally needs. `TOPO_NAME_OVERRIDES` maps this
  project's `name_en` to the bundled world-atlas topology's own
  `properties.name` when the two spellings differ — a mismatch means
  the country's shape silently fails to match and never renders, no
  error. `MARKER_LONLAT_OVERRIDES` supplies a fallback `[lon, lat]`
  for a country with no topology feature at all (typical for
  micro-states) or one too small to reliably render/click.
  `map-panel.js` already logs `"The Map: no map position for <name> --
  add a markerLonLat override."` to the console when neither a shape
  nor an override exists for a country — that console line is the
  reliable signal, not eyeballing the map among ~190 other shapes.
- **The Map's "Latest updates" news panel** (added this session, Round
  6) wasn't connected anywhere in the doc to the existing "tag a
  launch story to the country" step. No new step is actually required
  there — the panel reads the same `story_countries` tagging and the
  country's `region` that already drive the archive's deep-dive link —
  but a future country-adder had no way to know why their launch story
  would (or wouldn't) show up in the map's news list.

Fixed both in `ADDING-A-COUNTRY.md`:
- Added a new **Phase 1 step 6 ("Conditional) The Map's D3 rendering
  overrides")** documenting `TOPO_NAME_OVERRIDES` and
  `MARKER_LONLAT_OVERRIDES` — what each is for, the observable symptom
  if skipped, and that most countries need neither.
- Reworded step 5 (the launch-story step) to note it's also what feeds
  the "Latest updates" panel, with no extra step needed.
- Corrected Phase 5's Map checklist item: replaced the "no separate
  file to edit" claim with an instruction to check the console for the
  "no map position" warning and visually confirm the shape/marker
  renders, attributing any gap to `shared/map-data.mjs`'s overrides
  rather than a D1 problem.
- Added a clause to the existing "story tagged to it" checklist item
  confirming the country also shows (flag + name) in the Map's news
  panel once a story is tagged.
- Added a one-line cross-reference in "Before you start"'s country-name
  bullet: the exact English name also needs to match the topology's
  spelling, or The Map's shape lookup breaks the same way the picker/
  preferences/story-tagging match already warns about.

Also updated `members-worker/migrations/new_country_scaffold.py`'s
closing "Still to do" printout with a new item 6 pointing at the same
console check, so the scaffolder's own output steers a country-adder
toward this without needing to already know to look in
ADDING-A-COUNTRY.md's Phase 1 step 6. Didn't add scaffold-side
*validation* for the topology overrides (unlike `mandate_scope`,
which the scaffolder can check mechanically) — whether a name matches
the topology can only really be confirmed by looking at the rendered
map, so a printed reminder is the right level of automation here
rather than a spec field that can't be verified until deploy anyway.

Documentation-only change, no code behavior affected — nothing to
deploy for this entry itself.

### Oman added as country #38 (3 August 2026, deployed & tested)

Full country build (migrations 256-263), following directly from the
Middle East coverage evaluation above — Oman was the strongest
"imminent" candidate, with Phase 1 landing this same month.

- **Migrations 256-258**: country row (slug `oman`, region "Middle
  East"), 6 milestones — the October 2025 Fawtara specification
  (anchor, off-board), May 2026 ASP registration opening, then four
  dated phases: Phase 1 (~100 largest taxpayers, 1 August 2026,
  `mandate_scope: 'b2b'`), Phase 2 (remaining large taxpayers,
  February 2027), Phase 3 (all remaining VAT-registered taxpayers
  incl. SMEs, August 2027), and Phase 4 (government-counterparty
  transactions, `mandate_scope: 'b2g_only'`, August 2028). All sourced
  from KPMG Oman Tax Flash alerts and the OTA's own Tax Portal.
- **Migrations 259-260**: full deep-dive page — compliance model
  described as a decentralised Peppol five-corner model (not a
  centralised clearance platform, the closest precedent being UAE's
  own ASP-based system), 5 stats, 3 `file_format` cards, a lifecycle
  card ("The five corners", 5 pill statuses) plus 2 regular cards in
  `scope_transmission`, 3 narrative `penalties_related` cards (no
  penalty-schedule table — none has been published yet), 5 steps, 2
  portals. Self-caught and fixed a lifecycle-card duplication error
  mid-build (an erroneous companion `deep_dive_cards` row for the same
  content) by cross-checking against the real Malaysia migration
  before it shipped.
- **Migration 261**: a 3-story arc — the October 2025 Fawtara
  announcement, the May 2026 ASP registration opening, and the June
  2026 confirmation of Phase 1's ~100-taxpayer scope.
- **Migration 262**: tracking sources (OTA's e-Invoicing and
  Service-Provider portal pages — no EC factsheet, since Oman isn't an
  EU member state, unlike every recent addition before it).
- **Migration 263**: jurisdiction count 36→37, verified directly
  against the true pre-Oman baseline (migration 251) before sweeping.
- **Resolved a "100 vs 153 taxpayers" discrepancy** in Phase 1's scope:
  an initial source summary named both figures for the same milestone;
  cross-checked against KPMG's own Oct 2025 Tax Flash and a VATupdate
  article, both independently confirming 100. Used 100 throughout.
- **Static files**: `countries.js` (Middle East, between Egypt and
  Saudi Arabia), `shared/deep-dive-render.mjs`'s slug map and
  `COUNTRY_NAME_TRANSLATIONS` dictionary. While in that dictionary,
  also backfilled 6 other countries missing from it since their own
  additions (Austria, Cyprus, Egypt, Greece, Luxembourg, Netherlands)
  — a known, documented gap this doc had already flagged; fixing it
  alongside Oman's own entry was cheaper than a separate pass later.
- **Hand-swept the jurisdiction count in every static surface**
  `generate_files.py` would otherwise regenerate from D1: all four
  languages' `i18n/*.json` files and every static HTML page
  (`subscribe.html`, the education pages, `index.html`,
  `einvoicing-compliance-tracker.html`) carrying the literal "36" in
  prose or a hardcoded stat tile — 58 occurrences across 32 files,
  cross-checked against migration 263's own key list so every hit
  traces back to a real D1 key. Left one unrelated "36" alone (a
  "36-day reporting window" mention in the tracker's AP/AR guidance —
  not a jurisdiction count).
- Local migration-chain replay (`apply_migrations.py --local
  --dry-run`) confirms all 263 files validate cleanly against the
  full schema history — "Replay validation OK (263 files, only the
  documented pre-existing errors)."

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass.

**Deployed and tested** (confirmed by Dan): migrations 256-263 applied
via `apply_migrations.py --remote`, `site-worker` redeployed for the
`countries.js`, `deep-dive-render.mjs`, i18n, and jurisdiction-count
static-file edits. Oman live on the tracker board (Middle East,
between Egypt and Saudi Arabia), and "37" reads correctly everywhere
the old "36" did.

### Jordan added as country #39 (3 August 2026, deployed & tested)

Full country build (migrations 264-271), the second addition from the
Middle East coverage evaluation above — Jordan's JoFotara is the most
mature mandate of the three strongest candidates (Jordan/Israel/Oman),
with real legal enforcement already in force since April 2025 rather
than a future date.

- **Migrations 264-266**: country row (slug `jordan`, region "Middle
  East"), 5 milestones — JoFotara's December 2022 voluntary launch
  (anchor, off-board), January 2023 mandatory onboarding for large
  taxpayers, the May 2024 universal-registration deadline for every
  VAT-registered taxpayer (no SME exemption), full legal enforcement
  across B2B/B2G/B2C from 1 April 2025 (`mandate_scope: 'b2b'` on the
  in-force milestones), and the May 2025 close of a penalty-waiver
  grace period. Sourced from the Income and Sales Tax Department
  (ISTD, istd.gov.jo) and cross-checked against VATupdate, EDICOM, and
  vatit.com/Flick Network compliance guides, which independently agree
  on the phase dates.
- **Migrations 267-268**: full deep-dive page — a centralized clearance
  CTC model description, 5 stats, 3 `file_format` cards, a lifecycle
  card ("The clearance flow", 5 pills: draft → submit → ISTD validates
  → QR/reference issued → delivered) plus 2 regular cards in
  `scope_transmission`, a genuine 2-row fine-schedule table (`deep_
  dive_penalty_rows` — JOD 500 per violation escalating to JOD 1,000
  or imprisonment, a real enough figure to warrant a table rather than
  narrative-only, per the Saudi/Belgium/Italy precedent) plus 3
  narrative `penalties_related` cards, 6 steps, 2 portals.
- **Migration 269**: a 3-story arc — the January 2023 Phase 1
  onboarding for large taxpayers, the May 2024 universal-registration
  deadline, and the April 2025 full-enforcement milestone.
- **Migration 270**: tracking sources (ISTD's own site and the
  JoFotara registration portal — no EC factsheet, since Jordan isn't
  an EU member state, matching the Oman precedent).
- **Migration 271**: jurisdiction count 37→38, verified directly
  against the true pre-Jordan baseline (migration 263) before
  sweeping.
- **Static files**: `countries.js` (Middle East, between Egypt and
  Oman, alphabetically), `shared/deep-dive-render.mjs`'s slug map and
  `COUNTRY_NAME_TRANSLATIONS` dictionary (Jordania/Jordanien/Jordanie).
- **Hand-swept the jurisdiction count** in every static surface
  `generate_files.py` would otherwise regenerate stale from D1: all
  four languages' `i18n/*.json` files and every static HTML page — 58
  occurrences across 31 files, cross-checked against migration 271's
  own key list, plus the education-mandate-types.html stat tile caught
  by the same broadened sweep script used for Oman's backfill.
- Local migration-chain replay (`apply_migrations.py --local
  --dry-run`) confirms all 271 files validate cleanly against the
  full schema history — "Replay validation OK (271 files, only the
  documented pre-existing errors)."

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass.

**Deployed and tested** (confirmed by Dan): migrations 264-271 applied
via `apply_migrations.py --remote`, `site-worker` redeployed for the
`countries.js`, `deep-dive-render.mjs`, i18n, and jurisdiction-count
static-file edits. Jordan live on the tracker board (Middle East,
between Egypt and Oman), visible in the UI.

### Israel added as country #40 (3 August 2026, deployed & tested)

Full country build (migrations 272-279), the third and final addition
from the Middle East coverage evaluation above. Israel's SHAAM system
is a genuinely different mandate mechanic from every other country
built this session: a domestic-B2B-only clearance mandate phased in
via a shrinking invoice threshold rather than taxpayer-size waves, and
enforced through VAT-deduction denial rather than a published fine
schedule.

- **Migrations 272-273**: country row (slug `israel`, region "Middle
  East"), 5 milestones — the Economic Efficiency Law's May 2023
  enactment (anchor, off-board, `mandate_scope: 'none'`), the genuine
  no-rejection pilot from May 2024 above NIS 25,000, the January 2025
  threshold drop to NIS 20,000 alongside full ITA scrutiny/refusal
  powers activating, the accelerated January 2026 drop to NIS 10,000
  (skipping a planned NIS 15,000 step), and the June 2026 arrival at
  the permanent NIS 5,000 floor. Sourced from the Israel Tax
  Authority's own gov.il service pages and cross-checked against
  VATupdate's dedicated Israel briefing (Jan 2026), Sovos, EDICOM,
  vatit.com, dddinvoices.com, and flick.network, which independently
  agree on the threshold schedule and dates.
- **Migrations 275-276**: full deep-dive page — a centralized clearance
  model description (SHAAM allocation-number system, domestic B2B
  only), 5 stats, 3 `file_format` cards, a lifecycle card ("The
  clearance flow", 5 pills: draft → submit via API/portal → ITA
  validates → allocation number issued → delivered + reported on VAT
  return) plus 2 regular cards in `scope_transmission` (the full
  threshold phase-down table; what's explicitly out of scope —
  B2C/B2G/cross-border), 3 narrative `penalties_related` cards — no
  `deep_dive_penalty_rows` table, since no quantified fine figures
  were found in any source (matching the Egypt/Oman precedent, unlike
  Jordan's real JOD fine schedule) — instead honestly disclosing that
  VAT-deduction denial, not a fine schedule, is the real enforcement
  engine, 6 steps, 2 portals (request an allocation number; verify
  vendor invoice information).
- **Migration 277**: a 3-story arc — the May 2024 pilot launch, the
  January 2025 activation of full ITA scrutiny/refusal powers, and the
  June 2026 arrival at the permanent NIS 5,000 threshold floor.
- **Migration 278**: tracking sources (the ITA's two gov.il service
  pages — no EC factsheet, since Israel isn't an EU member state,
  matching the Oman/Jordan precedent).
- **Migration 279**: jurisdiction count 38→39, generated programmatically
  from migration 271's own key list (same ~10 `translations` keys ×
  4 languages).
- **Static files**: `countries.js` (Middle East, alphabetically between
  Egypt and Jordan), `shared/deep-dive-render.mjs`'s slug map and
  `COUNTRY_NAME_TRANSLATIONS` dictionary (Israel/Israel/Israël for
  es/de/fr).
- **Hand-swept the jurisdiction count** in every static surface
  `generate_files.py` would otherwise regenerate stale from D1: all
  four languages' `i18n/*.json` files and every static HTML page — 58
  occurrences across 31 files, using the same broadened sweep script
  (including the education-mandate-types.html and subscribe.html stat
  tiles) established during the Jordan build.
- Local migration-chain replay (`apply_migrations.py --local
  --dry-run`) confirms all 279 files validate cleanly against the
  full schema history — "Replay validation OK (279 files, only the
  documented pre-existing errors)."

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass.

**Deployed and tested** (confirmed by Dan): migrations 272-279 applied
via `apply_migrations.py --remote`, `site-worker` redeployed for the
`countries.js`, `deep-dive-render.mjs`, and i18n/static-HTML
jurisdiction-count edits. Israel is live on the tracker board (Middle
East / North Africa, between Egypt and Jordan), confirmed via the UI.
This closes out the last country addition that was still awaiting
deploy confirmation — every country built this session (Netherlands
through Turkey) is now confirmed live.

### South Korea added as country #41 (3 August 2026, deployed & tested)

Full country build (migrations 280-287), the top pick from the
Asia-Pacific coverage evaluation above. South Korea's e-Tax Invoice
system is a genuinely different technical/legal model from every
clearance-model mandate built this session (Jordan, Israel, Egypt,
Saudi, UAE, Oman): it's a **post-issuance real-time-reporting**
mandate, not a clearance one — the invoice is legally valid immediately
on delivery to the buyer, and next-day transmission to the National Tax
Service (NTS) is a separate reporting duty, not a precondition for
validity. Also the most mature mandate added this session: in force
since January 2011, 15 years running, with none of the "expected" or
"proposal-stage" caveats attached to some of this session's other
additions.

- **Migrations 280**: country row (code `KR`, slug `south-korea`,
  region "Asia-Pacific"), name translations (Corea del Sur/Südkorea/
  Corée du Sud).
- **Migrations 281-282**: 6 milestones with full ES/DE/FR translations
  — the January 2011 corporate mandate (anchor, off-board, since The
  Map only reads `on_tracker = 1` rows and this is historical context
  for the deep-dive timeline, not a board entry), then the individual-
  entrepreneur threshold's four-step fall: KRW 1 billion (Jan 2012) →
  300 million (Jul 2014) → 200 million (Jul 2022, on-board) → 100
  million (Jul 2023, on-board, also introduced self-billing invoices)
  → 80 million (Jul 2024, on-board, current floor). Sourced from
  Sovos's dedicated e-Tax Invoice history page, cross-checked against
  VATupdate's July 2026 country booklet, Voxel Group, and Storecove.
- **Migrations 283-284**: full deep-dive page — a post-issuance
  real-time-reporting compliance model description (explicitly
  contrasted with the clearance-model mandates covered elsewhere in
  this tracker), 5 stats, 3 `file_format` cards (format & standard;
  identifiers & registration across 5 submission channels; mandatory
  content & archiving — 5-year retention, self-billing since July
  2023), a lifecycle pill card titled "The issue-then-report flow" (4
  pills: invoice issued in signed XML → delivered to buyer, legally
  valid now → transmitted to NTS by next business day → buyer relies
  on it for input-VAT deduction) plus 2 regular `scope_transmission`
  cards (who's in scope and since when; domestic B2B/B2G only —
  explicitly not B2C, not cross-border/export), a genuine 4-row
  `deep_dive_penalty_rows` table (non-issuance 2%; paper invoice where
  e-required 1%; failure to transmit by deadline 1%; delayed
  issuance/transmission 0.3-0.5% — all capped at KRW 50 million/year,
  KRW 100 million for large companies, no cap for intentional
  violations), 3 narrative `penalties_related` cards (VAT-deduction
  denial as the real second consequence; fifteen years of enforcement
  framed as maturity, not novelty; a "living tracker" freshness point
  on a 2026 Korean tax law change raising the fictitious-VAT-invoice
  penalty from 3% to 4%), 6 steps, 2 portals (hometax.go.kr,
  nts.go.kr/english/).
- **Migration 285**: a 3-story arc — the January 2011 corporate launch,
  the July 2023 threshold drop to KRW 100 million plus the self-billing
  introduction, and the July 2024 drop to the current KRW 80 million
  floor.
- **Migration 286**: tracking sources (NTS's English portal and the
  Hometax platform itself — no EC factsheet, since South Korea isn't
  an EU member state, matching the Oman/Jordan/Israel precedent).
- **Migration 287**: jurisdiction count 39→40, generated
  programmatically from migration 279's own key list (same ~10
  `translations` keys × 4 languages).
- **Static files**: `countries.js` (Asia-Pacific, appended after
  Singapore), `shared/deep-dive-render.mjs`'s slug map and
  `COUNTRY_NAME_TRANSLATIONS` dictionary (Corea del Sur/Südkorea/Corée
  du Sud for es/de/fr).
- **Hand-swept the jurisdiction count** across all four languages'
  `i18n/*.json` files and every static HTML page — 58 occurrences
  across 31 files, same sweep script used for every prior country this
  session.
- Checked The Map's two hand-maintained lookup tables per
  ADDING-A-COUNTRY.md's Phase 1 step 6: the bundled world-atlas
  topology (`vendor/countries-50m.json`) already has a feature named
  exactly `"South Korea"`, matching this project's `name_en` — no
  `TOPO_NAME_OVERRIDES` entry needed, and the shape is a normal
  full-size country geometry, so no `MARKER_LONLAT_OVERRIDES` fallback
  is needed either.
- Confirmed (not a South Korea-specific gap): `i18n/{en,es,de,fr}.json`
  `countryNames` still has no entry for South Korea — but it also has
  none for Israel, Jordan, or Oman, so this is a pre-existing gap
  across every Middle East/Asia-Pacific country added this session,
  not a regression introduced here. Per ADDING-A-COUNTRY.md, this key
  is meant to be regenerated from D1 (`generate_files.py --remote`),
  which this sandbox can't run without live Cloudflare credentials —
  worth a batch fix from your own machine covering all four countries
  at once, rather than one-off edits.
- Two SQL bugs caught and fixed during the build, both in migration
  283: a copy-paste artifact left an erroneous trailing `FROM
  countries WHERE name_en = 'South Korea';` clause on 8
  `deep_dive_card_translations` inserts that should have been plain
  `VALUES (...)` statements (they key off a scalar
  `(SELECT MAX(id) FROM deep_dive_cards)` subquery, not a SELECT-based
  row generation), and the first fix's removal of that clause left
  those same 8 statements with an unclosed `VALUES (...)` parenthesis,
  caught by a failed local replay and fixed by re-balancing each
  statement's parens.
- Local migration-chain replay (`apply_migrations.py --local
  --dry-run`) confirms all 287 files validate cleanly against the
  full schema history — "Replay validation OK (287 files, only the
  documented pre-existing errors)."

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass (the `countryNames` gap above is a known, pre-existing, optional
fallback item per the doc's own framing, not a checklist failure).

**Deployed and tested** (confirmed by Dan): migrations 280-287 applied
via `apply_migrations.py --remote`, `site-worker` redeployed for the
`countries.js`, `deep-dive-render.mjs`, i18n, and jurisdiction-count
static-file edits. South Korea is live on the tracker board
(Asia-Pacific, after Singapore), confirmed via the UI.

### Vietnam added as country #42 (3 August 2026, deployed & tested)

Full country build (migrations 288-295), the second addition from the
Asia-Pacific coverage evaluation (South Korea was first). Vietnam's
mandate is genuinely dual-model — unlike every other country built
this session, an invoice either carries a GDT-issued code obtained
before delivery (real-time clearance, the same shape as Jordan/Israel/
Egypt) or transmits to the tax authority no later than the same day
without a code (the same shape as South Korea's post-issuance
reporting). Rather than force one framing, the deep-dive describes
both flows as two separate lifecycle pill cards. The penalty schedule
is also structurally new for this tracker: fines escalate by the
*count* of violating invoices found in an inspection period, not a
flat or percentage figure.

- **Migrations 288-290** (generated via `new_country_scaffold.py`,
  then hand-translated): country row (slug `vietnam`, region
  "Asia-Pacific"), 4 milestones — Decree 123/2020/ND-CP establishing
  the framework (Dec 2020, anchor, off-board, `mandate_scope: 'none'`),
  the Nov 2021 pilot across six provinces including Hanoi and Ho Chi
  Minh City (anchor, off-board, `'none'`), the 1 July 2022 nationwide
  mandate (on-board, `'b2b'` — paper invoices ceased to be valid), and
  Decree 70/2025's June 2025 scope expansion to large business
  households (VND 1 billion+ revenue) and foreign e-commerce suppliers
  (on-board, `'b2b'`). Sourced from a VATupdate briefing document,
  china-briefing.com's Decree 70 analysis, vietnamplus.vn, and
  alitium.com's 2026 penalty-framework article, cross-checked against
  each other for dates and figures.
- **Migrations 291-292**: full deep-dive page — a dual-model
  compliance description, 5 stats, 3 `file_format` cards, **two**
  separate lifecycle pill cards in `scope_transmission` ("Model 1 —
  real-time clearance," 4 pills; "Model 2 — same-day reporting," 3
  pills, explicitly cross-referencing South Korea's post-issuance
  model as the closer analogue) plus 2 regular cards (scope-since-when;
  what's covered — exports in, imports explicitly out), a genuine
  4-row `deep_dive_penalty_rows` table showing the violation-count
  escalation (VND 500K-1.5M for a single incorrect-timing violation up
  to VND 50-70M for 100+; VND 1-2M for a single missing invoice up to
  VND 60-80M for 100+), 3 narrative `penalties_related` cards
  (volume-scaling explanation; the separate lighter schedule for
  non-commercial/internal-use invoices; a living-tracker freshness
  point on Decree 310/2025's January 2026 restructuring), 6 steps, 2
  portals (the GDT's English portal; the public invoice-lookup system
  at tracuuhoadon.gdt.gov.vn).
- **Migration 293**: a 3-story arc — the July 2022 nationwide mandate
  launch, the June 2025 Decree 70 scope expansion, and the January
  2026 penalty-framework restructuring.
- **Migration 294**: tracking sources (the GDT's English portal and
  the invoice-lookup system — no EC factsheet, since Vietnam isn't an
  EU member state, matching the Oman/Jordan/Israel/South Korea
  precedent).
- **Migration 295**: jurisdiction count 40→41, generated
  programmatically from migration 287's own key list (same ~10
  `translations` keys × 4 languages).
- **Static files**: `countries.js` (Asia-Pacific, appended after South
  Korea), `shared/deep-dive-render.mjs`'s slug map and
  `COUNTRY_NAME_TRANSLATIONS` dictionary (Vietnam/Vietnam/Viêt Nam for
  es/de/fr — French uses the accented two-word form per Larousse's
  encyclopedia entry).
- Checked The Map's two hand-maintained lookup tables per
  ADDING-A-COUNTRY.md's Phase 1 step 6: the world-atlas topology
  already has a feature named exactly `"Vietnam"`, matching this
  project's `name_en` — no `TOPO_NAME_OVERRIDES` entry needed, and the
  shape is a normal full-size country geometry, so no
  `MARKER_LONLAT_OVERRIDES` fallback is needed either.
- **Hand-swept the jurisdiction count** across all four languages'
  `i18n/*.json` files and every static HTML page — 58 occurrences
  across 31 files (one file, `education-mandate-types.html`, was
  missed by the first automated pass since it wasn't in the sweep
  script's file list — caught and fixed by the same stray-"40" grep
  check that's now a standard part of this workflow).
- One SQL bug caught and fixed in migration 291: three
  `penalties_related` narrative cards each had a spurious trailing
  `, NULL` after the `body` value, making the `VALUES (...)` tuple 7
  values against the table's 6 declared columns ("7 values for 6
  columns") — caught by the local replay and fixed by removing the
  stray `NULL` from each of the three statements.
- Local migration-chain replay (`apply_migrations.py --local
  --dry-run`) confirms all 295 files validate cleanly against the
  full schema history — "Replay validation OK (295 files, only the
  documented pre-existing errors)." A follow-up structural count check
  (milestones, stats, cards, lifecycle statuses, penalty rows, steps,
  portals, all × 4 languages) confirmed every row landed with the
  correct count on the first clean replay.

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass.

**Deployed and tested** (confirmed by Dan): migrations 288-295 applied
via `apply_migrations.py --remote`, `site-worker` redeployed for the
`countries.js`, `deep-dive-render.mjs`, i18n, and jurisdiction-count
static-file edits. Vietnam is live on the tracker board (Asia-Pacific,
after South Korea), confirmed via the UI.

### Two /sources fixes: South Korea's NTS link, France's FNFE-MPE (3 August 2026, deployed & tested)

Two small, non-country-add changes to `/sources`, both requested by
Dan directly and both requiring a judgment call rather than a
mechanical edit, so both were evaluated with `AskUserQuestion` before
implementing:

- **South Korea's NTS link was broken.** Dan flagged
  `https://www.nts.go.kr/nts/main.do` as a possible replacement for
  `https://www.nts.go.kr/english/` (added in migration 286). Neither
  URL could be verified directly here (`WebFetch` hit
  `ROBOTS_DISALLOWED` on both), so this was surfaced to Dan rather
  than guessed at. Dan confirmed by testing in his own browser: "the
  source nts.go.kr/english routed to an invalid page." Swapped to
  `nts.go.kr/nts/main.do`, the URL Dan confirmed works. Plain
  `UPDATE`, not `INSERT OR IGNORE`, since this corrects an existing
  row.
- **France gained a second tracking source: FNFE-MPE**
  (`https://fnfe-mpe.org/`). Dan asked for it to be evaluated as a
  trusted source; since `/sources` is framed as "the official
  government and authority pages we monitor," and FNFE-MPE is a
  public-private consultation body rather than a government agency,
  this was surfaced as a choice rather than added automatically. Dan
  chose "add fnfe-mpe.org alongside Chorus Pro" (not instead of an
  official gov page, and not all three). Added as a third source next
  to Chorus Pro and the EC factsheet, with an EN/ES/DE/FR description
  that's explicit about it being a consultation body, "not a
  government body itself" — the first source on `/sources` labeled
  that way.

Migration: `296_sources_nts_and_fnfempe.sql`. Local replay confirms
"Replay validation OK (296 files, only the documented pre-existing
errors)," and a structural query against the replayed DB confirmed
South Korea's source now reads `nts.go.kr/nts/main.do` and France has
three tracking sources (Chorus Pro, EC factsheet, FNFE-MPE) with all
four language translations present. Committed and pushed
(`15d72bd`).

**Deployed and tested** (confirmed by Dan): migration 296 applied via
`apply_migrations.py --remote`. Data-only change, so no static-file or
`site-worker` deploy was needed for this one — the `/sources` page
renders straight from D1.

### Resources menu reordered: The Map now leads (3 August 2026, deployed & tested)

Small, Dan-requested UI tweak: the Resources dropdown in
`einvoicing-compliance-tracker.html` now lists The Map first, ahead of
Deep Dives, Newsletter archive, and Tracking sources (previously last).
Pure markup reorder inside `#resourcesPanel` — `wireResourcesMenu()`,
`wireDeepDiveMenu()`, and the in-page link interception in
`wireDeepDiveInPagePanel()` all select their elements by id, not
position, so no JS changes were needed. Committed (`d9415e2`).

**Deployed and tested** (confirmed by Dan): live via the usual
`site-worker` static-asset deploy — no migration, no members-worker
change.

### "Middle East" relabeled to "Middle East / North Africa," Turkey added as country #43 under Europe (3 August 2026, deployed & tested)

Two Dan-requested changes landed together: renaming the "Middle East"
region label everywhere it appears, and building Turkey as a full
country — the strong candidate surfaced by the same-day Middle East
recheck, but classified under Europe rather than Middle East/North
Africa per Dan's explicit instruction (Turkey is transcontinental;
its e-invoicing regime, EU-accession-candidate status, and every
prior country immediately alphabetically adjacent to it on this
tracker all sit in the Europe list).

**Region relabel.** `/sources` (`site-worker/src/index.js`'s
`renderSourcesPage()`) renders the `countries.region` column directly,
with no translation layer, while the tracker/subscribe/map UIs
translate that same raw string via a `regionNames`/`translateRegion()`
lookup keyed on it — so a display-value-only edit would have left
`/sources` showing the old label while everywhere else showed the new
one. Fixed by renaming the canonical string itself everywhere:

- **Migration 297**: renames the `namespace='regions'` translation
  rows' `key` (all 4 languages) from `'Middle East'` to `'Middle East /
  North Africa'` (values also updated per language), and updates
  `countries.region` for all 6 affected countries (Egypt, Israel,
  Jordan, Oman, Saudi Arabia, UAE).
- **Static files**: `members-worker/src/index.js` (`REGION_ORDER`,
  `translateRegionName()`'s three language maps),
  `site-worker/src/index.js` (`SOURCES_REGION_ORDER`, both CASE-statement
  literals in `buildTrackerData()` and `renderSourcesPage()`),
  `shared/map-data.mjs` (`REGION_ORDER`, `REGION_BOUNDS` key, all 4
  languages' `regionNames` and `regionNotes` dicts), `countries.js`
  (region key), all 8 `i18n/{en,es,de,fr}{,-subscribe}.json` files'
  `regionNames` blocks, and `einvoicing-compliance-tracker.html`'s
  static `DATA` fallback array (6 `region:'Middle East'` entries —
  Saudi Arabia and UAE only; Egypt/Israel/Jordan/Oman aren't in this
  legacy outage-fallback snapshot) plus its own `REGION_ORDER`. Verified
  via grep on every file that no bare "Middle East" string remains.

**Turkey added as country #43.** Sourced from sovos.com's
"e-Transformation Turkey" page, fiscal-requirements.com's 2026
threshold article, fonoa.com's Türkiye guide, and VUK/Mükerrer 355
penalty-law search results. Turkey's e-invoicing regime is genuinely
dual-system: e-Fatura is a centralized clearance model (seller submits
UBL-TR XML to the Revenue Administration, GİB, which validates and
distributes it to the registered recipient — the same shape as
Jordan/Israel) for registered recipients, while e-Arşiv is a
post-issuance reporting model (seller delivers directly, then reports
to GİB same-day — the same shape as South Korea) for everyone else.
The penalty structure is also structurally new for this tracker: a
10%-of-invoice-value fine (minimum TRY 2,200) under the Tax Procedure
Law's Mükerrer Madde 355, applied to **both** the issuer who fails to
issue and the recipient who accepts a non-compliant invoice — a dual-
accountability shape no other country here has.

- **Migration 298**: country row (`TR`, `Turkey`, region `Europe`,
  slug `turkey`, `in_picker=1`) + name translations.
- **Migration 299-300**: 4 milestones with full translations —
  e-Fatura mandatory (1 Apr 2014, anchor, off-board, `mandate_scope:
  'b2b'` — the origin milestone), e-Defter electronic ledgers (2015,
  off-board, `'none'` — a bookkeeping duty, not an invoicing-scope
  fact), e-İrsaliye/e-Waybill (1 Jul 2023, on-board, `'none'` — goods
  movement, tracked against its own threshold), and the 2026 e-Arşiv
  floor removal + lower general threshold (1 Jan 2026, on-board,
  `'b2b'` — the milestone driving The Map's "inforce" status, since
  `computeCountryMapStatus()` only reads `on_tracker=1` rows).
- **Migrations 301-302**: full deep-dive page — a dual-model
  compliance description, 5 stats, 3 `file_format` cards, **two**
  separate lifecycle pill cards in `scope_transmission` ("e-Fatura —
  centralized clearance," 4 pills; "e-Arşiv — post-issuance
  reporting," 3 pills, explicitly cross-referencing Jordan/Israel and
  South Korea as the closer analogues for each) plus 2 regular cards
  (scope-since-when, with the threshold's fall from TRY 5M at 2014
  launch to as low as TRY 500K by 2026; what's covered), a 2-row
  `deep_dive_penalty_rows` table (issuer + recipient, both 10%/min TRY
  2,200), 3 narrative `penalties_related` cards (the dual-accountability
  point; the percentage-not-flat-fee point contrasted with Vietnam's
  count-scaling and Jordan's flat fine; a living-tracker freshness
  caveat that late e-Arşiv/e-Defter fines don't have a single
  public-source figure worth publishing), 6 steps, 2 portals (GİB's
  e-Belge portal; GİB's general site).
- **Migration 303**: a 3-story arc — the 2014 e-Fatura mandate, the
  2023 e-İrsaliye mandate, and the 2026 e-Arşiv floor removal.
- **Migration 304**: tracking sources (GİB's e-Belge portal and
  general site — no EC factsheet, since Turkey isn't an EU member
  state, matching the Oman/Jordan/Israel/South Korea/Vietnam
  precedent).
- **Migration 305**: jurisdiction count 41→42, generated
  programmatically from migration 295's own key list (same ~10
  `translations` keys × 4 languages).
- **Static files**: `countries.js` (Europe list, inserted alphabetically
  after Sweden), `shared/deep-dive-render.mjs`'s slug map (`turkey`)
  and `COUNTRY_NAME_TRANSLATIONS` dictionary (Turquía/Türkei/Turquie).
- Checked The Map's two hand-maintained lookup tables per
  ADDING-A-COUNTRY.md's Phase 1 step 6: the world-atlas topology
  already has a feature named exactly `"Turkey"`, matching this
  project's `name_en` — no `TOPO_NAME_OVERRIDES` entry needed, and the
  shape is a normal full-size country geometry, so no
  `MARKER_LONLAT_OVERRIDES` fallback is needed either. A genuine
  geographic issue **was** caught and fixed proactively: Turkey's real
  longitude extent runs to ~45°E (Iğdır Province), but Europe's
  existing `REGION_BOUNDS` box in `shared/map-data.mjs` capped at
  35°E, which would have clipped Turkey's shape on The Map's Europe
  tab — widened the box's east edge from 35 to 46.
- **Hand-swept the jurisdiction count** across all four languages'
  `i18n/*.json` files (including the separate per-education-page
  translation files, e.g. `i18n/en-edu-certified-providers.json`,
  which the first automated pass initially missed before being added
  to the sweep's file glob) and every static HTML page — 58
  occurrences across the same file set as every prior sweep, confirmed
  via a stray-"41" grep check restricted to jurisdiction-marker
  context (none found).
- Local migration-chain replay (`apply_migrations.py --local
  --dry-run`) confirms all 305 files validate cleanly against the
  full schema history — "Replay validation OK (305 files, only the
  documented pre-existing errors)." A follow-up structural query
  against the replayed in-memory DB confirmed: all 6 prior Middle
  East countries now show `region = 'Middle East / North Africa'`
  with no `'Middle East'` leftovers; Turkey's country row shows
  `region = 'Europe'`, slug `turkey`, `in_picker=1`; Turkey has
  exactly 4 milestones with the described flags; every deep-dive
  content table (stats, cards, lifecycle cards+statuses, penalty
  rows, steps, portals) landed with the correct row count across all
  4 languages; Turkey has 2 tracking sources each with 4 language
  descriptions.

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass.

**Deployed and tested** (confirmed by Dan): migrations 297-305 applied
via `apply_migrations.py --remote`, both `members-worker` and
`site-worker` redeployed to pick up the region-relabel and Turkey
static-file changes. The Middle East / North Africa relabel and Turkey
(Europe, between Sweden and the United Kingdom) are both live on the
tracker board.

### Turkey deep-dive: lifecycle pills overflowing their card (3 August 2026, deployed & tested)

Dan reported two issues after the Turkey/region-relabel deploy above.
The second (Middle East/North Africa countries briefly missing from
the tracker's sidebar) turned out to be a stale page load — Dan
confirmed a refresh fixed it, consistent with `renderTracker()`'s
5-minute edge cache (`Cache-Control: public, max-age=300`) on the
tracker route simply not having rolled over yet right after the
deploy. No code change needed there.

The first was real: on Turkey's deep-dive page, the "e-Fatura —
centralized clearance" and "e-Arşiv — post-issuance reporting"
lifecycle cards under Scope & Transmission render their step-by-step
flow as rounded "pill" badges (`display_style: 'pills'`, migration
301). `shared/deep-dive-render.mjs`'s `.lifecycle span` CSS was written
assuming short 1-3 word labels (`white-space: nowrap`, `border-radius:
999px`) — true for every prior country using this style. Turkey's
pills are full sentences instead ("Cleared invoice distributed to the
registered buyer", "Invoice data reported to GİB, generally the same
day"), and `nowrap` refused to let that text wrap, forcing each pill
wider than its card — visibly spilling past the card's edge, and (via
`.spec-card` sitting in a `minmax(260px,1fr)` CSS grid track with no
`min-width:0`) potentially forcing the whole grid wider than intended
on narrow viewports.

Fixed in the shared CSS, not by rewriting Turkey's copy, since this is
a real layout gap that any future long-label country would hit again:

- `.lifecycle span`: `white-space:nowrap` → `white-space:normal` +
  `max-width:100%` + `overflow-wrap:break-word` + `word-break:
  break-word`, so a too-long label wraps onto a second/third line
  inside its own pill instead of forcing the pill wider than its
  container. `border-radius` dropped from `999px` (a true stadium
  shape, which looks odd on a pill tall enough to hold 2-3 lines of
  text) to `14px` (a normal rounded-rectangle radius that still reads
  as a pill for the short single-line labels every other country
  uses).
- `.spec-card`: added `min-width:0`, since CSS grid items default to a
  content-based minimum width — without this, a card containing
  unbreakable content could force its own grid track (and the whole
  `.spec-grid`) wider than the column budget, which is what let the
  overflow escape the section boundary rather than staying contained
  within the card.

Verified by rendering a standalone test page via
`renderFullDeepDivePage()` with Turkey's actual e-Fatura lifecycle
card content and screenshotting it in headless Chromium at both a
1280px desktop width and a 390px mobile width — pills wrap onto
multiple lines at both sizes with `document.documentElement.scrollWidth
=== clientWidth` (no horizontal overflow) confirmed at the narrower
width, where the bug was most visible. Single shared CSS block used by
both the standalone `/turkey` (etc.) deep-dive page and the tracker's
in-page deep-dive panel, so one fix covers both surfaces.

**Deployed and tested** (confirmed by Dan): `site-worker` redeployed
with the updated `shared/deep-dive-render.mjs`. Turkey's lifecycle
pills wrap correctly on the live site.

### Qatar re-evaluated for a country add — held back, thinner than first assessed (4 August 2026)

Dan asked to add Qatar as a new country, following the exact same
ADDING-A-COUNTRY.md workflow used for every prior addition this
session. Before scaffolding anything, re-researched Qatar's current
status live (not from the 3 Aug evaluation's notes, since this is
exactly the kind of fast-moving pre-legislative situation that needs a
fresh check) — and found it's materially thinner than the original
"good candidate, expected caveat" assessment suggested.

**What's actually confirmed**, cross-checked across KPMG, PwC,
fiscal-requirements.com, and e-invoice.app (all four independently
agree, which is itself notable): Qatar's Council of Ministers approved
a **draft** e-invoicing law and its executive regulations on **6 May
2026**, prepared by the Ministry of Finance in coordination with the
General Tax Authority (GTA). That is the entire confirmed fact set.
PwC's own words: "no technical or operational specifics have been
officially released, including which e-invoicing model will be
selected." KPMG: "scope of entities and transactions covered,
technical specifications, and implementation timeline are pending."
fiscal-requirements.com: "No specific implementation timelines or
technical specifications were provided." None of the four mentions a
Shura Council referral or the Amir's assent specifically — the
original evaluation's framing on that point was reasoning about
Qatar's general legislative process, not a sourced fact about this
bill.

**One industry source (EDICOM) speculates further** — a Peppol-based
decentralized architecture, a hybrid clearance-for-B2B/B2G plus
reporting-for-B2C model, and a phased rollout beginning 1 January
2027 — but this reads as an informed industry guess rather than
official confirmation, and none of the more conservative Big-4/tax-
specialist sources corroborate any of it. Also worth noting for
context: Qatar has not yet implemented VAT at all, unlike every other
GCC state already on this tracker (Saudi Arabia, UAE, Oman) — the
e-invoicing law is explicitly framed as groundwork for a future VAT
system, not a mandate layered onto an existing one.

**Flagged this to Dan directly** (via `AskUserQuestion`) rather than
either building a full page around the speculative EDICOM version or
silently downgrading it without asking: build a thin, honestly-worded
page now (a single "draft law approved" milestone, explicit about what
remains undisclosed) vs. hold off like Bahrain/Kuwait vs. build using
the speculative model labeled as such. **Dan chose to hold off** — so
Qatar stays unbuilt, joining Bahrain, Kuwait, Iraq, and Lebanon on the
"not concrete enough yet" list, rather than the "reasonable fourth
addition" framing the original evaluation gave it. No migrations, no
static-file changes, nothing to deploy from this session.

**Revisit when**: the executive regulations are published in final
form, a real implementation date is announced, or GTA issues its own
implementation guidance — any of which would move Qatar from "draft
approved" to something with enough real substance for a genuine
deep-dive, the same bar applied to every other country on this
tracker.

### Czech Republic evaluated for a country add (4 August 2026) — a real candidate, not yet built

Dan asked for an assessment of the Czech Republic, one of the ten
still-untracked Europe countries flagged in "Real open work" below.
Live web research (KPMG/EC-factsheet-equivalent sources: Sovos,
dddinvoices, the EC's own eInvoicing country sheet, VATupdate,
expats.cz, fiscal-requirements.com) turned up a genuinely textured
story — thinner on B2B than most tracked Europe countries, but with
one real, dated, and currently-moving-through-Parliament development
that makes this a legitimate candidate rather than a "not yet."

**What's confirmed:**

- **B2G: accept-only, not issue-mandatory, since 1 October 2016.**
  Public contracting authorities above EU procurement thresholds must
  *accept* EN 16931-compliant e-invoices (Act No. 134/2016 Coll.,
  transposing EU Directive 2014/55/EU) via the Národní elektronický
  nástroj (NEN) portal — but suppliers are never required to *issue*
  one. This is the weakest form of B2G mandate this tracker has seen,
  matching the EU's bare minimum rather than a genuine issuance
  requirement (contrast Austria's supplier-side mandate since 2014).
- **No B2B mandate exists, and none is currently proposed** — every
  source checked agrees on this explicitly (dddinvoices: "nor have any
  plans been unveiled").
- **EET 2.0 — a real-time B2C sales-reporting revival, genuinely
  moving through Parliament right now.** The original EET (Electronic
  Registration of Sales, 2016–2020ish, formally repealed 2022/2023)
  required real-time reporting of cash-register sales to the tax
  authority. A new government revived it: draft legislation was
  submitted, and **the Chamber of Deputies has already passed it**
  (expats.cz, confirmed) — it now moves to the Senate, then President
  Petr Pavel for final signature. Confirmed effective date **1
  January 2027**. Scope: in-person B2C sales (cash, card, QR) at
  restaurants, shops, and service providers; small flat-rate-tax
  entrepreneurs under CZK 1,000,000 annual revenue are exempt (or can
  pay a surcharge for exemption). Penalties up to **CZK 500,000**.
  Projected CZK 14–15 billion in additional annual tax revenue.
- **Important scope distinction**: EET 2.0 is real-time *sales/receipt*
  reporting, not a B2B e-invoicing mandate — no structured invoice
  format, no buyer/seller exchange requirement, no clearance model. Same
  shape as Spain's VeriFactu (a real, binding anti-fraud/reporting
  duty that ADDING-A-COUNTRY.md's own guidance says gets
  `mandate_scope: 'none'`, not `'b2b'`), not South Korea's or Turkey's
  invoice-reporting systems.
- **The confirmed EU-wide ViDA floor** (1 July 2030 for cross-border
  intra-EU B2B e-invoicing/digital reporting, national domestic
  deadlines extendable to 2035) applies here the same as every other
  tracked EU member state — not Czech-specific news, but the correct
  long-horizon milestone once built, same as Cyprus's own 2030 entry.

**Comparison to the nearest precedent — Cyprus (country #37).** Cyprus
was built with an even thinner story: just a B2G-receive mandate
(2019/2020), a twice-abandoned B2B-issuance proposal treated as
narrative only (no invented milestone), and the 2030 ViDA floor — 3
milestones total, only 2 on the board. Czech Republic clears that same
bar and adds one genuinely live, currently-in-Parliament development
(EET 2.0) that Cyprus's story never had — arguably a stronger
candidate than Cyprus was at build time, even though its B2B picture
is just as empty.

**Recommendation: build it.** Structure would mirror Cyprus's
precedent — the 2016 B2G-accept milestone (anchor, off-board,
`mandate_scope: 'b2g_only'`), an EET 2.0 milestone dated 1 January
2027 with `confidence: 'expected'` (Senate + presidential signature
still pending) and `mandate_scope: 'none'` (real and binding, but not
an invoicing-mandate-scope fact, per the VeriFactu precedent), and the
2030 ViDA floor. The deep-dive's honest framing: "no B2B e-invoicing
mandate exists or is proposed; the one real, moving development is a
B2C point-of-sale reporting revival, not an invoicing requirement" —
same spirit as Cyprus's own "twice-abandoned mandate" candor. Not yet
built — this was an evaluation only, per Dan's ask; ready to scaffold
whenever he wants to proceed.

### Czech Republic added as country #44 (4 August 2026, code complete, deploy pending)

Dan said "yes please" to the evaluation above — built exactly the
structure recommended there, following the Cyprus (#37) template
since both countries share the same thin-B2B shape, plus the Turkey
(#43) template for milestone/mandate_scope conventions.

**Naming decision.** `name_en = 'Czech Republic'` (the dominant form
across every e-invoicing research source checked — Sovos,
dddinvoices, the EC's own country sheet, VATupdate, expats.cz,
fiscal-requirements.com), not `'Czechia'`. This means
`shared/map-data.mjs` needs a `TOPO_NAME_OVERRIDES` entry
(`"Czech Republic": "Czechia"`) since `vendor/countries-50m.json`
spells the topology shape `"Czechia"` — confirmed via direct Python
inspection of the bundled TopoJSON. Per-language translations verified
against real government sources: German "Tschechien" (Auswärtiges
Amt's own country-page title), Spanish "República Checa"
(exteriores.gob.es's own fact-sheet title), French "République
tchèque" (France Diplomatie's own page title/URL).

- **Migration 306**: country row (`CZ`, `Czech Republic`, region
  `Europe`, slug `czech-republic`, `in_picker=1`) + name translations.
- **Migrations 307-308**: 3 milestones with full translations — the
  2016 B2G-accept mandate (1 Oct 2016, anchor, off-board,
  `mandate_scope: 'b2g_only'` — Act No. 134/2016 Coll., transposing
  Directive 2014/55/EU; confirmed directly against the EC's own
  country page, which fetches cleanly at
  `ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108881/eInvoicing+in+Czech+Republic`
  and confirms the NEN portal is operated by the Ministry of Regional
  Development); EET 2.0 (1 Jan 2027, on-board, `confidence: 'expected'`
  since Senate passage and presidential signature are still pending,
  `mandate_scope: 'none'` — a real-time B2C point-of-sale
  sales-reporting revival, not an invoicing mandate, same VeriFactu-
  style treatment as Turkey's e-Waybill/e-Defter entries; CZK
  1,000,000 small-entrepreneur exemption threshold, CZK 500,000 max
  penalty, CZK 14-15bn projected annual revenue — all confirmed via
  expats.cz, VATupdate, and fiscal-requirements.com); and the 2030
  ViDA floor (on-board, `mandate_scope: 'b2b'`, matching Cyprus/
  Austria/Greece/Netherlands).
- **Migrations 309-310**: full deep-dive page — a compliance-model
  label distinguishing the empty B2B picture from the live EET 2.0
  development, 5 stats (including a "CZK 500,000 — a sales-reporting
  fine, not an invoicing one" stat, deliberately worded to avoid
  conflating the two regimes), 3 `file_format` cards (noting ISDOC as
  the one genuinely Czech format element, alongside EDIFACT/UBL 2.1),
  3 `scope_transmission` cards (network model; what's actually
  mandatory; an EET 2.0-specific card laying out its scope/date/
  exemption/legislative-status), 3 `penalties_related` narrative
  cards (no domestic e-invoicing penalty regime; EET 2.0's penalties
  are real but for sales reporting; the approaching EU floor), 5
  steps, 2 portals (EC factsheet; NEN).
- **Migration 311**: a 2-story arc — EET 2.0 passing the Chamber of
  Deputies (17 July 2026, matching the bill's confirmed public
  passage), and the 2030 ViDA floor applying regardless of domestic
  developments — matching Cyprus's own 2-story count rather than
  padding to a 3-story norm.
- **Migration 312**: tracking sources — NEN (`nen.nipez.cz`), the
  Ministry of Finance (`mfcr.cz`), and the EC's eInvoicing country
  factsheet (EU member state, matching the established pattern).
- **Migration 313**: jurisdiction count 42→43, generated
  programmatically by replaying the full migration chain in-memory and
  regexing every `translations` row containing a bare "42" — caught
  all 40 rows (10 keys × 4 languages) cleanly, same shape as migration
  305's own Turkey sweep.
- **Static files**: `countries.js` (Europe list, inserted alphabetically
  between Cyprus and Denmark), `shared/deep-dive-render.mjs`'s slug map
  (`czech-republic`) and all three `COUNTRY_NAME_TRANSLATIONS`
  dictionaries, `shared/map-data.mjs`'s `TOPO_NAME_OVERRIDES` entry
  described above.
- Checked The Map's two hand-maintained lookup tables per
  ADDING-A-COUNTRY.md's Phase 1 step 6: `TOPO_NAME_OVERRIDES` entry
  added (topology spells it "Czechia"); confirmed via direct
  inspection of the topology's own geometry (`type: Polygon`, one arc
  group — a normal full-size country shape) that no
  `MARKER_LONLAT_OVERRIDES` fallback is needed. Europe's existing
  `REGION_BOUNDS` box already comfortably contains the Czech
  Republic's real extent (~12-19°E, ~48.5-51°N) — no widening needed
  (contrast Turkey, which did need this).
- **Hand-swept the jurisdiction count** across all four languages'
  `i18n/*.json` files (including the separate per-education-page
  translation files) and every static HTML page — 32 files updated,
  confirmed via a stray-"42" grep check restricted to jurisdiction-
  marker context (none found) and a repo-wide grep for any other
  "42 countries/jurisdictions"-style phrasing outside the migrations
  directory (none found).
- Local migration-chain replay (`apply_migrations.py --remote
  --dry-run`, which runs the same in-memory replay validation before
  attempting any live connection) confirms all 313 files validate
  cleanly against the full schema history — "Replay validation OK
  (313 files, only the documented pre-existing errors)." A follow-up
  structural query against the replayed in-memory DB confirmed: Czech
  Republic's country row is correct; exactly 3 milestones with the
  described anchor/on_tracker/confidence/mandate_scope flags and 4
  language translations each; the deep-dive page renders in all 4
  languages with 5 stats, 9 cards (3 per section) and 36 card
  translations, 5 steps and 20 step translations, 2 portals and 8
  portal translations; exactly 2 stories with 8 story translations;
  exactly 3 tracking sources with 12 source translations; total
  `countries` row count is 44 (43 real jurisdictions + the standalone
  EU row), matching the "43" jurisdiction count now swept everywhere.

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass.

**Code complete, deploy pending** — this sandbox has no live
Cloudflare/D1 credentials (confirmed by the same `CLOUDFLARE_API_TOKEN`
error every prior country build has hit). Migrations 306-313 need
`apply_migrations.py --remote` from Dan's own machine, and both
`site-worker` and `members-worker` need `wrangler deploy` to pick up
the static-file changes (`countries.js`, `shared/deep-dive-render.mjs`,
`shared/map-data.mjs`, and the 32 swept `i18n`/HTML files).

## Open items / next steps

### Real open work

1. **Coverage expansion** — Netherlands, Austria, Greece, Cyprus, Oman,
   Jordan, Israel, South Korea, Vietnam, and Turkey are all confirmed
   deployed and tested — every country added this session is now
   live. Czech Republic is code complete, deploy pending (see the 4
   August 2026 entry above). Qatar was evaluated and held back at
   Dan's choice (thinner than first assessed). Still not
   tracked in Europe: Bulgaria,
   Estonia, Hungary, Latvia, Lithuania, Malta, Slovenia, Iceland,
   Liechtenstein. The scaffolder + runner make each addition a
   fraction of the old effort.

   **Middle East coverage evaluated (3 August 2026).** Dan asked for
   an assessment of which additional Middle Eastern countries are
   worth adding, based on real upcoming e-invoicing legislation.
   Currently tracked in this region: Egypt, Saudi Arabia, UAE (3 of
   36). Live web research (not from training-data recall, since this
   space moves fast) turned up six more candidates, ranked by how
   real/dated their legislation is — same bar this project already
   applies elsewhere (a firm in-force mandate outranks a "discussed
   but no timeline" one):

   - **Jordan — strongest candidate.** JoFotara e-invoicing has been
     mandatory since 1 April 2025 (Phase 2), covering B2B, B2G, and
     B2C, with real fines (up to JOD 500) for non-compliance. This is
     as concrete and "live" as Greece was when added — no caveats
     needed.
   - **Israel — strongest candidate.** A real CTC clearance model
     (Israeli Tax Agency, real-time invoice approval + allocation
     number) has been live since May 2024, with a clean, dated,
     already-legislated phase-down of the mandatory-invoice threshold:
     NIS 25,000 (May 2024) → 20,000 (Jan 2025) → 10,000 (Jan 2026) →
     5,000 (Jun 2026). The multi-milestone threshold schedule is
     exactly the shape this tracker's board already handles well.
   - **Oman — strong candidate.** Oman Tax Authority's PINT-OM (Peppol
     5-corner) framework has a genuinely dated, sourced rollout:
     developer portal Feb 2026, service-provider registration May
     2026, first wave (100 largest taxpayers) **August 2026** — i.e.
     imminent — then all large B2B taxpayers by Feb 2027, all
     VAT-registered taxpayers (incl. SMEs) by Aug 2027, B2G by Aug
     2028. Real dates all the way out, similar shape to Saudi Arabia's
     own phased rollout.
   - **Qatar — good candidate, with an "expected" caveat.** Council of
     Ministers approved a draft e-invoicing law and regulations on 6
     May 2026 (General Tax Authority; covers B2B/B2G via clearance,
     B2C via reporting), targeting 1 January 2027 — but it still needs
     Shura Council review and the Amir's assent before enactment. This
     is the same "real, sourced, but not yet law" situation
     `mandate_scope: 'none'`/`confidence: 'expected'` already handles
     for Austria's pending B2B proposal.
   - **Bahrain — not yet, revisit later.** No confirmed mandate or
     dates; the only recent concrete change is the NBR removing its
     prior-approval requirement for voluntary e-invoicing (Nov 2023).
     Government signaled "mandatory e-invoicing" intent back in 2022
     with nothing since — this reads like Cyprus's twice-abandoned-
     mandate pattern, not enough to build a real deep-dive around yet.
   - **Kuwait — not yet, revisit later.** Even less public detail than
     Bahrain; intentions discussed, no formal timeline. Worth a
     periodic recheck, not worth building now.
   - **Iraq, Lebanon — checked, nothing found.** No confirmed mandate
     or credible timeline turned up; not recommended for now.

   **Recommendation**: add Jordan, Israel, and Oman first (all have
   real, dated, sourced milestones — Oman's first wave lands this
   same month, August 2026) via the existing scaffolder + runner
   workflow, each roughly the same effort as Austria/Greece/Cyprus.
   **All three of Oman, Jordan, and Israel are now built** — Oman,
   Jordan, and Israel are all deployed and tested (see the dated
   entries above). **Qatar was re-evaluated on 4 August 2026 when Dan
   asked to add it, and turned out thinner than this original
   "reasonable fourth addition" framing suggested** — see that dated
   entry for the fresh findings; Dan chose to hold off building it, so
   it now sits alongside Bahrain, Kuwait, Iraq, and Lebanon on the
   "not concrete enough yet" list rather than being built. Revisit this
   evaluation every few months rather than re-researching from scratch,
   since this space (especially Qatar) is moving quickly.

   **Follow-up recheck (3 Aug 2026, later the same day):** Dan asked
   which Middle East country to roll out next, now that Oman/Jordan
   (deployed) and Israel (code complete) are all built. Live re-check
   of Bahrain, Kuwait, Iraq, Lebanon, and Qatar found nothing materially
   changed from the assessment above — all four "not yet" countries
   are still stuck at proposal/discussion stage with no confirmed
   dates, and Qatar's law is still Cabinet-approved-but-unenacted
   (still needs Shura Council review + the Amir's assent). One genuine
   new find, not covered in the original evaluation: **Turkey**. e-Fatura
   has been mandatory since 1 April 2014 (companies over TRY 5 million
   turnover, plus several sectors regardless of size), making it more
   mature than every country built this session except South Korea —
   and it's still actively evolving: the general threshold is TRY 3
   million for 2026, a lower TRY 500,000 threshold applies to
   e-commerce/real estate/motor-vehicle/accommodation sectors, and a 1
   January 2026 change removed the prior monetary floor for mandatory
   e-Archive issuance entirely. B2B, B2G, and B2C are all in scope.
   This is the strongest actual candidate right now — stronger than
   Qatar, since it's enacted and in force rather than pending
   legislative steps. One open question before building it: Turkey is
   transcontinental and this tracker's existing "Middle East" region
   (Egypt, Israel, Jordan, Oman, Saudi Arabia, UAE) is MENA-flavored —
   worth confirming with Dan whether Turkey belongs in Middle East, a
   new region, or Europe, before scaffolding it.

   **Asia-Pacific coverage evaluated (3 August 2026).** Dan asked for
   an assessment of the best Asia-Pacific country to add next.
   Currently tracked in this region: Australia, China, India, Malaysia,
   New Zealand, Singapore (6 of 40). Live web research turned up seven
   more candidates, ranked the same way as the Middle East evaluation
   above — a firm in-force mandate outranks a dated-but-future one,
   which outranks a still-draft proposal:

   - **South Korea — strongest candidate, no caveats needed.** The
     e-Tax Invoice system has been mandatory for all corporations
     since **January 2011** — 15 years in force — with individual
     entrepreneurs phased in progressively (current threshold: KRW 80
     million in prior-year supply, since July 2024). Real-time
     next-day reporting to NTS Hometax, XML format with PKI digital
     signatures, and a genuinely graduated penalty schedule (2% of
     supply value for non-issuance, down to 0.3-0.5% for delayed
     transmission, capped at KRW 50-100 million except for intentional
     violations). This is the single most mature, best-documented
     mandate of any candidate found in this evaluation — more settled
     than Jordan was when added.
   - **Vietnam — strong candidate.** E-invoicing has been mandatory
     nationwide since **1 July 2022** (paper invoices ceased to be
     valid), covering B2B, B2C retail, and exports, via a dual
     real-time-clearance/post-audit model reporting same-day to the
     General Department of Taxation. Recently reinforced rather than
     relaxed: Decree 70/2025 (effective June 2025) extended scope to
     foreign digital suppliers and mandated connected POS invoicing
     for retail. Fully in force, not a future date.
   - **Taiwan — strong candidate.** The eGUI system has been mandatory
     for all foreign and domestic companies since **January 2021**,
     with a format migration already underway (MIG 4.0 available since
     Jan 2024; older MIG 3.1/3.2 sunset 31 December 2025). Invoices
     transmit to the Ministry of Finance's platform within 7 days of
     delivery. In force ~5 years, actively evolving.
   - **Pakistan — strong candidate, with a caveat on schedule
     stability.** Verified directly against the government's own SRO
     69(I)/2025 and SRO 1852(I)/2025 (Federal Board of Revenue, PDF
     confirmed at download1.fbr.gov.pk) — this is enacted law under
     the Sales Tax Act 1990, not a proposal. Phased rollout completed
     by 31 December 2025 (large enterprises/importers 1 Nov 2025 →
     mid-sized 15 Nov → smaller 1 Dec → all remaining registered
     persons 31 Dec), with broader enforcement from January 2026 and
     penalties escalating PKR 500,000 → 3,000,000 for repeat
     violations. The caveat: multiple compliance guides note FBR has
     extended these category deadlines more than once already, so the
     exact per-category dates should be reconfirmed against the
     current FBR portal before finalizing milestone dates, not just
     the SROs as first issued.
   - **Indonesia — strong candidate.** Coretax e-invoicing became
     mandatory for all VAT-registered taxpayers (PKP) on **31 December
     2025**, with XML submitted to the tax authority (DJP) for
     clearance into QR-coded PDFs. Large taxpayers may continue on
     e-Faktur Desktop/H2H; everyone else uses the Coretax portal. Real
     penalties: non-creditable VAT, IDR 500,000 late-filing fines, and
     misreporting penalties up to 100%.
   - **Philippines — real, dated, but not yet in force.** The BIR's
     EIS mandate for structured e-invoicing (PDFs no longer qualify)
     has already had one deadline extension — from March 2026 to
     **31 December 2026** (Revenue Regulations No. 26-2025) — covering
     large taxpayers, e-commerce businesses, exporters, and POS users.
     Similar shape to Oman when it was evaluated: real and dated, but
     the wave hasn't landed yet, and it's already slipped once.
   - **Sri Lanka — not yet, revisit later.** Only a pilot phase with
     API-ready ERP taxpayers is underway, aimed at full pilot
     deployment by end of 2025 before any broader mandatory phase;
     no confirmed date yet for VAT-registered entities generally. Reads
     like Qatar's "real direction, no firm law yet" situation, not
     Jordan's "already enforced" one.
   - **Japan — checked, not a real e-invoicing mandate.** The
     Qualified Invoice System (effective October 2023) governs
     input-tax-credit eligibility, not invoicing format — Japan
     explicitly has no obligation to issue e-invoices, and JP PINT/
     Peppol is a recommended standard for a decentralized 4-corner
     exchange, not a requirement. No clearance, no e-reporting. Worth
     knowing about but not a mandate to build a deep-dive around.

   **Recommendation**: add **South Korea** first — it's the most
   mature, most concretely documented mandate of any candidate here,
   with none of the "deadline already slipped" or "still a proposal"
   caveats attached to Pakistan or the Philippines. Vietnam and Taiwan
   are both strong, already-in-force second and third additions with
   the same "no caveats" character. Pakistan and Indonesia are real
   and dated but newer and, in Pakistan's case, worth reconfirming
   exact per-category dates against the live FBR portal before writing
   migrations. Philippines is worth adding once its December 2026
   deadline gets closer, following the same logic that put Oman ahead
   of Qatar. Hold off on Sri Lanka until it has a confirmed mandatory
   date beyond the pilot, and skip Japan — there's no real invoicing
   mandate there to document.
   **South Korea and Vietnam are now both built** — both code complete
   with deploy pending (see the dated entries above). Taiwan remains
   the strongest next candidate from this same evaluation whenever
   coverage expands further into Asia-Pacific.
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
5. ~~**"The Map" — an interactive visual map under Resources**~~ —
   **done and deployed 3 Aug 2026** (all eight rounds; see the dated
   entries above). Kept below for the design-research trail.

   Two competitor references evaluated (3 August 2026):

   **Pagero/Thomson Reuters "Regulatory Atlas"**
   (europe.thomsonreuters.com/uk/compliance/regulatory-updates) —
   turns out to be less a literal map and more a country directory
   combined with a rolling ticker of recent regulatory headlines
   ("Cambodia expands...", "Greece submits draft legislation...").

   **Basware's "Global e-Invoicing Compliance Map"**
   (basware.com/en/compliance-map) — described as literal hover/click
   per-country interaction, but fetching the real page revealed the
   actual underlying content: a plain continent-grouped list of
   country links (Africa/Asia/Europe/North America/Oceania/South
   America → alphabetical countries → per-country page), almost
   certainly the accessible/crawlable fallback sitting behind a
   decorative visual map layer. Basware's Europe list alone has 31
   countries, several not yet on this tracker (Albania, Andorra,
   Bulgaria, Czech Republic, Estonia, Hungary, Iceland, Latvia,
   Liechtenstein, Malta, Serbia, Slovenia, Switzerland) — a coverage
   consideration for item 1 more than a map-design one.

   **The real finding**: the substance behind both competitors' "maps"
   is the same region-grouped directory structure this site already
   has (Deep Dives flyout, subscribe picker, sidebar nav). The map
   graphic is a decorative front door on an information architecture
   that's essentially already built — this reframes the feature from
   "build new navigation" to "build one visual entry point in front
   of navigation that already exists."

   **A working prototype was built and tested** (not just described) —
   a real D3 + topojson choropleth using genuine world-atlas topology
   (never hand-drawn/invented coordinates), Europe-zoomed since 21 of
   36 tracked countries are there, colored using the tracker board's
   own existing status language (in force / upcoming / tracked) rather
   than a new scheme. One concrete, non-theoretical finding from
   building it: small countries (Luxembourg, Cyprus, Malta) are
   genuinely hard to see and click at this scale — a real trade-off,
   not a hypothetical one. A true equal-weight cartogram would solve
   this but isn't buildable without inventing coordinates, which the
   visual-design system rules explicitly forbid.

   **Recommended direction**:
   - Europe-focused map as the visual front door, not a full world map
     (would be mostly empty ocean given the real regional split:
     Europe 21, Asia-Pacific 6, Americas 6, Middle East 3)
   - Non-European regions and mobile viewports fall back to a
     region-grouped list — not a compromise, but literally what both
     competitors' own real content reduces to
   - Reuse the board's existing status categories for map coloring,
     not a new "urgency" concept
   - Click behavior reuses the existing in-page deep-dive panel —
     no new interaction pattern needed
   - One real architectural decision to make deliberately: this would
     be the site's first use of an external JS library (D3 + topojson
     via CDN) — everything else today is hand-written vanilla JS

   **Third competitor reference evaluated (3 August 2026): Esker**
   (cloud.esker.com/fm/einvoicing-compliance-map/) — genuinely
   different from Pagero and Basware, and worth learning from on two
   fronts, one good and one cautionary:

   - *Good*: a search result surfaced Esker's own old source code
     directly, revealing the real data model underneath — a small set
     of standardized dimensions applied uniformly to every country
     (mandate status in ~2 tiers, buyer-consent requirement in 3
     tiers, e-signature/integrity-proof method in 3 tiers, storage-
     abroad rules), not free-form prose per country. The live page
     confirms this further: it offers multiple selectable color-coding
     dimensions ("E-invoicing system" and "Market maturity" both
     toggle the map's coloring), plus region filter buttons — a
     genuinely richer interaction model than either Pagero or Basware.
     If a future version of the map wanted to go beyond a single
     status color, this structured-dimension approach is the right
     shape to borrow, since the underlying D1 schema (milestone
     confidence tiers, dates, country regions) is already reasonably
     structured itself.
   - *Cautionary*: unlike Basware, fetching Esker's live page returned
     almost no crawlable content — everything lives behind the
     interactive JS map, with no accessible/indexable fallback list at
     all. A concrete anti-pattern to avoid: whatever gets built here,
     the existing region-grouped directory (Deep Dives flyout,
     sidebar, subscribe picker) should stay real, crawlable content in
     its own right — the map should sit as a decorative layer in front
     of it, never as a replacement that hides the underlying
     navigation from anyone without JS or from search engines.

   **Fourth competitor reference evaluated (3 August 2026): Tungsten
   Automation (InvoiceAgility)**
   (tungstenautomation.com/products/invoiceagility/invoicing-compliance/country-updates)
   — same no-crawlable-content anti-pattern as Esker, more pronounced:
   fetching the index page returned almost nothing about the map
   itself, dominated instead by a lead-generation contact form's
   country/state dropdowns (a flat alphabetical list of every country
   on earth, unrelated to the actual compliance content) plus a
   "please try a different browser" notice — the real interactive map
   needs specific browser support this fetch never got past.

   The individual country pages are a different story, though, and
   genuinely worth learning from independent of the map question: a
   Belgium page snippet showed the richest per-country data model of
   all four competitors evaluated — VAT rate and currency, e-signature
   guidance, tax authority name, archiving periods split *by asset
   type* (movable property: 10yr, immovable: 15yr, real estate
   construction: 25yr), and clean before/after tables for issuance,
   reception, and format requirements each split by date threshold.
   This is closer to a possible future enrichment idea for the
   existing deep-dive pages (which don't currently carry VAT rate or
   asset-type-specific archiving detail) than to the map feature
   itself — worth keeping in mind as a separate thread, not folded
   into this item.

   Rough effort once the direction is confirmed: half a day to a day —
   the map itself is the easy part; the real work is the mobile
   fallback and wiring status colors to live D1 data correctly. Still
   at the "evaluating references" stage — no build started.

   **Full build completed, prepared for deploy (3 August 2026).**
   Following two mock-up rounds (region tabs, sidebar-flex, language
   switching, all verified against real d3/topojson rendering) and an
   explicit go-ahead to do the real build, this shipped as:

   - **`mandate_scope` added to `milestones`** (migration 254; NOT
     NULL, default `'b2b'`) — `'b2b'` / `'b2g_only'` / `'none'` per
     milestone, replacing the mock-up's one-time manual free-text
     reclassification pass with a real, durable D1 field. Migration
     255 backfills every current `on_tracker` milestone (97 rows)
     explicitly, with a full per-country audit trail in that file's
     header. `ADDING-A-COUNTRY.md` (Phase 1 step 2) and
     `CONTENT-MONITORING.md` (the update workflow) both now require
     re-checking this field whenever milestone data changes, and
     `new_country_scaffold.py` requires it in the spec and validates
     its value — the "keep this updated as mandates evolve" half of
     the request, not just the one-time schema addition.
   - **`shared/map-data.mjs`** — `computeCountryMapStatus()` (the live
     equivalent of the mock-up's hand-curated status dict; verified to
     reproduce all 31 previously-known statuses exactly, with one
     deliberate divergence documented inline for the United States)
     and `getMapCountries(db, lang)`, which also retires the mock-up's
     separate `COUNTRY_TRANSLATIONS` dictionary in favor of D1's real
     `country_translations` table.
   - **A genuinely new discovery during verification**: replaying
     migrations 254/255 against a full local in-memory copy of the
     schema + every migration file (`apply_migrations.py`'s own
     `validate_replay()`, run directly, no wrangler/network needed)
     surfaced that Austria, Cyprus, Egypt, Greece, and the Netherlands
     — all added to D1 *after* `202_tracker_backfill.sql` was written —
     have real `on_tracker` milestone data the original 79-id audit
     never saw, and would otherwise have kept the column's `'b2b'`
     default. Classified all five properly; two (Egypt, Greece) turn
     out to already have a real, firm, in-force domestic B2B mandate —
     genuinely more accurate than the mock-up's stale "tracked (no
     data yet)" placeholder for them, which is exactly what a live
     D1-rendered map is supposed to deliver over a hand-maintained
     snapshot. The same replay first caught a more serious modeling
     bug: `computeCountryMapStatus` was initially fed *every* milestone
     row per country, not just `on_tracker = 1` ones, which silently
     forced nearly every country to "inforce" via long-past-dated
     `on_tracker = 0` anchor rows sitting at the schema default —
     fixed by filtering `getMapCountries`'s query to `on_tracker = 1`,
     matching the board's own population.
   - **`/map`** (`site-worker/src/index.js`) — a real, live D1-rendered,
     crawlable page (plain `<a href>` sidebar links, no JS-only
     navigation — the anti-pattern flagged from Esker/Tungsten above),
     following the exact `/sources` pattern for language/cookie
     handling. `/map-data.json?lang=xx` serves the same per-language
     country array for the page's own EN/ES/DE/FR switch.
   - **`map-panel.js`** — the mock-up's D3/topojson rendering, region
     tabs, and sidebar-flex logic, ported into a single reusable
     `EICCMap.init(rootEl, opts)` usable against either `document`
     (the standalone page) or a `ShadowRoot`. d3, topojson-client, and
     the world-atlas 50m topology are real static files under
     `vendor/`, not re-inlined per request like the mock-up.
   - **The tracker's in-page map panel** (`openMapPage()` /
     `closeMapPage()`, a new Resources → "The Map" menu item) — the
     exact same fetch-and-shadow-scope pattern as `/sources`'s panel,
     with `map-panel.js` lazily loaded on first open (not in `<head>`,
     to avoid weighing down every tracker page view for a feature most
     visitors won't open) and called directly against the shadow root
     — the fetched page's own inline bootstrap script is discarded
     the way every in-page panel's is. Clicking a country calls the
     existing `openDeepDive(slug)` directly, per the explicit decision
     to reuse the existing in-page deep-dive panel rather than a new
     tab or a bespoke standalone page.
   - **Deployed and confirmed live** later the same session: migrations
     254/255 applied, both Workers deployed, `/map-data.json?lang=en`
     checked live showing 36 countries with correct statuses. Rounds
     4-7's subsequent UI fixes (site-worker-only, no further
     migrations) were deployed via a follow-up `wrangler deploy` on 3
     Aug 2026.

### Dormant until decided

- Ending the ARCHIVE_PUBLIC promo (one variable flip in
  members-worker's wrangler.toml + the coming-soon treatment notes in
  the tracker's Resources comment).
- Re-hooking Lemon Squeezy if/when a paid tier returns.
