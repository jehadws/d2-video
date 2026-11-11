// shots/09_mia.js — s060–s072: act 4. Mia, dopamine, and nothing left to be surprised by.
import {
  E, V, registerShot, layer, blurLayer, veil, S, mood, ease, prog, clamp, lerp,
  alpha, shade, linGrad, rr, seg, poly, circle, ring, glow, text, FONTS, rng, wordTime,
} from '/engine/core.js';
import { POSES, breathe, drawFigure } from '/engine/rig2d.js';
import { drawHero, drawHeroFace } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { lab, labBench, crackPattern, wallChart } from '../sets/lab.js';
import { voidSet } from '../sets/void.js';
import { bedroom } from '../sets/bedroom.js';
import { answerSheet } from '../sets/class.js';
import { stamp, vignetteFocus } from '../sets/gfx.js';
import { MIA, LEO, MOM, CHAMP } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };
const GOLD = () => S().ui.gold;
const CREAM = () => S().ui.cream;
const BP = () => S().ui.blueprint;

// Local-time offset (seconds into the shot) at which a spoken word lands.
const beat = (info, word, fb) => ((wordTime(word, info.shot.start) ?? info.shot.start + fb) - info.shot.start);

// The act's through-line device: a reward meter. v = fill 0..1, dim = the flatline version.
function rewardMeter(g, t, o = {}) {
  const { x, y, w = V(520, 420), v = 0, label = 'REWARD', color = GOLD(), dim = 0, pulse = 0 } = o;
  const h = V(30, 26), a = 1 - dim * 0.55;
  text(g, label, x, y - h * 1.8, { size: V(24, 24), color: alpha(color, 0.8 * a), font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
  rr(g, x, y - h / 2, w, h, h / 2); g.fillStyle = alpha(color, 0.06 * a); g.fill();
  g.strokeStyle = alpha(color, 0.45 * a); g.lineWidth = 2.5; g.stroke();
  for (let i = 1; i < 10; i++) { const px = x + (w * i) / 10; seg(g, [[px, y - h * 0.3], [px, y + h * 0.3]], 2, alpha(color, 0.2 * a)); }
  const fw = w * clamp(v);
  if (fw > h * 0.7) {
    rr(g, x + 3, y - h / 2 + 3, fw - 6, h - 6, (h - 6) / 2); g.fillStyle = alpha(color, 0.9 * a); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, x + fw, y, h * (2.4 + pulse), color, (0.45 + pulse * 0.35) * a);
    g.restore();
  }
  text(g, `${Math.round(clamp(v) * 100)}%`, x + w + V(28, 22), y, { size: V(30, 28), color: alpha(color, 0.9 * a), font: FONTS.ui, weight: 900, align: 'left' });
}

// The film poster the twist is typed across — full size at s068, miniature at s071.
function poster(g, x, y, s = 1, o = {}) {
  const w = 400 * s, h = 570 * s, typed = clamp(o.typed ?? 1);
  g.save(); g.translate(x, y); g.rotate(o.rot ?? -0.03);
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 12 * s;
  rr(g, -w / 2, -h / 2, w, h, 6 * s); g.fillStyle = '#12141f'; g.fill(); g.restore();
  g.save(); rr(g, -w / 2, -h / 2, w, h, 6 * s); g.clip();
  g.fillStyle = linGrad(g, 0, -h / 2, 0, h * 0.3, ['#1b2438', '#4a2f3e', '#c8794a']); g.fillRect(-w / 2, -h / 2, w, h);
  glow(g, 0, -h * 0.14, w * 0.55, '#ffd9a0', 0.3);
  circle(g, 0, -h * 0.16, w * 0.17, alpha('#0d0f18', 0.92));
  poly(g, [[-w * 0.24, h * 0.22], [w * 0.24, h * 0.22], [w * 0.13, -h * 0.06], [-w * 0.13, -h * 0.06]], alpha('#0d0f18', 0.92));
  g.fillStyle = alpha('#0d0f18', 0.86); g.fillRect(-w / 2, h * 0.22, w, h * 0.28);
  text(g, 'THE LAST HOUR', 0, h * 0.32, { size: 30 * s, color: '#f2e7d2', font: FONTS.serif, weight: 900 });
  for (let i = 0; i < 3; i++) { g.fillStyle = alpha('#f2e7d2', 0.22); g.fillRect(-w * 0.3, h * 0.39 + i * 11 * s, w * 0.6, 3 * s); }
  g.fillStyle = alpha('#e8dcc4', 0.16); g.fillRect(-w * 0.46, -h * 0.05, w * 0.92, 46 * s);
  text(g, 'THE BUTLER DID IT'.slice(0, Math.round(17 * typed)), 0, -h * 0.02, { size: 26 * s, color: '#fff', font: FONTS.ui, weight: 900 });
  g.restore();
  g.strokeStyle = alpha('#e8dcc4', 0.22); g.lineWidth = 2.5 * s; rr(g, -w / 2, -h / 2, w, h, 6 * s); g.stroke();
  g.restore();
}

// s060 — "Mia, your lab partner, taps your shoulder."
// Two-shot in the lab: he is still in profile facing the wall, her hand lands on his shoulder.
registerShot('s060', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.02, 1.12, p), x: lerp(-16, 22, p), y: lerp(6, -10, p) };
  const { GY, CX, M } = lab(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (g2) => {
    labBench(g2, CX + V(560, 430), GY, { s: V(1.1, 0.92), w: 300 });
    crackPattern(g2, CX - V(500, 400), GY - V(520, 620), { len: V(210, 190), progress: 0.5, seed: 21, color: alpha(M.rim, 0.3), w: 2 });
    drawHero(g2, { x: CX - V(260, 210), y: GY, s: V(2.5, 2.3), facing: -1, pose: breathe(POSES.relaxed, t, 0.7, 3), expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.55, -0.7], w: 4 } });
    const tap = Math.sin(t * 5.2) * 5;
    drawFigure(g2, { x: CX - V(110, 80), y: GY, s: V(2.35, 2.15), facing: -1, outfit: MIA,
      pose: { ...POSES.relaxed, eF: [30, -150], hF: [58, -185 + tap] }, expr: 'worried', rim: { color: M.rim, dir: [0.45, -0.7], w: 4 } });
  });
  FX.dust(g, t, { count: 16, color: M.rim, a: 0.16 });
} });

