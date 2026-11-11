// shots/12_mrblack.js — s084–s096: act 6, Mr Black. The seductive threat.
// Motif 6 (warmth = Leo, cold = Mr Black): every shot here is rimmed cool; the ONLY warm notes are
// the red tie (MR_BLACK.color2) and the gold that belongs to the mind's own readouts.
// Screen direction for the whole act: hero camera-LEFT, Mr Black camera-RIGHT.
import { E, V, registerShot, layer, blurLayer, veil, S, mood, ease, prog, clamp, lerp, alpha, shade, rr, seg, poly, circle, ring, glow, linGrad, text, FONTS, rng, wordTime, talkAmount } from '/engine/core.js';
import { POSES, drawFigure, bigFace, breathe, walkPose } from '/engine/rig2d.js';
import { drawHero, drawHeroFace } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { city } from '../sets/city.js';
import { boardroom, longTable, pendantLamp, folder, shakyText, ledger } from '../sets/boardroom.js';
import { voidSet } from '../sets/void.js';
import { stamp, countTo, vignetteFocus } from '../sets/gfx.js';
import { MR_BLACK } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };              // the hero's deadpan (EXPR has no 'flat')
const GOLD = () => S().ui.gold;                            // gold line-art = the mind working
const BP = () => S().ui.blueprint;
const CREAM = () => S().ui.cream;
const TIE = () => MR_BLACK.color2;                         // '#8E2C2C' — the act's only warm note on Mr Black
const RED = '#c8493a';

// local-time offset (seconds into the shot) at which a spoken word lands.
const beat = (info, word, fb) => ((wordTime(word, info.shot.start) ?? info.shot.start + fb) - info.shot.start);

// Seated with arms folded: the sit rig's lower body + crossArms' forearms (s087; the table hides the thighs).
const SEAT_CROSS = {
  head: [2, -174], sh: [1, -140], hip: [0, -72],
  eF: [16, -112], hF: [-6, -120], eB: [10, -114], hB: [12, -118],
  kF: [44, -74], fF: [46, 0], kB: [40, -72], fB: [38, 0],
};

// =========================================================================
// local helpers (kept in this file; shared modules are never edited)
// =========================================================================

