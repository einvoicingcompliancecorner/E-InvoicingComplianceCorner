-- Migration 407: Milestone citation fixes, round 2 (follow-up research pass)
--
-- Follow-up to migration 406. That migration fixed the 121 problem milestones with
-- an immediately-available replacement source; it deliberately left ~70 milestones
-- where WebSearch ran out of quota mid-audit, plus 49 flagged as having a possible
-- content-accuracy problem (the claim itself, not just the citation, looked wrong).
--
-- This migration is the result of a dedicated follow-up research pass over both groups:
--
--   1. Re-ran citation search on the ~70 previously-unresolved milestones. Found a
--      verified source for 69 of 70 (only au-default-2025 remains unresolved, and it
--      also turned out to have its own content-accuracy problem -- see PROGRESS.md).
--
--   2. Fact-checked all 49 content-accuracy flags directly: researched the actual date/
--      threshold/name from primary sources and classified each as CONFIRMED_CORRECT
--      (the original audit's concern was a false alarm -- milestone is fine, just needed
--      a citation), LIKELY_WRONG (the milestone's own claim appears to be incorrect), or
--      UNCLEAR (still not resolvable after real effort).
--
-- This migration applies ONLY the citation-only fixes: the 69 re-resolved searches plus
-- the 16 CONFIRMED_CORRECT content-accuracy items (whose citation was the only problem).
-- 7 more searches surfaced NEW content-accuracy concerns of their own and are excluded
-- pending review. The 30 LIKELY_WRONG and 2 UNCLEAR content-accuracy items are NOT
-- touched here -- correcting a milestone's own date/threshold/name is a bigger change
-- than a citation swap and needs Dan's review first. Full list and recommended
-- corrections are in PROGRESS.md and were reported to Dan directly.

UPDATE milestones SET source_url = 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/310000-314999/313087/norma.htm' WHERE id = 'ar-b2b-2019-universal';
UPDATE milestones SET source_url = 'https://www.erechnung.gv.at/erb/legal' WHERE id = 'at-b2g-2014';
UPDATE milestones SET source_url = 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/einvoicing-for-government' WHERE id = 'au-30pct';
UPDATE milestones SET source_url = 'https://peppol.org/learn-more/country-profiles/australia/' WHERE id = 'au-anz-arrangement-2018';
UPDATE milestones SET source_url = 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/einvoicing-for-government' WHERE id = 'au-automate';
UPDATE milestones SET source_url = 'https://ecosio.com/en/blog/e-invoicing-in-australia-rules-formats-and-timelines/' WHERE id = 'au-legacy-removed-2025';
UPDATE milestones SET source_url = 'https://ecosio.com/en/blog/e-invoicing-in-australia-rules-formats-and-timelines/' WHERE id = 'au-ncereceive';
UPDATE milestones SET source_url = 'https://ecosio.com/en/blog/e-invoicing-in-australia-rules-formats-and-timelines/' WHERE id = 'au-pint-mandatory-2024';
UPDATE milestones SET source_url = 'https://www.vertexinc.com/resources/resource-library/belgiums-2026-e-invoicing-regulations-explained-scope-deadlines-and-penalties' WHERE id = 'be-penalty';
UPDATE milestones SET source_url = 'https://www.cgibs.gov.br/comite-gestor-do-ibs-e-receita-federal-divulgam-orientacoes-sobre-a-entrada-em-vigor-da-cbs-e-do-ibs-em-1-de-janeiro-de-2026' WHERE id = 'br-fields';
UPDATE milestones SET source_url = 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda' WHERE id = 'br-full-migration-2033';
UPDATE milestones SET source_url = 'https://www.contabeis.com.br/legislacao/61584/ajuste-sinief-11-2013/' WHERE id = 'br-nfe-established';
UPDATE milestones SET source_url = 'https://www.gov.br/nfse/pt-br/mei-prestadores-de-servico-de-todo-o-pais-estao-obrigados-a-emitir-nfs-e' WHERE id = 'br-nfse-mei-2023';
UPDATE milestones SET source_url = 'https://inventti.com.br/nf-e-nfc-e-nota-tecnica-2024-002-reforma-tributaria-novos-campos-regras-de-validacao-e-eventos/' WHERE id = 'br-nt-2025-002-2024';
UPDATE milestones SET source_url = 'https://documentacao.senior.com.br/exigenciaslegais/noticias/federal/2025/2025-12-02-reforma-tributaria-nota-fiscal-eletronica-flexibilizacao-do-preenchimento-do-ibs-e-cbs-em-janeiro-de-2026/' WHERE id = 'br-nt-v133-postpone-2025';
UPDATE milestones SET source_url = 'https://www.contabeis.com.br/noticias/72849/ibs-e-cbs-preenchimento-obrigatorio-comeca-em-novembro/' WHERE id = 'br-test-env-2025';
UPDATE milestones SET source_url = 'https://kpmg.com/us/en/taxnewsflash/news/2026/01/brazil-four-month-waiver-penalties-goods-services-vat.html' WHERE id = 'br-validate';
UPDATE milestones SET source_url = 'https://www.recommand.eu/en/countries/canada' WHERE id = 'ca-federal-b2g';
UPDATE milestones SET source_url = 'https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/acts-regulations/forward-regulatory-plan/current-initiatives.html' WHERE id = 'ca-regulatory-plan-2025';
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/canada-b2b-e-invoicing-study/' WHERE id = 'ca-watch';
UPDATE milestones SET source_url = 'https://www.sii.cl/preguntas_frecuentes/bol_electr_vtas_serv/001_380_7666.htm' WHERE id = 'cl-boleta-2021';
UPDATE milestones SET source_url = 'https://www.sii.cl/noticias/2025/270225noti01aav.htm' WHERE id = 'cl-digital-delivery';
UPDATE milestones SET source_url = 'https://www.sii.cl/noticias/2018/010218noti01er.htm' WHERE id = 'cl-established';
UPDATE milestones SET source_url = 'https://www.bj148.org/ztk/2024nzt/2023xgsd/12y/gjzcfgjgfxwj/202412/t20241202_1670191.html' WHERE id = 'cn-aviation-2024';
UPDATE milestones SET source_url = 'https://zhejiang.chinatax.gov.cn/art/2015/11/26/art_8409_15962.html' WHERE id = 'cn-general-vat-2015';
UPDATE milestones SET source_url = 'http://english.www.gov.cn/news/202411/25/content_WS6743b13ac6d0868f4e8ed5e1.html' WHERE id = 'cn-nationwide';
UPDATE milestones SET source_url = 'https://law.esnai.cn/view/232777/' WHERE id = 'cn-paper-phaseout';
UPDATE milestones SET source_url = 'https://law.esnai.cn/view/211328' WHERE id = 'cn-pilots-allprovinces-2023';
UPDATE milestones SET source_url = 'https://www.gov.cn/zhengce/zhengceku/202410/content_6981415.htm' WHERE id = 'cn-railway-2024';
UPDATE milestones SET source_url = 'https://www.china-briefing.com/news/china-special-vat-e-fapiao-pilot-program-implementation-company-preparedness/' WHERE id = 'cn-special-vat-pilot-2020';
UPDATE milestones SET source_url = 'https://actualicese.com/resolucion-000010-de-06-02-2018/' WHERE id = 'co-large-taxpayers-2018';
UPDATE milestones SET source_url = 'https://www.facturele.com/2026/07/21/cambios-hacienda-2026-cedula-d270' WHERE id = 'cr-cedula-cutover-2026';
UPDATE milestones SET source_url = 'https://www.retsinformation.dk/eli/lta/2022/700' WHERE id = 'dk-act-2022';
UPDATE milestones SET source_url = 'https://nemhandel.dk/om-nemhandel' WHERE id = 'dk-b2g-2005';
UPDATE milestones SET source_url = 'https://nemhandel.dk/sites/default/files/2026-03/Dokumentstrategi_h%C3%B8ringsnotat_ERST_040326_alirodocs-a_WA.pdf' WHERE id = 'dk-bis4-rc';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/30/bookkeeping-act-phase-in-complete-nemhandel-by-default-from-july-2026/' WHERE id = 'dk-nemhandel-default';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/03/23/denmark-unveils-nemhandel-bis-4-e-invoicing-standard-cancels-oioubl-3-0-sets-2029-migration-timeline/' WHERE id = 'dk-oioubl-phaseout';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/02/09/denmark-cancels-oioubl-3-0-and-unveils-new-unified-e-invoicing-strategy/' WHERE id = 'dk-oioubl3-cancelled';
UPDATE milestones SET source_url = 'https://www.retsinformation.dk/eli/lta/2024/205' WHERE id = 'dk-regulation-2024';
UPDATE milestones SET source_url = 'https://www.fiscal-requirements.com/news/5092' WHERE id = 'dk-saft2027';
UPDATE milestones SET source_url = 'https://globalindirecttaxmanagement.com/country-updates/denmark/denmark-completes-the-bookkeeping-act-phase-in-and-moves-to-default-nemhandel-e-invoicing-registration-with-a-consultation-open-until-august-17-2026' WHERE id = 'dk-small';
UPDATE milestones SET source_url = 'https://www.sri.gob.ec/en/facturacion-electronica' WHERE id = 'ec-base-resolution-2018';
UPDATE milestones SET source_url = 'https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/cea483e1-ab3a-4b95-b11f-40723d16cf7f/NAC-DGERCGC14-00790.pdf' WHERE id = 'ec-first-mandate-2014';
UPDATE milestones SET source_url = 'https://www.lexis.com.ec/noticias/decreto-ejecutivo-398-reforma-sistema-de-marcacion-y-trazabilidad-fiscal-de-productos' WHERE id = 'ec-traceability-decree-2026';
UPDATE milestones SET source_url = 'https://www.vatcalc.com/egypt/egypt-vat-e-invoice-update/' WHERE id = 'eg-einvoicing-all';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/02/23/briefing-document-podcast-e-invoicing-e-reporting-in-egypt/' WHERE id = 'eg-enforcement-2026';
UPDATE milestones SET source_url = 'https://www.comarch.com/trade-and-services/data-management/legal-regulation-changes/egypt-expands-e-receipt-requirements-for-b2c-transactions-from-september-2025/' WHERE id = 'eg-ereceipt-wave8';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/02/23/briefing-document-podcast-e-invoicing-e-reporting-in-egypt/' WHERE id = 'eg-threshold-250k';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/881983573/2025+Finland+2025+eInvoicing+Country+Sheet' WHERE id = 'fi-act2019';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=183927814' WHERE id = 'fi-b2g';
UPDATE milestones SET source_url = 'https://www.valtiokonttori.fi/en/services/government-e-invoices/invoicing-the-state/' WHERE id = 'fi-en-standard';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905217496' WHERE id = 'fi-vida';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905217496' WHERE id = 'fi-vida-prep';
UPDATE milestones SET source_url = 'https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000053508878' WHERE id = 'fr-finance-law-2026';
UPDATE milestones SET source_url = 'https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises' WHERE id = 'fr-issue-all';
UPDATE milestones SET source_url = 'https://dext.com/fr/ressources/liste-plateformes-agreees-facture-electronique' WHERE id = 'fr-pa-critical-mass';
UPDATE milestones SET source_url = 'https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises' WHERE id = 'fr-receive';
UPDATE milestones SET source_url = 'https://sovos.com/regulatory-updates/vat/croatia-new-fiscalization-law-with-mandatory-e-invoicing-and-real-time-reporting-officially-published/' WHERE id = 'hr-nonvat';
UPDATE milestones SET source_url = 'https://www.fiscal-requirements.com/news/5785-hungary-moves-toward-mandatory-electronic-cash-registers-by-2028' WHERE id = 'hu-b2c-receipt-2026';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/spaces/einvoicingCFS/pages/75667312/Ireland+2019+eInvoicing+Country+Sheet' WHERE id = 'ie-b2g-mandatory-2020';
UPDATE milestones SET source_url = 'https://www.gov.ie/ga/an-roinn-airgeadais/preaseisiuinti/minister-mcgrath-welcomes-revenues-launch-of-public-consultation-on-vat-modernisation/' WHERE id = 'ie-consultation-2023';
UPDATE milestones SET source_url = 'https://www.gov.ie/en/publication/83ade-irish-peppol-authority/' WHERE id = 'ie-peppol-authority-2018';
UPDATE milestones SET source_url = 'https://hcat.co/israeli-budget-law-passes/' WHERE id = 'il-law-enacted';
UPDATE milestones SET source_url = 'https://www.taxmanagementindia.com/web/tmi_blog_details.asp?id=716518' WHERE id = 'in-2fa-2023';
UPDATE milestones SET source_url = 'https://einvoice6.gst.gov.in/content/revised-time-limit-for-e-invoice-reporting-for-businesses-with-aato-of-%E2%82%B910-crores-above/' WHERE id = 'in-30day';
UPDATE milestones SET source_url = 'https://taxguru.in/goods-and-service-tax/e-invoicing-gst-recent-notifications.html' WHERE id = 'in-gst-council-2019';
UPDATE milestones SET source_url = 'https://einvoice6.gst.gov.in/content/e-invoice-mandate-e-invoicing-changes-exemptions-documents-covered-transactions-and-more/' WHERE id = 'in-threshold-reductions';
UPDATE milestones SET source_url = 'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=55870408' WHERE id = 'nl-b2g-2017';
UPDATE milestones SET source_url = 'https://ecosio.com/en/blog/e-invoicing-in-the-netherlands-an-overview/' WHERE id = 'nl-b2g-subcentral-2019';
UPDATE milestones SET source_url = 'https://www.mbie.govt.nz/about/news/new-edition-of-government-procurement-rules-goes-live' WHERE id = 'nz-5th-edition-announced-2025';
UPDATE milestones SET source_url = 'https://www.theinvoicinghub.com/peppol-pint-format-mandatory-for-b2g-transactions-in-anz/' WHERE id = 'nz-pint-anz-2025';
UPDATE milestones SET source_url = 'https://sovos.com/vat/tax-rules/portugal-e-invoicing/' WHERE id = 'pt-b2g-large';
UPDATE milestones SET source_url = 'https://www.ey.com/en_gl/technical/tax-alerts/saudi-arabia-announces-23rd-wave-of-phase-2-e-invoicing-integration' WHERE id = 'sa-wave23';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2026/06/30/saudi-arabia-ksa-zatca-phase-2-wave-24-compliance-by-30-june-2026/' WHERE id = 'sa-wave24';
UPDATE milestones SET source_url = 'https://www.digg.se/en/compulsory-e-invoicing-in-the-public-sectore-handel-och-e-faktura/e-invoice' WHERE id = 'se-b2g';
UPDATE milestones SET source_url = 'https://www.vatupdate.com/2025/12/02/briefing-document-podcast-e-invoicing-and-e-reporting-in-sweden/' WHERE id = 'se-b2g-2008';
UPDATE milestones SET source_url = 'https://ecosio.com/en/blog/peppol-in-singapore/' WHERE id = 'sg-invoicenow-launch-2019';
UPDATE milestones SET source_url = 'https://www.icas.com/news-insights-events/news/tax/autumn-budget-2025-e-invoicing-will-go-ahead-from-2029' WHERE id = 'uk-mandate';
UPDATE milestones SET source_url = 'https://www.prnewswire.com/news-releases/first-invoice-sent-and-received-over-the-us-digital-business-networks-alliance-open-exchange-network-302096640.html' WHERE id = 'us-first-invoice-2024';
