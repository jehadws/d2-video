// sets/city.js — dusk/night street: skyline, facades, crossroads, lamps, optional rain and fire glow.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, ring, linGrad, alpha, shade, mix, glow, text, rng, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const cityGround = () => E.H * V(0.8, 0.68);

export function city(g, t, cam, o = {}) {
  const M = mood(o.mood || 'dusk'), GY = cityGround(), CX = E.W / 2;
  const far = mix(M.sky[M.sky.length - 1], M.dark, 0.55), mid = shade(M.wall, -0.4), road = o.wet ? shade(M.road, -0.1) : M.road;
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    if (o.mood === 'night' || o.mood === 'storm') {
      FX.stars(g, t, { seed: 6, count: 90, area: [-E.W * 0.2, -E.H * 0.4, E.W * 1.4, E.H * 0.5], color: '#cfd8e6' });
      FX.moon(g, CX + V(620, 460), GY - V(900, 1080), V(46, 38));
    }
    FX.skyline(g, { x: -E.W * 0.15, y: GY - V(300, 240), w: E.W * 1.3, minH: V(120, 90), maxH: V(560, 700), color: far, windowColor: alpha(M.practical, 0.55), lit: o.lit ?? 0.22, seed: o.seed ?? 12 });
  });
  layer(g, cam, 0.45, () => {
    for (let i = -2; i <= 2; i++) {
      const bw = V(430, 340), bh = V(560, 760) * (0.7 + ((i + 3) % 3) * 0.22), bx = CX + i * V(520, 420) - bw / 2;
      FX.facade(g, { x: bx, y: GY - V(150, 130), w: bw, h: bh, color: mid, win: alpha(M.practical, 0.75), dark: shade(mid, -0.4), cols: 4, rows: 6, lit: o.winLit ?? 0.28, seed: 30 + i * 5, door: i === 0 });
      if (o.fire) glow(g, o.fire.x, o.fire.y, V(700, 560), '#ff8a4a', o.fire.a ?? 0.3);
    }
    FX.hills(g, { y: GY - V(60, 60), amp: 20, color: shade(mid, -0.2), freq: 0.006 });
  });
  layer(g, cam, 0.78, () => {
    g.fillStyle = linGrad(g, 0, GY - V(150, 130), 0, GY + E.H * 0.5, [shade(road, 0.08), road, shade(road, -0.25)]);
    g.fillRect(-E.W, GY - V(150, 130), E.W * 3, E.H * 2);
    g.fillStyle = alpha(M.rim, 0.16); g.fillRect(-E.W, GY - V(150, 130), E.W * 3, V(10, 10));   // kerb
    crosswalk(g, GY, { x: CX, w: V(560, 430), color: alpha(M.rim, 0.22) });
    g.strokeStyle = alpha(M.practical, 0.3); g.lineWidth = 5; g.setLineDash([V(60, 46), V(50, 40)]);
    g.beginPath(); g.moveTo(-E.W, GY + V(120, 110)); g.lineTo(E.W * 2, GY + V(120, 110)); g.stroke(); g.setLineDash([]);
    if (o.cars) for (const c of o.cars) car(g, c.x, GY + (c.y ?? V(90, 80)), c.s ?? V(1.1, 0.9), { color: c.color, head: c.head ?? 1, tail: c.tail ?? 0, dir: c.dir ?? 1 });
    if (o.crowd) FX.crowd(g, t, { x: CX - V(700, 540), y: GY - V(170, 210), w: V(1400, 1080), rows: 2, rowH: V(34, 30), size: V(0.8, 0.66), color: shade(mid, -0.15), seed: 44 });
  });
  layer(g, cam, 0.95, () => {
    if (o.lamps === false) return;
    for (const lx of [CX - V(820, 620), CX + V(760, 580)]) {
      FX.lampPost(g, lx, GY - V(150, 130), V(360, 300), { color: shade(M.dark, -0.2), light: M.practical, on: true });
      FX.pool(g, lx + V(34, 30), GY + V(70, 60), V(230, 190), V(60, 48), M.practical, 0.16);
    }
    if (o.wet) { g.save(); g.globalCompositeOperation = 'lighter'; for (const lx of [CX - V(820, 620), CX + V(760, 580)]) poly(g, [[lx - V(18, 14), GY], [lx + V(18, 14), GY], [lx + V(60, 46), GY + V(300, 240)], [lx - V(60, 46), GY + V(300, 240)]], alpha(M.practical, 0.09)); g.restore(); }
  });
  if (o.rain) FX.rain(g, t, { a: o.rain, color: M.rim, angle: o.wind ?? 0.16, speed: 1400, count: 240, seed: 21 });
  return { GY, CX, M, road };
}