// A pair of shoes + trouser hems on wet pavement (s085). kind: 'oxford' (sharp suit) | 'trainer' (the hero).
function shoePair(g, x, groundY, s, kind, trouser, rimCol) {
  const oxford = kind === 'oxford';
  const upper = oxford ? '#14161d' : '#31353f';
  const sole = oxford ? '#0a0c10' : '#e6e0d2';
  const hemTop = groundY - (oxford ? 380 : 320) * s;      // long enough to be cropped out of frame
  // trouser legs running up past the top of the visible band, cuffs sitting just above the shoes
  for (const dx of [-26, 30]) {
    const fx = x + dx * s;
    seg(g, [[fx, hemTop], [fx, groundY - 34 * s]], 34 * s, trouser);
    g.fillStyle = alpha(shade(trouser, -0.3), 0.9);
    g.fillRect(fx - 17 * s, groundY - (oxford ? 122 : 100) * s, 34 * s, 8 * s);                 // cuff
  }
  // shoes, one slightly advanced like a stance
  for (const [dx, sc, toe] of [[-30, 0.96, 1], [34, 1, 1]]) {
    const sxp = x + dx * s;
    g.save(); g.translate(sxp, groundY); g.scale(sc * s, sc * s);
    g.fillStyle = upper; g.beginPath(); g.ellipse(4, -16, 44, 16, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(30, -10, 16, 10, 0, 0, 7); g.fill();
    g.fillStyle = sole; rr(g, -38, -8, 84, 9, 4); g.fill();
    if (oxford) { g.fillStyle = shade(upper, 0.16); g.beginPath(); g.ellipse(34, -14, 14, 9, 0, 0, 7); g.fill(); } // polished toe cap
    else { seg(g, [[-14, -26], [26, -22]], 6 * 0.9, '#d9d3ca'); }                                                 // trainer stripe/laces hint
    seg(g, [[-34, -30], [-6, -33]], 5, alpha(rimCol, 0.5));                                                       // cold rim catching the leather
    g.restore();
    // wet reflection smear under each shoe
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = alpha(rimCol, 0.05); g.beginPath(); g.ellipse(sxp, groundY + 16 * sc * s, 46 * sc * s, 9 * sc * s, 0, 0, 7); g.fill();
    g.restore();
  }
}

// One ledger page with a real column of numbers, one red row and a mismatched sum (s093/s094).
// The set's `ledger()` paints the paper (rows:0 = clean sheet); the typed column is this helper.
function ledgerColumn(g, t, cx, cy, s, o = {}) {
  const w = 380 * s, h = 480 * s;
  ledger(g, cx, cy, s, { rows: 0, w: 380, h: 480, paper: o.paper || '#efe8d8' });
  const inkC = alpha('#1a1c24', 0.62), sz = 30 * s;
  const rows = ['ENTRIES', '', '+  2,410,880', '+    918,240', '+  3,220,150', '−  1,907,444', '+  1,140,060'];
  rr(g, cx - w / 2 + 22 * s, cy - h / 2 + 22 * s, w - 44 * s, 52 * s, 5 * s);
  g.fillStyle = alpha('#1a1c24', 0.08); g.fill();
  text(g, 'MARKET BOOK', cx - w / 2 + 34 * s, cy - h / 2 + 48 * s, { size: 24 * s, color: inkC, font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
  const y0 = cy - h / 2 + 118 * s, dy = 46 * s;
  seg(g, [[cx + 26 * s, y0 - 30 * s], [cx + 26 * s, y0 + 4 * dy]], 2, alpha('#1a1c24', 0.22));   // column rule
  for (let i = 2; i < rows.length; i++) {
    const redRow = i === 5;
    text(g, rows[i], cx + w / 2 - 30 * s, y0 + (i - 2) * dy, {
      size: sz, color: redRow ? alpha(RED, 0.95) : alpha('#22262f', 0.9), font: FONTS.ui, weight: 900, align: 'right',
    });
    if (redRow && o.circle !== false) { const k = ease.out(clamp(prog(t, o.markAt ?? 0.2, (o.markAt ?? 0.2) + 0.25))); if (k > 0) ring(g, cx + w / 2 - 92 * s, y0 + (i - 2) * dy, 58 * s * (0.6 + 0.4 * k), 3 * s, alpha(RED, 0.75 * k)); }
  }
  seg(g, [[cx + 20 * s, y0 + 4 * dy + 22 * s], [cx + w - 24 * s, y0 + 4 * dy + 22 * s]], 3, alpha('#1a1c24', 0.4));
  const kSum = ease.out(clamp(prog(t, o.sumAt ?? 0.5, (o.sumAt ?? 0.5) + 0.3)));
  if (kSum > 0) {
    text(g, 'SIGNED', cx - w / 2 + 34 * s, y0 + 4 * dy + 62 * s, { size: 22 * s, color: alpha('#22262f', 0.7), font: FONTS.ui, weight: 900, align: 'left', spacing: 2, alpha: kSum });
    text(g, '6,025,290', cx + w / 2 - 30 * s, y0 + 4 * dy + 62 * s, { size: sz, color: alpha('#22262f', 0.95), font: FONTS.ui, weight: 900, align: 'right', alpha: kSum });
    text(g, 'ADDED UP', cx - w / 2 + 34 * s, y0 + 4 * dy + 106 * s, { size: 22 * s, color: alpha(RED, 0.85), font: FONTS.ui, weight: 900, align: 'left', spacing: 2, alpha: kSum });
    text(g, '5,717,146', cx + w / 2 - 30 * s, y0 + 4 * dy + 106 * s, { size: sz, color: alpha(RED, 0.95), font: FONTS.ui, weight: 900, align: 'right', alpha: kSum });
  }
  return { w, h, sumY: y0 + 4 * dy + 106 * s };
}

// A gold coin with a spin phase (s091 tower, s095 falling money).
function coin(g, x, y, r, ph) {
  const w = Math.max(0.12, Math.abs(Math.cos(ph)));
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, r * 2.6, GOLD(), 0.1); g.restore();
  g.fillStyle = shade(GOLD(), -0.16); g.beginPath(); g.ellipse(x, y + r * 0.26, r * w, r * 0.34, 0, 0, 7); g.fill();
  g.fillStyle = GOLD(); g.beginPath(); g.ellipse(x, y, r * w, r * 0.34, 0, 0, 7); g.fill();
  g.strokeStyle = alpha(shade(GOLD(), 0.45), 0.8); g.lineWidth = Math.max(1, r * 0.07);
  g.beginPath(); g.ellipse(x, y, r * w * 0.6, r * 0.2, 0, 0, 7); g.stroke();
}

// A rough world map on an equirectangular plate; arcs light up progressively (s090).
const LAND = {
  namex: [[0.045, 0.18], [0.14, 0.10], [0.27, 0.08], [0.30, 0.18], [0.235, 0.26], [0.245, 0.32], [0.185, 0.40], [0.13, 0.36], [0.07, 0.28]],
  salex: [[0.215, 0.46], [0.268, 0.44], [0.30, 0.52], [0.288, 0.63], [0.242, 0.84], [0.212, 0.74], [0.20, 0.56]],
  eurafrx: [[0.44, 0.17], [0.53, 0.11], [0.565, 0.19], [0.515, 0.29], [0.575, 0.32], [0.59, 0.44], [0.545, 0.62], [0.50, 0.79], [0.468, 0.67], [0.452, 0.46], [0.428, 0.32]],
  asiax: [[0.58, 0.12], [0.76, 0.07], [0.90, 0.14], [0.935, 0.27], [0.86, 0.35], [0.80, 0.48], [0.735, 0.55], [0.69, 0.43], [0.635, 0.34], [0.585, 0.25]],
  oceaax: [[0.82, 0.60], [0.885, 0.57], [0.915, 0.64], [0.885, 0.71], [0.83, 0.70]],
};
const NODES = [[0.185, 0.31], [0.248, 0.55], [0.487, 0.22], [0.535, 0.35], [0.715, 0.28], [0.855, 0.24], [0.868, 0.65]];
const ARCS = [[0, 2], [2, 4], [4, 5], [0, 3], [3, 6], [1, 2], [5, 6], [0, 4]];

function plate(g, X, Y, W, H, o = {}) {
  g.strokeStyle = alpha(BP(), o.gridA ?? 0.12); g.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) { const yy = Y + H * (i / 4); seg(g, [[X, yy], [X + W, yy]], 1.5, alpha(BP(), 0.12)); }
  for (let i = 1; i < 6; i++) { const xx = X + W * (i / 6); seg(g, [[xx, Y], [xx, Y + H]], 1.5, alpha(BP(), 0.1)); }
  rr(g, X, Y, W, H, 6); g.strokeStyle = alpha(o.frame || BP(), 0.4); g.lineWidth = 2.5; g.stroke();
}

// =========================================================================
// s084 — "Then an organization shows up."
// Wide night street: a black car at the curb under a lamp (head/tail off), the hero small and approaching.
// Camera: slow motivated push toward the car. Hero s 2.0 @ z→1.10 = 47 % frame height (wide band 42–65 %).
// =========================================================================
registerShot('s084', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.0, 1.1, p), x: lerp(-24, 30, p), y: lerp(6, -8, p) };
  const { GY, CX, M } = city(g, t, cam, {
    mood: 'night', wet: true, lit: 0.12, winLit: 0.14,
    cars: [{ x: E.W / 2 + V(560, 320), y: -V(96, 70), s: V(1.15, 0.95), color: '#05070c', head: 0, tail: 0, dir: -1 }],
  });
  const carX = CX + V(560, 320);
  layer(g, cam, 1, (h) => {
    FX.pool(h, carX + V(30, 20), GY + V(40, 30), V(260, 210), V(64, 52), M.practical, 0.13);   // lamp pool at the curb
    const s = V(2.0, 1.9);
    const hx = CX - V(680, 430) + V(280, 190) * info.p;
    drawHero(h, {
      x: hx, y: GY, s, facing: 1, pose: walkPose(t * Math.PI * 2 * 0.78),
      expr: 'thinking', rim: { color: M.rim, dir: [0.62, -0.68], w: 4 }, blink: (t % 3.7) > 3.6,
    });
    const [gx, gy] = [hx + 3 * s, GY - 208 * s];
    if (t > 0.7) FX.rings(h, gx, gy, t, { count: 2, r0: V(52, 44), r1: V(150, 128), speed: 0.55, color: M.rim, a: 0.1 });
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, carX, GY - V(100, 80), V(300, 240), M.rim, 0.05);                                   // the car drinking the lamp light
    g.restore();
  });
  UI.badge(g, { str: '23:47', x: E.W - V(90, 70), y: V(120, 190), color: alpha(CREAM(), 0.7), a: ease.out(prog(t, 0.3, 0.7)) });
  veil(g, '#050810', 0.18);
} });

