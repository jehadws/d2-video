// sets/stairwell.js — burning stairwell: flight rising camera-right, fire at the foot, smoke bank above.
import { E, V, mood, layer, backdrop, rr, seg, poly, circle, ring, linGrad, alpha, shade, mix, glow, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const stairGround = () => E.H * V(0.86, 0.74);

export function stairwell(g, t, cam, o = {}) {
  const M = mood(o.mood || 'storm'), GY = stairGround(), CX = E.W / 2;
  const fire = o.fire ?? 0, smoke = o.smoke ?? 0, dir = o.dir ?? 1;
  const wall = shade(M.wall, -0.35), wallDark = shade(M.dark, -0.15), concrete = shade(M.wall, -0.1);
  const st = { rise: V(44, 38) * (o.s ?? 1), run: V(96, 78) * (o.s ?? 1), x0: CX - dir * V(560, 430), y0: GY + V(40, 30), n: o.steps ?? 11, dir };
  layer(g, cam, 0.12, () => {
    backdrop(g, M.sky);
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY + 200, [wallDark, wall, shade(wall, 0.1)]);
    g.fillRect(-E.W, -E.H, E.W * 3, GY + 200 + E.H);
    const land = stepAt(st, st.n);
    if (o.landing !== false) {                                               // landing wall + the one clear window
      g.fillStyle = shade(wall, 0.08); g.fillRect(land.x - V(520, 420), land.y - V(620, 760), V(1040, 840), V(620, 760));
      const wx = land.x - dir * V(180, 150), wy = land.y - V(520, 640), ww = V(230, 190), wh = V(260, 300);
      FX.windowFrame(g, { x: wx - ww / 2, y: wy, w: ww, h: wh, cols: 1, rows: 2, frame: wallDark, bar: 8 }, (g2, x, y, w, h) => {
        g2.fillStyle = linGrad(g2, 0, y, 0, y + h, [M.sky[1], M.sky[2], mix(M.sky[2], wallDark, 0.5)]); g2.fillRect(x, y, w, h);
        if (!o.noView) FX.skyline(g2, { x, y: y + h - 4, w, minH: 14, maxH: h * 0.3, color: mix(M.sky[0], wallDark, 0.7), windowColor: alpha(M.practical, 0.4), lit: 0.2, seed: 51 });
      });
      glow(g, wx, wy + wh / 2, ww * 1.6, M.rim, 0.14);
    }
    if (o.fireDoor) doorway(g, CX + dir * V(700, 540), GY, { open: o.fireDoor.open ?? 1, glow: fire, color: '#3a2a2a' });
  });
  layer(g, cam, 0.55, () => {
    g.fillStyle = linGrad(g, 0, st.y0 - st.rise * st.n - 200, 0, GY + 300, [shade(concrete, -0.25), concrete, shade(concrete, -0.4)]);
    g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    for (let i = 0; i < st.n; i++) {
      const p = stepAt(st, i);
      poly(g, [[p.x, p.y], [p.x + dir * st.run, p.y], [p.x + dir * st.run, p.y - st.rise], [p.x, p.y - st.rise]], shade(concrete, 0.12 - i * 0.012));
      g.fillStyle = alpha(wallDark, 0.5); g.fillRect(Math.min(p.x, p.x + dir * st.run), p.y - 4, st.run, 5);
    }
    const top = stepAt(st, st.n);
    poly(g, [[top.x, top.y - st.rise], [top.x + dir * V(520, 420), top.y - st.rise], [top.x + dir * V(520, 420), top.y + 20], [top.x, top.y + 20]], shade(concrete, 0.06));
    railing(g, st, { dir, color: shade('#3a3038', 0.1), fire });
  });
  layer(g, cam, 0.9, () => {
    if (fire > 0.01) {                                                       // fire front at the foot of the flight
      const f = stepAt(st, 0), fx = f.x + dir * st.run * 1.4, fy = f.y - 20;
      glow(g, fx, fy, V(700, 560) * (0.6 + fire), '#ff7a3a', 0.45 * fire);
      for (let i = 0; i < 7; i++) {
        const ph = (t * 1.6 + i * 0.37) % 1, s = V(60, 50) * (0.5 + fire) * (1 - ph * 0.5);
        poly(g, [[fx + Math.sin(i * 2.1 + t) * 60 - s * 0.4, fy], [fx + Math.sin(i * 2.1 + t) * 60, fy - s * 2.1 - ph * 90], [fx + Math.sin(i * 2.1 + t) * 60 + s * 0.4, fy]], alpha(i % 2 ? '#ffb066' : '#ff7a3a', 0.5 * fire * (1 - ph * 0.6)));
      }
      FX.lightCone(g, fx, fy - 40, { angle: -Math.PI / 2, spread: 1.1, len: V(700, 620) * fire, color: '#ffb066', a: 0.18 * fire });
    }
    if (smoke > 0.01) {                                                      // smoke bank rolling along the ceiling
      const yTop = st.y0 - st.rise * st.n - V(320, 420);
      FX.fog(g, yTop, V(560, 700) * (0.4 + smoke), M.fog, 0.5 * smoke);
      const r = rng(o.seed ?? 23);
      for (let i = 0; i < 9; i++) {
        const ph = (t * 0.22 + i / 9) % 1, x = st.x0 + dir * st.run * st.n * ph;
        circle(g, x, yTop + V(220, 260) - ph * V(160, 190) + Math.sin(i * 3 + t) * 20, V(90, 74) * (0.4 + ph), alpha(M.fog, 0.16 * smoke * (1 - ph)));
      }
    }
    if (o.debris) debris(g, st.x0 + dir * st.run * 3, st.y0 - st.rise * 3, { seed: 31, s: V(1, 0.85), a: o.debris });
  });
  return { GY, CX, M, st, stepAt: i => stepAt(st, i) };
}

