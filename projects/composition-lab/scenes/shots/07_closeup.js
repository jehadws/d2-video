import { E, mood, glow } from '/engine/core.js';
import { drawHeroFace } from '/engine/characters.js';
import { drawOffice, drawCup, drawPhone } from '../sets/visual-assets.js';

registerShot('s007', { draw(g, t) {
  drawOffice(g);
  drawCup(g, E.W * 0.78, E.H * 0.78, 1.25);
  drawPhone(g, E.W * 0.2, E.H * 0.77, 0.9);
  const M = mood('interiorWarm');
  glow(g, E.W * 0.5, E.H * 0.28, 360, M.key, 0.12);
  drawHeroFace(g, E.W / 2, E.H * 0.62, 330 + Math.sin(t * 1.4) * 5, {
    expr: t < 1.1 ? 'thinking' : 'awe',
    look: [0.12, -0.08],
    rimColor: M.rim,
    rimSide: -1,
  });
} });
