// cast.js — one outfit per recurring character. Signature colour = identity; keep it identical in every shot.
import { HERO } from '/engine/characters.js';
export const MAX = HERO;                                                                                  // "you", the canonical off-white protagonist
export const JAKE = { top: 'tshirt', color: '#3a6ea5', head: 'cap', headColor: '#f2c21a' };             // best friend
export const DOC = { top: 'labcoat', face: 'glasses', head: 'none' };                                  // scientist
export const CAST = [MAX, JAKE, DOC];
