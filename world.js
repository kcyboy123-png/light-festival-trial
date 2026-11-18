import * as T from 'three';
import {softenOccluder,inFoxCutout} from './camera-visibility.js';
import {Water} from 'three/addons/objects/Water.js';
import {createStarfox} from './character.js';
import {createGardens} from './gardens.js';
import {plantBorders,loadGardenModels} from './planted-borders.js';
import {createAwakening} from './awakening.js';
import {createCarousel,bakeMeshes} from './carousel-world.js';
import {createFestivalReveal} from './festival-reveal.js';
import {createGardenCuriosities} from './garden-curiosities.js';
import {createFlowerClue} from './flower-clue.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const V=(x,y,z)=>new T.Vector3(x,y,z), TAU=Math.PI*2;
const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
export async function createWorld(scene,renderer,quality='high'){
  const [character,plantModels,skyTexture]=await Promise.all([createStarfox(renderer),loadGardenModels(),new T.TextureLoader().loadAsync('./assets/night-panorama.webp')]);
  let seed=917;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const staticRoot=new T.Group();scene.add(staticRoot);
  const walkMeshes=[],lightMats=[],petals=[],nodes=[],edges=[],stations=[],obstacles=[];
  const cameraFocus={value:new T.Vector3()},cameraFollowing={value:1};
  const moon=new T.DirectionalLight(0xc9dcff,.8);moon.position.set(-30,38,12);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:110});moon.shadow.bias=-.0005;moon.shadow.normalBias=.045;scene.add(moon);
  const ambient=new T.HemisphereLight(0x9cb8eb,0x151c36,1.0);scene.add(ambient);
  const warm=new T.PointLight(0xffd29b,90,30,2);warm.position.set(-12,4,0);scene.add(warm);
  const flowerLight=new T.PointLight(0xd4a4ff,160,32,2);flowerLight.position.set(0,5,-7);scene.add(flowerLight);
  const entranceLight=new T.PointLight(0xffdba6,26,15,2);entranceLight.position.set(-2,5,15);scene.add(entranceLight);
  function mat(color,rough=.35,metal=.3){return new T.MeshStandardMaterial({color,roughness:rough,metalness:metal,envMapIntensity:.16});}
  const stone=mat(0xd2d8e0,.34,.22),trim=mat(0xb9c7d8,.23,.65),gold=mat(0xbba16c,.22,.85),darkStone=mat(0x53627c,.32,.25),soil=mat(0x111d2b,.95,.02),leaf=mat(0x234b49,.65,.1);
  // World-space mineral veins preserve detail on curved paving without a stretched bitmap.
  stone.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStone;').replace('#include <begin_vertex>','#include <begin_vertex>\nvStone=(modelMatrix*vec4(position,1.)).xyz;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vStone;').replace('#include <color_fragment>',`#include <color_fragment>
    float vein=pow(abs(sin(vStone.x*1.1+vStone.z*.65+sin(vStone.z*1.5)*.3+sin(vStone.x*4.)*.08)),36.);
    float grain=fract(sin(dot(vStone.xz,vec2(12.9898,78.233)))*43758.5453);
    diffuseColor.rgb*=.88+grain*.08-vein*.08;`);};
  function glow(color,stage=2,power=3){const m=mat(0x778797,.25,.52);m.emissive=new T.Color(color);m.emissiveIntensity=power;lightMats.push({m,stage,power});return m;}
  const amber1=glow(0xffbc61,1,2.8),cyan1=glow(0x5de3f5,1,2.1),amber2=glow(0xffc578,2,2.5),pink=glow(0xf56db3,2,1.5),cyan=glow(0x73e7fa,2,2.0),violet=glow(0xbfa0ff,2,2.0);
  function mesh(g,m,p=[0,0,0],parent=staticRoot){const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=!m.transparent;o.receiveShadow=true;parent.add(o);return o;}
  function tube(points,r,m,parent=staticRoot,segments=64){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,8,false),m,[0,0,0],parent);}
  function ring(x,y,z,r,m,thick=.025,parent=staticRoot){const o=mesh(new T.TorusGeometry(r,thick,8,96),m,[x,y,z],parent);o.rotation.x=Math.PI/2;return o;}
  function cyl(x,y,z,r,h,m,r2=r,parent=staticRoot){return mesh(new T.CylinderGeometry(r2,r,h,64,1),m,[x,y+h/2,z],parent);}
  function node(p,radius=.75){const point=p.clone();point.walkRadius=radius;nodes.push(point);edges.push([]);return nodes.length-1;}
  function link(a,b){edges[a].push(b);edges[b].push(a);}
  function path(points,width,material,illumination,arch=0,walkable=true){
    const curve=new T.CatmullRomCurve3(points),left=[],right=[],verts=[],uv=[],idx=[],ids=[];const count=100;
    for(let i=0;i<=count;i++){const t=i/count,p=curve.getPoint(t),d=curve.getTangent(t),n=V(-d.z,0,d.x).normalize();p.y+=Math.sin(t*Math.PI)*arch;left.push(p.clone().addScaledVector(n,width/2));right.push(p.clone().addScaledVector(n,-width/2));for(const q of [left[i],right[i]]){verts.push(q.x,q.y,q.z);uv.push(i/12,q===left[i]?0:1);}if(i<count){let k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}if(walkable&&i%2===0){ids.push(node(p,width/2-.45));if(ids.length>1)link(ids.at(-2),ids.at(-1));}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const road=mesh(g,material);road.material.side=T.DoubleSide;if(walkable)walkMeshes.push(road);
    for(const side of [left,right]){tube(side,.14,trim);tube(side.map(p=>p.clone().add(V(0,.17,0))),.035,illumination);tube(side.map(p=>p.clone().add(V(0,-.24,0))),.16,darkStone);}
    for(let i=0;i<=count;i+=5){tube([left[i].clone().add(V(0,.014,0)),right[i].clone().add(V(0,.014,0))],.008,trim,staticRoot,1);}
    return {curve,ids,left,right};
  }
  const mainPath=path([V(0,1.2,31),V(-2,1.2,20),V(1.4,1.2,10),V(-.8,1.2,4),V(0,1.2,.3)],5.0,stone,amber2);
  const bridge=path([V(-.8,1.2,10),V(-10,1.2,8),V(-17,1.2,2),V(-13,1.2,-6),V(-7,1.2,-8)],3.5,stone,amber1,1.1);
  link(mainPath.ids[25],bridge.ids[0]);
  // Circular walkable platform keeps the flower's collision boundary explicit.
  cyl(0,.1,-8,8.4,.88,darkStone);cyl(0,.98,-8,8.1,.22,stone);
  const loop=[];for(let i=0;i<96;i++){const a=i/96*TAU;loop.push(node(V(Math.sin(a)*6.8,1.2,-8+Math.cos(a)*6.8)));if(i)link(loop[i-1],loop[i]);}link(loop.at(-1),loop[0]);link(mainPath.ids.at(-1),loop[0]);link(bridge.ids.at(-1),loop[72]);
  const plaza=mesh(new T.RingGeometry(4.7,8.1,96),stone,[0,1.205,-8]);plaza.rotation.x=-Math.PI/2;walkMeshes.push(plaza);
  // The graph's entrance link also needs continuous floor at the circular rim.
  const plazaEntry=mesh(new T.BoxGeometry(4.2,.16,1.6),stone,[0,1.12,-.35]);walkMeshes.push(plazaEntry);
  for(const r of [5,5.25,7.7,8.05])ring(0,1.23,-8,r,r===5.25?amber2:gold,.025);
  for(let i=0;i<24;i++){const a=i/24*TAU;tube([V(Math.sin(a)*5.35,1.22,-8+Math.cos(a)*5.35),V(Math.sin(a)*7.5,1.22,-8+Math.cos(a)*7.5)],.012,trim,staticRoot,1);}
  const carouselRoute=path([nodes[bridge.ids[13]].clone(),V(-14,1.2,12),V(-17.7,1.2,14)],3.0,stone,amber1);
  link(bridge.ids[13],carouselRoute.ids[0]);
  cyl(-25,.1,14,8.5,.88,darkStone);cyl(-25,.98,14,8.4,.22,stone);
  const carouselLoop=[];for(let i=0;i<64;i++){const a=i/64*TAU;carouselLoop.push(node(V(-25+Math.sin(a)*7.3,1.2,14+Math.cos(a)*7.3)));if(i)link(carouselLoop[i-1],carouselLoop[i]);}link(carouselLoop[63],carouselLoop[0]);link(carouselRoute.ids.at(-1),carouselLoop[16]);
  const carouselWalk=mesh(new T.RingGeometry(6.15,8.4,96),stone,[-25,1.205,14]);carouselWalk.rotation.x=-Math.PI/2;walkMeshes.push(carouselWalk);
  ring(-25,1.23,14,8.25,gold,.055);ring(-25,1.23,14,6.3,gold,.04);
  const carouselStation={position:V(-17.7,3,14),node:carouselLoop[16],name:'회전목마 광장'};
  // Fountain steps, petal sculpture and a fine circular water curtain.
  for(let i=0;i<4;i++){cyl(0,1.2+i*.16,-8,4.8-i*.22,.16,i%2?trim:stone);ring(0,1.35+i*.16,-8,4.74-i*.22,i===2?amber2:gold,.024);}
  const flowerRoot=new T.Group();flowerRoot.position.set(0,1.9,-8);scene.add(flowerRoot);
  function petalGeometry(length,width,rise,rows=32,columns=16){const v=[],uv=[],indices=[];for(let j=0;j<=rows;j++){let t=j/rows;for(let i=0;i<=columns;i++){let u=i/columns*2-1;const w=Math.pow(Math.sin(Math.PI*t),.72)*width;v.push(u*w,rise*t+u*u*.55*Math.sin(Math.PI*t),length*Math.pow(t,1.45));uv.push(i/columns,t);}}for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const k=j*(columns+1)+i;indices.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
  function petalMaterial(color){const m=new T.MeshPhysicalMaterial({color:0x476586,metalness:.5,roughness:.22,envMapIntensity:.35,side:T.DoubleSide,clearcoat:1,clearcoatRoughness:.15,iridescence:.8,iridescenceIOR:1.35,emissive:color,emissiveIntensity:1.2});lightMats.push({m,stage:2,power:1.5,mission:2});m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 petalUV;').replace('#include <begin_vertex>','#include <begin_vertex>\npetalUV=uv;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 petalUV;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    float mid=abs(petalUV.x-.5)*2.;
    float vein=pow(abs(cos((mid*12.-petalUV.y*2.)*3.14159)),22.);
    totalEmissiveRadiance*=.22+pow(mid,5.)*.7+vein*.35+pow(petalUV.y,3.)*.55;
    diffuseColor.rgb*=.8+petalUV.y*.2;`);};return m;}
  const petalMaterials=[petalMaterial(0x8c82ff),petalMaterial(0xeb84cc),petalMaterial(0x66d9f1)];
  function flower(parent,scale=1,animated=false){const root=new T.Group();root.scale.setScalar(scale);parent.add(root);for(let layer=0;layer<2;layer++){const count=layer?8:10,length=layer?2.7:4.1,width=layer?.68:1.05,rise=layer?4.6:2.85;const g=petalGeometry(length,width,rise);for(let i=0;i<count;i++){const pivot=new T.Group();pivot.rotation.y=i/count*TAU+layer*.25;root.add(pivot);const part=new T.Group();pivot.add(part);mesh(g,petalMaterials[(i+layer)%3],[0,0,0],part);for(const side of [-1,1]){let points=[];for(let k=0;k<=36;k++){const t=k/36;points.push(V(side*Math.pow(Math.sin(Math.PI*t),.72)*width,rise*t+.55*Math.sin(Math.PI*t),length*Math.pow(t,1.45)));}tube(points,.022,layer?amber2:violet,part,40);}const center=[];for(let k=0;k<=32;k++){const t=k/32;center.push(V(0,rise*t+.025,length*Math.pow(t,1.45)));}tube(center,.014,amber2,part,32);if(animated){bakeMeshes(part);petals.push({part,layer});}}}
    const core=new T.Group();root.add(core);    const heart=mesh(new T.SphereGeometry(.64,24,32),amber2,[0,2,0],core);heart.scale.set(.7,1.9,.7);for(let i=0;i<9;i++){const a=i/9*TAU;tube([V(0,.2,0),V(Math.sin(a)*.55,1.8,Math.cos(a)*.55),V(Math.sin(a)*.3,3.4,Math.cos(a)*.3)],.025,amber2,core,30);}bakeMeshes(core);core.updateMatrix();core.matrixAutoUpdate=false;return root;}
  flower(flowerRoot,1.15,true);
  const fountainJets=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:{value:0},light:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;uniform float light;void main(){float bead=pow(.5+.5*sin(vUv.x*100.-time*6.),12.);float edge=.25+.75*pow(abs(sin(vUv.y*3.14159)),2.);vec3 color=mix(vec3(.25,.75,.9),vec3(1.,.85,.65),bead);gl_FragColor=vec4(color*(1.+bead),(.25+.65*bead)*edge*light);}' });
  const jetParts=[];for(let i=0;i<24;i++){const a=i/24*TAU,dx=Math.sin(a),dz=Math.cos(a);const c=new T.QuadraticBezierCurve3(V(dx*4.1,1.83,-8+dz*4.1),V(dx*3.7,4.5,-8+dz*3.7),V(dx*2.8,1.9,-8+dz*2.8));jetParts.push(new T.TubeGeometry(c,36,.022,5,false));}const jetMesh=new T.Mesh(mergeGeometries(jetParts),fountainJets);scene.add(jetMesh);
  const splash=glow(0x9ce5ed,2,1.15);lightMats.at(-1).mission=2;
  for(let i=0;i<24;i++){const a=i/24*TAU,x=Math.sin(a),z=Math.cos(a);cyl(x*4.1,1.8,-8+z*4.1,.065,.09,gold);for(const r of [.12,.24])ring(x*2.8,1.91,-8+z*2.8,r,splash,.012);}
  const chalice=[new T.Vector2(.45,0),new T.Vector2(.35,.15),new T.Vector2(.38,.4),new T.Vector2(.65,.65),new T.Vector2(1.1,.85)];mesh(new T.LatheGeometry(chalice,48),gold,[0,1.84,-8]);ring(0,2.69,-8,1.1,amber2,.026);
  const curtainMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},light:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;uniform float light;void main(){float stripe=pow(abs(sin(vUv.x*260.+sin(vUv.x*41.)*2.)),18.);float flow=.5+.5*sin(vUv.y*44.+time*3.+vUv.x*11.);float alpha=(.03+stripe*.3)*smoothstep(0.,.15,vUv.y);gl_FragColor=vec4(mix(vec3(.1,.25,.4),vec3(.8,.7,1.8),light)*(1.+flow*.35),alpha);}`});
  mesh(new T.CylinderGeometry(4.24,4.24,.52,128,1,true),curtainMaterial,[0,1.44,-8]);
  // Oval crown above the plaza. Curved ribs terminate at feet instead of floating.
  for(const y of [11.65,12.0]){let points=[];for(let i=0;i<=180;i++){const a=i/180*TAU;points.push(V(Math.cos(a)*10.8,y,-8+Math.sin(a)*8.6));}tube(points,.09,trim);tube(points.map(p=>p.clone().add(V(0,.14,0))),.035,amber2);}
  for(let i=0;i<20;i++){const a=i/20*TAU;for(const side of [-1,1]){const points=[];for(let k=0;k<=24;k++){const t=k/24,angle=a+side*.12*Math.sin(t*Math.PI);points.push(V(Math.cos(angle)*10.8,11.85+Math.sin(t*Math.PI)*.9,-8+Math.sin(angle)*8.6));}tube(points,.025,amber2,staticRoot,24);}const jewel=mesh(new T.OctahedronGeometry(.13,0),cyan,[Math.cos(a)*10.8,12.83,-8+Math.sin(a)*8.6]);jewel.scale.y=1.8;}
  for(const a of [-.4,Math.PI+.4,-Math.PI/2]){const x=Math.cos(a)*10.8,z=-8+Math.sin(a)*8.6;const pts=[V(x,1.1,z),V(x*.95,4,z),V(x*.8,8,z),V(x*.85,11,z),V(x,12,z)];tube(pts,.22,stone);tube(pts.map(p=>p.clone().add(V(.26,0,.05))),.035,amber2);cyl(x,.1,z,.65,1.1,stone);}
  function pointedArch(x,y,z,width,height,rotation,lit=amber2,parent=staticRoot){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);const pts=[V(-width/2,0,0),V(-width/2,height*.5,0),V(-width*.36,height*.78,0),V(0,height,0),V(width*.36,height*.78,0),V(width/2,height*.5,0),V(width/2,0,0)];tube(pts,.13,stone,g,48);tube(pts.map(p=>p.clone().add(V(0,0,.14))),.025,lit,g,48);for(const sx of [-1,1])cyl(sx*width/2,0,0,.28,.38,gold,.28,g);return g;}
  // Far arcades create a readable sense of city depth.
  const cityCurve=[];for(let i=0;i<=100;i++){const a=Math.PI*.06+i/100*Math.PI*.88;cityCurve.push(V(Math.cos(a)*36,.85,-9-Math.sin(a)*29));}path(cityCurve.filter((_,i)=>i%5===0),4,stone,amber2,0,false);for(const y of [1.5,6.5])tube(cityCurve.map(p=>p.clone().add(V(0,y,0))),.14,stone);tube(cityCurve.map(p=>p.clone().add(V(0,6.65,0))),.025,amber2);
  const windowM=mat(0x273b59,.22,.6);windowM.emissive=new T.Color(0xbb6e32);lightMats.push({m:windowM,stage:2,power:.18});
  for(let i=0;i<23;i++){let a=Math.PI*.08+i/22*Math.PI*.84;let x=Math.cos(a)*36,z=-9-Math.sin(a)*29;const arch=pointedArch(x,1,z,3.6,5.4,-a+Math.PI/2);const shape=new T.Shape();shape.moveTo(-1.65,0);shape.lineTo(-1.65,2.7);shape.quadraticCurveTo(-1.65,4.2,0,5.25);shape.quadraticCurveTo(1.65,4.2,1.65,2.7);shape.lineTo(1.65,0);shape.closePath();mesh(new T.ShapeGeometry(shape,24),windowM,[0,0,-.16],arch);cyl(x,.1,z,2.15,.9,darkStone);}
  function spire(x,z,height,radius){cyl(x,.1,z,radius,1.4,stone);const profile=[[radius*.9,1.4],[radius*.8,2],[radius*.64,height*.19],[radius*.57,height*.4],[radius*.47,height*.56],[radius*.32,height*.7],[radius*.19,height*.84],[.035,height]].map(p=>new T.Vector2(...p));mesh(new T.LatheGeometry(profile,32),darkStone,[x,0,z]);for(let i=0;i<8;i++){const a=i/8*TAU;const dx=Math.sin(a),dz=Math.cos(a);const points=[V(x+dx*radius*1.04,1.5,z+dz*radius*1.04),V(x+dx*radius*.72,height*.25,z+dz*radius*.72),V(x+dx*radius*.67,height*.53,z+dz*radius*.67),V(x+dx*radius*.31,height*.8,z+dz*radius*.31),V(x,height,z)];tube(points,.15,stone);tube(points.map(p=>p.clone().add(V(dx*.2,0,dz*.2))),.032,i%2?cyan:amber2);pointedArch(x+dx*radius*.8,2,z+dz*radius*.8,1.2,height*.29,a,amber2);pointedArch(x+dx*radius*.57,height*.35,z+dz*radius*.57,.9,height*.28,a,violet);}
    for(const y of [2,height*.33])ring(x,y,z,radius*(y===2?.84:.68),gold,.055);}
  spire(5,-29,27,3.2);spire(-21,-24,15,2.1);spire(27,-26,18,2.3);
  // Right-hand glass garden: ribbed dome and luminous botanical sculptures.
  const pavilion=new T.Group();pavilion.position.set(19,1,-9);staticRoot.add(pavilion);cyl(0,-.9,0,6,.9,stone,6,pavilion);ring(0,.1,0,5.9,amber2,.035,pavilion);
  for(let i=0;i<12;i++){const a=i/12*TAU;const pts=[];for(let j=0;j<=40;j++){const t=j/40;const r=5.6*Math.cos(t*Math.PI/2);pts.push(V(Math.sin(a)*r,1+t*7.1,Math.cos(a)*r));}tube([V(Math.sin(a)*5.6,0,Math.cos(a)*5.6),...pts],.12,trim,pavilion);tube(pts.map(p=>p.clone().add(V(0,.05,0))),.021,amber2,pavilion);pointedArch(Math.sin(a)*5.6,0,Math.cos(a)*5.6,2.55,4,a,amber2,pavilion);}
  for(const y of [1,3,4.8,6.3])ring(0,y,0,5.6*Math.cos(Math.max(0,(y-1))/7.1*Math.PI/2),gold,.05,pavilion);
  const glass=new T.MeshPhysicalMaterial({color:0x9eb6d1,metalness:.35,roughness:.15,transparent:true,opacity:.11,side:T.DoubleSide,depthWrite:false});const dome=mesh(new T.SphereGeometry(5.6,48,24,0,TAU,0,Math.PI/2),glass,[0,1,0],pavilion);dome.scale.y=1.27;
  for(let i=0;i<3;i++){const f=new T.Group();f.position.set((i-1)*2.7,.3,-.4+(i%2)*1.3);pavilion.add(f);flower(f,.43,false);}
  // Lanterns and the curved balustrade on the left bridge.
  function lantern(x,y,z,scale=1,stage=1,mission=null){obstacles.push({x,z,radius:.48*scale+.35});const group=new T.Group();group.position.set(x,y,z);group.scale.setScalar(scale);staticRoot.add(group);let glowM=stage===1?amber1:amber2,coreM=stage===1?cyan1:cyan;if(mission!==null){glowM=glowM.clone();coreM=coreM.clone();lightMats.push({m:glowM,stage,power:stage===1?2.8:2.5,mission},{m:coreM,stage,power:stage===1?2.1:2,mission});}for(const m of [glowM,coreM])softenOccluder(m,cameraFocus,cameraFollowing);cyl(0,0,0,.48,.23,stone,.48,group);cyl(0,.23,0,.27,.25,gold,.2,group);cyl(0,.48,0,.09,2.45,trim,.065,group);for(let j=0;j<5;j++){const a=j/5*TAU;const pts=[];for(let k=0;k<=40;k++){const t=k/40;const r=.42*Math.pow(Math.sin(Math.PI*t),.8);pts.push(V(Math.sin(a)*r,2.65+t*1.65,Math.cos(a)*r));}tube(pts,.027,glowM,group,40);}const lamp=mesh(new T.SphereGeometry(.22,16,24),coreM,[0,3.4,0],group);lamp.scale.y=2;ring(0,2.65,0,.18,gold,.04,group);cyl(0,4.27,0,.08,.28,glowM,0,group);}
  for(const t of [.28,.49,.7]){const p=bridge.curve.getPoint(t),d=bridge.curve.getTangent(t);if(t===.28)p.addScaledVector(V(-d.z,0,d.x).normalize(),1.25);else p.x-=1.5;p.y+=Math.sin(t*Math.PI)*1.1;lantern(p.x,p.y,p.z,1.12,1,1);if(t===.49)stations[1]={position:V(p.x,p.y+4.8,p.z),node:bridge.ids[25],name:'다리의 가로등'};}
  for(const side of [bridge.left,bridge.right]){tube(side.map(p=>p.clone().add(V(0,.8,0))),.065,stone);tube(side.map(p=>p.clone().add(V(0,.84,0))),.021,amber1);for(let i=4;i<side.length-4;i+=6){let p=side[i];cyl(p.x,p.y,p.z,.065,.8,trim);}}
  // Match the notebook's three stars to a landmark visible from either side of the rail.
  const bridgeStars=new T.Group();bridgeStars.position.copy(bridge.left[50]).add(V(0,1.12,0));bridgeStars.rotation.y=Math.PI/6;staticRoot.add(bridgeStars);
  const starShape=new T.Shape();for(let i=0;i<8;i++){const a=Math.PI/2+i/8*TAU,r=i%2?.085:.27;if(i===0)starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);else starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();
  const starGeometry=new T.ExtrudeGeometry(starShape,{depth:.07,bevelEnabled:true,bevelThickness:.025,bevelSize:.018,bevelSegments:2});starGeometry.translate(0,0,-.035);const starGold=gold.clone();starGold.emissive.set(0xd9b46c);starGold.emissiveIntensity=.35;for(let i=-1;i<=1;i++){const mount=new T.Group();mount.position.set(i*.8,i===0?.32:0,0);bridgeStars.add(mount);for(const angle of [0,Math.PI/2]){const star=mesh(starGeometry,starGold,[0,0,0],mount);star.rotation.y=angle;star.scale.setScalar(1.15);}const frame=mesh(new T.TorusGeometry(.39,.018,6,40),gold,[0,0,0],mount);frame.rotation.y=Math.PI/6;}
  tube([V(-1.18,-.37,0),V(-.8,-.48,0),V(0,-.18,0),V(.8,-.48,0),V(1.18,-.37,0)],.025,gold,bridgeStars,32);
  for(const x of [-.8,.8])tube([V(x,-.48,0),V(x,-.8,0)],.035,trim,bridgeStars,1);
  for(const t of [.1,.28,.5,.72]){const p=mainPath.curve.getPoint(t);lantern(p.x+2.85,1.2,p.z,.54,2);if(t===.5)stations[0]={position:V(p.x+2.85,4.0,p.z),node:mainPath.ids[25],name:'꽃길의 가로등'};}
  // Keep the lamp base outside the circular walking line, including the fox's clearance.
  lantern(3.45,1.2,-1.2,.72,2,2);stations[2]={position:V(3.45,4.8,-1.2),node:loop[12],name:'광장의 가로등'};
  const gardenStats=createGardens(scene,{root:staticRoot,mesh,tube,cyl,ring,arch:pointedArch,mat,glow,stone,gold,trim,soil,amber:amber2,violet,petalGeometry,random,cameraFocus,cameraFollowing});
  gardenStats.transplants=plantBorders(scene,lightMats,plantModels);
  // Portal frames in the foreground echo the original image's overhead architecture.
  for(const side of [-1,1]){let x=side*15;const pts=[V(x,0,15),V(x,10,10),V(x*.9,17,0),V(x*.55,22,-6),V(0,23,-9)];tube(pts,.32,stone);tube(pts.map(p=>p.clone().add(V(-side*.34,0,.12))),.045,amber2);}
  for(const m of [stone,trim,gold,amber2,violet,...petalMaterials])softenOccluder(m,cameraFocus,cameraFollowing);
  // Keep nearby material batches separate so off-screen districts can be culled.
  staticRoot.updateMatrixWorld(true);const batches=new Map();
  staticRoot.traverse(o=>{if(!o.isMesh||walkMeshes.includes(o)||o.material.transparent||o.material===curtainMaterial)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));g.computeBoundingBox();const center=g.boundingBox.getCenter(new T.Vector3()),key=`${o.material.uuid}:${Math.floor(center.x/36)}:${Math.floor(center.z/36)}`;if(!batches.has(key))batches.set(key,{m:o.material,geos:[],objects:[]});batches.get(key).geos.push(g);batches.get(key).objects.push(o);});
  for(const {m,geos,objects}of batches.values()){const merged=mergeGeometries(geos,false);if(merged){const o=new T.Mesh(merged,m);o.updateMatrix();o.matrixAutoUpdate=false;o.castShadow=true;o.receiveShadow=true;scene.add(o);for(const old of objects)old.removeFromParent();}geos.forEach(g=>g.dispose());}
  const emptyGroups=[];staticRoot.traverse(o=>{if(o.isGroup)emptyGroups.push(o);});for(const o of emptyGroups.reverse())if(o!==staticRoot&&!o.children.length)o.removeFromParent();
  staticRoot.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});
  skyTexture.colorSpace=T.SRGBColorSpace;skyTexture.anisotropy=4;
  const sky=mesh(new T.CylinderGeometry(150,150,105,160,1,true),new T.MeshBasicMaterial({map:skyTexture,side:T.BackSide,fog:false,color:0x9aaacc}),[0,43,0],scene);sky.rotation.y=-Math.PI*.2;sky.castShadow=false;sky.receiveShadow=false;
  const moonCanvas=document.createElement('canvas');moonCanvas.width=moonCanvas.height=512;const moonCtx=moonCanvas.getContext('2d');moonCtx.fillStyle='#b8c8de';moonCtx.fillRect(0,0,512,512);
  for(let i=0;i<190;i++){const x=random()*512,y=random()*512,r=3+random()*33;const crater=moonCtx.createRadialGradient(x,y,0,x,y,r);crater.addColorStop(0,'rgba(55,79,113,.15)');crater.addColorStop(.75,'rgba(65,84,117,.09)');crater.addColorStop(1,'rgba(215,226,246,.1)');moonCtx.fillStyle=crater;moonCtx.beginPath();moonCtx.arc(x,y,r,0,TAU);moonCtx.fill();}
  const moonTexture=new T.CanvasTexture(moonCanvas);moonTexture.colorSpace=T.SRGBColorSpace;
  const moonDisc=mesh(new T.SphereGeometry(2.8,40,24),new T.MeshBasicMaterial({map:moonTexture,color:0xc3d7fa,fog:false}),[-35,30,-78],scene);moonDisc.castShadow=false;moonDisc.receiveShadow=false;
  // Animated aurora curtains are geometry in the world, not a screen overlay.
  const auroras=[];for(let layer=0;layer<3;layer++){const g=new T.PlaneGeometry(180,18,140,12);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setXYZ(i,x,25+y+Math.sin(x*.045+layer*1.6)*6,-75-layer*12+Math.sin(x*.035)*8);}g.computeVertexNormals();const m=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{time:{value:0},strength:{value:1},phase:{value:layer*1.7}},vertexShader:'varying vec2 vUv;uniform float time;uniform float phase;void main(){vUv=uv;vec3 p=position;p.y+=sin(p.x*.075+time*.15+phase)*1.8;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;uniform float strength;uniform float phase;void main(){float wave=.3+sin(vUv.x*7.+time*.07+phase)*.13+sin(vUv.x*19.+phase)*.025;float edge=exp(-pow((vUv.y-wave)*10.,2.));float curtain=exp(-max(0.,vUv.y-wave)*5.)*smoothstep(wave-.04,wave+.03,vUv.y);float threads=.6+.4*pow(.5+.5*sin(vUv.x*550.+sin(vUv.x*44.+time*.13)*4.),3.);float fade=smoothstep(0.,.15,vUv.x)*smoothstep(1.,.8,vUv.x)*smoothstep(1.,.7,vUv.y)*smoothstep(0.,.12,vUv.y);vec3 col=mix(vec3(.05,.8,.72),vec3(.58,.12,.85),clamp(.3+sin(vUv.x*6.+phase)*.3+smoothstep(.3,.85,vUv.y)*.5,0.,1.));float a=(edge*.48+curtain*.21*threads)*fade*strength;gl_FragColor=vec4(col*1.4,a);}`});const o=mesh(g,m,[0,0,0],scene);auroras.push(o);}
  const normalSize=128,data=new Uint8Array(normalSize*normalSize*4);for(let y=0;y<normalSize;y++)for(let x=0;x<normalSize;x++){const i=(y*normalSize+x)*4,u=x/normalSize*TAU,v=y/normalSize*TAU;data[i]=128+Math.sin(u*5+Math.cos(v*3)) *26;data[i+1]=128+Math.cos(v*7+Math.sin(u*2))*24;data[i+2]=244;data[i+3]=255;}
  const normals=new T.DataTexture(data,normalSize,normalSize);normals.wrapS=normals.wrapT=T.RepeatWrapping;normals.magFilter=normals.minFilter=T.LinearFilter;normals.needsUpdate=true;
  const water=new Water(new T.PlaneGeometry(350,350),{textureWidth:1536,textureHeight:1536,waterNormals:normals,sunDirection:moon.position.clone().normalize(),sunColor:0x8199c9,waterColor:0x071323,distortionScale:.38,alpha:1,fog:true});water.rotation.x=-Math.PI/2;water.position.y=.03;scene.add(water);water.material.uniforms.size.value=5;
  let lightQuality=quality==='light',lastReflection=-Infinity,reflectionFrames=0;
  const reflectionPosition=new T.Vector3(Infinity,Infinity,Infinity),reflectionRotation=new T.Quaternion(),reflect=water.onBeforeRender;
  water.onBeforeRender=function(renderer,scene,camera){const now=performance.now(),jumped=reflectionPosition.distanceToSquared(camera.position)>4||Math.abs(reflectionRotation.dot(camera.quaternion))<.98;if(lightQuality&&!jumped&&now-lastReflection<1000/20)return;reflect.call(this,renderer,scene,camera);reflectionFrames++;lastReflection=now;reflectionPosition.copy(camera.position);reflectionRotation.copy(camera.quaternion);};
  const sparksG=new T.BufferGeometry(),sparkPos=[],sparkSeed=[];for(let i=0;i<260;i++){const a=random()*TAU,r=2+random()*26;sparkPos.push(Math.cos(a)*r,1+random()*10,-7+Math.sin(a)*r);sparkSeed.push(random());}sparksG.setAttribute('position',new T.Float32BufferAttribute(sparkPos,3));sparksG.setAttribute('phase',new T.Float32BufferAttribute(sparkSeed,1));
  const sparksM=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:{value:0},strength:{value:1},pixelRatio:{value:1}},vertexShader:'attribute float phase;uniform float time;uniform float pixelRatio;varying float alpha;void main(){vec3 p=position;p.y+=sin(time*.3+phase*20.)*.4;p.x+=cos(time*.2+phase*9.)*.17;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(70./-mv.z,1.,5.)*pixelRatio;alpha=.35+.65*pow(.5+.5*sin(time+phase*40.),3.);}',fragmentShader:'uniform float strength;varying float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(1.8,1.4,.7,pow(max(0.,1.-d),2.)*alpha*strength);}'});scene.add(new T.Points(sparksG,sparksM));
  const hero=character.hero;hero.position.copy(nodes[22]);scene.add(hero);
  const wisp=mesh(new T.SphereGeometry(.095,16,16),new T.MeshBasicMaterial({color:new T.Color(3,1.8,.7)}),[0,0,0],scene);
  const haloTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const cx=c.getContext('2d'),g=cx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,225,160,.8)');g.addColorStop(.12,'rgba(255,197,100,.32)');g.addColorStop(1,'rgba(255,170,80,0)');cx.fillStyle=g;cx.fillRect(0,0,128,128);return new T.CanvasTexture(c);})();
  const halo=new T.Sprite(new T.SpriteMaterial({map:haloTexture,color:0xffd69a,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));halo.scale.setScalar(1.2);scene.add(halo);
  const contact=mesh(new T.PlaneGeometry(1.5,1.1),new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){float a=exp(-dot(vUv-.5,vUv-.5)*15.)*.37;gl_FragColor=vec4(.015,.02,.04,a);}'}),[0,1.225,0],scene);contact.rotation.x=-Math.PI/2;contact.castShadow=false;
  const awakening=createAwakening(scene,lightMats);
  const carousel=createCarousel(scene);
  const firstClue=createFlowerClue(scene,nodes[mainPath.ids[31]]);firstClue.node=mainPath.ids[31];
  const bridgeClue=createFlowerClue(scene,nodes[bridge.ids[44]],'fountain');bridgeClue.node=bridge.ids[44];
  const fountainClue=createFlowerClue(scene,nodes[loop[90]],'carousel');fountainClue.node=loop[90];
  const curiosities=createGardenCuriosities(scene,[nodes[mainPath.ids[16]],nodes[bridge.ids[16]],nodes[loop[48]],nodes[carouselLoop[44]]]);
  const plazas=[{x:0,z:-8,y:1.2,inner:5.15,outer:7.65},{x:-25,z:14,y:1.2,inner:6.6,outer:7.95}];
  const floorRay=new T.Raycaster(),floorOrigin=new T.Vector3(),floorDown=V(0,-1,0),floorHits=[],nearFloor=[];
  const walkBounds=walkMeshes.map(mesh=>{mesh.geometry.computeBoundingBox();return new T.Box3().copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);});
  function floorBelow(p){floorOrigin.set(p.x,6,p.z);floorHits.length=0;floorRay.set(floorOrigin,floorDown);nearFloor.length=0;walkBounds.forEach((b,i)=>{if(p.x>=b.min.x-.001&&p.x<=b.max.x+.001&&p.z>=b.min.z-.001&&p.z<=b.max.z+.001)nearFloor.push(walkMeshes[i]);});return floorRay.intersectObjects(nearFloor,false,floorHits)[0];}
  function onPath(p,from=null){if(obstacles.some(o=>{const d=Math.hypot(p.x-o.x,p.z-o.z);return d<o.radius&&(!from||d<=Math.hypot(from.x-o.x,from.z-o.z)+.000001);}))return false;return !!floorBelow(p);}
  function floorBlocked(ray,floor){
    const meshes=[];scene.traverse(o=>{if(!o.isMesh||walkMeshes.includes(o))return;for(let p=o;p;p=p.parent)if(p===hero||!p.visible)return;const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>!m.transparent&&m.opacity>0))meshes.push(o);});
    const far=ray.far;ray.far=floor.distance-.04;const hits=ray.intersectObjects(meshes,false);ray.far=far;
    return hits.some(h=>{const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;if(m.transparent||(m.userData.foxCutout&&cameraFollowing.value>.5&&inFoxCutout(h.point,ray.ray.origin,cameraFocus.value)))return false;
      const below=floorBelow(h.point);return !below||h.point.y>below.point.y+.15;
    });
  }
  const festival=createFestivalReveal(scene);
  const guideLight=new T.PointLight(0xcce6ff,5,7,2);scene.add(guideLight);
  let current=2;let moving=false;
  function update(time,dt,state,reduceMotion=false){
    cameraFocus.value.copy(hero.position);cameraFocus.value.y+=1.4;
    current=T.MathUtils.damp(current,state,2.1,dt);
    const game=awakening.enabled,progress=awakening.progress;
    const first=game?Math.max(progress[0],progress[1]):smooth(.05,.95,current),full=game?progress[2]:smooth(1.05,1.95,current);
    for(const {m,stage,power}of lightMats)m.emissiveIntensity=power*(game?1:stage===1?first:full);
    warm.intensity=game?progress[1]*45:first*65;flowerLight.intensity=full*85;entranceLight.intensity=game?progress[0]*22:2+full*24;
    ambient.intensity=game?.17+first*.12+full*.28:.4+full*.35;moon.intensity=game?.32+full*.28:.85;
    guideLight.intensity=game?3+festival.energy*32:0;guideLight.color.set(festival.energy>0?0xffd49b:0xcce6ff);guideLight.position.set(hero.position.x-2,hero.position.y+4,hero.position.z+2);
    curtainMaterial.uniforms.time.value=reduceMotion?0:time;curtainMaterial.uniforms.light.value=full;water.material.uniforms.time.value=reduceMotion?0:time*.23;
    for(const o of auroras){o.visible=full>0;const m=o.material;m.uniforms.strength.value=full*.65;m.uniforms.time.value=reduceMotion?0:time;}
    sparksM.uniforms.time.value=reduceMotion?0:time;sparksM.uniforms.strength.value=.02+full*.98;sparksM.uniforms.pixelRatio.value=renderer.getPixelRatio();
    for(const p of petals)p.part.rotation.x=(1-full)*-.4+(reduceMotion?0:Math.sin(time*.35+p.layer)*.008*full);
    wisp.position.set(hero.position.x+.85,hero.position.y+1.6+(reduceMotion?0:Math.sin(time*1.8)*.12),hero.position.z-.3);halo.position.copy(wisp.position);hero.position.y=(hero.userData.baseY||1.2);
    awakening.update(reduceMotion?0:time,renderer.getPixelRatio());
    if(!game)carousel.setLight(full);carousel.update(time,dt,reduceMotion);
    if(!game){firstClue.setReveal(first);bridgeClue.setReveal(first);fountainClue.setReveal(full);}
    curiosities.update(dt,hero.position,reduceMotion);festival.update(renderer.getPixelRatio());
  }
  function snap(state){current=state;update(0,1,state,true);}
  const updateScene=update;function updateWithHero(time,dt,state,reduceMotion){updateScene(time,dt,state,reduceMotion);fountainJets.uniforms.light.value=awakening.enabled?awakening.progress[2]:smooth(1.05,1.95,current);fountainJets.uniforms.time.value=reduceMotion?0:time;jetMesh.visible=fountainJets.uniforms.light.value>0;contact.position.set(hero.position.x,(hero.userData.baseY||1.2)+.025,hero.position.z);character.update(dt,moving,reduceMotion);}
  function setQuality(v){lightQuality=v==='light';lastReflection=-Infinity;water.getRenderTarget().setSize(lightQuality?960:1536,lightQuality?960:1536);const size=lightQuality?1024:2048;if(moon.shadow.mapSize.x!==size){moon.shadow.map?.dispose();moon.shadow.map=null;moon.shadow.mapSize.set(size,size);renderer.shadowMap.needsUpdate=true;}}
  setQuality(quality);
  return {floorBlocked,cameraFollowing,nodes,edges,plazas,obstacles,onPath,curiosities,hero,walkMeshes,water,gardenStats,stations,awakening,carousel,festival,firstClue,bridgeClue,fountainClue,carouselStation,update:updateWithHero,snap,setQuality,setMoving(v){moving=v;},get reflectionFrames(){return reflectionFrames;},get current(){return current;}};
}
