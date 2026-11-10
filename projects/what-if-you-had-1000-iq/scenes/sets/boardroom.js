// sets/boardroom.js — the organisation: single pendant light, long table, blinds over a night skyline.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, ring, linGrad, alpha, shade, mix, glow, text, rng, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const boardroomGround = () => E.H * V(0.8, 0.68);

export function boardroom(g, t, cam, o = {}) {
  const M = mood(o.mood || 'interiorCool'), GY = boardroomGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.45), wallDark = shade(M.dark, -0.2), glass = shade(M.dark, -0.35);
  const bw = V(1500, 1150), bh = V(520, 640), bx = CX - bw / 2, by = GY - V(760, 940);
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY + 40, [wallDark, wall, shade(wall, 0.06)]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 40 + E.H);
    g.fillStyle = glass; g.fillRect(bx, by, bw, bh);
    g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
    FX.skyline(g, { x: bx, y: by + bh * 0.72, w: bw, minH: V(90, 70), maxH: V(420, 520), color: shade(M.dark, -0.15), windowColor: alpha(M.practical, 0.6), lit: o.cityLit ?? 0.3, seed: 41 });
    const slats = 14;                                                        // blinds
    for (let i = 0; i < slats; i++) {
      const sy = by + (i / slats) * bh;
      g.fillStyle = alpha(shade(wall, 0.2), 0.55 + 0.2 * Math.sin(i)); g.fillRect(bx, sy, bw, bh / slats * (o.blinds ?? 0.55));
    }
    g.restore();
    g.strokeStyle = alpha(wallDark, 0.9); g.lineWidth = 8; g.strokeRect(bx, by, bw, bh);
    glow(g, CX, by + bh * 0.5, bw * 0.6, M.rim, 0.06);
  });
  layer(g, cam, 0.5, () => {
    g.fillStyle = alpha(wallDark, 0.55); g.fillRect(-E.W, GY - V(60, 76), E.W * 3, V(60, 76));
    for (const sx of [-1, 1]) {                                             // side cabinets
      const x = CX + sx * V(1180, 860);
      rr(g, x - V(150, 120), GY - V(420, 520), V(300, 240), V(420, 520), 6); g.fillStyle = shade(wall, -0.2); g.fill();
      g.strokeStyle = alpha(wallDark, 0.8); g.lineWidth = 3; g.stroke();
    }
  });
  layer(g, cam, 0.92, () => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, 0.08), shade(M.floor, -0.16), shade(M.dark, 0.05)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 380, alpha(wallDark, 0.5), 0.06);
  });
  return { GY, CX, M, window: { x: bx, y: by, w: bw, h: bh } };
}

export function longTable(g, x, GY, o = {}) {
  const s = o.s ?? V(1.15, 0.95), w = (o.w ?? 620) * s, h = 150 * s, c = o.color || '#241f28';
  g.fillStyle = linGrad(g, 0, GY - h, 0, GY, [shade(c, 0.12), shade(c, -0.3)]); g.fillRect(x - w, GY - h, w * 2, h);
  rr(g, x - w - 12 * s, GY - h - 18 * s, w * 2 + 24 * s, 20 * s, 6 * s); g.fillStyle = o.top || '#332c36'; g.fill();
  g.fillStyle = alpha('#dfe6ee', 0.12); g.fillRect(x - w, GY - h - 18 * s, w * 2, 5 * s);
  return { top: GY - h - 18 * s, s };
}

export function pendantLamp(g, x, GY, o = {}) {
  const y = GY - (o.len ?? V(560, 640)), c = o.color || '#1e222c';
  seg(g, [[x, y - 120], [x, y]], 4, c);
  poly(g, [[x - 90, y + 40], [x + 90, y + 40], [x + 40, y - 20], [x - 40, y - 20]], c);
  g.fillStyle = alpha('#ffe9bd', 0.9); g.beginPath(); g.ellipse(x, y + 38, 78, 14, 0, 0, 7); g.fill();
  glow(g, x, y + 40, 320, '#ffe9bd', 0.3);
  FX.lightCone(g, x, y + 44, { angle: Math.PI / 2, spread: 0.55, len: o.cone ?? V(520, 620), color: '#ffe9bd', a: 0.14 });
  return { y: y + 40 };
}

