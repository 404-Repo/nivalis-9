import { applySurfacePilot } from './surfaces.js';
/* Material-value baking adapted from 404 game recipe's assetlib.js.
 * Apache-2.0; see THIRD_PARTY_NOTICES.txt. Works with bundled Three r140.
 * Static geometry only. Call keepHierarchy for articulated/moving parts.
 */
const assetCache = new Map();
export function materialKey(m) {
  // Map identity alone is not enough: encoding, UV transforms and scalar map
  // strength are also render state. Keep custom shader materials independent.
  const textures=['map','alphaMap','roughnessMap','metalnessMap','normalMap',
    'bumpMap','displacementMap','emissiveMap','aoMap','lightMap','envMap',
    'clearcoatMap','clearcoatRoughnessMap','clearcoatNormalMap','transmissionMap',
    'thicknessMap','specularIntensityMap','specularColorMap'];
  const tex=t=>t?[t.uuid,t.mapping,t.encoding,t.wrapS,t.wrapT,t.repeat?.toArray(),
    t.offset?.toArray(),t.center?.toArray(),t.rotation,t.matrix?.elements,
    t.flipY,t.premultiplyAlpha,t.minFilter,t.magFilter].join(','):'-';
  const scalars=['type','roughness','metalness','flatShading','transparent','opacity','side',
    'emissiveIntensity','vertexColors','normalMapType','bumpScale','displacementScale',
    'displacementBias','aoMapIntensity','lightMapIntensity','envMapIntensity','alphaTest',
    'depthTest','depthWrite','depthFunc','colorWrite','blending','blendSrc','blendDst',
    'blendEquation','premultipliedAlpha','polygonOffset','polygonOffsetFactor',
    'polygonOffsetUnits','dithering','fog','toneMapped','wireframe','clearcoat',
    'clearcoatRoughness','transmission','thickness','ior','reflectivity'];
  const vectors=['color','emissive','normalScale','clearcoatNormalScale','specularColor'];
  const custom=m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile?(m.userData.materialMergeKey||m.uuid):'standard';
  return JSON.stringify([scalars.map(k=>m[k]),vectors.map(k=>m[k]?.toArray()),
    textures.map(k=>tex(m[k])),m.defines||{},custom]);
}
function mergeGeometry(geometries) {
  const geos=geometries.map(g=>g.index?g.toNonIndexed():g);
  const names=Object.keys(geos[0].attributes).filter(k=>geos.every(g=>g.attributes[k]));
  const out=new THREE.BufferGeometry();
  for(const name of names){const size=geos[0].attributes[name].itemSize;const count=geos.reduce((n,g)=>n+g.attributes[name].count,0);
    const arr=new Float32Array(count*size);let offset=0;for(const g of geos){const a=g.attributes[name];arr.set(a.array,offset);offset+=a.array.length;}
    out.setAttribute(name,new THREE.BufferAttribute(arr,size));
  }
  out.computeBoundingSphere();return out;
}
export function bakeStatic(root) {
  root.updateMatrixWorld(true);const buckets=new Map(),extras=[];
  const instanceMatrix=new THREE.Matrix4();
  root.traverse(o=>{
    if(!o.isMesh){if(o.isLight||o.isSprite||o.isPoints)extras.push(o);return;}
    if(Array.isArray(o.material)){extras.push(o);return;}
    const sig=Object.keys(o.geometry.attributes).sort().join(',')+(o.isInstancedMesh&&o.instanceColor?',color':'');
    const key=materialKey(o.material)+'#'+sig;
    if(!buckets.has(key))buckets.set(key,{mat:o.material,geos:[],cast:false,receive:false});
    const b=buckets.get(key);b.cast ||= o.castShadow;b.receive ||=o.receiveShadow;
    if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,instanceMatrix);const geo=o.geometry.clone().applyMatrix4(instanceMatrix).applyMatrix4(o.matrixWorld);
      if(o.instanceColor){const color=new THREE.Color().fromArray(o.instanceColor.array,i*3);const n=geo.attributes.position.count;const a=new Float32Array(n*3);for(let k=0;k<n;k++)color.toArray(a,k*3);geo.setAttribute('color',new THREE.BufferAttribute(a,3));if(!b.mat.vertexColors){b.mat=b.mat.clone();b.mat.vertexColors=true;}}
      b.geos.push(geo);
    }}else b.geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  });
  const out=new THREE.Group();for(const b of buckets.values()){const geo=mergeGeometry(b.geos);const mesh=new THREE.Mesh(geo,b.mat);mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;out.add(mesh);b.geos.forEach(g=>g.dispose());}
  extras.forEach(o=>{const c=o.clone();o.matrixWorld.decompose(c.position,c.quaternion,c.scale);out.add(c);});return out;
}
export async function ASSET(name,{keepHierarchy=false}={}) {
  if(!assetCache.has(name))assetCache.set(name,(async()=>{
    const fn=window.__ASSET_REGISTRY__?.[name]||(await import(new URL(`./assets/${name}.js`,document.baseURI).href)).default;
    const g=fn(THREE);if(!g?.isGroup)throw new Error(`Asset ${name} did not return a Three.Group`);
    applySurfacePilot(g,name);return {tree:g,static:bakeStatic(g)};
  })());
  const item=await assetCache.get(name);return (keepHierarchy?item.tree:item.static).clone(true);
}
