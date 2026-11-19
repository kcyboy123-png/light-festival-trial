import {MISSIONS,TEN_SAVE_KEY,freshTenProgress,restoreTenProgress,checkCompletion} from './mission-model.js?v=trial-20261120-1';
import {BRIEFS} from './mission-guide.js?v=trial-20261120-1';
import {createMissionPanel} from './mission-panel.js?v=trial-20261120-1';
import {TIERS,scoreResult,recordWrong} from './score.js?v=trial-20261120-1';
import {festivalTiming} from './festival-timing.js?v=trial-20261120-1';

export function createGame(world,{travel,resume,goView,project,reduceMotion,showReward=()=>{}}){
  const $=s=>document.querySelector(s),sites=world.missionSites;
  let state=freshTenProgress(),storageOK=true,saveBlocked=false,effect=null,wasNear=null,notice=0;
  try{const raw=localStorage.getItem(TEN_SAVE_KEY);if(raw){const restored=restoreTenProgress(raw);if(restored){state=restored;if(JSON.parse(raw).version<4)try{localStorage.setItem(TEN_SAVE_KEY+'-before-hard-circuits',raw);}catch{saveBlocked=true;storageOK=false;}}else{saveBlocked=true;storageOK=false;}}}catch{storageOK=false;saveBlocked=true;}
  state.score??={from:state.completed,wrong:[]};
  function save(){if(!saveBlocked)try{localStorage.setItem(TEN_SAVE_KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('#save-note').hidden=storageOK;}
  const modal=()=>!!document.querySelector('dialog[open]');
  const target=()=>sites[Math.min(state.completed,9)];
  const near=()=>world.hero.position.distanceTo(target().position)<1.65;
  function render(){
    const done=state.completed===10;
    const reward=scoreResult(state);$('#progress').textContent=state.completed+' / 10 · '+reward.points+'점';$('#progress').setAttribute('aria-label','밝힌 장소 '+state.completed+'개, '+reward.points+'점. 티어 보기');
    $('#mission-name').textContent=done?(reward.eligible?reward.tier.name+' · 빛의 도시 완성!':'빛의 도시 완성!'):(state.completed+1)+'. '+MISSIONS[state.completed].title;
    $('#mission-line').textContent=done?'열 곳에 빛을 되찾았어요. 완성한 도시를 자유롭게 걸어 보세요.':near()?BRIEFS[state.completed].situation:'빛길을 따라 '+MISSIONS[state.completed].title+'의 불을 고치러 가요.';
    $('#mission-action').textContent=done?'티어 보상 보기':near()?(state.completed>=6?'회로도 풀기 · E':'회로 고치기 · E'):'빛길 따라 걷기 · E';
    $('#chapter').textContent=state.legacyCompleted>state.completed?'이전 불빛은 보존했어요 · 새 탐구 이어 하기':done?'내가 깨운 빛의 도시':'별여우와 함께 빛을 되찾아요';
    $('#save-note').hidden=storageOK;
    $('#save-note').textContent=saveBlocked?'이전 기록을 보호하려고 새 저장을 멈췄어요. 이 화면에서는 계속할 수 있어요.':'기록을 저장하지 못했어요. 이 화면에서는 계속할 수 있어요.';
    wasNear=near();notice=0;
  }
  const panel=createMissionPanel({
    onWrong(i,phase,answer){const charged=recordWrong(state,i,phase,answer);if(charged){save();render();}return charged;},
    onChange(i,draft){state.drafts[i]=draft;save();},
    onComplete(i,draft){
      if(i!==state.completed||!checkCompletion(i,draft))return;
      state.drafts[i]=draft;state.completed++;save();document.dispatchEvent(new CustomEvent('festival-sound',{detail:state.completed===10?'final':'success'}));
      effect={index:i,elapsed:0,origin:world.hero.position.clone()};showReward(i,0);
      $('#light-toast span').textContent=BRIEFS[i].reward+' · +100점';
      $('#light-toast').hidden=false;render();
    },
    onClose(){if(!effect)goView('fox');render();$(effect?'#skip-light':'#mission-action').focus({preventScroll:true});}
  });
  function interact(){
    if(effect){skipReveal();return;}if(modal())return;
    if(state.completed===10){openRank();return;}
    if(near()){travel(null);panel.open(state.completed,state.drafts[state.completed]);}
    else{travel(target().node);goView('fox');}
  }
  function hint(){if(!modal()){goView('fox');render();}}
  function walkFeedback(blocked){if(blocked&&!modal()){notice=2;$('#mission-line').textContent='길이나 빛길을 눌러 걸어요. 조이스틱으로도 움직일 수 있어요.';}}
  $('#mission-action').onclick=interact;$('#mission-marker').onclick=interact;
  function openRank(){
    travel(null);const r=scoreResult(state),done=state.completed===10,earned=done&&r.eligible;
    $('#rank-title').textContent=earned?'빛의 도시 복원 완료':'빛의 도시 도전';
    $('#rank-name').textContent=earned?r.tier.name:done?'이전 진행 기록':'도전 중';
    $('#rank-medal').style.setProperty('--tier',earned?r.tier.color:'#a9d2d0');
    $('#rank-points').textContent=r.points+'점'+(r.eligible?' / 1000점':'');
    $('#rank-note').textContent=!r.eligible?'이전 진행은 보존했어요. 새로 도전하면 10문제 티어를 받을 수 있어요.':done?'열 곳에 빛을 되찾아 이 배지를 받았어요.':'10곳을 모두 밝히면 최종 티어 배지를 받아요.';
    $('#rank-tiers').innerHTML=TIERS.map((t,i)=>'<li><span style="color:'+t.color+'">'+t.name+'</span><span>'+t.min+(i===6?'점':'–'+(TIERS[i+1].min-1)+'점')+'</span></li>').join('');
    $('#rank-dialog').showModal();$('#rank-close').focus();
  }
  $('#progress').onclick=openRank;
  for(const id of ['rank-close','rank-back'])$('#'+id).onclick=()=>$('#rank-dialog').close();
  $('#rank-dialog').addEventListener('close',()=>$('#mission-action').focus({preventScroll:true}));
  $('#rank-retry').onclick=()=>{$('#rank-dialog').close();$('#restart-dialog').showModal();};

  function skipReveal(){const restoreFocus=document.activeElement===$('#skip-light');effect=null;showReward(null);$('#light-toast').hidden=true;if(restoreFocus)$('#mission-action').focus({preventScroll:true});}
  $('#skip-light').onclick=skipReveal;
  $('#restart-game').onclick=()=>{travel(null);$('#restart-dialog').showModal();};
  $('#keep-game').onclick=()=>$('#restart-dialog').close();
  $('#confirm-restart').onclick=()=>{
    if(saveBlocked)try{localStorage.setItem(TEN_SAVE_KEY+'-unreadable-backup',localStorage.getItem(TEN_SAVE_KEY));}catch{$('#save-note').textContent='이전 기록을 보존하지 못해 다시 시작하지 않았어요.';$('#save-note').hidden=false;$('#restart-dialog').close();return;}
    skipReveal();panel.resetSessions();state=freshTenProgress();saveBlocked=false;save();resume(22);
    $('#light-toast').hidden=true;$('#restart-dialog').close();render();
  };
  function update(dt){
    if(notice>0){notice-=dt;if(notice<=0)render();}
    if(near()!==wasNear)render();
    const levels=MISSIONS.map((_,i)=>i<Math.max(state.completed,state.legacyCompleted)?1:0);
    let finalProgress=Math.max(state.completed,state.legacyCompleted)===10?1:0,finalRunning=false;
    const origin=effect?.origin||sites[9].position;
    if(effect){
      effect.elapsed+=dt;const t=Math.min(1,effect.elapsed/(reduceMotion?.6:effect.index===9?6:4.2));
      showReward(effect.index,t);const lightT=reduceMotion?t:Math.max(0,Math.min(1,(t-.22)/.64));levels[effect.index]=lightT*lightT*(3-2*lightT);
      if(effect.index===9){finalProgress=t;finalRunning=t<1;levels[9]=festivalTiming(t).carousel;}
      if(t===1)skipReveal();
    }
    world.setMissionLights(levels,state.completed<10?state.completed:-1);
    world.awakening.set([(levels[0]+levels[1]+levels[2])/3,(levels[3]+levels[4])/2,(levels[5]+levels[6]+levels[7])/3]);
    world.carousel.setLight(levels[9]);
    const phase=festivalTiming(finalProgress),garden=levels[8]*35;
    world.awakening.setFestival(Math.max(garden||-5,phase.radius),origin,finalRunning&&!reduceMotion?phase.fade:0);
    world.festival.set(finalProgress,origin,finalRunning,reduceMotion);
    const marker=$('#mission-marker');
    if(state.completed===10||modal()||effect){marker.hidden=true;return;}
    const anchor=target().position.clone();anchor.y+=1.2;const p=project(anchor);
    marker.hidden=p.z< -1||p.z>1||p.x<75||p.x>innerWidth-75||p.y<120||p.y>innerHeight-170;
    if(!marker.hidden){marker.style.left=p.x+'px';marker.style.top=p.y+'px';marker.textContent=(state.completed+1)+'. '+MISSIONS[state.completed].title;}
  }
  document.body.classList.add('playing');
  if(state.completed)resume(sites[state.completed-1].node);
  update(0);render();
  return {update,interact,hint,walkFeedback,skipReveal,
    get guide(){return state.completed<10?{node:target().node,level:3,near:false}:null;},
    get revealing(){return !!effect&&!reduceMotion;},get blocked(){return modal()||!!effect&&!reduceMotion;},
    get state(){return {score:scoreResult(state),completed:state.completed,total:10,near:near(),exploration:{node:target().node,near:near(),level:3},drafts:state.drafts,storageOK,saveBlocked,celebrating:!!effect,progress:world.awakening.progress,circuitOpen:panel.isOpen,carousel:{restored:state.completed===10}};}
  };
}
