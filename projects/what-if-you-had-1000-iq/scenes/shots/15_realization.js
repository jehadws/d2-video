// shots/15_realization.js — s122–s128: act 9, is any of this real. The film steps out of the story and audits its own number.
import {
  E, V, registerShot, layer, blurLayer, veil, S, ease, prog, clamp, lerp,
  alpha, shade, rr, seg, poly, circle, ring, glow, text, FONTS, rng, wordTime,
} from '/engine/core.js';
import { POSES, drawFigure, breathe, blendPose, posesAt } from '/engine/rig2d.js';
import { drawHeroFace } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { voidSet, ruleBar } from '../sets/void.js';
import { lab } from '../sets/lab.js';
import { bedroom } from '../sets/bedroom.js';
import { stamp } from '../sets/gfx.js';
import { SCIENTISTS } from '../cast.js';

const GOLD = () => S().ui.gold;
const CREAM = () => S().ui.cream;
const WARM = '#ffd9a0';
const BP = () => UI.bpStroke();

// local-time offset (seconds into the shot) at which a spoken word lands.
const beat = (info, word, fb) => ((wordTime(word, info.shot.start) ?? info.shot.start + fb) - info.shot.start);

const easeInOut = (k) => ease.inOut(k);

// ---------- act props ----------
// The IQ ruler this act keeps dissecting: 0→300, ticks every 50, labels every 100.
const scaleGeo = () => {
  const x0 = E.W * V(0.14, 0.1), x1 = E.W * V(0.78, 0.7), y = E.H * V(0.62, 0.6);
  return { x0, x1, y, w: x1 - x0 };
};
const scaleVal = (S2, v) => S2.x0 + S2.w * (v / 300);

function iqScale(g, S2, o = {}) {
  const c = alpha(BP(), 0.85), k = o.draw ?? 1;
  if (k <= 0) return;
  const xEnd = lerp(S2.x0, S2.x1, k);
  seg(g, [[S2.x0, S2.y], [xEnd, S2.y]], 4, c);
  for (let v = 0; v <= 300; v += 50) {
    const x = scaleVal(S2, v); if (x > xEnd + 1) continue;
    const big = v % 100 === 0;
    seg(g, [[x, S2.y], [x, S2.y - (big ? 34 : 18)]], big ? 3 : 2, c);
    if (big) text(g, String(v), x, S2.y + 52, { size: V(38, 42), color: alpha(BP(), 0.9), font: FONTS.ui, weight: 900, alpha: clamp((k - (v / 300) * 0.9) * 8) });
  }
  if (o.snap !== undefined && o.snap > 0) {
    text(g, '300', scaleVal(S2, 300), S2.y + 52, { size: V(38, 42), color: alpha(BP(), 0.9), font: FONTS.ui, weight: 900 });
  }
  // the hard edge of the instrument: a wall at 300, "you may not read past here"
  if (k >= 1) {
    const a = o.capA ?? 1;
    seg(g, [[S2.x1 + 10, S2.y - 56], [S2.x1 + 10, S2.y + 56]], 5, alpha(GOLD(), 0.55 * a));
    text(g, 'SCALE ENDS', S2.x1 - 8, S2.y - 84, { size: V(28, 34), color: alpha(GOLD(), 0.6 * a), font: FONTS.ui, weight: 900, align: 'right', spacing: 2 });
  }
}

// One half of the snapped ruler, rigid from (x, y) at angle rot.
function scaleHalf(g, x, y, rot, len, dir, o = {}) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const c = alpha(BP(), 0.85);
  seg(g, [[0, 0], [dir * len, 0]], 4, c);
  for (let v = 0; v <= len; v += 50) {
    const big = Math.round(v / 50) % 2 === 0;
    seg(g, [[dir * v, 0], [dir * v, -(big ? 30 : 16)]], big ? 3 : 2, c);
  }
  g.restore();
}

// Jagged edge where the ruler broke.
function crack(g, x, y, h, a) {
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push([x + ((i % 2) - 0.5) * h * 0.5, y - h / 2 + (h * i) / 6]);
  g.save(); g.globalAlpha = a; seg(g, pts, 3.5, alpha(CREAM(), 0.7)); g.restore();
}

