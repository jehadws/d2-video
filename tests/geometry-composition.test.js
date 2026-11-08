import test from 'node:test';
import assert from 'node:assert/strict';
import { FRAME_HEIGHT_UNITS, worldToScreen, screenToWorld, getEntityGeometry, resolveComposition, lintComposition, validateComposition } from '../engine/geometry/index.js';

const hero = (overrides={}) => ({id:'hero',type:'hero',pose:'reach',transform:{position:{x:0,y:0},scale:1},...overrides});

test('canonical world space is frame-height relative and resolution independent',()=>{
  const p={x:12,y:-8};
  const a=worldToScreen(p,{width:1920,height:1080});
  const b=worldToScreen(p,{width:3840,height:2160});
  assert.ok(Math.abs(a.x*2-b.x)<1e-9); assert.ok(Math.abs(a.y*2-b.y)<1e-9);
  const roundTrip=screenToWorld(a,{width:1920,height:1080});
  assert.ok(Math.abs(roundTrip.x-p.x)<1e-9); assert.ok(Math.abs(roundTrip.y-p.y)<1e-9);
  assert.equal(FRAME_HEIGHT_UNITS,100);
});

test('rig anchors come from the selected canonical rig pose and respect facing',()=>{
  const a=getEntityGeometry(hero()).anchors['hand.near'];
  const b=getEntityGeometry(hero({facing:-1})).anchors['hand.near'];
  assert.ok(a.x>0); assert.ok(b.x<0); assert.equal(a.y,b.y);
});

test('held_by resolves a cup grip to the near hand without manual cup coordinates',()=>{
  const spec={version:2,id:'s001',entities:[hero(),{id:'cup',type:'cup',geometry:{width:8,height:10},transform:{position:{x:0,y:0}}}],
    relationships:[{type:'held_by',subject:'cup',target:'hero',subjectAnchor:'grip',targetAnchor:'hand.near'}]};
  const r=resolveComposition(spec,0);
  assert.equal(r.valid,true);
  const h=r.geometry.find(x=>x.id==='hero').anchors['hand.near'];
  const c=r.geometry.find(x=>x.id==='cup').anchors.grip;
  assert.ok(Math.hypot(h.x-c.x,h.y-c.y)<1e-4);
});

test('on_surface aligns the object bottom with the surface top',()=>{
  const spec={version:2,id:'s002',entities:[
    {id:'table',type:'surface',geometry:{width:60,height:5},transform:{position:{x:0,y:10}}},
    {id:'cup',type:'cup',geometry:{width:8,height:10},transform:{position:{x:12,y:-20}}},
  ],relationships:[{type:'on_surface',subject:'cup',target:'table'}]};
  const r=resolveComposition(spec);
  const cup=r.geometry.find(x=>x.id==='cup'), table=r.geometry.find(x=>x.id==='table');
  assert.ok(Math.abs(cup.anchors.bottom.y-table.anchors.top.y)<1e-4);
});

test('moving a character over time moves its attached prop with the hand',()=>{
  const spec={version:2,id:'s003',entities:[
    hero({animate:{x:[{at:0,value:0},{at:2,value:20}]}}),
    {id:'cup',type:'cup',geometry:{width:8,height:10},transform:{position:{x:0,y:0}}},
  ],relationships:[{type:'held_by',subject:'cup',target:'hero',subjectAnchor:'grip',targetAnchor:'hand.near'}]};
  const a=resolveComposition(spec,0),b=resolveComposition(spec,2);
  const ax=a.geometry.find(x=>x.id==='cup').anchors.grip.x;
  const bx=b.geometry.find(x=>x.id==='cup').anchors.grip.x;
  assert.ok(bx>ax+19);
});

test('constraint cycles are diagnosed instead of producing unstable transforms',()=>{
  const spec={version:2,id:'s004',entities:[
    {id:'a',type:'circle',geometry:{radius:2}},
    {id:'b',type:'circle',geometry:{radius:2}},
  ],relationships:[{type:'left_of',subject:'a',target:'b'},{type:'left_of',subject:'b',target:'a'}]};
  const r=resolveComposition(spec);
  assert.ok(r.diagnostics.some(d=>d.code==='constraint-cycle'));
});

test('locked transforms report conflicting hard relationships',()=>{
  const spec={version:2,id:'s005',entities:[
    {id:'a',type:'circle',geometry:{radius:2},lockPosition:true},
    {id:'b',type:'circle',geometry:{radius:2},transform:{position:{x:20,y:0}}},
  ],relationships:[{type:'left_of',subject:'a',target:'b'}]};
  const r=resolveComposition(spec);
  assert.ok(r.diagnostics.some(d=>d.code==='locked-position-conflict'));
});

