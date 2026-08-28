-- The side menu and the menu buttons carry Tradeshift's blue.
--
-- Dan, 28 August: "please can you change the side menu back-colour to be
-- #242DC2, for only the side menu entitled Country Compliance
-- Legislation. The text colour should be white" -- and then "can you also
-- change the Menu boxes entitled Resources, Education and Menu to have
-- the same colour".
--
-- #242DC2 IS HIS VALUE, NOT THE TEMPLATE'S, and that distinction is worth
-- keeping visible. Tradeshift's master brand blue is #0a37f0 (theme1.xml,
-- slide 8). This is a deeper one he specified directly. Everything else
-- in this theme is traceable to the brand file; this is not, and it
-- belongs on the list of things to confirm with whoever owns the brand,
-- alongside the derived greens in 727.
--
-- WHY SEVEN PROPERTIES AND NOT TWO. The side menu draws five things: a
-- ground, primary text, the region headings, the eyebrow and hover
-- accent, and its rules. Before this it borrowed the page's --ink-2,
-- --text-lo, --muted, --soon and --line, which is fine while the menu and
-- the page are the same colour and wrong the moment they are not: the
-- light theme's --muted is #5c5c5c, which is 1.9:1 on this blue --
-- unreadable, and unreadable inside one component only, which is the
-- hardest kind of defect to notice. Each now has its own name, and
-- tests/palette.mjs measures each against the ground it actually sits on.
--
-- The two nav properties are separate from the five sidebar ones even
-- though this theme sets them to the same blue. They are separate
-- components; a later partner may want them different. Equal here, and
-- each measured on its own.
--
-- GENERATED FROM shared/palette.mjs -- do not hand-edit. tests/palette.mjs
-- asserts the table and the module agree.

INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--sidebar', '#242dc2' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--sidebar-ink', '#ffffff' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--sidebar-muted', '#c7ccf5' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--sidebar-accent', '#ffd9a3' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--sidebar-line', '#4a52d4' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--nav', '#242dc2' FROM partners WHERE slug = 'tradeshift';
INSERT OR REPLACE INTO partner_palette (partner_id, prop, value)
  SELECT id, '--nav-ink', '#ffffff' FROM partners WHERE slug = 'tradeshift';
-- ---- what this migration claims it did ----
-- Tradeshift's palette is now 43 properties, seven more than 727 left it.
-- ASSERT: SELECT count(*) FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' = 43
-- The side menu and the menu buttons carry the value Dan gave, and they
-- carry the SAME one -- he asked for them to match.
-- ASSERT: SELECT value FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' AND pp.prop = '--sidebar' = '#242dc2'
-- ASSERT: SELECT value FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' AND pp.prop = '--nav' = '#242dc2'
-- ASSERT: SELECT count(*) FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' AND pp.prop IN ('--sidebar','--nav') AND pp.value = '#242dc2' = 2
-- Both carry white text, which is what he asked for and what measures
-- 9.42:1 against that blue.
-- ASSERT: SELECT count(*) FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug = 'tradeshift' AND pp.prop IN ('--sidebar-ink','--nav-ink') AND pp.value = '#ffffff' = 2
--
-- ---- and what must stay true ----
-- The default theme has no rows here at all. It is the :root block, not a
-- partner, and a row claiming to theme it would be applied by nothing and
-- believed by the next person to read the table.
-- ASSERT ALWAYS: SELECT count(*) FROM partner_palette pp JOIN partners p ON p.id = pp.partner_id WHERE p.slug NOT IN (SELECT slug FROM partners WHERE active = 1) = 0
