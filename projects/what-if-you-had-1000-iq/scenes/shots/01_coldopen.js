// shots/01_coldopen.js — s001–s016: the cold open, the four-minute legend, the number, the rule.
import { E, V, registerShot, layer, S, ease, prog, clamp, alpha, shade, rr, seg, poly, circle, ring, glow, text, wordTime, rng, FONTS } from '/engine/core.js';
import { POSES, drawFigure, breathe, walkPose } from '/engine/rig2d.js';
import { drawHero } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { chessRoom, chessBoard, chessTable, ghostMoves } from '../sets/chess.js';
import { classroom, chalkboard, schoolDesk } from '../sets/class.js';
import { hallway, cable, coil } from '../sets/hall.js';
import { city, busShelter, board as boardPanel } from '../sets/city.js';
import { kitchen, kitchenCounter, toaster } from '../sets/kitchen.js';
import { voidSet } from '../sets/void.js';
import { stamp, taskCard, wordOccurrence, countTo } from '../sets/gfx.js';
import { LEO, TEACHER } from '../cast.js';

const ENDGAME = [
  { f: 4, r: 0, c: 'w', t: 'K' }, { f: 3, r: 2, c: 'w', t: 'P' }, { f: 5, r: 3, c: 'w', t: 'P' }, { f: 2, r: 4, c: 'w', t: 'R' },
  { f: 6, r: 5, c: 'b', t: 'N' }, { f: 1, r: 6, c: 'b', t: 'K' }, { f: 4, r: 7, c: 'b', t: 'Q' }, { f: 7, r: 4, c: 'b', t: 'P' },
];
const ANSWER = '3,386,012';
const DEAD = { mouth: 'flat', brows: null };            // the hero's deadpan: EXPR has no 'flat', so override the mouth

// s001 — "What If You Had 1000 IQ?" title over the dusk chess hall.
registerShot('s001', { draw(g, t, info) {
  const cam = { z: 1.12 - 0.1 * ease.inOut(info.p), x: -40 + 80 * info.p, y: 20 - 30 * info.p };
  const { GY, CX, M } = chessRoom(g, t, cam, { mood: 'dusk', clearCentre: true });
  layer(g, cam, 1, (g2) => {
    drawHero(g2, { x: CX + V(430, 340), y: GY, s: V(2.05, 1.9), facing: -1, pose: breathe(POSES.sit, t), expr: 'thinking', rim: { color: M.rim, dir: [0.6, -0.75], w: 4 } });
    chessTable(g2, CX + V(430, 340), GY + V(10, 6), V(1.2, 1.05));
  });
  UI.titleCard(g, t, { lines: ['WHAT IF', 'YOU HAD 1000 IQ?'], dur: info.shot.end - info.shot.start, y: E.H * V(0.34, 0.32) });
  FX.dust(g, t, { count: 22, color: '#ffe2bd', a: 0.22 });
} });

// s002 — "You glance at the chessboard once." board insert, gold grid waking up.
registerShot('s002', { draw(g, t, info) {
  const cam = { z: 1.3 + 0.12 * ease.inOut(info.p), x: 30 * info.p, y: E.H * 0.16 };
  const { GY, CX, M } = chessRoom(g, t, cam, { mood: 'dusk', clearCentre: true });
  layer(g, cam, 1, (g2) => {
    const b = chessBoard(g2, CX, GY - V(30, 20), V(1.5, 1.3), { pieces: ENDGAME, tilt: 0.62 });
    const sq = b.sq, half = b.half;
    for (let i = 0; i < 64; i++) {
      const f = i % 8, r = (i / 8) | 0, k = prog(t, 0.25 + (f + r) * 0.045, 0.55 + (f + r) * 0.045);
      if (k <= 0) continue;
      g2.save(); g2.translate(b.x, b.y); g2.scale(1, b.tilt);
      g2.strokeStyle = alpha(S().ui.gold, 0.5 * k); g2.lineWidth = 2;
      g2.strokeRect(-half + f * sq, -half + r * sq, sq, sq); g2.restore();
    }
    glow(g2, CX, GY - V(30, 20), V(520, 430), S().ui.gold, 0.1 * prog(t, 0.4, 1.4));
  });
  UI.badge(g, { str: 'ONE GLANCE', x: E.W - V(90, 70), y: V(120, 150), color: alpha(S().ui.cream, 0.85) });
} });

