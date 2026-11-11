// shots/13_fire.js — act 7 (s097–s114): the fire. Panic → rescue, the film's action peak.
// Everything lit in this act carries a warm orange rim from the fire front, which sits camera-right
// (stairwell dir = -1), and the act ends on the one freeze frame where the reward meter moves.
import { E, V, registerShot, layer, blurLayer, S, mood, ease, prog, clamp, lerp, alpha, shade, rr, seg, poly, circle, ring, radGrad, glow, text, FONTS, wordTime, talkAmount, veil, rng, shake } from '/engine/core.js';
import { POSES, drawFigure, bigFace, breathe, blendPose, walkPose } from '/engine/rig2d.js';
import { drawHero, drawHeroFace } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, bedroomGround, bed } from '../sets/bedroom.js';
import { city, cityGround } from '../sets/city.js';
import { apartmentBlock, streetGround } from '../sets/apartment.js';
import { stairwell, stairGround, stepAt, doorway, debris } from '../sets/stairwell.js';
import { voidSet, voidGround } from '../sets/void.js';
import { stamp } from '../sets/gfx.js';
import { LEO, FAMILY } from '../cast.js';

// ---------- act 7 palette / helpers ----------
const GOLD = () => S().ui.gold;
const BP = () => S().ui.blueprint;
const CREAM = () => S().ui.cream;
const FIRE = '#ff7a3a';                    // the flame body, same colour the set uses
const FIRE_HOT = '#ffd08a';                 // the white-hot core of a flash
const RIMFIRE = '#ffb066';                  // warm rim for every lit figure in this act
const BLUE_MODEL = '#9fe8ff';               // the clean blue of the running model

const DEAD = { mouth: 'flat', brows: null }; // the hero's deadpan

// camera.y that lands a figure's feet on a chosen screen line at a given zoom (framing arithmetic)
const camY = (feetWorldY, z, line = V(920, 1300)) => feetWorldY - E.H / 2 - (line - E.H / 2) / z;

// a tread standing point: mid-tread of step i, the same anchor sets/railing.js uses
const onStep = (st, stepAtFn, i) => { const p = stepAtFn(i); return { x: p.x + st.dir * st.run * 0.5, y: p.y }; };

// world → screen at a given parallax depth, so root-space UI can point at set geometry
const scr = (cam, depth, x, y) => { const z = 1 + ((cam.z ?? 1) - 1) * depth; return [(x - E.W / 2 - (cam.x || 0) * depth) * z + E.W / 2, (y - E.H / 2 - (cam.y || 0) * depth) * z + E.H / 2]; };

// fire light spilling through the landing window, camera-left in this act
function windowSpill(g, cx, cy, w, k = 1, color = RIMFIRE) {
  if (k <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx, cy, w * 1.7, color, 0.15 * k);
  poly(g, [[cx - w * 0.4, cy], [cx + w * 0.4, cy], [cx + w * 1.15, E.H], [cx - w * 1.15, E.H]], alpha(color, 0.07 * k));
  g.restore();
}

// licking flames climbing a wall: `k` is how alive they are
function flames(g, x, y, w, h, t, o = {}) {
  const k = o.k ?? 1, a = o.a ?? 0.6, r = rng(o.seed ?? 71);
  if (k <= 0.01) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const u = r(), wide = (0.08 + r() * 0.2) * w, cx = x + (u - 0.5) * w * 0.92;
    const ph = (t * (0.9 + r() * 0.9) + r()) % 1;
    const hh = h * (0.4 + r() * 0.8) * k * (1 - ph * 0.45);
    poly(g, [[cx - wide, y], [cx + wide, y], [cx + wide * 0.35, y - hh * 0.55], [cx, y - hh], [cx - wide * 0.4, y - hh * 0.5]],
      alpha(i % 2 ? FIRE : FIRE_HOT, a * k * (1 - ph * 0.6) * (0.55 + 0.45 * Math.sin(ph * Math.PI))));
  }
  glow(g, x, y - h * 0.22, w * 1.4, FIRE, 0.26 * k);
  g.restore();
}

// cold soot: a clipped dark stain over a face / a hem
function soot(g, x, y, r, o = {}) {
  const a = o.a ?? 1, q = rng(o.seed ?? 57);
  g.save(); g.globalAlpha = a; g.lineCap = 'round';
  for (let i = 0; i < 15; i++) {
    const ang = q() * 6.283, d = r * (0.25 + q() * 0.75), rad = r * (0.07 + q() * 0.15);
    const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d * 0.94;
    g.save(); g.beginPath(); g.arc(px, py, rad, 0, 7); g.clip();
    g.fillStyle = alpha(o.color || '#1a1526', 0.35 + q() * 0.35);
    g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    g.restore();
  }
  if (o.streak) { seg(g, [[x - r * 0.2, y - r * 0.5], [x - r * 0.28, y + r * 0.62]], r * 0.16, alpha(o.color || '#1a1526', 0.4)); }
  g.restore();
}

// the worn outlet: plate, sockets, scorch stain, live arc
function outlet(g, x, y, s, o = {}) {
  const arc = o.arc ?? 0, scorch = o.scorch ?? 0, t = o.t ?? 0;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (scorch > 0) {
    g.fillStyle = radGrad(g, 0, -70, 10, 210, [alpha('#120d14', 0.85 * scorch), alpha('#1a1218', 0.35 * scorch), alpha('#000000', 0)]);
    g.beginPath(); g.ellipse(0, -80, 120, 200, 0, 0, 7); g.fill();
  }
  g.fillStyle = alpha('#cfc7b6', 0.88); rr(g, -46, -62, 92, 124, 8); g.fill();
  g.strokeStyle = alpha('#7f7768', 0.9); g.lineWidth = 3; g.stroke();
  circle(g, 0, -48, 4, '#6e675a'); circle(g, 0, 48, 4, '#6e675a');
  g.fillStyle = '#1e1c18';
  rr(g, -22, -32, 11, 28, 4); g.fill(); rr(g, 11, -32, 11, 28, 4); g.fill();
  circle(g, 0, 18, 7, '#1e1c18');
  if (arc > 0) {                                                                        // the arc jumping the socket gap
    const r = rng(91);
    const pts = [[-16, -22]];
    for (let i = 1; i < 6; i++) pts.push([-16 + i * 6.4 + (r() - 0.5) * 9, -22 + (r() - 0.5) * 30]);
    pts.push([16, -22]);
    g.save(); g.globalCompositeOperation = 'lighter';
    seg(g, pts, 5, alpha('#d9f2ff', 0.9 * arc)); seg(g, pts, 12, alpha('#8fd0ff', 0.3 * arc));
    FX.sparkle(g, 0, -22, 60 * arc, '#cfeaff', 0.5 * arc);
    glow(g, 0, -20, 190 * arc, '#9fd8ff', 0.35 * arc);
    g.restore();
  }
  g.restore();
}

// the fire model as a clean blue panel (s104 dissolving / s105 the "genius thing")
function modelPanel(g, x, y, w, h, t, o = {}) {
  const a = o.a ?? 1, k = o.k ?? 0.55, c = o.color || BLUE_MODEL;
  if (a <= 0.01) return;
  g.save(); g.globalAlpha = a;
  rr(g, x - w / 2, y - h / 2, w, h, 14); g.fillStyle = alpha('#08101c', 0.74); g.fill();
  g.strokeStyle = alpha(c, 0.5); g.lineWidth = 3; g.stroke();
  for (let i = 1; i < 6; i++) {
    seg(g, [[x - w / 2 + 12, y - h / 2 + (h * i) / 6], [x + w / 2 - 12, y - h / 2 + (h * i) / 6]], 1.5, alpha(c, 0.15));
    seg(g, [[x - w / 2 + (w * i) / 6, y - h / 2 + 12], [x - w / 2 + (w * i) / 6, y + h / 2 - 12]], 1.5, alpha(c, 0.15));
  }
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const u = (i / 26) * clamp(k, 0.05, 1);
    pts.push([x - w / 2 + 20 + u * (w - 40), y + h / 2 - 26 - Math.pow(u, 1.45) * (h - 76)]);
  }
  g.lineCap = 'round'; seg(g, pts, 4.5, alpha(c, 0.95));
  const tip = pts[pts.length - 1];
  glow(g, tip[0], tip[1], V(70, 60), BLUE_MODEL, 0.5);
  text(g, 'FIRE MODEL', x, y - h / 2 - V(28, 34), { size: V(26, 32), color: alpha(c, 0.85), font: FONTS.ui, weight: 900, spacing: 3 });
  g.restore();
}

