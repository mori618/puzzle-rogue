import { describe, it, expect } from 'vitest';
import { countOwnedByRarity, getRarityPriceMultiplier, getTokenDynamicPrice, applyShopPriceMods, repriceShopItems } from './tokenPricing.js';

const tok = (rarity, extra = {}) => ({ id: `t${rarity}_${Math.random()}`, rarity, type: 'passive', ...extra });

describe('★ごとの価格上昇', () => {
  it('呪いは数えない・同じ★だけ数える', () => {
    const tokens = [tok(3), tok(3), tok(1), tok(3, { isCurse: true }), tok(3, { type: 'curse' }), null];
    expect(countOwnedByRarity(tokens, 3)).toBe(2);
    expect(countOwnedByRarity(tokens, 1)).toBe(1);
  });

  it('★3は1個ごとに大きく上がる（31 → 46 → 62 → 77）', () => {
    const base = { price: 31, rarity: 3 };
    expect(getTokenDynamicPrice(base, [])).toBe(31);
    expect(getTokenDynamicPrice(base, [tok(3)])).toBe(46);
    expect(getTokenDynamicPrice(base, [tok(3), tok(3)])).toBe(62);
    expect(getTokenDynamicPrice(base, [tok(3), tok(3), tok(3)])).toBe(77);
  });

  it('★2はそこそこ上がる（20 → 23 → 26）', () => {
    const base = { price: 20, rarity: 2 };
    expect(getTokenDynamicPrice(base, [tok(2)])).toBe(23);
    expect(getTokenDynamicPrice(base, [tok(2), tok(2)])).toBe(26);
  });

  it('★1はほとんど上がらない', () => {
    const base = { price: 15, rarity: 1 };
    expect(getTokenDynamicPrice(base, [tok(1)])).toBe(15);
    expect(getTokenDynamicPrice(base, [tok(1), tok(1), tok(1), tok(1)])).toBe(18);
  });

  it('他の★の所持数は影響しない', () => {
    expect(getRarityPriceMultiplier(3, [tok(1), tok(1), tok(2), tok(2)])).toBe(1);
  });

  it('rarity 未指定は★1扱い', () => {
    expect(getTokenDynamicPrice({ price: 10 }, [tok(1), tok(1), tok(1), tok(1)])).toBe(12);
  });
});

describe('ショップ補正', () => {
  it('セール → 強欲 → 二つ名割引の順にかける', () => {
    expect(applyShopPriceMods(31, {})).toBe(31);
    expect(applyShopPriceMods(31, { sale: true })).toBe(15);
    expect(applyShopPriceMods(31, { sale: true, greed: true })).toBe(22);
    expect(applyShopPriceMods(31, { greed: true, titleMult: 0.8 })).toBe(36);
  });
});

describe('所持トークンが変わったときの価格の付け直し', () => {
  const shop = () => ([
    { id: 'a', rarity: 3, price: 31, priceBase: 31, priceMods: {} },
    { id: 'b', rarity: 3, price: 15, originalPrice: 31, isSale: true, priceBase: 31, priceMods: { sale: true } },
    { id: 'c', rarity: 1, price: 15, priceBase: 15, priceMods: {} },
    { id: 'old', rarity: 3, price: 31 }, // 古いセーブの商品（priceBase なし）
  ]);

  it('★3を1個買うと残りの★3が値上がりする', () => {
    const next = repriceShopItems(shop(), [tok(3)]);
    expect(next[0].price).toBe(46);
    expect(next[1].price).toBe(23);
    expect(next[1].originalPrice).toBe(46);
    expect(next[2].price).toBe(15);
    expect(next[3].price).toBe(31);
  });

  it('変化がなければ同じ配列を返す', () => {
    const items = shop();
    expect(repriceShopItems(items, [])).toBe(items);
  });
});
