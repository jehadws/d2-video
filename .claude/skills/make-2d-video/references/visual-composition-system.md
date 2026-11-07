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

Use percentages in planning. Convert to logical coordinates only when authoring the DSL. Keep important content inside the central 80% of the frame, and leave the lower caption-safe area clear when captions are enabled.

## Shot template catalog

### 1. Establishing wide

**Purpose:** establish location, geography, time of day, and where the characters are.

- One dominant environmental landmark or light source.
- Main character occupies about 15–25% of frame height.
- Place the character near a third, not automatically at dead center.
- Include a foreground or midground cue only when it adds depth or scale.
- Use a slow push or lateral drift.
- Do not use this framing for an important facial reaction or a small object action.

### 2. Medium single

**Purpose:** show one character acting or reacting while retaining enough environment to orient the viewer.

- Character occupies about 35–55% of frame height.
- Keep the head and hands/action area unobstructed.
- Reserve negative space in the direction of gaze or movement.
- Use a gentle push-in for realization, or a small lateral drift for observation.

### 3. Medium two-shot

**Purpose:** make a relationship or exchange immediately understandable.

- Both characters must be large enough to read; avoid shrinking both to fit the environment.
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

- The object should be large enough to identify instantly.
- Remove unrelated characters and decoration.
- Keep the action area near the center of attention.
- Use DSL shapes for simple symbolic objects; use JS when the shot needs hands, fingers, detailed props, or physically convincing contact.

### 7. Character–object interaction

**Purpose:** make cause and effect visually undeniable.

- Show the actor, the object, and the point of interaction together whenever possible.
- The actor's hand/arm must visibly reach the object; do not rely on narration to explain an invisible connection.
- The object must be large enough to track across the action.
- Preserve object position and direction across consecutive shots.
- Use DSL only for simple interactions that its existing figure/shape vocabulary can express. Use JS for detailed hand poses, prop attachment, or contact animation.

### 8. Dramatic reveal

**Purpose:** reveal a new ability, consequence, scale, or piece of information.

- Control what is visible before the reveal; do not show the answer too early.
- Give the revealed subject the strongest contrast or scale.
- Use a motivated pull-out, push-in, or light change.
- Avoid stacking multiple title cards, glows, and graphic accents on the same beat.

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

1. Can the viewer identify the subject within one second?
2. Is the important character/object large enough at phone size?
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
