function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='scr-'+id));
  curScreen=id;
}
function buildCircuit(){
  const wrap=$('#rungs');wrap.innerHTML='';
  SAVE.roster.forEach((opp,i)=>{
    const st=i<SAVE.circuit?'done':i===SAVE.circuit?'next':'locked';
    const div=document.createElement('div');
    div.className='rung '+st;
    div.innerHTML=`<span class="tier t${opp.tier}">${['I','II','III'][opp.tier-1]}</span>`+
      `<span class="rtext"><span class="rname">${opp.name}</span>`+
      `<span class="rtitle">${opp.title.toUpperCase()}</span></span>`+
      `<span class="rstat">${st==='done'?'REPLAY':st==='next'?'CHALLENGE':'LOCKED'}</span>`;
    if(st!=='locked')div.onclick=()=>{AUDIO.play('click');openDeckBuilder(i);};
    wrap.appendChild(div);
  });
}
const DECK_ORDER=['+1','+2','+3','+4','+5','+6','-1','-2','-3','-4','-5','-6','\u00B11','\u00B12','\u00B13','\u00B14','\u00B15','\u00B16','TIE','DBL','2&4','3&6'];
function ownedIds(){return DECK_ORDER.filter(id=>(SAVE.unlocked[id]||0)>0);}
function inDeckCount(id){return deckSel.filter(x=>x===id).length;}
function drawMini(cvs,id,w=64,h=80){
  const d=Math.min(2,window.devicePixelRatio||1);
  cvs.width=w*d;cvs.height=h*d;
  const g=cvs.getContext('2d');g.setTransform(d,0,0,d,0,0);
  drawCard(g,2,2,w-4,h-4,makeCard(id),{glow:false});
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
      slot.appendChild(cvs);drawMini(cvs,deckSel[i],64,80);
      slot.onclick=()=>{AUDIO.play('click');deckSel.splice(i,1);buildDeckUI();};
    }
    sd.appendChild(slot);
  }
  const dc=$('#deckcount');
  dc.textContent=deckSel.length+' / 10';
  dc.classList.toggle('full',deckSel.length===10);
  $('#bt-begin').disabled=deckSel.length!==10;
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
  const priority=['\u00B16','\u00B15','\u00B14','\u00B13','\u00B12','\u00B11','TIE','+5','-5','+4','-4','+3','-3','+2','-2','+1','-1','DBL','2&4','3&6'];
  for(const id of priority){
    let avail=SAVE.unlocked[id]||0;
    while(deckSel.length<10&&avail>0){deckSel.push(id);avail--;}
    if(deckSel.length>=10)break;
  }
  AUDIO.play('click');buildDeckUI();
}
function showResultModal(unlocks){
  const ids=Object.keys(unlocks);
  const cells=ids.map(()=>'<div class="mcard"><canvas></canvas></div>').join('');
  openModal(`<h2>MATCH WON</h2><p>UNLOCKED:</p><div class="mcards">${ids.length?cells:'<p>NO NEW CARDS</p>'}</div><button id="mok" class="kbtn">CONTINUE</button>`);
  document.querySelectorAll('.mcard canvas').forEach((cvs,i)=>drawMini(cvs,ids[i],68,80));
  $('#mok').onclick=()=>{AUDIO.play('click');closeModal();leaveMatch();};
}
function openModal(html){$('#modalbox').innerHTML=html;$('#modal').classList.remove('hidden');}
function closeModal(){$('#modal').classList.add('hidden');}
function openOptions(){
  openModal(
    '<h2>OPTIONS</h2>'+
    '<div class="volrow"><span>VOLUME</span><input id="vol" type="range" min="0" max="100" value="'+Math.round(AUDIO.vol*100)+'"><button id="bt-mute" class="kbtn sm">MUTE</button></div>'+
    '<div class="mrow"><button id="oclose" class="kbtn">CLOSE</button></div>');
  $('#vol').oninput=e=>{AUDIO.setVol(e.target.value/100);SAVE.vol=AUDIO.vol;persist();};
  $('#bt-mute').textContent=AUDIO.muted?'UNMUTE':'MUTE';
  $('#bt-mute').onclick=()=>{AUDIO.setMuted(!AUDIO.muted);SAVE.muted=AUDIO.muted;persist();$('#bt-mute').textContent=AUDIO.muted?'UNMUTE':'MUTE';};
  $('#oclose').onclick=()=>{AUDIO.play('click');closeModal();};
}
function refreshTitle(){
  const done=SAVE.circuit>=SAVE.roster.length;
  const bt=$('#bt-continue');
  if(SAVE.circuit>0){
    bt.style.display='';
    bt.textContent=done?'CIRCUIT COMPLETE - REPLAY':'CONTINUE CIRCUIT';
  }else bt.style.display='none';
}
function loop(t){render(t);requestAnimationFrame(loop);}