// ---------- act 7 ----------
// s097 — "Then the emergency comes." Medium single: his head snapping up off the pillow toward the window.
registerShot('s097', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.14, 1.24, p);
  const cam = { z, x: lerp(-30, 36, p), y: camY(bedroomGround() - 112 * V(1.15, 1) - 10 * V(1.15, 1) + 2, z) };
  const { win } = bedroom(g, t, cam, { mood: 'night', fan: false, equationsLit: 4, equationAlpha: 0.18 });
  const GY = bedroomGround(), CX = E.W / 2;
  const snap = wordTime('emergency', info.shot.start) ?? info.shot.start + 0.5;
  const up = ease.out(clamp(prog(info.globalT, snap, snap + 0.3)));
  const heat = ease.inOut(prog(t, 0, Math.min(1.2, info.dur)));
  const bx = CX - V(560, 400), bs = V(1.15, 1), hs = V(2.75, 2.5);
  const bdTop = GY - 112 * bs - 10 * bs;
  const hx = bx + (620 * bs) * 0.6;
  layer(g, cam, 1, (h) => {
    bed(h, bx, GY, { s: bs });
    drawHero(h, {
      x: hx, y: bdTop + 2, s: hs, facing: 1, pose: blendPose(POSES.sitBack, POSES.sit, up),
      expr: up > 0.55 ? 'shocked' : 'sleepy', look: [lerp(-0.2, 0.5, up), -0.22],
      rim: { color: RIMFIRE, dir: [0.72, -0.34], w: 4 }, shadow: false, blink: false,
    });
    // the covers stay across his legs, so the read is "sitting up out of the bed", not floating
    h.fillStyle = shade('#4d4d8f', -0.22);
    rr(h, bx + 190 * bs, bdTop - 8 * bs, (620 - 190) * bs, 40 * bs, 12 * bs); h.fill();
    glow(h, hx + 30 * hs, bdTop - 190 * hs, V(220, 190), RIMFIRE, 0.16 * heat);      // fire light catching his face
  });
  // the fire starting to paint the wall, from camera-right through the window
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, win.x + win.w / 2, win.y + win.h / 2, V(620, 520) * (0.6 + heat), FIRE, 0.14 * heat);
  FX.lightCone(g, win.x + win.w * 0.2, win.y + win.h * 0.6, { angle: Math.PI * 1.06, spread: 0.9, len: V(900, 760) * (0.4 + 0.6 * heat), color: RIMFIRE, a: 0.1 * heat });
  g.restore();
  FX.dust(g, t, { count: 14, color: '#ffe2bd', a: 0.16 });
  if (heat > 0.6) FX.rings(g, win.x + win.w / 2, win.y + win.h / 2, t, { count: 2, r0: V(120, 110), r1: V(300, 260), speed: 0.7, color: RIMFIRE, a: 0.12 * heat });
} });

// s098 — "Leo's apartment building, old wiring, and a spark catches in a stairwell at midnight."
// The act's 3D establishing: an old block at midnight, one stairwell window already orange.
registerShot('s098', {
  kind: '3d',
  init(T) {
    const { THREE } = T;
    const st = T.stage({ mood: 'night', fov: V(38, 54), fog: [26, 120], keyPos: [-9, 14, 10], keyIntensity: 1.1, ambient: 0.75, sky: ['#070a14', '#101828', '#1b2536'] });
    st.add(T.ground(90, 90, '#121626', T.tiles('#121626', 10, [16, 16])));
    st.add(T.box(70, 0.05, 12, '#171d2c', 0, 0.03, 16));                                   // the street
    for (const [sx, sz] of [[-27, -23], [27, -21], [-25, 25], [28, 26]]) st.add(T.building(13, 11, 13, { color: '#171d2e', win: '#d8c08a', lit: 0.12, seed: 7 + sx }));
    // Leo's block: brick shell, stoop, cornice, fire escape
    st.add(T.box(17, 15, 13, '#1d2334', 0, 7.5, 0));
    st.add(T.box(17.8, 0.5, 13.8, '#252c40', 0, 15.2, 0));
    for (const [col, row] of [[-6, 3], [-6, 4], [6.5, 2], [6.5, 4], [-3, 4], [3, 3]]) {
      const w = T.windowPane(2.1, 2.5, { glowColor: '#c9a86a', cols: 2, rows: 2, power: 0.22, interior: true });
      w.position.set(col, 3.2 + row * 2.9, 6.55); st.add(w);
    }
    // THE window: the stairwell, already glowing
    const fireWin = T.windowPane(2.4, 3.1, { glowColor: '#ff9a4a', cols: 1, rows: 2, power: 1.45, interior: true });
    fireWin.position.set(4.2, 9.2, 6.55); st.add(fireWin);
    const fireLight = new THREE.PointLight(0xff8a4a, 5, 30); fireLight.position.set(4.2, 9.2, 8); st.add(fireLight);
    const shaft = T.shaft(3.4, 12, '#ffb066', 0.11); shaft.position.set(4.2, 5.6, 8.4); shaft.rotation.x = -0.5; st.add(shaft);
    // the stairwell door at street level, warm from inside
    const doorPane = T.windowPane(1.5, 2.6, { glowColor: '#ff8a4a', cols: 1, rows: 1, power: 0.9 });
    doorPane.position.set(0, 1.3, 6.56); st.add(doorPane);
    // fire escape: stringers, platforms, ladders
    for (let f = 0; f < 4; f++) {
      const y = 3.4 + f * 2.9;
      st.add(T.box(3.6, 0.12, 1.4, '#10141f', 8.7, y, 7.2));
      for (const [lz, lx] of [[6.6, 7.2], [7.7, 7.2], [6.6, 10.1], [7.7, 10.1]]) st.add(T.box(0.09, 2.9, 0.09, '#10141f', lx, y + 1.45, lz));
      const lad = T.box(1.1, 2.9, 0.07, '#10141f', 8.7, y + 1.45, 7.9); lad.rotation.x = 0.18; st.add(lad);
    }
    for (const lx of [-11, 11]) {
      st.add(T.cyl(0.09, 0.12, 5.4, '#0f1320', lx, 2.7, 15));
      st.add(T.box(0.5, 0.2, 0.4, '#0f1320', lx + 0.6, 5.3, 15));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd9a0' }));
      bulb.position.set(lx + 0.8, 5.2, 15); st.add(bulb);
    }
    st.add(T.tree3D(-15, 13, 1, '#141b26'), T.tree3D(15.5, 12, 0.9, '#141b26'));
    for (const cx of [-7, -2.5, 6]) st.add(T.box(1.9, 0.85, 4.2, cx % 2 ? '#1a2030' : '#232a3c', cx, 0.6, 18.5));
    return { stage: st, fireLight, shaft, fireWin, marker: [E.W * 0.62, E.H * 0.34] };
  },
  draw(s, t, info, T) {
    const flick = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.3)) * (0.7 + 0.3 * Math.sin(t * 7.1));
    s.fireLight.intensity = 3.4 + 4.2 * flick * clamp(t / 0.8);
    s.fireLight.color.setHex(0xff8a4a);
    s.shaft.material.opacity = 0.07 + 0.07 * flick;
    s.fireWin.material.color.setRGB(1.3 + 0.25 * flick, (1.25 + 0.2 * flick) * 0.95, 0.85 * 0.85);
    T.orbit(s.stage.camera, t, { target: [2.2, 8, 0], radius: [26, 19.5], height: [9.5, 10.6], from: -0.34, to: 0.3, dur: info.dur });
    // where the burning window lands on screen, for the overlay callout
    const p = new T.THREE.Vector3(4.2, 9.6, 6.6).project(s.stage.camera);
    s.marker = [(p.x * 0.5 + 0.5) * E.W, (-p.y * 0.5 + 0.5) * E.H];
  },
  overlay(g, t, info, s) {
    const k = ease.out(prog(t, 0.55, 1.15));
    if (k > 0) UI.callout(g, t, { at: s.marker, to: [E.W * 0.86, E.H * V(0.22, 0.26)], str: 'STAIRWELL · MIDNIGHT', color: RIMFIRE, start: 0.5 });
    UI.badge(g, { str: '00:00', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.8) });
    FX.dust(g, t, { count: 10, color: RIMFIRE, a: 0.12 * k, area: [E.W * 0.45, 0, E.W * 0.4, E.H * 0.5] });
  },
});

