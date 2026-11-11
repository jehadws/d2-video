// shots/11_leo.js — s073–s083: act 5, the warm intimate centre. Leo notices, the knock code, and "I miss confusing you."
// Motif 4 (three rings then one) and motif 6 (warmth = Leo, cold = the rest) drive the whole act.
import {
  E, V, registerShot, layer, blurLayer, veil, S, mood, ease, prog, clamp, lerp,
  alpha, shade, linGrad, rr, seg, circle, ring, glow, text, FONTS, wordTime, talkAmount,
} from '/engine/core.js';
import { POSES, breathe, drawFigure, bigFace } from '/engine/rig2d.js';
import { drawHero, drawHeroFace, HERO_PALETTE } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import { cafeteria, cafTable, tray } from '../sets/cafeteria.js';
import { bedroom, bdDesk, deskLamp } from '../sets/bedroom.js';
import { knocks, vignetteFocus } from '../sets/gfx.js';
import { lunchTable } from './06_cafeteria.js';
import { LEO, LEO_KID, HERO_KID } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };              // the hero's deadpan (EXPR has no 'flat')
const GOLD = () => S().ui.gold;                             // warmth that lands as the mind reads the knock
const CREAM = () => S().ui.cream;

// local-time offset (seconds into the shot) at which a spoken word lands.
const beat = (info, word, fb) => ((wordTime(word, info.shot.start) ?? info.shot.start + fb) - info.shot.start);

// The hero as a seven-year-old: drawFigure with the canonical skin inks (drawHero forces the adult outfit).
function kidHero(g, o) {
  drawFigure(g, { ...o, outfit: HERO_KID, ink: HERO_PALETTE.skin, inkFar: HERO_PALETTE.skinShadow });
}

// A tray seen straight down (the match-cut insert).
function trayTopDown(g, x, y, s, warm) {
  rr(g, x - 46 * s, y - 34 * s, 92 * s, 68 * s, 8 * s);
  g.fillStyle = warm ? '#b8563f' : '#8f6a4c'; g.fill();
  g.strokeStyle = alpha('#ffe6bd', warm ? 0.28 : 0.18); g.lineWidth = 2.5 * s; g.stroke();
  circle(g, x - 16 * s, y - 6 * s, 16 * s, '#efe6d8');
  rr(g, x + 6 * s, y - 22 * s, 24 * s, 16 * s, 3 * s); g.fillStyle = '#d8b26a'; g.fill();
  circle(g, x + 20 * s, y + 20 * s, 8 * s, warm ? '#9fd0ff' : '#b9a06a');
}

// The 3 + 1 tally in gold, dots lighting up in time with the spoken knock.
function knockTally(g, t, bThree, bOne) {
  const cx = E.W / 2 + V(250, 180), cy = E.H * V(0.2, 0.16), R = V(15, 13), gp = V(52, 44);
  for (let i = 0; i < 3; i++) {
    const k = ease.out(clamp(prog(t, bThree + i * 0.18, bThree + i * 0.18 + 0.14))); if (k <= 0) continue;
    const x = cx - gp * (2 - i);
    ring(g, x, cy, R * 1.7 * k, 2.5 * k, alpha(GOLD(), 0.5 * k));
    circle(g, x, cy, R * k, GOLD());
    glow(g, x, cy, R * 3.2, GOLD(), 0.22 * k);
  }
  const kp = ease.out(clamp(prog(t, bThree + 0.55, bThree + 0.75)));
  text(g, '+', cx + gp * 0.28, cy, { size: V(32, 30), color: alpha(GOLD(), kp), font: FONTS.ui, weight: 900 });
  const k1 = ease.out(clamp(prog(t, bOne, bOne + 0.2))); if (k1 <= 0) return;
  const x = cx + gp * 1.35;
  ring(g, x, cy, R * 1.9 * k1, 4 * k1, alpha(GOLD(), 0.6 * k1));
  circle(g, x, cy, R * 1.15 * k1, GOLD());
  glow(g, x, cy, R * 4, GOLD(), 0.3 * k1);
}

