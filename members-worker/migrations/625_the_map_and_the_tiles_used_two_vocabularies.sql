-- ================================================================
-- The map and the tiles were using two different definitions of
-- "mandate", and the map was using the older one.
-- ================================================================
--
-- Dan, 23 August 2026: "we seem to show united states as active B2G
-- also. is this correct?"
--
-- It is correct, and checking why exposed something larger.
--
-- ---- FIRST, THE ANSWER TO THE QUESTION ------------------------------
--
-- ACTIVE stands. A US federal supplier's duty to invoice electronically
-- is real, statutory and old: 10 U.S.C. 4601 (enacted as 2227 on 30 Oct
-- 2000) directs the Secretary of Defense to require electronic claims,
-- and DFARS clause 252.232-7003 -- created by the interim rule at 68 FR
-- 8455, effective 1 March 2003 -- puts it in the contract: "the
-- Contractor shall submit payment requests ... in electronic form". The
-- DEC 2018 revision hardened the channel: WAWF only, and "facsimile,
-- email, and scanned documents are not acceptable". DoD is roughly 59%
-- of federal contract obligations. Treasury (DTAR 1052.232-7003, from
-- 1 Oct 2012), VA (VAAR 852.232-72, mandatory from 27 Dec 2012) and EPA
-- (EPAAR 1552.232-70) each did the same for themselves.
--
-- This is nothing like Canada. Canada had a portal that obliged nobody;
-- the US has a clause that says "shall", backed by a statute.
--
-- It is partial -- agency by agency, with no FAR-wide rule and with GSA
-- expressly NOT requiring it -- but partial B2G actives are already the
-- house convention: Germany is federal-only, the Netherlands is
-- central-government-only, and Norway, Greece and India are above a
-- threshold. Partial by agency is the same species, and the note says so.
--
-- ---- BUT THE PAGE'S OWN ACCOUNT OF IT WAS WRONG ---------------------
--
-- Every other US artefact told an IPP story. The board carried
-- "us-federal-b2g", dated 2018, sourced to OMB Memorandum M-15-19 --
-- which directs AGENCIES to be able to invoice electronically by the end
-- of FY2018 and imposes nothing whatever on a supplier. The deep-dive
-- card said "if you sell to a federal agency, you're dealing with IPP".
-- IPP is a platform; Treasury's own pages describe availability, never
-- compulsion. DFARS -- the instrument the tile is actually sourced to --
-- appeared nowhere on the page.
--
-- So the tile and the milestone AGREED, and the agreement was a
-- coincidence: one was right about a duty the other had never heard of.
-- guides-consistency.mjs is built to find disagreement and is therefore
-- blind to two artefacts being wrong in a way that happens to match.
--
-- ---- AND THEN THE MAP DISAGREED WITH THE TILES ----------------------
--
-- The tracker map paints the United States "No mandate confirmed" while
-- its own guide tile says ACTIVE. Checking the other sixty-nine found
-- four more, and the cause is not four sloppy rows. It is a vocabulary.
--
-- migration 254 defines mandate_scope's 'b2b' as covering a mandate
-- "requiring structured e-invoicing between businesses (ISSUING AND/OR
-- RECEIVING)". Migrations 600-601, six months later, established the
-- rule the whole headline-fact table rests on: A STATUS DESCRIBES THE
-- DUTY TO ISSUE; a duty only to receive goes in the note. That rule is
-- published on /methodology. It is why Ireland, Cyprus, Malta and the
-- United Kingdom read NO MANDATE for B2G. Nobody went back to 254.
--
-- The result is on the front page. The map's own legend says "In force
-- -- real, binding B2B mandate today", and Germany is coloured that way
-- on the strength of a milestone whose title is "Mandatory RECEIPT of
-- structured e-invoices". Germany's issuing mandate starts in 2027.
--
-- ---- THE DEFINITION THIS MIGRATION ADOPTS ---------------------------
--
-- mandate_scope now follows the issuing rule, and 254's parenthesis no
-- longer applies:
--
--   'b2b'      a duty on businesses to ISSUE structured invoices to
--              other businesses.
--   'b2g_only' a duty on SUPPLIERS to issue structured invoices to
--              public bodies, with no B2B duty attached. A duty on the
--              public body to receive is NOT this.
--   'none'     real and binding, but establishes no duty to issue:
--              receive-side obligations, systems-capability rules,
--              reporting, certification, pilots.
--
-- Sixteen on_tracker rows move. on_tracker = 0 rows are deliberately
-- left alone -- 255's own header records that only board rows were ever
-- individually reviewed, nothing reads the others, and re-auditing 300
-- context entries is a separate job with separate risks.
--
-- Nine countries change colour. Every one is the site's published rule
-- finally reaching the map:
--
--   Germany        in force  -> upcoming    receipt 2025, issuing 2027
--   Denmark        in force  -> B2G only    Bookkeeping Act is capability
--   Estonia        in force  -> B2G only    buyer may demand, seller need not offer
--   Australia      B2G only  -> no mandate  agencies receive; suppliers need not send
--   Bulgaria       B2G only  -> no mandate  ditto
--   Cyprus         B2G only  -> no mandate  ditto
--   Malta          B2G only  -> no mandate  ditto
--   New Zealand    B2G only  -> no mandate  ditto, until nz-largesupplier on 1 Jan 2027
--   United States  no mandate-> B2G only    DFARS, since 2003
--
-- New Zealand is the one to watch and the one that shows the model
-- working: nz-largesupplier is a genuine supplier issuing duty dated
-- 1 Jan 2027, so New Zealand turns B2G-only again on that date with no
-- migration at all.
--
-- Spain and Taiwan still disagree afterwards. Both are recorded open
-- judgements, not defects, and tests/map-tiles-agree.mjs names them and
-- fails if either quietly stops disagreeing.
-- ================================================================

