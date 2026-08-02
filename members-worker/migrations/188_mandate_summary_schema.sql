-- Adds a dedicated top-of-page "mandate summary" tile field, separate from scope_intro.
-- Restores the pattern from the original static pages' .status-banner element (Spain,
-- UK, Ireland, US, Canada, Sweden all had one) as a purpose-built field applied to
-- every country, rather than overloading scope_intro (which remains the Transmission
-- Protocol section's intro line, unchanged in meaning). Nullable since existing rows
-- need backfilling per-country before the renderer can display it.
ALTER TABLE deep_dive_page_translations ADD COLUMN mandate_summary TEXT;
ALTER TABLE deep_dive_page_translations ADD COLUMN mandate_summary_icon TEXT;
