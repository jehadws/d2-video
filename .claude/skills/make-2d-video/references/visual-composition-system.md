# Visual composition system

Status: v1 authoring specification  
Scope: improve shot readability and visual storytelling without expanding the renderer or changing the narration pipeline.

## Goal

Make each shot communicate one clear visual idea at phone size. The scene author should choose a composition intentionally before writing DSL layers. The renderer remains responsible only for drawing and animation.

The first pass is a **shot-planning vocabulary**, not a new scene runtime. Keep DSL v1 small. Do not add schema fields or renderer features merely to encode these templates.

## Composition contract

Every shot plan must identify:

- **Subject:** the one thing the viewer should notice first.
- **Action / state:** what the subject is doing, or what changed.
- **Supporting element:** the prop, second character, light source, or graphic needed to understand it.
- **Framing:** one template from the catalog below.
- **Screen-space priority:** approximate subject size and placement, expressed as percentages of frame width/height.
- **Continuity:** facing direction, screen position, outfit, prop ownership, and light direction carried over from adjacent shots.
- **Motion:** one motivated camera move and one meaningful subject/prop movement; avoid motion added only to satisfy a checklist.

Use percentages in planning. Convert to logical coordinates only when authoring the DSL, using the measured numbers in *Scale and framing rules* below. Keep important content inside the central 80% of the frame, and leave the lower caption-safe area clear when captions are enabled.

## Shot template catalog

### 1. Establishing wide

**Purpose:** establish location, geography, time of day, and where the characters are.

- One dominant environmental landmark or light source.
- Main character occupies about 45–60% of frame height (hero scale about 2.0–2.7 at zoom 1.0). Never below 42%: smaller than that reads as a speck at phone size.
- Place the character near a third, not automatically at dead center.
- Include a foreground or midground cue only when it adds depth or scale.
- Use a slow push or lateral drift.
- Do not use this framing for an important facial reaction or a small object action.

### 2. Medium single

**Purpose:** show one character acting or reacting while retaining enough environment to orient the viewer.

- Character occupies about 65–80% of frame height (hero scale about 2.9–3.6 at zoom 1.0). Never below 60%.
- Keep the head and hands/action area unobstructed.
- Reserve negative space in the direction of gaze or movement.
- Use a gentle push-in for realization, or a small lateral drift for observation.

### 3. Medium two-shot

**Purpose:** make a relationship or exchange immediately understandable.

- Both characters must be large enough to read; avoid shrinking both to fit the environment. Each is at least 50% of frame height (scale about 2.3 or more at zoom 1.0).
- Keep a clear gap between silhouettes unless contact is the point of the shot.
- Establish left/right screen positions and preserve them through the exchange.
- Their gaze and body orientation must connect.
- If the action depends on a prop, place it visibly between the characters.

### 4. Over-the-shoulder

**Purpose:** connect the viewer to one character's point of view and direct attention to another character or object.

- Foreground shoulder/head is a framing device, not a second competing subject.
- Target subject is sharp and visually dominant.
- Use a foreground blur only when the JS renderer path supports it; DSL v1 has no blur layer, so do not fake blur with a flat opaque shape.
- Prefer JS for a true depth-layered OTS shot.

### 5. Close-up / reaction

**Purpose:** communicate emotion or a decision.

- Face is the primary subject and should occupy a large part of the frame.
- Background is simplified and lower contrast.
- Expression must match the exact story beat.
- DSL v1's `hero` layer is full-body rig drawing, not the dedicated giant-face renderer. Use the existing JS `drawHeroFace` / `bigFace` path for true close-ups.

### 6. Insert / macro

**Purpose:** show the small object or detail that carries the story information.

- The object should be large enough to identify instantly: at least 25% of frame height.
- Remove unrelated characters and decoration.
- Keep the action area near the center of attention.
- Use DSL shapes for simple symbolic objects; use JS when the shot needs hands, fingers, detailed props, or physically convincing contact.

### 7. Character–object interaction

**Purpose:** make cause and effect visually undeniable.

- Show the actor, the object, and the point of interaction together whenever possible.
- The actor's hand/arm must visibly reach the object; do not rely on narration to explain an invisible connection.
- The object must be large enough to track across the action: its longest side is at least 10% of frame height (about 110 px in the 1080p logical frame), and the actor is 60–85% of frame height.
- Preserve object position and direction across consecutive shots.
- Use DSL for simple hand-attached props (`hero.prop`) and contact poses (`reachBall`, `reachDown`) when a single rig hand can express the action. Use JS for detailed finger articulation, multi-hand grips, complex prop attachment, or contact animation that requires independent hand/prop motion.

### 8. Dramatic reveal

**Purpose:** reveal a new ability, consequence, scale, or piece of information.

- Control what is visible before the reveal; do not show the answer too early.
- Give the revealed subject the strongest contrast or scale.
- Use a motivated pull-out, push-in, or light change.
- Avoid stacking multiple title cards, glows, and graphic accents on the same beat.

## Scale and framing rules (measured, enforced by lint)

These numbers come from rendering the real rig, not from estimates. In the 1080p logical frame, **one hero scale unit is about 242 px tall (22.4% of frame height)** for the stand, reach and phone poses. On-screen height is `242 × scale × camera.zoom`.

| Framing | Character height (% of frame) | Hero `scale` at zoom 1.0 | Lint |
|---|---|---|---|
| `wide` (establishing) | 42–65, aim 45–60 | 1.9–2.9, aim 2.0–2.7 | below min = error |
| `medium` (single) | 60–85, aim 65–80 | 2.7–3.8, aim 2.9–3.6 | below min = error |
| `two_shot` (each character) | 50–75 | 2.2–3.4 | below min = error |
| `interaction` (actor) | 60–85 | 2.7–3.8 | below min = error |
| `insert` | object is the subject | n/a | object rule below |
| `reveal` | 30–100 | follows the reveal | below min = error |

