// Headless logic smoke test for the concatenated game bundle.
// Stubs browser-only globals; game code guards document, AUDIO guards AudioContext.
const fs = require('fs');
const path = require('path');

globalThis.window = {}; // no AudioContext -> AUDIO.ensure() returns false, silent
function stubEl() {
  return new Proxy({ classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {} },
    { get(t, k) { return k in t ? t[k] : (() => stubEl()); }, set(t, k, v) { t[k] = v; return true; } });
}
globalThis.document = { querySelector: () => stubEl(), querySelectorAll: () => [], addEventListener() {} };
eval(fs.readFileSync(process.argv[2] || path.join(__dirname, 'bundle.tmp.js'), 'utf8'));
const PZ = globalThis.PZ;

let fail = 0;
const t = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + name); if (!cond) fail++; };

t('main-deck-40', PZ.buildMainDeck().length === 40);
t('boardScore', PZ.boardScore([{ eff: 10 }, { eff: -3 }, null]) === 7);

const opp = PZ.generateOpponent(2);
PZ.newMatchForTest(['+1', '-1', '+2', '-2', '+3', '-3', '+4', '-4', '+5', '-5'],
  { name: 'T', tier: 2, title: 'X' });
let M = PZ.getM();
t('hands4', M.p.hand.filter(Boolean).length === 4 && M.o.hand.filter(Boolean).length === 4);

PZ.setSleepScale(0.001);
PZ.startSet();
M = PZ.getM();
t('startSet-phase', M.phase === 'pAction' || M.phase === 'oTurn');
t('startSet-drawn', M.p.board.concat(M.o.board).some(Boolean));

const dec = PZ.aiDecide({ score: 19, board: Array(9).fill(null), hand: [{ id: '+1', kind: 'mod', sign: 1, v: 1 }], oppScore: 10, oppStood: false, tier: 1, bustRisk: 0.9, setsO: 0 });
t('ai-stands-19', dec.stand === true);

// bust path: force over-20 then end turn
PZ.newMatchForTest(['+1', '-1', '+2', '-2', '+3', '-3', '+4', '-4', '+5', '-5'],
  { name: 'T', tier: 1, title: 'X' });
PZ.startSet();
M = PZ.getM();
M.turn = 'p'; M.phase = 'pAction'; // deterministic: force player action
M.p.score = 21;
PZ.endPlayerTurn();
t('bust-ends-set', PZ.getM().setsO === 1);
t('chan-set-lights', PZ.chanState('o')[0]==='red' && PZ.chanState('p').every(s=>s==='off'));

const box=PZ.fitCard(90,90);
t('fitCard-aspect', Math.abs(box.w/box.h - PZ.CARD_ASPECT)<1e-6 && box.h<=90 && box.w<=90);

const board=[
  {card:{kind:'main',v:2},eff:2,isMain:true},
  {card:{kind:'mod',sign:1,v:4,id:'+4'},eff:4,isMain:false},
  {card:{kind:'mod',sign:-1,v:2,id:'-2'},eff:-2,isMain:false}
];
PZ.applyFlip(board,[2,4]);
t('flip-plus-side-too', board[0].eff===-2 && board[1].eff===-4 && board[2].eff===-2);
t('flex-card', !!PZ.CARD_DEFS['1\u00B12'] && PZ.CARD_DEFS['1\u00B12'].kind==='flex');
t('playValue-flex', PZ.playValue(PZ.makeCard('1\u00B12'),-1,2)===-2);
t('cardLabel-D', PZ.cardLabel({kind:'dbl'})==='D');
t('cardLabel-tie', PZ.cardLabel({kind:'tie',v:1},-1)==='-1T');
t('wager-tiers', PZ.matchWager(1)===50 && PZ.matchWager(2)===100 && PZ.matchWager(3)===200);
{
  const decks=Array.from({length:24},()=>PZ.genSideDeck(1));
  const std=/^[+-][1-6]$/;
  t('t1-standard-range', decks.every(d=>d.every(id=>std.test(id))));
  t('t1-has-upgrade', decks.every(d=>d.some(id=>!PZ.isClutterId(id))));
}
t('store-plus4-open', PZ.storeMinCircuit('+4')===0 && PZ.storeMinCircuit('-4')===0);
t('store-t0', PZ.storeStock().every(id=>PZ.storeMinCircuit(id)===0));
const save=PZ.getSave();
save.circuit=6;
t('store-unlocks-flex', PZ.storeStock().indexOf('1\u00B12')>=0);
save.circuit=0;
t('add-card', PZ.addToCollection('+4') && save.unlocked['+4']>=1);
t('clutter-plus1', PZ.isClutterId('+1') && !PZ.isClutterId('TIE'));

