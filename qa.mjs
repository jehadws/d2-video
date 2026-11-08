#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runQA } from './qa/index.js';
import { runRenderedChecks } from './qa/checks/rendered.js';
import { formatReport, writeReport } from './qa/report.js';

export function parseQaArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    args[key] = value;
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseQaArgs(argv);
  if (!args.project) {
    console.error('usage: node qa.mjs --project projects/<name> [--static] [--geometry] [--rendered] [--fail-on error|warning|info]');
    return 2;
  }
  if (args.temporal || args.continuity) {
    console.error('Temporal continuity analysis is not implemented yet.');
    return 2;
  }
  const selected = [];
  if (args.static) selected.push('static');
  if (args.geometry) selected.push('geometry');
  const checks = selected.length ? selected : ['static', 'geometry'];
  const projectDir = path.resolve(String(args.project));
  try {
    const { report } = runQA(projectDir, { checks });
    if (args.rendered) {
      const rendered = await runRenderedChecks(projectDir, {
        scale: args.scale == null ? 0.5 : Number(args.scale),
        style: args.style || undefined,
      });
      report.findings.push(...rendered.findings);
      report.summary.checkedFrames = rendered.checkedFrames;
      report.summary.errors = report.findings.filter(item => item.severity === 'error').length;
      report.summary.warnings = report.findings.filter(item => item.severity === 'warning').length;
      report.summary.info = report.findings.filter(item => item.severity === 'info').length;
      report.status = report.summary.errors ? 'failed' : report.summary.warnings ? 'warning' : 'passed';
      report.checks.push('rendered');
      report.artifacts = { ...report.artifacts, ...rendered.artifacts };
      writeReport(projectDir, report);
    }

    if (args.json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(formatReport(report));
      const outputDir = path.join(projectDir, 'build', 'qa');
      console.log('\\nJSON report: ' + path.join(outputDir, 'report.json'));
      console.log('Text report: ' + path.join(outputDir, 'report.txt'));
      if (args.rendered) console.log('Contact sheets: ' + path.join(outputDir, 'frames'));
    }
    const threshold = args['fail-on'] || 'error';
    const rank = { info: 1, warning: 2, error: 3 };
    if (!(threshold in rank)) {
      console.error('Invalid --fail-on value. Use error, warning, or info.');
      return 2;
    }
    return report.findings.some(finding => rank[finding.severity] >= rank[threshold]) ? 1 : 0;
  } catch (error) {
    console.error('QA failed to run: ' + error.message);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main();
}
