-- Switzerland: grade the hosts its citations introduce.
--
-- Nearly all primary, because the Confederation publishes well. Three
-- notes on the ones that need explaining.
--
-- bkb.admin.ch is the Federal Procurement Conference, and it matters
-- more than its obscurity suggests: the B2G obligation has NO
-- SR-numbered ordinance behind it. The binding text is clause 9.4 of the
-- Confederation's procurement standard terms, published there, resting
-- on a Federal Council decision of 8 October 2014. It is also the only
-- source that says the CHF 5,000 threshold is exclusive of VAT.
--
-- fedlex.admin.ch is graded primary and is barely usable. It is a
-- JavaScript-only application that serves no text, so no Swiss statute
-- could be read directly except one ordinance reachable through a
-- filestore PDF URL. Every article number on this country therefore
-- rests on official ESTV or kmu.admin.ch guidance rather than on the
-- enacted text, and the deep dive says so.
--
-- ebill.ch is graded secondary deliberately. eBill is operated by SIX on
-- behalf of the financial sector, is commercial, and is entirely
-- voluntary -- it is the most-quoted Swiss "e-invoicing" thing and the
-- easiest to mistake for compliance infrastructure. A primary grade
-- would lend it an authority it does not have.

INSERT OR IGNORE INTO source_hosts (host, tier, note, classified_on) VALUES
  ('efv.admin.ch',    'primary',   'Federal Finance Administration; operates the Confederation''s e-invoicing channels', '2026-08-27'),
  ('bkb.admin.ch',    'primary',   'Federal Procurement Conference; publishes the standard terms whose clause 9.4 IS the B2G obligation', '2026-08-27'),
  ('vtg.admin.ch',    'primary',   'Swiss Armed Forces; states the Federal Council decision and the CHF 5,000 threshold', '2026-08-27'),
  ('bk.admin.ch',     'primary',   'Federal Chancellery', '2026-08-27'),
  ('admin.ch',        'primary',   'Swiss Federal Council and federal news releases', '2026-08-27'),
  ('newsd.admin.ch',  'primary',   'Swiss federal document store for explanatory reports and message attachments', '2026-08-27'),
  ('kmu.admin.ch',    'primary',   'Federal SME portal; the official statement of the Code of Obligations retention rules', '2026-08-27'),
  ('fedlex.admin.ch', 'primary',   'Swiss Systematic Compilation; a JavaScript-only site, so statute text is largely unreadable', '2026-08-27'),
  ('zh.ch',           'primary',   'Canton of Zurich', '2026-08-27'),
  ('swissvat.ch',     'secondary', 'Reproduces ESTV publications and the VAT Act; used where the official viewer is unreachable', '2026-08-27'),
  ('ebill.ch',        'secondary', 'eBill, operated by SIX for the Swiss financial sector -- commercial and voluntary, not a compliance channel', '2026-08-27'),
  ('six-group.com',   'secondary', 'SIX Group; operator of eBill and the QR-bill payment standard', '2026-08-27'),
  ('pwc.ch',          'secondary', 'PwC Switzerland', '2026-08-27');

-- ---- what this migration claims it did ----
-- ASSERT: SELECT count(*) FROM source_hosts WHERE host LIKE '%.admin.ch' >= 8
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'bkb.admin.ch' = 'primary'
-- ASSERT: SELECT tier FROM source_hosts WHERE host = 'ebill.ch' = 'secondary'
-- ASSERT: SELECT count(*) FROM source_hosts WHERE tier = 'unknown' AND ifnull(note,'') = '' = 0