// s061 — "You've been staring at that wall for an hour."
// Medium single from behind Mia's shoulder: the wall and its crack fill the left of frame.
registerShot('s061', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.14, 1.26, p), x: lerp(-30, 10, p), y: lerp(-10, -34, p) };
  const { GY, CX, M } = lab(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (g2) => {
    crackPattern(g2, CX - V(560, 460), GY - V(560, 700), { len: V(320, 300), progress: 0.35 + 0.12 * p, seed: 21, color: alpha(M.rim, 0.34), w: 2.5 });
    drawHero(g2, { x: CX - V(150, 120), y: GY, s: V(3.0, 2.75), facing: -1, pose: breathe(POSES.relaxed, t, 0.6, 3), expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.55, -0.7], w: 4 } });
  });
  blurLayer(g, 16, (g2) => {
    g2.fillStyle = shade(MIA.color, -0.2);
    rr(g2, E.W - V(330, 280), E.H * 0.6, V(520, 470), E.H, 90); g2.fill();
    circle(g2, E.W - V(140, 110), E.H * 0.58, V(110, 100), shade(MIA.headColor, -0.14));
  });
  UI.readout(g, { label: 'STARE TIME', value: '60:00', x: V(150, 120), y: E.H - V(150, 320), color: alpha(CREAM(), 0.7), size: V(46, 42) });
} });

// s062 — "I was mapping the crack pattern, you say."
// The fracture read as a diagram: it grows, then measurement arcs and callouts arrive on it.
registerShot('s062', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.06, 1.2, p), x: lerp(20, -20, p), y: 0 };
  const M = mood('interiorCool');
  layer(g, cam, 1, (g2) => {
    g2.fillStyle = linGrad(g2, 0, -E.H, 0, E.H * 1.4, [shade(M.dark, -0.25), shade(M.wall, -0.4), shade(M.dark, -0.1)]);
    g2.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    const grow = ease.out(clamp(prog(t, 0.05, 0.7)));
    crackPattern(g2, E.W * 0.26, E.H * 0.74, { len: V(560, 480), progress: grow, seed: 31, color: alpha(BP(), 0.85), w: 3.5, node: true, glowColor: BP() });
    if (grow > 0.35) wallChart(g2, E.W * 0.3, E.H * 0.86, V(1.1, 0.95), { w: 460, color: BP(), arc: [0.42, 0.09] });
    for (const [i, [ax, ay, label]] of [[0.34, 0.64, 'Ø 0.4 mm'], [0.5, 0.7, 'θ 37°'], [0.66, 0.78, 'L 1.8 m']].entries()) {
      const start = 0.5 + i * 0.16;
      if (t < start) continue;
      const k = clamp(prog(t, start, start + 0.2));
      const at = [E.W * ax, E.H * ay];
      ring(g2, at[0], at[1], V(16, 14) * k, 2.5, alpha(BP(), 0.8 * k));
      UI.callout(g2, t, { at, to: [E.W * (0.6 + i * 0.08), E.H * (0.18 + i * 0.13)], str: label, color: BP(), start });
    }
    UI.dimension(g2, t, { x1: E.W * 0.28, y1: E.H * 0.3, x2: E.W * 0.62, y2: E.H * 0.3, str: '42 BRANCHES', color: GOLD(), start: 0.9 });
  });
  FX.dust(g, t, { count: 10, color: BP(), a: 0.1 });
} });

