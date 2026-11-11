// shots/02_rule.js — s017–s026: the number, the rule, and the falling glass that ends act 0.
import { E, V, registerShot, layer, S, ease, prog, clamp, alpha, shade, rr, seg, poly, circle, ring, glow, text, wordTime, rng, FONTS, lerp, linGrad, shake, veil } from '/engine/core.js';
import { POSES, drawFigure, breathe } from '/engine/rig2d.js';
import { drawHero, drawHeroFace } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { voidSet, ruleBar } from '../sets/void.js';
import { classroom, schoolDesk } from '../sets/class.js';
import { kitchen, kitchenCounter, tumbler } from '../sets/kitchen.js';
import { stamp, wordOccurrence, countTo } from '../sets/gfx.js';
import { LEO } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };            // the hero's deadpan (EXPR has no 'flat')
const GOLD = () => S().ui.gold;                          // gold line-art = the mind working
const BP = () => S().ui.blueprint;
const CREAM = () => S().ui.cream;
const SLOW = (pose, t, seed = 0) => breathe(pose, t * 0.18, 0.4, seed);   // a body that is not keeping up

// ---------- the IQ chart (s017 draws it, s019 snaps it) ----------
const IQ_MAX = 300;
function iqChart(GY, CX) {
  const x0 = CX - V(520, 400), x1 = CX + V(520, 400);
  const base = GY - V(150, 230), top = base - V(400, 560);
  return {
    x0, x1, base, top,
    px: (iq) => x0 + (iq / IQ_MAX) * (x1 - x0),
    curve: (iq) => top + (base - top) * (1 - Math.exp(-((iq - 100) ** 2) / (2 * 52 ** 2))),
  };
}

// Dashed drop line, marker dot and the two words the narration says, all popping on k.
function iqMarker(h, C, iq, label, k, o = {}) {
  if (k <= 0) return;
  const col = o.color || GOLD(), kk = clamp(k);
  const x = C.px(iq), y = C.curve(iq);
  h.save(); h.globalAlpha *= kk;
  h.setLineDash([9, 7]); seg(h, [[x, y], [x, C.base]], 3, alpha(col, 0.55)); h.setLineDash([]);
  glow(h, x, y, V(180, 160) * ease.out(kk), col, 0.22);
  circle(h, x, y, V(10, 9) * ease.outBack(kk), col);
  text(h, label, x, y - V(58, 84), { size: V(26, 30), color: alpha(CREAM(), 0.85), font: FONTS.ui, weight: 900, spacing: 2.5 });
  text(h, String(iq), x, y - V(116, 158), { size: V(58, 66), color: col, font: FONTS.ui, weight: 900, glow: 22, glowColor: alpha(col, 0.55) });
  h.restore();
}

// A small blueprint panel for the void cards: dark plate, gold key line, gold number.
function dataCard(g, x, y, w, h, title, value, k, o = {}) {
  if (k <= 0) return;
  const col = o.color || GOLD();
  g.save(); g.translate(x, y); g.scale(0.92 + 0.08 * ease.outBack(clamp(k)), 0.92 + 0.08 * ease.outBack(clamp(k)));
  g.globalAlpha *= clamp(k * 1.7);
  rr(g, -w / 2, -h / 2, w, h, 14); g.fillStyle = alpha(S().ui.card, 0.9); g.fill();
  g.strokeStyle = alpha(col, 0.5); g.lineWidth = 3; g.stroke();
  text(g, title, -w / 2 + 24, -h / 2 + 36, { size: V(24, 28), color: alpha(CREAM(), 0.8), font: FONTS.ui, weight: 900, align: 'left', spacing: 2 });
  text(g, value, -w / 2 + 24, h / 2 - 44, { size: o.size || V(56, 60), color: col, font: FONTS.ui, weight: 900, align: 'left', glow: 18, glowColor: alpha(col, 0.5) });
  g.restore();
}

