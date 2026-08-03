-- EC eInvoicing Country Factsheets added as tracking sources for the
-- 13 tracked European countries that didn't already carry them
-- (Belgium, Germany, and Luxembourg's seeded sources were already this
-- factsheet -- skipped). The Commission maintains these per-country
-- pages (B2G/B2B legal framework, operating model, CIUS, real-time
-- reporting status) and updates them annually plus ad hoc -- a genuine
-- announcement-bearing source, distinct from national portals.
-- Idempotent: NOT EXISTS guards on (country, url); translations via
-- INSERT OR IGNORE. sort_order appends after existing sources.

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Croatia'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Croatia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Croatia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Croatia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Croatia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108882/eInvoicing+in+Denmark',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Denmark'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108882/eInvoicing+in+Denmark');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Denmark' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108882/eInvoicing+in+Denmark';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Denmark' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108882/eInvoicing+in+Denmark';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Denmark' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108882/eInvoicing+in+Denmark';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Denmark' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108882/eInvoicing+in+Denmark';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108884/eInvoicing+in+Finland',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Finland'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108884/eInvoicing+in+Finland');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Finland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108884/eInvoicing+in+Finland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Finland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108884/eInvoicing+in+Finland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Finland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108884/eInvoicing+in+Finland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Finland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108884/eInvoicing+in+Finland';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108885/eInvoicing+in+France',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'France'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108885/eInvoicing+in+France');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108885/eInvoicing+in+France';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108885/eInvoicing+in+France';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108885/eInvoicing+in+France';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'France' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108885/eInvoicing+in+France';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108889/eInvoicing+in+Ireland',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Ireland'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108889/eInvoicing+in+Ireland');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ireland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108889/eInvoicing+in+Ireland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ireland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108889/eInvoicing+in+Ireland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ireland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108889/eInvoicing+in+Ireland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Ireland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108889/eInvoicing+in+Ireland';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Italy'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Italy' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Italy' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Italy' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Italy' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108896/eInvoicing+in+Poland',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Poland'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108896/eInvoicing+in+Poland');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Poland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108896/eInvoicing+in+Poland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Poland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108896/eInvoicing+in+Poland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Poland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108896/eInvoicing+in+Poland';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Poland' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108896/eInvoicing+in+Poland';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108897/eInvoicing+in+Portugal',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Portugal'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108897/eInvoicing+in+Portugal');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Portugal' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108897/eInvoicing+in+Portugal';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Portugal' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108897/eInvoicing+in+Portugal';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Portugal' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108897/eInvoicing+in+Portugal';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Portugal' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108897/eInvoicing+in+Portugal';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108898/eInvoicing+in+Romania',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Romania'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108898/eInvoicing+in+Romania');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Romania' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108898/eInvoicing+in+Romania';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Romania' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108898/eInvoicing+in+Romania';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Romania' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108898/eInvoicing+in+Romania';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Romania' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108898/eInvoicing+in+Romania';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108899/eInvoicing+in+Slovakia',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Slovakia'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108899/eInvoicing+in+Slovakia');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Slovakia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108899/eInvoicing+in+Slovakia';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Slovakia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108899/eInvoicing+in+Slovakia';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Slovakia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108899/eInvoicing+in+Slovakia';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Slovakia' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108899/eInvoicing+in+Slovakia';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108901/eInvoicing+in+Spain',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Spain'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108901/eInvoicing+in+Spain');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Spain' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108901/eInvoicing+in+Spain';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Spain' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108901/eInvoicing+in+Spain';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Spain' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108901/eInvoicing+in+Spain';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Spain' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108901/eInvoicing+in+Spain';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108902/eInvoicing+in+Sweden',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Sweden'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108902/eInvoicing+in+Sweden');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Sweden' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108902/eInvoicing+in+Sweden';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Sweden' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108902/eInvoicing+in+Sweden';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Sweden' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108902/eInvoicing+in+Sweden';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Sweden' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108902/eInvoicing+in+Sweden';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108905/eInvoicing+in+Norway',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.name_en = 'Norway'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108905/eInvoicing+in+Norway');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'European Commission eInvoicing Country Factsheet'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Norway' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108905/eInvoicing+in+Norway';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Ficha país de facturación electrónica de la Comisión Europea'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Norway' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108905/eInvoicing+in+Norway';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'eInvoicing-Länderfactsheet der Europäischen Kommission'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Norway' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108905/eInvoicing+in+Norway';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Fiche pays sur la facturation électronique de la Commission européenne'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.name_en = 'Norway' AND ts.url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108905/eInvoicing+in+Norway';
