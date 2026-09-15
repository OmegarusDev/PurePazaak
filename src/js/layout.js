let W=1024,H=768,L={},PORTRAIT=false;
// KOTOR 2 table: two mirrored halves.
// Player is left-handed (turn orb + set well on the left, board total on the inner end).
// Opponent is right-handed. Landscape sits the halves side by side on one name rail.
// Portrait stacks the same shapes: opponent on top, player underneath.
function computeLayout(){
  const mq=window.matchMedia&&window.matchMedia('(orientation: portrait)');
  PORTRAIT=mq?mq.matches:window.innerHeight>window.innerWidth;
  let aw=+window.innerWidth||0, ah=+window.innerHeight||0;
  try{
    const b=document.querySelector('.match-board'),r=b&&b.getBoundingClientRect();
    if(r&&r.width>1&&r.height>1){aw=r.width;ah=r.height;}
  }catch(e){}
  if(!(aw>1&&ah>1)){W=1;H=1;L={fallback:true,reason:'NO VIEWPORT'};return;}
  W=Math.max(1,Math.round(aw));H=Math.max(1,Math.round(ah));
  layoutTable();
}
function layoutPortrait(){
  const bezel=Math.max(8,Math.min(12,Math.round(H*0.012)));
  const fx=bezel,fy=bezel,fw=W-2*bezel,fh=H-2*bezel;
  const frame={x:fx,y:fy,w:fw,h:fh,r:Math.max(12,Math.round(Math.min(fw,fh)*0.02))};
  const pad=6,split=6,gutter=6,barPad=3,orbGap=3,botPad=4;
  const gapX=4,gapY=4,slotGap=4;
  const barH=Math.max(22,Math.min(26,Math.round(H*0.03)));
  const orbR=Math.max(H<500?12:16,Math.round(barH*0.88));
  const scoreR=Math.max(10,Math.round(barH*0.42));
  const chanW=Math.max(22,Math.round(orbR*1.04));
  const btnH=H<420?32:Math.max(36,Math.min(44,Math.round(H*0.046)));
  const gridTopOff=barPad+barH/2+orbR+orbGap;
  const btnGapY=8;
  const innerX0=fx+pad,innerX1=fx+fw-pad,innerW=fw-2*pad;
  function metrics(sw0){
    const sh=sw0/CARD_ASPECT,gridW=3*sw0+2*gapX,gridH=3*sh+2*gapY;
    const gridX=W/2-(1.5*sw0+gapX);
    const leftRoom=gridX-gutter-innerX0,rightRoom=innerX1-(gridX+gridW)-gutter;
    const hwP=sw0,hhP=sh,rowW=4*hwP+3*slotGap;
    const hhOFit=(gridH-3*slotGap)/4,hwOFit=hhOFit*CARD_ASPECT;
    const hwO=Math.min(hwOFit,Math.max(0,leftRoom),sw0*0.62);
    const hhO=hwO/CARD_ASPECT;
    const oNeed=gridTopOff+gridH+botPad;
    const pNeed=gridTopOff+gridH+8+hhP+btnGapY+btnH+botPad;
    const ok=leftRoom>=chanW-0.5&&rightRoom>=chanW-0.5&&rowW<=innerW+0.5&&oNeed+pNeed+split<=fh+0.5&&hwP>=18&&hhP>=22;
    return {sh,gridW,gridH,gridX,hwP,hhP,hwO,hhO,oNeed,pNeed,ok};
  }
  let lo=12,hi=Math.max(13,fw/2.8),best=null;
  for(let i=0;i<28;i++){
    const mid=(lo+hi)/2,met=metrics(mid);
    if(met.ok){best=Object.assign({sw:mid},met);lo=mid;}else hi=mid;
  }
  let m=best||Object.assign({sw:12},metrics(12));
  const slack=Math.max(0,fh-(m.oNeed+m.pNeed+split));
  const oH=m.oNeed+slack/2,pH=m.pNeed+slack/2;
  const boxO={x:fx,y:fy,w:fw,h:oH};
  const boxP={x:fx,y:fy+oH+split,w:fw,h:pH};
  const splitY=fy+oH+split/2;
  const namePad=6,nameGap=8;
  const sw0=m.sw;

  function place(side,box){
    const left=side==='p';
    const barY=box.y+barPad,orbY=barY+barH/2;
    const gridTop=box.y+gridTopOff;
    const gridX=m.gridX,gridW=m.gridW,gridH=m.gridH;
    const chan={
      x:Math.round(left?gridX-gutter-chanW:gridX+gridW+gutter),
      y:gridTop,w:chanW,
      h:Math.max(Math.round(chanW*3.6),Math.min(Math.round(chanW*4.2),gridH)),
      dir:'v'
    };
    chan.x=Math.max(fx+4,Math.min(chan.x,fx+fw-chan.w-4));
    const orb={x:chan.x+chan.w/2,y:orbY,r:orbR};
    const top={x:box.x+pad,y:barY,w:box.w-2*pad,h:barH};
    const badge=left
      ?{x:top.x+top.w-nameGap-scoreR,y:orbY,r:scoreR}
      :{x:top.x+nameGap+scoreR,y:orbY,r:scoreR};
    const name=left
      ?{x:orb.x+orbR+namePad,y:orbY}
      :{x:orb.x-orbR-namePad,y:orbY};
    const nameMax=left
      ?Math.max(20,badge.x-badge.r-nameGap-name.x)
      :Math.max(20,name.x-(badge.x+badge.r+nameGap));
    const hw=left?m.hwP:m.hwO,hh=left?m.hhP:m.hhO;
    let lab=null,hand;
    if(left){
      const rowW=4*hw+3*slotGap;
      const btnY=box.y+box.h-botPad-btnH;
      const handY=btnY-btnGapY-hh;
      let handX=(W-rowW)/2;
      handX=Math.max(innerX0,Math.min(handX,innerX1-rowW));
      hand={x:handX,y:handY,sw:hw,sh:hh,hgap:slotGap};
    }else{
      hand={x:Math.max(innerX0,gridX-gutter-hw),y:gridTop,sw:hw,sh:hh,hgap:slotGap,dir:'v'};
    }
    return {
      top,orb,name,nameMax,badge,chan,
      grid:{x:gridX,y:gridTop},lab,hand,
      sw:sw0,sh:m.sh,gapX,gapY,
      btnY:box.y+box.h-botPad-btnH,
      btnH,fsName:Math.max(10,Math.round(barH*0.4)),
      fsLab:11
    };
  }
  const p=place('p',boxP),o=place('o',boxO);
  const minGap=orbR+scoreR+10;
  if(p.badge.x-p.orb.x<minGap)p.badge.x=Math.min(p.top.x+p.top.w-8-scoreR,p.orb.x+minGap);
  if(o.orb.x-o.badge.x<minGap)o.badge.x=Math.max(o.top.x+8+scoreR,o.orb.x-minGap);
  p.nameMax=Math.max(20,p.badge.x-p.badge.r-nameGap-p.name.x);
  o.nameMax=Math.max(20,o.name.x-(o.badge.x+o.badge.r+nameGap));
  const x0=fx+Math.max(10,pad+4),x1=fx+fw-Math.max(10,pad+4);
  const bGap=8,span=x1-x0,wts=[0.88,1,1.28,1],sum=wts.reduce((a,b)=>a+b,0);
  const inner=span-3*bGap,ws=wts.map(w=>inner*w/sum);
  const y=p.btnY,bh=p.btnH;
  let x=x0;
  const btnForf={x,y,w:ws[0],h:bh};x+=ws[0]+bGap;
  const btnFlip={x,y,w:ws[1],h:bh};x+=ws[1]+bGap;
  const btnEnd={x,y,w:ws[2],h:bh};x+=ws[2]+bGap;
  const btnStand={x,y,w:ws[3],h:bh};
  L={
    frame,splitY,nameRail:null,
    top:p.top,topP:p.top,topO:o.top,
    orbP:p.orb,orbO:o.orb,
    nameP:p.name,nameO:o.name,
    nameMaxP:p.nameMax,nameMaxO:o.nameMax,
    badges:[p.badge,o.badge],
    badgeP:p.badge,badgeO:o.badge,
    chanP:p.chan,chanO:o.chan,
    gridP:p.grid,gridO:o.grid,
    labP:p.lab,labO:null,
    handP:p.hand,handO:o.hand,
    btnForf,btnFlip,btnEnd,btnStand,
    sw:p.sw,sh:p.sh,gap:p.gapY,gapX:p.gapX,gapY:p.gapY,
    vent:null,deco:null,
    toastY:(o.grid.y+p.grid.y)/2+p.sh,
    fsName:p.fsName,fsLab:p.fsLab
  };
  L.fallback=W<180||p.sw<11||!layoutValid();
}
function layoutTable(){
  if(PORTRAIT){layoutPortrait();return;}
  const u=Math.min(W,H)/720;
  const bezel=Math.max(18,Math.round(Math.min(W,H)*0.055));
  const fx=bezel,fy=bezel,fw=W-2*bezel,fh=H-2*bezel;
  const split=Math.max(8,Math.round(10*u));
  const frame={x:fx,y:fy,w:fw,h:fh,r:Math.max(16,Math.round(Math.min(fw,fh)*0.028))};

  function placeHalf(side,box,flags,swLock){
    const left=side==='p';
    const short=box.h<200;
    const barH=Math.max(short?18:24,Math.round(Math.min(box.w,box.h)*0.062));
    const pad=Math.max(8,Math.round(10*u));
    const barY=box.y+Math.max(3,Math.round(4*u));
    const orbR=Math.max(short?11:13,Math.round(barH*(short?0.62:0.92)));
    const scoreR=Math.max(10,Math.round(barH*0.42));
    const orb=left
      ?{x:box.x+pad+orbR,y:barY+barH/2,r:orbR}
      :{x:box.x+box.w-pad-orbR,y:barY+barH/2,r:orbR};
    const tuck=orbR*0.18;
    const top=left
      ?{x:orb.x-tuck,y:barY,w:box.x+box.w-pad-(orb.x-tuck),h:barH}
      :{x:box.x+pad,y:barY,w:(orb.x+tuck)-(box.x+pad),h:barH};
    const badge=left
      ?{x:top.x+top.w-Math.max(8,Math.round(10*u))-scoreR,y:barY+barH/2,r:scoreR}
      :{x:top.x+Math.max(8,Math.round(10*u))+scoreR,y:barY+barH/2,r:scoreR};
    const name=left
      ?{x:orb.x+orbR+Math.max(6,Math.round(7*u)),y:barY+barH/2}
      :{x:orb.x-orbR-Math.max(6,Math.round(7*u)),y:barY+barH/2};
    const nameMax=left
      ?Math.max(20,badge.x-badge.r-Math.max(8,Math.round(8*u))-name.x)
      :Math.max(20,name.x-(badge.x+badge.r+Math.max(8,Math.round(8*u))));

    const chanW=Math.max(20,Math.round(orbR*1.08));
    const btnH=flags.buttons?Math.max(28,Math.round(32*u)):0;
    const labelH=(flags.label||flags.reserveLab)?Math.max(12,Math.round(14*u)):0;
    const orbBottom=orb.y+orb.r;
    const chanY=Math.max(barY+barH+Math.max(3,Math.round(4*u)),orbBottom+Math.max(short?3:6,Math.round(short?3:8*u)));
    const chanMaxH=box.y+box.h-chanY-(btnH?btnH+Math.round(8*u):Math.round(8*u));
    const chanH=Math.max(Math.round(chanW*3.6),Math.min(Math.round(chanW*4.35),chanMaxH));
    const chan={
      x:Math.round(orb.x-chanW/2),
      y:chanY,
      w:chanW,h:chanH,dir:'v'
    };
    const handGap=Math.max(3,Math.round(4*u));
    let gapX=Math.max(4,Math.round(5*u)),gapY=gapX;
    const gutter=Math.max(6,Math.round(7*u));
    const rail=chanW+gutter;
    const gridTop=chan.y;
    const bottom=box.y+box.h-Math.max(4,Math.round(6*u))-btnH-(btnH?Math.round(5*u):0);
    const availH=Math.max(40,bottom-gridTop);
    const maxGridW=Math.max(36,top.w-rail);
    const handScale=flags.handScale||1;
    const handEdge0=left?chan.x+chan.w+gutter:box.x+pad;
    const handEdge1=left?box.x+box.w-pad:chan.x-gutter;
    const maxHandRow=Math.max(36,handEdge1-handEdge0);
    const pack=(sw0,gx,gy)=>{
      const sh=sw0/CARD_ASPECT,gridW=3*sw0+2*gx,gridH=3*sh+2*gy;
      const hw=Math.min(sw0*handScale,(maxHandRow-3*handGap)/4),hh=hw/CARD_ASPECT;
      const used=gridH+Math.max(3,gy)+labelH+(labelH?3:0)+hh;
      return {sh,gridW,gridH,hw,hh,used};
    };
    const swFromHand=(maxHandRow-3*handGap)/(4*Math.max(0.35,handScale));
    let sw=swLock!=null?swLock:Math.max(12,Math.min((maxGridW-2*gapX)/3,swFromHand));
    let p=pack(sw,gapX,gapY);
    for(let i=0;i<40&&p.used>availH&&sw>10;i++){
      sw*=Math.min(0.97,availH/Math.max(p.used,1));
      p=pack(sw,gapX,gapY);
    }
    if(p.gridW>maxGridW){
      sw=Math.max(10,(maxGridW-2*gapX)/3);
      p=pack(sw,gapX,gapY);
    }
    let gridX=left?chan.x+chan.w+gutter:chan.x-gutter-p.gridW;
    const minX=box.x+pad,maxX=box.x+box.w-pad-p.gridW;
    gridX=Math.max(minX,Math.min(gridX,maxX));
    if(left&&gridX<chan.x+chan.w+2){
      sw=Math.max(10,(maxGridW-2*gapX)/3);
      p=pack(sw,gapX,gapY);
      gridX=chan.x+chan.w+gutter;
    }
    if(!left&&gridX+p.gridW>chan.x-2){
      sw=Math.max(10,(maxGridW-2*gapX)/3);
      p=pack(sw,gapX,gapY);
      gridX=chan.x-gutter-p.gridW;
    }
    const labY=gridTop+p.gridH+Math.max(3,gapY);
    const handY=labY+(labelH?labelH+3:0);
    const handW=4*p.hw+3*handGap;
    const handMin=left?chan.x+chan.w+Math.max(4,gutter):box.x+pad;
    const handMax=left?box.x+box.w-pad:chan.x-Math.max(4,gutter);
    let handX=gridX+(p.gridW-handW)/2;
    handX=Math.max(handMin,Math.min(handX,handMax-handW));
    return {
      top,orb,name,nameMax,badge,chan,
      grid:{x:gridX,y:gridTop},
      lab:flags.label?{x:gridX,y:labY,w:p.gridW,h:labelH}:null,
      hand:{x:handX,y:handY,sw:p.hw,sh:p.hh,hgap:handGap},
      sw,sh:p.sh,gapX,gapY,
      btnY:box.y+box.h-Math.max(4,Math.round(6*u))-btnH,
      btnH,fsName:Math.max(10,Math.round(barH*0.4)),
      fsLab:Math.max(9,Math.round((labelH||14)*0.62))
    };
  }

  const flagsP={label:true,buttons:true,handScale:1};
  const flagsO={label:false,reserveLab:true,buttons:true,handScale:0.72};
  const halfW=(fw-split)/2;
  const boxP={x:fx,y:fy,w:halfW,h:fh};
  const boxO={x:fx+halfW+split,y:fy,w:halfW,h:fh};

  let p=placeHalf('p',boxP,flagsP);
  let o=placeHalf('o',boxO,flagsO);
  const sw=Math.min(p.sw,o.sw);
  p=placeHalf('p',boxP,flagsP,sw);
  o=placeHalf('o',boxO,flagsO,sw);

  const btnGap=Math.max(6,Math.round(8*u));
  const pW=3*p.sw+2*p.gapX,oW=3*o.sw+2*o.gapX;
  const pInner=pW-btnGap,oInner=oW-btnGap;
  const forf=pInner*0.46,flip=pInner-forf;
  const stand=oInner/2.27,end=oInner-stand;
  const btnForf={x:p.grid.x,y:p.btnY,w:forf,h:p.btnH};
  const btnFlip={x:p.grid.x+forf+btnGap,y:p.btnY,w:flip,h:p.btnH};
  const btnEnd={x:o.grid.x,y:o.btnY,w:end,h:o.btnH};
  const btnStand={x:o.grid.x+end+btnGap,y:o.btnY,w:stand,h:o.btnH};

  const nameRail={x:p.top.x,y:p.top.y,w:o.top.x+o.top.w-p.top.x,h:p.top.h};
  L={
    frame,splitY:null,nameRail,
    top:nameRail,
    topP:p.top,topO:o.top,
    orbP:p.orb,orbO:o.orb,
    nameP:p.name,nameO:o.name,
    nameMaxP:p.nameMax,nameMaxO:o.nameMax,
    badges:[p.badge,o.badge],
    badgeP:p.badge,badgeO:o.badge,
    chanP:p.chan,chanO:o.chan,
    gridP:p.grid,gridO:o.grid,
    labP:p.lab,labO:null,
    handP:p.hand,handO:o.hand,
    btnForf,btnFlip,btnEnd,btnStand,
    sw:p.sw,sh:p.sh,gap:p.gapY,gapX:p.gapX,gapY:p.gapY,
    vent:null,deco:null,
    toastY:p.grid.y+(3*p.sh+2*p.gapY)/2,
    fsName:p.fsName,fsLab:p.fsLab
  };
  L.fallback=W<180||p.sw<11||!layoutValid();
}
function layoutRectInBounds(r){return !!(r&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isFinite(r.w)&&Number.isFinite(r.h)&&r.w>0&&r.h>0&&r.x>=0&&r.y>=0&&r.x+r.w<=W+0.5&&r.y+r.h<=H+0.5);}
function layoutValid(){
  if(!(W>1&&H>1&&L&&L.frame&&layoutRectInBounds(L.frame)))return false;
  const rects=[L.topP,L.topO,L.btnForf,L.btnFlip,L.btnEnd,L.btnStand,L.chanP,L.chanO];
  if(!rects.every(layoutRectInBounds)||!(L.sw>0&&L.sh>0))return false;
  if(L.labP&&!layoutRectInBounds(L.labP))return false;
  if(L.labO&&!layoutRectInBounds(L.labO))return false;
  for(const grid of [L.gridP,L.gridO]){
    if(!grid||!Number.isFinite(grid.x)||!Number.isFinite(grid.y))return false;
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(!layoutRectInBounds(slotRect(grid,r,c)))return false;
  }
  for(const hand of [L.handP,L.handO]){
    if(!hand||!Number.isFinite(hand.x)||!Number.isFinite(hand.y)||!(hand.sw>0&&hand.sh>0))return false;
    for(let i=0;i<4;i++)if(!layoutRectInBounds(handSlot(hand,i)))return false;
  }
  return true;
}
function gapXY(){return {x:L.gapX!=null?L.gapX:L.gap, y:L.gapY!=null?L.gapY:L.gap};}
function slotRect(grid,r,c){const g=gapXY();return {x:grid.x+c*(L.sw+g.x),y:grid.y+r*(L.sh+g.y),w:L.sw,h:L.sh};}
function handSlot(h,i){
  if(h&&h.dir==='v')return {x:h.x,y:h.y+i*(h.sh+h.hgap),w:h.sw,h:h.sh};
  return {x:h.x+i*(h.sw+h.hgap),y:h.y,w:h.sw,h:h.sh};
}
function inRect(p,r){return !!(r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h);}
