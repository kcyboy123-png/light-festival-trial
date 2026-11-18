import * as T from 'three';
import {loadModel} from './load-model.js';
import {barkTex,foliageDetailTex,surfaceData} from './garden-textures.js';

// Forest-studio meshes and piano-forest material/normal treatment, copied locally.
export async function plantBorders(scene, lightMats) {
  const placements={cherry:[[-17,1,-11,1.65,.6],[29,1,-18,1.9,2],[-29,1,-32,2.2,1],[30,1,-37,2.4,2],[-12,1,17,1.45,1]],hydrangea:[],liriope:[]};
  for(const side of [-1,1])for(let i=0;i<16;i++){
    const z=14+i*.6,x=side*(6.9+Math.sin(i*.7)*.5);
    placements.hydrangea.push([x,1.1,z,.83+(i%3)*.16,i*2.4]);
    placements.liriope.push([x-side*1.35,1.1,z+.4,1.1,i*1.6]);
  }
  for(let i=0;i<12;i++)for(const side of [-1,1]){
    placements.hydrangea.push([side*(13.5+i*.55),.95,-18+Math.sin(i*.6)*.8,1.1+(i%3)*.12,i]);
    placements.liriope.push([side*(13.2+i*.55),.95,-16.8+Math.sin(i*.6)*.55,1.3,i]);
  }
  const stats={plants:0,parts:0,models:[]},kinds=Object.keys(placements);
  const models=await Promise.all(kinds.map(kind=>loadModel(`./assets/garden/${kind}.glb`)));
  for(const [index,kind] of kinds.entries()){
    const locations=placements[kind],gltf=models[index];gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(o=>{
      if(!o.isMesh)return;
      const name=o.material.name,g=o.geometry.clone().applyMatrix4(o.matrixWorld);
      if(!g.attributes.position.array.every(Number.isFinite))throw Error('Invalid garden mesh');
      const bark=name==='bark',leaf=['leaf','sepal','grass'].includes(name),petal=['petal','floret','blossom'].includes(name);
      if(leaf||name==='blossom'){
        const n=g.attributes.normal,p=g.attributes.position,v=new T.Vector3(),up=new T.Vector3();
        for(let i=0;i<n.count;i++){v.fromBufferAttribute(n,i);if(v.y<0)v.negate();up.set(p.getX(i)*.25,.8,p.getZ(i)*.25).normalize();v.lerp(up,.35).normalize();n.setXYZ(i,v.x,v.y,v.z);}
      }
      const m=new T.MeshStandardMaterial({vertexColors:!!g.attributes.color&&!bark,color:bark?0xb3a8a1:petal?0xffffff:0x99c9bc,map:bark?barkTex():leaf?foliageDetailTex():null,roughness:bark?.88:.63,side:bark?T.FrontSide:T.DoubleSide,bumpMap:bark?surfaceData(barkTex()):null,bumpScale:.035,envMapIntensity:.25});
      if(petal){m.emissive.set(0xffe5d6);m.emissiveIntensity=.48;m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#if defined(USE_COLOR) || defined(USE_COLOR_ALPHA) || defined(USE_INSTANCING_COLOR)\n totalEmissiveRadiance*=vColor.rgb;\n#endif');};lightMats.push({m,stage:2,power:.48});}
      const mesh=new T.InstancedMesh(g,m,locations.length),dummy=new T.Object3D();
      locations.forEach(([x,y,z,s,a],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,a,0);dummy.scale.setScalar(s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(petal){const colors=kind==='cherry'?[0xf3b3cc,0xe8b7de,0xf6c9b7]:z>0?(x<0?[0xefb370,0xe991ad,0xe4c67e]:[0xeb8fb9,0xc29ce9,0xe6b0ce]):[0x81bfdb,0x98a4e8,0x89caba];mesh.setColorAt(i,new T.Color(colors[i%colors.length]));}});
      mesh.name=`forest-${kind}-${name}`;mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);stats.parts++;
    });
    stats.plants+=locations.length;stats.models.push(kind);
  }
  return stats;
}
