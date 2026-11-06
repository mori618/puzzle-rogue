// 遊びトークンの実績（記録・実績画面）と、追加の二つ名（遊び・タグ）のテスト
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PREFIX_TITLES, SUFFIX_TITLES } from './constants/titles.js';
import { TOKEN_TAGS } from './constants/tokenTags.js';
import {
  PLAY_PREFIX_TITLES, PLAY_SUFFIX_TITLES, TAG_PREFIX_TITLES, TAG_SUFFIX_TITLES, TITLE_TAGS, tagTitleProgressKey,
} from './constants/titlesExtra.js';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import {
  getTokenTitleCounts, getTitlePerCount, getTitleShopTokenWeight, getTitleSkillCostReduction,
  computeTitleComboModifiers, saveTitleState, resetTitleCache, recordTitleProgress, loadTitleState,
} from './utils/titleManager.js';
import {
  getMinigameProgressUpdates, fishCountKey, fishRecordKey, targetHitKey, diceFaceKey, minigamePlayKey,
  boostRewards, addJankenWinStars, getGambleLuxuryChance, rollGambleLuxury, GAMBLE_LUXURY_BASE_CHANCE,
} from './utils/minigames.js';
import { buildPlayRecordSections } from './utils/playRecords.js';
import StatsScreen from './StatsScreen.jsx';

const base = (id) => ALL_TOKEN_BASES.find(t => t.id === id);
const findTitle = (id) => [...PREFIX_TITLES, ...SUFFIX_TITLES].find(t => t.id === id);

beforeEach(() => {
  localStorage.clear();
  resetTitleCache();
});

describe('追加の二つ名', () => {
  it('遊びトークンの二つ名がA枠・B枠に入っている', () => {
    PLAY_PREFIX_TITLES.forEach(t => expect(PREFIX_TITLES).toContain(t));
    PLAY_SUFFIX_TITLES.forEach(t => expect(SUFFIX_TITLES).toContain(t));
    expect(findTitle('A76').name).toBe('釣り好きの');
    expect(findTitle('A77').name).toBe('ハイな');
    expect(findTitle('B77').name).toBe('スナイパー');
    expect(findTitle('B78').name).toBe('ブリーダー');
    expect(findTitle('B79').name).toBe('狩人');
  });

  it('遊びトークンの二つ名が参照するトークンは実在する', () => {
    [...PLAY_PREFIX_TITLES, ...PLAY_SUFFIX_TITLES].forEach(t => {
      t.effects.filter(e => e.type === 'shop_token_weight').forEach(e => {
        e.ids.forEach(id => expect(base(id), `${t.name}: ${id}`).toBeTruthy());
      });
    });
  });

  it('タグの二つ名は、遊び・確率・属性以外のすべてのタグに1つずつある', () => {
    const tagTitles = [...TAG_PREFIX_TITLES, ...TAG_SUFFIX_TITLES];
    const expected = Object.keys(TOKEN_TAGS).filter(t => !['fun', 'probability', 'attribute'].includes(t));
    expect([...TITLE_TAGS].sort()).toEqual([...expected].sort());
    expect(tagTitles).toHaveLength(expected.length);
    tagTitles.forEach(t => {
      expect(TOKEN_TAGS[t.tag], t.name).toBeTruthy();
      expect(t.conditionType).toBe(tagTitleProgressKey(t.tag));
      expect(t.effects[0]).toEqual({ type: 'shop_tag_weight', tag: t.tag, value: 3 });
      expect(t.effects[1], t.name).toBeTruthy();
      expect(t.desc).toContain(`【${TOKEN_TAGS[t.tag].label}】`);
    });
  });

  it('タグの二つ名の解放条件は、そのタグのトークンの種類数で達成できる', () => {
    [...TAG_PREFIX_TITLES, ...TAG_SUFFIX_TITLES].forEach(t => {
      const kinds = ALL_TOKEN_BASES.filter(b => !b.isCurse && b.type !== 'curse' && getTokenTitleCounts([b]).tagCounts[t.tag]);
      expect(kinds.length, t.name).toBeGreaterThanOrEqual(t.targetValue);
    });
  });
});

