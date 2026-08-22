-- ================================================================
-- The five headline facts: first batch, four jurisdictions.
--
-- Schema in 600. This is the first of the batches that fill it.
-- ================================================================
--
-- FOUR COUNTRIES, CHOSEN TO BREAK THE MODEL RATHER THAN TO FIT IT.
-- Germany (EU, phased, receive-before-issue), Japan (no mandate at all
-- but a real voluntary rail), Brazil (split by document type and by level
-- of government), Saudi Arabia (phased by revenue wave, B2C treated
-- differently from B2B). If the four columns survive these, they survive
-- the corpus.
--
-- Every fact was researched to primary sources and every URL fetched to
-- confirm it contains the claim it is attached to. 18 distinct sources
-- across 20 facts -- the two repeats are Saudi's B2C and signature, which
-- genuinely come from the same ZATCA guideline, and Germany's B2B and B2C,
-- both from the BMF FAQ that states each explicitly.
--
-- ---- AND THE BATCH IMMEDIATELY FOUND THE DEFINITION PROBLEM ----------
--
-- WHAT DOES "B2B ACTIVE" MEAN FOR GERMANY? Every domestic business has
-- had to be able to RECEIVE EN 16931 invoices since 1 January 2025. The
-- obligation to ISSUE them starts in 2027 for larger businesses and 2028
-- for the rest. Both are true, and the research came back marking B2B
-- "active" on the strength of the receiving duty.
--
-- That is defensible and it is wrong for this tile. A reader scanning
-- eleven countries sees "B2B ACTIVE" and plans as though German issuing
-- were live now, which it is not, and the planning error runs in the
-- expensive direction. So:
--
--   THE STATUS DESCRIBES THE ISSUING OBLIGATION. Receiving duties belong
--   in the note. This matches how the industry, and this tracker's own
--   milestones, already talk about a mandate.
--
-- Germany is therefore 'planned' from 2027-01-01 with the receiving duty
-- named in its note. Recorded here rather than silently applied, because
-- the raw research says otherwise and the next person to check will find
-- that discrepancy and need to know it was a decision.
--
-- ---- TWO SOURCES THAT ARE WEAKER THAN THE REST, NAMED ----------------
--
-- Germany's archiving cites dejure.org rather than gesetze-im-internet.de,
-- which was unreachable on every attempt today. dejure reproduces the
-- statute verbatim and the 8-year figure is independently corroborated by
-- the BMF FAQ, but the primary URL should replace it when reachable.
--
-- Japan's B2G is the weakest fact in the batch. It is an assertion that
-- something does NOT exist, which no primary source ever states; the
-- Digital Agency page cited establishes the voluntary Peppol regime, and
-- absence of a mandate is inferred from that plus the NTA's silence. Left
-- as 'voluntary' rather than 'no_mandate' precisely because a real rail
-- does operate there.


-- ---- the rows ------------------------------------------------------
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2020-11-27', 'https://e-rechnung-bund.de/en/faq/',
         'planned', '2027-01-01', 'https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html',
         'no_mandate', NULL, 'https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html',
         8, 'years', 'https://dejure.org/gesetze/UStG/14b.html',
         'not_required', 'https://ao.bundesfinanzministerium.de/usth/2019-2020/A-Umsatzsteuergesetz/IV-Steuer-und-Vorsteuer/Paragraf-14/ae-14-4.html', '2026-08-21'
  FROM countries WHERE name_en = 'Germany';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'voluntary', NULL, 'https://www.digital.go.jp/policies/electronic_invoice',
         'voluntary', NULL, 'https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/pdf/0022009-090.pdf',
         'no_mandate', NULL, 'https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/pdf/qa/24-2.pdf',
         7, 'years', 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6496.htm',
         'not_required', 'https://www.nta.go.jp/publication/pamph/sonota/0021011-068.pdf', '2026-08-21'
  FROM countries WHERE name_en = 'Japan';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2010-12-01', 'https://portalsped.fazenda.mg.gov.br/spedmg/nfe/Obrigatoriedade',
         'active', '2010-04-01', 'https://www.normaslegais.com.br/legislacao/protocoloicms42_2009.htm',
         'active', '2020-12-01', 'https://portalsped.fazenda.mg.gov.br/spedmg/nfce/Perguntas-Frequentes/respostas_i/index.html',
         5, 'years', 'https://legislacao.fazenda.sp.gov.br/Paginas/art182.aspx',
         'conditional', 'https://www.fazenda.sp.gov.br/nfe/legislacao/Consolidacao_Ajustes_SINIEF_07_05_e_04_06.pdf', '2026-08-21'
  FROM countries WHERE name_en = 'Brazil';
