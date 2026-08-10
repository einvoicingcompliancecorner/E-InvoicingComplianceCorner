-- ================================================================
-- Malta (MT) milestones + EN translations. 5 milestones, 4 on the
-- tracker board (anchor: the 30 Nov 2018 B2G legal notices).
-- Deliberately the smallest milestone set built for any country
-- this project's history -- Malta's regime is genuinely this thin
-- (not even a supplier-side B2G obligation, just a receiving-
-- capability requirement for contracting authorities), and padding
-- the count would misrepresent that.
--
-- Sourcing (10 Aug 2026 research session, house standard): the
-- European Commission's factsheets (2019 and 2025 editions) and
-- Malta's own official pages -- the Ministry for Finance's
-- e-Invoicing page and, critically, the Malta Tax and Customs
-- Administration's (MTCA) own "E-Invoicing and DRR" page -- are the
-- primary sources. The MTCA page quote was independently re-fetched
-- and confirmed directly this session: "The Malta Tax and Customs
-- Administration (MTCA) is actively studying the implementation of
-- e-invoicing and real-time reporting... ensuring Malta is
-- ViDA-ready by 2030" -- preparatory language only, no committed
-- domestic date. One source was found and explicitly excluded: a
-- VATupdate article on Malta discloses its own content was
-- "partially AI-generated" -- used only as a loose cross-check
-- against Deloitte/EC, never as a primary citation.
--
-- Deliberately excluded/hedged: the exact publication date of the
-- transposing legal notices (EC factsheet says 30 Nov 2018;
-- legislation.mt's S.L. 601.10 shows 19 Dec 2018 -- both noted,
-- neither silently preferred); "Legal Notices 403 and 404 of 2018"
-- (cited by Sovos/openenvoy but not independently verified on
-- legislation.mt this round -- fetch attempts were blocked); the
-- April 2020 sub-central capability date (industry-sourced only,
-- flagged as such); any penalty figure (none exists -- there is no
-- mandate yet to penalize, confirmed by both the EC factsheet and
-- MTCA's own page).
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'mt-b2g-2018', id, '2018-11-30', 1,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983590/2025+Malta+2025+eInvoicing+Country+Sheet',
    1, '[{"label": "Ministry for Finance -- e-Invoicing", "url": "https://finance.gov.mt/resources/einvoicing/"}]', NULL, 'b2g_only'
  FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'mt-b2g-2018', 'en',
  'Public contracting authorities must be able to receive e-invoices',
  'Legal notices transposing EU Directive 2014/55/EU were published 30 November 2018 (per the European Commission''s own factsheet; Malta''s official legislation portal separately shows an enactment date of 19 December 2018 for the implementing regulations, Subsidiary Legislation 601.10 -- both dates are recorded here rather than one silently picked), amending the Financial Administration and Audit Act (Cap. 174) and the Local Councils Act (Cap. 363). This is NOT a supplier mandate: the binding obligation is only that Maltese central, sub-central and local contracting authorities must be able to receive and process EN 16931-compliant e-invoices for procurement above the EU thresholds -- suppliers are not legally required to send them. Malta has no centralized national platform; it relies on the Peppol network, with the Ministry for Finance contracting Pagero as its certified Peppol service provider following the EU-funded "eInvoicing4Islands" project (2019-2021).', '["Historical context -- confirms Maltese public bodies CAN receive e-invoices, not that suppliers must send them", "Suppliers to Maltese public bodies may submit structured EN 16931 e-invoices via a Peppol Access Point or enter invoices manually through the relevant portal"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'mt-b2g-subcentral-2020', id, '2020-04-18', 0,
    'https://sovos.com/vat/tax-rules/malta-e-invoicing/',
    1, '[]', NULL, 'b2g_only'
  FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'mt-b2g-subcentral-2020', 'en',
  'Sub-central contracting authorities'' receiving capability deadline',
  'April 2020 is repeatedly cited by industry sources as when Malta''s sub-central public contracting authorities needed to be capable of receiving EN 16931 e-invoices -- consistent with the general EU Directive 2014/55/EU staggered deadline structure (central bodies by 18 Apr 2019, sub-central by 18 Apr 2020) but not found stated explicitly on an official Maltese government page during this research round, so it is recorded as industry-sourced rather than officially confirmed.', '[]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'mt-peppol-pagero', id, '2021-09-01', 0,
    'https://www.pagero.com/news/malta-selects-pagero-for-provision-of-peppol-services/',
    0, '[{"label": "Pagero -- Malta''s contracted Peppol service provider", "url": "https://www.pagero.com/news/malta-selects-pagero-for-provision-of-peppol-services/"}]', NULL, 'none'
  FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'mt-peppol-pagero', 'en',
  'Pagero contracted as Malta''s Peppol service provider',
  'During the EU-funded "eInvoicing4Islands" project (June 2019 to roughly Q3 2021), the Ministry for Finance ran a public tender and contracted Pagero to deliver Malta''s Peppol networking and e-invoicing service -- confirmed by Pagero''s own press release. This gave Malta its e-invoicing infrastructure without building a bespoke national platform, unlike most other tracked EU countries.', '[]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'mt-b2b-voluntary', id, '2018-11-30', 0,
    'https://mtca.gov.mt/business-tax/vat1/vat-information/e-invoicing-and-drr/e-invoicing-and-drr',
    1, '[]', NULL, 'none'
  FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'mt-b2b-voluntary', 'en',
  'B2B e-invoicing remains voluntary -- no mandate, no target date, no draft legislation',
  'Malta has no business-to-business e-invoicing mandate and no committed date for one. The Malta Tax and Customs Administration''s (MTCA) own page states: "The Malta Tax and Customs Administration (MTCA) is actively studying the implementation of e-invoicing and real-time reporting... ensuring Malta is ViDA-ready by 2030" -- preparatory language, not a legislated plan. The European Commission''s own factsheet confirms the same: "no Business-to-Business mandate in place... usage remains optional." No penalty regime exists for e-invoicing or digital-reporting non-compliance, because no such obligation currently exists to enforce.', '["No domestic B2B e-invoicing action required today", "Monitor MTCA (mtca.gov.mt) for any future domestic mandate announcement -- none exists as of this research round"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'mt-vida-2030', id, '2030-07-01', 0,
    'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516',
    1, '[{"label": "Council Directive (EU) 2025/516", "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516"}]', NULL, 'b2b'
  FROM countries WHERE code = 'MT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'mt-vida-2030', 'en',
  'ViDA cross-border B2B e-invoicing and digital reporting become mandatory (confirmed EU law)',
  'From 1 July 2030, under Council Directive (EU) 2025/516, structured e-invoicing and digital reporting become mandatory for all intra-Community B2B supplies. This is the same date MTCA itself references as its "ViDA-ready" target -- Malta''s own public statements describe working toward this EU floor, not toward an earlier domestic mandate.', '["Prepare for mandatory structured e-invoicing on all intra-EU B2B trade from mid-2030", "Malta''s current infrastructure (Peppol via Pagero, from the B2G rollout) provides a starting technical base, though no domestic B2B rollout plan exists yet"]'
);
