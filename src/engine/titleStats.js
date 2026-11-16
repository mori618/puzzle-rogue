/**
 * 二つ名の解放条件が参照する統計の記録（docs/balance-ui-design.md §5.1・ステップ4）。
 *
 * どれも純関数で、(stats, run) と出来事の内容から「更新後の stats / run」を返す。
 * stats は永続（puzzle_rogue_stats）、run は現在のゲーム中（currentRunStats）。
 * 参照側は src/constants/titles.js の getTitleProgress。
 */

import { PREFIX_TITLES, SUFFIX_TITLES, EVOLVED_TITLES, TITLE_SET_BONUSES, getTitleProgress } from '../constants/titles.js';

const COLORS = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
const max = (a, b) => Math.max(a || 0, b || 0);
const add = (a, b) => (a || 0) + (b || 0);

/** 装備中のパーツ ID（A枠・B枠・特殊）を集合で返す */
const equippedIds = (equippedTitle = {}) =>
  new Set([equippedTitle.prefixId, equippedTitle.suffixId, equippedTitle.evolvedId].filter(Boolean));

/**
 * 手番の終わり。
 * @param {object} t { remainingTimeMs, rawCombo, effectiveCombo, bonus, colorComboCounts, erasedColorCounts,
 *   hasSkyfallCombo, isAllClear, moveDistance, enhancedErased, starDropsErased, maxSingleColorOnBoard,
 *   skillsUsedThisTurn, equippedTitle }
 */
export function statsOnTurnEnd(stats, run, t) {
  const eq = equippedIds(t.equippedTitle);
  const colors = COLORS.filter(c => (t.colorComboCounts?.[c] || 0) > 0);
  const remainSec = (t.remainingTimeMs || 0) / 1000;
  const nextRun = {
    ...run,
    maxRemainingTimeSec: max(run.maxRemainingTimeSec, remainSec),
    maxMoveDistance: max(run.maxMoveDistance, t.moveDistance),
    maxPassiveBonus: max(run.maxPassiveBonus, t.bonus),
    maxComboAddSingle: max(run.maxComboAddSingle, t.bonus),
    maxColorsErasedSingle: max(run.maxColorsErasedSingle, colors.length),
    maxSingleColorBoard: max(run.maxSingleColorBoard, t.maxSingleColorOnBoard),
    maxSkillsUsedSingleTurn: max(run.maxSkillsUsedSingleTurn, t.skillsUsedThisTurn),
  };
  if (colors.length === 2 && (t.effectiveCombo || 0) >= 30) nextRun.achievedTwoColor30Combo = true;
  // 五彩の器（トークン）用: 5色以上を同時に消した手番の数
  if (colors.length >= 5) nextRun.fiveColorTurns = (run.fiveColorTurns || 0) + 1;
  if (eq.has('p_speed')) nextRun.maxTimeLeftWithPrefix = max(run.maxTimeLeftWithPrefix, remainSec);
  if (eq.has('p_berserk') && (t.remainingTimeMs || 0) < 1000) nextRun.asuraChallengeCombo = max(run.asuraChallengeCombo, t.effectiveCombo);
  if (eq.has('p_amp')) nextRun.maxComboWithPrefix = max(run.maxComboWithPrefix, t.effectiveCombo);
  if (t.isAllClear && colors.length === 1 && colors[0] === 'fire' && (t.erasedColorCounts?.fire || 0) >= 30) {
    nextRun.allEnhancedFireClear = true;
  }

  const nextStats = {
    ...stats,
    lifetimePlusDropsErased: add(stats.lifetimePlusDropsErased, t.enhancedErased),
    lifetimeStarDropsErased: add(stats.lifetimeStarDropsErased, t.starDropsErased),
  };
  if (!t.hasSkyfallCombo) nextStats.lifetimeNoSkyfallCombo = add(stats.lifetimeNoSkyfallCombo, t.rawCombo);
  return { stats: nextStats, run: nextRun };
}

/**
 * サイクルクリア（目標到達）。ボスは「サイクル5の倍数」（D7）。
 * @param {object} c { cycle, turn, remainingTimeMs, stars, tokens, equippedTitle }
 */
export function statsOnCycleClear(stats, run, c) {
  const eq = equippedIds(c.equippedTitle);
  const tokenCount = (c.tokens || []).filter(Boolean).length;
  const curseCount = (c.tokens || []).filter(t => t && t.type === 'curse').length;
  const isBoss = c.cycle % 5 === 0;
  const nextRun = { ...run };
  if ((c.remainingTimeMs || 0) <= 2000) nextRun.clearedWithLowTime = true;
  if (c.stars === 0) nextRun.clearedWithZeroStar = true;
  if (c.turn === 1) nextRun.firstTurnClearCycle = true;
  if (c.cycle === 1 && c.turn === 1) nextRun.cycle1OneTurnClear = true;
  if (tokenCount <= 3) nextRun.soloMaxCycle = max(run.soloMaxCycle, c.cycle);
  if (eq.has('p_empty') && c.stars === 0) nextRun.zeroStarBossClearCycle = max(run.zeroStarBossClearCycle, c.cycle);
  if (isBoss && c.turn === 1 && curseCount >= 5) nextRun.fiveCursesBoss1Turn = true;

  const nextStats = { ...stats };
  if ((c.remainingTimeMs || 0) >= 5000) nextStats.lifetimeQuickFinishes = add(stats.lifetimeQuickFinishes, 1);
  if (isBoss) nextStats.lifetimeBossesDefeated = add(stats.lifetimeBossesDefeated, 1);
  return { stats: nextStats, run: nextRun };
}

