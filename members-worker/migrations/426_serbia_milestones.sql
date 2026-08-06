-- Serbia: milestones + English translations. Hand-written (not
-- scaffolder-generated, to keep full control over mandate_scope/
-- anchor/on_tracker per milestone). INSERT OR IGNORE throughout.
--
-- Sourcing: core e-invoicing law (Zakon o elektronskom fakturisanju,
-- "Sl. glasnik RS" br. 44/2021, 129/2021, 138/2022, 92/2023, 94/2024,
-- 109/2025) confirmed via Serbia's own Legal Information System
-- (pravno-informacioni-sistem.rs) and the official SEF portal
-- (efaktura.gov.rs). The separate e-delivery-note law (Zakon o
-- elektronskim otpremnicama, "Sl. glasnik RS" br. 94/2024 i 109/2025)
-- confirmed via the Ministry of Finance's own legal-text pages
-- (mfin.gov.rs) and cross-checked against three independent secondary
-- summaries (Comarch, VATupdate, docloop.rs, injac.rs) that agree on
-- the two-phase 1 Jan 2026 / 1 Oct 2027 structure. All facts verified
-- by direct fetch in this session -- see PROGRESS.md's build entry for
-- the full citation trail, including two items flagged as unresolved
-- (the exact new date for a separately-reported "expanded B2B reform
-- package," and article-by-article penalty attribution relying on a
-- secondary legal compiler, Paragraf.rs, rather than raw gazette text).

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'rs-b2g-suppliers-2022', id, '2022-05-01', 1,
    'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg',
    0, '[{"label":"SEF -- Sistem elektronskih faktura","url":"https://www.efaktura.gov.rs/"}]',
    NULL, 'b2g_only'
  FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'rs-b2g-suppliers-2022', 'en',
  'B2G mandate: suppliers to the public sector must issue e-invoices',
  'From 1 May 2022, every private-sector supplier to a Serbian public-sector buyer has been required to issue invoices electronically through SEF (Sistem elektronskih faktura), the government''s central e-invoicing platform, under the Zakon o elektronskom fakturisanju ("Sl. glasnik RS" br. 44/2021, 129/2021, 138/2022).',
  '["Confirm your business issues invoices to Serbian public-sector buyers through SEF, not paper or plain PDF.","Register for a SEF account (efaktura.gov.rs) if you have not already."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'rs-g2b-2022', id, '2022-07-01', 0,
    'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg',
    0, '[{"label":"SEF -- Sistem elektronskih faktura","url":"https://www.efaktura.gov.rs/"}]',
    NULL, 'b2g_only'
  FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'rs-g2b-2022', 'en',
  'G2B leg completes: public-sector entities must issue e-invoices to companies',
  'From 1 July 2022, Serbian public-sector entities themselves became required to issue e-invoices to private companies through SEF, completing the B2G/G2B leg of the rollout ahead of the general B2B mandate that followed on 1 January 2023.',
  '["If you receive invoices from Serbian public-sector entities, confirm your accounts-payable process can receive them via SEF."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'rs-b2b-mandatory-2023', id, '2023-01-01', 1,
    'https://pravno-informacioni-sistem.rs/eli/rep/sgrs/skupstina/zakon/2021/44/3/reg',
    1, '[{"label":"SEF -- Sistem elektronskih faktura","url":"https://www.efaktura.gov.rs/"},{"label":"SEF demo/test environment","url":"https://demoefaktura.mfin.gov.rs/login"}]',
    NULL, 'b2b'
  FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'rs-b2b-mandatory-2023', 'en',
  'B2B e-invoicing becomes mandatory nationwide',
  'From 1 January 2023, e-invoicing (both issuance and receipt) became mandatory across Serbia''s entire private sector, for all VAT-registered taxpayers -- no company-size or revenue threshold was found in the law''s text. Every invoice is submitted to and validated by SEF before reaching the recipient, a centralized clearance (CTC) model functionally similar to Italy''s SDI, using XML based on UBL 2.1 with a Serbia-specific CIUS aligned to EN 16931.',
  '["Confirm your invoicing software or provider can issue and receive SEF-compliant e-invoices.","If you are a foreign company operating in Serbia via a local tax ID or fiscal representative, confirm you are registered and connected to SEF."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'rs-vat-recording-2023', id, '2023-01-01', 0,
    'https://www.paragraf.rs/baza-znanja/e-arhiva/evidentiranje-pdv-u-sef-evidencija-u-sistem-elektronskih-faktura.html',
    0, '[]', NULL, 'none'
  FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'rs-vat-recording-2023', 'en',
  'Electronic recording of VAT self-assessment becomes mandatory in SEF',
  'Alongside the general B2B e-invoicing mandate, VAT-registered taxpayers also became required to electronically record their VAT self-assessment calculation within SEF from 1 January 2023, under Art. 4 of the core e-invoicing law. This is a VAT-recording obligation layered on top of the e-invoicing mandate, not a separate invoicing requirement in itself.',
  '["Confirm your VAT compliance process includes the SEF electronic VAT-recording step, separate from simply issuing e-invoices."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'rs-eotpremnica-phase1-2026', id, '2026-01-01', 1,
    'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1',
    1, '[{"label":"e-otpremnica -- the central e-delivery-note platform","url":"https://eotpremnica.efaktura.gov.rs/"}]',
    NULL, 'none'
  FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'rs-eotpremnica-phase1-2026', 'en',
  'E-delivery note (e-otpremnica) Phase 1 takes effect',
  'A separate statute, the Zakon o elektronskim otpremnicama ("Sl. glasnik RS" br. 94/2024 i 109/2025), makes electronic delivery notes mandatory from 1 January 2026 for public-sector entities, traders in excise goods (fuel, alcohol, tobacco, e-cigarettes, electricity, coffee), and carriers presenting waybills at roadside inspection. This is a goods-movement documentation requirement, distinct from the e-invoicing mandate -- a grace period ran to 30 June 2026 before full inspection enforcement began.',
  '["If your business moves excise goods in Serbia or operates as a carrier, confirm your e-otpremnica readiness via the eotpremnica.efaktura.gov.rs portal, web UI, mobile app, or API.","Note this obligation is separate from SEF e-invoicing -- compliance with one does not cover the other."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'rs-eotpremnica-phase2-2027', id, '2027-10-01', 0,
    'https://mfin.gov.rs/sr/propisi-1/zakon-o-elektronskim-otpremnicama-slubeni-glasnik-rs-br-942024-i-1092025-nezvanino-preien-tekst-redakcije-slubenog-glasnika-1',
    1, '[{"label":"e-otpremnica -- the central e-delivery-note platform","url":"https://eotpremnica.efaktura.gov.rs/"}]',
    NULL, 'none'
  FROM countries WHERE code = 'RS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'rs-eotpremnica-phase2-2027', 'en',
  'E-delivery note (e-otpremnica) Phase 2 extends to the general private sector',
  'From 1 October 2027, the e-otpremnica obligation extends beyond Phase 1''s public-sector/excise-goods/carrier scope to general private-sector B2B (and B2C receipt) movement of goods. Note: this is a distinct development from a separately-reported "expanded B2B e-invoicing reform" package (new SEF invoice fields, stricter validation, full document archiving, a new penalty regime) that secondary sources describe as postponed to "end of 2026" -- that reform''s exact date could not be confirmed against a primary Ministry of Finance announcement as of this writing.',
  '["If you move goods B2B in Serbia outside the Phase 1 categories, plan your e-otpremnica readiness for the 1 October 2027 date.","Watch official SEF/Ministry of Finance channels for confirmation of the separately-reported \"expanded B2B\" e-invoicing reform package, which remains unconfirmed as to its exact date."]'
);
