// shots/10_systems.js — s043–s051: act 2, the systems. City wireframes, the crash, the 3D intersection, the red light.
import { E, V, registerShot, layer, S, mood, ease, prog, clamp, alpha, seg, circle, glow, text, wordTime, rng, FONTS, lerp, blurLayer, veil } from '/engine/core.js';
import { POSES, breathe, walkPose } from '/engine/rig2d.js';
import { drawHero } from '/engine/characters.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { city, trafficLight } from '../sets/city.js';
import { kitchen } from '../sets/kitchen.js';
import { voidSet, ruleBar } from '../sets/void.js';

const GOLD = () => S().ui.gold;
const BP = () => S().ui.blueprint;
const CREAM = () => S().ui.cream;
const RED = '#e04a3a';
const GREEN = '#6fc07a';

// One price curve for the crash beats: a calm climb, then the drop.
// i = curve sample (0..1), tnow = how far time has come (0..1); returns [x, y] in chart space or null.
const crashCurve = (cw, ch, i, tnow, opts = {}) => {
  const { shift = 0, rise = 0.18, dropAt = 0.6, floor = 0.88 } = opts;
  const x = 26 + i * (cw - 52);
  const u = i + shift;
  const yBase = ch - 34 - rise * ch * 0.45 * u;
  const y = u >= dropAt ? yBase + (u - dropAt) * ch * 1.05 : yBase;
  const capY = ch - 18 - (1 - floor) * ch * 0.35;                 // floor caps the crash downward, never clamps the climb
  return [x, Math.min(capY, y)];
};

function drawCurve(g, x0, y0, cw, ch, opts, k, dash) {
  if (k <= 0) return null;
  const pts = [];
  for (let s = 0; s <= 46; s++) {
    const i = (s / 46) * clamp(k, 0, 1);
    pts.push(crashCurve(cw, ch, i, k, opts));
  }
  g.save(); g.translate(x0, y0);
  g.setLineDash(dash ? [12, 9] : []);
  seg(g, pts, opts.w || 4.5, alpha(opts.color, opts.a ?? 0.9));
  g.setLineDash([]);
  const tip = pts[pts.length - 1];
  g.restore();
  return k >= 0.999 ? null : tip;
}

// ---------- chapter ----------
// s043 — "But where it gets really crazy..." chapter line over a wide dusk city, traffic moving below.
registerShot('s043', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.02, 1.09, p), x: lerp(-50, 50, p), y: lerp(6, -16, p) };
  const { GY, CX, M } = city(g, t, cam, {
    mood: 'dusk', lit: 0.24,
    cars: [
      { x: -300 + (t * V(560, 480)) % (E.W + 700), color: '#262c38', head: 0.9, dir: 1 },
      { x: E.W + 300 - ((t * V(420, 360)) % (E.W + 700)), color: '#1f242e', tail: 0.8, dir: -1 },
      { x: -260 + ((t * V(470, 410) + 900) % (E.W + 700)), color: '#2b3040', head: 0.5, dir: 1 },
    ],
  });
  UI.bigLine(g, t, { str: 'BUT WHERE IT GETS REALLY CRAZY', dur: info.dur, y: E.H * V(0.42, 0.34), size: V(78, 72) });
  const a = ease.out(prog(t, 0.3, 0.65));
  g.save(); g.globalAlpha = a;
  seg(g, [[E.W / 2 - V(320, 250), E.H * V(0.5, 0.41)], [E.W / 2 + V(320, 250), E.H * V(0.5, 0.41)]], 3, GOLD());
  text(g, 'ACT TWO · SYSTEMS', E.W / 2, E.H * V(0.56, 0.46), { size: V(28, 32), color: alpha(CREAM(), 0.75), font: FONTS.ui, weight: 900, spacing: 6 });
  g.restore();
  veil(g, '#12141c', 0.22);
  FX.dust(g, t, { count: 14, color: M.rim, a: 0.12 });
} });

// s044 — "is the systems." Reveal: wireframe overlays boot up across the street as the hero walks; camera pulls out and up.
const BUILD = () => [[-V(800, 640), V(300, 250), -V(360, 300)], [-V(430, 360), V(260, 220), -V(300, 250)],
  [V(190, 160), V(290, 245), -V(375, 310)], [V(540, 430), V(270, 228), -V(315, 262)]];
