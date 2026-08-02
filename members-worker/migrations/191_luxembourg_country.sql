-- Luxembourg country row + name translations (new country, Stage 4 from the start).
INSERT INTO countries (code, name_en, region) VALUES ('LU', 'Luxembourg', 'Europe');
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'en', 'Luxembourg' FROM countries WHERE code = 'LU';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'es', 'Luxemburgo' FROM countries WHERE code = 'LU';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'de', 'Luxemburg' FROM countries WHERE code = 'LU';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'fr', 'Luxembourg' FROM countries WHERE code = 'LU';