// Blueprint brain glyph: lobed circle with folds.
function brainGlyph(g, x, y, r, c, a = 1) {
  g.save(); g.globalAlpha = a;
  ring(g, x, y, r, 3.5, c);
  for (const [dx, dy, br] of [[-0.42, -0.3, 0.32], [0.18, -0.5, 0.3], [0.5, -0.05, 0.28], [-0.28, 0.32, 0.26]]) {
    ring(g, x + dx * r, y + dy * r, br * r, 2.5, alpha(c, 0.8));
  }
  seg(g, [[x, y - r], [x, y + r]], 2.5, alpha(c, 0.6));
  g.restore();
}

// ---------- shots ----------

// s122 — "Is any of this real?"
// Chapter line over the blueprint void: the question, nothing else.
registerShot('s122', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.0, 1.05, p), x: lerp(18, -12, p), y: lerp(4, -6, p) };
  voidSet(g, t, cam, { mood: 'void', grid: 84, gridAlpha: 0.045, dust: true, glow: false });
  layer(g, cam, 1, (h) => {
    ruleBar(h, E.W * 0.2, E.H * 0.82, E.W * 0.6, { ticks: 12, color: BP(), alpha: 0.22 });
    h.setLineDash([12, 10]);
    seg(h, [[E.W * 0.3, E.H * 0.24], [E.W * 0.7, E.H * 0.24]], 2, alpha(BP(), 0.16));
    h.setLineDash([]);
  });
  UI.bigLine(g, t, { str: 'IS ANY OF THIS REAL?', dur: info.shot.end - info.shot.start, y: E.H * V(0.5, 0.46), size: V(96, 88), color: GOLD() });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, E.W / 2, E.H * 0.5, V(620, 480), GOLD(), 0.07);
  g.restore();
} });

// s123 — "Nobody has ever scored anywhere near one thousand on an IQ test..."
// Blueprint: the scale draws itself only to 300; "one thousand" lives far past its edge, as a dashed dare.
registerShot('s123', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.02, 1.08, p), x: lerp(-16, 14, p), y: lerp(10, -8, p) };
  const { M } = voidSet(g, t, cam, { mood: 'void', grid: 84, gridAlpha: 0.055, dust: true });
  const G = scaleGeo();
  const bNobody = beat(info, 'Nobody', 0.3), bThousand = beat(info, 'thousand', 2.2), bTest = beat(info, 'test', 3.5);
  const drawK = ease.inOut(prog(t, bNobody + 0.1, bThousand - 0.25));
  const dashK = ease.out(clamp(prog(t, bThousand, bThousand + 0.9)));
  layer(g, cam, 1, (h) => {
    iqScale(h, G, { draw: drawK, capA: ease.out(clamp(prog(t, bThousand - 0.4, bThousand))) });
    if (dashK > 0) {
      const x0 = G.x1 + 34, x1 = E.W * V(0.86, 0.8);
      const ex = lerp(x0, x1, dashK);
      h.save(); h.setLineDash([16, 12]);
      seg(h, [[x0, G.y], [ex, G.y]], 3.5, alpha(GOLD(), 0.75));
      h.setLineDash([]); h.restore();
      if (dashK > 0.9) {
        poly(h, [[ex, G.y - 16], [ex, G.y + 16], [ex + 26, G.y]], alpha(GOLD(), 0.8));
        text(h, '1000', E.W - V(150, 120), G.y - V(58, 70), { size: V(56, 62), color: alpha(GOLD(), 0.9), font: FONTS.ui, weight: 900, align: 'right', glow: 20, glowColor: alpha(GOLD(), 0.5) });
        text(h, 'OFF SCALE', E.W - V(140, 120), G.y + V(66, 76), { size: V(26, 30), color: alpha(CREAM(), 0.55), font: FONTS.ui, weight: 900, align: 'right', spacing: 2 });
      }
    }
  });
  UI.callout(g, t, { at: [G.x0 + G.w * 0.02, G.y - 30], to: [V(430, 360), E.H * 0.3], str: 'EVERY REAL TEST', color: alpha(BP(), 0.9), start: bTest - 0.9 });
  UI.badge(g, { str: 'MAX ≈ 300', x: V(470, 400), y: V(120, 190), color: alpha(CREAM(), 0.75), size: V(34, 40), a: ease.out(clamp(prog(t, 1.0, 1.6))) });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, G.x1 + 30, G.y, V(220, 180) * dashK, M.key, 0.08 * dashK);
  g.restore();
} });

