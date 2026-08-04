-- Czech Republic tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. NEN (nen.nipez.cz) for the actual
-- B2G e-invoicing/procurement portal, the Ministry of Finance
-- (mfcr.cz) for tax policy including EET 2.0, and the EC's own
-- eInvoicing country factsheet since Czech Republic is an EU member
-- state, matching the established pattern.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://nen.nipez.cz',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Czech Republic'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://nen.nipez.cz');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Národní elektronický nástroj (NEN) — the government e-procurement portal used for voluntary e-invoice submission to public contracting authorities.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://nen.nipez.cz';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Národní elektronický nástroj (NEN) — el portal gubernamental de contratación electrónica utilizado para el envío voluntario de facturas electrónicas a los poderes adjudicadores públicos.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://nen.nipez.cz';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Národní elektronický nástroj (NEN) — das staatliche eProcurement-Portal für die freiwillige Übermittlung von E-Rechnungen an öffentliche Auftraggeber.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://nen.nipez.cz';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Národní elektronický nástroj (NEN) — le portail gouvernemental de passation électronique des marchés utilisé pour la soumission volontaire de factures électroniques aux pouvoirs adjudicateurs publics.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://nen.nipez.cz';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.mfcr.cz',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Czech Republic'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.mfcr.cz');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministry of Finance — the body responsible for tax policy, including EET 2.0''s progress through the Senate and any future e-invoicing mandate decisions.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://www.mfcr.cz';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Hacienda — el organismo responsable de la política fiscal, incluido el avance de EET 2.0 en el Senado y cualquier futura decisión de mandato de facturación electrónica.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://www.mfcr.cz';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Finanzministerium — die für die Steuerpolitik zuständige Stelle, einschließlich des Fortschritts von EET 2.0 im Senat und künftiger Entscheidungen zu E-Rechnungspflichten.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://www.mfcr.cz';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministère des Finances — l''organisme responsable de la politique fiscale, y compris l''avancement d''EET 2.0 au Sénat et toute future décision d''obligation de facturation électronique.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url = 'https://www.mfcr.cz';

-- Czech Republic is an EU member state -> also add the EC eInvoicing
-- country factsheet, matching the established pattern.
INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108881/eInvoicing+in+Czech+Republic',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Czech Republic'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url LIKE '%digital-building-blocks%');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission''s country factsheet — legal framework, B2G/B2B/B2C scope, and mandate status, reviewed and updated periodically.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de la Comisión Europea — marco legal, alcance B2G/B2B/B2C y estado del mandato, revisada y actualizada periódicamente.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Länderfactsheet der Europäischen Kommission — Rechtsrahmen, B2G/B2B/B2C-Umfang und Pflichtstatus, regelmäßig überprüft und aktualisiert.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url LIKE '%digital-building-blocks%';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays de la Commission européenne — cadre juridique, périmètre B2G/B2B/B2C et statut de l''obligation, révisée et mise à jour périodiquement.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Czech Republic' AND ts.url LIKE '%digital-building-blocks%';
