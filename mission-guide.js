import {simulate,checkMission,terminals} from './mission-model.js?v=trial-20261119-12';

// Situation first; hints reveal the idea before naming a possible repair.
export const BRIEFS=[
  {situation:'꽃길이 어두워서 발밑이 보이지 않아요.',goal:'끊긴 전선 한 가닥을 이어 가로등을 켜 주세요.',try:'① 전지 ＋ → ② 전구 왼쪽 점',reward:'발밑의 꽃길이 환해졌어요!',hints:['빛나는 큰 원 두 개를 찾아요.','①을 누른 다음 ②를 누르면 전선이 생겨요.','전지 ＋와 전구 왼쪽 점을 이어요. 이미 있는 전선은 그대로 두어요.']},
  {situation:'꽃터널의 전선은 이어져 있는데 불이 꺼져 있어요.',goal:'스위치를 켜서 꽃터널을 밝혀 주세요.',try:'비스듬한 스위치 막대를 눌러요.',reward:'꽃터널에 따뜻한 불빛이 돌아왔어요!',hints:['전선이 아니라 스위치 안을 살펴봐요.','막대가 떨어져 있으면 전기가 지나갈 수 없어요.','스위치 그림을 한 번 눌러 두 금속점을 붙여요.']},
  {situation:'다리 불을 켜고 끌 스위치를 새로 달아야 해요.',goal:'불도 켜지고, 스위치로 끌 수도 있는 길을 만들어 주세요.',try:'전지·스위치·전구를 전선으로 이어요.',probe:'스위치로 꺼 보기',reward:'이제 다리 입구의 불을 켜고 끌 수 있어요!',hints:['전지의 두 끝 사이에 전구와 스위치가 모두 있어야 해요.','불이 켜졌다면 스위치를 꺼 봐요. 그대로 켜져 있으면 스위치를 건너뛴 길이 있어요.','전지 ＋ → 스위치 1, 스위치 2 → 전구 1, 전구 2 → 전지 −를 이어 볼 수 있어요.']},
  {situation:'정원의 연결 부품이 빠졌어요. 어떤 재료로 채울까요?',goal:'전기가 통하는 재료를 골라, 재료를 지나는 전구의 불을 켜 주세요.',try:'재료를 고르고 비어 있는 연결점을 이어요.',probe:'재료 바꿔 비교하기',reward:'전기가 통하는 재료로 정원이 살아났어요!',hints:['전선만 이어도 재료가 전기를 막으면 불이 켜지지 않아요.','배선은 그대로 두고 재료만 바꾸어 비교해요.','구리를 고르고 재료 2 → 전구 1, 전구 2 → 전지 −를 이어요.']},
  {situation:'새 재료를 끼운 뒤 정원이 꺼졌어요. 어디가 문제일까요?',goal:'전기가 통하는 재료와 끊김 없는 길로 불을 켜 주세요.',try:'재료만 바꾸어도 켜지는지, 끊긴 곳은 없는지 살펴봐요.',probe:'재료만 바꿔 시험',reward:'두 고장을 찾아 별빛 정원이 깨어났어요!',hints:['한 조건씩 바꾸고 불빛을 살펴봐요.','구리로 바꾸어도 꺼져 있다면 전선도 확인해요.','재료 오른쪽 점에서 전구로 이어지는 선이 있는지 살펴봐요.']},
  {situation:'분수 앞 불빛이 약해 물길이 잘 보이지 않아요.',goal:'같은 전구를 전지 한 개일 때보다 밝게 켜 주세요.',try:'우선 전지 한 개로 켜고, 두 개일 때와 비교해요.',probe:'전지 한 개와 비교',reward:'더 밝은 불빛이 분수의 물길을 비춰요!',hints:['먼저 끊긴 곳을 이어 전지 한 개로 불을 켜요.','전지를 하나 더 놓아 보세요. 꺼진다면 두 전지가 만나는 극을 살펴봐요.','스위치 2 → 전구 1을 잇고, 전지 두 개 사이에 ＋와 −가 만나게 뒤집어요.']},
  {situation:'분수 불이 꺼졌어요. 전지 방향만 고쳐도 수리는 끝나지 않아요.',goal:'밝게 켜지고, 스위치를 열면 꺼지게 고쳐요.',try:'전지 방향과 스위치를 지나는 길을 따로 시험해요.',probe:'밝기와 스위치 시험',reward:'두 고장을 고쳐 꽃잎 분수가 깨어났어요!',hints:['한 곳을 고친 뒤 모든 조건이 맞는지 시험해요.','불이 켜져도 스위치를 열었을 때 꺼지는지 확인해요.','스위치 양쪽을 직접 잇는 선은 스위치를 건너뛰어요.']},
  {situation:'정원 문 두 곳이 모두 닫혀야 분수 등이 켜져야 해요.',goal:'A와 B가 모두 닫혔을 때만 켜지게 만들어요.',try:'큰 원끼리 이어 회로를 만들고 네 가지 상태를 시험해요.',probe:'A·B 네 가지 상태 시험',reward:'두 조건을 함께 확인하는 정원 등이 켜졌어요!',hints:['A만 열었을 때도, B만 열었을 때도 꺼져야 해요.','한 스위치를 건너뛰는 길이 있으면 그 스위치가 불을 끌 수 없어요.','전지에서 전구까지 이어지는 길이 A와 B를 모두 지나게 생각해요.']},
  {situation:'꽃길 양쪽 어디에서든 스위치 하나로 불을 켜야 해요.',goal:'A만 닫아도, B만 닫아도 켜지게 고쳐요.',try:'지금 배선은 둘 다 닫아야 켜져요. 다른 길을 설계해요.',probe:'A·B 네 가지 상태 시험',reward:'어느 쪽에서도 꽃길을 밝힐 수 있어요!',hints:['8단계와 달리 한쪽만 닫아도 불이 켜져야 해요.','A를 연 채 B만 닫아 전구까지 이어지는 길을 찾아요.','A를 지나는 길과 B를 지나는 길이 따로 필요해요.']},
  {situation:'회전목마의 안전등에 여러 고장이 겹쳐 있어요.',goal:'두 전지로 밝게, 구리를 지나고, A·B 모두 닫힐 때만 켜요.',try:'전지·재료·스위치 조건을 하나씩 바꿔 고장을 구별해요.',probe:'안전 스위치 네 상태 시험',reward:'모든 조건을 확인해 빛의 축제를 완성했어요!',hints:['불이 켜지는 것만으로는 안전 회로가 완성되지 않아요.','A만 열었을 때와 B만 열었을 때 모두 꺼지는지 비교해요.','전지 방향·재료를 고친 뒤, 두 스위치를 건너뛰는 선도 살펴봐요.']}
];

