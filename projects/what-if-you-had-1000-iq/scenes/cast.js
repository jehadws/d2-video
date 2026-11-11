// scenes/cast.js — every recurring character, one signature colour each. Keep these fixed for the whole video.
// The hero has a canonical identity in engine/characters.js (drawHero / drawHeroFace); everyone else is
// drawn in their own signature colour so they stay readable in silhouette.
import { HERO } from '../../../engine/characters.js';

export { HERO };
export const HERO_KID = { ...HERO, kid: true };

export const LEO = { top: 'tshirt', color: '#3D5A6C', legs: '#4A4E58', head: 'cap', headColor: '#F2C21A' };
export const LEO_KID = { ...LEO, kid: true };
export const MIA = { top: 'labcoat', color: '#C87A3F', legs: '#4A4E58', head: 'ponytail', headColor: '#C87A3F' };
export const TEACHER = { top: 'dress', color: '#5B4670', head: 'bun', headColor: '#9B7BB8', face: 'glasses' };
export const MOM = { top: 'dress', color: '#C46A4A', head: 'curly', headColor: '#C46A4A' };
export const CHAMP = { top: 'jersey', color: '#4B5F86', color2: '#F1E8DC', number: '1', head: 'headband', headColor: '#D9483B' };
export const MR_BLACK = { top: 'suit', color: '#2A2833', color2: '#8E2C2C', head: 'fedora', headColor: '#3B3F4C', face: 'sunglasses' };
export const REPORTER = { top: 'trench', color: '#8C7F6B', headColor: '#C2A25E' };

export const FAMILY = [
  { top: 'tshirt', color: '#5E6B7A', headColor: '#A8B4C4' },
  { top: 'dress', color: '#6E7A88', headColor: '#A8B4C4' },
  { top: 'tshirt', color: '#7A8896', headColor: '#A8B4C4', kid: true },
];

export const SCIENTISTS = [
  { top: 'labcoat', color: '#5E7FA8', head: 'none', headColor: '#5E7FA8' },
  { top: 'labcoat', color: '#5E7FA8', head: 'spiky', headColor: '#5E7FA8', face: 'glasses' },
  { top: 'labcoat', color: '#5E7FA8', head: 'bun', headColor: '#5E7FA8' },
];

export const CAST = [HERO, LEO, MIA, TEACHER, MOM, CHAMP, MR_BLACK, REPORTER];
