// ショップに並ぶトークンの価格計算
import { TOKEN_PRICE_BY_RARITY } from '../constants/gameConstants.js';

const isCurse = (t) => t?.type === 'curse' || t?.isCurse === true;

/** 所持トークンのうち、指定した★のもの（呪いを除く）の数 */
export const countOwnedByRarity = (tokens = [], rarity = 1) =>
  tokens.filter(t => t && !isCurse(t) && (t.rarity || 1) === rarity).length;

/** ★ごとの価格倍率 = 1 + perOwned[★] × 同じ★の所持数 */
export const getRarityPriceMultiplier = (rarity = 1, tokens = []) => {
  const perOwned = TOKEN_PRICE_BY_RARITY.perOwned[rarity] ?? 0;
  return 1 + perOwned * countOwnedByRarity(tokens, rarity);
};

/** 所持状況に応じたトークンの価格（セール・呪い・二つ名の補正をかける前） */
export const getTokenDynamicPrice = (baseToken, tokens = []) => {
  const rarity = baseToken?.rarity || 1;
  const price = Math.floor((baseToken?.price || 0) * getRarityPriceMultiplier(rarity, tokens));
  return Math.max(1, price);
};

/**
 * ショップ商品にかかる補正（セール半額 → 強欲の呼び声 ×1.5 → 二つ名の割引）を適用する。
 * ショップ生成時と、所持トークンが変わって価格を付け直すときで同じ順番にするための関数。
 */
export const applyShopPriceMods = (price, mods = {}) => {
  let p = price;
  if (mods.sale) p = Math.floor(p / 2);
  if (mods.greed && p > 0) p = Math.floor(p * 1.5);
  if (mods.titleMult !== undefined && mods.titleMult < 1 && p > 0) p = Math.max(1, Math.floor(p * mods.titleMult));
  return p;
};

/**
 * 所持トークンが変わったときに、並んでいるトークン商品の価格を付け直す。
 * 生成時に priceBase / priceMods を記録した商品だけが対象（古いセーブの商品はそのまま）。
 * 変化がなければ同じ配列を返す。
 */
export const repriceShopItems = (items = [], tokens = []) => {
  let changed = false;
  const next = items.map(item => {
    if (!item || item.priceBase === undefined) return item;
    const dynamic = getTokenDynamicPrice({ price: item.priceBase, rarity: item.rarity }, tokens);
    const price = applyShopPriceMods(dynamic, item.priceMods);
    const originalPrice = item.isSale ? applyShopPriceMods(dynamic, { ...item.priceMods, sale: false }) : item.originalPrice;
    if (price === item.price && originalPrice === item.originalPrice) return item;
    changed = true;
    return { ...item, price, originalPrice };
  });
  return changed ? next : items;
};
