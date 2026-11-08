#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runQA } from './qa/index.js';
import { formatReport } from './qa/report.js';

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

export function main(argv = process.argv.slice(2)) {
  const args = parseQaArgs(argv);
  if (!args.project) {
    console.error('usage: node qa.mjs --project projects/<name> [--static] [--geometry] [--fail-on error|warning|info]');
    return 2;
  }
  if (args.rendered || args.temporal || args.continuity) {
    console.error('This check is not implemented yet. Phase 5A supports static and geometry checks.');
    return 2;
  }
  const selected = [];
  if (args.static) selected.push('static');
  if (args.geometry) selected.push('geometry');
  const checks = selected.length ? selected : ['static', 'geometry'];
  try {
    const { report, artifacts } = runQA(path.resolve(String(args.project)), { checks });
    if (args.json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(formatReport(report));
      if (artifacts.json) console.log('\nJSON report: ' + artifacts.json);
      if (artifacts.text) console.log('Text report: ' + artifacts.text);
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
  process.exitCode = main();
}
