// フルランの集計
// node analyzeB.cjs <dir> <out.json>
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const outFile = process.argv[3];
const files = fs.readdirSync(dir).filter(f => /^run_\d+\.json$/.test(f));
const runs = files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);

const res = { nRuns: runs.length, results: {}, byOption: {}, deathCycle: {}, cycleStats: {}, tokens: {}, errors: {} };
runs.forEach(r => {
  res.results[r.result] = (res.results[r.result] || 0) + 1;
  const o = res.byOption[r.option] = res.byOption[r.option] || { n: 0, cycles: [] };
  o.n++; o.cycles.push(r.final.cycle);
  res.deathCycle[r.final.cycle] = (res.deathCycle[r.final.cycle] || 0) + 1;
  (r.errors || []).forEach(e => { const k = e.slice(0, 120); res.errors[k] = (res.errors[k] || 0) + 1; });
});
Object.values(res.byOption).forEach(o => { o.avgCycle = +mean(o.cycles).toFixed(2); o.cycles = undefined; });

// サイクルごと: 目標・手番ごとの実効コンボ・クリア率
const cyc = {};
runs.forEach(r => {
  const ev = r.log?.events || [];
  const turns = ev.filter(e => e.k === 'turn');
  const byCy = {};
  turns.forEach(t => { (byCy[t.cy] = byCy[t.cy] || []).push(t); });
  Object.entries(byCy).forEach(([cy, ts]) => {
    const c = cyc[cy] = cyc[cy] || { reached: 0, cleared: 0, target: ts[0].target, effs: [], turnsUsed: [], pures: [], nTok: [] };
    c.reached++;
    const last = ts[ts.length - 1];
    const total = (last.cycleCombo || 0) + (last.effCombo || 0);
    if (total >= last.target) c.cleared++;
    ts.forEach(t => c.effs.push(t.effCombo || 0));
    c.turnsUsed.push(ts.length);
    c.nTok.push((last.tokens || []).length);
  });
});
Object.entries(cyc).forEach(([k, c]) => {
  const sorted = [...c.effs].sort((a, b) => a - b);
  res.cycleStats[k] = {
    reached: c.reached, cleared: c.cleared, clearRate: +(c.cleared / c.reached).toFixed(3), target: c.target,
    effMedian: sorted[Math.floor(sorted.length / 2)], effMean: +mean(c.effs).toFixed(1),
    avgTurnsUsed: +mean(c.turnsUsed).toFixed(2), avgTokens: +mean(c.nTok).toFixed(1),
  };
});

// トークン別: 購入回数、所持ランの到達サイクル、所持中のターン比較
const tokInfo = {};
const ensure = (id, n) => (tokInfo[id] = tokInfo[id] || { id, name: n, offered: 0, bought: 0, runsOwned: 0, finalCycleWhenOwned: [], ownedAtDeath: 0, trig: 0, firstCycleOwned: [], soldCount: 0, contribSteps: 0 });
runs.forEach(r => {
  const ev = r.log?.events || [];
  const owned = new Map();
  ev.forEach(e => {
    if (e.k === 'shopItems') (e.items || []).forEach(it => ensure(it.id, it.n).offered++);
    if (e.k === 'buy') { const t = ensure(e.tok.id, e.tok.n); t.bought++; if (!owned.has(e.tok.id)) owned.set(e.tok.id, e.cy); }
    if (e.k === 'sell') ensure(e.tok.id, e.tok.n).soldCount++;
    if (e.k === 'trig') ensure(e.id, e.n).trig++;
    if (e.k === 'turn') {
      (e.tokens || []).forEach(t => { ensure(t.id, t.n); if (!owned.has(t.id)) owned.set(t.id, e.cy); });
      (e.bSteps || []).forEach(s => { /* label only */ });
    }
  });
  const lastTurn = ev.filter(e => e.k === 'turn').pop();
  const atDeath = new Set((lastTurn?.tokens || []).map(t => t.id));
  owned.forEach((cy, id) => {
    const t = tokInfo[id]; t.runsOwned++; t.finalCycleWhenOwned.push(r.final.cycle); t.firstCycleOwned.push(cy);
    if (atDeath.has(id)) t.ownedAtDeath++;
  });
});
// 比較: 「サイクルc で入手したラン」の最終到達サイクル vs 「サイクルc に到達したが未入手のラン」の最終到達サイクル（生存バイアスを減らす）
const reachCycle = runs.map(r => r.final.cycle);
Object.values(tokInfo).forEach(t => {
  if (t.runsOwned === 0) return;
  const avgFirst = mean(t.firstCycleOwned);
  const c0 = Math.round(avgFirst);
  const control = reachCycle.filter(c => c >= c0);
  t.avgFinalCycle = +mean(t.finalCycleWhenOwned).toFixed(2);
  t.avgFirstCycle = +avgFirst.toFixed(2);
  t.controlAvgFinal = +mean(control).toFixed(2);
  t.liftCycles = +(t.avgFinalCycle - t.controlAvgFinal).toFixed(2);
  t.finalCycleWhenOwned = undefined; t.firstCycleOwned = undefined;
});
res.tokens = Object.values(tokInfo).filter(t => t.runsOwned > 0 || t.offered > 0).sort((a, b) => (b.liftCycles ?? -99) - (a.liftCycles ?? -99));
fs.writeFileSync(outFile, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ nRuns: res.nRuns, results: res.results, byOption: res.byOption, deathCycle: res.deathCycle }, null, 0));
console.log(JSON.stringify(res.cycleStats));
console.log('errors', JSON.stringify(res.errors).slice(0, 1500));
