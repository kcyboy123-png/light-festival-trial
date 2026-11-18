import {createClueNotebook} from './clue-notebook.js';
import {nearestNode,route} from './navigation.js';
import {createSearchHints} from './search-hints.js';
import {evaluateFountain} from './fountain-lamp.js';
import {createCircuitPanel} from './circuit-panel.js';
import {freshProgress,restoreProgress,SAVE_KEY,checkpointIndex} from './game-state.js';
import {REVEAL_SECONDS} from './awakening.js';
import {createSeriesPanel} from './series-panel.js';
import {festivalTiming,FESTIVAL_SECONDS} from './festival-timing.js';

export function createGame(world,{travel,resume,goView,project,reduceMotion}){
  const $=s=>document.querySelector(s),C=window.ToyCircuit;
  $('#mission').append($('#replay'));
  let state=freshProgress(),storageOK=true,saveBlocked=false,approaching=null,reveal=null,clock=0,replayPending=false,clueApproach=false,nearFirst=false,nearBridge=false,nearFountain=false;
  try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const restored=restoreProgress(raw,C);if(restored)state=restored;else{saveBlocked=true;storageOK=false;}}}catch{storageOK=false;}
  function save(){if(saveBlocked)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('#save-note').hidden=storageOK;}
  const storyAt=i=>i===0?state.firstLamp:i===1?state.bridgeLamp:i===2?state.fountainLamp:null;
  const clueIndex=()=>state.completed>0&&state.completed<=3&&storyAt(state.completed-1)&&!storyAt(state.completed-1).clueRead?state.completed-1:-1;
  const needsClue=()=>clueIndex()>=0;
  const firstMode=()=>state.completed===0&&state.firstLamp!==null;
  const bridgeMode=()=>state.completed===1&&state.bridgeLamp!==null;
  const fountainMode=()=>state.completed===2&&state.fountainLamp!==null;
  const lampView=i=>['lamp','bridgeLamp','fountainLamp'][i];
  const nearNode=node=>Math.hypot(world.nodes[node].x-world.hero.position.x,world.nodes[node].z-world.hero.position.z)<1.65;
  const clues=[world.firstClue,world.bridgeClue,world.fountainClue];
  const nearClue=i=>nearNode(clues[i].node)||Math.hypot(clues[i].position.x-world.hero.position.x,clues[i].position.z-world.hero.position.z)<1.2;
  const nearTarget=()=>needsClue()?nearClue(clueIndex()):nearNode(targetNode());
  let learnedMove=state.completed>0;const moveOrigin=world.hero.position.clone(),touch=navigator.maxTouchPoints>0;
  let search=createSearchHints();let searchLevel=0,searchNear=false,searchNode=-1,nearRead=-1,nearFlower=-1,nearRepaired=-1,nearLandmark=-1,flavorUntil=0,flavorText='',practiceIndex=null,observingUntil=0;let routeFrom=-1,routeTo=-1,routeLength=0;
  const targetNode=()=>needsClue()?clues[clueIndex()].node:targets[Math.min(state.completed,3)].node;
  const modal=()=>!!document.querySelector('dialog[open]');
  const isRead=i=>!!storyAt(i)?.clueRead;
  const readNear=()=>clues.findIndex((clue,i)=>isRead(i)&&nearClue(i));
  const notebook=createClueNotebook({isRead,canDiscover:i=>i===clueIndex()&&nearClue(i),onRead:i=>{storyAt(i).clueRead=true;flavorUntil=0;save();updateSearch(0);render();},onObserve:()=>{observingUntil=clock+4;}});
  const seekNext=()=>!nearTarget()&&(needsClue()?nearRepaired>=0:nearRead>=0&&!state.carousel.restored);
  function openBook(){if(!reveal&&!modal()&&approaching===null){travel(null);notebook.openBook();}}
  function showClue(i=clueIndex()){travel(null);notebook.open(i);}
  function tapClue(ray){
    for(let i=0;i<clues.length;i++){
      if((i!==clueIndex()&&!isRead(i))||!nearClue(i)||clues[i].state.revealed<1)continue;
      const hit=ray.intersectObject(clues[i].root,true)[0];
      if(hit&&!world.floorBlocked(ray,hit)){showClue(i);return true;}
    }
    return false;
  }
  function walkFeedback(blocked){flavorUntil=blocked?clock+4:0;if(blocked)flavorText='길 바닥을 누르거나 왼쪽 별을 밀어 걸어요.';render();}
  function interact(){
    if(reveal||approaching!==null||modal())return;
    travel(null);
    if(nearTarget()){if(needsClue())showClue();else approach(state.completed);return;}
    const read=readNear();if(read>=0){showClue(read);return;}
    const landmark=earlyLandmark();if(landmark>=0){say(landmarkLines[landmark]);return;}
    const repaired=world.stations.findIndex((s,i)=>i<state.completed&&nearNode(s.node));if(repaired>=0){practiceIndex=repaired;faceLamp(repaired);goView(lampView(repaired));panel.open(state.drafts[repaired],world.stations[repaired].name,repaired,null,true);render();return;}
    const flower=world.curiosities.near(world.hero.position);if(flower>=0){const [x,,z]=world.curiosities.state.positions[flower];world.hero.rotation.y=Math.atan2(x-world.hero.position.x,z-world.hero.position.z);say(world.curiosities.greet(flower));return;}
    if(state.carousel.restored)goView('fox');else hint();
  }
  const landmarkLines=['등 아래 전선이 어둠 속으로 이어져 있어요.','난간에 별 세 개가 달려 있어요. 이 모양을 기억해 둬요.','꽃 모양 분수인데 물이 멈춰 있어요. 이 모양을 기억해 둬요.','금빛 지붕 아래 목마가 잠들어 있어요. 다시 움직일 수 있을까요?'];
  function earlyLandmark(){return targets.findIndex((s,i)=>(i>state.completed||(i===state.completed&&needsClue()))&&nearNode(s.node));}
  function say(text){flavorText=text;flavorUntil=clock+4;observingUntil=clock+4;render();}
  function hint(){if(reveal||modal()||state.carousel.restored)return;flavorUntil=0;search.request();updateSearch(0);render();}
  function updateSearch(dt,activity={}){
    const node=targetNode(),p=world.nodes[node],hero=world.hero.position,d=Math.hypot(p.x-hero.x,p.z-hero.z),near=nearTarget(),from=nearestNode(world.nodes,hero);
    if(from!==routeFrom||node!==routeTo){routeFrom=from;routeTo=node;const ids=route(world.nodes,world.edges,from,node);routeLength=0;for(let j=1;j<ids.length;j++)routeLength+=world.nodes[ids[j]].distanceTo(world.nodes[ids[j-1]]);}
    const level=search.update(`${state.completed}:${clueIndex()}:${state.carousel.restored}`,near?0:routeLength+hero.distanceTo(world.nodes[from]),dt,state.carousel.restored||!!reveal||modal()||approaching!==null,{...activity,looking:activity.looking||clock<observingUntil,cell:`${Math.floor(hero.x/2)},${Math.floor(hero.z/2)}`});
    const landmark=earlyLandmark(),read=readNear(),flower=world.curiosities.near(hero),repaired=world.stations.findIndex((s,i)=>i<state.completed&&nearNode(s.node));
    if(near!==searchNear||level!==searchLevel||node!==searchNode||read!==nearRead||flower!==nearFlower||repaired!==nearRepaired||landmark!==nearLandmark){nearLandmark=landmark;nearRepaired=repaired;searchNear=near;searchLevel=level;searchNode=node;nearRead=read;nearFlower=flower;render();}
  }
  function faceLamp(i){const p=world.stations[i].position;world.hero.rotation.y=Math.atan2(p.x-world.hero.position.x,p.z-world.hero.position.z);}
  const panel=createCircuitPanel(d=>{if(practiceIndex!==null)return;state.drafts[state.completed]=d;save();},()=>{
    const i=state.completed;if(i>=3||!evaluateFountain(state.drafts[i],i===2?state.fountainLamp:null,C).complete)return;
    state.completed++;save();reveal={index:i,start:clock};approaching=null;
    goView(i===0&&state.firstLamp?'lamp':i===1?(state.bridgeLamp?'bridgeReveal':'bridge'):state.fountainLamp?'fountainReveal':'entrance');document.body.classList.add('revealing');render();
  },patch=>{const story=storyAt(state.completed);if(story){Object.assign(story,patch);save();}});
  const series=createSeriesPanel(d=>{state.carousel=d;save();},()=>{
    if(state.carousel.restored){goView('fox');return;}
    state.carousel.restored=true;save();reveal={index:3,start:clock,origin:world.hero.position.clone()};goView('carousel');document.body.classList.add('revealing');render();
  });
  const targets=[...world.stations,world.carouselStation];
  const checkpoint=checkpointIndex(state);if(checkpoint>=0)resume(targets[checkpoint].node);
  const markers=targets.map((s,i)=>{const b=document.createElement('button');b.className='lamp-marker';b.dataset.lamp=i;b.setAttribute('aria-label',s.name+'로 걸어가기');b.innerHTML='<span aria-hidden="true">✦</span><small>'+s.name+'</small>';b.onclick=()=>i===clueIndex()?visitClue():approach(i);$('#lamp-markers').append(b);return b;});
  function visitClue(){if(!reveal&&!modal()&&needsClue()&&nearTarget())showClue();}
  function approach(i){
    if(reveal||panel.isOpen||series.isOpen||$('#clue-dialog').open||i!==state.completed||needsClue())return;
    travel(null);
    if(storyAt(i)&&nearNode(targets[i].node)){faceLamp(i);goView(lampView(i));panel.open(state.drafts[i],targets[i].name,i,storyAt(i));render();return;}
    approaching=i;travel(targets[i].node);goView(storyAt(i)?lampView(i):i===3?'carousel':i===1?'bridge':'entrance');render();
  }
  function render(){
    document.body.classList.toggle('all-restored',state.completed===3);
    $('#progress').textContent=state.completed===3&&needsClue()?'3 / 3':state.completed<3?state.completed+' / 3':state.carousel.restored?'복원 완료':'전지 비교';
    $('#progress').dataset.lights=state.completed;
    $('#progress').setAttribute('aria-label',`가로등 ${state.completed}개 / 3개 복원`+(state.carousel.restored?' · 회전목마 복원 완료':''));
    $('#chapter').textContent=state.completed===3?'내가 깨운 빛의 도시':'꺼진 가로등에 빛을 돌려줘요';
    $('#mission-action').disabled=!!reveal||approaching!==null;
    if(reveal){$('#mission-action').textContent='빛이 퍼지고 있어요';$('#mission-line').textContent=['가로등에서 꽃길로, 빛이 번져요.','다리 너머 정원과 창문이 깨어나요.','분수에서 첨탑까지, 도시가 빛나요.','회전목마와 꽃빛 정원이 깨어나요.'][reveal.index];}
    else if(approaching!==null){$('#mission-action').textContent='광장으로 걸어가는 중';$('#mission-line').textContent='별여우가 길을 따라 걸어요.';}
    for(let i=0;i<3;i++){const text=clueIndex()===i?['꽃 사이 반짝임','정원 속 새 단서','금빛 목마 그림'][i]:i===0&&firstMode()?'왜 꺼졌을까?':i===1&&bridgeMode()?'이번에는 어디가 다를까?':i===2&&fountainMode()?'또 다른 고장일까?':targets[i].name;markers[i].querySelector('small').textContent=text;markers[i].setAttribute('aria-label',text+' 살펴보기');}
    if(!reveal&&approaching===null){
      $('#mission-action').disabled=false;
      $('#mission-action').textContent=searchNear?(needsClue()?'꽃 속 그림 살펴보기 · E':state.carousel.restored?'밝기 다시 비교하기 · E':['가로등 살펴보기 · E','다리 가로등 살펴보기 · E','분수 가로등 살펴보기 · E','회전목마 살펴보기 · E'][state.completed]):state.carousel.restored?'여우 따라가기 · F':'길 찾기 도움 · H';
      const quiet=needsClue()?'불이 켜진 꽃 사이에 그림이 나타났어요.':state.completed===0?'별여우와 함께 꺼진 불빛을 찾아봐요.':state.carousel.restored?'빛의 도시를 천천히 거닐어 보세요.':'그림 속 모양을 떠올리며 걸어봐요.';
      const soft=needsClue()?'꽃잎 사이에서 작은 빛이 반짝여요.':state.completed===0?'길가의 꺼진 등을 가까이 살펴볼까요?':['','휘어진 길과 별 장식을 찾아볼까요?','꽃잎 모양이 보이는 곳을 살펴볼까요?','금빛 지붕과 작은 목마를 찾아볼까요?'][state.completed];
      $('#mission-line').textContent=state.carousel.restored?'네가 연결한 회로로 빛의 도시가 깨어났어요!':searchNear?(needsClue()?'꽃잎 아래에 그림이 있어요!':'가까이 왔어요. 직접 살펴볼까요?'):searchLevel>=3?'갈림길의 작은 별빛을 따라 걸어볼까요?':searchLevel>=2?'발밑에 별빛이 모였어요. 조금 따라가 봐요.':searchLevel===1?soft:quiet;
    }
    if(!reveal&&approaching===null&&!searchNear){if(nearRead>=0){$('#mission-action').textContent=seekNext()?'그림 속 장소 찾기 · H':'이 그림 다시 읽기 · E';if(searchLevel===0&&!needsClue())$('#mission-line').textContent='그림과 같은 모양이 보이는지 둘러보세요.';}else if(nearLandmark>=0){$('#mission-action').textContent='이곳 살펴보기 · E';if(searchLevel===0)$('#mission-line').textContent='눈에 띄는 모양이 있어요. 가까이 살펴볼까요?';}else if(nearRepaired>=0){$('#mission-action').textContent=needsClue()?'꽃 속 그림 찾기 · H':'회로 다시 실험하기 · E';if(!needsClue()&&searchLevel===0)$('#mission-line').textContent='고친 가로등의 회로를 다시 살펴볼까요?';}else if(nearFlower>=0){$('#mission-action').textContent=world.curiosities.name(nearFlower)+(world.curiosities.hasGreeted(nearFlower)?'에 다시 인사 · E':'에 인사 · E');if(searchLevel===0)$('#mission-line').textContent=world.curiosities.hasGreeted(nearFlower)?'아까 만난 꽃이에요. 다시 반겨 줄까요?':'꽃잎이 여우를 바라봐요. 인사하면 무슨 일이 생길까요?';}}
    const coach=!learnedMove&&!searchNear&&!reveal&&!modal()&&state.completed===0;document.body.classList.toggle('learning-move',coach);
    if(coach)$('#mission-line').textContent=touch?'왼쪽 별을 밀어서 여우를 걸어 보세요.':'방향키로 여우를 걸어 보세요. 길을 눌러도 돼요.';
    for(const id of ['mission-action','explore-help']){const b=$('#'+id);if(touch)b.textContent=b.textContent.replace(/ · [EFBH]$/,'');}
    $('#explore-help').textContent=seekNext()?((needsClue()?'회로 실험 (선택)':'그림 다시 보기')+(touch?'':' · E')):(touch?'길 찾기 도움':'길 찾기 도움 · H');$('#explore-help').setAttribute('aria-label',$('#explore-help').textContent);
    if(!reveal&&!modal()&&clock<flavorUntil)$('#mission-line').textContent=flavorText;
    notebook.remember(!needsClue()&&!state.carousel.restored?state.completed-1:-1);
    $('#notebook-open').disabled=!!reveal||approaching!==null;
    $('#explore-help').hidden=!!reveal||state.carousel.restored||(seekNext()&&!needsClue())||(!searchNear&&nearRead<0&&nearLandmark<0&&nearRepaired<0&&nearFlower<0);
    $('#save-note').hidden=storageOK;
    markers.forEach((b,i)=>{b.hidden=!searchNear||i!==(needsClue()?clueIndex():state.completed)||!!reveal||panel.isOpen||series.isOpen||$('#clue-dialog').open||(i===3&&state.carousel.restored);b.disabled=approaching!==null;});
    $('#replay').hidden=state.completed!==3||needsClue();
  }
  $('#notebook-open').onclick=openBook;$('#mission-action').onclick=()=>seekNext()?hint():interact();$('#explore-help').onclick=()=>seekNext()?interact():hint();
  $('#clue-close').onclick=()=>$('#clue-dialog').close();
  $('#clue-dialog').addEventListener('close',()=>{if(!reveal)goView('fox');if(needsClue()&&nearClue(clueIndex()))say('그림이 아직 수첩에 없어요. 다시 열어 담아 둘까요?');else render();notebook.restoreFocus();});
  $('#restart-game').onclick=()=>$('#restart-dialog').showModal();
  $('#keep-game').onclick=()=>$('#restart-dialog').close();
  $('#confirm-restart').onclick=()=>{
    if(saveBlocked){try{localStorage.setItem(SAVE_KEY+'-unreadable-backup',localStorage.getItem(SAVE_KEY));}catch{$('#save-note').textContent='이전 기록을 보존하지 못했어요. 새로고침 없이 계속할 수 있어요.';$('#save-note').hidden=false;$('#restart-dialog').close();return;}}
    state=freshProgress();search=createSearchHints();observingUntil=0;flavorUntil=0;world.curiosities.reset();saveBlocked=false;approaching=null;reveal=null;replayPending=false;clueApproach=false;save();resume(22);learnedMove=false;moveOrigin.copy(world.hero.position);document.body.classList.remove('revealing');$('#restart-dialog').close();updateSearch(0);render();
  };
  $('#replay').onclick=()=>{if(state.completed!==3||needsClue()||reveal||approaching!==null)return;if(state.carousel.restored){replayPending=true;approach(3);return;}reveal={index:2,start:clock,all:true};goView('entrance');document.body.classList.add('revealing');render();};
  $('#circuit-dialog').addEventListener('close',()=>{practiceIndex=null;if(!reveal)goView('fox');render();$('#mission-action').focus();});
  $('#series-dialog').addEventListener('close',()=>{if(!reveal)goView('fox');render();$('#mission-action').focus();});
  function update(dt,isWalking,activity={}){
    clock+=dt;if(!learnedMove&&world.hero.position.distanceTo(moveOrigin)>.7){learnedMove=true;render();}if(flavorUntil>0&&clock>=flavorUntil){flavorUntil=0;render();}panel.update(dt);series.update(dt);updateSearch(dt,{...activity,moving:isWalking});
    const near=nearNode(targets[0].node),nearB=nearNode(targets[1].node),nearF=nearNode(targets[2].node);
    if(near!==nearFirst||nearB!==nearBridge||nearF!==nearFountain){nearFirst=near;nearBridge=nearB;nearFountain=nearF;render();}
    if(approaching!==null&&!isWalking&&!$('#restart-dialog').open){const i=approaching;approaching=null;if(!nearNode(targets[i].node)){clueApproach=false;replayPending=false;goView('fox');}else if(clueApproach){clueApproach=false;showClue();}else if(storyAt(i)){faceLamp(i);}else if(i===3&&replayPending){replayPending=false;reveal={index:3,start:clock,origin:world.hero.position.clone()};document.body.classList.add('revealing');}else if(i===3)series.open(state.carousel);else panel.open(state.drafts[i],world.stations[i].name,i);render();}
    const values=[0,1,2].map(i=>i<state.completed?1:0);
    let carouselLight=state.carousel.restored?1:0;
    let festivalProgress=state.carousel.restored?1:0,festivalRunning=false;
    const origin=reveal?.origin||world.carouselStation.position;
    if(reveal){const t=Math.min(1,(clock-reveal.start)/(reduceMotion?3:reveal.index===3?FESTIVAL_SECONDS:reveal.index===0&&state.firstLamp?6:REVEAL_SECONDS));if(reveal.all){values[0]=Math.min(1,t*2.5);values[1]=Math.max(0,Math.min(1,(t-.2)*2));values[2]=Math.max(0,(t-.5)*2);carouselLight=state.carousel.restored?Math.max(0,(t-.4)/.6):0;}else if(reveal.index===3){festivalProgress=t;festivalRunning=true;carouselLight=festivalTiming(t).carousel;}else values[reveal.index]=t*t*(3-2*t);
      if(t===1){reveal=null;festivalRunning=false;document.body.classList.remove('revealing');goView('fox');updateSearch(0);render();}}
    world.awakening.set(values);
    world.firstClue.setReveal(values[0]);
    world.bridgeClue.setReveal(values[1]);
    world.fountainClue.setReveal(values[2]);
    world.carousel.setLight(carouselLight);
    const phase=festivalTiming(festivalProgress);
    world.awakening.setFestival(phase.radius,origin,festivalRunning&&!reduceMotion?phase.fade:0);
    world.festival.set(festivalProgress,origin,festivalRunning,reduceMotion);
    if(festivalRunning&&reveal){const message=festivalProgress<.16?'별여우의 별빛이 모여요.':festivalProgress<.4?'빛이 꽃길을 따라 퍼져요.':festivalProgress<.7?'창문과 지붕이 차례로 깨어나요.':'빛의 향연이 시작됐어요!';if($('#mission-line').textContent!==message)$('#mission-line').textContent=message;}
    markers.forEach((b,i)=>{if(!searchNear||i!==(needsClue()?clueIndex():state.completed)||reveal||panel.isOpen||series.isOpen||$('#clue-dialog').open||(i===3&&state.carousel.restored)){b.hidden=true;return;}const anchor=needsClue()?clues[clueIndex()].position.clone().add({x:0,y:-.9,z:0}):targets[i].position;const p=project(anchor);b.hidden=p.z< -1||p.z>1||p.x<64||p.x>innerWidth-64||p.y<110||p.y>innerHeight-180;if(!b.hidden){b.style.left=p.x+'px';b.style.top=p.y+'px';}});
  }
  update(0,false);render();
  return {update,interact,hint,openBook,tapClue,walkFeedback,get guide(){return searchLevel>=2?{node:searchNode,level:searchLevel,near:searchNear}:null;},get revealing(){return !!reveal;},get blocked(){return modal()||panel.isOpen||series.isOpen||$('#clue-dialog').open||$('#restart-dialog').open||!!reveal||approaching!==null;},get state(){return {exploration:{node:searchNode,near:searchNear,level:searchLevel,nearRead,nearFlower,nearLandmark,learnedMove,checkpoint:checkpointIndex(state)},completed:state.completed,firstLamp:state.firstLamp,bridgeLamp:state.bridgeLamp,fountainLamp:state.fountainLamp,nearFirst,nearBridge,nearFountain,clue:world.firstClue.state,bridgeClue:world.bridgeClue.state,fountainClue:world.fountainClue.state,clueOpen:$('#clue-dialog').open,approaching,revealing:!!reveal,progress:world.awakening.progress,radii:world.awakening.radii,circuitOpen:panel.isOpen,practiceIndex,seriesOpen:series.isOpen,carousel:state.carousel,drafts:state.drafts,storageOK,saveBlocked};}};
}
