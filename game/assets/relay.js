// NIVALIS 9 code asset | relay | construction 3
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

  C(0,.4,0,3.6,3.95,.8,dark,8);C(0,.86,0,3.45,3.58,.15,steel,8);C(0,.97,0,3.45,3.45,.07,snow,8);

  chamfer(3.3,11.9,3.3,pale,0,6.9,0,.42);
  for(const x of [-2.32,2.32])for(const z of [-2.32,2.32]) {B(x,7.1,z,.75,12.4,.75,dark);B(x,7.8,z+Math.sign(z)*.39,.16,9,.045,orange);beam([x*1.47,1,z*1.47],[x,4.2,z],.22,steel);}
  for(const z of [-1.67,1.67]) {B(0,7,z,1.32,9.8,.045,black);B(0,7.2,z*1.025,.22,8.5,.035,cyan);}
  C(0,13.3,0,3.2,2.2,.7,steel,8);T(0,13.6,0,2.73,.12,cyan,Math.PI/2);

  for(let a=0;a<Math.PI*2;a+=Math.PI/4) {const x=Math.sin(a),z=Math.cos(a);beam([x*3.2,1,z*3.2],[x*2.5,3.5,z*2.5],.13,orange);}
  C(0,14,0,.45,.6,1.6,dark,12);
  const dish=new THREE.Group();g.add(dish);const old=g.children.length;
  const pp=[[0,0],[.7,.08],[1.5,.34],[2.2,.73],[2.9,1.35],[3.1,1.62]].map(p=>new THREE.Vector2(p[0],p[1]));
  const dm=pale.clone();dm.side=THREE.DoubleSide;
  const d=new THREE.Mesh(new THREE.LatheGeometry(pp,40),dm);dish.add(d);const rim=new THREE.Mesh(new THREE.TorusGeometry(3.1,.085,6,48),steel);rim.rotation.x=Math.PI/2;rim.position.y=1.62;dish.add(rim);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,3,10),orange);mast.position.y=1.9;dish.add(mast);const tip=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),cyan);tip.position.y=3.4;dish.add(tip);
  for(let a=0;a<Math.PI*2;a+=Math.PI/2){const p=new THREE.Vector3(Math.cos(a)*3,1.55,Math.sin(a)*3),q=new THREE.Vector3(0,3.1,0),dir=q.clone().sub(p);const st=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,dir.length(),6),steel);st.position.copy(p.add(q).multiplyScalar(.5));st.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());dish.add(st);}
  dish.position.y=14.6;dish.rotation.x=-.35;dish.rotation.z=.17;
  for(const x of [-1,1]) {C(x*3.15,2.6,-.7,.075,.075,3.5,steel,8);B(x*3.15,4.4,-.7,.16,.12,.16,red);}

  dish.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return finish();
}
