// shots/03_school.js — s027–s031: the four-minute exam, Leo's blank extra time, three more proofs, "For fun."
import { E, V, registerShot, layer, S, mood, ease, prog, clamp, alpha, shade, rr, linGrad, seg, poly, circle, ring, glow, text, wordTime, FONTS, lerp, blurLayer, veil, talkAmount } from '/engine/core.js';
import { POSES, breathe, drawFigure, bigFace } from '/engine/rig2d.js';
import { drawHero, drawHeroFace, heroHeadPosition } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { classroom, schoolDesk, answerSheet } from '../sets/class.js';
import { stamp } from '../sets/gfx.js';
import { LEO } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };              // the hero's deadpan (EXPR has no 'flat')
const GOLD = () => S().ui.gold;
const CREAM = () => S().ui.cream;
const BP = () => S().ui.blueprint;

const clockStr = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// A pen with its cap still on: the rig has no props for stationery, so this shot carries its own.
function cappedPen(g, x, y, s, rot, o = {}) {
  const c = o.color || '#1d2436', clip = o.clip || GOLD();
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  rr(g, -110, -13, 220, 26, 13); g.fillStyle = c; g.fill();
  rr(g, -110, -13, 74, 26, 13); g.fillStyle = shade(c, 0.18); g.fill();            // the cap
  seg(g, [[-36, -12], [-36, 12]], 3, shade(c, -0.4));                               // cap ring
  seg(g, [[-96, -19], [-30, -19]], 6, clip);                      // pocket clip
  poly(g, [[110, -13], [142, -4], [142, 4], [110, 13]], shade(c, 0.1));              // nib end
  g.fillStyle = alpha('#ffffff', 0.22); g.fillRect(-100, -9, 190, 4);
  g.restore();
  glow(g, x, y, 190 * s, clip, 0.07);
}

