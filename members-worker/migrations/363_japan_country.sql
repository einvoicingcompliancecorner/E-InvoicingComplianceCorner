-- Japan: country row + name translations. Live-researched against
-- Japan's Digital Agency (digital.go.jp), the National Tax Agency
-- (nta.go.jp), and industry sources (EDICOM, Peppol.org). Japan is a
-- genuinely distinctive shape for this tracker: there is NO e-invoicing
-- ISSUANCE mandate -- businesses can still issue paper or PDF invoices
-- freely. What Japan does have is (1) the Qualified Invoice System
-- (適格請求書等保存方式), a real, dated, legally mandatory registration
-- and documentation regime tied to consumption-tax input-credit
-- eligibility, effective 1 October 2023, and (2) JP PINT/Peppol, a
-- real but entirely VOLUNTARY government-endorsed electronic
-- e-invoicing standard led by the Digital Agency since 2021. See
-- 364-369 for the full build.
--
-- Per-language translations: Spanish "Japón", German "Japan", French
-- "Japon" -- the standard exonyms used across government/diplomatic
-- and general reference sources in each language.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('JP', 'Japan', 'Asia-Pacific', 'japan', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Japan' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Japón' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Japan' FROM countries WHERE code = 'JP';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Japon' FROM countries WHERE code = 'JP';
