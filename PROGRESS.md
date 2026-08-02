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

### Luxembourg added (code complete, deploy pending)

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

### Resources menu + temporary open newsletter archive (code complete, deploy pending)

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

### Language cookie bug fix + deep-dive header portal link (2 August 2026, code complete, deploy pending)

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

### Sidebar simplified to a plain country list (2 August 2026, code complete, deploy pending)

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

### Education menu pages now open in-page too (2 August 2026, code complete, deploy pending)

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

### Topbar menus now collapse properly (2 August 2026, code complete, deploy pending)

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

### Feedback page now opens in-page too (2 August 2026, code complete, deploy pending)

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

### Subscribe went live, free-only, no Lemon Squeezy (2 August 2026, code complete, deploy pending)

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

---

## Open items / next steps

### Resources menu + open archive: redeploy (code is done, only the ship step remains)

From your own machine (this sandbox can't reach the Cloudflare API):

```
cd members-worker
wrangler deploy

cd ../site-worker
wrangler deploy
```

Then spot-check: the tracker's topbar shows "Resources" (not "Deep
Dives") as a top-level button, and clicking it now actually pops the
Deep Dives flyout out beside it (this was broken until the
`overflow:visible` fix above — worth specifically re-checking after
deploy); a "Newsletter archive" link also appears in Resources and
opens the archive list right there in the main frame, sidebar still
visible, with search/the edition filter/country checkboxes all working
against it; clicking an individual issue still opens the full
standalone issue page normally; the embedded view shows the free-
access promo banner (this cross-origin fetch never carries a session
cookie, so it always renders anonymous, even if you're separately
logged in in another tab — that's expected); and visiting
`/members/archive` directly while genuinely logged in still shows the
normal signed-in view with no promo banner.

### Luxembourg: run migrations + redeploy (highest priority — code is done, only the ship step remains)

From your own machine (this sandbox can't reach the Cloudflare API):

```
cd members-worker
wrangler d1 execute eicc-content --remote --file=migrations/191_luxembourg_country.sql
wrangler d1 execute eicc-content --remote --file=migrations/192_luxembourg_milestones.sql
wrangler d1 execute eicc-content --remote --file=migrations/193_luxembourg_deepdive_content.sql
wrangler d1 execute eicc-content --remote --file=migrations/194_luxembourg_milestone_translations.sql
wrangler d1 execute eicc-content --remote --file=migrations/195_luxembourg_deepdive_translations.sql
wrangler d1 execute eicc-content --remote --file=migrations/196_luxembourg_story.sql
wrangler d1 execute eicc-content --remote --file=migrations/197_luxembourg_story_translations.sql
wrangler deploy

cd ../site-worker
wrangler deploy
```

Then spot-check: `/luxembourg` and `/luxembourg?lang=fr` on the public
site render the deep-dive page; the tracker shows Luxembourg's 4
timeline entries and it appears in the sidebar/region filter; the
members-site preferences and archive pages show Luxembourg with correct
translated names in all 4 languages; the subscribe page's country picker
includes Luxembourg; and the "32" jurisdiction counts render correctly
on the tracker, subscribe, and education pages.

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
- Resources menu reorganization: Deep Dives has been moved under it
  (see "Resources menu + temporary open newsletter archive" above,
  deploy pending) — still open: a published list of accredited
  sources, and a vendor-assessment RFI template, both as further
  Resources menu items

### Smaller pending items
- Subscribe is now live and free-only (see "Subscribe went live"
  above) — Lemon Squeezy is deliberately disconnected, not just
  pending "Copy to Live Mode." If/when a paid plan is introduced, that
  Lemon Squeezy setup work (still described in the archived HTML
  comments this session's commit replaced — see git history around
  this date) will need doing then.
- Cloudflare Web Analytics not yet set up
- Content-monitoring Worker (designed in `CONTENT-MONITORING.md`, never
  built)
- Translation frameworks for other static site pages and deep-dive pages
  more broadly (separate from the Stage 4 dynamic-architecture effort)
