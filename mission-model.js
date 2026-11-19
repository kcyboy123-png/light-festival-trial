import {MISSIONS as OLD,restoreTenProgress as restoreOld} from './legacy-mission-model.js?v=trial-20261119-11';
import {LABS,freshLab,validLab,labPassed,hasEvidence} from './inquiry-model.js?v=trial-20261119-11';
import {restoreTenProgress as restorePrevious} from './legacy-curriculum-model.js?v=trial-20261119-11';
export const TEN_SAVE_KEY='changyong-light-festival-ten-v2';

export const MISSIONS=[...OLD.slice(0,6),
 {title:'꽃잎 분수',task:'두 고장을 고쳐 밝게 켜고, 스위치로 끌 수 있게 해요.',bulbs:1,switches:1,kind:'cells',cells:2,flipped:true,challenge:true,wires:[['p','s1'],['s2','a1'],['a2','n'],['s1','s2']],lesson:'불이 켜지는 것과 스위치로 끌 수 있는 것은 따로 확인해야 해요.'},
 {title:'분수 정원',task:'A와 B를 모두 닫았을 때만 켜지는 회로를 만들어요.',bulbs:1,switches:2,kind:'both',challenge:true,wires:[['a2','n']],lesson:'두 스위치를 모두 지나는 한 길에서는 하나라도 열면 전기가 흐르지 않아요.'},
 {title:'회전목마 꽃길',task:'A와 B 중 어느 하나만 닫아도 켜지게 만들어요.',bulbs:1,switches:2,kind:'either',challenge:true,wires:[['p','s1'],['s2','t1'],['t2','a1'],['a2','n']],lesson:'스위치마다 따로 이어진 길이 있으면 한쪽을 열어도 다른 길로 흐를 수 있어요.'},
 {title:'회전목마 광장',task:'밝기·재료·두 스위치를 함께 살펴 안전 회로를 고쳐요.',bulbs:1,switches:2,kind:'both',cells:2,flipped:true,material:true,challenge:true,wires:[['p','s1'],['s2','t1'],['t2','m1'],['m2','a1'],['a2','n'],['s1','t2']],lesson:'전지 방향과 재료를 고친 뒤에도 두 스위치의 네 가지 상태를 모두 확인해야 해요.'}
];
MISSIONS[4]={...OLD[3],title:'별빛 정원',task:'재료와 전선을 살펴 두 고장을 고쳐요.',wires:[['p','m1'],['a2','n']],lesson:'재료를 바꿔도 안 켜지면 다른 끊긴 곳도 확인해요.'};
export function checkCompletion(i,d){return checkMission(MISSIONS[i],d).passed&&hasEvidence(i,d);}


export function terminals(m){return ['p','n',...Array.from({length:m.bulbs},(_,i)=>[String.fromCharCode(97+i)+'1',String.fromCharCode(97+i)+'2']).flat(),...(m.switches?['s1','s2']:[]),...(m.switches===2?['t1','t2']:[]),...(m.material?['m1','m2']:[])];}
export function freshDraft(m){if(LABS.includes(m))return freshLab();return {wires:m.wires.map(w=>[...w]),switches:Array.from({length:m.switches},()=>!m.open),cells:m.cells||1,flipped:!!m.flipped,material:'plastic'};}
export function validDraft(m,d){
  if(LABS.includes(m))return validLab(MISSIONS.indexOf(m),d);
  if(!d||!Array.isArray(d.wires)||d.wires.length>16||!Array.isArray(d.switches)||d.switches.length!==m.switches||d.switches.some(v=>typeof v!=='boolean'))return false;
  if(![1,2].includes(d.cells)||(!m.cellChoice&&d.cells!==(m.cells||1))||typeof d.flipped!=='boolean'||!['copper','plastic','rubber'].includes(d.material))return false;
  const ids=terminals(m),seen=new Set();
  return d.wires.every(w=>{if(!Array.isArray(w)||w.length!==2||w[0]===w[1]||w.some(n=>!ids.includes(n)))return false;const key=[...w].sort().join(':');if(seen.has(key))return false;seen.add(key);return true;});
}

