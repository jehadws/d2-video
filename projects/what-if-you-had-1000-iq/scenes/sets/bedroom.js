// sets/bedroom.js — the hero's bedroom at 2 AM: moon through one window, one practical on the desk, equations on the wall.
// Value structure: the cold window rectangle is the shape of the room, everything else falls into the style's dark.
import { E, V, mood, layer, rr, seg, circle, poly, linGrad, alpha, shade, mix, glow, text, FONTS, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const bedroomGround = () => E.H * V(0.8, 0.68);

const nightView = (M, wallDark) => (g, x, y, w, h) => {
  g.fillStyle = linGrad(g, 0, y, 0, y + h, [M.sky[0], M.sky[1], mix(M.sky[1], wallDark, 0.55)]);
  g.fillRect(x, y, w, h);
  FX.stars(g, 0, { seed: 31, count: 60, area: [x, y, w, h * 0.6], color: '#dfe8ff' });
  FX.moon(g, x + w * 0.68, y + h * 0.3, Math.min(w, h) * 0.11, M.rim);
  FX.skyline(g, { x, y: y + h - 4, w, minH: h * 0.12, maxH: h * 0.5, color: mix(M.sky[1], wallDark, 0.6), windowColor: alpha(M.practical, 0.7), lit: 0.14, seed: 33 });
};

export function bedroom(g, t, cam, o = {}) {
  const M = mood(o.mood || 'night'), GY = bedroomGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.42), wallDark = shade(M.wall, -0.68), ceil = shade(M.dark, -0.4);
  const ww = V(420, 330), wh = V(300, 340);
  const wx = (o.windowX ?? CX + V(560, 380)) - ww / 2, wy = GY - V(560, 700);
  layer(g, cam, 0.55, () => {                                    // room shell: wall, window, door, wall maths
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [ceil, wall, wallDark]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H);
    g.fillStyle = alpha(wallDark, 0.55); g.fillRect(-E.W, GY - V(6, 8), E.W * 3, V(10, 14));
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: wallDark, bar: 11 }, nightView(M, wallDark));
    glow(g, wx + ww / 2, wy + wh / 2, ww * 1.3, M.rim, 0.1);
    const dx = o.doorX ?? CX - V(760, 560);
    FX.door(g, { x: dx, y: GY, w: V(150, 120), h: V(330, 400), color: wallDark, open: o.doorOpen ?? 0, light: M.practical });
    if (o.doorOpen) glow(g, dx + V(75, 60), GY - V(165, 200), V(220, 180), M.practical, 0.3 * o.doorOpen);
    if (o.equations !== false) wallMath(g, CX - V(560, 420), GY - V(470, 600), V(1, 0.85), t, M.rim, o.equationAlpha ?? 0.3, o.equationsLit ?? 6);
  });
  layer(g, cam, 0.9, () => {                                     // floor, rug and the moonlight laid across it
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, -0.02), shade(M.floor, -0.2), shade(M.dark, 0.02)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 380, alpha(wallDark, 0.45), 0.06);
    g.save(); g.globalCompositeOperation = 'lighter';
    poly(g, [[wx, wy + wh], [wx + ww, wy + wh], [wx + ww * 1.5, GY + V(240, 200)], [wx - ww * 0.5, GY + V(240, 200)]], alpha(M.rim, 0.08));
    g.restore();
    rr(g, CX - V(430, 330), GY + V(40, 30), V(860, 660), V(90, 70), 24); g.fillStyle = alpha(M.dark, 0.5); g.fill();
  });
  if (o.fan) ceilingFan(g, CX + V(120, 0), GY - V(620, 820), V(1, 0.9), t, { spin: o.fanSpin ?? 2.6 });
  return { GY, CX, M, win: { x: wx, y: wy, w: ww, h: wh } };
}

// pencil-scrawled equations pinned to the wall; shots dim them out one by one for the closing beats.
const MATHS = ['P(t) = 1 - e^-λt', 'v = d/t', 'x² + y² = r²', 'Σ 1/n² = π²/6', 'f: A → B', 'λ = 59.7 Hz'];
export function wallMath(g, x, y, s = 1, t = 0, color = '#dce9ff', a = 0.3, lit = 6) {
  g.save(); g.translate(x, y); g.scale(s, s);
  MATHS.forEach((m, i) => {
    const on = i < lit;
    text(g, m, (i % 2) * 200, Math.floor(i / 2) * 76, {
      size: 34, color: alpha(color, a), font: FONTS.ui, weight: 700, align: 'left',
      alpha: on ? 1 : 0.18 + 0.08 * Math.sin(t * 2 + i),
    });
  });
  g.restore();
}

// Desk against the wall: top, legs and a drawer front. Returns the surface y.
export function bdDesk(g, x, GY, o = {}) {
  const s = o.s ?? 1, w = (o.w ?? 330) * s, h = (o.h ?? 190) * s, top = GY - h, c = o.color || '#3b2c33';
  rr(g, x - w, top - 12 * s, w * 2, 16 * s, 5 * s); g.fillStyle = c; g.fill();
  g.fillStyle = alpha('#ffffff', 0.08); g.fillRect(x - w + 6 * s, top - 12 * s, w * 2 - 12 * s, 3 * s);
  for (const sx of [-1, 1]) seg(g, [[x + sx * w * 0.86, top + 4 * s], [x + sx * w * 0.9, GY]], 10 * s, shade(c, -0.3));
  rr(g, x - w * 0.5, top + 16 * s, w, h * 0.42, 6 * s); g.fillStyle = shade(c, -0.15); g.fill();
  return { top: top - 12 * s };
}

