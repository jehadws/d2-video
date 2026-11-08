// Reusable composition-template contracts and registry (Phase 3.1).
// Templates describe intent and role requirements; geometry resolution stays in engine/geometry.
import { ENTITY_TYPES } from '../geometry/index.js';

export const TEMPLATE_SCHEMA_VERSION = 1;
export const COMPOSITION_ROLES = Object.freeze([
  'primary',
  'secondary',
  'objects',
  'environment',
]);

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));

function validateRoleDefinition(name, role, errors, templateId) {
  const path = 'roles.' + name;
  if (!isObject(role)) {
    errors.push(path + ' must be an object');
    return;
  }
  if (!Number.isInteger(role.min) || role.min < 0) errors.push(path + '.min must be a non-negative integer');
  if (!Number.isInteger(role.max) || role.max < 1) errors.push(path + '.max must be a positive integer');
  if (Number.isInteger(role.min) && Number.isInteger(role.max) && role.min > role.max) {
    errors.push(path + '.min cannot exceed .max');
  }
  if (!Array.isArray(role.types) || role.types.length === 0) {
    errors.push(path + '.types must be a non-empty array');
  } else {
    const seen = new Set();
    for (const type of role.types) {
      if (!ENTITY_TYPES.has(type)) errors.push(path + '.types contains unsupported entity type "' + type + '"');
      if (seen.has(type)) errors.push(path + '.types must not contain duplicates');
      seen.add(type);
    }
  }
  if (role.description != null && typeof role.description !== 'string') {
    errors.push(path + '.description must be a string');
  }
  if (templateId && !COMPOSITION_ROLES.includes(name)) {
    errors.push('roles contains unsupported role "' + name + '"');
  }
}

export function validateTemplateDefinition(definition) {
  const errors = [];
  if (!isObject(definition)) return ['template definition must be an object'];
  if (definition.schemaVersion !== TEMPLATE_SCHEMA_VERSION) {
    errors.push('schemaVersion must be ' + TEMPLATE_SCHEMA_VERSION);
  }
  if (typeof definition.id !== 'string' || !ID_PATTERN.test(definition.id)) {
    errors.push('id must be a lowercase kebab-case template identifier');
  }
  if (typeof definition.name !== 'string' || !definition.name.trim()) errors.push('name must be a non-empty string');
  if (typeof definition.description !== 'string' || !definition.description.trim()) {
    errors.push('description must be a non-empty string');
  }
  if (!isObject(definition.roles)) errors.push('roles must be an object');
  else {
    for (const [name, role] of Object.entries(definition.roles)) {
      validateRoleDefinition(name, role, errors, definition.id);
    }
    if (!Object.hasOwn(definition.roles, 'primary')) errors.push('roles.primary must be defined');
  }
  if (definition.allowedOverrides != null) {
    if (!Array.isArray(definition.allowedOverrides)) errors.push('allowedOverrides must be an array');
    else {
      const seen = new Set();
      for (const key of definition.allowedOverrides) {
        if (typeof key !== 'string' || !ID_PATTERN.test(key)) errors.push('allowedOverrides entries must be lowercase identifiers');
        if (seen.has(key)) errors.push('allowedOverrides must not contain duplicates');
        seen.add(key);
      }
    }
  }
  if (definition.defaults != null && !isObject(definition.defaults)) errors.push('defaults must be an object');
  return errors;
}

/**
 * Create an isolated registry. Definitions are validated and cloned on both
 * insertion and retrieval so callers cannot mutate registered templates.
 */
export function createTemplateRegistry(initialDefinitions = []) {
  if (!Array.isArray(initialDefinitions)) throw new TypeError('initialDefinitions must be an array');
  const definitions = new Map();

  function register(definition) {
    const errors = validateTemplateDefinition(definition);
    if (errors.length) throw new TypeError('Invalid composition template: ' + errors.join('; '));
    if (definitions.has(definition.id)) throw new Error('Composition template "' + definition.id + '" is already registered');
    definitions.set(definition.id, clone(definition));
    return get(definition.id);
  }

  function get(id) {
    const definition = definitions.get(id);
    return definition ? clone(definition) : null;
  }

  for (const definition of initialDefinitions) register(definition);

  return Object.freeze({
    register,
    get,
    has: id => definitions.has(id),
    list: () => [...definitions.values()].map(clone).sort((a, b) => a.id.localeCompare(b.id)),
  });
}

