-- The ROI PDF's go-live caveat agrees with its own count.
--
-- Dan printed the planner on 29 August 2026 with a single jurisdiction
-- selected -- the first real Ctrl-P anyone had run against it -- and the
-- document disagreed with itself twice on one page:
--
--   masthead:  "1 JURISDICTIONS - 100,000 AP / 50,000 AR"
--   page 2:    "1 selected jurisdictions have no mandated go-live."
--   page 2:    "You selected 1 jurisdiction."   <- four inches above it
--
-- The third line is right, and it is right because it goes through
-- plur() and PLURALS, which have existed since migration 585 and route
-- through Intl.PluralRules so that French takes the singular at zero as
-- well as at one. The first two never adopted it: one printed a count
-- against a fixed plural noun, the other concatenated a count in front
-- of a sentence fragment.
--
-- THE MASTHEAD NEEDED NO NEW STRING. PLURALS.jur is word.jur/word.jurs,
-- already translated, already used elsewhere on the same page. So
-- 'pdf.jur' -- a bare plural noun that only existed to be concatenated
-- onto a number -- has no remaining call site and is DELETED here rather
-- than left for tests/roi-i18n.mjs's unused-key check to excuse. That
-- check's KEPT list is deliberately empty and is worth keeping empty.
--
-- THE CAVEAT NEEDED A SINGULAR, and it is a whole sentence rather than a
-- noun because the agreement reaches past it: "have" becomes "has",
-- "They are" becomes "It is", "for them" becomes "for it". Same shape as
-- res.nearest3, and the same reason.
--
-- 'pdf.undatedNote' STAYS AND BECOMES THE PLURAL HALF of the pair, which
-- is why it is UPDATEd rather than replaced. Migration 546 carries a
-- standing invariant naming it, and a new pair beside it would leave
-- that invariant guarding an orphan -- true, passing, and meaningless.
-- The only change to the value is a leading {0}, because the count is
-- now filled into the sentence instead of glued to its front.

-- ---- the plural half, now carrying its own count ----
UPDATE translations SET value = '{0} ' || value
 WHERE namespace = 'roi' AND key = 'pdf.undatedNote' AND value NOT LIKE '{0}%';

-- ---- the singular half ----
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'pdf.undatedNote1', 'en', '{0} selected jurisdiction has no mandated go-live. It is costed and scheduled; any date shown for it is a planning choice, not an obligation.'),
  ('roi', 'pdf.undatedNote1', 'de', '{0} ausgewähltes Land hat keinen vorgeschriebenen Go-live. Es ist kalkuliert und eingeplant; ein dort angezeigter Termin ist eine Planungsentscheidung, keine Verpflichtung.'),
  ('roi', 'pdf.undatedNote1', 'es', '{0} país seleccionado no tiene puesta en marcha obligatoria. Está cuantificado y planificado; cualquier fecha que se muestre para él es una decisión de planificación, no una obligación.'),
  ('roi', 'pdf.undatedNote1', 'fr', '{0} pays sélectionné n''a aucune mise en service imposée. Il est chiffré et planifié ; toute date affichée pour lui est un choix de planification, pas une obligation.');

-- ---- the noun that no longer has a call site ----
DELETE FROM translations WHERE namespace = 'roi' AND key = 'pdf.jur';

-- ---- what this migration claims it did ----
-- The pair exists in all four languages, and both halves carry the
-- placeholder the renderer fills.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('pdf.undatedNote','pdf.undatedNote1') AND value LIKE '{0}%' = 8
--
-- The singular really is singular. Checking the English is enough to
-- catch a copy-paste of the plural row, which is the failure this is
-- guarding: three of the four values differ per language, but "has no
-- mandated go-live" is what the English row must not have lost.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'pdf.undatedNote1' AND lang = 'en' AND value LIKE '%jurisdiction has no%' = 1
--
-- And the retired noun is gone in every language, so the unused-key
-- check has nothing to report and nothing to excuse.
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'pdf.jur' = 0
--
-- STANDING: this pair may not lose a half, in any language.
--
-- Phrased per language rather than as a total, so adding a fifth
-- language does not force an edit to an applied migration -- the trap
-- 727 fell into. A language either has both halves each carrying the
-- placeholder, or it is a violation; no row may violate it.
--
-- Deliberately NOT a rule about every key ending in '1'. That was the
-- first draft, and it would have pattern-matched unrelated keys and
-- failed on a legitimate future change, which is a check that costs more
-- than it catches. This one guards the thing that actually broke.
-- ASSERT ALWAYS: SELECT COUNT(*) FROM (SELECT lang FROM translations WHERE namespace = 'roi' AND key IN ('pdf.undatedNote','pdf.undatedNote1') GROUP BY lang HAVING COUNT(DISTINCT key) <> 2 OR SUM(CASE WHEN value LIKE '{0}%' THEN 1 ELSE 0 END) <> 2) = 0