export function deskLamp(g, x, y, o = {}) {
  const on = o.on ?? true, c = o.color || '#1d1722', light = o.light || '#ffd59a';
  seg(g, [[x, y], [x, y - 110], [x + 46, y - 150]], 7, c);
  poly(g, [[x + 30, y - 152], [x + 74, y - 152], [x + 62, y - 120], [x + 40, y - 120]], c);
  if (on) {
    glow(g, x + 52, y - 118, 150, light, 0.5);
    g.save(); g.globalCompositeOperation = 'lighter';
    poly(g, [[x + 40, y - 122], [x + 62, y - 122], [x + 150, y], [x - 30, y]], alpha(light, 0.12));
    g.restore();
  }
}

export function phone(g, x, y, s = 1, o = {}) {
  const w = 54 * s, h = 104 * s, on = o.on ?? true;
  g.save(); g.translate(x, y); g.rotate(o.rot ?? 0);
  rr(g, -w / 2, -h / 2, w, h, 9 * s); g.fillStyle = '#191d28'; g.fill();
  rr(g, -w / 2 + 4 * s, -h / 2 + 6 * s, w - 8 * s, h - 12 * s, 6 * s);
  g.fillStyle = on ? (o.screen || '#cfe0ff') : '#0e1420'; g.fill();
  if (on) {
    glow(g, 0, 0, w * 4.2, o.screen || '#cfe0ff', o.glow ?? 0.5);
    if (o.lines) { g.fillStyle = alpha('#172033', 0.7); for (let i = 0; i < o.lines; i++) g.fillRect(-w * 0.32, -h * 0.24 + i * 13 * s, w * 0.64, 5 * s); }
  }
  g.restore();
  return { w, h };
}

// Bed seen from the side, head to the left. Returns the sleeping surface so a lying figure lands on it.
export function bed(g, x, GY, o = {}) {
  const s = o.s ?? 1, w = (o.w ?? 620) * s, c = o.color || '#4d4d8f', frame = o.frame || '#241d2a', pillow = o.pillow || '#e6e2f2';
  const top = GY - 112 * s;
  for (const lx of [x + 24 * s, x + w - 24 * s]) seg(g, [[lx, GY - 60 * s], [lx, GY]], 12 * s, frame);
  rr(g, x - 20 * s, GY - 232 * s, 30 * s, 232 * s, 8 * s); g.fillStyle = frame; g.fill();
  g.fillStyle = shade(c, -0.45); g.fillRect(x, GY - 78 * s, w, 34 * s);
  rr(g, x, top, w, 46 * s, 14 * s); g.fillStyle = c; g.fill();
  g.fillStyle = alpha('#ffffff', 0.1); g.fillRect(x + 6 * s, top + 3 * s, w - 12 * s, 5 * s);
  rr(g, x + 22 * s, top - 24 * s, 140 * s, 34 * s, 15 * s); g.fillStyle = pillow; g.fill();
  rr(g, x + 190 * s, top - 12 * s, w - 190 * s, 36 * s, 12 * s); g.fillStyle = shade(c, -0.2); g.fill();
  seg(g, [[x + 190 * s, top + 4 * s], [x + w - 6 * s, top + 4 * s]], 3 * s, alpha('#000000', 0.25));
  return { top: top - 10 * s, w };
}

// Digits drifting across the ceiling: the mind running numbers nobody asked for.
export function numberStream(g, t, o = {}) {
  const { seed = 41, count = 34, area = [0, 0, E.W, E.H * 0.34], color = '#9fd0ff', a = 0.5, size = 30, speed = 26 } = o;
  const r = rng(seed);
  g.save(); g.textAlign = 'left'; g.textBaseline = 'middle';
  for (let i = 0; i < count; i++) {
    const px = area[0] + r() * area[2], py = area[1] + r() * area[3], sp = speed * (0.5 + r());
    const x = area[0] + (((px - t * sp) % area[2]) + area[2]) % area[2];
    const digits = ['0', '1', '3', '7', '9', '.', '%', '·', '=', 'λ'][Math.floor(r() * 10)];
    text(g, digits, x, py + Math.sin(t * 0.7 + i) * 6, { size: size * (0.6 + r() * 0.8), color: alpha(color, a * (0.35 + 0.65 * r())), font: FONTS.ui, weight: 900, align: 'left' });
  }
  g.restore();
}

// Ceiling fan: the geometry-problem prop. spin is radians/second so a shot can freeze or speed it up.
export function ceilingFan(g, x, y, s = 1, t = 0, o = {}) {
  const c = o.color || '#241d2a', ang = t * (o.spin ?? 2.6);
  seg(g, [[x, y - 60 * s], [x, y]], 7 * s, c);
  circle(g, x, y, 13 * s, c);
  for (let i = 0; i < 4; i++) {
    g.save(); g.translate(x, y); g.rotate(ang + (i * Math.PI) / 2); g.scale(1, 0.42);
    rr(g, 12 * s, -9 * s, 96 * s, 18 * s, 8 * s); g.fillStyle = alpha(c, 0.9); g.fill();
    g.restore();
  }
}
