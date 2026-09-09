/* v1.5.2 Field Marks. Locally drawn spray paint, not an image-service asset.
 * Textures are generated once per site; no allocation or paint RNG per frame.
 */
export function makeHandpaintedEye(seed=404){
 const c=document.createElement('canvas');c.width=1024;c.height=768;const ctx=c.getContext('2d');
 let state=seed>>>0;const rnd=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 const variant=seed===404?0:1;
 const brushes=['255,37,144','239,22,123','255,82,171'].map(rgb=>{
  const b=document.createElement('canvas');b.width=b.height=64;const x=b.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,`rgba(${rgb},.78)`);r.addColorStop(.36,`rgba(${rgb},.69)`);r.addColorStop(.61,`rgba(${rgb},.37)`);r.addColorStop(.80,`rgba(${rgb},.10)`);r.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=r;x.fillRect(0,0,64,64);return b;
 });
 const cubic=(a,b,c,d,t)=>{const u=1-t;return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];};
 function spray(points,width,brush=0,phase=0){
  let distance=0,previous=null;
  for(let segment=0;segment<points.length;segment++)for(let i=0;i<=110;i++){
   const t=i/110,p=cubic(...points[segment],t);if(previous)distance+=Math.hypot(p[0]-previous[0],p[1]-previous[1]);previous=p;
   // Slow hand deviation and pressure changes keep the contour uneven rather
   // than the old perfect Bezier/circle stencil. Fine random jitter is subtle.
   const x=p[0]+Math.sin(distance*.064+phase)*1.65+(rnd()-.5)*1.2;
   const y=p[1]+Math.sin(distance*.040+phase+2)*2.1+(rnd()-.5)*1.3;
   const w=width*(.85+.17*Math.sin(distance*.032+phase)+.11*Math.sin(distance*.109));
   ctx.globalAlpha=.40+rnd()*.24;ctx.drawImage(brushes[brush],x-w,y-w,w*2,w*2);
   for(let j=0;j<5;j++){
    const angle=rnd()*Math.PI*2,r=w*(.52+Math.pow(rnd(),.7)*1.38),size=.38+rnd()*1.3;
    ctx.globalAlpha=.07+rnd()*.24;ctx.fillStyle=j%3?'#fa268c':'#ff63b2';ctx.fillRect(x+Math.cos(angle)*r,y+Math.sin(angle)*r,size,size);
   }
  }
  ctx.globalAlpha=1;
 }
 // A slightly crooked almond; the two lids meet off-center and at different angles.
 const upper=variant?[[[189,376],[307,249],[518,196],[663,269]],[[663,269],[731,286],[797,342],[842,389]]]:[[[169,386],[307,263],[486,212],[645,267]],[[645,267],[727,293],[798,334],[847,379]]];
 const lower=variant?[[[187,384],[291,466],[450,514],[608,484]],[[608,484],[698,464],[765,419],[842,389]]]:[[[173,392],[297,489],[442,515],[594,475]],[[594,475],[710,456],[790,411],[847,379]]];
 spray(upper,20,0,1.2);spray(lower,17.4,1,4.4);
 // Imperfect iris drawn in one pass, with a dry finish rather than a geometric ring.
 const dx=variant?13:-5,dy=variant?5:-3;
 const iris=[[[509+dx,280+dy],[591+dx,277+dy],[627+dx,339+dy],[608+dx,397+dy]],[[608+dx,397+dy],[591+dx,461+dy],[516+dx,475+dy],[470+dx,429+dy]],[[470+dx,429+dy],[418+dx,375+dy],[445+dx,299+dy],[503+dx,285+dy]]];
 spray(iris,16,0,2.3);
 spray([[[525+dx,335+dy],[503+dx,360+dy],[506+dx,400+dy],[545+dx,400+dy]],[[545+dx,400+dy],[568+dx,398+dy],[557+dx,356+dy],[536+dx,346+dy]]],20,1,3);
 // The slash is freehand over the eye: no artificial erased halo underneath.
 spray(variant?[[[285,591],[352,506],[432,444],[509,384]],[[509,384],[594,309],[688,230],[756,155]]]:[[[267,601],[351,517],[427,442],[506,376]],[[506,376],[591,304],[659,237],[751,162]]],27,0,.7);
 // Extra wet pass at the starting point; paint accumulates where a hand pauses.
 ctx.globalAlpha=.5;ctx.drawImage(brushes[2],(variant?285:267)-25,(variant?591:601)-26,50,52);ctx.globalAlpha=1;
 const drips=variant?[[322,458,44,2.1],[600,479,37,1.5],[756,158,21,1.6],[285,592,45,3.0],[455,431,20,1.2]]:[[301,473,53,2.2],[587,478,30,1.4],[266,601,49,3.1],[715,439,38,1.7],[463,427,23,1.4],[845,381,26,1.5]];
 for(const [x,y,length,width] of drips){
  ctx.strokeStyle='rgba(255,39,143,.70)';ctx.lineCap='round';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+1,y+length*.3,x-1.4,y+length*.72,x+.6,y+length);ctx.stroke();ctx.fillStyle='#ff2997';ctx.beginPath();ctx.ellipse(x+.6,y+length,width*.68,width*1.4,0,0,Math.PI*2);ctx.fill();
 }
 // Sparse dry flecks preserve readability, unlike blanket regular distress.
 ctx.globalCompositeOperation='destination-out';for(let i=0;i<620;i++){ctx.fillStyle=`rgba(0,0,0,${.06+rnd()*.27})`;ctx.fillRect(145+rnd()*727,200+rnd()*422,.5+rnd()*2.1,.5+rnd()*1.8);}ctx.globalCompositeOperation='source-over';
 const texture=new THREE.CanvasTexture(c);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=4;texture.name=`hand-sprayed-neon-pink-eye-${seed}`;return texture;
}

