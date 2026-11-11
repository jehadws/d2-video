// sets/kitchen.js — family kitchen: window over the sink, counter run, fridge practical.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, ring, linGrad, radGrad, alpha, shade, mix, glow, text, rng, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const kitchenGround = () => E.H * V(0.8, 0.68);

export function kitchen(g, t, cam, o = {}) {
  const M = mood(o.mood || 'day'), GY = kitchenGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.15), wallDark = shade(M.wall, -0.5), cab = shade(M.wall, -0.35);
  const wx = CX + V(430, 300), wy = GY - V(660, 820), ww = V(420, 340), wh = V(300, 330);
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY + 40, [shade(M.dark, -0.3), wall, shade(wall, 0.1)]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 40 + E.H);
  });
  layer(g, cam, 0.4, () => {
    FX.windowFrame(g, { x: wx, y: wy, w: ww, h: wh, cols: 2, rows: 2, frame: wallDark, bar: 9 }, (g2, x, y, w, h) => {
      if (o.view === 'night') {
        g2.fillStyle = linGrad(g2, 0, y, 0, y + h, [M.sky[0], M.sky[1], M.sky[2]]); g2.fillRect(x, y, w, h);
        FX.stars(g2, t, { seed: 3, count: 26, area: [x, y, w, h * 0.6], color: '#cfd8e6' });
        FX.skyline(g2, { x, y: y + h - 6, w, minH: 22, maxH: h * 0.36, color: shade(M.dark, -0.3), windowColor: alpha(M.practical, 0.5), lit: 0.16, seed: 19 });
      } else {
        g2.fillStyle = linGrad(g2, 0, y, 0, y + h, [M.sky[2], M.sky[M.sky.length - 1], mix(M.sky[M.sky.length - 1], wallDark, 0.45)]); g2.fillRect(x, y, w, h);
        FX.skyline(g2, { x, y: y + h * 0.86, w, minH: 10, maxH: h * 0.16, color: mix(M.sky[M.sky.length - 1], M.grass, 0.55), windowColor: alpha(M.practical, 0.25), lit: 0.06, seed: 23 });
        FX.pine(g2, x + w * 0.2, y + h * 0.98, h * 0.3 / 220, shade(M.grass, -0.4));
        FX.pine(g2, x + w * 0.68, y + h, h * 0.38 / 220, shade(M.grass, -0.25));
      }
    });
    glow(g, wx + ww / 2, wy + wh / 2, ww * 1.2, o.view === 'night' ? M.rim : M.key, 0.12);
    g.fillStyle = wall; g.fillRect(-E.W, wy + wh, E.W * 3, GY - wy - wh + 40);
    for (let i = -1; i <= 1; i++) {                                          // upper cabinets
      const cx2 = CX - V(760, 620) + i * V(300, 250);
      rr(g, cx2, GY - V(880, 1040), V(270, 230), V(190, 160), 8); g.fillStyle = cab; g.fill();
      g.strokeStyle = alpha(wallDark, 0.8); g.lineWidth = 3; g.stroke();
      g.fillStyle = alpha(M.rim, 0.25); g.fillRect(cx2 + V(120, 100), GY - V(790, 950), V(30, 26), 5);
    }
    sink(g, wx + ww / 2, GY - V(212, 262), V(1.15, 0.95), { color: shade(cab, 0.1) });
  });
  layer(g, cam, 0.92, () => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, 0.08), shade(M.floor, -0.16), shade(M.dark, 0.05)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 380, alpha(wallDark, 0.45), 0.07);
    if (o.view !== 'night') {
      g.save(); g.globalCompositeOperation = 'lighter';
      poly(g, [[wx, GY], [wx + ww, GY], [wx + ww * 1.4, GY + V(330, 280)], [wx - ww * 0.3, GY + V(330, 280)]], alpha(M.key, 0.1));
      g.restore();
    }
  });
  return { GY, CX, M, win: { x: wx, y: wy, w: ww, h: wh } };
}

export function kitchenCounter(g, x, GY, o = {}) {
  const s = o.s ?? V(1.1, 0.95), w = (o.w ?? 420) * s, h = 190 * s, c = o.color || '#3a2c32';
  g.fillStyle = c; g.fillRect(x - w, GY - h, w * 2, h);
  g.strokeStyle = alpha(shade(c, -0.4), 0.9); g.lineWidth = 3;
  for (let i = -2; i <= 2; i++) g.strokeRect(x + i * w * 0.4 - w * 0.18, GY - h * 0.82, w * 0.36, h * 0.72);
  rr(g, x - w - 10 * s, GY - h - 14 * s, w * 2 + 20 * s, 16 * s, 5 * s); g.fillStyle = o.top || shade(c, 0.22); g.fill();
  g.fillStyle = alpha('#ffe6bd', 0.18); g.fillRect(x - w, GY - h - 14 * s, w * 2, 4 * s);
  return { top: GY - h - 14 * s, s };
}

export function sink(g, x, top, s = 1, o = {}) {
  rr(g, x - 96 * s, top - 6 * s, 192 * s, 46 * s, 10 * s); g.fillStyle = o.color || '#5a5f68'; g.fill();
  g.fillStyle = shade(o.color || '#5a5f68', -0.45); g.fillRect(x - 78 * s, top + 2 * s, 156 * s, 30 * s);
  seg(g, [[x, top - 4 * s], [x, top - 62 * s], [x + 34 * s, top - 56 * s]], 7 * s, shade(o.color || '#5a5f68', 0.1));
}

