-- ================================================================
-- Lithuania + Malta tracking sources for /sources, per
-- ADDING-A-COUNTRY.md step 4, following 469's exact pattern.
-- Includes each country's EC eInvoicing Country Factsheet (215's
-- bulk sweep predates both countries' existence on the site).
-- ================================================================

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://sabis.evaf.lt',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'LT'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://sabis.evaf.lt');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'SABIS — Lithuania''s national B2G e-invoicing platform.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://sabis.evaf.lt';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'SABIS — plataforma nacional lituana de facturación electrónica B2G.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://sabis.evaf.lt';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'SABIS — litauische nationale B2G-E-Invoicing-Plattform.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://sabis.evaf.lt';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'SABIS — plateforme nationale lituanienne de facturation électronique B2G.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://sabis.evaf.lt';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.vmi.lt/evmi/kokias-pvm-saskaitas-fakturas-privaloma-pateikti-pildant-i.saf-pvm-saskaitu-fakturu-registrus-',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'LT'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.vmi.lt/evmi/kokias-pvm-saskaitas-fakturas-privaloma-pateikti-pildant-i.saf-pvm-saskaitu-fakturu-registrus-');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'VMI (State Tax Inspectorate) — i.SAF VAT-ledger reporting explainer.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://www.vmi.lt/evmi/kokias-pvm-saskaitas-fakturas-privaloma-pateikti-pildant-i.saf-pvm-saskaitu-fakturu-registrus-';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'VMI (Inspección Estatal de Impuestos) — guía del sistema de registro de IVA i.SAF.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://www.vmi.lt/evmi/kokias-pvm-saskaitas-fakturas-privaloma-pateikti-pildant-i.saf-pvm-saskaitu-fakturu-registrus-';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'VMI (Staatliche Steuerinspektion) — Erklärseite zur i.SAF-Mehrwertsteuer-Meldung.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://www.vmi.lt/evmi/kokias-pvm-saskaitas-fakturas-privaloma-pateikti-pildant-i.saf-pvm-saskaitu-fakturu-registrus-';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'VMI (Inspection fiscale d''État) — page explicative du registre de TVA i.SAF.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://www.vmi.lt/evmi/kokias-pvm-saskaitas-fakturas-privaloma-pateikti-pildant-i.saf-pvm-saskaitu-fakturu-registrus-';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'LT'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'LT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'MT'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Malta Tax and Customs Administration (MTCA) — E-Invoicing and DRR.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Administración Tributaria y Aduanera de Malta (MTCA) — facturación electrónica y DRR.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Malta Tax and Customs Administration (MTCA) — E-Invoicing und DRR.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Administration fiscale et douanière de Malte (MTCA) — facturation électronique et DRR.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://finance.gov.mt/resources/einvoicing/',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'MT'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://finance.gov.mt/resources/einvoicing/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Ministry for Finance — e-Invoicing.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://finance.gov.mt/resources/einvoicing/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ministerio de Finanzas — facturación electrónica.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://finance.gov.mt/resources/einvoicing/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Finanzministerium — E-Rechnung.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://finance.gov.mt/resources/einvoicing/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Ministère des Finances — facturation électronique.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://finance.gov.mt/resources/einvoicing/';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983590/2025+Malta+2025+eInvoicing+Country+Sheet',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'MT'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983590/2025+Malta+2025+eInvoicing+Country+Sheet');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983590/2025+Malta+2025+eInvoicing+Country+Sheet';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983590/2025+Malta+2025+eInvoicing+Country+Sheet';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983590/2025+Malta+2025+eInvoicing+Country+Sheet';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'MT' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983590/2025+Malta+2025+eInvoicing+Country+Sheet';
