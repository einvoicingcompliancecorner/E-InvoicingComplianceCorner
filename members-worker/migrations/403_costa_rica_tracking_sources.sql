-- Costa Rica tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. Hacienda's Comprobantes Electrónicos API
-- documentation (the technical reference at the heart of the clearance
-- system) and Hacienda's Avisos TRIBU-CR hub (the current official
-- portal for the platform migration and e-invoicing tools). Costa Rica
-- is not an EU/EEA member, so no EC eInvoicing factsheet is added,
-- matching the Pakistan/Ecuador/Uruguay precedent (377/384/396).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Costa Rica'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministerio de Hacienda — Comprobantes Electrónicos API documentation, the official technical reference for submitting and validating electronic vouchers with DGT.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Hacienda — documentación de la API de Comprobantes Electrónicos, la referencia técnica oficial para enviar y validar comprobantes electrónicos ante la DGT.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Ministerio de Hacienda — Dokumentation der API für Comprobantes Electrónicos, die offizielle technische Referenz für die Übermittlung und Validierung elektronischer Belege bei der DGT.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministerio de Hacienda — documentation de l''API des Comprobantes Electrónicos, la référence technique officielle pour la soumission et la validation des documents électroniques auprès de la DGT.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.hacienda.go.cr/AvisosTRIBU-CR.html',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Costa Rica'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.hacienda.go.cr/AvisosTRIBU-CR.html');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministerio de Hacienda — Avisos TRIBU-CR, the official portal for the new integrated tax platform, its e-invoicing tools (including TICO FACTURA), and migration announcements.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/AvisosTRIBU-CR.html';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Hacienda — Avisos TRIBU-CR, el portal oficial de la nueva plataforma tributaria integrada, sus herramientas de facturación electrónica (incluida TICO FACTURA) y los anuncios de migración.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/AvisosTRIBU-CR.html';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Ministerio de Hacienda — Avisos TRIBU-CR, das offizielle Portal für die neue integrierte Steuerplattform, ihre E-Rechnungs-Tools (einschließlich TICO FACTURA) und Migrationsankündigungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/AvisosTRIBU-CR.html';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministerio de Hacienda — Avisos TRIBU-CR, le portail officiel de la nouvelle plateforme fiscale intégrée, de ses outils de facturation électronique (dont TICO FACTURA) et des annonces de migration.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Costa Rica' AND ts.url = 'https://www.hacienda.go.cr/AvisosTRIBU-CR.html';
