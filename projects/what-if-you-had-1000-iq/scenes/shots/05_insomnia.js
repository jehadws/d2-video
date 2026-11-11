// shots/05_insomnia.js — s054–s057: the hum you measure, the fan you solve, the numbers you can't stop, the street that slept.
// All four are 2 AM inserts: cold practicals, gold line-art for the thinking, and one camera move each.
import { E, V, registerShot, layer, S, mood, ease, prog, clamp, alpha, shade, mix, rr, seg, poly, circle, ring, glow, text, wordTime, FONTS, lerp, linGrad, blurLayer, veil } from '/engine/core.js';
import { POSES, breathe } from '/engine/rig2d.js';
import { drawHero, heroHeadPosition } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, bed, numberStream, ceilingFan } from '../sets/bedroom.js';
import { kitchen, kitchenCounter, fridge, waveRead, tumbler } from '../sets/kitchen.js';
import { apartmentBlock, streetGround } from '../sets/apartment.js';
import { stamp } from '../sets/gfx.js';

const GOLD = () => S().ui.gold;              // gold line-art = the mind working
const BP = () => S().ui.blueprint;           // the diagram ink
const CREAM = () => S().ui.cream;
const COLD = '#9fd0ff';                      // 2 AM practical: moon through glass

// The local clock the UI helpers want, taken from a real word timing (with a safe fallback).
const beat = (info, word, fb) => ((wordTime(word, info.shot.start) ?? info.shot.start + fb) - info.shot.start);

// Replicates layer()'s camera math exactly, so a world point can be annotated from frame space.
const proj = (cam, wx, wy, depth = 1) => {
  const z = 1 + ((cam.z ?? 1) - 1) * depth;
  return [(wx - E.W / 2 - (cam.x || 0) * depth) * z + E.W / 2, (wy - E.H / 2 - (cam.y || 0) * depth) * z + E.H / 2];
};

// Faint sketch grid: the mind laying graph paper over the room. UI.blueprint() paints an opaque
// plate over the whole frame, which would erase the practical, so this file carries its own.
function sketchGrid(g, a, step = V(88, 110)) {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let x = 0; x <= E.W; x += step) seg(g, [[x, 0], [x, E.H]], 1, alpha(BP(), 0.06 * a));
  for (let y = 0; y <= E.H; y += step) seg(g, [[0, y], [E.W, y]], 1, alpha(BP(), 0.06 * a));
  g.restore();
}

// An arc with an arrowhead on the leading end: the little ω that turns a fan into a problem.
function arcArrow(g, cx, cy, r, a0, a1, w, col, k = 1) {
  if (k <= 0) return;
  const ae = lerp(a0, a1, clamp(k));
  g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy, Math.max(0, r), a0, ae); g.stroke();
  const tx = cx + Math.cos(ae) * r, ty = cy + Math.sin(ae) * r, tang = ae + Math.PI / 2, h = w * 4.2;
  poly(g, [[tx, ty], [tx - Math.cos(tang - 0.5) * h, ty - Math.sin(tang - 0.5) * h],
    [tx - Math.cos(tang + 0.5) * h, ty - Math.sin(tang + 0.5) * h]], col);
  g.restore();
}

