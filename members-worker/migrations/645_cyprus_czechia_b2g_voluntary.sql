-- ================================================================
-- Cyprus: a guaranteed channel is not "no mandate".
-- ================================================================
--
-- Dan, 25 August 2026, reading the deep-dive page after the headline
-- tiles landed: "Cyprus should show voluntary."
--
-- ---- WHAT THE LAW ACTUALLY DOES --------------------------------------
--
-- Law 89(I)/2019 is titled as though it obliges ISSUING. It does not. It
-- obliges contracting authorities to RECEIVE and process EN 16931
-- e-invoices; no supplier is required to send one. Our own b2g_note has
-- said exactly that since the fact was first recorded -- the status word
-- beside it was the part that was wrong.
--
-- ---- WHY VOLUNTARY AND NOT no_mandate --------------------------------
--
-- The two words make different claims, and this site's vocabulary keeps
-- them apart on purpose:
--
--   NO MANDATE  nothing is in place. A supplier who sends a structured
--               e-invoice has no assurance anyone can accept it.
--   VOLUNTARY   the channel exists and is guaranteed in law, and using
--               it is the supplier's choice.
--
-- Cyprus is the second. A supplier CAN issue an EN 16931 invoice to any
-- contracting authority and that authority is legally obliged to accept
-- and process it. Calling that "NO MANDATE" understates a real, usable,
-- statutory route -- and this site is as careful about understating an
-- obligation as about overstating one.
--
-- THE MIRROR OF CANADA (migration 621). There the correction ran the
-- other way: CanadaBuys is a portal most federal suppliers use, and we
-- had called it ACTIVE. "A channel most people use is not a duty," so it
-- became VOLUNTARY. Cyprus is the same word arrived at from below: a duty
-- on the RECEIVER is not an absence of a channel. Both corrections land
-- on VOLUNTARY because that is what the word is for.
--
-- ---- CZECH REPUBLIC IS THE IDENTICAL CASE, AND DAN DECIDED IT --------
--
-- Its b2g_note reads "Authorities must receive EN 16931 invoices;
-- suppliers have no issuing duty" -- the same law, the same shape, the
-- same status word. This file was written with Czechia held back, on the
-- grounds that changing a factual claim about one jurisdiction by
-- inference from a neighbouring one is exactly what migration 611 did to
-- Canada and 621 had to undo.
--
-- Dan then said "same with Czech Republic", which is a DECISION rather
-- than an inference, so both move here. The distinction matters and is
-- the reason this paragraph survives: the two countries are being
-- changed together because a person who knows the law said so, not
-- because they looked alike.
-- ================================================================

UPDATE country_headline_facts
   SET b2g_status = 'voluntary'
 WHERE country_id IN (SELECT id FROM countries WHERE name_en IN ('Cyprus', 'Czech Republic'));

-- ---- and the change record says so ----------------------------------
--
-- /changes claims to list every change to the five headline facts. A
-- correction that skipped this table would make that page quietly false,
-- which is a worse defect than the one being fixed.

INSERT INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
  SELECT c.id, 'b2g_status', 'no_mandate', 'voluntary', '2026-08-25', 'correction',
         'https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/eInvoicing+in+Cyprus'
    FROM countries c WHERE c.name_en = 'Cyprus';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'en', 'Law 89(I)/2019 obliges Cypriot contracting authorities to receive and process EN 16931 e-invoices, but places no issuing duty on suppliers. We had recorded that as NO MANDATE, which understates it: a supplier who chooses to send a structured e-invoice has a statutory right to have it accepted. That is a guaranteed channel used at the sender''s discretion, which is what VOLUNTARY means here — the same word we arrived at for Canada from the opposite direction, where a portal most suppliers use turned out not to be a duty.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Cyprus' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'de', 'Das Gesetz 89(I)/2019 verpflichtet zypriotische öffentliche Auftraggeber, E-Rechnungen nach EN 16931 zu empfangen und zu verarbeiten, begründet aber keine Ausstellungspflicht für Lieferanten. Wir hatten das als KEINE PFLICHT geführt, was zu wenig sagt: Wer sich für eine strukturierte E-Rechnung entscheidet, hat einen gesetzlichen Anspruch darauf, dass sie angenommen wird. Das ist ein garantierter Kanal nach Wahl des Absenders — also FREIWILLIG, dasselbe Wort, zu dem wir bei Kanada aus der Gegenrichtung kamen, wo sich ein von vielen genutztes Portal als keine Pflicht erwies.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Cyprus' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'fr', 'La loi 89(I)/2019 oblige les pouvoirs adjudicateurs chypriotes à recevoir et traiter les factures électroniques EN 16931, sans imposer aux fournisseurs de les émettre. Nous l''avions consigné comme AUCUNE OBLIGATION, ce qui sous-estime la situation : un fournisseur qui choisit d''envoyer une facture structurée a le droit légal de la voir acceptée. C''est un canal garanti, utilisé au gré de l''émetteur — soit VOLONTAIRE, le même mot auquel nous sommes parvenus pour le Canada par le chemin inverse, où un portail très utilisé s''est révélé n''être pas une obligation.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Cyprus' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'es', 'La Ley 89(I)/2019 obliga a los poderes adjudicadores chipriotas a recibir y procesar facturas electrónicas EN 16931, pero no impone a los proveedores el deber de emitirlas. Lo habíamos registrado como SIN OBLIGACIÓN, lo que se queda corto: quien decide enviar una factura estructurada tiene derecho legal a que se acepte. Es un canal garantizado que se usa a discreción del emisor, que es lo que aquí significa VOLUNTARIA — la misma palabra a la que llegamos en Canadá por el camino contrario, donde un portal muy utilizado resultó no ser una obligación.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Cyprus' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