// s003 — "You already see the next forty moves." ghost moves fan out, hero motionless.
registerShot('s003', { draw(g, t, info) {
  const cam = { z: 1.24 + 0.14 * ease.inOut(info.p), x: -20 - 30 * info.p, y: E.H * 0.04 };
  const { GY, CX, M } = chessRoom(g, t, cam, { mood: 'dusk', clearCentre: true });
  layer(g, cam, 1, (g2) => {
    const b = chessBoard(g2, CX - V(120, 90), GY - V(20, 10), V(1.35, 1.15), { pieces: ENDGAME, tilt: 0.6, highlight: [[4, 0], [2, 4]], hlColor: S().ui.gold });
    ghostMoves(g2, b, { count: 14, progress: ease.out(prog(t, 0.2, 1.9)), a: 0.6, rot: t * 0.05 });
    drawHero(g2, { x: CX + V(470, 360), y: GY, s: V(2.1, 1.95), facing: -1, pose: breathe(POSES.sit, t, 1, 5), expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.7, -0.6], w: 4 } });
    chessTable(g2, CX + V(470, 360), GY + V(8, 5), V(1.05, 0.9), { color: shade(M.wall, -0.2) });
  });
  UI.readout(g, { label: 'MOVES SEEN', value: countTo(t, 0.2, 1.6, 40, { pad: 2 }), x: V(150, 110), y: E.H - V(160, 300), color: S().ui.gold, size: V(54, 48) });
  FX.dust(g, t, { count: 16, color: '#ffe2bd', a: 0.18 });
} });

// s004 — "Your teacher writes a six digit multiplication on the board." classroom wide.
registerShot('s004', { draw(g, t, info) {
  const cam = { z: 1 + 0.05 * ease.inOut(info.p), x: 60 - 90 * info.p, y: -10 };
  const { GY, CX, M, board } = classroom(g, t, cam, { mood: 'day', clearFront: true });
  layer(g, cam, 1, (g2) => {
    drawFigure(g2, { x: board.x + board.w + V(120, 90), y: GY, s: V(2.35, 2.15), facing: -1, outfit: TEACHER, pose: POSES.point, expr: 'neutral', rim: { color: M.rim, dir: [0.5, -0.7], w: 4 } });
    drawHero(g2, { x: CX - V(240, 190), y: GY + V(6, 4), s: V(2.3, 2.1), facing: 1, pose: breathe(POSES.sit, t * 0.8), expr: 'thinking', rim: { color: M.rim, dir: [-0.5, -0.7], w: 4 } });
    schoolDesk(g2, CX - V(240, 190), GY + V(20, 14), V(1.25, 1.1));
  });
  FX.dust(g, t, { count: 26, color: '#ffe9c4', a: 0.3, area: [E.W * 0.55, E.H * 0.1, E.W * 0.4, E.H * 0.6] });
  UI.badge(g, { str: '08:14', x: E.W - V(90, 70), y: V(120, 150), color: alpha(S().ui.cream, 0.8) });
} });

// s005 — "You answer before she drops the chalk." medium single, hand up, answer floating.
registerShot('s005', { draw(g, t, info) {
  const cam = { z: 1.32 - 0.06 * ease.inOut(info.p), x: -30 + 40 * info.p, y: -E.H * 0.02 };
  const { GY, CX, M } = classroom(g, t, cam, { mood: 'day', desks: false });
  layer(g, cam, 1, (g2) => {
    drawHero(g2, { x: CX - V(60, 50), y: GY, s: V(2.7, 2.5), facing: 1, pose: { ...POSES.wave, head: [POSES.wave.head[0], POSES.wave.head[1] + 6] }, expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [-0.45, -0.75], w: 4 } });
    schoolDesk(g2, CX, GY + V(30, 22), V(1.5, 1.3));
    const k = ease.out(prog(t, 0.35, 0.9));
    if (k > 0) text(g2, ANSWER, CX + V(330, 260), GY - V(600, 700) - 20 * k, { size: V(58, 52), color: alpha(S().ui.gold, k), font: FONTS.ui, weight: 900, glow: 26 * k, glowColor: alpha(S().ui.gold, 0.6) });
  });
  FX.dust(g, t, { count: 18, color: '#ffe9c4', a: 0.24 });
} });