-- ---- receive-side and capability rules are not issuing mandates -----

-- Germany: the milestone's own title says RECEIPT.
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'de-receive';
-- Norway's 2030 reception phase, same reason. Norway does not move: its
-- 2027 issuing milestone already carries the map.
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'no-receive';
-- Denmark: the Bookkeeping Act requires a system CAPABLE of sending and
-- receiving. It does not require an invoice to be sent.
UPDATE milestones SET mandate_scope = 'none' WHERE id IN ('dk-established', 'dk-small');
-- Estonia: a registered buyer may demand an e-invoice. A duty that only
-- exists once somebody asks is not a mandate on sellers generally --
-- which is exactly what the tile's note has said all along.
UPDATE milestones SET mandate_scope = 'none' WHERE id = 'ee-b2b-buyer-request-2025';

-- ---- and neither are public bodies being able to receive ------------
--
-- All five of these read 'b2g_only', which the map prints as "B2G only
-- -- government mandate real". Read their titles: "mandatory to
-- receive", "receipt mandatory for public bodies", "must also receive",
-- "must be able to receive", "receiving capability deadline". Not one
-- puts a duty on a supplier.
UPDATE milestones SET mandate_scope = 'none'
 WHERE id IN ('au-ncereceive', 'au-30pct', 'au-automate',
              'bg-b2g-2019',
              'cy-b2g-subcentral-2020',
              'mt-b2g-2018', 'mt-b2g-subcentral-2020',
              'nz-central', 'nz-2000');

-- ---- Denmark has a real B2G issuing duty; it was just off the board --
--
-- dk-b2g-2005 sat at on_tracker = 0 with the schema default 'b2b'. It is
-- the one Danish milestone that does oblige a supplier to issue, it is
-- what the ACTIVE B2G tile is sourced to, and without it Denmark would
-- now read "no mandate confirmed" -- wrong in the opposite direction.
UPDATE milestones SET on_tracker = 1, mandate_scope = 'b2g_only',
       obligation_status = 'live',
       source_url = 'https://erhvervsstyrelsen.dk/nemhandel-faelles-digital-infrastruktur'
 WHERE id = 'dk-b2g-2005';

UPDATE milestone_translations SET
  system = 'Suppliers must e-invoice the public sector via NemHandel',
  desc = 'Denmark has required suppliers to send structured e-invoices to public authorities through NemHandel since 2005 — two decades before the Bookkeeping Act extended digital discipline to private trade. This is a duty to issue, and it is what the B2G status rests on.'
 WHERE milestone_id = 'dk-b2g-2005' AND lang = 'en';
UPDATE milestone_translations SET
  system = 'Lieferanten müssen den öffentlichen Sektor über NemHandel e-fakturieren',
  desc = 'Dänemark verlangt seit 2005, dass Lieferanten strukturierte E-Rechnungen über NemHandel an öffentliche Stellen senden — zwei Jahrzehnte bevor das Buchführungsgesetz die digitale Disziplin auf den Privathandel ausweitete. Das ist eine Ausstellungspflicht, und darauf beruht der B2G-Status.'
 WHERE milestone_id = 'dk-b2g-2005' AND lang = 'de';
