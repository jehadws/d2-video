import { E, mood, glow, registerShot } from '/engine/core.js';
import { drawFigure, POSES } from '/engine/rig2d.js';
import { drawHero } from '/engine/characters.js';
import { drawStreet, drawDoor, drawBall } from '../sets/visual-assets.js';

registerShot('s008', { draw(g, t) {
  drawStreet(g);
  drawDoor(g, 1430, 760, 1.25);
  drawBall(g, 1215 + Math.sin(t * 1.1) * 12, 600, 72);
  const M = mood('night');
  drawHero(g, { x: 1420, y: 990, s: 2.3, facing: -1, pose: POSES.reach, expr: 'determined', rim: { color: M.rim, dir: [-1, -0.3], w: 4 } });
  drawFigure(g, {
    x: 330, y: 1110, s: 2.9, facing: 1, pose: POSES.stand, expr: 'neutral',
    outfit: { top: 'hoodie', color: '#47566B', legs: '#222B3A', head: 'none', headColor: '#F1E8DC' },
    rim: { color: M.rim, dir: [1, -0.2], w: 3 },
  });
  g.fillStyle = 'rgba(18,24,36,.38)'; g.fillRect(0, 0, 520, E.H);
  glow(g, 1215, 600, 170, M.key, 0.12);
} });
