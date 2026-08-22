-- ================================================================
-- Headline facts, batch 2: the Americas complete, plus the two
-- Peppol-voluntary Pacific countries.
--
-- Schema in 600, first four countries in 601. Thirteen here, taking the
-- corpus to seventeen of seventy.
-- ================================================================
--
-- THE RULE FROM 601 EARNED ITS KEEP AGAIN, TWICE.
--
-- The status describes the obligation to ISSUE. Australia is the case
-- that rule exists for: Commonwealth agencies have been REQUIRED TO
-- RECEIVE Peppol e-invoices since 1 July 2022 under RMG-411, and it is
-- routinely written up as "Australia mandated e-invoicing in 2022". It
-- is an obligation on the BUYER. No Australian supplier is obliged to
-- send anything, so B2G is voluntary and the receiving duty is in the
-- note. Reported as "active" it would have told readers to build an
-- issuing capability that no law requires.
--
-- NEW ZEALAND IS THE OPPOSITE FIND. It looks like Australia and is not:
-- from 1 January 2027 government agencies must REQUIRE suppliers above
-- $33m to send e-invoices, which is a genuine future issuing obligation.
-- B2G planned, 2027-01-01. That date would have been missed by anyone
-- assuming the two countries match.
--
-- ---- WHERE THE SOURCES ARE WEAKER THAN USUAL, SAID OUT LOUD ---------
--
-- Mexico: SAT'''s own domains (omawww.sat.gob.mx, wwwmat.sat.gob.mx) and
-- dof.gob.mx were unfetchable all day -- redirect loops and 403s -- so
-- three CFF articles are cited to full-text mirrors that reproduce the
-- statute. The signature fact is on a SAT page that did load. B2G cites
-- a vendor blog and is the weakest single fact in this batch; it should
-- be re-sourced when SAT is reachable.
--
-- Colombia: archiving and signature cite actualicese and cijuf rather
-- than DIAN'''s normograma, which served the resolutions but not these.
--
-- Costa Rica: the B2B phase-in date is on a tax-portal write-up of
-- DGT-R-012-2018 rather than the resolution itself.
--
-- Ecuador: two SRI PDF endpoints returned 403 to the fetcher, a
-- known behaviour recorded in the Pakistan/Ecuador build back in August.
-- The two resolutions that DID load are cited; nothing unread is.
--
-- ---- AND THREE COUNTRIES WHERE "varies" IS THE HONEST ARCHIVING ------
--
-- Argentina, Peru and Uruguay all key retention to the tax prescription
-- period rather than a fixed count of years, and the United States has
-- no VAT and therefore no single rule -- the IRS publishes 3, 4, 6, 7
-- and indefinite depending on the record. A tile reading "10 years"
-- for any of them would be a number this site invented.

