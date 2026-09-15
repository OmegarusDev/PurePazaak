let modalFocusRest=null,matchLiveSig='';
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>{
    const on=s.id==='scr-'+id;
    s.classList.toggle('active',on);
    s.toggleAttribute('inert',!on);
    s.setAttribute('aria-hidden',on?'false':'true');
  });
  curScreen=id;
  refreshCredits();
  if(id==='match'){syncMatchA11y();kickRender();}
  else focusActiveScreen();
}
function focusActiveScreen(){
  const modal=$('#modal');
  if(modal&&!modal.classList.contains('hidden'))return;
  if(curScreen==='match'){
    const first=$('#match-a11y button:not([disabled]):not([hidden])');
    if(first)first.focus();
    return;
  }
  const root=$('#scr-'+curScreen);
  if(!root)return;
  const pref=root.querySelector('button.sel:not([disabled]), button.pick:not([disabled]), button:not([disabled])');
  if(pref)pref.focus();
}
function bindMatchDialog(title,sub,opts){
  const o=opts||{};
  const html='<h2 id="modal-title">'+escapeHtml(title)+'</h2>'+(sub?'<p>'+escapeHtml(sub)+'</p>':'')+(o.sub2?'<p>'+escapeHtml(o.sub2)+'</p>':'')+
    '<div class="mrow">'+(o.cancelText?'<button type="button" id="dcancel" class="kbtn">'+escapeHtml(o.cancelText)+'</button>':'')+'<button type="button" id="dok" class="kbtn">OK</button></div>';
  openModal(html);
  $('#dok').onclick=dialogOK;
  $('#dok').classList.add('sel');
  if(o.cancelText)$('#dcancel').onclick=dialogCancel;
}
let circuitSel=0;
function circuitDefaultSel(){return Math.min(SAVE.circuit,Math.max(0,SAVE.roster.length-1));}
function clampCircuitSel(){
  if(circuitSel==null||circuitSel<0||circuitSel>=SAVE.roster.length||circuitSel>SAVE.circuit)
    circuitSel=circuitDefaultSel();
}
function buildCircuit(){
  clampCircuitSel();
  const wrap=$('#rungs');
  const keep=document.activeElement&&wrap.contains(document.activeElement);
  wrap.innerHTML='';
  SAVE.roster.forEach((opp,i)=>{
    const st=i<SAVE.circuit?'done':i===SAVE.circuit?'next':'locked';
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='rung '+st+(i===circuitSel?' pick':'');
    const label=st==='done'?'WON':st==='next'?'NEXT':'LOCKED';
    btn.disabled=st==='locked';
    btn.setAttribute('aria-pressed',i===circuitSel?'true':'false');
    btn.setAttribute('aria-label',opp.name+', '+label+', tier '+opp.tier+', wager '+matchWager(opp.tier)+' credits');
    btn.innerHTML=`<div class="ricon"><span class="tier t${opp.tier}">${['I','II','III'][opp.tier-1]}</span></div>`+
      `<div class="rbody"><span class="rname"></span>`+
      `<span class="rstat">(${label})</span></div>`;
    btn.querySelector('.rname').textContent=opp.name;
    if(st!=='locked')btn.onclick=()=>{AUDIO.play('click');circuitSel=i;buildCircuit();};
    wrap.appendChild(btn);
  });
  if(keep)wrap.querySelector('.rung.pick')?.focus();
  const st=circuitSel<SAVE.circuit?'done':circuitSel===SAVE.circuit?'next':'locked';
  const bt=$('#bt-challenge');
  const opp=SAVE.roster[circuitSel];
  const w=opp?matchWager(opp.tier):50;
  bt.disabled=st==='locked';
  bt.textContent=st==='done'?'REPLAY  \u00B7  '+w+' CR':st==='next'?'CHALLENGE  \u00B7  '+w+' CR':'LOCKED';
  bt.classList.toggle('sel',st!=='locked');
  refreshCredits();
}
const DECK_ORDER=SIDE_CARD_IDS.slice();
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
  const col=$('#collection');
  const keep=document.activeElement&&(col.contains(document.activeElement)||$('#sidedeck').contains(document.activeElement));
  const keepId=keep&&document.activeElement.getAttribute('data-card');
  const keepSlot=keep&&document.activeElement.getAttribute('data-slot');
  col.innerHTML='';
  ownedIds().forEach(id=>{
    const owned=SAVE.unlocked[id],used=inDeckCount(id);
    const full=used>=owned||deckSel.length>=10;
    const cell=document.createElement('button');
    cell.type='button';
    cell.className='cell'+(full?' maxed':'');
    cell.dataset.card=id;
    cell.disabled=full;
    cell.setAttribute('aria-label',cardSpeak(makeCard(id),1,1,true)+', owned '+owned+(used?' , '+used+' in side deck':''));
    const cvs=document.createElement('canvas');
    cvs.setAttribute('aria-hidden','true');
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
    const slot=document.createElement('button');
    slot.type='button';
    slot.className='sslot';
    slot.dataset.slot=String(i);
    if(deckSel[i]){
      slot.dataset.card=deckSel[i];
      slot.setAttribute('aria-label','Remove '+cardSpeak(makeCard(deckSel[i]),1,1,true)+' from side deck slot '+(i+1));
      const cvs=document.createElement('canvas');
      cvs.setAttribute('aria-hidden','true');
      slot.appendChild(cvs);drawMini(cvs,deckSel[i]);
      slot.onclick=()=>{AUDIO.play('click');deckSel.splice(i,1);buildDeckUI();};
    }else{
      slot.disabled=true;
      slot.setAttribute('aria-label','Empty side deck slot '+(i+1));
    }
    sd.appendChild(slot);
  }
  if(keep){
    const again=keepId?document.querySelector('#scr-deck [data-card="'+CSS.escape(keepId)+'"]'):null;
    const slot=keepSlot!=null?document.querySelector('#sidedeck [data-slot="'+keepSlot+'"]'):null;
    (again||slot)?.focus();
  }
  const dc=$('#deckcount');
  dc.textContent=deckSel.length+'/10';
  dc.classList.toggle('full',deckSel.length===10);
  const begin=$('#bt-begin');
  const opp=SAVE.roster[deckRung], wager=opp?matchWager(opp.tier):50;
  const ready=deckSel.length===10, broke=SAVE.credits<wager;
  begin.disabled=!ready||broke;
  begin.textContent=!ready?'PLAY':broke?'NEED '+wager+' CR':'PLAY';
  begin.classList.toggle('sel',ready&&!broke);
  begin.title=ready&&!broke?('WAGER '+wager+' CR'):'';
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
  const priority=['1\u00B12','\u00B16','+6','-6','\u00B15','\u00B14','\u00B13','\u00B12','\u00B11','TIE','+5','-5','+4','-4','+3','-3','+2','-2','+1','-1','DBL','2&4','3&6'];
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
    '<h2 id="modal-title">'+(rematch?'REMATCH WON':'MATCH WON')+'</h2>'+
    '<p>+'+wager+' CR. '+(clutter?'THEIR DECK IS MOSTLY CLUTTER \u2014 TAKE ONE, OR SKIP.':'TAKE ONE CARD FROM THEIR SIDE DECK.')+'</p>'+
    '<div class="mcards">'+(cells||'<p>NO CARDS TO TAKE</p>')+'</div>'+
    '<div class="mrow"><button type="button" id="mskip" class="kbtn sel">SKIP</button></div>');
  document.querySelectorAll('.mcard.spoil canvas').forEach((cvs,i)=>drawMini(cvs,list[i].id,68));
  document.querySelectorAll('.mcard.spoil').forEach((btn,i)=>{
    btn.onclick=()=>{
      AUDIO.play('click');
      const id=list[i].id,prev=SAVE.unlocked[id]||0;
      if(!addToCollection(id)||!persist()){
        if(prev)SAVE.unlocked[id]=prev;else delete SAVE.unlocked[id];
        presentDialog('SAVE FAILED','THAT CARD COULD NOT BE STORED',()=>{});
        return;
      }
      closeModal();leaveMatch();
    };
  });
  $('#mskip').onclick=()=>{AUDIO.play('click');closeModal();leaveMatch();};
}
function buildStoreUI(){
  const wrap=$('#stock');if(!wrap)return;
  const keepId=document.activeElement&&wrap.contains(document.activeElement)&&document.activeElement.getAttribute('data-card');
  wrap.innerHTML='';
  storeStock().forEach(id=>{
    const price=CARD_PRICE[id], owned=SAVE.unlocked[id]||0, maxed=owned>=STORE_CAP, broke=SAVE.credits<price;
    const cell=document.createElement('button');
    cell.type='button';
    cell.className='cell'+(maxed||broke?' maxed':'');
    cell.dataset.card=id;
    cell.disabled=maxed||broke;
    const speak=cardSpeak(makeCard(id),1,1,true);
    cell.setAttribute('aria-label',maxed?speak+', owned maximum '+owned:broke?speak+', '+price+' credits, not enough credits':speak+', buy for '+price+' credits'+(owned?', owned '+owned:''));
    const cvs=document.createElement('canvas');
    cvs.setAttribute('aria-hidden','true');
    cell.appendChild(cvs);
    const cnt=document.createElement('span');
    cnt.className='cnt';
    cnt.textContent=maxed?'OWN '+owned:price+' CR'+(owned?' \u00B7 OWN '+owned:'');
    cell.appendChild(cnt);
    drawMini(cvs,id);
    if(!maxed&&!broke)cell.onclick=()=>{
      AUDIO.play('click');
      const prev=SAVE.unlocked[id]||0;
      SAVE.credits-=price;
      if(!addToCollection(id)||!persist()){
        SAVE.credits+=price;
        if(prev)SAVE.unlocked[id]=prev;else delete SAVE.unlocked[id];
        refreshCredits();
        presentDialog('SAVE FAILED','THE PURCHASE WAS NOT STORED',()=>{});
        buildStoreUI();
        return;
      }
      buildStoreUI();
    };
    wrap.appendChild(cell);
  });
  if(keepId)wrap.querySelector('[data-card="'+CSS.escape(keepId)+'"]')?.focus();
  const note=$('#store-note');
  if(note)note.textContent=SAVE.circuit>=CIRCUIT_LEN?'Full cantina stock.':'Stock improves as you climb the circuit.';
}
function openStore(){
  buildStoreUI();
  showScreen('store');
}
function openModal(html){
  const modal=$('#modal');
  if(modal.classList.contains('hidden'))modalFocusRest=document.activeElement;
  const app=$('#app');
  if(app)app.setAttribute('inert','');
  modal.classList.toggle('match-modal',curScreen==='match');
  $('#modalbox').innerHTML=html;
  const title=$('#modalbox h2');
  if(title){if(!title.id)title.id='modal-title';modal.setAttribute('aria-labelledby',title.id);}
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  modal.removeAttribute('inert');
  const box=$('#modalbox');
  const items=focusablesIn(box);
  (items.find(el=>el.classList.contains('sel'))||items[0]||box).focus();
}
function closeModal(){
  const modal=$('#modal');
  modal.classList.add('hidden');
  modal.classList.remove('match-modal');
  modal.setAttribute('aria-hidden','true');
  modal.setAttribute('inert','');
  const app=$('#app');
  if(app)app.removeAttribute('inert');
  const rest=modalFocusRest;modalFocusRest=null;
  if(rest&&typeof rest.focus==='function'&&typeof document.contains==='function'&&document.contains(rest))rest.focus();
  else focusActiveScreen();
}
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
    '<h2 id="modal-title">NEW GAME</h2><p>THIS WIPES YOUR CIRCUIT, CARD COLLECTION, AND CREDITS.</p>'+
    '<div class="mrow"><button type="button" id="mno" class="kbtn">CANCEL</button><button type="button" id="myes" class="kbtn sel">START</button></div>');
  $('#myes').onclick=()=>{AUDIO.play('click');closeModal();wipeKeepAudio();enterCircuit();};
  $('#mno').onclick=()=>{AUDIO.play('click');closeModal();};
}
function confirmReset(){
  AUDIO.play('click');
  openModal(
    '<h2 id="modal-title">RESET PROGRESS</h2><p>THIS WIPES YOUR CIRCUIT, CARD COLLECTION, AND CREDITS.</p>'+
    '<div class="mrow"><button type="button" id="mno" class="kbtn">KEEP IT</button><button type="button" id="myes" class="kbtn danger sel">WIPE IT</button></div>');
  $('#myes').onclick=()=>{resetSave();location.reload();};
  $('#mno').onclick=()=>{AUDIO.play('click');closeModal();};
}
function openOptions(){
  openModal(
    '<h2 id="modal-title">OPTIONS</h2>'+
    '<div class="volrow"><span id="vol-lab">VOLUME</span><input id="vol" type="range" min="0" max="100" value="'+Math.round(AUDIO.vol*100)+'" aria-labelledby="vol-lab"><button type="button" id="bt-mute" class="kbtn sm">MUTE</button></div>'+
    '<div class="mrow"><button type="button" id="bt-reset" class="kbtn danger">RESET PROGRESS</button><button type="button" id="oclose" class="kbtn sel">CLOSE</button></div>');
  $('#vol').oninput=e=>{AUDIO.setVol(e.target.value/100);SAVE.vol=AUDIO.vol;persist();};
  $('#bt-mute').textContent=AUDIO.muted?'UNMUTE':'MUTE';
  $('#bt-mute').onclick=()=>{AUDIO.setMuted(!AUDIO.muted);SAVE.muted=AUDIO.muted;persist();$('#bt-mute').textContent=AUDIO.muted?'UNMUTE':'MUTE';};
  $('#bt-reset').onclick=confirmReset;
  $('#oclose').onclick=()=>{AUDIO.play('click');closeModal();};
}
function askQuit(){
  AUDIO.play('click');
  openModal(
    '<h2 id="modal-title">QUIT</h2><p>LEAVE THE TABLE?</p>'+
    '<div class="mrow"><button type="button" id="mno" class="kbtn">NO</button><button type="button" id="myes" class="kbtn sel">YES</button></div>');
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
function placeA11yHit(btn,rect){
  if(!btn)return;
  if(!rect||!W||!H||L.fallback){btn.hidden=true;return;}
  btn.hidden=false;
  btn.style.left=(rect.x/W*100)+'%';
  btn.style.top=(rect.y/H*100)+'%';
  btn.style.width=(rect.w/W*100)+'%';
  btn.style.height=(rect.h/H*100)+'%';
}
function ensureMatchA11y(){
  const root=$('#match-a11y');
  if(!root||root.dataset.ready)return root;
  for(let i=0;i<4;i++){
    const b=document.createElement('button');
    b.type='button';b.className='a11y-hit';b.dataset.kind='hand';b.dataset.i=String(i);
    b.addEventListener('click',()=>{
      if(!M||matchDlg||M.phase!=='pAction')return;
      const idx=+b.dataset.i;
      if(!M.p.hand[idx])return;
      if(M.sel===idx)confirmPlay(idx);
      else{AUDIO.play('click');M.sel=idx;M.orient=1;M.varV=1;}
      syncMatchA11y();
    });
    b.addEventListener('contextmenu',e=>{
      e.preventDefault();
      if(!M||matchDlg||M.phase!=='pAction')return;
      const idx=+b.dataset.i,card=M.p.hand[idx];
      if(!canFlip(card))return;
      if(M.sel!==idx){M.sel=idx;M.orient=1;M.varV=1;}
      flipArmed();syncMatchA11y();
    });
    root.appendChild(b);
  }
  const actions=[['end','End turn','Space E'],['stand','Stand','Enter S'],['flip','Flip armed card','F'],['forfeit','Forfeit match','']];
  for(const [kind,label,keys] of actions){
    const b=document.createElement('button');
    b.type='button';b.className='a11y-hit';b.dataset.kind=kind;
    b.setAttribute('aria-label',label);
    if(keys)b.setAttribute('aria-keyshortcuts',keys);
    b.addEventListener('click',()=>{
      if(!M||matchDlg)return;
      if(kind==='end')endPlayerTurn();
      else if(kind==='stand')playerStand();
      else if(kind==='flip')flipArmed();
      else if(kind==='forfeit')askForfeit();
      syncMatchA11y();
    });
    root.appendChild(b);
  }
  root.dataset.ready='1';
  return root;
}
function matchStatusText(){
  if(!M)return '';
  if(L&&L.fallback)return 'Layout cannot fit. Rotate or enlarge the window.';
  const opp=M.opp&&M.opp.name?M.opp.name:'Opponent';
  let phase='';
  if(M.phase==='pAction')phase='Your turn.';
  else if(M.phase==='oTurn')phase=opp+' is playing.';
  else if(M.phase==='over')phase='Set over.';
  else if(M.phase==='done')phase='Match over.';
  const toast=M.toasts&&M.toasts.length?M.toasts[M.toasts.length-1].t+'. ':'';
  const armed=M.sel>=0&&M.p.hand[M.sel]?' Armed '+cardSpeak(M.p.hand[M.sel],M.orient,M.varV)+'. ':'';
  return 'You '+M.p.score+', '+opp+' '+M.o.score+'. Sets '+M.setsP+' to '+M.setsO+'. '+phase+' '+toast+armed;
}
function syncMatchA11y(){
  const root=ensureMatchA11y();
  const live=$('#match-live');
  if(!root)return;
  if(curScreen!=='match'||!M){
    root.hidden=true;
    return;
  }
  root.hidden=false;
  const ui=typeof tableUI==='function'?tableUI():{act:false,flipOk:false};
  const canAct=!!(ui.act&&!matchDlg&&!(L&&L.fallback));
  for(let i=0;i<4;i++){
    const b=root.querySelector('.a11y-hit[data-kind="hand"][data-i="'+i+'"]');
    const card=M.p.hand[i];
    placeA11yHit(b,L&&L.handP?handSlot(L.handP,i):null);
    if(!b)continue;
    if(!card||L.fallback){b.hidden=true;continue;}
    b.disabled=!canAct;
    const selected=M.sel===i;
    const name=cardSpeak(card,selected?M.orient:1,selected?M.varV:1);
    b.setAttribute('aria-label','Hand card '+(i+1)+', '+name+(selected?', selected, activate to play':canAct?', activate to select':''));
    b.setAttribute('aria-pressed',selected?'true':'false');
  }
  const map={end:L&&L.btnEnd,stand:L&&L.btnStand,flip:L&&L.btnFlip,forfeit:L&&L.btnForf};
  for(const [kind,rect] of Object.entries(map)){
    const b=root.querySelector('.a11y-hit[data-kind="'+kind+'"]');
    placeA11yHit(b,rect);
    if(!b)continue;
    if(L&&L.fallback){b.hidden=true;continue;}
    if(kind==='flip')b.disabled=!ui.flipOk||!!matchDlg;
    else if(kind==='forfeit')b.disabled=M.phase!=='pAction'||!!matchDlg||!!(L&&L.fallback);
    else b.disabled=!canAct;
  }
  const sig=matchStatusText();
  if(live&&sig!==matchLiveSig){matchLiveSig=sig;live.textContent=sig;}
}
let rafOn=false;
function kickRender(){
  if(rafOn)return;
  rafOn=true;
  requestAnimationFrame(loop);
}
function loop(t){
  render(t);
  if(typeof syncMatchA11y==='function')syncMatchA11y();
  if(curScreen==='match'&&M)requestAnimationFrame(loop);
  else rafOn=false;
}