// s124 — "the scale basically stops making sense that high."
// The same ruler snaps in the middle; the gap fills with question marks.
registerShot('s124', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.06, 1.0, p), x: lerp(12, -16, p), y: lerp(-6, 10, p) };
  voidSet(g, t, cam, { mood: 'void', gridAlpha: 0.05, dust: true });
  const G = scaleGeo();
  const bStops = beat(info, 'stops', 0.8), bSense = beat(info, 'sense', 1.5), bHigh = beat(info, 'high', 2.1);
  const snap = ease.outBack(clamp(prog(t, bStops, bStops + 0.4)));
  const mid = lerp(G.x0, G.x1, 0.55), gap = snap * V(150, 120);
  const halfL = (mid - G.x0), halfR = (G.x1 - mid);
  layer(g, cam, 1, (h) => {
    scaleHalf(h, mid - gap / 2, G.y + snap * 26, snap * 0.06, halfL, -1);
    scaleHalf(h, mid + gap / 2, G.y - snap * 26, snap * 0.06, halfR, 1);
    crack(h, mid - gap / 2, G.y, V(80, 66) * clamp(snap * 1.4), clamp(snap * 2));
    crack(h, mid + gap / 2, G.y, V(80, 66) * clamp(snap * 1.4), clamp(snap * 2));
    const qs = ['?', '?', '?'];
    for (let i = 0; i < 3; i++) {
      const k = ease.out(clamp(prog(t, bSense + i * 0.22, bSense + 0.5 + i * 0.22)));
      if (k <= 0) continue;
      const r2 = rng(700 + i);
      text(h, qs[i], mid + (r2() - 0.5) * gap * 1.4, G.y - V(120, 150) - i * V(46, 40) - (1 - k) * 30 + Math.sin(t * 1.8 + i) * 8, {
        size: V(60, 66) * (0.7 + r2() * 0.6), color: alpha(GOLD(), 0.85 * k), font: FONTS.title, weight: 900, italic: true, glow: 18 * k, glowColor: alpha(GOLD(), 0.4),
      });
    }
  });
  UI.callout(g, t, { at: [mid, G.y], to: [E.W * 0.86, E.H * V(0.28, 0.24)], str: 'MEANINGLESS', color: alpha(CREAM(), 0.85), start: bHigh - 0.4 });
  if (t > bStops) stamp(g, mid, G.y - V(240, 300), V(0.7, 0.62), 'SNAP', { k: ease.out(clamp(prog(t, bStops, bStops + 0.3))), color: shade(GOLD(), -0.1), rot: -0.08 });
} });

// s125 — "The highest ever recorded, by most estimates, sits closer to two hundred."
// Data card: the counter climbs and settles at ≈200 — the honest end of the ruler.
registerShot('s125', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.0, 1.04, p), x: lerp(-10, 12, p), y: lerp(6, -6, p) };
  voidSet(g, t, cam, { mood: 'void', gridAlpha: 0.04, dust: false, glow: false });
  const bRec = beat(info, 'recorded', 0.6), bEst = beat(info, 'estimates', 1.8), bHundred = beat(info, 'hundred', 3.2);
  const dur = info.shot.end - info.shot.start;
  UI.dataCard(g, t, {
    title: 'HIGHEST EVER RECORDED', subtitle: 'BY MOST ESTIMATES',
    from: 0, to: 200, decimals: 0, unit: '', shape: 1.5,
    start: bRec + 0.2, dur: Math.max(0.8, bHundred + 0.4 - bRec - 0.2), total: dur,
    labels: [[0, null], [1, '≈ 200']],
  });
  const askA = ease.out(clamp(prog(t, bEst, bEst + 0.5)));
  if (askA > 0) {
    text(g, 'THE FILM ASKS ABOUT', V(150, 110), E.H - V(168, 344), { size: V(24, 28), color: alpha(CREAM(), 0.5 * askA), font: FONTS.ui, weight: 900, align: 'left', spacing: 2 });
    text(g, '1000', V(150, 110), E.H - V(112, 292), { size: V(52, 56), color: alpha(CREAM(), 0.75 * askA), font: FONTS.ui, weight: 900, align: 'left', glow: 14, glowColor: alpha(CREAM(), 0.3) });
  }
  if (t > bHundred) {
    const k = ease.out(clamp(prog(t, bHundred, bHundred + 0.35)));
    UI.badge(g, { str: '×2, NOT ×10', x: E.W - V(140, 100), y: E.H - V(120, 300), color: alpha(GOLD(), 0.8), size: V(34, 40), a: k });
  }
} });

