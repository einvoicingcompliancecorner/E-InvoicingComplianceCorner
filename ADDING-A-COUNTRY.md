# Adding a New Country to the Site — Runbook

> **Where this fits.** This is a *procedure* — it answers "what do I do".
> `PROGRESS.md` is the *record* and answers "why is it like this".
> `claude/design-architecture-review.html` is the *map*: the architecture,
> the editorial vocabulary, the failure classes and the release checklist.
> A fact that is a procedure step belongs here; a decision belongs in the
> design review; a change belongs in PROGRESS. **Counts are deliberately
> not restated in this file** — they drift, and a number with no
> connection to the thing it counts is how the "48 countries" bug lasted
> two days.

> **Amended 26 August 2026.** Everything between 11 and 25 August — the
> ROI & Wave Planner, the compliance guides, the headline tiles, the
> e-reporting card, the specification register — arrived *after the last
> country did*. No country has been added since migration 510 on
> 12 August, so none of those surfaces has ever seen one arrive, and the
> scaffolder predates most of them. This amendment adds Phase 1 step 3
> (headline facts), the translation inventory, "What the replay will
> refuse", the count-adjustment list, and the Phase 5 checks for the four
> new surfaces. It also corrects the region vocabulary, which had been
> wrong since migration 451. See `claude/adding-a-country-audit.md` in
> the project for the evidence behind each change.
>
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
- **Which region?** `Europe`, `Middle East / Africa`, `Asia-Pacific`,
  `Americas` — exact case and spelling, everywhere. **That second value
  is a trap.** Migration 451 relabelled it when Kenya and Nigeria
  arrived; D1, `countries.js`, `shared/map-data.mjs`'s `REGION_ORDER` and
  every translation dictionary all say `Middle East / Africa`. The
  scaffolder still validates against the pre-451 `Middle East` and will
  reject the correct value outright — and if you "fix" that by writing
  `Middle East` instead, nothing complains: `getRoiCountries()` maps
  `REG[c.region] || "Eu"`, so the country files silently under **Europe**
  in the ROI planner and falls out of the map's region ordering. Use the
  correct string and patch the scaffolder, never the other way round.
- **The five headline facts.** B2G, B2B, B2C, e-reporting, archiving and
  digital signature, each with a status, a date where the status is
  `planned`, and a source URL. These are not optional polish — they open
  every deep dive and the compliance guide, and the schema will refuse
  several combinations outright. See Phase 1 step 3.
- **Does it belong in the specification register?** Optional — 20 of 70
  countries carry a `country_spec` row today, and `unreachable` or
  `not_yet` are first-class answers. But decide deliberately rather than
  by not knowing the register exists. See Phase 1 step 5.
- **The exact English country name.** Pick once, spell identically in
  every file and migration. A mismatch silently breaks matching between
  the subscribe picker, preferences, and story tagging — and, if it
  doesn't also match the world-atlas topology's own spelling, breaks
  The Map's shape lookup too (see Phase 1 step 8).
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
- **The five headline facts each carry their own source** — `b2g_source`,
  `b2b_source`, `b2c_source`, `archiving_source`, `signature_source`,
  `ereporting_source` — and those feed `cited_sources`, the site's
  "how much of this is primary" figure, and the weekly monitor's watch
  list. `b2b_source` may not be empty, and any host you cite must be
  graded in `source_hosts` or the replay refuses. This is the part of the
  citation gap below that has since been closed, and it is closed only
  for these six fields.
- **The rest of the deep-dive content still has nowhere to put a
  citation at all** (rechecked 26 August 2026 — still true).
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

The remaining steps are written by hand as before. Whether scaffolded or
hand-written, **the runner validates the full in-memory replay before
touching live D1** — the project's non-negotiable, now automated rather
than remembered.

