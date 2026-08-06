-- Iceland: country row + name translations. Hand-written following
-- new_country_scaffold.py's output shape; INSERT OR IGNORE throughout
-- (idempotent). Region 'Europe' matches the existing precedent set by
-- Norway (also EEA/EFTA, not EU) rather than creating a new region.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('IS', 'Iceland', 'Europe', 'iceland', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Iceland' FROM countries WHERE code = 'IS';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Islandia' FROM countries WHERE code = 'IS';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Island' FROM countries WHERE code = 'IS';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Islande' FROM countries WHERE code = 'IS';
