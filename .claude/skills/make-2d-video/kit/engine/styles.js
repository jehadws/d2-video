// engine/styles.js — colour moods + switchable visual styles.
// A MOOD is the lighting situation of a location (day, dusk, night, storm, interiors, void).
// A STYLE re-grades every mood (palette overrides + a lift/gamma/gain colour grade on the final frame + post settings).
// grade: contrast (around mid-grey), sat (saturation), lift/gamma/gain per RGB channel (lift tints shadows, gain tints highlights).
// Scenes must take colours from mood()/S() so a style switch re-themes the whole video.

export const BASE_MOODS = {
  day:          { sky: ['#263a56', '#4A2930', '#F2A65A', '#FFD27A'], ambient: '#3d2f38', key: '#FFD27A', rim: '#F2A65A', wall: '#4A2930', floor: '#291a22', dark: '#241923', practical: '#FFD27A', grass: '#3f6b40', road: '#383240', fog: '#e0b686' },
  golden:       { sky: ['#241923', '#4A2930', '#F0643A', '#F2A65A', '#FFD27A'], ambient: '#3d262d', key: '#FFD27A', rim: '#F2A65A', wall: '#4A2930', floor: '#321b22', dark: '#241923', practical: '#FFD27A', grass: '#425e36', road: '#3a2830', fog: '#F2A65A' },
  dusk:         { sky: ['#181226', '#241923', '#4A2930', '#F0643A', '#F2A65A', '#FFD27A'], ambient: '#30202e', key: '#FFD27A', rim: '#F2A65A', wall: '#3a2230', floor: '#281822', dark: '#1b121c', practical: '#FFD27A', grass: '#2e4236', road: '#2c2030', fog: '#b86852' },
  night:        { sky: ['#0a0e18', '#101522', '#18223a', '#223254'], ambient: '#141c2e', key: '#DCE9FF', rim: '#66B8D8', wall: '#161e30', floor: '#101522', dark: '#0c101c', practical: '#FFD27A', grass: '#182e2c', road: '#121828', fog: '#1e2c4a' },
  storm:        { sky: ['#0d1222', '#161e36', '#253052'], ambient: '#192036', key: '#DCE9FF', rim: '#66B8D8', wall: '#1c243c', floor: '#121728', dark: '#0e1220', practical: '#F0643A', grass: '#1d322c', road: '#161a28', fog: '#2a3860' },
  interiorWarm: { sky: ['#4A2930', '#F0643A', '#F2A65A', '#FFD27A'], ambient: '#3f262e', key: '#FFD27A', rim: '#F2A65A', wall: '#4A2930', floor: '#2b1920', dark: '#241923', practical: '#FFD27A', grass: '#384e3a', road: '#33222a', fog: '#F2A65A' },
  interiorCool: { sky: ['#101522', '#1c2848', '#384c78'], ambient: '#1c2238', key: '#DCE9FF', rim: '#66B8D8', wall: '#1a2034', floor: '#121626', dark: '#0e1220', practical: '#FFD27A', grass: '#1e322a', road: '#161a28', fog: '#2d3a60' },
  void:         { sky: ['#080b14', '#101522'], ambient: '#101726', key: '#DCE9FF', rim: '#66B8D8', wall: '#101522', floor: '#0a0e18', dark: '#060910', practical: '#FFD27A', grass: '#122420', road: '#0e1320', fog: '#141f34' },
};

const UI = { card: 'rgba(16,21,34,.95)', cardLine: 'rgba(102,184,216,.3)', text: '#DCE9FF', sub: '#7a8fae', accent: '#F0643A', gold: '#FFD27A', cream: '#DCE9FF', blueprint: '#66B8D8', bpBg: '#101522', good: '#5fd39a' };