// A splinter of the snapped scale: flies out from the break, spins and fades.
function shard(g, x, y, s, rot, a, col) {
  if (a <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= a;
  poly(g, [[0, -s], [s * 0.6, s * 0.5], [-s * 0.52, s * 0.38]], col);
  g.restore();
}

// Blueprint head in profile (local copy: sets/* has no head and 08_blueprint.js does not export its own).
function bpHead(g, x, y, r, o = {}) {
  const c = o.color || BP(), w = Math.max(2.5, r * 0.038), lit = clamp(o.lit ?? 0);
  const P = [[-0.86, 1.15], [-0.98, -0.02], [-0.66, -0.94], [0.28, -1.08], [0.96, -0.42], [0.72, 0.28], [1.02, 0.66], [0.26, 0.8], [-0.08, 1.15]];
  if (lit > 0.02) glow(g, x - r * 0.08, y - r * 0.2, r * 2.3, o.glowColor || GOLD(), 0.26 * lit);
  seg(g, P.map(([dx, dy]) => [x + dx * r, y + dy * r]), w, alpha(c, 0.9));
  seg(g, [[x - r * 0.08, y + r * 1.15], [x - r * 0.16, y + r * 1.62], [x + r * 0.34, y + r * 1.64]], w, alpha(c, 0.75));
  for (const [dx, dy, br] of [[-0.3, -0.44, 0.34], [0.12, -0.54, 0.3], [0.42, -0.2, 0.26], [-0.04, -0.14, 0.28]]) {
    const on = lit > 0.15;
    ring(g, x + dx * r, y + dy * r, br * r, w * 0.85, on ? alpha(on ? (o.glowColor || GOLD()) : c, 0.35 + 0.55 * lit) : alpha(c, 0.55));
    if (on) glow(g, x + dx * r, y + dy * r, br * r * 2.2, o.glowColor || GOLD(), 0.12 * lit);
  }
}

// Fingers curling shut — the rig has no fingers, so an insert close-up draws its own.
function closingHand(g, x, y, r, close, facing, color, glowColor) {
  const dir = facing >= 0 ? 1 : -1, curl = ease.inOut(clamp(close));
  g.save();
  for (let i = 0; i < 4; i++) {
    const a = -0.72 + i * 0.44;
    const x1 = x + Math.cos(a) * r * 1.12 * dir, y1 = y + Math.sin(a) * r * 1.12 - r * 0.1;
    const b = a + curl * 1.15, rr2 = r * (1.12 - 0.38 * curl);
    const x2 = x + Math.cos(b) * rr2 * dir, y2 = y + Math.sin(b) * rr2 - r * 0.06;
    seg(g, [[x + Math.cos(a) * r * 0.55 * dir, y + Math.sin(a) * r * 0.55], [x1, y1]], r * 0.3, color);
    seg(g, [[x1, y1], [x2, y2]], r * 0.27, color);
  }
  seg(g, [[x - dir * r * 0.5, y + r * 0.3], [x - dir * r * 1.15, y + r * 0.75]], r * 0.34, color);   // wrist
  circle(g, x, y - r * 0.1, r * 0.66, color);
  g.restore();
  glow(g, x, y, r * 4.2, glowColor, 0.14);
}

// ---------- the falling glass: one counter, one drop line, one frozen mid-air instant ----------
const fallGY = () => E.H * V(0.8, 0.68);                     // kitchen floor line (same as kitchenGround())
const cntTop = () => fallGY() - 204 * V(1.1, 0.95);          // kitchenCounter()'s surface at its own default scale
const glassX = () => E.W / 2 + V(360, 300);                  // the lip just past the counter's right edge
const SLIP = 0.16;                                           // local t the glass leaves the counter
const FALL = 1.0;                                            // local t the whole 1.4 m drop takes
const HIT = 0.86;                                            // local t of the frozen instant: about halfway down
const dropK = (tt) => clamp((tt - SLIP) / FALL);
const fallY = (tt) => cntTop() - 12 + (fallGY() + 4 - cntTop() + 12) * dropK(tt) ** 2;
const fallRot = (tt) => 1.05 * dropK(tt);

// s017 — "The average human scores around one hundred on an IQ test. The smartest people ever measured hover near two hundred."
// Blueprint data card: the bell curve draws itself across the chart, each marker slamming in on its own spoken number.
registerShot('s017', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.13, p), x: lerp(-22, 26, p), y: lerp(10, -16, p) };
  const { GY, CX } = voidSet(g, t, cam, { mood: 'void', grid: 90, gridAlpha: 0.05, dust: true });
  const C = iqChart(GY, CX);
  const wAvg = wordOccurrence('hundred', info.shot.start, 1) ?? info.shot.start + 1.6;
  const wTop = wordOccurrence('hundred', info.shot.start, 2) ?? info.shot.start + 5.1;
  const ink = ease.out(prog(t, 0.12, 2.4));
  layer(g, cam, 1, (h) => {
    seg(h, [[C.x0, C.base], [C.x0, C.top - V(72, 100)]], 3, alpha(BP(), 0.55));                       // the IQ axis
    ruleBar(h, C.x0, C.base + 2, C.x1 - C.x0, { ticks: 6, color: BP(), alpha: 0.45 });
    for (const iq of [0, 50, 100, 150, 200, 250, 300]) {
      const big = iq % 100 === 0;
      seg(h, [[C.px(iq), C.base + 2], [C.px(iq), C.base + 2 + V(15, 17) * (big ? 1 : 0.5)]], 2, alpha(BP(), big ? 0.6 : 0.3));
      if (big) text(h, String(iq), C.px(iq), C.base + V(44, 56), { size: V(24, 28), color: alpha(CREAM(), 0.45), font: FONTS.ui, weight: 900 });
    }
    const pts = [];
    for (let i = 0; i <= 84; i++) {
      const x = C.x0 + (i / 84) * (C.x1 - C.x0);
      if (x > C.x0 + (C.x1 - C.x0) * ink) break;
      pts.push([x, C.curve((i / 84) * IQ_MAX)]);
    }
    if (pts.length > 1) {
      h.save(); h.globalCompositeOperation = 'lighter';
      poly(h, [...pts, [pts[pts.length - 1][0], C.base], [pts[0][0], C.base]], alpha(GOLD(), 0.06));
      h.restore();
      seg(h, pts, 4.5, alpha(GOLD(), 0.92));
      if (ink < 1) { const tip = pts[pts.length - 1]; circle(h, tip[0], tip[1], V(8, 7), GOLD()); glow(h, tip[0], tip[1], V(130, 110), GOLD(), 0.3); }
    }
    iqMarker(h, C, 100, 'AVERAGE', ease.out(prog(info.globalT, wAvg, wAvg + 0.45)));
    iqMarker(h, C, 200, 'HIGHEST RECORDED', ease.out(prog(info.globalT, wTop, wTop + 0.45)), { color: CREAM() });
  });
  UI.badge(g, { str: 'HUMAN RANGE', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.8) });
} });

