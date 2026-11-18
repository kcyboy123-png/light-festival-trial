import {MISSIONS,TEN_SAVE_KEY,freshTenProgress,restoreTenProgress,checkMission} from './mission-model.js?v=trial-20261119-1';
import {BRIEFS} from './mission-guide.js?v=trial-20261119-4';
import {createMissionPanel} from './mission-panel.js?v=trial-20261119-4';
import {festivalTiming} from './festival-timing.js';

export function createGame(world,{travel,resume,goView,project,reduceMotion}){
  const $=s=>document.querySelector(s),sites=world.missionSites;
  let state=freshTenProgress(),storageOK=true,saveBlocked=false,effect=null,wasNear=null,notice=0;
  try{const raw=localStorage.getItem(TEN_SAVE_KEY);if(raw){const restored=restoreTenProgress(raw);if(restored)state=restored;else{saveBlocked=true;storageOK=false;}}}catch{storageOK=false;}
  function save(){if(!saveBlocked)try{localStorage.setItem(TEN_SAVE_KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('#save-note').hidden=storageOK;}
  const modal=()=>!!document.querySelector('dialog[open]');
  const target=()=>sites[Math.min(state.completed,9)];
  const near=()=>world.hero.position.distanceTo(target().position)<1.65;
  function render(){
    const done=state.completed===10;
    $('#progress').textContent=state.completed+' / 10';$('#progress').setAttribute('aria-label','밝힌 장소 '+state.completed+'개 / 10개');
    $('#mission-name').textContent=done?'빛의 도시 완성!':(state.completed+1)+'. '+MISSIONS[state.completed].title;
    $('#mission-line').textContent=done?'열 곳에 빛을 되찾았어요. 완성한 도시를 자유롭게 걸어 보세요.':near()?BRIEFS[state.completed].situation:'빛길을 따라 '+MISSIONS[state.completed].title+'의 불을 고치러 가요.';
    $('#mission-action').textContent=done?'여우 따라 보기':near()?'회로 고치기 · E':'빛길 따라 걷기 · E';
    $('#chapter').textContent=done?'내가 깨운 빛의 도시':'별여우와 함께 빛을 되찾아요';
    $('#save-note').hidden=storageOK;
    $('#save-note').textContent=saveBlocked?'저장 기록을 읽지 못했어요. 이전 기록은 보존했어요.':'기록을 저장하지 못했어요. 이 화면에서는 계속할 수 있어요.';
    wasNear=near();notice=0;
  }
  const panel=createMissionPanel({
    onChange(i,draft){state.drafts[i]=draft;save();},
    onComplete(i,draft){
      if(i!==state.completed||!checkMission(MISSIONS[i],draft).passed)return;
      state.drafts[i]=draft;state.completed++;save();
      effect={index:i,elapsed:0,origin:world.hero.position.clone()};
      $('#light-toast span').textContent=BRIEFS[i].reward;
      $('#light-toast').hidden=false;render();
    },
    onClose(){goView('fox');render();$('#mission-action').focus({preventScroll:true});}
  });
  function interact(){
    if(modal())return;
    if(state.completed===10){goView('fox');return;}
    if(near()){travel(null);panel.open(state.completed,state.drafts[state.completed]);}
    else{travel(target().node);goView('fox');}
  }
  function hint(){if(!modal()){goView('fox');render();}}
  function walkFeedback(blocked){if(blocked&&!modal()){notice=2;$('#mission-line').textContent='길이나 빛길을 눌러 걸어요. 조이스틱으로도 움직일 수 있어요.';}}
  $('#mission-action').onclick=interact;$('#mission-marker').onclick=interact;
  $('#skip-light').onclick=()=>{effect=null;$('#light-toast').hidden=true;};
  $('#restart-game').onclick=()=>{travel(null);$('#restart-dialog').showModal();};
  $('#keep-game').onclick=()=>$('#restart-dialog').close();
  $('#confirm-restart').onclick=()=>{
    if(saveBlocked)try{localStorage.setItem(TEN_SAVE_KEY+'-unreadable-backup',localStorage.getItem(TEN_SAVE_KEY));}catch{$('#save-note').textContent='이전 기록을 보존하지 못해 다시 시작하지 않았어요.';$('#save-note').hidden=false;$('#restart-dialog').close();return;}
    state=freshTenProgress();saveBlocked=false;effect=null;save();resume(22);
    $('#light-toast').hidden=true;$('#restart-dialog').close();render();
  };
  function update(dt){
    if(notice>0){notice-=dt;if(notice<=0)render();}
    if(near()!==wasNear)render();
    const levels=MISSIONS.map((_,i)=>i<state.completed?1:0);
    let finalProgress=state.completed===10?1:0,finalRunning=false;
    const origin=effect?.origin||sites[9].position;
    if(effect){
      effect.elapsed+=dt;const t=Math.min(1,effect.elapsed/(reduceMotion?.6:effect.index===9?5:2.6));
      levels[effect.index]=t*t*(3-2*t);
      if(effect.index===9){finalProgress=t;finalRunning=t<1;levels[9]=festivalTiming(t).carousel;}
      if(t===1){effect=null;$('#light-toast').hidden=true;}
    }
    world.setMissionLights(levels,state.completed<10?state.completed:-1);
    world.awakening.set([(levels[0]+levels[1]+levels[2])/3,(levels[3]+levels[4])/2,(levels[5]+levels[6]+levels[7])/3]);
    world.carousel.setLight(levels[9]);
    const phase=festivalTiming(finalProgress),garden=levels[8]*35;
    world.awakening.setFestival(Math.max(garden||-5,phase.radius),origin,finalRunning&&!reduceMotion?phase.fade:0);
    world.festival.set(finalProgress,origin,finalRunning,reduceMotion);
    const marker=$('#mission-marker');
    if(state.completed===10||modal()){marker.hidden=true;return;}
    const anchor=target().position.clone();anchor.y+=1.2;const p=project(anchor);
    marker.hidden=p.z< -1||p.z>1||p.x<75||p.x>innerWidth-75||p.y<120||p.y>innerHeight-170;
    if(!marker.hidden){marker.style.left=p.x+'px';marker.style.top=p.y+'px';marker.textContent=(state.completed+1)+'. '+MISSIONS[state.completed].title;}
  }
  document.body.classList.add('playing');
  if(state.completed)resume(sites[state.completed-1].node);
  update(0);render();
  return {update,interact,hint,walkFeedback,
    get guide(){return state.completed<10?{node:target().node,level:3,near:false}:null;},
    get revealing(){return false;},get blocked(){return modal();},
    get state(){return {completed:state.completed,total:10,near:near(),exploration:{node:target().node,near:near(),level:3},drafts:state.drafts,storageOK,saveBlocked,celebrating:!!effect,progress:world.awakening.progress,circuitOpen:panel.isOpen,carousel:{restored:state.completed===10}};}
  };
}