// s063 — "It's actually kind of beautiful."
// Giant close-up: the first soft, unguarded expression of the film, arriving on "beautiful".
registerShot('s063', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  blurLayer(g, 14, (g2) => lab(g2, t, { z: 1.5, x: -120, y: -60 }, { mood: 'interiorCool' }));
  veil(g, '#0d0b14', 0.3);
  const softAt = beat(info, 'beautiful', 0.8);
  const soft = ease.out(clamp(prog(t, softAt, softAt + 0.45)));
  const cx = E.W / 2 - V(40, 0), cy = E.H * V(0.6, 0.55), r = V(300, 330) * (1 + 0.03 * p + 0.012 * soft);
  drawHeroFace(g, cx, cy, r, { expr: soft > 0.5 ? 'smile' : 'thinking', look: [-0.2, -0.18], blink: (t % 3.4) > 3.3, rimColor: '#ffd9a0', rimSide: -1 });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx - r * 0.9, cy - r * 0.3, r * 1.4, '#ffcf8a', 0.08 + 0.06 * soft);
  g.restore();
} });

// s064 — "That's the real price."
// Wide in the void: one small figure, a lot of empty frame, the line landing above him.
registerShot('s064', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.12, 1.0, p), x: 0, y: lerp(-10, 6, p) };
  const { GY, CX, M } = voidSet(g, t, cam, { mood: 'void', grid: 100, gridAlpha: 0.05, dust: true });
  layer(g, cam, 1, (g2) => {
    drawHero(g2, { x: CX + V(70, 50), y: GY, s: V(1.45, 1.3), facing: -1, pose: POSES.sad, expr: 'sad', rim: { color: M.rim, dir: [-0.5, -0.7], w: 3.5 } });
  });
  UI.bigLine(g, t, { str: "THAT'S THE REAL PRICE", dur: info.dur, y: E.H * V(0.28, 0.24), size: V(96, 88), color: CREAM() });
} });

