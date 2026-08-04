-- Philippines tracking sources for /sources -- per ADDING-A-COUNTRY.md's
-- step 4. The BIR's own EIS portal and its general eServices hub.
-- Philippines is not an EU member, so no EC factsheet entry.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://eis.bir.gov.ph/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Philippines'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://eis.bir.gov.ph/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'BIR -- Electronic Invoicing System (EIS): the BIR''s own portal for enrolling in and using the Electronic Invoicing/Receipting System that underpins the Phase 1 mandate.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://eis.bir.gov.ph/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'BIR -- Sistema de Facturación Electrónica (EIS): el portal propio del BIR para inscribirse y usar el Sistema de Facturación/Recibos Electrónicos que sustenta el mandato de la Fase 1.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://eis.bir.gov.ph/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'BIR -- Electronic Invoicing System (EIS): das eigene Portal des BIR zur Anmeldung und Nutzung des Electronic Invoicing/Receipting System, auf dem das Phase-1-Mandat aufbaut.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://eis.bir.gov.ph/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'BIR -- Système de facturation électronique (EIS) : le portail propre du BIR pour s''inscrire et utiliser le système Electronic Invoicing/Receipting System qui sous-tend le mandat de la Phase 1.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://eis.bir.gov.ph/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.bir.gov.ph/eServices',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Philippines'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.bir.gov.ph/eServices');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Bureau of Internal Revenue -- eServices: the BIR''s general hub for its online services, including announcements and guidance on Revenue Regulations as they''re issued.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://www.bir.gov.ph/eServices';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Buró de Rentas Internas -- eServices: el centro general del BIR para sus servicios en línea, incluidos anuncios y orientación sobre los Reglamentos de Rentas a medida que se emiten.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://www.bir.gov.ph/eServices';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Bureau of Internal Revenue -- eServices: die allgemeine Anlaufstelle des BIR für seine Online-Dienste, einschließlich Ankündigungen und Hinweisen zu Revenue Regulations bei deren Veröffentlichung.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://www.bir.gov.ph/eServices';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Bureau of Internal Revenue -- eServices : le portail général du BIR pour ses services en ligne, incluant les annonces et les orientations sur les Revenue Regulations à leur publication.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Philippines' AND ts.url = 'https://www.bir.gov.ph/eServices';
