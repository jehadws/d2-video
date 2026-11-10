// shots/04_lies_chess.js — s034–s042: the "almost ready" lie, and the state champion.
import { E, V, registerShot, layer, S, mood, ease, prog, clamp, alpha, rr, seg, circle, ring, glow, text, wordTime, FONTS, lerp, blurLayer, veil, talkAmount } from '/engine/core.js';
import { POSES, drawFigure, breathe, bigFace } from '/engine/rig2d.js';
import { drawHero, drawHeroFace } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { kitchen, kitchenCounter, pan, waveRead } from '../sets/kitchen.js';
import { chessRoom, chessTable, chessBoard, chessClock } from '../sets/chess.js';
import { countTo } from '../sets/gfx.js';
import { MOM, CHAMP } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };            // the hero's deadpan (EXPR has no 'flat')
const GOLD = () => S().ui.gold;
const BP = () => S().ui.blueprint;
const CREAM = () => S().ui.cream;
const NOT_READY = '#d24a3a';                            // the red lie tag, motif 3

// The red NOT READY tag: opens (unfolds) above the bubble, then pulses.
function redTag(g, x, y, s, k, str = 'NOT READY') {
  if (k <= 0) return;
  const a = clamp(k * 1.5);
  g.save(); g.translate(x, y);
  g.scale(ease.outBack(clamp(k * 1.25)), ease.outBack(clamp(k * 1.5)));
  const w = V(320, 250) * s, h = V(72, 62) * s;
  rr(g, -w / 2, -h / 2, w, h, 10); g.fillStyle = alpha(NOT_READY, 0.92); g.fill();
  g.strokeStyle = alpha('#ffffff', 0.55 * a); g.lineWidth = 3; g.stroke();
  text(g, str, 0, 2, { size: V(34, 30) * s, color: '#fff', font: FONTS.ui, weight: 900, alpha: a, spacing: 2 });
  g.restore();
  glow(g, x, y, w * 1.15, NOT_READY, 0.22 * a);
}

// One ghost move: a gold quadratic arc drawn on between two squares, k = 0..1.
function arcMove(g, b, m, k, o = {}) {
  if (k <= 0) return;
  const pt = (f, r) => [b.x - b.half + (f + 0.5) * b.sq, b.y - b.half + (r + 0.5) * b.sq * b.tilt];
  const p0 = pt(m[0], m[1]), p1 = pt(m[2], m[3]);
  const cx = (p0[0] + p1[0]) / 2, cy = Math.min(p0[1], p1[1]) - V(56, 48);
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const u = (i / 18) * clamp(k), v = 1 - u;
    pts.push([v * v * p0[0] + 2 * u * v * cx + u * u * p1[0], v * v * p0[1] + 2 * u * v * cy + u * u * p1[1]]);
  }
  seg(g, pts, V(3.5, 3), alpha(o.color || GOLD(), 0.85));
  circle(g, p0[0], p0[1], V(6, 5), alpha(CREAM(), 0.5));
  if (k > 0.96) {
    ring(g, p1[0], p1[1], V(15, 13), 3, alpha(o.color || GOLD(), 0.95));
    glow(g, p1[0], p1[1], V(95, 80), o.color || GOLD(), 0.3);
  }
}

const NINE = [   // the nine-move drubbing, move 9 is mate
  [4, 6, 4, 4], [4, 4, 3, 3], [3, 3, 3, 1], [7, 5, 3, 1], [0, 0, 1, 2],
  [5, 0, 7, 2], [3, 1, 6, 3], [7, 2, 5, 4], [6, 3, 1, 6],
];
const SHELL = [  // the board after the game: mostly white pieces, black crushed at the king
  { f: 4, r: 0, c: 'w', t: 'K' }, { f: 3, r: 0, c: 'w', t: 'Q' }, { f: 5, r: 1, c: 'w', t: 'Q' },
  { f: 0, r: 7, c: 'w', t: 'R' }, { f: 7, r: 7, c: 'w', t: 'R' }, { f: 1, r: 5, c: 'w', t: 'N' },
  { f: 6, r: 5, c: 'w', t: 'B' }, { f: 2, r: 4, c: 'w', t: 'P' }, { f: 5, r: 4, c: 'w', t: 'P' },
  { f: 1, r: 6, c: 'b', t: 'K' }, { f: 2, r: 6, c: 'b', t: 'P' }, { f: 0, r: 5, c: 'b', t: 'P' },
];

