-- ================================================================
-- Azerbaijan (AZ) milestones + EN translations.
--
-- SOURCING (10 Aug 2026 deep-research pass, house standard). The
-- State Tax Service's own site (taxes.gov.az) was fetched directly in
-- AZ, EN and RU, along with its 2017 e-qaime presentation and
-- leaflet, its 2024 e-qaime user guide, its 2025 financial-sanctions
-- booklet, and its 2026 amendments FAQ -- these carry the substantive
-- claims below. Cabinet of Ministers decision texts were read on
-- nk.gov.az. The consolidated Tax Code itself is served as a single
-- very large PDF that could not be retrieved in full, so no claim
-- here quotes statutory text verbatim; each rests instead on an
-- official State Tax Service publication or a Cabinet decision text.
--
-- TWO FIRST-PASS CLAIMS CORRECTED:
--   (1) The 1 Jan 2020 change did NOT replace *paper* VAT invoices.
--       Azerbaijan's predecessor document, the elektron vergi
--       hesab-fakturasi (e-VHF), had already been electronic since
--       roughly 2008-2012. What happened in 2020 was an
--       electronic-to-electronic merger of two systems into one
--       document -- a meaningfully different (and more interesting)
--       story, and one this page tells correctly.
--   (2) The non-resident digital-services VAT change of 23 Aug 2026
--       is a VAT-REGISTRATION obligation, not an e-invoicing one --
--       non-residents do not issue Azerbaijani e-invoices at all. It
--       is therefore deliberately NOT built as a milestone here; it
--       appears in the deep dive as a clearly-labelled related
--       development instead. This mirrors the Taiwan/Peppol and
--       Hungary/consultation precedents: real, dated, but not a
--       mandate-scope fact.
--
-- One widely-circulated industry article claims Azerbaijan "has
-- mandated e-invoicing since 2010 under Article 2 of the Tax Code."
-- That is false -- Article 2 concerns the basis of tax legislation,
-- and the operative article is 71-1, inserted for 1 April 2017. It is
-- named and rejected in a deep-dive card rather than silently
-- omitted, so a future editor does not reintroduce it.
--
-- Five milestones, all on_tracker. mandate_scope 'b2b' on the three
-- that create or widen a real issuance obligation (2017, 2018, 2020);
-- 'none' on the two procedural ones (2024 advance-payment invoices,
-- 2026 timing rules) -- both are real obligations but neither changes
-- who is in scope.
-- ================================================================

-- 1. The founding mandate. Anchor, off-board... but on_tracker so the
-- timeline reads properly; anchor=1 marks it as the origin point.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'az-e-qaime-2017', id, '2017-04-01', 1,
    'https://www.taxes.gov.az/en/page/elektron-qaime-faktura',
    1, '[{"label": "State Tax Service -- e-qaimə", "url": "https://www.taxes.gov.az/en/page/elektron-qaime-faktura"}]', NULL, 'b2b'
  FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'az-e-qaime-2017', 'en',
  'The e-qaimə mandate begins: VAT-registered and Article 218.1.2 taxpayers',
  'Cabinet of Ministers Decision No. 89 of 14 March 2017 approved the rules on the form, application, accounting and use of the electronic invoice, implementing new Tax Code Article 71-1. From 1 April 2017, persons registered for VAT purposes and persons falling under Tax Code Article 218.1.2 -- trade and public-catering businesses whose taxable transactions exceeded AZN 200,000 in any month of a rolling 12-month period -- had to issue electronic invoices for goods delivered, works performed and services rendered in the course of business. This start date and scope are confirmed on the State Tax Service''s own e-qaimə page.',
  '["This is the origin of the current obligation -- Article 71-1 remains the operative legal base today", "Note for anyone reading older commentary: claims that Azerbaijan mandated e-invoicing in 2010 under Tax Code Article 2 are incorrect"]'
);

-- 2. Universal. On-board, b2b.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'az-universal-2018', id, '2018-01-01', 0,
    'https://taxes.gov.az/uploads/2017/PV/e-qaime.pdf',
    1, NULL, NULL, 'b2b'
  FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'az-universal-2018', 'en',
  'E-invoicing extends to all remaining taxpayers',
  'From 1 January 2018 the second phase of the same Article 71-1 framework brought in all other taxpayers, beyond the VAT-registered and Article 218.1.2 populations covered from April 2017. From this point Azerbaijan''s mandate covers essentially the whole B2B commercial-supply population, with no revenue threshold on the e-invoicing obligation itself. The phasing is set out in the State Tax Service''s own e-qaimə presentation. Persons who are not registered as taxpayers cannot issue electronic invoices at all.',
  '["Any registered taxpayer supplying goods, works or services in Azerbaijan is in scope -- there is no size threshold to fall under", "The AZN 200,000 figure that appears in Azerbaijani e-invoicing commentary is a 2017-phase scoping threshold and a separate VAT-registration threshold; it is not an e-invoicing threshold today"]'
);

