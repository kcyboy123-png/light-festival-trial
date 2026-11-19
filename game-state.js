import {freshCarousel,validCarousel} from './series-model.js?v=trial-20261120-3';
import {firstDraft,firstStory,validFirstStory} from './first-lamp.js?v=trial-20261120-3';
import {bridgeDraft,bridgeStory,validBridgeStory} from './bridge-lamp.js?v=trial-20261120-3';
import {fountainDraft,fountainStory,validFountainStory} from './fountain-lamp.js?v=trial-20261120-3';
export const SAVE_KEY='changyong-light-festival-circuit-v1';
export const checkpointIndex=state=>state.carousel.restored?3:state.completed-1;
export const freshProgress=()=>({version:1,completed:0,firstLamp:firstStory(),bridgeLamp:bridgeStory(),fountainLamp:fountainStory(),carousel:freshCarousel(),drafts:[firstDraft(),bridgeDraft(),fountainDraft()]});
export function restoreProgress(raw,circuit){
  if(typeof raw!=='string'||raw.length>5000)return null;
  try{
    const s=JSON.parse(raw);
    if(s?.version!==1||!Number.isInteger(s.completed)||s.completed<0||s.completed>3||!Array.isArray(s.drafts)||s.drafts.length!==3)return null;
    for(let i=0;i<3;i++){const d=s.drafts[i];if(!d||!circuit.validWires(d.wires)||typeof d.closed!=='boolean'||circuit.evaluate(d.wires,d.closed).short||(i<s.completed&&!circuit.evaluate(d.wires,d.closed).complete))return null;}
    const carousel=s.carousel===undefined?freshCarousel():s.carousel;
    if(!validCarousel(carousel)||(carousel.restored&&s.completed!==3))return null;
    const migrateEmpty=s.firstLamp===undefined&&s.completed===0&&s.drafts[0].wires.length===0&&!s.drafts[0].closed;
    const firstLamp=s.firstLamp===undefined?(migrateEmpty?firstStory():null):s.firstLamp;
    const drafts=s.drafts.map(d=>({wires:d.wires.map(w=>[...w]),closed:d.closed}));if(migrateEmpty)drafts[0]=firstDraft();
    if(!validFirstStory(firstLamp,drafts[0],s.completed))return null;
    const migrateBridge=s.bridgeLamp===undefined&&firstLamp!==null&&s.completed<2&&drafts[1].wires.length===0&&!drafts[1].closed;
    const bridgeLamp=s.bridgeLamp===undefined?(migrateBridge?bridgeStory():null):s.bridgeLamp;
    if(migrateBridge)drafts[1]=bridgeDraft();
    if(!validBridgeStory(bridgeLamp,drafts[1],s.completed))return null;
    const migrateFountain=s.fountainLamp===undefined&&bridgeLamp!==null&&s.completed<3&&drafts[2].wires.length===0&&!drafts[2].closed;
    const fountainLamp=s.fountainLamp===undefined?(migrateFountain?fountainStory():null):s.fountainLamp;
    if(migrateFountain)drafts[2]=fountainDraft();
    if(!validFountainStory(fountainLamp,drafts[2],s.completed,carousel))return null;
    return {version:1,completed:s.completed,firstLamp:firstLamp?{...firstLamp}:null,bridgeLamp:bridgeLamp?{...bridgeLamp}:null,fountainLamp:fountainLamp?{...fountainLamp}:null,carousel:{...carousel},drafts};
  }catch{return null;}
}
