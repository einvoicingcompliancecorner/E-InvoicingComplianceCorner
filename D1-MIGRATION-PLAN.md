# D1 Migration Plan — Translations & Newsletter Content

This document designs the move from scattered JSON files and KV records to
a single Cloudflare D1 database as the source of truth for translations
(tracker, subscribe, education pages, and — newly — country deep dives)
and newsletter story content. It builds on, and cross-references rather
than repeats, `NEWSLETTER-ARCHIVE-REDESIGN.md` for the per-story schema
details.

**Status as of 1 August 2026: largely built and substantially exceeded
in scope for deep-dive content. See "Current status" immediately below
for what's actually implemented, what diverged from this original plan,
and what's still outstanding. The rest of this document is preserved as
the original design record — the reasoning and schema below mostly still
holds, but the deep-dive piece in particular grew well beyond what was
scoped here.**

---

## Current status (updated 1 August 2026)

**Done, matching this plan closely:**
- D1 database created and live (`eicc-content`,
  `d1d10bd0-e90a-44a3-9494-a63689e8d32e`); `translations`, `countries`,
  `country_translations`, `stories`, `story_countries`, and
  `story_translations` tables all exist per the schema below and are the
  source of truth.
- Existing translations and the three duplicated country-name dictionaries
  were backfilled into D1 as planned (`002_backfill_countries.sql` and
  related migrations).
- 40+ newsletter stories now live in D1 across the original country set,
  plus new stories for 12 previously zero-coverage countries (Italy,
  United Kingdom, India, Romania, European Union, China, Canada, United
  States, Ireland, Norway, Singapore, Sweden) — all sourced and fully
  translated (EN/ES/DE/FR).
- The build-time generation script exists
  (`members-worker/migrations/generate_files.py`) and is run before every
  Cloudflare Pages upload, exactly as this plan specified — the
  `data-i18n` / `i18n.js` runtime mechanism was never touched.

**Not done — deferred, not abandoned:**
- **Subscribers remain on KV (`SUBSCRIBERS`)**, not migrated to D1. This
  was flagged in the original plan as "worth deciding, not required," and
  it's still an open, separate decision rather than something blocking
  anything else.

**Substantially exceeded the original scope — "Stage 4":**
The original plan (see the newsletter/story section below) envisioned
deep-dive translations as a simple per-page key/value translation file,
generated the same way as tracker or subscribe-page chrome. What actually
got built instead is a full dynamic, D1-backed rendering architecture —
"Stage 4" — covering not just translated prose but the entire structural
content of each country's deep-dive page: milestones (shared with the
tracker's own timeline), page intros, stat strips, spec/related cards,
getting-compliant steps, tabular penalty schedules, lifecycle/pill-list
cards, and official portal links, each fully bilingual-through-French.
Full schema reference and lessons learned: `DEEP-DIVE-MIGRATION-CHECKLIST.md`.

Stage 4 status: **16 of 31 tracker countries fully migrated** (content and
translations both verified against the static originals) — Portugal,
France, Germany, Poland, Spain, Malaysia, United Kingdom, Romania,
Belgium, Finland, Croatia, Denmark, Ireland, Norway, Slovakia, and Sweden.
**15 remain**: Australia, Brazil, Canada, Chile, China, European Union,
India, Italy, Mexico, New Zealand, Peru, Saudi Arabia, Singapore, United
Arab Emirates, United States.

Critically, **Stage 4 is not yet live** — the dynamic rendering exists
only as an unauthenticated preview
(`/admin/preview/deep-dive?country=X`, `/admin/preview/milestones?country=X`),
running in parallel with the still-live static HTML deep-dive pages and
tracker. No cutover has happened. This means the migration plan below's
step 6 ("update the members-worker's data-access code") has effectively
already happened for deep-dive *reads* via the preview routes, but the
production site itself has not been switched over — that cutover is
still a distinct, pending step once all 31 countries are migrated and the
preview has been reviewed end-to-end.

---

## Why now, and why this is the right scope

Three things make this the right moment, not just a defensible one:

1. **The site can't launch until the Lemon Squeezy account goes live
   anyway** — this is genuinely dead time that can be used well.
2. **Migrating a small amount of content is much lower-risk than migrating
   live production data.** Right now: 7 newsletter issues, and country
   deep-dive translations that don't exist yet at all (still English-only,
   deliberately deferred — see the original scope notes). There's no
   "in-flight" data to break.
3. **The country deep dives were always going to need a translation
   home eventually** — doing that home properly (D1, not a fourth
   duplicated JSON-file convention) at the same time as the newsletter
   redesign avoids solving the same problem twice.

---

## The key design decision: don't touch the runtime i18n system

Every translated page already follows one convention: `data-i18n="key"`
tags in HTML, and `i18n.js` fetching `i18n/{lang}-{namespace}.json` to
populate them. **This plan keeps that mechanism completely unchanged.**
The only thing that moves is *where the JSON file comes from* — a build
script queries D1 and writes the file, instead of a human hand-editing
it. Same schema, same loader, same HTML tags. This is what makes the
migration provably low-risk: the generated output can be diffed against
what exists today before anything switches over.

---

## D1 schema

### `translations` — one shared table for all page chrome

```sql
CREATE TABLE translations (
  id INTEGER PRIMARY KEY,
  namespace TEXT NOT NULL,   -- e.g. "tracker", "subscribe", "edu-mandate-types", "poland"
  key TEXT NOT NULL,         -- e.g. "benefits.title", "sec1.card1.title" — same dot-notation already used
  lang TEXT NOT NULL,        -- "en" | "es" | "de" | "fr"
  value TEXT NOT NULL,
  UNIQUE(namespace, key, lang)
);
```

