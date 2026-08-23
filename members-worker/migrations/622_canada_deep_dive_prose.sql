-- ================================================================
-- Canada's deep dive still said "must", in four languages.
-- ================================================================
--
-- Dan, 23 August 2026: "does canada deep dive need looking at?"
--
-- It did. Migration 621 corrected the tile, the milestone and the card,
-- and the compliance guide followed on its own because it is generated.
-- The deep-dive PAGE PROSE did not, and it carried the strongest
-- statement of the error anywhere on the site, in its most-read
-- paragraph:
--
--   "The one real, existing obligation is federal B2G -- suppliers to
--    the Government of Canada must invoice electronically via SAP
--    Ariba."
--
-- ---- AND THE CHECKER COULD NOT SEE IT -------------------------------
--
-- tests/guides-consistency.mjs compared the tiles against cards and
-- milestones and never against the paragraphs above them. Three separate
-- defects, all found by pointing it at this page and fixed in the same
-- commit:
--
--   * it read no page prose at all. It now reads mandate_summary,
--     scope_intro, penalties_intro and compliance_model;
--
--   * its duty pattern was "must issue", which does not match "must
--     invoice" -- the exact words Canada used;
--
--   * its negation guard listed not/never/no/nor, and a word boundary
--     kept "no" from matching inside "nothing". Canada's own penalties
--     intro -- a sentence whose entire point is that nothing is required
--     -- therefore read as an assertion that something is.
--
-- A fourth defect surfaced at the same time and is not Canada's:
-- Austria's "Voluntary B2B (Peppol/ebInterface) -- mandatory B2G since
-- 2014" attached "mandatory" to the B2B token because B2B appeared first
-- in the string. The checker now also looks at the words FOLLOWING a
-- claim before deciding whose it is.
--
-- ---- WHAT THE CHECKER STILL CANNOT CATCH ----------------------------
--
-- scope_intro said "a mandated federal channel, and an unregulated
-- everything-else". That is wrong in the same way, and no lexical check
-- will ever find it, because the sentence names no segment: there is no
-- B2G, B2B or B2C token for the claim to attach to. It is corrected
-- below because a person read it, and it is recorded here so nobody
-- mistakes the green build for a guarantee that the prose is right.
-- ================================================================

-- ---- the summary ------------------------------------------------------

UPDATE deep_dive_page_translations SET
  mandate_summary = 'There is no e-invoicing mandate in Canada — not for B2B, and not for B2G — and none is currently proposed on a fixed timeline. Federal suppliers invoice through CanadaBuys, the procurement portal built on SAP Ariba, and many do so electronically; nothing obliges them to. The CRA accepts any readable format, including paper, and no penalty attaches. This page covers that honest state of affairs.',
  scope_intro = 'Two entirely separate worlds exist side by side: a federal channel most suppliers now use, and an unregulated everything-else. Neither is a mandate.',
  compliance_model = 'No mandate — federal B2G runs on SAP Ariba by choice'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = 'Canada');

UPDATE deep_dive_page_translations SET
  mandate_summary = 'In Kanada gibt es kein E-Invoicing-Mandat — weder für B2B noch für B2G — und derzeit ist keines mit festem Zeitplan vorgeschlagen. Lieferanten des Bundes rechnen über CanadaBuys ab, das auf SAP Ariba aufgebaute Beschaffungsportal, viele davon elektronisch; verpflichtet ist dazu niemand. Die CRA akzeptiert jedes lesbare Format, auch Papier, und es droht keine Sanktion. Diese Seite beschreibt genau diesen Stand.',
  scope_intro = 'Zwei völlig getrennte Welten existieren nebeneinander: ein Bundeskanal, den inzwischen die meisten Lieferanten nutzen, und ein unreguliertes Alles-andere. Keines von beidem ist ein Mandat.',
  compliance_model = 'Kein Mandat — Bundes-B2G läuft freiwillig über SAP Ariba'
 WHERE lang = 'de' AND country_id = (SELECT id FROM countries WHERE name_en = 'Canada');

UPDATE deep_dive_page_translations SET
  mandate_summary = 'Il n''existe aucun mandat de facturation électronique au Canada — ni en B2B, ni en B2G — et aucun n''est actuellement proposé selon un calendrier fixe. Les fournisseurs fédéraux facturent via CanadaBuys, le portail d''achat bâti sur SAP Ariba, souvent par voie électronique ; rien ne les y oblige. L''ARC accepte tout format lisible, papier compris, et aucune sanction n''est prévue. Cette page décrit cet état de fait.',
  scope_intro = 'Deux mondes entièrement séparés coexistent : un canal fédéral que la plupart des fournisseurs utilisent désormais, et tout le reste, non réglementé. Ni l''un ni l''autre n''est un mandat.',
  compliance_model = 'Aucun mandat — le B2G fédéral passe par SAP Ariba, volontairement'
 WHERE lang = 'fr' AND country_id = (SELECT id FROM countries WHERE name_en = 'Canada');

UPDATE deep_dive_page_translations SET
  mandate_summary = 'No existe ningún mandato de facturación electrónica en Canadá —ni B2B ni B2G— y actualmente no se propone ninguno con un plazo fijo. Los proveedores federales facturan a través de CanadaBuys, el portal de compras construido sobre SAP Ariba, y muchos lo hacen por vía electrónica; nada les obliga. La CRA acepta cualquier formato legible, papel incluido, y no hay sanción. Esta página describe esa situación real.',
  scope_intro = 'Coexisten dos mundos completamente separados: un canal federal que ya usan la mayoría de los proveedores, y todo lo demás, sin regular. Ninguno de los dos es un mandato.',
  compliance_model = 'Sin mandato — el B2G federal usa SAP Ariba de forma voluntaria'
 WHERE lang = 'es' AND country_id = (SELECT id FROM countries WHERE name_en = 'Canada');

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM deep_dive_page_translations pt JOIN countries c ON c.id = pt.country_id WHERE c.name_en = 'Canada' AND pt.mandate_summary LIKE '%no e-invoicing mandate%' = 1

-- NO LANGUAGE STILL SAYS SUPPLIERS MUST. 621 made the same claim about
-- the milestone and the card; this is the third surface, and the one a
-- reader meets first.
-- ASSERT ALWAYS: SELECT count(*) FROM deep_dive_page_translations pt JOIN countries c ON c.id = pt.country_id WHERE c.name_en = 'Canada' AND (pt.mandate_summary LIKE '%must invoice%' OR pt.mandate_summary LIKE '%müssen elektronisch%' OR pt.mandate_summary LIKE '%doivent facturer%' OR pt.mandate_summary LIKE '%deben facturar%') = 0

-- AND NO LANGUAGE CALLS THE FEDERAL CHANNEL MANDATED.
-- ASSERT ALWAYS: SELECT count(*) FROM deep_dive_page_translations pt JOIN countries c ON c.id = pt.country_id WHERE c.name_en = 'Canada' AND (pt.scope_intro LIKE '%mandated federal%' OR pt.scope_intro LIKE '%verpflichtender Bundeskanal%' OR pt.scope_intro LIKE '%canal fédéral obligatoire%' OR pt.scope_intro LIKE '%canal federal obligatorio%') = 0
