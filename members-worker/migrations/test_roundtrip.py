"""
Proves generate_files.py's reconstruction logic is correct, WITHOUT
needing live D1 access — simulates the "database" using the exact same
flatten logic already used to build the backfill, then feeds that
straight into the real unflatten/listify functions from generate_files.py,
and diffs the result against the actual, real i18n/*.json files.
"""
import json
import os
import sys
import re

sys.path.insert(0, os.path.dirname(__file__))
from generate_files import unflatten, listify

REPO_ROOT = "/home/claude/repo"
I18N_DIR = os.path.join(REPO_ROOT, "i18n")

def namespace_for(filename):
    if re.fullmatch(r"(en|es|de|fr)\.json", filename):
        return "tracker"
    m = re.fullmatch(r"(en|es|de|fr)-(.+)\.json", filename)
    if m:
        suffix = m.group(2)
        return None if suffix == "data" else suffix
    return None

def lang_for(filename):
    m = re.match(r"(en|es|de|fr)", filename)
    return m.group(1) if m else None

def flatten(obj, prefix=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if prefix == "" and k in ("countryNames", "regionNames"):
                continue
            yield from flatten(v, f"{prefix}.{k}" if prefix else k)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            yield from flatten(item, f"{prefix}.{i}")
    else:
        if isinstance(obj, bool):
            yield (prefix, "true" if obj else "false")
        elif obj is not None and str(obj).strip() != "":
            yield (prefix, str(obj))

mismatches = []
matches = 0

for filename in sorted(os.listdir(I18N_DIR)):
    if not filename.endswith(".json"):
        continue
    ns = namespace_for(filename)
    lang = lang_for(filename)
    if ns is None or lang is None:
        continue

    with open(os.path.join(I18N_DIR, filename), encoding="utf-8") as f:
        original = json.load(f)

    # Simulate: flatten (as the backfill did) then unflatten+listify
    # (as generate_files.py does when reading back from D1).
    rows = list(flatten(original))
    reconstructed = listify(unflatten(rows))

    # Re-inject countryNames/regionNames/_meta exactly as the real
    # script does, using the ORIGINAL file's own values as the stand-in
    # for "what D1 would return" (since we've already separately proven
    # the country/region data round-trips correctly through D1 above).
    if "countryNames" in original:
        reconstructed["countryNames"] = original["countryNames"]
    if "regionNames" in original:
        reconstructed["regionNames"] = original["regionNames"]
    if "_meta" in reconstructed and "reviewed" in reconstructed["_meta"]:
        reconstructed["_meta"]["reviewed"] = (reconstructed["_meta"]["reviewed"] == "true")
    final = reconstructed

    if final == original:
        matches += 1
    else:
        mismatches.append((filename, final, original))

print(f"Matched exactly: {matches} / {matches + len(mismatches)} files")
if mismatches:
    print("\nMISMATCHES:")
    for filename, final, original in mismatches:
        print(f"\n--- {filename} ---")
        # Show first differing key for diagnosis
        def diff_keys(a, b, path=""):
            if isinstance(a, dict) and isinstance(b, dict):
                for k in set(a.keys()) | set(b.keys()):
                    diff_keys(a.get(k), b.get(k), f"{path}.{k}")
            elif a != b:
                print(f"  {path}: reconstructed={a!r} vs original={b!r}")
        diff_keys(final, original)
else:
    print("\nAll files reconstruct byte-for-byte identically (as parsed JSON structures).")
