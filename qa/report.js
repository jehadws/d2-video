import fs from 'node:fs';
import path from 'node:path';
import { countSeverities } from './findings.js';

export function buildReport({ projectDir, findings = [], scenes = 0, checkedFrames = 0, checks = [] }) {
  const counts = countSeverities(findings);
  const status = counts.error ? 'failed' : counts.warning ? 'warning' : 'passed';
  return {
    schemaVersion: 1,
    project: path.basename(path.resolve(projectDir)),
    status,
    summary: { scenes, checkedFrames, errors: counts.error, warnings: counts.warning, info: counts.info },
    checks,
    findings,
    artifacts: {},
  };
}

export function formatReport(report) {
  const lines = [
    'Visual QA: ' + report.status.toUpperCase(),
    'Project: ' + report.project,
    'Scenes: ' + report.summary.scenes + ' | Errors: ' + report.summary.errors +
      ' | Warnings: ' + report.summary.warnings + ' | Info: ' + report.summary.info,
    'Checks: ' + (report.checks.length ? report.checks.join(', ') : 'none'),
    '',
  ];
  if (!report.findings.length) lines.push('No findings.');
  for (const finding of report.findings) {
    const location = finding.sceneId ? finding.sceneId : 'project';
    const time = finding.timestamp ? ' @ ' + finding.timestamp.global + 's' : '';
    lines.push('[' + finding.severity.toUpperCase() + '] ' + location + time + ' ' + finding.code + ': ' + finding.message);
    if (finding.suggestion) lines.push('  Suggested fix: ' + finding.suggestion);
  }
  return lines.join('\n');
}

export function writeReport(projectDir, report) {
  const outputDir = path.join(projectDir, 'build', 'qa');
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'report.json');
  const textPath = path.join(outputDir, 'report.txt');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(textPath, formatReport(report) + '\n');
  return { json: jsonPath, text: textPath };
}