export function makeRibFollowingDecal(site,texture){
 const width=2.45,height=1.84,scaleZ=site.scaleZ||1;
 // The site remains the original interaction point. The paint lies on the
 // actual pale wall and the raised reinforcing ribs, not on a floating card.
 const centerLocalZ=site.localZ||0,half=width/2;
 const breaks=[-half,half];
 for(let z=-4.8;z<5;z+=1.2)for(const edge of [-.10,.10]){const u=(z+edge-centerLocalZ)*scaleZ;if(u>-half&&u<half)breaks.push(u);}
 breaks.sort((a,b)=>a-b);
 const depthAt=u=>{const localZ=centerLocalZ+u/scaleZ;let rib=false;for(let z=-4.8;z<5;z+=1.2)if(Math.abs(localZ-z)<.100001)rib=true;return (rib?2.756:2.616)-2.82;};
 const rows=[];
 for(let i=0;i<breaks.length-1;i++){
  const a=breaks[i],b=breaks[i+1],depth=depthAt((a+b)*.5);
  rows.push([a,depth],[b,depth]);
 }
 const positions=[],uv=[],indices=[];
 for(const [x,z] of rows){positions.push(x,-height/2,z,x,height/2,z);uv.push((x+half)/width,0,(x+half)/width,1);}
 for(let i=0;i<rows.length-1;i++){const k=i*2;indices.push(k,k+2,k+1,k+2,k+3,k+1);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const material=new THREE.MeshStandardMaterial({map:texture,color:0xffffff,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.13,transparent:true,opacity:0,roughness:.86,metalness:0,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const decal=new THREE.Mesh(geo,material);decal.name=`spray-paint-${site.id}`;decal.position.set(site.x,site.y,site.z);decal.rotation.y=site.rotation;decal.visible=false;decal.receiveShadow=true;decal.renderOrder=3;return decal;
}

export function makeSprayDust(seed){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');let state=seed;
 const rnd=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 for(let i=0;i<620;i++){
  const a=rnd()*Math.PI*2,r=Math.sqrt(rnd()),x=128+Math.cos(a)*r*102,y=128+Math.sin(a)*r*72;
  ctx.fillStyle=`rgba(223,28,115,${.02+(1-r)*.18})`;ctx.beginPath();ctx.arc(x,y,.5+rnd()*2.2,0,Math.PI*2);ctx.fill();
 }
 const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.02,.76),new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:1,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));mesh.rotation.x=-Math.PI/2;mesh.name='old-paint-dust-on-snow';return mesh;
}

// Smooth, close-mounted interior paint. The reverse face is deliberately culled.
export function makeInteriorDecal(site,texture){
 const material=new THREE.MeshStandardMaterial({map:texture,color:0xffffff,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.13,transparent:true,opacity:0,roughness:.90,metalness:0,depthWrite:false,side:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const decal=new THREE.Mesh(new THREE.PlaneGeometry(2.45,1.68),material);decal.name=`interior-spray-paint-${site.id}`;decal.position.set(site.x,site.y,site.z);decal.rotation.y=site.rotation;decal.visible=false;decal.receiveShadow=true;decal.renderOrder=3;decal.userData.interior=true;return decal;
}
