# Signing up inside the planner — a panel and a 6-digit code

*20 August 2026. Dan's proposal, evaluated against the code rather than
from memory. Nothing built.*

## What you asked for

A pop-up in the planner, in the manner of the "About this site" modal,
hosting the subscribe form. The reader fills it in without leaving the
page they are building. Instead of a magic link that opens a second
window and abandons their work, we email a **6-digit code** which they
type into the same panel.

## Verdict

**Yes — and it is better than the design we agreed, for a reason neither
of us gave.**

Your stated reasons are the obvious ones and they hold: no domain change,
no lost inputs, no second window. But the code does something the agreed
step 3 quietly got wrong, and I would rather say so plainly than let it
ship.

### The hole the code closes

The agreed design was: submit the five fields, **create the account and
sign them in immediately**, send the welcome email in the background,
flag the record unverified until it is clicked.

That breaks an invariant the site has always held. Today a session can
only ever be obtained by clicking a link in an inbox, so **holding a
session for an address proves you control that address**. Sign-in-on-
submit removes the proof. I could type your address into that panel and
be handed a session as you.

What that costs today is small but not nothing: `/members/preferences` is
genuinely session-gated, so a squatted address means someone else editing
"your" alert countries — and because sign-up is one-per-email
*permanently*, the real owner arriving later is told they have already
signed up. Not catastrophic, entirely real, and it gets worse the moment
anything of value sits behind the session, which is exactly the direction
we said the planner should go.

**The code restores the proof.** It is the same guarantee as the magic
link, delivered without leaving the page. That is the strongest argument
for your proposal and it is not the one you made.

## What this rides on that already exists

Almost none of this is new machinery, which is the other reason to like
it.

**A modal hosting a document** — the whitepaper pop-out in the tracker
already does exactly this, dark-themed, with the same overlay/open/close
mechanics as the About modal.

**A same-origin path to members-worker** — `env.MEMBERS`, the service
binding added on the 20th for saved countries. site-worker already
forwards a reader's own cookie to members-worker and hands the answer
back. A signup POST is the same shape in the other direction.

**Rate limiting with a durable record** — `handleFeedback` already caps
5 per hour per IP by counting rows in D1 and returning 429. The code
endpoint needs the same thing and can copy the pattern rather than invent
one.

**Coordinates exchanged between frame and parent** — `eicc:roi-height`
and `eicc:roi-scroll` already exist for precisely the class of problem
the panel will hit (below).

**The session cookie is already parent-domain**, so a Set-Cookie issued
by members-worker and relayed through site-worker is valid on the public
host. No CORS, no credentials-with-CORS, which this codebase has twice
refused to do.

## The four things that will bite

### 1. `position: fixed` does not mean what you think inside this frame

This is the one that would have cost a day.

The planner is an `<iframe>` **sized to its own full content height** —
the frame reports its height and the tracker grows the element to match.
Its own comment says it: *the frame never scrolls, its viewport IS the
document.*

So a modal centred with `position:fixed` centres itself in a viewport
that is nine thousand pixels tall. The reader clicks the gate and the
form appears roughly four thousand pixels below where they are looking,
on a page that has not moved. **It would render perfectly and be
invisible**, which is this project's favourite failure and the reason
the anchor fix exists at all.

Three ways out, in order of how much new machinery each needs:

**(a) Don't overlay — expand in place.** The gate becomes the form. No
overlay, no positioning maths, and the existing `eicc:roi-scroll` message
brings the reader to it, which is code that already works. Identical
behaviour framed and standalone. **This is what I would build.** It is
also arguably better conversion: the reader pressed a button and the form
appeared where the button was, rather than a layer arriving over the top.

**(b) A real overlay, with one new message.** The parent tells the frame
where the visible region actually is (`eicc:roi-viewport {top, height}`),
the panel positions itself absolutely inside that. One implementation,
works in both contexts, ~20 lines and a new protocol pair to keep in
agreement — `tests/menu-routes.mjs` already checks the existing pair for
exactly this reason.

**(c) Render the modal on the parent.** Rejected: the panel would then
exist twice, once in the tracker and once in the standalone planner, and
this project has been bitten three times this month by two copies of one
truth drifting apart.

Note the panel's position does **not** affect your main goal. The
reader's inputs survive either way, because nothing reloads the frame.

### 2. Two signup forms is the defect this project keeps having

`subscribe.html` has the five fields, a 70-country checkbox list and a
billing selector, posting to `/members/start-trial`. Rebuild that inside
the planner and there are two forms, and they will drift — different
labels, one gaining a field, translations diverging. That is the
two-vocabularies defect from the A/B/C/D labels, from platform-versus-
software-fees, and from the pie and the table, in a fourth place.

So the field set has to come from **one definition both surfaces render**,
and a check has to assert they collect the same `name=` attributes. Not
optional, and it is most of the reason this is three days rather than one.

Nesting an `<iframe>` of `subscribe.html` inside the panel avoids the
duplication and I would still not do it — that is three frames deep, the
POST navigates the innermost one to another origin, and getting the
result back out needs a message chain through all three.

**Countries need a decision of their own.** The full 70-country list does
not fit a panel. Carry the planner's selection across, show it as one
editable summary line ("We'll alert you on: Poland, Germany, +9"), and
put the full list behind that line rather than in front of it.

