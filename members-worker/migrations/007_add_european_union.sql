-- Adds "European Union" as a genuine 29th row in countries — not one of
-- the 28 selectable options in countries.js (the subscribe page's own
-- country-of-interest picker, correctly unchanged), but a real entity
-- referenced by three actual DATA array entries in the main tracker
-- (eu-transpose, eu-drr, eu-align — EU-wide ViDA/DRR milestones,
-- distinct from any single member state). Caught by compare_generated.py
-- finding this exact gap during the file-generation proof step.
INSERT INTO countries (code, name_en, region) VALUES ('EU', 'European Union', 'Europe');

INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'en', 'European Union' FROM countries WHERE code = 'EU';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'es', 'Unión Europea' FROM countries WHERE code = 'EU';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'de', 'Europäische Union' FROM countries WHERE code = 'EU';
INSERT INTO country_translations (country_id, lang, display_name)
  SELECT id, 'fr', 'Union européenne' FROM countries WHERE code = 'EU';
