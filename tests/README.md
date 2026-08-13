# tests/

Everything here runs with no Cloudflare credentials, no wrangler and no
network. That is the point: a check you can only run from one machine is a
check that gets skipped.

```bash
npm install                 # playwright, once
npx playwright install chromium
npm test                    # all five suites
npm test -- currency        # just the one whose name matches
```

In the build sandbox, playwright is installed globally and Chromium is
preinstalled at `/opt/pw-browsers/chromium`; `tests/lib/browser.mjs` finds
both without configuration. Override with `NODE_MODULES_ROOT` or
`PLAYWRIGHT_CHROMIUM` if yours live elsewhere.

## What each suite protects

| Suite | Command | The bug it exists because of |
|---|---|---|
| migration replay + assertions | `apply_migrations.py --replay-only` | Migrations 470/480/490 ran cleanly and changed nothing for three country builds |
| assertion mechanism | `test_assertions.py` | An assertion runner that silently passes everything is worse than none |
| ROI regression | `npm run test:roi` | `\${hlp(...)}` escaped into the runtime script twice, killing the calculate button |
| currency round trip | `npm run test:currency` | The selector changed the symbol only, overstating a GBP business case by a third |
| contrast audit | `npm run test:contrast` | 55 elements of near-black text on dark navy, at 1.05:1, live |

## Auditing any other page

The contrast auditor is also available as a one-off against any HTML this
project ships — a whitepaper, a design document, a live URL:

```bash
npm run contrast -- design-review.html
npm run contrast -- whitepaper-einvoicing-roi-evidence.html 420   # narrow viewport
npm run contrast -- https://e-invoicingcompliancecorner.com/
```

It exits non-zero on any AA failure, so it can gate a deliverable. The
ROI planner keeps its own suite because it has to be built from D1 first
and has three interactive states; everything else here is a static file.

This earned itself immediately: the first thing it was pointed at was the
design review document, and it failed on a badge style added minutes
earlier — dark ink on the brand green is 3.57:1.

## The fixture, and why it is built this way

`tests/lib/` assembles the page under test. Three decisions in there were
each paid for:

**It replays the migration chain instead of loading a snapshot.**
`replay_server.py` rebuilds the database from `schema.sql` plus every
migration — the same replay `apply_migrations.py` validates — and then
answers arbitrary SQL over a pipe. The first version of this harness read
a JSON snapshot of the countries table captured by hand. It went stale the
moment the complexity scale was rescaled, the page under test broke on a
lookup the snapshot could not know about, and the harness passed anyway. A
fixture that does not track the schema tests last week's code.

**It drives the real query functions.** Because the replay answers real
SQL, `build-page.mjs` calls the actual exported `getRoiCountries`,
`getRoiBenchmarks`, `getRoiPhases`, `getRoiStrings` and `getRoiFxRates`
from `shared/roi-render.mjs`, against a D1-shaped handle. A hand-copied
version of that SQL would be one more thing that can be wrong on its own.

**It renders inside the real shell.** `build-page.mjs` lifts `BASE_STYLE`
out of `members-worker/src/index.js` and concatenates it *before*
`ROI_STYLE`, exactly as `pageShell()` does. This is the whole reason the
contrast bug shipped: the standalone page passed with zero failures
because `BASE_STYLE` was not in it. **Audit a shared render module inside
the shell that actually serves it — testing the module alone tests a page
nobody sees.**

Deliberate omissions from the fixture, both harmless to what is measured:
the Google Fonts `<link>` (no network in CI, and fallback fonts do not
change computed font-size, which is what the AA size thresholds turn on)
and `renderLangBanner()`'s strip, which sits above the tool and shares no
styles with it.

## Writing a new check

Two habits, both learned here:

**Prove the check fails.** Every suite in this folder has been run against
a deliberately broken copy of the code it covers, and each one caught the
original defect: the currency suite reports 4 failures when
`applyCurrency` is reduced to a symbol swap, and the contrast audit
reports 71 elements at 1.05:1 when `color` is removed from `ROI_STYLE`'s
`.card`. A green suite that cannot go red is decoration.

**Assert a floor, not a count, where the number is legitimately mobile.**
The tooltip check asserts "at least 28 markers, none of them empty"
rather than an exact 30, because two markers are conditional on the
country selection. An exact count broke the day the selection changed and
told nobody anything useful.

The contrast auditor has an `ALLOWED` list for documented exceptions.
It is empty today. Anything added to it needs a reason in the entry, and a
growing list is a smell rather than a workflow.

## Not here yet

The content-monitor digest simulator is still an untracked scratch
script. It needs a good deal of KV and fetch mocking to run offline,
which is why it did not come across with the other three.
