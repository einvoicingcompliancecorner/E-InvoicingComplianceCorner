-- Qatar + Bahrain: country rows + name translations (#67, #68).
-- Added to the existing 'Middle East / Africa' region. Evaluated
-- 10 Aug 2026 (see PROGRESS.md) -- both re-checked live, both still
-- lack any enacted e-invoicing mandate (Qatar: Cabinet-approved
-- DRAFT law only, 6 May 2026, not yet through Shura Council or
-- Amiri assent; Bahrain: no mandate proposal exists at all, only a
-- Nov 2023 procedural change removing prior-approval for voluntary
-- e-invoicing). Dan explicitly chose to build both anyway, clearly
-- caveated, rather than hold back a third time. Every milestone,
-- stat, and card below is written to state plainly what is NOT yet
-- true, not to imply a mandate that doesn't exist -- see 484/485's
-- headers for the full sourcing trail.

INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('QA', 'Qatar', 'Middle East / Africa', 'qatar', 1);
INSERT OR IGNORE INTO countries (code, name_en, region, slug, in_picker) VALUES ('BH', 'Bahrain', 'Middle East / Africa', 'bahrain', 1);

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Qatar' FROM countries WHERE code = 'QA';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Catar' FROM countries WHERE code = 'QA';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Katar' FROM countries WHERE code = 'QA';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Qatar' FROM countries WHERE code = 'QA';

INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'en', 'Bahrain' FROM countries WHERE code = 'BH';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'es', 'Baréin' FROM countries WHERE code = 'BH';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'de', 'Bahrain' FROM countries WHERE code = 'BH';
INSERT OR IGNORE INTO country_translations (country_id, lang, display_name) SELECT id, 'fr', 'Bahreïn' FROM countries WHERE code = 'BH';
