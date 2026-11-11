// sets/class.js — school classroom, day. Window wall camera-right, chalkboard centre, desk rows.
import { E, V, mood, layer, backdrop, rr, seg, poly, linGrad, alpha, shade, mix, glow, text, rng, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const classGround = () => E.H * V(0.8, 0.68);

export function classroom(g, t, cam, o = {}) {
  const M = mood(o.mood || 'day'), GY = classGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.12), wallDark = shade(M.wall, -0.5), trim = shade(M.dark, -0.1);
  const board = { x: CX - V(300, 40), y: GY - V(600, 780), w: V(760, 620), h: V(330, 400) };
  const wx = CX + V(700, 470), ww = V(430, 340), wy = GY - V(620, 800), wh = V(330, 390);
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H * 0.4, 0, GY + 40, [shade(M.dark, -0.25), wall, shade(wall, 0.12)]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 40 + E.H);
    g.fillStyle = alpha(wallDark, 0.5); g.fillRect(-E.W, GY - V(96, 120), E.W * 3, V(26, 30));   // dado line
  });
  layer(g, cam, 0.4, () => {
    chalkboard(g, board, { lines: o.board || [], chalk: alpha(M.rim, 0.86) });
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: wallDark, bar: 9 }, (g2, x, y, w, h) => {
      g2.fillStyle = linGrad(g2, 0, y, 0, y + h, [M.sky[2], M.sky[M.sky.length - 1], mix(M.sky[M.sky.length - 1], wallDark, 0.4)]);
      g2.fillRect(x, y, w, h);
      FX.skyline(g2, { x, y: y + h - 6, w, minH: 18, maxH: h * 0.3, color: mix(M.sky[1], wallDark, 0.72), windowColor: alpha(M.practical, 0.3), lit: 0.1, seed: 31 });
    });
    glow(g, wx + ww / 2, wy + wh / 2, ww, M.key, 0.12);
    FX.godRays(g, wx + ww * 0.4, wy + wh * 0.2, { a: 0.07, color: M.key, len: V(760, 900), spread: 0.75, angle: 2.5 });
    FX.clock(g, CX - V(760, 560), GY - V(660, 860), V(46, 38), t, { face: alpha(M.practical, 0.9), ink: wallDark, red: wallDark, speed: o.clockSpeed ?? 1 });
    for (let i = 0; i < 3; i++) {                                              // reading posters on the far wall
      const px = CX - V(1120, 780) + i * V(190, 150), py = GY - V(560, 740);
      rr(g, px, py, V(150, 120), V(190, 150), 6); g.fillStyle = shade(wall, 0.16); g.fill();
      g.strokeStyle = alpha(wallDark, 0.7); g.lineWidth = 3; g.stroke();
      g.fillStyle = alpha(M.rim, 0.28);
      for (let r = 0; r < 4; r++) g.fillRect(px + 16, py + 30 + r * V(26, 22), V(110, 84) - r * 14, 5);
    }
  });
  layer(g, cam, 0.7, () => {
    if (o.desks === false) return;
    for (let row = 0; row < 3; row++) {
      const ry = GY - V(30, -10) + row * V(58, 46), sc = 1 - row * 0.13;
      for (let i = -2; i <= 2; i++) {
        if (row === 0 && Math.abs(i) < 1.5 && o.clearFront) continue;
        schoolDesk(g, CX + i * V(430, 330) + row * V(60, 44), ry, V(1.05, 0.9) * sc, { color: shade(wall, -0.28), top: shade(M.practical, -0.45) });
      }
    }
  });
  layer(g, cam, 0.92, () => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, 0.08), shade(M.floor, -0.18), shade(M.dark, 0.05)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 380, alpha(wallDark, 0.45), 0.07);
    g.save(); g.globalCompositeOperation = 'lighter';
    poly(g, [[wx - ww / 2, GY], [wx + ww / 2, GY], [wx + ww * 0.2, GY + V(360, 300)], [wx - ww, GY + V(360, 300)]], alpha(M.key, 0.09));
    g.restore();
  });
  return { GY, CX, M, board, win: { x: wx, y: wy, w: ww, h: wh } };
}

