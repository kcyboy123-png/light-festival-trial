import {LABS,CIRCUIT_QUESTIONS,LAB_QUESTIONS,circuitKey,labState,labPassed,labHint} from './inquiry-model.js?v=trial-20261119-8';
import {MISSIONS,simulate,freshDraft} from './mission-model.js?v=trial-20261119-8';
import {bulbArt} from './circuit-art.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const button=(action,text,on=false)=>`<button data-lab-action="${action}" aria-pressed="${on}">${text}</button>`;
function coil(x,y,on=false,reverse=false,coreHeight=38){return `<g transform="translate(${x} ${y})"><rect data-core-height="${coreHeight}" x="0" y="${(38-coreHeight)/2}" width="140" height="${coreHeight}" rx="12" fill="#a0b3b8" stroke="#e2e7dc" stroke-width="2"/>${Array.from({length:10},(_,i)=>`<path d="M${18+i*10} 2 q-13 17 0 34" fill="none" stroke="#d79965" stroke-width="5"/>`).join('')}<text x="-16" y="-7" text-anchor="middle" fill="#ffd3b4">${on?(reverse?'S':'N'):'—'}</text><text x="156" y="-7" text-anchor="middle" fill="#a9dcf5">${on?(reverse?'N':'S'):'—'}</text></g>`;}
const battery=(x,y,n=1,reverse=false)=>`<g transform="translate(${x} ${y})">${Array.from({length:n},(_,i)=>`<g transform="translate(${i*70} 0)"><rect width="62" height="30" rx="5" fill="#bd8865" stroke="#ead6ac"/><text x="9" y="20" fill="#fff6dc">${reverse?'−':'+'}</text><text x="46" y="20" fill="#fff6dc">${reverse?'+':'−'}</text></g>`).join('')}</g>`;
const star=(x,y)=>`<path transform="translate(${x} ${y})" d="M0 -20 6 -6 22 -6 10 4 14 20 0 11 -14 20 -10 4 -22 -6 -6 -6Z" fill="#eed494" stroke="#fff1c3" stroke-width="2"/>`;
function stage(i,s){
 let art='',label='';
 if(i===6){label=s.delivered?'철 장식 배달 완료':s.held?'장식이 자석에 붙어 있어요':'철 장식을 바구니에 옮겨요';const x=s.right?440:180;
  art=`<path d="M95 245V35H520" stroke="#6a8992" stroke-width="12" fill="none"/><path d="M${x} 35V85" stroke="#e3c68c" stroke-width="4"/>${s.tool==='coil'?coil(x-70,85,s.on):`<rect x="${x-70}" y="85" width="140" height="38" rx="8" fill="#df8d76"/><text x="${x}" y="110" text-anchor="middle">영구 자석</text>`}${star(s.delivered?440:s.held?x:180,s.delivered?215:s.held?151:230)}<path d="M393 205L400 250H480L487 205" fill="none" stroke="#e7c580" stroke-width="5"/><text x="440" y="278" text-anchor="middle">바구니</text>${s.tool==='coil'?battery(35,150)+`<path d="M35 165H20V104H${x-70} M97 165H117V200H145 M205 200H${x+100}V104H${x+70}" fill="none" stroke="#a7d7cd" stroke-width="3"/><circle cx="145" cy="200" r="4" fill="#f3d58f"/><circle cx="205" cy="200" r="4" fill="#f3d58f"/><path d="M145 200L${s.on?'205 200':'195 178'}" stroke="#f3d58f" stroke-width="5"/>`:''}<text x="40" y="238">${s.on?'스위치 닫힘':'스위치 열림'}</text>`;
 }
 if(i===7){label=s.lifted?'무거운 장식 이동 완료':'전지 수만 바꿔 비교해요';art=`<path d="M310 35V270" stroke="#426571" stroke-dasharray="6 7"/>${coil(78,80,true)}${coil(380,80,true,false,s.sameCore?38:52)}${battery(116,210)}${battery(s.cells===1?416:380,210,s.cells)}<path d="M78 99H56V225H116 M178 225H240V99H218 M380 99H356V225H${s.cells===1?416:380} M${s.cells===1?478:512} 225H550V99H520" fill="none" stroke="#a6d4cf" stroke-width="3"/>${s.cells===2?'<path d="M442 225H450" stroke="#a6d4cf" stroke-width="3"/>':''}${s.compared?star(148,174)+star(450,144)+'<path d="M113 195H183 M415 195H485" stroke="#819ca4" stroke-width="3"/>':''}<text x="148" y="35" text-anchor="middle">전지 한 개</text><text x="450" y="35" text-anchor="middle">전지 ${s.cells===1?'한':'두'} 개${s.cells===2?' · 직렬':''}</text><text x="148" y="60" text-anchor="middle">같은 철심·코일</text><text x="450" y="60" text-anchor="middle">${s.sameCore?'같은 철심·코일':'다른 철심'}</text>${s.compared?`<text x="148" y="267" text-anchor="middle">같은 무거운 장식 · 못 듦</text><text x="450" y="267" text-anchor="middle">같은 무거운 장식 · 들림</text>`:''}`;}
 if(i===8){label='현재 설정: '+(!s.on?'스위치 열림':s.reversed?'같은 극이 마주 봐요':'다른 극이 마주 봐요');const x=s.carX;
  art=`${coil(75,110,s.on,!s.reversed)}${battery(112,210,1,s.reversed)}<path d="M75 129H40V225H65 M102 225H112 M174 225H260V129H215" stroke="#adcfc4" stroke-width="3" fill="none"/><circle cx="65" cy="225" r="4" fill="#f3d58f"/><circle cx="102" cy="225" r="4" fill="#f3d58f"/><path data-pole-switch="${s.on?'closed':'open'}" d="M65 225L${s.on?'102 225':'94 205'}" stroke="#f3d58f" stroke-width="4"/><g data-car-x="${x}" transform="translate(${x} 100)"><path d="M0 34V10H85L110 34V72H-10V34Z" fill="#92b4d2" stroke="#e5e8dc" stroke-width="2"/><circle cx="14" cy="75" r="14" fill="#273c4d" stroke="#ddc48d" stroke-width="4"/><circle cx="85" cy="75" r="14" fill="#273c4d" stroke="#ddc48d" stroke-width="4"/><rect x="-20" y="32" width="28" height="30" fill="#adcdf5"/><text x="-6" y="54" text-anchor="middle" fill="#183345">S</text>${star(50,38)}</g><text x="420" y="240" text-anchor="middle">자동차 앞쪽: S극 자석</text><text x="310" y="50" text-anchor="middle">조건을 정한 뒤 움직임을 시험해요</text>`;
 }
 if(i===9&&!s.repaired){label='길의 등이 고장 났어요. 원인을 먼저 찾아요.';art=`${battery(200,120,1)}${battery(275,120,1,true)}<path d="M260 135H275" stroke="#a6d4cf" stroke-width="5"/><text x="310" y="80" text-anchor="middle">길의 전지 두 개 · 만나는 극을 살펴요</text><text x="310" y="215" text-anchor="middle">${s.inspected?'같은 전구: 한 개일 때 켜짐 / 지금 두 개일 때 꺼짐':'같은 전구로 시험하고 고장 원인을 찾아요.'}</text>`;}
 if(i===9&&s.repaired){label='사람이 있는 길과 빈 방을 살펴요';art=`<path d="M50 260Q300 180 565 260" fill="none" stroke="${s.path?'#dfc583':'#314a59'}" stroke-width="46"/><path d="M45 120L145 40 245 120V215H45Z" fill="#395268" stroke="#9cb9be" stroke-width="3"/><path d="M365 120L465 40 565 120V215H365Z" fill="#395268" stroke="#9cb9be" stroke-width="3"/><rect x="90" y="125" width="100" height="60" rx="4" fill="${s.room?'#f3d79a':'#19313f'}"/><rect x="410" y="125" width="100" height="60" rx="4" fill="#f3d79a"/><text x="140" y="108" text-anchor="middle">빈 방</text><text x="465" y="108" text-anchor="middle">축제 가게 · 사람 있음</text><path d="M300 210V90H330" stroke="#bda77c" stroke-width="7"/><circle cx="330" cy="100" r="16" fill="${s.path?'#ffe4a2':'#345468'}"/><circle cx="285" cy="226" r="9" fill="#e5c5aa"/><path d="M285 236V262M285 245L272 251M285 245L298 251" stroke="#e5c5aa" stroke-width="5"/>`;}
 return `<figure class="lab-stage"><svg viewBox="0 0 620 300" role="img" aria-label="${esc(label)}"><defs><linearGradient id="stage-bg" x2="0" y2="1"><stop stop-color="#153849"/><stop offset="1" stop-color="#102633"/></linearGradient></defs><rect width="620" height="300" rx="18" fill="url(#stage-bg)"/>${art}</svg><figcaption>${esc(label)}</figcaption></figure>`;
}
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
  return `<div class="result-grid">${rows.map(([label,r],i)=>`<div class="result-card ${r.brightness[0]>.001?'lit':''}" data-level="${r.brightness[0]>.75?'bright':r.brightness[0]>.001?'dim':'off'}" style="--lamp-light:${r.brightness[0]}"><strong>${label}</strong><svg class="work-bulb" viewBox="0 0 260 220" aria-hidden="true">${bulbArt('compare-'+index+'-'+i)}</svg>${index===5?`<svg class="compare-cells" viewBox="0 0 160 36" aria-label="전지 ${i+1}개">${battery(i?12:46,3,i+1)}${i?'<path d="M74 18H82" stroke="#a7d9c8" stroke-width="3"/>':''}</svg>`:''}<span>${r.brightness[0]>.001?'켜짐':'꺼짐'}${index===5?' · '+(i?'비교 대상':'비교 기준'):''}</span></div>`).join('')}</div><p class="learning-note">${index===5?'같은 3.0 V 전구·같은 배선, 전지는 각각 1.5 V예요. 서로 독립된 두 회로를 비교해요.':index===4?'처음 회로를 재현한 시험 기록이에요. 수리한 회로는 그대로 보존돼요.':'배선은 그대로 두고 한 가지 조건만 바꿔 비교했어요.'}</p>`;
 }
 function render(){
  const active=dialog.querySelector(':focus'),focus=active?.dataset,activeId=active?.id,lab=mode==='lab',s=lab?labState(index,draft):null,ready=lab?s.ready:phase==='observe';
  let content='';
  if(!lab){content=phase==='predict'?`<p>먼저 예상해 보세요. 틀려도 실험하고 고칠 수 있어요.</p><h3>${esc(question.predict)}</h3><div class="learning-choices">${question.predictions.map((t,j)=>`<button data-predict="${j}" aria-pressed="${prediction===j}">${esc(t)}</button>`).join('')}</div>`:circuitResults()+choiceUI();}
  else{
   content=stage(index,s)+'<div class="lab-controls">';
   if(index===6)content+=button('coil','전자석',s.tool==='coil')+button('permanent','영구 자석',s.tool==='permanent')+button('switch',s.on?'스위치 열기':'스위치 닫기',s.on)+button('lift','철 장식 들어 보기')+button('move',s.right?'출발점으로':'바구니 위로');
   if(index===7)content+=button('cells','오른쪽 전지 '+(s.cells===1?'하나 더 놓기':'한 개로 바꾸기'),s.cells===2)+button('core','오른쪽 '+(s.sameCore?'철심 바꿔 보기':'같은 철심으로'),!s.sameCore)+button('compare','두 쪽 함께 시험')+button('lift','무거운 장식 옮기기');
   if(index===8)content+=button('switch',s.on?'스위치 열기':'스위치 닫기',s.on)+button('reverse','전지 방향 뒤집기',s.reversed)+button('test','자동차 움직임 시험');
   if(index===9&&!s.repaired)content+=button('inspect','같은 전구로 비교 시험')+button('repair','두 번째 전지 뒤집기')+button('bulb','전구 바꿔 시험');
   if(index===9&&s.repaired)content+=button('path',s.path?'사람 있는 길 끄기':'사람 있는 길 켜기',s.path)+button('room',s.room?'빈 방 불 끄기':'빈 방 불 켜기',s.room)+button('dry',s.dry?'✓ 손의 물기 닦음':'젖은 손 → 물기 닦기',s.dry)+button('head',s.head?'✓ 플러그 머리 잡음':'전선 당김 → 머리 잡기',s.head)+button('split',s.split?'✓ 플러그 몰림 해결':'한 콘센트에 몰림 → 나누기',s.split)+button('check','축제 점검하기');
   content+='</div>';
   if(index===8)content+=`<p class="learning-checks">${s.attract?'✓':'○'} 켰을 때 &nbsp; ${s.quiet?'✓':'○'} 껐을 때 &nbsp; ${s.repel?'✓':'○'} 방향을 바꿔 켰을 때</p>`;
   content+=`<p class="lab-status" role="status">${esc(s.message||(index===8?'세 가지 조건에서 시험해 보세요.':LABS[index-6].task))}</p>`;
   if(ready)content+=choiceUI();
  }
  dialog.innerHTML=`<header><div><small>${index+1} / 10 · ${lab?'도시 탐구':'관찰로 확인'}</small><h2 id="learning-title">${esc(MISSIONS[index].title)}</h2></div><button id="learning-close" aria-label="탐구 닫기">×</button></header>${lab?'<p id="learning-goal">목표 · '+esc(LABS[index-6].task)+'</p>':''}${content}<p id="learning-feedback" role="status" aria-live="polite">${esc(feedback)}</p><footer>${lab?'<button id="lab-undo" '+(!draft.actions.length?'disabled':'')+'>되돌리기</button><button id="lab-reset">다시 해 보기</button>':''}<button id="learning-hint">관찰 도움</button><button id="learning-submit" ${(!lab&&phase==='predict'?prediction===null:!ready||selected===null)?'disabled':''}>${!lab&&phase==='predict'?'예상하고 실험하기':lab?'확인하고 빛 보내기':'관찰 결과 확인'}</button></footer><p class="learning-note">${lab?'모의 실험이에요. 실제 전기 기구를 분해하거나 콘센트에서 실험하지 않아요.':''}${index===7?' 장식 무게와 들리는 모습은 원리를 보여 주는 모의 결과예요.':''}</p>`;
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
   if(!lab&&mainQuestion.outcome&&outcome===null){outcome=selected;selected=null;question=mainQuestion;choices=shuffle(question.choices);feedback='밝기를 확인했어요. 이제 비교 방법을 생각해요.';render();const q=dialog.querySelector('#learning-question');q.focus({preventScroll:true});q.scrollIntoView({block:'center'});return;}
   if(lab){draft.answer=selected;if(!labPassed(index,draft))return;onChange(index,structuredClone(draft));dialog.close();onComplete(index,structuredClone(draft));}
   else{const e={key:circuitKey(draft),prediction,observed:true,answer:selected,...(outcome?{outcome}:{})};dialog.close();finish(e);}
  };
  if(focus){const selector=focus.choice?'[data-choice="'+focus.choice+'"]':focus.predict!==undefined?'[data-predict="'+focus.predict+'"]':focus.labAction?'[data-lab-action="'+focus.labAction+'"]':activeId?'#'+activeId:null;let next=selector?dialog.querySelector(selector):null;if(!next||next.disabled)next=dialog.querySelector(ready?'#learning-question':'.lab-controls button:not(:disabled)');next?.focus({preventScroll:true});}
 }
 function open(i,d,isLab,done){index=i;draft=structuredClone(d);mode=isLab?'lab':'circuit';question=isLab?LAB_QUESTIONS[i-6]:CIRCUIT_QUESTIONS[i];mainQuestion=question;outcome=null;choices=shuffle(question.choices);selected=null;prediction=null;phase='predict';feedback='';finish=done;returnFocus=document.activeElement;render();dialog.setAttribute('aria-describedby',isLab?'learning-goal':'learning-title');dialog.showModal();dialog.scrollTop=0;}
 return {openLab:(i,d)=>open(i,d,true),openCircuit:(i,d,done)=>open(i,d,false,done),get isOpen(){return dialog.open;}};
}
