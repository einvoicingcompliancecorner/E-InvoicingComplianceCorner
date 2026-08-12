-- ================================================================
-- A standing review for ROI complexity, so it does not go stale.
--
-- Dan, 12 Aug 2026: "Simple is fine, for Denmark and Germany. Please
-- log for review as mandates evolve. We should check what is being
-- introduced, and update the country complexity as needed."
--
-- THE PROBLEM THIS SOLVES IS TIME, NOT ACCURACY. `roi_complexity` was
-- correct on the day it was assigned. Mandates move: a country that
-- legislates exchange today bolts reporting on eighteen months later,
-- and nothing about the stored value knows that happened. Germany is
-- the live example — an exchange-only mandate in 2027/2028 that becomes
-- a reporting regime under ViDA in 2030 — and Denmark is the other,
-- where SAF-T 2.0 generation lands in January 2027.
--
-- Both were reviewed and confirmed 'simple' today. Both need looking at
-- again when their facts change, and "someone will remember" is not a
-- mechanism.
--
-- WHY AN AUTOMATED CHECK RATHER THAN A DIARY NOTE. The same scan that
-- prompted this — milestones mentioning reporting, clearance or
-- 5-corner against a country stored 'simple' — is what found Belgium's
-- `be-ereport` after it had been wrong since the column was created two
-- migrations ago. It works. Running it once a week inside the content
-- monitor costs nothing and catches the next one automatically.
--
-- WHY A FINGERPRINT RATHER THAN A SIMPLE "ACKNOWLEDGED" FLAG. A plain
-- flag would silence Denmark and Germany forever, which is exactly the
-- failure Dan is asking to avoid: he wants them re-examined when the
-- mandate evolves, not dismissed. So an acknowledgement is recorded
-- against a FINGERPRINT of the country's milestones at the moment of
-- review. Add a milestone, change a date, and the fingerprint moves and
-- the country re-raises with a note saying what was decided last time
-- and why. Nothing changes, nothing is asked.
--
-- That is the whole design: silence while the facts hold, and a prompt
-- the moment they do not.
-- ================================================================

CREATE TABLE IF NOT EXISTS roi_complexity_reviews (
  code         TEXT PRIMARY KEY,      -- countries.code
  decision     TEXT NOT NULL CHECK (decision IN ('none','simple','complex')),
  decided_on   TEXT NOT NULL,         -- ISO date
  decided_by   TEXT NOT NULL DEFAULT 'Dan',
  fingerprint  TEXT NOT NULL,         -- milestone state at the moment of review
  note         TEXT                   -- why, and what would change the answer
);

-- Seeded with the two Dan reviewed today, plus Belgium, whose correction
-- is worth recording as a decision rather than leaving as a silent edit.
--
-- The fingerprint is computed the same way the weekly check computes it:
-- every milestone's id and date for that country, ordered by id, joined.
-- Doing it in SQL here rather than hardcoding a string means the seed
-- cannot drift from what the checker will calculate on its first run —
-- a hardcoded fingerprint that did not match would re-raise all three on
-- day one, which is precisely the noise this is meant to prevent.
INSERT OR REPLACE INTO roi_complexity_reviews (code, decision, decided_on, decided_by, fingerprint, note)
SELECT 'DK', 'simple', '2026-08-12', 'Dan',
       (SELECT COALESCE(group_concat(m.id || '@' || m.date, '|'), '')
          FROM (SELECT id, date FROM milestones WHERE country_id = c.id ORDER BY id) m),
       'Danish SAF-T 2.0 GENERATION is required from 1 Jan 2027 (dk-saft2027) — a capability to produce invoice-level data on request, not a periodic submission, and the regime is a bookkeeping-software mandate rather than a transmission one. Portugal is complex on SAF-T, so this is the arguable side of a real line. RE-EXAMINE IF: Denmark moves from generation-on-request to routine submission, or adds any transmission obligation.'
  FROM countries c WHERE c.code = 'DK';

INSERT OR REPLACE INTO roi_complexity_reviews (code, decision, decided_on, decided_by, fingerprint, note)
SELECT 'DE', 'simple', '2026-08-12', 'Dan',
       (SELECT COALESCE(group_concat(m.id || '@' || m.date, '|'), '')
          FROM (SELECT id, date FROM milestones WHERE country_id = c.id ORDER BY id) m),
       'Germany mandated exchange only — fully decentralised, no clearance and no domestic reporting — and explicitly left reporting to ViDA. Correct as simple under the rule (an e-invoicing mandate only is simple). RE-EXAMINE IF: Germany legislates a domestic reporting requirement, which has been signalled but not enacted. Note separately that its 2030 ViDA reporting obligation is real but invisible in the planner, because only the earliest deadline per country is modelled.'
  FROM countries c WHERE c.code = 'DE';

-- Canada is seeded because the check legitimately flags it and the answer
-- is already known. `ca-regulatory-plan-2025` reads "CRA's regulatory
-- plans list digital reporting initiatives — but not e-invoicing", and a
-- keyword scan cannot read the "but not". Recording the decision is
-- cheaper and more durable than teaching the pattern to parse negation,
-- and it is exactly what the ledger is for.
INSERT OR REPLACE INTO roi_complexity_reviews (code, decision, decided_on, decided_by, fingerprint, note)
SELECT 'CA', 'simple', '2026-08-12', 'Claude',
       (SELECT COALESCE(group_concat(m.id || '@' || m.date, '|'), '')
          FROM (SELECT id, date FROM milestones WHERE country_id = c.id ORDER BY id) m),
       'The CRA milestone mentions "digital reporting initiatives" but the same sentence says "but not e-invoicing" — a plan to study, not an obligation. Canada has no B2B mandate; B2G runs through SAP Ariba. Simple. RE-EXAMINE IF: the CRA moves from listing initiatives to legislating one.'
  FROM countries c WHERE c.code = 'CA';

INSERT OR REPLACE INTO roi_complexity_reviews (code, decision, decided_on, decided_by, fingerprint, note)
SELECT 'BE', 'complex', '2026-08-12', 'Claude',
       (SELECT COALESCE(group_concat(m.id || '@' || m.date, '|'), '')
          FROM (SELECT id, date FROM milestones WHERE country_id = c.id ORDER BY id) m),
       'Corrected from simple on 12 Aug 2026. Belgium was classified on its 2026 4-corner exchange mandate, but be-ereport (1 Jan 2028) is near-real-time e-reporting on a 5-corner Peppol model — two limbs of the rule at once. Found by the milestone scan that this review ledger now automates.'
  FROM countries c WHERE c.code = 'BE';
