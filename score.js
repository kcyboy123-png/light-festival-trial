export const TIERS=[
 {name:'브론즈',min:0,color:'#c7966e'}, {name:'실버',min:500,color:'#c8d4df'},
 {name:'골드',min:650,color:'#f2ce70'}, {name:'플래티넘',min:750,color:'#82dbcb'},
 {name:'다이아',min:850,color:'#8cd9fa'}, {name:'마스터',min:930,color:'#d7a1f2'},
 {name:'챌린저',min:1000,color:'#ffe6a0'}
];
export function validScore(s,completed){
 return !!s&&Number.isInteger(s.from)&&s.from>=0&&s.from<=completed&&Array.isArray(s.wrong)&&s.wrong.length<=64&&new Set(s.wrong).size===s.wrong.length&&s.wrong.every(k=>typeof k==='string'&&/^[2-9]:(observation|reason):[a-z]{1,24}$/.test(k)&&+k[0]>=s.from&&+k[0]<=completed);
}
export function scoreResult(state){
 const score=state.score||{from:state.completed,wrong:[]},points=Math.max(0,(state.completed-score.from)*100-score.wrong.length*20);
 return {points,mistakes:score.wrong.length,eligible:score.from===0,tier:[...TIERS].reverse().find(t=>points>=t.min)};
}
export function recordWrong(state,index,phase,answer){
 if(index!==state.completed||!state.score)return false;
 const key=index+':'+phase+':'+answer,next={...state.score,wrong:[...state.score.wrong,key]};
 if(!validScore(next,state.completed))return false;
 state.score=next;return true;
}
