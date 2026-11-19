import {CHOICE_TYPES,CIRCUIT_DESCRIPTIONS,circuitWires,circuitPicture,sameWires} from './circuit-choices.js?v=trial-20261120-3';
import {studioBulb,diagramBulb,diagramSwitch,diagramMaterial} from './diagram-art.js?v=trial-20261120-3';
import {createLearningPanel} from './learning-panel.js?v=trial-20261120-3';
import {hasEvidence} from './inquiry-model.js?v=trial-20261120-3';
import {MISSIONS,freshDraft,checkMission,simulate,shortWireIndices} from './mission-model.js?v=trial-20261120-3';
import {bulbArt,compactCell,compactSwitch} from './circuit-art.js?v=trial-20261120-3';
import {BRIEFS,nextHint,diagnosis,testObservation,experiments,observationText,OBJECTIVES,SIMPLE_GOALS} from './mission-guide.js?v=trial-20261120-3';

const copy=d=>JSON.parse(JSON.stringify(d));
export function createMissionPanel({onChange,onComplete,onClose,onWrong}){
  const dialog=document.querySelector('#work-dialog'),parts=dialog.querySelector('#work-parts'),board=dialog.querySelector('#work-board'),wires=dialog.querySelector('#work-wires');
  const message=dialog.querySelector('#work-message'),feedback=dialog.querySelector('#work-feedback'),primary=dialog.querySelector('#work-test');
  let index=0,m=MISSIONS[0],draft=freshDraft(m),selected=null,wireFocus=null,erasing=false,result=null,history=[],drag=null,suppressClick=0,removed=[],inspected=false;
  const learning=createLearningPanel({onChange,onComplete,onClose,onWrong});
  const sessions=new Map();let hintLevel=0,proof='',trial=null,wireRoutes=[];
  const options=dialog.querySelector('#work-options'),choices=dialog.querySelector('#work-circuit-choices');
  function renderChoices(){
    const focused=choices.querySelector(':focus')?.dataset.circuit;
    const types=CHOICE_TYPES[index]||[];dialog.dataset.hasChoices=!!types.length;choices.hidden=!types.length;
    const repairNames={gap:'끊긴 길',shunt:'재료를 건너뛴 길',series:'재료를 지나는 길'};
    choices.innerHTML=types.length?'<legend>'+(index===4?'① 전선 모양 고르기':'회로 그림을 골라요')+'</legend>'+types.map((type,j)=>'<button type="button" data-circuit="'+type+'" aria-label="회로 '+(j+1)+' 선택 · '+CIRCUIT_DESCRIPTIONS[type]+'" aria-pressed="'+sameWires(draft.wires,circuitWires(type,m))+'">'+circuitPicture(type,m,draft,index===4?'material-focus':null)+'<span>'+(index===4?repairNames[type]:'회로 '+(j+1))+(sameWires(draft.wires,circuitWires(type,m))?' · 선택':'')+'</span></button>').join(''):'';
    for(const b of choices.querySelectorAll('button'))b.onclick=()=>{const next=circuitWires(b.dataset.circuit,m);if(!sameWires(draft.wires,next))edit(()=>{draft.wires=next;});};
    if(focused)choices.querySelector('[data-circuit="'+focused+'"]')?.focus({preventScroll:true});
  }
  function setOptions(open){options.hidden=!open;dialog.querySelector('#work-more').setAttribute('aria-expanded',String(open));if(!open)dialog.querySelector('#work-wire-options').open=false;}
  dialog.querySelector('#work-more').onclick=()=>{const wasWire=wireFocus!==null;wireFocus=null;setOptions(options.hidden);updateView(wasWire);drawWires();};
  function closeOptions(){const wasWire=wireFocus!==null;wireFocus=null;setOptions(false);updateView(wasWire);drawWires();dialog.querySelector('#work-more').focus({preventScroll:true});}
  dialog.querySelector('#work-options-close').onclick=closeOptions;
  const signature=()=>JSON.stringify(draft),needsProof=()=>index>=2&&!hasEvidence(index,draft);
  const revealFault=()=>index<4||inspected||hintLevel>=(index<6?1:3);
  const rememberSession=()=>sessions.set(index,{key:signature(),history,proof,hintLevel});
  const close=()=>{rememberSession();dialog.close();};
  const port=(id,label,side)=>`<button class="connect-point ${id==='p'||id==='n'&&draft.cells===2&&draft.flipped?'positive':id==='n'?'negative':''}" data-port="${id}" data-side="${side}" aria-label="${label}에 전선 연결"><span>${id==='p'?('+'):id==='n'?(draft.cells===2&&draft.flipped?'+':'−'):(m.bulbs>1&&/^[abc]/.test(id)?id.toUpperCase():m.switches===2&&/^[st]/.test(id)?(id[0]==='s'?'A':'B')+id[1]:side==='left'?'왼쪽':'오른쪽')}</span><small class="port-action">전선 연결</small><b class="coach-number" aria-hidden="true"></b></button>`;
  const ends=(a,b,label)=>`<div class="connection-ends">${port(a,label+' 왼쪽 연결점','left')}${port(b,label+' 오른쪽 연결점','right')}</div>`;
  function cell(x,flipped=false){return compactCell('work-cell-'+index+'-'+x,x,15,94,52,flipped);}
  function renderParts(){
    const focused=parts.querySelector(':focus');const focusKey=focused?.dataset.material?'[data-material="'+focused.dataset.material+'"]':focused?.dataset.switch!==undefined?'[data-switch="'+focused.dataset.switch+'"]':focused?.dataset.port?'[data-port="'+focused.dataset.port+'"]':focused?.id?'#'+focused.id:null;
    const lamps=Array.from({length:m.bulbs},(_,i)=>{const id=String.fromCharCode(97+i),name=m.bulbs===1?'전구':'전구 '+id.toUpperCase();return `<section class="work-part lamp-part lamp-${i}" data-lamp="${i}"><h3>${name}</h3><svg class="work-bulb" viewBox="0 0 260 220" aria-hidden="true">${m.challenge?diagramBulb():studioBulb('ten-'+index+'-'+id)}</svg>${ends(id+'1',id+'2',name)}${m.bulbs>1?'<button class="remove-bulb" data-remove="'+id+'">전구 '+id.toUpperCase()+' 빼 보기</button>':''}</section>`;}).join('');
    const switches=Array.from({length:m.switches},(_,i)=>{const id=i?'t':'s',name=m.switches===1?'스위치':'스위치 '+(i?'B':'A');return `<section class="work-part switch-part switch-${i}"><h3>${name}</h3><button class="work-switch" data-switch="${i}" aria-label="${name} ${draft.switches[i]?'열기':'닫기'}" aria-pressed="${draft.switches[i]}"><svg viewBox="0 0 180 60" aria-hidden="true">${m.challenge?diagramSwitch(draft.switches[i]):compactSwitch('work-switch-'+index+'-'+i,draft.switches[i])}</svg><span>${draft.switches[i]?'닫힘 · 누르면 열려요':'열림 · 누르면 닫혀요'}</span></button>${ends(id+'1',id+'2',name)}</section>`;}).join('');
    const battery=`<section class="work-part power-part"><h3>전지 ${draft.cells===2?'두 개 · 직렬':'한 개'}</h3><svg class="work-cells" viewBox="${draft.cells===2?'0 0 240 82':'60 0 120 82'}" aria-hidden="true">${draft.cells===2?'<path d="M106 41H132" stroke="#b4e4d9" stroke-width="7"/>'+cell(12,true)+cell(132,!draft.flipped):cell(73,true)}</svg>${ends('p','n','전지')}<p class="cell-junction"></p><div class="cell-actions">${m.cellChoice?`<button id="cell-count">${draft.cells===1?'전지 하나 더 놓기':'전지 한 개로 비교'}</button>`:''}${draft.cells===2?'<button id="cell-flip" aria-label="두 번째 전지 뒤집기">'+(m.bulbs>1?'↻ 뒤집기':'두 번째 전지 뒤집기')+'</button>':''}</div></section>`;
    const material=m.material?`<section class="work-part material-part"><h3>${index===4?'② 재료 고르기':'연결할 재료'}</h3><div class="material-options">${[['copper','구리'],['plastic','플라스틱'],['rubber','고무']].map(([id,label])=>`<button data-material="${id}" aria-pressed="${draft.material===id}"><i class="material-sample sample-${id}" aria-hidden="true"></i>${label}</button>`).join('')}</div>${`<svg class="diagram-material" viewBox="0 0 180 36" aria-hidden="true">${diagramMaterial(draft.material)}</svg>`}${ends('m1','m2','재료')}</section>`:'';
    dialog.dataset.mission=index;dialog.dataset.challenge=!!m.challenge;board.dataset.challenge=!!m.challenge;board.dataset.mission=index;board.dataset.bulbs=m.bulbs;board.dataset.switches=m.switches;board.dataset.material=!!m.material;
    parts.innerHTML=lamps+switches+battery+material;
    for(const b of parts.querySelectorAll('[data-port]')){
      b.onclick=e=>{if(e.isTrusted&&performance.now()<suppressClick)return;choose(b.dataset.port);};
      b.onpointerdown=e=>{if(e.button!==0)return;drag={id:b.dataset.port,x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);};
      b.onpointerup=e=>{if(!drag)return;const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-port]');if(end&&end.dataset.port!==drag.id&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){const start=drag.id,finish=end.dataset.port;suppressClick=performance.now()+350;requestAnimationFrame(()=>{if(!dialog.open)return;selected=start;choose(finish);});}drag=null;};
      b.onpointercancel=()=>drag=null;
    }
    for(const b of parts.querySelectorAll('[data-remove]'))b.onclick=()=>{removed=removed.includes(b.dataset.remove)?[]:[b.dataset.remove];updateView();};
    for(const b of parts.querySelectorAll('[data-switch]'))b.onclick=()=>edit(()=>{draft.switches[+b.dataset.switch]=!draft.switches[+b.dataset.switch];});
    for(const b of parts.querySelectorAll('[data-material]'))b.onclick=()=>{if(draft.material!==b.dataset.material)edit(()=>{draft.material=b.dataset.material;});};
    parts.querySelector('#cell-count')?.addEventListener('click',()=>edit(()=>{draft.cells=draft.cells===1?2:1;}));
    parts.querySelector('#cell-flip')?.addEventListener('click',()=>edit(()=>{draft.flipped=!draft.flipped;}));
    renderChoices();updateView();if(focusKey)parts.querySelector(focusKey)?.focus({preventScroll:true});requestAnimationFrame(drawWires);
  }
  function edit(change,rebuild=true){const fromTools=options.contains(document.activeElement);setOptions(false);history.push(copy(draft));delete draft.evidence;if(history.length>40)history.shift();change();if(!draft.wires.length||checkMission(m,draft).passed)erasing=false;selected=null;wireFocus=null;removed=[];trial=null;inspected=false;result=null;onChange(index,copy(draft));if(rebuild)renderParts();else{updateView();drawWires();}if(fromTools)requestAnimationFrame(()=>{if(dialog.open)dialog.querySelector('#work-undo').focus({preventScroll:true});});}
  function choose(id){
    if(index!==0||result.passed)return;
    setOptions(false);
    wireFocus=null;
    if(erasing){message.textContent='지울 전선을 누르세요.';return;}
    if(selected===id){selected=null;updateView();drawWires();return;}
    if(!selected){if(index===0&&!result.passed&&[['p','a1'],['n','a2']].some(pair=>pair.includes(id)&&draft.wires.some(w=>w.includes(pair[0])&&w.includes(pair[1])))){updateView();message.textContent='여기는 이미 이어져 있어요. ①과 ②가 붙은 연결 버튼을 찾아요.';return;}selected=id;updateView();drawWires();return;}
    const a=selected;
    if(index===0&&![['p','a1'],['n','a2']].some(pair=>pair.includes(a)&&pair.includes(id))){selected=null;updateView();drawWires();message.textContent='①과 ②를 이어 보세요.';return;}
    if(draft.wires.some(w=>w.includes(a)&&w.includes(id))){selected=null;message.textContent='이미 이어진 두 점이에요.';updateView(false);drawWires();return;}
    if(draft.wires.length>=16){selected=null;message.textContent='쓰지 않는 전선을 지우고 다시 연결해요.';updateView(false);drawWires();return;}
    edit(()=>draft.wires.push([a,id]),false);
  }
  function drawWires(){
    if(!dialog.open)return;if(CHOICE_TYPES[index]){wires.innerHTML='';return;}const rect=board.getBoundingClientRect();wires.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    const previewCells=trial?.steps[trial.at]?.cells??draft.cells;
    const partRects=[...parts.querySelectorAll('.work-part')].map(el=>{const r=el.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top};});
    const point=id=>{const el=parts.querySelector(`[data-port="${id}"]`),r=el.getBoundingClientRect();return {x:r.x+r.width/2-rect.x,y:r.y+r.height/2-rect.y,top:el.closest('.work-part').getBoundingClientRect().top-rect.top,bottom:el.closest('.work-part').getBoundingClientRect().bottom-rect.top,side:el.dataset.side==='left'?-1:1};};
    const leads=[...parts.querySelectorAll('.work-part')].map(part=>{
      const svg=part.querySelector('svg');if(!svg)return '';
      const pins=part.classList.contains('lamp-part')?(m.challenge?[[32,100],[228,100]]:[[72,151],[183,151]]):part.classList.contains('switch-part')?(m.challenge?[[10,42],[170,42]]:[[30,42],[150,42]]):part.classList.contains('material-part')?[[10,18],[170,18]]:previewCells===2?[[7,41],[draft.flipped?231:226,41]]:[[68,41],[167,41]];
      return [...part.querySelectorAll('[data-port]')].map((port,j)=>{const p=point(port.dataset.port),v=svg.createSVGPoint();[v.x,v.y]=pins[j];const q=v.matrixTransform(svg.getScreenCTM());return `<path class="component-lead" d="M${p.x} ${p.y}V${q.y-rect.y}H${q.x-rect.x}"/>`;}).join('');
    }).join('');
    wires.classList.toggle('has-selection',!!selected||wireFocus!==null);
    const laneStep=Math.min(9,60/Math.max(1,draft.wires.length-1)),edgeStep=Math.min(4,16/Math.max(1,draft.wires.length-1));
    wireRoutes=[];
    wires.innerHTML=leads+draft.wires.map(([a,b],i)=>{const p=point(a),q=point(b),px=p.x+p.side*34,qx=q.x+q.side*34,same=Math.max(p.top,q.top)<Math.min(p.bottom,q.bottom),mid=same?Math.max(p.bottom,q.bottom)+12+i*laneStep:((p.top<q.top?p.bottom:q.bottom)+(p.top<q.top?q.top:p.top))/2+(i-(draft.wires.length-1)/2)*laneStep;const intermediate=!same&&partRects.some(r=>r.top>Math.min(p.bottom,q.bottom)+15&&r.bottom<Math.max(p.bottom,q.bottom)-15);const lane=p.side<0?8+i*edgeStep:rect.width-8-i*edgeStep,down=p.top<q.top,py=down?p.bottom+20:p.top-20,qy=down?q.top-20:q.bottom+20;const points=intermediate?[[p.x,p.y],[px,p.y],[px,py],[lane,py],[lane,qy],[qx,qy],[qx,q.y],[q.x,q.y]]:[[p.x,p.y],[px,p.y],[px,mid],[qx,mid],[qx,q.y],[q.x,q.y]];wireRoutes[i]=points;const path=points.map(([x,y],j)=>(j?'L':'M')+x+' '+y).join('');return `<g data-wire="${i}" class="${(wireFocus===i||selected&&(a===selected||b===selected))?'wire-selected':''}"><path class="wire-bed" d="${path}"/><path class="wire-thread" style="--wire-color:${revealFault()&&shortWireIndices(m,draft).includes(i)?'#f39786':a==='p'||b==='p'?'#b86c52':a==='n'||b==='n'?'#427eaa':'#408c83'}" d="${path}"/><path class="wire-hit" d="${path}"/></g>`;}).join('');
  }

  // Wide touch targets may overlap: choose the nearest visible segment, not SVG paint order.
  function wireAt(e,fallback){
    const at=wires.createSVGPoint();at.x=e.clientX;at.y=e.clientY;
    const p=at.matrixTransform(wires.getScreenCTM().inverse());
    const distances=wireRoutes.map(route=>Math.min(...route.slice(1).map((b,j)=>{
      const a=route[j],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
      const t=length?Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/length)):0;
      return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);
    })));
    const nearest=Math.min(...distances);
    return distances[fallback]<=nearest+.5?fallback:distances.indexOf(nearest);
  }

  const portName=(id,cells=draft.cells)=>id==='p'?'전지 ＋':id==='n'?'전지 '+(cells===2&&draft.flipped?'＋ (오른쪽)':'－'):id[0]==='s'||id[0]==='t'?'스위치 '+(m.switches===2?(id[0]==='s'?'A ':'B ')+id[1]:(id[1]==='1'?'왼쪽':'오른쪽')):id[0]==='m'?'재료 '+(id[1]==='1'?'왼쪽':'오른쪽'):'전구 '+(m.bulbs>1?id[0].toUpperCase()+' '+id[1]:(id[1]==='1'?'왼쪽':'오른쪽'));
  function updateView(updateMessage=true){
    result=checkMission(m,draft);
    const preview=trial?trial.steps[trial.at].result:removed.length?simulate(m,draft,{removed}):result.result,bad=shortWireIndices(m,draft);
    const brief=BRIEFS[index];
    for(const part of parts.querySelectorAll('.show-ports,.show-switch,.show-material'))part.classList.remove('show-ports','show-switch','show-material');
    board.classList.toggle('erase-mode',erasing);board.classList.toggle('tested',inspected);board.dataset.preview=!!trial;
    dialog.querySelector('#work-erase').setAttribute('aria-pressed',String(erasing));
    dialog.querySelector('#work-erase').textContent=erasing?'지우기 끝':'지우기';dialog.querySelector('#work-undo').disabled=!history.length;
    const coaching=index===0&&!result.passed&&!bad.length&&!erasing,coachPair=[['p','a1'],['n','a2']].find(pair=>!draft.wires.some(w=>w.includes(pair[0])&&w.includes(pair[1])))||['p','a1'];
    for(const b of parts.querySelectorAll('[data-port]')){
      b.classList.toggle('loose-port',index>=2&&index<6&&inspected&&!trial&&!result.passed&&!draft.wires.some(w=>w.includes(b.dataset.port)));b.classList.toggle('wire-end',wireFocus!==null&&!!draft.wires[wireFocus]?.includes(b.dataset.port));b.classList.toggle('selected',selected===b.dataset.port);b.classList.toggle('wired',draft.wires.some(w=>w.includes(b.dataset.port)));b.setAttribute('aria-pressed',String(selected===b.dataset.port));
      b.querySelector('.port-action').textContent=trial?'연결점':selected===b.dataset.port?'선택됨':selected&&(index!==0||coachPair.includes(b.dataset.port))?'이을 곳':'전선 연결';
      const step=coaching?(b.dataset.port===coachPair[0]?1:b.dataset.port===coachPair[1]?2:0):0;
      b.classList.toggle('coach-port',!!step);b.classList.toggle('coach-start',step===1&&!selected);b.classList.toggle('coach-next',!!step&&!!selected&&selected!==b.dataset.port);b.querySelector('.coach-number').textContent=step||'';
      b.setAttribute('aria-label',portName(b.dataset.port,trial?.steps[trial.at]?.cells??draft.cells)+(step?' · '+step+'번':'')+(trial?' 연결점':'에 전선 연결'));
    }
    let text=result.passed?(needsProof()?'연결됐어요. 이제 실험해요.':'성공! 빛을 보내요.'):index===0?'①을 누르고 ②를 눌러요.':index===1?'스위치 그림을 눌러요.':'';
    if(index>=2&&!result.passed)text=CHOICE_TYPES[index]?'회로를 고르고 시험해요.':index===3?'재료를 골라요.':'전지 수와 방향을 바꿔요.';
    if(!result.passed&&(inspected||index<6&&result.result.voltage===0&&!result.result.short||index<4&&result.result.short))text=diagnosis(index,m,draft);
    if(wireFocus!==null)text='선택한 전선을 지울 수 있어요.';
    if(erasing)text='지울 전선을 누르세요.';
    if(selected)text=index===0?(selected===coachPair[0]?'②':'①')+'를 누르면 이어져요.':portName(selected)+' → 이을 곳을 누르세요.';
    if(removed.length)text='전구 '+removed[0].toUpperCase()+'를 뺐어요. 다른 전구를 관찰한 뒤 다시 꽂아 주세요.';
    if(trial)text='';
    if(index>=6&&needsProof()&&!inspected)text='회로와 부품을 바꾸고 시험해요.';
    if(index>=2&&inspected&&!result.passed)text=result.result.short?'전구를 건너뛴 길이 있어요. 다른 회로를 골라요.':result.result.voltage===0?'전지 방향을 바꿔 시험해요.':m.material&&draft.material!=='copper'?'재료를 바꿔 시험해요.':draft.switches.some(v=>!v)?'스위치를 닫고 다시 시험해요.':index===5&&draft.cells===1?'전지를 하나 더 놓고 비교해요.':'다른 회로와 비교해요. 스위치로 꺼지나요?';
    if(index>=2&&inspected&&!result.passed){const observed=testObservation(m,draft);if(observed)text='시험 결과 · '+observed;}
    if(index===4&&!result.passed&&!trial){
      text=inspected?(draft.material!=='copper'?'② 재료를 바꿔 불빛을 비교해요.':result.result.brightness[0]>.01?'불은 켜졌지만 재료를 건너뛰어요.':'① 끊긴 곳이 없는 전선을 골라요.'):'전선과 재료를 고른 뒤 시험해요.';
    }
    if(updateMessage)message.textContent=text;message.parentElement.hidden=!message.textContent&&!selected&&wireFocus===null;
    dialog.querySelector('#work-clear-selection').hidden=!selected&&wireFocus===null;
    options.dataset.wireOnly=String(wireFocus!==null);dialog.querySelector('#work-wire-options summary').textContent=wireFocus!==null?'선택한 전선':'전선 목록';
    const showFault=revealFault();
    const list=dialog.querySelector('#work-wire-list'),show=!options.hidden||erasing||wireFocus!==null||showFault&&bad.length>0;
    list.hidden=!show;list.innerHTML=show?draft.wires.map(([a,b],i)=>(wireFocus!==null?wireFocus===i:!options.hidden||erasing||showFault&&bad.includes(i))?'<button '+(trial?'disabled ':'')+'data-delete-wire="'+i+'" aria-current="'+(wireFocus===i)+'" class="'+(showFault&&bad.includes(i)?'fault-wire':'')+'">'+(showFault&&bad.includes(i)?'지름길 · ':'')+portName(a)+' ↔ '+portName(b)+' · 지우기</button>':'').join(''):'';
    list.querySelectorAll('[data-delete-wire]').forEach(b=>b.onclick=()=>{edit(()=>draft.wires.splice(+b.dataset.deleteWire,1),false);setOptions(false);});
    const checks=index===9?[{label:'① 지름길 없음',ok:!result.result.short},{label:'② 전지 방향 맞음',ok:!draft.flipped},...result.checks.filter(c=>c.label!=='전지 2개를 바른 방향으로')]:result.checks;
    feedback.innerHTML='<span class="conditions-title">'+(checks.some(c=>!c.ok)?'목표 확인':'회로 조건 완료')+'</span>'+checks.map(c=>'<span class="condition '+(c.ok?'passed':'pending')+'">'+(c.ok?'✓':'○')+' '+c.label+'</span>').join('');
    dialog.querySelector('#work-check-summary').textContent=result.passed?'✓ 회로 조건 완료 · 자세히':'세부 조건 보기 · '+checks.filter(c=>c.ok).length+' / '+checks.length;
    primary.textContent=trial?'시험 중이에요':removed.length?'전구를 다시 꽂아 주세요':result.passed?(needsProof()?'실험하기':'빛 보내기'):index<2?'빛 보내기':'시험하기';primary.disabled=!!removed.length||!!trial||index<2&&!result.passed;if(index>=6&&needsProof()&&!trial&&!removed.length)primary.textContent='시험하기';primary.classList.toggle('success',result.passed&&!removed.length&&!trial&&!needsProof());
    dialog.querySelector('#work-experiment').hidden=!trial;
    const probe=dialog.querySelector('#work-probe');probe.textContent=brief.probe||'';probe.hidden=!!trial||!brief.probe;probe.disabled=!!removed.length;
    dialog.querySelector('#work-proof').textContent=proof===signature()?'✓ 이 회로의 작동을 확인했어요':index===2?'목표: 스위치를 끄면 불도 꺼져요':index>=6?'목표의 모든 조건을 시험해요':index>=4?'고친 뒤 시험하면 빛을 보낼 수 있어요':'배선은 그대로 두고 재료만 비교해요';
    const observation=dialog.querySelector('#work-observation');observation.hidden=!trial;
    if(trial){const step=trial.steps[trial.at];dialog.querySelector('#work-observe-title').textContent=(trial.at+1)+' / '+trial.steps.length+' · '+step.label;dialog.querySelector('#work-observe-result').textContent=observationText(m,draft,step);dialog.querySelector('#work-observe-next').textContent=trial.at<trial.steps.length-1?'다음':'마침';}
    for(const b of parts.querySelectorAll('button'))b.disabled=!!trial||b.hasAttribute('data-port')&&(index!==0||result.passed||draft.wires.some(w=>w.includes(b.dataset.port)));
    for(const b of choices.querySelectorAll('button'))b.disabled=!!trial;
    const step=trial?.steps[trial.at],previewSwitches=step?.switches||draft.switches,previewCells=step?.cells||draft.cells;
    for(const b of parts.querySelectorAll('[data-switch]')){
      const on=previewSwitches[+b.dataset.switch],name=m.switches===1?'스위치':'스위치 '+(+b.dataset.switch?'B':'A');
      b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',name+(trial?(on?' 닫힘':' 열림'):(on?' 열기':' 닫기')));
      b.querySelector('span').textContent=trial?(on?'닫힘':'열림'):index===1?(on?'불 끄기':'불 켜기'):(on?'닫힘 · 눌러 열기':'열림 · 눌러 닫기');b.classList.toggle('switch-callout',index===1&&!on&&!trial);
      b.querySelector('svg').innerHTML=m.challenge?diagramSwitch(on):compactSwitch('work-switch-'+index+'-'+b.dataset.switch,on);
    }
    parts.querySelector('.power-part h3').textContent='전지 '+(previewCells===2?'두 개':'한 개');
    const junction=parts.querySelector('.cell-junction');junction.hidden=previewCells!==2;junction.classList.toggle('opposed',draft.flipped);junction.textContent=draft.flipped?'가운데: − 와 − · 같은 극':'가운데: − 와 ＋ · 다른 극';
    const rightPort=parts.querySelector('[data-port="n"]'),rightPositive=previewCells===2&&draft.flipped;rightPort.querySelector('span').textContent=rightPositive?'＋':'−';rightPort.classList.toggle('positive',rightPositive);rightPort.classList.toggle('negative',!rightPositive);
    const batteryArt=parts.querySelector('.work-cells');batteryArt.setAttribute('viewBox',previewCells===2?'0 0 240 82':'60 0 120 82');batteryArt.innerHTML=previewCells===2?'<path d="M106 41H132" stroke="#b4e4d9" stroke-width="7"/>'+cell(12,true)+cell(132,!draft.flipped):cell(73,true);
    for(const b of parts.querySelectorAll('[data-material]'))b.setAttribute('aria-pressed',String(b.dataset.material===(step?.material||draft.material)));
    const materialArt=parts.querySelector('.diagram-material');if(materialArt)materialArt.innerHTML=diagramMaterial(step?.material||draft.material);
    if(step&&m.kind==='cells'&&trial.at===1){const before=trial.steps[0].result.brightness[0],after=step.result.brightness[0];dialog.querySelector('#work-observe-result').textContent=after>before+.001?'같은 전구가 전지 한 개일 때보다 밝아졌어요.':after<before-.001?'전지를 늘렸는데 어두워졌어요. 만나는 극을 다시 살펴봐요.':'밝기가 같아요. 전지 수와 끊긴 곳을 살펴봐요.';}
    dialog.querySelector('#work-undo').disabled=!!trial||!history.length;
    for(const id of ['work-erase','work-reset'])dialog.querySelector('#'+id).disabled=!!trial||id==='work-erase'&&!draft.wires.length;
    for(const el of parts.querySelectorAll('[data-lamp]')){
      const id=String.fromCharCode(97+Number(el.dataset.lamp)),value=preview.brightness[+el.dataset.lamp]||0;
      el.style.setProperty('--lamp-light',value?Math.min(1,.18+Math.sqrt(value)*.82):0);el.classList.toggle('lit',value>.001);el.classList.toggle('bulb-removed',removed.includes(id));
      const isRemoved=removed.includes(id)||trial?.steps[trial.at].removed?.includes(id);
      el.classList.toggle('bulb-removed',!!isRemoved);
      const status=isRemoved?'빼 놓음':value>.75?'밝게 켜짐':value>.001?'켜짐':'꺼짐';
      el.setAttribute('aria-label',el.querySelector('h3').textContent+' '+status);
      let meter=el.querySelector('.lamp-status');if(!meter){meter=document.createElement('div');meter.className='lamp-status';el.querySelector('.work-bulb').after(meter);}
      meter.textContent=status;if(trial?.steps[trial.at].removed?.length&&!isRemoved&&value>.001){const original=result.result.brightness[+el.dataset.lamp];meter.textContent=Math.abs(value-original)<.001?'밝기 그대로':value>original?'더 밝아짐':'더 어두워짐';}meter.style.setProperty('--brightness',Math.round(Math.sqrt(value)*100)+'%');
      const button=el.querySelector('[data-remove]');if(button)button.textContent=removed.includes(id)?'전구 '+id.toUpperCase()+' 다시 꽂기':'전구 '+id.toUpperCase()+' 빼 보기';
    }
  }
  function startTrial(){setOptions(false);selected=null;wireFocus=null;erasing=false;removed=[];trial={steps:experiments(index,m,draft),at:0,key:signature()};updateView();drawWires();dialog.querySelector('#work-observation').scrollIntoView({block:'nearest'});}
  primary.onclick=()=>{if(!dialog.open)return;setOptions(false);selected=null;wireFocus=null;erasing=false;updateView();drawWires();if(result?.passed){if(needsProof()){learning.openCircuit(index,draft,evidence=>{draft.evidence=evidence;proof=signature();onChange(index,copy(draft));updateView();primary.focus({preventScroll:true});});return;}const answer=copy(draft);close();onComplete(index,answer);return;}inspected=true;updateView();drawWires();message.scrollIntoView({block:'nearest'});};
  function endTrial(){trial=null;updateView();drawWires();requestAnimationFrame(()=>{if(dialog.open&&!trial)primary.focus({preventScroll:true});});}
  dialog.querySelector('#work-probe').onclick=startTrial;
  dialog.querySelector('#work-observe-next').onclick=()=>{if(!trial)return;if(trial.at<trial.steps.length-1){trial.at++;updateView();drawWires();return;}inspected=true;endTrial();};
  dialog.querySelector('#work-observe-close').onclick=endTrial;
  dialog.querySelector('#work-undo').onclick=()=>{if(!history.length)return;setOptions(false);draft=history.pop();selected=null;wireFocus=null;erasing=false;removed=[];trial=null;inspected=false;result=null;onChange(index,copy(draft));renderParts();};
  dialog.querySelector('#work-reset').onclick=()=>{edit(()=>{draft=freshDraft(m);});setOptions(false);};
  dialog.querySelector('#work-erase').onclick=()=>{selected=null;wireFocus=null;erasing=!erasing;updateView();setOptions(false);drawWires();};
  dialog.querySelector('#work-clear-selection').onclick=()=>{const port=selected;selected=null;wireFocus=null;setOptions(false);updateView();drawWires();requestAnimationFrame(()=>{if(dialog.open)(port?parts.querySelector('[data-port="'+port+'"]'):dialog.querySelector('#work-more'))?.focus({preventScroll:true});});};
  dialog.querySelector('#work-hint').onclick=()=>{const hint=nextHint(index,hintLevel);hintLevel++;updateView(false);drawWires();message.textContent=hint;message.parentElement.hidden=false;message.scrollIntoView({block:'nearest'});};
  dialog.querySelector('#work-close').onclick=close;dialog.addEventListener('close',()=>{drag=null;selected=null;wireFocus=null;trial=null;onClose();});
  dialog.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){e.preventDefault();if(!trial)dialog.querySelector('#work-undo').click();}if(e.key==='Escape'&&!options.hidden){e.preventDefault();closeOptions();return;}if(e.key==='Escape'&&(selected||wireFocus!==null||trial||erasing)){e.preventDefault();selected=null;wireFocus=null;erasing=false;if(trial)endTrial();else{updateView();drawWires();}}});
  dialog.addEventListener('cancel',e=>{if(selected||wireFocus!==null||trial||erasing){e.preventDefault();selected=null;wireFocus=null;trial=null;erasing=false;updateView();drawWires();primary.focus({preventScroll:true});}else rememberSession();});
  parts.addEventListener('click',e=>{if(e.target.closest('button')||trial)return;const part=e.target.closest('.work-part');if(!part)return;const isSwitch=part.classList.contains('switch-part'),isMaterial=part.classList.contains('material-part');if(index!==0){if(isSwitch)part.querySelector('.work-switch').click();else if(isMaterial)part.querySelector('[data-material]')?.focus({preventScroll:true});else if(part.classList.contains('power-part'))part.querySelector('.cell-actions button')?.focus({preventScroll:true});return;}for(const p of parts.querySelectorAll('.show-ports,.show-switch,.show-material'))p.classList.remove('show-ports','show-switch','show-material');part.classList.add(isSwitch?'show-switch':isMaterial?'show-material':'show-ports');message.textContent=isSwitch?'스위치 그림을 눌러 여닫아요.':isMaterial?'재료 이름을 눌러 바꿔요.':'아래 ‘전선 연결’ 버튼을 눌러요.';message.parentElement.hidden=false;part.querySelector(isSwitch?'.work-switch':isMaterial?'[data-material][aria-pressed=true]':'[data-port]')?.focus({preventScroll:true});});
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
  return {resetSessions(){sessions.clear();learning.resetSessions();},open(i,saved){index=i;m=MISSIONS[i];draft=copy(saved);dialog.dataset.tutorial=i===0?'wire':i===1?'switch':'choices';if(i<2){const passed=checkMission(m,draft).passed;draft.wires=freshDraft(m).wires;if(i===0&&passed)draft.wires.push(['p','a1']);}if(i===3||i===5){const prepared=circuitWires('series',m);if(!checkMission(m,draft).passed&&!sameWires(draft.wires,prepared)){draft.wires=prepared;delete draft.evidence;}}const session=sessions.get(i);history=session?.key===signature()?session.history:[];proof=session?.key===signature()?session.proof:'';hintLevel=session?.hintLevel||0;setOptions(false);trial=null;demo.hidden=true;result=null;selected=null;wireFocus=null;erasing=false;removed=[];inspected=false;dialog.querySelector('#work-checks').open=false;dialog.querySelector('#work-targets').innerHTML=OBJECTIVES[i].targets.map(t=>'<span>'+t+'</span>').join('');dialog.querySelector('#work-situation').textContent=BRIEFS[i].situation;dialog.querySelector('#work-movie').hidden=i!==9;dialog.querySelector('#work-step').textContent=`${i+1} / 10`;dialog.querySelector('#work-title').textContent=m.title;dialog.querySelector('#work-goal').textContent=SIMPLE_GOALS[i];dialog.querySelector('#work-how').textContent=i===3?'재료를 눌러 불빛을 비교해요.':i===5?'전지 수와 방향을 바꿔 비교해요.':i>=2?'회로 그림을 고르고, 부품을 눌러 바꿔요.':i===1?'스위치를 누르면 켜기 ↔ 끄기가 바뀌어요.':'‘전선 연결’을 두 곳 누르면 전선이 이어져요. 잘못 이으면 되돌리기.';dialog.querySelector('#work-note').textContent=m.challenge?'배운 원리를 응용한 회로 도전 · 선이 겹쳐도 연결점에서만 이어져요.':m.bulbs>1?'같은 전구를 사용해요. 전선은 연결점에서만 서로 이어져요.':'같은 3.0 V 전구 · 전지는 각각 1.5 V';dialog.showModal();renderParts();(result.passed?primary:index===0?parts.querySelector('.coach-start'):index===1?parts.querySelector('.work-switch'):choices.querySelector('button')||parts.querySelector('[data-material],#cell-count'))?.focus({preventScroll:true});dialog.scrollTop=0;},get isOpen(){return dialog.open||learning.isOpen;}};
}
