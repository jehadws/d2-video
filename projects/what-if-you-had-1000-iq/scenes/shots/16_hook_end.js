// shots/16_hook_end.js — s129–s136: act 10, the unknown-number hook, then the end card and the subscribe knock.
// Motif 7 (the screen as the only practical) builds s129–s133 outward from the phone; motif 4 (three rings then one) lands the CTA.
import {
  E, V, registerShot, layer, blurLayer, veil, S, mood, ease, prog, clamp, lerp, mix,
  alpha, shade, rr, seg, poly, circle, ring, glow, linGrad, text, FONTS, wordTime,
} from '/engine/core.js';
import { POSES, drawFigure, breathe } from '/engine/rig2d.js';
import { drawHero, drawHeroFace, HERO_PALETTE } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, bdDesk, phone } from '../sets/bedroom.js';
import { knocks, wordOccurrence, vignetteFocus } from '../sets/gfx.js';
import { CAST, MR_BLACK } from '../cast.js';

const DEAD = { mouth: 'flat', brows: null };              // the hero's deadpan (EXPR has no 'flat')
const GOLD = () => S().ui.gold;
const CREAM = () => S().ui.cream;
const SCREEN = () => mix(mood('night').key, S().ui.blueprint, 0.42);   // the only key light left in the film
const MSG = ['We know what you did.', 'We have a proposal.'];
const DESK = () => shade('#3b2c33', -0.5);              // bdDesk's own wood, as the screen light leaves it
const CARD = 315.33;                                     // s134's start: s134–s136 are one continuous end card

// local-time offset (seconds into the shot) at which a spoken word lands.
const beat = (info, word, fb) => ((wordTime(word, info.shot.start) ?? info.shot.start + fb) - info.shot.start);

// The set, but with the window shoved out of frame and the wall maths off: nothing may compete with the screen.
function phoneRoom(g, t, cam, o = {}) {
  const r = bedroom(g, t, cam, { mood: 'night', fan: false, equations: false, doorOpen: 0, windowX: E.W * 2.4, ...o });
  veil(g, shade(r.M.dark, -0.45), 0.52);
  return r;
}

// Light built outward from the screen: pool on the surface, a cone up into the room, one horizontal streak.
function screenLight(g, x, y, R, a) {
  if (a <= 0) return;
  const SC = SCREEN();
  FX.pool(g, x, y + R * 0.5, R * 2.6, R * 0.75, SC, 0.2 * a);
  FX.lightCone(g, x, y - R * 0.1, { angle: -Math.PI / 2, spread: 1.15, len: R * 6.5, color: SC, a: 0.1 * a });
  glow(g, x, y, R * 2.8, SC, 0.34 * a);
  FX.lensStreak(g, x, y - R * 0.1, R * 7, SC, 0.2 * a, 3);
}

// One hand seen large, exactly as the rig draws it: wrist, palm, four fingers, thumb (insert close-ups may have fingers).
function pushHand(g, x, y, s, curl, facing, color) {
  const d = facing >= 0 ? 1 : -1, c = ease.inOut(clamp(curl));
  seg(g, [[x - d * s * 2.6, y + s * 1.5], [x - d * s * 0.7, y + s * 0.3]], s * 1.15, color);
  for (let i = 0; i < 4; i++) {
    const a = -0.86 + i * 0.55, len = s * (1.5 - i * 0.13);
    const x1 = x + Math.cos(a) * len * d, y1 = y + Math.sin(a) * len * 0.85;
    const b = a + c * 0.62;
    seg(g, [[x, y], [x1, y1]], s * 0.44, color);
    seg(g, [[x1, y1], [x1 + Math.cos(b) * s * 0.75 * d, y1 + Math.sin(b) * s * 0.75]], s * 0.38, color);
  }
  seg(g, [[x - d * s * 0.3, y + s * 0.4], [x + d * s * 0.55, y + s * 1.1]], s * 0.52, color);
  circle(g, x, y, s * 0.95, color);
}