// The rows of answerSheet() that are "filled in", redrawn in the sheet's own local space.
// Geometry mirrors sets/class.js answerSheet: ry = -h/2 + 22s + i*17s, letter at -w/2 + 12s, bubble at -w/2 + 18s.
function filledRows(g, s, k, col) {
  const w = 210 * s, h = 132 * s, n = Math.round(clamp(k) * 6);
  const L = ['A', 'C', 'B', 'D', 'A', 'C'];
  for (let i = 0; i < n; i++) {
    const ry = -h / 2 + 22 * s + i * 17 * s;
    g.fillStyle = col; g.font = `900 ${15 * s}px ${FONTS.ui}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(L[i], -w / 2 + 12 * s, ry + 4 * s);
    circle(g, -w / 2 + 18 * s, ry + 2 * s, 6 * s, alpha(col, 0.85));
    g.fillStyle = alpha(col, 0.5); g.fillRect(-w / 2 + 34 * s, ry, w * 0.52 * (0.4 + 0.6 * ((i % 3) / 2 + 0.4)), 4 * s);
  }
}

// One small blueprint "proof": dark plate, gold key line, a caption that only shows once drawn.
function proofCard(g, x, y, w, h, title, k, kind) {
  if (k <= 0) return;
  const kk = clamp(k), pop = 0.9 + 0.1 * ease.outBack(kk);
  g.save(); g.translate(x, y); g.scale(pop, pop); g.rotate((kind % 2 ? 1 : -1) * 0.035);
  g.globalAlpha *= kk;
  rr(g, -w / 2, -h / 2, w, h, 10); g.fillStyle = alpha(S().ui.card, 0.88); g.fill();
  g.strokeStyle = alpha(GOLD(), 0.45); g.lineWidth = 2.5; g.stroke();
  const m = 16;                                                        // drawing margin
  const cx = -w / 2 + m, cy = -h / 2 + m, dw = w - m * 2, dh = h - m * 2 - 18;
  if (kind === 0) {                                                    // right triangle + its circumscribed circle
    const R = Math.min(dw, dh) * 0.44, ox = cx + dw / 2, oy = cy + dh / 2;
    ring(g, ox, oy, R, 2.5, alpha(BP(), 0.7));
    poly(g, [[ox - R, oy + R * 0.6], [ox + R, oy + R * 0.6], [ox - R, oy - R * 0.7]], alpha(GOLD(), 0.9));
    circle(g, ox - R, oy + R * 0.6, 4, GOLD());
    seg(g, [[ox - R, oy + R * 0.6], [ox + R, oy - R * 0.7]], 2, alpha(GOLD(), 0.6));
  } else if (kind === 1) {                                             // a converging series: bars halving
    const n = 6, bw = dw / (n * 1.6);
    for (let i = 0; i < n; i++) {
      const bh = dh * 0.86 * Math.pow(0.62, i);
      g.fillStyle = alpha(i ? BP() : GOLD(), i ? 0.75 : 0.95);
      g.fillRect(cx + i * bw * 1.6, cy + dh - bh, bw, bh);
    }
    seg(g, [[cx, cy + dh], [cx + dw, cy + dh]], 2, alpha(BP(), 0.8));
  } else {                                                             // angle bisector: two rays + an arc
    const ox = cx + dw * 0.1, oy = cy + dh * 0.9, L = Math.min(dw, dh) * 0.9;
    seg(g, [[ox, oy], [ox + L, oy]], 2.5, alpha(GOLD(), 0.9));
    seg(g, [[ox, oy], [ox + Math.cos(-1.0) * L, oy + Math.sin(-1.0) * L]], 2.5, alpha(GOLD(), 0.9));
    seg(g, [[ox, oy], [ox + Math.cos(-0.5) * L * 0.9, oy + Math.sin(-0.5) * L * 0.9]], 2, alpha(BP(), 0.9));
    g.save(); g.setLineDash([7, 6]); g.strokeStyle = alpha(BP(), 0.6); g.lineWidth = 2;
    g.beginPath(); g.arc(ox, oy, L * 0.4, -1.0, 0); g.stroke(); g.restore();
  }
  text(g, title, 0, h / 2 - 16, { size: V(20, 22), color: alpha(CREAM(), 0.8), font: FONTS.ui, weight: 900, spacing: 1.5 });
  g.restore();
}

// s027 — "At school, you finish a two hour exam in four minutes."  tabletop insert: the sheet fills, the clock collapses.
registerShot('s027', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('day');
  blurLayer(g, 9, (g2) => classroom(g2, t, { z: lerp(1.26, 1.34, p), x: lerp(30, 6, p), y: 150 }, { mood: 'day' }));
  const tFour = (wordTime('four', info.shot.start) ?? info.shot.start + 2.2) - info.shot.start;
  const k = ease.inOut(clamp(prog(t, 0.12, Math.max(0.7, tFour))));
  const drift = lerp(-14, 10, p);
  g.save(); g.translate(drift, lerp(12, -6, p));
  const quad = [[E.W * -0.06, E.H * 1.02], [E.W * 0.12, E.H * 0.38], [E.W * 0.94, E.H * 0.32], [E.W * 1.06, E.H * 0.98]];
  g.fillStyle = linGrad(g, 0, E.H * 0.32, 0, E.H, [shade('#4a3a34', 0.06), '#3a2c2a', shade('#3a2c2a', -0.3)]);
  poly(g, quad, g.fillStyle);
  g.save(); g.globalCompositeOperation = 'lighter';
  seg(g, [quad[1], quad[2]], 4, alpha(M.rim, 0.3));
  for (let i = 1; i <= 3; i++) seg(g, [[lerp(quad[1][0], quad[2][0], i / 4), lerp(quad[1][1], quad[2][1], i / 4)], [lerp(quad[0][0], quad[3][0], i / 4), lerp(quad[0][1], quad[3][1], i / 4)]], 2, alpha('#ffe6bd', 0.06));
  g.restore();
  const sx = E.W * 0.42, sy = E.H * 0.6, ss = V(1.9, 1.5);
  g.save(); g.translate(sx, sy); g.scale(1, 0.82);                    // the paper lying flat on the desk
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 26; g.shadowOffsetY = 12;
  answerSheet(g, 0, 0, ss, { filled: 'none', rot: -0.05 }); g.restore();
  g.save(); g.translate(0, 0); g.rotate(-0.05); filledRows(g, ss, k, '#2b3550'); g.restore();
  g.restore();
  glow(g, sx, sy, V(360, 300), GOLD(), 0.07 * k);
  cappedPen(g, sx + V(300, 250), sy + V(120, 100), V(1.15, 0.95), -0.32);
  const click = clamp(prog(t, Math.max(0.7, tFour), Math.max(0.7, tFour) + 0.22));
  if (click > 0) FX.rings(g, sx + V(300, 250), sy + V(120, 100), t, { count: 2, r0: 26, r1: 90, speed: 2.2, color: GOLD(), a: 0.32 * (1 - click) });
  g.restore();
  UI.readout(g, { label: 'EXAM', value: clockStr(lerp(7200, 240, k)), x: E.W * 0.73, y: E.H * 0.36, color: alpha(CREAM(), 0.85), size: V(52, 48), align: 'left' });
  UI.readout(g, { label: 'YOU', value: k >= 1 ? '0:04:00' : clockStr(lerp(7200, 240, k)), x: E.W * 0.73, y: E.H * 0.48, color: GOLD(), size: V(66, 60), align: 'left' });
  UI.badge(g, { str: 'PAPER 1 · ALL 60 QUESTIONS', x: E.W - V(100, 70), y: V(120, 190), color: alpha(CREAM(), 0.75), size: V(26, 26) });
  if (k > 0.96) stamp(g, sx + V(250, 210), sy - V(150, 190), V(0.7, 0.6), 'DONE', { k: ease.out(prog(t, Math.max(0.7, tFour), Math.max(0.7, tFour) + 0.3)), color: '#3f7d5c', rot: 0.08 });
  FX.dust(g, t, { count: 16, color: '#ffe9c4', a: 0.22 });
} });

// s028 — "Leo stares at your blank extra time."  two-shot: one finished sheet, one untouched one.
const STARE = {                                                        // sit, pitched forward over the paper
  ...POSES.sit,
  head: [30, -150], sh: [10, -140], hip: [0, -72],
  eF: [34, -108], hF: [56, -78], eB: [18, -108], hB: [34, -84],
  kF: [44, -72], fF: [46, 0], kB: [40, -70], fB: [38, 0],
};
registerShot('s028', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.12, 1.06, p), x: lerp(-40, 28, p), y: lerp(-18, 4, p) };
  const { GY, CX, M } = classroom(g, t, cam, { mood: 'day', desks: false, board: ['Q1  Q2  Q3  …  Q60'] });
  const s = V(2.5, 2.2), hx = CX - V(430, 340), lx = CX + V(330, 270);
  layer(g, cam, 1, (h) => {
    drawHero(h, { x: hx, y: GY + V(6, 5), s, facing: 1, pose: breathe(POSES.sitBack, t * 0.7, 0.7, 2), expr: 'smirk',
      rim: { color: M.rim, dir: [-0.5, -0.72], w: 4 }, blink: (t % 4.4) > 4.3 });
    schoolDesk(h, hx + V(150, 120), GY + V(34, 26), V(1.35, 1.2));
    const dTop = GY + V(34, 26) - 122 * V(1.35, 1.2);
    h.save(); h.translate(hx + V(150, 120), dTop - V(16, 14)); h.scale(1, 0.8); h.rotate(-0.06);
    filledRows(h, V(0.86, 0.78), 1, '#2b3550'); h.restore();
    drawFigure(h, { x: lx, y: GY + V(6, 5), s, facing: -1, outfit: LEO, pose: breathe(STARE, t * 0.5, 0.5, 6), expr: 'nervous',
      rim: { color: M.rim, dir: [0.5, -0.72], w: 4 }, blink: (t % 2.6) > 2.45, look: [0.4, 0.6] });
    schoolDesk(h, lx - V(150, 120), GY + V(34, 26), V(1.35, 1.2));
    const dTop2 = GY + V(34, 26) - 122 * V(1.35, 1.2);
    h.save(); h.translate(lx - V(150, 120), dTop2 - V(16, 14)); h.scale(1, 0.8);
    answerSheet(h, 0, 0, V(0.86, 0.78), { filled: 'none', rot: -0.04 }); h.restore();
  });
  UI.callout(g, t, { at: [E.W / 2 + V(240, 200), E.H * V(0.86, 0.8)], to: [E.W / 2 + V(430, 330), E.H * V(0.24, 0.2)], str: 'STILL BLANK', color: '#c98b2f', start: 0.5 });
  UI.badge(g, { str: '116 MINUTES LEFT', x: E.W - V(100, 70), y: V(120, 190), color: alpha(CREAM(), 0.8) });
  FX.dust(g, t, { count: 20, color: '#ffe9c4', a: 0.24 });
} });

// s029 — "Dude. You just sat there."  giant close-up of Leo, lip-synced to the real word timings.
registerShot('s029', { draw(g, t, info) {
  const M = mood('day');
  blurLayer(g, 13, (g2) => classroom(g2, t, { z: 1.5, x: 250, y: -110 }, { mood: 'day', desks: false }));
  veil(g, '#0d1016', 0.26);
  const tDude = wordTime('dude', info.shot.start) ?? info.shot.start + 0.1;
  const tSat = wordTime('sat', info.shot.start) ?? info.shot.start + 1.2;
  const pop = clamp(1 - prog(info.globalT, tDude, tDude + 0.26));
  const hit = ease.out(clamp(prog(info.globalT, tSat, tSat + 0.3)));
  const cx = E.W / 2 + V(70, 0), cy = E.H * V(0.62, 0.54);
  const r = V(298, 330) * (1 + 0.02 * pop + 0.03 * hit);
  bigFace(g, cx, cy, r, {
    outfit: LEO, expr: hit > 0.4 ? 'shocked' : 'smile', talk: talkAmount(info.globalT),
    blink: (t % 2.9) > 2.8, look: [-0.12, 0.06], rimColor: M.rim, rimSide: -1,
  });
  glow(g, cx, cy, r * 2.2, M.key, 0.1);
  if (hit > 0) ring(g, cx, cy, r * (1.1 + (1 - hit) * 0.35), 4 * hit, alpha(GOLD(), 0.3 * hit));
  text(g, 'JUST SAT THERE.', E.W * V(0.16, 0.5), E.H * V(0.24, 0.16), { size: V(46, 40), color: alpha(CREAM(), hit), font: FONTS.ui, weight: 900, align: V('left', 'center'), glow: 20 * hit, glowColor: alpha(GOLD(), 0.5 * hit), spacing: 2 });
  UI.badge(g, { str: 'LEO', x: E.W - V(100, 70), y: V(120, 190), color: alpha(LEO.color, 0.95) });
  FX.dust(g, t, { count: 14, color: '#ffe9c4', a: 0.2 });
} });

// s030 — "I was proving it three more ways, you say."  medium single, three blueprint proofs around the head.
const GESTURE = {                                                      // seated, one hand up mid-explanation
  ...POSES.sit,
  head: [10, -186], sh: [2, -148], hip: [0, -72],
  eF: [34, -120], hF: [58, -142], eB: [16, -112], hB: [36, -96],
  kF: [44, -72], fF: [46, 0], kB: [40, -70], fB: [38, 0],
};
registerShot('s030', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.24, 1.34, p), x: lerp(-26, 16, p), y: lerp(4, -20, p) };
  const { GY, CX, M } = classroom(g, t, cam, { mood: 'day', desks: false });
  const s = V(3.1, 2.8), x = CX - V(240, 190);
  const [hhx, hhy, hhr] = heroHeadPosition({ x, y: GY + V(6, 5), s, facing: 1, pose: breathe(GESTURE, t * 0.8, 0.8, 1) });
  const spots = [[hhx + V(430, 300), hhy - V(210, 170)], [hhx + V(470, 330), hhy + V(90, 60)], [hhx + V(250, 190), hhy - V(400, 330)]];
  const titles = ['EUCLID', 'Σ 1/n²', 'BISECTOR'];
  const words = ['three', 'more', 'ways'];
  layer(g, cam, 1, (h) => {
    drawHero(h, { x, y: GY + V(6, 5), s, facing: 1, pose: breathe(GESTURE, t * 0.8, 0.8, 1), expr: 'neutral', face: DEAD,
      talk: talkAmount(info.globalT, info.shot.start, info.shot.end), rim: { color: M.rim, dir: [-0.5, -0.72], w: 4 }, blink: (t % 3.6) > 3.5 });
    schoolDesk(h, x + V(170, 135), GY + V(34, 26), V(1.5, 1.3));
    words.forEach((w, i) => {
      const tw = (wordTime(w, info.shot.start) ?? info.shot.start + 0.4 + i * 0.5) - info.shot.start;
      const k = ease.out(clamp(prog(t, tw, tw + 0.34)));
      if (k <= 0) return;
      proofCard(h, spots[i][0], spots[i][1], V(250, 210), V(170, 150), titles[i], k, i);
      const [ax, ay] = [lerp(hhx + hhr, spots[i][0], 0.5), lerp(hhy, spots[i][1], 0.55)];
      h.save(); h.setLineDash([8, 8]); seg(h, [[hhx + hhr * 0.9, hhy], [spots[i][0] - V(90, 80), spots[i][1]]], 2, alpha(GOLD(), 0.3 * k)); h.setLineDash([]); h.restore();
      glow(h, ax, ay, V(160, 140), GOLD(), 0.05 * k);
    });
  });
  UI.badge(g, { str: '×3 MORE WAYS', x: E.W - V(100, 70), y: V(120, 190), color: GOLD(), a: ease.out(prog(t, 0.3, 0.7)) });
  FX.dust(g, t, { count: 18, color: '#ffe9c4', a: 0.22 });
} });

// s031 — "For fun."  giant close-up: the smirk lands on the last word.
registerShot('s031', { draw(g, t, info) {
  const M = mood('day');
  blurLayer(g, 12, (g2) => classroom(g2, t, { z: 1.55, x: -190, y: -90 }, { mood: 'day', desks: false }));
  veil(g, '#0d1016', 0.28);
  const th = wordTime('fun', info.shot.start) ?? info.shot.start + 0.45;
  const punch = ease.out(clamp(prog(info.globalT, th, th + 0.34)));
  const cx = E.W / 2 - V(40, 0), cy = E.H * V(0.62, 0.55);
  const r = V(305, 340) * (1 + 0.015 * t + 0.045 * punch);
  drawHeroFace(g, cx, cy, r, {
    expr: punch > 0.25 ? 'smirk' : 'neutral', face: punch > 0.25 ? null : DEAD,
    talk: talkAmount(info.globalT, info.shot.start, th), blink: (t % 3.3) > 3.18,
    look: [-0.14, -0.18], rimColor: M.rim, rimSide: 1,
  });
  glow(g, cx, cy, r * 2.3, GOLD(), 0.05 + 0.08 * punch);
  if (punch > 0) {
    ring(g, cx, cy, r * (1.08 + (1 - punch) * 0.5), 4 * punch, alpha(GOLD(), 0.4 * punch));
    FX.speedLines(g, t, { cx, cy, count: 14, inner: r * 1.15, a: 0.1 * punch, color: GOLD() });
    text(g, 'FOR FUN.', E.W * V(0.2, 0.5), E.H * V(0.2, 0.16), { size: V(60, 54), color: alpha(CREAM(), punch), font: FONTS.ui, weight: 900, align: V('left', 'center'), spacing: 4, glow: 24 * punch, glowColor: alpha(GOLD(), 0.6 * punch) });
  }
  UI.badge(g, { str: 'NO REASON', x: E.W - V(100, 70), y: V(120, 190), color: alpha(CREAM(), 0.8), a: punch });
} });
