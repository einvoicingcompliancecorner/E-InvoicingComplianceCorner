-- Thailand: country row + name translations.
--
-- roi_complexity is 'none' and that is the correct value. Dan's scale in
-- shared/roi-render.mjs is explicit: 0 = no mandate to build for.
-- Thailand's two e-tax-invoice routes are both voluntary in the words of
-- their own instruments, so there is nothing a project must deliver.
-- Same call as Hong Kong and Liechtenstein.
--
-- FIRST COUNTRY BUILT TO DEEP-DIVE-FRAMEWORK.md rather than retrofitted
-- onto it. The backlog in tests/data/deep-dive-backlog.json exempts the
-- seventy-six that came before; it does not exempt this one, and
-- tests/deep-dive-shape.mjs holds it to every band on the day it lands.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker, roi_complexity, eu_member) VALUES ('TH', 'Thailand', 'Asia-Pacific', 'thailand', 1, 'none', 0);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Thailand' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Tailandia' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Thailand' FROM countries WHERE code = 'TH';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Thaïlande' FROM countries WHERE code = 'TH';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM countries WHERE code = 'TH' = 1
-- ASSERT: SELECT in_picker FROM countries WHERE code = 'TH' = 1
-- ASSERT: SELECT roi_complexity FROM countries WHERE code = 'TH' = 'none'
-- ASSERT: SELECT eu_member FROM countries WHERE code = 'TH' = 0
-- ASSERT: SELECT region FROM countries WHERE code = 'TH' = 'Asia-Pacific'
-- ASSERT: SELECT count(*) FROM country_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'TH') = 4
-- The map matches on name_en against vendor/countries-50m.json, and a
-- rename there unmaps the country in silence. Pin the topology string.
-- ASSERT: SELECT name_en FROM countries WHERE code = 'TH' = 'Thailand'
