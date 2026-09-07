const CARD_COLORS={green:{b:'#2fa040',l:'#5ac468',d:'#1a6e2a'},blue:{b:'#0014dc',l:'#3a40f0',d:'#000090'},red:{b:'#dd3125',l:'#e84838',d:'#7a0f0f'},gold:{b:'#b89a1e',l:'#e0c854',d:'#7a5a0a'},silver:{b:'#a8a8ae',l:'#cacace',d:'#787880'},taupe:{b:'#777a76',l:'#b0b2ae',d:'#5c5e5a'}};
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
  const rg=g.createRadialGradient(48,36,12,48,56,92);
  rg.addColorStop(0,'rgba(255,255,255,0.12)');rg.addColorStop(0.55,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,0.26)');
  g.fillStyle=rg;g.fillRect(0,0,96,112);
  TEX[key]=c;
}
function initTextures(){for(const k in CARD_COLORS)makeTex(k,CARD_COLORS[k].b,CARD_COLORS[k].l,CARD_COLORS[k].d);}
function cardPath(w,h){
  const ch=cardChamfer(Math.min(w,h),0.038);
  const p=new Path2D();
  p.moveTo(ch,0);p.lineTo(w-ch,0);p.lineTo(w,ch);p.lineTo(w,h-ch);
  p.lineTo(w-ch,h);p.lineTo(ch,h);p.lineTo(0,h-ch);p.lineTo(0,ch);
  p.closePath();return p;
}
