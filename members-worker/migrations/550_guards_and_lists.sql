-- ================================================================
-- The guards and the wave-table notes: sentences that assemble lists.
--
-- Third pass on moving this page's English into D1, and the hardest of
-- the three so far -- not because the strings are long, but because each
-- one is a sentence built around a list the code assembles at runtime.
--
-- ---- THE MISTIMED-OBLIGATION GUARD, AND WHY IT NEEDED FOUR ROWS -----
--
-- It read, in one expression: a count, a singular-or-plural verb phrase,
-- a joined list of "Country — date (planned for date)" clauses each with
-- its own singular-or-plural branch, and then three more ternaries
-- choosing between "it"/"them", "it"/"they" and "has"/"have".
--
-- Nine English grammar decisions in a single template literal. Every one
-- of them is a decision English makes and other languages make
-- differently, and none of them was reachable by a translator.
--
-- It becomes four rows: two whole-sentence variants for the count, and
-- two for the per-jurisdiction clause depending on whether a planned
-- date exists. The pronoun agreement disappears entirely, because each
-- variant is written out as prose rather than assembled from pieces --
-- which is the only way it can be, since a language that inflects the
-- verb for number cannot patch it in afterwards.
--
-- ---- THE 300-CHARACTER BUDGET DID ITS JOB AGAIN ---------------------
--
-- `guard.mistimed.many` came out at 303 characters and migration 530's
-- standing invariant rejected it. Trimmed to fit rather than exempted:
-- "so the wave plan below does not schedule them" lost one word it did
-- not need. That is twice now the budget has caught prose written by
-- someone who knew the budget existed.
--
-- ---- AND THE PLURAL PAIRS AGAIN ------------------------------------
--
-- `word.wave`/`word.waves` joins the six pairs from 548. The pattern is
-- settled now: a countable noun in a sentence gets two rows and the
-- count picks one. Nothing in the code decides plurality any more.
-- ================================================================

INSERT OR IGNORE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'guard.soon', 'en', '<strong>{0} must start within 90 days</strong> to hit the published deadline on your current phase assumptions.'),
  ('roi', 'word.wave', 'en', 'wave'),
  ('roi', 'word.waves', 'en', 'waves'),
  ('roi', 'waves.noMandate', 'en', '<strong>No mandate, included by your selection ({0}):</strong> {1}. Costed at the simple rate and scheduled as one discretionary wave &mdash; there is no deadline to miss, so this work can start whenever you have capacity.'),
  ('roi', 'waves.inforce', 'en', '<strong>Already in force, no further dated step ({0}):</strong> {1}. These are compliance-now, not project-plan items.'),
  ('roi', 'guard.mistimed.one', 'en', '<strong>{0} selected jurisdiction has an obligation earlier than the date this plan plans for.</strong> {1}. These are dated, live obligations that the arrivals board does not display, so the wave plan does not schedule it. The runway shown for it is longer than the runway it actually has.'),
  ('roi', 'guard.mistimed.many', 'en', '<strong>{0} selected jurisdictions have obligations earlier than the date this plan plans for.</strong> {1}. These are dated, live obligations that the arrivals board does not display, so the wave plan does not schedule them. The runway shown for them is longer than the runway they actually have.'),
  ('roi', 'guard.mistimed.planned', 'en', '{0} &mdash; {1} (planned for {2})'),
  ('roi', 'guard.mistimed.disc', 'en', '{0} &mdash; {1} (planned as discretionary)');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'guard.%' = 5
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key LIKE 'waves.%' = 6
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('word.wave','word.waves') = 2
--
-- Both halves of the mistimed guard must exist, and both must keep their
-- slots. A missing variant means one jurisdiction count renders the key
-- name; a lost slot means the guard names no jurisdictions, which is the
-- entire content of the warning.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('guard.mistimed.one','guard.mistimed.many') AND value LIKE '%{0}%' AND value LIKE '%{1}%' = 2
