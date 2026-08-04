-- Taiwan tracking sources for /sources -- per ADDING-A-COUNTRY.md's step 4.
-- The Ministry of Finance's E-Invoice Platform is the primary official
-- portal (cited by ecosio; the sandbox's WebFetch could not independently
-- verify the URL loads -- returned 403 -- so Dan should confirm it directly
-- from a browser before this goes live). Taiwan is not an EU member, so no
-- EC factsheet entry.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.einvoice.nat.gov.tw/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Taiwan'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.einvoice.nat.gov.tw/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministry of Finance -- E-Invoice Platform: the official portal for eGUI issuance and transmission, operated with the Fiscal Information Agency.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Taiwan' AND ts.url = 'https://www.einvoice.nat.gov.tw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Finanzas -- Plataforma de Facturación Electrónica: el portal oficial para la emisión y transmisión de eGUI, operado junto con la Agencia de Información Fiscal.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Taiwan' AND ts.url = 'https://www.einvoice.nat.gov.tw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Finanzministerium -- E-Invoice-Plattform: das offizielle Portal für die Ausstellung und Übermittlung von eGUI, betrieben mit der Fiscal Information Agency.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Taiwan' AND ts.url = 'https://www.einvoice.nat.gov.tw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministère des Finances -- Plateforme de facturation électronique : le portail officiel pour l''émission et la transmission des eGUI, exploité avec la Fiscal Information Agency.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Taiwan' AND ts.url = 'https://www.einvoice.nat.gov.tw/';
