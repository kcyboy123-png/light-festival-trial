(function(root) {
  'use strict';
  const ids = ['bp','bn','la','lb','sa','sb'];
  const names = {bp:'전지 +극',bn:'전지 −극',la:'전구 왼쪽',lb:'전구 오른쪽',sa:'스위치 왼쪽',sb:'스위치 오른쪽'};
  function validWires(wires) {
    if (!Array.isArray(wires) || wires.length > 3) return false;
    const used=new Set();
    for(const wire of wires) {
      if(!Array.isArray(wire)||wire.length!==2||wire[0]===wire[1])return false;
      for(const n of wire){if(!ids.includes(n)||used.has(n))return false;used.add(n);}
    }
    return true;
  }
  function evaluate(wires, closed) {
    if(!validWires(wires))return {lit:false,short:false,complete:false,path:[]};
    const edges=wires.map(([a,b])=>({a,b,kind:'wire'}));
    edges.push({a:'la',b:'lb',kind:'bulb'});
    if(closed)edges.push({a:'sa',b:'sb',kind:'switch'});
    function find(node, seen, path) {
      if(node==='bn')return path;
      for(const e of edges){const next=e.a===node?e.b:e.b===node?e.a:null;if(next&&!seen.has(next)){const found=find(next,new Set([...seen,next]),[...path,e]);if(found)return found;}}
      return null;
    }
    const path=find('bp',new Set(['bp']),[])||[];
    const lit=path.some(e=>e.kind==='bulb');
    return {lit,short:path.length>0&&!lit,complete:lit&&path.some(e=>e.kind==='switch'),path};
  }
  function restore(raw) {
    if(typeof raw!=='string'||raw.length>2000)return null;
    try { const s=JSON.parse(raw);if(s?.version!==1||!validWires(s.wires)||typeof s.closed!=='boolean'||typeof s.discovered!=='boolean')return null;
      if(evaluate(s.wires,s.closed).short)return null;
      return {version:1,wires:s.wires.map(w=>[...w]),closed:s.closed,discovered:s.discovered};
    } catch{return null;}
  }
  const api={ids,names,validWires,evaluate,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ToyCircuit=api;
})(typeof window!=='undefined'?window:globalThis);
