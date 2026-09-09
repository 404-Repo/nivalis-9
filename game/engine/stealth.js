import { makeDroneStatus } from './drone_status.js';
/* Silent Crossing: authored, collision-tested aerial patrols and directional
   perception. No navigation dependencies, hidden hitscan fire, or reinforcements.
   Coordinates below are [x, y, z] metres (y is the drone's base, not its eye). */
export const STEALTH_ROUTES = Object.freeze([
  {id:'S1',name:'Cargo sweep',band:'LOW',speed:1.9,pause:.85,points:[[-1,1.65,28],[-1,1.65,19],[-2,1.65,10],[5,1.65,10],[5,1.65,25],[3,1.65,32],[-1,1.65,32]]},
  {id:'S2',name:'Service perimeter',band:'LOW',speed:2.0,pause:.85,points:[[-14,1.7,10],[-14,1.7,1],[-14,1.7,-11],[-14,1.7,-23],[-25,1.7,-23],[-25,1.7,8],[-23,1.7,10]]},
  {id:'S3',name:'Transfer underpass',band:'LOW',speed:1.85,pause:1.0,points:[[4,1.7,0],[4,1.7,-9],[5,1.7,-19],[1,1.7,-26],[-4,1.7,-23],[-4,1.7,-14],[-4,1.7,-2]]},
  {id:'S4',name:'Array perimeter',band:'LOW',speed:2.15,pause:1.0,points:[[-3,1.7,-39],[-3,1.7,-50],[9,1.7,-51],[16,1.7,-57],[16,1.7,-68],[10,1.7,-71],[-3,1.7,-71],[-8,1.7,-66],[-8,1.7,-58],[-12,1.7,-54],[-14,1.7,-49],[-13,1.7,-36]]},
  {id:'D1',name:'Loading deck',band:'DECK',speed:1.65,pause:1.6,points:[[21,5.6,-4],[21,5.6,-28]]},
  {id:'D2',name:'Helipad perimeter',band:'MID',speed:1.8,pause:1.2,points:[[-10.2,6.7,-3.3],[10.2,6.7,-3.3],[10.2,6.7,-22.7],[-10.2,6.7,-22.7]]},
  {id:'H1',name:'South overwatch',band:'HIGH',speed:2.7,pause:1.1,points:[[7,9.6,26],[27,9.1,12],[26,9.8,-5],[-10,9.5,-5],[-28,9.2,8],[-28,9.2,27]]},
  {id:'H2',name:'Array overwatch',band:'HIGH',speed:2.55,pause:1.25,points:[[-14,10.4,-27],[16,11.6,-27],[28,10.2,-43],[21,9.4,-60],[-9,11.1,-60],[-16,9.8,-48]]}
]);

