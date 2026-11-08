// lint-visual.mjs: framing lint for Structured Visual DSL shots.
//   node lint-visual.mjs projects/my-video            print findings, exit 1 if any error
//   node lint-visual.mjs projects/my-video --warn     print findings, always exit 0
// render.mjs calls lintProject() before every render and aborts on errors; warnings are non-blocking.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lintVisualShot, lintVisualSequence, lintCompositionFraming, BARS } from './engine/visual-lint.js';
import { lintComposition } from './engine/geometry/index.js';
import { DEFAULT_COMPOSITION_TEMPLATES, resolveCompositionTemplate } from './engine/composition-templates/resolve.js';
import { validateTemplateRequest } from './engine/composition-templates/index.js';
import { validateAssetReferences, resolveAssetReferences } from './engine/assets/index.js';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const dimsFor = (aspect) => (aspect === '9:16' ? { W: 1080, H: 1920, vertical: true } : { W: 1920, H: 1080, vertical: false });

function barPx(value, vertical) {
  if (typeof value === 'number') return value;
  if (vertical) return { none: 0, wide: 0, scope: 170, thin: 60 }[value ?? 'wide'] ?? 0;
  return BARS[value ?? 'wide'] ?? 0;
}

/** Lint every scenes/visual/*.json in a project. Returns { findings, errors, warnings }. */
export function lintProject(projectDir) {
  const dir = path.join(projectDir, 'scenes', 'visual');
  const findings = [];
  if (!fs.existsSync(dir)) return { findings, errors: 0, warnings: 0 };
  const cfg = fs.existsSync(path.join(projectDir, 'config.json')) ? readJson(path.join(projectDir, 'config.json')) : {};
  const storyPath = path.join(projectDir, 'story', 'shots.json');
  const story = fs.existsSync(storyPath) ? readJson(storyPath) : { shots: [] };
  const { W, H, vertical } = dimsFor(cfg.aspect);
  const order = new Map(story.shots.map((s, i) => [s.id, i]));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort();
  const shots = [];
  for (const f of files) {
    let spec;
    try { spec = readJson(path.join(dir, f)); } catch (e) { findings.push({ shot: f, level: 'error', code: 'json-parse', message: e.message }); continue; }
    const id = spec.id || f.replace(/\.json$/, '');
    const meta = story.shots.find((s) => s.id === id);
    const bars = barPx(meta && meta.bars !== undefined && meta.bars !== null ? meta.bars : cfg.bars, vertical);
    const duration = meta ? meta.end - meta.start : undefined;
    if (spec.version === 2) {
      const assetErrors = validateAssetReferences(spec);
      for (const message of assetErrors) findings.push({ shot: id, level: 'error', code: 'asset-reference-invalid', message });
      let expanded = spec;
      if (!assetErrors.length) {
        try { expanded = resolveAssetReferences(spec); }
        catch (error) { findings.push({ shot: id, level: 'error', code: 'asset-reference-invalid', message: error.message }); }
      }
      const templateErrors = validateTemplateRequest(expanded, DEFAULT_COMPOSITION_TEMPLATES);
      for (const message of templateErrors) findings.push({ shot: id, level: 'error', code: 'composition-template-invalid', message });
      if (!assetErrors.length && !templateErrors.length && expanded.composition) {
        try { expanded = resolveCompositionTemplate(expanded, 0, { width: W, height: H }, DEFAULT_COMPOSITION_TEMPLATES).spec; }
        catch (error) { findings.push({ shot: id, level: 'error', code: 'composition-template-invalid', message: error.message }); }
      }
      const result = lintComposition(expanded, {
        frame: { width: W, height: H },
        // A configured caption-safe area is meaningful only when captions are enabled.
        // Preserve the existing default-wide behavior for projects that omit "captions".
        captionSafe: cfg.captions !== false && bars > 0,
        captionHeight: (bars / H) * 100,
      });
      for (const x of result.diagnostics) findings.push({
        shot: id, level: x.level, code: x.code, message: x.message,
      });
      for (const x of lintCompositionFraming(expanded, result)) findings.push({ shot: id, ...x });
    } else {
      for (const x of lintVisualShot(spec, { W, H, bars, duration })) findings.push({ shot: id, ...x });
      shots.push({ id, spec });
    }
  }
  shots.sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9));
  findings.push(...lintVisualSequence(shots));
  return { findings, errors: findings.filter((x) => x.level === 'error').length, warnings: findings.filter((x) => x.level === 'warn').length };
}

export function printFindings({ findings, errors, warnings }, label = 'visual lint') {
  if (!findings.length) { console.log(`[${label}] clean`); return; }
  for (const x of findings) console.log(`[${label}] ${x.level === 'error' ? 'ERROR' : 'warn '} ${x.shot} ${x.code}: ${x.message}`);
  console.log(`[${label}] ${errors} error(s), ${warnings} warning(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), project = args.find((a) => !a.startsWith('--'));
  if (!project) { console.error('usage: node lint-visual.mjs projects/<name> [--warn]'); process.exit(2); }
  const r = lintProject(path.resolve(project));
  printFindings(r);
  process.exit(r.errors && !args.includes('--warn') ? 1 : 0);
}
