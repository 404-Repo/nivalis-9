// NIVALIS 9 v1.5.2 | fractured, stratified bedrock. Not a resized boulder.
export default function generate(THREE){
 const g=new THREE.Group();let seed=604;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const mat=hex=>{const m=new THREE.MeshStandardMaterial({color:hex,metalness:0,roughness:.97,flatShading:true});m.color.convertSRGBToLinear();return m;};
 const stones=[mat(0x445967),mat(0x536874),mat(0x677885),mat(0x354853)],snow=mat(0xdde9f0),seam=mat(0xa0b4c0);
 function mesh(geo,m,x=0,y=0,z=0){const a=new THREE.Mesh(geo,m);a.position.set(x,y,z);a.castShadow=a.receiveShadow=true;g.add(a);return a;}
 const outline=[[-1.62,-.54],[-1.08,-.94],[.33,-.84],[1.49,-.43],[1.69,.24],[.78,.76],[-.58,.85],[-1.70,.28]];
 function slab(cx,cz,y,sx,sz,h,m,angle=0){
  const shape=new THREE.Shape();const pts=outline.map(([x,z])=>[x*sx+(rnd()-.5)*.16,z*sz+(rnd()-.5)*.13]);shape.moveTo(...pts[0]);pts.slice(1).forEach(p=>shape.lineTo(...p));shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:h,steps:1,bevelEnabled:true,bevelThickness:.055,bevelSize:.055,bevelSegments:1});geo.rotateX(-Math.PI/2);geo.rotateY(angle);const a=mesh(geo,m,cx,y,cz);return a;
 }
 // Two offset strata meet at a genuine cleft; slabs recede independently.
 const layers=[[0,0,.06,1,.96,.26],[-.08,-.03,.37,.91,.90,.24],[.14,-.14,.65,.90,.76,.32],[-.18,-.22,1.01,.77,.68,.22],[-.30,-.22,1.27,.59,.56,.27],[-.38,-.30,1.57,.47,.43,.20]];
 layers.forEach(([x,z,y,sx,sz,h],i)=>{slab(x,z,y,sx,sz,h,stones[i%4],.035*i);if(i===1||i===3||i===5)slab(x-.035,z+.045,y+h+.047,sx*.94,sz*.93,.048,snow,.035*i);});
 // Broken vertical foliation on the exposed front, not uniform horizontal boxes.
 for(let i=0;i<6;i++){
  const a=mesh(new THREE.BoxGeometry(.045,.42+rnd()*.28,.035),seam,-1+i*.37,.65,-.67+rnd()*.09);a.rotation.z=-.23+rnd()*.12;a.rotation.y=.12;
 }
 for(const [x,z,s] of [[1.26,.44,.37],[1.16,-.75,.24],[-1.36,.76,.31],[-.87,.92,.19]]){const a=mesh(new THREE.IcosahedronGeometry(1,0),stones[1],x,.10,z);a.scale.set(s,.16,s*.62);a.rotation.set(.21,.43,.12);}
 g.updateMatrixWorld(true);const b=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)b.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=b.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=c.x;o.position.z-=c.z;o.position.y-=b.min.y;});return g;
}
