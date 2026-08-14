-- ================================================================
-- Split `on_tracker` into presentation and substance.
--
-- Design review, recommendation 1: "Something like on_tracker (show on
-- the board) and obligation_status (live / superseded / duplicate-of).
-- The 148-vs-11 distinction becomes queryable, and the next consumer
-- that needs 'real obligations' can ask for them directly."
--
-- `on_tracker` means, and has only ever meant, SHOW THIS ON THE ARRIVALS
-- BOARD. It is a presentation flag. The trouble is that four consumers
-- filter on it — the board, the map, the ROI planner, the monthly
-- digest — and each of them is really asking a different question, so
-- each has been reading an editorial decision as a statement of fact.
-- Reading it as "is this a real obligation" is what moved the UK's
-- modelled deadline from April 2029 to November 2026 when a blanket
-- readmission was tried in August 2026.
--
-- NOTHING VISIBLE CHANGES IN THIS MIGRATION. Every consumer still
-- filters on `on_tracker` exactly as before; the board, the map, the
-- deep dives and the planner render byte-for-byte what they rendered
-- yesterday. This adds the vocabulary and the classification so the
-- distinction can be reviewed before anything acts on it.
--
-- THE VOCABULARY
--   live         a real obligation. Already in force, or dated ahead.
--   superseded   was real; another row replaced it.
--   restatement  real, but stated canonically by another row. Carries
--                restates_id pointing at that row.
--   context      never an obligation. A consultation, an inquiry, a
--                budget statement, a technical publication, a soft
--                signal of intent.
--   unreviewed   off the board and not yet classified. THE DEFAULT.
--
-- WHY `unreviewed` EXISTS, AND WHY IT IS THE DEFAULT. 179 of the 208
-- off-board rows are past-dated. Classifying them correctly needs
-- reading each one, and this migration does not do that. Defaulting them
-- to 'live' would assert something unchecked about 179 rows; defaulting
-- them to 'superseded' would assert the opposite, equally unchecked.
-- Neither is knowable from the columns alone. So they say so.
--
-- This is deliberately not tidy. A column that admits what it has not
-- looked at is worth more than one that guesses uniformly, because the
-- guess is invisible and the admission is queryable:
--
--   SELECT co.code, m.id, m.date FROM milestones m
--     JOIN countries co ON co.id = m.country_id
--    WHERE m.obligation_status = 'unreviewed' ORDER BY m.date DESC;
--
-- WHAT WAS ACTUALLY REVIEWED: all 204 on-board rows, and all 29
-- off-board rows dated in the future — the ones any consumer asking for
-- "real obligations" would care about. Each of the 29 was read.
-- ================================================================

ALTER TABLE milestones ADD COLUMN obligation_status TEXT NOT NULL DEFAULT 'unreviewed'
  CHECK (obligation_status IN ('live','superseded','restatement','context','unreviewed'));

-- The canonical row a restatement restates. Nullable, and only ever set
-- on a 'restatement'.
ALTER TABLE milestones ADD COLUMN restates_id TEXT REFERENCES milestones(id);


-- ---- on the board = a claim that it is real ----------------------
-- Nothing reaches the arrivals board by accident; putting a milestone
-- there is an editorial statement that a reader should act on it. So
-- every on-board row is live by construction, and the standing invariant
-- at the bottom keeps it that way — including for countries added later.
UPDATE milestones SET obligation_status = 'live' WHERE on_tracker = 1;


-- ---- off the board, dated ahead, and genuinely binding -----------
-- Eleven obligations a business must plan for that no consumer can
-- currently see, plus Ireland's and Slovakia's own 2030 entries, which
-- migration 504 left off the board because they carry country-specific
-- content rather than restating ViDA.
UPDATE milestones SET obligation_status = 'live' WHERE id IN (
  'pl-grace-period-ends',        -- KSeF grace period and small-invoice exception both expire
  'dk-saft2027',                 -- Danish SAF-T 2.0 generation required on demand
  'br-full-migration-2033',      -- CBS/IS collection begins; legacy taxes phase out
  'sk-postman-mandatory-2027',   -- certified Digital Postman transmission becomes compulsory
  'pt-saft-full',                -- first mandatory full accounting SAF-T submission
  'dk-oioubl-phaseout',          -- OIOUBL 2.1 gone; migration to BIS 4 must be complete
  'sg-phase-2029',               -- next GST revenue band brought into scope
  'sg-phase-2030',               -- and the next
  'bg-saft-mediumsmall-2027',    -- SAF-T phase 2 (reporting, not e-invoicing: scope 'none')
  'bg-saft-midtier-2028',        -- SAF-T phase 3, threshold drops sharply
  'bg-saft-micro-2030',          -- SAF-T phase 5, every remaining VAT-registered entity
  'ie-phase3-vida',              -- Ireland's own phase 3, not a ViDA restatement
  'sk-crossborder-2030'          -- Slovakia's Kontrolný výkaz phase-out, likewise
);