// s099 — "...a spark catches in a stairwell at midnight." Insert: the worn outlet, first flame on the wallpaper.
registerShot('s099', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.42, 1.56, p);
  const fire = 0.06 + 0.16 * ease.inOut(clamp(prog(t, 0.2, info.dur)));
  const sparkAt = wordTime('spark', info.shot.start) ?? info.shot.start + 0.4;
  const sparkK = clamp(prog(info.globalT, sparkAt, sparkAt + 0.5));
  const cam = { z, x: 405 * z - E.W * 0.06, y: 20 };
  stairwell(g, t, cam, { mood: 'storm', fire, smoke: 0.05, dir: -1 });    // root space: the set owns its parallax
  const st = { rise: V(44, 38), run: V(96, 78), x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  const base = stepAt(st, 3);
  const ox = base.x + st.dir * st.run * 0.25, oy = base.y - V(250, 230);
  const arc = 0.35 + 0.65 * sparkK * (0.5 + 0.5 * Math.sin(t * 19));
  layer(g, cam, 0.55, (h) => {
    outlet(h, ox, oy, V(1.55, 1.3), { arc, scorch: 0.35 + 0.5 * sparkK, t });
    if (sparkK > 0.1) {                                                 // sparks off the plate, arcing upward
      const r = rng(133);
      for (let i = 0; i < 12; i++) {
        const u = prog(t, 0.1 + r() * 0.7, 0.55 + r() * 0.9);
        if (u <= 0 || u >= 1) continue;
        const sx = ox + (r() - 0.5) * V(300, 250) * u, sy = oy - V(120, 110) * u - u * u * V(220, 190);
        FX.sparkle(h, sx, sy, V(26, 22) * (1 - u) * (0.6 + r() * 0.8), i % 3 ? '#cfeaff' : FIRE_HOT, 0.6 * (1 - u));
      }
      glow(h, ox, oy - V(60, 50), V(420, 360) * sparkK, '#9fd8ff', 0.18 * sparkK);
    }
    flames(h, ox, oy - V(60, 54), V(230, 190), V(330, 300), t, { k: ease.out(prog(t, 0.5, 1.7)) * (0.35 + 0.65 * sparkK), a: 0.5 });
    FX.dust(h, t, { count: 16, color: RIMFIRE, a: 0.4, area: [ox - V(260, 220), oy - V(560, 520), V(520, 440), V(520, 480)], speed: 70, size: 1.4 });
  });
  veil(g, '#0a0c14', 0.18);
  UI.callout(g, t, { at: scr(cam, 0.55, ox, oy), to: [E.W * 0.2, E.H * 0.22], str: 'OLD WIRING', color: alpha(CREAM(), 0.85), start: 0.15 });
  UI.badge(g, { str: 'FIRST FLAME', x: E.W - V(110, 80), y: V(120, 190), color: alpha(RIMFIRE, 0.9), a: ease.out(prog(t, 0.5, 0.9)) });
} });

// s100 — "You're three streets away." Wide: the hero running down an empty street, the gold route still ahead of him.
registerShot('s100', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.04, 1.08, p);
  const cam = { z, x: lerp(-140, 190, p), y: camY(cityGround(), z) };
  const GY = cityGround(), CX = E.W / 2;
  const fireX = CX + V(700, 520), fireY = GY - V(360, 320);
  city(g, t, cam, { mood: 'night', wet: true, rain: 0.16, lit: 0.18, winLit: 0.16, fire: { x: fireX, y: fireY, a: 0.3 } });
  const hs = V(2.2, 2.05);
  const heroX = CX - V(520, 380) + 150 * t;
  layer(g, cam, 1, (h) => {
    // the route: three streets between him and the fire, drawn on the road in gold line-art
    const route = [[heroX + V(40, 34), GY + V(54, 46)], [CX + V(120, 100), GY + V(58, 48)], [CX + V(400, 330), GY + V(46, 40)], [fireX - V(30, 26), GY + V(40, 36)]];
    const k = ease.out(prog(t, 0.05, 0.9));
    h.save(); h.setLineDash([V(26, 22), V(18, 16)]);
    seg(h, route, V(5, 4), alpha(GOLD(), 0.75 * k));
    h.setLineDash([]); h.restore();
    for (let i = 0; i < 3; i++) {                                        // the three crossing streets as gate ticks
      const kk = ease.out(clamp(prog(t, 0.3 + i * 0.24, 0.75 + i * 0.24)));
      if (kk <= 0) continue;
      const x = lerp(route[0][0], route[3][0], (i + 1) / 4), y = lerp(route[0][1], route[3][1], (i + 1) / 4);
      seg(h, [[x, y - V(60, 54) * kk], [x, y + V(26, 22) * kk]], V(4, 3), alpha(GOLD(), 0.8 * kk));
      text(h, String(i + 1), x, y - V(86, 78) * kk, { size: V(30, 34), color: alpha(GOLD(), kk), font: FONTS.ui, weight: 900 });
    }
    const du = (t * 0.55) % 1;                                          // the pulse running ahead of him
    const dx = lerp(lerp(route[1][0], route[2][0], du), route[2][0] + 40, du * 0.2);
    circle(h, dx, lerp(route[1][1], route[2][1], du), V(8, 7), alpha(GOLD(), 0.85));
    glow(h, fireX - V(30, 26), GY + V(40, 36), V(260, 220), FIRE, 0.3 * k);
    // running: fast stride, body pitched forward, warm fire rim arriving from the right
    const ph = t * Math.PI * 2 * 1.55;
    drawHero(h, {
      x: heroX, y: GY, s: hs, facing: 1, pose: walkPose(ph, { run: true }),
      expr: 'determined', rim: { color: RIMFIRE, dir: [0.8, -0.3], w: 4.5 }, shadow: true, look: [0.6, -0.1],
      trail: { count: 3, dx: -V(70, 58), a: 0.16 },
    });
    FX.pool(h, heroX - V(120, 100), GY + V(56, 46), V(140, 120), V(30, 26), RIMFIRE, 0.1);
  });
  UI.dimension(g, t, { x1: scr(cam, 1, heroX, GY)[0] + V(60, 50), y1: E.H * V(0.3, 0.26), x2: scr(cam, 1, fireX, GY)[0], y2: E.H * V(0.3, 0.26), str: '3 STREETS', color: GOLD(), start: 0.25 });
  UI.badge(g, { str: 'LEO: INSIDE', x: E.W - V(110, 80), y: V(150, 220), color: alpha(RIMFIRE, 0.9), a: ease.out(prog(t, 0.5, 0.9)) });
  FX.rain(g, t, { a: 0.16, color: CREAM(), angle: 0.22, speed: 1200, count: 120, seed: 23 });
} });

// s101 — "You calculate the fire's spread rate instantly..." Blueprint: the stairwell in section, the front spreading.
registerShot('s101', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.02, 1.08, p), x: lerp(-22, 18, p), y: lerp(10, -12, p) };
  voidSet(g, t, cam, { mood: 'void', grid: 78, gridAlpha: 0.06, dust: true });
  const spread = wordTime('spread', info.shot.start) ?? info.shot.start + 0.7;
  const k = ease.inOut(prog(info.globalT, spread - 0.3, info.shot.end));
  const CX = E.W / 2, GY = voidGround();
  const bx = CX - V(340, 240), by = GY - V(60, 120);
  const sw = V(60, 46), sh = V(34, 28), steps = 9;
  layer(g, cam, 1, (h) => {
    const c = BP();
    // flight in section, gold-capped line art
    let px = bx, py = by;
    for (let i = 0; i < steps; i++) { seg(h, [[px, py], [px + sw, py]], 3, alpha(c, 0.8)); seg(h, [[px + sw, py], [px + sw, py - sh]], 3, alpha(c, 0.8)); px += sw; py -= sh; }
    seg(h, [[bx - V(60, 50), by + V(6, 8)], [px + V(70, 60), py + V(6, 8)]], 2, alpha(c, 0.35));     // floor line
    seg(h, [[px + sw * 0.4, py - sh], [px + sw * 0.4, py - sh - V(210, 190)]], 3, alpha(c, 0.7));    // the landing window
    seg(h, [[px + sw * 0.4 + V(90, 80), py - sh], [px + sw * 0.4 + V(90, 80), py - sh - V(210, 190)]], 3, alpha(c, 0.7));
    seg(h, [[px + sw * 0.4, py - sh - V(210, 190)], [px + sw * 0.4 + V(90, 80), py - sh - V(210, 190)]], 3, alpha(c, 0.7));
    // the door he comes in through, at the foot
    h.save(); seg(h, [[bx - V(70, 60), by], [bx - V(70, 60), by - V(150, 140)]], 3, alpha(c, 0.7));
    seg(h, [[bx - V(70, 60), by - V(150, 140)], [bx - V(10, 8), by - V(150, 140)]], 3, alpha(c, 0.7)); h.restore();
    // the fire front: an advancing coral wedge plus dashed iso-lines 8 s apart
    const front = clamp(k) * (steps - 1);
    const fi = Math.floor(front), fr = front - fi;
    const fx = bx + (fi + fr) * sw, fy = by - (fi + fr) * sh;
    h.save(); h.globalCompositeOperation = 'lighter';
    for (let i = 0; i <= fi; i++) {
      const x = bx + i * sw, y = by - i * sh;
      poly(h, [[x, y], [x + sw, y], [x + sw, y - sh * 2.6], [x, y - sh * 2.2]], alpha(FIRE, 0.3));
      poly(h, [[x + sw * 0.2, y - sh], [x + sw * 0.8, y - sh], [x + sw * 0.5, y - sh * (2.4 + 0.6 * Math.sin(t * 3 + i))]], alpha(FIRE_HOT, 0.4));
    }
    glow(h, fx, fy - sh, V(300, 250), FIRE, 0.3);
    h.restore();
    h.save(); h.setLineDash([12, 10]);
    for (let j = 1; j <= 3; j++) {
      const dd = front + j * 1.6; if (dd > steps - 1) continue;
      const x = bx + dd * sw, y = by - dd * sh;
      seg(h, [[x, y], [x, y - V(150, 130)]], 2.5, alpha(GOLD(), 0.55));
      text(h, `+${j * 8}s`, x, y - V(170, 150), { size: V(26, 30), color: alpha(GOLD(), 0.8), font: FONTS.ui, weight: 900 });
    }
    h.setLineDash([]); h.restore();
    UI.lineFigure(h, { x: bx - V(120, 100), y: by - sh * 0.2, s: V(0.75, 0.6), pose: POSES.point, color: alpha(GOLD(), 0.9), facing: 1 });
    for (let i = 0; i < 3; i++) {
      const d = 5 + i * 1.6; if (d > front) continue;
      UI.lineFigure(h, { x: bx + d * sw, y: by - d * sh, s: V(0.7, 0.56), pose: POSES.handsOnHead, color: alpha(c, 0.8), facing: -1 });
    }
  });
  UI.readout(g, { label: 'SPREAD RATE', value: '2 m / 8 s', x: V(150, 110), y: E.H - V(170, 340), color: GOLD(), size: V(52, 56), a: ease.out(prog(t, 0.3, 0.7)) });
  UI.readout(g, { label: 'TIME TO LANDING', value: `${Math.max(0, Math.round(118 - k * 76))} s`, x: V(150, 110), y: E.H - V(100, 250), color: alpha(CREAM(), 0.85), size: V(44, 48) });
  UI.badge(g, { str: 'MODEL: LIVE', x: E.W - V(110, 80), y: V(120, 190), color: BP(), a: ease.out(prog(t, 0.2, 0.5)) });
} });

