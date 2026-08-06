-- Slovenia: milestones + English translations. Hand-written (not
-- scaffolder-generated, to keep full control over mandate_scope/
-- anchor/on_tracker per milestone). INSERT OR IGNORE throughout.
--
-- Sourcing: B2G obligation (ZOPSPU/ZOPSPU-A) confirmed via
-- stopbirokraciji.gov.si (a gov.si domain) and UJP's own portal.
-- ZIERDED (B2B law) confirmed by direct fetch of the Official Gazette
-- text, Uradni list RS, st. 85/2025 (6 Nov 2025), covering the two
-- effective dates (1 Apr 2027 / 1 Jan 2028), Art. 7 scope, Art. 9
-- three permitted channels, and Art. 24/25 penalty figures -- all
-- independently re-verified by direct fetch in this session, not
-- taken solely from the prior evaluation pass or from vendor summaries.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'si-b2g-2015', id, '2015-01-01', 1,
    'https://www.stopbirokraciji.gov.si/novice/s-1-1-2015-obvezno-posiljanje-racunov-v-javni-sektor-v-elektronski-obliki',
    1, '[{"label":"UJP e-Racuni -- the public-sector e-invoice submission portal","url":"https://eracuni.ujp.gov.si/"}]',
    NULL, 'b2g_only'
  FROM countries WHERE code = 'SI';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'si-b2g-2015', 'en',
  'ZOPSPU mandate: public sector must receive e-invoices',
  'Since 1 January 2015, Slovenia''s public sector has been required to receive invoices exclusively in electronic form, under the Payment Services for Budget Users Act (ZOPSPU / ZOPSPU-A). UJP (the Administration of the Republic of Slovenia for Public Payments) operates the mandatory central hub -- the "enotna vstopna in izstopna tocka" (EVIT, single entry/exit point) -- through which budget users exchange e-invoices, reachable via participating banks, contracted data processors, or UJP''s own e-Racuni portal for suppliers without either.',
  '["Confirm your business submits invoices to Slovenian public-sector buyers through a bank, a UJP-contracted processor, or the UJP e-Racuni portal -- not paper or a plain PDF.","If invoicing budget users directly without a bank or processor, register for UJP e-Racuni portal access."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'si-zierded-enacted', id, '2025-11-06', 1,
    'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded',
    0, '[]', NULL, 'b2b'
  FROM countries WHERE code = 'SI';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'si-zierded-enacted', 'en',
  'ZIERDED enacted -- Slovenia''s first B2B e-invoicing law',
  'The Zakon o izmenjavi elektronskih racunov in drugih elektronskih dokumentov (ZIERDED) -- Slovenia''s first mandatory B2B e-invoicing law -- was published in the Official Gazette (Uradni list RS, st. 85/2025). It applies to every entity in Slovenia''s Business Register and every self-employed person (Art. 7), sets a two-stage rollout (certified e-path providers from 1 April 2027, the core exchange obligation from 1 January 2028), and Art. 1 explicitly ties the law to transposing elements of the EU''s ViDA directive (2025/516).',
  '["Read ZIERDED''s official text to understand which of the three permitted exchange channels -- certified e-path provider, direct system-to-system link, or Peppol -- fits your business.","Note the two separate effective dates: 1 April 2027 for e-path provider certification, 1 January 2028 for the mandatory exchange obligation itself."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'si-epath-providers-2027', id, '2027-04-01', 0,
    'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded',
    1, '[{"label":"Official ZIERDED text (Uradni list RS, st. 85/2025)","url":"https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'SI';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'si-epath-providers-2027', 'en',
  'Certified "e-path" provider regime takes effect',
  'ZIERDED''s Chapter 4 rules for certified e-path ("e-pot") providers apply from this date -- one of three permitted channels, alongside direct system-to-system exchange and Peppol, for compliant e-invoice and e-document exchange ahead of the 1 January 2028 mandatory-obligation date.',
  '["If you plan to use a certified e-path provider rather than Peppol or a direct system-to-system link, confirm your chosen provider holds certification under this regime before relying on it."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'si-b2b-mandatory-2028', id, '2028-01-01', 0,
    'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded',
    1, '[{"label":"Official ZIERDED text (Uradni list RS, st. 85/2025)","url":"https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3032/zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov-zierded"},{"label":"FURS -- Slovenian Financial Administration","url":"https://www.fu.gov.si"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'SI';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'si-b2b-mandatory-2028', 'en',
  'Mandatory B2B e-invoice exchange begins',
  'ZIERDED''s core obligation takes effect: every entity in Slovenia''s Business Register and every self-employed person must exchange e-invoices and other electronic documents through one of the law''s three permitted channels -- certified e-path provider, direct system-to-system link, or Peppol -- formatted to the e-SLOG 2.0 standard (EN 16931-aligned). Non-compliance draws fines under Art. 24: EUR 1,000-3,000 for legal entities, EUR 500-1,500 for sole proprietors, EUR 100-500 for a responsible person, with a separate, lower Art. 25 range for consumer-invoice violations.',
  '["Confirm your invoicing software or provider can produce e-SLOG 2.0 / EN 16931-compliant e-invoices.","Choose and test one of the three permitted exchange channels well before 1 January 2028.","Confirm your accounts-payable process can receive and process incoming e-invoices via the same channels."]'
);
