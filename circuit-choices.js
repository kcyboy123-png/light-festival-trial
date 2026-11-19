// The picture and the installed wires come from the same topology.
export function circuitWires(type,{switches=0,material=false}={}){
  let w;
  if(!switches)w=[['p','m1'],['m2','a1'],['a2','n']];
  else if(switches===1)w=[['p','s1'],['s2',material?'m1':'a1'],['a2','n']];
  else if(type==='parallel')w=[['p','s1'],['p','t1'],['s2',material?'m1':'a1'],['t2',material?'m1':'a1'],['a2','n']];
  else w=[['p','s1'],['s2','t1'],['t2',material?'m1':'a1'],['a2','n']];
  if(material&&switches)w.push(['m2','a1']);
  if(type==='bypass')w.push(switches===2?['t1','t2']:['s1','s2']);
  if(type==='shunt')w.push(['m1','m2']);
  if(type==='gap')w=w.filter(([a])=>a!==(switches?'s2':'m2'));
  return w;
}
export const CHOICE_TYPES={2:['bypass','series','gap'],4:['gap','shunt','series'],6:['series','bypass','gap'],7:['parallel','bypass','series'],8:['series','parallel','bypass'],9:['shunt','series','parallel']};
export const CIRCUIT_DESCRIPTIONS={series:'부품을 차례로 지나는 한 길',parallel:'스위치 A와 B를 따로 지나는 두 갈래',bypass:'스위치 양쪽을 직접 잇는 전선이 있는 길',shunt:'재료 양쪽을 직접 잇는 전선이 있는 길',gap:'전선 일부가 끊긴 길'};
export const sameWires=(a,b)=>a.length===b.length&&a.every(w=>b.some(v=>[...w].sort().join(':')===[...v].sort().join(':')));
export function circuitPicture(type,m,draft,change=null){
  const line=d=>`<path d="${d}"/>`;
  const broken=(x,y,width)=>`<g class="wire-break"><path d="M${x} ${y}l4-4 4 8 M${x+width} ${y}l-4 4-4-8"/><text x="${x+width/2}" y="${y+28}">끊김</text></g>`;
  const sw=(x,y,name,on=true)=>`${line(`M${x-18} ${y}L${x+18} ${on?y:y-13}`)}<circle cx="${x-18}" cy="${y}" r="3"/><circle cx="${x+18}" cy="${y}" r="3"/><text x="${x}" y="${y-17}">${name}</text>`;
  const two=(draft?.cells??m.cells??1)===2,flipped=!!draft?.flipped;
  let drawing=line(two?'M24 62V30H60 M24 116V150H256V105 M256 69V30H216':'M24 80V30H60 M24 99V150H256V105 M256 69V30H216');
  if(m.switches===2){
    if(type==='parallel')drawing+=line((change==='cut-a'?'M60 30H76 M96 30H120':'M60 30H120')+' M156 30H216 M60 30V76H120 M156 76H216V30')+sw(138,30,'A',draft?.switches[0])+sw(138,76,'B',draft?.switches[1])+'<circle cx="60" cy="30" r="3" fill="currentColor"/><circle cx="216" cy="30" r="3" fill="currentColor"/>';
    else drawing+=line('M60 30H72 M108 30H168 M204 30H216')+sw(90,30,'A',draft?.switches[0])+sw(186,30,'B',draft?.switches[1])+(type==='bypass'?line('M168 30V65H204V30'):'');
  }else if(m.switches){
    drawing+=line('M60 30H120')+sw(138,30,'스위치',draft?.switches[0])+line(type==='gap'?'M194 30H216':'M156 30H216');
    if(type==='gap')drawing+=broken(156,30,38);
    if(type==='bypass')drawing+=line('M120 30V68H156V30');
  }else drawing+=line('M60 30H216');
  if(m.material){
    // Put the material in the outgoing branch, before the lamp.
    const detail=change==='material-focus',x=detail?150:216,end=detail?200:234;
    drawing=drawing.replace('M256 69V30H216',`M256 69V30H${end}`);
    if(detail)drawing=drawing.replace('M60 30H216',`M60 30H${x}`);
    drawing+=`<rect ${detail?`class="material-focus ${draft.material}"`:''} x="${x}" y="${detail?18:22}" width="${end-x}" height="${detail?24:16}" rx="2"/><text x="${(x+end)/2}" y="${detail?12:16}">${detail?({copper:'구리',plastic:'플라스틱',rubber:'고무'})[draft.material]:'재료'}</text>`;
    if(type==='shunt')drawing+=line(`M${x} 30V${detail?62:53}H${end}V30`);
    if(type==='gap'&&!m.switches){drawing=drawing.replace(`M256 69V30H${end}`,'M256 69V30H256');drawing+=broken(end,30,256-end);}
  }
  if(change==='bridge-b')drawing+='<path class="circuit-change" d="M168 30V65H204V30"/><circle cx="168" cy="30" r="3" fill="currentColor"/><circle cx="204" cy="30" r="3" fill="currentColor"/>';
  if(change==='cut-a')drawing+='<path class="circuit-change cut" d="m78 25-4 10m24-10-4 10"/>';
  const cells=two?`<g class="cell-symbol" data-polarity="normal"><path d="M12 62H36 M17 78H31"/></g><path d="M24 78V100"/><g class="cell-symbol" data-polarity="${flipped?'reversed':'normal'}"><path d="${flipped?'M17 100H31 M12 116H36':'M12 100H36 M17 116H31'}"/></g>`:'<g class="cell-symbol" data-polarity="normal"><path d="M12 80H36 M17 99H31"/></g>';
  const poles=two?`<text x="43" y="67">＋</text><text x="43" y="83">−</text><text x="43" y="105">${flipped?'−':'＋'}</text><text x="43" y="121">${flipped?'＋':'−'}</text>`:'<text x="43" y="85">＋</text><text x="43" y="107">−</text>';
  return `<svg viewBox="0 0 280 174" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round">${drawing}${cells}<circle cx="256" cy="87" r="18"/><path d="m244 75 24 24m0-24-24 24"/></g><text x="${two?50:24}" y="171">${two?'전지 2개':'전지'}</text><text x="256" y="132">전구</text>${poles}</svg>`;
}
