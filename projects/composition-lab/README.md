# Visual Composition Lab

A silent, 24-second visual test for the composition system. It uses the canonical off-white protagonist, three distinct environments, four recurring props, six JSON DSL shots, and two advanced JavaScript shots.

## Render

Run from the repository root (the folder containing `render.mjs`):

```bash
node render.mjs --project projects/composition-lab --sheet --scale 0.5
```

Open every image in `projects/composition-lab/build/sheets/`.

Then inspect motion:

```bash
node render.mjs --project projects/composition-lab --from 0 --to 24 --scale 0.5
```

The test has no voiceover or audio dependency. It is intentionally a silent visual project.

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

Reusable environment and prop drawings live in `scenes/sets/visual-assets.js`: bedroom, street, office, door, ball, cup, and phone. DSL shots use equivalent native primitives because DSL v1 does not yet support importing shared asset functions.

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
