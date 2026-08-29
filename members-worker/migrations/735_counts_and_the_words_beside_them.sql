-- Every remaining count printed against a word that has to agree with it.
--
-- Dan asked for "the count and noun fixes" after 733 fixed two of them.
-- Sweeping the renderer for a placeholder next to a noun or a verb found
-- seven candidates. FIVE ARE REAL and are fixed here; two cannot print a
-- one at all and are left alone. The three shapes among the five:
--
--   the noun     "1 jurisdictions in scope", "1 weeks: 3 Mar to 10 Mar"
--   the verb     "1 of your jurisdictions PUBLISH a schedule"
--   both         "1 of 1 waves BACK-PLAN to a start date ..."
--
-- The verb ones are the reason three of these are sentence pairs rather
-- than word pairs. In "{0} of your jurisdictions publish", the subject is
-- the COUNT, not the noun after "of" -- one jurisdiction publishes -- so
-- the agreement reaches past the noun and the whole sentence has to move.
-- Same shape as res.nearest3 and pdf.undatedNote.
--
-- TWO CANDIDATES ARE NOT DEFECTS AND ARE NOT TOUCHED.
--
-- chart.acrossLanes reads " across {0} lanes", but renders only when
-- lanes > 1 AND the wave holds more than one jurisdiction, and its value
-- is the minimum of those two -- so it cannot print 1.
--
-- countries.count reads "{0} jurisdictions in scope" and I DID change it,
-- wrote the migration rows, and then broke the check that was supposed to
-- prove it: the check passed with the defect reinstated. NAME_LIMIT is 9,
-- so the picker names the countries individually below ten and only
-- reaches this string at ten or more. "1 jurisdictions" cannot be
-- rendered. The change was reverted, including its four translation rows.
--
-- Both are recorded here rather than quietly skipped, because the next
-- person to sweep for this pattern will find them again. A fix to an
-- unreachable case is a change with no evidence behind it.
--
-- THE FOUR CHART TOOLTIPS LOSE A WORD RATHER THAN GAINING A SLOT. The
-- count and its noun are now assembled in the renderer and passed
-- through the placeholder that was already there, so arity is unchanged
-- and the translated sentences need a deletion instead of a rewrite --
-- which also keeps migration 561's standing invariant on chart.blockTip's
-- four placeholders true. The four noun forms are handled in one
-- statement each because the surrounding words differ per language and
-- the noun does not.

-- ---- the word itself ----
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'word.week',  'en', 'week'),    ('roi', 'word.weeks', 'en', 'weeks'),
  ('roi', 'word.week',  'de', 'Woche'),   ('roi', 'word.weeks', 'de', 'Wochen'),
  ('roi', 'word.week',  'es', 'semana'),  ('roi', 'word.weeks', 'es', 'semanas'),
  ('roi', 'word.week',  'fr', 'semaine'), ('roi', 'word.weeks', 'fr', 'semaines');

-- ---- the tooltips, minus the noun they hardcoded ----
UPDATE translations
   SET value = replace(replace(replace(replace(value,
         '{1} weeks', '{1}'), '{1} Wochen', '{1}'), '{1} semanas', '{1}'), '{1} semaines', '{1}')
 WHERE namespace = 'roi' AND key IN ('chart.progTip', 'chart.blockTip');

UPDATE translations
   SET value = replace(replace(replace(replace(value,
         '{0} weeks', '{0}'), '{0} Wochen', '{0}'), '{0} semanas', '{0}'), '{0} semaines', '{0}')
 WHERE namespace = 'roi' AND key IN ('chart.discRowTip', 'chart.segWeeks');

-- ---- "publishes" / "publish", on the results page and in the PDF ----
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'basis.penalty.just1', 'en', '{0} of your jurisdictions publishes a quantified penalty schedule {1}. Size it per country; there is no credible aggregate.'),
  ('roi', 'basis.penalty.just1',   'de', '{0} Ihrer Länder veröffentlicht einen bezifferten Bußgeldkatalog {1}. Bemessen Sie das je Land; einen glaubwürdigen Gesamtwert gibt es nicht.'),
  ('roi', 'basis.penalty.just1',   'es', '{0} de sus países publica un régimen sancionador cuantificado {1}. Dimensiónelo país por país; no existe un agregado creíble.'),
  ('roi', 'basis.penalty.just1',   'fr', '{0} de vos pays publie un barème de pénalités chiffré {1}. Dimensionnez cela pays par pays ; il n''existe aucun agrégat crédible.'),

  ('roi', 'pdf.ben.penaltyD1',   'en', '{0} of your jurisdictions publishes a schedule. Size it per country.'),
  ('roi', 'pdf.ben.penaltyD1',   'de', '{0} Ihrer Länder veröffentlicht einen Bußgeldkatalog. Je Land zu beziffern.'),
  ('roi', 'pdf.ben.penaltyD1',   'es', '{0} de sus jurisdicciones publica un baremo. Cuantifíquelo por país.'),
  ('roi', 'pdf.ben.penaltyD1',   'fr', '{0} de vos juridictions publie un barème. À chiffrer pays par pays.');

