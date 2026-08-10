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
- Repo: **as of 5 August 2026, migrated to
  `https://github.com/einvoicingcompliancecorner/E-InvoicingComplianceCorner`**
  (`main` branch) — the full commit history was pushed there via a git
  bundle from Dan's machine (see the Hungary/repo-migration entry
  below for why: this sandbox's git proxy blocks pushes to any repo
  outside its own authorized set, unrelated to which account owns the
  repo). The old `danielyoung76/E-InvoicingComplianceCorner` location
  is no longer the canonical one — a new session should clone from the
  `einvoicingcompliancecorner` org going forward and ask Dan for a
  fresh PAT scoped to it if push access is needed from inside a
  sandbox (which, per the note below, won't actually work from this
  sandbox regardless of the PAT's validity).

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

### Czech Republic added as country #44 (4 August 2026, deployed & tested)

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

**Deployed and tested** (confirmed by Dan): migrations 306-313 applied
via `apply_migrations.py --remote`, both `site-worker` and
`members-worker` redeployed to pick up the static-file changes
(`countries.js`, `shared/deep-dive-render.mjs`, `shared/map-data.mjs`,
and the 32 swept `i18n`/HTML files). Czech Republic is live on the
tracker board (Europe, between Cyprus and Denmark), and the
jurisdiction count reads correctly at 43.

### Americas coverage evaluated (4 August 2026) — not yet built

Dan asked for an assessment of countries to add in the Americas,
alongside Brazil/Canada/Chile/Mexico/Peru/United States already
tracked. Live web research across 11 untracked Latin American
jurisdictions (Argentina, Colombia, Uruguay, Costa Rica, Ecuador,
Dominican Republic, Guatemala, Paraguay, Bolivia, Panama, El
Salvador) — same fresh-sourcing discipline as every prior evaluation
this session, no claim taken from training-data recall.

**Tier 1 — no-caveats mandates, build-ready now:**

- **Argentina** — full mandatory B2B/B2G e-invoicing (Factura
  Electrónica) via AFIP/ARCA's clearance model, essentially universal
  since 2019 (phased rollout completed; monotributistas swept in by
  2019 too). As mature and thoroughly documented as Jordan or South
  Korea were at build time — genuinely a "no-caveats" candidate.
- **Colombia** — DIAN's clearance-model mandate (Factura Electrónica),
  phased rollout completed years ago, now essentially universal
  across all taxpayer segments including the final small-taxpayer
  waves. Same tier as Argentina: mature, binding, well-documented,
  nothing pending or proposed-only about it.

**Tier 2 — equally strong, each with a genuinely live 2025/2026
anchor story:**

- **Uruguay** — CFE (Comprobante Fiscal Electrónico) mandate, one of
  the earliest and most complete e-invoicing regimes in the region
  (DGI-run, dating back over a decade), with the final small-taxpayer
  inclusion waves confirmed complete.
- **Costa Rica** — Factura Electrónica mandate (Hacienda/DGT-run),
  universal since 2018, with a confirmed v4.4 technical-format update
  currently rolling out — a real, dated 2025/2026 development to
  anchor a milestone on, same shape as the live developments that
  made South Korea and Vietnam strong candidates.
- **Ecuador** — SRI's mandatory e-invoicing regime, essentially
  universal, with confirmed newer-taxpayer-segment inclusion waves
  completed in 2025 — another genuinely live, dated anchor.

**Tier 3 — real, "Oman-shaped" phased rollouts (concrete dated waves,
not yet fully universal, but not proposal-only either):**

- **Dominican Republic** — e-CF mandate under Law 32-23, phased
  taxpayer-segment rollout with confirmed dated waves running through
  2026-2027, DGII-run. Same phased-rollout narrative shape this
  tracker already handles well for Oman.
- **Guatemala** — FEL (Factura Electrónica en Línea) mandate, SAT-run,
  phased rollout largely complete with confirmed remaining segment
  deadlines.
- **Paraguay** — SIFEN mandate, phased rollout with confirmed dated
  taxpayer-segment waves continuing into 2025-2026, still mid-rollout
  rather than fully universal.
- **Bolivia** — SIN's Facturación Electrónica mandate, phased rollout
  with confirmed dated segment waves, mid-rollout.

**Tier 4 — thinner, checked but not prioritized:**

- **Panama** — SFEP voluntary/mandatory-by-segment regime, DGI-run,
  real but less cleanly universal than the Tier 1-3 candidates.
- **El Salvador** — DTE mandate, Ministerio de Hacienda-run, phased
  rollout underway but with a less mature documentation trail than
  the others checked.

**Recommendation: Argentina and Colombia first** — both clear the same
"no-caveats, fully universal, mature" bar Jordan and South Korea
cleared at build time. Uruguay, Costa Rica, and Ecuador are equally
strong second-tier candidates, each anchored by a genuinely live
2025/2026 development. Dominican Republic, Guatemala, Paraguay, and
Bolivia all have the "Oman-shaped" phased-rollout narrative this
tracker already handles well, if Dan wants to build several Americas
countries in one pass. **Both Argentina and Colombia are now built —
see the dated entries below.**

### Argentina added as country #45 (4 August 2026, deployed & tested)

Dan said "Please start with Argentina" in response to the evaluation
above — built exactly the structure recommended there. Argentina is
this tracker's most mature Americas mandate and one of the most
mature mandates of any country built this session: a real-time CAE
clearance model in force since 2015, universal since 2019, and still
receiving genuine substantive updates through 2026 — closer in shape
to South Korea or Turkey (long-settled but actively evolving) than to
any of the thinner recent additions (Cyprus, Czech Republic).

**4 milestones**, live-researched against Sovos, VATupdate, Cedalio,
sharedserviceslink, vatcalc, Basware, and — critically — Argentina's
own official sources: `argentina.gob.ar`'s normativa pages, AFIP's own
`biblioteca.afip.gob.ar` legal-text library, and the Boletín Oficial
(`boletinoficial.gob.ar`) for the two most recent resolutions:

- **RG 3749/2015** (10 March 2015, anchor, off-board,
  `mandate_scope: 'b2b'`) — mandatory e-invoicing for VAT-registered
  and VAT-exempt taxpayers, building on the voluntary system Argentina
  ran since 2003.
- **RG 4290/2018** (1 April 2019, on-board, `mandate_scope: 'b2b'`) —
  the mandate goes universal: every monotributista and every
  final-consumer sale included, with mobile-app invoicing required at
  the customer's premises. This is the headline "no-caveats, fully
  universal" milestone that put Argentina at the top of the Americas
  evaluation.
- **RG 5616/2024** (effective 15 April 2025, on-board,
  `mandate_scope: 'none'` — a format/disclosure upgrade to the
  existing clearance model, not a new invoicing-scope fact, same
  VeriFactu-style treatment used for Turkey/Czech Republic) — updated
  web services, itemized VAT by rate, and foreign-currency exchange
  rate disclosure become mandatory.
- **RG 5824/2026** (effective 1 July 2026, on-board,
  `mandate_scope: 'b2b'`) — sector expansion (financial entities,
  insurers, credit-card administrators, prepaid health plans,
  educational institutions) plus a new consolidated monthly invoicing
  option and an ARS 10 million consumer-identification threshold.
  Secondary sources gave conflicting detail on exactly which entity
  types were "newly obligated" vs. merely newly eligible for the
  monthly consolidation option (sharedserviceslink and Basware even
  disagreed on the effective date, citing 2027 for part of the
  rollout) — resolved by trusting the three most detailed, most
  recent sources (cpcef.org.ar, vatabout.com, andigital.com.ar, all
  from February 2026) and the official Boletín Oficial citation over
  the older/thinner summaries, and by writing the milestone's
  description to state only the well-corroborated core facts rather
  than the contested specifics.
- Deliberately **not** built as a milestone: a "1 July 2027" further
  sector-expansion date that appeared in two of the ten-plus sources
  checked (sharedserviceslink, Basware) but in none of the three
  freshest, most detailed sources — treated as likely stale or
  conflated with something else rather than included on the strength
  of two older citations.

**Deep-dive content** — 5 stats, 9 cards (3 per section), a genuine
2-row penalty table (Argentina backs its mandate with a real closure
sanction — 2-6 days under Ley 11.683 Art. 40, doubling on repeat
within 2 years — a materially harder consequence than the fixed
monetary fines most tracked countries use; plus VAT-credit/deduction
rejection for a buyer holding an invoice without a valid CAE), 5
steps, 2 portals. Compliance-model framing: "real-time CAE clearance,
universal since 2019 -- one of the world's longest-running
e-invoicing mandates, still actively evolving" — deliberately not
treated as a "done" country the way a thinner recent addition would
be, since the mandate has picked up a substantive update almost every
year since 2019 (2024's AFIP→ARCA rebrand, 2025's RG 5616 technical
upgrade and RG 5705 "IVA Simple" pre-filled VAT returns, 2026's RG
5824 sector expansion).

- **Migration 314**: country row (`AR`, `Argentina`, region
  `Americas`, slug `argentina`, `in_picker=1`) + name translations
  (`Argentina`/`Argentina`/`Argentinien`/`Argentine`).
- **Migrations 315-316**: the 4 milestones above with full
  translations (315 generated by the scaffolder for English; 316
  hand-translated ES/DE/FR, renumbered up from `drafts/` per the
  translate-before-applying discipline).
- **Migrations 317-318**: full deep-dive page, all 4 languages.
- **Migration 319**: a 2-story arc spanning 9 months — "IVA Simple"
  pre-filled VAT returns (10 Nov 2025) and the RG 5824/2026 sector
  expansion taking effect (1 Jul 2026) — matching the Netherlands'
  221-222 multi-story-arc pattern for a country with an active,
  ongoing policy story rather than one settled event.
- **Migration 320**: tracking sources — ARCA's e-invoicing service
  pages (still on the `afip.gob.ar` domain post-rebrand) and ARCA's
  own institutional portal (`arca.gob.ar`). Argentina is not an EU
  member, so no EC factsheet entry (unlike every European addition
  this session).
- **Migration 321**: jurisdiction count 43→44, generated
  programmatically by regex-diffing migration 313's own Czech
  Republic sweep (replacing every bare "43" with "44" across the same
  40 `translations` rows) rather than re-deriving the sweep from
  scratch — caught all 40 rows cleanly.
- **Static files**: `countries.js` (Americas list, Argentina inserted
  first alphabetically), `shared/deep-dive-render.mjs`'s slug map
  (`argentina`) and all three `COUNTRY_NAME_TRANSLATIONS`
  dictionaries.
- Checked The Map's two hand-maintained lookup tables per
  ADDING-A-COUNTRY.md's Phase 1 step 6: confirmed via direct Python
  inspection of the bundled topology (`vendor/countries-50m.json`)
  that it already spells the country `"Argentina"`, exactly matching
  `name_en` — no `TOPO_NAME_OVERRIDES` entry needed. Argentina is a
  normal full-size `MultiPolygon` shape, so no
  `MARKER_LONLAT_OVERRIDES` fallback is needed either. The Americas
  `REGION_BOUNDS` box (`-173` to `-33` lon, `-57` to `75` lat) already
  comfortably contains Argentina's real extent — no widening needed.
- **Hand-swept the jurisdiction count** across all four languages'
  `i18n/*.json` files and every static HTML page — 32 files, 58
  replacements, via a word-boundary regex with a negative lookahead
  for `%` (education-mandate-types.html has an unrelated CSS
  `flex:0 0 43%` that the sweep correctly left untouched — confirmed
  by name in the script output rather than assumed). Repo-wide grep
  for any other "43 countries/jurisdictions"-style phrasing outside
  the migrations directory found none.
- Local migration-chain replay (`apply_migrations.py --remote
  --dry-run`) confirms all 321 files validate cleanly against the
  full schema history — "Replay validation OK (321 files, only the
  documented pre-existing errors)." A follow-up structural query
  against the replayed in-memory DB (reusing `apply_migrations.py`'s
  own `validate_replay()` connection rather than re-parsing SQL by
  hand) confirmed: Argentina's country row is correct; exactly 4
  milestones with the described anchor/on_tracker/mandate_scope flags
  and 4 language translations each; the deep-dive page renders in all
  4 languages with 5 stats, 9 cards (3 per section) and 36 card
  translations, 2 penalty rows and 8 penalty-row translations, 5
  steps and 20 step translations, 2 portals and 8 portal
  translations; exactly 2 stories with 8 story translations; exactly
  2 tracking sources with 8 source translations; total `countries`
  row count is 45 (44 real jurisdictions + the standalone EU row),
  matching the "44" jurisdiction count now swept everywhere.

Final audit against the full ADDING-A-COUNTRY.md checklist: all items
pass.

**Deployed and tested** (confirmed by Dan): migrations 314-321 applied
via `apply_migrations.py --remote`, both `site-worker` and
`members-worker` redeployed to pick up the static-file changes
(`countries.js`, `shared/deep-dive-render.mjs`, and the 32 swept
`i18n`/HTML files). Argentina is live on the tracker board (Americas,
first alphabetically), and the jurisdiction count reads correctly at
44.

### Colombia added as country #46 (4 August 2026, deployed & tested)

Dan said "Please proceed to Colombia rollout next" in response to the
Americas evaluation above, which had flagged Colombia (alongside
Argentina, already built) as a "no-caveats" top candidate. Colombia's
DIAN operates one of Latin America's oldest and most complete CTC
mandates: a real-time CUFE clearance model that has been universal
since November 2020, steadily broadened into new document types since
(equivalent documents, 2023-2024), and still receiving genuine
procedural refinements through April 2026.

