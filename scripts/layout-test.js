// Headless viewport/layout smoke tests. No browser or canvas implementation is needed.
const fs=require('fs');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','src/js/util.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'..','src/js/layout.js'),'utf8')+
  '\n globalThis.__layoutSnapshot=()=>{computeLayout();return JSON.parse(JSON.stringify({W,H,PORTRAIT,L}));};';
let viewport={w:390,h:844};
globalThis.window={innerWidth:viewport.w,innerHeight:viewport.h,matchMedia:q=>({matches:q.includes('portrait')?viewport.h>=viewport.w:false})};
globalThis.document={querySelector:s=>s==='.match-board'?{getBoundingClientRect:()=>({width:viewport.w,height:viewport.h})}:null};
eval(source);
let fail=0;
function t(name,ok){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)fail++;}
function inBounds(r,s){return r&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isFinite(r.w)&&Number.isFinite(r.h)&&r.w>0&&r.h>0&&r.x>=0&&r.y>=0&&r.x+r.w<=s.W+0.5&&r.y+r.h<=s.H+0.5;}
function checkSize(w,h){
  viewport={w,h};window.innerWidth=w;window.innerHeight=h;
  const s=globalThis.__layoutSnapshot();
  if(s.L.fallback)return {fallback:true};
  const rects=['frame','topP','topO','labP','labO','btnForf','btnFlip','btnEnd','btnStand','chanP','chanO'];
  if(!rects.every(k=>inBounds(s.L[k],s)))return {bad:true};
  const gx=s.L.gapX!=null?s.L.gapX:s.L.gap, gy=s.L.gapY!=null?s.L.gapY:s.L.gap;
  for(const g of [s.L.gridP,s.L.gridO])for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    if(!inBounds({x:g.x+c*(s.L.sw+gx),y:g.y+r*(s.L.sh+gy),w:s.L.sw,h:s.L.sh},s))return {bad:true};
  }
  return {fallback:false};
}
const playable=[[390,844],[375,667],[320,568],[1024,768],[800,800],[240,320]];
const mustFallback=[[100,1000]];
const either=[[280,400],[1920,400],[3440,800]];
for(const [w,h] of playable){
  const r=checkSize(w,h);
  t('layout-playable-'+w+'x'+h,!r.bad&&!r.fallback);
}
for(const [w,h] of mustFallback){
  const r=checkSize(w,h);
  t('layout-fallback-'+w+'x'+h,!!r.fallback&&!r.bad);
}
for(const [w,h] of either){
  const r=checkSize(w,h);
  t('layout-'+w+'x'+h,!r.bad);
}
process.exitCode=fail?1:0;
