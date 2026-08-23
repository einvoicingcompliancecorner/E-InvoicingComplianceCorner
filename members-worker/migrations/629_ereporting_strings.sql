-- ================================================================
-- The words the e-Reporting card prints.
-- ================================================================
--
-- Dan, 23 August 2026: "frequency plus the system's name".
--
-- So the card's headline is a CADENCE, not a status: MONTHLY, REAL-TIME,
-- ON REQUEST. That is the thing a reader compares across markets and the
-- thing that decides what a finance team has to build -- the same
-- argument that made archiving print "7 yrs" rather than "REQUIRED".
--
-- Eleven keys in four languages. The system name -- JPK_V7M, myDATA,
-- SAF-T, D406 -- is NOT among them: it is a proper noun, it is what a
-- reader matches against their own portal, and it is stored once on the
-- fact rather than four times here.
--
-- LENGTH IS A CORRECTNESS CONSTRAINT, exactly as it was for the status
-- words in 610. The card is one sixth of the page. German reads ECHTZEIT
-- rather than the more literal IN ECHTZEIT because the longer form wraps
-- in the narrowest card and pushes the strip taller on every German
-- page, which the fitter then pays for by shrinking something else.
-- gen_ereporting_strings.py refuses to emit a value over 17 characters.
--
-- ON REQUEST is deliberately not "ON DEMAND": a reader should hear "if
-- they ask", not "whenever you like".
--
-- A SEPARATE FILE BECAUSE 609 AND 610 ARE DEPLOYED. apply_migrations
-- records a checksum per migration; editing an applied one makes the
-- chain lie about what the database has seen.
-- ================================================================

-- ---- the strings ----------------------------------------------------
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.none', 'en', 'NO MANDATE');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.none', 'de', 'KEINE PFLICHT');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.none', 'fr', 'AUCUNE OBLIGATION');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.none', 'es', 'SIN OBLIGACIÓN');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.planned', 'en', 'PLANNED');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.planned', 'de', 'GEPLANT');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.planned', 'fr', 'PRÉVU');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.er.planned', 'es', 'PREVISTO');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.annual', 'en', 'ANNUAL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.annual', 'de', 'JÄHRLICH');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.annual', 'fr', 'ANNUEL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.annual', 'es', 'ANUAL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.daily', 'en', 'DAILY');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.daily', 'de', 'TÄGLICH');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.daily', 'fr', 'QUOTIDIEN');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.daily', 'es', 'DIARIO');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.monthly', 'en', 'MONTHLY');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.monthly', 'de', 'MONATLICH');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.monthly', 'fr', 'MENSUEL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.monthly', 'es', 'MENSUAL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.near_real_time', 'en', 'NEAR REAL-TIME');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.near_real_time', 'de', 'NAHEZU ECHTZEIT');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.near_real_time', 'fr', 'QUASI TEMPS RÉEL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.near_real_time', 'es', 'CASI TIEMPO REAL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.on_request', 'en', 'ON REQUEST');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.on_request', 'de', 'AUF ANFRAGE');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.on_request', 'fr', 'SUR DEMANDE');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.on_request', 'es', 'A PETICIÓN');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.quarterly', 'en', 'QUARTERLY');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.quarterly', 'de', 'QUARTALSWEISE');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.quarterly', 'fr', 'TRIMESTRIEL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.quarterly', 'es', 'TRIMESTRAL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.real_time', 'en', 'REAL-TIME');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.real_time', 'de', 'ECHTZEIT');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.real_time', 'fr', 'TEMPS RÉEL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.real_time', 'es', 'TIEMPO REAL');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.varies', 'en', 'VARIES');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.varies', 'de', 'UNTERSCHIEDLICH');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.varies', 'fr', 'VARIABLE');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.freq.varies', 'es', 'VARIABLE');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.ereporting', 'en', 'E-reporting');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.ereporting', 'de', 'E-Reporting');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.ereporting', 'fr', 'E-reporting');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'guides.hl.lbl.ereporting', 'es', 'E-reporting');

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.hl.freq.%' = 32
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.%' = 332

-- ---- and what must stay true afterwards -----------------------------

-- FOUR LANGUAGES OR NONE, the invariant 609 declared for this subtree.
-- Restated at the level of the new keys because an English-only cadence
-- would render as English inside an otherwise German card, and the
-- COALESCE onto English means nothing would look broken.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.hl.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0

-- AND NO CADENCE WORD GROWS PAST THE CARD. 17 characters is where
-- QUARTALSWEISE sits and where the narrowest card stops fitting one line.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'guides.hl.freq.%' AND length(value) > 17 = 0

