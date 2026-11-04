import { describe, it, expect } from 'vitest';
import { calcBaseCombo, calcComboMultiplier, applyComboMultiplier, INUGAMI_THRESHOLD } from './comboFormula.js';

describe('calcBaseCombo: 基礎コンボ = 盤面のコンボ + コンボ加算', () => {
  it('盤面のコンボと加算を足す', () => {
    expect(calcBaseCombo(12, 3)).toBe(15);
  });

  it('盤面のコンボが 0 なら加算があっても 0', () => {
    expect(calcBaseCombo(0, 10)).toBe(0);
  });

  it('×N 系の倍率は基礎コンボに含まれない（犬神の判定は盤面+加算で行う）', () => {
    // 旧仕様では 30 × 基礎4倍 = 120 で犬神が発動していたケース
    expect(calcBaseCombo(25, 5)).toBe(30);
    expect(calcBaseCombo(25, 5) >= INUGAMI_THRESHOLD).toBe(false);
    expect(calcBaseCombo(90, 10) >= INUGAMI_THRESHOLD).toBe(true);
  });
});

describe('calcComboMultiplier: (1 + 加算) × 乗算 × 旧基礎側 × 減少系', () => {
  it('すべての倍率を掛け合わせる', () => {
    expect(calcComboMultiplier({ addedMultiplier: 2, multMultiplier: 2, movedMultiplier: 3, penaltyMultiplier: 0.5 })).toBe(9);
  });

  it('指定がなければ 1 倍', () => {
    expect(calcComboMultiplier()).toBe(1);
  });
});

describe('applyComboMultiplier: 最終コンボ', () => {
  it('旧仕様（基礎側で掛けていた）と端数がなければ同じ結果になる', () => {
    // 旧: floor(15 × 基礎3) × (1+2) × 2 = 270
    const mult = calcComboMultiplier({ addedMultiplier: 2, multMultiplier: 2, movedMultiplier: 3 });
    expect(applyComboMultiplier(15, mult)).toBe(270);
  });

  it('切り捨ては最後に1回だけ（旧仕様の途中切り捨てより小さくならない）', () => {
    // 旧: floor(7 × 1.95) = 13 → floor(13 × 1.5) = 19
    // 新: floor(7 × 1.95 × 1.5) = 20
    const mult = calcComboMultiplier({ addedMultiplier: 0.5, movedMultiplier: 1.5 * 1.3 });
    expect(applyComboMultiplier(7, mult)).toBe(20);
  });

  it('浮動小数点の誤差で 1 コンボ落ちない', () => {
    // 10 × (0.7 × 3) = 20.999999999999996 になるが、21 として扱う
    expect(applyComboMultiplier(10, 0.7 * 3)).toBe(21);
  });

  it('上限で頭打ちになる', () => {
    expect(applyComboMultiplier(100, 1e9, { maxCombo: 12345 })).toBe(12345);
  });

  it('基礎コンボが 0 なら 0', () => {
    expect(applyComboMultiplier(0, 100)).toBe(0);
  });

  it('減少系（半減の呪いなど）もコンボ倍率側に掛かる', () => {
    const mult = calcComboMultiplier({ addedMultiplier: 1, movedMultiplier: 1.5, penaltyMultiplier: 0.5 });
    expect(applyComboMultiplier(9, mult)).toBe(13); // 9 × 2 × 1.5 × 0.5 = 13.5
  });
});
