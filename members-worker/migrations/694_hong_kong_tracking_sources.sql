-- Hong Kong: tracking sources for /sources and the weekly monitor.
--
-- Guarded on (country, url): tracking_sources has an autoincrement key
-- and an unguarded re-run duplicates rows -- the Luxembourg 193 precedent.
--
-- WHAT WOULD ACTUALLY CHANGE THIS COUNTRY, in order. The IRD's e-filing
-- pages are first because the only live obligation lives there and the
-- announced phases past the first are still unnamed. The e-Procurement
-- terms are second because the B2G answer is VOLUNTARY on the strength
-- of one clause in them, so the clause is the thing to watch. The
-- Financial Secretary's Budget is third, and it is here for the negative:
-- Hong Kong has no consumption tax, and the day that changes is the day
-- every empty box on this page needs rewriting.

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.ird.gov.hk/eng/tax/bus_ixbrl.htm', 0, 1 FROM countries c WHERE c.code = 'HK' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.ird.gov.hk/eng/tax/bus_ixbrl.htm');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'Inland Revenue Department — iXBRL and profits tax e-filing. Phase one is live and no later phase has been named; this page is where one would appear.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Departamento de Hacienda: iXBRL y declaración electrónica del impuesto de sociedades. La fase uno está viva y no se ha anunciado ninguna posterior.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Steuerbehörde — iXBRL und elektronische Gewinnsteuererklärung. Phase eins läuft; eine spätere Phase ist nicht benannt und erschiene zuerst hier.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 0;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Administration fiscale — iXBRL et télédéclaration de l''impôt sur les bénéfices. La phase un est en vigueur ; aucune phase ultérieure n''est nommée.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 0;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.gov.hk/en/theme/eprocurement/terms/', 1, 1 FROM countries c WHERE c.code = 'HK' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.gov.hk/en/theme/eprocurement/terms/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'The e-Procurement Programme''s participation terms. Clause 2.6 is why this country reads VOLUNTARY rather than ACTIVE; if it goes, the status moves.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Condiciones del Programa de Contratación Electrónica. La cláusula 2.6 es la razón de que este país figure como VOLUNTARIO y no ACTIVO.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Teilnahmebedingungen des e-Procurement-Programms. Ziffer 2.6 ist der Grund, warum dieses Land FREIWILLIG und nicht AKTIV zeigt.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 1;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Conditions de participation au programme e-Procurement. La clause 2.6 explique pourquoi ce pays affiche FACULTATIF et non ACTIF.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 1;

INSERT INTO tracking_sources (country_id, url, sort_order, active)
SELECT c.id, 'https://www.budget.gov.hk/', 2, 1 FROM countries c WHERE c.code = 'HK' AND NOT EXISTS (
  SELECT 1 FROM tracking_sources t WHERE t.country_id = c.id AND t.url = 'https://www.budget.gov.hk/');
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'en', 'The Financial Secretary''s Budget. Watched for the negative: Hong Kong has no consumption tax, and the day it acquires one, every box on this page changes.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'es', 'Presupuesto del Secretario de Finanzas. Se vigila en negativo: Hong Kong no tiene impuesto al consumo, y el día que lo tenga cambia toda esta página.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'de', 'Budget des Finanzsekretärs. Beobachtet wird das Ausbleiben: Hongkong hat keine Verbrauchsteuer, und mit ihr änderte sich jedes Feld dieser Seite.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 2;
INSERT OR IGNORE INTO tracking_source_translations (source_id, lang, description)
SELECT t.id, 'fr', 'Le Budget du Secrétaire aux finances. Surveillé en creux : Hong Kong n''a pas d''impôt sur la consommation, et le jour où il en aura, tout change.'
  FROM tracking_sources t JOIN countries c ON c.id = t.country_id WHERE c.code = 'HK' AND t.sort_order = 2;

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'HK') = 3
-- ASSERT: SELECT count(*) FROM tracking_source_translations WHERE source_id IN (SELECT id FROM tracking_sources WHERE country_id = (SELECT id FROM countries WHERE code = 'HK')) = 12
-- ASSERT ALWAYS: SELECT count(*) FROM countries WHERE slug IS NOT NULL AND id NOT IN (SELECT country_id FROM tracking_sources) = 0