// s054 — "The fridge hum becomes a frequency you calculate instead of ignore."
// Insert: the dark kitchen with one warm appliance in it, its hum drawn, measured, then dropped.
registerShot('s054', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.12, 1.3, p), x: lerp(-80, -300, p), y: lerp(20, 6, p) };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'night', view: 'night' });
  const bHum = beat(info, 'hum', 0.3), bFreq = beat(info, 'frequency', 1.1);
  const bCalc = beat(info, 'calculate', 1.9), bIg = beat(info, 'ignore', 2.9);
  const kWave = clamp(prog(t, bHum, bHum + 0.6));
  const kCalc = clamp(prog(t, bCalc, bCalc + 0.55));
  const fade = 1 - 0.8 * ease.in(clamp(prog(t, bIg, bIg + 0.7)));      // "…instead of ignore"
  const fs = V(1.2, 1.05), fx = CX - V(360, 260), frH = 460 * fs, frW = 190 * fs;
  const wv = { x: fx + 430 * fs, y: GY - frH * 0.62, w: 600 * fs, h: 74 * fs };   // world-space wave
  const lamW = wv.w * (Math.PI * 2) / 22;                              // one visual cycle of waveRead()
  layer(g, cam, 1, (h) => {
    fridge(h, fx, GY, fs, { color: '#c9cdd4' });                       // closed: only the pilot lamp lights
    const c = kitchenCounter(h, CX - V(40, 30), GY, { s: V(1.1, 0.95), w: 380 });
    tumbler(h, CX - V(210, 160), c.top, V(1, 0.9), { water: true });
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, fx, GY - frH * 0.5, frW * 3.4, M.practical, 0.11 * (0.8 + 0.2 * Math.sin(t * 3.1)));
    glow(h, fx + frW * 0.28, GY - frH * 0.86, 130 * fs, '#ffd9a0', 0.42);
    glow(h, wv.x, wv.y, wv.w * 0.7, GOLD(), 0.05 * kWave * fade);
    h.restore();
    circle(h, fx + frW * 0.28, GY - frH * 0.86, 5 * fs, '#ffe2ae');
    seg(h, [[fx - frW / 2 + 8, GY - frH * 0.62], [fx + frW / 2 - 8, GY - frH * 0.62]], 3, alpha('#ffe9c4', 0.26));
    FX.rings(h, fx, GY - frH * 0.5, t, { count: 3, r0: 90 * fs, r1: 470 * fs, color: GOLD(), a: 0.13 * kWave * fade, speed: 0.75 });
    h.save(); h.globalAlpha *= fade;
    waveRead(h, wv.x, wv.y, wv.w, wv.h, t, { seed: 9, color: GOLD(), w: 3.4, a: kWave });
    if (kWave > 0.8) {                                                 // the measuring frame around it
      seg(h, [[wv.x - wv.w / 2, wv.y - wv.h * 0.8], [wv.x + wv.w / 2, wv.y - wv.h * 0.8]], 2, alpha(GOLD(), 0.3 * kCalc));
      seg(h, [[wv.x - wv.w / 2, wv.y + wv.h * 0.8], [wv.x + wv.w / 2, wv.y + wv.h * 0.8]], 2, alpha(GOLD(), 0.3 * kCalc));
      for (const gx of [-0.5, -0.5 + lamW / wv.w, 0.5]) seg(h, [[wv.x + gx * wv.w, wv.y - wv.h * 0.8], [wv.x + gx * wv.w, wv.y + wv.h * 0.8]], 2, alpha(GOLD(), 0.22 * kCalc));
    }
    h.restore();
  });
  sketchGrid(g, 0.5 * kCalc * fade);
  const tgt = proj(cam, wv.x, wv.y - wv.h * 1.35, 1);
  const d1 = proj(cam, wv.x - wv.w / 2 + 40, wv.y + wv.h * 0.95, 1);
  const d2 = proj(cam, wv.x - wv.w / 2 + 40 + lamW, wv.y + wv.h * 0.95, 1);
  g.save(); g.globalAlpha *= fade;
  UI.callout(g, t, { at: tgt, to: [E.W * V(0.72, 0.5), E.H * V(0.16, 0.12)], str: 'A FREQUENCY', color: CREAM(), start: bFreq + 0.1 });
  UI.dimension(g, t, { x1: d1[0], y1: d1[1], x2: d2[0], y2: d2[1], str: '16.75 ms', color: GOLD(), start: bCalc + 0.15 });
  const kNum = ease.out(clamp(prog(t, bCalc, bCalc + 0.8)));
  const hz = (Math.round(lerp(0, 597, kNum) / 10)).toFixed(1);
  UI.readout(g, { label: 'HUM', value: `${hz} Hz`, x: V(140, 110), y: E.H * V(0.2, 0.15), color: GOLD(), size: V(64, 58), a: kNum });
  if (kNum > 0.985) text(g, 'λ = 59.7 Hz', V(142, 112), E.H * V(0.2, 0.15) + V(76, 72), { size: V(26, 28), color: alpha(BP(), 0.8), font: FONTS.ui, weight: 700, align: 'left', spacing: 1.5 });
  g.restore();
  if (prog(t, bIg, bIg + 0.3) > 0.5) stamp(g, E.W / 2, E.H * V(0.3, 0.22), V(0.62, 0.56), 'IGNORED', { k: ease.out(prog(t, bIg + 0.3, bIg + 0.6)), color: '#c98b2f', rot: 0.06 });
  FX.dust(g, t, { count: 12, color: '#cfe0ff', a: 0.12 });
} });

