-- A 6-digit code, and the signup that waits behind it.
--
-- Dan, 20 August 2026, on the ROI planner's signup: "rather than sending
-- the user a link, to reopen the whole session, we could send a randomly
-- generated 6 digit code, similar to MFA, which they can also enter into
-- the pop-up window". And then, on where the code sits in the flow:
-- "results immediately with the code protecting the account, and code
-- used in other locations when signing in."
--
-- WHY THIS TABLE EXISTS AT ALL, given the session needs no storage.
--
-- The session is a stateless HMAC of {email, purpose, exp} — anything
-- holding SESSION_SECRET can verify it, and there is nothing to consult.
-- A 6-digit code cannot work that way. Six digits is a million values,
-- so a code that is DERIVED from anything (a truncated HMAC, a hash of
-- the email and a timestamp) can be reproduced offline by anyone who
-- can guess the inputs. It has to be RANDOM, STORED, and COMPARED.
--
-- WHY D1 AND NOT THE SUBSCRIBERS KV, which is the obvious shelf.
--
-- KV is eventually consistent. Write a code, then read it back sixty
-- seconds later from whichever colo the reader's next request lands in,
-- and the read can miss. That failure surfaces to the reader as "that
-- code is wrong" WHILE THEY ARE HOLDING A CORRECT CODE — the worst
-- possible shape, because it is unreproducible, it looks like their
-- mistake, and it teaches them the feature is broken. D1 is strictly
-- consistent and is already bound to this Worker.
--
-- WHY THE SIGNUP DETAILS LIVE HERE TOO, rather than creating the
-- subscriber up front.
--
-- Sign-up is one-per-email PERMANENTLY (handleStartTrial's hadTrial
-- check). If the account were created on submit, every abandoned
-- attempt — a mistyped address, a closed tab, an email in spam — would
-- leave a real account behind, and the reader who comes back tomorrow to
-- finish would be told they have already signed up. That is the dormant-
-- account dead end from 19 August, rebuilt on purpose.
--
-- So the details wait here instead. The row expires by itself, nothing
-- is polluted, and the details are SAFER than they would be in the
-- browser session Dan wanted to preserve them in: a closed tab loses
-- nothing.
--
-- Deliberately ONE table rather than a pending_signups table plus a
-- codes table. The two have exactly the same lifetime — both come into
-- existence when the code is requested and both die when it is used or
-- expires — and splitting them would mean two rows to keep in step for
-- no gain. `details` is NULL for a login code, which is the only
-- difference between the two purposes.

CREATE TABLE IF NOT EXISTS auth_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,        -- ISO timestamp (UTC)
  expires_at TEXT NOT NULL,        -- ISO timestamp (UTC); 10 minutes out
  email TEXT NOT NULL,             -- lowercased, trimmed
  purpose TEXT NOT NULL,           -- 'signup' | 'login'

  -- SHA-256 of email + ':' + code. Hashed so a leaked row is not a
  -- leaked code, salted with the email so one rainbow table does not
  -- cover every row in the table.
  code_hash TEXT NOT NULL,

  -- THE CODE IS BOUND TO THE BROWSER THAT ASKED FOR IT. An opaque
  -- random id, set as a short-lived cookie when the code is requested
  -- and required when it is entered.
  --
  -- This is a real improvement on the magic link rather than a copy of
  -- it: anyone holding a magic-link URL is in, wherever they are. A code
  -- that only works in the browser that started the flow is useless to
  -- someone who intercepts the email, and it blunts the standard
  -- social-engineering attack on this pattern — a caller who talks
  -- somebody into reading out a code they were emailed still cannot use
  -- it, because they are not in that browser.
  browser_id TEXT NOT NULL,

  -- FIVE GUESSES, THEN THE CODE DIES. A million values sounds like a
  -- lot until it is divided by an unlimited attempt rate: without a cap
  -- an attacker who knows a target's address gets through in an
  -- afternoon. Counted here rather than per-IP because rotating IPs is
  -- cheap and this is the count that actually matters.
  attempts INTEGER NOT NULL DEFAULT 0,

  -- Set when the code is successfully used. SINGLE USE: a consumed row
  -- is kept until it expires rather than deleted, so a replayed code is
  -- refused deliberately instead of being indistinguishable from one
  -- that never existed.
  consumed_at TEXT,

  ip TEXT,                         -- for the per-IP rate limit

  -- JSON, and only for purpose='signup': firstName, lastName, jobTitle,
  -- company, countries[]. Read once, at verification, to create the
  -- subscriber record. NULL for a login code.
  details TEXT
);

-- The two lookups this table serves: "is there a live code for this
-- address" (verification, and the per-address send limit) and "how many
-- has this IP asked for lately" (the abuse cap). Both are counted on
-- every request, so both are indexed.
CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes (email, created_at);
CREATE INDEX IF NOT EXISTS idx_auth_codes_ip ON auth_codes (ip, created_at);

-- ASSERT: SELECT count(*) FROM auth_codes = 0
-- ASSERT: SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'auth_codes' = 1
-- ASSERT: SELECT count(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_auth_codes_email' = 1
-- ASSERT: SELECT count(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_auth_codes_ip' = 1

-- ASSERT ALWAYS: SELECT count(*) FROM auth_codes WHERE purpose NOT IN ('signup','login') = 0
-- ASSERT ALWAYS: SELECT count(*) FROM auth_codes WHERE purpose = 'login' AND details IS NOT NULL = 0
--
-- The second is the one worth stating. `details` carries a would-be
-- subscriber's name, job title and company — it exists only to be read
-- once at verification and thrown away with the row. A login code has no
-- signup behind it, so a login row carrying details means something has
-- started writing personal data onto a row nobody reads it from.
