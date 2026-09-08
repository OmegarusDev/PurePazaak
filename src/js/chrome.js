function tableTier(){return (M&&M.opp&&M.opp.tier)||2;}
function tableSeed(){
  const n=(M&&M.opp&&M.opp.name)||'table';
  let h=tableTier()*2654435761;
  for(let i=0;i<n.length;i++)h=(h*33^n.charCodeAt(i))>>>0;
  return h;
}
function tableSkin(){
  const t=tableTier();
  if(t>=3)return {
    outer:'#c0c0cc',inner0:'#d8d8e4',inner1:'#a8a8b6',inner2:'#7a7a88',
    grain:0.38,grainA:0.03,shine:0.42,grime:0,
    slot0:'#101016',slot1:'#24242c',slotStroke:'#08080c',
    bevelHi:0.34,bevelLo:0.18,rim:'rgba(248,248,255,0.78)',
    rivetL:'#f4f4fc',rivetM:'#9a9aa8',rivetD:'#2a2a34',
    plate:'#08080c',name:'#f3efe6',lab:'#d8c070',
    deco:true,chrome:true
  };
  if(t===2)return {
    outer:'#9a9aa2',inner0:'#c4c4cc',inner1:'#8e8e98',inner2:'#686870',
    grain:0.48,grainA:0.036,shine:0.1,grime:0.015,
    slot0:'#18181e',slot1:'#2a2a32',slotStroke:'#101014',
    bevelHi:0.18,bevelLo:0.16,rim:'rgba(210,210,220,0.55)',
    rivetL:'#d0d0d8',rivetM:'#72727c',rivetD:'#2a2a30',
    plate:'#0a0a0c',name:'#f3efe6',lab:'#d4b44a',
    deco:true,chrome:false
  };
  return {
    outer:'#6e6458',inner0:'#8a7e70',inner1:'#5c5448',inner2:'#3c362e',
    grain:0.86,grainA:0.07,shine:0,grime:0.48,
    slot0:'#140f0b',slot1:'#221c16',slotStroke:'#0a0705',
    bevelHi:0.08,bevelLo:0.3,rim:'rgba(168,152,128,0.32)',
    rivetL:'#b09880',rivetM:'#5a4c40',rivetD:'#201a14',
    plate:'#0c0a08',name:'#e8dcc0',lab:'#c8b070',
    deco:false,chrome:false
  };
}
function brushed(g,x,y,w,h,base,vertical,rng,dens,amp){
  rng=rng||Math.random;dens=dens==null?0.8:dens;amp=amp==null?0.05:amp;
  g.save();
  const gr=vertical?g.createLinearGradient(x,y,x+w,y):g.createLinearGradient(x,y,x,y+h);
  gr.addColorStop(0,shade(base,-8));gr.addColorStop(0.5,shade(base,6));gr.addColorStop(1,shade(base,-12));
  g.fillStyle=gr;g.fillRect(x,y,w,h);
  const n=Math.round(vertical?w:h);
  for(let i=0;i<n;i++){if(rng()<dens){const a=rng()*amp;
    g.strokeStyle=rng()<0.5?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a*1.5})`;
    g.beginPath();
    if(vertical){g.moveTo(x+i+0.5,y);g.lineTo(x+i+0.5,y+h);}else{g.moveTo(x,y+i+0.5);g.lineTo(x+w,y+i+0.5);}
    g.stroke();}}
  g.restore();
}
function stainWell(g,x,y,w,h,r,amt,rng){
  if(amt<=0)return;
  g.save();rr(g,x,y,w,h,r);g.clip();
    const spots=Math.round(10+rng()*22);
  for(let i=0;i<spots;i++){
    const sx=x+rng()*w,sy=y+rng()*h,rad=8+rng()*36;
    const gd=g.createRadialGradient(sx,sy,0,sx,sy,rad);
    gd.addColorStop(0,`rgba(22,12,6,${amt*(0.35+rng()*0.55)})`);
    gd.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gd;g.beginPath();g.arc(sx,sy,rad,0,7);g.fill();
  }
  g.strokeStyle=`rgba(10,6,2,${amt*0.55})`;
  const n=Math.round(amt*55);
  for(let i=0;i<n;i++){
    g.lineWidth=0.35+rng()*0.9;
    const x0=x+rng()*w,y0=y+rng()*h;
    g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+(rng()-0.25)*70,y0+(rng()-0.5)*5);g.stroke();
  }
  g.restore();
}
function polishSheen(g,x,y,w,h,r,amt){
  if(amt<=0)return;
  g.save();rr(g,x,y,w,h,r);g.clip();
  const gr=g.createLinearGradient(x,y,x+w*0.85,y+h);
  gr.addColorStop(0,'rgba(255,255,255,0)');
  gr.addColorStop(0.36,`rgba(210,225,255,${amt*0.03})`);
  gr.addColorStop(0.5,`rgba(255,255,255,${amt*0.16})`);
  gr.addColorStop(0.64,`rgba(210,225,255,${amt*0.03})`);
  gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(x,y,w,h);
  g.restore();
}
function drawRivet(g,x,y,sk){
  sk=sk||tableSkin();
  const gr=g.createRadialGradient(x-1.5,y-1.5,0.5,x,y,5.5);
  gr.addColorStop(0,sk.rivetL);gr.addColorStop(0.55,sk.rivetM);gr.addColorStop(1,sk.rivetD);
  g.beginPath();g.arc(x,y,5,0,7);g.fillStyle=gr;g.fill();
  g.strokeStyle='rgba(0,0,0,0.55)';g.lineWidth=1;g.stroke();
  g.beginPath();g.arc(x-1.5,y-1.8,1.1,0,7);g.fillStyle=sk.chrome?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.65)';g.fill();
}
function drawFrame(g){
  const sk=tableSkin(),rng=mulberry(tableSeed()),f=L.frame;
  brushed(g,0,0,W,H,sk.outer,false,rng,sk.grain,sk.grainA);
  if(sk.grime>0.08)stainWell(g,0,0,W,H,0,sk.grime*0.45,rng);
  g.save();rr(g,f.x,f.y,f.w,f.h,f.r);g.clip();
  const gr=g.createLinearGradient(0,f.y,0,f.y+f.h);
  gr.addColorStop(0,sk.inner0);gr.addColorStop(0.18,sk.inner1);gr.addColorStop(0.55,sk.inner2);gr.addColorStop(1,shade(sk.inner2,-10));
  g.fillStyle=gr;g.fillRect(f.x,f.y,f.w,f.h);
  brushed(g,f.x,f.y,f.w,f.h,sk.inner1,false,rng,sk.grain*0.85,sk.grainA*0.8);
  stainWell(g,f.x,f.y,f.w,f.h,f.r,sk.grime,rng);
  polishSheen(g,f.x,f.y,f.w,f.h,f.r,sk.shine);
  const bv=g.createLinearGradient(0,f.y,0,f.y+f.h);
  bv.addColorStop(0,`rgba(255,255,255,${sk.bevelHi})`);
  bv.addColorStop(0.035,'rgba(255,255,255,0)');
  bv.addColorStop(0.965,'rgba(0,0,0,0)');
  bv.addColorStop(1,`rgba(0,0,0,${0.35+sk.bevelLo})`);
  g.fillStyle=bv;g.fillRect(f.x,f.y,f.w,f.h);
  const bh=g.createLinearGradient(f.x,0,f.x+f.w,0);
  bh.addColorStop(0,`rgba(255,255,255,${sk.bevelHi*0.45})`);
  bh.addColorStop(0.03,'rgba(255,255,255,0)');
  bh.addColorStop(0.97,'rgba(0,0,0,0)');
  bh.addColorStop(1,`rgba(0,0,0,${0.22+sk.bevelLo*0.5})`);
  g.fillStyle=bh;g.fillRect(f.x,f.y,f.w,f.h);
  if(!PORTRAIT){
    const cx=f.x+f.w/2,y0=f.y+28,h0=f.h-56;
    const rg=g.createLinearGradient(cx-3,0,cx+3,0);
    rg.addColorStop(0,`rgba(255,255,255,${0.08+sk.bevelHi})`);
    rg.addColorStop(0.45,sk.inner0);
    rg.addColorStop(1,`rgba(0,0,0,${0.28+sk.bevelLo})`);
    g.fillStyle='rgba(0,0,0,0.22)';g.fillRect(cx-3.5,y0,7,h0);
    g.fillStyle=rg;g.fillRect(cx-2.2,y0,4.4,h0);
  }
  g.restore();
  g.strokeStyle=sk.rim;g.lineWidth=sk.chrome?2.4:2;rr(g,f.x,f.y,f.w,f.h,f.r);g.stroke();
  g.strokeStyle=`rgba(0,0,0,${0.5+sk.bevelLo})`;g.lineWidth=1;rr(g,f.x+2,f.y+2,f.w-4,f.h-4,f.r-2);g.stroke();
  if(sk.chrome){
    g.strokeStyle='rgba(255,255,255,0.18)';g.lineWidth=1;
    rr(g,f.x+5,f.y+5,f.w-10,f.h-10,f.r-4);g.stroke();
  }
  drawRivet(g,f.x+16,f.y+16,sk);drawRivet(g,f.x+f.w-16,f.y+16,sk);
  drawRivet(g,f.x+16,f.y+f.h-16,sk);drawRivet(g,f.x+f.w-16,f.y+f.h-16,sk);
}
function drawSlot(g,rct){
  const sk=tableSkin(),rng=mulberry(tableSeed()^(Math.round(rct.x)*17+Math.round(rct.y)*31));
  const x=rct.x,y=rct.y,w=rct.w,h=rct.h,rad=3;
  const lip=Math.max(3.2,Math.min(w,h)*0.11);
  rr(g,x,y,w,h,rad);g.fillStyle=sk.slotStroke;g.fill();
  const x2=x+lip,y2=y+lip,w2=w-2*lip,h2=h-2*lip;
  g.beginPath();g.moveTo(x+rad,y);g.lineTo(x+w-rad,y);g.lineTo(x2+w2,y2);g.lineTo(x2,y2);g.closePath();
  g.fillStyle=`rgba(255,255,255,${0.08+sk.bevelHi})`;g.fill();
  g.beginPath();g.moveTo(x,y+rad);g.lineTo(x2,y2);g.lineTo(x2,y2+h2);g.lineTo(x,y+h-rad);g.closePath();
  g.fillStyle=`rgba(255,255,255,${0.04+sk.bevelHi*0.45})`;g.fill();
  g.beginPath();g.moveTo(x+w,y+rad);g.lineTo(x+w,y+h-rad);g.lineTo(x2+w2,y2+h2);g.lineTo(x2+w2,y2);g.closePath();
  g.fillStyle=`rgba(0,0,0,${0.28+sk.bevelLo})`;g.fill();
  g.beginPath();g.moveTo(x+rad,y+h);g.lineTo(x+w-rad,y+h);g.lineTo(x2+w2,y2+h2);g.lineTo(x2,y2+h2);g.closePath();
  g.fillStyle=`rgba(0,0,0,${0.4+sk.bevelLo})`;g.fill();
  rr(g,x2,y2,w2,h2,Math.max(1,rad-1));
  const gr=g.createLinearGradient(x2,y2,x2+w2*0.2,y2+h2);
  gr.addColorStop(0,sk.slot0);gr.addColorStop(1,sk.slot1);
  g.fillStyle=gr;g.fill();
  g.save();rr(g,x2,y2,w2,h2,Math.max(1,rad-1));g.clip();
  stainWell(g,x2,y2,w2,h2,2,sk.grime*0.85,rng);
  if(sk.shine>0.1)polishSheen(g,x2,y2,w2,h2,2,sk.shine*0.22);
  g.restore();
  g.strokeStyle=sk.slotStroke;g.lineWidth=1;rr(g,x,y,w,h,rad);g.stroke();
}
function drawVentDecor(g,x,y){
  const sk=tableSkin();
  rr(g,x,y,22,24,4);g.fillStyle=sk.plate;g.fill();g.strokeStyle=sk.slotStroke;g.lineWidth=1;g.stroke();
  g.save();g.shadowColor=sk.chrome?'#ffb060':'#ff8c30';g.shadowBlur=sk.chrome?6:4;g.fillStyle=sk.chrome?'#e07028':'#c85818';
  for(let i=0;i<4;i++)g.fillRect(x+4+i*5,y+4,2.6,16);
  g.restore();
}
function drawCircleDecor(g,cxs,cy,litIdx){
  const sk=tableSkin();
  cxs.forEach((cx,i)=>{
    g.beginPath();g.arc(cx,cy,5.5,0,7);g.fillStyle=sk.slot0;g.fill();
    g.strokeStyle=i===litIdx?'#c85818':sk.chrome?'#6a6a78':'#3e3e46';g.lineWidth=1.5;g.stroke();
    if(i===litIdx){g.beginPath();g.arc(cx,cy,2.2,0,7);g.fillStyle='#ff9c40';g.fill();}
  });
}
function drawOrb(g,c,r,state,now){
  const cols={green:['#c8ffc8','#3fae4a','#0c3a14'],amber:['#ffe8b0','#e8a41f','#4a3008'],red:['#ffc0c0','#d03030','#4a0c0c'],idle:['#a8a8b0','#42424a','#101014']};
  const cc=cols[state]||cols.idle,active=state!=='idle';
  g.save();
  if(active){g.shadowColor=cc[1];g.shadowBlur=Math.min(r*0.65,6+3*Math.sin(now/280));}
  const gr=g.createRadialGradient(c.x-r*0.35,c.y-r*0.4,r*0.15,c.x,c.y,r);
  gr.addColorStop(0,cc[0]);gr.addColorStop(0.55,cc[1]);gr.addColorStop(1,cc[2]);
  g.beginPath();g.arc(c.x,c.y,r,0,7);g.fillStyle=gr;g.fill();
  g.shadowBlur=0;g.strokeStyle='rgba(10,10,12,0.8)';g.lineWidth=1.5;g.stroke();
  g.beginPath();g.ellipse(c.x-r*0.3,c.y-r*0.45,r*0.28,r*0.18,-0.6,0,7);g.fillStyle='rgba(255,255,255,0.55)';g.fill();
  g.restore();
}
function drawChannel(g,ch,lights,now){
  const sk=tableSkin();
  rr(g,ch.x,ch.y,ch.w,ch.h,8);g.fillStyle=`rgba(0,0,0,${0.32+sk.grime*0.2})`;g.fill();
  g.strokeStyle=`rgba(0,0,0,${0.55+sk.grime})`;g.lineWidth=1;g.stroke();
  g.strokeStyle=`rgba(255,255,255,${sk.bevelHi*0.5})`;
  g.beginPath();g.moveTo(ch.x+2,ch.y+8);g.lineTo(ch.x+2,ch.y+ch.h-8);g.stroke();
  const r=Math.min(7,Math.max(4,ch.w*0.32));
  for(let i=0;i<3;i++){
    const cy=ch.y+ch.h*(0.2+0.3*i),cx=ch.x+ch.w/2,st=lights[i];
    if(st==='off'){g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle=sk.slot0;g.fill();g.strokeStyle=sk.chrome?'#5a5a66':'#3a3a42';g.lineWidth=1;g.stroke();}
    else drawOrb(g,{x:cx,y:cy},r,st,now);
  }
}
function drawBadge(g,b,score,flashT,now){
  const flash=now-flashT<450;
  const rad=Math.max(3,L.bh*0.22);
  const pipeW=Math.max(4,L.bw*0.16), pipeH=Math.max(2,L.bh*0.12), pipeGap=Math.max(2,L.bw*0.06);
  g.save();
  g.shadowColor=flash?'#ffb060':'#ff8c30';g.shadowBlur=flash?14:7;
  rr(g,b.x,b.y,L.bw,L.bh,rad);g.fillStyle='#0b0b0d';g.fill();
  g.strokeStyle=flash?'#ffc880':'#e87020';g.lineWidth=2;g.stroke();
  g.shadowBlur=0;
  rr(g,b.x+3,b.y+3,L.bw-6,L.bh-6,Math.max(2,rad-2));g.strokeStyle='rgba(255,140,48,0.35)';g.lineWidth=1;g.stroke();
  g.fillStyle='#e87020';
  g.fillRect(b.x-pipeW-pipeGap,b.y+L.bh/2-pipeH/2,pipeW,pipeH);
  g.fillRect(b.x+L.bw+pipeGap,b.y+L.bh/2-pipeH/2,pipeW,pipeH);
  g.restore();
  g.fillStyle='#fff';g.font='700 '+Math.max(11,Math.round(L.bh*0.61))+'px '+HUD_FONT;g.textAlign='center';g.textBaseline='middle';
  g.fillText(String(score),b.x+L.bw/2,b.y+L.bh/2+1);
}
function drawTableButton(g,r,label,opts){
  if(!r)return;
  const o=opts||{}, dim=!!o.dim, lit=!!o.lit, ghost=!!o.ghost;
  const cyan='#5eb0dc', cyanRim='#457eb5', gold='#ffe14d', mute='#3a4a58';
  g.save();
  rr(g,r.x,r.y,r.w,r.h,Math.max(4,Math.round(r.h*0.14)));
  const gr=g.createLinearGradient(0,r.y,0,r.y+r.h);
  if(ghost){
    gr.addColorStop(0,'#1a1418');gr.addColorStop(1,'#0a0608');
  }else if(lit){
    gr.addColorStop(0,'#2a2818');gr.addColorStop(0.55,'#14120c');gr.addColorStop(1,'#0a0906');
  }else{
    gr.addColorStop(0,dim?'#14181e':'#1b1e25');gr.addColorStop(1,'#0a0c10');
  }
  g.fillStyle=gr;g.fill();
  g.strokeStyle=lit?gold:ghost?'#8a4040':dim?mute:cyanRim;
  g.lineWidth=lit?2:1.4;g.stroke();
  rr(g,r.x+2,r.y+2,r.w-4,r.h-4,Math.max(3,Math.round(r.h*0.1)));
  g.strokeStyle=lit?'rgba(255,225,77,0.28)':ghost?'rgba(180,80,80,0.2)':'rgba(120,180,230,0.28)';
  g.lineWidth=1;g.stroke();
  const col=dim?'#4a6070':ghost?'#c07070':lit?gold:cyan;
  const hint=o.hint, hintW=hint?Math.max(hint==='space'?22:18,r.h*(hint==='space'?0.95:0.82)):0;
  tText(g,label,r.x+(r.w-hintW)/2,r.y+r.h/2+1,Math.max(10,Math.round(r.h*(hint?0.34:0.38))),col,1,'center',true,1);
  if(hint)drawKeyHint(g,r.x+r.w-hintW/2-3,r.y+r.h/2+0.5,hint,col,r.h);
  g.restore();
}