registerShot('s044', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.3, 1.02, p), x: lerp(40, -20, p), y: lerp(30, -60, p) };
  const { GY, CX, M } = city(g, t, cam, { mood: 'dusk', lamps: true });
  layer(g, cam, 0.62, (h) => {
    const k = prog(t, 0.05, 1.25);
    h.save(); h.globalCompositeOperation = 'lighter';
    for (const [bx, bw, btop] of BUILD()) {                                          // facade wireframes, edge-lit like the skyline
      const x = CX + bx, y0 = GY - V(150, 130), y1 = y0 + btop;
      const kk = ease.out(clamp(prog(t, 0.05 + (bx + V(800, 640)) / V(1900, 1500) * 0.7, 0.4 + (bx + V(800, 640)) / V(1900, 1500) * 0.7)));
      if (kk <= 0) continue;
      h.strokeStyle = alpha(BP(), 0.5 * kk); h.lineWidth = 2.5;
      h.strokeRect(x, y1, bw, y0 - y1);
      for (let i = 1; i < 4; i++) { const yy = y1 + (y0 - y1) * (i / 4); seg(h, [[x, yy], [x + bw * kk, yy]], 1.5, alpha(BP(), 0.3 * kk)); }
      for (const cxo of [x + bw * 0.3, x + bw * 0.7]) seg(h, [[cxo, y1], [cxo, y1 + (y0 - y1) * kk]], 1.5, alpha(BP(), 0.3 * kk));
      for (const [cx, cw] of [[x, 8], [x + bw - 8, 8]]) {                            // corner brackets
        seg(h, [[cx, y1 + 26], [cx, y1], [cx + (cx === x ? 26 : -26), y1]], 3, alpha(GOLD(), 0.7 * kk));
      }
    }
    // street grid: the kerb line, the centre dashes and the crosswalk re-read as data lines
    const sk = ease.out(prog(t, 0.15, 1.1));
    h.strokeStyle = alpha(GOLD(), 0.4 * sk); h.lineWidth = 2.5;
    seg(h, [[CX - V(900, 700) * sk, GY - V(150, 130)], [CX + V(900, 700) * sk, GY - V(150, 130)]], 2.5, alpha(GOLD(), 0.4 * sk));
    seg(h, [[CX - V(900, 700) * sk, GY + V(120, 110)], [CX + V(900, 700) * sk, GY + V(120, 110)]], 2.5, alpha(GOLD(), 0.4 * sk));
    for (let i = 0; i < 6; i++) {
      const kk = prog(t, 0.3 + i * 0.09, 0.55 + i * 0.09);
      if (kk <= 0) continue;
      const x = CX - V(280, 220) + i * V(112, 88);
      seg(h, [[x, GY - V(20, 18)], [x + V(34, 26), GY + V(150, 130)]], 2, alpha(GOLD(), 0.5 * kk));
    }
    for (let i = 0; i < 5; i++) {                                                    // data dots riding the lines
      const u = (0.18 + t * 0.35 + i * 0.2) % 1;
      const x = lerp(CX - V(900, 700), CX + V(900, 700), u);
      if (sk > 0.5) circle(h, x, GY + V(120, 110), 5, alpha(GOLD(), 0.55 * sk * (1 - Math.abs(u - 0.5) * 0.6)));
    }
    h.restore();
  });
  layer(g, cam, 1, (h) => {
    const s = V(2.3, 2.1), hx = CX - V(560, 430) + 160 * s * t * 0.92;
    const ph = t * Math.PI * 2 * 0.9;
    drawHero(h, { x: hx, y: GY, s, facing: 1, pose: walkPose(ph), expr: 'thinking',
      rim: { color: M.rim, dir: [0.5, -0.7], w: 4 }, blink: (t % 3.1) > 3.0 });
    const wk = ease.out(prog(t, 0.4, 0.9));
    if (wk > 0) {                                                                    // walking-wave ticks under his feet
      for (let i = 0; i < 3; i++) {
        const x = hx - V(60, 50) * (i + 1) + (ph % (Math.PI * 2)) * 8;
        seg(h, [[x, GY + 2], [x, GY - 14 * wk * (1 - i * 0.25)]], 2.5, alpha(GOLD(), 0.35 * wk));
      }
    }
  });
  UI.callout(g, t, { at: [E.W * 0.5 + V(60, 50), GY], to: [E.W * 0.82, E.H * 0.2], str: 'GRID: LIVE', color: GOLD(), start: 0.55 });
  UI.badge(g, { str: 'SYSTEMS ONLINE', x: E.W - V(110, 80), y: V(120, 190), color: GOLD(), a: ease.out(prog(t, 0.7, 1.0)) });
} });

