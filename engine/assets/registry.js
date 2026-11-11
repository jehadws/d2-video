// Small, deterministic registry for reusable visual production assets.
export const ASSET_SCHEMA_VERSION = 1;
export const ASSET_KINDS = Object.freeze(['character', 'prop', 'environment', 'material', 'lighting']);
const ID = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));

export function validateAssetDefinition(definition) {
  const errors = [];
  if (!object(definition)) return ['asset must be an object'];
  if (definition.schemaVersion !== ASSET_SCHEMA_VERSION) errors.push('schemaVersion must be 1');
  if (typeof definition.id !== 'string' || !ID.test(definition.id)) errors.push('id must be a stable namespaced id such as prop.cup');
  if (!ASSET_KINDS.includes(definition.kind)) errors.push('kind is unsupported');
  if (!Number.isInteger(definition.version) || definition.version < 1) errors.push('version must be a positive integer');
  if (typeof definition.name !== 'string' || !definition.name.trim()) errors.push('name must be a non-empty string');

  if (definition.kind === 'character') {
    if (!object(definition.render) || !['hero', 'figure'].includes(definition.render.type)) errors.push('character.render.type must be hero or figure');
    if (definition.render?.type === 'figure' && !object(definition.outfit)) errors.push('figure characters require an outfit object');
  }
  if (definition.kind === 'prop') {
    if (!object(definition.render) || !['rect', 'circle', 'cup', 'surface'].includes(definition.render.type)) errors.push('prop.render.type is unsupported');
    if (!object(definition.geometry)) errors.push('prop.geometry must be an object');
    else if (definition.render?.type === 'circle') {
      if (!finite(definition.geometry.radius) || definition.geometry.radius <= 0) errors.push('circle props require a positive geometry.radius');
    } else if (!finite(definition.geometry.width) || definition.geometry.width <= 0 || !finite(definition.geometry.height) || definition.geometry.height <= 0) {
      errors.push('prop geometry requires positive width and height');
    }
  }
  if (definition.kind === 'environment') {
    if (typeof definition.background !== 'string') errors.push('environment.background must be a CSS color');
    if (!Array.isArray(definition.layers)) errors.push('environment.layers must be an array');
    else definition.layers.forEach((layer, i) => {
      if (!object(layer) || !['rect', 'circle', 'line'].includes(layer.type)) errors.push(`environment.layers[${i}] has an unsupported primitive`);
      else if (![layer.x, layer.y, layer.w, layer.h].every(finite)) errors.push(`environment.layers[${i}] needs finite normalized x/y/w/h values`);
    });
  }
  if (definition.kind === 'material') {
    if (typeof definition.baseColor !== 'string') errors.push('material.baseColor must be a CSS color');
    for (const key of ['shadowColor', 'highlightColor']) if (definition[key] != null && typeof definition[key] !== 'string') errors.push(`material.${key} must be a CSS color`);
    if (definition.roughness != null && (!finite(definition.roughness) || definition.roughness < 0 || definition.roughness > 1)) errors.push('material.roughness must be between 0 and 1');
    if (definition.emission != null && (!finite(definition.emission) || definition.emission < 0)) errors.push('material.emission must be non-negative');
  }
  if (definition.kind === 'lighting') {
    if (typeof definition.tint !== 'string') errors.push('lighting.tint must be a CSS color');
    if (!finite(definition.opacity) || definition.opacity < 0 || definition.opacity > 0.25) errors.push('lighting.opacity must be between 0 and 0.25');
    if (definition.rimColor != null && typeof definition.rimColor !== 'string') errors.push('lighting.rimColor must be a CSS color');
    if (definition.rimWidth != null && (!finite(definition.rimWidth) || definition.rimWidth < 0 || definition.rimWidth > 8)) errors.push('lighting.rimWidth must be between 0 and 8');
    if (definition.highlightStrength != null && (!finite(definition.highlightStrength) || definition.highlightStrength < 0 || definition.highlightStrength > 2)) errors.push('lighting.highlightStrength must be between 0 and 2');
  }
  return errors;
}

export function createAssetRegistry(definitions = []) {
  const entries = new Map();
  const registry = {
    register(definition) {
      const errors = validateAssetDefinition(definition);
      if (errors.length) throw new TypeError(`Invalid asset ${definition?.id || '<unknown>'}: ${errors.join('; ')}`);
      if (entries.has(definition.id)) throw new Error(`Duplicate asset id "${definition.id}"`);
      const stored = Object.freeze(clone(definition));
      entries.set(stored.id, stored);
      return stored;
    },
    get(id) { return entries.get(id) || null; },
    require(id, kind) {
      const value = entries.get(id);
      if (!value) throw new Error(`Unknown asset "${id}"`);
      if (kind && value.kind !== kind) throw new TypeError(`Asset "${id}" is ${value.kind}, expected ${kind}`);
      return value;
    },
    has(id) { return entries.has(id); },
    list(kind) {
      return [...entries.values()].filter(item => !kind || item.kind === kind).sort((a, b) => a.id.localeCompare(b.id));
    },
  };
  for (const definition of definitions) registry.register(definition);
  return Object.freeze(registry);
}
