import { E, mood, glow } from '/engine/core.js';
import { drawFigure, POSES } from '/engine/rig2d.js';
import { drawHero } from '/engine/characters.js';
import { drawStreet, drawDoor, drawBall } from '../sets/visual-assets.js';

registerShot('s008', { draw(g, t) {
  drawStreet(g);
  drawDoor(g, 1430, 760, 1.25);
  drawBall(g, 1080 + Math.sin(t * 1.1) * 12, 690, 38);
  const M = mood('night');
  // Target: the protagonist stays fully readable and larger than the environment.
  drawHero(g, { x: 1180, y: 980, s: 1.42, pose: POSES.reach, expr: 'focused', rim: { color: M.rim, dir: [-1, -0.3], w: 4 } });
  // Foreground friend frames the target without covering the ball or hero's hand.
  drawFigure(g, {
    x: 340, y: 1050, s: 2.25, facing: 1, pose: POSES.stand, expr: 'neutral',
    outfit: { top: 'hoodie', color: '#47566B', legs: '#222B3A', head: 'none', headColor: '#F1E8DC' },
    rim: { color: M.rim, dir: [1, -0.2], w: 3 },
  });
  g.fillStyle = 'rgba(18,24,36,.38)';
  g.fillRect(0, 0, 520, E.H);
  glow(g, 1080, 690, 110, M.key, 0.12);
} });
