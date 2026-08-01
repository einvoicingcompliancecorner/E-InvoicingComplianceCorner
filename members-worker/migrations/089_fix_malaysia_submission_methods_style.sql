-- Targeted fix: Malaysia's lifecycle cards (082) were already applied
-- before the display_style column existed (088 adds it with a 'pills'
-- default), so the edit made directly to 082's source file doesn't
-- retroactively apply to the live database. This sets "Submission
-- methods" specifically to the list style it actually needs.
UPDATE deep_dive_lifecycle_cards
SET display_style = 'list'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Malaysia')
  AND sort_order = 0
  AND section = 'scope_transmission';
