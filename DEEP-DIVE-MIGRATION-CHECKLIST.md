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

## 7. Batch status (this list, updated as we go)

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
