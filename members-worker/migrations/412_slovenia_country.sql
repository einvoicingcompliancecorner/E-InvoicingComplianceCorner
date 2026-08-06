-- Slovenia: country row + name translations. Hand-written following
-- new_country_scaffold.py's output shape; INSERT OR IGNORE throughout
-- (idempotent).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('SI', 'Slovenia', 'Europe', 'slovenia', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Slovenia' FROM countries WHERE code = 'SI';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Eslovenia' FROM countries WHERE code = 'SI';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Slowenien' FROM countries WHERE code = 'SI';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Slovénie' FROM countries WHERE code = 'SI';
