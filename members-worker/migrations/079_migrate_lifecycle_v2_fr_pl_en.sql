-- Migrates France's and Poland's existing lifecycle content into
-- the new multi-card schema, built from the same source data
-- originally used to create it (rather than copying from the old
-- live tables, given how often live state has differed from
-- expectations in this project). English content only here --
-- translations follow in a separate migration.

-- France: one lifecycle card (unchanged in substance, new structure)
INSERT INTO deep_dive_lifecycle_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 0 FROM countries WHERE name_en = 'France';
INSERT INTO deep_dive_lifecycle_card_translations (card_id, lang, title, intro_text) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_cards), 'en', 'Lifecycle status exchange', 'Every invoice must carry status updates through its life — this is what lets DGFiP pre-fill VAT returns in near real time.');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='France')), 0, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Deposited');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='France')), 1, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Sent');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='France')), 2, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Received');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='France')), 3, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Approved');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='France')), 4, 1);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Rejected');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='France')), 5, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Payment Due');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='France')), 6, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Payment Done');

-- Poland: one lifecycle card (unchanged in substance, new structure)
INSERT INTO deep_dive_lifecycle_cards (country_id, section, sort_order) SELECT id, 'scope_transmission', 0 FROM countries WHERE name_en = 'Poland';
INSERT INTO deep_dive_lifecycle_card_translations (card_id, lang, title, intro_text, outro_text) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_cards), 'en', 'Offline modes & QR codes', 'Four offline modes exist for when KSeF itself is unavailable or unreachable:', 'Invoices issued offline or in failure mode need a QR code for verification, and must be submitted to KSeF by the next working day. Domestic NIP-holders no longer need a QR code on the printout itself — they retrieve the legally valid invoice through KSeF directly, except in failure mode.');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='Poland')), 0, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Offline24');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='Poland')), 1, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Standard offline');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='Poland')), 2, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Failure mode');
INSERT INTO deep_dive_lifecycle_statuses_v2 (card_id, sort_order, is_special) VALUES ((SELECT id FROM deep_dive_lifecycle_cards WHERE country_id=(SELECT id FROM countries WHERE name_en='Poland')), 3, 0);
INSERT INTO deep_dive_lifecycle_status_v2_translations (status_id, lang, label) VALUES ((SELECT MAX(id) FROM deep_dive_lifecycle_statuses_v2), 'en', 'Emergency mode');
