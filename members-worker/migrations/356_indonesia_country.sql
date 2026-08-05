-- Indonesia: country row + name translations. Hand-written, following the
-- Hungary (347_hungary_country.sql) template. Indonesia's Coretax mandate
-- is a genuine, currently-unfolding clearance-model e-invoicing story --
-- e-Faktur Pajak has required electronic VAT invoices in stages since
-- 2014, reaching nationwide coverage by 1 July 2016, and DJP's Coretax
-- platform (launched 1 January 2025) became fully enforced from 31
-- December 2025, making DJP approval a legal precondition for a valid
-- invoice for the first time -- live-researched against vatcalc.com,
-- fiscal-requirements.com, hanumaglobal.com, muc.co.id, and DJP's own
-- filings (pajak.go.id).
--
-- Naming decision: name_en = 'Indonesia' (the standard English name used
-- by every research source checked, and the world-atlas topology's own
-- spelling as far as could be confirmed -- no TOPO_NAME_OVERRIDES entry
-- expected to be needed).
--
-- Per-language translations: Spanish "Indonesia" (identical to English,
-- the standard Spanish exonym), German "Indonesien", French "Indonésie"
-- -- all standard, widely-used forms, verified against general usage.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('ID', 'Indonesia', 'Asia-Pacific', 'indonesia', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Indonesia' FROM countries WHERE code = 'ID';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Indonesia' FROM countries WHERE code = 'ID';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Indonesien' FROM countries WHERE code = 'ID';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Indonésie' FROM countries WHERE code = 'ID';
