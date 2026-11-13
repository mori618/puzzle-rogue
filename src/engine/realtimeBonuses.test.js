import { describe, it, expect } from 'vitest';
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { buildRealtimeBonuses, calcGroupAddition } from './realtimeBonuses.js';

const byId = Object.fromEntries(ALL_TOKEN_BASES.map(t => [t.id, t]));
const tok = (id, level = 1) => ({ ...byId[id], level, instanceId: `${id}_0` });
const rbOf = (tokens, extra = {}) => buildRealtimeBonuses({ effectiveTokens: tokens, ...extra });

describe('calcGroupAddition', () => {
  it('トークンなしの3個消しは +1', () => {
    expect(calcGroupAddition(rbOf([]), { type: 'fire' }).addition).toBe(1);
  });

  it('形の基本ボーナス（L字+1・十字+2・横列+2・5個+1）', () => {
    const rb = rbOf([]);
    expect(calcGroupAddition(rb, { shape: 'l_shape', type: 'fire' }).addition).toBe(2);
    expect(calcGroupAddition(rb, { shape: 'cross', type: 'fire' }).addition).toBe(3);
    expect(calcGroupAddition(rb, { shape: 'row', type: 'fire' }).addition).toBe(3);
    expect(calcGroupAddition(rb, { shape: 'len5', type: 'fire' }).addition).toBe(2);
  });

  it('四連の術は4個消しにだけ加算し、発動イベントを返す', () => {
    const rb = rbOf([tok('len4', 2)]);
    const r = calcGroupAddition(rb, { shape: 'len4', type: 'fire' });
    expect(r.addition).toBe(1 + byId.len4.values[1]);
    expect(r.events).toContainEqual({ kind: 'trigger', id: 'len4_0' });
    expect(calcGroupAddition(rb, { type: 'fire' }).addition).toBe(1);
  });

  it('脈動は通常加算とは別の tokenBonuses として返す', () => {
    const rb = rbOf([tok('cc_add_fire', 3)]);
    const r = calcGroupAddition(rb, { type: 'fire' });
    expect(r.addition).toBe(1);
    expect(r.tokenBonuses).toEqual([{ amount: byId.cc_add_fire.values[2], info: { name: '炎の脈動', id: 'cc_add_fire_0' } }]);
    expect(calcGroupAddition(rb, { type: 'water' }).tokenBonuses).toEqual([]);
  });

  it('加算の極意は形ボーナス込みの加算に掛かる（脈動には掛からない）', () => {
    const rb = rbOf([tok('cc_add_fire', 1)], { hasMastery: true, masteryMultiplier: 5 });
    const r = calcGroupAddition(rb, { shape: 'cross', type: 'fire' });
    expect(r.addition).toBe(3 * 5);
    expect(r.tokenBonuses[0].amount).toBe(byId.cc_add_fire.values[0]);
  });

  it('ピュアモードでは形・トークンの加算をしない', () => {
    const rb = rbOf([tok('len4', 3)]);
    expect(calcGroupAddition(rb, { shape: 'len4', type: 'fire' }, { pureMode: true }).addition).toBe(1);
  });

  it('強化ドロップは1個につき +1、過剰結合の倍率を更新する', () => {
    const rb = { ...rbOf([]), overLink: { count: 2, value: 3 }, tokenIds: { ...rbOf([]).tokenIds, overLink: ['x'] } };
    const r = calcGroupAddition(rb, { type: 'fire', enhancedCount: 2 }, { overLinkMultiplier: 1 });
    expect(r.addition).toBe(3);
    expect(r.overLinkMultiplier).toBe(3);
    expect(r.events).toContainEqual({ kind: 'trigger', id: 'x' });
  });
});