// s102 — "two meters every eight seconds... the exits closing in under two minutes."
// The signature measurement beat: dimension arrows down the flight while the routes shut one by one.
registerShot('s102', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.04, 1.16, p);
  const cam = { z, x: lerp(30, -30, p), y: lerp(40, -140, p) };
  const st = { rise: V(44, 38), run: V(96, 78), x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  stairwell(g, t, cam, { mood: 'storm', fire: 0.28, smoke: 0.22, dir: -1 });   // the set applies its own parallax
  const tMeters = wordTime('meters', info.shot.start) ?? info.shot.start + 0.6;
  const tEight = wordTime('eight', info.shot.start) ?? tMeters + 0.8;
  const tClose = wordTime('closing', info.shot.start) ?? tMeters + 2.2;
  const foot = stepAt(st, 1), high = stepAt(st, 7);
  const fx = foot.x + st.dir * st.run * 0.5, hy = high.x + st.dir * st.run * 0.5;
  layer(g, cam, 0.55, (h) => {
    // the two measurement arrows, locked to the flight geometry
    UI.dimension(h, clamp(prog(info.globalT, tMeters, tMeters + 0.8)), {
      x1: fx + V(60, 50), y1: foot.y, x2: fx + V(60, 50), y2: high.y, str: '2 m', color: GOLD(), start: 0,
    });
    UI.dimension(h, clamp(prog(info.globalT, tEight, tEight + 0.8)), {
      x1: fx, y1: foot.y - V(70, 60), x2: hy, y2: high.y - V(70, 60), str: '8 s', color: GOLD(), start: 0,
    });
    for (let i = 1; i <= 6; i++) {                                       // the eight-second ticks along the flight
      const kk = ease.out(clamp(prog(info.globalT, tEight + i * 0.06, tEight + 0.5 + i * 0.06)));
      if (kk <= 0) continue;
      const q = stepAt(st, i);
      seg(h, [[q.x + st.dir * st.run * 0.5, q.y - V(30, 26) * kk], [q.x + st.dir * st.run * 0.5, q.y - V(66, 58) * kk]], 3, alpha(GOLD(), 0.6 * kk));
    }
    // three exit routes, shutting one at a time on "closing"
    const routes = [
      [[stepAt(st, 10).x + V(20, 18), stepAt(st, 10).y - V(120, 110)], [stepAt(st, 10).x - V(230, 190), stepAt(st, 10).y - V(210, 190)]],
      [[hy, high.y - V(100, 90)], [hy - V(260, 220), high.y - V(150, 130)]],
      [[fx, foot.y - V(90, 80)], [fx + V(250, 210), foot.y - V(120, 110)]],
    ];
    routes.forEach((r, i) => {
      const open = clamp(1 - prog(info.globalT, tClose + i * 0.42, tClose + 0.4 + i * 0.42));
      seg(h, r, 4, alpha(GOLD(), 0.75 * open + 0.08));
      if (open < 0.75) {
        const shut = ease.out(clamp((0.75 - open) / 0.4));
        const mx = lerp(r[0][0], r[1][0], 0.55), my = lerp(r[0][1], r[1][1], 0.55);
        const s = V(34, 30) * shut;
        seg(h, [[mx - s, my - s], [mx + s, my + s]], V(9, 8), alpha('#e04a3a', 0.9));
        seg(h, [[mx + s, my - s], [mx - s, my + s]], V(9, 8), alpha('#e04a3a', 0.9));
        ring(h, mx, my, s * 2.6 * (1 - shut * 0.3), 3, alpha('#e04a3a', 0.5 * (1 - shut)));
      }
    });
  });
  const left = Math.max(0, 118 - Math.round(prog(info.globalT, tClose, info.shot.end) * 118));
  UI.readout(g, { label: 'EXITS OPEN IN', value: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, x: V(150, 110), y: E.H - V(140, 300), color: left < 40 ? '#e04a3a' : GOLD(), size: V(54, 58) });
  UI.badge(g, { str: '2 m / 8 s', x: E.W - V(110, 80), y: V(130, 200), color: GOLD(), a: ease.out(prog(t, 0.4, 0.8)) });
} });

// s103 — "You could run the model." Insert: the running fire model, clean and blue, in his point of view.
registerShot('s103', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.12, 1.2, p);
  const cam = { z, x: lerp(-20, 26, p), y: -110 + 20 * p };
  const fire = 0.34 + 0.12 * p;
  blurLayer(g, 9, (h) => stairwell(h, t, cam, { mood: 'storm', fire, smoke: 0.45, dir: -1 }));
  veil(g, '#060a12', 0.55);
  const st = { rise: V(44, 38), run: V(96, 78), x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  const k = ease.inOut(prog(t, 0.1, 0.95));
  layer(g, cam, 0.55, (h) => {                                            // the overlay registers on the real steps
    for (let i = 0; i <= st.n; i++) {
      const q = stepAt(st, i);
      const alive = clamp(k * (st.n + 1) - i) > 0 ? 1 : 0.25;
      seg(h, [[q.x, q.y - st.rise], [q.x + st.dir * st.run, q.y - st.rise]], 3, alpha(BLUE_MODEL, 0.85 * alive));
      seg(h, [[q.x, q.y - st.rise], [q.x, q.y]], 3, alpha(BLUE_MODEL, 0.6 * alive));
    }
    for (const s2 of [0.45, 0.7, 0.95]) {                                 // the predicted front, three frames of it
      const kk = clamp(prog(k, s2 - 0.1, s2));
      if (kk <= 0) continue;
      const i = Math.round(kk * st.n), q = stepAt(st, i);
      seg(h, [[q.x + st.dir * st.run * 0.5, q.y - V(320, 280)], [q.x + st.dir * st.run * 0.5, q.y]], 2.5, alpha(BP(), 0.5 * kk));
      ring(h, q.x + st.dir * st.run * 0.5, q.y - V(160, 140), V(30, 26) * kk, 2.5, alpha(BP(), 0.6 * kk));
    }
    for (const [x, y] of [[st.x0 + st.dir * st.run * 5, st.y0 - st.rise * 5 - V(200, 180)]]) {
      glow(h, x, y, V(320, 280), BLUE_MODEL, 0.12 * k);
      UI.lineFigure(h, { x, y, s: V(0.85, 0.7), pose: POSES.handsOnHead, color: alpha(BLUE_MODEL, 0.75 * k), facing: -1 });
    }
  });
  // the POV HUD: reticle frame, corner brackets, the read-out
  g.save();
  rr(g, V(70, 46), E.H * 0.12, E.W - V(140, 92), E.H * 0.72, 26); g.strokeStyle = alpha(BP(), 0.28); g.lineWidth = 2; g.stroke();
  for (const [cx, cy, sx, sy] of [[V(110, 80), E.H * 0.17, 1, 1], [E.W - V(110, 80), E.H * 0.17, -1, 1], [V(110, 80), E.H * 0.8, 1, -1], [E.W - V(110, 80), E.H * 0.8, -1, -1]]) {
    seg(g, [[cx + sx * V(54, 44), cy], [cx, cy], [cx, cy + sy * V(54, 44)]], V(4, 3), alpha(GOLD(), 0.75 * k));
  }
  g.restore();
  UI.readout(g, { label: 'MODEL', value: 'RUNNING', x: V(150, 110), y: E.H * 0.9, color: BLUE_MODEL, size: V(42, 48), a: ease.out(prog(t, 0.2, 0.6)) });
  UI.badge(g, { str: 'CLEAN · BLUE', x: E.W - V(110, 80), y: V(120, 190), color: alpha(BLUE_MODEL, 0.9), a: ease.out(prog(t, 0.35, 0.7)) });
  FX.dust(g, t, { count: 12, color: RIMFIRE, a: 0.16 });
} });

