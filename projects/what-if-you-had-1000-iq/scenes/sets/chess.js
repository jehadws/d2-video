// sets/chess.js — chess club room: high window, long tables, boards in table-top perspective.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, ring, linGrad, alpha, shade, mix, glow, text, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const chessGround = () => E.H * V(0.8, 0.68);

export function chessRoom(g, t, cam, o = {}) {
  const M = mood(o.mood || 'dusk'), GY = chessGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.3), wallDark = shade(M.dark, -0.2);
  const wx = CX + V(560, 420), wy = GY - V(760, 900), ww = V(430, 360), wh = V(300, 340);
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY + 40, [shade(M.dark, -0.4), wallDark, wall]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 40 + E.H);
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: wallDark, bar: 9 }, (g2, x, y, w, h) => {
      g2.fillStyle = linGrad(g2, 0, y, 0, y + h, [M.sky[2], M.sky[M.sky.length - 1], mix(M.sky[M.sky.length - 1], wallDark, 0.5)]);
      g2.fillRect(x, y, w, h);
      FX.skyline(g2, { x, y: y + h - 6, w, minH: 20, maxH: h * 0.34, color: mix(M.sky[1], wallDark, 0.75), windowColor: alpha(M.practical, 0.35), lit: 0.14, seed: 7 });
    });
    glow(g, wx + ww / 2, wy + wh / 2, ww * 1.4, M.key, 0.13);
    FX.godRays(g, wx + ww * 0.4, wy, { a: 0.08, color: M.key, len: V(820, 980), spread: 0.8, angle: 2.35 });
    for (let i = -1; i <= 1; i += 2) {                                        // banners over the far wall
      rr(g, CX + i * V(620, 500) - V(150, 120), GY - V(820, 980), V(300, 240), V(110, 90), 8);
      g.fillStyle = alpha(shade(M.practical, -0.5), 0.85); g.fill();
      text(g, 'CHESS', CX + i * V(620, 500), GY - V(765, 935), { size: V(38, 32), color: alpha(M.rim, 0.5), font: FONTS.ui, weight: 900 });
    }
  });
  layer(g, cam, 0.72, () => {
    for (let row = 0; row < 3; row++) {
      const ry = GY + V(6, 0) - row * V(66, 54), sc = 1 - row * 0.16;
      for (let i = -1; i <= 1; i++) {
        if (row > 0 && i === 0 && o.clearCentre) continue;
        chessTable(g, CX + i * V(620, 480) + row * V(70, 56), ry, V(0.9, 0.78) * sc, { color: shade(wall, -0.2) });
      }
    }
  });
  layer(g, cam, 0.92, () => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, 0.1), shade(M.floor, -0.25), shade(M.dark, -0.05)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 360, alpha(wallDark, 0.5), 0.07);
    FX.pool(g, wx + ww / 2, GY + V(110, 90), V(560, 420), V(170, 130), M.key, 0.12);
  });
  return { GY, CX, M, win: { x: wx, y: wy, w: ww, h: wh } };
}

export function chessTable(g, x, y, s = 1, o = {}) {
  const w = (o.w ?? 300) * s, top = y - 118 * s, c = o.color || '#3a2a30';
  seg(g, [[x - w * 0.72, top + 8 * s], [x - w * 0.8, y]], 9 * s, shade(c, -0.25));
  seg(g, [[x + w * 0.72, top + 8 * s], [x + w * 0.8, y]], 9 * s, shade(c, -0.25));
  rr(g, x - w, top - 12 * s, w * 2, 20 * s, 7 * s); g.fillStyle = c; g.fill();
  g.fillStyle = alpha('#ffe6bd', 0.16); g.fillRect(x - w + 6 * s, top - 12 * s, w * 2 - 12 * s, 5 * s);
  return { top: top - 12 * s };
}

// Board seen from a low angle across the table: squashed 8x8 grid with upright pieces.
export function chessBoard(g, x, y, s = 1, o = {}) {
  const sq = (o.sq ?? 44) * s, half = sq * 4, tilt = o.tilt ?? 0.5;
  g.save(); g.translate(x, y);
  g.save(); g.scale(1, tilt);
  rr(g, -half - 16 * s, -half - 16 * s, sq * 8 + 32 * s, sq * 8 + 32 * s, 8 * s); g.fillStyle = o.frame || '#2a1f24'; g.fill();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    g.fillStyle = (r + c) % 2 ? (o.dark || '#2f3a44') : (o.light || '#b9ab92');
    g.fillRect(-half + c * sq, -half + r * sq, sq, sq);
  }
  g.fillStyle = alpha('#000000', 0.18); g.fillRect(-half, -half, sq * 8, sq * 8);
  if (o.highlight) for (const [f, r] of o.highlight) { g.fillStyle = alpha(o.hlColor || '#d6b58a', 0.4); g.fillRect(-half + f * sq, -half + r * sq, sq, sq); }
  g.restore();
  for (const p of o.pieces || []) {
    const px = -half + (p.f + 0.5) * sq, py = -half + (p.r + 0.5) * sq * tilt;
    g.save(); g.translate(px, py); g.scale(1, 1 / tilt * (o.pieceScale ?? 0.9));
    chessPiece(g, 0, 0, sq * 0.34, p.c, p.t, { glow: o.litPiece === p });
    g.restore();
  }
  g.restore();
  return { sq, half, tilt, x, y };
}

