const envColor=h=>new THREE.Color(h).convertSRGBToLinear();
function seedRandom(seed=1109){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function valueNoise(x,z){const hash=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};let a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b),hash(a+1,b),u),THREE.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v);}
function fbm(x,z){return valueNoise(x,z)*.57+valueNoise(x*2.03,z*2.03)*.26+valueNoise(x*4.11,z*4.11)*.12+valueNoise(x*8.27,z*8.27)*.05;}
function proceduralTexture(kind){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),im=x.createImageData(256,256),r=seedRandom(83);for(let j=0;j<256;j++)for(let i=0;i<256;i++){let n;if(kind==='snow')n=211+Math.sin(i*.15+Math.sin(j*.037)*4)*8+Math.sin(i*.033+j*.074)*8+r()*22;else n=75+r()*17+Math.sin(j*1.2)*7;const k=(j*256+i)*4;im.data[k]=im.data[k+1]=im.data[k+2]=n;im.data[k+3]=255;}x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='snow'?75:8,kind==='snow'?75:8);t.anisotropy=4;return t;}
export function makeEnvironment(scene,renderer){
  const random=seedRandom(809),snowTexture=proceduralTexture('snow');
  const snowMat=new THREE.MeshStandardMaterial({color:0xdde8ed,roughness:.96,bumpMap:snowTexture,bumpScale:.10});snowMat.color.convertSRGBToLinear();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),snowMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.position.y=-.025;scene.add(ground);
  // A continuous, fractal, glacier-carved landscape; the playable valley remains level.
  const geo=new THREE.PlaneGeometry(560,560,180,180);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;
  const peaks=[[-94,-67,72,42],[-152,-130,135,57],[-25,-182,140,55],[93,-137,115,52],[125,-29,88,38],[177,94,122,53],[-143,87,93,49],[-193,-34,104,60],[24,168,91,55],[200,-183,155,59],[-100,-240,142,55],[75,-245,155,62]];
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);let h=0;for(const [px,pz,ph,s]of peaks){const dx=(x-px)/s,dz=(z-pz)/s;h=Math.max(h,Math.max(0,1-Math.sqrt(dx*dx+dz*dz)/1.5)*ph);}
    const valley=Math.max(Math.abs(x)-36,Math.abs(z+15)-80,0);const blend=THREE.MathUtils.smoothstep(valley,0,44);const ridges=1-Math.abs(fbm(x*.045,z*.045)*2-1);h=(h*(.55+.6*ridges)+fbm(x*.13,z*.13)*13)*blend;pos.setY(i,h-1.2);}
  geo.computeVertexNormals();const normals=geo.attributes.normal,colors=new Float32Array(pos.count*3);
  const snowC=envColor(0xd6e2e8),rockC=envColor(0x3e505e),iceC=envColor(0x8eaaba),c=new THREE.Color();
  for(let i=0;i<pos.count;i++){const slope=normals.getY(i),n=fbm(pos.getX(i)*.075,pos.getZ(i)*.075),exposure=THREE.MathUtils.smoothstep(slope+n*.20,.64,1.0);c.copy(rockC).lerp(snowC,exposure);c.lerp(iceC,(1-exposure)*.17);c.multiplyScalar(.9+n*.2);c.toArray(colors,i*3);}
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));const terrain=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,flatShading:false}));terrain.receiveShadow=true;scene.add(terrain);
  // Valley fog thins with altitude. Keep mountain faces above the bank readable
  // instead of flattening every distant peak into a single opaque silhouette.
  terrain.material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <fog_pars_vertex>','#include <fog_pars_vertex>\nvarying float vValleyHeight;')
      .replace('#include <fog_vertex>','#include <fog_vertex>\nvValleyHeight=(modelMatrix*vec4(transformed,1.)).y;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <fog_pars_fragment>','#include <fog_pars_fragment>\nvarying float vValleyHeight;')
      .replace('#include <fog_fragment>',`#ifdef USE_FOG
        float valleyDepth=vFogDepth*mix(1.,.34,smoothstep(3.,70.,vValleyHeight));
        float valleyFog=1.-exp(-fogDensity*fogDensity*valleyDepth*valleyDepth);
        gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,valleyFog);
      #endif`);
  };
  terrain.material.customProgramCacheKey=()=> 'nivalis9-valley-fog-v1';
  // Procedural sky, not an image backdrop. Anisotropic cloud bands and horizon haze.
  const sky=new THREE.Mesh(new THREE.SphereGeometry(470,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{skyTime:{value:0},fogTint:{value:new THREE.Color(0x6c879b)},sunDir:{value:new THREE.Vector3(-.6,.46,.33).normalize()}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
    varying vec3 vDirection;uniform vec3 sunDir;uniform vec3 fogTint;uniform float skyTime;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec3 col=mix(vec3(.26,.38,.47),vec3(.035,.08,.16),pow(h,.52));float sun=max(dot(d,sunDir),0.);col+=vec3(.12,.23,.3)*pow(sun,12.)*.25+vec3(.5,.68,.8)*pow(sun,950.)*.35;vec2 uv=d.xz/(abs(d.y)+.2)+vec2(skyTime*.003,skyTime*.001);float cloud=noise(uv*vec2(1.1,3.))+noise(uv*vec2(2.3,6.))*.35;float band=smoothstep(.65,1.05,cloud)*smoothstep(.04,.18,h)*(1.-smoothstep(.55,.95,h));col=mix(col,vec3(.25,.34,.42),band*.35);float curtain=pow(max(0.,1.-abs(h-(.28+.055*sin(d.x*9.+skyTime*.025)))),60.)*pow(max(0.,-d.z),3.);col+=vec3(.015,.075,.06)*curtain;col=mix(fogTint,col,smoothstep(0.,.28,h));gl_FragColor=vec4(col,1.);}` }));scene.add(sky);
  // Distance extinction is visible across the playable yard, not just the peaks.
  // At 25 m, Atmospheric blends ~22% fog (v1.1 blended only ~5%).
  const fogProfiles={light:{density:.013,mist:.55},atmospheric:{density:.020,mist:1},dense:{density:.027,mist:1.25}};
  let fogStyle='atmospheric',fogTime=0;
  scene.fog=new THREE.FogExp2(0x6c879b,fogProfiles[fogStyle].density);scene.background=new THREE.Color(0x6c879b);
  const hemi=new THREE.HemisphereLight(0xb6d6f0,0x293e51,.42);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xb5cde8,.52);sun.position.set(-58,83,27);sun.target.position.set(0,0,-18);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=68;sun.shadow.camera.bottom=-68;sun.shadow.camera.near=1;sun.shadow.camera.far=230;sun.shadow.bias=-.00035;sun.shadow.normalBias=.04;sun.shadow.radius=2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  // Tire ruts, one material, small strips; all authored at ground level.
  const tracks=new THREE.Group();const trackMat=new THREE.MeshStandardMaterial({color:envColor(0xa1b6c2),roughness:.97,transparent:true,opacity:.42,depthWrite:false});
  for(const x of [-2.3,2.3])for(let z=-69;z<41;z+=.7){const m=new THREE.Mesh(new THREE.PlaneGeometry(.36,.41),trackMat);m.rotation.set(-Math.PI/2,0,.08);m.position.set(x+.45*Math.sin(z*.045),.007,z);tracks.add(m);}scene.add(tracks);
  // Snowflakes are circular point sprites; a finite player-centered volume, not streaked rain.
  const count=1400,arr=new Float32Array(count*3),speeds=new Float32Array(count);for(let i=0;i<count;i++){arr[i*3]=(random()-.5)*100;arr[i*3+1]=random()*32;arr[i*3+2]=(random()-.5)*100;speeds[i]=.55+random()*1.1;}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(arr,3));
  const sm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{size:{value:30}},vertexShader:'uniform float size;varying float alpha;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size/-p.z,1.,3.2);alpha=clamp((-p.z-1.)/8.,0.,1.);gl_Position=projectionMatrix*p;}',fragmentShader:'varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.94,.98,1.,(1.-smoothstep(.08,.5,d))*.62*alpha);}'});
  const snow=new THREE.Points(sg,sm);snow.frustumCulled=false;scene.add(snow);
  // Soft, noise-shaped wisps placed in the actual routes. The old radial
  // sprites multiplied a .48 texture alpha by .25 opacity and were almost invisible.
  // These remain depth-tested world objects, never a full-screen veil over the HUD.
  const mistCanvas=document.createElement('canvas');mistCanvas.width=256;mistCanvas.height=128;
  const mistContext=mistCanvas.getContext('2d'),mistPixels=mistContext.createImageData(256,128);
  for(let y=0;y<128;y++)for(let x=0;x<256;x++){
    const u=x/255*2-1,v=y/127*2-1;
    const fringe=THREE.MathUtils.smoothstep(1-Math.sqrt(u*u+v*v),0,.7);
    const noise=fbm(x*.027+31,y*.048+71);
    const ribbons=.75+.25*Math.sin(v*8+noise*7+u*3);
    const k=(y*256+x)*4;
    mistPixels.data[k]=mistPixels.data[k+1]=mistPixels.data[k+2]=255;
    mistPixels.data[k+3]=Math.round(255*fringe*(.34+noise*.66)*ribbons);
  }
  mistContext.putImageData(mistPixels,0,0);
  const mistTex=new THREE.CanvasTexture(mistCanvas),mist=[];
  const banks=[
    [-9,27,1.05,25,3.2],[8,23,1.25,24,3.6],[-22,32,.85,24,2.7],[24,29,1.2,22,3.4],
    [-7,12,1.1,26,3.2],[9,5,1.35,24,3.8],[-30,14,1,21,3],[32,11,1.1,21,3.2],
    [-3,-9,1.1,27,3.1],[11,-16,1.25,25,3.5],[-32,-6,1.4,20,3.9],[33,-7,1,21,3],
    [-11,-26,1.2,24,3.5],[6,-29,1.1,26,3.2],[29,-27,1.35,21,3.8],[-32,-28,1,22,3.1],
    [-10,-43,1.15,25,3.4],[12,-41,1.35,26,3.9],[-30,-46,1.05,23,3.1],[32,-43,1.2,23,3.4],
    [-10,-60,1.1,26,3.2],[10,-62,1.4,25,3.9],[-31,-65,1.2,22,3.4],[31,-63,1.1,23,3.2],
    [-12,38,.65,28,2],[13,36,.75,24,2.3],[-5,-1,.75,26,2.2],[5,-50,.8,25,2.4]
  ];
  for(const [x,z,y,w,h] of banks){
    const m=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:envColor(0xb7cbd9),transparent:true,depthWrite:false,depthTest:true,opacity:.48,fog:true}));
    m.scale.set(w,h,1);m.position.set(x,y,z);
    m.userData={baseX:x,baseY:y,baseZ:z,phase:random()*Math.PI*2,width:w,height:h};
    scene.add(m);mist.push(m);
  }
  function updateFog(time){
    const profile=fogProfiles[fogStyle];
    scene.fog.density=profile.density*(1+Math.sin(time*.055)*.035);
    for(const m of mist){
      const d=m.userData,wind=Math.sin(time*.06+d.phase);
      m.position.set(d.baseX+wind*4.8,d.baseY+Math.sin(time*.19+d.phase)*.12,d.baseZ+Math.sin(time*.043+d.phase)*1.6);
      // Keep the enclosed service tunnel clear; exterior mist can be seen through its doors.
      const dx=(m.position.x-(-20))/4.8,dz=(m.position.z-(-6))/12;
      const shelter=1-Math.exp(-(dx*dx+dz*dz)*2)*.9;
      m.material.opacity=(.44+Math.sin(time*.16+d.phase)*.075)*profile.mist*shelter;
    }
  }
  updateFog(0);
  return {
    sun,tracks,mist,fog:scene.fog,fogProfiles,
    get fogStyle(){return fogStyle;},
    setFog(style){fogStyle=Object.prototype.hasOwnProperty.call(fogProfiles,style)?style:'atmospheric';updateFog(fogTime);},
    setQuality(q){sg.setDrawRange(0,q==='low'?550:count);},
    update(dt,player,time){
      fogTime=time;sky.material.uniforms.skyTime.value=time;updateFog(time);
      snow.position.set(player.x,0,player.z);
      for(let i=0;i<count;i++){
        arr[i*3]+=dt*(1.1+.4*Math.sin(time*.23));arr[i*3+1]-=dt*speeds[i];
        if(arr[i*3+1]<0)arr[i*3+1]=32;if(arr[i*3]>50)arr[i*3]=-50;
      }
      sg.attributes.position.needsUpdate=true;
    }
  };
}
export function makeSign(text,{width=2.4,height=.75,bg='#26363f',color='#e3ece9',sub='',orange=false}={}){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.round(768*height/width);const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=orange?'#da804c':'#77ccd4';c.fillRect(0,0,9,canvas.height);c.fillStyle=color;c.font=`700 ${sub?canvas.height*.43:canvas.height*.55}px Arial, sans-serif`;c.textAlign='left';c.textBaseline='middle';c.fillText(text,30,sub?canvas.height*.4:canvas.height*.51,canvas.width-50);if(sub){c.fillStyle='#a9b9be';c.font=`${canvas.height*.17}px monospace`;c.fillText(sub,32,canvas.height*.79,canvas.width-50);}const t=new THREE.CanvasTexture(canvas);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;
  return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:t,roughness:.8,metalness:.15}));
}
