function init(){
  initTextures();
  AUDIO.vol=SAVE.vol;AUDIO.muted=SAVE.muted;
  if(!SAVE.roster||!SAVE.roster.length){SAVE.roster=buildRoster();persist();}
  const table=$('#table');
  cv=table;ctx=table.getContext('2d');
  fit();
  $('#bt-new').onclick=startNewGame;
  $('#bt-continue').onclick=()=>{if(!hasSave())return;AUDIO.play('click');enterCircuit();};
  $('#bt-challenge').onclick=()=>{
    if(circuitSel>SAVE.circuit)return;
    AUDIO.play('click');openDeckBuilder(circuitSel);
  };
  $('#bt-cback').onclick=()=>{AUDIO.play('click');refreshTitle();showScreen('title');};
  $('#bt-how').onclick=()=>{AUDIO.play('click');openModal(
    '<h2>HOW TO PLAY</h2><ul>'+
    '<li>Get closer to 20 than your opponent without going over. First to win 3 sets takes the match.</li>'+
    '<li>Each turn you automatically draw a main deck card (values 1-10) onto your 3x3 board.</li>'+
    '<li>You may then play at most one side-deck card from your 4-card hand, then END TURN or STAND.</li>'+
    '<li>Over 20 is a BUST and loses the set. Exactly 20 auto-stands. Fill all 9 slots without busting for an instant win.</li>'+
    '<li>Tied sets award no point and replay. Your 4 hand cards last the entire match - spend them wisely.</li>'+
    '<li>Click a hand card to arm it, click again to play. FLIP, F, or right-click cycles +/- on duals, tiebreakers, and the 1\u00B12 card.</li>'+
    '<li>Keys: Space end turn, Enter stand, F or right-click flip, Esc cancel. Click a hand card twice to play it.</li>'+
    '<li>Matches are played for a credits wager. Win and you may take one card from their side deck, or skip if it is clutter.</li>'+
    '<li>The cantina store sells side-deck cards. Better stock unlocks as you climb the circuit.</li>'+
    '</ul><div class="mrow"><button id="mclose" class="kbtn">CLOSE</button></div>');
    $('#mclose').onclick=()=>{AUDIO.play('click');closeModal();};
  };
  $('#bt-store').onclick=()=>{AUDIO.play('click');openStore();};
  $('#bt-sback').onclick=()=>{AUDIO.play('click');buildCircuit();showScreen('circuit');};
  $('#bt-options').onclick=()=>{AUDIO.play('click');openOptions();};
  $('#bt-quit').onclick=askQuit;
  $('#bt-autofill').onclick=autoFill;
  $('#bt-cleardeck').onclick=()=>{AUDIO.play('click');deckSel=[];buildDeckUI();};
  $('#bt-dback').onclick=()=>{AUDIO.play('click');buildCircuit();showScreen('circuit');};
  $('#bt-begin').onclick=()=>{
    if(deckSel.length!==10)return;
    AUDIO.play('click');
    SAVE.lastDeck=deckSel.slice();persist();
    startMatch(deckRung);
  };
  table.addEventListener('pointerdown',onTablePointer);
  table.addEventListener('pointermove',onTableHover);
  table.addEventListener('contextmenu',onTableContext);
  window.addEventListener('keydown',e=>{
    if(curScreen!=='match'||!M)return;
    const k=e.key.toLowerCase();
    if(matchDlg){
      if(k==='enter'||k===' '){e.preventDefault();dialogOK();}
      else if(k==='escape'&&matchDlg.onCancel){e.preventDefault();dialogCancel();}
      return;
    }
    if(M.phase!=='pAction')return;
    if(k==='e'||k===' '){e.preventDefault();endPlayerTurn();}
    else if(k==='enter'||k==='s'){e.preventDefault();playerStand();}
    else if(k==='f'){e.preventDefault();flipArmed();}
    else if(k==='escape'){e.preventDefault();M.sel=-1;}
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
  if(M&&ctx){renderStatic();render(performance.now());}
}
function canvasPoint(e){
  const r=cv.getBoundingClientRect();
  return {x:(e.clientX-r.left)/Math.max(1,r.width)*W, y:(e.clientY-r.top)/Math.max(1,r.height)*H};
}
function askForfeit(){
  AUDIO.play('click');
  showDialog('FORFEIT THE MATCH?','THE WAGER WILL BE LOST',()=>{AUDIO.play('lose');leaveMatch();},{cancelText:'NO',onCancel(){}});
}
function hitTable(p){
  if(!M||matchDlg)return null;
  if(L.handP){
    for(let i=0;i<4;i++){
      if(inRect(p,handSlot(L.handP,i))&&M.p.hand[i])return {kind:'hand',i};
    }
  }
  const ui=tableUI();
  if(inRect(p,L.btnEnd)&&ui.act)return {kind:'end'};
  if(inRect(p,L.btnStand)&&ui.act)return {kind:'stand'};
  if(inRect(p,L.btnFlip)&&ui.flipOk)return {kind:'flip'};
  if(inRect(p,L.btnForf)&&M.phase!=='done')return {kind:'forfeit'};
  return null;
}
function onTableHover(e){
  if(curScreen!=='match'||!cv)return;
  cv.style.cursor=hitTable(canvasPoint(e))?'pointer':'default';
}
function onTablePointer(e){
  if(curScreen!=='match'||!M||matchDlg)return;
  if(e.button!=null&&e.button!==0)return;
  const hit=hitTable(canvasPoint(e));
  if(!hit)return;
  e.preventDefault();
  if(hit.kind==='hand'){
    if(M.phase!=='pAction')return;
    if(M.sel===hit.i)confirmPlay(hit.i);
    else{AUDIO.play('click');M.sel=hit.i;M.orient=1;M.varV=1;}
  }else if(hit.kind==='end')endPlayerTurn();
  else if(hit.kind==='stand')playerStand();
  else if(hit.kind==='flip')flipArmed();
  else if(hit.kind==='forfeit')askForfeit();
}
function onTableContext(e){
  if(curScreen!=='match')return;
  e.preventDefault();
  if(!M||matchDlg||M.phase!=='pAction')return;
  const hit=hitTable(canvasPoint(e));
  if(!hit||hit.kind!=='hand')return;
  const card=M.p.hand[hit.i];
  if(!canFlip(card))return;
  if(M.sel!==hit.i){M.sel=hit.i;M.orient=1;M.varV=1;}
  flipArmed();
}
globalThis.PZ={shuffle,buildMainDeck,boardScore,placeMain,placeSide,applyDouble,applyFlip,aiDecide,genSideDeck,generateOpponent,cardLabel,CARD_DEFS,buildRoster,makeCard,faceVal,canFlip,playValue,
  startSet,beginTurn,endPlayerTurn,playerStand,confirmPlay,endSet,
  newMatchForTest:(deckIds,opp)=>{SAVE.lastDeck=deckIds;newMatch(opp,null);},
  getM:()=>M,setSleepScale:v=>{SLEEP_SCALE=v;},chanState,fitCard,CARD_ASPECT,
  matchWager,storeStock,storeMinCircuit,addToCollection,isClutterId,CARD_PRICE,getSave:()=>SAVE};
if(typeof document!=='undefined'){
  document.addEventListener('DOMContentLoaded',init);
}