function validateRoleBindings(composition, entities, definition, errors) {
  const bindings = composition.roles == null ? {} : composition.roles;
  if (!isObject(bindings)) {
    errors.push('composition.roles must be an object');
    return;
  }

  for (const name of Object.keys(bindings)) {
    if (!COMPOSITION_ROLES.includes(name)) errors.push('composition.roles contains unsupported role "' + name + '"');
    else if (!Object.hasOwn(definition.roles, name)) errors.push('template "' + definition.id + '" does not support role "' + name + '"');
  }

  const entityById = new Map(entities.filter(entity => entity && typeof entity === 'object' && typeof entity.id === 'string').map(entity => [entity.id, entity]));
  const assigned = new Map();

  for (const [name, roleDefinition] of Object.entries(definition.roles)) {
    const raw = bindings[name];
    const ids = name === 'primary'
      ? (raw == null ? [] : [raw])
      : (raw == null ? [] : raw);

    if (name === 'primary' && raw != null && typeof raw !== 'string') {
      errors.push('composition.roles.primary must be an entity id string');
      continue;
    }
    if (name !== 'primary' && raw != null && (!Array.isArray(raw) || raw.some(id => typeof id !== 'string'))) {
      errors.push('composition.roles.' + name + ' must be an array of entity id strings');
      continue;
    }
    if (ids.length < roleDefinition.min || ids.length > roleDefinition.max) {
      errors.push('composition.roles.' + name + ' requires between ' + roleDefinition.min + ' and ' + roleDefinition.max + ' entities');
    }

    const local = new Set();
    for (const id of ids) {
      if (local.has(id)) errors.push('composition.roles.' + name + ' contains duplicate entity "' + id + '"');
      local.add(id);
      if (assigned.has(id)) errors.push('entity "' + id + '" is assigned to multiple composition roles');
      assigned.set(id, name);
      const entity = entityById.get(id);
      if (!entity) errors.push('composition.roles.' + name + ' references missing entity "' + id + '"');
      else if (!roleDefinition.types.includes(entity.type)) {
        errors.push('entity "' + id + '" has type "' + entity.type + '", not allowed for role "' + name + '"');
      }
    }
  }

  if (composition.intent?.focus != null) {
    const focus = composition.intent.focus;
    if (typeof focus !== 'string') errors.push('composition.intent.focus must be an entity id string');
    else if (!entityById.has(focus)) errors.push('composition.intent.focus references missing entity "' + focus + '"');
    else if (!assigned.has(focus)) errors.push('composition.intent.focus must reference an entity assigned to a composition role');
  }
}

export function validateTemplateRequest(spec, registry) {
  const errors = [];
  if (!isObject(spec)) return ['shot must be an object'];
  if (spec.composition == null) return errors;

  const composition = spec.composition;
  if (!isObject(composition)) return ['composition must be an object'];
  if (typeof composition.template !== 'string' || !ID_PATTERN.test(composition.template)) {
    errors.push('composition.template must be a lowercase kebab-case identifier');
    return errors;
  }
  if (composition.intent != null) {
    if (!isObject(composition.intent)) errors.push('composition.intent must be an object');
    else {
      for (const key of ['emotion', 'purpose']) {
        if (composition.intent[key] != null && typeof composition.intent[key] !== 'string') {
          errors.push('composition.intent.' + key + ' must be a string');
        }
      }
      if (composition.intent.focus != null && typeof composition.intent.focus !== 'string') {
        errors.push('composition.intent.focus must be an entity id string');
      }
    }
  }
  if (composition.roles != null && !isObject(composition.roles)) errors.push('composition.roles must be an object');
  if (composition.overrides != null && !isObject(composition.overrides)) errors.push('composition.overrides must be an object');

  if (!registry || typeof registry.get !== 'function') {
    errors.push('a composition template registry is required');
    return errors;
  }
  const definition = registry.get(composition.template);
  if (!definition) {
    errors.push('unknown composition template "' + composition.template + '"');
    return errors;
  }

  validateRoleBindings(composition, Array.isArray(spec.entities) ? spec.entities : [], definition, errors);

  const overrides = composition.overrides || {};
  const allowed = new Set(definition.allowedOverrides || []);
  for (const key of Object.keys(overrides)) {
    if (!allowed.has(key)) errors.push('template "' + definition.id + '" does not allow override "' + key + '"');
    if (!isObject(overrides[key])) errors.push('composition.overrides.' + key + ' must be an object');
  }
  return errors;
}
