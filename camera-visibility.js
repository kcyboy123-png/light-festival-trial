const softened=new WeakSet();
export function softenOccluder(material,focus,enabled){
  if(softened.has(material))return;softened.add(material);
  material.userData.foxCutout=true;
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.alphaHash=true;
  material.onBeforeCompile=s=>{
    previous(s);s.uniforms.foxFocus=focus;s.uniforms.foxViewEnabled=enabled;
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 foxViewWorld;').replace('#include <project_vertex>',`#include <project_vertex>
      vec4 foxViewLocal=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        foxViewLocal=instanceMatrix*foxViewLocal;
      #endif
      foxViewWorld=(modelMatrix*foxViewLocal).xyz;`);
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 foxViewWorld;uniform vec3 foxFocus;uniform float foxViewEnabled;').replace('#include <alphahash_fragment>',`vec3 sight=foxFocus-cameraPosition;float reach=length(sight);sight/=max(reach,.001);
      vec3 offset=foxViewWorld-cameraPosition;float along=dot(offset,sight);vec3 across=offset-sight*along;across.y*=.7;
      if(foxViewEnabled>.5&&foxViewWorld.y>foxFocus.y-1.15&&along>0.&&along<reach-.5)diffuseColor.a*=smoothstep(.9,1.35,length(across));
      #include <alphahash_fragment>`);
  };
  material.customProgramCacheKey=()=>key+'|fox-view';
}
export function inFoxCutout(p,camera,focus){
  let x=focus.x-camera.x,y=focus.y-camera.y,z=focus.z-camera.z;const reach=Math.hypot(x,y,z);if(reach<.001)return false;x/=reach;y/=reach;z/=reach;
  const px=p.x-camera.x,py=p.y-camera.y,pz=p.z-camera.z,along=px*x+py*y+pz*z;
  return p.y>focus.y-1.15&&along>0&&along<reach-.5&&Math.hypot(px-x*along,(py-y*along)*.7,pz-z*along)<.9;
}
