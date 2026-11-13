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
import { calcTurnResult, createNoopFx } from '../src/engine/comboCalculator.js';
import { buildRealtimeBonuses, calcGroupAddition } from '../src/engine/realtimeBonuses.js';

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

const clone = (o) => JSON.parse(JSON.stringify(o));
// 評価中のトークン自身が発動したかを記録する（他の札との数の相乗効果だけで上がった場合と区別するため）
const fired = new Set();
const fx = createNoopFx();
fx.triggerPassive = (id) => { fired.add(id); };

// 再現できる乱数（mulberry32）
const seeded = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const makeToken = (id, level, index) => {
  const base = byId[id];
  if (!base) throw new Error(`unknown token id: ${id}`);
  return { ...base, level: base.rarity === 4 ? 1 : level, instanceId: `${id}_${index}` };
};

/**
 * パターンの groups から手番の入力を作る。素コンボ（turnCombo）は、連鎖中の加算
 * （型・脈動・落ちコン・強化ドロップ・加算の極意）を含めた値にする。
 * 近似: 模倣・先導・試練によるトークン複製、ボム爆発分の加算は連鎖中の加算に反映しない。
 */
const buildTurnInput = (pattern, tokens, runState) => {
  const masteryToken = tokens.find(t => t.effect === 'additive_mastery');
  const rb = buildRealtimeBonuses({
    effectiveTokens: tokens,
    currentRunStats: runState.currentRunStats,
    activeBuffs: [],
    isEnchantDisabled: false,
    hasMastery: !!masteryToken,
    masteryMultiplier: masteryToken ? masteryToken.values[(masteryToken.level || 1) - 1] : 1,
  });
  const colorComboCounts = {};
  const erasedColorCounts = {};
  const shapes = [];
  const detailedShapes = [];
  let turnCombo = 0;
  let hasSkyfallCombo = false;
  let overLinkMultiplier = 1;
  pattern.groups.forEach(g => {
    colorComboCounts[g.color] = (colorComboCounts[g.color] || 0) + 1;
    erasedColorCounts[g.color] = (erasedColorCounts[g.color] || 0) + g.length;
    if (g.shape) shapes.push(g.shape);
    detailedShapes.push({ shape: g.shape || null, color: g.color, length: g.length });
    if (g.skyfall) hasSkyfallCombo = true;
    const r = calcGroupAddition(rb, {
      shape: g.shape, type: g.color, isSkyfall: !!g.skyfall, enhancedCount: g.enhanced || 0,
    }, { overLinkMultiplier });
    overLinkMultiplier = r.overLinkMultiplier;
    r.events.forEach(ev => { if (ev.kind === 'trigger') fired.add(ev.id); });
    r.tokenBonuses.forEach(b => { if (b.info?.id) fired.add(b.info.id); });
    turnCombo += r.addition + r.tokenBonuses.reduce((s, b) => s + b.amount, 0);
  });
  return {
    turnCombo, colorComboCounts, erasedColorCounts, shapes, detailedShapes, hasSkyfallCombo, overLinkMultiplier,
    erasedByBombTotal: pattern.erasedByBombTotal || 0,
    erasedByRepeatTotal: pattern.erasedByRepeatTotal || 0,
    erasedByStarTotal: pattern.erasedByStarTotal || 0,
    extraStats: clone(pattern.extraStats || {}),
  };
};

/** @returns {{ out: number, firedIds: Set<string> }} */
const runOnce = (tokens, pattern, runState, rng) => {
  fired.clear();
  const rs = clone(runState);
  const turn = buildTurnInput(pattern, tokens, rs);
  const result = calcTurnResult({
    activeBuffs: [],
    hasSaintToken: false,
    isBeyondMode: false,
    settings: { comboAnimationMode: 'instant' },
    skippedTurnsBonus: 0,
    ...rs,
    ...turn,
    finalErasedColorCounts: { ...turn.erasedColorCounts },
    tokens,
    rng,
  }, fx);
  result.steps.forEach(st => { if (st.tokenId) fired.add(st.tokenId); });
  return { out: result.effectiveCombo, firedIds: new Set(fired) };
};

