function shouldStand(score,snap){
  if(score===20)return true;
  if(score>20)return false;
  const {oppStood,tier,setsO,bustRisk,oppScore}=snap;
  // Never lock in a losing total vs a stood opponent — keep drawing/playing.
  if(oppStood&&score<oppScore)return false;
  if(oppStood&&score>=oppScore)return true;
  if(tier===1)return score>=18;
  if(tier===2)return score>=17||(score>=16&&bustRisk<0.3);
  return score>=16||(setsO>=2&&score>=15);
}
function plusFloor(tier){return tier===1?16:15;}
function aiDecide(snap){
  const {score,hand,board,oppScore,oppStood,tier,bustRisk,setsO}=snap;
  const chasing=oppStood&&score<oppScore;
  const evalS=s2=>{
    if(s2===20)return 100;
    let v=s2+(s2>=17?3:s2>=15?1:0);
    if(oppStood){
      if(s2>oppScore)v+=50;
      else if(s2===oppScore)v+=30;
      else v-=(oppScore-s2);
    }
    return v;
  };
  let best=null;const base=evalS(score);
  const pf=plusFloor(tier);
  hand.forEach((card,idx)=>{
    if(!card)return;
    const tryAdd=(orient,val,tag)=>{const s2=score+val;if(s2>20)return;
      if(val>0&&s2<pf&&!chasing)return;
      const v=evalS(s2);if(!best||v>best.v)best={idx,orient,v,tag};};
    if(card.kind==='mod')tryAdd(card.sign,card.sign*card.v,'mod');
    else if(card.kind==='dual'||card.kind==='tie'){tryAdd(1,card.v,'mod');tryAdd(-1,-card.v,'mod');}
    else if(card.kind==='flex'){for(const o of [1,-1])for(const vv of [1,2]){const s2=score+o*vv;if(s2>20)continue;if(o>0&&s2<pf&&!chasing)continue;const v=evalS(s2);if(!best||v>best.v)best={idx,orient:o,varV:vv,v,tag:'flex'};}}
    else if(card.kind==='dbl'){const ls=lastSlot(board);if(ls){const s2=score+ls.eff;if(s2<=20&&!(ls.eff>0&&s2<pf&&!chasing)){const v=evalS(s2)+(s2===20?5:0);if(!best||v>best.v)best={idx,orient:1,v,tag:'dbl'};}}}
    else if(card.kind==='flip'){let s2=score;for(const sl of board){const fv=faceVal(sl);if(fv!=null&&card.vals.includes(fv)&&sl.eff>0)s2-=2*sl.eff;}
      if(s2!==score&&s2<=20){const v=evalS(s2)+(s2>=14&&s2<=17?2:0);if(!best||v>best.v)best={idx,orient:1,v,tag:'flip'};}}
  });
  // When behind a stood opponent, take any improving play; otherwise keep the usual threshold.
  const thr=chasing?0:(tier===1?3:tier===2?3:2);
  const play=best&&best.v>base+thr?best:null;
  const stand=shouldStand(score,snap);
  return {play,stand};
}