// ---------- the crash ----------
// s045 — "You glance at a stock chart once and see the crash three days early." (part 1: the phone)
// Insert: phone screen stock chart; the dashed prediction line crashes three days before the real curve.
registerShot('s045', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.1, 1.2, p), x: lerp(-16, 12, p), y: -20 };
  const { GY, CX, M } = kitchen(g, t, cam, { mood: 'interiorWarm', view: 'night' });
  layer(g, cam, 1, (h) => {
    h.fillStyle = alpha('#0c0a12', 0.55); h.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    const pw = V(430, 480), phh = V(760, 820);
    const sx = CX + V(150, 0) - pw / 2, sy = E.H / 2 - phh / 2 - V(10, 0);
    FX.screen(h, { x: sx, y: sy, w: pw, h: phh, bg: '#101c28', glowC: '#7fd0d6', a: 0.3 }, (gc, x, y, w, hh) => {
      const r = rng(405);
      gc.fillStyle = alpha(BP(), 0.08);                                             // chart grid
      for (let i = 1; i < 5; i++) gc.fillRect(26, y + (hh * (0.2 + i * 0.16)) - y, w - 52, 1.5);
      text(gc, 'INDEX 348', x + w - 24, y + 40, { size: V(22, 26), color: alpha(CREAM(), 0.7), font: FONTS.ui, weight: 900, align: 'right' });
      const wcrash = wordTime('crash', info.shot.start) ?? info.shot.start + 1.3;
      const pk = ease.inOut(prog(t, 0.15, 1.1));                                    // the real curve
      const dk = ease.inOut(prog(info.globalT, wcrash - 0.4, wcrash + 0.5));         // the dashed prediction
      drawCurve(gc, x, y + 90, w, hh * 0.5, { color: alpha(CREAM(), 0.85), rise: 0.4, dropAt: 0.72, shift: 0, w: 4 }, pk);
      const tip = drawCurve(gc, x, y + 60, w, hh * 0.5, { color: GOLD(), rise: 0.4, dropAt: 0.42, shift: 0, w: 4 }, dk, true);
      if (tip) { const [tx, ty] = tip; glow(gc, x + tx, y + 60 + ty, 60, GOLD(), 0.5); }
      for (let i = 0; i < 6; i++) {                                                  // days ticks
        const xx = x + 26 + (i / 5) * (w - 52);
        seg(gc, [[xx, y + hh - 78], [xx, y + hh - 66]], 2, alpha(CREAM(), 0.4));
      }
      text(gc, 'TODAY', x + 26 + (3 / 5) * (w - 52), y + hh - 44, { size: V(20, 24), color: alpha(CREAM(), 0.65), font: FONTS.ui, weight: 900 });
      text(gc, '+3 DAYS', x + 26 + (6 / 5) * (w - 52) - 4, y + hh - 44, { size: V(20, 24), color: alpha(GOLD(), 0.8 * dk), font: FONTS.ui, weight: 900, align: 'right' });
      const [kx, ky] = crashCurve(w, hh * 0.5, 0.42, 1, { rise: 0.4, dropAt: 0.42, floor: 0.88 });
      const dropX = x + kx, dropY = y + 60 + ky;                                     // the predicted crash day, marked early
      gc.save(); gc.setLineDash([8, 8]);
      seg(gc, [[dropX, dropY], [dropX, y + hh - 66]], 2, alpha(GOLD(), 0.5 * dk));
      gc.restore();
    });
    const th = { ...POSES.phone, head: [10, -205] };
    drawHero(h, { x: CX - V(430, 340), y: GY, s: V(2.1, 2.0), facing: 1, pose: breathe(th, t * 0.6, 0.4, 5),
      expr: 'neutral', face: { mouth: 'flat', brows: null }, look: [0.5, -0.1], rim: { color: M.rim, dir: [0.3, -0.6], w: 4 } });
    glow(h, sx + pw / 2, sy + phh / 2, phh * 0.75, '#7fd0d6', 0.1);
  });
  UI.badge(g, { str: 'GLANCE: 0.4 s', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.8) });
} });

