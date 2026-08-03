-- Israel tracking sources for /sources -- per ADDING-A-COUNTRY.md's
-- step 4. Israel is not an EU member state, so there is no EC
-- eInvoicing country factsheet to add (matching the Oman/Jordan
-- precedent) -- only the ITA's own gov.il service pages.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.gov.il/en/service/request-assignment-number-for-tax-invoice',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Israel'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.gov.il/en/service/request-assignment-number-for-tax-invoice');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Israel Tax Authority — the service for requesting a SHAAM allocation number for a tax invoice.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/request-assignment-number-for-tax-invoice';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Autoridad Tributaria de Israel — el servicio para solicitar un número de asignación SHAAM para una factura fiscal.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/request-assignment-number-for-tax-invoice';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Israelische Steuerbehörde — der Dienst zur Beantragung einer SHAAM-Zuteilungsnummer für eine Steuerrechnung.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/request-assignment-number-for-tax-invoice';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Autorité fiscale israélienne — le service de demande d''un numéro d''allocation SHAAM pour une facture fiscale.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/request-assignment-number-for-tax-invoice';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.gov.il/en/service/verify-vendor-invoice-information',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Israel'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.gov.il/en/service/verify-vendor-invoice-information');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Israel Tax Authority — the service for verifying a vendor''s SHAAM invoice information.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/verify-vendor-invoice-information';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Autoridad Tributaria de Israel — el servicio para verificar la información de factura SHAAM de un proveedor.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/verify-vendor-invoice-information';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Israelische Steuerbehörde — der Dienst zur Überprüfung der SHAAM-Rechnungsangaben eines Lieferanten.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/verify-vendor-invoice-information';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Autorité fiscale israélienne — le service de vérification des informations de facture SHAAM d''un fournisseur.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Israel' AND ts.url = 'https://www.gov.il/en/service/verify-vendor-invoice-information';
