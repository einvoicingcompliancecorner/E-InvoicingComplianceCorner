-- Dominican Republic tracking sources for /sources, per
-- ADDING-A-COUNTRY.md's step 4. All URLs independently fetched and
-- confirmed live in this session, directly from dgii.gov.do.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'DO'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'DGII — official e-CF (Comprobante Fiscal Electrónico) program landing page, the primary source for the Dominican Republic''s e-invoicing rules.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'DGII — página oficial del programa e-CF (Comprobante Fiscal Electrónico), la fuente primaria de las normas de facturación electrónica de República Dominicana.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'DGII — offizielle Landingpage des e-CF-Programms (Comprobante Fiscal Electrónico), die Primärquelle für die E-Rechnungsvorschriften der Dominikanischen Republik.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'DGII — page officielle du programme e-CF (Comprobante Fiscal Electrónico), la source primaire des règles de facturation électronique de la République dominicaine.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'DO'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'DGII — full official text of Ley núm. 32-23 de Facturación Electrónica, including Art. 37''s phased rollout timeline and Art. 26-31''s penalty provisions.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'DGII — texto oficial completo de la Ley núm. 32-23 de Facturación Electrónica, incluido el calendario de despliegue por fases del art. 37 y las sanciones de los arts. 26-31.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'DGII — vollständiger offizieller Text des Ley núm. 32-23 de Facturación Electrónica, einschließlich des gestaffelten Einführungsplans nach Art. 37 und der Sanktionsbestimmungen der Art. 26-31.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'DGII — texte officiel intégral de la Ley núm. 32-23 de Facturación Electrónica, y compris le calendrier de déploiement échelonné de l''art. 37 et les sanctions des art. 26-31.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'DO' AND ts.url = 'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf';
