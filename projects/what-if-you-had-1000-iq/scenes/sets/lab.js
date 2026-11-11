// sets/lab.js — school science lab: strip light, glass cabinets, bench run, the cracked wall.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, ring, linGrad, alpha, shade, mix, glow, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const labGround = () => E.H * V(0.8, 0.68);

export function lab(g, t, cam, o = {}) {
  const M = mood(o.mood || 'interiorCool'), GY = labGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.05), wallDark = shade(M.wall, -0.5), tile = shade(M.wall, 0.12);
  const wx = CX - V(820, 640), ww = V(420, 340), wy = GY - V(680, 860), wh = V(320, 350);
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY + 40, [shade(M.dark, -0.3), wall, shade(wall, 0.08)]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 40 + E.H);
    g.fillStyle = alpha(tile, 0.5); g.fillRect(-E.W, GY - V(300, 380), E.W * 3, V(190, 240));
    g.strokeStyle = alpha(wallDark, 0.35); g.lineWidth = 2;
    for (let i = -8; i <= 8; i++) { const x = CX + i * V(120, 96); g.beginPath(); g.moveTo(x, GY - V(300, 380)); g.lineTo(x, GY - V(110, 140)); g.stroke(); }
  });
  layer(g, cam, 0.42, () => {
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: wallDark, bar: 9 }, (g2, x, y, w, h) => {
      g2.fillStyle = linGrad(g2, 0, y, 0, y + h, [M.sky[2], M.sky[M.sky.length - 1], mix(M.sky[M.sky.length - 1], wallDark, 0.5)]); g2.fillRect(x, y, w, h);
      FX.skyline(g2, { x, y: y + h - 6, w, minH: 16, maxH: h * 0.3, color: mix(M.sky[1], wallDark, 0.72), windowColor: alpha(M.practical, 0.3), lit: 0.12, seed: 37 });
    });
    glow(g, wx + ww / 2, wy + wh / 2, ww, M.key, 0.1);
    for (let i = 0; i < 2; i++) {                                            // glass supply cabinets
      const cx = CX + V(360, 300) + i * V(430, 360), cy = GY - V(620, 780), cw = V(330, 270), ch = V(300, 260);
      rr(g, cx, cy, cw, ch, 8); g.fillStyle = shade(wallDark, -0.15); g.fill();
      g.strokeStyle = alpha(M.rim, 0.35); g.lineWidth = 3; g.stroke();
      g.fillStyle = alpha('#9fc4d8', 0.14); g.fillRect(cx + 6, cy + 6, cw - 12, ch - 12);
      for (let s = 0; s < 3; s++) {
        const sy = cy + ch * (0.28 + s * 0.26);
        g.fillStyle = alpha(M.rim, 0.25); g.fillRect(cx + 12, sy, cw - 24, 4);
        for (let b = 0; b < 4; b++) beaker(g, cx + 40 * (1 + b * 0.6) * (cw / 330), sy, V(0.5, 0.44), { color: alpha('#bcd6e6', 0.5), level: 0.3 + ((b + s) % 3) * 0.2 });
      }
    }
    for (let i = -1; i <= 1; i++) {                                          // strip lights
      const x = CX + i * V(520, 420);
      g.fillStyle = alpha(M.rim, 0.6); g.fillRect(x - V(130, 110), GY - V(920, 1060), V(260, 220), V(12, 10));
      glow(g, x, GY - V(900, 1040), V(360, 300), M.rim, 0.1);
    }
  });
  layer(g, cam, 0.92, () => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, 0.08), shade(M.floor, -0.16), shade(M.dark, 0.05)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 380, alpha(wallDark, 0.45), 0.06);
  });
  return { GY, CX, M, win: { x: wx, y: wy, w: ww, h: wh } };
}

export function labBench(g, x, GY, o = {}) {
  const s = o.s ?? V(1.05, 0.9), w = (o.w ?? 380) * s, h = 170 * s, c = o.color || '#2c2a33';
  g.fillStyle = c; g.fillRect(x - w, GY - h, w * 2, h);
  g.strokeStyle = alpha(shade(c, -0.4), 0.9); g.lineWidth = 3;
  for (let i = -1; i <= 1; i++) g.strokeRect(x + i * w * 0.66 - w * 0.28, GY - h * 0.84, w * 0.56, h * 0.7);
  rr(g, x - w - 8 * s, GY - h - 14 * s, w * 2 + 16 * s, 16 * s, 5 * s); g.fillStyle = o.top || '#3d3a45'; g.fill();
  g.fillStyle = alpha('#dfe6ee', 0.16); g.fillRect(x - w, GY - h - 14 * s, w * 2, 4 * s);
  return { top: GY - h - 14 * s, s };
}

