function shouldStand(score,snap){
  if(score===20)return true;
  if(score>20)return false;
  const {oppStood,tier,setsO,bustRisk,oppScore}=snap;
  // Never lock in a losing total vs a stood opponent — keep drawing/playing.
  if(oppStood&&score<oppScore)return false;
  // Already beating a stood opponent: standing wins the set; drawing can only bust.
  if(oppStood&&score>oppScore)return true;
  // Exact tie vs stood: a drawn set (no point) is often better than risking a bust
  // that hands them the set. From 16 up, lock the draw; below that there is still
  // useful room to press for the win.
  if(oppStood&&score===oppScore)return score>=16;
  if(tier===1)return score>=18;
  if(tier===2)return score>=17||(score>=16&&bustRisk<0.3);
  return score>=16||(setsO>=2&&score>=15);
}
function plusFloor(tier){return tier===1?16:15;}
function aiDecide(snap){
  const {score,hand,board,oppScore,oppStood,tier,bustRisk,setsO}=snap;
  const chasing=oppStood&&score<oppScore;
  const busted=score>20;
  const evalS=s2=>{
    if(s2>20)return -1e9;
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
  const consider=(idx,orient,varV,tag,s2,extra)=>{
    if(s2>20)return;
    const val=s2-score;
    if(val>0&&s2<pf&&!chasing&&!busted)return;
    const v=evalS(s2)+(extra||0);
    if(!best||v>best.v)best={idx,orient,varV,v,tag};
  };
  hand.forEach((card,idx)=>{
    if(!card)return;
    if(card.kind==='mod')consider(idx,card.sign,1,'mod',score+card.sign*card.v,0);
    else if(card.kind==='dual'){
      consider(idx,1,1,'dual',score+card.v,0);
      consider(idx,-1,1,'dual',score-card.v,0);
    }else if(card.kind==='tie'){
      // ±1 plus exclusive tiebreak — value locking a win when equal to a stood opp.
      for(const o of [1,-1]){
        const s2=score+o*card.v;
        let extra=5;
        if(oppStood&&s2===oppScore)extra=45;
        else if(oppStood&&s2>oppScore)extra=10;
        consider(idx,o,1,'tie',s2,extra);
      }
    }else if(card.kind==='flex'){
      for(const o of [1,-1])for(const vv of [1,2])consider(idx,o,vv,'flex',score+o*vv,0);
    }else if(card.kind==='dbl'){
      const ls=lastMain(board);
      if(ls){
        const s2=score+ls.eff;
        if(!(ls.eff>0&&s2<pf&&!chasing&&!busted))consider(idx,1,1,'dbl',s2,s2===20?5:0);
      }
    }else if(card.kind==='flip'){
      let s2=score;
      for(const sl of board){
        const fv=faceVal(sl);
        if(fv!=null&&card.vals.includes(fv)&&sl.eff>0)s2-=2*sl.eff;
      }
      if(s2!==score)consider(idx,1,1,'flip',s2,s2>=14&&s2<=17?2:0);
    }
  });
  // Rescue a bust or chase a stood opponent with any improving play.
  const thr=(busted||chasing)?0:(tier===1?3:tier===2?3:2);
  const play=best&&best.v>base+thr?best:null;
  const stand=shouldStand(score,snap);
  return {play,stand};
}
