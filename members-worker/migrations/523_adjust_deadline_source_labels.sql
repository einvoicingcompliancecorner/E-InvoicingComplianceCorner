-- ================================================================
-- Say where a country's default wave date COMES FROM.
--
-- Dan, testing the adjust panel: 'what is meant by Wave (go-live) date
-- reading "- computed" afterwards? Is this a mandated date computed, or
-- some other milestone'
--
-- Fair question, and the honest answer is that the label was wrong. The
-- marked option is the country's earliest future B2B mandate date read
-- straight out of `milestones` — nothing about it is computed. Worse,
-- the one word covered two materially different cases:
--
--   * a national deadline, from that country's own milestone row; and
--   * an EU-wide deadline, for a member state with NO national B2B date,
--     where the date comes from the ViDA row on the European Union entry
--     (see getRoiCountries, index 8 `euDriven`).
--
-- The second is the one a reader adjusting a plan actually needs to see.
-- Austria's 2030 is not Austria's decision and will not move on Austrian
-- news; France's 2026 is and will. Calling both "computed" hid the only
-- distinction the column was in a position to make, and told the reader
-- something untrue about both.
--
-- The rest of the panel is unchanged. This is a labelling migration.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'adjust.owndeadline', 'en', 'own deadline'),
  ('roi', 'adjust.eudeadline',  'en', 'EU-wide deadline');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'adjust.%' = 9
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key NOT LIKE 'help.%' = 109
--
-- 521 asserted 7 and 107 at its own point in the chain. Both were true
-- then and are false now, which is the mechanism working as designed:
-- a point-in-time assertion that stops holding later is reported as
-- SUPERSEDED, not as a failure. The two lines above are what replaces
-- them, and the standing invariant from 522 still applies to these rows.
