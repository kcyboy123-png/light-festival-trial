export function createExplorationInput(blocked,interact,hint,follow){
  const keys=new Set(),pad=document.querySelector('#move-pad'),knob=pad.querySelector('span');let pointer=null,stick={x:0,y:0},padRect=null;
  const directions={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
  function resetStick(){if(pointer===null&&!stick.x&&!stick.y)return;stick.x=stick.y=0;knob.style.transform='translate(0,0)';const held=pointer;pointer=null;padRect=null;if(held!==null&&pad.hasPointerCapture(held))pad.releasePointerCapture(held);}
  function reset(){keys.clear();resetStick();}
  addEventListener('keydown',e=>{if(blocked()||e.ctrlKey||e.altKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(directions[e.code]){e.preventDefault();keys.add(e.code);}else if(!e.repeat){if(e.code==='KeyE'){e.preventDefault();interact();}if(e.code==='KeyH')hint();if(e.code==='KeyF')follow();}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',reset);addEventListener('resize',reset);document.addEventListener('visibilitychange',reset);
  function move(e){const r=padRect,x=(e.clientX-r.left-r.width/2)/40,y=(e.clientY-r.top-r.height/2)/40,d=Math.max(1,Math.hypot(x,y));stick.x=x/d;stick.y=y/d;knob.style.transform=`translate(${stick.x*36}px,${stick.y*36}px)`;}
  pad.addEventListener('pointerdown',e=>{if(blocked()||pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;padRect=pad.getBoundingClientRect();pad.setPointerCapture(pointer);move(e);});
  pad.addEventListener('pointermove',e=>{if(e.pointerId===pointer)move(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===pointer)resetStick();});
  return {read(){if(blocked()){reset();return {x:0,y:0};}let {x,y}=stick;for(const key of keys){x+=directions[key][0];y+=directions[key][1];}const d=Math.hypot(x,y),strength=Math.min(1,Math.max(0,(d-.14)/.86));return d<=.14?{x:0,y:0}:{x:x/d*strength,y:y/d*strength,fromStick:pointer!==null};},get active(){return pointer!==null;},reset};
}
