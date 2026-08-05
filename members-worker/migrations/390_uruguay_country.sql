-- Uruguay: country row + name translations. Hand-written, following the
-- Pakistan/Ecuador (371/378) template. Uruguay's CFE (Comprobante Fiscal
-- Electrónico) regime, run by DGI (Dirección General Impositiva), is one
-- of the oldest mandatory e-invoicing systems in Latin America -- a
-- voluntary/pilot phase from 2012, phased mandatory rollout by taxpayer
-- revenue tier from 2014-2019, and a final universal-adoption closure
-- effective 1 January 2025 -- live-researched against DGI's own site
-- (efactura.dgi.gub.uy, gub.uy), IMPO (Uruguay's official legal gazette/
-- database), the CIAT (Inter-American Center of Tax Administrations)
-- country profile, and industry tax-technology advisories (Sovos,
-- gosocket, LLB Solutions).
--
-- Naming decision: name_en = 'Uruguay' -- a proper noun of Guaraní
-- origin used unmodified across English, Spanish, German, and French;
-- expected to match the world-atlas topology's own spelling with no
-- TOPO_NAME_OVERRIDES entry needed.
--
-- Per-language translations: Spanish "Uruguay", German "Uruguay", French
-- "Uruguay" -- all identical to the English form, standard usage
-- confirmed across all four languages (unlike country names with
-- distinct forms per language, Uruguay is not translated).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('UY', 'Uruguay', 'Americas', 'uruguay', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Uruguay' FROM countries WHERE code = 'UY';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Uruguay' FROM countries WHERE code = 'UY';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Uruguay' FROM countries WHERE code = 'UY';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Uruguay' FROM countries WHERE code = 'UY';