// s065 — "Dopamine, the brain's little reward spark, fires hardest for surprises."
// Blueprint head, one lit node; the spark only ignites as the word "surprises" lands.
registerShot('s065', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.14, p), x: lerp(14, -14, p), y: 0 };
  const fireAt = beat(info, 'surprises', 2.8);
  layer(g, cam, 1, (g2) => {
    UI.blueprint(g2, { grid: 70, a: 0.07 });
    const hx = E.W * 0.4, hy = E.H * 0.54, s = V(1.55, 1.25);
    g2.strokeStyle = alpha(BP(), 0.8); g2.lineWidth = 3.4 * s; g2.lineJoin = 'round';
    g2.beginPath();
    g2.moveTo(hx - 92 * s, hy + 128 * s);
    g2.quadraticCurveTo(hx - 122 * s, hy + 34 * s, hx - 100 * s, hy - 26 * s);
    g2.quadraticCurveTo(hx - 86 * s, hy - 128 * s, hx + 14 * s, hy - 140 * s);
    g2.quadraticCurveTo(hx + 116 * s, hy - 126 * s, hx + 122 * s, hy - 16 * s);
    g2.quadraticCurveTo(hx + 126 * s, hy + 76 * s, hx + 62 * s, hy + 128 * s);
    g2.stroke();
    for (let i = 0; i < 5; i++) {
      g2.beginPath();
      g2.arc(hx + 10 * s, hy - 44 * s, (26 + i * 19) * s, Math.PI * (0.75 + i * 0.04), Math.PI * (1.9 - i * 0.05));
      g2.stroke();
    }
    seg(g2, [[hx + 30 * s, hy + 60 * s], [hx + 34 * s, hy + 120 * s]], 3 * s, alpha(BP(), 0.6));
    const k = ease.out(clamp(prog(t, fireAt - 0.6, fireAt)));
    const sx = hx - 4 * s, sy = hy + 18 * s, pulse = 1 + 0.22 * Math.sin(t * 7);
    circle(g2, sx, sy, (6 + 11 * k) * s, alpha(GOLD(), 0.35 + 0.6 * k));
    g2.save(); g2.globalCompositeOperation = 'lighter';
    glow(g2, sx, sy, (34 + 210 * k) * s * pulse, GOLD(), 0.22 + 0.5 * k);
    for (let i = 0; i < 8; i++) {
      const a2 = (i / 8) * Math.PI * 2 + t * 0.5;
      seg(g2, [[sx + Math.cos(a2) * 18 * s, sy + Math.sin(a2) * 18 * s], [sx + Math.cos(a2) * (30 + 66 * k) * s, sy + Math.sin(a2) * (30 + 66 * k) * s]], 2.5, alpha(GOLD(), 0.55 * k));
    }
    g2.restore();
    UI.callout(g2, t, { at: [sx, sy], to: [E.W * 0.72, E.H * 0.24], str: 'SURPRISE', color: GOLD(), start: fireAt - 0.4 });
    UI.callout(g2, t, { at: [hx - 60 * s, hy - 96 * s], to: [E.W * 0.13, E.H * 0.2], str: 'DOPAMINE', color: BP(), start: 0.35 });
    text(g2, 'REWARD RESPONSE', E.W * 0.13, E.H * 0.82, { size: V(24, 22), color: alpha(BP(), 0.7), font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
    rr(g2, E.W * 0.13, E.H * 0.85, V(420, 340), V(26, 22), 13); g2.fillStyle = alpha(BP(), 0.1); g2.fill();
    rr(g2, E.W * 0.13 + 3, E.H * 0.85 + 3, (V(420, 340) - 6) * k * 0.92, V(20, 16), 10); g2.fillStyle = alpha(GOLD(), 0.85); g2.fill();
  });
} });

// s066 — "For things you didn't see coming."
// A gate diagram: the known token passes with nothing, the unknown lands and the meter jumps.
registerShot('s066', { draw(g, t, info) {
  const cam = { z: 1.05 + 0.06 * ease.inOut(info.p), x: 0, y: 0 };
  const hitAt = beat(info, 'coming', 0.7);
  layer(g, cam, 1, (g2) => {
    UI.blueprint(g2, { grid: 70, a: 0.06 });
    const gx = E.W * 0.52, gy = E.H * 0.42, gh = V(220, 200);
    seg(g2, [[gx - 130, gy - gh / 2], [gx - 130, gy + gh / 2]], 6, alpha(BP(), 0.85));
    seg(g2, [[gx + 130, gy - gh / 2], [gx + 130, gy + gh / 2]], 6, alpha(BP(), 0.85));
    g2.save(); g2.setLineDash([12, 10]);
    seg(g2, [[gx - 130, gy - gh / 2 - 14], [gx + 130, gy - gh / 2 - 14]], 3, alpha(BP(), 0.5));
    g2.restore();
    const arr = ease.inOut(clamp(prog(t, 0.05, hitAt)));
    const tx = lerp(E.W * 0.14, gx - 40, arr);
    g2.save(); g2.translate(tx, gy); g2.rotate(0.06 * Math.sin(t * 5));
    rr(g2, -34, -34, 68, 68, 10); g2.fillStyle = alpha(GOLD(), 0.22); g2.fill();
    g2.strokeStyle = alpha(GOLD(), 0.9); g2.lineWidth = 3; g2.stroke();
    text(g2, '?', 0, 6, { size: 44, color: GOLD(), font: FONTS.ui, weight: 900 });
    g2.restore();
    text(g2, 'UNKNOWN', tx, gy + V(72, 64), { size: V(22, 20), color: alpha(CREAM(), 0.7), font: FONTS.ui, weight: 900, spacing: 2 });
    const after = clamp(prog(t, hitAt, hitAt + 0.5));
    if (after > 0) { ring(g2, gx, gy, V(90, 80) + after * V(240, 200), 4 * (1 - after), alpha(GOLD(), 0.6 * (1 - after))); }
    rewardMeter(g2, t, { x: E.W * 0.2, y: E.H * 0.76, w: V(620, 460), v: clamp(prog(t, hitAt, hitAt + 0.45)) * 0.85, pulse: after });
  });
} });

