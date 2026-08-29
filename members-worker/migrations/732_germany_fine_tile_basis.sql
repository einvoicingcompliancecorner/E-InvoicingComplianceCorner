-- Germany's fine tile says what the fine is FOR.
--
-- From the independent German site review, 29 August 2026, and the one
-- finding in it that was not about German at all:
--
--   "the Germany page currently displays €5,000 – Maximales Bußgeld pro
--    Verstoß but the narrative subsequently says 'Deutschland hat kein
--    eigenes E-Invoicing-Bußgeld...'. Those two statements can look
--    contradictory to a visitor, even if there is a legal distinction
--    behind them. ... For a compliance website, these small ambiguities
--    matter enormously because trust is the product."
--
-- Both statements are true. §26a UStG is a general VAT administrative
-- offence (Ordnungswidrigkeit) capped at EUR 5,000, and Germany has no
-- e-invoicing-specific penalty. The page's own penalty table has said so
-- since it was written; the headline tile did not, and a tile is what a
-- skimmer reads. So the tile carries the basis now and the two agree at
-- a glance instead of on close reading.
--
-- THE PROSE IS UNTOUCHED, deliberately. "Germany has no dedicated
-- e-invoicing fine — non-compliance is folded into existing VAT and
-- bookkeeping law, and the sharpest risk isn't a government fine at all"
-- is correct and is the more useful sentence on the page. It reads as
-- the explanation of the tile once the tile stops contradicting it.
--
-- IT IS AN INSTANCE, AND I CHECKED. The rule here is "a defect Dan
-- reports is a class" -- so every country was swept before this was
-- written. Thirty deep dives carry a stat tile asserting a penalty;
-- Germany is the ONLY one whose penalties intro also says there is no
-- dedicated fine. Five of the thirty already name their legal basis in
-- the label, and the Czech Republic's is the model this follows --
-- "Max EET 2.0 penalty (a sales-reporting fine, not an invoicing one)"
-- -- so this is an existing house style rather than a new one.
--
-- The other twenty-five tiles state a penalty without a basis and are
-- NOT changed here. None of them contradicts its own page, and rewriting
-- twenty-five countries' headline copy off the back of one review is a
-- content project rather than a bug fix. Worth doing deliberately, if at
-- all, and Dan has not asked for it.

UPDATE deep_dive_stat_translations
   SET stat_label = 'Max §26a UStG fine (a general VAT offence, not an e-invoicing one)'
 WHERE stat_id = (SELECT s.id FROM deep_dive_stats s
                    JOIN countries c ON c.id = s.country_id
                   WHERE c.code = 'DE' AND s.sort_order = 3)
   AND lang = 'en';

UPDATE deep_dive_stat_translations
   SET stat_label = 'Höchstbußgeld nach §26a UStG (allgemeine USt-Ordnungswidrigkeit, keine E-Rechnungs-Sanktion)'
 WHERE stat_id = (SELECT s.id FROM deep_dive_stats s
                    JOIN countries c ON c.id = s.country_id
                   WHERE c.code = 'DE' AND s.sort_order = 3)
   AND lang = 'de';

UPDATE deep_dive_stat_translations
   SET stat_label = 'Multa máxima §26a UStG (infracción general de IVA, no de facturación electrónica)'
 WHERE stat_id = (SELECT s.id FROM deep_dive_stats s
                    JOIN countries c ON c.id = s.country_id
                   WHERE c.code = 'DE' AND s.sort_order = 3)
   AND lang = 'es';

UPDATE deep_dive_stat_translations
   SET stat_label = 'Amende maximale §26a UStG (infraction TVA générale, non spécifique à l''e-facturation)'
 WHERE stat_id = (SELECT s.id FROM deep_dive_stats s
                    JOIN countries c ON c.id = s.country_id
                   WHERE c.code = 'DE' AND s.sort_order = 3)
   AND lang = 'fr';

-- ---- what this migration claims it did ----
-- All four editions carry the legal basis, and the value is untouched.
-- ASSERT: SELECT count(*) FROM deep_dive_stat_translations t JOIN deep_dive_stats s ON s.id = t.stat_id JOIN countries c ON c.id = s.country_id WHERE c.code = 'DE' AND s.sort_order = 3 AND t.stat_label LIKE '%26a%' = 4
--
-- The number itself did not move. This migration is about what the
-- number MEANS, and a fix that quietly changed the figure while claiming
-- to clarify it would be worse than the ambiguity.
-- ASSERT: SELECT count(*) FROM deep_dive_stat_translations t JOIN deep_dive_stats s ON s.id = t.stat_id JOIN countries c ON c.id = s.country_id WHERE c.code = 'DE' AND s.sort_order = 3 AND t.stat_value IN ('€5,000', '5.000 €', '5 000 €') = 4
--
-- STANDING: a page may not headline a fine while its own prose says
-- there is no dedicated one, unless the tile names the legal basis.
--
-- This is the review's finding stated as a rule rather than as a repair.
-- It is written against every country and every language, so the next
-- deep dive that grows a penalty tile over a "no dedicated fine" intro
-- fails on the day it is added -- which is the only reason to encode it
-- at all, since Germany is the sole case today. Basis is recognised as a
-- section marker in the label: §, "Art", or "Section".
-- ASSERT ALWAYS: SELECT COUNT(*) FROM deep_dive_stat_translations t JOIN deep_dive_stats s ON s.id = t.stat_id JOIN deep_dive_page_translations p ON p.country_id = s.country_id AND p.lang = t.lang WHERE (t.stat_label LIKE '%fine%' OR t.stat_label LIKE '%Bußgeld%' OR t.stat_label LIKE '%penalty%') AND (p.penalties_intro LIKE '%no dedicated%' OR p.penalties_intro LIKE '%kein eigenes%') AND t.stat_label NOT LIKE '%§%' AND t.stat_label NOT LIKE '%Art%' AND t.stat_label NOT LIKE '%Section%' = 0
