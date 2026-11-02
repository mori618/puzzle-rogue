import { describe, it, expect, beforeEach } from 'vitest';
import { isProbabilityToken, applyNewTokenLevel, isNewTokenLevelTarget, isTokenRequirementMet } from './tokenUtils.js';
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { saveTitleState, resetTitleCache } from './titleManager.js';

describe('applyNewTokenLevel（二つ名「先達の」）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  const base = { id: 'x', type: 'passive', name: 'テスト', values: [1, 2, 3], level: 1 };

  it('初期レベル 2 を適用する', () => {
    const t = applyNewTokenLevel(base, { level: 2 });
    expect(t.level).toBe(2);
    expect(t).not.toBe(base);
  });

  it('初期レベル 1（二つ名なし）なら変えない', () => {
    expect(applyNewTokenLevel(base, { level: 1 })).toBe(base);
  });

  it('装備中の二つ名から初期レベルを読む', () => {
    expect(applyNewTokenLevel(base).level).toBe(1);
    saveTitleState({
      unlockedTitles: { prefixes: ['A20'], suffixes: [], evolved: [] },
      equippedTitle: { prefixId: 'A20', suffixId: null },
      progress: {},
    });
    expect(applyNewTokenLevel(base).level).toBe(2);
  });

  it('呪い・noLevelUp・copy_left・ダミートークンは対象外', () => {
    const excluded = [
      { ...base, type: 'curse' },
      { ...base, isCurse: true, type: 'skill' },
      { ...base, noLevelUp: true },
      { ...base, effect: 'copy_left' },
      { ...base, parentId: 123 },
    ];
    excluded.forEach(t => {
      expect(isNewTokenLevelTarget(t)).toBe(false);
      expect(applyNewTokenLevel(t, { level: 2 }).level).toBe(1);
    });
  });

  it('最大レベルを超えない', () => {
    expect(applyNewTokenLevel({ ...base, values: [5] }, { level: 2 }).level).toBe(1);
    expect(applyNewTokenLevel({ ...base, level: 3 }, { level: 2 }).level).toBe(3);
  });
});

describe('isTokenRequirementMet', () => {
  it('requires 未指定なら常に true', () => {
    expect(isTokenRequirementMet({ id: 'x' }, [])).toBe(true);
  });
  it('前提トークン未所持なら false、所持なら true', () => {
    const dependent = ALL_TOKEN_BASES.find(t => t.id === 'move_drop_boost');
    expect(dependent.requires).toBe('move_drop');
    expect(isTokenRequirementMet(dependent, [null, { id: 'other' }])).toBe(false);
    expect(isTokenRequirementMet(dependent, [{ id: 'move_drop', effect: 'move_drop' }])).toBe(true);
  });
  it('ムーブドロップ関連トークンはすべて move_drop を前提にする', () => {
    ['move_drop_add_active', 'move_drop_boost', 'move_drop_lucky', 'move_repeater', 'cross_multiply_move_drop'].forEach(id => {
      expect(ALL_TOKEN_BASES.find(t => t.id === id)?.requires).toBe('move_drop');
    });
  });
});

describe('isProbabilityToken（確率で発動するトークン）', () => {
  it('ターン終了時の生成・変換・侵食などを確率発動として判定する', () => {
    expect(isProbabilityToken({ id: 'erosion_fire' })).toBe(true);
    expect(isProbabilityToken({ id: 'x', effect: 'turn_end_convert' })).toBe(true);
    expect(isProbabilityToken({ id: 'x', effect: 'turn_end_star_gamble' })).toBe(true);
    expect(isProbabilityToken({ id: 'x', effect: 'time' })).toBe(false);
    expect(isProbabilityToken(null)).toBe(false);
  });

  it('実際のトークン定義にも該当するものがある', () => {
    expect(ALL_TOKEN_BASES.filter(isProbabilityToken).length).toBeGreaterThanOrEqual(4);
  });
});
