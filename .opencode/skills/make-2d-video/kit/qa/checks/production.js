import fs from 'node:fs';
import path from 'node:path';
import { createFinding } from '../findings.js';

export function runProductionChecks(projectDir) {
  const findings = [];
  const configPath = path.join(projectDir, 'config.json');
  const storyPath = path.join(projectDir, 'story', 'shots.json');
  let config = {};
  let story = {};

  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch (error) {
    findings.push(createFinding({ severity: 'error', category: 'production', code: 'production-config-invalid', message: 'Production config is missing or invalid: ' + error.message, detector: 'production.preflight' }));
    return findings;
  }
  try { story = JSON.parse(fs.readFileSync(storyPath, 'utf8')); }
  catch (error) {
    findings.push(createFinding({ severity: 'error', category: 'production', code: 'production-story-invalid', message: 'Production story is missing or invalid: ' + error.message, detector: 'production.preflight' }));
    return findings;
  }

  const duration = Number(story.duration ?? config.duration);
  if (!Number.isFinite(duration) || duration < 300 || duration > 480) {
    findings.push(createFinding({
      severity: 'error', category: 'production', code: 'production-duration-out-of-range',
      message: 'A production delivery must be between 300 and 480 seconds (5–8 minutes); found ' + (Number.isFinite(duration) ? duration.toFixed(2) + 's' : 'no valid duration') + '.',
      suggestion: 'Align the shot timeline to the voiceover and keep the final duration within the agreed 5–8 minute target.',
      detector: 'production.preflight',
    }));
  }

  const voiceover = config.voiceover;
  if (!voiceover || !fs.existsSync(path.resolve(projectDir, voiceover))) {
    findings.push(createFinding({
      severity: 'error', category: 'production', code: 'production-voiceover-missing',
      message: 'Production project must include its configured voiceover file.',
      suggestion: 'Set config.voiceover to the narration file inside the project input directory.',
      detector: 'production.preflight',
    }));
  }

  const wordsPath = path.join(projectDir, 'timeline', 'words.json');
  let words = [];
  try { words = JSON.parse(fs.readFileSync(wordsPath, 'utf8')).words || []; } catch {}
  if (!Array.isArray(words) || !words.length) {
    findings.push(createFinding({
      severity: 'error', category: 'production', code: 'production-word-timeline-missing',
      message: 'Production project must include a non-empty timeline/words.json for narration alignment and caption QA.',
      suggestion: 'Run transcription or import a timestamped script before final rendering.',
      detector: 'production.preflight',
    }));
  }

  const shots = Array.isArray(story.shots) ? story.shots : [];
  if (!shots.length) {
    findings.push(createFinding({ severity: 'error', category: 'production', code: 'production-shots-missing', message: 'Production project must contain a non-empty shot timeline.', detector: 'production.preflight' }));
  } else if (Number.isFinite(duration) && duration > 0) {
    const density = shots.length / (duration / 60);
    if (density < 15 || density > 25) {
      findings.push(createFinding({
        severity: 'warning', category: 'production', code: 'production-shot-density-unusual',
        message: 'Shot density is ' + density.toFixed(1) + ' shots/minute; the production guideline is 15–25.',
        suggestion: 'Review pacing and shot variety; keep a deliberate exception if longer holds serve the narration.',
        detector: 'production.preflight',
      }));
    }
  }

  for (const shot of shots) {
    if (!shot?.scene || typeof shot.scene !== 'string' || !shot.scene.trim()) {
      findings.push(createFinding({
        sceneId: shot?.id || null, severity: 'error', category: 'production',
        code: 'production-shot-description-missing',
        message: 'Every production shot must include a concrete scene description.',
        detector: 'production.preflight',
      }));
    }
  }
  return findings;
}