// s006 — insert: chalk still on the board, the answer glowing under the hand.
registerShot('s006', { draw(g, t, info) {
  const cam = { z: 1 + 0.06 * info.p, x: -60, y: E.H * 0.12 };
  const { GY, CX, M, board } = classroom(g, t, cam, { mood: 'day', desks: false });
  layer(g, cam, 1, (g2) => {
    chalkboard(g2, { x: board.x - V(120, 90), y: board.y + V(40, 30), w: board.w * 1.2, h: board.h * 0.9 }, { lines: ['483,716 × 7'], chalk: alpha(M.rim, 0.9), sizes: [V(74, 66)] });
    const hx = board.x + board.w * 0.86, hy = board.y + board.h * 0.34;
    seg(g2, [[hx + V(240, 210), hy - V(100, 86)], [hx + V(34, 28), hy + V(4, 4)]], V(30, 25), shade(TEACHER.headColor, -0.1));
    circle(g2, hx, hy, V(21, 18), '#f2ede2');
    seg(g2, [[hx, hy], [hx - V(26, 22), hy + V(30, 26)]], V(11, 9), '#f2ede2');
    const k = ease.out(prog(t, 0.3, 0.8));
    text(g2, ANSWER, board.x + board.w * 0.2, board.y + board.h * 0.78, { size: V(70, 62), color: alpha(S().ui.gold, k), font: FONTS.ui, weight: 900, align: 'left', glow: 30 * k, glowColor: alpha(S().ui.gold, 0.7) });
    glow(g2, board.x + board.w * 0.4, board.y + board.h * 0.78, V(520, 420), S().ui.gold, 0.16 * k);
  });
  UI.readout(g, { label: 'TEACHER', value: '2:00:00', x: V(150, 110), y: E.H - V(150, 280), color: alpha(S().ui.cream, 0.8), size: V(44, 40) });
  UI.readout(g, { label: 'YOU', value: '0:04', x: V(150, 110), y: E.H - V(90, 210), color: S().ui.gold, size: V(44, 40) });
} });

// s007 — "Your friend Leo hands you a tangled charger cable." hallway two-shot.
registerShot('s007', { draw(g, t, info) {
  const cam = { z: 1.05 - 0.05 * ease.inOut(info.p), x: -30 + 60 * info.p, y: 0 };
  const { GY, CX, M } = hallway(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (g2) => {
    drawFigure(g2, { x: CX - V(330, 270), y: GY, s: V(2.5, 2.3), facing: 1, outfit: LEO, pose: POSES.holdFront, expr: 'smile', rim: { color: M.rim, dir: [-0.4, -0.7], w: 4 } });
    drawHero(g2, { x: CX + V(330, 270), y: GY, s: V(2.5, 2.3), facing: -1, pose: POSES.reach, expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.4, -0.7], w: 4 } });
    cable(g2, CX, GY - V(150, 150), V(1.15, 1), { tangle: 1, phase: 0 });
  });
  FX.dust(g, t, { count: 14, color: '#cfd8e6', a: 0.16 });
} });

// s008 — "You hand it back... untangled... in two seconds." knot released on the word.
registerShot('s008', { draw(g, t, info) {
  const hit = wordTime('untangled', info.shot.start) ?? info.shot.start + info.p * 1.2;
  const rel = ease.out(clamp(prog(info.globalT, hit, hit + 0.35)));
  const cam = { z: 1.26 - 0.08 * info.p, x: 20 * info.p, y: -E.H * 0.01 };
  const { GY, CX, M } = hallway(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (g2) => {
    drawHero(g2, { x: CX + V(200, 165), y: GY, s: V(2.55, 2.35), facing: -1, pose: POSES.holdFront, expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.45, -0.7], w: 4 } });
    cable(g2, CX - V(40, 34), GY - V(275, 300), V(1.3, 1.15), { tangle: 1 - rel, phase: t * (1 + rel * 26) });
    if (rel < 0.85) {
      const k = 1 - rel / 0.85;
      ring(g2, CX - V(40, 34), GY - V(275, 300), V(150, 130) * (1 + (1 - k) * 0.3), 5, alpha('#e04a3a', 0.7 * k));
      UI.callout(g2, t, { at: [CX - V(40, 34), GY - V(275, 300)], to: [V(430, 340), V(170, 210)], str: 'KNOT × 11', color: '#e0745a', start: 0.1 });
    }
    if (rel > 0.1) FX.speedLines(g2, t, { cx: CX - V(40, 34), cy: GY - V(275, 300), count: 26, inner: V(120, 110), a: 0.2 * rel, color: '#e8f0f6' });
  });
  if (rel > 0.55) {
    const k = ease.out(clamp(prog(info.globalT, hit + 0.3, hit + 0.55)));
    stamp(g, CX + V(520, 420), GY - V(420, 520), V(0.85, 0.75), '2.00 s', { k, color: '#3f7d5c' });
  }
  UI.badge(g, { str: 'IN TWO SECONDS', x: E.W - V(90, 70), y: V(120, 150), color: alpha(S().ui.cream, 0.85) });
} });

