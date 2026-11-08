// Visual DSL framing lint. Pure functions, no engine imports, so it runs in Node and in the browser.
// It checks the rendered *composition* (character size, cropping, story-object size), not JSON validity;
// validateVisualShot() in visual-dsl.js still owns validity.
//
// Optional metadata a DSL shot may carry (the renderer ignores both):
//   spec.framing  : one of FRAMING keys below ("wide", "medium", "two_shot", "interaction", "insert", "reveal")
//   layer.role    : "story_object" on the prop/ball/phone that carries the story beat
//
// Measured on the real rig (1080p logical frame): one hero scale unit is ~242 px tall, i.e. 22.4% of frame
// height, for stand / reach / phone poses. On-screen height = HERO_H * layer.scale * camera.zoom.

export const HERO_H = 242;            // px per scale unit, in the 1080-high logical frame
export const REF_H = 1080;            // logical frame height the constants above were measured in
export const FEET_PAD = 6;            // shadow extends this far below layer.y
export const BARS = { none: 0, wide: 60, scope: 138, thin: 30 }; // 16:9 letterbox bar heights (px per side)

// Allowed on-screen character height as a fraction of frame height. min is an error, max is a warning.
export const FRAMING = {
  wide:        { min: 0.42, max: 0.65, note: 'establishing wide: character still readable, environment still visible' },
  medium:      { min: 0.60, max: 0.85, note: 'medium single: character is the subject' },
  two_shot:    { min: 0.50, max: 0.75, note: 'two-shot: every character must be large enough to read' },
  interaction: { min: 0.60, max: 0.85, note: 'character-object interaction: actor, object and contact all visible' },
  insert:      { min: 0,    max: 0.65, note: 'insert/macro: the object is the subject; characters optional' },
  reveal:      { min: 0.30, max: 1.00, note: 'dramatic reveal: framing follows the reveal' },
};
export const UNSET_FRAMING_MIN = 0.40; // universal floor when a shot does not declare framing
export const STORY_OBJECT_MIN = 0.10;  // longest dimension of a story object, as a fraction of frame height
export const REACH_RANGE = 0.22;       // hand anchor must be within 0.22 hero-heights of the target centre
export const HAND_ANCHORS = Object.freeze({
  phone: [28, -166], holdFront: [36, -152], reach: [62, -204],
  reachBall: [62, -180], reachDown: [78, -116],
});
export const MAX_SAME_FRAMING_RUN = 3; // more consecutive shots with the same framing than this -> warn

const isChar = (l) => l && (l.type === 'hero' || l.type === 'figure');
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

const lintEase = {
  linear: (x) => clamp01(x),
  in: (x) => clamp01(x) ** 3,
  out: (x) => 1 - (1 - clamp01(x)) ** 3,
  inOut: (x) => { x = clamp01(x); return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2; },
  sine: (x) => -(Math.cos(Math.PI * clamp01(x)) - 1) / 2,
  outBack: (x) => { x = clamp01(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; },
  outElastic: (x) => { x = clamp01(x); return x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; },
};
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function sampleLinear(track, t, fallback) {
  if (!Array.isArray(track) || !track.length) return fallback;
  if (t <= track[0].at) return track[0].value;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i];
    if (t <= b.at) {
      const raw = (t - a.at) / Math.max(1e-6, b.at - a.at);
      const eased = (lintEase[b.ease] || lintEase.linear)(raw);
      return a.value + (b.value - a.value) * eased;
    }
  }
  return track[track.length - 1].value;
}
const layerVal = (l, k, t, d) => sampleLinear(l.animate && l.animate[k], t, num(l[k], d));

function trackEnd(tracks) { let m = 0; for (const tr of tracks) if (Array.isArray(tr)) for (const k of tr) m = Math.max(m, num(k.at, 0)); return m; }
function shotDuration(spec, opts) {
  if (num(opts.duration, 0) > 0) return opts.duration;
  const tracks = [];
  if (spec.camera) tracks.push(spec.camera.x, spec.camera.y, spec.camera.zoom);
  for (const l of spec.layers || []) if (l && l.animate) tracks.push(...Object.values(l.animate));
  return Math.max(1, trackEnd(tracks));
}
function times(d) { const out = []; for (let t = 0; t <= d + 1e-9; t += Math.min(0.1, d / 10)) out.push(+t.toFixed(3)); if (out[out.length - 1] < d) out.push(d); return out; }

