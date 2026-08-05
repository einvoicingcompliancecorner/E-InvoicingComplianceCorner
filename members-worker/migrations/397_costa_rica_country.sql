-- Costa Rica: country row + name translations. Hand-written, following
-- the Pakistan/Ecuador/Uruguay template. Costa Rica's Comprobantes
-- Electrónicos regime, run by the Dirección General de Tributación
-- (DGT) under the Ministerio de Hacienda, is a genuine clearance model
-- with roots back to 2007 and a general mandate since 2018 -- currently
-- mid-transition to Hacienda's new TRIBU-CR platform (launched 6 October
-- 2025) and a further XML schema/corporate-ID cutover due 1 November
-- 2026. Live-researched against Hacienda's own site (hacienda.go.cr),
-- Costa Rican press (La Nación, Delfino.cr, La Teja, Infobae), and
-- industry tax-technology advisories (Voxel Group, EDICOM, Alegra).
--
-- Naming decision: name_en = 'Costa Rica' -- an unmodified Spanish
-- proper noun used identically across English, Spanish, German, and
-- French; expected to match the world-atlas topology's own spelling
-- with no TOPO_NAME_OVERRIDES entry needed.
--
-- Per-language translations: Spanish "Costa Rica", German "Costa Rica",
-- French "Costa Rica" -- all identical to the English form, standard
-- usage confirmed across all four languages.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('CR', 'Costa Rica', 'Americas', 'costa-rica', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Costa Rica' FROM countries WHERE code = 'CR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Costa Rica' FROM countries WHERE code = 'CR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Costa Rica' FROM countries WHERE code = 'CR';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Costa Rica' FROM countries WHERE code = 'CR';
