import fs from 'node:fs';
import path from 'node:path';
import { runStaticChecks } from './checks/static.js';
import { runGeometryChecks } from './checks/geometry.js';
import { runProductionChecks } from './checks/production.js';
import { buildReport, writeReport } from './report.js';

function sceneCount(projectDir) {
  const file = path.join(projectDir, 'story', 'shots.json');
  if (!fs.existsSync(file)) return 0;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')).shots?.length || 0; }
  catch { return 0; }
}

export function runQA(projectDir, options = {}) {
  const absolute = path.resolve(projectDir);
  const selected = options.checks || ['static', 'geometry'];
  const findings = [];
  const checks = [];
  if (selected.includes('static')) {
    findings.push(...runStaticChecks(absolute));
    checks.push('static');
  }
  if (selected.includes('geometry')) {
    findings.push(...runGeometryChecks(absolute));
    checks.push('geometry');
  }
  if (selected.includes('production')) {
    findings.push(...runProductionChecks(absolute));
    checks.push('production');
  }
  const unique = new Map();
  for (const finding of findings) unique.set(finding.id, finding);
  const report = buildReport({
    projectDir: absolute,
    findings: [...unique.values()],
    scenes: sceneCount(absolute),
    checkedFrames: 0,
    checks,
  });
  const artifacts = options.write === false ? {} : writeReport(absolute, report);
  return { report, artifacts };
}
