import { describe, it, expect } from 'vitest';
import { getMoveTimeRhythmEffect } from './moveTimeRhythm.js';
import { ALL_TOKEN_BASES } from '../constants/tokens.js';

describe('緩急の心得（操作時間で効果が変わる）', () => {
  it('トークンが定義されている', () => {
    const base = ALL_TOKEN_BASES.find(t => t.id === 'tempo_rhythm');
    expect(base).toBeTruthy();
    expect(base.type).toBe('passive');
    expect(base.effect).toBe('move_time_rhythm');
  });

  it('2秒以下ならエネルギーを1チャージ', () => {
    expect(getMoveTimeRhythmEffect(500, 3)).toEqual({ kind: 'charge', charge: 1 });
    expect(getMoveTimeRhythmEffect(2000, 3)).toEqual({ kind: 'charge', charge: 1 });
  });

  it('2秒超〜4秒未満は何も起きない', () => {
    expect(getMoveTimeRhythmEffect(2001, 3)).toEqual({ kind: 'none' });
    expect(getMoveTimeRhythmEffect(3999, 3)).toEqual({ kind: 'none' });
  });

  it('4秒以上10秒以下ならレベル値ぶんコンボ加算', () => {
    expect(getMoveTimeRhythmEffect(4000, 3)).toEqual({ kind: 'combo', bonus: 3 });
    expect(getMoveTimeRhythmEffect(10000, 8)).toEqual({ kind: 'combo', bonus: 8 });
  });

  it('10秒を超えたら操作秒数（小数第1位切り捨て）をコンボ倍率に加算', () => {
    expect(getMoveTimeRhythmEffect(10001, 3)).toEqual({ kind: 'multiplier', addMultiplier: 10 });
    expect(getMoveTimeRhythmEffect(15678, 3)).toEqual({ kind: 'multiplier', addMultiplier: 15.6 });
  });

  it('操作していなければ何も起きない', () => {
    expect(getMoveTimeRhythmEffect(0, 3)).toEqual({ kind: 'none' });
    expect(getMoveTimeRhythmEffect(undefined, 3)).toEqual({ kind: 'none' });
  });
});
