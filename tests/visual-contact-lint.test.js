import test from 'node:test';
import assert from 'node:assert/strict';
import { lintVisualShot } from '../engine/visual-lint.js';

const hero = (overrides = {}) => ({
  type: 'hero', x: 900, y: 1000, scale: 1, pose: 'phone', ...overrides,
});
const codes = (spec) => lintVisualShot(spec, { W: 1920, H: 1080, bars: 0, duration: 2 }).map((x) => x.code);

test('animated attached prop must declare a contact window', () => {
  const result = codes({
    framing: 'insert',
    camera: { x: [{ at: 0, value: 0 }, { at: 2, value: 10 }] },
    layers: [hero({ prop: { type: 'phone', animate: {
      offsetX: [{ at: 0, value: 80 }, { at: 2, value: 0 }],
    } } })],
  });
  assert.ok(result.includes('prop-contact-window-missing'));
});

test('animated attached prop cannot drift away during its declared grip window', () => {
  const result = codes({
    framing: 'insert',
    camera: { x: [{ at: 0, value: 0 }, { at: 2, value: 10 }] },
    layers: [hero({
      contact: { hand: 'F', from: 0, to: 2 },
      prop: { type: 'phone', animate: {
        offsetX: [{ at: 0, value: 0 }, { at: 1, value: 100 }, { at: 2, value: 0 }],
      } },
    })],
  });
  assert.ok(result.includes('prop-breaks-during-contact-window'));
});

test('approach motion before the grip window is allowed', () => {
  const result = codes({
    framing: 'insert',
    camera: { x: [{ at: 0, value: 0 }, { at: 2, value: 10 }] },
    layers: [hero({
      contact: { hand: 'F', from: 1, to: 2 },
      prop: { type: 'phone', animate: {
        offsetX: [{ at: 0, value: 100 }, { at: 1, value: 0 }, { at: 2, value: 0 }],
      } },
    })],
  });
  assert.ok(!result.includes('prop-contact-window-missing'));
  assert.ok(!result.includes('prop-breaks-during-contact-window'));
});

test('separate target contact is checked at every sample in its window', () => {
  const result = codes({
    framing: 'insert',
    camera: { x: [{ at: 0, value: 0 }, { at: 2, value: 10 }] },
    layers: [
      hero({ pose: 'reach', contact: { hand: 'F', from: 0, to: 2, target: 1 } }),
      { type: 'circle', role: 'story_object', x: 962, y: 796, radius: 80, fill: '#fff',
        animate: { x: [{ at: 0, value: 962 }, { at: 1, value: 1100 }, { at: 2, value: 962 }] } },
    ],
  });
  assert.ok(result.includes('contact-breaks-during-window'));
});

test('static attached prop is checked for the whole shot without requiring a window', () => {
  const result = codes({
    framing: 'insert',
    camera: { x: [{ at: 0, value: 0 }, { at: 2, value: 10 }] },
    layers: [hero({ prop: { type: 'phone', offsetX: 0, offsetY: 0 } })],
  });
  assert.ok(!result.includes('prop-contact-window-missing'));
  assert.ok(!result.includes('prop-detached-during-shot'));
});

test('static attached prop drift is checked across the whole shot', () => {
  const result = codes({
    framing: 'insert',
    camera: { x: [{ at: 0, value: 0 }, { at: 2, value: 10 }] },
    layers: [hero({ prop: { type: 'phone', offsetX: 100, offsetY: 0 } })],
  });
  assert.ok(result.includes('prop-detached-during-shot'));
});

test('separate target interaction requires an explicit contact window', () => {
  const result = codes({
    framing: 'insert',
    camera: { x: [{ at: 0, value: 0 }, { at: 2, value: 10 }] },
    layers: [
      hero({ pose: 'reach' }),
      { type: 'circle', role: 'story_object', x: 962, y: 796, radius: 80, fill: '#fff' },
    ],
  });
  assert.ok(result.includes('contact-window-missing'));
});
