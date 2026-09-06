let M=null,STATIC=null,DPR=1,curScreen='title',deckRung=0,deckSel=[];
let cv=null,ctx=null,handEls=[];
function sideOf(w){return w==='p'?M.p:M.o;}
function other(w){return w==='p'?'o':'p';}
function toast(t){M.toasts.push({t,t0:performance.now()});}
let matchDlg=null;
function showDialog(title,sub,onOK,opts){
  const o=opts||{};
  matchDlg={onOK:onOK,onCancel:o.onCancel||null};
  const html='<h2>'+title+'</h2>'+(sub?'<p>'+sub+'</p>':'')+(o.sub2?'<p>'+o.sub2+'</p>':'')+
    '<div class="mrow"><button id="dok" class="kbtn">OK</button>'+(o.cancelText?'<button id="dcancel" class="kbtn">'+o.cancelText+'</button>':'')+'</div>';
  openModal(html);
  $('#dok').onclick=dialogOK;
  if(o.cancelText)$('#dcancel').onclick=dialogCancel;
}
function dialogOK(){AUDIO.play('click');const d=matchDlg;closeModal();matchDlg=null;if(d&&d.onOK)d.onOK();}
function dialogCancel(){AUDIO.play('click');const d=matchDlg;closeModal();matchDlg=null;if(d&&d.onCancel)d.onCancel();}
function newMatch(opp,replayRung){
  const tk=M?M.token+1:1;
  const mkSide=w=>{
    const S={board:Array(9).fill(null),hand:[null,null,null,null],used:[false,false,false,false],score:0,stood:false,bust:false,tiebreak:false,side:[],handIdx:[]};
    return S;};
  M={opp,replayRung,token:tk,phase:'idle',setNum:0,setsP:0,setsO:0,
     setStarter:Math.random()<0.5?'p':'o',turn:'p',
     p:mkSide(),o:mkSide(),deck:[],sel:-1,orient:1,dialog:null,toasts:[],
     anims:{deal:null,flash:null},flashBadge:{p:0,o:0},lastScores:{p:0,o:0}};
  M.p.side=SAVE.lastDeck.map(id=>makeCard(id));
  M.o.side=genSideDeck(opp.tier).map(id=>makeCard(id));
  for(const w of ['p','o']){
    const S=sideOf(w);
    S.handIdx=shuffle([...Array(10).keys()]).slice(0,4).sort((a,b)=>a-b);
    S.hand=S.handIdx.map(i=>makeCard(S.side[i].id));
  }
}
function startSet(){
  M.setNum++;M.deck=buildMainDeck();
  for(const w of ['p','o']){const S=sideOf(w);S.board=Array(9).fill(null);S.score=0;S.stood=false;S.bust=false;S.tiebreak=false;}
  M.sel=-1;M.phase='turn';M.anims.deal=null;
  toast('SET '+M.setNum);
  beginTurn(M.setStarter);
}
function drawTo(w){
  const c=M.deck.pop(),i=placeMain(sideOf(w),c);
  AUDIO.play('draw');
  M.anims.deal={who:w,slot:i,t0:performance.now()};
}
function resolveAfterDraw(w){
  const S=sideOf(w);S.score=boardScore(S.board);
  if(boardCount(S.board)===9){endSet(w,'fill');return 'end';}
  if(S.score===20){S.stood=true;toast('TWENTY!');return 'stood';}
  return 'ok';
}
function beginTurn(w){
  M.turn=w;
  if(sideOf(w).stood){
    if(sideOf(other(w)).stood){resolveStandoff();return;}
    beginTurn(other(w));
    return;
  }
  drawTo(w);
  const res=resolveAfterDraw(w);
  if(res==='end')return;
  if(res==='stood'){
    if(sideOf(other(w)).stood){resolveStandoff();return;}
    beginTurn(other(w));
    return;
  }
  if(w==='p')M.phase='pAction';else{M.phase='oTurn';aiTurn(M.token);}
}
function passToOpp(){beginTurn('o');}
function endPlayerTurn(){if(M.phase!=='pAction')return;AUDIO.play('click');M.sel=-1;if(M.p.score>20){M.p.bust=true;M.anims.flash={who:'p',t0:performance.now()};AUDIO.play('bust');endSet('o','bust');return;}passToOpp();}
function playerStand(){
  if(M.phase!=='pAction')return;AUDIO.play('click');
  if(M.p.score>20){M.p.bust=true;M.anims.flash={who:'p',t0:performance.now()};AUDIO.play('bust');endSet('o','bust');return;}
  M.p.stood=true;M.sel=-1;toast('YOU STAND');
  if(M.o.stood)resolveStandoff();else passToOpp();
}
function flipArmed(){
  if(M.phase!=='pAction'||M.sel<0)return;
  const card=M.p.hand[M.sel];
  if(!card||(card.kind!=='dual'&&card.kind!=='tie'))return;
  AUDIO.play('click');M.orient*=-1;
}
function confirmPlay(i){
  if(M.phase!=='pAction')return;
  const card=M.p.hand[i];if(!card)return;
  if(card.kind==='dbl'&&!lastSlot(M.p.board)){toast('NOTHING TO DOUBLE');return;}
  AUDIO.play('place');
  if(card.kind==='dbl')applyDouble(M.p.board);
  else if(card.kind==='flip'){const n=applyFlip(M.p.board,card.vals);toast('FLIPPED '+n+' CARD'+(n===1?'':'S'));}
  else{const si=placeSide(M.p,card,M.orient);if(si>=0)M.anims.deal={who:'p',slot:si,t0:performance.now()};}
  if(card.kind==='tie')M.p.tiebreak=true;
  M.p.used[i]=true;M.p.hand[i]=null;M.sel=-1;
  M.p.score=boardScore(M.p.board);
  if(boardCount(M.p.board)===9){endSet('p','fill');return;}
  if(M.p.score===20){M.p.stood=true;toast('TWENTY!');
    if(M.o.stood)resolveStandoff();else passToOpp();return;}
}
function bustRisk(w){
  const S=sideOf(w),rem=M.deck.length;
  if(!rem)return 1;
  let bad=0;for(const c of M.deck)if(S.score+c.v>20)bad++;
  return bad/rem;
}
async function aiTurn(tk){
  await sleep(650);if(!M||tk!==M.token||M.phase!=='oTurn')return;
  await sleep(520);if(!M||tk!==M.token||M.phase!=='oTurn')return;
  const snap={score:M.o.score,board:M.o.board,hand:M.o.hand,oppScore:M.p.score,oppStood:M.p.stood,tier:M.opp.tier,bustRisk:bustRisk('o'),setsO:M.setsO};
  const d=aiDecide(snap);
  if(d.play){
    const card=M.o.hand[d.play.idx];
    AUDIO.play('place');
    if(d.play.tag==='dbl')applyDouble(M.o.board);
    else if(d.play.tag==='flip')applyFlip(M.o.board,card.vals);
    else{const si=placeSide(M.o,card,d.play.orient);if(si>=0)M.anims.deal={who:'o',slot:si,t0:performance.now()};}
    if(card.kind==='tie')M.o.tiebreak=true;
    M.o.hand[d.play.idx]=null;
    M.o.score=boardScore(M.o.board);
    await sleep(430);if(!M||tk!==M.token||M.phase!=='oTurn')return;
    if(M.o.score>20){M.o.bust=true;M.anims.flash={who:'o',t0:performance.now()};AUDIO.play('bust');endSet('p','bust');return;}
    if(boardCount(M.o.board)===9){endSet('o','fill');return;}
    if(M.o.score===20){M.o.stood=true;toast('TWENTY!');
      if(M.p.stood)resolveStandoff();else beginTurn('p');return;}
    if(M.o.score>snap.score||shouldStand(M.o.score,snap)){
      if(M.o.score>20){M.o.bust=true;M.anims.flash={who:'o',t0:performance.now()};AUDIO.play('bust');endSet('p','bust');return;}
      M.o.stood=true;toast(M.opp.name.toUpperCase()+' STANDS');
      if(M.p.stood)resolveStandoff();else beginTurn('p');return;
    }
  }
  if(d.stand){
    M.o.stood=true;toast(M.opp.name.toUpperCase()+' STANDS');
    if(M.p.stood)resolveStandoff();else beginTurn('p');
    return;
  }
  if(M.o.score>20){M.o.bust=true;M.anims.flash={who:'o',t0:performance.now()};AUDIO.play('bust');endSet('p','bust');return;}
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
  showDialog('THE SET IS TIED.','NO POINT AWARDED',()=>{M.setStarter=other(M.setStarter);startSet();});
}
function endSet(winner,reason){
  M.phase='over';M.sel=-1;
  if(winner==='p'){M.setsP++;AUDIO.play('win');}
  else{M.setsO++;AUDIO.play(reason==='bust'?'bust':'lose');}
  const lines=setEndText(winner,reason);
  showDialog(lines[0],lines[1],()=>{
    if(M.setsP>=3){matchEnd('p');return;}
    if(M.setsO>=3){matchEnd('o');return;}
    M.setStarter=winner;startSet();
  });
}
function setEndText(winner,reason){
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
  if(winner==='p'){
    AUDIO.play('win');
    if(M.replayRung!=null){
      showDialog('YOU WIN THE REMATCH.','',()=>leaveMatch());
    }else{
      const rung=SAVE.circuit,unlocks=UNLOCK_TABLE[rung]||{};
      for(const id in unlocks)SAVE.unlocked[id]=(SAVE.unlocked[id]||0)+unlocks[id];
      SAVE.circuit=rung+1;persist();
      showResultModal(unlocks);
    }
  }else{
    AUDIO.play('lose');
    showDialog('DEFEAT.','THE CIRCUIT MOVES ON WITHOUT YOU',()=>leaveMatch());
  }
}
function leaveMatch(){if(M)M.token++;M=null;buildCircuit();showScreen('circuit');}
function startMatch(rung){
  const opp=SAVE.roster[rung];
  newMatch(opp,rung<SAVE.circuit?rung:null);
  showScreen('match');
  fit(); // measure the now-visible board box so the canvas aspect matches it
  showDialog('VS '+opp.name.toUpperCase(),'TIER '+opp.tier+': '+opp.title.toUpperCase()+' - FIRST TO 3 SETS',()=>{
    if(!SAVE.seenRules){
      SAVE.seenRules=true;persist();
      showDialog('RULES','DRAW 1 PER TURN - PLAY MAX 1 SIDE CARD - OVER 20 = BUST',()=>startSet(),{sub2:'EXACT 20 AUTO-STANDS - FILL 9 SLOTS = WIN - TIES REPLAY'});
    }else startSet();
  });
}
function dealProgress(who,slot,now){
  const a=M&&M.anims.deal;
  if(a&&a.who===who&&a.slot===slot){const p=(now-a.t0)/190;if(p<1)return p;}
  return 1;
}
function orbState(w){
  const S=sideOf(w);
  if(S.bust)return 'red';
  if(S.stood)return 'amber';
  if(M.turn===w&&M.phase!=='done')return 'green';
  return 'idle';
}
function chanState(w){
  const sets=w==='p'?M.setsP:M.setsO;
  return [sets>0?'green':'off',sets>1?'green':'off',sets>2?'green':'off'];
}
