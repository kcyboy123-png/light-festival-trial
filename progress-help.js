// Repeated inspections keep counting; changing repair steps gives a fresh thinking interval.
export function createProgressHelp(){
  let previous=-1,seconds=0;
  return {reset(){previous=-1;seconds=0;},update(dt,progress,paused=false){
    if(progress!==previous){previous=progress;seconds=0;}
    if(!paused)seconds+=dt;
    return Math.min(2,Math.floor(seconds/16));
  }};
}
