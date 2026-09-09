// NIVALIS 9 code asset | cargo_module | construction 2
// Units: meters. Y up. Front +Z. No external assets.
export default function generate(THREE) {

  const g = new THREE.Group();
  const mat = (hex, metal=0.55, rough=0.65, emission=0) => {
    const m = new THREE.MeshStandardMaterial({color:hex, metalness:metal, roughness:rough});
    m.color.convertSRGBToLinear();
    if(emission) {m.emissive.set(hex).convertSRGBToLinear();m.emissiveIntensity=emission;}
    m.name=metal>0.3?'metal':'stone'; return m;
  };
  const steel=mat(0x627580), dark=mat(0x283640), black=mat(0x17242b), pale=mat(0xbdc8c8,0.42), orange=mat(0xd56b36,0.45),
        snow=mat(0xe1eaf0,0,0.98), bolt=mat(0x81969e,0.8), cyan=mat(0x70e4f0,0.15,0.3,2.5), warm=mat(0xffc894,0.05,0.3,2), red=mat(0xfa755e,0.1,0.3,2);
  function mesh(geo,m,x=0,y=0,z=0) {const a=new THREE.Mesh(geo,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;g.add(a);return a;}
  function B(x,y,z,w,h,d,m=steel,rz=0) {const a=mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);a.rotation.z=rz;return a;}
  function C(x,y,z,r1,r2,h,m=steel,n=16,rx=0) {const a=mesh(new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);a.rotation.x=rx;return a;}
  function S(x,y,z,rx,ry,rz,m=snow,detail=1) {const a=mesh(new THREE.IcosahedronGeometry(1,detail),m,x,y,z);a.scale.set(rx,ry,rz);return a;}
  function T(x,y,z,r,t,m=steel,rx=0,ry=0) {const a=mesh(new THREE.TorusGeometry(r,t,6,32),m,x,y,z);a.rotation.set(rx,ry,0);return a;}
  function beam(a,b,w,m=steel) {const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);const o=mesh(new THREE.CylinderGeometry(w,w,d.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
  function E(points,depth,m=steel,x=0,y=0,z=0,bevel=0) {const s=new THREE.Shape();s.moveTo(...points[0]);points.slice(1).forEach(p=>s.lineTo(...p));s.closePath();const o=mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,steps:1}),m,x,y,z-depth/2);return o;}
  function chamfer(w,h,d,m,x=0,y=0,z=0,c=.12) {return E([[-w/2+c,-h/2],[w/2-c,-h/2],[w/2,-h/2+c],[w/2,h/2-c],[w/2-c,h/2],[-w/2+c,h/2],[-w/2,h/2-c],[-w/2,-h/2+c]],d,m,x,y,z);}
  function bolts(x,y,z,n=3,dx=.3) {for(let k=0;k<n;k++)C(x+k*dx,y,z,.035,.035,.04,bolt,6,Math.PI/2);}
  function finish() {
    g.updateMatrixWorld(true);const bb=new THREE.Box3(),v=new THREE.Vector3();
    g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bb.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});
    const c=bb.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=c.x;o.position.z-=c.z;o.position.y-=bb.min.y;});
    return g;
  }

  B(0,.12,0,5.2,.24,10.2,dark);B(0,.255,0,4.55,.03,10,pale);
  for(const x of [-2.48,2.48]) {B(x,1.8,0,.26,3.3,10,pale);B(x*1.035,.58,0,.1,.7,9.8,dark);B(x*1.035,2.7,0,.1,.45,9.8,orange);}
  for(const z of [-5,5]) {B(0,3.4,z,5.2,.32,.23,orange);for(const x of [-2.4,2.4]) B(x,1.7,z,.35,3.4,.3,steel);B(0,3.08,z-.03,2.7,.065,.13,cyan);}

  for(const x of [-1.35,1.35]) {B(x,3.48,0,2.85,.22,10.2,steel,x<0?.13:-.13);B(x,3.61,0,2.9,.09,10.2,snow,x<0?.13:-.13);}
  for(let z=-4.8;z<5;z+=1.2) {for(const x of [-2.67,2.67]) {B(x,1.8,z,.16,2.9,.2,dark);beam([x,2.5,z],[x*.67,3.68,z],.09,orange);} B(0,3.53,z,4.25,.14,.18,dark);}
  for(const x of [-2.18,2.18]) {C(x,2.79,0,.075,.075,9.9,orange,10,Math.PI/2);C(x,2.5,0,.045,.045,9.9,steel,8,Math.PI/2);}

  for(const x of [-2.7,2.7]) for(const z of [-4.5,4.5]) {B(x,.18,z,.5,.35,.8,dark);B(x,3.36,z,.3,.18,.4,snow);}
  for(let z=-4.7;z<5;z+=.5) {B(0,.28,z,4.4,.015,.055,dark);}

  return finish();
}
