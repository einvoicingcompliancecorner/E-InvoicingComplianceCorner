-- Adds Portugal as a new country: D1's countries/country_translations
-- tables, which now power the tracker's and subscribe page's generated
-- countryNames blocks (via generate_files.py) as well as the newsletter
-- archive's own country-tag display and deep-dive-link rendering.
-- "Portugal" is identical in EN/ES/DE/FR — no translation needed beyond
-- the identity mapping.
INSERT INTO countries (code, name_en, region) VALUES ('PT', 'Portugal', 'Europe');

INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'en', 'Portugal' FROM countries WHERE code = 'PT';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'es', 'Portugal' FROM countries WHERE code = 'PT';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'de', 'Portugal' FROM countries WHERE code = 'PT';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'fr', 'Portugal' FROM countries WHERE code = 'PT';
