# Composition template contracts (Phase 3)

This module introduces the reusable-template metadata contract and an isolated registry. It does not resolve layouts or alter rendering.

## Responsibilities

- **Template definition:** declares semantic roles, accepted entity types, cardinality, metadata and allowed override namespaces.
- **Registry:** stores validated definitions and returns defensive copies.
- **Request validation:** validates a shot's optional \`composition\` block against a registered definition and its entity list.
- **Geometry engine:** remains the sole authority for spatial constraint resolution.

No built-in templates are registered in Phase 3.1. Establishing and medium definitions arrive with the first template implementation, after the resolution lifecycle is designed.

## Template definition

\`\`\`js
{
  schemaVersion: 1,
  id: 'medium',
  name: 'Medium Shot',
  description: 'A character-focused composition for gestures and readable action.',
  roles: {
    primary: { min: 1, max: 1, types: ['hero', 'figure'] },
    secondary: { min: 0, max: 1, types: ['hero', 'figure'] },
    objects: { min: 0, max: 3, types: ['rect', 'circle', 'cup'] },
  },
  allowedOverrides: ['camera', 'framing'],
  defaults: {},
}
\`\`\`

The \`primary\` role is required in every template definition. Other roles are optional unless their \`min\` is greater than zero. A role's \`types\` list must use entity types supported by the Phase 2 geometry engine.

Supported composition role names are \`primary\`, \`secondary\`, \`objects\`, and \`environment\`. The primary binding is one entity ID; all other role bindings are arrays of entity IDs.

## Shot request

A DSL v2 shot may opt into a template with a namespaced \`composition\` property:

\`\`\`json
{
  "version": 2,
  "id": "s012",
  "composition": {
    "template": "medium",
    "intent": {
      "focus": "hero",
      "emotion": "curiosity",
      "purpose": "character notices something"
    },
    "roles": {
      "primary": "hero",
      "secondary": [],
      "objects": ["phone"]
    },
    "overrides": {
      "camera": {
        "headroom": "comfortable"
      }
    }
  },
  "entities": [
    { "id": "hero", "type": "hero", "pose": "stand" },
    { "id": "phone", "type": "rect", "geometry": { "width": 5, "height": 9 } }
  ],
  "relationships": []
}
\`\`\`

The example is the target request shape, not a currently renderable template shot. Override payloads are opaque objects in Phase 3.1; later template/camera milestones will define and validate their detailed fields.

## API

- \`validateTemplateDefinition(definition)\` returns an array of validation messages.
- \`createTemplateRegistry(definitions = [])\` returns \`register\`, \`get\`, \`has\`, and sorted \`list\` methods.
- \`validateTemplateRequest(spec, registry)\` validates an optional template request and its role/entity bindings.
- \`TEMPLATE_SCHEMA_VERSION\` and \`COMPOSITION_ROLES\` expose the contract version and canonical role names.

Definitions are cloned when registered and when returned, preventing callers from mutating registry state through retrieved objects. Duplicate IDs are rejected.

## Integration boundary

Phase 3.1 deliberately does not modify \`engine/visual-dsl.js\`, \`engine/geometry/index.js\`, or \`lint-visual.mjs\`. Existing DSL v1 and v2 behavior remains unchanged until the next milestone wires request validation and resolution into the v2 lifecycle.

## Tests

\`\`\`bash
node --test tests/composition-templates.test.js
\`\`\`
