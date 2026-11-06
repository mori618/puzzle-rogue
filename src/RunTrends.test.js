import { describe, it, expect } from 'vitest';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { getTokenTags, TOKEN_TAG_IDS, TOKEN_TAGS } from './constants/tokenTags.js';
import { RUN_TRENDS, pickRunTrend, getRunTrendById, getTrendWeight, resolveRunTrend } from './constants/runTrends.js';

const shopTokens = ALL_TOKEN_BASES.filter(t => !t.isCurse && t.type !== 'curse');
const byId = (id) => ALL_TOKEN_BASES.find(t => t.id === id);

describe('トークンのタグ', () => {
  it('ショップに出る全トークンに1つ以上のタグが付く', () => {
    const untagged = shopTokens.filter(t => getTokenTags(t).length === 0).map(t => t.id);
    expect(untagged).toEqual([]);
  });

  it('タグは定義済みのものだけ', () => {
    shopTokens.forEach(t => getTokenTags(t).forEach(tag => expect(TOKEN_TAG_IDS).toContain(tag)));
  });

  it('代表的なトークンに期待するタグが付く', () => {
    expect(getTokenTags(byId('bonus_1c_fire'))).toEqual(expect.arrayContaining(['attribute', 'multiplier']));
    expect(getTokenTags(byId('power_up'))).toContain('combo_add');
    expect(getTokenTags(byId('minigame_dice'))).toEqual(expect.arrayContaining(['fun', 'probability']));
    expect(getTokenTags(byId('turn_end_spawn_f'))).toEqual(expect.arrayContaining(['probability', 'board']));
    expect(getTokenTags(byId('cross'))).toContain('shape');
    expect(getTokenTags(byId('bonus_6c'))).not.toContain('attribute');
  });

  it('小分類が付いたトークンには親の大分類も付く', () => {
    const tagsOf = (id) => getTokenTags(byId(id));
    expect(tagsOf('gen_bomb_rand')).toEqual(expect.arrayContaining(['bomb', 'special_drop']));
    expect(tagsOf('cross_double_base_mult')).toEqual(expect.arrayContaining(['cross', 'shape']));
    expect(tagsOf('minigame_janken')).toEqual(expect.arrayContaining(['minigame', 'fun']));
    expect(tagsOf('bargain')).toEqual(expect.arrayContaining(['shop', 'economy']));
    shopTokens.forEach(t => getTokenTags(t).forEach(tag => {
      const parent = TOKEN_TAGS[tag].parent;
      if (parent) expect(getTokenTags(t)).toContain(parent);
    }));
  });

  it('細かいタグの代表例', () => {
    const tagsOf = (id) => getTokenTags(byId(id));
    expect(tagsOf('forbidden')).toContain('risk');
    expect(tagsOf('lead_fire')).toContain('slot');
    expect(tagsOf('bonus_5c')).toContain('multi_color');
    expect(tagsOf('board_mono1')).toContain('mono_color');
    expect(tagsOf('sky_f1')).toContain('buff');
    expect(tagsOf('combo_ge_7')).toContain('combo_condition');
    expect(tagsOf('copy_token')).not.toContain('level');
  });

  it('どの傾向も、対象のトークンが1つ以上ある', () => {
    RUN_TRENDS.forEach(trend => {
      Object.keys(trend.tags || {}).forEach(tag => {
        expect(TOKEN_TAG_IDS).toContain(tag);
        expect(shopTokens.some(t => getTokenTags(t).includes(tag))).toBe(true);
      });
    });
  });

  it('トークン定義の tags が優先される', () => {
    expect(getTokenTags({ id: '__test_tags', tags: ['fun'], desc: 'コンボ倍率が2倍' })).toEqual(['fun']);
  });
});

describe('ランごとのショップ傾向', () => {
  it('30パターン以上あり、idが重複しない', () => {
    expect(RUN_TRENDS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(RUN_TRENDS.map(t => t.id)).size).toBe(RUN_TRENDS.length);
  });

  it('抽選結果はセーブできる（JSONで往復しても同じ重みになる）', () => {
    for (let i = 0; i < 50; i++) {
      const trend = pickRunTrend();
      const restored = JSON.parse(JSON.stringify(trend));
      shopTokens.slice(0, 40).forEach(t => expect(getTrendWeight(t, restored)).toBeCloseTo(getTrendWeight(t, trend)));
    }
  });

  it('属性の傾向は、その属性のトークンだけを出やすくする', () => {
    const trend = getRunTrendById('attr_fire');
    expect(getTrendWeight(byId('bonus_1c_fire'), trend)).toBe(3);
    expect(getTrendWeight(byId('bonus_1c_water'), trend)).toBe(1);
    // 6色すべてに関わるトークンは対象外
    expect(getTrendWeight(byId('bonus_6c'), trend)).toBe(1);
  });

  it('タグの傾向は、上昇と低下を組み合わせる', () => {
    const trend = getRunTrendById('tag_multiplier');
    expect(getTrendWeight(byId('bonus_1c_fire'), trend)).toBe(2.5);
    expect(getTrendWeight(byId('power_up'), trend)).toBe(0.7);
  });

  it('傾向がないときは重みを変えない', () => {
    expect(getTrendWeight(byId('bonus_1c_fire'), null)).toBe(1);
    expect(getTrendWeight(byId('bonus_1c_fire'), undefined)).toBe(1);
    expect(getTrendWeight(byId('bonus_1c_fire'), getRunTrendById('plain'))).toBe(1);
  });

  it('気まぐれの傾向は、ラン開始時にタグの偏りを確定させる', () => {
    let seed = 1;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const trend = resolveRunTrend(RUN_TRENDS.find(t => t.random), rng);
    const ups = Object.values(trend.tags).filter(w => w > 1);
    const downs = Object.values(trend.tags).filter(w => w < 1);
    expect(ups.length).toBeGreaterThanOrEqual(2);
    expect(downs.length).toBe(1);
  });
});
