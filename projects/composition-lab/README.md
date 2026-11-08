# Visual Composition Lab

A silent, 33-second visual test for the composition system. It uses the canonical off-white protagonist, three distinct environments, four recurring props, nine JSON DSL shots, and two advanced JavaScript shots.

## Render

Run from the repository root (the folder containing `render.mjs`):

```bash
node render.mjs --project projects/composition-lab --sheet --scale 0.5
```

Open every image in `projects/composition-lab/build/sheets/`.

The render first prints a `[visual lint]` report (character size, cropping, story-object size, hand-to-prop contact). Errors abort rendering automatically; warnings are non-blocking. This project is lint-clean; to check it on its own run `node lint-visual.mjs projects/composition-lab`.

Then inspect motion:

```bash
node render.mjs --project projects/composition-lab --from 0 --to 24 --scale 0.5
```

The test has no voiceover or audio dependency. It is intentionally a silent visual project.

Run the focused contact-lint regression tests with Node's built-in test runner:

```bash
node --test tests/visual-contact-lint.test.js
```

## Coverage

| Shot | Environment | Composition | Implementation |
|---|---|---|---|
| s001 | Bedroom | Establishing wide | JSON DSL |
| s002 | Bedroom | Medium single | JSON DSL |
| s003 | Street | Establishing wide | JSON DSL |
| s004 | Street | Character–object interaction (ball) | JSON DSL |
| s005 | Office | Establishing wide | JSON DSL |
| s006 | Office | Character–object interaction (cup) | JSON DSL |
| s007 | Bedroom | Giant face close-up | JavaScript |
| s008 | Street | Over-the-shoulder | JavaScript |
| s009 | Neutral | Semantic held-object relationship | DSL v2 JSON |
| s010 | Neutral | Semantic object-on-surface relationship | DSL v2 JSON |
| s011 | Neutral | Semantic two-character composition | DSL v2 JSON |

Reusable environment and prop drawings live in `scenes/sets/visual-assets.js`: bedroom, street, office, door, ball, cup, and phone. DSL shots can attach supported props to rig hand anchors with `hero.prop` (including animated anchor offsets), use a semantic `cup` layer for a recognizable cup silhouette, and declare a time-bounded hand contact window:

```json
{
  "contact": {
    "hand": "F",
    "from": 1.2,
    "to": 3,
    "target": 4
  }
}
```

`from` and `to` are shot-local seconds. `target` is an optional zero-based layer index and must point to a `story_object`; without it, lint checks the nearest story object at each sample. The linter samples the full window (including its boundaries) and fails if contact breaks at any sample. Time-window lint currently supports the near hand (`F`); far-hand contact needs a registered far-hand anchor before it can be checked. Animated attached-prop offsets also require a contact window and are checked throughout it; static attached props are checked throughout the shot. A contact marker without a window is not sufficient to prove an interaction.

The DSL still does not import arbitrary project-level drawing functions; advanced custom assets remain in JavaScript.

## Review criteria

Review the sheet at both full size and at a phone-sized preview:

1. The off-white head and navy clothing remain consistent in all shots.
2. Each location is recognizable from its silhouette and light/value structure.
3. The protagonist is large enough to read in establishing and medium shots.
4. The ball/cup and the reaching hand form a clear, visible interaction.
5. The close-up reads as an emotional beat, not just a zoomed-out full-body figure.
6. The OTS foreground frames the target without obscuring the action.
7. Adjacent shots have distinct framing while preserving screen direction and identity.

Do not migrate a full-length video until these shots pass visual review. Record specific shot IDs and defects before changing the DSL or adding renderer features.


## Semantic composition (DSL v2)

The lab includes an initial semantic example at `compositions/semantic-drinking.json`. It uses the frame-relative world coordinate system and `held_by`, `inside_frame`, and `behind` relationships. V2 JSON shots are registered through the existing `registerVisualShot()` entry point; relationships are resolved at each shot-local time. Project lint routes v2 files through `lintComposition()` while preserving v1 lint and sequence checks.

Run both geometry and contact regressions:

```bash
node --test tests/geometry-composition.test.js tests/visual-contact-lint.test.js
node lint-visual.mjs projects/composition-lab
```

Shots s009–s011 are now part of the timed lab sequence. They exercise `held_by`, `on_surface`, `left_of`, `behind`, and `inside_frame` through the real visual-shot registration path. They are integration fixtures, not visual sign-off: inspect their contact-sheet frames and motion before accepting Phase 2.


## Composition templates (Phase 3)

DSL v2 shots can opt into a reusable template through a `composition` block. The template supplies framing/camera defaults and optional semantic relationships; explicit shot values and allowed overrides take precedence. Entity placement is still resolved only by `engine/geometry`.

```json
{
  "composition": {
    "template": "two-shot",
    "intent": { "purpose": "conversation", "focus": "heroA" },
    "roles": { "primary": "heroA", "secondary": ["heroB"] },
    "overrides": { "camera": { "zoom": 1.08 } }
  }
}
```

Built-ins: `establishing-wide`, `medium-single`, `close-up`, `two-shot`, `over-the-shoulder`, `object-interaction`, `insert`, `reaction`, and `tracking`. Role bindings use entity IDs; `primary` is a single ID, while other roles are arrays. Templates are opt-in, so existing v1 and v2 shots without a `composition` block keep their previous behavior.

The over-the-shoulder preset establishes foreground draw order and conversational framing, but does not synthesize a silhouette mask or automatic foreground crop. Tracking follows the primary entity's animated position at each sampled shot time. The renderer continues to call the canonical geometry solver after template expansion.

Run template contract and resolution tests:

```bash
node --test tests/composition-templates.test.js tests/composition-template-resolution.test.js
```
