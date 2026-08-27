-- Hong Kong: country row + name translations.
--
-- WHY THIS IS ITS OWN ROW AND NOT A NOTE ON CHINA. Basic Law art. 106
-- says in terms that "The Central People's Government shall not levy
-- taxes in the Hong Kong Special Administrative Region"; art. 108
-- establishes an independent taxation system; art. 116 makes it a
-- separate customs territory. Hong Kong has been a WTO member in its
-- own right since 1 January 1995, six years before the PRC joined, and
-- there is a Mainland-HKSAR double taxation arrangement, which is a
-- document that exists only between separate tax jurisdictions. The
-- Liechtenstein precedent of 27 August 2026 went the same way on a
-- weaker case.
--
-- roi_complexity is 'none' and that is the correct value, not a
-- default left unset. The scale in shared/roi-render.mjs is explicit:
-- 0 = no mandate to build for. Hong Kong has no consumption tax, no
-- e-invoicing obligation at any level, no clearance and no Peppol
-- authority. There is nothing to integrate. Contrast Switzerland,
-- added the same week at 'simple', which has a real B2G issuing duty.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker, roi_complexity, eu_member) VALUES ('HK', 'Hong Kong', 'Asia-Pacific', 'hong-kong', 1, 'none', 0);

-- 'Hongkong' is one word in German (Duden); Spanish and French keep the
-- English spelling. name_en is exactly 'Hong Kong' on purpose: it is
-- also the feature name in vendor/countries-50m.json, so the map needs
-- no TOPO_NAME_OVERRIDES entry.
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Hong Kong' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Hong Kong' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Hongkong' FROM countries WHERE code = 'HK';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Hong Kong' FROM countries WHERE code = 'HK';

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM countries WHERE code = 'HK' = 1
-- ASSERT: SELECT in_picker FROM countries WHERE code = 'HK' = 1
-- ASSERT: SELECT roi_complexity FROM countries WHERE code = 'HK' = 'none'
-- ASSERT: SELECT eu_member FROM countries WHERE code = 'HK' = 0
-- ASSERT: SELECT region FROM countries WHERE code = 'HK' = 'Asia-Pacific'
-- ASSERT: SELECT count(*) FROM country_translations WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 4
-- The map matches on name_en, so a rename here silently unmaps the
-- country with no error at all. Pin the string the topology uses.
-- ASSERT: SELECT name_en FROM countries WHERE code = 'HK' = 'Hong Kong'