-- ---- and the same for Czechia ---------------------------------------

INSERT INTO fact_history (country_id, field, old_value, new_value, changed_on, kind, source_url)
  SELECT c.id, 'b2g_status', 'no_mandate', 'voluntary', '2026-08-25', 'correction',
         'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108881/eInvoicing+in+Czech+Republic'
    FROM countries c WHERE c.name_en = 'Czech Republic';


INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'en', 'The Czech Republic obliges contracting authorities to receive and process EN 16931 e-invoices, but places no issuing duty on suppliers. We had recorded that as NO MANDATE, which understates it: a supplier who chooses to send a structured e-invoice has a statutory right to have it accepted. That is a guaranteed channel used at the sender''s discretion, which is what VOLUNTARY means here. Changed alongside Cyprus, which is the same law in the same shape.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Czech Republic' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'de', 'Tschechien verpflichtet öffentliche Auftraggeber, E-Rechnungen nach EN 16931 zu empfangen und zu verarbeiten, begründet aber keine Ausstellungspflicht für Lieferanten. Wir hatten das als KEINE PFLICHT geführt, was zu wenig sagt: Wer sich für eine strukturierte E-Rechnung entscheidet, hat einen gesetzlichen Anspruch auf deren Annahme. Das ist ein garantierter Kanal nach Wahl des Absenders — also FREIWILLIG. Gemeinsam mit Zypern geändert, wo dasselbe Recht in derselben Form gilt.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Czech Republic' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'fr', 'La Tchéquie oblige les pouvoirs adjudicateurs à recevoir et traiter les factures électroniques EN 16931, sans imposer aux fournisseurs de les émettre. Nous l''avions consigné comme AUCUNE OBLIGATION, ce qui sous-estime la situation : un fournisseur qui choisit d''envoyer une facture structurée a le droit légal de la voir acceptée. C''est un canal garanti, utilisé au gré de l''émetteur — soit VOLONTAIRE. Modifié en même temps que Chypre, où la même règle s''applique.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Czech Republic' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

INSERT OR REPLACE INTO fact_history_notes (history_id, lang, note)
  SELECT h.id, 'es', 'Chequia obliga a los poderes adjudicadores a recibir y procesar facturas electrónicas EN 16931, pero no impone a los proveedores el deber de emitirlas. Lo habíamos registrado como SIN OBLIGACIÓN, lo que se queda corto: quien decide enviar una factura estructurada tiene derecho legal a que se acepte. Es un canal garantizado usado a discreción del emisor, que es lo que aquí significa VOLUNTARIA. Modificado junto con Chipre, donde rige la misma norma.'
    FROM fact_history h JOIN countries c ON c.id = h.country_id
   WHERE c.name_en = 'Czech Republic' AND h.field = 'b2g_status'
     AND h.old_value = 'no_mandate' AND h.new_value = 'voluntary';

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.name_en IN ('Cyprus', 'Czech Republic') AND f.b2g_status = 'voluntary' = 2

-- THE CHANGE RECORD HAS THE ROW, in all four languages. A correction
-- without its note reaches /changes as a status flip with no reason,
-- which is the shape of edit this project exists not to make.
-- ASSERT: SELECT count(*) FROM fact_history_notes n JOIN fact_history h ON h.id = n.history_id JOIN countries c ON c.id = h.country_id WHERE c.name_en IN ('Cyprus', 'Czech Republic') AND h.changed_on = '2026-08-25' = 8

-- ---- and what must stay true afterwards -----------------------------

-- THE NOTE AND THE STATUS AGREE. The b2g_note explains that authorities
-- must receive and suppliers need not issue; that sentence is the reason
-- the word is VOLUNTARY rather than ACTIVE, and it must not be edited to
-- describe an issuing duty while the status says otherwise.
-- PARENTHESISED, AND IT WAS NOT. Written first as
--   ... AND t.lang = 'en' AND note LIKE '%no issuing duty%' OR note LIKE '%no supplier duty%' = 2
-- the OR escapes the country filter entirely: SQL binds AND tighter than
-- OR, so the second branch matches that phrase in ANY country's note.
-- It returned 2 and passed, by luck, because only these two use the
-- phrase today -- a third country adopting the same wording would have
-- broken an assertion that has nothing to do with it. Caught by reading
-- it back rather than by it failing, which is the only way this class of
-- bug is ever caught.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_fact_translations t JOIN countries c ON c.id = t.country_id WHERE c.name_en IN ('Cyprus', 'Czech Republic') AND t.lang = 'en' AND (t.b2g_note LIKE '%no issuing duty%' OR t.b2g_note LIKE '%no supplier duty%') = 2

-- EVERY CORRECTION CARRIES ITS REASON -- AND ONLY CORRECTIONS DO.
--
-- The first version of this line asserted it of EVERY fact_history row
-- and failed on 350 of them. It was wrong, not the data: those 350 are
-- kind='first_recorded', which means "this is the first time we wrote
-- this fact down", and a first record has no earlier value to explain.
-- All 12 corrections already carry an English note; these two make 14.
--
-- Scoping it to corrections is the invariant that was actually meant: a
-- change to a published fact with no reason attached is a row /changes
-- can display but cannot explain.
-- ASSERT ALWAYS: SELECT (SELECT count(*) FROM fact_history h WHERE h.kind = 'correction' AND NOT EXISTS (SELECT 1 FROM fact_history_notes n WHERE n.history_id = h.id AND n.lang = 'en')) = 0
