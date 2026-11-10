// Register legacy JavaScript scenes first, then declarative JSON scenes.
// This order is intentional: a valid DSL definition may replace a legacy
// registerShot() implementation with the same timeline ID.
import { registerVisualShot } from './visual-dsl.js';

export async function registerHybridScenes({
  scriptFiles = [],
  visualFiles = [],
  importScene = specifier => import(specifier),
  fetchVisual = async file => {
    const response = await fetch(file);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  },
  registerVisual = registerVisualShot,
  onError = () => {},
} = {}) {
  const errors = [];
  const loadedScripts = [];
  const loadedVisuals = [];

  const report = (kind, file, error) => {
    const item = {
      kind,
      file,
      message: error instanceof Error ? error.message : String(error),
    };
    errors.push(item);
    try { onError(item); } catch { /* Logging must not interrupt scene loading. */ }
  };

  for (const file of scriptFiles) {
    try {
      await importScene(file);
      loadedScripts.push(file);
    } catch (error) {
      report('script', file, error);
    }
  }

  for (const file of visualFiles) {
    try {
      const spec = await fetchVisual(file);
      registerVisual(spec);
      loadedVisuals.push(file);
    } catch (error) {
      // A failed JSON registration leaves any legacy implementation intact.
      report('visual', file, error);
    }
  }

  return { errors, loadedScripts, loadedVisuals };
}
