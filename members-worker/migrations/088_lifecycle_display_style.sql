-- Adds a per-card display style flag: pills (default) work well for
-- short single-word labels, but genuinely look bad -- overflowing, or
-- awkwardly tall if wrapped -- for longer phrases. Malaysia's
-- "Submission methods" card has long labels ("Manual entry via
-- MyInvois Portal") that need a plain list instead, while its
-- "Validation lifecycle" card (short labels: New, Processing...) is
-- fine as pills, same as France's and Poland's cards.
ALTER TABLE deep_dive_lifecycle_cards ADD COLUMN display_style TEXT NOT NULL DEFAULT 'pills';
