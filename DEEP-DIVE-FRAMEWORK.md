# The deep-dive and compliance-guide framework

*Written 27 August 2026, after Dan flagged that recent country additions were
straying in style, consistency and content. The measurement behind it is
`claude/deep-dive-drift.md` in the project. Enforced by
`tests/deep-dive-shape.mjs`.*

**Read this before authoring any country page.** It replaces the length advice
in `DEEP-DIVE-MIGRATION-CHECKLIST.md`, which was prose, was ignored, and is the
reason this document exists.

---

## Why there is a framework at all

The same drift has now happened twice. Migration `355` records the first:
`mandate_summary` and `timeline_intro` crept from a 40–60 word norm to 191 words
by Hungary, Dan spotted it, six countries were rewritten, and the fix was to
write a length target into the runbook. Within three weeks it had recurred, on
more fields and harder.

There is a controlled experiment in our own data explaining why. Same pages,
same authors, same weeks — one field carries an enforced 150-character
invariant, the other carried runbook advice:

| | July 2026 | August 2026 | change |
|---|---|---|---|
| `b2g_note` — **capped by an invariant** | 81 chars | 92 chars | **+13%** |
| `compliance_model` — **advice only** | 42 chars | 157 chars | **+274%** |

The capped field never approached its ceiling. The uncapped field on the same
page nearly quadrupled. **Advice does not hold a line; a check does.** That is
the whole argument for this document existing as numbers rather than guidance.

Two further mechanisms are worth naming, because both were in the previous fix:

- **"Err toward less elaboration than the most recent country" is a ratchet.**
  Every build anchors on the last build. An instruction to be slightly shorter
  than a creeping anchor slows the climb; it cannot stop it.
- **"Nuance belongs in the cards, which have no comparable length pressure" was
  read as licence.** It is where the elaboration went, and it is why the card
  vocabulary dissolved into per-country invention.

---

## Where the numbers come from

**Not from taste.** Every band below is the observed range of the 27 countries
authored on 20–21 July 2026, when the site was internally consistent — rounded
outward slightly to leave working room.

The July cohort is unusually tight, and one property of the data decided the
shape of the rules:

> **Every prose field's minimum is identical between July and today. Only the
> maxima moved. Every structural count's maximum is identical; only the minima
> moved.**

Prose grew; structure shrank. So:

- **Prose has a hard maximum and a soft minimum.** A hard minimum would invite
  padding — a country with little to say would have words added to clear the
  floor, producing exactly the bloat this document exists to prevent. Nothing
  has ever drifted below the July floor, so a hard floor would buy nothing and
  cost honesty.
- **Structural counts have a hard minimum and a hard maximum.** Here the
  observed failure is shrinkage, so the floor is the operative half.

---

## The bands

Measured on **English**. Spanish, German and French run 15–40% longer for the
same content — that is normal, not drift — so translations are allowed 1.5× the
English maximum and judged against the English text.

### Page prose

| field | min (soft) | max (hard) | July observed |
|---|---|---|---|
| `compliance_model` | 20 chars | **64 chars** | 27–57 |
| `mandate_summary` | 35 words | 75 words | 36–66 |
| `timeline_intro` | 18 words | 40 words | 19–34 |
| `file_format_intro` | 14 words | 35 words | 14–28 |
| `scope_intro` | 15 words | 35 words | 15–31 |
| `steps_intro` | 13 words | 40 words | 15–31 |
| `penalties_intro` | 15 words | 35 words | 15–27 |
| `footer_disclaimer` | 45 words | 70 words | 45–59 |

**`compliance_model`'s 64 is not a style choice — it is the compliance guide's
own clip.** `shared/guides-render.mjs` prints this field in the guide's Model
column as `clip(model.split(/[.;]/)[0], 64)`. Anything longer is truncated
mid-phrase in a PDF a reader downloads; 37 of 76 countries are truncated today.
The test reads that constant out of the source, so the two cannot drift apart.

### Structure

| thing | min | max | July observed |
|---|---|---|---|
| section 02 `file_format` cards | 3 | 5 | 3–5 |
| section 03 `scope_transmission` cards | 2 | 4 | 2–4 |
| section 05 `penalties_related` cards | 3 | 4 | 3–4 |
| `deep_dive_steps` | 5 | 7 | 5–7 |
| `deep_dive_stats` | 3 | 5 | 3–5 |
| `deep_dive_portals` | 1 | 3 | 1–2 |
| longest portal label | — | 48 chars | 5–47 |

