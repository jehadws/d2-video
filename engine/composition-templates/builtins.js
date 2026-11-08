import { TEMPLATE_SCHEMA_VERSION } from './index.js';

const character = ['hero', 'figure'];
const objects = ['rect', 'circle', 'cup'];
const environment = ['rect', 'surface'];

const define = (id, name, description, roles, defaults, extra = {}) => ({
  schemaVersion: TEMPLATE_SCHEMA_VERSION,
  id, name, description, roles, defaults,
  allowedOverrides: ['camera', 'framing'],
  ...extra,
});

export const BUILTIN_TEMPLATE_DEFINITIONS = Object.freeze([
  define('establishing-wide', 'Establishing Wide', 'Introduces the setting while keeping the protagonist readable.', {
    primary: { min: 1, max: 1, types: character },
    secondary: { min: 0, max: 2, types: character },
    objects: { min: 0, max: 8, types: objects },
    environment: { min: 0, max: 12, types: environment },
  }, { framing: 'wide', camera: { zoom: 0.92 } }),
  define('medium-single', 'Medium Single', 'Keeps one character dominant while preserving room for gestures.', {
    primary: { min: 1, max: 1, types: character },
    objects: { min: 0, max: 4, types: objects },
    environment: { min: 0, max: 8, types: environment },
  }, { framing: 'medium', camera: { zoom: 1.12 } }),
  define('close-up', 'Close-up', 'Prioritizes the primary character’s face and expression.', {
    primary: { min: 1, max: 1, types: character },
    objects: { min: 0, max: 2, types: objects },
  }, { framing: 'close_up', camera: { zoom: 2.0 } }),
  define('two-shot', 'Two-shot', 'Frames two characters together with a clear left-to-right relationship.', {
    primary: { min: 1, max: 1, types: character },
    secondary: { min: 1, max: 1, types: character },
    objects: { min: 0, max: 4, types: objects },
  }, { framing: 'two_shot', camera: { zoom: 1.0 } }, {
    relationships: [{ type: 'left_of', subjectRole: 'primary', targetRole: 'secondary', gap: 6, priority: 80 }],
  }),
  define('over-the-shoulder', 'Over the Shoulder', 'Uses a foreground character and a second character as the conversational target.', {
    primary: { min: 1, max: 1, types: character },
    secondary: { min: 1, max: 1, types: character },
  }, { framing: 'two_shot', camera: { zoom: 1.18 } }),
  define('object-interaction', 'Object Interaction', 'Connects the primary character to one clearly readable story object.', {
    primary: { min: 1, max: 1, types: character },
    objects: { min: 1, max: 1, types: objects },
    environment: { min: 0, max: 6, types: environment },
  }, { framing: 'interaction', camera: { zoom: 1.12 } }, {
    relationships: [{ type: 'touching', subjectRole: 'objects', targetRole: 'primary', subjectIndex: 0, targetIndex: 0, subjectAnchor: 'center', targetAnchor: 'hand.near', priority: 90 }],
  }),
  define('insert', 'Insert', 'Makes a prop or detail the visual subject; a character is optional.', {
    primary: { min: 0, max: 1, types: character },
    objects: { min: 1, max: 4, types: objects },
  }, { framing: 'insert', camera: { zoom: 1.8 } }),
  define('reaction', 'Reaction', 'Isolates the primary character’s response as a distinct story beat.', {
    primary: { min: 1, max: 1, types: character },
  }, { framing: 'reaction', camera: { zoom: 1.7 } }),
  define('tracking', 'Tracking', 'Keeps the primary character near frame center as its animated position changes.', {
    primary: { min: 1, max: 1, types: character },
    secondary: { min: 0, max: 2, types: character },
    objects: { min: 0, max: 6, types: objects },
  }, { framing: 'medium', camera: { zoom: 1.08 }, tracking: { role: 'primary', smoothing: 1 } }),
]);

