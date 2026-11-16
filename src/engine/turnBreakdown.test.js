import { describe, it, expect } from 'vitest';
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { calcTurnResult, createNoopFx } from './comboCalculator.js';
import { buildTurnBreakdown, explainNotFired } from './turnBreakdown.js';

const byId = Object.fromEntries(ALL_TOKEN_BASES.map(t => [t.id, t]));
const tok = (id, level = 1, i = 0) => ({ ...byId[id], level, instanceId: `${id}_${i}` });

const TURN = {
  turnCombo: 7,
  colorComboCounts: { fire: 2, water: 2, wood: 1, light: 1, dark: 1 },
  erasedColorCounts: { fire: 9, water: 6, wood: 3, light: 3, dark: 3 },
  shapes: [],
  detailedShapes: [
    { color: 'fire', length: 3 }, { color: 'fire', length: 6 }, { color: 'water', length: 3 },
    { color: 'water', length: 3 }, { color: 'wood', length: 3 }, { color: 'light', length: 3 }, { color: 'dark', length: 3 },
  ],
  hasSkyfallCombo: false,
  turn: 1,
  maxTurns: 3,
};

const calc = (tokens) => calcTurnResult({
  ...TURN,
  finalErasedColorCounts: { ...TURN.erasedColorCounts },
  tokens,
  activeBuffs: [],
  currentRunStats: {},
  settings: { comboAnimationMode: 'instant' },
  stars: 0,
  rng: () => 0,
}, createNoopFx());

describe('explainNotFired', () => {
  it('個数条件は今回の個数と不足分を出す', () => {
    expect(explainNotFired(tok('req_12_fire'), TURN)).toBe('炎を12個以上（今回9個・あと3個）');
    expect(explainNotFired(tok('req_6_fire'), TURN)).toBeNull();
  });
  it('色の同時消しは足りない色を出す', () => {
    expect(explainNotFired(tok('bonus_2c_wh'), TURN)).toBe('ハートを消していない');
  });
  it('最終手番条件は今の手番を出す', () => {
    expect(explainNotFired(tok('last_turn_burst'), TURN)).toBe('サイクルの最終手番のみ（今回1/3手目）');
  });
});

describe('buildTurnBreakdown', () => {
  it('層ごとに分け、式の値が最終結果と一致する', () => {
    const tokens = [tok('power_up', 1, 0), tok('combo2_mult_fire', 1, 1), tok('bonus_1c_fire', 1, 2), tok('req_12_fire', 1, 3)];
    const r = calc(tokens);
    const b = buildTurnBreakdown(r, TURN);
    expect(b.bonusSteps.map(s => s.label)).toContain(byId.power_up.name);
    expect(b.multSteps.map(s => s.label)).toContain(byId.combo2_mult_fire.name);
    expect(b.sigmaSteps.map(s => s.label)).toContain(byId.bonus_1c_fire.name);
    expect(b.notFired).toEqual([{ tokenId: 'req_12_fire_3', name: byId.req_12_fire.name, level: 1, reason: '炎を12個以上（今回9個・あと3個）' }]);
    const recomputed = Math.floor((b.rawCombo + b.bonus) * (1 + b.sigma) * b.multTotal + 1e-9);
    expect(recomputed).toBe(b.effectiveCombo);
  });
});