`namespace` deliberately mirrors the `data-namespace` attribute already
used on `i18n.js`'s own script tag — a build script queries
`WHERE namespace = ? AND lang = ?`, reconstructs the nested JSON object
from the dot-notation keys, and writes exactly the file `i18n.js` already
expects.

### `countries` and `country_translations` — the fix for the triple-duplication problem

```sql
CREATE TABLE countries (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,        -- "PL", "BE", etc.
  name_en TEXT NOT NULL,
  region TEXT NOT NULL              -- "Europe" | "Middle East" | "Asia-Pacific" | "Americas"
);

CREATE TABLE country_translations (
  country_id INTEGER REFERENCES countries(id),
  lang TEXT NOT NULL,
  display_name TEXT NOT NULL,
  PRIMARY KEY (country_id, lang)
);
```

This single pair of tables replaces all three hand-maintained copies
flagged in `ADDING-A-COUNTRY.md` (tracker's `countryNames`, subscribe's
own copy, and the members-worker's `COUNTRY_NAME_TRANSLATIONS`). Every
consumer — the build script generating static JSON, and the
members-worker querying D1 directly at runtime — reads from the same
place. Adding a new country becomes one `INSERT`, not four hand-edits
kept in sync by discipline.

### Newsletter stories

See `NEWSLETTER-ARCHIVE-REDESIGN.md` for the full reasoning; the tables
themselves:

```sql
CREATE TABLE stories (
  id TEXT PRIMARY KEY,           -- "2026-08-15-poland-ksef-update"
  date TEXT NOT NULL,
  month TEXT NOT NULL,           -- "2026-08" — derived, but stored for cheap query filtering
  summary_en TEXT NOT NULL,
  html_en TEXT NOT NULL,
  source_url TEXT,
  published INTEGER DEFAULT 1    -- boolean escape hatch, see the archive redesign doc
);

CREATE TABLE story_countries (
  story_id TEXT REFERENCES stories(id),
  country_id INTEGER REFERENCES countries(id),
  PRIMARY KEY (story_id, country_id)
);

CREATE TABLE story_translations (
  story_id TEXT REFERENCES stories(id),
  lang TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  html TEXT NOT NULL,
  PRIMARY KEY (story_id, lang)
);
```

### Subscribers (optional, same migration — worth deciding, not required)

The members-worker's `SUBSCRIBERS` KV could move to D1 in the same pass
(`subscribers` + `subscriber_countries` tables, replacing the JSON array
currently stored inline per record), which also solves the "subscriber
language preference" gap flagged in the archive redesign doc — a `lang`
column falls out naturally. This isn't required for the translations
piece to work, so it's worth deciding as a genuinely separate call rather
than assuming it comes bundled in.

---

## The build-time generation step

A script (Python or Node — Python fits this project's existing tooling
better, given every other data-migration and validation script in this
project has been Python) that:

1. Connects to D1 via `wrangler d1 execute --json` — reusing the same
   CLI already used for KV and secrets throughout this project, rather
   than introducing a separate HTTP API integration.
2. For each `(namespace, lang)` pair in `translations`, queries all rows,
   reconstructs the nested JSON object from the dot-notation keys, and
   writes `i18n/{lang}-{namespace}.json` (or `i18n/{lang}.json` for the
   tracker/subscribe shared chrome, matching current naming exactly).
3. For `country_translations`, generates the shared `countryNames`
   block consumed by all current copies.
4. For deep-dive pages specifically, generates their per-page translation
   files the same way — this is where deep-dive translations actually
   get **created** for the first time, authored directly into D1 rather
   than migrated from anything that exists today.

### This becomes a new required step before every deploy

Today's workflow is "re-zip the outputs folder, upload to Cloudflare
Pages." This adds one step before that: **run the generation script
first**, so the freshly-generated JSON files are included in what gets
zipped and uploaded. Worth documenting clearly wherever the deployment
process is written down, since forgetting this step would mean deploying
stale translations — a real, easy-to-miss failure mode worth flagging
explicitly rather than leaving implicit.

---

## Migration plan, in order

1. **Create the D1 database** (`wrangler d1 create ...`) and the schema
   above.
2. **Backfill existing translations**: a one-time script reads every
   current `i18n/*.json` file, flattens the nested structure into
   `(namespace, key, lang, value)` rows, and inserts them into
   `translations`. Same for the three existing country-name dictionaries
   → `countries` + `country_translations`.
3. **Backfill the 7 existing newsletter issues**: split each month's
   mixed-country blob into individual story records, per
   `NEWSLETTER-ARCHIVE-REDESIGN.md`.
4. **Write the generation script**, and — critically — **diff its output
   against the current hand-written JSON files** before switching
   anything over. This is the concrete proof that the migration hasn't
   silently changed runtime behavior.
5. **Switch the deploy workflow** to run the generation script as a
   required pre-upload step.
6. **Update the members-worker's data-access code** to query D1 directly
   for stories (and subscribers, if that's included) — this part *is* a
   genuine rewrite of that layer, not a drop-in swap, and should be tested
   thoroughly given it's live-serving code, not just build tooling.
7. **Only then**, begin authoring deep-dive translations directly into
   D1 — this is new content creation, not a migration step, and can
   proceed independently of everything above once the pipeline is proven.

---

## What stays exactly as it is

- The HTML `data-i18n` tagging convention on every page.
- `i18n.js`'s loading mechanism and file-naming convention.
- The static, Direct-Upload deployment model for the main site — this
  plan doesn't introduce a live dependency for any static page; it only
  changes where the files come from before upload.

## What's a genuine, higher-risk change worth testing carefully

- The members-worker's own data-access code, if subscribers/stories move
  from KV to direct D1 queries — this is live-serving code affecting
  real checkout → webhook → login flows, and deserves the same care as
  anything else already shipped in that file.
