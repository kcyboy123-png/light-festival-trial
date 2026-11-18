export function initialQuality({coarse,touchPoints,saved}){
  if(coarse||touchPoints>0)return 'light';
  return saved==='light'?'light':'high';
}