// s009 — "in two seconds." the neat coil lands in Leo's hands.
registerShot('s009', { draw(g, t, info) {
  const cam = { z: 1 + 0.06 * ease.inOut(info.p), x: 20 - 40 * info.p, y: 0 };
  const { GY, CX, M } = hallway(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (g2) => {
    drawFigure(g2, { x: CX - V(340, 280), y: GY, s: V(2.5, 2.3), facing: 1, outfit: LEO, pose: POSES.holdFront, expr: 'shocked', rim: { color: M.rim, dir: [-0.4, -0.7], w: 4 }, blink: (t % 2.7) > 2.6 });
    drawHero(g2, { x: CX + V(340, 280), y: GY, s: V(2.5, 2.3), facing: -1, pose: POSES.shrug, expr: 'smirk', rim: { color: M.rim, dir: [0.4, -0.7], w: 4 } });
    coil(g2, CX - V(180, 150), GY - V(210, 220), V(1.1, 0.95));
  });
  FX.rings(g, CX - V(180, 150), GY - V(210, 220), t, { count: 2, r0: 70, r1: 190, speed: 1.2, color: '#cfe0f0', a: 0.2 });
} });

// s010 — "The bus timetable," shelter board lighting up row by row.
registerShot('s010', { draw(g, t, info) {
  const cam = { z: 1.35 - 0.08 * ease.inOut(info.p), x: -20 + 40 * info.p, y: E.H * 0.02 };
  const { GY, CX, M } = city(g, t, cam, { mood: 'dusk', lamps: true, cars: [{ x: E.W / 2 + V(700, 560), color: '#2a2f3c', head: 0.8 }] });
  layer(g, cam, 1, (g2) => {
    busShelter(g2, CX, GY + V(20, 16), V(1.35, 1.15), { lit: true });
    boardPanel(g2, CX, GY - V(330, 400), V(1.4, 1.2), {
      rows: ['07:12  →  CENTRAL', '07:19  →  NORTH GATE', '07:24  →  OLD BRIDGE', '07:31  →  AIRPORT', '07:38  →  CENTRAL'],
      hi: Math.min(4, Math.floor(prog(t, 0.1, 1.5) * 5)), h: 240, w: 400,
    });
  });
  UI.badge(g, { str: 'READ: 0.4 s', x: E.W - V(90, 70), y: V(120, 150), color: S().ui.gold });
} });

// s011 — "the weather," pressure map with the rain percentage counting up.
registerShot('s011', { draw(g, t, info) {
  const cam = { z: 1.05 + 0.1 * ease.inOut(info.p), x: 0, y: 0 };
  const { M } = voidSet(g, t, cam, { mood: 'void', grid: true, gridAlpha: 0.06, dust: false });
  layer(g, cam, 1, (g2) => {
    const cx = E.W * 0.42, cy = E.H * 0.5, k0 = ease.out(prog(t, 0.1, 0.8));
    const pts = [[cx - V(430, 350), cy - V(300, 360)], [cx - V(170, 160), cy - V(360, 420)], [cx + V(250, 230), cy - V(165, 205)], [cx + V(360, 330), cy + V(85, 100)], [cx + V(85, 85), cy + V(330, 385)], [cx - V(285, 280), cy + V(220, 265)]];
    poly(g2, pts, alpha('#33506b', 0.55 * k0));
    g2.save(); g2.beginPath(); pts.forEach((p, i) => i ? g2.lineTo(p[0], p[1]) : g2.moveTo(p[0], p[1])); g2.closePath();
    g2.setLineDash([14, 10]); g2.strokeStyle = alpha(S().ui.blueprint, 0.55 * k0); g2.lineWidth = 3; g2.stroke(); g2.restore();
    for (let i = 0; i < 5; i++) { const k = prog(t, 0.15 + i * 0.16, 0.5 + i * 0.16); if (k <= 0) continue; ring(g2, cx + V(150, 140), cy - V(80, 95), (60 + i * 88) * k, 2.5, alpha(S().ui.blueprint, 0.5 * k)); }
    text(g2, 'L 998', cx + V(150, 140), cy - V(80, 95), { size: V(34, 32), color: S().ui.gold, font: FONTS.ui, weight: 900 });
    text(g2, 'H 1024', cx - V(380, 350), cy + V(190, 215), { size: V(30, 30), color: alpha(S().ui.blueprint, 0.8), font: FONTS.ui, weight: 900 });
    const rainP = ease.out(prog(t, 0.4, 1.6));
    for (let i = 0; i < 30; i++) {
      const r = rng(60 + i), x = cx + V(-380, -320) + r() * V(780, 660), y = cy + V(-290, -330) + r() * V(580, 620);
      if (r() > rainP * 0.8) continue;
      seg(g2, [[x, y], [x - 8, y + 30]], 3, alpha('#9fc4d8', 0.6));
    }
  });
  UI.readout(g, { label: 'RAIN', value: countTo(t, 0.4, 1.6, 92, { suffix: ' %' }), x: E.W * 0.72, y: E.H * 0.42, color: S().ui.gold, size: V(60, 54) });
  UI.badge(g, { str: 'TOMORROW, 6:40 AM', x: E.W - V(90, 70), y: V(120, 150), color: alpha(S().ui.cream, 0.8) });
} });

