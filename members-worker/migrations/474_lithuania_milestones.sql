-- ================================================================
-- Lithuania (LT) milestones + EN translations. 7 milestones, 6 on
-- the tracker board (anchor: the 1 Jul 2017 B2G go-live).
--
-- Sourcing (10 Aug 2026 research session, house standard): the
-- European Commission's own "eInvoicing in Lithuania" country
-- factsheet (2025 edition, page 881983586, confirmed via two
-- independent live fetches this session) is the primary source for
-- the B2G date, legal basis, and B2B status. Cross-corroborated by
-- Sovos and a VATupdate country booklet for the SABIS platform
-- transition and i.SAF mechanics. i.SAF's own scope description
-- comes from VMI's (Lithuania's tax authority) own explainer page
-- (official, but that page gives no launch date) -- the 1 Oct 2016
-- start date itself rests on industry sources only (VATupdate
-- booklet, corroborated indirectly by a June 2017 Lithuanian
-- tax-practitioner article referencing 66,000 existing i.SAF users),
-- flagged accordingly below.
--
-- IMPORTANT, read before touching lt-b2b-2028-target: the EC's own
-- factsheet is internally inconsistent on this single most
-- attention-grabbing fact. Re-fetched directly and confirmed to
-- say, on the SAME page: "There is no business-to-business (B2B)
-- mandate" AND "mandatory eInvoicing targeted for 1 January 2028."
-- No enacted Lithuanian law, VMI order, or Seimas act corroborates
-- an actual 2028 mandate anywhere. Neighbouring Latvia has a real,
-- separately-enacted B2B mandate (originally 1 Jan 2026, confirmed
-- postponed to 1 Jan 2028 per KPMG, June 2025) -- several industry
-- retellings of "Lithuania 2028" (VATupdate, dddinvoices, vatcalc)
-- may be echoing the EC factsheet's own ambiguous wording, Latvia's
-- confirmed date, or some mix of both. Recorded here ONLY as an
-- 'expected'-confidence milestone with an explicit hedge in its own
-- description -- never presented as a confirmed mandate. Also
-- deliberately excluded: i.SAF-T's exact threshold/response-window
-- (two industry sources disagree, unresolved) and specific penalty
-- euro figures (two industry sources give different bands, neither
-- independently confirmed against the current Administrative
-- Offences Code text -- direct fetches of e-seimas.lrs.lt and
-- infolex.lt failed this round).
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lt-b2g-2017', id, '2017-07-01', 1,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet',
    1, '[{"label": "SABIS -- national e-invoicing platform", "url": "https://sabis.evaf.lt"}]', NULL, 'b2g_only'
  FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lt-b2g-2017', 'en',
  'B2G e-invoicing mandatory for all public procurement',
  'Since 1 July 2017, all suppliers to Lithuanian contracting authorities must submit structured e-invoices for public procurement contracts -- both above and below the EU procurement thresholds, a broader scope than the EU minimum. Legal basis: the Law on Public Procurement (Lietuvos Respublikos viešųjų pirkimų įstatymas), transposing EU Directive 2014/55/EU. Format: EN 16931, via Peppol BIS Billing 3.0 or CII.',
  '["Historical context -- no action needed for existing suppliers to Lithuanian public bodies", "Confirm invoices to Lithuanian contracting authorities are structured EN 16931 e-invoices, not PDF or paper"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lt-isaf-2016', id, '2016-10-01', 0,
    'https://www.vmi.lt/evmi/kokias-pvm-saskaitas-fakturas-privaloma-pateikti-pildant-i.saf-pvm-saskaitu-fakturu-registrus-',
    1, '[]', NULL, 'none'
  FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lt-isaf-2016', 'en',
  'i.SAF invoice-level VAT ledger reporting begins',
  'Since around October 2016 (date corroborated by industry sources, not independently dated by VMI''s own page), every VAT-registered entity in Lithuania -- domestic or foreign with an LT VAT number, no size threshold -- must file a monthly i.SAF report: a line-by-line ledger of sales and purchase VAT invoices, due by the 20th of the following month, with a nil report required even when no invoices were issued. This is a periodic, after-the-fact reporting obligation to the State Tax Inspectorate (VMI) -- comparable in concept to Spain''s SII or Bulgaria''s SAF-T -- not a real-time clearance system and not an e-invoicing mandate. The EU Commission''s own country factsheet confirms directly: "Currently, there is no real-time reporting system in Lithuania."', '["Confirm your accounting system produces a compliant monthly i.SAF export if you are VAT-registered in Lithuania", "Do not confuse this with an e-invoicing requirement -- it governs what you report about invoices, not how you issue or exchange them"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lt-sabis-2024', id, '2024-09-01', 0,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet',
    1, '[{"label": "SABIS -- national e-invoicing platform", "url": "https://sabis.evaf.lt"}]', NULL, 'b2g_only'
  FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lt-sabis-2024', 'en',
  'SABIS replaces the legacy "E. sąskaita" platform as the sole B2G channel',
  'In mid-to-late 2024 (sources disagree on the exact cut-over day -- variously reported as 1 July, "September," or "1 September after a two-month transition"), SABIS (Sąskaitų administravimo bendroji informacinė sistema) became Lithuania''s sole national B2G e-invoicing platform, replacing the older "E. sąskaita"/eSaskaita system launched in 2015. Suppliers can enter invoices manually via the web portal or transmit structured EN 16931 e-invoices over Peppol.', '["If you still reference the old E. sąskaita/eSaskaita system in supplier documentation, update it to SABIS"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lt-sabis-oral-contracts-2025', id, '2025-01-01', 0,
    'https://dddinvoices.com/learn/e-invoicing-in-lithuania',
    0, '[]', NULL, 'b2g_only'
  FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lt-sabis-oral-contracts-2025', 'en',
  'SABIS scope extends to invoices from orally-concluded procurement contracts',
  'From 1 January 2025 (industry-sourced; no official VMI/Public Procurement Office page independently confirming this date could be fetched this research round), invoices arising from verbally-concluded public procurement contracts -- previously only required to route through SABIS above a EUR 1,000 (excl. VAT) threshold -- must also be submitted through the platform regardless of value.', '[]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lt-b2b-voluntary', id, '2017-07-01', 0,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet',
    1, '[]', NULL, 'none'
  FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lt-b2b-voluntary', 'en',
  'B2B e-invoicing remains voluntary -- no CTC or clearance mandate',
  'Lithuania has no business-to-business e-invoicing mandate, no invoice-clearance system, and no real-time transaction reporting requirement -- confirmed directly by the European Commission''s own country factsheet ("There is no business-to-business (B2B) mandate" / "Currently, there is no real-time reporting system in Lithuania"). Structured B2B e-invoicing is optional, by mutual agreement between trading partners. The existing i.SAF obligation (above) is a separate, after-the-fact VAT reporting requirement, not an invoicing mandate.', '["No domestic B2B e-invoicing action required today", "Do not conflate the i.SAF reporting obligation with an e-invoicing mandate -- they are legally and operationally distinct"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lt-b2b-2028-target', id, '2028-01-01', 0,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983586/2025+Lithuania+2025+eInvoicing+Country+Sheet',
    1, '[]', 'expected', 'b2b'
  FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lt-b2b-2028-target', 'en',
  'A "1 January 2028" general B2B mandate is named in the EC''s own factsheet -- but this is NOT a confirmed Lithuanian law',
  'The European Commission''s own 2025 Lithuania eInvoicing Country Sheet names "1 January 2028" as a target for mandatory e-invoicing -- but the very same page separately states "There is no business-to-business (B2B) mandate," and no enacted Lithuanian law, VMI order, or Seimas act was found anywhere corroborating an actual 2028 mandate. Neighbouring Latvia has a real, separately-enacted B2B mandate that was itself postponed to exactly 1 January 2028 (KPMG, June 2025) -- raising a genuine possibility that some or all of the "Lithuania 2028" claims circulating in industry coverage trace back to this ambiguity or to conflation with Latvia''s confirmed date, rather than an independent Lithuanian commitment. Treat this date as directional at most, not confirmed -- it is recorded here only because it appears on an official EU source, with this hedge attached.', '["Do not treat 1 January 2028 as a confirmed compliance deadline for Lithuania -- monitor for an actual enacted law before planning around it", "Watch for a Lithuanian Ministry of Finance or Seimas announcement that would resolve this ambiguity one way or the other"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lt-vida-2030', id, '2030-07-01', 0,
    'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516',
    1, '[{"label": "Council Directive (EU) 2025/516", "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516"}]', NULL, 'b2b'
  FROM countries WHERE code = 'LT';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lt-vida-2030', 'en',
  'ViDA cross-border B2B e-invoicing and digital reporting become mandatory (confirmed EU law)',
  'From 1 July 2030, under Council Directive (EU) 2025/516, structured e-invoicing and digital reporting become mandatory for all intra-Community B2B supplies -- a firm EU-law floor that applies to Lithuania regardless of whether the unconfirmed 2028 domestic target above ever materializes into real legislation.', '["Prepare for mandatory structured e-invoicing on all intra-EU B2B trade from mid-2030, independent of whether a domestic mandate arrives first"]'
);