/** 所持トークン・所持スターの変化（装備数・同属性・Lv3・スキルのみ・所持★の最大値） */
export function statsOnHoldingsChange(run, h) {
  const tokens = (h.tokens || []).filter(Boolean);
  const attrCounts = {};
  tokens.forEach(t => (t.attributes || []).forEach(a => { attrCounts[a] = (attrCounts[a] || 0) + 1; }));
  const eq = equippedIds(h.equippedTitle);
  const next = {
    ...run,
    maxTokensEquipped: max(run.maxTokensEquipped, tokens.length),
    maxCursesEquipped: max(run.maxCursesEquipped, tokens.filter(t => t.type === 'curse').length),
    maxSameAttrTokens: max(run.maxSameAttrTokens, Math.max(0, ...Object.values(attrCounts))),
    maxLv3Tokens: max(run.maxLv3Tokens, tokens.filter(t => (t.level || 1) >= 3).length),
    maxActiveSkillsEquipped: tokens.every(t => t.type === 'skill')
      ? max(run.maxActiveSkillsEquipped, tokens.length) : (run.maxActiveSkillsEquipped || 0),
    maxStarsHeld: max(run.maxStarsHeld, h.stars),
  };
  if (eq.has('s_thrifty')) next.maxStarsWithSuffix = max(run.maxStarsWithSuffix, h.stars);
  return next;
}

/**
 * ショップ・スキル・スター獲得など、回数を数えるだけの出来事。
 * @param {'shop_visit'|'shop_purchase'|'shop_reroll'|'token_sold'|'token_level_up'|'skill_used'|'skill_converted'|'stars_earned'} kind
 */
export function statsOnEvent(stats, run, kind, detail = {}) {
  const s = { ...stats };
  const r = { ...run };
  switch (kind) {
    case 'shop_visit': s.lifetimeShopVisits = add(s.lifetimeShopVisits, 1); break;
    case 'shop_purchase':
      s.lifetimeShopPurchases = add(s.lifetimeShopPurchases, 1);
      if (detail.isSale) s.lifetimeSalePurchases = add(s.lifetimeSalePurchases, 1);
      break;
    case 'shop_reroll': s.lifetimeShopRerolls = add(s.lifetimeShopRerolls, 1); break;
    case 'token_sold':
      s.lifetimeTokensSold = add(s.lifetimeTokensSold, 1);
      if (detail.isCurse) s.lifetimeCursesSold = add(s.lifetimeCursesSold, 1);
      break;
    case 'token_level_up': s.lifetimeTokenLevelUps = add(s.lifetimeTokenLevelUps, 1); break;
    case 'skill_used': s.lifetimeSkillsUsed = add(s.lifetimeSkillsUsed, 1); break;
    case 'skill_converted':
      if (detail.toColor === 'fire') s.lifetimeFireSkillConverted = add(s.lifetimeFireSkillConverted, detail.count);
      r.maxSkillConvertSingle = max(r.maxSkillConvertSingle, detail.count);
      break;
    case 'stars_earned': s.lifetimeStarsEarned = add(s.lifetimeStarsEarned, detail.amount); break;
    default: break;
  }
  return { stats: s, run: r };
}

/**
 * 新しく解放条件を満たしたパーツを返す（まだ解放していないものだけ）。
 * @returns {Array<{ title: object, pool: 'prefixes'|'suffixes'|'evolved' }>}
 */
export function findNewlyUnlockedTitles(unlocked, stats, run, equippedTitle = {}) {
  const pools = [
    { pool: 'prefixes', list: [...PREFIX_TITLES, ...EVOLVED_TITLES.filter(e => e.slotType === 'prefix')] },
    { pool: 'suffixes', list: [...SUFFIX_TITLES, ...EVOLVED_TITLES.filter(e => e.slotType === 'suffix')] },
    { pool: 'evolved', list: EVOLVED_TITLES.filter(e => e.slotType === 'special') },
  ];
  const found = [];
  pools.forEach(({ pool, list }) => {
    list.forEach(title => {
      if ((unlocked[pool] || []).includes(title.id)) return;
      if (title.requiredPrefix && !(unlocked.prefixes || []).includes(title.requiredPrefix)) return;
      if (title.requiredSuffix && !(unlocked.suffixes || []).includes(title.requiredSuffix)) return;
      if (title.requiredSet) {
        const setDef = TITLE_SET_BONUSES.find(x => x.id === title.requiredSet);
        if (!setDef || equippedTitle.prefixId !== setDef.prefixId || equippedTitle.suffixId !== setDef.suffixId) return;
      }
      if (getTitleProgress(title, stats, run, equippedTitle).isAchieved) found.push({ title, pool });
    });
  });
  return found;
}
