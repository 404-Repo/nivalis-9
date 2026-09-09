// NIVALIS 9 v1.7.1 — Warden heavy utility drone, parked and uncrewed.
// Original procedural geometry; no imported model, image, or Atlas output.
// Metres, Y up, front +Z. Rotor ducts are hollow, blades are stationary.
export default function generate(THREE) {
  const g = new THREE.Group();
  g.name = 'WARDEN / heavy utility drone';
  const mat = (name, color, metalness=.55, roughness=.64, emission=0) => {
    const m = new THREE.MeshStandardMaterial({color, metalness, roughness});
    m.color.convertSRGBToLinear();m.name=name;
    if (emission) {m.emissive.set(color).convertSRGBToLinear();m.emissiveIntensity=emission;}
    return m;
  };
  const pale=mat('ceramic-white armor',0xbdc8c8,.32,.62),
    dark=mat('graphite powder coat',0x283640,.48,.7),
    steel=mat('titanium structural metal',0x627580,.70,.47),
    black=mat('rubber and vent recesses',0x17242b,.04,.91),
    orange=mat('safety orange paint',0xd56b36,.3,.65),
    bolt=mat('fastener metal',0x93a6ad,.78,.39),
    blade=mat('carbon fan blades',0x26333b,.18,.72),
    lens=mat('smoked sensor glass',0x24505d,.40,.18),
    cyan=mat('dormant cyan status',0x70e4f0,.05,.3,.65),
    snow=mat('thin settled snow',0xe1eaf0,0,.98);
  const mesh=(geometry,material,x=0,y=0,z=0,name='')=>{
    const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);
    o.castShadow=o.receiveShadow=true;o.name=name;g.add(o);return o;
  };
  const B=(x,y,z,w,h,d,m=steel,name='')=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,name);
  const C=(x,y,z,r1,r2,h,m=steel,n=16)=>mesh(new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);
  const beam=(a,b,w,m=steel,rect=false)=>{
    const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);
    const o=mesh(rect?new THREE.BoxGeometry(w,v.length(),w*.76):new THREE.CylinderGeometry(w,w,v.length(),10),m);
    o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;
  };
  function chamfer(w,h,d,m,x=0,y=0,z=0,c=.08){
    const s=new THREE.Shape(),pts=[[-w/2+c,-h/2],[w/2-c,-h/2],[w/2,-h/2+c],[w/2,h/2-c],[w/2-c,h/2],[-w/2+c,h/2],[-w/2,h/2-c],[-w/2,-h/2+c]];
    s.moveTo(...pts[0]);for(const p of pts.slice(1))s.lineTo(...p);s.closePath();
    return mesh(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,steps:1}),m,x,y,z-d/2);
  }
  function patch(points,m){
    const pos=points.flat(),ix=[];for(let i=1;i<points.length-1;i++)ix.push(0,i,i+1);
    const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geom.setIndex(ix);geom.computeVertexNormals();
    const mm=m.clone();mm.side=THREE.DoubleSide;return mesh(geom,mm);
  }
  // A broad unmanned armored hull. No cockpit, tail boom or helicopter rotor.
  const sections=[[-2.03,1.81,.48,.26],[-1.52,1.91,1.12,.47],[-.65,1.99,1.32,.52],[.72,1.99,1.28,.52],[1.70,1.80,.92,.35],[2.06,1.66,.42,.20]];
  const profile=[[-.65,1],[.65,1],[1,.40],[1,-.40],[.65,-1],[-.65,-1],[-1,-.40],[-1,.40]];
  const pos=[],ix=[];
  for(const [z,y,rx,ry] of sections)for(const [x,dy] of profile)pos.push(x*rx,y+dy*ry,z);
  for(let k=0;k<sections.length-1;k++)for(let j=0;j<8;j++){
    const a=k*8+j,b=k*8+(j+1)%8,c=b+8,d=a+8;ix.push(a,b,d,b,c,d);
  }
  for(let j=1;j<7;j++){ix.push(0,j+1,j);const n=(sections.length-1)*8;ix.push(n,n+j,n+j+1);}
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));body.setIndex(ix);body.computeVertexNormals();
  // This shell is opaque, not a flat-sided substitute cargo box.
  const shell=pale.clone();shell.side=THREE.DoubleSide;mesh(body,shell,0,0,0,'uncrewed armored hull');
  chamfer(1.60,.48,2.55,dark,0,1.41,-.15,.15);
  // Top equipment hatch, radiator ribs, recessed rear access and orange stripe.
  chamfer(1.31,.16,1.32,dark,0,2.57,-.32,.10);
  chamfer(1.16,.045,1.13,steel,0,2.67,-.32,.06);
  for(let x=-.48;x<=.48;x+=.12)B(x,2.70,-.32,.042,.033,.91,black);
  for(const sx of [-1,1])for(const sz of [-1,1])C(sx*.54,2.71,-.32+sz*.48,.028,.028,.03,bolt,6);
  B(0,2.529,.80,.20,.016,.46,orange);
  for(const s of [-1,1]){
    B(s*1.325,1.99,-.03,.035,.14,1.23,dark);
    B(s*1.348,1.78,-.05,.024,.07,1.33,orange);
    for(let z=-.75;z<.72;z+=.22)B(s*1.329,1.93,z,.04,.20,.065,black);
    // Small service latches on genuine sloping upper armor facets.
    patch([[s*.91,2.49,-.60],[s*1.30,2.21,-.60],[s*1.30,2.21,.39],[s*.89,2.49,.39]],dark);
    for(const z of [-.38,.18])beam([s*1.05,2.405,z],[s*1.21,2.294,z],.034,bolt);
  }
  // Angled truss arms feed four protected, fully open ducted fans.
  const pods=[];
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*2.86,z=sz*2.22,y=2.00;pods.push({x,y,z,radius:1.31});
    beam([sx*.93,1.90,sz*.92],[sx*2.42,2.02,sz*1.91],.36,dark,true);
    beam([sx*1.0,1.66,sz*.76],[sx*2.60,1.88,sz*2.02],.065,steel);
    beam([sx*1.24,2.13,sz*1.00],[sx*2.39,2.15,sz*1.85],.085,pale);
    const collar=B(sx*1.69,2.025,sz*1.47,.36,.29,.45,orange);collar.rotation.y=-sx*sz*.70;
    const shape=[[1.02,-.23],[1.24,-.18],[1.31,.08],[1.25,.22],[1.08,.26],[.98,.12],[1.00,-.18],[1.02,-.23]];
    mesh(new THREE.LatheGeometry(shape.map(p=>new THREE.Vector2(...p)),56),pale,x,y,z,'hollow fan duct');
    for(const [dy,r,m] of [[.10,1.31,dark],[-.16,1.22,dark],[.24,1.16,steel]]){
      const rim=mesh(new THREE.TorusGeometry(r,.028,6,56),m,x,y+dy,z);rim.rotation.x=Math.PI/2;
    }
    // Short protective status marks, not solid discs over the rotor apertures.
    for(const a of [.36,Math.PI+.36]){
      const arc=mesh(new THREE.TorusGeometry(1.185,.045,6,14,.36),orange,x,y+.255,z);arc.rotation.x=-Math.PI/2;arc.rotation.z=a;
    }
    for(let n=0;n<4;n++){
      const a=n*Math.PI/2+.25,dx=Math.cos(a),dz=Math.sin(a);
      beam([x+dx*.20,y-.04,z+dz*.20],[x+dx*1.0,y-.04,z+dz*1.0],.026,steel);
      C(x+dx*1.20,y+.28,z+dz*1.20,.033,.033,.022,bolt,6);
    }
    C(x,y+.045,z,.205,.205,.22,dark,20);C(x,y+.177,z,.15,.205,.075,steel,20);
    C(x,y+.225,z,.043,.043,.032,orange,8);
    const bladeShape=new THREE.Shape();
    const outline=[[.16,-.05],[.44,-.11],[.92,-.06],[.965,.052],[.49,.094],[.18,.06]];
    bladeShape.moveTo(...outline[0]);outline.slice(1).forEach(p=>bladeShape.lineTo(...p));bladeShape.closePath();
    const bladeGeo=new THREE.ExtrudeGeometry(bladeShape,{depth:.027,bevelEnabled:false,steps:1});
    bladeGeo.rotateX(-Math.PI/2);
    for(let n=0;n<8;n++){
      const fan=mesh(bladeGeo,blade,x,y+.04,z,'stationary rotor blade');fan.rotation.y=n*Math.PI/4+(sx===sz?.13:-.13);
    }
    // Small vented motor underneath each hub reinforces the airborne silhouette.
    C(x,y-.34,z,.19,.15,.26,dark,12);
    // Four splayed landing legs carry the actual body, not the fan rims.
    const ax=sx*1.06,az=sz*1.15,fx=sx*1.77,fz=sz*1.64;
    beam([ax,1.70,az],[fx,.24,fz],.135,steel);
    beam([sx*1.26,1.07,sz*1.29],[fx,.30,fz],.076,bolt);
    C(sx*1.40,.95,sz*1.40,.16,.16,.24,dark,10);
    chamfer(.55,.20,.81,black,fx,.10,fz,.045);
    B(fx,.217,fz,.43,.032,.55,steel);
  }
  // Front gimbal and twin small optics: readable as a robot, never a cockpit.
  chamfer(.86,.39,.43,dark,0,1.32,1.77,.10);
  beam([-.44,1.58,1.65],[-.44,1.19,1.75],.055,steel);beam([.44,1.58,1.65],[.44,1.19,1.75],.055,steel);
  const eye=C(0,1.34,2.01,.23,.23,.12,black,28);eye.rotation.x=Math.PI/2;
  const glazing=C(0,1.34,2.084,.164,.164,.035,lens,28);glazing.rotation.x=Math.PI/2;
  const center=C(0,1.34,2.106,.054,.054,.014,cyan,18);center.rotation.x=Math.PI/2;
  for(const s of [-1,1]){B(s*.35,1.70,2.059,.11,.085,.035,cyan);B(s*.91,1.62,-1.43,.13,.08,.12,orange);}
  // Low communications fin and two restrained aerials at the rear.
  chamfer(.12,.52,.53,dark,0,2.54,-1.04,.04);
  for(const s of [-1,1]){
    beam([s*.54,2.43,-.68],[s*.63,2.94,-.89],.025,steel);
    C(s*.63,2.97,-.89,.038,.038,.06,black,8);
    B(s*.54,2.522,.39,.27,.016,.29,snow);
  }
  g.userData={assetType:'parked-heavy-drone',parked:true,armed:false,fanCount:4,bladesPerFan:8,rotorsMoving:false,pods};
  g.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(g),c=bounds.getCenter(new THREE.Vector3());
  for(const o of g.children){o.position.x-=c.x;o.position.z-=c.z;o.position.y-=bounds.min.y;}
  g.userData.originAdjustment={x:-c.x,y:-bounds.min.y,z:-c.z};
  return g;
}
