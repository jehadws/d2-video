import { resolveComposition } from '../geometry/index.js';
import { ease } from '../core.js';
import { createTemplateRegistry, validateTemplateRequest } from './index.js';
import { BUILTIN_TEMPLATE_DEFINITIONS } from './builtins.js';

export const DEFAULT_COMPOSITION_TEMPLATES = createTemplateRegistry(BUILTIN_TEMPLATE_DEFINITIONS);

const clone = value => JSON.parse(JSON.stringify(value));
const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

function sampleTrack(track, time, fallback) {
  if (finite(track)) return track;
  if (!Array.isArray(track) || !track.length) return fallback;
  if (time <= track[0].at) return track[0].value;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i];
    if (time <= b.at) {
      const raw = Math.max(0, Math.min(1, (time - a.at) / (b.at - a.at)));
      const p = (ease[b.ease || 'inOut'] || ease.inOut)(raw);
      return a.value + (b.value - a.value) * p;
    }
  }
  return track[track.length - 1].value;
}

function entityPosition(entity, time) {
  const transform = entity.transform || {};
  const base = transform.position || entity.position || { x: 0, y: 0 };
  return {
    x: sampleTrack(entity.animate?.x, time, base.x || 0),
    y: sampleTrack(entity.animate?.y, time, base.y || 0),
  };
}

function roleIds(composition, role) {
  const value = composition.roles?.[role];
  return value == null ? [] : (Array.isArray(value) ? value : [value]);
}

/**
 * Expand a semantic template request into ordinary DSL v2 camera/framing/
 * relationship fields. The geometry solver remains the only placement engine.
 */
export function applyCompositionTemplate(spec, time = 0, registry = DEFAULT_COMPOSITION_TEMPLATES) {
  const errors = validateTemplateRequest(spec, registry);
  if (errors.length) throw new TypeError('Invalid composition template request: ' + errors.join('; '));
  if (!spec.composition) return spec;

  const out = clone(spec);
  const request = out.composition;
  const definition = registry.get(request.template);
  const defaults = definition.defaults || {};
  out.framing = request.overrides?.framing ?? out.framing ?? defaults.framing;

  const camera = { ...(defaults.camera || {}), ...(out.camera || {}), ...(request.overrides?.camera || {}) };
  const follow = defaults.tracking || defaults.focus;
  if (follow) {
    const focusId = request.intent?.focus || roleIds(request, follow.role)[0];
    const focusEntity = out.entities.find(entity => entity.id === focusId);
    if (focusEntity) {
      const p = entityPosition(focusEntity, time);
      // This is the first-pass camera estimate. The final camera is refined
      // from solver-resolved anchors in resolveCompositionTemplate().
      if (camera.x == null) camera.x = p.x;
      if (camera.y == null) camera.y = p.y;
    }
  }
  out.camera = camera;

  const relationships = [...(out.relationships || [])];
  for (const rule of definition.relationships || []) {
    const subjects = roleIds(request, rule.subjectRole);
    const targets = roleIds(request, rule.targetRole);
    const subject = subjects[rule.subjectIndex || 0];
    const target = targets[rule.targetIndex || 0];
    if (!subject || !target) continue;
    const duplicate = relationships.some(item => item.type === rule.type && item.subject === subject && item.target === target);
    if (!duplicate) {
      const { subjectRole, targetRole, subjectIndex, targetIndex, ...relationship } = rule;
      relationships.push({ ...relationship, subject, target });
    }
  }
  out.relationships = relationships;
  return out;
}

/**
 * Resolve in two passes when a template follows a semantic focus. The first
 * pass solves relationships; the second centers the camera on the resolved
 * entity origin or anchor, then re-runs geometry against the final viewport.
 */
export function resolveCompositionTemplate(spec, time = 0, frame = { width: 1920, height: 1080 }, registry = DEFAULT_COMPOSITION_TEMPLATES) {
  const expanded = applyCompositionTemplate(spec, time, registry);
  let resolved = resolveComposition(expanded, time, frame);
  if (!spec.composition) return { spec: expanded, resolved };

  const definition = registry.get(spec.composition.template);
  const follow = definition?.defaults?.tracking || definition?.defaults?.focus;
  if (!follow) return { spec: expanded, resolved };

  const focusId = spec.composition.intent?.focus || roleIds(spec.composition, follow.role)[0];
  const geometry = resolved.geometry.find(item => item.id === focusId);
  if (!geometry) return { spec: expanded, resolved };

  const point = follow.anchor ? geometry.anchors[follow.anchor] : geometry.position;
  if (!point) return { spec: expanded, resolved };

  const explicitCamera = {
    x: spec.camera?.x != null || spec.composition.overrides?.camera?.x != null,
    y: spec.camera?.y != null || spec.composition.overrides?.camera?.y != null,
  };
  let changed = false;
  if (!explicitCamera.x && expanded.camera.x !== point.x) { expanded.camera.x = point.x; changed = true; }
  if (!explicitCamera.y && expanded.camera.y !== point.y) { expanded.camera.y = point.y; changed = true; }
  if (changed) resolved = resolveComposition(expanded, time, frame);
  return { spec: expanded, resolved };
}

export function resolveTemplatedComposition(spec, time = 0, frame = { width: 1920, height: 1080 }, registry = DEFAULT_COMPOSITION_TEMPLATES) {
  return resolveCompositionTemplate(spec, time, frame, registry).resolved;
}
