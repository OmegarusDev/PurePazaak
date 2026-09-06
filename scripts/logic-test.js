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
process.exit(fail ? 1 : 0);
