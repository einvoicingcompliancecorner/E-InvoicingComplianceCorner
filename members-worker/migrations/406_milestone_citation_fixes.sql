-- Migration 406: Milestone citation fixes
--
-- Follow-up to migration 405 (story citation fixes). A full citation-adequacy audit
-- was run across all 331 milestones on the tracker (Dan's request, 6 Aug 2026), using
-- the same methodology as the 140-story audit: fetch each milestone's cited source_url,
-- check it specifically supports the milestone's claim (not just same topic/country),
-- and search for a replacement when it doesn't.
--
-- Results: 92 ADEQUATE, 192 INADEQUATE, 47 MISSING (72.2% with a citation problem,
-- closely matching the story audit's 71%).
--
-- This migration fixes the 121 milestones where a citation problem was confirmed AND
-- a verified replacement source was found that does not conflict with the milestone's
-- own stated claim. It deliberately excludes two categories, left for a follow-up pass:
--
--   1. ~49 milestones flagged with a CONTENT-ACCURACY concern -- i.e. the claim itself
--      (a date, threshold, or named person) appears wrong or is contradicted by the
--      sources found, not just under-cited. Swapping in a citation there would attach
--      a source that doesn't actually support the milestone's (possibly incorrect) text.
--      These need Dan's judgment on the underlying fact first -- same rule as the
--      2026-06-15-india-threshold-reduction-discussion story left unfixed in migration 405.
--
--   2. ~70 milestones where WebSearch hit its session quota mid-audit and no replacement
--      could be located in this pass. Marked 'none found' for tooling reasons, not
--      confirmed absence of a better source -- needs a follow-up search pass.
--
-- Full audit findings (raw, all 331 milestones): see PROGRESS.md entry dated 6 Aug 2026.

UPDATE milestones SET source_url = 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm' WHERE id = 'br-lei-complementar-2025';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2024/03/29/germany-current-status-of-b2b-e-invoicing/' WHERE id = 'de-wachstumschancengesetz';
UPDATE milestones SET source_url = 'https://www.e-rechnung-bund.de/en/faq/' WHERE id = 'de-xrechnung-b2g';
UPDATE milestones SET source_url = 'https://erhvervsstyrelsen.dk/vejledning-bogfoeringsloven' WHERE id = 'dk-established';
UPDATE milestones SET source_url = 'https://erhvervsstyrelsen.dk/vejledning-bogfoeringsloven' WHERE id = 'dk-phasein';
UPDATE milestones SET source_url = 'https://vatcalc.com/ecuador/' WHERE id = 'ec-universal-2022';
UPDATE milestones SET source_url = 'https://www.vatcalc.com/spain/spanish-b2b-crea-y-crece-e-invoice-approved-july-2027-28/' WHERE id = 'es-b2b-all';
UPDATE milestones SET source_url = 'https://www.vatcalc.com/spain/spanish-b2b-crea-y-crece-e-invoice-approved-july-2027-28/' WHERE id = 'es-b2b-large';
UPDATE milestones SET source_url = 'https://www.boe.es/buscar/act.php?id=BOE-A-2013-13722' WHERE id = 'es-b2g-face';
UPDATE milestones SET source_url = 'https://sede.agenciatributaria.gob.es/Sede/iva/suministro-inmediato-informacion.html' WHERE id = 'es-sii-introduced';
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/spain-further-postponement-of-verifactu-deadlines-announced/' WHERE id = 'es-verifactu-corp';
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/spain-further-postponement-of-verifactu-deadlines-announced/' WHERE id = 'es-verifactu-rest';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/29/e-invoicing-e-reporting-explained-en16931-european-e-invoicing-standard/' WHERE id = 'eu-en16931-2026';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/01/03/briefing-document-podcast-e-invoicing-and-e-reporting-in-finland/' WHERE id = 'fi-early2000s';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/22/french-e-invoicing-mandate-a-comprehensive-briefing/' WHERE id = 'fr-b2g-chorus';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/eInvoicing+in+Croatia' WHERE id = 'hr-b2b';
UPDATE milestones SET source_url = 'https://sovos.com/vat/tax-rules/rtir-hungary/' WHERE id = 'hu-rtir-scope-2021';
UPDATE milestones SET source_url = 'https://hanumaglobal.com/mandates/indonesia' WHERE id = 'id-efaktur-nationwide-2016';
UPDATE milestones SET source_url = 'https://www.revenue.ie/en/corporate/press-office/press-releases/2026/pr-021026-phase-one-vat-modernisation.aspx' WHERE id = 'ie-phase1-criteria-2026';
UPDATE milestones SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2025/12/tnf-israel-expansion-of-mandatory-e-invoicing-model.html' WHERE id = 'il-phase2-20k';
UPDATE milestones SET source_url = 'https://sovos.com/en-gb/vat/tax-rules/e-invoicing-israel/' WHERE id = 'il-pilot-25k';
UPDATE milestones SET source_url = 'https://sovos.com/vat/tax-rules/e-invoicing-india/' WHERE id = 'in-500cr-2020';
UPDATE milestones SET source_url = 'https://sovos.com/vat/tax-rules/e-invoicing-india/' WHERE id = 'in-threshold';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108890/eInvoicing+in+Italy' WHERE id = 'it-sdi';
UPDATE milestones SET source_url = 'https://www.informazionefiscale.it/fattura-elettronica-2026-novita-specifiche-tecniche' WHERE id = 'it-v191-mandatory';
UPDATE milestones SET source_url = 'https://www.informazionefiscale.it/fattura-elettronica-2026-novita-specifiche-tecniche' WHERE id = 'it-v191-published';
UPDATE milestones SET source_url = 'https://www.cygnet.one/products/cygnet-tax/e-invoicing/jordan' WHERE id = 'jo-launch';
UPDATE milestones SET source_url = 'https://www.cygnet.one/products/cygnet-tax/e-invoicing/jordan' WHERE id = 'jo-phase1';
UPDATE milestones SET source_url = 'https://edicomgroup.com/electronic-invoicing/jordan' WHERE id = 'jo-phase2';
UPDATE milestones SET source_url = 'https://www.cygnet.one/products/cygnet-tax/e-invoicing/jordan' WHERE id = 'jo-universal-registration';
UPDATE milestones SET source_url = 'https://www.bdo.global/en-gb/microsites/tax-newsletters/indirect-tax-news/issue-1-2022/japan-update-on-new-jct-invoicing-system-and-commencement-of-registration-procedure' WHERE id = 'jp-registration-opens-2021';
UPDATE milestones SET source_url = 'https://kpmg.com/lu/en/insights/regulatory-updates/luxembourgs-b2b-e-invoicing-mandate-takes-shape.html' WHERE id = 'lx-b2b-issue-all';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/08/02/luxembourg-moves-towards-mandatory-b2b-e-invoicing/' WHERE id = 'lx-b2b-receipt';
UPDATE milestones SET source_url = 'https://www.involvia.ai/2026/01/23/catalogos-sat-2026-claves-de-percepcion-que-mas-se-estan-rechazando/' WHERE id = 'mx-anexo20-2026';
UPDATE milestones SET source_url = 'https://sovos.com/vat/tax-rules/mexico-e-invoicing/' WHERE id = 'mx-cfdi40-2023';
UPDATE milestones SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2025/11/mexico-updates-electronic-invoicing-cfdi-2026-tax-reform.html' WHERE id = 'mx-reform';
UPDATE milestones SET source_url = 'https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/garis-masa-pelaksanaan-e-invois/' WHERE id = 'my-phase1';
UPDATE milestones SET source_url = 'https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/garis-masa-pelaksanaan-e-invois/' WHERE id = 'my-phase2';
UPDATE milestones SET source_url = 'https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/garis-masa-pelaksanaan-e-invois/' WHERE id = 'my-phase3';
UPDATE milestones SET source_url = 'https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/garis-masa-pelaksanaan-e-invois/' WHERE id = 'my-phase4';
UPDATE milestones SET source_url = 'https://jomeinvoice.my/e-invoice-faq-malaysia-related-company-guide/' WHERE id = 'my-related';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108895/eInvoicing+in+The+Netherlands' WHERE id = 'nl-b2b-voluntary';
UPDATE milestones SET source_url = 'https://www.rijksoverheid.nl/documenten/kamerstukken/2026/03/10/aanbiedingsbrief-rapport-vida-efacturatie-en-digitale-rapportage' WHERE id = 'nl-eyreport-2026';
UPDATE milestones SET source_url = 'https://marosavat.com/vat-news/e-invoicing-norway-complete-guide' WHERE id = 'no-b2g-2019';
UPDATE milestones SET source_url = 'https://www.regjeringen.no/contentassets/82857e47862d4714bb0ab1813579a7bd/oppdragsbrev-til-skattedirektoratet.pdf' WHERE id = 'no-instruction-2026';
UPDATE milestones SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2026/03/tnf-norway-ministry-of-finance-accelerates-mandatory-digital-bookkeeping-and-e-invoicing-requirements.html' WHERE id = 'no-issue';
UPDATE milestones SET source_url = 'https://lovdata.no/dokument/LTI/lov/2026-06-19-39' WHERE id = 'no-law-enacted-2026';
UPDATE milestones SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2026/03/tnf-norway-ministry-of-finance-accelerates-mandatory-digital-bookkeeping-and-e-invoicing-requirements.html' WHERE id = 'no-receive';
UPDATE milestones SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2026/03/tnf-norway-ministry-of-finance-accelerates-mandatory-digital-bookkeeping-and-e-invoicing-requirements.html' WHERE id = 'no-technical-detail-2026';
UPDATE milestones SET source_url = 'https://www.procurement.govt.nz/government-procurement-framework/government-procurement-rules/procurement-system-requirements/einvoicing-capability/' WHERE id = 'nz-2000';
UPDATE milestones SET source_url = 'https://www.procurement.govt.nz/government-procurement-framework/government-procurement-rules/procurement-system-requirements/einvoicing-capability/' WHERE id = 'nz-central';
UPDATE milestones SET source_url = 'https://www.einvoicing.govt.nz/get-set-up/advice-for-government-agencies/government-agencies-requirements-large-suppliers-einvoicing' WHERE id = 'nz-largesupplier';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/10/omans-fawtara-e-invoicing-rollout-key-dates-and-compliance-updates/' WHERE id = 'om-asp';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/27/oman-launches-fawtara-e-invoicing-four-phase-rollout-begins-august-2026-e-invoicing-faqs/' WHERE id = 'om-phase1';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/27/oman-launches-fawtara-e-invoicing-four-phase-rollout-begins-august-2026-e-invoicing-faqs/' WHERE id = 'om-phase2';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/27/oman-launches-fawtara-e-invoicing-four-phase-rollout-begins-august-2026-e-invoicing-faqs/' WHERE id = 'om-phase3';
UPDATE milestones SET source_url = 'https://busquedas.elperuano.pe/dispositivo/NL/2490419-1' WHERE id = 'pe-airline-2026';
UPDATE milestones SET source_url = 'https://thelemabogados.pe/es/a-partir-del-01-de-junio-2022-todas-las-empresas-deberan-emitir-solo-comprobantes-de-pago-electronicos/' WHERE id = 'pe-established';
UPDATE milestones SET source_url = 'https://gestion.pe/economia/sunat-principales-contribuyentes-obligados-emitir-comprobantes-electronicos-julio-270011-noticia/' WHERE id = 'pe-ose-2019';
UPDATE milestones SET source_url = 'https://lawphil.net/statutes/repacts/ra2017/ra_10963_2017.html' WHERE id = 'ph-train-law-2018';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/09/ksef-2-0-mandatory-national-e-invoicing-rolls-out-in-2026/' WHERE id = 'pl-all';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2025/11/10/poland-launches-ksef-certificates-module-to-streamline-electronic-invoicing-and-authorizations/' WHERE id = 'pl-certificates-available';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/09/ksef-2-0-mandatory-national-e-invoicing-rolls-out-in-2026/' WHERE id = 'pl-grace-period-ends';
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/poland-ksef-2-0-official-api-documentation-and-fa3-logical-structure-published/' WHERE id = 'pl-ksef2-api-published';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/09/ksef-2-0-mandatory-national-e-invoicing-rolls-out-in-2026/' WHERE id = 'pl-large';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/07/09/ksef-2-0-mandatory-national-e-invoicing-rolls-out-in-2026/' WHERE id = 'pl-micro';
UPDATE milestones SET source_url = 'https://marosavat.com/vat-news/e-invoicing-poland-guide-ksef' WHERE id = 'pl-test-environment';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2025/04/02/portugal-extends-b2g-e-invoicing-deadline-for-smes-to-december-31-2025/' WHERE id = 'pt-b2g-sme';
UPDATE milestones SET source_url = 'https://www2.gov.pt/en/servicos/consultar-o-programa-de-faturacao-certificado' WHERE id = 'pt-certified-software';
UPDATE milestones SET source_url = 'https://rtcsuite.com/portugal-qes-delay-2027-saft-accounting-2028/' WHERE id = 'pt-pdf-valid-through-2026';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/718735716/2024+Portugal+2024+eInvoicing+Country+Sheet' WHERE id = 'pt-public-bodies-receive';
UPDATE milestones SET source_url = 'https://rtcsuite.com/portugal-qes-delay-2027-saft-accounting-2028/' WHERE id = 'pt-qes';
UPDATE milestones SET source_url = 'https://rtcsuite.com/portugal-qes-delay-2027-saft-accounting-2028/' WHERE id = 'pt-saft-full';
UPDATE milestones SET source_url = 'https://www.fiskaly.com/blog/fiscalization-atcud-qes-in-portugal' WHERE id = 'pt-saft-introduced';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/07/briefing-document-romanian-e-invoicing-and-e-transport-regulations/' WHERE id = 'ro-b2c';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/07/briefing-document-romanian-e-invoicing-and-e-transport-regulations/' WHERE id = 'ro-b2g';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/07/briefing-document-romanian-e-invoicing-and-e-transport-regulations/' WHERE id = 'ro-established';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/07/briefing-document-romanian-e-invoicing-and-e-transport-regulations/' WHERE id = 'ro-law296';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/02/10/romania-delays-mandatory-ro-e-factura-for-smes-to-july-2026-new-invoice-rules-announced/' WHERE id = 'ro-sme';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/07/briefing-document-romanian-e-invoicing-and-e-transport-regulations/' WHERE id = 'ro-voluntary';
UPDATE milestones SET source_url = 'https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx' WHERE id = 'sa-phase1';
UPDATE milestones SET source_url = 'https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx' WHERE id = 'sa-phase2-wave1';
UPDATE milestones SET source_url = 'https://www.upphandlingsmyndigheten.se/en/public-procurement/e-commerce/the-law-and-regulation-on-e-invoices/' WHERE id = 'se-act-2018';
UPDATE milestones SET source_url = 'https://edicomgroup.com/blog/sweden-einvoicing-digital-vat-initiative' WHERE id = 'se-b2b-assessment-2023';
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/sweden-launches-vida-investigation/' WHERE id = 'se-b2b-expected';
UPDATE milestones SET source_url = 'https://www.upphandlingsmyndigheten.se/en/public-procurement/e-commerce/the-law-and-regulation-on-e-invoices/' WHERE id = 'se-b2g-extended-2019';
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/sweden-launches-vida-investigation/' WHERE id = 'se-inquiry-findings-2027';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2024/10/14/sfti-continues-to-phase-out-standards-in-favor-of-peppol-bis/' WHERE id = 'se-sfti-phaseout-2025';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2025/03/07/sweden-adopts-peppol-for-customs-invoicing-in-2025/' WHERE id = 'se-tullverket-2025';
UPDATE milestones SET source_url = 'https://www.comarch.com/trade-and-services/data-management/legal-regulation-changes/sweden-launches-official-inquiry-into-mandatory-e-invoicing-implementation/' WHERE id = 'se-vida-inquiry-2026';
UPDATE milestones SET source_url = 'https://peppol.org/learn-more/country-profiles/singapore/' WHERE id = 'sg-b2g-channel-2020';
UPDATE milestones SET source_url = 'https://www.imda.gov.sg/how-we-can-help/nationwide-e-invoicing-framework' WHERE id = 'sg-first-peppol-2018';
UPDATE milestones SET source_url = 'https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/gst-invoicenow-requirement' WHERE id = 'sg-phase-2029';
UPDATE milestones SET source_url = 'https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/gst-invoicenow-requirement' WHERE id = 'sg-phase-2030';
UPDATE milestones SET source_url = 'https://www.iras.gov.sg/who-we-are/what-we-do/annual-reports-and-publications/taxbytes-iras/gst/prepare-early-and-adopt-the-gst-invoicenow-requirement-from-1-may-2025' WHERE id = 'sg-voluntary-phase-2025';
UPDATE milestones SET source_url = 'https://www.banqup.com/resources/blog/slovakia-s-path-to-e-invoicing-b2g-b2b-and-what-s-next-' WHERE id = 'sk-b2b-postponed-2024';
UPDATE milestones SET source_url = 'https://edicomgroup.com/electronic-invoicing/slovakia' WHERE id = 'sk-b2g-2023';
UPDATE milestones SET source_url = 'https://www.banqup.com/resources/blog/slovakia-s-next-step-a-5-corner-model-for-e-invoicing-in-2027' WHERE id = 'sk-crossborder-2030';
UPDATE milestones SET source_url = 'https://www.financnasprava.sk/en/businesses/taxes-businesses/value-added-tax/e-invoicing' WHERE id = 'sk-mandate';
UPDATE milestones SET source_url = 'https://www.financnasprava.sk/en/businesses/taxes-businesses/value-added-tax/e-invoicing' WHERE id = 'sk-voluntary';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/05/11/uae-extends-e-invoicing-asp-appointment-deadline-to-30-october-2026/' WHERE id = 'uae-asp';
UPDATE milestones SET source_url = 'https://mof.gov.ae/wp-content/uploads/2025/02/UAE-eInvoicing-Public-Consultation-document.pdf' WHERE id = 'uae-dict-consult';
UPDATE milestones SET source_url = 'https://mof.gov.ae/en/about-us/initiatives/einvoicing/pre-approved-einvoicing-service-providers/' WHERE id = 'uae-first-asps';
UPDATE milestones SET source_url = 'https://www.deloitte.com/middle-east/en/services/tax/perspectives/uae-e-invoicing-asp-appointment-deadline-extended-but-go-live-remains-01012027.html' WHERE id = 'uae-phase1';
UPDATE milestones SET source_url = 'https://www.hawksford.com/insights-and-guides/uae-e-invoicing' WHERE id = 'uae-phase2';
UPDATE milestones SET source_url = 'https://gulfnews.com/business/tax-news/uae-to-launch-pilot-phase-of-electronic-invoicing-system-in-july-2026-1.500424633' WHERE id = 'uae-pilot';
UPDATE milestones SET source_url = 'https://www.icas.com/news-insights-events/news/tax/autumn-budget-2025-e-invoicing-will-go-ahead-from-2029' WHERE id = 'uk-budget-2025';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/16/e-invoicing-framework-taking-shape-stakeholder-co-design-and-peppol-specifications/' WHERE id = 'uk-budget-2026-due';
UPDATE milestones SET source_url = 'https://www.vatcalc.com/united-kingdom/uk-2029-mandatory-b2b-e-invoicing/' WHERE id = 'uk-peppol-confirmed';
UPDATE milestones SET source_url = 'https://www.gov.uk/government/publications/procurement-act-2023-guidance-documents-manage-phase/guidance-electronic-invoicing-and-payment-html' WHERE id = 'uk-procurement-act';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/16/e-invoicing-framework-taking-shape-stakeholder-co-design-and-peppol-specifications/' WHERE id = 'uk-stakeholder-phase';
UPDATE milestones SET source_url = 'https://www.avalara.com/blog/en/europe/2022/05/usa-e-invoicing-market-pilot-update.html' WHERE id = 'us-bpc-pilot-2022';
UPDATE milestones SET source_url = 'https://www.storecove.com/blog/en/digital-business-network-alliance/' WHERE id = 'us-dbnalliance';
UPDATE milestones SET source_url = 'https://obamawhitehouse.archives.gov/sites/default/files/omb/memoranda/2015/m-15-19.pdf' WHERE id = 'us-federal-b2g';
UPDATE milestones SET source_url = 'https://obamawhitehouse.archives.gov/sites/default/files/omb/memoranda/2015/m-15-19.pdf' WHERE id = 'us-omb-2015';
UPDATE milestones SET source_url = 'https://www.vatcalc.com/united-states/us-e-invoicing-pilot-extended-into-2023/' WHERE id = 'us-pilot-finalised-2023';
UPDATE milestones SET source_url = 'https://llbsolutions.com/es/cfe-v25-1-en-uruguay-nuevos-controles-de-dgi-desde-el-15-de-abril-de-2026/' WHERE id = 'uy-cfe-v25-controls-2026';
UPDATE milestones SET source_url = 'https://thuvienphapluat.vn/van-ban/EN/Ke-toan-Kiem-toan/Decree-123-2020-ND-CP-prescribing-invoices-and-records/457847/tieng-anh.aspx' WHERE id = 'vn-decree-123-2020';
UPDATE milestones SET source_url = 'https://www.china-briefing.com/china-outbound-news/decree-70-key-amendments-to-invoice-regulations-in-vietnam' WHERE id = 'vn-decree-70-2025';
UPDATE milestones SET source_url = 'https://www.vietnam-briefing.com/news/vietnam-e-invoice-implementation-prepare-for-july-2022.html/' WHERE id = 'vn-mandate-2022';
UPDATE milestones SET source_url = 'https://www.vatcalc.com/vietnam/vietnam-vat-b2b-e-invoice-implementations-starts-nov-2021/' WHERE id = 'vn-pilot-2021';
