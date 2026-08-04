-- Colombia tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. DIAN's own e-invoicing system
-- microsite and its dedicated normativa (regulations) page. Colombia
-- is not an EU member, so no EC factsheet entry.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Colombia'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'DIAN -- Sistema de Facturación Electrónica: the tax authority''s own microsite for the electronic invoicing system, covering enrollment, RADIAN, free invoicing, and compliance calendars.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'DIAN -- Sistema de Facturación Electrónica: el micrositio propio de la autoridad fiscal para el sistema de facturación electrónica, que cubre inscripción, RADIAN, facturación gratuita y calendarios de cumplimiento.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'DIAN -- Sistema de Facturación Electrónica: die eigene Microsite der Steuerbehörde für das System der elektronischen Rechnungsstellung, mit Registrierung, RADIAN, kostenloser Rechnungsstellung und Compliance-Kalendern.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'DIAN -- Sistema de Facturación Electrónica : le microsite propre de l''administration fiscale pour le système de facturation électronique, couvrant l''inscription, RADIAN, la facturation gratuite et les calendriers de conformité.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/normatividad/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Colombia'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/normatividad/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'DIAN -- Normativa de facturación electrónica: the official regulatory page listing every resolution, decree, and technical annex governing Colombia''s e-invoicing system.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/normatividad/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'DIAN -- Normativa de facturación electrónica: la página regulatoria oficial que enumera cada resolución, decreto y anexo técnico que rige el sistema de facturación electrónica de Colombia.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/normatividad/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'DIAN -- Normativa de facturación electrónica: die offizielle Vorschriftenseite mit jeder Resolution, jedem Dekret und jedem technischen Anhang, die Kolumbiens System der elektronischen Rechnungsstellung regeln.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/normatividad/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'DIAN -- Normativa de facturación electrónica : la page réglementaire officielle répertoriant chaque résolution, décret et annexe technique régissant le système de facturation électronique de la Colombie.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Colombia' AND ts.url = 'https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/normatividad/';
