-- Pakistan: country row + name translations. Hand-written, following the
-- Indonesia (356_indonesia_country.sql) template. Pakistan's FBR-run
-- Digital Invoicing mandate is a genuine real-time API clearance model --
-- unlike Indonesia's, it began as a narrow FMCG-sector pilot (SRO
-- 28(I)/2024) and expanded through a chain of SROs to a formal 31
-- December 2025 deadline covering all registered persons, with a
-- February 2026 draft SRO proposing a further extension into a broad
-- service-sector population -- live-researched against FBR's own SRO
-- PDFs (fbr.gov.pk / download1.fbr.gov.pk), EY/KPMG/PwC/Crowe tax alerts,
-- and Pakistani business press (Business Recorder, ProPakistani).
--
-- Naming decision: name_en = 'Pakistan' (the standard English name used
-- by every research source checked, and expected to match the
-- world-atlas topology's own spelling -- no TOPO_NAME_OVERRIDES entry
-- expected to be needed).
--
-- Per-language translations: Spanish "Pakistán" (with the standard
-- Spanish accent), German "Pakistan" (identical to English, the standard
-- German exonym), French "Pakistan" (identical to English, the standard
-- French exonym) -- all standard, widely-used forms, verified against
-- general usage.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('PK', 'Pakistan', 'Asia-Pacific', 'pakistan', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Pakistan' FROM countries WHERE code = 'PK';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Pakistán' FROM countries WHERE code = 'PK';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Pakistan' FROM countries WHERE code = 'PK';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Pakistan' FROM countries WHERE code = 'PK';