> **The scaffolder was last touched 14 August and has never run against
> the current schema** — no country has been added since migration 510 on
> 12 August. Three things it does not do, until someone fixes it:
>
> - it validates `region` against the pre-451 vocabulary, so the correct
>   `Middle East / Africa` is rejected (see "Before you start");
> - it omits `roi_complexity`, so the country silently lands on the
>   column's `'none'` default — zero integrations in the ROI planner, and
>   permanently invisible to the weekly review, which only inspects
>   countries rated `simple`;
> - it omits `eu_member`, which is harmless today only because all 27
>   member states already exist, so `0` is always the right answer.
>
> Until it is fixed, read what it emits before applying it, and add the
> two columns and their assertions by hand.

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
it. Write invariants **relatively** — compare one table against another,
never against a hardcoded number, which is just a fact with an expiry
date.

**Choosing between the two is not a formality, and getting it wrong is
invisible.** `517_standing_invariants.sql` — a migration containing no
SQL at all — was where the standing set started, but invariants are now
declared in over a hundred files, wherever the claim belongs. What
matters is the keyword, not the file. Migration 608 makes exactly the
right claim about headline-facts coverage, worded exactly the right way,
and declared it `ASSERT:`; the consequence is that a country can ship
without its headline facts and the replay will say *superseded* and pass.
If your claim is "these two things must always agree", the word is
ALWAYS.

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
   Most off-tracker B2B milestones are genuinely superseded or interim,
   but a real minority are true facts removed only for readability — so
   **you cannot treat `on_tracker = 0` as "not real".** `obligation_status`
   is the column that answers that question; ask it, not the flag.

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
   perfect on day one — but you must still **set it explicitly**, because
   the check only looks at countries rated `simple`. Two ways past it,
   both silent: a country wrongly rated `complex` overcharges and nothing
   will tell you, and a country left at the column's `'none'` default is
   priced at zero integrations and is exempt from the review forever.
   The second is the likely one, because the scaffolder does not emit the
   column at all — see the note under the scaffolder above.

2. **Milestones + translations** (tracker board and deep-dive timeline)
   - `milestones`: `id` (short country prefix, e.g. `qa-b2b-wave1`),
     `country_id`, `date`, `anchor`, `source_url` (see "Sourcing
     standard" above — this must specifically support the milestone's
     date/scope claim, not just be the country's tax authority in
     general. The 6 Aug 2026 audit found 47 of 331 milestones with no
     `source_url` at all, before even asking whether the populated ones
     were adequate; that gap has since been closed to zero, and yours
     should not reopen it), **`on_tracker`**
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

3. **Headline facts** (`country_headline_facts` +
   `country_headline_fact_translations` + `fact_history`) — **added to
   this runbook 26 August 2026, and the most likely thing to be missed,
   because nothing fails if you skip it.**

   These are the five tiles that open every deep dive and the compliance
   guide printout: B2G / B2B / B2C as one card, e-reporting, archiving,
   digital signature. Every one of the 70 countries has a row. A country
   without one does not error — `getCountryHeadlineFacts()` returns null
   and `deep-dive-render.mjs` renders an empty string, which loses a
   strip rather than a page. That is correct behaviour for a renderer and
   the reason the omission has to be caught here.

   The migration chain *almost* catches it. Migration 608 declares
   exactly the right claim — "every country except the European Union has
   a headline-facts row", written relatively, one table against another —
   but as a plain `-- ASSERT:` rather than `-- ASSERT ALWAYS:`. A plain
   assertion is point-in-time, so adding a country without facts reports
   it as *superseded*, one line among a hundred and fifty that look
   identical, and the replay passes. **Promote it to a standing invariant
   and this whole step becomes self-enforcing.** Until then, this
   paragraph is the mechanism.

   What the schema will refuse (see "What the replay will refuse" below
   for the full list): a `planned` status with no date; `unknown`
   anywhere without an `unknown_reason`, or an `unknown_reason` with
   nothing unknown; an empty `b2b_source`; a note over 150 characters;
   anything other than exactly four languages of notes; and, for
   e-reporting, `active` without a frequency or a system, `on_request`
   that disagrees with its frequency, or `active`/`planned`/`on_request`
   with no source.

   **`fact_history` is not optional either.** Migration 615's standing
   invariant requires every current headline value to be the newest
   `fact_history` row for that country and field, so a facts row with no
   history breaks the replay — which is the one part of this step that
   *does* stop you. Use `kind = 'first_recorded'` with `old_value NULL`
   for a new country; only later corrections need the four-language
   `fact_history_notes`, and `/changes` renders them.

