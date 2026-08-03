-- Jordan: country row + name translations. Generated in the same
-- shape as new_country_scaffold.py's output; INSERT OR IGNORE
-- throughout (idempotent).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('JO', 'Jordan', 'Middle East', 'jordan', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Jordan' FROM countries WHERE code = 'JO';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Jordania' FROM countries WHERE code = 'JO';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Jordanien' FROM countries WHERE code = 'JO';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Jordanie' FROM countries WHERE code = 'JO';
