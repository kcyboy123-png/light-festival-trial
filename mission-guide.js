import {simulate,checkMission} from './mission-model.js?v=trial-20261119-1';

// Situation first; hints reveal the idea before naming a possible repair.
export const BRIEFS=[
  {situation:'꽃길이 어두워서 발밑이 보이지 않아요.',goal:'끊긴 전선 한 가닥을 이어 가로등을 켜 주세요.',try:'① 전지 ＋ → ② 전구 왼쪽 점',reward:'발밑의 꽃길이 환해졌어요!',hints:['빛나는 큰 원 두 개를 찾아요.','①을 누른 다음 ②를 누르면 전선이 생겨요.','전지 ＋와 전구 왼쪽 점을 이어요. 이미 있는 전선은 그대로 두어요.']},
  {situation:'꽃터널의 전선은 이어져 있는데 불이 꺼져 있어요.',goal:'스위치를 켜서 꽃터널을 밝혀 주세요.',try:'비스듬한 스위치 막대를 눌러요.',reward:'꽃터널에 따뜻한 불빛이 돌아왔어요!',hints:['전선이 아니라 스위치 안을 살펴봐요.','막대가 떨어져 있으면 전기가 지나갈 수 없어요.','스위치 그림을 한 번 눌러 두 금속점을 붙여요.']},
  {situation:'다리 불을 켜고 끌 스위치를 새로 달아야 해요.',goal:'불도 켜지고, 스위치로 끌 수도 있는 길을 만들어 주세요.',try:'전지·스위치·전구를 전선으로 이어요.',probe:'스위치로 꺼 보기',reward:'이제 다리 입구의 불을 켜고 끌 수 있어요!',hints:['전지의 두 끝 사이에 전구와 스위치가 모두 있어야 해요.','불이 켜졌다면 스위치를 꺼 봐요. 그대로 켜져 있으면 스위치를 건너뛴 길이 있어요.','전지 ＋ → 스위치 1, 스위치 2 → 전구 1, 전구 2 → 전지 −를 이어 볼 수 있어요.']},
  {situation:'정원의 연결 부품이 빠졌어요. 어떤 재료로 채울까요?',goal:'전기가 통하는 재료를 골라, 재료를 지나는 전구의 불을 켜 주세요.',try:'재료를 고르고 비어 있는 연결점을 이어요.',probe:'재료 바꿔 비교하기',reward:'전기가 통하는 재료로 정원이 살아났어요!',hints:['전선만 이어도 재료가 전기를 막으면 불이 켜지지 않아요.','배선은 그대로 두고 재료만 바꾸어 비교해요.','구리를 고르고 재료 2와 전구 1을 이어요. 전기는 재료를 지나야 해요.']},
  {situation:'별빛 정원의 전선이 엉켜 전구를 건너뛰는 지름길이 생겼어요.',goal:'위험한 지름길을 없애고, 스위치로 켜고 끌 수 있게 고쳐 주세요.',try:'빨간 전선의 양 끝을 먼저 살펴봐요.',probe:'스위치로 꺼 보기',reward:'잘못된 지름길을 고쳐 별빛 정원이 깨어났어요!',hints:['전구를 거치지 않고 전지 두 끝으로 돌아오는 길을 찾아요.','빨간 선을 지운 다음, 스위치와 전구 사이에 끊긴 곳이 남았는지 봐요.','전지 ＋ ↔ 전지 − 선을 지우고 스위치 2와 전구 1을 이어요. 마지막으로 스위치를 꺼 시험해요.']},
  {situation:'분수 앞 불빛이 약해 물길이 잘 보이지 않아요.',goal:'같은 전구를 전지 한 개일 때보다 밝게 켜 주세요.',try:'우선 전지 한 개로 켜고, 두 개일 때와 비교해요.',probe:'전지 한 개와 비교',reward:'더 밝은 불빛이 분수의 물길을 비춰요!',hints:['먼저 끊긴 곳을 이어 전지 한 개로 불을 켜요.','전지를 하나 더 놓아 보세요. 꺼진다면 두 전지가 만나는 극을 살펴봐요.','스위치 2 → 전구 1을 잇고, 전지 두 개 사이에 ＋와 −가 만나게 뒤집어요.']},
  {situation:'꽃잎 분수의 두 등은 하나가 빠지면 함께 멈춰야 해요.',goal:'A와 B를 모두 켜고, 하나를 빼면 둘 다 꺼지게 만들어 주세요.',try:'A에서 전지로 돌아가는 길에 B를 넣어 봐요.',probe:'전구 A 빼서 시험',reward:'두 등이 한 길로 이어져 꽃잎 분수가 깨어났어요!',hints:['지금은 A만 연결돼 있어요. 전기가 A와 B를 차례로 지나게 해요.','두 전구가 켜지면 A를 빼 보세요. B도 꺼져야 해요.','A2 ↔ 전지 −를 지우고 A2 → B1, B2 → 전지 −를 이어 볼 수 있어요.']},
  {situation:'정원 등 하나를 수리할 때 다른 등까지 꺼지면 곤란해요.',goal:'A를 빼도 B가, B를 빼도 A가 같은 밝기로 켜지게 해 주세요.',try:'먼저 전구 하나를 빼 보고 지금의 문제를 찾아요.',probe:'전구 A·B 번갈아 빼기',reward:'등 하나를 고쳐도 정원은 계속 밝아요!',hints:['지금 회로에서 A를 빼면 B는 어떻게 될까요?','각 전구가 다른 전구를 거치지 않고 전지로 돌아갈 길이 필요해요.','A2 ↔ B1을 지우고 A2 → 전지 −, 스위치 2 → B1을 이으면 두 갈래가 돼요.']},
  {situation:'꽃길 A와 B를 따로 켜야 하는데 스위치 A가 두 등을 함께 움직여요.',goal:'스위치 A는 A만, 스위치 B는 B만 켜고 끄게 고쳐 주세요.',try:'두 스위치를 하나씩 눌러 어느 등이 반응하는지 봐요.',probe:'A·B 스위치 따로 시험',reward:'꽃길의 두 불빛을 따로 조절할 수 있어요!',hints:['B로 가는 전선이 어느 스위치를 지나고 있나요?','두 갈래에 스위치가 하나씩 있어야 해요. 마지막에는 둘 다 켜 두어요.','스위치 A2 ↔ 전구 B1을 지우고 전지 ＋ → 스위치 B1, 스위치 B2 → 전구 B1을 이어요.']},
  {situation:'마지막 광장에는 전지 방향과 전선 고장이 함께 남아 있어요.',goal:'세 등을 밝게 켜 주세요. 하나를 빼도 나머지는 밝게, 스위치로는 모두 꺼지게!',try:'지름길 → 전지 방향 → 세 전구의 길 순서로 점검해요.',probe:'세 전구 하나씩 빼기',reward:'열 곳의 빛이 모여 회전목마가 깨어났어요!',hints:['한꺼번에 고치지 않아도 돼요. 빨간 지름길부터 없애요.','전지 두 개가 만나는 극을 살펴보고, 불이 안 켜지는 전구의 돌아오는 길을 찾아요.','각 전구는 스위치 뒤에서 갈라져 전지 −로 돌아와요. A와 B가 한 줄로 이어진 선도 바꿔야 해요.']}
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
    const names=s.brightness.map((v,j)=>v<.001?String.fromCharCode(65+j):'').filter(Boolean).join('·');
    return '전구 '+names+'가 꺼져 있어요. 두 연결점에서 전지까지 이어지는 길이 모두 있는지 살펴봐요.';
  }
  if(m.kind==='cells'&&d.cells===1)return '전지 한 개로 켜졌어요. 이제 하나 더 놓아 밝기가 어떻게 달라지는지 봐요.';
  if(m.kind==='series')return '불은 켜졌어요. A를 빼도 B가 켜져 있다면 전기가 갈 수 있는 다른 길이 있어요.';
  if(m.kind==='parallel'||m.kind==='final')return '불은 켜졌어요. 하나를 뺐을 때 다른 불까지 꺼지거나 어두워지는지 시험해 봐요.';
  if(m.kind==='independent')return '두 불은 켜졌지만 따로 움직이지 않아요. A만 켰을 때와 B만 켰을 때를 비교해요.';
  return '불은 켜졌지만 스위치로 끌 수 없어요. 스위치를 건너뛴 전선을 찾아요.';
}

