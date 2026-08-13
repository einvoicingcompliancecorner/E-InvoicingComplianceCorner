-- ================================================================
-- Mark EU member states, so EU-wide obligations can be applied to the
-- countries they actually bind.
--
-- Dan, 12 Aug 2026: "I agree, take the first approach, with an
-- eu_member column. That may come in useful at a later date, as I
-- prepare content for the ViDA go live for this site."
--
-- THE PROBLEM THIS SOLVES, stated precisely, because the first framing
-- of it was wrong. Migration 504 took eleven per-country ViDA 2030
-- entries off the Arrivals board, leaving only the European Union
-- entry, because twelve cards for one EU-wide fact was cumbersome.
-- That was right and it stands.
--
-- It did NOT remove them from the country deep-dive pages —
-- getMilestonesForCountry() applies no on_tracker filter at all, by
-- design, so all eleven still render on their country timelines today.
-- Verified in the data before writing this. Nothing here puts anything
-- back on the tracker, and nothing here needs to: the deep dives never
-- lost them.
--
-- What actually broke is subtler. The ROI planner filters milestones on
-- `on_tracker = 1` and excludes the European Union row with
-- `code <> 'EU'`, so it could see neither the eleven per-country
-- entries nor the surviving EU one — and seven member states lost their
-- only future deadline from the wave plan. The planner was reading
-- `on_tracker`, a PRESENTATION flag meaning "show this on the board",
-- as if it answered "is this a live obligation". Those were the same
-- question until 504, which is exactly where they diverged.
--
-- WHY NOT JUST READMIT THE ELEVEN. Because `on_tracker = 0` is doing
-- two unrelated jobs. Of 159 off-tracker B2B milestones, 148 are
-- genuinely superseded, historical or interim, and 11 are true facts
-- de-duplicated for readability. A blanket readmission was modelled and
-- moved the United Kingdom's deadline from April 2029 to November 2026.
--
-- THE APPROACH TAKEN INSTEAD. The EU row still carries `eu-drr` at
-- 2030-07-01 with `on_tracker = 1` — live, on the board, the entry Dan
-- deliberately kept. The planner now reads that one EU-wide milestone
-- and applies it to member states, which mirrors the reasoning behind
-- keeping only the EU entry: it is one EU fact, not eleven national
-- ones. No milestone data changes, the board is untouched, and the
-- deep dives are untouched.
--
-- WHY A COLUMN AND NOT A LIST IN THE WORKER. `region = 'Europe'` cannot
-- do this job — that bucket also holds Norway, the United Kingdom,
-- Iceland, Serbia and Turkey, none of which ViDA binds. And a hardcoded
-- array in shared/roi-render.mjs would repeat the mistake migration 510
-- was written to correct: a value that drives a customer-facing number
-- must be stored, not inferred or buried in code.
--
-- Dan also expects to want it for ViDA go-live content, which is a
-- better reason than the one that prompted it.
--
-- All 27 member states are tracked on this site, so this is the full
-- list rather than a subset. Not members, and deliberately 0: Norway,
-- Iceland, the United Kingdom, Serbia and Turkey.
-- ================================================================

ALTER TABLE countries ADD COLUMN eu_member INTEGER NOT NULL DEFAULT 0
  CHECK (eu_member IN (0, 1));

UPDATE countries SET eu_member = 1 WHERE code IN (
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE',
  'IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'
);

-- The European Union row itself is a container for EU-wide milestones,
-- not a member state and not a jurisdiction anyone implements in. Left
-- at 0 deliberately: `eu_member = 1` should mean "ViDA binds this
-- country", and a query counting member states must not find 28.

-- ---- explain it where it is applied ----
DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key = 'help.vida';
INSERT INTO translations (namespace, key, lang, value) VALUES
('roi', 'help.vida', 'en',
 'Some deadlines in this plan come from EU law rather than from the country''s own legislature. Council Directive (EU) 2025/516 makes structured e-invoicing and digital reporting mandatory for intra-EU B2B from 1 July 2030, and it binds all 27 member states whether or not they have enacted a domestic mandate. Those rows are marked EU-WIDE. The tracker board deliberately shows this as a single European Union entry rather than 27 national ones, because it is one fact — the planner applies that same entry to each member state you have selected, so your wave plan is complete. A country whose only obligation is this one is treated as at least a simple integration, since there is real work to do even where nothing national has been legislated.');

-- ---- what this migration claims it did (see apply_migrations.py) ----
-- Twenty-seven member states, and the two neighbours most often filed
-- with them by mistake are checked by name: Norway is not a member, and
-- Germany is.
--
-- ASSERT: SELECT sum(eu_member) FROM countries = 27
-- ASSERT: SELECT eu_member FROM countries WHERE code = 'NO' = 0
-- ASSERT: SELECT eu_member FROM countries WHERE code = 'DE' = 1
