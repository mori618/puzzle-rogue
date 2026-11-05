import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { PREFIX_TITLES, SUFFIX_TITLES } from './constants/titles.js';
import { isPlayToken, countPlayTokens, PLAY_TOKEN_IDS, getTokenDescription, isProbabilityToken } from './utils/tokenUtils.js';
import { saveTitleState, resetTitleCache, getActiveTitleEffects, recordTitleProgress, loadTitleState } from './utils/titleManager.js';

const findBase = (id) => ALL_TOKEN_BASES.find(t => t.id === id);

describe('遊び系トークン', () => {
  it('遊び系トークンのIDはすべて定義済みで、説明文に【遊び】が付く', () => {
    PLAY_TOKEN_IDS.forEach(id => {
      const t = findBase(id);
      expect(t, id).toBeDefined();
      expect(t.desc.startsWith('【遊び】'), id).toBe(true);
    });
    // 【遊び】と書かれたトークンはすべて遊び系として判定される
    ALL_TOKEN_BASES.filter(t => t.desc?.startsWith('【遊び】')).forEach(t => {
      expect(isPlayToken(t), t.id).toBe(true);
    });
  });

  it('遊び系トークンの数を数える', () => {
    const tokens = [findBase('gamble'), null, findBase('minigame_dice'), findBase('rabbit_passive'), findBase('play_count_mult')];
    expect(countPlayTokens(tokens)).toBe(3);
    expect(isPlayToken(null)).toBe(false);
  });

  it('ギャンブル系は★1、強化版は★2', () => {
    expect(findBase('gamble').rarity).toBe(1);
    expect(findBase('passive_star_gamble').rarity).toBe(1);
    expect(findBase('passive_token_gamble').rarity).toBe(1);
    expect(findBase('gamble_high').rarity).toBe(2);
    expect(findBase('passive_star_gamble_2').rarity).toBe(2);
    expect(findBase('passive_token_gamble_2').rarity).toBe(2);
  });

  it('大博打: 宝箱の中身とダブルアップ確率', () => {
    const t = findBase('gamble_high');
    expect(t.action).toBe('gamble');
    expect(t.params.chests).toEqual(['triple', 'nothing', 'quarter']);
    expect(t.params.win).toBe('triple');
    expect(t.params.doubleChests).toEqual(['quintuple', 'levelup2', 'twentieth']);
    expect(getTokenDescription({ ...t, level: 3 }, 3)).toContain('50%');
  });

  it('★2のダイス・砥石は確率系トークンとしても扱われ、効果が強化されている', () => {
    const dice = findBase('passive_star_gamble_2');
    const stone = findBase('passive_token_gamble_2');
    expect(isProbabilityToken(dice)).toBe(true);
    expect(isProbabilityToken(stone)).toBe(true);
    expect(dice.params.goodMult).toBeGreaterThan(1.5);
    expect(dice.params.badMult).toBeLessThan(0.5);
    expect(stone.params.count).toBe(2);
  });

  it('負けの美学: カウントが説明文に表示される', () => {
    const t = findBase('play_loss_mult');
    expect(getTokenDescription({ ...t, level: 1, charge: 4 }, 1)).toContain('現在: 4回');
  });
});

describe('遊び系の二つ名', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('A75 酔狂な / B76 遊び人 が定義されている', () => {
    expect(PREFIX_TITLES.find(t => t.id === 'A75')?.name).toBe('酔狂な');
    expect(SUFFIX_TITLES.find(t => t.id === 'B76')?.name).toBe('遊び人');
  });

  it('装備すると効果が有効になる', () => {
    saveTitleState({
      unlockedTitles: { prefixes: ['A75'], suffixes: ['B76'], evolved: [] },
      equippedTitle: { prefixId: 'A75', suffixId: 'B76' },
      progress: {},
    });
    const effects = getActiveTitleEffects();
    expect(effects).toContainEqual(expect.objectContaining({ type: 'play_effect_double' }));
    expect(effects).toContainEqual(expect.objectContaining({ type: 'shop_play_weight', value: 3 }));
  });

  it('解放条件の進捗で解放される', () => {
    recordTitleProgress({ max: { play_tokens_max: 3 }, add: { play_bad_outcomes: 10 } });
    const { prefixes, suffixes } = loadTitleState().unlockedTitles;
    expect(prefixes).toContain('A75');
    expect(suffixes).toContain('B76');
  });
});