// The last story frame's light: everything that escapes from under a phone laid face down.
function bleedLight(g, x, y, w, a) {
  if (a <= 0) return;
  const SC = SCREEN();
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, x, y + 6, w * 1.5, SC, 0.3 * a);
  FX.pool(g, x, y + 30, w * 1.35, w * 0.3, SC, 0.18 * a);
  g.restore();
  g.fillStyle = alpha(SC, 0.78 * a); g.fillRect(x - w / 2, y - 3, w, 7);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, x, y, x, y - 320, [alpha(SC, 0.16 * a), alpha(SC, 0)]);
  g.fillRect(x - w / 2, y - 320, w, 320);
  g.restore();
}

// the desk lamp, off: the pool on the desk is the phone's now
function deskLampOff(g, topY, x) {
  seg(g, [[x, topY], [x, topY - 110], [x + 46, topY - 150]], 7, '#1d1722');
  poly(g, [[x + 30, topY - 152], [x + 74, topY - 152], [x + 62, topY - 120], [x + 40, topY - 120]], '#1d1722');
}

// The card's cast line-up: warm rim for everyone, cold for the one who is still out there.
function castLine(g, tc, M) {
  const s = V(1.05, 1.5), y0 = E.H - V(170, 300), gap = Math.min(V(150, 108), (E.W * 0.85) / CAST.length);
  const EXPR = ['smirk', 'happy', 'neutral', 'neutral', 'smile', 'happy', 'neutral', 'neutral'];
  CAST.forEach((of, i) => {
    const k = ease.out(clamp(prog(tc, 0.25 + i * 0.08, 0.68 + i * 0.08)));
    if (k <= 0) return;
    const black = of === MR_BLACK;
    const x = E.W / 2 + (i - (CAST.length - 1) / 2) * gap;
    drawFigure(g, {
      x, y: y0 + (1 - k) * 46, s, facing: 1, outfit: of, pose: breathe(POSES.relaxed, tc, 0.7, i),
      expr: EXPR[i], face: black ? DEAD : null, alpha: k,
      rim: black
        ? { color: mood('interiorCool').rim, dir: [-0.55, -0.6], w: 5 }
        : { color: mix(M.key, CREAM(), 0.35), dir: [0, 1], w: 4 },
      blink: ((tc + i * 0.9) % (2.6 + i * 0.31)) > 2.48 + i * 0.31,
    });
    if (black) {
      g.save(); g.globalCompositeOperation = 'lighter';
      glow(g, x - V(70, 60), y0 - s * 165, V(190, 170), mood('interiorCool').rim, 0.08);
      g.restore();
    }
  });
}

// The subscribe pill, on the end screen's own geometry so the knock has something to land on.
function subscribePill(g, x, y, k) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(ease.outBack(k), ease.outBack(k));
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, 0, V(300, 260), '#e0302a', 0.14 * k); g.restore();
  rr(g, -150, -38, 300, 76, 38); g.fillStyle = '#e0302a'; g.fill();
  g.fillStyle = '#fff'; g.beginPath();
  g.moveTo(-104, 12); g.quadraticCurveTo(-104, -18, -92, -18); g.quadraticCurveTo(-80, -18, -80, 12);
  g.closePath(); g.fill();
  circle(g, -92, 17, 5, '#fff');
  text(g, 'Subscribe', 18, 2, { size: 34, color: '#fff', font: FONTS.ui, weight: 900 });
  g.restore();
}