// s067 — "But you always see it coming."
// Giant close-up beside a meter that never leaves zero.
registerShot('s067', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  blurLayer(g, 14, (g2) => voidSet(g2, t, { z: 1.2, x: 0, y: 0 }, { mood: 'void', grid: 96, gridAlpha: 0.05 }));
  const cx = E.W * 0.33, cy = E.H * V(0.56, 0.5), r = V(248, 300) * (1 + 0.04 * p);
  drawHeroFace(g, cx, cy, r, { expr: 'neutral', face: DEAD, look: [0.12, 0.02], blink: false, rimColor: '#cfd8ee', rimSide: 1 });
  rewardMeter(g, t, { x: E.W * 0.58, y: E.H * V(0.46, 0.36), w: V(420, 300), v: 0, dim: 0.2 });
  text(g, 'NO SURPRISE', E.W * 0.58, E.H * V(0.46, 0.36) + V(64, 56), { size: V(24, 22), color: alpha(CREAM(), 0.45), font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
  FX.dust(g, t, { count: 12, color: '#cfd8ee', a: 0.12 });
} });

// s068 — "The movie twist."
// One poster, the punchline typed straight across it, a SPOILER stamp on the word.
registerShot('s068', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.1, 1.24, p), x: lerp(-20, 14, p), y: 0 };
  const M = mood('night');
  layer(g, cam, 1, (g2) => {
    g2.fillStyle = linGrad(g2, 0, -E.H, 0, E.H * 1.4, [shade(M.dark, -0.3), shade(M.wall, -0.55), shade(M.dark, -0.2)]);
    g2.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    poster(g2, E.W / 2, E.H * 0.52, V(1.15, 0.95), { typed: ease.out(clamp(prog(t, 0.04, 0.5)) * (1 + 0.05 * p)) });
  });
  const at = beat(info, 'twist', 0.35);
  const k = ease.out(clamp(prog(t, at, at + 0.22)));
  if (k > 0) stamp(g, E.W / 2 + V(110, 80), E.H * 0.33, V(0.8, 0.7), 'SPOILER', { k, color: '#c8493a', rot: -0.16 });
} });

// s069 — "The pop quiz."
// The sheet is already full before the bell finishes ringing.
registerShot('s069', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.16, 1.28, p), x: lerp(18, -12, p), y: lerp(10, -12, p) };
  const { GY, CX } = lab(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (g2) => {
    const top = labBench(g2, CX, GY, { s: V(1.2, 1), w: 340 });
    answerSheet(g2, CX - V(40, 30), top.top - V(72, 92), V(2.0, 1.7), { filled: 'all', rot: -0.04 });
    text(g2, 'POP QUIZ', CX - V(40, 30), top.top - V(250, 300), { size: V(34, 32), color: alpha(CREAM(), 0.75), font: FONTS.ui, weight: 900, spacing: 4 });
  });
  FX.rings(g, CX + V(470, 360), E.H * 0.22, t, { count: 3, r0: 26, r1: 190, speed: 1.7, color: GOLD(), a: 0.2 });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, CX + V(470, 360), E.H * 0.22, V(220, 180), GOLD(), 0.1 * (1 - prog(t, 0, info.dur)));
  g.restore();
} });

// s070 — "The surprise party."
// Freeze frame: everyone mid-cheer, the banner crossed out, only the camera still moving.
registerShot('s070', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.18, 1.08, p), x: lerp(24, -10, p), y: lerp(10, -6, p) };
  const { GY, CX, M } = voidSet(g, t, cam, { mood: 'interiorWarm', grid: 160, gridAlpha: 0.03, dust: false });
  layer(g, cam, 1, (g2) => {
    for (const [dx, ds, outfit] of [[-520, 1.0, LEO], [-300, 0.92, MIA], [300, 0.95, MOM], [520, 1.05, CHAMP]]) {
      drawFigure(g2, { x: CX + V(dx, dx * 0.62), y: GY, s: V(2.0, 1.8) * ds, facing: dx < 0 ? 1 : -1, outfit,
        pose: POSES.cheer, expr: 'joy', rim: { color: M.rim, dir: [dx < 0 ? -0.5 : 0.5, -0.7], w: 4 } });
    }
    drawHero(g2, { x: CX, y: GY, s: V(2.2, 2.0), facing: 1, pose: POSES.relaxed, expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.5, -0.7], w: 4 } });
    const bw = V(700, 560), by = GY - V(700, 780);
    g2.fillStyle = alpha('#e8dcc4', 0.88); rr(g2, CX - bw / 2, by - V(40, 36), bw, V(80, 72), 8); g2.fill();
    text(g2, 'SURPRISE', CX, by, { size: V(46, 42), color: '#22283a', font: FONTS.ui, weight: 900, spacing: 3 });
    seg(g2, [[CX - bw * 0.46, by], [CX + bw * 0.46, by]], V(7, 6), '#c8493a');
    const r = rng(77);
    for (let i = 0; i < 26; i++) {
      const x = CX + (r() - 0.5) * V(1500, 1000), y = GY - r() * V(620, 700);
      g2.fillStyle = alpha(i % 3 ? '#f2c21a' : '#e06a4a', 0.7); g2.fillRect(x, y, V(9, 7), V(14, 12));
    }
  });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, CX, GY - V(420, 500), V(760, 620), M.key, 0.1);
  g.restore();
} });

