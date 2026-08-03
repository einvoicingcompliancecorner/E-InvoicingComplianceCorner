-- Cyprus tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. Note: gov.cy is the current,
-- verified government portal -- the commonly-cited "ARIADNI" name
-- several 2025/2026-dated blog sources still use has actually been
-- retired (confirmed via a direct redirect notice and the most
-- recent 2025 EC country sheet).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://mof.gov.cy',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Cyprus'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://mof.gov.cy');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministry of Finance — the body responsible for e-invoicing policy, including any future mandate decisions.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://mof.gov.cy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Hacienda — el organismo responsable de la política de facturación electrónica, incluida cualquier futura decisión de mandato.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://mof.gov.cy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Finanzministerium — die für die E-Rechnungspolitik zuständige Stelle, einschließlich künftiger Pflichtentscheidungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://mof.gov.cy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministère des Finances — l''organisme responsable de la politique de facturation électronique, y compris toute future décision d''obligation.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://mof.gov.cy';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.gov.cy',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Cyprus'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.gov.cy');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'gov.cy — the government gateway portal used for voluntary e-invoice submission (replaced the retired ARIADNI catalogue).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://www.gov.cy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'gov.cy — el portal de la puerta de enlace del gobierno usado para la presentación voluntaria de facturas electrónicas (sustituyó al catálogo ARIADNI, ya retirado).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://www.gov.cy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'gov.cy — das Regierungsportal für die freiwillige Übermittlung von E-Rechnungen (ersetzte den eingestellten ARIADNI-Katalog).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://www.gov.cy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'gov.cy — le portail gouvernemental utilisé pour la soumission volontaire de factures électroniques (a remplacé le catalogue ARIADNI, désormais retiré).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url = 'https://www.gov.cy';

-- Cyprus is an EU member state -> also add the EC eInvoicing country
-- factsheet, matching the established pattern.
INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/eInvoicing+in+Cyprus',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Cyprus'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url LIKE '%digital-building-blocks%');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission''s country factsheet — legal framework, B2G/B2B/B2C scope, and mandate status, reviewed and updated periodically.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de la Comisión Europea — marco legal, alcance B2G/B2B/B2C y estado del mandato, revisada y actualizada periódicamente.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Länderfactsheet der Europäischen Kommission — Rechtsrahmen, B2G/B2B/B2C-Umfang und Pflichtstatus, regelmäßig überprüft und aktualisiert.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays de la Commission européenne — cadre juridique, périmètre B2G/B2B/B2C et statut de l''obligation, révisée et mise à jour périodiquement.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Cyprus' AND ts.url LIKE '%digital-building-blocks%';
