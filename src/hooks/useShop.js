// ショップ関連の状態とロジックを管理するカスタムフック
import { useState, useCallback } from "react";
import { ALL_TOKEN_BASES } from "../constants/tokens.js";
import { ENCHANTMENTS, getEnchantDescription } from "../constants/enchantments.js";
import {
  TOKEN_PRICE_GROWTH_FACTOR,
  SHOP_REROLL_GROWTH_FACTOR,
  AWAKENING_TOKEN_SLOT_PRICES,
} from "../constants/gameConstants.js";
import { getTokenDescription } from "../utils/tokenUtils";
import soundManager from "../utils/SoundManager";
import { SE_IDS } from "../constants/sounds";

export const useShop = ({
  tokens,
  setTokens,
  stars,
  setStars,
  activeBuffs,
  isBeyondMode,
  totalPurchases,
  setTotalPurchases,
  setTotalStarsSpent,
  setStats,
  currentRunStats,
  setCurrentRunStats,
  notify,
  addTokenToast,
  triggerLevelUp,
  spawnParticles,
  getStatByCondition,
  setSelectedTokenDetail,
  setIsAwakeningLevelUpBought,
  isEnchantShopUnlocked,
  setIsEnchantShopUnlocked,
  setSandsOfTimeSeconds,
  hasSaintToken,
}) => {
  const [shopItems, setShopItems] = useState([]);
  const [shopRerollBasePrice, setShopRerollBasePrice] = useState(2);
  const [shopRerollPrice, setShopRerollPrice] = useState(2);
  const [pendingShopItem, setPendingShopItem] = useState(null);
  const [tokenSlotExpansionCount, setTokenSlotExpansionCount] = useState(0);

  /** トークンの動的価格を取得するヘルパー関数 */
  const getTokenDynamicPrice = useCallback((baseToken, currentTokens) => {
    let possessionCount = 0;
    if (baseToken.type === 'skill' || baseToken.type === 'curse' || baseToken.isCurse) {
      possessionCount = currentTokens.filter(t => t && (t.type === 'skill' || t.type === 'curse' || t.isCurse)).length;
    } else if (baseToken.type === 'passive') {
      possessionCount = currentTokens.filter(t => t && t.type === 'passive').length;
    }

    const dynamicPrice = Math.floor(baseToken.price * Math.pow(TOKEN_PRICE_GROWTH_FACTOR, possessionCount));
    return Math.max(1, dynamicPrice);
  }, []);

  /** ショップアイテムの生成 */
  const generateShop = useCallback((overrideCycleCount = null) => {
    const isLuxury = totalPurchases >= 6;

    let saleBonus = 0;
    let enchantGrantBonus = 0;
    let shopExpandBonus = 0;
    tokens.forEach((t) => {
      if (t?.id === "bargain") {
        const value = t.values[(t.level || 1) - 1];
        saleBonus += value;
      }
      if (t?.effect === "enchant_grant_boost") {
        const value = t.values[(t.level || 1) - 1];
        enchantGrantBonus += value;
      }
      if (t?.effect === "shop_expand") {
        const value = t.values[(t.level || 1) - 1];
        shopExpandBonus += value;
      }
    });

    const basePassiveCount = 4 + shopExpandBonus;
    const baseActiveCount = 4 + shopExpandBonus;
    const enchantCount = 3;
    const extraEnchantCount = enchantGrantBonus + (isLuxury ? 1 : 0);
    const saleCount = 1 + saleBonus;

    setIsAwakeningLevelUpBought(false);

    const attrWeights = { fire: 1, water: 1, wood: 1, light: 1, dark: 1, heart: 1, none: 1 };
    tokens.forEach(t => {
      if (t && t.effect === 'shop_attribute_weight' && t.params?.attribute) {
        const val = t.values[(t.level || 1) - 1] || 1;
        attrWeights[t.params.attribute] *= val;
      }
    });

    const getRarityProbabilities = (cycle) => {
      if (cycle <= 5) return { 1: 0.60, 2: 0.30, 3: 0.10, 4: 0.00 };
      if (cycle <= 9) return { 1: 0.40, 2: 0.40, 3: 0.20, 4: 0.00 };
      if (cycle <= 15) return { 1: 0.30, 2: 0.38, 3: 0.30, 4: 0.02 };
      return { 1: 0.20, 2: 0.30, 3: 0.40, 4: 0.10 };
    };

    const cycleCount = overrideCycleCount ?? ((currentRunStats?.currentClears || 0) + 1);
    let probs = getRarityProbabilities(cycleCount);

    let rarityUpCount = 0;
    let rarityDownCount = 0;
    tokens.forEach((t) => {
      if (!t) return;
      if (t.effect === "shop_rarity_weight") {
        rarityUpCount += (t.values[(t.level || 1) - 1] || 0);
      }
      if (t.enchantments) {
        t.enchantments.forEach((enc) => {
          if (enc.effect === "rarity_up") rarityUpCount++;
          if (enc.effect === "rarity_down_combo") rarityDownCount++;
        });
      }
    });

    const adjustProb = (base, upRate, downRate, max) =>
      Math.max(0, Math.min(max, base + upRate * rarityUpCount - downRate * rarityDownCount));

    let p4 = adjustProb(probs[4] || 0, 0.05, 0.05, 1);
    let p3 = adjustProb(probs[3] || 0, 0.10, 0.10, 1 - p4);
    let p2 = adjustProb(probs[2] || 0, 0.10, 0.10, 1 - p3 - p4);
    let p1 = Math.max(0, 1 - p2 - p3 - p4);

    const hasCeleb = tokens.some(t => t?.effect === "celeb");
    if (hasCeleb) {
      const halfP1 = p1 / 2;
      p2 += halfP1;
      p3 += halfP1;
      p1 = 0;
    }

    probs = { 1: p1, 2: p2, 3: p3, 4: p4 };

    const getRarity = () => {
      const rand = Math.random();
      if (rand < probs[1]) return 1;
      if (rand < probs[1] + probs[2]) return 2;
      if (rand < probs[1] + probs[2] + probs[3]) return 3;
      return 4;
    };

    const passivesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "passive" && (t.rarity || 1) === 1 && !t.isCurse),
      2: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 2 && !t.isCurse),
      3: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 3 && !t.isCurse),
      4: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 4 && !t.isCurse && !tokens.some(own => own?.id === t.id)),
    };
    if (passivesPools[2].length === 0) passivesPools[2] = passivesPools[1];
    if (passivesPools[3].length === 0) passivesPools[3] = passivesPools[2];
    if (passivesPools[4].length === 0) passivesPools[4] = passivesPools[3];

    const activesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "skill" && (t.rarity || 1) === 1 && !t.isCurse),
      2: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 2 && !t.isCurse),
      3: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 3 && !t.isCurse),
      4: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 4 && !t.isCurse && !tokens.some(own => own?.id === t.id)),
    };
    if (activesPools[2].length === 0) activesPools[2] = activesPools[1];
    if (activesPools[3].length === 0) activesPools[3] = activesPools[2];
    if (activesPools[4].length === 0) activesPools[4] = activesPools[3];

    const createTokenItem = (pools) => {
      const rarity = getRarity();
      const pool = pools[rarity];

      const weightedPool = pool.map(base => {
        let weight = 1;
        if (!base.attributes || base.attributes.length === 0) {
          weight *= attrWeights.none;
        } else {
          base.attributes.forEach(a => {
            if (attrWeights[a]) weight *= attrWeights[a];
          });
        }
        return { base, weight };
      });

      const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
      let r = Math.random() * totalWeight;
      let selectedBase = pool[0];
      for (const entry of weightedPool) {
        r -= entry.weight;
        if (r <= 0) {
          selectedBase = entry.base;
          break;
        }
      }

      const item = { ...selectedBase, level: 1, charge: selectedBase.cost || 0 };
      item.price = getTokenDynamicPrice(selectedBase, tokens);
      item.desc = getTokenDescription(item, 1, currentRunStats, tokens, activeBuffs);
      return item;
    };

    const passiveItems = Array.from({ length: basePassiveCount }).map(() => createTokenItem(passivesPools));

    const enchantItems = [];
    {
      for (let i = 0; i < enchantCount; i++) {
        const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        const encDesc = getEnchantDescription(enc.id);
        enchantItems.push({
          ...enc,
          type: "enchant_random",
          name: enc.name,
          originalName: enc.name,
          desc: encDesc || `所持トークンにランダムに「${enc.name}」を付与する。`,
        });
      }

      for (let i = 0; i < extraEnchantCount; i++) {
        const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        const encDesc = getEnchantDescription(enc.id);
        enchantItems.push({
          ...enc,
          type: "enchant_random",
          name: enc.name,
          originalName: enc.name,
          price: Math.max(1, enc.price - 2),
          desc: encDesc || `所持トークンにランダムに「${enc.name}」を付与する。`,
        });
      }
    }

    const activeItems = Array.from({ length: baseActiveCount }).map(() => createTokenItem(activesPools));

    const candidatesForSale = [...passiveItems, ...activeItems];
    const saleIndices = Array.from({ length: candidatesForSale.length }, (_, i) => i);

    for (let i = 0; i < saleCount && saleIndices.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * saleIndices.length);
      const targetIdx = saleIndices.splice(randIdx, 1)[0];
      candidatesForSale[targetIdx].isSale = true;
      candidatesForSale[targetIdx].originalPrice = candidatesForSale[targetIdx].price;
      candidatesForSale[targetIdx].price = Math.floor(candidatesForSale[targetIdx].price / 2);
    }

    const finalItems = [...passiveItems, ...enchantItems, ...activeItems];

    if (cycleCount >= 5 && Math.random() < 0.3) {
      finalItems.push({
        id: "grant_random_curse",
        type: "grant_random_curse",
        name: "呪いの契約",
        desc: "ランダムな呪いを1つ獲得する。代償を払い、より高みへ至るための試練。",
        price: 0,
        rarity: 1
      });
    }

    setShopItems(finalItems);
    return finalItems;
  }, [tokens, totalPurchases, currentRunStats, activeBuffs, getTokenDynamicPrice, setIsAwakeningLevelUpBought]);

  /** 呪いの解除 */
  const purifyCurse = useCallback((token) => {
    if (!token || (token.type !== 'curse' && !token.isCurse)) return;

    // 10%の確率で伝説トークン (rarity: 4) を解除報酬にする
    const isLegendary = Math.random() < 0.1;
    let rewardPool;
    if (isLegendary) {
      rewardPool = ALL_TOKEN_BASES.filter(t => t.rarity === 4 && t.type !== 'curse' && !t.isCurse);
    } else {
      rewardPool = ALL_TOKEN_BASES.filter(t => t.rarity === 3 && t.canBeCurseReward);
    }
    const rewardBase = rewardPool[Math.floor(Math.random() * rewardPool.length)] || rewardPool[0];

    const rewardToken = {
      ...rewardBase,
      instanceId: Date.now() + Math.random(),
      level: 1,
      charge: rewardBase.cost || 0
    };

    setTokens(prev => prev
      .map(t => (t && t.instanceId === token.instanceId) ? rewardToken : t)
      .filter(t => !t || t.parentId !== token.instanceId) // 親に紐付く増殖された呪いを削除
    );

    setCurrentRunStats(prev => ({ ...prev, currentCursesRemoved: (prev.currentCursesRemoved || 0) + 1 }));
    setStats(prev => ({ ...prev, lifetimeCursesRemoved: (prev.lifetimeCursesRemoved || 0) + 1 }));

    setSelectedTokenDetail(null);
    if (isLegendary) {
      addTokenToast(rewardToken, "を獲得しました！ (呪い解除報酬・伝説！)");
    } else {
      addTokenToast(rewardToken, "を獲得しました！ (呪い解除報酬)");
    }
  }, [setTokens, setCurrentRunStats, setStats, setSelectedTokenDetail, addTokenToast]);

  /** トークンの売却 */
  const sellToken = useCallback((token) => {
    if (!token) return;
    if (token.isLocked) return notify("このトークンは売却できません");

    let sellRate = 0.5;
    if (token.enchantments?.some(e => e.effect === "high_sell")) {
      sellRate = 3.0; // 300%
    }
    let sellPrice = Math.floor(token.price * sellRate);

    // 鉤爪の研鑽 (polishing_claw)
    if (token.effect === "stat_shape_l") {
      const v = token.values?.[(token.level || 1) - 1] || 1;
      const lCount = currentRunStats.currentShapeLShape || 0;
      sellPrice += (lCount * v);
    }

    setStars(s => s + sellPrice);

    spawnParticles(10, window.innerWidth / 2, window.innerHeight * 0.4, window.innerWidth * 0.8, 40, 'star');
    soundManager.playSE(SE_IDS.SELL_STAR);

    setTokens(prev => prev.filter(t => t.instanceId !== token.instanceId));
    setCurrentRunStats(prev => ({
      ...prev,
      tokensSold: (prev.tokensSold || 0) + 1,
      totalStarsEarned: (prev.totalStarsEarned || 0) + sellPrice
    }));

    setSelectedTokenDetail(null);
    notify(`${token.name} を売却しました (+${sellPrice} ★)`);
  }, [setStars, setTokens, currentRunStats, setCurrentRunStats, setSelectedTokenDetail, notify, spawnParticles]);

  /** トークン枠の拡張価格を取得 */
  const getTokenSlotExpandPrice = useCallback(() => {
    return AWAKENING_TOKEN_SLOT_PRICES[Math.min(tokenSlotExpansionCount, 4)] || 50000;
  }, [tokenSlotExpansionCount]);

  /** ショップアイテムの購入 */
  const buyItem = useCallback((item, clickPos) => {
    if (stars < item.price) {
      soundManager.playSE(SE_IDS.ERROR);
      return notify("★が足りません");
    }

    if (clickPos) {
      spawnParticles(8, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
    }
    soundManager.playSE(SE_IDS.BUY_STAR);

    if (item.id === "time_ext") {
      setSandsOfTimeSeconds(prev => prev + 2);
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      soundManager.playSE(SE_IDS.BUY_STAR);
      return notify("操作時間が2秒延長されました！");
    }

    if (item.id === "exchange_star3") {
      const targets = tokens.filter(t => t && t.type !== 'curse' && t.effect !== 'copy_left' && !t.isCurse && (t.rarity === 1 || t.rarity === 2 || !t.rarity));
      if (targets.length === 0) return notify("交換可能な星1・星2トークンがありません");

      const targetToLose = targets[Math.floor(Math.random() * targets.length)];
      const loseIdx = tokens.findIndex(t => t.instanceId === targetToLose.instanceId);

      const targetType = targetToLose.type === "skill" ? "skill" : "passive";
      const star3Pool = ALL_TOKEN_BASES.filter(t => t.type === targetType && t.rarity === 3 && !t.isCurse);

      if (star3Pool.length === 0) return notify("交換可能な星3が見つかりません");

      const gainBase = star3Pool[Math.floor(Math.random() * star3Pool.length)];
      const gainItem = {
        ...gainBase,
        level: 1,
        charge: gainBase.cost || 0,
        instanceId: Date.now() + Math.random(),
        price: getTokenDynamicPrice(gainBase, tokens),
        desc: getTokenDescription({ ...gainBase, level: 1 }, 1, currentRunStats, tokens, activeBuffs)
      };

      setTokens((prev) => {
        const next = [...prev];
        next[loseIdx] = gainItem;
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      addTokenToast(gainItem, `に昇華しました！`);
      return;
    }

    if (item.type === "upgrade_random") {
      const upgradeableTokens = tokens.filter(t => (t.level || 1) < 3 && t.effect !== 'copy_left');

      if (upgradeableTokens.length === 0) return notify("強化可能なトークンがありません");

      const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];
      const targetIdx = tokens.findIndex(t => t.instanceId === targetToken.instanceId);

      triggerLevelUp(targetToken.instanceId);

      setTokens((prev) => {
        const next = [...prev];
        const nextLevel = (next[targetIdx].level || 1) + 1;
        next[targetIdx] = {
          ...next[targetIdx],
          level: nextLevel,
          desc: getTokenDescription(next[targetIdx], nextLevel, currentRunStats, next, activeBuffs)
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));

      const nextLevel = (targetToken.level || 1) + 1;
      const updatedToken = { ...targetToken, level: nextLevel, desc: getTokenDescription(targetToken, nextLevel, currentRunStats, tokens, activeBuffs) };
      addTokenToast(updatedToken, "が強化されました！");

    } else if (item.type === "enchant_random") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        const newEnc = { id: item.id, effect: item.effect, name: item.originalName, params: item.params };
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), newEnc],
        };
        next.forEach((t, i) => {
          if (t && t.id === 'legend_magician' && i !== targetIdx) {
            next[i] = {
              ...next[i],
              enchantments: [...(next[i].enchantments || []), { ...newEnc }]
            };
          }
        });
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));

      addTokenToast(targetToken, `に「${item.originalName}」を付与しました！`);

    } else if (item.type === "enchant_grant") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        const newEnc = { id: item.id, effect: item.effect, name: item.name, params: item.params };
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), newEnc],
        };
        next.forEach((t, i) => {
          if (t && t.id === 'legend_magician' && i !== targetIdx) {
            next[i] = {
              ...next[i],
              enchantments: [...(next[i].enchantments || []), { ...newEnc }]
            };
          }
        });
        return next;
      });
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));

      const updatedToken = {
        ...targetToken,
        enchantments: [...(targetToken.enchantments || []), { id: item.id, effect: item.effect, name: item.name, params: item.params }]
      };
      addTokenToast(updatedToken, `に「${item.name}」を付与しました！`);
    } else if (item.type === "grant_random_curse") {
      const activeCount = tokens.filter(t => t?.type === 'skill' || t?.isCurse).length;
      const passiveCount = tokens.filter(t => t && t?.type !== 'skill' && !t?.isCurse).length;
      const maxSlots = 5 + tokenSlotExpansionCount;

      const cursePool = ALL_TOKEN_BASES.filter(t => t.type === 'curse' || t.isCurse);
      if (cursePool.length === 0) return notify("呪いが見つかりません");

      const randomCurseBase = cursePool[Math.floor(Math.random() * cursePool.length)];
      const isCurseActive = randomCurseBase.type === 'skill' || randomCurseBase.isCurse;

      if (isCurseActive && activeCount >= maxSlots) return notify(`アクティブ枠がいっぱいで呪いを受け取れません`);
      if (!isCurseActive && passiveCount >= maxSlots) return notify(`パッシブ枠がいっぱいで呪いを受け取れません`);

      const curseItem = {
        ...randomCurseBase,
        level: 1,
        charge: 0,
        instanceId: Date.now() + Math.random(),
        startValue: randomCurseBase.condition ? getStatByCondition(randomCurseBase.condition) : 0
      };
      if (isCurseActive && randomCurseBase.action && randomCurseBase.action.startsWith('curse_')) {
        curseItem.curseUses = 0;
      }

      if (randomCurseBase.id === 'curse_multiply') {
        const passiveDummy = ALL_TOKEN_BASES.find(t => t.id === 'curse_multiplied_p');
        const dummy = { ...passiveDummy, instanceId: Date.now() + Math.random(), parentId: curseItem.instanceId, level: 1, charge: 0 };
        setTokens(prev => [...prev, curseItem, dummy]);
      } else {
        setTokens(prev => [...prev, curseItem]);
      }
      setStars(s => {
        const nextStars = s - item.price;
        return randomCurseBase.id === 'curse_init' && !hasSaintToken ? Math.floor(nextStars / 2) : nextStars;
      });
      setTotalPurchases(p => p + 1);
      setShopItems(prev => prev.filter(i => i !== item));
      addTokenToast(curseItem, "の呪いを得た…！");
    } else {
      const isActive = item.type === 'skill';
      const maxSlots = 5 + tokenSlotExpansionCount;

      const existingIdx = tokens.findIndex((t) => t?.id === item.id);
      if (existingIdx !== -1) {
        if (item.noLevelUp) {
          return notify("このトークンは複数所持・強化できません");
        }
        const maxLv = tokens[existingIdx].values?.length || 3;
        const currentLevel = tokens[existingIdx].level || 1;
        const activeCount = tokens.filter(t => t?.type === 'skill').length;
        const passiveCount = tokens.filter(t => t && t?.type !== 'skill').length;

        if (currentLevel < maxLv) {
          setPendingShopItem(item);
        } else {
          if ((isActive && activeCount >= maxSlots) || (!isActive && passiveCount >= maxSlots)) {
            return notify(`これ以上強化できません (Max Lv${maxLv})`);
          }
          setPendingShopItem(item);
        }
      } else {
        const activeCount = tokens.filter(t => t?.type === 'skill').length;
        const passiveCount = tokens.filter(t => t && t?.type !== 'skill').length;
        const maxSlotsCurrent = 5 + tokenSlotExpansionCount;
        if (isActive && activeCount >= maxSlotsCurrent) return notify(`アクティブスキルは${maxSlotsCurrent}個までです`);
        if (!isActive && passiveCount >= maxSlotsCurrent) return notify(`パッシブアイテムは${maxSlotsCurrent}個までです`);

        const obtainedToken = {
          ...item,
          instanceId: Date.now() + Math.random(),
          startValue: item.condition ? getStatByCondition(item.condition) : 0
        };
        setTokens((prev) => [
          ...prev,
          obtainedToken
        ]);
        setStars((s) => s - item.price);
        setTotalPurchases((p) => p + 1);
        setTotalStarsSpent((prev) => prev + item.price);
        setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
        setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
        setShopItems((prev) => prev.filter((i) => i !== item));
        notify("購入完了!");
        addTokenToast(obtainedToken, "を獲得しました！");
      }
    }
  }, [stars, tokens, tokenSlotExpansionCount, hasSaintToken, setSandsOfTimeSeconds, setStars, setTotalPurchases, setTotalStarsSpent, setStats, currentRunStats, setCurrentRunStats, setShopItems, setTokens, addTokenToast, triggerLevelUp, notify, spawnParticles, getTokenDynamicPrice, getStatByCondition, activeBuffs]);

  /** 覚醒アイテムの購入 */
  const buyAwakeningItem = useCallback((type, clickPos) => {
    switch (type) {
      case 'random_levelup': {
        const price = 5;
        if (stars < price) {
          soundManager.playSE(SE_IDS.ERROR);
          return notify('★が足りません');
        }
        const upgradeableTokens = tokens.filter(t => (t?.level || 1) < 3);
        if (upgradeableTokens.length === 0) return notify('強化可能なトークンがありません (Max Lv3)');
        const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];

        if (clickPos) {
          spawnParticles(12, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
        }
        soundManager.playSE(SE_IDS.AWAKEN_BUY);
        triggerLevelUp(targetToken.instanceId);

        const targetIdx = tokens.findIndex(t => t?.instanceId === targetToken.instanceId);

        setTokens(prev => {
          const next = [...prev];
          const nextLevel = (next[targetIdx].level || 1) + 1;
          next[targetIdx] = {
            ...next[targetIdx],
            level: nextLevel,
            desc: getTokenDescription(next[targetIdx], nextLevel, currentRunStats, next, activeBuffs)
          };
          return next;
        });
        setStars(s => s - price);
        setTotalPurchases(p => p + 1);
        setTotalStarsSpent(prev => prev + price);
        setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + price }));
        setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + price }));
        setIsAwakeningLevelUpBought(true);
        soundManager.playSE(SE_IDS.AWAKEN_BUY);

        const nextLevel = (targetToken.level || 1) + 1;
        const updatedToken = { ...targetToken, level: nextLevel, desc: getTokenDescription(targetToken, nextLevel, currentRunStats, tokens, activeBuffs) };
        notify(`${targetToken.name} が強化されました! (Lv${nextLevel})`);
        addTokenToast(updatedToken, "が覚醒強化されました！");
        break;
      }
      case 'unlock_enchant_shop': {
        const price = 10;
        if (stars < price) {
          soundManager.playSE(SE_IDS.ERROR);
          return notify('★が足りません');
        }
        if (isEnchantShopUnlocked) return notify('エンチャントショップはすでに解放済みです');
        setIsEnchantShopUnlocked(true);
        setStars(s => s - price);
        soundManager.playSE(SE_IDS.AWAKEN_BUY);
        if (clickPos) {
          spawnParticles(15, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
        }
        notify('エンチャントショップが解放されました!');
        break;
      }
      case 'expand_token_slots': {
        const beyondSlotMax = isBeyondMode ? 10 : 5;
        if (tokenSlotExpansionCount >= beyondSlotMax) return notify(`これ以上拡張できません (最大${5 + beyondSlotMax}枠)`);
        const price = getTokenSlotExpandPrice();
        if (stars < price) {
          soundManager.playSE(SE_IDS.ERROR);
          return notify('★が足りません');
        }
        if (clickPos) {
          spawnParticles(15, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
        }
        setTokenSlotExpansionCount(prev => prev + 1);
        setStars(s => s - price);
        soundManager.playSE(SE_IDS.AWAKEN_BUY);
        notify(`トークン枠が ${5 + tokenSlotExpansionCount + 1} / ${5 + tokenSlotExpansionCount + 1} に拡張されました!`);
        break;
      }
      default:
        break;
    }
  }, [stars, tokens, isEnchantShopUnlocked, setIsEnchantShopUnlocked, isBeyondMode, tokenSlotExpansionCount, getTokenSlotExpandPrice, setTokens, setStars, setTotalPurchases, setTotalStarsSpent, setStats, currentRunStats, setCurrentRunStats, setIsAwakeningLevelUpBought, notify, spawnParticles, addTokenToast, triggerLevelUp, activeBuffs]);

  /** 重複トークン購入時の選択処理 (強化 or 2つ目所持) */
  const handleChoice = useCallback((choice) => {
    if (!pendingShopItem) return;
    const item = pendingShopItem;

    let updatedToken = null;
    let actionText = "";

    if (choice === "upgrade") {
      setTokens((prev) => {
        const next = [...prev];
        const idx = next.findIndex((t) => t?.id === item.id);
        if (idx !== -1) {
          const currentLevel = next[idx].level || 1;
          if (currentLevel >= 3) {
            return next;
          }
          const nextLevel = currentLevel + 1;
          next[idx] = {
            ...next[idx],
            level: nextLevel,
            desc: getTokenDescription(next[idx], nextLevel, currentRunStats, next, activeBuffs)
          };
          updatedToken = next[idx];
          actionText = `強化されました！`;
        }
        return next;
      });
      addTokenToast(item, "を強化した！");
    } else {
      const isActive = item.type === 'skill';
      const activeCount = tokens.filter(t => t.type === 'skill').length;
      const passiveCount = tokens.filter(t => t.type !== 'skill').length;
      const maxSlots = 5 + tokenSlotExpansionCount;

      if ((isActive && activeCount >= maxSlots) || (!isActive && passiveCount >= maxSlots)) {
        notify("スロットがいっぱいです。強制的に強化を適用します。");
        setTokens((prev) => {
          const next = [...prev];
          const idx = next.findIndex((t) => t?.id === item.id);
          if (idx !== -1) {
            const nextLevel = (next[idx].level || 1) + 1;
            next[idx] = {
              ...next[idx],
              level: nextLevel,
              desc: getTokenDescription(next[idx], nextLevel, currentRunStats, next, activeBuffs)
            };
            updatedToken = next[idx];
            actionText = `スロット一杯のため自動強化されました！`;
          }
          return next;
        });
      } else {
        const newToken = { ...item, instanceId: Date.now() + Math.random() };
        setTokens((prev) => [
          ...prev,
          newToken
        ]);
        updatedToken = newToken;
        actionText = `2つ目を装備しました！`;
        notify("2つ目のトークンを装備しました。");
      }
    }

    setStars((s) => s - item.price);
    setTotalPurchases((p) => p + 1);
    setTotalStarsSpent((prev) => prev + item.price);
    setShopItems((prev) => prev.filter((i) => i !== item));
    setPendingShopItem(null);
    if (updatedToken) {
      addTokenToast(updatedToken, actionText);
    }
  }, [pendingShopItem, tokenSlotExpansionCount, tokens, setTokens, setStars, setTotalPurchases, setTotalStarsSpent, setShopItems, addTokenToast, notify, activeBuffs, currentRunStats]);

  /** ショップ画面を開く */
  const openShop = useCallback(() => {
    if (shopItems.length === 0) {
      generateShop();
    }
    return true; // 親側で showShop のステート切り替えを補助
  }, [shopItems, generateShop]);

  /** ショップのリロール */
  const refreshShop = useCallback((clickPos) => {
    if (stars < shopRerollPrice) {
      soundManager.playSE(SE_IDS.ERROR);
      notify("★が足りません");
      return false;
    }

    if (clickPos) {
      spawnParticles(5, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
    }

    setStars(s => s - shopRerollPrice);
    soundManager.playSE(SE_IDS.SHOP_REFRESH);
    setTotalStarsSpent((prev) => prev + shopRerollPrice);
    setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + shopRerollPrice }));
    setCurrentRunStats(prev => ({
      ...prev,
      currentStarsSpent: (prev.currentStarsSpent || 0) + shopRerollPrice,
      currentShopRerolls: (prev.currentShopRerolls || 0) + 1, // 浪費の勲章用リロール回数カウント
    }));
    setShopRerollPrice(prev => Math.ceil(prev * SHOP_REROLL_GROWTH_FACTOR));
    generateShop();
    return true;
  }, [stars, shopRerollPrice, setStars, setTotalStarsSpent, setStats, setCurrentRunStats, generateShop, notify, spawnParticles]);

  return {
    shopItems,
    setShopItems,
    shopRerollBasePrice,
    setShopRerollBasePrice,
    shopRerollPrice,
    setShopRerollPrice,
    pendingShopItem,
    setPendingShopItem,
    tokenSlotExpansionCount,
    setTokenSlotExpansionCount,
    generateShop,
    purifyCurse,
    sellToken,
    buyItem,
    buyAwakeningItem,
    handleChoice,
    openShop,
    refreshShop,
    getTokenSlotExpandPrice,
  };
};
