-- ================================================================
-- The standing invariants of this database.
--
-- THIS MIGRATION CHANGES NOTHING. It contains no SQL at all. Every
-- line below is an `ASSERT ALWAYS` directive, which apply_migrations.py
-- checks at the end of the full replay and against the live database
-- under --assert-only. If a later migration breaks one of these, the
-- replay fails and nothing is applied.
--
-- WHY A FILE THAT DOES NOTHING. The assertions added to migrations
-- 493-516 each describe what one file did, at the moment it did it.
-- That catches a migration that silently no-ops. It does not catch the
-- other half of this project's failure history, which is DRIFT: two
-- things that must agree, one of them updated, the other not. Nobody
-- writes a migration to break an invariant; they write a migration
-- that does its own job correctly and leaves something else behind.
-- So the invariant has to be stated somewhere OTHER than the migration
-- that might break it, and checked continuously.
--
-- Everything here is written RELATIVELY — one table compared against
-- another, never against a hardcoded number. A hardcoded invariant is
-- just a fact with an expiry date, and it will be edited into
-- agreement the first time it becomes inconvenient, which defeats the
-- purpose.
--
-- HOW TO USE IT. When you add a country, run:
--     python3 apply_migrations.py --replay-only
-- If the first invariant fails, you have added a country and not yet
-- swept the jurisdiction count through the D1 `translations` table.
-- That exact omission ran undetected from 9 to 11 August 2026 across
-- three country builds (see 500's header) and is the reason this file
-- exists.
--
-- Adding to this list is encouraged. The bar is: two things in the
-- database that MUST agree, where nothing else would notice if they
-- stopped agreeing.
-- ================================================================


-- ---- 1. The prose count agrees with the actual count ----
-- Forty user-facing strings across four languages state how many
-- jurisdictions this site tracks. They must state the number of
-- countries actually in the picker. Comparing the text to a live
-- count, rather than to '70', is the whole point: this stays true
-- through the next country build only if the sweep is done.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE key IN ('sec5.card3.body','statusBanner.text','sec8.card3.body','sec6.card3.body','sec7.card3.body','benefits.intro','benefits.item2.body','card.countriesHint','confirm.fullDigest','brand.description') AND value LIKE '%' || (SELECT count(*) FROM countries WHERE in_picker = 1) || '%' = 40


-- ---- 2. Every country is named in every language ----
-- A missing country_translations row does not error and does not blank
-- the page; it falls back to English, so a Spanish visitor gets one
-- English country name in an otherwise Spanish menu and nobody notices.
--
-- ASSERT ALWAYS: SELECT count(*) FROM countries c WHERE (SELECT count(*) FROM country_translations t WHERE t.country_id = c.id) < 4 = 0


-- ---- 3. Every milestone has English text ----
-- The parent/child translation pattern COALESCEs to English per column.
-- A milestone with no English child row has nothing to fall back TO,
-- and renders as an empty card rather than as an error.
--
-- ASSERT ALWAYS: SELECT count(*) FROM milestones m WHERE NOT EXISTS (SELECT 1 FROM milestone_translations t WHERE t.milestone_id = m.id AND t.lang = 'en') = 0


-- ---- 4. No orphaned milestones ----
-- D1 does not enforce foreign keys by default. A milestone whose
-- country_id points nowhere is invisible everywhere on the site and
-- perfectly happy in the table.
--
-- ASSERT ALWAYS: SELECT count(*) FROM milestones m WHERE NOT EXISTS (SELECT 1 FROM countries c WHERE c.id = m.country_id) = 0


-- ---- 5. Every active ROI input is labelled and explained ----
-- An active benchmark with no English translation row renders as an
-- unlabelled input in the planner's assumptions panel. Same for phases,
-- which would draw an unnamed bar on the Gantt.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_benchmarks b WHERE b.active = 1 AND NOT EXISTS (SELECT 1 FROM roi_benchmark_translations t WHERE t.benchmark_id = b.id AND t.lang = 'en') = 0
-- ASSERT ALWAYS: SELECT count(*) FROM roi_phases p WHERE NOT EXISTS (SELECT 1 FROM roi_phase_translations t WHERE t.phase_id = p.id AND t.lang = 'en') = 0


-- ---- 6. The complexity review ledger agrees with the column ----
-- The ledger records a decision about a country's roi_complexity. If
-- someone changes the column without recording a new decision, the
-- ledger is now documenting a value that is no longer there — and the
-- weekly drift check would go on quietly comparing fingerprints
-- against a superseded verdict.
--
-- ASSERT ALWAYS: SELECT count(*) FROM roi_complexity_reviews r JOIN countries c ON c.code = r.code WHERE r.decision <> c.roi_complexity = 0


-- ---- 7. The FX base stays at parity ----
-- Every money figure on the planner is held in USD and converted from
-- there. If the USD row is ever anything but 1.0, every number on the
-- page moves and nothing on the page says so.
--
-- ASSERT ALWAYS: SELECT usd_per_unit FROM roi_fx_rates WHERE currency = 'USD' = 1