// s055 — "The ceiling fan becomes a geometry problem at two in the morning."
// Top-down insert: the fan as seen from the pillow, with the solution sketched over the blades.
registerShot('s055', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('night');
  const bFan = beat(info, 'fan', 0.3), bGeo = beat(info, 'geometry', 1.15), bTwo = beat(info, 'two', 2.5);
  const kGeo = clamp(prog(t, bGeo, bGeo + 0.9));
  const kFan = clamp(prog(t, bFan, bFan + 0.5));
  const kTwo = clamp(prog(t, bTwo, bTwo + 0.5));
  blurLayer(g, 9, (g2) => bedroom(g2, t, { z: lerp(1.1, 1.28, p), x: lerp(-24, 20, p), y: lerp(250, 300, p) }, { mood: 'night', fan: false, equations: false }));
  veil(g, '#0a0d16', 0.5);
  sketchGrid(g, kGeo);
  const cx = E.W / 2, cy = E.H * V(0.44, 0.4), rot = lerp(-0.05, 0.03, p);
  const s = V(3.15, 2.75) * (1 + 0.07 * p);
  const TIP = 108 * s, ROOT = 12 * s;                                  // ceilingFan's own blade geometry
  ceilingFan(g, cx, cy, s, t, { spin: 2.4, color: '#241d2a' });
  g.save(); g.globalCompositeOperation = 'lighter';
  ring(g, cx, cy, TIP * 0.62, TIP * 0.66, alpha('#cfe0ff', 0.05 * kFan)); // the swept disc
  glow(g, cx, cy, TIP * 2.1, M.rim, 0.06);
  g.restore();
  const P = (r, a) => [cx + Math.cos(a + rot) * r, cy + Math.sin(a + rot) * r];
  g.save(); g.globalAlpha *= kGeo;
  g.save(); g.setLineDash([12, 10]);
  ring(g, cx, cy, TIP, 3, alpha(BP(), 0.75));                           // the blade-tip circle
  ring(g, cx, cy, ROOT * 2.6, 2, alpha(BP(), 0.4));
  for (let i = 0; i < 4; i++) { const [ax, ay] = P(TIP, i * Math.PI / 2 + 0.35); seg(g, [[cx, cy], [ax, ay]], 2, alpha(BP(), 0.35)); }
  g.restore();
  const [rx, ry] = P(TIP, -0.62);
  UI.dimension(g, t, { x1: cx, y1: cy, x2: rx, y2: ry, str: 'r = 0.6 m', color: GOLD(), start: bGeo + 0.15 });
  arcArrow(g, cx, cy, TIP * 0.8, 0.35 + rot, 0.35 + Math.PI / 2 + rot, 4, alpha(GOLD(), 0.85), clamp(prog(t, bGeo + 0.35, bGeo + 0.95)));
  const [lx, ly] = P(TIP * 1.16, Math.PI / 4 + 0.35);
  text(g, '90°', lx, ly, { size: V(40, 44), color: GOLD(), font: FONTS.ui, weight: 900, glow: 16, glowColor: alpha(GOLD(), 0.55) });
  const [vx, vy] = P(TIP + V(80, 58), -0.1);
  text(g, 'v = ω r', vx, vy, { size: V(34, 36), color: alpha(CREAM(), 0.92), font: FONTS.ui, weight: 900, align: 'left', spacing: 1.5 });
  const [ox, oy] = P(ROOT * 3.6, Math.PI * 0.66);
  text(g, 'ω = 2.4 rad/s', ox, oy, { size: V(30, 32), color: alpha(BP(), 0.95), font: FONTS.ui, weight: 900, align: 'right' });
  g.restore();
  text(g, '4 BLADES · 90° APART', E.W * V(0.13, 0.5), E.H * V(0.9, 0.9), { size: V(28, 30), color: alpha(CREAM(), 0.55 * kGeo), font: FONTS.ui, weight: 900, align: V('left', 'center'), spacing: 3 });
  UI.badge(g, { str: '02:00 AM', x: E.W - V(120, 90), y: V(120, 180), color: COLD, a: kTwo, size: V(40, 46) });
  FX.dust(g, t, { count: 10, color: '#cfe0ff', a: 0.1 });
} });

