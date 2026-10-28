import { PREFIX_TITLES, SUFFIX_TITLES, TITLE_SET_BONUSES, EVOLVED_TITLES } from '../constants/titles.js';

export const TITLE_STORAGE_KEY = 'puzzle_rogue_titles';

/**
 * 保存されている二つ名データを取得
 */
export const loadTitleState = () => {
  try {
    const raw = localStorage.getItem(TITLE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unlockedTitles: {
          prefixes: parsed.unlockedTitles?.prefixes || [],
          suffixes: parsed.unlockedTitles?.suffixes || [],
          evolved: parsed.unlockedTitles?.evolved || []
        },
        equippedTitle: {
          prefixId: parsed.equippedTitle?.prefixId || null,
          suffixId: parsed.equippedTitle?.suffixId || null
        }
      };
    }
  } catch (e) {
    console.error('Failed to load title state:', e);
  }
  return {
    unlockedTitles: { prefixes: [], suffixes: [], evolved: [] },
    equippedTitle: { prefixId: null, suffixId: null }
  };
};

/**
 * 二つ名データを永続化
 */
export const saveTitleState = (titleState) => {
  try {
    localStorage.setItem(TITLE_STORAGE_KEY, JSON.stringify(titleState));
  } catch (e) {
    console.error('Failed to save title state:', e);
  }
};

/**
 * 現在装備中の称号の完全な情報（A枠、B枠、発動中セット効果、進化効果）を算出
 */
export const getEquippedTitleInfo = (equippedTitle) => {
  if (!equippedTitle) {
    return { prefix: null, suffix: null, activeSet: null, fullName: '未設定' };
  }

  const { prefixId, suffixId } = equippedTitle;
  // 進化称号か通常称号かチェック
  const prefix = PREFIX_TITLES.find(p => p.id === prefixId) || EVOLVED_TITLES.find(e => e.id === prefixId && e.type === 'prefix') || null;
  const suffix = SUFFIX_TITLES.find(s => s.id === suffixId) || EVOLVED_TITLES.find(e => e.id === suffixId && e.type === 'suffix') || null;

  let activeSet = null;
  if (prefixId && suffixId) {
    activeSet = TITLE_SET_BONUSES.find(s => s.prefixId === prefixId && s.suffixId === suffixId) || null;
  }

  let fullName = '未設定';
  if (prefix && suffix) {
    fullName = activeSet ? activeSet.titleName : `【${prefix.name}${suffix.name}】`;
  } else if (prefix) {
    fullName = `【${prefix.name}……】`;
  } else if (suffix) {
    fullName = `【……${suffix.name}】`;
  }

  return {
    prefix,
    suffix,
    activeSet,
    fullName
  };
};

/**
 * 統計情報から特定の二つ名の現在達成度（進行度）を取得
 */
export const getTitleProgressValue = (titleItem, stats = {}, currentRunStats = {}) => {
  const cond = titleItem.conditionType;
  const drops = currentRunStats?.currentDropsErased || stats?.totalDropsErased || {};

  switch (cond) {
    case 'color_erase_total': {
      const color = titleItem.targetColor;
      return (drops[color] || 0);
    }
    case 'drops_erased_total': {
      return Object.values(drops).reduce((a, b) => a + b, 0);
    }
    case 'max_combo_single':
      return Math.max(currentRunStats?.maxCombo || 0, stats?.maxCombo || 0);
    case 'base_combo_single':
      return Math.max(currentRunStats?.maxBaseCombo || 0, stats?.maxBaseCombo || 0);
    case 'star_earned_total':
    case 'star_earned_single_run':
      return currentRunStats?.totalStarEarnedByDrops || stats?.totalStarEarnedByDrops || 0;
    case 'cycles_cleared_total':
      return currentRunStats?.currentClears || stats?.totalClears || 0;
    case 'skill_used_total':
      return currentRunStats?.currentSkillsUsed || stats?.totalSkillsUsed || 0;
    case 'shop_purchases_total':
      return stats?.shopPurchases || currentRunStats?.shopPurchases || 0;
    case 'rerolls_performed_total':
      return stats?.rerollsPerformed || currentRunStats?.rerollsPerformed || 0;
    case 'curse_sold_total':
      return stats?.cursesSold || 0;
    case 'enhanced_drops_erased_total':
      return stats?.totalEnhancedErased || currentRunStats?.totalEnhancedErased || 0;
    case 'star_drops_erased_total':
    case 'star_drops_erased_total_pioneer':
      return currentRunStats?.totalStarDropsErased || stats?.totalStarDropsErased || 0;
    case 'special_shape_erase_total':
      return (currentRunStats?.currentShapeCross || 0) + (currentRunStats?.currentShapeLShape || 0) + (currentRunStats?.currentShapeSquare || 0);
    case 'all_attributes_2000_erase': {
      const colors = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
      const minErase = Math.min(...colors.map(c => drops[c] || 0));
      return minErase;
    }
    default:
      return 0;
  }
};