// s126 — "And real intelligence was never just raw calculation. It's judgment. It's knowing what matters."
// Blueprint balance: a brain on one pan; "judgment" and "what matters" drop in and take the win.
registerShot('s126', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.0, 1.07, p), x: lerp(14, -14, p), y: lerp(4, -12, p) };
  const { GY, CX, M } = voidSet(g, t, cam, { mood: 'void', gridAlpha: 0.05, dust: true });
  const bCalc = beat(info, 'calculation', 1.3), bJudge = beat(info, 'judgment', 2.9), bMatters = beat(info, 'matters', 4.6);
  const arm = V(400, 310), postH = V(330, 300), panR = V(150, 122);
  const pivot = [CX, GY - postH];
  // the beam: calculation starts heavier (it was the only thing on), then the two weights out-tilt it
  const tiltCalc = ease.inOut(clamp(prog(t, 0.2, bCalc))) * 0.14;
  const tiltJudge = ease.inOut(clamp(prog(t, bJudge, bJudge + 0.6))) * -0.16;
  const tiltMatters = ease.inOut(clamp(prog(t, bMatters, bMatters + 0.7))) * -0.14;
  const tilt = tiltCalc + tiltJudge + tiltMatters;
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  const lp = [pivot[0] - arm * cos, pivot[1] + arm * sin];
  const rp = [pivot[0] + arm * cos, pivot[1] - arm * sin];
  const drop = (bAt, fromY) => {
    const k = ease.in(clamp(prog(t, bAt - 0.5, bAt)));
    return { k, y: lerp(fromY, 0, k), a: clamp(k * 3) };
  };
  const j1 = drop(bJudge, -V(420, 460));
  const j2 = drop(bMatters, -V(420, 460));
  layer(g, cam, 1, (h) => {
    const c = alpha(BP(), 0.85);
    // post + beam
    seg(h, [[CX, GY], [pivot[0], pivot[1]]], 5, c);
    poly(h, [[CX - 70, GY], [CX + 70, GY], [CX, GY - 60]], alpha(c, 0.5));
    seg(h, [[lp[0], lp[1]], [rp[0], rp[1]]], 5, c);
    circle(h, pivot[0], pivot[1], 9, c);
    // pans hang plumb from the beam ends
    for (const [px, py] of [lp, rp]) {
      for (const dx of [-panR * 0.62, 0, panR * 0.62]) seg(h, [[px, py], [px + dx * 0.4, py + 74]], 2.5, alpha(c, 0.7));
      g.save();
      h.beginPath(); h.arc(px, py + 84, panR, 0, Math.PI); h.closePath();
      h.strokeStyle = c; h.lineWidth = 4; h.stroke();
      h.restore();
    }
    // left: the calculating brain, already there
    brainGlyph(h, lp[0], lp[1] + 46, V(74, 62), c, 1);
    text(h, 'CALC', lp[0], lp[1] + 122, { size: V(26, 30), color: alpha(c, 0.85), font: FONTS.ui, weight: 900, align: 'center', spacing: 2 });
    const tick = ease.out(clamp(prog(t, bCalc - 0.2, bCalc + 0.3)));
    if (tick > 0) for (let i = 0; i < 3; i++) {
      const ph = (t * 1.4 + i / 3) % 1;
      ring(h, lp[0], lp[1] + 46, V(74, 62) + ph * V(60, 50), 2, alpha(c, 0.4 * (1 - ph) * tick));
    }
    // right: the two weights
    const block = (x, y, w, s, label, col, a) => {
      h.save(); h.globalAlpha = a;
      rr(h, x - w / 2, y - s / 2, w, s, 8); h.fillStyle = alpha(col, 0.16); h.fill();
      h.strokeStyle = col; h.lineWidth = 3.5; h.stroke();
      text(h, label, x, y, { size: V(24, 28), color: col, font: FONTS.ui, weight: 900, align: 'center' });
      h.restore();
    };
    const rw = V(300, 250);
    if (j1.k > 0) block(rp[0], rp[1] + 110 + j1.y, rw, V(64, 56), 'JUDGMENT', GOLD(), clamp(j1.a));
    if (j2.k > 0) block(rp[0], rp[1] + 110 + j2.y + (j1.k >= 1 ? V(70, 62) : 0), rw, V(64, 56), 'WHAT MATTERS', GOLD(), clamp(j2.a));
    if (j2.k > 0 && j2.k < 1) FX.speedLines(h, t, { cx: rp[0], cy: rp[1] + 120, count: 10, inner: V(70, 60), a: 0.2 * (1 - j2.k), color: GOLD() });
    ruleBar(h, CX - V(420, 320), GY + V(10, 8), V(840, 640), { ticks: 12, color: M.rim, alpha: 0.22 });
  });
  if (t > bMatters + 0.6) {
    const k = ease.out(clamp(prog(t, bMatters + 0.6, bMatters + 1.0)));
    FX.pool(g, rp[0], GY + V(24, 20), V(360, 100), V(110, 90), GOLD(), 0.14 * k);
    text(g, 'IT WAS NEVER JUST MATH', E.W / 2, E.H * V(0.2, 0.17), { size: V(34, 38), color: alpha(CREAM(), 0.7 * k), font: FONTS.ui, weight: 900, align: 'center', spacing: 3 });
  }
} });

