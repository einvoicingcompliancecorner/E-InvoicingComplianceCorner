-- ================================================================
-- The tracker board had been serving a stale snapshot since 625.
-- ================================================================
--
-- Dan, 24 August 2026: "The main tracker page says 31 Jurisdictions
-- tracked in the headline information box, next to 79 Milestones. This
-- previously said 70 Jurisdictions, but has come down. Is this because
-- this number represents only countries with mandates in effect?"
--
-- No. Those two numbers are the STATIC FALLBACK SNAPSHOT baked into
-- einvoicing-compliance-tracker.html -- 79 entries across 31 countries
-- once the EU row is excluded, exactly. The stats box was not filtering
-- anything; it was counting a frozen array, because the live render had
-- been failing on every request for a day.
--
-- From wrangler tail:
--
--   Dynamic tracker render failed, serving static fallback:
--   SyntaxError: Unexpected token 'R', "Register t"... is not valid JSON
--
-- "Register t" is is-supplier-terms-2020's English actions, written by
-- migration 625 yesterday. THE CAUSE IS MINE: milestone_translations.
-- actions holds a JSON ARRAY, and 625 put a paragraph of prose in it for
-- two new milestones in four languages. buildTrackerData does
-- JSON.parse(r.actions), one bad row throws, renderTracker catches, and
-- every reader gets the snapshot.
--
-- ---- WHY NOTHING CAUGHT IT ------------------------------------------
--
-- The column has no type beyond TEXT and nothing ever parsed it outside
-- the worker. 625's own assertions checked that the milestone existed,
-- that it was on the board, that it had four translations -- every
-- structural claim it made was true. The content was the wrong SHAPE,
-- and no assertion asked about shape.
--
-- Replay could not catch it either, because replay does not render.
--
-- ---- AND A SECOND ONE, NOT MINE -------------------------------------
--
-- Auditing the whole column found a ninth broken row that predates all
-- of this: ec-realtime-transmission-2026's GERMAN actions use German
-- typographic quotes around the Spanish term, and the closing one is a
-- straight double quote -- ,,consumidor final" -- which ends the JSON
-- string early. English, French and Spanish are fine. So the German
-- board data has been failing to parse for however long that row has
-- existed, and it took an audit of all 1,656 rows to see it. Fixed here
-- with the correct German closing quote.
--
-- portals was audited at the same time: 270 rows, all valid.
-- ================================================================

-- ---- the eight rows 625 broke, as proper action lists ---------------
--
-- Not the prose re-wrapped in brackets. Each is split into the discrete
-- steps the column is for, in the house imperative, matching every other
-- milestone on the board.

UPDATE milestone_translations SET actions = '["Check any DoD contract or bid for clause 252.232-7003, and register in PIEE/WAWF before your first invoice", "Treasury, VA and EPA each impose their own clause and their own platform — check the buying agency''s acquisition supplement", "Selling to GSA, electronic submission is rewarded with faster payment rather than required"]'
 WHERE milestone_id = 'us-dfars-2003' AND lang = 'en';
UPDATE milestone_translations SET actions = '["Prüfen Sie DoD-Aufträge und Angebote auf die Klausel 252.232-7003 und registrieren Sie sich vor der ersten Rechnung in PIEE/WAWF", "Treasury, VA und EPA haben jeweils eigene Klauseln und eigene Plattformen — prüfen Sie den Beschaffungszusatz der kaufenden Behörde", "Bei der GSA wird die elektronische Einreichung mit schnellerer Zahlung belohnt, nicht verlangt"]'
 WHERE milestone_id = 'us-dfars-2003' AND lang = 'de';
UPDATE milestone_translations SET actions = '["Vérifiez la présence de la clause 252.232-7003 dans vos marchés ou offres DoD et inscrivez-vous dans PIEE/WAWF avant votre première facture", "Le Treasury, le VA et l''EPA imposent chacun leur clause et leur plateforme — consultez le supplément d''acquisition de l''agence acheteuse", "Pour la GSA, la voie électronique est récompensée par un paiement plus rapide plutôt qu''imposée"]'
 WHERE milestone_id = 'us-dfars-2003' AND lang = 'fr';
