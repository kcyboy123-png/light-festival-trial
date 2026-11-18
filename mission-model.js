export const TEN_SAVE_KEY='changyong-light-festival-ten-v2';

export const MISSIONS=[
  {title:'꽃길 가로등',task:'끊긴 전선 한 가닥을 이어 전구를 켜요.',bulbs:1,switches:0,kind:'light',wires:[['a2','n']],hint:'전지의 두 끝과 전구의 두 연결점이 한 바퀴 이어져야 해요.',lesson:'전선이 끊김 없이 이어지면 전구에 불이 켜져요.'},
  {title:'꽃터널',task:'스위치를 닫아 꽃터널에 불을 켜요.',bulbs:1,switches:1,kind:'switch',wires:[['p','s1'],['s2','a1'],['a2','n']],open:true,hint:'스위치 막대가 두 금속점을 이어 주는지 보세요.',lesson:'스위치를 닫으면 이어지고, 열면 전기가 흐르지 않아요.'},
  {title:'다리 입구',task:'스위치로 켜고 끌 수 있는 회로를 만들어요.',bulbs:1,switches:1,kind:'switch',wires:[],hint:'전지 → 스위치 → 전구 → 전지로 돌아오는 길을 생각해요.',lesson:'전구가 켜져도 스위치를 거치지 않으면 스위치로 끌 수 없어요.'},
  {title:'다리 정원',task:'전기가 통하는 재료를 고르고, 끊긴 곳을 이어요.',bulbs:1,switches:0,material:true,kind:'material',wires:[['p','m1'],['a2','n']],hint:'구리·플라스틱·고무 중 전기가 통하는 재료는 무엇일까요?',lesson:'구리처럼 전기가 잘 통하는 재료를 도체라고 해요.'},
  {title:'별빛 정원',task:'전구를 건너뛰는 전선을 고치고, 스위치도 작동하게 해요.',bulbs:1,switches:1,kind:'switch',wires:[['p','s1'],['a2','n'],['p','n']],hint:'전지의 두 극이 전구 없이 바로 이어져 있지 않나요?',lesson:'전구를 거치지 않고 전지의 두 극을 바로 잇는 합선은 피해야 해요.'},
  {title:'분수 서쪽',task:'전지 두 개를 직렬로 연결해 한 개일 때보다 밝게 켜요.',bulbs:1,switches:1,kind:'cells',cellChoice:true,flipped:true,wires:[['p','s1'],['a2','n']],hint:'전지 두 개 사이에는 서로 다른 극이 만나야 해요. 스위치를 지나는 길도 이어요.',lesson:'같은 전지 두 개를 직렬로 바르게 연결하면 같은 전구가 더 밝아져요.'},
  {title:'꽃잎 분수',task:'전구 두 개를 한 줄로 이어요. 하나를 빼면 둘 다 꺼져야 해요.',bulbs:2,switches:1,kind:'series',cells:2,wires:[['p','s1'],['s2','a1'],['a2','n']],hint:'전기가 A를 지난 뒤 B도 지나야 해요. 돌아가는 길이 하나인가요?',lesson:'전구를 직렬로 연결하면 길이 하나라서 하나를 빼면 모두 꺼져요.'},
  {title:'분수 정원',task:'전구 하나를 빼도 다른 전구는 같은 밝기로 켜지게 해요.',bulbs:2,switches:1,kind:'parallel',wires:[['p','s1'],['s2','a1'],['a2','b1'],['b2','n']],hint:'각 전구가 전지의 두 극으로 이어지는 자기 길을 갖게 해요.',lesson:'병렬 연결에서는 한쪽 길이 끊겨도 다른 쪽 길로 전기가 흘러요.'},
  {title:'회전목마 꽃길',task:'스위치 A는 전구 A만, 스위치 B는 전구 B만 켜게 해요.',bulbs:2,switches:2,kind:'independent',wires:[['p','s1'],['s2','a1'],['a2','n'],['s2','b1'],['b2','n']],hint:'갈라진 두 길에 스위치를 하나씩 놓아야 서로 따로 켜고 끌 수 있어요.',lesson:'각 갈래에 스위치를 두면 전구를 각각 제어할 수 있어요.'},
  {title:'회전목마 광장',task:'세 전구를 모두 밝게! 하나를 빼도 나머지 밝기는 같아야 해요.',bulbs:3,switches:1,kind:'final',cells:2,flipped:true,wires:[['p','s1'],['s2','a1'],['a2','b1'],['b2','n'],['s2','c1'],['p','n']],hint:'전지 방향, 전구를 건너뛴 선, 각 전구의 돌아오는 길을 차례로 점검해요.',lesson:'전지의 직렬 연결, 전구의 병렬 연결, 스위치를 함께 사용해 도시를 밝혔어요.'}
];

