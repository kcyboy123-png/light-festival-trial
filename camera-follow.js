// Keep the sightline outside the carousel, including when walking around its back.
export function safeFollowAngle(x,z,angle,distance){
  const dx=x+25,dz=z-14,r=Math.hypot(dx,dz),solid=6.5;
  if(r<=solid)return Math.atan2(dx,dz);
  const along=Math.max(0,Math.min(distance,-dx*Math.sin(angle)-dz*Math.cos(angle)));
  if(Math.hypot(dx+Math.sin(angle)*along,dz+Math.cos(angle)*along)>=solid)return angle;
  const radial=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(angle-radial),Math.cos(angle-radial)),limit=Math.PI-Math.asin(solid/r)-.025;
  return radial+Math.max(-limit,Math.min(limit,delta));
}
