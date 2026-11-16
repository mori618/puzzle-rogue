import { describe, it, expect } from 'vitest';
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { calcTurnResult, createRecordingFx, createNoopFx, buildSteps } from './comboCalculator.js';

// 盤面パターン（代表的な組み方）
const PATTERNS = {
  // 素7コンボ・各色ばらばら
  spread: {
    turnCombo: 7,
    colorComboCounts: { fire: 2, water: 1, wood: 1, light: 1, dark: 1, heart: 1 },
    erasedColorCounts: { fire: 6, water: 3, wood: 3, light: 3, dark: 3, heart: 3 },
    shapes: [],
    detailedShapes: [
      { color: 'fire', length: 3 }, { color: 'fire', length: 3 }, { color: 'water', length: 3 },
      { color: 'wood', length: 3 }, { color: 'light', length: 3 }, { color: 'dark', length: 3 },
      { color: 'heart', length: 3 },
    ],
  },
  // 炎寄せ（炎5コンボ・炎18個・6個連結あり）
  monoFire: {
    turnCombo: 6,
    colorComboCounts: { fire: 5, heart: 1 },
    erasedColorCounts: { fire: 18, heart: 3 },
    shapes: ['len4'],
    detailedShapes: [
      { color: 'fire', length: 6 }, { color: 'fire', length: 3 }, { color: 'fire', length: 3 },
      { color: 'fire', length: 3 }, { color: 'fire', length: 4 }, { color: 'heart', length: 3 },
    ],
  },
  // 形消し（列・十字・L字・正方形・4個・5個）
  shapes: {
    turnCombo: 6,
    colorComboCounts: { fire: 1, water: 1, wood: 1, light: 1, dark: 1, heart: 1 },
    erasedColorCounts: { fire: 5, water: 5, wood: 5, light: 9, dark: 4, heart: 5 },
    shapes: ['row', 'cross', 'l_shape', 'square', 'len4', 'column'],
    detailedShapes: [
      { color: 'fire', length: 5 }, { color: 'water', length: 5 }, { color: 'wood', length: 5 },
      { color: 'light', length: 9 }, { color: 'dark', length: 4 }, { color: 'heart', length: 5 },
    ],
  },
};

const RUN_STATE = {
  activeBuffs: [],
  currentRunStats: {
    totalHeartsErased: 120,
    currentTotalCombo: 450,
    currentShapeRow: 3,
    currentShapeCross: 2,
    currentShapeLShape: 2,
    currentShapeSquare: 1,
    currentShapeLen: 4,
    currentShopRerolls: 6,
    currentStarsSpent: 40,
    currentCursesRemoved: 1,
    skipsPerformed: 1,
    maxBaseCombo: 30,
    maxComboMultiplier: 4,
  },
  hasSaintToken: false,
  isBeyondMode: false,
  maxTurns: 3,
  settings: { comboAnimationMode: 'instant' },
  skippedTurnsBonus: 0,
  stars: 20,
  tokenSlotExpansionCount: 2,
  turn: 2,
  probabilityTriggeredThisTurn: false,
  probabilityTriggeredTotalCount: 0,
  rng: () => 0, // 確率系はすべて成功側に固定
};

const makeToken = (base, level, index = 0) => ({ ...base, level, instanceId: `${base.id}_${index}` });

const run = (tokens, pattern, extra = {}) => {
  const p = PATTERNS[pattern];
  return calcTurnResult({
    ...RUN_STATE,
    ...p,
    finalErasedColorCounts: { ...p.erasedColorCounts },
    tokens,
    ...extra,
  }, createNoopFx());
};

const summarize = (r) => ({
  tc: r.tc,
  bonus: r.bonus,
  finalBaseCombo: r.finalBaseCombo,
  addedMultiplier: Math.round(r.addedMultiplier * 1e6) / 1e6,
  finalComboMultiplier: Math.round(r.finalComboMultiplier * 1e6) / 1e6,
  effectiveCombo: r.effectiveCombo,
});

describe('calcTurnResult', () => {
  it('トークンなしなら素コンボがそのまま出る', () => {
    const r = run([], 'spread');
    expect(r.effectiveCombo).toBe(7);
    expect(r.finalComboMultiplier).toBe(1);
    expect(r.steps).toEqual([]);
  });

  it('全消しは倍率 +1.0', () => {
    const r = run([], 'spread', { isAllClear: true });
    expect(r.addedMultiplier).toBe(1);
    expect(r.effectiveCombo).toBe(14);
  });

  it('steps は加算→倍率の順に logData をまとめる', () => {
    const r = run([], 'spread', { isAllClear: true });
    expect(r.steps).toEqual(buildSteps(r.logData));
    expect(r.steps[0]).toMatchObject({ kind: 'multiplier', label: '全消しボーナス' });
  });

  it('fx 経由で state 更新を呼ぶ（直接副作用を起こさない）', () => {
    const fx = createRecordingFx();
    const p = PATTERNS.spread;
    calcTurnResult({ ...RUN_STATE, ...p, finalErasedColorCounts: { ...p.erasedColorCounts }, tokens: [] }, fx);
    const names = fx.calls.map(c => c.name);
    expect(names).toContain('setLastTurnCombo');
    expect(names).toContain('setLastErasedColorCounts');
  });

  // 全トークン × Lv1〜3 × 3パターンの結果を固定する。
  // 以降の段階（層の統合・数値調整）で意図しない変化が出たら、ここで検出する。
  it('全トークン単体のスナップショット', () => {
    const table = {};
    ALL_TOKEN_BASES.forEach(base => {
      [1, 2, 3].forEach(lv => {
        const row = {};
        Object.keys(PATTERNS).forEach(pattern => {
          try {
            row[pattern] = run([makeToken(base, lv)], pattern).effectiveCombo;
          } catch (e) {
            row[pattern] = `ERROR: ${e.message}`;
          }
        });
        table[`${base.id}@Lv${lv}`] = row;
      });
    });
    expect(table).toMatchSnapshot();
  });

  it('代表ビルドのスナップショット', () => {
    const byId = Object.fromEntries(ALL_TOKEN_BASES.map(t => [t.id, t]));
    const builds = {
      sigma: ['bonus_1c_fire', 'bonus_2c_fd', 'power_up'],
      mult: ['combo2_mult_fire', 'connect6_mult_fire', 'forbidden'],
    };
    const result = {};
    Object.entries(builds).forEach(([name, ids]) => {
      const tokens = ids.filter(id => byId[id]).map((id, i) => makeToken(byId[id], 3, i));
      Object.keys(PATTERNS).forEach(pattern => {
        const r = run(tokens, pattern);
        result[`${name}/${pattern}`] = {
          ...summarize(r),
          steps: r.steps.map(s => ({ kind: s.kind, label: s.label, value: s.value, type: s.type })),
        };
      });
    });
    expect(result).toMatchSnapshot();
  });
});
