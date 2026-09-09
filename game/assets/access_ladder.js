// NIVALIS 9 v1.8 — pad access ladder. Original code-built industrial geometry.
// Metres, Y up, grounded and centered X/Z. Open between the individual rungs.
export default function generate(THREE){
  const g=new THREE.Group();g.name='South pad access ladder';
  const material=(name,color,metalness=.6,roughness=.67)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness});m.color.convertSRGBToLinear();m.name=name;return m;};
  const rail=material('brushed ladder steel',0x9aabb2,.75,.48),dark=material('anti-slip rung tread',0x283640,.4,.84),orange=material('worn ladder safety paint',0xd56b36,.25,.78),bolts=material('ladder fastener',0x536977,.8,.43);
  const mesh=(geometry,mat,x,y,z)=>{const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
  const box=(x,y,z,w,h,d,m=rail)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const link=(a,b,r,m=rail)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);const o=mesh(new THREE.CylinderGeometry(r,r,d.length(),10),m,...p.add(q).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
  for(const x of [-.52,.52]){
    box(x,.02,0,.18,.04,.62,dark);
    box(x,2.71,0,.075,5.34,.08);
    link([x,5.18,0],[x,6.07,0],.039);
    link([x,6.07,0],[x,6.12,-.12],.039);
    link([x,6.12,-.12],[x,5.93,-.24],.039);
    for(const y of [.40,2.38,4.70]){
      box(x,y,-.145,.11,.085,.27,bolts);
      box(x,y,-.284,.20,.26,.044,dark);
      for(const yy of [-.082,.082]){const s=mesh(new THREE.CylinderGeometry(.023,.023,.02,6),bolts,x,y+yy,-.255);s.rotation.x=Math.PI/2;}
    }
    for(const y of [1.1,3.45,5.45])box(x,y,.043,.079,.23,.008,orange);
    for(const z of [-.23,.23])mesh(new THREE.CylinderGeometry(.022,.022,.025,6),bolts,x,.052,z);
  }
  let i=0;
  for(let y=.30;y<5.12;y+=.29,i++){
    link([-.51,y,0],[.51,y,0],.021,dark);
    for(let x=-.40;x<=.40;x+=.08)box(x,y+.020,0,.022,.006,.039,rail);
    for(const x of [-.475,.475])box(x,y,.002,.048,.055,.058,bolts);
    if(i%4===0)box(0,y+.025,0,.26,.009,.04,orange);
  }
  // A mounting plate supports the ACCESS label, between—not covering—the rails.
  box(0,2.22,.016,.41,.18,.06,dark);
  g.userData={deckY:5.04,climbSpeed:1.75};return g;
}