// Ideal equal cells and equal-resistance lamps: solve actual connectivity, not a saved answer pattern.
export function simulate(m,d,{switches=d.switches,removed=[]}={}){
  const ids=terminals(m),parent=Object.fromEntries(ids.map(x=>[x,x]));
  const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));
  const join=(a,b)=>{parent[find(a)]=find(b);};
  for(const [a,b]of d.wires)join(a,b);
  if(switches[0])join('s1','s2');if(switches[1])join('t1','t2');
  if(m.material&&d.material==='copper')join('m1','m2');
  const p=find('p'),n=find('n'),voltage=d.cells===1?1.5:d.flipped?0:3;
  const lamps=Array.from({length:m.bulbs},(_,i)=>({id:String.fromCharCode(97+i),a:find(String.fromCharCode(97+i)+'1'),b:find(String.fromCharCode(97+i)+'2')}));
  const dark={short:false,voltage,brightness:lamps.map(()=>0)};
  if(p===n)return {...dark,short:true};if(voltage===0)return dark;
  const resistors=lamps.filter(l=>!removed.includes(l.id)&&l.a!==l.b),neighbors=new Map();
  for(const l of resistors){if(!neighbors.has(l.a))neighbors.set(l.a,[]);if(!neighbors.has(l.b))neighbors.set(l.b,[]);neighbors.get(l.a).push(l.b);neighbors.get(l.b).push(l.a);}
  const live=new Set([p,n]),queue=[p,n];for(let i=0;i<queue.length;i++)for(const v of neighbors.get(queue[i])||[])if(!live.has(v)){live.add(v);queue.push(v);}
  const unknown=[...live].filter(v=>v!==p&&v!==n),potentials={[p]:voltage,[n]:0},matrix=unknown.map(v=>{
    const row=Array(unknown.length+1).fill(0);row[unknown.indexOf(v)]=(neighbors.get(v)||[]).length;
    for(const next of neighbors.get(v)||[]){const j=unknown.indexOf(next);if(j>=0)row[j]--;else row[unknown.length]+=potentials[next];}return row;
  });
  for(let col=0;col<unknown.length;col++){
    let pivot=col;for(let j=col+1;j<unknown.length;j++)if(Math.abs(matrix[j][col])>Math.abs(matrix[pivot][col]))pivot=j;
    [matrix[col],matrix[pivot]]=[matrix[pivot],matrix[col]];const divisor=matrix[col][col];if(Math.abs(divisor)<1e-10)return dark;
    for(let k=col;k<=unknown.length;k++)matrix[col][k]/=divisor;
    for(let row=0;row<unknown.length;row++)if(row!==col){const factor=matrix[row][col];for(let k=col;k<=unknown.length;k++)matrix[row][k]-=factor*matrix[col][k];}
  }
  unknown.forEach((v,i)=>potentials[v]=matrix[i][unknown.length]);
  return {short:false,voltage,brightness:lamps.map(l=>removed.includes(l.id)?0:Math.min(1,((potentials[l.a]??0)-(potentials[l.b]??0))**2/9))};
}

