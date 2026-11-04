// 単体効果テストの集計
// node analyzeA.cjs <dir> <out.json>
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const outFile = process.argv[3] || path.join(dir, 'summary.json');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'summary.json');
const recs = files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).filter(r => r.turns);
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
// 大きな値は対数で比べる（倍率系が桁違いに伸びるため）
const baseTurns = recs.filter(r => r.tokenId === '__none__').flatMap(r => r.turns.filter(Boolean));
const B = {
  eff: mean(baseTurns.map(t => t.eff)), effSd: sd(baseTurns.map(t => t.eff)),
  pure: mean(baseTurns.map(t => t.pure)), stars: mean(baseTurns.map(t => t.stars)), n: baseTurns.length,
  tl: mean(baseTurns.map(t => t.tl)),
};
const rows = [];
for (const r of recs) {
  if (r.tokenId === '__none__') continue;
  const ts = r.turns.filter(Boolean);
  if (ts.length === 0) { rows.push({ id: r.tokenId, n: 0, err: 'noturns', errs: r.errs }); continue; }
  const eff = ts.map(t => Math.min(t.eff || 0, 1e15));
  const effMean = mean(eff);
  const med = [...eff].sort((a, b) => a - b)[Math.floor(eff.length / 2)];
  const se = sd(eff) / Math.sqrt(eff.length);
  const baseSe = B.effSd / Math.sqrt(eff.length);
  const z = (effMean - B.eff) / Math.sqrt(se ** 2 + (B.effSd ** 2) / B.n || 1);
  const bTok = {}; const mTok = {};
  ts.forEach(t => {
    (t.b || []).forEach(([label, v]) => { bTok[label] = (bTok[label] || 0) + (Number(v) || 0); });
    (t.m || []).forEach(([label, type, v]) => { mTok[label] = mTok[label] || []; mTok[label].push(v); });
  });
  rows.push({
    id: r.tokenId, name: r.setup.name, type: r.setup.type, rarity: r.setup.rarity, price: r.setup.price, lv: r.setup.lv,
    n: ts.length, eff: +effMean.toFixed(2), median: med, effMax: Math.max(...eff),
    gainPct: +((effMean / B.eff - 1) * 100).toFixed(1),
    z: +z.toFixed(2),
    pure: +mean(ts.map(t => t.pure)).toFixed(2),
    pureGainPct: +((mean(ts.map(t => t.pure)) / B.pure - 1) * 100).toFixed(1),
    stars: +mean(ts.map(t => t.stars)).toFixed(2),
    starsGain: +(mean(ts.map(t => t.stars)) - B.stars).toFixed(2),
    tl: Math.round(mean(ts.map(t => t.tl || 0))),
    mult: +mean(ts.map(t => t.mult || 1)).toFixed(3),
    bonus: +mean(ts.map(t => t.bonus || 0)).toFixed(2),
    skillUses: r.skillUses, trig: r.trig,
    gainPerStar: r.setup.price ? +(((effMean / B.eff - 1) * 100) / r.setup.price).toFixed(2) : null,
    bSteps: bTok, mSteps: Object.fromEntries(Object.entries(mTok).map(([k, v]) => [k, v.length])),
    errs: r.errs?.length ? r.errs : undefined,
  });
}
rows.sort((a, b) => (b.gainPct ?? -1e9) - (a.gainPct ?? -1e9));
fs.writeFileSync(outFile, JSON.stringify({ baseline: B, rows }, null, 1));
const csv = ['id,name,type,rarity,price,lv,n,eff,median,gainPct,z,pure,pureGainPct,stars,starsGain,tl,mult,bonus,skillUses,trig,gainPerStar'];
rows.forEach(r => csv.push([r.id, r.name, r.type, r.rarity, r.price, r.lv, r.n, r.eff, r.median, r.gainPct, r.z, r.pure, r.pureGainPct, r.stars, r.starsGain, r.tl, r.mult, r.bonus, r.skillUses, r.trig, r.gainPerStar].map(x => (x === undefined || x === null) ? '' : String(x).replace(/,/g, '、')).join(',')));
fs.writeFileSync(outFile.replace(/\.json$/, '.csv'), csv.join('\n'));
console.log('baseline', B);
console.log('tokens', rows.length);
