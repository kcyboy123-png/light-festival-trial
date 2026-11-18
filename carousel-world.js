import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const V=(x,y,z)=>new T.Vector3(x,y,z),TAU=Math.PI*2;
export function createCarousel(scene){
  const root=new T.Group(),fixed=new T.Group(),rotor=new T.Group();root.add(fixed,rotor);
  const standard=(color,metalness=.3,roughness=.3)=>new T.MeshStandardMaterial({color,metalness,roughness,envMapIntensity:.5});
  const ivory=standard(0xe7ddd7,.2,.26),teal=standard(0x1a606b,.55,.23),gold=standard(0xc8a563,.83,.24),rose=standard(0x896b8a,.4,.3),dark=standard(0x182e42,.35,.42),black=standard(0x13252b,.1,.25);
  const glow=(color)=>new T.MeshStandardMaterial({color:0x8a8173,emissive:color,emissiveIntensity:0,metalness:.3,roughness:.22});
  const deckLight=glow(0xffcf87),roofLight=glow(0xffe0a2),pinkLight=glow(0xf0a6d4),gardenLight=glow(0x9cdeeb);
  function mesh(g,m,p=[0,0,0],parent=fixed){const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function sphere(p,s,m,parent=fixed){const o=mesh(new T.SphereGeometry(1,20,14),m,p,parent);o.scale.set(...s);return o;}
  function cyl(r,h,y,m,parent=fixed,r2=r){return mesh(new T.CylinderGeometry(r2,r,h,64),m,[0,y,0],parent);}
  function tube(points,r,m,parent=fixed,n=32){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),n,r,6,false),m,[0,0,0],parent);}
  function ring(r,y,m,parent=fixed,width=.04){const o=mesh(new T.TorusGeometry(r,width,8,96),m,[0,y,0],parent);o.rotation.x=Math.PI/2;return o;}
  function bake(group){
    group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),batches=new Map();
    group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);});
    group.clear();for(const [m,geos]of batches){const g=mergeGeometries(geos);mesh(g,m,[0,0,0],group);geos.forEach(g=>g.dispose());}
  }
  // Porcelain horses have volume on both sides, articulated-looking legs and carved tack.
  function horse(){
    const h=new T.Group();sphere([0,1.15,0],[.82,.36,.31],ivory,h);sphere([-.57,1.12,0],[.35,.36,.32],ivory,h);
    const neck=new T.Shape();neck.moveTo(.30,1.13);neck.bezierCurveTo(.52,1.6,.47,1.95,.85,2.22);neck.bezierCurveTo(1.03,2.3,1.17,2.18,1.19,2.02);neck.bezierCurveTo(.81,1.88,1.04,1.48,.64,1.13);neck.closePath();
    const ng=new T.ExtrudeGeometry(neck,{depth:.28,bevelEnabled:true,bevelSize:.1,bevelThickness:.1,bevelSegments:4,steps:1,curveSegments:20});ng.translate(0,0,-.14);mesh(ng,ivory,[0,0,0],h);
    const head=sphere([1.14,2.04,0],[.40,.21,.22],ivory,h);head.rotation.z=-.42;sphere([1.43,1.88,0],[.18,.15,.18],ivory,h);
    for(const z of [-.16,.16]){const ear=mesh(new T.ConeGeometry(.09,.35,12),ivory,[.94,2.37,z],h);ear.rotation.z=.18;sphere([1.16,2.12,z*1.35],[.043,.047,.018],black,h);sphere([1.17,2.14,z*1.42],[.013,.013,.008],roofLight,h);}
    for(const side of [-1,1]){
      const z=side*.22;
      tube([[.5,1.1,z],[.72,.73,z],[1.0,.59,z],[.85,.23,z]],.09,ivory,h,22);
      tube([[-.57,1.05,z],[-.8,.67,z],[-.43,.48,z],[-.62,.14,z]],.10,ivory,h,22);
      sphere([.85,.19,z],[.13,.10,.12],gold,h);sphere([-.62,.12,z],[.14,.10,.13],gold,h);
      tube([[1.32,1.91,side*.18],[1.01,1.75,side*.25],[.53,1.31,side*.3],[.1,1.45,side*.32]],.023,gold,h);
    }
    for(let i=0;i<7;i++)tube([[.91,2.21,-.15+i*.05],[.64,2.05,-.18+i*.05],[.55,1.7,-.2+i*.05],[.3,1.4,-.15+i*.05]],.045,gold,h,20);
    for(let i=0;i<4;i++)tube([[-.7,1.27,(i-1.5)*.06],[-1.02,1.2,(i-1.5)*.07],[-1.19,.64,(i-1.5)*.07],[-1.45,.55,(i-1.5)*.05]],.065,gold,h,20);
    sphere([-.06,1.43,0],[.39,.09,.39],teal,h);
    for(const z of [-.34,.34]){const saddle=mesh(new T.ShapeGeometry(new T.Shape().moveTo(-.37,1.42).lineTo(.25,1.42).lineTo(.18,1.02).quadraticCurveTo(-.06,.88,-.28,1.02).closePath()),teal,[0,0,z],h);saddle.material.side=T.DoubleSide;tube([[-.37,1.42,z],[-.28,1.02,z],[-.05,.95,z],[.18,1.02,z],[.25,1.42,z]],.022,gold,h);sphere([-.06,1.17,z],[.075,.11,.025],pinkLight,h);}
    bake(h);return h;
  }
  cyl(6.25,.24,1.29,dark);cyl(6.05,.18,1.48,ivory);ring(6.03,1.59,deckLight,fixed,.06);
  cyl(5.8,.17,1.65,teal,rotor);ring(5.65,1.75,gold,rotor,.06);ring(5.82,1.70,deckLight,rotor,.045);
  for(let i=0;i<32;i++){const a=i/32*TAU;tube([[Math.sin(a)*1.7,1.75,Math.cos(a)*1.7],[Math.sin(a)*5.5,1.75,Math.cos(a)*5.5]],.016,gold,rotor,1);}
  cyl(1.45,3.6,3.5,teal,rotor);cyl(1.64,.24,1.88,gold,rotor);cyl(1.6,.24,5.3,gold,rotor);
  const mirror=standard(0x9cbdc5,.95,.14);
  for(let i=0;i<8;i++){const a=i/8*TAU,g=new T.Group();g.rotation.y=a;rotor.add(g);mesh(new T.BoxGeometry(.84,2.6,.035),mirror,[0,3.6,1.46],g);tube([[-.48,2.17,1.49],[-.48,4.7,1.49],[0,5.06,1.49],[.48,4.7,1.49],[.48,2.17,1.49]],.045,gold,g);const gem=mesh(new T.OctahedronGeometry(.16),pinkLight,[0,3.5,1.53],g);gem.scale.y=2;}
  const profile=[[0,8.2],[.3,8.04],[.7,7.55],[1.7,7.12],[3.2,6.62],[4.8,6.15],[6.05,5.97]].map(p=>new T.Vector2(...p));
  for(let i=0;i<16;i++){
    const a=i/16*TAU;mesh(new T.LatheGeometry([...profile].reverse(),8,a,TAU/16),i%2?ivory:teal);
    const rib=profile.map(p=>[Math.sin(a)*p.x,p.y+.035,Math.cos(a)*p.x]);tube(rib,.045,gold);
    const g=new T.Group();g.rotation.y=a;fixed.add(g);const sign=mesh(new T.SphereGeometry(1,18,12),i%2?rose:teal,[0,5.64,5.94],g);sign.scale.set(.94,.36,.09);
    const outline=[];for(let j=0;j<=32;j++){const t=j/32*TAU;outline.push([Math.cos(t)*.88,5.64+Math.sin(t)*.32,6.04]);}tube(outline,.035,gold,g,32);
    const jewel=mesh(new T.OctahedronGeometry(.17),pinkLight,[0,5.65,6.1],g);jewel.scale.set(1.8,1,.4);
    const swag=[];for(let j=0;j<=20;j++){const t=j/20,angle=a+t*TAU/16;swag.push([Math.sin(angle)*5.96,5.26-Math.sin(t*Math.PI)*.4,Math.cos(angle)*5.96]);}tube(swag,.025,gold,fixed,24);
    const mid=a+TAU/32;const drop=mesh(new T.OctahedronGeometry(.11),roofLight,[Math.sin(mid)*5.96,4.68,Math.cos(mid)*5.96]);drop.scale.y=1.8;
    for(const height of [4.88,4.98])sphere([Math.sin(mid)*5.96,height,Math.cos(mid)*5.96],[.045,.045,.045],gold);
  }
  for(const y of [5.3,5.96])ring(6.03,y,gold,fixed,.10);
  for(let i=0;i<96;i++){const a=i/96*TAU;sphere([Math.sin(a)*6.06,5.31,Math.cos(a)*6.06],[.065,.065,.065],roofLight);sphere([Math.sin(a)*5.95,1.47,Math.cos(a)*5.95],[.045,.045,.045],deckLight);}
  sphere([0,8.3,0],[.32,.45,.32],gold);const star=mesh(new T.OctahedronGeometry(.4),roofLight,[0,9,0]);star.scale.set(.75,1.5,.75);
  const prototype=horse(),horses=[];
  for(let i=0;i<8;i++){
    const a=i/8*TAU,x=Math.sin(a)*3.9,z=Math.cos(a)*3.9;
    tube([[x,1.72,z],[x,5.83,z]],.045,gold,rotor,1);
    const helix=[];for(let k=0;k<=100;k++){const t=k/100;helix.push([x+Math.cos(t*TAU*8)*.067,1.8+t*3.9,z+Math.sin(t*TAU*8)*.067]);}tube(helix,.012,deckLight,rotor,100);
    const h=prototype.clone();h.position.set(x,1.9,z);h.rotation.y=a;rotor.add(h);horses.push(h);
  }
  // Keep moving horses separate while the platform and poles share merged materials.
  horses.forEach(h=>h.removeFromParent());bake(rotor);horses.forEach(h=>rotor.add(h));
  const leaf=standard(0x34675c,.1,.65),petals=[0xe696ab,0xe9ba79,0x8bbeca,0xb09bdd].map(color=>{const m=standard(color,.1,.5);m.emissive.set(color);return m;});
  for(const side of [-1,1])for(const back of [-1,1]){
    const x=side*9,z=back*5,petal=petals[(side>0?2:0)+(back>0?1:0)];
    const plinth=mesh(new T.CylinderGeometry(2.2,2.4,.8,40),ivory,[x,.55,z]);plinth.scale.z=.8;
    for(let i=0;i<18;i++){const a=i*2.4,r=Math.sqrt((i+.5)/18)*1.8,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r*.75;
      sphere([px,1.15,pz],[.36,.23,.3],leaf);
      for(let j=0;j<5;j++){const angle=j/5*TAU;const p=sphere([px+Math.sin(angle)*.17,1.5+(i%3)*.14,pz+Math.cos(angle)*.17],[.15,.08,.26],petal);p.rotation.y=angle;}
      sphere([px,1.57+(i%3)*.14,pz],[.06,.06,.06],gardenLight);
    }
    const postx=x*.95,postz=z*1.2;tube([[postx,1,postz],[postx,4.3,postz]],.06,gold);sphere([postx,4.4,postz],[.19,.35,.19],pinkLight);
    const garland=[];for(let j=0;j<=24;j++){const t=j/24;garland.push([postx*(1-t),4.5+t*2.5-Math.sin(t*Math.PI),postz*(1-t)]);}tube(garland,.025,gold);
    for(let j=2;j<24;j+=3){const p=garland[j];sphere([p[0],p[1]-.12,p[2]],[.065,.12,.065],roofLight);}
  }
  for(let i=0;i<48;i++){const tile=mesh(new T.RingGeometry(7.96,8.15,4,1,i/48*TAU,.065),i%3?teal:rose,[0,1.216,0]);tile.rotation.x=-Math.PI/2;}
  bake(fixed);root.position.set(-25,0,14);scene.add(root);
  const point=new T.PointLight(0xffcc8c,0,25,2);point.position.set(-25,5,14);scene.add(point);
  let amount=0,angle=0;
  return {
    setLight(v){amount=T.MathUtils.clamp(v,0,1);},
    update(time,dt,reduced=false){
      const ease=(a,b)=>T.MathUtils.smoothstep(amount,a,b);
      deckLight.emissiveIntensity=ease(0,.3)*2.3;roofLight.emissiveIntensity=ease(.1,.65)*2.7;pinkLight.emissiveIntensity=ease(.3,.8)*2;gardenLight.emissiveIntensity=ease(.5,1)*2;for(const petal of petals)petal.emissiveIntensity=ease(.4,1)*.4;point.intensity=ease(.1,.8)*72;
      if(!reduced)angle+=dt*.19*ease(.12,.8);rotor.rotation.y=angle;
      horses.forEach((h,i)=>h.position.y=1.95+(reduced?0:Math.sin(time*1.6+i*Math.PI/2)*.17*ease(.12,.8)));
    },
    get state(){return {light:amount,angle,horses:horses.length,horseHeights:horses.map(h=>h.position.y)};}
  };
}
