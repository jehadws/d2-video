// shots/08_blueprint.js — the attention-funnel diagram: a normal brain vs. one whose gate never closes.
import { E, V, registerShot, layer, ease, clamp, lerp, rng, alpha, seg, circle, ring, glow } from '/engine/core.js';
import { POSES } from '/engine/rig2d.js';
import { drawHero } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { voidSet } from '../sets/void.js';

// Blueprint side view of a head with a brain in it; `lit` is how hard it is working.
function headProfile(g, x, y, r, o = {}) {
  const c = o.color || UI.bpStroke(), w = Math.max(2, r * 0.05), lit = o.lit ?? 0;
  if (lit > 0.02) glow(g, x, y - r * 0.15, r * 2.2, o.glowColor || '#7fd0d6', 0.3 * lit);
  seg(g, [[x - r * 0.86, y + r * 1.15], [x - r * 0.95, y - r * 0.05], [x - r * 0.62, y - r * 0.92], [x + r * 0.3, y - r * 1.06],
    [x + r * 0.95, y - r * 0.4], [x + r * 0.72, y + r * 0.3], [x + r * 1.02, y + r * 0.66], [x + r * 0.26, y + r * 0.78], [x - r * 0.1, y + r * 1.15]], w, c);
  for (const [dx, dy, br] of [[-0.26, -0.42, 0.4], [0.2, -0.52, 0.34], [0.42, -0.16, 0.3], [-0.02, -0.12, 0.32]]) {
    ring(g, x + dx * r, y + dy * r, br * r, w * 0.8, lit > 0.4 ? alpha(o.glowColor || '#9fe8ff', 0.55 + 0.4 * lit) : alpha(c, 0.85));
  }
  seg(g, [[x - r * 0.1, y + r * 1.15], [x - r * 0.16, y + r * 1.62], [x + r * 0.32, y + r * 1.64]], w, c);
}

const funnelGeo = () => {
  const cx = E.W * V(0.46, 0.5), mouthY = E.H * V(0.34, 0.3), spoutY = E.H * V(0.58, 0.54);
  return { cx, mouthY, spoutY, halfW: V(420, 330), spoutW: V(54, 46), head: [E.W * V(0.46, 0.5), E.H * V(0.78, 0.72)], headR: V(128, 110) };
};

function funnel(g, G, o) {
  const c = UI.bpStroke();
  seg(g, [[G.cx - G.halfW, G.mouthY], [G.cx - G.spoutW, G.spoutY], [G.cx - G.spoutW, G.spoutY + 52],
    [G.cx + G.spoutW, G.spoutY + 52], [G.cx + G.spoutW, G.spoutY], [G.cx + G.halfW, G.mouthY]], 4, c);
  const gap = lerp(14, 240, o.open);
  g.save(); g.globalAlpha = 0.55;
  for (let i = 1; i <= 5; i++) {
    const u = i / 6, y = lerp(G.mouthY, G.spoutY, u), hw = lerp(G.halfW, G.spoutW, u);
    for (let x = G.cx - hw; x < G.cx + hw; x += gap) seg(g, [[x, y], [Math.min(x + gap * 0.4, G.cx + hw), y]], 3, c);
  }
  g.restore();
}

// Where signal dot i is at u along its route: fall, land on the wall, then pass through or get thrown out.
function signalAt(G, i, u, passes, o) {
  const r = rng(400 + i * 7);
  const x0 = G.cx + (r() - 0.5) * G.halfW * 1.8, phase = r();
  const slide = clamp((x0 - G.cx) / G.halfW);
  const landY = lerp(G.mouthY, G.spoutY, Math.abs(slide));
  const landX = x0;
  if (u < 0.34) {
    const k = u / 0.34;
    return { x: lerp(x0, landX, k), y: lerp(-70 - phase * 200, landY, ease.in(k * 0.9 + 0.1)), passes, size: 5 + phase * 4 };
  }
  if (!passes) {                                          // thrown back out over the right wall
    const k = (u - 0.34) / 0.66;
    return { x: lerp(landX, E.W * 1.15, ease.out(k)), y: lerp(landY, G.mouthY - 40 - phase * 180, ease.out(k) * 0.8), passes, size: 5 };
  }
  const k = (u - 0.34) / 0.66;
  if (k < 0.5) {                                          // slide down the wall into the spout
    const s = k / 0.5;
    return { x: lerp(landX, G.cx + Math.sign(slide || 1) * G.spoutW * 0.4, ease.inOut(s)), y: lerp(landY, G.spoutY + 46, ease.in(s)), passes, size: 5.5 };
  }
  const s = (k - 0.5) / 0.5;                              // drop through the neck into the brain
  return { x: lerp(G.cx, G.head[0], s), y: lerp(G.spoutY + 46, G.head[1] - G.headR * 0.5, ease.out(s)), passes, size: 5.5 };
}