4. **Deep-dive content** — follow `DEEP-DIVE-MIGRATION-CHECKLIST.md`'s
   per-country schema checklist (pages, stats, cards, steps, portals,
   lifecycle cards, optional penalty rows, the `mandate_summary` tile,
   all with ES/DE/FR translations). This is genuine content writing —
   budget real time. Use an existing country with a similar compliance
   model as the template.

   **Read that checklist knowing what it is.** It is a *migration*
   document — it tells you to pull the stat strip "from the country's
   existing static HTML page", which a new country does not have — and it
   predates the 643–648 sweep, which removed 99 of 354 stat tiles because
   they restated the headline facts above them. Germany was showing
   archiving twice. So: write the free-form strip for what the headline
   tiles do **not** already say — formats, penalties, thresholds, dated
   milestones — and let step 3 carry the five comparable facts. A dated
   tile is a milestone and belongs; "2014 / B2G mandate in force" beside a
   B2G tile reading ACTIVE is a duplicate and does not.

   Only archiving duplicates are caught, and by accident:
   `tests/headline-facts.mjs` asserts that China and Romania are the only
   countries left with an archiving stat tile, so a new one fails the
   suite with a message about the deduplication rather than about you.

5. **Tracking sources** — add the country's official reference URLs to
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

6. **(Optional) The specification register** (`country_spec`,
   `country_spec_artefacts`, `country_spec_translations`) — **new to this
   runbook 26 August 2026; it had never been mentioned.**

   The register answers "can the specification be captured at all", and
   `unreachable` and `not_yet` are first-class answers rather than gaps.
   Twenty of seventy countries carry a row, so leaving a new one out is a
   normal state, not a defect — but it is a decision, and the register's
   query inner-joins `country_spec`, so an absent country is simply
   absent with nothing to notice it. `tests/spec-register.mjs` floors at
   fifteen rows and otherwise only checks that *registered* countries
   render.

   If you do register it, the invariants are strict: four languages of
   `country_spec_translations` and no fewer; `capture_status =
   'published'` requires at least one artefact; `unreachable` and
   `not_yet` may not carry `xsd`/`sch` artefacts; `licence_status =
   'named'` requires a licence string and `unstated`/`unknown` forbid
   one; the country must have a slug; the European Union row may never
   appear; and every artefact URL must be `https://` and land in
   `source_hosts`.