UPDATE milestone_translations SET
  system = 'Les fournisseurs doivent e-facturer le secteur public via NemHandel',
  desc = 'Le Danemark impose depuis 2005 aux fournisseurs d''envoyer des factures électroniques structurées aux autorités publiques via NemHandel — deux décennies avant que la loi comptable n''étende cette discipline au commerce privé. C''est une obligation d''émettre, et c''est ce qui fonde le statut B2G.'
 WHERE milestone_id = 'dk-b2g-2005' AND lang = 'fr';
UPDATE milestone_translations SET
  system = 'Los proveedores deben facturar al sector público por NemHandel',
  desc = 'Dinamarca exige desde 2005 que los proveedores envíen facturas electrónicas estructuradas a las autoridades públicas por NemHandel — dos décadas antes de que la Ley de Contabilidad extendiera esa disciplina al comercio privado. Es un deber de emitir, y es lo que sostiene el estado B2G.'
 WHERE milestone_id = 'dk-b2g-2005' AND lang = 'es';

-- ---- the United States gets the instrument that actually binds ------

INSERT OR REPLACE INTO milestones
  (id, country_id, date, anchor, source_url, on_tracker, portals, confidence,
   mandate_scope, obligation_status)
  SELECT 'us-dfars-2003', id, '2003-03-01', 0,
         'https://www.ecfr.gov/current/title-48/chapter-2/subchapter-H/part-252/subpart-252.2/section-252.232-7003',
         1, NULL, NULL, 'b2g_only', 'live'
  FROM countries WHERE name_en = 'United States';

INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('us-dfars-2003', 'en',
  'DoD contractors must submit payment requests electronically (DFARS 252.232-7003)',
  'The interim rule at 68 FR 8455, effective 1 March 2003, created DFARS subpart 232.70 and clause 252.232-7003: the Contractor shall submit payment requests and receiving reports in electronic form. It implements 10 U.S.C. 2227, now 4601, enacted 30 October 2000. A phase-in was requested during consultation and refused. From 2012 WAWF became the single channel, and the 2018 revision made facsimile, email and scanned documents unacceptable. This is a duty on the supplier to issue, and DoD is roughly 59% of federal contract obligations — there is no FAR-wide equivalent.',
  'If you hold or bid for a DoD contract, check it for clause 252.232-7003 and register in PIEE/WAWF before your first invoice. Selling to Treasury, VA or EPA means a different clause and a different platform; selling to GSA means electronic submission is rewarded, not required.');
INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('us-dfars-2003', 'de',
  'DoD-Auftragnehmer müssen Zahlungsanforderungen elektronisch einreichen (DFARS 252.232-7003)',
  'Die Interimsregel 68 FR 8455, wirksam zum 1. März 2003, schuf DFARS Unterabschnitt 232.70 und die Klausel 252.232-7003: Der Auftragnehmer hat Zahlungsanforderungen und Wareneingangsmeldungen in elektronischer Form einzureichen. Sie setzt 10 U.S.C. 2227, heute 4601, vom 30. Oktober 2000 um. Eine Übergangsfrist wurde beantragt und abgelehnt. Ab 2012 wurde WAWF zum einzigen Kanal, und die Fassung von 2018 erklärte Fax, E-Mail und Scans für unzulässig. Das ist eine Ausstellungspflicht des Lieferanten, und auf das DoD entfallen rund 59% der Bundesauftragsvolumina — ein FAR-weites Gegenstück gibt es nicht.',
  'Wer einen DoD-Auftrag hält oder anstrebt, prüft ihn auf die Klausel 252.232-7003 und registriert sich vor der ersten Rechnung in PIEE/WAWF. Für Treasury, VA und EPA gelten andere Klauseln und Plattformen; bei der GSA wird die elektronische Einreichung belohnt, nicht verlangt.');
INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('us-dfars-2003', 'fr',
  'Les titulaires de marchés DoD doivent soumettre leurs demandes de paiement par voie électronique (DFARS 252.232-7003)',
  'La règle intérimaire 68 FR 8455, en vigueur le 1er mars 2003, a créé la sous-partie DFARS 232.70 et la clause 252.232-7003 : le titulaire doit soumettre ses demandes de paiement et ses accusés de réception sous forme électronique. Elle met en œuvre 10 U.S.C. 2227, aujourd''hui 4601, adopté le 30 octobre 2000. Une période de transition a été demandée puis refusée. À partir de 2012, WAWF est devenu le canal unique, et la révision de 2018 a rendu télécopie, courriel et documents scannés irrecevables. C''est une obligation d''émettre pesant sur le fournisseur, et le DoD représente environ 59% des engagements contractuels fédéraux — il n''existe aucun équivalent au niveau du FAR.',
  'Si vous détenez ou visez un marché du DoD, vérifiez la présence de la clause 252.232-7003 et inscrivez-vous dans PIEE/WAWF avant votre première facture. Vendre au Treasury, au VA ou à l''EPA suppose une autre clause et une autre plateforme ; vendre à la GSA signifie que la voie électronique est récompensée, pas imposée.');
INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('us-dfars-2003', 'es',
  'Los contratistas del DoD deben presentar sus solicitudes de pago electrónicamente (DFARS 252.232-7003)',
  'La norma provisional 68 FR 8455, vigente desde el 1 de marzo de 2003, creó la subparte DFARS 232.70 y la cláusula 252.232-7003: el contratista deberá presentar las solicitudes de pago y los informes de recepción en forma electrónica. Aplica el 10 U.S.C. 2227, hoy 4601, promulgado el 30 de octubre de 2000. Se pidió un periodo de transición y se denegó. Desde 2012 WAWF pasó a ser el único canal, y la revisión de 2018 declaró inadmisibles el fax, el correo electrónico y los documentos escaneados. Es un deber de emitir del proveedor, y el DoD supone cerca del 59% de las obligaciones contractuales federales — no existe equivalente en el FAR.',
  'Si tiene o busca un contrato del DoD, revise si incluye la cláusula 252.232-7003 y regístrese en PIEE/WAWF antes de su primera factura. Vender al Treasury, al VA o a la EPA implica otra cláusula y otra plataforma; vender a la GSA significa que la vía electrónica se premia, no se exige.');

-- ---- and the OMB memo stops being described as the mandate ----------
--
-- The row stays on the board -- an agency-readiness deadline is a real
-- event a reader should see -- but it may not read as a supplier duty,
-- and its mandate_scope was already correctly 'none'.
UPDATE milestone_translations SET
  system = 'OMB''s FY2018 deadline for agencies to invoice electronically passes',
  desc = 'Memorandum M-15-19 directed federal AGENCIES — not their suppliers — to move to electronic invoicing for appropriate procurements by the end of fiscal 2018, via a shared service provider or an approved solution such as Treasury''s IPP. It excludes utilities, charge-card payments and several other categories, and it obliges no supplier to do anything. A supplier''s own duty comes from its buying agency''s acquisition regulation.'
 WHERE milestone_id = 'us-federal-b2g' AND lang = 'en';
UPDATE milestone_translations SET
  system = 'OMB-Frist für Behörden zur elektronischen Rechnungsstellung (FY2018) läuft ab',
  desc = 'Das Memorandum M-15-19 wies BUNDESBEHÖRDEN — nicht deren Lieferanten — an, bis Ende des Haushaltsjahres 2018 bei geeigneten Beschaffungen auf elektronische Rechnungsstellung umzustellen, über einen Shared-Service-Provider oder eine genehmigte Lösung wie die IPP des Finanzministeriums. Versorgungsleistungen, Kartenzahlungen und weitere Kategorien sind ausgenommen, und kein Lieferant wird dadurch zu irgendetwas verpflichtet. Die Pflicht eines Lieferanten ergibt sich aus der Beschaffungsordnung der kaufenden Behörde.'
 WHERE milestone_id = 'us-federal-b2g' AND lang = 'de';
UPDATE milestone_translations SET
  system = 'L''échéance OMB de l''exercice 2018 pour la facturation électronique des agences arrive',
  desc = 'Le mémorandum M-15-19 a enjoint aux AGENCES fédérales — et non à leurs fournisseurs — de passer à la facturation électronique pour les achats appropriés avant la fin de l''exercice 2018, via un prestataire de services partagés ou une solution approuvée telle que l''IPP du Trésor. Il exclut les services publics, les paiements par carte et plusieurs autres catégories, et n''impose rien à aucun fournisseur. L''obligation d''un fournisseur découle de la réglementation d''achat de l''agence acheteuse.'
 WHERE milestone_id = 'us-federal-b2g' AND lang = 'fr';
