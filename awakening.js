import * as T from 'three';

export const LIGHT_CENTERS=[[4,15],[-15,1],[0,-8]];
export const LIGHT_RADII=[23,27,110];
export const REVEAL_SECONDS=10;

// World-space masks also cover merged geometry and individual plant instances.
export function createAwakening(scene, lightMats) {
  const radii={value:new T.Vector3(-5,-5,-5)},enabled={value:0};
  const festivalRadius={value:-5},festivalOrigin={value:new T.Vector3(-17.7,1.25,14)},festivalPulse={value:0};
  const code=`uniform vec3 wakeRadius;uniform float wakeEnabled,wakeMission;varying vec3 wakeWorld;
    float wakeLight(vec3 p){float a=1.-smoothstep(wakeRadius.x-3.,wakeRadius.x,length(p.xz-vec2(4.,15.)));
      float b=1.-smoothstep(wakeRadius.y-3.,wakeRadius.y,length(p.xz-vec2(-15.,1.)));
      float c=1.-smoothstep(wakeRadius.z-4.,wakeRadius.z,length(p.xz-vec2(0.,-8.)));
      if(wakeMission==1.)return b;if(wakeMission==2.)return c;
      a*=smoothstep(-11.,-5.,p.x);
      float plaza=smoothstep(8.,11.,length(p.xz-vec2(0.,-8.)));a*=plaza;b*=plaza;
      return max(a,max(b,c));}`;
  const festivalCode=`uniform float festivalRadius,festivalReserve,festivalPulse;uniform vec3 festivalOrigin;
    float festivalLight(vec3 p){if(festivalReserve<.5||festivalRadius>=69.9)return 1.;float district=(1.-smoothstep(-17.,-10.,p.x))*smoothstep(-17.,-8.,p.z);
      if(district<.001)return 1.;if(festivalRadius<0.)return mix(1.,.06,district);
      float distance=length(p.xz-festivalOrigin.xz)+max(0.,p.y-1.2)*1.25;
      float arrived=1.-smoothstep(festivalRadius-3.,festivalRadius,distance);
      float crest=exp(-pow((distance-festivalRadius+1.5)/2.,2.))*festivalPulse;
      return mix(1.,.06+arrived*.94+crest*1.8,district*festivalReserve);}`;
  for(const {m,stage,mission=-1} of lightMats){
    const previous=m.onBeforeCompile;
    m.onBeforeCompile=s=>{
      previous?.(s);s.uniforms.wakeRadius=radii;s.uniforms.wakeEnabled=enabled;s.uniforms.wakeMission={value:mission};
      Object.assign(s.uniforms,{festivalRadius,festivalOrigin,festivalPulse,festivalReserve:{value:stage===2?1:0}});
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 wakeWorld;').replace('#include <project_vertex>',`#include <project_vertex>
        vec4 wakeP=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          wakeP=instanceMatrix*wakeP;
        #endif
        wakeWorld=(modelMatrix*wakeP).xyz;`);
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n'+code+'\n'+festivalCode).replace('#include <lights_fragment_begin>','totalEmissiveRadiance*=mix(1.,wakeLight(wakeWorld)*festivalLight(wakeWorld),wakeEnabled);\n#include <lights_fragment_begin>');
    };
    m.customProgramCacheKey=()=>String(previous)+'|wake-festival';m.needsUpdate=true;
  }
  const lights=LIGHT_CENTERS.map(([x,z])=>{const l=new T.PointLight(0xffcf91,0,26,2);l.position.set(x,5,z);scene.add(l);return l;});
  const positions=[],phases=[];
  for(let i=0;i<900;i++){const a=i*2.399963,r=5+Math.sqrt((i%137)/137)*31;positions.push(Math.cos(a)*r,1.3+(i%7)*.22,-6+Math.sin(a)*r);phases.push((i*.618033)%1);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('phase',new T.Float32BufferAttribute(phases,1));
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{wakeRadius:radii,wakeEnabled:enabled,wakeMission:{value:-1},time:{value:0},pixelRatio:{value:1}},vertexShader:code+`
    attribute float phase;uniform float time;uniform float pixelRatio;varying float sparkle;
    void main(){vec3 p=position;p.y+=mod(time*.45+phase*5.,5.);p.x+=sin(time*.3+phase*20.)*.35;wakeWorld=p;
      sparkle=wakeLight(position)*(.25+.75*pow(.5+.5*sin(time*2.+phase*50.),3.))*wakeEnabled;
      vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;gl_PointSize=clamp(95./-view.z,1.5,6.)*pixelRatio;}`,
    fragmentShader:'varying float sparkle;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(1.7,1.1,.5,pow(max(0.,1.-r),2.)*sparkle);}'});
  const sparks=new T.Points(geometry,material);sparks.visible=false;scene.add(sparks);
  let progress=[0,0,0];
  return {
    set(values){enabled.value=1;progress=values;sparks.visible=values.some(v=>v>0);values.forEach((v,i)=>radii.value.setComponent(i,v>0?T.MathUtils.lerp(.1,LIGHT_RADII[i],v):-5));},
    setFestival(radius,origin,pulse=0){festivalRadius.value=radius;festivalOrigin.value.copy(origin);festivalPulse.value=pulse;},
    update(time,pixelRatio){material.uniforms.time.value=time;material.uniforms.pixelRatio.value=pixelRatio;lights.forEach((l,i)=>l.intensity=progress[i]*62);},
    get progress(){return progress;},get enabled(){return enabled.value===1;},get radii(){return radii.value.toArray();}
  };
}
