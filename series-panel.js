import {bulbArt,cellArt,switchArt} from './circuit-art.js?v=trial-20261119-11';
import {compareBrightness,correctObservation} from './series-model.js';
import {createProgressHelp} from './progress-help.js';
export function createSeriesPanel(onChange,onComplete){
 const dialog=document.querySelector('#series-dialog'),$=s=>dialog.querySelector(s);
 let state,selected=null,note='',drag=null,suppress=false,history=[];
 const progressHelp=createProgressHelp();let helpLevel=0,wrong=0;
 function clearHelp(){helpLevel=0;wrong=0;dialog.classList.remove('compare-help');}
 function help(level){
  const ready=compareBrightness(state).ready;
  note=ready?(level===1?'두 전구 안의 꼬불꼬불한 선을 비교해 봐요. 어느 쪽이 더 환한가요?':'두 전구의 테두리를 표시했어요. 안쪽 선의 밝기를 번갈아 살펴보고 골라 봐요.'):setupMessage();
  dialog.classList.toggle('compare-help',ready&&level===2);render();
 }
 const undo=document.createElement('button');undo.id='series-undo';undo.textContent='되돌리기';$('.series-tools').append(undo);
 function remember(){history.push({count:state.count,joined:state.joined,closed:state.closed});}
 undo.onclick=()=>{if(!history.length)return;Object.assign(state,history.pop());selected=null;note='';commit();if(undo.disabled&&document.activeElement===undo)$('#series-count').focus();};
 function batteries(count,p){
  if(count===1)return `<path d="M40 203H81M179 203H230" stroke="url(#${p}-gold)" stroke-width="6"/>`+cellArt(p,91,179,88,45);
  return cellArt(p,32,179,88,45)+cellArt(p,142,179,88,45)+`<path d="M40 203H22M120 203V240Q120 250 100 250M132 203V238Q132 250 190 250" fill="none" stroke="url(#${p}-gold)" stroke-width="5"/><circle cx="100" cy="250" r="9" fill="url(#${p}-gold)"/><circle cx="190" cy="250" r="9" fill="url(#${p}-gold)"/>${state.joined?'<path d="M100 250Q145 280 190 250" fill="none" stroke="#edcb87" stroke-width="6"/>':''}`;
 }
 function art(side){const p='series-'+side;const wires=['M40 203H29Q21 203 21 191V137Q21 117 42 117H151','M249 117H350Q369 117 369 139V193Q369 213 350 213H322M285 213H230V203'];return `<svg class="circuit-art" viewBox="0 0 400 285" aria-hidden="true">
 ${wires.map((d,i)=>`<path d="${d}" class="cable-shadow"/><path d="${d}" class="wire" style="stroke:${i?'#69b9b3':'#cf826b'}"/><path d="${d}" class="wire-glint"/>`).join('')}
 <g transform="translate(116.8 -2) scale(.64)">${bulbArt(p)}</g>
 <ellipse cx="135" cy="236" rx="108" ry="7" fill="#020a11" opacity=".6"/>
 <rect x="27" y="179" width="216" height="54" rx="9" fill="#071b27" stroke="#9b8458"/>
 <rect x="27" y="174" width="216" height="53" rx="9" fill="url(#${p}-enamel)" stroke="#607f83"/>
 <path d="M38 177H232" stroke="#bbd4c5" opacity=".35"/><g class="batteries">${batteries(side==='right'?state.count:1,p)}</g>
 <g transform="translate(269 187) scale(.24)">${switchArt(p+'-switch')}</g>
 </svg><button class="bulb-choice" id="series-${side}-bulb" aria-label="${side==='left'?'왼쪽':'오른쪽'} 전구 선택"></button>`;}

 function cancelDrag(){if(drag)suppress=true;drag=null;clearDrop();}
 function commit(){cancelDrag();clearHelp();onChange({...state});render();}
 function join(id){
  if(state.joined){remember();state.joined=false;selected=null;note='연결을 빼니 오른쪽 회로가 끊겼어요.';commit();return;}
  if(selected===id){selected=null;note='';render();return;}
  if(selected){remember();state.joined=true;selected=null;note='';commit();}else{selected=id;note='다른 전지의 연결점을 눌러요.';render();}
 }
 function setupMessage(){return state.count===2&&!state.joined?'오른쪽 두 전지의 −극과 +극을 이어 봐요.':!state.closed?'함께 불을 켜서 비교해요.':'같은 밝기예요. 오른쪽에 전지 하나를 더 놓아 봐요.';}
 function render(){
  const r=compareBrightness(state);dialog.classList.toggle('series-closed',state.closed);
  undo.disabled=!history.length;$('#series-right-board').classList.toggle('observed',state.discovered&&r.ready);
  for(const side of ['left','right'])$('#series-'+side+'-board').dataset.light=r[side];
  $('#series-right-board .batteries').innerHTML=batteries(state.count,'series-right');
  $('#series-right-title').textContent=state.count===2?(state.joined?'전지 두 개 · 직렬':'전지 두 개 · 연결 전'):'전지 한 개';
  $('#series-count').textContent=state.count===1?'전지 하나 더 놓기':'전지 한 개로 비교';
  $('#series-power').textContent=state.closed?'함께 불 끄기':'함께 불 켜기';$('#series-power').setAttribute('aria-pressed',String(state.closed));
  $('#series-message').textContent=note||(r.ready?(state.discovered?(state.restored?'전지 수를 바꿔 다시 비교해 봐요.':'비교를 마쳤어요. 회전목마를 깨워 볼까요?'):'더 밝은 전구를 눌러 봐요.'):setupMessage());
  $('#series-send').disabled=!state.restored&&(!state.discovered||!r.ready);$('#series-send').textContent=state.restored?'광장으로 돌아가기':'회전목마 깨우기 ✦';
  $('#series-finding').hidden=!state.discovered;$('#series-finding').textContent=!state.closed?'스위치가 열려 두 전구가 꺼졌어요.':state.count===1?'지금은 두 쪽 모두 전지 한 개라 밝기가 같아요.':!state.joined?'오른쪽 전지 사이가 끊겨 오른쪽 전구만 꺼졌어요.':'같은 전구라면, 전지 두 개를 직렬로 연결한 쪽이 더 밝아요.';
  for(const b of dialog.querySelectorAll('[data-join]')){b.hidden=state.count!==2;b.classList.toggle('selected',selected===b.dataset.join);b.classList.toggle('connected',state.joined);b.setAttribute('aria-pressed',String(state.joined||selected===b.dataset.join));b.setAttribute('aria-label',(b.dataset.join==='minus'?'첫 번째 전지 −극':'두 번째 전지 +극')+(state.joined?' · 연결됨 · 누르면 전선 빼기':selected===b.dataset.join?' · 선택됨 · 다시 누르면 취소':' 연결점'));}
  $('#series-left-bulb').setAttribute('aria-label','왼쪽 전구 선택, '+(r.left==='off'?'꺼짐':'전지 한 개의 밝기'));
  $('#series-right-bulb').setAttribute('aria-label','오른쪽 전구 선택, '+(r.right==='off'?'꺼짐':r.right==='bright'?'더 밝음':'왼쪽과 같은 밝기'));
  align();
 }
 function align(){
  if(!dialog.open)return;
  for(const side of ['left','right']){const a=$('#series-'+side+'-board .apparatus'),w=a.clientWidth,h=a.clientHeight,s=Math.min(w/400,h/285),oy=(h-285*s)/2,ox=(w-400*s)/2;const bulb=$('#series-'+side+'-bulb');Object.assign(bulb.style,{left:(ox+200*s-53*s)+'px',top:(oy)+'px',width:Math.max(48,106*s)+'px',height:Math.max(48,104*s)+'px'});
   if(side==='right')for(const [id,x] of [['minus',100],['plus',190]]){const b=$('[data-join="'+id+'"]');Object.assign(b.style,{left:(ox+x*s-25)+'px',top:(oy+250*s-25)+'px'});}
  }
 }
 function choose(side){
  if(!compareBrightness(state).ready){note=setupMessage();render();return;}
  if(!correctObservation(state,side)){wrong++;help(Math.min(2,wrong));return;}
  state.discovered=true;note='발견했어요! 두 개를 직렬로 연결한 쪽이 더 밝아요.';commit();
 }
 $('#series-count').onclick=()=>{remember();state.count=state.count===1?2:1;state.joined=false;selected=null;note='';commit();};
 $('#series-power').onclick=()=>{remember();state.closed=!state.closed;selected=null;note='';commit();};
 $('#series-close').onclick=()=>dialog.close();
 $('#series-send').onclick=()=>{if(!state.restored&&(!state.discovered||!compareBrightness(state).ready))return;dialog.close();onComplete();};
 function clearDrop(){for(const target of dialog.querySelectorAll('.drop-ready'))target.classList.remove('drop-ready');}
 for(const b of dialog.querySelectorAll('[data-join]')){
  b.onpointermove=e=>{if(drag?.id!==e.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>10)drag.moved=true;clearDrop();if(state.joined)return;const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-join]');if(end&&end!==b)end.classList.add('drop-ready');};
  b.onclick=()=>{if(!suppress)join(b.dataset.join);};
  b.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;suppress=false;drag={id:e.pointerId,from:b.dataset.join,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);};
  b.onpointerup=e=>{if(drag?.id!==e.pointerId)return;const d=drag;drag=null;clearDrop();if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<10)return;suppress=true;setTimeout(()=>suppress=false,0);const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-join]');if(end&&end!==b){if(!state.joined)remember();state.joined=true;selected=null;note='';commit();}else{selected=null;note='';render();}};
  b.onpointercancel=()=>{cancelDrag();suppress=false;selected=null;note='';render();};
 }
 dialog.addEventListener('cancel',e=>{if(selected||drag){e.preventDefault();cancelDrag();selected=null;note='';render();}});
 dialog.addEventListener('pointerup',()=>{if(suppress)setTimeout(()=>suppress=false,0);});
 dialog.addEventListener('close',()=>{cancelDrag();selected=null;suppress=false;clearHelp();});
 const interrupt=()=>{if(dialog.open&&drag){cancelDrag();selected=null;note='';render();}};addEventListener('blur',interrupt);document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
 dialog.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId)interrupt();});
 dialog.addEventListener('keydown',()=>{if(!drag)suppress=false;});
 new ResizeObserver(align).observe(dialog);
 return {update(dt){
  if(!dialog.open||document.hidden||state.discovered||state.restored)return;
  const progress=state.count===2?1+Number(state.joined)+Number(state.joined&&state.closed):0,level=progressHelp.update(dt,progress,!!drag);
  if(level<helpLevel)clearHelp();
  if(!drag&&level>helpLevel){helpLevel=level;help(Math.max(level,Math.min(2,wrong)));}
 },open(value){clearHelp();progressHelp.reset();for(const b of dialog.querySelectorAll('[data-join]'))dialog.append(b);state={...value};history=[];note='';selected=null;for(const side of ['left','right']){$('#series-'+side+'-board .apparatus').innerHTML=art(side);$('#series-'+side+'-bulb').onclick=()=>choose(side);}
  const right=$('#series-right-board .apparatus');for(const id of ['minus','plus'])right.append(dialog.querySelector('[data-join="'+id+'"]'));
  dialog.showModal();render();$('#series-close').focus();},get isOpen(){return dialog.open;}};
}
