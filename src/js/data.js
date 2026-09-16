const GAME_VERSION='0.9.3';
const STARTER_COLLECTION={'+1':2,'+2':2,'+3':2,'-1':2,'-2':2,'-3':2};
const START_CREDITS=400;
const STORE_CAP=4;
const CIRCUIT_LEN=9;
const SAVE_SCHEMA=2;
const SAVE_WRITER=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():Math.random().toString(36).slice(2);
let SAVE_CHANNEL=null,SAVE_CONFLICT=false,PERSIST_BLOCK=false,persistTimer=0;
const OPP_POOLS={
  1:['+1','+1','+2','+2','+3','+3','-1','-1','-2','-2','-3','-3','+4','+4','+4','-4','-4','-4','+5','-5','+6','-6'],
  2:['+3','-3','+4','+4','-4','-4','+5','-5','+6','-6','\u00B11','\u00B12','\u00B13','\u00B11','\u00B12'],
  3:['\u00B13','\u00B14','\u00B15','+5','-5','+6','-6','TIE','DBL','2&4','3&6','1\u00B12']
};
function genSideDeck(tier){
  const d=[];
  if(tier===3){const sp=['TIE','DBL','2&4','3&6','1\u00B12'];d.push(choice(sp),choice(sp));}
  const pool=OPP_POOLS[tier];
  while(d.length<10)d.push(choice(pool));
  if(tier===1&&d.every(id=>isClutterId(id)))d[0]=choice(['+4','-4','+5','-5','+6','-6']);
  return shuffle(d);
}
/* Given / family names drawn from KOTOR 1 & 2 NPCs (companions + cantina cast). */
const SW_FIRST=[
  'Atton','Ajuur','Atris','Azkul','Bao-Dur','Bastila','Belaya','Bendak','Brianna','Canderous',
  'Calo','Carth','Cami','Chuundar','Davik','Deesra','Dia','Dorak','Dustil','Freyyr',
  'Gadon','Geeda','Geriel','Greeta','Griff','Gurney','Hanharr','Holdan','Janice','Jolee',
  'Juhani','Kel','Kiph','Kreia','Larrim','Lena','Lootra','Luxa','Mekel','Mical',
  'Mira','Mission','Motta','Nadaa','Niko','Opo','Rukil','Saul','Shaardan','Sharina',
  'Sherruk','Tienn','Trask','Uthar','Visas','Visquis','Vogga','Vrook','Yuthura','Zelka','Zhar'
];
const SW_LAST=[
  'Algwinn','Bindo','Carrick','Chano','Fett','Jada','Kae','Kang','Karath','Kun',
  'Lamar','Lestin','Marr','Nall','Nord','Onasi','Ordo',"Qel-Droma",'Rand','Shan',
  'Starkiller','Sunrider','Surik','Tokare','Ulgo','Vao','Windu','Organa','Kressh','Sadow',
  "D'Harhan","T'chal","K'lor","N'Kata","O'Naka","Qel'Droma","San'toro","Var'kai","Zel'ika",'Thul'
];
const SW_MONONYM=[
  'Zaalbar','Hanharr','Kreia','Atris','Motta','Vogga','Goto','Nemo','Juhani','Bao-Dur',
  'HK-47','G0-T0','T3-M4','Ajuur','Greeta','Luxa','Visquis','Sherruk','Chuundar','Freyyr'
];
const TIER_LABELS={1:'Tavern Patron',2:'Smuggler Scoundrel',3:'Outer Rim Champ'};
function generateOpponent(tier,used){
  const taken=used||new Set();
  let name='',guard=0;
  do{
    if(Math.random()<0.05)name=choice(SW_MONONYM);
    else name=choice(SW_FIRST)+' '+choice(SW_LAST);
    guard++;
  }while(taken.has(name)&&guard<80);
  taken.add(name);
  return {name,tier,title:TIER_LABELS[tier]};
}
function buildRoster(){
  const used=new Set();
  return [1,1,1,2,2,2,3,3,3].map(t=>generateOpponent(t,used));
}
function matchWager(tier){return tier===3?200:tier===2?100:50;}
function clampReplayWager(tier,value){
  const n=Number(value);
  return Math.max(0,Math.min(matchWager(tier),Number.isFinite(n)?Math.floor(n):0));
}
const CARD_PRICE={
  '+1':20,'-1':20,'+2':30,'-2':30,'+3':45,'-3':45,
  '+4':70,'-4':70,'+5':120,'-5':120,'+6':180,'-6':180,
  '\u00B11':90,'\u00B12':110,'\u00B13':140,'\u00B14':180,'\u00B15':240,'\u00B16':300,
  'TIE':220,'DBL':260,'2&4':280,'3&6':320,'1\u00B12':400
};
/* Unlock schedule stretched across 9 circuit rungs. */
const STORE_FROM={
  '+1':0,'-1':0,'+2':0,'-2':0,'+3':0,'-3':0,
  '+4':0,'-4':0,
  '+5':1,'-5':1,
  '\u00B11':2,'\u00B12':2,
  '+6':3,'-6':3,
  '\u00B13':4,
  '\u00B14':5,'TIE':5,
  '\u00B15':6,'DBL':6,
  '2&4':7,
  '\u00B16':8,'3&6':8,
  '1\u00B12':9
};
function storeMinCircuit(id){return STORE_FROM[id]==null?99:STORE_FROM[id];}
/** 2-player pools: T1 +/− only, T2 adds duals, T3 full K2 roster. Two of each. */
function vsTierIds(tier){
  if(tier>=3)return SIDE_CARD_IDS.slice();
  const ids=[];
  for(let v=1;v<=6;v++)ids.push('+'+v,'-'+v);
  if(tier>=2)for(let v=1;v<=6;v++)ids.push('\u00B1'+v);
  return ids;
}
function vsCollection(tier){
  const u={};
  vsTierIds(tier).forEach(id=>u[id]=2);
  return u;
}
function vsTierNote(tier){
  if(tier>=3)return 'Full KOTOR 2 side-deck roster. Two of every card.';
  if(tier>=2)return 'Plus, minus, and \u00B1 duals. Two of every card.';
  return 'Plus and minus cards only. Two of every card.';
}
function storeStock(){
  return Object.keys(CARD_PRICE).filter(id=>storeMinCircuit(id)<=SAVE.circuit)
    .sort((a,b)=>storeMinCircuit(a)-storeMinCircuit(b)||(CARD_PRICE[a]-CARD_PRICE[b]));
}
function isClutterId(id){return Object.prototype.hasOwnProperty.call(STARTER_COLLECTION,id);}
function hasCardId(id){return typeof id==='string'&&Object.prototype.hasOwnProperty.call(CARD_DEFS,id);}
function cleanName(value){
  const s=String(value==null?'':value).replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,40);
  return s||'Unknown';
}
function addToCollection(id){
  if(!hasCardId(id))return false;
  SAVE.unlocked[id]=(SAVE.unlocked[id]||0)+1;
  return true;
}
const SAVE_KEY='pazaak-outer-rim-save-v1';
function defaultSave(){return {schema:SAVE_SCHEMA,revision:0,writer:'',updatedAt:0,circuit:0,roster:null,unlocked:Object.assign({},STARTER_COLLECTION),lastDeck:[],credits:START_CREDITS,vol:0.6,muted:false,begun:false,activeMatch:null,recoveredMatch:false};}
function normalizeRoster(save){
  if(!Array.isArray(save.roster)||save.roster.length!==CIRCUIT_LEN||
     !save.roster.every(o=>o&&typeof o.name==='string'&&cleanName(o.name)!=='Unknown'&&Number.isInteger(o.tier)&&o.tier>=1&&o.tier<=3)){
    save.roster=buildRoster();
  }else{
    save.roster=save.roster.map(o=>({name:cleanName(o.name),tier:o.tier,title:TIER_LABELS[o.tier]}));
  }
  return save;
}
function normalizeSave(raw,recover=true){
  const out=defaultSave();
  if(!raw||typeof raw!=='object')return normalizeRoster(out);
  out.revision=Number.isSafeInteger(raw.revision)&&raw.revision>=0?raw.revision:0;
  out.writer=typeof raw.writer==='string'?raw.writer:'';
  out.updatedAt=Number.isFinite(raw.updatedAt)&&raw.updatedAt>=0?raw.updatedAt:0;
  out.circuit=Number.isFinite(Number(raw.circuit))?Math.max(0,Math.min(CIRCUIT_LEN,Math.floor(Number(raw.circuit)))):0;
  out.credits=Number.isFinite(Number(raw.credits))?Math.max(0,Math.min(999999999,Math.floor(Number(raw.credits)))):START_CREDITS;
  out.vol=Number.isFinite(Number(raw.vol))?Math.max(0,Math.min(1,Number(raw.vol))):0.6;
  out.muted=raw.muted===true;out.begun=raw.begun===true;
  out.activeMatch=raw.activeMatch&&Number.isFinite(Number(raw.activeMatch.wager))&&Number(raw.activeMatch.wager)>0?{
    wager:Math.floor(Number(raw.activeMatch.wager)),rung:Number.isInteger(raw.activeMatch.rung)?raw.activeMatch.rung:null,startedAt:Number(raw.activeMatch.startedAt)||0
  }:null;
  out.recoveredMatch=false;
  if(recover&&out.activeMatch)out.recoveredMatch=true;
  if(raw.unlocked&&typeof raw.unlocked==='object')for(const id of Object.keys(raw.unlocked)){
    if(!hasCardId(id))continue;
    const n=Number(raw.unlocked[id]);
    if(Number.isFinite(n)&&n>0)out.unlocked[id]=Math.min(99,Math.floor(n));
  }
  const used={};
  if(Array.isArray(raw.lastDeck))for(const id of raw.lastDeck){
    if(out.lastDeck.length>=10||!hasCardId(id))continue;
    used[id]=(used[id]||0)+1;
    if(used[id]<=(out.unlocked[id]||0))out.lastDeck.push(id);
  }
  out.roster=raw.roster;
  return normalizeRoster(out);
}
function loadSave(){
  try{
    return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
  }catch(e){}
  return defaultSave();
}
function persistSoon(ms){
  if(persistTimer)clearTimeout(persistTimer);
  persistTimer=setTimeout(()=>{persistTimer=0;persist();},Math.max(0,ms==null?200:ms));
}
function flushPersist(){
  if(!persistTimer)return true;
  clearTimeout(persistTimer);persistTimer=0;
  return persist();
}
function persist(){
  if(PERSIST_BLOCK)return false;
  if(persistTimer){clearTimeout(persistTimer);persistTimer=0;}
  try{
    const old=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(old&&Number.isSafeInteger(old.revision)&&(
      old.revision>(SAVE.revision||0)||(old.revision===(SAVE.revision||0)&&old.updatedAt>(SAVE.updatedAt||0)))){
      SAVE.revision=old.revision;
      SAVE.updatedAt=old.updatedAt;
    }
    SAVE.schema=SAVE_SCHEMA;SAVE.revision=(SAVE.revision||0)+1;SAVE.writer=SAVE_WRITER;SAVE.updatedAt=Date.now();
    localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));
    if(SAVE_CHANNEL)SAVE_CHANNEL.postMessage({type:'save',payload:SAVE});
    SAVE_CONFLICT=false;
  }catch(e){return false;}
  refreshCredits();return true;
}
function cardSellPrice(id){
  const price=CARD_PRICE[id];
  return Number.isFinite(price)&&price>0?Math.floor(price/2):0;
}
function collectionCount(unlocked=SAVE.unlocked){
  return Object.values(unlocked||{}).reduce((sum,n)=>sum+(Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):0),0);
}
function trimDeckToCollection(deck,unlocked=SAVE.unlocked){
  const out=[],used={};
  for(const id of deck||[]){
    if(out.length>=10||!hasCardId(id))continue;
    used[id]=(used[id]||0)+1;
    if(used[id]<=(unlocked[id]||0))out.push(id);
  }
  return out;
}
function sellCard(id){
  const value=cardSellPrice(id),owned=SAVE.unlocked[id]||0;
  if(!value||owned<=0||collectionCount()<=10||SAVE.credits>=999999999)return false;
  const prevCredits=SAVE.credits,prevDeck=SAVE.lastDeck.slice();
  if(owned===1)delete SAVE.unlocked[id];else SAVE.unlocked[id]=owned-1;
  SAVE.lastDeck=trimDeckToCollection(SAVE.lastDeck);
  SAVE.credits=Math.min(999999999,SAVE.credits+value);
  if(persist())return true;
  SAVE.credits=prevCredits;SAVE.unlocked[id]=owned;SAVE.lastDeck=prevDeck;
  refreshCredits();return false;
}
function adoptExternalSave(raw){
  const incoming=normalizeSave(raw,false);
  if((incoming.revision||0)<=(SAVE.revision||0))return;
  if(typeof M!=='undefined'&&M){SAVE_CONFLICT=true;console.warn('Save changed in another tab during a match.');return;}
  SAVE=incoming;refreshCredits();
  if(typeof refreshTitle==='function')refreshTitle();
  if(typeof curScreen!=='undefined'&&curScreen==='circuit'&&typeof buildCircuit==='function')buildCircuit();
  if(typeof curScreen!=='undefined'&&curScreen==='deck'&&typeof buildDeckUI==='function')buildDeckUI();
  if(typeof curScreen!=='undefined'&&curScreen==='store'&&typeof buildStoreUI==='function')buildStoreUI();
}
function initSaveSync(){
  if(typeof window==='undefined'||!window.addEventListener)return;
  window.addEventListener('storage',e=>{if(e.key===SAVE_KEY&&e.newValue)try{adoptExternalSave(JSON.parse(e.newValue));}catch(_){} });
  if(typeof BroadcastChannel==='function'){
    SAVE_CHANNEL=new BroadcastChannel(SAVE_KEY);
    SAVE_CHANNEL.onmessage=e=>{if(e.data&&e.data.type==='save')adoptExternalSave(e.data.payload);};
  }
}
function applyRecoveredWager(){
  if(!SAVE.recoveredMatch||!SAVE.activeMatch){SAVE.recoveredMatch=false;return true;}
  const rec=SAVE.activeMatch;
  const prevCredits=SAVE.credits;
  SAVE.credits=Math.min(999999999,SAVE.credits+rec.wager);
  SAVE.activeMatch=null;
  SAVE.recoveredMatch=false;
  if(persist())return true;
  SAVE.credits=prevCredits;
  SAVE.activeMatch=rec;
  SAVE.recoveredMatch=true;
  return false;
}
function resetSave(){SAVE=defaultSave();return persist();}
function refreshCredits(){
  try{
    document.querySelectorAll('[data-credits]').forEach(el=>{
      el.textContent=el.hasAttribute('data-credits-after')?(SAVE.credits+' CREDITS'):('CREDITS  '+SAVE.credits);
    });
  }catch(e){}
}
let SAVE=loadSave();