export function folder(g, x, y, s = 1, o = {}) {
  const w = 240 * s, h = 160 * s, c = o.color || '#c9a86a';
  g.save(); g.translate(x, y); g.rotate(o.rot ?? 0);
  rr(g, -w / 2, -h / 2, w, h, 6 * s); g.fillStyle = shade(c, -0.1); g.fill();
  rr(g, -w / 2 + 10 * s, -h / 2 - 16 * s, w * 0.42, 20 * s, 5 * s); g.fillStyle = c; g.fill();
  g.fillStyle = alpha('#f4ecd8', 0.9); g.fillRect(-w / 2 + 16 * s, -h / 2 + 22 * s, w - 32 * s, h - 40 * s);
  if (o.lines) shakyText(g, -w / 2 + 26 * s, -h / 2 + 44 * s, o.lines, { size: 22 * s, color: '#2a2f3c', seed: o.seed ?? 3, w: w - 60 * s, gap: 30 * s });
  g.strokeStyle = alpha(shade(c, -0.4), 0.8); g.lineWidth = 2.5 * s; g.strokeRect(-w / 2, -h / 2, w, h);
  g.restore();
  return { w, h };
}

// Handwritten, unsteady lines: the "someone's shaky hand" readout.
export function shakyText(g, x, y, lines, o = {}) {
  const size = o.size ?? 24, gap = o.gap ?? 34, r = rng(o.seed ?? 7);
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((ln, li) => {
    let px = x;
    const str = String(ln);
    for (let i = 0; i < str.length; i++) {
      const dy = (r() - 0.5) * size * 0.28, dx = (r() - 0.5) * size * 0.1;
      text(g, str[i], px + dx, y + li * gap + dy, { size: size * (0.9 + r() * 0.2), color: o.color || '#2a2f3c', font: o.font || FONTS.serif, weight: 700, align: 'left', italic: true });
      px += size * 0.52 + r() * size * 0.1;
    }
  });
}

export function ledger(g, x, y, s = 1, o = {}) {
  const w = (o.w ?? 300) * s, h = (o.h ?? 200) * s;
  rr(g, x - w / 2, y - h / 2, w, h, 6 * s); g.fillStyle = o.paper || '#efe8d8'; g.fill();
  const rows = o.rows || 6, r = rng(o.seed ?? 11);
  for (let i = 0; i < rows; i++) {
    const ry = y - h / 2 + h * (0.16 + i * 0.13);
    g.fillStyle = alpha('#1a1c24', 0.55); g.fillRect(x - w / 2 + 16 * s, ry, w * 0.42, 4 * s);
    const bad = o.badAt !== undefined && i >= o.badAt;
    g.fillStyle = bad ? alpha('#c8493a', 0.9) : alpha('#1a1c24', 0.7);
    g.fillRect(x + w * 0.1, ry, w * 0.26 * (0.5 + r() * 0.5), 5 * s);
    if (bad) { g.strokeStyle = alpha('#c8493a', 0.8); g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(x + w * 0.06, ry + 2 * s); g.lineTo(x + w * 0.4, ry + 2 * s); g.stroke(); }
  }
  g.strokeStyle = alpha('#1a1c24', 0.25); g.lineWidth = 2 * s; g.strokeRect(x - w / 2, y - h / 2, w, h);
}

export function glassWing(g, x, y, s = 1, o = {}) {
  const w = 120 * s, h = 190 * s;
  g.save(); g.translate(x, y); g.rotate(o.rot ?? 0);
  poly(g, [[-w / 2, 0], [-w * 0.34, -h], [w * 0.34, -h], [w / 2, 0]], alpha('#dfe6ee', 0.35));
  g.strokeStyle = alpha('#eef4f8', 0.6); g.lineWidth = 3 * s; g.stroke();
  if (o.liquid) poly(g, [[-w * 0.36, -h * 0.34], [-w * 0.34, -h], [w * 0.34, -h], [w * 0.36, -h * 0.34]], alpha(o.liquid, 0.6));
  g.restore();
}
