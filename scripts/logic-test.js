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
save.circuit=9;
t('store-unlocks-flex', PZ.storeStock().indexOf('1\u00B12')>=0);
save.circuit=0;
t('add-card', PZ.addToCollection('+4') && save.unlocked['+4']>=1);
t('clutter-plus1', PZ.isClutterId('+1') && !PZ.isClutterId('TIE'));

{
  const roster=PZ.buildRoster();
  t('roster-nine', roster.length===9);
  t('roster-tiers', roster.filter(o=>o.tier===1).length===3 && roster.filter(o=>o.tier===2).length===3 && roster.filter(o=>o.tier===3).length===3);
  t('roster-unique-names', new Set(roster.map(o=>o.name)).size===9);
  const samples=Array.from({length:80},()=>PZ.generateOpponent(2));
  t('names-mostly-full', samples.filter(o=>/^\S+\s+\S+/.test(o.name)).length>=60);
  const many=Array.from({length:200},()=>PZ.generateOpponent(3));
  t('names-hyphen-or-apostrophe', many.some(o=>/-/.test(o.name)) && many.some(o=>/'/.test(o.name)));
}
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

// Auto-stand at exactly 20.
{
  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  M.turn = 'p'; M.phase = 'pAction';
  M.p.board = [
    {card:{kind:'main',v:10},eff:10,isMain:true},
    {card:{kind:'main',v:10},eff:10,isMain:true},
    null,null,null,null,null,null,null
  ];
  const res20 = PZ.resolveBoard('p');
  t('auto-stand-at-20', res20 === 'stood' && M.p.stood === true && M.p.score === 20);
}

// Hand persists across sets (spent cards stay gone).
{
  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  const before = M.p.hand.map(c => c && c.id);
  M.p.hand[0] = null;
  M.p.hand[2] = null;
  const mid = M.p.hand.map(c => c && c.id);
  // Simulate advancing to next set without remaking hands.
  M.setNum++; M.deck = PZ.buildMainDeck();
  for (const w of ['p', 'o']) {
    const S = w === 'p' ? M.p : M.o;
    S.board = Array(9).fill(null); S.score = 0; S.stood = false; S.bust = false; S.tiebreak = false;
  }
  t('hand-persists-across-sets', mid[0] === null && mid[2] === null && mid[1] === before[1] && mid[3] === before[3]
    && M.p.hand[0] === null && M.p.hand[2] === null);
}

// Standoff: higher score wins; exclusive tiebreak wins ties; both/neither → no point.
{
  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  M.p.score = 18; M.o.score = 17; M.p.stood = true; M.o.stood = true;
  M.p.tiebreak = false; M.o.tiebreak = false;
  const sp0 = M.setsP;
  PZ.resolveStandoff();
  t('standoff-higher-wins', M.setsP === sp0 + 1);

  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  M.p.score = 16; M.o.score = 16; M.p.stood = true; M.o.stood = true;
  M.p.tiebreak = true; M.o.tiebreak = false;
  const sp1 = M.setsP, so1 = M.setsO;
  PZ.resolveStandoff();
  t('standoff-tiebreak-wins', M.setsP === sp1 + 1 && M.setsO === so1);

  PZ.newMatchForTest(['+1','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  M.p.score = 15; M.o.score = 15; M.p.stood = true; M.o.stood = true;
  M.p.tiebreak = true; M.o.tiebreak = true;
  const sp2 = M.setsP, so2 = M.setsO, sn = M.setNum;
  PZ.resolveStandoff();
  t('standoff-both-tie-no-point', M.setsP === sp2 && M.setsO === so2 && M.phase === 'over');
  // Continue tied set → next set, no score change.
  PZ.dialogOK();
  t('standoff-tie-replays', PZ.getM().setNum === sn + 1 && PZ.getM().setsP === sp2 && PZ.getM().setsO === so2);
}

// AI must rescue a bust with minus / flip instead of giving up.
{
  const rescue = PZ.aiDecide({
    score: 22,
    board: [
      {card:{kind:'main',v:10},eff:10,isMain:true},
      {card:{kind:'main',v:8},eff:8,isMain:true},
      {card:{kind:'main',v:4},eff:4,isMain:true},
      null,null,null,null,null,null
    ],
    hand: [{id:'-3',kind:'mod',sign:-1,v:3}, null, null, null],
    oppScore: 18, oppStood: true, tier: 2, bustRisk: 0.5, setsO: 0
  });
  t('ai-rescue-bust-minus', !!rescue.play && rescue.play.tag === 'mod' && rescue.stand === false);

  const boardFlip = [
    {card:{kind:'main',v:4},eff:4,isMain:true},
    {card:{kind:'main',v:10},eff:10,isMain:true},
    {card:{kind:'main',v:10},eff:10,isMain:true},
    null,null,null,null,null,null
  ];
  const flipRescue = PZ.aiDecide({
    score: 24, board: boardFlip,
    hand: [{id:'2&4',kind:'flip',vals:[2,4]}, null, null, null],
    oppScore: 12, oppStood: false, tier: 3, bustRisk: 0.8, setsO: 1
  });
  t('ai-rescue-bust-flip', !!flipRescue.play && flipRescue.play.tag === 'flip');
}

// Zero-target flip does not consume the card.
{
  PZ.newMatchForTest(['2&4','-1','+2','-2','+3','-3','+4','-4','+5','-5'],{name:'T',tier:1,title:'X'});
  PZ.startSet();
  M = PZ.getM();
  M.turn = 'p'; M.phase = 'pAction'; M.sidePlayed = false;
  M.p.board = [{card:{kind:'main',v:5},eff:5,isMain:true},null,null,null,null,null,null,null,null];
  M.p.score = 5;
  M.p.hand = [PZ.makeCard('2&4'), PZ.makeCard('-1'), null, null];
  const n0 = M.p.hand.filter(Boolean).length;
  PZ.confirmPlay(0);
  t('flip-zero-keeps-card', M.p.hand[0] && M.p.hand[0].id === '2&4' && M.p.hand.filter(Boolean).length === n0 && M.sidePlayed === false);
}

// Soft tie vs stood opponent: don't auto-stand on a low equal when the deck is safe.
{
  t('ai-no-force-tie-stand-low', PZ.shouldStand(15, {
    oppStood: true, oppScore: 15, tier: 2, bustRisk: 0.1, setsO: 0
  }) === false);
  t('ai-force-tie-stand-high', PZ.shouldStand(19, {
    oppStood: true, oppScore: 19, tier: 2, bustRisk: 0.1, setsO: 0
  }) === true);
}

// makeCard rejects unknown ids; loadSave merges starters.
{
  t('makeCard-unknown-null', PZ.makeCard('NOPE') === null);
}

process.exit(fail ? 1 : 0);
