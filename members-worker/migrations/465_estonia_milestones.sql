-- ================================================================
-- Estonia (EE) milestones + EN translations. 4 milestones, all 4
-- on the tracker board (anchor: the 1 Jul 2019 B2G mandate).
-- Estonia's e-invoicing story is genuinely less eventful than
-- Kenya/Nigeria/Bulgaria -- one live conditional B2B right, one
-- announced-but-draft general mandate, no clearance/CTC platform,
-- no fine schedule specific to e-invoicing -- so the milestone
-- count is intentionally smaller rather than padded.
--
-- Sourcing (9 Aug 2026 research session, house standard): the
-- European Commission's "eInvoicing in Estonia" country factsheet
-- (2025 edition, pageId 905219410, confirmed via live fetch) is
-- the primary source for the B2G date and the "anticipated by
-- 2027" general B2B mandate. The July 2025 buyer's-request B2B
-- milestone is sourced to Estonia's own Ministry of Finance press
-- release ("E-arveldamine muutub paindlikumaks", fin.ee, published
-- 19 Sept 2024, confirmed date "Muudatused jõustuvad 2025. aasta
-- 1. juulist" = changes take effect 1 July 2025) -- official-source
-- confirmed. Cross-checked against Sovos and RTC Suite, both
-- agreeing on the same date.
--
-- Deliberately excluded per the sourcing standard: a VATupdate
-- article dated 27 July 2026 ("Riigikogu Adopts Accounting Act
-- Amendments") describing a further simplification (direct
-- self-registration in the Business Register without an
-- e-invoice operator) was traced back to the *same* fin.ee press
-- release used above (same self-registration detail, same ~15-18k
-- registered-entity figure, no independent effective date given
-- when asked directly) -- almost certainly a syndicated/re-dated
-- restatement of the 2024/2025 announcement rather than a genuine
-- new 2026 legislative event, the same "AI-summarized secondary
-- blog misdates a real story" failure mode already caught once
-- this project (Egypt, migration 461). No separate milestone was
-- created for it. The precise January 2025 effective date given by
-- one KPMG tax-news flash (vs. the confirmed July 2025) reflects
-- the original draft proposal, superseded in the enacted law --
-- not used here.
-- ================================================================

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ee-b2g-2019', id, '2019-07-01', 1,
    'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410',
    1, '[{"label": "Ministry of Finance — accounting source documents & e-invoices", "url": "https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved"}]', NULL, 'b2g_only'
  FROM countries WHERE code = 'EE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ee-b2g-2019', 'en',
  'B2G e-invoicing mandatory for the public sector',
  'From 1 July 2019, transposing EU Directive 2014/55/EU, Estonia required e-invoicing for transfers of goods or services to public sector accounting entities under the Accounting Act (Raamatupidamise seadus). Estonia uses Peppol BIS Billing 3.0 as its Core Invoicing Usage Specification, with service providers connecting via Peppol and roaming agreements for interoperability.', '["Historical context — no action needed for existing suppliers to Estonian public bodies"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ee-b2b-buyer-request-2025', id, '2025-07-01', 0,
    'https://www.fin.ee/uudised/e-arveldamine-muutub-paindlikumaks',
    1, '[{"label": "Ministry of Finance — accounting source documents & e-invoices", "url": "https://fin.ee/finantspoliitika-valissuhted/arvestusvaldkond/raamatupidamise-algdokumendid-arved-e-arved"}]', NULL, 'b2b'
  FROM countries WHERE code = 'EE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ee-b2b-buyer-request-2025', 'en',
  'Mandatory B2B e-invoicing upon buyer''s request (Accounting Act amendment)',
  'From 1 July 2025, any entity registered in Estonia''s Commercial/Business Register as an e-invoice recipient can require its suppliers to issue e-invoices — sellers must comply once a registered buyer asks, using the EN 16931 European e-invoice standard by default (parties may agree an alternative). This is Estonia''s distinctive "buyer chooses" model: there is no blanket mandate, no clearance platform, and suppliers retain no discretion only once a specific buyer has registered and requested it. Around 15,000–18,000 Estonian entities had registered as e-invoice recipients as of this rollout.', '["Check whether your Estonian business counterparties are registered as e-invoice recipients in the Business Register", "If a registered buyer requests e-invoices, be ready to issue EN 16931-compliant e-invoices, typically via Peppol BIS Billing 3.0"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ee-vat-act-2027-planned', id, '2027-01-01', 0,
    'https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?pageId=905219410',
    1, '[]', 'expected', 'b2b'
  FROM countries WHERE code = 'EE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ee-vat-act-2027-planned', 'en',
  'General mandatory B2B e-invoicing planned via VAT Act amendment (draft stage)',
  'Estonia''s Ministry of Finance announced in December 2024 its intention to draft a VAT Act amendment introducing a general, universal B2B e-invoicing mandate — moving beyond the current buyer-request model to cover all VAT-registered businesses. The European Commission''s own country factsheet describes full B2B mandates as "anticipated by 2027," but as of this research round the amendment remained in draft/proposal stage with no adopted law or confirmed date — treat the 2027 target as directional, not confirmed. A related proposal would remove the current EUR 1,000 per-partner reporting threshold for VAT ledger declarations.', '["Monitor Estonia''s Ministry of Finance and Riigikogu for the formal VAT Act draft and its confirmed effective date", "If adopted on the announced timeline, this would end the buyer-request model and require e-invoicing for all VAT-registered B2B trade"]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'ee-vida-2030', id, '2030-07-01', 0,
    'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516',
    1, '[{"label": "Council Directive (EU) 2025/516", "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025L0516"}]', NULL, 'b2b'
  FROM countries WHERE code = 'EE';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'ee-vida-2030', 'en',
  'ViDA cross-border B2B e-invoicing and digital reporting become mandatory (confirmed EU law)',
  'From 1 July 2030, under Council Directive (EU) 2025/516, structured e-invoicing and digital reporting become mandatory for all intra-Community B2B supplies — a firm EU-law floor regardless of whether Estonia''s own domestic VAT Act amendment (above) is adopted first. Given Estonia''s existing Peppol BIS Billing 3.0 infrastructure from the B2G and buyer-request regimes, the country starts from a stronger technical base than most member states still building e-invoicing capability from scratch.', '["Prepare for mandatory structured e-invoicing on all intra-EU B2B trade from mid-2030, independent of the domestic mandate''s progress", "Estonia''s existing Peppol infrastructure should ease this transition relative to EU peers with no current e-invoicing rails"]'
);
