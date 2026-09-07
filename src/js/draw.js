function drawCard(g,x,y,w,h,card,o={}){
  const orient=o.orient==null?1:o.orient;
  const varV=o.varV==null?1:o.varV;
  const box=fitCard(w,h);
  g.save();g.translate(x+box.ox,y+box.oy);
  w=box.w;h=box.h;
  if(!card||o.back){drawBack(g,w,h);g.restore();return;}
  const key=cardColor(card,orient),p=cardPath(w,h);
  const isMain=card.kind==='main';
  const isSpecial=isSpecialKind(card.kind);
  const isPlus=card.kind==='mod'&&card.sign>0;
  const isMinus=card.kind==='mod'&&card.sign<0;
  const isDual=card.kind==='dual';
  const showBadge=!isMain&&card.kind!=='dbl'&&card.kind!=='flip';
  let bandKey,bandKey2;
  if(isMain){bandKey='green';bandKey2='green';}
  else if(isSpecial){bandKey='gold';bandKey2='gold';}
  else if(isPlus){bandKey='blue';bandKey2='blue';}
  else if(isMinus){bandKey='red';bandKey2='red';}
  else{bandKey=orient>0?'blue':'red';bandKey2=orient>0?'red':'blue';}
  if(o.glow!==false){g.save();g.shadowColor=CARD_COLORS[key].b;g.shadowBlur=9;g.fillStyle='#000';g.fill(p);g.restore();}
  paintBody(g,p,TEX.taupe,w,h);
  paintInnerMetal(g,w,h,TEX.taupe);
  const tp=GEOM.topPanel,mp=GEOM.midPanel,bp=GEOM.blackPanel,b=GEOM.bottomStrip;
  const ch=cardChamfer(w,GEOM.chamfer),chS=cardChamfer(w,GEOM.stripChamfer);
  let topPath=vNotchedTopPath(tp.x*w,tp.y*h,tp.w*w,tp.h*h,ch,tp.nw,tp.nd);
  if(showBadge)topPath=wellWithBadge(topPath,w,h);
  const botPath=vNotchedMidPath(mp.x*w,mp.y*h,mp.w*w,mp.h*h,ch,mp.nw,mp.nd);
  g.save();g.clip(p);
  fillColorWell(g,topPath,TEX[bandKey],w,h,0);
  recessShade(g,topPath,tp.x*w,tp.y*h,tp.w*w,tp.h*h);
  fillColorWell(g,botPath,TEX[isDual?bandKey2:bandKey],w,h,midDarken(isDual?bandKey2:bandKey));
  recessShade(g,botPath,mp.x*w,mp.y*h,mp.w*w,mp.h*h);
  g.restore();
  paintNumberPlate(g,bp.x*w,bp.y*h,bp.w*w,bp.h*h,Math.min(w,h)*bp.r,'#07070a');
  const lbl=cardLabel(card,orient,varV,!!o.catalog);
  const bh2=bp.h*h;
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
  g.font=`700 ${Math.round(bh2*(lbl.length>3?0.52:0.70))}px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif`;
  g.shadowColor='rgba(0,0,0,0.65)';g.shadowBlur=2;g.shadowOffsetY=1;
  g.fillText(lbl,(bp.x+bp.w/2)*w,(bp.y+bp.h/2)*h);
  g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
  const sh=b.h*h;
  const strip=stripPath(b.w*w,b.h*h,chS);
  g.save();g.clip(p);g.translate(b.x*w,b.y*h);g.clip(strip);
  if(isDual){
    const grad=g.createLinearGradient(0,0,b.w*w,0);
    grad.addColorStop(0,'#c71e1e');grad.addColorStop(0.42,'#c71e1e');grad.addColorStop(0.5,'#7a3a8a');grad.addColorStop(0.58,'#0a2ec0');grad.addColorStop(1,'#0a2ec0');
    g.fillStyle=grad;g.fillRect(0,0,b.w*w,b.h*h);
    g.fillStyle='rgba(0,0,0,0.38)';g.fillRect(0,0,b.w*w,b.h*h);
  }else{
    g.drawImage(TEX[bandKey],-b.x*w,-b.y*h,w,h);
    g.fillStyle=`rgba(0,0,0,${stripDarken(bandKey)})`;g.fillRect(0,0,b.w*w,b.h*h);
  }
  g.restore();
  g.save();g.translate(b.x*w,b.y*h);recessShade(g,strip,0,0,b.w*w,b.h*h);g.restore();
  if(isDual){
    g.fillStyle='#000';g.font=`700 ${Math.round(sh*0.55)}px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif`;
    g.textAlign='center';g.textBaseline='middle';
    g.fillText('-',(b.x+b.w*0.25)*w,(b.y+b.h/2)*h+1);g.fillText('+',(b.x+b.w*0.75)*w,(b.y+b.h/2)*h+1);
  }
  if(showBadge){
    const mark=isPlus?'+':isMinus?'-':orient>0?'+':'-';
    paintBadgeMark(g,w,h,mark);
  }
  if(o.selected){
    g.strokeStyle='#d7e05c';g.lineWidth=2.4;g.stroke(p);
  }
  g.restore();
}