// s129 — "That night, your phone buzzes."
// Insert: the phone face-up on the desk. Before the word it is a dark shape; on it the screen fires and the room is built out of that light.
registerShot('s129', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.32, 1.44, p), x: lerp(28, -6, p), y: lerp(26, 4, p) };
  const { GY, CX } = phoneRoom(g, t, cam);
  const buzz = beat(info, 'buzzes', 1.37);
  const litK = ease.out(clamp(prog(t, buzz - 0.06, buzz + 0.34)));
  const vib = t > buzz ? Math.exp(-(t - buzz) * 3.4) : 0;
  const ds = V(2.2, 1.9), ps = V(2.7, 2.4);
  const px = CX + V(150, 0);
  const jx = Math.sin((t - buzz) * 54) * 8 * vib, jr = Math.PI / 2 - 0.06 + Math.sin((t - buzz) * 46) * 0.04 * vib;
  layer(g, cam, 1, (h) => {
    const d = bdDesk(h, CX - V(40, 20), GY, { s: ds, color: DESK() });
    h.save(); h.globalCompositeOperation = 'lighter';
    h.fillStyle = linGrad(h, 0, d.top - 560, 0, d.top, [alpha(SCREEN(), 0), alpha(SCREEN(), 0.07 * litK)]);
    h.fillRect(-E.W, d.top - 560, E.W * 3, 560);
    h.restore();
    screenLight(h, px, d.top - 6, 52 * ps, litK);
    if (vib > 0.02) FX.rings(h, px + jx, d.top - 6, t, { count: 3, r0: 52 * ps, r1: 52 * ps * 2.1, speed: 2.4, color: SCREEN(), a: 0.26 * vib });
    phone(h, px + jx, d.top - 6, ps, { on: litK > 0.05, screen: SCREEN(), glow: 0.45 * litK, lines: 3, rot: jr });
  });
  UI.badge(g, { str: '01:47 AM', x: E.W - V(100, 80), y: V(120, 190), color: alpha(CREAM(), 0.65), a: ease.out(prog(t, 0.15, 0.5)) });
  FX.dust(g, t, { count: 9, color: SCREEN(), a: 0.1 * litK, area: [E.W * 0.2, E.H * 0.1, E.W * 0.6, E.H * 0.5] });
} });

// s130 — "Unknown number. One line."
// Tight insert: the screen fills the frame, the sender lands on the word, then the one line types itself out.
registerShot('s130', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const SC = SCREEN();
  const cam = { z: lerp(1.07, 1.16, p), x: lerp(-14, 10, p), y: 0, r: 0.012 * Math.sin(p * 2.2) };
  const unknown = beat(info, 'unknown', 0.15), lineW = beat(info, 'line', 1.35);
  const ps = V(18, 15), pw = 54 * ps, ph = 104 * ps;
  const cx = E.W * V(0.44, 0.5), cy = E.H / 2;
  const flick = 1 + 0.05 * Math.sin(t * 43) + 0.03 * Math.sin(t * 19);
  const typed = clamp(prog(t, lineW - 1.0, info.dur - 0.06));
  layer(g, cam, 1, (h) => {
    phone(h, cx, cy, ps, { on: false, rot: 0.015 });
    const iw = pw - 10 * ps, ih = ph - 14 * ps;
    UI.callout(h, t, { at: [cx, cy - ph * 0.31], to: [cx + V(560, 300), cy - ph * 0.46], str: 'UNKNOWN NUMBER', color: alpha(CREAM(), 0.85), size: V(30, 34), start: unknown + 0.05 });
    FX.screen(h, { x: cx - iw / 2, y: cy - ih / 2, w: iw, h: ih, bg: '#121a26', glowC: SC, a: 0.14 * flick }, (gc, x, y, w, hh) => {
      text(gc, 'MESSAGES', x + 40, y + 76, { size: 30, color: alpha(CREAM(), 0.4), font: FONTS.ui, weight: 900, align: 'left', spacing: 5 });
      const ha = ease.out(clamp(prog(t, unknown, unknown + 0.28)));
      if (ha > 0) {
        text(gc, 'Unknown number', x + 40, y + hh * 0.2, { size: 46, color: alpha(SC, 0.9 * ha), font: FONTS.ui, weight: 900, align: 'left' });
        seg(gc, [[x + 40, y + hh * 0.2 + 34], [x + 40 + (w - 80) * ease.out(prog(t, unknown, unknown + 0.5)), y + hh * 0.2 + 34]], 2, alpha(CREAM(), 0.22 * ha));
      }
      const chars = Math.round(typed * MSG.join('').length), in2 = clamp((chars - MSG[0].length) / MSG[1].length);
      for (let li = 0; li < 2; li++) {
        const frac = li === 0 ? clamp(chars / MSG[0].length) : in2;
        if (frac <= 0) continue;
        const by = y + hh * (0.34 + li * 0.17), shown = MSG[li].slice(0, Math.round(frac * MSG[li].length));
        rr(gc, x + 34, by - 58, w * 0.88, 104, 26); gc.fillStyle = alpha('#1f2a3a', 0.92); gc.fill();
        text(gc, shown, x + 62, by, { size: 44, color: alpha(CREAM(), 0.95), font: FONTS.ui, weight: 900, align: 'left' });
        if (frac < 1) {
          const caret = Math.sin(t * 11) > -0.2;
          if (caret) gc.fillRect(x + 62 + shown.length * 24, by - 26, 4, 52);
        }
      }
      if (typed >= 1) { gc.save(); gc.globalCompositeOperation = 'lighter'; glow(gc, x + w / 2, y + hh * 0.51, w * 0.9, SC, 0.12); gc.restore(); }
    });
  });
  vignetteFocus(g, cx, cy, E.W * 0.44, 0.42);
} });

