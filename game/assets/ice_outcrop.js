// NIVALIS 9 v1.5.2 | pressure-fractured glacial ice over dark bedrock.
// Opaque cloudy blue ice: bounded PBR cost, no magical light source or glass sorting.
export default function generate(THREE){
 const g=new THREE.Group();let seed=149;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const mat=(hex,rough=.5)=>{const m=new THREE.MeshStandardMaterial({color:hex,metalness:0,roughness:rough,flatShading:true});m.color.convertSRGBToLinear();return m;};
 const rock=mat(0x41535f,.98),ice=mat(0x84b4c7,.35),icePale=mat(0xb5d4df,.52),iceDeep=mat(0x4a849c,.39),frost=mat(0xdcebf0,.97);
 function mesh(geo,m,x=0,y=0,z=0){const a=new THREE.Mesh(geo,m);a.position.set(x,y,z);a.castShadow=a.receiveShadow=true;g.add(a);return a;}
 const base=mesh(new THREE.IcosahedronGeometry(1,1),rock,0,.19,0);base.scale.set(1.55,.40,.96);
 // Slanted, truncated slabs rather than repeated pointed fantasy crystals.
 function fin(x,z,h,w,d,lean,turn){
  const contour=[[-w*.54,0],[w*.49,.05],[w*.35,h*.58],[w*.10+lean,h],[-w*.34+lean,h*.89],[-w*.44,h*.49]];
  const s=new THREE.Shape();s.moveTo(...contour[0]);contour.slice(1).forEach(p=>s.lineTo(...p));s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:1,bevelThickness:.026,bevelSize:.042,steps:1});geo.translate(0,0,-d/2);
  const finGroup=new THREE.Group();const body=new THREE.Mesh(geo,[ice,iceDeep]);body.castShadow=body.receiveShadow=true;finGroup.add(body);
  // Sparse branching fractures, deliberately not regularly spaced stripe bars.
  function vein(points,width,m){
   for(let i=0;i<points.length-1;i++){
    const a=new THREE.Vector3(points[i][0],points[i][1],d/2+.034),b=new THREE.Vector3(points[i+1][0],points[i+1][1],d/2+.034),delta=b.clone().sub(a);
    const line=new THREE.Mesh(new THREE.CylinderGeometry(width*.55,width,delta.length(),5),m);line.position.copy(a.add(b).multiplyScalar(.5));line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());line.castShadow=line.receiveShadow=true;finGroup.add(line);
   }
  }
  const k=.41+rnd()*.17;
  vein([[-w*.40,h*k],[-w*.16,h*(k+.055)],[w*.02,h*(k+.03)],[w*.18,h*(k+.15)],[w*.34,h*(k+.19)]],.007,icePale);
  vein([[w*.02,h*(k+.03)],[w*.08,h*(k-.08)],[w*.23,h*(k-.12)]],.004,icePale);
  vein([[-w*.20,h*.11],[-w*.10,h*.22],[-w*.16,h*.28]],.005,icePale);
  const shape=new THREE.Shape();shape.moveTo(-w*.34+lean,h*.89);shape.lineTo(w*.10+lean,h);shape.lineTo(w*.12+lean,h-.07);shape.lineTo(-w*.33+lean,h*.89-.08);shape.closePath();
  const crown=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:d+.07,bevelEnabled:false}),frost);crown.position.z=-d/2-.035;crown.castShadow=crown.receiveShadow=true;finGroup.add(crown);
  finGroup.position.set(x,.11,z);finGroup.rotation.y=turn;g.add(finGroup);
 }
 fin(-.42,-.10,2.53,.93,.49,-.34,-.43);fin(.32,.25,1.67,.88,.52,.32,.31);fin(.81,-.29,1.04,.76,.51,.20,-.59);fin(-1.0,.27,.81,.50,.37,-.19,.53);
 // Low wind-packed drifts anchor the ice in the terrain, rather than a plinth.
 for(const [x,z,sx,sz] of [[-1.04,.21,.60,.43],[.49,.65,.88,.40],[.89,-.35,.57,.43]]){const a=mesh(new THREE.IcosahedronGeometry(1,1),frost,x,.17,z);a.scale.set(sx,.18,sz);a.rotation.y=.34;}
 for(let i=0;i<8;i++){const a=mesh(new THREE.IcosahedronGeometry(1,0),i%3?icePale:frost,-1.3+rnd()*2.6,.09,-.7+rnd()*1.4);a.scale.set(.16+rnd()*.12,.10,.16+rnd()*.08);a.rotation.y=rnd()*6.2;}
 g.updateMatrixWorld(true);const b=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)b.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=b.getCenter(new THREE.Vector3());g.children.forEach(o=>{o.position.x-=c.x;o.position.z-=c.z;o.position.y-=b.min.y;});return g;
}