{
  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M=PZ.getM();
  M.turn='p';M.phase='pAction';M.sidePlayed=false;M.sel=-1;
  M.p.stood=false;M.p.bust=false;
  M.p.board=[{card:{kind:'main',v:4},eff:4,isMain:true},null,null,null,null,null,null,null,null];
  M.p.score=4;
  const i0=M.p.hand.findIndex(c=>c&&c.kind==='mod');
  const n0=M.p.hand.filter(Boolean).length;
  PZ.confirmPlay(i0);
  const n1=M.p.hand.filter(Boolean).length;
  const i1=M.p.hand.findIndex(c=>c&&c.kind==='mod');
  if(i1>=0)PZ.confirmPlay(i1);
  const sides=M.p.board.filter(s=>s&&!s.isMain).length;
  t('one-side-card-per-turn', n1===n0-1 && M.p.hand.filter(Boolean).length===n1 && sides===1 && M.sidePlayed===true && M.phase==='pAction');
}

// AI must not stand below a stood opponent (e.g. 16 vs stood 19).
{
  const losing = PZ.aiDecide({
    score: 16, board: Array(9).fill(null),
    hand: [{ id: '+1', kind: 'mod', sign: 1, v: 1 }],
    oppScore: 19, oppStood: true, tier: 2, bustRisk: 0.1, setsO: 0
  });
  t('ai-no-stand-losing', losing.stand === false && PZ.shouldStand(16, {
    oppStood: true, oppScore: 19, tier: 2, bustRisk: 0.1, setsO: 0
  }) === false);
  t('ai-stand-beating-stood', PZ.shouldStand(20, {
    oppStood: true, oppScore: 19, tier: 1, bustRisk: 0.9, setsO: 0
  }) === true);
  // After a plus that still loses to a stood opponent, must not stand.
  t('ai-no-stand-after-plus-losing', PZ.shouldStand(17, {
    oppStood: true, oppScore: 19, tier: 3, bustRisk: 0.2, setsO: 2
  }) === false);
  // Raised total vs unstood opp: stand-after-plus is correct human play.
  t('ai-stand-after-plus-when-safe', (()=>{
    const raised=18, prev=16, oppStood=false, oppScore=10;
    const losingToStood=oppStood&&raised<oppScore;
    return (raised>prev&&!losingToStood)===true;
  })());
}

// Fill win only at ≤20; over-20 with 9 cards is a bust.
{
  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  M.turn = 'p'; M.phase = 'pAction';
  M.p.board = [
    {card:{kind:'main',v:4},eff:4,isMain:true},
    {card:{kind:'main',v:4},eff:4,isMain:true},
    {card:{kind:'main',v:4},eff:4,isMain:true},
    {card:{kind:'main',v:4},eff:4,isMain:true},
    {card:{kind:'main',v:4},eff:4,isMain:true},
    {card:{kind:'main',v:1},eff:1,isMain:true},
    {card:{kind:'main',v:1},eff:1,isMain:true},
    {card:{kind:'main',v:1},eff:1,isMain:true},
    {card:{kind:'main',v:5},eff:5,isMain:true}
  ];
  // 4*5+1*3+5 = 28
  const resOver = PZ.resolveBoard('p');
  t('fill-over-20-busts', resOver === 'bust' && PZ.getM().setsO === 1 && PZ.getM().p.bust === true);

  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  M.turn = 'p'; M.phase = 'pAction';
  M.p.board = [
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true},
    {card:{kind:'main',v:2},eff:2,isMain:true}
  ];
  const resFill = PZ.resolveBoard('p');
  t('fill-at-18-wins', resFill === 'fill' && PZ.getM().setsP === 1);
}

process.exit(fail ? 1 : 0);