// s131 — "We know what you did. We have a proposal."
// Giant close-up lit from below only. The message sits glowing in his eyes; the second sentence is the one that moves him.
registerShot('s131', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const SC = SCREEN();
  const M = mood('night');
  blurLayer(g, 14, (g2) => phoneRoom(g2, t, { z: 1.8, x: -130, y: -90 }, { doorOpen: 0 }));
  const didAt = beat(info, 'did', 0.9), propAt = beat(info, 'proposal', 2.11);
  const knew = ease.out(clamp(prog(info.globalT, didAt, didAt + 0.3)));
  const punch = ease.out(clamp(prog(info.globalT, propAt, propAt + 0.4)));
  const flick = 1 + 0.045 * Math.sin(t * 39) + 0.025 * Math.sin(t * 13);
  const cx = E.W / 2 - V(26, 0), cy = E.H * V(0.56, 0.52);
  const r = V(300, 330) * (1 + 0.04 * p + 0.022 * punch);
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx, cy + r * 0.7, r * 3.4, SC, 0.1 * flick);
  g.restore();
  drawHeroFace(g, cx, cy, r, {
    expr: punch > 0.3 ? 'shocked' : 'worried', face: punch > 0.3 ? null : { mouth: 'flat', brows: 'worried' },
    look: [0, 0.52], blink: (t % 3.7) > 3.58, rimColor: SC, rimSide: -1,
  });
  const ey = cy - r * 0.16;
  for (const ex of [cx - r * 0.34, cx + r * 0.34]) {
    g.save(); g.beginPath(); g.arc(ex, ey, r * 0.21, 0, 7); g.clip();
    g.globalCompositeOperation = 'lighter';
    text(g, 'WE KNOW', ex, ey - r * 0.05, { size: r * 0.075, color: alpha(SC, 0.8 * flick), font: FONTS.ui, weight: 900, align: 'center' });
    text(g, 'WHAT YOU DID', ex, ey + r * 0.05, { size: r * 0.075, color: alpha(SC, 0.8 * knew * flick + 0.2), font: FONTS.ui, weight: 900, align: 'center' });
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, ex, ey, r * 0.3, SC, 0.1 * knew + 0.16 * punch);
    g.restore();
  }
  // under-light: the screen below the frame, and the dark the rest of the room has already fallen into
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, 0, cy + r * 1.2, 0, cy - r * 0.4, [alpha(SC, 0.16 * flick), alpha(SC, 0)]);
  g.beginPath(); g.arc(cx, cy, r * 1.04, 0, 7); g.clip(); g.fill();
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = linGrad(g, 0, cy - r * 1.4, 0, cy, [alpha(M.dark, 0.72), alpha(M.dark, 0)]);
  g.beginPath(); g.arc(cx, cy, r * 1.2, 0, 7); g.fill();
  g.restore();
  blurLayer(g, 12, (g2) => phone(g2, cx + V(20, 0), E.H * V(1.16, 1.12), V(9, 8), { on: true, screen: SC, glow: 0.6, lines: 3, rot: -0.06 }));
  if (punch > 0) {
    ring(g, cx, cy, r * (1.08 + (1 - punch) * 0.4), 4 * punch, alpha(SC, 0.34 * punch));
    text(g, 'A PROPOSAL.', E.W / 2, E.H * V(0.15, 0.13), { size: V(44, 40), color: alpha(CREAM(), 0.7 * punch), font: FONTS.ui, weight: 900, spacing: 9 });
  }
  FX.dust(g, t, { count: 8, color: SC, a: 0.1, area: [E.W * 0.15, E.H * 0.1, E.W * 0.7, E.H * 0.55] });
} });

