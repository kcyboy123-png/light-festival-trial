import {MISSIONS,freshDraft,checkMission} from './mission-model.js?v=trial-20261118-6';
import {bulbArt} from './circuit-art.js';

const copy=d=>JSON.parse(JSON.stringify(d));
export function createMissionPanel({onChange,onComplete,onClose}){
  const dialog=document.querySelector('#work-dialog'),parts=dialog.querySelector('#work-parts'),board=dialog.querySelector('#work-board'),wires=dialog.querySelector('#work-wires');
  const message=dialog.querySelector('#work-message'),feedback=dialog.querySelector('#work-feedback'),primary=dialog.querySelector('#work-test');
  let index=0,m=MISSIONS[0],draft=freshDraft(m),selected=null,erasing=false,result=null,history=[],drag=null,suppressClick=0;
  const port=(id,label,side)=>`<button class="connect-point ${id==='p'?'positive':id==='n'?'negative':''}" data-port="${id}" data-side="${side}" aria-label="${label}"><span>${id==='p'?('+'):id==='n'?(draft.cells===2&&draft.flipped?'+':'−'):'●'}</span></button>`;
  const ends=(a,b,label)=>`<div class="connection-ends">${port(a,label+' 왼쪽 연결점','left')}${port(b,label+' 오른쪽 연결점','right')}</div>`;
  function cell(x,flipped=false){return `<g transform="translate(${x} 0)"><rect x="0" y="15" width="94" height="52" rx="9" fill="#c98761" stroke="#f0c59c" stroke-width="2"/><path d="M64 16H85Q94 16 94 25V57Q94 66 85 66H64Z" fill="#acc3ca"/><rect x="${flipped?-8:94}" y="31" width="8" height="20" rx="2" fill="#e5d5a7"/><text x="${flipped?15:78}" y="48" text-anchor="middle" fill="#102633" font-size="27" font-weight="700">+</text><text x="${flipped?78:15}" y="48" text-anchor="middle" fill="#102633" font-size="27" font-weight="700">−</text><text x="47" y="48" text-anchor="middle" fill="#fff8e9" font-size="16" font-weight="700">1.5V</text></g>`;}
  function renderParts(){
    const lamps=Array.from({length:m.bulbs},(_,i)=>{const id=String.fromCharCode(97+i),name=m.bulbs===1?'전구':'전구 '+id.toUpperCase();return `<section class="work-part lamp-part lamp-${i}" data-lamp="${i}"><h3>${name}</h3><svg class="work-bulb" viewBox="0 0 260 220" aria-hidden="true">${bulbArt('ten-'+index+'-'+id)}</svg>${ends(id+'1',id+'2',name)}</section>`;}).join('');
    const switches=Array.from({length:m.switches},(_,i)=>{const id=i?'t':'s',name=m.switches===1?'스위치':'스위치 '+(i?'B':'A');return `<section class="work-part switch-part switch-${i}"><h3>${name}</h3><button class="work-switch" data-switch="${i}" aria-label="${name} ${draft.switches[i]?'열기':'닫기'}" aria-pressed="${draft.switches[i]}"><svg viewBox="0 0 180 60" aria-hidden="true"><path d="M22 44H158" stroke="#4c6a72" stroke-width="5"/><circle cx="30" cy="42" r="9" fill="#e5c27c"/><circle cx="150" cy="42" r="9" fill="#e5c27c"/><path d="M30 42L${draft.switches[i]?'150 42':'127 9'}" stroke="${draft.switches[i]?'#ffe2a1':'#90a8b0'}" stroke-width="10" stroke-linecap="round"/></svg><span>${draft.switches[i]?'닫힘 · 누르면 열려요':'열림 · 누르면 닫혀요'}</span></button>${ends(id+'1',id+'2',name)}</section>`;}).join('');
    const battery=`<section class="work-part power-part"><h3>전지 ${draft.cells===2?'두 개 · 직렬':'한 개'}</h3><svg class="work-cells" viewBox="${draft.cells===2?'0 0 240 82':'60 0 120 82'}" aria-hidden="true">${draft.cells===2?'<path d="M106 41H132" stroke="#b4e4d9" stroke-width="7"/>'+cell(12,true)+cell(132,!draft.flipped):cell(73,true)}</svg>${ends('p','n','전지')}<div class="cell-actions">${m.cellChoice?`<button id="cell-count">${draft.cells===1?'전지 하나 더 놓기':'전지 한 개로 비교'}</button>`:''}${draft.cells===2?'<button id="cell-flip">두 번째 전지 뒤집기</button>':''}</div></section>`;
    const material=m.material?`<section class="work-part material-part"><h3>연결할 재료</h3><div class="material-options">${[['copper','구리'],['plastic','플라스틱'],['rubber','고무']].map(([id,label])=>`<button data-material="${id}" aria-pressed="${draft.material===id}">${label}</button>`).join('')}</div>${ends('m1','m2','재료')}</section>`:'';
    board.dataset.bulbs=m.bulbs;board.dataset.switches=m.switches;board.dataset.material=!!m.material;
    parts.innerHTML=lamps+switches+battery+material;
    for(const b of parts.querySelectorAll('[data-port]')){
      b.onclick=e=>{if(e.isTrusted&&performance.now()<suppressClick)return;choose(b.dataset.port);};
      b.onpointerdown=e=>{if(e.button!==0)return;drag={id:b.dataset.port,x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);};
      b.onpointerup=e=>{if(!drag)return;const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-port]');if(end&&end.dataset.port!==drag.id&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){const start=drag.id,finish=end.dataset.port;suppressClick=performance.now()+350;requestAnimationFrame(()=>{if(!dialog.open)return;selected=start;choose(finish);});}drag=null;};
      b.onpointercancel=()=>drag=null;
    }
    for(const b of parts.querySelectorAll('[data-switch]'))b.onclick=()=>edit(()=>{draft.switches[+b.dataset.switch]=!draft.switches[+b.dataset.switch];});
    for(const b of parts.querySelectorAll('[data-material]'))b.onclick=()=>edit(()=>{draft.material=b.dataset.material;});
    parts.querySelector('#cell-count')?.addEventListener('click',()=>edit(()=>{draft.cells=draft.cells===1?2:1;}));
    parts.querySelector('#cell-flip')?.addEventListener('click',()=>edit(()=>{draft.flipped=!draft.flipped;}));
    updateView();requestAnimationFrame(drawWires);
  }
  function edit(change,rebuild=true){history.push(copy(draft));if(history.length>40)history.shift();change();selected=null;result=null;onChange(index,copy(draft));if(rebuild)renderParts();else{updateView();drawWires();}}
  function choose(id){
    if(erasing){const attached=draft.wires.findIndex(w=>w.includes(id));if(attached>=0)edit(()=>draft.wires.splice(attached,1),false);return;}
    if(selected===id){selected=null;updateView();return;}
    if(!selected){selected=id;updateView();return;}
    const a=selected;if(draft.wires.some(w=>w.includes(a)&&w.includes(id))){selected=null;message.textContent='이미 이어진 두 점이에요.';updateView(false);return;}
    if(draft.wires.length>=16){selected=null;message.textContent='쓰지 않는 전선을 지우고 다시 연결해요.';updateView(false);return;}
    edit(()=>draft.wires.push([a,id]),false);
  }
  function drawWires(){
    if(!dialog.open)return;const rect=board.getBoundingClientRect();wires.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    const partRects=[...parts.querySelectorAll('.work-part')].map(el=>{const r=el.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top};});
    const point=id=>{const el=parts.querySelector(`[data-port="${id}"]`),r=el.getBoundingClientRect();return {x:r.x+r.width/2-rect.x,y:r.y+r.height/2-rect.y,top:el.closest('.work-part').getBoundingClientRect().top-rect.top,bottom:el.closest('.work-part').getBoundingClientRect().bottom-rect.top,side:el.dataset.side==='left'?-1:1};};
    wires.innerHTML=draft.wires.map(([a,b],i)=>{const p=point(a),q=point(b),px=p.x+p.side*34,qx=q.x+q.side*34,same=Math.abs(p.top-q.top)<30,mid=same?Math.max(p.bottom,q.bottom)+22+(i%4)*7:((p.top<q.top?p.bottom:q.bottom)+(p.top<q.top?q.top:p.top))/2+(i%3-1)*8;const intermediate=!same&&partRects.some(r=>r.top>Math.min(p.top,q.top)+15&&r.bottom<Math.max(p.bottom,q.bottom)-15);const lane=p.side<0?12:rect.width-12,down=p.top<q.top,py=down?p.bottom+20:p.top-20,qy=down?q.top-20:q.bottom+20;const path=intermediate?`M${p.x} ${p.y}H${px}V${py}H${lane}V${qy}H${qx}V${q.y}H${q.x}`:`M${p.x} ${p.y}H${px}V${mid}H${qx}V${q.y}H${q.x}`;return `<g data-wire="${i}"><path class="wire-bed" d="${path}"/><path class="wire-thread" style="stroke:${a==='p'||b==='p'?'#edb39b':a==='n'||b==='n'?'#a6d5f0':'#a9e0d2'}" d="${path}"/><path class="wire-hit" d="${path}"/></g>`;}).join('');
    wires.querySelectorAll('[data-wire]').forEach(g=>g.addEventListener('click',()=>{if(erasing)edit(()=>draft.wires.splice(+g.dataset.wire,1),false);else{message.textContent='이 선을 지우려면 ‘선 지우기’를 누른 뒤 선을 눌러요.';}}));
  }
  function updateView(updateMessage=true){
    board.classList.toggle('erase-mode',erasing);board.classList.toggle('tested',!!result);dialog.querySelector('#work-erase').setAttribute('aria-pressed',String(erasing));
    dialog.querySelector('#work-erase').textContent=erasing?'지우기 끝내기':'선 지우기';dialog.querySelector('#work-undo').disabled=!history.length;
    for(const b of parts.querySelectorAll('[data-port]')){b.classList.toggle('selected',selected===b.dataset.port);b.classList.toggle('wired',draft.wires.some(w=>w.includes(b.dataset.port)));b.setAttribute('aria-pressed',String(selected===b.dataset.port));}
    if(updateMessage)message.textContent=result?result.message:erasing?'지울 전선 또는 연결점을 누르세요.':selected?'연결할 다른 점을 누르세요.':'연결점 두 곳을 차례로 누르면 전선이 생겨요.';
    feedback.innerHTML=result?result.checks.map(c=>`<span class="condition ${c.ok?'passed':'pending'}">${c.ok?'✓':'○'} ${c.label}</span>`).join(''):'';
    primary.textContent=result?.passed?'이곳에 빛 보내기':'회로 시험하기';primary.classList.toggle('success',!!result?.passed);
    for(const el of parts.querySelectorAll('[data-lamp]')){const value=result?.result.brightness[+el.dataset.lamp]||0;el.style.setProperty('--lamp-light',value?Math.min(1,.18+Math.sqrt(value)*.82):0);el.classList.toggle('lit',value>.001);el.setAttribute('aria-label',`${el.querySelector('h3').textContent} ${value>.001?'켜짐':'꺼짐'}`);}
  }
  primary.onclick=()=>{if(!dialog.open)return;if(result?.passed){const answer=copy(draft);dialog.close();onComplete(index,answer);return;}selected=null;erasing=false;result=checkMission(m,draft);updateView();};
  dialog.querySelector('#work-undo').onclick=()=>{if(!history.length)return;draft=history.pop();selected=null;result=null;onChange(index,copy(draft));renderParts();};
  dialog.querySelector('#work-reset').onclick=()=>edit(()=>{draft=freshDraft(m);});
  dialog.querySelector('#work-erase').onclick=()=>{selected=null;erasing=!erasing;updateView();};
  dialog.querySelector('#work-hint').onclick=()=>{message.textContent=m.hint;};
  dialog.querySelector('#work-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{drag=null;selected=null;onClose();});

  // Activate touch buttons on release; some browsers omit the first synthetic click after a wire drag.
  let touchButton=null,lastTouch=null;
  document.addEventListener('pointerdown',()=>{lastTouch=null;},true);
  dialog.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch')return;
    if(touchButton){touchButton.cancelled=true;return;}
    const button=e.target.closest('button');if(button&&!button.disabled)touchButton={button,id:e.pointerId,x:e.clientX,y:e.clientY,cancelled:false};
  });
  dialog.addEventListener('pointermove',e=>{if(touchButton?.id===e.pointerId&&Math.hypot(e.clientX-touchButton.x,e.clientY-touchButton.y)>8)touchButton.cancelled=true;});
  dialog.addEventListener('pointercancel',()=>touchButton=null);
  dialog.addEventListener('pointerup',e=>{
    if(touchButton?.id!==e.pointerId)return;
    const held=touchButton;touchButton=null;const r=held.button.getBoundingClientRect();
    if(held.cancelled||held.button.disabled||e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
    lastTouch={x:e.clientX,y:e.clientY,time:performance.now()};e.preventDefault();held.button.click();
  });
  document.addEventListener('click',e=>{
    if(e.isTrusted&&e.detail>0&&e.pointerType!=='mouse'&&lastTouch&&Math.hypot(e.clientX-lastTouch.x,e.clientY-lastTouch.y)<30&&performance.now()-lastTouch.time<700){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  new ResizeObserver(drawWires).observe(board);
  return {open(i,saved){index=i;m=MISSIONS[i];draft=copy(saved);history=[];result=null;selected=null;erasing=false;dialog.querySelector('#work-step').textContent=`${i+1} / 10 · ${['처음 연결','처음 연결','회로 탐구','회로 탐구','도전','도전','도전','도전','도전','마지막 도전'][i]}`;dialog.querySelector('#work-title').textContent=m.title;dialog.querySelector('#work-goal').textContent=m.task;dialog.querySelector('#work-note').textContent=m.bulbs>1?'같은 전구를 사용해요. 전선은 연결점에서만 서로 이어져요.':'같은 3.0 V 전구 · 전지는 각각 1.5 V';dialog.showModal();renderParts();},get isOpen(){return dialog.open;}};
}
