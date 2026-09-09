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
 function finish(){g.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)box.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=box.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.z-=c.z;o.position.y-=box.min.y;}g.name='station_rover';return g;}

 // Six-wheel cold-weather station rover. Three visible axles, separate roof load.
 plate(2.64,.82,5.53,0,1.08,0,dark,.17);B(0,1.57,0,2.66,.16,5.25,pale);
 for(const z of [-1.87,0,1.87]){const axle=C(0,.66,z,.15,.15,3.2,steel,10);axle.rotation.z=Math.PI/2;for(const x of [-1.52,1.52]){
 wheel(x,.67,z,.67,.51);for(let a=0;a<Math.PI*2;a+=Math.PI/9){const t=B(x,.67+Math.sin(a)*.644,z+Math.cos(a)*.644,.56,.09,.13,black);t.rotation.x=a;}
 B(x,1.37,z,.68,.11,1.31,steel);B(x,1.439,z,.68,.029,1.19,snow);
 }}
 plate(2.55,1.46,2.26,0,2.25,1.49,pale,.22);plate(2.15,.73,.05,0,2.5,2.637,glass,.13);B(0,2.49,2.675,.06,.81,.045,steel);
 for(const x of [-1.292,1.292]){B(x,2.48,1.54,.035,.79,1.68,glass);B(x*1.018,2.025,1.48,.06,.025,.23,bolt);B(x,1.76,1.18,.05,.12,1.55,orange);B(x*1.06,1.12,1.28,.28,.09,1.27,black);}
 plate(2.53,1.11,2.53,0,2.08,-1.1,steel,.12);B(0,2.66,-1.1,2.42,.075,2.37,snow);
 for(const x of [-1.3,1.3]){B(x,2.04,-1.12,.035,.69,1.96,dark);for(let z=-1.85;z<-.45;z+=.23)B(x*1.008,2.01,z,.047,.42,.047,black);}
 B(0,1.73,-2.46,2.23,.19,.15,orange);B(0,.98,-2.87,2.7,.21,.2,steel);
 B(0,1.1,2.86,2.84,.25,.27,black);B(0,1.89,2.648,1.2,.23,.09,dark);for(let x=-.48;x<.5;x+=.16)B(x,1.88,2.704,.052,.19,.021,steel);
 for(const x of [-1,1]){plate(.36,.22,.11,x,1.88,2.67,black,.036);B(x,1.88,2.732,.28,.115,.024,warm);}
 B(0,3.002,1.48,2.34,.04,2.03,snow);
 for(const x of [-.98,.98])beam([x,3.13,.58],[x,3.13,2.2],.032,steel);for(const z of [.65,2.12]){beam([-1,3.13,z],[1,3.13,z],.032,steel);for(const x of [-.98,.98])B(x,3.08,z,.045,.16,.045,steel);}
 plate(1.18,.23,.78,-.03,3.18,1.31,dark,.04);B(-.05,3.316,1.31,1.09,.035,.72,snow);
 beam([1.01,2.76,-1.84],[1.01,3.59,-1.91],.015,black);
 return finish();
}
