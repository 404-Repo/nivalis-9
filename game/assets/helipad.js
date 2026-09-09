// NIVALIS 9 v1.7.1 — compact square raised landing platform, open below.
// Original code geometry. Deck walking surface is Y=5.04, bottom Y=0.
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

  g.name='Central drone pad / 13.2 metre square';
  for(const x of [-7.74,7.74])for(const z of [-6.88,6.88]){
    chamfer(1.12,.18,1.10,dark,x,.09,z,.10);
    B(x,2.30,z,.42,4.40,.42,steel);
    B(x,2.30,z+.23,.19,3.96,.025,orange);
    for(const xx of [-.37,.37])for(const zz of [-.35,.35])C(x+xx,.206,z+zz,.034,.034,.05,bolt,6);
    for(const side of [x<0?1:-1])beam([x,3.56,z],[x+side*.85,4.51,z],.09,steel);
  }
  B(0,4.69,0,15.60,.54,15.60,dark);
  B(0,5.002,0,15.6,.076,15.6,steel);
  // Honest support trusses at the outside edge leave a 4.4 m clear underpass.
  for(const s of [-1,1]){
    B(0,4.44,s*7.35,15.20,.18,.22,steel);B(s*7.35,4.44,0,.22,.18,15.20,steel);
    for(let a=-6.75;a<6.7;a+=1.5){
      beam([a,4.44,s*7.35],[a+.75,4.9,s*7.35],.055,orange);beam([a+.75,4.9,s*7.35],[a+1.5,4.44,s*7.35],.055,steel);
      beam([s*7.35,4.44,a],[s*7.35,4.9,a+.75],.055,orange);beam([s*7.35,4.9,a+.75],[s*7.35,4.44,a+1.5],.055,steel);
    }
  }
  // Panel seams, fastening rails and a shallow perimeter curb.
  for(let p=-6;p<=6;p+=3){B(p,5.045,0,.022,.008,15.20,black);B(0,5.045,p,15.20,.008,.022,black);}
  for(const s of [-1,1]){B(s*7.82,5.06,0,.18,.12,15.82,dark);B(0,5.06,s*7.82,15.82,.12,.18,dark);}
  const paint=mat('worn landing paint',0xcbd6d0,.05,.94);
  const ring=mesh(new THREE.RingGeometry(5.35,5.51,96),paint,0,5.055,0);ring.rotation.x=-Math.PI/2;
  B(0,5.06,0,.31,.014,4.20,paint);B(0,5.06,0,4.20,.014,.31,paint);
  for(const s of [-1,1])for(let p=-6.8;p<=6.8;p+=1.06){B(p,5.057,s*7.25,.64,.012,.15,orange);B(s*7.25,5.057,p,.15,.012,.64,orange);}
  for(const x of [-6.3,6.3])for(const z of [-6.3,0,6.3]){
    C(x,5.063,z,.105,.105,.025,dark,16);const tie=mesh(new THREE.TorusGeometry(.068,.013,6,16),bolt,x,5.087,z);tie.rotation.x=Math.PI/2;
  }
  const lamp=mat('landing light',0x8ce3db,.05,.3,.55);
  for(const s of [-1,1])for(const p of [-7,0,7]){
    B(s*7.70,5.15,p,.19,.17,.30,black);B(s*7.70,5.247,p,.13,.025,.18,lamp);
    B(p,5.15,s*7.70,.30,.17,.19,black);B(p,5.247,s*7.70,.18,.025,.13,lamp);
  }
  // Snow occupies small sheltered corners, never the complete landing markings.
  for(const x of [-7.1,7.1])for(const z of [-7.1,7.1])B(x,5.074,z,.76,.025,.45,snow);
  // 15.38% smaller footprint. Keep deck height and underpass clearance.
  const footprint=13.2/15.6;
  // Scale in world horizontal axes, not each rotated mesh's local axes.
  const full=finish(),compact=new THREE.Group();
  full.scale.set(footprint,1,footprint);compact.name='Central drone pad / 13.2 metre square';compact.add(full);
  compact.userData={deckWidth:13.2,deckDepth:13.2,deckY:5.04,footprintScale:footprint};
  return compact;
}
