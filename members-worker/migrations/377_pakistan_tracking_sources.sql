-- Pakistan tracking sources for /sources -- built now, per
-- ADDING-A-COUNTRY.md's step 4. FBR's Digital Invoicing technical
-- assistance page (the taxpayer-facing integration/IRIS resource) and
-- FBR's general site (SROs, regulatory notifications, the broader
-- Digital Invoicing framework). Pakistan is not an EU/EEA member, so no
-- EC eInvoicing factsheet is added, matching the Indonesia precedent
-- (362).

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://fbr.gov.pk/di-technical-assistance/173967/173970',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Pakistan'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://fbr.gov.pk/di-technical-assistance/173967/173970');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'FBR Digital Invoicing — technical assistance, integration guidance, and IRIS portal access at the heart of Pakistan''s real-time e-invoice clearance system.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/di-technical-assistance/173967/173970';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Facturación Digital de la FBR — asistencia técnica, orientación de integración y acceso al portal IRIS, en el núcleo del sistema de clearance de facturación electrónica en tiempo real de Pakistán.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/di-technical-assistance/173967/173970';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'FBR Digital Invoicing — technische Unterstützung, Integrationsanleitung und Zugang zum IRIS-Portal, im Zentrum von Pakistans Echtzeit-E-Rechnungs-Freigabesystem.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/di-technical-assistance/173967/173970';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'FBR Digital Invoicing — assistance technique, orientation à l''intégration et accès au portail IRIS, au cœur du système de dédouanement des factures électroniques en temps réel du Pakistan.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/di-technical-assistance/173967/173970';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://fbr.gov.pk/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Pakistan'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://fbr.gov.pk/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Federal Board of Revenue (FBR) — the general site, covering SROs (including 28(I)/2024, 69(I)/2025, 709(I)/2025, and 1852(I)/2025), regulatory notifications, and sales-tax rules generally.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Junta Federal de Ingresos (FBR) — el sitio general, que cubre las SRO (incluidas 28(I)/2024, 69(I)/2025, 709(I)/2025 y 1852(I)/2025), las notificaciones regulatorias y las normas del impuesto sobre las ventas en general.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Federal Board of Revenue (FBR) — die allgemeine Website, die SROs (einschließlich 28(I)/2024, 69(I)/2025, 709(I)/2025 und 1852(I)/2025), behördliche Bekanntmachungen und die Umsatzsteuervorschriften im Allgemeinen abdeckt.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Federal Board of Revenue (FBR) — le site général, couvrant les SRO (dont 28(I)/2024, 69(I)/2025, 709(I)/2025 et 1852(I)/2025), les notifications réglementaires et les règles de la taxe sur les ventes en général.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Pakistan' AND ts.url = 'https://fbr.gov.pk/';
