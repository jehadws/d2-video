import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createFinding, normalizeLintFinding } from '../qa/findings.js';
import { buildReport, formatReport } from '../qa/report.js';
import { runQA } from '../qa/index.js';
import { _testing } from '../qa/checks/geometry.js';
import { parseQaArgs } from '../qa.mjs';
import { lintProject } from '../lint-visual.mjs';

function project(t, shots = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'd2-video-qa-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'story'), { recursive: true });
  fs.writeFileSync(path.join(root, 'story', 'shots.json'), JSON.stringify({ shots }));
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({ aspect: '16:9', fps: 24 }));
  return root;
}

test('finding normalization produces stable IDs and normalized severities', () => {
  const a = normalizeLintFinding({ shot: 's001', entity: 'hero', level: 'warn', code: 'entity-overlap', message: 'Overlap' });
  const b = normalizeLintFinding({ shot: 's001', entity: 'hero', level: 'warn', code: 'entity-overlap', message: 'Overlap' });
  assert.equal(a.id, b.id);
  assert.equal(a.severity, 'warning');
  assert.deepEqual(a.entityIds, ['hero']);
});

test('report status is failed only for errors and warning for warnings', () => {
  const warning = buildReport({ projectDir: '/tmp/demo', findings: [createFinding({ severity: 'warning', code: 'repeat', message: 'Repeated' })], scenes: 2 });
  assert.equal(warning.status, 'warning');
  const failed = buildReport({ projectDir: '/tmp/demo', findings: [createFinding({ severity: 'error', code: 'missing', message: 'Missing' })] });
  assert.equal(failed.status, 'failed');
  assert.match(formatReport(failed), /Visual QA: FAILED/);
});

test('static QA detects a story shot with no visual JSON or JS scene', t => {
  const root = project(t, [{ id: 's001', start: 0, end: 2 }]);
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.equal(report.status, 'failed');
  assert.ok(report.findings.some(item => item.code === 'scene-implementation-missing' && item.sceneId === 's001'));
});

test('static QA accepts a matching legacy scene module', t => {
  const root = project(t, [{ id: 's001', start: 0, end: 2 }]);
  fs.mkdirSync(path.join(root, 'scenes'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scenes', 's001.js'), 'export {};');
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(!report.findings.some(item => item.code === 'scene-implementation-missing'));
});

test('geometry sampling includes interior keyframes and interval midpoints without frame zero', () => {
  const times = _testing.sampleTimes({
    entities: [{ animate: { x: [{ at: 0, value: 0 }, { at: 1, value: 10 }, { at: 2, value: 0 }] } }],
  }, 3, 24);
  assert.ok(times.includes(1));
  assert.ok(times.includes(0.5));
  assert.ok(!times.includes(0));
});

test('CLI arguments support project and independent check selection', () => {
  assert.deepEqual(parseQaArgs(['--project', 'projects/demo', '--static', '--fail-on', 'warning']), {
    project: 'projects/demo', static: true, 'fail-on': 'warning',
  });
});


test('DSL v2 shots participate in consecutive framing lint', t => {
  const root = project(t, [
    { id: 's001', start: 0, end: 2 },
    { id: 's002', start: 2, end: 4 },
    { id: 's003', start: 4, end: 6 },
    { id: 's004', start: 6, end: 8 },
  ]);
  const visualDir = path.join(root, 'scenes', 'visual');
  fs.mkdirSync(visualDir, { recursive: true });
  for (const id of ['s001', 's002', 's003', 's004']) {
    fs.writeFileSync(path.join(visualDir, id + '.json'), JSON.stringify({
      version: 2, id, framing: 'wide',
      entities: [{ id: 'hero', type: 'hero', pose: 'stand', transform: { position: { x: 0, y: 0 } } }],
      relationships: [],
    }));
  }
  const result = lintProject(root);
  assert.ok(result.findings.some(item => item.code === 'framing-repeat' && item.shot === 's004'));
});


test('static QA detects malformed legacy DSL definitions', t => {
  const root = project(t, [{ id: 's001', start: 0, end: 2 }]);
  const visualDir = path.join(root, 'scenes', 'visual');
  fs.mkdirSync(visualDir, { recursive: true });
  fs.writeFileSync(path.join(visualDir, 's001.json'), JSON.stringify({ version: 1, id: 's001', layers: {} }));
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(report.findings.some(item => item.code === 'visual-dsl-invalid'));
});

test('static QA detects animation keyframes beyond shot duration', t => {
  const root = project(t, [{ id: 's001', start: 0, end: 2 }]);
  const visualDir = path.join(root, 'scenes', 'visual');
  fs.mkdirSync(visualDir, { recursive: true });
  fs.writeFileSync(path.join(visualDir, 's001.json'), JSON.stringify({
    version: 2, id: 's001',
    entities: [{ id: 'hero', type: 'hero', pose: 'stand',
      transform: { position: { x: 0, y: 0 } },
      animate: { x: [{ at: 0, value: 0 }, { at: 3, value: 20 }] } }],
    relationships: [],
  }));
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(report.findings.some(item => item.code === 'animation-range-outside-shot'));
});


test('static QA recognizes descriptive JavaScript filenames by registerShot ID', t => {
  const root = project(t, [{ id: 's007', start: 0, end: 2 }, { id: 's008', start: 2, end: 4 }]);
  const shotsDir = path.join(root, 'scenes', 'shots');
  fs.mkdirSync(shotsDir, { recursive: true });
  fs.writeFileSync(path.join(shotsDir, '07_closeup.js'), "registerShot('s007', { draw() {} });");
  fs.writeFileSync(path.join(shotsDir, '08_ots.js'), 'registerShot("s008", { draw() {} });');
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(!report.findings.some(item => item.code === 'scene-implementation-missing'));
});

test('static QA does not accept a descriptive JavaScript filename without shot registration', t => {
  const root = project(t, [{ id: 's007', start: 0, end: 2 }]);
  const shotsDir = path.join(root, 'scenes', 'shots');
  fs.mkdirSync(shotsDir, { recursive: true });
  fs.writeFileSync(path.join(shotsDir, '07_closeup.js'), 'export {};');
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(report.findings.some(item => item.code === 'scene-implementation-missing' && item.sceneId === 's007'));
});
