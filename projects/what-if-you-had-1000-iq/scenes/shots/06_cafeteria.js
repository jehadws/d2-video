// shots/06_cafeteria.js — the language-by-lunchtime beat and the dessert-plate punchline.
import { E, V, registerShot, layer, ease, prog, clamp, lerp, rr, alpha, shade, linGrad, glow, wordTime } from '/engine/core.js';
import { drawFigure, POSES, breathe } from '/engine/rig2d.js';
import { drawHero } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { cafeteria, cafeteriaGround, cafTable, tray, wordCard } from '../sets/cafeteria.js';
import { LEO } from '../cast.js';

const S = () => V(2.4, 2.2);                       // two-shot figure scale
const seats = () => ({ hero: E.W / 2 - V(250, 210), leo: E.W / 2 + V(250, 210) });
const TS = () => V(1.5, 1.35);                      // table scale

function chairAt(g, x, GY, s, facing, color) { g.save(); g.translate(x, 0); g.scale(facing, 1); FX.chair(g, -22 * s, GY, s, color); g.restore(); }

export function lunchTable(g, t, cam, o = {}) {
  const { GY, M } = cafeteria(g, t, cam, { mood: 'golden', crowd: o.crowd ?? true, cheer: o.cheer ?? 0 });
  const s = S(), ts = TS(), cs = s * 0.92;         // chair scale so the seat lands on the figure's hip
  layer(g, cam, 1, (g2) => {
    chairAt(g2, seats().hero, GY, cs, 1, '#2a1e26');
    chairAt(g2, seats().leo, GY, cs, -1, '#2a1e26');
    drawHero(g2, { x: seats().hero, y: GY, s, facing: 1, pose: o.heroPose || breathe(POSES.sit, t), expr: o.heroExpr || 'thinking', rim: { color: M.rim, dir: [-0.55, -0.8], w: 4 }, shadow: false });
    drawFigure(g2, { x: seats().leo, y: GY, s, facing: -1, outfit: LEO, pose: o.leoPose || breathe(POSES.sit, t, 1, 2), expr: o.leoExpr || 'surprised', rim: { color: M.rim, dir: [0.55, -0.8], w: 4 }, shadow: false, blink: (t % 3.4) > 3.3 });
    const tb = cafTable(g2, E.W / 2, GY, { s: ts });
    tray(g2, seats().hero + 70 * ts, tb.top + 4, ts);
    tray(g2, seats().leo - 70 * ts, tb.top + 4, ts * 0.92, '#8f6a3f');
    o.extra?.(g2, tb, GY);
  });
  FX.dust(g, t, { count: 30, color: '#ffe2bd', a: 0.3 });
  FX.lensStreak(g, E.W * 0.78, E.H * 0.24, E.W * 0.9, '#ffe0b0', 0.14);
  return { GY, M };
}

// s032 — "Plus: you learn a new language over one lunch period."
const CARDS = ['bonne', 'míra', 'σunny', 'cachorro', 'зеркало', 'toki'];
registerShot('s032', { draw(g, t, info) {
  const cam = { z: 1 + 0.06 * ease.inOut(info.p), x: -26 * ease.inOut(info.p), y: -18 * ease.inOut(info.p) };
  lunchTable(g, t, cam, {
    heroPose: POSES.sit, heroExpr: t > 1.6 ? 'explain' : 'thinking',
    leoPose: { ...POSES.sitBack, eF: [4, -110], hF: [10, -96] }, leoExpr: t > 2.2 ? 'shocked' : 'surprised',
    extra: (g2) => {
      CARDS.forEach((c, i) => {
        const born = 0.25 + i * 0.42, k = prog(t, born, born + 0.5); if (k <= 0) return;
        const x = E.W / 2 + (i - 2.5) * V(96, 78), y = lerp(cafeteriaGround() - 150, E.H * 0.36, ease.out(k)) + Math.sin(t * 1.6 + i) * 9;
        wordCard(g2, x, y, V(0.62, 0.55) * (0.7 + 0.3 * k), c, { alpha: clamp(k * 1.6) * (1 - 0.5 * prog(t, born + 1.6, born + 2.2)), rot: Math.sin(t * 0.9 + i) * 0.12 });
      });
    },
  });
  UI.badge(g, { str: '1 LUNCH', x: E.W - V(120, 90), y: V(120, 170), a: ease.out(prog(t, 1.1, 1.6)) });
} });

// s033 — "Grammar, verbs, slang, done by dessert."  insert on the plate, stamp lands on "done"
registerShot('s033', { draw(g, t, info) {
  const GY = cafeteriaGround(), top = GY - 142 * TS();
  const cam = { z: V(1.75, 1.5), x: lerp(-24, 30, info.p), y: top - E.H / 2 + V(40, 60) };
  const { M } = cafeteria(g, t, cam, { mood: 'golden', crowd: true });
  layer(g, cam, 1, (g2) => {
    cafTable(g2, E.W / 2, GY, { s: TS() });
    const px = E.W / 2 + 20, py = top - 6;
    g2.fillStyle = linGrad(g2, 0, py - 30, 0, py + 20, ['#f6f1e6', shade('#f6f1e6', -0.3)]);
    g2.beginPath(); g2.ellipse(px, py, 132, 40, 0, 0, 7); g2.fill();
    g2.fillStyle = alpha('#c9bfae', 0.6); g2.beginPath(); g2.ellipse(px, py - 4, 96, 26, 0, 0, 7); g2.fill();
    g2.fillStyle = '#7a4a2a'; g2.beginPath(); g2.moveTo(px - 40, py - 8); g2.lineTo(px + 46, py - 18); g2.lineTo(px + 30, py - 34); g2.closePath(); g2.fill();
    for (let i = 0; i < 5; i++) wordCard(g2, px - 6 + Math.sin(i * 2.7) * 8, py - 52 - i * 15, 0.62, ['语法', 'VERB', 'slang', 'í', '文法'][i], { rot: (i - 2) * 0.06 });
    const hit = wordTime('done', info.shot.start) ?? info.shot.start + 1.4;
    const k = prog(info.globalT, hit, hit + 0.22);
    if (k > 0) {
      const drop = 1 - ease.out(clamp(k));
      g2.save(); g2.translate(px + 96, py - 66 - drop * 260); g2.rotate(-0.2 + drop * 0.2); g2.scale(1 + drop * 0.5, 1 + drop * 0.5);
      rr(g2, -78, -34, 156, 68, 10); g2.fillStyle = alpha('#e04a3a', 0.92); g2.fill();
      g2.strokeStyle = alpha('#ffffff', 0.75); g2.lineWidth = 4; g2.stroke();
      g2.fillStyle = '#fff'; g2.font = '900 44px Nunito'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('DONE', 0, 2);
      g2.restore();
      if (k > 0.85) FX.rings(g2, px + 96, py - 66, t, { count: 2, r0: 60, r1: 190, speed: 2.2, color: '#fff3e0', a: 0.4 });
    }
  });
  FX.dust(g, t, { count: 18, color: '#ffe2bd', a: 0.26 });
  glow(g, E.W * 0.72, E.H * 0.3, E.W * 0.3, M.key, 0.1);
} });