7. **(Recommended) A launch story** — a sourced newsletter story tagged
   to the country (see 196–197 for the shape), so subscribers following
   it actually hear about it. Its deep-dive link renders automatically
   from the slug column. For richer day-one archive presence, consider
   a short multi-story arc spanning the past 6–12 months rather than a
   single launch post (see the Netherlands' 221–222 for the pattern) —
   especially useful for a country with an active, ongoing policy
   story rather than one settled event. **This same tagging is also
   what feeds The Map's "Latest updates" panel** (the news list shown
   in the tracker's in-page Map view — see step 8 below) — no extra
   step is needed for that, it rides on the same `story_countries`
   rows and the country's `region`, but it's worth knowing that a
   country with no tagged stories yet will simply show an empty
   "Latest updates" list under its region until one is added.

8. **(Conditional) The Map's D3 rendering overrides** —
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
   - **`REGION_BOUNDS`** — the third hand-maintained table in that file,
     and the one most likely to bite, because it fails without any
     symptom at all. Each region is drawn through a hand-sized lon/lat
     box, and a country outside its own region's box is simply projected
     off screen: no console warning, no error, no missing-shape hint.
     Decode the new country's real extent from
     `vendor/countries-50m.json` and check it against the box before you
     ship — the file's own comment asks for this, and doing it has now
     twice found a country that was *already* clipped. Kazakhstan was
     found that way in August 2026; Oman was found the same way on
     27 August, clipped on its eastern edge since the day it was added,
     while checking Botswana's southern extent.
   - There's no validation step that catches any of these — check
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
  1 step 1 (which live in D1 and power the rest of the page), this one is a
  deliberately-kept hardcoded duplicate (see the file's own header
  comment) because the deep-dive page's `<title>` and `<h1>` are
  rendered by `translateCountryName()` from this file, shared
  synchronously between members-worker's admin preview and the public
  `functions/[country].js` Pages Function, neither of which loads it
  from D1. A missing entry shows the English name in the `<title>` and
  `<h1>` under `?lang=es|de|fr` while the rest of the page — timeline,
  stats, cards, all D1-sourced — translates correctly, which is why it
  survives a casual check.

  *This paragraph used to name six countries as missing (Austria,
  Cyprus, Egypt, Greece, Luxembourg, Netherlands) and told you to fix
  them alongside your own. They were fixed; the instruction outlived the
  defect. As of 26 August 2026 the dictionary holds 213 entries — 71
  countries × 3 languages — and `COUNTRY_DEEP_DIVE_SLUGS` holds 70,
  matching the 70 slugged rows. Nothing is outstanding; just add yours.*
- **`i18n/{en,es,de,fr}.json` `countryNames`** — used by the tracker's
  client-side `translateCountry`. **This one is checked**, in a place
  nobody would look for it: `tests/spec-register.mjs` compares every
  slugged country against all three translated files, because that is
  where the gap first became visible. Its own comment says so. Regenerate
  from D1 rather than hand-editing where possible:
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
npm run count:fix    # rewrite every stated count, and draft the migration
```

The authority is `countries.in_picker = 1`. Everything else is a claim
about it, in four populations: rows in D1's `translations` on the
count-bearing keys, sites across the i18n JSON, sites in static HTML —
the education pages, the tracker's and subscribe's meta descriptions,
and `subscribe.html`'s stat tile, which two separate hand sweeps missed
because it is a bare digit with no word next to it — and, since August,
sites in the shared render modules.

**How many of each is deliberately not written here.** `npm run count`
prints the current population of every category before it checks
anything, and that printout is the answer; a number copied into this
paragraph is a fact with an expiry date, which is the whole argument of
the note at the top of this file. An earlier version of this section did
restate them, and every one had drifted within three weeks.

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
  only then is a count looked for inside it. A short frozen list of
  numbers sitting near the count must never move: the whitepapers'
  "60-jurisdiction comparison" in English and German, the education
  page's "72 hours", and the ROI whitepaper's "28,000 employees / 70
  countries" — a Forrester citation that happens to carry the same
  number the count has today, and therefore the one most at risk from a
  careless sweep. The moment the count moves off 70 that particular
  collision resolves itself, but the tripwire stays.
- **It verifies itself.** A `--fix` run re-reads everything afterwards
  and reports the second pass, rather than claiming success from what it
  intended to write.

Belt and braces, `517_standing_invariants.sql` compares the same D1 rows
against the live country count independently, and `597_german.sql` does
the same for the ROI planner's own two count-bearing strings. Both are
written relatively — `LIKE '%' || (SELECT count(*) FROM countries WHERE
in_picker = 1) || '%'` — so `apply_migrations.py --replay-only` aborts if
the D1 half is skipped. And `npm run count` runs inside `npm test`.

**This is the part of a country addition that works, and it is worth
knowing why.** A test country added to a copy of the chain on 26 August
2026 was refused at replay by exactly those two invariants, before
anything touched a database, with the message naming both. Nothing else
in the chain noticed the new country at all. Relative invariants are the
difference; every check in this file that compares against a stored
number instead is one country away from being wrong.

### What a changed count actually touches

Two of these are new since the count machinery was written, so a hand
sweep that once worked no longer covers everything:

| Surface | What states the count | Fixed by |
| --- | --- | --- |
| D1 `translations` | the count-bearing keys registered in 517, 579 and 597, in four languages | the draft migration `--fix` writes |
| i18n JSON | `countryNames` and the count-bearing strings, per language | `--fix`, in place |
| Static HTML | education pages, tracker and subscribe meta/og/twitter descriptions, `subscribe.html`'s bare stat tile | `--fix`, in place |
| **Shared render modules** | count sites inside `shared/*.mjs` | `--fix`, in place |
| **ROI planner strings** | `roi.page.lede`, `roi.input.countrySearch` | the same draft migration; guarded by 597 |
| Frozen citations | must **not** move — see above | nothing; `--fix` asserts they survived |

Everything else that looks like it depends on the count does not.
The subscribe picker, the preferences checklist, the deep-dive menus,
the ROI country list, The Map and the compliance guides all count the
rows themselves at request time, so they follow `in_picker` without
being told. The count is only ever a problem where it was written into
*prose*.

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
way for the first time on 13 August 2026 and every durable assertion
held. The chain has grown severalfold since; the run prints how many it
checked, which is the number to read rather than one written here.

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
- [ ] `npm test` passes from the repo root — the replay and its
      assertions, the jurisdiction count, and the browser suites. It is
      thirty-odd suites now rather than the handful this line used to
      name, and several of them are real checks on a country add: the ROI
      regression (a new country changes the planner's picker, integration
      count and wave plan), `headline-facts.mjs` (which renders pages at
      five widths in four languages), `guides-consistency.mjs`,
      `spec-register.mjs`, and `country-pages.mjs`, which asks the router
      for every slug and is the one that fails if your country has no
      deep dive yet. Needs no credentials and takes a couple of
      minutes (see `tests/README.md`)
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
- [ ] **The headline strip is at the top of the deep dive**, in all four
      languages, with all six facts and none of them blank — an unknown
      must print NOT CONFIRMED, never nothing. This is the check for
      Phase 1 step 3, and it is worth doing by eye rather than by test:
      a missing `country_headline_facts` row renders as a page with no
      strip, which looks like a design choice
- [ ] **No fact appears twice.** Read the headline tiles and the
      free-form stat strip below them together — the sweep of 643–648
      removed 99 tiles that said what a tile above already said, and a
      new country is the easiest way to put them back
- [ ] **The compliance guide** (`/compliance-guides`, and the printable
      `/compliance-guides/guide?c=…`) shows the country with the same six
      facts, in the same words, as the deep-dive strip. The two surfaces
      share one renderer precisely so a reader cannot find a discrepancy;
      if they differ, something is wrong in the data, not the layout
- [ ] **The e-reporting card** states the right thing. `unknown` is a
      legitimate answer and prints NOT CONFIRMED; `active` must name a
      system and a frequency
- [ ] **The specification register** (`/spec-register`) — if you added a
      `country_spec` row, the country appears with its artefacts in all
      four languages. If you deliberately did not, confirm that was a
      decision. An unregistered country is silently absent
- [ ] **/changes** lists the country's facts as first recorded, which
      proves the `fact_history` rows landed
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
      only input it needs. The exception is Phase 1 step 8: check the
      browser console for `"The Map: no map position for <name>"` and
      confirm the country's shape (or, for a marker-only country, its
      pin) actually renders and is clickable — if either is wrong or
      missing, it's a `TOPO_NAME_OVERRIDES` / `MARKER_LONLAT_OVERRIDES`
      gap in `shared/map-data.mjs`, not a D1 problem. Clicking the
      country on the map opens the same in-page deep-dive panel as
      everywhere else, and (per the story-tagging item above) any
      tagged story shows up in the region's "Latest updates" list.