// s127 — "Scientists still argue over what IQ even measures, and whether any number could capture a mind completely."
// Lab wide: three coats, one number line none of them agree on, a question cloud presiding over all of it.
registerShot('s127', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const cam = { z: lerp(1.0, 1.06, p), x: lerp(-18, 14, p), y: lerp(6, -10, p) };
  const { GY, CX, M } = lab(g, t, cam, { mood: 'interiorCool' });
  const bArgue = beat(info, 'argue', 0.8), bMeasures = beat(info, 'measures', 2.1), bNumber = beat(info, 'number', 3.3), bMind = beat(info, 'mind', 4.8);
  const s = V(1.5, 1.35);
  const seats = [
    { x: CX - V(430, 350), facing: 1, keys: [[0, 'talk'], [1.6, 'point'], [3.4, 'explain']], expr: 'determined', seed: 2 },
    { x: CX + V(430, 350), facing: -1, keys: [[0, 'crossArms'], [1.9, 'explain'], [3.6, 'point']], expr: 'thinking', seed: 7 },
    { x: CX + V(60, 40), facing: 1, keys: [[0, 'shrug'], [2.2, 'pointUp'], [4.0, 'talk']], expr: 'neutral', seed: 12 },
  ];
  const nx = CX, ny = GY - V(150, 130);
  layer(g, cam, 1, (h) => {
    // the contested number line, chalked between them
    const k = ease.out(clamp(prog(t, bNumber - 0.6, bNumber + 0.4)));
    if (k > 0) {
      const x0 = nx - V(330, 270) * k, x1 = nx + V(330, 270) * k;
      h.save(); h.globalAlpha = 0.9;
      seg(h, [[x0, ny], [x1, ny]], 4, alpha(CREAM(), 0.7));
      for (let v = 0; v <= 4; v++) {
        const x = lerp(x0, x1, v / 4);
        seg(h, [[x, ny - 14], [x, ny + 14]], 3, alpha(CREAM(), 0.6));
        text(h, ['70', '100', '130', '160', '190'][v], x, ny + 44, { size: V(24, 28), color: alpha(CREAM(), 0.55), font: FONTS.ui, weight: 900, align: 'center' });
      }
      h.restore();
      // three disagreeing readings, one per coat
      for (let i = 0; i < 3; i++) {
        const kk = ease.out(clamp(prog(t, bMeasures + 0.3 + i * 0.3, bMeasures + 0.9 + i * 0.3)));
        if (kk <= 0) continue;
        const x = lerp(x0, x1, [0.3, 0.62, 0.15][i]);
        ring(h, x, ny, V(30, 26) * kk, 3, alpha(GOLD(), 0.75 * kk));
      }
    }
    for (const st of seats) {
      const pose = breathe(posesAt(t, st.keys.map(([tt, pp]) => [tt + bArgue * 0.4, POSES[pp]]), 0.4), t * 1.3, 0.9, st.seed);
      drawFigure(h, {
        x: st.x, y: GY, s, facing: st.facing, outfit: SCIENTISTS[seats.indexOf(st)],
        pose, expr: t < bArgue ? 'neutral' : st.expr,
        rim: { color: M.rim, dir: [-0.4, -0.7], w: 4 },
        blink: ((t + st.seed) % 3.3) > 3.2,
      });
    }
  });
  // argument bubbles pop over the coats
  for (let i = 0; i < 3; i++) {
    const st = seats[i];
    const at = bArgue + 0.3 + i * 0.55;
    const kk = ease.outBack(clamp(prog(t, at, at + 0.25)));
    if (kk <= 0) continue;
    g.save(); g.translate(st.x, GY - s * 250 - i * 18); g.scale(kk, kk);
    UI.bubble(g, 0, 0, { w: V(96, 84), h: V(52, 46), color: alpha(CREAM(), 0.85) });
    g.restore();
  }
  UI.callout(g, t, { at: [nx, ny], to: [E.W - V(560, 480), E.H * V(0.32, 0.27)], str: 'EVERYONE\'S GUESS', color: alpha(GOLD(), 0.9), size: V(30, 34), start: bMeasures });
  // the question cloud: a mind none of the numbers hold
  const kc = ease.out(clamp(prog(t, bMind, bMind + 0.7)));
  if (kc > 0) {
    const qx = CX, qy = E.H * V(0.2, 0.16);
    g.save(); g.globalAlpha = kc;
    for (const [dx, dy, r] of [[-120, 10, 60], [-40, -24, 74], [50, -14, 66], [120, 12, 54], [0, 26, 70]]) {
      ring(g, qx + dx * V(1, 0.82), qy + dy * V(1, 0.82), r * V(1, 0.82), 3, alpha(BP(), 0.55));
    }
    text(g, '?', qx, qy, { size: V(96, 110), color: alpha(GOLD(), 0.9 * kc), font: FONTS.title, weight: 900, italic: true, glow: 24, glowColor: alpha(GOLD(), 0.5) });
    g.restore();
    FX.rings(g, qx, qy, t, { count: 2, r0: V(150, 130), r1: V(300, 250), speed: 0.5, color: M.rim, a: 0.1 * kc });
  }
} });

