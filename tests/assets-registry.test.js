import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_REGISTRY, createAssetRegistry, resolveAssetReferences, validateAssetReferences, validateAssetDefinition } from '../engine/assets/index.js';

test('built-in asset ids are unique, stable and discoverable by kind', () => {
  assert.ok(ASSET_REGISTRY.has('character.hero'));
  assert.ok(ASSET_REGISTRY.has('prop.cup'));
  assert.ok(ASSET_REGISTRY.has('environment.bedroom'));
  assert.ok(ASSET_REGISTRY.has('material.ceramic'));
  assert.ok(ASSET_REGISTRY.has('lighting.dusk'));
  assert.deepEqual(ASSET_REGISTRY.list('environment').map(x => x.id), ['environment.bedroom', 'environment.office', 'environment.street']);
});

test('registry rejects invalid and duplicate definitions', () => {
  assert.ok(validateAssetDefinition({ id: 'bad', kind: 'prop' }).length > 0);
  const registry = createAssetRegistry();
  const item = { schemaVersion: 1, id: 'material.test', kind: 'material', version: 1, name: 'Test', baseColor: '#ffffff', roughness: 0.5 };
  registry.register(item);
  assert.throws(() => registry.register(item), /Duplicate asset id/);
  assert.throws(() => registry.require('material.test', 'prop'), /expected prop/);
});

test('asset references resolve character identity and prop geometry/material without mutating source', () => {
  const source = {
    version: 2, id: 's900', environment: 'environment.office', lighting: 'lighting.cool-interior',
    entities: [
      { id: 'hero', assetId: 'character.hero', pose: 'stand' },
      { id: 'cup', assetId: 'prop.cup', material: 'material.ceramic', geometry: { width: 9 } },
    ],
  };
  const resolved = resolveAssetReferences(source);
  assert.equal(resolved.entities[0].type, 'hero');
  assert.equal(resolved.entities[0].identity, 'character.hero');
  assert.equal(resolved.entities[1].type, 'cup');
  assert.equal(resolved.entities[1].geometry.width, 9);
  assert.equal(resolved.entities[1].geometry.height, 11);
  assert.equal(resolved.entities[1].style.fill, '#C7D5DC');
  assert.equal(resolved.environmentDef.id, 'environment.office');
  assert.equal(resolved.lightingDef.id, 'lighting.cool-interior');
  assert.equal(source.entities[0].type, undefined);
  assert.equal(source.entities[1].geometry, undefined);
});

test('asset validation reports missing, wrong-kind and stale references', () => {
  const errors = validateAssetReferences({
    version: 2, id: 's901', environment: 'prop.cup', lighting: 'lighting.missing',
    entities: [
      { id: 'a', assetId: 'character.missing' },
      { id: 'b', assetId: 'environment.office' },
      { id: 'c', assetId: 'prop.cup', assetVersion: 2 },
      { id: 'd', type: 'cup', material: 'material.missing' },
    ],
  });
  assert.equal(errors.length, 6);
  assert.throws(() => resolveAssetReferences({ entities: [{ id: 'x', assetId: 'missing.id' }] }), /Invalid visual asset references/);
});

test('scene overrides take precedence over reusable asset defaults', () => {
  const resolved = resolveAssetReferences({ entities: [{
    id: 'cup', assetId: 'prop.cup', style: { fill: '#ffffff' }, geometry: { height: 14 },
  }] });
  assert.equal(resolved.entities[0].style.fill, '#ffffff');
  assert.equal(resolved.entities[0].geometry.height, 14);
});
