/* Surveillance reuses the verified drone's optic/body, mounted on existing poles.
   No network assets, extra controls, navigation blockers, or infinite spawns. */
export const DIFFICULTY = Object.freeze({
  stealth: { label:'Stealth', stealth:true, cameras:true, dwell:2.8, alertDuration:12, damage:1000, boltSpeed:18, cadence:2.2, spread:0, response:1 },
  classic: { label:'Classic', cameras:false, dwell:2.5, alertDuration:14, damage:11, boltSpeed:19, cadence:2.4, spread:.55, response:0 },
  tactical: { label:'Tactical', cameras:true, dwell:2.5, alertDuration:14, damage:11, boltSpeed:19, cadence:2.4, spread:.55, response:1.05 },
  veteran: { label:'Veteran', cameras:true, dwell:1.65, alertDuration:18, damage:13, boltSpeed:22, cadence:2.05, spread:.42, response:1.35 }
});

export function makeSecurity(scene, level, wallDistance, audio, notify) {
  const cameras=[], lensColor=new THREE.Color(0xffc078), alertColor=new THREE.Color(0xff6659);
  const ray=new THREE.Vector3(), up=new THREE.Vector3(0,0,1), point=new THREE.Vector3();
  const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=64;
  const ctx=haloCanvas.getContext('2d'),rad=ctx.createRadialGradient(32,32,1,32,32,32);
  rad.addColorStop(0,'rgba(255,255,255,1)');rad.addColorStop(.17,'rgba(255,255,255,.6)');rad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=rad;ctx.fillRect(0,0,64,64);const haloMap=new THREE.CanvasTexture(haloCanvas);
  // Exact indices refer to the existing asset's central armored shell and sensor.
  // The four rotors and gun are omitted; the source asset remains unchanged.
  const housingParts=[0,1,18,19,23,24,25,26];
  const definitions=[
    {id:'A',name:'YARD WATCHER',x:-11.38,y:4.25,z:11.60,yaw:1.12,phase:0,floor:0},
    {id:'B',name:'DECK WATCHER',x:28.38,y:5.65,z:-11.45,yaw:-2.20,phase:1.6,floor:3.27},
    {id:'C',name:'ARRAY WATCHER',x:-12.40,y:4.5,z:-30.4,yaw:1.91,phase:3.1,floor:0}
  ];
  const beamGeo=new THREE.ConeGeometry(1,1,28,1,true);beamGeo.translate(0,-.5,0);beamGeo.rotateX(-Math.PI/2);
  for(const d of definitions){
    const head=new THREE.Group();
    for(const index of housingParts){const mesh=level.cameraPrototype.children[index].clone();mesh.material=mesh.material.clone();mesh.castShadow=false;head.add(mesh);}
    const lens=head.children[housingParts.indexOf(19)];
    head.position.set(d.x,d.y-.345,d.z);scene.add(head);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:haloMap,color:0xffc078,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));
    halo.scale.set(1.2,1.2,1);scene.add(halo);
    const beam=new THREE.Mesh(beamGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      uniforms:{tint:{value:lensColor.clone()},strength:{value:.035},floorY:{value:d.floor+.035}},
      vertexShader:'varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}',
      fragmentShader:'varying vec2 vUv;varying vec3 vWorld;uniform vec3 tint;uniform float strength;uniform float floorY;void main(){float a=pow(vUv.y,.5)*smoothstep(0.,.12,1.-vUv.y)*smoothstep(floorY,floorY+.5,vWorld.y)*strength;gl_FragColor=vec4(tint,a);}'
    }));scene.add(beam);
    cameras.push({...d,head,lens,halo,beam,eye:new THREE.Vector3(),direction:new THREE.Vector3(),hp:46,online:true,suspicion:0,seen:false,beepAt:0,disabledBy:null});
  }
  const network={cameras,alertRemaining:0,alerts:0,suspicion:0,detectedBy:null,lastKnown:{x:0,z:0},sourceId:null,quality:'balanced',destroyed:0};
  function pose(c,time){
    const yaw=c.yaw+Math.sin(time*.32+c.phase)*.58;
    c.head.rotation.set(.16,yaw,0,'YXZ');c.head.updateMatrixWorld(true);c.lens.getWorldPosition(c.eye);
    c.direction.set(Math.sin(yaw)*Math.cos(.16),-Math.sin(.16),Math.cos(yaw)*Math.cos(.16));
    c.halo.position.copy(c.eye).addScaledVector(c.direction,.04);
    const length=Math.min(24,wallDistance(c.eye,c.direction,24));
    c.beam.position.copy(c.eye);c.beam.quaternion.setFromUnitVectors(up,c.direction);c.beam.scale.set(Math.tan(.52)*length,Math.tan(.20)*length,length);
  }
  function offline(c,reason){
    c.online=false;c.disabledBy=reason;c.suspicion=0;c.seen=false;c.beam.visible=false;c.halo.visible=false;
    c.lens.material.emissiveIntensity=0;c.lens.material.color.set(0x243139);
  }
  network.reset=(difficulty='tactical')=>{
    network.difficulty=difficulty;network.alertRemaining=network.alerts=network.suspicion=network.destroyed=0;network.detectedBy=network.sourceId=null;
    for(const c of cameras){c.hp=46;c.online=true;c.suspicion=0;c.seen=false;c.beepAt=0;c.disabledBy=null;
      c.lens.material.color.copy(lensColor);c.lens.material.emissive.copy(lensColor);c.lens.material.emissiveIntensity=2;
      c.head.visible=true;c.halo.visible=true;pose(c,0);if(!DIFFICULTY[difficulty].cameras)offline(c,'classic');}
  };
  network.disableZone=id=>{
    const c=cameras.find(c=>c.id===id);if(c?.online)offline(c,'uplink');
    if(network.sourceId===id){network.alertRemaining=0;network.sourceId=null;}
  };
  network.update=(dt,player,state)=>{
    const config=DIFFICULTY[state.difficulty]||DIFFICULTY.tactical;
    network.alertRemaining=Math.max(0,network.alertRemaining-dt);network.suspicion=0;network.detectedBy=null;
    for(const c of cameras){
      if(!c.online)continue;pose(c,state.time);
      const target=point.set(player.x,player.y+player.height*.8,player.z),delta=ray.copy(target).sub(c.eye),distance=delta.length();delta.normalize();
      const clear=distance<24&&delta.dot(c.direction)>Math.cos(.52)&&wallDistance(c.eye,delta,distance+.03)>distance-.07;
      c.seen=config.cameras&&state.mode==='combat'&&state.time>=5&&clear;
      if(c.seen){
        const crouchFactor=player.height<1.3?.58:1;
        c.suspicion=Math.min(1,c.suspicion+dt/config.dwell*crouchFactor);
        const threshold=Math.floor(c.suspicion*3);
        if(threshold>c.beepAt&&threshold<3){audio.scan(threshold);c.beepAt=threshold;}
        if(c.suspicion>=1){
          if(network.alertRemaining<=0){network.alerts++;audio.alarm();notify('Surveillance lock. Break sight or destroy the camera.','GRID ALERT',4);}
          network.alertRemaining=config.alertDuration;network.lastKnown={x:player.x,z:player.z};network.sourceId=c.id;
        }
      }else{c.suspicion=Math.max(0,c.suspicion-dt*.55);if(c.suspicion<.05)c.beepAt=0;}
      if(c.suspicion>network.suspicion){network.suspicion=c.suspicion;network.detectedBy=c.name;}
      const hot=network.alertRemaining>0&&network.sourceId===c.id;
      c.lens.material.emissive.copy(hot?alertColor:lensColor);c.halo.material.color.copy(hot?alertColor:lensColor);
      c.halo.material.opacity=.50+c.suspicion*.22;c.beam.visible=network.quality!=='low';c.beam.material.uniforms.tint.value.copy(hot?alertColor:lensColor);c.beam.material.uniforms.strength.value=.014+c.suspicion*.024;
    }
  };
  network.hitTest=(o,d,maxDistance)=>{
    let nearest=maxDistance,hit=null;
    for(const c of cameras){if(!c.online)continue;const v=point.copy(c.eye).sub(o),along=v.dot(d),perp=v.lengthSq()-along*along,r=.54;
      if(along>0&&perp<r*r){const distance=along-Math.sqrt(r*r-perp);if(distance<nearest){nearest=distance;hit=c;}}}
    return hit?{camera:hit,distance:nearest}:null;
  };
  network.hit=(camera,amount)=>{
    if(!camera.online)return false;camera.hp-=amount;
    if(camera.hp<=0){offline(camera,'weapon');network.destroyed++;audio.kill();notify(DIFFICULTY[network.difficulty]?.stealth?'WATCHER OFFLINE / keep moving':'+60 / WATCHER OFFLINE','SURVEILLANCE',2.5);
      // Destruction stops fresh broadcasts, not a warning already received by sentries.
      return true;}
    return false;
  };
  network.setQuality=q=>{network.quality=q;for(const c of cameras)c.beam.visible=c.online&&q!=='low';};network.reset();return network;
}
