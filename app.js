import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createWorld} from './world.js?v=trial-20261119-3';
import {nearestNode,route,walkStep,canTraverse} from './navigation.js';
import {createExplorationInput} from './exploration-input.js';
import {createGame} from './game.js';
import {safeFollowAngle} from './camera-follow.js';
import {initialQuality} from './quality-policy.js';
import {createArrival} from './arrival.js?v=trial-20261119-3';

const previewMode=new URLSearchParams(location.search).get('preview')==='1';
const $=s=>document.querySelector(s),canvas=$('#scene'),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function fail(message){$('#error-message').textContent=message;$('#error').hidden=false;$('#loading').hidden=true;}
try{
  let savedQuality;try{savedQuality=localStorage.getItem('changyong-light-festival-quality-v1');}catch{}
  let quality=initialQuality({coarse:matchMedia('(pointer: coarse)').matches,touchPoints:navigator.maxTouchPoints,saved:savedQuality});
  const renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.info.autoReset=false;
  const scene=new T.Scene();scene.matrixAutoUpdate=false;scene.background=new T.Color(0x091326);scene.fog=new T.FogExp2(0x12213b,.0032);
  const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.15,400);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=3.5;controls.maxDistance=74;controls.minPolarAngle=.5;controls.maxPolarAngle=Math.PI*.48;controls.rotateSpeed=.5;controls.zoomSpeed=.65;
  const pmrem=new T.PMREMGenerator(renderer),environment=new RoomEnvironment();const env=pmrem.fromScene(environment,.04);scene.environment=env.texture;environment.dispose();pmrem.dispose();
  const target=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,samples:4});
  const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.3,.55,1.1);composer.addPass(bloom);composer.addPass(new OutputPass());
  function resize(){const dpr=quality==='high'?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.25,Math.sqrt(1200000/(innerWidth*innerHeight)));renderer.shadowMap.autoUpdate=quality==='high';renderer.shadowMap.needsUpdate=true;renderer.setPixelRatio(dpr);renderer.setSize(innerWidth,innerHeight,false);composer.setPixelRatio(dpr);composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  resize();const world=await createWorld(scene,renderer,quality);scene.environmentIntensity=.6;
  const poses={carousel:{p:[-7,8.5,33],t:[-25,4,14]},entrance:{p:[7,7,26],t:[0,5,-8]},bridge:{p:[-7,6,6],t:[-14,3,0]},flower:{p:[10,7,3],t:[0,4.7,-8]}};
  const lampStand=world.nodes[world.stations[0].node];poses.lamp={p:[lampStand.x+7,lampStand.y+4.5,lampStand.z+6.7],t:[lampStand.x+.9,2.4,lampStand.z-.5]};
  const bridgeStand=world.nodes[world.stations[1].node];poses.bridgeLamp={p:[bridgeStand.x+10,bridgeStand.y+8,bridgeStand.z+2],t:[bridgeStand.x-1,bridgeStand.y+1.3,bridgeStand.z]};
  poses.bridgeReveal={p:[-10,9,6],t:[-11,3,-5]};
  const fountainStand=world.nodes[world.stations[2].node];poses.fountainLamp={p:[fountainStand.x+2,fountainStand.y+5,fountainStand.z+8],t:[fountainStand.x-.6,fountainStand.y+1.2,fountainStand.z-.5]};
  poses.fountainReveal={p:[5,7,12],t:[0,5,-8]};
  let viewpoint='entrance',flight=null;const followTarget=new T.Vector3(),followLead=new T.Vector3(),followOffset=new T.Vector3();
  const walkHeading=new T.Vector3(-3.8,0,-7).normalize(),inputForward=new T.Vector3(),lastInput=new T.Vector2();let movingTime=0;
  const followHeight=()=>3+Math.min(2,Math.max(0,((world.hero.userData.baseY||1.2)-1.2)*2));
  function goView(name,instant=false){const wasFollowing=viewpoint==='fox';viewpoint=name;world.cameraFollowing.value=name==='fox'?1:0;if(!wasFollowing||name!=='fox')lastInput.set(0,0);followLead.set(0,0,0);const pos=world.hero.position;const pose=name==='fox'?{p:[pos.x-walkHeading.x*8,pos.y+1.4+followHeight(),pos.z-walkHeading.z*8],t:[pos.x,pos.y+1.4,pos.z]}:poses[name],p=new T.Vector3(...pose.p),t=new T.Vector3(...pose.t);if(innerHeight>innerWidth)p.sub(t).multiplyScalar(name==='fox'?1.12:1.35).add(t);if(instant||reduceMotion){flight=null;camera.position.copy(p);controls.target.copy(t);controls.update();}else flight={from:camera.position.clone(),target:controls.target.clone(),p,t,start:performance.now()};for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
  goView(previewMode?'entrance':'fox',true);
  let game=null,arrival=null;let stage=2,walking=[],activeNode=nearestNode(world.nodes,world.hero.position),walkDistance=0;
  const captions=['길 위에 첫 불빛을 밝혀 보세요.','다리가 깨어났어요. 다음은 중앙 광장이에요.','도시 전체에 빛이 돌아왔어요.'];
  function setStage(value,{instant=false}={}){stage=Math.max(0,Math.min(2,value));for(const b of document.querySelectorAll('button[data-stage]'))b.setAttribute('aria-pressed',String(+b.dataset.stage===stage));$('#status').textContent=captions[stage];$('#chapter').textContent=['달빛만 남은 광장','처음 돌아온 따뜻한 빛','내가 깨운 빛의 도시'][stage];document.body.dataset.stage=String(stage);if(instant)world.snap(stage);}
  for(const b of document.querySelectorAll('button[data-stage]'))b.addEventListener('click',()=>setStage(+b.dataset.stage));
  for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>goView(b.dataset.view));
  function qualityLabel(){$('#quality').textContent=quality==='high'?'최고 화질':'가벼운 화질';$('#quality').setAttribute('aria-label',quality==='high'?'현재 최고 화질. 누르면 가벼운 화질로 변경':'현재 가벼운 화질. 누르면 최고 화질로 변경');}
  qualityLabel();
  $('#quality').addEventListener('click',()=>{quality=quality==='high'?'light':'high';qualityLabel();try{localStorage.setItem('changyong-light-festival-quality-v1',quality);}catch{}world.setQuality(quality);resize();});
  function clean(on){document.body.classList.toggle('clean',on);$('#restore').hidden=!on;}
  $('#clean').onclick=()=>clean(true);$('#restore').onclick=()=>clean(false);
  addEventListener('keydown',e=>{if(e.key==='Escape')clean(false);if(previewMode&&e.target===canvas&&['1','2','3'].includes(e.key))setStage(+e.key-1);});
  addEventListener('resize',()=>{resize();if(viewpoint!=='fox'||flight)goView(viewpoint,true);});
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down=null,pointers=new Set(),lookUntil=0;
  canvas.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);if(pointers.size===1)down={x:e.clientX,y:e.clientY,time:performance.now(),moved:false,multi:e.pointerType==='touch'&&movement.active};else if(down)down.multi=true;});
  addEventListener('pointerdown',e=>{if(down&&e.target!==canvas)down.multi=true;},true);
  canvas.addEventListener('pointermove',e=>{if(pointers.has(e.pointerId)&&down&&(down.multi||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)){down.moved=true;flight=null;lookUntil=performance.now()+4000;}});
  canvas.addEventListener('wheel',()=>{flight=null;lookUntil=performance.now()+4000;},{passive:true});
  canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null;});
  canvas.addEventListener('lostpointercapture',e=>pointers.delete(e.pointerId));
  canvas.addEventListener('pointerup',e=>pointers.delete(e.pointerId));
  // Finish the click before opening a dialog, so the same touch cannot press its new button.
  canvas.addEventListener('click',e=>{if(game?.blocked){down=null;return;}if(!down||down.multi||down.moved||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6||performance.now()-down.time>700){down=null;return;}down=null;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(world.walkMeshes,false)[0];if(!hit||world.floorBlocked(raycaster,hit)){game?.walkFeedback(true);return;}game?.walkFeedback(false);const next=nearestNode(world.nodes,hit.point);travel(next);$('#hint').textContent='빛을 따라 걸어가고 있어요';});
  function travel(next){if(next===null){walking=[];return;}if(!previewMode&&viewpoint!=='fox')goView('fox');activeNode=nearestNode(world.nodes,world.hero.position);walking=route(world.nodes,world.edges,activeNode,next);if(walking[0]===activeNode&&world.hero.position.distanceTo(world.nodes[activeNode])<.15)walking.shift();}
  function resume(node){walking=[];world.hero.position.copy(world.nodes[node]);world.hero.userData.baseY=world.nodes[node].y;goView('fox',true);}
  const projectPoint=new T.Vector3(),movementRight=new T.Vector3(),walkDelta=new T.Vector3(),walkNext=new T.Vector3();
  function project(position){const p=projectPoint.copy(position).project(camera);return {x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight,z:p.z};}
  function turn(x,z,dt){const a=Math.atan2(x,z)-world.hero.rotation.y;world.hero.rotation.y+=Math.atan2(Math.sin(a),Math.cos(a))*Math.min(1,dt*12);}
  if(navigator.maxTouchPoints>0)$('#explore-controls p').innerHTML='조이스틱을 밀어 걷기<br>도착하면 회로 고치기';
  const movement=createExplorationInput(()=>previewMode||!!game?.blocked||!!arrival,()=>game?.interact(),()=>game?.hint(),()=>goView('fox'));
  addEventListener('keydown',e=>{if(arrival&&/^(w|a|s|d|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Escape)$/i.test(e.key))arrival.finish();},true);
  addEventListener('pointerdown',e=>{if(arrival&&e.target.closest('#scene,#move-pad'))arrival.finish();},true);
  $('#move-pad').addEventListener('pointerdown',e=>{if(e.button===0&&!previewMode&&!game?.blocked)travel(null);});
  const guide=new T.Group();guide.visible=false;scene.add(guide);const guideMat=new T.MeshBasicMaterial({color:0xd5f2e8,transparent:true,opacity:.4,depthWrite:false,toneMapped:false});
  const guideDots=Array.from({length:10},()=>new T.Object3D()),guideColor=new T.Color();
  const guideMesh=new T.InstancedMesh(new T.OctahedronGeometry(.14),guideMat,10);guideMesh.name='pearl-path';guideMesh.frustumCulled=false;guideMesh.count=0;for(let i=0;i<10;i++)guideMesh.setColorAt(i,guideColor.setScalar(1));guideMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);guide.add(guideMesh);
  let guideClock=0,guideRecomputes=0,guideFrom=-1,guideTo=-1,guideIds=[];const guidePoints=[];
  function updateGuide(dt){const info=game?.guide;guide.visible=!!info&&info.level>=2&&!game.blocked&&!info.near;if(!guide.visible)return;guideClock+=dt;const from=nearestNode(world.nodes,world.hero.position);if(from!==guideFrom||info.node!==guideTo){guideFrom=from;guideTo=info.node;guideIds=route(world.nodes,world.edges,from,info.node);guideRecomputes++;}const ids=guideIds;let distance=0,previous=world.hero.position;const points=guidePoints;points.length=0;for(const id of ids){const v=world.nodes[id];distance+=v.distanceTo(previous);if(distance>(info.level>=3?9:4))break;if(distance>.7)points.push(v);previous=v;}guideDots.forEach((dot,i)=>{dot.visible=i<points.length;if(dot.visible){dot.position.copy(points[i]);dot.position.y+=.09;const next=points[i+1]||world.nodes[info.node];dot.rotation.y=Math.atan2(next.x-dot.position.x,next.z-dot.position.z);dot.scale.set(.72,.14,1.2);dot.updateMatrix();guideMesh.setMatrixAt(i,dot.matrix);const pulse=reduceMotion?1:.72+.28*Math.pow(.5+.5*Math.sin(guideClock*1.3-i*.8),2);guideColor.setScalar(pulse);guideMesh.setColorAt(i,guideColor);}});guideMesh.count=Math.min(10,points.length);guideMesh.instanceMatrix.needsUpdate=true;if(guideMesh.instanceColor)guideMesh.instanceColor.needsUpdate=true;guideMat.opacity=info.level>=3?.58:.4;}

  let last=performance.now(),elapsed=0,frameCount=0,renderTime=0,hidden=false,contextLost=false,lastShadow=0;
  addEventListener('blur',()=>{travel(null);pointers.clear();down=null;});
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden){travel(null);pointers.clear();down=null;}last=performance.now();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;fail('3D 화면 연결이 잠시 끊겼어요. 다시 열기를 눌러 주세요.');});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  function frame(now){requestAnimationFrame(frame);if(hidden||contextLost)return;
    // Circuit and video dialogs use DOM animation; keep the expensive city frame still behind them.
    if(document.querySelector('dialog[open]')){last=now;return;}
    const gameDt=Math.min((now-last)/1000,.25),dt=Math.min(gameDt,.05);last=now;elapsed+=dt;
    if(arrival){arrival.update(gameDt);world.setMoving(0);game?.update(gameDt,false);world.update(elapsed,dt,stage,reduceMotion);drawFrame(now);return;}
    if(flight){if(viewpoint==='fox'){const dx=world.hero.position.x-flight.t.x,dz=world.hero.position.z-flight.t.z;flight.t.x+=dx;flight.t.z+=dz;flight.p.x+=dx;flight.p.z+=dz;}const t=Math.min(1,(now-flight.start)/(viewpoint==='fox'?650:1800)),u=t*t*(3-2*t);camera.position.lerpVectors(flight.from,flight.p,u);controls.target.lerpVectors(flight.target,flight.t,u);if(t===1)flight=null;}
    const input=movement.read(),distanceBefore=walkDistance,previousX=world.hero.position.x,previousZ=world.hero.position.z;let moving=false;
    if(input.x||input.y){
      if(viewpoint!=='fox')goView('fox');walking=[];
      // Keep a held direction straight while the camera catches up behind the fox.
      if(!lastInput.lengthSq()||(!input.fromStick&&Math.hypot(input.x-lastInput.x,input.y-lastInput.y)>.35)){inputForward.copy(controls.target).sub(camera.position);inputForward.y=0;inputForward.normalize();}
      lastInput.set(input.x,input.y);
      const right=movementRight.set(-inputForward.z,0,inputForward.x),delta=right.multiplyScalar(input.x).addScaledVector(inputForward,-input.y).multiplyScalar(dt*3.6);
      let pos=world.hero.position;for(const [x,z]of [[delta.x,delta.z],[delta.x,0],[0,delta.z]]){const candidate=walkStep(world.nodes,world.edges,world.hero.position,x,z,world.plazas);if(canTraverse(world.hero.position,candidate,world.onPath)){pos=candidate;break;}}const dx=pos.x-world.hero.position.x,dz=pos.z-world.hero.position.z;
      if(Math.hypot(dx,dz)>.0001){world.hero.position.x=pos.x;world.hero.position.z=pos.z;world.hero.userData.baseY=pos.y;turn(dx,dz,dt);walkDistance+=Math.hypot(dx,dz);moving=true;}
    }else if(walking.length&&!document.querySelector('dialog[open]')){
      const to=world.nodes[walking[0]],delta=walkDelta.copy(to).sub(world.hero.position);delta.y=0;const d=delta.length(),step=Math.min(d,dt*3.6);
      if(d<.08){activeNode=walking.shift();world.hero.userData.baseY=to.y;}else{const next=walkNext.copy(world.hero.position).addScaledVector(delta,step/d);if(!canTraverse(world.hero.position,next,world.onPath)){walking=[];}else{world.hero.position.copy(next);world.hero.userData.baseY=T.MathUtils.damp(world.hero.userData.baseY||1.2,to.y,8,dt);turn(delta.x,delta.z,dt);walkDistance+=step;moving=true;}}
    }
    if(!input.x&&!input.y)lastInput.set(0,0);
    movingTime=moving||walking.length?movingTime+dt:0;
    if(moving)walkHeading.set(world.hero.position.x-previousX,0,world.hero.position.z-previousZ).normalize();
    world.setMoving(dt>0?(walkDistance-distanceBefore)/(dt*3.6):0);
    if(viewpoint==='fox'&&!flight){
      const autoTurn=moving&&movingTime>.3&&!reduceMotion&&!game?.blocked&&pointers.size===0&&now>=lookUntil;
      followLead.lerp(autoTurn?followTarget.copy(walkHeading).multiplyScalar(.8):followTarget.set(0,0,0),1-Math.exp(-dt*3));
      followTarget.copy(world.hero.position).add(followLead);followTarget.y=(world.hero.userData.baseY||1.2)+1.4;
      const shift=followTarget.sub(controls.target).multiplyScalar(reduceMotion?1:1-Math.exp(-dt*9));camera.position.add(shift);controls.target.add(shift);
      if(autoTurn){
        followOffset.copy(camera.position).sub(controls.target);
        const angle=Math.atan2(followOffset.x,followOffset.z),desired=Math.atan2(-walkHeading.x,-walkHeading.z),difference=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));
        const next=angle+T.MathUtils.clamp(difference*(1-Math.exp(-dt*2.5)),-dt*.8,dt*.8),radius=Math.hypot(followOffset.x,followOffset.z);
        camera.position.set(controls.target.x+Math.sin(next)*radius,controls.target.y+T.MathUtils.damp(followOffset.y,radius*followHeight()/8,3,dt),controls.target.z+Math.cos(next)*radius);
      }
    }
    controls.update();
    if(viewpoint==='fox'){
      const dx=camera.position.x-world.hero.position.x,dz=camera.position.z-world.hero.position.z,distance=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),safe=safeFollowAngle(world.hero.position.x,world.hero.position.z,angle,distance);
      if(Math.abs(safe-angle)>.00001){camera.position.x=world.hero.position.x+Math.sin(safe)*distance;camera.position.z=world.hero.position.z+Math.cos(safe)*distance;camera.lookAt(controls.target);}
    }
    game?.update(gameDt,moving||walking.length>0,{looking:now<lookUntil});world.update(elapsed,dt,stage,reduceMotion);updateGuide(dt);drawFrame(now);
  }
  function drawFrame(now){if(quality==='light'&&now-lastShadow>=1000/12){renderer.shadowMap.needsUpdate=true;lastShadow=now;}scene.updateMatrixWorld();scene.matrixWorldAutoUpdate=false;renderer.info.reset();const start=performance.now();composer.render();renderTime+=performance.now()-start;frameCount++;}
  const initial=new URLSearchParams(location.search).get('stage');setStage(previewMode?(initial!==null&&/^[012]$/.test(initial)?+initial:2):0,{instant:true});
  if(!previewMode){document.body.classList.add('playing');$('#mission').hidden=false;$('#restart-game').hidden=false;$('#explore-controls').hidden=false;game=createGame(world,{travel,resume,goView,project,reduceMotion});}
  window.__festival={ready:false,setStage:(s)=>setStage(s,{instant:true}),goView:(s)=>goView(s,true),getState:()=>({arrival:arrival?{elapsed:arrival.elapsed}:null,game:game?.state,carousel:world.carousel.state,festival:world.festival.state,stage,current:world.current,viewpoint,camera:camera.position.toArray(),cameraTarget:controls.target.toArray(),guideVisible:guide.visible,guideRecomputes,guidePoints:guideDots.filter(p=>p.visible).map(p=>p.position.toArray()),quality,hero:world.hero.position.toArray(),heroGroundOffset:new T.Box3().setFromObject(world.hero,true).min.y-world.hero.position.y,walking:walking.length,walkDistance,frames:frameCount,averageRenderMs:renderTime/Math.max(1,frameCount),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,gardens:world.gardenStats,character:world.hero.userData.asset,gait:world.hero.userData.gait,hip:world.hero.getObjectByName('mixamorigHips')?.getWorldPosition(new T.Vector3()).toArray(),contextLost,reflection:!!world.water.material.uniforms.mirrorSampler.value}),projectNode:i=>{const p=world.nodes[i].clone().project(camera);return {x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight};},stations:world.missionSites.map((s,i)=>({name:String(i+1),node:s.node})),edges:world.edges,walkRadii:world.nodes.map(p=>p.walkRadius),plazas:world.plazas,obstacles:world.obstacles,nodes:world.nodes.map(p=>p.toArray())};
  await world.festival.prepare(renderer,camera);if(!previewMode&&!reduceMotion)arrival=createArrival(scene,renderer,camera,controls,world.hero,()=>{arrival=null;goView('fox',true);updateGuide(0);});else updateGuide(0);composer.render();window.__festival.ready=true;requestAnimationFrame(frame);last=performance.now();$('#loading').classList.add('loaded');setTimeout(()=>$('#loading').hidden=true,850);
}catch(error){console.error(error);fail('3D 화면을 준비하지 못했어요. 최신 Chrome 또는 Edge에서 로컬 실행 주소를 다시 열어 주세요.');}