// s104 — "Or you could run." Medium single: the model dissolving as he turns toward the door.
registerShot('s104', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.14, 1.22, p);
  const st = { rise: V(44, 38), run: V(96, 78), x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  const feet = stepAt(st, 3);
  const hx = feet.x + st.dir * st.run * 0.5;
  const cam = { z, x: lerp(70, -60, p), y: camY(feet.y, z) };
  stairwell(g, t, cam, { mood: 'storm', fire: 0.5, smoke: 0.42, dir: -1 });
  const run = wordTime('run', info.shot.start) ?? info.shot.start + 0.7;
  const turn = ease.inOut(clamp(prog(info.globalT, run, run + 0.34)));
  const hs = V(2.75, 2.5);
  layer(g, cam, 1, (h) => {
    const pose = blendPose(POSES.crossArms, POSES.point, turn);
    for (const [faceSign, al] of [[-1, 1 - turn], [1, turn]]) {           // the pivot: a crossfade, not a rubber-flip
      if (al <= 0.02) continue;
      drawHero(h, {
        x: hx, y: feet.y, s: hs, facing: faceSign, pose, alpha: al,
        expr: turn > 0.5 ? 'determined' : 'thinking', face: turn > 0.5 ? null : DEAD,
        look: [lerp(-0.5, 0.6, turn), -0.05],
        rim: { color: RIMFIRE, dir: [lerp(-0.65, 0.8, turn), -0.35], w: 4.5 }, shadow: true,
      });
    }
    if (turn > 0.15 && turn < 0.9) FX.speedLines(h, info.globalT, { cx: hx, cy: feet.y - hs * 120, count: 16, inner: V(120, 100), a: 0.16, color: '#e8f0f6', seed: 63 });
    // the dissolving model, camera-left
    modelPanel(h, E.W / 2 - V(600, 430), feet.y - V(300, 320), V(430, 340), V(300, 250), t, { a: 1 - turn, k: 0.42 });
    if (turn > 0.2) {                                                      // the door, hot and real
      const dx = E.W / 2 + V(620, 470);
      doorway(h, dx, stairGround(), { open: 1, glow: 0.8, color: '#3a2a2a' });
      FX.lightCone(h, dx, stairGround() - V(200, 190), { angle: Math.PI * 1.1, spread: 1.0, len: V(520, 430), color: FIRE, a: 0.16 * turn });
    }
  });
  layer(g, cam, 1, (h) => {                                               // the model panel breaking into blue motes
    const u = clamp((turn - 0.05) / 0.8); if (u <= 0) return;
    h.save(); h.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const r = rng(300 + i);
      const x = E.W / 2 - V(600, 430) + (r() - 0.5) * V(520, 420) * u;
      const y = feet.y - V(300, 320) - r() * V(260, 220) * u;
      circle(h, x, y, V(4, 3) * (1 - u * 0.6), alpha(BLUE_MODEL, 0.5 * (1 - u)));
    }
    h.restore();
  });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, E.W * 0.86, E.H * 0.55, V(500, 420), FIRE, 0.14 * turn);
  g.restore();
  UI.badge(g, { str: turn > 0.5 ? 'CHOSEN: RUN' : 'MODEL: 0.4 s', x: E.W - V(110, 80), y: V(120, 190), color: turn > 0.5 ? alpha(RIMFIRE, 0.9) : alpha(BLUE_MODEL, 0.9) });
} });

// s105 — "The genius thing... or the right thing." Two-shot on the street: model panel one side, burning doorway the other.
registerShot('s105', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.08, 1.03, p);
  const cam = { z, x: lerp(-95, 95, p), y: camY(cityGround(), z) };
  const GY = cityGround(), CX = E.W / 2;
  const doorX = CX + V(640, 470);
  city(g, t, cam, { mood: 'night', wet: true, rain: 0.14, fire: { x: doorX, y: GY - V(300, 280), a: 0.34 } });
  const hs = V(2.4, 2.2);
  layer(g, cam, 1, (h) => {
    doorway(h, doorX, GY, { open: 1, glow: 1, color: '#3a2a2a', w: V(240, 200), h: V(430, 520) });
    flames(h, doorX, GY - V(6, 6), V(200, 170), V(230, 210), t, { k: 0.85, a: 0.42, seed: 87 });
    FX.lightCone(h, doorX, GY - V(240, 230), { angle: Math.PI * 1.02, spread: 1.2, len: V(700, 560), color: FIRE, a: 0.14 });
    FX.pool(h, doorX + V(40, 34), GY + V(70, 60), V(300, 240), V(60, 48), FIRE, 0.16);
    modelPanel(h, CX - V(560, 380), GY - V(320, 380), V(420, 330), V(300, 250), t, { a: 0.95, k: 0.5 });
    drawHero(h, {
      x: CX - V(40, 30), y: GY, s: hs, facing: -1, pose: breathe(blendPose(POSES.crossArms, POSES.point, ease.inOut(prog(t, 1.1, 1.9))), t * 0.7, 0.5, 3),
      expr: 'thinking', face: DEAD, look: [-0.55, -0.15], rim: { color: RIMFIRE, dir: [0.78, -0.3], w: 4.5 }, shadow: true,
    });
    h.save(); h.globalCompositeOperation = 'lighter';                      // smoke leaving the door
    FX.fog(h, GY - V(400, 420), V(220, 240), '#3a4252', 0.18 * p);
    h.restore();
  });
  const genius = wordTime('genius', info.shot.start) ?? info.shot.start + 0.2;
  const right = wordTime('right', info.shot.start) ?? genius + 1.2;
  UI.callout(g, t, { at: scr(cam, 1, CX - V(560, 380), GY - V(430, 470)), to: [E.W * 0.2, E.H * 0.18], str: 'THE GENIUS THING', color: BLUE_MODEL, start: 0.15 });
  UI.callout(g, t, { at: scr(cam, 1, doorX, GY - V(360, 400)), to: [E.W * 0.82, E.H * 0.74], str: 'THE RIGHT THING', color: RIMFIRE, start: Math.min(clamp(right - info.shot.start, 0, info.dur), info.dur * 0.6) });
  UI.meter(g, 0, { x: V(140, 100), y: E.H - V(120, 260), w: V(430, 330), ticks: 12, label: 'REWARD', color: alpha(CREAM(), 0.35), speed: 0 });
  FX.rain(g, t, { a: 0.13, color: CREAM(), angle: 0.2, speed: 1100, count: 110, seed: 24 });
} });

