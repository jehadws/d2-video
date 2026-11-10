// sets/void.js — the blueprint void: mood gradient, faint measurement grid, one horizon glow. Home of every diagram shot.
import { E, V, mood, layer, backdrop, linGrad, alpha, shade } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const voidGround = () => E.H * V(0.8, 0.68);

export function voidSet(g, t, cam, o = {}) {
  const M = mood(o.mood || 'void'), GY = voidGround(), CX = E.W / 2;
  layer(g, cam, 0.2, () => {
    backdrop(g, o.sky || M.sky);
    g.fillStyle = linGrad(g, 0, GY - 40, 0, GY + 260, [alpha(M.dark, 0), alpha(shade(M.dark, -0.4), 0.55)]);
    g.fillRect(-E.W, GY - 40, E.W * 3, 320);
    const grid = o.grid ?? 84, a = o.gridAlpha ?? 0.055, c = o.gridColor || M.practical;
    g.strokeStyle = alpha(c, a); g.lineWidth = 1;
    for (let x = CX % grid - E.W; x <= E.W * 2; x += grid) { g.beginPath(); g.moveTo(x, -E.H); g.lineTo(x, E.H * 2); g.stroke(); }
    for (let y = GY % grid - E.H; y <= E.H * 2; y += grid) { g.beginPath(); g.moveTo(-E.W, y); g.lineTo(E.W * 2, y); g.stroke(); }
    if (o.glow !== false) {
      g.fillStyle = linGrad(g, 0, GY - V(300, 420), 0, GY + 60, [alpha(M.key, 0), alpha(M.key, 0.07), alpha(M.key, 0)]);
      g.fillRect(-E.W, GY - V(300, 420), E.W * 3, V(360, 480));
    }
  });
  if (o.dust) layer(g, cam, 0.6, () => FX.dust(g, t, { count: 34, color: M.rim, a: 0.2 }));
  return { GY, CX, M };
}

// Gold measurement ticks along the bottom of a diagram: a scale bar without a data card.
export function ruleBar(g, x, y, w, o = {}) {
  const M = mood('void'), c = o.color || M.key, n = o.ticks ?? 10, a = o.alpha ?? 0.55;
  g.strokeStyle = alpha(c, a); g.lineWidth = 2;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.stroke();
  for (let i = 0; i <= n; i++) {
    const px = x + (w * i) / n, big = i % 5 === 0;
    g.beginPath(); g.moveTo(px, y); g.lineTo(px, y - (big ? 16 : 8)); g.stroke();
  }
}