// Previews never mutate or save the child's wiring; each step is explicitly closed.
export function experiments(i,m,d){
  const base=simulate(m,d),item=(label,result)=>({label,result});
  if(m.kind==='cells')return [{...item('같은 회로 · 전지 한 개',simulate(m,{...d,cells:1})),cells:1},{...item('지금 회로 · 전지 '+(d.cells===1?'한':'두')+' 개',base),cells:d.cells}];
  if(m.material)return ['plastic','rubber','copper'].map(material=>({...item(({plastic:'플라스틱',rubber:'고무',copper:'구리'})[material]+'로 비교',simulate(m,{...d,material})),material}));
  if(m.kind==='independent')return [true,false].map(a=>({...item('스위치 '+(a?'A':'B')+'만 켬',simulate(m,d,{switches:[a,!a]})),switches:[a,!a]}));
  if(m.bulbs>1)return Array.from({length:m.bulbs},(_,j)=>({...item('전구 '+String.fromCharCode(65+j)+'를 빼면',simulate(m,d,{removed:[String.fromCharCode(97+j)]})),removed:[String.fromCharCode(97+j)]}));
  return [{...item('스위치를 끄면',simulate(m,d,{switches:d.switches.map(()=>false)})),switches:d.switches.map(()=>false)}];
}
