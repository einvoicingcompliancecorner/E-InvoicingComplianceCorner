-- Iceland: milestones + English translations. Hand-written (not
-- scaffolder-generated, to keep full control over mandate_scope/
-- anchor/on_tracker per milestone). INSERT OR IGNORE throughout.
--
-- All three milestones use mandate_scope = 'b2g_only', including the
-- two on_tracker = 1 entries -- this is deliberate and required for
-- computeCountryMapStatus() (shared/map-data.mjs) to color Iceland as
-- "B2G only" on The Map rather than "tracked" (no mandate found) or
-- "no mandate". Iceland has no B2B mandate: not enacted, not drafted,
-- not publicly discussed with a date -- confirmed via the EU
-- Commission's own 2025 Iceland country sheet (self-flagged "NO
-- VERIFICATION", no 2024-2026 developments listed) and independently
-- re-confirmed by direct fetch of Regulation 44/2019's text in this
-- session. A widely-repeated vendor claim of a "1 July 2026" deadline
-- to retire an older BII format for Peppol BIS 3.0 was checked again
-- in this session and still traces to no primary Icelandic or
-- OpenPeppol source -- deliberately NOT included anywhere in this
-- migration or the deep-dive content that follows it.

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'is-reg44-2019', id, '2019-01-24', 1,
    'https://www.stjornartidindi.is/PdfVersions.aspx?recordId=9642721f-5b4e-4ce4-8b20-4463c0bca1fb',
    0, '[]', NULL, 'b2g_only'
  FROM countries WHERE code = 'IS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'is-reg44-2019', 'en',
  'Regulation 44/2019 published',
  'Iceland''s Ministry of Finance and Economic Affairs (Fjarmala- og efnahagsraduneytid) issued Regulation 44/2019 (reglugerd um rafraena reikninga vegna opinberra samninga), published in the Stjornartidindi official gazette. It transposes EU Directive 2014/55/EU via Iceland''s EEA membership, requiring public-sector buyers to receive and process e-invoices meeting European standard EN 16931.',
  '["Confirm whether your business supplies goods, services, or works to an Icelandic public body under a procurement, utilities, concession, or defense/security contract covered by the regulation."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'is-b2g-state-2019', id, '2019-04-18', 0,
    'https://island.is/reglugerdir/nr/0044-2019',
    1, '[{"label":"Fjarsysla rikisins -- receiving e-invoices for Icelandic state institutions","url":"https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar"},{"label":"Regulation 44/2019 (official text, island.is)","url":"https://island.is/reglugerdir/nr/0044-2019"}]',
    NULL, 'b2g_only'
  FROM countries WHERE code = 'IS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'is-b2g-state-2019', 'en',
  'State institutions must receive EN 16931 e-invoices',
  'Icelandic state institutions became required to be able to receive and process electronic invoices meeting European standard EN 16931. Fjarsysla rikisins (the Financial Management Authority) receives e-invoices on behalf of most state institutions, over the Peppol network.',
  '["If invoicing an Icelandic state institution, confirm it channels e-invoices through Fjarsysla rikisins and submit accordingly rather than by paper or PDF."]'
);

INSERT OR IGNORE INTO milestones (id, country_id, date, anchor, source_url, on_tracker, portals, confidence, mandate_scope)
  SELECT 'is-b2g-municipal-2020', id, '2020-04-18', 0,
    'https://island.is/reglugerdir/nr/0044-2019',
    1, '[{"label":"Fjarsysla rikisins -- receiving e-invoices for Icelandic state institutions","url":"https://fjs.atlassian.net/wiki/spaces/FJS/pages/2059173935/Rafr+nir+reikningar"},{"label":"Regulation 44/2019 (official text, island.is)","url":"https://island.is/reglugerdir/nr/0044-2019"}]',
    NULL, 'b2g_only'
  FROM countries WHERE code = 'IS';
INSERT OR IGNORE INTO milestone_translations (milestone_id, lang, system, desc, actions) VALUES (
  'is-b2g-municipal-2020', 'en',
  'Municipalities and public enterprises join the mandate',
  'The e-invoice receiving requirement extended to municipalities, their institutions, public enterprises, and other entities operating under special rights or monopolies, completing Regulation 44/2019''s rollout across the Icelandic public sector.',
  '["If invoicing an Icelandic municipality or public enterprise, confirm it can receive EN 16931-compliant e-invoices and check whether it uses Fjarsysla rikisins or its own Peppol access point."]'
);
