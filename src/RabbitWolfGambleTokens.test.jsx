import { describe, it, expect } from 'vitest';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import {
  getTokenDescription,
  getTokenDynamicInfo,
  getEffectiveCost,
  countRabbitTokens,
  isRabbitToken,
  filterPoolByFreeSlots,
} from './utils/tokenUtils.js';

const findBase = (id) => ALL_TOKEN_BASES.find(t => t.id === id);

describe('ギャンブル / うさぎ / 狼 トークンの定義', () => {
  it('ギャンブル: アクティブ・消費E3', () => {
    const t = findBase('gamble');
    expect(t).toBeDefined();
    expect(t.type).toBe('skill');
    expect(t.action).toBe('gamble');
    expect(t.cost).toBe(3);
    expect(t.values).toEqual([0.2, 0.3, 0.4]);
  });

  it('うさぎ（パッシブ）: レア度1', () => {
    const t = findBase('rabbit_passive');
    expect(t).toBeDefined();
    expect(t.type).toBe('passive');
    expect(t.rarity).toBe(1);
    expect(t.effect).toBe('rabbit_count_combo_mult');
  });

  it('うさぎ（アクティブ）: レア度1・消費E2', () => {
    const t = findBase('rabbit_active');
    expect(t).toBeDefined();
    expect(t.type).toBe('skill');
    expect(t.rarity).toBe(1);
    expect(t.cost).toBe(2);
    expect(t.effectValues).toEqual([0.1, 0.15, 0.2]);
  });

  it('狼: レア度2・消費E3', () => {
    const t = findBase('wolf_active');
    expect(t).toBeDefined();
    expect(t.type).toBe('skill');
    expect(t.rarity).toBe(2);
    expect(t.cost).toBe(3);
  });

  it('レベルアップで消費Eが下がる', () => {
    const t = findBase('gamble');
    expect(getEffectiveCost({ ...t, level: 1 })).toBe(3);
    expect(getEffectiveCost({ ...t, level: 3 })).toBe(1);
  });
});

describe('説明文のレベル別置換', () => {
  it('ギャンブルのダブルアップ確率がレベルで変わり、10分の1表記は崩れない', () => {
    const t = findBase('gamble');
    const d1 = getTokenDescription({ ...t, level: 1 }, 1);
    const d3 = getTokenDescription({ ...t, level: 3 }, 3);
    expect(d1).toContain('20%');
    expect(d3).toContain('40%');
    expect(d1).toContain('10分の1');
    expect(d1).toContain('消費E:3');
  });

  it('うさぎ（アクティブ）の獲得確率とコンボ加算値がレベルで変わる', () => {
    const t = findBase('rabbit_active');
    const d2 = getTokenDescription({ ...t, level: 2 }, 2);
    expect(d2).toContain('× 5');
    expect(d2).toContain('15%');
  });

  it('図鑑表示では全レベルの値を併記する', () => {
    const t = findBase('rabbit_passive');
    expect(getTokenDescription(t)).toContain('[1/1.5/2]');
  });
});

describe('うさぎカウント', () => {
  const rabbitP = { ...findBase('rabbit_passive'), instanceId: 1 };
  const rabbitA = { ...findBase('rabbit_active'), instanceId: 2 };
  const wolf = { ...findBase('wolf_active'), instanceId: 3, eatenRabbits: 4 };

  it('パッシブ・アクティブ両方のうさぎを数え、狼や null は数えない', () => {
    expect(isRabbitToken(rabbitP)).toBe(true);
    expect(isRabbitToken(rabbitA)).toBe(true);
    expect(isRabbitToken(wolf)).toBe(false);
    expect(countRabbitTokens([rabbitP, null, rabbitA, wolf, rabbitP])).toBe(3);
  });

  it('パッシブの動的情報: うさぎ数 × 値 + 1', () => {
    const info = getTokenDynamicInfo({ ...rabbitP, level: 2 }, 2, {}, [rabbitP, rabbitA]);
    expect(info.find(i => i.label === '所持うさぎ')?.value).toBe('2 個');
    expect(info.find(i => i.label === '倍率加算値')?.value).toBe('+4'); // 2 × 1.5 + 1
  });

  it('狼の動的情報: 捕食累計 × 値', () => {
    const info = getTokenDynamicInfo({ ...wolf, level: 1 }, 1, {}, [wolf]);
    expect(info.find(i => i.label === '捕食したうさぎ')?.value).toBe('4 匹');
    expect(info.find(i => i.label === '倍率加算値')?.value).toBe('+8');
  });

  it('枠の空きに応じてうさぎの抽選候補が絞られる', () => {
    const pool = ALL_TOKEN_BASES.filter(b => isRabbitToken(b));
    expect(pool.length).toBe(2);
    // アクティブ枠のみ空き（パッシブ枠は満杯）
    const passives = Array.from({ length: 10 }, (_, i) => ({ id: 'p' + i, type: 'passive' }));
    const filtered = filterPoolByFreeSlots(pool, passives, 10);
    expect(filtered.map(b => b.id)).toEqual(['rabbit_active']);
  });
});