-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2010-08-01', 'https://www.argentina.gob.ar/normativa/nacional/norma-168727/actualizacion',
         'active', '2019-04-01', 'https://www.boletinoficial.gob.ar/detalleAviso/primera/189307/20180803',
         'active', '2019-04-01', 'https://www.argentina.gob.ar/normativa/nacional/norma-313087/actualizacion',
         NULL, 'varies', 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/18807/texact.htm',
         'not_required', 'https://www.afip.gob.ar/ws/documentacion/manuales/manual-desarrollador-ARCA-COMPG-v4-0.pdf', '2026-08-21'
  FROM countries WHERE name_en = 'Argentina';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'voluntary', NULL, 'https://www.canada.ca/en/shared-services/corporate/contact-us/submitting-invoices.html',
         'no_mandate', NULL, 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/8-4/documentary-requirements-claiming-input-tax-credits.html',
         'no_mandate', NULL, 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-receipts-invoices.html',
         6, 'years', 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/keeping-records/where-keep-your-records-long-request-permission-destroy-them-early.html',
         'not_required', 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/ic05-1/electronic-record-keeping.html', '2026-08-21'
  FROM countries WHERE name_en = 'Canada';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2018-02-01', 'https://www.sii.cl/noticias/2018/010218noti01er.htm',
         'active', '2018-02-01', 'https://www.sii.cl/preguntas_frecuentes/factura_electronica/001_003_6505.htm',
         'active', '2021-03-01', 'https://www.sii.cl/preguntas_frecuentes/bol_electr_vtas_serv/001_380_7666.htm',
         6, 'years', 'https://www.sii.cl/preguntas_frecuentes/factura_electronica/001_003_2356.htm',
         'required', 'https://www.sii.cl/factura_electronica/factura_mercado/instructivo_emision.pdf', '2026-08-21'
  FROM countries WHERE name_en = 'Chile';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', NULL, 'https://normograma.dian.gov.co/dian/compilacion/docs/concepto_tributario_dian_0000106_2022.htm',
         'active', NULL, 'https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0165_2023.htm',
         'active', NULL, 'https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0008_2024.htm',
         5, 'years', 'https://actualicese.com/tiempo-de-conservacion-de-facturas-y-documentos-equivalentes/',
         'required', 'https://cijuf.org.co/normatividad/oficio/2019/oficio-19372.html', '2026-08-21'
  FROM countries WHERE name_en = 'Colombia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2014-01-01', 'https://edicomgroup.com/blog/cfdi-electronic-invoicing-mexico',
         'active', '2014-01-01', 'https://leyes-mx.com/codigo_fiscal_de_la_federacion/29.htm',
         'active', '2014-01-01', 'https://leyesmx.com/cff/articulo/29-A/',
         5, 'years', 'https://mley.mx/CFF/articulo/30/',
         'required', 'https://www.sat.gob.mx/minisitio/Factura/emite_quenecesitoparafacturar.htm', '2026-08-21'
  FROM countries WHERE name_en = 'Mexico';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', NULL, 'https://www.law.cornell.edu/cfr/text/48/252.232-7003',
         'voluntary', NULL, 'https://dbnalliance.org/',
         'no_mandate', NULL, 'https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep',
         NULL, 'varies', 'https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records',
         'not_required', 'https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title15-section7001&num=0&edition=prelim', '2026-08-21'
  FROM countries WHERE name_en = 'United States';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2021-10-01', 'https://eboletin.sunat.gob.pe/node/50',
         'active', '2022-04-01', 'https://cpe.sunat.gob.pe/informacion_general/obligados_cpe',
         'active', '2022-06-01', 'https://www.sunat.gob.pe/legislacion/superin/2021/128-2021.pdf',
         NULL, 'varies', 'https://www.sunat.gob.pe/legislacion/codigo/libro2/titulo4.htm',
         'required', 'https://cpe.sunat.gob.pe/informacion_general/certificados_digitales', '2026-08-21'
  FROM countries WHERE name_en = 'Peru';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2025-01-01', 'https://www.gub.uy/direccion-general-impositiva/comunicacion/noticias/facturacion-electronica-incorporacion-restantes-contribuyentes-iva',
         'active', '2025-01-01', 'https://www.impo.com.uy/bases/resolucion-dgi-original-interes-general/798-2012',
         'active', '2025-01-01', 'https://www.impo.com.uy/bases/resoluciones-dgi-originales/2548-2023?tipoServicio=11',
         NULL, 'varies', 'https://www.impo.com.uy/bases/decretos/36-2012',
         'required', 'https://www.impo.com.uy/bases/decretos/36-2012#art7', '2026-08-21'
  FROM countries WHERE name_en = 'Uruguay';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2018-11-01', 'https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf',
         'active', '2018-11-01', 'https://impositus.com/noticias-y-novedades/resolucion-dgt-r-012-2018-obligatoriedad-general-uso-los-comprobantes-electronicos',
         'active', '2018-11-01', 'https://www.hacienda.go.cr/docs/ComprobantesElectronicos-GeneralidadesyVersion4.4.marzo2025.pdf',
         5, 'years', 'https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf#art22',
         'required', 'https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf', '2026-08-21'
  FROM countries WHERE name_en = 'Costa Rica';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', NULL, 'https://dgii.gov.do/transparencia/baseLegal/Documents/Leyes/Ley%2032-23.pdf',
         'active', '2025-11-15', 'https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/12-25.pdf',
         'planned', '2026-11-15', 'https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/06-26.pdf',
         10, 'years', 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Preguntas%20frecuentes/Generales/Preguntas%20Frecuentes%20e-CF%20Generales%20.pdf',
         'required', 'https://www.sclawyer.com.do/base-de-datos/decreto-587-24--reglamento-de-aplicaci%C3%B3n-de-la-ley-n%C3%BAm.-32-23,-de-facturaci%C3%B3n-electr%C3%B3nica?lang=en', '2026-08-21'
  FROM countries WHERE name_en = 'Dominican Republic';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2022-11-29', 'https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar?id=43dfea76-a457-4e1a-83d6-26a054412975&nombre=NAC-DGECCGC22-00000003.pdf',
         'active', '2022-11-29', 'https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar?id=c508d69a-4ea4-4940-8777-fbe89fef2fac&nombre=NAC-DGERCGC22-00000024.pdf',
         'active', '2022-11-29', 'https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar?id=c508d69a-4ea4-4940-8777-fbe89fef2fac&nombre=NAC-DGERCGC22-00000024.pdf',
         7, 'years', 'https://www.gob.ec/sites/default/files/regulations/2018-09/Reglamento%20de%20Comprobantes%20de%20Venta.pdf',
         'required', 'https://www.sri.gob.ec/en/facturacion-electronica', '2026-08-21'
  FROM countries WHERE name_en = 'Ecuador';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'voluntary', NULL, 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/einvoicing-for-government/guide-to-receiving-and-processing-einvoices/background',
         'voluntary', NULL, 'https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/setting-up-and-managing-records/setting-up-your-business-invoices',
         'no_mandate', NULL, 'https://www.ato.gov.au/businesses-and-organisations/einvoicing/about-peppol',
         5, 'years', 'https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/detailed-business-record-keeping-requirements/running-your-business-records/business-activity-statement-records/gst-records',
         'not_required', 'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/tax-invoices', '2026-08-21'
  FROM countries WHERE name_en = 'Australia';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'planned', '2027-01-01', 'https://www.procurement.govt.nz/government-procurement-framework/government-procurement-rules/procurement-system-requirements/einvoicing-capability/',
         'voluntary', NULL, 'https://www.einvoicing.govt.nz/get-set-up/small-and-medium-businesses',
         'no_mandate', NULL, 'https://www.ird.govt.nz/managing-my-tax/record-keeping/einvoicing',
         7, 'years', 'https://www.ird.govt.nz/managing-my-tax/record-keeping',
         'not_required', 'https://www.ird.govt.nz/gst/tax-invoices-for-gst/how-tax-invoices-for-gst-work', '2026-08-21'
  FROM countries WHERE name_en = 'New Zealand';