// s046 — same line (part 2): data card CRASH PREDICTED −3 DAYS, the red curve falling on cue.
registerShot('s046', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.06, 1.14, p), x: lerp(-18, 14, p), y: lerp(8, -12, p) };
  const { M } = voidSet(g, t, cam, { mood: 'void', grid: 90, gridAlpha: 0.055, dust: true });
  UI.dataCard(g, t, {
    title: 'CRASH PREDICTED', subtitle: 'INDEX · 7 DAYS', from: 348, to: 96, decimals: 0, unit: '',
    start: 0.15, dur: 1.1, shape: 0.5, labels: [], total: info.dur,
  });
  // dataCard's own curve always climbs; paint over its chart band and draw the real story: a red fall, on cue
  const cw = V(1300, 940), chh = V(700, 760), cx = (E.W - cw) / 2, cy = (E.H - chh) / 2;
  const x0 = cx + 110, x1 = cx + cw - 110, y0 = cy + chh - 90, y1 = cy + chh * 0.33;
  const k = ease.inOut(prog(t, 0.2, 1.05));   // local time: the word 'crash' is spoken in s045, so wordTime (forward-only) can't reach it here
  g.save();
  g.fillStyle = S().ui.card;
  g.fillRect(x0 - 30, y1 - 60, x1 - x0 + 60, y0 - y1 + 100);
  g.translate(x0, y1 - 40);
  const band = { w: x1 - x0, h: y0 - y1 + 30 };
  for (let i = 0; i < 4; i++) { g.fillStyle = alpha(BP(), 0.1); g.fillRect(0, band.h * (i / 4), band.w, 2); }
  const trace = (frac, opts) => { const a = []; for (let s = 0; s <= 44; s++) a.push(crashCurve(band.w, band.h, (s / 44) * clamp(frac, 0, 1), 1, opts)); return a; };
  seg(g, trace(k, { rise: 0.5, dropAt: 0.82, floor: 0.8 }), 4, alpha(CREAM(), 0.5));   // the real climb, crashing late
  g.setLineDash([12, 9]);
  seg(g, trace(k, { rise: 0.5, dropAt: 0.4, floor: 0.8 }), 5, alpha(RED, 0.95));        // the prediction, breaking three days early
  g.setLineDash([]);
  const [px, py] = crashCurve(band.w, band.h, clamp(k, 0, 1), 1, { rise: 0.5, dropAt: 0.4, floor: 0.8 });
  if (k > 0.25) { glow(g, px, py, 90, RED, 0.5); circle(g, px, py, 9, RED); }
  if (k > 0.55) {
    g.setLineDash([7, 7]); seg(g, [[px, py], [px, band.h]], 2.5, alpha(GOLD(), 0.7)); g.setLineDash([]);
    text(g, 'T−3 DAYS', px - 14, band.h - 16, { size: V(26, 30), color: GOLD(), font: FONTS.ui, weight: 900, align: 'right', glow: 14, glowColor: alpha(GOLD(), 0.5) });
  }
  g.restore();
  UI.badge(g, { str: 'PREDICTED: RED', x: E.W - V(110, 80), y: V(120, 190), color: RED, a: ease.out(prog(t, 0.6, 0.9)) });
  FX.dust(g, t, { count: 12, color: M.rim, a: 0.14 });
} });

