-- ================================================================
-- The country picker: nothing is assumed, and seventy rows become
-- searchable.
--
-- Dan: "what needs changing with the country picker. My preference would
-- be to default to the subscribed countries, or display no checked
-- countries" ... then, settling it: "perhaps default no countries, then
-- the user can check the subscribed countries check box if they would
-- like to default those values."
--
-- ---- NOTHING IS TICKED, AND THE SECOND ANSWER IS THE BETTER ONE ------
--
-- The picker opened with eight large European economies. Migration 570
-- fixed the BUG in that -- it indexed a name-ordered list and ticked
-- positions in a region-ordered one, so the eight landed on Czech
-- Republic, Poland, Portugal, the UK, Australia, New Zealand, Canada and
-- Ecuador. It did not fix the PRINCIPLE.
--
-- Every other default on this page is a BENCHMARK: a published figure
-- with a grade and a citation, which a reader can reasonably accept. The
-- country list is not a benchmark. It is a fact about the reader's own
-- business that we cannot know, and inventing one produces a confident
-- business case for a company that does not exist -- the exact artefact
-- this page must not make.
--
-- DEFAULTING TO THE SAVED LIST WAS THE FIRST DRAFT AND IS NOT RIGHT
-- EITHER, for a reason worth recording: THE SAVED LIST IS AN ALERTS LIST,
-- NOT A FOOTPRINT. The subscribe card asks "Which countries do you want
-- alerts for?" So a reader may follow Poland because it is newsworthy
-- rather than because they invoice there, and a reader with an entity in
-- a country they do not follow would be missed entirely. It is much the
-- best guess available -- and a guess is what it would have been,
-- asserted on the reader's behalf.
--
-- Empty, the checkbox becomes what it should always have been: a one-tap
-- shortcut the reader CHOOSES. The empty-selection guard from migration
-- 575 catches anyone who presses Calculate first and says what to do,
-- which is a better first experience than a confident number about
-- nobody. The checkbox now carries a line saying what the saved list
-- actually is, so a reader who takes the shortcut knows what they took.

-- ---- AND THE PICKER SAYS WHAT IS SELECTED ---------------------------
--
-- Seventy rows in a scrolling box, and the only way to learn what was
-- selected was to scroll seventy rows and count. The header said "Live
-- mandate data for all 70 tracked jurisdictions", which is a fact about
-- US, in the one place a reader needs a fact about THEM.
--
-- It names the countries while there are few enough to name -- three
-- selected means you want to see which three -- and switches to a count
-- beyond nine, where the footprint card above already summarises.
--
-- ---- SEVENTY ROWS IS NOT A LIST, IT IS A HAYSTACK -------------------
--
-- Search matches the name OR the country code, because half this audience
-- says "DE" for Germany, and it is accent-insensitive so a French reader
-- typing "republique" finds "Republique tcheque". Region headings hide
-- with their rows, or a search leaves four empty region labels behind.
INSERT OR REPLACE INTO translations (namespace, key, lang, value) VALUES
  ('roi', 'subs.what', 'en', 'Those are the countries you follow for alerts. Adjust the list if your invoicing footprint is different.'),
  ('roi', 'input.countrySearch', 'en', 'Search 70 jurisdictions'),
  ('roi', 'input.countryNoMatch', 'en', 'Nothing matches that. Clear the search to see every jurisdiction.'),
  ('roi', 'countries.none', 'en', '<strong>No jurisdictions selected.</strong> Pick the countries you invoice in, or use your saved list above.'),
  ('roi', 'countries.named', 'en', '<strong>{0}</strong> in scope: {1}.'),
  ('roi', 'countries.count', 'en', '<strong>{0}</strong> jurisdictions in scope.'),
  ('roi', 'waves.emptyChart', 'en', 'No selected jurisdiction has both a future dated deadline and a mandate to build for, so there is no delivery timeline to plot. Jurisdictions already in force still need remediation &mdash; see the table below.'),
  ('roi', 'adjust.empty', 'en', 'Nothing is selected, so there is nothing to rearrange.'),
  ('roi', 'waves.emptyTable', 'en', 'No selected jurisdiction has a future dated deadline. Those already in force still need remediation work &mdash; see the in-force list below.');

-- `input.countries.hint` was the "Live mandate data for all 70 tracked
-- jurisdictions" line the count replaced. Left in place it is a row
-- nothing renders, which the i18n suite reports as a failure -- and did,
-- within a minute of the markup change.
DELETE FROM translations WHERE namespace = 'roi' AND key = 'input.countries.hint';

-- ---- THREE STRINGS THE EMPTY DEFAULT MADE REACHABLE -----------------
--
-- Changing the default to nothing meant the detector rendered the EMPTY
-- STATE for the first time, and immediately found three untranslated
-- English strings that had been sitting in the renderer: the chart's
-- "nothing to plot", the adjust panel's "nothing to rearrange", and the
-- wave table's "no future dated deadline".
--
-- They were unreachable in the default render because eight countries
-- were always selected. Not a hole in the detector -- the same short
-- itinerary named in migration 574, from the other direction: a state
-- nobody could reach was a state nobody checked. Changing the default
-- widened the route and the check did the rest.
--
-- ---- what this migration claims it did ------------------------------
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'input.countries.hint' = 0
-- ASSERT: SELECT count(*) FROM translations WHERE namespace = 'roi' AND lang = 'en' AND key IN ('countries.none','countries.named','countries.count','subs.what','input.countrySearch','input.countryNoMatch','waves.emptyChart','adjust.empty','waves.emptyTable') = 9
--
-- The empty state must keep telling the reader what to do about it. A
-- page that opens with nothing selected and does not say why, or what to
-- do, is worse than the invented eight it replaced -- and the English
-- reads fine either way, so nothing else would catch its removal.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'countries.none' AND (value LIKE '%saved list%' OR value LIKE '%{0}%') = 1
--
-- Both slots must survive on the named form, or the line reports a count
-- with no countries or countries with no count.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key = 'countries.named' AND value LIKE '%{0}%{1}%' = 1
--
-- ---- AND THE JURISDICTION COUNT, INHERITED FROM 518 -----------------
--
-- 518 required both `page.lede` and `input.countries.hint` to state the
-- picker's own count, written relatively so it cannot drift. The hint is
-- gone -- it said what WE track, in the one place a reader needs to know
-- what THEY selected -- and the count moved to the search placeholder.
--
-- Same rule, following the string. This is the invariant that exists
-- because "62 jurisdictions" sat on the live site for two days.
--
-- ASSERT ALWAYS: SELECT count(*) FROM translations WHERE namespace = 'roi' AND key IN ('page.lede','input.countrySearch') AND value LIKE '%' || (SELECT count(*) FROM countries WHERE in_picker = 1) || '%' = 2
