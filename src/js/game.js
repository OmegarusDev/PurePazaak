let M=null,STATIC=null,DPR=1,curScreen='title',deckRung=0,deckSel=[],deckWager=null;
let cv=null,ctx=null;
/** View hooks — ui/main bind these so game.js never touches the DOM. */
const gameHooks={dialog:null,spoils:null,onEnterMatch:null,onLeaveMatch:null};
function sideOf(w){return w==='p'?M.p:M.o;}
function other(w){return w==='p'?'o':'p';}
function toast(t){M.toasts.push({t,t0:performance.now()});nudgeRender();}
function nudgeRender(){
  if(typeof kickRender==='function')kickRender();
}
function matchBusy(now){
  if(!M)return false;
  now=now||0;
  const deal=M.anims&&M.anims.deal;
  if(deal&&now-deal.t0<220)return true;
  const flash=M.anims&&M.anims.flash;
  if(flash&&now-flash.t0<520)return true;
  if(M.toasts&&M.toasts.some(t=>now-t.t0<1320))return true;
  if(M.flashBadge){
    if((M.flashBadge.p||0)>0&&now-M.flashBadge.p<470)return true;
    if((M.flashBadge.o||0)>0&&now-M.flashBadge.o<470)return true;
  }
  return false;
}
let matchDlg=null;
function presentDialog(title,sub,onOK,opts){
  const o=opts||{};
  matchDlg={onOK:onOK,onCancel:o.onCancel||null};
  if(gameHooks.dialog)gameHooks.dialog(title,sub,o);
}
function dialogOK(){
  AUDIO.play('click');
  const d=matchDlg;matchDlg=null;
  if(gameHooks.closeModal)gameHooks.closeModal();
  // Defer under a real UI so the same click cannot hit the next modal's button.
  if(d&&d.onOK){if(gameHooks.dialog)setTimeout(()=>d.onOK(),0);else d.onOK();}
}
function dialogCancel(){
  AUDIO.play('click');
  const d=matchDlg;matchDlg=null;
  if(gameHooks.closeModal)gameHooks.closeModal();
  if(d&&d.onCancel){if(gameHooks.dialog)setTimeout(()=>d.onCancel(),0);else d.onCancel();}
}
function isVs(){return !!(M&&M.vs);}
function acting(){return !!(M&&M.phase==='pAction'&&(!M.vs||M.seat===M.turn));}
function viewWho(panel){
  if(!isVs())return panel;
  const seat=M.seat||'p';
  return panel==='p'?seat:other(seat);
}
function plateName(who){
  if(isVs()&&M.names)return M.names[who]||(who==='p'?'Player 1':'Player 2');
  return who==='p'?'YOU':((M.opp&&M.opp.name)||'Opponent');
}
function handOpen(who){
  if(!M)return false;
  if(M.phase==='pass'||M.phase==='over'||M.phase==='done')return false;
  if(M.vs)return who===M.seat&&M.phase==='pAction';
  return who==='p';
}
function acceptPass(){
  if(!M||M.phase!=='pass')return;
  AUDIO.play('click');
  M.seat=M.turn;M.sel=-1;M.orient=1;M.varV=1;M.sidePlayed=false;
  drawTo(M.turn);
  const res=resolveAfterDraw(M.turn);
  if(res==='fill'||res==='bust'){refreshVsView();return;}
  if(res==='stood'){
    if(sideOf(other(M.turn)).stood)resolveStandoff();
    else beginTurn(other(M.turn));
    refreshVsView();return;
  }
  M.phase='pAction';
  refreshVsView();
}
function refreshVsView(){
  if(typeof renderStatic==='function')renderStatic();
  nudgeRender();
}
function queueHumanTurn(w){
  M.sidePlayed=false;M.sel=-1;M.orient=1;M.varV=1;
  if(M.vs&&M.seat!==w){M.phase='pass';nudgeRender();return;}
  M.phase='pAction';
  nudgeRender();
}
function vsPlayerName(raw,fallback){
  const n=cleanName(raw);
  return n==='Unknown'?fallback:n.slice(0,18);
}
function newMatch(opp,replayRung,opts){
  const o=opts||{};
  const tk=M?M.token+1:1;
  const mkSide=()=>({board:Array(9).fill(null),hand:[null,null,null,null],score:0,stood:false,bust:false,tiebreak:false,side:[]});
  M={opp,replayRung,token:tk,phase:'idle',setNum:0,setsP:0,setsO:0,
     setStarter:o.vs?'p':(Math.random()<0.5?'p':'o'),turn:'p',
     p:mkSide(),o:mkSide(),deck:[],sel:-1,orient:1,varV:1,sidePlayed:false,toasts:[],
     anims:{deal:null,flash:null},flashBadge:{p:0,o:0},lastScores:{p:0,o:0},wager:0,
     vs:!!o.vs,seat:'p',names:{p:'YOU',o:(opp&&opp.name)||'Opponent'}};
  if(M.vs){
    M.names.p=vsPlayerName(o.pName,'Player 1');
    M.names.o=vsPlayerName(o.oName,(opp&&opp.name)||'Player 2');
  }
  const pDeck=o.pDeck||SAVE.lastDeck||[];
  const oDeck=o.oDeck||genSideDeck(opp.tier);
  M.p.side=pDeck.map(id=>makeCard(id)).filter(Boolean);
  M.o.side=(oDeck||[]).map(id=>makeCard(id)).filter(Boolean);
  for(const w of ['p','o']){
    const S=sideOf(w);
    const n=S.side.length;
    const idxs=shuffle([...Array(n).keys()]).slice(0,Math.min(4,n)).sort((a,b)=>a-b);
    S.hand=[null,null,null,null];
    idxs.forEach((si,hi)=>{S.hand[hi]=makeCard(S.side[si].id);});
  }
}
function startSet(){
  M.setNum++;M.deck=buildMainDeck();
  for(const w of ['p','o']){const S=sideOf(w);S.board=Array(9).fill(null);S.score=0;S.stood=false;S.bust=false;S.tiebreak=false;}
  M.sel=-1;M.orient=1;M.varV=1;M.sidePlayed=false;M.phase='turn';M.anims.deal=null;
  toast('SET '+M.setNum);
  beginTurn(M.setStarter);
}
function drawTo(w){
  if(!M||!M.deck.length)return;
  const c=M.deck.pop();if(!c)return;
  const i=placeMain(sideOf(w),c);
  if(i<0)return;
  AUDIO.play('draw');
  M.anims.deal={who:w,slot:i,t0:performance.now()};
  nudgeRender();
}
function bustFlash(w){
  sideOf(w).bust=true;
  M.anims.flash={who:w,t0:performance.now()};
  AUDIO.play('bust');
  nudgeRender();
}
/** Shared post-draw / post-play checks. Fill wins only at ≤20. */
function resolveBoard(w){
  const S=sideOf(w);S.score=boardScore(S.board);
  if(boardCount(S.board)===9){
    if(S.score>20){bustFlash(w);endSet(other(w),'bust');return 'bust';}
    endSet(w,'fill');return 'fill';
  }
  if(S.score===20){S.stood=true;toast('TWENTY!');return 'stood';}
  return 'ok';
}
function resolveAfterDraw(w){return resolveBoard(w);}
function beginTurn(w){
  M.turn=w;
  if(sideOf(w).stood){
    if(sideOf(other(w)).stood){resolveStandoff();return;}
    beginTurn(other(w));
    return;
  }
  if(M.vs&&M.seat!==w){M.phase='pass';nudgeRender();return;}
  drawTo(w);
  const res=resolveAfterDraw(w);
  if(res==='fill'||res==='bust')return;
  if(res==='stood'){
    if(sideOf(other(w)).stood){resolveStandoff();return;}
    beginTurn(other(w));
    return;
  }
  if(w==='p'||M.vs)queueHumanTurn(w);
  else{M.phase='oTurn';aiTurn(M.token);}
}
function passToOpp(){beginTurn(other(M.turn));}
function endPlayerTurn(){
  if(!acting())return;AUDIO.play('click');M.sel=-1;
  const w=M.turn;
  if(sideOf(w).score>20){bustFlash(w);endSet(other(w),'bust');return;}
  beginTurn(other(w));
  nudgeRender();
}
function playerStand(){
  if(!acting())return;AUDIO.play('click');
  const w=M.turn,S=sideOf(w);
  if(S.score>20){bustFlash(w);endSet(other(w),'bust');return;}
  S.stood=true;M.sel=-1;toast(plateName(w).toUpperCase()+' STANDS');
  if(sideOf(other(w)).stood)resolveStandoff();else beginTurn(other(w));
  nudgeRender();
}
function cycleFlex(){
  if(M.orient>0&&M.varV===1)M.varV=2;
  else if(M.orient>0&&M.varV===2){M.orient=-1;M.varV=1;}
  else if(M.orient<0&&M.varV===1)M.varV=2;
  else{M.orient=1;M.varV=1;}
}
function flipArmed(){
  if(!acting()||M.sel<0)return;
  const card=sideOf(M.turn).hand[M.sel];
  if(!canFlip(card))return;
  AUDIO.play('click');
  if(card.kind==='flex')cycleFlex();
  else M.orient*=-1;
  nudgeRender();
}
function confirmPlay(i){
  if(!acting()||M.sidePlayed)return;
  const w=M.turn,S=sideOf(w);
  const card=S.hand[i];if(!card)return;
  if(card.kind==='dbl'&&!lastMain(S.board)){toast('NOTHING TO DOUBLE');return;}
  if(card.kind==='flip'){
    const n=applyFlip(S.board,card.vals);
    if(!n){toast('NOTHING TO FLIP');return;}
    AUDIO.play('place');
    toast('FLIPPED '+n+' CARD'+(n===1?'':'S'));
  }else{
    AUDIO.play('place');
    if(card.kind==='dbl')applyDouble(S.board);
    else{const si=placeSide(S,card,M.orient,M.varV);if(si>=0)M.anims.deal={who:w,slot:si,t0:performance.now()};}
  }
  if(card.kind==='tie')S.tiebreak=true;
  S.hand[i]=null;M.sel=-1;M.sidePlayed=true;
  const res=resolveBoard(w);
  nudgeRender();
  if(res==='fill'||res==='bust')return;
  if(res==='stood'){if(sideOf(other(w)).stood)resolveStandoff();else beginTurn(other(w));}
}
function bustRisk(w){
  const S=sideOf(w),rem=M.deck.length;
  if(!rem)return 1;
  let bad=0;for(const c of M.deck)if(S.score+c.v>20)bad++;
  return bad/rem;
}
async function aiLive(tk){
  while(M&&M.token===tk&&M.phase==='oTurn'&&matchDlg)await sleep(50);
  return !!(M&&M.token===tk&&M.phase==='oTurn');
}
async function aiTurn(tk){
  await sleep(650);if(!await aiLive(tk))return;
  await sleep(520);if(!await aiLive(tk))return;
  const snap={score:M.o.score,board:M.o.board,hand:M.o.hand,oppScore:M.p.score,oppStood:M.p.stood,tier:M.opp.tier,bustRisk:bustRisk('o'),setsO:M.setsO};
  const d=aiDecide(snap);
  if(d.play){
    const card=M.o.hand[d.play.idx];
    AUDIO.play('place');
    if(d.play.tag==='dbl')applyDouble(M.o.board);
    else if(d.play.tag==='flip')applyFlip(M.o.board,card.vals);
    else{const si=placeSide(M.o,card,d.play.orient,d.play.varV||1);if(si>=0){M.anims.deal={who:'o',slot:si,t0:performance.now()};nudgeRender();}}
    if(card.kind==='tie')M.o.tiebreak=true;
    M.o.hand[d.play.idx]=null;
    nudgeRender();
    await sleep(430);if(!await aiLive(tk))return;
    const res=resolveBoard('o');
    if(res==='fill'||res==='bust')return;
    if(res==='stood'){if(M.p.stood)resolveStandoff();else beginTurn('p');return;}
  }
  if(M.o.score>20){bustFlash('o');endSet('p','bust');return;}
  if(d.play){
    const after={...snap,score:M.o.score,board:M.o.board,hand:M.o.hand,bustRisk:bustRisk('o')};
    // Plus/side plays that raise the total: stand (human play). Exception: still
    // losing to a stood opponent — standing would concede, so keep going.
    const raised=M.o.score>snap.score;
    const losingToStood=M.p.stood&&M.o.score<M.p.score;
    if((raised&&!losingToStood)||shouldStand(M.o.score,after)){
      M.o.stood=true;toast(M.opp.name.toUpperCase()+' STANDS');
      if(M.p.stood)resolveStandoff();else beginTurn('p');return;
    }
  }else if(d.stand){
    M.o.stood=true;toast(M.opp.name.toUpperCase()+' STANDS');
    if(M.p.stood)resolveStandoff();else beginTurn('p');
    return;
  }
  beginTurn('p');
}
function resolveStandoff(){
  const ps=M.p.score,os=M.o.score;
  let winner=null;
  if(ps>os)winner='p';else if(os>ps)winner='o';
  else if(M.p.tiebreak&&!M.o.tiebreak)winner='p';
  else if(M.o.tiebreak&&!M.p.tiebreak)winner='o';
  if(winner){endSet(winner,'score');return;}
  M.phase='over';
  nudgeRender();
  presentDialog('THE SET IS TIED.','NO POINT AWARDED',()=>{
    M.setStarter=other(M.setStarter);
    if(M.vs)M.seat=null;
    startSet();
  });
}
function endSet(winner,reason){
  M.phase='over';M.sel=-1;
  if(winner==='p')M.setsP++;else M.setsO++;
  nudgeRender();
  if(M.vs)AUDIO.play(reason==='bust'?'bust':'win');
  else if(winner==='p')AUDIO.play('win');
  else AUDIO.play(reason==='bust'?'bust':'lose');
  const lines=setEndText(winner,reason);
  presentDialog(lines[0],lines[1],()=>{
    if(M.setsP>=3){matchEnd('p');return;}
    if(M.setsO>=3){matchEnd('o');return;}
    M.setStarter=winner;
    if(M.vs)M.seat=null;
    startSet();
  });
}
function setEndText(winner,reason){
  const wName=plateName(winner).toUpperCase();
  const lName=plateName(other(winner)).toUpperCase();
  if(M.vs){
    if(reason==='bust')return [wName+' WINS THE SET.',lName+' WENT BUST'];
    if(reason==='fill')return [wName+' WINS THE SET.','BOARD FILLED - NINE CARDS'];
    return [wName+' WINS THE SET.',sideOf(winner).score+' TO '+sideOf(other(winner)).score];
  }
  if(winner==='p'){
    if(reason==='bust')return ['YOU WIN THE SET.','OPPONENT BUSTED'];
    if(reason==='fill')return ['YOU WIN THE SET.','BOARD FILLED - NINE CARDS'];
    return ['YOU WIN THE SET.',M.p.score+' TO '+M.o.score];
  }
  if(reason==='bust')return ['OPPONENT WINS THE SET.','YOU WENT BUST'];
  if(reason==='fill')return ['OPPONENT WINS THE SET.','THEIR BOARD FILLED'];
  return ['OPPONENT WINS THE SET.',M.o.score+' TO '+M.p.score];
}
function matchEnd(winner){
  M.phase='done';
  SAVE.activeMatch=null;
  nudgeRender();
  if(M.vs){
    AUDIO.play('win');
    presentDialog(plateName(winner).toUpperCase()+' WINS.','FIRST TO 3 SETS',()=>leaveMatch());
    return;
  }
  if(winner==='p'){
    AUDIO.play('win');
    const rematch=M.replayRung!=null,wager=M.wager||0;
    SAVE.credits=Math.min(999999999,SAVE.credits+wager*2);
    if(!rematch)SAVE.circuit=Math.min(CIRCUIT_LEN,SAVE.circuit+1);
    persist();
    if(rematch&&wager===0){
      presentDialog('PRACTICE WON.','NO CREDITS OR CARD SPOILS',()=>leaveMatch());
      return;
    }
    if(gameHooks.spoils)gameHooks.spoils(wager,rematch);
  }else{
    AUDIO.play('lose');
    persist();
    const practice=M.replayRung!=null&&(M.wager||0)===0;
    presentDialog(practice?'PRACTICE DEFEAT.':'DEFEAT.',practice?'NO CREDITS LOST':'YOU LOSE THE WAGER  \u00B7  '+(M.wager||0)+' CR',()=>leaveMatch());
  }
}
function leaveMatch(){
  const vs=isVs();
  SAVE.activeMatch=null;
  persist();
  if(M)M.token++;M=null;
  if(gameHooks.onLeaveMatch)gameHooks.onLeaveMatch(vs);
}
function startVsMatch(names,tier,pDeck,oDeck){
  const n1=vsPlayerName(names&&names[0],'Player 1');
  const n2=vsPlayerName(names&&names[1],'Player 2');
  const t=Math.max(1,Math.min(3,tier|0||1));
  const opp={name:n2,tier:t,title:'Challenger'};
  newMatch(opp,null,{vs:true,pDeck:pDeck,oDeck:oDeck,pName:n1,oName:n2});
  M.wager=0;M.seat='p';
  if(gameHooks.onEnterMatch)gameHooks.onEnterMatch();
  startSet();
}
function startMatch(rung,requestedWager){
  const opp=Array.isArray(SAVE.roster)?SAVE.roster[rung]:null;
  if(!opp||!Number.isInteger(opp.tier)||opp.tier<1||opp.tier>3){presentDialog('MATCH UNAVAILABLE','THE OPPONENT DATA IS INVALID',()=>{});return;}
  const replay=rung<SAVE.circuit,maxWager=matchWager(opp.tier);
  const wager=replay&&requestedWager!=null?clampReplayWager(opp.tier,requestedWager):maxWager;
  if(SAVE.credits<wager){
    presentDialog('NOT ENOUGH CREDITS','THIS TABLE WANTS '+wager+' CR',()=>{});
    return;
  }
  SAVE.credits-=wager;
  newMatch(opp,replay?rung:null);
  M.wager=wager;
  SAVE.activeMatch=wager>0?{wager,rung,startedAt:Date.now()}:null;
  if(!persist()){
    SAVE.credits+=wager;SAVE.activeMatch=null;M=null;refreshCredits();
    presentDialog('MATCH UNAVAILABLE','YOUR SAVE COULD NOT BE UPDATED',()=>{});
    return;
  }
  if(gameHooks.onEnterMatch)gameHooks.onEnterMatch();
  const terms=wager>0?'WAGER '+wager+' CR  \u00B7  TIER '+opp.tier+'  \u00B7  FIRST TO 3 SETS':'PRACTICE  \u00B7  TIER '+opp.tier+'  \u00B7  NO REWARDS';
  presentDialog('VS '+opp.name.toUpperCase(),terms,()=>startSet());
}
function dealProgress(who,slot,now){
  const a=M&&M.anims.deal;
  if(a&&a.who===who&&a.slot===slot){const p=(now-a.t0)/190;if(p<1)return p;M.anims.deal=null;}
  return 1;
}
function orbState(w){
  const S=sideOf(w);
  if(S.bust)return 'red';
  if(S.stood)return 'amber';
  if(M.turn===w&&(M.phase==='pAction'||M.phase==='oTurn'||M.phase==='turn'||M.phase==='pass'))return 'red';
  return 'idle';
}
function matchLive(){return !!(M&&M.phase!=='done'&&M.phase!=='over');}
function canForfeit(){return matchLive();}
function chanState(w){
  const sets=w==='p'?M.setsP:M.setsO;
  return [sets>0?'red':'off',sets>1?'red':'off',sets>2?'red':'off'];
}