INSERT OR REPLACE INTO country_headline_facts
  (country_id, b2g_status, b2g_date, b2g_source, b2b_status, b2b_date, b2b_source,
   b2c_status, b2c_date, b2c_source, archiving_years, archiving_status, archiving_source,
   signature_status, signature_source, last_verified)
  SELECT id, 'active', '2021-12-04', 'https://zatca.gov.sa/en/E-Invoicing/Introduction/LawsAndRegulations/Documents/E-Invoicing%20Implementation%20Resolution_EN.pdf',
         'active', '2021-12-04', 'https://zatca.gov.sa/en/Pages/news_1426.aspx',
         'active', '2021-12-04', 'https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-Invoicing_Detailed__Guideline.pdf',
         6, 'years', 'https://zatca.gov.sa/en/E-Invoicing/Introduction/FAQ/Pages/FAQ_028.aspx',
         'conditional', 'https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-Invoicing_Detailed__Guideline.pdf', '2026-08-21'
  FROM countries WHERE name_en = 'Saudi Arabia';

-- ---- the notes, English; the other three languages follow later ----
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'Federal suppliers must issue since Nov 2020; Länder mostly receive-only', 'Receiving mandatory since Jan 2025; issuing from 2027 (>€800k), all 2028', 'BMF states private end consumers are not affected',
         '8 yrs from year-end under §14b UStG; other AO records may run 10', 'UStAE 14.4: internal control procedure suffices; QES optional'
  FROM countries WHERE name_en = 'Germany';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No B2G e-invoicing mandate; Peppol/JP PINT optional for suppliers', 'No e-issuance duty; NTA permits e-records in place of paper qualified invoices', 'No e-invoice duty; retail and transport may issue paper simplified invoices',
         '7 yrs from 2 months after the tax period end, for the JCT credit', 'No e-signature required; a timestamp is one of several allowed methods'
  FROM countries WHERE name_en = 'Japan';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'NF-e mandatory on sales to public administration; no separate B2G platform', 'Goods: NF-e since 2010. Services: municipal NFS-e. CBS/IBS fields added 2026', 'Set state by state via NFC-e/CF-e; in Minas Gerais all retailers by Dec 2020',
         'State rules govern; RICMS/SP sets a 5-year minimum for fiscal documents', 'ICP-Brasil certificate for NF-e/NFC-e; NFS-e web emitter allows gov.br login'
  FROM countries WHERE name_en = 'Brazil';
INSERT OR REPLACE INTO country_headline_fact_translations
  (country_id, lang, b2g_note, b2b_note, b2c_note, archiving_note, signature_note)
  SELECT id, 'en', 'No separate B2G regime; the same ZATCA rules apply to government supplies', 'Phase 1 generation since Dec 2021; Phase 2 integration still rolling in waves', 'Simplified invoices reported to Fatoora within 24h, not cleared; QR mandatory',
         'VAT IR Art. 66: 6 yrs standard, 11 for capital assets, 15 for real estate', 'Phase 2 only: taxpayer stamps simplified, ZATCA stamps standard at clearance'
  FROM countries WHERE name_en = 'Saudi Arabia';

-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM country_headline_facts = 4
-- ASSERT: SELECT count(*) FROM country_headline_fact_translations WHERE lang = 'en' = 4
--
-- EVERY ROW LANDED ON A REAL COUNTRY. These are SELECT..FROM countries
-- inserts, so a country name that does not match silently inserts
-- nothing -- the same shape as migration 500's UPDATE that matched zero
-- rows and reported success for three releases.
-- ASSERT: SELECT count(*) FROM country_headline_facts WHERE country_id IS NULL = 0
--
-- ASSERT ALWAYS: SELECT count(*) FROM country_headline_facts WHERE b2b_source IS NULL OR b2b_source = '' = 0
--
-- A FACT WITHOUT A SOURCE IS NOT A FACT ON THIS SITE. The August citation
-- audit found 71% of story citations did not support their claim; the
-- rule that came out of it is that a claim carries a citation to the
-- specific thing claimed. This invariant is the mechanical half of that
-- for the one column a reader is most likely to act on.

