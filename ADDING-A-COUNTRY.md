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
  the subscribe picker, preferences, and story tagging.
- **The URL slug.** Usually lowercase-hyphenated, but abbreviations are
  fine (`uae`, `uk`) — it's an explicit column, not a derived transform.

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

1. **Country row + name translations**
   ```sql
   INSERT INTO countries (code, name_en, region, slug, in_picker)
     VALUES ('XX', 'CountryName', 'Region', 'country-slug', 1);
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
   the subscribe/archive country handling, and newsletter stories'
   auto-rendered deep-dive links. None of those are separate edits
   anymore.

2. **Milestones + translations** (tracker board and deep-dive timeline)
   - `milestones`: `id` (short country prefix, e.g. `qa-b2b-wave1`),
     `country_id`, `date`, `anchor`, `source_url`, **`on_tracker`**
     (1 = shows on the main board), **`portals`** (JSON array of
     `{label,url}` — every current board entry has at least one),
     **`confidence`** (`'expected'` for announced-but-unlegislated
     dates, renders the "Expected — not final" badge; else NULL).
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
   story rather than one settled event.

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

## Phase 3 — The hardcoded jurisdiction-count problem

Still the step most likely to be missed. The tracker's own stat strip
computes from live data, but literal prose counts do not:

- `subscribe.html` benefit strip, the education pages, site meta
  descriptions — search every HTML file for the current literal count
  (e.g. `32`) and update every hit.
- The same numbers inside all four languages' i18n JSON prose.
- **D1's `translations` table** — keys like `brand.description`,
  `benefits.intro`, and education card bodies hold the count in prose.
  Update them **via a migration**, not just in live files: migration 024
  exists because count updates were once applied to live files only, and
  `generate_files.py` faithfully regenerated the stale D1 text back over
  them.

---

## Phase 4 — Ship

```bash
cd members-worker/migrations
python3 apply_migrations.py --remote          # validates, applies only what's pending, records each
cd ../../site-worker && wrangler deploy       # ships the static-asset edits (countries.js, i18n, counts)
```

The runner keeps its bookkeeping in D1's `schema_migrations` table
(migration 205): it refuses to double-apply (the autoincrement-table
duplication trap), applies in order, stops at the first failure with an
accurate record of what got through, and warns on files edited after
they were applied. **One-time setup on a database that predates the
table**: `python3 apply_migrations.py --remote --baseline` records every
existing migration file as already-applied without running anything.

D1-rendered surfaces (board, deep-dive page, menus, preferences,
archive links) pick the country up within the 5-minute edge cache — no
deploy needed for those. The site-worker deploy is only for the Phase
2/3 static-file edits. If any migration errors, don't trust Wrangler's
rollback claim — verify with direct `SELECT`s before re-running, and
mind autoincrement-PK tables where a re-run genuinely duplicates rows
(see the Luxembourg 193 precedent in `PROGRESS.md`).

---

## Phase 5 — Testing checklist

- [ ] Main tracker: milestones on the board (both the arrivals view and
      list view), country in the region filter and sidebar
- [ ] Deep Dives menu + flyout include it (alphabetical within region),
      linking to `/country-slug`
- [ ] `/country-slug` and `/country-slug?lang=fr` render; "← Back to
      global tracker" works; the in-page panel opens from the sidebar
- [ ] Subscribe picker shows it, translated, in all four languages
- [ ] `/members/preferences` shows it (this now comes from D1
      automatically — if it's missing, the country row or a
      `country_translations` row is wrong, not a Worker file)
- [ ] A story tagged to it shows the auto-rendered deep-dive link in the
      archive
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

---

## Remaining architectural debt

The per-country hand-edits are down to the three Phase 2 items. Each is
deliberate: `countries.js` because a static page can't query D1, the
shared slug map because routing is synchronous by design, and the i18n
`countryNames` because static pages translate client-side — though that
one at least regenerates from D1 rather than being independently
authored. Collapsing any further means changing those design choices,
not just deleting a duplicate.
