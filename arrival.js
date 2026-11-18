import * as T from 'three';
export const ARRIVAL_SECONDS=7;
export const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};

export function createArrival(scene,renderer,camera,controls,hero,onFinish){
  const overlay=document.querySelector('#arrival'),caption=document.querySelector('#arrival-caption');
  const end=camera.position.clone(),endLook=controls.target.clone(),h=hero.position.clone();
  const landingOffset=end.clone().sub(endLook),initialScale=camera.aspect<1?1.12:1;
  const landing=()=>end.copy(endLook).addScaledVector(landingOffset,(camera.aspect<1?1.12:1)/initialScale);
  const portrait=new T.Vector3(h.x+.55,h.y+2.05,h.z+3.5),face=new T.Vector3(h.x,h.y+1.9,h.z);
  const curve=new T.CatmullRomCurve3([new T.Vector3(16,17,32),new T.Vector3(5,11,25),new T.Vector3(h.x+1.5,h.y+5,h.z+8),portrait]);
  const wideLook=new T.Vector3(-5,4,-4),look=new T.Vector3();let elapsed=0,done=false;
  const exposure=renderer.toneMappingExposure,points=new Float32Array(96*3);
  for(let i=0;i<96;i++){const angle=i*2.39996,r=.8+(i%13)*.28;points[i*3]=Math.cos(angle)*r;points[i*3+1]=.6+(i%17)*.16;points[i*3+2]=Math.sin(angle)*r;}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'#fff8de');gradient.addColorStop(.18,'#ffe5a3');gradient.addColorStop(.5,'#ffcd6755');gradient.addColorStop(1,'#ffcd6700');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
  const texture=new T.CanvasTexture(canvas),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(points,3));
  const material=new T.PointsMaterial({map:texture,color:0xffe6b0,size:.13,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const sparks=new T.Points(geometry,material);sparks.position.copy(h);scene.add(sparks);
  const finish=()=>{if(done)return;done=true;scene.remove(sparks);geometry.dispose();material.dispose();texture.dispose();renderer.toneMappingExposure=exposure;overlay.hidden=true;document.body.classList.remove('arriving');controls.enabled=true;camera.position.copy(landing());controls.target.copy(endLook);controls.update();onFinish();};
  const skip=document.querySelector('#skip-arrival');skip.onclick=finish;overlay.hidden=false;document.body.classList.add('arriving');controls.enabled=false;skip.focus({preventScroll:true});
  function update(dt){
    if(done)return;elapsed+=dt;const u=Math.min(1,elapsed/ARRIVAL_SECONDS);landing();
    renderer.toneMappingExposure=exposure+.17*(1-ease(u/.6));sparks.rotation.y=elapsed*.18;sparks.position.y=h.y+Math.sin(u*Math.PI)*.35;material.opacity=Math.sin(u*Math.PI)*.8;
    if(u<.62){const t=ease(u/.62);camera.position.copy(curve.getPointAt(t));look.lerpVectors(wideLook,face,ease(t/.8));}
    else{const t=ease((u-.62)/.38);camera.position.lerpVectors(portrait,end,t);look.lerpVectors(face,endLook,t);}
    camera.lookAt(look);controls.target.copy(look);overlay.style.setProperty('--arrival-fade',String(1-ease((u-.76)/.24)));
    caption.textContent=u<.45?'달빛 아래 잠든 도시':u<.7?'작은 별여우와 함께':'이제, 우리의 손으로 밝혀요';
    if(u===1)finish();
  }
  update(0);return {update,finish,get elapsed(){return elapsed;}};
}
