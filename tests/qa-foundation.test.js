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
import { isNearBlankFrame } from '../qa/checks/rendered.js';
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


test('rendered QA CLI flag is parsed as an enabled check', () => {
  const args = parseQaArgs(['--project', 'projects/demo', '--rendered', '--scale', '0.5']);
  assert.equal(args.rendered, true);
  assert.equal(args.scale, '0.5');
});

test('rendered QA near-blank detector flags only uniformly near-black samples', () => {
  assert.equal(isNearBlankFrame({ meanLuminance: 0.4, luminanceStdDev: 0.2 }), true);
  assert.equal(isNearBlankFrame({ meanLuminance: 24, luminanceStdDev: 8 }), false);
  assert.equal(isNearBlankFrame({ meanLuminance: 1.5, luminanceStdDev: 4 }), false);
});


test('rendered QA report includes frame counts, evidence, and contact sheets', () => {
  const report = buildReport({
    projectDir: '/tmp/demo',
    checkedFrames: 3,
    checks: ['static', 'geometry', 'rendered'],
    findings: [createFinding({
      sceneId: 's001', severity: 'warning', category: 'rendering',
      code: 'rendered-frame-near-blank', message: 'Near blank',
      evidence: 'build/qa/frames/s001_0p20s.png',
    })],
  });
  report.artifacts.contactSheets = ['build/qa/frames/contact-sheet-01.png'];
  const formatted = formatReport(report);
  assert.match(formatted, /Frames checked: 3/);
  assert.match(formatted, /s001_0p20s\.png/);
  assert.match(formatted, /contact-sheet-01\.png/);
});

test('static QA rejects gaps and overlaps in the production shot timeline', t => {
  const root = project(t, [
    { id: 's001', start: 0, end: 2 },
    { id: 's002', start: 2.25, end: 4 },
    { id: 's003', start: 3.9, end: 5 },
  ]);
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(report.findings.some(item => item.code === 'timeline-gap' && item.sceneId === 's002'));
  assert.ok(report.findings.some(item => item.code === 'timeline-overlap' && item.sceneId === 's003'));
});

test('static QA enforces zero start and story duration matching the final shot', t => {
  const root = project(t, [
    { id: 's001', start: 0.1, end: 2 },
    { id: 's002', start: 2, end: 4 },
  ]);
  fs.writeFileSync(path.join(root, 'story', 'shots.json'), JSON.stringify({
    duration: 4.5,
    shots: [{ id: 's001', start: 0.1, end: 2 }, { id: 's002', start: 2, end: 4 }],
  }));
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(report.findings.some(item => item.code === 'timeline-start-not-zero'));
  assert.ok(report.findings.some(item => item.code === 'timeline-duration-mismatch'));
});

test('production QA accepts a complete six-minute narration package', t => {
  const shots = Array.from({ length: 90 }, (_, i) => ({
    id: 's' + String(i + 1).padStart(3, '0'),
    start: i * 4,
    end: (i + 1) * 4,
    scene: 'A concrete visual beat for shot ' + (i + 1),
  }));
  const root = project(t, shots);
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({
    aspect: '16:9', fps: 24, duration: 360, voiceover: 'input/voiceover.wav',
  }));
  fs.writeFileSync(path.join(root, 'story', 'shots.json'), JSON.stringify({ duration: 360, shots }));
  fs.mkdirSync(path.join(root, 'input'), { recursive: true });
  fs.writeFileSync(path.join(root, 'input', 'voiceover.wav'), 'fixture');
  fs.mkdirSync(path.join(root, 'timeline'), { recursive: true });
  fs.writeFileSync(path.join(root, 'timeline', 'words.json'), JSON.stringify({
    words: [{ word: 'Narration', start: 0.1, end: 0.5 }],
  }));
  const { report } = runQA(root, { checks: ['production'], write: false });
  assert.equal(report.status, 'passed');
});

test('production QA rejects projects shorter than five minutes', t => {
  const root = project(t, [{ id: 's001', start: 0, end: 33, scene: 'Short fixture' }]);
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({
    aspect: '16:9', fps: 24, duration: 33, voiceover: 'input/voiceover.wav',
  }));
  fs.writeFileSync(path.join(root, 'story', 'shots.json'), JSON.stringify({
    duration: 33, shots: [{ id: 's001', start: 0, end: 33, scene: 'Short fixture' }],
  }));
  const { report } = runQA(root, { checks: ['production'], write: false });
  assert.ok(report.findings.some(item => item.code === 'production-duration-out-of-range'));
});

test('static QA rejects transcript words that extend beyond the voiceover', t => {
  const root = project(t, [{ id: 's001', start: 0, end: 10 }]);
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({ aspect: '16:9', fps: 24, duration: 10 }));
  const timelineDir = path.join(root, 'timeline');
  fs.mkdirSync(timelineDir, { recursive: true });
  fs.writeFileSync(path.join(timelineDir, 'words.json'), JSON.stringify({
    source: 'test',
    words: [{ word: 'hello', start: 0.2, end: 0.6 }, { word: 'world', start: 11.8, end: 12.2 }],
  }));
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(report.findings.some(item => item.code === 'transcript-exceeds-voiceover'));
});

test('static QA rejects unsorted transcript word timestamps', t => {
  const root = project(t, [{ id: 's001', start: 0, end: 10 }]);
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({ aspect: '16:9', fps: 24, duration: 10 }));
  const timelineDir = path.join(root, 'timeline');
  fs.mkdirSync(timelineDir, { recursive: true });
  fs.writeFileSync(path.join(timelineDir, 'words.json'), JSON.stringify({
    source: 'test',
    words: [{ word: 'later', start: 2, end: 2.4 }, { word: 'earlier', start: 1, end: 1.4 }],
  }));
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(report.findings.some(item => item.code === 'transcript-word-order-invalid'));
});

test('static QA accepts a contiguous timeline with a matching declared duration', t => {
  const root = project(t, [
    { id: 's001', start: 0, end: 2 },
    { id: 's002', start: 2, end: 4 },
  ]);
  fs.writeFileSync(path.join(root, 'story', 'shots.json'), JSON.stringify({
    duration: 4,
    shots: [{ id: 's001', start: 0, end: 2 }, { id: 's002', start: 2, end: 4 }],
  }));
  const { report } = runQA(root, { checks: ['static'], write: false });
  assert.ok(!report.findings.some(item => item.category === 'timeline' && item.severity === 'error'));
});
