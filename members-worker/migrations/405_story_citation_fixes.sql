-- Citation-quality audit (6 Aug 2026): fixes source_url for 99 newsletter
-- stories where the cited source didn't substantiate the story's specific
-- claims -- e.g. a country's generic tax-authority homepage cited instead
-- of the actual dated press release/resolution/article. Originated from
-- Dan flagging Hungary's 2026-08-04 story; a full audit of all 140
-- published stories found 96 INADEQUATE + 4 MISSING (no source_url at all).
-- One additional story (2026-06-15-india-threshold-reduction-discussion) is
-- deliberately NOT touched here -- its core claim (GST Council discussing a
-- cut to Rs2-3 crore) could not be corroborated by any source found across
-- multiple searches, so this is a content-accuracy question for Dan, not a
-- citation swap.

UPDATE stories SET source_url = 'https://fiscal.treasury.gov/financial-management-solutions/financial-innovation-transformation-fit/e-invoicing' WHERE id = '2018-01-01-us-federal-ipp-mandate';
UPDATE stories SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/75667312/Ireland+2019+eInvoicing+Country+Sheet' WHERE id = '2019-04-18-ireland-b2g-mandate';
UPDATE stories SET source_url = 'https://www.recommand.eu/en/countries/canada' WHERE id = '2022-04-01-canada-federal-b2g-mandate';
UPDATE stories SET source_url = 'https://edicomgroup.com/electronic-invoicing/vietnam' WHERE id = '2022-07-01-vietnam-nationwide-mandate';
UPDATE stories SET source_url = 'https://www.primicias.ec/noticias/economia/negocios-populares-facturacion-electronica-ecuador/' WHERE id = '2022-11-30-ecuador-universal-coverage';
UPDATE stories SET source_url = 'https://edicomgroup.com/blog/jordan-prepares-to-launch-the-electronic-invoice' WHERE id = '2023-01-15-jordan-phase1-large-taxpayers';
UPDATE stories SET source_url = 'https://ustr.gov/sites/default/files/240312%20Joint%20Declaration%20einvoicing%20final%20text_US.pdf' WHERE id = '2024-04-11-us-eu-joint-declaration';
UPDATE stories SET source_url = 'https://sovos.com/vat/tax-rules/e-invoicing-israel/' WHERE id = '2024-05-20-israel-pilot-launch';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2024/10/31/jordan-on-the-road-to-electronic-invoicing-with-jofotara/' WHERE id = '2024-05-20-jordan-universal-registration';
UPDATE stories SET source_url = 'https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/a1e3b4ac-948c-46f7-8f64-8967be8a76cc/BOLETIN%20061_SRI%20AMPL%C3%8DA%20PLAZO%20PARA%20LA%20TRANSMISI%C3%93N%20DE%20COMPROBANTES%20ELECTR%C3%93NICOS%20DEBIDO%20A%20EMERGENCIA%20EL%C3%89CTRICA.pdf' WHERE id = '2024-11-05-ecuador-emergency-relaxation';
UPDATE stories SET source_url = 'https://www.valtiokonttori.fi/en/maaraykset-ja-ohjeet/the-central-governments-detailed-instructions-for-using-the-advanced-ordering-process-in-peppol/' WHERE id = '2025-01-01-finland-peppol-advanced-ordering';
UPDATE stories SET source_url = 'https://sovos.com/vat/tax-rules/e-invoicing-israel/' WHERE id = '2025-01-15-israel-enforcement-powers-activate';
UPDATE stories SET source_url = 'https://einvoice6.gst.gov.in/content/revised-time-limit-for-e-invoice-reporting-for-businesses-with-aato-of-%E2%82%B910-crores-above/' WHERE id = '2025-04-01-india-30-day-reporting-window';
UPDATE stories SET source_url = 'https://edicomgroup.com/blog/jordan-prepares-to-launch-the-electronic-invoice' WHERE id = '2025-04-15-jordan-phase2-full-enforcement';
UPDATE stories SET source_url = 'https://www.vietnam-briefing.com/news/decree-70-key-amendments-to-invoice-regulations-in-vietnam.html/' WHERE id = '2025-06-01-vietnam-decree-70-expands-scope';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2025/09/29/netherlands-reveals-four-phase-plan-for-eu-vida-implementation-by-2030-deadline/' WHERE id = '2025-08-15-netherlands-vida-roadmap';
UPDATE stories SET source_url = 'https://ticofactura.cr/tribu-cr-ya-es-una-realidad-hacienda-pone-en-operacion-su-nuevo-sistema-tributario' WHERE id = '2025-10-06-costa-rica-tribu-cr-launches';
UPDATE stories SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2025/10/ireland-phased-rollout-e-invoicing-real-time-vat-reporting.html' WHERE id = '2025-10-08-ireland-b2b-mandate-announced';
UPDATE stories SET source_url = 'https://edicomgroup.com/blog/oman-electronic-invoicing' WHERE id = '2025-10-15-oman-fawtara-announced';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2025/10/25/netherlands-plans-mandatory-peppol-based-b2b-e-invoicing-regime-by-july-2030/' WHERE id = '2025-10-20-netherlands-why-no-b2b-mandate-yet';
UPDATE stories SET source_url = 'https://edicomgroup.com/blog/pakistan-b2b-electronic-invoicing' WHERE id = '2025-12-31-pakistan-mandate-wave-lands';
UPDATE stories SET source_url = 'https://www.fiscal-requirements.com/news/4809' WHERE id = '2026-01-01-brazil-cbs-ibs-test-fields';
UPDATE stories SET source_url = 'https://www.roedl.com/en/insights/the-chinese-value-added-tax-law-officially-takes-effect/' WHERE id = '2026-01-01-china-vat-law-takes-effect';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/01/08/croatias-e-invoicing-fiscalization-e-reporting-requirements/' WHERE id = '2026-01-01-croatia-fiskalizacija-2';
UPDATE stories SET source_url = 'https://einvoice6.gst.gov.in/content/e-invoice-printing-process-mandatory-fields-modes-of-irn-generation/' WHERE id = '2026-01-01-india-qr-code-physical-invoices';
UPDATE stories SET source_url = 'https://www.cleartax.com/my/en/different-phases-implementation-timelines-einvoicing-malaysia' WHERE id = '2026-01-01-malaysia-myinvois-phase-4';
UPDATE stories SET source_url = 'https://jomeinvoice.my/rm10000-e-invoice-rule-malaysia/' WHERE id = '2026-01-01-malaysia-rm10000-individual-invoice-rule';
UPDATE stories SET source_url = 'https://pcga.mx/ideas/reformas-codigo-fiscal-2026/' WHERE id = '2026-01-01-mexico-2026-tax-reform';
UPDATE stories SET source_url = 'https://www.einvoicing.govt.nz/news-and-updates/government-strengthens-einvoicing-and-payment-rules-to-drive-efficiency-and-support-for-small-businesses' WHERE id = '2026-01-01-new-zealand-agency-einvoicing';
UPDATE stories SET source_url = 'https://sovos.com/vat/tax-rules/portugal-e-invoicing/' WHERE id = '2026-01-01-portugal-b2g-sme-extension';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/01/14/romania-clarifies-2026-e-invoicing-rules-unified-deadlines-and-new-registration-for-individuals/' WHERE id = '2026-01-01-romania-scope-expansion-working-days';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2025/12/17/malaysia-raises-e-invoicing-exemption-threshold-to-rm1-million-cancels-final-implementation-phase/' WHERE id = '2026-01-07-malaysia-exemption-threshold-raised';
UPDATE stories SET source_url = 'https://clearvo.io/blog/greece-mydata-guide' WHERE id = '2026-01-15-greece-mydata-backgrounder';
UPDATE stories SET source_url = 'https://www.irs.gov/publications/p583' WHERE id = '2026-01-15-us-no-mandate-practical-requirements';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2024/04/15/e-invoicing-in-austria-a-brief-overview-b2g-mandatory-b2b-voluntarily/' WHERE id = '2026-01-20-austria-why-early-adopter';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/07/08/worldwide-upcoming-e-invoicing-mandates-implementations-and-changes-chronological-2-2-2-2-2/' WHERE id = '2026-02-01-belgium-croatia-january-check-in';
UPDATE stories SET source_url = 'https://sovos.com/regulatory-updates/vat/canada-b2b-e-invoicing-study/' WHERE id = '2026-02-01-canada-provincial-federal-exploration';
UPDATE stories SET source_url = 'https://www.peppol.nu/blog-items/ey-report-vida-e-invoicing-netherlands/' WHERE id = '2026-02-01-netherlands-ey-report-published';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/01/02/polands-national-e-invoicing-system-ksef-recent-changes-effective-february-2026/' WHERE id = '2026-02-01-poland-ksef-large-taxpayers';
UPDATE stories SET source_url = 'https://www.vatcalc.com/sweden/sweden-progresses-mandatory-e-invoicing/' WHERE id = '2026-02-05-sweden-special-investigator-appointed';
UPDATE stories SET source_url = 'https://www.revenue.ie/en/vat/vida-vat-modernisation/large-corporates-vat-modernisation.aspx' WHERE id = '2026-02-10-ireland-large-corporate-criteria';
UPDATE stories SET source_url = 'https://www.vatcalc.com/france/france-e-invoicing-pilot-ahead-of-sept-2026-mandate/' WHERE id = '2026-02-24-france-ppf-pilot-opens';
UPDATE stories SET source_url = 'https://www.iras.gov.sg/news-events/newsroom/committee-of-supply-2026--extension-of-gst-invoicenow-requirement-to-all-gst-registered-businesses-by-april-2031' WHERE id = '2026-02-26-singapore-invoicenow-full-extension';
UPDATE stories SET source_url = 'https://www.sii.cl/noticias/2025/270225noti01aav.htm' WHERE id = '2026-03-01-chile-digital-boleta-delivery';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/04/23/malaysia-updates-e-invoicing-framework-specific-guide-v4-7-issued-and-phase-4-relaxation-extended-to-31-december-2027/' WHERE id = '2026-03-01-malaysia-phase4-relaxation-extended';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/05/22/saudi-arabia-zatca-wave-23-e-invoicing-integration-deadline-announced/' WHERE id = '2026-03-01-saudi-arabia-zatca-wave-23';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/03/16/netherlands-sets-2030-b2b-e-invoicing-mandate-eyes-2032-domestic-e-reporting-aligns-with-eu-vida/' WHERE id = '2026-03-10-netherlands-cabinet-leans-broad';
UPDATE stories SET source_url = 'https://www.financnasprava.sk/_img/pfsedit/Dokumenty_PFS/Zverejnovanie_dok/Aktualne/DPH/2026/2026.03.03_FAQ_eFaktura.pdf' WHERE id = '2026-03-10-slovakia-faq-penalties-published';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/02/15/briefing-document-podcast-e-invoicing-and-e-reporting-in-china/' WHERE id = '2026-03-15-china-efapiao-operational-realities';
UPDATE stories SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2026/03/tnf-norway-ministry-of-finance-accelerates-mandatory-digital-bookkeeping-and-e-invoicing-requirements.html' WHERE id = '2026-03-16-norway-mandate-pulled-forward';
UPDATE stories SET source_url = 'https://ec.europa.eu/newsroom/digital/items/930407/en' WHERE id = '2026-03-18-eu-en16931-2026-standard';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/03/06/germany-publishes-geba-retires-old-xrechnung-profiles-to-boost-e-invoicing-and-peppol-readiness/' WHERE id = '2026-03-18-germany-geba-peppol-addressing';
UPDATE stories SET source_url = 'https://www.boe.es/buscar/act.php?id=BOE-A-2026-7295' WHERE id = '2026-03-24-spain-royal-decree-approved';
UPDATE stories SET source_url = 'https://www.agenziaentrate.gov.it/portale/specifiche-tecniche-versione-1.9.1-%C2%A0-utilizzabili-dal-15-maggio-2026-' WHERE id = '2026-03-31-italy-fatturapa-1-9-1-published';
UPDATE stories SET source_url = 'https://www.fiscal-requirements.com/news/5719' WHERE id = '2026-04-01-brazil-cbs-ibs-validation';
UPDATE stories SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2026/03/tnf-norway-ministry-of-finance-accelerates-mandatory-digital-bookkeeping-and-e-invoicing-requirements.html' WHERE id = '2026-04-01-norway-explores-b2c-expansion';
UPDATE stories SET source_url = 'https://www.brecorder.com/news/40425733' WHERE id = '2026-04-01-pakistan-compliance-gap';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2025/11/26/poland-ksef-e-invoicing-mandate-a-comprehensive-guide/' WHERE id = '2026-04-01-poland-ksef-universal';
UPDATE stories SET source_url = 'https://llbsolutions.com/es/cfe-v25-1-en-uruguay-nuevos-controles-de-dgi-desde-el-15-de-abril-de-2026/' WHERE id = '2026-04-15-uruguay-cfe-v25-controls';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/04/15/group-on-the-future-of-vat-minutes-51st-meeting-vida-explanatory-notes-advance-amid-key-clarifications-and-open-issues/' WHERE id = '2026-04-17-eu-vida-open-implementation-questions';
UPDATE stories SET source_url = 'https://dbnalliance.org/' WHERE id = '2026-04-22-canada-dbnalliance-momentum';
UPDATE stories SET source_url = 'https://incp.org.co/publicaciones/infoincp-publicaciones/impuestos/2026/04/dian-reglas-para-el-uso-del-mecanismo-transitorio-para-regularizar-facturacion-electronica-omitida/' WHERE id = '2026-04-23-colombia-regularization-mechanism';
UPDATE stories SET source_url = 'https://www.sunat.gob.pe/legislacion/superin/2026/000075-2026.pdf' WHERE id = '2026-04-30-peru-day-one-e-invoicing';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/07/08/worldwide-upcoming-e-invoicing-mandates-implementations-and-changes-chronological-2-2-2-2-2/' WHERE id = '2026-05-01-2027-wave-multi-country-outlook';
UPDATE stories SET source_url = 'https://www.financnasprava.sk/sk/podnikatelia/dane/dan-z-pridanej-hodnoty/e-faktura' WHERE id = '2026-05-01-slovakia-voluntary-testing';
UPDATE stories SET source_url = 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/modernisering-av-skatteverkets-kontrollverktyg_hd01sku11/' WHERE id = '2026-05-06-sweden-online-audit-powers';
UPDATE stories SET source_url = 'https://www.agenziaentrate.gov.it/portale/documents/d/guest/allegato-a-specifiche-tecniche-vers-1-9-1' WHERE id = '2026-05-15-italy-fatturapa-1-9-1-effective';
UPDATE stories SET source_url = 'https://www.t4sadvance.com/la-spfe-ya-tiene-forma-todo-lo-que-revela-el-seminario-de-la-aeat-sobre-la-solucion-publica-de-facturacion-electronica/' WHERE id = '2026-05-15-spain-aeat-exchange-guidance';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/04/14/oman-opens-fawtara-service-provider-registration-marking-key-step-toward-mandatory-e-invoicing/' WHERE id = '2026-05-20-oman-asp-portal-opens';
UPDATE stories SET source_url = 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/einvoicing-for-government' WHERE id = '2026-06-01-australia-peppol-threshold-preview';
UPDATE stories SET source_url = 'https://erhvervsstyrelsen.dk/digital-bogfoering-traeder-i-kraft-personligt-ejede-virksomheder-og-foreninger-mfl-den-1-januar' WHERE id = '2026-06-01-denmark-small-business-bookkeeping-preview';
UPDATE stories SET source_url = 'https://jomeinvoice.my/article/e-invoice-faq-malaysia-related-company-guide/' WHERE id = '2026-06-01-malaysia-related-company-rule-preview';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/05/28/romania-expands-ro-e-invoice-registration-new-form-082-more-entities-required-by-2025-2026/' WHERE id = '2026-06-01-romania-law-88-scope-changes';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2025/12/19/sweden-to-merge-digg-and-pts-into-new-digitalization-agency/' WHERE id = '2026-06-01-sweden-peppol-authority-transfer';
UPDATE stories SET source_url = 'https://www.avalara.com/blog/en/europe/2026/03/uae-e-invoicing-mandate-2026-readiness-asp-pint-ae.html' WHERE id = '2026-06-01-uae-voluntary-pilot-preview';
UPDATE stories SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/718735690/2024+Cyprus+2024+eInvoicing+Country+Sheet' WHERE id = '2026-06-05-cyprus-2030-floor-regardless';
UPDATE stories SET source_url = 'https://stripe.com/resources/more/invoice-system-transitional-measures-japan' WHERE id = '2026-06-08-japan-jp-pint-v113-and-relief-taper';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/07/21/germany-e-invoicing-b2b-mandate-timeline-and-compliance/' WHERE id = '2026-06-10-germany-rollout-on-track-confirmed';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/06/07/briefing-document-italian-e-invoicing-and-regulatory-landscape/' WHERE id = '2026-06-15-italy-derogation-vida-convergence';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/06/16/oman-tax-authority-to-launch-e-invoicing-for-top-100-taxpayers/' WHERE id = '2026-06-18-oman-phase1-scope-confirmed';
UPDATE stories SET source_url = 'https://www.pwc.no/no/innsikt/skattenytt/obligatorisk-b2b-e-fakturering-i-norge-fremskyndes.html' WHERE id = '2026-06-19-norway-law-enacted';
UPDATE stories SET source_url = 'https://www.bbva.com/es/es/empresas/factura-electronica-b2b-y-ley-crea-y-crece-calendario-requisitos-y-retos/' WHERE id = '2026-06-20-spain-two-track-timeline-clarified';
UPDATE stories SET source_url = 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/einvoicing-for-government' WHERE id = '2026-07-01-australia-peppol-threshold-live';
UPDATE stories SET source_url = 'https://regfollower.com/china-rolls-out-digital-invoice-implementation-with-regional-phase-outs-of-paper-invoices/' WHERE id = '2026-07-01-china-regional-paper-phaseout';
UPDATE stories SET source_url = 'https://erhvervsstyrelsen.dk/ikke-registrerede-digitale-bogfoeringssystemer' WHERE id = '2026-07-01-denmark-small-business-bookkeeping-live';
UPDATE stories SET source_url = 'https://sovos.com/regulatory-updates/vat/malaysia-mandatory-e-invoicing-exemption-threshold-increased/' WHERE id = '2026-07-01-malaysia-related-company-rule-live';
UPDATE stories SET source_url = 'https://www.podatki.gov.pl/ksef/' WHERE id = '2026-07-01-poland-bank-transfer-reference-preview';
UPDATE stories SET source_url = 'https://www.capital.ro/anaf-actualizeaza-regulile-pentru-e-factura-firmele-trebuie-sa-verifice-noile-obligatii-si-sanctiunile-aplicabile.html' WHERE id = '2026-07-01-romania-sme-enforcement-arrives';
UPDATE stories SET source_url = 'https://www.avalara.com/blog/en/europe/2026/03/uae-e-invoicing-mandate-2026-readiness-asp-pint-ae.html' WHERE id = '2026-07-01-uae-voluntary-pilot-live';
UPDATE stories SET source_url = 'https://www.peppol.nu/news-items/e-invoicing-mandate-netherlands-cabinet-decision/' WHERE id = '2026-07-09-netherlands-cabinet-nears-decision';
UPDATE stories SET source_url = 'https://www.compta-online.com/facturation-electronique-ao5562' WHERE id = '2026-07-10-france-no-delay-confirmed';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/07/24/luxembourg-moves-to-extend-mandatory-e-invoicing-to-domestic-b2b/' WHERE id = '2026-07-17-luxembourg-b2b-draft-law';
UPDATE stories SET source_url = 'https://vlex.com.pe/vid/resolucion-n-000048-2026-1115553289' WHERE id = '2026-07-22-peru-see-overhaul-resolution-048';
UPDATE stories SET source_url = 'https://comparateur-efacturation.fr/outils/barometre' WHERE id = '2026-07-28-france-readiness-numbers';
UPDATE stories SET source_url = 'https://www.gob.pe/institucion/sunat/informes-publicaciones/8079009-sunat-modifica-normativa-sobre-emisores-electronicos-y-uso-del-sire' WHERE id = '2026-07-31-peru-resolution-143-postponements';
UPDATE stories SET source_url = 'https://www.vatupdate.com/2026/02/23/briefing-document-podcast-e-invoicing-e-reporting-in-egypt/' WHERE id = '2026-08-02-egypt-enforcement-era';
UPDATE stories SET source_url = 'https://www.expats.cz/czech-news/article/czechia-approves-return-of-eet-electronic-sales-tracking-to-resume-in-2027' WHERE id = '2026-08-04-czech-2030-floor-regardless';
UPDATE stories SET source_url = 'https://nav.gov.hu/sajtoszoba/hirek/A_NAV_segit_negy_honapos_atallasi_idoszak_a_nyugtaadat-szolgaltatasban' WHERE id = '2026-08-04-hungary-september-deadline-and-2030-floor';
UPDATE stories SET source_url = 'https://www.brecorder.com/news/40427085/digital-' WHERE id = '2026-08-04-pakistan-enforcement-push';
