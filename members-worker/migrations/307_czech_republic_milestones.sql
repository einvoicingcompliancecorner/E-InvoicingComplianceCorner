-- Czech Republic: milestones + English translations. Hand-written,
-- following the Cyprus/Turkey pattern. Three milestones, matching the
-- structure recommended in PROGRESS.md's 4 August 2026 evaluation:
--
-- 1. cz-b2g-accept-2016 (2016-10-01, anchor, off-board,
--    mandate_scope='b2g_only') -- Act No. 134/2016 Coll. (transposing
--    EU Directive 2014/55/EU) requires public contracting authorities
--    to accept EN 16931-compliant e-invoices via the Narodni
--    elektronicky nastroj (NEN) portal, developed and operated by the
--    Ministry of Regional Development. Suppliers are never required
--    to issue one -- the weakest form of B2G mandate this tracker has
--    seen, confirmed directly against the EC's own country page
--    (Section 221: authorities "shall not reject" a compliant
--    e-invoice, not "shall require" one).
-- 2. cz-eet2-2027 (2027-01-01, on-board, confidence='expected',
--    mandate_scope='none') -- EET 2.0, a real-time B2C point-of-sale
--    sales-reporting revival (cash/card/QR), not a B2B e-invoicing
--    mandate -- same VeriFactu-style treatment as Turkey's
--    e-Waybill/e-Defter entries. The Chamber of Deputies has passed
--    it; Senate passage and presidential signature are still pending,
--    hence 'expected' rather than a firm confidence.
-- 3. cz-vida-2030 (2030-07-01, on-board, mandate_scope='b2b') -- the
--    confirmed EU-wide ViDA cross-border floor, same as every other
--    tracked EU member state (Cyprus, Austria, Greece, Netherlands).

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'cz-b2g-accept-2016', id, '2016-10-01', 1, 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108881/eInvoicing+in+Czech+Republic', 0, '[{"label": "Národní elektronický nástroj (NEN)", "url": "https://nen.nipez.cz"}]', NULL, 'b2g_only' FROM countries WHERE code = 'CZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cz-b2g-accept-2016', 'en', 'Public contracting authorities must accept EN 16931 e-invoices', 'From 1 October 2016, Act No. 134/2016 Coll. on Public Procurement (Section 221) transposed EU Directive 2014/55/EU: central, regional, and local contracting authorities may not reject a compliant electronic invoice submitted by a supplier, in EDIFACT, UBL 2.1, or the national ISDOC format, typically via the Národní elektronický nástroj (NEN) portal. This is a receiving obligation only -- suppliers are never required to actually issue an e-invoice, and there is no monitoring mechanism checking whether they do.', '["No action required yet for this historical milestone -- included for context ahead of the entries below", "Suppliers to Czech public bodies may issue e-invoices in EDIFACT, UBL 2.1, or ISDOC voluntarily via NEN, though nothing requires it"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'cz-eet2-2027', id, '2027-01-01', 0, 'https://www.expats.cz/czech-news/article/czechia-approves-return-of-eet-electronic-sales-tracking-to-resume-in-2027', 1, '[]', 'expected', 'none' FROM countries WHERE code = 'CZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cz-eet2-2027', 'en', 'EET 2.0 revives real-time electronic sales reporting', 'From 1 January 2027, a revived Electronic Registration of Sales regime (EET 2.0) will require real-time or near-real-time reporting of in-person B2C sales -- cash, card, and QR-code payments alike -- to the Czech Tax Administration, replacing the original EET model (2016-2020ish, formally repealed) that this revives. Small flat-rate-tax entrepreneurs with annual revenue below CZK 1,000,000 can pay a surcharge for exemption. Non-compliance carries penalties of up to CZK 500,000, and the government projects CZK 14-15 billion in additional annual tax revenue. The Chamber of Deputies has already passed the legislation; it now moves to the Senate, then President Petr Pavel, for final signature. This is a real-time sales/receipt-reporting duty, not a structured B2B e-invoicing mandate -- no invoice format, and no buyer/seller document exchange requirement.', '["Check whether your annual revenue is below the CZK 1,000,000 small-entrepreneur exemption threshold", "If you run in-person retail, hospitality, or services, plan for real-time electronic sales reporting -- cash, card, and QR payments all count", "Watch for Senate passage and presidential signature -- the effective date is confirmed in the bill but final enactment isn''t signed yet"]');

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope) SELECT 'cz-vida-2030', id, '2030-07-01', 0, 'https://taxation-customs.ec.europa.eu/taxation/vat/vat-digital-age-vida_en', 1, '[{"label": "EC — eInvoicing in Czech Republic", "url": "https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108881/eInvoicing+in+Czech+Republic"}]', NULL, 'b2b' FROM countries WHERE code = 'CZ';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES ('cz-vida-2030', 'en', 'ViDA cross-border B2B digital reporting takes effect', 'Regardless of whether the Czech Republic ever enacts a domestic B2B e-invoicing mandate -- none exists or is currently proposed -- the EU''s VAT in the Digital Age (ViDA) directive requires structured e-invoicing and digital reporting for intra-Community B2B transactions from 1 July 2030 -- confirmed EU law (Council Directive (EU) 2025/516).', '["Businesses trading cross-border within the EU should plan for EN 16931-compliant e-invoicing and reporting capability by this date, independent of any domestic Czech mandate"]');
