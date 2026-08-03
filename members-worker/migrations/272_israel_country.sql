-- Israel: country row + name translations. Generated in the same
-- shape as new_country_scaffold.py's output; INSERT OR IGNORE
-- throughout (idempotent).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('IL', 'Israel', 'Middle East', 'israel', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Israel' FROM countries WHERE code = 'IL';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Israel' FROM countries WHERE code = 'IL';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Israel' FROM countries WHERE code = 'IL';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Israël' FROM countries WHERE code = 'IL';
