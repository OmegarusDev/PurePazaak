function renderStatic(){
  if(!ctx)return;
  const sk=tableSkin();
  STATIC=document.createElement('canvas');STATIC.width=W*DPR;STATIC.height=H*DPR;
  const g=STATIC.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
  drawFrame(g);
  for(const top of [L.topP, L.topO]){
    const rad=Math.max(6,top.h/2);
    rr(g,top.x,top.y,top.w,top.h,rad);
    g.fillStyle=sk.plate;g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();
    g.strokeStyle=`rgba(255,255,255,${0.05+sk.bevelHi*0.2})`;
    g.beginPath();g.moveTo(top.x+rad,top.y+1.2);g.lineTo(top.x+top.w-rad,top.y+1.2);g.stroke();
  }
  const on=M;
  const nameCol=sk.name;
  g.save();
  rr(g,L.topP.x,L.topP.y,L.topP.w,L.topP.h,Math.max(6,L.topP.h/2));g.clip();
  tText(g,'YOU',L.nameP.x,L.nameP.y,L.fsName||12,nameCol,1.4,'left');
  g.restore();
  g.save();
  rr(g,L.topO.x,L.topO.y,L.topO.w,L.topO.h,Math.max(6,L.topO.h/2));g.clip();
  tText(g,on?on.opp.name:'OPPONENT',L.nameO.x,L.nameO.y,L.fsName||12,nameCol,1.4,'right');
  g.restore();
  for(const grid of [L.gridP,L.gridO]){
    const gx=L.gapX!=null?L.gapX:L.gap, gy=L.gapY!=null?L.gapY:L.gap;
    rr(g,grid.x-10,grid.y-10,3*L.sw+2*gx+20,3*L.sh+2*gy+20,10);
    g.fillStyle=`rgba(0,0,0,${0.12+sk.grime*0.2})`;g.fill();
    g.strokeStyle=`rgba(255,255,255,${0.04+sk.bevelHi*0.12})`;g.lineWidth=1;g.stroke();
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)drawSlot(g,slotRect(grid,r,c));
  }
  for(const lab of [L.labP,L.labO]){
    rr(g,lab.x,lab.y,lab.w,lab.h,5);g.fillStyle=sk.plate;g.fill();
    g.strokeStyle='#000';g.stroke();
  }
  tText(g,'Player Hand',L.labP.x+L.labP.w/2,L.labP.y+L.labP.h/2+1,L.fsLab||13,sk.lab,1.2,'center',true,1,true);
  tText(g,'Opponent Hand',L.labO.x+L.labO.w/2,L.labO.y+L.labO.h/2+1,L.fsLab||13,sk.lab,1.2,'center',true,1,true);
  for(const h of [L.handP,L.handO]){
    if(!h)continue;
    for(let i=0;i<4;i++)drawSlot(g,handSlot(h,i));
  }
}
function tableUI(){
  const act=!!(M&&M.phase==='pAction');
  const armed=act&&M.sel>=0?M.p.hand[M.sel]:null;
  return {act,armed,flipOk:!!(armed&&canFlip(armed))};
}
function render(now){
  if(curScreen!=='match'||!M||!ctx)return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.drawImage(STATIC,0,0,W,H);
  if(M.p.score!==M.lastScores.p){M.flashBadge.p=now;M.lastScores.p=M.p.score;}
  if(M.o.score!==M.lastScores.o){M.flashBadge.o=now;M.lastScores.o=M.o.score;}
  drawChannel(ctx,L.chanP,chanState('p'),now);
  drawChannel(ctx,L.chanO,chanState('o'),now);
  drawOrb(ctx,L.orbP,L.orbP.r,orbState('p'),now);
  drawOrb(ctx,L.orbO,L.orbO.r,orbState('o'),now);
  drawBadge(ctx,L.badges[0],M.p.score,M.flashBadge.p,now);
  drawBadge(ctx,L.badges[1],M.o.score,M.flashBadge.o,now);
  if(L.handO){
    for(let i=0;i<4;i++){
      const rct=handSlot(L.handO,i);
      if(M.o.hand[i])drawCard(ctx,rct.x,rct.y,rct.w,rct.h,null,{back:true});
    }
  }
  if(L.handP){
    for(let i=0;i<4;i++){
      const rct=handSlot(L.handP,i),card=M.p.hand[i];
      if(!card)continue;
      const armed=M.sel===i;
      drawCard(ctx,rct.x,rct.y,rct.w,rct.h,card,{
        orient:armed?M.orient:1, varV:armed?M.varV:1, selected:armed
      });
    }
  }
  for(const who of ['p','o']){
    const S=sideOf(who),grid=who==='p'?L.gridP:L.gridO;
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
  drawTableButton(ctx,L.btnForf,'FORFEIT',{ghost:true,dim:!ui.act});
  if(M.anims.flash){
    const p=(now-M.anims.flash.t0)/500;
    if(p<1){
      const grid=M.anims.flash.who==='p'?L.gridP:L.gridO;
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
}
