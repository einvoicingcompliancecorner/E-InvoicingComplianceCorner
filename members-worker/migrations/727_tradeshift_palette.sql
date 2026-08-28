-- Partner branding phase two: Tradeshift's palette, and their own lockups.
--
-- Everything here is read out of the brand template Dan supplied on 28
-- August -- ppt/theme/theme1.xml ("Tradeshift Master Template", scheme
-- "Custom 3") and slides 8, 9, 13 and 29 of the deck. Nothing came from a
-- third-party brand site; public sources had no usable hex values and
-- tradeshift.com redirect-loops for the fetch tool.
--
-- IT IS A LIGHT THEME, WHICH IS THE FAITHFUL READING. Their brand is a
-- white field with near-black type and one saturated blue. Taking their
-- colours onto this site's dark ground was measured first and failed: the
-- alert pill, their Go red on their master blue, comes out at 2.08:1
-- against a 3:1 floor, and that is the colour this site uses to say a
-- penalty applies. Dan chose light on 28 August.
--
-- WHAT IS THEIRS AND WHAT IS NOT. The ground, the raised surface, the
-- hairline, both text colours, the master blue, and Engage and Go at
-- their published dark steps are verbatim. --live and --upcoming are
-- DERIVED: Buy mint reads 2.52:1 as text on white at its darkest
-- published step and Pay cyan 3.02:1, so neither can carry a status
-- label. Both hold their own hue and were taken down until they cleared
-- the floor. The pale -dim tints are derived too. Whoever signs this off
-- should be told which half is which.
--
-- THE ROWS ARE GENERATED FROM shared/palette.mjs and this file must not
-- be hand-edited: tests/palette.mjs asserts the table and the module
-- agree, so an edit here without one there fails the suite.

-- ---- the lockups, from their own template ----
-- The deck carries the wordmark as transparent PNG in blue, white and
-- black, all 1683x270 trimmed. That is 6.23:1, not the 6.09:1 of the file
-- sent earlier and shipped in migration 725: these carry the (R) and that
-- one did not. mark_light is finally non-null -- it is the reverse lockup
-- that phase one recorded as missing, and it is theirs rather than the
-- inversion I made for the mock-up.
UPDATE partners SET mark_dark = 'images/partners/tradeshift-dark.png',
                    mark_light = 'images/partners/tradeshift-light.png'
 WHERE slug = 'tradeshift';

-- ---- the palette ----
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--ink', '#f9f9f9' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--ink-2', '#ffffff' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--ink-3', '#f0f0f0' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--line', '#e3e3e3' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--text-lo', '#1e1e1e' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--muted', '#5c5c5c' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--paper', '#ffffff' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--paper-2', '#f9f9f9' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--paper-line', '#e3e3e3' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--card-ink', '#1e1e1e' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--card-key', '#5c5c5c' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--accent', '#0a37f0' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--live', '#0d8162' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--live-dim', '#e2faf2' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--live-ink', '#0b5c45' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--soon', '#a36416' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--soon-dim', '#fdefdd' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--soon-ink', '#7a4a10' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--stamp', '#bf263c' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--stamp-dim', '#fde8eb' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--stamp-ink', '#8f1c2d' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--upcoming', '#007c96' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--upcoming-dim', '#e2f4f9' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--upcoming-ink', '#0b5c6e' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--neutral-dim', '#f0f0f0' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--neutral-ink', '#5c5c5c' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--nomandate', '#8a5a75' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--nomandate-dim', '#f6ecf2' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--nomandate-ink', '#6b4159' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--tracked', '#4a5568' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--tracked-dim', '#eef0f3' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--tracked-ink', '#3a4351' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--on-stamp', '#ffffff' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--on-soon', '#ffffff' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--flap-ink', '#1e1e1e' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--flap-alert', '#8f1c2d' FROM partners WHERE slug = 'tradeshift';
-- ---- what this migration claims it did ----
-- Tradeshift now has a light-ground palette, and it is complete: 36
-- properties, the same set shared/palette.mjs defines for the theme.
-- ASSERT: SELECT count(*) FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' = 36
-- The ground is their off-white and the primary text their near-black,
-- both verbatim from theme1.xml.
-- ASSERT: SELECT value FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' AND pp.prop = '--ink' = '#f9f9f9'
-- ASSERT: SELECT value FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' AND pp.prop = '--text-lo' = '#1e1e1e'
-- And the master brand blue is present exactly as their slide 8 gives it.
-- ASSERT: SELECT value FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' AND pp.prop = '--accent' = '#0a37f0'
-- Both lockups are now set, which is what closes the phase-one blocker.
-- ASSERT: SELECT count(*) FROM partners WHERE slug = 'tradeshift' AND mark_light IS NOT NULL AND mark_dark LIKE '%tradeshift-dark.png' = 1
--
-- ---- and what must stay true ----
-- A partner that has any palette rows at all has a COMPLETE one. A theme
-- applied from a partial palette inherits the rest of the default, which
-- on a light ground means dark-theme text on a light surface -- invisible,
-- and invisible only for that partner's readers, which is the hardest
-- kind of defect to hear about.
--
-- WRITTEN SELF-RELATIVELY, AND THAT IS AN EDIT MADE ON 28 AUGUST after
-- this file had already been applied. It first read `HAVING n <> 36`,
-- and migration 728 -- which adds the side-menu and menu-button
-- properties Dan asked for -- takes every partner to 43. A standing
-- invariant that hardcodes a count is one that has to be edited every
-- time the palette legitimately grows, and editing an applied migration
-- is the thing the checksum drift warning exists to catch.
--
-- So it now says what it always meant: no partner may hold FEWER
-- properties than the partner that holds the most. That is true at 36, at
-- 43, and at whatever comes next, and it still fails on the case it was
-- written for -- a partner registered with half a palette.
--
-- Because this file changed after running, `apply_migrations.py` will
-- report 727 as drifted. That is correct and expected; clear it with
--   python3 apply_migrations.py --remote --refresh-checksums
-- which records that a person looked, and nothing more.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT partner_id FROM partner_palette GROUP BY partner_id HAVING count(*) < (SELECT max(c) FROM (SELECT count(*) AS c FROM partner_palette GROUP BY partner_id))) = 0
-- Every value is a six-digit hex. A stray CSS keyword would apply
-- silently and theme one property wrongly.
-- ASSERT ALWAYS: SELECT count(*) FROM partner_palette WHERE value NOT GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]' = 0
