function drawFallback(g){
  g.fillStyle='#04050b';g.fillRect(0,0,W,H);
  g.fillStyle='#c9d4e4';g.textAlign='center';g.textBaseline='middle';
  g.font='700 '+Math.max(12,Math.round(Math.min(W,H)*0.045))+'px '+GUI_FONT;
  g.fillText('ROTATE OR ENLARGE WINDOW',W/2,H/2);
}
let staticSig='';
function forgetStatic(){
  if(STATIC){STATIC.width=1;STATIC.height=1;STATIC=null;}
  staticSig='';
}
function renderStatic(){
  if(!ctx||typeof document==='undefined'||typeof document.createElement!=='function')return;
  const sk=tableSkin();
  const on=M;
  const whoP=typeof viewWho==='function'?viewWho('p'):'p';
  const whoO=typeof viewWho==='function'?viewWho('o'):'o';
  const nameP=on?plateName(whoP):'YOU';
  const nameO=on?plateName(whoO):'Opponent';
  const bw=Math.max(1,Math.round(W*DPR)),bh=Math.max(1,Math.round(H*DPR));
  const sig=[bw,bh,L.fallback?1:0,tableSeed(),tableTier(),nameP,nameO].join('\t');
  if(STATIC&&STATIC.width===bw&&STATIC.height===bh&&staticSig===sig)return;
  if(!STATIC)STATIC=document.createElement('canvas');
  if(STATIC.width!==bw||STATIC.height!==bh){STATIC.width=bw;STATIC.height=bh;}
  staticSig=sig;
  const g=STATIC.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
  if(L.fallback){drawFallback(g);return;}
  drawFrame(g);
  const rails=L.nameRail?[L.nameRail]:[L.topP,L.topO];
  for(const top of rails){
    const rad=Math.max(6,top.h/2);
    rr(g,top.x,top.y,top.w,top.h,rad);
    g.fillStyle=sk.plate;g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();
    g.strokeStyle=`rgba(255,255,255,${0.05+sk.bevelHi*0.2})`;
    g.beginPath();g.moveTo(top.x+rad,top.y+1.2);g.lineTo(top.x+top.w-rad,top.y+1.2);g.stroke();
  }
  const nameCol=sk.name;
  const fsName=L.fsName||12;
  g.save();
  rr(g,L.topP.x,L.topP.y,L.topP.w,L.topP.h,Math.max(6,L.topP.h/2));g.clip();
  tName(g,nameP,L.nameP.x,L.nameP.y,fsName,nameCol,'left',L.nameMaxP||24);
  g.restore();
  g.save();
  rr(g,L.topO.x,L.topO.y,L.topO.w,L.topO.h,Math.max(6,L.topO.h/2));g.clip();
  tName(g,nameO,L.nameO.x,L.nameO.y,fsName,nameCol,'right',L.nameMaxO||24);
  g.restore();
  for(const grid of [L.gridP,L.gridO]){
    const gx=L.gapX!=null?L.gapX:L.gap, gy=L.gapY!=null?L.gapY:L.gap;
    rr(g,grid.x-10,grid.y-10,3*L.sw+2*gx+20,3*L.sh+2*gy+20,10);
    g.fillStyle=`rgba(0,0,0,${0.12+sk.grime*0.2})`;g.fill();
    g.strokeStyle=`rgba(255,255,255,${0.04+sk.bevelHi*0.12})`;g.lineWidth=1;g.stroke();
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)drawSlot(g,slotRect(grid,r,c));
  }
  if(L.labP){
    rr(g,L.labP.x,L.labP.y,L.labP.w,L.labP.h,5);g.fillStyle=sk.plate;g.fill();
    g.strokeStyle='#000';g.stroke();
    tText(g,(on&&typeof plateName==='function'?plateName(whoP):'Player')+' Hand',L.labP.x+L.labP.w/2,L.labP.y+L.labP.h/2+1,L.fsLab||13,sk.lab,1.2,'center',true,1);
  }
  for(const h of [L.handP,L.handO]){
    if(!h)continue;
    for(let i=0;i<4;i++)drawSlot(g,handSlot(h,i));
  }
}
function tableUI(){
  const act=!!(M&&M.phase==='pAction'&&(!M.vs||M.seat===M.turn));
  const armed=act&&M.sel>=0?sideOf(M.turn).hand[M.sel]:null;
  return {act,armed,flipOk:!!(armed&&canFlip(armed))};
}
function drawPassShutter(g){
  if(!M||M.phase!=='pass')return;
  const name=plateName(M.turn).toUpperCase();
  g.save();
  g.fillStyle='rgba(2,6,14,0.72)';
  g.fillRect(0,0,W,H);
  const bw=Math.min(W*0.84,420),bh=Math.min(H*0.28,150);
  const bx=(W-bw)/2,by=(H-bh)/2;
  rr(g,bx,by,bw,bh,14);
  g.fillStyle='rgba(2,8,18,0.94)';g.fill();
  g.strokeStyle='#3a78d0';g.lineWidth=2;g.stroke();
  tText(g,'PASS TO '+name,W/2,by+bh*0.38,Math.max(13,Math.round(bh*0.18)),'#7ec8e8',2.2,'center',true,1);
  tText(g,'TAP WHEN READY',W/2,by+bh*0.68,Math.max(10,Math.round(bh*0.12)),'#ffe14d',1.6,'center',true,1);
  g.restore();
}
function render(now){
  if(curScreen!=='match'||!M||!ctx||!STATIC)return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.drawImage(STATIC,0,0,W,H);
  if(L.fallback)return;
  if(M.p.score!==M.lastScores.p){M.flashBadge.p=now;M.lastScores.p=M.p.score;}
  if(M.o.score!==M.lastScores.o){M.flashBadge.o=now;M.lastScores.o=M.o.score;}
  const whoP=viewWho('p'),whoO=viewWho('o');
  drawChannel(ctx,L.chanP,chanState(whoP));
  drawChannel(ctx,L.chanO,chanState(whoO));
  drawOrb(ctx,L.orbP,L.orbP.r,orbState(whoP),now);
  drawOrb(ctx,L.orbO,L.orbO.r,orbState(whoO),now);
  drawBadge(ctx,L.badges[0],sideOf(whoP).score,M.flashBadge[whoP],now);
  drawBadge(ctx,L.badges[1],sideOf(whoO).score,M.flashBadge[whoO],now);
  function paintHand(panel,handL){
    if(!handL)return;
    const who=viewWho(panel),open=handOpen(who),S=sideOf(who);
    for(let i=0;i<4;i++){
      const rct=handSlot(handL,i),card=S.hand[i];
      if(!card)continue;
      if(!open){drawCard(ctx,rct.x,rct.y,rct.w,rct.h,null,{back:true});continue;}
      const armed=M.sel===i&&M.turn===who;
      drawCard(ctx,rct.x,rct.y,rct.w,rct.h,card,{
        orient:armed?M.orient:1, varV:armed?M.varV:1, selected:armed
      });
    }
  }
  paintHand('o',L.handO);
  paintHand('p',L.handP);
  for(const panel of ['p','o']){
    const who=viewWho(panel),S=sideOf(who),grid=panel==='p'?L.gridP:L.gridO;
    for(let i=0;i<9;i++){
      const sl=S.board[i];if(!sl)continue;
      const rc=slotRect(grid,Math.floor(i/3),i%3);
      const dp=dealProgress(who,i,now);
      ctx.save();ctx.globalAlpha=dp;
      ctx.translate(rc.x+rc.w/2,rc.y+rc.h/2-(1-dp)*36);
      const sc=0.85+0.15*dp;ctx.scale(sc,sc);
      drawCard(ctx,-(rc.w-6)/2,-(rc.h-6)/2,rc.w-6,rc.h-6,sl.card,{
        orient:slotOrient(sl), varV:slotVarV(sl)
      });
      ctx.restore();
    }
  }
  const ui=tableUI();
  drawTableButton(ctx,L.btnFlip,'FLIP',{dim:!ui.flipOk,lit:ui.flipOk});
  drawTableButton(ctx,L.btnEnd,'END TURN',{dim:!ui.act,lit:ui.act,hint:'space'});
  drawTableButton(ctx,L.btnStand,'STAND',{dim:!ui.act,hint:'return'});
  drawTableButton(ctx,L.btnForf,'FORFEIT',{ghost:true,dim:!canForfeit()});
  if(M.anims.flash){
    const p=(now-M.anims.flash.t0)/500;
    if(p<1){
      const panel=viewWho('p')===M.anims.flash.who?'p':'o';
      const grid=panel==='p'?L.gridP:L.gridO;
      ctx.save();ctx.globalAlpha=(1-p)*0.35;ctx.fillStyle='#d02020';
      const gx=L.gapX!=null?L.gapX:L.gap, gy=L.gapY!=null?L.gapY:L.gap;
      rr(ctx,grid.x-10,grid.y-10,3*L.sw+2*gx+20,3*L.sh+2*gy+20,10);ctx.fill();ctx.restore();
    }else M.anims.flash=null;
  }
  M.toasts=M.toasts.filter(t=>now-t.t0<1300);
  M.toasts.forEach((t,i)=>{
    const p=(now-t.t0)/1300;
    ctx.save();ctx.globalAlpha=p<0.15?p/0.15:1-Math.max(0,(p-0.6))/0.4;
    tText(ctx,t.t,W/2,(L.toastY||H*0.414)-i*Math.round(22*H/768),15,'#bfe8ff',3);
    ctx.restore();
  });
  drawPassShutter(ctx);
}
