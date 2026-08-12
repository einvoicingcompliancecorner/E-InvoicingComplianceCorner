-- ================================================================
-- ROI planner: say plainly that the FX rate is fixed.
--
-- Dan, 12 Aug 2026, having asked whether the rates were static or
-- calculated daily: "Static is fine, so long as a tooltip acknowledges
-- this is the case."
--
-- Migration 513's tooltips already implied it — "a stored rate with a
-- visible date rather than a live feed", "reproducible next quarter",
-- "updating the rate is a migration". A careful reader would get there.
-- But implying is not acknowledging, and the reader who most needs to
-- know is the one skimming a business case they are about to send
-- upwards. So the tooltip now opens with the plain statement and the
-- reasoning follows it, rather than the other way round.
--
-- The always-visible note under the selector says it too (code change,
-- same commit), because the tooltip is behind a hover and this project
-- has already been bitten once this week by putting a material caveat
-- somewhere it could be missed: 513 existed because a warning about
-- the currency selector sat in a tooltip instead of being fixed.
-- ================================================================

DELETE FROM translations WHERE namespace = 'roi' AND lang = 'en'
  AND key IN ('help.fx', 'help.cur');

INSERT INTO translations (namespace, key, lang, value) VALUES

('roi', 'help.fx', 'en',
 'THE RATE IS FIXED. It is a spot rate captured on the date shown beneath the currency selector, stored in the database, and it does NOT update daily or track the market — so this page will convert at the same rate tomorrow, next month, and next quarter until someone deliberately updates it. That is a choice, not an oversight: a business case you can reproduce months later is worth more than one that quietly moves, and a model built on placeholder implementation costs has no use for daily precision. Benchmarks are held in their native currency — every one today is US dollars, being what Ardent Partners publishes in and how the implementation placeholders were stated — and converted from there. Check the date. If it looks stale for the decision you are making, or the number is going anywhere near a contract, use your own treasury rate: enter the figures directly in your own currency and override the defaults.'),

('roi', 'help.cur', 'en',
 'Changes the currency of every money figure on the page, including the benchmark defaults and any value you have overridden — switch to GBP and Ardent''s USD 9.84 becomes its sterling equivalent, not a relabelled 9.84. The conversion uses a FIXED stored rate, dated and shown beneath this control, not a live feed: the same scenario gives the same answer twice, and you can see for yourself how stale the rate is. Your own overrides are preserved in real terms, so a figure you type in one currency follows you into the next. Until 12 August 2026 this control changed only the symbol, which quietly overstated a GBP business case by about a third.');
