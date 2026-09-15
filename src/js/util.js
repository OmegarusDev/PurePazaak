'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const choice=a=>a[Math.floor(Math.random()*a.length)];
function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
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
const CARD_FONT='"Orbitron","DIN Alternate","Bank Gothic","Eurostile",sans-serif';
const GUI_FONT='"Bank Gothic","BankGothic Md BT","BlairMdITC TT","ITC Blair","Blair Medium","DIN Alternate","Eurostile","Microgramma","Century Gothic",sans-serif';
const DIALOG_FONT='Arial,Helvetica,"Helvetica Neue",sans-serif';
const NAME_TRACK_EM=0.12;
const HUD_FONT=CARD_FONT;
function drawKeyHint(g,x,y,kind,col,btnH){
  g.save();g.strokeStyle=col;g.fillStyle=col;g.lineWidth=1.3;
  if(kind==='return'){
    const fs=Math.max(10,Math.round(btnH*0.38));
    g.textAlign='center';g.textBaseline='middle';
    g.font=`600 ${fs}px ${GUI_FONT}`;
    g.fillText('\u23CE',x,y+0.5);
  }else{
    const w=Math.max(20,btnH*0.78), h=Math.max(9,btnH*0.34);
    rr(g,x-w/2,y-h/2,w,h,h/2);g.fill();
    g.fillStyle='#141418';
    g.textAlign='center';g.textBaseline='middle';
    g.font=`700 ${Math.max(8,Math.round(h*0.72))}px ${GUI_FONT}`;
    g.fillText('\u2423',x,y+0.5);
  }
  g.restore();
}
function isTypingTarget(el){
  if(!el||el===document.body||el===document.documentElement)return false;
  const tag=el.tagName;
  return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||el.isContentEditable;
}
function focusablesIn(root){
  if(!root)return [];
  return [...root.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el=>{
    if(el.disabled||el.hidden||el.getAttribute('aria-hidden')==='true')return false;
    if(el.closest('[hidden]'))return false;
    const tab=el.tabIndex;if(tab<0)return false;
    const r=el.getBoundingClientRect();
    return r.width>2&&r.height>2;
  });
}
function arrowDelta(key){
  if(key==='ArrowUp')return {x:0,y:-1};
  if(key==='ArrowDown')return {x:0,y:1};
  if(key==='ArrowLeft')return {x:-1,y:0};
  if(key==='ArrowRight')return {x:1,y:0};
  return null;
}
function moveFocusArrow(root,key){
  const items=focusablesIn(root);
  if(!items.length)return false;
  const cur=items.includes(document.activeElement)?document.activeElement:null;
  if(key==='Home'){items[0].focus();return true;}
  if(key==='End'){items[items.length-1].focus();return true;}
  const d=arrowDelta(key);if(!d)return false;
  if(!cur){items[0].focus();return true;}
  const cr=cur.getBoundingClientRect();
  const cx=cr.left+cr.width/2,cy=cr.top+cr.height/2;
  let best=null,bestScore=Infinity;
  for(const el of items){
    if(el===cur)continue;
    const r=el.getBoundingClientRect();
    const along=(r.left+r.width/2-cx)*d.x+(r.top+r.height/2-cy)*d.y;
    if(along<=4)continue;
    const across=Math.abs((r.left+r.width/2-cx)*d.y+(r.top+r.height/2-cy)*d.x);
    const score=across*3+along;
    if(score<bestScore){bestScore=score;best=el;}
  }
  if(!best)best=d.x+d.y>0?items[0]:items[items.length-1];
  if(best&&best!==cur){best.focus();return true;}
  return false;
}
function trapModalTab(box,e){
  if(e.key!=='Tab'||!box)return false;
  const items=focusablesIn(box);
  if(!items.length){e.preventDefault();return true;}
  const i=items.indexOf(document.activeElement);
  if(e.shiftKey){
    if(i<=0){e.preventDefault();items[items.length-1].focus();return true;}
  }else if(i===items.length-1||i<0){
    e.preventDefault();items[0].focus();return true;
  }
  return false;
}
function tText(g,text,x,y,size,color,spacing=1.4,align='center',bold=true,condense=1,font,keepCase=false){
  g.save();g.fillStyle=color;g.textBaseline='middle';g.textAlign='left';
  const raw=String(text),chars=(keepCase?raw:raw.toUpperCase()).split('');
  const face=font||GUI_FONT;
  const fontFor=()=>(bold?'700 ':'400 ')+size+'px '+face;
  let tw=0;const ws=chars.map((ch,i)=>{g.font=fontFor(i);const cw=g.measureText(ch).width;tw+=cw+spacing;return cw;});
  tw-=spacing;tw*=condense;
  let sx=align==='center'?x-tw/2:align==='right'?x-tw:x;
  g.scale(condense,1);sx/=condense;
  for(let i=0;i<chars.length;i++){g.font=fontFor(i);g.fillText(chars[i],sx,y);sx+=ws[i]+spacing;}
  g.restore();
}
function tName(g,text,x,y,size,color,align,maxW){
  const spacing=size*NAME_TRACK_EM;
  const raw=String(text);
  g.save();g.font='700 '+size+'px '+DIALOG_FONT;
  let tw=0;
  for(let i=0;i<raw.length;i++)tw+=g.measureText(raw[i]).width+(i?spacing:0);
  g.restore();
  const condense=maxW&&tw>maxW?maxW/tw:1;
  tText(g,raw,x,y,size,color,spacing,align,true,condense,DIALOG_FONT,true);
}
