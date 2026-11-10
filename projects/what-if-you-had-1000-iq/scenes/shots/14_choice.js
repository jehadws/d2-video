// shots/14_choice.js — s115–s121: act 8, the choice. The folder goes to a reporter, the savings go home, and one joke finally lands.
// Motif 4 (three rings, then one) and motif 5 (the reward meter, dead-flat since act 4) both pay off in this act.
import {
  E, V, registerShot, layer, blurLayer, veil, S, ease, prog, clamp, lerp, alpha, shade,
  rr, seg, poly, circle, ring, glow, linGrad, text, FONTS, rng, wordTime,
} from '/engine/core.js';
import { POSES, drawFigure, breathe, blendPose, headPos } from '/engine/rig2d.js';
import { drawHero, drawHeroFace, HERO_PALETTE } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { city } from '../sets/city.js';
import { voidSet, ruleBar } from '../sets/void.js';
import { cafeteria } from '../sets/cafeteria.js';
import { folder } from '../sets/boardroom.js';
import { knocks, stamp, countTo } from '../sets/gfx.js';
import { lunchTable } from './06_cafeteria.js';
import { REPORTER } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };                  // the hero's deadpan (EXPR has no 'flat')
const GOLD = () => S().ui.gold;
const CREAM = () => S().ui.cream;
const WARM = '#ffd9a0';                                       // Leo's light: the film's only warmth
const RED = '#c8493a';
const PAP = '#efe8d8';

// local-time offset (seconds into the shot) at which a spoken word lands.
const beat = (info, word, fb) => ((wordTime(word, info.shot.start) ?? info.shot.start + fb) - info.shot.start);
// the shared lunch-table geometry, duplicated so act 5 and act 8 stay the same table
const SEAT_H = () => E.W / 2 - V(250, 210);
const SEAT_L = () => E.W / 2 + V(250, 210);
const TS = () => V(1.5, 1.35);
const FS = () => V(2.4, 2.2);
// world point of a pose's near hand, so a prop stays glued to the hand carrying it
const handOf = (p, x, y, s, f) => [x + p.hF[0] * f * s, y + p.hF[1] * s];
// how far the firm's collapse has advanced: 0 while the curve still rises, 1 once it has flatlined
const collapseK = (t, at) => ease.inOut(clamp(prog(t, at, at + 0.8)));

const easeInOut = (k) => ease.inOut(k);

// ---------- small local props ----------
function coin(g, x, y, r, ph) {
  const w = Math.max(0.14, Math.abs(Math.cos(ph)));
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, r * 2.6, GOLD(), 0.1); g.restore();
  g.fillStyle = shade(GOLD(), -0.16); g.beginPath(); g.ellipse(x, y + r * 0.26, r * w, r * 0.34, 0, 0, 7); g.fill();
  g.fillStyle = GOLD(); g.beginPath(); g.ellipse(x, y, r * w, r * 0.34, 0, 0, 7); g.fill();
  g.strokeStyle = alpha(shade(GOLD(), 0.45), 0.8); g.lineWidth = Math.max(1, r * 0.07);
  g.beginPath(); g.ellipse(x, y, r * w * 0.6, r * 0.2, 0, 0, 7); g.stroke();
}

// A returned-savings envelope, flap open or shut.
function envelope(g, x, y, s, rot, open) {
  g.save(); g.translate(x, y); g.rotate(rot);
  rr(g, -34 * s, -22 * s, 68 * s, 44 * s, 4 * s); g.fillStyle = PAP; g.fill();
  g.strokeStyle = alpha(shade(PAP, -0.5), 0.7); g.lineWidth = 2 * s; g.stroke();
  poly(g, [[-34 * s, -22 * s], [0, open ? 6 * s : -2 * s], [34 * s, -22 * s]], alpha(shade(PAP, -0.22), 0.85));
  circle(g, 0, 8 * s, 6 * s, GOLD());
  g.restore();
}

// A waiting hand, in line-art: the void has no bodies, only the people the money reaches.
function palmLine(g, x, y, s, facing, col, lift) {
  g.save(); g.translate(x, y - lift);
  g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = 7 * s;
  g.beginPath(); g.arc(0, -12 * s, 36 * s, 0.16, Math.PI - 0.16); g.stroke();
  for (let i = 0; i < 4; i++) {
    const a = 0.28 + i * 0.5, len = (30 - Math.abs(i - 1.5) * 6) * s;
    seg(g, [[Math.cos(a) * 33 * s, -12 * s + Math.sin(a) * 33 * s],
      [Math.cos(a) * (33 * s + len), -12 * s - len * 0.62]], 6 * s, col);
  }
  seg(g, [[-34 * s * facing, 4 * s], [-52 * s * facing, 26 * s]], 8 * s, col);
  g.restore();
}

