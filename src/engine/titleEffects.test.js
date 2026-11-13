import { describe, it, expect } from 'vitest';
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { PREFIX_TITLES, SUFFIX_TITLES, EVOLVED_TITLES } from '../constants/titles.js';
import { calcTurnResult, createNoopFx } from './comboCalculator.js';
import { applyTitleTokenBoosts } from './titleEffects.js';

const byId = Object.fromEntries(ALL_TOKEN_BASES.map(t => [t.id, t]));
const ALL_TITLES = Object.fromEntries([...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].map(t => [t.id, t]));
const eff = (id) => ({ id, name: ALL_TITLES[id].name, ...ALL_TITLES[id].effect });
const tok = (id, level = 1, i = 0) => ({ ...byId[id], level, instanceId: `${id}_${i}` });

const run = (titleEffects, extra = {}) => calcTurnResult({
  turnCombo: 7,
  colorComboCounts: { fire: 2, water: 2, wood: 1, light: 1, heart: 1 },
  erasedColorCounts: { fire: 6, water: 6, wood: 3, light: 3, heart: 3 },
  finalErasedColorCounts: { fire: 6, water: 6, wood: 3, light: 3, heart: 3 },
  shapes: [], detailedShapes: [],
  tokens: [], activeBuffs: [], currentRunStats: {},
  settings: { comboAnimationMode: 'instant' },
  stars: 10, turn: 2, maxTurns: 3, rng: () => 0,
  titleEffects,
  ...extra,
}, createNoopFx());

describe('二つ名のコンボ効果', () => {
  it('覇王: 倍率 +2.0', () => {
    expect(run([eff('s_king')]).effectiveCombo).toBe(7 * 3);
  });
  it('紅蓮の: 炎1コンボにつき倍率 +1.5', () => {
    expect(run([eff('p_fire')]).addedMultiplier).toBe(3);
  });
  it('消滅者の: 基礎 ×1.5（内訳に名前で出る）', () => {
    const r = run([eff('p_destroyer')]);
    expect(r.finalBaseCombo).toBe(Math.floor(7 * 1.5));
    expect(r.steps.some(s => s.label === '『消滅者の』' && s.type === 'mult')).toBe(true);
  });
  it('先制の: 各サイクルの1手目だけ ×2', () => {
    expect(run([eff('p_first')], { turn: 1 }).finalBaseCombo).toBe(14);
    expect(run([eff('p_first')], { turn: 2 }).finalBaseCombo).toBe(7);
  });
  it('一筆の: 30マスで +20、以降10マスごとに +10', () => {
    expect(run([eff('p_stroke')], { extraStats: { moveDistance: 29 } }).bonus).toBe(0);
    expect(run([eff('p_stroke')], { extraStats: { moveDistance: 52 } }).bonus).toBe(40);
  });
  it('加算の極意があると、二つ名の基礎倍・倍率プラスは無効、加算は増幅される（D5）', () => {
    const r = run([eff('s_king'), eff('p_destroyer'), eff('p_heart')], { tokens: [tok('additive_mastery', 1)] });
    expect(r.finalComboMultiplier).toBe(1);
    expect(r.bonus).toBe(10 * 5); // 慈愛の: ハート1コンボ +10 → 極意 ×5
  });
  it('増幅の: 倍率プラス系の札は（v−1）を1.3倍、閾値系は閾値を小さく', () => {
    const [ren, greed] = applyTitleTokenBoosts([tok('bonus_1c_fire', 1), tok('greed_power', 1)], [eff('p_amp')]);
    expect(ren.values[0]).toBeCloseTo(1 + (2 - 1) * 1.3);
    expect(greed.values[0]).toBeCloseTo(7 / 1.3);
  });
});