-- ---- off the board, dated ahead, and not obligations -------------
-- Each of these is a date to WATCH, not a date to comply with. They
-- belong on a country's deep-dive timeline, which is exactly where they
-- are, and they would be actively misleading in a wave plan: nothing is
-- required of a business on any of these days.
UPDATE milestones SET obligation_status = 'context' WHERE id IN (
  'uk-budget-2026-due',          -- roadmap and technical standards are DUE to be published
  'no-technical-detail-2026',    -- Skattedirektoratet to confirm remaining detail
  'dk-bis4-rc',                  -- a release candidate issued for stakeholder comment
  'se-inquiry-findings-2027',    -- inquiry findings due; may or may not lead to a mandate
  'fi-vida-prep'                 -- "plans to begin preparing"; the row itself calls it
);                               --   a soft, non-binding marker


-- ---- the eleven ViDA restatements --------------------------------
-- Migration 504's subject: the board carried twelve cards for 1 July
-- 2030 saying the same thing, because it is one EU-wide fact and not
-- eleven national ones. They are real obligations for these countries —
-- they are simply stated canonically by `eu-drr`, and now they say so
-- in a way a query can follow rather than a comment a human must find.
UPDATE milestones SET obligation_status = 'restatement', restates_id = 'eu-drr'
 WHERE id IN ('at-vida-2030','bg-vida-2030','cy-vida-2030','cz-vida-2030','ee-vida-2030',
              'fi-vida','gr-vida-2030','hu-vida-2030','lt-vida-2030','mt-vida-2030','nl-vida-2030');


-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM milestones WHERE obligation_status = 'live' AND on_tracker = 1 = 204
-- ASSERT: SELECT count(*) FROM milestones WHERE obligation_status = 'live' AND on_tracker = 0 = 13
-- ASSERT: SELECT count(*) FROM milestones WHERE obligation_status = 'context' = 5
-- ASSERT: SELECT count(*) FROM milestones WHERE obligation_status = 'restatement' = 11
-- ASSERT: SELECT count(*) FROM milestones WHERE obligation_status = 'unreviewed' = 179
--
-- And the substantive rule, written against the current date rather than
-- a hardcoded one so it does not quietly expire: nothing dated in the
-- FUTURE may sit unclassified. Past rows may stay 'unreviewed' as long as
-- they like — nobody plans against them — but a future obligation nobody
-- has looked at is exactly the gap this migration exists to close, and
-- the next person to add one will be told.
--
-- ASSERT ALWAYS: SELECT count(*) FROM milestones WHERE obligation_status = 'unreviewed' AND date > date('now') = 0
--
-- Three standing invariants. The first is the one that matters: it makes
-- the runbook step non-optional. A new country's milestones arrive with
-- the column's default, so scaffolding a country onto the board without
-- classifying it fails the replay rather than quietly adding an
-- unreviewed row to the board. new_country_scaffold.py emits the value.
--
-- ASSERT ALWAYS: SELECT count(*) FROM milestones WHERE on_tracker = 1 AND obligation_status <> 'live' = 0
-- (Note the `m.` aliases below. Written without them, the inner query's
-- `restates_id` binds to the INNER table, so every restatement matches
-- itself and the invariant reports zero regardless of the data. The
-- first draft had exactly that bug and the assertion mechanism caught it
-- on the first replay — a check that verifies nothing is the failure
-- this whole mechanism exists to prevent, and it is just as easy to
-- write in the check as in the migration.)
--
-- ASSERT ALWAYS: SELECT count(*) FROM milestones m WHERE m.obligation_status = 'restatement' AND (m.restates_id IS NULL OR NOT EXISTS (SELECT 1 FROM milestones o WHERE o.id = m.restates_id)) = 0
-- ASSERT ALWAYS: SELECT count(*) FROM milestones m WHERE m.restates_id IS NOT NULL AND m.obligation_status <> 'restatement' = 0