// =========================================================================
// s085 — "Sharp suits."
// Insert, low camera on wet pavement: two Oxford pairs + the hero's trainers, legs cropped out of frame,
// no faces visible. Camera slides laterally across the shoes.
// =========================================================================
registerShot('s085', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const GY = E.H * V(0.8, 0.68), CX = E.W / 2;
  const cam = { z: V(2.2, 2.0), x: lerp(50, -50, p), y: GY - V(6, 10) - E.H / 2 };
  const M = mood('night');
  city(g, t, cam, { mood: 'night', wet: true, lamps: false, lit: 0.08 });
  layer(g, cam, 1, (h) => {
    // lamp light running down the wet asphalt in long vertical smears
    h.save(); h.globalCompositeOperation = 'lighter';
    for (const lx of [CX - V(300, 210), CX + V(60, 40), CX + V(400, 260)]) {
      h.fillStyle = linGrad(h, 0, GY - V(120, 110), 0, GY + V(240, 220), [alpha(M.practical, 0.06), alpha(M.practical, 0)]);
      h.fillRect(lx - V(12, 9), GY - V(120, 110), V(24, 18), V(360, 330));
    }
    h.restore();
    shoePair(h, CX - V(430, 330), GY - V(30, 20), V(1.08, 0.95), 'oxford', '#1c212c', M.rim);
    shoePair(h, CX + V(30, 16), GY + V(60, 46), V(1.28, 1.12), 'oxford', '#161a24', M.rim);
    shoePair(h, CX + V(440, 330), GY - V(10, 0), V(1.02, 0.92), 'trainer', '#d9d3ca', M.rim);   // the hero, out of place
    // a heel settles down on 'suits' — one pair lands mid-shot
    const k = ease.out(clamp(prog(t, beat(info, 'suits', 0.35) - 0.25, beat(info, 'suits', 0.35) + 0.1)));
    if (k < 1) h.save(), h.globalAlpha = 1 - k, shoePair(h, CX - V(430, 330) + V(120, 90) * (1 - k), GY - V(30, 20) - 60 * (1 - k), V(1.08, 0.95), 'oxford', '#1c212c', M.rim), h.restore();
  });
  veil(g, '#050810', 0.14);
} });

// =========================================================================
// s086 — "Soft voices."
// Medium single: Mr Black half in shadow at the head of the table, fedora, hands folded on the long table.
// One pendant overhead. Figure first, table after so the top occludes the legs. s 2.6 @ z→1.30 ≈ 75 % (medium).
// =========================================================================
registerShot('s086', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.2, 1.3, p), x: lerp(-12, 6, p), y: lerp(-30, -14, p) };
  const { GY, CX, M } = boardroom(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (h) => {
    const lampX = CX + V(40, 24);
    pendantLamp(h, lampX, GY, { len: V(520, 560), cone: V(470, 540) });
    const s = V(2.6, 2.4), bx = CX + V(150, 100);
    drawFigure(h, {
      x: bx, y: GY, s, facing: -1, outfit: MR_BLACK, pose: breathe(POSES.crossArms, t * 0.5, 0.3, 9),
      expr: 'smirk', rim: { color: M.rim, dir: [-0.32, -0.9], w: 4 },
    });
    longTable(h, CX, GY, { s: V(1.05, 0.9) });                                                   // top occludes the legs
    // the tie knot catching the pendant light — the only warm note
    const knot = [bx + 5 * s, GY - 146 * s];
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, knot[0], knot[1], V(46, 40) * ease.out(prog(t, 0.25, 0.8)), TIE(), 0.16);
    h.restore();
  });
  // "half in shadow": a cool-dark gradient pressing in from camera-left, the face only half lit
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = linGrad(g, 0, 0, E.W * 0.62, 0, [alpha('#05070d', 1), alpha('#05070d', 0)]);
  g.fillRect(0, 0, E.W * 0.62, E.H); g.restore();
  FX.dust(g, t, { count: 8, color: M.rim, a: 0.08 });
} });

// =========================================================================
// s087 — "A man named Mr. Black offers you a lab, a salary, a future."
// Two-shot across the long table: hero camera-left seated, arms crossed; Mr Black camera-right offering.
// LAB / SALARY / FUTURE callouts land on their spoken words. Screen direction holds for the whole act.
// =========================================================================
registerShot('s087', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.13, p), x: lerp(-16, 12, p), y: lerp(-16, -6, p) };
  const { GY, CX, M } = boardroom(g, t, cam, { mood: 'interiorCool' });
  const bLab = beat(info, 'lab', 0.9), bSal = beat(info, 'salary', 1.8), bFut = beat(info, 'future', 2.7);
  const sH = V(2.8, 2.6), sB = V(2.5, 2.3);
  const hx = CX - V(430, 330), bx = CX + V(430, 330);
  layer(g, cam, 1, (h) => {
    pendantLamp(h, CX, GY, { len: V(545, 610), cone: V(560, 640) });
    drawHero(h, {
      x: hx, y: GY, s: sH, facing: 1, pose: breathe(SEAT_CROSS, t * 0.45, 0.3, 2),
      expr: 'neutral', face: DEAD, rim: { color: M.rim, dir: [-0.55, -0.72], w: 4 }, blink: (t % 4.1) > 4.0, shadow: false,
    });
    drawFigure(h, {
      x: bx, y: GY, s: sB, facing: -1, outfit: MR_BLACK, pose: breathe(POSES.reach, t * 0.55, 0.35, 9),
      expr: 'smirk', talk: talkAmount(info.globalT, info.shot.start, info.shot.end),
      rim: { color: M.rim, dir: [0.4, -0.85], w: 4 }, shadow: false,
    });
    longTable(h, CX, GY, { s: V(1.45, 1.2) });                                                   // figures first, table after
    // a folder waiting on the table, exactly at the seam of the two halves
    folder(h, CX - V(30, 20), GY - V(300, 250), V(0.75, 0.65), { rot: -0.07 });
    // his offer hanging in the cold air between them
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, bx - 70 * sB, GY - 200 * sB, V(120, 100), M.rim, 0.07 * ease.out(prog(t, bLab - 0.2, bLab + 0.4)));
    h.restore();
  });
  const cy = GY - V(400, 470);
  UI.callout(g, t, { at: [bx - 78 * sB, GY - 204 * sB], to: [CX - V(120, 60), cy - V(70, 130)], str: 'A LAB', color: alpha(CREAM(), 0.85), start: bLab });
  UI.callout(g, t, { at: [bx - 78 * sB, GY - 204 * sB], to: [CX + V(60, 40), cy], str: 'A SALARY', color: alpha(CREAM(), 0.85), start: bSal });
  UI.callout(g, t, { at: [bx - 78 * sB, GY - 204 * sB], to: [CX - V(40, 20), cy + V(70, 130)], str: 'A FUTURE', color: alpha(CREAM(), 0.85), start: bFut });
  FX.dust(g, t, { count: 9, color: M.rim, a: 0.09 });
} });

