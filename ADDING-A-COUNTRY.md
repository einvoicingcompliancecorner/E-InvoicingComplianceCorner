# Adding a New Country to the Site — Runbook

> **Note (updated 2 August 2026):** Deep-dive pages are no longer static
> HTML files — all 31 countries are now rendered dynamically from D1 (see
> `DEEP-DIVE-MIGRATION-CHECKLIST.md`). **Phase 2 below is obsolete** —
> don't create a new static `country-slug.html` file for a new country.
> Instead, follow `DEEP-DIVE-MIGRATION-CHECKLIST.md`'s per-country content
> checklist to write the deep-dive content directly into D1. Phases 1, 3,
> 4, 5, and 6 below are still accurate as written — the tracker itself,
> `countries.js`, the members-worker touchpoints, translations, and the
> hardcoded-count problem are all still static/hand-edited and unaffected
> by the deep-dive cutover. (The cutover is deployed and live as of
> 2 August 2026 — see `PROGRESS.md` for current status.)

This document exists because adding one country touches far more places than
it should. Follow this checklist in order rather than relying on memory —
several of these steps are easy to miss and won't cause an obvious error,
just a silent inconsistency (a country showing up untranslated in exactly
one place, a stat that still says "29" after you've added a 30th, etc.).

Work through the phases in order. Each phase lists exactly which file(s)
to touch and what to put in them.

---

## Before you start

Decide up front:
- **How many DATA entries does this country need?** Some mandates roll out
  in a single milestone; others phase in over several waves (like Saudi
  Arabia's Wave 23/24, or the UAE's pilot → ASP deadline → Phase 1 → Phase 2).
  Plan all of them now so you're not retrofitting the deep dive later.
- **Which region does it belong to?** Europe / Middle East / Asia-Pacific /
  Americas. This must match exactly (case and spelling) everywhere below.
- **The exact English country name you'll use everywhere.** Pick it once,
  spell it identically in every file. A mismatch (e.g. "Qatar" vs "State of
  Qatar") anywhere in this list will silently break matching between the
  subscribe picker, the members-worker preferences, and the notification
  system's country-tagging.

---

## Phase 1 — Core site data

### 1a. Main tracker — `einvoicing-compliance-tracker.html`
- Add one object per milestone to the `DATA` array (search `const DATA = [`).
  Each needs: `id`, `country`, `flag`, `code`, `region`, `system`, `date`,
  `desc`, `actions[]`, `portals[{label,url}]`. Use a short, unique `id`
  prefix for the country (e.g. `qa-` for Qatar), matching the pattern of
  existing entries like `sa-wave23`, `uae-phase1`.
- Add an entry to the `DEEP_DIVES` map (search `const DEEP_DIVES = {`):
  `"CountryName": "/country-slug"` — no `.html`, and a leading slash. This
  changed 2 August 2026 when the static per-country pages were retired in
  favor of dynamic D1-backed rendering (see `DEEP-DIVE-MIGRATION-CHECKLIST.md`).
- **Do not** touch the stats strip or sidebar — both are computed live from
  `DATA`, so they update automatically.

### 1b. Shared country list — `countries.js`
- Add the country name to the correct region's array. This file is the
  single source of truth for the subscribe page's country picker.

---

## Phase 2 — The deep-dive page

**Superseded 2 August 2026** — deep-dive pages are no longer static HTML
files. Don't create a `country-slug.html` file. Instead, write the same
content (compliance model classification, timeline, technical specs,
portals, related links — this is still genuine content writing, not a
quick data edit; budget real time for it) directly into D1, following
`DEEP-DIVE-MIGRATION-CHECKLIST.md`'s per-country content-extraction and
schema checklist. Use an existing migrated country as a content template
the same way this phase used to point at an existing static page — pick
one with a similar compliance model if possible (e.g. Saudi Arabia's for
another clearance-model Gulf country).

---

## Phase 3 — The members-worker (a separate codebase)

File: `members-worker/src/index.js`

- **`COUNTRIES_BY_REGION`** — a hardcoded duplicate of `countries.js` (Workers
  can't import external JS files). Add the country to the same region here,
  by hand. If you skip this, the country appears on the public subscribe
  page but not in the logged-in preferences page — a real, easy-to-miss
  inconsistency.
- **`COUNTRY_NAME_TRANSLATIONS`** — add the ES/DE/FR name for the country.
  Double-check the actual local name isn't just the English name
  copy-pasted three times — get this from a real source, not assumption.
  **This is the one genuine duplicate the D1 migration didn't reach** — see
  Phase 4 below for why the other two copies no longer need hand-editing.
- **`COUNTRY_DEEP_DIVE_SLUGS`** — added after this runbook was first written,
  as part of making the newsletter archive's source/deep-dive links
  auto-rendered rather than hand-embedded. Add `"CountryName": "country-slug"`
  here too, or any future newsletter story tagged with this country will
  silently render with no deep-dive link at all — no error, it just won't
  appear.

---

## Phase 4 — Country name translations

**As of the D1 migration, this is genuinely simpler than it used to be —
only worth two separate updates now, not three.**

1. **D1's `countries` and `country_translations` tables** — insert the new
   country (code, English name, region) and its ES/DE/FR translated names.
   This single insert now powers **three** things at once: the tracker's
   own `i18n/*.json` (regenerated via `generate_files.py`), the subscribe
   page's `i18n/*-subscribe.json` (same regeneration), and the newsletter
   archive's own country-tag display and deep-dive-link rendering. This
   used to be two separate hand-edited JSON files plus a third hardcoded
   copy — now it's one D1 insert plus running the generation script.

   ```bash
   npx wrangler d1 execute eicc-content --remote --file=./migrations/XXX_add_country.sql
   cd members-worker && python3 migrations/generate_files.py --remote --out i18n-generated
   python3 migrations/compare_generated.py   # confirm nothing else changed unexpectedly
   # then copy the genuinely new/changed files from i18n-generated/ into the real i18n/ folder
   ```

2. **`members-worker/src/index.js`'s `COUNTRY_NAME_TRANSLATIONS`** — still a
   separate hardcoded copy (see Phase 3). This is the one piece of the old
   triple-duplication that D1 hasn't absorbed, since the preferences page
   reads from this dictionary directly rather than from D1.

### New DATA entries also need their own translations
Each new milestone you added to `DATA` in Phase 1 needs a matching entry
added to `i18n/es-data.json`, `de-data.json`, and `fr-data.json`, keyed by
the same `id` you used in `DATA`. Same pattern as the other entries —
`{ "system": "...", "desc": "...", "actions": ["...", "..."] }`. **This
part is unrelated to the D1 migration and still needs hand-editing** —
D1 currently covers page-chrome translations and newsletter stories, not
the tracker's own per-milestone DATA content.

Run the same cross-check used throughout this project before moving on:

```python
import re, json
html = open('einvoicing-compliance-tracker.html').read()
# confirm every new id has a matching key in each -data.json file
```

---

## Phase 5 — The hardcoded "29" problem

**This is the step most likely to get missed entirely.** The main tracker's
own stat strip is computed dynamically from `DATA` and updates itself —
but several other pages have the country count hardcoded as literal prose,
and none of them auto-update:

- `subscribe.html` — the benefit stat strip ("29 Jurisdictions tracked")
- At least four of the five education pages — phrases like "each of the 29
  jurisdictions tracked here"
- Possibly `privacy-policy.html` — check for a mention

Search every HTML file for the literal string `29` and update each hit to
the new total. Do this for every one of the four languages' translation
JSON files too, wherever that number appears in translated prose (not just
the English source).

---

## Phase 6 — Testing checklist

Work through this in order after all of the above:

- [ ] Main tracker: country appears in the region filter, shows up in the
      timeline, appears in the sidebar's government portals list
- [ ] Deep Dives menu includes the new country, links to the right page
- [ ] The deep-dive page loads, and its "← Back to global tracker" link works
- [ ] Subscribe page's country picker shows the country, correctly
      translated, in all four languages
- [ ] members-worker's `/members/preferences` page shows the same country,
      same translations
- [ ] Every "29" (or whatever the old count was) is now the new count,
      across every language
- [ ] Re-run the key cross-check script against each new/edited JSON file —
      catches typos in `data-i18n` keys before they become silent gaps
- [ ] If the country's mandate is genuinely newsworthy, plan to mention it
      (with a `countries` tag) in the next monthly newsletter issue, so the
      notification system's country-matching actually reaches subscribers
      who'll care

---

## Known architectural debt (partially resolved, one piece remains)

**Update, post-D1-migration:** two of the original three duplicate copies
are now genuinely gone. The D1 `countries`/`country_translations` tables
are the actual single source of truth for the tracker and subscribe page's
country names, via the `generate_files.py` build step (see
`D1-MIGRATION-PLAN.md` and `NEWSLETTER-ARCHIVE-REDESIGN.md` for how and
why this was built). What used to be described here as a speculative fix
("could the members-worker fetch the tracker's JSON at request time?") is
no longer the relevant question — a real database ended up being the
actual answer.

**One genuine duplicate remains**: `members-worker/src/index.js`'s
`COUNTRY_NAME_TRANSLATIONS` object still exists as a separate hardcoded
copy, since the logged-in preferences page reads from it directly rather
than querying D1. This is a small, known gap — the Worker already has a
live D1 binding (`env.eicc_content`) it uses for stories, so having the
preferences page query `country_translations` directly instead of the
hardcoded object is a genuinely small, well-scoped piece of remaining
work, not a speculative one. Worth doing if country additions become
frequent enough that this one remaining hand-edit starts causing drift.