export function makeStealthController(scene,level,wallDistance,rayBox,audio,notify,fire) {
  const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
  const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const point=e=>V(e.x,e.y,e.z);
  // Circumscribed rotor radius: scaled original asset, with clearance margin.
  // Expand boxes by the full body extents so *all* patrol movement is swept.
  const blockers=level.colliders.map(c=>({...c,w:c.w+2.5,d:c.d+2.5,minY:c.minY-.93,maxY:c.maxY+.11}));
  const halfFov=.78, fovRange=29, owned=[];
  let warningAt=-99,noiseAt=-99;
  const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=64;
  const cx=haloCanvas.getContext('2d'),gradient=cx.createRadialGradient(32,32,1,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.12,'rgba(255,255,255,.8)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  cx.fillStyle=gradient;cx.fillRect(0,0,64,64);const haloMap=new THREE.CanvasTexture(haloCanvas);
  const beamGeo=new THREE.ConeGeometry(1,1,20,1,true);beamGeo.translate(0,-.5,0);beamGeo.rotateX(-Math.PI/2);
  const laserGeo=new THREE.CylinderGeometry(1,1,1,5);
  const colors={patrol:0xe7f4fa,suspicious:0xffc180,locked:0xff756a};
  function routeClear(a,b){const dir=b.clone().sub(a),length=dir.length();if(length<1e-7)return !blockers.some(c=>rayBox(a,V(0,1,0),c,.001)<.001);dir.divideScalar(length);return blockers.every(c=>rayBox(a,dir,c,length+.001)>length);}
  function populate(enemies){
    warningAt=noiseAt=-99;
    for(const [i,route] of STEALTH_ROUTES.entries()){
      const [x,y,z]=route.points[0],next=route.points[1],group=level.prototypes.drone.clone(true);group.scale.setScalar(.92);group.position.set(x,y,z);group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
      const signal=new THREE.Sprite(new THREE.SpriteMaterial({map:haloMap,color:colors.patrol,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));signal.position.set(0,.57,.55);signal.scale.set(.85,.85,1);group.add(signal);
      const cone=new THREE.Mesh(beamGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
        uniforms:{tint:{value:new THREE.Color(colors.patrol)},strength:{value:.018}},
        vertexShader:'varying vec2 uv0;varying vec3 world0;void main(){uv0=uv;world0=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world0,1.);}',
        fragmentShader:'varying vec2 uv0;varying vec3 world0;uniform vec3 tint;uniform float strength;void main(){float a=pow(uv0.y,.65)*smoothstep(0.,.15,1.-uv0.y)*smoothstep(.08,.65,world0.y)*strength;gl_FragColor=vec4(tint,a);}'
      }));cone.name='Search lamp — not sensor range';cone.userData.role='decorative-lamp';cone.position.set(0,.55,.35);cone.rotation.x=route.band==='HIGH'?.46:.16;group.add(cone);
      const aimLine=new THREE.Mesh(laserGeo,new THREE.MeshBasicMaterial({color:colors.locked,transparent:true,opacity:.58,depthWrite:false,blending:THREE.AdditiveBlending}));aimLine.visible=false;scene.add(group,aimLine);
      const e={group,x,y,z,anchorX:x,anchorZ:z,baseY:y,hp:63,alive:true,cooldown:0,charge:0,phase:i*1.71,interest:0,lastKnown:{x,y,z},engaged:false,
        statusLight:makeDroneStatus(group),pursuitRemaining:0,route,id:route.id,yaw:Math.atan2(next[0]-x,next[2]-z),waypoint:1,wait:0,waitYaw:0,suspicion:0,seen:false,reported:false,beep:0,searchOrigin:null,returning:false,patrolDistance:0,laps:0,signal,cone,aimLine,patrolState:'PATROL',range:route.band==='HIGH'?fovRange:route.band==='MID'?20:24,halfFov};
      group.rotation.y=e.yaw;enemies.push(e);owned.push(e);
    }
  }
  function clear(){for(const e of owned){scene.remove(e.aimLine);e.statusLight.dispose();e.signal.material.dispose();e.cone.material.dispose();e.aimLine.material.dispose();}owned.length=0;}
  function sensorInfo(e){return {range:e.range,halfFov:e.halfFov,pitchCenter:e.route.band==='HIGH'?-.46:-.16,pitchHalfAngle:.84,closeRadius:1.6};}
  function perceive(e,player,state){
    const sensor=sensorInfo(e);
    const eye=V(e.x,e.y+.54,e.z),target=V(player.x,player.y+player.height*.83,player.z),delta=target.clone().sub(eye),horizontal=Math.hypot(delta.x,delta.z),distance=delta.length();
    const angle=horizontal>.001?Math.abs(wrap(Math.atan2(delta.x,delta.z)-e.yaw)):0;
    const pitch=Math.atan2(delta.y,Math.max(.001,horizontal)),pitchCenter=sensor.pitchCenter;
    let seen=state.mode==='combat'&&state.time>=5&&distance<sensor.range&&(angle<sensor.halfFov||distance<sensor.closeRadius)&&Math.abs(pitch-pitchCenter)<sensor.pitchHalfAngle;
    if(seen){delta.normalize();seen=wallDistance(eye,delta,distance+.02)>distance-.045;}
    const crouching=player.height<1.3,sprinting=player.speed>5;
    const rate=(crouching?.48:sprinting?1.5:1)*cap(1.36-distance/47,.67,1.2)/2.35;
    return {seen,eye,target,distance,rate,angle};
  }
  function investigate(e,lastKnown,duration=6){
    if(!e.searchOrigin)e.searchOrigin=point(e);
    e.lastKnown={...lastKnown};e.interest=Math.max(e.interest,duration);e.returning=false;
  }
  function hear(enemies,player,state,radius=26){
    if(state.mode!=='combat'||state.time<5)return;
    for(const e of enemies){if(!e.alive)continue;const target=V(player.x,player.y+player.height*.65,player.z),eye=V(e.x,e.y+.54,e.z),dir=target.clone().sub(eye),distance=dir.length();dir.normalize();
      const muffled=wallDistance(eye,dir,distance+.03)<distance-.05;
      if(distance<radius*(muffled?.48:1))investigate(e,{x:player.x,y:player.y,z:player.z},6);
    }
  }
  function turn(e,yaw,dt){e.yaw+=cap(wrap(yaw-e.yaw),-1.65*dt,1.65*dt);}
  function move(e,target,speed,dt){
    const from=point(e),delta=target.clone().sub(from),distance=delta.length();if(distance<.04)return true;
    const heading=Math.atan2(delta.x,delta.z);turn(e,heading,dt);
    const facing=Math.cos(wrap(heading-e.yaw));if(facing<.55)return false; // No instant 180-degree targeting or side-sliding.
    const step=Math.min(distance,speed*dt),next=from.clone().addScaledVector(delta,step/distance);
    if(!routeClear(from,next))return false;
    e.x=next.x;e.y=next.y;e.z=next.z;e.patrolDistance+=step;return distance-step<.045;
  }
  function patrol(e,dt,time){
    if(e.returning&&e.searchOrigin){if(move(e,e.searchOrigin,e.route.speed,dt)){e.searchOrigin=null;e.returning=false;}return;}
    if(e.wait>0){e.wait-=dt;turn(e,e.waitYaw+Math.sin((e.route.pause-e.wait)*2.0)*.22,dt);return;}
    const target=V(...e.route.points[e.waypoint]);
    if(move(e,target,e.route.speed,dt)){e.wait=e.route.pause;e.waitYaw=e.yaw;e.waypoint=(e.waypoint+1)%e.route.points.length;if(e.waypoint===1)e.laps++;}
  }
  function search(e,dt,time,pursuit=false){
    const base=e.searchOrigin||point(e),target=V(e.lastKnown.x,base.y,e.lastKnown.z),delta=target.clone().sub(base),length=delta.length();
    const leash=pursuit?9:6.5;
    if(length>leash)target.copy(base).addScaledVector(delta,leash/length);
    // Investigation remains on this flight layer and on a reversible clear line.
    let destination=base;
    for(const fraction of [1,.75,.5,.25]){const trial=base.clone().lerp(target,fraction);if(routeClear(base,trial)&&routeClear(point(e),trial)){destination=trial;break;}}
    // The spotting unit closes faster, but stays in its flight layer and stops
    // short of the player. It never reads a hidden current position here.
    const close=e.seen&&Math.hypot(e.lastKnown.x-e.x,e.lastKnown.z-e.z)<5.8;
    if(close||move(e,destination,e.route.speed*(pursuit?1.65:.8),dt))turn(e,Math.atan2(e.lastKnown.x-e.x,e.lastKnown.z-e.z)+(e.seen?0:Math.sin(time*1.25+e.phase)*.34),dt);
  }
  function pose(e,time,quality='balanced'){
    e.group.position.set(e.x,e.y+Math.sin(time*1.3+e.phase)*.055,e.z);e.group.rotation.set(0,e.yaw,0);
    const red=e.engaged||e.pursuitRemaining>0;
    e.statusLight.update(red?'locked':e.suspicion>.03||e.interest>0?'suspicious':'patrol');
    const color=red?colors.locked:e.suspicion>.03||e.interest>0?colors.suspicious:colors.patrol;
    e.signal.material.color.set(color);e.signal.material.opacity=red?.78+.12*Math.sin(time*8):.53;
    const direction=V(Math.sin(e.yaw)*Math.cos(e.cone.rotation.x),-Math.sin(e.cone.rotation.x),Math.cos(e.yaw)*Math.cos(e.cone.rotation.x)),eye=V(e.x,e.y+.54,e.z),length=Math.min(8,wallDistance(eye,direction,8));
    e.cone.visible=quality!=='low';e.cone.material.uniforms.tint.value.set(color);e.cone.material.uniforms.strength.value=e.engaged?.025:e.suspicion>.03?.022:.012;
    // A narrow physical lamp, deliberately distinct from the map sensor sector.
    e.cone.userData.lampLength=length;e.cone.userData.sensorRange=e.range;
    e.cone.scale.set(length*.16,length*.11,length);e.aimLine.visible=e.engaged&&e.charge>.04;
    if(e.aimLine.visible){const end=V(e.lastKnown.x,e.lastKnown.y,e.lastKnown.z),d=end.clone().sub(eye);e.aimLine.position.copy(eye).add(end).multiplyScalar(.5);e.aimLine.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize());e.aimLine.scale.set(.013,d.length(),.013);}
  }
  function update(dt,enemies,player,state,security,quality='balanced'){
    state.droneSuspicion=0;state.threatId=null;state.droneEngaged=false;
    if(player.speed>5&&player.grounded&&state.time-noiseAt>.6){noiseAt=state.time;hear(enemies,player,state,12);}
    for(const e of enemies){
      if(!e.alive){e.aimLine.visible=false;continue;}
      const sense=perceive(e,player,state);e.seen=sense.seen;e.interest=Math.max(0,e.interest-dt);e.cooldown=Math.max(0,e.cooldown-dt);e.pursuitRemaining=Math.max(0,e.pursuitRemaining-dt);
      if(state.mode==='combat'&&state.time>=5&&security.alertRemaining>0&&Math.hypot(e.x-security.lastKnown.x,e.z-security.lastKnown.z)<31&&!sense.seen){investigate(e,security.lastKnown,4);}
      if(sense.seen){
        e.suspicion=Math.min(1,e.suspicion+dt*sense.rate);
        if(e.suspicion>.13){investigate(e,{x:player.x,y:sense.target.y,z:player.z},7);turn(e,Math.atan2(player.x-e.x,player.z-e.z),dt);}
        const threshold=e.suspicion>.65?2:e.suspicion>.16?1:0;
        if(threshold>e.beep){if(state.time-warningAt>.3){audio.scan(threshold);warningAt=state.time;}e.beep=threshold;}
        if(e.suspicion>=1&&!e.reported){
          e.reported=true;e.pursuitRemaining=6.5;state.droneAlerts++;audio.alarm();notify(`${e.id} has a lock. Break sight before it fires.`,'DRONE LOCK',3.5);
          for(const other of enemies)if(other!==e&&other.alive&&Math.hypot(other.x-e.x,other.z-e.z)<20)investigate(other,e.lastKnown,5);
        }
      }else{
        e.suspicion=Math.max(0,e.suspicion-dt*.58);e.charge=0;
        if(e.suspicion<.03)e.beep=0;
        if(e.interest<=0&&e.suspicion<.03){e.reported=false;e.pursuitRemaining=0;if(e.searchOrigin)e.returning=true;}
      }
      e.engaged=sense.seen&&e.suspicion>=1;
      if(e.engaged){
        e.lastKnown={x:player.x,y:sense.target.y,z:player.z};e.pursuitRemaining=6.5;
        search(e,dt,state.time,true);
        // Re-evaluate after movement: a faster approach may put cover in the way.
        // Never release a charged bolt using a stale pre-movement visibility test.
        const fresh=perceive(e,player,state);
        if(!fresh.seen){e.engaged=false;e.charge=0;}
        else if(e.cooldown<=0){e.charge+=dt;if(e.charge>=.9){fire(e,fresh.target);e.charge=0;e.cooldown=2.2;}}
      }
      if(!sense.seen||e.suspicion<=.13){if(e.interest>0)search(e,dt,state.time,e.pursuitRemaining>0);else patrol(e,dt,state.time);}
      e.patrolState=e.engaged?'PURSUING':e.pursuitRemaining>0?'CONTACT SEARCH':e.suspicion>.03?'ACQUIRING':e.interest>0?'SEARCHING':e.returning?'RETURNING':'PATROL';
      if(e.suspicion>state.droneSuspicion){state.droneSuspicion=e.suspicion;state.threatId=e.id;}
      state.droneEngaged ||= e.engaged;
      pose(e,state.time,quality);
    }
  }
  function metrics(){return STEALTH_ROUTES.map(r=>({id:r.id,name:r.name,band:r.band,minY:Math.min(...r.points.map(p=>p[1])),maxY:Math.max(...r.points.map(p=>p[1])),length:r.points.reduce((n,p,i)=>n+V(...p).distanceTo(V(...r.points[(i+1)%r.points.length])),0),clear:r.points.every((p,i)=>routeClear(V(...p),V(...r.points[(i+1)%r.points.length])))}));}
  return {sensorInfo,populate,clear,update,perceive,hear,investigate,patrol,pose,routeClear,metrics,routes:STEALTH_ROUTES};
}
