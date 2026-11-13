#!/usr/bin/env node
/**
 * バランスシミュレータ（docs/balance-ui-design.md §2・§4.2）
 *
 *   npm run balance            # 全トークンを評価し scratch/balance/ に出力
 *   npm run balance -- --quick # 確率系のサンプル数を減らして速く回す
 *
 * 限界倍率 = （そのトークンを足したときの獲得コンボ）÷（足す前の獲得コンボ）を、
 * 基準ビルド（balance/builds.json）× 基準パターン（balance/patterns.json）の全組で計算し、
 *   最適値（最大） / 汎用値（中央値） / 成立率（倍率が上がった組の割合）
 * を出す。そのうえで §2.4 のバンド下限割れと上位互換の逆転を違反として列挙する。
 *
 * 二つ名はこのブランチに未実装のため対象外（hutatuna ブランチ取り込み後に追加）。
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';
import { MAX_TARGET } from '../src/constants/gameConstants.js';
import { seeded, makeToken, runOnce, normalizeColors } from './lib/turnRunner.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const QUICK = process.argv.includes('--quick');

const { patterns } = readJson('balance/patterns.json');
const { stages, builds } = readJson('balance/builds.json');
const rules = readJson('balance/rules.json');
const SAMPLES = QUICK ? 8 : rules.randomSamples;
const FIRE = rules.fireThreshold;
const standout = new Set(rules.standout);
const byId = Object.fromEntries(ALL_TOKEN_BASES.map(t => [t.id, t]));

// ---------- 計算 ----------

/** 確率に依存しない手は1回、依存する手は固定シードで SAMPLES 回の平均（期待値）。 */
const evaluate = (tokens, pattern, runState, watchId = null) => {
  const lucky = runOnce(tokens, pattern, runState, () => 0);
  const unlucky = runOnce(tokens, pattern, runState, () => 0.999999);
  const selfFired = watchId ? lucky.firedIds.has(watchId) : false;
  if (lucky.out === unlucky.out) return { out: lucky.out, selfFired };
  const rng = seeded(12345);
  let sum = 0;
  for (let i = 0; i < SAMPLES; i++) sum += runOnce(tokens, pattern, runState, rng).out;
  return { out: sum / SAMPLES, selfFired };
};

// ---------- 評価対象 ----------

const candidates = ALL_TOKEN_BASES.filter(t => t.type === 'passive' && t.rarity >= 1);
const levelsOf = (t) => (t.rarity === 4 ? [1] : [1, 2, 3]);

const contexts = [];
builds.forEach(b => {
  Object.entries(stages).forEach(([stageId, stage]) => {
    const tokens = b.tokens.map((id, i) => makeToken(id, stage.level, i));
    patterns.forEach(p => {
      contexts.push({
        key: `${b.id}/${stageId}/${p.id}`,
        build: b, stageId, stage, pattern: p, tokens,
        base: evaluate(tokens, p, stage.runState).out,
      });
    });
  });
});

// 比較の基準は「同じレア度・Lvで効果のない札」を足した状態。★3の所持数（三星の極雷）や
// 合計Lv（全霊の共鳴）のような、札の枚数・レア度で伸びる相乗効果を差し引くため。
const dummyCache = new Map();
const dummyBase = (ctx, rarity, level) => {
  const key = `${ctx.key}|${rarity}|${level}`;
  if (!dummyCache.has(key)) {
    const dummy = { id: '__dummy', name: '（効果なし）', type: 'passive', rarity, level, instanceId: '__dummy', attributes: [] };
    dummyCache.set(key, evaluate([...ctx.tokens, dummy], ctx.pattern, ctx.stage.runState).out);
  }
  return dummyCache.get(key);
};

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

const started = Date.now();
const results = []; // { token, level, marginals: Map<ctxKey, m> }
candidates.forEach(t => {
  levelsOf(t).forEach(level => {
    const marginals = new Map();
    const selfFiredKeys = new Set();
    contexts.forEach(ctx => {
      if (ctx.build.tokens.includes(t.id)) return;
      const cand = normalizeColors(makeToken(t.id, level, ctx.tokens.length));
      const base = dummyBase(ctx, t.rarity, cand.level);
      if (!(base > 0)) return;
      const tokens = [...ctx.tokens, cand];
      const { out, selfFired } = evaluate(tokens, ctx.pattern, ctx.stage.runState, cand.instanceId);
      marginals.set(ctx.key, out / base);
      if (selfFired) selfFiredKeys.add(ctx.key);
    });
    const values = [...marginals.values()];
    let bestKey = null; let best = -Infinity;
    marginals.forEach((m, k) => { if (m > best) { best = m; bestKey = k; } });
    results.push({
      token: t, level, marginals,
      optimum: best,
      optimumAt: bestKey,
      general: median(values),
      fireRate: selfFiredKeys.size / values.length,
      selfFired: selfFiredKeys.size > 0,
      worst: Math.min(...values),
    });
  });
});
const elapsed = ((Date.now() - started) / 1000).toFixed(1);

