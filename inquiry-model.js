// Curriculum: supplied science pp.60–75, workbook pp.36–51. No bulb series/parallel requirement.
export const LABS=[
 {title:'꽃잎 분수',kind:'magnet',task:'철 장식을 들어 바구니에 내려놓아요.',lesson:'전자석은 전기가 흐를 때 철을 붙잡고, 끊으면 놓을 수 있어요.'},
 {title:'분수 정원',kind:'strength',task:'같은 전자석으로 비교하고, 무거운 장식을 들어요.',lesson:'같은 전자석에 전지를 두 개 직렬연결하면 세기가 더 세져요.'},
 {title:'회전목마 꽃길',kind:'poles',task:'붙어 오는 자석 자동차를 반대쪽으로 보내요.',lesson:'전지의 연결 방향을 바꾸면 전자석의 양쪽 극이 바뀌어요.'},
 {title:'회전목마 광장',kind:'safe',task:'사람이 있는 곳은 밝게, 빈 곳은 알뜰하고 안전하게.',lesson:'필요한 곳을 밝히고 낭비와 위험을 줄이면 안전한 축제가 돼요.'}
];
export const CIRCUIT_QUESTIONS={
 2:{predict:'지금 회로에서 스위치를 열면?',predictions:['불이 꺼질 것 같아요','계속 켜질 것 같아요'],ask:'스위치를 열었을 때 불이 꺼진 까닭은?',choices:[['gap','전기가 지나는 길이 끊어져서'],['used','전지가 한 번 만에 다 닳아서'],['light','전구가 다른 종류로 바뀌어서']],answer:'gap',hint:'스위치의 두 금속점 사이를 살펴보세요.'},
 3:{predict:'배선은 그대로, 재료만 고무로 바꾸면?',predictions:['계속 켜질 것 같아요','불이 꺼질 것 같아요'],ask:'비교 결과와 맞는 재료 묶음은?',choices:[['metal','구리만 통하고, 고무·플라스틱은 잘 안 통해요'],['all','세 재료 모두 전기가 잘 통해요'],['rubber','고무만 통하고, 구리는 잘 안 통해요']],answer:'metal',hint:'같은 배선에서 재료를 바꿨을 때의 불빛을 비교해요.'},
 4:{predict:'처음 고장 난 회로에서 재료만 구리로 바꾸면?',predictions:['불이 켜질 것 같아요','아직 꺼져 있을 것 같아요'],ask:'구리로 바꿔도 꺼졌다가, 끊긴 선까지 잇자 켜졌어요. 고장은?',choices:[['both','안 통하는 재료와 끊긴 선이 함께 있었어요'],['only','재료만 문제였고 전선은 정상이었어요'],['battery','전지를 더 넣어야만 켤 수 있었어요']],answer:'both',hint:'재료를 바꾼 뒤와 선까지 고친 뒤의 결과가 달랐어요.'},
 5:{outcome:{ask:'두 회로를 함께 켜 보니 어느 쪽이 밝았나요?',choices:[['two','전지 두 개를 직렬연결한 쪽'],['one','전지 한 개를 연결한 쪽'],['equal','두 쪽의 밝기가 같았어요']],answer:'two',hint:'같은 전구 두 개의 빛을 나란히 비교해요.'},predict:'같은 전구에 전지 두 개를 바르게 직렬연결하면?',predictions:['한 개일 때보다 밝을 것 같아요','밝기가 같을 것 같아요','더 어두울 것 같아요'],ask:'전지 수 때문에 달라진 것인지 비교하려면?',choices:[['same','전구·배선은 같게, 전지 수만 다르게 해요'],['bulb','전지 수와 전구 종류를 함께 바꿔요'],['open','한쪽 스위치만 열고 밝기를 비교해요']],answer:'same',hint:'밝기에 영향을 주는 다른 조건도 바꾸면 원인을 구별할 수 없어요.'}
};
export const LAB_QUESTIONS=[
 {ask:'바구니 위에서 스위치를 열자 장식이 떨어졌어요. 까닭은?',choices:[['off','전기가 끊겨 전자석의 자석 성질이 사라져서'],['forever','전자석은 전기가 없어도 늘 자석이어서'],['steel','장식이 무거워져 자석이 못 버텨서']],answer:'off',hint:'어느 순간에 철 장식을 붙잡고, 어느 순간에 놓았나요?'},
 {ask:'무거운 장식을 드는 데 전지 수가 영향을 주었다는 근거는?',choices:[['control','같은 전자석에서 전지 수만 바꿔 비교했어요'],['shape','철심도 바꾸었으니 전지 수 때문이 확실해요'],['count','한쪽만 가벼운 장식으로 시험했어요']],answer:'control',hint:'철심까지 바꾼 시험으로는 어느 조건 때문인지 알 수 없어요.'},
 {ask:'스위치를 열기와 전지 방향 바꾸기는 어떻게 달랐나요?',choices:[['pole','열면 끌지 않고, 방향을 바꾸면 극이 바뀌어 밀어요'],['same','둘 다 극이 바뀌어서 자동차를 밀어요'],['strong','방향만 바꾸면 세기가 커져서 밀어요']],answer:'pole',hint:'꺼진 전자석에는 극 표시가 없고, 뒤집어 켠 전자석은 극이 바뀌어요.'},
 {ask:'축제를 밝고 안전하게 유지한 방법은?',choices:[['need','사람 있는 곳은 켜고, 빈 곳은 끄고, 위험도 고쳤어요'],['dark','사람이 있는 길도 모두 꺼서 어둡게 했어요'],['many','더 밝게 하려고 한 콘센트에 모두 꽂았어요']],answer:'need',hint:'밝혀야 할 곳과 비어 있는 곳, 안전하게 고친 부분을 함께 봐요.'}
];
export function circuitKey(d){return JSON.stringify([d.wires,d.switches,d.cells,d.flipped,d.material]);}
export function hasEvidence(i,d){const q=CIRCUIT_QUESTIONS[i],e=d.evidence;return !q||!!e&&e.key===circuitKey(d)&&Number.isInteger(e.prediction)&&e.prediction>=0&&e.prediction<q.predictions.length&&e.observed===true&&e.answer===q.answer&&(!q.outcome||e.outcome===q.outcome.answer);}
export function freshLab(){return {actions:[],answer:null};}
const allowed=[['coil','permanent','switch','lift','move'],['cells','core','compare','lift'],['switch','reverse','test'],['inspect','repair','bulb','path','room','dry','head','split','check']];
export function validLab(i,d){return !!d&&Array.isArray(d.actions)&&d.actions.length<=160&&d.actions.every(a=>allowed[i-6].includes(a))&&(d.answer===null||LAB_QUESTIONS[i-6].choices.some(([id])=>id===d.answer));}
export function labState(i,d){
 const s={tool:'coil',on:false,right:false,held:false,delivered:false,cells:1,sameCore:true,compared:false,lifted:false,reversed:false,carX:400,attract:false,quiet:false,repel:false,path:false,room:true,dry:false,head:false,split:false,checked:false,inspected:false,repaired:false,message:''};
 for(const a of d.actions){
  if(i===6){
   if(a==='coil'||a==='permanent'){s.tool=a;s.held=false;s.message='장치를 골랐어요. 철 장식을 들어 보세요.';}
   if(a==='switch'){s.on=!s.on;if(!s.on&&s.tool==='coil'&&s.held){s.held=false;if(s.right)s.delivered=true;s.message=s.right?'전기를 끊자 장식이 바구니에 내려왔어요.':'전기를 끊자 장식이 출발점에 내려왔어요.';}else s.message=s.tool==='permanent'?'영구 자석은 스위치를 꺼도 자석 성질이 남아요.':s.on?'전기가 흘러 전자석이 되었어요.':'전기가 끊겨 자석 성질이 사라졌어요.';}
   if(a==='lift'){s.held=!s.right&&(s.tool==='permanent'||s.on);s.message=s.held?'철 장식이 붙었어요. 바구니 쪽으로 옮겨요.':'출발점에서 자석의 성질이 생겼는지 살펴봐요.';}
   if(a==='move'){s.right=!s.right;s.message=s.right?'바구니 위예요. 장식을 놓을 방법을 찾아요.':'출발점으로 돌아왔어요.';}
  }
  if(i===7){
   if(a==='cells'){s.cells=s.cells===1?2:1;s.compared=false;s.lifted=false;}
   if(a==='core'){s.sameCore=!s.sameCore;s.compared=false;s.lifted=false;}
   if(a==='compare'){s.compared=s.sameCore&&s.cells===2;s.message=!s.sameCore?'철심도 달라졌어요. 전지 수 때문인지 구별할 수 없어요.':s.cells===1?'두 쪽 모두 전지 한 개예요. 차이를 비교할 조건을 바꿔요.':'같은 무거운 장식: 한 개는 들지 못하고, 두 개는 들어 올렸어요.';}
   if(a==='lift'){s.lifted=s.compared;s.message=s.lifted?'같은 조건으로 비교한 뒤 무거운 장식을 옮겼어요.':'먼저 전지 수만 다른 공정한 비교를 해 보세요.';}
  }
  if(i===8){
   if(a==='switch')s.on=!s.on;
   if(a==='reverse')s.reversed=!s.reversed;
   if(a==='test'){if(!s.on){s.quiet=true;s.message='전기가 끊기면 자동차를 끌거나 밀지 않아요.';}else if(s.reversed){s.repel=true;s.carX=485;s.message='마주 보는 극이 같아져 자동차를 밀어냈어요.';}else{s.attract=true;s.carX=300;s.message='마주 보는 극이 달라 자동차가 끌려와요.';}}
  }
  if(i===9){
   if(a==='inspect'){s.inspected=true;s.message='같은 전구: 전지 한 개에서는 켜짐, 지금 두 개에서는 꺼짐. 전구는 정상이었어요.';}
   if(a==='repair'){if(!s.inspected)s.message='먼저 같은 전구로 비교 시험을 해 보세요.';else{s.repaired=!s.repaired;s.message=s.repaired?'전지 사이가 서로 다른 극이 되자 불이 켜졌어요. 이제 축제를 점검해요.':'전지 사이가 같은 극이 되어 불이 꺼졌어요.';}}
   if(a==='bulb')s.message='같은 새 전구로 바꿔도 꺼져 있어요. 전지가 만나는 곳을 살펴봐요.';
   if(a==='path'||a==='room')s[a]=!s[a];
   if(['dry','head','split'].includes(a))s[a]=true;
   s.checked=false;
   if(a==='check'){s.checked=s.inspected&&s.repaired&&s.path&&!s.room&&s.dry&&s.head&&s.split;s.message=s.checked?'길은 밝고 빈 방은 꺼졌어요. 세 가지 위험도 고쳤어요.':!s.path?'사람이 걷는 길은 밝혀 주세요.':s.room?'빈 방에는 아무도 없어요. 필요한 불인지 살펴봐요.':'물기·플러그 잡는 곳·몰린 플러그를 살펴봐요.';}
  }
 }
 s.ready=i===6?s.delivered:i===7?s.lifted:i===8?s.attract&&s.quiet&&s.repel:s.checked;
 return s;
}
export function labPassed(i,d){return validLab(i,d)&&labState(i,d).ready&&d.answer===LAB_QUESTIONS[i-6].answer;}