UPDATE milestone_translations SET actions = '["Revise si sus contratos u ofertas del DoD incluyen la cláusula 252.232-7003 y regístrese en PIEE/WAWF antes de su primera factura", "Treasury, VA y EPA imponen cada uno su propia cláusula y plataforma — consulte el suplemento de contratación de la agencia compradora", "Para la GSA, la vía electrónica se premia con un pago más rápido en lugar de exigirse"]'
 WHERE milestone_id = 'us-dfars-2003' AND lang = 'es';
UPDATE milestone_translations SET actions = '["Register to send TS-236 through a message broker before invoicing an Icelandic state body", "If you cannot send structured invoices, a free portal is offered for suppliers who cannot", "On a negotiated contract, check whether it displaces the State''s general terms — they apply only unless otherwise agreed"]'
 WHERE milestone_id = 'is-supplier-terms-2020' AND lang = 'en';
UPDATE milestone_translations SET actions = '["Registrieren Sie sich für den TS-236-Versand über einen Nachrichtenvermittler, bevor Sie eine isländische Staatsstelle fakturieren", "Ohne strukturierte Übermittlung steht Lieferanten ein kostenloses Portal zur Verfügung", "Prüfen Sie bei ausgehandelten Verträgen, ob sie die Allgemeinen Geschäftsbedingungen des Staates verdrängen — diese gelten nur, sofern nichts anderes vereinbart ist"]'
 WHERE milestone_id = 'is-supplier-terms-2020' AND lang = 'de';
UPDATE milestone_translations SET actions = '["Inscrivez-vous pour émettre en TS-236 via un intermédiaire de messages avant de facturer un organisme d''État islandais", "Si vous ne pouvez pas émettre en format structuré, un portail gratuit est proposé aux fournisseurs concernés", "En cas de contrat négocié, vérifiez s''il écarte les conditions générales de l''État — elles ne valent que sauf accord contraire"]'
 WHERE milestone_id = 'is-supplier-terms-2020' AND lang = 'fr';
UPDATE milestone_translations SET actions = '["Regístrese para emitir en TS-236 mediante un intermediario de mensajes antes de facturar a un ente estatal islandés", "Si no puede emitir en formato estructurado, se ofrece un portal gratuito para esos proveedores", "Si tiene contrato negociado, compruebe si desplaza las condiciones generales del Estado — solo rigen salvo pacto en contrario"]'
 WHERE milestone_id = 'is-supplier-terms-2020' AND lang = 'es';

UPDATE milestone_translations SET actions = '["Prüfen Sie, ob Ihre Rechnungssysteme wieder sofort an das SRI übermitteln und nicht mehr das inzwischen gestrichene 4-Werktage-Notstandsfenster nutzen", "Aktualisieren Sie Ihre Stornierungsabläufe für Rechnungen auf die neue Frist zum 7. des Folgemonats für „consumidor final“-Dokumente"]'
 WHERE milestone_id = 'ec-realtime-transmission-2026' AND lang = 'de';

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM milestone_translations WHERE json_valid(actions) = 0 = 0

-- ---- and what must stay true afterwards -----------------------------

-- EVERY ACTIONS VALUE PARSES, IN EVERY LANGUAGE. This is the assertion
-- that would have stopped 625 reaching production, and it is the whole
-- lesson of this migration: a column whose contents are a serialised
-- format needs an assertion about the FORMAT, not only about the rows.
-- ASSERT ALWAYS: SELECT count(*) FROM milestone_translations WHERE json_valid(actions) = 0 = 0

-- AND IT IS AN ARRAY, not a bare string or object that happens to be
-- valid JSON. "Register t" would have failed the check above; a lone
-- quoted string would not, and would still render as nothing.
-- ASSERT ALWAYS: SELECT count(*) FROM milestone_translations WHERE json_type(actions) != 'array' = 0

-- THE SAME FOR PORTALS, which the same renderer JSON.parses on the same
-- line and which is one careless migration away from the identical
-- outage. Clean today; asserted so it stays that way.
-- ASSERT ALWAYS: SELECT count(*) FROM milestones WHERE ifnull(portals,'') <> '' AND json_valid(portals) = 0 = 0
-- ASSERT ALWAYS: SELECT count(*) FROM milestones WHERE ifnull(portals,'') <> '' AND json_type(portals) != 'array' = 0