---

## Every translation a new country needs

Added 26 August 2026, because the translation work had grown across four
migrations and was never written down in one place. Four languages
throughout — `en`, `es`, `de`, `fr` — and **real translations, not the
English pasted four times**; several of these are checked, and the ones
that are not are the ones a reader notices.

In D1:

| Table | What is translated | Enforced? |
| --- | --- | --- |
| `country_translations` | the display name | yes — 517 requires ≥4 rows per country |
| `milestone_translations` | `system`, `desc`, `actions` per milestone | the scaffolder asserts one row per language per milestone |
| `country_headline_fact_translations` | six notes: B2G, B2B, B2C, e-reporting, archiving, signature | **yes, three ways** — exactly four languages, no non-English note null where the English is present, and every note ≤150 characters |
| `fact_history_notes` | why a fact changed | yes, for corrections — four languages, or the replay fails |
| `country_spec_translations` | `gap_note` | yes, if the country is registered — exactly four |
| `deep_dive_*_translations` | pages, stats, cards, steps, portals, lifecycle, penalty rows | per `DEEP-DIVE-MIGRATION-CHECKLIST.md` |
| `tracking_source_translations` | the `/sources` entry | no |
| `story_translations` | the launch story | no |
| `translations` | the count-bearing strings | yes — 517 and 597, relatively |

