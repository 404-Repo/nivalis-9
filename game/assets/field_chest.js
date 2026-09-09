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
 function finish(){g.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)box.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=box.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.z-=c.z;o.position.y-=box.min.y;}g.name='field_chest';return g;}

 // Genuine open cavity, independent animated lid, feet and mechanical latches.
 B(0,.12,0,1.48,.14,.84,black);B(0,.205,0,1.32,.06,.7,dark);
 for(const x of [-.67,.67])B(x,.415,0,.12,.47,.82,dark);
 for(const z of [-.365,.365])B(0,.415,z,1.34,.47,.11,dark);
 B(0,.255,0,1.23,.04,.6,black);
 for(const x of [-.63,.63])for(const z of [-.34,.34]){B(x,.09,z,.2,.18,.17,black);B(x,.46,z,.14,.48,.14,steel);}
 for(const x of [-.42,.42]){B(x,.45,.433,.135,.22,.07,steel);B(x,.45,.478,.06,.08,.035,bolt);}
 for(const x of [-.758,.758]){B(x,.43,0,.032,.17,.3,black);beam([x*1.02,.49,-.13],[x*1.02,.49,.13],.025,steel);}
 B(0,.48,.427,.36,.06,.05,black);B(0,.495,.457,.23,.028,.025,bolt);
 const lid=new THREE.Group();lid.name='lid';lid.position.set(0,.665,-.415);g.add(lid);parent=lid;
 plate(1.55,.135,.9,0,.035,.415,steel,.045);B(0,.113,.415,1.38,.035,.73,dark);
 for(const x of [-.61,.61])B(x,.135,.415,.085,.035,.69,bolt);
 B(.26,.129,.49,.31,.018,.27,orange);B(-.29,.128,.28,.25,.018,.13,pale);
 // Lid lining visible once opened.
 B(0,-.04,.415,1.3,.018,.68,black);for(const x of [-.4,0,.4])B(x,-.055,.415,.055,.023,.56,dark);
 parent=g;for(const x of [-.48,.48]){const h=C(x,.663,-.423,.046,.046,.18,bolt,10);h.rotation.z=Math.PI/2;}
 return finish();
}
