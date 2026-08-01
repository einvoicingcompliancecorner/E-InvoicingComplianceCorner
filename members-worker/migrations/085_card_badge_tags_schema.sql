-- Adds optional inline badge tags to card titles (e.g. "Confirmed" /
-- "Pending Budget 2026"), needed for the UK's page where this distinction
-- is central to the whole narrative and appears on multiple cards.
-- Nullable -- most countries' cards won't use this at all.
ALTER TABLE deep_dive_card_translations ADD COLUMN badge_label TEXT;
ALTER TABLE deep_dive_card_translations ADD COLUMN badge_type TEXT;