// ---------- 判定 ----------

// 自分の効果が一度も発動しない札（経済・盤面・スキル充填など）や、発動しても獲得コンボが変わらない札は
// この指標では評価しない（他の札との数の相乗効果だけで上がるケースを除くため）。
const affectsCombo = (r) => r.selfFired && (r.optimum > FIRE || r.worst < 1 / FIRE);
// 代償（操作時間・落ちコン停止・★の保持・禁止色など）を持つ札。代償はこの指標に表れないので、
// 代償のない札と比べて「上位互換」とはみなさない。
const COST_KINDS = [
  ['時間', /desperate|cursed_power|tyrant/],
  ['落ちコン停止', /forbidden/],
  ['色の禁止', /devotion|contract/],
  ['形の制限', /restriction|one_stroke|seal/],
  ['★の保持', /greed/],
];
const costKind = (t) => {
  if (t.type === 'curse') return '呪い';
  const key = `${t.effect || ''} ${t.id}`;
  return COST_KINDS.find(([, re]) => re.test(key))?.[0] ?? null;
};
const isDemerit = (t) => costKind(t) !== null;
const unmodeled = rules.unmodeled || {};

const bandViolations = [];
const lossViolations = [];
const unevaluated = [];
results.forEach(r => {
  const { token: t, level } = r;
  if (!affectsCombo(r)) { unevaluated.push(r); return; }
  if (standout.has(t.id) || unmodeled[t.id]) return;
  const lower = rules.bands[String(t.rarity)]?.[level - 1];
  if (lower !== undefined && r.optimum < lower) bandViolations.push({ ...r, lower });
  if (r.optimum < 1 / FIRE && !isDemerit(t)) lossViolations.push(r);
});

// 上位互換の逆転: 同じLvで、低レアの b が「全ての組」で高レアの a 以上（= b が a の上位互換）。
// a が効く組が1つ以上あり、比較できる組が共通であること。
const reversals = [];
const noReversalCtx = new Set(contexts.filter(c => c.build.excludeFromReversal).map(c => c.key));
const byLevel = new Map();
results.filter(r => affectsCombo(r) && !standout.has(r.token.id) && !unmodeled[r.token.id] && r.token.rarity <= 3 && r.optimum > FIRE)
  .forEach(r => {
    if (!byLevel.has(r.level)) byLevel.set(r.level, []);
    byLevel.get(r.level).push(r);
  });
byLevel.forEach(list => {
  list.forEach(a => {
    const aFires = [...a.marginals].filter(([k, m]) => m > FIRE && !noReversalCtx.has(k)).length;
    if (aFires === 0) return; // 比較対象の組で一度も効かない札は判定しない
    const comparable = [...a.marginals.keys()].filter(k => !noReversalCtx.has(k)).length;
    list.forEach(b => {
      if (b.token.rarity >= a.token.rarity || b.token.id === a.token.id) return;
      if (costKind(b.token) !== costKind(a.token) && costKind(b.token) !== null) return;
      let shared = 0;
      const dominated = [...a.marginals].every(([k, m]) => {
        if (noReversalCtx.has(k)) return true;
        const bm = b.marginals.get(k);
        if (bm === undefined) return true; // b が文脈ビルドに含まれる組は比較しない
        shared++;
        return bm >= m - 1e-9;
      });
      if (dominated && shared >= comparable * 0.8) reversals.push({ upper: a, lower: b, fires: aFires });
    });
  });
});

// ---------- 進行シミュレーション（§1.4 のカーブと重ねる） ----------

