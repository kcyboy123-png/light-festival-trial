import * as T from 'three';
import {createFlowerClue} from './flower-clue.js?v=trial-20261120-1';
const names=['별씨 꽃','춤추는 꽃','물방울 꽃','달고리 꽃'];
const replies=['인사하니 작은 별씨가 피어올라요!','꽃잎 주위에서 별빛이 춤을 춰요!','꽃에서 빛방울이 퐁퐁 솟아올라요!','별빛이 꽃을 둥글게 감싸요!'];
const again=['별씨 꽃이 여우를 알아보고 다시 별씨를 보내요!','춤추는 꽃이 다시 인사하며 별빛 춤을 춰요!','물방울 꽃이 다시 반기며 빛방울을 올려요!','달고리 꽃이 다시 여우 곁에 빛고리를 만들어요!'];
const colors=[0xffdf96,0x9ae5d4,0xbac4ff,0xf4b2d4];
export function createGardenCuriosities(scene,stands){
  const flowers=stands.map((p,i)=>{const f=createFlowerClue(scene,p,'blossom');f.tint(colors[i%4]);return f;}),energy=stands.map(()=>0),openness=stands.map(()=>0),bursts=stands.map(()=>0),greeted=stands.map(()=>false);
  const geometry=new T.OctahedronGeometry(.085),dummy=new T.Object3D();
  const sparks=flowers.map((f,i)=>{const m=new T.InstancedMesh(geometry,new T.MeshBasicMaterial({color:colors[i%4],transparent:true,depthWrite:false}),8);m.position.copy(f.position);m.position.y-=.95;m.visible=false;m.frustumCulled=false;scene.add(m);return m;});
  let nearby=-1,reactions=0;
  function greet(i){
    if(i<0||i>=flowers.length)return '';
    if(bursts[i]>3.3)return replies[i%4];
    const reply=greeted[i]?again[i%4]:replies[i%4];greeted[i]=true;energy[i]=1;bursts[i]=4;reactions++;return reply;
  }
  return {
    greet,
    name(i){return names[i%4];},
    hasGreeted(i){return greeted[i]===true;},
    reset(){nearby=-1;reactions=0;energy.fill(0);openness.fill(0);bursts.fill(0);greeted.fill(false);sparks.forEach(m=>m.visible=false);},
    near(hero){let found=-1,best=2.1;flowers.forEach((f,i)=>{const d=Math.hypot(f.position.x-hero.x,f.position.z-hero.z);if(d<best){best=d;found=i;}});return found;},
    update(dt,hero,reduceMotion){
      let next=this.near(hero);if(next<0&&nearby>=0&&Math.hypot(flowers[nearby].position.x-hero.x,flowers[nearby].position.z-hero.z)<2.7)next=nearby;
      if(next>=0&&next!==nearby){energy[next]=Math.max(energy[next],.45);reactions++;}nearby=next;
      flowers.forEach((f,i)=>{
        energy[i]=Math.max(0,energy[i]-dt*.16);bursts[i]=Math.max(0,bursts[i]-dt);openness[i]+=(energy[i]-openness[i])*(1-Math.exp(-dt*5));
        f.setReveal((greeted[i]?.59:.42)+(reduceMotion?energy[i]:openness[i])*(greeted[i]?.41:.58));f.sway(reduceMotion?0:openness[i]*Math.sin(energy[i]*Math.PI*2)*.06);
        const m=sparks[i];m.visible=bursts[i]>0;if(!m.visible)return;
        const t=reduceMotion?.8:4-bursts[i];m.material.opacity=Math.min(1,bursts[i]);
        for(let j=0;j<8;j++){
          const a=j/8*Math.PI*2,r=i%4===1?.45+.18*Math.sin(t*3+j):.55;
          if(i%4===0)dummy.position.set(Math.cos(a+t)*(.2+t*.17),t*.45+j*.04,Math.sin(a+t)*(.2+t*.17));
          else if(i%4===1)dummy.position.set(Math.cos(a+t*1.4)*r,.3+Math.sin(t*2+j)*.18,Math.sin(a+t*1.4)*r);
          else if(i%4===2){const u=(t*.5+j/8)%1;dummy.position.set(Math.cos(a)*u*.8,Math.sin(u*Math.PI)*1.1,Math.sin(a)*u*.8);}
          else dummy.position.set(Math.cos(a+t)*r,.55+Math.sin(a+t)*r,.15*Math.sin(a));
          dummy.rotation.set(0,t+j,t*.5);dummy.scale.setScalar(.75+.25*Math.sin(a+t));dummy.updateMatrix();m.setMatrixAt(j,dummy.matrix);
        }
        m.instanceMatrix.needsUpdate=true;
      });
    },
    get state(){return {nearby,reactions,energy:[...energy],greeted:[...greeted],bursts:[...bursts],effects:sparks.map(m=>m.visible),names:[...names],positions:flowers.map(f=>f.position.toArray())};}
  };
}
