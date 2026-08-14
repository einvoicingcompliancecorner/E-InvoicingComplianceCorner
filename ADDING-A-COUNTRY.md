# Adding a New Country to the Site — Runbook

> Rewritten 2 August 2026, superseding the original static-era runbook
> and its accumulated correction notes. Three architecture changes made
> the old version materially wrong: **Stage 4** (deep-dive pages render
> from D1, not static HTML), **migration 198 + the members-worker
> country refactor** (regions, translated names, picker membership, and
> deep-dive slugs all live in D1's `countries`/`country_translations`
> tables — the three hardcoded copies in `members-worker/src/index.js`
> are gone), and **Stage 5** (the tracker board itself, and its ES/DE/FR
> milestone translations, render from D1 at request time). The result:
> most of a country addition is now **one set of D1 migrations**, and
> members-worker needs no changes at all.

Follow the phases in order. The failure mode this doc guards against is
unchanged: silent inconsistency, not errors — a country appearing
untranslated in exactly one place, or a stat still saying "32" after
you've added a 33rd.

---

## Before you start

Decide up front:
- **How many tracker milestones does this country need?** Some mandates
  are one milestone; others phase in over waves (Saudi Arabia, UAE,
  Luxembourg's 4 entries). Plan them all now. Milestones that should
  appear on the main board get `on_tracker = 1`; deep-dive-timeline-only
  context entries (anchors, historical steps) stay `0`.
- **Which region?** Europe / Middle East / Asia-Pacific / Americas —
  exact case and spelling, everywhere.
- **The exact English country name.** Pick once, spell identically in
  every file and migration. A mismatch silently breaks matching between
  the subscribe picker, preferences, and story tagging — and, if it
  doesn't also match the world-atlas topology's own spelling, breaks
  The Map's shape lookup too (see Phase 1 step 6).
- **The URL slug.** Usually lowercase-hyphenated, but abbreviations are
  fine (`uae`, `uk`) — it's an explicit column, not a derived transform.

---

## Sourcing standard (added 6 Aug 2026 — read this before writing content)

A guiding principle of this site: it unifies verified information, and
every article and every piece of information is sourced from authorised
sources. This is not optional polish — it's why the site is trustworthy.

**A citation must specifically support the claim it's attached to — not
just be "about the same country" or "the right government's homepage."**
A citation audit run 6 Aug 2026 found 100 of 140 published newsletter
stories (71%) citing a source that didn't actually cover the claim being
made — almost always a country's generic tax-authority landing page
cited instead of the actual dated press release, resolution, or article
that contains the date/figure/quote in question. A reader clicking
through got a page that never mentions what they just read. Fixed in
migration 405 (see `PROGRESS.md`'s 6 Aug 2026 entry for the full audit
and methodology) — but the real fix is not writing the problem in the
first place:

- Before setting a `source_url` (on a milestone, a story, or any future
  sourced content type), open the link and confirm it actually contains
  the specific fact you're citing it for — the date, the figure, the
  legal citation, the quote. "Same topic, same country" is not enough.
- A country's generic homepage or landing page is almost never the
  right citation for a specific, dated claim. Prefer the actual press
  release, the specific resolution/decree/law text, or a dated news
  article that names the fact directly.
- When several claims in one piece of content come from different
  places (e.g. a milestone's headline date from an official gazette, a
  penalty figure from a secondary compliance source), and the schema
  only has room for one `source_url`, cite the source that covers the
  more specific/harder-to-verify claim, not the more general one — the
  general EU-wide facts (like the 2030 ViDA floor) are easy for a
  reader to verify elsewhere; a country-specific legislative-status
  detail is not.
- Official government sources are preferred where they exist and are
  fetchable; reputable compliance-industry sources (VATupdate, Sovos,
  EDICOM, KPMG's tax-news flashes, national chambers of commerce, etc.)
  are a legitimate fallback when no official page covers the specific
  claim, or when the official page can't be verified from this sandbox
  (flag that explicitly rather than silently citing something weaker).
- **Deep-dive content currently has nowhere to put a citation at all.**
  `deep_dive_stats`, `deep_dive_cards`, `deep_dive_steps`, and
  `deep_dive_penalty_rows` have no `source_url` column in the schema —
  unlike `milestones` and `stories`, which both do. Until that schema
  gap is closed, keep a clear internal record (in the migration file's
  own comments, or in PROGRESS.md's build entry for that country) of
  where each card/stat/penalty figure actually came from, the same way
  past country builds already did informally — so a citation can be
  retrofitted later without re-researching from scratch.

---

## Phase 1 — D1 migrations (the bulk of the work)

**Start with the scaffolder** — it generates steps 1 and 2 below from a
small JSON spec, correctly numbered, idempotent (`INSERT OR IGNORE`
throughout), with the ES/DE/FR milestone-translation stub parked in
`migrations/drafts/` where the runner can't apply it until you've
actually translated it:

```bash
cd members-worker/migrations
python3 new_country_scaffold.py path/to/country-spec.json   # see its docstring for the spec shape
```

Steps 3–4 (deep-dive content, story) are written by hand as before.
Whether scaffolded or hand-written, **the runner validates the full
in-memory replay before touching live D1** — the project's
non-negotiable, now automated rather than remembered.

**Every migration should say what it did.** Replay proves the SQL runs;
it cannot prove the SQL changed anything, and an `UPDATE` matching zero
rows is not an error. That gap is what let migrations 470, 480 and 490
each run cleanly and do nothing across three consecutive country builds.
So a migration now declares its own effect in a comment, which the
runner executes after applying the file — in replay, and again against
live D1 before recording it:

```sql
-- ASSERT: SELECT count(*) FROM countries WHERE code = 'XX' = 1
-- ASSERT: SELECT count(*) FROM milestones WHERE on_tracker = 1 AND country_id = (SELECT id FROM countries WHERE code = 'XX') = 3
```

One line starting `-- ASSERT:`, a SELECT returning a single value, the
comparison operator last (`=`, `!=`, `>`, `>=`, `<`, `<=`), and a
number, a `'quoted string'` or `NULL` on the right. A malformed
directive is a hard error rather than a skipped line — a claim the
runner quietly ignored is the same failure wearing a different hat. The
scaffolder writes a sensible set for you; add any others that capture
what you actually meant to do, and prefer asserting *values* over row
counts where the value is the point.

`ASSERT ALWAYS` is for **invariants** — two things in the database that
must agree. A plain assertion is point-in-time, so a later migration may
legitimately move it (the runner reports that as "superseded"). An
ALWAYS assertion may not be broken by anything: if it stops holding at
the end of the chain, the replay fails and names the file that declared
it. The standing set lives in `migrations/517_standing_invariants.sql`,
a migration that contains no SQL at all. Write invariants **relatively**
— compare one table against another, never against a hardcoded number,
which is just a fact with an expiry date.

Run all of it offline, as often as you like. It needs no wrangler, no
Cloudflare and no target, so it works in the build sandbox:

```bash
python3 apply_migrations.py --replay-only    # the whole chain + every assertion
python3 test_assertions.py                   # proves the mechanism itself still works
```

1. **Country row + name translations**
   ```sql
   INSERT INTO countries (code, name_en, region, slug, in_picker, roi_complexity, eu_member)
     VALUES ('XX', 'CountryName', 'Region', 'country-slug', 1, 'complex', 0);
   INSERT INTO country_translations (country_id, lang, display_name)
     SELECT id, 'en', 'CountryName' FROM countries WHERE code = 'XX';
   -- + es / de / fr rows (real translations, not the English name
   --   copy-pasted; verify against a real source)
   ```
   `slug` NULL would mean "no deep-dive page" (only European Union
   today); `in_picker = 0` would mean "story-taggable but not offered in
   the subscribe/preferences checklists" (also EU only). A normal new
   country wants a slug and `in_picker = 1`.

   **This one insert now powers:** the Deep Dives menu + flyout, the
   sidebar link, the preferences page's checkbox (grouped, translated),
   the subscribe/archive country handling, newsletter stories'
   auto-rendered deep-dive links, **and the ROI & Wave Planner's country
   picker, integration count and delivery timeline**. None of those are
   separate edits anymore.

   ### `roi_complexity` — mandatory, and it drives money

   Added 12 Aug 2026 (migration 510). Three values, `CHECK`-constrained,
   **no safe default** — the column defaults to `'none'`, which is
   almost certainly wrong for a country you are bothering to add, so set
   it explicitly:

   | Value | Means | ROI planner effect |
   |---|---|---|
   | `'complex'` | A CTC in any form — clearance, pre-validation, or invoice-level data reported to the tax authority — **or** a 5-corner model where the exchange network also reports | Full phase durations; the **complex** integration rate (default $20k per country-system) |
   | `'simple'` | Decentralised 4-corner exchange only: structured invoices move between accredited access points and the tax authority is not a party to the transaction. Most B2G-only Peppol regimes sit here | 0.7x phase durations; the **simple** rate (default $10k) |
   | `'none'` | Nothing to build for | Same durations as simple, costed at the simple rate, but **no deadline** — the country lands in the timeline's "no fixed deadline" band instead of a dated wave |

   The dividing line is **whether the tax authority is a party to the
   transaction**. Two consequences of that rule that look surprising and
   are deliberate: Germany and Estonia are `'simple'` despite being
   large, serious regimes, because neither has clearance and neither
   reports invoices; Bulgaria, Latvia, Lithuania and Portugal are
   `'complex'` despite having no B2B exchange mandate, because the
   authority receives invoice-level data (SAF-T, VID, i.SAF).

   **Why this is a stored column and not derived.** It used to be
   derived — `getRoiCountries()` ran a regex over
   `deep_dive_page_translations.compliance_model`, a field written as
   prose for human readers. That silently scored **nine** countries with
   real B2B mandates as having none, because their wording happened to
   miss five keywords: Belgium, Denmark, Singapore and Uruguay (in
   force) and Norway, Slovakia, Slovenia, Spain and the United Kingdom
   (dated deadlines). The damage was not cosmetic — a complexity of zero
   contributes **zero integrations** and **removes the country from the
   wave plan entirely**. On the planner's own default selection it
   halved the one-off cost and dropped the United Kingdom out of a
   UK-facing business case.

   The general rule this bought: **a value that drives a
   customer-facing number must be stored, not inferred from prose.**
   Improving the regex would only have moved the next failure.

   ### `eu_member` — set it for EU-27 countries only

   Added 12 Aug 2026 (migration 512), and it means exactly one thing:
   **does ViDA bind this country?** `1` for the 27 member states, `0`
   for everyone else. Note `region = 'Europe'` is *not* a substitute —
   that bucket also holds Norway, the United Kingdom, Iceland, Serbia
   and Turkey, none of which ViDA binds.

   The ROI planner reads it to apply the European Union row's
   `eu-drr` milestone (1 July 2030) to member states, so a member state
   with no national mandate still gets a 2030 wave, marked EU-WIDE. It
   exists because migration 504 de-duplicated eleven per-country ViDA
   entries off the Arrivals board — correctly — and the planner, which
   filters on `on_tracker` and excludes the EU row, could then see
   neither copy. Seven member states silently lost their only future
   deadline.

   **Read that failure carefully, because it will happen again in a
   different shape.** `on_tracker` is a *presentation* flag meaning
   "show this on the board". The planner was using it to answer "is
   this a live obligation". Those were the same question until 504.
   Of 159 off-tracker B2B milestones today, 148 are genuinely
   superseded or interim and 11 are true facts removed only for
   readability — so **you cannot treat `on_tracker = 0` as "not real".**

   Dan also expects `eu_member` to be useful for ViDA go-live content,
   which is a better reason to have it than the bug that prompted it.

   ### Complexity is reviewed weekly — you do not have to remember

   Migration 516 added `roi_complexity_reviews` and a check that runs
   inside the weekly content monitor. It flags any country rated
   `simple` whose own milestones mention clearance, digital reporting,
   SAF-T, RTIR, a 5-corner model or pre-validation, and puts it in the
   digest with the one-line UPDATE that would fix it.

   **Acknowledgements are recorded against a fingerprint of the
   country's milestones, not a flag.** A flag would silence a country
   forever, which defeats the point: add a milestone or move a date and
   the fingerprint changes, and it re-raises carrying the note saying
   what was decided last time and what would change the answer. Silence
   while the facts hold; a prompt the moment they do not.

   So when you add a country, you do not need to get `roi_complexity`
   perfect on day one — but you should still set it deliberately,
   because the check only looks at countries rated `simple`. A country
   wrongly rated `complex` overcharges quietly and nothing will tell
   you.

2. **Milestones + translations** (tracker board and deep-dive timeline)
   - `milestones`: `id` (short country prefix, e.g. `qa-b2b-wave1`),
     `country_id`, `date`, `anchor`, `source_url` (see "Sourcing
     standard" above — this must specifically support the milestone's
     date/scope claim, not just be the country's tax authority in
     general; 47 of 331 existing milestones had no `source_url` at all
     as of the 6 Aug 2026 audit, before even checking whether the
     populated ones were adequate), **`on_tracker`**
     (1 = shows on the main board), **`portals`** (JSON array of
     `{label,url}` — every current board entry has at least one),
     **`confidence`** (`'expected'` for announced-but-unlegislated
     dates, renders the "Expected — not final" badge; else NULL),
     **`mandate_scope`** (migration 254) — `'b2b'` if this milestone is
     (part of) a mandate requiring structured e-invoicing between
     businesses, `'b2g_only'` if it's restricted to invoicing the
     government with no general B2B/B2C mandate attached, or `'none'`
     if it's real and binding but not itself an e-invoicing-mandate-
     scope fact (a software/format certification requirement like
     Spain's VeriFactu, a voluntary/pilot program, a pure tax-reporting
     field addition). **`obligation_status`** (migration 520) —
     `'live'` for anything with `on_tracker = 1`, always. The scaffolder
     emits it, and 520's standing invariant fails the replay if an
     on-board row says anything else: putting a milestone on the
     arrivals board is a claim that a reader should act on it, and that
     claim belongs in the data rather than implied by a presentation
     flag. Off-board rows may default to `'unreviewed'`, but **anything
     dated in the future must be classified** — `live`, `superseded`,
     `restatement` (with `restates_id`) or `context` — or the replay
     fails. The vocabulary and the reasoning behind each value are in
     520's header.

     Why this exists: `on_tracker` only ever meant "show this on the
     arrivals board", and four consumers were reading that editorial
     decision as a statement of fact. That is how a blanket readmission
     of off-board rows once moved the UK's modelled deadline from April
     2029 to November 2026. **This is not optional and has no safe default
     to leave unset** — the column defaults to `'b2b'` for schema
     reasons (most historical rows are exactly that), but a new
     milestone left at the default when it should be `'b2g_only'` or
     `'none'` will silently mis-color the country on **The Map**
     (`/map`, `shared/map-data.mjs`'s `computeCountryMapStatus()`),
     the same "silent inconsistency, not errors" failure mode this
     whole doc guards against elsewhere. See
     `members-worker/migrations/255_mandate_scope_backfill.sql`'s
     header comment for the full worked reasoning and precedent calls
     across every currently-tracked country. If you're using the
     scaffolder (below), it requires `mandate_scope` in the spec and
     validates it's one of the three values — it will not let you omit
     it or guess a fourth value.
   - `milestone_translations`: en/es/de/fr rows with `system`, `desc`,
     `actions` (JSON array). **The tracker board reads these from D1 at
     request time (Stage 5)** — there are no `-data.json` files to edit.

3. **Deep-dive content** — follow `DEEP-DIVE-MIGRATION-CHECKLIST.md`'s
   per-country schema checklist (pages, stats, cards, steps, portals,
   lifecycle cards, optional penalty rows, the `mandate_summary` tile,
   all with ES/DE/FR translations). This is genuine content writing —
   budget real time. Use an existing country with a similar compliance
   model as the template.

4. **Tracking sources** — add the country's official reference URLs to
   `tracking_sources` + `tracking_source_translations` (the `/sources`
   page; migration 214) so it shows up there too. **This is easy to
   forget** because `/sources` was originally seeded from
   `deep_dive_portals` as a one-time bulk operation — the Netherlands
   fell through exactly this gap, added in Phase 3's deep-dive content
   but never carried over to `tracking_sources`, caught only after the
   fact (223). Don't rely on any future bulk seed catching a new
   country automatically; add its sources explicitly, right here,
   every time. In practice this usually means: the same portal(s) used
   in the deep-dive's `deep_dive_portals` (a `NOT EXISTS`-guarded
   INSERT keyed on country + url, same idempotent shape as 215/223),
   plus the EU factsheet page if the country is an EU/EEA member (see
   the factsheet listing referenced in 215's commit message for the
   page-ID-to-country mapping).

5. **(Recommended) A launch story** — a sourced newsletter story tagged
   to the country (see 196–197 for the shape), so subscribers following
   it actually hear about it. Its deep-dive link renders automatically
   from the slug column. For richer day-one archive presence, consider
   a short multi-story arc spanning the past 6–12 months rather than a
   single launch post (see the Netherlands' 221–222 for the pattern) —
   especially useful for a country with an active, ongoing policy
   story rather than one settled event. **This same tagging is also
   what feeds The Map's "Latest updates" panel** (the news list shown
   in the tracker's in-page Map view — see step 6 below) — no extra
   step is needed for that, it rides on the same `story_countries`
   rows and the country's `region`, but it's worth knowing that a
   country with no tagged stories yet will simply show an empty
   "Latest updates" list under its region until one is added.

6. **(Conditional) The Map's D3 rendering overrides** —
   `shared/map-data.mjs` has two hand-maintained lookup tables that
   most new countries *won't* need, but a handful will:
   - **`TOPO_NAME_OVERRIDES`** — the choropleth matches each country to
     a shape in the bundled world-atlas topology
     (`vendor/countries-50m.json`) by name (`c.topoName =
     TOPO_NAME_OVERRIDES[c.name_en] || c.name_en`). If the topology
     spells the country differently than this project's `name_en`
     (e.g. a "Republic of X" vs. plain "X" mismatch, or a different
     English exonym), the match silently fails and the country's shape
     just won't render or color at all — no error, it's simply absent
     from the map. Add an entry mapping `name_en` → the topology's own
     `properties.name` string to fix it.
   - **`MARKER_LONLAT_OVERRIDES`** — for a country with no feature in
     the topology at all (common for micro-states) or one whose shape
     is too small to reliably render or click, this supplies a
     fallback `[lon, lat]` so a clickable marker still appears in
     roughly the right place. `map-panel.js` logs `"The Map: no map
     position for <name> -- add a markerLonLat override."` to the
     browser console when a country has neither a topology shape nor
     an override — that console warning is the reliable signal a new
     country needs one, don't rely on eyeballing the rendered map
     alone (a missing shape can be easy to miss among ~190 others).
   - There's no validation step that catches either of these — check
     the console for the warning above and visually confirm the new
     country's shape or marker actually appears on `/map` before
     calling a launch done. Most countries need neither override; add
     one only if the symptom above shows up.

---

## Phase 2 — The remaining hand-edited files

These are the only per-country manual touchpoints left, each with a
documented reason to exist:

- **`countries.js`** — add the name to the correct region array. Feeds
  the subscribe page's picker (a static page that can't query D1). Keep
  in sync with `in_picker = 1` rows.
- **`shared/deep-dive-render.mjs`'s `COUNTRY_DEEP_DIVE_SLUGS`** — add
  `"CountryName": "country-slug"`. This is site-worker's synchronous
  routing table (decides whether `/something` is a country page before
  any D1 round-trip) and feeds the canonical-URL tag. Must match the D1
  `slug` exactly.
- **`shared/deep-dive-render.mjs`'s `COUNTRY_NAME_TRANSLATIONS`** — add
  `es`/`de`/`fr` entries for the new country (real translations, not the
  English name copy-pasted). Easy to forget precisely because it sits
  right next to `COUNTRY_DEEP_DIVE_SLUGS` in the same file and looks like
  it should be covered by the same edit — it isn't; it's a second,
  separate dictionary. Unlike the country row/name translations in Phase
  1 step 1 (which live in D1 and power everything else), this one is a
  deliberately-kept hardcoded duplicate (see the file's own header
  comment) because the deep-dive page's `<title>` and `<h1>` are
  rendered by `translateCountryName()` from this file, shared
  synchronously between members-worker's admin preview and the public
  `functions/[country].js` Pages Function, neither of which loads it
  from D1. **Confirmed missing for 6 countries as of 3 Aug 2026** —
  Austria, Cyprus, Egypt, Greece, Luxembourg, Netherlands — all added
  after this dictionary was last touched, so their deep-dive pages
  currently show the English name in the `<title>`/`<h1>` even under
  `?lang=es|de|fr`, while the rest of the page (timeline, stats, cards —
  all D1-sourced) translates correctly. Fix those 6 at the same time as
  whichever country prompted you to read this line.
- **`i18n/{en,es,de,fr}.json` `countryNames`** — used by the tracker's
  client-side `translateCountry`. Regenerate from D1 rather than
  hand-editing where possible:
  ```bash
  cd members-worker && python3 migrations/generate_files.py --remote --out i18n-generated
  python3 migrations/compare_generated.py   # confirm only expected diffs
  # copy the genuinely changed files into the real i18n/ folder
  ```
- **Fallback snapshots (optional, recommended occasionally):** the
  tracker HTML's `const DATA` / `const DEEP_DIVES` blobs and the
  `i18n/*-data.json` files are served from D1 on the live site and only
  render if D1 fails. They don't need updating per country — but if
  they've drifted far, refresh them so a mid-outage fallback isn't
  ancient.

**members-worker: nothing.** No file in it needs touching for a new
country.

---

## Phase 3 — The jurisdiction count

**This used to be the step most likely to be missed. It is now two
commands.**

```bash
npm run count        # what disagrees with the database, and where
npm run count:fix    # rewrite the 31 files, and draft the migration
```

The authority is `countries.in_picker = 1`. Everything else is a claim
about it: 40 rows in D1's `translations`, 40 sites across the i18n JSON,
and 16 in static HTML — the education pages, the tracker's and
subscribe's meta descriptions, and `subscribe.html`'s stat tile, which
two separate hand sweeps missed because it is a bare digit with no word
next to it.

`--fix` rewrites the JSON and HTML in place and writes the D1 half as a
**draft migration** into `migrations/drafts/`, ready to review, renumber
and move up. That draft derives every `SET` value from the row's actual
replayed text rather than copying forward what a previous migration
assumed — the mistake that broke 470, 480 and 490 — guards each `WHERE`
on `(namespace, lang, key)` only so it cannot silently match nothing, and
carries its own `-- ASSERT:` line. It is the migration that used to be
written by hand every time.

Two safety properties worth knowing, because they are what let you trust
`--fix`:

- **Nothing matches on a number.** Every site is identified positively
  first — by translation key, by `data-i18n`, or by an exact anchor — and
  only then is a count looked for inside it. Five numbers sitting near
  the count must never move, including Forrester's "70 countries" in a
  whitepaper citation, which is the same number as today's count.
- **It verifies itself.** A `--fix` run re-reads everything afterwards
  and reports the second pass, rather than claiming success from what it
  intended to write.

Belt and braces, invariant 1 in `517_standing_invariants.sql` compares
the same 40 D1 rows against the live country count independently, so
`apply_migrations.py --replay-only` also aborts if the D1 half is
skipped. And `npm run count` runs inside `npm test`.

Historical note kept because it explains the shape of all this: migration
024 exists because count updates were once applied to live files only,
and `generate_files.py` faithfully regenerated the stale D1 text back
over them.

---

## Phase 4 — Ship

```bash
npm install                                   # once ever: installs the PINNED wrangler
cd members-worker/migrations
python3 apply_migrations.py --remote          # validates, applies only what's pending, records each
cd ../../site-worker && npx wrangler deploy   # ships the static-asset edits (countries.js, i18n, counts)
```

**Use `npx wrangler`, not a global `wrangler`.** The root `package.json`
pins an exact version (4.122.0 today) and npx walks up the tree to find
it, so both Workers and the migration runner use the version this repo
was tested against. Before 13 August 2026 there was no pin at all and
`npx` fetched whatever was newest on the day — every deploy ran on a
toolchain nobody chose. `apply_migrations.py` prints which wrangler it
resolved on every run, and says so loudly if it falls back to an
unpinned one.

The runner keeps its bookkeeping in D1's `schema_migrations` table
(migration 205): it refuses to double-apply (the autoincrement-table
duplication trap), applies in order, stops at the first failure with an
accurate record of what got through, and warns on files edited after
they were applied. It also checks each file's `ASSERT` directives
against live D1 immediately after applying it and **before** recording
it, so a migration that ran but had no effect stops the run there
instead of letting later files stack on top of a database that isn't in
the state they assume. To check the live database against every durable
assertion without applying anything:

```bash
python3 apply_migrations.py --remote --assert-only
```

That is the one command that will tell you the production database and
the migration chain genuinely agree — worth running after any manual
D1 edit, and the fastest way to find out whether a migration you
applied by hand months ago actually landed. Production was checked this
way for the first time on 13 August 2026 and all 41 durable assertions
held.

Two housekeeping commands you should rarely need. `--baseline` records
every existing migration file as already-applied without running
anything — one-time setup on a database that predates the tracker table,
and already done here. `--refresh-checksums` re-records the checksum of
an already-applied file that has since been edited, which clears its
drift warning and applies no SQL; review what changed with git first,
because the runner cannot tell a comment-only edit from a substantive
one.

D1-rendered surfaces (board, deep-dive page, menus, preferences,
archive links) pick the country up within the 5-minute edge cache — no
deploy needed for those. The site-worker deploy is only for the Phase
2/3 static-file edits. If any migration errors, don't trust Wrangler's
rollback claim — verify with direct `SELECT`s before re-running, and
mind autoincrement-PK tables where a re-run genuinely duplicates rows
(see the Luxembourg 193 precedent in `PROGRESS.md`).

---

## Phase 5 — Testing checklist

- [ ] `python3 apply_migrations.py --remote --assert-only` passes — the
      live database satisfies every assertion the chain makes. Do this
      first: it is the cheapest check here and the only one that can
      tell you a migration ran without doing anything
- [ ] `npm test` passes from the repo root — replay, assertions, and the
      three browser suites over the ROI planner. A new country changes
      the planner's picker, integration count and wave plan, so the ROI
      regression is a real check on a country add, not boilerplate. Needs
      no credentials and takes about a minute (see `tests/README.md`)
- [ ] Main tracker: milestones on the board (both the arrivals view and
      list view), country in the region filter and sidebar
- [ ] Deep Dives menu + flyout include it (alphabetical within region),
      linking to `/country-slug`
- [ ] `/country-slug` and `/country-slug?lang=fr` render; "← Back to
      global tracker" works; the in-page panel opens from the sidebar
- [ ] On `/country-slug?lang=es`, `?lang=de`, and `?lang=fr`: the
      `<title>` tag AND the on-page `<h1>` show the translated country
      name, not the English one — this specifically catches a missing
      `shared/deep-dive-render.mjs` `COUNTRY_NAME_TRANSLATIONS` entry,
      which won't show up if you only check that the timeline/stats/cards
      translate (those come from D1 and will look fine on their own)
- [ ] Subscribe picker shows it, translated, in all four languages
- [ ] `/members/preferences` shows it (this now comes from D1
      automatically — if it's missing, the country row or a
      `country_translations` row is wrong, not a Worker file)
- [ ] A story tagged to it shows the auto-rendered deep-dive link in the
      archive, **and** (once at least one such story exists) the
      country appears — with its flag and name — in The Map's "Latest
      updates" panel under its region
- [ ] `/sources` lists the country's tracking sources, in all four
      languages
- [ ] Every old count is the new count, in every language, **and** the
      D1 `translations` rows match (round-trip `generate_files.py` +
      `compare_generated.py` to prove it) — **the true count always
      excludes the European Union row** (`slug IS NOT NULL` /
      `in_picker = 1`, never a bare `COUNT(*)` or unfiltered
      `DISTINCT` — see the standing warning on the `countries` table
      in `schema.sql`). This exact mistake has independently recurred
      three times; check any *new* counting logic too, not just text.
- [ ] Board milestone cards translate when switching language (proves
      the `milestone_translations` rows landed)
- [ ] Every `source_url` you set (milestones, story) actually supports
      the specific claim it's attached to — open the link and confirm,
      don't just check that it resolves. See "Sourcing standard" above.
- [ ] **The ROI & Wave Planner** (`/members/roi-calculator`) shows it in
      the country picker with the right complexity pill, and selecting it
      changes the numbers you expect. This is entirely D1-driven, so the
      only inputs are `roi_complexity` (Phase 1 step 1) and the
      milestones' `mandate_scope` / `date` / `on_tracker` (step 2) — but
      the failure mode is silent, so check it rather than assuming:
      - **Complexity pill reads Complex / Simple / No mandate as you
        intended.** A wrong value here is invisible on every other page
        and quietly changes the one-off cost.
      - **If the country has a future dated B2B milestone, it appears in
        the Gantt** under a wave for that date. If it does not, the
        milestone is either `on_tracker = 0`, not `mandate_scope = 'b2b'`,
        or in the past — the planner only back-plans from future dated
        B2B milestones.
      - **Watch for the `on_tracker` interaction.** Taking a milestone off
        the board also takes it out of the planner. Migration 504 did
        exactly that to eleven countries' ViDA 2030 entries for good
        board-tidiness reasons, and seven of them lost their only future
        deadline from the wave plan as a side effect nobody noticed for a
        day. **`on_tracker` now has four consumers, not three**:
        `renderTracker()`, `getMapCountries()`, `getRoiCountries()`, and
        `getMilestonesForCountry()` which deliberately ignores it.
- [ ] The new country appears on **The Map** (`/map`, and the tracker's
      Resources → The Map in-page panel), in the right region, with a
      status that matches its real-world mandate state — this is
      almost entirely D1-driven (`shared/map-data.mjs`), so a correct
      `mandate_scope` per milestone (Phase 1 step 2) is normally the
      only input it needs. The exception is Phase 1 step 6: check the
      browser console for `"The Map: no map position for <name>"` and
      confirm the country's shape (or, for a marker-only country, its
      pin) actually renders and is clickable — if either is wrong or
      missing, it's a `TOPO_NAME_OVERRIDES` / `MARKER_LONLAT_OVERRIDES`
      gap in `shared/map-data.mjs`, not a D1 problem. Clicking the
      country on the map opens the same in-page deep-dive panel as
      everywhere else, and (per the story-tagging item above) any
      tagged story shows up in the region's "Latest updates" list.

---

## Downstream consumers of a country row

Worth keeping current, because the ROI planner was added on 11 Aug 2026
and nobody updated this runbook — which is how nine countries ended up
mis-scored and seven lost their deadlines. **When you build something
new that reads `countries` or `milestones`, add it here and add a Phase 5
check for it.**

| Consumer | Reads | Fails how? |
|---|---|---|
| Tracker board | `milestones` where `on_tracker = 1` | Visibly — the country is missing |
| The Map | `mandate_scope`, `on_tracker`, `region` | Visibly — wrong colour or missing shape |
| Deep dive | all `deep_dive_*` tables, ignores `on_tracker` | Visibly — empty sections |
| Subscribe / preferences | `in_picker`, `country_translations` | Visibly — missing from the list |
| **ROI & Wave Planner** | **`roi_complexity`, `eu_member`, `mandate_scope`, `date`, `on_tracker`, `region`, penalty rows** | **Silently — wrong cost, or absent from the plan with no error** |

The planner is the one that fails quietly, which is exactly why it needs
the explicit Phase 5 check above. Note `region` too: `getRoiCountries()`
maps it with `REG[c.region] || "Eu"`, so a region string that is not one
of the four exact values silently files the country under Europe.

---

## Remaining architectural debt

The per-country hand-edits are down to the three Phase 2 items. Each is
deliberate: `countries.js` because a static page can't query D1, the
shared slug map because routing is synchronous by design, and the i18n
`countryNames` because static pages translate client-side — though that
one at least regenerates from D1 rather than being independently
authored. Collapsing any further means changing those design choices,
not just deleting a duplicate.