// s132 — "You stare at it a long time..."
// Medium single: the phone held still in his hand. Nothing moves but the screen's flicker and one very slow push.
const SIT_PHONE = { ...POSES.sit, head: [10, -176], eF: [22, -126], hF: [30, -158] };
registerShot('s132', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const SC = SCREEN();
  const cam = { z: lerp(1.02, 1.09, p), x: lerp(14, -8, p), y: lerp(12, 4, p) };
  const { GY, CX, M } = phoneRoom(g, t, cam);
  const s = V(3.0, 2.7), hx = CX + V(210, 150);
  const stare = ease.in(prog(t, beat(info, 'long', 1.13), info.dur - 0.1));
  const flick = 1 + 0.05 * Math.sin(t * 37) + 0.03 * Math.sin(t * 17);
  const px = hx - 46 * s, py = GY - 152 * s;
  layer(g, cam, 1, (h) => {
    const d = bdDesk(h, hx - V(560, 420), GY, { s: V(1.35, 1.15), color: DESK() });
    deskLampOff(h, d.top, hx - V(640, 480));
    drawHero(h, {
      x: hx, y: GY, s, facing: -1, pose: breathe(SIT_PHONE, t * 0.28, 0.35, 2),
      expr: 'neutral', face: DEAD, look: [-0.18, 0.6], blink: ((t + 0.4) % 4.4) > 4.28, shadow: false,
      contact: { hand: 'F' }, rim: { color: SC, dir: [-0.62, 0.58], w: 5 }, dim: true,
    });
    phone(h, px, py, V(1.15, 1), { on: true, screen: SC, glow: 0.5 * flick, lines: 3, rot: -0.34 });
    screenLight(h, px, py, 60 * flick, 0.9);
    const [hhx, hhy] = [hx + SIT_PHONE.head[0] * -s, GY + SIT_PHONE.head[1] * s];
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, hhx, hhy, s * 130, SC, 0.07 * flick);
    g.restore();
    if (stare > 0.4) FX.rings(h, hhx, hhy, t, { count: 1, r0: s * 120, r1: s * 150 * (1 + (stare - 0.4) * 0.5), speed: 0.22, color: SC, a: 0.09 });
  });
  veil(g, shade(M.dark, -0.3), 0.2);
} });

