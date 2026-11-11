# Phase 6 — Production Integration Record

## Target

- Project: `projects/what-if-you-had-1000-iq`
- Branch: `feat/visual-composition-system`
- Timeline: 136 shots, 328.66 seconds
- Existing implementation: 16 JavaScript shot modules
- Existing visual JSON shots: none at the time of this integration

## Decision

Keep all 136 published-production shots on their existing JavaScript implementations in this pass.

This is a deliberate compatibility decision, not an unfinished bulk conversion. The production scenes depend on custom Canvas drawing, set renderers, bespoke graphics, procedural motion, lighting, transitions, and story-specific effects. DSL v2 currently models semantic characters, figures, simple props/surfaces, camera motion, relationships, reusable assets, lighting, and composition templates. It does not provide full parity for the production's custom text/graphic rendering and bespoke effects.

Examples of poor automatic-conversion candidates:

- `s020`: character plus chapter title, custom void environment, UI title treatment, and rim lighting.
- `s043`: city establishing scene, moving traffic, chapter typography, and graphic accents.
- `s058–s059`: procedural signal-flow diagram, labels, readouts, and speed-line effects.
- `s129–s136`: phone-screen lighting, message typography, cast line-up, and end-card/subscribe animation.
- `s097–s114`: custom fire/rescue sequence and effects.

Converting these scenes to the current DSL would remove visual behavior or require extending the DSL itself. That would create avoidable risk to the already-published video.

## What was integrated

The runtime now uses a shared hybrid scene loader:

1. Import JavaScript scene modules first.
2. Fetch and register JSON visual scenes second.
3. Preserve JavaScript registrations if a JSON file fails to fetch or validate.
4. Allow a valid DSL definition to intentionally override a JavaScript shot with the same ID.
5. Report individual load/registration failures without aborting unrelated scene registrations.

The loader is mirrored in both the repository runtime and the skill kit runtime.

## Validation added

- Loader ordering and DSL-over-JavaScript precedence.
- Failure isolation and legacy fallback behavior.
- Full 136-shot implementation coverage for the actual 1000 IQ project.
- A mixed JavaScript + DSL v2 fixture checked through static and geometry QA.
- The production scheduler already has a test for DSL-over-JavaScript precedence and reports duplicates within the same implementation format.

## Phase 6 status

| Stage | Result |
|---|---|
| 6A — Compatibility audit | Complete |
| 6B — Hybrid integration test | Implemented in automated tests |
| 6C — Production shot selection | Complete; no safe production conversion selected |
| 6D — Controlled integration | Hybrid loader and isolated mixed-format fixture integrated; production artwork unchanged |
| 6E — Full production validation | Automated validation added; full rendered-frame and audio comparison still requires the local rendering environment |

## Local validation commands

From the repository root:

```bash
npm ci
npm test
python -m unittest discover -s tests -p "test_*.py"
python -m unittest discover -s .claude/skills/make-2d-video/kit/tests -p "test_production.py"
node render.mjs --project projects/what-if-you-had-1000-iq --qa-rendered --scale 0.5 --workers 8
node render.mjs --project projects/what-if-you-had-1000-iq --sheet --scale 0.5
```

The rendered QA and contact sheet are the final visual gate. Compare them with the existing published render before considering any production shot eligible for DSL migration. Do not overwrite the published output or the source voiceover/audio mix during this validation.
