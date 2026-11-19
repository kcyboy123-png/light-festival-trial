export function showOpening(){
  const dialog=document.querySelector('#movie-dialog'),video=document.querySelector('#restoration-movie');
  const title=document.querySelector('#movie-title'),caption=dialog.querySelector('p'),back=document.querySelector('#movie-back'),close=document.querySelector('#movie-close'),play=document.querySelector('#opening-play');
  const original=[title.textContent,caption.textContent,back.textContent],controls=video.controls;
  return new Promise(resolve=>{
    let finished=false,timer;
    const finish=()=>{
      if(finished)return;finished=true;clearTimeout(timer);
      video.removeEventListener('ended',finish);video.removeEventListener('error',finish);video.removeEventListener('timeupdate',keepWaiting);dialog.removeEventListener('close',finish);
      back.removeEventListener('click',finish);close.removeEventListener('click',finish);play.removeEventListener('click',start);
      video.pause();video.removeAttribute('src');video.load();video.controls=controls;dialog.close();dialog.classList.remove('opening');play.hidden=true;
      [title.textContent,caption.textContent,back.textContent]=original;resolve();
    };
    const keepWaiting=()=>{clearTimeout(timer);timer=setTimeout(finish,10000);};
    const start=()=>{play.hidden=true;video.play().catch(()=>{if(!finished)play.hidden=false;});};
    title.textContent='빛의 향연';caption.textContent='별여우와 함께, 잠든 도시에 빛을 되찾아 주세요.';back.textContent='건너뛰기 · Skip';
    dialog.classList.add('opening');video.controls=false;video.muted=true;video.src='assets/carousel-restoration.mp4';
    video.addEventListener('ended',finish);video.addEventListener('error',finish);video.addEventListener('timeupdate',keepWaiting);dialog.addEventListener('close',finish);
    back.addEventListener('click',finish);close.addEventListener('click',finish);play.addEventListener('click',start);
    dialog.showModal();back.focus({preventScroll:true});keepWaiting();start();
  });
}
