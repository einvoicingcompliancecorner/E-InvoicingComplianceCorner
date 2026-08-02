# Deep-Dive Country Migration Checklist

This is the working reference for moving each country's deep-dive page from a
static HTML file into the dynamic D1-backed architecture (Stage 4 of the
country-adding rework). Built from real bugs caught while migrating Portugal,
France, and Germany — treat every item here as something to actively check,
not just be aware of. Several of these were only caught because a human
looked closely at the rendered page, not because an automated check found them.

Update this file whenever a new country reveals a new pattern or a new bug
gets caught. It should get more complete over time, not just longer.

---

## 1. Content extraction (per country)

Pull all of this from the country's existing static HTML page, plus the
tracker's own `DATA` array:

- [ ] **Milestones** — every entry in the deep-dive's `.rtimeline` section,
      not just the ones that also appear on the tracker. Deep-dive pages are
      often more granular (Portugal had 11 timeline entries vs. 3 on the
      tracker; France had 5 vs. 2).
- [ ] **Tracker phrasing wins** — for any milestone that exists in *both* the
      tracker's `DATA` array and the deep-dive page, use the tracker's
      `system`/`desc`/`actions` text, not the deep-dive's own wording. This is
      a standing rule, confirmed with the user during Portugal's review.
      **The tracker can also have genuinely more current information than
      the deep-dive** — Spain's deep-dive had one vague "Pending" timeline
      entry for its B2B mandate, while the tracker had two specific,
      concretely-dated entries (marked `confidence:'expected'` in the
      tracker's own DATA). Check the tracker's version even for milestones
      that don't look identical at first glance — don't assume the
      deep-dive is always the richer source, as it was for Portugal/France.
- [ ] **New structural component discovered** (e.g. Spain's `.status-banner`
      at the top of the page) is a genuine decision point, not an automatic
      "build it" — ask the user first. Spain's banner was folded into an
      existing section's intro text instead of built as new schema, per
      user preference to avoid proliferating one-off components. Don't
      assume every new visual pattern needs its own table. **Inline badge
      tags on card headings** (the UK's "Confirmed"/"Pending Budget 2026")
      were a similar decision point, but a much smaller one — a nullable
      `badge_label`/`badge_type` column pair on the existing
      `deep_dive_card_translations` table, not a new set of tables. Worth
      distinguishing "genuinely new content type" (build schema, ask first)
      from "small optional field on an existing table" (much lower cost,
      still worth flagging but a smaller decision either way).
- [ ] **5 section intros** — the `<p class="section-intro">` text under each
      of the 5 section headings (timeline, file format, scope, steps,
      penalties). Easy to miss because they're not part of milestones or
      cards — this exact gap slipped through on Portugal's first pass.
- [ ] **Stat strip** — all entries in `.stat-strip`.
- [ ] **Cards** — file_format, scope_transmission, and penalties_related
      sections. Note whether each card is rows-based (spec-card) or
      body-based (related-card, narrative only).
- [ ] **Steps** — the numbered `.steps` list.
- [ ] **Portal link(s)**.
- [ ] **Compliance model** (short label, top-right of page) and **footer
      disclaimer**.
- [ ] **Lifecycle pills**, if the country has an invoice lifecycle status
      system (France did; Germany didn't). Check for a `.lifecycle` div.
      Don't assume every country has or lacks this — check directly. **Also
      check for other pill-list components under a different class name**
      (Poland's `.mode-grid` offline modes turned out to have CSS identical
      to `.lifecycle` — reuse the same infrastructure rather than treating
      every differently-named pill list as a new content type). **The card's
      own `<h3>` heading is easy to drop entirely** — this happened on the
      very first build (France's "Lifecycle status exchange" heading was
      silently missing since the function was created) and went unnoticed
      until Poland's review. Confirm the heading actually renders, not just
      the intro text and pills. **Check whether there's text both before
      *and* after the pills** — Poland's card has two genuinely separate
      paragraphs (a short one before the pills, a longer one after), which
      got merged into one during extraction and silently dropped the second
      paragraph. Don't assume a single combined note; check the actual HTML
      structure around the pills element directly. **A country can have
      more than one pill-list card** — Malaysia has two, genuinely separate
      ("Submission methods" and "Validation lifecycle"), both in the same
      section. The schema was originally one-card-per-country (a real
      limitation caught here) and was generalized to support any number of
      cards per country, in any section — check the static page for every
      distinct pill-list element, don't assume a country has at most one.
      **Check whether pill labels are actually short enough to look right
      as pills** — Malaysia's "Submission methods" labels ("Manual entry
      via MyInvois Portal") overflowed the compact pill styling, which is
      designed for short single-word labels. A `display_style`
      (`pills`/`list`) flag on the card handles this — set to `list` for
      cards with longer phrases, matching the plain-list rendering rather
      than forcing long text into a pill shape.
- [ ] **Penalty table**, if the country has a genuine, sourced fine schedule
      (as opposed to narrative-only related-cards). Check for a
      `.penalty-table`/`.penalty-card` element specifically.

## 2. Badge status — simplified to 2 states

The tracker/deep-dive originally used 3 badge states (`inforce` / `soon` /
`upcoming`). **Per user decision, this is simplified to 2 states everywhere**
(`inforce` / `upcoming`), based purely on whether the milestone's date has
passed — never based on the `anchor` flag, which serves a completely
different purpose (grouping into the tracker's active list vs. a collapsed
historical section). A static page showing "Due soon" for a milestone will
correctly become "Upcoming" in the new rendering — this is expected, not a bug.

## 3. Structural round-trip verification

Before pushing, always run both of these — they've each caught real,
distinct errors:

- [ ] **Count check**: milestones, stats, cards (per section), steps,
      portals, penalty rows, lifecycle statuses — compare the D1 count
      against a direct count from the static HTML (`grep -c` on the relevant
      CSS class). Every count must match exactly.
- [ ] **Badge/date cross-check**: for every milestone, compute
      in-effect/upcoming from the date alone and compare against what the
      static page actually shows (accounting for the 3→2 state
      simplification above). This caught a real date typo in Portugal
      (`2026-11-27` should have been `2025-11-27`) that the count check alone
      would not have caught.
- [ ] **Card structural consistency across languages** (once translated):
      every language must have the same row-count (for spec-cards) or the
      same body-vs-rows shape (for related-cards) as English. Zero
      mismatches, every time.

## 4. Visual theme — shared standard, not per-country

All countries use the **same light-paper CSS theme** (per user decision — see
`.spec-card`, `.rcard`, `.penalty-table`, `.related-card` etc. in
`renderFullDeepDivePage`). This was based on France's original CSS, since it
was more refined than Portugal's — including:
- The monospace, uppercase `.spec-card h3` heading with a trailing rule
  (`::after`).
- A fixed 42% key-column width in `.spec-row` so values align consistently
  down the card.
- A divider line (`border-top`) separating `.spec-card p.note` from the rows
  above it.

**Do not re-derive this from scratch per country.** If a country's static
page shows something structurally different from this shared standard (like
France's lifecycle pills or penalty table), that's a genuine new content
*type* to support (see the schema in `049_tracker_deepdive_schema.sql` /
`057_lifecycle_penalty_schema.sql`), not a reason to introduce a new visual
style.

## 5. Known translation gaps — check every one of these explicitly

These are **shared structural chrome**, not per-country content, which is
exactly why they're easy to miss — content-focused checks won't catch them.
Confirmed already fixed in the shared template as of Germany, but **always
switch language and read every visible label on the page**, not just the
country-specific content, before considering a country done:

- [ ] Back-link ("← Back to global tracker") — must use `t(lang,
      "backToTracker")`, not a hardcoded string.
- [ ] Badge labels ("In effect" / "Upcoming") — `t(lang, "inEffect")` /
      `t(lang, "upcoming")`.
- [ ] Penalty table headers ("Failure" / "Fine" / "Annual cap") — `t(lang,
      "penaltyFailure")` etc.
- [ ] 5 section headings, country-eyebrow, and "Last updated"/"Compliance
      model" meta labels — `t(lang, "secTimeline")` etc. (added after being
      caught on Germany — check these are actually still translated for
      every new country, since it's a shared template, but confirm rather
      than assume).
- [ ] Font-loading `<link>` tags in `<head>` — missing these silently falls
      back to a generic system font for `'Big Shoulders Display'`
      specifically (looks "wider"/less refined, easy to not notice unless
      compared directly against the original).
- [ ] Flag emoji — derived algorithmically from the ISO country code (see
      `handleDeepDivePreview`), not a hardcoded per-country map. Already
      fixed properly, but if a new per-country flag hack ever gets
      introduced again, remove it.
- [ ] Language switcher — the preview page's switcher must preserve
      `?country=`, not just `?lang=` (the shared `renderLangSwitcher`
      component would drop it).

## 6. Migration file numbering

Each country typically needs (numbers shown are illustrative — check the
actual next available number in `members-worker/migrations/`):
1. `NNN_<country>_milestones.sql`
2. `NNN_<country>_deepdive_content.sql`
3. `NNN_<country>_milestone_translations.sql`
4. `NNN_<country>_deepdive_translations.sql`

Schema-level changes (new content types, new columns) get their own
migration and should be genuinely rare after Stage 4's initial build-out —
if a new country seems to need one, that's worth flagging explicitly before
building it, the way the lifecycle-pills/penalty-table schema was discussed
with the user before being added.

## 7. Current schema reference (as of migration 091)

The next new migration should be numbered **168**. Everything below is
confirmed applied to the live database as of this writing. Rather than
reconstructing this by reading every migration file in sequence, use this
as the authoritative map of what exists and what each table is for.

**Core content tables** (one row per country, or per country+language):
- `milestones` / `milestone_translations` — the tracker timeline entries,
  shared between the tracker's own display and each deep-dive page's
  timeline section (see section 1's "tracker phrasing wins" rule)
- `deep_dive_pages` / `deep_dive_page_translations` — one row per country
  per language, holding `compliance_model`, `footer_disclaimer`, and the
  5 section-intro fields (`timeline_intro`, `file_format_intro`,
  `scope_intro`, `steps_intro`, `penalties_intro`)
- `deep_dive_stats` / `deep_dive_stat_translations` — the stat-strip
- `deep_dive_cards` / `deep_dive_card_translations` — spec-cards (rows-based)
  and related-cards (body-based) across the 3 sections (`file_format`,
  `scope_transmission`, `penalties_related`). Also holds the optional
  `badge_label`/`badge_type` columns (added migration 085) for inline
  "Confirmed"/"Pending" tags on card headings — nullable, most cards don't
  use this
- `deep_dive_steps` / `deep_dive_step_translations` — the numbered
  "Getting compliant" steps
- `deep_dive_portals` / `deep_dive_portal_translations` — official source
  links

**Penalty tables** (optional — only for countries with a genuine, sourced
fine schedule):
- `deep_dive_penalty_rows` / `deep_dive_penalty_row_translations` — real
  tabular data (Failure / Fine / Annual cap), added migration 057

**Lifecycle/pill-list cards** (optional — current schema, added migration
078, superseding an earlier one-per-country design):
- `deep_dive_lifecycle_cards` — one row per pill-list card; a country can
  have zero, one, or several (Malaysia has two). Has a `section` field
  (which of the 3 sections it belongs in) and a `display_style` column
  (`pills` default, or `list` for cards whose labels are too long for
  compact pills — added migration 088)
- `deep_dive_lifecycle_card_translations` — `title`, `intro_text` (before
  the pills), `outro_text` (after the pills) — both intro and outro are
  genuinely optional and independent; check the static page for text on
  *both* sides of the pills, not just one
- `deep_dive_lifecycle_statuses_v2` / `deep_dive_lifecycle_status_v2_translations`
  — the actual pill/list items, linked to a specific card via `card_id`

**Deprecated, unused tables — do not use these:**
`deep_dive_lifecycle_intro`, `deep_dive_lifecycle_intro_translations`,
`deep_dive_lifecycle_statuses`, `deep_dive_lifecycle_status_translations`.
These were the original one-card-per-country design (migration 057),
superseded by the `_v2`/`_cards` tables above (migration 078) once Malaysia
revealed the need for multiple cards per country. Left in place rather than
dropped, since France's and Poland's original data lived there before being
migrated into the new structure — they're harmless, empty of anything
current, and safe to ignore.

**Rendering code** (`members-worker/src/index.js`): `getDeepDiveContent()`
queries all of the above; `renderFullDeepDivePage()` builds the full page
HTML; `renderTrackerStyleMilestones()`/`renderDeepDiveStyleMilestones()`
render milestones two different ways from the same data;
`renderLifecycleCard()`/`renderLifecycleCardsForSection()` handle the
pill/list cards; `renderSpecCard()`/`renderRelatedCard()`/`renderPenaltyTable()`
handle the other card types. Preview routes: `/admin/preview/deep-dive?country=X`
and `/admin/preview/milestones?country=X`, both accepting `&lang=` and
neither requiring authentication (no sensitive data involved).

## 8. Batch status (this list, updated as we go)

- [x] Portugal — content + translations complete
- [x] France — content + translations complete (revealed lifecycle pills,
      penalty table, and the theme-unification decision)
- [x] Germany — content + translations complete (revealed the audit-access
      card pattern; confirmed no-lifecycle-system case works correctly)
- [x] Poland — content + translations complete (revealed the pill-list
      reuse pattern: "offline modes" use different CSS class name but
      identical styling to lifecycle pills)
- [x] Spain — content + translations complete (revealed that the
      tracker can have more current info than the deep-dive, and a new
      status-banner component that was folded into existing section-intro
      text per user preference, rather than built as new schema)
- [x] Malaysia — content + translations complete (revealed that a
      country can have *multiple* separate lifecycle-pill cards, not just
      one — required generalizing the schema from one-card-per-country to
      many-per-country, with France's and Poland's existing data migrated
      into the new structure)
- [x] United Kingdom — content + translations complete (revealed
      inline badge tags on card headings, "Confirmed"/"Pending Budget
      2026" — built as a small nullable field pair on the existing card
      translations table, not new tables; status-banner folded into
      scope_intro per user preference, matching Spain's precedent)

**All 6 countries in the original priority batch are now fully complete —
content and translations both verified.** Portugal, France, Germany,
Poland, Spain, Malaysia, United Kingdom. Remaining from the original
gap-audit list: Peru. Beyond that, the other ~23 countries not yet
touched by Stage 4 still use the static architecture this whole effort is
meant to replace.

- [x] Romania — content and translations complete (migrations 092-095).
      No lifecycle/pill-list cards, no tabular penalty schedule (penalties
      are narrative-only, a related-card like SAF-T and e-Transport). One
      milestone (`ro-nonvat-register`, ANAF Order 378/2026) needed a date
      the static page didn't give (just "2026"); confirmed as 2026-06-01
      with the user rather than guessed. ro-established/ro-sme translations
      reused verbatim from the tracker's existing i18n/{lang}-data.json
      rather than re-translated, per tracker-phrasing-wins.
- [x] Belgium — content and translations complete (migrations 096-099).
      First country in the post-original-batch group with a genuine
      tabular penalty schedule (`deep_dive_penalty_rows`, 3 rows: progressive
      €1,500/€3,000/€5,000 fines) alongside narrative related-cards in the
      same penalties_related section — confirms a country can have both at
      once. One deep-dive-only milestone (`be-b2g-phasein`) compresses a
      4-stage B2G rollout (Oct 2022 -> Mar 2024, phased by contract value)
      into a single dated milestone, using the completion date. None of
      Belgium's tracker DATA entries use anchor:true, so the 3 shared ids
      (be-mandate, be-penalty, be-ereport) keep anchor=0 to match rather
      than defaulting to anchor=1 like Romania's flagship milestone did.
- [x] Finland — content and translations complete (migrations 100-103).
      No lifecycle cards, no penalty table -- genuinely correct, not a gap:
      Finland has no domestic B2B mandate at all, so there's no fine
      schedule to cite (all 4 penalties_related cards are narrative,
      explaining *why* there's nothing to enforce). fi-b2g keeps the
      tracker's anchor:true (Finland's one genuinely binding requirement,
      B2G); fi-en-standard and fi-vida keep anchor=0 to match the tracker.
      fi-early2000s uses 2000-01-01 as a stand-in for the static page's own
      vague "Early 2000s" label -- doesn't affect the in-effect/upcoming
      badge outcome either way, so no need to ask the user this time.
- [x] Croatia — content and translations complete (migrations 104-107).
      Two structural notes worth attention: (1) the static page's
      `.flow-grid` element ("The three parallel processes") is a
      pill-shaped badge list with intro/outro text, structurally identical
      to the existing lifecycle-pill infrastructure under yet another new
      class name -- mapped onto `deep_dive_lifecycle_cards` rather than
      built as new schema, extending the Poland `.mode-grid` precedent.
      (2) Croatia's penalty table has a genuine Companies-vs-Individuals
      column split that the fixed 3-column schema (Failure/Fine/Annual cap)
      doesn't support -- there's no real "annual cap" concept here. Combined
      both figures into `fine_amount` as a single string rather than
      mislabel data under a header it doesn't match. Worth a proper schema
      look (a 4th penalty-row column?) if more countries show this same
      split -- flagging now rather than deciding silently.
- [x] Denmark — content and translations complete (migrations 108-111).
      Structural note worth flagging: the tracker's `dk-established` and
      `dk-small` DATA entries don't map cleanly onto any single deep-dive
      timeline card by date or topic (dk-established falls inside the
      deep-dive's compressed "Phased rollout" range card without being
      separately called out there; dk-small shares a date with the
      unrelated "NemHandel-by-default" card by coincidence, not overlap).
      Kept both as their own non-deduplicated milestone rows rather than
      merging into a range card, giving Denmark 11 total milestones (9
      deep-dive + 2 tracker-only). Penalty table uses a generic 2-row
      Factor/Range shape (statutory range + severity factors) rather than
      a failure-type list -- simpler than Croatia's Companies/Individuals
      split, mapped directly onto failure_description/fine_amount with
      annual_cap NULL for both rows. No lifecycle/pill-list cards. Also
      notable content-wise: Denmark's Bookkeeping Act is a technical-
      capability mandate, not a universal-transmission mandate -- a
      meaningfully different compliance model from every clearance-model
      country covered so far, and mid-migration from OIOUBL 2.1 to a
      NemHandel BIS 4 / Peppol PINT format (OIOUBL 3.0 was cancelled
      outright in Jan 2026).
- [x] Ireland — content and translations complete (migrations 112-115).
      Unlike Denmark, Ireland's 2 tracker DATA entries (`ie-phase1`, `ie-phase2`)
      map exactly onto 2 of the deep-dive timeline's 9 cards by date and topic,
      so tracker phrasing wins for those two rather than being kept as separate
      rows -- 9 total milestones, not 11. Reused the existing badge_label/
      badge_type columns (migration 085, built for the UK) on 3 file_format
      cards for the page's own Confirmed/Pending technical-spec distinction;
      folded the status-banner explaining that distinction into scope_intro
      rather than new schema, per the UK/Spain precedent. No penalty table --
      Revenue hasn't published a fine structure yet, genuinely correct (like
      Finland and the UK), not a gap. No lifecycle/pill-list cards. One
      timeline entry (`ie-phase1-criteria-reconfirmed`, 2 Oct 2026) shows
      "In effect" on the static page but computes as "upcoming" under our
      date-based badge rule (today = 2026-08-01) -- expected divergence, not
      a bug, since the static page was authored from a different vantage
      point in time.
- [x] Australia — content and translations complete (migrations 128-131).
      First Asia-Pacific-batch country. All 3 tracker DATA entries
      (`au-ncereceive`, `au-30pct`, `au-automate`) map exactly onto 3 of
      the deep-dive timeline's 7 cards by date/event, so tracker phrasing
      wins for all three -- 7 total milestones, not 10. `au-ncereceive`
      inherits anchor=1 from the tracker's anchor:true. The static page's
      `.flow-grid` element ("The four corners") is a pill-shaped badge
      list -- mapped onto `deep_dive_lifecycle_cards` rather than a
      regular spec card, extending the Croatia/Poland precedent (note the
      renderer always places lifecycle cards after regular spec cards
      within a section, so "The four corners" — first on the static page —
      renders last in the scope_transmission section here; an accepted,
      pre-existing rendering-order limitation, not something introduced by
      this migration). No penalty table (no B2B mandate exists yet,
      narrative-only). Notable content-wise: Australia has no general B2B
      e-invoicing mandate at all -- only a demanding internal compliance
      regime for federal agencies (Non-Corporate Commonwealth Entities),
      building toward a 30% Peppol-processing target (Jul 2026) and full
      automation (Dec 2026). Shares the PINT A-NZ specification with New
      Zealand, aligned toward newer Peppol markets (Singapore, Malaysia,
      Japan) -- worth watching for consistency when New Zealand is
      migrated next in this batch.
- [x] Sweden — content and translations complete (migrations 124-127).
      `se-b2g` (tracker, anchor:true) exactly replaces deep-dive timeline
      card #3 (1 Apr 2019 full EN 16931 mandate) -- same date/event, tracker
      phrasing wins, inheriting anchor=1. `se-b2b-expected` (tracker,
      2030-07-01) does NOT map onto any deep-dive timeline card -- the
      static page's only mention of the 2030 ViDA deadline is inside a
      narrative related-card, not a timeline entry -- so it's kept as its
      own non-overlapping row, same pattern as Denmark's
      dk-established/dk-small. 10 total milestones (8 deep-dive-only + 2
      tracker). No penalty table (no mandate exists yet, nothing to
      enforce), no lifecycle/pill-list cards, no badge tags. Status-banner
      (no legislated domestic B2B mandate; national ViDA inquiry launched
      Feb 2026, findings due Nov 2027) folded into scope_intro per the
      UK/Spain/Ireland precedent. Notable content-wise: Sweden is one of
      the purest decentralised models in the tracker -- no central
      government platform or directory layer at all, everything routes via
      the plain Peppol network, with high voluntary B2B adoption already
      in place ahead of any legal requirement.

**This completes the Europe batch started with Romania: Romania, Belgium,
Finland, Croatia, Denmark, Ireland, Norway, Slovakia, and Sweden are all
now fully migrated to Stage 4 (content and translations both verified).**
- [x] Slovakia — content and translations complete (migrations 120-123).
      Same tracker-overlap pattern as Ireland/Norway: `sk-voluntary` and
      `sk-mandate` reused directly from the tracker, matching 2 of the
      deep-dive timeline's 7 cards by topic -- 7 total milestones, not 9.
      One genuine discrepancy worth flagging: the tracker dates
      `sk-voluntary` as starting 2026-05-01, while the static page shows a
      broader "Jan-Dec 2026" range for the same underlying voluntary-phase
      event. Used the tracker's more specific date and phrasing per the
      Spain precedent (tracker can have more current info than the
      deep-dive) rather than the static page's range. Has a genuine
      2-row tabular penalty schedule (initial breach up to €10k, repeated
      offences up to €100k) alongside narrative related-cards in the same
      penalties_related section -- same both-at-once pattern as Belgium.
      Notable content-wise: Slovakia is a genuine "5-corner" Peppol model
      (the 4-corner exchange plus a 5th corner reporting the data to the
      tax authority in the same transmission step) via certified "Digital
      Postman" access points -- a real architectural step beyond the plain
      4-corner models used by Belgium, the UK, and Norway.
- [x] Norway — content and translations complete (migrations 116-119).
      Same pattern as Ireland: the tracker's 2 DATA entries (`no-issue`,
      `no-receive`) map exactly onto 2 of the deep-dive timeline's 7 cards
      by date and topic, so tracker phrasing wins for those two -- 7 total
      milestones, not 9. No penalty table (no fine schedule discussed), no
      lifecycle/pill-list cards, no badge tags. Notable content-wise:
      Norway's mandate is deliberately asymmetric -- issuing becomes
      mandatory 1 Jan 2027, receiving not until 1 Jan 2030, a genuine
      3-year gap by design to give buyers a longer runway. High existing
      voluntary EHF/Peppol adoption (84-89%) is called out explicitly on
      the static page as softening the practical impact of the mandate.

## China (migrations 132–135)

Milestones: 7 total, matching the static page's 7 timeline cards. 5 deep-dive-only entries (general VAT e-fapiao 2015, special VAT e-fapiao pilot 2020, all-provinces pilot 2023, railway 2024, aviation 2024) plus 2 tracker-matched entries: `cn-nationwide` (1 Dec 2024, exact date/event match — tracker phrasing wins) and `cn-paper-phaseout`, where the tracker's more specific date (1 Jul 2026, citing Dalian) was preferred over the static page's vaguer "ongoing regional phase-out" language, per the Slovakia precedent (tracker can carry more current/specific info than the deep-dive).

Deep-dive content: 5 stats, 4 file_format cards, 3 regular scope_transmission spec-cards plus 1 lifecycle card ("The clearance flow", 5 statuses: Generate XML → Submit to STA → Validate + add Key ID/QR → Return to issuer → Deliver to recipient) mapped from the static page's `.flow-grid` element, per the Croatia/Australia precedent. 0 penalty rows — China's enforcement mechanism is invoice quotas tied to tax-authority standing (tax risk level, credit rating, real business activity) rather than a discrete published fine schedule, so this is captured entirely in the 4 penalties_related narrative cards instead of the penalty-table schema. 6 steps, 1 portal (State Taxation Administration).

As with Australia, the renderer places regular spec-cards before lifecycle cards within a section, so the live scope_transmission section will show the 3 regular cards ahead of "The clearance flow" — a display-order divergence from the static page's original card order, accepted as a known pre-existing limitation.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## India (migrations 136–139)

Milestones: 6 total, matching the static page's 6 timeline cards. 4 deep-dive-only entries (GST Council approves phased B2B e-invoicing 2019, mandatory begins at ₹500cr turnover 2020, progressive threshold reductions 2021-23, 2FA mandatory for large taxpayers Jul 2023) plus 2 tracker-matched entries: `in-threshold` (Aug 2023, exact date/event match with the ₹5 crore threshold) and `in-30day` (1 Apr 2025, exact date/event match with the 30-day IRN reporting window) — tracker phrasing wins for both, including their action items and portal link.

Deep-dive content: 5 stats, 4 file_format cards (Schema, what "e-invoicing" actually means, the IRN itself, QR code contents), 3 regular scope_transmission spec-cards (Governing institutions, Submission channels, The 30-day rule's teeth) plus 1 lifecycle card ("The clearance flow", 5 statuses: Generate JSON → Upload to IRP → IRP validates & signs → IRN + QR returned → Issue to buyer) mapped from the static page's `.flow-grid` element, per the Croatia/Australia/China precedent. 2 penalty rows (failure to generate a required e-invoice; incorrect or invalid e-invoice) — both non-monetary consequence descriptions rather than fixed fine amounts, stored in the `fine_amount` column per the Slovakia precedent for descriptive penalty text. 3 penalties_related narrative cards, 6 steps, 1 portal (e-Invoice / IRP, NIC).

As with Australia and China, the renderer places regular spec-cards before lifecycle cards within a section, so the live scope_transmission section will show the 3 regular cards ahead of "The clearance flow" — an accepted, known display-order divergence from the static page's original card order (Governing institutions, The clearance flow, Submission channels, The 30-day rule's teeth).

Notable content point: India's e-invoice is JSON, not XML — the only country in this batch (and one of very few overall) using JSON as the legal document format rather than XML.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## New Zealand (migrations 140–143)

Milestones: 8 total, matching the static page's 8 timeline cards. 5 deep-dive-only entries (Australia-NZ Government Electronic Invoicing Arrangement 2018, e-invoicing framework launch 2019, PINT A-NZ becomes only accepted spec May 2025, Fifth Edition rules announced Oct 2025, Fifth Edition rules take effect Dec 2025) plus 3 tracker-matched entries: `nz-central` (31 Mar 2022), `nz-2000` (1 Jan 2026), `nz-largesupplier` (1 Jan 2027) — all three exact date/event matches with the tracker's own DATA entries, so tracker phrasing wins for all three, including their action items and portal link.

Deep-dive content: 5 stats, 4 file_format cards (Specification, Identifiers, Scope of the 2027 mandate, No real-time reporting), 4 scope_transmission cards (Governance, Determining "large supplier" status, Agency-side obligations, Enforcement style) — no flow-grid/lifecycle card and no penalty rows/table this time, since New Zealand's enforcement is purely administrative (no statutory financial penalties; the static page states this explicitly). 4 penalties_related narrative cards, 5 steps, 1 portal (einvoicing.govt.nz — MBIE).

Notable content point: New Zealand's mandate sits inside Government Procurement Rules rather than tax/VAT legislation — a genuinely different legal basis from every other country migrated so far, with enforcement via public quarterly reporting rather than any fine schedule.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## Singapore (migrations 144–147)

Milestones: 10 total, matching the static page's 10 timeline cards. 6 deep-dive-only entries (first Peppol Authority outside Europe 2018, InvoiceNow launches 2019, InvoiceNow added as B2G channel 2020, voluntary phase begins May 2025, and two mid-rollout revenue-band steps with no tracker counterpart: existing taxpayers ≤S$1m 2029, ≤S$4m 2030) plus 4 tracker-matched entries: `sg-voluntary2025` (1 Nov 2025), `sg-allvoluntary` (1 Apr 2026), `sg-existing2028` (1 Apr 2028), `sg-full2031` (1 Apr 2031) — all four exact date matches. `sg-existing2028` is a notable case: the tracker's own phrasing ("Phased rollout begins for existing GST-registered businesses") was used in preference to the deep-dive's narrower band-specific title ("New GST taxpayers, annual sales ≤ S$200,000"), per tracker-phrasing-wins, since the tracker's framing better represents the milestone as the start of the phased rollout rather than one specific revenue band.

Deep-dive content: 5 stats, 4 file_format cards (Format, Mandatory Data Elements, Identifiers, Evolving format: PINT SG), 3 regular scope_transmission spec-cards (Governance, Submission timing, Roles: IRSP vs. AP) plus 1 lifecycle card ("The exchange flow", 5 statuses: Supplier's ERP → Supplier's Access Point → Buyer's Access Point (via UEN) → Buyer's ERP → Copy to IRAS) mapped from the static page's `.flow-grid` element, per the Croatia/Australia/China/India precedent. This is the first flow-grid card without an intro line on the static page (goes straight from the card title to the pills) — `intro_text` is stored as NULL for this card, which the schema supports since the column is nullable. No penalty rows/table — Singapore's enforcement is entirely administrative (no statutory fines discussed on the static page). 4 penalties_related narrative cards, 6 steps, 1 portal (IRAS — GST InvoiceNow Requirement).

Notable content point: Singapore's 4-corner→5-corner architecture transition (adding IRAS as a genuine network participant rather than just an observer) is a distinctive evolution story — the static page frames it as gradually adding tax-reporting capability onto a pre-existing voluntary exchange network rather than building a clearance system from scratch, consistent with Singapore's unusually long six-year phase-in runway (Nov 2025 → Apr 2031), the longest in this tracker.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

This completes the Asia-Pacific batch (Australia, China, India, New Zealand, Singapore) requested in one continuous run.

## Brazil (migrations 148–151)

Milestones: 10 total, matching the static page's 10 timeline cards. 7 deep-dive-only entries (NF-e system established 2005-2010, NFS-e mandatory for MEIs Sep 2023, Technical Note 2025.002 published Dec 2024, Lei Complementar 214/2025 enacted Jan 2025, test environment opens Jul 2025, NT v1.33 postpones hard validation block Dec 2025, CBS/IS collection begins through full 2033 migration) plus 3 tracker-matched entries: `br-fields` (1 Jan 2026), `br-validate` (1 Apr 2026), `br-mandatory` (3 Aug 2026) — all three exact date/event matches with the tracker's own DATA entries, tracker phrasing wins for all three including action items and portal link.

Deep-dive content: 5 stats, 4 file_format cards (Document structure, The 44-digit access key, Digital signature, New tax reform fields), 3 regular scope_transmission spec-cards (The document family, NFS-e fragmentation and the fix underway, What's coming: Split Payment) plus 1 lifecycle card ("The NF-e clearance flow", 5 statuses: Generate XML → Digitally sign → Submit via SOAP to state SEFAZ → SEFAZ authorises → Ship with DANFE) mapped from the static page's `.flow-grid` element, per the established precedent. Like Singapore, this flow-grid card has no intro line on the static page (goes straight from card title to pills), so `intro_text` is stored as NULL. No penalty rows/table — the static page frames rejection risk (a blocked invoice halts shipment) as the sharper practical consequence rather than a discrete fine schedule, captured entirely in the 4 penalties_related narrative cards. 7 steps, 1 portal (Portal Nacional da NF-e, SEFAZ).

Notable content point: Brazil is the first country migrated with a genuinely multi-layered clearance model — state-level SEFAZ (NF-e/NFC-e/CT-e), municipal-level NFS-e (5,000+ variations), and a federal-level backstop repository, all running in parallel rather than a single national platform. The current live story is a multi-year consumption tax reform (CBS/IBS dual-VAT) being layered onto this mature 20-year-old clearance infrastructure rather than a new mandate built from scratch.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## Mexico (migrations 152–155)

Milestones: 4 total, matching the static page's 4 timeline cards. 2 deep-dive-only entries (CFDI 4.0 becomes mandatory Jul 2023, updated Anexo 20 catalogs take effect Jan 2026) plus 2 tracker-matched entries: `mx-cfdi` and `mx-reform`. `mx-cfdi` is a notable reversal of the usual date-mismatch pattern — here the deep-dive's date (1 Apr 2014) is more specific than the tracker's generic year-start placeholder (2014-01-01), so the deep-dive's date was used while the tracker's own system/desc/actions phrasing still won (opposite of the Slovakia/China precedent, where the tracker's date was more specific). `mx-reform` is a straightforward exact match (tracker's 2026-01-01 vs. the deep-dive's bare "2026").

Deep-dive content: 5 stats, 4 file_format cards (Base specification, Complementos — the real complexity, Catalogs, Identity & signature), 3 regular scope_transmission spec-cards (PACs — Proveedores Autorizados de Certificación, Rejection handling, Correcting a CFDI) plus 1 lifecycle card ("The clearance flow (timbrado)", 5 statuses: Generate XML → Submit to your PAC → PAC validates against Anexo 20 → PAC stamps + assigns UUID → Invoice is valid) mapped from the static page's `.flow-grid` element. Like Singapore and Brazil, this flow-grid card has no intro line on the static page, so `intro_text` is stored as NULL. No penalty rows/table — penalties are described narratively (Código Fiscal de la Federación framework, including clausura for serious infractions) rather than as a discrete fine schedule, captured in the 4 penalties_related narrative cards. 7 steps, 1 portal (SAT — Servicio de Administración Tributaria).

Notable content point: Mexico's CFDI system (mandatory since 2014) is the most mature clearance system migrated so far in this batch, with the current activity being routine version/catalog maintenance (CFDI 4.0, annual Anexo 20 catalog refreshes) and a 2026 authenticity-enforcement reform rather than a new mandate. The 26+ specialised complementos (Carta Porte, Pagos, Nómina, Comercio Exterior) layered on top of the base CFDI/Anexo 20 spec are a distinctive structural feature not seen in the same form elsewhere in this tracker.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## Peru (migrations 156–159)

Milestones: 5 total, matching the static page's 5 timeline cards. 4 deep-dive-only entries (mandatory rollout begins with large taxpayers 2017, UBL 2.1 becomes only supported format Mar 2019, OSE validation compulsory for big contributors Jul 2019, new airline ticket reporting system Aug 2026) plus 1 tracker-matched entry: `pe-established` (1 Jun 2022), an exact date/event match — tracker phrasing wins, including action items and portal link.

Deep-dive content: 5 stats, 4 file_format cards (Format, CPE document family, Document naming, Archiving), 3 regular scope_transmission spec-cards (The three roles, Choosing your operating tier, A permitted but risky shortcut) plus 1 lifecycle card ("The clearance flow", 5 statuses: Generate UBL 2.1 XML → Sign digitally → Submit to OSE/SUNAT → Validate against 100+ rules → CDR issued) mapped from the static page's `.flow-grid` element. Like Singapore, Brazil, and Mexico, this flow-grid card has no intro line on the static page, so `intro_text` is stored as NULL. No penalty rows/table — the static page frames invalidity (not fines) as the core practical risk, captured in the 4 penalties_related narrative cards. 7 steps, 1 portal (SUNAT).

Notable content point: Peru's OSE (Operador de Servicios Electrónicos) model is genuinely distinctive among the clearance-model countries migrated so far — an OSE's validation carries the same legal authority as SUNAT validating directly, rather than being a mere intermediary, though OSEs are explicitly barred from validating delivery/transport documents in some configurations. The four-tier operating model (SEE-SOL / PSE / OSE / SEE Facturador) scaled to transaction volume is also a structurally distinct onboarding pattern not seen in this form elsewhere in the tracker.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## Chile (migrations 160–163)

Milestones: 4 total, matching the static page's 4 timeline cards. 2 deep-dive-only entries (SII pilots DTE with large taxpayers, early 2000s; Boleta Electrónica mandatory under Ley 21.210, Jan 2021) plus 2 tracker-matched entries: `cl-established` and `cl-digital-delivery`. `cl-established` is a topical match with a date discrepancy: the tracker claims "in force since 2018" while the deep-dive's own stat-strip states "2014 — Mandatory for all VAT taxpayers" for the same underlying milestone — the deep-dive's date (2014) was used for internal page consistency, while the tracker's own system/desc/actions phrasing still won, per the established tracker-phrasing-wins rule. `cl-digital-delivery` (1 Mar 2026) is a straightforward exact date/event match.

Deep-dive content: 5 stats, 4 file_format cards (Document types, CAF — Código de Autorización de Folios, TED — Timbre Electrónico Digital, Mandatory identifier), 3 regular scope_transmission spec-cards (Monthly reconciliation, API access for CAF management, Boleta batch model) plus 1 lifecycle card ("The clearance flow", 5 statuses: Request CAF → Generate DTE XML → Apply TED + signature → Submit to SII → Deliver to recipient) mapped from the static page's `.flow-grid` element. Like Singapore, Brazil, Mexico, and Peru, this flow-grid card has no intro line on the static page, so `intro_text` is stored as NULL. No penalty rows/table — the static page frames losing CAF issuance ability (not the UTM-denominated fine) as the sharpest practical risk, captured in the 4 penalties_related narrative cards. 7 steps, 1 portal (Servicio de Impuestos Internos, SII).

Notable content point: Chile's CAF (Código de Autorización de Folios) mechanism is structurally distinctive — invoice numbers are a government-issued resource drawn down from an authorised range rather than an internal business convention, and repeated non-compliance can lead the SII to restrict a taxpayer's ability to download new CAFs, effectively halting all invoicing. This is a genuinely different enforcement lever from the fine-based schedules seen in most other countries in this tracker, closer in spirit to China's invoice-quota mechanism than to a standard penalty table.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## United States (migrations 164–167)

Milestones: 6 total, exceeding the static page's 5 timeline cards by design. 4 deep-dive-only entries (OMB Memorandum M-15-19 directs federal agencies to e-invoicing, Jul 2015; Business Payments Coalition E-invoice Exchange Market Pilot begins, Apr 2022; pilot extends/rules finalised, 2023; first invoice transferred via DBNAlliance network, Mar 2024) plus 2 tracker-matched entries: `us-federal-b2g` and `us-dbnalliance`. `us-federal-b2g` (1 Dec 2018) is kept genuinely separate from the deep-dive's 2015 OMB-memo rcard rather than merged — the 2015 date is when the directive was issued, while the tracker's own system text explicitly names 2018 as the "in force since" effective date, a different point in the same policy's lifecycle, per the Denmark non-overlapping-milestone precedent (a tracker entry can lack a 1:1 rcard match). `us-dbnalliance` (Jan 2024) is a straightforward exact date/event match.

Deep-dive content: 5 stats, 4 file_format cards (DBNAlliance network format, What actually dominates today, No mandated content requirements, Cross-border reality check), 3 regular scope_transmission spec-cards (Governance, Federal procurement — a separate channel, Payment-method agnostic) plus 1 lifecycle card ("DBNAlliance's 4-corner model", 4 statuses — one fewer than the usual 5, since the static page's `.flow-grid` only lists 4 pills: Sender's service provider → Exchange framework → Receiver's service provider → Receiver) mapped from the static page's `.flow-grid` element. Like several prior countries, this flow-grid card has no intro line, so `intro_text` is stored as NULL. No penalty rows/table — the static page explicitly and repeatedly states there is no federal penalty framework at all, since there is no mandate to enforce; captured in the 4 penalties_related narrative cards. 6 steps, and — a first for this batch — **2 portals** (DBNAlliance and the Treasury's Invoice Processing Platform/IPP), reflecting the page's two genuinely separate channels (voluntary B2B network vs. existing federal B2G procurement).

The static page's `.status-banner` element (a prominent notice stating there is no federal B2B mandate) was folded into `scope_intro` rather than given new schema, per the established UK/Spain/Ireland precedent for status-banner text.

Notable content point: the United States is the first country in this tracker with a genuinely voluntary, market-led model — no clearance step, no tax authority driving format standardisation, and DBNAlliance's origin in the Federal Reserve/Business Payments Coalition (a payments-efficiency initiative) rather than any tax authority (the US has no VAT). The compliance_model field reads "Fully voluntary, decentralised 4-corner" to reflect this structurally distinct posture.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## Canada (migrations 168–171)

Milestones: 4 total, matching the static page's 4 timeline cards. 2 deep-dive-only entries (CRA launches research into electronic invoicing, 2018; CRA's regulatory plans list digital reporting initiatives but not e-invoicing by name, 2025–27 cycle) plus 2 tracker-matched entries: `ca-watch` and `ca-federal-b2g`. `ca-watch` is a straightforward original-direction case — the tracker's date (1 Jun 2021) is more specific than the deep-dive's bare "2021" rcard, so the tracker's date wins, consistent with the Slovakia/China precedent (not a reversal case like Mexico/Chile). `ca-federal-b2g` (1 Apr 2022) is an exact date/event match.

Deep-dive content: 5 stats, 4 regular file_format cards (What CRA actually requires, The 9 required fields, For federal government suppliers, No Canadian Peppol identifier) plus **a new 5th file_format card, "Provincial tax variation"**, mapping the static page's genuinely novel `.prov-table` section (a dedicated numbered section 03 on the static page, between file-format and transmission-protocol, with no equivalent renderer section type) onto the existing `rows_json` card infrastructure — 5 rows (Ontario 13% HST, Atlantic provinces 15% HST, Quebec 5% GST + 9.975% QST as separate lines, Alberta/NWT/Nunavut/Yukon 5% GST only, other provinces 5% GST + separate PST), with the static page's explanatory paragraph below the table folded into the card's `note` field. This is the first time a standalone numbered content section has been absorbed into an existing section's card list rather than requiring new schema — consistent with the general "map novel elements onto existing card infrastructure" principle used previously for flow-grids and status-banners.

4 regular scope_transmission cards (Federal B2G (mandatory), Domestic B2B (voluntary), Peppol's actual use case in Canada, Provincial & municipal fragmentation) — **no lifecycle card this time**, since Canada's static page has no `.flow-grid` element (the first country in the Americas batch without one). No penalty rows/table — the static page states there is no B2B penalty framework at all, captured in the 4 penalties_related narrative cards. 6 steps, and **2 portals** (Canada.ca Electronic Procurement/PSPC, and Canada Revenue Agency), the second multi-portal country in this batch after the US, reflecting the same voluntary-B2B/mandatory-B2G channel split.

The static page's `.status-banner` element (stating there is no B2B e-invoicing mandate and none proposed on a fixed timeline) was folded into `scope_intro`, per the established UK/Spain/Ireland/US precedent for status-banner text.

Notable content point: Canada is structurally the closest sibling to the US in this tracker — voluntary B2B, mandatory federal B2G via a single enterprise platform (SAP Ariba, vs. the US's DBNAlliance network), no VAT-driven clearance model. The genuinely new element is the provincial sales-tax fragmentation (HST/GST/QST/PST varying by province), a compliance dimension not seen in any prior country migrated so far, since it concerns intra-country tax-rate variation rather than cross-border format or transmission requirements.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

This completes the Americas batch (Brazil, Mexico, Peru, Chile, United States, Canada) requested in one continuous run.

## European Union (migrations 172–175)

**Structurally different from every other country migrated so far: the EU has no legacy static
HTML deep-dive page.** It's not in the tracker's `DEEP_DIVES` link map (`european-union.html`
does not exist), unlike Italy/Saudi Arabia/UAE which do have static pages awaiting migration.
Per user decision, this migration writes D1 content only (milestones + full deep-dive content,
same schema as every other country), viewable via the existing
`/admin/preview/deep-dive?country=European Union` route — no static HTML file or tracker link
was created. Building the static page + tracker link, if wanted, is a separate future task.

**The user also asked for a careful accuracy review of the EU/ViDA content**, since there was no
existing page to extract from and the tracker's own 3 `eu-*` DATA entries hadn't been touched in
a while. Live research against the official EC ViDA page (taxation-customs.ec.europa.eu, fetched
directly) and CEN's EN 16931-1:2026 announcement surfaced a real inaccuracy: the tracker's
`eu-transpose` entry (2026-12-31) described the deadline generically as being about "domestic
e-invoicing mandates," but that date is actually the transposition deadline specific to ViDA's
Single VAT Registration (SVR) pillar (enabling the 1 Jan 2027 OSS/IOSS scope expansion) — a
different pillar from e-invoicing/DRR (2030) entirely. The tracker was also missing a whole
milestone for ViDA's second pillar: the 1 July 2028 platform-economy deemed-supplier rules +
SVR go-live + mandatory reverse charge for non-identified suppliers.

**Per user decision, both were fixed in the tracker's own DATA array** (`eu-transpose`'s
system/desc/actions rewritten to correctly describe the SVR pillar specifically; new
`eu-platform-svr-2028` entry added for the 2028 pillar), not just in the new deep-dive content —
along with matching corrections/additions in all 3 `i18n/{lang}-data.json` files (es/de/fr), so
the tracker's own multi-language timeline display stays consistent with the corrected English
entry. This is the first migration where the tracker's pre-existing DATA was itself edited for
accuracy rather than only read from. Verified both the tracker's DATA array (via a Node.js
extraction/eval sanity check on the live file) and all 3 i18n JSON files parse correctly after
the edit.

Milestones: 7 total (this is a fresh, non-static-page-derived content set, so there's no
"static page timeline count" to match against). 4 tracker-matched, using tracker phrasing
throughout: the corrected `eu-transpose` (2026-12-31), the new `eu-platform-svr-2028`
(2028-07-01), `eu-drr` (2030-07-01, unchanged — already accurate against the official EC
timeline), and `eu-align` (2035-01-01, unchanged — already accurate). Plus 3 deep-dive-only
entries adding real value beyond the tracker's own 4: ViDA's formal Council adoption
(2025-03-11), its entry into force (2025-04-14, the date from which member states could already
introduce their own domestic e-invoicing mandates under derogations — explains why Belgium/
Poland/etc. moved independently ahead of any EU-wide date), and CEN's EN 16931-1:2026 semantic
standard publication (2026-03-18, verified via a second independent web search).

Deep-dive content: 5 stats (3 ViDA pillars, €11B/yr projected fraud reduction, €4.1B/yr
projected compliance savings, 1 Jul 2030 DRR go-live, 1 Jan 2035 harmonisation deadline — the
fraud/savings figures are sourced directly from the EC's own ViDA page). 4 file_format cards
covering EN 16931's original B2G-era standard vs. its 2026 B2B-oriented revision (new IBAN,
triangulation-indicator, corrective-invoice-sequencing, and margin-scheme fields), the
format-vs-mandate distinction, and UBL/CII/Peppol BIS Billing 3.0 as the common conformant
implementation. 3 scope_transmission cards laying out the three pillars and their distinct
timelines, the domestic-mandate-vs-2030-cross-border-layer distinction, and the 2035
convergence deadline — **no lifecycle card**, since this is a policy-framework overview with
no single national clearance flow to diagram. 6 steps. 4 penalties_related narrative cards
(no penalty rows/table — ViDA sets the framework but enforcement/fines remain a national
competence, explicitly stated as such). 2 portals (EC Taxation & Customs Union ViDA page, and
the VAT One Stop Shop portal, since SVR/OSS is one of the three pillars this page covers).

Notable content point: this page is framed differently from every other country's deep dive —
it's explicitly a policy/framework explainer for the whole ViDA package rather than a "how does
a business file here" procedural page, since the EU itself has no single filing mechanism.
Multiple cards and the scope_intro text explicitly redirect readers to the tracker's individual
country pages (Italy, Belgium, Poland, etc.) for what's actually mandatory where they invoice
today — treating this EU page as context/background for the country pages rather than a
replacement for them.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## Italy (migrations 176–179)

Milestones: 4 total, matching the static page's 4 timeline rcards. 3 deep-dive-only entries
(Phase 0 — FatturaPA mandatory for B2G via SDI, 2014; FatturaPA v1.9.1 published, 31 Mar 2026;
compliance with v1.9.1 becomes mandatory, 15 May 2026) plus 1 tracker-matched entry: `it-sdi`.
The tracker's own date (2019-01-01) is more specific than the deep-dive's bare "2017 → 2019"
range card for the same rollout-completion milestone, so the tracker's date is used, per the
established more-specific-date-wins rule — tracker phrasing wins as usual, and anchor=1 to match
the tracker's own `anchor:true`.

Deep-dive content: 5 stats, 4 file_format cards (Schema, Document structure, Digital signature,
Archiving), 3 regular scope_transmission spec-cards (Routing identifiers, Transmission channels,
Cross-border reporting) plus 1 lifecycle card ("The clearance workflow", 4 statuses: Generate &
sign XML → Transmit to SDI → SDI validates → Deliver or reject). Unlike every prior flow-grid
card, this one was embedded *inside* a spec-card on the static page rather than standing alone,
and has both an intro line ("Every invoice moves through the same sequence:") and an outro note
("The full cycle typically completes in seconds to minutes...") — the first country to populate
both `intro_text` and `outro_text` on the same lifecycle card. 7 steps. **A genuine 2-row tabular
penalty schedule** (Substantive VAT violations: 90–180% of unreported VAT; Formal-only violations:
fixed €250/invoice up to €2,000/quarter) **plus 3 narrative penalties_related cards** (voluntary
disclosure/ravvedimento operoso, common v1.9.1 rejection codes, San Marino's special HUB-SM
channel) — confirms a country can have both a real penalty table and narrative related-cards at
once, per the Belgium precedent. 2 portals (Agenzia delle Entrate, FatturaPA/SDI).

Notable content point: Italy is the most mature clearance-model country in this entire tracker —
live since 2014 for B2G and 2019 for all domestic B2B/B2C, over a decade ahead of France,
Germany, or Poland. FatturaPA predates EN 16931 entirely and is not a CIUS implementation of the
European standard, which is why its schema, routing model (Codice Destinatario / PEC), and
document-level digital-signature requirement (XAdES/CAdES) all diverge structurally from every
EN-16931-based country migrated so far. The "current news" on this page is routine schema
maintenance (v1.9.1) rather than a new mandate — a genuinely different kind of update from most
other countries' still-phasing-in stories.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## Saudi Arabia (migrations 180–183)

Milestones: 4 total, matching the static page's 4 timeline rcards. 2 deep-dive-only entries
(Phase 1 — Generation Phase begins, 4 Dec 2021; Phase 2 — Integration Phase begins, Wave 1,
1 Jan 2023) plus 2 tracker-matched entries: `sa-wave23` and `sa-wave24`, both exact date/topic
matches — tracker phrasing wins for both. Neither tracker entry sets `anchor:true`, so both
keep anchor=0.

**Required a small renderer code change**, the first of its kind in this whole migration effort.
The static page's QR-code section (02, file format) contains a `.flow-grid` pill list of the
nine data tags packed into ZATCA's QR code (Seller name, VAT number, Timestamp, Invoice total,
VAT total, Crypto stamp hash, Public key, ECDSA signature) — visually identical to every other
country's flow-grid, but semantically an *unordered set of data tags*, not a sequential process,
and critically: it sits in the **file_format** section, not scope_transmission. Every prior
lifecycle card (all ~15 of them) lived in scope_transmission, and `members-worker/src/index.js`'s
`renderFullDeepDivePage` only ever called `renderLifecycleCardsForSection(content.lifecycleCards,
"scope_transmission")` for the scope/transmission column — `fileFormatHtml` was built from
`content.cards.file_format` alone, with no call to render lifecycle cards for that section at
all. The D1 query and data model already supported an arbitrary `section` value on
`deep_dive_lifecycle_cards` (just a `TEXT NOT NULL DEFAULT 'scope_transmission'` column, no CHECK
constraint), so storing this card with `section = 'file_format'` was valid — but it would have
silently never rendered without a matching front-end wire-up. Fixed by adding one line to
`renderFullDeepDivePage`: `fileFormatHtml` now also calls
`renderLifecycleCardsForSection(content.lifecycleCards, "file_format")`, mirroring the existing
scope_transmission wiring exactly. This is a genuine code change to the worker, not just a
content/migration file — flagging clearly since every other entry in this checklist has been
content-only.

Deep-dive content: 5 stats, 3 regular file_format spec-cards (Format, Cryptographic controls,
Mandatory identifiers) plus the QR-code lifecycle card described above (8 "statuses" used purely
as pill labels for the data tags, with both intro_text and outro_text populated, following the
Italy precedent for populating both). 4 regular scope_transmission cards (B2B real-time
clearance, B2C near-real-time reporting, common rejection codes, scope) — no lifecycle card in
this section this time, since Saudi Arabia's only flow-grid-style element is the QR-code one
covered above. 7 steps. 1 genuine tabular penalty row (General non-compliance: SAR 5,000–50,000
per violation) plus 3 narrative penalties_related cards (prohibited software functions,
archiving, GCC context) — both at once, per the Belgium/Italy precedent. 1 portal (ZATCA —
Fatoora).

Notable content point: Saudi Arabia runs one of the strictest real-time clearance models in this
entire tracker — B2B invoices above SAR 1,000 have no legal or tax effect at all without ZATCA's
clearance response *before* delivery to the buyer, stricter than Italy's SDI or Poland's KSeF in
that specific sense. The wave-based Phase 2 rollout (turnover-threshold waves, each with ~6
months' notice) is a genuinely different phase-in mechanism from the fixed-calendar-date mandates
seen in most EU countries migrated so far.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

## United Arab Emirates (migrations 184–187)

Milestones: 8 total, matching the static page's 8 timeline rcards. 4 deep-dive-only entries
(PINT AE Data Dictionary released for public consultation, Feb 2025; Ministerial Decisions No.
243/244 issued, 2025; First ASPs published, 2025; Cabinet Decision No. 106 sets the penalty
framework, Dec 2025) plus 4 tracker-matched entries: `uae-pilot`, `uae-asp`, `uae-phase1`,
`uae-phase2`, all exact date/topic matches — tracker phrasing wins for all 4. Two of the
deep-dive-only entries (Ministerial Decisions, First ASPs) share the static page's single bare
"2025" marker with no more specific date given; placeholder dates (2025-06-01 and 2025-08-01)
were assigned purely to preserve the page's own stated display order — since milestones render
`ORDER BY date ASC` with no secondary sort key, same-date entries have no guaranteed stable
order, so distinct placeholder dates were required, not just cosmetic. None of the tracker's own
`uae-*` DATA entries set `anchor:true`, so all 4 keep anchor=0.

Deep-dive content: 5 stats, 4 file_format cards (What PINT AE is, Three content layers, Field
count & scope, Key identifiers & content). 3 regular scope_transmission cards (What your ASP
actually does, ASP accreditation process, No direct FTA portal upload) plus 1 lifecycle card
("The five corners", 5 statuses: Supplier → Supplier's ASP → Buyer's ASP → Buyer → FTA) — unlike
Saudi Arabia's QR-code tag list (an unordered set mapped onto the lifecycle infrastructure purely
for its pill styling), this is a genuine sequential DCTCE process and sits in scope_transmission
per the normal pattern, with both intro_text and outro_text populated. 6 steps. A genuine 6-row
tabular penalty schedule (implementation/ASP-appointment failure, e-invoice/e-credit-note
lateness — both capped monthly rather than annually, so combined into `fine_amount` strings with
`annual_cap` left NULL per the Croatia/Denmark precedent for non-annual caps — plus three
uncapped daily-accumulating notification failures) alongside 3 narrative penalties_related cards
(voluntary participants exempt, dual penalty exposure under two separate Cabinet Decisions,
retention periods) — both at once, continuing the Belgium/Italy/Saudi Arabia precedent. 1 portal
(UAE Ministry of Finance — eInvoicing).

Notable content point: the UAE's decentralised 5-corner DCTCE model is the direct structural
counterpoint to Saudi Arabia's centralised ZATCA clearance model covered earlier in this same
batch — no government clearance portal exists at all; every invoice routes through an Accredited
Service Provider (ASP), with the FTA (the fifth corner) receiving an automatic Tax Data Document
report rather than performing pre-delivery clearance. The UAE also built its framework unusually
methodically: public data-dictionary consultation, then legislation, then ASP accreditation, then
a genuinely risk-free voluntary pilot (Cabinet Decision 106's penalties explicitly don't apply to
voluntary participants), all before the mandate itself begins in January 2027 — a notably more
gradual, consultative rollout than most other mandates in this tracker.

All 4 languages (en/es/de/fr) validated for structural completeness and card-shape consistency.

This completes the final batch of remaining countries (European Union, Italy, Saudi Arabia,
United Arab Emirates) requested in one continuous run. Every country currently in the tracker's
DATA array now has full Stage 4 deep-dive content in D1.

## Mandate summary tile (migrations 188–190)

New feature request: replicate the top-of-page "mandate summary" tile that several original
static pages (Spain, UK, Ireland, US, Canada, Sweden) had — a brief 2-4 sentence
`.status-banner` explaining the type of compliance mandate currently in effect — across all 31
country deep-dive pages, not just the six that originally had one.

Schema (188): added two nullable columns to `deep_dive_page_translations` —
`mandate_summary` and `mandate_summary_icon`. Deliberately a new dedicated field rather than
reusing `scope_intro`, since `scope_intro` remains the Transmission Protocol section's (section
03) intro line with its own distinct meaning, and overloading it a second time would have
repeated the exact problem being fixed here.

Content (189, English): for the six countries whose original static-page status-banner text had
previously been merged into `scope_intro` during earlier Stage 4 migrations (Spain, UK, Ireland,
US, Canada, Sweden), the banner text was extracted back out into the new `mandate_summary` field
and the original, shorter section-03 `scope_intro` line was restored from the static HTML source.
For the remaining 25 countries, a fresh `mandate_summary` (2-4 sentences, distinct from
`scope_intro`) was authored from each page's existing deep-dive content, paired with a fitting
emoji icon. All 31 countries validated for sentence count (1-3 sentences, within the 2-4 sentence
target) and non-empty icon.

Translations (190, parts 1-2): ES/DE/FR translations for all 31 countries' `mandate_summary`,
plus the restored `scope_intro` translations for the six split-apart countries. 124 rows total
(31 countries × 4 languages) validated for completeness.

Renderer: `getDeepDiveContent()` now selects `mandate_summary`/`mandate_summary_icon` with the
same `COALESCE(lang, en-fallback)` pattern as every other field. `renderFullDeepDivePage()` emits
a `.status-banner` div (same CSS as the original static pages: `--soon-dim` background,
`--soon` border, icon + text) between the `country-head` block and the `stat-strip`, conditional
on `content.mandate_summary` being present.

This completes the mandate-summary tile rollout across all 31 tracker countries, in all 4
supported languages.

## Cutover to production: static pages retired (Workers static assets)

Following the mandate-summary rollout above, the 30 hand-written static country
deep-dive pages (spain.html, croatia.html, etc.) have been retired entirely and
replaced with a single dynamic route, live on the real production domain rather
than only the members-subdomain admin preview.

**Architecture — correction from the first attempt:** the initial version of
this cutover was built as a Cloudflare Pages Function (`functions/[country].js`),
on the assumption that the production site was a Cloudflare Pages project.
Inspecting the live Cloudflare dashboard showed this was wrong: the resource
actually serving e-invoicingcompliancecorner.com (dashboard-renamed from its
auto-generated name `winter-fog-ff16` to `eicc-public`), is a plain
Cloudflare **Worker with static assets**, deployed by manual dashboard upload
with no git connection — a different product from Pages, which doesn't support
the `functions/` file-based routing convention at all. That code was replaced
with a new `site-worker/` project: a single Worker script
(`site-worker/src/index.js`) with a `fetch` handler, an `[assets]` binding
(serving everything in the repo root except the excludes listed in
`.assetsignore`) and a `eicc_content` D1 binding, deployed the same way
members-worker is (`wrangler deploy`, run by hand since this sandbox can't
reach the Cloudflare API). Static assets are matched first by the platform
automatically (same precedence Pages had); the Worker script only runs for the
30 country slugs, which have no matching file since their `.html` pages were
deleted, and falls back to `env.ASSETS.fetch(request)` for anything else.

**Shared rendering code:** `shared/deep-dive-render.mjs` is the new single
source of truth for `getDeepDiveContent`, `renderFullDeepDivePage`, and their
supporting helpers — extracted from members-worker/src/index.js, which now
imports from it instead of defining its own copies. The admin preview routes
(`/admin/preview/deep-dive`, `/admin/preview/milestones`) are unaffected in
behaviour; they just source their rendering logic from the shared module now.
A handful of small, stable primitives (escapeHtml, d1All/d1First,
translateCountryName + its dictionary) remain deliberately duplicated between
the shared module and index.js rather than tightly coupling two independently
deployed Cloudflare projects — consistent with this codebase's existing
precedent (see the COUNTRY_DEEP_DIVE_SLUGS comment).

**Language routing — the actual point of this cutover:** every visitor, in
any language, now reaches the D1-rendered version automatically. Priority
order: explicit `?lang=` query param (and this always refreshes a persistence
cookie) → existing `eicc_lang` cookie → the browser's own `Accept-Language`
header, matched against the four supported languages → English as the final
fallback. This is a genuinely new capability — the retired static pages were
English-only with no translation mechanism at all.

**URL changes:**
- Canonical URLs dropped the `.html` extension (`/spain` instead of
  `/spain.html`), matching Cloudflare Pages' existing clean-URL behaviour and
  the `<link rel="canonical">` tag the shared renderer now emits. A request to
  the old `/spain.html` form still resolves correctly — the Function strips a
  trailing `.html` before its slug lookup — so no static redirect rule was
  needed to avoid breaking old bookmarks or indexed links.
- `einvoicing-compliance-tracker.html`'s `DEEP_DIVES` map, `sitemap.xml`, and
  the members-worker's newsletter-archive deep-dive links were all updated to
  the new extensionless URLs.
- European Union was deliberately left out of this cutover's link surface —
  it has full Stage 4 content in D1 and works correctly if requested directly,
  but never had a static page or a tracker link before, and adding one wasn't
  part of this change.

**Deployed (2 August 2026):** `cd site-worker && wrangler deploy`, run
from the user's own machine (this sandbox can't reach the Cloudflare API).
`wrangler.toml`'s `name` was set to `eicc-public` deliberately, so this
updated the existing production resource rather than creating a new one —
the D1 binding (`eicc_content` → `eicc-content`, id
`d1d10bd0-e90a-44a3-9494-a63689e8d32e`) and the `ASSETS` binding were both
declared in that file, so no manual dashboard configuration was needed;
`wrangler deploy` set them up itself.

**Testing:** before deploy, no live Cloudflare Workers runtime was
reachable from this sandbox, so pre-deploy verification was: `node --check`
syntax validation, and a genuine integration test running the new
`site-worker/src/index.js` fetch handler end-to-end (including its own
routing/language logic, not just the shared render module) against real
content in the local D1 mirror via Node's built-in `node:sqlite`, wrapped
in a small D1-API-compatible shim (`prepare().bind().all()`/`.first()`)
and a stubbed `env.ASSETS.fetch`. `/spain`, `/index.html` (correctly falls
through to the assets stub), and `/croatia?lang=fr` (correct language +
cookie) all behaved as expected. **Post-deploy, the user confirmed a live
spot-check** — the cutover is now fully live in production.