function diagram(g, t, info, o) {
  const p = ease.inOut(info.p);
  const cam = { z: 1 + 0.03 * p, x: lerp(-20, 24, p), y: lerp(12, -18, p) };
  const M = voidSet(g, t, cam, { mood: 'void', gridAlpha: 0.05, dust: true }).M;
  const G = funnelGeo();
  const frac = lerp(0.012, 0.98, o.open), rd = rng(11);
  layer(g, cam, 1, (h) => {
    funnel(h, G, o);
    for (let i = 0; i < o.count; i++) {
      const u = ((t * o.speed + i * 0.0617) % 1) ;
      const pass = rd() < frac;
      const s = signalAt(G, i, u, pass, o);
      const col = s.passes ? M.key : alpha('#9fb4d8', 0.72);
      circle(h, s.x, s.y, s.size, col);
      if (s.passes && u > 0.7) glow(h, s.x, s.y, 30, M.key, 0.22);
    }
    headProfile(h, G.head[0], G.head[1], G.headR, { lit: o.lit, glowColor: o.litColor });
    UI.callout(h, t, { at: [G.cx - G.halfW * 0.72, G.mouthY - 30], to: [V(330, 260), V(150, 210)], str: 'INPUT 100 %', color: '#dfe8ff', start: 0.35 });
    UI.callout(h, t, { at: [G.cx + G.halfW * 0.55, G.mouthY - 70], to: [E.W - V(340, 300), V(150, 210)], str: o.wasteLabel, color: '#9fb4d8', start: 1.0 });
    UI.callout(h, t, { at: [G.head[0] + G.headR * 0.7, G.head[1] - G.headR * 0.4], to: [E.W * 0.78, G.head[1] - V(120, 180)], str: o.passLabel, color: M.key, start: 1.7 });
    o.extra?.(h, G, t, info);
  });
  UI.readout(g, { label: o.metricLabel, value: o.metricValue, x: V(150, 110), y: E.H - V(150, 400), color: o.open > 0.5 ? '#ff9a6a' : UI.bpStroke(), size: V(52, 46) });
  return G;
}

// s058 — "A normal brain filters out ninety nine percent of what it senses."
registerShot('s058', { draw(g, t, info) {
  diagram(g, t, info, {
    open: 0, speed: 0.34, count: 120, lit: 0.25, litColor: '#7fd0d6',
    wasteLabel: 'FILTERED 99 %', passLabel: 'PASSED 1 %', metricLabel: 'FILTERED OUT', metricValue: '99 %',
  });
} });

// s059 — "Yours filters out almost nothing."  the gate stands open and the hero is under it
registerShot('s059', { draw(g, t, info) {
  diagram(g, t, info, {
    open: 1, speed: 0.52, count: 120, lit: 1, litColor: '#ff9a6a',
    wasteLabel: 'NOISE', passLabel: 'EVERYTHING', metricLabel: 'FILTERED OUT', metricValue: '2 %',
    extra: (h, G, t2) => {
      drawHero(h, {
        x: G.cx + V(700, 470), y: E.H * V(0.9, 0.86), s: V(2.05, 1.9), facing: -1,
        pose: { ...POSES.handsOnHead, head: POSES.handsOnHead.head }, expr: 'scared',
        rim: { color: '#ff9a6a', dir: [-0.75, -0.66], w: 4 }, blink: (t2 % 2.6) > 2.5,
      });
    },
  });
  const G = funnelGeo();
  FX.speedLines(g, t, { cx: G.head[0], cy: G.head[1], count: 22, inner: V(230, 190), a: 0.14, color: '#ffd7b0' });
} });
