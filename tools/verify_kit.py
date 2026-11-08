"""Verify that an installed studio kit contains the production runtime and QA gates."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "render.mjs",
    "qa.mjs",
    "lint-visual.mjs",
    "qa/index.js",
    "qa/checks/static.js",
    "qa/checks/geometry.js",
    "qa/checks/rendered.js",
    "engine/characters.js",
    "engine/assets/registry.js",
    "engine/composition-templates/index.js",
    "engine/geometry/index.js",
    "engine/visual-dsl.js",
    "engine/visual-lint.js",
    "audio/validation.py",
    "audio/mix.py",
    "tools/transcribe.py",
]

missing = [rel for rel in REQUIRED if not (ROOT / rel).is_file()]
if missing:
    for rel in missing:
        print(f"MISSING   {rel}")
    print(f"Kit verification failed: {len(missing)} required file(s) are missing.")
    sys.exit(1)

checks = [
    ("render.mjs", "runQA(PROJECT, { checks: ['static', 'geometry'] })"),
    ("render.mjs", "Render blocked:"),
    ("qa/checks/static.js", "validateTranscriptTimeline"),
    ("audio/mix.py", "validate_voiceover_duration"),
    ("tools/transcribe.py", "min_match=0.9"),
]
failed = []
for rel, marker in checks:
    source = (ROOT / rel).read_text(encoding="utf-8")
    if marker not in source:
        failed.append(f"{rel} missing integration marker: {marker}")

if failed:
    for item in failed:
        print(f"MISMATCH  {item}")
    print("Kit verification failed: runtime integration checks did not pass.")
    sys.exit(1)

print(f"Verified {len(REQUIRED)} required files and {len(checks)} runtime integration checks.")