// s133 — "then set it face down."
// The last story frame: the hand tips the phone over, the light escapes from under it and dims — but never out.
registerShot('s133', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.34, 1.42, p), x: lerp(34, 8, p), y: lerp(26, 8, p) };
  const { GY, CX } = phoneRoom(g, t, cam);
  const setAt = beat(info, 'set', 0.27), downAt = beat(info, 'down', 0.79);
  const flip = ease.inOut(clamp(prog(t, setAt + 0.06, downAt + 0.06)));
  const up = 1 - ease.in(clamp(prog(t, setAt, downAt)));
  const gone = flip < 0.5 ? 1 : 0;
  const bleed = clamp(prog(t, downAt - 0.02, downAt + 0.22)) * (1 - 0.55 * ease.out(prog(t, downAt + 0.2, info.dur - 0.05)));
  const ps = V(2.7, 2.4), px = CX + V(120, 0);
  const hIn = ease.out(clamp(prog(t, setAt - 0.12, setAt + 0.24)));
  const hOut = ease.in(clamp(prog(t, downAt + 0.1, info.dur - 0.12)));
  layer(g, cam, 1, (h) => {
    const d = bdDesk(h, CX - V(40, 20), GY, { s: V(2.2, 1.9), color: DESK() });
    screenLight(h, px, d.top - 6, 52 * ps, up);
    h.save();
    h.translate(px, d.top - 6 - 26 * (1 - up));
    h.scale(1, 1 - 2 * flip);
    h.rotate(-0.05 * (1 - flip));
    phone(h, 0, 0, ps, { on: gone, screen: SCREEN(), glow: 0.45 * up, lines: 3 });
    h.restore();
    bleedLight(h, px, d.top + 10, 104 * ps, bleed);
    const handX = px + V(120, 100) + V(420, 340) * hOut - V(60, 50) * (1 - hIn);
    const handY = d.top - 120 + 40 * Math.sin(flip * Math.PI);
    if (hIn > 0 && hOut < 1) {
      h.save(); h.globalAlpha = Math.min(hIn, 1 - hOut);
      glow(h, handX, handY, 190, SCREEN(), 0.1);
      pushHand(h, handX, handY, V(46, 40), 0.35 + flip * 0.6, -1, HERO_PALETTE.skin);
      seg(h, [[handX + V(60, 50), handY + V(52, 44)], [handX + V(420, 360), handY + V(230, 200)]], V(66, 58), shade(HERO_PALETTE.clothing, 0.1));
      h.restore();
    }
  });
  FX.dust(g, t, { count: 8, color: SCREEN(), a: 0.08 * (bleed * 0.6 + 0.4) });
} });

// s134 — "So what would you actually solve first with a mind like that?"
// End card, part 1: warm gradient, the whole cast lined up, the question arriving on the first word. One slow push for all three shots.
registerShot('s134', { draw(g, t, info) {
  const M = mood('interiorWarm');
  const tc = info.globalT - CARD;
  const cam = { z: 1 + 0.05 * ease.sine(prog(tc, 0, 13.33)) };
  const q1 = ease.out(clamp(prog(info.globalT, wordTime('so', info.shot.start) ?? info.shot.start, (wordTime('so', info.shot.start) ?? info.shot.start) + 0.4)));
  const q2 = ease.out(clamp(prog(t, 0.55, 1.0)));
  const rule = ease.out(prog(tc, 1.2, 2.0));
  layer(g, cam, 1, (h) => {
    h.fillStyle = linGrad(h, 0, -E.H, 0, E.H * 2, [shade(M.dark, -0.25), shade(M.wall, -0.35), shade(M.wall, -0.02)]);
    h.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, E.W / 2, E.H * 0.94, E.W * 0.5, M.key, 0.3);
    h.restore();
    text(h, 'So what would you actually solve', E.W / 2, E.H * V(0.15, 0.17), { size: V(66, 58), color: alpha(CREAM(), q1), font: FONTS.serif, weight: 900, italic: true, glow: 20, glowColor: alpha(M.key, 0.5) });
    text(h, 'first with a mind like that?', E.W / 2, E.H * V(0.235, 0.255), { size: V(66, 58), color: alpha(GOLD(), q2), font: FONTS.serif, weight: 900, italic: true, glow: 20, glowColor: alpha(GOLD(), 0.45) });
    seg(h, [[E.W / 2 - V(330, 260) * rule, E.H * V(0.3, 0.32)], [E.W / 2 + V(330, 260) * rule, E.H * V(0.3, 0.32)]], 3, alpha(GOLD(), 0.55 * rule));
    castLine(h, tc, M);
  });
  vignetteFocus(g, E.W / 2, E.H * 0.55, E.W * 0.62, 0.36);
  FX.dust(g, t, { count: 12, color: M.key, a: 0.12, area: [0, E.H * 0.3, E.W, E.H * 0.6] });
} });

