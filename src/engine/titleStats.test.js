import { describe, it, expect } from 'vitest';
import { statsOnTurnEnd, statsOnCycleClear, statsOnHoldingsChange, statsOnEvent, findNewlyUnlockedTitles } from './titleStats.js';
import { PREFIX_TITLES, SUFFIX_TITLES, EVOLVED_TITLES, getTitleProgress } from '../constants/titles.js';

const EMPTY = { prefixes: [], suffixes: [], evolved: [] };

describe('titleStats', () => {
  it('手番の終わり: 残り時間・移動距離・落ちコンなしのコンボを記録する', () => {
    const { stats, run } = statsOnTurnEnd({}, {}, {
      remainingTimeMs: 3500, rawCombo: 7, effectiveCombo: 7, bonus: 0,
      colorComboCounts: { fire: 2, water: 1 }, hasSkyfallCombo: false, moveDistance: 52,
      enhancedErased: 2, starDropsErased: 1, maxSingleColorOnBoard: 12, skillsUsedThisTurn: 1,
      equippedTitle: {},
    });
    expect(run.maxRemainingTimeSec).toBe(3.5);
    expect(run.maxMoveDistance).toBe(52);
    expect(stats.lifetimeNoSkyfallCombo).toBe(7);
    expect(stats.lifetimePlusDropsErased).toBe(2);
  });

  it('サイクルクリア: ボス（5の倍数）と★0クリアを記録する', () => {
    const { stats, run } = statsOnCycleClear({}, {}, { cycle: 5, turn: 1, remainingTimeMs: 6000, stars: 0, tokens: [], equippedTitle: {} });
    expect(stats.lifetimeBossesDefeated).toBe(1);
    expect(stats.lifetimeQuickFinishes).toBe(1);
    expect(run.clearedWithZeroStar).toBe(true);
    expect(run.firstTurnClearCycle).toBe(true);
    expect(run.soloMaxCycle).toBe(5);
  });

  it('所持の変化: 呪い・Lv3・同属性の最大数を記録する', () => {
    const run = statsOnHoldingsChange({}, {
      tokens: [
        { type: 'curse', attributes: [] }, { type: 'passive', level: 3, attributes: ['fire'] },
        { type: 'passive', level: 3, attributes: ['fire'] }, { type: 'passive', level: 1, attributes: ['fire'] },
      ],
      stars: 120,
      equippedTitle: {},
    });
    expect(run.maxCursesEquipped).toBe(1);
    expect(run.maxLv3Tokens).toBe(2);
    expect(run.maxSameAttrTokens).toBe(3);
    expect(run.maxStarsHeld).toBe(120);
  });

  it('回数系の出来事を数える', () => {
    let s = {};
    s = statsOnEvent(s, {}, 'shop_purchase', { isSale: true }).stats;
    s = statsOnEvent(s, {}, 'token_sold', { isCurse: true }).stats;
    s = statsOnEvent(s, {}, 'skill_converted', { toColor: 'fire', count: 12 }).stats;
    expect(s).toMatchObject({ lifetimeShopPurchases: 1, lifetimeSalePurchases: 1, lifetimeTokensSold: 1, lifetimeCursesSold: 1, lifetimeFireSkillConverted: 12 });
  });

  it('解放条件を満たしたパーツだけを返し、上位パーツは元のパーツが必要', () => {
    const found = findNewlyUnlockedTitles(EMPTY, { lifetimeClears: 10 }, { maxRemainingTimeSec: 5, maxTimeLeftWithPrefix: 5 }, {});
    const ids = found.map(f => f.title.id);
    expect(ids).toContain('p_speed');
    expect(ids).toContain('p_desperate');
    expect(ids).not.toContain('evo_light_speed'); // 神速の が未解放
  });

  // 全パーツについて、記録している統計だけで解放条件に到達できることを確認する
  it('全パーツの解放条件が記録済みの統計で到達できる', () => {
    const big = 1e9;
    const stats = new Proxy({ lifetimeDropsErased: { fire: big, water: big, wood: big, light: big, dark: big, heart: big } }, { get: (o, k) => (k in o ? o[k] : big) });
    const run = new Proxy({}, { get: () => big });
    const unreachable = [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES]
      .filter(t => !getTitleProgress(t, stats, run, {}).isAchieved)
      .map(t => t.id);
    expect(unreachable).toEqual([]);
  });
});
