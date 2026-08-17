# Vendored webfonts

The three families `members-worker`'s page shell loads from Google Fonts,
kept here as files so the test harness renders **the page that ships**.

## Why they are in the repository

Until 17 August 2026 the harness loaded no webfonts at all. Every page it
built rendered in system fallbacks, which meant every width, wrap and
overflow it measured was measured in substitute metrics — and reported as
verified. Dan noticed the headings looked wrong in a mock and asked
whether it was a glitch; it was not, on the page. It was the harness
quietly testing a different document from the one readers get.

Fetching from Google in tests was the obvious alternative and is the wrong
one: a build that reaches the internet fails on a train, and the sandbox
this runs in cannot reach `fonts.googleapis.com` at all.

## What is here

Latin subset, normal (non-italic), exactly the weights the page shell
requests — nothing else, which is why this is 196 KB rather than 40 MB:

    Big Shoulders Display   600 700 800
    IBM Plex Sans           400 500 600 700
    IBM Plex Mono           400 500 600

Extracted from the `@fontsource/*` v5 packages, which repackage the
upstream Google Fonts releases. Both families are SIL Open Font License
1.1 — see the two LICENSE files beside this one. The OFL permits
redistribution as part of a larger work; it forbids selling the fonts
alone and requires the licence to travel with them, which is why the
licences are vendored too.

## If the page shell changes its font request

`members-worker/src/index.js` holds the `<link>` that production uses. Add
or remove weights **here to match**, or the harness goes back to measuring
something the reader never sees. `tests/lib/build-page.mjs` asserts that
every file named in its `@font-face` block exists, so a missing weight
fails loudly rather than falling back silently.
