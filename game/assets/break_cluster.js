// NIVALIS 9 / Human Traces. Original code-authored geometry, not Atlas output.
// Meter scale. Y up. Front +Z. No imports, external textures or credentials.
export default function generate(THREE) {
 const g=new THREE.Group();let parent=g;
 const mat=(hex,metal=.5,rough=.72,emission=0)=>{const m=new THREE.MeshStandardMaterial({color:hex,metalness:metal,roughness:rough});m.color.convertSRGBToLinear();if(emission){m.emissive.set(hex).convertSRGBToLinear();m.emissiveIntensity=emission;}return m;};
 const steel=mat(0x627580),dark=mat(0x283640),black=mat(0x142129,.12),pale=mat(0xbdc8c8,.35),orange=mat(0xb5673d,.32),snow=mat(0xe1eaf0,0,.98),bolt=mat(0x81969e,.8),glass=mat(0x172e39,.4,.27),rubber=mat(0x1a262c,0,.97),card=mat(0x8f806d,0,.98),paper=mat(0xc5c0ae,0,.98),warm=mat(0xffc894,.1,.45,.6);
 function M(geo,m,x=0,y=0,z=0){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function B(x,y,z,w,h,d,m=steel,rz=0){const o=M(new THREE.BoxGeometry(w,h,d),m,x,y,z);o.rotation.z=rz;return o;}
 function C(x,y,z,r1,r2,h,m=steel,n=14){return M(new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);}
 function T(x,y,z,r,t,m=steel){return M(new THREE.TorusGeometry(r,t,6,24),m,x,y,z);}
 function beam(a,b,r,m=steel){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),o=M(new THREE.CylinderGeometry(r,r,d.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 function plate(w,h,d,x,y,z,m=steel,c=.08){const s=new THREE.Shape(),p=[[-w/2+c,-h/2],[w/2-c,-h/2],[w/2,-h/2+c],[w/2,h/2-c],[w/2-c,h/2],[-w/2+c,h/2],[-w/2,h/2-c],[-w/2,-h/2+c]];s.moveTo(...p[0]);p.slice(1).forEach(v=>s.lineTo(...v));s.closePath();return M(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,steps:1}),m,x,y,z-d/2);}
 function wheel(x,y,z,r,width){const w=C(x,y,z,r,r,width,rubber,20);w.rotation.z=Math.PI/2;const h=C(x+Math.sign(x)*(width/2+.008),y,z,r*.56,r*.56,.045,steel,12);h.rotation.z=Math.PI/2;const hub=C(x+Math.sign(x)*(width/2+.035),y,z,r*.21,r*.21,.075,bolt,10);hub.rotation.z=Math.PI/2;return w;}
 function finish(){g.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)box.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=box.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.z-=c.z;o.position.y-=box.min.y;}g.name='break_cluster';return g;}

 // Ration waste and an open carton, authored as one non-colliding scatter cluster.
 const carton=new THREE.Group();carton.position.set(.13,0,-.12);carton.rotation.y=.22;g.add(carton);parent=carton;
 B(0,.02,0,.62,.04,.45,card);for(const x of [-.303,.303])B(x,.19,0,.015,.34,.45,card);for(const z of [-.219,.219])B(0,.19,z,.6,.34,.015,card);
 const f1=B(0,.363,.282,.6,.015,.18,card);f1.rotation.x=.35;const f2=B(0,.383,-.283,.6,.015,.2,card);f2.rotation.x=-.58;
 const f3=B(-.354,.386,0,.18,.015,.42,card);f3.rotation.z=-.55;B(.307,.18,0,.006,.11,.14,paper);B(.307,.18,.011,.008,.055,.025,black);
 parent=g;
 function can(x,z,tilt,color){const a=new THREE.Group();a.position.set(x,.03,z);a.rotation.z=tilt;g.add(a);parent=a;const tint=mat(color,.42,.61);
 C(0,.105,0,.047,.05,.18,tint,14);C(0,.205,0,.047,.047,.012,bolt,14);C(0,.014,0,.048,.047,.015,steel,14);C(0,.213,0,.035,.035,.006,dark,14);B(.005,.219,0,.021,.004,.011,bolt);
 B(0,.12,.049,.043,.061,.003,paper);B(0,.12,.052,.016,.016,.002,dark);parent=g;}
 can(-.43,.23,-.18,0xab623f);can(.59,.25,-1.37,0x617b83);
 const w1=B(-.23,.029,.44,.29,.016,.15,paper);w1.rotation.y=.35;const w2=B(-.15,.056,.43,.15,.008,.13,orange);w2.rotation.z=.33;
 const w3=B(.41,.024,-.45,.17,.012,.12,paper);w3.rotation.set(.08,-.3,.03);
 return finish();
}
