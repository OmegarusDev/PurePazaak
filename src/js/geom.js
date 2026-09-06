// Pure vector geometry — deterministic, resolution-independent, svgsmith-analysed from low-res oracles
// Oracle: RefPlus 572x772 (0.1346,0.0596,0.8007,0.2267), RefMinus 582x774 (0.1323,0.0698,0.7835,0.2209), RefRear 586x778
// Method: svgsmith (OpenCV HSV + HoughCircles + approxPolyDP 0.007) + 800-iter pixel-diff (MSE 46.27) — analysis only, no asset generation
// Canvas normalized 0-1. Layer order: outer (0) -> topPanel (1) -> midPanel (1 mirrored) -> diamond (negative) -> blackPanel (2) -> bottomStrip (3) -> badge (4)
// Symmetry: topPanel ↔ midPanel are vertical translations dy=0.5155 with V inverted (rotational 180° around centre 0.5,0.43); blackPanel centred (0.5,0.4287); badge circle rotationally symmetric
const GEOM={
  outer:{x:0,y:0,w:1,h:0.996,r:0.045},
  // Top/mid panels — SAME dimensions, inverted V, centred + diamond centred on blackPanel (0.4287)
  // Unified: w0.7305 h0.1655 x0.1347 — top y0.0924, mid y0.5995 dy0.5071, V 0.40w/0.48h
  // Badge slightly inset from corner by 2px (0.004w) to avoid optical illusion of being too far out
  topPanel:{x:0.1347,y:0.0924,w:0.7305,h:0.1655, r:0.012, nw:0.40, nd:0.48, tip:{x:0.5,y:0.1785}},
  // Mid panel — same w/h as top, V inverted (tip down) at 0.6789
  midPanel:{x:0.1347,y:0.5995,w:0.7305,h:0.1655, r:0.012, nw:0.40, nd:0.48, tip:{x:0.5,y:0.6789}},
  // Black panel — rounded rect, centred
  blackPanel:{x:0.1678,y:0.3303,w:0.6678,h:0.1969,r:0.012},
  // Bottom strip — same width as top/mid for perfect symmetry, centred
  bottomStrip:{x:0.1347,y:0.8333,w:0.7305,h:0.1628,r:0.012},
  // Badge — circle 6px inset from corner (0.8652,0.0924 -> 0.850,0.115) so centre is 0.015w left and 0.023h down, larger, blends, no outline
  // RefPlus badge at 0.8269,0.1490 was 0.108 left, 0.089 down from corner 0.9353,0.0596, but low-res crop is off by ~0.02; ideal is 0.015/0.023 for optical centre on corner
  badge:{cx:0.850,cy:0.115,r:0.055},
  // Diamond — implicit gap between Vs, height 0.5004h (0.1785->0.6789), width 0.40w at mid, centred on blackPanel
  diamond:{tipTop:{x:0.5,y:0.1785}, tipBot:{x:0.5,y:0.6789}, baseTop:0.2579, baseBot:0.5995}
};
function vNotchedTopPath(x,y,w,h,r,nw,nd){
  const p=new Path2D();
  const rpx=Math.min(w,h)*r;
  p.moveTo(x+rpx,y);
  p.lineTo(x+w-rpx,y);
  p.quadraticCurveTo(x+w,y,x+w,y+rpx);
  p.lineTo(x+w,y+h);
  p.lineTo(x+w*0.5+nw*w/2, y+h);
  p.lineTo(x+w*0.5, y+h-nd*h);
  p.lineTo(x+w*0.5-nw*w/2, y+h);
  p.lineTo(x,y+h);
  p.lineTo(x,y+rpx);
  p.quadraticCurveTo(x,y,x+rpx,y);
  p.closePath();return p;
}
function vNotchedTopWithBadgePath(x,y,w,h,r,nw,nd,bx,by,br){
  const p=vNotchedTopPath(x,y,w,h,r,nw,nd);
  // Add badge circle as part of same shape so it shares brushed texture (no flat fill)
  // Use even-odd to union: add circle path
  const c=new Path2D();
  c.arc(bx,by,br,0,Math.PI*2);
  // Combine by adding to p (Path2D doesn't have union, so we will clip with both separately, but for texture we need to draw with combined clip)
  // Instead return array of paths to be clipped together
  return [p,c];
}
function vNotchedMidPath(x,y,w,h,r,nw,nd){
  const p=new Path2D();
  const rpx=Math.min(w,h)*r;
  p.moveTo(x, y);
  p.lineTo(x+w*0.5-nw*w/2, y);
  p.lineTo(x+w*0.5, y+nd*h);
  p.lineTo(x+w*0.5+nw*w/2, y);
  p.lineTo(x+w, y);
  p.lineTo(x+w, y+h-rpx);
  p.quadraticCurveTo(x+w,y+h,x+w-rpx,y+h);
  p.lineTo(x+rpx,y+h);
  p.quadraticCurveTo(x,y+h,x,y+h-rpx);
  p.lineTo(x,y);
  p.closePath();return p;
}
function tracePath(pts,w,h){const p=new Path2D();p.moveTo(pts[0][0]*w,pts[0][1]*h);for(let i=1;i<pts.length;i++)p.lineTo(pts[i][0]*w,pts[i][1]*h);p.closePath();return p;}
const TRACE={black:[[0.1678,0.3303],[0.8356,0.3303],[0.8356,0.5272],[0.1678,0.5272]], bStripL:[[0.1347,0.8333],[0.5000,0.8333],[0.5000,0.9961],[0.1347,0.9961]], bStripR:[[0.5000,0.8333],[0.8652,0.8333],[0.8652,0.9961],[0.5000,0.9961]]};
function drawBack(g,w,h){
  const p=rrPath(w,h,9);
  g.save();g.shadowColor='rgba(0,0,0,0.5)';g.shadowBlur=6;g.fillStyle='#909098';g.fill(p);g.restore();
  g.save();g.clip(p);g.drawImage(TEX.silver,0,0,w,h);g.restore();
  g.strokeStyle='rgba(0,0,0,0.55)';g.lineWidth=1.5;g.stroke(p);
  rr(g,4,4,w-8,h-8,6);g.strokeStyle='rgba(0,0,0,0.28)';g.lineWidth=1;g.stroke();
  const d=Math.min(w,h)*0.42,cx=w/2,cy=h*0.52;
  const dp=new Path2D();dp.moveTo(cx,cy-d/2);dp.lineTo(cx+d/2,cy);dp.lineTo(cx,cy+d/2);dp.lineTo(cx-d/2,cy);dp.closePath();
  g.fillStyle='rgba(255,255,255,0.10)';g.fill(dp);
  g.save();g.translate(-1,-1);g.strokeStyle='rgba(255,255,255,0.5)';g.lineWidth=1.5;g.stroke(dp);g.restore();
  g.save();g.translate(1,1);g.strokeStyle='rgba(0,0,0,0.45)';g.lineWidth=1.5;g.stroke(dp);g.restore();
  g.beginPath();g.arc(cx,cy-d/2-7,2.5,0,7);g.fillStyle='#c8c8ce';g.fill();g.strokeStyle='rgba(0,0,0,0.4)';g.lineWidth=1;g.stroke();
}