// ---------- the lie ----------
// s034 — "Minus: you also notice every tiny lie people tell without meaning to."
// Establishing wide: evening kitchen, mom at the stove, hero in the doorway, warm window over the sink.
registerShot('s034', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.12, p), x: lerp(-28, 22, p), y: -10 };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'interiorWarm', view: 'night' });
  layer(g, cam, 0.92, (h) => {
    const c = kitchenCounter(h, CX + V(230, 170), GY, { w: 400 });
    pan(h, CX + V(60, 44), c.top, V(1.25, 1.1), { heat: 1 });
  });
  layer(g, cam, 1, (h) => {
    drawFigure(h, { x: CX - V(60, 48), y: GY, s: V(2.35, 2.2), facing: 1, outfit: MOM,
      pose: breathe(POSES.relaxed, t * 0.8, 0.7, 1), expr: 'smile', rim: { color: M.rim, dir: [0.55, -0.72], w: 4 } });
    FX.door(h, { x: CX - V(820, 690), y: GY + 2, w: V(180, 150), h: V(430, 390), open: 0.34, light: alpha(M.practical, 0.55) });
    drawHero(h, { x: CX - V(722, 618), y: GY, s: V(2.2, 2.05), facing: 1, pose: breathe(POSES.crossArms, t * 0.7, 0.5, 4),
      expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.6, -0.66], w: 4 }, blink: (t % 3.4) > 3.28 });
    FX.pool(h, CX + V(60, 44), GY + V(70, 54), V(320, 260), V(80, 60), M.practical, 0.1);
  });
  glow(g, E.W * 0.72, E.H * 0.32, V(420, 320), M.key, 0.05);   // warm spill from the window, screen space
  UI.badge(g, { str: 'LIES DETECTED: 2', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.8), a: ease.out(prog(t, 1.4, 1.9)) });
  FX.dust(g, t, { count: 16, color: '#ffdc99', a: 0.2 });
} });

// s035 — "Your mom says dinner's almost ready."
// Medium single: mom turns with a smile; the bubble forms and the red tag opens above it on "almost".
registerShot('s035', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.12, 1.18, p), x: lerp(-16, 12, p), y: lerp(-26, -12, p) };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'interiorWarm', view: 'night' });
  const tw = wordTime('almost', info.shot.start) ?? info.shot.start + 0.8;
  const bk = ease.out(prog(t, 0.1, 0.42));                     // the turn, then the bubble
  layer(g, cam, 1, (h) => {
    const c = kitchenCounter(h, CX + V(430, 350), GY, { w: 300 });
    pan(h, CX + V(430, 350), c.top, V(1.05, 0.95), { heat: 1 });
    const turn = { ...POSES.relaxed, head: [10 + 8 * bk, -206], sh: [6, -173], eB: [-2 - 10 * bk, -137], hB: [-4 - 22 * bk, -104] };
    drawFigure(h, { x: CX + V(30, 24), y: GY, s: V(2.95, 2.7), facing: bk < 0.45 ? 1 : -1,
      outfit: MOM, pose: breathe(turn, t, 0.7, 1), expr: 'smile',
      talk: talkAmount(info.globalT, tw, tw + 1.2), rim: { color: M.rim, dir: [0.5, -0.7], w: 4 } });
  });
  // her head in world space, mapped to screen so the bubble sits where the camera put it
  const z = cam.z, hwx = CX + V(30, 24) + V(14, 12), hwy = GY - 208 * V(2.95, 2.7);
  const hsx = (hwx - E.W / 2 - cam.x) * z + E.W / 2, hsy = (hwy - E.H / 2 - cam.y) * z + E.H / 2;
  const k = ease.outBack(prog(t, 0.25, 0.6));
  if (k > 0) UI.bubble(g, hsx + V(300, 210), hsy - V(60, 40), { w: V(420, 330) * k, h: V(104, 92) * k, str: 'Almost ready!' });
  const tk = prog(t, tw - info.shot.start, tw - info.shot.start + 0.3);
  redTag(g, hsx + V(190, 140), hsy - V(205, 175), V(1, 0.85), tk);
  FX.dust(g, t, { count: 12, color: '#ffdc99', a: 0.18 });
} });