export function tumbler(g, x, y, s = 1, o = {}) {
  const h = 92 * s, w = 54 * s;
  g.save(); g.translate(x, y); g.rotate(o.rot ?? 0);
  poly(g, [[-w / 2, -h], [-w * 0.4, 0], [w * 0.4, 0], [w / 2, -h]], o.color || 'rgba(206,224,236,.5)');
  g.strokeStyle = alpha('#e8f0f6', 0.75); g.lineWidth = 3 * s;
  g.beginPath(); g.moveTo(-w / 2, -h); g.lineTo(-w * 0.4, 0); g.lineTo(w * 0.4, 0); g.lineTo(w / 2, -h); g.stroke();
  if (o.water) poly(g, [[-w * 0.46, -h * 0.45], [-w * 0.4, 0], [w * 0.4, 0], [w * 0.46, -h * 0.45]], alpha('#bcd6e6', 0.5));
  g.fillStyle = alpha('#ffffff', 0.35); g.fillRect(-w * 0.3, -h * 0.86, 5 * s, h * 0.6);
  g.restore();
}

export function toaster(g, x, y, s = 1, o = {}) {
  const w = 132 * s, h = 84 * s;
  rr(g, x - w / 2, y - h, w, h, 14 * s); g.fillStyle = o.color || '#8b8f98'; g.fill();
  g.fillStyle = shade(o.color || '#8b8f98', -0.4); g.fillRect(x - w / 2 + 10 * s, y - h, w - 20 * s, 12 * s);
  g.fillStyle = '#2a2c32'; g.fillRect(x - w * 0.28, y - h - 2 * s, w * 0.16, 8 * s); g.fillRect(x + w * 0.12, y - h - 2 * s, w * 0.16, 8 * s);
  seg(g, [[x + w * 0.5, y - h * 0.45], [x + w * 0.5 + 16 * s, y - h * 0.45 + (o.lever ?? 0) * 26 * s]], 6 * s, '#2a2c32');
  if (o.toast) for (const dx of [-w * 0.2, w * 0.2]) { rr(g, x + dx - 16 * s, y - h - 34 * s * (o.toast ?? 0), 32 * s, 34 * s, 6 * s); g.fillStyle = '#c98b4a'; g.fill(); }
  g.fillStyle = alpha('#ffffff', 0.2); g.fillRect(x - w / 2 + 8 * s, y - h + 18 * s, 8 * s, h - 30 * s);
}

export function pan(g, x, y, s = 1, o = {}) {
  const w = 150 * s;
  g.save(); g.translate(x, y);
  if (o.heat) { g.fillStyle = alpha('#e0623a', 0.22); g.beginPath(); g.ellipse(0, 6 * s, w * 0.7, 16 * s, 0, 0, 7); g.fill(); }
  rr(g, -w / 2, -18 * s, w, 30 * s, 8 * s); g.fillStyle = o.color || '#23272e'; g.fill();
  g.fillStyle = alpha('#8fa0b4', 0.35); g.fillRect(-w / 2 + 6 * s, -16 * s, w - 12 * s, 5 * s);
  seg(g, [[w / 2, -6 * s], [w / 2 + 92 * s, -22 * s]], 10 * s, '#1c1f26');
  if (o.egg) { g.fillStyle = '#f3ead9'; g.beginPath(); g.ellipse(0, -6 * s, 34 * s, 13 * s, 0, 0, 7); g.fill(); circle(g, 0, -8 * s, 13 * s, '#e8a33c'); }
  g.restore();
}

export function fridge(g, x, GY, s = 1, o = {}) {
  const w = 190 * s, h = 460 * s, c = o.color || '#c9cdd4';
  rr(g, x - w / 2, GY - h, w, h, 10 * s); g.fillStyle = shade(c, -0.15); g.fill();
  g.strokeStyle = alpha(shade(c, -0.5), 0.9); g.lineWidth = 3; g.stroke();
  g.beginPath(); g.moveTo(x - w / 2, GY - h * 0.62); g.lineTo(x + w / 2, GY - h * 0.62); g.stroke();
  seg(g, [[x - w * 0.34, GY - h * 0.5], [x - w * 0.34, GY - h * 0.34]], 7 * s, shade(c, -0.5));
  if (o.open > 0) {
    g.save(); g.translate(x - w / 2, GY - h); g.transform(1, 0, -o.open * 0.7, 1, 0, 0);
    g.fillStyle = c; g.fillRect(0, 0, w, h); g.restore();
    g.fillStyle = alpha('#ffe9c4', 0.9 * o.open); g.fillRect(x - w / 2 + 8, GY - h * 0.98, w - 16, h * 0.34);
    glow(g, x, GY - h * 0.8, w * 1.6, '#ffe9c4', 0.4 * o.open);
  }
  return { top: GY - h, w, h };
}

// Sound-wave read of a pan: used for "you know this from the pan sounds".
export function waveRead(g, x, y, w, h, t, o = {}) {
  const r = rng(o.seed ?? 9); g.save(); g.translate(x, y);
  g.strokeStyle = alpha(o.color || '#d6b58a', 0.85); g.lineWidth = o.w ?? 3;
  g.beginPath();
  for (let i = 0; i <= 60; i++) {
    const u = i / 60, px = -w / 2 + u * w;
    const amp = h * (0.25 + 0.75 * Math.abs(Math.sin(u * 9 + t * 3 + r() * 0.2))) * (o.a ?? 1);
    const py = Math.sin(u * 22 + t * 7) * amp * 0.5;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.stroke(); g.restore();
}