// Motif 5: the reward meter. Same instrument the audience watched stay flat in act 4 — now it moves.
function meter(g, k, o = {}) {
  const x = o.x ?? V(150, 110), y = o.y ?? E.H - V(190, 340), w = o.w ?? V(560, 420), n = 20;
  text(g, 'REWARD', x, y - V(50, 54), { size: V(40, 44), color: alpha(k > 0.05 ? GOLD() : CREAM(), 0.32 + 0.6 * k), font: FONTS.ui, weight: 900, align: 'left', glow: 14 * k, glowColor: alpha(GOLD(), 0.5) });
  rr(g, x, y - 26, w, 52, 10); g.fillStyle = alpha(GOLD(), 0.05 + 0.05 * k); g.fill();
  for (let i = 0; i <= n; i++) {
    const big = i % 5 === 0, xx = x + 20 + ((w - 40) * i) / n, on = i / n <= k;
    seg(g, [[xx, y - (big ? 18 : 9)], [xx, y + (big ? 18 : 9)]], big ? 4 : 2, alpha(GOLD(), on ? 0.95 : 0.3));
  }
  if (k <= 0.02) return;
  const hx = x + 20 + (w - 40) * k;
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, hx, y, V(150, 130) * k, GOLD(), 0.34 * k); g.restore();
  seg(g, [[hx, y - 30], [hx, y + 30]], 4, alpha(CREAM(), 0.85 * k));
  text(g, '×1', x + w + V(46, 34), y, { size: V(34, 40), color: alpha(GOLD(), k), font: FONTS.ui, weight: 900, align: 'left', glow: 16, glowColor: alpha(GOLD(), 0.5) });
}

// how far a fist has dropped at this instant: 0 up, 1 on the table
const fistDip = (t, hits) => Math.max(0, ...hits.map((h) => { const k = prog(t, h - 0.17, h + 0.08); return k > 0 && k < 1 ? Math.sin(Math.PI * k) : k >= 1 ? 0 : 0; }));

