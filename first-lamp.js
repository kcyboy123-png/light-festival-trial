export const firstDraft=()=>({wires:[['bp','la'],['sb','bn']],closed:true});
export const firstStory=()=>({found:false,clueRead:false});
export function validFirstStory(story,draft,completed){
  if(story===null)return true;
  if(!story||typeof story.found!=='boolean'||typeof story.clueRead!=='boolean')return false;
  const keys=draft.wires.map(w=>[...w].sort().join(':'));
  return keys.includes('bp:la')&&keys.includes('bn:sb')&&keys.every(k=>['bp:la','bn:sb','lb:sa'].includes(k))&&
    (story.found||!keys.includes('lb:sa'))&&(!completed||story.found)&&(!story.clueRead||completed>=1)&&(completed<2||story.clueRead);
}
