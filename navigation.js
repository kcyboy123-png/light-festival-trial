export function nearestNode(nodes,point){let best=0,distance=Infinity;for(let i=0;i<nodes.length;i++){const p=nodes[i],d=(p.x-point.x)**2+(p.z-point.z)**2;if(d<distance){distance=d;best=i;}}return best;}
export function canTraverse(from,to,onPath){
  const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.08));let previous=from;
  for(let i=1;i<=steps;i++){const t=i/steps,p={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,z:from.z+(to.z-from.z)*t};if(!onPath(p,previous))return false;previous=p;}
  return true;
}
// Keep direct movement inside the existing paths, including the bridge's height.
export function walkStep(nodes,edges,position,dx,dz,plazas=[]){
  const x=position.x+dx,z=position.z+dz;let distance=Infinity;
  let bestX,bestY,bestZ;
  function consider(px,y,pz){const d=(x-px)**2+(z-pz)**2;if(d<distance){distance=d;bestX=px;bestY=y;bestZ=pz;}}
  for(let i=0;i<edges.length;i++)for(const j of edges[i]){if(j<i)continue;const a=nodes[i],b=nodes[j],vx=b.x-a.x,vz=b.z-a.z,length=vx*vx+vz*vz;if(!length)continue;const t=Math.max(0,Math.min(1,((x-a.x)*vx+(z-a.z)*vz)/length)),px=a.x+vx*t,pz=a.z+vz*t,d=Math.hypot(x-px,z-pz),radius=Math.min(a.walkRadius??.75,b.walkRadius??.75),f=d>radius?radius/d:1;consider(px+(x-px)*f,a.y+(b.y-a.y)*t,pz+(z-pz)*f);}
  for(const p of plazas){const vx=x-p.x,vz=z-p.z,d=Math.hypot(vx,vz);if(d>0){const r=Math.max(p.inner,Math.min(p.outer,d));consider(p.x+vx*r/d,p.y,p.z+vz*r/d);}}
  return distance<Infinity?{x:bestX,y:bestY,z:bestZ}:{...position};
}
export function route(nodes,edges,start,goal){
  if(start===goal)return [start];
  const distance=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),pending=new Set([start]);distance[start]=0;
  while(pending.size){let at=-1;for(const i of pending)if(at===-1||distance[i]<distance[at]||distance[i]===distance[at]&&i<at)at=i;pending.delete(at);if(at===goal)break;
    for(const next of edges[at]){const a=nodes[at],b=nodes[next],d=distance[at]+Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(d<distance[next]){distance[next]=d;previous[next]=at;pending.add(next);}}
  }
  if(previous[goal]===-1)return [];
  const result=[goal];while(result[0]!==start)result.unshift(previous[result[0]]);return result;
}
