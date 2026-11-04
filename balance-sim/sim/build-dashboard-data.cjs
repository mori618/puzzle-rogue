// ダッシュボード用の CSV を作る
// 使い方: node build-dashboard-data.cjs <単体Lv1のdir> <単体最大Lvのdir> <フルラン(ランダム)のdir> <フルラン(優先)のdir> <出力dir>
// 先に analyzeA.cjs / analyzeB.cjs で sumA.json, sumA3.json, sumB.json, sumS.json を <出力dir>/.. に作っておく
const fs = require('fs');
const path = require('path');
const [, , , , dirB, dirS, OUT] = process.argv;
const RES = path.resolve(OUT, '..');
fs.mkdirSync(OUT, { recursive: true });
const q = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const w = (f, h, rows) => fs.writeFileSync(path.join(OUT, f), [h.join(','), ...rows.map(r => h.map(k => q(r[k])).join(','))].join('\n') + '\n');
const a = require(path.join(RES, 'sumA.json')), b = require(path.join(RES, 'sumA3.json'));
const B = require(path.join(RES, 'sumB.json')), S = require(path.join(RES, 'sumS.json'));
const m3 = Object.fromEntries(b.rows.map(r => [r.id, r]));
const T = { passive: 'パッシブ', skill: 'スキル', curse: '呪い' };
const toks = a.rows.map(r => { const x = m3[r.id] || {}; return { id: r.id, name: r.name, type: T[r.type] || r.type, rarity: r.rarity ?? 0, price: r.price ?? '', eff_lv1: r.eff, median_lv1: r.median, gain_lv1_pct: r.gainPct, stars_lv1: r.stars, triggers_lv1: r.trig, eff_lvmax: x.eff ?? '', median_lvmax: x.median ?? '', gain_lvmax_pct: x.gainPct ?? '', turns: r.n }; });
w('tokens.csv', Object.keys(toks[0]), toks);
const P = [['ランダム購入', B], ['強いトークン優先', S]];
const cyc = []; for (const [p, s] of P) for (let c = 1; c <= 12; c++) { const x = s.cycleStats[c]; if (!x) continue; cyc.push({ policy: p, cycle: c, target: x.target, reached: x.reached, cleared: x.cleared, clear_rate: x.clearRate, eff_median: x.effMedian }); }
w('cycles.csv', Object.keys(cyc[0]), cyc);
const d = []; for (const [p, s] of P) for (let c = 2; c <= 23; c++) d.push({ policy: p, final_cycle: c, runs: s.deathCycle[c] || 0 });
w('deaths.csv', Object.keys(d[0]), d);
const O = { safety: '安全', solid: '堅実', challenge: '挑戦' }; const o = [];
for (const [p, s] of P) for (const k of Object.keys(O)) if (s.byOption[k]) o.push({ policy: p, start: O[k], runs: s.byOption[k].n, avg_cycle: s.byOption[k].avgCycle });
w('starts.csv', Object.keys(o[0]), o);
const runs = [dirB, dirS].flatMap(dir => fs.readdirSync(dir).filter(f => /^run_\d+\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))));
const c6 = {}; let reach = 0, ok6 = 0;
runs.forEach(r => {
  const ts = r.log.events.filter(e => e.k === 'turn' && e.cy === 6); if (!ts.length) return; reach++;
  const last = ts[ts.length - 1]; const ok = (last.cycleCombo + last.effCombo) >= last.target; if (ok) ok6++;
  new Set(ts[0].tokens.map(t => t.id)).forEach(id => { c6[id] = c6[id] || { id, name: ts[0].tokens.find(t => t.id === id).n, runs: 0, cleared: 0 }; c6[id].runs++; if (ok) c6[id].cleared++; });
});
w('cycle6_tokens.csv', ['id', 'name', 'runs', 'cleared', 'clear_rate'], Object.values(c6).filter(x => x.runs >= 6).map(x => ({ ...x, clear_rate: +(x.cleared / x.runs).toFixed(3) })).sort((x, y) => y.clear_rate - x.clear_rate));
const turnsTotal = runs.reduce((s, r) => s + r.log.events.filter(e => e.k === 'turn').length, 0);
w('summary.csv', ['metric', 'value'], [
  { metric: 'baseline_eff', value: +a.baseline.eff.toFixed(2) }, { metric: 'baseline_sd', value: +a.baseline.effSd.toFixed(2) },
  { metric: 'baseline_stars', value: +a.baseline.stars.toFixed(2) }, { metric: 'tokens_tested', value: a.rows.length },
  { metric: 'runs_random', value: B.nRuns }, { metric: 'runs_smart', value: S.nRuns }, { metric: 'fullrun_turns', value: turnsTotal },
  { metric: 'single_test_turns', value: a.rows.reduce((s, r) => s + r.n, 0) + b.rows.reduce((s, r) => s + r.n, 0) + a.baseline.n },
  { metric: 'c6_reached', value: reach }, { metric: 'c6_cleared', value: ok6 },
]);
console.log('wrote', OUT);
