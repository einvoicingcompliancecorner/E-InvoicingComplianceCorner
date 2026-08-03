-- Austria tracking sources for /sources -- built now, not left as a
-- gap the way Netherlands' was (see ADDING-A-COUNTRY.md's step 4,
-- added specifically because of that miss).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.erechnung.gv.at',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Austria'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.erechnung.gv.at');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'e-Rechnung.gv.at (USP) — B2G submission portal and official guidance.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.erechnung.gv.at';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'e-Rechnung.gv.at (USP) — portal de presentación B2G y orientación oficial.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.erechnung.gv.at';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'e-Rechnung.gv.at (USP) — B2G-Übermittlungsportal und offizielle Hinweise.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.erechnung.gv.at';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'e-Rechnung.gv.at (USP) — portail de soumission B2G et orientations officielles.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.erechnung.gv.at';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.wko.at/netzwerke/was-ist-ebinterface',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Austria'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.wko.at/netzwerke/was-ist-ebinterface');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'WKO — ebInterface standard updates, including the upcoming 7.0 release.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.wko.at/netzwerke/was-ist-ebinterface';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'WKO — actualizaciones del estándar ebInterface, incluida la próxima versión 7.0.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.wko.at/netzwerke/was-ist-ebinterface';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'WKO — Updates zum ebInterface-Standard, einschließlich der kommenden Version 7.0.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.wko.at/netzwerke/was-ist-ebinterface';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'WKO — mises à jour de la norme ebInterface, y compris la prochaine version 7.0.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url = 'https://www.wko.at/netzwerke/was-ist-ebinterface';

-- Austria is an EU member state -> also add the EC eInvoicing country
-- factsheet, matching the pattern established in migration 215/223.
INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/wikis/pages/viewpage.action?pageId=667222799',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Austria'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url LIKE '%digital-building-blocks%');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission''s country factsheet — legal framework, B2G/B2B/B2C scope, and mandate status, reviewed and updated periodically.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de la Comisión Europea — marco legal, alcance B2G/B2B/B2C y estado del mandato, revisada y actualizada periódicamente.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Länderfactsheet der Europäischen Kommission — Rechtsrahmen, B2G/B2B/B2C-Umfang und Pflichtstatus, regelmäßig überprüft und aktualisiert.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays de la Commission européenne — cadre juridique, périmètre B2G/B2B/B2C et statut de l''obligation, révisée et mise à jour périodiquement.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Austria' AND ts.url LIKE '%digital-building-blocks%';