// s135 — "Tell us the one problem you'd fix by lunchtime."
// End card, part 2: the comment bubble and the ask land on their words; the card underneath does not move.
registerShot('s135', { draw(g, t, info) {
  const M = mood('interiorWarm');
  const tc = info.globalT - CARD;
  const cam = { z: 1 + 0.05 * ease.sine(prog(tc, 0, 13.33)) };
  const tell = (wordTime('tell', info.shot.start) ?? info.shot.start) - CARD;
  const problem = (wordTime('problem', info.shot.start) ?? info.shot.start + 0.7) - CARD;
  const bx = E.W / 2 - V(620, 240), ry = E.H * V(0.46, 0.4);
  layer(g, cam, 1, (h) => {
    h.fillStyle = linGrad(h, 0, -E.H, 0, E.H * 2, [shade(M.dark, -0.25), shade(M.wall, -0.35), shade(M.wall, -0.02)]);
    h.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, E.W / 2, E.H * 0.94, E.W * 0.5, M.key, 0.3);
    h.restore();
    text(h, 'So what would you actually solve', E.W / 2, E.H * V(0.15, 0.17), { size: V(66, 58), color: alpha(CREAM(), 1), font: FONTS.serif, weight: 900, italic: true, glow: 20, glowColor: alpha(M.key, 0.5) });
    text(h, 'first with a mind like that?', E.W / 2, E.H * V(0.235, 0.255), { size: V(66, 58), color: alpha(GOLD(), 1), font: FONTS.serif, weight: 900, italic: true, glow: 20, glowColor: alpha(GOLD(), 0.45) });
    seg(h, [[E.W / 2 - V(330, 260), E.H * V(0.3, 0.32)], [E.W / 2 + V(330, 260), E.H * V(0.3, 0.32)]], 3, alpha(GOLD(), 0.55));
    castLine(h, tc, M);
    if (tc >= tell) {
      const k = ease.outBack(clamp(prog(tc, tell, tell + 0.35)));
      UI.bubble(h, bx, ry, { w: V(180, 200) * k, h: V(96, 108) * k, color: '#f4efe6' });
      text(h, 'COMMENTS', bx + V(140, 150), ry - V(34, 30), { size: V(26, 30), color: alpha(CREAM(), 0.6 * k), font: FONTS.ui, weight: 900, align: 'left', spacing: 4 });
    }
    if (tc >= problem) {
      const k = ease.out(clamp(prog(tc, problem, problem + 0.4)));
      text(h, "THE ONE PROBLEM YOU'D FIX BY LUNCHTIME", bx + V(140, 120), ry + V(14, 18), { size: V(34, 30), color: alpha(CREAM(), 0.9 * k), font: FONTS.ui, weight: 900, align: 'left', spacing: 1.5 });
      seg(h, [[bx + V(140, 120), ry + V(44, 52)], [bx + V(140, 120) + V(640, 560) * k, ry + V(44, 52)]], 3, alpha(M.key, 0.4 * k));
    }
  });
  vignetteFocus(g, E.W / 2, E.H * 0.55, E.W * 0.62, 0.36);
  FX.dust(g, t, { count: 10, color: M.key, a: 0.1, area: [0, E.H * 0.3, E.W, E.H * 0.6] });
} });

