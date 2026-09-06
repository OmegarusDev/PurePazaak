const CARD_COLORS={green:{b:'#2fa040',l:'#5ac468',d:'#1a6e2a'},blue:{b:'#0a2ec0',l:'#4a5be8',d:'#082090'},red:{b:'#c71e1e',l:'#e84838',d:'#7a0f0f'},gold:{b:'#b89a1e',l:'#e0c854',d:'#7a5a0a'},silver:{b:'#a8a8ae',l:'#cacace',d:'#787880'},taupe:{b:'#9b8a6e',l:'#c2b49a',d:'#6e5d45'}};
const TEX={};
function makeTex(key,base,light,dark){
  const c=document.createElement('canvas');c.width=96;c.height=112;const g=c.getContext('2d');
  const horizontal=key==='blue'||key==='red'||key==='green';
  const lg=horizontal?g.createLinearGradient(0,0,96,0):g.createLinearGradient(0,0,0,112);
  if(horizontal){
    lg.addColorStop(0,shade(base,-8));lg.addColorStop(0.5,shade(base,10));lg.addColorStop(1,shade(base,-12));
  }else{
    lg.addColorStop(0,light);lg.addColorStop(0.45,base);lg.addColorStop(1,dark);
  }
  g.fillStyle=lg;g.fillRect(0,0,96,112);
  for(let i=0;i<112;i++){if(Math.random()<0.80){const a=Math.random()*(horizontal?0.05:0.06);
    g.strokeStyle=Math.random()<0.5?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a*1.3})`;
    g.beginPath();
    if(horizontal){g.moveTo(0,i+0.5);g.lineTo(96,i+0.5);}else{g.moveTo(0.5+i%96,0);g.lineTo(0.5+i%96,112);}
    g.stroke();}}
  const rg=g.createRadialGradient(48,48,18,48,56,92);
  rg.addColorStop(0,'rgba(255,255,255,0.08)');rg.addColorStop(0.7,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,0.22)');
  g.fillStyle=rg;g.fillRect(0,0,96,112);
  TEX[key]=c;
}
function initTextures(){for(const k in CARD_COLORS)makeTex(k,CARD_COLORS[k].b,CARD_COLORS[k].l,CARD_COLORS[k].d);}
function cardPath(w,h){
  return rrPath(w,h,Math.min(w,h)*0.045);
}