UPDATE milestone_translations SET
  system = 'Vence el plazo del OMB para que las agencias facturen electrónicamente (ejercicio 2018)',
  desc = 'El memorando M-15-19 ordenó a las AGENCIAS federales — no a sus proveedores — pasar a la facturación electrónica en las compras apropiadas antes del cierre del ejercicio 2018, mediante un proveedor de servicios compartidos o una solución aprobada como la IPP del Tesoro. Excluye suministros, pagos con tarjeta y otras categorías, y no obliga a ningún proveedor a nada. El deber de un proveedor nace de la reglamentación de compras de la agencia que compra.'
 WHERE milestone_id = 'us-federal-b2g' AND lang = 'es';

-- ---- the tile's source becomes the regulation, not a mirror ---------
--
-- law.cornell.edu is graded secondary and reproduces the CFR; the eCFR
-- is the CFR. The date is the one the duty actually began.
UPDATE country_headline_facts SET
  b2g_source = 'https://www.ecfr.gov/current/title-48/chapter-2/subchapter-H/part-252/subpart-252.2/section-252.232-7003',
  b2g_date = '2003-03-01'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'United States');

-- The old note credited IPP with obliging people. It does not.
UPDATE country_headline_fact_translations SET
  b2g_note = 'No FAR-wide rule; the duty is by agency clause. DoD''s DFARS 252.232-7003 has required WAWF submission since 2003.'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = 'United States');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Keine FAR-weite Regel; die Pflicht folgt aus Behördenklauseln. DoD DFARS 252.232-7003 verlangt WAWF seit 2003.'
 WHERE lang = 'de' AND country_id = (SELECT id FROM countries WHERE name_en = 'United States');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Aucune règle FAR générale ; l''obligation vient des clauses d''agence. DoD DFARS 252.232-7003 impose WAWF depuis 2003.'
 WHERE lang = 'fr' AND country_id = (SELECT id FROM countries WHERE name_en = 'United States');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Sin regla FAR general; la obligación viene de cláusulas de agencia. DoD DFARS 252.232-7003 exige WAWF desde 2003.'
 WHERE lang = 'es' AND country_id = (SELECT id FROM countries WHERE name_en = 'United States');

-- ---- and the deep-dive card stops being an IPP-only story -----------

UPDATE deep_dive_card_translations SET
  note = 'Which agency you sell to decides whether you have a duty at all — there is no government-wide rule, and GSA rewards electronic submission rather than requiring it.',
  rows_json = '[["DoD — ~59% of contract dollars", "DFARS 252.232-7003: WAWF, mandatory since 2003"], ["Treasury, VA, EPA", "Own clauses mandating IPP or an equivalent"], ["GSA", "Electronic submission incentivised, not required"], ["Scope", "Federal agency procurement only — not the DBNAlliance network"]]'
 WHERE card_id = 283 AND lang = 'en';
UPDATE deep_dive_card_translations SET
  note = 'Ob überhaupt eine Pflicht besteht, entscheidet die Behörde, an die Sie verkaufen — eine bundesweite Regel gibt es nicht, und die GSA belohnt die elektronische Einreichung, statt sie zu verlangen.',
  rows_json = '[["DoD — ~59% des Auftragsvolumens", "DFARS 252.232-7003: WAWF, verpflichtend seit 2003"], ["Treasury, VA, EPA", "Eigene Klauseln, die IPP oder Gleichwertiges vorschreiben"], ["GSA", "Elektronische Einreichung wird belohnt, nicht verlangt"], ["Umfang", "Nur Beschaffung durch Bundesbehörden — nicht das DBNAlliance-Netzwerk"]]'
 WHERE card_id = 283 AND lang = 'de';
UPDATE deep_dive_card_translations SET
  note = 'C''est l''agence à laquelle vous vendez qui décide si vous avez une obligation — il n''existe aucune règle fédérale générale, et la GSA récompense la voie électronique au lieu de l''imposer.',
  rows_json = '[["DoD — ~59% des engagements", "DFARS 252.232-7003 : WAWF, obligatoire depuis 2003"], ["Treasury, VA, EPA", "Clauses propres imposant l''IPP ou un équivalent"], ["GSA", "Voie électronique récompensée, non imposée"], ["Portée", "Uniquement la passation de marchés des agences fédérales — pas le réseau DBNAlliance"]]'
 WHERE card_id = 283 AND lang = 'fr';
