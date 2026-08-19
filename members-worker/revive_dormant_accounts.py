#!/usr/bin/env python3
"""revive_dormant_accounts.py — find subscriber records that can no longer
get back in, and convert them to free accounts with no expiry.

    cd members-worker
    python3 revive_dormant_accounts.py                 # dry run, changes nothing
    python3 revive_dormant_accounts.py --apply         # writes to production KV

WHAT THIS IS FOR
================
Until 19 August 2026 a subscriber record with `hadTrial` set but no longer
active was locked out permanently, with no error shown anywhere:

    subscribe -> hadTrial is set      -> "you already signed up",
                                         with a button to the login
    login     -> not currently active -> "check your email",
                                         and no email is sent
    back to subscribe, forever.

Each half is correct alone. Sign-up is one-per-email permanently, and the
login deliberately behaves identically for known and unknown addresses so
it cannot be used to discover who has an account. Together they trap
anyone whose record exists but has gone inactive — most obviously the
accounts created before 2 August 2026, when sign-ups were trials carrying
an expiresAt that isCurrentlyActive() now reads as expired.

handleStartTrial now revives a dormant account instead of refusing it, so
the trap is closed for anyone who tries again. THIS SCRIPT IS FOR THE
PEOPLE WHO WON'T. They hit a wall that looked like success, months ago,
and have no reason to come back and re-test it. Fixing the code without
sweeping the data fixes the shape and leaves the casualties.

WHAT COUNTS AS DORMANT
======================
Exactly what isCurrentlyActive() refuses, mirrored here rather than
guessed at (members-worker/src/index.js):

    if (!sub || !sub.active) return false;
    if ((sub.plan === "onetime" || sub.plan === "trial")
        && sub.expiresAt && Date.now() > sub.expiresAt) return false;
    return true;

...restricted to records with `hadTrial` set, because a record without it
is not locked out — it can simply sign up.

DELIBERATELY NOT TOUCHED
========================
Accounts deactivated by the Lemon Squeezy webhook are indistinguishable
here from expired trials, and reviving a cancelled paying customer as a
free member is a business decision rather than a repair. Any record
carrying a Lemon Squeezy field is listed and skipped; decide those by
hand. Nothing else about a record is changed — countries, name, company,
signup IP and hadTrial all survive, and hadTrial stays TRUE so this is
not a second sign-up.

DRY RUN BY DEFAULT, and it prints every record it would change with the
before and after. A script that mutates production accounts on its first
invocation is one nobody should run.
"""
import argparse
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
BINDING = "SUBSCRIBERS"
# Fields whose presence means a payment provider has had an opinion about
# this account. Drawn from the webhook handler rather than invented.
LEMON_FIELDS = ("lemonSqueezyId", "lemonsqueezyId", "subscriptionId", "orderId", "variantId")


def wrangler(args):
    """Mirrors apply_migrations.py: prefer a repo-local wrangler, fall back
    to npx. Kept as its own copy rather than imported, because that file is
    a migration runner and this is not a migration."""
    local = os.path.join(HERE, "node_modules", ".bin", "wrangler")
    if not os.path.exists(local):
        local = os.path.join(os.path.dirname(HERE), "node_modules", ".bin", "wrangler")
    cmd = ([local] if os.path.exists(local) else ["npx", "wrangler"]) + args
    result = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"wrangler failed: {' '.join(cmd)}")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)
    return result.stdout


def list_keys():
    out = wrangler(["kv", "key", "list", f"--binding={BINDING}", "--remote"])
    try:
        return [k["name"] for k in json.loads(out)]
    except (json.JSONDecodeError, KeyError, TypeError):
        print("could not parse the key list — wrangler's output format may have moved:")
        print(out[:400])
        sys.exit(1)


def get(key):
    out = wrangler(["kv", "key", "get", key, f"--binding={BINDING}", "--remote"])
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return None


def put(key, value):
    wrangler(["kv", "key", "put", key, json.dumps(value),
              f"--binding={BINDING}", "--remote"])


def is_dormant(sub, now_ms):
    """True when isCurrentlyActive() would refuse this record AND the
    record blocks a fresh sign-up. Both halves are required: without
    hadTrial the person is not trapped, they can just sign up."""
    if not sub or not sub.get("hadTrial"):
        return False
    if not sub.get("active"):
        return True
    if sub.get("plan") in ("onetime", "trial") and sub.get("expiresAt") \
            and now_ms > sub["expiresAt"]:
        return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="actually write. Without it, nothing is changed.")
    args = ap.parse_args()

    now_ms = int(time.time() * 1000)
    keys = list_keys()
    print(f"{len(keys)} record(s) in {BINDING}\n")

    dormant, skipped, unreadable = [], [], []
    for key in keys:
        sub = get(key)
        if sub is None:
            unreadable.append(key)
            continue
        if not is_dormant(sub, now_ms):
            continue
        if any(sub.get(f) for f in LEMON_FIELDS):
            skipped.append((key, sub))
            continue
        dormant.append((key, sub))

    if unreadable:
        print(f"{len(unreadable)} record(s) could not be parsed as JSON and were "
              f"left alone: {', '.join(unreadable[:5])}\n")

    if skipped:
        print(f"{len(skipped)} record(s) carry payment-provider fields and are NOT "
              "touched — a cancelled paying customer is a business decision, not a "
              "repair. Decide these by hand:")
        for key, sub in skipped:
            print(f"    {key}   plan={sub.get('plan')} active={sub.get('active')}")
        print()

    if not dormant:
        print("No dormant accounts. Nothing to do.")
        return

    print(f"{len(dormant)} dormant account(s) — locked out of both the login and "
          "the sign-up form:\n")
    for key, sub in dormant:
        exp = sub.get("expiresAt")
        when = time.strftime("%Y-%m-%d", time.gmtime(exp / 1000)) if exp else "—"
        print(f"    {key}")
        print(f"        before: active={sub.get('active')} plan={sub.get('plan')} "
              f"expiresAt={when}")
        print(f"        after:  active=True plan=free expiresAt=(removed)")

    if not args.apply:
        print("\nDry run — nothing was written. Re-run with --apply to make these "
              "changes.")
        return

    print()
    for key, sub in dormant:
        updated = dict(sub)
        updated["active"] = True
        updated["plan"] = "free"
        # Removed rather than nulled: isCurrentlyActive() expires an account
        # only when it has BOTH a onetime/trial plan and an expiresAt, so a
        # leftover date would sit on the record for a future reader to
        # misread. hadTrial is deliberately left TRUE — this is a repair,
        # not a second sign-up.
        updated.pop("expiresAt", None)
        updated["revivedAt"] = now_ms
        put(key, updated)
        print(f"  revived {key}")
    print(f"\n{len(dormant)} account(s) revived. They can now request a login link "
          "from /members as normal.")


if __name__ == "__main__":
    main()
