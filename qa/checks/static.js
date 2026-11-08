import fs from 'node:fs';
import path from 'node:path';
import { lintProject } from '../../lint-visual.mjs';
import { createFinding, normalizeLintFinding } from '../findings.js';

function collectFiles(dir, extension, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) collectFiles(full, extension, out);
    else if (name.endsWith(extension) && !name.startsWith('_')) out.push(full);
  }
  return out;
}

export function runStaticChecks(projectDir) {
  const findings = [];
  const storyPath = path.join(projectDir, 'story', 'shots.json');
  if (!fs.existsSync(storyPath)) {
    findings.push(createFinding({
      severity: 'error', category: 'project', code: 'story-file-missing',
      message: 'Project is missing story/shots.json.',
      suggestion: 'Create the project shot timeline before running visual QA.',
      detector: 'static.project',
    }));
    return findings;
  }

  let story;
  try {
    story = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
  } catch (error) {
    findings.push(createFinding({
      severity: 'error', category: 'project', code: 'story-file-invalid',
      message: 'Unable to parse story/shots.json: ' + error.message,
      detector: 'static.project',
    }));
    return findings;
  }
  if (!Array.isArray(story.shots)) {
    findings.push(createFinding({
      severity: 'error', category: 'project', code: 'story-shots-invalid',
      message: 'story/shots.json must contain a shots array.',
      suggestion: 'Set shots to an array of shot definitions.',
      detector: 'static.project',
    }));
    return findings;
  }

  const visualFiles = collectFiles(path.join(projectDir, 'scenes', 'visual'), '.json');
  const scriptFiles = collectFiles(path.join(projectDir, 'scenes'), '.js');
  const visualIds = new Set(visualFiles.map(file => path.basename(file, '.json')));
  const scriptIds = new Set(scriptFiles.map(file => path.basename(file, '.js')));

  for (const shot of story.shots) {
    if (!shot || typeof shot.id !== 'string' || !shot.id) {
      findings.push(createFinding({
        severity: 'error', category: 'project', code: 'story-shot-id-invalid',
        message: 'Every story shot must have a non-empty string id.',
        detector: 'static.project',
      }));
      continue;
    }
    if (!visualIds.has(shot.id) && !scriptIds.has(shot.id)) {
      findings.push(createFinding({
        sceneId: shot.id,
        severity: 'error',
        category: 'project',
        code: 'scene-implementation-missing',
        message: 'Story shot "' + shot.id + '" has no matching visual JSON or scene JavaScript module.',
        suggestion: 'Add scenes/visual/' + shot.id + '.json or a scene module named ' + shot.id + '.js.',
        detector: 'static.project',
      }));
    }
  }

  try {
    const lint = lintProject(projectDir);
    findings.push(...lint.findings.map(normalizeLintFinding));
  } catch (error) {
    findings.push(createFinding({
      severity: 'error', category: 'project', code: 'static-lint-failed',
      message: 'Static visual lint could not complete: ' + error.message,
      detector: 'static.visual-lint',
    }));
  }
  return findings;
}
