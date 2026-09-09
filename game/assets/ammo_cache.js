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
 function finish(){g.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3();g.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)box.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});const c=box.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.z-=c.z;o.position.y-=box.min.y;}g.name='ammo_cache';return g;}

 // Sealed transport cases, not additional weapon pickups.
 for(const x of [-.62,.62])B(x,.055,0,.17,.11,1.03,dark);
 for(let z=-.43;z<=.45;z+=.21)B(0,.128,z,1.58,.09,.16,steel);
 function crate(x,y,z,w,d,rot){const a=new THREE.Group();a.position.set(x,y,z);a.rotation.y=rot;g.add(a);parent=a;
 plate(w,.3,d,0,.15,0,dark,.035);B(0,.315,0,w+.035,.047,d+.035,steel);
 for(const xx of [-w*.36,w*.36]){B(xx,.175,d/2+.015,.065,.19,.04,bolt);B(xx,.345,0,.072,.025,d-.03,black);}
 B(0,.205,d/2+.022,.32,.092,.01,paper);for(const xx of [-.075,0,.075])B(xx,.205,d/2+.029,.023,.045,.005,black);
 for(const xx of [-w/2,w/2])B(xx,.15,0,.026,.07,.2,black);parent=g;}
 crate(-.35,.18,-.16,.67,.82,0);crate(.35,.18,-.16,.64,.82,0);crate(.11,.54,-.14,1.1,.6,-.11);
 B(.16,.875,-.16,.8,.027,.42,snow);
 return finish();
}
