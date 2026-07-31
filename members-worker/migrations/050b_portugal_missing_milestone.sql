-- Just the one milestone missing from the earlier successful run of
-- 050 (before the 11th entry was added). The other 10 are already
-- confirmed live -- this adds only what's missing.
INSERT INTO milestones (id, country_id, date, anchor, source_url)
  SELECT 'pt-pdf-valid-through-2026', id, '2026-11-27', 0,
    'https://www.portaldasfinancas.gov.pt/pt/menu.action?pai=5075'
  FROM countries WHERE name_en = 'Portugal';
INSERT INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES
  ('pt-pdf-valid-through-2026', 'en',
   'PDF invoices remain valid without a QES, through 31 December 2026',
   'Confirmed via the 2026 State Budget (approved 27 November 2025): PDF invoices issued by certified software, carrying ATCUD and a QR code, stay legally valid without a Qualified Electronic Signature until this date.',
   '[]');