export const STYLES = {
  dusk: {
    name: 'Cinematic Dusk', desc: 'Cinematic color direction: rich amber/burnt orange warm scenes, deep navy night scenes, chiaroscuro contrast.',
    ink: '#0e0b12', inkFar: '#241923', feature: '#f4efe6', rimWidth: 4.8, ui: UI,
    grade: { contrast: 1.15, sat: 1.18, lift: [0.015, -0.005, 0.035], gamma: [1.02, 0.99, 0.96], gain: [1.08, 1.02, 0.94], vignette: 0.62, grain: 0.045, bloom: 0.65 },
    moods: {},
  },
  midnight: {
    name: 'Midnight Blue', desc: 'Cold navy world, blue-white rim light, sodium-orange practical lights, rain-friendly, higher contrast.',
    ink: '#0a0c16', inkFar: '#232a40', feature: '#eef3ff', rimWidth: 4, ui: { ...UI, accent: '#ff8a5c', gold: '#ffc66e' },
    grade: { contrast: 1.06, sat: 0.8, lift: [0.0, 0.025, 0.09], gamma: [0.92, 0.98, 1.08], gain: [0.84, 0.95, 1.15], vignette: 0.65, grain: 0.06, bloom: 0.7 },
    moods: { dusk: { sky: ['#141a3a', '#2c3470', '#5a5aa0', '#c08aa0'], key: '#d8dcff', rim: '#b8c8ff', wall: '#2a2c4a', floor: '#1e2036' }, golden: { rim: '#ffd6a8' }, interiorWarm: { wall: '#3a3448', sky: ['#5a5a90', '#c09ab0'] } },
  },
  golden: {
    name: 'Golden Hour', desc: 'Warm orange-and-teal daylight, big sun glows, brighter mid-tones, warm cream rim light.',
    ink: '#120c0a', inkFar: '#3a2a26', feature: '#fff6e6', rimWidth: 4.5, ui: { ...UI, card: 'rgba(30,26,40,.92)', accent: '#ff7a4a' },
    grade: { contrast: 1.04, sat: 1.18, lift: [0.035, 0.015, 0.0], gamma: [1.1, 1.04, 0.94], gain: [1.12, 1.02, 0.8], vignette: 0.45, grain: 0.045, bloom: 0.75 },
    moods: { night: { sky: ['#14183a', '#2e2c5a', '#6a4a6a'], rim: '#ffcf9a' }, dusk: { sky: ['#4a3a6a', '#d0786a', '#f2a46a', '#fbd8a0'] } },
  },
  neon: {
    name: 'Neon Noir', desc: 'Deep blacks, magenta + teal two-tone rim lights, glowing signage, strong bloom, cool shadows.',
    ink: '#07060c', inkFar: '#1e1830', feature: '#f6f0ff', rimWidth: 4, ui: { ...UI, card: 'rgba(14,10,28,.94)', cardLine: 'rgba(200,120,255,.3)', text: '#c9a8ff', accent: '#ff4fa3', gold: '#5ff2e8', blueprint: '#7fe8ff' },
    grade: { contrast: 1.15, sat: 1.4, lift: [0.01, 0.0, 0.04], gamma: [1.0, 0.9, 1.06], gain: [1.12, 0.86, 1.18], vignette: 0.7, grain: 0.06, bloom: 0.9 },
    moods: { dusk: { sky: ['#120a2a', '#3a1a5a', '#a03a8a', '#ff7a9a'], rim: '#ff6ac8', key: '#ff8ad0', practical: '#5ff2e8' }, night: { sky: ['#06061a', '#140f3a', '#2a1a5a'], rim: '#5ff2e8', practical: '#ff4fa3' }, interiorWarm: { rim: '#ff7ab8', practical: '#5ff2e8', wall: '#2a1e3a' }, day: { rim: '#7ff0ff' } },
  },
  storybook: {
    name: 'Soft Storybook', desc: 'Lighter pastel palette, lower contrast, lavender shadows, gentle paper grain — friendlier, family tone.',
    ink: '#1a1622', inkFar: '#4a4258', feature: '#fffaf0', rimWidth: 5, ui: { ...UI, card: 'rgba(40,36,60,.9)', accent: '#ff8a7a', gold: '#ffd98a' },
    grade: { contrast: 0.92, sat: 0.92, lift: [0.07, 0.055, 0.085], gamma: [1.12, 1.1, 1.06], gain: [1.06, 1.03, 0.98], vignette: 0.3, grain: 0.07, bloom: 0.45 },
    moods: { night: { sky: ['#2a2f5a', '#4a4f80', '#6a6aa0'], wall: '#3e4266' }, dusk: { sky: ['#6a5a90', '#c08aa8', '#f2b0a0', '#fbe0b8'] } },
  },
};
export const STYLE_IDS = Object.keys(STYLES);