// =========================================================================
// s088 — "Just solve our market models, he says."
// Void blueprint: three market-model surfaces — gold rotating mesh grids with heaved curves —
// and a SOLVE stamp landing on the word 'solve'.
// =========================================================================
registerShot('s088', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.02, 1.12, p), x: lerp(18, -14, p), y: lerp(8, -10, p) };
  const { M } = voidSet(g, t, cam, { mood: 'void', grid: 90, gridAlpha: 0.05, dust: true });
  const bSolve = beat(info, 'solve', 0.3);
  const surf = (cx, cy, S2, ph, a) => {
    const k = ease.out(clamp(prog(t, ph, ph + 0.9))); if (k <= 0) return;
    const ang = t * 0.22 + a * 1.3;                                       // slow continuous rotation of the mesh plane
    const R = Math.cos(ang), Gg = Math.sin(ang);
    g.save(); g.globalAlpha = k;
    for (let j = -5; j <= 5; j++) {                                                              // u = const lines
      const pts = [];
      for (let i = -10; i <= 10; i++) {
        const u = i / 10, v = j / 5;
        const z = 26 * Math.sin(u * 3.1 + t * 0.9 + a * 3) * Math.cos(v * 2.2 + t * 0.5);
        const x = cx + (u * R - v * 0.86 * Gg) * S2, y = cy + (u * 0.5 * Gg + v * 0.5 * R) * S2 - z * k;
        pts.push([x, y]);
      }
      seg(g, pts, 2, alpha(GOLD(), 0.4 * k));
    }
    for (let i = -5; i <= 5; i += 2) {                                                          // v = const lines
      const pts = [];
      for (let j = -10; j <= 10; j++) {
        const u = i / 10, v = j / 10;
        const z = 26 * Math.sin(u * 3.1 + t * 0.9 + a * 3) * Math.cos(v * 2.2 + t * 0.5);
        const x = cx + (u * R - v * 0.86 * Gg) * S2, y = cy + (u * 0.5 * Gg + v * 0.5 * R) * S2 - z * k;
        pts.push([x, y]);
      }
      seg(g, pts, 1.6, alpha(BP(), 0.32 * k));
    }
    const crest = [];                                                                           // the model's curve, riding the mesh
    for (let i = -10; i <= 10; i++) {
      const u = i / 10;
      const x = cx + (u * R - 0) * S2, y = cy + (u * 0.5 * Gg) * S2 - 40 * Math.sin(u * 2.4 + t * 0.8 + a * 2) * k;
      crest.push([x, y]);
    }
    g.setLineDash([10, 8]); seg(g, crest, 4, alpha(CREAM(), 0.85 * k)); g.setLineDash([]);
    g.restore();
  };
  surf(E.W * 0.3, E.H * V(0.46, 0.3), V(210, 170), 0.1, 0.2);
  surf(E.W * 0.52, E.H * V(0.4, 0.52), V(250, 190), 0.35, 1.0);
  surf(E.W * 0.72, E.H * V(0.48, 0.74), V(190, 160), 0.6, 1.9);
  const sk = ease.out(clamp(prog(info.globalT, bSolve, bSolve + 0.25)));
  if (sk > 0) stamp(g, E.W / 2, E.H * V(0.26, 0.2), V(0.85, 0.75), 'SOLVE', { k: sk, color: GOLD() });
  UI.readout(g, { label: 'MODELS', value: `${Math.min(3, Math.floor(clamp(prog(t, 0.1, 1.6)) * 4))} / 3`, x: V(150, 110), y: E.H - V(150, 300), color: GOLD(), size: V(52, 46) });
  UI.badge(g, { str: 'MARKET MODELS', x: E.W - V(90, 70), y: V(120, 190), color: alpha(CREAM(), 0.8), a: ease.out(prog(t, 0.4, 0.8)) });
} });

