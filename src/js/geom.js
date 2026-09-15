// Pure vector geometry — deterministic, resolution-independent, svgsmith-analysed from low-res oracles
// Oracle: RefPlus 572x772 (0.1346,0.0596,0.8007,0.2267), RefMinus 582x774 (0.1323,0.0698,0.7835,0.2209), RefRear 586x778
// Method: svgsmith (OpenCV HSV + HoughCircles + approxPolyDP 0.007) + 800-iter pixel-diff (MSE 46.27) — analysis only, no asset generation
// Canvas normalized 0-1. Layer order: outer (0) -> topPanel (1) -> midPanel (1 mirrored) -> diamond (negative) -> blackPanel (2) -> bottomStrip (3) -> badge (4)
// Symmetry: topPanel ↔ midPanel are vertical translations with V inverted; the black face is inset between them and the badge circle stays rotationally symmetric.
const GEOM={
  outer:{x:0,y:0,w:1,h:0.996,r:0.045},
  // Same metal-frame inset as the rear (GEOM_REAR.inset). Inner wells keep
  // the plus-face shapes, just sitting in that shared border.
  topPanel:{x:0.128,y:0.096,w:0.744,h:0.204,nw:0.274,nd:0.304,tip:{x:0.5,y:0.238}},
  midPanel:{x:0.128,y:0.554,w:0.744,h:0.151,nw:0.274,nd:0.512,tip:{x:0.5,y:0.631}},
  blackPanel:{x:0.135,y:0.309,w:0.729,h:0.238,r:0.010},
  numberTextH:0.162,
  bottomStrip:{x:0.135,y:0.797,w:0.729,h:0.137},
  chamfer:0.032,stripChamfer:0.055,
  badge:{cx:0.830,cy:0.142,r:0.083,plusW:0.085,plusH:0.062,plusT:0.012,minusW:0.085,minusH:0.012}
};
/* RefRear: one dark inset. The bar+U is a hole in that inset so the card frame shows through. */
const GEOM_REAR={
  inset:{x:0.128,y:0.096,w:0.744,h:0.838,r:0.018},
  topWell:{x:0.128,y:0.100,w:0.744,h:0.178,nw:0.376,nd:0.382},
  plate:{x:0.172,y:0.278,w:0.656,h:0.278,topTip:0.210,botTip:0.618,topBase:0.28,botBase:0.24},
  badge:{cx:0.825,cy:0.132,r:0.088},
  bar:{x:0.128,y:0.748,w:0.744,h:0.038},
  cup:{w:0.38,h:0.10}
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
function panelBevel(g,path,w,h){gemBevel(g,path,Math.max(0.4,Math.min(w,h)*0.0035));}
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
function paintNumberPlate(g,x,y,ww,hh,r,fill,tex){
  const frame=Math.max(0.75,Math.min(ww,hh)*0.026);
  const ox=x-frame,oy=y-frame,ow=ww+2*frame,oh=hh+2*frame,or=r+frame;
  const outer=rrPath(ow,oh,or);
  g.save();g.translate(ox,oy);g.clip(outer);
  if(tex)g.drawImage(tex,0,0,ow,oh);else{g.fillStyle='#777a76';g.fillRect(0,0,ow,oh);}
  const sh=g.createLinearGradient(0,0,0,oh);
  sh.addColorStop(0,'rgba(255,255,255,0.12)');sh.addColorStop(0.45,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,0.18)');
  g.fillStyle=sh;g.fillRect(0,0,ow,oh);g.restore();
  g.save();g.translate(ox,oy);gemBevel(g,outer,Math.max(0.45,frame*0.55));g.restore();
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
function rearPlatePath(w,h){
  const p=GEOM_REAR.plate,x=p.x*w,y=p.y*h,pw=p.w*w,ph=p.h*h,cx=w*0.5;
  const tb=p.topBase*w,bb=p.botBase*w;
  const path=new Path2D();
  path.moveTo(cx,p.topTip*h);
  path.lineTo(cx+tb/2,y);
  path.lineTo(x+pw,y);
  path.lineTo(x+pw,y+ph);
  path.lineTo(cx+bb/2,y+ph);
  path.lineTo(cx,p.botTip*h);
  path.lineTo(cx-bb/2,y+ph);
  path.lineTo(x,y+ph);
  path.lineTo(x,y);
  path.lineTo(cx-tb/2,y);
  path.closePath();
  return path;
}
function roundedRectPath(x,y,w,h,r){
  const p=new Path2D();
  p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);
  p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);
  p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);
  p.closePath();return p;
}
function rearInsetOuterPath(w,h){
  const i=GEOM_REAR.inset,p=roundedRectPath(i.x*w,i.y*h,i.w*w,i.h*h,Math.min(w,h)*i.r);
  const bd=GEOM_REAR.badge,c=new Path2D();
  c.arc(bd.cx*w,bd.cy*h,bd.r*Math.min(w,h),0,Math.PI*2);
  p.addPath(c);
  return p;
}
function rearFrameGapPath(w,h){
  const b=GEOM_REAR.bar,cw=GEOM_REAR.cup.w*w,ch=GEOM_REAR.cup.h*h;
  const x=b.x*w,y=b.y*h,bw=b.w*w,bh=b.h*h,cx=w*0.5;
  const path=new Path2D();
  path.moveTo(x,y);path.lineTo(x+bw,y);path.lineTo(x+bw,y+bh);
  path.lineTo(cx+cw/2,y+bh);
  path.ellipse(cx,y+bh,cw/2,ch,0,0,Math.PI,false);
  path.lineTo(x,y+bh);path.closePath();
  return path;
}
function rearWellWithDimple(base,w,h){
  const p=new Path2D(base);
  const bd=GEOM_REAR.badge,c=new Path2D();
  c.arc(bd.cx*w,bd.cy*h,bd.r*Math.min(w,h),0,Math.PI*2);
  p.addPath(c);
  return p;
}
function paintRearDimple(g,w,h){
  const bd=GEOM_REAR.badge,r=bd.r*Math.min(w,h),x=bd.cx*w,y=bd.cy*h;
  g.beginPath();g.arc(x,y,r,0,7);
  g.fillStyle='rgba(0,0,0,0.20)';g.fill();
  g.strokeStyle='rgba(0,0,0,0.38)';g.lineWidth=Math.max(0.6,r*0.08);g.stroke();
  g.beginPath();g.arc(x-r*0.2,y-r*0.24,r*0.52,0,7);
  g.fillStyle='rgba(255,255,255,0.10)';g.fill();
  g.beginPath();g.arc(x,y,r*0.72,0,7);
  g.strokeStyle='rgba(255,255,255,0.12)';g.lineWidth=1;g.stroke();
}
function drawBack(g,w,h){
  const p=cardPath(w,h);
  g.save();g.shadowColor='rgba(0,0,0,0.45)';g.shadowBlur=5;g.fillStyle='#909098';g.fill(p);g.restore();
  paintBody(g,p,TEX.silver,w,h);
  const tw=GEOM_REAR.topWell,ch=cardChamfer(w,GEOM.chamfer);
  const inset=rearInsetOuterPath(w,h);
  const gap=rearFrameGapPath(w,h);
  const topPath=rearWellWithDimple(vNotchedTopPath(tw.x*w,tw.y*h,tw.w*w,tw.h*h,ch,tw.nw,tw.nd),w,h);
  const plate=rearPlatePath(w,h);
  g.save();g.clip(p);
  g.save();g.clip(inset);
  g.drawImage(TEX.silver,0,0,w,h);g.fillStyle='rgba(0,0,0,0.22)';g.fillRect(0,0,w,h);
  g.restore();
  recessShade(g,inset,GEOM_REAR.inset.x*w,GEOM_REAR.inset.y*h,GEOM_REAR.inset.w*w,GEOM_REAR.inset.h*h);
  panelBevel(g,inset,w,h);
  g.save();g.clip(gap);
  g.drawImage(TEX.silver,0,0,w,h);
  const bodyHi=g.createLinearGradient(0,GEOM_REAR.bar.y*h,0,h);
  bodyHi.addColorStop(0,'rgba(255,255,255,0.10)');bodyHi.addColorStop(0.55,'rgba(0,0,0,0)');bodyHi.addColorStop(1,'rgba(0,0,0,0.10)');
  g.fillStyle=bodyHi;g.fillRect(0,0,w,h);
  g.restore();
  g.save();g.clip(topPath);g.drawImage(TEX.silver,0,0,w,h);g.fillStyle='rgba(0,0,0,0.30)';g.fillRect(0,0,w,h);g.restore();
  recessShade(g,topPath,tw.x*w,tw.y*h,tw.w*w,tw.h*h);
  panelBevel(g,topPath,w,h);
  g.save();g.clip(plate);g.drawImage(TEX.silver,0,0,w,h);
  g.fillStyle='rgba(255,255,255,0.16)';g.fillRect(0,0,w,h);
  const hi=g.createLinearGradient(w*0.5,GEOM_REAR.plate.topTip*h,w*0.5,GEOM_REAR.plate.botTip*h);
  hi.addColorStop(0,'rgba(255,255,255,0.22)');hi.addColorStop(0.45,'rgba(255,255,255,0.04)');
  hi.addColorStop(1,'rgba(0,0,0,0.10)');
  g.fillStyle=hi;g.fillRect(0,0,w,h);g.restore();
  gemBevel(g,plate,Math.max(0.45,Math.min(w,h)*0.006));
  g.strokeStyle='rgba(0,0,0,0.28)';g.lineWidth=Math.max(0.5,Math.min(w,h)*0.006);g.stroke(plate);
  paintRearDimple(g,w,h);
  g.restore();
}
