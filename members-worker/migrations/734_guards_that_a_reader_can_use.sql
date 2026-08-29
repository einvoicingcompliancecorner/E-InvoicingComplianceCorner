-- The model's guards stop arguing with the document they print into.
--
-- Dan, 29 August 2026, on the first PDF to carry the flag bodies:
--
--   "The reasoning section seems to openly contradict the business case
--    output -- 'Payback under one month. No e-invoicing programme pays
--    back that fast. Check the volumes and the per-invoice costs -- one
--    of them is out by an order of magnitude, and the rest of this page
--    inherits it.'"
--
-- He is right, and the sentence is wrong twice over.
--
-- IT NAMES THE WRONG FIELDS. His document: implementation 10,000 (one
-- simple integration), platform 60,000, running 30,000, gross saving
-- 253,169. Payback divides the ONE-OFF by the annual saving NET of
-- recurring cost -- 10,000 / 163,169 * 12 = 0.74 months. Nothing in the
-- volumes or the per-invoice costs is out by a factor of ten. The
-- pressure is entirely in the one-off, and the one-off was cImplS
-- sitting at its shipped placeholder.
--
-- IT IS WRITTEN TO THE WRONG READER. "Check the volumes and the
-- per-invoice costs" is an instruction to the person entering numbers,
-- which is exactly right in a collapsed panel on screen and useless in a
-- board pack, where the reader cannot act on it and reads it instead as
-- the document disowning its own headline. Until 733 only the bolded
-- headline reached page one; the bodies stayed on screen. Printing them
-- is what exposed this.
--
-- THE GUARD ALSO STOPS FIRING when the implementation cost driving it is
-- still ours rather than the reader's -- that change is in
-- shared/roi-render.mjs, not here. A payback computed from a placeholder
-- is not yet a claim about anyone's programme, and the placeholder
-- warning already says so in the right words.
--
-- guard.zeroInt IS IN THE SAME FAMILY and is corrected here too: "treat
-- every figure below as unsafe" was true of a panel and false of page
-- one, where the figures it means are the tiles ABOVE the note. Copy
-- written for one surface, shipped to two.

-- ---- the payback guard, in the reader's voice ----
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'guard.payback', 'en', '<strong>Payback under one month.</strong> This is payback on the one-off implementation cost, with the recurring platform and running costs already taken out of the annual saving &mdash; so a small implementation against a large saving does pay back in weeks. It is not payback on total year-one cost, which is the longer figure most finance functions expect, and which the year-one tile above gives you.'),
  ('roi', 'guard.payback', 'de', '<strong>Amortisation in unter einem Monat.</strong> Dies ist die Amortisation der einmaligen Implementierungskosten; die laufenden Plattform- und Betriebskosten sind bereits von der j&auml;hrlichen Einsparung abgezogen &mdash; eine kleine Implementierung amortisiert sich gegen&uuml;ber einer gro&szlig;en Einsparung tats&auml;chlich in Wochen. Es ist nicht die Amortisation der gesamten Kosten des ersten Jahres, der l&auml;ngeren Kennzahl, die die meisten Finanzbereiche erwarten und die die Kachel zum ersten Jahr oben ausweist.'),
  ('roi', 'guard.payback', 'es', '<strong>Amortizaci&oacute;n en menos de un mes.</strong> Es la amortizaci&oacute;n del coste puntual de implantaci&oacute;n; los costes recurrentes de plataforma y operaci&oacute;n ya se han restado del ahorro anual, de modo que una implantaci&oacute;n peque&ntilde;a frente a un ahorro grande s&iacute; se amortiza en semanas. No es la amortizaci&oacute;n del coste total del primer a&ntilde;o, la cifra m&aacute;s larga que espera la mayor&iacute;a de las funciones financieras y que ofrece la casilla del primer a&ntilde;o de arriba.'),
  ('roi', 'guard.payback', 'fr', '<strong>Retour sur investissement en moins d''un mois.</strong> Il s''agit du retour sur le co&ucirc;t ponctuel de mise en &oelig;uvre ; les co&ucirc;ts r&eacute;currents de plateforme et d''exploitation sont d&eacute;j&agrave; d&eacute;duits de l''&eacute;conomie annuelle &mdash; une mise en &oelig;uvre modeste face &agrave; une &eacute;conomie importante se rembourse effectivement en quelques semaines. Ce n''est pas le retour sur le co&ucirc;t total de la premi&egrave;re ann&eacute;e, le chiffre plus long qu''attendent la plupart des directions financi&egrave;res et que donne la tuile de premi&egrave;re ann&eacute;e ci-dessus.');

-- ---- and the one that said "below" to a reader holding page one ----
UPDATE translations
   SET value = replace(value, 'every figure below as unsafe', 'every figure on this page as unsafe')
 WHERE namespace = 'roi' AND key IN ('guard.zeroInt.one', 'guard.zeroInt.other')
   AND value LIKE '%every figure below as unsafe%';

UPDATE translations
   SET value = replace(value, 'jede Zahl unten als unsicher', 'jede Zahl auf dieser Seite als unsicher')
 WHERE namespace = 'roi' AND key IN ('guard.zeroInt.one', 'guard.zeroInt.other');

-- ---- what this migration claims it did ----
-- The payback guard exists in all four languages and no longer tells a
-- reader to go and check their inputs.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'guard.payback' = 4
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'guard.payback' AND (value LIKE '%order of magnitude%' OR value LIKE '%Check the volumes%') = 0
--
-- The English body names what actually drives the figure.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'guard.payback' AND lang = 'en' AND value LIKE '%one-off implementation cost%' = 1
--
-- No guard body still points "below" at figures that print above it.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key LIKE 'guard.%' AND value LIKE '%figure below%' = 0
--
-- STANDING: a guard body may not instruct the reader to edit the model.
--
-- These sentences print into a PDF a reader cannot change, so an
-- imperative aimed at the person operating the tool arrives as the
-- document contradicting itself. Written against every guard key and
-- every language rather than the one Dan caught, because the next guard
-- will be authored on screen exactly like this one was. The markers are
-- the second person paired with a verb of correction, in the four
-- languages the site ships.
-- ASSERT ALWAYS: SELECT COUNT(*) FROM (SELECT key FROM translations WHERE namespace = 'roi' AND key LIKE 'guard.%' AND (value LIKE '%Check the volumes%' OR value LIKE '%Check your%' OR value LIKE '%Pr&uuml;fen Sie Ihre%' OR value LIKE '%Prüfen Sie Ihre%' OR value LIKE '%Revise sus%' OR value LIKE '%V&eacute;rifiez vos%' OR value LIKE '%Vérifiez vos%')) = 0
