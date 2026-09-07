const STARTER_COLLECTION={'+1':2,'+2':2,'+3':2,'-1':2,'-2':2,'-3':2};
const START_CREDITS=400;
const STORE_CAP=4;
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
const SW_NAMES={prefixes:['Vorn','Zev','Dask','Rix','Talon','Korr','Jora','Bok','Thul','Xiz'],middles:['','ex','or','an','en','ath','isk','ost','ul'],suffixes:[' V',' Prime',' the Hutt',' of Nar Shaddaa',' the Smuggler',' Jr.'],titles:['Scout','Smuggler','Mercenary','Enforcer','Gambler','Crime Boss']};
const TIER_LABELS={1:'Tavern Patron',2:'Smuggler Scoundrel',3:'Outer Rim Champ'};
function generateOpponent(tier){
  const p=choice(SW_NAMES.prefixes),m=choice(SW_NAMES.middles);
  const s=tier>2?choice(SW_NAMES.suffixes):'';
  return {name:`${p}${m}${s}`,tier,title:TIER_LABELS[tier]};
}
function buildRoster(){return [1,1,2,2,3,3].map(t=>generateOpponent(t));}
function matchWager(tier){return tier===3?200:tier===2?100:50;}
const CARD_PRICE={
  '+1':20,'-1':20,'+2':30,'-2':30,'+3':45,'-3':45,
  '+4':70,'-4':70,'+5':120,'-5':120,'+6':180,'-6':180,
  '\u00B11':90,'\u00B12':110,'\u00B13':140,'\u00B14':180,'\u00B15':240,'\u00B16':300,
  'TIE':220,'DBL':260,'2&4':280,'3&6':320,'1\u00B12':400
};
const STORE_FROM={
  '+1':0,'-1':0,'+2':0,'-2':0,'+3':0,'-3':0,
  '+4':0,'-4':0,
  '+5':1,'-5':1,
  '\u00B11':2,'\u00B12':2,'+6':2,'-6':2,
  '\u00B13':3,
  '\u00B14':4,'TIE':4,
  '\u00B15':5,'DBL':5,'2&4':5,
  '\u00B16':6,'3&6':6,'1\u00B12':6
};
function storeMinCircuit(id){return STORE_FROM[id]==null?99:STORE_FROM[id];}
function storeStock(){
  return Object.keys(CARD_PRICE).filter(id=>storeMinCircuit(id)<=SAVE.circuit)
    .sort((a,b)=>storeMinCircuit(a)-storeMinCircuit(b)||(CARD_PRICE[a]-CARD_PRICE[b]));
}
function isClutterId(id){return Object.prototype.hasOwnProperty.call(STARTER_COLLECTION,id);}
function addToCollection(id){
  if(!CARD_DEFS[id])return false;
  SAVE.unlocked[id]=(SAVE.unlocked[id]||0)+1;
  return true;
}
const SAVE_KEY='pazaak-outer-rim-save-v1';
function defaultSave(){return {circuit:0,roster:null,unlocked:Object.assign({},STARTER_COLLECTION),lastDeck:[],credits:START_CREDITS,vol:0.6,muted:false};}
function loadSave(){
  try{
    const s=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(s&&s.unlocked){
      const out=Object.assign(defaultSave(),s);
      if(out.credits==null||out.credits!==out.credits)out.credits=START_CREDITS;
      return out;
    }
  }catch(e){}
  return defaultSave();
}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}refreshCredits();}
function refreshCredits(){
  try{document.querySelectorAll('[data-credits]').forEach(el=>{el.textContent='CREDITS  '+SAVE.credits;});}catch(e){}
}
let SAVE=loadSave();