export function terminals(m){return ['p','n',...Array.from({length:m.bulbs},(_,i)=>[String.fromCharCode(97+i)+'1',String.fromCharCode(97+i)+'2']).flat(),...(m.switches?['s1','s2']:[]),...(m.switches===2?['t1','t2']:[]),...(m.material?['m1','m2']:[])];}
export function freshDraft(m){return {wires:m.wires.map(w=>[...w]),switches:Array.from({length:m.switches},()=>!m.open),cells:m.cells||1,flipped:!!m.flipped,material:'plastic'};}
export function validDraft(m,d){
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
  if(!validDraft(m,d))return {passed:false,checks:[],message:'회로를 다시 확인해 주세요.',result:{brightness:[],short:false,voltage:0}};
  const result=simulate(m,d),all=result.brightness.every(v=>v>.01),checks=[{label:m.bulbs===1?'전구 켜짐':'모든 전구 켜짐',ok:all&&!result.short}];
  if(m.switches===1){const off=simulate(m,d,{switches:[false]});checks.push({label:'스위치를 열면 모두 꺼짐',ok:!off.short&&off.brightness.every(v=>v<.001)});}
  if(m.material)checks.push({label:'전기가 통하는 재료를 지나는 회로',ok:d.material==='copper'&&simulate(m,{...d,material:'plastic'}).brightness.every(v=>v<.001)});
  if(m.kind==='cells'||m.kind==='final')checks.push({label:'전지 2개를 바른 방향으로',ok:d.cells===2&&!d.flipped});
  if(m.kind==='series')checks.push({label:'하나를 빼면 모두 꺼짐',ok:all&&['a','b'].every(id=>simulate(m,d,{removed:[id]}).brightness.every(v=>v<.001))});
  if(m.kind==='parallel'||m.kind==='final')checks.push({label:'하나를 빼도 나머지 밝기 유지',ok:all&&result.brightness.every((_,i)=>{const test=simulate(m,d,{removed:[String.fromCharCode(97+i)]});return !test.short&&test.brightness.every((v,j)=>i===j||Math.abs(v-result.brightness[j])<.001);})});
  if(m.kind==='final')checks.push({label:'세 전구 모두 밝게 켜짐',ok:result.brightness.every(v=>v>.99)});
  if(m.kind==='independent')for(let i=0;i<2;i++){const test=simulate(m,d,{switches:[i===0,i===1]});checks.push({label:`스위치 ${i===0?'A':'B'}는 전구 ${i===0?'A':'B'}만 켬`,ok:!test.short&&test.brightness[i]>.01&&test.brightness[1-i]<.001});}
  const passed=checks.every(c=>c.ok);
  let message=passed?m.lesson:result.short?'전지의 두 극이 전구를 거치지 않고 이어졌어요. 그 선부터 고쳐요.':result.voltage===0?'전지 두 개가 서로 반대 방향이에요. 만나는 극을 살펴보세요.':!all?'전구가 모두 켜지지 않았어요. 끊긴 곳과 돌아오는 길을 살펴보세요.':'불은 켜졌어요. 아직 통과하지 못한 조건을 확인해요.';
  return {passed,checks,message,result};
}

export const freshTenProgress=()=>({version:2,completed:0,drafts:MISSIONS.map(freshDraft)});
export function restoreTenProgress(raw){
  if(typeof raw!=='string'||raw.length>30000)return null;
  try{const s=JSON.parse(raw);if(s?.version!==2||!Number.isInteger(s.completed)||s.completed<0||s.completed>10||!Array.isArray(s.drafts)||s.drafts.length!==10)return null;
    if(s.drafts.some((d,i)=>!validDraft(MISSIONS[i],d)||(i<s.completed&&!checkMission(MISSIONS[i],d).passed)))return null;
    return {version:2,completed:s.completed,drafts:s.drafts.map((d,i)=>({wires:d.wires.map(w=>[...w]),switches:[...d.switches],cells:d.cells,flipped:d.flipped,material:d.material}))};
  }catch{return null;}
}