// s073 — "And Leo notices before anyone else does."
// Two-shot at the cafeteria table, Leo watching, his tray untouched. Reuses the shared lunch-table two-shot.
registerShot('s073', { draw(g, t, info) {
  const cam = { z: 1 + 0.06 * ease.inOut(info.p), x: -22 * ease.inOut(info.p), y: -14 * ease.inOut(info.p) };
  lunchTable(g, t, cam, {
    heroExpr: 'thinking', leoExpr: 'worried', crowd: true, cheer: 0.1,
    leoPose: { ...POSES.sit, head: [POSES.sit.head[0] + 4, POSES.sit.head[1] - 2] },
    extra: (g2, tb) => {
      const look = ease.out(prog(t, 0.2, 0.7));        // Leo's gaze settles on the hero, not the food
      g2.save(); g2.globalCompositeOperation = 'lighter';
      glow(g2, E.W / 2, tb.top - V(40, 40), V(360, 300), '#ffcf8a', 0.05 * look);
      g2.restore();
    },
  });
} });

// s074 — "He's known you since you were seven."
// Warm flashback wide: two seven-year-olds at the same table, same yellow cap / navy hoodie. Bloom + vignette = memory.
registerShot('s074', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.12, p), x: lerp(22, -14, p), y: lerp(-6, 10, p) };
  const { GY, CX, M } = cafeteria(g, t, cam, { mood: 'golden', crowd: true, cheer: 0 });
  const s = V(3.0, 2.7), ts = V(1.4, 1.25);
  const hx = CX - V(250, 210), lx = CX + V(250, 210);
  layer(g, cam, 1, (h) => {
    kidHero(h, { x: hx, y: GY, s, facing: 1, pose: breathe(POSES.sit, t, 0.9, 1), expr: 'happy', rim: { color: M.rim, dir: [-0.55, -0.8], w: 4 }, shadow: false });
    drawFigure(h, { x: lx, y: GY, s, facing: -1, outfit: LEO_KID, pose: breathe(POSES.sit, t, 0.9, 5), expr: 'happy', rim: { color: M.rim, dir: [0.55, -0.8], w: 4 }, shadow: false });
    const tb = cafTable(h, CX, GY, { s: ts });
    tray(h, hx + V(70, 60), tb.top + 4, ts);
    tray(h, lx - V(70, 60), tb.top + 4, ts * 0.92, '#c88a5a');
  });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, CX + E.W * 0.34, E.H * 0.26, E.W * 0.5, '#ffc978', 0.18);   // lifted warm practical
  glow(g, CX, E.H * 0.5, E.W * 0.6, '#ffe0b0', 0.08);                 // soft bloom across the memory
  g.restore();
  FX.lensStreak(g, E.W * 0.66, E.H * 0.22, E.W * 0.95, '#ffe6c0', 0.16);
  FX.dust(g, t, { count: 26, color: '#ffe2bd', a: 0.32 });
  vignetteFocus(g, CX, E.H * 0.52, E.W * 0.6, 0.4);                   // "memory" read
} });