// s128 — "So could a mind really get that fast... and still stay kind?"
// Giant close-up, the act's verdict: warm rim, quiet eyes, the question read inward. On "kind" the face softens by one degree.
registerShot('s128', { draw(g, t, info) {
  const p = easeInOut(info.p);
  const bFast = beat(info, 'fast', 1.6), bKind = beat(info, 'kind', 3.4);
  blurLayer(g, 13, (g2) => bedroom(g2, t, { z: 1.45, x: -130, y: -50 }, { mood: 'night', fan: false, equations: false }));
  veil(g, '#120e18', 0.4);
  const soft = ease.out(clamp(prog(t, bKind, bKind + 0.5)));
  const cx = E.W / 2 - V(24, 0), cy = E.H * V(0.58, 0.54);
  const r = V(300, 336) * (1 + 0.03 * p + 0.02 * soft);
  drawHeroFace(g, cx, cy, r, {
    expr: t < bKind ? 'thinking' : 'smile',
    look: [lerp(0.32, 0.02, soft), lerp(-0.1, -0.02, soft)],
    blink: (t % 4.2) > 4.1 || (t > bFast - 0.15 && t < bFast + 0.1),
    rimColor: WARM, rimSide: 1, tilt: -0.03 + 0.02 * soft,
  });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx + r * 0.8, cy - r * 0.28, r * 1.7, WARM, 0.13 + 0.05 * soft);
  glow(g, cx, cy, r * 2.5, GOLD(), 0.03 + 0.05 * soft);
  g.restore();
  if (t > bFast) {
    const k = ease.out(clamp(prog(t, bFast, bFast + 0.25))) * (1 - soft * 0.7);
    FX.speedLines(g, t, { cx, cy, count: 12, inner: r * 1.12, a: 0.1 * k, color: WARM });
  }
  // the question lingers near the eyes, then is let go
  const qk = clamp(prog(t, 0.6, 1.2)) * (1 - ease.in(clamp(prog(t, bKind + 0.3, bKind + 0.9))));
  if (qk > 0) text(g, '?', cx + r * 0.52, cy - r * 0.5, { size: V(56, 62), color: alpha(CREAM(), 0.3 * qk), font: FONTS.title, weight: 900, italic: true });
} });
