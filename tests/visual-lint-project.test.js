import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lintProject } from '../lint-visual.mjs';

function makeProject(t, { captions, bars }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-lint-project-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  fs.mkdirSync(path.join(root, 'story'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scenes', 'visual'), { recursive: true });
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({
    aspect: '16:9',
    ...(captions === undefined ? {} : { captions }),
    ...(bars === undefined ? {} : { bars }),
  }));
  fs.writeFileSync(path.join(root, 'story', 'shots.json'), JSON.stringify({
    shots: [{ id: 's001', start: 0, end: 3 }],
  }));
  fs.writeFileSync(path.join(root, 'scenes', 'visual', 's001.json'), JSON.stringify({
    version: 2,
    id: 's001',
    entities: [{
      id: 'hero',
      type: 'hero',
      pose: 'reach',
      transform: { position: { x: -18, y: 40 }, scale: 3.1 },
    }],
    relationships: [],
  }));

  return root;
}

function captionWarnings(project) {
  return lintProject(project).findings.filter((finding) => finding.code === 'caption-safe-area');
}

test('captions disabled skips caption-safe overlap checks even when bars default to wide', (t) => {
  const project = makeProject(t, { captions: false, bars: null });
  assert.deepEqual(captionWarnings(project), []);
});

test('captions enabled with null bars preserves the default wide caption-safe area', (t) => {
  const project = makeProject(t, { captions: true, bars: null });
  assert.equal(captionWarnings(project).length, 1);
});

test('unspecified captions preserve the existing default wide caption-safe area', (t) => {
  const project = makeProject(t, { bars: null });
  assert.equal(captionWarnings(project).length, 1);
});

test('explicit bars none disables caption-safe overlap checks', (t) => {
  const project = makeProject(t, { captions: true, bars: 'none' });
  assert.deepEqual(captionWarnings(project), []);
});

test('explicit wide bars retain caption-safe overlap checks', (t) => {
  const project = makeProject(t, { captions: true, bars: 'wide' });
  assert.equal(captionWarnings(project).length, 1);
});
