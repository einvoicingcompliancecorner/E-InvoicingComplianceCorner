-- ================================================================
-- Uzbekistan (UZ) milestones + EN translations.
--
-- SOURCING (10 Aug 2026 deep-research pass, house standard). Primary
-- sources on lex.uz (the national legislation database) and gov.uz
-- (the State Tax Committee's own portal) were fetched directly and
-- are cited on the milestones they support. soliq.uz and my.soliq.uz
-- are robots-blocked to automated fetching from this sandbox, so no
-- claim rests on them.
--
-- FOUR FIRST-PASS CLAIMS WERE CORRECTED BY THIS DEEPER PASS, and the
-- corrections are the reason this header is long:
--   (1) The "invoice by the 10th day of the following month" rule for
--       continuous supplies does NOT come from Resolution 168 of 2025.
--       It comes from Cabinet of Ministers Resolution No. 489 of
--       14 Aug 2020 (Appendix 2). Resolution 168/2025 is about
--       something else entirely -- the combined ESF-ETTN
--       invoice-and-waybill document.
--   (2) Uzbekistan is NOT a true pre-clearance regime, despite one
--       widely-circulated industry booklet describing it that way.
--       See 496's compliance_model field and its dedicated card --
--       the buyer, not the tax authority, is the validation gate.
--   (3) There are 27 registered EDO/ESF operators (Buxgalter.uz's
--       January 2026 comparison), not the ~15 an industry booklet
--       stated.
--   (4) Presidential Decree UP-153 is dated 4 Sep 2025, and the
--       risk-scoring mandate sits in its Article 4.
-- The single secondary source that carried errors (1), (3) and the
-- pre-clearance framing is deliberately NOT cited anywhere on this
-- country's pages.
--
-- Five milestones, all on_tracker. mandate_scope: the 2020 mandate
-- and the 2026 self-employed expansion are 'b2b' (real e-invoicing
-- issuance obligations); Resolution 489, the risk-scoring system and
-- the VAT-threshold change are 'none' (procedural/adjacent, not scope
-- changes to who must issue an e-invoice) -- same treatment as
-- Hungary's RTIR-era and Turkey's e-Defter entries.
-- ================================================================

-- 1. Resolution 522 -- the founding instrument. Anchor, off-board.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'uz-res-522-2019', id, '2019-06-25', 1,
    'https://lex.uz/en/docs/4386771',
    1, NULL, NULL, 'b2b'
  FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'uz-res-522-2019', 'en',
  'Cabinet of Ministers Resolution No. 522 establishes the ESF electronic invoice regime',
  'Resolution No. 522 of 25 June 2019, "On measures for improving the use of electronic invoices in the mutual settlement system," is the founding instrument of Uzbekistan''s electronic invoice (ESF / электрон счёт-фактура) regime. Its text sets electronic invoicing as voluntary from 1 July 2019 and mandatory from 1 January 2020 for all business entities. It also designates the state enterprise "Yangi Texnologiyalar" (New Technologies), under the tax authority, as the authorised roaming operator responsible for centralised storage and for transmission between competing private operators -- the hub that makes Uzbekistan''s multi-operator model interoperable rather than fragmented.',
  '["No action required today -- this is the historical legal foundation, cited so the 2020 mandate has a traceable origin", "If you need the operative text, lex.uz carries Resolution 522 in Russian with an English cover page"]'
);

-- 2. The mandate itself. On-board, b2b.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'uz-mandate-2020', id, '2020-01-01', 0,
    'https://lex.uz/en/docs/4386771',
    1, '[{"label": "State Tax Committee (gov.uz)", "url": "https://gov.uz/en/soliq"}]', NULL, 'b2b'
  FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'uz-mandate-2020', 'en',
  'Electronic invoicing becomes mandatory for all business entities',
  'From 1 January 2020, electronic invoices became compulsory for all economic entities in Uzbekistan, following a six-month voluntary phase from 1 July 2019. This is the anchor date for Uzbekistan''s mandate and the reason the country belongs on this tracker: a nationwide, universal B2B e-invoicing obligation that has been in force for over six years. Invoices are exchanged through the state system or any of the registered private operators, signed with a digital signature (ETsP) by the seller, and then confirmed or rejected by the buyer -- who also signs. Paper invoices survive only for transactions involving state secrets.',
  '["If you trade B2B in Uzbekistan you are already in scope -- there is no revenue threshold on the e-invoicing obligation itself", "Obtain an ETsP digital signature certificate through the tax authority''s key centre", "Choose between the state platform and a registered private operator -- interoperability between them is handled by the state roaming operator, so the choice does not lock you out of any counterparty"]'
);