// =========================================================================
// s089 — "Nothing illegal. Just... profitable."
// Giant close-up: Mr Black behind dark glasses, cold rim, half in shadow.
// The red tie at his collar is the ONLY warm thing in the frame, and it catches light on "profitable".
// =========================================================================
registerShot('s089', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('interiorCool');
  blurLayer(g, 13, (g2) => boardroom(g2, t, { z: 1.5, x: -150, y: -60 }, { mood: 'interiorCool', cityLit: 0.2 }));
  veil(g, '#05070d', 0.4);
  const cx = E.W / 2 - V(30, 0), cy = E.H * V(0.56, 0.52);
  const r = V(288, 320) * (1 + 0.05 * p);
  bigFace(g, cx, cy, r, {
    outfit: MR_BLACK, expr: 'smirk', talk: talkAmount(info.globalT, info.shot.start, info.shot.end),
    look: [0.12, -0.02], rimColor: M.rim, rimSide: 1, tilt: -0.04, rimGlow: r * 0.1,
  });
  // the tie: collar knot + point between the suit lapels, bottom-centre of the frame
  g.save(); g.translate(cx, cy);
  g.fillStyle = TIE();
  poly(g, [[-r * 0.07, r * 1.05], [r * 0.07, r * 1.05], [r * 0.045, r * 1.18], [-r * 0.045, r * 1.18]]);
  poly(g, [[-r * 0.05, r * 1.24], [r * 0.05, r * 1.24], [r * 0.12, r * 1.78], [0, r * 1.95], [-r * 0.12, r * 1.78]]);
  const prof = ease.out(clamp(prog(info.globalT, beat(info, 'profitable', 1.5), beat(info, 'profitable', 1.5) + 0.4)));
  g.globalCompositeOperation = 'lighter';
  glow(g, 0, r * 1.3, r * 0.75, TIE(), 0.12 + 0.22 * prof);
  g.restore();
  // half in shadow: the dark side eats everything left of the nose
  g.save(); g.beginPath(); g.arc(cx, cy, r * 1.06, 0, 7); g.rect(cx - r * 1.9, cy + r * 0.9, r * 2, r * 0.9); g.clip();
  g.fillStyle = linGrad(g, cx - r, 0, cx + r * 0.25, 0, [alpha('#04060c', 0.66), alpha('#04060c', 0)]);
  g.fillRect(cx - r * 2, cy - r * 2, r * 3, r * 4); g.restore();
  FX.lensStreak(g, cx + r * 0.4, cy - r * 0.2, r * 1.4, alpha(CREAM(), 1), 0.08);              // a cold glint on the glasses
} });

// =========================================================================
// s090 — "You could predict every trade on Earth by lunch."
// Void data card: a world plate with trade arcs lighting up node to node and a counter running to
// 1,208,441 trades. Gold = the mind reading the board.
// =========================================================================
registerShot('s090', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.1, p), x: lerp(-14, 12, p), y: lerp(8, -8, p) };
  const { M } = voidSet(g, t, cam, { mood: 'void', grid: 84, gridAlpha: 0.05, dust: true });
  const cw = V(1400, 960), chh = V(640, 980);
  const cx0 = (E.W - cw) / 2, cy0 = (E.H - chh) / 2 - V(30, 60);
  rr(g, cx0, cy0, cw, chh, 24); g.fillStyle = S().ui.card; g.fill();
  g.strokeStyle = S().ui.cardLine; g.lineWidth = 2.5; g.stroke();
  text(g, 'GLOBAL ORDER FLOW', cx0 + 60, cy0 + 74, { size: V(40, 42), color: S().ui.text, font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
  text(g, 'BY LUNCH', cx0 + cw - 60, cy0 + 74, { size: V(26, 28), color: alpha(CREAM(), 0.6), font: FONTS.ui, weight: 900, align: 'right', spacing: 4 });
  const X = cx0 + 70, Y = cy0 + 110, W = cw - 140, H = chh - 230;
  const mapK = ease.out(prog(t, 0.1, 0.7));
  if (mapK > 0) {
    g.save(); g.globalAlpha = mapK; plate(g, X, Y, W, H, { frame: CREAM() });
    for (const [key, pts] of Object.entries(LAND)) {
      poly(g, pts.map(([u, v]) => [X + u * W, Y + v * H]), alpha(BP(), 0.16));
      g.strokeStyle = alpha(BP(), 0.5); g.lineWidth = 2;
      g.beginPath(); pts.forEach(([u, v], i) => { const x = X + u * W, y = Y + v * H; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke();
    }
    g.restore();
  }
  const arcK = clamp(prog(t, 0.35, 1.9));
  for (let i = 0; i < ARCS.length; i++) {
    const a = clamp(arcK * ARCS.length - i); if (a <= 0) continue;
    const [n1, n2] = [NODES[ARCS[i][0]], NODES[ARCS[i][1]]];
    const [x1, y1] = [X + n1[0] * W, Y + n1[1] * H];
    const [x2, y2] = [X + n2[0] * W, Y + n2[1] * H];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.22 - 30;
    const n = 20, upto = Math.max(1, Math.round(n * ease.out(a)));
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = alpha(GOLD(), 0.2); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(mx, my, x2, y2); g.stroke();
    g.strokeStyle = GOLD(); g.lineWidth = 3.5; g.shadowColor = GOLD(); g.shadowBlur = 12;
    g.beginPath(); g.moveTo(x1, y1);
    for (let j = 1; j <= upto; j++) { const u = j / n, iu = 1 - u; g.lineTo(iu * iu * x1 + 2 * iu * u * mx + u * u * x2, iu * iu * y1 + 2 * iu * u * my + u * u * y2); }
    g.stroke(); g.restore();
    circle(g, x1, y1, 5, GOLD());
    if (a > 0.95) { circle(g, x2, y2, 5, GOLD()); glow(g, x2, y2, 34, GOLD(), 0.35); }
  }
  const [nx, ny] = [X + NODES[5][0] * W, Y + NODES[5][1] * H];
  const pk = ease.out(clamp(prog(t, 0.8, 1.4)));
  if (pk > 0) { FX.rings(g, nx, ny, t, { count: 2, r0: 12, r1: 60 * pk, speed: 0.9, color: GOLD(), a: 0.4 }); }
  UI.readout(g, { label: 'TRADES READ', value: countTo(t, 0.4, 2.0, 1208441), x: cx0 + 70, y: cy0 + chh - 62, color: GOLD(), size: V(56, 50), a: pk });
  UI.badge(g, { str: 'EVERY TRADE', x: E.W - V(90, 70), y: V(120, 190), color: alpha(CREAM(), 0.8), a: ease.out(prog(t, 1.6, 2.0)) });
} });

// =========================================================================
// s091 — "You could be rich by Friday."
// Reveal: gold coins stack into a tower (growing with prog) beside a calendar that flips to FRIDAY.
// =========================================================================
registerShot('s091', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.05, 1.12, p), x: lerp(14, -10, p), y: 0 };
  const { M } = voidSet(g, t, cam, { mood: 'void', grid: 84, gridAlpha: 0.045, dust: true });
  const N = 16, rx = V(80, 66), ry = V(20, 18), gap = V(26, 22);
  const bx = E.W * V(0.3, 0.5), by = E.H * V(0.8, 0.66);
  const grow = clamp(prog(t, 0.15, 1.5));
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, bx, by - N * gap * 0.4, V(340, 300), GOLD(), 0.08 * grow); g.restore();
  for (let i = 0; i < N; i++) {
    const k = clamp(prog(grow * N, i, i + 0.8)); if (k <= 0) continue;
    const r2 = rng(910 + i), wob = (r2() - 0.5) * rx * 0.24;
    coin(g, bx + wob, by - i * gap - (1 - k) * 420, rx * k, t * 2 + i * 0.7);
  }
  UI.readout(g, { label: 'BALANCE', value: '$' + countTo(t, 0.2, 1.6, 41200000), x: bx - V(60, 40), y: E.H * V(0.88, 0.74), color: GOLD(), size: V(46, 42), align: 'left' });
  // the calendar, camera-right (portrait: below the tower)
  const calW = V(360, 330), calH = V(330, 300);
  const cx2 = E.W * V(0.68, 0.5), cy2 = E.H * V(0.42, 0.34) + (E.vertical ? calH * 0.1 : 0);
  rr(g, cx2 - calW / 2, cy2 - calH / 2, calW, calH, 12); g.fillStyle = '#efe8d8'; g.fill();
  g.strokeStyle = alpha('#1a1c24', 0.3); g.lineWidth = 3; g.stroke();
  g.fillStyle = alpha(TIE(), 0.9); g.fillRect(cx2 - calW / 2, cy2 - calH / 2, calW, calH * 0.18);               // red-week header
  for (const rxo of [-0.28, 0.28]) seg(g, [[cx2 + calW * rxo, cy2 - calH / 2 - 16], [cx2 + calW * rxo, cy2 - calH / 2 + 14]], 6, '#3d4450');
  const flip = ease.inOut(clamp(prog(info.globalT, beat(info, 'friday', 1.3), beat(info, 'friday', 1.3) + 0.45)));
  for (let r3 = 0; r3 < 4; r3++) for (let cI = 0; cI < 7; cI++) {
    const d = r3 * 7 + cI + 1;
    const fx = cx2 - calW * 0.42 + cI * (calW * 0.84 / 6), fy = cy2 - calH * 0.06 + r3 * calH * 0.2;
    if (flip > 0.5 && d > 3) continue;
    text(g, String(d), fx, fy, { size: calH * 0.1, color: alpha('#22262f', 0.75), font: FONTS.ui, weight: 700 });
  }
  if (flip > 0) {
    // the page flipping down over the grid, then FRIDAY standing alone on the new date
    const fh = calH * 0.8 * (1 - flip);
    g.save(); g.translate(cx2, cy2 - calH * 0.06); g.scale(1, Math.max(0.05, 1 - flip));
    g.fillStyle = '#e2d9c4'; g.fillRect(-calW / 2 + 8, -calH * 0.1, calW - 16, calH * 0.8);
    g.restore();
    g.fillStyle = alpha('#0b0e14', 0.25); g.fillRect(cx2 - calW / 2 + 8, cy2 - calH * 0.06 - calH * 0.1, calW - 16, fh); // curl shadow
    const kf = ease.out(clamp((flip - 0.6) / 0.4));
    if (kf > 0) {
      text(g, 'FRIDAY', cx2, cy2 + calH * 0.32, { size: V(52, 46), color: alpha(GOLD(), kf), font: FONTS.ui, weight: 900, spacing: 6, glow: 22 * kf, glowColor: alpha(GOLD(), 0.6) });
      ring(g, cx2, cy2 + calH * 0.32, V(120, 110) * (1 + (1 - kf) * 0.3), 3 * kf, alpha(GOLD(), 0.4 * kf));
      FX.sparkle(g, cx2 + V(150, 130), cy2 + calH * 0.18, 26 * kf, GOLD(), 0.5 * kf);
      FX.sparkle(g, cx2 - V(160, 140), cy2 + calH * 0.4, 20 * kf, GOLD(), 0.4 * kf);
    }
  }
  UI.badge(g, { str: 'RICH BY FRIDAY', x: E.W - V(90, 70), y: V(120, 190), color: GOLD(), a: ease.out(prog(t, 1.5, 1.85)) });
} });

