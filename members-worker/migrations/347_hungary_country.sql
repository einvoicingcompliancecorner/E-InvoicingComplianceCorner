-- Hungary: country row + name translations. Hand-written, following the
-- Czech Republic (306_czech_republic_country.sql) template. Hungary is a
-- much richer build than Czech Republic's thin precedent: RTIR (real-time
-- invoice reporting via NAV's Online Szamla system) has been running since
-- 2018 and is one of the most mature transaction-reporting regimes in
-- Europe, a genuine sector B2B e-invoicing mandate (electricity/gas/water)
-- took effect 1 July 2025, and a further B2C receipt-reporting expansion
-- is confirmed for 1 September 2026 -- live-researched against EDICOM,
-- vatit.com, RTC Suite, the European Commission's own eInvoicing country
-- factsheet, and VATupdate's December 2025 briefing.
--
-- Naming decision: name_en = 'Hungary' (the standard English exonym used
-- by every research source checked). The world-atlas topology used by
-- The Map is expected to spell it the same way -- confirmed separately in
-- migration/task notes; no TOPO_NAME_OVERRIDES entry needed if so.
--
-- Per-language translations verified against real government/diplomatic
-- sources, not machine copy-paste: Spanish "Hungria" (exteriores.gob.es's
-- own country fact-sheet naming convention), German "Ungarn" (Auswartiges
-- Amt's own country-page title), French "Hongrie" (France Diplomatie's
-- own page title/URL).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('HU', 'Hungary', 'Europe', 'hungary', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Hungary' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Hungría' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Ungarn' FROM countries WHERE code = 'HU';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Hongrie' FROM countries WHERE code = 'HU';
