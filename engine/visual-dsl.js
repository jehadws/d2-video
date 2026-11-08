// Structured Visual DSL v1. Declarative, deterministic 2D shots; no executable scene code.
import { E, registerShot, ease, clamp, rr, circle, seg, text, FONTS } from './core.js';
import { drawHero } from './characters.js';
import { drawFigure, POSES } from './rig2d.js';
import { validateComposition, resolveComposition } from './geometry/index.js';
import { DEFAULT_COMPOSITION_TEMPLATES, resolveCompositionTemplate } from './composition-templates/resolve.js';
import { validateTemplateRequest } from './composition-templates/index.js';
import { validateAssetReferences, resolveAssetReferences } from './assets/index.js';
import { drawEnvironment } from './assets/render.js';

const TYPES = new Set(['hero', 'figure', 'rect', 'circle', 'cup', 'line', 'text']);
const ACTOR_TRACKS = new Set(['x', 'y', 'scale', 'rotation', 'alpha']);
const EASINGS = new Set(Object.keys(ease));

function isObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function number(v) { return typeof v === 'number' && Number.isFinite(v); }
function validateTrack(track, path, errors) {
  if (!Array.isArray(track) || track.length < 1) { errors.push(path + ' must be a non-empty keyframe array'); return; }
  let previous = -Infinity;
  track.forEach((frame, i) => {
    const p = path + '[' + i + ']';
    if (!isObject(frame)) { errors.push(p + ' must be an object'); return; }
    if (!number(frame.at) || frame.at < 0 || frame.at <= previous) errors.push(p + '.at must be non-negative and strictly increasing');
    if (!number(frame.value)) errors.push(p + '.value must be a finite number');
    if (frame.ease != null && !EASINGS.has(frame.ease)) errors.push(p + '.ease is not supported');
    previous = frame.at;
  });
}

export function validateVisualShot(spec) {
  const errors = [];
  if (!isObject(spec)) return ['shot must be an object'];
  if (spec.version !== 1) errors.push('version must be 1');
  if (typeof spec.id !== 'string' || !/^s[\w-]+$/.test(spec.id)) errors.push('id must be a shot id such as s001');
  if (spec.background != null && (!isObject(spec.background) || typeof spec.background.color !== 'string')) errors.push('background.color must be a CSS color');
  if (spec.camera != null && !isObject(spec.camera)) errors.push('camera must be an object');
  if (spec.camera) for (const k of ['x', 'y', 'zoom']) if (spec.camera[k] != null) validateTrack(spec.camera[k], 'camera.' + k, errors);
  if (!Array.isArray(spec.layers)) errors.push('layers must be an array');
  else spec.layers.forEach((layer, i) => {
    const p = 'layers[' + i + ']';
    if (!isObject(layer)) { errors.push(p + ' must be an object'); return; }
    if (!TYPES.has(layer.type)) { errors.push(p + '.type is unsupported'); return; }
    for (const k of ['x', 'y']) if (layer[k] != null && !number(layer[k])) errors.push(p + '.' + k + ' must be a finite number');
    if (layer.animate != null) {
      if (!isObject(layer.animate)) errors.push(p + '.animate must be an object');
      else for (const [k, track] of Object.entries(layer.animate)) {
        if (!ACTOR_TRACKS.has(k)) errors.push(p + '.animate.' + k + ' is not supported');
        else validateTrack(track, p + '.animate.' + k, errors);
      }
    }
    if ((layer.type === 'hero' || layer.type === 'figure') && layer.pose && !POSES[layer.pose]) errors.push(p + '.pose is not a known pose');
    if ((layer.type === 'hero' || layer.type === 'figure') && layer.contact != null &&
        !(layer.contact === true || (isObject(layer.contact) && ['F', 'B'].includes(layer.contact.hand || 'F')))) errors.push(p + '.contact must be true or an object with hand "F"|"B"');
    if ((layer.type === 'hero' || layer.type === 'figure') && isObject(layer.contact)) {
      const hasFrom = layer.contact.from != null, hasTo = layer.contact.to != null;
      if (hasFrom !== hasTo) errors.push(p + '.contact.from and .contact.to must be provided together');
      if (hasFrom && (!number(layer.contact.from) || !number(layer.contact.to) || layer.contact.from < 0 || layer.contact.to <= layer.contact.from)) errors.push(p + '.contact window must have 0 <= from < to');
      if (layer.contact.tolerance != null && (!number(layer.contact.tolerance) || layer.contact.tolerance <= 0)) errors.push(p + '.contact.tolerance must be a positive number');
      if (layer.contact.target != null && (!Number.isInteger(layer.contact.target) || layer.contact.target < 0 || layer.contact.target >= spec.layers.length || spec.layers[layer.contact.target]?.role !== 'story_object')) errors.push(p + '.contact.target must be the layer index of a story_object');
      if (layer.contact.target != null && !hasFrom) errors.push(p + '.contact.target requires a from/to contact window');
    }
    if ((layer.type === 'hero' || layer.type === 'figure') && layer.prop != null) {
      const propType = typeof layer.prop === 'string' ? layer.prop : layer.prop && layer.prop.type;
      if (!['phone', 'ball', 'cup', 'paper', 'paddle', 'pointer', 'tablet', 'flashlight'].includes(propType)) errors.push(p + '.prop must be a supported prop name or { type } object');
      if (layer.prop && typeof layer.prop === 'object' && layer.prop.animate != null) {
        if (!isObject(layer.prop.animate)) errors.push(p + '.prop.animate must be an object');
        else for (const k of ['offsetX', 'offsetY', 'rot']) if (layer.prop.animate[k] != null) validateTrack(layer.prop.animate[k], p + '.prop.animate.' + k, errors);
      }
    }
    if ((layer.type === 'hero' || layer.type === 'figure') && layer.scale != null && !number(layer.scale)) errors.push(p + '.scale must be a finite number');
    if (layer.type === 'rect' && (!number(layer.w) || !number(layer.h) || typeof layer.fill !== 'string')) errors.push(p + ' rect needs numeric w/h and a fill color');
    if (layer.type === 'circle' && (!number(layer.radius) || typeof layer.fill !== 'string')) errors.push(p + ' circle needs numeric radius and a fill color');
    if (layer.type === 'cup' && (!number(layer.w) || !number(layer.h) || typeof layer.fill !== 'string')) errors.push(p + ' cup needs numeric w/h and a fill color');
    if (layer.type === 'line' && (!number(layer.x2) || !number(layer.y2) || !number(layer.width) || typeof layer.color !== 'string')) errors.push(p + ' line needs x2/y2/width and a color');
    if (layer.type === 'text' && (typeof layer.value !== 'string' || !number(layer.size) || typeof layer.color !== 'string')) errors.push(p + ' text needs value, size and color');
  });
  return errors;
}