// =========================================================================
// s092 — "The catch?"
// Giant close-up: the hero's eyes narrowing on the word. Cold boardroom rim; the blur of the room behind him.
// =========================================================================
registerShot('s092', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('interiorCool');
  blurLayer(g, 13, (g2) => boardroom(g2, t, { z: 1.5, x: 160, y: -50 }, { mood: 'interiorCool', cityLit: 0.22 }));
  veil(g, '#070a12', 0.32);
  const narrow = ease.out(clamp(prog(info.globalT, beat(info, 'catch', 0.1), beat(info, 'catch', 0.1) + 0.22)));
  const cx = E.W / 2 + V(30, 0), cy = E.H * V(0.6, 0.54);
  const r = V(300, 330) * (1 + 0.04 * p + 0.02 * narrow);
  drawHeroFace(g, cx, cy, r, {
    expr: 'neutral', face: { mouth: 'flat', brows: narrow > 0.5 ? 'angry' : null, eyes: 'dot' },
    look: [0.32, -0.02], blink: (t % 3.4) > 3.3, rimColor: M.rim, rimSide: -1, tilt: narrow > 0.5 ? 0.02 : 0,
  });
  if (narrow > 0.6) {
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, cx + r * 0.3, cy - r * 0.1, r * 0.9, M.rim, 0.06 * (narrow - 0.6) / 0.4);
    g.restore();
  }
  const line = 'THE CATCH?';
  const la = ease.out(clamp(prog(info.globalT, beat(info, 'catch', 0.1) + 0.15, beat(info, 'catch', 0.1) + 0.4)));
  text(g, line, E.W * V(0.5, 0.5), E.H * V(0.16, 0.14), { size: V(40, 36), color: alpha(CREAM(), 0.65 * la), font: FONTS.ui, weight: 900, spacing: 10 });
} });