// s075 — "Same table, every lunch, for years."
// Top-down match: the same table, today's pair of trays above a smaller, dimmer childhood pair.
registerShot('s075', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('golden');
  const cam = { z: lerp(1.02, 1.12, p), x: 0, y: lerp(10, -10, p) };
  layer(g, cam, 1, (h) => {
    h.fillStyle = linGrad(h, 0, -E.H, 0, E.H * 1.2, [shade(M.floor, -0.3), shade(M.floor, -0.05), shade(M.floor, -0.4)]);
    h.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    for (let i = -6; i <= 6; i++) seg(h, [[E.W / 2 + i * V(180, 150), -E.H], [E.W / 2 + i * V(70, 60), E.H * 1.2]], 2, alpha(M.dark, 0.12));
    const cx = E.W / 2, cy = E.H / 2, tw = V(680, 520), th = V(720, 760);
    h.save(); h.shadowColor = 'rgba(0,0,0,.5)'; h.shadowBlur = 30; h.shadowOffsetY = 8;
    rr(h, cx - tw / 2, cy - th / 2, tw, th, 40); h.fillStyle = shade(M.practical, -0.62); h.fill(); h.restore();
    rr(h, cx - tw / 2, cy - th / 2, tw, th, 40); h.strokeStyle = alpha(M.key, 0.22); h.lineWidth = 4; h.stroke();
    seg(h, [[cx - tw / 2 + 20, cy], [cx + tw / 2 - 20, cy]], 3, alpha(GOLD(), 0.45));  // the seam: then / now
    trayTopDown(h, cx - tw * 0.28, cy - th * 0.28, V(1.0, 0.9), true);
    trayTopDown(h, cx + tw * 0.28, cy - th * 0.26, V(1.0, 0.9), true);
    const mem = 0.85 * ease.out(clamp(prog(t, 0.15, 0.9)));
    h.save(); h.globalAlpha = mem; trayTopDown(h, cx - tw * 0.2, cy + th * 0.28, V(0.7, 0.62), false); h.restore();
    h.save(); h.globalAlpha = mem; trayTopDown(h, cx + tw * 0.2, cy + th * 0.3, V(0.7, 0.62), false); h.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, cx, cy - th * 0.27, V(520, 420), M.key, 0.06); g.restore();
  });
  text(g, 'NOW', E.W * V(0.11, 0.5), E.H * V(0.22, 0.18), { size: V(32, 30), color: alpha(CREAM(), 0.6), font: FONTS.ui, weight: 900, align: V('left', 'center'), spacing: 3 });
  text(g, 'THEN', E.W * V(0.11, 0.5), E.H * V(0.82, 0.84), { size: V(32, 30), color: alpha(CREAM(), 0.5 * ease.out(prog(t, 0.15, 0.8))), font: FONTS.ui, weight: 900, align: V('left', 'center'), spacing: 3 });
  FX.dust(g, t, { count: 14, color: '#ffe2bd', a: 0.22 });
  vignetteFocus(g, E.W / 2, E.H / 2, E.W * 0.6, 0.42);
} });

// s076 — "Same dumb knock on your door..."
// Insert on a closed door: three knock rings spread across it, then one (motif 4). Warm light leaks from the hall.
registerShot('s076', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('night');
  const cam = { z: lerp(1.12, 1.24, p), x: 0, y: lerp(16, -10, p) };
  const dw = V(400, 340), dh = V(860, 960), cx = E.W / 2, dyBase = E.H * 1.02, dx = cx - dw / 2;
  layer(g, cam, 1, (h) => {
    h.fillStyle = linGrad(h, 0, -E.H, 0, E.H * 1.1, [shade(M.wall, -0.5), shade(M.wall, -0.28), shade(M.dark, 0)]);
    h.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    FX.door(h, { x: dx, y: dyBase, w: dw, h: dh, color: shade(M.wall, -0.12), open: 0, light: '#ffd9a0' });
    h.save(); h.globalCompositeOperation = 'lighter';                  // Leo's warmth bleeding round the frame
    glow(h, dx, dyBase - dh * 0.5, dh * 0.9, '#ffcf8a', 0.12);
    glow(h, dx + dw, dyBase - dh * 0.5, dh * 0.9, '#ffcf8a', 0.12);
    glow(h, cx, dyBase, dw * 0.9, '#ffcf8a', 0.18);
    h.restore();
    h.fillStyle = alpha('#ffd9a0', 0.5); h.fillRect(dx + 8, dyBase - 9, dw - 16, 11);   // light strip under the door
    circle(h, dx + dw - V(42, 34), dyBase - dh * 0.5, V(11, 9), '#caa46a');             // handle
    knocks(h, dx + dw * 0.5, dyBase - dh * 0.55, t, { start: beat(info, 'knock', 0.4), hits: [0, 0.22, 0.44, 0.86], r0: V(44, 38), r1: V(380, 320), color: '#ffe9c4', a: 0.7 });
  });
  FX.dust(g, t, { count: 10, color: '#ffe2bd', a: 0.14 });
} });

