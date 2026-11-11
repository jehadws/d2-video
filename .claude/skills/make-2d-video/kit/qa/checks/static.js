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


function validateProjectTimeline(story, findings) {
  const shots = story.shots;
  const eps = 1 / 1000;
  if (!shots.length) {
    findings.push(createFinding({ severity: 'error', category: 'timeline', code: 'timeline-empty', message: 'The story timeline contains no shots.', detector: 'static.timeline' }));
    return;
  }
  let previous = null;
  const ids = new Set();
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    if (!shot || typeof shot.id !== 'string' || !shot.id) continue;
    if (ids.has(shot.id)) findings.push(createFinding({ sceneId: shot.id, severity: 'error', category: 'timeline', code: 'shot-id-duplicate', message: 'Shot IDs must be unique.', detector: 'static.timeline' }));
    ids.add(shot.id);
    if (!Number.isFinite(shot.start) || !Number.isFinite(shot.end) || shot.end <= shot.start) continue;
    if (i === 0 && Math.abs(shot.start) > eps) {
      findings.push(createFinding({ sceneId: shot.id, severity: 'error', category: 'timeline', code: 'timeline-start-not-zero', message: 'The first shot must start at 0 seconds; found ' + shot.start + 's.', detector: 'static.timeline' }));
    }
    if (previous) {
      const delta = shot.start - previous.end;
      if (delta > eps) findings.push(createFinding({ sceneId: shot.id, severity: 'error', category: 'timeline', code: 'timeline-gap', message: 'Timeline gap of ' + delta.toFixed(3) + 's between ' + previous.id + ' and ' + shot.id + '.', suggestion: 'Make adjacent shot boundaries contiguous or represent intentional black/silence as an explicit shot.', detector: 'static.timeline' }));
      else if (delta < -eps) findings.push(createFinding({ sceneId: shot.id, severity: 'error', category: 'timeline', code: 'timeline-overlap', message: 'Timeline overlap of ' + (-delta).toFixed(3) + 's between ' + previous.id + ' and ' + shot.id + '.', suggestion: 'Use the incoming transition duration for visual overlap, not overlapping story time ranges.', detector: 'static.timeline' }));
    }
    const transition = shot.in;
    if (transition && transition.dur != null) {
      if (!Number.isFinite(transition.dur) || transition.dur < 0 || transition.dur > shot.end - shot.start + eps) {
        findings.push(createFinding({ sceneId: shot.id, severity: 'error', category: 'timeline', code: 'transition-duration-invalid', message: 'Incoming transition duration must be finite, non-negative, and no longer than its shot.', detector: 'static.timeline' }));
      }
    }
    previous = shot;
  }
  if (previous && Number.isFinite(story.duration) && Math.abs(previous.end - story.duration) > eps) {
    findings.push(createFinding({ sceneId: previous.id, severity: 'error', category: 'timeline', code: 'timeline-duration-mismatch', message: 'story.duration (' + story.duration + 's) does not match the final shot end (' + previous.end + 's).', suggestion: 'Set story.duration to the final shot end or correct the final shot boundary.', detector: 'static.timeline' }));
  }
}

function validateTranscriptTimeline(projectDir, findings) {
  const wordsPath = path.join(projectDir, 'timeline', 'words.json');
  if (!fs.existsSync(wordsPath)) return;
  let payload;
  try { payload = JSON.parse(fs.readFileSync(wordsPath, 'utf8')); }
  catch (error) {
    findings.push(createFinding({ severity: 'error', category: 'timeline', code: 'transcript-json-invalid', message: 'Unable to parse timeline/words.json: ' + error.message, detector: 'static.transcript' }));
    return;
  }
  const words = payload?.words;
  if (!Array.isArray(words) || !words.length) {
    findings.push(createFinding({ severity: 'error', category: 'timeline', code: 'transcript-words-invalid', message: 'timeline/words.json must contain a non-empty words array.', detector: 'static.transcript' }));
    return;
  }
  let config = {};
  try { config = JSON.parse(fs.readFileSync(path.join(projectDir, 'config.json'), 'utf8')); } catch {}
  const duration = Number(config.duration);
  const tolerance = 1.5;
  let previousStart = -Infinity;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word || !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.start < 0 || word.end <= word.start) {
      findings.push(createFinding({ sceneId: null, severity: 'error', category: 'timeline', code: 'transcript-word-time-invalid', message: 'Transcript word ' + (i + 1) + ' must have finite non-negative start and end times, with end after start.', detector: 'static.transcript' }));
      continue;
    }
    if (word.start + 1e-3 < previousStart) {
      findings.push(createFinding({ severity: 'error', category: 'timeline', code: 'transcript-word-order-invalid', message: 'Transcript word timings are not sorted by start time at word ' + (i + 1) + '.', detector: 'static.transcript' }));
    }
    previousStart = word.start;
    if (Number.isFinite(duration) && duration > 0 && word.end > duration + tolerance) {
      findings.push(createFinding({ severity: 'error', category: 'timeline', code: 'transcript-exceeds-voiceover', message: 'Transcript ends at ' + word.end.toFixed(2) + 's, beyond voiceover duration ' + duration.toFixed(2) + 's (allowed tolerance ' + tolerance.toFixed(1) + 's).', detector: 'static.transcript' }));
      break;
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

  validateProjectTimeline(story, findings);
  validateTranscriptTimeline(projectDir, findings);

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