// s115 — "You hand Mr. Black's folder to a reporter instead of his lab."
// Two-shot on daylight pavement, screen direction carried from act 6: hero camera-left, other party camera-right.
registerShot('s115', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.06, 1.14, p), x: lerp(26, -12, p), y: lerp(8, -6, p) };
  const { GY, CX, M } = city(g, t, cam, { mood: 'day', wet: false, lamps: false, lit: 0.04, winLit: 0.06 });
  const bFolder = beat(info, 'folder', 1.1), bRep = beat(info, 'reporter', 1.8), bLab = beat(info, 'lab', 2.9);
  const sH = V(2.6, 2.4), sR = V(2.5, 2.3);
  const hx = CX - V(260, 190), rx = CX + V(280, 200);
  const heroPose = breathe(blendPose(POSES.reach, POSES.relaxed, ease.out(clamp(prog(t, bRep + 0.35, bRep + 0.75)))), t, 0.8, 2);
  const repPose = breathe(POSES.reach, t, 0.7, 9);
  const give = ease.inOut(clamp(prog(t, bRep, bRep + 0.4)));
  const p0 = handOf(POSES.reach, hx, GY, sH, 1), p1 = handOf(POSES.reach, rx, GY, sR, -1);
  const fx = lerp(p0[0], p1[0], give), fy = lerp(p0[1], p1[1], give) - V(46, 40) * Math.sin(Math.PI * give);
  const held = handOf(repPose, rx, GY, sR, -1);
  const folderPos = give >= 1 ? [held[0], held[1] - 6 * sR] : [fx, fy];
  layer(g, cam, 1, (h) => {
    FX.pool(h, CX - V(120, 90), GY + V(96, 80), V(880, 640), V(140, 116), M.key, 0.14);          // daylight laid across the pavement
    drawHero(h, {
      x: hx, y: GY, s: sH, facing: 1, pose: heroPose, expr: 'neutral', face: DEAD,
      rim: { color: M.rim, dir: [-0.4, -0.7], w: 4 }, blink: (t % 3.9) > 3.8,
    });
    drawFigure(h, {
      x: rx, y: GY, s: sR, facing: -1, outfit: REPORTER, pose: repPose, expr: 'determined',
      rim: { color: M.rim, dir: [-0.4, -0.7], w: 4 }, blink: (t % 3.2) > 3.1,
    });
    const rh = [-9 * sR * -1 + rx, GY - 102 * sR];                                                // the reporter's far hand
    rr(h, rh[0] - 30 * sR, rh[1] - 20 * sR, 60 * sR, 40 * sR, 6 * sR); h.fillStyle = '#22262f'; h.fill();
    h.strokeStyle = alpha(CREAM(), 0.3); h.lineWidth = 2 * sR; h.stroke();
    for (const dx of [-13, 11]) {
      circle(h, rh[0] + dx * sR, rh[1] - 5 * sR, 8 * sR, '#3a4048');
      h.save(); h.translate(rh[0] + dx * sR, rh[1] - 5 * sR); h.rotate(t * (dx < 0 ? 5.4 : 4.1));
      for (let i = 0; i < 3; i++) seg(h, [[0, 0], [Math.cos(i * 2.09) * 6.4 * sR, Math.sin(i * 2.09) * 6.4 * sR]], 2 * sR, alpha(CREAM(), 0.55));
      h.restore();
    }
    const lvl = 0.35 + 0.5 * Math.abs(Math.sin(t * 6.2));
    rr(h, rh[0] - 22 * sR, rh[1] + 9 * sR, 44 * sR, 6 * sR, 3 * sR); h.fillStyle = alpha(CREAM(), 0.14); h.fill();
    h.fillStyle = alpha(GOLD(), 0.85); h.fillRect(rh[0] - 22 * sR, rh[1] + 9 * sR, 44 * sR * lvl, 6 * sR);
    circle(h, rh[0] + 22 * sR, rh[1] - 14 * sR, 3.4 * sR, RED);
    folder(h, folderPos[0], folderPos[1], V(0.62, 0.6), { rot: -0.08 + 0.16 * Math.sin(give * Math.PI), lines: ['Pension.', 'Last savings.'] });
    if (give >= 1) { glow(h, held[0], held[1], V(150, 130), GOLD(), 0.14 * ease.out(clamp(prog(t, bRep + 0.4, bRep + 0.9)))); }
    if (t > bLab) {                                                                                 // "instead of his lab": the wrong door, crossed out behind them
      const k = ease.out(clamp(prog(t, bLab, bLab + 0.4)));
      h.save(); h.globalCompositeOperation = 'lighter';
      glow(h, rx + V(300, 220), GY - V(300, 260), V(220, 190), M.rim, 0.06 * k); h.restore();
      h.setLineDash([12, 10]);
      seg(h, [[rx + V(150, 120), GY - V(30, 26)], [rx + V(430, 320), GY - V(40, 34)]], 3, alpha(CREAM(), 0.3 * k));
      h.setLineDash([]);
      seg(h, [[rx + V(386, 286), GY - V(74, 66)], [rx + V(420, 314), GY - V(40, 34)]], 4, alpha(RED, 0.75 * k));
      seg(h, [[rx + V(420, 314), GY - V(74, 66)], [rx + V(386, 286), GY - V(40, 34)]], 4, alpha(RED, 0.75 * k));
    }
  });
  const ca = ease.out(clamp(prog(t, bRep, bRep + 0.45)));
  UI.callout(g, t, { at: [rx + 20 * sR, GY - 210 * sR], to: [E.W - V(220, 190), E.H * V(0.2, 0.18)], str: 'A REPORTER', color: alpha(CREAM(), 0.85), start: bRep });
  UI.badge(g, { str: 'DAYLIGHT', x: V(120, 90), y: V(120, 190), color: alpha(M.key, 0.85), size: V(34, 40), a: ca });
  g.save(); g.globalCompositeOperation = 'lighter';
  FX.godRays(g, E.W * 0.12, -V(60, 40), { color: M.key, a: 0.05, count: 6, angle: Math.PI * 0.42, spread: 0.5, len: V(1500, 1300), soft: false });
  glow(g, E.W * 0.16, E.H * 0.1, V(420, 340), WARM, 0.1);
  g.restore();
  FX.lensStreak(g, E.W * 0.2, E.H * V(0.15, 0.12), V(560, 460), WARM, 0.16);
} });

