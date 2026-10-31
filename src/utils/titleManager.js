import {
  PREFIX_TITLES,
  SUFFIX_TITLES,
  TITLE_SET_BONUSES,
  EVOLVED_TITLES
} from '../constants/titles.js';

const TITLE_STORAGE_KEY = 'pazuru_roguelike_title_state';

/**
 * ローカルストレージから二つ名状態を読み込み
 */
export const loadTitleState = () => {
  try {
    const raw = localStorage.getItem(TITLE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unlockedTitles: {
          prefixes: parsed.unlockedTitles?.prefixes || ['A01'],
          suffixes: parsed.unlockedTitles?.suffixes || ['B01'],
          evolved: parsed.unlockedTitles?.evolved || [],
        },
        equippedTitle: {
          // 明示的に外した状態 (null) を保持するため、キーが存在しない場合のみ既定値を使う
          prefixId: parsed.equippedTitle && 'prefixId' in parsed.equippedTitle ? parsed.equippedTitle.prefixId : 'A01',
          suffixId: parsed.equippedTitle && 'suffixId' in parsed.equippedTitle ? parsed.equippedTitle.suffixId : 'B01',
        },
      };
    }
  } catch (e) {
    console.error('Failed to load title state:', e);
  }

  // デフォルト: 神速の + 覇王 解放済み
  return {
    unlockedTitles: {
      prefixes: ['A01'],
      suffixes: ['B01'],
      evolved: [],
    },
    equippedTitle: {
      prefixId: 'A01',
      suffixId: 'B01',
    },
  };
};

/**
 * ローカルストレージに二つ名状態を保存
 */
export const saveTitleState = (titleState) => {
  try {
    localStorage.setItem(TITLE_STORAGE_KEY, JSON.stringify(titleState));
  } catch (e) {
    console.error('Failed to save title state:', e);
  }
};

/**
 * 接頭辞と接尾辞を連結する。接頭辞が「の」で終わらない場合（例: 紅蓮の詠唱）は「・」で区切る
 */
export const joinTitleName = (prefixName, suffixName) => {
  if (!prefixName) return suffixName || '';
  if (!suffixName) return prefixName;
  return prefixName.endsWith('の') ? `${prefixName}${suffixName}` : `${prefixName}・${suffixName}`;
};

/**
 * 装備中の二つ名とシナジー情報を取得
 */
export const getEquippedTitleInfo = (equippedTitle = {}) => {
  const prefix = PREFIX_TITLES.find(p => p.id === equippedTitle.prefixId) || null;
  const suffix = SUFFIX_TITLES.find(s => s.id === equippedTitle.suffixId) || null;

  let activeSet = null;
  if (prefix && suffix) {
    activeSet = TITLE_SET_BONUSES.find(s => s.prefixId === prefix.id && s.suffixId === suffix.id) || null;
  }

  let fullName = '未設定';
  if (activeSet) {
    fullName = activeSet.titleName;
  } else if (prefix && suffix) {
    fullName = joinTitleName(prefix.name, suffix.name);
  } else if (prefix) {
    fullName = joinTitleName(prefix.name, '――');
  } else if (suffix) {
    fullName = `――の${suffix.name}`;
  }

  return {
    prefix,
    suffix,
    activeSet,
    fullName,
  };
};

/**
 * 実績・条件達成状況のプログレス値を取得
 */
