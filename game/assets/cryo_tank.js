// NIVALIS 9 code asset | cryo_tank | construction 2
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

  B(0,.16,0,3.1,.32,3.1,dark);for(const x of [-1.23,1.23])for(const z of [-1.23,1.23])B(x,.4,z,.33,.8,.33,steel);

  const points=[[0,.53],[.76,.53],[1.06,.7],[1.23,1.03],[1.23,2.75],[1.08,3.02],[.72,3.18],[0,3.18]].map(p=>new THREE.Vector2(...p));
  mesh(new THREE.LatheGeometry(points,28),pale);C(0,3.27,0,.79,.87,.12,snow,24);
  for(const y of [1,2.67])T(0,y,0,1.26,.075,steel,Math.PI/2);

  C(0,3.43,0,.25,.25,.3,dark);C(0,3.61,0,.37,.37,.09,steel);C(0,3.69,0,.36,.36,.06,snow);
  for(const y of [1.25,2.4]) {T(0,y,0,1.255,.065,orange,Math.PI/2);}
  C(1.36,1.45,.52,.07,.07,2.2,steel,10);beam([.55,3.15,0],[1.36,3.15,.52],.065,steel);beam([1.36,2.55,.52],[1.36,3.15,.52],.065,steel);
  C(0,1.1,1.32,.2,.2,.3,dark,12,Math.PI/2);T(0,1.1,1.51,.26,.04,orange);
  for(let a=0;a<Math.PI*2;a+=Math.PI/2)beam([0,1.1,1.51],[Math.cos(a)*.24,1.1+Math.sin(a)*.24,1.51],.018,orange);
  B(.55,1.9,1.15,.1,.75,.06,dark);B(.55,1.95,1.2,.045,.45,.03,cyan);

  return finish();
}
