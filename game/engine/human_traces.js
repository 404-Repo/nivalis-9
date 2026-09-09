/* v1.5 Human Traces — optional, local-only discoveries. The mission is unchanged.
   All added art is original procedural geometry; no Atlas assets or credentials.
   Interactive objects keep moving parts; only decorative geometry is batched. */
import { ASSET, bakeStatic } from './assets.js';
import { makeSign } from './environment.js';
import { makeHandpaintedEye, makeInteriorDecal, makeSprayDust } from './field_marks.js';

export const HUMAN_ACHIEVEMENT_KEY='nivalis9.achievements.v1';
export const HUMAN_ACHIEVEMENTS=Object.freeze({
  sweetEscape:{name:'Sweet Escape',description:'Find and eat the hidden cold-weather ration.'},
  eyesOff:{name:'Eyes Off',description:'Leave a pink crossed-out eye inside Container 09.'}
});

export async function buildHumanTraces(scene,level){
  const names=['field_chest','ration_bar','break_cluster','ammo_cache','service_crawler','station_rover','spray_cans'];
  const prototypes={};await Promise.all(names.map(async name=>{prototypes[name]=await ASSET(name,{keepHierarchy:name==='field_chest'||name==='ration_bar'});}));
  const cluster=new THREE.Group(),placements=[],addedColliders=[];
  function place(name,x,z,y=0,rot=0){const g=prototypes[name].clone(true);g.position.set(x,y,z);g.rotation.y=rot;cluster.add(g);placements.push({asset:name,x,y,z,rotation:rot});return g;}
  function solid(x,z,w,d,maxY,angle,type,minY=0){const c={x,z,w,d,minY,maxY,angle,type};level.colliders.push(c);addedColliders.push(c);return c;}
  // Peripheral bays, outside the eight existing flight circuits and all entrances.
  place('service_crawler',-32.2,26,0,.24);
  solid(-32.2,26,4.02,5.54,1.53,.24,'parked-crawler');
  solid(-32.2+Math.sin(.24)*.74,26+Math.cos(.24)*.74,2.64,2.62,3.5,.24,'crawler-cab',1.53);
  place('station_rover',31.7,-59,0,-.37);
  solid(31.7,-59,3.73,5.98,1.53,-.37,'parked-rover');
  solid(31.7,-59,2.64,5.39,3.39,-.37,'rover-body',1.53);
  for(const p of [[-6.0,25.5,0,.6],[-23.7,2.4,0,-.25],[24.9,-19.0,0,1.1],[-26.2,-46.6,0,-.5]])place('break_cluster',...p);
  for(const [x,z,rot] of [[-17.3,28.9,-.12],[25.8,-21.1,.18],[-27.8,-47.3,.32]]){
    place('ammo_cache',x,z,0,rot);solid(x,z,1.58,1.11,.9,rot,'ammo-cases');level.surfaces.push({x,z,w:1.58,d:1.11,y:.90,angle:rot});
  }
  // Spent paint cans are visible clues, not new collectable requirements or blockers.
  const sprayClues=[{id:'container-09',x:6.76,y:.397,z:-65.52,rot:-1.34}];
  for(const [i,clue] of sprayClues.entries()){
    place('spray_cans',clue.x,clue.z,clue.y,clue.rot);
    const dust=makeSprayDust(1404+i*317);dust.position.set(clue.x,clue.y+.013,clue.z);dust.rotation.z=-clue.rot;cluster.add(dust);
  }
  // Readable vehicle markings and a resupply stencil, not interactive pickups.
  function label(text,x,y,z,rotation,width,height,sub=''){
    const s=makeSign(text,{width,height,bg:'#283640',color:'#bec8c6',sub});s.position.set(x,y,z);s.rotation.y=rotation;cluster.add(s);
  }
  label('N-09 / SERVICE',-32.2+Math.sin(.24)*2.035,1.82,26+Math.cos(.24)*2.035,.24,1.4,.20);
  label('HUMAN CREW / 06',31.7+Math.sin(-.37)*2.738,1.45,-59+Math.cos(-.37)*2.738,-.37,1.36,.15);
  const staticGroup=bakeStatic(cluster);staticGroup.name='Human traces / static scenery';scene.add(staticGroup);
  // Hollow chest. Batch its body and lid separately to retain a real hinge.
  const raw=prototypes.field_chest.clone(true),originalLid=raw.getObjectByName('lid');
  raw.remove(originalLid);const pivot=originalLid.position.clone();originalLid.position.set(0,0,0);
  const chestGroup=new THREE.Group(),body=bakeStatic(raw),lid=bakeStatic(originalLid);lid.position.copy(pivot);lid.name='field-chest-lid';chestGroup.add(body,lid);
  // v1.5.1: original printed paper sleeve, on a raised removable chest insert.
  // Print is drawn locally once; no external images or texture service is used.
  const rationTree=prototypes.ration_bar.clone(true),print=rationTree.getObjectByName('wrapper-print');
  const labelCanvas=document.createElement('canvas');labelCanvas.width=768;labelCanvas.height=688;
  const ink=labelCanvas.getContext('2d');
  ink.fillStyle='#994c35';ink.fillRect(0,0,768,688);
  ink.fillStyle='#e5d1ae';ink.fillRect(26,24,716,545);
  ink.strokeStyle='#7f4935';ink.lineWidth=2;ink.strokeRect(41,39,686,514);
  ink.textAlign='left';ink.fillStyle='#664432';ink.font='500 24px monospace';
  ink.fillText('NIVALIS / 09',66,84);ink.textAlign='right';ink.fillText('70 g',699,84);
  ink.fillStyle='#442c23';ink.textAlign='center';
  ink.font='900 112px sans-serif';ink.fillText('COLD',384,224);
  ink.font='900 90px sans-serif';ink.fillText('RESERVE',384,319);
  ink.strokeStyle='#a16043';ink.lineWidth=3;ink.beginPath();ink.moveTo(80,351);ink.lineTo(688,351);ink.stroke();
  ink.font='600 36px sans-serif';ink.fillText('DARK CHOCOLATE',384,409);
  ink.fillStyle='#7f4935';ink.font='500 23px monospace';ink.fillText('COLD-WEATHER FIELD RATION',384,456);
  ink.font='600 23px monospace';ink.fillText('SMALL COMFORTS. LONG NIGHTS.',384,515);
  ink.fillStyle='#eedac0';ink.font='700 44px sans-serif';ink.textAlign='left';ink.fillText('70% CACAO',49,637);
  // Tiny batch bars and deliberate print wear, not fluorescent loot markings.
  ink.fillStyle='#e5c69f';for(let i=0;i<35;i++){const width=i%4===0?5:2;ink.fillRect(539+i*4.8,589,width,47-(i%5)*3);}
  let printSeed=1404;const wear=()=>{printSeed=(printSeed*1664525+1013904223)>>>0;return printSeed/4294967296;};
  for(let i=0;i<1400;i++){ink.fillStyle=i%2?'rgba(82,46,28,0.045)':'rgba(247,232,209,0.15)';ink.fillRect(wear()*768,wear()*688,1+wear()*2,1+wear()*3);}
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.encoding=THREE.sRGBEncoding;
  if(print){print.material=print.material.clone();print.material.color.set(0xffffff);print.material.map=labelTexture;print.material.needsUpdate=true;}
  const ration=bakeStatic(rationTree);ration.name='Cold Reserve / chocolate';
  ration.position.set(-.025,.517,-.020);ration.rotation.y=-.11;ration.scale.setScalar(1.2);chestGroup.add(ration);
  // A supported tray brings the edible object above the visual shadow of the rim.
  // It stays below the closed lid and inside the existing collision volume.
  const insert=new THREE.Group(),insertMat=new THREE.MeshStandardMaterial({color:0x394954,roughness:.96,metalness:.04});insertMat.color.convertSRGBToLinear();
  const insertMesh=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),insertMat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;insert.add(m);};
  insertMesh(1.19,.019,.49,0,.505,0);
  for(const x of [-.585,.585]){insertMesh(.02,.018,.49,x,.522,0);insertMesh(.046,.032,.44,x,.480,0);}
  for(const z of [-.24,.24])insertMesh(1.16,.018,.012,0,.522,z);
  const insertBaked=bakeStatic(insert);insertBaked.name='removable-ration-insert';chestGroup.add(insertBaked);
  const inside=makeSign('COLD RESERVE',{width:.68,height:.17,bg:'#283640',color:'#c9b69b',sub:'PERSONAL EFFECTS'});
  inside.rotation.x=Math.PI/2;inside.position.set(0,-.072,.40);lid.add(inside);
  const chest={id:'field-chest',x:-12.2,y:.28,z:25.37,rotation:Math.PI,group:chestGroup,lid,ration,opened:false,taken:false};
  chestGroup.position.set(chest.x,chest.y,chest.z);chestGroup.rotation.y=chest.rotation;scene.add(chestGroup);
  // A small, fixed utility lamp illuminates the contents; no glowing loot beacon.
  const lamp=new THREE.Group();lamp.position.set(-12.2,2.65,25.76);
  const housing=new THREE.Mesh(new THREE.BoxGeometry(.62,.11,.16),new THREE.MeshStandardMaterial({color:0x627580,metalness:.5,roughness:.75}));housing.castShadow=housing.receiveShadow=true;lamp.add(housing);
  const diffuser=new THREE.Mesh(new THREE.BoxGeometry(.47,.028,.13),new THREE.MeshStandardMaterial({color:0xffd6a0,emissive:0xffc894,emissiveIntensity:.65,roughness:.5}));diffuser.position.y=-.059;lamp.add(diffuser);scene.add(lamp);
  const chestLight=new THREE.PointLight(0xffd6a2,.85,4.8,1.25);chestLight.position.set(-12.2,2.31,24.94);scene.add(chestLight);

  solid(chest.x,chest.z,1.60,.98,chest.y+.81,chest.rotation,'field-chest',chest.y);
  level.surfaces.push({x:chest.x,z:chest.z,w:1.60,d:.98,y:chest.y+.81,angle:chest.rotation});
  // One clean panel in the existing Extraction / 09 container. The achievement
  // storage ID stays eyesOff, so already-earned trophies remain earned.
  const tags=[{id:'container-09',x:7.224,y:1.682,z:-65.50,rotation:-Math.PI/2,floorY:.392,interior:true,location:'Container 09 / extraction interior east wall'}].map((site,i)=>{
    const panel=new THREE.Group();panel.position.set(site.x,site.y-.12,site.z);panel.rotation.y=site.rotation;
    const liningMat=new THREE.MeshStandardMaterial({color:0x899b9f,metalness:.23,roughness:.82});liningMat.color.convertSRGBToLinear();
    panel.name='Container 09 / clean graffiti lining';
    const lining=new THREE.Mesh(new THREE.BoxGeometry(2.93,2.11,.026),liningMat);lining.position.z=-.020;lining.receiveShadow=lining.castShadow=true;panel.add(lining);
    for(const xx of [-1.39,1.39])for(const yy of [-.98,.98]){const screw=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.010,6),new THREE.MeshStandardMaterial({color:0x41545f,metalness:.68,roughness:.65}));screw.rotation.x=Math.PI/2;screw.position.set(xx,yy,-.001);screw.castShadow=screw.receiveShadow=true;panel.add(screw);}
    // A small maintenance light makes the clue legible; no objective waypoint.
    const fixture=new THREE.Mesh(new THREE.BoxGeometry(.56,.055,.13),new THREE.MeshStandardMaterial({color:0x9ebbbd,emissive:0x739ca0,emissiveIntensity:.18,roughness:.76}));fixture.position.set(.91,1.18,.075);fixture.castShadow=fixture.receiveShadow=true;panel.add(fixture);scene.add(panel);
    const normal=new THREE.Vector3(Math.sin(site.rotation),0,Math.cos(site.rotation));
    const workLight=new THREE.PointLight(0xb1ccd3,.44,4.2,1.25);workLight.position.set(site.x+normal.x*.6,2.59,site.z+normal.z*.6);scene.add(workLight);
    const texture=makeHandpaintedEye(i?9404:404),decal=makeInteriorDecal(site,texture);scene.add(decal);
    return {...site,decal,tagged:false,normal};
  });
  function update(dt){const target=chest.opened?-1.78:0,before=lid.rotation.x;lid.rotation.x+=(target-before)*(1-Math.exp(-dt*7));if(Math.abs(lid.rotation.x-target)<.001)lid.rotation.x=target;return Math.abs(before-lid.rotation.x)>.0001;}
  function reset(){chest.opened=chest.taken=false;chest.lid.rotation.x=0;chest.ration.visible=true;for(const tag of tags){tag.tagged=false;tag.decal.visible=false;tag.decal.material.opacity=0;}}
  return {chest,tags,sprayClues,placements,addedColliders,staticGroup,update,reset};
}