// s018 — "You? One thousand."  giant close-up, the counter rolling beside the head.
registerShot('s018', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = voidSet(g, t, { z: lerp(1.02, 1.16, p), x: lerp(16, -34, p), y: lerp(-14, 20, p) }, { mood: 'void', grid: 90, gridAlpha: 0.06, dust: true }).M;
  const th = wordTime('thousand', info.shot.start) ?? info.shot.start + 1.2;
  const punch = ease.out(clamp(prog(info.globalT, th, th + 0.4)));
  const cx = E.W / 2 - V(110, 0), cy = E.H * V(0.58, 0.52);
  const r = V(320, 380) * (1 + 0.02 * p + 0.045 * punch);
  drawHeroFace(g, cx, cy, r, {
    expr: punch > 0.3 ? 'smirk' : 'neutral', face: punch > 0.3 ? null : DEAD, talk: 0, blink: (t % 3.2) > 3.1,
    look: [0.16, -0.24], rimColor: M.rim, rimSide: -1,
  });
  glow(g, cx, cy, r * 2.4, GOLD(), 0.06 + 0.07 * punch);
  if (punch > 0) ring(g, cx, cy, r * (1.12 + (1 - punch) * 0.5), 4 * punch, alpha(GOLD(), 0.4 * punch));
  UI.readout(g, { label: 'IQ', value: countTo(t, 0.06, 1.35, 1000), x: E.W - V(120, 110), y: E.H * V(0.28, 0.22), color: GOLD(), size: V(96, 108), align: 'right' });
  FX.speedLines(g, t, { cx, cy, count: 16, inner: r * 1.2, a: 0.11 * punch, color: GOLD() });
  FX.dust(g, t, { count: 14, color: M.rim, a: 0.16 });
} });