// s116 — "The firm collapses within a week. The savings get returned."
// Void insert: the firm's curve goes up, then straight down; the money leaves the card and lands in open hands.
registerShot('s116', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.03, 1.1, p), x: lerp(-16, 12, p), y: lerp(12, -14, p) };
  const { GY, M } = voidSet(g, t, cam, { mood: 'void', grid: 78, gridAlpha: 0.05, dust: true });
  const bCollapse = beat(info, 'collapses', 1.0), bWeek = beat(info, 'week', 1.5), bSav = beat(info, 'savings', 2.2);
  const plungeAt = bCollapse + 0.34, tailAt = bCollapse + 0.55;
  const cw = V(880, 720), ch = V(360, 400);
  const cx = E.W / 2 + V(60, 0), cy = E.H * V(0.4, 0.34);
  const x0 = cx - cw / 2 + 54, x1 = cx + cw / 2 - 54, yb = cy + ch / 2 - 52, yt = cy - ch / 2 + 86;
  const xPlunge = lerp(x0, x1, 0.68);
  // the rise is drawn over v 0→1 (ending exactly at the elbow), the red plunge then falls from there
  const riseY = (v) => lerp(yb, yt, ease.inOut(clamp(v))) - Math.sin(clamp(v) * 7.4) * 7 * (1 - clamp(v));
  const streamK = ease.inOut(clamp(prog(t, bSav, bSav + 1.05)));
  const hands = [[E.W * 0.14, GY - V(30, 90), 1], [E.W * 0.87, GY - V(46, 120), -1], [E.W * 0.34, GY - V(8, 20), 1]];
  layer(g, cam, 1, (h) => {
    h.save(); h.shadowColor = 'rgba(0,0,0,.45)'; h.shadowBlur = 26; h.shadowOffsetY = 8;
    rr(h, cx - cw / 2, cy - ch / 2, cw, ch, 20); h.fillStyle = S().ui.card; h.fill(); h.restore();
    rr(h, cx - cw / 2, cy - ch / 2, cw, ch, 20);
    h.strokeStyle = alpha(collapseK(t, plungeAt) >= 1 ? RED : S().ui.cardLine, 0.75); h.lineWidth = 2.5; h.stroke();
    text(h, 'THE FIRM', cx - cw / 2 + 40, cy - ch / 2 + 50, { size: V(34, 38), color: S().ui.text, font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
    for (let i = 1; i <= 3; i++) seg(h, [[x0, lerp(yb, yt, i / 4)], [x1, lerp(yb, yt, i / 4)]], 1.5, alpha(M.rim, 0.1));
    const kR = ease.inOut(prog(t, 0.06, bCollapse));
    if (kR > 0) {
      const pts = [];
      for (let i = 0; i <= 44; i++) { const v = (i / 44) * kR; pts.push([lerp(x0, xPlunge, v), riseY(v)]); }
      h.save(); h.globalCompositeOperation = 'lighter';
      poly(h, [...pts, [pts[pts.length - 1][0], yb], [pts[0][0], yb]], alpha(GOLD(), 0.07)); h.restore();
      seg(h, pts, 5, alpha(GOLD(), 0.9));
      const tip = pts[pts.length - 1];
      circle(h, tip[0], tip[1], 7, GOLD()); glow(h, tip[0], tip[1], V(120, 100), GOLD(), 0.3 * (1 - collapseK(t, plungeAt)));
    }
    const kP = ease.in(prog(t, plungeAt, plungeAt + 0.26));
    if (kP > 0) {
      const yEnd = lerp(yt, yb + 4, kP);
      seg(h, [[xPlunge, yt], [xPlunge, yEnd]], 6, RED);
      circle(h, xPlunge, yEnd, 8, RED); glow(h, xPlunge, yEnd, V(170, 150), RED, 0.34 * kP);
      for (let i = 0; i < 7; i++) {
        const r2 = rng(1600 + i), a = -Math.PI / 2 + (r2() - 0.5) * 2.8, d = (60 + r2() * 200) * kP;
        seg(h, [[xPlunge + Math.cos(a) * d * 0.3, yEnd + Math.sin(a) * d * 0.3], [xPlunge + Math.cos(a) * d, yEnd + Math.sin(a) * d]], 2.5, alpha(RED, 0.5 * (1 - kP)));
      }
      const kp = ease.out(clamp(prog(t, plungeAt + 0.3, tailAt + 0.4)));
      if (kp > 0) { seg(h, [[xPlunge, yb + 4], [lerp(xPlunge, x1, kp), yb + 4]], 5, RED); }
    }
    const wk = collapseK(t, plungeAt);
    if (wk > 0.05) {
      h.save(); h.globalAlpha = 0.16 * wk; h.fillStyle = linGrad(h, 0, cy - ch / 2, 0, cy + ch / 2, [alpha(RED, 0), alpha(RED, 0.9)]);
      h.fillRect(cx - cw / 2 + 4, cy - ch / 2 + 4, cw - 8, ch - 8); h.restore();
    }
    if (streamK > 0) {
      for (let i = 0; i < 14; i++) {
        const r2 = rng(400 + i), ph = ((t * 0.42 + i / 14) % 1) * streamK;
        if (ph <= 0.02 || streamK <= 0) continue;
        const tgt = hands[i % 3];
        const sx = xPlunge + (r2() - 0.5) * 40, sy = yb + 4;
        const hx2 = tgt[0] + (r2() - 0.5) * 26, hy2 = tgt[1] - V(24, 20);
        const mx = (sx + hx2) / 2, my = Math.min(sy, hy2) - V(150, 190) - r2() * V(90, 120);
        const u = ph, iu = 1 - u;
        const px = iu * iu * sx + 2 * iu * u * mx + u * u * hx2, py = iu * iu * sy + 2 * iu * u * my + u * u * hy2;
        const a = clamp(u / 0.08) * (1 - clamp((u - 0.9) / 0.1));
        h.save(); h.globalAlpha = a;
        if (i % 3 === 2) coin(h, px, py, V(11, 9) * (0.8 + r2() * 0.5), t * 3 + i);
        else envelope(h, px, py, V(0.5, 0.44) * (0.85 + r2() * 0.3), (r2() - 0.5) * 0.5 + u * 2.2, 1);
        h.restore();
        if (u > 0.9) { ring(h, hx2, hy2, V(46, 40) * (1 - u) * 9, 3, alpha(GOLD(), 0.4 * (1 - u) * 9)); }
      }
    }
    for (const [px, py, f] of hands) {
      const k = ease.out(clamp(prog(t, bSav - 0.2, bSav + 0.6)));
      if (k <= 0) continue;
      h.save(); h.globalAlpha = k;
      palmLine(h, px, py, V(1.05, 0.9), f, alpha(CREAM(), 0.8), 0);
      h.restore();
    }
    ruleBar(h, x0, yb + V(34, 44), x1 - x0, { ticks: 8, color: M.rim, alpha: 0.28 });
  });
  const val = t < plungeAt ? (5.9 * ease.inOut(prog(t, 0.06, bCollapse))).toFixed(1) : (5.9 * (1 - ease.in(prog(t, plungeAt, plungeAt + 0.26)))).toFixed(1);
  UI.readout(g, { label: 'FIRM BOOK', value: '$' + val + 'B', x: cx - cw / 2 + V(60, 50), y: cy - ch / 2 + V(112, 124), color: t < plungeAt ? GOLD() : RED, size: V(52, 56), align: 'left', a: 0.4 + 0.6 * ease.out(prog(t, 0.1, 0.5)) });
  if (t > bWeek) stamp(g, cx + cw * 0.26, cy - ch * 0.62, V(0.66, 0.58), 'ONE WEEK', { k: ease.outBack(clamp(prog(t, bWeek, bWeek + 0.3))), color: RED, rot: -0.1 });
  if (t > bSav) UI.readout(g, { label: 'SAVINGS RETURNED', value: '$' + countTo(t, bSav, 1.15, 5717146), x: V(140, 110), y: E.H - V(120, 300), color: GOLD(), size: V(48, 46), align: 'left', a: ease.out(clamp(prog(t, bSav, bSav + 0.4))) });
  FX.sparkle(g, E.W * 0.14, GY - V(70, 150), V(20, 18), GOLD(), 0.5 * ease.out(clamp(prog(t, bSav + 0.7, bSav + 1.1))));
} });

