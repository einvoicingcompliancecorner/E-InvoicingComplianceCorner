-- D1 schema for The E-Invoicing Compliance Corner
-- See D1-MIGRATION-PLAN.md for the full reasoning behind this design.
-- Apply with:
--   wrangler d1 execute eicc-content --remote --file=./schema.sql

-- ================================================================
-- Shared page-chrome translations (tracker, subscribe, education
-- pages, and — newly — country deep dives). Mirrors the existing
-- data-namespace / data-i18n dot-notation convention already used
-- across the site's HTML and i18n.js.
-- ================================================================
CREATE TABLE translations (
  id INTEGER PRIMARY KEY,
  namespace TEXT NOT NULL,   -- e.g. "tracker", "subscribe", "edu-mandate-types", "poland"
  key TEXT NOT NULL,         -- e.g. "benefits.title", "sec1.card1.title"
  lang TEXT NOT NULL,        -- "en" | "es" | "de" | "fr"
  value TEXT NOT NULL,
  UNIQUE(namespace, key, lang)
);

-- ================================================================
-- Countries — single source of truth, replacing the three
-- hand-maintained duplicate dictionaries flagged in
-- ADDING-A-COUNTRY.md (tracker, subscribe, members-worker).
--
-- *** STANDING WARNING — READ BEFORE COUNTING ROWS IN THIS TABLE ***
-- This table also holds a row for the European Union itself (needed
-- so EU-level content — e.g. the ViDA milestone — has somewhere to
-- attach), deliberately NOT a tracked jurisdiction: in_picker is 0.
-- Any query answering "how many countries/jurisdictions do we track"
-- MUST filter on in_picker = 1 — never a bare COUNT(*) or an unfiltered
-- DISTINCT over this table or anything joined from it (e.g.
-- milestones.country).
--
-- *** AND slug IS NOT NULL IS NO LONGER THE SAME FILTER ***
-- Until 28 August 2026 this warning offered "slug IS NOT NULL (or
-- in_picker = 1)" as interchangeable, because the EU had neither. It
-- now has a slug: Dan asked for its deep dive, which had existed and
-- been unreachable since migration 007, to be published without being
-- listed (migration 730). So the two conditions mean different things
-- and cannot be substituted for each other:
--
--   slug IS NOT NULL   this page can be SERVED — the router, the
--                      sitemap, anything asking "is there a URL"
--   in_picker = 1      this is one of the countries we LIST or COUNT —
--                      the side menu, the ROI picker, the map, the
--                      jurisdiction count, every headline number
--
-- Four call sites were relying on the first to mean the second when the
-- slug landed. Three had already patched around it locally with
-- `AND code != 'EU'`, which is the shape of a rule nobody had written
-- down. getMapCountries() had not, and would have asked a choropleth to
-- draw a shape that does not exist in the topology.
-- This exact mistake has independently recurred three times across
-- this project: a stale static translation string, a raw COUNT(*)
-- reasoning error (both found during the Netherlands country add,
-- 2 August 2026), and a live client-side JS stat on the tracker page
-- itself (`new Set(DATA.map(e=>e.country)).size` in
-- einvoicing-compliance-tracker.html — found and fixed 3 August 2026,
-- after Austria was added). See PROGRESS.md for the full history.
-- ================================================================
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

-- ================================================================
-- Newsletter stories — see NEWSLETTER-ARCHIVE-REDESIGN.md for the
-- full reasoning behind the per-story, continuously-published model.
-- ================================================================
CREATE TABLE stories (
  id TEXT PRIMARY KEY,           -- "2026-08-15-poland-ksef-update"
  date TEXT NOT NULL,
  month TEXT NOT NULL,           -- "2026-08" — stored for cheap filtering, derived from date
  summary_en TEXT NOT NULL,
  html_en TEXT NOT NULL,
  source_url TEXT,
  published INTEGER DEFAULT 1    -- boolean escape hatch for staging a story before it's ready
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

-- ================================================================
-- Helpful indexes for the query patterns the archive filter and
-- monthly digest will actually run.
-- ================================================================
CREATE INDEX idx_stories_month ON stories(month);
CREATE INDEX idx_stories_date ON stories(date);
CREATE INDEX idx_translations_namespace_lang ON translations(namespace, lang);
