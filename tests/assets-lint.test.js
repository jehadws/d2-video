import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lintProject } from '../lint-visual.mjs';

function project(t, shot) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-assets-lint-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scenes', 'visual'), { recursive: true });
  fs.mkdirSync(path.join(root, 'story'), { recursive: true });
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({ aspect: '16:9', captions: false, bars: 'none' }));
  fs.writeFileSync(path.join(root, 'story', 'shots.json'), JSON.stringify({ shots: [] }));
  fs.writeFileSync(path.join(root, 'scenes', 'visual', 's001.json'), JSON.stringify(shot));
  return root;
}

test('project lint rejects missing reusable asset references', t => {
  const root = project(t, {
    version: 2, id: 's001', environment: 'environment.not-real',
    entities: [{ id: 'hero', assetId: 'character.hero', pose: 'stand' }],
    relationships: [],
  });
  const result = lintProject(root);
  assert.ok(result.errors > 0);
  assert.ok(result.findings.some(item => item.code === 'asset-reference-invalid'));
});

test('project lint resolves valid character, prop, material, environment and lighting assets', t => {
  const root = project(t, {
    version: 2, id: 's001', environment: 'environment.office', lighting: 'lighting.cool-interior',
    entities: [
      { id: 'hero', assetId: 'character.hero', pose: 'stand' },
      { id: 'cup', assetId: 'prop.cup', material: 'material.ceramic' },
    ],
    relationships: [],
  });
  const result = lintProject(root);
  assert.equal(result.findings.filter(item => item.code === 'asset-reference-invalid').length, 0);
  assert.equal(result.errors, 0);
});

test('project assets.json registers reusable custom assets for lint and resolution', t => {
  const root = project(t, {
    version: 2, id: 's001',
    entities: [{ id: 'customCup', assetId: 'prop.custom-cup' }],
    relationships: [],
  });
  fs.writeFileSync(path.join(root, 'assets.json'), JSON.stringify({
    schemaVersion: 1,
    assets: [{
      schemaVersion: 1, id: 'prop.custom-cup', kind: 'prop', version: 1, name: 'Custom cup',
      render: { type: 'cup' }, geometry: { width: 7, height: 9 }, material: 'material.ceramic',
    }],
  }));
  const result = lintProject(root);
  assert.equal(result.findings.filter(item => item.code === 'asset-reference-invalid' || item.code === 'asset-manifest-invalid').length, 0);
  assert.equal(result.errors, 0);
});
