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
 function finish(){g.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)box.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=box.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.z-=c.z;o.position.y-=box.min.y;}g.name='service_crawler';return g;}

 // Tracked maintenance vehicle. Side bogies, insulated cab, roof rack, plow.
 plate(3.1,.67,4.65,0,1.03,0,dark,.17);B(0,1.44,0,3.0,.2,4.66,steel);
 for(const x of [-1.53,1.53]){
  plate(.71,1.08,4.72,x,.58,-.04,rubber,.13);B(x,1.11,-.04,.82,.18,4.64,steel);
  for(const z of [-1.81,-.92,0,.92,1.8])wheel(x,.55,z,.46,.75);
  for(let z=-2.15;z<=2.16;z+=.25){B(x,.085,z,.79,.095,.13,black);B(x,1.027,z,.79,.085,.13,black);}
  for(const z of [-2.25,2.18])for(const y of [.27,.48,.69,.88])B(x,y,z,.79,.12,.08,steel);
  B(x,1.23,.1,.83,.065,4.43,snow);
 }
 // Cab at front: deeply inset windows framed by angled struts.
 plate(2.52,1.75,2.18,0,2.36,1.06,pale,.24);
 plate(2.16,.83,.065,0,2.59,2.184,glass,.13);B(0,2.62,2.231,.075,.99,.06,steel);
 for(const x of [-1.284,1.284]){B(x,2.62,1.16,.032,.84,1.45,glass);B(x*1.016,2.16,1.18,.065,.035,1.62,steel);B(x*1.016,1.92,.43,.08,.055,.24,bolt);B(x,1.57,1.03,.28,.12,1.3,black);}
 B(0,1.76,2.194,2.19,.22,.067,orange);B(0,1.98,2.213,1.7,.047,.031,steel);
 for(const x of [-1.0,1.0]){plate(.33,.16,.09,x,1.78,2.27,black,.028);B(x,1.79,2.32,.24,.075,.02,warm);}
 B(0,3.282,1.08,2.36,.06,1.96,snow);B(0,3.37,.45,1.76,.07,.2,steel);
 for(const x of [-.83,.83]){beam([x,3.35,.17],[x,3.35,1.6],.025,steel);B(x,3.24,.28,.04,.22,.04,steel);}
 C(.71,3.465,.46,.1,.1,.13,orange,10);
 // Utility bed: tool boxes, cylindrical spool and supporting rack.
 B(0,1.59,-1.25,2.52,.15,2.04,dark);plate(1.1,.62,.98,-.61,1.98,-1.32,pale,.08);plate(.94,.38,1.3,.66,1.91,-1.26,orange,.07);
 for(const x of [-1.19,1.19]){beam([x,1.55,-2.11],[x,2.33,-2.11],.046,steel);beam([x,1.55,-.49],[x,2.33,-.49],.046,steel);beam([x,2.33,-2.11],[x,2.33,-.49],.042,steel);}
 beam([-1.19,2.33,-2.11],[1.19,2.33,-2.11],.042,steel);B(-.6,2.31,-1.36,1.04,.04,.93,snow);
 // Heavy working blade, tow linkage and warning stripes.
 for(const x of [-.94,.94])beam([x,.83,1.9],[x,.5,2.8],.105,dark);
 const blade=plate(3.65,.8,.23,0,.61,2.93,steel,.16);blade.rotation.x=-.17;
 B(0,.22,2.88,3.7,.085,.16,black);B(0,1.03,2.96,3.44,.055,.19,snow);
 for(const x of [-1.46,-1.21,1.21,1.46])B(x,.65,3.06,.085,.43,.018,orange,.35);
 return finish();
}