export function makeHumanObjectives(world,wallDistance,audio,notify,onSpray=()=>{}){
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  let records={},storageAvailable=true,charge=0,progress=0,targetId=null,releaseLatch=false,sprayClock=0;
  function load(){try{const raw=JSON.parse(localStorage.getItem(HUMAN_ACHIEVEMENT_KEY)||'{}');if(raw&&raw.version===1&&raw.unlocked&&typeof raw.unlocked==='object')for(const id of Object.keys(HUMAN_ACHIEVEMENTS))if(typeof raw.unlocked[id]==='string')records[id]=raw.unlocked[id];}catch{storageAvailable=false;}}
  load();
  function persist(){try{localStorage.setItem(HUMAN_ACHIEVEMENT_KEY,JSON.stringify({version:1,unlocked:records}));return true;}catch{storageAvailable=false;return false;}}
  function unlock(id){if(records[id])return false;records[id]=new Date().toISOString();persist();return true;}
  function tagsDone(){return world.tags.filter(t=>t.tagged).length;}
  function status(){return {opened:world.chest.opened,eaten:world.chest.taken,charge,tags:tagsDone(),tagsRequired:world.tags.length,progress,targetId,releaseLatch,storageAvailable,achievements:{...records}};}
  function observeKey(pressed){if(!pressed)releaseLatch=false;}
  function cancel(){progress=0;targetId=null;sprayClock=0;for(const tag of world.tags)if(!tag.tagged){tag.decal.visible=false;tag.decal.material.opacity=0;}}
  function reset(){charge=0;releaseLatch=false;cancel();world.reset();}
  function eligible(eye,direction,position,normal,range){const delta=position.clone().sub(eye),distance=delta.length();if(distance>range||distance<.001)return null;if(normal&&eye.clone().sub(position).dot(normal)<.06)return null;delta.divideScalar(distance);if(delta.dot(direction)<.50)return null;if(wallDistance(eye,delta,distance+.01)<distance-.07)return null;return distance;}
  function nearest(player,direction){
    const eye=V(player.x,player.y+player.height,player.z),candidates=[],chest=world.chest;
    const p=V(chest.x,chest.y+.57,chest.z-.53),dist=eligible(eye,direction,p,V(0,0,-1),2.65);
    if(dist!==null)candidates.push({id:chest.opened?(chest.taken?'chest-empty':'chest-eat'):'chest-open',kind:chest.opened?(chest.taken?'empty':'eat'):'open',distance:dist,required:chest.opened?(chest.taken?0:1.05):.85,title:chest.opened?(chest.taken?'EMPTY FOOTLOCKER':'EAT CHOCOLATE'):'OPEN FOOTLOCKER',description:chest.opened?(chest.taken?'Nothing left · personal effects recovered':releaseLatch?'Release E, then hold again to eat':'Cold Reserve · absorbs one drone hit'):'Personal effects · hold to inspect'});
    for(const tag of world.tags){if(tag.tagged)continue;const distance=eligible(eye,direction,V(tag.x,tag.y,tag.z),tag.normal,2.65);if(distance!==null)candidates.push({id:tag.id,kind:'tag',tag,distance,required:3,title:'LEAVE YOUR MARK',description:'Crossed-out eye · hold 3s · spray carries nearby'});}
    return candidates.sort((a,b)=>a.distance-b.distance)[0]||null;
  }
  function complete(target){
    if(target.kind==='open'&&!world.chest.opened){world.chest.opened=true;audio.tone(195,.12,'triangle',.06,105);audio.noise(.13,.045,1300);notify('A cold-weather ration. Release E, then hold E again to eat.','PERSONAL EFFECTS',5);}
    else if(target.kind==='eat'&&world.chest.opened&&!world.chest.taken){world.chest.taken=true;world.chest.ration.visible=false;charge=1;const first=unlock('sweetEscape');audio.confirm();notify('Sweet Escape — one drone hit buffered. The next one after that is fatal in Stealth.',first?'ACHIEVEMENT UNLOCKED':'COLD RESERVE',6);}
    else if(target.kind==='tag'&&!target.tag.tagged){target.tag.tagged=true;target.tag.decal.visible=true;target.tag.decal.material.opacity=.94;audio.tone(275,.15,'sine',.055,190);if(world.tags.length>0&&tagsDone()===world.tags.length){const first=unlock('eyesOff');audio.confirm();notify('Eyes Off — Container 09 marked. The defense grid is still active.',first?'ACHIEVEMENT UNLOCKED':'FIELD RECORD',5);}}
    releaseLatch=true;progress=0;targetId=null;
  }
  function hold(target,dt,pressed,context){
    observeKey(pressed);
    if(targetId!==target.id){cancel();targetId=target.id;}
    if(!pressed||releaseLatch||target.kind==='empty'){progress=0;if(target.kind==='tag'&&!target.tag.tagged){target.tag.decal.visible=false;target.tag.decal.material.opacity=0;}return 0;}
    progress=Math.min(target.required,progress+dt);
    if(target.kind==='tag'){
      target.tag.decal.visible=true;target.tag.decal.material.opacity=.12+.78*progress/target.required;
      sprayClock-=dt;if(sprayClock<=0){sprayClock=.38;audio.noise(.17,.032,1550);onSpray(context,6);}
    }
    if(progress>=target.required){complete(target);return 1;}
    return target.required?progress/target.required:0;
  }
  function absorbDroneHit(){if(charge!==1)return false;charge=0;audio.tone(115,.18,'sine',.10,58);notify('Cold Reserve spent. No buffer remains — get behind cover.','ONE HIT ABSORBED',5);return true;}
  return {nearest,hold,observeKey,cancel,reset,status,absorbDroneHit,storageKey:HUMAN_ACHIEVEMENT_KEY};
}
