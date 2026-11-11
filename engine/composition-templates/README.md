# Composition templates (Phase 3)

Composition templates add reusable shot intent and role binding to DSL v2. They expand into ordinary camera, framing, and relationship fields before the existing geometry solver runs. The geometry engine remains the only spatial placement authority.

## Built-in templates

| Template | Required roles | Behavior |
|---|---|---|
| `establishing-wide` | primary | Wide environmental framing |
| `medium-single` | primary | Character-focused framing |
| `close-up` | primary | Head-anchor camera focus and close framing |
| `two-shot` | primary, secondary | Adds a left/right relationship |
| `over-the-shoulder` | primary, secondary | Places primary in front of the conversational target |
| `object-interaction` | primary, one object | Aligns the object with the primary near hand |
| `insert` | one or more objects | Object-led framing; character is optional |
| `reaction` | primary | Head-anchor camera focus for a reaction beat |
| `tracking` | primary | Follows the primary entity's animated x/y position |

The over-the-shoulder preset sets draw order and conversational framing; it does not synthesize silhouette masks or crop a foreground character automatically. Templates supply starting composition rules, not a substitute for shot-specific art direction.

## Shot request

A DSL v2 shot opts in with a namespaced `composition` property:

```json
{
  "version": 2,
  "id": "s012",
  "composition": {
    "template": "two-shot",
    "intent": {
      "focus": "heroA",
      "emotion": "curiosity",
      "purpose": "two characters begin a conversation"
    },
    "roles": {
      "primary": "heroA",
      "secondary": ["heroB"]
    },
    "overrides": {
      "camera": { "zoom": 1.08 }
    }
  },
  "entities": [
    { "id": "heroA", "type": "hero", "pose": "stand" },
    { "id": "heroB", "type": "figure", "pose": "stand" }
  ],
  "relationships": []
}
```

The primary binding is one entity ID. Other role bindings are arrays. Supported roles are `primary`, `secondary`, `objects`, and `environment`. `intent.focus`, when supplied, must point to an entity assigned to one of those roles.

Explicit shot camera/framing values take precedence over template defaults. Values in `composition.overrides` take precedence over both, and only namespaces listed in the template's `allowedOverrides` are accepted. Templates are opt-in: v1 shots and v2 shots without a `composition` block retain their existing behavior.

## Template definition

Custom definitions use schema version 1:

```js
{
  schemaVersion: 1,
  id: 'custom-conversation',
  name: 'Custom Conversation',
  description: 'A custom two-character composition.',
  roles: {
    primary: { min: 1, max: 1, types: ['hero', 'figure'] },
    secondary: { min: 1, max: 1, types: ['hero', 'figure'] }
  },
  allowedOverrides: ['camera', 'framing'],
  defaults: {
    framing: 'two_shot',
    camera: { zoom: 1 }
  },
  relationships: [
    { type: 'left_of', subjectRole: 'primary', targetRole: 'secondary', gap: 6 }
  ]
}
```

Register a custom definition through the exported default registry before registering shots:

```js
import { DEFAULT_COMPOSITION_TEMPLATES } from './resolve.js';
DEFAULT_COMPOSITION_TEMPLATES.register(customDefinition);
```

Relationship rules refer to role names and are expanded into normal Phase 2 relationships. The resolver does not implement a second layout algorithm.

## API

- `validateTemplateDefinition(definition)` validates a template definition.
- `createTemplateRegistry(definitions = [])` creates an isolated registry with `register`, `get`, `has`, and sorted `list`.
- `validateTemplateRequest(spec, registry)` validates template IDs, role bindings, entity types, intent focus, and override namespaces.
- `applyCompositionTemplate(spec, time, registry)` returns a cloned, expanded v2 shot when a template is present; non-template shots are returned unchanged. It does not mutate the source.
- `resolveTemplatedComposition(spec, time, frame, registry)` expands the request and delegates to the canonical geometry solver.
- `DEFAULT_COMPOSITION_TEMPLATES` is the registry used by the renderer and project linter.
- `TEMPLATE_SCHEMA_VERSION` and `COMPOSITION_ROLES` expose the contract version and canonical role names.

The renderer validates templates at registration and expands them per frame. Tracking and head-anchor focus use a two-pass solve: relationships are resolved first, then the camera is centered on the resolved focus and geometry is checked again. Project lint validates the request, resolves the expanded composition, and checks semantic framing against the solver's geometry bounds.

## Tests

```bash
node --test tests/composition-templates.test.js tests/composition-template-resolution.test.js
node --test tests/geometry-composition.test.js tests/visual-contact-lint.test.js
node lint-visual.mjs projects/composition-lab
```
