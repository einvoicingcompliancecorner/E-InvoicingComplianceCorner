-- ================================================================
-- The subscribe copy catches up with the product.
-- ================================================================
--
-- Dan, 24 August 2026, on the carousel's subscribe card and the perks
-- panel at the top left of the tracker.
--
-- Both were written before the ROI planner and the compliance guides
-- existed, and both still sold a newsletter and nothing else. The two
-- biggest things behind the subscription wall went unmentioned on the two
-- surfaces whose entire job is to say what is behind it.
--
-- ---- AND ONE CLAIM THE SITE COULD NOT STAND BEHIND -------------------
--
-- perks.item3 read "Priority access to new country deep dives as they're
-- published". Priority over whom? Every deep dive is a public page --
-- anyone can read /poland right now, with no account. The line promised
-- an exclusivity the site does not enforce and does not intend to.
--
-- It is replaced rather than reworded because there is no honest version
-- of it. perks.item4 went with it: "plain-language write-ups" largely
-- restated the digest and the archive listed above it.
--
-- The two lines that stay -- the digest and the archive -- are the two
-- that name something a non-subscriber genuinely cannot get. So do the
-- two replacing them. That is now true of every line in the panel, which
-- it was not before.
--
-- ---- WHAT IS NOT IN THIS FILE ---------------------------------------
--
-- The carousel's own sentence. carousel.subscribeDesc lives only in
-- i18n/<lang>.json and in a hardcoded desc: in the tracker's card array
-- -- it is one of the ~60 tracker keys never migrated to D1, the gap
-- generate_files.py reports every time it runs. Both surfaces are
-- patched by gen_subscribe_copy.py; neither is here. Migrating one key
-- of the carousel and not the rest would make that inconsistency harder
-- to notice rather than easier.
-- ================================================================

-- ---- the two replaced lines ------------------------------------------
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item3', 'en', 'The ROI planner — build the business case for your programme, with the working shown behind every number');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item3', 'de', 'Der ROI-Planer — untermauern Sie den Business Case für Ihr Programm, mit offengelegter Herleitung hinter jeder Zahl');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item3', 'fr', 'Le calculateur de ROI — bâtissez l''analyse de rentabilité de votre programme, avec le détail du calcul derrière chaque chiffre');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item3', 'es', 'El planificador de ROI — construya el caso de negocio de su programa, con el cálculo a la vista tras cada cifra');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item4', 'en', 'Country compliance guides — a printable one-page briefing for any market you pick');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item4', 'de', 'Länder-Compliance-Leitfäden — ein druckfertiges einseitiges Briefing für jeden gewählten Markt');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item4', 'fr', 'Guides de conformité par pays — une note d''une page prête à imprimer pour chaque marché choisi');
INSERT OR REPLACE INTO translations (namespace, key, lang, value)
  VALUES ('tracker', 'perks.item4', 'es', 'Guías de cumplimiento por país — un informe de una página listo para imprimir para cada mercado elegido');

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item3' = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item4' = 4

-- ROI SURVIVES TRANSLATION AND "COMPLIANCE" DOES NOT, which is the whole
-- reason these two are asserted differently. The first draft of this file
-- checked both keys for an English stem across all four languages and
-- failed at once: ROI is a loanword in German, French and Spanish alike
-- (ROI-Planer, calculateur de ROI, planificador de ROI), but compliance
-- becomes conformité and cumplimiento. Asserting an English word against
-- a translated string is a check that either passes by luck or fails for
-- the wrong reason -- so the content check is made against English, and
-- the other three are covered by the count above and by the
-- four-languages-or-none invariant below.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item3' AND value LIKE '%ROI%' = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key = 'perks.item4' AND lang = 'en' AND value LIKE 'Country compliance guides%' = 1

-- THE DIGEST AND THE ARCHIVE ARE UNTOUCHED, which is worth asserting
-- because "replace two of four" is exactly the edit that takes three by
-- accident.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key IN ('perks.item1','perks.item2') = 8

-- ---- and what must stay true afterwards -----------------------------

-- THE DEEP-DIVE CLAIM DOES NOT COME BACK, in any language. Stated for
-- all four because an English-only edit leaving German and Spanish
-- behind is this project's most repeated i18n failure -- it is why
-- jurisdiction-count.mjs exists.
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'tracker' AND key LIKE 'perks.item%' AND (value LIKE '%Priority access%' OR value LIKE '%Bevorzugten Zugang%' OR value LIKE '%accès prioritaire%' OR value LIKE '%Acceso prioritario%') = 0

-- AND ALL FOUR LINES EXIST IN ALL FOUR LANGUAGES.
-- ASSERT ALWAYS: SELECT count(*) FROM (SELECT key FROM translations WHERE namespace = 'tracker' AND key LIKE 'perks.%' GROUP BY key HAVING count(DISTINCT lang) != 4) = 0

