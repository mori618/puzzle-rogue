// 組み合わせテストの集計
// node analyzeC.cjs <dir> <out.json> [out.csv]
// 実測と、単体テスト（results/sumA.json = Lv1、sumA3.json = 最大Lv）から出した2つの予想を並べる。
//   掛け算の予想: 基準 × Π(単体の平均 / 基準)    … 効果が互いに掛け合わさる場合
//   足し算の予想: 基準 × (1 + Σ 単体の増加率)    … 効果が互いに足し合わさる場合
// 「相乗」= 実測 / 掛け算の予想。1 を大きく超えると、単体の値からは見えない組み合わせの価値がある。
const fs = require('fs');
const path = require('path');
const CASES = require('./combo-cases.cjs');
const dir = process.argv[2];
const outFile = process.argv[3] || path.join(dir, 'summary.json');
const csvFile = process.argv[4];
const res = path.join(__dirname, '..', 'results');
const single = {
  1: Object.fromEntries(JSON.parse(fs.readFileSync(path.join(res, 'sumA.json'), 'utf8')).rows.map(r => [r.id, r])),
  3: Object.fromEntries(JSON.parse(fs.readFileSync(path.join(res, 'sumA3.json'), 'utf8')).rows.map(r => [r.id, r])),
};
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== path.basename(outFile));
const recs = files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).filter(r => r.turns);
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

const baseTurns = recs.filter(r => r.key === '__none__').flatMap(r => r.turns.filter(Boolean)).map(t => t.eff || 0);
const B = { eff: mean(baseTurns), sd: sd(baseTurns), median: median(baseTurns), n: baseTurns.length };

const rows = [];
for (const c of CASES) {
  const rs = recs.filter(r => r.key === c.key);
  const ts = rs.flatMap(r => r.turns.filter(Boolean));
  if (!ts.length) { rows.push({ key: c.key, group: c.group, label: c.label, n: 0 }); continue; }
  const eff = ts.map(t => t.eff || 0);
  const m = mean(eff);
  let prodRatio = 1, sumGain = 0, missing = [];
  for (const t of c.tokens) {
    const s = single[(t.lv || 1) >= 3 ? 3 : 1][t.id] || single[1][t.id];
    if (!s) { missing.push(t.id); continue; }
    prodRatio *= (s.eff / B.eff);
    sumGain += (s.eff / B.eff - 1);
  }
  const predMul = B.eff * prodRatio;
  const predAdd = B.eff * (1 + sumGain);
  const mults = ts.map(t => t.mult || 1);
  rows.push({
    key: c.key, group: c.group, label: c.label, n: ts.length,
    tokens: c.tokens.map(t => `${t.id}${(t.lv || 1) > 1 ? '@' + t.lv : ''}`).join(' '),
    rarities: (rs[0]?.setup?.tokens || []).map(t => t.rarity).join(''),
    eff: +m.toFixed(2), median: median(eff), se: +(sd(eff) / Math.sqrt(eff.length)).toFixed(2),
    gainPct: +((m / B.eff - 1) * 100).toFixed(1),
    medianMult: +median(mults).toFixed(2),
    predMul: +predMul.toFixed(2), predAdd: +predAdd.toFixed(2),
    synergy: +(m / predMul).toFixed(2),
    missing: missing.join(' '),
    errs: rs.flatMap(r => r.errs || []).length,
  });
}
fs.writeFileSync(outFile, JSON.stringify({ baseline: B, rows }, null, 1));
if (csvFile) {
  const cols = ['group', 'key', 'label', 'tokens', 'rarities', 'n', 'eff', 'median', 'se', 'gainPct', 'medianMult', 'predMul', 'predAdd', 'synergy', 'missing', 'errs'];
  const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  fs.writeFileSync(csvFile, [cols.join(','), ...rows.map(r => cols.map(k => esc(r[k])).join(','))].join('\n') + '\n');
}
console.log(`基準: 平均 ${B.eff.toFixed(2)} 中央値 ${B.median} (n=${B.n})`);
let g = '';
for (const r of rows) {
  if (r.group !== g) { g = r.group; console.log(`\n## ${g}`); }
  if (!r.n) { console.log(`  ${r.label}: データなし`); continue; }
  console.log(`  ${r.label}\n     実測 ${r.eff}（中央値 ${r.median}, 倍率中央値 ${r.medianMult}） 増加 ${r.gainPct}% | 予想 掛け算 ${r.predMul} / 足し算 ${r.predAdd} | 相乗 ${r.synergy}${r.missing ? ' 単体なし:' + r.missing : ''}${r.errs ? ' errs=' + r.errs : ''}`);
}
