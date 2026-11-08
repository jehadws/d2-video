# Automated Visual QA — Phase 5

Run from the repository root:

    node qa.mjs --project projects/composition-lab

The default command runs the static and timeline-aware geometry checks. Add `--production` to enforce the final 5–8 minute delivery contract, voiceover presence, word-level transcript presence, and concrete shot descriptions.

## Rendered-frame inspection

Run the complete Phase 5 suite, including rendered-frame inspection:

    node qa.mjs --project projects/composition-lab --rendered

The rendered check uses the real headless Chromium player and renderer. It samples
five timestamps per implemented story shot (the first visible frame, 20%, 50%, 80%, and the last visible frame before the cut). This includes boundary-adjacent evidence for transition review, and captures
PNG evidence frames, and builds contact sheets under:

    projects/<project>/build/qa/frames/

It also writes:

- `build/qa/rendered.json` — per-frame metrics and rendered findings.
- `build/qa/report.json` — unified static, geometry, and rendered report.
- `build/qa/report.txt` — human-readable summary.

The report includes the number of frames checked and relative evidence paths.
The rendered detector currently checks for:

- Missing shot registrations in the actual player.
- Scene draw exceptions captured by the player.
- Nearly uniform near-black frames, reported as warnings for human review.
- Sample-level luminance, luminance variance, dark-pixel ratio, and color-bucket metrics.

The near-black detector is deliberately conservative. A dark frame can be an
intentional creative choice, so it is a warning rather than an automatic error.
Inspect the linked evidence/contact sheets before changing a scene.

## Options

    node qa.mjs --project projects/my-video --production
    node qa.mjs --project projects/composition-lab --static
    node qa.mjs --project projects/composition-lab --geometry
    node qa.mjs --project projects/composition-lab --rendered --scale 0.5
    node qa.mjs --project projects/composition-lab --rendered --style cinematic
    node qa.mjs --project projects/composition-lab --rendered --fail-on warning

- `--production` requires a 300–480 second project with a configured voiceover, non-empty word timeline, and concrete descriptions for every shot. It warns when shot density falls outside 15–25 shots/minute.
- `--fail-on` accepts `error` (default), `warning`, or `info`.
- `--scale` controls the rendered QA capture scale; defaults to `0.5`.
- `--style` selects an existing renderer style for the capture.
- The renderer requires the project's normal Playwright/Chromium and FFmpeg environment.

## Coverage and limitations

Phase 5 covers static project/DSL validation, asset/template checks, animated
geometry sampling, player registration/runtime exceptions, and sampled pixel
sanity checks. The contact sheets are intended for visual review and evidence.

This is not semantic computer vision: it does not claim to recognize whether a
specific character, prop, expression, or story beat is visually correct. It also
does not perform full-frame temporal optical-flow analysis or AI-assisted review.
Those require a separate model/vision integration and explicit project-specific
expectations; the current system must not label an image as defective merely
because a generic detector cannot recognize its subject.

## Finding contract

Each finding has a stable ID, optional scene/entity/timestamp references, a
normalized severity (error, warning, info), category, detector code, message,
optional suggested correction/evidence, and detector identifier.

Overall report status is failed when errors exist, warning when only warnings
exist, and passed when neither exists.