describe('二つ名の効果（ショップ出現率・タグ）', () => {
  it('shop_token_weight: 指定トークンだけ重みが変わる（1未満で出にくい）', () => {
    const effects = findTitle('B78').effects; // ブリーダー
    expect(getTitleShopTokenWeight(base('rabbit_passive'), effects)).toBe(3);
    expect(getTitleShopTokenWeight(base('rabbit_active'), effects)).toBe(3);
    expect(getTitleShopTokenWeight(base('wolf_active'), effects)).toBeCloseTo(1 / 3);
    expect(getTitleShopTokenWeight(base('minigame_fishing'), effects)).toBe(1);
  });

  it('狩人: うさぎも狼も出やすくなる', () => {
    const effects = findTitle('B79').effects;
    expect(getTitleShopTokenWeight(base('rabbit_passive'), effects)).toBe(2);
    expect(getTitleShopTokenWeight(base('wolf_active'), effects)).toBe(2);
  });

  it('shop_tag_weight: そのタグのトークンだけ出やすくなる', () => {
    const effects = [{ type: 'shop_tag_weight', tag: 'bomb', value: 3 }];
    const bomb = ALL_TOKEN_BASES.find(t => getTokenTitleCounts([t]).tagCounts.bomb);
    expect(getTitleShopTokenWeight(bomb, effects)).toBe(3);
    expect(getTitleShopTokenWeight(base('minigame_janken'), effects)).toBe(1);
  });

  it('tag_token: 所持しているタグのトークン数で効果が増える', () => {
    const tokens = [base('minigame_janken'), base('minigame_fishing'), base('minigame_dice')];
    const counts = getTokenTitleCounts(tokens);
    expect(counts.tagCounts.minigame).toBe(3);
    const effect = { type: 'combo_add', value: 2, per: 'tag_token', tag: 'minigame', max: 2 };
    expect(getTitlePerCount('tag_token', { tokenCounts: counts }, effect)).toBe(3);
    const mods = computeTitleComboModifiers({ tokenCounts: counts }, [effect]);
    expect(mods.comboAdd).toBe(4); // 最大2個分
  });

  it('skill_cost_sub に tag を指定すると、そのタグのアクティブだけ軽くなる', () => {
    const effects = [{ type: 'skill_cost_sub', value: 1, tag: 'minigame' }];
    expect(getTitleSkillCostReduction(base('minigame_janken'), effects)).toBe(1);
    expect(getTitleSkillCostReduction(base('wolf_active'), effects)).toBe(0);
  });

  it('タグの二つ名: 同時所持数を記録すると解放される', () => {
    const t = TAG_PREFIX_TITLES.find(x => x.tag === 'minigame');
    recordTitleProgress({ max: { [tagTitleProgressKey('minigame')]: t.targetValue } });
    const state = loadTitleState();
    expect(state.unlockedTitles.prefixes).toContain(t.id);
  });
});