// Green board with chalk lines; returns nothing. `lines` are strings drawn top-down.
export function chalkboard(g, b, o = {}) {
  const frame = o.frame || '#3a2a22';
  rr(g, b.x - 14, b.y - 14, b.w + 28, b.h + 28, 8); g.fillStyle = frame; g.fill();
  g.fillStyle = linGrad(g, 0, b.y, 0, b.y + b.h, [o.surface || '#1e2b26', shade(o.surface || '#1e2b26', -0.3)]);
  g.fillRect(b.x, b.y, b.w, b.h);
  g.fillStyle = alpha('#d8d2c4', 0.1); g.fillRect(b.x, b.y + b.h - 12, b.w, 12);            // chalk rail
  const chalk = o.chalk || 'rgba(230,226,214,.85)';
  (o.lines || []).forEach((ln, i) => {
    const size = (o.sizes && o.sizes[i]) || Math.min(b.h * 0.16, b.w * 0.09);
    text(g, ln, b.x + b.w * 0.08, b.y + b.h * (0.18 + i * 0.19), { size, color: chalk, font: FONTS.ui, weight: 700, align: 'left', base: 'middle' });
  });
}

export function schoolDesk(g, x, y, s = 1, o = {}) {
  const c = o.color || '#3a2a30', top = o.top || '#4a3a34', w = 168 * s, h = 96 * s;
  rr(g, x - w / 2, y - h - 26 * s, w, 16 * s, 4 * s); g.fillStyle = top; g.fill();
  g.fillStyle = alpha('#ffe6bd', 0.14); g.fillRect(x - w / 2 + 4 * s, y - h - 26 * s, w - 8 * s, 4 * s);
  seg(g, [[x - w * 0.4, y - h - 10 * s], [x - w * 0.42, y]], 6 * s, c);
  seg(g, [[x + w * 0.4, y - h - 10 * s], [x + w * 0.42, y]], 6 * s, c);
  rr(g, x - w * 0.34, y - h * 0.52, w * 0.68, h * 0.4, 4 * s); g.fillStyle = shade(c, 0.12); g.fill();
  return { top: y - h - 26 * s };
}

// Answer sheet with filled/blank rows, used for the four-minute exam beat.
export function answerSheet(g, x, y, s = 1, o = {}) {
  const w = 210 * s, h = 132 * s;
  g.save(); g.translate(x, y); g.rotate(o.rot ?? -0.05);
  rr(g, -w / 2, -h / 2, w, h, 6 * s); g.fillStyle = o.paper || '#f2ece0'; g.fill();
  g.strokeStyle = alpha('#1a1c24', 0.22); g.lineWidth = 2 * s; g.stroke();
  const r = rng(o.seed ?? 5);
  for (let i = 0; i < 6; i++) {
    const ry = -h / 2 + 22 * s + i * 17 * s;
    g.fillStyle = alpha('#1a1c24', 0.25); g.fillRect(-w / 2 + 34 * s, ry, w * 0.52, 4 * s);
    const filled = o.filled === 'all' || (o.filled === 'none' ? false : r() < (o.ratio ?? 0.5));
    if (filled) { g.fillStyle = '#2b3550'; g.font = `900 ${15 * s}px ${FONTS.ui}`; g.textAlign = 'left'; g.fillText(['A', 'C', 'B', 'D', 'A', 'C'][i], -w / 2 + 12 * s, ry + 4 * s); }
    else { g.strokeStyle = alpha('#1a1c24', 0.3); g.lineWidth = 2 * s; g.beginPath(); g.arc(-w / 2 + 18 * s, ry + 2 * s, 6 * s, 0, 7); g.stroke(); }
  }
  g.restore();
}
