import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerHybridScenes } from '../engine/hybrid-scene-loader.js';
import { runQA } from '../qa/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTION = path.join(ROOT, 'projects', 'what-if-you-had-1000-iq');

test('hybrid loader registers JavaScript first and lets valid DSL replace the same shot', async () => {
  const events = [];
  const registry = new Map();
  const result = await registerHybridScenes({
    scriptFiles: ['/project/scenes/shots/legacy.js'],
    visualFiles: ['/project/scenes/visual/s001.json'],
    importScene: async file => {
      events.push(['script', file]);
      registry.set('s001', { source: 'javascript' });
    },
    fetchVisual: async file => {
      events.push(['fetch', file]);
      return { version: 2, id: 's001' };
    },
    registerVisual: spec => {
      events.push(['register', spec.id]);
      registry.set(spec.id, { source: 'dsl' });
    },
  });

  assert.deepEqual(events.map(item => item[0]), ['script', 'fetch', 'register']);
  assert.equal(registry.get('s001').source, 'dsl');
  assert.deepEqual(result.errors, []);
  assert.equal(result.loadedScripts.length, 1);
  assert.equal(result.loadedVisuals.length, 1);
});

test('invalid DSL registration is isolated and preserves the legacy implementation', async () => {
  const registry = new Map();
  const reported = [];
  const result = await registerHybridScenes({
    scriptFiles: ['legacy.js'],
    visualFiles: ['broken.json'],
    importScene: async () => registry.set('s001', { source: 'javascript' }),
    fetchVisual: async () => { throw new Error('invalid JSON response'); },
    registerVisual: spec => registry.set(spec.id, { source: 'dsl' }),
    onError: item => reported.push(item),
  });

  assert.equal(registry.get('s001').source, 'javascript');
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].kind, 'visual');
  assert.match(result.errors[0].message, /invalid JSON response/);
  assert.deepEqual(reported, result.errors);
});

test('a failed legacy import does not prevent later DSL scenes from loading', async () => {
  const registry = new Map();
  const result = await registerHybridScenes({
    scriptFiles: ['broken.js'],
    visualFiles: ['s002.json'],
    importScene: async () => { throw new Error('module failed'); },
    fetchVisual: async () => ({ version: 2, id: 's002' }),
    registerVisual: spec => registry.set(spec.id, { source: 'dsl' }),
  });

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].kind, 'script');
  assert.equal(registry.get('s002').source, 'dsl');
});

function filesUnder(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(full, extension));
    else if (entry.isFile() && entry.name.endsWith(extension) && !entry.name.startsWith('_')) found.push(full);
  }
  return found;
}

test('the published 1000 IQ production has complete, non-duplicated shot implementations', () => {
  const story = JSON.parse(fs.readFileSync(path.join(PRODUCTION, 'story', 'shots.json'), 'utf8'));
  const shotsDir = path.join(PRODUCTION, 'scenes', 'shots');
  const visualDir = path.join(PRODUCTION, 'scenes', 'visual');
  const jsCounts = new Map();
  const dslCounts = new Map();
  const registration = /\bregisterShot\s*\(\s*(['"])([^'"]+)\1/g;

  for (const file of filesUnder(shotsDir, '.js')) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(registration)) {
      jsCounts.set(match[2], (jsCounts.get(match[2]) || 0) + 1);
    }
  }
  for (const file of filesUnder(visualDir, '.json')) {
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    const id = spec.id || path.basename(file, '.json');
    dslCounts.set(id, (dslCounts.get(id) || 0) + 1);
  }

  assert.equal(story.shots.length, 136);
  assert.equal(new Set(story.shots.map(shot => shot.id)).size, story.shots.length);
  for (const shot of story.shots) {
    assert.ok((jsCounts.get(shot.id) || 0) + (dslCounts.get(shot.id) || 0) >= 1,
      shot.id + ' has no JavaScript or DSL implementation');
    assert.ok((jsCounts.get(shot.id) || 0) <= 1, shot.id + ' has duplicate JavaScript implementations');
    assert.ok((dslCounts.get(shot.id) || 0) <= 1, shot.id + ' has duplicate DSL implementations');
  }
});

test('static and geometry QA accept a mixed JavaScript plus DSL v2 production fixture', t => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'd2-video-hybrid-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const shotsDir = path.join(project, 'scenes', 'shots');
  const visualDir = path.join(project, 'scenes', 'visual');
  fs.mkdirSync(shotsDir, { recursive: true });
  fs.mkdirSync(visualDir, { recursive: true });

  fs.writeFileSync(path.join(project, 'config.json'), JSON.stringify({
    aspect: '16:9', fps: 24, captions: false, bars: 'none',
  }));
  fs.writeFileSync(path.join(project, 'story', 'shots.json'), JSON.stringify({
    duration: 4,
    shots: [
      { id: 's001', start: 0, end: 2, scene: 'Legacy JavaScript shot', bars: 'none' },
      { id: 's002', start: 2, end: 4, scene: 'Semantic DSL two-shot', bars: 'none' },
    ],
  }));
  fs.writeFileSync(path.join(shotsDir, '01_legacy.js'), "registerShot('s001', { draw() {} });");

  fs.writeFileSync(path.join(visualDir, 's002.json'), JSON.stringify({
    version: 2,
    id: 's002',
    environment: 'environment.office',
    lighting: 'lighting.warm-interior',
    camera: { zoom: [
      { at: 0, value: 1 },
      { at: 2, value: 1.02, ease: 'sine' },
    ] },
    entities: [
      {
        id: 'hero', assetId: 'character.hero', pose: 'stand',
        transform: { position: { x: -22, y: 0 }, scale: 2.4 },
      },
      {
        id: 'friend', assetId: 'character.companion', pose: 'stand',
        transform: { position: { x: 22, y: 0 }, scale: 2.4 },
      },
    ],
    relationships: [
      { type: 'inside_frame', subject: 'hero', priority: 100 },
      { type: 'inside_frame', subject: 'friend', priority: 100 },
    ],
    composition: {
      template: 'two-shot',
      roles: { primary: 'hero', secondary: ['friend'] },
    },
  }, null, 2));

  const { report } = runQA(project, { checks: ['static', 'geometry'], write: false });
  assert.equal(report.summary.errors, 0, JSON.stringify(report.findings, null, 2));
  assert.deepEqual(report.checks, ['static', 'geometry']);
  assert.equal(report.summary.checkedFrames, 0);
  assert.ok(!report.findings.some(item => item.code === 'scene-implementation-missing'));
});