// s012 — "the crossword," letters dropping into the grid.
registerShot('s012', { draw(g, t, info) {
  const cam = { z: 1.2 + 0.1 * ease.inOut(info.p), x: 10 * info.p, y: -10 };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'day', view: 'street' });
  layer(g, cam, 1, (g2) => {
    const c = kitchenCounter(g2, CX, GY, { w: 420 });
    const gx = CX - V(60, 50), gy = c.top - V(150, 190), n = 7, sq = V(46, 40);
    g2.save(); g2.translate(gx, gy); g2.rotate(-0.06);
    rr(g2, -n * sq / 2 - 18, -n * sq / 2 - 18, n * sq + 36, n * sq + 36, 8); g2.fillStyle = '#f4efe2'; g2.fill();
    const words = ['QUARTZ', 'ZEBRA', 'OXIDE'];
    for (let r = 0; r < n; r++) for (let cI = 0; cI < n; cI++) {
      const blk = (r === 1 && cI < 6) || (cI === 4 && r < 5);
      g2.strokeStyle = alpha('#1a1c24', 0.5); g2.lineWidth = 2;
      g2.strokeRect(-n * sq / 2 + cI * sq, -n * sq / 2 + r * sq, sq, sq);
      if (!blk) continue;
      const idx = r === 1 ? cI : r, ch = words[0][idx] || words[1][idx] || '?';
      const born = 0.2 + idx * 0.12 + (cI === 4 ? 0.06 : 0), k = ease.out(clamp(prog(t, born, born + 0.22)));
      if (k <= 0) continue;
      text(g2, ch, -n * sq / 2 + cI * sq + sq / 2, -n * sq / 2 + r * sq + sq / 2 - (1 - k) * 90, { size: sq * 0.62 * (0.7 + 0.3 * k), color: alpha('#22283a', k), font: FONTS.ui, weight: 900 });
    }
    g2.restore();
  });
  UI.badge(g, { str: '7 DOWN: QUARTZ', x: E.W - V(90, 70), y: V(120, 150), color: S().ui.gold });
} });

// s013 — "the crowd's exact head count." high wide over the crossing, ink figures, gold count.
registerShot('s013', { draw(g, t, info) {
  const cam = { z: 1.1 + 0.12 * ease.inOut(info.p), x: -20 + 40 * info.p, y: -E.H * 0.16 };
  const { GY, CX, M } = city(g, t, cam, { mood: 'dusk', crowd: true, cars: [{ x: E.W / 2 - V(620, 500), color: '#242a34', tail: 0.7, dir: -1 }] });
  layer(g, cam, 0.86, (g2) => {
    FX.crowd(g2, t, { x: CX - V(820, 640), y: GY - V(300, 340), w: V(1640, 1280), rows: 3, rowH: V(52, 44), size: V(0.85, 0.72), color: shade(M.wall, -0.05), seed: 55 });
    for (let i = 0; i < 12; i++) {
      const r = rng(100 + i), x = CX - V(700, 540) + r() * V(1400, 1080), y = GY - V(120, 150) - r() * V(140, 170);
      const k = prog(t, 0.15 + i * 0.09, 0.3 + i * 0.09);
      if (k > 0 && k < 1) ring(g2, x, y, V(40, 34) * (1 + (1 - k)), 2, alpha(S().ui.gold, 0.5 * k));
    }
  });
  UI.readout(g, { label: 'HEAD COUNT', value: countTo(t, 0.2, 1.5, 1247), x: V(150, 110), y: E.H - V(150, 300), color: S().ui.gold, size: V(66, 58) });
} });