// s019 — "Five times past the edge of the chart."  the axis snaps, the bar leaves the frame, the scale goes to glass.
registerShot('s019', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.3, 1.05, p), x: lerp(-34, 20, p), y: lerp(30, -8, p) };
  const { GY, CX } = voidSet(g, t, cam, { mood: 'void', grid: 90, gridAlpha: 0.06, dust: true });
  const base = GY - V(150, 230), per = V(150, 210);                      // world px per 100 IQ: 1000 is off the chart
  const yOf = (iq) => base - (iq / 100) * per;
  const hit = wordTime('edge', info.shot.start) ?? info.shot.start + 1.15;
  const snap = clamp(prog(info.globalT, hit, hit + 0.16));
  const fly = ease.in(prog(info.globalT, hit, hit + 0.95));
  const rise = ease.out(prog(t, 0.05, 0.42));
  const barTop = lerp(base - 16, yOf(300), rise) - fly * V(1500, 1900);
  const bw = V(96, 120), bx = CX + V(110, 60), yBrk = yOf(250);
  const [sx, sy] = snap > 0 && fly < 0.6 ? shake(info.globalT, 9 * (1 - fly), 24, 7) : [0, 0];
  layer(g, cam, 1, (h) => {
    h.save(); h.translate(sx, sy);
    seg(h, [[CX - V(210, 190), base], [CX + V(230, 250), base]], 3, alpha(BP(), 0.55));                 // the datum he is measured against
    ruleBar(h, CX - V(210, 190), base, V(440, 440), { ticks: 4, color: BP(), alpha: 0.3 });
    for (const iq of [0, 100, 200, 300]) {                                                              // the scale below the break
      seg(h, [[CX - V(96, 86), yOf(iq)], [CX - V(30, 26), yOf(iq)]], 3, alpha(BP(), 0.75 * (1 - 0.5 * snap)));
      text(h, String(iq), CX - V(130, 150), yOf(iq), { size: V(26, 30), color: alpha(CREAM(), 0.6), font: FONTS.ui, weight: 900, align: 'right' });
    }
    seg(h, [[CX - V(62, 56), base], [CX - V(62, 56), yBrk - 6 * snap]], 4, alpha(BP(), 0.7));
    h.save(); h.translate(0, -fly * V(620, 760)); h.rotate(-fly * 0.2);
    seg(h, [[CX - V(62, 56), yBrk + 12], [CX - V(62, 56), yOf(320)]], 4, alpha(BP(), 0.7 * (1 - fly * 0.7)));
    for (const iq of [250, 300]) seg(h, [[CX - V(62, 56), yOf(iq)], [CX - V(30, 26), yOf(iq)]], 3, alpha(BP(), 0.6 * (1 - fly * 0.7)));
    h.restore();
    const bg = linGrad(h, 0, base, 0, barTop, [alpha(GOLD(), 0.22), alpha(GOLD(), 0.8)]);
    h.fillStyle = bg; h.fillRect(bx - bw / 2, barTop, bw, base - barTop);
    h.strokeStyle = alpha(GOLD(), 0.85); h.lineWidth = 3; h.strokeRect(bx - bw / 2, barTop, bw, base - barTop);
    if (fly < 0.1) glow(h, bx, barTop, V(240, 220), GOLD(), 0.3);
    text(h, '1000', bx + bw / 2 + V(70, 60), barTop + V(64, 70), { size: V(44, 50), color: CREAM(), font: FONTS.ui, weight: 900, align: 'left', glow: 22, glowColor: alpha(GOLD(), 0.6) });
    if (fly > 0) FX.speedLines(h, info.globalT, { cx: bx, cy: yBrk, count: 26, inner: V(80, 70), a: 0.26 * (1 - fly), color: '#e8f0f6' });
    for (let i = 0; i < 18; i++) {
      const r = rng(700 + i), ang = -Math.PI / 2 + (r() - 0.5) * 2.6, d = (150 + r() * 620) * fly;
      shard(h, CX - V(62, 56) + Math.cos(ang) * d, yBrk + Math.sin(ang) * d * 0.85, (12 + r() * 30) * V(1, 0.85),
        r() * 6.28 + fly * (r() - 0.5) * 4, (1 - fly) * 0.9, i % 3 ? alpha(BP(), 0.8) : alpha(GOLD(), 0.85));
    }
    if (snap > 0) ring(h, CX - V(62, 56), yBrk, V(70, 60) + fly * V(700, 820), 5 * (1 - fly), alpha(BP(), 0.5 * (1 - fly)));
    h.restore();
  });
  if (snap > 0) veil(g, alpha(GOLD(), 0.3), 0.22 * (1 - ease.out(clamp(prog(info.globalT, hit, hit + 0.5)))));
  UI.badge(g, { str: '×5 OFF-SCALE', x: E.W - V(110, 80), y: V(120, 190), color: GOLD(), a: ease.out(prog(info.globalT, hit + 0.2, hit + 0.6)) });
} });