-- ---- the late-wave warning ----
--
-- THE FRENCH IS NOT THE OLD FRENCH RESTRUCTURED, and that is the point.
-- chart.late read "{0} vagues sur {1}" -- the noun sits against {0} in
-- French and against {1} in the other three. The renderer now passes the
-- pluralised wave count as {1}, so keeping the old French word order
-- would have produced "2 vagues sur 3 vagues". Authoring the pair fresh
-- is what makes that visible; a mechanical port would have shipped it.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.late1',   'en', '{0} of {1} back-plans to a start date that has already passed.'),
  ('roi', 'chart.late1',   'de', '{0} von {1} rechnet auf ein Startdatum zurück, das bereits vergangen ist.'),
  ('roi', 'chart.late1',   'es', '{0} de {1} se planifica hacia atrás hasta una fecha de inicio ya pasada.'),
  ('roi', 'chart.late1',   'fr', '{0} sur {1} remonte à une date de début déjà passée.');

-- ---- chart.late becomes the plural half, and loses its noun ----
-- The renderer now passes the pluralised wave count as {1}, so the noun
-- has to come out of the sentence. French also has to be reordered: it
-- read "{0} vagues sur {1}", with the noun against {0}, which would have
-- printed "2 vagues sur 3 vagues".
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.late', 'en', '{0} of {1} back-plan to a start date that has already passed.'),
  ('roi', 'chart.late', 'de', '{0} von {1} rechnen auf ein Startdatum zurück, das bereits vergangen ist.'),
  ('roi', 'chart.late', 'es', '{0} de {1} se planifican hacia atrás hasta una fecha de inicio ya pasada.'),
  ('roi', 'chart.late', 'fr', '{0} sur {1} remontent à une date de début déjà passée.');

-- ---- what this migration claims it did ----
-- Both halves of all three new pairs, in all four languages.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('basis.penalty.just1','pdf.ben.penaltyD1','chart.late1','basis.penalty.just','pdf.ben.penaltyD','chart.late') = 24
--
-- The singular halves really are singular. English is enough to catch a
-- copy-paste of the plural row, which is the failure being guarded.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('basis.penalty.just1','pdf.ben.penaltyD1') AND value LIKE '%publishes%' = 2
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'chart.late1' AND value LIKE '%back-plans%' = 1
--
-- The French pair does not name waves twice.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'fr' AND key IN ('chart.late','chart.late1') AND value LIKE '%vagues%' = 0
--
-- The tooltips carry no hardcoded week noun in any language.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('chart.progTip','chart.blockTip','chart.discRowTip','chart.segWeeks') AND (value LIKE '%weeks%' OR value LIKE '%Wochen%' OR value LIKE '%semanas%' OR value LIKE '%semaines%') = 0
-- STANDING: a roi string may not hardcode a plural time-unit noun beside
-- a placeholder.
--
-- Written across every roi key and every language rather than the four
-- tooltips, because "{0} weeks" is the shape that keeps being typed --
-- it reads correctly to whoever writes it, since the number in their head
-- is always more than one. The count and its unit are assembled in the
-- renderer now, where plur() can see both.
-- ASSERT ALWAYS: SELECT COUNT(*) FROM (SELECT key FROM translations WHERE namespace = 'roi' AND key NOT LIKE 'word.%' AND (value LIKE '%{0} weeks%' OR value LIKE '%{1} weeks%' OR value LIKE '%{0} Wochen%' OR value LIKE '%{1} Wochen%' OR value LIKE '%{0} semanas%' OR value LIKE '%{1} semanas%' OR value LIKE '%{0} semaines%' OR value LIKE '%{1} semaines%')) = 0
