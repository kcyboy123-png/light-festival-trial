import {studioBulb,diagramBulb,diagramSwitch} from './diagram-art.js?v=trial-20261119-12';
import {labScene} from './lab-art.js?v=trial-20261119-12';
import {LABS,CIRCUIT_QUESTIONS,LAB_QUESTIONS,circuitKey,labState,labPassed,labHint} from './inquiry-model.js?v=trial-20261119-12';
import {MISSIONS,simulate,freshDraft} from './mission-model.js?v=trial-20261119-12';
import {bulbArt,compactCell} from './circuit-art.js?v=trial-20261119-12';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const icons={coil:'M4 7h16v10H4zM7 5v14m4-14v14m4-14v14',permanent:'M5 4v9a7 7 0 0 0 14 0V4h-5v9a2 2 0 0 1-4 0V4Z',switch:'M3 17h3m12 0h3M6 17 17 7M6 15v4m12-4v4',lift:'M5 18h14M12 16V4m-5 5 5-5 5 5',move:'M3 12h18M7 8l-4 4 4 4m10-8 4 4-4 4',cells:'M3 7h16v11H3zM19 10h2v5h-2M7 10v5m-2-2h4',core:'M5 5h14v14H5zM5 8h14M5 16h14',compare:'M4 7h6v12H4zM14 4h6v15h-6M3 22h18',reverse:'M4 8h14l-4-4M20 16H6l4 4',test:'M8 5v14l11-7Z',inspect:'M15 15l6 6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',repair:'M4 9a8 8 0 1 1 0 7M4 3v6h6',bulb:'M8 17h8M9 20h6M8 14a6 6 0 1 1 8 0v3H8Z',path:'M9 21V7q0-4 4-4h4M14 5h7l-1 7h-5Z',room:'M4 4h16v16H4zM12 4v16M4 12h16',dry:'M12 3Q4 12 4 15a8 8 0 0 0 16 0Q20 12 12 3ZM4 22 21 5',head:'M8 3v5m8-5v5M6 8h12v5a6 6 0 0 1-12 0ZM12 19v3',split:'M3 4h7v16H3zm11 0h7v16h-7M5 8h3m8 0h3M5 14h3m8 0h3',check:'m6 12 4 4 8-9M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'};
const button=(action,text,on=false)=>`<button data-lab-action="${action}" aria-pressed="${on}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[action]}"/></svg><span>${text}</span></button>`;
const battery=(x,y,n=1,reverse=false)=>Array.from({length:n},(_,j)=>compactCell('comparison-cell-'+x+'-'+j,x+j*70,y,62,30,!reverse)).join('');
const stage=labScene;
export function createLearningPanel({onChange,onComplete,onClose}){
 const dialog=document.createElement('dialog');dialog.id='learning-dialog';dialog.className='learning-dialog';dialog.setAttribute('aria-labelledby','learning-title');document.body.append(dialog);
 let index=0,draft=null,mode='lab',phase='predict',prediction=null,selected=null,question=null,choices=[],feedback='',finish=null,returnFocus=null,outcome=null,mainQuestion=null;
 const close=()=>dialog.close();
 dialog.addEventListener('close',()=>{if(mode==='lab')onClose();else returnFocus?.focus({preventScroll:true});});
 function choiceUI(){return `<h3 id="learning-question" tabindex="-1">${esc(question.ask)}</h3><div class="learning-choices" role="group" aria-labelledby="learning-question">${choices.map(([id,text])=>`<button data-choice="${id}" aria-pressed="${selected===id}">${esc(text)}</button>`).join('')}</div>`;}
 function circuitResults(){
  const m=MISSIONS[index];let rows=[];
  if(index===2)rows=[['스위치 닫힘',simulate(m,draft)],['스위치 열림',simulate(m,draft,{switches:[false]})]];
  if(index===3)rows=['copper','plastic','rubber'].map(material=>[({copper:'구리',plastic:'플라스틱',rubber:'고무'})[material],simulate(m,{...draft,material})]);
  if(index===4){const before=freshDraft(m);rows=[['① 처음: 플라스틱',simulate(m,before)],['② 구리만 바꿈',simulate(m,{...before,material:'copper'})],['③ 구리 + 선 수리',simulate(m,draft)]];}
  if(index===5)rows=[['전지 한 개',simulate(m,{...draft,cells:1})],['전지 두 개 · 직렬',simulate(m,draft)]];
  if(index===6)rows=[['처음 배선 · 방향만 수리 · 열림',simulate(m,{...freshDraft(m),flipped:false},{switches:[false]})],['전지 한 개 · 닫힘',simulate(m,{...draft,cells:1})],['전지 두 개 · 닫힘',simulate(m,draft)],['전지 두 개 · 열림',simulate(m,draft,{switches:[false]})]];
  if(index>=7)rows=[[true,true],[true,false],[false,true],[false,false]].map(switches=>['A '+(switches[0]?'닫힘':'열림')+' · B '+(switches[1]?'닫힘':'열림'),simulate(m,draft,{switches})]);
  return `<div class="result-grid ${index>=6?'logic-results':''}">${rows.map(([label,r],i)=>`<div class="result-card ${r.brightness[0]>.001?'lit':''}" data-level="${r.brightness[0]>.75?'bright':r.brightness[0]>.001?'dim':'off'}" style="--lamp-light:${r.brightness[0]?Math.min(1,.18+Math.sqrt(r.brightness[0])*.82):0}"><strong>${label}</strong><svg class="work-bulb" viewBox="0 0 260 220" aria-hidden="true">${studioBulb('compare-'+index+'-'+i)}</svg>${index===5?`<svg class="compare-cells" viewBox="0 0 160 36" aria-label="전지 ${i+1}개">${battery(i?12:46,3,i+1)}${i?'<path d="M74 18H82" stroke="#a7d9c8" stroke-width="3"/>':''}</svg>`:''}<span>${r.brightness[0]>.75?'밝게 켜짐':r.brightness[0]>.001?'켜짐':'꺼짐'}${index===5?' · '+(i?'비교 대상':'비교 기준'):''}</span></div>`).join('')}</div><p class="learning-note">${index===5?'같은 3.0 V 전구·같은 배선, 전지는 각각 1.5 V예요. 서로 독립된 두 회로를 비교해요.':index===4?'처음 회로를 재현한 시험 기록이에요. 수리한 회로는 그대로 보존돼요.':index===6?'첫 칸은 고장 난 처음 배선의 시험이에요. 나머지는 고친 회로예요.':index>=7?'수리한 배선은 그대로 두고 A·B의 네 가지 상태를 모두 시험한 결과예요.':'배선은 그대로 두고 한 가지 조건만 바꿔 비교했어요.'}</p>`;
 }
 function render(){
  const active=dialog.querySelector(':focus'),focus=active?.dataset,activeId=active?.id,lab=mode==='lab',s=lab?labState(index,draft):null,ready=lab?s.ready:phase==='observe';
  let content='';
  if(!lab){content=phase==='predict'?`<p>먼저 예상해 보세요. 틀려도 실험하고 고칠 수 있어요.</p><h3>${esc(question.predict)}</h3><div class="learning-choices">${question.predictions.map((t,j)=>`<button data-predict="${j}" aria-pressed="${prediction===j}">${esc(t)}</button>`).join('')}</div>`:circuitResults()+choiceUI();}
  else{
   content='<div class="experiment-workspace">'+stage(index,s)+'<div class="lab-controls">';
   if(index===6)content+=button('coil','전자석',s.tool==='coil')+button('permanent','영구 자석',s.tool==='permanent')+button('switch',s.on?'스위치 열기':'스위치 닫기',s.on)+button('lift','철 장식 들어 보기')+button('move',s.right?'출발점으로':'바구니 위로');
   if(index===7)content+=button('cells','오른쪽 전지 '+(s.cells===1?'하나 더 놓기':'한 개로 바꾸기'),s.cells===2)+button('core','오른쪽 '+(s.sameCore?'철심 바꿔 보기':'같은 철심으로'),!s.sameCore)+button('compare','두 쪽 함께 시험')+button('lift','무거운 장식 옮기기');
   if(index===8)content+=button('switch',s.on?'스위치 열기':'스위치 닫기',s.on)+button('reverse','전지 방향 뒤집기',s.reversed)+button('test','자동차 움직임 시험');
   if(index===9&&!s.repaired)content+=button('inspect','같은 전구로 비교 시험')+button('repair','두 번째 전지 뒤집기')+button('bulb','전구 바꿔 시험');
   if(index===9&&s.repaired)content+=button('path',s.path?'사람 있는 길 끄기':'사람 있는 길 켜기',s.path)+button('room',s.room?'빈 방 불 끄기':'빈 방 불 켜기',s.room)+button('dry',s.dry?'✓ 손의 물기 닦음':'젖은 손 → 물기 닦기',s.dry)+button('head',s.head?'✓ 플러그 머리 잡음':'전선 당김 → 머리 잡기',s.head)+button('split',s.split?'✓ 플러그 몰림 해결':'한 콘센트에 몰림 → 나누기',s.split)+button('check','축제 점검하기');
   content+='</div></div>';
   if(index===8)content+=`<p class="learning-checks">${s.attract?'✓':'○'} 켰을 때 &nbsp; ${s.quiet?'✓':'○'} 껐을 때 &nbsp; ${s.repel?'✓':'○'} 방향을 바꿔 켰을 때</p>`;
   content+=`<p class="lab-status" role="status">${esc(s.message)}</p>`;
   if(ready)content+=choiceUI();
  }
  dialog.innerHTML=`<header><div><small>${index+1} / 10 · ${lab?'도시 탐구':'관찰로 확인'}</small><h2 id="learning-title">${esc(MISSIONS[index].title)}</h2></div><button id="learning-close" aria-label="탐구 닫기">×</button></header>${lab?'<p id="learning-goal">'+esc(LABS[index-6].task)+'</p>':''}${content}<p id="learning-feedback" role="status" aria-live="polite">${esc(feedback)}</p><footer>${lab?'<button id="lab-undo" '+(!draft.actions.length?'disabled':'')+'>되돌리기</button><button id="lab-reset">다시 해 보기</button>':''}<button id="learning-hint">관찰 도움</button><button id="learning-submit" ${(!lab&&phase==='predict'?prediction===null:!ready||selected===null)?'disabled':''}>${!lab&&phase==='predict'?'예상하고 실험하기':lab?'확인하고 빛 보내기':'관찰 결과 확인'}</button></footer><p class="learning-note">${lab?'모의 실험이에요. 실제 전기 기구를 분해하거나 콘센트에서 실험하지 않아요.':''}${lab&&index===7?' 장식 무게와 들리는 모습은 원리를 보여 주는 모의 결과예요.':''}</p>`;
  dialog.querySelector('#learning-close').onclick=close;
  for(const b of dialog.querySelectorAll('[data-predict]'))b.onclick=()=>{prediction=+b.dataset.predict;render();};
  for(const b of dialog.querySelectorAll('[data-choice]'))b.onclick=()=>{selected=b.dataset.choice;feedback='선택했어요. 아래 확인 버튼을 눌러요.';render();};
  for(const b of dialog.querySelectorAll('[data-lab-action]'))b.onclick=()=>{
   if(index===6&&s.held&&['coil','permanent'].includes(b.dataset.labAction)){feedback='들고 있는 동안에는 장치를 바꿀 수 없어요. 되돌리기로 들기 전으로 돌아가요.';render();return;}
   if(draft.actions.length>=160){feedback='실험 기록이 가득 찼어요. 다시 해 보기로 새 시험을 시작할 수 있어요.';render();return;}
   draft.actions.push(b.dataset.labAction);draft.answer=null;selected=null;feedback='';onChange(index,structuredClone(draft));render();
   if(!s.ready&&labState(index,draft).ready){const q=dialog.querySelector('#learning-question');q.focus({preventScroll:true});q.scrollIntoView({block:'center'});}
  };
  dialog.querySelector('#lab-undo')?.addEventListener('click',()=>{draft.actions.pop();draft.answer=null;selected=null;feedback='마지막 조작을 되돌렸어요.';onChange(index,structuredClone(draft));render();});
  dialog.querySelector('#lab-reset')?.addEventListener('click',()=>{draft.actions=[];draft.answer=null;selected=null;feedback='처음 상태에서 다시 시험해요.';onChange(index,structuredClone(draft));render();});
  dialog.querySelector('#learning-hint').onclick=()=>{feedback=lab?labHint(index,s):phase==='predict'?'예상을 하나 골라 실험하기를 눌러요. 예상이 틀려도 괜찮아요.':question.hint;render();};
  dialog.querySelector('#learning-submit').onclick=()=>{
   if(!lab&&phase==='predict'){if(prediction===null)return;phase='observe';if(mainQuestion.outcome){question=mainQuestion.outcome;choices=shuffle(question.choices);}feedback='예상과 달라도 괜찮아요. 실제 결과를 보고 판단해요.';render();dialog.scrollTop=0;return;}
   if(!ready||selected===null)return;
   if(selected!==question.answer){feedback='관찰 결과와 아직 맞지 않아요. '+question.hint;render();return;}
   if(!lab&&mainQuestion.outcome&&outcome===null){outcome=selected;selected=null;question=mainQuestion;choices=shuffle(question.choices);feedback='결과를 확인했어요. 이제 조건을 바꾸면 어떻게 될지 생각해요.';render();const q=dialog.querySelector('#learning-question');q.focus({preventScroll:true});q.scrollIntoView({block:'center'});return;}
   if(lab){draft.answer=selected;if(!labPassed(index,draft))return;onChange(index,structuredClone(draft));dialog.close();onComplete(index,structuredClone(draft));}
   else{const e={key:circuitKey(draft),prediction,observed:true,answer:selected,...(outcome?{outcome}:{})};dialog.close();finish(e);}
  };
  if(focus){const selector=focus.choice?'[data-choice="'+focus.choice+'"]':focus.predict!==undefined?'[data-predict="'+focus.predict+'"]':focus.labAction?'[data-lab-action="'+focus.labAction+'"]':activeId?'#'+activeId:null;let next=selector?dialog.querySelector(selector):null;if(!next||next.disabled)next=dialog.querySelector(ready?'#learning-question':'.lab-controls button:not(:disabled)');next?.focus({preventScroll:true});}
 }
 function open(i,d,isLab,done){index=i;draft=structuredClone(d);mode=isLab?'lab':'circuit';question=isLab?LAB_QUESTIONS[i-6]:CIRCUIT_QUESTIONS[i];mainQuestion=question;outcome=null;choices=shuffle(question.choices);selected=null;prediction=null;phase='predict';feedback='';finish=done;returnFocus=document.activeElement;render();dialog.setAttribute('aria-describedby',isLab?'learning-goal':'learning-title');dialog.showModal();dialog.scrollTop=0;}
 return {openLab:(i,d)=>open(i,d,true),openCircuit:(i,d,done)=>open(i,d,false,done),get isOpen(){return dialog.open;}};
}
