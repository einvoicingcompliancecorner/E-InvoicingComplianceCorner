-- ================================================================
-- Qatar (QA) milestone + EN translation. ONE milestone -- there is
-- exactly one real, dated, independently-confirmed e-invoicing
-- event in Qatar's history to date.
--
-- Sourcing (10 Aug 2026 research session, house standard): nine
-- independent sources checked (EY, KPMG, PwC, vatcalc, Thomson
-- Reuters/Pagero, Wafeq, HLB Qatar, e-invoice.app, a second vatcalc
-- VAT-status piece), all describing the identical single event --
-- Qatar's Council of Ministers (Cabinet) approved a DRAFT
-- e-invoicing law and implementing executive regulations on 6 May
-- 2026. EY/KPMG/PwC/Thomson Reuters all state explicitly that the
-- draft still must clear Shura Council review and then the Amir's
-- assent, and that Official Gazette publication has NOT occurred.
-- No implementation date, threshold, phase, or penalty has been
-- officially released -- one source (Wafeq) names specific dates
-- ("Oct 2026 notifications, Jan 2027 enforcement") but frames them
-- explicitly as industry speculation, not government-published, so
-- per this project's sourcing standard those dates are NOT recorded
-- as a milestone or fact anywhere on this page. Qatar's own General
-- Tax Authority (GTA) homepage and Dhareeba portal were fetched
-- directly and confirmed to contain zero e-invoicing content as of
-- this research round -- there is no dedicated official e-invoicing
-- portal to cite, unlike every other Middle East/Africa country on
-- this tracker. Also confirmed (vatcalc, published 5 May 2026, one
-- day before the Cabinet approval): Qatar has still not implemented
-- VAT despite a 2016 GCC Unified VAT Agreement commitment -- an
-- unusual sequencing (e-invoicing law advancing ahead of the VAT
-- regime it would normally sit inside) worth surfacing on the deep
-- dive rather than treated as a formal milestone of its own, since
-- no single dated VAT-commitment event was independently verified
-- this round.
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'qa-draft-law-2026', id, '2026-05-06', 0,
    'https://www.ey.com/en_gl/technical/tax-alerts/qatar-approves-draft-e-invoicing-law-and-implementing-regulations',
    1, '[{"label": "General Tax Authority (Dhareeba) -- general tax portal, no e-invoicing content yet", "url": "https://dhareeba.gov.qa"}]', NULL, 'none'
  FROM countries WHERE code = 'QA';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'qa-draft-law-2026', 'en',
  'Council of Ministers approves a draft e-invoicing law -- not yet enacted',
  'On 6 May 2026, Qatar''s Council of Ministers (Cabinet) approved a draft e-invoicing law and its implementing executive regulations -- confirmed directly by EY, KPMG, PwC, and Thomson Reuters/Pagero, all describing the same single action. This is a real step, but it is not a mandate: the draft still must pass through Shura Council review and then go to the Amir for enactment, and Official Gazette publication has not occurred. No source, official or industry, has independently confirmed a subsequent step since 6 May 2026. No implementation date, taxpayer threshold, invoicing model (clearance vs. reporting), or penalty schedule has been officially released -- some industry commentary speculates a 2027 go-live or a Saudi/UAE-style rollout, but none of that is sourced to a Qatari government document, so it is not recorded as fact on this page. Qatar''s General Tax Authority has no dedicated e-invoicing portal yet, and Qatar itself has not yet implemented VAT (still pending under the 2016 GCC Unified VAT Agreement) -- an unusually early sequencing for an e-invoicing law.',
  '["No compliance action is required or possible yet -- no mandate exists, no portal exists, and no format has been published", "Do not plan around any specific 2026/2027 date circulating in industry commentary -- none is sourced to a Qatari government document", "Watch for Shura Council review, Amiri Decree, and Official Gazette publication as the real signals this has moved from draft to enacted law"]'
);
