-- South Korea tracking sources for /sources -- per ADDING-A-COUNTRY.md's
-- step 4. South Korea is not an EU member state, so there is no EC
-- eInvoicing country factsheet to add (matching the Oman/Jordan/Israel
-- precedent) -- only the NTS's own English information portal and the
-- Hometax platform itself.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.nts.go.kr/english/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'South Korea'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.nts.go.kr/english/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'National Tax Service (NTS) — the body administering the e-Tax Invoice system and South Korea''s VAT law.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.nts.go.kr/english/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Servicio Nacional de Impuestos (NTS) — el organismo que administra el sistema e-Tax Invoice y la ley del IVA de Corea del Sur.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.nts.go.kr/english/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Nationale Steuerbehörde (NTS) — die Stelle, die das e-Tax-Invoice-System und Südkoreas Mehrwertsteuerrecht verwaltet.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.nts.go.kr/english/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Administration fiscale nationale (NTS) — l''organisme qui administre le système e-Tax Invoice et la loi sur la TVA de la Corée du Sud.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.nts.go.kr/english/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.hometax.go.kr',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'South Korea'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.hometax.go.kr');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'NTS Hometax — the platform used to issue and transmit e-Tax Invoices.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.hometax.go.kr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'NTS Hometax — la plataforma utilizada para emitir y transmitir facturas e-Tax Invoice.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.hometax.go.kr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'NTS Hometax — die Plattform zur Ausstellung und Übermittlung von e-Tax Invoices.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.hometax.go.kr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'NTS Hometax — la plateforme utilisée pour émettre et transmettre les e-Tax Invoice.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'South Korea' AND ts.url = 'https://www.hometax.go.kr';