In files:

- `shared/deep-dive-render.mjs`'s `COUNTRY_NAME_TRANSLATIONS` — `es`,
  `de`, `fr`. Nothing checks this; a miss shows the English name in the
  `<title>` and `<h1>` while the whole page below it translates.
- `i18n/{en,es,de,fr}.json` `countryNames` — regenerate from D1 with
  `generate_files.py` rather than hand-editing.
- `countries.js` — the English name only.

The 150-character ceiling on headline notes is the one that catches
people out. It is a layout constraint, not a style preference: the tiles
render at a fixed width in four languages, and German is reliably the
longest. Write the English note short enough that its translations still
fit.

---

## What the replay will refuse

The fastest way to understand a country addition is to know which
mistakes stop you and which do not. Run
`python3 apply_migrations.py --replay-only` early and often; it needs no
credentials, no network and no target.

**It will refuse** a country whose translations number fewer than four; a
milestone with no matching country; an `on_tracker = 1` milestone whose
`obligation_status` is not `live`, or a future-dated off-board milestone
left `unreviewed`; a `mandate_scope` outside the three values; headline
facts that are `planned` with no date, `unknown` with no reason, or carry
a reason with nothing unknown; an empty `b2b_source`; a headline note
over 150 characters, or notes in other than four languages; e-reporting
that is `active` without a frequency or a system, or `on_request`
disagreeing with its own frequency; a headline fact with no matching
newest `fact_history` row; a cited URL whose host is not graded in
`source_hosts`; a `source_hosts` host that is not bare lowercase; a
`country_spec` row without four translations, or `published` with no
artefacts, or a non-https artefact URL; and — the moment `in_picker = 1`
takes the count up — any count-bearing string in D1 that still states the
old number.

**It will not refuse** a country with no headline facts at all (migration
608 makes that claim as a point-in-time `ASSERT:` rather than an
`ASSERT ALWAYS:`, so it is reported as *superseded* among a hundred and
fifty similar lines and the replay passes); a country left at the
`roi_complexity = 'none'` default; a country with no `country_spec` row;
a stat tile that duplicates a headline tile, unless it happens to be
about archiving; or a `COUNTRY_NAME_TRANSLATIONS` entry you forgot,
which lives in a file the replay never reads.

**And nor will it refuse a country with no deep-dive content**, whose
page is then a 404 that the tracker, the map and every neighbouring
country's related-jurisdictions block all link to. `npm test` was green
in exactly that state on 26 August 2026. `tests/country-pages.mjs` was
written that day and asks the router for every slug; it is the check that
turns this from a silent gap into a failing suite.

Those are the list this runbook exists to carry, because the replay will
not.

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
| **Deep-dive headline strip** | **`country_headline_facts` + translations** | **Silently — the strip is absent and the page looks deliberate** |
| **Compliance guides** | **the same facts, plus `roi_complexity`, `eu_member`, `region`** | **Silently — the guide falls back to free-form stats and looks finished** |
| **Specification register** | **`country_spec`, `country_spec_artefacts`** | **Silently — the country is simply not in the register** |
| **/changes** | **`fact_history`, `fact_history_notes`** | **Loudly, for once — the replay refuses a fact with no history** |
| **Content monitor** | **`tracking_sources`, and `monitored_sources` over every cited URL** | **Silently — the country's pages are watched by nothing and the weekly sweep reports clean** |