Going above the maximum is a warning. If a shot cannot be made to read at these sizes, change the framing (cut to a close-up or insert) instead of shrinking the character.

**Keep the whole figure in the visible frame.** Camera zoom is applied about the frame centre, so zooming in pushes the feet down and off screen. The default 16:9 letterbox bars take 60 px at the top and bottom, so the usable height is 60–1020. A character's feet must stay at or above about y = 1010 and the top of the head at or below y = 60 on screen. Screen position of a point is `(y − 540 − camera.y) × zoom + 540`. To land the feet at screen y = 990, give every zoom keyframe a matching `camera.y` keyframe:

```
camera.y = hero.y − 540 − 450 / zoom
```

Example: hero at y = 1000 with zoom 1.06 → 1.13 needs `camera.y` 35 → 62 on the same `at` times and the same `ease`. Only a deliberate crop (a foreground over-the-shoulder figure) may leave the frame, and it must carry `"crop": true` on that layer.

**Make the story object unmistakable.** The ball, phone or cup that the beat is about must have its longest side at least 10% of frame height (a circle's radius is at least 55 px at zoom 1.0). A dot of 10–20 px is decoration, not a story object. Tag it with `"role": "story_object"`.

**Rescaling a hero moves everything attached to it.** When you change a hero's `scale`, move and resize the props in its hand and the hand highlight too: `p' = hero + (p − hero) × (newScale / oldScale)`, applied to every keyframe of an animated prop. Otherwise the hand and object stop touching. A `reach` pose needs a story object within about 0.8 hero-heights of the chest.

**Work in this order for every DSL shot:** pick the framing → set the scale from the table → set the zoom → compute `camera.y` for the feet → place and size the story object → tag `framing` and `role` → run the lint → render the sheet.

### Metadata the DSL accepts (ignored by the renderer)

| Key | Where | Values |
|---|---|---|
| `framing` | top level of the shot | `wide`, `medium`, `two_shot`, `interaction`, `insert`, `reveal` |
| `role` | any layer | `story_object` |
| `crop` | `hero` / `figure` layer | `true` for an intentional off-frame crop |

These are authoring metadata for the lint, not renderer features. Always set `framing` on every DSL shot.

### Lint

`node lint-visual.mjs projects/<name>` checks every `scenes/visual/*.json`. `render.mjs` runs the same check before each render and prints the findings; add `--strict-lint` to make errors abort the render. Thresholds live in one table, `engine/visual-lint.js`. Fix every error before opening the contact sheet; treat warnings as review prompts.

| Code | Level | Meaning |
|---|---|---|
| `character-too-small` | error | Character below the minimum for its framing |
| `character-too-large` | warn | Character above the maximum for its framing |
| `feet-cropped`, `head-cropped` | error | Figure leaves the visible frame at some point in the shot |
| `off-centre` | warn | Character leaves the central 80% of the width |
| `story-object-small` | error | A `story_object` is under 10% of frame height |
| `reach-no-target`, `reach-too-far` | warn | A reaching hero has no story object within range |
| `interaction-no-object` | warn | Interaction framing with no `story_object` tagged |
| `no-camera-motion` | warn | The camera never moves |
| `framing-missing`, `framing-unknown` | warn | `framing` unset or not recognised |
| `framing-repeat` | warn | More than 3 consecutive shots with the same framing |

The lint cannot judge whether a shot is good. It only removes the failures that a measurement can catch, so the contact-sheet review can spend its time on story and design.

## DSL vs. JavaScript decision

Use JSON DSL v1 when the shot is a standard 2D composition built from its existing `hero`, `figure`, `rect`, `circle`, `line`, and `text` layers plus camera/element tracks.

Keep the existing JavaScript scene path for:

- giant face close-ups;
- real depth, parallax, or blurred foreground layers;
- custom sets that need reusable drawing functions;
- hands, detailed props, or precise actor–prop contact;
- 3D scenes and any action that cannot be represented clearly by DSL v1.

Do not weaken a shot to force it into JSON. A clear JS shot is better than an unclear DSL shot.

## Composition review checklist

Review the rendered frame, not only the JSON:

0. Does `node lint-visual.mjs` report no errors?
1. Can the viewer identify the subject within one second?
2. Is the important character/object large enough at phone size? (Character at least 42% of frame height in a wide, 60% in a medium; story object at least 10%.)
3. Is the action or relationship clear without reading the narration?
4. Is the focal point distinct from the background?
5. Is there a visible cause-and-effect connection for interactions?
6. Does the framing differ meaningfully from the previous shot?
7. Are screen direction, outfit, prop ownership, and lighting consistent?
8. Is every decorative element helping the story? Remove anything that competes with the subject.

Reject or revise a shot if the main action is ambiguous, even if the render is technically valid.

## First validation milestone

Before applying this to a full video, build a small visual test with:

- one canonical off-white protagonist;
- three locations with distinct silhouettes and light sources (for example: bedroom, street, and office);
- a small reusable prop set (phone, cup, ball, door);
- at least one example of each DSL-suitable composition;
- JS examples for the close-up, OTS, and detailed character–object interaction cases.

Render a contact sheet and inspect it at both full size and phone size. The milestone passes only when the subject, action, and spatial relationship are immediately readable. Do not migrate a full 5–8 minute project as part of this test.
