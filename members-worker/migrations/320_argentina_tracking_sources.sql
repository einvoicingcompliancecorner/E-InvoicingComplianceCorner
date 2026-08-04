-- Argentina tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. ARCA's own e-invoicing portal (the
-- afip.gob.ar domain still hosts the live service pages) and ARCA's
-- official landing portal for general/institutional news. Argentina
-- is not an EU member, so no EC factsheet entry.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.afip.gob.ar/fe/emision-autorizacion/sujetos.asp',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Argentina'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.afip.gob.ar/fe/emision-autorizacion/sujetos.asp');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'ARCA — Factura electrónica (emisión y autorización): the official CAE issuance and authorization service pages, still hosted on the afip.gob.ar domain after the 2024 AFIP-to-ARCA rebrand.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.afip.gob.ar/fe/emision-autorizacion/sujetos.asp';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'ARCA — Factura electrónica (emisión y autorización): las páginas oficiales del servicio de emisión y autorización de CAE, todavía alojadas en el dominio afip.gob.ar tras el cambio de nombre de AFIP a ARCA en 2024.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.afip.gob.ar/fe/emision-autorizacion/sujetos.asp';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'ARCA — Factura electrónica (emisión y autorización): die offiziellen Seiten für CAE-Ausstellung und -Autorisierung, nach der Umbenennung von AFIP zu ARCA 2024 weiterhin unter der Domain afip.gob.ar zu finden.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.afip.gob.ar/fe/emision-autorizacion/sujetos.asp';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'ARCA — Factura electrónica (emisión y autorización) : les pages officielles du service d''émission et d''autorisation du CAE, toujours hébergées sur le domaine afip.gob.ar après le changement de nom d''AFIP à ARCA en 2024.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.afip.gob.ar/fe/emision-autorizacion/sujetos.asp';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.arca.gob.ar/landing/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Argentina'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.arca.gob.ar/landing/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'ARCA — Agencia de Recaudación y Control Aduanero: the tax authority''s own institutional portal for general resolutions, news, and policy announcements.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.arca.gob.ar/landing/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'ARCA — Agencia de Recaudación y Control Aduanero: el portal institucional propio del organismo fiscal para resoluciones generales, novedades y anuncios de política tributaria.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.arca.gob.ar/landing/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'ARCA — Agencia de Recaudación y Control Aduanero: das eigene institutionelle Portal der Steuerbehörde für allgemeine Entschließungen, Neuigkeiten und politische Ankündigungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.arca.gob.ar/landing/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'ARCA — Agencia de Recaudación y Control Aduanero : le portail institutionnel propre de l''administration fiscale pour les résolutions générales, actualités et annonces de politique fiscale.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Argentina' AND ts.url = 'https://www.arca.gob.ar/landing/';