// ---------- the traffic ----------
// s047 — "You look at your city's traffic lights and redesign the timing in your head, cutting the morning jam in half."
// The only 3D orbit: a dawn intersection, queued cars, traffic-light poles and timing lines.
registerShot('s047', {
  kind: '3d',
  init(T) {
    const st = T.stage({ mood: 'golden', fov: V(36, 52), fog: [26, 95], keyPos: [-9, 12, 7], keyIntensity: 2.6, ambient: 1.25, sky: ['#3a2c4e', '#c87560', '#f4b978'] });
    const { THREE } = T;
    st.add(T.ground(90, 90, '#2b2534', T.tiles('#2b2534', 12, [14, 14])));
    st.add(T.box(46, 0.06, 9, '#1d1a26', 0, 0.03, 0), T.box(9, 0.06, 46, '#1d1a26', 0, 0.03, 0));     // the two roads
    for (const [w, d, x, z] of [[46, 0.3, 0, -5.1], [46, 0.3, 0, 5.1], [0.3, 46, -5.1, 0], [0.3, 46, 5.1, 0]])
      st.add(T.box(w, 0.12, d, '#39324a', x, 0.07, z));                                               // kerbs
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {                                     // corner blocks
      st.add(T.box(13, 9, 13, '#241d33', sx * 15.5, 4.5, sz * 15.5));
      const win = T.windowPane(9, 6, { cols: 4, rows: 3, power: 0.35, lit: true });
      win.position.set(sx * 15.5, 4.6, sz * 9.1); if (sx * sz < 0) win.rotation.y = Math.PI; st.add(win);
      st.add(T.tree3D(sx * 9.5, sz * 9.5, 0.8, '#243024'));
    }
    const lamps = [];
    for (const [lx, lz] of [[-7.6, -7.6], [7.6, -7.6], [-7.6, 7.6], [7.6, 7.6]]) {                    // light + signal poles
      st.add(T.cyl(0.09, 0.11, 5.2, '#15121c', lx, 2.6, lz));
      const head = T.box(0.42, 1.15, 0.42, '#191622', lx + (lx > 0 ? -0.5 : 0.5), 4.6, lz);
      st.add(head);
      const bu = [];
      for (const [i, c] of [[0, '#e04a3a'], [1, '#e8b23c'], [2, '#6fc07a']]) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: c }));
        b.position.set(lx + (lx > 0 ? -0.5 : 0.5), 5 + i * 0.001 + (0.38 - i * 0.38), lz + 0.25);
        b.position.y = 5.05 - i * 0.38;
        st.add(b); bu.push(b);
      }
      lamps.push({ bu });
    }
    const timing = [];                                                                                // gold timing lines over the lanes
    for (const [w, d, x, z] of [[20, 0.14, -13.5, -2.4], [20, 0.14, 13.5, 2.4], [0.14, 20, -2.4, -13.5], [0.14, 20, 2.4, 13.5]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), new THREE.MeshBasicMaterial({ color: '#ffd18a', transparent: true, opacity: 0.55 }));
      m.position.set(x, 0.16, z); st.add(m); timing.push(m);
    }
    for (const [w, d, x, z] of [[20, 0.05, -13.5, -2.4], [20, 0.05, 13.5, 2.4]]) {                    // shafts of low dawn light
      const s = T.shaft(6, 8, '#ffd27a', 0.05); s.position.set(x, 3.4, z); s.rotation.z = 1.2; st.add(s);
    }
    const cars = [];                                                                                  // two lanes of queued cars
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Group();
      c.add(T.box(1.7, 0.62, 3.8, i % 2 ? '#2e2a3d' : '#43364f', 0, 0.5, 0));
      c.add(T.box(1.2, 0.5, 1.8, '#211d2c', 0, 1.02, -0.2));
      for (const [cxo, cz] of [[-0.72, 1.25], [0.72, 1.25], [-0.72, -1.25], [0.72, -1.25]]) c.add(T.cyl(0.32, 0.32, 0.22, '#14121c', cxo, 0.32, cz, 10).rotateZ(Math.PI / 2));
      c.position.set(-7 - i * 5.4, 0, -2.4); c.rotation.y = Math.PI / 2;
      st.add(c); cars.push({ o: c, axis: 'x', dir: 1, z: -2.4, i });
    }
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Group();
      c.add(T.box(1.7, 0.62, 3.8, i % 2 ? '#38334a' : '#262234', 0, 0.5, 0));
      c.add(T.box(1.2, 0.5, 1.8, '#211d2c', 0, 1.02, -0.2));
      for (const [cxo, cz] of [[-0.72, 1.25], [0.72, 1.25], [-0.72, -1.25], [0.72, -1.25]]) c.add(T.cyl(0.32, 0.32, 0.22, '#14121c', cxo, 0.32, cz, 10).rotateZ(Math.PI / 2));
      c.position.set(2.4, 0, 7.5 + i * 5.4); c.rotation.y = Math.PI;
      st.add(c); cars.push({ o: c, axis: 'z', dir: -1, z: 2.4, i });
    }
    return { stage: st, cars, timing };
  },
  draw(s, t, info, T) {
    for (const c of s.cars) {                                                                          // a patient queue, creeping
      const creep = Math.min(3.2, t * 1.4) * (c.i % 2 ? 0.7 : 1) * c.dir;
      if (c.axis === 'x') c.o.position.x = -7 - c.i * 5.4 + creep;
      else c.o.position.z = 7.5 + c.i * 5.4 - creep;
    }
    for (let i = 0; i < s.timing.length; i++) {                                                        // timing lines breathe in
      const k = Math.min(1, Math.max(0, (t - 0.2 - i * 0.15) / 0.7));
      s.timing[i].material.opacity = 0.15 + 0.5 * k * (0.75 + 0.25 * Math.sin(t * 3 + i));
      s.timing[i].scale.setScalar(0.6 + 0.4 * k);
    }
    T.orbit(s.stage.camera, t, { target: [0, 1.1, 0], radius: [19, 14], height: [15.5, 10.5], from: -1.15, to: 0.45, dur: info.dur });
  },
  overlay(g, t, info) {
    UI.badge(g, { str: 'TIMING · 3D', x: E.W - V(110, 80), y: V(120, 190), color: alpha('#ffd18a', 0.8), a: ease.out(prog(t, 0.4, 0.8)) });
  },
});