// s036 — "It is not almost ready."
// Giant close-up: the hero deadpan and knowing, the red tag glowing beside the face.
registerShot('s036', { draw(g, t, info) {
  const warm = mood('interiorWarm').rim;
  blurLayer(g, 12, (h) => kitchen(h, t, { z: 1.5, x: 60, y: -40 }, { mood: 'interiorWarm', view: 'night' }));
  veil(g, '#14101a', 0.24);
  const wn = wordTime('not', info.shot.start) ?? info.shot.start + 0.35;
  const punch = ease.out(clamp(prog(info.globalT, wn, wn + 0.3)));
  const cx = E.W / 2 - V(130, 0), cy = E.H * V(0.6, 0.54);
  const r = V(300, 345) * (1 + 0.012 * t + 0.05 * punch);
  drawHeroFace(g, cx, cy, r, {
    expr: 'neutral', face: DEAD, talk: 0, blink: (t % 3.1) > 3.0,
    look: [0.2, -0.06], rimColor: warm, rimSide: -1,
  });
  glow(g, cx, cy, r * 2.3, warm, 0.05);
  const pulse = 0.85 + 0.15 * Math.sin(t * 6);
  redTag(g, E.W * 0.8, E.H * 0.3, V(1.05, 0.9) * (0.85 + 0.15 * ease.outBack(punch)), punch, 'NOT READY');
  if (punch > 0) ring(g, E.W * 0.8, E.H * 0.3, V(240, 210) * (1 + (1 - punch) * 0.5), 3 * punch, alpha(NOT_READY, 0.35 * punch));
  g.save(); g.globalAlpha = punch;
  glow(g, E.W * 0.8, E.H * 0.3, V(330, 290) * pulse, NOT_READY, 0.16 * pulse);
  g.restore();
} });

