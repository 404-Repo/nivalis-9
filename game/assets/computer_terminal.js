// NIVALIS 9 v1.7 — purpose-built computer uplink. Code-authored; no Atlas.
// Metres, Y up, front +Z. Screen artwork is attached separately by the engine.
export default function generate(THREE){

  const g=new THREE.Group();
  const mat=(name,color,metalness=.55,roughness=.64,emissive=0)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness});m.color.convertSRGBToLinear();m.name=name;if(emissive){m.emissive.set(color).convertSRGBToLinear();m.emissiveIntensity=emissive;}return m;};
  const steel=mat('structural steel',0x627580),dark=mat('graphite powder coat',0x283640),black=mat('rubber and inset',0x17242b,.02,.88),pale=mat('off-white painted metal',0xbdc8c8,.35,.66),orange=mat('safety orange paint',0xd56b36,.3,.68),snow=mat('snow',0xe1eaf0,0,.98),bolt=mat('fastener metal',0x93a6ad,.8,.4),cyan=mat('cyan status light',0x70e4f0,.05,.32,.65);
  const mesh=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  const B=(x,y,z,w,h,d,m=steel)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const C=(x,y,z,r1,r2,h,m=steel,n=12,rx=0)=>{const o=mesh(new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);o.rotation.x=rx;return o;};
  const beam=(a,b,r,m=steel)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const o=mesh(new THREE.CylinderGeometry(r,r,v.length(),8),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;};
  const panel=(pts,m)=>{const geo=new THREE.BufferGeometry(),pos=[],ids=[];for(const p of pts)pos.push(...p);for(let i=1;i<pts.length-1;i++)ids.push(0,i,i+1);geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(ids);geo.computeVertexNormals();const material=m.clone();material.side=THREE.DoubleSide;return mesh(geo,material);};
  function chamfer(w,h,d,m,x=0,y=0,z=0,c=.06){const s=new THREE.Shape(),pts=[[-w/2+c,-h/2],[w/2-c,-h/2],[w/2,-h/2+c],[w/2,h/2-c],[w/2-c,h/2],[-w/2+c,h/2],[-w/2,h/2-c],[-w/2,-h/2+c]];s.moveTo(...pts[0]);pts.slice(1).forEach(p=>s.lineTo(...p));s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,steps:1}),m,x,y,z-d/2);}
  function finish(){g.updateMatrixWorld(true);const bb=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bb.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=bb.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.z-=c.z;o.position.y-=bb.min.y;}g.userData.originAdjustment={x:-c.x,y:-bb.min.y,z:-c.z};return g;}

  g.name='Uplink computer / pedestal console';
  chamfer(1.06,.095,.85,dark,0,.0475,0,.08);
  for(const x of [-.40,.40])for(const z of [-.30,.30])C(x,.109,z,.025,.025,.028,bolt,6);
  chamfer(.46,.81,.39,pale,0,.54,-.12,.055);
  B(0,.18,-.15,.63,.18,.48,dark);
  B(0,.53,.089,.32,.39,.025,dark);
  for(let i=0;i<6;i++)B(0,.405+i*.043,.106,.245,.014,.014,black);
  B(.275,.62,-.18,.065,.54,.18,steel);B(-.275,.62,-.18,.065,.54,.18,steel);
  // Cable conduit and connector beneath the keyboard, not crate straps/handles.
  beam([.20,.15,-.31],[.20,.91,-.31],.032,black);
  for(const y of [.23,.53,.82])B(.20,y,-.31,.10,.045,.08,steel);
  const desk=B(0,1.01,.075,1.02,.105,.67,dark);desk.rotation.x=-.14;
  B(0,1.083,.21,.83,.028,.31,pale).rotation.x=-.14;
  for(let row=0;row<4;row++)for(let col=0;col<11;col++){
    const key=B(-.345+col*.055,1.11+row*.008,.10+row*.056,.043,.013,.037,black);key.rotation.x=-.14;
  }
  B(-.09,1.148,.35,.25,.015,.037,black).rotation.x=-.14;
  B(.344,1.11,.105,.08,.016,.05,orange);
  C(.41,1.094,-.05,.027,.03,.024,cyan,12);
  // Tilted monitor with thick bezel and a shallow, ribbed computer enclosure.
  const head=new THREE.Group();head.position.set(0,1.49,-.165);head.rotation.x=-.13;g.add(head);
  const move=(o)=>{g.remove(o);head.add(o);return o;};
  move(chamfer(1.105,.745,.205,dark,0,0,0,.07));
  move(chamfer(.981,.614,.016,black,0,.012,.111,.018));
  for(const x of [-.50,.50])for(const y of [-.282,.282]){const s=move(C(x,y,.116,.015,.015,.012,bolt,6,Math.PI/2));}
  for(let i=0;i<8;i++)move(B(-.35+i*.1,-.215,-.113,.048,.095,.022,black));
  move(B(-.335,-.318,.119,.12,.025,.013,cyan));
  move(B(.372,-.318,.119,.055,.025,.013,orange));
  const anchor=new THREE.Group();anchor.name='display-anchor';anchor.position.set(0,.012,.124);head.add(anchor);
  beam([-.21,.96,-.19],[-.21,1.33,-.19],.035,steel);beam([.21,.96,-.19],[.21,1.33,-.19],.035,steel);
  return finish();
}
