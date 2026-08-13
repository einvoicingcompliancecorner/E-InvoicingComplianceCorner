-- ================================================================
-- Arrivals board: keep ONE 1 July 2030 ViDA entry (the European Union
-- one), and drop the eleven per-country restatements of it.
--
-- Dan, 11 Aug 2026: "we have several entries on the Arrivals board
-- listed for Jul 2030 and ViDA. It is listed for each country, but
-- then again for the European Union. I wonder if it might be cleaner
-- to simply have an entry for the European Union, which also exists
-- already there."
--
-- He is right, and the board currently shows TWELVE cards for the same
-- date and the same directive: the `eu-drr` entry plus eleven
-- per-country copies. They say materially the same thing — Council
-- Directive (EU) 2025/516 makes structured e-invoicing and digital
-- reporting mandatory for intra-EU B2B from 1 July 2030 — because
-- that is one EU-wide fact, not eleven national ones.
--
-- Evidence this was drift rather than design: Ireland
-- (`ie-phase3-vida`) and Slovakia (`sk-crossborder-2030`) already have
-- on_tracker = 0 on their own 2030 entries. Both of those carry
-- genuinely domestic content (Ireland's own phase 3; Slovakia's
-- Kontrolný výkaz being phased out), which is the opposite of what you
-- would expect if off-boarding had been a considered rule. The generic
-- restatements stayed on the board; the specific ones came off.
--
-- WHY on_tracker = 0 AND NOT DELETE. These rows are worth keeping on
-- each country's deep-dive timeline, where the country-specific
-- framing is genuinely useful and not duplicative -- "regardless of
-- whether the Czech Republic ever enacts a domestic B2B mandate --
-- none exists or is currently proposed -- ViDA still applies" answers
-- a real question a reader of that page will have. `on_tracker`
-- is exactly the right lever: site-worker's renderTracker() and
-- shared/map-data.mjs's getMapCountries() both filter on it, while
-- shared/deep-dive-render.mjs's getMilestonesForCountry() deliberately
-- does not filter at all. So this removes them from the board and the
-- map's status input, and leaves the country pages untouched.
--
-- VERIFIED BEFORE WRITING (full in-memory replay, today = 2026-08-10):
--   * Map status: ZERO countries change colour. Every affected country's
--     status is already decided by another on_tracker milestone, so
--     nothing silently flips to 'tracked' or 'nomandate'.
--   * Board presence: every affected country retains at least one
--     on_tracker milestone (fewest is Cyprus and Czech Republic with
--     one each), so no country disappears from the Arrivals board.
--
-- DELIBERATELY NOT INCLUDED — Sweden's `se-b2b-expected`. It shares the
-- date and mentions ViDA, but its body is really about Sweden's
-- domestic position (Skatteverket, DIGG and Bolagsverket having asked
-- the government to evaluate a mandate), which the EU entry does not
-- cover. Off-boarding it would remove Sweden's only 2030 board entry
-- and lose that information from the board entirely. Flagged for Dan
-- rather than decided here; a one-line follow-up migration can add it
-- if he wants it gone too.
--
-- Norway's `no-receive` (2030-01-01) is untouched and should stay:
-- Norway is not an EU member state, so ViDA does not apply to it and
-- that milestone is a domestic Norwegian obligation.
-- ================================================================

UPDATE milestones SET on_tracker = 0 WHERE id IN (
  'at-vida-2030',   -- Austria
  'bg-vida-2030',   -- Bulgaria
  'cy-vida-2030',   -- Cyprus
  'cz-vida-2030',   -- Czech Republic
  'ee-vida-2030',   -- Estonia
  'fi-vida',        -- Finland
  'gr-vida-2030',   -- Greece
  'hu-vida-2030',   -- Hungary
  'lt-vida-2030',   -- Lithuania
  'mt-vida-2030',   -- Malta
  'nl-vida-2030'    -- Netherlands
);

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- An UPDATE ... WHERE id IN (...) is the single most dangerous shape in
-- this repository: mistype one id and that row is silently skipped, with
-- no error and no visible difference until someone notices a duplicate
-- card on the board months later. So assert both halves -- all eleven ids
-- exist, and none of them is still on the board.
--
-- ASSERT: SELECT count(*) FROM milestones WHERE id IN ('at-vida-2030','bg-vida-2030','cy-vida-2030','cz-vida-2030','ee-vida-2030','fi-vida','gr-vida-2030','hu-vida-2030','lt-vida-2030','mt-vida-2030','nl-vida-2030') = 11
-- ASSERT: SELECT count(*) FROM milestones WHERE on_tracker = 1 AND id IN ('at-vida-2030','bg-vida-2030','cy-vida-2030','cz-vida-2030','ee-vida-2030','fi-vida','gr-vida-2030','hu-vida-2030','lt-vida-2030','mt-vida-2030','nl-vida-2030') = 0
-- ASSERT: SELECT count(*) FROM milestones WHERE date = '2030-07-01' AND on_tracker = 1 = 2
