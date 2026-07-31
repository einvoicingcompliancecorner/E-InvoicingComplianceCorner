-- Adds the 5 per-section intro paragraphs missing from the original
-- Stage 4 schema -- a genuine content gap caught by comparing the
-- generated deep-dive page against the static original. Added to the
-- existing deep_dive_page_translations table rather than a new one,
-- since these are simple per-country-per-language text fields tied
-- 1:1 to the 5 fixed sections every deep-dive page has.
ALTER TABLE deep_dive_page_translations ADD COLUMN timeline_intro TEXT;
ALTER TABLE deep_dive_page_translations ADD COLUMN file_format_intro TEXT;
ALTER TABLE deep_dive_page_translations ADD COLUMN scope_intro TEXT;
ALTER TABLE deep_dive_page_translations ADD COLUMN steps_intro TEXT;
ALTER TABLE deep_dive_page_translations ADD COLUMN penalties_intro TEXT;
