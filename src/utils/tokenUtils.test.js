import { describe, it, expect, beforeEach } from 'vitest';
import { isProbabilityToken, applyNewTokenLevel, isNewTokenLevelTarget, isTokenRequirementMet, getTokenDescription, getTokenDynamicInfo } from './tokenUtils.js';
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

describe('説明文・現在値が実際の計算と一致する', () => {
  it('過剰結合: 説明文は実際に足す値（values − 1）を表示する', () => {
    expect(getTokenDescription({ id: 'over_link' }, 1)).toContain('プラス1。');
    expect(getTokenDescription({ id: 'over_link' }, 3)).toContain('プラス4。');
  });

  it('三魂の極致: 現在値は「Lv3トークン数 × 値 − 1」', () => {
    const tokens = [{ id: 'a', level: 3 }, { id: 'b', level: 3 }, { id: 'c', level: 1 }];
    const info = getTokenDynamicInfo({ id: 'level3_count_mult', level: 1 }, 1, {}, tokens);
    expect(info.find(i => i.label === '加算値')?.value).toBe('+3');
  });

  it('厄災の祈り: 現在値は「値^呪いの数 − 1」', () => {
    const tokens = [{ id: 'x', type: 'curse' }, { id: 'y', type: 'curse' }];
    const info = getTokenDynamicInfo({ id: 'curse_count_mult', level: 1 }, 1, {}, tokens);
    expect(info.find(i => i.label === '加算値')?.value).toBe('+3');
  });
});
