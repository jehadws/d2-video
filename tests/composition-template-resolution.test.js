import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_COMPOSITION_TEMPLATES, applyCompositionTemplate, resolveTemplatedComposition, resolveCompositionTemplate } from '../engine/composition-templates/resolve.js';
import { lintCompositionFraming } from '../engine/visual-lint.js';
import { getEntityGeometry } from '../engine/geometry/index.js';

const entity = (id, type = 'hero', x = 0) => ({
  id, type, pose: 'stand', geometry: type === 'cup' ? { width: 8, height: 10 } : undefined,
  transform: { position: { x, y: 0 }, scale: 1 },
});

test('built-in template registry exposes the complete shot vocabulary', () => {
  assert.deepEqual(DEFAULT_COMPOSITION_TEMPLATES.list().map(x => x.id), [
    'close-up', 'establishing-wide', 'insert', 'medium-single', 'object-interaction',
    'over-the-shoulder', 'reaction', 'tracking', 'two-shot',
  ]);
});

test('medium template applies defaults without overwriting explicit camera/framing', () => {
  const spec = { version: 2, id: 's001', entities: [entity('hero')], relationships: [],
    composition: { template: 'medium-single', roles: { primary: 'hero' } } };
  const expanded = applyCompositionTemplate(spec);
  assert.equal(expanded.framing, 'medium');
  assert.equal(expanded.camera.zoom, 1.12);
  assert.equal(spec.camera, undefined);
  const overridden = applyCompositionTemplate({ ...spec, framing: 'wide', camera: { zoom: 1.4 } });
  assert.equal(overridden.framing, 'wide');
  assert.equal(overridden.camera.zoom, 1.4);
});

test('two-shot template adds one canonical left-of relationship', () => {
  const spec = { version: 2, id: 's002', entities: [entity('a'), entity('b')], relationships: [],
    composition: { template: 'two-shot', roles: { primary: 'a', secondary: ['b'] } } };
  const expanded = applyCompositionTemplate(spec);
  assert.equal(expanded.relationships.length, 1);
  assert.deepEqual([expanded.relationships[0].subject, expanded.relationships[0].target], ['a', 'b']);
  assert.equal(resolveTemplatedComposition(spec).valid, true);
});

test('object interaction attaches its object to the primary hand through geometry', () => {
  const spec = { version: 2, id: 's003', entities: [entity('hero'), entity('cup', 'cup')],
    relationships: [], composition: { template: 'object-interaction', roles: { primary: 'hero', objects: ['cup'] } } };
  const expanded = applyCompositionTemplate(spec);
  assert.equal(expanded.relationships[0].type, 'touching');
  assert.equal(resolveTemplatedComposition(spec).valid, true);
});

test('tracking template follows animated primary position at the requested time', () => {
  const hero = entity('hero');
  hero.animate = { x: [{ at: 0, value: 0 }, { at: 2, value: 20, ease: 'linear' }] };
  const spec = { version: 2, id: 's004', entities: [hero], relationships: [],
    composition: { template: 'tracking', roles: { primary: 'hero' } } };
  assert.equal(applyCompositionTemplate(spec, 1).camera.x, 10);
  assert.equal(applyCompositionTemplate(spec, 2).camera.x, 20);
});

test('template expansion is opt-in and does not mutate source shots', () => {
  const legacy = { version: 2, id: 's005', entities: [entity('hero')], relationships: [] };
  assert.equal(applyCompositionTemplate(legacy), legacy);
  const spec = { ...legacy, composition: { template: 'reaction', roles: { primary: 'hero' } } };
  const expanded = applyCompositionTemplate(spec);
  assert.equal(spec.framing, undefined);
  assert.equal(expanded.framing, 'reaction');
});

test('semantic framing lint uses canonical resolved character bounds', () => {
  const spec = { framing: 'medium', entities: [entity('hero')] };
  const tooSmall = lintCompositionFraming(spec, {
    viewport: { top: -50, bottom: 50 },
    geometry: [{ id: 'hero', bounds: { height: 20 } }],
  });
  assert.equal(tooSmall[0].code, 'character-too-small');
  const readable = lintCompositionFraming(spec, {
    viewport: { top: -50, bottom: 50 },
    geometry: [{ id: 'hero', bounds: { height: 65 } }],
  });
  assert.deepEqual(readable, []);
});

test('over-the-shoulder template places the foreground role in front', () => {
  const spec = { version: 2, id: 's006', entities: [entity('foreground'), entity('target')],
    relationships: [], composition: { template: 'over-the-shoulder',
      roles: { primary: 'foreground', secondary: ['target'] } } };
  const expanded = applyCompositionTemplate(spec);
  assert.ok(expanded.relationships.some(x => x.type === 'in_front_of' && x.subject === 'foreground' && x.target === 'target'));
  assert.equal(resolveTemplatedComposition(spec).valid, true);
});

test('close-up template centers the camera on the primary head anchor', () => {
  const hero = entity('hero', 'hero', 14);
  hero.transform.position.y = 24;
  const spec = { version: 2, id: 's007', entities: [hero], relationships: [],
    composition: { template: 'close-up', roles: { primary: 'hero' } } };
  const expanded = resolveCompositionTemplate(spec).spec;
  const head = getEntityGeometry(hero).anchors['head.center'];
  assert.equal(expanded.camera.x, head.x);
  assert.equal(expanded.camera.y, head.y);
  const overridden = applyCompositionTemplate({ ...spec, composition: {
    ...spec.composition, overrides: { camera: { x: 99, y: -12 } },
  } });
  assert.equal(overridden.camera.x, 99);
  assert.equal(overridden.camera.y, -12);
});

test('tracking camera follows animated movement while preserving explicit axes', () => {
  const hero = entity('hero');
  hero.animate = { x: [{ at: 0, value: 0 }, { at: 2, value: 20, ease: 'linear' }] };
  const spec = { version: 2, id: 's008', entities: [hero], relationships: [],
    composition: { template: 'tracking', roles: { primary: 'hero' }, overrides: { camera: { y: 7 } } } };
  const expanded = applyCompositionTemplate(spec, 1);
  assert.equal(expanded.camera.x, 10);
  assert.equal(expanded.camera.y, 7);
});

test('two-pass camera focus uses the entity position after relationships resolve', () => {
  const hero = entity('hero');
  const target = { id: 'target', type: 'circle', geometry: { radius: 3 },
    transform: { position: { x: 30, y: 0 } } };
  const spec = { version: 2, id: 's009', entities: [hero, target],
    relationships: [{ type: 'right_of', subject: 'hero', target: 'target', gap: 4 }],
    composition: { template: 'close-up', roles: { primary: 'hero' } } };
  const { spec: expanded, resolved } = resolveCompositionTemplate(spec);
  const head = resolved.geometry.find(item => item.id === 'hero').anchors['head.center'];
  assert.equal(expanded.camera.x, head.x);
  assert.equal(expanded.camera.y, head.y);
});
