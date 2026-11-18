const eyes=[[-.029,.760,.198],[.070,.769,.197]];
export function softenFace(x,y,z){
  if(y<.67||y>.83||z<.12)return {x,y,z,eye:0};
  let dy=0,eye=0;
  for(const [cx,cy,cz] of eyes){
    const r=((x-cx)/.066)**2+((y-cy)/.052)**2+((z-cz)/.065)**2;
    const weight=Math.max(0,1-r);const mask=weight*weight*(3-2*weight);
    const outside=Math.max(0,Math.min(1,(x-cx)*(cx<0?-1:1)/.05));
    dy-=(y-cy)*.10*mask+.0018*outside*mask;eye=Math.max(eye,mask);
  }
  const chin=Math.max(0,1-((x-.021)/.067)**2-((y-.704)/.029)**2-((z-.216)/.05)**2)**2;
  return {x:x+(x-.021)*.035*chin,y:y+dy+.0014*chin,z,eye};
}

export function softenStarfox(mesh,T){
  const g=mesh.geometry,p=g.attributes.position,mask=new Float32Array(p.count),normal=g.attributes.normal,originalNormal=normal.array.slice(),moved=new Uint8Array(p.count);let changed=0;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=softenFace(x,y,z);moved[i]=v.x!==x||v.y!==y||v.z!==z;p.setXYZ(i,v.x,v.y,v.z);mask[i]=v.eye;if(moved[i])changed++;}
  p.needsUpdate=true;g.computeVertexNormals();
  // Preserve the artist's original shading everywhere outside the edited facial surface.
  for(let i=0;i<p.count;i++)if(!moved[i])normal.setXYZ(i,originalNormal[i*3],originalNormal[i*3+1],originalNormal[i*3+2]);
  normal.needsUpdate=true;g.setAttribute('faceSoftness',new T.BufferAttribute(mask,1));
  mesh.material.onBeforeCompile=s=>{
    s.vertexShader='attribute float faceSoftness;varying float vFaceSoftness;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFaceSoftness=faceSoftness;');
    s.fragmentShader='varying float vFaceSoftness;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat darkFace=1.0-smoothstep(.025,.12,dot(diffuseColor.rgb,vec3(.299,.587,.114)));\ndiffuseColor.rgb+=vFaceSoftness*darkFace*vec3(.026,.016,.010);\nfloat amberEye=smoothstep(.06,.18,diffuseColor.r-diffuseColor.g)*smoothstep(.025,.08,diffuseColor.g-diffuseColor.b);\ndiffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.9+vec3(.12,.095,.06),vFaceSoftness*amberEye*.28);');
  };
  mesh.material.customProgramCacheKey=()=> 'starfox-soft-face-3';return changed;
}