-- ---- the notes, English ---------------------------------------------
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'RG 2853/10: national public sector suppliers e-invoice; universal since Apr 2019', 'RG 4290/18: all VAT-registered, exempt & monotributo issue CAE-cleared e-invoices', 'Final-consumer sales covered; fiscal controller (POS device) allowed instead of CAE',
         'Dec. 1397/79 art.48: keep 5 yrs past prescription lapse; ~10 yrs total in practice', 'Validity comes from ARCA''s CAE; X.509 cert only authenticates the web service'
  FROM countries WHERE name_en = 'Argentina';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No legal duty to e-invoice; CanadaBuys/Peppol optional, email and mail accepted', 'No B2B mandate; CRA accepts invoices in any form, paper or electronic', 'No B2C e-invoicing duty; cash register slips or invoices suffice for GST/HST',
         'Keep records and invoices 6 years from end of last tax year they relate to', 'No signature required on invoices; CRA cites digital signatures only as optional'
  FROM countries WHERE name_en = 'Canada';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'All firms, incl. State suppliers, must issue e-invoices; paper invalid', 'Ley 20.727 phase-in ended: rural micro firms under 2.400 UF from 01-02-2018', 'Boleta electronica: e-invoicers from 01-01-2021, all others from 01-03-2021',
         'DTEs kept 6 years, same term as art. 58 Ley sobre Impuesto a las Ventas', 'Every DTE signed in full by issuer with a valid, non-revoked digital certificate'
  FROM countries WHERE name_en = 'Chile';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'General e-invoice duty covers sales to public entities; no separate B2G scheme', 'Res. 000165/2023: VAT/INC taxpayers issue DIAN-cleared e-invoices with CUFE', 'All B2C sales need an e-invoice or a DIAN-validated electronic POS equivalent',
         'Art. 632 ET: 5 years from 1 Jan of the year after issue or receipt', 'Digital signature mandatory; taxpayer or authorised tech provider may hold cert'
  FROM countries WHERE name_en = 'Colombia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'CFDI mandatory for all suppliers incl. sales to government; no separate B2G portal', 'CFF art. 29: all taxpayers issue CFDI; version 4.0 sole valid version since 2023', 'CFDI also for consumers; generic RFC / global CFDI when buyer gives no RFC',
         'CFF art. 30: 5 years; corporate and capital acts kept for the entity''s whole life', 'Issuer seals with CSD; PAC validates and adds SAT sello; e.firma needed to get a CSD'
  FROM countries WHERE name_en = 'Mexico';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No single FAR rule; DoD DFARS/WAWF and agency IPP clauses oblige e-submission', 'No mandate; DBNAlliance open exchange network is opt-in for B2B e-invoices', 'No VAT; IRS prescribes no invoice format and accepts paper sales slips',
         'IRS: 3 yrs base, 4 employment tax, 6 if 25% underreported, 7 bad debt, indefinite', 'ESIGN 15 USC 7001(b)(2): no one compelled to use e-records or e-signatures'
  FROM countries WHERE name_en = 'United States';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'RS 048-2021: State suppliers must issue facturas electronically since 1 Oct 2021', 'SEE regime universal; last cohort (<23 UIT) obliged from 1 Apr 2022; OSE validates', 'Boleta de venta electronica; final cohort (<23 UIT) obliged from 1 Jun 2022',
         'CT art. 87.7: keep records while the tax is not time-barred; no fixed term', 'Issuers sign CPE with a digital certificate from an INDECOPI-registered CA'
  FROM countries WHERE name_en = 'Peru';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No separate B2G scheme; state suppliers issue e-Factura like any VAT taxpayer', 'e-Factura to RUC buyers; CAE pre-authorises number ranges, not per-invoice clearance', 'All VAT payers, incl. IVA minimo, issue CFE (e-Ticket to consumers) from Jan 2025',
         'Decreto 36/012 art. 8: keep CFE electronically for the tax prescription period', 'Decreto 36/012 art. 7: advanced e-signature with accredited certificate required'
  FROM countries WHERE name_en = 'Uruguay';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Suppliers must e-invoice State bodies; the State itself is exempt from issuing', 'DGT-R-012-2018 phased mandate; final group obliged 1 Nov 2018 (IDs 0,7,8,9)', 'Tiquete electronico for consumers; v4.4 mandatory 1 Sep 2025, no 2026 cutover',
         'Reglamento 44739-H art. 22: comprobantes kept for five years', 'Firma digital obligatoria, XAdES-EPES v1.3.2+, for factura and tiquete'
  FROM countries WHERE name_en = 'Costa Rica';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Ley 32-23 art. 2 binds public and private entities; e-CF used for state supply', 'Large local and medium obliged from 15 Nov 2025 after DGII aviso 12-25', 'Same phase-in; small, micro and unclassified deferred to 15 Nov 2026',
         'DGII FAQ P85: e-CF kept 10 years under art. 44 lit. f, Codigo Tributario', 'Decreto 587-24 art. 20.a: sign digitally with a Tax Procedure certificate'
  FROM countries WHERE name_en = 'Dominican Republic';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Public sector and GADs covered; preprinted docs lost tax validity Nov 2022', 'Res. NAC-DGERCGC22-00000024: all taxpayers issue electronically from Nov 2022', 'Incl. consumidor final; real-time SRI transmission required since 1 Jan 2026',
         'Reglamento de Comprobantes de Venta art. 41: minimum 7 years', 'Issuer must hold a valid firma electronica certificate from an accredited CA'
  FROM countries WHERE name_en = 'Ecuador';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Agencies must RECEIVE Peppol eInvoices since Jul 2022; no duty on suppliers to send', 'Peppol open to all; ATO encourages it but paper and PDF invoices stay valid', 'Peppol covers B2B and B2G exchange only; no e-invoice duty for consumer sales',
         'GST records kept 5 years from creation or transaction, whichever is later', 'A valid tax invoice needs seven data elements; no signature or seal among them'
  FROM countries WHERE name_en = 'Australia';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Voluntary now; from 1 Jan 2027 agencies must require $33m+ suppliers to send', 'Peppol open to all NZ businesses; no obligation to issue to other firms', 'IRD describes eInvoicing as a buyer-supplier system exchange; no consumer duty',
         'Keep all records, including electronic ones, for at least 7 tax years', 'Taxable supply information rules list no signature, e-signature or seal'
  FROM countries WHERE name_en = 'New Zealand';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 17
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 17
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a misspelled name inserts nothing and reports success --
-- the shape migration 500 shipped for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0

