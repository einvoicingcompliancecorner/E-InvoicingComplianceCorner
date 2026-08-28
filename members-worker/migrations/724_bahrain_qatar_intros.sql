-- Bahrain and Qatar: section-02 intros trimmed into the framework band.
--
-- Qatar's ran to 90 words against a 35-word maximum, and Bahrain's to 38.
-- Both were on the backlog for it, so neither was failing anything -- but
-- migration 721 gave each of them a Format & standard card that says, in
-- rows, exactly what the intro was saying in prose. Two statements of one
-- fact, one immediately above the other.
--
-- That is the first thing Dan reported on 27 August, in his own words: "we
-- already have a highlighted summary further down, so I'm conscious that
-- this description is duplicative." Adding the spine cards to these two
-- pages created a fresh instance of it, which is a good reason to fix the
-- intros now rather than leave them on a list.
--
-- The new intros say what the SECTION is for and stop. The facts live in
-- the cards, where a reader can compare them against another country.
--
-- Both leave the backlog with this migration.

UPDATE deep_dive_page_translations SET file_format_intro =
  'There is no e-invoicing specification to build against. What follows is what Bahraini VAT law asks of an invoice and of the records behind it, mandate or no mandate.'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE code = 'BH');
UPDATE deep_dive_page_translations SET file_format_intro =
  'No hay especificación de facturación electrónica contra la que construir. Lo que sigue es lo que la ley del IVA bareiní exige de una factura y de los registros que la respaldan, haya obligación o no.'
 WHERE lang = 'es' AND country_id = (SELECT id FROM countries WHERE code = 'BH');
UPDATE deep_dive_page_translations SET file_format_intro =
  'Es gibt keine E-Invoicing-Spezifikation, gegen die man bauen könnte. Es folgt, was das bahrainische Umsatzsteuerrecht von einer Rechnung und den dahinterliegenden Aufzeichnungen verlangt, mit oder ohne Pflicht.'
 WHERE lang = 'de' AND country_id = (SELECT id FROM countries WHERE code = 'BH');
UPDATE deep_dive_page_translations SET file_format_intro =
  'Il n''existe aucune spécification de facturation électronique contre laquelle développer. Voici ce que la loi TVA bahreïnie exige d''une facture et des registres qui la sous-tendent, obligation ou non.'
 WHERE lang = 'fr' AND country_id = (SELECT id FROM countries WHERE code = 'BH');

UPDATE deep_dive_page_translations SET file_format_intro =
  'Nothing has been published to build against. What follows is what Qatari law asks of an invoice and a set of books today, with no VAT and no enacted e-invoicing regime.'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE code = 'QA');
UPDATE deep_dive_page_translations SET file_format_intro =
  'No se ha publicado nada contra lo que construir. Lo que sigue es lo que la ley catarí exige hoy de una factura y de unos libros, sin IVA y sin régimen de facturación electrónica promulgado.'
 WHERE lang = 'es' AND country_id = (SELECT id FROM countries WHERE code = 'QA');
UPDATE deep_dive_page_translations SET file_format_intro =
  'Es wurde nichts veröffentlicht, wogegen man bauen könnte. Es folgt, was katarisches Recht heute von einer Rechnung und von Büchern verlangt, ohne Mehrwertsteuer und ohne in Kraft gesetztes E-Invoicing-Regime.'
 WHERE lang = 'de' AND country_id = (SELECT id FROM countries WHERE code = 'QA');
UPDATE deep_dive_page_translations SET file_format_intro =
  'Rien n''a été publié contre quoi développer. Voici ce que le droit qatari exige aujourd''hui d''une facture et de livres comptables, sans TVA et sans régime de facturation électronique promulgué.'
 WHERE lang = 'fr' AND country_id = (SELECT id FROM countries WHERE code = 'QA');

-- ---- what this migration claims it did ----
-- Both English intros now sit inside the framework's 14-35 word band.
-- ASSERT: SELECT count(*) FROM deep_dive_page_translations t JOIN countries c ON c.id = t.country_id WHERE c.code IN ('BH','QA') AND t.lang = 'en' AND (length(t.file_format_intro) - length(replace(t.file_format_intro, ' ', '')) + 1) BETWEEN 14 AND 35 = 2
-- And the translations stay inside the 1.5x allowance the framework gives
-- them, which is 52 words.
-- ASSERT: SELECT count(*) FROM deep_dive_page_translations t JOIN countries c ON c.id = t.country_id WHERE c.code IN ('BH','QA') AND (length(t.file_format_intro) - length(replace(t.file_format_intro, ' ', '')) + 1) > 52 = 0
-- Neither intro repeats the card beneath it: the phrase the old ones led
-- with is gone from both.
-- ASSERT: SELECT count(*) FROM deep_dive_page_translations t JOIN countries c ON c.id = t.country_id WHERE c.code IN ('BH','QA') AND t.lang = 'en' AND t.file_format_intro LIKE '%schema%' = 0
