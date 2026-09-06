const CARD_DEFS={};
for(let v=1;v<=6;v++){CARD_DEFS['+'+v]={id:'+'+v,kind:'mod',sign:1,v};CARD_DEFS['-'+v]={id:'-'+v,kind:'mod',sign:-1,v};}
for(let v=1;v<=6;v++)CARD_DEFS['\u00B1'+v]={id:'\u00B1'+v,kind:'dual',v};
CARD_DEFS['TIE']={id:'TIE',kind:'tie',v:1};
CARD_DEFS['DBL']={id:'DBL',kind:'dbl'};
CARD_DEFS['2&4']={id:'2&4',kind:'flip',vals:[2,4]};
CARD_DEFS['3&6']={id:'3&6',kind:'flip',vals:[3,6]};
function makeCard(id){return Object.assign({},CARD_DEFS[id]);}
function mainCard(v){return {id:'m'+v,kind:'main',v};}
function buildMainDeck(){const d=[];for(let v=1;v<=10;v++)for(let c=0;c<4;c++)d.push(mainCard(v));return shuffle(d);}
function cardColor(card,orient=1){
  switch(card.kind){case 'main':return 'green';case 'mod':return card.sign>0?'blue':'red';
  case 'dual':case 'tie':return orient>0?'blue':'red';default:return 'gold';}
}
function cardLabel(card,orient=1){
  switch(card.kind){case 'main':return String(card.v);case 'mod':return (card.sign>0?'+':'-')+card.v;
  case 'dual':case 'tie':return (orient>0?'+':'-')+card.v;case 'dbl':return '\u00D72';case 'flip':return card.vals.join('&');}
}
function tabLabel(card,orient=1){
  switch(card.kind){case 'main':return '';case 'mod':return card.sign>0?'+':'-';
  case 'dual':return orient>0?'+':'-';case 'tie':return '\u00B1';case 'dbl':return '\u00D72';case 'flip':return card.vals.join('\u00B7');}
}
function boardScore(board){let s=0;for(const sl of board)if(sl)s+=sl.eff;return s;}
function boardCount(board){let n=0;for(const sl of board)if(sl)n++;return n;}
function lastSlot(board){for(let i=8;i>=0;i--)if(board[i])return board[i];return null;}
function placeMain(side,card){const i=side.board.findIndex(s=>!s);if(i<0)return -1;side.board[i]={card,eff:card.v,isMain:true};return i;}
function placeSide(side,card,orient){const i=side.board.findIndex(s=>!s);if(i<0)return -1;
  let eff=0;
  if(card.kind==='mod')eff=card.sign*card.v;
  else if(card.kind==='dual'||card.kind==='tie')eff=orient*card.v;
  side.board[i]={card,eff,isMain:false};return i;}
function applyDouble(board){const ls=lastSlot(board);if(!ls)return -1;ls.eff*=2;return 1;}
function applyFlip(board,vals){let n=0;for(const sl of board){if(sl&&sl.isMain&&vals.includes(sl.card.v)&&sl.eff>0){sl.eff=-sl.eff;n++;}}return n;}