describe('ミニゲームの記録', () => {
  it('じゃんけん: 最大連勝数・累計勝ち数', () => {
    const u = getMinigameProgressUpdates('janken', { streak: 4, drawBonus: 1 });
    expect(u.add[minigamePlayKey('janken')]).toBe(1);
    expect(u.max.janken_streak_max).toBe(4);
    expect(u.add.janken_wins_total).toBe(4);
    expect(u.add.janken_draw_bonus).toBe(1);
  });

  it('釣り: 魚ごとの数と最大サイズ（2匹同時も数える）', () => {
    const u = getMinigameProgressUpdates('fishing_big', { fishes: [{ id: 'tuna', size: 200 }, { id: 'tuna', size: 150 }] });
    expect(u.add[fishCountKey('tuna')]).toBe(2);
    expect(u.add.fish_caught_total).toBe(2);
    expect(u.max[fishRecordKey('tuna')]).toBe(200);
    expect(u.add.fish_double_catches).toBe(1);
    // 通常の釣り（サイズなし・旧形式の logInfo）
    const u2 = getMinigameProgressUpdates('fishing', { fish: 'boot' });
    expect(u2.add[fishCountKey('boot')]).toBe(1);
    expect(u2.max[fishRecordKey('boot')]).toBeUndefined();
  });

  it('的当て: 中心に当てた回数', () => {
    expect(getMinigameProgressUpdates('target', { result: 'bullseye' }).add.target_center_hits).toBe(1);
    expect(getMinigameProgressUpdates('target_pro', { result: 'core' }).add.target_center_hits).toBe(1);
    const miss = getMinigameProgressUpdates('target', { result: 'miss' });
    expect(miss.add.target_center_hits).toBeUndefined();
    expect(miss.add[targetHitKey('miss')]).toBe(1);
  });

  it('ハイアンドロー: 最大連勝数（負けても記録）・勝ち逃げ', () => {
    const lost = getMinigameProgressUpdates('highlow', { wins: 3, lost: true });
    expect(lost.max.highlow_wins_max).toBe(3);
    expect(lost.add.highlow_busts).toBe(1);
    const stop = getMinigameProgressUpdates('highlow', { wins: 2, lost: false });
    expect(stop.add.highlow_cashouts).toBe(1);
    expect(stop.max.highlow_cashout_max).toBe(2);
  });

  it('サイコロ・デーモン・連打・ランニング', () => {
    const dd = getMinigameProgressUpdates('dice_duo', { faces: [5, 5] });
    expect(dd.add[diceFaceKey(5)]).toBe(2);
    expect(dd.add.dice_doubles).toBe(1);
    expect(getMinigameProgressUpdates('demon', { winner: 'player' }).add.demon_wins).toBe(1);
    expect(getMinigameProgressUpdates('mash_duo', { taps: 70 }).max.mash_taps_max).toBe(70);
    const run = getMinigameProgressUpdates('running', { meters: 1000, cleared: true });
    expect(run.max.running_meters_max).toBe(1000);
    expect(run.add.running_clears).toBe(1);
  });

  it('記録で遊びの二つ名が解放される', () => {
    recordTitleProgress(getMinigameProgressUpdates('highlow', { wins: 3, lost: true }));
    expect(loadTitleState().unlockedTitles.prefixes).toContain('A77'); // ハイな
    for (let i = 0; i < 10; i++) recordTitleProgress(getMinigameProgressUpdates('target', { result: 'bullseye' }));
    expect(loadTitleState().unlockedTitles.suffixes).toContain('B77'); // スナイパー
  });
});

