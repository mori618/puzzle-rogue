/**
 * バランス検証用の手番ランナー（balance-sim.mjs / gen-token-layers.mjs 共用）。
 * パターンの groups から連鎖中の加算込みの素コンボを作り、calcTurnResult を回す。
 */
import { ALL_TOKEN_BASES } from '../../src/constants/tokens.js';
import { calcTurnResult, createNoopFx } from '../../src/engine/comboCalculator.js';
import { buildRealtimeBonuses, calcGroupAddition } from '../../src/engine/realtimeBonuses.js';

export const byId = Object.fromEntries(ALL_TOKEN_BASES.map(t => [t.id, t]));

export const clone = (o) => JSON.parse(JSON.stringify(o));
// 評価中のトークン自身が発動したかを記録する（他の札との数の相乗効果だけで上がった場合と区別するため）
const fired = new Set();
const fx = createNoopFx();
fx.triggerPassive = (id) => { fired.add(id); };

// 再現できる乱数（mulberry32）
export const seeded = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const makeToken = (id, level, index) => {
  const base = byId[id];
  if (!base) throw new Error(`unknown token id: ${id}`);
  return { ...base, level: base.rarity === 4 ? 1 : level, instanceId: `${id}_${index}` };
};

/**
 * パターンの groups から手番の入力を作る。素コンボ（turnCombo）は、連鎖中の加算
 * （型・脈動・落ちコン・強化ドロップ・加算の極意）を含めた値にする。
 * 近似: 模倣・先導・試練によるトークン複製、ボム爆発分の加算は連鎖中の加算に反映しない。
 */
export const buildTurnInput = (pattern, tokens, runState) => {
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
export const runOnce = (tokens, pattern, runState, rng) => {
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
export const COLOR_ORDER = ['fire', 'dark', 'water', 'wood', 'light', 'heart'];
export const tokenColors = (t) => {
  const p = t.params || {};
  const list = [p.color, ...(p.colors || []), p.attribute, p.from, p.to].filter(c => COLOR_ORDER.includes(c));
  if (list.length === 0 && t.attributes?.length === 1 && COLOR_ORDER.includes(t.attributes[0])) list.push(t.attributes[0]);
  return [...new Set(list)];
};
export const normalizeColors = (t) => {
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
  // 効果名に色が入っている札（devotion_water など）も同じ対応で置き換える
  const effect = typeof t.effect === 'string'
    ? t.effect.replace(/_(fire|water|wood|light|dark|heart)$/, (_, c) => `_${map[c]}`)
    : t.effect;
  return { ...t, effect, params: swap(t.params), attributes: swap(t.attributes) };
};


/** 手番の steps を返す版（層の判定用）。 */
export const runSteps = (tokens, pattern, runState, rng = () => 0) => {
  fired.clear();
  const rs = clone(runState);
  const turn = buildTurnInput(pattern, tokens, rs);
  const realtimeFired = new Set(fired);
  const result = calcTurnResult({
    activeBuffs: [], hasSaintToken: false, isBeyondMode: false,
    settings: { comboAnimationMode: 'instant' }, skippedTurnsBonus: 0,
    ...rs, ...turn, finalErasedColorCounts: { ...turn.erasedColorCounts }, tokens, rng,
  }, fx);
  return { result, realtimeFired };
};
