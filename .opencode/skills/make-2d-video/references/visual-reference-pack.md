# Visual reference pack — v1.0

**Direction:** Minimal protagonist · neutral environment palette · restrained cinematic 2D/2.5D.

This file is the visual contract for every scene-generation agent. Follow it as constraints, not loose inspiration. The companion overview image is `visual-reference-overview.png` in the downloadable reference pack.

## Core art direction

Create polished, readable 2D animation with subtle 2.5D depth. Every frame needs a clear subject, intentional composition, meaningful environment detail, and lighting that supports the story. The tone is cinematic but restrained: neither flat placeholder art nor over-processed effects.

## Protagonist

- A simple, minimal humanoid with a warm off-white / ivory head and visible face.
- Deep navy hoodie or similarly simple dark clothing.
- Small expressive dark eyes and minimal brows; no unnecessary facial detail.
- Immediately recognizable at wide, medium, and close-up scales.
- Keep head/body proportions, clothing shape, eye placement, and palette consistent across all shots.
- Express emotion through eyes/brows, head angle, posture, and gesture—not redesign.
- Never use a black silhouette as the default protagonist. Never randomly change head/skin color between shots.

## Palette

Use these as starting tokens; adapt through the project's style/mood system where possible.

| Role | Suggested color |
|---|---|
| Deep background / shadow | `#111827` |
| Secondary navy | `#25324A` |
| Mid neutral blue-gray | `#64748B` |
| Warm off-white character | `#F1E8DC` |
| Highlight / soft light | `#FFF4E8` |
| Muted warm accent | `#C58B62` |
| Restrained amber practical light | `#E6AD72` |

Environments lean toward charcoal, slate, gray-blue, warm gray, and natural wood. Warm accents are selective—not a global orange filter. Keep the character's off-white surfaces detailed; do not clip them to pure white.

## Lighting

- Prefer soft key light, readable fill, and a subtle rim where separation is needed.
- Preserve detail in bright areas and keep shadows from hiding the subject.
- Glow and bloom are exceptional accents, never defaults.
- Avoid excessive god rays, lens streaks, bloom, and high-saturation grading.
- Maintain clear value contrast between protagonist and background.

## Environments

Backgrounds must establish where the action happens. Include a few story-relevant details: furniture, windows, doors, signage, tools, street elements, architecture, or objects named in the narration.

Use depth planes where useful:
1. Foreground framing elements.
2. Midground action area.
3. Background architecture / atmosphere.

Do not add random detail that competes with the subject. Do not reuse a generic gradient or empty room for unrelated scenes.

## Composition and shot language

Choose framing based on the narrative beat:
- **Wide:** establish location, scale, isolation, or a major environmental change.
- **Medium:** show interaction, gesture, or a sequence of actions.
- **Close-up:** emphasize emotion, realization, or a meaningful object.
- **Over-shoulder / POV:** show what the protagonist notices or discovers.
- **Insert:** isolate a prop, screen, hand, or detail when it carries story information.

Keep the focal subject readable. Use negative space intentionally, not as a substitute for scene design. Vary shot size and composition across a sequence.

## Motion and props

- Every camera move must support the beat: reveal, follow, emphasize, or transition.
- Prefer a few deliberate moves over constant movement.
- Reuse recurring props with stable scale, shape, color, and screen treatment.
- Use pose changes and staging to communicate action clearly.
- Use visual metaphors only when the audience can understand them immediately.

## Do

- Keep the protagonist light, readable, and consistent.
- Build environments with recognizable, relevant details.
- Separate subject and background through value contrast.
- Use restrained neutral colors with selective warm accents.
- Inspect actual rendered frames, not just scene descriptions.
- Repair only defective shots; never rewrite narration to accommodate weak visuals.

## Don't

- Use a black protagonist silhouette as the default.
- Randomly alter character proportions, clothing, or face design.
- Use empty gradients as finished environments.
- Add excessive bloom, glow, lens effects, or oversaturation.
- Fill every frame with decorative clutter.
- Reuse one composition for too many consecutive shots without a narrative reason.
- Let background contrast overpower the character.

## Scene-level quality gate

A shot is not ready if:
1. The intended subject or action is unclear at a glance.
2. The protagonist conflicts with the character reference.
3. The environment fails to establish location or narrative context.
4. The focal subject blends into the background.
5. The composition has accidental empty space or distracting clutter.
6. Lighting obscures detail or creates uncontrolled glow.
7. The shot repeats the previous composition without a narrative reason.

Before a batch is approved, inspect rendered contact sheets and representative stills. Descriptions alone do not count as visual QC.

## Agent workflow

1. Read this file and inspect the visual overview image before designing shots.
2. Reuse the established protagonist, palette, environment language, and shot vocabulary.
3. Prefer existing character, set, and prop primitives over one-off drawing code.
4. Write a compact scene specification before implementing complex visuals.
5. Render representative frames early and compare them against the reference.
6. Repair visual failures without changing script wording, story structure, or voiceover timing.

## Scope

This pack changes the visual target only. It does not change script writing, narration, story structure, or voiceover timing. It does not require image generation for every frame. The deterministic renderer remains responsible for character animation, camera movement, typography, and repeatable effects.