### 3. A 6-digit code needs somewhere to live, and KV is the wrong shelf

The session is a stateless HMAC — nothing to consult, which is why it
works across two Workers. A 6-digit code cannot work that way: with only
a million values it must be *stored and compared*, never *derived*, or it
can be forged offline.

`SUBSCRIBERS` KV is the obvious shelf and the wrong one: KV is eventually
consistent, so "write the code, then read it back sixty seconds later
from whichever colo the reader lands in" has a real failure mode — and it
fails as *"that code is wrong"* to someone holding a correct code. **Use
D1**, which is bound to both Workers, strictly consistent, and already
carries the feedback table doing a near-identical job.

That table is also where the **submitted details should sit until the
code is verified** — which is a change to the agreed design worth making
explicitly:

> **Do not create the subscriber record until the code is entered.**

Otherwise every abandoned attempt leaves an active account with
`hadTrial: true`, and because sign-up is one-per-email permanently, the
reader who comes back tomorrow to finish is told they have already
signed up. A pending row expires by itself and pollutes nothing. It also
serves your goal better than the browser does: their details are safe
server-side even if the tab dies.

### 4. An unauthenticated "email anyone" button, one click from the tracker

`/members/start-trial` has no rate limit today. It is reachable, but it
is behind a form on its own page. Putting it one click inside the
tracker's most-used panel makes it an easier lever for someone who wants
to send mail to an address they don't own, or to burn the Resend quota.

Cap it the way feedback is capped — per IP per hour, and per target
address — before it is one click deep rather than after.

## The code's own design

Small decisions, all of which have a wrong answer that looks fine:

**Generated with `crypto.getRandomValues`**, never `Math.random`. Six
digits, leading zeros preserved (a code stored as a number and printed
back becomes five digits about a tenth of the time).

**Stored hashed**, compared in constant time, **single use**, deleted on
success.

**Ten minutes**, not fifteen. The magic link's fifteen covers "read it on
your phone later"; a code typed into an open panel is a much shorter
story, and shorter is strictly safer.

**Five attempts, then the code dies** and a new one must be requested.
Without a cap, a million guesses is an afternoon.

**Bound to the browser that asked for it** — an opaque random id in a
short-lived cookie, set when the form is submitted and required when the
code is entered. This makes the code useless to anyone who did not start
the flow, which is a genuine improvement on the magic link, where anyone
holding the URL is in.

**Resend with a visible cooldown**, the address echoed back with an edit
control beside it. A mistyped address is the most common failure by a
wide margin and the panel must let them fix it without starting over.

**And a way out that is not a dead end.** If the mail does not arrive the
reader is sitting in a panel with nothing to do — worse than today, where
at least the form completed. The magic link should still be sent
alongside the code, so the email contains both: type the six digits, or
click the link. Same email, two doors, and the one they choose tells us
nothing we need to know.

**The email must say what the code is for and that we will never ask for
it.** Code-reading is the standard social-engineering attack on exactly
this pattern.

## The one product decision, and it is yours

Your description puts the code **before** the results: fill in, submit,
wait for mail, type six digits, results appear.

Worth weighing, because there is a cheaper variant:

**Code first (as you described).** Nobody reaches the results without a
proven address, the list is clean, and the session hole above is closed
completely. Cost: the reader waits on email at the exact moment their
intent is highest. If it lands in spam you have lost them — though not
their details, which are already in the pending row.

**Results first, code beside them.** Submit, results unlock instantly,
and the panel stays open above them: *"Confirm your address to keep your
alerts."* Best possible conversion moment preserved, and the details are
captured either way. Cost: the session is issued before proof, so the
squatting hole stays open, and a share of readers will never type the
code.

**A third, which I think is actually right:** code first, but the account
and the alerts are what the code protects — **not the results**. The
results withhold nothing real; you and I established that a fortnight
ago. Show them on submit, issue **no session**, and require the code
before anything that is genuinely account-shaped: the session cookie,
saved countries, preferences, alerts. The reader gets what they came for
immediately, and the thing that needs proof waits for proof.

That keeps the conversion moment, keeps the list clean, and closes the
hole — which is the only combination here that gives up nothing.

## What I would build, in order

1. **The pending-signup table and the code endpoints** on members-worker
   — request, verify, resend — with the D1 rate limit and the attempt
   cap. Testable with no UI at all.
2. **site-worker's same-origin relay** over `env.MEMBERS`, including
   relaying the Set-Cookie so there stays exactly one place that decides
   who gets a session.
3. **One field definition, two surfaces.** Refactor `subscribe.html` to
   render from it before the panel exists, so the panel is the second
   consumer rather than the second copy.
4. **The panel**, expanding in place, with the countries summary line.
5. **Strings into D1** by migration, generated from the renderer's
   fallbacks and never retyped.
6. **A suite for the code flow**, negative-tested: expired, wrong,
   sixth attempt, replayed after success, entered from a different
   browser, leading-zero code.

Roughly three days, and step 3 is the one most likely to be
underestimated.

## What I need from you

1. **Which of the three gating options above** — code before results,
   results with the code beside them, or results immediately with the
   code protecting the account.
2. **In-place expansion or a true overlay?** I recommend the first; you
   asked for the second and it is buildable.
3. **Does `subscribe.html` stay?** It should — email links, search and
   the education pages all point at it. But it becomes the second-choice
   route, and that changes what it should say.
