// Screen-space modular environment renderer for DSL v2 asset references.
import { E } from '../core.js';

export function drawEnvironment(g, environment, lighting = null, frame = { width: E.W, height: E.H }) {
  if (!environment) return;
  const width = frame.width, height = frame.height;
  g.save();
  g.fillStyle = environment.background;
  g.fillRect(0, 0, width, height);
  for (const layer of environment.layers || []) {
    const x = layer.x * width, y = layer.y * height;
    const w = layer.w * width, h = layer.h * height;
    g.save();
    g.fillStyle = layer.fill;
    if (layer.type === 'rect') g.fillRect(x, y, w, h);
    else if (layer.type === 'circle') {
      g.beginPath(); g.arc(x, y, Math.max(w, h) / 2, 0, Math.PI * 2); g.fill();
    } else if (layer.type === 'line') {
      g.strokeStyle = layer.fill; g.lineWidth = Math.max(1, Math.min(width, height) * 0.003);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.stroke();
    }
    g.restore();
  }
  if (lighting?.opacity > 0) {
    g.globalAlpha = lighting.opacity;
    g.fillStyle = lighting.tint;
    g.fillRect(0, 0, width, height);
  }
  g.restore();
}
