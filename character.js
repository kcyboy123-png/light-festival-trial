import * as T from 'three';
import {loadModel} from './load-model.js?v=trial-20261120-3';
import {softenStarfox} from './fox-face.js?v=trial-20261120-3';

export async function createStarfox(renderer) {
  const gltf=await loadModel('./assets/starfox.glb');
  const hero=new T.Group(),model=gltf.scene;hero.name='Starfox';hero.add(model);
  model.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Invalid starfox model bounds');
  model.scale.multiplyScalar(2.55/size.y);model.updateMatrixWorld(true);box.setFromObject(model);
  model.position.sub(new T.Vector3((box.min.x+box.max.x)/2,box.min.y,(box.min.z+box.max.z)/2));
  let triangles=0,bones=0;
  model.traverse(o=>{
    if(o.isBone)bones++;
    if(!o.isMesh)return;
    if(o.name==='Starfox_Surface')hero.userData.faceVertices=softenStarfox(o,T);
    triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
    o.castShadow=true;o.receiveShadow=true;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
      m.envMapIntensity=.65;
      for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(m[key])m[key].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    }
  });
  // Path navigation owns horizontal motion; retain the clip's vertical stride and joint rotations.
  for(const clip of gltf.animations)if(/walk/i.test(clip.name))for(const track of clip.tracks){
    if(!/Hips\.position$/.test(track.name))continue;
    const hips=model.getObjectByName(track.name.slice(0,-9));
    if(hips)for(let i=0;i<track.values.length;i+=3){track.values[i]=hips.position.x;track.values[i+2]=hips.position.z;}
  }
  const mixer=new T.AnimationMixer(model);
  const actions=gltf.animations.map(clip=>({name:clip.name,action:mixer.clipAction(clip)}));
  const walk=actions.find(a=>/walk/i.test(a.name))||actions[0];
  const idle=actions.find(a=>/idle/i.test(a.name));
  if(walk)walk.action.play();if(idle)idle.action.play();
  let motion=0;
  const gait=hero.userData.gait={speed:0,weight:0,timeScale:0};
  hero.userData.asset={provider:'Tripo',triangles,bones,clips:gltf.animations.map(c=>c.name)};
  return {hero,update(dt,speed,reduceMotion){
    motion=T.MathUtils.damp(motion,speed>0&&!reduceMotion?1:0,8,dt);
    if(walk){walk.action.setEffectiveWeight(motion);walk.action.setEffectiveTimeScale(Math.min(1,Math.max(0,speed)));}
    gait.speed=speed;gait.weight=motion;gait.timeScale=walk?.action.getEffectiveTimeScale()||0;
    if(idle)idle.action.setEffectiveWeight(1-motion);
    mixer.update(reduceMotion?0:dt);
  }};
}