UPDATE deep_dive_card_translations SET
  note = 'La agencia a la que venda decide si tiene obligación alguna — no hay regla federal general, y la GSA premia la vía electrónica en lugar de exigirla.',
  rows_json = '[["DoD — ~59% de los importes", "DFARS 252.232-7003: WAWF, obligatorio desde 2003"], ["Treasury, VA, EPA", "Cláusulas propias que imponen IPP o equivalente"], ["GSA", "Vía electrónica premiada, no exigida"], ["Alcance", "Solo contratación de agencias federales — no la red DBNAlliance"]]'
 WHERE card_id = 283 AND lang = 'es';

-- ---- Slovenia said "must receive" and meant the opposite ------------
--
-- Not a classification error -- b2g_only is right, and the tile agrees.
-- The TITLE was wrong. ZOPSPU requires the public sector to accept
-- invoices EXCLUSIVELY in electronic form, which is a duty on the
-- supplier to send one: there is no other way to be paid. Its own
-- source is a government page whose headline reads "obvezno posiljanje
-- racunov v javni sektor v elektronski obliki" -- mandatory SENDING.
UPDATE milestone_translations SET
  system = 'ZOPSPU: budget users accept invoices only in electronic form'
 WHERE milestone_id = 'si-b2g-2015' AND lang = 'en';
UPDATE milestone_translations SET
  system = 'ZOPSPU: Haushaltsnutzer akzeptieren Rechnungen nur elektronisch'
 WHERE milestone_id = 'si-b2g-2015' AND lang = 'de';
UPDATE milestone_translations SET
  system = 'ZOPSPU : les entités budgétaires n''acceptent les factures que sous forme électronique'
 WHERE milestone_id = 'si-b2g-2015' AND lang = 'fr';
UPDATE milestone_translations SET
  system = 'ZOPSPU: los usuarios presupuestarios solo aceptan facturas electrónicas'
 WHERE milestone_id = 'si-b2g-2015' AND lang = 'es';

-- ---- Iceland was the one that did not survive the check -------------
--
-- Checking the same pattern in Iceland found an ACTIVE B2G tile whose
-- note cited reglugerd 44/2019 -- which, read directly, obliges nobody
-- to issue. Its 1. gr. states the aim is "ad tryggja ad opinberir adilar
-- taki vid rafraenum reikningi" (to ensure PUBLIC BODIES RECEIVE), and
-- 4. gr. binds "kaupendur i opinberum innkaupum" -- buyers. Iceland did
-- not go beyond Directive 2014/55/EU. Both Icelandic milestones on the
-- board said the same thing in their own titles, and the tile's only
-- source was a vendor blog.
--
-- The duty is real, and it is somewhere else: the State's general terms
-- of business (Almennir vidskiptaskilmalar rikisins, 1.10.2022), which
-- a supplier "telst hafa undirgengist" -- is deemed to have accepted --
-- on taking a state order unless otherwise agreed. Section 3 requires
-- TS-236 delivered through a message broker and says "Reikningi a pappir
-- verdur hafnad": a paper invoice will be refused. A PDF is not an
-- electronic invoice.
--
-- SO THE STATUS STANDS AND THE REASONING CHANGES, which is the same
-- shape as the United States above: a duty that arrives through the
-- contract rather than through a statute is still a duty, and the note
-- must name the instrument that actually binds. This is NOT Canada,
-- where CRA accepts paper and no penalty attaches.
--
-- The date stays 1 January 2020 because that is when Fjarsyslan began
-- returning paper invoices -- the day the duty started biting. It is an
-- administrative date, not a commencement, and the note says which.

UPDATE milestones SET mandate_scope = 'none'
 WHERE id IN ('is-b2g-state-2019', 'is-b2g-municipal-2020');

INSERT OR REPLACE INTO milestones
  (id, country_id, date, anchor, source_url, on_tracker, portals, confidence,
   mandate_scope, obligation_status)
  SELECT 'is-supplier-terms-2020', id, '2020-01-01', 0,
         'https://www.stjornarradid.is/library/03-Verkefni/Rekstur-og-eignir-rikisins/Vidskiptaskilmalar-rikisins2022.pdf',
         1, NULL, NULL, 'b2g_only', 'live'
  FROM countries WHERE name_en = 'Iceland';

INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('is-supplier-terms-2020', 'en',
  'Paper invoices to the Icelandic state are refused',
  'From 1 January 2020 Fjarsysla rikisins began returning paper invoices. The requirement itself is in the State''s general terms of business, which a supplier is deemed to have accepted on taking a state order unless otherwise agreed: an invoice must follow the TS-236 technical specification and be delivered through a message broker, and a PDF does not count as an electronic invoice. Reglugerd 44/2019, often cited for this, does not say it — it obliges public buyers to receive, not suppliers to send.',
  'Register to send TS-236 through a message broker before invoicing an Icelandic state body; a free portal is offered for suppliers who cannot send structurally. If you have a negotiated contract, check whether it displaces the general terms — they apply only "unless otherwise agreed".');
INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('is-supplier-terms-2020', 'de',
  'Papierrechnungen an den isländischen Staat werden zurückgewiesen',
  'Seit dem 1. Januar 2020 weist Fjarsysla rikisins Papierrechnungen zurück. Die Anforderung selbst steht in den Allgemeinen Geschäftsbedingungen des Staates, denen ein Lieferant mit Annahme eines staatlichen Auftrags als unterworfen gilt, sofern nichts anderes vereinbart ist: Die Rechnung muss der technischen Spezifikation TS-236 folgen und über einen Nachrichtenvermittler übermittelt werden; ein PDF gilt nicht als E-Rechnung. Die häufig dafür zitierte Reglugerd 44/2019 sagt das nicht — sie verpflichtet öffentliche Käufer zum Empfang, nicht Lieferanten zum Versand.',
  'Vor der ersten Rechnung an eine isländische Staatsstelle für den TS-236-Versand über einen Nachrichtenvermittler registrieren; für Lieferanten ohne strukturierte Übermittlung steht ein kostenloses Portal bereit. Bei ausgehandelten Verträgen prüfen, ob sie die Allgemeinen Bedingungen verdrängen — diese gelten nur "sofern nichts anderes vereinbart ist".');
INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('is-supplier-terms-2020', 'fr',
  'Les factures papier adressées à l''État islandais sont refusées',
  'Depuis le 1er janvier 2020, Fjarsysla rikisins renvoie les factures papier. L''exigence elle-même figure dans les conditions générales de l''État, qu''un fournisseur est réputé avoir acceptées en prenant une commande publique sauf accord contraire : la facture doit suivre la spécification technique TS-236 et transiter par un intermédiaire de messages, et un PDF ne vaut pas facture électronique. La reglugerd 44/2019, souvent citée à ce titre, ne dit pas cela — elle oblige les acheteurs publics à recevoir, non les fournisseurs à envoyer.',
  'Inscrivez-vous pour émettre en TS-236 via un intermédiaire de messages avant de facturer un organisme d''État islandais ; un portail gratuit existe pour les fournisseurs qui ne peuvent pas émettre en format structuré. En cas de contrat négocié, vérifiez s''il écarte les conditions générales — elles ne valent que « sauf accord contraire ».');
INSERT OR REPLACE INTO milestone_translations (milestone_id, lang, system, desc, actions)
 VALUES ('is-supplier-terms-2020', 'es',
  'Las facturas en papel al Estado islandés se rechazan',
  'Desde el 1 de enero de 2020 Fjarsysla rikisins devuelve las facturas en papel. La exigencia está en las condiciones generales de contratación del Estado, que se entiende que un proveedor acepta al tomar un pedido público salvo pacto en contrario: la factura debe seguir la especificación técnica TS-236 y entregarse por un intermediario de mensajes, y un PDF no cuenta como factura electrónica. La reglugerd 44/2019, citada a menudo para esto, no lo dice — obliga a los compradores públicos a recibir, no a los proveedores a enviar.',
  'Regístrese para emitir en TS-236 por un intermediario de mensajes antes de facturar a un ente estatal islandés; hay un portal gratuito para proveedores que no puedan emitir en formato estructurado. Si tiene contrato negociado, compruebe si desplaza las condiciones generales — solo rigen "salvo pacto en contrario".');

UPDATE country_headline_facts SET
  b2g_source = 'https://www.stjornarradid.is/library/03-Verkefni/Rekstur-og-eignir-rikisins/Vidskiptaskilmalar-rikisins2022.pdf'
 WHERE country_id = (SELECT id FROM countries WHERE name_en = 'Iceland');

UPDATE country_headline_fact_translations SET
  b2g_note = 'Duty is in the State''s business terms, not reg. 44/2019: TS-236 via a broker, paper refused from 2020.'
 WHERE lang = 'en' AND country_id = (SELECT id FROM countries WHERE name_en = 'Iceland');
UPDATE country_headline_fact_translations SET
  b2g_note = 'Pflicht steht in den Staats-AGB, nicht in reg. 44/2019: TS-236 über Vermittler, Papier ab 2020 abgelehnt.'
 WHERE lang = 'de' AND country_id = (SELECT id FROM countries WHERE name_en = 'Iceland');
