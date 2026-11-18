import * as T from 'three';
import {softenOccluder} from './camera-visibility.js';

// Shared petal meshes keep dense botanical detail practical in the reflection pass too.
export function createGardens(scene, {root, mesh, tube, cyl, ring, arch, mat, glow, stone, gold, trim, soil, amber, violet, petalGeometry, random, cameraFocus, cameraFollowing}) {
  const V=(x,y,z)=>new T.Vector3(x,y,z), TAU=Math.PI*2;
  const foliage=[mat(0x285c49,.65,.06),mat(0x49795f,.61,.07),mat(0x1c443f,.65,.06)];
  foliage.forEach(m=>m.side=T.DoubleSide);
  const pearl=glow(0xf5d5e7,2,.8),rose=glow(0xe997c4,2,.7),lavender=glow(0x9db8ff,2,.8);
  pearl.color.set(0xf1cd8d);rose.color.set(0xeb8fb1);lavender.color.set(0x8aafeb);
  const blossoms=[pearl,rose,lavender];
  blossoms.forEach(m=>{m.side=T.DoubleSide;});
  const opals=[glow(0xe8b9e8,2,.8),glow(0xa6d4f8,2,.85),glow(0xe8d5ad,2,.65)];
  opals.forEach(m=>{m.color.set(0xc6b7d1);m.side=T.DoubleSide;m.roughness=.25;});
  function blade(length,width,rise,rows,columns){
    const g=petalGeometry(length,width,rise,rows,columns),p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){const u=uv.getX(i)*2-1,t=uv.getY(i);p.setY(i,rise*t+u*u*width*.45*Math.sin(Math.PI*t));}
    g.computeVertexNormals();return g;
  }
  const leafG=blade(.62,.19,.23,9,6),smallG=blade(.16,.07,.06,7,6),largeG=blade(.52,.22,.19,12,8);
  for(const m of [...foliage,...blossoms,...opals]){
    m.envMapIntensity=.5;
    m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 leafUV;').replace('#include <begin_vertex>','#include <begin_vertex>\nleafUV=uv;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 leafUV;').replace('#include <color_fragment>',`#include <color_fragment>
      vec2 safeUV=clamp(leafUV,0.,1.);
      float mid=abs(safeUV.x-.5)*2.;
      float vein=pow(abs(cos((mid*7.-safeUV.y*2.)*3.14159)),14.);
      diffuseColor.rgb*=.73+safeUV.y*.24+vein*.06;`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance*=.2+pow(abs(safeUV.x-.5)*2.,6.)*.55+pow(safeUV.y,4.)*.35;`);};
  }
  const beadG=new T.SphereGeometry(.045,7,5),budG=new T.SphereGeometry(1,8,6);
  const batches=new Map(),dummy=new T.Object3D();
  function instance(g,m,p,r=[0,0,0],s=[1,1,1]) {
    const key=g.uuid+m.uuid;if(!batches.has(key))batches.set(key,{g,m,transforms:[]});
    dummy.position.set(...p);dummy.rotation.set(...r);dummy.scale.set(...s);dummy.updateMatrix();
    batches.get(key).transforms.push(dummy.matrix.clone());
  }
  function spray(x,y,z,size=1,kind=0) {
    for(let j=0;j<5;j++)instance(leafG,foliage[j%3],[x,y,z],[.1+random()*.5,j/5*TAU+random()*.4,0],[size,size,size]);
    for(let k=0;k<3;k++){
      const a=random()*TAU,r=.18*size,h=(.35+random()*.35)*size;
      const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
      tube([V(x,y,z),V(px,y+h*.7,pz),V(px,y+h,pz)],.012*size,foliage[0],root,4);
      const tilt=random()*.4;
      for(let j=0;j<6;j++)instance(smallG,blossoms[kind%3],[px,y+h,pz],[tilt,j/6*TAU,0],[size,size,size]);
      instance(beadG,amber,[px,y+h+.025,pz],[0,0,0],[size,size,size]);
    }
  }
  function vine(x,y,z,length=2.3) {
    const pts=[];for(let i=0;i<9;i++)pts.push(V(x+Math.sin(i*.8)*.09,y-i/8*length,z+Math.sin(i*.5)*.07));
    tube(pts,.017,foliage[0],root,16);
    for(let i=0;i<15;i++){
      const t=i/15,s=.25+(1-t)*.45;
      instance(leafG,foliage[i%3],[x+Math.sin(t*7)*.12,y-t*length,z],[Math.PI*.7,i*2.4,0],[s,s,s]);
      if(i%2===0)for(let j=0;j<4;j++)instance(budG,blossoms[2],[x+Math.sin(i+j)*.09,y-t*length-j*.08,z+.08],[0,0,0],[.075,.105,.075]);
    }
  }
  function bed(cx,cz,rx,rz,phase=0) {
    const pts=[],shape=new T.Shape();
    for(let i=0;i<=96;i++){
      const a=i/96*TAU,w=1+Math.sin(a*3+phase)*.07;
      const x=cx+Math.cos(a)*rx*w,z=cz+Math.sin(a)*rz*w;
      pts.push(V(x,1.12,z));if(i===0)shape.moveTo(x,-z);else shape.lineTo(x,-z);
    }
    const base=new T.ExtrudeGeometry(shape,{depth:.72,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.08,bevelThickness:.08,curveSegments:32});
    base.rotateX(-Math.PI/2);mesh(base,stone,[0,.34,0]);
    const top=new T.ShapeGeometry(shape,32);top.rotateX(-Math.PI/2);mesh(top,soil,[0,1.08,0]);
    tube(pts,.105,trim,root,96);tube(pts.map(p=>p.clone().add(V(0,-.17,0))),.026,amber,root,96);
    for(let i=0;i<26;i++){
      const a=i/26*TAU,x=cx+Math.cos(a)*rx,z=cz+Math.sin(a)*rz;
      const ornament=arch(x,.43,z,.5,.5,-a+Math.PI/2,amber);ornament.scale.set(.8,.8,.8);
    }
    const count=Math.ceil(rx*rz*20);
    for(let i=0;i<count;i++){
      const a=random()*TAU,r=Math.sqrt(random())*.92,x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;
      spray(x,1.1,z,.65+random()*.7,Math.floor((a+phase+TAU)/1.8));
    }
    for(let i=0;i<9;i++){const a=random()*TAU;vine(cx+Math.cos(a)*rx,1.14,cz+Math.sin(a)*rz,.65+random()*.7);}
  }
  bed(-6.8,19,3.05,6.8,.2);bed(6.8,17,3,8.1,1.6);
  bed(-12,-14,3.2,3,2);bed(13,-14,3.2,3,3);
  // Each branch is a tapered curved solid; blossoms sit in irregular sprays, not spherical clouds.
  function branch(points,radius) {
    const curve=new T.CatmullRomCurve3(points),g=new T.TubeGeometry(curve,20,radius,8,false),p=g.attributes.position;
    for(let i=0;i<=20;i++){
      const c=curve.getPointAt(i/20),taper=1-i/20*.82;
      for(let j=0;j<=8;j++){const k=i*9+j;const v=V(p.getX(k),p.getY(k),p.getZ(k)).sub(c).multiplyScalar(taper).add(c);p.setXYZ(k,v.x,v.y,v.z);}
    }
    g.computeVertexNormals();mesh(g,stone);
    tube(points.map(p=>p.clone().add(V(.04,.02,.04))),radius*.12,gold,root,24);
  }
  function tree(x,z,height,side) {
    cyl(x,.1,z,2,.6,stone);ring(x,.76,z,1.95,amber,.035);
    const trunk=[V(x,.7,z),V(x-side*.45,height*.35,z),V(x+side*.3,height*.7,z-.25),V(x-side*1.4,height,z-.6)];
    branch(trunk,.4);
    for(let b=0;b<10;b++){
      const a=b*2.4,spread=2.4+random()*2.7;
      const start=V(x,height*(.42+random()*.25),z),tip=V(x+Math.cos(a)*spread,height*(.75+random()*.35),z+Math.sin(a)*spread*.7);
      branch([start,start.clone().lerp(tip,.4).add(V(0,.8,0)),tip],.16);
      for(let t=0;t<6;t++){
        const u=.4+t*.1,p=start.clone().lerp(tip,u),end=p.clone().add(V((random()-.5)*2,.6+random(),(random()-.5)*1.8));
        branch([p,p.clone().lerp(end,.5).add(V(0,.2,0)),end],.055);
        for(let k=0;k<7;k++){
          const q=end.clone().add(V((random()-.5)*1.2,(random()-.5)*.6,(random()-.5)*1.2)),s=.45+random()*.6,turn=random()*TAU;
          for(let j=0;j<5;j++)instance(largeG,opals[(b+k)%3],q.toArray(),[.65,j/5*TAU+turn,0],[s,s,s]);
          instance(beadG,amber,q.clone().add(V(0,.035,0)).toArray(),[0,0,0],[s*1.5,s*1.5,s*1.5]);
          if(k%2===0)instance(leafG,foliage[b%3],q.toArray(),[.3,turn,0],[1.1,1.1,1.1]);
        }
      }
      if(b%3===0){
        const p=tip.clone().add(V(0,-1.1,0));tube([tip,p],.012,gold,root,1);
        const jewel=mesh(new T.SphereGeometry(.14,12,8),amber,p.toArray());jewel.scale.set(.8,1.8,.8);
        for(let j=0;j<4;j++){const a=j/4*TAU;tube([p.clone().add(V(0,-.35,0)),p.clone().add(V(Math.cos(a)*.23,0,Math.sin(a)*.23)),p.clone().add(V(0,.35,0))],.018,gold,root,12);}
      }
    }
    for(let i=0;i<35;i++){let a=random()*TAU,r=Math.sqrt(random())*1.7;spray(x+Math.cos(a)*r,.76,z+Math.sin(a)*r,.8,i%3);}
  }
  tree(-9.7,13.8,9.4,-1);tree(12.7,12,10.4,1);
  tree(-23,-12,8.1,-1);tree(29,-16,8.8,1);
  // Solid arcaded terraces supply the architectural mass missing from the initial wire-like skyline.
  const wall=mat(0xa7b6c6,.4,.2),roof=mat(0x4c6b83,.3,.48),window=glow(0xffc888,2,1.5);
  window.color.set(0x725137);
  window.onBeforeCompile=s=>{
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 windowUV;').replace('#include <begin_vertex>','#include <begin_vertex>\nwindowUV=uv;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 windowUV;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float panes=smoothstep(.03,.09,abs(sin(windowUV.x*9.)))*smoothstep(.02,.08,abs(sin(windowUV.y*3.)));
      float glassGrain=.87+.13*sin(windowUV.x*69.+sin(windowUV.y*43.));
      vec3 stained=mix(vec3(1.,.36,.1),vec3(1.,.88,.48),.5+.5*sin(windowUV.y*1.6));
      totalEmissiveRadiance*=stained*(.25+panes*.65)*glassGrain;`);
  };
  const districtWindows=[window],windowGlass=window.onBeforeCompile;
  for(const color of [0x6bcbd9,0xc598ef]){const m=glow(color,2,1.35);m.color.set(color).multiplyScalar(.42);m.onBeforeCompile=s=>{windowGlass(s);s.fragmentShader=s.fragmentShader.replace('vec3 stained=mix(vec3(1.,.36,.1),vec3(1.,.88,.48),','vec3 stained=mix(vec3(.55,.7,1.),vec3(1.,1.,1.),');};districtWindows.push(m);}
  function facade(x,z,width,height,angle=0) {
    const districtWindow=districtWindows[z>-8?(x<0?1:2):x>0?2:0];
    const group=new T.Group();group.position.set(x,1,z);group.rotation.y=angle;root.add(group);
    mesh(new T.BoxGeometry(width,height,4.8),wall,[0,height/2,0],group);
    for(const y of [.1,height*.5,height]){mesh(new T.BoxGeometry(width+.6,.24,5.4),stone,[0,y,0],group);tube([V(-width/2,y+.15,2.74),V(width/2,y+.15,2.74)],.03,amber,group,1);}
    const n=Math.floor(width/2.5);
    for(let level=0;level<2;level++)for(let j=0;j<n;j++){
      const px=(j-(n-1)/2)*2.5,y=.3+level*height/2,h=height/2-.65;
      const opening=arch(px,y,2.48,1.8,h,0,amber,group);
      const s=new T.Shape();s.moveTo(-.79,0);s.lineTo(-.79,h*.6);s.quadraticCurveTo(-.79,h*.85,0,h-.13);s.quadraticCurveTo(.79,h*.85,.79,h*.6);s.lineTo(.79,0);s.closePath();mesh(new T.ShapeGeometry(s),districtWindow,[0,0,.025],opening);
      for(const sx of [-.3,.3])tube([V(sx,0,.015),V(sx,h*.8,.015)],.018,gold,opening,1);
    }
    for(let j=0;j<=n*3;j++)cyl((j/(n*3)-.5)*width,height+.2,2.6,.045,.65,stone,.045,group);
    tube([V(-width/2,height+.85,2.6),V(width/2,height+.85,2.6)],.09,stone,group,1);
    for(const px of [-width*.32,width*.32]){
      const gazebo=new T.Group();gazebo.position.set(px,height+.15,0);group.add(gazebo);
      cyl(0,0,0,1.85,.2,stone,1.85,gazebo);
      for(let i=0;i<6;i++){const a=i/6*TAU;arch(Math.sin(a)*1.6,.2,Math.cos(a)*1.6,1.5,2.4,a,amber,gazebo);}
      const cap=mesh(new T.SphereGeometry(1.9,24,12,0,TAU,0,Math.PI/2),roof,[0,2.6,0],gazebo);cap.scale.y=.7;
      ring(0,2.6,0,1.9,gold,.065,gazebo);cyl(0,3.85,0,.1,.7,amber,0,gazebo);
    }
    group.updateMatrixWorld(true);
    for(let j=0;j<18;j++){
      const p=V((j/17-.5)*(width-.6),height+.2,2.8).applyMatrix4(group.matrixWorld);
      vine(p.x,p.y,p.z,1.2+random()*2);
      spray(p.x,p.y,p.z,.9,j%3);
    }
  }
  facade(-21,-25,16,8.8,.36);facade(24,-29,18,10,-.33);
  facade(-11,-39,14,9,.12);facade(11,-40,13,11,-.12);
  facade(16,2,10,5.4,-.5);facade(-25,1,11,6.8,.55);
  // Planted islands support the borrowed grove models above the waterline.
  for(const [x,z,rx,rz] of [[-17,-13,6,5],[28,-19,6,5],[-29,-32,5,5],[30,-37,5,5],[-12,17,3.2,4],[-16,-18,6,3],[18,-18,6,3]]){
    const island=mesh(new T.CylinderGeometry(1,1.08,.9,48),stone,[x,.5,z]);island.scale.set(rx,1,rz);
    const top=mesh(new T.CircleGeometry(1,48),soil,[x,.96,z]);top.rotation.x=-Math.PI/2;top.scale.set(rx*.95,rz*.95,1);
    const edge=ring(x,.98,z,1,amber,.012);edge.scale.set(rx,rz,1);
  }
  // Only ornaments crossing the fox's sightline dissolve; the surrounding city stays intact.
  const hanging=[gold.clone(),glow(0xffc578,2,2.5),glow(0xbfa0ff,2,2.0)];
  for(const m of [...hanging,wall,roof,...districtWindows,...blossoms,...foliage])softenOccluder(m,cameraFocus,cameraFollowing);
  for(const side of [-1,1])for(let row=0;row<2;row++){
    const x=side*10,z=9-row*11,points=[];
    for(let i=0;i<=32;i++){const t=i/32;points.push(V(x+side*t*9,8-Math.sin(t*Math.PI)*1.8+row,z-t*9));}
    tube(points,.022,hanging[0],root,32);
    for(let i=2;i<32;i+=3){const p=points[i];tube([p,p.clone().add(V(0,-.35,0))],.01,hanging[0],root,1);const drop=mesh(new T.OctahedronGeometry(.14,0),hanging[i%2?1:2],p.clone().add(V(0,-.5,0)).toArray());drop.scale.y=1.7;}
  }
  // Rounded buttresses and a colonnaded base visually anchor the central spire.
  const palace=new T.Group();palace.position.set(5,1,-29);root.add(palace);
  cyl(0,0,0,4.4,5.5,wall,4.4,palace);ring(0,5.55,0,4.55,stone,.19,palace);
  for(let i=0;i<12;i++){let a=i/12*TAU;const g=arch(Math.sin(a)*4.42,.15,Math.cos(a)*4.42,1.8,4.8,a,amber,palace);mesh(new T.PlaneGeometry(1.45,3.9),window,[0,2,.025],g);}
  const bellGeometry=new T.LatheGeometry([[.03,.5],[.11,.43],[.14,.3],[.17,.17],[.26,.04],[.28,0]].map(p=>new T.Vector2(...p)),20);
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const x=side*(5.3+random()),z=11+i*2.2,h=1.8+random()*.7;
    tube([V(x,1.1,z),V(x-side*.3,h,z),V(x-side*.55,h+.35,z),V(x-side*.9,h+.15,z)],.032,gold,root,24);
    const bell=mesh(bellGeometry,opals[i%3],[x-side*.9,h-.35,z]);bell.scale.setScalar(.8);
    ring(x-side*.9,h-.35,z,.22,gold,.018);
    instance(beadG,amber,[x-side*.9,h-.4,z],[0,0,0],[1.8,2.5,1.8]);
  }
  // Small floating blossoms make the water part of the garden while retaining dark reflections.
  for(let i=0;i<24;i++){
    const a=random()*TAU,r=10+random()*13,x=Math.cos(a)*r,z=-8+Math.sin(a)*r;
    if(z>1&&Math.abs(x)<9)continue;
    for(let j=0;j<5;j++)instance(largeG,opals[i%3],[x,.1,z],[0,j/5*TAU,0],[.5,.5,.5]);
    instance(beadG,amber,[x,.15,z]);
  }
  // Low seasonal clusters reuse the garden's petals and leaves without narrowing the paths.
  const accentColors=[0xf2b87b,0xe984ad,0x8d9fe5,0x77c9b9,0xe4c978];
  const accentMats=accentColors.map(color=>{const m=glow(color,2,.42);m.color.set(color);m.metalness=.08;m.roughness=.55;m.side=T.DoubleSide;return m;});
  const stemG=new T.CylinderGeometry(.012,.018,1,6),patches=[[-5.2,1.1,16,0,0],[5.1,1.1,14,1,1],[-8,1.1,20.5,2,2],[8,1.1,20,0,1],[-11,1.1,-12.8,2,2],[12,1.1,-12.8,1,0],[-16,1,-10.8,3,1],[29,1,-18,4,0]];
  for(const [cx,cy,cz,color,form]of patches)for(let i=0;i<15;i++){
    const a=i*2.399963,r=Math.sqrt((i+.5)/15)*.85,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,h=.5+(i%4)*.085,m=accentMats[(color+(i%5===0?1:0))%accentMats.length];
    instance(stemG,foliage[0],[x,cy+h/2,z],[0,0,0],[1,h,1]);
    for(let j=0;j<3;j++)instance(leafG,foliage[(i+j)%3],[x,cy+.06,z],[.1,a+j*TAU/3,0],[.65,.55,.65]);
    if(form===2){for(let k=0;k<5;k++)for(let j=0;j<3;j++){const q=a+j*TAU/3+k*.6;instance(budG,m,[x+Math.sin(q)*.065,cy+h+k*.065,z+Math.cos(q)*.065],[0,q,.3],[.065,.06,.05]);}}
    else{for(let j=0;j<(form===1?5:7);j++)instance(largeG,m,[x,cy+h,z],[form===1?-.55:.12,a+j*TAU/(form===1?5:7),0],[.48,.5,.48]);instance(beadG,accentMats[4],[x,cy+h+.035,z],[0,0,0],[1.5,1.2,1.5]);}
  }
  const lilyPad=new T.CircleGeometry(.42,24,.15,TAU-.3);lilyPad.rotateX(-Math.PI/2);
  for(const [cx,cz]of [[-5.8,2.5],[-8.4,-2.2],[8.5,-8]])for(let i=0;i<3;i++){
    const a=i*2.4,x=cx+Math.sin(a)*.65,z=cz+Math.cos(a)*.65;
    instance(lilyPad,foliage[2],[x,.085,z],[0,a,0]);
    if(i!==1){for(let j=0;j<7;j++)instance(largeG,accentMats[3],[x,.12,z],[-.2,j/7*TAU+a,0],[.5,.5,.5]);instance(beadG,accentMats[4],[x,.2,z],[0,0,0],[1.6,1.6,1.6]);}
  }
  let instances=0;
  for(const {g,m,transforms}of batches.values()){
    const o=new T.InstancedMesh(g,m,transforms.length);transforms.forEach((matrix,i)=>o.setMatrixAt(i,matrix));o.castShadow=true;o.receiveShadow=true;o.computeBoundingSphere();scene.add(o);instances+=transforms.length;
  }
  return {instances,trees:4,flowerbeds:4,terraces:6,plantedIslands:7,accentPatches:patches.length,waterGardens:3};
}
