/* Layered atmosphere on top of the original level. All textures are local,
   analytic canvas gradients; the light pool has a fixed GPU light count. */
export function makeAtmosphere(scene,level,wallDistance=()=>Infinity){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.12,'rgba(255,255,255,.5)');g.addColorStop(.45,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  const glowTexture=new THREE.CanvasTexture(canvas),alarmColor=new THREE.Color(0xff6b53).convertSRGBToLinear(),halos=[],shafts=[],steam=[];
  const fixtures=[
    {x:-12,z:11,tx:-5,tz:5,color:0xffc38c}, {x:13,z:31,tx:6,tz:24,color:0xffc38c},
    {x:-13,z:-31,tx:-5,tz:-27,color:0xa0dbe9}, {x:15,z:-48,tx:5,tz:-40,color:0xffc38c},
    {x:-27,z:-18,tx:-20,tz:-14,color:0xffc38c}, {x:29,z:-12,tx:21,tz:-17,ty:3.27,color:0x8be4f1}
  ];
  // Three spotlights and two local fills, shared among authored fixtures.
  const pool=Array.from({length:3},()=>{const light=new THREE.SpotLight(0xffc38c,3.2,24,.9,.78,1.25);light.userData.baseColor=new THREE.Color();light.intensity=0;scene.add(light,light.target);return light;});
  const fills=Array.from({length:2},()=>{const light=new THREE.PointLight(0x8ceaf4,1.6,10,1.35);light.intensity=0;scene.add(light);return light;});
  const fillDefs=[{x:-20,y:2.8,z:1,color:0xffc38c},{x:-20,y:2.8,z:-10,color:0x84d8ed},{x:21,y:5,z:-18,color:0x84d8ed},{x:4,y:2.4,z:-37,color:0x84d8ed},{x:4,y:2.8,z:-67,color:0xffc38c}];
  const shaftGeo=new THREE.ConeGeometry(1,1,28,1,true);shaftGeo.translate(0,-.5,0);
  for(const f of fixtures){
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:f.color,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));halo.position.set(f.x,6.6,f.z);halo.scale.set(2.1,1.25,1);scene.add(halo);halos.push(halo);
    const target=new THREE.Vector3(f.tx,(f.ty||0)+.05,f.tz),pos=new THREE.Vector3(f.x,6.6,f.z),delta=target.clone().sub(pos),len=delta.length();
    const shaft=new THREE.Mesh(shaftGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      uniforms:{tint:{value:new THREE.Color(f.color)},opacity:{value:.026}},
      vertexShader:'varying vec2 vUv;varying float height;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);height=w.y;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader:'varying vec2 vUv;varying float height;uniform vec3 tint;uniform float opacity;void main(){float a=pow(vUv.y,.7)*smoothstep(0.,.18,1.-vUv.y)*smoothstep(.03,.8,height)*opacity;gl_FragColor=vec4(tint,a);}'
    }));shaft.position.copy(pos);shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),delta.normalize());shaft.scale.set(4.8,len,4.8);scene.add(shaft);shafts.push(shaft);
  }
  // Terminal lights use the same subtle halo rather than adding unbounded lights.
  for(const t of level.terminals){const h=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x7ce5ef,opacity:.3,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));h.position.set(t.x,t.y+1.1,t.z);h.scale.set(1.35,1.35,1);scene.add(h);halos.push(h);}
  const vents=[[12,-5],[12,-12],[29,-28],[-30,-34],[-30,-40]];
  for(let i=0;i<20;i++){const origin=vents[i%vents.length],s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xbacdd6,transparent:true,opacity:0,depthWrite:false}));scene.add(s);steam.push({sprite:s,x:origin[0],z:origin[1],phase:(i*.317)%1});}
  // Soft pools stay attached to their real fixtures, including on the deck.
  // Every patch is ray-tested against the same solid level used by the player;
  // do not paint a glow through a container roof or across an intervening wall.
  const groundPools=[];
  for(const f of fixtures){
    const radius=4.0,y=(f.ty||0)+.020,vertices=[],uvs=[],steps=16,origin=new THREE.Vector3(f.x,6.6,f.z);
    const point=(u,v)=>new THREE.Vector3(f.tx+(u-.5)*radius*2,y,f.tz+(v-.5)*radius*2);
    for(let iz=0;iz<steps;iz++)for(let ix=0;ix<steps;ix++){
      const center=point((ix+.5)/steps,(iz+.5)/steps),delta=center.clone().sub(origin),dist=delta.length();
      if(wallDistance(origin,delta.normalize(),dist+.03)<dist-.05)continue;
      // A light pool cannot extend beyond the authored narrow deck.
      if(f.ty&&Math.abs(center.x-21)>1.9)continue;
      for(const [u,v]of [[ix,iz],[ix,iz+1],[ix+1,iz],[ix+1,iz],[ix,iz+1],[ix+1,iz+1]]){
        const p=point(u/steps,v/steps);vertices.push(p.x,p.y,p.z);uvs.push(u/steps,v/steps);
      }
    }
    if(!vertices.length)continue;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();
    const m=new THREE.MeshBasicMaterial({map:glowTexture,color:new THREE.Color(f.color).convertSRGBToLinear(),transparent:true,opacity:.16,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:true});
    const mesh=new THREE.Mesh(geo,m);mesh.name='fixture ground spill';scene.add(mesh);groundPools.push(mesh);
  }
  let quality='balanced',lightClock=.5;
  const transitions={reassignments:0,maxLitRelocation:0};
  const spotSlots=pool.map(light=>({light,id:null,pending:null,gain:0}));
  const fillSlots=fills.map(light=>({light,id:null,pending:null,gain:0}));
  const distance=(f,p)=>Math.hypot(f.x-p.x,f.z-p.z);
  function select(slots,defs,player){
    // Incumbents get a 4 m preference to prevent selection chatter at ties.
    const held=new Set(slots.flatMap(s=>[s.id,s.pending]).filter(v=>v!==null));
    const chosen=defs.map((f,id)=>({id,score:distance(f,player)-(held.has(id)?4:0)})).sort((a,b)=>a.score-b.score).slice(0,slots.length).map(f=>f.id);
    const claimed=new Set();
    for(const s of slots){const candidate=s.pending!==null?s.pending:s.id;if(chosen.includes(candidate)&&!claimed.has(candidate)){claimed.add(candidate);s.pending=candidate;}}
    for(const s of slots){if(s.pending!==null&&chosen.includes(s.pending)&&claimed.has(s.pending))continue;
      const id=chosen.find(id=>!claimed.has(id));if(id!==undefined){s.pending=id;claimed.add(id);}
    }
  }
  function fadeSlots(slots,defs,dt,spot){
    for(const [i,s] of slots.entries()){
      const changing=s.id!==s.pending,goal=changing?0:((spot&&i===2&&quality==='low')?0:1);
      // Never move an illuminated light. Fade fully down, move, then fade up.
      s.gain=goal>s.gain?Math.min(goal,s.gain+dt/.55):Math.max(goal,s.gain-dt/.45);
      if(changing&&s.gain===0&&s.pending!==null){
        transitions.maxLitRelocation=Math.max(transitions.maxLitRelocation,s.gain);s.id=s.pending;transitions.reassignments++;
        const f=defs[s.id];s.light.position.set(f.x,spot?6.6:f.y,f.z);s.light.color.set(f.color).convertSRGBToLinear();
        if(spot){s.light.target.position.set(f.tx,f.ty||0,f.tz);s.light.userData.baseColor.copy(s.light.color);}
      }
      s.light.intensity=s.gain*(spot?3.6:1.6);
    }
  }
  return {fixtures,pool,fills,steam,glowTexture,groundPools,transitions,spotSlots,fillSlots,
    setQuality(q){quality=q;shafts.forEach(s=>s.visible=q!=='low');steam.forEach((s,i)=>s.sprite.visible=q!=='low'||i%3===0);},
    update(dt,player,time,alert=0){
      lightClock+=dt;
      if(lightClock>.2){lightClock=0;select(spotSlots,fixtures,player);select(fillSlots,fillDefs,player);}
      fadeSlots(spotSlots,fixtures,dt,true);fadeSlots(fillSlots,fillDefs,dt,false);
      // A slow warning wash, not a strobe; preserve the fade envelope.
      pool[0].color.copy(pool[0].userData.baseColor);if(alert>0){pool[0].color.lerp(alarmColor,.26+.05*Math.sin(time*2.1));pool[0].intensity=spotSlots[0].gain*(3.5+Math.sin(time*2.1)*.32);}
      halos.forEach((h,i)=>{h.material.opacity=(i<6?.72:.3)+Math.sin(time*.65+i)*.045;});
      for(const s of steam){const life=(time*.16+s.phase)%1;const scale=1.2+life*4.5;s.sprite.position.set(s.x+.42+life*1.8,3.46+life*3.2,s.z+life*.45);s.sprite.scale.set(scale,scale*1.15,1);s.sprite.material.opacity=Math.sin(life*Math.PI)*.18;}
    }
  };
}
