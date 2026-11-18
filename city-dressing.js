import * as T from 'three';

// Static silhouettes and ornaments join the world's existing spatial material batches.
export function dressCity({root,stone,gold,trim,soil,glow,nodes}){
  const stats={buildings:0,terraces:0,ornaments:[],trees:0,distantGroves:0},TAU=Math.PI*2;
  const walls=[0x91a6bd,0x9a9bb9,0x85adac].map(color=>new T.MeshStandardMaterial({color,roughness:.68,metalness:.08,envMapIntensity:.28}));
  const roof=new T.MeshStandardMaterial({color:0x45657a,emissive:0x213b50,emissiveIntensity:.12,roughness:.45,metalness:.3,envMapIntensity:.4});
  const leaf=new T.MeshStandardMaterial({color:0x367565,roughness:.8,metalness:.03});
  const rose=new T.MeshStandardMaterial({color:0xc58caa,roughness:.72,metalness:.04});
  const window=glow(0xffd39b,2,.65);window.color.set(0x748eaa);window.roughness=.45;
  const aqua=glow(0x8adbd7,2,.6);aqua.color.set(0x81a9b6);
  const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,16),sphere=new T.SphereGeometry(1,12,8),gem=new T.OctahedronGeometry(1);
  const roofG=new T.LatheGeometry([[1,0],[1.04,.1],[.85,.24],[.7,.52],[.4,.9],[.14,1.12],[0,1.3]].map(p=>new T.Vector2(...p)),20);
  const arch=new T.Shape();arch.moveTo(-.34,0);arch.lineTo(-.34,.62);arch.quadraticCurveTo(-.34,.95,0,1.12);arch.quadraticCurveTo(.34,.95,.34,.62);arch.lineTo(.34,0);arch.closePath();
  const windowG=new T.ShapeGeometry(arch,8),ringG=new T.TorusGeometry(1,.025,6,32);
  function add(g,m,x,y,z,s=[1,1,1],a=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(...s);o.rotation.y=a;o.castShadow=false;o.receiveShadow=true;o.userData.distant=Math.hypot(x+5,z+4)>40;root.add(o);return o;}
  function ring(x,y,z,r,m=gold){const o=add(ringG,m,x,y,z,[r,r,r]);o.rotation.x=Math.PI/2;return o;}
  function pot(x,y,z,r=.45){add(cylinder,stone,x,y+.24,z,[r,.48,r]);ring(x,y+.49,z,r,gold);add(cylinder,soil,x,y+.49,z,[r*.9,.025,r*.9]);}
  function bloom(x,y,z,r=.4,m=rose){for(let j=0;j<5;j++){const a=j/5*TAU;const p=add(sphere,m,x+Math.sin(a)*r*.55,y,z+Math.cos(a)*r*.55,[r*.4,r*.16,r*.7],a);p.rotation.z=.22;}add(sphere,window,x,y+.08,z,[r*.17,r*.17,r*.17]);}
  function urn(x,y,z){pot(x,y,z,.5);for(let j=0;j<5;j++){const a=j*2.4;add(sphere,leaf,x+Math.sin(a)*.22,y+.68,z+Math.cos(a)*.22,[.18,.44,.12],a);bloom(x+Math.sin(a)*.28,y+.95+(j%2)*.15,z+Math.cos(a)*.28,.23);}}
  function artifact(name,x,z,fn){
    const clearance=Math.min(...nodes.map(p=>Math.hypot(p.x-x,p.z-z)-p.walkRadius));
    if(clearance<.8)throw new Error('Decoration overlaps walking corridor: '+name);
    stats.ornaments.push({name,x,z,clearance});fn();
  }

  // Ten distinct, low-profile details sit beside the playable routes.
  artifact('entry-urns',-4.4,27,()=>{urn(-4.4,1.05,27);urn(4.5,1.05,27);});
  artifact('moon-dial',5.4,24,()=>{pot(5.4,1.1,24,.8);const r=add(ringG,gold,5.4,2.1,24,[.7,.7,.7]);r.rotation.x=.6;add(gem,aqua,5.4,2.1,24,[.12,.45,.12]);});
  artifact('flower-scroll',-5,12.5,()=>{for(let i=0;i<5;i++)bloom(-5-i*.22,1.4,12.5+i*.45,.3,i%2?rose:aqua);});
  artifact('bridge-urns',-11,4,()=>{urn(-11,1.1,4);urn(-12,1.1,4);});
  artifact('garden-astrolabe',-20,-7,()=>{pot(-20,.85,-7,.85);for(const a of [0,Math.PI/2]){const r=add(ringG,gold,-20,2,-7,[.8,.8,.8],a);r.rotation.x=.3;}add(gem,aqua,-20,2,-7,[.22,.43,.22]);});
  artifact('lily-islets',10,-2,()=>{for(let i=0;i<4;i++){const x=10+i*.9,z=-2-Math.sin(i)*1.2;add(cylinder,leaf,x,.09,z,[.6,.05,.45]);bloom(x,.18,z,.45,aqua);}});
  artifact('fountain-cups',-10,-18,()=>{for(const x of [-10,10]){pot(x,.9,-18,.9);for(let i=0;i<5;i++)bloom(x+Math.sin(i*2.4)*.5,1.5,-18+Math.cos(i*2.4)*.5,.35);}});
  artifact('glasshouse-specimens',25,-7,()=>{for(let i=0;i<3;i++){pot(25,.9,-7+i*1.3,.45);add(gem,aqua,25,1.9,-7+i*1.3,[.22,.55,.22],i*.6);}});
  artifact('carousel-bunting',-36,14,()=>{for(let i=0;i<5;i++){const z=10+i*2;add(cylinder,gold,-36,2.1,z,[.035,2.4,.035]);add(gem,i%2?rose:aqua,-36,3.1,z,[.25,.4,.08]);}});
  artifact('carousel-rosettes',-27,24,()=>{for(let i=0;i<5;i++){const x=-30+i*1.5;pot(x,.8,24,.43);bloom(x,1.45,24,.5,i%2?rose:aqua);}});

  // Background pass 1: inhabited terraces all around the water, outside playable ground.
  const roofRib=new T.TubeGeometry(new T.CatmullRomCurve3([[1,0,0],[.85,.24,0],[.4,.9,0],[0,1.3,0]].map(p=>new T.Vector3(...p))),10,.022,4,false);
  for(let district=0;district<8;district++){
    const a=district/8*TAU+.16,cx=-5+Math.sin(a)*54,cz=-4+Math.cos(a)*57;
    add(cylinder,roof,cx,.25,cz,[10,.5,7]);add(cylinder,stone,cx,.57,cz,[9.7,.15,6.8]);stats.terraces++;
    for(let i=0;i<5;i++){
      const x=cx+(i-2)*3.6,z=cz+Math.sin(i*1.8)*2.2,h=3.8+((i*3+district*2)%5)*1.2,r=1.15+(i%2)*.3;
      add(cylinder,walls[district%3],x,.7+h/2,z,[r,h,r]);add(roofG,roof,x,.7+h,z,[r*1.16,r*1.5,r*1.16]);
      ring(x,.7+h,z,r*1.1,trim);add(gem,gold,x,.7+h+r*2,z,[.08,.45,.08]);
      ring(x,1.05,z,r*1.03,trim);ring(x,3.3,z,r*1.01,gold);
      for(let j=0;j<6;j++)add(roofRib,gold,x,.7+h,z,[r*1.16,r*1.5,r*1.16],j/6*TAU);
      for(let j=0;j<4;j++){
        const angle=j/4*TAU;for(let k=0;k<2;k++)add(windowG,window,x+Math.sin(angle)*(r+.01),1.3+k*2.1,z+Math.cos(angle)*(r+.01),[.9,1.1,1],angle);
      }
      stats.buildings++;
      if(i<4){
        const zz=cz+Math.sin((i+.5)*1.8)*1.5;
        add(box,walls[district%3],x+1.8,2.05,zz,[3.6,2.7,1.9]);
        add(box,roof,x+1.8,3.53,zz,[3.8,.25,2.15]);
        for(const side of [-1,1])for(let k=0;k<3;k++)add(windowG,window,x+.7+k*1.1,1.2,zz+side*.96,[.8,1.35,1],side<0?Math.PI:0);
      }
    }
    for(let i=0;i<7;i++){const x=cx-8+i*2.5,z=cz+4.4;add(sphere,leaf,x,.95,z,[1.2,.65,.8]);if(i%2===0)bloom(x,1.6,z,.46);}
  }

  // Background pass 2: lower garden terraces bridge the visual gap to the distant town.
  const gardens=[[-43,-3],[-38,33],[-7,42],[25,33],[38,12],[36,-40],[-9,-50],[-40,-40]];
  for(const [index,[cx,cz]]of gardens.entries()){
    add(cylinder,roof,cx,.25,cz,[6,.5,4.1]);add(cylinder,stone,cx,.6,cz,[5.8,.2,3.95]);
    add(cylinder,soil,cx,.72,cz,[5.55,.06,3.7]);stats.terraces++;
    for(let i=0;i<5;i++){
      const a=i*2.39996,x=cx+Math.sin(a)*3.8,z=cz+Math.cos(a)*2.1,h=2.2+(i%3)*.65;
      add(cylinder,trim,x,.8+h/2,z,[.09,h,.09]);
      for(let j=0;j<5;j++){const b=j*2.4;add(sphere,i%3===0?rose:leaf,x+Math.sin(b)*.65,.8+h+Math.sin(j)*.4,z+Math.cos(b)*.65,[.8,.62,.72],b);}
      stats.trees++;
    }
    for(let i=0;i<12;i++){const a=i/12*TAU,x=cx+Math.sin(a)*4.9,z=cz+Math.cos(a)*3;add(sphere,leaf,x,.94,z,[.7,.35,.55],a);if(i%2===index%2)bloom(x,1.25,z,.3,index%2?rose:aqua);}
  }
  // Background pass 3: a broken blue woodland horizon, lower than the landmark spires.
  const distant=[0x385a75,0x485c80,0x44777b].map(color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.16,roughness:.94,metalness:0,envMapIntensity:.15}));
  for(let i=0;i<38;i++){
    const a=i/38*TAU,r=73+Math.sin(i*1.7)*6,x=-5+Math.sin(a)*r,z=-4+Math.cos(a)*r,h=5+((i*7)%9)*.55;
    add(sphere,distant[i%3],x,.15,z,[6.2,.75,4.7],a);
    for(let j=0;j<4;j++){
      const q=j*2.4,px=x+Math.sin(q)*2.5,pz=z+Math.cos(q)*2.5,top=h+Math.sin(j+i)*1.1;
      add(cylinder,roof,px,top/2,pz,[.18,top,.18]);
      for(let k=0;k<4;k++)add(sphere,distant[(i+j)%3],px+Math.sin(k*2.4)*1.1,top+Math.sin(k)*.7,pz+Math.cos(k*2.4)*1.1,[2.1,1.3,1.6],k);
    }
    stats.distantGroves++;
  }
  return stats;
}