export function checkMission(m,d){
  if(LABS.includes(m))return {passed:labPassed(MISSIONS.indexOf(m),d),checks:[],result:{brightness:[],short:false,voltage:0}};
  if(!validDraft(m,d))return {passed:false,checks:[],message:'회로를 다시 확인해 주세요.',result:{brightness:[],short:false,voltage:0}};
  const result=simulate(m,d),all=result.brightness.every(v=>v>.01),checks=[{label:m.bulbs===1?'전구 켜짐':'모든 전구 켜짐',ok:all&&!result.short}];
  if(m.switches===1){const off=simulate(m,d,{switches:[false]});checks.push({label:'스위치를 열면 모두 꺼짐',ok:!off.short&&off.brightness.every(v=>v<.001)});}
  if(m.material)checks.push({label:'전기가 통하는 재료를 지나는 회로',ok:d.material==='copper'&&simulate(m,{...d,material:'plastic'}).brightness.every(v=>v<.001)});
  if(m.kind==='cells'||m.kind==='final')checks.push({label:'전지 2개를 바른 방향으로',ok:d.cells===2&&!d.flipped});
  if(m.challenge&&m.cells===2&&m.kind!=='cells')checks.push({label:'전지 2개를 바른 방향으로',ok:d.cells===2&&!d.flipped});
  if(m.kind==='both'||m.kind==='either')for(const switches of [[true,true],[true,false],[false,true],[false,false]]){
    const r=simulate(m,d,{switches}),expected=m.kind==='both'?switches.every(Boolean):switches.some(Boolean);
    checks.push({label:'A '+(switches[0]?'닫힘':'열림')+' · B '+(switches[1]?'닫힘':'열림')+' → '+(expected?'켜짐':'꺼짐'),ok:!r.short&&(expected?r.brightness[0]>.01:r.brightness[0]<.001)});
  }
  if(m.kind==='series')checks.push({label:'하나를 빼면 모두 꺼짐',ok:all&&['a','b'].every(id=>simulate(m,d,{removed:[id]}).brightness.every(v=>v<.001))});
  if(m.kind==='parallel'||m.kind==='final')checks.push({label:'하나를 빼도 나머지 밝기 유지',ok:all&&result.brightness.every((_,i)=>{const test=simulate(m,d,{removed:[String.fromCharCode(97+i)]});return !test.short&&test.brightness.every((v,j)=>i===j||Math.abs(v-result.brightness[j])<.001);})});
  if(m.kind==='final')checks.push({label:'세 전구 모두 밝게 켜짐',ok:result.brightness.every(v=>v>.99)});
  if(m.kind==='independent')for(let i=0;i<2;i++){const test=simulate(m,d,{switches:[i===0,i===1]});checks.push({label:`스위치 ${i===0?'A':'B'}는 전구 ${i===0?'A':'B'}만 켬`,ok:!test.short&&test.brightness[i]>.01&&test.brightness[1-i]<.001});}
  const passed=checks.every(c=>c.ok);
  let message=passed?m.lesson:result.short?'전지의 두 극이 전구를 거치지 않고 이어졌어요. 그 선부터 고쳐요.':result.voltage===0?'전지 두 개가 서로 반대 방향이에요. 만나는 극을 살펴보세요.':!all?'전구가 모두 켜지지 않았어요. 끊긴 곳과 돌아오는 길을 살펴보세요.':'불은 켜졌어요. 아직 통과하지 못한 조건을 확인해요.';
  return {passed,checks,message,result};
}

export const freshTenProgress=()=>({version:4,completed:0,legacyCompleted:0,drafts:MISSIONS.map(freshDraft)});
export function restoreTenProgress(raw){
  if(typeof raw!=='string'||raw.length>60000)return null;
  try{
    const s=JSON.parse(raw);
    if(s?.version===2||s?.version===3){const old=restorePrevious(raw);if(!old)return null;
      const next=freshTenProgress();next.legacyCompleted=Math.max(old.completed,old.legacyCompleted);next.completed=Math.min(old.completed,6);
      for(let i=0;i<6;i++)next.drafts[i]=old.drafts[i];return next;
    }
    if(s?.version!==4||!Number.isInteger(s.completed)||s.completed<0||s.completed>10||!Number.isInteger(s.legacyCompleted)||s.legacyCompleted<0||s.legacyCompleted>10||!Array.isArray(s.drafts)||s.drafts.length!==10)return null;
    if(s.drafts.some((d,i)=>!validDraft(MISSIONS[i],d)||(i<s.completed&&!(i<4&&i<s.legacyCompleted?checkMission(MISSIONS[i],d).passed:checkCompletion(i,d)))))return null;
    return {version:4,completed:s.completed,legacyCompleted:s.legacyCompleted,drafts:structuredClone(s.drafts)};
  }catch{return null;}
}

export function shortWireIndices(m,d){
  const edges=terminals(m).map(id=>[id,[]]),graph=new Map(edges);
  const add=(a,b,i)=>{graph.get(a).push({to:b,i});graph.get(b).push({to:a,i});};
  d.wires.forEach(([a,b],i)=>add(a,b,i));
  if(d.switches[0])add('s1','s2',-1);if(d.switches[1])add('t1','t2',-1);
  if(m.material&&d.material==='copper')add('m1','m2',-1);
  const queue=[{id:'p',path:[]}],seen=new Set(['p']);
  for(let k=0;k<queue.length;k++){const node=queue[k];if(node.id==='n')return node.path;
    for(const edge of graph.get(node.id))if(!seen.has(edge.to)){seen.add(edge.to);queue.push({id:edge.to,path:edge.i<0?node.path:[...node.path,edge.i]});}}
  return [];
}
