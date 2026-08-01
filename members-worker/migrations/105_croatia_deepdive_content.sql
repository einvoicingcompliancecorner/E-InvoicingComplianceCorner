-- Croatia deep-dive content backfill (Stage 4). English only for now.
--
-- Two structural notes:
-- 1. The static page's '.flow-grid' element ('The three parallel processes'
--    card: pill-shaped process badges, with intro text before and outro text
--    after) is functionally identical to the existing lifecycle-pill infra --
--    same CSS pattern (pill shape, border-radius:999px), same intro/pills/outro
--    structure. Mapped onto deep_dive_lifecycle_cards per the established
--    'reuse existing pill infrastructure under a new class name' rule (Poland's
--    .mode-grid precedent), not built as new schema.
-- 2. Croatia's penalty table has a genuine 3-column structure (Failure /
--    Companies / Individuals) that the fixed 3-column schema (failure_description
--    / fine_amount / annual_cap) doesn't natively support -- there's no 'cap'
--    concept here at all, just two different fine ranges. Combined Companies
--    and Individuals into fine_amount as a single string rather than mislabel
--    real data under an 'Annual cap' header it doesn't mean. Flagging this as a
--    judgment call worth a proper schema look if more countries show the same
--    company-vs-individual split.

INSERT INTO deep_dive_pages (country_id, last_updated) SELECT id, '2026-07-21' FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_page_translations (country_id, lang, compliance_model, footer_disclaimer, timeline_intro, file_format_intro, scope_intro, steps_intro, penalties_intro) SELECT id, 'en', 'Dual — decentralised exchange + real-time reporting', 'This deep-dive page reflects publicly available technical guidance as of July 2026 and is provided for general awareness, not legal or tax advice. HR-FISK technical specifications, AMS operational detail, and penalty schedules continue to evolve — confirm current requirements directly with the Croatian Tax Administration before building an integration.', 'Croatia''s Fiskalizacija 2.0 reform layers a full B2B mandate and an expanded B2C fiscalisation regime on top of a B2G system that''s been running for years.', 'Croatia builds on the standard European invoice model but adds a distinctly national layer of extra mandatory fields.', 'This is the part that catches people out: Croatia isn''t one flow, it''s three running in parallel — exchange, fiscalisation, and monthly e-reporting.', 'Because Croatia runs three parallel obligations, "getting compliant" means configuring all three — not just picking an Access Point.', 'Croatia gives itself no "penalty holiday" — the fine schedule applies from each element''s go-live date, with company-size-scaled ranges.' FROM countries WHERE name_en = 'Croatia';

INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', 'HR-FISK 2.0', 'National CIUS');
INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 1 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', '3 flows', 'Exchange + fiscalisation + e-reporting');
INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 2 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', 'AS4', 'Transport protocol');
INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 3 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', '€2,650→66k', 'Fiscalisation penalty range');
INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 4 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', '20th', 'Monthly e-report deadline');

INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Syntax & standard', '[["Base syntax", "UBL 2.1 XML"], ["European alignment", "EN 16931-1:2017"], ["National CIUS", "HR-FISK 2.0"], ["Peppol compatibility", "Supports Peppol BIS 3.0 as a common format"]]', 'HR-FISK 2.0 goes beyond the EN 16931 base — Croatia''s extensions aren''t cosmetic, they add fields the European standard doesn''t require.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', 1 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Extra mandatory fields', '[["Identifiers", "Seller''s & buyer''s OIB (Croatian tax number)"], ["Product classification", "6-digit CPA product code"], ["Payment detail", "Bank account details"]]', 'These three additions — OIB, CPA code, and bank details — are exactly the fields that trip up ERPs configured for a generic EN 16931 build rather than Croatia specifically.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', 2 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Signatures', '[["SOAP envelope", "Always signed with a qualified certificate"], ["XML invoice itself", "Signature optional, but common practice"]]', 'Don''t assume the invoice XML needs its own signature the way Italy''s FatturaPA does — Croatia''s requirement sits at the transport (SOAP) layer instead.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', 3 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Exceptions', '[["Paper invoices", "Allowed only in limited domestic cases"], ["Common trigger", "Recipient not registered in the AMS directory"]]', 'This is a narrow escape hatch, not a general opt-out — it exists specifically for the case where the system genuinely can''t find a routable address for the recipient.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Invoice exchange (AS4)', '[["Envelope", "AS4 protocol with mutual TLS"], ["Discovery", "AMS → buyer''s MPS → buyer AP endpoint + public key"], ["Routing model", "Dynamic, Peppol-like but managed locally"]]', 'The Supplier''s Access Point queries the AMS, which returns the Buyer''s Metadata Service (MPS) URL; the AP then queries that MPS to discover the Buyer AP''s technical endpoint. No static bilateral connections needed.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 1 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Fiscalisation reporting', '[["Issuer side", "Real-time, at issuance"], ["Recipient side", "Real-time, upon receipt (within 5 days)"]]', 'Both sides of a transaction independently confirm it to the Tax Administration — this is what makes fiscalisation a genuine two-sided control rather than a one-way filing.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 2 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Monthly e-reporting', '[["Deadline", "20th of the following month"], ["Recipients report", "Rejected and undelivered invoices"], ["Issuers report", "Payments received"]]', 'This third layer catches what the real-time flows miss — specifically, what happened to an invoice after issuance (rejected? paid?) rather than just confirming it existed.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 3 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Access points & the AMS', '[["AMS", "Central government-run address directory"], ["One AP per identifier", "e.g. an OIB maps to a single receiving Access Point"], ["Multiple identifiers", "Different identifiers (e.g. GLN) can route to different APs"], ["AP requirements", "Conformance-tested, ISO 27001 + GDPR compliant"]]', 'Large companies have the option to integrate their ERP directly with the Tax Administration rather than going through a third-party Access Point — worth evaluating if your invoice volumes justify the build.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '⚠️ Severe/repeated cases', NULL, NULL, 'Some sources cite penalties reaching as high as €500,000 for serious or repeated real-time reporting failures — treat the ranges above as the standard schedule, with escalation possible for egregious or repeated non-compliance.');
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 1 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '🚫 No penalty holiday', NULL, NULL, 'Unlike Belgium, Poland, or France, Croatia hasn''t announced a grace period for its 2026 go-live — compliance from day one is the expectation, not a soft target.');
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 2 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '📋 Beyond fines', NULL, NULL, 'Non-compliance also risks invoice disputes, delayed payments, additional audit and reconciliation work, and — in the case of software tampering — potential closure of business premises.');