test('inside_frame clamps geometry and lint reports caption-safe overlap',()=>{
  const spec={version:2,id:'s006',entities:[
    {id:'hero',type:'hero',pose:'stand',transform:{position:{x:200,y:0},scale:1}},
  ],relationships:[{type:'inside_frame',subject:'hero'}]};
  const r=lintComposition(spec,{captionSafe:true,captionTop:0});
  assert.ok(r.geometry[0].bounds.right<=100*1920/1080/2+1e-4);
  assert.ok(r.warnings>=1);
});

test('validation rejects duplicate IDs and invalid geometry',()=>{
  const errors=validateComposition({version:2,id:'s007',entities:[
    {id:'x',type:'cup',geometry:{width:-1,height:0}},
    {id:'x',type:'cup',geometry:{width:2,height:2}},
  ],relationships:[]});
  assert.ok(errors.some(x=>x.includes('unique')));
  assert.ok(errors.some(x=>x.includes('positive width/height')));
});

test('far-hand attachments use the same canonical rig geometry',()=>{
  const spec={version:2,id:'s008',entities:[
    hero({pose:'reach',facing:-1}),
    {id:'cup',type:'cup',geometry:{width:8,height:10}},
  ],relationships:[{type:'held_by',subject:'cup',target:'hero',subjectAnchor:'grip',targetAnchor:'hand.far'}]};
  const r=resolveComposition(spec);
  assert.equal(r.valid,true);
  const h=r.geometry.find(x=>x.id==='hero').anchors['hand.far'];
  const p=r.geometry.find(x=>x.id==='cup').anchors.grip;
  assert.ok(Math.hypot(h.x-p.x,h.y-p.y)<1e-4);
});

test('inside_frame respects the camera viewport after zoom and pan',()=>{
  const spec={version:2,id:'s009',camera:{zoom:2,x:10,y:0},entities:[
    {id:'ball',type:'circle',geometry:{radius:3},transform:{position:{x:80,y:0}}},
  ],relationships:[{type:'inside_frame',subject:'ball'}]};
  const r=resolveComposition(spec,0,{width:1920,height:1080});
  assert.equal(r.valid,true);
  assert.ok(r.viewport.right<60);
  assert.ok(r.geometry[0].bounds.right<=r.viewport.right+1e-4);
});

test('conflicting relationships produce an unsatisfied-constraint diagnostic',()=>{
  const spec={version:2,id:'s010',entities:[
    {id:'a',type:'circle',geometry:{radius:2}},
    {id:'b',type:'circle',geometry:{radius:2},transform:{position:{x:20,y:0}}},
    {id:'c',type:'circle',geometry:{radius:2},transform:{position:{x:-20,y:0}}},
  ],relationships:[
    {type:'left_of',subject:'a',target:'b'},
    {type:'right_of',subject:'a',target:'c'},
  ]};
  const r=resolveComposition(spec);
  assert.ok(r.diagnostics.some(d=>d.code==='constraint-unsatisfied'));
});

test('inside_frame runs after relationships that move the same entity',()=>{
  const spec={version:2,id:'s013',camera:{zoom:2},entities:[
    {id:'subject',type:'circle',geometry:{radius:3},transform:{position:{x:0,y:0}}},
    {id:'target',type:'circle',geometry:{radius:3},transform:{position:{x:-41,y:0}}},
  ],relationships:[
    {type:'inside_frame',subject:'subject',priority:0},
    {type:'left_of',subject:'subject',target:'target',gap:2,priority:100},
    {type:'inside_frame',subject:'target',priority:0},
  ]};
  const r=resolveComposition(spec,0,{width:1920,height:1080});
  const subject=r.geometry.find(g=>g.id==='subject');
  assert.ok(subject.bounds.left>=r.viewport.left-1e-4);
  assert.ok(subject.bounds.right<=r.viewport.right+1e-4);
  assert.ok(r.diagnostics.some(d=>d.code==='constraint-unsatisfied'&&d.relationship==='left_of'));
});

test('camera keyframe easing is shared with the renderer',()=>{
  const spec={version:2,id:'s012',camera:{x:[{at:0,value:0},{at:1,value:20,ease:'linear'}]},entities:[
    {id:'ball',type:'circle',geometry:{radius:2}},
  ],relationships:[]};
  const r=resolveComposition(spec,0.25,{width:1920,height:1080});
  assert.ok(Math.abs(r.viewport.left-(5-100*1920/1080/2))<1e-6);
});