// =========================================================================
// s093 — "Their numbers don't add up."
// Insert: a ledger page on the long table, typed column of numbers, one row ringed in red,
// the signed sum over the added-up total — mismatched.
// =========================================================================
registerShot('s093', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const GYw = E.H * V(0.8, 0.68);
  const sheetY = GYw - V(150, 170);
  const cam = { z: lerp(1.24, 1.33, p), x: lerp(10, -8, p), y: sheetY + V(20, 30) - E.H / 2 };
  const { GY, CX, M } = boardroom(g, t, cam, { mood: 'interiorCool' });
  layer(g, cam, 1, (h) => {
    longTable(h, CX, GY, { s: V(1.5, 1.25) });
    pendantLamp(h, CX, GY, { len: V(560, 640), cone: V(420, 500) });
    FX.pool(h, CX, GY - V(120, 150), V(420, 340), V(70, 60), '#ffe9bd', 0.1);                     // light on the page
    const s = V(1.15, 1.0);
    h.save(); h.translate(CX - V(30, 0), sheetY); h.rotate(-0.03); h.translate(-(CX - V(30, 0)), -sheetY);
    ledgerColumn(h, t, CX - V(30, 0), sheetY, s, { markAt: 0.35, sumAt: 0.7 });
    h.restore();
  });
  const ck = ease.out(clamp(prog(t, 1.0, 1.35)));
  if (ck > 0) {
    UI.callout(g, t, { at: [CX + V(120, 100), sheetY + V(150, 170)], to: [E.W * V(0.8, 0.72), E.H * V(0.2, 0.16)], str: 'MISMATCH', color: RED, start: 1.0 });
    text(g, '≠', CX + V(60, 52), sheetY + V(128, 150), { size: V(56, 50), color: alpha(RED, 0.9 * ck), font: FONTS.ui, weight: 900, glow: 16, glowColor: alpha(RED, 0.5) });
  }
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = linGrad(g, 0, 0, E.W * 0.4, 0, [alpha('#05070d', 1), alpha('#05070d', 0)]);
  g.fillRect(0, 0, E.W * 0.4, E.H); g.restore();
} });

// =========================================================================
// s094 — "You run them twice."
// Split insert: the same calculation on two ledger pages side by side; the same row rings red
// on both. The camera pans once across the pair.
// =========================================================================
registerShot('s094', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const GYw = E.H * V(0.8, 0.68);
  const sheetY = GYw - V(150, 190);
  const cam = { z: lerp(1.1, 1.22, p), x: lerp(-40, 40, p), y: sheetY + V(30, 40) - E.H / 2 };
  const { GY, CX, M } = boardroom(g, t, cam, { mood: 'interiorCool' });
  const s = V(0.95, 0.85);
  const lx = CX - V(330, 230), rx2 = CX + V(330, 230);
  layer(g, cam, 1, (h) => {
    longTable(h, CX, GY, { s: V(1.5, 1.25) });
    FX.pool(h, CX, GY - V(120, 160), V(520, 400), V(80, 66), '#ffe9bd', 0.09);
    for (const [x2, ph] of [[lx, 0], [rx2, 0.35]]) {
      const k = ease.out(clamp(prog(t, 0.1 + ph, 0.6 + ph))); if (k <= 0) continue;
      h.save(); h.globalAlpha = k;
      ledgerColumn(h, t - ph * 0.6, x2, sheetY, s, { markAt: 0.4, sumAt: 0.55, paper: '#ece4d2' });
      text(h, ph === 0 ? 'RUN 01' : 'RUN 02', x2, sheetY - V(260, 280), { size: V(26, 24), color: alpha(CREAM(), 0.6), font: FONTS.ui, weight: 900, spacing: 4 });
      h.restore();
    }
    // the divider between the two runs
    const dk = ease.out(clamp(prog(t, 0.55, 0.85)));
    if (dk > 0) {
      const x0 = CX, y0 = sheetY - V(230, 250) * dk, y1 = sheetY + V(230, 250) * dk;
      seg(h, [[x0, y0], [x0, y1]], 3, alpha(GOLD(), 0.5 * dk));
      circle(h, x0, sheetY, 7, alpha(GOLD(), 0.8 * dk));
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x0, sheetY, V(120, 100), GOLD(), 0.12 * dk); g.restore();
    }
  });
  const ek = ease.out(clamp(prog(t, 0.9, 1.15)));
  if (ek > 0) stamp(g, CX, sheetY - V(330, 360), V(0.6, 0.55), 'IDENTICAL', { k: ek, color: alpha(CREAM(), 1), rot: 0.03 });
  UI.badge(g, { str: 'SAME RED ROW', x: E.W - V(90, 70), y: V(120, 190), color: RED, a: ek });
} });

// =========================================================================
// s095 — "Real people lose their savings so the firm wins."
// High wide over the night city: rows of tiny figures (FX.crowd), gold coins falling away from
// their hands and streaming right into one dark tower with a red pilot light at its crown.
// =========================================================================
registerShot('s095', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.08, 1.0, p), x: lerp(-20, 26, p), y: -E.H * V(0.15, 0.11) };
  const GYw = E.H * V(0.8, 0.68);
  const towerX0 = E.W / 2 + V(580, 360);
  const { GY, CX, M } = city(g, t, cam, { mood: 'night', wet: true, lit: 0.1, winLit: 0.08, lamps: false, seed: 23 });
  layer(g, cam, 0.84, (h) => {
    // the dark tower, rising out of the skyline grid
    const tw = V(260, 190), topY = GY - V(720, 620), baseY = GY - V(130, 110);
    poly(h, [[towerX0 - tw / 2, baseY], [towerX0 - tw / 2 + 14, topY], [towerX0 + tw / 2 - 14, topY], [towerX0 + tw / 2, baseY]], '#03040a');
    seg(h, [[towerX0 - tw / 2 + 14, topY], [towerX0 - tw / 2, baseY]], 3, alpha(M.rim, 0.3));
    const r2 = rng(950);
    for (let yy = topY + 40; yy < baseY - 20; yy += 42) for (let xx = towerX0 - tw * 0.32; xx < towerX0 + tw * 0.32; xx += 36) {
      if (r2() < 0.55) h.fillStyle = alpha('#0e1220', 0.9);
      else if (r2() < 0.08) h.fillStyle = alpha(TIE(), 0.5);
      else h.fillStyle = alpha(M.rim, 0.08);
      h.fillRect(xx, yy, 16, 22);
    }
    circle(h, towerX0 + 6, topY - 14, 6, alpha(RED, 0.85));
    glow(h, towerX0 + 6, topY - 14, 90, RED, 0.25 + 0.12 * Math.sin(t * 2.4));
  });
  layer(g, cam, 1, (h) => {
    FX.crowd(h, t, { x: CX - V(840, 480), y: GY - V(330, 380), w: V(1200, 720), rows: 3, rowH: V(58, 50), size: V(0.8, 0.7), color: shade(M.wall, 0.08), seed: 61 });
    // the coins falling away from their hands, streaming toward the tower
    for (let i = 0; i < 26; i++) {
      const r2 = rng(700 + i);
      const ox = CX - V(800, 460) + r2() * V(1100, 660);
      const rowI = Math.floor(r2() * 3);
      const oy = GY - V(330, 380) + rowI * V(58, 50) - V(40, 36);
      const u = (t * (0.14 + r2() * 0.1) + i / 26) % 1;
      const tx = towerX0 - V(30, 20), ty = GY - V(180, 160);
      const x2 = lerp(ox, tx, u), y2 = lerp(oy, ty, ease.in(u)) - 70 * Math.sin(Math.PI * u) * (0.4 + r2() * 0.8);
      const a = u < 0.1 ? u / 0.1 : 1 - Math.max(0, (u - 0.82) / 0.18);
      if (a <= 0 || u < 0.02) continue;
      h.save(); h.globalAlpha = a; coin(h, x2, y2, V(10, 9) * (0.8 + r2() * 0.5), t * 3 + i); h.restore();
    }
  });
  UI.readout(g, { label: 'SAVINGS OUT', value: '− $' + countTo(t, 0.2, 2.6, 184000000), x: V(150, 110), y: E.H - V(150, 320), color: alpha(CREAM(), 0.75), size: V(46, 42) });
  UI.callout(g, t, { at: [towerX0, GY - V(520, 520)], to: [E.W * V(0.84, 0.8), E.H * V(0.2, 0.18)], str: 'THE FIRM', color: alpha(CREAM(), 0.85), start: 0.8 });
  veil(g, '#04060c', 0.22);
} });

