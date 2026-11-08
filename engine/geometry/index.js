// Deterministic frame-relative geometry for semantic visual compositions (DSL v2).
import { POSES } from '../rig2d.js';
import { ease } from '../core.js';

export const FRAME_HEIGHT_UNITS = 100;
export const ENTITY_TYPES = new Set(['hero', 'figure', 'rect', 'circle', 'cup', 'surface']);
const EPSILON = 1e-5;
const finite = (n) => typeof n === 'number' && Number.isFinite(n);
const point = (p) => p && finite(p.x) && finite(p.y);
const clone = (v) => JSON.parse(JSON.stringify(v));

export function pixelsPerUnit(frame) {
  if (!frame || !finite(frame.width) || !finite(frame.height) || frame.width <= 0 || frame.height <= 0) {
    throw new TypeError('frame.width and frame.height must be positive finite numbers');
  }
  return frame.height / FRAME_HEIGHT_UNITS;
}
export function worldToScreen(p, frame) {
  const s = pixelsPerUnit(frame);
  return { x: frame.width / 2 + p.x * s, y: frame.height / 2 + p.y * s };
}
export function screenToWorld(p, frame) {
  const s = pixelsPerUnit(frame);
  return { x: (p.x - frame.width / 2) / s, y: (p.y - frame.height / 2) / s };
}
export function transformPoint(p, transform = {}) {
  const scale = finite(transform.scale) ? transform.scale : 1;
  const rotation = finite(transform.rotation) ? transform.rotation : 0;
  const c = Math.cos(rotation), s = Math.sin(rotation);
  const x = p.x * scale, y = p.y * scale;
  return { x: (transform.position?.x || 0) + x * c - y * s,
    y: (transform.position?.y || 0) + x * s + y * c };
}
export function boundsFromPoints(points, padding = 0) {
  if (!points.length) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const left = Math.min(...xs) - padding, right = Math.max(...xs) + padding;
  const top = Math.min(...ys) - padding, bottom = Math.max(...ys) + padding;
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}
export function translateBounds(b, dx, dy) {
  return { left: b.left + dx, right: b.right + dx, top: b.top + dy, bottom: b.bottom + dy, width: b.width, height: b.height };
}
export function intersects(a, b) {
  return a.left < b.right - EPSILON && a.right > b.left + EPSILON &&
    a.top < b.bottom - EPSILON && a.bottom > b.top + EPSILON;
}
function rotatePoint(p, scale, rotation) {
  const x = p.x * scale, y = p.y * scale, c = Math.cos(rotation), s = Math.sin(rotation);
  return { x: x * c - y * s, y: x * s + y * c };
}
function localGeometry(entity) {
  const g = entity.geometry || {};
  if (entity.type === 'hero' || entity.type === 'figure') {
    const pose = entity.pose == null ? POSES.stand : typeof entity.pose === 'string' ? POSES[entity.pose] : entity.pose;
    if (!pose || !pose.head || !pose.hF || !pose.hB) throw new Error(`Unknown or incomplete pose for entity "${entity.id}"`);
    // Rig coordinates are renderer pixels at 1080p; 10.8 rig px = one world unit.
    const keys = ['head', 'sh', 'hip', 'eF', 'hF', 'eB', 'hB', 'kF', 'fF', 'kB', 'fB'];
    const facing = entity.facing === -1 ? -1 : 1;
    const anchors = {};
    for (const key of keys) if (pose[key]) anchors[key] = { x: pose[key][0] * facing / 10.8, y: pose[key][1] / 10.8 };
    anchors['hand.near'] = anchors.hF;
    anchors['elbow.near'] = anchors.eF;
    anchors['elbow.far'] = anchors.eB;
    anchors.shoulder = anchors.sh;
    anchors['hand.far'] = anchors.hB;
    anchors['head.center'] = anchors.head;
    anchors['foot.near'] = anchors.fF;
    anchors['foot.far'] = anchors.fB;
    const pts = Object.values(anchors).filter(Boolean);
    const head = anchors.head;
    const b = boundsFromPoints(pts, 1.6);
    b.top = Math.min(b.top, head.y - 1.8); b.left = Math.min(b.left, head.x - 1.8); b.right = Math.max(b.right, head.x + 1.8);
    b.width = b.right - b.left; b.height = b.bottom - b.top;
    return { bounds: b, anchors };
  }
  if (entity.type === 'circle') {
    const r = finite(g.radius) ? g.radius : 0;
    return { bounds: { left: -r, right: r, top: -r, bottom: r, width: 2*r, height: 2*r },
      anchors: { center: {x:0,y:0}, top: {x:0,y:-r}, bottom: {x:0,y:r}, left: {x:-r,y:0}, right: {x:r,y:0} } };
  }
  const w = finite(g.width) ? g.width : 0, h = finite(g.height) ? g.height : 0;
  const anchors = { center:{x:0,y:0}, top:{x:0,y:-h/2}, bottom:{x:0,y:h/2},
    left:{x:-w/2,y:0}, right:{x:w/2,y:0}, topLeft:{x:-w/2,y:-h/2}, topRight:{x:w/2,y:-h/2} };
  if (entity.type === 'cup') {
    anchors.grip = { x: w * 0.72, y: 0 };
    anchors.rim = { x: 0, y: -h * 0.38 };
    anchors.bottom = { x: 0, y: h * 0.52 };
  }
  if (entity.type === 'surface') {
    anchors.top = { x: 0, y: -h/2 };
    anchors.topLeft = { x: -w/2, y: -h/2 };
    anchors.topRight = { x: w/2, y: -h/2 };
  }
  const left=-w/2, right=entity.type==='cup'?w*0.72:w/2, top=-h/2, bottom=entity.type==='cup'?h*0.52:h/2;
  return { bounds: { left, right, top, bottom, width:right-left, height:bottom-top }, anchors };
}
export function getEntityGeometry(entity) {
  const transform = entity.transform || {};
  const position = transform.position || entity.position || {x:0,y:0};
  const scale = finite(transform.scale) ? transform.scale : 1;
  const rotation = finite(transform.rotation) ? transform.rotation : 0;
  const local = localGeometry(entity);
  const anchors = {};
  for (const [name, p] of Object.entries(local.anchors)) {
    const q = rotatePoint(p, scale, rotation);
    anchors[name] = { x: position.x + q.x, y: position.y + q.y };
  }
  const corners = [
    {x:local.bounds.left,y:local.bounds.top},{x:local.bounds.right,y:local.bounds.top},
    {x:local.bounds.right,y:local.bounds.bottom},{x:local.bounds.left,y:local.bounds.bottom},
  ].map(p => { const q = rotatePoint(p, scale, rotation); return {x:position.x+q.x,y:position.y+q.y}; });
  return { id: entity.id, type: entity.type, position: { ...position }, scale, rotation,
    z: finite(transform.z) ? transform.z : (finite(entity.z) ? entity.z : 0),
    anchors, bounds: boundsFromPoints(corners) };
}
function sample(track, t, fallback) {
  if (finite(track)) return track;
  if (!Array.isArray(track) || !track.length) return fallback;
  if (t <= track[0].at) return track[0].value;
  for (let i=1;i<track.length;i++) {
    const a=track[i-1], b=track[i];
    if (t <= b.at) { const u=(t-a.at)/(b.at-a.at); const fn=ease[b.ease||'inOut']||ease.inOut; return a.value+(b.value-a.value)*fn(u); }
  }
  return track[track.length-1].value;
}
function atTime(entity, t) {
  const out = clone(entity), tr = out.transform || (out.transform = {});
  tr.position = { ...(tr.position || out.position || {x:0,y:0}) };
  for (const key of ['x','y','scale','rotation','z']) {
    const track = out.animate?.[key];
    if (track) {
      const fallback = key === 'x' ? tr.position.x : key === 'y' ? tr.position.y : (tr[key] ?? 0);
      const value = sample(track,t,fallback);
      if (key === 'x') tr.position.x=value; else if (key === 'y') tr.position.y=value; else tr[key]=value;
    }
  }
  return out;
}
function anchor(entity, name) {
  const geo = getEntityGeometry(entity), p = geo.anchors[name];
  if (!p) throw new Error(`Entity "${entity.id}" has no anchor "${name}"`);
  return p;
}
function moveEntity(entity, dx, dy, diagnostics, constraint) {
  const tr = entity.transform || (entity.transform = {});
  const pos = tr.position || (tr.position = {x:0,y:0});
  if (entity.lockPosition && Math.hypot(dx,dy) > 0.05) {
    diagnostics.push({level:'error',code:'locked-position-conflict',entity:entity.id,
      relationship:constraint.type,message:`"${entity.id}" is locked but relationship "${constraint.type}" requires movement`});
    return;
  }
  pos.x += dx; pos.y += dy;
}
function align(entity, subjectAnchor, target, targetAnchor, diagnostics, c) {
  const a=anchor(entity,subjectAnchor), b=anchor(target,targetAnchor);
  moveEntity(entity,b.x-a.x,b.y-a.y,diagnostics,c);
}
function cycleDiagnostics(entities, relationships) {
  const ids = new Set(entities.map(e=>e.id)), edges = new Map([...ids].map(id=>[id,[]]));
  for (const c of relationships) if (c.target && ids.has(c.subject) && ids.has(c.target)) edges.get(c.target).push(c.subject);
  const state=new Map(), stack=[], cycles=[];
  function visit(id) {
    if(state.get(id)===1){const i=stack.indexOf(id);cycles.push(stack.slice(i).concat(id));return;}
    if(state.get(id)===2)return;
    state.set(id,1);stack.push(id);
    for(const next of edges.get(id)||[])visit(next);
    stack.pop();state.set(id,2);
  }
  for(const id of ids)visit(id);
  return cycles;
}
function solveRelationship(c, byId, diagnostics, frame) {
  const subject=byId.get(c.subject), target=c.target ? byId.get(c.target) : null;
  if(!subject){diagnostics.push({level:'error',code:'missing-subject',relationship:c.type,message:`Missing subject "${c.subject}"`});return;}
  if(c.target && !target){diagnostics.push({level:'error',code:'missing-target',relationship:c.type,message:`Missing target "${c.target}"`});return;}
  const gap=finite(c.gap)?c.gap:2;
  try {
    switch(c.type) {
      case 'held_by': case 'touching':
        align(subject,c.subjectAnchor || (c.type==='held_by'?'grip':'center'),target,c.targetAnchor || 'hand.near',diagnostics,c); break;
      case 'on_surface':
        align(subject,c.subjectAnchor || 'bottom',target,c.targetAnchor || 'top',diagnostics,c);
        break;
      case 'left_of': {
        const a=getEntityGeometry(subject).bounds,b=getEntityGeometry(target).bounds;
        moveEntity(subject,b.left-gap-a.right, b.top+b.height/2-(a.top+a.height/2),diagnostics,c); break;
      }
      case 'right_of': {
        const a=getEntityGeometry(subject).bounds,b=getEntityGeometry(target).bounds;
        moveEntity(subject,b.right+gap-a.left, b.top+b.height/2-(a.top+a.height/2),diagnostics,c); break;
      }
      case 'above': {
        const a=getEntityGeometry(subject).bounds,b=getEntityGeometry(target).bounds;
        moveEntity(subject,b.left+b.width/2-(a.left+a.width/2),b.top-gap-a.bottom,diagnostics,c); break;
      }
      case 'below': {
        const a=getEntityGeometry(subject).bounds,b=getEntityGeometry(target).bounds;
        moveEntity(subject,b.left+b.width/2-(a.left+a.width/2),b.bottom+gap-a.top,diagnostics,c); break;
      }
      case 'behind': subject.transform.z=(target.transform?.z ?? target.z ?? 0)-1; break;
      case 'in_front_of': subject.transform.z=(target.transform?.z ?? target.z ?? 0)+1; break;
      case 'inside_frame': {
        const g=getEntityGeometry(subject), b=g.bounds;
        const view=frame.view || {left:-frame.width/frame.height*50,right:frame.width/frame.height*50,top:-50,bottom:50};
        const dx=b.left<view.left ? view.left-b.left : b.right>view.right ? view.right-b.right : 0;
        const dy=b.top<view.top ? view.top-b.top : b.bottom>view.bottom ? view.bottom-b.bottom : 0;
        moveEntity(subject,dx,dy,diagnostics,c); break;
      }
      default: diagnostics.push({level:'error',code:'unknown-relationship',relationship:c.type,message:`Unsupported relationship "${c.type}"`});
    }
  } catch(error) {
    diagnostics.push({level:'error',code:'anchor-resolution-failed',entity:subject.id,relationship:c.type,message:error.message});
  }
}
function relationshipSatisfied(c, byId, view) {
  const a=byId.get(c.subject), b=c.target?byId.get(c.target):null, tol=c.tolerance??0.1;
  if(!a)return false;
  if(c.type==='inside_frame'){
    const g=getEntityGeometry(a).bounds;
    return g.left>=view.left-tol&&g.right<=view.right+tol&&g.top>=view.top-tol&&g.bottom<=view.bottom+tol;
  }
  if(!b)return false;
  if(c.type==='held_by'||c.type==='touching'||c.type==='on_surface'){
    const ap=anchor(a,c.subjectAnchor||(c.type==='held_by'?'grip':c.type==='on_surface'?'bottom':'center'));
    const bp=anchor(b,c.targetAnchor||(c.type==='on_surface'?'top':'hand.near'));
    return Math.hypot(ap.x-bp.x,ap.y-bp.y)<=tol;
  }
  if(c.type==='behind')return (a.transform?.z??a.z??0)<(b.transform?.z??b.z??0);
  if(c.type==='in_front_of')return (a.transform?.z??a.z??0)>(b.transform?.z??b.z??0);
  const ab=getEntityGeometry(a).bounds,bb=getEntityGeometry(b).bounds,gap=c.gap??2;
  if(c.type==='left_of')return Math.abs((bb.left-ab.right)-gap)<=tol&&Math.abs((ab.top+ab.bottom-bb.top-bb.bottom)/2)<=tol;
  if(c.type==='right_of')return Math.abs((ab.left-bb.right)-gap)<=tol&&Math.abs((ab.top+ab.bottom-bb.top-bb.bottom)/2)<=tol;
  if(c.type==='above')return Math.abs((bb.top-ab.bottom)-gap)<=tol&&Math.abs((ab.left+ab.right-bb.left-bb.right)/2)<=tol;
  if(c.type==='below')return Math.abs((ab.top-bb.bottom)-gap)<=tol&&Math.abs((ab.left+ab.right-bb.left-bb.right)/2)<=tol;
  return false;
}
function viewportFor(camera, time, frame) {
  const zoom=Math.max(0.01,sample(camera?.zoom,time,1));
  const width=frame.width/frame.height*100/zoom, height=100/zoom;
  const x=sample(camera?.x,time,0), y=sample(camera?.y,time,0);
  return {left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2};
}
export function validateComposition(spec) {
  const errors=[];
  if(!spec||typeof spec!=='object'||Array.isArray(spec))return ['composition must be an object'];
  if(spec.version!==2)errors.push('version must be 2');
  if(typeof spec.id!=='string'||!/^s[\w-]+$/.test(spec.id))errors.push('id must be a shot id');
  if(!Array.isArray(spec.entities)||!spec.entities.length)errors.push('entities must be a non-empty array');
  const ids=new Set();
  for(const [i,e] of (Array.isArray(spec.entities)?spec.entities:[]).entries()){
    const p=`entities[${i}]`;
    if(!e||typeof e!=='object'||Array.isArray(e)){errors.push(p+' must be an object');continue;}
    if(typeof e.id!=='string'||!e.id)errors.push(p+'.id must be a non-empty string');
    else if(ids.has(e.id))errors.push(p+'.id must be unique'); else ids.add(e.id);
    if(!ENTITY_TYPES.has(e.type))errors.push(p+'.type is unsupported');
    if(e.transform!=null&&(!e.transform||typeof e.transform!=='object'||Array.isArray(e.transform)))errors.push(p+'.transform must be an object');
    const tr=e.transform||{};
    const pos=tr.position||e.position;
    if(pos && (!finite(pos.x)||!finite(pos.y)))errors.push(p+'.transform.position must contain finite x/y');
    if(tr.scale!=null&&(!finite(tr.scale)||tr.scale<=0))errors.push(p+'.transform.scale must be positive and finite');
    if(tr.rotation!=null&&!finite(tr.rotation))errors.push(p+'.transform.rotation must be finite');
    if(tr.z!=null&&!finite(tr.z))errors.push(p+'.transform.z must be finite');
    if(['hero','figure'].includes(e.type)&&e.pose!=null&&!POSES[e.pose])errors.push(p+'.pose is not a known rig pose');
    const g=e.geometry||{};
    if(['rect','surface','cup'].includes(e.type)&&(!finite(g.width)||g.width<=0||!finite(g.height)||g.height<=0))errors.push(p+'.geometry needs positive width/height');
    if(e.type==='circle'&&(!finite(g.radius)||g.radius<=0))errors.push(p+'.geometry.radius must be positive');
    if(e.animate!=null&&(!e.animate||typeof e.animate!=='object'||Array.isArray(e.animate)))errors.push(p+'.animate must be an object');
    if(e.animate&&typeof e.animate==='object'&&!Array.isArray(e.animate))for(const [key,track] of Object.entries(e.animate)){
      if(!['x','y','scale','rotation','z'].includes(key)||!Array.isArray(track)||!track.length)errors.push(p+'.animate.'+key+' is invalid');
      else {let prev=-Infinity;for(const f of track){if(!f||typeof f!=='object'||!finite(f.at)||f.at<0||f.at<=prev||!finite(f.value)||(f.ease!=null&&!ease[f.ease]))errors.push(p+'.animate.'+key+' has invalid keyframes');if(f&&finite(f.at))prev=f.at;}}
    }
  }
  if(spec.relationships!=null&&!Array.isArray(spec.relationships))errors.push('relationships must be an array');
  if(spec.camera!=null&&(!spec.camera||typeof spec.camera!=='object'||Array.isArray(spec.camera)))errors.push('camera must be an object');
  if(spec.camera&&typeof spec.camera==='object')for(const key of ['x','y','zoom']){const v=spec.camera[key];if(v!=null&&!finite(v)&&!Array.isArray(v))errors.push('camera.'+key+' must be a finite number or keyframe array');if(key==='zoom'&&finite(v)&&v<=0)errors.push('camera.zoom must be positive');if(Array.isArray(v)){let prev=-Infinity;if(!v.length)errors.push('camera.'+key+' keyframes must not be empty');for(const f of v){if(!f||typeof f!=='object'||!finite(f.at)||f.at<0||f.at<=prev||!finite(f.value)||(f.ease!=null&&!ease[f.ease])||(key==='zoom'&&f.value<=0))errors.push('camera.'+key+' has invalid keyframes');if(f&&finite(f.at))prev=f.at;}}}
  for(const [i,c] of (Array.isArray(spec.relationships)?spec.relationships:[]).entries()){
    if(!c||typeof c!=='object'||!['left_of','right_of','above','below','held_by','touching','on_surface','behind','in_front_of','inside_frame'].includes(c.type))errors.push(`relationships[${i}].type is unsupported`);
    if(!c||!ids.has(c.subject))errors.push(`relationships[${i}].subject does not exist`);
    if(c?.type!=='inside_frame'&&c?.target&&!ids.has(c.target))errors.push(`relationships[${i}].target does not exist`);
    if(c?.type!=='inside_frame'&&!c?.target)errors.push(`relationships[${i}].target is required`);
    if(c?.priority!=null&&!finite(c.priority))errors.push(`relationships[${i}].priority must be finite`);
    if(c?.gap!=null&&(!finite(c.gap)||c.gap<0))errors.push(`relationships[${i}].gap must be non-negative and finite`);
    if(c?.tolerance!=null&&(!finite(c.tolerance)||c.tolerance<=0))errors.push(`relationships[${i}].tolerance must be positive and finite`);
    if(c?.subjectAnchor!=null&&typeof c.subjectAnchor!=='string')errors.push(`relationships[${i}].subjectAnchor must be a string`);
    if(c?.targetAnchor!=null&&typeof c.targetAnchor!=='string')errors.push(`relationships[${i}].targetAnchor must be a string`);
  }
  return errors;
}
function orderConstraints(entities, constraints) {
  const bySubject = new Map(entities.map(entity => [entity.id, []]));
  for (const constraint of constraints) {
    const list = bySubject.get(constraint.subject);
    if (list) list.push(constraint);
  }
  const ordered = [], visited = new Set(), visiting = new Set();
  const priorityOrder = (a, b) => (a.priority ?? 0) - (b.priority ?? 0);

  function visit(entityId) {
    if (visited.has(entityId) || visiting.has(entityId)) return;
    visiting.add(entityId);
    const own = bySubject.get(entityId) || [];
    const positional = own.filter(c => c.type !== 'inside_frame').sort(priorityOrder);
    const containment = own.filter(c => c.type === 'inside_frame').sort(priorityOrder);

    // Resolve a target's own placement before positioning entities relative to it.
    for (const constraint of positional) {
      if (constraint.target) visit(constraint.target);
      ordered.push(constraint);
    }
    // Containment must run after every relationship that can move this entity.
    ordered.push(...containment);
    visiting.delete(entityId);
    visited.add(entityId);
  }

  for (const entity of entities) visit(entity.id);
  return ordered;
}

