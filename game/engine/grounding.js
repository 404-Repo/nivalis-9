/* Authored contact detail for the surface pilot. Purely visual: no collision,
 * route, floor-height, pickup or save-system changes. All images drawn locally. */
import { bakeStatic } from './assets.js';
export function makeGrounding(scene,level){
  const g=new THREE.Group(),stats={driftStrips:0,contactPatches:0,compressedPatches:0,footprints:0};
  const color=h=>new THREE.Color(h).convertSRGBToLinear();
  function canvasTexture(kind){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
    if(kind==='foot'){
      c.fillStyle='rgba(255,255,255,.38)';c.beginPath();c.ellipse(64,51,25,39,0,0,Math.PI*2);c.fill();c.fillRect(46,87,36,20);
      c.globalCompositeOperation='destination-out';for(let y=23;y<84;y+=12)c.fillRect(40,y,49,4);c.fillRect(60,20,7,66);
    }else{
      const im=c.createImageData(128,128);
      for(let y=0;y<128;y++)for(let x=0;x<128;x++){
        const u=(x-64)/64,v=(y-64)/64,d=Math.pow(Math.abs(u),kind==='contact'?4:2)+Math.pow(Math.abs(v),kind==='contact'?4:2);
        const n=(Math.sin(x*.21+Math.sin(y*.17)*3)+Math.sin(y*.67+x*.22))*.5;
        const a=Math.pow(Math.max(0,1-d),kind==='contact'?1.4:2.2)*(.8+n*.08),k=(y*128+x)*4;
        im.data[k]=im.data[k+1]=im.data[k+2]=255;im.data[k+3]=Math.round(a*255);
      }c.putImageData(im,0,0);
    }
    const t=new THREE.CanvasTexture(canvas);t.anisotropy=4;return t;
  }
  const contactMat=new THREE.MeshBasicMaterial({map:canvasTexture('contact'),color:color(0x304d62),transparent:true,opacity:.25,depthWrite:false,depthTest:true});
  const compressedMat=new THREE.MeshStandardMaterial({map:canvasTexture('compressed'),color:color(0x98b3c3),transparent:true,opacity:.28,roughness:.77,metalness:0,depthWrite:false});
  const footMat=new THREE.MeshBasicMaterial({map:canvasTexture('foot'),color:color(0x7894a6),transparent:true,opacity:.50,depthWrite:false,depthTest:true});
  const snowMat=new THREE.MeshStandardMaterial({color:color(0xd7e5ee),roughness:.96,metalness:0});
  const snowTex=document.createElement('canvas');snowTex.width=snowTex.height=128;const c=snowTex.getContext('2d'),im=c.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4,v=127+Math.sin(x*.30+Math.sin(y*.09))*16+Math.sin(y*.69+x*.23)*7;im.data[k]=im.data[k+1]=im.data[k+2]=v;im.data[k+3]=255;}c.putImageData(im,0,0);
  snowMat.bumpMap=new THREE.CanvasTexture(snowTex);snowMat.bumpMap.wrapS=snowMat.bumpMap.wrapT=THREE.RepeatWrapping;snowMat.bumpScale=.015;
  const plane=new THREE.PlaneGeometry(1,1);
  function patch(x,z,w,d,rot,mat,y=.012){const p=new THREE.Mesh(plane,mat);p.rotation.set(-Math.PI/2,0,rot);p.position.set(x,y,z);p.scale.set(w,d,1);p.receiveShadow=true;g.add(p);return p;}
  function drift(x,z,length,width,angle,seed){
    const ps=[],uv=[],idx=[],cs=Math.cos(angle),sn=Math.sin(angle),n=40,rows=6;
    for(let j=0;j<=rows;j++)for(let i=0;i<=n;i++){
      const t=i/n,u=j/rows,along=(t-.5)*length,across=(u-.5)*width;
      const end=Math.pow(Math.sin(Math.PI*t),.42),ripple=.78+.13*Math.sin(t*21+seed)+.09*Math.sin(t*45+seed*.5);
      const h=.006+.12*end*Math.sin(Math.PI*u)*ripple;
      ps.push(x+across*cs+along*sn,h,z-across*sn+along*cs);uv.push(along/.9,across/.9);
      if(j<rows&&i<n){const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,snowMat);m.castShadow=m.receiveShadow=true;g.add(m);stats.driftStrips++;
  }
  // Side feet only: both mouths of every traversable container remain open.
  const containers=[[-12,24,Math.PI/2,1,1],[22,23,0,1,1.1],[-20,-1,0,1,1],[-20,-11,0,1,1]];
  containers.forEach(([x,z,a,sx,sz],i)=>{
    patch(x,z,6.6*sx,10.7*sz,a,contactMat);stats.contactPatches++;
    for(const side of [-1,1])drift(x+side*2.81*sx*Math.cos(a),z-side*2.81*sx*Math.sin(a),9.3*sz,.52,a,4+i*5+side);
  });
  for(const [x,z,w,d,a] of [[-32.2,26,4.8,6.7,.24],[31.7,-59,4.8,6.9,-.37]]){
    patch(x,z,w,d,a,contactMat);stats.contactPatches++;
    for(const side of [-1,1])drift(x+side*1.94*Math.cos(a),z-side*1.94*Math.sin(a),4.2,.48,a,13+side);
  }
  // Trodden snow beside doorways and maintenance bays, not a glowing route.
  for(const [x,z,w,d,a] of [[-18.4,24.1,2.1,3.4,Math.PI/2],[-5.8,24,2,3.1,Math.PI/2],[22,29.5,2.4,3.4,0],[-20,5.2,2.3,3.2,0],[-29.2,27.1,1.7,3.7,.24],[28.9,-58.2,1.7,3,-.37]]){patch(x,z,w,d,a,compressedMat,.015);stats.compressedPatches++;}
  const paths=[[-18.8,24,1,0],[-20,7,0,-1],[-28.6,29,-.35,-.93],[27.7,-57,.48,-.88]];
  for(const [x,z,dx,dz] of paths)for(let i=0;i<7;i++){
    const side=i%2?1:-1,xx=x+dx*i*.53-dz*side*.15,zz=z+dz*i*.53+dx*side*.15;
    patch(xx,zz,.24,.37,Math.atan2(dx,dz)+side*.075,footMat,.018);stats.footprints++;
  }
  const built=bakeStatic(g);built.name='Surface pilot / snow and contact detail';scene.add(built);return {group:built,stats};
}
