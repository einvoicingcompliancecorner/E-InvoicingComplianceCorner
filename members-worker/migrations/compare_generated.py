"""
Compares generated i18n files against the real ones by PARSED JSON
EQUALITY, not raw text/byte diff. A raw diff would flag files as
"different" over harmless things like key ordering (SQL doesn't
guarantee row order) or whitespace — neither of which matters to
i18n.js, which only does key-based lookups. This is the test that
actually matters: is the translated CONTENT identical?

Usage (from members-worker/):
    python3 migrations/compare_generated.py
"""
import json
import os

REAL_DIR = "../i18n"
GENERATED_DIR = "i18n-generated"

EXCLUDED = {"de-data.json", "es-data.json", "fr-data.json", "i18n.js"}

real_files = {f for f in os.listdir(REAL_DIR) if f.endswith(".json") and f not in EXCLUDED}
generated_files = {f for f in os.listdir(GENERATED_DIR) if f.endswith(".json")}

only_in_real = real_files - generated_files
only_in_generated = generated_files - real_files
common = real_files & generated_files

print(f"Real files (excluding known-excluded): {len(real_files)}")
print(f"Generated files: {len(generated_files)}")
if only_in_real:
    print(f"\nMissing from generated output: {sorted(only_in_real)}")
if only_in_generated:
    print(f"\nUnexpected extra files in generated output: {sorted(only_in_generated)}")

semantic_matches = 0
semantic_mismatches = []

for filename in sorted(common):
    with open(os.path.join(REAL_DIR, filename), encoding="utf-8") as f:
        real = json.load(f)
    with open(os.path.join(GENERATED_DIR, filename), encoding="utf-8") as f:
        generated = json.load(f)
    if real == generated:
        semantic_matches += 1
    else:
        semantic_mismatches.append((filename, real, generated))

print(f"\nSemantic (parsed JSON) matches: {semantic_matches} / {len(common)}")

if semantic_mismatches:
    print("\nGENUINE MISMATCHES:")
    for filename, real, generated in semantic_mismatches:
        print(f"\n--- {filename} ---")
        def diff_keys(a, b, path=""):
            if isinstance(a, dict) and isinstance(b, dict):
                for k in set(a.keys()) | set(b.keys()):
                    diff_keys(a.get(k), b.get(k), f"{path}.{k}")
            elif isinstance(a, list) and isinstance(b, list):
                for i in range(max(len(a), len(b))):
                    av = a[i] if i < len(a) else "<missing>"
                    bv = b[i] if i < len(b) else "<missing>"
                    diff_keys(av, bv, f"{path}[{i}]")
            elif a != b:
                print(f"  {path}: real={a!r} vs generated={b!r}")
        diff_keys(real, generated)
else:
    print("\nAll common files are semantically identical — the translated content matches exactly.")