// s020 — "But here's the rule."  a lone figure in one rim light under the chapter line.
registerShot('s020', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.05, 1.2, p), x: lerp(24, -12, p), y: -70 + 30 * p };
  const { GY, CX, M } = voidSet(g, t, cam, { mood: 'void', grid: 84, gridAlpha: 0.045, dust: true, glow: false });
  layer(g, cam, 1, (h) => {
    const x = CX - V(40, 0);
    drawHero(h, { x, y: GY, s: V(2.9, 2.7), facing: 1, pose: SLOW(POSES.crossArms, t, 3), expr: 'neutral', face: DEAD,
      rim: { color: M.rim, dir: [-0.8, -0.55], w: 4 }, blink: (t % 3.4) > 3.28 });
    seg(h, [[x - V(210, 170), GY + 4], [x + V(210, 170), GY + 4]], 3, alpha(M.rim, 0.2));
  });
  const a = ease.out(prog(t, 0.08, 0.42));
  UI.bigLine(g, t, { str: 'THE RULE', dur: info.shot.end - info.shot.start, y: E.H * V(0.13, 0.1), color: CREAM(), size: V(76, 78) });
  g.save(); g.globalAlpha = a;
  seg(g, [[E.W / 2 - V(240, 190), E.H * V(0.185, 0.145)], [E.W / 2 + V(240, 190), E.H * V(0.185, 0.145)]], 3, GOLD());
  g.restore();
  FX.dust(g, t, { count: 12, color: M.rim, a: 0.14 });
} });

// s021 — "Your brain got faster."  blueprint head: the brain lights, the clock inside it runs away.
registerShot('s021', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.02, 1.17, p), x: lerp(-24, 16, p), y: lerp(8, -14, p) };
  const { GY, CX } = voidSet(g, t, cam, { mood: 'void', grid: 90, gridAlpha: 0.055, dust: true });
  const r = V(195, 265), hx = CX - V(300, 200), hy = GY - V(430, 640);
  const lit = ease.out(prog(t, 0.08, 0.55));
  const hit = wordTime('faster', info.shot.start) ?? info.shot.start + 1.0;
  const stampK = ease.out(clamp(prog(info.globalT, hit, hit + 0.3)));
  layer(g, cam, 1, (h) => {
    FX.speedLines(h, info.globalT, { cx: hx + r * 0.2, cy: hy, count: 18, inner: r * 1.3, a: 0.13 * lit, color: GOLD() });
    for (let i = 0; i < 3; i++) {                                                      // speed arcs streaming back
      const ph = ((info.globalT * 0.8 + i / 3) % 1), rr2 = r * (1.25 + ph * 0.55);
      h.strokeStyle = alpha(BP(), 0.5 * (1 - ph) * lit); h.lineWidth = 3;
      h.beginPath(); h.arc(hx + r * 0.1, hy, rr2, Math.PI * 0.62, Math.PI * 1.38); h.stroke();
    }
    bpHead(h, hx, hy, r, { lit, glowColor: GOLD() });
    FX.clock(h, hx + r * 0.26, hy - r * 0.1, r * 0.3, info.globalT, { speed: 240 * lit + 2, face: alpha(BP(), 0.07), ink: alpha(BP(), 0.9), red: GOLD() });
    dataCard(h, CX + V(430, 300), GY - V(560, 820), V(300, 300), V(180, 200), 'BRAIN SPEED', '×500', ease.out(prog(t, 0.3, 0.7)), { size: V(60, 64) });
    if (stampK > 0) stamp(h, CX + V(430, 300), GY - V(240, 520), V(0.8, 0.72), 'FASTER', { k: stampK, color: shade(GOLD(), -0.1), rot: -0.09 });
  });
  UI.badge(g, { str: 'SYNC 240×', x: E.W - V(110, 80), y: V(120, 190), color: GOLD(), a: lit });
} });

