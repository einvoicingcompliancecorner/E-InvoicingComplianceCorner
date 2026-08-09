-- Kenya + Nigeria: country rows + name translations. The site's
-- first Sub-Saharan countries (#61 and #62), placed in the newly
-- renamed 'Middle East / Africa' region (see 451 -- Dan chose
-- widening the existing group over a fifth region, 7 Aug 2026).
-- Hand-written following new_country_scaffold.py's output shape;
-- INSERT OR IGNORE throughout (idempotent).

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('KE', 'Kenya', 'Middle East / Africa', 'kenya', 1);
INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('NG', 'Nigeria', 'Middle East / Africa', 'nigeria', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Kenya' FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Kenia' FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Kenia' FROM countries WHERE code = 'KE';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Kenya' FROM countries WHERE code = 'KE';

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Nigeria' FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Nigeria' FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Nigeria' FROM countries WHERE code = 'NG';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Nigéria' FROM countries WHERE code = 'NG';
