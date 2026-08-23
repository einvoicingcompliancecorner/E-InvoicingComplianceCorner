-- ================================================================
-- Canada: a procurement portal is not a mandate, and we correct our
-- own correction.
-- ================================================================
--
-- Dan, 23 August 2026, having read the primary source himself:
-- "CanadaBuys is a public procurement portal, based on SAP Ariba. This
-- seems different from a B2G mandate for invoicing. I would say that
-- this is voluntary, and not mandated from a B2G perspective. There is
-- very little information under the invoicing instructions for
-- CanadaBuys, which also makes me think its optional."
--
-- He is right, and the evidence was on our own page the whole time.
--
-- ---- WHAT 611 GOT WRONG, AND IT IS THE METHOD ------------------------
--
-- On 22 August, migration 611 moved Canada's B2G status from VOLUNTARY
-- to ACTIVE. Its stated reasoning: "Three of our own artefacts said the
-- federal B2G mandate was in force ... while the tile said there was no
-- duty. Resolved in favour of the board. Three artefacts against one."
--
-- That is counting, not reading. The three artefacts were a milestone
-- headline, a card TITLE, and a second card. Read their contents rather
-- than their labels and they say the opposite:
--
--   "What CRA actually requires -- Format: ANY READABLE FORMAT --
--    paper, PDF, or EDI"
--   "For federal government suppliers -- PREFERRED standards: Peppol
--    BIS format or UBL-XML"
--   "No penalties, no format law"
--
-- A page that accepts paper, calls a format "preferred", and records no
-- penalty is not describing a mandate. Only the card's own TITLE --
-- "Federal B2G (mandatory)" -- and the milestone headline said it was,
-- and those are the two artefacts this migration fixes. 611 counted
-- three agreeing labels and never opened them.
--
-- THE LESSON, WHICH IS WORTH MORE THAN THE FIX: a self-contradiction
-- check that resolves ties by weight of artefacts will confidently pick
-- the wrong side whenever the error is in a heading. tests/
-- guides-consistency.mjs can find the disagreement; it cannot referee
-- it, and this file is the evidence that a human must.
--
-- ---- WHAT CANADABUYS ACTUALLY IS -------------------------------------
--
-- SAP Ariba, wearing a Government of Canada badge. It is the channel
-- through which federal procurement runs, and suppliers registered on it
-- do submit invoices electronically. That is adoption, not obligation:
-- no instrument requires a federal supplier to issue an electronic
-- invoice, and CRA's own record-keeping rules accept paper. The status
-- word for a real, operating, optional scheme is VOLUNTARY, and that is
-- what the tile said before we talked ourselves out of it.
--
-- The 1 April 2022 date goes with it. It was the CanadaBuys launch --
-- the day a portal opened, not the day a duty began -- and it came from
-- the same secondary tracker as the status.
--
-- ---- ON THE CITATION -------------------------------------------------
--
-- canadabuys.canada.ca refuses our fetcher at robots.txt, so this is
-- cited from a reading by the site's editor rather than from an
-- automated retrieval. That is a stronger provenance than most rows
-- here, not a weaker one, and it is recorded plainly rather than dressed
-- up as a machine check.
-- ================================================================

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('canadabuys.canada.ca', 'primary',
   'CanadaBuys, the federal procurement portal operated by Public Services and Procurement Canada',
   '2026-08-23');

-- ---- the fact ---------------------------------------------------------

UPDATE country_headline_facts
   SET b2g_status = 'voluntary',
       b2g_date   = NULL,
       b2g_source = 'https://canadabuys.canada.ca/en/buyer-s-portal/buyer-s-guide/plan/financial-considerations/invoicing-instructions',
       last_verified = '2026-08-23'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Canada');

UPDATE country_headline_fact_translations
   SET b2g_note = 'Federal suppliers invoice through CanadaBuys (SAP Ariba) and many do so electronically, but nothing obliges them to: CRA accepts any readable format, including paper, and no penalty attaches'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = 'Canada');

