-- France: incorporate DGFiP's official practical e-invoicing guide
-- (guide_pratique_facturation_electronique.pdf) into the deep-dive.
-- Sharpens the existing "Legal basis" penalty card with the specific
-- CGI Article 1737 IV bis three-month-notice citation, and adds a new
-- penalties_related card carrying the guide's own verbatim quote on
-- non-electronic invoices remaining valid during the startup phase.
-- English only; ES/DE/FR follow in 387.

UPDATE deep_dive_pages SET last_updated = '2026-08-05' WHERE country_id = (SELECT id FROM countries WHERE name_en = 'France');

UPDATE deep_dive_card_translations
SET body = 'Article 123 of Law No. 2026-103 (19 February 2026) amends CGI Articles 289 bis, 289 E, 290, 1737 and 1788 D — 1737 covers per-invoice non-compliance, 1788 D covers e-reporting violations, and Article 1737 IV bis specifically requires a three-month formal notice before any penalty for non-reception can apply. This is the citation to check if you need the primary source rather than a summary.'
WHERE lang = 'en' AND card_id = (
  SELECT dc.id FROM deep_dive_cards dc
  JOIN countries c ON c.id = dc.country_id
  JOIN deep_dive_card_translations dct ON dct.card_id = dc.id AND dct.lang = 'en'
  WHERE c.name_en = 'France' AND dc.section = 'penalties_related' AND dct.title = '📎 Legal basis'
);

INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 3 FROM countries WHERE name_en = 'France';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '📄 DGFiP''s own written guidance', NULL, NULL, 'DGFiP''s official practical guide is explicit on this point: "Une facture reçue par mail, PDF ou papier ne doit pas être écartée au seul motif qu''elle n''a pas été transmise par le circuit électronique attendu" — a PDF, email, or paper invoice must not be rejected solely because it didn''t arrive through the expected electronic channel, as long as it reflects a genuine transaction and carries the required information. The guide sets out three explicit conditions for this tolerance: the legal deadline itself isn''t moving, the alternative channel must be a genuine stopgap rather than a settled workaround, and the business must be able to show an active, demonstrable trajectory toward full compliance.');