INSERT INTO deep_dive_lifecycle_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_lifecycle_card_translations (card_id, lang, title, intro_text, outro_text) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_cards), 'en', 'The three parallel processes', 'Unlike a single clearance flow, Croatia requires all three to run independently:', 'This "dual reporting" structure creates a closed audit loop — the tax authority receives independent confirmations from both the seller and the buyer side, not just one feed.');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_cards), 0, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', '1. Invoice exchange');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_cards), 1, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', '2. Fiscalisation (issuer + recipient)');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_cards), 2, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', '3. Monthly e-reporting');

INSERT INTO deep_dive_penalty_rows (country_id, sort_order) SELECT id, 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_penalty_row_translations (row_id, lang, failure_description, fine_amount, annual_cap) VALUES ((SELECT MAX(id) FROM deep_dive_penalty_rows), 'en', 'Failure to issue / fiscalise', 'Companies: €2,650 – €66,000 · Individuals: €265 – €6,650', NULL);
INSERT INTO deep_dive_penalty_rows (country_id, sort_order) SELECT id, 1 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_penalty_row_translations (row_id, lang, failure_description, fine_amount, annual_cap) VALUES ((SELECT MAX(id) FROM deep_dive_penalty_rows), 'en', 'Failure to e-report', 'Companies: €1,330 – €13,300 · Individuals: €130 – €1,330', NULL);
INSERT INTO deep_dive_penalty_rows (country_id, sort_order) SELECT id, 2 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_penalty_row_translations (row_id, lang, failure_description, fine_amount, annual_cap) VALUES ((SELECT MAX(id) FROM deep_dive_penalty_rows), 'en', 'Tampering with fiscalisation software', 'Companies: up to €66,000 + up to 30 days'' closure · Individuals: not applicable', NULL);

INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Map your identifiers', 'Work out which identifiers your business uses to route invoices — your OIB at minimum, plus any secondary identifiers like GLN — since each can map to a different receiving Access Point in the AMS.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 1 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Choose an accredited Information Intermediary or Access Point', 'Confirm your chosen provider appears on the Croatian Tax Administration''s official list of certified brokers, with passed conformance and security assessments — or evaluate direct ERP integration if you''re a large-volume filer.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 2 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Register your receiving Access Point in the AMS', 'Do this per identifier — don''t assume registering your OIB automatically covers any secondary identifiers you also use.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 3 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Validate your invoicing software against HR-FISK 2.0', 'Confirm UBL 2.1 generation includes the Croatia-specific fields — OIB, 6-digit CPA product codes, and bank account details — not just the base EN 16931 set.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 4 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Build both fiscalisation flows', 'Set up real-time reporting to the Tax Administration for invoices you issue, and a separate real-time confirmation process for invoices you receive — these are genuinely two different technical flows, not one.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 5 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Set up the monthly e-reporting cycle', 'Build a process to report rejected/undelivered invoices (as recipient) and payments received (as issuer) ahead of the 20th-of-the-month deadline, every month, without fail.');

INSERT INTO deep_dive_portals (country_id, url, sort_order) SELECT id, 'https://porezna-uprava.gov.hr/en', 0 FROM countries WHERE name_en = 'Croatia';
INSERT INTO deep_dive_portal_translations (portal_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_portals), 'en', 'Porezna uprava (Croatian Tax Administration)');