**4 milestones**, live-researched against DIAN's own normativa pages
(`dian.gov.co`, `micrositios.dian.gov.co`), EDICOM, Comarch,
fiscal-requirements.com, misfacturas.com.co, KPMG Colombia tax-news
flashes, and several Colombian accounting/compliance blogs (Loggro,
Sovos, actualicese.com, llbsolutions.com, numrot.com): Resolution
000010/2018 (6 Feb 2018, effective 1 Sep 2018, anchor/off-board,
`mandate_scope: 'b2b'` — the first mandatory wave, large taxpayers),
Resolution 000042/2020 (5 May 2020, final wave 1 Nov 2020, on-board,
`mandate_scope: 'b2b'` — the "goes universal" milestone, covering every
VAT/INC-responsible business), Resolution 000165/2023 + 000008/2024
(rollout completed 1 Nov 2024, on-board, `mandate_scope: 'none'` —
"documentos equivalentes electrónicos" for POS receipts, utility
bills, and transport/airline tickets; a document-type expansion rather
than a B2B invoicing-scope change, the same treatment as Argentina's
RG 5616/2024 format upgrade), and Resolution 000202/2025 (31 Mar 2025,
on-board, `mandate_scope: 'none'` — streamlined B2C buyer-data capture
plus a 48-hour rural transmission window, a procedural refinement of
the already-universal mandate). Deliberately did **not** build a
milestone for Resolution 000227/2025 (23 Sep 2025) — DIAN's own
consolidation of e-invoicing rules alongside 60+ other tax resolutions
into one unified text is explicitly administrative ("no es una reforma
que cambie las reglas de forma radical"), not a substantive change, so
it's covered in the deep-dive narrative and a news story instead of as
a milestone. Also deliberately did not build a milestone for
Resolution 000011/2026's regularization mechanism, for the same
reason — it's an enforcement/remediation tool, not a change to who
must invoice or when, so it became this build's second story instead.

- **Migration 322**: country row (`CO`, `Colombia`, region `Americas`,
  slug `colombia`, `in_picker=1`) + name translations.
- **Migrations 323-324**: the 4 milestones with full translations.
- **Migrations 325-326**: full deep-dive content across 4 languages —
  5 stats, 9 cards, a genuine 2-row penalty table (1% formality fine
  capped at 950 UVT under Article 652; 3-10 day establishment closure,
  or 5% of the prior month's gross revenue in lieu, under Article 657
  for not invoicing at all), 5 steps, 2 portals. Called out RADIAN
  (invoices registrable as negotiable instruments for factoring) as a
  genuinely distinctive feature this tracker hasn't seen elsewhere, and
  noted Colombia's UBL 2.1-based format sits much closer to the
  European EN 16931 world than Argentina's own domestic XML schema
  does.
- **Migration 327**: a 2-story arc spanning ~7 months (DIAN's
  September 2025 regulatory unification, Resolution 000227/2025; the
  April 2026 "20-REG" e-invoicing regularization mechanism, Resolution
  000011/2026), matching the established multi-story-arc pattern for
  countries with ongoing procedural activity rather than one launch
  event.
- **Migration 328**: tracking sources — DIAN's e-invoicing system
  microsite and its dedicated normativa (regulations) page. No EC
  factsheet — Colombia isn't an EU member.
- **Migration 329**: jurisdiction count 44→45, generated
  programmatically by regex-diffing migration 321's own Argentina
  sweep (bare "44" → "45" across the same 40 `translations` rows).
- **Static files**: `countries.js` (Americas, alphabetically between
  Chile and Mexico), `shared/deep-dive-render.mjs`'s slug map + name
  translations. No `TOPO_NAME_OVERRIDES`/`MARKER_LONLAT_OVERRIDES`
  needed — the bundled topology already spells it `"Colombia"`,
  confirmed via direct Python inspection; Americas' existing
  `REGION_BOUNDS` box already comfortably contains Colombia's extent.
- Hand-swept the jurisdiction count across all four languages'
  `i18n/*.json` files and every static HTML page — 32 files, 58
  replacements via the same word-boundary regex with a negative
  lookahead for `%` (education-mandate-types.html's unrelated CSS
  `flex:0 0 43%` correctly left untouched — a pre-existing value from
  before this session's countries, not something this build's sweep
  should have touched at all).
- Verified via `apply_migrations.py --remote --dry-run`: "Replay
  validation OK (329 files, only the documented pre-existing errors)."
  A structural query against the replayed in-memory DB (reusing
  `apply_migrations.py`'s own schema-replay logic) confirmed every
  row/translation count and a total `countries` row count of 46 (45
  real jurisdictions + the standalone EU row), plus zero stray "44
  jurisdiction/countries/tracked" references remaining anywhere in the
  `translations` table.

**Deployed and tested** (confirmed by Dan): migrations 322-329 applied
via `apply_migrations.py --remote`, both `site-worker` and
`members-worker` redeployed to pick up the static-file changes
(`countries.js`, `shared/deep-dive-render.mjs`, and the 32 swept
`i18n`/HTML files). Colombia is live on the tracker board (Americas,
between Chile and Mexico), and it appears correctly in the UI.

### Newsletter Archive country filter: balanced columns (4 August 2026, deployed & tested)

Dan flagged that the Newsletter Archive's ("/members/archive") country
filter checkboxes were laid out one grid column per region
(`.region-columns` / `.country-checkboxes` in `members-worker/src/
index.js`), so a big region just grew straight down the page — Europe's
23 countries stacked into a tall, narrow half-width column while the
smaller regions (MENA, Asia-Pacific, Americas) sat mostly empty next to
it.

Explored three options as an HTML mock-up (sent directly to Dan, not
committed — a one-off comparison, not a durable artifact) before
touching real code:

- **A — current**: one grid column per region (what's live today).
- **B — wraps across the page**: each region's checkboxes flow in one
  wrapping row spanning the full card width, region by region.
- **C — balanced columns**: all regions flattened into one sequence
  (region label, then its countries), then split into however many
  columns fit the available width, sized so every column gets roughly
  the same number of rows.

Dan picked **C**. Implemented in `members-worker/src/index.js`,
`renderArchiveList()`:

- Server-side, `filterEntries` now builds the flattened
  header-then-countries sequence as plain data (`{h: regionLabel}` /
  `{v: countryName, c: isPreferred}`) instead of pre-built HTML, and
  ships it to the client as `COUNTRY_FILTER_ENTRIES` JSON (same pattern
  already used for `ARCHIVE_STORIES`).
- Client-side, a new `computeBalancedColumns()` measures
  `#balancedColumns`'s real rendered width, works out how many columns
  fit at a ~170px target column width (+24px gap), and splits the flat
  entry list into that many columns as evenly as possible (differing by
  at most one row). An orphan-avoidance pass pushes a region label down
  into the next column if it would otherwise land alone at the bottom
  of a column with none of its countries under it.
- `renderBalancedColumns()` builds the column markup, re-attaches the
  `change` listener on every checkbox (needed since the DOM nodes are
  rebuilt, not just repositioned), and is called on load and again
  (debounced 150ms) on window resize, so the column count stays correct
  if the browser is resized rather than being fixed at page-load width.
- A `filterCheckedValues` Set (seeded from the subscriber's saved
  preferences, same as before) tracks checked state independently of
  the DOM, so resizing the window and rebuilding the columns doesn't
  lose whatever the visitor had checked.
- Old CSS removed: `.region-columns`, `.country-checkboxes`,
  `.country-checkboxes.two-col`, `.wide-region` (all were unique to
  this one picker — confirmed via repo-wide grep, nothing else
  referenced them). New CSS added: `.balanced-columns` (flex row),
  `.balanced-col` (flex column, min-width:0 so columns can actually
  shrink). `.region-group-label` and `.country-check-filter` are
  unchanged and reused as-is.
- The Preferences page's own country picker (`renderPreferencesPage()`,
  `.region-group` / `.country-check`) is untouched — this only affects
  the Archive's filter checkboxes, a separate picker with separate
  markup and CSS.
- Verified with a standalone Node script replicating
  `computeBalancedColumns()` against the real 4-region/45-country list
  at several widths (320/480/700/1000/1100px): column count scales
  sensibly (1 → 2 → 3 → 5), row counts per column never differ by more
  than one, and no region label is ever left orphaned at the bottom of
  a column. `node --check src/index.js` passes.

**Deployed and tested** (confirmed by Dan): `members-worker` redeployed;
the balanced-columns filter is live on the standalone
`/members/archive` page.

### Bug found before deploy: country filter empty when the Archive opens in-page (4 August 2026, deployed & tested)

Dan reported the country checkboxes didn't list at all when the
Newsletter Archive is opened in-frame (the tracker's embedded panel,
`openArchive()` in `einvoicing-compliance-tracker.html`) — even though
the standalone `/members/archive` page was fine.

Root cause: `openArchive()` fetches the standalone page's HTML and
injects `.archive-wrap` into a shadow root, but it deliberately never
re-executes the fetched page's own `<script>` block (documented at the
top of that function — the script looks things up via the global
`document`, which can't see inside a shadow tree; `renderArchiveGrid()`
is already a hand-ported copy of members-worker's `renderGrid()` for
exactly this reason). Before this session's balanced-columns change,
that was fine for the country checkboxes specifically, because they
were static HTML baked directly into `.archive-wrap` by the server —
the embedded panel only needed to wire `change` listeners onto
elements that already existed. Now the checkboxes are built entirely
by client-side JS (`renderBalancedColumns()`, reading
`COUNTRY_FILTER_ENTRIES`) that only runs inside the fetched script
block — which the embedded panel never executes — so `#balancedColumns`
stayed empty every time the Archive was opened in-page.

Fixed by porting the same balanced-column logic into
`einvoicing-compliance-tracker.html`, mirroring how `renderArchiveGrid()`
already ports `renderGrid()`:

- `computeBalancedColumns()` — an exact copy of the members-worker
  version.
- `renderBalancedColumnsShadow()` — same idea as
  `renderBalancedColumns()`, but operates against `archiveShadowRoot`
  instead of `document`, and tracks checked state in a new
  page-level `archiveFilterCheckedValues` Set (mirroring
  `archiveStoriesData` and friends).
- `openArchive()` now also regex-extracts `COUNTRY_FILTER_ENTRIES` from
  the fetched HTML (same pattern already used for `ARCHIVE_STORIES`),
  seeds `archiveFilterCheckedValues` from it, and calls
  `renderBalancedColumnsShadow()` instead of the old
  `shadow.querySelectorAll('.country-filter-cb').forEach(...)` wiring
  (which no longer has anything to find at that point, since the
  checkboxes don't exist until this function builds them).
- A page-level `resize` listener (singleton, guarded on
  `archiveShadowRoot` truthiness, same pattern as the existing Escape-key
  singleton a few lines below) recomputes the column split if the
  browser is resized while the panel happens to be open — matching the
  standalone page's own resize handling.

Verified by extracting the relevant `<script>` block and running `node
--check` against it (passes) and re-confirming the regex against
members-worker's own `const COUNTRY_FILTER_ENTRIES = ${filterEntriesJson};`
output line.

**Deployed and tested** (confirmed by Dan): `site-worker` redeployed for
`einvoicing-compliance-tracker.html`. Dan tested both the standalone
`/members/archive` page and the in-frame embedded panel — both working
well; the country filter lists and functions correctly in both.

### Newsletter Archive country filter: balanced columns replaced with a dropdown + "my subscribed countries" toggle (4 August 2026, deployed & tested)

Dan asked, separately from the balanced-columns work above, whether the
country filter would read cleaner as a single dropdown (default "All
Countries") to the left of the existing edition dropdown, rather than a
block of checkboxes. Mocked this up first
(`archive-country-dropdown-mockup.html`, sent directly, not committed)
comparing the current checkboxes against a plain single-select
dropdown.

Before building it for real, Dan asked whether a single-select would
break the existing behaviour of pre-checking a signed-in member's saved
country preferences on page load. Checked the actual code
(`renderArchiveList()`'s `preferredCountries`/`isPreferred` logic and
the Preferences page's multi-select checkbox markup) rather than
assuming: yes, it would — a `<select>` can only represent one chosen
value at a time, and a member can have several saved countries. Sent a
second mock-up (`archive-country-hybrid-mockup.html`) proposing a
hybrid — the dropdown for picking one country at a time, plus a
separate "Show my subscribed countries (N)" link below the toolbar
(signed-in members with saved preferences only) that applies their
full saved list at once, shown as read-only chips since the dropdown
itself can't display more than one selection. Dan approved the hybrid.

Implemented in both places that render the Archive filter:

- **`members-worker/src/index.js`, `renderArchiveList()`**: the old
  flattened `filterEntries`/`COUNTRY_FILTER_ENTRIES` data (built for
  the balanced-columns checkboxes) is gone. In its place:
  `countryOptionsHtml` builds a real `<optgroup>`-per-region,
  `<option>`-per-country block server-side for a new
  `<select id="countryFilter" class="archive-search">` in
  `.archive-toolbar`, positioned between the search box and the
  edition dropdown, defaulting to a new `archive.allCountries` i18n
  string ("All Countries" / "Todos los países" / "Alle Länder" /
  "Tous les pays"). `preferredDisplayNames` (built the same way the old
  `isPreferred` check worked, via `englishNameByDisplayName`) ships to
  the client as `PREFERRED_COUNTRIES` JSON, alongside two new i18n
  strings shipped as plain JSON constants —
  `MY_COUNTRIES_LINK_LABEL` (`archive.showMyCountries(n)`, e.g. "Show
  my subscribed countries (3)") and `SHOW_ALL_COUNTRIES_LABEL`
  (`archive.showAllCountries`). A new `<div id="myCountriesRow">`
  sits below the toolbar.
- Client-side, `getCheckedCountries()` no longer reads checkboxes — it
  returns `PREFERRED_COUNTRIES` when `myCountriesActive` is on, else
  whatever single country (or none) the dropdown has selected.
  `renderMyCountriesRow()` renders either the "show my subscribed
  countries" link or, once active, the chip row plus a "show all
  countries" link, and only renders anything at all when
  `PREFERRED_COUNTRIES.length` is non-zero (anonymous visitors and
  members with no saved countries see nothing there, same as before).
  Selecting a specific country in the dropdown cancels
  `myCountriesActive` via a new `change` listener. The old
  `computeBalancedColumns()`/`renderBalancedColumns()` and the resize
  listener that recomputed column counts are removed entirely — a
  dropdown doesn't need width-based recomputation.
- Old CSS removed: `.country-check-filter`, `.balanced-columns`,
  `.balanced-col`. New CSS added: `select.archive-search` (fixed
  min-width, matching the edition dropdown's sizing), `.my-countries-row`,
  `.my-countries-link` (+ hover), `.my-chip-row`, `.my-chip`.
  `.region-group-label` is untouched (still shared with the Preferences
  page).
- **`einvoicing-compliance-tracker.html`, `openArchive()`** (the
  in-frame embedded panel — fixed for this exact same feature area
  once already this session, see above): ported the same hybrid logic
  rather than the old balanced-columns port. `openArchive()` now
  regex-extracts `PREFERRED_COUNTRIES`, `MY_COUNTRIES_LINK_LABEL`, and
  `SHOW_ALL_COUNTRIES_LABEL` from the fetched HTML (replacing the old
  `COUNTRY_FILTER_ENTRIES` extraction) into new page-level state
  (`archivePreferredCountries`, `archiveMyCountriesActive`,
  `archiveMyCountriesLinkLabel`, `archiveShowAllCountriesLabel`).
  `activeCountriesShadow()` and `renderMyCountriesRowShadow()` are the
  shadow-root-scoped equivalents of the two new client functions above
  — the country dropdown itself needs no porting this time, since it's
  server-built markup that arrives as part of the fetched
  `.archive-wrap` HTML (unlike the balanced-columns checkboxes, which
  were built entirely by client JS that never ran inside the shadow
  root). `renderArchiveGrid()`'s checked-country line now calls
  `activeCountriesShadow()` instead of querying `.country-filter-cb`
  checkboxes. The old `computeBalancedColumns()`,
  `renderBalancedColumnsShadow()`, and the page-level resize listener
  that recomputed column counts are all removed.
- Verified: `node --check` on `members-worker/src/index.js` directly;
  the client `<script>` embedded in `renderArchiveList()`'s template
  literal extracted (interpolations stubbed out, nested-template-
  literal escaping undone) and `node --check`'d separately; the
  tracker's relevant `<script>` block extracted the same way both
  pass with no errors. Repo-wide grep confirms no remaining references
  to `COUNTRY_FILTER_ENTRIES`, `balanced-columns`/`balanced-col`,
  `country-filter-cb`, `country-check-filter`, or `countryCheckboxes`
  (the one hit for that last string is an unrelated local variable in
  the Preferences page's own country multi-select, untouched by this
  change).
- No `ADDING-A-COUNTRY.md` update needed for this change: the
  dropdown's `<optgroup>`s and `PREFERRED_COUNTRIES` are both built
  from the same live D1 query (`countries.region` +
  `country_translations` + `story_countries`) the old checkbox version
  already used, not a hardcoded per-country list. A newly-added country
  appears automatically once a published story is tagged with it, under
  the correct region's `<optgroup>`, with its translated display name
  pulled live the same way every other country's already is — no new
  step, exactly the same as the old balanced-columns implementation.

**Deployed and tested** (confirmed by Dan): both `members-worker` and
`site-worker` redeployed. Working successfully — the dropdown, the
"Show my subscribed countries" link/chips, and the earlier
balanced-columns-era in-frame bug all confirmed fine this time on both
the standalone `/members/archive` page and the in-frame embedded
panel.

### Philippines added as country #47 (4 August 2026, deployed & tested)

Dan asked "which are the most interesting other countries — perhaps
philippines?" — live research surfaced the Philippines (BIR EIS
mandate, Phase 1 deadline just extended to 31 December 2026 under RR
26-2025), Taiwan, and an Americas trio (Uruguay/Costa Rica/Ecuador) as
candidates. Dan asked for a deeper dive on the Philippines before
committing to build it — that dive covered the legislative timeline, a
genuinely tiered penalty schedule, the post-issuance (not clearance)
compliance model, and an honest risk caveat: this mandate has slipped
more than once. Dan then said "Please build Philippines."

The Philippines is a post-issuance reporting model, closer in shape to
South Korea than to this tracker's clearance-model countries
(Colombia, Argentina, Jordan): an invoice is legally valid once it
reaches the buyer, with sales-data transmission to the BIR a separate,
later duty. The legal basis dates to 2018's TRAIN Law (RA 10963); a
2022 pilot with 100 selected large taxpayers ("LT100") then paused for
roughly two years after technical and capacity problems; RR 11-2025
formally resumed and expanded the mandate in February 2025 with a 14
March 2026 deadline; and that deadline was itself superseded before it
arrived — RR 26-2025 (16 October 2025) pushed Phase 1 to 31 December
2026. Treated the December 2026 date as the current official target,
not a settled certainty, given this documented history of slipping.

**4 milestones**, live-researched against the BIR's own regulation
PDFs (`bir-cdn.bir.gov.ph`), the Official Gazette's RA 10963 page, PwC
Philippines, Sovos, the Philippine News Agency, and the Department of
Finance: TRAIN Law/RA 10963 (1 Jan 2018, anchor/off-board,
`mandate_scope: 'none'` — the enabling law, no live obligation yet),
RR 8-2022's LT100 pilot (1 Jul 2022, off-board, `mandate_scope:
'none'` — voluntary, BIR-selected only, later paused for ~2 years),
RR 11-2025 (27 Feb 2025, off-board, `mandate_scope: 'b2b'` — resumes
and expands the mandate, sets the taxpayer list actually in force
today, but its own 14 March 2026 deadline was superseded before it
arrived, matching this tracker's established anchor/on_tracker
convention for superseded-vs-current milestones confirmed against
South Korea's own migration data), and RR 26-2025 (31 Dec 2026,
on-board, `confidence: 'expected'`, `mandate_scope: 'b2b'` — the
current Phase 1 deadline). Deliberately did not fabricate a date for
the unscheduled Phase 2 (medium/small business expansion) — covered
only in deep-dive narrative and card text, consistent with this
project's discipline against inventing dates that aren't genuinely
confirmed.

- **Migration 331**: country row (`PH`, `Philippines`, region
  `Asia-Pacific`, slug `philippines`, `in_picker=1`) + name
  translations (Filipinas/Philippinen/Philippines).
- **Migrations 332-333**: the 4 milestones with full translations.
  Proper nouns and regulation numbers (RR, BIR, TRAIN Law, LT100, EIS,
  ESRS, PHP, NIRC) deliberately left untranslated across all 4
  languages, matching this project's established convention.
- **Migrations 334-335**: full deep-dive content across 4 languages —
  5 stats, 8 cards across 3 sections, a lifecycle pill card (the
  "issue-then-report flow," South Korea's template, since both share a
  post-issuance model) with 4 status entries, a genuine 5-row penalty
  table (fines scaling from a flat PHP 1,000-50,000 for a missed
  invoice up to PHP 500,000-10,000,000 plus 2-10 years' imprisonment
  for deliberate sales-suppression "zapper" software, with a separate
  closure-risk penalty — permanent business closure possible after 180
  days of non-transmission, under NIRC Section 264-A), 6 steps, 2
  portals. Caught and fixed one internal inconsistency in the English
  content before translating it: the zapper-software penalty row said
  "2-4 years'" imprisonment while its sibling card said "2-10 years'"
  for the same offense — corrected the row to match the higher, more
  heavily-sourced figure.
- **Migration 336**: a 2-story arc — the January 2025 Joint
  Administrative Order (JAO 001-2025) launching a *separate*
  cross-border e-invoicing/pre-border technical verification system
  for imports (genuinely distinct from the domestic EIS mandate,
  explicitly flagged as such in both the story and the deep-dive
  scope card, to head off the natural confusion between the two), and
  the October 2025 RR 26-2025 deadline-extension news. Both stories
  fact-checked against live sources (DOF's own press release for the
  JAO; Sovos and the Philippine News Agency for the RR 26-2025
  extension), which is what caught that RR 26-2025 was actually issued
  16 October 2025, not September as the deep-dive's first draft had
  it — fixed in migrations 334-335 before this build finished.
- **Migration 337**: tracking sources — the BIR's own EIS portal and
  its general eServices hub. No EC factsheet — the Philippines isn't
  an EU member.
- **Static files**: `countries.js` (Asia-Pacific, alphabetically
  between New Zealand and Singapore), `shared/deep-dive-render.mjs`'s
  slug map + name translations. No `TOPO_NAME_OVERRIDES` needed — the
  bundled topology already spells it `"Philippines"`, confirmed via
  direct Python inspection; no `MARKER_LONLAT_OVERRIDES` needed either
  (the Philippines' landmass is large enough to render/click
  normally); Asia-Pacific's existing `REGION_BOUNDS` box already
  comfortably contains its extent.
- Hand-swept the jurisdiction count across all four languages'
  `i18n/*.json` files (24 files, 40 replacements) and every static
  HTML page (`index.html`, `subscribe.html`,
  `einvoicing-compliance-tracker.html`, and 4 education pages) via a
  word-boundary-safe sweep — confirmed `einvoicing-compliance-corner`'s
  own unrelated `line-height:1.45` CSS value was correctly left
  untouched (a decimal, not a jurisdiction count).
- Verified via `apply_migrations.py --local --dry-run`: "Replay
  validation OK (337 files, only the documented pre-existing errors)."
  A structural query against the replayed in-memory DB confirmed every
  row/translation count (4 milestones × 4 languages = 16 milestone
  translations; 5 stats × 4 = 20; 8 cards × 4 = 32; 1 lifecycle card ×
  4 = 4 with 4 statuses × 4 = 16; 5 penalty rows × 4 = 20; 6 steps × 4
  = 24; 2 portals × 4 = 8; 2 stories × 4 = 8; 2 tracking sources × 4 =
  8), a total `countries` row count of 47 (46 real jurisdictions + the
  standalone EU row), and zero stray "45 jurisdiction/countries/
  tracked" references remaining anywhere in the `translations` table
  (40 rows correctly reading "46").

**Deployed and tested** (confirmed by Dan): migrations 331-337 applied
via `apply_migrations.py --remote`, both `site-worker` and
`members-worker` redeployed to pick up the static-file changes
(`countries.js`, `shared/deep-dive-render.mjs`, and the swept
`i18n`/HTML files). Philippines is live on the tracker board
(Asia-Pacific, between New Zealand and Singapore), and the jurisdiction
count reads correctly at 46.

### Privacy Policy wired into the i18n system (4 August 2026, deployed & tested)

Dan asked for an evaluation of item 3 ("Translation frameworks for
remaining static pages") and then asked to build it. Audit of all 10
static HTML pages found 8 already fully wired (the tracker, all 5
education pages, feedback.html, subscribe.html — each with its own
`data-namespace` and full `{lang}-{namespace}.json` family). Exactly
one real gap: **privacy-policy.html** included `i18n/i18n.js` (so it
got the shared language banner) but had zero `data-i18n` attributes
and no `i18n/*-privacy-policy.json` files — visitors selecting
Spanish/German/French got the site chrome in their language but the
entire ~1,000-word policy body stayed English-only.
(`index.html` was also unwired, but it's a bare meta-refresh redirect
stub with no real content — `i18n.js`'s own doc comments call out
pages like this as fine to leave alone, so it wasn't touched.)

Built following the exact pattern used by feedback.html/subscribe.html:

- Added `data-namespace="privacy-policy"` to the page's `i18n.js`
  script tag.
- Tagged all 54 translatable elements with `data-i18n` keys —
  `backLink`, `header.*`, `fillNotice`, and `s1`..`s10` (heading +
  paragraphs/list items per section, matching the page's own numbered
  sections), plus a 3-column, 4-row `s2.table.*` for the "what we
  collect" mini-table. The "Last updated:" label is translated the
  same way the education pages already do it (`header.lastUpdated`
  wraps only the label, the date itself — "2 August 2026" — stays
  outside the span, unwrapped, exactly like every education page's
  `header.lastUpdated`/date pattern).
- Created `i18n/{en,es,de,fr}-privacy-policy.json` (`_meta.reviewed:
  true` for all four, matching the project's standing convention).
  Reused existing site-wide translations where they already existed
  for consistency: "Privacy Policy" → Política de privacidad /
  Datenschutzerklärung / Politique de confidentialité (already used in
  each language's tracker `footerNote` key), "United Kingdom" → Reino
  Unido / Vereinigtes Königreich / Royaume-Uni (already used in the
  tracker's country-name translations), and `backLink` reusing the
  exact "← Volver al panel general" / "← Zurück zur Übersicht" / "←
  Retour au suivi global" strings from every other page's `backLink`
  key. Embedded HTML (the `<strong>` emphasis in sections 3-5, the
  `mailto:`/external `<a>` links in sections 1, 4, and 7, the
  `<br>`-separated contact block in section 10) was kept inline within
  each translated string, matching how `en.json`'s own `footerNote`
  key already embeds a live `<a href="privacy-policy.html">` link —
  `i18n.js` applies translations via `el.innerHTML`, not
  `textContent`, so this renders correctly.
- Deliberately did *not* nest a second `data-i18n` element inside
  section 10's contact paragraph for the country name — no existing
  page in this codebase nests one `data-i18n` element inside another,
  and doing so would have been unsafe here: `i18n.js` takes a static
  snapshot of every `[data-i18n]` element via `querySelectorAll`
  before applying translations, so setting the outer paragraph's
  `innerHTML` first would silently destroy the inner element before
  its own translation could ever apply. Instead "United Kingdom" is
  simply written inline, per language, as part of the single `s10.p1`
  value — the same self-contained-string approach the rest of the
  file already uses everywhere else.

Verified programmatically rather than by eye: parsed the HTML for
every `data-i18n="..."` key (54 found) and confirmed each one resolves
to a non-empty string in all four new JSON files (no missing/empty
keys in any language); validated all four JSON files parse cleanly;
confirmed HTML tag balance (div/p/h2/table/tr/th/td/ul/li/span all
open/close matched) after the edit; confirmed the page has no "45"/"46"
jurisdiction-count text to worry about, so this item is independent of
the jurisdiction-count sweep.

**Deployed and tested** (confirmed by Dan): `site-worker` redeployed
with the updated `privacy-policy.html` and the four new
`i18n/*-privacy-policy.json` files. No D1 migration was needed. The
policy page now renders fully translated when a non-English language
is selected, not just the shared language banner.

### Business threads evaluated (4 August 2026) — decisions needed, nothing built

Dan asked for analysis on open item 4 ("Business threads"): a
competitive review of theinvoicinghub.com, the pricing question (free
vs. reviving a paid tier), the vendor registration/advertising
concept, and the two outstanding Resources ideas. All four are
genuinely decisions for Dan, not code — this entry is the findings and
a recommended direction for each, nothing was built or changed.

**1. theinvoicinghub.com competitive review.** Live-fetched their
homepage, sponsorship page, service-provider directory, and About
page rather than relying on prior knowledge, since this space moves
fast and a stale read would be worse than no read. Findings:

- Run by two credible industry-insider co-founders (an e-invoicing
  consultant/former MD & CTO of e-integration GmbH, and a former
  Product Manager for EDI & Compliance at Esker), operating 27 months,
  covering 32 countries. Self-reported traction: 1,500+ monthly unique
  visitors, 4,000+ newsletter subscribers.
- Content shape is broader than this tracker: news, per-country
  profiles, an "E-Invoicing Essentials" glossary/standards section
  (EN 16931, Peppol), a resource library (case studies, eBooks, market
  reports, webinars), and consulting services — on top of the
  country-tracking core this project also does.
- **Business model is the single most useful finding.** They charge
  readers nothing — the entire content library, including the country
  profiles and news, is free with no subscription wall. Revenue comes
  from two other levers instead: (a) a **vendor directory that's free
  to list in** ("your company name, country and logo will be visible,
  entirely for free" — roughly 80+ companies listed, filterable by
  country), sitting alongside (b) a **two-tier paid sponsorship
  program** layered on top of that same free directory — Silver
  (available in every country, no exclusivity) and Gold (one sponsor
  per country, "the most prominent advertising placements," currently
  sold in 14 countries). Sponsor placements appear directly on the
  relevant country pages and news content, not as generic site-wide
  banners — the same page real-estate this project's own per-country
  deep-dive pages already have. Pricing itself isn't published; they
  gate it behind a "request the sponsorship brochure" contact form.
  They pitch sponsors on reaching a "highly qualified," niche audience
  and explicitly market themselves as "100% verified & objective"
  despite selling sponsorship — i.e. they've had to work to keep
  editorial neutrality credible alongside a vendor-funded revenue
  model, which is exactly the tension this project would inherit if it
  followed the same path (see item 3 below).
- No evidence found of anything resembling either of this project's
  two Resources ideas — no accreditation-verified provider list (their
  directory is self-registered/unverified, not curated against actual
  government accreditation status per country) and no e-invoicing-
  specific vendor RFI template (generic RFI templates exist everywhere
  on the web — Asana, ProjectManager, ClickUp, etc. — but none
  specialized for e-invoicing vendor selection). Both remain genuinely
  open differentiation opportunities, not things to catch up on.

  **Assessment**: this is a real, credible, more mature competitor —
  not a thin also-ran like some of the "map" competitors evaluated
  earlier. It validates that this exact niche (neutral, free,
  government-sourced e-invoicing tracking) supports a sustainable
  small-team business, and it validates that vendor sponsorship (not
  reader subscriptions) is the proven monetization lever in this
  space. The clearest differentiation angle against them isn't more
  countries or more content depth — it's this project's stricter
  sourcing discipline (every milestone traced to an official
  government/EU source, visible on `/sources`) versus a broader
  content mix that leans more on aggregated market reports and
  vendor-contributed material.

**2. Pricing: free vs. the shelved paid tiers.** Checked git history
directly rather than trusting the open-items list's own shorthand,
and found a discrepancy worth flagging: the actual numbers that were
ever wired into `subscribe.html` / Lemon Squeezy were **$10/year
recurring or $12 one-time** (originally scaffolded as placeholders,
never changed except a brief £→$ currency swap before launch) — not
"$5/$8" as the open-items list has been describing it. Correcting
that shorthand below.

At $10-12/year, the per-subscriber revenue is trivial before even
accounting for Lemon Squeezy's fee (5.5% + $0.50 per charge — the
project's own code comments already flagged that a low-ticket monthly
charge would lose over half its value to that flat $0.50, which is
exactly why the original design used annual-only billing). Given
theinvoicinghub's own model above charges readers nothing at all and
still runs a viable business off vendor sponsorship instead, reviving
a $10-12/year reader paywall looks like the weaker of the two
monetization paths available to this project, not the stronger one —
it would also shrink the subscriber base right as vendor sponsorship
(which needs a large audience to be worth paying for) becomes the more
promising lever.

**Recommendation**: keep the free tier as the durable model, not a
temporary "until critical mass" placeholder — the free tier itself
*is* what builds the audience that any future vendor-sponsorship
revenue would depend on. If a paid tier returns, it's probably a
different product than the shelved one: not a cheap consumer-style
subscription, but something priced for the *company*, not the
individual — e.g. a team seat plan, or a structured data-feed/API
tier for larger compliance/tax teams — sized to reflect that this is
professional compliance intelligence, not a $10 hobby newsletter.

**3. The vendor registration/advertising concept.** theinvoicinghub's
existing free-directory + paid-sponsorship-tier structure (above) is
effectively a live proof of concept for this exact idea, which
de-risks the "does anyone pay for this in this niche" question. It
also sharpens the real risks:

- **Neutrality risk.** This project's entire brand is "sourced to
  official government portals, neutral, free" — visible in every deep
  dive's sourcing and in `/sources` itself. Vendor sponsorship doesn't
  have to compromise that (theinvoicinghub keeps directory listings
  and sponsorship separate from their editorial verdicts), but it has
  to be built that way deliberately from day one — sponsor placement
  on a country page, never inside the sourced milestone/penalty
  content itself.
- **Audience-size risk.** theinvoicinghub sells sponsorship against
  1,500+ monthly visitors and 4,000+ subscribers after 27 months. This
  project doesn't have a comparable published number yet and is still
  in the "free sign-ups, building toward critical mass" phase (see
  item 2). Selling sponsorship before there's real traffic to point to
  is a hard, credibility-damaging sell — vendors are buying reach, and
  reach requires the audience to exist first.

**Recommendation**: sequence this after the free tier has real
traction, not in parallel with it. When it's time, mirror the proven
shape (free, unverified-tier listing to seed the directory and build
goodwill with vendors early; a paid, exclusivity-based tier once
there's traffic worth paying for) rather than inventing a new model —
but differentiate on curation quality by tying it to Resources idea 4
below (accreditation-verified listings) rather than competing purely
on directory size against a directory that already has ~80 vendors
and a 2+ year head start.

**4. Two Resources ideas — accredited-providers list, vendor-
assessment RFI template.** Both remain genuinely open, validated by
the competitive review above (neither exists elsewhere in a
specialized, e-invoicing-specific form):

- **Accredited-providers list.** Not a repeat of theinvoicinghub's
  self-registered directory — the differentiated version is a list
  curated against actual government accreditation/certification
  status per country (e.g. France's registered PDPs, Italy's SDI
  intermediaries, OpenPeppol's own Access Point directory), matching
  this project's existing sourcing discipline instead of competing on
  raw listing count. This also gives the future vendor-sponsorship
  concept (item 3) a natural, differentiated hook: "verified
  accredited" as a premium listing tier, rather than "paid to appear
  first" alone.
- **Vendor-assessment RFI template.** A genuine gap — no
  e-invoicing-specific RFI template was found anywhere in this
  research, only generic RFI templates with no jurisdiction awareness.
  A template that walks a buyer through exactly the questions this
  tracker's own data model already answers per country (native
  coverage vs. partner-routed, clearance vs. reporting model, Peppol
  Access Point certification, format support) would be both genuinely
  useful and a natural lead-generation piece, tightly aligned with
  content this project already has rather than requiring new research
  from scratch.

Both were already flagged as "previously-discussed" ideas as far back
as the Resources-menu redesign (2 August 2026) — the menu's flyout
structure was deliberately left with room for them as future sibling
items. No build effort has gone into either; they remain content/
product ideas awaiting a decision to prioritize, not blocked on
anything technical.

### Insights (blog/whitepaper/sponsored content) scaffolded (4 August 2026, code complete, deploy pending)

Follow-up to "Business threads evaluated" above: Dan wants to weave in
owned content (blog posts, whitepapers) and eventually sponsored
content, with some pieces held back behind a free-to-join "Subscriber
Content Only" wall to drive subscriptions — but built so it maximizes
SEO discoverability rather than hiding everything behind a login wall.

**Architecture decision, and why:** the session cookie that gates the
newsletter archive (`eicc_session`) is host-only to
`members.e-invoicingcompliancecorner.com` — unlike the domain-scoped
`eicc_lang` cookie, it is deliberately NOT readable from the root
domain, and this project's own CORS helper (`withCors()` in
members-worker) explicitly avoids ever pairing CORS with
credentials/session state. So rather than inventing a cross-subdomain
auth mechanism (real security surface for a marginal convenience), the
split is: a public, SEO-indexable **teaser page on the root domain**
(site-worker, same "D1-backed, no asset file behind it" pattern as
`/sources`, `/map`, and the country deep-dives) that shows title/dek/
opening paragraph to literally everyone including Google, and the
**full body only ever renders behind a real session check** on the
members subdomain — reusing `requireSession()`/`isCurrentlyActive()`
exactly as the archive already does. Sponsored content is never gated
at all (a sponsor is paying for reach; a wall would defeat that),
matching the sequencing already recommended for a future vendor-
sponsorship program.

**What was built:**
- **Migration 338** (`articles` table): slug, type (`blog`/
  `whitepaper`), title, dek, teaser_html, body_html, pdf_url, gated,
  is_sponsored, sponsor_name/url, author, published/published_at.
  Schema-only — no seed rows; the migration file's own comment shows
  the INSERT shape for the first real piece. English-first (no
  translations side table yet — content marketing doesn't carry the
  same every-jurisdiction/every-language obligation compliance data
  does; add one later if ES/DE/FR readership justifies it).
- **`shared/resources-render.mjs`**: the D1 queries plus the article/
  list HTML fragments, shared by both Workers so neither duplicates
  the markup — only the outer page shell differs (site-worker's public
  dark-ink shell vs. members-worker's own `pageShell()`).
- **site-worker**: `/insights` (hub) and `/insights/<slug>` (public
  teaser or full piece, depending on `gated`/`is_sponsored`) — new
  D1-rendered routes, same pattern as `/sources` and `/map`.
- **members-worker**: `/members/insights/<slug>` — the gated full-body
  view, same `requireSession()` gate as the archive. Also extended the
  login flow to preserve where a reader was trying to go: `next` now
  round-trips through the login form → magic-link token →
  `/members/verify`'s existing (and unchanged) open-redirect allowlist
  (`isSafeVerifyNextPath()`, extended to cover `/members/insights/`) —
  so clicking "Subscribe free to keep reading" on a locked piece and
  then logging in lands you back on that exact piece, not a generic
  archive page.
- **Menu**: "Insights & Whitepapers" added to the tracker's existing
  Resources dropdown (the same slot the Resources-menu redesign
  deliberately left open for future siblings — see the accredited-
  providers/RFI-template entry above), plus the `menu.insights` key in
  all 4 `i18n/*.json` files.
- **Sitemap**: `/insights` hub entry added now; individual piece URLs
  get added by hand as each one publishes, same convention as country
  pages.

**Deliberately NOT done yet** (flagged rather than guessed at): wiring
a "new Insights piece" announcement into the monthly newsletter send —
the convenience-token mechanism it would reuse (see the welcome
email's archive/preferences links) is compatible with the new
`/members/insights/` prefix, but deciding when/how new pieces get
announced is a content-calendar question, not a code one.

**A note on how this got built** — this scaffolding was actually
written twice: the sandbox's local git checkout had silently reverted
to a stale commit (654169c, predating Philippines/Colombia/The Map)
between turns in this same session, the same class of environment
desync documented earlier in this file. The first pass committed on
top of that stale base and was caught before push (the push was
rejected — "remote contains work you do not have locally" — the same
signal as before). Recovery followed the same procedure: saved the new
work's file contents via `git show <bad-commit>:<path>`, `git reset
--hard origin/main` to get back to the true tree, then re-applied each
edit against the current (not stale) file content rather than
overwriting — necessary this time because the true tree's
site-worker/index.js and members-worker/index.js had genuinely moved
on (The Map feature, archive UI redesign) since the stale base, so a
blind copy-back would have silently deleted that work. Migration
number 254 (used in the first pass) turned out to already belong to
`mandate_scope_schema.sql` in the true tree — renumbered to 338 (the
real next-available number) before this commit.

Deploy (from your machine, once ready):
```
cd members-worker/migrations && python3 apply_migrations.py --remote
cd ../../site-worker && npx wrangler deploy
cd ../../members-worker && npx wrangler deploy
```
All three needed — the schema change, the new site-worker routes, and
the new members-worker routes/login-flow change. Spot-check once
deployed: `/insights` renders (empty list until a first piece is
inserted); after inserting the migration file's example INSERT with
`gated = 1`, `/insights/what-changed-in-2026` shows a teaser + "Keep
reading" link, clicking it prompts a login if not already signed in,
and lands back on the full piece after verifying; the tracker's
Resources menu shows the new "Insights & Whitepapers" item in all 4
languages.

### Taiwan added as country #48 (4 August 2026, deployed & tested)

Dan said "I think I'd like to add another country now." Presented the
already-vetted candidates from the earlier Philippines-adjacent
research (Taiwan, Uruguay, Costa Rica, Ecuador) via AskUserQuestion;
Dan picked Taiwan.

Taiwan's eGUI (electronic Government Uniform Invoice) system is
another post-issuance transmission model — closer in shape to the
Philippines/South Korea family than to the clearance-model countries
(Colombia, Argentina, Jordan). It built up in four distinct stages
rather than arriving at once: cross-border VAT/eGUI registration for
foreign digital service providers from 1 May 2017; the universal
domestic mandate from 1 January 2021 (every business-tax-registered
entity, B2B and B2C); an amendment to the Business Tax Act (published
3 September 2024) formalizing 7-day (B2B) / 2-day (B2C) transmission
deadlines and TWD 1,500-15,000 penalties; and MIG 4.0 becoming the
sole valid XML format from 1 January 2026, once the legacy MIG
3.1/3.2 transition period closed on 31 December 2025 — already past
as of today, not a future/expected milestone. Also surfaced, but
deliberately built as a **story rather than a milestone**: on 22
September 2025 Taiwan's Digital Industry Agency became a Peppol
Authority for cross-border invoicing — explicitly voluntary, so it
doesn't belong in `milestones` (which represents mandate-scope facts),
but it's a nice piece of connective tissue since the named Peppol
network members (Australia, Japan, Malaysia, New Zealand, Singapore,
UK) are all separately tracked jurisdictions here already.

**4 milestones**, live-researched against ecosio, rtcsuite, EDICOM,
vatcalc, vatupdate, Taxually, and vatit.com: the 2017 foreign-provider
VAT/eGUI regime (anchor/off-board, `mandate_scope: 'none'` — the
cross-border enabling piece, no domestic obligation yet), the 2021
universal mandate (on-board, `mandate_scope: 'b2b'` — the headline
date), the 2024 BTA amendment (on-board, `mandate_scope: 'none'` —
procedural/penalty change, not a scope change, same treatment as
Argentina's RG 5616/2024 and Czech Republic's EET 2.0), and the 2026
MIG 4.0 format lock-in (on-board, `mandate_scope: 'none'` — technical
format upgrade, already passed, no `confidence: 'expected'` flag
needed).

- **Migration 339**: country row (`TW`, `Taiwan`, region
  `Asia-Pacific`, slug `taiwan`, `in_picker=1`) + name translations
  (Taiwán/Taiwan/Taïwan).
- **Migrations 340-341**: the 4 milestones with full translations.
  Proper nouns and format/institution names (eGUI, MIG, MOF, BTA, TWD)
  deliberately left untranslated across all 4 languages.
- **Migrations 342-343**: full deep-dive content across 4 languages —
  5 stats, 8 cards across 3 sections (including a dedicated "Cross-
  border context: Peppol adoption" card naming all 6 network members),
  a lifecycle pill card (the "issue-then-transmit flow," matching the
  Philippines/South Korea post-issuance template) with 4 status
  entries, a 3-row penalty table (TWD 1,500-15,000 for late B2B
  transmission, late B2C transmission, and inaccurate data,
  respectively), 5 steps, 1 portal.
- **Migration 344**: 1 story — the 22 September 2025 Peppol Authority
  adoption, framed explicitly as voluntary and additive to (not a
  change of) the domestic mandate, naming Australia/Japan/Malaysia/
  New Zealand/Singapore/UK as connected network members.
- **Migration 345**: 1 tracking source — the Ministry of Finance's
  E-Invoice Platform (`einvoice.nat.gov.tw`), cited by ecosio as the
  official portal. **Flag for Dan to verify directly from a browser**
  before this goes live: the sandbox's `WebFetch` got a 403 trying to
  load it directly (likely bot-blocking, not necessarily a dead link,
  but not independently confirmed here) — same precedent as South
  Korea's NTS link earlier in this project's history.
- **Static files**: `countries.js` (Asia-Pacific, alphabetically
  between South Korea and Vietnam), `shared/deep-dive-render.mjs`'s
  slug map + name translations, `i18n/{en,es,de,fr}.json`'s
  `countryNames` (hand-added — the recommended `generate_files.py
  --remote` regeneration path isn't runnable from this sandbox, no
  Cloudflare credentials here). No `TOPO_NAME_OVERRIDES` or
  `MARKER_LONLAT_OVERRIDES` needed — confirmed via direct Python
  inspection of the bundled topology that it already has a real
  `MultiPolygon` feature named exactly `"Taiwan"`.
- Hand-swept the jurisdiction count across all four languages'
  `i18n/*.json` files (main + subscribe + 4 education pages, 20 files)
  and every static HTML page (`index.html`, `subscribe.html`,
  `einvoicing-compliance-tracker.html`, and 4 education pages).
- Verified via a standalone Python replay script (reusing
  `apply_migrations.py`'s own schema-loading + `KNOWN_REPLAY_ERRORS`
  logic, since this sandbox can't run its `--remote`/`--local` modes
  directly): "Replay validation OK (346 files, only the documented
  pre-existing errors)." A structural query against the replayed
  in-memory DB confirmed every row/translation count (4 milestones ×
  4 languages = 16; 5 stats × 4 = 20; 8 cards × 4 = 32; 1 lifecycle
  card × 4 = 4 with 4 statuses × 4 = 16; 3 penalty rows × 4 = 12; 5
  steps × 4 = 20; 1 portal × 4 = 4; 1 story × 4 = 4; 1 tracking source
  × 4 = 4), a total `countries` row count of 48 (47 real jurisdictions
  + the standalone EU row), and zero stray "46 jurisdiction/countries/
  tracked" references remaining anywhere in the `translations` table
  (16 rows correctly reading "47").

**A note on how this got pushed:** this session's sandbox hit a
newly-rolled-out git-proxy restriction that blocks `git push` to any
repo not in the session's "authorized repository set" — confirmed via
a public Claude Code issue describing the same server-side rollout,
with no working self-service fix available yet (the error message's
own suggested fixes, adding the repo to session sources or an
`add_repo` command, don't exist in the product). Neither the
session's stored PAT nor a freshly regenerated one got past it, since
the block happens at the proxy layer before GitHub ever sees a token.
Worked around it by exporting the one unpushed commit as a git
bundle (`git bundle create ... origin/main..main`), sending it to Dan,
and having him fetch/merge/push it from his own machine — a clean
fast-forward, no conflicts.

**Deployed and tested** (confirmed by Dan): migrations 339-346 applied
via `apply_migrations.py --remote`, `site-worker` and `members-worker`
both redeployed. Taiwan is live on the tracker board and confirmed
visible in the UI.

### Hungary added as country #49 (5 August 2026, deployed & tested)

Dan asked to add Hungary as the next new country. Hungary is a
genuinely different shape from every country built this session:
Real-Time Invoice Reporting (RTIR), live-researched against the
International VAT Association's original 2018 launch writeup, Sovos,
EDICOM, vatit.com, RTC Suite, globalvatcompliance.com, and VATupdate's
December 2025 briefing, is one of Europe's most mature transaction
data-reporting regimes — but for most of its history it has been a
pure DATA-reporting duty, not an e-invoicing mandate: the underlying
invoice could stay paper or PDF, only its data had to reach NAV
(Nemzeti Ado- es Vamhivatal) via the Online Szamla system. A genuine
e-invoicing ISSUANCE mandate only exists for one narrow sector
(electricity/gas/water B2B, since 1 July 2025), with a further
receipt-data reporting expansion confirmed for 1 September 2026, and a
comprehensive future B2B/B2G framework still at the public-consultation
stage (opened November 2025, updated as a concept paper 31 March
2026) — real and detailed, but not yet enacted, so built as a story
rather than a milestone, matching the precedent set by Qatar's draft
law and Taiwan's voluntary Peppol Authority adoption.

- **Migration 347**: country row (`HU`, `Hungary`, region `Europe`,
  slug `hungary`, `in_picker=1`) + name translations (Hungria/Ungarn/
  Hongrie).
- **Migrations 348-349**: 6 milestones with full translations — RTIR's
  2018 launch (anchor/off-board, `mandate_scope: 'none'`, original HUF
  100,000 threshold and manual-invoice grace periods) → the 2020
  threshold removal (on-board, `mandate_scope: 'none'`) → the 2021
  scope expansion to B2C/exports/intra-Community (on-board,
  `mandate_scope: 'none'`) → the July 2025 energy/water B2B e-invoicing
  mandate (on-board, `mandate_scope: 'b2b'` — the one milestone here
  that's a genuine issuance mandate, not just a reporting duty) → the
  September 2026 B2C receipt-reporting expansion (on-board,
  `mandate_scope: 'none'`) → the confirmed 2030 ViDA cross-border floor
  (on-board, `mandate_scope: 'b2b'`, same treatment as every other
  tracked EU member state).
- **Migrations 350-351**: full deep-dive content across 4 languages —
  5 stats, 8 cards across 3 sections (including a "what's actually
  mandatory today, by layer" table separating RTIR reporting from the
  narrow e-invoicing mandate from the proposed future framework), a
  lifecycle pill card explicitly framed around RTIR reporting
  invoice DATA rather than the document itself (distinct from every
  other lifecycle card built this session), and a genuine 2-row
  penalty table (HUF 500,000 per RTIR reporting failure; HUF 300,000
  for ignoring a NAV clarification request within 15 days, in force
  since 1 January 2025), 5 steps, 2 portals.
- **Migration 352**: a 3-story arc (the July 2025 energy-sector
  e-invoicing mandate; the November 2025/March 2026 comprehensive
  e-invoicing consultation, framed explicitly as a proposal; the
  imminent September 2026 receipt-reporting deadline alongside the
  certain 2030 floor) — richer than Czech Republic's 2-story precedent
  given how much more is genuinely happening in Hungary.
- **Migration 353**: tracking sources — NAV's Online Szamla portal
  (the actual RTIR reporting system), NAV's general site, and the EC
  eInvoicing factsheet (Hungary is an EU member state).
- **Migration 354**: jurisdiction count 47→48, generated
  programmatically by regex-diffing migration 346's own Taiwan sweep
  (bare "47" → "48" across the same translation rows).
- **Static files**: `countries.js` (Europe, between Greece and
  Ireland), `shared/deep-dive-render.mjs`'s slug map + name
  translations. No `TOPO_NAME_OVERRIDES`/`MARKER_LONLAT_OVERRIDES`
  needed — the bundled topology already has a real feature spelled
  exactly `"Hungary"`, confirmed via direct Python inspection.
- Hand-swept the jurisdiction count across all four languages'
  `i18n/*.json` files and every static HTML page via a word-boundary
  regex requiring nearby "jurisdiction(s)"/"countr(y/ies)" context
  (English/French) or "jurisdicci-"/"Rechtsordnung" (Spanish/German)
  — 24 files, 40 replacements, correctly skipping the unrelated
  `rgba(181,67,47,...)` CSS color value used in `subscribe.html` and
  `einvoicing-compliance-tracker.html`. One stat tile
  (`subscribe.html`'s `<div class="num display">47</div>` "Jurisdictions
  tracked" figure) needed a direct hand-fix since it has no count-word
  on the same line for the regex to key off.
- Note: the `i18n/*.json` `countryNames` client-side dictionary (used
  by the tracker's `translateCountry`) already had a pre-existing gap
  for every country added since roughly the Netherlands/Austria/
  Greece/Cyprus session (Argentina, Colombia, Czech Republic, Israel,
  Jordan, Oman, Philippines, South Korea, Turkey, Vietnam all missing,
  confirmed via direct inspection) — Hungary joins that same
  documented gap rather than being fixed in isolation; a batch fix via
  `generate_files.py --remote` from a machine with real Cloudflare
  credentials is still the recommended path, per `ADDING-A-COUNTRY.md`
  Phase 2.
- Verified via a standalone Python replay script (reusing
  `apply_migrations.py`'s own schema-loading + `KNOWN_REPLAY_ERRORS`
  logic, since this sandbox can't run its `--remote`/`--local` modes
  directly — no Cloudflare credentials here): "Replay validation OK
  (354 files, only the documented pre-existing errors)." A structural
  query against the replayed in-memory DB confirmed every row/
  translation count (6 milestones × 4 languages = 24; 5 stats × 4 =
  20; 8 cards × 4 = 32; 1 lifecycle card × 4 = 4 with 4 statuses × 4 =
  16; 2 penalty rows × 4 = 8; 5 steps × 4 = 20; 2 portals × 4 = 8; 3
  stories × 4 = 12; 3 tracking sources × 4 = 12), a total `countries`
  row count of 49 (48 real jurisdictions + the standalone EU row), and
  zero stray "47 jurisdiction/countries/tracked" references remaining
  anywhere in the `translations` table or in any static HTML/i18n
  file.

**A note on how this got deployed and how the repo got migrated:**
this sandbox has no Cloudflare/wrangler credentials, and separately
this session discovered a hard constraint worth documenting for future
sessions: the sandbox's git proxy blocks `git push` to *any* GitHub
repo outside "this session's authorized repository set" — confirmed
this isn't specific to `danielyoung76/E-InvoicingComplianceCorner` or
to any one account; a fresh PAT (fine-grained and classic, tested
against a brand-new repo under a different GitHub account) hit the
identical proxy-level 403 both times. The proxy overrides whatever
credential is embedded in the remote URL rather than merely failing to
inject its own, so no token fixes it from inside this sandbox.

Worked around it the same way as Taiwan's push earlier this project's
history — a git bundle handed to Dan, applied from his own machine —
except this time Dan also used it as an opportunity to migrate the
whole project to a new repo: **`einvoicingcompliancecorner/`
`E-InvoicingComplianceCorner`** (a full 383-commit history bundle,
not just the diff, pushed clean since the new repo started empty).
Dan then cloned fresh from that new repo location and ran the actual
deploy from there:

```
cd members-worker/migrations
python3 apply_migrations.py --remote   # migrations 347-354
cd ../../site-worker && npx wrangler deploy
cd ../members-worker && npx wrangler deploy
```

**Deployed and tested** (confirmed by Dan): Hungary is live. See the
next entry below for a follow-up content fix applied the same day.

### Deep-dive description length: trimmed 6 countries + added a guideline (5 August 2026, deployed & tested)

Dan flagged that the deep-dive `mandate_summary` (top-of-page tile)
and `timeline_intro` (text under the compliance timeline) had been
getting progressively longer with each recent country — Hungary's
`timeline_intro` had reached 191 words / 1283 characters. Measured
this precisely by replaying the full migration chain and computing
word/character counts per country in insertion order: the first 30+
countries held a tight ~40-60 word / ~20-35 word band, then Netherlands
onward began climbing, and Czech Republic through Hungary had roughly
tripled (146-191 words for `mandate_summary`/`timeline_intro`
combined, up from the original design intent of "2-4 sentences" per
the mandate-summary tile's own migration-188 description). Root cause:
no length target was ever documented, so as countries got more
nuanced, explanatory detail kept accumulating with nothing pulling it
back down.

Dan chose a "looser cap" (~90/50 words) over matching the original
tighter baseline, and asked to trim all six affected countries in one
pass rather than just the newest: **Czech Republic, Argentina,
Colombia, Philippines, Taiwan, Hungary**. Migration 355 rewrites
`mandate_summary` and `timeline_intro` for all 4 languages across all
six — condensed rewrites preserving every date, resolution/regulation
number, and figure from the original text, no facts cut. Landed at
roughly 90-110 words (`mandate_summary`) and 50-90 words
(`timeline_intro`) in the replayed result, with Spanish/French running
naturally longer than English as expected. Also added an explicit
length guideline to `DEEP-DIVE-MIGRATION-CHECKLIST.md` (next to the
schema's field list) so future country additions don't repeat the
drift — judged against English word count, since ES/DE/FR inflation
over English is normal.

Pure D1 content `UPDATE` — no schema change, no static-file change, no
Worker redeploy needed. Verified via a full 355-file replay (0 new
errors) before handing off as a second bundle on top of the Hungary
commit.

**Deployed and tested** (confirmed by Dan): migration 355 applied via
`apply_migrations.py --remote` from the new repo location. No
redeploy needed for a pure content change.

## Lemon Squeezy store application rejected — paid tier shelved (5 August 2026)

Dan received a rejection email from Lemon Squeezy on the site's store
application: "After reviewing the information in your application and
any extra information you supplied, unfortunately, we cannot approve
your store application... We have to assess the totality of data and
are guided by regulations imposed on us by Stripe, PayPal and card
companies." No specific reason given, and the email explicitly frames
it as more than a simple ToS-list match.

Checked Lemon Squeezy's own linked prohibited-categories page for a
plausible cause rather than speculating blind: their restricted list
explicitly names **"legal"** (under Financial & Legal Services) and
**"consulting"** (under Professional Services) as prohibited
categories. This project's own description — "informing visitors of
changes to e-Invoicing mandates, legislation and making
**recommendations of actions they should be taking to remain
compliant**" — plausibly reads as advisory/consulting-adjacent to an
automated or manual MoR risk review, even though the actual product is
a compliance-news/tracking newsletter (sourced-to-government, not
individualized legal advice). This is a hypothesis, not a confirmed
reason — Lemon Squeezy didn't specify one — but it's the most likely
fit against their own stated categories.

Given a choice between appealing/clarifying with Lemon Squeezy, trying
Paddle (another Merchant of Record, different review process but
similar risk profile), switching to Stripe directly (not a MoR, so
less strict on advisory-adjacent categories but pushes VAT/tax
handling onto the business itself), or shelving the paid tier
entirely, **Dan chose to shelve it** — consistent with the "Business
threads evaluated" analysis from 4 August 2026, which had already
recommended keeping the free tier as the durable model given
theinvoicinghub.com's free-reader/vendor-sponsorship precedent and
Lemon Squeezy's fee structure making low-ticket billing marginal even
before this rejection.

No code or content changed — the live site was already free-only with
Lemon Squeezy checkout disconnected since 2 August 2026 (see that
dated entry), so this rejection doesn't affect anything currently
live. It does close out the "Re-hooking Lemon Squeezy if/when a paid
tier returns" open item below as no longer viable via that specific
platform; a future paid tier, if the business case changes, would need
to start from Stripe or Paddle instead, informed by this rejection.

### Indonesia and Japan added as countries #50 and #51 (5 August 2026, deployed & tested)

Dan asked to evaluate two APAC candidates, initially offered as Pakistan
+ Indonesia (per the 4 August Asia-Pacific evaluation), but substituted
Myanmar for Pakistan and asked for an evaluation pass first. Research
found Myanmar has no real, dated, sourced e-invoicing legislation (every
source checked — Axway's global tracker, EY's June 2026 developments
tracker, VDB Loi's Myanmar Tax Booklet 2025-2027 — either omits Myanmar
or describes it as "early stages... broader implementation expected in
coming years") — held back, doesn't clear this project's bar. Indonesia
reconfirmed as strong. Dan also floated Japan mid-research; evaluated
and found real but structurally different from a typical mandate — Japan
has no e-invoicing issuance requirement, only a mandatory paper-or-
electronic tax-invoice registration regime (the Qualified Invoice
System) with an entirely voluntary electronic standard (JP PINT/Peppol)
layered on top. Dan confirmed **both as full builds**.

**Indonesia (migrations 356-362).** Coretax e-invoicing, live-researched
against vatcalc.com, fiscal-requirements.com, hanumaglobal.com,
muc.co.id, and DJP's own site (pajak.go.id). A genuinely two-era story:
e-Faktur Pajak required electronic VAT invoices in phases from 2014,
reaching full nationwide coverage 1 July 2016 — already a real, close-
to-universal e-invoicing mandate for eight years before Coretax existed.
DJP's Coretax platform launched 1 January 2025; **PER-11/PJ/2025** (22
May 2025) moved the invoice upload deadline to the 20th of the
following month; and from **31 December 2025** Coretax became fully
enforced, shifting Indonesia to a genuine real-time clearance model —
DJP approval is now a legal precondition for a valid invoice, not a
post-creation check, and uncleared invoices can't support the buyer's
VAT input tax credit. 6 milestones (`mandate_scope: 'b2b'` throughout,
since this is a real issuance/clearance mandate, not data-reporting-only
like Hungary's RTIR), 5 stats, 8 cards across 3 sections including a
5-step Coretax clearance-flow lifecycle card, 2 genuine penalty rows
(IDR 500,000 fixed late-return fine; up to 100% of underpaid VAT for
misreporting), 6 steps, 2 portals, 3 stories, 2 tracking sources, all
4 languages. `mandate_summary` 79 words / `timeline_intro` 54 words —
comfortably inside the post-355 length guideline.

**Japan (migrations 363-369).** A genuinely distinct shape for this
tracker — the first APAC country with no e-invoicing issuance mandate
at all, closer in spirit to Australia/Finland/the US than to a
clearance-model country. Live-researched against Japan's Digital Agency
(digital.go.jp), the National Tax Agency (nta.go.jp), Peppol.org, and
EDICOM. What's real and dated: the **Qualified Invoice System** (適格
請求書等保存方式) took effect **1 October 2023** — a mandatory
registration/documentation regime tied to consumption-tax input credit
(14-digit T-number, specific invoice content), but paper and PDF
invoices remain fully valid; nothing requires electronic issuance.
Registration opened 1 October 2021, the same month Japan's Digital
Agency (established September 2021) became the country's official
Peppol Authority. **JP PINT**, Japan's voluntary Peppol PINT BIS
Billing-compliant e-invoicing standard, reached v1.1.3 as of 8 June
2026 — real and actively maintained, but entirely optional. A
transitional input-tax-credit relief schedule for purchases from
non-registered suppliers is already tapering: 80% (2023-2026) → 70%
(from Oct 2026) → 50% (from Oct 2028) → 30% (from Oct 2030), sourced
directly from an NTA PDF. All 6 milestones use `mandate_scope: 'none'`
(no B2B/B2G issuance mandate to color on the Map). No
`deep_dive_penalty_rows` — Japan's enforcement is economic (lost input-
tax-credit appeal for buyers), not fine-based, matching the Finland/UK/
New Zealand/US precedent for countries with no real fine schedule;
covered entirely in 4 narrative penalties_related cards instead. 5
stats, 9 cards across 3 sections including a 5-step voluntary JP PINT/
Peppol lifecycle card (explicitly framed as optional at every step), 5
steps, 2 portals, 3 stories, 2 tracking sources, all 4 languages.
`mandate_summary` 89 words / `timeline_intro` 52 words.

**Shared work**: `countries.js` (Asia-Pacific region list) and
`shared/deep-dive-render.mjs` (`COUNTRY_DEEP_DIVE_SLUGS` +
`COUNTRY_NAME_TRANSLATIONS` for es/de/fr) updated for both countries.
No `shared/map-data.mjs` override needed — both use standard world-atlas
names. **Migration 370** bumps the jurisdiction-count copy (10 keys × 4
languages) from 48 to 50, following the exact pattern of migrations 346
and 354.

Full in-memory SQLite replay of all 370 migration files (schema.sql +
every migration in lexicographic filename order, matching
`apply_migrations.py`'s own ordering) passed cleanly: only the same 4
pre-existing documented errors (`050b_portugal_missing_milestone.sql`,
`070_add_lifecycle_title_column.sql`, `072_split_poland_lifecycle_text.sql`,
`082_malaysia_deepdive_content.sql`), zero new ones. Both countries'
milestone/stat/card/step/portal/tracking-source counts match exactly
across all 4 languages.

**A note on a wrangler-auth hiccup hit during apply:** `apply_migrations.py --remote`
initially hung indefinitely right after printing the replay-validation
line — turned out to be a real Cloudflare API call (`fetch_applied()`,
querying the remote `schema_migrations` table), not part of the local
replay check, silently stuck. Direct testing (`npx wrangler d1 execute
eicc-content --remote --command "SELECT 1"`) isolated it to a stale/
invalid wrangler OAuth session (`[code: 7403]`) — a fresh `npx wrangler
login` fixed it. Migrations 356-367 then applied cleanly, but
`368_japan_stories.sql` hit a second, unrelated, transient failure
(`[code: 10000]`, generic auth error specifically on the `/import` API
endpoint `d1 execute --file` uses, distinct from the `/query` endpoint
the plain `--command` test above hit) — nothing was left half-applied
(D1 rolls back a failed file-import cleanly), and simply re-running
`apply_migrations.py --remote` picked up at 368 and completed the
remaining 3 files without incident. Worth knowing for next time: a
`--remote` run hanging or erroring mid-batch isn't necessarily a sign
of a broken migration — check `wrangler whoami` and a plain `d1
execute --command` test first before assuming the SQL itself is at
fault.

**Deployed and tested** (confirmed by Dan): all 15 migrations
(356-370) applied via `apply_migrations.py --remote`, both
`site-worker` and `members-worker` redeployed. Indonesia and Japan are
both live and visible on the tracker board and in the subscribe page's
country menu, and confirmed rendering correctly on `/map`.

### Pakistan and Ecuador added as countries #52 and #53 (5 August 2026, deployed & tested)

Dan asked "what are the next eligible countries to add?", then chose
Pakistan and Ecuador from the list. Rather than build straight off
that initial pass, Dan asked for a first evaluation round, then
explicitly asked for a **second, deeper research pass** on both
("more extensive research to make sure you have all of the
information / accurate information") before authorizing a build —
that second pass surfaced two corrections that materially changed
the final copy, both written into the deep-dive content itself, not
just noted separately.

**Pakistan (migrations 371-377).** FBR's Digital Invoicing regime,
live-researched against FBR's own SRO PDFs, the Sales Tax Act text,
and Finance Act/Finance Bill text. 6 milestones: the Feb 2024 FMCG
pilot (anchor/off-board), the Jan 2025 Digital Invoicing Framework
(`mandate_scope: 'none'` — the enabling framework, not a scope
change), the Nov 2025 corporate-wave mandate and the Dec 2025
full-rollout flagship (both `mandate_scope: 'b2b'`), a Feb 2026
service-sector draft (`confidence: 'expected'`), and a Jun 2026
Finance Bill enforcement milestone (`mandate_scope: 'none'` —
procedural). **The deeper research pass's key finding**: real,
sourced compliance-gap evidence indicating FBR's own enforcement of
the Dec 2025 full-rollout target lagged the legal deadline — written
directly into that milestone's copy as an honest "where actual
compliance stands" caveat, not glossed over as if the mandate were
cleanly in force. A second finding — the widely-repeated
500k/1M/2M/3M PKR penalty ladder circulating in secondary sources
doesn't match FBR's actual Sales Tax Act Section 33 Serial 24/25/25AA
figures — is explicitly debunked in a dedicated penalties card, with
the real figures used in the 3 penalty rows instead. Also flagged as
a genuine open question, not glossed over: whether Pakistan's 31 July
2026 full-adoption target was actually met — no source (primary or
secondary) confirms either way as of this writing, so the relevant
story is framed as "target date passed, outcome unconfirmed" rather
than asserting compliance. 5 stats, 3 file_format cards, 2
scope_transmission cards (including the honest compliance-gap card),
4 penalties_related cards, 1 five-step lifecycle card, 3 penalty
rows, 6 steps, 2 portals (FBR Digital Invoicing page + general FBR
site — no EU factsheet exists for Pakistan), 3 stories (the
corporate-wave rollout, the compliance-gap finding, and a current-
development story on the Jul 2026 crackdown). `mandate_summary` 78
words / `timeline_intro` 48 words.

**Ecuador (migrations 378-384).** SRI's e-invoicing regime — one of
the longest-running mandates evaluated for this tracker, live-
researched against SRI's own resolution PDFs (where reachable — see
below), AVL Abogados client alerts, and other secondary confirmation.
6 milestones: the 2014 first mandate (anchor/off-board), a 2018 base
resolution (`mandate_scope: 'none'`), the Nov 2022 flagship going
universal (`mandate_scope: 'b2b'`, with the RIMPE Negocios Populares
small-taxpayer carve-out explicitly noted, not silently omitted), a
Nov 2024 emergency relaxation (`mandate_scope: 'none'`), a Jan 2026
real-time-transmission flagship, and a Jun 2026 traceability decree
(both `mandate_scope: 'none'`). **The deeper research pass's key
finding**: the Jan 2026 milestone is correctly framed as *closing* the
Nov 2024 emergency relaxation and restoring real-time transmission,
not introducing real-time reporting as a new concept — the first-pass
research had this backwards, and it was corrected before build. 5
stats, 3 file_format cards (including a hedge note on a genuine
technical-model ambiguity in the clearance sequence), 2
scope_transmission cards, 3 penalties_related cards (including one
clarifying the RIMPE carve-out doesn't mean zero compliance risk), 1
five-step lifecycle card (self-computed-key clearance flow), 4
penalty rows (RBU-based, in USD, from the confirmed primary-source
table), 6 steps, 2 portals (SRI e-invoicing page + general SRI site),
3 stories (the 2022 universal-coverage milestone, the 2024 emergency
relaxation, and a current-development story on the Jan 2026 closure +
Jun 2026 Decree 398). `mandate_summary` 73 words / `timeline_intro`
45 words. **Known blocked source**: SRI's Boletín 072 PDF returned a
`PROXY_REJECTED` (403) on every fetch attempt (both the research
subagent and a direct retry) — worked around via the AVL Abogados
secondary confirmation instead; flag for Dan to try from a browser
directly if he wants primary-source-only sourcing here.

**Shared work**: `countries.js` (Pakistan → Asia-Pacific, between New
Zealand and Philippines; Ecuador → Americas, between Colombia and
Mexico) and `shared/deep-dive-render.mjs` (`COUNTRY_DEEP_DIVE_SLUGS` +
`COUNTRY_NAME_TRANSLATIONS` for es/de/fr) updated for both countries.
No `shared/map-data.mjs` override needed — direct inspection of the
bundled world-atlas topology confirmed real, substantial geometry for
both (`Pakistan`: Polygon; `Ecuador`: 9-part MultiPolygon), matching
their `name_en` exactly. `i18n/{en,es,de,fr}.json` `countryNames` not
hand-added — same known, pre-existing gap this doc has already noted
for every country added since Indonesia/Japan and several before that
(South Korea, Israel, Jordan, Oman); the `generate_files.py --remote`
regeneration path isn't runnable from this sandbox (no Cloudflare
credentials here). **Migration 385** bumps the jurisdiction-count copy
(10 keys × 4 languages) from 50 to 52, following the exact pattern of
migrations 346, 354, and 370 — generated by parsing 370's own
SET-values as the new WHERE-baseline (a first-pass naive line-level
"50"→"52" substitution would have left stale "48" WHERE clauses;
caught and fixed before verification).

Full in-memory SQLite replay of all 385 migration files (schema.sql +
every migration in lexicographic filename order, matching
`apply_migrations.py`'s own ordering) passed cleanly: only the same 4
pre-existing documented errors (`050b_portugal_missing_milestone.sql`,
`070_add_lifecycle_title_column.sql`, `072_split_poland_lifecycle_text.sql`,
`082_malaysia_deepdive_content.sql`), zero new ones. Both countries'
milestone/stat/card/step/portal/tracking-source counts, mandate_scope
values, and translation completeness verified directly via SQL query
against the replayed database, not just taken on the build subagents'
own word. `countries.js` and `deep-dive-render.mjs` both re-verified
with a direct Node `--check` + module-load smoke test after editing
(52 total slug entries across both files, matching the new
jurisdiction count exactly).

**Deployed and tested** (confirmed by Dan): all 15 migrations
(371-385) applied via `apply_migrations.py --remote`, both
`site-worker` and `members-worker` redeployed to pick up the
`countries.js`/`deep-dive-render.mjs` static-file edits. Pakistan and
Ecuador are both live on the tracker board, in the subscribe page's
country menu, and confirmed rendering correctly. Delivered as a git
bundle for Dan to pull and push from his own machine, per this
project's standing git-push-restricted-sandbox workaround.

### France: DGFiP's official practical guide incorporated into the deep-dive + a new story (5 Aug 2026, deployed & tested)

Dan shared DGFiP's official practical e-invoicing guide
(`guide_pratique_facturation_electronique.pdf`, impots.gouv.fr) and
asked whether it had anything pertinent for a France news article.
Reviewed it directly (`WebFetch`) and cross-checked against the
existing France deep-dive and all three existing France stories
(Feb 24 pilot-opens, Jul 10 no-delay-confirmed, Jul 28
readiness-numbers) before concluding what was genuinely new rather
than a repeat: most headline facts (1 Sep 2026 go-live, 1 Sep 2027 for
smaller businesses, the soft-landing enforcement posture) were already
covered, but the guide added three things not yet on the site — a
named three-principle framework for the startup-phase tolerance, a
verbatim DGFiP quote confirming non-electronic invoices stay valid
("Une facture reçue par mail, PDF ou papier ne doit pas être écartée
au seul motif..."), and a sharper legal citation (CGI Article 1737 IV
bis specifically requires a three-month formal notice before a
non-reception penalty applies — the site previously only cited 1737
and 1788 D generically).

**Migration 386** (English): updates the existing "📎 Legal basis"
penalties_related card to add the Article 1737 IV bis citation
(matched to the existing card via its English title, not a hardcoded
ID — the same join pattern the France ES/DE/FR translations already
use), and adds a new 4th penalties_related card carrying the verbatim
French quote plus its English gloss and the guide's three explicit
tolerance conditions. `deep_dive_pages.last_updated` bumped to
2026-08-05. **Migration 387**: ES/DE/FR translations for both the
updated card and the new card — each language gets its own idiomatic
wording around the quote, not a duplicated repeat of the French text
(the French translation itself just states the quote directly, since
translating a French quote into French would be redundant).
**Migration 388**: a new story, dated 2026-08-05, reviewing the guide
directly ~4 weeks before go-live — framed as "here's DGFiP's own
written position," not as a new-publication event, since this guide
is very likely the same "practical 29-question guide" the 10 July
story already referenced secondhand; `source_url` is the actual PDF
Dan shared, per his explicit instruction to cite the source file
itself. **Migration 389**: ES/DE/FR story translations.

All four migrations generated via
`members-worker/migrations/generate_france_guide_update.py` (matches
the existing `generate_france_stories.py` precedent) to avoid
hand-escaping quote characters across 4 languages. Verified via the
same full in-memory SQLite replay used throughout this project (389
files, only the 4 documented pre-existing errors, zero new ones), plus
a direct structural query confirming: the Legal basis card's body
contains "IV bis" in all 4 languages, the new card exists at
`sort_order = 3` with all 4 language translations attached to the
*same* `card_id` (not accidentally creating duplicate cards per
language), `last_updated` reads `2026-08-05`, and the new story is
linked to France via `story_countries` with the correct source PDF
URL and all 4 language titles present.

**Deployed and tested** (confirmed by Dan): migrations 386-389 applied
via `apply_migrations.py --remote`. Pure D1 content — no schema
change, no static-file change, so no Worker redeploy was needed for
this one. The updated Legal basis citation, the new guide-quote card,
and the new story are all live on the France deep-dive and in the
archive.

### Bug fix: body-only narrative cards rendered as empty boxes in file_format/scope_transmission sections (5 Aug 2026, deployed & tested)

Dan reported Pakistan's deep-dive Section 3 "Where actual compliance
stands" card rendering as an empty box — title only, no content. Root
cause was in `shared/deep-dive-render.mjs`, not the migration data:
`renderSpecCard()` (used for every `file_format` and `scope_transmission`
card) only ever rendered `card.rows` and `card.note` — it never read
`card.body` at all. Only `renderRelatedCard()` (`penalties_related`
section) did. Pakistan's compliance-gap card is a body-only narrative
card (`rows_json` NULL, `body` set — exactly the "rows-based spec-cards
or body-based narrative cards" shape `DEEP-DIVE-MIGRATION-CHECKLIST.md`
describes as valid) placed in `scope_transmission`, the first time any
country actually used that combination outside `penalties_related` — so
the gap existed since this rendering path was written, just never
triggered until this card.

Confirmed via a direct query against the full replayed database that
this is the *only* card of its kind site-wide (all 53 countries, all 4
languages) — not a wider content gap, a single latent code path never
exercised before. Fixed `renderSpecCard()` to also render `card.body`
as a paragraph (between rows and note, matching `renderRelatedCard`'s
own ordering) when present — confirmed zero existing cards have both
`rows_json` and `body` set simultaneously, so no card double-renders
under the fix; rows-only cards are byte-identical to before (empty
`bodyHtml` when `body` is null), confirmed by a standalone Node
reproduction of both card shapes before and after the change.

**Deployed and tested** (confirmed by Dan): `site-worker` redeployed
with the `shared/deep-dive-render.mjs` fix — no migration, no
`members-worker` change needed. Pakistan's "Where actual compliance
stands" card now renders correctly on the live deep-dive.

**Follow-up (5 Aug 2026, deployed & tested):** Dan
reported the newly-visible text rendered in a visibly different style
from the rest of the card. Root cause: the `<p>` added by the fix
above had no CSS class, so it fell back to `body`'s unstyled default
(no explicit base `font-size`, so ~16px browser default) instead of
the 13px sizing every other piece of card content uses (`.spec-row`
is 13px, `.note` is 12.6px, `.related-card p` is 13px) — same
font-family throughout (inherited `IBM Plex Sans`), so the mismatch
read as size/weight, not literally a different typeface. Added a
dedicated `.spec-card p.body-text` rule (13px, `line-height:1.6`,
matching `.spec-row .v`'s `#241d10` text color since this is primary
card content, not muted annotation like `.note`) and gave the
generated paragraph that class. Verified via the same standalone Node
render reproduction, and confirmed `.spec-card p.body-text` doesn't
collide with the pre-existing `.related-card p` rule (different
parent class, so no specificity conflict). Full replay still clean
(389 files).

**Deployed and tested** (confirmed by Dan, alongside the Uruguay/Costa
Rica deploy below): `site-worker` redeployed with the CSS fix — no
migration involved, this was CSS-only.

### 5 Aug 2026 — Uruguay (#54) and Costa Rica (#55) added as new tracked jurisdictions

Following the Pakistan/Ecuador precedent, Dan asked for a deep-research
evaluation of two more Americas candidates before committing to a
build; Uruguay and Costa Rica were selected (from a shortlist that also
included Bulgaria) and each got an independent, live-sourced research
pass via a subagent, explicitly tasked with verifying/deepening the
project's existing lighter-touch draft evaluation and flagging any
unsupported claims. Both passes caught real corrections:

- **Uruguay** — the draft's "exemptions closed 1 July 2024" and its
  "UYU 10,000 to several hundred thousand" penalty range both traced to
  an uncited vendor blog and could not be verified. The actual
  primary-source picture (Resolución DGI 2548/023 + DGI's own 28 Nov
  2024 announcement) is a **31 December 2024 deadline, universal
  obligation from 1 January 2025**, with DGI's own reported figure of
  **98% of documentation already electronic** at that point — a
  stronger, better-sourced stat than the original draft's. The founding
  decree (36/012, Art. 17) defers to Uruguay's *general* Código
  Tributario penalty regime rather than setting CFE-specific fines, so
  the deep-dive's penalties section is written qualitatively (Arts. 95,
  97, 110) rather than citing the unverified peso range.
- **Costa Rica** — "mandatory since 2018" was sharpened to the actual
  anchor (Resolution DGT-R-012-2018, staggered Sept-Nov 2018 rollout by
  taxpayer ID digit, with healthcare/professional sectors mandated
  earlier in Jan-May 2018). The CNPT Art. 85/85-bis/86 penalty
  citations are corroborated by multiple independent sources including
  a real 2024 DGT enforcement report (₡253M+ fined across 279
  taxpayers) but weren't independently pulled from pgrweb.go.cr's live
  legal text — flagged as a caveat on the penalties card rather than
  presented as fully primary-sourced. The "Q4 2026 corporate-ID-format
  change" was confirmed real (Decreto Ejecutivo 44648-MJ, alphanumeric
  cédula jurídica) with a more precise date found — **1 November 2026**
  for the e-invoicing production cutover — though marked `confidence:
  'expected'` on that milestone since the broader cédula rollout
  timeline is described elsewhere as not fully finalized.

Built following the exact `ADDING-A-COUNTRY.md` sequence: migrations
390-396 (Uruguay: country/translations, 6 milestones, deep-dive content
— stats/cards/lifecycle/penalty-rows/steps/portals — across all 4
languages, 2 stories, tracking sources) and 397-403 (Costa Rica: same
shape, 7 milestones, 2 stories), then 404 (jurisdiction-count bump
52→54, generated mechanically by replaying the full chain in-memory and
diffing the post-385 current text rather than hand-editing, to avoid
the count-drift mistake migration 024 exists to fix). `countries.js`'s
Americas array and `shared/deep-dive-render.mjs`'s
`COUNTRY_DEEP_DIVE_SLUGS` + `COUNTRY_NAME_TRANSLATIONS` updated for
both countries (alphabetical placement: Costa Rica between Colombia and
Ecuador, Uruguay after United States). Checked `vendor/countries-50m.json`'s
topology directly — both "Uruguay" and "Costa Rica" match `name_en`
exactly, so no `TOPO_NAME_OVERRIDES`/`MARKER_LONLAT_OVERRIDES` entries
needed. Verified via full in-memory replay (404 migration files, only
the 4 documented pre-existing errors) plus direct structural queries
confirming exact 4-language translation-row parity across every table
for both countries and zero cards with both `rows_json` and `body` set
(the precondition of the Pakistan rendering bug fixed earlier this
session).

**Deployed and tested** (confirmed by Dan): migrations 390-404 applied
via `apply_migrations.py --remote`, both `site-worker` and
`members-worker` redeployed to pick up the `countries.js`/
`deep-dive-render.mjs` static-file changes. Uruguay and Costa Rica are
both live on the tracker board (Americas). The commit (`747cf4b`) was
also pushed to the canonical GitHub repo from Dan's machine, confirmed
via `git ls-remote`.

### 5 Aug 2026 — "Recent & Upcoming" status pill now defaults to "Due soon" (deployed & tested)

Dan asked for the tracker's "Recent & Upcoming" section to show the
closest milestones by default, rather than everything. The section's
status filter (`#statusFilters`, the "All / In effect / Due soon /
Upcoming" pill row) is driven by a single client-side `state.status`
value initialized on page load — previously `'All'`. Changed the
initial value to `'Due soon'` (`einvoicing-compliance-tracker.html`,
`let state = { region:'All', status:'Due soon', q:'' };`), the exact
key string already used by the pill buttons, `STATUS_MAP`, and
`renderTimeline()`'s filter check, so no other logic needed to change.

Confirmed this is a pure static-file change with no migration: `/`
`site-worker`'s `renderTracker()` only regex-replaces the `DATA` and
`DEEP_DIVES` blobs inside the shipped HTML at request time — it never
touches the surrounding script, so the new default state ships as-is
on redeploy. Also confirmed the hero arrivals/list board
(`renderBoard()`) reads straight from `DATA` and is unaffected by this
filter, and that "Due soon" (`computeStatus()`'s `soon`, 1-90 days
out) can never fall into the collapsed "Established regulations"
bucket (`ESTABLISHED_CUTOFF_DAYS` only catches *past* dates), so that
section correctly stays hidden by default too rather than showing an
empty expandable panel.

Verified: extracted and `node --check`'d the inline script after the
edit (clean); grepped for any other `state.status`/`state = {`/
`URLSearchParams` reference that might re-initialize or override the
default (none found — the only writers are the pill click handlers,
which set it generically from the clicked button's key).

**Deployed and tested** (confirmed by Dan): committed as two commits
(`cb73f66` documentation-only status-marker sync, `69d35a7` the actual
default-pill change), bundled together, applied by Dan, `site-worker`
redeployed. No D1 migration involved. Both commits also confirmed
pushed to the canonical GitHub repo — Dan's `git log --oneline -5`
shows `HEAD -> main, origin/main, origin/HEAD` all aligned at
`69d35a7`, cross-checked via `git ls-remote`/`git fetch` against
`neworigin/main`.

### 6 Aug 2026 — Full citation audit across all 140 newsletter stories; 99 source_url fixes (migration 405)

Dan asked about the Hungary `2026-08-04-hungary-september-deadline-and-2030-floor`
story specifically — its `source_url` was the generic EU Commission ViDA
overview page, which never mentions Hungary, NAV, or any of the story's
actual claims. Verified the story's underlying content was accurate
(corroborated the 1 Sept 2026 NAV receipt-data-reporting deadline, the
3-day reporting window, and the 1 Jul 2028 e-cash-register transition
against multiple live sources, including an official NAV press release),
but the citation itself was wrong. Dan then asked whether this was
systemic across the whole newsletter archive, and — given "the site
loses credibility if [the citation isn't relevant]" — asked for a full
audit rather than just the one fix.

**Method:** replayed the full migration chain in-memory, dumped all 140
published `stories` rows (id, date, countries, source_url, plain-text
article body) to JSON, split into 10 batches of 14, and dispatched 10
parallel general-purpose subagents (via the `Agent` tool, each with
`WebFetch`/`WebSearch`) with a shared brief: identify the story's
specific, checkable claims (dates, legislative status, named
institutions, figures, quotes), fetch the cited source, judge whether it
substantively supports those claims (not just "same general topic"), and
for anything inadequate, search for a better replacement — official
government pages preferred, reputable compliance-industry sources
(VATupdate, Sovos, EDICOM, KPMG, etc.) as fallback.

**Result: 40 ADEQUATE, 96 INADEQUATE, 4 MISSING (no source_url at all)**
— 100 of 140 stories (71%) had a real citation problem. The dominant
failure pattern: a story cites a country's generic tax-authority
homepage or landing page instead of the actual dated press release,
resolution, or article containing the claims being reported — the exact
Hungary pattern, just far more widespread. It also affected the two
other stories built on the same "whatever the country decides
domestically, the 2030 ViDA floor still applies regardless" template —
Cyprus's and Czech Republic's own versions had the identical problem
(same generic ViDA page, country-specific claims uncovered).

**Fixing it:** parsed the structured audit output, then did targeted
follow-up research on the hardest cases before trusting any suggested
replacement — direct `WebFetch` verification for Hungary (confirmed via
search that the NAV press release is genuinely dated 5 Aug 2026, not
an ambiguous older document — swapped from the agent's VATupdate
suggestion to this official NAV source), Cyprus (confirmed the EU
Digital Building Blocks Cyprus country sheet substantively covers the
2024 mandate-postponement, gov.cy portal, and no-B2B-mandate claims),
Czech Republic (reused the same expats.cz EET 2.0 article already
verified for `2026-07-17-czech-eet2-passes-lower-house`, since it
directly covers the Senate/President Pavel status the story needed),
Canada's `2026-02-01-canada-provincial-federal-exploration` (no clean
single replacement exists; used a Sovos page that covers the CRA task
force but not the Quebec/OECD specifics — a partial improvement, noted
as such), and Ecuador's `2024-11-05-ecuador-emergency-relaxation`
(found the actual official SRI boletín PDF, Boletín 061, by name —
consistent with this project's existing precedent of citing SRI PDFs
Ecuador's site rejects fetching directly). Also spot-verified a sample
of ~10 other agent-suggested replacements directly via `WebFetch`
before trusting the rest; one (India's suggested `gimbooks.com` page for
`2026-06-15-india-threshold-reduction-discussion`) turned out not to
support the claim at all, and two more searches found no corroboration
anywhere for that story's core claim (a GST Council discussion of
cutting the e-invoicing threshold to ₹2-3 crore) — **deliberately left
unfixed and flagged**, since this is a content-accuracy question for Dan
to decide (trim/remove the claim, or a source exists that wasn't found),
not a citation swap.

**Migration 405** (`UPDATE stories SET source_url = ... WHERE id = ...`,
99 statements, pure content update, no schema change) covers all 99
resolvable fixes: the 96 INADEQUATE stories minus the 1 India exception,
plus the 4 MISSING (including two multi-country roundup/editorial
pieces — `belgium-croatia-january-check-in` and
`2027-wave-multi-country-outlook` — that don't make new checkable
claims so much as reference facts already covered elsewhere on the
site; gave both a general "further reading" link to a VATupdate
worldwide-mandates roundup rather than force-fitting a claim-specific
citation that doesn't exist for an advisory piece). Verified via full
405-file in-memory replay (only the 4 documented pre-existing errors)
plus a structural check confirming every one of the 99 target rows
updated to its intended URL with zero mismatches and zero remaining
null/empty `source_url` values sitewide.

**Deployed and tested** (confirmed by Dan): migration 405 applied via
`apply_migrations.py --remote` — pure content `UPDATE`, no static-file
or Worker redeploy needed. Also confirmed pushed to the canonical
GitHub repo — Dan's `git log --oneline -5` shows `HEAD -> main,
origin/main, origin/HEAD` all aligned at `469ebe4`, cross-checked via
`git fetch`/`git ls-remote` against `neworigin/main`. All 99 story
citations are now live; the one deliberately-unfixed India story
(`2026-06-15-india-threshold-reduction-discussion`) still needs Dan's
call on the underlying claim.

### 6 Aug 2026 (cont'd) — Sourcing standard added to runbooks; full milestones citation audit; migration 406 (121 fixes)

Following Dan's request to make sourcing integrity "a priority for future
work" and to scope out where else audits are needed, two things happened
in sequence:

**Runbook update** (commit `b7b3c4b`): added an explicit "Sourcing
standard" section to `ADDING-A-COUNTRY.md` (between "Before you start"
and "Phase 1"), stating the guiding principle, citing the 71%/100-of-140
story-audit statistic, and giving 5 concrete rules (open the link and
confirm; generic homepages are inadequate; prefer official over
compliance-industry sources; cite the harder-to-verify claim when one
`source_url` covers several; keep informal records for deep-dive content
until the schema has a citation column). Also updated Phase 1 step 2
(milestones) to flag that 47 of 331 existing milestones had no
`source_url` at all as of this audit, and added a Phase 5 testing-checklist
item requiring every `source_url` to be opened and confirmed, not just
resolved. `DEEP-DIVE-MIGRATION-CHECKLIST.md` got a matching "Sourcing
note" flagging the missing citation column on `deep_dive_stats`/`cards`/
`steps`/`penalty_rows`.

**Full milestones citation audit**: ran the same audit methodology used
for the 140 newsletter stories across all 331 milestones on the tracker —
dump every milestone (id, date, country, source_url, system, desc,
actions) via the in-memory replay DB, split into 12 batches of ~28,
dispatch parallel `Agent` calls each instructed to `WebFetch` the cited
source, judge ADEQUATE/INADEQUATE/MISSING against whether it specifically
supports the milestone's claim (not just same topic), and `WebSearch` for
a replacement when it doesn't, flagging content-accuracy concerns
separately from citation-adequacy ones.

Results: 92 ADEQUATE, 192 INADEQUATE, 47 MISSING — 72.2% with a citation
problem, closely matching the story audit's 71%. Beyond one-off bad
citations, found several structural patterns: two confirmed instances of
a malformed Ecuador SRI URL pattern (`descargar?id=<resolution-name>`
instead of a UUID) silently resolving to unrelated content; 7 Australian,
10 Danish, and 7 Chinese milestones each citing one shared generic
homepage regardless of the specific claim; and 7 UK + 4 Vietnam milestones
mostly pointing to a single wrong shared source, looking like a citation
pasted once and reused down a country's whole timeline rather than 11
independent research gaps. 49 milestones carry a content-accuracy concern
(the claim itself, not just the citation, looks wrong or is contradicted
by sources found) — these were deliberately left unfixed and reported to
Dan for a judgment call, same rule as the India story exception in
migration 405. One earlier-flagged concern (Hungary's `hu-rtir-scope-2021`,
possibly-wrong Jan-vs-April-2021 date) was resolved in the milestone's
favor on this full re-run — Sovos confirms January 2021 is correct, it
only needed a better citation. WebSearch hit its session quota repeatedly
during the audit, so roughly 70 of the 239 problem milestones still have
no verified replacement — marked "none found" for tooling reasons, not
confirmed absence of a source; these need a follow-up pass.

**Migration 406** (`UPDATE milestones SET source_url = ... WHERE id = ...`,
121 statements, pure content update): fixes every problem milestone that
had a confirmed replacement source not conflicting with the milestone's
own claim. Deliberately excludes the 49 content-accuracy-flagged
milestones and the ~70 still needing a follow-up search. Verified via full
in-memory migration replay: 0 new errors, all 121 target rows match
expected URLs.

**Deployed and tested** (confirmed by Dan): migration 406 applied via
`apply_migrations.py --remote` — pure content `UPDATE`, no static-file or
Worker redeploy needed. Also confirmed pushed to the canonical GitHub repo
(`git fetch` against `neworigin/main` shows `3f61922` — the runbook
commit `b7b3c4b`, migration 406 commit `8214e36`, and this doc commit all
present). All 121 milestone citation fixes are now live. Full audit
findings (all 331 milestones, both raw batches and the compiled report
with the content-accuracy list) live in Dan's chat history from this
session, not yet copied into this repo — worth doing if a next session
picks up the follow-up pass (the ~70 unresolved problem milestones plus
the 49 content-accuracy flags).

### 6 Aug 2026 (cont'd) — Follow-up research pass; migration 407 (79 more fixes); 39 milestones flagged for Dan's review

Dan asked to go ahead with the follow-up pass migration 406 had deferred.
Ran two parallel research tracks: re-searched citations for the ~70
milestones where WebSearch had exhausted its quota mid-audit (this time
with no quota issues — all but one resolved), and fact-checked all 49
content-accuracy flags directly against primary sources, classifying each
as CONFIRMED_CORRECT (false alarm, milestone's claim was right, just
needed a citation), LIKELY_WRONG (claim itself appears incorrect, with a
recommended correction), or UNCLEAR (still unresolvable after real effort).

**Migration 407** (79 `UPDATE milestones` statements, pure citation swaps):
covers the 63 re-resolved searches plus 16 CONFIRMED_CORRECT
content-accuracy items. Verified via full in-memory replay: 0 new errors,
all 79 target rows match expected URLs.

**Deliberately excluded, reported to Dan for review** (39 milestones —
correcting a milestone's own claim is a bigger change than a citation
swap and needs his call, same rule as every content-accuracy exception in
this project):
- 30 LIKELY_WRONG content-accuracy items, each with a recommended
  correction and source (e.g. Spain's Ley 18/2022 dated Jan 2022 vs.
  actual Sept 2022 enactment; Croatia B2G Jan 2019 vs. actual July 2019;
  Israel's `il-phase3-10k` citing a legal-basis name that appears
  fabricated; Jordan's `jo-penalty-grace-end` claiming an imprisonment
  penalty no source corroborates).
- 2 UNCLEAR items (`be-mercurius`, `uk-nhs-peppol`) — genuinely
  unresolvable after real search effort.
- 7 new content-accuracy concerns that surfaced while searching for
  citations, not on the original 49-item list (`pl-b2g-peppol`,
  `at-b2g-extended-2018`, `au-default-2025` — this one also still has NO
  citation found at all and may be a duplicate of `au-automate` —
  `br-mandatory`, plus 3 lower-stakes nuances).

Full report with all 39 items, recommended corrections, and sources
delivered to Dan directly (not yet copied into this repo). Once Dan
confirms which corrections to apply, the next migration (408) will need
to touch milestone `date`/`desc` content, not just `source_url` — a
different, more consequential kind of change than 405-407.

**Deployed and tested** (confirmed by Dan): migration 407 applied via
`apply_migrations.py --remote`, clean run, no errors. Also confirmed
pushed to the canonical GitHub repo — `git fetch` against `neworigin/main`
shows `fb86026`. All 79 round-2 citation fixes are now live. Combined
with migration 406, 200 of the 239 problem milestones now have a verified
citation; the 39 remaining need Dan's decision on the underlying claim
before a content-correcting migration 408 can be built.

### 6 Aug 2026 (cont'd) — Content corrections for 35 of the 39 flagged milestones (migration 408)

Dan approved the batch of high-confidence corrections from the follow-up
report and separately supplied a new source for `be-mercurius` (Babelway's
own blog confirming the Mercurius platform is built on Babelway's Peppol
integration technology).

**Schema correction made while building this migration**: `milestones`
only has `id, country_id, date, anchor, source_url` — the `system` and
`desc` fields live on a separate `milestone_translations` table, keyed by
`(milestone_id, lang)`. An earlier draft of this migration incorrectly
tried to `UPDATE milestones SET system = ..., desc = ...`, which the
in-memory replay caught (`no such column: system`) before anything was
committed. Rewritten to correctly split each correction across both
tables.

**Migration 408** (35 milestones touched; 35 `UPDATE milestones`
statements for `date`/`source_url`, 23 `UPDATE milestone_translations ...
WHERE lang = 'en'` statements for `system`/`desc`, only emitting the
fields that actually changed from the current DB value): covers all 30
LIKELY_WRONG corrections plus the 7 new concerns surfaced during the
follow-up search pass (`pl-b2g-peppol`, `at-b2g-extended-2018`,
`au-default-2025`, `br-mandatory`, and 3 lower-stakes nuances), minus 2
items that stay untouched (below). `be-mercurius` was corrected using
Dan's supplied Babelway source — desc now credits Babelway's integration
technology; the 2017 launch date remains unconfirmed by any source found
and was left as-is (Babelway's page doesn't specify a year). Verified via
full in-memory replay: 0 new errors (only the 4 documented pre-existing
ones), all 37 milestones' `milestones` and `milestone_translations` rows
match expected values.

**Known gap, not addressed in this migration**: DE/ES/FR translation rows
for the 23 milestones with corrected `system`/`desc` text are now stale
relative to the corrected English — this migration only updates `lang =
'en'`. Translating 23 corrected descriptions into 3 languages accurately
is a substantial separate task; flagging it here rather than silently
leaving it unaddressed.

**Deliberately left untouched (2 milestones)**:
- `ie-phase1-criteria-reconfirmed` — no evidence the event itself
  happened; needs Dan's explicit decision (verify it's real and find a
  source, or remove the milestone) rather than inventing a citation for a
  possibly-nonexistent event.
- `uk-nhs-peppol` — still genuinely unclear after research; no new
  information surfaced since the follow-up report.

**Possible duplicate milestones flagged, not merged** (kept both, applied
best-effort corrections to each, left the merge/dedup decision to Dan):
- `ca-cra-research-2018` (now 2021-01-01, reframed as preliminary
  research) vs. `ca-watch` (2021-06-01, stakeholder engagement) — same
  underlying subject, close dates.
- `au-default-2025` (now 2026-12-01) vs. `au-automate` (also
  2026-12-01) — after correction these two milestones share a date.

**Deployed and tested** (confirmed by Dan): migration 408 applied via
`apply_migrations.py --remote`, clean run, no errors ("Replay validation
OK (408 files, only the documented pre-existing errors)."). Also confirmed
pushed to the canonical GitHub repo — `git fetch` against `neworigin/main`
shows `4288650`. All 35 corrected milestones are now live. Four items
still need Dan's explicit decision (not deploy-blocking, just unresolved):
whether to remove or re-source `ie-phase1-criteria-reconfirmed`; whether
`uk-nhs-peppol`'s date is ever resolvable; and whether to merge the two
flagged duplicate pairs (`ca-cra-research-2018`/`ca-watch`,
`au-default-2025`/`au-automate`).

### 6 Aug 2026 (cont'd) — DE/ES/FR translations synced to migration 408's content fixes (migration 409)

Dan asked to make the migration 408 content corrections available in the
other language translations. Migration 408 had only updated the `lang =
'en'` row on `milestone_translations` for the 23 milestones whose
`system`/`desc` changed — the German, Spanish, and French rows still held
the pre-correction (now-wrong) text.

Dispatched 4 parallel `Agent` translation passes (batches of 5-6
milestones each), each given the corrected English text plus the old
DE/ES/FR text purely as a terminology/style reference (not as content to
patch — the old translations describe the wrong facts). Rules given:
translate fresh from the corrected English meaning; preserve proper
nouns, institution abbreviations, legal citation numbers/names, currency
figures, and technical standard names (Peppol, PINT, CFDI, etc.)
untranslated; format dates naturally per language without shifting the
actual date value; match existing site terminology conventions.

**Migration 409**: 69 `UPDATE milestone_translations` statements (23
milestones × 3 languages), each only setting the `system`/`desc` fields
that actually changed in migration 408. Verified via full in-memory
replay: 0 new errors, all 69 milestone/lang rows match the expected
translated values exactly (checked programmatically against the parsed
agent output, not just spot-checked).

**Deployed and tested** (confirmed by Dan): migration 409 applied via
`apply_migrations.py --remote`. Also confirmed pushed to the canonical
GitHub repo — `git fetch` against `neworigin/main` shows `fa703cc`. All
four languages are now consistent across the 23 corrected milestones.
The four open items from migration 408 (`ie-phase1-criteria-reconfirmed`,
`uk-nhs-peppol`, and the two duplicate-milestone pairs) remain
outstanding — unaffected by this translation sync.

### 6 Aug 2026 (cont'd) — Dan's decisions on the 4 outstanding audit items (migration 410)

Dan resolved all four open items from migration 408 in one pass:

- **`ie-phase1-criteria-reconfirmed`**: Dan supplied a real Revenue.ie
  source — the VAT Modernisation "large corporates" guidance page. Fetched
  it directly: published 20 Jul 2026, it defines Phase 1 as VAT-registered
  businesses managed by Revenue's Large Corporates Division, established
  or with a fixed establishment in Ireland, who must send e-invoices to
  Irish business customers and report a data subset to Revenue from
  go-live (1 Nov 2028) — with all Irish businesses, regardless of size,
  required to be able to receive structured e-invoices from that date.
  Nothing on the page supports the old "Revenue restates the criteria
  ~8 months after the initial confirmation" framing (there's already a
  distinct, separately-cited `ie-phase1-criteria-2026` milestone for the
  actual 10 Feb 2026 criteria confirmation — this page is later and more
  detailed, not a restatement of the same thing). Rewrote system/desc (all
  4 languages) to describe what the page actually says, and corrected the
  date from 2 Oct 2026 to 20 Jul 2026 to match its real publish date.
- **`uk-nhs-peppol`**: removed entirely, per Dan's call — the 2018/2019
  date was genuinely unresolvable after real search effort, and Dan chose
  removal over carrying an uncertain citation. Deleted the `milestones`
  row and all 4 `milestone_translations` rows.
- **`ca-cra-research-2018` merged into `ca-watch`**: both covered the same
  2021 CRA e-invoicing feasibility study. Rather than just delete the
  duplicate and lose the "preliminary research began January 2021" detail
  the audit had surfaced, folded that fact into `ca-watch`'s desc (all 4
  languages) — it now reads "began preliminary feasibility research in
  January 2021, followed by broader stakeholder research..." — then
  deleted `ca-cra-research-2018`.
- **`au-default-2025` merged into `au-automate`**: both had ended up
  describing the same December 2026 ATO reform once migration 408
  corrected `au-default-2025`'s date to match the only corroborated
  sources. `au-automate`'s system/desc (all 4 languages) now cover both
  aspects — e-invoicing becoming the default exchange method *and* the
  mandatory automated-processing/quarterly-reporting requirement — then
  deleted `au-default-2025`.

**Migration 410**: 1 `UPDATE milestones` (Ireland date/source), 12
`UPDATE milestone_translations` (3 milestones × 4 languages), 3 `DELETE
FROM milestones` + 3 `DELETE FROM milestone_translations` (the removed/
merged-away ids). Verified via full in-memory replay: 0 new errors;
structural checks confirm the milestone count dropped from 331 to 328
(3 removed), zero orphaned `milestone_translations` rows for the removed
ids, and every updated/merged field matches the expected value across
all 4 languages.

**Deployed and tested** (confirmed by Dan): migration 410 applied via
`apply_migrations.py --remote`, clean run. Also confirmed pushed to the
canonical GitHub repo — `git fetch` against `neworigin/main` shows
`97f3e24`. This closes out the full citation and content-accuracy audit
thread that began with the Hungary story flag: all 140 stories and all
331 (now 328) milestones have been through the same audit-and-fix cycle,
and every open item from that work now has a resolution.

### 6 Aug 2026 (cont'd) — tracking_sources/deep_dive_portals link-liveness and country-match audit (migration 411)

Dan asked for the tracking_sources/deep_dive_portals audit next — the
thread he'd flagged mid-session as tying into the same sourcing-integrity
priority as the story/milestone citation work (405-410). Unlike stories
and milestones, these two tables hold *ongoing reference* links (official
tracking pages, national e-invoicing/Peppol portals) rather than
per-claim citations, so the audit questions were link-liveness (does it
still load?) and country-match (does it actually belong to the assigned
country?) rather than claim-support.

Dispatched 12 parallel `Agent` calls over all 101 `tracking_sources` +
81 `deep_dive_portals` rows (182 URLs total, batched ~16 per agent,
sorted by country for context). Each agent fetched every URL and judged
LIVE/DEAD and MATCH/MISMATCH, searching for a replacement when broken.

**Result: zero country mismatches across all 182 URLs** — a meaningfully
better hit rate than the story/milestone audits, and reassuring given
Dan's specific "Sources Of Truth" concern. 6 dead links found (5 distinct
URLs, 2 referenced from both tables): Austria's EC factsheet had migrated
to a new wiki pageId; Netherlands' stored Peppol Authority link 404'd;
Saudi Arabia's ZATCA news path returned 401 (URL structure changed);
Vietnam's invoice-lookup subdomain was unreachable. A number of other
URLs returned errors to the audit tooling itself (403/429/robots.txt
blocks, common for government sites with bot protection) but were
corroborated live via search-engine indexing and cross-references —
not counted as real problems.

Before writing the fix migration, independently re-verified 4 of the 5
replacement URLs myself via direct fetch (Austria's new EC page, Czech
Republic's mf.gov.cz, Netherlands' peppolautoriteit.nl, Saudi Arabia's
new ZATCA news path) — all confirmed live and on-topic. The 5th
(Vietnam's `hoadondientu.gdt.gov.vn` invoice-lookup replacement) timed
out on my own direct fetch too, the same connectivity issue the audit
agent hit; applied it anyway since multiple independent, current
third-party Vietnamese tax/accounting guides describe it as the live
portal, but flagged explicitly as corroborated-not-confirmed rather than
independently verified.

**Migration 411**: 8 `UPDATE` statements — 5 real link fixes (one,
Netherlands' Peppol link and Vietnam's lookup link, each fixed once per
table) plus 2 free housekeeping updates while already in the file
(Czech Republic's mfcr.cz still works but now just redirects to
mf.gov.cz; UAE's MOF link still works via an internal redirect, stored
the canonical path directly instead). Verified via full in-memory
replay: 0 new errors, all 8 rows match expected values, row counts
unchanged (101 tracking_sources, 81 deep_dive_portals — no rows added
or removed, URL-only changes).

**Deployed and tested** (confirmed by Dan): migration 411 applied via
`apply_migrations.py --remote`, clean run. Also confirmed pushed to the
canonical GitHub repo — `git fetch` against `neworigin/main` shows
`8ba8888`. All 8 link fixes are now live. One item flagged for
awareness, not action: Sweden's DIGG page itself notes some Peppol/
e-commerce operational responsibilities transferred to the Swedish
Procurement Authority as of 1 July 2026 — the stored URL is still live
and correct today, just worth revisiting if that transfer becomes more
complete.

### 6 Aug 2026 (cont'd) — Slovenia and Iceland evaluated (both good candidates, neither built yet)

Dan asked for an evaluation of Slovenia and Iceland, explicitly stressing
sourcing accuracy given the citation-audit work that just wrapped up (405-
411). Dispatched two parallel research agents with the same discipline
established across this whole project: live search only, every claim
traced to a primary/official source, unsourced vendor-blog claims
explicitly flagged rather than repeated as fact. Independently
re-verified the two anchor legal citations myself afterward (Slovenia's
ZIERDED gazette text, Iceland's Regulation 44/2019) via direct fetch —
both confirmed exactly as the agents reported.

**Slovenia — strong add-now candidate, no real caveats on the core
facts.** Two-tier legal basis, both primary-sourced:
- **B2G**: ZOPSPU-1, in force since 1 Jan 2015 (long-standing, not new).
- **B2B**: **ZIERDED** (Zakon o izmenjavi elektronskih računov in drugih
  elektronskih dokumentov) — passed by parliament 23 Oct 2025, published
  in the Official Gazette **Uradni list RS, št. 85/2025** (6 Nov 2025).
  This is enacted law, not a draft — independently confirmed via direct
  fetch of the gazette text. Effective dates: the certified "e-path"
  provider regime from **1 April 2027**, the core mandatory B2B exchange
  obligation from **1 January 2028**. ZIERDED Art. 1 explicitly
  transposes elements of the EU's ViDA directive (2025/516).
- **Penalties** (also independently confirmed): Art. 24 — €1,000-3,000
  for legal entities, €500-1,500 for sole proprietors, €100-500 for a
  responsible person, for core exchange violations; Art. 25 sets a
  separate, lower range for consumer-related violations.
- **Standard**: e-SLOG 2.0 (EN 16931-compliant); Peppol is one of three
  permitted transmission channels (alongside certified e-path providers
  and direct system-to-system links) per ZIERDED Art. 9.
- **One real gap, flagged rather than papered over**: no source confirms
  Slovenia has a formally registered OpenPeppol "Peppol Authority" —
  Slovenia doesn't appear on OpenPeppol's own current authorities list,
  and UJP's government page doesn't claim that title. If built, the
  deep-dive should describe UJP's actual role (central B2G hub, one of
  the accepted exchange channels) without asserting formal Peppol
  Authority status. Two secondary-only claims (ZZI operating an
  "Exchange Hub"; FURS offering a "miniBlagajna" tool) weren't
  independently corroborated on a primary page and should be re-verified
  or dropped if built, not carried over from vendor summaries.
- Earlier vendor commentary (2024–early 2025, from Marosa/Sovos/Comarch/
  Taxually/RTC/VATupdate) tracked draft 2026/2027 dates that the final
  enacted law superseded — a concrete example of exactly the "draft date
  vs. enacted date" trap this project's sourcing standard exists to
  catch; only the Official Gazette text should be cited for the date.

**Iceland — real but narrow; a defensible add, not a compelling one.**
- **B2G only, and not new.** Regulation 44/2019 (independently confirmed
  via direct fetch) requires public bodies to receive EN 16931-compliant
  e-invoices — state institutions by 18 Apr 2019, municipalities/public
  enterprises by 18 Apr 2020. Applies via EEA incorporation of EU
  Directive 2014/55/EU (Iceland is EEA, not EU). Fjársýsla ríkisins
  (Financial Management Authority) has been the registered OpenPeppol
  Peppol Authority since 2020 — confirmed on OpenPeppol's own country
  profile, a real primary source this time.
- **No B2B mandate exists — not enacted, not drafted, not even
  publicly discussed with a date.** The EU Commission's own 2025 country
  sheet for Iceland is self-flagged "NO VERIFICATION" and lists no
  2024-2026 developments.
- **No penalty regime found anywhere** — the EU Commission's own page
  states this explicitly. Any deep-dive would have to say "no statutory
  penalty found," not invent a figure.
- **A widely-repeated claim explicitly does NOT hold up**: several
  vendor blogs (CentaraIQ, ValidateFin, Basware, e-invoice.app) describe
  a "1 July 2026" deadline for Iceland to retire the older BII format in
  favor of Peppol BIS 3.0. None cite an actual Icelandic legal or
  regulatory source — the agent traced it to unsourced vendor inference
  and could not corroborate it against Fjársýslan, island.is,
  Stjórnarráðið, or OpenPeppol. **This should not be used** if Iceland
  is built — exactly the class of claim the site's audit work this
  session was built to catch before it ships, not after.

**Recommendation**: build Slovenia — it clears the bar the same way
Jordan/South Korea/Argentina did (enacted law, dated phases, specific
penalty figures, primary-sourced throughout). Iceland is legitimate but
thin: real B2G-only mandate, nothing changing, no penalties, no B2B
story — comparable to other mature/static B2G-only entries already on
the tracker, worth adding for completeness rather than urgency. Neither
has been built yet — this is evaluation only, awaiting Dan's go-ahead.

## 6 Aug 2026 (cont'd, again) — Slovenia and Iceland built, deployed & confirmed live

Dan authorized building both countries evaluated earlier today ("Please
build both - Iceland can appear as B2G only in the map"). Built following
`ADDING-A-COUNTRY.md`'s full process, migrations 412-424, with the same
independent-verification discipline as this session's citation-audit work
— every URL used as a milestone `source_url`, deep-dive portal, or
tracking source was fetched and confirmed live in this session, not
carried over unverified from the earlier evaluation pass alone.

**Slovenia (SI)** — two-tier regime, both tiers real and dated:
- `si-b2g-2015` (anchor + on_tracker, `mandate_scope: 'b2g_only'`): the
  long-standing public-sector obligation, sourced to a gov.si notice
  (stopbirokraciji.gov.si) plus UJP's own e-Racuni portal.
- `si-zierded-enacted` (anchor only, deep-dive timeline context): ZIERDED's
  Official Gazette publication, 6 Nov 2025 (Uradni list RS, st. 85/2025).
- `si-epath-providers-2027` and `si-b2b-mandatory-2028` (on_tracker,
  `mandate_scope: 'b2b'`, confidence NULL since this is enacted, not
  draft, law): the two-stage rollout. Art. 24/25 penalty figures
  (EUR 1,000-3,000 core; EUR 500-1,500 consumer-invoice) independently
  re-fetched from the gazette text in this session, including the exact
  Art. 25 breakdown the earlier evaluation pass hadn't drilled into.
- Deep-dive content flags the one real gap from the evaluation (UJP is
  the B2G hub operator, not a confirmed OpenPeppol Peppol Authority) and
  deliberately omits two secondary-only claims (a ZZI "Exchange Hub", a
  FURS "miniBlagajna" tool) that couldn't be corroborated on a primary
  page in this round either.
- Map status: **"upcoming"** (firm B2B milestones enacted but not yet in
  force) — verified via a local replay of `computeCountryMapStatus()`'s
  logic against the built migrations.
- One story: ZIERDED's enactment (a real, dated news event). No second
  story was invented.

**Iceland (IS)** — B2G-only, deliberately built so it maps correctly:
- `is-reg44-2019` (anchor only) plus `is-b2g-state-2019` and
  `is-b2g-municipal-2020` (both on_tracker, `mandate_scope: 'b2g_only'`,
  dates already past today) — this on_tracker pairing is what makes
  `computeCountryMapStatus()` resolve to **"b2gonly"** rather than
  "tracked" (Iceland has no B2B milestone, so without an on_tracker
  b2g_only entry the map would show it as a bare "tracked" pin) — this
  was Dan's explicit instruction and was verified by replaying the
  status logic locally, not just asserted.
- No `deep_dive_penalty_rows` — no statutory penalty regime exists,
  confirmed by the EU Commission's own (self-flagged "NO VERIFICATION")
  Iceland country sheet; penalties_related uses narrative cards only,
  matching the Japan/Finland/UK/New Zealand/US precedent.
- The vendor-only "1 July 2026 BII-to-Peppol-BIS-3.0 retirement" claim
  flagged as unverifiable in the evaluation was checked again from
  scratch in this build and still traces to no primary source — it
  appears nowhere in the shipped content, including in a dedicated card
  that names and rejects it explicitly so a future editor doesn't
  reintroduce it from a vendor blog.
- No story: nothing in Iceland's e-invoicing history has changed since
  the 2019-2020 rollout completed, and this project's sourcing standard
  doesn't stretch to inventing a news event to hang a story on.

**Both countries**: full EN/ES/DE/FR deep-dive content (pages, 4-5 stats,
7 cards each, 4-5 steps, 2-3 portals), full 4-language milestone
translations, tracking-source entries (Slovenia: gazette + UJP portal +
EU factsheet; Iceland: regulation text + Fjarsysla rikisins + EU
factsheet, flagged as itself unverified per the Commission's own status
table), `countries.js` and `shared/deep-dive-render.mjs`'s two lookup
tables updated, i18n `countryNames` dictionaries updated by hand in all
8 affected JSON files (the `generate_files.py --remote` regeneration
script needs live `wrangler` D1 access this sandbox doesn't have — see
below), and the jurisdiction-count sweep (54 -> 56, migration 424,
verified against the actual pre-migration DB state rather than assumed).
Full in-memory replay across all 424 migrations: 0 errors beyond the 4
long-documented pre-existing ones.

**One side finding, not fixed here (pre-existing, out of scope for this
build)**: the hand-maintained `countryNames` dictionaries inside
`i18n/*.json` (as opposed to `shared/deep-dive-render.mjs`'s own,
separately-maintained dictionary, which *is* current) are missing
roughly 17 countries added over the project's history — Jordan, Israel,
Oman, Czech Republic, Hungary, Turkey, Costa Rica, Uruguay, and others.
These are a silent-fallback-to-English gap (the tracker board and
subscribe page just show the untranslated name on ES/DE/FR pages for an
unlisted country), not a broken page — but worth a dedicated cleanup
pass via `generate_files.py --remote` once run against live D1, rather
than papering over it by hand-listing 17 more entries as a side effect
of this build.

**Deploy needs two steps this time, not one** — `countries.js` and
`shared/deep-dive-render.mjs` are static files the `site-worker` Worker
serves directly, so a content-only `apply_migrations.py --remote` run
is not sufficient by itself:
1. `python3 apply_migrations.py --remote` (from `members-worker/`) —
   applies migrations 412-424.
2. `wrangler deploy` from `site-worker/` — ships the static-file edits
   (`countries.js`, `shared/deep-dive-render.mjs`, the 8 `i18n/*.json`
   files) so the new countries appear on the subscribe page, deep-dive
   routing, and translated country names.

Both steps confirmed done by Dan the same day — Slovenia and Iceland
are live on the site.

Not yet done, pending a live D1 connection: running
`generate_files.py --remote` + `compare_generated.py` to confirm the
by-hand i18n edits above match what the generator itself would produce
(ADDING-A-COUNTRY.md's Phase 2 step) — the by-hand edits were verified
by diffing before/after (4-line minimal diff per file, same formatting
preserved) rather than via the generator itself, since this sandbox has
no `wrangler` credentials.

## 6 Aug 2026 (cont'd, again) — author bio updated; Education-panel font bug fixed across all 7 in-page panels (deployed & confirmed live)

**Author bio (`about.authorP1`/`about.authorP2`)** — Dan supplied replacement
copy for the "About the author" pop-out (the same text that had been added
3 Aug 2026), refreshing the framing around why he built the site. Updated in
`einvoicing-compliance-tracker.html`'s HTML fallback text and in all four
`i18n/*.json` files (`en`, and hand-translated into `es`/`de`/`fr` matching
the existing translation register); `EN` remains authoritative per
`_meta.reviewedNote`. Static-file-only change, no migration.

**Education-panel font bug** — Dan reported the "light" cream boxes near the
top of the Education pages rendering in a fallback sans-serif (Arial)
instead of the site's `IBM Plex Sans`, but only when opened as an in-page
panel from the main tracker, not when the same page loads standalone
(a clarifying detail Dan added mid-investigation that redirected the
diagnosis away from the standalone `education-*.html` pages' own CSS,
which checked out fine, toward the shared shadow-DOM panel-opening code).

Root cause: `open*Page()` builds each in-page panel by fetching the
standalone page's HTML, then carrying only its inline `<style>` block into
a new shadow root — the fetched page's `<head>`, and with it its own Google
Fonts `<link>`, is discarded. This works in practice only because the
parent tracker page happens to already load the same three font families,
so the shadow tree has been relying on implicit, undocumented sharing of
already-loaded font resources across the shadow boundary rather than having
its own guaranteed route to them. (`getComputedStyle()` checks confirmed
`font-family: "IBM Plex Sans", sans-serif` was correctly declared and
inherited in both the standalone and in-panel contexts either way, so this
is a defensive, spec-compliant fix for a real architectural gap rather than
a confirmed reproduction of a rendering-level font substitution — screenshot
comparisons at the tested sizes were inconclusive through compression, and
Dan's direct, specific report was trusted over continuing to chase an
unconfirmed root cause.)

Fix: a new shared `PANEL_FONT_IMPORT` constant (a CSS `@import` of the same
Google Fonts URL already loaded in the main page's `<head>`), prepended to
each panel's scoped CSS before it's injected into the shadow root — giving
every shadow root its own self-contained font-loading route instead of
depending on inheritance. Applied to all 7 panel-opening functions that
share this pattern, not just Education — Dan confirmed via a direct
question that the same latent gap should be fixed everywhere rather than
left for Education alone: `openDeepDive()`, `openSourcesPage()`,
`openMapPage()`, `openArchive()`, `openEducationPage()`, `openFeedbackPage()`,
and `openSubscribePage()`. Verified the full inline-script block still
parses with no syntax errors after all 7 edits.

Static-file-only change (`einvoicing-compliance-tracker.html`), no
migration — deploy is a single `wrangler deploy` from `site-worker/`.
Confirmed deployed the same day: Dan pulled and pushed the bundle, and
`site-worker`'s `git log` shows `main`/`origin/main` at `114af60`.

**Also from this session, not yet built into the real site**: Dan asked for
a mock-up of a new home-page carousel filling empty real estate on the main
tracker (rotating links to the map, newsletter archive, subscribe, and a
"Featured Content — coming soon" slide; "Sponsor This Site" designed but
hidden pending a sponsorship model). Iterated through several rounds of
feedback (position/sizing, richer hand-authored SVG thumbnails instead of
icon-style badges to match two reference images Dan supplied, desktop-only
visibility matching the site's existing 900px mobile breakpoint) to a
"Perfect!"-approved final design, but this exists only in a standalone
mock-up file (`carousel-mockup-preview.html`) — Dan has not yet asked for it
to be integrated into `einvoicing-compliance-tracker.html`, so it remains
unbuilt in the real site pending that instruction.

## 6 Aug 2026 (cont'd, again) — header feature carousel built into the real site (deployed & confirmed live)

Dan asked to go ahead and build the previously-approved carousel mock-up
into the real site. Ported `carousel-mockup-preview.html` (see the earlier
6 Aug 2026 entry for its design history — the empty real estate on the main
tracker's header, hand-authored SVG thumbnails after Dan flagged the first
icon-badge pass as "too icon/emoji", desktop-only) directly into
`einvoicing-compliance-tracker.html`:

- CSS added next to the existing `.topbar-right` rules (all values reuse
  the site's own custom properties -- `--ink-2`, `--line`, `--text-lo`,
  `--muted`, `--stamp`, `--soon` -- no new color literals introduced except
  inside the SVG thumbnails themselves, which were already confined to the
  dark-navy/steel-blue family in the mock-up).
- Markup added inside `.topbar-right`, as a sibling after `.topbar-menus`
  (matching the mock-up's structure exactly) -- three real slides (View the
  Map → `/map`, View the News → `/members/archive`, Subscribe →
  `subscribe.html`) plus a non-clickable "Featured Content" coming-soon
  slide. Sponsor This Site stays commented out in the JS pending an actual
  sponsorship model, per Dan's 6 Aug instruction.
- JS ported into a new `wireFeatureCarousel()` function (SVG gradient/filter
  IDs renamed with a `car` prefix to avoid collisions with any other
  inline SVG on the page) and called from the page's own init sequence,
  right after `wireAboutModal()` and before `wireDeepDiveInPagePanel()`.

**No new click-interception code needed** -- the carousel's `/map`,
`/members/archive`, and `subscribe.html` hrefs were deliberately written to
match exactly what `wireDeepDiveInPagePanel()`'s existing delegated
document-level click listener already checks for, so the carousel's links
get in-page-panel treatment automatically. Verified this live, not just
assumed: injected the carousel's CSS/HTML/JS into the actual production
page via a scripted browser session, clicked "View the Map", and confirmed
it opened the in-page Map panel (the tracker board area swapped to "The
Compliance Map" with a "← Back to the tracker" link, page title/history
updated) rather than performing a real navigation. Also confirmed the
`@media(max-width:900px)` rule hides the carousel cleanly at mobile widths
(resized to 700px, no leftover gap in the header), and checked the browser
console for errors during all of the above (none).

Syntax-checked the full inline script block after the edit (same
`new Function()` parse check used earlier this session) -- no errors.

Static-file-only change (`einvoicing-compliance-tracker.html`), no
migration -- deploy is a single `wrangler deploy` from `site-worker/`.
Confirmed deployed the same day: Dan pulled and pushed the bundle, and
`site-worker`'s `git log` shows `main`/`origin/main` at `708afa2`.

## 6 Aug 2026 (cont'd, again) — carousel: made translatable, moved next to the perks box

Two follow-up requests on the just-shipped header carousel:

**1. Carousel text wasn't translating.** The carousel's eyebrow/title/desc
strings were plain JS literals in `wireFeatureCarousel()`'s `SLIDES` array,
never tagged for the site's `data-i18n` mechanism, so switching languages
left them in English while everything else on the page translated. Fixed
by adding a `carousel` section (12 keys: `map`/`news`/`subscribe`/
`featured` x `Eyebrow`/`Title`/`Desc`) to all four `i18n/*.json` files, and
rendering each slide's text with a `data-i18n="carousel.<key>"` attribute
alongside the English fallback content -- the same pattern every other
translatable element on the page already uses. No new re-render logic was
needed: `i18n.js`'s existing `applyToDom()` already walks every
`data-i18n` element on the page on load and on every language switch, and
since it queries the live DOM each time, it picks up the carousel's slides
automatically once they carry the attribute. (Es/De/Fr translations
written to match the existing translation register in each file.)

**2. Moved next to "Subscribers Also Get", equal height.** The carousel
used to live in `.topbar-right` (upper right of the header, alongside the
Resources/Education/Menu buttons) at a fixed 360px width. Moved it into a
new `.perks-row` flex wrapper alongside `.subscriber-perks` inside
`.brand-row`, with `.perks-row`'s `align-items:stretch` (the flex default,
stated explicitly) making the two boxes match height regardless of width --
`.site-carousel` was changed from a block box to `display:flex;
flex-direction:column` with `.car-track{flex:1}` so its slide content
actually fills whatever height stretching gives it, rather than leaving a
gap. The old fixed `width:360px; margin-top:14px; align-self:flex-end`
rules (meaningful only in the old `.topbar-right` position) were removed.
(First pass gave both boxes the same capped `max-width:520px` for equal
width too -- superseded by the follow-up below the same day.)

Verified live against the production page before shipping: injected the
updated CSS/HTML/JS, measured `.subscriber-perks` and `.site-carousel`'s
`getBoundingClientRect()`, then extended `window.EICC_I18N.strings.carousel`
with the same French text going into `i18n/fr.json` and called the real
`applyToDom()`, confirming all 4 slides update correctly (screenshotted).
Also re-confirmed the carousel still hides cleanly at mobile widths and
that clicking a slide still opens the right in-page panel (unaffected by
the move -- the hrefs and click-interception logic didn't change).

**3. Follow-up the same day: flex the carousel to the remaining page
width, right-aligned with "Getting Around This Site".** The equal-520px-
width pairing from #2 left a large block of empty space to the right of
the carousel (since the row's available width was much wider than 2x520px
on a normal desktop viewport) and didn't reach the same right edge as the
`nav-tips` panels below. Two changes:

- `.perks-row`'s sizing was split: `.subscriber-perks{flex:0 1 520px}`
  keeps its old content-driven width (never grows past it), while
  `.site-carousel{flex:1 1 320px}` (no `max-width` cap) grows to consume
  whatever's left in the row.
- `.brand-row` (containing `.perks-row`) was pulled out from being nested
  inside `.topbar-brand`'s `flex:1 1 320px` share of the old single-row
  `.topbar` and made a full-width sibling instead. `.topbar` is now
  `flex-direction:column` with two stacked children: a new
  `.topbar-header-row` (the eyebrow/title block + the Resources/
  Education/Menu buttons -- takes over the old row layout/wrap behavior)
  on top, then `.brand-row` (description + perks-row) spanning the full
  topbar width below it. This was necessary because as long as
  `.brand-row` shared a row with the menu buttons, its flex-grow could
  only ever fill the space *not* claimed by those buttons -- it could
  never reach the same right edge as `.nav-tips-wrap` (which has no
  competing sibling and gets the full 5vw-padded content width).

Verified live: replaced the deployed page's `.topbar` outerHTML with the
new two-row structure (menu-button dropdown *panels* were stubbed out for
this test since only the layout was under test, not dropdown behavior --
unaffected by this change) plus the updated CSS, then measured via
`getBoundingClientRect()`: `.site-carousel.right` and `.nav-tips.right`
both came back as exactly the same pixel value (1824px at the tested
viewport width), and `.site-carousel`/`.subscriber-perks` heights matched
too (186px each). Confirmed no console errors and the page's other topbar
content (title, description, perks box) rendered in the expected
positions.

Static-file-only change (`einvoicing-compliance-tracker.html` +
`i18n/*.json`), no migration -- deploy is a single `wrangler deploy` from
`site-worker/`.

## 6 Aug 2026 (cont'd, again) — carousel: header-hide regression fixed; slides centered/enlarged; rotation slowed

Three follow-up fixes on the carousel, reported/requested the same day:

**1. Bug fix: opening a carousel link left the page heading, description,
perks box, and carousel itself visible behind the opened panel.** Dan
reported this and noted it behaved differently from opening the same panel
via the menu link. Root cause: every in-page panel (`openMapPage`,
`openSourcesPage`, `openArchive`, `openEducationPage`, `openFeedbackPage`,
`openSubscribePage`, `openDeepDive`, and their matching `close*` functions
-- 7 pairs, 14 functions total) hides/restores the header via
`document.querySelector('.topbar-brand').style.display = 'none' / ''`.
That was written back when `.brand-row` (description + perks box +
carousel) was nested *inside* `.topbar-brand`, so hiding the parent hid
everything together. The same-day topbar restructure above (flexing the
carousel to the full page width) pulled `.brand-row` out to be a *sibling*
of `.topbar-brand` instead of a child -- so the existing hide logic only
ever hid the eyebrow/title, and `.brand-row`'s contents were stranded
visible. Fixed by adding a matching `document.querySelector('.brand-row')`
hide/show alongside every one of the 14 existing `topbarBrand` toggles.

Verified live against production: reproduced the bug first (clicked a
carousel slide, confirmed via screenshot that the description/perks/
carousel remained visible above the opened Newsletter Archive panel while
only the eyebrow/title correctly hid), then patched the fix onto the
live page's already-global `open*`/`close*` functions (they're top-level
function declarations, so reachable as `window.openMapPage` etc.) by
wrapping each to additionally toggle `.brand-row`, clicked into "The
Map" panel, and confirmed via `getComputedStyle`-equivalent checks that
both `.topbar-brand` and `.brand-row` report `display:none` and
`offsetParent === null` while the panel is open, then confirmed both
fully restore (`display:''`, visible again) after clicking "← Back to
the tracker".

**2. Carousel content centered; thumbnail and text enlarged.** Dan asked
for the thumbnail image and text to be centered in the (now much wider)
carousel box, with both a little larger. `.car-slide` gained
`justify-content:center` (new) and `align-items:flex-start` →`center`;
`.car-body` changed from `flex:1` (which claimed all remaining row width
and left nothing for centering to redistribute) to a capped `flex:0 1
360px`, so the thumb+text group now centers as a unit instead of pinning
to the left edge. Thumbnail grew 84px → 104px; eyebrow 10px → 11px; title
18px → 21px; description 11.5px → 13px.

Verified live: injected the new rules as `!important` overrides on top of
the deployed CSS and measured `getBoundingClientRect()` on the thumbnail
and body -- the midpoint between the thumbnail's left edge and the body's
right edge landed at exactly the same x-coordinate as the carousel box's
own midpoint (1363px, both), confirming true horizontal centering rather
than an approximate visual match.

**3. Rotation slowed.** `ROTATE_MS` (the auto-advance interval in
`wireFeatureCarousel()`) changed from 3500ms to 5000ms per Dan's request,
giving each slide 5 seconds before advancing instead of 3.5.

Static-file-only change (`einvoicing-compliance-tracker.html` only this
round -- no i18n file changes), no migration -- deploy is a single
`wrangler deploy` from `site-worker/`.

## 6 Aug 2026 (cont'd, again) — real root cause found for the Education-panel font bug: a regex collision, not a font-loading gap

Dan reported (with the exact quoted text and later the exact `data-i18n` key,
`sec1.card1.body`) that the card body text on all four Education pages --
not the headings, which were already confirmed correct -- looked like it
was rendering in the wrong font when opened as an in-page panel, though it
looked right on the standalone page. The 5 Aug fix (`PANEL_FONT_IMPORT`,
see the "Education-panel font bug" entry above) turned out to be treating
a symptom of a *different*, unconfirmed problem -- this time the actual
root cause was found and fixed.

Repeated live testing (computed styles, `document.fonts.check()`, canvas
font-metric comparisons, and a side-by-side standalone-vs-in-panel
screenshot diff) kept coming back clean: `font-family` was correctly
`"IBM Plex Sans"` and genuinely loaded in both places. That was true, but
it was the wrong question -- Dan's report was about the box content, not
just its font-family, and comparing font-*family* alone missed that
`font-size` and `color` were also wrong. Dan then pointed to the exact
`data-i18n` key, which led to inspecting the shadow root's actual injected
`<style>` content directly (`root.querySelector('style').textContent`)
rather than trusting `getComputedStyle()` in isolation -- and the
`.spec-card p.body{font-size:13px; color:#4a4030; ...}` rule (present in
every education page's source `<style>` block, confirmed via a raw
`fetch()` of the live file) was simply *missing* from the CSS actually
injected into the shadow root, even though a sibling rule two lines away
(`.spec-card h3{...}`) came through fine.

Root cause: every `open*Page()` function (all 7 -- `openDeepDive`,
`openSourcesPage`, `openMapPage`, `openArchive`, `openEducationPage`,
`openFeedbackPage`, `openSubscribePage`) rewrites the fetched page's
top-level `body{...}` element selector to `:host{...}` before injecting it
into the shadow root, since a real `<body>` element doesn't exist inside a
shadow tree. Six of the seven did this with
`.replace(/body\{/g, ':host{')`; the seventh (`openArchive`) did the same
thing even less safely with a single, non-global
`.replace('body{', ':host{')`. Both forms match the literal substring
"body{" *anywhere* in the CSS text, with no check for what precedes it --
so a class selector like `.spec-card p.body{...}` gets silently mangled
into `.spec-card p:host{...}`, an invalid selector outside a shadow root's
own top-level scope that the browser just drops. `font-family` still came
back correct only because it's an inherited property, falling back to the
(correctly rewritten) `:host{font-family:'IBM Plex Sans'...}` rule one
level up -- masking the fact that the more specific, intended rule had
been silently destroyed. Confirmed live: after manually re-applying a
corrected version of the CSS to the open panel, `sec1.card1.body`'s
computed `font-size` went from `16px` (browser default -- the rule was
gone) to the correct `13px`, and `color` went from an inherited `#241d10`
to the intended `#4a4030`.

Dan flagged that this exact class of bug had already bitten once before,
on a country deep-dive card (commit `d35d21a`, "Fix font sizing of
body-text on Pakistan's compliance-gap card") -- that fix worked around it
by naming the new class `.body-text` instead of `.body`, which happens to
dodge the "body{" substring collision without anyone having diagnosed the
regex itself as the problem. Given the same landmine is still live for any
class ending in exactly `.body` (or `#some-id-body`, `.foo-body`, etc.),
fixed the regex itself instead of relying on nobody ever naming a class
that ends in "body" again: all 7 occurrences now use
`.replace(/(?<![.\w#-])body\{/g, ':host{')` -- a negative lookbehind that
only matches a bare `body{` selector (at the start of the stylesheet,
after whitespace/comma/`}`), not one immediately preceded by `.`, `#`, a
word character, or `-`. Verified against a battery of cases including the
four education pages' `.spec-card p.body`, `subscribe.html`'s
`.benefit-list .b-body` and `.modal-body` (same latent bug, not yet
reported by Dan but now fixed pre-emptively), and legitimate bare
`body{`/`html,body{` selectors, which still correctly rewrite to `:host{`.

Static-file-only change (`einvoicing-compliance-tracker.html`), no
migration -- deploy is a single `wrangler deploy` from `site-worker/`.

## Cross-region coverage evaluated (6 Aug 2026) -- not yet built

Dan asked which additional countries are worth addressing next, without
specifying a region. Rather than repeat the existing per-region
evaluations (Middle East, Asia-Pacific, and Americas coverage were each
already evaluated earlier this project -- see those dated entries above,
and note the Americas one already has six recommended-but-unbuilt
candidates: Dominican Republic, Guatemala, Paraguay, Bolivia, Panama, El
Salvador), this pass live-researched **Europe**, which had never had a
dedicated coverage evaluation despite being the tracker's largest region
(26 of 56), plus rechecked whether anything in MENA/Asia-Pacific had
moved since the last look. Same bar as every prior evaluation: a firm,
dated, in-force (or imminently in-force) mandate outranks a "discussed
but no timeline" one.

Ranked findings, folded together with the still-open Americas list into
one cross-region order:

1. **Serbia (Europe) -- strongest candidate, no caveats.** SEF/e-Faktura
   has been a mature, mandatory B2B clearance system since 2023 -- one of
   the most established non-EU CTC mandates on the continent, and a
   notable, visible gap given how many smaller/thinner European mandates
   are already tracked. E-delivery notes (e-otpremnica) become mandatory
   by end of 2026, giving a genuinely live 2026 milestone to anchor a
   build on, not just historical dates.
2. **Latvia (Europe) -- strongest candidate, already in effect.**
   Mandatory e-invoicing and e-reporting took effect **1 January
   2026** -- already live as of today, not a future date. EU/ViDA-
   relevant, and a glaring omission for a site whose whole model is
   "what's the deadline and what do you do about it."
3. **Kazakhstan -- strongest candidate, already in effect.** B2B
   e-invoicing became mandatory on the IS ESF portal from **January
   2026**, expanding to all VAT and select non-VAT payers through the
   year. A large Central Asian economy with a real, dated, currently-
   enforced mandate. Flagging the same open question Turkey raised: this
   tracker's regions are Europe/MENA/Asia-Pacific/Americas, and
   Kazakhstan doesn't sit cleanly in any of them -- worth confirming
   with Dan which region it should join before scaffolding (Asia-Pacific
   is the closest existing bucket, same reasoning that ultimately placed
   Turkey in Europe by explicit choice rather than assumption).
4. **Dominican Republic (Americas) -- already the top unbuilt Americas
   candidate, and still moving.** Carried over from the 4 Aug Americas
   evaluation; this pass confirmed it's still actively developing news,
   not stale -- a May 2026 mandatory-registration deadline, since
   extended six months for MSMEs and unclassified taxpayers to November
   2026. Real, current, deadline-driven -- exactly this site's content
   model.
5. **Bulgaria (Europe) -- real and dated.** SAF-T reporting begins in
   2026 (already offered to Dan on 5 Aug alongside Uruguay/Costa Rica but
   not chosen then); B2G e-invoicing already live, B2B plans forming.
   EU/ViDA context makes this a natural companion story to Latvia's.
6. **Paraguay (Americas) -- real, dated, actively phasing in.** Carried
   over from the Americas evaluation; SIFEN already mandatory for
   government suppliers, with Resolution 52/2026 staging six more
   taxpayer groups from June 2026 through September 2027 (deadline
   recently extended in the same window).
7. **Estonia (Europe) -- real, proposed, EU momentum story.** B2B
   e-invoicing proposed for 2027; pairs naturally with Latvia and
   Bulgaria as a "the Baltics and EU periphery are moving" narrative
   rather than a single isolated country.
8. **Guatemala (Americas) -- real, enacted, narrower scope.** Carried
   over from the Americas evaluation; FEL mandatory since 2023 for
   SAT-designated taxpayer categories, not a universal mandate.
9. **Qatar (MENA) -- re-checked, status unchanged since the 4 Aug
   hold-back.** Still only Cabinet-approved draft law and executive
   regulations (confirmed via EY, KPMG, and vatcalc, all describing the
   same May 2026 Cabinet approval) -- has not advanced to Shura Council
   review or the Amir's assent. Same "expected, not yet enacted" tier as
   before; worth a periodic recheck (this is the second recheck with no
   material change) rather than building now. Would be a natural third
   GCC addition alongside UAE and Saudi Arabia once it clears enactment.
10. **El Salvador / Bolivia / Panama (Americas) -- carried over from the
    Americas evaluation**, real but individually-noticed (El Salvador)
    or less crisply sourced on scope/penalties (Bolivia, Panama) than
    the countries ranked above them.
11. **Bahrain (MENA) -- re-checked, still not concrete enough.** No
    confirmed mandate or dates found beyond the NBR's 2023 removal of its
    prior-approval requirement for voluntary e-invoicing. Unchanged from
    the 3 Aug hold-back.
12. **Switzerland, Thailand -- watch-list only, no confirmed mandate.**
    Switzerland has no B2B clearance mandate on the horizon (eBill/Peppol
    stay voluntary); Thailand's e-Tax Invoice system was explicitly
    reconfirmed as still voluntary in July 2026 coverage, with only
    incentive-based signals toward an eventual mandate. Neither has a
    real deadline to anchor a deep-dive on yet.

**Recommendation:** Serbia, Latvia, and Kazakhstan first -- all three
have real, currently-in-force mandates (not future dates) and fill
genuine, visible gaps (Serbia in an under-covered mature-CTC segment of
Europe; Latvia and Kazakhstan both live as of this year, making their
absence the most "site says nothing about a deadline that already
passed" kind of gap). Dominican Republic and Bulgaria are equally strong
next picks. Nothing in this list has been built -- this is evaluation
only, matching the pattern already established for Middle East/Asia-
Pacific/Americas coverage above.

## 6 Aug 2026 (cont'd, again) — Serbia (#57) and Latvia (#58) built,
## deployed & confirmed live; a long-standing "48 countries" static/D1
## drift bug found and fixed

Per Dan's "Yes, please do serbia and latvia," both were built following
`ADDING-A-COUNTRY.md`'s runbook, using Slovenia/Iceland (412-424) as the
structural template. Migrations 425-436, all replay-validated (see
below).

**Serbia (migrations 425-426, 428, 430, 433, 435).** A mature,
centralized-clearance regime, live since 2023 -- deliberately researched
*deeper* than the original evaluation pass, not just re-confirmed.
Sourced via Serbia's own Legal Information System
(pravno-informacioni-sistem.rs), Ministry of Finance legal-text pages
(mfin.gov.rs), and the official SEF portal (efaktura.gov.rs), cross-
checked against Paragraf.rs (a reputable secondary legal compiler,
flagged as such rather than gazette-primary) and several independent
advisories. Key finding beyond the original evaluation: the "e-delivery
notes mandatory by end of 2026" detail flagged there turns out to
conflate two *distinct* developments -- the e-otpremnica (e-delivery
note) system's own two-phase rollout (Phase 1: public sector/excise
goods/carriers, live 1 Jan 2026, grace period to 30 Jun 2026; Phase 2:
general private-sector B2B, 1 Oct 2027) is a separate law
(Zakon o elektronskim otpremnicama) from a further "expanded B2B"
e-invoicing reform package (new SEF fields, stricter validation, new
penalty regime) that secondary sources (Fiscal Solutions, citing an
unlocated primary MoF announcement) describe as postponed to "end of
2026" -- kept as two distinct, clearly-flagged items on the deep dive
rather than merged into one. 6 milestones, 5 stats, 7 cards (2
file_format, 2 scope_transmission, 3 penalties_related -- including an
explicit "what we could not confirm" card), 5 steps, 3 portals, 1 story
(the e-otpremnica Phase 1 launch), 3 tracking sources -- all in
EN/ES/DE/FR.

**Latvia (migrations 427, 429, 431, 434, 436).** **Important correction
to the prior evaluation pass**: that pass assumed Latvia's B2B mandate
took effect 1 Jan 2026. Live re-research found this is now out of date
-- the Saeima adopted amendments on 5 June 2025 postponing the B2B
go-live to **1 January 2028**, confirmed by 5+ independent sources
including a 22 July 2026 update, with no further delay reported since.
What's actually live: B2G e-invoicing (mandatory since 1 Jan 2025) and
mandatory e-invoice data-reporting to VID for B2G/G2G/G2B (since 1 Jan
2026), plus a voluntary B2B phase open since 30 Mar 2026 via the free
eAddress platform. The European Commission's own Latvia eInvoicing
country factsheet has **not** been updated since the postponement and
still shows a 1 Jan 2026 B2B date -- this is called out explicitly on
the deep dive, in the tracking-sources description for that factsheet,
and as the entire subject of the launch story, rather than silently
worked around. One item flagged unverified: Cabinet Regulation No. 749's
full text (likumi.lv fetch blocked in this session) was confirmed only
via a secondary summary (numbero.app), not read directly -- flagged on
the relevant milestone and card. 7 milestones, 5 stats, 6 cards (2
file_format, 2 scope_transmission, 2 penalties_related -- one of which
states plainly that no dedicated e-invoicing penalty schedule has been
published yet, rather than inventing one), 5 steps, 3 portals, 1 story
(the postponement itself), 3 tracking sources (including the EC
factsheet, deliberately kept but caveated rather than dropped) -- all in
EN/ES/DE/FR.

**Phase 2/3 static-file edits:** `countries.js` (Europe array) and
`shared/deep-dive-render.mjs` (`COUNTRY_DEEP_DIVE_SLUGS` +
`COUNTRY_NAME_TRANSLATIONS` es/de/fr) updated for both countries. The
Map needs no `TOPO_NAME_OVERRIDES`/`MARKER_LONLAT_OVERRIDES` -- both
"Serbia" and "Latvia" exist verbatim in `vendor/countries-50m.json`'s
topology, confirmed by direct lookup.

**A second, unplanned fix, per Dan's mid-build flag**: Dan noticed the
tracker's own header paragraph still said "48 countries" despite the
site being well past that count. Investigating turned up something
worse than a one-line staleness: **migration 424 (5 Aug->6 Aug) had
already correctly updated D1's `translations` table from 54 to 56**,
but the *static* `i18n/*.json` mirror files that `site-worker` actually
serves -- plus meta descriptions and `data-i18n` fallback text across 7
HTML files -- were never regenerated to match, and were still showing
**48**, several country-additions stale (not just one). `generate_files.py`
(the documented D1-to-static regenerator) evidently hasn't been run
against live D1 in a long time, so D1 and the deployed static assets had
quietly diverged. Found via a targeted structural scan (not a blind
`grep 48`, to avoid false positives like `#1c2c48` hex colors, SVG path
coordinates, and `gap:48px` CSS) across all 31 affected files: `i18n/en
|es|de|fr.json` (`brand.description`, plus `countryNames` additions for
Serbia/Latvia), all 16 `i18n/{lang}-edu-*.json` files (`statusBanner
.text`, `sec#.card3.body`), all 4 `i18n/{lang}-subscribe.json` files
(`benefits.intro`, `benefits.item2.body`, `card.countriesHint`,
`confirm.fullDigest`), and 7 HTML files (`einvoicing-compliance-
tracker.html`'s 3 meta tags + `brand-sub` paragraph, `index.html`'s meta
tag, `subscribe.html`'s 3 meta tags + 3 body paragraphs + the raw `48`
stat digit, and the 4 education pages' `sec#.card3.body` fallback
paragraphs and, for certified-providers, its `statusBanner.text`). All
corrected directly to **58**, reusing migration 424's already-good
wording (just swapping the digits) rather than re-deriving new prose.
Migration 432 keeps D1 in sync at 58, continuing the exact `UPDATE ...
WHERE ... AND value = '<old text>'` pattern migration 424 established.
**Recommend running `generate_files.py --remote` after every future
country add's migrations are applied, and diffing its output against
`i18n/` before shipping** -- that's the gap that let this drift happen
silently across several country additions.

**Verification:** `apply_migrations.py`'s own `validate_replay()` run
directly (no wrangler/network needed) against the full 436-file chain --
clean, only the 4 pre-existing documented errors. A deeper structural
replay (schema + every migration into an in-memory DB, then querying
row counts) confirmed: both countries' full row sets (milestones,
deep-dive pages/stats/cards/steps/portals, stories, tracking sources)
have exactly the 4 expected languages (en/es/de/fr) on every
translatable row, no orphaned or missing translations; total non-EU
`countries` count is exactly 58. Also grepped the full repo post-fix to
confirm zero remaining stale country-count references anywhere in
`i18n/*.json` or `*.html`.

**Status: deployed and confirmed live.** Dan applied
`python3 apply_migrations.py --remote` (from `members-worker/`, migrations
425-436) and `wrangler deploy` from `site-worker/`, shipping the static-
asset edits (`countries.js`, `shared/deep-dive-render.mjs`, all edited
`i18n/*.json` and `*.html` files). Jurisdiction count is now 58, and both
Serbia and Latvia are live on the site alongside the corrected header
count.

## 6 Aug 2026 (cont'd, again) — tracker header: "Navigation Help" pop-out replaces the "Getting Around This Site" strip; new "Preparing for a Mandate" carousel slide; heading renamed to "Compliance tracker board" (deployed & confirmed live)

Three small Dan-requested tweaks to `einvoicing-compliance-tracker.html`,
none touching D1 — pure static-file changes to the tracker page and its
4 i18n files.

**"Getting Around This Site" moved into a pop-out.** Dan wanted the
arrivals board more visible without losing the 4 navigation tips
entirely. The full-width `.nav-tips-wrap` strip that used to sit
directly above the arrivals board is gone from the page flow; its
exact same 4 tip-cards (same `data-i18n` keys, so no translation work
needed) now live inside a new `#navHelpOverlay` modal, built on the
identical open/close pattern as the existing "About this site" modal
(`wireNavHelpModal()`, mirroring `wireAboutModal()`). Reached via a new
"Navigation Help" item in the Menu dropdown (`#ddNavHelp`, next to
"About this site"). The tip-cards are re-themed for the modal's light
"paper" card (they used to sit on the dark topbar background) — new
`carousel.eyebrow`-style `navTips.eyebrow` key ("Help") added above the
existing `navTips.label` heading. New i18n keys: `menu.navHelp`,
`navTips.eyebrow`, all 4 languages.

**New carousel slide: "Preparing for a Mandate".** Added as the 4th
slide (after Subscribe, before the "Featured Content" coming-soon
placeholder), linking to `education-preparing-for-mandate.html` —
picks up the site's existing in-page-panel treatment for free, since
`educationPageFromHref()` already intercepts every Education page link
site-wide; no extra click-handling needed. New hand-authored inline
SVG thumbnail (`THUMB_PREPARE`, a clipboard with a checklist) matching
the existing thumbnails' construction (radial-gradient background,
glow filter on the highlighted checkmarks, same site color palette).
New i18n keys: `carousel.preparingEyebrow` ("Get ready"),
`carousel.preparingTitle` ("Preparing for a Mandate"),
`carousel.preparingDesc`, all 4 languages.

**Heading renamed.** `brand.eyebrow` ("The E-Invoicing Compliance
Corner"'s small caption above the title) changed from "Compliance
clearance board" to "Compliance tracker board" — English only; the
ES/DE/FR translations were already phrased generically ("Panel de
cumplimiento normativo", "Compliance-Übersicht", "Tableau de suivi de
conformité") and never said "clearance" in the first place, so none of
the 3 needed a matching edit.

**Verification**: `node --check` on the extracted inline script (0
errors). Headless-Chromium click-through via Playwright (both
`file://` and a local HTTP server) confirmed: the nav-tips strip no
longer renders in the page body; the Menu ▸ Navigation Help item opens
a modal with all 4 tip-cards intact; the modal closes via its × button;
the carousel now shows 5 slides including "Preparing for a Mandate";
and clicking that slide correctly opens the Education panel in-page
(confirmed via pushState, not a real reload — `#boardView`/
`#menuTrigger` still present in the DOM afterward) exactly like the
pre-existing Education-menu link to the same page.

**Deployed and tested** (confirmed by Dan): `site-worker` redeployed —
pure static-asset change, no D1 migration needed. The Navigation Help
pop-out, the new carousel slide, and the renamed heading are all live.

## 6 Aug 2026 (cont'd, again) — Kazakhstan (#59) and Dominican Republic (#60) built; "The Map" explainer added to Navigation Help (deployed & confirmed live)

Two new countries at Dan's request — "Kazakhstan under Asia-Pacific on
the map, and grouping" plus Dominican Republic — and a fifth Navigation
Help tip-card explaining The Map. Same discipline as Serbia/Latvia:
independent research agents per country (WebFetch against primary
government sources, every fact flagged CONFIRMED/PLAUSIBLE per the 6
Aug sourcing standard), then migrations written from the verified
findings, not agent recall. Migrations start at 437 (last used: 436).

**Kazakhstan (KZ, Asia-Pacific, slug `kazakhstan`).** A mature CTC
clearance regime, IS ESF (ИС ЭСФ): voluntary from 1 Jul 2014 (Gov't
Resolution No. 818), mandatory for all VAT payers from 1 Jan 2019
(confirmed directly against kgd.gov.kz's own news release), and
expanded from 1 Jan 2026 to universal VAT-payer coverage plus ~12
non-VAT-payer categories (commission/forwarding agents, customs
representatives, simplified-regime taxpayers, medical/pharma sellers,
law offices, importers, Virtual Warehouse participants) under a wholly
new Tax Code (Law No. 214-VIII, signed 18 Jul 2025) — alongside a
lowered VAT threshold (10,000 MRP) and a higher VAT rate (16%). 5
milestones (2 on_tracker: the 2019 mandate and the 2026 expansion, both
`mandate_scope='b2b'`); 5 stats, 2 file_format cards, 1 scope card + 1
lifecycle "clearance flow" card, 3 penalties_related cards, 5 steps, 1
portal, 1 tracking source, 1 launch story (the 2026 expansion).
**Flagged and deliberately excluded**, per the sourcing standard: a
rumoured pre-2019 "risk goods" mandatory wave (no independently-dated
source found); the exact current IS ESF public portal domain (search
results surfaced both "esf.gov.kz" and what looks like an unrelated
phishing-clone domain, so no portal URL cites it — only kgd.gov.kz's
own confirmed-live section pages are cited); Order No. 629's exact
Adilet primary-source page (adilet.zan.kz blocked automated fetching
on every attempt this session; sourced instead via two independent
secondary industry sites that agree on the order number/date); the
exact Administrative Offences Code Art. 280-1 penalty MRP figures
(corroborated by two independent secondary legal aggregators, not the
raw statutory text). Migrations 437-438 (country+milestones), 440
(deep-dive EN), 442 (ES/DE/FR translations), 445 (story), 447
(tracking sources).

**Dominican Republic (DO, Americas, slug `dominican-republic`).** A
real-time pre-validation clearance regime, e-CF (Comprobante Fiscal
Electrónico): voluntary pilot 2019, formalized as a voluntary regime by
Norma General 01-2020, made mandatory by Ley 32-23 (promulgated 16 May
2023, fetched directly from DGII's own hosted PDF), rolling out in
phased waves by DGII taxpayer-size category — Large National Taxpayers
from 15 May 2024, Large Local & Medium Taxpayers from an extended 15
Nov 2025 (Aviso 12-25), and Small/Micro/Unclassified Taxpayers from an
extended 15 Nov 2026 (Aviso 06-26) — the current final wave. From 1 Jan
2026, Large National Taxpayers may issue e-CF exclusively (Aviso 25-25
retired paper vouchers for that segment) — a genuinely new milestone
the original PROGRESS.md lead-research draft had missed entirely,
caught by this session's independent verification pass. 7 milestones (4
on_tracker: the 2023 law, and the three taxpayer-wave deadlines, all
`mandate_scope='b2b'`); 5 stats, 2 file_format cards, 1 scope card + 1
lifecycle "clearance flow" card, 3 penalties_related cards, 6 steps, 2
portals, 2 tracking sources, 1 launch story (the Jul 2026 filer-growth
update — registered electronic filers more than tripled in 6 months,
23,686 → 76,762). **Flagged and deliberately excluded**: Decreto
587-24's exact calendar day (three secondary sources disagree — 10, 14,
or 15 Oct 2024; DGII's own PDF could not be machine-read this session,
so this page cites "October 2024" without a specific day); the 2019
pilot's exact statistics (10 companies, 7 completed, ~723,000 e-CF —
traces to a single Dominican newspaper, not a DGII primary source); the
claim that e-CF's XML is UBL-based (a vendor-only claim from EDICOM;
DGII's own technical report doesn't name UBL). Migrations 437, 439
(milestones), 441 (deep-dive EN), 443 (ES/DE/FR translations), 446
(story), 448 (tracking sources).

**Region/Map placement.** Kazakhstan → Asia-Pacific per Dan's explicit
instruction, both in `countries.js` and D1's `countries.region`.
Dominican Republic → Americas, consistent with this tracker's existing
Latin American/Caribbean coverage (Colombia, Argentina, Peru, Chile,
Mexico, Costa Rica, Ecuador, Uruguay) — not explicitly stated by Dan
this time, but the clearly-intended region and consistent with this
project's own prior "Americas coverage evaluated" research notes.
Checked both new countries' English names against the vendored
world-atlas topology (`vendor/countries-50m.json`) directly rather than
waiting for a post-deploy console-warning check: Kazakhstan's name
matches the topology exactly (no override needed); Dominican Republic's
topology feature is spelled "Dominican Rep.", so a `TOPO_NAME_OVERRIDES`
entry was added in `shared/map-data.mjs` alongside the existing "United
States"/"Czech Republic" overrides.

**Phase 2 static-file edits**, all 3 touchpoints: `countries.js` (both
countries added to their region arrays); `shared/deep-dive-render.mjs`'s
`COUNTRY_DEEP_DIVE_SLUGS` (`kazakhstan`, `dominican-republic`) and
`COUNTRY_NAME_TRANSLATIONS` (es/de/fr for both, real translations —
Kazajistán/Kasachstan/Kazakhstan and República Dominicana/Dominikanische
Republik/République dominicaine); `i18n/{en,es,de,fr}.json`'s
`countryNames` (appended, matching the existing Serbia/Latvia pattern
at the end of each block rather than re-sorting the whole list).

**Jurisdiction-count sweep, 58 → 60.** Migration 444 mirrors 432's
`translations`-table UPDATE pattern exactly (40 rows: 10 distinct
namespace/key strings × 4 languages). Static files hand-corrected in
the same commit, per 432's standing process note (`generate_files.py`
still not confirmed current against live D1): every HTML file with a
literal "58 jurisdictions"/"58 countries" string (`subscribe.html`
including its `<div class="num display">58</div>` stat tile, both
education pages' cards, `index.html`'s meta description, the tracker's
own meta description and `brand.description` fallback) and all 23
`i18n/*.json` files carrying the same prose in 4 languages — found via
a first-pass regex that only matched "58" within ~3 chars of
"jurisdiction"/"countr", which missed several instances embedded in
longer phrases ("58 tracked jurisdictions", and the Spanish/German/
French translated files where "jurisdicciones"/"Rechtsordnungen"/
"juridictions" don't share a common substring with the English pattern)
— caught by a second, broader pass grep across every `i18n/*.json` file
for a bare `\b58\b` and manually confirming each hit was genuinely a
jurisdiction-count reference before replacing.

**"The Map" added to Navigation Help.** Dan's second request this
round: "add, under Navigation Help, on the Menu and addition section
identifying the Map, and what it's for." Added as a 5th tip-card
(🗺️) in the `#navHelpOverlay` modal built in the previous session's
tracker-header work, alongside the existing 4 (filter/deep-dive/
archive/collapsed-history tips) — same `.tip-card` markup, no new CSS.
New i18n keys `navTips.tip5Title`/`navTips.tip5Desc`, all 4 languages,
describing The Map as living in the Resources menu and linking to a
country's deep dive on click. Verified via headless-Chromium
(Playwright, local HTTP server): opening Menu ▸ Navigation Help shows
5 tip-cards, the 5th with the correct title/description text.

**Verification.** Full in-memory `validate_replay()` across all 448
migration files: OK, only the pre-existing documented errors, no new
ones. Structural queries against a fresh in-memory replay confirmed:
both countries' `country_translations` (4 rows each), milestone counts
(KZ 5/2 on_tracker, DO 7/4 on_tracker) and `mandate_scope` values,
100% milestone_translations and deep-dive-content-translation
completeness (4 languages, zero gaps, checked table-by-table:
stats/cards/steps/portals/lifecycle-cards/lifecycle-statuses), rows_json
shape consistency across all 4 languages per card, milestone `actions`
array-length consistency across languages, every `on_tracker` milestone
has at least one portal, and the site's own counting rule
(`slug IS NOT NULL AND in_picker = 1`, excluding the EU) returns exactly
60. `node --check` on the tracker's extracted inline script: 0 errors.

**Deployed and confirmed live.** Dan pulled, ran
`apply_migrations.py --remote` (all 12 migrations, 437-448, applied
clean after working through a Cloudflare OAuth token issue —
`wrangler whoami` showed a valid session but the live API calls were
hitting a stale-token 7403; a full `wrangler logout`/`login`
re-authentication cycle cleared it, consistent with this project's
prior Indonesia/Japan precedent for the same class of issue), then
`wrangler deploy` for site-worker. Dan confirmed: "there were no
errors this time applying migrations, and deploy successfully."
Kazakhstan (#59) and Dominican Republic (#60) are live on the tracker,
map, and deep-dive pages, and the 5th Navigation Help tip-card
explaining The Map is live.

## 7 Aug 2026 — "Clearance Mandates Compared" whitepaper written; Insights & Whitepapers hub goes live (in-frame panel + whitepaper pop-out + carousel slide activated)

Dan asked for an objective, citation-backed comparison of e-invoicing
CTC/clearance rollouts — grouping all 60 tracked jurisdictions by
implementation status and researching staged-vs-big-bang outcomes,
on-time delivery rates, real participation levels, treasury revenue
yields, and challenges. Then, in a follow-up request, asked for it to
be wired into the Insights & Whitepapers section, opening in a pop-out
"similar to About this site", with the carousel's featured slide
activated and the /insights hub itself opening in-frame rather than
standalone.

**The whitepaper** (`whitepaper-ctc-rollouts-compared.html`, repo
root, static asset, site-styled to match the education pages'
design system). Nine sections: scope/method (with an explicit
honesty note about the EC's Dec-2025 VAT-gap re-benchmarking and
revenue-attribution limits); all 60 jurisdictions grouped (25 live
clearance, 4 reporting-only CTC, 15 in-process, 16 no general B2B
mandate — counts verified to sum to 60 by script); staged-vs-big-bang
design taxonomy (threshold descent, invoice-value descent, B2G→B2B
ladder, regional pilot, segment big-bang, report-first-clear-later);
a 26-row on-time scorecard (~10 on time / ~8 held-with-shock-absorbers
/ ~9 slipped — every fully on-time programme was staged or
decentralised; Poland +19mo and France +26mo both attempted new
central platforms); all documented participation figures (Korea 99.8%,
DR 96%, Vietnam 92%, Malaysia >90%, Colombia ~88%, Ecuador's 11.8%
cautionary tale); revenue outcomes ranked by evidence quality (IMF
Peru causal studies, EC country-chapter VAT-gap series for
Italy/Hungary/Poland, IDB/CIAT and Pomeranz foundations, ViDA impact
assessment, and an explicit "where no number exists" card naming the
gap for KSA/Egypt/India/etc.); six recurring failure modes (incl.
Indonesia's Coretax day-one collapse and Poland's audit-forced
rebuild, primary-sourced); 8 objective conclusions; 68 references
tagged [official]/[study]/[press]/[industry]. Research method:
6 parallel agents (LatAm, live-Europe, in-process-Europe, MENA, APAC,
cross-cutting studies) under the 6 Aug sourcing standard, then 3
headline claims independently re-verified at source before delivery
(EC 24-Oct-2023 release quote + figures, IMF WP/19/231 abstract, DGII
96% announcement). Citation-anchor integrity script-checked (no
broken refs, no orphans).

**Insights hub wiring** — the infrastructure already existed
(migration 338 `articles` schema, shared/resources-render.mjs,
site-worker /insights + /insights/<slug> routes, members-worker gated
view) but had zero published rows. Changes:

- **Migration 449** — first `articles` row: slug
  `ctc-rollouts-compared`, type whitepaper, ungated, published,
  `pdf_url` pointing at the static HTML page.
- **resources-render.mjs** — whitepaper CTA no longer assumes PDF
  ("Read the whitepaper →", localised ×4, replacing "Whitepaper →
  PDF"); list query now selects `pdf_url`; ungated whitepaper cards
  carry `data-doc-url` so the tracker can pop them out.
- **Tracker: in-frame /insights panel** — `openInsightsPage()`/
  `closeInsightsPage()` mirroring the sources panel exactly
  (shadow-root CSS scoping, history pushState('/insights'), popstate
  + languageChanged integration, mutual-close added to all 7 other
  panel-open functions), interception of `href === '/insights'` in
  wireDeepDiveInPagePanel().
- **Tracker: whitepaper pop-out** — #whitepaperOverlay, same
  overlay/close mechanics as the About modal but sized for a document
  (min(88vh) dark .doc-card hosting an iframe, src set on open and
  cleared on close so the page costs nothing until opened). Cards
  with data-doc-url clicked inside the insights panel's shadow root
  open here (listener lives on the shadow root — the document-level
  listener only ever sees the retargeted host).
- **Whitepaper framed mode** — inline head script sets
  `data-framed` when window.self !== window.top; CSS hides the
  page's own back-link inside the pop-out (the modal has its own
  close button; the back-link would have navigated the iframe).
- **Carousel** — the "Coming soon / Featured Content" slide is now a
  live link to /insights (picked up by the same interception, so it
  opens in-frame automatically); carousel.featured* i18n keys updated
  in all 4 languages ("Insights / Insights & Whitepapers / Original
  analysis and whitepapers — starting with our 60-jurisdiction
  comparison...").

**Verification.** `node --check` on the tracker's extracted inline
script: 0 errors. Full `validate_replay()`: OK (449 files, only
documented pre-existing errors). Playwright click-through against a
local server with /insights stubbed via the REAL renderer
(renderInsightsListFragment run in node with migration 449's exact
row): carousel slide is a live /insights link (0 coming-soon slides
left); menu item opens in-frame (board hidden, URL → /insights);
whitepaper card in shadow DOM carries data-doc-url; clicking it opens
the pop-out with the whitepaper rendered inside the iframe and the
iframe's own back-link hidden; Escape closes the pop-out; the
panel's back link restores the board; carousel click opens in-frame;
browser back button restores the board; 0 page errors.

**Deployed and confirmed live** (7 Aug 2026): Dan applied migration
449 and deployed both workers together with the translations commit
below — single confirmation covered the combined chain ("deployed
successfully").

## 7 Aug 2026 (cont'd) — whitepaper fully translated: static ES/DE/FR editions + language-aware pop-out

Dan asked whether the whitepaper was translated (it wasn't — English
only, with translated hub chrome) and, after weighing static vs full
D1 translation, chose **full static translation** — reasoning that
frozen content gets nothing from D1's dynamic machinery, and separate
per-language files give better long-form prose quality and real
per-language SEO than the education pages' data-i18n overlay pattern
(which serves English to crawlers and fragments 9,000 words of prose
into hundreds of keys).

**Three new static files**, each a complete standalone edition:
`whitepaper-ctc-rollouts-compared-es.html`, `-de.html`, `-fr.html`,
written by three parallel translation agents from the EN source with
a strict ruleset (translate all prose incl. table cells, pills,
conclusions and reference annotations; keep HTML structure, URLs,
anchors, numbers, `<style>`/`<script>` byte-identical; linked source
titles stay in their original language; "clearance" introduced with
a native gloss then used as industry jargon; source-type tags
localised — [oficial]/[amtlich]/[officiel] etc.). Each edition:
`<html lang>`, translated title/meta/og, self-canonical, and the
shared 5-line hreflang cluster (en/es/de/fr/x-default) — added to
the EN file too, along with a visible EN·ES·DE·FR `.lang-row`
switcher (present in all four files, each marking itself current;
deliberately kept visible in framed mode so language can be switched
inside the pop-out — the links just navigate the iframe to the
sibling edition).

**Language-aware pop-out.** `openWhitepaperPopout()` now derives the
variant from the active site language (`EICC_I18N.currentLang`):
non-EN languages probe `<base>-<lang>.html` with a HEAD request and
fall back to the base file if it doesn't exist — so a future
whitepaper published without translations degrades gracefully
instead of 404ing in the modal. Convention documented in the
function comment: base name = EN, `-es/-de/-fr` suffixes = editions.

**Verification, independent of the agents' own checks.** Structural
parity script across all 4 files: identical counts for sections (9),
references (68), citation anchors (114), tables (6), rows (108),
pills (27), conclusion cards, hreflang lines; correct per-file
canonical + lang attr; zero untranslated-English leftovers on an
8-phrase heuristic sweep; 11 headline figures (€128bn, 99.8%,
76,762, 10.8%...) present byte-identical in every edition. `node
--check` on the tracker script: OK. Playwright: with site language
switched to ES, the insights-panel whitepaper card opens the pop-out
with the ES edition loaded ("Mandatos de Clearance Comparados");
clicking DE in the in-popout lang row loads the German edition;
a document with no `-es` variant falls back to its base file; zero
page errors.

**Deployed and confirmed live** (7 Aug 2026): shipped together with
the insights-wiring commit above in one bundle
(whitepaper-translations.bundle, containing both commits); Dan
confirmed "deployed successfully". The Insights & Whitepapers hub,
the whitepaper in all four languages, the pop-out, and the live
carousel slide are all in production.

## 7 Aug 2026 (cont'd) — /insights listing translated: article_translations table (migration 450) + language-aware renderer

Dan spotted that the whitepaper's title and description on the
/insights hub rendered English-only in every language (the hub
chrome was translated; the `articles` row wasn't — migration 338's
schema deliberately carried no translations). Small fix, following
the site's established *_translations pattern:

- **Migration 450** — `article_translations` table keyed on
  (article_slug, lang ∈ es/de/fr; slug is UNIQUE in `articles` so no
  JOIN-lookup needed at insert time), columns title, dek, nullable
  teaser_html, nullable **doc_url** — the last one letting each
  language's listing and article-page CTA point directly at that
  language's own static edition of the document. Three rows inserted
  for `ctc-rollouts-compared`, phrased consistently with the
  translated editions themselves. English needs no row.
- **resources-render.mjs** — `getPublishedArticles()` and
  `getArticleBySlug()` gained a lang parameter: 'en' keeps the
  original single-table query; other languages LEFT JOIN +
  per-column COALESCE, so an article with no translation row (or a
  NULL column) falls back field-by-field to English rather than
  disappearing or mixing languages. doc_url coalesces over pdf_url.
- **Call sites** — site-worker's renderInsightsHub and
  renderInsightsArticle, and members-worker's handleArticleFull, all
  pass their already-resolved lang.
- **Tracker polish** — since translated listings now carry the
  language-specific doc_url server-side, openWhitepaperPopout() uses
  a URL already ending in the active language's suffix directly,
  instead of HEAD-probing for an impossible "-es-es.html" first (the
  probe survives as the fallback for untranslated future docs).

**Verification.** `validate_replay()`: OK (450 files, only
documented pre-existing errors). New queries executed against a full
in-memory replay: ES card title + -es doc_url, FR article
title/teaser/doc_url all resolve translated; a synthetic
translation-less article correctly falls back to English. Renderer
end-to-end in node with the ES-coalesced row: card carries
data-doc-url=".../-es.html", type label "Informe técnico", CTA "Leer
el informe técnico →". `node --check` on both workers' index.js, the
shared module, and the tracker's inline script: all OK.

**Deploy needs**: migration 450 via `apply_migrations.py --remote`,
then `wrangler deploy` on BOTH workers (shared renderer changed) —
site-worker also picks up the tracker edit.

## 7 Aug 2026 (cont'd) — "About the author" rewritten per Dan's new copy

Dan supplied replacement copy for the About-this-site pop-out's
author section — four paragraphs instead of the previous two
(career framing now "invoice digitisation and Accounts Payable
automation", the shift narrative, the no-central-authority
challenge, and a closing paragraph on what the site provides).
Structure change: #aboutOverlay gained about.authorP3/authorP4
paragraphs; all four i18n files updated — EN verbatim as supplied
(the one silent normalisation: the plain "-" before "providing"
rendered as the site's usual " — "), ES/DE/FR translated in
register with the existing about-section translations, keeping "The
E-Invoicing Compliance Corner" as an untranslated proper name.
authorConnect (LinkedIn line) unchanged. Verified via headless
Chromium: Menu ▸ About shows 4 paragraphs in EN, switches cleanly
to ES. Deploy: site-worker only.

## 7 Aug 2026 (cont'd) — Kenya (#61) and Nigeria (#62) built; region renamed "Middle East / Africa"; Egypt update corrected & added (deployed & confirmed live)

Dan shared another session's "African countries to add" evaluation
and chose: build Kenya + Nigeria now (Morocco/South Africa deferred
until their decree/position-paper firm up), plus an Egypt update.
Regions: Dan chose renaming "Middle East / North Africa" →
**"Middle East / Africa"** over adding a fifth region — the widened
group now spans the continent (Egypt, Israel, Jordan, Kenya, Nigeria,
Oman, Saudi Arabia, UAE).

**Sourcing standard catch worth recording:** the other session's
Egypt item — "Resolution 281/2025 cut the registration threshold
EGP 500k → 250k, register by 31 Mar 2026" — is FALSE as stated.
Verification traced it to SEO/AI-generated blogs (and an AI-generated
VATupdate "briefing" that apparently ingested them) contradicting
each other; PwC's Feb-2026-reviewed country summary shows no
threshold change. What 281/2025 actually is (Sovos+Comarch+KPMG
confirmed): the e-receipt Stage 8 wave for two Cairo tax offices,
from 15 Sep 2025. Built the corrected version instead: off-board
milestone `eg-ereceipt-stage8-2025` + a story pairing it with the
real SME angle (Law 6/2025 makes e-invoice/e-receipt enrollment the
entry condition for the ≤EGP 20m simplified regime), with the debunk
noted explicitly in the story (migration 461).

**Research** (3 parallel agents, house standard): Kenya came back
almost entirely KRA-official-sourced (notices 1944/2323, FAQ, ETR
blog, OSCU/VSCU guide + EY for statutes); Nigeria's "sources
genuinely conflict" warning resolved into a dated sequence — go-live
1 Aug 2025 → extension 1 Nov 2025 → penalties statutory 1 Jan 2026
(NTAA; the source of stray "mandatory 1 Jan 2026" claims) → hard
deadline 31 Jul 2026 with enforcement from August. FIRS→NRS rename
(acts signed 26 Jun 2025, effective 1 Jan 2026) handled by using
FIRS pre-2026 / NRS after.

**Migrations 451-462** (12 files; last used was 450):
- 451 region relabel, mirroring 297's mechanics (translations
  namespace='regions' key+value ×4 + countries.region UPDATE).
- 452 KE+NG country rows + 4-lang name translations (fr "Nigéria").
- 453 Kenya: 7 milestones (4 on-board; anchor = 30 Nov 2022 TIMS
  deadline; 2026 return-validation as the flagship recent item),
  scopes b2b×5/none×2. Excluded per standard: the fabricated
  "FA2026 expense redefinition", FA2026 penalty figures
  (single-source), XML-vs-JSON wire format (conflict), the 1 Jan
  2025 pre-filled-returns date (secondary only).
- 454 Nigeria: 8 milestones (4 on-board; anchor = 1 Aug 2025
  go-live with MTN/Huawei/IHS first cleared invoices; Peppol
  Authority 26 Sep 2025 off-board), scopes b2b×5/none×3. Hedged:
  "first African country on OpenPeppol's authority list" (implied by
  the list, stated verbatim nowhere); excluded: 72h buyer-rejection
  + NGN 50k/day B2C penalty (single-source), archiving conflicts.
- 455/456 deep dives EN (5 stats, 2+1 cards, lifecycle ×5 statuses,
  3 penalties cards incl. "What we could not confirm", 5/6 steps,
  3 portals each). Nigeria portal pages couldn't be machine-read
  (JS app / fetch-blocked) — flagged in its footer disclaimer.
- 457/458 ES/DE/FR translations (subagents; JOIN-lookup pattern per
  442/443; both self-verified via scratch replay — 99 and 105
  INSERTs; the Kenya agent caught and fixed a generator bug that had
  eaten French apostrophes).
- 459 jurisdiction count 60→62 in D1 (mechanically generated from
  444 by the same transformation that made 444 from 432; 40 rows).
- 460 stories: Kenya return-validation + Nigeria enforcement-begins,
  4 languages each (Serbia-433 full-translation pattern — richer
  than 445/446's EN-only).
- 461 Egypt corrected update (milestone + story, 4 languages, debunk
  documented in the header comment).
- 462 tracking sources: KE = two official KRA pages; NG = official
  einvoice portal + Thomson Reuters/Pagero log explicitly flagged as
  the industry fallback (official portals block automated
  monitoring).

**Statics:** region rename swept across 13 files (countries.js, both
workers, tracker incl. vestigial DATA rows, map-data.mjs, i18n main
+ subscribe ×4 — translated values updated per language, e.g.
"Oriente Medio / África"); map REGION_BOUNDS widened west 22°→0°E
(Nigeria ~2.7°E) and south 14°→-6° (Kenya ~-4.9°S) with a comment
mirroring the Turkey precedent; region descriptions rewritten ×4 (no
longer "most compact"); both topology names checked against
vendor/countries-50m.json — exact matches, no TOPO_NAME_OVERRIDES
needed. deep-dive-render slugs + es/de/fr name translations; i18n
countryNames ×4. Count sweep 60→62 across i18n (24 files) + 7 HTML
files — deliberately EXCLUDING the whitepaper editions ×4, the
carousel featuredDesc ×4, and the articles rows (all describe the
frozen 60-jurisdiction whitepaper).

**Verification.** validate_replay: OK (462 files, only documented
pre-existing errors). Structural queries on a full replay: count
rule returns exactly 62; MEA region = the 8 expected members, zero
old-string remnants; KE 7/4/1 and NG 8/4/1 milestones (n/on-board/
anchor); 4-language completeness across every table (28/32 milestone
translation rows; 4/20/24/20/20-24/12 page/stat/card/status/step/
portal rows each); zero on-board milestones without portals; zero
rows_json shape or actions-length inconsistencies; stories 4-lang
×3; Egypt milestone 4-lang; tracking sources 2+8 rows per country;
35 "62-count" rows in D1 with zero stale 60-count rows. node --check
on tracker script: OK. Playwright: region pill renders "Middle East /
Africa" (old string absent from DOM), brand copy says 62, Spanish
switch shows "Oriente Medio / África", zero page errors.

**Deployed and confirmed live.** Dan pulled the bundle, pushed
(after resolving a GitHub credential expiry — new PAT via the
keychain-prompt route; an earlier fine-grained token failed with 403
for lack of repo Contents permission and was revoked after exposure),
applied migrations 451-462 with `apply_migrations.py --remote`, and
deployed both workers. Dan confirmed: "confirmed deployed and
working." Kenya (#61), Nigeria (#62), the "Middle East / Africa"
region rename, the 62-count, and the corrected Egypt update are all
live in production.

## 9 Aug 2026 — Bulgaria (#63) and Estonia (#64) built (deployed & confirmed live)

Dan asked to build Bulgaria and Estonia next, from the "Still not
tracked in Europe" list. Both are straightforward — existing
'Europe' region, no taxonomy decision needed — but research turned
up a genuinely important finding for each: **neither country has a
B2B e-invoicing or clearance mandate today.**

**Bulgaria.** The European Commission's own "eInvoicing in Bulgaria"
country factsheet (page 467108878, live-fetched) confirms: B2G
mandatory since 1 Nov 2019 (Article 115a, Public Procurement Act,
State Gazette 86/18, via the CAIS EPP platform), B2B "optional,
contingent on mutual business agreements." The real upcoming change
is unrelated to invoicing: a 5-phase SAF-T periodic accounting-data
reporting mandate, 1 Jan 2026 (large enterprises, >BGN 300m revenue
or >BGN 3.5m tax/social payments) through 1 Jan 2030 (full VAT
universe incl. micro), cross-corroborated by EDICOM, PwC Bulgaria and
Penkov Markov & Partners (a Bulgarian law firm) all agreeing on the
same 5-phase structure. **All SAF-T milestones use
`mandate_scope='none'`** — it's a bookkeeping-file reporting
obligation, not an invoice-issuance requirement, the same
classification logic as Spain's VeriFactu. Penalty figures (BGN
5,000-15,000 / 10,000-30,000) come from one specialist compliance
source only (SNI Technology) and are flagged plausible, not
confirmed, in both the milestone-adjacent penalty card and the
deep-dive's dedicated penalty-rows table — Bulgaria's own NRA SAF-T
portal page timed out/robots-blocked this research round.

**Estonia.** B2G mandatory since 1 Jul 2019 (EU factsheet, page
905219410). B2B is a distinctive "buyer chooses" conditional model:
since 1 Jul 2025 (Accounting Act amendment), any entity registered
in Estonia's Business Register as an e-invoice recipient can require
its suppliers to issue e-invoices — sourced to Estonia's own Ministry
of Finance press release (fin.ee, "Muudatused jõustuvad 2025. aasta
1. juulist" = confirmed 1 July 2025), cross-checked against Sovos and
RTC Suite. This is genuinely a live `mandate_scope='b2b'` fact (the
seller has no discretion once a registered buyer asks), unlike
Bulgaria's situation. A general/universal B2B mandate is separately
"anticipated by 2027" per the EU factsheet's own language, but
remained in draft/proposal stage as of this research round —
recorded with `confidence='expected'`, not treated as confirmed.

**A sourcing-standard catch worth recording, same failure mode as
the Egypt 281/2025 case (7 Aug entry above):** a VATupdate article
dated 27 Jul 2026 ("Riigikogu Adopts Accounting Act Amendments...
E-Invoicing Becomes More Flexible") describes a further
simplification (direct self-registration without an e-invoice
operator). Traced back to the *same* fin.ee press release already
used for the confirmed 1 Jul 2025 milestone (same self-registration
detail, same ~15-18k registered-entity figure); asked directly for
an independent effective date, it had none. Treated as a
syndicated/re-dated restatement of the 2024/2025 story, not a
genuine separate 2026 legislative event — no second milestone
created for it, documented explicitly in migration 465's header so
it isn't re-discovered and mis-treated as new in a future pass.

**Migrations 463-472** (10 files; last used was 462):
- 463 BG+EE country rows + 4-lang name translations — both 'Europe',
  no region change needed (unlike Kenya/Nigeria's MEA widening).
- 464 Bulgaria: 8 milestones (5 on-board; anchor = 1 Nov 2019 B2G),
  scopes b2g_only×1/none×6/b2b×1 (only the 2030 ViDA floor is a real
  future B2B mandate).
- 465 Estonia: 4 milestones (all 4 on-board; anchor = 1 Jul 2019
  B2G), scopes b2g_only×1/b2b×3 — deliberately smaller than
  Kenya/Nigeria/Bulgaria; padding to a bigger count would have
  misrepresented how comparatively uneventful Estonia's regime is.
- 466/467 deep dives EN (5 stats, 2+2+2 cards across file_format/
  scope_transmission/penalties_related, 5/4 steps, 3/2 portals). No
  lifecycle card for either country (no clearance exchange flow to
  diagram) — structurally closest to Germany's decentralised-model
  page. Bulgaria gets a 2-row penalty-rows table (hedged, see above);
  Estonia gets none (no confirmed e-invoicing-specific fine schedule
  exists — a narrative card says so explicitly rather than the page
  silently omitting the section).
- 468 stories: Bulgaria's SAF-T Phase 1 launch (1 Jan 2026) and
  Estonia's buyer-request right taking effect (1 Jul 2025), EN only.
- 469 tracking sources: Bulgaria = Public Procurement Agency (CAIS
  EPP) + NRA SAF-T page + EC factsheet; Estonia = Ministry of Finance
  e-invoices page + EC factsheet.
- 470 jurisdiction count 62→64 in D1 (mechanically generated from 459
  by the same transformation that made 459 from 444; 40 rows).
- 471/472 ES/DE/FR translations (2 parallel subagents; JOIN-lookup
  pattern per 442/457/458; both self-verified via scratch replay —
  93 and ~80 INSERTs).

**Statics:** countries.js Europe array (+Bulgaria, +Estonia,
alphabetical); deep-dive-render.mjs slugs + es/de/fr name
translations; i18n countryNames ×8 files (main + subscribe variants,
all 4 languages). Count sweep 62→64: 40 D1 `translations` rows +
7 HTML files + 24 i18n JSON files — same deliberate exclusions as
the 62-sweep (whitepaper editions, carousel featuredDesc, articles
rows — all describe the frozen 62-jurisdiction analysis, since the
whitepaper predates this build). Map: both topology names
(`Bulgaria`, `Estonia`) matched vendor/countries-50m.json exactly, no
TOPO_NAME_OVERRIDES needed; both well inside the existing Europe
REGION_BOUNDS, no widening needed.

**Verification.** `validate_replay()`: OK (472 files, only
documented pre-existing errors) — caught and fixed a real bug during
authoring (2 of the hand-written EN penalty/narrative cards had a
stray trailing NULL argument, "7 values for 6 columns" on
`deep_dive_card_translations`). Structural queries on a full replay:
jurisdiction count rule returns exactly 64; BG 8/5/1 and EE 4/4/1
milestones (n/on-board/anchor); full 4-language completeness across
every table for both countries (BG: 32/4/20/24/20/12/8 milestone/
page/stat/card/step/portal/penalty-translation rows; EE: 16/4/20/24/
16/8, no penalty rows by design); stories 4-lang ×2; tracking-source
translations 12+8. `node --check` not yet re-run post-static-sweep —
recommend before/at deploy time, following this project's standing
practice.

**Deployed and confirmed live.** Dan applied migrations 463-472 with
`apply_migrations.py --remote` and deployed site-worker; confirmed
"changes applied successfully" — both the D1 migrations and the
site-worker deploy went out. Bulgaria (#63), Estonia (#64), and the
64-jurisdiction count are all live in production.

## 10 Aug 2026 — Lithuania and Malta evaluated (both thin; neither built yet)

Dan asked for an evaluation of Lithuania and Malta, stressing careful,
extensively-sourced research. Dispatched two parallel research agents
with the same discipline as the Slovenia/Iceland and Middle East
evaluations — official sources preferred, industry sources flagged as
fallback, single-sourced claims flagged as plausible-not-confirmed,
conflicting sources reported rather than silently resolved.
Independently re-verified the two load-bearing claims myself
afterward via direct fetch: the EC's own Lithuania factsheet quote
and the MTCA (Malta) official page quote below — both confirmed
exactly as the agents reported.

**Lithuania — no B2B mandate; a genuinely confusing "2028" figure
that should NOT be built as a confirmed milestone.**
- **B2G**: mandatory since 1 Jul 2017 for all public-procurement
  suppliers (above and below EU thresholds), transposing Directive
  2014/55/EU under the Law on Public Procurement. Platform: SABIS
  (replaced the legacy "E. sąskaita" system in mid-to-late 2024 —
  sources disagree on the exact cut-over date: 1 Jul, "September," or
  "1 Sep after a two-month transition").
- **i.SAF** (since ~1 Oct 2016): a monthly invoice-level VAT ledger
  filed by every VAT-registered entity, no size threshold — a
  reporting system, not an invoicing mandate or clearance model.
  Confirmed by the EC's own factsheet, which states outright:
  "Currently, there is no real-time reporting system in Lithuania."
  Directly comparable to Bulgaria's SAF-T or Spain's SII — real
  content for a deep-dive, but `mandate_scope='none'`, not `'b2b'`.
- **The "1 January 2028" B2B mandate figure — flag, don't build as
  confirmed.** It appears on the EC's own 2025 Lithuania factsheet
  (independently re-fetched and confirmed: "mandatory eInvoicing
  targeted for 1 January 2028," in a ViDA-planning context) — but the
  *same page* separately states "There is no business-to-business
  (B2B) mandate." No enacted Lithuanian law, VMI order, or Seimas act
  was found anywhere corroborating an actual 2028 mandate. Compounding
  the confusion: neighboring **Latvia** has a real, separately-enacted
  B2B mandate originally set for 1 Jan 2026 and confirmed postponed to
  1 Jan 2028 (KPMG, June 2025, "technical delays") — several of the
  industry sources repeating "Lithuania 2028" (VATupdate, dddinvoices,
  vatcalc) may be echoing the EC factsheet's own ambiguous wording,
  Latvia's confirmed date, or some mix of both. **If Lithuania is
  built, this should land as, at most, a `confidence='expected'`
  milestone with an explicit hedge** — the same treatment already
  used for Estonia's ~2027 target — never as a confirmed date.
- **Other unresolved conflicts** (would need resolving before a
  build): i.SAF-T's threshold/response-window (Sovos says universal
  scope + 30 days; another industry source says a €300k threshold +
  ~10 days); penalty figures (two industry sources give different
  euro bands, neither independently confirmed against the current
  Administrative Offences Code text — direct fetches of e-seimas.lrs.lt
  and infolex.lt failed this round).

**Malta — thinner than Bulgaria; barely more than "not yet."**
- **B2G is not even a supplier mandate** — the only binding
  obligation is that contracting authorities must be *able to
  receive* EN 16931 e-invoices (legal notices transposing Directive
  2014/55/EU, published Nov/Dec 2018 — EC factsheet says 30 Nov,
  legislation.mt's S.L. 601.10 shows 19 Dec, unresolved). No
  centralized platform; Malta contracted Pagero as its Peppol service
  provider following the EU-funded "eInvoicing4Islands" project.
- **No B2B mandate, no target date, no draft legislation.**
  Independently re-confirmed via direct fetch of the official MTCA
  page: "The Malta Tax and Customs Administration (MTCA) is actively
  studying the implementation of e-invoicing and real-time
  reporting... ensuring Malta is ViDA-ready by 2030" — preparatory
  language only, no committed date ahead of the EU's own 1 Jul 2030
  floor. The EC's own factsheet states the same: "no Business-to-
  Business mandate in place... usage remains optional."
- **No penalty regime found anywhere** — logically consistent with
  no mandate existing yet to penalize.
- One source flagged and set aside per the sourcing standard: a
  VATupdate article on Malta discloses its own content was "partially
  AI-generated" — used only as a cross-check against Deloitte/EC, not
  relied on for anything not independently corroborated.

**Recommendation**: neither is a compelling build today. Lithuania
has real, citable content (B2G since 2017, i.SAF VAT-ledger reporting
comparable to Bulgaria's SAF-T) but the headline "B2B mandate" figure
that would make it feel current is unconfirmed and risks repeating
exactly the kind of error this project's sourcing standard exists to
catch. Malta is B2G-only with no domestic reporting system of any
kind — genuinely thinner than Bulgaria, which at least has a dated,
corroborated SAF-T rollout. Both are defensible "add for completeness"
candidates (comparable to Iceland), not urgent ones. Neither has been
built yet — this is evaluation only, awaiting Dan's go-ahead.

## 10 Aug 2026 (cont'd) — Lithuania (#65) and Malta (#66) built (code complete, deploy pending)

Dan said "build both" straight after the evaluation above. Built to
the same rigor as Bulgaria/Estonia, carrying every hedge from the
evaluation directly into the shipped content rather than smoothing it
away.

**Lithuania** — 7 milestones (6 on-board; anchor = 1 Jul 2017 B2G),
scopes b2g_only×2/none×2/b2b×2/(the b2b-2028 one carries
`confidence='expected'`, not a plain b2b like the confirmed ViDA
floor). The disputed "1 January 2028" figure is recorded as its own
milestone (`lt-b2b-2028-target`) with the EC-factsheet
self-contradiction and the Latvia-conflation theory spelled out
directly in the reader-facing description — not just in the migration
comment — plus a dedicated deep-dive card ("The disputed '2028' B2B
target, explained") and its own tracker-board stat ("2028?"). i.SAF
(VAT-ledger reporting since ~Oct 2016) is `mandate_scope='none'`
throughout, same classification logic as Bulgaria's SAF-T — a real
deep-dive topic, not an invoicing mandate.

**Malta** — deliberately the smallest set built for any country this
project's history: 5 milestones (4 on-board), 1 file_format card
(Peppol/Pagero only, no bespoke platform), 4 steps, 2 portals. B2G is
recorded plainly as receive-only (contracting authorities must accept
e-invoices; suppliers are not required to send them) — not padded to
look like a fuller mandate than it is. The MTCA "actively studying...
ViDA-ready by 2030" quote is carried verbatim into the milestone, the
deep-dive card, and the launch story.

**Migrations 473-482** (10 files; last used was 472):
- 473 LT+MT country rows + 4-lang name translations — both 'Europe',
  no region change needed.
- 474/475 milestones (LT 7, MT 5) with full EN sourcing notes —
  474's header documents the 2028-figure decision in detail (EC
  factsheet self-contradiction, Latvia's real postponed-to-2028
  mandate as the likely conflation source, i.SAF-T threshold/penalty
  conflicts deliberately excluded, failed e-seimas.lrs.lt/infolex.lt
  fetches).
- 476/477 deep dives EN (5 stats each; cards 2+2+2 for LT,
  1+2+1 for MT; 5/4 steps; 3/2 portals). No lifecycle card for either
  (no clearance exchange flow to diagram).
- 478 stories: Lithuania's Sept 2024 SABIS consolidation (used as the
  hook for the "still no B2B mandate despite the disputed 2028
  figure" clarification) and Malta's 5 Jun 2025 TSI project closing
  event (MTCA's "actively studying" posture), EN only.
- 479 tracking sources (3 each: LT = SABIS + VMI i.SAF page + EC
  factsheet; MT = MTCA page + Ministry of Finance page + EC
  factsheet), all 4 languages included directly in this migration.
- 480 jurisdiction count 64→66 in D1 (mechanically generated from 470
  by the same transformation that made 470 from 459; 40 rows).
- 481/482 ES/DE/FR translations (2 parallel subagents; JOIN-lookup
  pattern per 442/457/458/471/472; both self-verified via scratch
  replay). The 2028-figure hedge was confirmed to survive intact in
  all three languages everywhere it appears (milestone, stat, card,
  story) — not summarized away in translation.

**Statics:** countries.js Europe array (+Lithuania, +Malta,
alphabetical); deep-dive-render.mjs slugs + es/de/fr name
translations; i18n countryNames — added to all 8 files this time,
including the 4 subscribe-variant files
(`{en,es,de,fr}-subscribe.json`), which is worth flagging: those 4
files' `countryNames` blocks turned out to be significantly stale
relative to the main `{en,es,de,fr}.json` files and to `countries.js`
— missing 27 countries' worth of entries (Argentina, Colombia, Costa
Rica, Czech Republic, Dominican Republic, Ecuador, Hungary, Indonesia,
Israel, Japan, Jordan, Kazakhstan, Kenya, Latvia, Luxembourg, Nigeria,
Oman, Pakistan, Philippines, Serbia, South Korea, Taiwan, Turkey,
Uruguay, Vietnam, plus Lithuania/Malta themselves before this fix).
`subscribe.html`'s lookup falls back silently to the raw English name
when a translation is missing, so this was never a crash — just a
long-standing silent gap on the ES/DE/FR subscribe country picker.
Only Lithuania and Malta were added to close this build's own gap;
**the other 25 countries' missing subscribe-picker translations are a
pre-existing defect, not touched here, flagged for a future pass.**

**A second, related pre-existing drift bug found and fixed while
sweeping the jurisdiction count**: the non-English jurisdiction-count
text (the "X jurisdictions/countries/Länder/pays/países" prose
strings) had not been kept in sync with English at every past count
bump. `i18n/de.json`, `i18n/de-subscribe.json`, and all 4
`de-edu-*.json` files were still saying "62" (stuck since before
Kenya/Nigeria's #61/#62 bump); `i18n/es.json` and `i18n/fr.json` were
also stuck at "62"; `i18n/fr-edu-preparing-for-mandate.json` was
stuck at "62" too — while the equivalent English files had already
correctly reached "64" after Bulgaria/Estonia. This is the same class
of bug as the "48-country drift bug" fixed on 6 Aug (see that entry)
recurring in a different set of files. Corrected all of these
directly to "66" in the same pass as the regular 64→66 sweep, rather
than leaving them stuck at 62 while English reads 66 — a 4-point
undercount that would otherwise have kept compounding with every
future country added. Full count sweep, EN/ES/FR 64→66 plus the
stale-62 DE/ES/FR fixes: 7 HTML files (verified the tracker page's
regex-based first-pass attempt at this accidentally corrupted
unrelated SVG map-illustration coordinates and an image width/height
attribute sharing the literal string "64" — reverted and redid that
file with 4 precise, non-regex edits instead) + 29 i18n JSON files.
Map: both topology names (`Lithuania`, `Malta`) matched
vendor/countries-50m.json exactly, no TOPO_NAME_OVERRIDES needed.

**Verification.** `validate_replay()`: OK (482 files, only documented
pre-existing errors). Structural queries on a full replay:
jurisdiction count rule returns exactly 66; LT 7/6/1 and MT 5/4/1
milestones (n/on-board/anchor); full 4-language completeness across
every table for both countries confirmed by exact row-count queries
(LT: 7 milestone/1 page/5 stat/6 card [2+2+2 by section]/5 step/3
portal-translation rows per language; MT: 5/1/5/4 [1+2+1]/4/2 per
language); stories 4-lang ×2; tracking-source translations 4-lang ×3
each; country_translations 4-lang for both (LT: Lithuania/Lituania/
Litauen/Lituanie; MT: Malta/Malta/Malta/Malte). All i18n JSON files
re-validated as parseable after the count-sweep edits; every `.js`/
`.mjs` file re-validated with `node --check`; the tracker page's one
inline `<script>` block re-parsed cleanly with `node --check` after
the SVG-corruption revert.

**Not yet deployed.** Migrations 473-482 are code-complete and
replay-validated but have not been applied to production D1, and
site-worker has not been redeployed with the static-file changes.
Awaiting Dan to pull, apply, and deploy, same workflow as every prior
country build.

## Open items / next steps

### Real open work

1. **Coverage expansion** — Netherlands, Austria, Greece, Cyprus, Oman,
   Jordan, Israel, South Korea, Vietnam, Turkey, Czech Republic,
   Argentina, Colombia, Philippines, Taiwan, Hungary (#49), Indonesia
   (#50), Japan (#51), Pakistan (#52), Ecuador (#53), Uruguay (#54),
   and Costa Rica (#55) are all confirmed deployed and tested. Slovenia
   and Iceland, and now Serbia and Latvia too (see the entry above), are
   also **confirmed deployed** — Dan confirmed both the
   migrations and the `site-worker` deploy went out for each, and all
   four countries appear live on the site. Kazakhstan (#59), Dominican
   Republic (#60), Kenya (#61), Nigeria (#62), and Bulgaria (#63)
   and Estonia (#64) (see the 9 Aug entry above) are also
   **confirmed deployed**, along with the 64-country header text.
   Lithuania (#65) and Malta (#66) were evaluated and then built at
   Dan's go-ahead (see the two 10 Aug entries above) — **code complete
   and replay-validated, but not yet deployed**; awaiting Dan to pull,
   apply migrations 473-482, and redeploy site-worker (same as the
   Bulgaria/Estonia workflow before Dan confirmed that one live).
   Myanmar was evaluated and held back
   (no real mandate found). Qatar
   was evaluated and held back at Dan's choice (thinner than first
   assessed). Africa candidates remaining from the 7 Aug evaluation:
   Morocco (decree pending) and South Africa (2026-29 phased plan) --
   both deferred by Dan's choice until their legal instruments firm
   up. Still not tracked in Europe:
   Liechtenstein. Still not tracked in the Americas:
   Guatemala, Paraguay, Bolivia, Panama, El Salvador. The scaffolder
   + runner make each addition a fraction of the old effort.

   **Two pre-existing drift bugs found and fixed as a byproduct of
   this build (10 Aug 2026), see that entry for full detail**: (a)
   the 4 subscribe-variant i18n files' `countryNames` blocks were
   missing 27 countries' worth of translations (silent fallback to
   English on the ES/DE/FR subscribe picker, not a crash) — only
   Lithuania/Malta were added to close this build's own gap, the
   other 25 remain a flagged, un-fixed pre-existing gap; (b) the
   non-English jurisdiction-count prose text in several i18n files
   (`de.json`, `de-subscribe.json`, all 4 `de-edu-*.json`, `es.json`,
   `fr.json`, `fr-edu-preparing-for-mandate.json`) was stuck at "62"
   from before Kenya/Nigeria, while English had already moved to 64 —
   corrected directly to 66 in this pass, the same class of bug as
   the "48-country drift bug" fixed on 6 Aug, recurring in a
   different file set.

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
   - **Taiwan — now built and deployed as country #48**, see the dated
     entry above. The eGUI system has been mandatory for all foreign
     and domestic companies since **January 2021**, with a format
     migration already underway (MIG 4.0 mandatory since Jan 2026;
     older MIG 3.1/3.2 sunset 31 December 2025). Invoices transmit to
     the Ministry of Finance's platform within 7 days (B2B) or 2 days
     (B2C) of issuance. In force ~5 years, actively evolving.
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
   **South Korea, Vietnam, and Taiwan are now all built and deployed**
   (see the dated entries above). Pakistan and Indonesia are the
   strongest next candidates from this same evaluation whenever
   coverage expands further into Asia-Pacific.

   **Americas coverage evaluated (4 August 2026).** Dan asked for an
   assessment of countries to add in the Americas. Currently tracked
   in this region: Brazil, Canada, Chile, Mexico, Peru, United States
   (6 of 40). Live web research across 11 more candidates found two
   no-caveats, fully-universal mandates (**Argentina** and
   **Colombia** — as mature and well-documented as Jordan/South Korea
   were at build time), three equally strong second-tier candidates
   each anchored by a genuinely live 2025/2026 development
   (**Uruguay, Costa Rica, Ecuador**), four real "Oman-shaped" phased
   rollouts with confirmed dated waves (**Dominican Republic,
   Guatemala, Paraguay, Bolivia**), and two thinner candidates checked
   but not prioritized (**Panama, El Salvador**). See the dated entry
   above for the full ranked write-up and sourcing.

   **Recommendation**: add Argentina and Colombia first. **Both are
   now built, deployed, and tested** (see the 4 August 2026 dated
   entries above) — every country added this session is now live.
   Uruguay, Costa Rica, and Ecuador are the next recommended
   additions; ready to scaffold whenever Dan wants to proceed.
2. ~~**Tracking-source URL audit, continued**~~ — **done 6 Aug 2026**
   (migration 411): all 101 `tracking_sources` + 81 `deep_dive_portals`
   rows (182 URLs total, every one of them, not just the ~40 this item
   used to flag) checked for both link-liveness and country-match via
   12 parallel agents. Zero country mismatches; 6 dead links found and
   fixed, all independently re-verified. See the dated entry above.
3. ~~**Translation frameworks for the remaining static pages**~~ —
   evaluated 4 August 2026: of 10 static HTML pages, 8 were already
   fully wired into i18n; privacy-policy.html was the one real gap
   (had the shared language banner but zero translated body content)
   and is now built, deployed, and tested — see the dated entry above.
   index.html is a bare redirect stub and doesn't need wiring. No
   further static pages are outstanding.
4. **Business threads** (decisions, not code) — evaluated 4 August
   2026, see the dated entry above; still awaiting Dan's decisions,
   nothing built: theinvoicinghub.com competitive review (a real,
   credible competitor whose free-reader/paid-vendor-sponsorship model
   is a validated proof of concept worth following); pricing (the
   actual shelved numbers were $10/yr recurring or $12 one-time, not
   "$5/$8" — recommendation is to keep the free tier as the durable
   model, not a placeholder, and if a paid tier returns, price it for
   the company/team rather than reviving the old consumer-style
   subscription); the vendor registration/advertising concept
   (recommended to sequence after real traffic exists, differentiated
   via accreditation-verified listings rather than raw directory
   size); and the two Resources ideas — accredited-providers list
   (curated against real government accreditation status, not
   self-registered like the competitor's) and a vendor-assessment RFI
   template (a genuine content gap — no e-invoicing-specific one found
   anywhere).
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
- ~~Re-hooking Lemon Squeezy if/when a paid tier returns.~~ Resolved 5
  August 2026: Lemon Squeezy rejected the store application and Dan
  chose to shelve the paid tier rather than pursue Paddle/Stripe as
  alternatives — see the dated entry above. If a paid tier is
  reconsidered later, start from Stripe or Paddle, not Lemon Squeezy.