// s106 — "You run." Reveal/flash: sprinting through the door into smoke.
registerShot('s106', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.24, 1.42, p);
  const [sx, sy] = shake(info.globalT, 9 + 9 * p, 19, 7);
  const cam = { z, x: lerp(-150, 240, p) + sx, y: camY(stairGround(), z) + sy, r: 0.012 * Math.sin(t * 9) };
  const GY = stairGround();
  stairwell(g, t, cam, { mood: 'storm', fire: 0.62, smoke: 0.5, dir: -1, landing: false });
  const doorX = E.W / 2 + V(520, 420), hs = V(2.3, 2.1);
  const hx = lerp(doorX - V(430, 340), doorX + V(150, 130), ease.in(p));
  layer(g, cam, 1, (h) => {
    doorway(h, doorX, GY, { open: lerp(0.2, 1, p), glow: 0.9, color: '#3a2a2a', w: V(250, 210), h: V(440, 520) });
    flames(h, doorX, GY, V(210, 180), V(240, 220), t, { k: 0.8, a: 0.45, seed: 93 });
    drawHero(h, {
      x: hx, y: GY, s: hs, facing: 1, pose: walkPose(t * Math.PI * 2 * 1.9, { run: true }),
      expr: 'determined', rim: { color: RIMFIRE, dir: [0.55, -0.5], w: 5 }, shadow: false,
      trail: { count: 4, dx: -V(78, 66), a: 0.24 },
    });
    FX.speedLines(h, info.globalT, { cx: hx, cy: GY - hs * 118, count: 42, inner: V(150, 130), a: 0.3, color: '#fff3e2', seed: 6 });
  });
  g.save(); g.globalCompositeOperation = 'lighter';                        // the white-hot core of the entry
  const flash = clamp(1 - t / (info.dur * 0.6));
  g.fillStyle = alpha(FIRE_HOT, 0.5 * flash); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  glow(g, ...scr(cam, 1, doorX, GY - V(220, 240)), V(700, 600) * (0.6 + flash), FIRE_HOT, 0.3 * flash);
  g.restore();
  FX.fog(g, E.H * 0.2, E.H * 0.5, '#4a4250', 0.22 * p);
  UI.badge(g, { str: 'THROUGH', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.85) });
} });

// s107 — "You take the stairs two at a time..." Action wide up the flight, every edge rimmed by the fire.
registerShot('s107', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.14, 1.24, p);
  const st = { rise: V(44, 38), run: V(96, 78), x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  const climb = 1 + 6 * p;
  const feet = stepAt(st, Math.round(climb));
  const cam = { z, x: lerp(60, -30, p), y: camY(feet.y, z) - 40 };
  stairwell(g, t, cam, { mood: 'storm', fire: 0.75, smoke: 0.6, dir: -1 });
  const hs = V(2.2, 2.05), ls = V(2.1, 1.95);
  layer(g, cam, 1, (h) => {
    // the family of three coming down past him, held a fixed two treads above his feet so they stay framed
    const famTop = Math.round(climb) + 2;
    for (const [i, of, expr, seed] of [[famTop, FAMILY[0], 'scared', 11], [famTop - 1, FAMILY[1], 'worried', 12], [famTop - 2, FAMILY[2], 'scared', 13]]) {
      const q = onStep(st, i => stepAt(st, i), i);
      drawFigure(h, {
        x: q.x, y: q.y, s: ls * (of.kid ? 0.78 : 1), facing: 1, outfit: of, pose: walkPose((t + seed) * Math.PI * 2 * 0.9),
        expr, rim: { color: RIMFIRE, dir: [0.7, -0.35], w: 4 }, shadow: false, dim: true, blink: false,
      });
    }
    const me = onStep(st, i => stepAt(st, Math.round(i)), climb);
    drawHero(h, {
      x: me.x, y: me.y, s: hs, facing: -1, pose: walkPose(t * Math.PI * 2 * 1.7, { run: true }),
      expr: 'determined', rim: { color: RIMFIRE, dir: [0.82, -0.28], w: 5 }, shadow: false, look: [-0.6, -0.15],
      trail: { count: 3, dx: V(70, 60), a: 0.18 },
    });
  });
  g.save(); g.globalCompositeOperation = 'lighter';                        // ember lift through the smoke
  FX.fog(g, E.H * 0.08, E.H * 0.5, '#46404e', 0.24);
  const r = rng(415);
  for (let i = 0; i < 16; i++) {
    const u = prog(t, r() * 0.9, 0.8 + r() * 1.6);
    if (u <= 0 || u >= 1) continue;
    const x = E.W * 0.78 + (r() - 0.5) * V(700, 560) - u * V(120, 100);
    const y = E.H * 0.92 - u * E.H * 0.8;
    circle(g, x, y, V(3.4, 3) * (0.5 + r() * 0.9), alpha(i % 2 ? FIRE_HOT : FIRE, 0.7 * (1 - u * 0.5)));
  }
  g.restore();
  UI.badge(g, { str: 'TWO AT A TIME', x: E.W - V(110, 80), y: V(120, 190), color: alpha(RIMFIRE, 0.85), a: ease.out(prog(t, 0.3, 0.7)) });
} });

// s108 — "...dragging a confused family past the smoke..." Interaction: he pulls the family of three down.
registerShot('s108', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.16, 1.24, p);
  const st = { rise: V(44, 38), run: V(96, 78), x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  const me = onStep(st, i => stepAt(st, i), 6);
  const cam = { z, x: lerp(-40, 30, p), y: camY(me.y, z) };
  stairwell(g, t, cam, { mood: 'storm', fire: 0.72, smoke: 0.62, dir: -1 });
  const hs = V(2.75, 2.5), fs = V(2.5, 2.3);
  layer(g, cam, 1, (h) => {
    // the wall of smoke they are being pulled out of, right where they came from
    h.save(); h.globalCompositeOperation = 'lighter';
    FX.fog(h, me.y - V(430, 470), V(400, 460), '#4a4452', 0.42);
    h.restore();
    const lean = ease.out(prog(t, 0.2, 1.1));
    const line = [7, 8, 9];                                             // the chain of them, one tread further up each
    for (let i = 0; i < 3; i++) {
      const q = onStep(st, i => stepAt(st, i), line[i]);
      const dragged = i === 0 ? blendPose(POSES.stand, POSES.reachBall, lean * 0.8) : walkPose((t + i * 0.4) * Math.PI * 2 * 0.95, { run: true });
      drawFigure(h, {
        x: q.x + (i === 0 ? lerp(0, -V(30, 26), lean) : 0), y: q.y, s: fs * (FAMILY[i].kid ? 0.8 : 1), facing: -1, outfit: FAMILY[i],
        pose: dragged, expr: 'confused', rim: { color: RIMFIRE, dir: [0.72, -0.35], w: 4 }, shadow: false, blink: false,
        contact: i === 0 ? { hand: 'B' } : null,
      });
    }
    drawHero(h, {
      x: me.x, y: me.y, s: hs, facing: -1, pose: blendPose(POSES.reach, { ...POSES.reach, eF: [30, -178], hF: [54, -196] }, lean),
      expr: 'determined', look: [-0.55, -0.35], rim: { color: RIMFIRE, dir: [0.8, -0.3], w: 5 }, shadow: false,
      contact: { hand: 'F' },
    });
    // the grip, held on his fingertips
    const gx = me.x + 54 * hs * -1, gy = me.y - 196 * hs;
    circle(h, gx, gy, V(9, 8), alpha(RIMFIRE, 0.5 * lean));
    FX.rings(h, gx, gy, t, { count: 2, r0: V(40, 34), r1: V(120, 100), speed: 1.1, color: RIMFIRE, a: 0.2 * lean });
    text(h, 'FAMILY × 3', gx - V(190, 150), gy - V(120, 110), { size: V(26, 30), color: alpha(CREAM(), 0.55 + 0.3 * lean), font: FONTS.ui, weight: 900, align: 'center', spacing: 2 });
  });
  UI.badge(g, { str: 'PULL: ON', x: E.W - V(110, 80), y: V(120, 190), color: alpha(RIMFIRE, 0.85) });
  FX.dust(g, t, { count: 14, color: '#d8cfc0', a: 0.18 });
} });

// s109 — "...finding Leo by the one window still clear..." Medium single: Leo at the landing window, the hero reaching up.
registerShot('s109', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.2, 1.3, p);
  const st = { rise: V(44, 38), run: V(96, 78), x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  const land = stepAt(st, 11);
  const cam = { z, x: lerp(110, 60, p), y: lerp(-250, -300, p) };
  const { M } = stairwell(g, t, cam, { mood: 'storm', fire: 0.8, smoke: 0.48, dir: -1 });
  const winX = land.x + V(180, 150), winY = land.y - V(520, 640), winW = V(230, 190), winH = V(260, 300);
  const ls = V(2.1, 2.0);
  layer(g, cam, 1, (h) => {
    drawFigure(h, {
      x: land.x + st.dir * st.run * 0.5 + V(60, 50), y: land.y, s: ls, facing: -1, outfit: LEO,
      pose: breathe(blendPose(POSES.handsOnHead, POSES.pointUp, ease.out(prog(t, 0.9, 1.6))), t * 1.5, 1.3, 6),
      expr: 'scared', rim: { color: RIMFIRE, dir: [0.58, -0.55], w: 4.5 }, shadow: false, look: [-0.3, 0.5],
      blink: (t % 3.2) > 3.08,
    });
    // clear glass in the middle of all that smoke: the one readable window
    h.save(); h.globalCompositeOperation = 'lighter';
    glow(h, winX, winY + winH * 0.5, winW * 1.9, M.rim, 0.16);
    windowSpill(h, winX, winY + winH * 0.5, winW * 0.9, 0.8, RIMFIRE);
    h.restore();
    const r = rng(519);
    for (let i = 0; i < 5; i++) {                                          // glass still intact: a few cold specks
      circle(h, winX + (r() - 0.5) * winW * 0.8, winY + r() * winH * 0.8, V(3, 2.6), alpha(M.rim, 0.35));
    }
  });
  // the hero reaching up into the frame from the step below (deliberate foreground crop)
  const below = onStep(st, i => stepAt(st, i), 7);
  blurLayer(g, 3.5, (h) => {
    const hs2 = V(2.6, 2.4);
    drawHero(h, {
      x: below.x + V(120, 100), y: below.y + V(40, 34), s: hs2, facing: -1,
      pose: blendPose(POSES.reach, POSES.pointUp, 0.35), expr: 'determined', look: [0.4, -0.7],
      rim: { color: RIMFIRE, dir: [0.5, -0.7], w: 5 }, shadow: false,
    });
  }, cam, 1.15);
  FX.fog(g, E.H * 0.1, E.H * 0.42, '#453f4c', 0.2);
  UI.badge(g, { str: 'ONE WINDOW CLEAR', x: E.W - V(110, 80), y: V(120, 190), color: alpha(M.rim, 0.85), a: ease.out(prog(t, 0.3, 0.7)) });
} });