export function crosswalk(g, GY, o = {}) {
  const x = o.x ?? E.W / 2, w = o.w ?? V(560, 430), c = o.color || 'rgba(230,226,214,.2)';
  for (let i = 0; i < 6; i++) {
    const u = i / 5, x0 = x - w / 2 + u * w * 0.9;
    poly(g, [[x0, GY - V(20, 18)], [x0 + w * 0.07, GY - V(20, 18)], [x0 + w * 0.13, GY + V(150, 130)], [x0 + w * 0.04, GY + V(150, 130)]], c);
  }
}

export function car(g, x, y, s = 1, o = {}) {
  const dir = o.dir ?? 1, w = 300 * s, h = 76 * s, c = o.color || '#2a2f3c';
  g.save(); g.translate(x, y); g.scale(dir, 1);
  poly(g, [[-w / 2, -h * 0.35], [-w * 0.26, -h * 1.1], [w * 0.2, -h * 1.15], [w * 0.42, -h * 0.4], [w / 2, -h * 0.3], [w / 2, 0], [-w / 2, 0]], c);
  poly(g, [[-w * 0.22, -h * 1.0], [w * 0.16, -h * 1.04], [w * 0.3, -h * 0.42], [-w * 0.28, -h * 0.4]], alpha('#9fc4d8', 0.4));
  for (const wx of [-w * 0.28, w * 0.3]) { circle(g, wx, 0, 26 * s, '#141821'); circle(g, wx, 0, 12 * s, '#3d4450'); }
  if (o.head) { circle(g, w * 0.49, -h * 0.42, 9 * s, '#ffe9bd'); glow(g, w * 0.55, -h * 0.4, 150 * s, '#ffe9bd', 0.3 * o.head); }
  if (o.tail) { circle(g, -w * 0.49, -h * 0.42, 8 * s, '#e0523f'); glow(g, -w * 0.5, -h * 0.4, 90 * s, '#e0523f', 0.26 * o.tail); }
  g.restore();
}

export function trafficLight(g, x, GY, s = 1, o = {}) {
  const h = V(360, 320) * s, c = shade('#1e222c', 0.1);
  seg(g, [[x, GY], [x, GY - h]], 10 * s, c);
  seg(g, [[x, GY - h], [x + 120 * s, GY - h]], 9 * s, c);
  rr(g, x + 92 * s, GY - h - 118 * s, 62 * s, 128 * s, 10 * s); g.fillStyle = c; g.fill();
  const st = o.state ?? 'red';
  for (const [i, col] of [[0, '#e04a3a'], [1, '#e8b23c'], [2, '#6fc07a']]) {
    const on = (st === 'red' && i === 0) || (st === 'amber' && i === 1) || (st === 'green' && i === 2);
    circle(g, x + 123 * s, GY - h - 100 * s + i * 44 * s, 17 * s, on ? col : shade(col, -0.7));
    if (on) glow(g, x + 123 * s, GY - h - 100 * s + i * 44 * s, 120 * s, col, 0.4);
  }
  return { top: GY - h };
}

export function busShelter(g, x, GY, s = 1, o = {}) {
  const w = 300 * s, h = 250 * s, c = o.color || '#242a34';
  g.fillStyle = c; g.fillRect(x - w / 2, GY - h, w, 14 * s);
  g.fillStyle = alpha('#9fc4d8', 0.22); g.fillRect(x - w / 2, GY - h, w * 0.14, h);
  seg(g, [[x + w / 2 - 8 * s, GY - h], [x + w / 2 - 8 * s, GY]], 8 * s, c);
  seg(g, [[x - w / 2, GY - h], [x - w / 2, GY]], 8 * s, c);
  if (o.lit) { g.fillStyle = alpha('#ffe9bd', 0.85); g.fillRect(x - w * 0.34, GY - h * 0.86, w * 0.6, h * 0.5); glow(g, x, GY - h * 0.6, w, '#ffe9bd', 0.28); }
}

// Timetable / crossword style board: rows of text that can be revealed progressively.
export function board(g, x, y, s = 1, o = {}) {
  const w = (o.w ?? 340) * s, h = (o.h ?? 220) * s, c = o.color || '#161c26';
  rr(g, x - w / 2, y - h / 2, w, h, 10 * s); g.fillStyle = c; g.fill();
  g.strokeStyle = alpha('#8fa0b4', 0.35); g.lineWidth = 3 * s; g.stroke();
  const rows = o.rows || [];
  rows.forEach((ln, i) => {
    const ry = y - h / 2 + h * (0.16 + i * (0.72 / Math.max(1, rows.length - 1 || 1)));
    text(g, ln, x - w / 2 + 22 * s, ry, { size: 22 * s, color: i === o.hi ? (o.hiColor || '#d6b58a') : alpha('#dfe6ee', 0.8), font: FONTS.ui, weight: i === o.hi ? 900 : 700, align: 'left' });
  });
  return { w, h };
}
