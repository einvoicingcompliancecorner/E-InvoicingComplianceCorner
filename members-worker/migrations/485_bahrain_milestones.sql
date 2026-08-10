-- ================================================================
-- Bahrain (BH) milestone + EN translation. ONE milestone -- the
-- only real, dated, primary-source-confirmed e-invoicing-adjacent
-- fact found for Bahrain, and it is a minor procedural change, not
-- a mandate of any kind.
--
-- Sourcing (10 Aug 2026 research session, house standard): confirmed
-- directly against Bahrain's own National Bureau for Revenue (NBR)
-- VAT General Guide -- Section 9.2, added via the Version 1.8 update
-- dated 16 Nov 2023, states VAT-registered persons no longer need
-- NBR's prior approval before issuing electronic documents
-- voluntarily. Independently corroborated by Fonoa's blog (same
-- date, same legal basis, explicit that e-invoicing "remains
-- voluntary" -- this removed a bureaucratic pre-clearance step, it
-- did not introduce a mandate). Checked every NBR VAT General Guide
-- update since (Aug 2024, Oct 2025 KPMG alert, 28 Jan 2026 Version
-- 1.14, and KPMG's 2 Aug 2026 Bahrain & GCC Tax News bulletin) --
-- none mentions e-invoicing again. Two independent professional
-- trackers, both recent (EY's own tracker as of 24 Jun 2026; Aurifer,
-- a Middle East indirect-tax specialist), explicitly classify Bahrain
-- as "not applicable" / still in "preparatory work" for e-invoicing --
-- as close to a real-time double confirmation of "still nothing" as
-- this space offers. A 2023 platform tender (Bahrain Tender Board,
-- confirmed directly: 305/2023/BTB) and a rumoured Feb 2025 tender
-- (VATupdate brief only, could not be independently corroborated)
-- both point to preparatory government activity, but neither is a
-- law, a mandate, or a dated legal requirement -- deliberately
-- excluded from milestones/stats as a result, though summarised
-- honestly in the deep-dive cards below.
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'bh-prior-approval-removed-2023', id, '2023-11-16', 0,
    'https://www.fonoa.com/resources/blog/bahrain-eliminates-tax-authority-approval-requirement-for-e-invoice-issuance',
    1, '[{"label": "National Bureau for Revenue (NBR) -- general tax portal, no e-invoicing mandate content", "url": "https://www.nbr.gov.bh"}]', NULL, 'none'
  FROM countries WHERE code = 'BH';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'bh-prior-approval-removed-2023', 'en',
  'NBR removes prior-approval requirement for voluntary e-invoicing -- still no mandate',
  'On 16 Nov 2023, Bahrain''s National Bureau for Revenue (NBR) updated its VAT General Guide (Version 1.8, Section 9.2) to let VAT-registered businesses issue electronic invoices without first seeking NBR approval. This is a real, dated, primary-source-confirmed procedural change -- but it removed a bureaucratic pre-clearance step for a purely voluntary practice; it did not create an e-invoicing mandate, a platform, a format requirement, or any deadline. No draft law, VAT law amendment, or enacted regulation establishing an e-invoicing mandate exists for Bahrain as of this research round (Aug 2026). Two independent professional trackers checked directly -- EY''s own eInvoicing developments tracker (24 Jun 2026 edition) and Aurifer, a Middle East indirect-tax specialist -- both still classify Bahrain as having no applicable mandate and being in "preparatory work" only. A 2023 government tender for an e-invoicing platform, and unconfirmed reports of a further 2025 tender, point to preparatory activity behind the scenes, but neither is a law or a dated requirement.',
  '["No compliance action is required -- e-invoicing remains entirely voluntary in Bahrain, with no mandate proposed or enacted", "Monitor NBR''s VAT General Guide and Official Gazette for any future mandate proposal -- none currently exists", "Note Bahrain is now the only GCC state alongside Kuwait with no active or imminent e-invoicing mandate, given Saudi Arabia, UAE, Oman, and (in draft form) Qatar are all moving"]'
);