// s077 — "three taps, then one."
// Medium single: the hero at his desk snaps round as the knock pattern reads out as a 3 + 1 tally in gold.
registerShot('s077', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.26, 1.34, p), x: lerp(18, -8, p), y: lerp(-4, 10, p) };
  const { GY, CX, M } = bedroom(g, t, cam, { mood: 'night', fan: false, equations: false, doorOpen: 0 });
  const bThree = beat(info, 'three', 0.05), bOne = beat(info, 'one', 1.2);
  const turned = t >= bThree;                                            // the snap-turn, on the first tap
  const s = V(3.0, 2.7), hx = CX + V(180, 150);
  const pose = breathe(turned ? POSES.sitBack : POSES.sit, t * 0.7, 0.6, 2);
  layer(g, cam, 1, (h) => {
    drawHero(h, {
      x: hx, y: GY, s, facing: turned ? -1 : 1, pose,
      expr: turned ? 'smirk' : 'thinking', face: turned ? null : DEAD,
      rim: { color: M.rim, dir: [0.5, -0.7], w: 4 }, blink: (t % 3.8) > 3.7, shadow: false,
    });
    const d = bdDesk(h, hx + V(70, 60), GY, { s: V(1.25, 1.1), color: '#3b2c33' });
    deskLamp(h, hx + V(190, 150), d.top, { on: true, color: '#241d2a', light: '#ffd9a0' });
  });
  knockTally(g, t, bThree, bOne);
} });

// s078 — "He still does it, even now."
// Two-shot: Leo a bright bloom in the open doorway, the hero still cool at his desk, the beat between them held.
registerShot('s078', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.1, 1.14, p), x: lerp(18, -12, p), y: 0 };
  const { GY, CX, M } = bedroom(g, t, cam, { mood: 'night', fan: false, equations: false, doorOpen: 1 });
  const lx = CX - V(630, 470), sL = V(2.5, 2.3);
  const hx = CX + V(320, 250), sH = V(2.9, 2.6);
  layer(g, cam, 1, (h) => {
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, lx, GY - V(170, 150), V(360, 300), '#ffd39a', 0.5);          // strong backlight bloom on Leo
    FX.godRays(h, lx, GY - V(240, 220), { color: '#ffd9a0', a: 0.12 });
    h.restore();
    drawFigure(h, {
      x: lx, y: GY, s: sL, facing: 1, outfit: LEO, pose: breathe(POSES.relaxed, t, 1, 4),
      expr: 'worried', rim: { color: '#ffdca0', dir: [-0.9, -0.2], w: 5 }, blink: (t % 3.0) > 2.9, shadow: false,
    });
    drawHero(h, {
      x: hx, y: GY, s: sH, facing: -1, pose: breathe(POSES.sitBack, t * 0.7, 0.6, 2),
      expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.5, -0.72], w: 4 }, blink: (t % 4.2) > 4.1, shadow: false,
    });
    const d = bdDesk(h, hx + V(120, 90), GY, { s: V(1.3, 1.15), color: '#3b2c33' });
    deskLamp(h, hx + V(40, 34), d.top, { on: true, color: '#241d2a', light: '#ffd9a0' });
  });
  FX.lensStreak(g, lx + V(120, 90), GY - V(300, 260), V(680, 520), '#ffdca6', 0.14);
} });

