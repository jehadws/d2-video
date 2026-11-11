// sets/gfx.js — small shared graphics: stamps, task cards and deterministic counters.
import { E, V, rr, seg, poly, circle, ring, alpha, shade, glow, text, measure, FONTS, ease, prog, clamp, lerp, wordTime } from '/engine/core.js';

// A slammed-in badge stamp: drops, shrinks onto the target and shakes the frame slightly.
export function stamp(g, x, y, s, str, o = {}) {
  const k = o.k ?? 1, drop = 1 - ease.out(clamp(k));
  g.save(); g.translate(x, y - drop * 260 * s); g.rotate((o.rot ?? -0.14) * (1 - drop) + drop * 0.5);
  const sc = (1 + drop * 0.6) * s * (k > 0.9 ? 1 + 0.03 * Math.sin(k * 40) : 1);
  g.scale(sc, sc);
  const w = Math.max(120, measure(g, str, 44, FONTS.ui, 900) + 70);
  rr(g, -w / 2, -34, w, 68, 10); g.fillStyle = alpha(o.color || '#e04a3a', 0.92 * (0.4 + 0.6 * k)); g.fill();
  g.strokeStyle = alpha('#ffffff', 0.75 * k); g.lineWidth = 4; g.stroke();
  text(g, str, 0, 2, { size: 44, color: '#fff', font: FONTS.ui, weight: 900, alpha: k });
  g.restore();
  if (k > 0.85 && o.rings !== false) { for (let i = 0; i < 2; i++) ring(g, x, y, 60 + i * 70 + (k - 0.85) * 300, 3, alpha(o.color || '#e04a3a', 0.3 * (1 - k) * 6)); }
}

// Flat task card the stamps land on.
export function taskCard(g, x, y, s, str, o = {}) {
  const w = (o.w ?? 210) * s, h = (o.h ?? 74) * s;
  g.save(); g.translate(x, y); g.rotate(o.rot ?? 0);
  rr(g, -w / 2, -h / 2, w, h, 8 * s); g.fillStyle = o.color || '#efe7d6'; g.fill();
  g.strokeStyle = alpha('#1a1c24', 0.22); g.lineWidth = 2.5 * s; g.stroke();
  g.fillStyle = alpha('#1a1c24', 0.55); g.fillRect(-w / 2 + 14 * s, h * 0.12, w * 0.6, 4 * s);
  text(g, str, -w / 2 + 14 * s, -h * 0.18, { size: 24 * s, color: o.ink || '#22283a', font: FONTS.ui, weight: 900, align: 'left' });
  g.restore();
}

// Time at which the nth spoken occurrence of a word lands (1-based).
export function wordOccurrence(match, after, n = 1) {
  let t = after;
  for (let i = 0; i < n; i++) { const nt = wordTime(match, t); if (nt === null) return null; t = nt + 0.05; }
  return t - 0.05;
}

// Count-up string for readouts: counts to `to` between t0 and t0+dur.
export function countTo(t, t0, dur, to, o = {}) {
  const p = ease.out(prog(t, t0, t0 + dur));
  const v = Math.round(lerp(o.from ?? 0, to, p));
  return (o.pad ? String(v).padStart(o.pad, '0') : v.toLocaleString('en-US')) + (o.suffix || '');
}

// Three taps then one: the knock code as expanding rings.
export function knocks(g, x, y, t, o = {}) {
  const hits = o.hits ?? [0, 0.22, 0.44, 0.86], col = o.color || '#ffe9c4';
  hits.forEach((h, i) => {
    const k = prog(t, o.start + h, o.start + h + 0.5);
    if (k <= 0 || k >= 1) return;
    ring(g, x, y, (o.r0 ?? 30) + k * (o.r1 ?? 150), (i === 3 ? 5 : 3) * (1 - k), alpha(col, (1 - k) * (o.a ?? 0.6)));
    if (k < 0.2) glow(g, x, y, (i === 3 ? 220 : 150) * (1 - k), col, 0.2 * (1 - k));
  });
}

export function vignetteFocus(g, x, y, r, a = 0.55) {
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = radialFade(g, x, y, r); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.restore();
}
function radialFade(g, x, y, r) {
  const grd = g.createRadialGradient(x, y, r * 0.2, x, y, r);
  grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  return grd;
}
