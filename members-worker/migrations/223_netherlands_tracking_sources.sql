-- Netherlands tracking sources -- caught retroactively: the /sources
-- page (214) was seeded from deep_dive_portals before Netherlands
-- existed, so its portals never made it into tracking_sources despite
-- being added in 219. Also adds the EC eInvoicing Country Factsheet
-- (Netherlands wasn't yet tracked when 215 ran the factsheet sweep).
-- This gap is why adding tracking sources is now its own explicit
-- runbook step (see ADDING-A-COUNTRY.md) rather than something that
-- happens implicitly via a one-time seed.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.logius.nl/onze-dienstverlening/gegevensuitwisseling/e-factureren',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Netherlands'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.logius.nl/onze-dienstverlening/gegevensuitwisseling/e-factureren');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Logius — e-Factureren'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/gegevensuitwisseling/e-factureren';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Logius — e-Factureren'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/gegevensuitwisseling/e-factureren';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Logius — E-Rechnung (e-Factureren)'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/gegevensuitwisseling/e-factureren';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Logius — e-Factureren'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/gegevensuitwisseling/e-factureren';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.logius.nl/onze-dienstverlening/domeinen/gegevensuitwisseling/peppol',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Netherlands'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.logius.nl/onze-dienstverlening/domeinen/gegevensuitwisseling/peppol');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Netherlands Peppol Authority'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/domeinen/gegevensuitwisseling/peppol';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Autoridad Peppol de los Países Bajos'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/domeinen/gegevensuitwisseling/peppol';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Niederländische Peppol-Behörde'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/domeinen/gegevensuitwisseling/peppol';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Autorité Peppol des Pays-Bas'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://www.logius.nl/onze-dienstverlening/domeinen/gegevensuitwisseling/peppol';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Netherlands'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Netherlands' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands';