export function resolveComposition(spec, time=0, frame={width:1920,height:1080}) {
  const validation=validateComposition(spec);
  if(validation.length)return {entities:[],geometry:[],diagnostics:validation.map(message=>({level:'error',code:'invalid-composition',message})),valid:false};
  const entities=spec.entities.map(e=>atTime(e,time)), byId=new Map(entities.map(e=>[e.id,e]));
  const diagnostics=[], view=viewportFor(spec.camera,time,frame), solveFrame={...frame,view};
  const cycles=cycleDiagnostics(entities,spec.relationships||[]);
  for(const cycle of cycles)diagnostics.push({level:'error',code:'constraint-cycle',entities:cycle,message:`Constraint cycle: ${cycle.join(' -> ')}`});
  if(!cycles.length){
    const constraints=orderConstraints(entities,spec.relationships||[]);
    for(const c of constraints)solveRelationship(c,byId,diagnostics,solveFrame);
    for(const c of constraints)if(!relationshipSatisfied(c,byId,view))
      diagnostics.push({level:'error',code:'constraint-unsatisfied',entity:c.subject,relationship:c.type,
        message:`Relationship "${c.type}" for "${c.subject}" could not be satisfied`});
  }
  const geometry=entities.map(getEntityGeometry);
  return {entities,geometry,viewport:view,diagnostics,valid:!diagnostics.some(d=>d.level==='error')};
}
export function lintComposition(spec, options={}) {
  const frame=options.frame||{width:1920,height:1080}, result=resolveComposition(spec,options.time||0,frame);
  const diagnostics=[...result.diagnostics], view=result.viewport||{left:-frame.width/frame.height*50,right:frame.width/frame.height*50,top:-50,bottom:50};
  const captionHeight=finite(options.captionHeight)?options.captionHeight*((view.bottom-view.top)/100):14;
  const captionTop=finite(options.captionTop)?options.captionTop:view.bottom-captionHeight;
  for(const g of result.geometry){
    const b=g.bounds;
    if(b.left<view.left-EPSILON||b.right>view.right+EPSILON||b.top<view.top-EPSILON||b.bottom>view.bottom+EPSILON)
      diagnostics.push({level:'warn',code:'entity-outside-frame',entity:g.id,message:`"${g.id}" extends beyond the camera frame`});
    if(options.captionSafe&&b.bottom>captionTop)
      diagnostics.push({level:'warn',code:'caption-safe-area',entity:g.id,message:`"${g.id}" overlaps the caption-safe area`});
  }
  const linked=new Set((spec.relationships||[]).filter(c=>['held_by','touching','on_surface','behind','in_front_of'].includes(c.type)).map(c=>[c.subject,c.target].sort().join(':')));
  for(let i=0;i<result.geometry.length;i++)for(let j=i+1;j<result.geometry.length;j++){
    const a=result.geometry[i],b=result.geometry[j];
    if(intersects(a.bounds,b.bounds)&&!linked.has([a.id,b.id].sort().join(':')))
      diagnostics.push({level:'warn',code:'entity-overlap',entities:[a.id,b.id],message:`"${a.id}" overlaps "${b.id}"`});
  }
  return { ...result, diagnostics, errors:diagnostics.filter(d=>d.level==='error').length,
    warnings:diagnostics.filter(d=>d.level==='warn').length };
}
export const evaluateComposition = resolveComposition;
