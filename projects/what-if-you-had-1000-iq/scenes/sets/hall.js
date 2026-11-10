// sets/hall.js — school corridor: locker rows in perspective, cold strip light, far end glowing.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, ring, linGrad, alpha, shade, mix, glow, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const hallGround = () => E.H * V(0.8, 0.68);

export function hallway(g, t, cam, o = {}) {
  const M = mood(o.mood || 'interiorCool'), GY = hallGround(), CX = E.W / 2;
  const wall = shade(M.wall, -0.2), wallDark = shade(M.wall, -0.55), lock = shade(M.wall, 0.08);
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY + 40, [shade(M.dark, -0.35), wallDark, wall]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 40 + E.H);
    const vx = CX + (o.vanish ?? 0) * E.W, vy = GY - V(430, 520);
    g.fillStyle = shade(M.dark, -0.1); rr(g, vx - V(150, 120), vy - V(200, 170), V(300, 240), V(400, 340), 10); g.fill();
    g.fillStyle = alpha(M.practical, 0.5); g.fillRect(vx - V(130, 104), vy - V(180, 152), V(260, 208), V(360, 300));
    glow(g, vx, vy, V(520, 420), M.practical, 0.22);
  });
  layer(g, cam, 0.42, () => {
    for (const side of [-1, 1]) lockerRow(g, side, GY, { color: lock, dark: wallDark, vent: shade(lock, -0.35) });
    g.fillStyle = alpha(wallDark, 0.5); g.fillRect(-E.W, GY - V(96, 120), E.W * 3, V(24, 28));
  });
  layer(g, cam, 0.92, () => {
    g.fillStyle = linGrad(g, 0, GY, 0, GY + E.H * 0.5, [shade(M.floor, 0.1), shade(M.floor, -0.16), shade(M.dark, 0.05)]);
    g.fillRect(-E.W, GY, E.W * 3, E.H * 2);
    FX.floorLines(g, GY, GY + 400, alpha(wallDark, 0.5), 0.05);
    for (let i = -2; i <= 2; i++) {                                            // strip-light pools
      const x = CX + i * V(430, 340);
      FX.pool(g, x, GY + V(60, 60), V(210, 170), V(52, 42), M.rim, 0.14);
      g.fillStyle = alpha(M.rim, 0.5); g.fillRect(x - V(120, 96), GY - V(900, 1080), V(240, 192), V(12, 10));
    }
  });
  return { GY, CX, M };
}

function lockerRow(g, side, GY, o) {
  const CX = E.W / 2;
  for (let i = 0; i < 7; i++) {
    const d = i / 6, x = CX + side * (V(300, 240) + d * V(1150, 900)), s = 1 - d * 0.42;
    const w = V(150, 120) * s, h = V(400, 330) * s;
    g.fillStyle = o.color; g.fillRect(x - w / 2, GY - h, w, h);
    g.strokeStyle = alpha(o.dark, 0.85); g.lineWidth = 3 * s; g.strokeRect(x - w / 2, GY - h, w, h);
    g.fillStyle = alpha(o.dark, 0.5); g.fillRect(x - w / 2, GY - h, w, h * 0.16);
    for (let v = 0; v < 3; v++) g.fillRect(x - w * 0.22 + v * w * 0.2, GY - h * 0.88, w * 0.1, h * 0.05);
    g.fillStyle = o.vent; g.fillRect(x + side * w * 0.3, GY - h * 0.52, w * 0.08, h * 0.14);
  }
}

// The charger cable: tangle 1 = knotted nest, tangle 0 = clean coil. Same path, eased between.
export function cable(g, x, y, s = 1, o = {}) {
  const tan = o.tangle ?? 1, r = rng(o.seed ?? 17), c = o.color || '#1c2030';
  g.save(); g.translate(x, y);
  g.strokeStyle = c; g.lineCap = 'round'; g.lineWidth = 9 * s;
  const loops = 3 + Math.round(tan * 5), spread = (o.w ?? 150) * s;
  g.beginPath();
  for (let i = 0; i <= 96; i++) {
    const u = i / 96, px = -spread / 2 + u * spread;
    const wob = Math.sin(u * Math.PI * loops * 2 + o.phase) * (26 + 34 * tan) * s * (0.4 + 0.6 * Math.sin(u * Math.PI));
    const py = -Math.abs(wob) * 0.2 + wob * 0.6 + Math.sin(u * 7 + r() * 0.4) * 6 * s * tan;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.stroke();
  g.strokeStyle = alpha('#8fa0b4', 0.35); g.lineWidth = 3 * s; g.stroke();
  for (const [dx, plug] of [[-spread / 2, 1], [spread / 2, 0]]) {
    rr(g, dx - (plug ? 26 : 16) * s, -12 * s + Math.sin(o.phase) * 8 * s, (plug ? 52 : 32) * s, 24 * s, 5 * s);
    g.fillStyle = plug ? '#2a2f3c' : '#c9cdd4'; g.fill();
  }
  g.restore();
}

// Neat coil for the "untangled" reveal.
export function coil(g, x, y, s = 1, o = {}) {
  g.save(); g.translate(x, y);
  g.strokeStyle = o.color || '#1c2030'; g.lineWidth = 9 * s;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(0, -i * 11 * s, (58 - i * 4) * s, (20 - i * 2) * s, 0, 0, 7); g.stroke(); }
  g.restore();
  rr(g, x + 40 * s, y - 46 * s, 46 * s, 22 * s, 5 * s); g.fillStyle = '#2a2f3c'; g.fill();
}