export function stepAt(st, i) {
  return { x: st.x0 + i * st.run * st.dir, y: st.y0 - i * st.rise };
}

export function railing(g, st, o = {}) {
  const dir = o.dir ?? 1, pts = [];
  for (let i = 0; i <= st.n; i++) { const p = stepAt(st, i); pts.push([p.x + dir * st.run * 0.5, p.y - V(150, 130)]); }
  g.strokeStyle = o.color || '#4a3f48'; g.lineWidth = V(9, 7);
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  for (let i = 0; i <= st.n; i += 1) { const p = stepAt(st, i); seg(g, [[p.x + dir * st.run * 0.5, p.y - 6], [p.x + dir * st.run * 0.5, p.y - V(150, 130)]], V(5, 4), o.color || '#4a3f48'); }
  if (o.fire > 0.5) { g.strokeStyle = alpha('#ffb066', 0.35); g.lineWidth = V(4, 3); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] - 4, p[1] - 4) : g.moveTo(p[0] - 4, p[1] - 4)); g.stroke(); }
}

export function doorway(g, x, GY, o = {}) {
  const w = o.w ?? V(230, 190), h = o.h ?? V(420, 520), c = o.color || '#2a222c';
  g.fillStyle = c; g.fillRect(x - w / 2, GY - h, w, h);
  if (o.open > 0) {
    g.fillStyle = alpha('#ffe9c4', 0.5 * o.open); g.fillRect(x - w / 2, GY - h, w * o.open, h);
    glow(g, x, GY - h * 0.5, w * 2, '#ffb066', 0.3 * (o.glow ?? 0.3));
  }
  g.strokeStyle = shade(c, -0.4); g.lineWidth = 6; g.strokeRect(x - w / 2, GY - h, w, h);
  circle(g, x + w * 0.3, GY - h * 0.5, 8, '#c9a86a');
}

export function debris(g, x, y, o = {}) {
  const s = o.s ?? V(1, 0.85), r = rng(o.seed ?? 7), a = o.a ?? 1;
  g.save(); g.globalAlpha = a;
  for (let i = 0; i < 9; i++) {
    const px = x + (r() - 0.5) * V(700, 540), py = y + (r() - 0.4) * V(120, 100), w = V(30, 24) * (0.4 + r());
    poly(g, [[px, py], [px + w, py + w * 0.3], [px + w * 0.7, py + w * 0.8], [px - w * 0.2, py + w * 0.5]], alpha('#2a2530', 0.85));
  }
  seg(g, [[x - V(200, 160), y + V(30, 24)], [x + V(120, 100), y - V(10, 8)]], V(8, 6), alpha('#3a3038', 0.8));
  g.restore();
}