// s056 — "You lie there... running numbers you never asked for..."
// Medium single: on his back, hands folded over the chest, digits running across the face itself.
registerShot('s056', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.2, 1.46, p), x: lerp(-36, 26, p), y: lerp(56, 6, p) };
  const { GY, CX, M } = bedroom(g, t, cam, { mood: 'night', fan: false, equations: false, equationAlpha: 0.08 });
  const bs = V(1.3, 1.15), bx = CX - V(430, 330), s = V(2.6, 2.35);
  const bNum = beat(info, 'numbers', 1.2);
  const kNum = clamp(prog(t, bNum, bNum + 0.6));
  const pose = breathe(POSES.lie, t * 0.4, 0.3, 2);
  const bedTop = GY - 122 * bs;                                          // bed() returns top = GY - 112s - 10s
  const axis = bedTop - 47 * bs;                                         // spine line, sunk pillow-deep
  const hipX = bx + 92 * bs + 108 * s;                                   // rot -90° puts the head 108s left
  const fy = axis + 100 * s;                                             // …and the rig hangs 100s below it
  const [hx, hy, hr] = heroHeadPosition({ x: hipX, y: fy, s, rot: -Math.PI / 2, facing: 1, pose });
  layer(g, cam, 0.72, (h) => numberStream(h, t * 0.7, {
    count: 26, area: [CX - V(760, 500), axis - V(620, 760), V(1520, 1000), V(200, 300)], color: COLD, a: 0.2, speed: 22, size: V(28, 30) }));
  layer(g, cam, 1, (h) => {
    bed(h, bx, GY, { s: bs });
    drawHero(h, {
      x: hipX, y: fy, s, rot: -Math.PI / 2, facing: 1, pose, expr: 'worried',
      look: [0.7, -0.15], blink: (t % 3.9) > 3.82, rim: { color: M.rim, dir: [0.18, -0.98], w: 4 },
    });
    h.save();                                                            // blanket after the figure: legs under it
    rr(h, hipX - 12 * s, axis - 22 * s, 100 * s, 44 * s, 20 * s); h.fillStyle = shade('#4d4d8f', -0.24); h.fill();
    h.fillStyle = alpha('#ffffff', 0.07); h.fillRect(hipX - 8 * s, axis - 20 * s, 92 * s, 4 * s);
    h.restore();
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, hx, hy, hr * 4.6, M.rim, 0.05);
    h.beginPath(); h.arc(hx, hy, hr * 0.92, 0, 7); h.clip();
    numberStream(h, t * 1.3, { count: 24, area: [hx - hr, hy - hr, hr * 2, hr * 2], color: COLD, a: 0.34 * kNum, speed: 30, size: hr * 0.52 });
    h.restore();
  });
  const hd = proj(cam, hx, hy - hr * 2.1, 1);
  UI.callout(g, t, { at: hd, to: [E.W * V(0.76, 0.5), E.H * V(0.17, 0.13)], str: 'NOT ASKED FOR', color: alpha(CREAM(), 0.9), size: V(28, 30), start: bNum + 0.5 });
  UI.badge(g, { str: '02:04 AM', x: E.W - V(120, 90), y: V(120, 180), color: COLD, a: 0.9 });
  FX.dust(g, t, { count: 10, color: '#cfe0ff', a: 0.1 });
} });

