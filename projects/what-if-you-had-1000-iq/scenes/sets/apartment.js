// sets/apartment.js — Leo's block at night from the street: wet pavement, one window going orange.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, linGrad, alpha, shade, mix, glow, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const streetGround = () => E.H * V(0.8, 0.68);

export function apartmentBlock(g, t, cam, o = {}) {
  const M = mood(o.mood || 'night'), GY = streetGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.25), wallDark = shade(M.dark, -0.15);
  const bw = V(1150, 900), bh = V(900, 1150), bx = CX - bw / 2, by = GY - bh;
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    FX.stars(g, t, { seed: 9, count: 70, area: [-E.W * 0.2, -E.H * 0.3, E.W * 1.4, E.H * 0.45], color: '#c3cede' });
    if (o.moon !== false) FX.moon(g, CX - V(700, 520), GY - V(980, 1140), V(40, 34));
    FX.skyline(g, { x: -E.W * 0.2, y: GY - V(420, 420), w: E.W * 1.4, minH: V(140, 110), maxH: V(520, 640), color: mix(M.sky[1], wallDark, 0.6), windowColor: alpha(M.practical, 0.45), lit: 0.16, seed: 27 });
  });
  layer(g, cam, 0.45, () => {
    FX.facade(g, { x: bx, y: GY, w: bw, h: bh, color: wall, win: alpha(M.practical, 0.7), dark: wallDark, cols: o.cols ?? 5, rows: o.rows ?? 5, lit: o.lit ?? 0.3, seed: o.seed ?? 15, door: true });
    g.fillStyle = alpha(wallDark, 0.6); g.fillRect(bx - 10, by - 18, bw + 20, 22);
    if (o.fire) {                                                            // the stairwell window, burning
      const fw = V(150, 120), fh = V(190, 160);
      g.fillStyle = alpha('#ffb066', 0.92); g.fillRect(o.fire.x - fw / 2, o.fire.y - fh, fw, fh);
      glow(g, o.fire.x, o.fire.y - fh * 0.5, V(760, 620), '#ff8a4a', (o.fire.a ?? 0.5));
      for (let i = 0; i < 3; i++) glow(g, o.fire.x + Math.sin(t * 2 + i) * 30, o.fire.y - fh * (0.2 + i * 0.25), V(220, 180), '#ffd08a', 0.25);
    }
    fireEscape(g, bx + bw * (o.escape ?? 0.72), GY, { floors: o.rows ?? 5, s: V(1, 0.85), color: shade(wallDark, -0.2) });
  });
  layer(g, cam, 0.8, () => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.road, 0.08), shade(M.road, -0.14), shade(M.dark, 0.02)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    g.fillStyle = alpha(M.rim, 0.14); g.fillRect(-E.W, GY - V(16, 14), E.W * 3, V(16, 14));
    if (o.wet !== false) {
      g.save(); g.globalCompositeOperation = 'lighter';
      if (o.fire) poly(g, [[o.fire.x - V(90, 70), GY], [o.fire.x + V(90, 70), GY], [o.fire.x + V(220, 170), GY + V(360, 300)], [o.fire.x - V(220, 170), GY + V(360, 300)]], alpha('#ff9a5a', 0.12));
      g.restore();
    }
    FX.floorLines(g, GY, GY + 380, alpha(wallDark, 0.5), 0.06);
  });
  layer(g, cam, 0.96, () => {
    FX.lampPost(g, CX - V(880, 660), GY, V(400, 340), { color: shade(M.dark, -0.2), light: M.practical });
    FX.pool(g, CX - V(846, 630), GY + V(70, 60), V(240, 200), V(60, 50), M.practical, 0.15);
  });
  if (o.rain) FX.rain(g, t, { a: o.rain, color: M.rim, angle: 0.2, speed: 1500, count: 260, seed: 33 });
  return { GY, CX, M, block: { x: bx, y: by, w: bw, h: bh } };
}

export function fireEscape(g, x, GY, o = {}) {
  const s = o.s ?? V(1, 0.85), c = o.color || '#1a1420', floors = o.floors ?? 4, fh = V(200, 240);
  for (let i = 0; i < floors; i++) {
    const y = GY - fh * (i + 1);
    g.strokeStyle = c; g.lineWidth = 7 * s;
    g.beginPath(); g.moveTo(x - 90 * s, y); g.lineTo(x + 130 * s, y); g.stroke();
    for (let b = 0; b < 8; b++) { const bx = x - 80 * s + b * 26 * s; g.beginPath(); g.moveTo(bx, y); g.lineTo(bx + 10 * s, y - 8 * s); g.stroke(); }
    g.beginPath(); g.moveTo(x + 130 * s, y); g.lineTo(x + 130 * s, y - fh * 0.9); g.stroke();
    seg(g, [[x - 90 * s, y], [x - 90 * s, y - fh]], 6 * s, c);
  }
  seg(g, [[x + 40 * s, GY], [x + 130 * s, GY - fh]], 8 * s, c);
}