// s048 — same line (part 3): top-down diagram — the signal timing grid rewrites itself as green waves flow.
registerShot('s048', { draw(g, t, info) {
  blurLayer(g, 11, (h) => city(h, t, { z: 1.45, x: 30, y: 120 }, { mood: 'dusk' }));
  veil(g, '#0d1018', 0.55);
  const jx = E.W * 0.36, jy = E.H * 0.52, rw = V(560, 420), rx = V(180, 140);
  g.fillStyle = alpha('#1a1e2a', 0.9);
  g.fillRect(jx - rw / 2, jy - rx / 2, rw, rx); g.fillRect(jx - rx / 2, jy - rw / 2, rx, rw);
  g.strokeStyle = alpha(GOLD(), 0.25); g.lineWidth = 2;
  g.strokeRect(jx - rw / 2, jy - rx / 2, rw, rx);
  for (let i = 0; i < 6; i++) {                                                                         // crosswalk stripes
    g.fillStyle = alpha(CREAM(), 0.16);
    g.fillRect(jx - rw / 2 + 20 + i * 26, jy + rx / 2 - 16, 14, 14);
    g.fillRect(jx - rw / 2 + 20 + i * 26, jy - rx / 2 + 2, 14, 14);
  }
  const OLD = [[1, 1, 0, 0], [0, 0, 1, 1], [1, 1, 0, 0], [0, 0, 1, 1]];                                 // stop-start: half the cells red
  const NEW = [[1, 1, 1, 1], [0, 1, 1, 1], [1, 1, 1, 0], [1, 0, 1, 1]];                                 // the rewrite: a rolling green wave
  const gx = E.W * 0.68, gy0 = E.H * 0.2, cell = V(46, 40), gap = V(10, 8);
  const wred = wordTime('redesign', info.shot.start) ?? info.shot.start + 0.5;
  const flip = clamp((info.globalT - wred) / 0.9);
  text(g, 'SIGNAL TIMING', gx, gy0 - V(52, 60), { size: V(26, 30), color: alpha(CREAM(), 0.8), font: FONTS.ui, weight: 900, align: 'left', spacing: 3 });
  for (let row = 0; row < 4; row++) {
    text(g, ['N', 'E', 'S', 'W'][row], gx - V(26, 22), gy0 + row * (cell + gap) + cell / 2, { size: V(24, 26), color: alpha(BP(), 0.8), font: FONTS.ui, weight: 900 });
    for (let cI = 0; cI < 8; cI++) {
      const x = gx + (cI % 4) * (cell + gap) + (cI >= 4 ? 4 * (cell + gap) * 0.18 : 0) + Math.floor(cI / 4) * V(14, 10);
      const y = gy0 + row * (cell + gap);
      const fk = clamp(flip * 4.2 - (row * 0.3 + cI * 0.12));
      const pat = fk > 0.5 ? NEW[row] : OLD[row];
      const on = pat[cI % 4];
      g.fillStyle = alpha('#141824', 0.9); g.fillRect(x, y, cell, cell);
      g.fillStyle = on ? alpha(GREEN, 0.85) : alpha(RED, 0.7);
      g.fillRect(x + 4, y + 4, cell - 8, cell - 8);
      if (fk > 0.3 && fk < 0.7) glow(g, x + cell / 2, y + cell / 2, cell * 1.4, GOLD(), 0.35);
    }
  }
  const wk = ease.out(clamp((flip - 0.4) / 0.6));                                                       // the green wave flowing through the junction
  if (wk > 0) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const u = (t * 0.55 + i / 7) % 1;
      circle(g, jx - rw / 2 + u * rw, jy - rx * 0.22, 8 * wk, alpha(GREEN, 0.55 * wk));
      circle(g, jx + rx * 0.22, jy - rw / 2 + u * rw, 8 * wk, alpha(GREEN, 0.45 * wk));
    }
    seg(g, [[jx - rw / 2, jy - rx * 0.22], [jx + rw / 2, jy - rx * 0.22]], 3, alpha(GREEN, 0.3 * wk));
    g.restore();
    UI.callout(g, t, { at: [jx + rw * 0.2, jy - rx * 0.22], to: [E.W * 0.78, E.H * 0.82], str: 'GREEN WAVE', color: GREEN, start: 1.1 });
  }
  UI.badge(g, { str: 'OLD → NEW', x: E.W - V(110, 80), y: V(120, 190), color: GOLD(), a: ease.out(prog(t, 0.3, 0.6)) });
} });

