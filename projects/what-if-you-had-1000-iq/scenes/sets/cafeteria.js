// sets/cafeteria.js — school cafeteria, low afternoon sun through a window wall. Reusable by any shot.
// Value structure: dark ceiling band and far wall, warm window rectangles as the bright accents, floor lit in pools.
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, alpha, shade, mix, glow } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const cafeteriaGround = () => E.H * V(0.8, 0.68);

export function cafeteria(g, t, cam, o = {}) {
  const M = mood(o.mood || 'golden'), GY = cafeteriaGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.35), wallDark = shade(M.wall, -0.62), ceil = shade(M.dark, -0.35);
  layer(g, cam, 0.12, () => {                                   // window wall with the afternoon street beyond
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY + 40, [ceil, wallDark, wall]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 40 + E.H);
    const top = GY - V(560, 700), wh = V(300, 340);
    for (let i = -2; i <= 2; i++) {
      const ww = V(330, 260), wx = CX + i * V(470, 380) - ww / 2, wy = top;
      FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 1, frame: wallDark, bar: 10 }, (g2, x, y, w, h) => {
        g2.fillStyle = linGrad(g2, 0, y, 0, y + h, [shade(M.key, 0.25), M.key, mix(M.key, wallDark, 0.55)]);
        g2.fillRect(x, y, w, h);
        FX.skyline(g2, { x, y: y + h - 8, w, minH: 24, maxH: h * 0.42, color: mix(M.sky[1], wallDark, 0.7), windowColor: alpha(M.practical, 0.4), lit: 0.12, seed: 14 + i });
      });
      glow(g, wx + ww / 2, wy + wh / 2, ww * 1.1, M.key, 0.14);
    }
    g.fillStyle = wall; g.fillRect(-E.W, top + wh, E.W * 3, GY - top - wh + 40);
    g.fillStyle = alpha(wallDark, 0.6); g.fillRect(-E.W, top + wh, E.W * 3, 10);
  });
  layer(g, cam, 0.4, () => {                                     // far hall: banner, clock, double doors
    const by = GY - V(700, 880);
    poly(g, [[CX - V(560, 430), by], [CX + V(560, 430), by], [CX + V(520, 400), by + V(96, 120)], [CX - V(520, 400), by + V(96, 120)]], shade(M.practical, -0.55));
    g.fillStyle = alpha(M.rim, 0.5);
    for (let i = -4; i <= 4; i++) circle(g, CX + i * V(120, 96), by + V(140, 170), V(14, 12), alpha(M.rim, 0.45));
    FX.clock(g, CX - V(880, 620), by + V(70, 90), V(52, 44), t, { face: alpha(M.practical, 0.85), ink: wallDark, red: wallDark });
    for (const sx of [-1, 1]) {
      const dx = CX + sx * V(1180, 820);
      g.fillStyle = wallDark; g.fillRect(dx - V(90, 70), GY - V(340, 420), V(180, 140), V(340, 420));
      g.fillStyle = alpha(M.practical, 0.25); g.fillRect(dx - V(70, 54), GY - V(310, 390), V(140, 108), V(310, 390));
    }
  });
  layer(g, cam, 0.7, () => {                                     // crowd rows, far enough to stay unreadable
    if (o.crowd === false) return;
    FX.crowd(g, t, { x: -E.W * 0.2, y: GY - V(230, 300), w: E.W * 1.4, rows: 3, rowH: V(30, 26), size: V(0.85, 0.7), color: shade(wall, -0.15), cheer: o.cheer ?? 0, seed: 21 });
  });
  layer(g, cam, 0.92, () => {                                    // floor: window light laid across it
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, 0.05), shade(M.floor, -0.14), shade(M.dark, 0.02)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 420, alpha(wallDark, 0.5), 0.07);
    for (let i = -2; i <= 2; i++) {
      const x = CX + i * V(470, 380), w = V(330, 260);
      g.save(); g.globalCompositeOperation = 'lighter';
      poly(g, [[x - w / 2, GY], [x + w / 2, GY], [x + w * 0.95, GY + V(330, 260)], [x - w * 0.05, GY + V(330, 260)]], alpha(M.key, 0.1));
      g.restore();
    }
  });
  return { GY, CX, M };
}

// Long lunch table. Returns the top surface y so shots can sit trays and hands on it.
export function cafTable(g, x, GY, o = {}) {
  const s = o.s ?? 1, w = (o.w ?? 300) * s, top = GY - 132 * s, c = o.color || '#3a2a30';
  seg(g, [[x - w * 0.7, top + 6 * s], [x - w * 0.78, GY]], 9 * s, shade(c, -0.25));
  seg(g, [[x + w * 0.7, top + 6 * s], [x + w * 0.78, GY]], 9 * s, shade(c, -0.25));
  rr(g, x - w, top - 10 * s, w * 2, 16 * s, 6 * s); g.fillStyle = c; g.fill();
  g.fillStyle = alpha('#ffe6bd', 0.22); g.fillRect(x - w + 6 * s, top - 10 * s, w * 2 - 12 * s, 4 * s);
  g.fillStyle = shade(c, -0.35); g.fillRect(x - w, top + 5 * s, w * 2, 7 * s);
  return { top: top - 10 * s };
}

export function tray(g, x, y, s = 1, color = '#b8563f') {
  rr(g, x - 44 * s, y - 9 * s, 88 * s, 16 * s, 4 * s); g.fillStyle = color; g.fill();
  circle(g, x - 18 * s, y - 12 * s, 11 * s, '#efe6d8');
  rr(g, x + 8 * s, y - 22 * s, 22 * s, 12 * s, 3 * s); g.fillStyle = '#d8b26a'; g.fill();
}

// Floating word cards for the language-learning beat.
export function wordCard(g, x, y, s, str, o = {}) {
  const w = 118 * s, h = 62 * s, a = o.alpha ?? 1;
  g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(o.rot ?? 0);
  rr(g, -w / 2, -h / 2, w, h, 8 * s); g.fillStyle = o.color || '#f3ece0'; g.fill();
  g.strokeStyle = alpha('#172033', 0.25); g.lineWidth = 2 * s; g.stroke();
  g.fillStyle = '#172033'; g.font = `900 ${26 * s}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(str, 0, 0); g.restore();
}
