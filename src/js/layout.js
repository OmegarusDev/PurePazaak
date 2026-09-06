let W=1024,H=768,L={},PORTRAIT=false;
// Adaptive layout: the logical canvas matches the measured board box, so the
// table fills every viewport instead of letterboxing. All geometry derives
// from W/H with the authentic KOTOR fractions (frame .17/.055/.66/.89).
function computeLayout(){
  PORTRAIT=window.innerHeight>window.innerWidth;
  let aw=+window.innerWidth||0, ah=+window.innerHeight||0;
  try{
    const b=document.querySelector('.match-board');
    if(b&&b.clientWidth>10&&b.clientHeight>10){aw=b.clientWidth;ah=b.clientHeight;}
  }catch(e){}
  if(!(aw>0&&ah>0)){aw=PORTRAIT?720:1024;ah=PORTRAIT?1180:768;}
  const aspect=aw/Math.max(1,ah);
  if(!PORTRAIT){
    H=768;
    W=Math.round(H*Math.min(2.2,Math.max(1.05,aspect)));
    layoutLandscape();
  }else{
    layoutPortrait(); // content-sized canvas; W/H set inside
  }
}
function layoutLandscape(){
  const u=H/768, v=W/1024;
  const fx=W*0.17, fy=H*0.055, fw=W*0.66, fh=H*0.89;
  const cx=fx+fw/2;
  const barH=34*u, barY=fy+31*u;
  const barLX=fx+0.105*fw, barRX=cx+64*u;
  const barRW=fx+0.895*fw-barRX, barLW=cx-64*u-barLX;
  const orbR=14*u;
  // Two halves for the 3x3 blocks; each half budgets channel + grid.
  // Cells fit width AND height; block+channel combo is centred in its half.
  const padX=0.02*fw, midGap=16*u, gap=7*u, chanW=20*u;
  const halfW=(fw-2*padX-midGap)/2;
  const labelH=22*u, handH=106*u, ventH=38*u;
  const gridY=barY+barH+14*u;
  const maxGridH=(fy+fh-16*u-ventH-10*u)-(gridY+labelH+8*u+handH+10*u+labelH+8*u)-labelH-8*u;
  let sw=Math.min((halfW-chanW-10*u-2*gap)/3,(maxGridH-2*gap)/3/1.125);
  sw=Math.max(40,sw);
  const sh=sw*1.125, gridW=3*sw+2*gap, gridH=3*sh+2*gap;
  const comboW=gridW+chanW+8*u;
  const halfL0=fx+padX, halfR0=halfL0+halfW+midGap;
  const gPX=halfL0+(halfW-comboW)/2+chanW+8*u;
  const gOX=halfR0+(halfW-comboW)/2;
  const labW=gridW+56*u;
  const labY=gridY+gridH+8*u, handY=labY+labelH+10*u;
  const sw2=Math.min(86*u,(halfW-3*6*u)/4), sh2=sw2*106/86;
  L={
    frame:{x:fx,y:fy,w:fw,h:fh,r:28*u},
    top:{x:barLX,y:barY,w:cx-64*u-barLX+64*u+barRW,h:barH},
    topP:{x:barLX,y:barY,w:barLW,h:barH}, topO:{x:barRX,y:barY,w:barRW,h:barH},
    orbP:{x:barLX-30*u,y:barY+barH/2,r:orbR},orbO:{x:fx+0.895*fw+30*u,y:barY+barH/2,r:orbR},
    nameP:{x:barLX-30*u+orbR+8*u,y:barY+barH/2},nameO:{x:fx+0.895*fw+30*u-orbR-8*u,y:barY+barH/2},
    badges:[{x:cx-4*u-48*u,y:barY+3*u},{x:cx+4*u,y:barY+3*u}],bw:48*u,bh:28*u,
    chanP:{x:gPX-chanW-8*u,y:gridY,w:chanW,h:gridH},chanO:{x:gOX+gridW+8*u,y:gridY,w:chanW,h:gridH},
    gridP:{x:gPX,y:gridY},gridO:{x:gOX,y:gridY},sw,sh,gap,
    labP:{x:gPX+gridW/2-labW/2,y:labY,w:labW,h:labelH},labO:{x:gOX+gridW/2-labW/2,y:labY,w:labW,h:labelH},
    handO:{x:halfR0+halfW/2-(4*sw2+3*6*u)/2,y:handY,sw:sw2,sh:sh2,hgap:6*u},
    proj:{x:cx,y:gridY-10*u},
    vent:{x:fx+0.028*fw,y:fy+fh-16*u-ventH,w:0.547*fw,h:ventH},
    deco:{vY:barY+9*u,cY:barY+21*u,cx},
    toastY:(gridY+gridH/2)
  };
}
function layoutPortrait(){
  // Content-sized canvas: the frame hugs the grids (brushed surround is
  // symmetric by construction). Fixed honest card size; the DOM letterboxes.
  const sw=104, sh=sw*1.15, gap=10;
  const gridW=3*sw+2*gap, gridH=3*sh+2*gap;
  const pad=16, chanW=16;
  const labelH=22, backH=72;
  const barH=28;
  const fw=gridW+2*(chanW+10)+2*pad;
  const chromeH=barH+14+labelH+8+14+backH+14+labelH+8+24;
  W=Math.round(fw+96); H=Math.round(40+chromeH+2*gridH+40);
  const fx=(W-fw)/2, fy=20, fh=H-40;
  const cx=fx+fw/2;
  const barY=fy+16;
  const barLX=fx+20, barRX=cx+32;
  const barRW=fx+fw-20-barRX, barLW=cx-32-barLX;
  const orbR=12;
  const gX=fx+pad+chanW+10;
  const labOY=barY+barH+14, gridOY=labOY+labelH+8;
  const backY=gridOY+gridH+14;
  const labPY=backY+backH+14, gridPY=labPY+labelH+8;
  const bw2=Math.min(56,(gridW-3*8)/4), bh2=bw2*1.25;
  L={
    frame:{x:fx,y:fy,w:fw,h:fh,r:28},
    top:{x:barLX,y:barY,w:barLW+64+barRW,h:barH},
    topP:{x:barLX,y:barY,w:barLW,h:barH}, topO:{x:barRX,y:barY,w:barRW,h:barH},
    orbP:{x:barLX-16,y:barY+barH/2,r:orbR},orbO:{x:fx+fw-20+16,y:barY+barH/2,r:orbR},
    nameP:{x:barLX-16+orbR+8,y:barY+barH/2},nameO:{x:fx+fw-20+16-orbR-8,y:barY+barH/2},
    badges:[{x:cx-4-48,y:barY+1},{x:cx+4,y:barY+1}],bw:48,bh:26,
    chanP:{x:gX-chanW-10,y:gridPY,w:chanW,h:gridH},chanO:{x:gX-chanW-10,y:gridOY,w:chanW,h:gridH},
    gridP:{x:gX,y:gridPY},gridO:{x:gX,y:gridOY},sw,sh,gap,
    labP:{x:gX,y:labPY,w:gridW,h:labelH},labO:{x:gX,y:labOY,w:gridW,h:labelH},
    handO:{x:cx-(4*bw2+3*8)/2,y:backY+(backH-bh2)/2,sw:bw2,sh:bh2,hgap:8,portrait:true},
    proj:{x:cx,y:backY-8},
    vent:null,
    deco:null,
    toastY:(gridOY+gridH/2)
  };
}
function slotRect(grid,r,c){return {x:grid.x+c*(L.sw+L.gap),y:grid.y+r*(L.sh+L.gap),w:L.sw,h:L.sh};}