const targetOfCycle = (cycle) => {
  let target = 8;
  for (let i = 2; i <= cycle; i++) {
    let mult = 1.5; let add = 2;
    if (i === 6) { mult = 3.0; add = 200; }
    else if (i === 11) { mult = 4.0; add = 5000; }
    else if (i === 16) { mult = 5.0; add = 200000; }
    else if (i === 21) { mult = 6.0; add = 10000000; }
    else if (i === 25) { mult = 10.0; add = 2000000000; }
    else if (i > 25) { mult = 2.5; add = 0; }
    else if (i > 21) { mult = 2.0; add = 0; }
    else if (i > 16) { mult = 2.0; add = 0; }
    else if (i > 11) { mult = 1.8; add = 0; }
    else if (i > 6) { mult = 1.6; add = 0; }
    target = Math.floor(target * mult) + add;
  }
  return Math.min(target, MAX_TARGET);
};
const TURNS_PER_CYCLE = 3;
const progress = [];
builds.forEach(b => {
  Object.entries(stages).forEach(([stageId, stage]) => {
    const ctx = contexts.find(c => c.key === `${b.id}/${stageId}/${b.pattern}`);
    const perTurn = ctx.base;
    // 手番強化スキル（temp_mult など）は1サイクルに1回、その手番だけ activeBuffs に載せる
    const skillBuffs = (b.skills || []).map(id => byId[id]).filter(s => s?.action === 'temp_mult')
      .map(s => ({ action: s.action, params: s.params }));
    const skillTurn = skillBuffs.length
      ? runOnce(ctx.tokens, ctx.pattern, { ...ctx.stage.runState, activeBuffs: skillBuffs }, () => 0).out
      : perTurn;
    const perCycle = perTurn * (TURNS_PER_CYCLE - 1) + skillTurn;
    let reach = 0;
    for (let c = 1; c <= 25; c++) {
      if (perCycle >= targetOfCycle(c)) reach = c; else break;
    }
    progress.push({ build: b, stageId, stage, perTurn, perCycle, reach });
  });
});

// ---------- 出力 ----------

const OUT = join(ROOT, 'scratch', 'balance');
mkdirSync(OUT, { recursive: true });

const csvEsc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const csv = [
  ['id', 'name', 'rarity', 'level', 'price', 'effect', 'optimum', 'optimumAt', 'general', 'fireRate', 'worst', 'lowerBand', 'flags'].join(','),
  ...results.map(r => {
    const lower = rules.bands[String(r.token.rarity)]?.[r.level - 1] ?? '';
    const flags = [
      standout.has(r.token.id) ? 'standout' : '',
      !affectsCombo(r) ? 'no-combo-effect' : '',
      bandViolations.includes(r) || bandViolations.some(v => v.token === r.token && v.level === r.level) ? 'below-band' : '',
    ].filter(Boolean).join('|');
    return [r.token.id, r.token.name, r.token.rarity, r.level, r.token.price, r.token.effect ?? '',
      round(r.optimum), r.optimumAt ?? '', round(r.general), round(r.fireRate), round(r.worst), lower, flags]
      .map(csvEsc).join(',');
  }),
].join('\n');
writeFileSync(join(OUT, 'tokens.csv'), csv);

