// NIVALIS 9 code asset | drone | construction 2
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

  cyan.name='drone-underside-signal';
  cyan.color.set(0xe7f4fa).convertSRGBToLinear();cyan.emissive.copy(cyan.color);cyan.emissiveIntensity=1.55;
  const armor=mat(0x6b7c87,.68,.35), lens=mat(0xfc6958,.2,.15,3);

  chamfer(.77,.43,.86,armor,0,.57,0,.14);B(0,.8,0,.49,.06,.51,pale);
  for(const x of [-1,1])for(const z of [-1,1]) {beam([x*.24,.55,z*.24],[x*.66,.56,z*.48],.06,dark);T(x*.71,.57,z*.52,.26,.062,armor,Math.PI/2);C(x*.71,.57,z*.52,.2,.2,.028,black,12);C(x*.71,.47,z*.52,.10,.06,.09,cyan,10);}

  C(0,.53,.47,.15,.15,.13,black,16,Math.PI/2);C(0,.53,.55,.11,.11,.035,lens,16,Math.PI/2);B(0,.29,.17,.2,.19,.43,dark);
  C(0,.24,.45,.045,.045,.29,steel,8,Math.PI/2);C(0,.24,.61,.055,.055,.045,orange,8,Math.PI/2);for(const x of [-.26,.26])B(x,.6,.451,.07,.085,.03,red);
  beam([-.2,.73,-.19],[-.26,1.03,-.25],.022,steel);S(-.26,1.05,-.25,.045,.045,.045,red,0);

  return finish();
}
