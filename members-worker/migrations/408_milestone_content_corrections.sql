-- Migration 408: Content corrections for 37 milestones flagged as
-- content-accuracy issues during the follow-up citation-audit pass
-- (see /home/claude/scratch/milestones_followup_report.md, delivered 6 Aug 2026).
--
-- Schema note: `milestones` holds date/source_url; `system`/`desc` live on
-- `milestone_translations` (keyed by milestone_id + lang). This migration
-- only updates the EN translation row for each milestone. DE/ES/FR rows
-- are NOT updated here and will be stale relative to the corrected EN text
-- until a follow-up translation pass — flagging this explicitly rather than
-- silently leaving it unaddressed.
--
-- Two milestones are left deliberately untouched (no correction applied):
--   - ie-phase1-criteria-reconfirmed: no evidence the event itself happened;
--     needs Dan's decision on whether to remove or find a real source.
--   - uk-nhs-peppol: still genuinely unclear after research; no new info found.
--
-- Two possible duplicate-milestone pairs surfaced during this correction pass
-- (kept both milestones, reframed to avoid overlap, flagged for Dan's review):
--   - ca-cra-research-2018 vs ca-watch (both about Canada CRA e-invoicing research)
--   - au-default-2025 vs au-automate (both dated 2026-12-01 after this correction)

-- at-b2b-proposal-2026
UPDATE milestone_translations SET system = 'No formal domestic B2B proposal yet; BMF signals general direction', desc = 'Austria has no domestic B2B e-invoicing or real-time reporting mandate today — B2B structured invoicing remains voluntary, though widely adopted, especially among businesses with EU trading partners already under mandatory regimes. The Finance Ministry (BMF) has signalled it may eventually pursue a Peppol-based approach, mirroring Belgium and the Netherlands, but as of August 2026 no formal proposal, consultation, or specific timeline has been published.' WHERE milestone_id = 'at-b2b-proposal-2026' AND lang = 'en';

-- at-b2g-extended-2018
UPDATE milestones SET date = '2020-04-18', source_url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=718735686' WHERE id = 'at-b2g-extended-2018';

-- au-default-2025
UPDATE milestones SET date = '2026-12-01', source_url = 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/einvoicing-for-government' WHERE id = 'au-default-2025';
UPDATE milestone_translations SET desc = 'The Australian Taxation Office moves e-invoicing to the default invoice exchange method for Non-Corporate Commonwealth Entities, alongside the broader shift to full automation, as part of a strategy to cut administrative overhead and speed up payment cycles.' WHERE milestone_id = 'au-default-2025' AND lang = 'en';

-- be-b2g-phasein
UPDATE milestone_translations SET desc = 'November 2022: contracts/concessions ≥€215,000. May 2023: ≥€30,000. November 2023: below €30,000. March 2024: all federal public contracts and concessions above €3,000, transposing EU Directive 2014/55/EU in full.' WHERE milestone_id = 'be-b2g-phasein' AND lang = 'en';

-- be-mercurius
UPDATE milestones SET source_url = 'https://www.babelway.com/resources/blog/b2b-e-invoicing-mandate-in-belgium-and-the-use-of-peppol/' WHERE id = 'be-mercurius';
UPDATE milestone_translations SET desc = 'Belgium''s central hub for business-to-government e-invoicing goes live, built on the Peppol network from the start and powered by Babelway''s integration technology — the same infrastructure the 2026 B2B mandate would later extend.' WHERE milestone_id = 'be-mercurius' AND lang = 'en';

-- br-mandatory
UPDATE milestones SET source_url = 'https://www.cgibs.gov.br/novo-marco-da-reforma-tributaria-inicia-em-03-de-agosto-com-preenchimento-obrigatorio-dos-campos-relativos-ao-ibs-e-a-cbs' WHERE id = 'br-mandatory';
UPDATE milestone_translations SET system = 'Mandatory IBS/CBS field reporting begins (informational phase)', desc = 'Under Technical Note 2025.002-RTC v1.40, General Tax Regime taxpayers must report IBS and CBS groups in NF-e and NFC-e — though during this period the reported figures remain informational only, without tax effect, ahead of full enforcement later in 2026.' WHERE milestone_id = 'br-mandatory' AND lang = 'en';

-- ca-cra-research-2018
UPDATE milestones SET date = '2021-01-01', source_url = 'https://sovos.com/regulatory-updates/vat/canada-b2b-e-invoicing-study/' WHERE id = 'ca-cra-research-2018';
UPDATE milestone_translations SET system = 'CRA begins researching e-invoicing feasibility', desc = 'The Canada Revenue Agency begins preliminary research into the feasibility of a domestic B2B e-invoicing mandate, ahead of the stakeholder engagement that follows later in the year.' WHERE milestone_id = 'ca-cra-research-2018' AND lang = 'en';

-- cl-sii-pilot-2000s
UPDATE milestones SET date = '2003-01-01', source_url = 'https://www.sii.cl/factura_electronica/factura_mercado/sii.pdf' WHERE id = 'cl-sii-pilot-2000s';

-- eg-law-2020
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/02/23/briefing-document-podcast-e-invoicing-e-reporting-in-egypt/' WHERE id = 'eg-law-2020';
UPDATE milestone_translations SET system = 'Ministerial Decree 188/2020 and first e-invoicing wave', desc = 'Ministerial Decree No. 188/2020 (26 March 2020) established the legal basis for Egypt''s electronic invoicing regime, giving electronic signatures the same legal weight as handwritten ones; the broader Unified Tax Procedures Law (206/2020) later reinforced the mandate. The first wave of large taxpayers registered with the ETA''s Large Taxpayers Centre began mandatory electronic invoicing in November 2020, opening a phased rollout that would eventually reach every VAT-registered business.' WHERE milestone_id = 'eg-law-2020' AND lang = 'en';

-- es-crea-y-crece-law
UPDATE milestones SET date = '2022-09-28', source_url = 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-15818' WHERE id = 'es-crea-y-crece-law';

-- eu-transpose
UPDATE milestones SET date = '2027-12-31', source_url = 'https://www.vatupdate.com/2026/06/29/vida-implementation-single-eu-vat-registration-in-the-member-states/' WHERE id = 'eu-transpose';
UPDATE milestone_translations SET desc = 'Member states must transpose the Single VAT Registration (SVR) provisions of the ViDA Directive into national law by this date. This deadline is specific to the SVR pillar — it is separate from, and earlier than, the transposition timelines for ViDA''s platform-economy pillar (2028) and its e-invoicing/Digital Reporting Requirements pillar (2030).' WHERE milestone_id = 'eu-transpose' AND lang = 'en';

-- fi-peppol-ordering
UPDATE milestones SET date = '2024-04-01', source_url = 'https://www.valtiokonttori.fi/en/peppol-info/' WHERE id = 'fi-peppol-ordering';

-- gr-mydata-mandatory
UPDATE milestones SET date = '2021-10-01', source_url = 'https://sovos.com/en-gb/vat/tax-rules/mydata-greece/' WHERE id = 'gr-mydata-mandatory';

-- hr-b2g-2019
UPDATE milestones SET date = '2019-07-01', source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108879/eInvoicing+in+Croatia' WHERE id = 'hr-b2g-2019';

-- id-efaktur-mandatory-2014
UPDATE milestones SET date = '2014-07-01', source_url = 'https://www.pajak.go.id/en/node/13859' WHERE id = 'id-efaktur-mandatory-2014';
UPDATE milestone_translations SET desc = 'From 1 July 2014, Indonesia''s Directorate General of Taxes (DJP) required a first group of designated VAT-registered taxpayers (Pengusaha Kena Pajak, PKP) to issue e-Faktur Pajak -- an electronic value-added tax invoice -- rather than paper invoices. This was the origin of Indonesia''s long-running move toward mandatory e-invoicing, though at this stage the requirement applied only to a limited set of taxpayers designated by DJP, not the whole VAT-registered population.' WHERE milestone_id = 'id-efaktur-mandatory-2014' AND lang = 'en';

-- il-phase3-10k
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/israel-new-accelerated-timeline-for-ctc-invoice-allocation-number/' WHERE id = 'il-phase3-10k';
UPDATE milestone_translations SET desc = 'The threshold fell to NIS 10,000, skipping the NIS 15,000 step originally planned -- part of a December 2025 acceleration under the Law for Achieving Budgetary Goals and Implementing Economic Policy for the 2025 Fiscal Year, which compressed what was legislated as a five-year rollout through 2028 into two years, ending mid-2026.' WHERE milestone_id = 'il-phase3-10k' AND lang = 'en';

-- it-b2g-2014
UPDATE milestones SET date = '2014-06-01', source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy' WHERE id = 'it-b2g-2014';

-- jo-penalty-grace-end
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/03/20/briefing-document-podcast-e-invoicing-e-reporting-in-jordan/' WHERE id = 'jo-penalty-grace-end';
UPDATE milestone_translations SET desc = 'A grace period waiving accrued fines for businesses that registered late closed on this date. From here, the full penalty regime applies without exception: fines of roughly JOD 500 per violation under the Billing and Control Regulation, plus exclusion from government tenders and invalidation of non-compliant invoices for VAT deduction purposes.' WHERE milestone_id = 'jo-penalty-grace-end' AND lang = 'en';

-- lx-b2b-issue-large
UPDATE milestones SET date = '2028-01-01', source_url = 'https://kpmg.com/lu/en/insights/regulatory-updates/luxembourgs-b2b-e-invoicing-mandate-takes-shape.html' WHERE id = 'lx-b2b-issue-large';
UPDATE milestone_translations SET system = 'Proposed: B2B e-invoice issuance begins for large businesses', desc = 'Large businesses would be required to issue, not just receive, structured domestic B2B e-invoices over Peppol — from the same date the receipt obligation takes effect. Medium-sized businesses follow six months later, from 1 July 2028.' WHERE milestone_id = 'lx-b2b-issue-large' AND lang = 'en';

-- mx-cfdi
UPDATE milestones SET date = '2014-04-01', source_url = 'https://sovos.com/vat/tax-rules/mexico-e-invoicing/' WHERE id = 'mx-cfdi';

-- no-consultation-2024
UPDATE milestones SET date = '2025-06-20', source_url = 'https://www.regjeringen.no/no/dokumenter/horing-pliktig-digital-bokforing-og-e-fakturering-mellom-virksomheter/id3113613/' WHERE id = 'no-consultation-2024';
UPDATE milestone_translations SET system = 'Consultation paper published' WHERE milestone_id = 'no-consultation-2024' AND lang = 'en';

-- nz-5th-edition-effect-2025
UPDATE milestones SET source_url = 'https://www.mbie.govt.nz/about/news/new-edition-of-government-procurement-rules-goes-live' WHERE id = 'nz-5th-edition-effect-2025';
UPDATE milestone_translations SET desc = 'The Fifth Edition Government Procurement Rules take effect, formally updating public sector procurement practice — though the specific large-supplier e-invoicing requirement they introduce doesn''t bind agencies until 1 January 2027.' WHERE milestone_id = 'nz-5th-edition-effect-2025' AND lang = 'en';

-- nz-anz-arrangement-2018
UPDATE milestones SET source_url = 'https://edicomgroup.com/electronic-invoicing/new-zealand' WHERE id = 'nz-anz-arrangement-2018';

-- nz-framework-2019
UPDATE milestones SET date = '2019-10-01', source_url = 'https://www.einvoicing.govt.nz/einvoicing/what-is-einvoicing/mbie-new-zealand-peppol-authority' WHERE id = 'nz-framework-2019';

-- om-phase4-b2g
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/27/oman-launches-fawtara-e-invoicing-four-phase-rollout-begins-august-2026-e-invoicing-faqs/' WHERE id = 'om-phase4-b2g';
UPDATE milestone_translations SET system = 'Phase 4 (government counterparties) — date not yet confirmed', desc = 'The rollout''s final phase is expected to eventually bring government entities fully into scope as e-invoicing counterparties, completing Oman''s phased Fawtara implementation — but as of mid-2026, the OTA has not announced a confirmed date for this phase.' WHERE milestone_id = 'om-phase4-b2g' AND lang = 'en';

-- pe-rollout-2017
UPDATE milestones SET date = '2014-10-01', source_url = 'https://busquedas.elperuano.pe/normaslegales/regulan-la-incorporacion-obligatoria-de-emisores-electronico-resolucion-n-374-2013sunat-1033035-1/' WHERE id = 'pe-rollout-2017';

-- pe-ubl21-2019
UPDATE milestones SET date = '2019-07-01', source_url = 'https://www.sunat.gob.pe/legislacion/superin/2019/043-2019.pdf' WHERE id = 'pe-ubl21-2019';

-- ph-lt100-pilot-2022
UPDATE milestones SET source_url = 'https://www.forvismazars.com/ph/en/insights/tax-alerts/bir-rr-8-2022' WHERE id = 'ph-lt100-pilot-2022';
UPDATE milestone_translations SET system = 'RR 8-2022 makes e-invoicing mandatory for designated taxpayer categories', desc = 'Revenue Regulations No. 8-2022 issued the first implementing rules for the TRAIN Law''s e-invoicing provisions, making e-invoicing/e-receipting mandatory for exporters, e-commerce operators, and Large Taxpayers Service members from 1 July 2022, with roughly 100 large taxpayers initially onboarded onto the Electronic Invoicing/Receipting System (EIS). Technical and capacity problems forced the BIR to pause the program later that year, and it stayed stalled for roughly two years before formally resuming under RR 11-2025.' WHERE milestone_id = 'ph-lt100-pilot-2022' AND lang = 'en';

-- pl-b2g-peppol
UPDATE milestones SET date = '2019-08-01', source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108896/eInvoicing+in+Poland' WHERE id = 'pl-b2g-peppol';
UPDATE milestone_translations SET desc = 'Public-sector invoicing runs on Peppol via the PEF platform, entirely separate from the KSeF platform that would later handle B2B — the two systems don''t share infrastructure. The obligation to accept e-invoices phased in from 18 April 2019 (contracts ≥€30,000) to 1 August 2019 (all contracting authorities), under the Act of 9 November 2018.' WHERE milestone_id = 'pl-b2g-peppol' AND lang = 'en';

-- pt-lei-111b
UPDATE milestones SET date = '2017-08-31', source_url = 'https://diariodarepublica.pt/dr/detalhe/decreto-lei/111-b-2017-108086621' WHERE id = 'pt-lei-111b';
UPDATE milestone_translations SET system = 'Decreto-Lei n.º 111-B/2017 transposes the EU public-procurement e-invoicing directive' WHERE milestone_id = 'pt-lei-111b' AND lang = 'en';

-- pt-lei-82-2023
UPDATE milestones SET date = '2023-12-29', source_url = 'https://diariodarepublica.pt/dr/detalhe/lei/82-2023-221937427' WHERE id = 'pt-lei-82-2023';

-- pt-qr-code
UPDATE milestones SET source_url = 'https://www.occ.pt/pt-pt/noticias/qr-code-1' WHERE id = 'pt-qr-code';
UPDATE milestone_translations SET desc = 'Every invoice — paper or electronic, B2G or otherwise — must carry a QR code enabling validation. The ATCUD unique document code requirement follows a year later, becoming mandatory from 1 January 2023.' WHERE milestone_id = 'pt-qr-code' AND lang = 'en';

-- ro-nonvat-register
UPDATE milestones SET date = '2025-07-01', source_url = 'https://www.vatupdate.com/2026/05/28/romania-expands-ro-e-invoice-registration-new-form-082-more-entities-required-by-2025-2026/' WHERE id = 'ro-nonvat-register';
UPDATE milestone_translations SET desc = 'The mandatory RO e-Invoice Register now also covers associations, foundations and non-profits not registered for VAT, and individual farmers under the special agricultural regime. Sole traders identified only by personal ID number (CNP) follow later, from 1 June 2026.' WHERE milestone_id = 'ro-nonvat-register' AND lang = 'en';

-- sk-peppol-codelist-2025
UPDATE milestones SET source_url = 'https://docs.peppol.eu/edelivery/codelists/changelog.html' WHERE id = 'sk-peppol-codelist-2025';
UPDATE milestone_translations SET desc = 'Scheme 0245 (SK:DIC) is formalised for the 10-digit Slovak Tax Identification Number (DIČ), the identifier Slovak end users will register under on the Peppol network.' WHERE milestone_id = 'sk-peppol-codelist-2025' AND lang = 'en';

-- sk-postman-mandatory-2027
UPDATE milestones SET date = '2027-04-01', source_url = 'https://www.fiscal-requirements.com/news/5618' WHERE id = 'sk-postman-mandatory-2027';
UPDATE milestone_translations SET desc = 'Using only certified Digital Postman service providers for transmission and reception becomes a firm requirement — the penalty-free grace period running from 1 January to 31 March 2027 ends here.' WHERE milestone_id = 'sk-postman-mandatory-2027' AND lang = 'en';

-- uae-ministerial-decisions
UPDATE milestones SET date = '2025-09-29', source_url = 'https://www.vatupdate.com/2025/10/02/uae-e-invoicing-two-2025-ministerial-decisions-set-scope-duties-and-a-phased-timeline/' WHERE id = 'uae-ministerial-decisions';

-- uae-penalty-framework
UPDATE milestones SET date = '2025-11-24', source_url = 'https://www.cleartax.com/ae/uae-e-invoicing-penalties-cabinet-decision' WHERE id = 'uae-penalty-framework';
UPDATE milestone_translations SET desc = 'Five specific e-invoicing violation categories are defined with fixed penalties: failure to implement the system on time, non-issuance of e-invoices or e-credit notes, failure to report system failures, and late master-data updates.' WHERE milestone_id = 'uae-penalty-framework' AND lang = 'en';
