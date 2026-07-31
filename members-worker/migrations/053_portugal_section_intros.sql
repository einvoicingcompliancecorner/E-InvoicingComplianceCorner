-- Backfill the 5 section-intro paragraphs for Portugal, extracted
-- directly from the static portugal.html.
UPDATE deep_dive_page_translations
SET
  timeline_intro = 'Portugal''s regime is genuinely unusual among the countries in this tracker: there''s still no general B2B or B2C e-invoicing mandate, but a dense layer of certified-software, security, and reporting requirements applies to every invoice regardless — and a real structured-format mandate exists for public-sector supply.',
  file_format_intro = 'Portugal runs two genuinely separate tracks: a real structured-format mandate for B2G, and a lighter-touch security-and-traceability regime that applies to everything else.',
  scope_intro = 'The single most important thing to understand about Portugal: there is no clearance step, and no general transmission mandate outside B2G — enforcement instead relies on certified software and reporting, not real-time validation.',
  steps_intro = 'Compliance here means working through several independent, layered requirements — not a single registration step.',
  penalties_intro = 'Portugal''s enforcement model works differently from a clearance-model country''s fine schedule — the real risk is an invoice being treated as invalid outright, not a graduated penalty for late compliance.'
WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Portugal') AND lang = 'en';
