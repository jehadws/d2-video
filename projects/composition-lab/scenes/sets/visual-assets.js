// Reusable visual assets for the composition lab's advanced JS shots.
// Keep these drawings deliberately simple so DSL versions can use equivalent geometry.
import { E, rr, circle, seg, linGrad, glow } from '/engine/core.js';

export const PALETTE = Object.freeze({
  wall: '#343C4A', wallDeep: '#252B37', floor: '#333744',
  wood: '#8B6D59', ivory: '#D9D0C5', warm: '#D9B77F',
  glass: '#A7A8A5', ball: '#C9794D', ink: '#202532',
});

export function drawBedroom(g) {
  const p = PALETTE;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#303443', p.wall, p.wallDeep]);
  g.fillRect(0, 0, E.W, E.H);
  g.fillStyle = '#687080'; rr(g, 180, 120, 590, 480, 8); g.fill();
  g.fillStyle = '#B5AAB0'; rr(g, 205, 145, 540, 430, 4); g.fill();
  seg(g, [[475, 145], [475, 575]], 12, '#454958');
  seg(g, [[205, 360], [745, 360]], 12, '#454958');
  circle(g, 650, 240, 54, p.warm); glow(g, 650, 240, 140, p.warm, 0.12);
  g.fillStyle = p.floor; g.fillRect(0, 720, E.W, 360);
  g.fillStyle = '#66505A'; rr(g, 900, 570, 760, 160, 24); g.fill();
  g.fillStyle = '#B5A9A2'; rr(g, 940, 535, 680, 90, 28); g.fill();
  g.fillStyle = '#292F3D'; rr(g, 1510, 650, 150, 85, 12); g.fill();
}

export function drawOffice(g) {
  const p = PALETTE;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#303846', p.wall, p.wallDeep]);
  g.fillRect(0, 0, E.W, E.H);
  g.fillStyle = '#687687'; rr(g, 150, 110, 660, 480, 8); g.fill();
  g.fillStyle = p.glass; rr(g, 174, 134, 612, 432, 4); g.fill();
  seg(g, [[480, 134], [480, 566]], 12, '#4A5260');
  seg(g, [[174, 350], [786, 350]], 12, '#4A5260');
  g.fillStyle = p.floor; g.fillRect(0, 740, E.W, 340);
  g.fillStyle = p.wood; rr(g, 360, 690, 1180, 34, 8); g.fill();
  g.fillStyle = '#574A46'; g.fillRect(440, 724, 26, 250); g.fillRect(1430, 724, 26, 250);
}

export function drawStreet(g) {
  const p = PALETTE;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#303747', '#343744', '#202734']);
  g.fillRect(0, 0, E.W, E.H);
  g.fillStyle = '#4D4B57'; g.fillRect(80, 280, 540, 470);
  g.fillStyle = '#C18D62'; g.fillRect(180, 390, 120, 180); g.fillRect(390, 390, 120, 180);
  g.fillStyle = '#454552'; g.fillRect(700, 220, 600, 530);
  g.fillStyle = '#282C36'; g.fillRect(0, 750, E.W, 330);
  seg(g, [[0, 930], [E.W, 930]], 5, '#8D8290');
  g.fillStyle = p.ink; g.fillRect(1510, 280, 16, 480);
  circle(g, 1518, 260, 54, p.warm); glow(g, 1518, 260, 130, p.warm, 0.13);
}

export function drawDoor(g, x, y, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  g.fillStyle = '#292F3D'; rr(g, -58, -170, 116, 170, 5); g.fill();
  g.fillStyle = '#B9855C'; rr(g, -43, -154, 86, 154, 3); g.fill();
  circle(g, 28, -78, 5, '#E7C99A'); g.restore();
}

export function drawBall(g, x, y, radius = 34) {
  circle(g, x, y, radius, PALETTE.ball);
  circle(g, x - radius * 0.28, y - radius * 0.32, radius * 0.24, '#E6B18A');
  seg(g, [[x - radius * 0.55, y + radius * 0.15], [x + radius * 0.55, y - radius * 0.2]], Math.max(2, radius * 0.08), '#8E5039');
}

export function drawCup(g, x, y, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  const w = 44, h = 52, top = -h;
  // Tapered ceramic body with a visible elliptical rim and open handle.
  g.fillStyle = PALETTE.ivory;
  g.beginPath();
  g.moveTo(-w * 0.48, top + 5);
  g.lineTo(w * 0.48, top + 5);
  g.lineTo(w * 0.34, 0);
  g.quadraticCurveTo(0, 3, -w * 0.34, 0);
  g.closePath(); g.fill();
  g.strokeStyle = PALETTE.ivory; g.lineWidth = 7;
  g.beginPath(); g.ellipse(w * 0.48, -h * 0.48, 13, 15, 0, -Math.PI * 0.43, Math.PI * 0.43); g.stroke();
  g.fillStyle = '#805239';
  g.beginPath(); g.ellipse(0, top + 5, w * 0.47, 5.5, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#F0E9DF'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(0, top + 5, w * 0.38, 3, 0, 0, Math.PI * 2); g.stroke();
  g.restore();
}
export function drawPhone(g, x, y, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  g.fillStyle = '#172033'; rr(g, -22, -42, 44, 84, 7); g.fill();
  g.fillStyle = '#A7B4C4'; rr(g, -17, -32, 34, 62, 3); g.fill();
  circle(g, 0, 35, 2.5, '#D9D0C5'); g.restore();
}