// s110 — "...hauling him out seconds before the hallway folds in on itself." Reveal: debris, the haul, the collapse.
registerShot('s110', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.16, 1.24, p);
  const ss = 0.62;
  const st = { rise: V(44, 38) * ss, run: V(96, 78) * ss, x0: E.W / 2 + V(560, 430), y0: stairGround() + V(40, 30), n: 11, dir: -1 };
  const haul = ease.inOut(prog(t, 0.15, 0.7));
  const me = { x: stepAt(st, 7).x + st.dir * st.run * 0.5, y: stepAt(st, 7).y };
  const cam = { z, x: lerp(20, -40, p), y: camY(me.y, z) };
  stairwell(g, t, cam, { mood: 'storm', fire: 0.8, smoke: 0.7, dir: -1, s: ss, debris: clamp(prog(t, 0.65, 1.2)) });
  const hs = V(2.5, 2.3), ls2 = V(2.0, 1.85);
  const [shx, shy] = shake(info.globalT, 7 + 10 * prog(t, 0.6, 1.9), 15, 9);
  g.save(); g.translate(shx, shy);
  layer(g, cam, 1, (h) => {
    const leoStart = { x: stepAt(st, 11).x + st.dir * st.run * 0.5, y: stepAt(st, 11).y };
    const lx = lerp(leoStart.x, me.x + V(150, 130), haul), ly = lerp(leoStart.y, me.y, haul);
    drawFigure(h, {
      x: lx, y: ly, s: ls2, facing: -1, outfit: LEO, pose: blendPose(POSES.reach, walkPose(t * Math.PI * 2 * 1.4, { run: true }), haul),
      expr: 'scared', rim: { color: RIMFIRE, dir: [0.62, -0.5], w: 4.5 }, shadow: false, look: [-0.5, 0.2],
    });
    drawHero(h, {
      x: me.x, y: me.y, s: hs, facing: 1, pose: blendPose(POSES.reachBall, POSES.stand, haul * 0.8),
      expr: 'determined', rim: { color: RIMFIRE, dir: [0.75, -0.38], w: 5 }, shadow: false, look: [-0.6, -0.2],
      contact: { hand: 'F' },
    });
    const gripX = me.x + 62 * hs, gripY = me.y - 180 * hs;
    seg(h, [[gripX, gripY], [lx - 30 * ls2, ly - 150 * ls2]], V(7, 6), alpha(RIMFIRE, 0.55 * haul));
    // the hallway folding in behind them
    const col = clamp(prog(t, 0.75, 1.9));
    if (col > 0) {
      const bx = lerp(stepAt(st, 10).x, stepAt(st, 6).x, 0.5), by = stepAt(st, 10).y;
      debris(h, bx, by - V(120, 110), { seed: 33, s: V(1.3, 1.1), a: col });
      debris(h, bx - V(220, 180), by - V(60, 54), { seed: 37, s: V(1.1, 0.95), a: col });
      h.save(); h.globalCompositeOperation = 'lighter';
      for (const [rx, ry] of [[bx, by - V(180, 160)], [bx - V(240, 200), by - V(90, 80)]]) {
        const L = V(420, 360) * col;
        seg(h, [[rx, ry], [rx + L * 0.6, ry - L * 0.5]], V(14, 12) * (1 - col), alpha('#efe2cf', 0.5 * (1 - col)));
        seg(h, [[rx, ry], [rx - L * 0.5, ry + L * 0.3]], V(10, 9) * (1 - col), alpha('#efe2cf', 0.4 * (1 - col)));
      }
      h.restore();
      FX.fog(h, by - V(260, 240), V(420, 380), '#544a52', 0.4 * col);
      const fl = clamp(1 - prog(t, 0.8, 1.15));
      if (fl > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha(FIRE_HOT, 0.4 * fl); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore(); }
      const r = rng(777);
      for (let i = 0; i < 20; i++) {
        const u = prog(t, 0.75 + r() * 0.3, 1.4 + r() * 1.0);
        if (u <= 0) continue;
        const x = bx + (r() - 0.5) * V(900, 700), y = by - V(300, 260) + u * (V(300, 260) + r() * V(200, 170));
        circle(h, x, y, V(6, 5) * (0.4 + r() * 0.8), alpha('#2b2530', 0.7 * (1 - u * 0.4)));
      }
    }
  });
  g.restore();
  const [hcx, hcy] = scr(cam, 1, me.x, me.y - 200 * hs);
  UI.callout(g, t, { at: [hcx + shx, hcy + shy], to: [E.W * 0.2, E.H * 0.2], str: 'HAUL: 3.1 s', color: alpha(CREAM(), 0.9), start: 0.3 });
  UI.badge(g, { str: 'SECONDS', x: E.W - V(110, 80), y: V(120, 190), color: alpha(RIMFIRE, 0.9), a: ease.out(prog(t, 0.2, 0.5)) });
} });

// s111 — "Outside, soot on your face, Leo coughs out a laugh." Wide: wet pavement carrying the fire glow.
registerShot('s111', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const z = lerp(1.16, 1.08, p);
  const GY = streetGround(), CX = E.W / 2;
  const cam = { z, x: lerp(-30, 40, p), y: camY(GY, z) };
  const fireX = CX + V(360, 300), fireY = GY - V(430, 560);
  apartmentBlock(g, t, cam, { mood: 'night', fire: { x: fireX, y: fireY, a: 0.55 }, rows: 5, cols: 5, lit: 0.22, rain: 0.08 });
  const hs = V(2.6, 2.4), ls2 = V(2.5, 2.3);
  const hx = CX - V(190, 160), lx = CX + V(150, 130);
  const cough1 = ease.out(prog(t, 0.3, 0.7));
  const cough2 = ease.out(prog(t, 0.9, 1.4));
  layer(g, cam, 1, (h) => {
    drawHero(h, {
      x: hx, y: GY, s: hs, facing: 1, pose: blendPose(POSES.handsOnHead, POSES.relaxed, cough1),
      expr: cough1 > 0.6 ? 'worried' : 'scared', face: DEAD, rim: { color: RIMFIRE, dir: [0.6, -0.55], w: 4.5 }, shadow: true,
      blink: (t % 2.9) > 2.8,
    });
    drawFigure(h, {
      x: lx, y: GY, s: ls2, facing: -1, outfit: LEO, pose: blendPose(POSES.handsOnHead, POSES.relaxed, cough2),
      expr: cough2 > 0.7 ? 'smile' : 'cry', rim: { color: RIMFIRE, dir: [0.72, -0.42], w: 4.5 }, shadow: true,
      look: [-0.4, 0.2], blink: (t % 3.3) > 3.18,
    });
    // soot: on the faces and across the shoulders
    soot(h, hx + 8 * hs, GY - 208 * hs, 34 * hs, { a: 0.85, streak: 1 });
    soot(h, lx - 8 * ls2, GY - 208 * ls2, 33 * ls2, { a: 0.8, seed: 61, streak: 1 });
    soot(h, hx, GY - 168 * hs, 40 * hs, { a: 0.45, seed: 63 });
    soot(h, lx, GY - 168 * ls2, 40 * ls2, { a: 0.45, seed: 64 });
    // cough puffs
    for (const [cx2, base] of [[hx + 40 * hs, 0.4], [lx - 40 * ls2, 1.0]]) {
      const r = rng(88);
      for (let i = 0; i < 5; i++) {
        const u = prog(t, base + i * 0.1, base + 0.9 + i * 0.1);
        if (u <= 0 || u >= 1) continue;
        circle(h, cx2 + u * V(70, 60) * (0.5 + r() * 0.5), GY - 190 * (i % 2 ? hs : ls2) - u * V(40, 36), V(9, 8) * (0.4 + u), alpha('#c8c0b8', 0.16 * (1 - u)));
      }
    }
    h.save(); h.globalCompositeOperation = 'lighter';                      // the fire glow on the wet pavement
    poly(h, [[fireX - V(160, 130), GY], [fireX + V(160, 130), GY], [fireX + V(420, 330), GY + V(300, 250)], [fireX - V(420, 330), GY + V(300, 250)]], alpha(FIRE, 0.13));
    FX.pool(h, (hx + lx) / 2, GY + V(60, 50), V(420, 330), V(70, 56), FIRE, 0.14);
    h.restore();
  });
  FX.dust(g, t, { count: 16, color: '#c8bfae', a: 0.16 });
  UI.callout(g, t, { at: scr(cam, 0.45, fireX, fireY), to: [E.W * 0.82, E.H * 0.24], str: 'STAIRWELL: GONE', color: alpha(RIMFIRE, 0.9), start: 0.5 });
} });

