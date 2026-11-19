export function createGameAudio(){
 const button=document.querySelector('#sound-toggle'),music=new Audio('assets/audio/light-city.mp3');
 music.preload='none';music.loop=true;music.volume=.22;
 let enabled=true,activated=false,started=false,context=null,effects=0,fade=null;
 try{enabled=localStorage.getItem('light-city-audio')!=='off';}catch{}
 const label=()=>{button.textContent=enabled&&activated?'소리 끄기':'소리 켜기';button.setAttribute('aria-pressed',String(enabled&&activated));};
 function duck(){
  clearInterval(fade);const open=document.querySelector('dialog[open]'),target=open?.classList.contains('opening')?0:(open ? 0.1 : 0.22);
  fade=setInterval(()=>{music.volume+=Math.sign(target-music.volume)*Math.min(.02,Math.abs(target-music.volume));if(Math.abs(music.volume-target)<.001){music.volume=target;clearInterval(fade);}},40);
 }
 async function start(){
  if(!enabled||document.hidden)return;
  activated=true;label();
  try{context??=new (window.AudioContext||window.webkitAudioContext)();await context.resume();}catch{}
  if(!enabled||document.hidden)return;
  try{await music.play();started=enabled&&!document.hidden;if(!started)music.pause();}catch{started=false;}label();duck();
 }
 function tone(hz,delay=0,length=.16,level=.035){
  if(!enabled||!context||context.state!=='running'||document.hidden)return;
  const oscillator=context.createOscillator(),gain=context.createGain(),time=context.currentTime+delay;
  oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(level,time+.015);gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  oscillator.connect(gain).connect(context.destination);oscillator.start(time);oscillator.stop(time+length+.03);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};effects++;
 }
 function effect(kind){
  if(kind==='wrong'){tone(294,0,.18,.025);tone(262,.12,.22,.02);}
  else if(kind==='correct'){tone(659,0,.18);tone(880,.1,.3);}
  else if(kind==='success'||kind==='final'){[523,659,784,1047,1319].forEach((n,i)=>tone(n,i*.12,.7,.035));if(kind==='final')[784,1047,1319,1568].forEach((n,i)=>tone(n,.9+i*.16,1,.025));}
  else tone(740,0,.07,.012);
 }
 button.onclick=()=>{if(enabled&&activated){enabled=false;started=false;music.pause();context?.suspend();}else{enabled=true;start();}try{localStorage.setItem('light-city-audio',enabled?'on':'off');}catch{}label();};
 const recover=e=>{if(!e.target.closest('#sound-toggle')&&enabled&&(!started||music.paused||context?.state!=='running'))start();};
 document.addEventListener('pointerdown',recover,{passive:true});
 document.addEventListener('keydown',e=>{if(!e.repeat)recover(e);});
 document.addEventListener('click',e=>{if(e.target.closest('button:not(#sound-toggle):not(:disabled)'))effect('tap');});
 document.addEventListener('festival-sound',e=>effect(e.detail));
 document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();context?.suspend();}else if(enabled&&activated)start();});
 new MutationObserver(duck).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 label();return {get state(){return {enabled,started,paused:music.paused,time:music.currentTime,volume:music.volume,effects,context:context?.state||'uninitialized'};}};
}
