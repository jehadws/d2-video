// Structured Visual DSL v1. Declarative, deterministic 2D shots; no executable scene code.
import { E, registerShot, ease, clamp, rr, circle, seg, text, FONTS } from './core.js';
import { drawHero } from './characters.js';
import { drawFigure, POSES } from './rig2d.js';

const TYPES = new Set(['hero', 'figure', 'rect', 'circle', 'line', 'text']);
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
    if ((layer.type === 'hero' || layer.type === 'figure') && layer.scale != null && !number(layer.scale)) errors.push(p + '.scale must be a finite number');
    if (layer.type === 'rect' && (!number(layer.w) || !number(layer.h) || typeof layer.fill !== 'string')) errors.push(p + ' rect needs numeric w/h and a fill color');
    if (layer.type === 'circle' && (!number(layer.radius) || typeof layer.fill !== 'string')) errors.push(p + ' circle needs numeric radius and a fill color');
    if (layer.type === 'line' && (!number(layer.x2) || !number(layer.y2) || !number(layer.width) || typeof layer.color !== 'string')) errors.push(p + ' line needs x2/y2/width and a color');
    if (layer.type === 'text' && (typeof layer.value !== 'string' || !number(layer.size) || typeof layer.color !== 'string')) errors.push(p + ' text needs value, size and color');
  });
  return errors;
}

function sample(track, t, fallback) {
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
      outfit: item.type === 'figure' ? (item.outfit || {}) : undefined };
    if (item.type === 'hero') drawHero(g, options); else drawFigure(g, options);
  } else if (item.type === 'rect') {
    g.fillStyle = item.fill; if (item.radius > 0) { rr(g, x, y, item.w, item.h, item.radius); g.fill(); } else g.fillRect(x, y, item.w, item.h);
  } else if (item.type === 'circle') {
    circle(g, x, y, item.radius, item.fill);
  } else if (item.type === 'line') {
    seg(g, [[x, y], [item.x2, item.y2]], item.width, item.color);
  } else if (item.type === 'text') {
    text(g, item.value, x, y, { size: item.size, color: item.color, font: item.font || FONTS.title,
      weight: item.weight || 700, align: item.align || 'center', glow: item.glow || 0 });
  }
  g.restore();
}

export function registerVisualShot(spec) {
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