UPDATE country_headline_fact_translations SET
  b2g_note = 'L''obligation est dans les conditions de l''État, pas dans reg. 44/2019 : TS-236, papier refusé dès 2020.'
 WHERE lang = 'fr' AND country_id = (SELECT id FROM countries WHERE name_en = 'Iceland');
UPDATE country_headline_fact_translations SET
  b2g_note = 'El deber está en las condiciones del Estado, no en reg. 44/2019: TS-236, papel rechazado desde 2020.'
 WHERE lang = 'es' AND country_id = (SELECT id FROM countries WHERE name_en = 'Iceland');

-- ---- the new hosts --------------------------------------------------

INSERT OR REPLACE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('ecfr.gov', 'primary', 'Electronic Code of Federal Regulations, US Office of the Federal Register / GPO', '2026-08-23'),
  ('stjornarradid.is', 'primary', 'Government Offices of Iceland', '2026-08-23');

-- ---- what this migration claims it did ------------------------------

-- ASSERT: SELECT b2g_date FROM country_headline_facts WHERE country_id = (SELECT id FROM countries WHERE name_en = 'United States') = '2003-03-01'
-- ASSERT: SELECT count(*) FROM milestones WHERE id = 'us-dfars-2003' AND on_tracker = 1 AND mandate_scope = 'b2g_only' = 1
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE milestone_id = 'us-dfars-2003' = 4
-- ASSERT: SELECT count(*) FROM milestones WHERE id = 'dk-b2g-2005' AND on_tracker = 1 AND mandate_scope = 'b2g_only' = 1
-- ASSERT: SELECT count(*) FROM milestones WHERE id = 'is-supplier-terms-2020' AND on_tracker = 1 AND mandate_scope = 'b2g_only' = 1
-- ASSERT: SELECT count(*) FROM milestone_translations WHERE milestone_id = 'is-supplier-terms-2020' = 4
-- ASSERT: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.name_en = 'Iceland' AND f.b2g_source LIKE '%stjornarradid.is%' = 1

-- THE SIXTEEN THAT MOVED. Counted rather than listed one by one, so a
-- regenerated file that silently dropped one fails here.
-- ASSERT: SELECT count(*) FROM milestones WHERE mandate_scope = 'none' AND id IN ('de-receive','no-receive','dk-established','dk-small','ee-b2b-buyer-request-2025','au-ncereceive','au-30pct','au-automate','bg-b2g-2019','cy-b2g-subcentral-2020','mt-b2g-2018','mt-b2g-subcentral-2020','nz-central','nz-2000','is-b2g-state-2019','is-b2g-municipal-2020') = 16

-- ---- and what must stay true afterwards -----------------------------

-- A LEXICAL INVARIANT WAS DRAFTED HERE AND DELIBERATELY REMOVED.
--
-- It read: no on_tracker milestone scoped 'b2b' or 'b2g_only' may have
-- "must receive" or its variants in its title. It failed on three rows,
-- and only one of the three was a defect:
--
--   Ireland ie-phase1 -- "large corporates must issue e-invoices; all
--     businesses must receive". A correct title for a real issuing
--     mandate that happens to name both duties. A pure false positive.
--   Slovenia si-b2g-2015 -- a badly worded title over correct data,
--     fixed above by rewriting the title rather than the classification.
--   Iceland is-b2g-state-2019 -- the real defect, fixed above.
--
-- One catch out of three is the ratio that gets a check switched off,
-- and render-lint.mjs already carries this repository's argument about
-- a lint that flagged six correct lines. The structural check is the
-- one worth keeping: tests/map-tiles-agree.mjs computes the map's
-- status for all seventy countries and compares it against the headline
-- tiles, which needs no vocabulary and cannot be fooled by phrasing.

-- THE UNITED STATES KEEPS AN INSTRUMENT THAT BINDS A SUPPLIER. If a
-- later edit removes us-dfars-2003 from the board, the ACTIVE B2G tile
-- goes back to standing on an agency-readiness memo.
-- ASSERT ALWAYS: SELECT count(*) FROM milestones WHERE id = 'us-dfars-2003' AND on_tracker = 1 AND mandate_scope = 'b2g_only' = 1

-- AND THE TILE STAYS SOURCED TO THE REGULATION, NOT TO A MIRROR OF IT.
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts f JOIN countries c ON c.id = f.country_id WHERE c.name_en = 'United States' AND f.b2g_source LIKE '%ecfr.gov%' = 1
