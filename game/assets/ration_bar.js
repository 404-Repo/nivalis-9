// NIVALIS 9 / Cold Reserve, v1.5.1. Original code-authored asset; no Atlas output.
// Meter scale, Y up, centered X/Z, grounded at Y=0. No imports or texture loads.
// The game adds original canvas-drawn print to the named wrapper-print surface.
export default function generate(THREE) {
  const group=new THREE.Group();group.name='ration_bar';
  const material=(color,roughness=.55,metalness=0)=>{
    const m=new THREE.MeshStandardMaterial({color,roughness,metalness});
    m.color.convertSRGBToLinear();return m;
  };
  const cocoa=material(0x623d29,.43),cocoaAlt=material(0x5c3624,.46);
  const baseCocoa=material(0x4b2c1c,.52),emboss=material(0x6b432d,.46);
  const sleeve=material(0x984b34,.83),paperEdge=material(0xbd9770,.94);
  const silver=material(0xc8cecf,.41,.56),silverInside=material(0xdce0dc,.48,.39);
  silver.side=silverInside.side=THREE.DoubleSide;
  function mesh(geometry,mat,x=0,y=0,z=0,name=''){
    const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.name=name;
    m.castShadow=m.receiveShadow=true;group.add(m);return m;
  }
  function box(w,h,d,x,y,z,mat,name=''){
    return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,name);
  }
  // Rounded corners AND shallow beveled edges, with an actual flat chocolate top.
  // The extrusion's local depth becomes world Y; the resulting bottom is y.
  function rounded(w,d,h,r,b,x,y,z,mat,name=''){
    const hw=w/2-b,hd=d/2-b,rr=Math.max(.0003,r-b),s=new THREE.Shape();
    s.moveTo(-hw+rr,-hd);s.lineTo(hw-rr,-hd);s.quadraticCurveTo(hw,-hd,hw,-hd+rr);
    s.lineTo(hw,hd-rr);s.quadraticCurveTo(hw,hd,hw-rr,hd);
    s.lineTo(-hw+rr,hd);s.quadraticCurveTo(-hw,hd,-hw,hd-rr);
    s.lineTo(-hw,-hd+rr);s.quadraticCurveTo(-hw,-hd,-hw+rr,-hd);s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth:h-2*b,steps:1,curveSegments:3,
      bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2});
    geo.translate(0,0,b);geo.rotateX(-Math.PI/2);
    return mesh(geo,mat,x,y,z,name);
  }
  // Triangulated foil with true creases. No normal-map or per-frame allocations.
  function sheet(rows,mat,name){
    const p=[],uv=[],idx=[],cols=rows[0].length;
    rows.forEach((row,j)=>row.forEach((v,i)=>{p.push(...v);uv.push(i/(cols-1),j/(rows.length-1));}));
    for(let j=0;j<rows.length-1;j++)for(let i=0;i<cols-1;i++){
      const a=j*cols+i,b=a+1,c=a+cols,d=c+1;idx.push(a,c,b,b,c,d);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);
    // Independent triangle normals make restrained, light-catching foil facets.
    const flat=geo.toNonIndexed();geo.dispose();flat.computeVertexNormals();
    return mesh(flat,mat,0,0,0,name);
  }
  // Silver lining beneath the whole bar; folds extend visibly beyond the cocoa.
  box(.325,.0025,.133,-.002,.008,0,silverInside,'foil-lining');
  rounded(.281,.115,.009,.004,.0015,.016,.010,0,baseCocoa,'chocolate-base');
  const xs=[-.093,-.039,.015,.069,.123];
  for(let col=0;col<xs.length;col++)for(let row=0;row<2;row++){
    const x=xs[col],z=(row?1:-1)*.028;
    rounded(.050,.051,.020,.004,.0025,x,.018,z,(col+row)%3===0?cocoaAlt:cocoa,`chocolate-segment-${col}-${row}`);
    // Shallow molded lozenge, not a painted or metallic detail.
    for(const [dx,dz,angle] of [[-.004,0,-.66],[.004,0,.66]]){
      const mark=rounded(.0013,.013,.0006,.0006,.00012,x+dx,.038,z,emboss,'cocoa-mould-mark');mark.rotation.y=angle;
    }
  }
  // Uneven foil margins are peeled down either side of the exposed chocolate.
  for(const side of [-1,1]){
    const rows=[];
    for(let j=0;j<4;j++){
      const row=[];
      for(let i=0;i<=14;i++){
        const x=-.027+i*.014,crease=Math.sin(i*2.71+side*.8);
        const z=side*([.056,.065,.075,.083][j]+(j===3?.0035*crease:0));
        const y=[.012,.021,.010,.006][j]+(j?(.0025+Math.abs(crease)*.003)*(i%2?1:-.5):0);
        row.push([x,y,z]);
      }rows.push(row);
    }
    sheet(rows,silver,'peeled-side-foil');
  }
  // Crumpled open end, with a small lifted corner rather than a solid box cap.
  const endRows=[];
  for(let j=0;j<4;j++){
    const row=[];for(let i=0;i<=10;i++){
      const z=-.077+i*.0154,wave=Math.sin(i*2.31);
      row.push([.156+j*.007+(j===3?.002*wave:0),.013+(j===1?.010:0)+.003*wave+(i<2&&j>1?.012:0),z]);
    }endRows.push(row);
  }
  sheet(endRows,silverInside,'open-foil-end');
  // The sealed half has real folded paper sides and a flattened end crimp.
  rounded(.160,.144,.006,.004,.001,-.106,.001,0,sleeve,'wrapper-bottom');
  for(const side of [-1,1])box(.157,.032,.0025,-.106,.022,side*.071,sleeve,'wrapper-fold');
  rounded(.160,.144,.006,.004,.001,-.106,.037,0,sleeve,'wrapper-top');
  box(.003,.034,.14,-.184,.023,0,sleeve,'sealed-paper-end');
  // Narrow warm paper edge on the opened side makes the foil/paper layers read.
  box(.002,.003,.137,-.026,.039,0,paperEdge,'torn-paper-edge');
  for(let i=0;i<17;i++){
    const z=-.067+i*.0083;
    const ridge=box(.020,.0018,.0030,-.193,.028+(i%2)*.0008,z,sleeve,'sealed-crimp');
    ridge.rotation.z=(i%3-1)*.045;
  }
  // Foil peeled back from the mouth of the sleeve, with a torn irregular edge.
  const mouth=[];
  for(let j=0;j<4;j++){
    const row=[];for(let i=0;i<=14;i++){
      const z=-.071+i*.01014,w=Math.sin(i*2.4),zig=(i%3-1)*.0015;
      row.push([[-.034,-.021,-.012,-.003][j]+(j===3?.004*w+zig:0),[.043,.047,.044,.035][j]+(j?.0025*w:0),z]);
    }mouth.push(row);
  }
  sheet(mouth,silverInside,'peeled-foil-mouth');
  // Dedicated print surface; base generator remains texture-free and testable in Node.
  const printMaterial=material(0xa2533a,.86);
  const print=mesh(new THREE.PlaneGeometry(.137,.123),printMaterial,-.108,.0433,0,'wrapper-print');
  print.rotation.x=-Math.PI/2;
  // Center using exact transformed vertices (not an inflated rotated bounding box).
  group.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();
  group.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});
  const center=bounds.getCenter(new THREE.Vector3());
  group.children.forEach(o=>{o.position.x-=center.x;o.position.y-=bounds.min.y;o.position.z-=center.z;});
  return group;
}
