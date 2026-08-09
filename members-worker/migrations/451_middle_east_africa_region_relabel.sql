-- ================================================================
-- Relabel the "Middle East / North Africa" region to
-- "Middle East / Africa", per Dan's choice (7 Aug 2026) when adding
-- the site's first Sub-Saharan countries (Kenya #61, Nigeria #62 --
-- see migrations 452+). Dan picked widening the existing group over
-- creating a fifth "Africa" region, so the one group now covers the
-- whole continent plus the Middle East.
--
-- Mechanics identical to 297_middle_east_region_relabel.sql (the
-- "Middle East" -> "Middle East / North Africa" rename this site
-- already did on 3 Aug 2026, whose header explains the design): the
-- region string is both the lookup key in `translations`
-- (namespace='regions') and the raw display value on /sources, so
-- the canonical string itself is renamed in both places. The
-- matching static-file edits (countries.js, shared/map-data.mjs
-- incl. a southward-widened region zoom box, both workers' region
-- orderings, i18n/*.json, the tracker's vestigial DATA fallback)
-- ride in the same commit as this migration.
--
-- Both statements are safe to re-run -- the WHERE clauses stop
-- matching once applied.
-- ================================================================

UPDATE translations
SET key = 'Middle East / Africa', value = 'Middle East / Africa'
WHERE namespace = 'regions' AND key = 'Middle East / North Africa' AND lang = 'en';

UPDATE translations
SET key = 'Middle East / Africa', value = 'Oriente Medio / África'
WHERE namespace = 'regions' AND key = 'Middle East / North Africa' AND lang = 'es';

UPDATE translations
SET key = 'Middle East / Africa', value = 'Naher Osten / Afrika'
WHERE namespace = 'regions' AND key = 'Middle East / North Africa' AND lang = 'de';

UPDATE translations
SET key = 'Middle East / Africa', value = 'Moyen-Orient / Afrique'
WHERE namespace = 'regions' AND key = 'Middle East / North Africa' AND lang = 'fr';

UPDATE countries
SET region = 'Middle East / Africa'
WHERE region = 'Middle East / North Africa';