// s136 — "And if Leo's three knock code got you right in the feels... hit like, and subscribe for more What Ifs."
// End card, part 3: the CTA row, then the film's own motif — three rings on "like", the single one on "subscribe" — over the pill.
registerShot('s136', { draw(g, t, info) {
  const M = mood('interiorWarm');
  const tc = info.globalT - CARD;
  const cam = { z: 1 + 0.05 * ease.sine(prog(tc, 0, 13.33)) };
  const like = (wordOccurrence('like', info.shot.start, 1) ?? info.shot.start + 3.3) - CARD;
  const sub = (wordTime('subscribe', info.shot.start) ?? info.shot.start + 4) - CARD;
  const bx = E.W / 2 - V(620, 240), px = E.W / 2 + V(430, 0), ry = E.H * V(0.46, 0.4);
  layer(g, cam, 1, (h) => {
    h.fillStyle = linGrad(h, 0, -E.H, 0, E.H * 2, [shade(M.dark, -0.25), shade(M.wall, -0.35), shade(M.wall, -0.02)]);
    h.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, E.W / 2, E.H * 0.94, E.W * 0.5, M.key, 0.3);
    h.restore();
    text(h, 'So what would you actually solve', E.W / 2, E.H * V(0.15, 0.17), { size: V(66, 58), color: alpha(CREAM(), 1), font: FONTS.serif, weight: 900, italic: true, glow: 20, glowColor: alpha(M.key, 0.5) });
    text(h, 'first with a mind like that?', E.W / 2, E.H * V(0.235, 0.255), { size: V(66, 58), color: alpha(GOLD(), 1), font: FONTS.serif, weight: 900, italic: true, glow: 20, glowColor: alpha(GOLD(), 0.45) });
    seg(h, [[E.W / 2 - V(330, 260), E.H * V(0.3, 0.32)], [E.W / 2 + V(330, 260), E.H * V(0.3, 0.32)]], 3, alpha(GOLD(), 0.55));
    castLine(h, tc, M);
    UI.bubble(h, bx, ry, { w: V(180, 200), h: V(96, 108), color: '#f4efe6' });
    text(h, 'COMMENTS', bx + V(140, 150), ry - V(34, 30), { size: V(26, 30), color: alpha(CREAM(), 0.6), font: FONTS.ui, weight: 900, align: 'left', spacing: 4 });
    text(h, "THE ONE PROBLEM YOU'D FIX BY LUNCHTIME", bx + V(140, 120), ry + V(14, 18), { size: V(34, 30), color: alpha(CREAM(), 0.9), font: FONTS.ui, weight: 900, align: 'left', spacing: 1.5 });
    const pk = ease.out(clamp(prog(tc, like - 0.15, like + 0.1)));
    subscribePill(h, px, ry, pk);
    if (tc >= like) {
      knocks(h, px, ry, tc, {
        start: like, hits: [0, 0.22, 0.44, sub - like],
        r0: V(72, 62), r1: V(330, 290), color: '#ffe9c4', a: 0.7,
      });
    }
    const hit = ease.out(clamp(prog(tc, sub, sub + 0.3)));
    if (hit > 0) {
      h.save(); h.globalCompositeOperation = 'lighter';
      glow(h, px, ry, V(320, 280) * (1 + (1 - hit) * 0.4), '#ffe9c4', 0.2 * hit);
      h.restore();
      subscribePill(h, px, ry - V(10, 8) * (1 - hit), 1 + 0.06 * (1 - hit));
    }
  });
  vignetteFocus(g, E.W / 2, E.H * 0.55, E.W * 0.62, 0.36);
  FX.dust(g, t, { count: 10, color: M.key, a: 0.1, area: [0, E.H * 0.3, E.W, E.H * 0.6] });
} });
