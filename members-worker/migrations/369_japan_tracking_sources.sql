-- Japan tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. The Digital Agency's own JP PINT page
-- (voluntary Peppol e-invoicing standard) and the National Tax Agency's
-- general site (the mandatory Qualified Invoice System, registration,
-- and the transitional relief taper). Japan is not an EU/EEA member, so
-- no EC eInvoicing factsheet is added, matching the established pattern.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.digital.go.jp/en/policies/electronic_invoice',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Japan'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.digital.go.jp/en/policies/electronic_invoice');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Digital Agency — JP PINT, Japan''s voluntary Peppol PINT BIS Billing-compliant e-invoicing specification and implementation plan.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.digital.go.jp/en/policies/electronic_invoice';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Agencia Digital — JP PINT, la especificación y el plan de implementación voluntarios de facturación electrónica de Japón conformes con Peppol PINT BIS Billing.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.digital.go.jp/en/policies/electronic_invoice';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Digital Agency — JP PINT, Japans freiwillige, Peppol-PINT-BIS-Billing-konforme E-Rechnungsspezifikation und Umsetzungsplan.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.digital.go.jp/en/policies/electronic_invoice';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Agence numérique — JP PINT, la spécification et le plan de mise en œuvre volontaires de facturation électronique du Japon, conformes à Peppol PINT BIS Billing.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.digital.go.jp/en/policies/electronic_invoice';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.nta.go.jp/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Japan'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.nta.go.jp/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'National Tax Agency (NTA) — the Qualified Invoice System, supplier registration, and the transitional input-tax-credit relief schedule.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.nta.go.jp/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Agencia Nacional Tributaria (NTA) — el Sistema de Facturas Cualificadas, el registro de proveedores y el calendario del alivio transitorio del crédito fiscal soportado.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.nta.go.jp/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Nationale Steuerbehörde (NTA) — das Qualified Invoice System, die Lieferantenregistrierung und der Zeitplan der Übergangsregelung zum Vorsteuerabzug.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.nta.go.jp/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Administration fiscale nationale (NTA) — le régime des factures qualifiées, l''enregistrement des fournisseurs et le calendrier de l''allègement transitoire du crédit de taxe en amont.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Japan' AND ts.url = 'https://www.nta.go.jp/';
