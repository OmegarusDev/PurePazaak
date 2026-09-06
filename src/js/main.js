function init(){
  initTextures();
  AUDIO.vol=SAVE.vol;AUDIO.muted=SAVE.muted;
  if(!SAVE.roster||!SAVE.roster.length){SAVE.roster=buildRoster();persist();}
  const table=$('#table');
  cv=table;ctx=table.getContext('2d');
  fit();
  $('#bt-new').onclick=()=>{AUDIO.play('click');const vol=AUDIO.vol,muted=AUDIO.muted;SAVE=defaultSave();SAVE.vol=vol;SAVE.muted=muted;SAVE.roster=buildRoster();persist();buildCircuit();showScreen('circuit');};
  $('#bt-continue').onclick=()=>{AUDIO.play('click');buildCircuit();showScreen('circuit');};
  $('#bt-cback').onclick=()=>{AUDIO.play('click');refreshTitle();showScreen('title');};
  $('#bt-how').onclick=()=>{AUDIO.play('click');openModal(
    '<h2>HOW TO PLAY</h2><ul>'+
    '<li>Get closer to 20 than your opponent without going over. First to win 3 sets takes the match.</li>'+
    '<li>Each turn you automatically draw a main deck card (values 1-10) onto your 3x3 board.</li>'+
    '<li>You may then play at most one side-deck card from your 4-card hand, then END TURN or STAND.</li>'+
    '<li>Over 20 is a BUST and loses the set. Exactly 20 auto-stands. Fill all 9 slots without busting for an instant win.</li>'+
    '<li>Tied sets award no point and replay. Your 4 hand cards last the entire match - spend them wisely.</li>'+
    '<li>Click a hand card to arm it, click again to play. FLIP CARD toggles +/- on dual cards.</li>'+
    '<li>Keys: E end turn, S stand, F flip, Enter play/confirm, Esc cancel.</li>'+
    '</ul><button id="mclose" class="kbtn">CLOSE</button>');
    $('#mclose').onclick=()=>{AUDIO.play('click');closeModal();};
  };
  $('#bt-reset').onclick=()=>{AUDIO.play('click');openModal(
    '<h2>RESET PROGRESS</h2><p>THIS WIPES YOUR CIRCUIT PROGRESS AND CARD COLLECTION.</p>'+
    '<div class="mrow"><button id="myes" class="kbtn danger">WIPE IT</button><button id="mno" class="kbtn">KEEP IT</button></div>');
    $('#myes').onclick=()=>{try{localStorage.removeItem(SAVE_KEY);}catch(e){}location.reload();};
    $('#mno').onclick=()=>{AUDIO.play('click');closeModal();};
  };
  $('#bt-options').onclick=()=>{AUDIO.play('click');openOptions();};
  $('#bt-autofill').onclick=autoFill;
  $('#bt-cleardeck').onclick=()=>{AUDIO.play('click');deckSel=[];buildDeckUI();};
  $('#bt-dback').onclick=()=>{AUDIO.play('click');buildCircuit();showScreen('circuit');};
  $('#bt-begin').onclick=()=>{
    if(deckSel.length!==10)return;
    AUDIO.play('click');
    SAVE.lastDeck=deckSel.slice();persist();
    startMatch(deckRung);
  };
  buildHandDOM();
  $('#bt-end').onclick=()=>endPlayerTurn();
  $('#bt-stand').onclick=()=>playerStand();
  $('#bt-flip').onclick=()=>flipArmed();
  $('#bt-forf').onclick=()=>{AUDIO.play('click');showDialog('FORFEIT THE MATCH?','PROGRESS WILL NOT BE SAVED',()=>{AUDIO.play('lose');leaveMatch();},{cancelText:'NO',onCancel(){}});};
  window.addEventListener('keydown',e=>{
    if(curScreen!=='match'||!M)return;
    const k=e.key.toLowerCase();
    if(matchDlg){
      if(k==='enter'||k===' ')dialogOK();
      else if(k==='escape'&&matchDlg.onCancel)dialogCancel();
      return;
    }
    if(M.phase!=='pAction')return;
    if(k==='e'||k===' ')endPlayerTurn();
    else if(k==='s')playerStand();
    else if(k==='f')flipArmed();
    else if(k==='enter'&&M.sel>=0)confirmPlay(M.sel);
    else if(k==='escape')M.sel=-1;
  });
  window.addEventListener('resize',fit);
  renderStatic();
  refreshTitle();
  requestAnimationFrame(loop);
}
function fit(){
  DPR=Math.min(2,window.devicePixelRatio||1);
  computeLayout();
  if(cv){cv.width=W*DPR;cv.height=H*DPR;}
  if(M&&ctx)renderStatic();
}
const HD=120,HH=158;
function buildHandDOM(){
  const h=$('#hand');h.innerHTML='';handEls=[];
  for(let i=0;i<4;i++){
    const el=document.createElement('div');el.className='handcard';
    const cvs=document.createElement('canvas');el.appendChild(cvs);
    el.onclick=()=>{
      if(!M||M.phase!=='pAction'||!M.p.hand[i]||M.p.used[i])return;
      if(M.sel===i)confirmPlay(i);
      else{AUDIO.play('click');M.sel=i;M.orient=1;}
      updateHandDOM();
    };
    h.appendChild(el);handEls.push(el);
  }
}
function updateHandDOM(){
  if(!M||!handEls.length)return;
  const p=M.p;
  for(let i=0;i<4;i++){
    const el=handEls[i],cvs=el.firstChild,g=cvs.getContext('2d');
    const d=Math.min(2,window.devicePixelRatio||1);
    if(cvs.width!==HD*d){cvs.width=HD*d;cvs.height=HH*d;}
    g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,HD,HH);
    const card=p.hand[i];
    el.classList.toggle('sel',M.sel===i);
    el.classList.toggle('used',!!p.used[i]||!card);
    el.classList.toggle('dis',M.phase!=='pAction'||!!p.used[i]||!card);
    if(card)drawCard(g,2,2,HD-4,HH-4,card,{orient:(M.sel===i?M.orient:1)});
    else{rr(g,2,2,HD-4,HH-4,8);g.fillStyle='rgba(0,0,0,0.28)';g.fill();g.strokeStyle='rgba(255,255,255,0.07)';g.lineWidth=1;g.stroke();}
  }
  const info=$('#pinfo');
  if(M.phase==='pAction'&&M.sel>=0&&p.hand[M.sel]){
    const card=p.hand[M.sel];let proj;
    if(card.kind==='dbl'){const ls=lastSlot(p.board);proj=ls?p.score+ls.eff:p.score;}
    else if(card.kind==='flip')proj=null;
    else proj=p.score+M.orient*card.v;
    info.textContent=card.kind==='flip'?'FLIP SIGN':proj>20?'BUST!':'PROJECTED: '+proj;
    info.style.color=proj!==null&&proj>20?'#ff6060':'#7fd4ff';
  }else if(M.phase==='pAction'){info.textContent='YOUR TURN';info.style.color='#7fd4ff';}
  else if(M.phase==='turn'){info.textContent='…';info.style.color='#9aa2b4';}
  else if(M.phase==='oTurn'){info.textContent='OPPONENT TURN';info.style.color='#e0a0a0';}
  else info.textContent='';
  updateControls();
}
function updateControls(){
  if(!M)return;
  const act=M.phase==='pAction';
  const armed=M.sel>=0?M.p.hand[M.sel]:null;
  const flipOk=act&&armed&&(armed.kind==='dual'||armed.kind==='tie');
  $('#bt-end').disabled=!act;
  $('#bt-stand').disabled=!act;
  $('#bt-flip').disabled=!flipOk;
}
globalThis.PZ={shuffle,buildMainDeck,boardScore,placeMain,placeSide,applyDouble,applyFlip,aiDecide,genSideDeck,generateOpponent,cardLabel,CARD_DEFS,buildRoster,makeCard,
  startSet,beginTurn,endPlayerTurn,playerStand,confirmPlay,endSet,
  newMatchForTest:(deckIds,opp)=>{SAVE.lastDeck=deckIds;newMatch(opp,null);},
  getM:()=>M,setSleepScale:v=>{SLEEP_SCALE=v;}};
if(typeof document!=='undefined'){
  document.addEventListener('DOMContentLoaded',init);
}