// s022 — "Your body didn't."  the same hero, slumped and very slow in the desk chair.
const SLUMP = {                                                                 // sit, but the head has dropped into the shoulders and the far arm has gone limp
  ...POSES.sit,
  head: [10, -160], sh: [3, -138], hip: [0, -72],
  eF: [20, -104], hF: [42, -80], eB: [12, -104], hB: [26, -72],
  kF: [44, -72], fF: [46, 0], kB: [40, -70], fB: [38, 0],
};
registerShot('s022', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.08, 1.14, p), x: lerp(26, -14, p), y: -24 };
  const { GY, CX, M } = classroom(g, t, cam, { mood: 'day', desks: false });
  const s = V(3.4, 3.1), x = CX - V(120, 100);
  layer(g, cam, 1, (h) => {
    drawHero(h, { x, y: GY + V(6, 5), s, facing: 1, pose: SLOW(SLUMP, t, 1), expr: 'sleepy', face: { mouth: 'flat' },
      rim: { color: M.rim, dir: [-0.5, -0.72], w: 4 } });
    schoolDesk(h, x + V(96, 80), GY + V(30, 24), V(1.5, 1.3));
    const dr = 0.5 + 0.5 * Math.sin(t * 0.8);                                   // the head nodding off, very slow
    text(h, 'z', x - V(210, 180), GY - V(520, 620) - dr * V(30, 34), { size: V(40, 44), color: alpha(CREAM(), 0.2 + 0.16 * dr), font: FONTS.title, weight: 700, italic: true });
    text(h, 'z', x - V(280, 240), GY - V(600, 720) - dr * V(22, 26), { size: V(30, 34), color: alpha(CREAM(), 0.14 + 0.12 * dr), font: FONTS.title, weight: 700, italic: true });
  });
  UI.badge(g, { str: 'BODY: AS STANDARD', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.75) });
  FX.dust(g, t, { count: 16, color: '#ffe9c4', a: 0.2 });
} });

// s023 — "You can calculate a falling glass perfectly..."  the freeze frame: path, math, one held instant.
registerShot('s023', { draw(g, t, info) {
  const p = ease.inOut(clamp(prog(t, 0, 1.1)));
  const cam = { z: lerp(1.16, 1.3, p), x: lerp(V(300, 250), V(355, 300), p), y: lerp(185, 215, p) };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'day', view: 'street' });
  const ft = Math.min(t, HIT);                                                  // the frame holds on one mid-drop instant
  const hold = clamp(prog(t, HIT, HIT + 0.3));                                  // how long we have been frozen
  const gx = glassX(), gy = fallY(ft), rot = fallRot(ft);
  layer(g, cam, 1, (h) => {
    kitchenCounter(h, CX - V(60, 50), GY, { w: 360 });
    h.save(); h.setLineDash([14, 12]);                                          // the slip off the lip, then the straight drop
    seg(h, [[CX + V(210, 180), cntTop() - 22], [gx, cntTop() - 12]], 3, alpha(GOLD(), 0.4));
    seg(h, [[gx, cntTop() - 12], [gx, GY - 4]], 3, alpha(GOLD(), 0.5)); h.setLineDash([]); h.restore();
    for (let i = 1; i <= 3; i++) {                                              // echo ghosts of where it already was
      const ye = cntTop() - 12 + (gy - cntTop() + 12) * (i / 4) ** 2;
      h.save(); h.globalAlpha = 0.13; tumbler(h, gx, ye, V(1.5, 1.35), { rot: fallRot(SLIP + (ft - SLIP) * (i / 4)), water: 0 }); h.restore();
    }
    tumbler(h, gx, gy, V(1.5, 1.35), { rot, water: 1 });
    ring(h, gx - 10, gy - V(75, 62), V(120, 110), 3, alpha(GOLD(), 0.35 * hold));
    FX.drops(h, ft, { count: 16, area: [gx - V(160, 150), gy - V(150, 170), V(320, 300), V(300, 340)], rMin: 3, rMax: 11, color: '#cfe0ff', drift: 0 });
    FX.speedLines(h, info.globalT, { cx: gx, cy: gy - 40, count: 18, inner: V(140, 120), a: 0.1, color: '#e8f0f6' });
    UI.dimension(h, t, { x1: gx + V(110, 90), y1: cntTop() - 12, x2: gx + V(110, 90), y2: GY, str: '1.4 m', color: GOLD(), start: 0.2 });
    UI.callout(h, t, { at: [gx, gy - V(46, 56)], to: [gx - V(390, 300), gy - V(330, 420)], str: 'v = 4.2 m/s', color: CREAM(), start: 0.34 });
    UI.callout(h, t, { at: [gx + V(30, 24), (gy + GY) / 2], to: [gx + V(330, 260), gy + V(120, 150)], str: 't = 0.42 s', color: GOLD(), start: 0.62 });
    UI.callout(h, t, { at: [CX + V(240, 200), cntTop() - 20], to: [CX - V(300, 260), cntTop() - V(160, 230)], str: 'SLIP', color: alpha(CREAM(), 0.7), start: 0.12 });
  });
  UI.badge(g, { str: 'FREEZE', x: E.W - V(110, 80), y: V(120, 190), color: GOLD(), a: hold });
  FX.dust(g, t, { count: 14, color: '#ffe9c4', a: 0.2 });
} });

