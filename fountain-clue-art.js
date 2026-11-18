// The notebook and the flower medallion depict the same lotus landmark.
const paths=[
 ['M27 117C27 100 213 100 213 117C213 135 27 135 27 117Z','#163e51','#8ecad5'],
 ['M120 110C79 95 58 64 61 31C94 42 114 72 120 110Z','#9994d9','#e9d1a2'],
 ['M120 110C161 95 182 64 179 31C146 42 126 72 120 110Z','#d4a2cc','#e9d1a2'],
 ['M120 111C96 75 99 38 120 8C141 38 144 75 120 111Z','#8ecdd2','#f3dfad'],
 ['M120 111C74 114 42 96 21 67C66 63 99 82 120 111Z','#b5a5e5','#e9d1a2'],
 ['M120 111C166 114 198 96 219 67C174 63 141 82 120 111Z','#cfacd9','#e9d1a2'],
 ['M120 113C91 107 69 91 61 69C91 70 114 87 120 113Z','#b4a2d9','#f3dfad'],
 ['M120 113C149 107 171 91 179 69C149 70 126 87 120 113Z','#89c7d0','#f3dfad'],
 ['M120 15V109M28 118Q24 87 14 118M212 118Q216 87 226 118M83 121Q120 130 157 121','none','#f3dfad']
];
export const fountainClueArt='<g stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+paths.map(([d,fill,stroke])=>`<path d="${d}" fill="${fill}" stroke="${stroke}"/>`).join('')+'</g>';
export function drawFountainClue(c){
 c.fillStyle='#112e3d';c.fillRect(0,0,512,512);c.save();c.translate(16,110);c.scale(2,2);c.lineWidth=2;c.lineJoin='round';c.lineCap='round';
 for(const [d,fill,stroke]of paths){const path=new Path2D(d);if(fill!=='none'){c.fillStyle=fill;c.fill(path);}c.strokeStyle=stroke;c.stroke(path);}c.restore();
}
