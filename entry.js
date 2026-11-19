import {showOpening} from './opening.js?v=trial-20261119-2';

if(new URLSearchParams(location.search).get('preview')!=='1')await showOpening();
import('./app.js?v=trial-20261119-11').catch(error=>{
  console.error(error);
  document.querySelector('#loading').hidden=true;
  document.querySelector('#error-message').textContent='게임을 불러오지 못했어요. 다시 열기를 눌러 주세요.';
  document.querySelector('#error').hidden=false;
});
