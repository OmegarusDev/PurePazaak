function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='scr-'+id));
  curScreen=id;
  refreshCredits();
}
let circuitSel=0;
function circuitDefaultSel(){return Math.min(SAVE.circuit,Math.max(0,SAVE.roster.length-1));}
function clampCircuitSel(){
  if(circuitSel==null||circuitSel<0||circuitSel>=SAVE.roster.length||circuitSel>SAVE.circuit)
    circuitSel=circuitDefaultSel();
}
function buildCircuit(){
  clampCircuitSel();
  const wrap=$('#rungs');wrap.innerHTML='';
  SAVE.roster.forEach((opp,i)=>{
    const st=i<SAVE.circuit?'done':i===SAVE.circuit?'next':'locked';
    const div=document.createElement('div');
    div.className='rung '+st+(i===circuitSel?' pick':'');
    div.innerHTML=`<span class="tier t${opp.tier}">${['I','II','III'][opp.tier-1]}</span>`+
      `<span class="rtext"><span class="rname">${opp.name}</span>`+
      `<span class="rtitle">${opp.title.toUpperCase()}</span></span>`+
      `<span class="rstat">${st==='done'?'WON':st==='next'?'NEXT':'LOCKED'}</span>`;
    if(st!=='locked')div.onclick=()=>{AUDIO.play('click');circuitSel=i;buildCircuit();};
    wrap.appendChild(div);
  });
  const st=circuitSel<SAVE.circuit?'done':circuitSel===SAVE.circuit?'next':'locked';
  const bt=$('#bt-challenge');
  const opp=SAVE.roster[circuitSel];
  const w=opp?matchWager(opp.tier):50;
  bt.disabled=st==='locked';
  bt.textContent=st==='done'?'REPLAY  \u00B7  '+w+' CR':st==='next'?'CHALLENGE  \u00B7  '+w+' CR':'LOCKED';
  bt.classList.toggle('sel',st!=='locked');
  refreshCredits();
}
const DECK_ORDER=['+1','+2','+3','+4','+5','+6','-1','-2','-3','-4','-5','-6','\u00B11','\u00B12','\u00B13','\u00B14','\u00B15','\u00B16','TIE','DBL','2&4','3&6','1\u00B12'];
function ownedIds(){return DECK_ORDER.filter(id=>(SAVE.unlocked[id]||0)>0);}
function inDeckCount(id){return deckSel.filter(x=>x===id).length;}
function drawMini(cvs,id,w=64,h){
  if(h==null)h=Math.round(w/CARD_ASPECT);
  const d=Math.min(2,window.devicePixelRatio||1);
  cvs.width=w*d;cvs.height=h*d;
  const g=cvs.getContext('2d');g.setTransform(d,0,0,d,0,0);
  drawCard(g,2,2,w-4,h-4,makeCard(id),{glow:false,catalog:true});
}
function buildDeckUI(){
  const col=$('#collection');col.innerHTML='';
  ownedIds().forEach(id=>{
    const owned=SAVE.unlocked[id],used=inDeckCount(id);
    const cell=document.createElement('div');
    cell.className='cell'+(used>=owned?' maxed':'');
    const cvs=document.createElement('canvas');
    cell.appendChild(cvs);
    const cnt=document.createElement('span');
    cnt.className='cnt';cnt.textContent='\u00D7'+owned+(used?' \u00B7 IN DECK '+used:'');
    cell.appendChild(cnt);
    drawMini(cvs,id);
    cell.onclick=()=>{
      if(deckSel.length>=10||inDeckCount(id)>=owned)return;
      AUDIO.play('click');deckSel.push(id);buildDeckUI();
    };
    col.appendChild(cell);
  });
  const sd=$('#sidedeck');sd.innerHTML='';
  for(let i=0;i<10;i++){
    const slot=document.createElement('div');
    slot.className='sslot';
    if(deckSel[i]){
      const cvs=document.createElement('canvas');
      slot.appendChild(cvs);drawMini(cvs,deckSel[i]);
      slot.onclick=()=>{AUDIO.play('click');deckSel.splice(i,1);buildDeckUI();};
    }
    sd.appendChild(slot);
  }
  const dc=$('#deckcount');
  dc.textContent=deckSel.length+' / 10';
  dc.classList.toggle('full',deckSel.length===10);
  const begin=$('#bt-begin');
  const opp=SAVE.roster[deckRung], wager=opp?matchWager(opp.tier):50;
  const ready=deckSel.length===10, broke=SAVE.credits<wager;
  begin.disabled=!ready||broke;
  begin.textContent=!ready?'BEGIN MATCH':broke?'NEED '+wager+' CR':'BEGIN  \u00B7  '+wager+' CR';
  begin.classList.toggle('sel',ready&&!broke);
}
function validateDeck(deck){
  const out=[],counts={};
  for(const id of deck||[]){
    counts[id]=(counts[id]||0)+1;
    if(counts[id]<=(SAVE.unlocked[id]||0)&&out.length<10)out.push(id);
  }
  return out;
}
function openDeckBuilder(rung){
  deckRung=rung;
  deckSel=validateDeck(SAVE.lastDeck);
  buildDeckUI();
  showScreen('deck');
}
function autoFill(){
  deckSel=[];
  const priority=['1\u00B12','\u00B16','\u00B15','\u00B14','\u00B13','\u00B12','\u00B11','TIE','+5','-5','+4','-4','+3','-3','+2','-2','+1','-1','DBL','2&4','3&6'];
  for(const id of priority){
    let avail=SAVE.unlocked[id]||0;
    while(deckSel.length<10&&avail>0){deckSel.push(id);avail--;}
    if(deckSel.length>=10)break;
  }
  AUDIO.play('click');buildDeckUI();
}
function spoilList(){
  const counts={};
  if(M&&M.o&&M.o.side)for(const c of M.o.side)counts[c.id]=(counts[c.id]||0)+1;
  return DECK_ORDER.filter(id=>counts[id]).map(id=>({id,n:counts[id]}));
}
function showSpoilsModal(wager,rematch){
  const list=spoilList();
  const clutter=list.length>0&&list.every(x=>isClutterId(x.id));
  const cells=list.map((x,i)=>'<button type="button" class="mcard spoil" data-i="'+i+'"><canvas></canvas><span>'+(x.n>1?'\u00D7'+x.n:'TAKE')+'</span></button>').join('');
  openModal(
    '<h2>'+(rematch?'REMATCH WON':'MATCH WON')+'</h2>'+
    '<p>+'+wager+' CR. '+(clutter?'THEIR DECK IS MOSTLY CLUTTER \u2014 TAKE ONE, OR SKIP.':'TAKE ONE CARD FROM THEIR SIDE DECK.')+'</p>'+
    '<div class="mcards">'+(cells||'<p>NO CARDS TO TAKE</p>')+'</div>'+
    '<div class="mrow"><button id="mskip" class="kbtn">SKIP</button></div>');
  document.querySelectorAll('.mcard.spoil canvas').forEach((cvs,i)=>drawMini(cvs,list[i].id,68));
  document.querySelectorAll('.mcard.spoil').forEach((btn,i)=>{
    btn.onclick=()=>{
      AUDIO.play('click');
      addToCollection(list[i].id);persist();
      closeModal();leaveMatch();
    };
  });
  $('#mskip').onclick=()=>{AUDIO.play('click');closeModal();leaveMatch();};
}
function buildStoreUI(){
  const wrap=$('#stock');if(!wrap)return;
  wrap.innerHTML='';
  storeStock().forEach(id=>{
    const price=CARD_PRICE[id], owned=SAVE.unlocked[id]||0, maxed=owned>=STORE_CAP, broke=SAVE.credits<price;
    const cell=document.createElement('div');
    cell.className='cell'+(maxed||broke?' maxed':'');
    const cvs=document.createElement('canvas');
    cell.appendChild(cvs);
    const cnt=document.createElement('span');
    cnt.className='cnt';
    cnt.textContent=maxed?'OWN '+owned:price+' CR'+(owned?' \u00B7 OWN '+owned:'');
    cell.appendChild(cnt);
    drawMini(cvs,id);
    if(!maxed&&!broke)cell.onclick=()=>{
      AUDIO.play('click');
      SAVE.credits-=price;addToCollection(id);persist();buildStoreUI();
    };
    wrap.appendChild(cell);
  });
  const note=$('#store-note');
  if(note)note.textContent=SAVE.circuit>=6?'FULL CANTINA STOCK.':'STOCK IMPROVES AS YOU CLIMB THE CIRCUIT.';
}
function openStore(){
  buildStoreUI();
  showScreen('store');
}
function openModal(html){$('#modalbox').innerHTML=html;$('#modal').classList.remove('hidden');}
function closeModal(){$('#modal').classList.add('hidden');}
function hasSave(){return !!(SAVE.begun||SAVE.circuit>0||(SAVE.lastDeck&&SAVE.lastDeck.length));}
function wipeKeepAudio(){
  const vol=AUDIO.vol,muted=AUDIO.muted;
  SAVE=defaultSave();SAVE.vol=vol;SAVE.muted=muted;SAVE.roster=buildRoster();persist();
}
function enterCircuit(){
  SAVE.begun=true;persist();
  circuitSel=circuitDefaultSel();
  buildCircuit();
  showScreen('circuit');
}
function startNewGame(){
  AUDIO.play('click');
  if(!hasSave()){wipeKeepAudio();enterCircuit();return;}
  openModal(
    '<h2>NEW GAME</h2><p>THIS WIPES YOUR CIRCUIT, CARD COLLECTION, AND CREDITS.</p>'+
    '<div class="mrow"><button id="myes" class="kbtn">START</button><button id="mno" class="kbtn">CANCEL</button></div>');
  $('#myes').onclick=()=>{AUDIO.play('click');closeModal();wipeKeepAudio();enterCircuit();};
  $('#mno').onclick=()=>{AUDIO.play('click');closeModal();};
}
function confirmReset(){
  AUDIO.play('click');
  openModal(
    '<h2>RESET PROGRESS</h2><p>THIS WIPES YOUR CIRCUIT, CARD COLLECTION, AND CREDITS.</p>'+
    '<div class="mrow"><button id="myes" class="kbtn danger">WIPE IT</button><button id="mno" class="kbtn">KEEP IT</button></div>');
  $('#myes').onclick=()=>{try{localStorage.removeItem(SAVE_KEY);}catch(e){}location.reload();};
  $('#mno').onclick=()=>{AUDIO.play('click');closeModal();};
}
function openOptions(){
  openModal(
    '<h2>OPTIONS</h2>'+
    '<div class="volrow"><span>VOLUME</span><input id="vol" type="range" min="0" max="100" value="'+Math.round(AUDIO.vol*100)+'"><button id="bt-mute" class="kbtn sm">MUTE</button></div>'+
    '<div class="mrow"><button id="bt-reset" class="kbtn danger">RESET PROGRESS</button><button id="oclose" class="kbtn">CLOSE</button></div>');
  $('#vol').oninput=e=>{AUDIO.setVol(e.target.value/100);SAVE.vol=AUDIO.vol;persist();};
  $('#bt-mute').textContent=AUDIO.muted?'UNMUTE':'MUTE';
  $('#bt-mute').onclick=()=>{AUDIO.setMuted(!AUDIO.muted);SAVE.muted=AUDIO.muted;persist();$('#bt-mute').textContent=AUDIO.muted?'UNMUTE':'MUTE';};
  $('#bt-reset').onclick=confirmReset;
  $('#oclose').onclick=()=>{AUDIO.play('click');closeModal();};
}
function askQuit(){
  AUDIO.play('click');
  openModal(
    '<h2>QUIT</h2><p>LEAVE THE TABLE?</p>'+
    '<div class="mrow"><button id="myes" class="kbtn">YES</button><button id="mno" class="kbtn">NO</button></div>');
  $('#myes').onclick=()=>{
    AUDIO.play('click');
    try{window.close();}catch(e){}
    closeModal();
  };
  $('#mno').onclick=()=>{AUDIO.play('click');closeModal();};
}
function refreshTitle(){
  const load=$('#bt-continue');
  load.disabled=!hasSave();
  document.querySelectorAll('.kotor-menu button').forEach(b=>b.classList.remove('sel'));
  (hasSave()?load:$('#bt-new')).classList.add('sel');
  refreshCredits();
}
function loop(t){render(t);requestAnimationFrame(loop);}
