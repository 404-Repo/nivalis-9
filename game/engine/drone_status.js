/* Instance-local LED materials. Never mutate the shared prototype, CCTV or another drone.
 * Bypass filmic tone mapping on the lamps only so the confirmed-alert red does
 * not desaturate into peach. Fog, depth testing and body PBR are unchanged. */
export function makeDroneStatus(group){
  const materials=[];
  group.traverse(o=>{
    if(!o.isMesh)return;
    if(Array.isArray(o.material))o.material=o.material.map(m=>copy(m));
    else o.material=copy(o.material);
  });
  function copy(m){if(m.name!=='drone-underside-signal')return m;const clone=m.clone();clone.toneMapped=false;materials.push(clone);return clone;}
  const colors={patrol:0xe7f4fa,suspicious:0xff9b31,locked:0xf50725};let current=null;
  function update(state){if(!Object.hasOwn(colors,state))state='patrol';if(current===state)return;current=state;
    for(const m of materials){m.color.set(colors[state]).convertSRGBToLinear();m.emissive.copy(m.color);m.emissiveIntensity=state==='locked'?1.0:state==='suspicious'?.85:1.55;}
  }
  update('patrol');
  return {materials,update,get state(){return current;},dispose(){materials.forEach(m=>m.dispose());}};
}
