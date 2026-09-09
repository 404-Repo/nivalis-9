/* Surface pilot, NIVALIS 9 v1.6. Original runtime texture recipes inspired by
 * the 404 surface-pass approach; no generated/downloaded images or Atlas calls.
 * Three r140: sRGB for colour, linear for normal/roughness. Asset generators
 * remain unchanged. Opt-in only: existing labels/decals/food are never touched.
 */
const surfaceCache=new Map();
const surfaceAllowlist=new Set(['cargo_module','barricade','gantry','ramp','service_crawler','station_rover','shale_ledge','ice_outcrop']);
const surfaceStats={assets:{},recipes:{},texturedMeshes:0,protectedMeshes:0,version:'1.6'};
const surfaceRecipes={
  coating:{seed:404,tile:2.25,rough:.91,normal:.16},
  metal:{seed:89,tile:1.1,rough:.9,normal:.13},
  rubber:{seed:714,tile:.72,rough:1,normal:.18},
  shale:{seed:211,tile:1.6,rough:1,normal:.55},
  ice:{seed:926,tile:1.4,rough:.91,normal:.24}
};
const surfClamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function surfaceHash(x,y,s){let h=Math.imul(x+Math.imul(y,374761393),668265263)^s;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function surfaceNoise(u,v,cells,seed){
  const x=u*cells,y=v*cells,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),at=(a,b)=>surfaceHash((a%cells+cells)%cells,(b%cells+cells)%cells,seed);
  const a=at(ix,iy)*(1-sx)+at(ix+1,iy)*sx,b=at(ix,iy+1)*(1-sx)+at(ix+1,iy+1)*sx;return a*(1-sy)+b*sy;
}
function surfaceMaps(recipe){
  if(surfaceCache.has(recipe))return surfaceCache.get(recipe);
  const r=surfaceRecipes[recipe],size=256,n=size*size,h=new Float32Array(n),a=new Uint8ClampedArray(n*4),rough=new Uint8ClampedArray(n*4),normal=new Uint8ClampedArray(n*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,i=y*size+x,k=i*4;
    const low=surfaceNoise(u,v,4,r.seed),med=surfaceNoise(u,v,16,r.seed+7),fine=surfaceHash(x,y,r.seed+11);
    let tone=.93,rv=.94,height=.5;
    if(recipe==='coating'){
      // Mostly intact powder coat, rare rubbed patches and thin abrasions.
      const rubbed=surfClamp((surfaceNoise(u,v,8,r.seed+31)-.64)*3.3);
      const abrasion=(fine>.998&&med>.5)? .025:0;
      const streak=surfaceNoise(u,0,48,r.seed+15)*surfaceNoise(0,v,4,r.seed+15);
      tone=.935+low*.035+med*.023-rubbed*.028-abrasion-streak*.025;
      height=.49+med*.018+fine*.008-rubbed*.012-abrasion*.08;
      rv=surfClamp(.955-rubbed*.035+low*.025);
    }else if(recipe==='metal'){
      const brush=surfaceHash(x,0,r.seed)*.055;
      tone=.84+low*.12+med*.06-brush;height=.45+brush+med*.1;rv=.75+low*.19+brush;
    }else if(recipe==='rubber'){
      const grain=surfaceNoise(u,v,64,r.seed);tone=.88+grain*.1;rv=.94+low*.06;height=.35+grain*.24+fine*.09;
    }else if(recipe==='shale'){
      const strata=.5+.5*Math.sin((v*24+surfaceNoise(u,v,4,r.seed)*.7)*Math.PI*2);
      tone=.79+low*.16+med*.13+strata*.055;height=.3+med*.24+low*.12+strata*.05+fine*.028;rv=.95+med*.05;
    }else if(recipe==='ice'){
      const cloudy=surfaceNoise(u,v,8,r.seed),hair=surfClamp((.035-Math.abs(Math.sin((u*7+v*4+med*.18)*Math.PI)))*15);
      tone=.88+cloudy*.11+hair*.04;rv=.70+cloudy*.23+hair*.07;height=.48+med*.035+hair*.025;
    }
    h[i]=height;a[k]=a[k+1]=a[k+2]=Math.round(surfClamp(tone)*255);a[k+3]=255;
    rough[k]=rough[k+1]=rough[k+2]=Math.round(surfClamp(rv)*255);rough[k+3]=255;
  }
  // Sparse thin physical scratches, not big mottled 'camouflage' patches.
  if(recipe==='coating'||recipe==='metal')for(let j=0;j<64;j++){
    const x0=Math.floor(surfaceHash(j,7,r.seed)*size),y0=Math.floor(surfaceHash(j,19,r.seed)*size),len=3+Math.floor(surfaceHash(j,27,r.seed)*9);
    for(let dx=0;dx<len;dx++){
      const x=(x0+dx)%size,y=(y0+Math.floor(dx*.14))%size,i=y*size+x,k=i*4,w=Math.sin(Math.PI*dx/len);
      const shade=Math.round(255*(.90-.08*w));a[k]=a[k+1]=a[k+2]=Math.min(a[k],shade);rough[k]=rough[k+1]=rough[k+2]=Math.round(239-w*22);h[i]-=.016*w;
    }
  }
  const at=(x,y)=>h[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const k=(y*size+x)*4,dx=(at(x+1,y)-at(x-1,y))*4,dy=(at(x,y+1)-at(x,y-1))*4,l=Math.hypot(dx,dy,1);
    normal[k]=Math.round((.5-dx/l*.5)*255);normal[k+1]=Math.round((.5-dy/l*.5)*255);normal[k+2]=Math.round((.5+.5/l)*255);normal[k+3]=255;
  }
  function tex(bytes,color=false){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);im.data.set(bytes);ctx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.name=`nivalis-${recipe}-${color?'albedo':'data'}`;t.encoding=color?THREE.sRGBEncoding:THREE.LinearEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.minFilter=THREE.LinearMipmapLinearFilter;return t;}
  const maps={map:tex(a,true),roughnessMap:tex(rough),normalMap:tex(normal),tile:r.tile};
  surfaceCache.set(recipe,maps);surfaceStats.recipes[recipe]={size,maps:3,tileMeters:r.tile};return maps;
}
function surfaceClassify(asset,m){
  if(!m?.isMeshStandardMaterial||m.map||m.normalMap||m.bumpMap||m.roughnessMap||m.transparent||m.emissive?.getHex()>0||m.vertexColors)return null;
  const color=m.color.clone().convertLinearToSRGB(),bright=Math.max(color.r,color.g,color.b),low=Math.min(color.r,color.g,color.b);
  if(bright>.82&&low>.75&&m.metalness<.05)return null; // existing snow caps
  if(asset==='shale_ledge')return 'shale';
  if(asset==='ice_outcrop')return m.roughness<.7?'ice':'shale';
  if(m.roughness<.35&&m.metalness>.2)return null; // cab glazing
  if((asset==='service_crawler'||asset==='station_rover')&&m.metalness<.15&&bright<.27)return 'rubber';
  if(m.metalness>=.7)return 'metal';
  if(m.metalness>.2)return 'coating';
  return null;
}
function surfaceShader(m,recipe){
  m.customProgramCacheKey=()=>`nivalis-surface-v1-${recipe}`;
  m.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 weatherData; varying vec2 vWeatherData;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWeatherData=weatherData;');
    const isCoated=recipe==='coating'||recipe==='metal';
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vWeatherData;');
    if(isCoated)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float footGrime=(1.-smoothstep(.12,.95,vWeatherData.x))*(.6+.4*sin(vUv.x*18.)*sin(vUv.y*7.));
      diffuseColor.rgb*=mix(vec3(1.),vec3(.64,.68,.70),footGrime*.42);
      float rimFrost=smoothstep(.62,.98,vWeatherData.y)*smoothstep(.45,1.2,vWeatherData.x);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.60,.70,.76),rimFrost*.06);
    `);
  };
}
export function applySurfacePilot(root,asset){
  if(!surfaceAllowlist.has(asset))return root;
  // Inspection-only switch used by the before/after capture tool; not a gameplay setting.
  if(window.__NIVALIS_SURFACE_PILOT__===false)return root;
  root.updateMatrixWorld(true);const cache=new Map();let count=0;
  const p3=new THREE.Vector3(),n3=new THREE.Vector3(),nm=new THREE.Matrix3();
  function mapped(mat){if(cache.has(mat))return cache.get(mat);const recipe=surfaceClassify(asset,mat);if(!recipe){cache.set(mat,mat);return mat;}
    const m=mat.clone(),maps=surfaceMaps(recipe);m.map=maps.map;m.roughnessMap=maps.roughnessMap;m.normalMap=maps.normalMap;m.normalScale.setScalar(surfaceRecipes[recipe].normal);
    m.name=`surface/${recipe}/${mat.name||mat.color.getHexString()}`;m.userData={...m.userData,surfaceRecipe:recipe,surfaceTile:maps.tile,materialMergeKey:`nivalis-surface-v1-${recipe}`};surfaceShader(m,recipe);cache.set(mat,m);return m;
  }
  root.traverse(o=>{if(!o.isMesh)return;
    const original=Array.isArray(o.material)?o.material:[o.material],next=original.map(mapped),active=next.filter(m=>m.userData.surfaceRecipe);
    if(!active.length){surfaceStats.protectedMeshes++;return;}
    // Per-triangle dominant-plane UVs: metres, not an entire wall squeezed into
    // 0..1. Reuse one material per recipe/colour, rather than one per part.
    const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),p=geo.attributes.position,norm=geo.attributes.normal;
    const uv=new Float32Array(p.count*2),weather=new Float32Array(p.count*2),tile=active[0].userData.surfaceTile;
    nm.getNormalMatrix(o.matrixWorld);
    for(let face=0;face<p.count;face+=3){
      n3.set(0,0,0);for(let j=0;j<3;j++)n3.add(new THREE.Vector3().fromBufferAttribute(norm,face+j));n3.applyMatrix3(nm).normalize();
      const ax=Math.abs(n3.x),ay=Math.abs(n3.y),az=Math.abs(n3.z),axis=ax>=ay&&ax>=az?0:ay>=az?1:2;
      for(let j=0;j<3;j++){const i=face+j;p3.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
        uv[i*2]=(axis===0?p3.z: p3.x)/tile;uv[i*2+1]=(axis===1?p3.z:p3.y)/tile;
        weather[i*2]=p3.y;weather[i*2+1]=n3.y;
      }
    }
    geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setAttribute('weatherData',new THREE.BufferAttribute(weather,2));o.geometry=geo;o.material=Array.isArray(o.material)?next:next[0];count++;
  });
  surfaceStats.assets[asset]=count;surfaceStats.texturedMeshes+=count;return root;
}
export function surfacePilotInfo(){return JSON.parse(JSON.stringify(surfaceStats));}
