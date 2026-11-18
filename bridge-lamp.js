export const bridgeDraft=()=>({wires:[['bp','la'],['lb','sa'],['sb','bn']],closed:false});
export const bridgeStory=()=>({found:false,cleared:false,clueRead:false});
export function validBridgeStory(story,draft,completed){
  if(story===null)return true;
  if(!story||['found','cleared','clueRead'].some(k=>typeof story[k]!=='boolean'))return false;
  const keys=draft.wires.map(w=>[...w].sort().join(':'));
  return keys.length===3&&['bp:la','lb:sa','bn:sb'].every(k=>keys.includes(k))&&
    (!story.found||completed>=1)&&(!story.cleared||story.found)&&(!draft.closed||story.cleared)&&
    (completed<2||(story.found&&story.cleared))&&(!story.clueRead||completed>=2)&&(completed<3||story.clueRead);
}
