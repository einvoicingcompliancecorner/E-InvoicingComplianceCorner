-- ================================================================
-- Bulgaria + Estonia tracking sources for /sources, per
-- ADDING-A-COUNTRY.md step 4, following 447/448/462's exact
-- pattern. Includes each country's EC eInvoicing Country Factsheet
-- (215's bulk sweep predates both countries' existence on the
-- site, so -- as with the Netherlands -- they must be added here
-- explicitly).
-- ================================================================

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www2.aop.bg/en/home/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'BG'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www2.aop.bg/en/home/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Public Procurement Agency (PPA) — official home of CAIS EPP, Bulgaria''s B2G e-invoicing platform.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://www2.aop.bg/en/home/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Agencia de Contratación Pública (PPA) — sede oficial de CAIS EPP, la plataforma búlgara de facturación electrónica B2G.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://www2.aop.bg/en/home/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Agentur für öffentliche Auftragsvergabe (PPA) — offizieller Sitz von CAIS EPP, Bulgariens B2G-E-Invoicing-Plattform.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://www2.aop.bg/en/home/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Agence des marchés publics (PPA) — site officiel de CAIS EPP, la plateforme bulgare de facturation électronique B2G.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://www2.aop.bg/en/home/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://portal.nra.bg/details/saft',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'BG'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://portal.nra.bg/details/saft');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'National Revenue Agency (NRA) — SAF-T standard audit file for tax page.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://portal.nra.bg/details/saft';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Agencia Nacional de Ingresos (NRA) — página del archivo normalizado de auditoría fiscal (SAF-T).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://portal.nra.bg/details/saft';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Nationale Einnahmenagentur (NRA) — Seite zum Standard Audit File for Tax (SAF-T).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://portal.nra.bg/details/saft';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Agence nationale des recettes (NRA) — page du fichier normalisé d''audit fiscal (SAF-T).'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://portal.nra.bg/details/saft';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'BG'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'BG' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108878/eInvoicing+in+Bulgaria';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'EE'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministry of Finance (Rahandusministeerium) — accounting source documents & e-invoices.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Finanzas (Rahandusministeerium) — documentos contables básicos y facturas electrónicas.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Finanzministerium (Rahandusministeerium) — Buchführungsbelege und E-Rechnungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministère des Finances (Rahandusministeerium) — pièces comptables justificatives et factures électroniques.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'EE'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'EE' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410';
