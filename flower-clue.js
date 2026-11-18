import {drawFountainClue} from './fountain-clue-art.js';
import * as T from 'three';
export function createFlowerClue(scene,stand,symbol='bridge'){
  const root=new T.Group();root.position.copy(stand).add(new T.Vector3(.85,0,1.6));root.scale.setScalar(.7);scene.add(root);
  const gold=new T.MeshStandardMaterial({color:0xba9959,metalness:.8,roughness:.28}),petal=new T.MeshPhysicalMaterial({color:0xb8a3d1,metalness:.25,roughness:.28,clearcoat:1,iridescence:.35,side:T.DoubleSide,emissive:0xc5a3ed,emissiveIntensity:0});
  const base=new T.Mesh(new T.CylinderGeometry(.72,.82,.12,40),gold);base.position.y=.08;root.add(base);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#112e3d';c.fillRect(0,0,512,512);c.strokeStyle='#f8d999';c.lineWidth=12;c.lineCap='round';c.beginPath();c.moveTo(72,330);c.quadraticCurveTo(256,120,440,330);c.stroke();c.beginPath();c.moveTo(72,365);c.lineTo(440,365);for(const x of [125,190,256,322,387]){c.moveTo(x,365);c.lineTo(x,240+(Math.abs(x-256)/131)*55);}c.stroke();c.fillStyle='#fff2c4';for(const [x,y]of [[190,115],[256,75],[322,115]]){c.beginPath();c.moveTo(x,y-15);c.lineTo(x+5,y-5);c.lineTo(x+15,y);c.lineTo(x+5,y+5);c.lineTo(x,y+15);c.lineTo(x-5,y+5);c.lineTo(x-15,y);c.lineTo(x-5,y-5);c.closePath();c.fill();}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  if(symbol==='fountain'){
    root.position.copy(stand).add(new T.Vector3(.45,0,.7));root.scale.setScalar(.6);
    petal.color.set(0x8dbfbf);petal.emissive.set(0x90e3df);drawFountainClue(c);
  }
  const signMat=new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:0,metalness:.15,roughness:.4});const sign=new T.Mesh(new T.CircleGeometry(.65,48),signMat);sign.rotation.x=-Math.PI/2;sign.position.y=.15;root.add(sign);
  if(symbol==='carousel'){
    root.position.copy(stand).add(new T.Vector3(.35,0,.35));root.scale.setScalar(.6);petal.color.set(0xe0bc92);petal.emissive.set(0xffcc8b);c.fillStyle='#112e3d';c.fillRect(0,0,512,512);c.beginPath();c.moveTo(256,45);c.lineTo(256,83);c.moveTo(80,165);c.lineTo(256,83);c.lineTo(432,165);c.closePath();c.moveTo(100,410);c.lineTo(412,410);for(const x of [130,256,382]){c.moveTo(x,165);c.lineTo(x,410);}c.moveTo(180,320);c.lineTo(295,320);c.lineTo(330,284);c.lineTo(318,251);c.lineTo(292,271);c.lineTo(286,304);c.moveTo(197,320);c.lineTo(181,365);c.moveTo(276,320);c.lineTo(300,365);c.stroke();
  }
  const positions=[],uv=[],indices=[];
  for(let j=0;j<=18;j++)for(let i=0;i<=8;i++){const t=j/18,u=i/4-1;positions.push(u*.38*Math.sin(t*Math.PI),.12*Math.sin(t*Math.PI)+u*u*.09*Math.sin(t*Math.PI),t*1.2);uv.push(i/8,t);if(j<18&&i<8){const k=j*9+i;indices.push(k,k+9,k+1,k+1,k+9,k+10);}}
  const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute(positions,3));leaf.setAttribute('uv',new T.Float32BufferAttribute(uv,2));leaf.setIndex(indices);leaf.computeVertexNormals();
  const vein=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,.012,0),new T.Vector3(0,.13,.6),new T.Vector3(0,.012,1.2)]),18,.009,4,false);
  const petals=[];for(let i=0;i<6;i++){const pivot=new T.Group();pivot.rotation.y=i/6*Math.PI*2;root.add(pivot);const hinge=new T.Group();hinge.position.set(0,.16,.65);pivot.add(hinge);hinge.add(new T.Mesh(leaf,petal),new T.Mesh(vein,gold));petals.push(hinge);}
  for(const radius of [.65,.73]){const rim=new T.Mesh(new T.TorusGeometry(radius,.018,6,48),gold);rim.rotation.x=Math.PI/2;rim.position.y=.17;root.add(rim);}
  const gems=new T.InstancedMesh(new T.OctahedronGeometry(.045),gold,12),dummy=new T.Object3D();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;dummy.position.set(Math.cos(a)*.7,.19,Math.sin(a)*.7);dummy.updateMatrix();gems.setMatrixAt(i,dummy.matrix);}root.add(gems);
  if(symbol==='blossom'){sign.visible=false;root.scale.setScalar(.48);root.position.copy(stand).add(new T.Vector3(.9,0,.5));petal.color.set(0xacb9d9);}
  let visible=0;
  return {tint(color){petal.color.set(color);petal.emissive.set(color);},position:root.position.clone().add(new T.Vector3(0,1.4,0)),sway(value){root.rotation.z=value;},setReveal(v){visible=T.MathUtils.smoothstep(v,.4,.95);petals.forEach(p=>p.rotation.x=-(1-visible)*2.3);signMat.emissiveIntensity=visible*1.3;petal.emissiveIntensity=visible*(symbol==='blossom'?.16:.35);root.visible=v>0;},get state(){return {revealed:visible,position:root.position.toArray()};}};
}
