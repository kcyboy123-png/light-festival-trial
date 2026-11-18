export const fountainDraft=()=>({wires:[['bp','la'],['lb','sa'],['sb','bn']],closed:true});
export const fountainStory=()=>({found:false,seated:false,clueRead:false});
export function evaluateFountain(draft,story,circuit){
  // The wire stays on the holder; the loose bulb's contact is electrically disconnected.
  return circuit.evaluate(story&&!story.seated?draft.wires.filter(w=>!w.includes('la')):draft.wires,draft.closed);
}
export function validFountainStory(story,draft,completed,carousel){
  if(story===null)return true;
  if(!story||['found','seated','clueRead'].some(k=>typeof story[k]!=='boolean'))return false;
  const keys=draft.wires.map(w=>[...w].sort().join(':'));
  return keys.length===3&&['bp:la','lb:sa','bn:sb'].every(k=>keys.includes(k))&&
    (!story.found||completed>=2)&&(!story.seated||story.found)&&(completed<3||story.seated)&&
    (!story.clueRead||completed===3)&&(!carousel.restored||story.clueRead);
}
