export const FESTIVAL_SECONDS=13;
const smooth=(a,b,t)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
export function festivalTiming(t){
  t=Math.max(0,Math.min(1,t));
  return {charge:smooth(0,.1,t)*(1-smooth(.16,.28,t)),radius:t===0?-5:70*smooth(.1,.86,t),carousel:smooth(.18,.64,t),finale:smooth(.57,.75,t)*(1-smooth(.82,1,t)),fade:1-smooth(.82,1,t)};
}