// s024 — "...and still be half a second too slow to catch it."  the hand closes late on empty air.
const LUNGE = {                                                                 // a downward snatch: torso pitched over, arm out and low, head following it
  ...POSES.reachDown,
  head: [56, -152], sh: [10, -150], hip: [0, -100],
  eF: [52, -124], hF: [92, -92], eB: [-20, -120], hB: [-44, -96],
  kF: [30, -52], fF: [52, 0], kB: [-26, -50], fB: [-44, 0],
};
registerShot('s024', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.08, 1.14, p), x: lerp(-30, -6, p), y: -60 - 8 * p };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'day', view: 'street' });
  const ft = Math.min(t + 0.24, 1.02);                                          // the drop keeps running while the hand is late
  const s = V(3.25, 2.9), heroX = glassX() - V(420, 360);
  const handX = heroX + LUNGE.hF[0] * s, handY = GY + LUNGE.hF[1] * s;
  const late = wordTime('slow', info.shot.start) ?? info.shot.start + 0.35;
  const close = ease.inOut(clamp(prog(info.globalT, late, late + 0.34)));
  const gx = glassX(), gy = fallY(ft);
  layer(g, cam, 1, (h) => {
    kitchenCounter(h, CX - V(60, 50), GY, { w: 360 });
    drawHero(h, { x: heroX, y: GY, s, facing: 1, pose: LUNGE, expr: 'shocked',
      rim: { color: M.rim, dir: [-0.45, -0.72], w: 4 }, shadow: false, look: [0.4, 0.5] });
    h.save(); h.setLineDash([12, 11]); seg(h, [[gx, cntTop() - 12], [gx, GY - 4]], 3, alpha(GOLD(), 0.4)); h.setLineDash([]); h.restore();
    h.save(); h.globalAlpha = 0.26; tumbler(h, gx, fallY(Math.max(SLIP, ft - 0.3)), V(1.55, 1.4), { rot: fallRot(ft) - 0.3, water: 0 }); h.restore();
    tumbler(h, gx, gy, V(1.6, 1.4), { rot: fallRot(ft) + 0.15, water: 1 });
    FX.drops(h, ft, { count: 12, area: [handX - V(190, 170), handY - V(150, 170), V(380, 340), V(300, 330)], rMin: 3, rMax: 9, color: '#cfe0ff', drift: 0 });
    closingHand(h, handX, handY, V(36, 34), close, 1, S().ink, GOLD());
    if (close > 0.2) ring(h, handX + V(40, 34), handY, V(70, 60) * close, 3, alpha(GOLD(), 0.4 * close));
    UI.dimension(h, t, { x1: gx - V(70, 60), y1: handY, x2: gx - V(70, 60), y2: gy, str: '0.5 s LATE', color: '#c98b2f', start: 0.2 });
  });
  FX.dust(g, t, { count: 12, color: '#ffe9c4', a: 0.2 });
} });

