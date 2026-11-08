import { createAssetRegistry, validateAssetDefinition, ASSET_SCHEMA_VERSION, ASSET_KINDS } from './registry.js';
import { BUILTIN_ASSETS } from './definitions.js';

export { createAssetRegistry, validateAssetDefinition, ASSET_SCHEMA_VERSION, ASSET_KINDS };
export const ASSET_REGISTRY = createAssetRegistry(BUILTIN_ASSETS);

const clone = value => JSON.parse(JSON.stringify(value));

export function validateAssetReferences(spec, registry = ASSET_REGISTRY) {
  const errors = [];
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return ['shot must be an object'];
  if (spec.environment != null) {
    const asset = registry.get(spec.environment);
    if (!asset || asset.kind !== 'environment') errors.push(`environment references unknown environment asset "${spec.environment}"`);
  }
  if (spec.lighting != null) {
    const asset = registry.get(spec.lighting);
    if (!asset || asset.kind !== 'lighting') errors.push(`lighting references unknown lighting asset "${spec.lighting}"`);
  }
  const entities = Array.isArray(spec.entities) ? spec.entities : [];
  for (const [i, entity] of entities.entries()) {
    if (!entity || typeof entity !== 'object') continue;
    const prefix = `entities[${i}]`;
    let asset = null;
    if (entity.assetId != null) {
      asset = registry.get(entity.assetId);
      if (!asset) errors.push(`${prefix}.assetId references unknown asset "${entity.assetId}"`);
      else if (!['character', 'prop'].includes(asset.kind)) errors.push(`${prefix}.assetId must reference a character or prop asset`);
      else if (entity.assetVersion != null && entity.assetVersion !== asset.version) errors.push(`${prefix}.assetVersion does not match ${asset.id}@${asset.version}`);
      else if (entity.type != null && asset.kind === 'character' && entity.type !== asset.render.type) errors.push(`${prefix}.type conflicts with ${asset.id}`);
      else if (entity.type != null && asset.kind === 'prop' && entity.type !== asset.render.type) errors.push(`${prefix}.type conflicts with ${asset.id}`);
    }
    const materialId = entity.material || asset?.material;
    if (materialId != null) {
      const material = registry.get(materialId);
      if (!material || material.kind !== 'material') errors.push(`${prefix}.material references unknown material "${materialId}"`);
    }
  }
  return errors;
}

export function resolveAssetReferences(spec, registry = ASSET_REGISTRY) {
  const errors = validateAssetReferences(spec, registry);
  if (errors.length) throw new TypeError('Invalid visual asset references: ' + errors.join('; '));
  const out = clone(spec);
  out.entities = (out.entities || []).map(entity => {
    const next = { ...entity };
    const asset = next.assetId ? registry.require(next.assetId) : null;
    if (asset?.kind === 'character') {
      next.type = asset.render.type;
      if (asset.render.type === 'figure') next.outfit = { ...asset.outfit, ...(next.outfit || {}) };
      next.identity = asset.id;
    } else if (asset?.kind === 'prop') {
      next.type = asset.render.type;
      next.geometry = { ...asset.geometry, ...(next.geometry || {}) };
      next.style = { ...(asset.style || {}), ...(next.style || {}) };
    }
    const materialId = next.material || asset?.material;
    if (materialId) {
      const material = registry.require(materialId, 'material');
      next.material = materialId;
      next.materialDef = material;
      next.style = { ...(next.style || {}), fill: next.style?.fill || material.baseColor,
        handle: next.style?.handle || material.baseColor, rim: next.style?.rim || material.highlightColor,
        highlight: material.highlightColor, shadow: material.shadowColor };
    }
    return next;
  });
  if (out.environment) out.environmentDef = registry.require(out.environment, 'environment');
  if (out.lighting) out.lightingDef = registry.require(out.lighting, 'lighting');
  return out;
}

export function listAssets(kind) { return ASSET_REGISTRY.list(kind); }
