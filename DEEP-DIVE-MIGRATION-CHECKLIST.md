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

The next new migration should be numbered **152**. Everything below is
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