// s025 — "and still be half a second too slow to catch it."  shattered wide: he looks at his own hand.
registerShot('s025', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.1, 1, p), x: lerp(V(300, 250), V(240, 200), p), y: -10 + 10 * p };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'day', view: 'street' });
  const s = V(2.4, 2.2), shx = glassX() + V(10, 8), shy = GY + V(8, 6);
  const heroX = shx + V(210, 175);
  layer(g, cam, 1, (h) => {
    kitchenCounter(h, CX - V(60, 50), GY, { w: 360 });
    drawHero(h, { x: heroX, y: GY, s, facing: -1, pose: breathe({ ...POSES.think, head: [8, -190] }, t, 0.7, 2), expr: 'worried',
      rim: { color: M.rim, dir: [-0.5, -0.72], w: 4 }, blink: (t % 3.1) > 3.0, look: [-0.3, 0.55] });
    const k = ease.out(prog(t, 0.05, 0.5));
    h.save(); h.globalCompositeOperation = 'lighter';
    h.fillStyle = alpha('#cfe0ff', 0.16); h.beginPath(); h.ellipse(shx + V(20, 18), shy, V(200, 170), V(40, 34), 0, 0, 7); h.fill();
    h.restore();
    for (let i = 0; i < 13; i++) {
      const r = rng(200 + i), u = i / 12, a = -0.18 - u * 1.18;
      const rad = V(70, 62) + u * V(175, 150);
      const x = shx + Math.cos(a) * rad, y = shy + Math.sin(a) * rad * 0.32;
      const born = ease.out(clamp(prog(t, 0.02 + i * 0.03, 0.22 + i * 0.03)));
      if (born <= 0) continue;
      const sz = (9 + r() * 20) * V(1, 0.85);
      shard(h, x, y - sz * 0.4, sz * born, r() * 6.28 + (1 - born) * 2.2, born * (0.5 + r() * 0.45), i % 4 ? alpha('#dceaf4', 0.85) : alpha(GOLD(), 0.7));
      if (r() < 0.45) h.save(), h.setLineDash([5, 5]), seg(h, [[shx, shy - V(40, 46)], [x, y - sz]], 1.5, alpha('#cfe0ff', 0.25)), h.setLineDash([]), h.restore();
    }
    for (let i = 0; i < 5; i++) {
      const r = rng(320 + i);
      circle(h, shx + (r() - 0.4) * V(230, 200), shy - r() * V(20, 24), (3 + r() * 5) * V(1, 0.85), alpha('#bcd6e6', 0.55));
    }
    UI.callout(h, t, { at: [shx + V(60, 50), shy - V(30, 34)], to: [shx - V(360, 300), shy - V(250, 340)], str: 'IMPACT 1.2 m', color: CREAM(), start: 0.5 });
  });
  FX.dust(g, t, { count: 18, color: '#ffe9c4', a: 0.24 });
  UI.badge(g, { str: '0.5 s TOO SLOW', x: E.W - V(110, 80), y: V(120, 190), color: '#c98b2f', a: ease.out(prog(t, 0.35, 0.6)) });
} });

// s026 — "So what if you had one thousand IQ?"  chapter line over the classroom, camera drifting sideways.
registerShot('s026', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.02, 1.08, p), x: lerp(-90, 90, p), y: lerp(10, -12, p) };
  const { GY, CX, M } = classroom(g, t, cam, { mood: 'day', clearFront: true, board: ['483,716 × 7 = ?'] });
  layer(g, cam, 1, (h) => {
    const s = V(2.2, 2.1), x = CX - V(420, 340);
    drawHero(h, { x, y: GY + V(6, 5), s, facing: 1, pose: breathe(POSES.sit, t * 0.8, 0.9, 3), expr: 'thinking', rim: { color: M.rim, dir: [-0.5, -0.72], w: 4 } });
    schoolDesk(h, x + V(80, 66), GY + V(30, 24), V(1.3, 1.15));
    const lx = CX + V(140, 120);
    drawFigure(h, { x: lx, y: GY + V(6, 5), s, facing: -1, outfit: LEO, pose: breathe(POSES.sit, t * 0.8, 0.9, 5), expr: 'happy', rim: { color: M.rim, dir: [0.5, -0.72], w: 4 } });
    schoolDesk(h, lx - V(80, 66), GY + V(30, 24), V(1.3, 1.15));
  });
  veil(g, '#12141c', 0.34);
  UI.bigLine(g, t, { str: 'SO WHAT IF YOU HAD 1000 IQ?', dur: info.shot.end - info.shot.start, y: E.H * V(0.42, 0.36), size: V(88, 78) });
  const a = ease.out(prog(t, 0.2, 0.6));
  g.save(); g.globalAlpha = a;
  seg(g, [[E.W / 2 - V(300, 240), E.H * V(0.5, 0.43)], [E.W / 2 + V(300, 240), E.H * V(0.5, 0.43)]], 3, GOLD());
  text(g, 'ACT ONE · SCHOOL', E.W / 2, E.H * V(0.56, 0.49), { size: V(30, 34), color: alpha(CREAM(), 0.75), font: FONTS.ui, weight: 900, spacing: 6 });
  g.restore();
  FX.dust(g, t, { count: 22, color: '#ffe9c4', a: 0.26 });
} });
