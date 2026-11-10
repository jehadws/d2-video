// shots/07_bedroom.js — 2 AM: the cost nobody warns you about, and the face that can't switch off.
import { E, V, registerShot, layer, blurLayer, veil, mood, ease, prog, clamp, lerp, shake, wordTime, alpha, ring, glow, text, FONTS } from '/engine/core.js';
import { POSES, breathe } from '/engine/rig2d.js';
import { drawHero, drawHeroFace } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, bedroomGround, bed, numberStream, ceilingFan } from '../sets/bedroom.js';

// s052 — "And there's a cost nobody warns you about."  wide: awake in moonlight, numbers on the ceiling
registerShot('s052', { draw(g, t, info) {
  const p = ease.inOut(info.p), GY = bedroomGround();
  const cam = { z: 1 + 0.09 * p, x: lerp(-22, 26, p), y: lerp(0, -46, p) };
  const { M, win } = bedroom(g, t, cam, { mood: 'night', fan: false, equationsLit: 6, equationAlpha: 0.22 });
  layer(g, cam, 1, (g2) => {
    const bx = E.W / 2 - V(430, 330), bs = V(1.3, 1.15);
    const bd = bed(g2, bx, GY, { s: bs });
    ceilingFan(g2, E.W / 2 + V(140, 0), GY - V(690, 900), V(1, 0.85), t, { spin: 1.9 });
    const s = V(2.1, 1.9), hipX = bx + bd.w * 0.62;
    drawHero(g2, {
      x: hipX, y: bd.top + 2, s, rot: -Math.PI / 2, pose: breathe(POSES.lie, t * 0.4, 0.35), expr: 'worried',
      rim: { color: M.rim, dir: [0.35, -0.94], w: 4 }, shadow: false, blink: (t % 4.1) > 4.0,
    });
    g2.save(); g2.globalCompositeOperation = 'lighter';
    g2.fillStyle = alpha(M.rim, 0.06); g2.fillRect(win.x - 60, win.y + win.h, win.w + 120, GY - win.y - win.h);
    g2.restore();
  });
  numberStream(g, t, { count: 40, area: [0, E.H * 0.04, E.W, E.H * 0.3], color: '#9fd0ff', a: 0.42, speed: 22 });
  UI.readout(g, { label: 'ASLEEP', value: '0 h 00 m', x: V(140, 110), y: E.H - V(150, 420), color: '#9fd0ff', a: ease.out(prog(t, 1.1, 1.7)) });
  FX.dust(g, t, { count: 16, color: '#cfe0ff', a: 0.16 });
} });

// s053 — "You can't turn it off. Ever."  giant close-up, data reflected on the face, punch on "Ever"
registerShot('s053', { draw(g, t, info) {
  blurLayer(g, 15, (g2) => bedroom(g2, t, { z: 1.7, x: 240, y: -140 }, { mood: 'night', equationsLit: 3, equationAlpha: 0.4 }));
  veil(g, '#0a0c18', 0.4);
  const M = mood('night');
  const ever = wordTime('ever', info.shot.start) ?? info.shot.start + 1.4;
  const punch = clamp(1 - prog(info.globalT, ever, ever + 0.42));
  const r = V(300, 330) * (1 + 0.03 * t + 0.05 * punch);
  const [sx, sy] = punch > 0 ? shake(info.globalT, 9 * punch, 26, 5) : [0, 0];
  g.save(); g.translate(sx, sy);
  drawHeroFace(g, E.W / 2 + V(40, 0), E.H * V(0.62, 0.56), r, {
    expr: punch > 0.3 ? 'shocked' : 'scared', rimColor: M.rim, rimSide: -1, look: [0.25, -0.35],
  });
  g.save();
  g.beginPath(); g.arc(E.W / 2 + V(40, 0), E.H * V(0.62, 0.56), r * 0.96, 0, 7); g.clip();
  g.globalCompositeOperation = 'lighter';
  numberStream(g, t * 1.6, { count: 26, area: [E.W / 2 - r, E.H * 0.36, r * 2, r * 1.2], color: '#9fd0ff', a: 0.3, speed: 34, size: 26 });
  g.restore();
  g.restore();
  if (punch > 0) {
    ring(g, E.W / 2 + V(40, 0), E.H * V(0.62, 0.56), r * (1.05 + (1 - punch) * 0.4), 4 * punch, alpha('#9fd0ff', 0.5 * punch));
    glow(g, E.W / 2 + V(40, 0), E.H * V(0.62, 0.56), r * 2.4, '#6ea8ff', 0.18 * punch);
    text(g, 'EVER.', E.W / 2, V(150, 300), { size: V(72, 66), color: '#dfe8ff', font: FONTS.ui, weight: 900, spacing: 6, alpha: punch, glow: 26, glowColor: alpha('#6ea8ff', 0.7) });
  }
  UI.badge(g, { str: '02:00 AM', x: E.W - V(120, 90), y: V(120, 180), color: '#9fd0ff', a: 1 });
} });