// トークンの色を評価用に寄せる: 1色目→炎、2色目→月、3色目以降→雨・風・雷・癒 の順に置き換える
const COLOR_ORDER = ['fire', 'dark', 'water', 'wood', 'light', 'heart'];
const tokenColors = (t) => {
  const p = t.params || {};
  const list = [p.color, ...(p.colors || []), p.attribute, p.from, p.to].filter(c => COLOR_ORDER.includes(c));
  if (list.length === 0 && t.attributes?.length === 1 && COLOR_ORDER.includes(t.attributes[0])) list.push(t.attributes[0]);
  return [...new Set(list)];
};
const normalizeColors = (t) => {
  const own = tokenColors(t);
  if (own.length === 0) return t;
  const rest = COLOR_ORDER.filter(c => !own.includes(c));
  const map = {};
  [...own, ...rest].forEach((c, i) => { map[c] = COLOR_ORDER[i]; });
  const swap = (v) => {
    if (typeof v === 'string') return map[v] || v;
    if (Array.isArray(v)) return v.map(swap);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
    return v;
  };
  return { ...t, params: swap(t.params), attributes: swap(t.attributes) };
};

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
      if (!(ctx.base > 0)) return;
      const cand = normalizeColors(makeToken(t.id, level, ctx.tokens.length));
      const tokens = [...ctx.tokens, cand];
      const { out, selfFired } = evaluate(tokens, ctx.pattern, ctx.stage.runState, cand.instanceId);
      // 自分の効果が発動しなかった組は、他の札との相乗効果で上がっていても 1 として扱う
      marginals.set(ctx.key, selfFired ? out / ctx.base : 1);
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
const isDemerit = (t) => t.type === 'curse' ||
  /forbidden|desperate|devotion|contract|restriction|one_stroke|seal|greed|cursed_power|tyrant/.test(`${t.effect || ''} ${t.id}`);

const bandViolations = [];
const lossViolations = [];
const unevaluated = [];
results.forEach(r => {
  const { token: t, level } = r;
  if (!affectsCombo(r)) { unevaluated.push(r); return; }
  if (standout.has(t.id)) return;
  const lower = rules.bands[String(t.rarity)]?.[level - 1];
  if (lower !== undefined && r.optimum < lower) bandViolations.push({ ...r, lower });
  if (r.optimum < 1 / FIRE && !isDemerit(t)) lossViolations.push(r);
});

// 上位互換の逆転: 同じLvで、低レアの b が「全ての組」で高レアの a 以上（= b が a の上位互換）。
// a が効く組が1つ以上あり、比較できる組が共通であること。
const reversals = [];
const noReversalCtx = new Set(contexts.filter(c => c.build.excludeFromReversal).map(c => c.key));
const byLevel = new Map();
results.filter(r => affectsCombo(r) && !standout.has(r.token.id) && r.optimum > FIRE)
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
      if (isDemerit(b.token) && !isDemerit(a.token)) return;
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
    let reach = 0;
    for (let c = 1; c <= 25; c++) {
      if (perTurn * TURNS_PER_CYCLE >= targetOfCycle(c)) reach = c; else break;
    }
    progress.push({ build: b, stageId, stage, perTurn, reach });
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
lines.push('## 進行シミュレーション（1手の獲得 ×3 が目標以上なら到達）', '');
lines.push('| ビルド | 段階 | パターン | 1手の獲得 | 到達サイクル |', '|---|---|---|---:|---:|');
progress.forEach(p => lines.push(`| ${p.build.id} ${p.build.name} | ${p.stage.label} | ${p.build.pattern} | ${fmt(p.perTurn)} | ${p.reach} |`));
lines.push('');
const reversalGroups = new Map();
reversals.forEach(rv => {
  const key = `${rv.upper.token.id}@${rv.upper.level}`;
  if (!reversalGroups.has(key)) reversalGroups.set(key, { upper: rv.upper, lowers: [] });
  reversalGroups.get(key).lowers.push(rv.lower);
});
lines.push(`## 上位互換の逆転（${reversalGroups.size} 件 / 組み合わせ ${reversals.length}）`, '');
lines.push('同じLvで、レアの低い札が全ての組で同等以上になっている（＝その札の上位互換が低レアにある）。解消は高レア側の引き上げ（§2.4）。', '');
lines.push('- 代償のある札（誓約・禁忌・背水など）は、代償のある札同士でだけ比べる。代償をスキルで回避できるか（例: 誓約の対立色を静寂スキルで消さない）はこの指標では測れない。');
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
