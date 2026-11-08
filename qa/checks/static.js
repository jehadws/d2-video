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

function collectRegisteredShotIds(files) {
  const ids = new Set();
  // Scene modules are often named descriptively (e.g. 07_closeup.js), so
  // filename matching alone cannot establish whether they implement a shot.
  // Read the explicit registerShot() declaration instead.
  const registration = /\bregisterShot\s*\(\s*(['"])([^'"]+)\1/g;
  for (const file of files) {
    let source;
    try { source = fs.readFileSync(file, 'utf8'); }
    catch { continue; }
    for (const match of source.matchAll(registration)) ids.add(match[2]);
  }
  return ids;
}

function collectAnimationTracks(spec) {
  const tracks = [];
  const addObject = object => {
    if (!object || typeof object !== 'object') return;
    for (const [name, value] of Object.entries(object)) {
      if (Array.isArray(value) && value.every(frame => frame && typeof frame === 'object' && Number.isFinite(frame.at))) {
        tracks.push({ name, frames: value });
      }
    }
  };
  addObject(spec.camera);
  for (const entity of spec.entities || []) addObject(entity.animate);
  for (const layer of spec.layers || []) {
    addObject(layer.animate);
    addObject(layer.prop?.animate);
  }
  return tracks;
}

function validateShotTiming(shot, spec, findings) {
  if (!Number.isFinite(shot.start) || !Number.isFinite(shot.end) || shot.end <= shot.start) {
    findings.push(createFinding({
      sceneId: shot.id,
      severity: 'error',
      category: 'timeline',
      code: 'shot-time-range-invalid',
      message: 'Shot start/end must be finite numbers with end greater than start.',
      detector: 'static.timeline',
    }));
    return;
  }
  const duration = shot.end - shot.start;
  for (const track of collectAnimationTracks(spec)) {
    const last = track.frames[track.frames.length - 1];
    if (last && last.at > duration + 1e-6) {
      findings.push(createFinding({
        sceneId: shot.id,
        severity: 'error',
        category: 'timeline',
        code: 'animation-range-outside-shot',
        message: 'Animation track "' + track.name + '" ends at ' + last.at + 's, beyond the shot duration of ' + duration + 's.',
        suggestion: 'Move the final keyframe inside the shot duration or extend the shot.',
        detector: 'static.timeline',
      }));
    }
  }
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
  const registeredShotIds = collectRegisteredShotIds(scriptFiles);

  for (const shot of story.shots) {
    if (!shot || typeof shot.id !== 'string' || !shot.id) {
      findings.push(createFinding({
        severity: 'error', category: 'project', code: 'story-shot-id-invalid',
        message: 'Every story shot must have a non-empty string id.',
        detector: 'static.project',
      }));
      continue;
    }
    const visualPath = path.join(projectDir, 'scenes', 'visual', shot.id + '.json');
    if (fs.existsSync(visualPath)) {
      try { validateShotTiming(shot, JSON.parse(fs.readFileSync(visualPath, 'utf8')), findings); }
      catch { /* The JSON parser diagnostic is emitted by lintProject. */ }
    }
    if (!visualIds.has(shot.id) && !scriptIds.has(shot.id) && !registeredShotIds.has(shot.id)) {
      findings.push(createFinding({
        sceneId: shot.id,
        severity: 'error',
        category: 'project',
        code: 'scene-implementation-missing',
        message: 'Story shot "' + shot.id + '" has no matching visual JSON or registered JavaScript scene.',
        suggestion: 'Add scenes/visual/' + shot.id + '.json or register the shot ID with registerShot() in a scene module.',
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
