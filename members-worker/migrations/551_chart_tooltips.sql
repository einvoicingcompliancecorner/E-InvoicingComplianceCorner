-- ================================================================
-- Chart tooltips, the risk legend, and the EU-wide obligation note.
--
-- Fourth pass. These are the strings a reader only sees on hover or in
-- a status colour, which is exactly why they survived three earlier
-- passes over the same file.
--
-- ---- A QUOTING TRAP WORTH RECORDING --------------------------------
--
-- The EU-wide note was first written with its markup inside the
-- translated value:
--
--   fill('${tj("waves.euWide","<strong style=\"color:#e2b978\">EU-wide...
--
-- The fallback argument is a double-quoted JavaScript string, so the
-- attribute's own double quote closed it early and the file stopped
-- parsing. Escaping harder would have worked and been wrong: it would
-- have put a colour value inside a row a translator is asked to
-- translate, where the first careless edit breaks the markup and the
-- second breaks the page.
--
-- The markup stays in the code and only the words are in D1. That is the
-- rule this whole exercise should follow, and it took a syntax error to
-- state it plainly: A TRANSLATABLE ROW SHOULD CONTAIN LANGUAGE, NOT
-- PRESENTATION. Slots exist for the parts that are neither.
--
-- (The rows that do still carry a <strong> — the guards in 550 — carry
-- it because the emphasis is on a specific clause and moving it out
-- would mean splitting one sentence into three rows. Emphasis inside a
-- sentence is arguably language. A hex colour is not.)
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'chart.goliveTip', 'en', 'Wave go-live — mandate deadline {0}'),
  ('roi', 'chart.risk.late', 'en', 'Latest responsible start is in the past'),
  ('roi', 'chart.risk.soon', 'en', 'Starts within 3 months'),
  ('roi', 'chart.risk.ok', 'en', 'Comfortable runway'),
  ('roi', 'chart.key.late', 'en', '▲ already late'),
  ('roi', 'chart.key.soon', 'en', '● start &lt;90d'),
  ('roi', 'chart.key.ok', 'en', '✓ runway'),
  ('roi', 'waves.euWide.h', 'en', 'EU-wide obligation.'),
  ('roi', 'waves.euWide', 'en', 'Council Directive (EU) 2025/516 binds this member state from 1 July 2030 regardless of whether it legislates a domestic mandate. {0}');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'chart.%' = 22
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('waves.euWide','waves.euWide.h') = 2
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'waves.euWide' AND value LIKE '%style=%' = 0
--
-- That last one is the lesson, asserted: no presentation in a
-- translatable row. It is written against `waves.euWide` specifically
-- because that is the row that taught it, and a general rule would fire
-- on the guards in 550 where inline emphasis is deliberate.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND value LIKE '%style=%' = 0
