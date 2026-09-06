function renderStatic(){
  if(!ctx)return;
  STATIC=document.createElement('canvas');STATIC.width=W*DPR;STATIC.height=H*DPR;
  const g=STATIC.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
  drawFrame(g);
  // Authentic KOTOR top: two black bars with gap for scores, orbs at outer ends
  for(const top of [L.topP, L.topO]){
    rr(g,top.x,top.y,top.w,top.h,8);
    g.fillStyle='#0a0a0c';g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();
    g.strokeStyle='rgba(255,255,255,0.07)';
    g.beginPath();g.moveTo(top.x+10,top.y+1.5);g.lineTo(top.x+top.w-10,top.y+1.5);g.stroke();
  }
  const on=M;
  tText(g,'YOU',L.nameP.x,L.nameP.y,12,'#ffe14d',2.5,'left');
  tText(g,on?on.opp.name:'OPPONENT',L.nameO.x,L.nameO.y,12,'#ffe14d',2.5,'right');
  if(L.deco){
    const d=L.deco,u=H/768;
    drawVentDecor(g,d.cx-162*u,d.vY);drawCircleDecor(g,[d.cx-126*u,d.cx-110*u,d.cx-94*u],d.cY,-1);
    drawCircleDecor(g,[d.cx+78*u,d.cx+94*u,d.cx+110*u],d.cY,0);drawVentDecor(g,d.cx+124*u,d.vY);
  }
  for(const grid of [L.gridP,L.gridO]){
    rr(g,grid.x-10,grid.y-10,3*L.sw+2*L.gap+20,3*L.sh+2*L.gap+20,10);
    g.fillStyle='rgba(0,0,0,0.15)';g.fill();
    g.strokeStyle='rgba(255,255,255,0.05)';g.lineWidth=1;g.stroke();
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)drawSlot(g,slotRect(grid,r,c));
  }
  for(const lab of [L.labP,L.labO]){
    rr(g,lab.x,lab.y,lab.w,lab.h,5);g.fillStyle='#0a0a0c';g.fill();
    g.strokeStyle='#000';g.stroke();
  }
  tText(g,'PLAYER HAND',L.labP.x+L.labP.w/2,L.labP.y+L.labP.h/2+1,13,'#3aa2e8',3);
  tText(g,'OPPONENT HAND',L.labO.x+L.labO.w/2,L.labO.y+L.labO.h/2+1,13,'#3aa2e8',3);
  if(L.handO)for(let i=0;i<4;i++){const h=L.handO;drawSlot(g,{x:h.x+i*(h.sw+h.hgap),y:h.y,w:h.sw,h:h.sh});}
  if(L.vent){
    rr(g,L.vent.x,L.vent.y,L.vent.w,L.vent.h,6);
    g.fillStyle='#101014';g.fill();g.strokeStyle='#0a0a0c';g.lineWidth=1;g.stroke();
    g.fillStyle='rgba(255,255,255,0.05)';
    const n=Math.max(1,Math.floor((L.vent.w-36)/52));
    for(let i=0;i<n;i++)g.fillRect(L.vent.x+18+i*52,L.vent.y+8,4,L.vent.h-16);
  }
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
  // Opponent hand: card rears for unplayed cards so their remaining count reads
  if(L.handO){
    const h=L.handO;
    for(let i=0;i<4;i++){
      const rct={x:h.x+i*(h.sw+h.hgap),y:h.y,w:h.sw,h:h.sh};
      if(M.o.hand[i])drawCard(ctx,rct.x,rct.y,rct.w,rct.h,null,{back:true});
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
      drawCard(ctx,-(rc.w-6)/2,-(rc.h-6)/2,rc.w-6,rc.h-6,sl.card,{});
      ctx.restore();
    }
  }
  if(M.anims.flash){
    const p=(now-M.anims.flash.t0)/500;
    if(p<1){
      const grid=M.anims.flash.who==='p'?L.gridP:L.gridO;
      ctx.save();ctx.globalAlpha=(1-p)*0.35;ctx.fillStyle='#d02020';
      rr(ctx,grid.x-10,grid.y-10,3*L.sw+2*L.gap+20,3*L.sh+2*L.gap+20,10);ctx.fill();ctx.restore();
    }else M.anims.flash=null;
  }
  if(M.sel>=0&&M.p.hand[M.sel]){
    const card=M.p.hand[M.sel];
    let proj=M.p.score;
    if(card.kind==='dbl'){const ls=lastSlot(M.p.board);proj=ls?M.p.score+ls.eff:M.p.score;}
    else if(card.kind==='flip')proj=null;
    else proj=M.p.score+M.orient*card.v;
    const txt=card.kind==='flip'?'FLIP SIGN':proj>20?'BUST!':'PROJECTED: '+proj;
    tText(ctx,txt,L.proj.x,L.proj.y,12,proj!==null&&proj>20?'#ff6060':'#7fd4ff',2);
  }
  M.toasts=M.toasts.filter(t=>now-t.t0<1300);
  M.toasts.forEach((t,i)=>{
    const p=(now-t.t0)/1300;
    ctx.save();ctx.globalAlpha=p<0.15?p/0.15:1-Math.max(0,(p-0.6))/0.4;
    tText(ctx,t.t,W/2,(L.toastY||H*0.414)-i*Math.round(22*H/768),15,'#bfe8ff',3);
    ctx.restore();
  });
  updateHandDOM();
}