// s117 — "You could have been richer than anyone alive."
// Wide in the void: the road not taken, gold and enormous on one side; he stands at the other edge, empty handed.
registerShot('s117', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.0, 1.06, p), x: lerp(24, -10, p), y: lerp(6, -4, p) };
  const { GY, CX, M } = voidSet(g, t, cam, { mood: 'void', grid: 88, gridAlpha: 0.045, dust: true });
  const bRich = beat(info, 'richer', 0.7), bAlive = beat(info, 'alive', 1.75);
  const tw = V(230, 190), th = V(620, 470), tx = CX - V(600, 360);
  const sH = V(2.2, 2.0), hx = CX + V(540, 320);
  layer(g, cam, 1, (h) => {
    const grow = ease.out(prog(t, 0.05, 1.15));
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, tx, GY - th * 0.5, V(460, 380) * grow, GOLD(), 0.11 * grow); h.restore();
    const rows = 15;
    for (let i = 0; i < rows; i++) {
      const k = clamp(prog(grow * rows, i, i + 0.85)); if (k <= 0) continue;
      const r2 = rng(910 + i), yy = GY - (i + 0.5) * (th / rows), ww = tw * (1 - 0.6 * (i / rows) ** 1.3) * k;
      const wob = (r2() - 0.5) * tw * 0.1;
      h.fillStyle = shade(GOLD(), -0.2); h.beginPath(); h.ellipse(tx + wob, yy + 8 * k, ww / 2, V(15, 13), 0, 0, 7); h.fill();
      h.fillStyle = i % 4 === 3 ? shade(GOLD(), 0.18) : GOLD(); h.beginPath(); h.ellipse(tx + wob, yy, ww / 2, V(15, 13), 0, 0, 7); h.fill();
      h.strokeStyle = alpha(shade(GOLD(), 0.5), 0.55); h.lineWidth = 2;
      h.beginPath(); h.ellipse(tx + wob, yy, ww * 0.17, V(6, 5), 0, 0, 7); h.stroke();
    }
    for (let i = 0; i < 4; i++) FX.sparkle(h, tx + (rng(33 + i)() - 0.5) * tw, GY - th * (0.3 + rng(44 + i)() * 0.6), V(20, 18), GOLD(), 0.3 + 0.2 * Math.sin(t * 2.4 + i));
    FX.pool(h, tx, GY + V(34, 28), V(420, 330), V(70, 54), GOLD(), 0.14 * grow);
    ruleBar(h, CX - V(420, 300), GY + V(10, 8), V(840, 600), { ticks: 12, color: M.rim, alpha: 0.22 });
    h.setLineDash([14, 12]);
    seg(h, [[tx + tw * 0.7, GY - 4], [hx - V(120, 90), GY - 4]], 3, alpha(CREAM(), 0.3 * grow));
    h.setLineDash([]);
    drawHero(h, {
      x: hx, y: GY, s: sH, facing: -1, pose: breathe(POSES.relaxed, t, 0.8, 2), expr: 'smirk',
      rim: { color: GOLD(), dir: [-0.4, -0.7], w: 4 }, blink: (t % 4.1) > 4.0,
    });
    const empty = handOf(POSES.relaxed, hx, GY, sH, -1);
    h.save(); h.globalAlpha = 0.42 * ease.out(clamp(prog(t, bAlive - 0.4, bAlive + 0.3)));
    h.setLineDash([8, 7]);
    rr(h, empty[0] - V(38, 32), empty[1] - V(26, 22), V(76, 64), V(52, 44), 5); h.strokeStyle = alpha(CREAM(), 0.8); h.lineWidth = 2; h.stroke();
    h.setLineDash([]); h.restore();
  });
  if (t > bRich) stamp(g, tx, GY - th - V(46, 40), V(0.8, 0.7), 'RICHER', { k: ease.outBack(clamp(prog(t, bRich, bRich + 0.3))), color: shade(GOLD(), -0.05), rot: -0.08 });
  UI.callout(g, t, { at: [hx - V(60, 50), GY - 150 * sH], to: [E.W - V(190, 170), E.H * V(0.24, 0.2)], str: 'NOTHING', color: alpha(CREAM(), 0.85), start: bAlive });
  UI.badge(g, { str: 'HE SAID NO', x: V(140, 100), y: V(120, 190), color: alpha(CREAM(), 0.7), size: V(32, 38), a: ease.out(clamp(prog(t, 0.3, 0.8))) });
} });