// s037 — "You know this from the pan sounds."
// Insert: an empty pan with two drops of oil on the burner; the waveform readout pinned at zero.
registerShot('s037', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.42, 1.56, p), x: lerp(14, -10, p), y: lerp(-60, -30, p) };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'interiorWarm', view: 'night' });
  layer(g, cam, 1, (h) => {
    const c = kitchenCounter(h, CX + V(240, 200), GY, { w: 380 });
    const bx = CX - V(30, 24), by = c.top + V(10, 8);
    circle(h, bx, by, V(92, 78), '#181319');
    ring(h, bx, by, V(92, 78), 5, alpha('#e0623a', 0.5));
    glow(h, bx, by, V(230, 200), '#e0623a', 0.22);
    pan(h, bx, by - V(14, 12), V(2.0, 1.8), { heat: 1 });
    for (const [dx, dy, rr2] of [[-V(38, 32), -V(34, 30), V(13, 11)], [V(26, 22), -V(40, 36), V(10, 9)]]) {
      circle(h, bx + dx, by + dy, rr2, alpha('#e8c87a', 0.85));
      circle(h, bx + dx - rr2 * 0.3, by + dy - rr2 * 0.35, rr2 * 0.35, alpha('#fff4d8', 0.75));
    }
    const k = ease.out(prog(t, 0.3, 0.7));
    const wx = CX, wy = c.top - V(300, 340);
    h.save(); h.globalAlpha = k;
    rr(h, wx - V(300, 250), wy - V(64, 56), V(600, 500), V(128, 112), 10);
    h.fillStyle = alpha('#14101c', 0.8); h.fill();
    h.strokeStyle = alpha(M.rim, 0.3); h.lineWidth = 2.5; h.stroke();
    seg(h, [[wx - V(285, 235), wy], [wx + V(285, 235), wy]], 3, alpha(GOLD(), 0.95));
    waveRead(h, wx, wy, V(560, 460), V(90, 76), t, { a: 0.02, color: alpha(GOLD(), 0.6) });
    h.restore();
    glow(h, wx, wy, V(260, 220) * k, GOLD(), 0.05 * k);
  });
  UI.readout(g, { label: 'PAN SOUND', value: '0.00', x: V(150, 110), y: E.H - V(150, 300), color: GOLD(), size: V(52, 54), a: ease.out(prog(t, 0.5, 0.9)) });
  UI.badge(g, { str: 'SILENT', x: E.W - V(110, 80), y: V(120, 190), color: NOT_READY, a: ease.out(prog(t, 0.55, 0.85)) });
  FX.dust(g, t, { count: 10, color: '#ffdc99', a: 0.16 });
} });

// ---------- the state champion ----------
// s038 — "In chess club, you beat the state champion in nine moves."
// Establishing wide: the club room, the hero facing the champion, one board and the clock between them.
registerShot('s038', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.02, 1.08, p), x: lerp(-36, 30, p), y: -10 };
  const { GY, CX, M } = chessRoom(g, t, cam, { mood: 'dusk', clearCentre: true });
  layer(g, cam, 1, (h) => {
    const lx = CX - V(330, 270), rx = CX + V(330, 270);
    drawFigure(h, { x: lx, y: GY, s: V(2.2, 2.0), facing: 1, outfit: CHAMP, pose: breathe(POSES.sit, t, 0.8, 2),
      expr: 'worried', rim: { color: M.rim, dir: [-0.55, -0.7], w: 4 }, blink: (t % 2.7) > 2.6 });
    drawHero(h, { x: rx, y: GY, s: V(2.25, 2.05), facing: -1, pose: breathe(POSES.sit, t * 0.9, 0.5, 6),
      expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [0.55, -0.7], w: 4 } });
    const tb = chessTable(h, CX + V(10, 8), GY + V(10, 8), V(2.0, 1.7), { w: 340 });
    const b = chessBoard(h, CX - V(70, 54), tb.top - V(26, 20), V(1.3, 1.1), { pieces: SHELL, tilt: 0.5 });
    chessClock(h, CX + V(250, 200), tb.top + V(2, 2), V(0.8, 0.7), { times: [t * 0.6, t] });
    chessTable(h, CX - V(640, 520), GY + V(12, 10), V(1.15, 1.0), { w: 300 });
    chessTable(h, CX + V(660, 540), GY + V(12, 10), V(1.15, 1.0), { w: 300 });
  });
  UI.badge(g, { str: 'FINAL POSITION', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.8) });
  FX.dust(g, t, { count: 18, color: '#ffe2bd', a: 0.2 });
} });

