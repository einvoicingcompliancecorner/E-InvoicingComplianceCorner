-- Dynamic tracker (Stage 5): three new columns on milestones so D1 can
-- fully describe the tracker board's DATA entries, not just the
-- deep-dive timelines:
--
--   on_tracker  1 = this milestone appears as a card on the main
--               tracker board. Backfilled (202) to exactly the 79
--               entries in the static DATA array, so the dynamic board
--               is identical to the static one. The other ~137
--               milestones (deep-dive timeline entries, incl. all
--               anchors) stay 0 and never render on the board.
--   portals     JSON array of {label, url} official-source links
--               rendered as buttons on the milestone's board card.
--               Every current tracker entry has at least one. NULL for
--               non-tracker milestones.
--   confidence  'expected' renders the "Expected -- not final" badge on
--               the board card (12 entries today, e.g. announced-but-
--               unlegislated dates). NULL otherwise.

ALTER TABLE milestones ADD COLUMN on_tracker INTEGER NOT NULL DEFAULT 0;
ALTER TABLE milestones ADD COLUMN portals TEXT;
ALTER TABLE milestones ADD COLUMN confidence TEXT;
