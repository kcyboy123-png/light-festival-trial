// Each SVG owns its materials so closed dialogs never supply another board's paint.
function materials(p){return `<defs>
 <linearGradient id="${p}-metal" x2="1" y2=".1"><stop stop-color="#344954"/><stop offset=".17" stop-color="#9aafb6"/><stop offset=".34" stop-color="#f2f5e9"/><stop offset=".46" stop-color="#879a9e"/><stop offset=".65" stop-color="#d3ddd4"/><stop offset=".85" stop-color="#4b626b"/><stop offset="1" stop-color="#abb7ac"/></linearGradient>
 <linearGradient id="${p}-gold" x2="0" y2="1"><stop stop-color="#fff0bb"/><stop offset=".16" stop-color="#e3bd71"/><stop offset=".45" stop-color="#95612e"/><stop offset=".58" stop-color="#f3d68b"/><stop offset=".8" stop-color="#aa773d"/><stop offset="1" stop-color="#634322"/></linearGradient>
 <linearGradient id="${p}-enamel" x2=".2" y2="1"><stop stop-color="#467b7e"/><stop offset=".08" stop-color="#284e55"/><stop offset=".5" stop-color="#163940"/><stop offset="1" stop-color="#0a202b"/></linearGradient>
 <linearGradient id="${p}-ivory" x2=".7" y2="1"><stop stop-color="#f5f0d8"/><stop offset=".36" stop-color="#e4e5d3"/><stop offset=".66" stop-color="#b7c5bd"/><stop offset="1" stop-color="#6e8d91"/></linearGradient>
 <linearGradient id="${p}-cell" x2="0" y2="1"><stop stop-color="#4d2b23"/><stop offset=".15" stop-color="#bf8060"/><stop offset=".3" stop-color="#edbd91"/><stop offset=".48" stop-color="#bb704c"/><stop offset=".76" stop-color="#6c3429"/><stop offset="1" stop-color="#341e24"/></linearGradient>
 <linearGradient id="${p}-glass" x1="0" y1=".3" x2="1" y2=".6"><stop stop-color="#b7e7ef" stop-opacity=".48"/><stop offset=".12" stop-color="#82bed1" stop-opacity=".16"/><stop offset=".42" stop-color="#153645" stop-opacity=".05"/><stop offset=".8" stop-color="#c7e3d9" stop-opacity=".18"/><stop offset="1" stop-color="#b6e1e9" stop-opacity=".5"/></linearGradient>
 <radialGradient id="${p}-warm"><stop stop-color="#fff8d0" stop-opacity=".9"/><stop offset=".45" stop-color="#ffd77e" stop-opacity=".62"/><stop offset="1" stop-color="#eda44c" stop-opacity="0"/></radialGradient>
 <radialGradient id="${p}-aura"><stop stop-color="#ffe5a0" stop-opacity=".65"/><stop offset=".35" stop-color="#ffc65a" stop-opacity=".22"/><stop offset="1" stop-color="#e8a849" stop-opacity="0"/></radialGradient>
 </defs>`;}
function screw(p,x,y){return `<g><circle cx="${x}" cy="${y}" r="4.2" fill="#06141b"/><circle cx="${x}" cy="${y-1}" r="3.3" fill="url(#${p}-metal)"/><path d="M${x-1.8} ${y-2}l3.6 2" stroke="#324b51" stroke-width="1.1"/></g>`;}
function mount(p,x,y,w,h){return `<ellipse cx="${x+w/2}" cy="${y+h+7}" rx="${w/2+3}" ry="10" fill="#020a11" opacity=".65"/><rect x="${x}" y="${y+7}" width="${w}" height="${h}" rx="11" fill="#071923" stroke="#b69860" stroke-width="1.2"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" fill="url(#${p}-enamel)" stroke="#81aaa5" stroke-width="1"/><path d="M${x+12} ${y+3}H${x+w-12}" stroke="#b1d0bb" opacity=".4"/>${screw(p,x+12,y+h-10)}${screw(p,x+w-12,y+h-10)}`;}