function sample(track, t, fallback) {
  if (number(track)) return track;
  if (!track || !track.length) return fallback;
  if (t <= track[0].at) return track[0].value;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i];
    if (t <= b.at) {
      const fn = ease[b.ease || 'inOut'];
      return a.value + (b.value - a.value) * fn((t - a.at) / (b.at - a.at));
    }
  }
  return track[track.length - 1].value;
}
function animated(layer, key, t, fallback) {
  return sample(layer.animate && layer.animate[key], t, layer[key] == null ? fallback : layer[key]);
}

function propAt(prop, t) {
  if (!prop || typeof prop !== 'object' || !prop.animate) return prop;
  const out = { ...prop };
  for (const k of ['offsetX', 'offsetY', 'rot']) if (prop.animate[k]) out[k] = sample(prop.animate[k], t, prop[k] || 0);
  return out;
}

function drawLayer(g, item, t) {
  const x = animated(item, 'x', t, 0), y = animated(item, 'y', t, 0);
  const scale = animated(item, 'scale', t, 1), rotation = animated(item, 'rotation', t, 0);
  const opacity = clamp(animated(item, 'alpha', t, 1), 0, 1);
  g.save(); g.globalAlpha *= opacity;
  if (item.type === 'hero' || item.type === 'figure') {
    g.translate(x, y); if (rotation) g.rotate(rotation);
    const options = { x: 0, y: 0, s: scale, facing: item.facing === -1 ? -1 : 1,
      pose: POSES[item.pose || 'stand'], expr: item.expression || 'neutral',
      look: item.look, rim: item.rim === false ? false : (item.rim || undefined),
      outfit: item.type === 'figure' ? (item.outfit || {}) : undefined, prop: propAt(item.prop, t), contact: item.contact };
    if (item.type === 'hero') drawHero(g, options); else drawFigure(g, options);
  } else if (item.type === 'rect') {
    if (item.originCenter) { g.translate(x, y); if (rotation) g.rotate(rotation); }
    const rx = item.originCenter ? -item.w / 2 : x, ry = item.originCenter ? -item.h / 2 : y;
    if (item.shadow) { g.save(); g.globalAlpha *= 0.14; g.fillStyle = item.shadow; g.fillRect(rx + item.w * 0.04, ry + item.h * 0.08, item.w * 0.92, Math.max(2, item.h * 0.10)); g.restore(); }
    g.fillStyle = item.fill;
    if (item.emission > 0) { g.shadowColor = item.fill; g.shadowBlur = Math.min(10, item.emission * 8); }
    if (item.radius > 0) { rr(g, rx, ry, item.w, item.h, item.radius); g.fill(); } else g.fillRect(rx, ry, item.w, item.h);
    g.shadowBlur = 0;
    if (item.highlight) { g.save(); g.globalAlpha *= item.highlightAlpha ?? 0.24; g.fillStyle = item.highlight; g.fillRect(rx + item.w * 0.06, ry + 1, item.w * 0.88, Math.max(1, item.h * 0.035)); g.restore(); }
  } else if (item.type === 'circle') {
    if (item.originCenter) { g.translate(x, y); if (rotation) g.rotate(rotation); if (item.shadow) { g.save(); g.globalAlpha *= 0.16; g.fillStyle = item.shadow; g.beginPath(); g.ellipse(0, item.radius * 0.72, item.radius * 0.82, item.radius * 0.2, 0, 0, Math.PI * 2); g.fill(); g.restore(); } if (item.emission > 0) { g.shadowColor = item.fill; g.shadowBlur = Math.min(10, item.emission * 8); } circle(g, 0, 0, item.radius, item.fill); g.shadowBlur = 0; if (item.highlight) { g.save(); g.globalAlpha *= item.highlightAlpha ?? 0.28; circle(g, -item.radius * 0.28, -item.radius * 0.32, item.radius * 0.22, item.highlight); g.restore(); } }
    else { if (item.shadow) { g.save(); g.globalAlpha *= 0.16; g.fillStyle = item.shadow; g.beginPath(); g.ellipse(x, y + item.radius * 0.72, item.radius * 0.82, item.radius * 0.2, 0, 0, Math.PI * 2); g.fill(); g.restore(); } if (item.emission > 0) { g.shadowColor = item.fill; g.shadowBlur = Math.min(10, item.emission * 8); } circle(g, x, y, item.radius, item.fill); g.shadowBlur = 0; if (item.highlight) { g.save(); g.globalAlpha *= item.highlightAlpha ?? 0.28; circle(g, x - item.radius * 0.28, y - item.radius * 0.32, item.radius * 0.22, item.highlight); g.restore(); } }
  } else if (item.type === 'cup') {
    if (item.originCenter) { g.translate(x, y); if (rotation) g.rotate(rotation); }
    const cx = item.originCenter ? 0 : x, cy = item.originCenter ? 0 : y;
    const w = item.w, h = item.h, top = cy - h / 2, bottom = cy + h / 2;
    g.save();
    if (item.shadow) { g.save(); g.globalAlpha *= 0.16; g.fillStyle = item.shadow; g.beginPath(); g.ellipse(cx, bottom + h * 0.04, w * 0.42, Math.max(2, h * 0.07), 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    if (item.emission > 0) { g.shadowColor = item.fill; g.shadowBlur = Math.min(10, item.emission * 8); }
    g.fillStyle = item.fill;
    g.beginPath();
    g.moveTo(cx - w * 0.48, top + h * 0.12);
    g.lineTo(cx + w * 0.48, top + h * 0.12);
    g.lineTo(cx + w * 0.34, bottom);
    g.quadraticCurveTo(cx, bottom + h * 0.035, cx - w * 0.34, bottom);
    g.closePath();
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = item.handle || item.fill;
    g.lineWidth = Math.max(4, w * 0.11);
    g.beginPath();
    g.ellipse(cx + w * 0.48, cy + h * 0.02, w * 0.23, h * 0.2, 0, -Math.PI * 0.42, Math.PI * 0.42);
    g.stroke();
    g.fillStyle = item.rim || '#F0E9DF';
    g.beginPath();
    g.ellipse(cx, top + h * 0.12, w * 0.49, h * 0.075, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  } else if (item.type === 'line') {
    seg(g, [[x, y], [item.x2, item.y2]], item.width, item.color);
  } else if (item.type === 'text') {
    text(g, item.value, x, y, { size: item.size, color: item.color, font: item.font || FONTS.title,
      weight: item.weight || 700, align: item.align || 'center', glow: item.glow || 0 });
  }
  g.restore();
}

function compositionLayer(entity, frame, lighting = null) {
  const ppu = frame.height / 100;
  const p = entity.transform?.position || entity.position || { x: 0, y: 0 };
  const x = frame.width / 2 + p.x * ppu, y = frame.height / 2 + p.y * ppu;
  const scale = entity.transform?.scale ?? 1;
  const renderScale = (entity.type === 'hero' || entity.type === 'figure') ? scale * frame.height / 1080 : scale;
  const base = { x, y, rotation: entity.transform?.rotation || 0, scale: renderScale, alpha: entity.opacity ?? 1 };
  const style = entity.style || {}, geometry = entity.geometry || {}, material = entity.materialDef || {};
  const highlightAlpha = (material.roughness == null ? 0.24 : 0.08 + (1 - material.roughness) * 0.35) * (lighting?.highlightStrength ?? 1);
  if (entity.type === 'hero' || entity.type === 'figure') {
    const rim = entity.rim !== undefined ? entity.rim : (lighting?.rimColor ? { color: lighting.rimColor, w: lighting.rimWidth ?? 1.5, dir: [-0.8, -0.5] } : undefined);
    return { ...base, type: entity.type, pose: entity.pose || 'stand', facing: entity.facing,
      expression: entity.expression, look: entity.look, rim, outfit: entity.outfit };
  }
  if (entity.type === 'circle') return { ...base, type: 'circle', originCenter: true, radius: geometry.radius * ppu * scale, fill: style.fill || material.baseColor || '#D6A85F', highlight: style.highlight || material.highlightColor, highlightAlpha, shadow: style.shadow || material.shadowColor, emission: material.emission || 0 };
  if (entity.type === 'cup') return { ...base, type: 'cup', originCenter: true, w: geometry.width * ppu * scale, h: geometry.height * ppu * scale,
    fill: style.fill || material.baseColor || '#C7D5DC', handle: style.handle || material.baseColor, rim: style.rim || material.highlightColor, highlight: style.highlight || material.highlightColor, highlightAlpha, shadow: style.shadow || material.shadowColor, emission: material.emission || 0 };
  if (entity.type === 'rect' || entity.type === 'surface') {
    const w = geometry.width * ppu * scale, h = geometry.height * ppu * scale;
    return { ...base, type: 'rect', originCenter: true, w, h,
      fill: style.fill || material.baseColor || (entity.type === 'surface' ? '#76604E' : '#9AA0A6'), radius: (geometry.radius || 0) * ppu * scale, highlight: style.highlight || material.highlightColor, highlightAlpha, shadow: style.shadow || material.shadowColor, emission: material.emission || 0 };
  }
  return null;
}

export function registerComposedShot(spec) {
  const assetErrors = validateAssetReferences(spec);
  const resolvedAssets = assetErrors.length ? spec : resolveAssetReferences(spec);
  const templateErrors = validateTemplateRequest(resolvedAssets, DEFAULT_COMPOSITION_TEMPLATES);
  const errors = [...assetErrors, ...templateErrors, ...validateComposition(resolvedAssets)];
  if (errors.length) throw new Error('Visual DSL v2 ' + (spec && spec.id || '<unknown>') + ': ' + errors.join('; '));
  registerShot(spec.id, {
    kind: '2d',
    draw(g, t) {
      const { spec: expanded, resolved } = resolveCompositionTemplate(resolvedAssets, t, { width: E.W, height: E.H }, DEFAULT_COMPOSITION_TEMPLATES);
      const failures = resolved.diagnostics.filter(x => x.level === 'error');
      if (failures.length) throw new Error('Composition ' + spec.id + ': ' + failures.map(x => x.message).join('; '));
      g.save();
      if (expanded.environmentDef) drawEnvironment(g, expanded.environmentDef, expanded.lightingDef, { width: E.W, height: E.H });
      const camera = expanded.camera || {};
      const cx = sample(camera.x, t, 0) * E.H / 100;
      const cy = sample(camera.y, t, 0) * E.H / 100;
      const zoom = Math.max(0.01, sample(camera.zoom, t, 1));
      g.translate(E.W / 2, E.H / 2); g.scale(zoom, zoom); g.translate(-E.W / 2 - cx, -E.H / 2 - cy);
      if (spec.background) { g.fillStyle = spec.background.color; g.fillRect(0, 0, E.W, E.H); }
      const layers = resolved.entities
        .sort((a, b) => (a.transform?.z ?? a.z ?? 0) - (b.transform?.z ?? b.z ?? 0))
        .map(entity => compositionLayer(entity, { width: E.W, height: E.H }, expanded.lightingDef)).filter(Boolean);
      for (const layer of layers) drawLayer(g, layer, t);
      g.restore();
    },
  });
  return spec.id;
}

export function registerVisualShot(spec) {
  if (spec && spec.version === 2) return registerComposedShot(spec);
  const errors = validateVisualShot(spec);
  if (errors.length) throw new Error('Visual DSL ' + (spec && spec.id || '<unknown>') + ': ' + errors.join('; '));
  registerShot(spec.id, {
    kind: '2d',
    draw(g, t) {
      g.save();
      const camera = spec.camera || {};
      const cx = sample(camera.x, t, 0), cy = sample(camera.y, t, 0);
      const zoom = Math.max(0.01, sample(camera.zoom, t, 1));
      g.translate(E.W / 2, E.H / 2); g.scale(zoom, zoom); g.translate(-E.W / 2 - cx, -E.H / 2 - cy);
      if (spec.background) { g.fillStyle = spec.background.color; g.fillRect(0, 0, E.W, E.H); }
      for (const item of spec.layers) drawLayer(g, item, t);
      g.restore();
    },
  });
  return spec.id;
}