The bottom five are all newer than the paragraph above them, and four of
the five fail silently. That is not coincidence: a surface that reads a
country row and finds nothing has no way to distinguish "not yet" from
"nothing to say", and both render as a tidy page.

The planner is the one that fails quietly, which is exactly why it needs
the explicit Phase 5 check above. Note `region` too: `getRoiCountries()`
maps it with `REG[c.region] || "Eu"`, so a region string that is not one
of the four exact values silently files the country under Europe.

---

## Remaining architectural debt

The per-country hand-edits are down to the Phase 2 items, and each is
deliberate: `countries.js` because a static page can't query D1, the
shared slug map because routing is synchronous by design, the shared
`COUNTRY_NAME_TRANSLATIONS` dictionary because two callers render the
deep-dive `<title>` and `<h1>` synchronously without loading D1, and the
i18n `countryNames` because static pages translate client-side — though
that one at least regenerates from D1 rather than being independently
authored. Collapsing any further means changing those design choices,
not just deleting a duplicate.

`COUNTRY_NAME_TRANSLATIONS` is the weakest of the four, because it is the
only one nothing checks. The other three are each compared against D1 by
something — the count sweep, the slug map's use in routing, the
regenerator. A missing name translation is caught by a person opening
`/country-slug?lang=de` and reading the tab, which is why that is an
explicit line in Phase 5.

---

## Registration steps that nothing will remind you about

Added 24 August 2026, after a shipped feature never reached the
notification system because nobody wrote it into the table that drives it.

**A monitor cannot see what was never declared to it.** These are the
registrations a new country needs. Each one, if skipped, produces no
error, no failing test and no visible symptom — the system reports
success, because as far as it can see there is nothing there.

This is the companion to "What the replay will refuse" above. That
section lists what stops you; this one lists what does not — and the
second list is the one that needs a person.

| Register | Skipping it means | Caught by |
| --- | --- | --- |
| `tracking_sources` | the country's official pages are **watched by nothing**, and the weekly monitor reports a clean sweep | **caught, indirectly**: `/sources` builds its JSON-LD Dataset count from this register, so an absent country makes the site under-report its own coverage, and `structured-data.mjs` compares that number against `countries`. An accidental guard rather than a designed one — keep it deliberately |
| `country_headline_facts` + its translations | the deep dive loses its headline strip and the guide falls back to the country's free-form stats — both render cleanly and look finished | nothing, today. `guides-consistency.mjs` floors at sixty countries and compares what exists, not what is absent; 608's coverage claim is a point-in-time `ASSERT:`, so it reports *superseded* and passes |
| `fact_history` for those facts | — | **caught**: 615's standing invariant requires every current value to be the newest history row |
| `country_spec` + its translations | the country is absent from the specification register | nothing — and absence is a legitimate state, so this one is a decision to record rather than a gap to close |
| `*_source` on every headline fact | the citation is invisible to `cited_sources`, so the site's own "how much is primary" figure silently excludes it — and the URL never reaches `monitored_sources`, so the weekly monitor never looks at it | 613's standing invariant, **only once the row exists** |
| a `source_hosts` tier for any new host | the standing "every cited host is graded" invariant fails — this one **does** catch you. The column is `tier`, not `grade`: `primary`, `institutional`, `secondary`, `unknown`, and `unknown` needs a note | `apply_migrations.py` |
| `roi_complexity` | the country is priced at zero integrations and is exempt from the weekly complexity review, which only inspects countries rated `simple` | nothing |
| `countries.slug` | no deep dive, and the country is excluded from the jurisdiction count | `jurisdiction-count.mjs` |

The pattern is worth carrying beyond this list: **an unperformed
registration is indistinguishable from a clean result.** Where a check
exists it compares two registers against each other, which catches one
being updated without the other — but nothing can catch a thing written
into neither. That is what the release checklist in the design review is
for, and it is the one place in this project where the answer is a person
with a list rather than an assertion.