// s057 — "while the whole street sleeps."
// Wide pull-out through the bedroom window: the block recedes and exactly one window is still on.
registerShot('s057', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('night');
  const GY = streetGround(), CX = E.W / 2;
  const COLS = 5, ROWS = 5, HOTI = 2, HOTJ = 2;                          // his column, middle row
  const bw = V(1150, 900), bh = V(900, 1150), bx = CX - bw / 2, by = GY - bh;
  const cw = bw / COLS, rh = (bh - 30) / ROWS;
  const wx = bx + HOTI * cw + cw * 0.2, wy = by + 20 + HOTJ * rh + rh * 0.15;
  const hx = wx + cw * 0.3, hy = wy + rh * 0.31;                          // facade()'s own cell geometry
  const cam = { z: lerp(1.45, 1.02, p), x: lerp(10, 0, p), y: lerp((hy - E.H / 2) / 0.45, 0, p) };
  const ap = lerp(1.18, 0.86, p), apW = V(1300, 860) * ap, apH = V(760, 1000) * ap;
  const apX = CX - apW / 2, apY = E.H * 0.52 - apH / 2;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, [shade(M.dark, -0.15), mix(M.wall, M.dark, 0.55), M.dark]);
  g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  FX.windowFrame(g, { x: apX, y: apY, w: apW, h: apH, cols: 2, rows: 2, frame: shade(M.wall, -0.55), bar: V(13, 11) }, (g2) => {
    apartmentBlock(g2, t, cam, { mood: 'night', cols: COLS, rows: ROWS, lit: 0, seed: 15, wet: true, moon: true });
    layer(g2, cam, 0.45, (h) => {
      h.save(); h.globalCompositeOperation = 'lighter';
      glow(h, hx, hy, cw * 3.2, M.practical, 0.2);
      h.restore();
      h.fillStyle = alpha('#ffdda6', 0.9); h.fillRect(wx, wy, cw * 0.6, rh * 0.62);
      seg(h, [[wx + cw * 0.3, wy], [wx + cw * 0.3, wy + rh * 0.62]], 3, alpha(shade('#ffdda6', -0.55), 0.9));
      seg(h, [[wx, wy + rh * 0.3], [wx + cw * 0.6, wy + rh * 0.3]], 3, alpha(shade('#ffdda6', -0.55), 0.7));
      glow(h, hx, hy, cw * 1.5, '#ffd9a0', 0.14);
    });
    g2.save(); g2.globalCompositeOperation = 'lighter';                   // cold glass, strongest up close
    const sa = 0.05 * (1 - p);
    poly(g2, [[apX + apW * 0.12, apY + apH], [apX + apW * 0.3, apY], [apX + apW * 0.42, apY], [apX + apW * 0.24, apY + apH]], alpha(M.rim, sa));
    poly(g2, [[apX + apW * 0.62, apY + apH], [apX + apW * 0.8, apY], [apX + apW * 0.86, apY], [apX + apW * 0.68, apY + apH]], alpha(M.rim, sa * 0.7));
    g2.restore();
  });
  const [hx2, hy2] = proj(cam, hx, hy, 0.45);
  const kHot = clamp(prog(t, 0.35, 0.75));
  ring(g, hx2, hy2, V(34, 30) * (1 + (1 - kHot) * 0.6), 2.5, alpha(GOLD(), 0.55 * kHot));
  UI.callout(g, t, { at: [hx2, hy2], to: [E.W * V(0.8, 0.62), E.H * V(0.2, 0.14)], str: 'ONE LIGHT ON', color: GOLD(), start: beat(info, 'street', 0.6) + 0.3 });
  UI.badge(g, { str: '02:06 AM', x: E.W - V(120, 90), y: V(120, 180), color: COLD, a: 0.85 });
  veil(g, '#0a0e18', 0.16);
} });
