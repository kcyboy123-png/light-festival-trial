export const freshCarousel=()=>({count:1,joined:false,closed:true,discovered:false,restored:false});
export function validCarousel(s){return !!s&&[1,2].includes(s.count)&&['joined','closed','discovered','restored'].every(k=>typeof s[k]==='boolean')&&!(s.count===1&&s.joined)&&(!s.restored||s.discovered);}
export function compareBrightness(s){
  if(!validCarousel(s))return {left:'off',right:'off',ready:false};
  return {left:s.closed?'dim':'off',right:!s.closed?'off':s.count===1?'dim':s.joined?'bright':'off',ready:s.closed&&s.count===2&&s.joined};
}
export function correctObservation(s,side){return compareBrightness(s).ready&&side==='right';}
