let W=1024,H=768,L={},PORTRAIT=false;
// Adaptive layout: the logical canvas matches the measured board box.
// Landscape uses a modest K1 metal bezel, not 4:3 gutters and not edge-to-edge.
function computeLayout(){
  PORTRAIT=window.innerHeight>window.innerWidth;
  let aw=+window.innerWidth||0, ah=+window.innerHeight||0;
  try{
    const b=document.querySelector('.match-board');
    if(b&&b.clientWidth>10&&b.clientHeight>10){aw=b.clientWidth;ah=b.clientHeight;}
  }catch(e){}
  if(!(aw>0&&ah>0)){aw=PORTRAIT?390:1024;ah=PORTRAIT?844:768;}
  if(!PORTRAIT){
    const a=Math.min(2.2,Math.max(1.05,aw/Math.max(1,ah)));
    H=Math.max(360,Math.round(ah));
    W=Math.round(H*a);
    layoutLandscape();
  }else{
    W=Math.max(280,Math.round(aw));
    H=Math.max(400,Math.round(ah));
    layoutPortrait();
  }
}
function layoutLandscape(){
  // Modest K1 metal bezel around the inner plate — not edge-to-edge, not 4:3 gutters.
  const padY=Math.max(22,Math.round(H*0.058));
  const padX=Math.max(padY,Math.round(W*0.07));
  const fx=padX, fy=padY, fw=W-2*padX, fh=H-2*padY;
  const u=H/768, cx=fx+fw/2;
  const inset=Math.max(12,Math.round(fw*0.022));
  const barH=Math.max(26,Math.round(32*u));
  const barY=fy+Math.max(8,Math.round(12*u));
  const orbR=Math.max(9,Math.round(barH*0.34));
  const orbPad=Math.max(6,Math.round(barH*0.14));
  const bw=Math.max(38,Math.round(44*u)), bh=Math.max(20,Math.round(barH*0.78));
  const badgeGap=Math.max(10,Math.round(14*u));
  const badges=[{x:cx-badgeGap/2-bw,y:barY+(barH-bh)/2},{x:cx+badgeGap/2,y:barY+(barH-bh)/2}];
  const plateGap=Math.max(8,Math.round(10*u));
  const topPX=fx+inset;
  const topPW=Math.max(80,badges[0].x-plateGap-topPX);
  const topOX=badges[1].x+bw+plateGap;
  const topOW=Math.max(80,fx+fw-inset-topOX);
  const orbP={x:topPX+orbPad+orbR,y:barY+barH*0.54,r:orbR};
  const orbO={x:topOX+topOW-orbPad-orbR,y:barY+barH*0.54,r:orbR};
  const nameY=barY+barH*0.58;
  const nameP={x:orbP.x+orbR+8,y:nameY};
  const nameO={x:orbO.x-orbR-8,y:nameY};
  const btnH=Math.max(30,Math.round(34*u));
  const labelH=Math.max(15,Math.round(18*u));
  const minGap=Math.max(5,Math.round(6*u));
  const chanW=Math.max(14,Math.round(18*u));
  const handGap=Math.max(4,Math.round(5*u));
  const padInner=Math.max(10,Math.round(fw*0.014));
  const minMid=Math.max(14,Math.round(fw*0.02));
  const cardH=1/CARD_ASPECT;
  const bottomPad=Math.max(8,Math.round(10*u));
  const btnY=fy+fh-bottomPad-btnH;
  const gridY=barY+barH+Math.max(8,Math.round(10*u));
  const between=Math.max(5,Math.round(7*u));
  const stackH=btnY-gridY-between;
  const maxSwW=Math.max(26,(fw-2*padInner-minMid-2*chanW-16-2*minGap)/6);
  const pack=(sw0,gapX,gapY)=>{
    const sh=sw0*cardH, gridW=3*sw0+2*gapX, gridH=3*sh+2*gapY;
    const hw=Math.min(sw0*0.9,(3*sw0+2*minGap-3*handGap)/4), hh=hw*cardH;
    const used=gridH+between+labelH+Math.max(4,between-2)+hh;
    return {sh,gridW,gridH,hw,hh,used,gapX,gapY};
  };
  let sw=Math.max(24,maxSwW), gapX=minGap, gapY=minGap, p=pack(sw,gapX,gapY);
  for(let i=0;i<24&&p.used>stackH&&sw>26;i++){sw*=Math.min(0.97,stackH/Math.max(p.used,1));p=pack(sw,gapX,gapY);}
  if(p.used<stackH-6){
    let lo=sw, hi=maxSwW;
    for(let i=0;i<18;i++){
      const mid=(lo+hi)/2, q=pack(mid,gapX,gapY);
      if(q.used<=stackH){lo=mid;p=q;sw=mid;}else hi=mid;
    }
  }
  const maxCombo=(fw-2*padInner-minMid)/2;
  let comboW=p.gridW+chanW+8;
  if(comboW<maxCombo){
    const add=Math.min((maxCombo-comboW)/2,sw*0.18);
    if(add>0.5){gapX+=add;p=pack(sw,gapX,gapY);comboW=p.gridW+chanW+8;}
  }
  const {sh,gridW,gridH,hw,hh}=p;
  const left0=fx+padInner;
  const right0=fx+fw-padInner-comboW;
  const gPX=left0+chanW+8, gOX=right0;
  const labY=gridY+gridH+between;
  const handY=labY+labelH+Math.max(4,between-2);
  const handW=4*hw+3*handGap;
  const btnGap=Math.max(8,Math.round(8*u));
  const forfW=(gridW-btnGap)*0.46, flipW=gridW-btnGap-forfW;
  const actW=(gridW-btnGap)/2;
  L={
    frame:{x:fx,y:fy,w:fw,h:fh,r:Math.max(16,Math.round(Math.min(fw,fh)*0.028))},
    top:{x:topPX,y:barY,w:topOW+topOX-topPX,h:barH},
    topP:{x:topPX,y:barY,w:topPW,h:barH}, topO:{x:topOX,y:barY,w:topOW,h:barH},
    orbP,orbO,nameP,nameO,badges,bw,bh,
    chanP:{x:left0,y:gridY,w:chanW,h:gridH},chanO:{x:gOX+gridW+8,y:gridY,w:chanW,h:gridH},
    gridP:{x:gPX,y:gridY},gridO:{x:gOX,y:gridY},sw,sh,gap:gapY,gapX:p.gapX,gapY:p.gapY,
    labP:{x:gPX,y:labY,w:gridW,h:labelH},labO:{x:gOX,y:labY,w:gridW,h:labelH},
    handP:{x:gPX+(gridW-handW)/2,y:handY,sw:hw,sh:hh,hgap:handGap},
    handO:{x:gOX+(gridW-handW)/2,y:handY,sw:hw,sh:hh,hgap:handGap},
    btnForf:{x:gPX,y:btnY,w:forfW,h:btnH},
    btnFlip:{x:gPX+forfW+btnGap,y:btnY,w:flipW,h:btnH},
    btnEnd:{x:gOX,y:btnY,w:actW,h:btnH},
    btnStand:{x:gOX+actW+btnGap,y:btnY,w:actW,h:btnH},
    vent:null,deco:null,
    toastY:gridY+gridH/2,
    fsName:Math.max(11,Math.round(barH*0.42)),
    fsLab:Math.max(10,Math.round(labelH*0.62))
  };
}
function layoutPortrait(){
  const fx=Math.round(W*0.04), fw=W-2*fx;
  const fy=Math.round(H*0.014), fh=H-2*fy;
  const cx=fx+fw/2;
  const u=Math.min(W/390,H/760);
  const labelH=Math.max(16,Math.round(20*u));
  const btnH=Math.max(30,Math.round(36*u));
  const gap=Math.max(5,Math.round(8*u));
  const chanW=Math.max(11,Math.round(15*u));
  const pad=Math.max(8,Math.round(12*u));
  const block=Math.max(6,Math.round(8*u));
  const rivetClear=Math.max(34,Math.round(36*u));
  const barY=fy+rivetClear;
  const bottomPad=Math.round(10*u);
  const barH=Math.max(18,Math.round(22*u));
  const orbR=Math.max(6,Math.round(barH*0.34));
  const orbPad=Math.max(4,Math.round(barH*0.12));
  const handGap=Math.max(4,Math.round(6*u));
  const innerW=fw-2*pad-chanW-Math.round(8*u);
  let sw=(innerW-2*gap)/3;
  const pack=sw0=>{
    const sh=sw0*(1/CARD_ASPECT), gridW=3*sw0+2*gap, gridH=3*sh+2*gap;
    const bw2=Math.min(sw0*0.68,(gridW-3*handGap)/4), bh2=bw2/CARD_ASPECT;
    const used=barH+block+gridH+4+labelH+4+bh2+block+gridH+4+labelH+4+bh2+block+btnH;
    return {sh,gridW,gridH,bw2,bh2,used};
  };
  let p=pack(sw);
  const budget=fh-(barY-fy)-bottomPad;
  for(let i=0;i<28 && p.used>budget && sw>26;i++){
    sw*=Math.min(0.97,budget/Math.max(p.used,1));
    p=pack(sw);
  }
  const {sh,gridW,gridH,bw2,bh2}=p;
  const comboW=chanW+Math.round(8*u)+gridW;
  const comboX=fx+Math.max(0,(fw-comboW)/2);
  const gX=comboX+chanW+Math.round(8*u);
  const gridOY=barY+barH+block;
  const labOY=gridOY+gridH+4;
  const backY=labOY+labelH+4;
  const gridPY=backY+bh2+block;
  const labPY=gridPY+gridH+4;
  const handPY=labPY+labelH+4;
  const btnY=handPY+bh2+block;
  const handW=4*bw2+3*handGap;
  const handX=gX+(gridW-handW)/2;
  const bw=Math.max(28,Math.round(32*u)), bh=Math.max(16,Math.round(barH*0.72));
  const badgeGap=Math.max(8,Math.round(10*u));
  const badges=[{x:cx-badgeGap/2-bw,y:barY+(barH-bh)/2},{x:cx+badgeGap/2,y:barY+(barH-bh)/2}];
  const inset=rivetClear;
  const plateGap=Math.max(6,Math.round(8*u));
  const topPX=fx+inset;
  const topPW=Math.max(70,badges[0].x-plateGap-topPX);
  const topOX=badges[1].x+bw+plateGap;
  const topOW=Math.max(70,fx+fw-inset-topOX);
  const orbP={x:topPX+orbPad+orbR,y:barY+barH*0.54,r:orbR};
  const orbO={x:topOX+topOW-orbPad-orbR,y:barY+barH*0.54,r:orbR};
  const nameY=barY+barH*0.58;
  const forfW=Math.max(48,Math.round(56*u)), gapB=Math.round(6*u);
  const restL=fx+10+forfW+gapB, restR=fx+fw-10, restW=restR-restL;
  const btnGap=Math.round(6*u);
  const flipW=Math.min(Math.round(70*u),(restW-2*btnGap)/3.6);
  const btnW=(restW-flipW-2*btnGap)/2;
  L={
    frame:{x:fx,y:fy,w:fw,h:fh,r:Math.max(16,Math.round(22*u))},
    top:{x:topPX,y:barY,w:topOW+topOX-topPX,h:barH},
    topP:{x:topPX,y:barY,w:topPW,h:barH}, topO:{x:topOX,y:barY,w:topOW,h:barH},
    orbP,orbO,
    nameP:{x:orbP.x+orbR+6,y:nameY},nameO:{x:orbO.x-orbR-6,y:nameY},
    badges,bw,bh,
    chanP:{x:gX-chanW-Math.round(8*u),y:gridPY,w:chanW,h:gridH},
    chanO:{x:gX-chanW-Math.round(8*u),y:gridOY,w:chanW,h:gridH},
    gridP:{x:gX,y:gridPY},gridO:{x:gX,y:gridOY},sw,sh,gap,gapX:gap,gapY:gap,
    labP:{x:gX,y:labPY,w:gridW,h:labelH},labO:{x:gX,y:labOY,w:gridW,h:labelH},
    handO:{x:handX,y:backY,sw:bw2,sh:bh2,hgap:handGap,portrait:true},
    handP:{x:handX,y:handPY,sw:bw2,sh:bh2,hgap:handGap,portrait:true},
    btnForf:{x:fx+10,y:btnY+Math.round(4*u),w:forfW,h:btnH-Math.round(8*u)},
    btnFlip:{x:restL,y:btnY,w:flipW,h:btnH},
    btnEnd:{x:restL+flipW+btnGap,y:btnY,w:btnW,h:btnH},
    btnStand:{x:restL+flipW+btnGap+btnW+btnGap,y:btnY,w:btnW,h:btnH},
    vent:null,deco:null,
    toastY:(gridOY+gridH/2),
    fsName:Math.max(9,Math.round(barH*0.42)),
    fsLab:Math.max(9,Math.round(labelH*0.58))
  };
}
function gapXY(){return {x:L.gapX!=null?L.gapX:L.gap, y:L.gapY!=null?L.gapY:L.gap};}
function slotRect(grid,r,c){const g=gapXY();return {x:grid.x+c*(L.sw+g.x),y:grid.y+r*(L.sh+g.y),w:L.sw,h:L.sh};}
function handSlot(h,i){return {x:h.x+i*(h.sw+h.hgap),y:h.y,w:h.sw,h:h.sh};}
function inRect(p,r){return !!(r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h);}
