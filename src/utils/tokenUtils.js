import { ALL_TOKEN_BASES } from '../constants/tokens.js';

// --- Utils ---
// --- Utils ---
const formatNum = (n) => {
  const num = Number(n);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
};

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

/**
 * 属性リストから属性バーのスタイル（背景色やグラデーション）を生成する
 */
export const getAttributeBarStyles = (attributes) => {
  if (!attributes || attributes.length === 0) {
    return { background: '#ffffff' };
  }
  if (attributes.length === 1) {
    return { background: `var(--color-attr-${attributes[0]})` };
  }
  // 複数属性の場合のグラデーション生成 (等分)
  const stops = attributes.map((attr, i) => {
    const start = (i / attributes.length) * 100;
    const end = ((i + 1) / attributes.length) * 100;
    const color = `var(--color-attr-${attr})`;
    return `${color} ${start}%, ${color} ${end}%`;
  }).join(', ');
  return { background: `linear-gradient(to bottom, ${stops})` };
};

/**
 * トークンの効果や属性に基づいて適切なアイコン名を返す
 */
export const getTokenIcon = (token) => {
    if (!token) return 'help_outline';

    if (token.type === 'curse') return 'skull';

    if (token.type === 'skill') {
        const action = token.action;
        if (action === 'refresh' || action === 'force_refresh') return 'refresh';
        if (action === 'skyfall' || action === 'skyfall_limit') return 'cloud_download';
        if (action === 'convert' || action === 'convert_multi') return 'swap_horiz';
        if (action === 'board_change') return 'grid_view';
        if (action === 'row_fix') return 'view_stream';
        if (action === 'col_fix') return 'view_column';
        if (action === 'spawn_random' || action === 'spawn_rainbow') return 'flare';
        if (action === 'spawn_star' || action === 'convert_star') return 'stars';
        if (action === 'spawn_repeat' || action === 'convert_repeat' || action === 'spawn_bomb_random' || action === 'convert_bomb_targeted') return 'settings_backup_restore';
        if (action === 'chronos_stop') return 'timer_off';
        if (action === 'temp_mult' || action === 'active_mult_1' || action === 'active_mult_2' || action === 'seal_of_power') return 'trending_up';
        if (action === 'charge_boost') return 'battery_charging_full';
        if (action === 'forbidden_temp') return 'block';
        if (action === 'enhance_color') return 'auto_fix_high';
        return 'bolt';
    }

    if (token.type === 'passive') {
        const effect = token.effect || token.id;
        if (effect === 'time' || effect === 'time_ext') return 'hourglass_empty';
        if (effect === 'power_up' || effect === 'stat_time_move') return 'fitness_center';
        if (effect === 'collector' || effect === 'star_earn_boost') return 'savings';
        if (effect === 'forbidden' || effect === 'dangerous') return 'block';
        if (effect === 'bargain' || effect === 'shop_expand') return 'shopping_cart';
        if (effect === 'percent') return 'percent';
        if (effect === 'skip_master') return 'fast_forward';
        if (effect === 'color_multiplier' || effect === 'color_count_bonus' || effect === 'filter_vintage') return 'filter_vintage';
        if (effect === 'shape_bonus' || effect === 'category') return 'category';
        if (effect === 'expand_board') return 'aspect_ratio';
        if (effect.startsWith('stat_')) return 'query_stats';
        return 'auto_awesome';
    }

    if (token.type === 'enchant_grant' || token.type === 'enchant_random') return 'auto_fix_high';
    if (token.type === 'upgrade_random') return 'arrow_upward';

    return 'star';
};
