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
  const rects=['frame','topP','topO','btnForf','btnFlip','btnEnd','btnStand','chanP','chanO'];
  if(!rects.every(k=>inBounds(s.L[k],s)))return {bad:true,why:'bounds'};
  if(s.L.labP&&!inBounds(s.L.labP,s))return {bad:true,why:'labP'};
  if(s.L.labO&&!inBounds(s.L.labO,s))return {bad:true,why:'labO'};
  const gx=s.L.gapX!=null?s.L.gapX:s.L.gap, gy=s.L.gapY!=null?s.L.gapY:s.L.gap;
  for(const g of [s.L.gridP,s.L.gridO])for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    if(!inBounds({x:g.x+c*(s.L.sw+gx),y:g.y+r*(s.L.sh+gy),w:s.L.sw,h:s.L.sh},s))return {bad:true,why:'slot'};
  }
  if(!(s.L.btnEnd.w>s.L.btnStand.w))return {bad:true,why:'end-width'};
  const gridW=3*s.L.sw+2*gx, gridH=3*s.L.sh+2*gy;
  if(!(s.L.chanP.x+s.L.chanP.w<=s.L.gridP.x+2))return {bad:true,why:'chanP-hand'};
  if(!(s.L.chanO.x+2>=s.L.gridO.x+gridW))return {bad:true,why:'chanO-hand'};
  if(!(s.L.orbP.x<s.L.orbO.x))return {bad:true,why:'orb-hand'};
  if(!(s.L.badges&&s.L.badges[0]&&s.L.badges[0].r&&s.L.badges[1]&&s.L.badges[1].r))return {bad:true,why:'badges'};
  if(s.PORTRAIT){
    if(!(s.L.gridO.y+gridH<=s.L.gridP.y+1))return {bad:true,why:'stack'};
    if(!(s.L.orbP.x<s.W/2&&s.L.orbO.x>s.W/2))return {bad:true,why:'portrait-orbs'};
    if(Math.abs(s.L.gridP.x-s.L.gridO.x)>1)return {bad:true,why:'grids-align'};
    const midP=s.L.gridP.x+s.L.sw+gx+s.L.sw/2;
    const midO=s.L.gridO.x+s.L.sw+gx+s.L.sw/2;
    if(Math.abs(midP-s.W/2)>1)return {bad:true,why:'mid-col-p'};
    if(Math.abs(midO-s.W/2)>1)return {bad:true,why:'mid-col-o'};
    if(s.L.handP.dir==='v')return {bad:true,why:'hand-row'};
    if(Math.abs(s.L.handP.sw-s.L.sw)>1.5)return {bad:true,why:'hand-size'};
    const gridBottom=s.L.gridP.y+3*s.L.sh+2*gy;
    if(s.L.handP.y+1<gridBottom)return {bad:true,why:'hand-below'};
    if(s.L.btnStand.y+1<s.L.handP.y+s.L.handP.sh)return {bad:true,why:'btn-hand'};
    if(!(s.L.chanP.y+1>=s.L.orbP.y+s.L.orbP.r))return {bad:true,why:'chan-orb'};
  }
  return {fallback:false};
}
function snapAt(w,h){
  viewport={w,h};window.innerWidth=w;window.innerHeight=h;
  return globalThis.__layoutSnapshot();
}
const playable=[[390,844],[375,667],[320,568],[1024,768],[800,800],[240,320]];
const mustFallback=[[100,1000]];
const either=[[280,400],[1920,400],[3440,800]];
for(const [w,h] of playable){
  const r=checkSize(w,h);
  t('layout-playable-'+w+'x'+h,!r.bad&&!r.fallback);
  if(r.bad)console.log('  why '+r.why);
}
for(const [w,h] of mustFallback){
  const r=checkSize(w,h);
  t('layout-fallback-'+w+'x'+h,!!r.fallback&&!r.bad);
}
for(const [w,h] of either){
  const r=checkSize(w,h);
  t('layout-'+w+'x'+h,!r.bad);
  if(r.bad)console.log('  why '+r.why);
}
{
  const a=snapAt(390,844),b=snapAt(640,844),c=snapAt(750,844);
  t('portrait-wider-not-smaller',!a.L.fallback&&!b.L.fallback&&!c.L.fallback&&b.L.sw+0.5>=a.L.sw&&c.L.sw+0.5>=b.L.sw);
  t('portrait-wide-mid',Math.abs((b.L.gridP.x+b.L.sw+b.L.gapX+b.L.sw/2)-b.W/2)<=1);
  t('portrait-btn-touch',a.L.btnEnd.h>=36&&b.L.btnEnd.h>=36);
  t('portrait-hand-bottom',!a.L.handP.dir&&Math.abs(a.L.handP.sw-a.L.sw)<1.5&&a.L.handP.sh>=44&&a.L.handP.y>a.L.gridP.y);
  t('landscape-hand-full',Math.abs(snapAt(1024,768).L.handP.sw-snapAt(1024,768).L.sw)<1.5);
}
process.exitCode=fail?1:0;
