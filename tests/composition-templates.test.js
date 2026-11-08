import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPOSITION_ROLES,
  TEMPLATE_SCHEMA_VERSION,
  createTemplateRegistry,
  validateTemplateDefinition,
  validateTemplateRequest,
} from '../engine/composition-templates/index.js';

const medium = () => ({
  schemaVersion: TEMPLATE_SCHEMA_VERSION,
  id: 'medium',
  name: 'Medium Shot',
  description: 'A character-focused composition for gestures and readable action.',
  roles: {
    primary: { min: 1, max: 1, types: ['hero', 'figure'] },
    secondary: { min: 0, max: 1, types: ['hero', 'figure'] },
    objects: { min: 0, max: 3, types: ['rect', 'circle', 'cup'] },
  },
  allowedOverrides: ['camera', 'framing'],
});

const shot = (composition) => ({
  version: 2,
  id: 's001',
  entities: [
    { id: 'hero', type: 'hero', pose: 'stand' },
    { id: 'friend', type: 'figure', pose: 'stand' },
    { id: 'phone', type: 'rect', geometry: { width: 5, height: 9 } },
  ],
  relationships: [],
  composition,
});

function registry() {
  return createTemplateRegistry([medium()]);
}

test('template definition requires stable metadata and a primary role', () => {
  assert.deepEqual(validateTemplateDefinition(medium()), []);
  assert.ok(validateTemplateDefinition({ ...medium(), id: 'Bad ID' }).some(x => x.includes('kebab-case')));
  assert.ok(validateTemplateDefinition({ ...medium(), roles: {} }).some(x => x.includes('roles.primary')));
});

test('registry registers, lists and retrieves isolated definitions deterministically', () => {
  const templates = registry();
  assert.equal(templates.has('medium'), true);
  assert.equal(templates.get('medium').name, 'Medium Shot');
  assert.deepEqual(templates.list().map(x => x.id), ['medium']);

  const retrieved = templates.get('medium');
  retrieved.roles.primary.types.push('cup');
  assert.deepEqual(templates.get('medium').roles.primary.types, ['hero', 'figure']);

  assert.throws(() => templates.register(medium()), /already registered/);
});

test('registry rejects invalid definitions', () => {
  assert.throws(() => createTemplateRegistry([{ ...medium(), roles: { primary: { min: 2, max: 1, types: ['hero'] } } }]), /min cannot exceed/);
  assert.throws(() => createTemplateRegistry([{ ...medium(), roles: { primary: { min: 1, max: 1, types: ['not-an-entity'] } } }]), /unsupported entity type/);
});

test('template request validates required role bindings and entity types', () => {
  const templates = registry();
  const missingPrimary = shot({ template: 'medium', roles: { objects: ['phone'] } });
  assert.ok(validateTemplateRequest(missingPrimary, templates).some(x => x.includes('roles.primary requires')));

  const wrongType = shot({ template: 'medium', roles: { primary: 'phone' } });
  assert.ok(validateTemplateRequest(wrongType, templates).some(x => x.includes('not allowed for role "primary"')));
});

test('template request validates references, cardinality and duplicate role assignment', () => {
  const templates = registry();
  const missing = shot({ template: 'medium', roles: { primary: 'ghost' } });
  assert.ok(validateTemplateRequest(missing, templates).some(x => x.includes('references missing entity "ghost"')));

  const tooMany = shot({ template: 'medium', roles: { primary: 'hero', secondary: ['friend', 'hero'] } });
  const errors = validateTemplateRequest(tooMany, templates);
  assert.ok(errors.some(x => x.includes('requires between 0 and 1')));
  assert.ok(errors.some(x => x.includes('assigned to multiple composition roles')));
});

test('template request validates intent and allowed overrides', () => {
  const templates = registry();
  const invalid = shot({
    template: 'medium',
    intent: { focus: 'missing', emotion: 42 },
    roles: { primary: 'hero', objects: ['phone'] },
    overrides: { camera: { zoom: 1.2 }, colors: { mood: 'warm' } },
  });
  const errors = validateTemplateRequest(invalid, templates);
  assert.ok(errors.some(x => x.includes('intent.emotion must be a string')));
  assert.ok(errors.some(x => x.includes('intent.focus references missing entity')));
  assert.ok(errors.some(x => x.includes('does not allow override "colors"')));
});

test('intent focus must be one of the template-assigned entities', () => {
  const invalid = shot({
    template: 'medium',
    intent: { focus: 'friend' },
    roles: { primary: 'hero' },
  });
  assert.ok(validateTemplateRequest(invalid, registry()).some(x => x.includes('must reference an entity assigned to a composition role')));
});

test('template request rejects unknown templates and malformed composition blocks', () => {
  assert.ok(validateTemplateRequest(shot({ template: 'unknown' }), registry()).some(x => x.includes('unknown composition template')));
  assert.ok(validateTemplateRequest(shot([]), registry()).some(x => x.includes('composition must be an object')));
  assert.deepEqual(validateTemplateRequest(shot(undefined), registry()), []);
});

test('canonical composition role names are stable', () => {
  assert.deepEqual(COMPOSITION_ROLES, ['primary', 'secondary', 'objects', 'environment']);
});

test('malformed entity entries are reported instead of crashing template validation', () => {
  const malformed = { version: 2, id: 's009', entities: [null],
    composition: { template: 'medium', roles: { primary: 'hero' } } };
  assert.ok(validateTemplateRequest(malformed, registry()).some(x => x.includes('references missing entity')));
});
