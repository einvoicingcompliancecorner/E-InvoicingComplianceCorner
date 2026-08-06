-- Iceland deep-dive content (English). B2G-only, long-standing, not
-- new: Regulation 44/2019 requires Icelandic public bodies to receive
-- EN 16931-compliant e-invoices, phased in 2019-2020. No B2B mandate
-- exists -- not enacted, not drafted, not publicly discussed with a
-- date (confirmed via the EU Commission's own 2025 Iceland country
-- sheet, self-flagged "NO VERIFICATION"). No penalty regime exists
-- either, so penalties_related is covered entirely in narrative cards
-- below, following this project's Japan/Finland/UK/New Zealand/US
-- precedent for "no sourced penalty" countries -- no
-- deep_dive_penalty_rows for Iceland.
--
-- Live-researched against island.is (the regulation's official host),
-- Stjornartidindi (Iceland's official gazette), Fjarsysla rikisins's
-- own knowledge base, OpenPeppol's country profile, Stadlarad Islands
-- (the Icelandic standards body, for the TS 236 / Peppol BIS 3.0
-- national implementation), and the EU Commission's eInvoicing country
-- sheet for Iceland. Every URL cited as a milestone source_url or
-- deep-dive portal was independently fetched and confirmed in this
-- session. A widely-repeated vendor claim of a "1 July 2026" deadline
-- to retire an older BII format for Peppol BIS 3.0 was checked again
-- in this session and still traces to no primary source -- it is
-- deliberately absent from every card below.

INSERT INTO deep_dive_pages (country_id, last_updated) SELECT id, '2026-08-06' FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_page_translations (country_id, lang, compliance_model, footer_disclaimer, timeline_intro, file_format_intro, scope_intro, steps_intro, penalties_intro, mandate_summary, mandate_summary_icon) SELECT id, 'en',
  'B2G-only clearance-free receipt model -- Icelandic public bodies have been required to receive EN 16931-compliant e-invoices since 2019/2020, via Fjarsysla rikisins and the Peppol network; there is no B2B mandate and none is under discussion',
  'This deep-dive page reflects Regulation 44/2019''s text and publicly available Icelandic government and OpenPeppol guidance as of early August 2026, and is provided for general awareness, not legal advice. Confirm current requirements directly with Fjarsysla rikisins or an Icelandic legal adviser before relying on this page for compliance decisions.',
  'Iceland''s Ministry of Finance and Economic Affairs issued Regulation 44/2019 on 24 January 2019, transposing EU Directive 2014/55/EU via Iceland''s EEA membership. The requirement phased in by public-body type: state institutions from 18 April 2019, then municipalities, public enterprises, and other entities operating under special rights or monopolies from 18 April 2020, completing the rollout. Fjarsysla rikisins (the Financial Management Authority) has been Iceland''s registered OpenPeppol Peppol Authority since 2020. Nothing has changed since -- there has been no B2B development, mandate proposal, or dated announcement in Iceland since the regulation''s 2019-2020 rollout completed.',
  'A compliant e-invoice meets European standard EN 16931, implemented nationally as TS 236:2018 (Stadlarad Islands, the Icelandic standards body) -- Iceland''s specific implementation of Peppol BIS Billing 3.0. There is no separate older national format still required in parallel; a plain PDF is explicitly not accepted as a machine-readable e-invoice.',
  'The regulation applies to public buyers under Iceland''s Public Procurement Act, utilities (water/energy/transport/postal) procurement rules, concession contracts above EEA thresholds, and defense/security procurement rules -- framed around existing EU/EEA procurement-value thresholds rather than a single flat rule. Confidential contracts, those requiring special security measures, or those protecting fundamental state interests are excluded. There is no B2B scope at all: Iceland has never enacted, drafted, or publicly discussed a business-to-business e-invoicing mandate.',
  'Most businesses reading this only need to confirm they can invoice Icelandic public bodies electronically -- there is no upcoming B2B deadline to prepare for, and none has been announced.',
  'Iceland has no statutory penalty regime for e-invoicing non-compliance -- the EU Commission''s own country sheet states this explicitly, and no independent source in this research pass found otherwise.',
  'Iceland has required public bodies to receive EN 16931-compliant e-invoices since 2019 (state institutions) and 2020 (municipalities and public enterprises), under Regulation 44/2019 -- routed via Fjarsysla rikisins over the Peppol network (Peppol BIS Billing 3.0 / TS 236). There is no B2B mandate, no B2B proposal, and no statutory penalty regime -- this is a mature, stable, B2G-only mandate with nothing currently changing.',
  '🇮🇸'
FROM countries WHERE code = 'IS';

INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 0 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', '24 Jan 2019', 'Regulation 44/2019 published in the official gazette');
INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 1 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', '18 Apr 2020', 'Full public-sector rollout completed (municipalities & public enterprises)');
INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 2 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', 'Since 2020', 'Fjarsysla rikisins registered as Iceland''s OpenPeppol Peppol Authority');
INSERT INTO deep_dive_stats (country_id, sort_order) SELECT id, 3 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_stat_translations (stat_id, lang, stat_value, stat_label) VALUES ((SELECT MAX(id) FROM deep_dive_stats), 'en', 'None', 'B2B mandate proposed, drafted, or dated as of mid-2026');

INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', 0 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Format & network', '[["Standard", "EN 16931, implemented nationally as TS 236:2018 (Stadlarad Islands)"], ["Practical format", "Peppol BIS Billing 3.0"], ["Network", "Peppol -- Fjarsysla rikisins has been Iceland''s registered Peppol Authority since 2020"], ["Older/legacy format", "None required in parallel -- TS 236 is Iceland''s implementation of Peppol BIS 3.0 itself, not a bridge to it"]]', 'A plain PDF invoice is explicitly not treated as a compliant, machine-readable e-invoice under this regime.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'file_format', 1 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Submitting to Icelandic state institutions', '[["Receiving body", "Fjarsysla rikisins (Financial Management Authority), on behalf of most state institutions"], ["Route", "Peppol access point, or a supplier-facing web submission option for businesses without accounting-system integration"], ["No clearance step", "This is a receive-only public-buyer mandate, not a government clearance/approval model -- there is no step where a tax authority validates the invoice before it reaches the buyer"]]', NULL, NULL);

INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 0 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'Who''s covered', '[["State institutions", "Covered since 18 April 2019"], ["Municipalities, public enterprises, special-rights/monopoly entities", "Covered since 18 April 2020"], ["Procurement basis", "Public Procurement Act, utilities procurement rules, concession contracts above EEA thresholds, defense/security procurement rules"], ["Excluded", "Confidential contracts, contracts requiring special security measures, or contracts protecting fundamental state interests"]]', 'Coverage is framed around existing EU/EEA procurement-value thresholds rather than a single flat monetary threshold -- which contract regime applies determines whether a given purchase is in scope, not a single number.', NULL);
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 1 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', 'No B2B mandate', '[["Enacted?", "No"], ["Drafted?", "No"], ["Publicly discussed with a date?", "No -- the EU Commission''s own 2025 Iceland country sheet is self-flagged \"NO VERIFICATION\" and lists no 2024-2026 developments"]]', 'A "1 July 2026" deadline to retire an older BII EDI format in favor of Peppol BIS 3.0 is repeated across several vendor blogs -- it does not trace to any primary Icelandic or OpenPeppol source and is not reported as fact on this page. OpenPeppol''s own Iceland country profile mentions only that the Icelandic EDI community approved guidelines for migrating from EDIFACT documents to Peppol BIS, with no date given.', NULL);

INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 0 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '💰 No statutory penalty regime found', NULL, NULL, 'Unlike most jurisdictions in this tracker, Iceland''s e-invoicing framework carries no bespoke fine or penalty schedule for non-compliance. The EU Commission''s own eInvoicing country sheet for Iceland states this explicitly, and no independent Icelandic government source in this research pass described one either.');
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 1 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '📄 Enforcement is procedural, not financial', NULL, NULL, 'Because this is a receive-only public-buyer mandate rather than a clearance or reporting regime, the practical mechanism is procurement-process based: a public body that cannot receive a compliant e-invoice is itself out of step with the regulation, and a supplier submitting outside the required channel risks payment delay or rejection rather than a statutory fine.');
INSERT INTO deep_dive_cards (country_id, section, sort_order) SELECT id, 'penalties_related', 2 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_card_translations (card_id, lang, title, rows_json, note, body) VALUES ((SELECT MAX(id) FROM deep_dive_cards), 'en', '🔍 A mature, stable mandate', NULL, NULL, 'Regulation 44/2019''s rollout completed in April 2020 and nothing about its scope, format, or enforcement has changed since -- there is no pending amendment, consultation, or enforcement-tightening initiative found in this research pass. This is one of the more settled B2G-only mandates on this tracker.');

INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 0 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Confirm whether your customer is covered', 'Check whether the Icelandic public body you''re invoicing is a state institution, municipality, public enterprise, or special-rights/monopoly entity -- and whether the contract falls under Public Procurement Act, utilities, concession, or defense/security procurement rules.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 1 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Confirm your invoicing software can produce Peppol BIS Billing 3.0 output', 'A plain PDF is not accepted -- confirm your accounting or invoicing software (or a Peppol access-point provider) can generate a compliant EN 16931 / TS 236 e-invoice.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 2 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Confirm your Peppol access-point route to Fjarsysla rikisins', 'Most Icelandic state institutions receive invoices via Fjarsysla rikisins over the Peppol network -- confirm your access point can reach it, or use the supplier-facing web submission option if you don''t have accounting-system integration.');
INSERT INTO deep_dive_steps (country_id, sort_order) SELECT id, 3 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_step_translations (step_id, lang, title, description) VALUES ((SELECT MAX(id) FROM deep_dive_steps), 'en', 'Don''t over-prepare for an unannounced B2B mandate', 'No B2B e-invoicing mandate has been enacted, drafted, or dated for Iceland as of mid-2026 -- treat vendor claims of a fixed future B2B or format-retirement deadline with caution unless you can trace them to a primary Icelandic government or OpenPeppol source.');

INSERT INTO deep_dive_portals (country_id, url, sort_order) SELECT id, 'https://island.is/reglugerdir/nr/0044-2019', 0 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_portal_translations (portal_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_portals), 'en', 'Regulation 44/2019 -- official text (island.is)');
INSERT INTO deep_dive_portals (country_id, url, sort_order) SELECT id, 'https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar', 1 FROM countries WHERE code = 'IS';
INSERT INTO deep_dive_portal_translations (portal_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_portals), 'en', 'Fjarsysla rikisins -- receiving e-invoices for Icelandic state institutions');
