# Adding a New Country to the Site — Runbook

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
  `"CountryName": "country-slug.html"`.
- **Do not** touch the stats strip or sidebar — both are computed live from
  `DATA`, so they update automatically.

### 1b. Shared country list — `countries.js`
- Add the country name to the correct region's array. This file is the
  single source of truth for the subscribe page's country picker.

---

## Phase 2 — The deep-dive page

Create `country-slug.html` from scratch, following the structure of an
existing deep dive (any of the 29 current ones works as a template — pick
one with a similar compliance model if possible, e.g. Saudi Arabia's for
another clearance-model Gulf country). This is genuine content writing —
compliance model classification, timeline, technical specs, portals,
related links — not a quick data edit. Budget real time for this step.

---

## Phase 3 — The members-worker (a separate codebase)

File: `members-worker/src/index.js`

- **`COUNTRIES_BY_REGION`** — a hardcoded duplicate of `countries.js` (Workers
  can't import external JS files). Add the country to the same region here,
  by hand. If you skip this, the country appears on the public subscribe
  page but not in the logged-in preferences page — a real, easy-to-miss
  inconsistency.
- **`COUNTRY_NAME_TRANSLATIONS`** — add the ES/DE/FR name for the country.
  Double-check the actual local name isn't just "Qatar" copy-pasted three
  times — e.g. Spanish renders it "Catar." Get this from a real source, not
  assumption.

---

## Phase 4 — Translation dictionaries (the part most likely to drift)

**Country name translations currently live in three separate places.** All
three need the identical new entry, by hand, in the same session — there is
no shared source of truth between them:

| # | File(s) | Powers |
|---|---|---|
| 1 | `i18n/en.json`, `es.json`, `de.json`, `fr.json` | Main tracker's filter pills, cards, sidebar |
| 2 | `i18n/en-subscribe.json`, `es-subscribe.json`, `de-subscribe.json`, `fr-subscribe.json` | Subscribe page's country picker |
| 3 | `members-worker/src/index.js` (`COUNTRY_NAME_TRANSLATIONS`) | Logged-in preferences page |

Add the country + its ES/DE/FR name to the `countryNames` object in **all
seven** of the JSON files above, plus the Worker's own dictionary. Use the
exact same translated spelling in all of them.

If you have time later, this triple duplication is worth consolidating —
see "Known architectural debt" at the bottom of this doc.

### New DATA entries also need their own translations
Each new milestone you added to `DATA` in Phase 1 needs a matching entry
added to `i18n/es-data.json`, `de-data.json`, and `fr-data.json`, keyed by
the same `id` you used in `DATA`. Same pattern as the other 68+ entries —
`{ "system": "...", "desc": "...", "actions": ["...", "..."] }`.

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

## Known architectural debt (not urgent, but real)

The triple-duplicated country-name dictionary (Phase 4) is a genuine design
smell — three copies of the same data, in two different codebases, with no
mechanism keeping them in sync beyond human discipline. It has worked fine
so far because additions have been infrequent and done carefully, but it
will eventually drift if this process is ever rushed or done by someone
without this document in front of them.

If country additions become frequent, worth revisiting: could the
members-worker fetch the tracker's static `i18n/*.json` files at request
time instead of maintaining its own hardcoded copy? (Cross-origin fetches
from a Worker don't hit CORS restrictions the way browser-side fetches do,
since the request happens server-side.) That would collapse three sources
of truth down to one.
