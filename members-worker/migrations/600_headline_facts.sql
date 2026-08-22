-- ================================================================
-- Five facts, the same five, for every jurisdiction.
--
-- Dan, 21 August 2026: "Could we state 1. B2G, B2B and B2C requirement
-- for eInvoicing such as mandate, no mandate or scheduled for <date>.
-- The Archiving requirement, The Digital Signature requirement in the
-- headline boxes consistently on each country page."
-- ================================================================
--
-- WHY THIS IS A TABLE AND NOT A RENDERING CHANGE.
--
-- The guide's headline tiles come from deep_dive_stats, which is five
-- free-form value/label pairs chosen per country: Germany offers "2
-- formats / No CTC / 8 yrs / EUR 5,000 / 2028", Azerbaijan offers a
-- launch date and a VAT rate. They are interesting and they are not
-- comparable -- which is the entire complaint. A reader with eleven
-- markets cannot line eleven pages up against each other.
--
-- Before building it, I checked whether the five facts were already in
-- the data. They are not, and the shortfall is the reason this migration
-- exists rather than a query:
--
--   B2B      derivable from milestones.mandate_scope for 54 of 70; the
--            other 16 have no b2b milestone, and absence there really
--            does mean no mandate, so this one was sound.
--   B2G      NOT sound. Only 19 countries carry a b2g_only milestone,
--            and 12 EU member states carry none at all -- yet Directive
--            2014/55/EU makes B2G receipt mandatory in every one of
--            them. A tile built from that data would have printed "no
--            mandate" against twelve countries that plainly have one.
--   B2C      not present in any form. mandate_scope has no b2c value.
--   Archiving        found in card rows for 36 of 70, under five
--                    different key names ("Archiving", "Retention
--                    period", "Central retention", ...).
--   Signature        20 of 70.
--
-- So three of the five would have been blank or wrong on most pages.
-- Scraping them out of prose rows by keyword was the tempting shortcut
-- and is exactly how this project has shipped confident nonsense before:
-- the ROI planner inferred country complexity by regex over a prose
-- field until migration 510 found nine countries silently rated zero.
-- A value that drives a customer-facing claim must be STORED, not
-- inferred. Same rule, written down again because it keeps applying.
--
-- ---- WHAT MAKES A STATUS ----------------------------------------------
--
-- DAN'S WORDS, NOT MINE. He asked for the model in these terms: "so that
-- we are able to quickly determine if there is ACTIVE, PLANNED (<date>),
-- NO MANDATE". The first draft of this table called them mandatory /
-- scheduled / none, which meant the database would have said one thing
-- and every page, every conversation and every future request would have
-- said another.
--
-- That gap is not cosmetic here. "A control that names two things and
-- does one" is a defect this page has now been caught by four times
-- (migrations 587, 588, 591, 592), and two vocabularies for one state is
-- the same failure one level down -- it survives in code review because
-- both halves are individually correct. The column speaks the language
-- the person asking for it speaks.
--
--   active       in force now for the segment named
--   planned      enacted, dated, not yet in force -- date REQUIRED
--   voluntary    a real, operating, optional regime. Japan's JP PINT and
--                Peppol layer is not "no mandate": a reader deciding
--                where to invest needs to know an established rail
--                exists, and this tracker already separates the two on
--                the board (mandate_scope 'none' plus a live scheme).
--                Kept as a fourth value, flagged here rather than
--                slipped in, because Dan named three.
--   no_mandate   no obligation and no operating voluntary scheme
--   unknown      not yet researched, or researched and unconfirmable
--
-- 'planned' without a date is refused by a CHECK, because "planned" with
-- nothing after it is the least useful thing a compliance sheet can say
-- and the easiest omission to make.
--
-- ---- AND EVERY FACT CARRIES ITS OWN SOURCE ----------------------------
--
-- ADDING-A-COUNTRY.md's sourcing standard, added 6 August after the
-- citation audit found 71% of story citations did not support the claim
-- they were attached to: a source_url must substantiate the SPECIFIC
-- claim, not the general topic. Five facts therefore need five sources,
-- not one country homepage repeated five times -- which is the precise
-- pattern that audit found and that migration 406 spent 121 UPDATEs
-- undoing.
--
-- unknown_reason exists so that "we could not confirm this" is a
-- first-class, storable answer. Without it the only way to record an
-- unresearched fact is to leave a NULL that looks identical to an
-- oversight, and the tile would have no way to tell a reader the
-- difference between "no requirement" and "we do not know".

CREATE TABLE country_headline_facts (
  country_id       INTEGER PRIMARY KEY REFERENCES countries(id),

  b2g_status       TEXT NOT NULL CHECK (b2g_status IN ('active','planned','voluntary','no_mandate','unknown')),
  b2g_date         TEXT,
  b2g_source       TEXT,

  b2b_status       TEXT NOT NULL CHECK (b2b_status IN ('active','planned','voluntary','no_mandate','unknown')),
  b2b_date         TEXT,
  b2b_source       TEXT,

  b2c_status       TEXT NOT NULL CHECK (b2c_status IN ('active','planned','voluntary','no_mandate','unknown')),
  b2c_date         TEXT,
  b2c_source       TEXT,

  -- Archiving is a period plus a condition. The years are separate from
  -- the prose because the years are what a reader compares across
  -- markets, and a column that says "10 years" for France and "dix ans"
  -- for the French edition cannot be compared or sorted.
  archiving_years  INTEGER,
  archiving_status TEXT NOT NULL CHECK (archiving_status IN ('years','varies','no_requirement','unknown')),
  archiving_source TEXT,

  signature_status TEXT NOT NULL CHECK (signature_status IN ('required','conditional','not_required','unknown')),
  signature_source TEXT,

  -- The date the facts were checked, not the date the row was written.
  -- A compliance sheet whose facts are two years old should say so.
  last_verified    TEXT NOT NULL,
  unknown_reason   TEXT,

  -- "Scheduled" is a promise about a date. Make the database keep it.
  CHECK (b2g_status != 'planned' OR b2g_date IS NOT NULL),
  CHECK (b2b_status != 'planned' OR b2b_date IS NOT NULL),
  CHECK (b2c_status != 'planned' OR b2c_date IS NOT NULL),
  CHECK (archiving_status != 'years' OR archiving_years IS NOT NULL)
);

-- The words, which are the only part that translates. Status and date are
-- language-neutral by construction -- that is half the reason they are
-- columns rather than sentences.
CREATE TABLE country_headline_fact_translations (
  country_id     INTEGER NOT NULL REFERENCES countries(id),
  lang           TEXT NOT NULL,
  b2g_note       TEXT,
  b2b_note       TEXT,
  b2c_note       TEXT,
  archiving_note TEXT,
  signature_note TEXT,
  PRIMARY KEY (country_id, lang)
);

CREATE INDEX idx_headline_facts_verified ON country_headline_facts(last_verified);

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 0
--
-- EMPTY ON PURPOSE. The schema lands in its own migration so the research
-- that fills it can arrive in batches, each one reviewable on its own,
-- rather than as a single seventy-country wall nobody can check. The
-- guide must therefore treat a missing row as "not yet researched" and
-- keep showing that country's existing stats -- see the renderer.
--
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE b2b_status = 'planned' AND b2b_date IS NULL = 0
--
-- The CHECK above already enforces this at write time. The invariant
-- states it again at the level a reader of this file cares about, and
-- would catch a future migration that rebuilt the table without the
-- constraint -- which is how constraints usually get lost.
--
-- AND THE SECOND ONE GUARDS THE VOCABULARY ITSELF. If a later migration
-- widens the enum to re-admit "mandatory" alongside "active", this fails
-- -- which is the only mechanical defence against the two-vocabularies
-- drift the note at the top of this file is about.
--
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE b2b_status NOT IN ('active','planned','voluntary','no_mandate','unknown') = 0