// s014 — "Done. Done. Done. Done." four stamps slamming on one board, one per spoken word.
registerShot('s014', { draw(g, t, info) {
  const cam = { z: 1.08 + 0.05 * info.p, x: -14 + 28 * info.p, y: 0 };
  const { GY, CX, M } = city(g, t, cam, { mood: 'dusk', lamps: false });
  const tasks = ['TIMETABLE', 'WEATHER', 'CROSSWORD', 'HEAD COUNT'];
  const hits = tasks.map((_, i) => wordOccurrence('done', info.shot.start, i + 1) ?? info.shot.start + i * 0.45);
  layer(g, cam, 1, (g2) => {
    g2.fillStyle = alpha('#1e242e', 0.78); rr(g2, CX - V(500, 400), GY - V(660, 760), V(1000, 800), V(470, 560), 14); g2.fill();
    g2.strokeStyle = alpha(M.rim, 0.25); g2.lineWidth = 3; g2.stroke();
    tasks.forEach((tk, i) => {
      const x = CX + V(-235, -190) + (i % 2) * V(470, 380), y = GY - V(540, 640) + ((i / 2) | 0) * V(200, 240);
      taskCard(g2, x, y, V(1.05, 0.9), tk, { rot: (i % 2 ? 0.03 : -0.04) });
      const k = clamp(prog(info.globalT, hits[i], hits[i] + 0.2));
      if (k > 0) stamp(g2, x + V(28, 22), y - V(4, 3), V(0.72, 0.62), 'DONE', { k, color: i === 3 ? '#c8493a' : '#3f7d5c', rot: -0.1 + i * 0.05 });
    });
  });
} });

// s015 — "And your toast..." medium single, hero staring into nothing.
registerShot('s015', { draw(g, t, info) {
  const cam = { z: 1.15 - 0.05 * ease.inOut(info.p), x: 30 - 50 * info.p, y: E.H * 0.04 };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'day', view: 'street' });
  layer(g, cam, 1, (g2) => {
    const c = kitchenCounter(g2, CX + V(420, 340), GY, { w: 380 });
    toaster(g2, CX + V(560, 450), c.top, V(1.15, 1), { lever: 0.9 });
    drawHero(g2, { x: CX - V(120, 100), y: GY, s: V(3.0, 2.8), facing: 1, pose: POSES.think, expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [-0.5, -0.7], w: 4 } });
  });
  UI.badge(g, { str: '07:02', x: E.W - V(90, 70), y: V(120, 150), color: alpha(S().ui.cream, 0.8) });
} });

// s016 — "is still in the toaster." insert on the toaster with the NOT DONE badge.
registerShot('s016', { draw(g, t, info) {
  const cam = { z: 1.5 + 0.1 * ease.inOut(info.p), x: -20, y: E.H * 0.1 };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'day', view: 'street' });
  layer(g, cam, 1, (g2) => {
    const c = kitchenCounter(g2, CX, GY, { w: 420 });
    toaster(g2, CX, c.top, V(2.1, 1.85), { lever: 0.95, toast: 1 });
    g2.fillStyle = alpha('#e8dcc4', 0.5);
    for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; circle(g2, CX - 30 + i * 30, c.top - V(200, 230) - ph * V(120, 140), V(16, 14) * (0.5 + ph), alpha('#efe7d6', 0.18 * (1 - ph))); }
  });
  const k = ease.out(clamp(prog(t, 0.25, 0.55)));
  stamp(g, CX + V(300, 260), E.H * V(0.34, 0.3), V(0.95, 0.8), 'NOT DONE', { k, color: '#c98b2f' });
  UI.readout(g, { label: 'ELAPSED', value: '00:04', x: V(150, 110), y: E.H - V(150, 300), color: alpha(S().ui.cream, 0.85), size: V(48, 44) });
} });