// s049 — same line (part 4): compare bars — MORNING JAM before/after, the second bar halving in place.
registerShot('s049', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.04, 1.1, p), x: 0, y: 0 };
  const { M } = voidSet(g, t, cam, { mood: 'void', grid: 84, gridAlpha: 0.05, dust: true });
  text(g, 'MORNING JAM', E.W / 2, E.H * V(0.24, 0.2), { size: V(52, 56), color: CREAM(), font: FONTS.ui, weight: 900, spacing: 6, glow: 20, glowColor: alpha(M.rim, 0.4) });
  const shrink = ease.inOut(prog(t, 0.22, 0.55));
  UI.compareBars(g, t, {
    rows: [
      { label: 'BEFORE', v: 0.9, color: alpha(RED, 0.85) },
      { label: 'AFTER', v: lerp(0.9, 0.45, shrink), color: GOLD() },
    ],
    x: V(240, 160), y: E.H * V(0.44, 0.4), w: V(1100, 760), start: 0, color: BP(),
  });
  const k = prog(t, 0.22, 0.55);
  if (k > 0.2) {                                                                                         // the half mark, dropping onto the after bar
    const hx = V(240, 160) + 120 + V(1100, 760) * 0.45 * 0.62;
    const hy = E.H * V(0.44, 0.4) + 60 - 10;
    seg(g, [[hx, hy - 34], [hx, hy + 12]], 3, alpha(CREAM(), ease.out(clamp((k - 0.2) / 0.5))));
    text(g, '×0.5', hx + 18, hy - 30, { size: V(34, 38), color: alpha(GOLD(), ease.out(clamp((k - 0.25) / 0.5))), font: FONTS.ui, weight: 900, align: 'left', glow: 14, glowColor: alpha(GOLD(), 0.5) });
  }
  UI.badge(g, { str: '−50%', x: E.W - V(110, 80), y: V(120, 190), color: GOLD(), a: ease.out(prog(t, 0.3, 0.55)) });
} });

// ---------- the cost of doing it properly ----------
// s050 — "A real engineer would need a team, and months."
// Blueprint: four engineer figures under a months-long timeline; above, one small figure holding a lamp.
registerShot('s050', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.06, 1.12, p), x: lerp(-16, 12, p), y: lerp(8, -8, p) };
  const { GY, CX, M } = voidSet(g, t, cam, { mood: 'void', grid: 84, gridAlpha: 0.06, dust: true });
  const teamT = wordTime('team', info.shot.start) ?? info.shot.start + 0.5;
  const monthsT = wordTime('months', info.shot.start) ?? info.shot.start + 1.4;
  const tx = CX - V(180, 150), ty = GY - V(170, 240);
  ruleBar(g, tx - V(360, 300), ty, V(760, 640), { ticks: 12, color: BP(), alpha: 0.4 });                  // the months timeline
  const mk = ease.out(prog(info.globalT, monthsT - 0.2, monthsT + 0.7));
  for (let i = 0; i < 6; i++) {
    const kx = ease.out(clamp(prog(mk * 6, i, i + 1)));
    if (kx <= 0) continue;
    const x = tx - V(340, 285) + i * V(136, 116);
    seg(g, [[x, ty], [x, ty + 18 * kx]], 3, alpha(GOLD(), 0.8));
    text(g, 'M' + (i + 1), x, ty + V(48, 52), { size: V(22, 26), color: alpha(CREAM(), 0.55 * kx), font: FONTS.ui, weight: 900 });
  }
  const engineerPoses = [POSES.point, POSES.explain, POSES.holdFront, POSES.relaxed];
  for (let i = 0; i < 4; i++) {
    const k = ease.out(clamp(prog(info.globalT, teamT + i * 0.14, teamT + 0.45 + i * 0.14)));
    if (k <= 0) continue;
    g.save(); g.globalAlpha = k;
    UI.lineFigure(g, { x: tx - V(300, 255) + i * V(180, 155), y: ty - V(30, 40) + (1 - k) * 40, s: V(0.62, 0.55),
      pose: engineerPoses[i], color: alpha(BP(), 0.9), facing: i === 3 ? -1 : 1 });
    g.restore();
  }
  const hk = ease.out(prog(t, 1.15, 1.6));
  if (hk > 0) {
    g.save(); g.globalAlpha = hk;
    const lx = CX + V(620, 430), ly = GY + V(30, 10);
    UI.lineFigure(g, { x: lx, y: ly, s: V(0.9, 0.8), pose: POSES.reach, color: alpha(GOLD(), 0.95), facing: -1 });
    const lampX = lx - 62 * V(0.9, 0.8), lampY = ly - 204 * V(0.9, 0.8);   // reach hand (hF 62,-204), mirrored by facing -1
    circle(g, lampX, lampY, V(9, 8) * hk, '#ffe9bd');
    FX.lightCone(g, lampX, lampY, { angle: 2.25, spread: 0.85, len: V(400, 330) * hk, color: '#FFD27A', a: 0.2 * hk });
    glow(g, lampX, lampY, V(120, 100) * hk, '#FFD27A', 0.3);
    g.restore();
    UI.callout(g, t, { at: [lx, ly - V(210, 230)], to: [E.W * 0.82, E.H * 0.24], str: 'YOU: ONE LAMP', color: GOLD(), start: 1.5 });
  }
  UI.badge(g, { str: 'TEAM × 4 · MONTHS', x: E.W - V(110, 80), y: V(120, 190), color: alpha(CREAM(), 0.8), a: ease.out(prog(t, 0.5, 0.9)) });
} });

