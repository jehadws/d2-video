// engine/characters.js — canonical reusable character identities.
import { drawFigure, bigFace, headPos, POSES } from './rig2d.js';

// The recurring "you" protagonist. Keep these identity values stable across videos.
// Use drawHero() for full-body shots and drawHeroFace() for giant close-ups.
export const HERO = Object.freeze({
  top: 'hoodie',
  color: '#25324A',
  color2: '#F1E8DC',
  legs: '#D9D3CA',
  head: 'none',
});

export const HERO_PALETTE = Object.freeze({
  skin: '#F1E8DC',
  skinShadow: '#D9D0C5',
  clothing: '#25324A',
  clothingShadow: '#1B2638',
  trouser: '#D9D3CA',
  feature: '#172033',
  rim: '#D9C9B5',
});

const HERO_RIM = Object.freeze({
  color: HERO_PALETTE.rim,
  dir: [-0.8, -0.5],
  w: 1.8,
  glow: 0,
});

/**
 * Draw the canonical protagonist using the existing rig.
 * Pose, expression, movement, props and camera-facing options remain controlled
 * by the caller; identity colors and clothing stay consistent.
 */
export function drawHero(g, options = {}) {
  return drawFigure(g, {
    ...options,
    ink: HERO_PALETTE.skin,
    inkFar: HERO_PALETTE.skinShadow,
    outfit: HERO,
    rim: options.rim === false ? false : { ...HERO_RIM, ...(options.rim || {}) },
  });
}

/** Draw the matching oversized protagonist close-up. */
export function drawHeroFace(g, cx, cy, radius, options = {}) {
  return bigFace(g, cx, cy, radius, {
    ...options,
    outfit: HERO,
    headColor: HERO_PALETTE.skin,
    featureColor: HERO_PALETTE.feature,
    rimColor: options.rimColor || HERO_PALETTE.rim,
    rimGlow: 0,
  });
}

/** Return the protagonist's head world-position using the same rig geometry. */
export function heroHeadPosition(options = {}) {
  return headPos({ ...options, outfit: HERO });
}

export const HERO_DEFAULT_POSE = POSES.stand;