export function bulbArt(p,insertId=''){
 const glass='M105 145C105 122 72 110 72 72C72-3 188-3 188 72C188 110 155 122 155 145Z';
 const coil='M107 91'+Array.from({length:8},()=> 'c-2-12 8-12 6 0c-2 9-4 9-6 0').join('l6 0');
 return `${materials(p)}<ellipse class="bulb-aura" cx="130" cy="85" rx="125" ry="110" fill="url(#${p}-aura)"/>
 ${mount(p,20,166,220,42)}
 <path d="M82 179Q84 163 96 157H164Q176 163 178 179V188Q130 207 82 188Z" fill="url(#${p}-ivory)" stroke="#b8ceca"/>
 <ellipse cx="130" cy="179" rx="48" ry="13" fill="url(#${p}-ivory)" stroke="#e4e8d3"/>
 <ellipse cx="130" cy="166" rx="34" ry="10" fill="#16313b" stroke="#9fafaa" stroke-width="3"/>
 <g ${insertId?`id="${insertId}"`:''}>
 <path d="M104 140H156V169Q130 182 104 169Z" fill="url(#${p}-metal)" stroke="#53686e"/>
 ${[146,152,158,164].map(y=>`<path d="M105 ${y+3}Q130 ${y+8} 155 ${y-1}" fill="none" stroke="#34494f" stroke-width="2.5"/><path d="M105 ${y}Q130 ${y+5} 155 ${y-4}" fill="none" stroke="#d2dcd1" stroke-width="1.4"/>`).join('')}
 <path d="${glass}" fill="url(#${p}-glass)" stroke="#b4d7df" stroke-width="1.4"/>
 <path class="bulb-warmth" d="${glass}" fill="url(#${p}-warm)"/>
 <path d="M124 141V112Q130 104 136 112V141" fill="#bfdde025" stroke="#b4d5d15c" stroke-width="1.3"/>
 <path d="M117 145L107 92M143 145L155 92" fill="none" stroke="#7f8981" stroke-width="2"/>
 <path d="M118 142L108 94M144 142L154 94" fill="none" stroke="#dddcc0" stroke-width=".6"/>
 <path d="M130 110V100L123 91M130 100L141 91" fill="none" stroke="#a3b0a1" stroke-width="1.1"/>
 <path class="filament" d="${coil}" fill="none" stroke="#776b54" stroke-width="1.45" stroke-linecap="round"/>
 <path d="M83 77C79 48 96 26 112 25" fill="none" stroke="#efffff" stroke-width="6" stroke-linecap="round" opacity=".65"/>
 <path d="M88 65Q88 42 106 32" fill="none" stroke="#fffdf0" stroke-width="2" stroke-linecap="round" opacity=".9"/>
 <path d="M178 61Q187 87 165 112" fill="none" stroke="#d5eaf0" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>
 <path d="M111 138Q130 143 149 138" fill="none" stroke="#ebf3dc" opacity=".4"/>
 <ellipse cx="147" cy="24" rx="13" ry="3" transform="rotate(22 147 24)" fill="#e2f4ee" opacity=".35"/>
 </g>
 <g fill="url(#${p}-gold)" stroke="#ddc88d"><ellipse cx="55" cy="183" rx="12" ry="5"/><ellipse cx="205" cy="183" rx="12" ry="5"/></g>
 <path d="M48 180H62M198 180H212" stroke="#fff0bc" opacity=".7"/>`;
}

export function cellArt(p,x,y,w,h){return `<g class="cell">
 <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h*.2}" fill="url(#${p}-cell)" stroke="#cda887" stroke-width="1"/>
 <path d="M${x+w*.7} ${y}H${x+w-8}Q${x+w} ${y} ${x+w} ${y+9}V${y+h-9}Q${x+w} ${y+h} ${x+w-8} ${y+h}H${x+w*.7}Z" fill="url(#${p}-metal)"/>
 <path d="M${x+w*.69} ${y+1}V${y+h-1}" stroke="#e5d3a3" stroke-width="2"/>
 <ellipse cx="${x+3}" cy="${y+h/2}" rx="5" ry="${h/2-2}" fill="url(#${p}-metal)" stroke="#b6c6bc"/>
 <rect x="${x-9}" y="${y+h*.35}" width="11" height="${h*.3}" rx="2" fill="url(#${p}-gold)" stroke="#e9d39a"/>
 <path d="M${x+14} ${y+h*.16}H${x+w*.63}" stroke="#ffe6bd" opacity=".7" stroke-width="1.5"/>
 <path d="M${x+14} ${y+h*.84}H${x+w*.63}" stroke="#301c22" opacity=".7"/>
 <text x="${x+w*.36}" y="${y+h*.59}" text-anchor="middle" fill="#fff2ce" font-family="sans-serif" font-size="${Math.max(10,h*.22)}" font-weight="700">1.5 V</text>
 <text x="${x+12}" y="${y+h*.61}" fill="#fff3d6" font-family="sans-serif" font-size="${h*.26}" font-weight="700">+</text><text x="${x+w-12}" y="${y+h*.61}" fill="#18333c" font-family="sans-serif" font-size="${h*.3}" font-weight="700">−</text>
 </g>`;}

export function batteryArt(p){return `${materials(p)}${mount(p,14,83,252,53)}
 <path d="M40 121V78Q40 66 56 66M240 121V78Q240 66 224 66" fill="none" stroke="url(#${p}-gold)" stroke-width="8"/>
 ${cellArt(p,65,40,160,77)}<path d="M54 121H33M233 121H252" stroke="url(#${p}-gold)" stroke-width="8"/>
 <path d="M51 44V112M235 44V112" stroke="#bdbba5" stroke-width="3"/>
 <path d="M56 45V113M230 45V113" stroke="#e9e5c6" stroke-width="1" opacity=".7"/>`;}

export function switchArt(p,id=''){return `${materials(p)}${mount(p,14,80,252,55)}
 <path d="M48 111H80M209 111H243" stroke="url(#${p}-gold)" stroke-width="9"/>
 <path d="M211 100V119M229 100V119" stroke="#d1cdb1" stroke-width="4"/>
 <g class="hardware-switch" ${id?`id="${id}"`:''}>
 <path d="M64 104H230V116H64Z" fill="url(#${p}-metal)" stroke="#ced2ba"/>
 <path d="M77 106H229" stroke="#fff4ca" stroke-width="2"/>
 <path d="M163 105V84Q163 76 173 75H198Q208 76 208 84V105Z" fill="#0a1620" stroke="#b29961"/>
 <path d="M169 84Q187 79 202 84" fill="none" stroke="#6f7c75" stroke-width="3"/>
 <path d="M170 93H202M170 98H202" stroke="#000c14" stroke-width="2"/>
 </g><circle cx="64" cy="110" r="12" fill="url(#${p}-gold)" stroke="#e7d6a3"/><circle cx="64" cy="110" r="5" fill="url(#${p}-metal)"/><path d="M61 108L67 112" stroke="#344850" stroke-width="2"/>`;}
