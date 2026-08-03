-- Vietnam tracking sources for /sources -- per ADDING-A-COUNTRY.md's
-- step 4. Vietnam is not an EU member state, so there is no EC
-- eInvoicing country factsheet to add (matching the Oman/Jordan/
-- Israel/South Korea precedent) -- only the GDT's own English portal
-- and the public invoice-lookup system.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://gdt.gov.vn/wps/portal/english',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Vietnam'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://gdt.gov.vn/wps/portal/english');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'General Department of Taxation (GDT) — the body administering Vietnam''s e-invoicing mandate and VAT law.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://gdt.gov.vn/wps/portal/english';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Dirección General de Tributación (GDT) — el organismo que administra el mandato de facturación electrónica y la ley del IVA de Vietnam.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://gdt.gov.vn/wps/portal/english';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Generaldirektion für Steuern (GDT) — die Stelle, die Vietnams E-Invoicing-Pflicht und Umsatzsteuerrecht verwaltet.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://gdt.gov.vn/wps/portal/english';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Direction générale de la fiscalité (GDT) — l''organisme qui administre l''obligation de facturation électronique et la loi sur la TVA du Viêt Nam.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://gdt.gov.vn/wps/portal/english';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://tracuuhoadon.gdt.gov.vn',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Vietnam'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://tracuuhoadon.gdt.gov.vn');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Invoice lookup system (tra cứu hóa đơn) — the GDT''s public tool for verifying an e-invoice''s status.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://tracuuhoadon.gdt.gov.vn';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Sistema de consulta de facturas (tra cứu hóa đơn) — la herramienta pública de la GDT para verificar el estado de una factura electrónica.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://tracuuhoadon.gdt.gov.vn';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Rechnungsabfragesystem (tra cứu hóa đơn) — das öffentliche Tool der GDT zur Prüfung des Status einer E-Rechnung.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://tracuuhoadon.gdt.gov.vn';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Système de consultation des factures (tra cứu hóa đơn) — l''outil public de la GDT pour vérifier le statut d''une facture électronique.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Vietnam' AND ts.url = 'https://tracuuhoadon.gdt.gov.vn';