-- 3. Resolution 489 -- the operational rulebook. On-board, procedural.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'uz-res-489-2020', id, '2020-08-14', 0,
    'https://lex.uz/docs/4948600',
    1, NULL, NULL, 'none'
  FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'uz-res-489-2020', 'en',
  'Resolution No. 489 sets the operating rules: invoice timing and the buyer''s 10-day window',
  'Cabinet of Ministers Resolution No. 489 of 14 August 2020 carries, in its Appendix 2, the regulation that actually governs day-to-day ESF practice: the form of the invoice, how it is completed, submitted and accepted. It sets the general rule that an invoice is dated the day of shipment or service, the special monthly rule for continuous supplies (issued by the 10th day of the following month), and the buyer''s 10-day window to accept or reject. Note for anyone cross-checking against industry commentary: the "10th day" rule is frequently and wrongly attributed to a 2025 resolution -- it originates here, in 2020.',
  '["Build the buyer''s 10-day acceptance window into your process -- once it lapses, the reject option disables and the seller can no longer cancel", "Invoices for digitally marked goods run on a much shorter clock: confirm or reject within one calendar day, or the system auto-confirms"]'
);

-- 4. Risk-scoring. On-board, adjacent but consequential.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'uz-risk-scoring-2026', id, '2026-01-01', 0,
    'https://lex.uz/ru/docs/7716363',
    1, NULL, NULL, 'none'
  FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'uz-risk-scoring-2026', 'en',
  'Real-time automated risk analysis of every electronic invoice begins',
  'Article 4 of Presidential Decree No. UP-153 of 4 September 2025 instructed the Tax Committee to deploy, from 1 January 2026, real-time automated risk analysis of every electronic invoice issued in Uzbekistan. Invoices are scored against undisclosed criteria and flagged; two consequences follow. High-risk invoices must not exceed 10% of all invoices a taxpayer issues in a reporting period, and input VAT on a high-risk invoice becomes creditable only once the tax has actually been paid into the budget by the seller or the buyer. The system was developed with IMF and CCAMTAC technical assistance. Importantly, it does not block invoices -- a flagged invoice is still validly issued; the consequence lands on the buyer''s VAT credit timing.',
  '["Buyers: check the risk status of inbound invoices before relying on the input VAT credit -- a flagged invoice defers, rather than denies, recovery", "Sellers: monitor your own flagged-invoice ratio against the 10% ceiling", "The criteria are deliberately not published, so this cannot be engineered around -- treat supplier due diligence as the real control"]'
);

-- 5. Self-employed brought in. On-board, b2b (real scope expansion).
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'uz-self-employed-2026', id, '2026-01-01', 0,
    'https://lex.uz/docs/7951016',
    1, NULL, NULL, 'b2b'
  FROM countries WHERE code = 'UZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'uz-self-employed-2026', 'en',
  'Self-employed persons brought into the invoicing obligation; returns pre-filled from invoice data',
  'Law No. ZRU-1108 of 25 December 2025, effective 1 January 2026, extends the invoicing obligation to self-employed persons on a par with legal entities and individual entrepreneurs -- a genuine widening of who must issue. The same law introduces something arguably more significant: the tax authority now generates VAT and turnover-tax returns automatically from ESF data, giving taxpayers five working days to correct them. That is the point at which Uzbekistan''s invoice feed stops being a compliance artefact and becomes the return itself.',
  '["Self-employed persons trading with businesses: you are now in scope and need a digital signature and an operator or state-platform account", "All taxpayers: review the pre-filled VAT return within the five working days allowed -- silence is acceptance", "Reconcile your own ledgers against the invoice feed continuously rather than at filing time, since the feed now drives the return"]'
);