/** Camera at time t -> world->screen mapping used by the DSL renderer (zoom about frame centre). */
function camAt(spec, t, W, H) {
  const c = spec.camera || {};
  const z = Math.max(0.01, sampleLinear(c.zoom, t, 1)), cx = sampleLinear(c.x, t, 0), cy = sampleLinear(c.y, t, 0);
  return { z, toX: (x) => (x - W / 2 - cx) * z + W / 2, toY: (y) => (y - H / 2 - cy) * z + H / 2 };
}

/**
 * Lint one DSL shot.
 * @param {object} spec  parsed scenes/visual/<id>.json
 * @param {{W?:number,H?:number,bars?:number,duration?:number}} opts frame size, letterbox bar height per side, shot length (s)
 * @returns {{level:'error'|'warn', code:string, message:string}[]}
 */
export function lintVisualShot(spec, opts = {}) {
  const out = [];
  const add = (level, code, message) => out.push({ level, code, message });
  if (!spec || !Array.isArray(spec.layers)) return out;
  const W = num(opts.W, 1920), H = num(opts.H, 1080), bars = num(opts.bars, 0);
  const k = H / REF_H;                       // scale constants if the logical frame is not 1080 high
  const heroH = HERO_H * k;
  const dur = shotDuration(spec, opts), ts = times(dur);
  const chars = spec.layers.filter(isChar);
  const framing = spec.framing;
  const rule = FRAMING[framing];

  if (framing == null) add('warn', 'framing-missing', 'shot has no "framing"; set one of ' + Object.keys(FRAMING).join(', ') + ' so size rules can be checked (using a ' + UNSET_FRAMING_MIN * 100 + '% floor).');
  else if (!rule) add('warn', 'framing-unknown', 'unknown framing "' + framing + '"; expected one of ' + Object.keys(FRAMING).join(', ') + '.');

  // ---- character size -------------------------------------------------------------------------------------
  const min = rule ? rule.min : UNSET_FRAMING_MIN, max = rule ? rule.max : 1;
  const heights = chars.map((l) => {
    let lo = Infinity, hi = 0;
    for (const t of ts) { const s = layerVal(l, 'scale', t, 1) * heroH * camAt(spec, t, W, H).z / H; lo = Math.min(lo, s); hi = Math.max(hi, s); }
    return { l, lo, hi };
  });
  for (const { l, lo, hi } of heights) {
    const who = (l.type === 'hero' ? 'hero' : 'figure') + ' at x=' + num(l.x, 0);
    if (lo + 1e-6 < min) add('error', 'character-too-small', who + ' is ' + Math.round(lo * 100) + '% of frame height; ' + (framing || 'unset framing') + ' needs at least ' + Math.round(min * 100) + '% (raise scale to about ' + (min * H / heroH / (camAt(spec, 0, W, H).z)).toFixed(1) + ' at zoom ' + camAt(spec, 0, W, H).z.toFixed(2) + ').');
    if (hi > max + 1e-6) add('warn', 'character-too-large', who + ' reaches ' + Math.round(hi * 100) + '% of frame height; ' + framing + ' is meant to stay under ' + Math.round(max * 100) + '%.');
  }

  // ---- cropping and placement ----------------------------------------------------------------------------
  for (const l of chars) {
    if (l.crop === true) continue;           // deliberate crop (foreground over-the-shoulder figure, etc.)
    let feetOut = 0, headOut = 0, xOut = 0;
    for (const t of ts) {
      const cam = camAt(spec, t, W, H), s = layerVal(l, 'scale', t, 1), x = layerVal(l, 'x', t, 0), y = layerVal(l, 'y', t, 0);
      const feet = cam.toY(y + FEET_PAD * s), head = cam.toY(y - heroH * s), sx = cam.toX(x);
      feetOut = Math.max(feetOut, feet - (H - bars));
      headOut = Math.max(headOut, bars - head);
      if (sx < W * 0.1 || sx > W * 0.9) xOut = Math.max(xOut, 1);
    }
    const who = (l.type === 'hero' ? 'hero' : 'figure') + ' at x=' + num(l.x, 0);
    if (feetOut > 0) add('error', 'feet-cropped', who + ': feet fall ' + Math.round(feetOut) + 'px below the visible frame (letterbox bar ' + bars + 'px). Add a camera.y track or lower the scale. Set "crop": true on the layer if intentional.');
    if (headOut > 0) add('error', 'head-cropped', who + ': head reaches ' + Math.round(headOut) + 'px into the top letterbox/edge. Lower the scale or raise the camera.');
    if (xOut) add('warn', 'off-centre', who + ' leaves the central 80% of the frame width at some point in the shot.');
  }

  // ---- story objects --------------------------------------------------------------------------------------
  const objs = spec.layers.filter((l) => l && l.role === 'story_object');
  for (const o of objs) {
    const dim = o.type === 'circle' ? 2 * num(o.radius, 0) : Math.max(num(o.w, 0), num(o.h, 0));
    let zMin = Infinity; for (const t of ts) zMin = Math.min(zMin, camAt(spec, t, W, H).z);
    if (dim * zMin < STORY_OBJECT_MIN * H) add('error', 'story-object-small', 'story object (' + o.type + ' at ' + num(o.x, 0) + ',' + num(o.y, 0) + ') is ' + Math.round(dim * zMin) + 'px at its smallest; it needs at least ' + Math.round(STORY_OBJECT_MIN * H) + 'px (' + STORY_OBJECT_MIN * 100 + '% of frame height) to read as an important object.');
  }
  const hasAttachedProp = chars.some((l) => !!l.prop);
  if (framing === 'interaction' && !objs.length && !hasAttachedProp) add('warn', 'interaction-no-object', 'interaction framing but no story_object layer or hand-attached prop is declared.');
  for (const l of chars) {
    const hand = HAND_ANCHORS[l.pose];
    if (!hand) continue;
    const contact = l.contact && typeof l.contact === 'object' ? l.contact : null;
    const hasWindow = contact && Number.isFinite(contact.from) && Number.isFinite(contact.to);
    const window = hasWindow ? { from: contact.from, to: contact.to } : null;
    const sampleTimes = window
      ? [...new Set([...ts, window.from, window.to].filter((t) => t >= window.from && t <= window.to))].sort((a, b) => a - b)
      : ts;

    if (!objs.length) {
      if (l.prop) continue;
      add('warn', 'reach-no-target', 'hero uses hand pose "' + l.pose + '" but the shot has no story_object or attached prop to reach for.');
      continue;
    }

    const targets = window && Number.isInteger(contact.target)
      ? [spec.layers[contact.target]]
      : objs;
    if (window && (!targets.length || !targets[0] || targets[0].role !== 'story_object')) continue;

    let best = Infinity, worst = 0, worstAt = window ? window.from : 0;
    for (const t of sampleTimes) {
      const s = layerVal(l, 'scale', t, 1), facing = l.facing === -1 ? -1 : 1;
      const hx = layerVal(l, 'x', t, 0) + hand[0] * s * facing;
      const hy = layerVal(l, 'y', t, 0) + hand[1] * s;
      let nearest = Infinity;
      for (const o of targets) {
        const ox = layerVal(o, 'x', t, 0) + (o.type === 'rect' ? num(o.w, 0) / 2 : 0);
        const oy = layerVal(o, 'y', t, 0) + (o.type === 'rect' ? num(o.h, 0) / 2 : 0);
        nearest = Math.min(nearest, Math.hypot(ox - hx, oy - hy) / (heroH * s));
      }
      best = Math.min(best, nearest);
      if (nearest > worst) { worst = nearest; worstAt = t; }
    }

    if (window) {
      const tolerance = num(contact.tolerance, REACH_RANGE);
      if (contact.hand === 'B') {
        add('error', 'contact-hand-unsupported', 'time-window contact lint currently requires hand "F"; use the near-hand anchor or add a registered far-hand anchor.');
      } else if (worst > tolerance) {
        add('error', 'contact-breaks-during-window', 'hand-to-target distance reaches ' + worst.toFixed(2) + ' hero-heights at ' + worstAt.toFixed(2) + 's inside the contact window (limit ' + tolerance + '); keep the target within contact for the entire window.');
      }
    } else {
      add('error', 'contact-window-missing', 'hand-to-object interaction has no declared contact window; add contact.from/contact.to for the full interval in which the hand must stay on the target.');
    }
  }

  // ---- attached prop contact -------------------------------------------------------------------------------
  // A declared contact window is checked at every sampled time; without one, preserve the final-landing check.
  for (const l of chars) {
    if (!l.prop) continue;
    const hand = HAND_ANCHORS[l.pose];
    if (!hand) {
      add('error', 'prop-no-hand-anchor', 'character has an attached prop but pose "' + l.pose + '" has no registered hand anchor; use a supported contact pose.');
      continue;
    }
    const p = typeof l.prop === 'string' ? { type: l.prop } : l.prop;
    const contact = l.contact && typeof l.contact === 'object' ? l.contact : null;
    const hasWindow = contact && Number.isFinite(contact.from) && Number.isFinite(contact.to);
    const window = hasWindow ? { from: contact.from, to: contact.to } : null;
    const offsetTracks = [p.animate && p.animate.offsetX, p.animate && p.animate.offsetY].filter(Array.isArray);
    const hasOffsetMotion = offsetTracks.some((track) => track.length > 1 && track.some((kf) => kf.value !== track[0].value));
    if (hasOffsetMotion && !window) {
      add('error', 'prop-contact-window-missing', 'attached ' + (p.type || 'prop') + ' has animated hand offsets but no declared contact window; specify contact.from/contact.to for the interval when it must remain gripped.');
    }
    const sampleTimes = window
      ? [...new Set([...ts, window.from, window.to].filter((t) => t >= window.from && t <= window.to))].sort((a, b) => a - b)
      : ts;
    if (window && window.to > dur + 1e-6) add('error', 'contact-window-out-of-range', 'contact window ends at ' + window.to.toFixed(2) + 's, after the shot duration ' + dur.toFixed(2) + 's.');
    let worst = 0, worstAt = sampleTimes[0] || dur;
    for (const t of sampleTimes) {
      const offsetX = sampleLinear(p.animate && p.animate.offsetX, t, num(p.offsetX, 0));
      const offsetY = sampleLinear(p.animate && p.animate.offsetY, t, num(p.offsetY, 0));
      const scale = Math.max(0.01, layerVal(l, 'scale', t, 1));
      const distance = Math.hypot(offsetX, offsetY) / (heroH * scale);
      if (distance > worst) { worst = distance; worstAt = t; }
    }
    const tolerance = num(contact && contact.tolerance, REACH_RANGE);
    if (worst > tolerance) {
      add('error', window ? 'prop-breaks-during-contact-window' : 'prop-detached-at-end',
        'attached ' + (p.type || 'prop') + (window ? ' reaches ' : ' finishes ') + worst.toFixed(2) +
        ' hero-heights from its hand anchor' + (window ? ' at ' + worstAt.toFixed(2) + 's inside the contact window' : '') +
        ' (limit ' + tolerance + '); bring its offset back to the hand.');
    }
  }

  // ---- camera -----------------------------------------------------------------------------------------------
  const c = spec.camera || {};
  const moves = ['x', 'y', 'zoom'].some((a) => Array.isArray(c[a]) && c[a].length > 1 && c[a].some((kf) => kf.value !== c[a][0].value));
  if (!moves) add('warn', 'no-camera-motion', 'camera is static; the style bible asks for one motivated camera move per shot.');
  return out;
}

/**
 * Sequence rules across a whole project.
 * @param {{id:string, spec:object}[]} shots in timeline order
 */
export function lintVisualSequence(shots) {
  const out = []; let run = 0, prev = null;
  for (const { id, spec } of shots) {
    const f = spec && spec.framing;
    if (f && f === prev) run++; else run = f ? 1 : 0;
    if (f && run > MAX_SAME_FRAMING_RUN) out.push({ shot: id, level: 'warn', code: 'framing-repeat', message: run + ' consecutive "' + f + '" shots; vary the framing (max ' + MAX_SAME_FRAMING_RUN + ' in a row).' });
    prev = f || null;
  }
  return out;
}