-- 3. e-VHF abolished, e-qaime becomes the single document. On-board, b2b.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'az-single-document-2020', id, '2020-01-01', 0,
    'https://azertag.az/xeber/gelen_ilden_elektron_vergi_hesab_fakturasi_elektron_qaime_faktura_ile_evezlenecek-1365961',
    1, NULL, NULL, 'b2b'
  FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'az-single-document-2020', 'en',
  'The electronic VAT invoice is abolished; e-qaimə becomes the single primary document',
  'From 1 January 2020 the electronic tax invoice (elektron vergi hesab-fakturası, e-VHF) was withdrawn and merged into the e-qaimə, which became the primary accounting document for all business transactions. VAT payers now use the e-qaimə itself as the document for calculating and offsetting input VAT -- previously it only evidenced the movement of goods. From the same date an issuer can no longer unilaterally cancel an invoice without the recipient''s consent, and nine distinct invoice types were introduced. Worth stating plainly, because it is often described wrongly: this was not a paper-to-digital step. Azerbaijan''s predecessor document had already been electronic since roughly 2008; 2020 merged two electronic systems into one.',
  '["If your systems still model VAT invoices and delivery notes as separate Azerbaijani documents, they are modelling a regime that ended in 2020", "Cancellation now needs the counterparty''s agreement -- build that into your credit-note and correction process"]'
);

-- 4. Advance-payment invoices. On-board, procedural.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'az-advance-invoice-2024', id, '2024-01-01', 0,
    'https://taxes.gov.az/uploads/2024/eqaime.pdf',
    1, NULL, NULL, 'none'
  FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'az-advance-invoice-2024', 'en',
  'Advance-payment electronic invoices become compulsory',
  'From 1 January 2024 an electronic invoice must be issued on the day an advance payment is received, and the later delivery invoice must cross-reference that advance invoice by series and number. The obligation is notably not limited to VAT payers -- simplified-tax, non-VAT and profit-tax payers are all caught. Unusually, late submission of an advance e-invoice specifically does not attract a financial sanction, unlike ordinary e-invoices. Secondary Azerbaijani tax portals cite this provision as Article 71-1.5.12 while the State Tax Service''s own 2026 FAQ cites the advance rule as Article 71-1.1.5; that numbering discrepancy could not be reconciled against a consolidated Tax Code text and is flagged rather than resolved here.',
  '["Trigger the invoice on receipt of the advance, not on delivery", "Carry the advance invoice''s series and number through to the delivery invoice", "Do not assume VAT registration is the test -- this one catches simplified-tax and non-VAT payers too"]'
);

-- 5. 2026 timing rules. On-board, procedural, currently live.
INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'az-timing-rules-2026', id, '2026-01-01', 0,
    'https://www.taxes.gov.az/uploads/2026/faq/FAQ2026.pdf',
    1, NULL, NULL, 'none'
  FROM countries WHERE code = 'AZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'az-timing-rules-2026', 'en',
  'The five-day service window closes for international transport and continuous services',
  'A law of 9 December 2025, applied by Presidential Decree No. 563 of 29 December 2025, inserted Tax Code Articles 71-1.1.3-1 and 71-1.1.3-2 with effect from 1 January 2026. The general five-day deadline for service invoices no longer applies to two categories. International transport services must be invoiced by the time the transport begins. Regularly and continuously supplied services -- security, cleaning, utilities, subscriptions -- must be invoiced for each calendar month at the point that month''s service provision begins, even where the contract provides for quarterly or annual billing. The stated rationale is to stop taxpayers using the five-day window to shift transactions between reporting periods.',
  '["If you bill Azerbaijani customers quarterly or annually for a continuous service, your invoicing cycle is now out of step with the law -- the e-invoice is monthly regardless of the billing cycle", "International transport: the invoice must exist before the transport starts, not within five days of it", "Note that a widely-cited industry summary still describes a blanket five-day rule; that has not been correct since the start of 2026"]'
);
