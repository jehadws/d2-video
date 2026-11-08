const SEVERITIES = new Set(['error', 'warning', 'info']);

export function createFinding(input) {
  const sceneId = input.sceneId || null;
  const entityIds = [...new Set(input.entityIds || [])].filter(Boolean).sort();
  const timestamp = input.timestamp || null;
  const severity = SEVERITIES.has(input.severity) ? input.severity : 'warning';
  const timeKey = timestamp ? Number(timestamp.local).toFixed(3) : 'static';
  const id = input.id || [sceneId || 'project', input.code || 'unknown', entityIds.join(','), timeKey].join(':');
  return {
    id,
    sceneId,
    ...(entityIds.length ? { entityIds } : {}),
    ...(timestamp ? { timestamp } : {}),
    severity,
    category: input.category || 'project',
    code: input.code || 'unspecified',
    message: input.message || 'No diagnostic message provided.',
    ...(input.suggestion ? { suggestion: input.suggestion } : {}),
    ...(input.evidence ? { evidence: input.evidence } : {}),
    detector: input.detector || 'qa',
    ...(Number.isFinite(input.confidence) ? { confidence: input.confidence } : {}),
  };
}

const CATEGORY_BY_CODE = [
  [/asset|manifest/, 'assets'],
  [/template|composition|framing|caption/, 'composition'],
  [/contact|relationship|constraint|entity-outside|collision|overlap/, 'geometry'],
  [/scene|shot|json|story/, 'project'],
];

export function normalizeLintFinding(item) {
  const code = item.code || 'unspecified';
  const category = CATEGORY_BY_CODE.find(([pattern]) => pattern.test(code))?.[1] || 'static';
  const entityIds = [item.entity, ...(item.entities || [])].filter(Boolean);
  return createFinding({
    sceneId: item.shot && item.shot !== 'assets.json' ? item.shot : null,
    entityIds,
    severity: item.level === 'error' ? 'error' : item.level === 'info' ? 'info' : 'warning',
    category,
    code,
    message: item.message,
    detector: 'static.visual-lint',
  });
}

export function countSeverities(findings) {
  return findings.reduce((counts, finding) => {
    counts[finding.severity] += 1;
    return counts;
  }, { error: 0, warning: 0, info: 0 });
}
