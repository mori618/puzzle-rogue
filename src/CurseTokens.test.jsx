import { describe, it, expect } from 'vitest';
import { ALL_TOKEN_BASES } from './constants/tokens.js';

describe('新規追加された呪いトークンの検証', () => {
  const newCurseIds = [
    'curse_roulette',
    'curse_decay',
    'curse_greed',
    'curse_fake_seller',
    'curse_level_fail_fire',
    'curse_level_fail_light'
  ];

  it('新規追加された呪いトークンがすべてALL_TOKEN_BASESに含まれていること', () => {
    newCurseIds.forEach(id => {
      const token = ALL_TOKEN_BASES.find(t => t.id === id);
      expect(token).toBeDefined();
      expect(token.type).toBe('curse');
      expect(token.isLocked).toBe(true);
    });
  });

  it('死神のルーレット（curse_roulette）が正しい解除条件と効果を持っていること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'curse_roulette');
    expect(t.condition).toBe('token_slot_expansion');
    expect(t.targetValue).toBe(2);
    expect(t.desc).toContain('30%の確率');
  });

  it('侵食する影（curse_decay）が正しい解除条件と効果を持っていること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'curse_decay');
    expect(t.condition).toBe('level3_tokens_count');
    expect(t.targetValue).toBe(4);
    expect(t.desc).toContain('25%の確率');
  });

  it('強欲の呼び声（curse_greed）が正しい解除条件と効果を持っていること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'curse_greed');
    expect(t.condition).toBe('shop_purchases');
    expect(t.targetValue).toBe(10);
    expect(t.desc).toContain('1.5倍');
  });

  it('贋作の売り手（curse_fake_seller）が正しい解除条件と効果を持っていること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'curse_fake_seller');
    expect(t.condition).toBe('rerolls_performed');
    expect(t.targetValue).toBe(10);
    expect(t.desc).toContain('2つ必ず陳列');
  });

  it('焦熱の試練（curse_level_fail_fire）が正しい属性と解除条件を持っていること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'curse_level_fail_fire');
    expect(t.condition).toBe('fire_erase_count');
    expect(t.targetValue).toBe(200);
    expect(t.attributes).toContain('fire');
    expect(t.desc).toContain('50％の確率で失敗');
  });

  it('閃光の試練（curse_level_fail_light）が正しい属性と解除条件を持っていること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'curse_level_fail_light');
    expect(t.condition).toBe('light_erase_count');
    expect(t.targetValue).toBe(200);
    expect(t.attributes).toContain('light');
    expect(t.desc).toContain('50％の確率で失敗');
  });
});
