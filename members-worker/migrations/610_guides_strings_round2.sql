-- ================================================================
-- The strings the three-card headline strip needs.
-- ================================================================
--
-- Dan, 22 August 2026: "from a section arrangement standard - we should
-- only have 5 boxes / cards at the top of the page. We can combine B2G,
-- B2B and B2C into one card."
--
-- The three business segments became rows inside one card, so the card
-- needs a title and each row needs a short label. Plus a singular form
-- for the timeline's hidden-milestone note, which now counts what is
-- actually still hidden rather than what the window left out -- the
-- fitter reveals earlier milestones one at a time.
--
-- A SEPARATE FILE BECAUSE 609 IS DEPLOYED. apply_migrations records a
-- checksum per migration; editing an applied one makes the chain lie
-- about what the database has seen. New strings, new file, every time.

-- ---- the strings ----------------------------------------------------
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.mandate', 'en', 'E-invoicing mandate');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.mandate', 'de', 'E-Rechnungspflicht');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.mandate', 'fr', 'Obligation de facturation');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.mandate', 'es', 'Mandato de factura-e');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2b', 'en', 'B2B');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2b', 'de', 'B2B');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2b', 'fr', 'B2B');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2b', 'es', 'B2B');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2c', 'en', 'B2C');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2c', 'de', 'B2C');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2c', 'fr', 'B2C');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2c', 'es', 'B2C');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2g', 'en', 'B2G');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2g', 'de', 'B2G');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2g', 'fr', 'B2G');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.seg.b2g', 'es', 'B2G');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.tl.hiddenOne', 'en', '1 earlier milestone is on the full deep dive.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.tl.hiddenOne', 'de', '1 früherer Meilenstein steht im vollständigen Deep Dive.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.tl.hiddenOne', 'fr', '1 jalon antérieur figure dans le deep dive complet.');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.tl.hiddenOne', 'es', '1 hito anterior está en el análisis a fondo completo.');

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.%' = 288
--
-- The four-languages-or-none invariant declared in 609 covers these too,
-- and is the reason this file cannot ship an English-only key.