// s112 — "Still think I'm not surprising?" Giant close-up: Leo, lip-synced to his own line.
registerShot('s112', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const M = mood('night');
  blurLayer(g, 12, (h) => apartmentBlock(h, t, { z: 1.55, x: -160, y: -150 }, { mood: 'night', fire: { x: E.W * 0.78, y: E.H * 0.42, a: 0.5 }, rain: 0.1 }));
  veil(g, '#0a0c14', 0.42);
  const cx = E.W / 2 + V(40, 0), cy = E.H * V(0.6, 0.52);
  const r = V(300, 330) * (1 + 0.04 * p);
  const lineEnd = info.shot.start + info.dur * 0.72;
  bigFace(g, cx, cy, r, {
    outfit: LEO, expr: 'smile', talk: talkAmount(info.globalT, info.shot.start, lineEnd),
    blink: (t % 3.4) > 3.28, look: [-0.2, 0.06], rimColor: RIMFIRE, rimSide: -1, tilt: -0.03,
  });
  soot(g, cx + r * 0.3, cy - r * 0.2, r * 0.42, { a: 0.7, seed: 71 });
  soot(g, cx - r * 0.42, cy + r * 0.3, r * 0.3, { a: 0.55, seed: 72 });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx + r * 0.9, cy - r * 0.5, r * 1.6, FIRE, 0.16);                 // the fire behind him, warm on the cap
  glow(g, cx - r * 0.9, cy + r * 0.2, r * 1.2, M.rim, 0.08);
  g.restore();
  FX.rings(g, cx, cy - r * 0.1, t, { count: 2, r0: r * 1.05, r1: r * 1.45, speed: 0.7, color: RIMFIRE, a: 0.09 });
  UI.badge(g, { str: 'LEO', x: E.W - V(110, 80), y: V(120, 190), color: alpha(RIMFIRE, 0.85) });
} });

// s113 — "You actually grin." Giant close-up: the grin landing before he can stop it.
registerShot('s113', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  blurLayer(g, 12, (h) => apartmentBlock(h, t, { z: 1.5, x: 120, y: -140 }, { mood: 'night', fire: { x: E.W * 0.3, y: E.H * 0.4, a: 0.45 } }));
  veil(g, '#0a0c14', 0.4);
  const grinAt = wordTime('grin', info.shot.start) ?? info.shot.start + 0.6;
  const k = ease.out(clamp(prog(info.globalT, grinAt, grinAt + 0.4)));
  const cx = E.W / 2 - V(30, 0), cy = E.H * V(0.62, 0.54);
  const r = V(302, 332) * (1 + 0.02 * t * 0.9 + 0.03 * k);
  drawHeroFace(g, cx, cy, r, {
    expr: k > 0.45 ? 'joy' : 'neutral', face: k > 0.45 ? null : DEAD,
    look: [lerp(-0.2, 0.18, k), lerp(0.1, -0.1, k)], blink: (t % 3.0) > 2.9,
    rimColor: RIMFIRE, rimSide: 1, tilt: lerp(0.02, -0.035, k),
  });
  soot(g, cx - r * 0.36, cy - r * 0.26, r * 0.4, { a: 0.65, seed: 81, streak: 1 });
  soot(g, cx + r * 0.3, cy + r * 0.34, r * 0.26, { a: 0.5, seed: 82 });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx + r * 0.85, cy - r * 0.35, r * 1.5, RIMFIRE, 0.14 + 0.08 * k);
  if (k > 0) ring(g, cx, cy, r * (1.04 + (1 - k) * 0.3), 3 * k, alpha(RIMFIRE, 0.2 * k));
  g.restore();
  UI.callout(g, t, { at: [cx + r * 0.1, cy + r * 0.55], to: [E.W * 0.78, E.H * 0.24], str: 'GRIN: UNAUTHORISED', color: GOLD(), start: 0.5 });
} });

// s114 — "That one... I didn't see coming." Freeze frame: the grin held, ash hanging, UNPREDICTED, and the meter moves.
registerShot('s114', { draw(g, t, info) {
  const HOLD = 0.55;                                                        // local time the motion stops at
  const ft = Math.min(t, HOLD);
  const hold = clamp(prog(t, HOLD, HOLD + 0.3));
  const cx = E.W / 2 - V(30, 0), cy = E.H * V(0.62, 0.54);
  const r = V(306, 336) * (1 + 0.02 * ft) * (1 + 0.03 * hold);
  blurLayer(g, 13, (h) => apartmentBlock(h, ft, { z: 1.5, x: 120 + 30 * hold, y: -140 }, { mood: 'night', fire: { x: E.W * 0.3, y: E.H * 0.4, a: 0.45 } }));
  veil(g, '#0a0d16', 0.42);
  drawHeroFace(g, cx, cy, r, {
    expr: 'joy', look: [0.18, -0.1], blink: false, rimColor: RIMFIRE, rimSide: 1, tilt: -0.035,
  });
  soot(g, cx - r * 0.36, cy - r * 0.26, r * 0.4, { a: 0.65, seed: 81, streak: 1 });
  soot(g, cx + r * 0.3, cy + r * 0.34, r * 0.26, { a: 0.5, seed: 82 });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, cx + r * 0.85, cy - r * 0.35, r * 1.5, RIMFIRE, 0.15);
  g.restore();
  // ash hanging dead still: FX.dust is time-driven, so it is drawn at the clamped local time
  FX.dust(g, ft, { count: 46, color: '#e8dcc8', a: 0.34, size: 2.2, area: [E.W * 0.06, E.H * 0.08, E.W * 0.88, E.H * 0.84], speed: 14 });
  FX.drops(g, ft, { count: 14, area: [cx - r * 1.1, cy - r * 1.1, r * 2.2, r * 2.2], rMin: 2, rMax: 7, color: '#f0e2c8', drift: 0 });
  for (let i = 1; i <= 3; i++) {                                            // echo ghosts of the last three frames
    g.save(); g.globalAlpha = 0.07;
    drawHeroFace(g, cx - i * V(26, 22), cy, r * (1 - i * 0.012), { expr: 'joy', look: [0.18, -0.1], rimColor: RIMFIRE, rimSide: 1, tilt: -0.035 + i * 0.012 });
    g.restore();
  }
  // motif 5: the reward meter, flat all film, spiking once — here
  const spike = ease.out(clamp(prog(t, HOLD + 0.15, HOLD + 0.7)));
  const mx = V(150, 110), my = E.H - V(190, 340), mw = V(560, 420);
  UI.meter(g, spike * 14, { x: mx, y: my, w: mw, ticks: 20, label: 'REWARD', color: alpha(GOLD(), 0.45 + 0.55 * spike), start: 0, speed: 0 });
  if (spike > 0.1) {
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, mx + mw * spike, my, V(160, 140) * spike, GOLD(), 0.3 * spike);
    g.restore();
    text(g, '×1', mx + mw + V(46, 34), my, { size: V(34, 40), color: alpha(GOLD(), spike), font: FONTS.ui, weight: 900, align: 'left', glow: 14, glowColor: alpha(GOLD(), 0.5) });
  }
  // the badge that breaks the four-badge comedy set, in the corner
  stamp(g, E.W - V(360, 260), V(170, 260), V(0.95, 0.8), 'UNPREDICTED', { k: ease.outBack(clamp(prog(t, HOLD + 0.05, HOLD + 0.4))), color: '#c8493a', rot: -0.09 });
  UI.badge(g, { str: 'FREEZE', x: E.W - V(110, 80), y: V(260, 380), color: alpha(CREAM(), 0.85), a: hold });
} });