Portals are the one band deliberately looser than July. July ran 1–2; the recent
pages run 3–4. More official links is a real gain, and the complaint was pill
*size*, not existence — so the ceiling is 3 with a 48-character label cap rather
than a return to 2.

### Row values, measured where the reader is

| thing | max | corpus today |
|---|---|---|
| a section-02/03 row value, rendered at 1440px | 6 lines | p50 1, p90 2, max 7 |
| the same, rendered at 390px | 7 lines | p50 2, p90 3, max 8 |

**This is a length band expressed in the only unit that means anything here.**
A character count would have to guess at the column the string lands in, and
the guess was wrong for two months: the same 200-character value was three
lines in one card and eleven in another. A rendered line count is what the
reader sees, and it moves when either the prose or the layout moves.

The band covers all four languages — German runs longest and is the reason the
desktop figure is six rather than five. It is enforced by
`tests/spec-row-layout.mjs`, which mounts the real worker over the replayed
chain and counts line boxes with `Range.getClientRects()`. One country is
backlogged in `tests/data/spec-row-backlog.json`: **Hong Kong**, whose
section-03 rows run to 391 characters — a card body that was written as a row.

A row value that will not fit the band is not a row. Give it the card's `body`,
or give it a card of its own.

### The row shape, and the three times this site has learned it

Sections 02 and 03 flow their cards down **two columns**, and each row renders
its **key above its value**, both full width. Not three columns, not grid rows,
and not a key column beside a right-aligned value.

Dan, 28 August 2026, on Poland and Malaysia: *"Is it better to have two boxes,
rather than three in the row, and widening the box so text is not wrapped as
much?"* Measured across ten countries at 1440px, counting rendered line boxes:

| | total lines | worst value | values over 5 lines |
|---|---|---|---|
| three up, key beside value | 660 | 15 lines | 42 |
| two up, key beside value | 416 | 8 lines | 21 |
| three up, key above value | 367 | 7 lines | 16 |
| **two up, key above value** | **256** | **4 lines** | **0** |

Two columns is right, and is half of it. The other half is that a 269px card
spent 122px on the key column and right-aligned the value into what was left,
so 88% of section-02 values could not fit one line. On a phone the column count
does nothing at all — the grid was already one column — and the ribbon was
still 170px of a 351px card.

**The site had already learned this twice and never brought it back here.** The
deep dive's own `.related-row` carries the comment *"penalty rows carry
sentences, not values, and a right-aligned 58% column breaks them into
ribbons"*; the compliance guide's `.kv .rows` solved it a third way, with a
fixed left key column. Sections 02 and 03 were the last key/value rows on the
site still ribboning.

A conditional shape — inline for short values, stacked for long ones — measured
marginally shorter still and was **rejected on measurement**: 45% of the
corpus's 468 cards mix short and long rows, so nearly half would render two
different row shapes inside one card. That is the inconsistency this document
exists to stop.

**Columns, not grid rows** — the second half of the same report. Dan, on the
two-up layout the day it deployed: *"the poland file format section now
includes gaps, which could be filled with boxes moving up."* Sizing cards to
their content had removed the empty *boxes*; only flowing them down columns
removes the empty *space*. Two kinds of empty space have to be scored
separately, and the first attempt at this scored them as one:

| | gap with a card below it | ragged bottom |
|---|---|---|
| grid rows | 4,763px | 23,198px |
| **column flow** | **39px** | 25,211px |

A hole with content under it reads as broken; a section ending unevenly does
not. The flow removes 4,724px of the first and pays 2,013px into the second.
CSS masonry would be the textbook answer and is unsupported in all three of its
spellings by the Chromium the suite runs against. A shortest-column fill
computed in the renderer scores better than both — and was rejected because it
puts a calibrated pixel model of the stylesheet inside the renderer, where a
later font change degrades it silently, to win 0.6% of a page's whitespace.

One thing the measurement ruled out: this was **not** content drift. Section 02
averages 1,165 visible characters across the older half of the corpus and 1,171
across the newer half. The prose did not grow. Four countries were simply given
researched Identifiers cards whose rows are sentences, and the layout could not
hold a sentence.

### Why the section headings make counts matter more than they look

