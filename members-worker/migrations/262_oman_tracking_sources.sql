-- Oman tracking sources for /sources -- per ADDING-A-COUNTRY.md's
-- step 4. Oman is not an EU member state, so there is no EC
-- eInvoicing country factsheet to add (unlike the EU-member country
-- additions such as Cyprus) -- only the OTA's own Tax Portal pages.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://tms.taxoman.gov.om/portal/e-invoicing',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Oman'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://tms.taxoman.gov.om/portal/e-invoicing');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Oman Tax Authority — e-Invoicing (Fawtara) portal, the primary source for phase dates, taxpayer scope, and technical specifications.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/e-invoicing';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Autoridad Tributaria de Omán — portal de facturación electrónica (Fawtara), la fuente principal de fechas de fase, alcance de contribuyentes y especificaciones técnicas.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/e-invoicing';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Omanische Steuerbehörde — E-Rechnungsportal (Fawtara), die primäre Quelle für Phasentermine, Steuerzahlerumfang und technische Spezifikationen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/e-invoicing';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Autorité fiscale omanaise — portail de facturation électronique (Fawtara), la source principale pour les dates de phase, le périmètre des contribuables et les spécifications techniques.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/e-invoicing';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://tms.taxoman.gov.om/portal/service-provider',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Oman'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://tms.taxoman.gov.om/portal/service-provider');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Oman Tax Authority — Accredited Service Provider registration and accreditation standards.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/service-provider';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Autoridad Tributaria de Omán — registro y normas de acreditación de Proveedores de Servicios Acreditados.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/service-provider';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Omanische Steuerbehörde — Registrierung und Akkreditierungsstandards für akkreditierte Dienstleister.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/service-provider';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Autorité fiscale omanaise — enregistrement et normes d''accréditation des prestataires de services accrédités.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Oman' AND ts.url = 'https://tms.taxoman.gov.om/portal/service-provider';
