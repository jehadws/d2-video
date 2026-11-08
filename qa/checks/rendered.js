import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createFinding } from '../findings.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function isNearBlankFrame(metrics) {
  return Number(metrics?.meanLuminance) < 3 && Number(metrics?.luminanceStdDev) < 1.2;
}

export async function runRenderedChecks(projectDir, options = {}) {
  const absolute = path.resolve(projectDir);
  const args = [
    path.join(ROOT, 'render.mjs'),
    '--project', absolute,
    '--qa-rendered',
    '--scale', String(options.scale ?? 0.5),
  ];
  if (options.style) args.push('--style', String(options.style));

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error('Rendered QA renderer exited with code ' + code)));
  });

  const reportPath = path.join(absolute, 'build', 'qa', 'rendered.json');
  if (!fs.existsSync(reportPath)) throw new Error('Rendered QA did not produce ' + reportPath);
  const raw = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const findings = (raw.findings || []).map(item => createFinding({
    ...item,
    detector: item.detector || 'rendered',
  }));
  return {
    findings,
    checkedFrames: Number(raw.checkedFrames) || 0,
    artifacts: {
      report: path.relative(absolute, reportPath).replace(/\\/g, '/'),
      contactSheets: raw.artifacts?.contactSheets || [],
      frames: (raw.frames || []).map(frame => frame.evidence),
    },
  };
}