export function beaker(g, x, y, s = 1, o = {}) {
  const w = 46 * s, h = 74 * s, c = o.color || 'rgba(190,214,228,.45)';
  g.fillStyle = c; poly(g, [[x - w / 2, y - h], [x - w * 0.42, y], [x + w * 0.42, y], [x + w / 2, y - h]], c);
  g.strokeStyle = alpha('#e8f0f6', 0.6); g.lineWidth = 2.5 * s;
  g.beginPath(); g.moveTo(x - w / 2, y - h); g.lineTo(x - w * 0.42, y); g.lineTo(x + w * 0.42, y); g.lineTo(x + w / 2, y - h); g.stroke();
  const lv = o.level ?? 0.45;
  poly(g, [[x - w * 0.45, y - h * lv], [x - w * 0.42, y], [x + w * 0.42, y], [x + w * 0.45, y - h * lv]], o.liquid || alpha('#6fc0a8', 0.7));
  if (o.glow) glow(g, x, y - h * 0.4, w * 3, o.liquid || '#6fc0a8', 0.25);
}

export function testTube(g, x, y, s = 1, o = {}) {
  const h = 96 * s, w = 16 * s;
  g.strokeStyle = alpha('#dfe6ee', 0.55); g.lineWidth = 3 * s;
  g.beginPath(); g.moveTo(x - w / 2, y - h); g.lineTo(x - w / 2, y - w / 2); g.arc(x, y - w / 2, w / 2, Math.PI, 0, true); g.lineTo(x + w / 2, y - h); g.stroke();
  g.fillStyle = o.liquid || alpha('#c87a3f', 0.75);
  g.beginPath(); g.moveTo(x - w / 2, y - h * (o.level ?? 0.4)); g.lineTo(x - w / 2, y - w / 2); g.arc(x, y - w / 2, w / 2, Math.PI, 0, true); g.lineTo(x + w / 2, y - h * (o.level ?? 0.4)); g.closePath(); g.fill();
}

// The cracked wall: one main fracture with branches, drawn up to `progress`.
export function crackPattern(g, x, y, o = {}) {
  const r = rng(o.seed ?? 13), col = o.color || 'rgba(230,226,214,.8)', lw = o.w ?? 3, len = o.len ?? 300, prog = o.progress ?? 1;
  const branch = (sx, sy, ang, l, depth) => {
    if (depth > 3 || l < 12 || prog <= 0) return;
    const segs = 5, draw = Math.max(0, Math.min(1, prog * (4 - depth) / 3));
    let px = sx, py = sy;
    g.strokeStyle = alpha(col, 0.9 - depth * 0.2); g.lineWidth = Math.max(1, lw - depth);
    g.beginPath(); g.moveTo(px, py);
    for (let i = 1; i <= segs * draw; i++) {
      ang += (r() - 0.5) * 0.5; px += Math.cos(ang) * (l / segs); py += Math.sin(ang) * (l / segs);
      g.lineTo(px, py);
    }
    g.stroke();
    if (depth < 3 && draw > 0.7) { branch(px, py, ang + 0.7 + r() * 0.4, l * 0.55, depth + 1); branch(px, py, ang - 0.8 - r() * 0.3, l * 0.5, depth + 1); }
    return [px, py];
  };
  branch(x, y, o.angle ?? Math.PI * 0.42, len, 0);
  if (o.node) { ring(g, x, y, 10, lw, col); glow(g, x, y, 90, o.glowColor || '#d6b58a', 0.2 * prog); }
}

// Number line drawn on the lab wall for the "mapping the crack pattern" beat.
export function wallChart(g, x, y, s = 1, o = {}) {
  const w = (o.w ?? 420) * s;
  g.strokeStyle = alpha(o.color || '#d6b58a', 0.7); g.lineWidth = 3 * s;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.stroke();
  for (let i = 0; i <= 8; i++) {
    const px = x + (i / 8) * w, big = i % 4 === 0;
    g.beginPath(); g.moveTo(px, y - (big ? 16 : 9) * s); g.lineTo(px, y); g.stroke();
  }
  if (o.arc) { g.beginPath(); g.arc(x + o.arc[0] * w, y, o.arc[1] * w, Math.PI, 0, true); g.stroke(); }
}