// s071 — "All solved in advance."
// The three inserts shrunk into one row, each stamped on its word.
registerShot('s071', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.1, 1.02, p), x: lerp(-24, 24, p), y: 0 };
  const { GY, M } = voidSet(g, t, cam, { mood: 'void', grid: 120, gridAlpha: 0.04, dust: false });
  const xs = [E.W * 0.22, E.W * 0.5, E.W * 0.78], y = E.H * 0.46;
  layer(g, cam, 1, (g2) => {
    poster(g2, xs[0], y, V(0.62, 0.5), { typed: 1, rot: -0.05 });
    answerSheet(g2, xs[1], y, V(1.5, 1.25), { filled: 'all', rot: 0.04 });
    for (const [dx, outfit] of [[-90, LEO], [90, MIA]]) {
      drawFigure(g2, { x: xs[2] + V(dx, dx * 0.6), y: y + V(150, 130), s: V(0.85, 0.7), facing: dx < 0 ? 1 : -1, outfit,
        pose: POSES.cheer, expr: 'joy', rim: { color: M.rim, dir: [dx < 0 ? -0.5 : 0.5, -0.7], w: 3 } });
    }
    const bw = V(300, 240), by = y - V(190, 170);
    g2.fillStyle = alpha('#e8dcc4', 0.75); rr(g2, xs[2] - bw / 2, by - V(22, 19), bw, V(44, 38), 6); g2.fill();
    text(g2, 'SURPRISE', xs[2], by, { size: V(22, 20), color: '#22283a', font: FONTS.ui, weight: 900, spacing: 2 });
    seg(g2, [[xs[2] - bw * 0.46, by], [xs[2] + bw * 0.46, by]], V(5, 4), '#c8493a');
  });
  [beat(info, 'all', 0.05), beat(info, 'solved', 0.4), beat(info, 'advance', 1.0)].forEach((h, i) => {
    const k = ease.out(clamp(prog(t, h, h + 0.22)));
    if (k > 0) stamp(g, xs[i], y - V(30, 24), V(0.72, 0.62), 'SOLVED', { k, color: '#3f7d5c', rot: -0.12 + i * 0.06 });
  });
} });

// s072 — "Nothing left... to feel surprised by."
// The act closes: one lit room, one figure, one meter that stays empty.
registerShot('s072', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.16, 1.02, p), x: lerp(30, -10, p), y: lerp(-8, 10, p) };
  const { GY, CX, M } = bedroom(g, t, cam, { mood: 'night', fan: false, equations: false, doorOpen: 0 });
  layer(g, cam, 1, (g2) => {
    drawHero(g2, { x: CX - V(430, 340), y: GY, s: V(2.6, 2.4), facing: -1, pose: breathe(POSES.relaxed, t, 0.5, 6), expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.55, -0.7], w: 4 } });
  });
  rewardMeter(g, t, { x: E.W * 0.56, y: E.H * V(0.44, 0.4), w: V(400, 300), v: 0, dim: 0.55 });
  text(g, 'NOTHING NEW', E.W * 0.56, E.H * V(0.44, 0.4) + V(58, 50), { size: V(24, 22), color: alpha(CREAM(), 0.4), font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
  FX.dust(g, t, { count: 18, color: M.rim, a: 0.14 });
  vignetteFocus(g, E.W * 0.5, E.H * 0.55, E.W * 0.62, 0.3);
} });