-- ---- and the two artefacts that said otherwise ------------------------
--
-- Both are corrected in all four languages. A German reader still being
-- told every federal supplier MUST invoice electronically, two days
-- after we decided they need not, is the same defect in a language
-- nobody on this project reads back.

UPDATE milestones
   SET mandate_scope = 'none',
       source_url = 'https://canadabuys.canada.ca/en/buyer-s-portal/buyer-s-guide/plan/financial-considerations/invoicing-instructions'
 WHERE date = '2022-04-01'
   AND country_id = (SELECT id FROM countries WHERE name_en = 'Canada');

UPDATE milestone_translations SET system = 'CanadaBuys (SAP Ariba) becomes the federal procurement channel — electronic invoicing available, not required'
 WHERE lang = 'en' AND milestone_id IN (SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id WHERE c.name_en = 'Canada' AND m.date = '2022-04-01');
UPDATE milestone_translations SET system = 'CanadaBuys (SAP Ariba) wird zum Beschaffungskanal des Bundes — elektronische Rechnungsstellung möglich, nicht verpflichtend'
 WHERE lang = 'de' AND milestone_id IN (SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id WHERE c.name_en = 'Canada' AND m.date = '2022-04-01');
UPDATE milestone_translations SET system = 'CanadaBuys (SAP Ariba) devient le canal d''achat fédéral — facturation électronique possible, non obligatoire'
 WHERE lang = 'fr' AND milestone_id IN (SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id WHERE c.name_en = 'Canada' AND m.date = '2022-04-01');
UPDATE milestone_translations SET system = 'CanadaBuys (SAP Ariba) se convierte en el canal de compras federal: la facturación electrónica es posible, no obligatoria'
 WHERE lang = 'es' AND milestone_id IN (SELECT m.id FROM milestones m JOIN countries c ON c.id = m.country_id WHERE c.name_en = 'Canada' AND m.date = '2022-04-01');

UPDATE deep_dive_card_translations SET title = 'Federal B2G (voluntary)'
 WHERE lang = 'en' AND title = 'Federal B2G (mandatory)';
UPDATE deep_dive_card_translations SET title = 'Bundes-B2G (freiwillig)'
 WHERE lang = 'de' AND title = 'Bundes-B2G (verpflichtend)';
UPDATE deep_dive_card_translations SET title = 'B2G fédéral (facultatif)'
 WHERE lang = 'fr' AND title = 'B2G fédéral (obligatoire)';
UPDATE deep_dive_card_translations SET title = 'B2G federal (voluntario)'
 WHERE lang = 'es' AND title = 'B2G federal (obligatorio)';

-- ---- what a reader is owed --------------------------------------------

INSERT INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
  SELECT c.id, 'b2g_status', 'active', 'voluntary', '2026-08-23', 'correction',
         'https://canadabuys.canada.ca/en/buyer-s-portal/buyer-s-guide/plan/financial-considerations/invoicing-instructions'
    FROM countries c WHERE c.name_en = 'Canada';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'en', 'We corrected this the wrong way on 22 August and are correcting it back. CanadaBuys is a procurement portal built on SAP Ariba: federal suppliers invoice through it, and many do so electronically, but nothing obliges them to — CRA accepts any readable format including paper, and no penalty attaches. The earlier change counted three of our own artefacts saying "mandatory" against one saying otherwise, without reading them; two of the three were a heading and a card title, and the card''s own contents said "preferred" and "any readable format". A channel most people use is not a duty.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Canada' AND h.field = 'b2g_status'
     AND h.old_value = 'active' AND h.new_value = 'voluntary';
INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'de', 'Wir haben dies am 22. August in die falsche Richtung korrigiert und nehmen es zurück. CanadaBuys ist ein auf SAP Ariba aufgebautes Beschaffungsportal: Bundeslieferanten rechnen darüber ab, viele davon elektronisch, doch verpflichtet sie nichts dazu — die CRA akzeptiert jedes lesbare Format einschließlich Papier, und es droht keine Sanktion. Die frühere Änderung zählte drei eigene Belege mit „verpflichtend" gegen einen gegenteiligen, ohne sie zu lesen; zwei der drei waren eine Überschrift und ein Kartentitel, während der Karteninhalt selbst „bevorzugt" und „jedes lesbare Format" sagte. Ein vielgenutzter Kanal ist keine Pflicht.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Canada' AND h.field = 'b2g_status'
     AND h.old_value = 'active' AND h.new_value = 'voluntary';
INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'fr', 'Nous avons corrigé ceci dans le mauvais sens le 22 août et revenons en arrière. CanadaBuys est un portail d''achat bâti sur SAP Ariba : les fournisseurs fédéraux y facturent, souvent par voie électronique, mais rien ne les y oblige — l''ARC accepte tout format lisible, papier compris, et aucune sanction n''est prévue. Le changement précédent comptait trois de nos propres éléments disant « obligatoire » contre un seul disant l''inverse, sans les lire ; deux des trois étaient un titre de jalon et un titre de fiche, alors que le contenu de la fiche disait « privilégié » et « tout format lisible ». Un canal largement utilisé n''est pas une obligation.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Canada' AND h.field = 'b2g_status'
     AND h.old_value = 'active' AND h.new_value = 'voluntary';
INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'es', 'Corregimos esto en la dirección equivocada el 22 de agosto y lo revertimos. CanadaBuys es un portal de compras construido sobre SAP Ariba: los proveedores federales facturan a través de él, muchos por vía electrónica, pero nada les obliga — la CRA acepta cualquier formato legible, papel incluido, y no hay sanción. El cambio anterior contó tres elementos propios que decían «obligatorio» frente a uno que decía lo contrario, sin leerlos; dos de los tres eran un titular y el título de una ficha, mientras que el contenido de la ficha decía «preferido» y «cualquier formato legible». Un canal muy utilizado no es un deber.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Canada' AND h.field = 'b2g_status'
     AND h.old_value = 'active' AND h.new_value = 'voluntary';

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT b2g_status FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Canada') = 'voluntary'
-- ASSERT: SELECT b2g_date FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Canada') = NULL
-- ASSERT: SELECT count(*) FROM fact_history h JOIN countries c ON c.id = h.country_id WHERE c.name_en = 'Canada' AND h.new_value = 'voluntary' AND h.kind = 'correction' = 1

-- THE MILESTONE THAT MISLED 611 NO LONGER CLAIMS A MANDATE, in any
-- language. Leaving it would leave the page contradicting its own tile
-- again -- and the next reader of that contradiction would have the same
-- three-against-one temptation.
-- ASSERT ALWAYS: SELECT count(*) FROM milestone_translations mt JOIN milestones m ON m.id = mt.milestone_id JOIN countries c ON c.id = m.country_id WHERE c.name_en = 'Canada' AND m.date = '2022-04-01' AND (mt.system LIKE '%must invoice%' OR mt.system LIKE '%müssen elektronisch%' OR mt.system LIKE '%doivent facturer%' OR mt.system LIKE '%deben facturar%') = 0

-- AND NO CARD CALLS CANADIAN B2G MANDATORY.
-- ASSERT ALWAYS: SELECT count(*) FROM deep_dive_card_translations ct JOIN deep_dive_cards dc ON dc.id = ct.card_id JOIN countries c ON c.id = dc.country_id WHERE c.name_en = 'Canada' AND (ct.title LIKE '%mandatory%' OR ct.title LIKE '%verpflichtend%' OR ct.title LIKE '%obligatoire%' OR ct.title LIKE '%obligatorio%') = 0

-- CANADA NO LONGER RESTS ON A TRACKER FOR ANY HEADLINE FACT, which was
-- the last one outside Korea and Vietnam.
-- ASSERT ALWAYS: SELECT count(*) FROM cited_sources cs JOIN source_hosts sh ON sh.host = cs.host JOIN countries c ON c.id = cs.row_id WHERE cs.kind LIKE 'headline_fact%' AND c.name_en = 'Canada' AND sh.tier NOT IN ('primary','institutional') = 0
