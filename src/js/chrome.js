function brushed(g,x,y,w,h,base,vertical){
  g.save();
  const gr=vertical?g.createLinearGradient(x,y,x+w,y):g.createLinearGradient(x,y,x,y+h);
  gr.addColorStop(0,shade(base,-6));gr.addColorStop(0.5,shade(base,4));gr.addColorStop(1,shade(base,-10));
  g.fillStyle=gr;g.fillRect(x,y,w,h);
  const n=Math.round(vertical?w:h);
  for(let i=0;i<n;i++){if(Math.random()<0.8){const a=Math.random()*0.05;
    g.strokeStyle=Math.random()<0.5?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a*1.4})`;
    g.beginPath();
    if(vertical){g.moveTo(x+i+0.5,y);g.lineTo(x+i+0.5,y+h);}else{g.moveTo(x,y+i+0.5);g.lineTo(x+w,y+i+0.5);}
    g.stroke();}}
  g.restore();
}
function drawRivet(g,x,y){
  const gr=g.createRadialGradient(x-1.5,y-1.5,0.5,x,y,5.5);
  gr.addColorStop(0,'#c8c8d0');gr.addColorStop(0.6,'#6a6a74');gr.addColorStop(1,'#2a2a30');
  g.beginPath();g.arc(x,y,5,0,7);g.fillStyle=gr;g.fill();
  g.strokeStyle='rgba(0,0,0,0.6)';g.lineWidth=1;g.stroke();
  g.beginPath();g.arc(x-1.5,y-1.8,1.1,0,7);g.fillStyle='rgba(255,255,255,0.7)';g.fill();
}
function drawFrame(g){
  // Authentic KOTOR brushed outside + inner frame
  brushed(g,0,0,W,H,'#8a8a8e',false);
  const f=L.frame;
  g.save();rr(g,f.x,f.y,f.w,f.h,f.r);g.clip();
  const gr=g.createLinearGradient(0,f.y,0,f.y+f.h);
  gr.addColorStop(0,'#9a9aa2');gr.addColorStop(0.15,'#7a7a82');gr.addColorStop(0.5,'#5e5e66');gr.addColorStop(1,'#4a4a52');
  g.fillStyle=gr;g.fillRect(f.x,f.y,f.w,f.h);
  for(let y=f.y;y<f.y+f.h;y++){if(Math.random()<0.45){const a=Math.random()*0.035;
    g.strokeStyle=Math.random()<0.5?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a*1.2})`;
    g.beginPath();g.moveTo(f.x,y+0.5);g.lineTo(f.x+f.w,y+0.5);g.stroke();}}
  // inner bevel
  rr(g,f.x+10,f.y+10,f.w-20,f.h-20,f.r-7);g.fillStyle='rgba(0,0,0,0.14)';g.fill();
  g.strokeStyle='rgba(255,255,255,0.06)';g.lineWidth=1;g.stroke();
  g.restore();
  g.strokeStyle='rgba(200,200,212,0.45)';g.lineWidth=2;rr(g,f.x,f.y,f.w,f.h,f.r);g.stroke();
  g.strokeStyle='rgba(0,0,0,0.55)';g.lineWidth=1;rr(g,f.x+2,f.y+2,f.w-4,f.h-4,f.r-2);g.stroke();
  drawRivet(g,f.x+16,f.y+16);drawRivet(g,f.x+f.w-16,f.y+16);
  drawRivet(g,f.x+16,f.y+f.h-16);drawRivet(g,f.x+f.w-16,f.y+f.h-16);
}
function drawSlot(g,rct){
  const gr=g.createLinearGradient(0,rct.y,0,rct.y+rct.h);
  gr.addColorStop(0,'#232327');gr.addColorStop(1,'#2d2d32');
  rr(g,rct.x,rct.y,rct.w,rct.h,6);g.fillStyle=gr;g.fill();
  g.strokeStyle='#131316';g.lineWidth=1;g.stroke();
  g.strokeStyle='rgba(255,255,255,0.07)';
  g.beginPath();g.moveTo(rct.x+4,rct.y+1.5);g.lineTo(rct.x+rct.w-4,rct.y+1.5);g.stroke();
}
function drawVentDecor(g,x,y){
  rr(g,x,y,22,24,4);g.fillStyle='#101013';g.fill();g.strokeStyle='#2c2c32';g.lineWidth=1;g.stroke();
  g.save();g.shadowColor='#ff8c30';g.shadowBlur=4;g.fillStyle='#c85818';
  for(let i=0;i<4;i++)g.fillRect(x+4+i*5,y+4,2.6,16);
  g.restore();
}
function drawCircleDecor(g,cxs,cy,litIdx){
  cxs.forEach((cx,i)=>{
    g.beginPath();g.arc(cx,cy,5.5,0,7);g.fillStyle='#141417';g.fill();
    g.strokeStyle=i===litIdx?'#c85818':'#3e3e46';g.lineWidth=1.5;g.stroke();
    if(i===litIdx){g.beginPath();g.arc(cx,cy,2.2,0,7);g.fillStyle='#ff9c40';g.fill();}
  });
}
function drawOrb(g,c,r,state,now){
  const cols={green:['#c8ffc8','#3fae4a','#0c3a14'],amber:['#ffe8b0','#e8a41f','#4a3008'],red:['#ffc0c0','#d03030','#4a0c0c'],idle:['#a8a8b0','#42424a','#101014']};
  const cc=cols[state]||cols.idle,active=state!=='idle';
  g.save();
  if(active){g.shadowColor=cc[1];g.shadowBlur=8+4*Math.sin(now/280);}
  const gr=g.createRadialGradient(c.x-r*0.35,c.y-r*0.4,r*0.15,c.x,c.y,r);
  gr.addColorStop(0,cc[0]);gr.addColorStop(0.55,cc[1]);gr.addColorStop(1,cc[2]);
  g.beginPath();g.arc(c.x,c.y,r,0,7);g.fillStyle=gr;g.fill();
  g.shadowBlur=0;g.strokeStyle='rgba(10,10,12,0.8)';g.lineWidth=1.5;g.stroke();
  g.beginPath();g.ellipse(c.x-r*0.3,c.y-r*0.45,r*0.28,r*0.18,-0.6,0,7);g.fillStyle='rgba(255,255,255,0.55)';g.fill();
  g.restore();
}
function drawChannel(g,ch,lights,now){
  rr(g,ch.x,ch.y,ch.w,ch.h,10);g.fillStyle='rgba(0,0,0,0.28)';g.fill();
  g.strokeStyle='rgba(0,0,0,0.5)';g.lineWidth=1;g.stroke();
  g.strokeStyle='rgba(255,255,255,0.06)';
  g.beginPath();g.moveTo(ch.x+2,ch.y+8);g.lineTo(ch.x+2,ch.y+ch.h-8);g.stroke();
  const r=Math.min(7,Math.max(4,ch.w*0.32));
  for(let i=0;i<3;i++){
    const cy=ch.y+ch.h*(0.2+0.3*i),cx=ch.x+ch.w/2,st=lights[i];
    if(st==='off'){g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle='#141417';g.fill();g.strokeStyle='#3a3a42';g.lineWidth=1;g.stroke();}
    else drawOrb(g,{x:cx,y:cy},r,st,now);
  }
}
function drawBadge(g,b,score,flashT,now){
  const flash=now-flashT<450;
  g.save();
  g.shadowColor=flash?'#ffb060':'#ff8c30';g.shadowBlur=flash?14:7;
  rr(g,b.x,b.y,L.bw,L.bh,7);g.fillStyle='#0b0b0d';g.fill();
  g.strokeStyle=flash?'#ffc880':'#e87020';g.lineWidth=2;g.stroke();
  g.shadowBlur=0;
  rr(g,b.x+3,b.y+3,L.bw-6,L.bh-6,4);g.strokeStyle='rgba(255,140,48,0.35)';g.lineWidth=1;g.stroke();
  g.fillStyle='#e87020';
  g.fillRect(b.x-13,b.y+L.bh/2-2,9,4);
  g.fillRect(b.x+L.bw+4,b.y+L.bh/2-2,9,4);
  g.restore();
  g.fillStyle='#fff';g.font='700 '+Math.max(11,Math.round(L.bh*0.61))+'px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';
  g.fillText(String(score),b.x+L.bw/2,b.y+L.bh/2+1);
}
