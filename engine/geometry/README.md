# Geometry engine (DSL v2)

This module is the canonical, deterministic geometry layer for semantic compositions. It is intentionally independent of Canvas and output resolution.

## Coordinate contract

- World origin: frame center.
- +X: right; +Y: down.
- Frame height: 100 world units.
- Frame width: `100 * width / height` units (177.78 at 16:9; 56.25 at 9:16).
- Renderer pixels are derived only at the boundary with `worldToScreen` / `screenToWorld`.
- Character local geometry is read from `POSES` in `engine/rig2d.js`; rig pixels are converted at 10.8 px per world unit using the 1080-high reference rig. The renderer scales the rig by `frame.height / 1080`, so the same semantic character scale preserves its frame-relative size in portrait and landscape output.

## Entity contract

Each entity has a stable `id`, a supported `type`, an optional `transform`, and type-specific `geometry`. Positions locate the entity's local origin; rectangle-like props and surfaces are center-origin. Character origin remains the rig's feet/origin. Scale and rotation are applied before translating anchors and bounds.

Character anchors include `head`, `head.center`, `shoulder`, `hip`, `hand.near`, `hand.far`, `elbow.near`, `elbow.far`, `foot.near`, and `foot.far`. Cup anchors include `grip`, `rim`, `bottom`, and `center`. Surfaces expose `top`, `topLeft`, and `topRight`.

## Relationship contract

Supported types: `left_of`, `right_of`, `above`, `below`, `held_by`, `touching`, `on_surface`, `behind`, `in_front_of`, and `inside_frame`.

Constraints are applied deterministically by ascending `priority`; higher-priority constraints therefore take precedence when they are applied later. A locked subject that would need to move emits `locked-position-conflict`. After solving, every relationship is checked again; conflicting constraints emit `constraint-unsatisfied`. Cycles are diagnosed and solving is skipped for that composition rather than returning an unstable result. Missing anchors and targets produce actionable diagnostics. `inside_frame` uses the camera's time-dependent viewport, including zoom and pan.

Animation is evaluated at the requested shot-local time before relationships are resolved. Attachments are therefore re-solved at every frame time and do not depend on cached offsets.

## API

- `validateComposition(spec)`
- `resolveComposition(spec, time, { width, height })`
- `evaluateComposition` (alias of `resolveComposition`)
- `lintComposition(spec, { frame, time, captionSafe, captionTop })`
- `getEntityGeometry(entity)`
- `worldToScreen(point, frame)`, `screenToWorld(point, frame)`

The geometry engine is usable from Node tests without a browser or renderer.

## Tests

```bash
node --test tests/geometry-composition.test.js
```

## Known scope limits

- Character bounds are conservative pose-point bounds with padding, not pixel-perfect silhouette bounds.
- Cup geometry is a simple semantic proxy for the current DSL cup drawing; its grip point is an approximation of the right-side handle.
- Occlusion is represented by explicit depth (`z`) and render order; this is not a pixel-level visibility solver.
- Bounds are conservative AABBs. Overlap warnings can be intentional; explicit `behind` / `in_front_of` relationships document expected depth overlap.
- Contact is anchor coincidence, not a physical simulation or continuous collision guarantee.
- The solver handles direct deterministic relationships, not general nonlinear optimization.
- Character geometry currently uses the static named rig pose; animated walking/breathing pose sampling will need an explicit pose provider before being treated as exact.
