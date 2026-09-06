'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const choice=a=>a[Math.floor(Math.random()*a.length)];
let SLEEP_SCALE=1;
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms*SLEEP_SCALE)));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);const r=clamp((n>>16)+amt,0,255),g=clamp(((n>>8)&255)+amt,0,255),b=clamp((n&255)+amt,0,255);return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function rrPath(w,h,r){const p=new Path2D();p.moveTo(r,0);p.lineTo(w-r,0);p.quadraticCurveTo(w,0,w,r);p.lineTo(w,h-r);p.quadraticCurveTo(w,h,w-r,h);p.lineTo(r,h);p.quadraticCurveTo(0,h,0,h-r);p.lineTo(0,r);p.quadraticCurveTo(0,0,r,0);p.closePath();return p;}
function tText(g,text,x,y,size,color,spacing=2,align='center',bold=true,condense=0.94){
  g.save();g.font=(bold?'700 ':'400 ')+size+'px Futura,"Century Gothic","Avenir Next","Arial Narrow",Arial,sans-serif';g.fillStyle=color;g.textBaseline='middle';g.textAlign='left';
  const chars=String(text).toUpperCase().split('');
  let tw=0;const ws=chars.map(ch=>{const cw=g.measureText(ch).width;tw+=cw+spacing;return cw;});
  tw-=spacing;tw*=condense;
  let sx=align==='center'?x-tw/2:align==='right'?x-tw:x;
  g.scale(condense,1);sx/=condense;
  for(let i=0;i<chars.length;i++){g.fillText(chars[i],sx,y);sx+=ws[i]+spacing;}
  g.restore();
}
