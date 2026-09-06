function drawCard(g,x,y,w,h,card,o={}){
  const orient=o.orient==null?1:o.orient;
  g.save();g.translate(x,y);
  if(!card||o.back){drawBack(g,w,h);g.restore();return;}
  const key=cardColor(card,orient),p=cardPath(w,h);
  const isMain=card.kind==='main';
  const isSpecial=card.kind==='tie'||card.kind==='dbl'||card.kind==='flip';
  if(o.glow!==false){g.save();g.shadowColor=CARD_COLORS[key].b;g.shadowBlur=9;g.fillStyle='#000';g.fill(p);g.restore();}
  g.save();g.clip(p);g.drawImage(TEX[isSpecial?key:'taupe'],0,0,w,h);g.restore();
  g.strokeStyle='rgba(0,0,0,0.6)';g.lineWidth=1.5;g.stroke(p);
  if(isSpecial){
    g.save();g.clip(p);
    const d=Math.min(w,h)*0.42,cx=w/2,cy=h*0.5;
    const dp=new Path2D();dp.moveTo(cx,cy-d/2);dp.lineTo(cx+d/2,cy);dp.lineTo(cx,cy+d/2);dp.lineTo(cx-d/2,cy);dp.closePath();
    g.fillStyle='rgba(255,255,255,0.10)';g.fill(dp);
    g.strokeStyle='rgba(0,0,0,0.3)';g.lineWidth=1;g.stroke(dp);
    g.restore();
    const lbl=cardLabel(card,orient);
    if(lbl){g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
      g.font=`700 ${Math.round(h*0.22)}px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif`;g.fillText(lbl,w/2,h*0.5);}
  }else{
    const isMainCard=isMain;
    const isPlus=card.kind==='mod'&&card.sign>0;
    const isMinus=card.kind==='mod'&&card.sign<0;
    const isDual=card.kind==='dual';
    let bandKey,bandKey2;
    if(isMainCard){bandKey='green';bandKey2='green';}
    else if(isPlus){bandKey='blue';bandKey2='blue';}
    else if(isMinus){bandKey='red';bandKey2='red';}
    else{bandKey=orient>0?'blue':'red';bandKey2=orient>0?'red':'blue';}
    // --- Pure vector geometry (GEOM) — deterministic, res-independent, svgsmith-analysed ---
    g.save();g.clip(p);
    const tp=GEOM.topPanel, mp=GEOM.midPanel;
    const topPath=vNotchedTopPath(tp.x*w, tp.y*h, tp.w*w, tp.h*h, tp.r, tp.nw, tp.nd);
    g.save();g.clip(topPath);g.drawImage(TEX[bandKey],0,0,w,h);g.restore();
    g.strokeStyle='rgba(60,45,30,0.35)';g.lineWidth=1;g.stroke(topPath);
    const botPath=vNotchedMidPath(mp.x*w, mp.y*h, mp.w*w, mp.h*h, mp.r, mp.nw, mp.nd);
    g.save();g.clip(botPath);g.drawImage(TEX[isDual?bandKey2:bandKey],0,0,w,h);g.restore();
    g.strokeStyle='rgba(60,45,30,0.35)';g.lineWidth=1;g.stroke(botPath);
    g.restore();
    // black panel - GEOM.blackPanel rounded rect (0.1678,0.3303,0.6678,0.1969, r0.012) - deterministic
    const bp=GEOM.blackPanel;
    rr(g,bp.x*w,bp.y*h,bp.w*w,bp.h*h,Math.min(w,h)*bp.r);
    g.fillStyle='#0b0b0e';g.fill();
    g.strokeStyle='rgba(255,255,255,0.08)';g.lineWidth=1;g.stroke();
    g.strokeStyle='rgba(40,30,20,0.6)';g.lineWidth=1.2;g.stroke();
    const lbl=cardLabel(card,orient);
    g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
    const bh2=bp.h*h;
    g.font=`700 ${Math.round(bh2*(lbl.length>3?0.52:0.70))}px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif`;
    g.fillText(lbl,(bp.x+bp.w/2)*w,(bp.y+bp.h/2)*h);
    const bs=GEOM.bottomStrip;
    const sy=bs.y*h,sh=bs.h*h;
    g.save();g.clip(p);
    if(isDual){
      // dual bottom strip - single rounded rect with horizontal red->blue gradient (authentic has purple mid)
      const b=GEOM.bottomStrip;
      g.save();g.translate(b.x*w,b.y*h);
      const bp3=rrPath(b.w*w,b.h*h,Math.min(w,h)*b.r);
      g.clip(bp3);
      const grad=g.createLinearGradient(0,0,b.w*w,0);
      grad.addColorStop(0,'#c71e1e');grad.addColorStop(0.42,'#c71e1e');grad.addColorStop(0.5,'#7a3a8a');grad.addColorStop(0.58,'#0a2ec0');grad.addColorStop(1,'#0a2ec0');
      g.fillStyle=grad;g.fillRect(0,0,b.w*w,b.h*h);
      // add subtle brushed overlay
      for(let i=0;i<b.h*h;i+=2){g.fillStyle='rgba(255,255,255,0.04)';g.fillRect(0,i, b.w*w,1);}
      g.restore();
      g.fillStyle='#000';g.font=`700 ${Math.round(sh*0.55)}px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif`;
      g.textAlign='center';g.textBaseline='middle';
      g.fillText('-',(b.x+b.w*0.25)*w,(b.y+b.h/2)*h+1);g.fillText('+',(b.x+b.w*0.75)*w,(b.y+b.h/2)*h+1);
    }else if(isMainCard){
      // main deck (green) bottom strip - solid green, no glyph
      const b=GEOM.bottomStrip;
      g.save();g.translate(b.x*w,b.y*h);
      const bp2=rrPath(b.w*w,b.h*h,Math.min(w,h)*b.r);
      g.clip(bp2);
      g.drawImage(TEX[bandKey],-b.x*w,-b.y*h,w,h);
      g.restore();
    }else{
      // bottom strip - GEOM.bottomStrip rounded rect, single colour (pure code)
      const b=GEOM.bottomStrip;
      g.save();g.translate(b.x*w,b.y*h);
      const bp2=rrPath(b.w*w,b.h*h,Math.min(w,h)*b.r);
      g.clip(bp2);
      g.drawImage(TEX[bandKey],-b.x*w,-b.y*h,w,h);
      g.restore();
      g.fillStyle='#000';g.font=`700 ${Math.round(b.h*h*0.55)}px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif`;
      g.textAlign='center';g.textBaseline='middle';
      g.fillText(isPlus?'+':isMinus?'-':orient>0?'+':'-',(b.x+b.w/2)*w,(b.y+b.h/2)*h+1);
    }
    g.restore();
    // badge - GEOM.badge circle slightly inset from corner, no black outline, blends, shares panel's brushed texture
    if(!isMainCard){
      const bd=GEOM.badge;
      const bx=bd.cx*w,by=bd.cy*h,br=bd.r*Math.min(w,h);
      const badgeKey=isPlus?'blue':isMinus?'red':(orient>0?'blue':'red');
      // Badge shares the same brushed metal texture as the top panel (not flat)
      g.save();
      g.beginPath();g.arc(bx,by,br,0,Math.PI*2);g.clip();
      g.drawImage(TEX[badgeKey],0,0,w,h);
      g.restore();
      // very subtle depth: inner highlight
      g.fillStyle='rgba(255,255,255,0.13)';
      g.beginPath();g.arc(bx-br*0.28,by-br*0.32,br*0.22,0,Math.PI*2);g.fill();
      g.fillStyle='#f0c040';g.font=`900 ${Math.round(br*1.45)}px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif`;
      g.textAlign='center';g.textBaseline='middle';
      g.fillStyle='rgba(0,0,0,0.28)';g.fillText(isPlus?'+':isMinus?'-':orient>0?'+':'-',bx+0.5,by+1.5);
      g.fillStyle='#ffe55c';g.fillText(isPlus?'+':isMinus?'-':orient>0?'+':'-',bx,by+0.5);
    }
  }
  g.restore();
}