// s118 — "Instead, you're just... Leo's friend again, three knocks and all."
// The act-5 table, reused whole. Motif 4 lands on "knocks": exactly three taps, then one.
const HERO_SIT_SMILE = { ...POSES.sit, head: [10, -176], sh: [4, -144], hF: [40, -88], hB: [32, -88] };
const HERO_SIT_STARTLED = { ...POSES.sit, head: [-2, -186], sh: [-6, -150], eF: [20, -114], hF: [24, -96], eB: [14, -116], hB: [18, -96] };
registerShot('s118', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.02, 1.09, p), x: lerp(-20, 12, p), y: lerp(-8, -20, p) };
  const bLeo = beat(info, "Leo's", 1.45), bAgain = beat(info, 'again', 2.9), bKnocks = beat(info, 'knocks', 3.43);
  const hits = [0, 0.18, 0.36, 0.62];
  lunchTable(g, t, cam, {
    crowd: true, cheer: 0.12,
    heroExpr: t < bLeo ? 'thinking' : 'smile',
    leoExpr: t < bAgain ? 'happy' : 'smirk',
    heroPose: breathe(t < bAgain ? POSES.sit : HERO_SIT_SMILE, t, 1, 2),
    extra: (h, tb, GY) => {
      const s = TS(), fs = FS(), tapX = E.W / 2 - V(120, 100), tapY = tb.top;
      knocks(h, tapX, tapY, t, { start: bKnocks, hits, r0: V(22, 18), r1: V(210, 176), color: WARM, a: 0.72 });
      const dip = fistDip(t, hits.map((x) => bKnocks + x));
      if (t > bKnocks - 0.4 && dip >= 0 && t < bKnocks + 0.95) {
        const y = tapY - 34 * s + dip * 26 * s;
        h.save(); h.strokeStyle = HERO_PALETTE.skin; h.lineCap = 'round';
        const shx = [SEAT_H() + POSES.sit.sh[0] * fs, GY + POSES.sit.sh[1] * fs];
        seg(h, [[shx[0] + V(40, 34), shx[1] - V(10, 8)], [tapX - V(14, 12), y + 8 * s]], 15, HERO_PALETTE.skin);
        circle(h, tapX, y, 13 * s, HERO_PALETTE.skin);
        for (let i = 0; i < 3; i++) seg(h, [[tapX + (4 + i * 9) * s, y + 4 * s], [tapX + (8 + i * 9) * s, y + 13 * s]], 7 * s, HERO_PALETTE.skin);
        h.restore();
      }
      const warmK = ease.out(clamp(prog(t, bAgain, bAgain + 0.7)));
      h.save(); h.globalCompositeOperation = 'lighter';
      glow(h, E.W / 2, tapY - V(70, 60), V(560, 440) * warmK, WARM, 0.12 * warmK);
      h.restore();
      FX.rings(h, SEAT_L(), GY - V(210, 250), t, { count: 2, r0: V(46, 40), r1: V(120, 104), speed: 0.7, color: WARM, a: 0.12 * warmK });
    },
  });
} });

