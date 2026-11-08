import fs from 'node:fs';
import path from 'node:path';
import { lintComposition } from '../../engine/geometry/index.js';
import { resolveCompositionTemplate, DEFAULT_COMPOSITION_TEMPLATES } from '../../engine/composition-templates/resolve.js';
import {
  ASSET_REGISTRY, createAssetRegistry, registerAssets, resolveAssetReferences,
} from '../../engine/assets/index.js';
import { BARS } from '../../engine/visual-lint.js';
import { createFinding } from '../findings.js';

const finite = value => typeof value === 'number' && Number.isFinite(value);
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function dimensions(aspect) {
  return aspect === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
}

function collectTrackTimes(spec) {
  const times = new Set();
  const add = track => {
    if (!Array.isArray(track)) return;
    for (const key of track) if (key && finite(key.at)) times.add(key.at);
  };
  for (const key of ['x', 'y', 'zoom']) add(spec.camera?.[key]);
  for (const entity of spec.entities || []) {
    for (const track of Object.values(entity.animate || {})) add(track);
  }
  return [...times].sort((a, b) => a - b);
}

function sampleTimes(spec, duration, fps, maxSamples = 64) {
  const keys = collectTrackTimes(spec).filter(time => time >= 0 && time < duration);
  if (!keys.length) return [];
  const boundaries = [...new Set([0, ...keys, Math.max(0, duration - 1 / Math.max(1, fps))])].sort((a, b) => a - b);
  const candidates = new Set(keys.filter(time => time > 0));
  for (let i = 1; i < boundaries.length; i++) {
    const midpoint = (boundaries[i - 1] + boundaries[i]) / 2;
    if (midpoint > 0 && midpoint < duration) candidates.add(midpoint);
  }
  let result = [...candidates].sort((a, b) => a - b);
  if (result.length > maxSamples) {
    result = Array.from({ length: maxSamples }, (_, index) => result[Math.round(index * (result.length - 1) / (maxSamples - 1))]);
  }
  return [...new Set(result)];
}

function barPixels(value, vertical) {
  if (typeof value === 'number') return value;
  if (vertical) return { none: 0, wide: 0, scope: 170, thin: 60 }[value ?? 'wide'] ?? 0;
  return BARS[value ?? 'wide'] ?? 0;
}

export function runGeometryChecks(projectDir) {
  const findings = [];
  const configPath = path.join(projectDir, 'config.json');
  const storyPath = path.join(projectDir, 'story', 'shots.json');
  if (!fs.existsSync(storyPath)) return findings;

  const config = fs.existsSync(configPath) ? readJson(configPath) : {};
  const story = readJson(storyPath);
  const frame = dimensions(config.aspect);
  const fps = config.fps || 24;
  const registry = createAssetRegistry(ASSET_REGISTRY.list());
  const manifestPath = path.join(projectDir, 'assets.json');
  let registryReady = true;
  if (fs.existsSync(manifestPath)) {
    try { registerAssets(readJson(manifestPath), registry); }
    catch { registryReady = false; }
  }

  for (const shot of story.shots || []) {
    const file = path.join(projectDir, 'scenes', 'visual', shot.id + '.json');
    if (!fs.existsSync(file)) continue;
    let original;
    try { original = readJson(file); } catch { continue; }
    if (original.version !== 2 || !Array.isArray(original.entities)) continue;

    const duration = Math.max(0, shot.end - shot.start);
    const times = sampleTimes(original, duration, fps);
    if (!times.length) continue;
    const bars = barPixels(shot.bars ?? config.bars, config.aspect === '9:16');
    let base = original;
    if (registryReady) {
      try { base = resolveAssetReferences(original, registry); } catch { /* Static validation reports the asset error. */ }
    }

    for (const localTime of times) {
      let expanded = base;
      try {
        expanded = resolveCompositionTemplate(base, localTime, frame, DEFAULT_COMPOSITION_TEMPLATES).spec;
      } catch {
        continue; // Template diagnostics are already reported by static validation.
      }
      const result = lintComposition(expanded, {
        frame,
        time: localTime,
        captionSafe: config.captions !== false && bars > 0,
        captionHeight: (bars / frame.height) * 100,
      });
      for (const diagnostic of result.diagnostics) {
        const globalTime = shot.start + localTime;
        const entityIds = [diagnostic.entity, ...(diagnostic.entities || [])].filter(Boolean);
        findings.push(createFinding({
          sceneId: shot.id,
          entityIds,
          timestamp: {
            local: Number(localTime.toFixed(4)),
            global: Number(globalTime.toFixed(4)),
            frame: Math.round(globalTime * fps),
          },
          severity: diagnostic.level === 'error' ? 'error' : 'warning',
          category: 'geometry',
          code: diagnostic.code,
          message: diagnostic.message,
          suggestion: diagnostic.code === 'entity-outside-frame'
            ? 'Adjust the entity transform or camera framing at this time.'
            : diagnostic.code === 'caption-safe-area'
              ? 'Move the entity away from the caption-safe area or revise the caption layout.'
              : diagnostic.code === 'entity-overlap'
                ? 'Verify whether the overlap is intentional; adjust depth or placement if not.'
                : 'Inspect the relationship and its participating entities at this timestamp.',
          detector: 'geometry.timeline',
          confidence: 1,
        }));
      }
    }
  }
  return findings;
}

export const _testing = { collectTrackTimes, sampleTimes };
