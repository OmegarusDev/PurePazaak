const CARD_DEFS={};
for(let v=1;v<=6;v++){CARD_DEFS['+'+v]={id:'+'+v,kind:'mod',sign:1,v};CARD_DEFS['-'+v]={id:'-'+v,kind:'mod',sign:-1,v};}
for(let v=1;v<=6;v++)CARD_DEFS['\u00B1'+v]={id:'\u00B1'+v,kind:'dual',v};
CARD_DEFS['TIE']={id:'TIE',kind:'tie',v:1};
CARD_DEFS['DBL']={id:'DBL',kind:'dbl'};
CARD_DEFS['2&4']={id:'2&4',kind:'flip',vals:[2,4]};
CARD_DEFS['3&6']={id:'3&6',kind:'flip',vals:[3,6]};
CARD_DEFS['1\u00B12']={id:'1\u00B12',kind:'flex',vals:[1,2]};
function makeCard(id){const d=CARD_DEFS[id];return d?Object.assign({},d):null;}
function mainCard(v){return {id:'m'+v,kind:'main',v};}
function buildMainDeck(){const d=[];for(let v=1;v<=10;v++)for(let c=0;c<4;c++)d.push(mainCard(v));return shuffle(d);}
function isSpecialKind(kind){return kind==='tie'||kind==='dbl'||kind==='flip'||kind==='flex';}
function canFlip(card){return !!(card&&(card.kind==='dual'||card.kind==='tie'||card.kind==='flex'));}
function cardColor(card,orient=1){
  switch(card.kind){case 'main':return 'green';case 'mod':return card.sign>0?'blue':'red';
  case 'dual':return orient>0?'blue':'red';default:return 'gold';}
}
function cardLabel(card,orient=1,varV=1,catalog=false){
  switch(card.kind){
    case 'main':return String(card.v);
    case 'mod':return (card.sign>0?'+':'-')+card.v;
    case 'dual':return (orient>0?'+':'-')+card.v;
    case 'tie':return (orient>0?'+':'-')+'1T';
    case 'dbl':return 'D';
    case 'flip':return card.vals.join('&');
    case 'flex':return catalog?'1\u00B12':(orient>0?'+':'-')+varV;
    default:return '';
  }
}
function playValue(card,orient=1,varV=1){
  if(card.kind==='mod')return card.sign*card.v;
  if(card.kind==='dual'||card.kind==='tie')return orient*card.v;
  if(card.kind==='flex')return orient*(varV||1);
  return 0;
}
function faceVal(sl){
  if(!sl||!sl.card)return null;
  const k=sl.card.kind;
  if(k==='main'||k==='mod'||k==='dual'||k==='tie')return sl.card.v;
  if(k==='flex')return Math.abs(sl.eff);
  return null;
}
function boardScore(board){let s=0;for(const sl of board)if(sl)s+=sl.eff;return s;}
function boardCount(board){let n=0;for(const sl of board)if(sl)n++;return n;}
function lastSlot(board){for(let i=8;i>=0;i--)if(board[i])return board[i];return null;}
/** K2 Double targets the last main-deck card dealt this set, not a side card. */
function lastMain(board){for(let i=8;i>=0;i--)if(board[i]&&board[i].isMain)return board[i];return null;}
function placeMain(side,card){const i=side.board.findIndex(s=>!s);if(i<0)return -1;side.board[i]={card,eff:card.v,isMain:true};return i;}
function placeSide(side,card,orient,varV){const i=side.board.findIndex(s=>!s);if(i<0)return -1;
  const eff=playValue(card,orient,varV);
  side.board[i]={card,eff,isMain:false};return i;}
function applyDouble(board){const ls=lastMain(board);if(!ls)return -1;ls.eff*=2;return 1;}
function applyFlip(board,vals){let n=0;for(const sl of board){const v=faceVal(sl);if(v!=null&&vals.includes(v)&&sl.eff>0){sl.eff=-sl.eff;n++;}}return n;}
function slotOrient(sl){return sl&&sl.eff<0?-1:1;}
function slotVarV(sl){return sl&&sl.card&&sl.card.kind==='flex'?Math.abs(sl.eff):1;}
/** Full KOTOR2 side-deck roster (23 ids). */
const SIDE_CARD_IDS=['+1','+2','+3','+4','+5','+6','-1','-2','-3','-4','-5','-6',
  '\u00B11','\u00B12','\u00B13','\u00B14','\u00B15','\u00B16','TIE','DBL','2&4','3&6','1\u00B12'];
