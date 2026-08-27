-- Botswana: the two registrations the scaffolder does not write.
--
-- roi_complexity. The scaffolder omits the column entirely, so Botswana
-- arrived on its NOT NULL DEFAULT 'none' -- zero integrations in the ROI
-- planner, and permanently invisible to the weekly complexity review,
-- which only inspects countries rated 'simple'. Nothing in the replay
-- objects to that, which is why this file has to exist.
--
-- 'complex' on Dan's rule: is the tax authority a party to the
-- transaction? Botswana's electronic billing system has approved devices
-- transmitting receipt data directly to BURS, and the 2026 Budget Speech
-- describes real-time transaction monitoring. That is invoice-level data
-- reaching the authority, which is the definition -- the same reading
-- that puts Bulgaria, Latvia, Lithuania and Portugal in 'complex'
-- without a B2B exchange mandate between them.
--
-- eu_member is written explicitly rather than left to the default, so
-- the row states what it means instead of inheriting it.

UPDATE countries SET roi_complexity = 'complex', eu_member = 0 WHERE code = 'BW';

-- ---- tracking sources ----
--
-- Guarded on (country, url) rather than inserted blind: tracking_sources
-- has an autoincrement primary key, so a re-run of an unguarded INSERT
-- genuinely duplicates rows -- the Luxembourg 193 precedent.
--
-- BURS's own e-invoicing pages could not be fetched during research, so
-- these are the authority's live service portals plus the government news
-- agency, which is where every e-billing announcement to date has first
-- appeared. When BURS publishes a specification, that page belongs here
-- too.

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://burs.org.bw/', 0, 1 FROM countries c WHERE c.code = 'BW'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://burs.org.bw/');
INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://eservices.burs.org.bw/', 1, 1 FROM countries c WHERE c.code = 'BW'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://eservices.burs.org.bw/');
INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://dailynews.gov.bw/', 2, 1 FROM countries c WHERE c.code = 'BW'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://dailynews.gov.bw/');

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Botswana Unified Revenue Service — the authority that will operate the electronic billing system, and where its specification is expected to appear.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://burs.org.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Servicio Unificado de Ingresos de Botsuana — la autoridad que operará el sistema de facturación electrónica y donde se espera su especificación.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://burs.org.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Botswana Unified Revenue Service — die Behörde, die das E-Billing-System betreiben wird und bei der die Spezifikation erwartet wird.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://burs.org.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Botswana Unified Revenue Service — l''administration qui exploitera le système de facturation électronique et où la spécification est attendue.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://burs.org.bw/';

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'BURS e-Tax — the live filing and payment portal, and the front end the electronic billing system will sit alongside.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://eservices.burs.org.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'BURS e-Tax — el portal de declaración y pago en funcionamiento, junto al que se situará el sistema de facturación electrónica.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://eservices.burs.org.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'BURS e-Tax — das aktive Portal für Erklärungen und Zahlungen, neben dem das E-Billing-System stehen wird.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://eservices.burs.org.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'BURS e-Tax — le portail de déclaration et de paiement en service, auprès duquel viendra se placer le système de facturation électronique.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://eservices.burs.org.bw/';

INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Botswana Daily News — the government news agency, where every e-billing announcement so far has appeared before any adviser reported it.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://dailynews.gov.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Botswana Daily News — la agencia estatal de noticias, donde cada anuncio sobre facturación electrónica ha aparecido antes que en cualquier asesoría.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://dailynews.gov.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Botswana Daily News — die staatliche Nachrichtenagentur, in der bisher jede E-Billing-Ankündigung vor jeder Beraterquelle erschienen ist.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://dailynews.gov.bw/';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Botswana Daily News — l''agence de presse gouvernementale, où chaque annonce sur la facturation électronique a paru avant tout cabinet de conseil.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'BW' AND t.url = 'https://dailynews.gov.bw/';

-- ---- what this migration claims it did ----
-- ASSERT: SELECT roi_complexity FROM countries WHERE code = 'BW' = 'complex'
-- ASSERT: SELECT eu_member FROM countries WHERE code = 'BW' = 0
-- ASSERT: SELECT count(*) FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'BW') = 3
-- ASSERT: SELECT count(*) FROM tracking_source_translations WHERE source_id IN (SELECT id FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'BW')) = 12
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE slug IS NOT NULL AND id NOT IN (SELECT country_id FROM tracking_sources) = 0
