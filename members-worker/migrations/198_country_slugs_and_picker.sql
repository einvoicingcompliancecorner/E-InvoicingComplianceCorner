-- Adds two columns to countries, completing D1's coverage of country
-- data so members-worker's three hardcoded duplicates
-- (COUNTRIES_BY_REGION, COUNTRY_NAME_TRANSLATIONS,
-- COUNTRY_DEEP_DIVE_SLUGS) can be deleted in favor of querying D1:
--
--   slug       The country's deep-dive page path on the public site
--              (e.g. 'spain' -> e-invoicingcompliancecorner.com/spain).
--              Values copied VERBATIM from the hand-maintained map in
--              shared/deep-dive-render.mjs -- not derived, since several
--              are abbreviations (uae, uk) rather than a mechanical
--              lowercase-and-hyphenate of the name. NULL means "no
--              deep-dive page exists" (European Union), and consumers
--              must skip rendering a link rather than building a broken
--              one -- same contract the old hardcoded map's missing-key
--              behaviour had.
--
--   in_picker  1 (default) = a real, selectable jurisdiction offered in
--              the subscribe page's and preferences page's
--              country-of-interest checklists. 0 = an umbrella tagging
--              entity that stories can be tagged with but that isn't
--              offered as a picker option -- exactly one row today:
--              European Union (see 007_add_european_union.sql, which
--              added it for EU-wide ViDA/DRR story tagging while
--              deliberately keeping it out of countries.js's picker).
--              A semantic flag here beats every consumer hardcoding
--              "WHERE name_en != 'European Union'".
--
-- IMPORTANT deploy ordering: this migration must run against remote D1
-- BEFORE the members-worker deploy that queries these columns, or the
-- preferences/issue pages will 500 on "no such column".

ALTER TABLE countries ADD COLUMN slug TEXT;
ALTER TABLE countries ADD COLUMN in_picker INTEGER NOT NULL DEFAULT 1;

UPDATE countries SET slug = 'australia'     WHERE name_en = 'Australia';
UPDATE countries SET slug = 'belgium'       WHERE name_en = 'Belgium';
UPDATE countries SET slug = 'brazil'        WHERE name_en = 'Brazil';
UPDATE countries SET slug = 'canada'        WHERE name_en = 'Canada';
UPDATE countries SET slug = 'chile'         WHERE name_en = 'Chile';
UPDATE countries SET slug = 'china'         WHERE name_en = 'China';
UPDATE countries SET slug = 'croatia'       WHERE name_en = 'Croatia';
UPDATE countries SET slug = 'denmark'       WHERE name_en = 'Denmark';
UPDATE countries SET slug = 'finland'       WHERE name_en = 'Finland';
UPDATE countries SET slug = 'france'        WHERE name_en = 'France';
UPDATE countries SET slug = 'germany'       WHERE name_en = 'Germany';
UPDATE countries SET slug = 'india'         WHERE name_en = 'India';
UPDATE countries SET slug = 'ireland'       WHERE name_en = 'Ireland';
UPDATE countries SET slug = 'italy'         WHERE name_en = 'Italy';
UPDATE countries SET slug = 'luxembourg'    WHERE name_en = 'Luxembourg';
UPDATE countries SET slug = 'malaysia'      WHERE name_en = 'Malaysia';
UPDATE countries SET slug = 'mexico'        WHERE name_en = 'Mexico';
UPDATE countries SET slug = 'new-zealand'   WHERE name_en = 'New Zealand';
UPDATE countries SET slug = 'norway'        WHERE name_en = 'Norway';
UPDATE countries SET slug = 'peru'          WHERE name_en = 'Peru';
UPDATE countries SET slug = 'poland'        WHERE name_en = 'Poland';
UPDATE countries SET slug = 'portugal'      WHERE name_en = 'Portugal';
UPDATE countries SET slug = 'romania'       WHERE name_en = 'Romania';
UPDATE countries SET slug = 'saudi-arabia'  WHERE name_en = 'Saudi Arabia';
UPDATE countries SET slug = 'singapore'     WHERE name_en = 'Singapore';
UPDATE countries SET slug = 'slovakia'      WHERE name_en = 'Slovakia';
UPDATE countries SET slug = 'spain'         WHERE name_en = 'Spain';
UPDATE countries SET slug = 'sweden'        WHERE name_en = 'Sweden';
UPDATE countries SET slug = 'uae'           WHERE name_en = 'United Arab Emirates';
UPDATE countries SET slug = 'uk'            WHERE name_en = 'United Kingdom';
UPDATE countries SET slug = 'united-states' WHERE name_en = 'United States';

UPDATE countries SET in_picker = 0 WHERE code = 'EU';
