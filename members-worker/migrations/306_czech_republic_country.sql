-- Czech Republic: country row + name translations. Hand-written,
-- following the Cyprus (246_cyprus_country.sql) template -- evaluated
-- and recommended for a build in PROGRESS.md's 4 August 2026 entry,
-- built now per Dan's explicit "yes please".
--
-- Naming decision: name_en = 'Czech Republic' (the dominant form used
-- across every e-invoicing research source checked -- Sovos,
-- dddinvoices, the EC's own eInvoicing country sheet, VATupdate,
-- expats.cz, fiscal-requirements.com -- rather than 'Czechia', which
-- would have avoided a topology override but doesn't match how this
-- specific research space refers to the country). This means
-- shared/map-data.mjs needs a TOPO_NAME_OVERRIDES entry
-- ("Czech Republic": "Czechia") since vendor/countries-50m.json spells
-- the topology shape "Czechia" -- confirmed directly via Python
-- inspection of the bundled TopoJSON. Full-size country geometry, so
-- no MARKER_LONLAT_OVERRIDES fallback is needed.
--
-- Per-language translations verified against real government sources,
-- not machine copy-paste: German "Tschechien" (Auswartiges Amt's own
-- country-page title), Spanish "Republica Checa" (exteriores.gob.es's
-- own fact-sheet title), French "Republique tcheque" (France
-- Diplomatie's own page title/URL).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('CZ', 'Czech Republic', 'Europe', 'czech-republic', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Czech Republic' FROM countries WHERE code = 'CZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'República Checa' FROM countries WHERE code = 'CZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Tschechien' FROM countries WHERE code = 'CZ';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'République tchèque' FROM countries WHERE code = 'CZ';