export function nextHint(i,level){
  const m=BRIEFS[i];return m.hints[Math.min(level,2)];
}

export function diagnosis(i,m,d){
  const r=checkMission(m,d),s=r.result;
  if(s.short)return '빨간 선은 전구를 건너뛴 지름길이에요. 선 이름의 양 끝을 보고 필요 없는 선을 지워요.';
  if(s.voltage===0)return '전지를 두 개 놓았지만 불이 꺼졌어요. 가운데 만나는 극이 같은지 보고 두 번째 전지를 뒤집어 비교해요.';
  if(r.passed)return m.lesson;
  if(d.switches.some(v=>!v))return '스위치가 꺼져 있어요. 관찰을 마쳤다면 스위치를 켜고 다시 살펴봐요.';
  if(m.material&&d.material!=='copper')return '지금 재료는 전기가 통하지 않아요. 선을 그대로 두고 다른 재료로 바꾸어 비교해요.';
  if(s.brightness.some(v=>v<.001)){
    const loose=terminals(m).filter(id=>!d.wires.some(w=>w.includes(id)));
    if(loose.length){const label=id=>id==='p'?'전지 ＋':id==='n'?'전지 −':id[0]==='s'?'스위치 '+id[1]:id[0]==='t'?'스위치 B'+id[1]:id[0]==='m'?'재료 '+id[1]:'전구 '+(m.bulbs>1?id.toUpperCase():id[1]);return '전선이 없는 점: '+loose.map(label).join(', ')+'. 이 점에서 이어질 길을 찾아요.';}
    const names=s.brightness.map((v,j)=>v<.001?String.fromCharCode(65+j):'').filter(Boolean).join('·');
    return '전구 '+names+'가 꺼져 있어요. 두 연결점에서 전지까지 이어지는 길이 모두 있는지 살펴봐요.';
  }
  if(m.kind==='cells'&&d.cells===1)return '전지 한 개로 켜졌어요. 이제 하나 더 놓아 밝기가 어떻게 달라지는지 봐요.';
  if(m.kind==='both'||m.kind==='either')return '불은 켜졌지만 작동 조건이 달라요. 네 가지 상태 시험에서 목표와 다른 경우를 찾아요.';
  if(m.kind==='series')return '불은 켜졌어요. ‘전구 A 빼서 시험’을 눌러 B도 꺼지는지 보세요. 계속 켜지면 전기가 갈 수 있는 다른 길이 있어요.';
  if(m.kind==='parallel'||m.kind==='final')return '불은 켜졌어요. 전구를 하나씩 빼서 시험해요. 남은 전구의 밝기가 달라지면 갈래 사이의 전선을 살펴봐요.';
  if(m.kind==='independent')return '두 불은 켜졌지만 따로 움직이지 않아요. A만 켰을 때와 B만 켰을 때를 비교해요.';
  return '불은 켜졌지만 스위치로 끌 수 없어요. 스위치를 건너뛴 전선을 찾아요.';
}

