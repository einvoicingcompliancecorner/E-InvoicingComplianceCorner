-- ================================================================
-- Kenya + Nigeria tracking sources for /sources, per
-- ADDING-A-COUNTRY.md step 4, following 447/448's exact pattern.
-- Kenya: both official KRA pages (fetched live this session).
-- Nigeria: the official e-invoice portal (existence confirmed via
-- search-indexed subpages; the site itself blocked automated
-- fetching this round) plus the Thomson Reuters/Pagero dated update
-- log as the industry fallback -- flagged as such in its
-- description, per the house sourcing standard.
-- ================================================================

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.kra.go.ke/news-center/public-notices',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'KE'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.kra.go.ke/news-center/public-notices');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Kenya Revenue Authority — public notices, where every eTIMS deadline, extension and enforcement change is announced first.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/news-center/public-notices';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Autoridad Tributaria de Kenia (KRA) — avisos públicos, donde se anuncian primero todos los plazos, prórrogas y cambios de aplicación de eTIMS.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/news-center/public-notices';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Kenia Revenue Authority (KRA) — öffentliche Bekanntmachungen, in denen jede eTIMS-Frist, Verlängerung und Durchsetzungsänderung zuerst angekündigt wird.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/news-center/public-notices';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Kenya Revenue Authority (KRA) — avis publics, où chaque échéance, prolongation et changement d''application d''eTIMS est annoncé en premier.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/news-center/public-notices';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'KE'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'KRA eTIMS FAQ — the authority''s own current statement of scope, solution channels, exemptions and onboarding rules.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'FAQ de eTIMS de la KRA — la exposición oficial y actualizada del alcance, los canales de solución, las exenciones y las reglas de incorporación.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'KRA-eTIMS-FAQ — die offizielle, aktuelle Darstellung von Geltungsbereich, Lösungskanälen, Ausnahmen und Onboarding-Regeln.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'FAQ eTIMS de la KRA — l''exposé officiel et à jour du périmètre, des canaux de solution, des exemptions et des règles d''intégration.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'KE' AND ts.url = 'https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://einvoice.firs.gov.ng',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'NG'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://einvoice.firs.gov.ng');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'FIRS/NRS e-invoicing portal — the official Merchant Buyer Solution site for onboarding, guidance and stakeholder announcements.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://einvoice.firs.gov.ng';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Portal de facturación electrónica del FIRS/NRS — el sitio oficial del Merchant Buyer Solution para la incorporación, las guías y los anuncios a las partes interesadas.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://einvoice.firs.gov.ng';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'E-Invoicing-Portal des FIRS/NRS — die offizielle Merchant-Buyer-Solution-Website für Onboarding, Leitfäden und Ankündigungen.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://einvoice.firs.gov.ng';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Portail de facturation électronique du FIRS/NRS — le site officiel du Merchant Buyer Solution pour l''intégration, les guides et les annonces.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://einvoice.firs.gov.ng';

INSERT INTO tracking_sources (country_id, url, sort_order)
SELECT c.id, 'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria',
       (SELECT COALESCE(MAX(ts2.sort_order), -1) + 1 FROM tracking_sources ts2 WHERE ts2.country_id = c.id)
FROM countries c
WHERE c.code = 'NG'
  AND NOT EXISTS (SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'en', 'Thomson Reuters (Pagero) Nigeria regulatory update log — a dated, industry-maintained record of every NRS e-invoicing announcement; industry source, used because the official portals block automated monitoring.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'es', 'Registro de novedades regulatorias de Nigeria de Thomson Reuters (Pagero) — un historial fechado, mantenido por la industria, de cada anuncio de facturación electrónica del NRS; fuente del sector, usada porque los portales oficiales bloquean el monitoreo automatizado.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'de', 'Thomson-Reuters-(Pagero-)Regulierungsprotokoll für Nigeria — eine datierte, branchengepflegte Chronik jeder E-Invoicing-Ankündigung des NRS; Branchenquelle, genutzt, weil die offiziellen Portale automatisiertes Monitoring blockieren.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria';
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT ts.id, 'fr', 'Journal des mises à jour réglementaires Nigéria de Thomson Reuters (Pagero) — un historique daté, tenu par le secteur, de chaque annonce du NRS en matière de facturation électronique ; source sectorielle, utilisée parce que les portails officiels bloquent la surveillance automatisée.'
FROM tracking_sources ts JOIN countries c ON c.id = ts.country_id
WHERE c.code = 'NG' AND ts.url = 'https://europe.thomsonreuters.com/compliance/regulatory-updates/nigeria';
