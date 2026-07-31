-- Fixes a genuine date error: this milestone's own description says
-- the State Budget was "approved 27 November 2025", but the date
-- column was mistakenly entered as 2026-11-27 -- a full year off.
-- Caught because it caused an incorrect "Upcoming" badge on an event
-- that had actually already happened.
UPDATE milestones SET date = '2025-11-27' WHERE id = 'pt-pdf-valid-through-2026';
