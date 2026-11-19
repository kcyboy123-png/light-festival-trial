export function initialQuality({coarse,touchPoints,mobile=false,saved}){
  if(coarse||touchPoints>0||mobile)return 'light';
  return saved==='light'?'light':'high';
}
export function renderPixelRatio(quality,dpr,width,height){
  return quality==='high'?Math.min(dpr,2):Math.min(dpr,1,Math.sqrt(720000/(width*height)));
}