// =========================================================================
// s096 — "Written across one folder, in someone's shaky hand: Pension. Last savings."
// Insert: an open folder on the table, the shaky line writing itself across the page in time with
// the spoken words. Bare, legible, cold-rimmed. The emotional turn of the act.
// =========================================================================
registerShot('s096', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const GYw = E.H * V(0.8, 0.68);
  const folderY = GYw - V(210, 240);
  const cam = { z: lerp(1.12, 1.3, ease.inOut(prog(info.p, 0.25, 1))), x: lerp(12, -6, p), y: folderY - E.H / 2 + V(10, 20) };
  const { GY, CX, M } = boardroom(g, t, cam, { mood: 'interiorCool' });
  const s = V(2.3, 2.0), fw = 240 * s, fh = 160 * s;
  const fx = CX + V(20, 0), rot = -0.06;
  const bPen = beat(info, 'pension', 2.4), bLast = beat(info, 'last', 3.6);
  layer(g, cam, 1, (h) => {
    longTable(h, CX, GY, { s: V(1.5, 1.25) });
    FX.pool(h, CX, folderY + fh * 0.4, V(520, 420), V(90, 70), '#ffe9bd', 0.08);
    // the open folder: back cover, tab, the paper, then the cover swung flat to the left
    h.save(); h.translate(fx, folderY); h.rotate(rot);
    poly(h, [[-fw / 2 - 74 * s, -fh / 2], [-fw / 2 - 6 * s, -fh / 2], [-fw / 2 - 6 * s, fh / 2], [-fw / 2 - 74 * s, fh / 2]], shade('#c9a86a', -0.22));
    h.strokeStyle = alpha(shade('#c9a86a', -0.45), 0.9); h.lineWidth = 2.5 * s;
    seg(h, [[-fw / 2 - 6 * s, -fh / 2], [-fw / 2 - 6 * s, fh / 2]]);
    h.restore();
    folder(h, fx, folderY, s, { rot, color: '#c9a86a' });
    // the shaky hand writing itself, word-synced
    h.save(); h.translate(fx, folderY); h.rotate(rot);
    const x0 = -fw / 2 + 26 * s, y0 = -fh / 2 + 52 * s;
    const size = 34 * s, lgap = 60 * s;
    const lines = ['Pension.', 'Last savings.'];
    const rA = clamp(prog(info.globalT, bPen - 0.1, bPen + 0.8));
    const rB = clamp(prog(info.globalT, bLast - 0.2, bLast + 1.1));
    for (const [li, frac] of [[0, rA], [1, rB]]) {
      if (frac <= 0) continue;
      h.save(); h.beginPath();
      h.rect(x0 - 8 * s, y0 + li * lgap - 28 * s, (lines[li].length * size * 0.62 + 16 * s) * frac, 56 * s);
      h.clip();
      shakyText(h, x0, y0, lines, { size, gap: lgap, color: '#2a2f3c', seed: 13 });
      h.restore();
    }
    h.restore();
    // the pen still faintly trembling at the end of the line being written
    const which = rA < 1 ? 0 : 1, frac = which === 0 ? rA : rB;
    if (frac > 0.02 && frac < 0.999) {
      const pw = lines[which].length * size * 0.57;
      const lx = x0 + pw * frac, ly = y0 + which * lgap;
      const px = fx + Math.cos(rot) * lx - Math.sin(rot) * ly;
      const py = folderY + Math.sin(rot) * lx + Math.cos(rot) * ly;
      circle(h, px, py, 4 * s, alpha(M.rim, 0.5));
      ring(h, px, py, 12 * s * (1 + 0.3 * Math.sin(t * 6)), 2, alpha(M.rim, 0.3));
    }
  });
  vignetteFocus(g, fx, folderY, V(560, 430), 0.5);
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = linGrad(g, 0, 0, E.W * 0.45, 0, [alpha('#05070d', 1), alpha('#05070d', 0)]);
  g.fillRect(0, 0, E.W * 0.45, E.H); g.restore();
  UI.callout(g, t, { at: [fx - V(100, 90), folderY - fh * 0.4], to: [E.W * V(0.2, 0.24), E.H * V(0.18, 0.16)], str: "SOMEONE'S HAND", color: alpha(CREAM(), 0.8), start: 0.6 });
  if (info.p > 0.8) FX.rings(g, fx, folderY, t, { count: 1, r0: V(200, 180), r1: V(320, 300), speed: 0.3, color: M.rim, a: 0.08 });
} });
