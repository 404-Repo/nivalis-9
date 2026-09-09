// NIVALIS 9 v1.5.2 | spent aerosol cans. Original code-authored geometry.
// Meter-scale, grounded, no texture downloads or external generators.
export default function generate(THREE){
 const group=new THREE.Group();let seed=90404;
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const mat=(hex,metal=.1,rough=.8)=>{const m=new THREE.MeshStandardMaterial({color:hex,metalness:metal,roughness:rough});m.color.convertSRGBToLinear();return m;};
 const aluminum=mat(0x96a0a2,.76,.47),paper=mat(0xc2c1af,.03,.97),pink=mat(0xf62b91,.02,.72),cyan=mat(0x26eff0,.02,.72),lime=mat(0xb8ff32,.02,.72),violet=mat(0xc872ff,.02,.72),ink=mat(0x263039,.13,.83),rust=mat(0x7c5a48,.28,.96),snow=mat(0xd9e6ea,0,1),nozzle=mat(0xd4d0bd,.05,.75);
 function mesh(parent,geo,m,x=0,y=0,z=0){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function ring(parent,y,r=.067){const o=mesh(parent,new THREE.TorusGeometry(r,.004,5,22),aluminum,0,y,0);o.rotation.x=Math.PI/2;}
 function can(x,z,tip,turn,damaged=false,paint=pink){
  const c=new THREE.Group(),radius=.068,height=.255;
  const geo=new THREE.CylinderGeometry(radius,radius,height,24,7),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),angle=Math.atan2(pz,px);const dent=damaged?.021*Math.exp(-Math.pow((angle-.45)*2.9,2)-Math.pow((py+.025)*14,2)):0;const ripple=.002*Math.sin(angle*4+py*29);const r=Math.max(.032,radius-dent+ripple);if(Math.hypot(px,pz)>.01){p.setX(i,px*r/radius);p.setZ(i,pz*r/radius);}}
  geo.computeVertexNormals();mesh(c,geo,damaged?ink:paper,0,.146,0);
  // Broad faded colour swatch identifies the paint without a quest beacon.
  const sleeve=new THREE.CylinderGeometry(radius+.0015,radius+.0015,.086,24,1,true);
  mesh(c,sleeve,paint,0,.124,0);
  ring(c,.022);ring(c,.273);
  mesh(c,new THREE.CylinderGeometry(.045,.066,.025,22),aluminum,0,.287,0);
  mesh(c,new THREE.CylinderGeometry(.013,.018,.011,12),ink,0,.304,0);
  mesh(c,new THREE.BoxGeometry(.03,.024,.026),nozzle,0,.320,0);
  const hole=mesh(c,new THREE.CylinderGeometry(.004,.004,.002,8),ink,0,.322,.014);hole.rotation.x=Math.PI/2;
  // Paint stains, peeled paper and rust: small flush geometric fragments.
  for(let i=0;i<22;i++){
   const a=rnd()*Math.PI*2,y=.036+rnd()*.218;
   const flake=mesh(c,new THREE.PlaneGeometry(.002+rnd()*.015,.002+rnd()*.021),i%4===0?rust:i%3===0?paint:aluminum,Math.sin(a)*.070,y,Math.cos(a)*.070);flake.rotation.y=a;flake.rotation.z=(rnd()-.5)*.8;
  }
  for(let i=0;i<4;i++){const mark=mesh(c,new THREE.PlaneGeometry(.034,.005),ink,0,.194-i*.011,.0705);}
  c.rotation.set(.03,turn,tip);c.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(c);c.position.set(x,-b.min.y+.008,z);group.add(c);
 }
 can(-.18,-.13,-.13,.52,false,pink);can(.24,.1,1.55,-.8,true,cyan);can(-.30,.28,1.73,1.6,false,lime);
 for(const [x,z,angle,paint] of [[.21,-.13,.3,cyan],[.46,.27,.8,violet]]){
  const cap=new THREE.Group();mesh(cap,new THREE.CylinderGeometry(.070,.071,.062,20),paint,0,.034,0);ring(cap,.064,.067);cap.rotation.z=angle;cap.updateMatrixWorld(true);cap.position.set(x,-new THREE.Box3().setFromObject(cap).min.y+.003,z);group.add(cap);
 }
 // Wind-blown snow touches the abandoned pieces without hiding their pink bands.
 for(const [x,z,s] of [[-.2,-.19,.11],[.46,.14,.10],[-.44,.3,.065]]){const o=mesh(group,new THREE.IcosahedronGeometry(1,1),snow,x,.009,z);o.scale.set(s,.017,s*.8);}
 group.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();group.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const center=bounds.getCenter(new THREE.Vector3());for(const o of group.children){o.position.x-=center.x;o.position.z-=center.z;o.position.y-=bounds.min.y;}return group;
}
