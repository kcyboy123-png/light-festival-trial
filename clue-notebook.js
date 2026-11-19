import {fountainClueArt} from './fountain-clue-art.js?v=trial-20261120-1';
export function createClueNotebook({isRead,canDiscover,onRead,onObserve}){
  const $=s=>document.querySelector(s),dialog=$('#clue-dialog'),art=dialog.querySelector('svg'),firstArt=art.innerHTML;
  const pages=[
    {title:'별 세 개, 그리고 다리',art:firstArt,text:'꽃잎 아래에서 발견한 그림이에요.<br>별 세 개가 있는 다리를 찾아볼까요?',lesson:'전선이 이어지자 전구가 켜졌어요.'},
    {title:'꽃 모양 분수가 있는 곳',art:fountainClueArt,text:'정원에서 발견한 그림이에요.<br>꽃 모양 분수를 찾아볼까요?',lesson:'스위치가 닫히자 전구가 켜졌어요.'},
    {title:'금빛 지붕 아래 작은 목마',art:'<g fill="none" stroke="#efd39b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M120 11V28M35 65L120 28 205 65ZM45 119H195M60 65V119M180 65V119M120 65V119M86 99H138L153 87 148 76 137 82 135 93M94 99L88 111M130 99L138 111"/></g>',text:'분수 곁에서 발견한 그림이에요.<br>금빛 지붕과 작은 목마를 찾아볼까요?',lesson:'전구를 꼭 끼우고 스위치를 닫으니 켜졌어요.'}
  ];
  const scenery=[
    '<path d="M27 124Q75 116 120 124T213 124M49 132Q85 127 120 132T191 132" fill="none" stroke="#74bfca" stroke-width="2"/><path d="M25 104Q120 14 215 104L215 120H25Z" fill="#d3b777" opacity=".12"/>',
    '',
    '<path d="M35 65L120 28 80 65ZM120 28L160 65H205Z" fill="#cfab6f" opacity=".45"/><path d="M43 119H197L204 129H36Z" fill="#769aa4" opacity=".6"/><path d="M60 67Q75 83 90 67M90 67Q105 83 120 67M120 67Q135 83 150 67M150 67Q165 83 180 67" fill="none" stroke="#ecba8e" stroke-width="2"/>'
  ];
  pages.forEach((page,i)=>{page.art='<path d="M12 31V12H38M202 12H228V31M12 109V128H26M214 128H228V109" fill="none" stroke="#a6a782" stroke-width="1"/>'+scenery[i]+page.art;});
  const tabs=document.createElement('nav');tabs.id='clue-pages';tabs.setAttribute('aria-label','찾은 그림');art.before(tabs);let active=-1,opener=null;
  function open(index=-1){
    if(index>=0&&(!pages[index]||(!isRead(index)&&!canDiscover(index))))return;
    if(!dialog.open)opener=document.activeElement;
    active=index;onObserve();tabs.replaceChildren();
    pages.forEach((page,i)=>{if(!isRead(i)&&!canDiscover(i))return;const button=document.createElement('button');button.textContent=['다리 그림','분수 그림','목마 그림'][i]+(isRead(i)?'':' · 새 그림');button.dataset.page=i;button.setAttribute('aria-pressed',String(i===index));button.onclick=()=>open(i);tabs.append(button);});
    const page=pages[index];dialog.querySelector('.eyebrow').textContent=page&&!isRead(index)?'꽃잎 아래에서 찾은 단서':'별여우의 그림 수첩';
    $('#clue-title').textContent=page?.title||'아직 비어 있는 수첩';art.toggleAttribute('hidden',!page);if(page)art.innerHTML=page.art;
    dialog.querySelector(':scope > p').innerHTML=page?.text||'꽃잎 아래 그림을 발견하면<br>여기에 담아 두어요.';
    dialog.querySelector('small').textContent=page?.lesson||'찾은 그림은 언제든 다시 볼 수 있어요.';
    $('#follow-clue').textContent=page&&!isRead(index)?'수첩에 담고 둘러보기':'계속 둘러보기';
    if(!dialog.open){dialog.showModal();$('#clue-close').focus();}
    else tabs.querySelector('[data-page="'+index+'"]')?.focus();
  }
  $('#follow-clue').onclick=()=>{if(active>=0&&!isRead(active)&&canDiscover(active))onRead(active);dialog.close();};
  let reminder;
  function remember(index){
    if(!pages[index]||!isRead(index))index=-1;
    if(reminder===index)return;reminder=index;
    const button=$('#notebook-open'),label=index<0?'그림 수첩':['다리 그림','분수 그림','목마 그림'][index];
    button.innerHTML=(index<0?'':'<svg viewBox="0 0 240 140" aria-hidden="true">'+pages[index].art+'</svg>')+'<span>'+label+(navigator.maxTouchPoints>0?'':' · B')+'</span>';
    button.setAttribute('aria-label',index<0?'그림 수첩 열기':label+' 수첩 열기');
  }
  return {open,remember,restoreFocus(){(opener?.isConnected&&!opener.disabled&&opener.getClientRects().length&&opener.matches('button,canvas')?opener:$('#scene')).focus();},openBook(){
    const found=pages.findIndex((_,i)=>!isRead(i)&&canDiscover(i));
    if(found>=0){open(found);return;}
    let last=-1;pages.forEach((_,i)=>{if(isRead(i))last=i;});open(last);
  }};
}