// Previews never mutate or save the child's wiring; each step is explicitly closed.
export function experiments(i,m,d){
  const base=simulate(m,d),item=(label,result)=>({label,result});
  if(m.kind==='both'||m.kind==='either')return [[true,true],[true,false],[false,true],[false,false]].map(switches=>({...item('A '+(switches[0]?'닫힘':'열림')+' · B '+(switches[1]?'닫힘':'열림'),simulate(m,d,{switches})),switches}));
  if(i===6)return [{...item('전지 한 개 · 스위치 닫힘',simulate(m,{...d,cells:1})),cells:1},{...item('두 개 · 스위치 닫힘',base),cells:2},{...item('두 개 · 스위치 열림',simulate(m,d,{switches:[false]})),switches:[false],cells:2}];
  if(m.kind==='cells')return [{...item('같은 회로 · 전지 한 개',simulate(m,{...d,cells:1})),cells:1},{...item('지금 회로 · 전지 '+(d.cells===1?'한':'두')+' 개',base),cells:d.cells}];
  if(m.material)return ['plastic','rubber','copper'].map(material=>({...item(({plastic:'플라스틱',rubber:'고무',copper:'구리'})[material]+'로 비교',simulate(m,{...d,material})),material}));
  if(m.kind==='independent')return [true,false].map(a=>({...item('스위치 '+(a?'A':'B')+'만 켬',simulate(m,d,{switches:[a,!a]})),switches:[a,!a]}));
  if(m.bulbs>1)return Array.from({length:m.bulbs},(_,j)=>({...item('전구 '+String.fromCharCode(65+j)+'를 빼면',simulate(m,d,{removed:[String.fromCharCode(97+j)]})),removed:[String.fromCharCode(97+j)]}));
  return [{...item('스위치를 끄면',simulate(m,d,{switches:d.switches.map(()=>false)})),switches:d.switches.map(()=>false)}];
}

// Compare with the child's unchanged circuit, not an assumed correct answer.
export function observationText(m,d,step){
  if(step.result.short)return '전구를 건너뛰는 지름길이 남아 있어요.';
  const base=simulate(m,d);
  return step.result.brightness.map((value,i)=>{
    const name='전구 '+String.fromCharCode(65+i);
    if(step.removed?.includes(String.fromCharCode(97+i)))return name+': 빼 놓음';
    if(value<.001)return name+': 꺼짐';
    if(step.removed?.length&&base.brightness[i]>.001){const delta=value-base.brightness[i];return name+': '+(Math.abs(delta)<.001?'밝기 그대로':delta>0?'더 밝아짐':'더 어두워짐');}
    return name+': 켜짐';
  }).join(' · ');
}

export const OBJECTIVES=[
 {stage:'연결 연습',targets:['전선 한 가닥 연결 → 전구 켜짐']},
 {stage:'스위치 연습',targets:['스위치 닫기 → 전구 켜짐']},
 {stage:'한 바퀴 연결',targets:['스위치 켜기 → 불 켜짐','스위치 끄기 → 불 꺼짐']},
 {stage:'재료 탐구',targets:['재료를 지나는 길 → 불 켜짐']},
 {stage:'원인 구별',targets:['원인 찾기 → 고친 뒤 불 켜기']},
 {stage:'밝기 비교',targets:['전지 1개보다 2개일 때 더 밝게']},
 {stage:'회로 도전 · 복합 고장',targets:['두 전지로 밝게 · 스위치를 열면 꺼짐']},
 {stage:'회로 도전 · 배운 원리 응용',targets:['A·B 모두 닫힘 → 켜짐','하나라도 열림 → 꺼짐']},
 {stage:'회로 도전 · 다른 길 설계',targets:['하나만 닫혀도 → 켜짐','둘 다 열림 → 꺼짐']},
 {stage:'회로 도전 · 종합 진단',targets:['전지 2개로 밝게 · 구리를 지나는 길','A·B 모두 닫힘 → 켜짐 / 하나라도 열림 → 꺼짐']}
];