// s039 — "He stares at the board."
// Insert: the board from above, nine ghost moves replaying as gold arcs, a 9 badge in the corner.
registerShot('s039', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.24, 1.36, p), x: lerp(10, -12, p), y: lerp(E.H * 0.17, E.H * 0.13, p) };
  const { GY, CX, M } = chessRoom(g, t, cam, { mood: 'dusk', clearCentre: true });
  layer(g, cam, 1, (h) => {
    const b = chessBoard(h, CX, GY - V(6, 0), V(2.0, 1.7), { tilt: 0.42, frame: '#241a1e' });
    const dur = info.dur;
    NINE.forEach((m, i) => {
      arcMove(h, b, m, ease.out(prog(t, 0.12 + i * (dur - 0.5) / 9, 0.12 + i * (dur - 0.5) / 9 + 0.16)));
    });
    const last = ease.out(clamp(prog(t, dur - 0.35, dur - 0.1)));
    if (last > 0) glow(h, CX + V(100, 80), GY + V(40, 30), V(400, 340) * last, GOLD(), 0.1 * last);
  });
  UI.badge(g, { str: '9', x: E.W - V(120, 100), y: V(130, 200), color: GOLD(), size: V(76, 84) });
  UI.badge(g, { str: 'MOVES', x: E.W - V(120, 100), y: V(188, 252), color: alpha(CREAM(), 0.75), size: V(30, 30) });
  FX.dust(g, t, { count: 10, color: '#ffe2bd', a: 0.14 });
} });

// s040 — "How... how did you do that?"
// Giant close-up: the champion still staring down at the board, the line lip-synced.
registerShot('s040', { draw(g, t, info) {
  const rim = mood('dusk').rim;
  blurLayer(g, 13, (h) => chessRoom(h, t, { z: 1.5, x: -140, y: 180 }, { mood: 'dusk', clearCentre: true }));
  veil(g, '#100d18', 0.26);
  const cx = E.W / 2 + V(70, 0), cy = E.H * V(0.6, 0.52);
  const r = V(292, 330) * (1 + 0.012 * t);
  bigFace(g, cx, cy, r, {
    outfit: CHAMP, expr: 'awe', talk: talkAmount(info.globalT, info.shot.start, info.shot.end),
    blink: (t % 2.6) > 2.5, look: [-0.1, 0.72], rimColor: rim, rimSide: -1, tilt: 0.05,
  });
  glow(g, cx, cy, r * 2.2, rim, 0.07);
  const k = ease.out(prog(t, 0.15, 0.5));
  text(g, 'HOW DID YOU DO THAT?', E.W * V(0.17, 0.5), E.H * V(0.2, 0.15), {
    size: V(42, 40), color: alpha(CREAM(), k), font: FONTS.ui, weight: 900, align: V('left', 'center'),
    glow: 18 * k, glowColor: alpha(rim, 0.5 * k), spacing: 2,
  });
  UI.badge(g, { str: 'CHAMPION', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CHAMP.headColor, 0.95) });
  FX.rings(g, cx, cy, t, { count: 2, r0: r * 1.15, r1: r * 1.5, a: 0.12, color: rim });
} });

// s041 — "I didn't, you say."
// Medium single: the hero shrugging, hands open, flat as the kitchen tile.
registerShot('s041', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.1, 1.16, p), x: lerp(18, -10, p), y: lerp(-26, -12, p) };
  const { GY, CX, M } = chessRoom(g, t, cam, { mood: 'dusk' });
  const th = wordTime('didn', info.shot.start) ?? info.shot.start + 0.2;
  const sh = ease.out(prog(t, 0.05, 0.3));
  const OPEN = { ...POSES.shrug, eF: [30 + 6 * sh, -158], hF: [48 + 10 * sh, -172 - 8 * sh], eB: [-28 - 6 * sh, -158], hB: [-46 - 10 * sh, -172 - 8 * sh] };
  layer(g, cam, 1, (h) => {
    drawHero(h, { x: CX - V(60, 50), y: GY, s: V(3.1, 2.9), facing: 1, pose: breathe(OPEN, t, 0.5, 2),
      expr: 'neutral', face: DEAD, talk: talkAmount(info.globalT, th, th + 0.7),
      rim: { color: M.rim, dir: [0.5, -0.7], w: 4 }, blink: (t % 3.2) > 3.1 });
    const k = ease.out(prog(t, 0.5, 0.85));
    if (k > 0) {
      const hy = GY - (172 + 8) * V(3.1, 2.9);                                             // both open palms
      ring(h, CX - V(60, 50) + V(180, 168), hy, V(90, 80) * k, 2.5, alpha(GOLD(), 0.25 * k));
      ring(h, CX - V(60, 50) - V(174, 162), hy, V(90, 80) * k, 2.5, alpha(GOLD(), 0.25 * k));
    }
  });
  UI.badge(g, { str: 'DEADPAN', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.7) });
  FX.dust(g, t, { count: 12, color: '#ffe2bd', a: 0.14 });
} });

