// NIVALIS 9 code asset | rifle | construction 2
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

  const receiver=mat(0x536773,.65,.36), grip=mat(0x17242b,.05,.85), glass=mat(0x80dfee,.45,.15,.35);

  glass.transparent=true;glass.opacity=.14;glass.depthWrite=false;glass.side=THREE.DoubleSide;
  E([[-.087,.20],[.087,.20],[.11,.29],[.065,.38],[-.065,.38],[-.11,.29]],.43,receiver,0,0,-.03);
  chamfer(.2,.16,.33,pale,0,.285,.32,.04);B(0,.3,-.36,.075,.09,.24,dark);chamfer(.16,.24,.08,grip,0,.23,-.5,.025);B(0,.30,-.375,.14,.15,.17,receiver);
  for(const x of [-.106,.106]){B(x,.27,.25,.012,.055,.24,dark);for(let z=.15;z<.37;z+=.04) B(x*1.01,.277,z,.014,.04,.012,steel);B(x,.328,.1,.012,.023,.22,cyan);}

  C(0,.285,.52,.043,.054,.17,dark,12,Math.PI/2);C(0,.285,.61,.063,.063,.075,receiver,8,Math.PI/2);C(0,.285,.654,.036,.036,.018,black,12,Math.PI/2);
  B(0,.095,-.10,.095,.24,.12,grip,-.17);B(0,.1,.14,.11,.25,.13,dark,.11);B(0,.005,.15,.12,.045,.15,orange);
  for(let y=.03;y<.18;y+=.035)B(0,y,.21,.112,.012,.015,steel);
  B(0,.398,-.015,.105,.03,.4,dark);for(let z=-.18;z<.19;z+=.035)B(0,.422,z,.11,.022,.019,steel);
  for(const x of [-.075,.075])B(x,.50,-.05,.026,.15,.045,dark);B(0,.581,-.05,.175,.024,.045,dark);B(0,.496,-.05,.114,.122,.012,glass);B(0,.51,-.065,.0035,.0035,.004,cyan);
  B(.11,.32,-.12,.02,.05,.12,orange);B(0,.17,-.235,.095,.07,.14,grip);B(0,.118,-.219,.016,.07,.016,steel,.45);
  for(const x of [-.106,.106])for(const z of [-.18,-.02])C(x,.3,z,.013,.013,.016,bolt,6,Math.PI/2);

  return finish();
}
