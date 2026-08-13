-- Uzbekistan + Azerbaijan: country rows + name translations (#69, #70).
--
-- REGION: both placed in 'Asia-Pacific' at Dan's explicit instruction
-- ("Please do Uzbekistan and Azerbaijan and place both in Asia
-- Pacific", 10 Aug 2026). Neither sits cleanly in this tracker's four
-- regions -- Uzbekistan is Central Asian, Azerbaijan is South
-- Caucasus/transcontinental -- and this is the third time the question
-- has arisen (Turkey went to Europe by Dan's explicit choice, 3 Aug;
-- Kazakhstan went to Asia-Pacific by Dan's explicit choice, 6 Aug).
-- Placing Uzbekistan alongside Kazakhstan is consistent with that
-- precedent; Azerbaijan is a genuine judgment call that Dan made
-- directly rather than one assumed here.
--
-- Both were surfaced by the 10 Aug 2026 global coverage evaluation
-- (see PROGRESS.md) and then given a full second deep-research pass
-- before this build, per this project's standing discipline. Both
-- passes corrected real errors in the first-pass evaluation -- see
-- the headers of 494/495 for the specific corrections and the full
-- sourcing trail.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('UZ', 'Uzbekistan', 'Asia-Pacific', 'uzbekistan', 1);
INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('AZ', 'Azerbaijan', 'Asia-Pacific', 'azerbaijan', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Uzbekistan' FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Uzbekistán' FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Usbekistan' FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Ouzbékistan' FROM countries WHERE code = 'UZ';

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Azerbaijan' FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Azerbaiyán' FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Aserbaidschan' FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Azerbaïdjan' FROM countries WHERE code = 'AZ';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- Both rows land, and both carry a full set of four display names -- a
-- missing language here surfaces as an English name in a Spanish menu
-- rather than as an error.
--
-- ASSERT: SELECT count(*) FROM countries WHERE code IN ('UZ','AZ') = 2
-- ASSERT: SELECT count(*) FROM country_translations WHERE country_id IN (SELECT id FROM countries WHERE code IN ('UZ','AZ')) = 8
