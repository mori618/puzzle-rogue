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

// --- 動的情報を取得する関数 ---
const getTokenDynamicInfo = (item, level, currentRunStats = null, currentTokens = [], currentBuffs = [], extraState = {}) => {
  const base = ALL_TOKEN_BASES.find((b) => b.id === (item.id || item));
  if (!base) return [];

  const targetLv = level || item?.level || 1;
  let infoList = [];

  // 1. アクティブなバフの残り手番数
  if (currentBuffs && currentBuffs.length > 0 && item.instanceId) {
    const buff = currentBuffs.find(b => b.tokenId === item.instanceId);
    if (buff && buff.duration !== undefined) {
      infoList.push({ label: '効果時間', value: `残り ${buff.duration} 手番`, type: 'buff' });
    }
  }

  // 2. 現在値（値が存在する場合）
  if (currentRunStats && base.values) {
    const v = base.values[targetLv - 1];
    const effect = base.effect;
    const attrNames = { fire: '炎', water: '雨', wood: '風', light: '雷', dark: '月', heart: '心' };

    if (effect === 'stat_combo_記憶') {
      const currentVal = currentRunStats.maxBaseCombo || currentRunStats.maxCombo || 0;
      const currentAdd = Math.floor(currentVal / 5) * v;
      infoList.push({ label: '現在最大コンボ', value: `${formatNum(currentVal)} コンボ`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(currentAdd)}`, type: 'boost' });
    } else if (effect === 'stat_mult_余韻') {
      const maxMult = currentRunStats.maxComboMultiplier || 1;
      const m = 1 + (maxMult * v);
      infoList.push({ label: '現在最大倍率', value: `x${formatNum(maxMult)}`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'stat_mult_千手') {
      const count = Math.floor((currentRunStats.currentTotalCombo || 0) / 100);
      const m = Math.pow(v, count);
      infoList.push({ label: '累計コンボ', value: `${formatNum(currentRunStats.currentTotalCombo || 0)} コンボ`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'stat_curse_removed') {
      const count = currentRunStats.currentCursesRemoved || 0;
      infoList.push({ label: '呪い解除数', value: `${count} 回`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(count * v)}`, type: 'boost' });
    } else if (effect === 'stat_heart_chalice') {
      const count = Math.floor((currentRunStats.totalHeartsErased || 0) / 30);
      const m = Math.pow(v, count);
      infoList.push({ label: 'ハート消去累計', value: `${currentRunStats.totalHeartsErased || 0} 個`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'stat_time_skipper') {
      const count = Math.floor((currentRunStats.skipsPerformed || 0) / 5);
      const m = Math.pow(v, count);
      infoList.push({ label: 'スキップ累計', value: `${currentRunStats.skipsPerformed || 0} 回`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'stat_shape_cross') {
      const b = Math.floor((currentRunStats.currentShapeCross || 0) / 5) * v;
      infoList.push({ label: '十字消し累計', value: `${currentRunStats.currentShapeCross || 0} 回`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(b)}`, type: 'boost' });
    } else if (effect === 'stat_shape_len4') {
      const b = Math.floor((currentRunStats.currentShapeLen4 || 0) / 20) * v;
      infoList.push({ label: '4個消し累計', value: `${currentRunStats.currentShapeLen4 || 0} 回`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(b)}`, type: 'boost' });
    } else if (effect === 'stat_shape_l') {
      const count = currentRunStats.currentShapeLShape || 0;
      infoList.push({ label: 'L字消し累計', value: `${count} 回`, type: 'stat' });
      infoList.push({ label: '売却値増加', value: `+${formatNum(count * v)}`, type: 'boost' });
    } else if (effect === 'stat_shape_row') {
      const count = Math.floor((currentRunStats.currentShapeRow || 0) / 2);
      const m = Math.pow(v, count);
      infoList.push({ label: '横一列累計', value: `${currentRunStats.currentShapeRow || 0} 回`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'attribute_count_combo_add' && base.params?.attribute) {
      const count = currentTokens.filter(t => t && t.attributes?.includes(base.params.attribute)).length;
      const attrName = attrNames[base.params.attribute] || base.params.attribute;
      infoList.push({ label: `${attrName}属性トークン`, value: `${count} 個`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(count * v)}`, type: 'boost' });
    } else if (effect === 'star_count_combo_add') {
      const count = currentTokens.filter(t => t && (t.rarity || 1) === base.params.rarity).length;
      infoList.push({ label: `★${base.params.rarity}トークン`, value: `${count} 個`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(count * v)}`, type: 'boost' });
    } else if (effect === 'star_count_time_ext') {
      const count = currentTokens.filter(t => t && (t.rarity || 1) === base.params.rarity).length;
      infoList.push({ label: `★${base.params.rarity}トークン`, value: `${count} 個`, type: 'stat' });
      infoList.push({ label: '延長時間', value: `+${formatNum(count * v)}秒`, type: 'boost' });
    } else if (effect === 'star_count_combo_mult') {
      const count = currentTokens.filter(t => t && (t.rarity || 1) === base.params.rarity).length;
      const m = Math.pow(v, count);
      infoList.push({ label: `★${base.params.rarity}トークン`, value: `${count} 個`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'enchant_count_combo_mult') {
      const count = currentTokens.reduce((sum, tok) => sum + (tok?.enchantments?.length || 0), 0);
      const m = Math.pow(v, count);
      infoList.push({ label: 'エンチャント合計', value: `${count} 個`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'total_level_combo_add') {
      const count = currentTokens.reduce((sum, tok) => sum + (tok?.level || 1), 0);
      infoList.push({ label: 'トークン合計Lv', value: `Lv ${count}`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(count * v)}`, type: 'boost' });
    } else if (effect === 'level3_count_combo_mult') {
      const count = currentTokens.filter(tok => (tok?.level || 1) >= 3).length;
      const m = Math.pow(v, count);
      infoList.push({ label: 'Lv3トークン', value: `${count} 個`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'curse_count_combo_mult') {
      const count = currentTokens.filter(tok => tok?.isCurse || tok?.type === 'curse').length;
      const m = Math.pow(v, count);
      infoList.push({ label: '呪いトークン', value: `${count} 個`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'greed_power') {
      const threshold = base.values?.[targetLv - 1] || 10;
      const greedBonus = Math.floor((extraState?.stars || 0) / threshold);
      infoList.push({ label: '所持スター', value: `${formatNum(extraState?.stars || 0)} 個`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(greedBonus)}`, type: 'boost' });
    } else if (effect === 'stat_shape_square') {
      const count = Math.floor((currentRunStats.currentShapeSquare || 0) / 5);
      const m = Math.pow(v, count);
      infoList.push({ label: '正方形消し累計', value: `${currentRunStats.currentShapeSquare || 0} 回`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'stat_shape_len5') {
      const b = Math.floor((currentRunStats.currentShapeLen5 || 0) / 10) * v;
      infoList.push({ label: '5個消し累計', value: `${currentRunStats.currentShapeLen5 || 0} 回`, type: 'stat' });
      infoList.push({ label: '加算値', value: `+${formatNum(b)}`, type: 'boost' });
    } else if (effect === 'stat_spend_star') {
      const count = Math.floor((currentRunStats.currentStarsSpent || 0) / 50);
      const m = Math.pow(v, count);
      infoList.push({ label: '消費スター累計', value: `${currentRunStats.currentStarsSpent || 0} 個`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'stat_progress_clear') {
      const clears = currentRunStats.currentClears || 0;
      const m = Math.pow(v, clears);
      infoList.push({ label: 'クリア階層数', value: `${clears} 階層`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'stat_time_move') {
      const minutes = Math.floor((currentRunStats.currentTotalMoveTime || 0) / 60000);
      const m = Math.pow(v, minutes);
      infoList.push({ label: 'パズル累計時間', value: `${minutes} 分間`, type: 'stat' });
      infoList.push({ label: '乗算値', value: `x${formatNum(m)}`, type: 'boost' });
    } else if (effect === 'no_attribute_multiplier') {
      const colorlessTokens = currentTokens.filter(tok => tok && (!tok.attributes || tok.attributes.length === 0) && tok.id !== "time_ext");
      if (colorlessTokens.length === 0) {
        infoList.push({ label: '無属性(時の砂以外)', value: '0 個', type: 'stat' });
        infoList.push({ label: '乗算値', value: `x${formatNum(v)}`, type: 'boost' });
      } else {
        infoList.push({ label: '無属性(時の砂以外)', value: `${colorlessTokens.length} 個`, type: 'stat' });
        infoList.push({ label: '発動状態', value: '未発動', type: 'buff' });
      }
    }
  }

  return infoList;
};

export { formatNum, getEffectiveCost, getTokenDescription, getTokenDynamicInfo };

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

    // トークン定義に直接アイコンが指定されている場合はそれを優先
    if (token.icon) return token.icon;

    // 呪いトークンの特定アイコン設定
    const curseIcons = {
        curse_turns: 'lock_clock',
        curse_heart: 'heart_broken',
        curse_time: 'hourglass_bottom',
        curse_skyfall: 'cloud_off',
        curse_half: 'trending_down',
        curse_init: 'money_off',
        curse_double_target: 'track_changes',
        curse_active_time: 'timer',
        curse_active_passive_null: 'do_not_disturb_on'
    };
    if (curseIcons[token.id]) return curseIcons[token.id];

    // アクティブ呪いトークン (isCurse + type:'skill') / 呪いタイプ
    if (token.isCurse || token.type === 'curse') return 'skull';

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
        if (action === 'random_levelup') return 'upgrade';
        // アクティブ呪いスキル用（isCurse判定で上流に捕捉されるが念のため）
        if (action === 'op_time_boost') return 'timer';
        if (action === 'curse_op_time_fix') return 'timer';
        if (action === 'curse_multiply') return 'content_copy';
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
        if (effect === 'stat_curse_removed') return 'cleaning_services';
        if (effect === 'stat_heart_chalice') return 'local_drink';
        if (effect === 'stat_time_skipper') return 'shutter_speed';
        if (effect === 'shop_attribute_weight') return 'storefront';
        if (effect.startsWith('stat_')) return 'query_stats';

        const countPassiveIcons = {
            passive_fire_count: 'whatshot',
            passive_water_count: 'water_drop',
            passive_wood_count: 'eco',
            passive_dark_count: 'brightness_2',
            passive_light_count: 'bolt'
        };
        if (countPassiveIcons[token.id]) return countPassiveIcons[token.id];

        return 'auto_awesome';
    }

    if (token.type === 'enchant_grant' || token.type === 'enchant_random') return 'auto_fix_high';
    if (token.type === 'upgrade_random') return 'arrow_upward';
    if (token.type === 'grant_random_curse') return 'skull';

    return 'star';
};