describe('二つ名で強くなるミニゲーム', () => {
  it('スナイパー: 中心に当てたときの効果アップ', () => {
    const r = boostRewards([
      { type: 'mult', value: 3, duration: 3 }, { type: 'stars_add', value: 30 }, { type: 'levelup', value: 1 },
    ], 1.5);
    expect(r).toEqual([
      { type: 'mult', value: 4, duration: 3 }, { type: 'stars_add', value: 45 }, { type: 'levelup', value: 2 },
    ]);
  });

  it('良い効果だけ強める（代償・全回復はそのまま）', () => {
    const rewards = [
      { type: 'stars_mult', value: 0.5 }, { type: 'mult', value: 0.5, duration: 2 },
      { type: 'energy', value: 4 }, { type: 'energy', value: 99 }, { type: 'stars_mult', value: 2 },
    ];
    expect(boostRewards(rewards, 1.5)).toEqual([
      { type: 'stars_mult', value: 0.5 }, { type: 'mult', value: 0.5, duration: 2 },
      { type: 'energy', value: 6 }, { type: 'energy', value: 99 }, { type: 'stars_mult', value: 2.5 },
    ]);
    expect(boostRewards(rewards, 1)).toBe(rewards);
  });

  it('遊びの二つ名は、遊び方を変える効果を持たない（効果が増えるだけ）', () => {
    const ruleChanging = ['mash_extra_ms', 'run_meter_mult', 'demon_start_charge', 'dice_one_null', 'gamble_doubleup_add'];
    [...PLAY_PREFIX_TITLES, ...PLAY_SUFFIX_TITLES].forEach(t => {
      t.effects.forEach(e => expect(ruleChanging, `${t.name}: ${e.type}`).not.toContain(e.type));
    });
    const boosted = [...PLAY_PREFIX_TITLES, ...PLAY_SUFFIX_TITLES]
      .flatMap(t => t.effects.filter(e => e.type === 'minigame_reward_boost').map(e => [t.name, e.games]));
    expect(boosted).toEqual([
      ['韋駄天の', ['running']], ['連打の', ['mash', 'mash_duo']], ['賽振り', ['dice', 'dice_duo']], ['悪魔祓い', ['demon']],
    ]);
  });

  it('豪華な宝箱: 基本10%、トレジャーハンターで+25%', () => {
    expect(GAMBLE_LUXURY_BASE_CHANCE).toBe(0.1);
    expect(getGambleLuxuryChance()).toBe(0.1);
    const th = findTitle('B82');
    expect(th.name).toBe('トレジャーハンター');
    const add = th.effects.find(e => e.type === 'gamble_luxury_chance').value;
    expect(getGambleLuxuryChance(add)).toBeCloseTo(0.35);
    expect(getGambleLuxuryChance(5)).toBe(1);
  });

  it('豪華な宝箱: 外れたら null、当たればプラス効果（ダブルアップでは2倍）', () => {
    const seq = (...vals) => { let i = 0; return () => vals[i++]; };
    expect(rollGambleLuxury(0.1, 'first', seq(0.5))).toBeNull();
    expect(rollGambleLuxury(0.1, 'first', seq(0.05, 0))).toEqual([{ type: 'stars_add', value: 20 }]);
    expect(rollGambleLuxury(0.1, 'double', seq(0.05, 0))).toEqual([{ type: 'stars_add', value: 40 }]);
    for (let i = 0; i < 50; i++) {
      const r = rollGambleLuxury(1, 'first');
      expect(r.length).toBeGreaterThan(0);
      r.forEach(x => expect(['stars_add', 'combo_add', 'energy', 'mult', 'levelup']).toContain(x.type));
    }
  });

  it('負け知らずの: 勝ち1回につきスター', () => {
    expect(addJankenWinStars([], 3, 5)).toEqual([{ type: 'stars_add', value: 15 }]);
    expect(addJankenWinStars([], 0, 5)).toEqual([]);
  });
});

describe('実績画面（遊びトークン）', () => {
  it('遊んだことのないゲーム・釣ったことのない魚・0回の項目は隠す', () => {
    const sections = buildPlayRecordSections({
      [minigamePlayKey('fishing')]: 2,
      [fishCountKey('tuna')]: 2,
      fish_caught_total: 2,
    });
    const fishing = sections.find(s => s.id === 'fishing');
    expect(fishing.plays).toBe(2);
    expect(fishing.fish.map(f => f.id)).toEqual(['tuna']);
    expect(fishing.rows.find(([label]) => label === '2匹同時に釣れた')).toBeUndefined();
    expect(sections.find(s => s.id === 'janken').plays).toBe(0);
  });

  it('タブで遊びトークンの記録に切り替えられる', () => {
    saveTitleState({
      unlockedTitles: { prefixes: [], suffixes: [], evolved: [] },
      equippedTitle: {},
      progress: {
        [minigamePlayKey('fishing_big')]: 1, [fishCountKey('tuna')]: 1, [fishRecordKey('tuna')]: 256, fish_caught_total: 1,
        [minigamePlayKey('highlow')]: 3, highlow_wins_max: 4,
      },
    });
    render(<StatsScreen currentRunStats={{}} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('stats-tab-play'));
    expect(screen.getByTestId('play-record-fishing')).toBeInTheDocument();
    expect(screen.getByTestId('play-record-highlow')).toHaveTextContent('最大連勝数');
    expect(screen.getByTestId('play-record-fish-list')).toHaveTextContent('マグロ');
    expect(screen.getByTestId('play-record-fish-list')).toHaveTextContent('2.56m');
    // 釣ったことのない魚・遊んだことのないゲームは出さない
    expect(screen.getByTestId('play-record-fish-list')).not.toHaveTextContent('伝説の魚');
    expect(screen.queryByTestId('play-record-janken')).toBeNull();
    expect(screen.getByTestId('play-records-hidden')).toBeInTheDocument();
  });
});
