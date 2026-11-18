export function createSearchHints(){
  let phase='',best=Infinity,idle=0,withoutProgress=0,requested=0,level=0,visited=new Set();
  return {
    update(key,distance,dt,paused=false,activity={}){
      if(key!==phase){phase=key;best=distance;idle=0;withoutProgress=0;requested=0;visited=new Set();}
      if(!paused){
        const exploring=activity.moving&&activity.cell!==undefined&&!visited.has(activity.cell);
        if(activity.cell!==undefined)visited.add(activity.cell);
        if(distance<=1.65||distance<best-1.5){best=Math.min(best,distance);idle=0;withoutProgress=0;}
        else{
          if(!activity.looking)withoutProgress+=dt;
          if(activity.looking||exploring)idle=0;else idle+=dt;
        }
      }
      level=Math.max(requested,idle>=50||withoutProgress>=85?3:idle>=26||withoutProgress>=60?2:idle>=12||withoutProgress>=40?1:0);return level;
    },
    request(){requested=Math.min(3,Math.max(2,level+1));},
  };
}