export function chessPiece(g, x, y, s, color, type = 'P', o = {}) {
  const c = color === 'w' ? '#efe7d6' : '#181c26';
  if (o.glow) glow(g, x, y - s, s * 4, '#d6b58a', 0.35);
  g.save(); g.translate(x, y);
  g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, s * 0.9, s * 0.3, 0, 0, 7); g.fill();
  const ink = color === 'w' ? 'rgba(30,34,48,.55)' : 'rgba(240,236,224,.4)';
  if (type === 'P') { poly(g, [[-s * 0.42, 0], [-s * 0.2, -s * 0.9], [s * 0.2, -s * 0.9], [s * 0.42, 0]], c); circle(g, 0, -s * 1.15, s * 0.38, c); }
  else if (type === 'R') { g.fillRect(-s * 0.42, -s * 1.3, s * 0.84, s * 1.3); for (let i = -1; i <= 1; i++) g.fillRect(i * s * 0.34 - s * 0.12, -s * 1.6, s * 0.24, s * 0.34); }
  else if (type === 'N') { poly(g, [[-s * 0.45, 0], [-s * 0.3, -s * 0.8], [-s * 0.55, -s * 1.3], [-s * 0.1, -s * 1.7], [s * 0.35, -s * 1.1], [s * 0.4, 0]], c); g.fillStyle = ink; circle(g, -s * 0.16, -s * 1.35, s * 0.09, ink); }
  else if (type === 'B') { poly(g, [[-s * 0.4, 0], [-s * 0.12, -s * 0.7], [s * 0.12, -s * 0.7], [s * 0.4, 0]], c); poly(g, [[-s * 0.3, -s * 0.7], [0, -s * 1.7], [s * 0.3, -s * 0.7]], c); circle(g, 0, -s * 1.8, s * 0.14, c); }
  else if (type === 'Q') { poly(g, [[-s * 0.5, 0], [-s * 0.34, -s * 1.5], [s * 0.34, -s * 1.5], [s * 0.5, 0]], c); for (let i = -2; i <= 2; i++) circle(g, i * s * 0.2, -s * 1.72 - (i % 2 ? 0 : s * 0.12), s * 0.12, c); }
  else { poly(g, [[-s * 0.5, 0], [-s * 0.36, -s * 1.6], [s * 0.36, -s * 1.6], [s * 0.5, 0]], c); g.fillRect(-s * 0.09, -s * 2.15, s * 0.18, s * 0.6); g.fillRect(-s * 0.28, -s * 2.0, s * 0.56, s * 0.16); }
  g.restore();
}

// Gold prediction lines fanning over the board: the "forty moves" read.
export function ghostMoves(g, board, o = {}) {
  const { half, tilt, x, y } = board;
  g.save(); g.translate(x, y);
  const col = o.color || '#d6b58a';
  for (let i = 0; i < (o.count ?? 8); i++) {
    const a = (i / (o.count ?? 8)) * Math.PI * 2 + (o.rot ?? 0), len = half * (0.5 + 0.5 * ((i % 3) / 2 + 0.3));
    const ex = Math.cos(a) * len, ey = Math.sin(a) * len * tilt;
    g.globalAlpha = (o.a ?? 0.55) * (o.progress === undefined ? 1 : Math.max(0, Math.min(1, o.progress * (o.count ?? 8) - i)));
    seg(g, [[0, 0], [ex, ey]], 2.5, alpha(col, 0.8));
    ring(g, ex, ey, 7, 2, alpha(col, 0.9));
  }
  g.restore();
}

export function chessClock(g, x, y, s = 1, o = {}) {
  rr(g, x - 92 * s, y - 62 * s, 184 * s, 62 * s, 8 * s); g.fillStyle = '#241d24'; g.fill();
  for (const [i, sx] of [[0, -1], [1, 1]]) {
    FX.clock(g, x + sx * 44 * s, y - 34 * s, 26 * s, o.times ? o.times[i] : 0, { face: i ? '#e6dcc8' : '#2a2f3a', ink: i ? '#2a2f3a' : '#e6dcc8', red: '#c8493a', speed: 0 });
  }
}
