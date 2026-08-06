-- Latvia: milestones + English translations. Hand-written (not
-- scaffolder-generated), to keep full control over mandate_scope/
-- anchor/on_tracker per milestone. INSERT OR IGNORE throughout.
--
-- IMPORTANT CORRECTION vs. the prior cross-region evaluation pass
-- (PROGRESS.md, "Cross-region coverage evaluated", 6 Aug 2026): that
-- pass assumed Latvia's B2B e-invoicing mandate took effect 1 Jan
-- 2026. Live re-research in this session found that is now out of
-- date -- the Saeima adopted amendments on 5 June 2025 postponing the
-- B2B go-live to 1 January 2028, confirmed by 5+ independent sources
-- including a 22 July 2026 update (vatupdate.com), with no further
-- delay reported since. The EU Commission's own Latvia eInvoicing
-- country factsheet has NOT been updated to reflect this postponement
-- and still shows a 1 Jan 2026 B2B date -- do not treat that factsheet
-- as current for the B2B date. What IS live now: B2G e-invoicing
-- (mandatory since 1 Jan 2025) and mandatory e-invoice data reporting
-- to VID for B2G/G2G/G2B (since 1 Jan 2026), plus a voluntary B2B
-- phase open since 30 Mar 2026. Sourcing: ifinanses.lv (a VID-linked
-- public information site), plz.lv and fiscal-requirements.com (the
-- 5 Jun 2025 postponement), marosavat.com and vatupdate.com (the
-- current 1 Jan 2028 B2B date and technical detail). One item flagged
-- unverified: Cabinet Regulation No. 749's text itself (likumi.lv
-- fetch blocked in this session) -- confirmed only via a secondary
-- summary (numbero.app); see PROGRESS.md's build entry.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lv-b2g-central-2019', id, '2019-04-18', 0,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108891/eInvoicing+in+Latvia',
    0, '[]', NULL, 'b2g_only'
  FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lv-b2g-central-2019', 'en',
  'B2G e-invoicing mandatory for central government bodies',
  'From 18 April 2019, Latvia''s direct administration institutions (central government bodies) became required to receive structured e-invoices, under Cabinet Regulation No. 154, transposing EU Directive 2014/55/EU.',
  '["If you supply Latvian central-government bodies, confirm your invoicing already meets this requirement."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lv-b2g-all-2020', id, '2020-04-18', 0,
    'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108891/eInvoicing+in+Latvia',
    0, '[]', NULL, 'b2g_only'
  FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lv-b2g-all-2020', 'en',
  'B2G e-invoicing extends to all contracting authorities',
  'From 18 April 2020, the B2G e-invoice receipt requirement extended from central government bodies to all other Latvian contracting authorities, completing the initial EU-directive rollout ahead of the later domestic e-invoicing law.',
  '["If you supply any Latvian public contracting authority, confirm your e-invoicing coverage extends beyond just central government."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lv-b2g-issuance-2025', id, '2025-01-01', 1,
    'https://ifinanses.lv/raksti/aktuali/vid-informacija/lv-strukturetie-elektroniskie-rekini-no-2025-gada/30259',
    1, '[{"label":"eAddress (e-adrese) -- the national e-document exchange platform","url":"https://www.latvija.gov.lv"}]',
    NULL, 'b2g_only'
  FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lv-b2g-issuance-2025', 'en',
  'B2G mandate: all companies must issue structured e-invoices to government',
  'From 1 January 2025, amendments to Latvia''s Accounting Law (Gramatvedibas likums) require all Latvian-registered companies to issue structured e-invoices -- formatted to EN 16931 (LVS EN 16931-1:2017) -- to budget and government (B2G/G2G) entities, exchanged via the free national eAddress (e-adrese) platform, a certified Peppol Access Point, or another VID-integrated channel.',
  '["Confirm your business issues structured, EN 16931-compliant e-invoices to any Latvian government or budget-institution counterpart, not paper or plain PDF.","Register for eAddress (via www.latvija.gov.lv, using Smart-ID, eID, or eParaksts) if you have not already."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lv-b2b-postponed-2025', id, '2025-06-05', 0,
    'https://www.plz.lv/gramatvedibas-likuma-grozijumi-par-e-rekinu-apriti-uznemumu-starpa/',
    1, '[]', NULL, 'none'
  FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lv-b2b-postponed-2025', 'en',
  'Saeima postpones the B2B mandate from 2026 to 2028',
  'On 5 June 2025, the Saeima (Latvian Parliament) adopted amendments postponing the mandatory B2B e-invoicing/e-reporting go-live from the originally planned 1 January 2026 to 1 January 2028 -- rejecting a rival proposal for an intermediate 2027 date in favour of a longer runway plus an interim voluntary phase. The stated rationale was to give taxpayers, especially small businesses, more preparation time, and to allow the eAddress platform to be upgraded first.',
  '["Do not plan around a 1 January 2026 B2B e-invoicing deadline for Latvia -- that date was postponed to 1 January 2028.","Note that some secondary sources and the EU Commission''s own country factsheet may still reference the superseded 2026 date -- verify against the sources listed on this page."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lv-vid-reporting-2026', id, '2026-01-01', 1,
    'https://numbero.app/en/blog/structured-e-invoices-in-latvia-what-regulation-no-749-requires-and-how-companies/',
    1, '[{"label":"VID Electronic Declaration System (EDS)","url":"https://eds.vid.gov.lv/login/"}]',
    NULL, 'b2g_only'
  FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lv-vid-reporting-2026', 'en',
  'Mandatory e-invoice data reporting to VID begins',
  'From 1 January 2026, Cabinet Regulation No. 749 (adopted 9 December 2025) makes reporting structured e-invoice data to the State Revenue Service (VID) mandatory for B2G/G2G/G2B transactions, via eAddress, a certified Peppol Access Point with a VID API integration, or manual upload through VID''s Electronic Declaration System (EDS). Note: this regulation''s full text could not be independently verified via likumi.lv in this research session -- confirmed only via a secondary summary.',
  '["Confirm how your B2G/G2G e-invoice data reaches VID -- via eAddress, a Peppol Access Point, or manual EDS submission.","Independently verify Cabinet Regulation No. 749''s exact requirements via likumi.lv before finalizing your reporting process."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lv-b2b-voluntary-2026', id, '2026-03-30', 0,
    'https://www.vatupdate.com/2025/10/27/briefing-document-mandatory-e-invoicing-and-e-reporting-in-latvia-as-of-jan-1-2026/',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lv-b2b-voluntary-2026', 'en',
  'Voluntary B2B e-invoicing and VID reporting opens',
  'From 30 March 2026, Latvian companies can voluntarily begin issuing structured B2B e-invoices and reporting the data to VID via eAddress, ahead of the mandatory 1 January 2028 date -- an interim step built into the 5 June 2025 postponement to let the platform and businesses prepare gradually rather than face a hard cutover.',
  '["Consider opting into the voluntary B2B e-invoicing/reporting phase via eAddress now, to test your process well ahead of the 2028 mandatory date."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'lv-b2b-mandatory-2028', id, '2028-01-01', 0,
    'https://marosavat.com/vat-news/e-invoicing-mandate-latvia-2028',
    1, '[{"label":"eAddress (e-adrese) -- the national e-document exchange platform","url":"https://www.latvija.gov.lv"},{"label":"VID Electronic Declaration System (EDS)","url":"https://eds.vid.gov.lv/login/"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'LV';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'lv-b2b-mandatory-2028', 'en',
  'Mandatory B2B e-invoicing and VID reporting begins',
  'From 1 January 2028, all companies and taxable persons registered in Latvia must issue and report structured, EN 16931-compliant e-invoices for domestic B2B transactions -- via eAddress, a certified Peppol Access Point, or direct bilateral exchange paired with separate VID data-reporting within 5 working days. Cross-border B2B invoices are not covered by this domestic mandate. No dedicated e-invoicing penalty schedule has been published as of this research; the practical consequence today for non-compliant B2G invoices is rejection by the receiving government entity, not a monetary fine.',
  '["Confirm your invoicing software can produce EN 16931-compliant e-invoices (UBL 2.1 or Peppol BIS Billing 3.0).","Choose and test a reporting channel to VID -- eAddress, a Peppol Access Point, or EDS -- well ahead of 1 January 2028.","Use the voluntary phase (open since 30 March 2026) to test your process before the mandatory date."]'
);
