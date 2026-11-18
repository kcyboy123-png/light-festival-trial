import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function loadModel(url){
  const loader=new GLTFLoader();
  if(typeof DecompressionStream!=='undefined'){
    try{
      const response=await fetch(url+'.gz');
      if(!response.ok)throw new Error('Compressed model unavailable');
      const data=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      return await loader.parseAsync(data,new URL('.',new URL(url,location.href)).href);
    }catch{}
  }
  // Older browsers and interrupted compressed downloads retain the original asset path.
  return loader.loadAsync(url);
}