Sections 02, 03 and 05 render their numbered heading and their intro paragraph
**unconditionally** — only the card grid varies. A country with one card still
gets a full heading, a lead paragraph, and then a single card in a grid built
for four. That is what "the sections vary in what is displayed" looks like from
the reading side, and it is why the floor is the half that matters.

---

## The section-02 spine

*Defined here and **enforced** by `tests/deep-dive-shape.mjs` check 6, which
parses the four titles out of the numbered list below rather than restating
them — so changing the spine means editing this document. **29 of the 77 rows
with a section 02 carry it**; the other 48 are listed under `spine.notyet` in
`tests/data/deep-dive-backlog.json`, and that list may only shrink.*

Section 02 must carry these four cards, in this order, and may carry up to one
more:

1. **Format & standard**
2. **Identifiers & registration**
3. **Mandatory content**
4. **Archiving**

### How the spine is arranged on the page

The order above is the order the reader gets, and the layout is part of the
spine rather than a decoration on top of it. Section 02 and section 03 flow
their cards **down two columns** — never three, never grid rows — and each card
renders its **key above its value**, both full width.

So the four spine cards land as a newspaper reads: one and two down the left,
three and four down the right, with a permitted fifth card taking whichever
column the flow has left shorter. Poland is the worked example — Format &
standard, Identifiers & registration, Mandatory content, Archiving, Clearance
output, in that order, with no gap above any card.

Three properties this arrangement is chosen for, each measured rather than
judged, and each held by a check in `tests/spec-row-layout.mjs`:

- **No card floats below a gap.** Grid rows left 4,763px of empty space with
  content underneath it; the flow leaves 39px. Worst single hole was 432px, on
  Poland, and 56 countries had at least one. The cost is paid at the bottom of
  the shorter column, where it does not read as broken: measured across the
  corpus, a median of 172px and a worst case of 558px. **A country with five
  cards pays the most**, because the balancer splits them three and two — all
  four countries in the 28 August batch sit in the worst ten.
- **A row value gets the whole card, not a ribbon down one side.** At least 70%
  of the card's inner width, against 45% before.
- **A value fits the reading band** — 6 rendered lines at 1440px in all four
  languages, 7 at 390px.

The full derivation, and the two better-scoring packings that were rejected, is
in *The row shape* above and in `claude/spec-row-layout-part-2-column-flow.md`.

A country with nothing to say under a heading says so in one row — "No format is
prescribed", "No registration exists" — rather than dropping the card. A reader
comparing two markets needs the same four answers in the same four places, and
an absent answer is an answer.

Honesty about what this is: **it is not a restoration.** Only one country
currently carries all four titles; 26 carry some and 49 carry none. July used a
family of near-synonyms — `Format`, `Format & standard`, `Syntax & standard`,
`Mandatory content & archiving` — not an enforced set. This defines a spine that
never quite existed.

Sections 03 and 05 get a floor and a ceiling but no fixed vocabulary. Penalties
genuinely differ between markets, and forcing a shared title there would
misdescribe them.

One card **is** worth standardising and is exempt from the ceiling:
`🔍 What we could not confirm`. It spread to 11 countries after the drift began,
it is the clearest expression of what this site is for, and it should be on
every page rather than trimmed away.

---

## How the check works, and why it is green today

`tests/deep-dive-shape.mjs` measures all 76 countries against every band above.
It ships **green**, because a suite that is permanently red teaches people to
ignore it.

The countries that breach a rule today are listed, by rule, in
`tests/data/deep-dive-backlog.json` — 368 entries at the time of writing. That
file **is the backlog** for bundles 2 to 4, and the test enforces three things
about it:

1. A country **not** in the backlog that breaches a rule → **fail**. New work is
   held to the framework from day one.
2. The backlog may **only shrink**. Adding a name is a failure.
3. A country **in** the backlog that no longer breaches → **fail**, telling you
   to delete the line. Without this, the list becomes stale cover and one
   country's fix can silently pay for another's regression.

Precedent for naming known strays rather than weakening the rule:
`tests/guides-front-table.mjs`, which names the five countries that were
mislabelled "In force" for weeks.

---

## Authoring a new country

The framework is the answer to "how long should this be?" — do not look at the
most recent country, which is what produced two rounds of drift. Look here.

If a country genuinely needs more room than a band allows, that is a
conversation with Dan and a change to this document, not a quiet overrun. The
band moves for everyone or for no one.
