import * as T from 'three';
import {festivalTiming,FESTIVAL_SECONDS} from './festival-timing.js';

// One fixed particle buffer and two ground meshes; no per-frame particle allocation or extra shadow maps.
export function createFestivalReveal(scene){
  const origin={value:new T.Vector3(-17.7,1.25,14)},time={value:0},active={value:0},radius={value:-5},charge={value:0},finale={value:0},fade={value:0},pixelRatio={value:1};
  const uniforms={origin,time,active,radius,charge,finale,fade,pixelRatio};
  const group=new T.Group();group.visible=false;scene.add(group);
  const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
    vertexShader:'varying vec3 ground;void main(){vec4 p=modelMatrix*vec4(position,1.);ground=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
    fragmentShader:`uniform vec3 origin;uniform float radius,charge,fade;varying vec3 ground;
      void main(){float d=length(ground.xz-origin.xz);float edge=exp(-pow((d-radius)/.32,2.));float echo=exp(-pow((d-radius*.83)/.17,2.))*.35;
      float pool=exp(-d*d/4.)*charge;float rays=pow(.5+.5*sin(atan(ground.z-origin.z,ground.x-origin.x)*24.),12.);
      float a=((edge+echo)*.62+pool*(.4+rays*.25))*fade;gl_FragColor=vec4(mix(vec3(1.2,.6,.22),vec3(.4,1.2,1.6),smoothstep(12.,35.,d))*1.6,a);}`});
  // The plaza plane and the water plane meet their own surfaces; waves do not float through buildings.
  const ground=new T.Mesh(new T.CircleGeometry(8.3,96),material);ground.rotation.x=-Math.PI/2;ground.position.set(-25,1.215,14);group.add(ground);
  const water=new T.Mesh(new T.PlaneGeometry(150,150),material);water.rotation.x=-Math.PI/2;water.position.set(-17.7,.055,14);group.add(water);
  const count=1100,seeds=new Float32Array(count*3);
  for(let i=0;i<count;i++){seeds[i*3]=(i*.61803398875)%1;seeds[i*3+1]=(i*.754877666)%1;seeds[i*3+2]=(i*.56984029)%1;}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(count*3),3));g.setAttribute('seed',new T.BufferAttribute(seeds,3));
  const m=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute vec3 seed;uniform vec3 origin;uniform float time,radius,charge,finale,fade,pixelRatio;varying float alpha;varying vec3 tint;
      void main(){float a=seed.x*6.2831853;vec3 p;float brightness;
      if(seed.z<.26){float r=.5+seed.y*1.9;p=origin+vec3(cos(a+time*2.)*r,seed.y*3.+.2,sin(a+time*2.)*r);brightness=charge;}
      else if(seed.z<.76){float r=max(0.,radius-5.*seed.y);p=origin+vec3(cos(a)*r,.25+sin(seed.y*3.14159)*2.6,sin(a)*r);brightness=fade*smoothstep(0.,2.,radius)*(1.-smoothstep(27.,48.,r));}
      else{float r=2.+seed.y*10.;p=vec3(-25.+cos(a+time*.14)*r,3.+seed.y*14.+sin(a*3.+time)*.35,14.+sin(a+time*.14)*r);brightness=finale;}
      alpha=brightness*(.4+.6*pow(.5+.5*sin(time*3.+seed.y*70.),2.));tint=mix(vec3(2.,1.4,.55),vec3(.6,1.6,2.),seed.y);
      vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((55.+seed.y*90.)/-mv.z,1.,8.)*pixelRatio;}`,
    fragmentShader:`varying float alpha;varying vec3 tint;void main(){vec2 p=gl_PointCoord-.5;float d=length(p)*2.;float core=pow(max(0.,1.-d),3.);float star=exp(-abs(p.x)*45.)*exp(-abs(p.y)*8.)+exp(-abs(p.y)*45.)*exp(-abs(p.x)*8.);gl_FragColor=vec4(tint,(core+star*.24)*alpha);}`});
  const points=new T.Points(g,m);points.frustumCulled=false;group.add(points);
  const ribbonPositions=[],ribbonUV=[],indices=[];
  for(let strand=0;strand<3;strand++)for(let i=0;i<=160;i++){
    const t=i/160,a=t*Math.PI*2.1+strand*Math.PI*2/3,r=7.2-t*2.8,y=4+t*10;
    for(const side of [-1,1]){ribbonPositions.push(-25+Math.cos(a)*r,y+side*.12*Math.sin(t*Math.PI),14+Math.sin(a)*r);ribbonUV.push(t,(side+1)/2);}
    if(i<160){const k=strand*322+i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const ribbonG=new T.BufferGeometry();ribbonG.setAttribute('position',new T.Float32BufferAttribute(ribbonPositions,3));ribbonG.setAttribute('uv',new T.Float32BufferAttribute(ribbonUV,2));ribbonG.setIndex(indices);
  const ribbonM=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    vertexShader:'uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.y+=sin(time*1.6+uv.x*12.)*.18;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:'uniform float time,finale;varying vec2 vUv;void main(){float stream=.35+.65*pow(.5+.5*sin(vUv.x*25.-time*3.),3.);float edge=pow(max(0.,1.-abs(vUv.y*2.-1.)),1.5);float a=edge*sin(vUv.x*3.14159)*stream*finale*.65;vec3 c=mix(vec3(1.9,1.2,.4),vec3(.25,1.1,1.6),vUv.x);gl_FragColor=vec4(c,a);}'});
  group.add(new T.Mesh(ribbonG,ribbonM));

  let progress=1;
  return {
    async prepare(renderer,camera){const visible=group.visible;group.visible=true;try{await renderer.compileAsync(scene,camera);}finally{group.visible=visible;}},
    set(t,position,running,reduced){progress=t;const phase=festivalTiming(t);origin.value.copy(position);origin.value.y=1.25;time.value=t*FESTIVAL_SECONDS;radius.value=phase.radius;charge.value=phase.charge;finale.value=phase.finale;fade.value=phase.fade;active.value=running&&!reduced?1:0;group.visible=active.value===1;},
    update(dpr){pixelRatio.value=dpr;},
    get energy(){return active.value*(charge.value+finale.value*.6);},
    get state(){return {progress,active:!!active.value,origin:origin.value.toArray(),radius:radius.value,particles:count,finale:finale.value};}
  };
}