const fmt = (v) => (v >= 1000 ? Math.round(v).toLocaleString('en-US') : round(v, 2));
const lines = [];
lines.push('# バランスシミュレーション結果', '');
lines.push(`対象: パッシブ ${candidates.length} 種（${results.length} 件 = トークン×Lv）／ 文脈 ${contexts.length}（ビルド${builds.length}×段階${Object.keys(stages).length}×パターン${patterns.length}）／ ${elapsed} 秒`, '');
lines.push('## 進行シミュレーション（1サイクル3手の合計が目標以上なら到達。手番強化スキルは1サイクル1回）', '');
lines.push('| ビルド | 段階 | パターン | 1手の獲得 | 1サイクルの獲得 | 到達サイクル | 次のサイクルの目標 |', '|---|---|---|---:|---:|---:|---:|');
progress.forEach(p => lines.push(`| ${p.build.id} ${p.build.name} | ${p.stage.label} | ${p.build.pattern} | ${fmt(p.perTurn)} | ${fmt(p.perCycle)} | ${p.reach} | ${p.reach < 25 ? fmt(targetOfCycle(p.reach + 1)) : '—'} |`));
lines.push('');
const reversalGroups = new Map();
reversals.forEach(rv => {
  const key = `${rv.upper.token.id}@${rv.upper.level}`;
  if (!reversalGroups.has(key)) reversalGroups.set(key, { upper: rv.upper, lowers: [] });
  reversalGroups.get(key).lowers.push(rv.lower);
});
lines.push(`## 上位互換の逆転（${reversalGroups.size} 件 / 組み合わせ ${reversals.length}）`, '');
lines.push('同じLvで、レアの低い札が全ての組で同等以上になっている（＝その札の上位互換が低レアにある）。解消は高レア側の引き上げ（§2.4）。', '');
lines.push('- 代償のある札（誓約・禁忌・背水など）は、同じ種類の代償を持つ札とだけ比べる（時間・落ちコン停止・色の禁止・形の制限・★の保持）。代償をスキルで回避できるか（例: 誓約の対立色を静寂スキルで消さない）はこの指標では測れない。');
lines.push('- 伝説（★4）はビルドの軸になる札なので、逆転の判定から外す（バンド判定のみ）。');
lines.push(`- ${builds.filter(b => b.excludeFromReversal).map(b => `${b.id}（${b.excludeFromReversal}）`).join('、') || 'なし'} は比較から外す。`, '');
lines.push('| 負けている札 | ★ | Lv | 最適値 | 上位互換になっている低レアの札（数） | 例 |', '|---|---:|---:|---:|---:|---|');
[...reversalGroups.values()]
  .sort((x, y) => y.upper.token.rarity - x.upper.token.rarity || y.lowers.length - x.lowers.length)
  .forEach(({ upper, lowers }) => {
    const names = [...new Set(lowers.sort((p, q) => q.token.rarity - p.token.rarity).map(l => `${l.token.name}（★${l.token.rarity}）`))];
    lines.push(`| ${upper.token.name} | ${upper.token.rarity} | ${upper.level} | ${round(upper.optimum, 2)} | ${lowers.length} | ${names.slice(0, 4).join('、')}${names.length > 4 ? ' ほか' : ''} |`);
  });
lines.push('');
lines.push(`## バンド下限割れ（${bandViolations.length} 件）`, '');
lines.push('最も噛み合う組でもレア度・Lvの下限に届かない札。突出枠は除外。', '');
lines.push('| 札 | ★ | Lv | 最適値 | 下限 | 最適な組 | 成立率 |', '|---|---:|---:|---:|---:|---|---:|');
bandViolations
  .sort((x, y) => (x.optimum / x.lower) - (y.optimum / y.lower))
  .forEach(v => lines.push(`| ${v.token.name} | ${v.token.rarity} | ${v.level} | ${round(v.optimum, 2)} | ${v.lower} | ${v.optimumAt} | ${Math.round(v.fireRate * 100)}% |`));
lines.push('');
lines.push(`## 純粋な損（${lossViolations.length} 件）`, '');
lossViolations.forEach(v => lines.push(`- ${v.token.name} Lv${v.level}: 最適値 ${round(v.optimum, 3)}`));
lines.push('');
lines.push('## 盤面を変える札（固定パターンでは測れないため判定対象外）', '');
Object.entries(unmodeled).forEach(([id, reason]) => lines.push(`- ${byId[id]?.name ?? id}: ${reason}`));
lines.push('');
lines.push('## 突出枠（判定対象外・記録のみ）', '');
lines.push('| 札 | Lv | 最適値 | 汎用値 | 最適な組 |', '|---|---:|---:|---:|---|');
results.filter(r => standout.has(r.token.id)).forEach(r => lines.push(`| ${r.token.name} | ${r.level} | ${fmt(r.optimum)} | ${fmt(r.general)} | ${r.optimumAt} |`));
lines.push('');
const noCombo = [...new Set(unevaluated.map(r => r.token.name))];
lines.push(`## コンボに影響しない札（${noCombo.length} 種・経済／盤面／時間など。この指標では評価しない）`, '');
lines.push(noCombo.join('、'), '');
writeFileSync(join(OUT, 'report.md'), lines.join('\n'));

console.log(`評価 ${results.length} 件 / 文脈 ${contexts.length} / ${elapsed}s`);
console.log(`上位互換の逆転: ${reversalGroups.size} 件（組み合わせ ${reversals.length}）`);
console.log(`バンド下限割れ: ${bandViolations.length} 件`);
console.log(`純粋な損: ${lossViolations.length} 件`);
console.log(`コンボに影響しない札: ${noCombo.length} 種`);
console.log('進行（late 段階の到達サイクル）: ' + progress.filter(p => p.stageId === 'late').map(p => `${p.build.id}=${p.reach}`).join(' '));
console.log(`出力: ${join('scratch', 'balance', 'report.md')}, ${join('scratch', 'balance', 'tokens.csv')}`);