// s042 — "The board did. I just read it."
// Insert: the empty board alone, grid lines glowing and reading themselves out in blueprint light.
registerShot('s042', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.22, 1.32, p), x: lerp(-8, 10, p), y: lerp(E.H * 0.16, E.H * 0.12, p) };
  const { GY, CX, M } = chessRoom(g, t, cam, { mood: 'dusk', clearCentre: true });
  const FILES = 'ABCDEFGH'.split('');
  const READ = ['E4', 'D5', 'B7', 'F7'];
  layer(g, cam, 1, (h) => {
    const b = chessBoard(h, CX, GY - V(4, 0), V(1.9, 1.65), { tilt: 0.5 });
    const sq = b.sq, half = b.half;
    glow(h, CX, GY, V(560, 470), GOLD(), 0.09 * ease.out(prog(t, 0.2, 1.0)));
    for (let i = 0; i < 64; i++) {
      const f = i % 8, r = (i / 8) | 0, k = prog(t, 0.1 + (f + r) * 0.045, 0.55 + (f + r) * 0.045);
      if (k <= 0) continue;
      h.save(); h.translate(b.x, b.y); h.scale(1, b.tilt);
      h.strokeStyle = alpha(GOLD(), 0.5 * k); h.lineWidth = 2;
      h.strokeRect(-half + f * sq, -half + r * sq, sq, sq);
      h.restore();
    }
    for (let i = 0; i < 8; i++) {
      const k = ease.out(prog(t, 0.35 + i * 0.09, 0.6 + i * 0.09));
      if (k <= 0) continue;
      text(h, FILES[i], b.x - half + (i + 0.5) * sq, b.y + half * b.tilt + V(34, 30), { size: V(24, 22) * (0.7 + 0.3 * k), color: alpha(BP(), 0.8 * k), font: FONTS.ui, weight: 900 });
      text(h, String(i + 1), b.x - half - V(30, 26), b.y - half * b.tilt + (i + 0.5) * sq * b.tilt, { size: V(22, 20) * (0.7 + 0.3 * k), color: alpha(BP(), 0.8 * k), font: FONTS.ui, weight: 900 });
    }
    READ.forEach((cell, i) => {
      const k = ease.out(clamp(prog(t, 0.9 + i * 0.22, 1.15 + i * 0.22)));
      if (k <= 0) return;
      const f = FILES.indexOf(cell[0]), r = 8 - Number(cell[1]);
      const x = b.x - half + (f + 0.5) * sq, y = b.y - half * b.tilt + (r + 0.5) * sq * b.tilt - V(46, 40) * (1 - k);
      text(h, cell, x, y, { size: V(34, 30), color: alpha(GOLD(), k), font: FONTS.ui, weight: 900, glow: 20 * k, glowColor: alpha(GOLD(), 0.6 * k) });
      ring(h, x, y + V(46, 40) * (1 - k), V(26, 22) * k, 2, alpha(GOLD(), 0.4 * k));
    });
  });
  UI.readout(g, { label: 'MOVES READ', value: countTo(t, 0.25, 1.4, 9, { pad: 2 }), x: V(150, 110), y: E.H - V(150, 300), color: GOLD(), size: V(52, 54) });
  UI.badge(g, { str: 'CHECKMATE', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.85), a: ease.out(prog(t, 0.1, 0.4)) });
} });
