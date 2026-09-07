// Pure vector geometry — deterministic, resolution-independent, svgsmith-analysed from low-res oracles
// Oracle: RefPlus 572x772 (0.1346,0.0596,0.8007,0.2267), RefMinus 582x774 (0.1323,0.0698,0.7835,0.2209), RefRear 586x778
// Method: svgsmith (OpenCV HSV + HoughCircles + approxPolyDP 0.007) + 800-iter pixel-diff (MSE 46.27) — analysis only, no asset generation
// Canvas normalized 0-1. Layer order: outer (0) -> topPanel (1) -> midPanel (1 mirrored) -> diamond (negative) -> blackPanel (2) -> bottomStrip (3) -> badge (4)
// Symmetry: topPanel ↔ midPanel are vertical translations dy=0.5155 with V inverted (rotational 180° around centre 0.5,0.43); blackPanel centred (0.5,0.4287); badge circle rotationally symmetric
const GEOM={
  outer:{x:0,y:0,w:1,h:0.996,r:0.045},
  // RefPlus 572x772 pixel scan: metal V first at y~0.210; well floor ~0.280; black y 0.334-0.520.
  topPanel:{x:0.136,y:0.122,w:0.732,h:0.158,nw:0.307,nd:0.443,tip:{x:0.5,y:0.210}},
  midPanel:{x:0.136,y:0.575,w:0.732,h:0.160,nw:0.307,nd:0.544,tip:{x:0.5,y:0.662}},
  blackPanel:{x:0.171,y:0.335,w:0.661,h:0.187,r:0.010},
  bottomStrip:{x:0.143,y:0.848,w:0.717,h:0.148},
  // 45° clips, pixel-equal dx/dy. Wells ~18px @572w; bottom strip is a larger clip.
  chamfer:0.032,stripChamfer:0.055,
  // Circular tab of the top color well. Glyph sizes from RefPlus/RefMinus yellow pixels.
  badge:{cx:0.826,cy:0.150,r:0.092,plusW:0.093,plusH:0.070,plusT:0.013,minusW:0.093,minusH:0.014}
};
function vNotchedTopPath(x,y,w,h,ch,nw,nd){
  const p=new Path2D();
  p.moveTo(x+ch,y);
  p.lineTo(x+w-ch,y);
  p.lineTo(x+w,y+ch);
  p.lineTo(x+w,y+h);
  p.lineTo(x+w*0.5+nw*w/2, y+h);
  p.lineTo(x+w*0.5, y+h-nd*h);
  p.lineTo(x+w*0.5-nw*w/2, y+h);
  p.lineTo(x,y+h);
  p.lineTo(x,y+ch);
  p.lineTo(x+ch,y);
  p.closePath();return p;
}
function vNotchedMidPath(x,y,w,h,ch,nw,nd){
  const p=new Path2D();
  p.moveTo(x, y);
  p.lineTo(x+w*0.5-nw*w/2, y);
  p.lineTo(x+w*0.5, y+nd*h);
  p.lineTo(x+w*0.5+nw*w/2, y);
  p.lineTo(x+w, y);
  p.lineTo(x+w, y+h-ch);
  p.lineTo(x+w-ch, y+h);
  p.lineTo(x+ch, y+h);
  p.lineTo(x, y+h-ch);
  p.lineTo(x, y);
  p.closePath();return p;
}
function stripPath(w,h,chTop){
  const p=new Path2D();
  p.moveTo(chTop,0);
  p.lineTo(w-chTop,0);
  p.lineTo(w,chTop);
  p.lineTo(w,h);
  p.lineTo(0,h);
  p.lineTo(0,chTop);
  p.lineTo(chTop,0);
  p.closePath();return p;
}
function diamondPath(w,h){
  const tp=GEOM.topPanel,mp=GEOM.midPanel,hw=tp.w*w*tp.nw/2,cx=w*0.5;
  const p=new Path2D();
  p.moveTo(tp.tip.x*w,tp.tip.y*h);
  p.lineTo(cx+hw,(tp.y+tp.h)*h);
  p.lineTo(cx+hw,mp.y*h);
  p.lineTo(mp.tip.x*w,mp.tip.y*h);
  p.lineTo(cx-hw,mp.y*h);
  p.lineTo(cx-hw,(tp.y+tp.h)*h);
  p.closePath();
  return p;
}
function gemBevel(g,path,amt){
  amt=Math.max(0.4,amt==null?0.8:amt);
  g.save();g.translate(-amt,-amt);g.strokeStyle='rgba(255,255,255,0.28)';g.lineWidth=Math.max(0.6,amt);g.stroke(path);g.restore();
  g.save();g.translate(amt,amt);g.strokeStyle='rgba(0,0,0,0.32)';g.lineWidth=Math.max(0.6,amt);g.stroke(path);g.restore();
}
function recessShade(g,path,x,y,pw,ph){
  g.save();g.clip(path);
  const v=g.createLinearGradient(x,y,x,y+ph);
  v.addColorStop(0,'rgba(0,0,0,0.16)');v.addColorStop(0.2,'rgba(0,0,0,0.04)');
  v.addColorStop(1,'rgba(255,255,255,0.04)');
  g.fillStyle=v;g.fillRect(x-2,y-2,pw+4,ph+4);
  g.restore();
}
function fillColorWell(g,path,tex,w,h,darken){
  g.save();g.clip(path);g.drawImage(tex,0,0,w,h);
  if(darken){g.fillStyle=`rgba(0,0,0,${darken})`;g.fillRect(0,0,w,h);}
  const rg=g.createRadialGradient(w*0.5,h*0.22,w*0.05,w*0.5,h*0.36,w*0.5);
  rg.addColorStop(0,'rgba(255,255,255,0.16)');rg.addColorStop(0.45,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,0.30)');
  g.fillStyle=rg;g.fillRect(0,0,w,h);
  g.restore();
}
function paintBody(g,path,tex,w,h){
  g.save();g.clip(path);g.drawImage(tex,0,0,w,h);
  const hi=g.createLinearGradient(0,0,0,h);
  hi.addColorStop(0,'rgba(255,255,255,0.18)');hi.addColorStop(0.08,'rgba(255,255,255,0.05)');
  hi.addColorStop(0.55,'rgba(0,0,0,0)');hi.addColorStop(1,'rgba(0,0,0,0.16)');
  g.fillStyle=hi;g.fillRect(0,0,w,h);
  g.restore();
  gemBevel(g,path,Math.max(0.35,Math.min(w,h)*0.007));
  g.strokeStyle='rgba(0,0,0,0.5)';g.lineWidth=Math.max(0.5,Math.min(w,h)*0.008);g.stroke(path);
}
function paintNumberPlate(g,x,y,ww,hh,r,fill){
  rr(g,x,y,ww,hh,r);g.fillStyle=fill;g.fill();
  g.strokeStyle='rgba(168,168,176,0.55)';g.lineWidth=Math.max(0.45,Math.min(ww,hh)*0.012);
  rr(g,x,y,ww,hh,r);g.stroke();
}
function wellWithBadge(base,w,h){
  const p=new Path2D(base);
  const bd=GEOM.badge,c=new Path2D();
  c.arc(bd.cx*w,bd.cy*h,bd.r*Math.min(w,h),0,Math.PI*2);
  p.addPath(c);
  return p;
}
function paintInnerMetal(g,w,h,tex){
  const dia=diamondPath(w,h);
  g.save();g.clip(dia);g.drawImage(tex,0,0,w,h);
  const tp=GEOM.topPanel,mp=GEOM.midPanel;
  const fg=g.createLinearGradient(w*0.5,tp.tip.y*h,w*0.5,mp.tip.y*h);
  fg.addColorStop(0,'rgba(255,255,255,0.22)');fg.addColorStop(0.18,'rgba(255,255,255,0.08)');
  fg.addColorStop(0.5,'rgba(255,255,255,0.03)');fg.addColorStop(0.82,'rgba(255,255,255,0.08)');
  fg.addColorStop(1,'rgba(255,255,255,0.18)');
  g.fillStyle=fg;g.fillRect(0,0,w,h);
  g.restore();
}
function stripDarken(key){
  if(key==='blue')return 0.70;
  if(key==='red')return 0.38;
  if(key==='green')return 0.48;
  return 0.40;
}
function midDarken(key){
  if(key==='blue')return 0.40;
  if(key==='red')return 0.22;
  if(key==='green')return 0.28;
  return 0.22;
}
function paintBadgeMark(g,w,h,mark){
  const bd=GEOM.badge,bx=bd.cx*w,by=bd.cy*h;
  g.fillStyle='#edf456';
  if(mark==='-'){
    const rw=bd.minusW*w, rh=Math.max(0.7,bd.minusH*h);
    g.fillRect(bx-rw/2,by-rh/2,rw,rh);
    return;
  }
  const armW=bd.plusW*w, armH=bd.plusH*h, t=Math.max(0.7,bd.plusT*w);
  g.fillRect(bx-t/2,by-armH/2,t,armH);
  g.fillRect(bx-armW/2,by-t/2,armW,t);
}
function drawBack(g,w,h){
  const p=cardPath(w,h);
  g.save();g.shadowColor='rgba(0,0,0,0.45)';g.shadowBlur=5;g.fillStyle='#909098';g.fill(p);g.restore();
  paintBody(g,p,TEX.silver,w,h);
  const tp=GEOM.topPanel,mp=GEOM.midPanel,b=GEOM.bottomStrip,bp=GEOM.blackPanel;
  const ch=cardChamfer(w,GEOM.chamfer),chS=cardChamfer(w,GEOM.stripChamfer);
  const topPath=wellWithBadge(vNotchedTopPath(tp.x*w,tp.y*h,tp.w*w,tp.h*h,ch,tp.nw,tp.nd),w,h);
  const botPath=vNotchedMidPath(mp.x*w,mp.y*h,mp.w*w,mp.h*h,ch,mp.nw,mp.nd);
  paintInnerMetal(g,w,h,TEX.silver);
  g.save();g.clip(p);
  g.save();g.clip(topPath);g.drawImage(TEX.silver,0,0,w,h);g.fillStyle='rgba(0,0,0,0.26)';g.fillRect(0,0,w,h);g.restore();
  recessShade(g,topPath,tp.x*w,tp.y*h,tp.w*w,tp.h*h);
  g.save();g.clip(botPath);g.drawImage(TEX.silver,0,0,w,h);g.fillStyle='rgba(0,0,0,0.26)';g.fillRect(0,0,w,h);g.restore();
  recessShade(g,botPath,mp.x*w,mp.y*h,mp.w*w,mp.h*h);
  const strip=stripPath(b.w*w,b.h*h,chS);
  g.save();g.translate(b.x*w,b.y*h);g.clip(strip);g.drawImage(TEX.silver,-b.x*w,-b.y*h,w,h);g.fillStyle='rgba(0,0,0,0.24)';g.fillRect(0,0,b.w*w,b.h*h);g.restore();
  g.save();g.translate(b.x*w,b.y*h);recessShade(g,strip,0,0,b.w*w,b.h*h);g.restore();
  g.restore();
  paintNumberPlate(g,bp.x*w,bp.y*h,bp.w*w,bp.h*h,Math.min(w,h)*bp.r,'#7e7e84');
}
