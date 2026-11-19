import {MISSIONS,freshDraft,checkMission,simulate,shortWireIndices} from './mission-model.js?v=trial-20261119-5';
import {bulbArt} from './circuit-art.js';
import {BRIEFS,nextHint,diagnosis,experiments,observationText,OBJECTIVES} from './mission-guide.js?v=trial-20261119-5';

const copy=d=>JSON.parse(JSON.stringify(d));
export function createMissionPanel({onChange,onComplete,onClose}){
  const dialog=document.querySelector('#work-dialog'),parts=dialog.querySelector('#work-parts'),board=dialog.querySelector('#work-board'),wires=dialog.querySelector('#work-wires');
  const message=dialog.querySelector('#work-message'),feedback=dialog.querySelector('#work-feedback'),primary=dialog.querySelector('#work-test');
  let index=0,m=MISSIONS[0],draft=freshDraft(m),selected=null,wireFocus=null,erasing=false,result=null,history=[],drag=null,suppressClick=0,removed=[],inspected=false;
  const sessions=new Map();let hintLevel=0,proof='',trial=null;
  const signature=()=>JSON.stringify(draft),needsProof=()=>index>=2&&proof!==signature();
  const port=(id,label,side)=>`<button class="connect-point ${id==='p'?'positive':id==='n'?'negative':''}" data-port="${id}" data-side="${side}" aria-label="${label}"><span>${id==='p'?('+'):id==='n'?(draft.cells===2&&draft.flipped?'+':'−'):(index===0?'●':m.bulbs>1&&/^[abc]/.test(id)?id.toUpperCase():m.switches===2&&/^[st]/.test(id)?(id[0]==='s'?'A':'B')+id[1]:id.endsWith('1')?'1':'2')}</span><b class="coach-number" aria-hidden="true"></b></button>`;
  const ends=(a,b,label)=>`<div class="connection-ends">${port(a,label+' 왼쪽 연결점','left')}${port(b,label+' 오른쪽 연결점','right')}</div>`;
  function cell(x,flipped=false){return `<g transform="translate(${x} 0)"><rect x="0" y="15" width="94" height="52" rx="9" fill="#c98761" stroke="#f0c59c" stroke-width="2"/><path d="M64 16H85Q94 16 94 25V57Q94 66 85 66H64Z" fill="#acc3ca"/><rect x="${flipped?-8:94}" y="31" width="8" height="20" rx="2" fill="#e5d5a7"/><text x="${flipped?15:78}" y="48" text-anchor="middle" fill="#102633" font-size="27" font-weight="700">+</text><text x="${flipped?78:15}" y="48" text-anchor="middle" fill="#102633" font-size="27" font-weight="700">−</text><text x="47" y="48" text-anchor="middle" fill="#fff8e9" font-size="16" font-weight="700">1.5V</text></g>`;}
  function renderParts(){
    const lamps=Array.from({length:m.bulbs},(_,i)=>{const id=String.fromCharCode(97+i),name=m.bulbs===1?'전구':'전구 '+id.toUpperCase();return `<section class="work-part lamp-part lamp-${i}" data-lamp="${i}"><h3>${name}</h3><svg class="work-bulb" viewBox="0 0 260 220" aria-hidden="true">${bulbArt('ten-'+index+'-'+id)}</svg>${ends(id+'1',id+'2',name)}${m.bulbs>1?'<button class="remove-bulb" data-remove="'+id+'">전구 '+id.toUpperCase()+' 빼 보기</button>':''}</section>`;}).join('');
    const switches=Array.from({length:m.switches},(_,i)=>{const id=i?'t':'s',name=m.switches===1?'스위치':'스위치 '+(i?'B':'A');return `<section class="work-part switch-part switch-${i}"><h3>${name}</h3><button class="work-switch" data-switch="${i}" aria-label="${name} ${draft.switches[i]?'열기':'닫기'}" aria-pressed="${draft.switches[i]}"><svg viewBox="0 0 180 60" aria-hidden="true"><path d="M22 44H158" stroke="#4c6a72" stroke-width="5"/><circle cx="30" cy="42" r="9" fill="#e5c27c"/><circle cx="150" cy="42" r="9" fill="#e5c27c"/><path d="M30 42L${draft.switches[i]?'150 42':'127 9'}" stroke="${draft.switches[i]?'#ffe2a1':'#90a8b0'}" stroke-width="10" stroke-linecap="round"/></svg><span>${draft.switches[i]?'닫힘 · 누르면 열려요':'열림 · 누르면 닫혀요'}</span></button>${ends(id+'1',id+'2',name)}</section>`;}).join('');
    const battery=`<section class="work-part power-part"><h3>전지 ${draft.cells===2?'두 개 · 직렬':'한 개'}</h3><svg class="work-cells" viewBox="${draft.cells===2?'0 0 240 82':'60 0 120 82'}" aria-hidden="true">${draft.cells===2?'<path d="M106 41H132" stroke="#b4e4d9" stroke-width="7"/>'+cell(12,true)+cell(132,!draft.flipped):cell(73,true)}</svg>${ends('p','n','전지')}<p class="cell-junction"></p><div class="cell-actions">${m.cellChoice?`<button id="cell-count">${draft.cells===1?'전지 하나 더 놓기':'전지 한 개로 비교'}</button>`:''}${draft.cells===2?'<button id="cell-flip" aria-label="두 번째 전지 뒤집기">'+(m.bulbs>1?'↻ 뒤집기':'두 번째 전지 뒤집기')+'</button>':''}</div></section>`;
    const material=m.material?`<section class="work-part material-part"><h3>연결할 재료</h3><div class="material-options">${[['copper','구리'],['plastic','플라스틱'],['rubber','고무']].map(([id,label])=>`<button data-material="${id}" aria-pressed="${draft.material===id}"><i class="material-sample sample-${id}" aria-hidden="true"></i>${label}</button>`).join('')}</div>${ends('m1','m2','재료')}</section>`:'';
    board.dataset.mission=index;board.dataset.bulbs=m.bulbs;board.dataset.switches=m.switches;board.dataset.material=!!m.material;
    parts.innerHTML=lamps+switches+battery+material;
    for(const b of parts.querySelectorAll('[data-port]')){
      b.onclick=e=>{if(e.isTrusted&&performance.now()<suppressClick)return;choose(b.dataset.port);};
      b.onpointerdown=e=>{if(e.button!==0)return;drag={id:b.dataset.port,x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);};
      b.onpointerup=e=>{if(!drag)return;const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-port]');if(end&&end.dataset.port!==drag.id&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){const start=drag.id,finish=end.dataset.port;suppressClick=performance.now()+350;requestAnimationFrame(()=>{if(!dialog.open)return;selected=start;choose(finish);});}drag=null;};
      b.onpointercancel=()=>drag=null;
    }
    for(const b of parts.querySelectorAll('[data-remove]'))b.onclick=()=>{removed=removed.includes(b.dataset.remove)?[]:[b.dataset.remove];updateView();};
    for(const b of parts.querySelectorAll('[data-switch]'))b.onclick=()=>edit(()=>{draft.switches[+b.dataset.switch]=!draft.switches[+b.dataset.switch];});
    for(const b of parts.querySelectorAll('[data-material]'))b.onclick=()=>edit(()=>{draft.material=b.dataset.material;});
    parts.querySelector('#cell-count')?.addEventListener('click',()=>edit(()=>{draft.cells=draft.cells===1?2:1;}));
    parts.querySelector('#cell-flip')?.addEventListener('click',()=>edit(()=>{draft.flipped=!draft.flipped;}));
    updateView();requestAnimationFrame(drawWires);
  }
  function edit(change,rebuild=true){history.push(copy(draft));if(history.length>40)history.shift();change();if(checkMission(m,draft).passed)erasing=false;selected=null;wireFocus=null;removed=[];trial=null;inspected=false;result=null;onChange(index,copy(draft));if(rebuild)renderParts();else{updateView();drawWires();}}
  function choose(id){
    wireFocus=null;
    if(erasing){message.textContent='연결점 대신 지울 전선이나 아래 전선 이름을 누르세요.';return;}
    if(selected===id){selected=null;updateView();drawWires();return;}
    if(!selected){if(index===0&&!result.passed&&[['p','a1'],['n','a2']].some(pair=>pair.includes(id)&&draft.wires.some(w=>w.includes(pair[0])&&w.includes(pair[1])))){updateView();message.textContent='여기는 이미 이어져 있어요. ①과 ②가 붙은 큰 원을 찾아요.';return;}selected=id;updateView();drawWires();return;}
    const a=selected;
    if(index===0&&![['p','a1'],['n','a2']].some(pair=>pair.includes(a)&&pair.includes(id))){selected=null;updateView();message.textContent='첫 문제는 전지 ＋와 전구의 왼쪽 큰 원을 이어요. ①과 ②를 찾아보세요.';return;}
    if(draft.wires.some(w=>w.includes(a)&&w.includes(id))){selected=null;message.textContent='이미 이어진 두 점이에요.';updateView(false);return;}
    if(draft.wires.length>=16){selected=null;message.textContent='쓰지 않는 전선을 지우고 다시 연결해요.';updateView(false);return;}
    edit(()=>draft.wires.push([a,id]),false);
  }
  function drawWires(){
    if(!dialog.open)return;const rect=board.getBoundingClientRect();wires.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    const partRects=[...parts.querySelectorAll('.work-part')].map(el=>{const r=el.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top};});
    const point=id=>{const el=parts.querySelector(`[data-port="${id}"]`),r=el.getBoundingClientRect();return {x:r.x+r.width/2-rect.x,y:r.y+r.height/2-rect.y,top:el.closest('.work-part').getBoundingClientRect().top-rect.top,bottom:el.closest('.work-part').getBoundingClientRect().bottom-rect.top,side:el.dataset.side==='left'?-1:1};};
    wires.innerHTML=draft.wires.map(([a,b],i)=>{const p=point(a),q=point(b),px=p.x+p.side*34,qx=q.x+q.side*34,same=Math.abs(p.top-q.top)<30,mid=same?Math.max(p.bottom,q.bottom)+22+(i%4)*7:((p.top<q.top?p.bottom:q.bottom)+(p.top<q.top?q.top:p.top))/2+(i%3-1)*8;const intermediate=!same&&partRects.some(r=>r.top>Math.min(p.top,q.top)+15&&r.bottom<Math.max(p.bottom,q.bottom)-15);const lane=p.side<0?12:rect.width-12,down=p.top<q.top,py=down?p.bottom+20:p.top-20,qy=down?q.top-20:q.bottom+20;const path=intermediate?`M${p.x} ${p.y}H${px}V${py}H${lane}V${qy}H${qx}V${q.y}H${q.x}`:`M${p.x} ${p.y}H${px}V${mid}H${qx}V${q.y}H${q.x}`;return `<g data-wire="${i}" class="${(wireFocus===i||selected&&(a===selected||b===selected))?'wire-selected':''}"><path class="wire-bed" d="${path}"/><path class="wire-thread" style="--wire-color:${(index<4||inspected||hintLevel>0)&&shortWireIndices(m,draft).includes(i)?'#f39786':a==='p'||b==='p'?'#edb39b':a==='n'||b==='n'?'#a6d5f0':'#a9e0d2'}" d="${path}"/><path class="wire-hit" d="${path}"/></g>`;}).join('');
    wires.querySelectorAll('[data-wire]').forEach(g=>g.addEventListener('click',()=>{if(erasing)edit(()=>draft.wires.splice(+g.dataset.wire,1),false);else{wireFocus=+g.dataset.wire;selected=null;updateView();drawWires();}}));
  }

  const portName=id=>id==='p'?'전지 ＋':id==='n'?'전지 '+(draft.cells===2&&draft.flipped?'＋ (오른쪽)':'－'):id[0]==='s'||id[0]==='t'?'스위치 '+(m.switches===2?(id[0]==='s'?'A ':'B '):'')+id[1]:id[0]==='m'?'재료 '+id[1]:'전구 '+(index===0?(id[1]==='1'?'왼쪽 점':'오른쪽 점'):(m.bulbs>1?id[0].toUpperCase()+' ':'')+id[1]);
  function updateView(updateMessage=true){
    result=checkMission(m,draft);
    const preview=trial?trial.steps[trial.at].result:removed.length?simulate(m,draft,{removed}):result.result,bad=shortWireIndices(m,draft);
    const brief=BRIEFS[index];
    board.classList.toggle('erase-mode',erasing);board.classList.toggle('tested',inspected);
    dialog.querySelector('#work-erase').setAttribute('aria-pressed',String(erasing));
    dialog.querySelector('#work-erase').textContent=erasing?'선 지우기 끝내기':'선 지우기';dialog.querySelector('#work-undo').disabled=!history.length;
    const coaching=index===0&&!result.passed&&!bad.length&&!erasing,coachPair=[['p','a1'],['n','a2']].find(pair=>!draft.wires.some(w=>w.includes(pair[0])&&w.includes(pair[1])))||['p','a1'];
    for(const b of parts.querySelectorAll('[data-port]')){
      b.classList.toggle('selected',selected===b.dataset.port);b.classList.toggle('wired',draft.wires.some(w=>w.includes(b.dataset.port)));b.setAttribute('aria-pressed',String(selected===b.dataset.port));
      const step=coaching?(b.dataset.port===coachPair[0]?1:b.dataset.port===coachPair[1]?2:0):0;
      b.classList.toggle('coach-port',!!step);b.classList.toggle('coach-next',!!step&&!!selected&&selected!==b.dataset.port);b.querySelector('.coach-number').textContent=step||'';
    }
    let text=result.passed?(needsProof()?'연결됐어요! ‘'+brief.probe+'’로 목표대로 되는지 확인해요.':(index>=2?'시험까지 성공!':'연결 성공!')+' 아래 ‘이곳에 빛 보내기’를 누르세요.'):index===0?'① '+portName(coachPair[0])+' → ② '+portName(coachPair[1])+'을 차례로 누르세요.':index===1?'스위치의 비스듬한 막대를 누르면 두 점이 이어져요.':brief.try;
    if(!result.passed&&(inspected||result.result.voltage===0&&!result.result.short||index<4&&result.result.short))text=diagnosis(index,m,draft);
    if(wireFocus!==null){const w=draft.wires[wireFocus];text=portName(w[0])+' ↔ '+portName(w[1])+' 선택됨. 아래 이름을 누르면 이 선을 지워요.';}
    if(erasing)text='지울 선을 직접 누르거나, 아래 전선 이름을 눌러 지워요.';
    if(selected)text=index===0?portName(selected)+' 선택했어요. 이제 '+portName(coachPair.find(id=>id!==selected)||coachPair[1])+'을 누르세요.':portName(selected)+' 선택됨 → 이어 줄 다른 연결점을 누르세요.';
    if(removed.length)text='전구 '+removed[0].toUpperCase()+'를 뺐어요. 다른 전구를 관찰한 뒤 다시 꽂아 주세요.';
    if(trial)text='시험 중 · 배선은 그대로예요. 불빛을 보고 ‘'+(trial.at<trial.steps.length-1?'다음 비교':'관찰 끝 · 회로로')+'’를 누르세요.';
    if(updateMessage)message.textContent=text;
    dialog.querySelector('#work-clear-selection').hidden=!selected&&wireFocus===null;
    const showFault=index<4||inspected||hintLevel>0;
    const list=dialog.querySelector('#work-wire-list'),show=erasing||wireFocus!==null||showFault&&bad.length>0;
    list.hidden=!show;list.innerHTML=show?draft.wires.map(([a,b],i)=>(erasing||wireFocus===i||showFault&&bad.includes(i))?'<button data-delete-wire="'+i+'" class="'+(bad.includes(i)?'fault-wire':'')+'">'+(bad.includes(i)?'지름길 · ':'')+portName(a)+' ↔ '+portName(b)+' · 지우기</button>':'').join(''):'';
    list.querySelectorAll('[data-delete-wire]').forEach(b=>b.onclick=()=>edit(()=>draft.wires.splice(+b.dataset.deleteWire,1),false));
    const checks=index===9?[{label:'① 지름길 없음',ok:!result.result.short},{label:'② 전지 방향 맞음',ok:!draft.flipped},...result.checks.filter(c=>c.label!=='전지 2개를 바른 방향으로')]:result.checks;
    feedback.innerHTML='<span class="conditions-title">'+(checks.some(c=>!c.ok)?'목표 확인':'회로 조건 완료')+'</span>'+checks.map(c=>'<span class="condition '+(c.ok?'passed':'pending')+'">'+(c.ok?'✓':'○')+' '+c.label+'</span>').join('');
    dialog.querySelector('#work-check-summary').textContent=result.passed?'✓ 회로 조건 완료 · 자세히':'세부 조건 보기 · '+checks.filter(c=>c.ok).length+' / '+checks.length;
    primary.textContent=trial?'시험 중이에요':removed.length?'전구를 다시 꽂아 주세요':result.passed?(needsProof()?'작동 시험하기':'이곳에 빛 보내기'):'회로 점검';primary.disabled=!!removed.length||!!trial;primary.classList.toggle('success',result.passed&&!removed.length&&!trial&&!needsProof());
    dialog.querySelector('#work-experiment').hidden=!brief.probe;
    const probe=dialog.querySelector('#work-probe');probe.textContent=brief.probe||'';probe.hidden=!!trial;probe.disabled=!!removed.length;
    dialog.querySelector('#work-proof').textContent=proof===signature()?'✓ 이 회로의 작동을 확인했어요':index===2?'목표: 스위치를 끄면 불도 꺼져요':index===6?'목표: 하나를 빼면 둘 다 꺼져요':index===7?'목표: 남은 전구는 밝기 그대로':index===8?'목표: A 스위치는 A만, B 스위치는 B만':index>=4?'고친 뒤 시험하면 빛을 보낼 수 있어요':'배선은 그대로 두고 재료만 비교해요';
    const observation=dialog.querySelector('#work-observation');observation.hidden=!trial;
    if(trial){const step=trial.steps[trial.at];dialog.querySelector('#work-observe-title').textContent=(trial.at+1)+' / '+trial.steps.length+' · '+step.label;dialog.querySelector('#work-observe-result').textContent=observationText(m,draft,step);dialog.querySelector('#work-observe-next').textContent=trial.at<trial.steps.length-1?'다음 비교':'관찰 끝 · 회로로';}
    for(const b of parts.querySelectorAll('button'))b.disabled=!!trial;
    const step=trial?.steps[trial.at],previewSwitches=step?.switches||draft.switches,previewCells=step?.cells||draft.cells;
    for(const b of parts.querySelectorAll('[data-switch]')){
      const on=previewSwitches[+b.dataset.switch],name=m.switches===1?'스위치':'스위치 '+(+b.dataset.switch?'B':'A');
      b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',name+(on?' 끄기':' 켜기'));
      b.querySelector('span').textContent=on?'켜짐 · 누르면 끄기':'꺼짐 · 누르면 켜기';b.classList.toggle('switch-callout',index===1&&!on&&!trial);
      const arm=b.querySelector('svg path:last-child');arm.setAttribute('d','M30 42L'+(on?'150 42':'127 9'));arm.setAttribute('stroke',on?'#ffe2a1':'#90a8b0');
    }
    parts.querySelector('.power-part h3').textContent='전지 '+(previewCells===2?'두 개':'한 개');
    const junction=parts.querySelector('.cell-junction');junction.hidden=previewCells!==2;junction.classList.toggle('opposed',draft.flipped);junction.textContent=draft.flipped?'가운데: − 와 − · 같은 극':'가운데: − 와 ＋ · 다른 극';
    parts.querySelector('[data-port="n"] span').textContent=previewCells===2&&draft.flipped?'＋':'−';
    const batteryArt=parts.querySelector('.work-cells');batteryArt.setAttribute('viewBox',previewCells===2?'0 0 240 82':'60 0 120 82');batteryArt.innerHTML=previewCells===2?'<path d="M106 41H132" stroke="#b4e4d9" stroke-width="7"/>'+cell(12,true)+cell(132,!draft.flipped):cell(73,true);
    for(const b of parts.querySelectorAll('[data-material]'))b.setAttribute('aria-pressed',String(b.dataset.material===(step?.material||draft.material)));
    if(step&&m.kind==='cells'&&trial.at===1){const before=trial.steps[0].result.brightness[0],after=step.result.brightness[0];dialog.querySelector('#work-observe-result').textContent=after>before+.001?'같은 전구가 전지 한 개일 때보다 밝아졌어요.':after<before-.001?'전지를 늘렸는데 어두워졌어요. 만나는 극을 다시 살펴봐요.':'밝기가 같아요. 전지 수와 끊긴 곳을 살펴봐요.';}
    dialog.querySelector('#work-undo').disabled=!!trial||!history.length;
    for(const id of ['work-erase','work-reset'])dialog.querySelector('#'+id).disabled=!!trial;
    for(const el of parts.querySelectorAll('[data-lamp]')){
      const id=String.fromCharCode(97+Number(el.dataset.lamp)),value=preview.brightness[+el.dataset.lamp]||0;
      el.style.setProperty('--lamp-light',value?Math.min(1,.18+Math.sqrt(value)*.82):0);el.classList.toggle('lit',value>.001);el.classList.toggle('bulb-removed',removed.includes(id));
      const isRemoved=removed.includes(id)||trial?.steps[trial.at].removed?.includes(id);
      el.classList.toggle('bulb-removed',!!isRemoved);
      const status=isRemoved?'빼 놓음':value>.001?'켜짐':'꺼짐';
      el.setAttribute('aria-label',el.querySelector('h3').textContent+' '+status);
      let meter=el.querySelector('.lamp-status');if(!meter){meter=document.createElement('div');meter.className='lamp-status';el.querySelector('.work-bulb').after(meter);}
      meter.textContent=status;if(trial?.steps[trial.at].removed?.length&&!isRemoved&&value>.001){const original=result.result.brightness[+el.dataset.lamp];meter.textContent=Math.abs(value-original)<.001?'밝기 그대로':value>original?'더 밝아짐':'더 어두워짐';}meter.style.setProperty('--brightness',Math.round(Math.sqrt(value)*100)+'%');
      const button=el.querySelector('[data-remove]');if(button)button.textContent=removed.includes(id)?'전구 '+id.toUpperCase()+' 다시 꽂기':'전구 '+id.toUpperCase()+' 빼 보기';
    }
  }
  function startTrial(){selected=null;wireFocus=null;erasing=false;removed=[];trial={steps:experiments(index,m,draft),at:0,key:signature()};updateView();dialog.querySelector('#work-observation').scrollIntoView({block:'nearest'});}
  primary.onclick=()=>{if(!dialog.open)return;if(result?.passed){if(needsProof()){startTrial();return;}const answer=copy(draft);dialog.close();onComplete(index,answer);return;}selected=null;wireFocus=null;erasing=false;inspected=true;dialog.querySelector('#work-checks').open=true;updateView();drawWires();message.scrollIntoView({block:'nearest'});};
  dialog.querySelector('#work-probe').onclick=startTrial;
  dialog.querySelector('#work-observe-next').onclick=()=>{if(!trial)return;if(trial.at<trial.steps.length-1){trial.at++;updateView();return;}if(result.passed)proof=trial.key;trial=null;inspected=true;updateView();};
  dialog.querySelector('#work-observe-close').onclick=()=>{trial=null;updateView();};
  dialog.querySelector('#work-undo').onclick=()=>{if(!history.length)return;draft=history.pop();selected=null;wireFocus=null;removed=[];trial=null;inspected=false;result=null;onChange(index,copy(draft));renderParts();};
  dialog.querySelector('#work-reset').onclick=()=>edit(()=>{draft=freshDraft(m);});
  dialog.querySelector('#work-erase').onclick=()=>{selected=null;wireFocus=null;erasing=!erasing;updateView();if(erasing)dialog.querySelector('#work-wire-list').scrollIntoView({block:'nearest'});};
  dialog.querySelector('#work-clear-selection').onclick=()=>{selected=null;wireFocus=null;updateView();drawWires();};
  dialog.querySelector('#work-hint').onclick=()=>{const hint=nextHint(index,hintLevel);hintLevel++;updateView(false);drawWires();message.textContent='힌트 '+Math.min(hintLevel,3)+' / 3 · '+hint;message.scrollIntoView({block:'nearest'});};
  dialog.querySelector('#work-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{sessions.set(index,{key:signature(),history,proof});drag=null;selected=null;wireFocus=null;trial=null;onClose();});
  dialog.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){e.preventDefault();if(!trial)dialog.querySelector('#work-undo').click();}if(e.key==='Escape'&&(selected||wireFocus!==null||trial)){e.preventDefault();selected=null;wireFocus=null;trial=null;updateView();drawWires();}});
  dialog.addEventListener('cancel',e=>{if(selected||wireFocus!==null||trial){e.preventDefault();selected=null;wireFocus=null;trial=null;updateView();drawWires();primary.focus({preventScroll:true});}});
  parts.addEventListener('click',e=>{if(e.target.closest('button')||trial)return;const part=e.target.closest('.work-part');if(!part)return;message.textContent=part.classList.contains('switch-part')?'스위치의 막대 그림을 누르면 켜고 끌 수 있어요.':'그림 아래 큰 원 두 개가 연결점이에요. 한 점을 누르고 다른 부품의 점을 누르세요.';part.querySelector('[data-port]')?.focus({preventScroll:true});});
  const demo=dialog.querySelector('#work-demo-box');dialog.querySelector('#work-demo').onclick=()=>{demo.hidden=!demo.hidden;};dialog.querySelector('#work-demo-close').onclick=()=>demo.hidden=true;
  const movieDialog=document.querySelector('#movie-dialog'),movie=document.querySelector('#restoration-movie');
  dialog.querySelector('#work-movie').onclick=()=>{movie.src='assets/carousel-restoration.mp4';document.querySelector('#movie-error').hidden=true;movieDialog.showModal();movie.play().catch(()=>{});};
  document.querySelector('#movie-close').onclick=document.querySelector('#movie-back').onclick=()=>movieDialog.close();
  movieDialog.addEventListener('close',()=>{movie.pause();movie.removeAttribute('src');movie.load();dialog.querySelector('#work-movie').focus({preventScroll:true});});
  movie.addEventListener('error',()=>{if(movie.hasAttribute('src'))document.querySelector('#movie-error').hidden=false;});

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
  return {open(i,saved){index=i;m=MISSIONS[i];draft=copy(saved);const session=sessions.get(i);history=session?.key===signature()?session.history:[];proof=session?.key===signature()?session.proof:'';hintLevel=0;trial=null;demo.hidden=true;result=null;selected=null;wireFocus=null;erasing=false;removed=[];inspected=false;dialog.querySelector('#work-checks').open=false;dialog.querySelector('#work-targets').innerHTML=OBJECTIVES[i].targets.map(t=>'<span>'+t+'</span>').join('');dialog.querySelector('#work-situation').textContent=BRIEFS[i].situation;dialog.querySelector('#work-movie').hidden=i!==9;dialog.querySelector('#work-step').textContent=`${i+1} / 10 · ${OBJECTIVES[i].stage}`;dialog.querySelector('#work-title').textContent=m.title;dialog.querySelector('#work-goal').textContent=BRIEFS[i].goal;dialog.querySelector('#work-how').textContent=i===1?'스위치를 누르면 켜기 ↔ 끄기가 바뀌어요.':'연결: 큰 원 → 다른 큰 원 · 잘못 연결: 되돌리기';dialog.querySelector('#work-note').textContent=m.bulbs>1?'같은 전구를 사용해요. 전선은 연결점에서만 서로 이어져요.':'같은 3.0 V 전구 · 전지는 각각 1.5 V';dialog.showModal();renderParts();dialog.scrollTop=0;},get isOpen(){return dialog.open;}};
}
