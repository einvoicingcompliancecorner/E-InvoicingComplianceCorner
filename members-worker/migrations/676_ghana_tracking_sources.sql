-- Ghana: tracking sources for /sources and the weekly monitor.
--
-- Guarded on (country, url): tracking_sources has an autoincrement
-- primary key and an unguarded re-run genuinely duplicates rows -- the
-- Luxembourg 193 precedent.
--
-- The support desk is here deliberately. Ghana's operational rules --
-- the 24-hour transmission cycle, what happens when a system stays
-- offline -- are published there and not in the formal guidelines, and
-- a change to them would be a change to what compliance costs.

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://gra.gov.gh/e-services/e-vat/', 0, 1 FROM countries c WHERE c.code = 'GH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://gra.gov.gh/e-services/e-vat/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'GRA E-VAT — the authority''s own page on the Certified Invoicing System, and where guidance on it is published.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'E-VAT de la GRA: la página de la propia administración sobre el Sistema Certificado de Facturación y su orientación.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'GRA E-VAT — die Seite der Behörde zum zertifizierten Rechnungssystem und zu den Hinweisen dazu.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'GRA E-VAT — la page de l''administration sur le système certifié de facturation et les orientations qui s''y rapportent.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 0;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://gra.gov.gh/practice-notes/', 1, 1 FROM countries c WHERE c.code = 'GH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://gra.gov.gh/practice-notes/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'GRA practice notes and administrative guidelines — where the E-VAT guidelines and the Act 1151 VAT guidelines appear.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Notas de práctica y directrices administrativas de la GRA: allí aparecen las directrices de E-VAT y las de la Ley 1151.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Praxishinweise und Verwaltungsrichtlinien der GRA — dort erscheinen die E-VAT-Richtlinien und jene zum Gesetz 1151.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Notes de pratique et directives administratives de la GRA — où paraissent les directives E-VAT et celles de la loi 1151.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 1;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://evatgra.zendesk.com/hc/en-us/', 2, 1 FROM countries c WHERE c.code = 'GH' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://evatgra.zendesk.com/hc/en-us/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'The GRA''s E-VAT support desk — operational detail on integration and transmission that the guidelines do not carry.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Servicio de soporte E-VAT de la GRA: detalle operativo sobre integración y transmisión que las directrices no recogen.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Der E-VAT-Support der GRA — operative Details zu Integration und Übertragung, die in den Richtlinien fehlen.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Le support E-VAT de la GRA — le détail opérationnel sur l''intégration et la transmission absent des directives.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'GH' AND t.sort_order = 2;

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'GH') = 3
-- ASSERT: SELECT count(*) FROM tracking_source_translations WHERE source_id IN (SELECT id FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'GH')) = 12
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE slug IS NOT NULL AND id NOT IN (SELECT country_id FROM tracking_sources) = 0
