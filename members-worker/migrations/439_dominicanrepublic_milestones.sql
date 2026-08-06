-- Dominican Republic: milestones + English translations. Hand-written
-- (not scaffolder-generated, to keep full control over mandate_scope/
-- anchor/on_tracker per milestone). INSERT OR IGNORE throughout.
--
-- Sourcing: independently researched in this session directly against
-- DGII's own hosted documents -- the full text of Ley 32-23 (PDF),
-- Norma General 01-2020 (PDF), DGII's own news releases and its
-- avisosInformativos index, and DGII's own e-CF technical report --
-- all fetched directly. See PROGRESS.md's build entry for the full
-- citation trail, including two flagged, deliberately-excluded items:
-- Decreto 587-24's exact calendar day (three secondary sources
-- disagree -- 10, 14, or 15 October 2024 -- so this migration cites
-- the month only, not a specific day, and Decreto 587-24 is treated as
-- an implementing regulation rather than its own milestone) and the
-- 2019 pilot's exact statistics (10 companies, 7 completed, ~723,000
-- e-CF issued), which trace to a single Dominican newspaper rather
-- than a DGII primary source.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'do-pilot-announced-2018', id, '2018-09-03', 0,
    'https://dgii.gov.do/noticias/Paginas/Impuestos-Internos-iniciara-piloto-para-factura-electronica-a-principios-de-2019.aspx',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'do-pilot-announced-2018', 'en',
  'DGII announces e-invoicing pilot',
  'On 3 September 2018, the Dirección General de Impuestos Internos (DGII) announced it would run a voluntary electronic-invoicing pilot beginning in early 2019 -- the first concrete step toward what would become Comprobante Fiscal Electrónico (e-CF), the Dominican Republic''s e-invoicing regime. The pilot itself ran 1 February-31 December 2019, with 10 companies enrolled and 7 completing certification as electronic issuers.',
  '["No action required at this stage -- participation was voluntary and limited to pilot volunteers."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'do-voluntary-2020', id, '2020-01-09', 0,
    'https://dgii.gov.do/legislacion/normasGenerales/Documents/NG%20sobre%20Comprobantes%20Fiscales/Norma01-20.pdf',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'do-voluntary-2020', 'en',
  'Voluntary e-CF authorization regime formalized (Norma General 01-2020)',
  'Norma General No. 01-2020 (9 January 2020) formalized a voluntary e-CF authorization regime following the 2019 pilot -- taxpayers could opt in and become certified electronic issuers, but nothing was yet mandatory. This voluntary framework remained in place until Ley 32-23 introduced a binding mandate in 2023.',
  '["Businesses wanting an early start could apply for voluntary e-CF authorization under Norma 01-2020."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'do-law3223-2023', id, '2023-05-16', 1,
    'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf',
    1, '[{"label":"DGII -- e-CF program page","url":"https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'do-law3223-2023', 'en',
  'Ley 32-23 de Facturación Electrónica takes effect',
  'Ley núm. 32-23 was promulgated 16 May 2023 (Gaceta Oficial No. 11107, 17 May 2023) and, under its own Article 42, took effect immediately upon promulgation and publication. It establishes the mandatory e-CF (Comprobante Fiscal Electrónico) regime, the phased taxpayer-category rollout timeline (Art. 37), tax infractions (Art. 26-29), and criminal offenses (Art. 30-31) for fraud and unauthorized system access. This is the legal anchor for the Dominican Republic''s entire e-invoicing mandate.',
  '["Confirm which DGII taxpayer-size category your business falls into (Grande Nacional, Grande Local, Mediano, Pequeño, Micro, or No Clasificado) -- this determines your Art. 37 compliance deadline.","Begin planning for a real-time DGII pre-validation clearance model: e-CF is XML-based and every invoice is submitted to and validated by DGII before it is valid for the buyer."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'do-large-national-2024', id, '2024-05-15', 0,
    'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf',
    1, '[{"label":"DGII -- Oficina Virtual (e-CF applications)","url":"https://www.dgii.gov.do/ofv/login.aspx"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'do-large-national-2024', 'en',
  'First mandatory wave: Large National Taxpayers must issue e-CF',
  'Under Ley 32-23 Article 37''s 12-month deadline, Grandes Contribuyentes Nacionales (Large National Taxpayers) became required to issue e-CF from 15 May 2024 -- the first mandatory wave of the rollout. DGII''s own 25 June 2024 release reported 633 taxpayers required, with 401 fully authorized and roughly 96% either certified or in process by the deadline. Large national-level state/government entities were brought into the same 15 May 2024 wave.',
  '["Large National Taxpayers: confirm your e-CF certification status directly with DGII if not already fully authorized.","If you transact with a Large National Taxpayer counterparty, confirm you can receive e-CF invoices."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'do-large-local-medium-2025', id, '2025-11-15', 0,
    'https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Paginas/default.aspx',
    1, '[{"label":"DGII -- Oficina Virtual (e-CF applications)","url":"https://www.dgii.gov.do/ofv/login.aspx"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'do-large-local-medium-2025', 'en',
  'Second wave: Large Local & Medium Taxpayers must issue e-CF',
  'Ley 32-23 Article 37''s original 24-month deadline set 15 May 2025 for Grandes Contribuyentes Locales y Medianos (Large Local & Medium Taxpayers). DGII''s Aviso 12-25 (dated 15-16 May 2025) granted this segment a 6-month extension, moving the effective deadline to 15 November 2025. Large local/medium-level state entities followed the same extended track.',
  '["Large Local and Medium Taxpayers: confirm e-CF certification is complete against the extended 15 November 2025 deadline.","Check DGII''s avisosInformativos index for the current status of any further extensions before assuming this date is final."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'do-aviso2525-paper-ban-2026', id, '2026-01-01', 0,
    'https://siemprealdia.co/republica-dominicana/impuestos/emision-exclusiva-de-e-cf/',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'do-aviso2525-paper-ban-2026', 'en',
  'Paper vouchers retired for Large National Taxpayers (Aviso 25-25)',
  'DGII''s Aviso 25-25 (18 November 2025) closed a compliance loophole for the segment already mandated since 2024: from 1 January 2026, Grandes Contribuyentes Nacionales may issue e-CF (Type E) exclusively -- paper NCF vouchers (Type B) expire for this segment entirely. This is a tightening of an existing obligation''s format requirements, not an expansion of who must e-invoice.',
  '["Large National Taxpayers: confirm no part of your invoicing workflow still falls back to paper (Type B) vouchers."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'do-small-micro-2026', id, '2026-11-15', 0,
    'https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/06-26.pdf',
    1, '[{"label":"DGII -- Facturador Gratuito (free e-CF invoicing tool)","url":"https://fg.dgii.gov.do/ecf/PortalFG/login"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'DO';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'do-small-micro-2026', 'en',
  'Final wave: Small, Micro & Unclassified Taxpayers must issue e-CF',
  'Ley 32-23 Article 37''s original 36-month deadline set 15 May 2026 for Pequeños, Micros y No Clasificados (Small, Micro & Unclassified Taxpayers) -- the final rollout wave. DGII''s Aviso 06-26 (6 May 2026) granted an automatic 6-month extension, moving the effective deadline to 15 November 2026, the current live target date. State/government entities at this level follow the same 36-month track. By 1 July 2026, DGII reported over 1.86 billion cumulative e-CF issued and registered electronic filers had more than tripled since January 2026, from 23,686 to 76,762.',
  '["Small, Micro, and previously-Unclassified taxpayers: register for DGII''s free Facturador Gratuito tool (capped at 150 invoices/month) if a paid solution is not yet in place.","Confirm certification well ahead of the 15 November 2026 deadline -- DGII reports rapid recent adoption growth in this segment."]'
);
