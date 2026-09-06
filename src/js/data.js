const STARTER_COLLECTION={'+1':2,'+2':2,'+3':2,'-1':2,'-2':2,'-3':2};
const UNLOCK_TABLE=[
  {'+4':2,'-4':2},
  {'\u00B11':2,'\u00B12':2},
  {'+5':1,'-5':1,'\u00B13':2},
  {'\u00B14':2,'TIE':1},
  {'\u00B15':1,'DBL':1,'2&4':1},
  {'\u00B16':1,'3&6':1}
];
const OPP_POOLS={
  1:['+1','+2','+3','-1','-2','-3'],
  2:['\u00B11','\u00B12','\u00B13','+2','-2','+3','-3','+4','-4'],
  3:['\u00B13','\u00B14','\u00B15','+4','-4','TIE','DBL','2&4','3&6']
};
function genSideDeck(tier){
  const d=[];
  if(tier===3){const sp=['TIE','DBL','2&4','3&6'];d.push(choice(sp),choice(sp));}
  const pool=OPP_POOLS[tier];
  while(d.length<10)d.push(choice(pool));
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
const SAVE_KEY='pazaak-outer-rim-save-v1';
function defaultSave(){return {circuit:0,roster:null,unlocked:Object.assign({},STARTER_COLLECTION),lastDeck:[],seenRules:false,vol:0.6,muted:false};}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.unlocked)return Object.assign(defaultSave(),s);}catch(e){}return defaultSave();}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}}
let SAVE=loadSave();
