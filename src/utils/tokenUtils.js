import { ALL_TOKEN_BASES } from '../constants/tokens.js';

// --- Utils ---
// --- Utils ---
const formatNum = (n) => Math.round(n * 100) / 100;

const getEffectiveCost = (token, currentRunStats = null, currentTokens = [], currentBuffs = []) => {
  if (!token || token.type !== 'skill') return token?.cost || 0;
  const baseCost = token.cost || 0;
  if (baseCost === 0) return 0;
  const level = token.level || 1;
  const reduction = Math.max(0, level - 1);

  const isEnchantDisabled = currentTokens.some(t => t?.effect === "contract_of_void") ||
    currentBuffs.some(b => b?.action === "seal_of_power");

  let enchantReduction = 0;
  let resonanceReduction = 0;

  if (!isEnchantDisabled) {
    enchantReduction = token.enchantments?.filter(e => e.effect === "cost_down").length || 0;
    if (currentRunStats && token.enchantments?.some(e => e.effect === "stat_skill_use")) {
      resonanceReduction = Math.floor((currentRunStats.currentSkillsUsed || 0) / 10);
    }
  }

  const minCost = 1;
  return Math.max(minCost, baseCost - reduction - enchantReduction - resonanceReduction);
};

const getTokenDescription = (item, level, currentRunStats = null, currentTokens = [], currentBuffs = []) => {
  const base = ALL_TOKEN_BASES.find((b) => b.id === (item.id || item));
  if (!base) return item?.desc || "";

  const targetLv = level || item?.level || 1;
  let d = base.desc;

  if (base.costLevels) {
    const cost = getEffectiveCost({ ...item, cost: base.cost, level: targetLv, type: 'skill' }, currentRunStats, currentTokens, currentBuffs);
    d = d.replace(/{cost}/g, cost);
  }

  if (base.values) {
    const value = base.values[targetLv - 1];
    if (value !== undefined) {
      d = d.replace(/\[?([−±\-\d.]+(?:\/[−±\-\d.]+)+)\]?/g, (match, contents) => {
        const parts = contents.split('/');
        const val = parts[targetLv - 1] !== undefined ? parts[targetLv - 1] : value;
        // 小数点を含む数値の場合、フォーマット（最大小数第二位、末尾の0削除）
        if (!isNaN(parseFloat(val))) {
          return Math.round(parseFloat(val) * 100) / 100;
        }
        return val;
      });
      d = d.replace(/Lvに応じ/g, "");
      const formattedValue = !isNaN(parseFloat(value)) ? Math.round(parseFloat(value) * 100) / 100 : value;
      d = d.replace(/Lv分/g, `${formattedValue}`);
    }
  }
  return d;
};

export { formatNum, getEffectiveCost, getTokenDescription };
