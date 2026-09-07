'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const choice=a=>a[Math.floor(Math.random()*a.length)];
// RefPlus 572x772. Every drawn card letterboxes into this aspect so wells,
// badge, and plate stay in the measured places at catalog/hand/table sizes.
const CARD_ASPECT=572/772;
function fitCard(w,h){
  let cw=w,ch=w/CARD_ASPECT;
  if(ch>h){ch=h;cw=h*CARD_ASPECT;}
  return {ox:(w-cw)/2,oy:(h-ch)/2,w:cw,h:ch};
}
function cardChamfer(w,frac){return Math.max(0.55,frac*w);}
function mulberry(seed){
  let s=seed>>>0;
  return function(){s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
}
let SLEEP_SCALE=1;
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms*SLEEP_SCALE)));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);const r=clamp((n>>16)+amt,0,255),g=clamp(((n>>8)&255)+amt,0,255),b=clamp((n&255)+amt,0,255);return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function rrPath(w,h,r){const p=new Path2D();p.moveTo(r,0);p.lineTo(w-r,0);p.quadraticCurveTo(w,0,w,r);p.lineTo(w,h-r);p.quadraticCurveTo(w,h,w-r,h);p.lineTo(r,h);p.quadraticCurveTo(0,h,0,h-r);p.lineTo(0,r);p.quadraticCurveTo(0,0,r,0);p.closePath();return p;}
const HUD_FONT='"DIN Alternate","Bank Gothic","Eurostile","Avenir Next Condensed","Century Gothic","Futura","Trebuchet MS",sans-serif';
function drawKeyHint(g,x,y,kind,col,btnH){
  g.save();g.strokeStyle=col;g.fillStyle=col;g.lineWidth=1.3;
  if(kind==='return'){
    const fs=Math.max(10,Math.round(btnH*0.38));
    g.textAlign='center';g.textBaseline='middle';
    g.font=`600 ${fs}px ${HUD_FONT}`;
    g.fillText('\u23CE',x,y+0.5);
  }else{
    const w=Math.max(20,btnH*0.78), h=Math.max(9,btnH*0.34);
    rr(g,x-w/2,y-h/2,w,h,h/2);g.fill();
    g.fillStyle='#141418';
    g.textAlign='center';g.textBaseline='middle';
    g.font=`700 ${Math.max(8,Math.round(h*0.72))}px ${HUD_FONT}`;
    g.fillText('\u2423',x,y+0.5);
  }
  g.restore();
}
function tText(g,text,x,y,size,color,spacing=1.4,align='center',bold=true,condense=1){
  g.save();g.font=(bold?'700 ':'400 ')+size+'px '+HUD_FONT;g.fillStyle=color;g.textBaseline='middle';g.textAlign='left';
  const chars=String(text).toUpperCase().split('');
  let tw=0;const ws=chars.map(ch=>{const cw=g.measureText(ch).width;tw+=cw+spacing;return cw;});
  tw-=spacing;tw*=condense;
  let sx=align==='center'?x-tw/2:align==='right'?x-tw:x;
  g.scale(condense,1);sx/=condense;
  for(let i=0;i<chars.length;i++){g.fillText(chars[i],sx,y);sx+=ws[i]+spacing;}
  g.restore();
}
