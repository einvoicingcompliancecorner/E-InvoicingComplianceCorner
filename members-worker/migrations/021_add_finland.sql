-- Adds Finland as a new country: D1's countries/country_translations
-- tables, powering the tracker's/subscribe page's generated
-- countryNames blocks (via generate_files.py) and the newsletter
-- archive's country-tag display and deep-dive-link rendering.
INSERT INTO countries (code, name_en, region) VALUES ('FI', 'Finland', 'Europe');

INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'en', 'Finland' FROM countries WHERE code = 'FI';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'es', 'Finlandia' FROM countries WHERE code = 'FI';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'de', 'Finnland' FROM countries WHERE code = 'FI';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'fr', 'Finlande' FROM countries WHERE code = 'FI';