export const getTitleProgressValue = (title, stats = {}, currentRunStats = {}) => {
  const drops = currentRunStats.currentDropsErased || {};
  switch (title.conditionType) {
    case 'time_left':
      return currentRunStats.lastRemainingTimeSec || 0;
    case 'time_left_less':
      // 「N秒以下」条件: 残り時間が目標以下なら達成値 (targetValue) を返す
      return (currentRunStats.lastRemainingTimeSec ?? Infinity) <= title.targetValue ? title.targetValue : 0;
    case 'cycle_clear':
      return (currentRunStats.currentClears || 0);
    case 'drop_erase_fire':
      return (drops.fire || 0);
    case 'drop_erase_water':
      return (drops.water || 0);
    case 'drop_erase_wood':
      return (drops.wood || 0);
    case 'drop_erase_light':
      return (drops.light || 0);
    case 'drop_erase_dark':
      return (drops.dark || 0);
    case 'drop_erase_heart':
      return (drops.heart || 0);
    case 'stars_earned_single':
      return currentRunStats.currentStarsSpent || 0;
    case 'zero_star_clear':
      return currentRunStats.clearedWithZeroStars ? 1 : 0;
    case 'no_skyfall_combos':
      return currentRunStats.noSkyfallCombos || 0;
    case 'curses_equipped':
      return currentRunStats.curseCount || 0;
    case 'long_move_clear':
      return currentRunStats.maxSingleMoveDistance || 0;
    case 'first_turn_win':
      return currentRunStats.clearedInOneTurn ? 1 : 0;
    case 'low_token_clear':
      return currentRunStats.tokenCountWhenCleared || 0;
    case 'fire_skill_trans':
      return currentRunStats.fireSkillTransCount || 0;
    case 'water_skill_trans':
      return currentRunStats.waterSkillTransCount || 0;
    case 'curse_sold':
      return currentRunStats.cursesSold || 0;
    case 'token_levelups':
      return currentRunStats.tokenLevelUps || 0;
    case 'passive_combo_add':
      return currentRunStats.passiveComboAddTotal || 0;
    case 'single_attr_board':
      return currentRunStats.maxSingleAttrBoardCount || 0;
    case 'total_drops_erased':
      return Object.values(drops).reduce((a, b) => a + b, 0);
    case 'full_slots_count':
      return currentRunStats.equippedTokensCount || 0;
    case 'shop_visits':
      return currentRunStats.shopVisits || 0;

    // 接尾辞 (Suffix)
    case 'max_turn_combo':
      return currentRunStats.maxCombo || 0;
    case 'star_combo_count':
      return currentRunStats.totalStarEarnedByDrops || 0;
    case 'skill_use_count':
      return currentRunStats.currentSkillsUsed || 0;
    case 'special_shape_count':
      return (currentRunStats.currentShapeLen4 || 0) + (currentRunStats.currentShapeLen5 || 0) + (currentRunStats.currentShapeRow || 0) + (currentRunStats.currentShapeLShape || 0) + (currentRunStats.currentShapeCross || 0) + (currentRunStats.currentShapeSquare || 0);
    case 'total_combo_add':
      return currentRunStats.totalComboBonusAdded || 0;
    case 'enhanced_erase_count':
      return currentRunStats.totalEnhancedErased || 0;
    case 'star_held_max':
      return currentRunStats.maxStarsHeld || 0;
    case 'base_combo_single':
      return currentRunStats.maxBaseCombo || 0;
    case 'shop_purchases':
      return currentRunStats.shopPurchases || 0;
    case 'skill_in_one_turn':
      return currentRunStats.maxSkillsInOneTurn || 0;
    case 'star_erase_count':
    case 'star_drops_erased_total':
      return currentRunStats.totalStarDropsErased || 0;
    case 'rerolls_performed':
      return currentRunStats.rerollsCount || 0;
    case 'bosses_defeated':
      return currentRunStats.currentClears || 0;
    case 'five_colors_erased':
      return currentRunStats.erased5ColorsOnce ? 1 : 0;
    case 'mono_token_equip':
      return currentRunStats.monoAttrTokenCount || 0;
    case 'cycle1_one_turn_clear':
      return currentRunStats.cycle1OneTurn ? 1 : 0;
    case 'tokens_sold_count':
      return currentRunStats.tokensSold || 0;
    case 'lv3_tokens_count':
      return currentRunStats.lv3TokensEquipped || 0;
    case 'skill_convert_single':
      return currentRunStats.maxSingleSkillConvert || 0;
    case 'two_color_30_combo':
      return currentRunStats.twoColor30ComboDone ? 30 : 0;
    case 'all_skill_slots':
      return currentRunStats.allSkillSlotsFilled ? 6 : 0;
    case 'sale_items_bought':
      return currentRunStats.saleItemsBought || 0;

    default:
      return 0;
  }
};

/**
 * 称号の達成チェックを行い新規解放があれば更新して返す
 */
export const checkAndUnlockTitles = (stats, currentRunStats) => {
  const currentState = loadTitleState();
  const { unlockedTitles } = currentState;
  let changed = false;

  // 接頭辞チェック
  PREFIX_TITLES.forEach(title => {
    if (!unlockedTitles.prefixes.includes(title.id)) {
      const val = getTitleProgressValue(title, stats, currentRunStats);
      if (val >= title.targetValue) {
        unlockedTitles.prefixes.push(title.id);
        changed = true;
      }
    }
  });

  // 接尾辞チェック
  SUFFIX_TITLES.forEach(title => {
    if (!unlockedTitles.suffixes.includes(title.id)) {
      const val = getTitleProgressValue(title, stats, currentRunStats);
      if (val >= title.targetValue) {
        unlockedTitles.suffixes.push(title.id);
        changed = true;
      }
    }
  });

  // 進化二つ名チェック
  EVOLVED_TITLES.forEach(title => {
    if (!unlockedTitles.evolved.includes(title.id)) {
      const val = getTitleProgressValue(title, stats, currentRunStats);
      if (val >= title.targetValue) {
        unlockedTitles.evolved.push(title.id);
        changed = true;
      }
    }
  });

  if (changed) {
    saveTitleState(currentState);
  }
  return currentState;
};