// s119 — "And for the first time in months, his terrible joke actually catches you off guard."
// The payoff of the film, in two word-synced beats: the smile arrives on schedule at "terrible",
// then the rise is arrested mid-way at "catches" and the surprise is finally real.
registerShot('s119', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.16, 1.24, p), x: lerp(14, -10, p), y: lerp(-14, -22, p) };
  const bMonths = beat(info, 'months', 1.1), bSchedule = beat(info, 'terrible', 1.9), bJoke = beat(info, 'joke', 2.35), bStop = beat(info, 'catches', 3.3);
  const s = FS();
  const frozen = Math.min(t, bStop);                                            // clamping t freezes the smile mid-rise
  const rise = ease.out(prog(frozen, bSchedule, bSchedule + 1.5));
  const broke = ease.out(clamp(prog(t, bStop, bStop + 0.2)));
  lunchTable(g, t, cam, {
    crowd: true, cheer: 0.06,
    heroExpr: t < bSchedule ? 'thinking' : t < bStop ? 'smile' : 'surprised',
    leoExpr: 'happy',
    heroPose: breathe(blendPose(HERO_SIT_SMILE, HERO_SIT_STARTLED, broke), t, 1, 2),
    leoPose: breathe(blendPose(POSES.holdFront, POSES.explain, ease.out(clamp(prog(t, bJoke - 0.4, bJoke + 0.2)))), t, 1.2, 4),
    extra: (h, tb, GY) => {
      const hd = headPos({ x: SEAT_H(), y: GY, s, pose: HERO_SIT_SMILE, facing: 1 });
      if (t >= bSchedule - 0.05 && t < bStop + 1.2) {                             // the schedule he was following, then the break
        const spin = (t < bStop ? t : bStop) * 1.15;
        const gap = broke * 0.5;
        h.save(); h.translate(hd[0], hd[1]); h.rotate(spin); h.setLineDash([10, 9]);
        h.strokeStyle = alpha(GOLD(), (0.5 - 0.34 * broke) * Math.min(1, rise * 2.4));
        h.lineWidth = 3;
        for (let i = 0; i < 3; i++) { h.beginPath(); h.arc(0, 0, hd[2] * 1.5, i * 2.09 + gap, i * 2.09 + 2.09 - gap * 0.4); h.stroke(); }
        h.setLineDash([]); h.restore();
      }
      if (broke > 0) {
        h.save(); h.globalCompositeOperation = 'lighter';
        glow(h, hd[0], hd[1], hd[2] * 4 * broke, WARM, 0.1 * broke); h.restore();
        ring(h, hd[0], hd[1], hd[2] * (1.6 + broke * 0.5), 3 * (1 - broke), alpha(CREAM(), 0.3 * (1 - broke)));
      }
      const lh = headPos({ x: SEAT_L(), y: GY, s, pose: POSES.sit, facing: -1 });
      FX.rings(h, lh[0], lh[1] - lh[2] * 0.2, t, { count: 2, r0: lh[2] * 1.2, r1: lh[2] * 2.2, speed: 0.9, color: WARM, a: 0.16 * ease.out(clamp(prog(t, bJoke - 0.4, bJoke))) });
      text(h, '...?', SEAT_L() + V(150, 120), GY - V(330, 400), { size: V(40, 44), color: alpha(CREAM(), 0.4 * ease.out(clamp(prog(t, bMonths + 0.6, bMonths + 1.2)))), font: FONTS.title, weight: 700, italic: true });
    },
  });
  FX.dust(g, t, { count: 22, color: WARM, a: 0.24 });
} });

