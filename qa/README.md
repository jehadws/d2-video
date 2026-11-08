# Automated Visual QA — Phase 5A

Run from the repository root:

    node qa.mjs --project projects/composition-lab

Phase 5A currently runs:

- Static project and visual-lint checks.
- Missing shot implementation checks (visual JSON or scene JS module).
- Existing asset, template, DSL and geometry validation.
- Timeline-aware geometry sampling for animated DSL v2 scenes.

Useful options:

    node qa.mjs --project projects/composition-lab --static
    node qa.mjs --project projects/composition-lab --geometry
    node qa.mjs --project projects/composition-lab --fail-on warning

The command writes build/qa/report.json and build/qa/report.txt.
--fail-on accepts error (default), warning, or info.

Rendered-pixel inspection, temporal image comparisons, cross-shot visual identity,
contact-sheet generation, and AI-assisted inspection are intentionally not part
of Phase 5A. Their CLI switches are not accepted until those detectors exist.

## Finding contract

Each finding has a stable ID, optional scene/entity/timestamp references, a
normalized severity (error, warning, info), category, detector code, message,
optional suggested correction/evidence, and detector identifier.

Overall report status is failed when errors exist, warning when only warnings
exist, and passed when neither exists.