// ---------- the punchline ----------
// s051 — "You needed a red light."
// Medium single: the hero at a red light at dawn, one finger on the pole, a small private smile.
const TOUCH = {                                                                                       // standing, one hand up and out, a fingertip on the pole
  ...POSES.stand,
  head: [10, -206], sh: [4, -174], hip: [0, -100],
  eF: [30, -148], hF: [56, -112], eB: [-8, -136], hB: [-10, -100],
  kF: [6, -50], fF: [3, 0], kB: [-6, -50], fB: [-12, 0],
};
registerShot('s051', { draw(g, t, info) {
  const p = ease.inOut(info.p);
  const cam = { z: lerp(1.18, 1.1, p), x: lerp(24, -12, p), y: lerp(-34, -14, p) };
  const { GY, CX, M } = city(g, t, cam, { mood: 'golden', lamps: true });
  layer(g, cam, 1, (h) => {
    const px = CX + V(390, 320), s = V(1.05, 1);
    trafficLight(h, px, GY, s, { state: 'red' });
    const heroX = px - 56 * V(3.1, 2.9) - 8;
    drawHero(h, { x: heroX, y: GY, s: V(3.1, 2.9), facing: 1, pose: breathe(TOUCH, t * 0.8, 0.35, 2),
      expr: 'smirk', rim: { color: M.rim, dir: [0.55, -0.72], w: 4 }, blink: (t % 3.3) > 3.16, look: [0.3, -0.1] });
    const wn = wordTime('red', info.shot.start) ?? info.shot.start + 0.35;
    const k = ease.out(clamp(prog(info.globalT, wn, wn + 0.3)));
    const lampX = px + 123 * s, lampY = GY - V(360, 320) * s - 100 * s;
    if (k > 0) {
      glow(h, lampX, lampY, V(240, 210) * k, '#e04a3a', 0.3 * k);
      FX.rings(h, lampX, lampY, t, { count: 2, r0: V(60, 52), r1: V(150, 130), a: 0.25 * k, color: '#e04a3a' });
    }
    const tipX = heroX + 56 * V(3.1, 2.9), tipY = GY - 112 * V(3.1, 2.9);           // his fingertip resting on the pole
    if (k > 0) { glow(h, tipX, tipY, 70 * k, GOLD(), 0.35 * k); circle(h, tipX, tipY, 6, alpha(GOLD(), 0.8 * k)); }
  });
  UI.badge(g, { str: 'REDESIGNED: YES', x: E.W - V(110, 80), y: V(120, 190), color: GOLD(), a: ease.out(prog(t, 0.5, 0.85)) });
  FX.dust(g, t, { count: 10, color: M.rim, a: 0.12 });
} });
