-- Jordan tracking sources for /sources -- per ADDING-A-COUNTRY.md's
-- step 4. Jordan is not an EU member state, so there is no EC
-- eInvoicing country factsheet to add (matching the Oman precedent)
-- -- only the ISTD's own site and the JoFotara registration portal.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://istd.gov.jo',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Jordan'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://istd.gov.jo');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Income and Sales Tax Department — the body supervising JoFotara and Jordan''s e-invoicing mandate.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://istd.gov.jo';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Departamento de Impuesto sobre la Renta y las Ventas — el organismo que supervisa JoFotara y el mandato de facturación electrónica de Jordania.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://istd.gov.jo';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Einkommen- und Umsatzsteuerbehörde — die Stelle, die JoFotara und Jordaniens E-Rechnungspflicht beaufsichtigt.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://istd.gov.jo';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Département des impôts sur le revenu et des ventes — l''organisme supervisant JoFotara et l''obligation de facturation électronique de la Jordanie.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://istd.gov.jo';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://portal.jofotara.gov.jo',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Jordan'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://portal.jofotara.gov.jo');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'JoFotara — registration and integration portal for Jordan''s National Electronic Invoicing System.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://portal.jofotara.gov.jo';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'JoFotara — portal de registro e integración del Sistema Nacional de Facturación Electrónica de Jordania.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://portal.jofotara.gov.jo';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'JoFotara — Registrierungs- und Integrationsportal für Jordaniens nationales elektronisches Rechnungssystem.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://portal.jofotara.gov.jo';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'JoFotara — portail d''enregistrement et d''intégration du système national de facturation électronique de la Jordanie.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Jordan' AND ts.url = 'https://portal.jofotara.gov.jo';
