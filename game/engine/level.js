import { ASSET, bakeStatic } from './assets.js';
import { makeSign } from './environment.js';
export async function buildLevel(scene,onProgress=()=>{}) {
  const names=['cargo_module','barricade','supply_crate','cryo_tank','gantry','ramp','relay','floodlight','drone','rifle','boulder','shale_ledge','ice_outcrop','helipad','heavy_drone','access_ladder'];
  const prototypes={};let loaded=0;await Promise.all(names.map(async name=>{prototypes[name]=await ASSET(name);onProgress(++loaded/names.length,name);}));
  const cameraPrototype=await ASSET('drone',{keepHierarchy:true});
  const terminalPrototype=await ASSET('computer_terminal',{keepHierarchy:true});
  const chunks=new Map(),colliders=[],surfaces=[],ramps=[],terminals=[],pickups=[],mapShapes=[],containerLabels=[],naturalFeatures=[];
  const chunk=(x,z)=>{const key=`${Math.floor(x/40)},${Math.floor(z/48)}`;if(!chunks.has(key))chunks.set(key,new THREE.Group());return chunks.get(key);};
  function prop(name,x,z,{y=0,rot=0,scale=1}={}){const g=prototypes[name].clone(true);g.position.set(x,y,z);g.rotation.y=rot;if(Array.isArray(scale))g.scale.set(...scale);else g.scale.setScalar(scale);chunk(x,z).add(g);return g;}
  function box(x,z,w,d,minY,maxY,angle=0,type='structure'){const c={x,z,w,d,minY,maxY,angle,type};colliders.push(c);return c;}
  function floor(x,z,w,d,y,angle=0){surfaces.push({x,z,w,d,y,angle});}
  function solid(name,x,z,w,d,h,opts={}){const g=prop(name,x,z,opts);box(x,z,w,d,opts.y||0,(opts.y||0)+h,opts.rot||0,name);floor(x,z,w,d,(opts.y||0)+h,opts.rot||0);return g;}
  function sign(text,x,y,z,opts={},rot=0){const s=makeSign(text,opts);s.position.set(x,y,z);s.rotation.y=rot;chunk(x,z).add(s);return s;}
  function cargo(x,z,{rot=0,scale=1,label='NIVALIS / LOGISTICS',sub='09 — INDUSTRIAL DIVISION',ends=[-1,1]}={}){
    prop('cargo_module',x,z,{rot,scale});const sx=Array.isArray(scale)?scale[0]:scale,sy=Array.isArray(scale)?scale[1]:scale,sz=Array.isArray(scale)?scale[2]:scale;
    const transform=(lx,lz)=>[x+lx*Math.cos(rot)+lz*Math.sin(rot),z-lx*Math.sin(rot)+lz*Math.cos(rot)];
    for(const side of [-1,1]){const[a,b]=transform(side*2.48*sx,0);box(a,b,.34*sx,10*sz,0,3.45*sy,rot,'wall');}
    floor(x,z,4.7*sx,10.2*sz,.28*sy,rot);
    box(x,z,5.2*sx,10.2*sz,3.26*sy,3.68*sy,rot,'roof');floor(x,z,5.2*sx,10.2*sz,3.7*sy,rot);
    // The old 2.675 m label plane intersected reinforcing ribs reaching 2.75 m.
    // Real standoff plates sit beyond them; ordinary depth testing is retained.
    const plateMat=new THREE.MeshStandardMaterial({color:0x263943,metalness:.58,roughness:.64});plateMat.color.convertSRGBToLinear();
    const boltMat=new THREE.MeshStandardMaterial({color:0x93a6ad,metalness:.78,roughness:.48});boltMat.color.convertSRGBToLinear();
    function plate(text,lx,lz,y,width,height,facing,detail=''){
      const [wx,wz]=transform(lx,lz),orientation=rot+facing,group=new THREE.Group();
      group.position.set(wx,y,wz);group.rotation.y=orientation;
      const backing=new THREE.Mesh(new THREE.BoxGeometry(width+.12,height+.10,.055),plateMat);backing.castShadow=backing.receiveShadow=true;group.add(backing);
      const face=makeSign(text,{width,height,sub:detail,orange:!detail});face.position.z=.0305;face.receiveShadow=true;group.add(face);
      for(const u of [-1,1])for(const v of [-1,1]){
        const stud=new THREE.Mesh(new THREE.CylinderGeometry(.017,.017,.011,6),boltMat);stud.rotation.x=Math.PI/2;stud.position.set(u*(width/2+.026),v*(height/2+.018),.033);stud.castShadow=stud.receiveShadow=true;group.add(stud);
        const spacer=new THREE.Mesh(new THREE.BoxGeometry(.085,.085,.11),plateMat);spacer.position.set(u*(width*.42),v*(height*.36),-.07);spacer.castShadow=spacer.receiveShadow=true;group.add(spacer);
      }
      chunk(wx,wz).add(group);containerLabels.push({text,x:wx,y,z:wz,rotation:orientation,width,height,sub:detail,faceOffset:.0305,textureUUID:face.material.map.uuid});
    }
    for(const end of ends)plate(label,0,end*5.225*sz,3.14*sy,3.7*sx,.32*sy,end<0?Math.PI:0);
    // Put side IDs toward the end of the container, away from the hidden tag panels.
    for(const side of [-1,1])plate(label,side*2.83*sx,2.85*sz,2.03*sy,3.2*sz,.69*sy,side*Math.PI/2,sub);

  }
  // Three lanes remain connected at their north and south ends.
  // No duplicate nameplates inside the overlap of the two connected tunnel modules.
  cargo(-20,-1,{label:'SERVICE / 01',sub:'THERMAL TRANSFER — RESTRICTED',ends:[1]});
  cargo(-20,-11,{label:'SERVICE / 01',sub:'THERMAL TRANSFER — RESTRICTED',ends:[-1]});
  cargo(-12,24,{rot:Math.PI/2,label:'CARGO / 04'});
  cargo(22,23,{label:'LOGISTICS / 02',scale:[1,1,1.1]});
  cargo(-23,-43,{rot:Math.PI/2,label:'NIVALIS / SYSTEMS',scale:[1,1,1.2]});
  cargo(4,-66,{label:'EXTRACTION / 09',scale:[1.4,1.4,.6]});
  // Eastern elevated route: two contiguous decks, ramps at both ends.
  function deck(z){prop('gantry',21,z);box(21,z,4,14,2.84,3.27,0,'deck');floor(21,z,4,14,3.27);for(const x of [19.1,22.9]){for(const zz of [z-6.3,z,z+6.3])box(x,zz,.34,.42,0,3.2,0,'leg');box(x,z,.11,14,3.28,4.33,0,'rail');}}
  deck(-9);deck(-23);
  function ramp(z,angle){prop('ramp',21,z,{rot:angle});ramps.push({x:21,z,w:3.58,d:8,angle,low:.2,high:3.27});for(let i=0;i<16;i++){const lz=-3.75+i*.5,h=.2+(4-lz)/8*3.07;box(21+lz*Math.sin(angle),z+lz*Math.cos(angle),3.7,.5,0,Math.max(.025,h-.24),angle,'ramp-body');}for(const side of [-1,1])for(let i=0;i<8;i++){const lz=-3.5+i,xx=21+side*1.9*Math.cos(angle)+lz*Math.sin(angle),zz=z-side*1.9*Math.sin(angle)+lz*Math.cos(angle),h=.2+(4-lz)/8*3.07;box(xx,zz,.16,1,h,h+1,angle,'ramp-rail');}}
  ramp(2,0);ramp(-34,Math.PI);
  for(const z of [-13,-22])solid('supply_crate',21.9,z,1.1,.9,.9,{y:3.27,scale:.78});
  sign('LOADING DECK / 02',21,2.35,-1.8,{width:3.2,height:.5,orange:true});
  // v1.7.1: a smaller square pad, parked uncrewed aircraft, same clear underpass.
  const padSize=13.2,padScale=padSize/15.6,padY=5.04,heading=-.18;
  prop('helipad',0,-13);
  box(0,-13,padSize,padSize,4.42,padY,0,'helipad-deck');floor(0,-13,padSize,padSize,padY);
  for(const x of [-7.74,7.74])for(const z of [-6.88,6.88]){
    box(x*padScale,-13+z*padScale,.44*padScale,.44*padScale,0,4.43,0,'helipad-leg');
    box(x*padScale,-13+z*padScale,1.12*padScale,1.10*padScale,0,.19,0,'helipad-foot');
  }
  const aircraft=prop('heavy_drone',0,-13,{y:padY,rot:heading});
  // Only physical aircraft components block sight/movement. No solid hull-sized
  // blocker on the snow beneath; the gaps between the landing legs remain real.
  const toDrone=(x,z)=>[x*Math.cos(heading)+z*Math.sin(heading),-13-x*Math.sin(heading)+z*Math.cos(heading)];
  const droneBox=(x,z,w,d,lo,hi,type,angle=0)=>{const[wx,wz]=toDrone(x,z);return box(wx,wz,w,d,padY+lo,padY+hi,heading+angle,type);};
  droneBox(0,-.10,2.64,3.38,1.14,2.72,'parked-drone-hull');
  droneBox(0,1.83,.93,.59,1.10,1.91,'parked-drone-optics');
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*2.86,z=sz*2.22;
    // Twelve tight tangential boxes follow each circular duct, not its void.
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,r=1.15;
      droneBox(x+r*Math.cos(a),z+r*Math.sin(a),.66,.31,1.76,2.28,'parked-drone-duct',-a+Math.PI/2);
    }
    droneBox(x,z,.42,.42,1.52,2.25,'parked-drone-motor');
    droneBox(sx*1.75,sz*1.44,1.73,.42,1.61,2.21,'parked-drone-arm',-sx*sz*.62);
    droneBox(sx*1.77,sz*1.64,.57,.83,0,.24,'parked-drone-foot');
    droneBox(sx*1.44,sz*1.40,.53,.42,.24,1.75,'parked-drone-leg');
  }
  sign('09 / DRONE PAD',-2.5,4.73,-13+7.945*padScale,{width:3.0,height:.36,orange:true});
  for(const s of [-1,1]){
    const id=makeSign('WARDEN / 09',{width:1.07,height:.16,bg:'#283640',color:'#c8d4d4'});
    id.position.set(s*1.352,2.025,-.02);id.rotation.y=s*Math.PI/2;aircraft.add(id);
  }
  // An explicit climb route on the south face; the ground underpass stays open.
  const ladder={id:'pad-ladder',x:0,z:-6.04,bottomY:0,topY:padY,climbZ:-5.48,deckZ:-7.05,exitZ:-4.80,speed:1.75};
  prop('access_ladder',ladder.x,ladder.z);
  for(const sx of [-.52,.52]){
    box(ladder.x+sx,ladder.z,.08,.08,0,6.12,0,'ladder-rail');
    box(ladder.x+sx,ladder.z,.18,.62,0,.04,0,'ladder-foot');
  }
  for(let y=.30;y<5.12;y+=.29)box(ladder.x,ladder.z,.96,.042,y-.021,y+.021,0,'ladder-rung');
  sign('ACCESS',.0,2.22,ladder.z+.057,{width:.36,height:.13,orange:true});
  const helipad={x:0,z:-13,y:padY,width:padSize,depth:padSize,clearance:4.42,aircraft:'heavy_drone',parked:true,footprintScale:padScale,droneSpan:8.40,heading};
  // Legible human-height cover, not a uniform field of crates.
  const barriers=[[-5,29,0],[7,19,-.16],[-6,15,.13],[1.2,6,0],[-7,-4,.16],[7,-22,0],[-7,-29,-.1],[12,-46,.3],[-10,-53,0],[1,-57,0],[-28,-25,Math.PI/2],[29,-9,Math.PI/2]];
  barriers.forEach(([x,z,rot])=>solid('barricade',x,z,3.6,1.0,1.29,{rot}));
  [[-4.8,22,1],[-8,22,1],[10.5,11,1],[12,10,.85],[-11,-17,1],[10,-30,1],[11.5,-31,.8],[-4,-33,1],[14,-54,1.1],[-29,4,.9],[-27,-4,1]].forEach(([x,z,s])=>solid('supply_crate',x,z,1.5*s,1.15*s,1.2*s,{scale:s,rot:(x%3)*.13}));
  [[-5.6,22,1.2,.75],[10.7,-30,1.2,.65]].forEach(([x,z,y,s])=>solid('supply_crate',x,z,1.5*s,1.15*s,1.2*s,{y,scale:s}));
  [[12,-5],[12,-12],[29,-28],[-30,-34],[-30,-40]].forEach(([x,z])=>solid('cryo_tank',x,z,2.55,2.55,3.68));
  // Primary landmark: deep front panels, four separate spines, a genuinely concave dish.
  prop('relay',4,-44);box(4,-44,7.3,7.3,0,1.08,0,'relay-base');box(4,-44,5.4,5.4,1.08,14,0,'relay');
  sign('09',4,9.45,-42.25,{width:1.2,height:1.16,bg:'#23353d'});
  // Stand the board ahead of the orange relay braces, rather than intersecting them.
  const board=new THREE.Group();board.position.set(4,2.52,-39.90);
  const boardMat=new THREE.MeshStandardMaterial({color:0x283640,metalness:.58,roughness:.69});boardMat.color.convertSRGBToLinear();
  const backing=new THREE.Mesh(new THREE.BoxGeometry(4.03,.94,.12),boardMat);backing.castShadow=backing.receiveShadow=true;board.add(backing);
  const arrayFace=makeSign('NIVALIS ARRAY',{width:3.8,height:.73,sub:'SIGNAL CONTROL / N-09',orange:true});arrayFace.position.z=.066;arrayFace.receiveShadow=true;board.add(arrayFace);
  for(const x of [-1.82,1.82]){
    const bracket=new THREE.Mesh(new THREE.BoxGeometry(.10,.12,.95),boardMat);bracket.position.set(x,-.28,-.46);bracket.castShadow=bracket.receiveShadow=true;board.add(bracket);
    const post=new THREE.Mesh(new THREE.BoxGeometry(.11,1.38,.11),boardMat);post.position.set(x,-.69,-.88);post.castShadow=post.receiveShadow=true;board.add(post);
    for(const y of [-.37,.37]){const screw=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.016,6),new THREE.MeshStandardMaterial({color:0x93a6ad,metalness:.8,roughness:.45}));screw.rotation.x=Math.PI/2;screw.position.set(x,y,.069);screw.castShadow=screw.receiveShadow=true;board.add(screw);}
  }
  chunk(4,-40).add(board);
  const arraySign={x:4,y:2.52,z:-39.834,width:3.8,height:.73,backingZ:-39.90};
  // Floodlights have both luminous housings and actual light reaching the floor.
  for(const [x,z,rot]of [[-12,11,-.35],[13,31,.3],[-13,-31,-.3],[15,-48,.2],[-27,-18,.1],[29,-12,0]]){prop('floodlight',x,z,{rot});box(x,z,.55,.55,0,6.4,0,'pole');}
  // Illumination is supplied by the bounded light pool in engine/atmosphere.js.
  // Perimeter outcrops mark the traversable valley; irregular snow caps face upward.
  let seed=21;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const natural=(name,x,z,s,rot)=>{
    // All replacement footprints stay at the perimeter; central routes are unchanged.
    const size=name==='boulder'?new THREE.Vector3(3.1,2,2.1):new THREE.Box3().setFromObject(prototypes[name]).getSize(new THREE.Vector3());
    const h=size.y;solid(name,x,z,size.x*s,size.z*s,h*s,{scale:s,rot});
    if(name!=='boulder')naturalFeatures.push({asset:name,x,z,scale:s,rotation:rot,height:h*s});
  };
  for(const side of [-1,1])for(let z=-77,i=0;z<45;z+=7.1,i++){
    const x=side*(37+rnd()*5),s=1.1+rnd()*1.4,rot=rnd()*6.28;
    // The same random draws keep all original perimeter positions stable.
    const name=[3,10,15].includes(i)?(side<0?'shale_ledge':'ice_outcrop'):[6,13].includes(i)?(side<0?'ice_outcrop':'shale_ledge'):'boulder';
    natural(name,x,z,s,rot);
  }
  for(let x=-36;x<=38;x+=7.8)solid('boulder',x,-77,4.8,3,3,{scale:1.4+rnd()*.6,rot:rnd()*6});
  [[-8,36,.7],[31,36,1.0],[-28,15,1],[30,-48,1.5],[-13,-64,1.1],[22,-62,.9]].forEach(([x,z,s])=>solid('boulder',x,z,3.2*s,2.2*s,2*s,{scale:s,rot:rnd()*6}));
  // Physical perimeter. The same extents appear on the tactical map.
  box(-44,-15,3,130,0,30,0,'boundary');box(44,-15,3,130,0,30,0,'boundary');box(0,-81,91,3,0,30,0,'boundary');box(0,47,91,3,0,30,0,'boundary');
  // Gameplay objects retain hierarchy and materials; never bake moving state.
  function terminal(id,x,z,y,name){
    const g=new THREE.Group();g.name=`UPLINK ${id} / computer console`;g.position.set(x,y,z);
    const body=terminalPrototype.clone(true);body.updateMatrixWorld(true);
    const anchor=body.getObjectByName('display-anchor');
    const screenPosition=anchor.getWorldPosition(new THREE.Vector3()),screenRotation=anchor.getWorldQuaternion(new THREE.Quaternion());
    g.add(bakeStatic(body));
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;
    const ink=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=4;
    const s=new THREE.Mesh(new THREE.PlaneGeometry(.955,.596),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,color:0xffffff}));
    s.name=`Uplink ${id} display`;s.position.copy(screenPosition);s.quaternion.copy(screenRotation);g.add(s);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.018,6,48),new THREE.MeshBasicMaterial({color:0x88dee6,transparent:true,opacity:.40}));ring.rotation.x=-Math.PI/2;ring.position.y=.018;g.add(ring);scene.add(g);
    // The keyboard remains wider than the pedestal; the collider matches both.
    box(x,z,1.12,.91,y,y+1.87,0,'console');
    const t={id,name,x,z,y,group:g,screen:s,ring,done:false,asset:'computer_terminal',displayCanvas:canvas,displayStatus:'ONLINE'};
    t.setOffline=(offline)=>{
      t.displayStatus=offline?'ISOLATED':'ONLINE';
      ink.fillStyle=offline?'#102629':'#0b2530';ink.fillRect(0,0,1024,640);
      ink.strokeStyle='#24525e';ink.lineWidth=1;
      for(let yy=100;yy<590;yy+=36){ink.beginPath();ink.moveTo(32,yy);ink.lineTo(992,yy);ink.stroke();}
      ink.fillStyle=offline?'#648e81':'#71b6bd';ink.font='24px monospace';ink.fillText('NIVALIS / SIGNAL CONTROL',44,55);
      ink.fillStyle=offline?'#a4c2b4':'#d0e4e1';ink.font='bold 91px monospace';ink.fillText(`UPLINK ${id}`,40,168);
      ink.fillStyle=offline?'#82bc9e':'#e9b888';ink.font='bold 30px monospace';ink.fillText(offline?'LINK ISOLATED / OFFLINE':'ENCRYPTED LINK / ACTIVE',44,225);
      ink.fillStyle='#7db0b8';ink.font='22px monospace';ink.fillText(name.toUpperCase(),44,272);
      ink.strokeStyle=offline?'#537c70':'#71b7bd';ink.lineWidth=2;ink.beginPath();
      for(let i=0;i<96;i++){const xx=45+i*6.4,yy=370+(offline?0:Math.sin(i*.41)*21+Math.sin(i*.19)*34);if(i)ink.lineTo(xx,yy);else ink.moveTo(xx,yy);}ink.stroke();
      for(let i=0;i<9;i++){ink.fillStyle=offline?'#24413f':'#4c8793';ink.fillRect(742+i*22,404-(offline?5:21+(i*37%76)),11,offline?5:21+(i*37%76));}
      ink.fillStyle='#517c89';ink.font='20px monospace';ink.fillText('ARRAY 09       SECURE CHANNEL',44,465);
      ink.fillStyle=offline?'#20483f':'#254755';ink.fillRect(36,506,952,90);
      ink.fillStyle=offline?'#a0c1ae':'#d6e5df';ink.font='bold 29px monospace';ink.fillText(offline?'OVERRIDE COMPLETE':'HOLD [E]  /  SEVER UPLINK',57,561);
      texture.needsUpdate=true;s.material.color.set(0xffffff);ring.material.color.set(offline?0x7be4ce:0x88dee6);
    };
    t.setOffline(false);terminals.push(t);return t;
  }
  terminal('A',-20,-9,.28,'Service tunnel');terminal('B',21,-18,3.27,'Loading deck');terminal('C',4,-37,0,'Central array');
  for(const [x,z]of [[-13,9],[27,-35],[-3,-55]]){const g=new THREE.Group();g.position.set(x,0,z);const crate=prototypes.supply_crate.clone(true);crate.scale.setScalar(.55);g.add(crate);const label=makeSign('+ FIELD KIT',{width:.72,height:.24,bg:'#25464a',color:'#a5e5df'});label.position.set(0,.51,.325);g.add(label);scene.add(g);pickups.push({x,z,group:g,taken:false});}
  const extraction={x:4,z:-67,y:0};const pad=new THREE.Mesh(new THREE.RingGeometry(2.7,2.85,64),new THREE.MeshBasicMaterial({color:0xebac79,side:THREE.DoubleSide,transparent:true,opacity:.7}));pad.rotation.x=-Math.PI/2;pad.position.set(4,.035,-67);scene.add(pad);extraction.pad=pad;
  chunks.forEach(g=>scene.add(bakeStatic(g)));
  return {prototypes,cameraPrototype,colliders,surfaces,ramps,terminals,pickups,extraction,mapShapes,containerLabels,naturalFeatures,arraySign,helipad,ladder,spawn:{x:4,z:38},bounds:{minX:-42,maxX:42,minZ:-79,maxZ:45}};
}