// s079 — "One afternoon he finds you just sitting in the dark."
// Wide: the hero on the floor in the dark room, Leo a bright shape in the open door, warm light spilling across.
registerShot('s079', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.14, p), x: lerp(30, -12, p), y: lerp(10, 0, p) };
  const { GY, CX, M } = bedroom(g, t, cam, { mood: 'night', fan: false, equations: false, doorOpen: 1 });
  const lx = CX - V(680, 500), sL = V(2.3, 2.1);
  const hx = CX + V(120, 120), sH = V(2.0, 1.85);
  layer(g, cam, 1, (h) => {
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, lx, GY - V(170, 160), V(380, 320), '#ffd39a', 0.55);          // Leo the bright shape in the doorway
    h.restore();
    drawFigure(h, {
      x: lx, y: GY, s: sL, facing: 1, outfit: LEO, pose: breathe(POSES.stand, t, 0.8, 4),
      expr: 'worried', rim: { color: '#ffe0b0', dir: [-0.9, -0.1], w: 5 }, alpha: 0.96, shadow: false,
    });
    FX.pool(h, lx + V(140, 100), GY + V(50, 34), V(440, 360), V(96, 74), '#ffcf8a', 0.22);   // light on the floor
    drawHero(h, {
      x: hx, y: GY, s: sH, facing: -1, pose: breathe(POSES.sit, t * 0.5, 0.5, 2),
      expr: 'sad', rim: { color: M.rim, dir: [-0.7, -0.4], w: 3 }, dim: true, blink: (t % 4.6) > 4.5, shadow: false,
    });
  });
  FX.dust(g, t, { count: 12, color: '#cfe0ff', a: 0.12 });
} });

// s080 — "You used to laugh at my terrible jokes, he says quietly."
// Medium single: Leo on the floor beside him, knees up, talking quietly. The hero's blurred shoulder holds the foreground.
const FLOOR_SIT = {
  head: [10, -150], sh: [3, -116], hip: [-6, -24],
  eF: [24, -94], hF: [42, -66], eB: [18, -96], hB: [36, -70],
  kF: [46, -72], fF: [40, -2], kB: [44, -70], fB: [38, 0],
};
registerShot('s080', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.16, 1.26, p), x: lerp(-14, 10, p), y: lerp(6, -6, p) };
  const { GY, CX, M } = bedroom(g, t, cam, { mood: 'night', fan: false, equations: false, doorOpen: 0.7 });
  const s = V(3.4, 3.0), lx = CX - V(70, 60);
  layer(g, cam, 1, (h) => {
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, lx + V(150, 120), GY - V(220, 200), V(320, 260), '#ffd39a', 0.28);   // the door practical on Leo
    h.restore();
    drawFigure(h, {
      x: lx, y: GY, s, facing: 1, outfit: LEO, pose: breathe(FLOOR_SIT, t * 0.6, 0.4, 4),
      expr: 'worried', talk: talkAmount(info.globalT, info.shot.start, info.shot.end),
      rim: { color: '#ffd9a0', dir: [0.5, -0.75], w: 5 }, blink: (t % 3.3) > 3.2, shadow: false,
    });
    const hh = [lx + FLOOR_SIT.head[0] * s, GY + FLOOR_SIT.head[1] * s];
    FX.rings(h, hh[0], hh[1], t, { count: 2, r0: V(40, 34), r1: V(110, 96), speed: 0.8, color: '#ffe6c0', a: 0.14 });
  });
  blurLayer(g, 11, (h) => {
    drawHero(h, {
      x: CX + V(430, 320), y: GY, s: V(3.6, 3.2), facing: -1, pose: breathe(POSES.sit, t * 0.5, 0.4, 2),
      expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [-0.5, -0.6], w: 3 }, dim: true, alpha: 0.7, shadow: false,
    });
  }, cam, 1.6);
  FX.dust(g, t, { count: 10, color: '#ffe2bd', a: 0.12 });
} });

