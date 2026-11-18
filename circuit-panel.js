import {bulbArt,batteryArt,switchArt} from './circuit-art.js';
import './circuit.js';
import {evaluateFountain} from './fountain-lamp.js';
import {createProgressHelp} from './progress-help.js';
export function createCircuitPanel(onChange,onComplete,onFound=()=>{}){
  const C=window.ToyCircuit,dialog=document.querySelector('#circuit-dialog'),$=s=>dialog.querySelector(s),bench=$('#bench');
  $('.battery .part-art').innerHTML=batteryArt('bench-cell');
  $('.bulb .part-art').innerHTML=bulbArt('bench-bulb','bulb-insert');
  $('.switch .part-art').innerHTML=switchArt('bench-switch','switch-blade');
  const terminals=[...dialog.querySelectorAll('.terminal')],nodes=Object.fromEntries(terminals.map(b=>[b.dataset.node,b]));
  let state={wires:[],closed:false},selected=null,history=[],gesture=null,suppress=false,note='',hinted=[];
  const progressHelp=createProgressHelp();
  let practice=false,autoHelp=0,helpNote='',inspected=new Set();
  let first=false,bridge=false,fountain=false,found=false,cleared=false,seated=false,hintCount=0;
  const inspect=document.createElement('div');inspect.id='first-inspect';inspect.hidden=true;
  inspect.innerHTML='<button class="inspect-part" data-inspect="battery" aria-label="전지 살펴보기"></button><button class="inspect-part" data-inspect="bulb" aria-label="전구 살펴보기"></button><button class="inspect-part" data-inspect="switch" aria-label="스위치 살펴보기"></button><button id="wire-gap" aria-label="전선 사이 살펴보기"></button><button class="repair-end" data-repair="lb" aria-label="끊긴 전선의 왼쪽 끝"><span></span></button><button class="repair-end" data-repair="sa" aria-label="끊긴 전선의 오른쪽 끝"><span></span></button>';
  bench.append(inspect);
  const petal=document.createElement('button');petal.id='switch-petal';petal.hidden=true;petal.setAttribute('aria-label','끼인 꽃잎 치우기');petal.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 51C-2 24 25 2 55 8C61 35 45 60 12 51Z" fill="#dba1c7" stroke="#fff0dc" stroke-width="2"/><path d="M12 51Q31 25 51 13M24 36L21 22M33 27L47 30" fill="none" stroke="#a36d99" stroke-width="2"/></svg>';bench.querySelector('.switch').append(petal);
  const seat=document.createElement('button');seat.id='seat-bulb';seat.hidden=true;seat.setAttribute('aria-label','전구를 돌려 제대로 끼우기');seat.innerHTML='<span aria-hidden="true">↻</span>';bench.querySelector('.bulb').append(seat);
  const result=()=>evaluateFountain(state,fountain?{seated}:null,C);
  const repaired=()=>state.wires.some(w=>w.includes('lb')&&w.includes('sa'));
  const clone=s=>JSON.parse(JSON.stringify(s));
  const used=id=>state.wires.some(w=>w.includes(id));
  const canConnect=(a,b)=>a&&b&&a!==b&&!used(a)&&!used(b)&&!C.evaluate([...state.wires,[a,b]],state.closed).short;
  function commit(next){cancelGesture();history.push(clone(state));state=next;selected=null;note='';hinted=[];onChange(clone(state));render();}
  function connect(a,b){
    if(bridge||fountain)return;
    if(first&&(!found||![a,b].includes('lb')||![a,b].includes('sa')))return;
    if(a===b){selected=null;render();return;}
    if(used(a)||used(b)){note='연결한 점을 다시 누르면 전선이 빠져요.';selected=null;render();return;}
    const next=clone(state);next.wires.push([a,b]);
    if(C.evaluate(next.wires,next.closed).short){note='전지의 두 극을 바로 잇지 말고 전구를 거쳐요.';selected=null;render();return;}
    commit(next);
  }
  function activate(id){
    if(bridge||fountain)return;
    note='';hinted=[];
    if(selected===id){selected=null;render();return;}
    if(used(id)){const next=clone(state);next.wires=next.wires.filter(w=>!w.includes(id));commit(next);return;}
    if(!selected){selected=id;render();}else connect(selected,id);
  }
  function center(id){const b=nodes[id].getBoundingClientRect(),r=bench.getBoundingClientRect();return {x:b.x+b.width/2-r.x,y:b.y+b.height/2-r.y};}
  function clearDrop(){for(const target of dialog.querySelectorAll('.drop-ready'))target.classList.remove('drop-ready');}
  function cancelGesture(){if(gesture)suppress=true;gesture=null;selected=null;note='';$('#preview').setAttribute('d','');clearDrop();}
  function movePreview(button,e){
    if(gesture?.id!==e.pointerId)return;
    if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>10)gesture.moved=true;
    if(!gesture.moved)return;
    clearDrop();const end=document.elementFromPoint(e.clientX,e.clientY)?.closest(first?'[data-repair]':'.terminal'),id=end?.dataset.repair||end?.dataset.node;
    if(end&&canConnect(gesture.node,id))end.classList.add('drop-ready');
    const r=bench.getBoundingClientRect(),a=button.getBoundingClientRect(),x=a.x+a.width/2-r.x,y=a.y+a.height/2-r.y;
    $('#preview').setAttribute('d',`M${x},${y} Q${x},${e.clientY-r.y} ${e.clientX-r.x},${e.clientY-r.y}`);
  }
  function draw(){
    if(!dialog.open)return;
    const group=$('#wire-paths');group.replaceChildren();
    for(const [a,b]of state.wires){const p=center(a),q=center(b),depth=Math.min(bench.clientHeight-15,Math.max(p.y,q.y)+65);const d=`M${p.x},${p.y} C${p.x},${depth} ${q.x},${depth} ${q.x},${q.y}`;
      if(first&&[a,b].includes('lb')&&[a,b].includes('sa'))continue;
      for(const [cls,color]of [['wire-shadow','#050a18'],['wire-main',[a,b].includes('bp')?'#ed8469':[a,b].includes('bn')?'#62c8bc':'#e6ca83'],['wire-sheen','#fff4c555']]){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);path.setAttribute('class',cls);path.setAttribute('stroke',color);group.append(path);}
    }
    if(first){
      const p=center('lb'),q=center('sa'),x=(p.x+q.x)/2,y=bench.clientHeight-34;
      const left=`M${p.x},${p.y} C${p.x},${y-25} ${x-65},${y} ${x-40},${y}`,right=`M${x+40},${y} C${x+65},${y} ${q.x},${y-25} ${q.x},${q.y}`;
      const d=left+(repaired()?` L${x+40},${y}`:'')+' '+right;
      for(const cls of ['fault-shadow','fault-cord','fault-sheen']){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);path.setAttribute('class',cls);group.append(path);}
      if(!repaired()){const ends=document.createElementNS('http://www.w3.org/2000/svg','path');ends.setAttribute('d',[-2,0,2].map(dy=>`M${x-40},${y+dy}l8,${dy*.3}M${x+40},${y+dy}l-8,${dy*.3}`).join(' '));ends.setAttribute('class','copper-ends');group.append(ends);}
      for(const [selector,px]of [['#wire-gap',x],['[data-repair="lb"]',x-40],['[data-repair="sa"]',x+40]])Object.assign($(selector).style,{left:px+'px',top:y+'px'});
    }
    if(first||bridge||fountain)for(const b of inspect.querySelectorAll('[data-inspect]')){const c=bench.querySelector('[data-component="'+b.dataset.inspect+'"]'),r=c.getBoundingClientRect(),base=bench.getBoundingClientRect();Object.assign(b.style,{left:r.x-base.x+r.width/2+'px',top:r.y-base.y+r.height*.45+'px',width:Math.max(48,Math.min(120,r.width*.75))+'px',height:Math.max(48,Math.min(85,r.height*.65))+'px'});}
  }
  function render(){
    const r=result(),ready=evaluateFountain({...state,closed:true},fountain?{seated}:null,C).complete;
    dialog.classList.toggle('is-lit',r.lit);dialog.classList.toggle('closed',state.closed);dialog.dataset.complete=String(r.complete);
    $('#circuit-message').textContent=note||(selected?C.names[selected]+'에서 연결할 점을 눌러요.':r.complete?'전구가 켜졌어요! 광장에 빛을 보내 볼까요?':ready?'스위치의 검은 손잡이를 눌러 켜요.':r.lit?'전구가 켜졌어요. 스위치도 연결해 볼까요?':state.wires.length?'전지의 두 극이 전구·스위치를 거쳐 이어지게 해요.':'금색 점 두 곳을 차례로 눌러 연결해요.');
    $('#send-light').disabled=!r.complete;
    if(first){$('#circuit-message').textContent=note||(!found?'어디가 이상할까요? 부품과 전선을 살펴봐요.':r.complete?'이었더니 전구가 켜졌어요!':repaired()?'전선은 이어졌어요. 스위치를 켜 볼까요?':selected?'다른 전선 끝을 눌러 이어요.':'끊긴 곳을 찾았어요. 두 전선 끝을 이어 봐요.');$('#send-light').disabled=!found||!r.complete;}
    if(bridge){$('#circuit-message').textContent=note||(!found?'전선은 모두 이어져 있어요. 어디가 다를까요?':!cleared?'손잡이 아래에 꽃잎이 끼어 있네요.':r.complete?'스위치를 닫으니 전구가 켜졌어요!':'꽃잎은 없어졌어요. 전구는 아직 꺼져 있네요.');$('#send-light').disabled=!found||!cleared||!r.complete;}
    if(fountain){dialog.classList.toggle('loose-bulb',!seated);$('#circuit-message').textContent=note||(!found?'전선·스위치·전구를 하나씩 살펴봐요.':!seated?(state.closed?'전구와 받침 사이가 떨어져 있네요.':'스위치가 열렸어요. 전구와 받침을 살펴봐요.'):r.complete?'꼭 끼우고 켜니 전구에 불이 들어왔어요!':'전구와 받침이 맞닿았어요. 불은 아직 꺼져 있네요.');$('#send-light').disabled=!found||!seated||!r.complete;}
    for(const b of terminals){const id=b.dataset.node;b.classList.toggle('selected',selected===id);b.classList.toggle('connected',used(id));b.classList.toggle('available',!!canConnect(selected,id));b.classList.toggle('hinted',hinted.includes(id));b.setAttribute('aria-pressed',String(selected===id));b.setAttribute('aria-label',C.names[id]+(used(id)?' · 누르면 전선 빼기':' 연결점'));}
    if(practice){$('#send-light').disabled=false;$('#circuit-message').textContent=note||(selected?C.names[selected]+'에서 연결할 점을 눌러요.':r.lit?'전구가 켜졌어요. 연결이나 스위치를 바꿔 봐요.':'어디에서 연결이 끊겼을까요?');}
    $('#toggle').setAttribute('aria-pressed',String(state.closed));$('#toggle').setAttribute('aria-label',state.closed?'스위치 열기':'스위치 닫기');$('#toggle').classList.toggle('suggested',ready&&!state.closed&&!bridge&&!fountain&&!practice);$('#switch-state').textContent=state.closed?'닫힘':'열림';$('#undo').disabled=!history.length;draw();
    for(const b of inspect.querySelectorAll('[data-inspect]')){const seen=inspected.has(b.dataset.inspect);b.hidden=found;b.classList.toggle('inspected',seen);b.innerHTML=seen?'<span class="inspect-mark" aria-hidden="true">✓</span>':'';b.setAttribute('aria-label',({battery:'전지',bulb:'전구',switch:'스위치'})[b.dataset.inspect]+(seen?' · 살펴본 부품, 다시 살펴보기':' 살펴보기'));}
    $('#wire-gap').hidden=!first||found;$('#wire-gap').classList.toggle('hinted',hintCount>1);
    for(const b of inspect.querySelectorAll('[data-repair]')){b.hidden=!first||!found;b.classList.toggle('selected',selected===b.dataset.repair);b.classList.toggle('connected',repaired());b.setAttribute('aria-pressed',String(selected===b.dataset.repair));b.setAttribute('aria-label',(b.dataset.repair==='lb'?'전선 왼쪽 끝':'전선 오른쪽 끝')+(repaired()?' · 연결됨 · 누르면 전선 빼기':selected===b.dataset.repair?' · 선택됨 · 다시 누르면 취소':' · 연결할 끝점'));}
    $('#toggle').hidden=(first||bridge||fountain)&&!found;seat.hidden=!fountain||!found||seated;petal.hidden=!bridge||cleared;petal.disabled=!found;petal.classList.toggle('found',found);
    inspect.querySelector('[data-inspect="switch"]').classList.toggle('hinted',bridge&&!found&&hintCount>1);
    inspect.querySelector('[data-inspect="bulb"]').classList.toggle('hinted',fountain&&!found&&hintCount>1);
  }
  for(const b of terminals){
    b.addEventListener('click',()=>{if(!suppress)activate(b.dataset.node);});
    b.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;suppress=false;gesture={id:e.pointerId,node:b.dataset.node,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);});
    b.addEventListener('pointermove',e=>movePreview(b,e));
    b.addEventListener('pointerup',e=>{if(gesture?.id!==e.pointerId)return;const g=gesture;gesture=null;$('#preview').setAttribute('d','');clearDrop();if(g.moved){suppress=true;setTimeout(()=>suppress=false,0);const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('.terminal');if(end)connect(g.node,end.dataset.node);else{selected=null;note='';render();}}});
    b.addEventListener('pointercancel',()=>{cancelGesture();suppress=false;render();});
  }
  $('#toggle').onclick=()=>{if(bridge&&!cleared){note='꽃잎 때문에 닫히지 않아요. 끼인 꽃잎을 먼저 치워요.';render();return;}const next=clone(state);next.closed=!next.closed;if(C.evaluate(next.wires,next.closed).short){note='전구를 거치지 않는 길이에요. 전선을 고쳐 봐요.';render();return;}commit(next);};
  $('#undo').onclick=()=>{if(!history.length)return;cancelGesture();state=history.pop();selected=null;note='';hinted=[];onChange(clone(state));render();if($('#undo').disabled&&document.activeElement===$('#undo'))$('#circuit-hint').focus();};
  function pairings(ids){if(!ids.length)return [[]];return ids.slice(1).flatMap((b,i)=>pairings(ids.slice(1).filter((_,j)=>j!==i)).map(rest=>[[ids[0],b],...rest]));}
  const solutions=pairings(C.ids).filter(w=>C.evaluate(w,true).complete),key=w=>[...w].sort().join(':');
  $('#circuit-hint').onclick=e=>{if(e)selected=null;if(result().complete){hinted=[];note=practice?'전구가 켜졌어요. 전선이나 스위치를 바꿔 실험해요.':'전구가 켜졌어요. 아래 버튼으로 광장에 빛을 보내요.';render();return;}if(fountain){hintCount++;note=!found?(hintCount===1?'전구와 받침이 맞닿은 곳을 살펴봐요.':'전구가 비스듬하고 받침 위에 틈이 보여요.'):!seated?(state.closed?'검은 손잡이를 눌러 스위치를 먼저 열어요.':'전구의 회전 화살표를 눌러 꼭 끼워요.'):'스위치를 닫아 불이 켜지는지 확인해요.';render();return;}if(bridge){hintCount++;note=!found?(hintCount===1?'첫 가로등과 스위치 모양을 비교해 봐요.':'들린 손잡이 아래에 무엇이 끼었을까요?'):!cleared?'분홍 꽃잎을 눌러 치워요.':'검은 손잡이를 눌러 스위치를 닫아요.';render();return;}if(first){hintCount++;note=!found?(hintCount===1?'전지에서 시작해 전선을 따라가 봐요.':'아래쪽 전선 사이에 틈이 보여요.'):!repaired()?'구리색 전선 끝 두 곳을 차례로 눌러요.':'스위치를 켜서 불이 들어오는지 확인해요.';render();return;}const rank=w=>w.reduce((n,e)=>n+(state.wires.some(x=>key(x)===key(e))?10:0),0),best=[...solutions].sort((a,b)=>rank(b)-rank(a))[0],wrong=state.wires.find(e=>!best.some(x=>key(x)===key(e))),next=best.find(e=>!state.wires.some(x=>key(x)===key(e)));hinted=wrong?[wrong[0]]:next||[];note=wrong?'반짝이는 점을 눌러 이 전선을 빼 봐요.':next?'반짝이는 두 점을 차례로 눌러 봐요.':'스위치의 검은 손잡이를 눌러 켜요.';render();};
  $('#circuit-close').onclick=()=>dialog.close();
  $('#send-light').onclick=()=>{if(practice){dialog.close();return;}if(!result().complete||((first||bridge||fountain)&&!found)||(bridge&&!cleared)||(fountain&&!seated))return;dialog.close();onComplete();};
  function focusFinding(){$('#circuit-message').tabIndex=-1;$('#circuit-message').focus();}
  for(const b of inspect.querySelectorAll('[data-inspect]'))b.onclick=()=>{inspected.add(b.dataset.inspect);if(fountain&&b.dataset.inspect==='bulb'){found=true;note='';onFound({found:true});render();focusFinding();return;}if(bridge&&b.dataset.inspect==='switch'){found=true;note='';onFound({found:true});render();focusFinding();return;}note=(fountain?{battery:'전지의 두 극에 전선이 잘 연결돼 있어요.',switch:'스위치는 닫혀 있어요. 전구 쪽도 살펴볼까요?'}:bridge?{battery:'전지는 제자리에 있고, 두 극에 전선도 연결돼 있어요.',bulb:'전구 양쪽 전선은 끊김 없이 이어져 있어요.'}:{battery:'전지는 제자리에 있어요. 전선을 따라가 볼까요?',bulb:'전구 양쪽에서 전선이 뻗어 있어요.',switch:'스위치는 닫혀 있어요. 그런데 왜 불이 안 켜질까요?'})[b.dataset.inspect];if(helpNote)note=helpNote;render();};
  $('#wire-gap').onclick=()=>{found=true;note='';onFound({found:true});render();inspect.querySelector('[data-repair]').focus();};
  petal.onclick=()=>{if(!bridge||!found||cleared)return;cleared=true;note='';onFound({cleared:true});render();focusFinding();};
  seat.onclick=()=>{if(!fountain||!found||seated)return;if(state.closed){note='먼저 스위치를 연 다음 전구를 끼워요.';render();return;}seated=true;note='';onFound({seated:true});render();focusFinding();};
  for(const b of inspect.querySelectorAll('[data-repair]')){
    b.onclick=()=>{if(!suppress)activate(b.dataset.repair);};
    b.onpointerdown=e=>{if(e.button!==0||!e.isPrimary)return;suppress=false;gesture={id:e.pointerId,node:b.dataset.repair,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);};
    b.onpointermove=e=>movePreview(b,e);
    b.onpointerup=e=>{if(gesture?.id!==e.pointerId)return;const g=gesture;gesture=null;$('#preview').setAttribute('d','');clearDrop();if(!g.moved)return;suppress=true;setTimeout(()=>suppress=false,0);const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-repair]');if(end)connect(g.node,end.dataset.repair);else{selected=null;note='';render();}};
    b.onpointercancel=()=>{cancelGesture();suppress=false;render();};
  }
  dialog.addEventListener('cancel',e=>{if(selected||gesture){e.preventDefault();cancelGesture();hinted=[];render();}});
  dialog.addEventListener('pointerup',()=>{if(suppress)setTimeout(()=>suppress=false,0);});
  dialog.addEventListener('close',()=>{cancelGesture();suppress=false;});
  const interrupt=()=>{if(dialog.open&&gesture){cancelGesture();render();}};addEventListener('blur',interrupt);document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
  dialog.addEventListener('lostpointercapture',e=>{if(gesture?.id===e.pointerId)interrupt();});
  for(const event of ['pointerdown','keydown'])dialog.addEventListener(event,()=>{if(!gesture)suppress=false;});
  new ResizeObserver(draw).observe(bench);
  return {update(dt){if(!dialog.open||document.hidden||practice||!(first||bridge||fountain)||result().complete)return;const progress=Number(found)+(first?Number(repaired()):bridge?Number(cleared):Number(!state.closed||seated)+Number(seated)),level=progressHelp.update(dt,progress,!!gesture);if(level<autoHelp){autoHelp=level;helpNote='';}if(!gesture&&level>autoHelp){autoHelp=level;$('#circuit-hint').onclick();helpNote=note;}},open(draft,name,index,story=null,revisit=false){practice=revisit;inspected=new Set();progressHelp.reset();autoHelp=0;helpNote='';state=clone(draft);first=index===0&&story!==null;bridge=index===1&&story!==null;fountain=index===2&&story!==null;seated=!!story?.seated;found=!!story?.found;cleared=!!story?.cleared;hintCount=0;inspect.hidden=!(first||bridge||fountain);dialog.classList.toggle('first-repair',first||bridge||fountain);dialog.classList.toggle('fountain-repair',fountain);dialog.classList.toggle('loose-bulb',fountain&&!seated);dialog.classList.toggle('bridge-repair',bridge);selected=null;note='';hinted=[];history=[];$('#circuit-title').textContent=fountain?'분수의 등은 왜 꺼졌을까요?':bridge?'이번에는 어디가 다를까요?':first?'가로등이 왜 꺼졌을까요?':name;$('#send-light').textContent=fountain?'분수 광장 깨우기 ✦':bridge?'정원에 빛 보내기 ✦':first?'가로등 켜기 ✦':'광장에 빛 보내기 ✦';$('#circuit-hint').textContent=first||bridge||fountain?'살펴보기 도움':'연결 도움';$('.eyebrow').textContent=practice?'고친 가로등의 실험실':'가로등 회로';$('.circuit-note').textContent=practice?'여기서는 회로만 실험해요. 광장의 빛과 기록은 그대로예요.':'전선이 이어지고 스위치가 닫히면 전구가 켜져요.';
  if(practice){$('#circuit-title').textContent=name+' · 다시 실험하기';$('#send-light').textContent='광장으로 돌아가기';}
  dialog.dataset.station=index;dialog.dataset.practice=String(practice);dialog.showModal();render();$('#circuit-close').focus();},get isOpen(){return dialog.open;},get state(){return clone(state);}};
}
