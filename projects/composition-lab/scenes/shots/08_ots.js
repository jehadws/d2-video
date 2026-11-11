import { E, mood, glow, registerShot } from '/engine/core.js';
import { drawFigure, POSES } from '/engine/rig2d.js';
import { drawHero } from '/engine/characters.js';
import { drawStreet, drawDoor, drawBall } from '../sets/visual-assets.js';

registerShot('s008', { draw(g, t) {
  drawStreet(g);
  drawDoor(g, 1430, 760, 1.25);
  drawBall(g, 1215 + Math.sin(t * 1.1) * 12, 600, 72);

  const M = mood('night');
  // The protagonist and target stay in the middle distance, in focus.
  drawHero(g, {
    x: 1420, y: 990, s: 2.3, facing: -1,
    pose: POSES.reachBall, expr: 'determined',
    rim: { color: M.rim, dir: [-1, -0.3], w: 2.4 },
  });

  // A back-facing foreground character: facial features match the head fill,
  // so the camera sees the back of the head rather than a second front-facing actor.
  const foreground = '#354256';
  drawFigure(g, {
    x: 280, y: 1270, s: 4.8, facing: 1, pose: POSES.stand, expr: 'neutral',
    outfit: {
      top: 'hoodie', color: foreground, legs: '#2B3648',
      head: 'none', headColor: foreground, featureColor: foreground,
    },
    rim: { color: M.rim, dir: [-1, -0.2], w: 2.2 },
  });

  // Broaden the near shoulder into a true foreground frame and occlude the
  // lower-left portion of the image; this is the OTS depth cue.
  g.fillStyle = '#2E3A4E';
  g.beginPath();
  g.moveTo(-40, E.H);
  g.lineTo(-40, 760);
  g.quadraticCurveTo(80, 480, 280, 440);
  g.quadraticCurveTo(490, 455, 610, 760);
  g.lineTo(610, E.H);
  g.closePath();
  g.fill();

  glow(g, 1215, 600, 170, M.key, 0.12);
} });