// s120 — "...actually catches you off guard." (line continues)
// Giant close-up: genuine surprise, and the one meter that never moved finally spikes.
registerShot('s120', { draw(g, t, info) {
  const p = easeInOut(info.p);
  blurLayer(g, 13, (g2) => cafeteria(g2, t, { z: 1.5, x: -150, y: -60 }, { mood: 'golden', crowd: true, cheer: 0.3 }));
  veil(g, '#150f18', 0.36);
  const bGuard = beat(info, 'guard', 0.3);
  const punch = ease.out(clamp(prog(t, bGuard, bGuard + 0.22)));
  const cx = E.W / 2 + V(20, 0), cy = E.H * V(0.58, 0.54);
  const r = V(300, 336) * (1 + 0.03 * p + 0.05 * punch);
  drawHeroFace(g, cx, cy, r, {
    expr: t < bGuard ? 'surprised' : 'shocked',
    look: [0.3 + 0.16 * punch, -0.04], blink: (t % 3.6) > 3.52,
    rimColor: WARM, rimSide: 1, tilt: -0.02 - 0.02 * punch,
  });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx + r * 0.85, cy - r * 0.3, r * 1.6, WARM, 0.14 + 0.1 * punch);
  glow(g, cx, cy, r * 2.4, GOLD(), 0.04 + 0.06 * punch);
  g.restore();
  if (punch > 0) {
    ring(g, cx, cy, r * (1.08 + (1 - punch) * 0.5), 4 * punch, alpha(WARM, 0.3 * punch));
    FX.speedLines(g, t, { cx, cy, count: 18, inner: r * 1.15, a: 0.14 * (1 - punch * 0.4), color: WARM });
  }
  meter(g, ease.out(prog(t, 0.1, 0.5)));
} });

// s121 — "You laugh, right on time."
// Wide, warm afternoon: both of them laughing, trays gone cold between them.
const LAUGH_SIT = { ...POSES.sit, head: [-4, -188], sh: [-5, -150], eF: [22, -112], hF: [30, -104], eB: [16, -114], hB: [24, -106] };
registerShot('s121', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.0, 1.05, p), x: lerp(-26, 18, p), y: lerp(6, -8, p) };
  const bLaugh = beat(info, 'laugh', 0.31), bTime = beat(info, 'time', 1.55);
  const laugh = ease.out(clamp(prog(t, bLaugh, bLaugh + 0.4)));
  const bob = (seed) => breathe(LAUGH_SIT, t * 2.4 + seed, 1 + 2.6 * laugh, seed);
  lunchTable(g, t, cam, {
    crowd: true, cheer: 0.1 + 0.35 * laugh,
    heroExpr: laugh > 0.4 ? 'joy' : 'smile', leoExpr: 'joy',
    heroPose: bob(2), leoPose: bob(6),
    extra: (h, tb, GY) => {
      h.save(); h.globalCompositeOperation = 'lighter';
      glow(h, E.W / 2, tb.top - V(120, 140), V(700, 520) * laugh, WARM, 0.16 * laugh);
      h.restore();
      for (let i = 0; i < 3; i++) {
        const r2 = rng(800 + i), k = prog(t, bLaugh + 0.2 + i * 0.24, bLaugh + 1.1 + i * 0.24);
        if (k <= 0 || k >= 1) continue;
        text(h, 'ha', SEAT_H() + V(60, 48) + (r2() - 0.5) * V(70, 60) + i * V(16, 12), GY - V(300, 360) - k * V(150, 180), {
          size: V(34, 38) * (0.8 + r2() * 0.5), color: alpha(WARM, 0.5 * (1 - k)), font: FONTS.serif, weight: 900, italic: true,
        });
      }
      FX.rings(h, E.W / 2, tb.top - V(60, 60), t, { count: 2, r0: V(60, 50), r1: V(230, 190), speed: 0.6, color: WARM, a: 0.1 * laugh });
    },
  });
  g.save(); g.globalCompositeOperation = 'lighter';
  FX.godRays(g, E.W * 0.82, E.H * 0.16, { color: WARM, a: 0.05 + 0.03 * laugh, count: 6, angle: Math.PI * 0.55, spread: 0.7, len: V(1400, 1200) });
  g.restore();
  UI.badge(g, { str: 'RIGHT ON TIME', x: V(150, 110), y: E.H - V(130, 320), color: alpha(WARM, 0.8), size: V(32, 38), a: ease.out(clamp(prog(t, bTime - 0.2, bTime + 0.3))) });
} });
