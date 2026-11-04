import { describe, it, expect } from 'vitest';
import { getComboStarUnits } from './starEconomy.js';

const S = { refTarget: 100, capRatio: 5 };

describe('getComboStarUnits', () => {
  it('序盤（目標が refTarget 以下）はコンボ数そのまま', () => {
    expect(getComboStarUnits(12, 8, S)).toBe(12);
    expect(getComboStarUnits(57, 56, S)).toBe(57);
    expect(getComboStarUnits(100, 100, S)).toBe(100);
  });
  it('序盤の上限は capRatio × refTarget（実質無制限）', () => {
    expect(getComboStarUnits(499, 8, S)).toBe(499);
    expect(getComboStarUnits(10000, 8, S)).toBe(500);
  });
  it('目標が大きくなると目標比で換算される', () => {
    expect(getComboStarUnits(1e9, 1e9, S)).toBe(100);
    expect(getComboStarUnits(5e8, 1e9, S)).toBe(50);
    expect(getComboStarUnits(228, 228, S)).toBe(100);
  });
  it('1手番の上限は目標の capRatio 倍', () => {
    expect(getComboStarUnits(2e12, 1e9, S)).toBe(500);
  });
  it('不正値は0', () => {
    expect(getComboStarUnits(0, 100, S)).toBe(0);
    expect(getComboStarUnits(NaN, 100, S)).toBe(0);
  });
});