// s081 — "Now you just... solve them before I finish."
// Giant close-up: the hero, flat, then a smile that arrives a beat too early. He already solved the joke. Leo's voice off-screen.
registerShot('s081', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('night');
  blurLayer(g, 13, (g2) => bedroom(g2, t, { z: 1.5, x: -170, y: -70 }, { mood: 'night', fan: false, equations: false, doorOpen: 0.5 }));
  veil(g, '#0a0c16', 0.34);
  const smileAt = info.shot.start + info.dur * 0.34;                 // the too-early smile
  const k = ease.out(clamp(prog(info.globalT, smileAt, smileAt + 0.5)));
  const cx = E.W / 2 - V(30, 0), cy = E.H * V(0.6, 0.54);
  const r = V(300, 332) * (1 + 0.03 * p + 0.02 * k);
  drawHeroFace(g, cx, cy, r, {
    expr: k > 0.45 ? 'smile' : 'neutral', face: k > 0.45 ? null : DEAD,
    look: [-0.34, -0.06], blink: (t % 3.1) > 3.0, rimColor: '#ffd9a0', rimSide: -1,
  });
  g.save(); g.globalCompositeOperation = 'lighter';                  // warmth of Leo's off-screen voice
  glow(g, cx - r * 0.95, cy, r * 1.5, '#ffcf8a', 0.1 + 0.08 * k);
  g.restore();
  if (k > 0) ring(g, cx, cy, r * (1.06 + (1 - k) * 0.4), 3 * k, alpha('#ffe0b0', 0.22 * k));
} });

// s082 — "I miss confusing you."
// Giant close-up: Leo, the warm practical catching his yellow cap, slow push on the quiet line.
registerShot('s082', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('night');
  blurLayer(g, 13, (g2) => bedroom(g2, t, { z: 1.5, x: 160, y: -70 }, { mood: 'night', fan: false, equations: false, doorOpen: 0.6 }));
  veil(g, '#0c0a10', 0.3);
  const cx = E.W / 2 + V(40, 0), cy = E.H * V(0.62, 0.54);
  const r = V(298, 330) * (1 + 0.05 * p);
  bigFace(g, cx, cy, r, {
    outfit: LEO, expr: 'worried', talk: talkAmount(info.globalT, info.shot.start, info.shot.end),
    blink: (t % 3.4) > 3.3, look: [0.16, 0.05], rimColor: '#ffd9a0', rimSide: 1,
  });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx - r * 0.05, cy - r * 0.88, r * 0.95, '#ffcf7a', 0.2);    // warm practical on the yellow cap
  glow(g, cx, cy, r * 2.2, M.practical || '#ffd9a0', 0.07);
  g.restore();
  FX.rings(g, cx, cy - r * 0.2, t, { count: 2, r0: r * 1.05, r1: r * 1.5, speed: 0.8, color: '#ffe6c0', a: 0.1 });
} });

// s083 — "That hits harder than any equation."
// Wide: the hero alone again, the wall equations dimming out one by one, the last warmth leaving with the doorway.
registerShot('s083', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.16, 1.05, p), x: lerp(0, 30, p), y: lerp(-6, 8, p) };
  const bT = info.shot.start;
  const lit = 6 - Math.floor(clamp(prog(info.globalT, bT + 0.2, bT + info.dur - 0.4)) * 6.0001);   // one line out, one at a time
  const { GY, CX, M } = bedroom(g, t, cam, { mood: 'night', fan: false, equationsLit: lit, equationAlpha: 0.3, doorOpen: 0 });
  const s = V(2.4, 2.2), hx = CX + V(240, 200);
  layer(g, cam, 1, (h) => {
    drawHero(h, {
      x: hx, y: GY, s, facing: -1, pose: breathe(POSES.sitBack, t * 0.6, 0.6, 2),
      expr: 'sad', rim: { color: M.rim, dir: [-0.55, -0.7], w: 4 }, blink: (t % 4.3) > 4.2, shadow: false,
    });
    const d = bdDesk(h, hx + V(90, 70), GY, { s: V(1.2, 1.05), color: '#3b2c33' });
    deskLamp(h, hx + V(180, 140), d.top, { on: false, color: '#241d2a' });
  });
  const warm = 0.16 * (1 - ease.in(prog(t, 0.4, info.dur - 0.3)));     // Leo's warmth fading from the doorway
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, CX - V(700, 520), GY - V(180, 170), V(300, 240), '#ffcf8a', warm);
  g.restore();
  FX.dust(g, t, { count: 10, color: '#cfe0ff', a: 0.1 });
} });
