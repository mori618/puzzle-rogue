import { describe, it, expect, beforeEach } from 'vitest';
import {
  PREFIX_TITLES,
  SUFFIX_TITLES,
  EVOLVED_TITLES,
} from '../constants/titles.js';
import {
  loadTitleState,
  saveTitleState,
  resetTitleCache,
  getEquippedTitleInfo,
  getActiveTitleEffects,
  recordTitleProgress,
  recordTitleTrigger,
  subscribeTitleUnlock,
  computeTitleComboModifiers,
  applyTitleTimeLimit,
  applyTitleSpawnWeights,
  getTitleSkillCostReduction,
  getTitleEffectTotal,
  getTitleEffectProduct,
  getTokenTitleCounts,
  evaluateTitleWhen,
  getTitleProgressValue,
  applyTitlePassiveSeal,
  isTitleSealedActive,
  getTitleSkillCostFixed,
  getTitlePassiveDoubleChance,
  rollTitleDoubledPassives,
  joinTitleName,
  isTitleDisabled,
  countUnlockedTitles,
  getTitleNewTokenLevel,
  applyTitleRerollPrice,
  VISIBLE_PREFIX_TITLES,
  VISIBLE_SUFFIX_TITLES,
  isTitleEquipped,
  getEquippedPrefixAttribute,
  describeRequiredTitles,
  isEvolvedBaseUnlocked,
  VISIBLE_EVOLVED_TITLES,
  getTitleSkillFizzleChance,
} from './titleManager.js';

const STORAGE_KEY = 'pazuru_roguelike_title_state';

const unlockAndEquip = ({ prefixes = [], suffixes = [], evolved = [], prefixId = null, suffixId = null }) => {
  saveTitleState({
    unlockedTitles: { prefixes, suffixes, evolved },
    equippedTitle: { prefixId, suffixId },
    progress: {},
  });
};

describe('二つ名マスターデータ', () => {
  it('全192件・ID重複なし（セットシナジーは廃止・B61 継承者は削除）', () => {
    const all = [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES];
    expect(all).toHaveLength(192);
    expect(new Set(all.map(t => t.id)).size).toBe(192);
    expect(EVOLVED_TITLES).toHaveLength(50);
  });

  it('6属性すべてが同じ構成（A枠・詠唱・B枠・進化）を持つ', () => {
    const colors = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
    const prefixOf = Object.fromEntries(colors.map(c => [c, PREFIX_TITLES.find(t => t.effects.some(e => e.type === 'spawn_weight' && e.color === c))]));
    colors.forEach(c => {
      expect(prefixOf[c], c).toBeTruthy();
      expect(PREFIX_TITLES.filter(t => t.effects.some(e => e.type === 'skill_cost_sub' && e.attribute === c)), c).toHaveLength(1);
      expect(SUFFIX_TITLES.filter(t => t.effects.some(e => e.per === 'attr_token' && e.attribute === c)), c).toHaveLength(1);
      expect(prefixOf[c].attribute, c).toBe(c);
      const evo = EVOLVED_TITLES.filter(t => t.requiredTitleIds.length === 1 && t.requiredTitleIds[0] === prefixOf[c].id);
      expect(evo, c).toHaveLength(1);
      expect(evo[0].effects.some(e => e.type === 'add_mult' && e.value === 5.0 && e.when?.color === c), c).toBe(true);
    });
  });

  it('仮置きデータが残っていない', () => {
    const all = [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES];
    all.forEach(t => {
      const text = `${t.name || ''}${t.desc}${t.conditionDesc || ''}`;
      expect(text).not.toMatch(/特殊達成条件|特殊シナジー|超越称号|パターン #|_\d+$/);
    });
  });

  it('全ての二つ名が効果と正の目標値を持つ（最初から解放済みのものを除く）', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].forEach(t => {
      expect(t.effects?.length, t.id).toBeGreaterThan(0);
      if (t.initial) return;
      expect(t.targetValue, t.id).toBeGreaterThan(0);
      expect(typeof t.conditionType, t.id).toBe('string');
    });
  });

  it('進化二つ名の形（slot・requiredTitleIds・requireMode）が正しい', () => {
    const ids = new Set([...PREFIX_TITLES, ...SUFFIX_TITLES].map(t => t.id));
    EVOLVED_TITLES.forEach(e => {
      expect(['prefix', 'suffix'], e.id).toContain(e.slot);
      expect(['equipped', 'unlocked'], e.id).toContain(e.requireMode);
      expect(e.requiredTitleIds.length, e.id).toBeGreaterThan(0);
      e.requiredTitleIds.flat().forEach(id => expect(ids.has(id), `${e.id}:${id}`).toBe(true));
      expect(e.category, e.id).toBe(e.slot === 'prefix' ? 'A枠上位' : 'B枠上位');
      // A枠は1つしか装備できないので、「装備して」の条件に A枠（B枠）を2つ以上入れない
      if (e.requireMode === 'equipped') {
        const singles = e.requiredTitleIds.filter(x => typeof x === 'string');
        const groups = e.requiredTitleIds.filter(Array.isArray);
        const countA = singles.filter(x => x.startsWith('A')).length + groups.filter(g => g[0].startsWith('A')).length;
        const countB = singles.filter(x => x.startsWith('B')).length + groups.filter(g => g[0].startsWith('B')).length;
        expect(countA, e.id).toBeLessThanOrEqual(1);
        expect(countB, e.id).toBeLessThanOrEqual(1);
      }
      if (e.trigger) expect(['turn', 'clear', 'state', 'shop'], e.id).toContain(e.trigger.event);
    });
  });

  it('接頭辞と接尾辞の連結', () => {
    expect(joinTitleName('神速の', '覇王')).toBe('神速の覇王');
    expect(joinTitleName('紅蓮の詠唱', '覇王')).toBe('紅蓮の詠唱・覇王');
  });
});

describe('二つ名の状態管理', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('初期状態は「駆け出しの」「初心者」だけが解放・装備済み', () => {
    const state = loadTitleState();
    expect(state.unlockedTitles.prefixes).toEqual(['A62']);
    expect(state.unlockedTitles.suffixes).toEqual(['B62']);
    expect(state.unlockedTitles.evolved).toEqual([]);
    expect(state.equippedTitle).toEqual({ prefixId: 'A62', suffixId: 'B62' });
    expect(getActiveTitleEffects().filter(e => e.type === 'time_add').reduce((s, e) => s + e.value, 0)).toBe(2000);
  });

  it('既存のセーブデータにも「駆け出しの」「初心者」が解放され、装備は上書きしない', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedTitles: { prefixes: ['A01'], suffixes: [], evolved: [] },
      equippedTitle: { prefixId: 'A01', suffixId: null },
      progress: {},
    }));
    resetTitleCache();
    const state = loadTitleState();
    expect(state.unlockedTitles.prefixes).toEqual(expect.arrayContaining(['A01', 'A62']));
    expect(state.unlockedTitles.suffixes).toEqual(['B62']);
    // 装備中の A01 と、明示的に外した B枠（null）はそのまま
    expect(state.equippedTitle).toEqual({ prefixId: 'A01', suffixId: null });
  });

  it('最初から解放済みの二つ名は「合計○種解放」の数に含めない', () => {
    const state = loadTitleState();
    expect(getTitleProgressValue(SUFFIX_TITLES.find(t => t.id === 'B50'), state.progress)).toBe(0);
  });

  it('装備を外した状態 (null) が再読み込み後も保持される', () => {
    unlockAndEquip({ prefixes: ['A01'], suffixes: ['B01'], prefixId: null, suffixId: 'B01' });
    resetTitleCache();
    const state = loadTitleState();
    expect(state.equippedTitle.prefixId).toBeNull();
    expect(state.equippedTitle.suffixId).toBe('B01');
  });

  it('未解放の二つ名は装備できない', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedTitles: { prefixes: [], suffixes: [], evolved: [] },
      equippedTitle: { prefixId: 'A05', suffixId: 'B02' },
    }));
    resetTitleCache();
    expect(loadTitleState().equippedTitle).toEqual({ prefixId: null, suffixId: null });
  });

  it('旧形式のセーブデータ（A01/B01装備）を引き継ぐ', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedTitles: { prefixes: ['A01'], suffixes: ['B01'], evolved: [] },
      equippedTitle: { prefixId: 'A01', suffixId: 'B01' },
    }));
    resetTitleCache();
    const info = getEquippedTitleInfo(loadTitleState().equippedTitle);
    expect(info.fullName).toBe('神速の覇王');
  });
});

describe('進捗記録と解放', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('累計値が目標に達すると解放され、通知される', () => {
    const notified = [];
    const unsubscribe = subscribeTitleUnlock(titles => notified.push(...titles.map(t => t.id)));
    recordTitleProgress({ add: { erase_fire: 60 } });
    expect(loadTitleState().unlockedTitles.prefixes).not.toContain('A04');
    recordTitleProgress({ add: { erase_fire: 40 } });
    expect(loadTitleState().unlockedTitles.prefixes).toContain('A04');
    expect(notified).toContain('A04');
    unsubscribe();
  });

  it('最大値系の進捗は最大値のみ保持する', () => {
    recordTitleProgress({ max: { combo_turn_max: 30000 } });
    recordTitleProgress({ max: { combo_turn_max: 10 } });
    expect(loadTitleState().progress.combo_turn_max).toBe(30000);
    expect(loadTitleState().unlockedTitles.suffixes).not.toContain('B01');
    recordTitleProgress({ max: { combo_turn_max: 50000 } });
    expect(loadTitleState().unlockedTitles.suffixes).toContain('B01');
  });

  it('「狂戦士の」は残り時間2秒以下のクリアフラグでのみ解放', () => {
    recordTitleProgress({ max: { berserk_clear: 0 } });
    expect(loadTitleState().unlockedTitles.prefixes).not.toContain('A02');
    recordTitleProgress({ max: { berserk_clear: 1 } });
    expect(loadTitleState().unlockedTitles.prefixes).toContain('A02');
  });

  it('進化二つ名は元の二つ名を装備中にトリガー条件を満たすと解放', () => {
    unlockAndEquip({ prefixes: ['A01'], prefixId: null });
    recordTitleTrigger('clear', { timeLeftMs: 6000 });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E01');

    unlockAndEquip({ prefixes: ['A01'], prefixId: 'A01' });
    recordTitleTrigger('clear', { timeLeftMs: 4999 });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E01');
    recordTitleTrigger('clear', { timeLeftMs: 5000 });
    expect(loadTitleState().unlockedTitles.evolved).toContain('E01');
  });

  it('パズルマスターは全属性の最小消去数で判定（元の二つ名の解放が前提）', () => {
    unlockAndEquip({ suffixes: ['B01'] });
    const add = { erase_fire: 2000, erase_water: 2000, erase_wood: 2000, erase_light: 2000, erase_dark: 2000, erase_heart: 1999 };
    recordTitleProgress({ add });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E08');
    recordTitleProgress({ add: { erase_heart: 1 } });
    expect(loadTitleState().unlockedTitles.evolved).toContain('E08');
  });
});

describe('装備と効果', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('進化版を装備していると、同じ枠の元の二つ名を装備しているものとして扱う', () => {
    unlockAndEquip({ prefixes: ['A01'], suffixes: ['B08'], evolved: ['E20'], prefixId: 'A01', suffixId: 'E20' });
    const info = getEquippedTitleInfo(loadTitleState().equippedTitle);
    expect(info.suffix.id).toBe('E20');
    expect(info.fullName).toBe('神速の絶対者');
    expect(isTitleEquipped('B08')).toBe(true);
    expect(isTitleEquipped('A01')).toBe(true);
    expect(isTitleEquipped('B01')).toBe(false);
  });

  it('進化二つ名は対応する枠にしか装備できない', () => {
    unlockAndEquip({ evolved: ['E01'], prefixId: null, suffixId: 'E01' });
    expect(loadTitleState().equippedTitle.suffixId).toBeNull();
  });

  it('コンボ補正: 条件・回数・上限を考慮する', () => {
    unlockAndEquip({ prefixes: ['A04'], suffixes: ['B01'], prefixId: 'A04', suffixId: 'B01' });
    const effects = getActiveTitleEffects();
    // 紅蓮の(ショップ・出現率のみ) + 覇王(+2.0)
    expect(effects.some(e => e.type === 'shop_attr_weight' && e.attribute === 'fire')).toBe(true);
    const withFire = computeTitleComboModifiers({ matchedColors: new Set(['fire']), tc: 5 }, effects);
    expect(withFire.addedMult).toBeCloseTo(2.0);
    // 炎帝: 炎トークン数 × 炎を消した手番のみ
    const enTei = SUFFIX_TITLES.find(t => t.id === 'B51').effects;
    const ctx = { tokenCounts: { attrCounts: { fire: 3 } }, tc: 5 };
    expect(computeTitleComboModifiers({ ...ctx, matchedColors: new Set(['fire']) }, enTei).addedMult).toBeCloseTo(0.75);
    expect(computeTitleComboModifiers({ ...ctx, matchedColors: new Set(['water']) }, enTei).addedMult).toBeCloseTo(0);
  });

  it('per と max', () => {
    const effects = [{ type: 'combo_add', value: 3, per: 'bomb_erased', max: 30 }, { type: 'base_mult', value: 2, per: 'curse', max: 5 }];
    const mods = computeTitleComboModifiers({ bombErased: 50, tokenCounts: { curse: 7 } }, effects);
    expect(mods.comboAdd).toBe(90);
    expect(mods.baseMult).toBe(32);
  });

  it('操作時間: 加算と固定', () => {
    expect(applyTitleTimeLimit(5000, false, [{ type: 'time_add', value: 2000 }])).toBe(7000);
    expect(applyTitleTimeLimit(9000, false, [{ type: 'time_fixed', value: 4000 }, { type: 'time_add', value: 2000 }])).toBe(4000);
    expect(applyTitleTimeLimit(2000, true, [{ type: 'time_add', value: 2000 }])).toBe(2000);
  });

  it('出現率: 属性強化・限定', () => {
    const w = { fire: 1, water: 1, wood: 1, light: 1, dark: 1, heart: 1 };
    applyTitleSpawnWeights(w, {}, [{ type: 'spawn_weight', color: 'fire', value: 1.5 }, { type: 'spawn_only', colors: ['fire', 'heart'] }]);
    expect(w).toEqual({ fire: 1.5, water: 0, wood: 0, light: 0, dark: 0, heart: 1 });
  });

  it('天候・道具の二つ名: 属性トークンの売却・購入数で解放され、出現率を変える', () => {
    const colors = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
    const prefixIds = ['A64', 'A65', 'A66', 'A67', 'A68', 'A69'];
    const suffixIds = ['B65', 'B66', 'B67', 'B68', 'B69', 'B70'];
    colors.forEach((c, i) => {
      const a = PREFIX_TITLES.find(t => t.id === prefixIds[i]);
      expect(a.conditionType).toBe(`attr_sold_${c}`);
      expect(a.targetValue).toBe(8);
      const wa = applyTitleSpawnWeights(Object.fromEntries(colors.map(k => [k, 1])), {}, a.effects);
      colors.forEach(k => expect(wa[k], `${a.name} ${k}`).toBe(k === c ? 0 : 1));

      const b = SUFFIX_TITLES.find(t => t.id === suffixIds[i]);
      expect(b.conditionType).toBe(`attr_bought_${c}`);
      expect(b.targetValue).toBe(8);
      const wb = applyTitleSpawnWeights(Object.fromEntries(colors.map(k => [k, 1])), {}, b.effects);
      colors.forEach(k => expect(wb[k], `${b.name} ${k}`).toBe(k === c ? 1.5 : 1));
    });

    const holiday = PREFIX_TITLES.find(t => t.id === 'A63');
    expect(holiday.conditionType).toBe('attr_sold_dark');
    expect(holiday.targetValue).toBe(6);
    const wh = applyTitleSpawnWeights(Object.fromEntries(colors.map(k => [k, 1])), {}, holiday.effects);
    expect(wh).toEqual({ fire: 1, water: 1, wood: 1, light: 0, dark: 0, heart: 1 });
  });

  it('月属性トークンの売却数で「休日の」「月食の」が解放される', () => {
    unlockAndEquip({});
    recordTitleProgress({ add: { attr_sold_dark: 5 } });
    expect(loadTitleState().unlockedTitles.prefixes).not.toContain('A63');
    recordTitleProgress({ add: { attr_sold_dark: 1 } });
    expect(loadTitleState().unlockedTitles.prefixes).toContain('A63');
    expect(loadTitleState().unlockedTitles.prefixes).not.toContain('A68');
    recordTitleProgress({ add: { attr_sold_dark: 2 } });
    expect(loadTitleState().unlockedTitles.prefixes).toContain('A68');
  });

  it('出現率: 最多消去属性の強化', () => {
    const w = { fire: 1, water: 1, wood: 1, light: 1, dark: 1, heart: 1 };
    applyTitleSpawnWeights(w, { erase_dark: 100, erase_fire: 10 }, [{ type: 'spawn_top_colors', count: 1, value: 3 }]);
    expect(w.dark).toBe(3);
    expect(w.fire).toBe(1);
  });

  it('スキルコスト軽減は属性で絞り込む', () => {
    const effects = [{ type: 'skill_cost_sub', attribute: 'fire', value: 1 }, { type: 'skill_cost_sub', value: 1 }];
    expect(getTitleSkillCostReduction({ attributes: ['fire'] }, effects)).toBe(2);
    expect(getTitleSkillCostReduction({ attributes: ['water'] }, effects)).toBe(1);
  });

  it('合計と積', () => {
    const effects = [{ type: 'shop_discount', value: 0.2 }, { type: 'star_gain_mult', value: 2, when: { stars_le: 0 } }];
    expect(getTitleEffectTotal('shop_discount', {}, effects)).toBeCloseTo(0.2);
    expect(getTitleEffectProduct('star_gain_mult', { stars: 0 }, effects)).toBe(2);
    expect(getTitleEffectProduct('star_gain_mult', { stars: 3 }, effects)).toBe(1);
  });

  it('トークン構成のカウント', () => {
    const counts = getTokenTitleCounts([
      { type: 'passive', level: 3, attributes: ['fire'], enchantments: [{}, {}] },
      { type: 'skill', level: 2, attributes: ['fire'] },
      { type: 'curse', isCurse: true, level: 3 },
      null,
    ]);
    expect(counts).toEqual({ token: 3, curse: 1, lv3: 1, lv2plus: 2, passive: 1, skill: 1, enchant: 2, sameAttrMax: 2, attrCounts: { fire: 2 } });
  });

  it('per: 属性トークン数・属性別消去数', () => {
    const effects = [
      { type: 'add_mult', value: 0.5, per: 'attr_token', attribute: 'wood', max: 8, when: { color: 'wood' } },
      { type: 'combo_add', value: 1, per: 'color_erased', color: 'dark' },
    ];
    const ctx = { matchedColors: new Set(['wood']), tokenCounts: { attrCounts: { wood: 10, fire: 3 } }, erasedColorCounts: { dark: 7 } };
    const mods = computeTitleComboModifiers(ctx, effects);
    expect(mods.addedMult).toBeCloseTo(4.0);
    expect(mods.comboAdd).toBe(7);
    expect(computeTitleComboModifiers({ ...ctx, matchedColors: new Set(['fire']) }, effects).addedMult).toBe(0);
  });

  it('per: cycle はサイクル数に比例して固定加算が伸びる', () => {
    const effects = [{ type: 'combo_add', value: 1.5, per: 'cycle' }];
    expect(computeTitleComboModifiers({ cycle: 1 }, effects).comboAdd).toBe(1);
    expect(computeTitleComboModifiers({ cycle: 6 }, effects).comboAdd).toBe(9);
    expect(computeTitleComboModifiers({ cycle: 11 }, effects).comboAdd).toBe(16);
  });

  it('疾風の最大加算は +12', () => {
    const b41 = SUFFIX_TITLES.find(t => t.id === 'B41');
    expect(computeTitleComboModifiers({ moveSteps: 200 }, b41.effects).comboAdd).toBe(12);
  });

  it('属性B枠は属性トークン所持数で解放される', () => {
    unlockAndEquip({});
    recordTitleProgress({ max: { attr_tokens_dark_max: 4 } });
    expect(loadTitleState().unlockedTitles.suffixes).toContain('B55');
  });

  it('ちょうどN属性の判定', () => {
    const when = { colors_ge: 3, colors_le: 3 };
    expect(evaluateTitleWhen(when, { matchedColors: new Set(['fire', 'water', 'wood']) })).toBe(true);
    expect(evaluateTitleWhen(when, { matchedColors: new Set(['fire', 'water']) })).toBe(false);
    expect(evaluateTitleWhen(when, { matchedColors: new Set(['fire', 'water', 'wood', 'dark']) })).toBe(false);
  });

  it('when 条件の組み合わせ (AND)', () => {
    const when = { first_turn: true, color: 'fire' };
    expect(evaluateTitleWhen(when, { turn: 1, matchedColors: new Set(['fire']) })).toBe(true);
    expect(evaluateTitleWhen(when, { turn: 2, matchedColors: new Set(['fire']) })).toBe(false);
    expect(evaluateTitleWhen({ last_turn: true }, { turn: 3, maxTurns: 3 })).toBe(true);
  });

  it('操作時間: 倍率（刹那の・時間停止）', () => {
    expect(applyTitleTimeLimit(6000, false, [{ type: 'time_scale', value: 0.5 }])).toBe(3000);
    expect(applyTitleTimeLimit(6000, false, [{ type: 'time_scale', value: 0.5 }, { type: 'time_scale', value: 2.0 }])).toBe(6000);
    expect(applyTitleTimeLimit(6000, false, [{ type: 'time_scale', value: 0.5 }, { type: 'time_add', value: 1000 }])).toBe(4000);
  });

  it('賭博師: 勝ち ×2 / 負け ×0.5', () => {
    const effects = [{ type: 'final_mult_gamble', value: 2.0 }];
    expect(computeTitleComboModifiers({ random: () => 0.1 }, effects).finalMult).toBe(2);
    expect(computeTitleComboModifiers({ random: () => 0.9 }, effects).finalMult).toBe(0.5);
  });

  it('残響の・守銭奴の per', () => {
    const effects = [
      { type: 'combo_add', value: 0.1, per: 'prev_combo', max: 1000 },
      { type: 'add_mult', value: 0.5, per: 'stars_100', max: 10 },
    ];
    expect(computeTitleComboModifiers({ prevCombo: 255, stars: 350 }, effects)).toMatchObject({ comboAdd: 25, addedMult: 1.5 });
    expect(computeTitleComboModifiers({ prevCombo: 999999, stars: 99999 }, effects)).toMatchObject({ comboAdd: 100, addedMult: 5 });
  });

  it('逆転の・無欲の・静と動の条件', () => {
    expect(evaluateTitleWhen({ behind: true }, { turn: 3, maxTurns: 4, goalProgress: 0.3 })).toBe(true);
    expect(evaluateTitleWhen({ behind: true }, { turn: 2, maxTurns: 4, goalProgress: 0.3 })).toBe(false);
    expect(evaluateTitleWhen({ behind: true }, { turn: 4, maxTurns: 4, goalProgress: 0.6 })).toBe(false);
    expect(evaluateTitleWhen({ no_purchase: true }, { purchasesThisCycle: 0 })).toBe(true);
    expect(evaluateTitleWhen({ no_purchase: true }, { purchasesThisCycle: 2 })).toBe(false);
    const when = { prev_skill_used: true, skill_used: false };
    expect(evaluateTitleWhen(when, { prevSkillUsed: true, skillUsed: false })).toBe(true);
    expect(evaluateTitleWhen(when, { prevSkillUsed: true, skillUsed: true })).toBe(false);
  });

  it('孤高の＋隠者: セット効果は無く、それぞれの効果だけが発動する', () => {
    unlockAndEquip({ prefixes: ['A16'], suffixes: ['B57'], prefixId: 'A16', suffixId: 'B57' });
    const mods = computeTitleComboModifiers({ tokenCounts: { token: 0 }, tc: 3 }, getActiveTitleEffects());
    expect(mods.finalMult).toBeCloseTo(1.8);
    expect(mods.addedMult).toBeCloseTo(2.0);
  });
});

describe('二つ名の整理（グループ7）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  const findAny = (id) => [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].find(t => t.id === id);

  it('ゲーム開始時の効果（start_stars / start_token_level）を持つ二つ名がない', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].forEach(t => {
      (t.effects || []).forEach(e => {
        expect(['start_stars', 'start_token_level'], t.id).not.toContain(e.type);
      });
    });
  });

  it('A10 黄金の: 所持スター10につき +1★（最大 +5★）', () => {
    const effects = findAny('A10').effects;
    expect(getTitleEffectTotal('cycle_clear_stars', { stars: 9 }, effects)).toBe(0);
    expect(getTitleEffectTotal('cycle_clear_stars', { stars: 37 }, effects)).toBe(3);
    expect(getTitleEffectTotal('cycle_clear_stars', { stars: 500 }, effects)).toBe(5);
  });

  it('A35 不屈の: 操作時間 +1秒、コンボ倍率 +0.3', () => {
    const effects = findAny('A35').effects;
    expect(applyTitleTimeLimit(5000, false, effects)).toBe(6000);
    expect(computeTitleComboModifiers({}, effects).addedMult).toBeCloseTo(0.3);
  });

  it('B27 旅人: リロール価格 -1★（1★未満にはならない）', () => {
    const effects = findAny('B27').effects;
    expect(applyTitleRerollPrice(5, effects)).toBe(4);
    expect(applyTitleRerollPrice(1, effects)).toBe(1);
    expect(applyTitleRerollPrice(5, [])).toBe(5);
    // 見切り屋（2★固定）は今までどおり
    expect(applyTitleRerollPrice(5, findAny('B12').effects)).toBe(2);
    expect(applyTitleRerollPrice(1, findAny('B12').effects)).toBe(1);
  });

  it('A20 先達の: 新しく手に入れたトークンの初期レベルが 2', () => {
    expect(getTitleNewTokenLevel(findAny('A20').effects)).toBe(2);
    expect(getTitleNewTokenLevel([])).toBe(1);
    unlockAndEquip({ prefixes: ['A20'], prefixId: 'A20' });
    expect(getTitleNewTokenLevel()).toBe(2);
  });

  it('エンチャント・虹ドロップを使う二つ名（A33・A45）は無効', () => {
    ['A33', 'A45'].forEach(id => expect(isTitleDisabled(id), id).toBe(true));
    ['A01', 'B01', 'E01', 'E27'].forEach(id => expect(isTitleDisabled(id), id).toBe(false));
    // 図鑑・装備画面の一覧に出ない
    expect(VISIBLE_PREFIX_TITLES.map(t => t.id)).not.toContain('A33');
    expect(VISIBLE_PREFIX_TITLES.map(t => t.id)).not.toContain('A45');
    expect(VISIBLE_PREFIX_TITLES).toHaveLength(PREFIX_TITLES.length - 2);
    expect(VISIBLE_SUFFIX_TITLES).toHaveLength(SUFFIX_TITLES.length);
    expect(VISIBLE_EVOLVED_TITLES).toHaveLength(EVOLVED_TITLES.length);
    // エンチャントを条件・効果に使う二つ名は、すべて無効になっている
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].forEach(t => {
      const usesEnchant = t.conditionType === 'enchant_max' || (t.effects || []).some(e => e.per === 'enchant');
      const usesRainbow = t.conditionType === 'rainbow_erased' || (t.effects || []).some(e => e.per === 'rainbow_erased');
      if (usesEnchant || usesRainbow) expect(isTitleDisabled(t), t.id).toBe(true);
    });
  });

  it('無効な二つ名は条件を満たしても解放されない', () => {
    const unlocked = recordTitleProgress({ max: { enchant_max: 99, rainbow_erased: 99 } });
    expect(unlocked.map(t => t.id)).not.toContain('A45');
    expect(unlocked.map(t => t.id)).not.toContain('A33');
    expect(loadTitleState().unlockedTitles.prefixes).not.toContain('A45');
  });

  it('解放・装備済みのセーブデータを読み込むと、無効な二つ名の装備は外れ、解放数にも数えない', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedTitles: { prefixes: ['A45', 'A01'], suffixes: ['B28'], evolved: [] },
      equippedTitle: { prefixId: 'A45', suffixId: 'B28' },
      progress: {},
    }));
    resetTitleCache();
    const state = loadTitleState();
    expect(state.equippedTitle).toEqual({ prefixId: null, suffixId: 'B28' });
    // 解放済みの記録は消さない（エンチャントを戻したときに復活できるように）
    expect(state.unlockedTitles.prefixes).toContain('A45');
    // A01・B28 と、最初から解放済みの A62・B62（無効な A45 は数えない）
    expect(countUnlockedTitles(state.unlockedTitles)).toBe(4);
    const info = getEquippedTitleInfo({ prefixId: 'A45', suffixId: 'B28' });
    expect(info.prefix).toBeNull();
    expect(getActiveTitleEffects().some(e => e.per === 'enchant')).toBe(false);
  });

  it('「スキル」の表記をアクティブに揃えている', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].forEach(t => {
      ['desc', 'conditionDesc', 'challengeDesc', 'category'].forEach(key => {
        const text = t[key];
        if (typeof text !== 'string') return;
        // 「スキル」は「アクティブスキル」としてだけ使う
        expect(text.replace(/アクティブスキル/g, ''), `${t.id}.${key}`).not.toMatch(/スキル/);
      });
    });
  });

  it('「コンボ加算(+N)」の表記を使っていない', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].forEach(t => {
      ['desc', 'conditionDesc'].forEach(key => {
        expect(t[key] || '', `${t.id}.${key}`).not.toMatch(/\+N/);
      });
    });
  });
});

describe('二つ名の解放条件の見直し（グループ8）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  const find = (id) => [...PREFIX_TITLES, ...SUFFIX_TITLES].find(t => t.id === id);

  it('各二つ名の新しい解放条件', () => {
    const expected = {
      A01: ['clear_time_left_max', 3],
      B40: ['time_limit_max', 10], // グループ13で変更
      A22: ['single_color_board_max', 12],
      A25: ['stars_spent_total', 300],
      B34: ['stars_spent_total', 3000],
      A31: ['bomb_erased', 15],
      B36: ['bomb_erased', 50],
      A38: ['low_combo_clear', 1],
      A40: ['stars_earned_total', 1000],
      A20: ['token_levelups', 50],
      B22: ['skill_tokens_max', 6], // グループ13で変更
    };
    Object.entries(expected).forEach(([id, [type, value]]) => {
      expect(find(id).conditionType, id).toBe(type);
      expect(find(id).targetValue, id).toBe(value);
    });
    expect(find('A40').name).toBe('商才の');
  });

  it('神速の: 手番終了時の残り時間だけでは解放されず、サイクルクリアした手番の残り時間で解放される', () => {
    expect(recordTitleProgress({ max: { time_left_max: 4 } }).map(t => t.id)).not.toContain('A01');
    expect(recordTitleProgress({ max: { clear_time_left_max: 3 } }).map(t => t.id)).toContain('A01');
  });

  it('B22 スペシャリスト: アクティブトークン4個で発動する', () => {
    const effects = find('B22').effects;
    expect(getTitleEffectTotal('skill_charge_add', { tokenCounts: { skill: 4 } }, effects)).toBe(2);
    expect(getTitleEffectTotal('skill_charge_add', { tokenCounts: { skill: 3 } }, effects)).toBe(0);
  });

  it('A40 は id のままなので、解放済みのセーブデータを引き継ぐ', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedTitles: { prefixes: ['A40'], suffixes: [], evolved: [] },
      equippedTitle: { prefixId: 'A40', suffixId: null },
    }));
    resetTitleCache();
    expect(getEquippedTitleInfo(loadTitleState().equippedTitle).prefix?.name).toBe('商才の');
  });
});

describe('二つ名の効果の調整（グループ9）', () => {
  const find = (id) => [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].find(t => t.id === id);

  it('A01 神速の: 残り操作時間1秒につきコンボ +1（最大 +5）', () => {
    const effects = find('A01').effects;
    expect(applyTitleTimeLimit(5000, false, effects)).toBe(6000);
    expect(computeTitleComboModifiers({ timeLeftMs: 2500 }, effects).comboAdd).toBe(2);
    expect(computeTitleComboModifiers({ timeLeftMs: 9000 }, effects).comboAdd).toBe(5);
    // 進化先 E01 光速の は残り時間1秒につき倍率 +0.5 で、より強い
    expect(computeTitleComboModifiers({ timeLeftMs: 3000 }, find('E01').effects).addedMult).toBeCloseTo(1.5);
  });

  it('A16・A19・A34・A47・A48 の値', () => {
    expect(computeTitleComboModifiers({ tokenCounts: { token: 3 } }, find('A16').effects).addedMult).toBeCloseTo(2.0);
    expect(computeTitleComboModifiers({ tokenCounts: { token: 4 } }, find('A16').effects).addedMult).toBe(0);
    expect(find('A16').conditionType).toBe('low_token_cycle');
    expect(getTitleEffectTotal('curse_sell_bonus', {}, find('A19').effects)).toBe(30);
    expect(computeTitleComboModifiers({ isAllClear: true }, find('A34').effects).finalMult).toBeCloseTo(2.5);
    expect(applyTitleTimeLimit(5000, false, find('A47').effects)).toBe(7000);
    expect(computeTitleComboModifiers({}, find('A47').effects).addedMult).toBeCloseTo(0.3);
    const mono = computeTitleComboModifiers({ matchedColors: ['fire'] }, find('A48').effects).addedMult;
    expect(mono).toBeCloseTo(2.0);
    // 進化先 E24 無垢の より弱いまま
    expect(mono).toBeLessThan(computeTitleComboModifiers({ matchedColors: ['fire'] }, find('E24').effects).addedMult);
  });

  it('A31 爆炎の: ボム最大3個分', () => {
    expect(computeTitleComboModifiers({ bombErased: 2 }, find('A31').effects).comboAdd).toBe(10);
    expect(computeTitleComboModifiers({ bombErased: 10 }, find('A31').effects).comboAdd).toBe(15);
  });
});

describe('特殊消しの二つ名（グループ10）', () => {
  const find = (id) => PREFIX_TITLES.find(t => t.id === id);

  it('A61 四連の: 4つ消し1組につきコンボ +1（最大 +5）', () => {
    const a61 = find('A61');
    expect(a61.conditionType).toBe('shape_len4');
    expect(a61.targetValue).toBe(100);
    expect(computeTitleComboModifiers({ shapes: ['len4', 'len4', 'cross'] }, a61.effects).comboAdd).toBe(2);
    expect(computeTitleComboModifiers({ shapes: Array(8).fill('len4') }, a61.effects).comboAdd).toBe(5);
  });

  it('難しい消し方ほど加算が大きく、解放条件の回数が少ない', () => {
    // 4つ消し ≤ 5個以上消し < L字 < 横一列 < 十字 < 正方形（1手で1回達成したときの加算）
    const order = [
      ['A61', { shapes: ['len4'] }],
      ['A30', { len5Count: 1 }],
      ['A28', { shapes: ['l_shape'] }],
      ['A29', { shapes: ['row'] }],
      ['A26', { shapes: ['cross'] }],
      ['A27', { shapes: ['square'] }],
    ];
    const adds = order.map(([id, ctx]) => computeTitleComboModifiers(ctx, find(id).effects).comboAdd);
    expect(adds).toEqual([1, 2, 5, 7, 9, 12]);
    const targets = order.map(([id]) => find(id).targetValue);
    expect(targets).toEqual([100, 100, 30, 20, 20, 15]);
    // 5個以上消しの最大
    expect(computeTitleComboModifiers({ len5Count: 9 }, find('A30').effects).comboAdd).toBe(10);
  });
});

describe('セットシナジー廃止・進化二つ名の追加（グループ11）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  const findEvo = (id) => EVOLVED_TITLES.find(t => t.id === id);
  const save = (unlocked, equipped = {}) => saveTitleState({
    unlockedTitles: { prefixes: [], suffixes: [], evolved: [], ...unlocked },
    equippedTitle: { prefixId: null, suffixId: null, ...equipped },
    progress: {},
  });
  const unlockedEvolved = () => loadTitleState().unlockedTitles.evolved;

  it('b:「A」と「B」を装備して〜（E29 電撃の）。片方だけでは解放されない', () => {
    save({ prefixes: ['A01'], suffixes: ['B08'] }, { prefixId: 'A01' });
    recordTitleTrigger('clear', { timeLeftMs: 3500 });
    expect(unlockedEvolved()).not.toContain('E29');
    save({ prefixes: ['A01'], suffixes: ['B08'] }, { prefixId: 'A01', suffixId: 'B08' });
    recordTitleTrigger('clear', { timeLeftMs: 2000 });
    expect(unlockedEvolved()).not.toContain('E29');
    recordTitleTrigger('clear', { timeLeftMs: 3500 });
    expect(unlockedEvolved()).toContain('E29');
  });

  it('b: 元の二つ名の進化版を装備していても条件を満たす（E01 光速の＋無双 → E29）', () => {
    save({ prefixes: ['A01'], suffixes: ['B08'], evolved: ['E01'] }, { prefixId: 'E01', suffixId: 'B08' });
    recordTitleTrigger('clear', { timeLeftMs: 3500 });
    expect(unlockedEvolved()).toContain('E29');
  });

  it('c:「A」と「B」を解放した状態で〜（E34 パンドラの解放者）。装備は不要', () => {
    save({ prefixes: ['A13'] });
    recordTitleTrigger('turn', { tokenCounts: { curse: 3 }, skillsThisTurn: 3 });
    expect(unlockedEvolved()).not.toContain('E34');
    save({ prefixes: ['A13'], suffixes: ['B10'] });
    recordTitleTrigger('turn', { tokenCounts: { curse: 3 }, skillsThisTurn: 3 });
    expect(unlockedEvolved()).toContain('E34');
  });

  it('c: requiredMin（E47 万象の詠唱: 詠唱6種のうち3つ＋魔導士）', () => {
    save({ prefixes: ['A17', 'A18'], suffixes: ['B03'] });
    recordTitleTrigger('turn', { skillsThisTurn: 3 });
    expect(unlockedEvolved()).not.toContain('E47');
    save({ prefixes: ['A17', 'A18', 'A54'] });
    recordTitleTrigger('turn', { skillsThisTurn: 3 });
    expect(unlockedEvolved()).not.toContain('E47');
    save({ prefixes: ['A17', 'A18', 'A54'], suffixes: ['B03'] });
    recordTitleTrigger('turn', { skillsThisTurn: 3 });
    expect(unlockedEvolved()).toContain('E47');
  });

  it('c: A枠どうし4つ（E50 幾何の）と、特殊消し3種類の判定', () => {
    save({ prefixes: ['A26', 'A27', 'A28', 'A29'] });
    recordTitleTrigger('turn', { shapes: ['cross', 'cross', 'len4', 'row'] });
    expect(unlockedEvolved()).not.toContain('E50');
    recordTitleTrigger('turn', { shapes: ['cross', 'square', 'row'] });
    expect(unlockedEvolved()).toContain('E50');
    const mods = computeTitleComboModifiers({ shapes: ['cross', 'square', 'row', 'len4', 'l_shape', 'cross', 'row', 'square'] }, findEvo('E50').effects);
    expect(mods.addedMult).toBeCloseTo(3.0); // 4つ消しは数えず、最大 +3.0
  });

  it("'$prefix': E27 真・覇王 は装備中の属性A枠の色で解放判定・効果が決まる", () => {
    save({ prefixes: ['A05'], suffixes: ['B01'] }, { prefixId: 'A05', suffixId: 'B01' });
    expect(getEquippedPrefixAttribute()).toBe('water');
    recordTitleTrigger('turn', { erasedColorCounts: { fire: 30 } });
    expect(unlockedEvolved()).not.toContain('E27');
    recordTitleTrigger('turn', { erasedColorCounts: { water: 20 } });
    expect(unlockedEvolved()).toContain('E27');

    save({ prefixes: ['A05'], suffixes: ['B01'], evolved: ['E27'] }, { prefixId: 'A05', suffixId: 'E27' });
    const enhance = getActiveTitleEffects().filter(e => e.type === 'enhance_color');
    expect(enhance).toHaveLength(1);
    expect(enhance[0].color).toBe('water');
  });

  it("'$prefix': 属性のA枠を装備していなければ、その効果は出ない（進化版の A枠なら元の属性）", () => {
    save({ prefixes: ['A01'], suffixes: ['B01'], evolved: ['E27'] }, { prefixId: 'A01', suffixId: 'E27' });
    expect(getActiveTitleEffects().some(e => e.type === 'enhance_color')).toBe(false);
    expect(getActiveTitleEffects().some(e => e.type === 'add_mult' && e.value === 2.0)).toBe(true);
    save({ prefixes: ['A04'], suffixes: ['B01'], evolved: ['E04', 'E27'] }, { prefixId: 'E04', suffixId: 'E27' });
    expect(getEquippedPrefixAttribute()).toBe('fire');
    expect(getActiveTitleEffects().find(e => e.type === 'enhance_color')?.color).toBe('fire');
  });

  it("E28 千変の即応陣: 1手目にA枠の属性を消した手番だけ倍率 +2.5", () => {
    save({ prefixes: ['A07'], suffixes: ['B16'], evolved: ['E28'] }, { prefixId: 'A07', suffixId: 'E28' });
    const effects = getActiveTitleEffects();
    expect(computeTitleComboModifiers({ turn: 1, matchedColors: ['light'] }, effects).addedMult).toBeCloseTo(2.5);
    expect(computeTitleComboModifiers({ turn: 1, matchedColors: ['fire'] }, effects).addedMult).toBe(0);
    expect(computeTitleComboModifiers({ turn: 2, matchedColors: ['light'] }, effects).addedMult).toBe(0);
  });

  it("shop: E30 ミダスの手 は同じサイクルの間のリロール数で解放（グループ13）", () => {
    save({ prefixes: ['A10'], suffixes: ['B12'] }, { prefixId: 'A10', suffixId: 'B12' });
    recordTitleTrigger('shop', { cycleRerolls: 4 });
    expect(unlockedEvolved()).not.toContain('E30');
    recordTitleTrigger('shop', { cycleRerolls: 5 });
    expect(unlockedEvolved()).toContain('E30');
  });

  it('新しい条件キー', () => {
    expect(evaluateTitleWhen({ time_left_le: 1000 }, { timeLeftMs: 800 })).toBe(true);
    expect(evaluateTitleWhen({ time_left_le: 1000 }, { timeLeftMs: 1200 })).toBe(false);
    expect(evaluateTitleWhen({ stars_le: 0, stars_gained_ge: 3 }, { stars: 0, starsGained: 3 })).toBe(true);
    expect(evaluateTitleWhen({ shape_count_ge: { shape: 'cross', n: 2 } }, { shapes: ['cross', 'row'] })).toBe(false);
    expect(evaluateTitleWhen({ shape_count_ge: { shape: 'cross', n: 2 } }, { shapes: ['cross', 'cross'] })).toBe(true);
    expect(evaluateTitleWhen({ lv3_ge: 5 }, { tokenCounts: { lv3: 5 } })).toBe(true);
    expect(evaluateTitleWhen({ no_skyfall_turn: true }, { noSkyfall: true })).toBe(true);
    expect(evaluateTitleWhen({ no_skyfall_turn: true }, {})).toBe(false);
    expect(evaluateTitleWhen({ shop_curses_sold_ge: 2 }, { shopCursesSold: 2 })).toBe(true);
    expect(evaluateTitleWhen({ shop_sales_bought_ge: 2 }, { shopSalesBought: 1 })).toBe(false);
  });

  it('元の二つ名の表示（未解放は伏せる）と解放状態', () => {
    expect(describeRequiredTitles(findEvo('E29'))).toBe('神速の＋無双');
    expect(describeRequiredTitles(findEvo('E29'), { prefixes: ['A01'], suffixes: [] })).toBe('神速の＋？？？');
    expect(describeRequiredTitles(findEvo('E47'))).toMatch(/のうち3つ＋魔導士$/);
    expect(describeRequiredTitles(findEvo('E27'))).toMatch(/^覇王＋（紅蓮の／.*）のどれか$/);
    expect(isEvolvedBaseUnlocked(findEvo('E27'), { prefixes: ['A06'], suffixes: ['B01'] })).toBe(true);
    expect(isEvolvedBaseUnlocked(findEvo('E27'), { prefixes: ['A01'], suffixes: ['B01'] })).toBe(false);
  });

  it('旧セーブデータ（進化 E01・E20 を解放・装備）をそのまま読み込める', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedTitles: { prefixes: ['A01'], suffixes: ['B08'], evolved: ['E01', 'E20'] },
      equippedTitle: { prefixId: 'E01', suffixId: 'E20' },
      progress: { evo_E01: 1, evo_E20: 1 },
    }));
    resetTitleCache();
    const state = loadTitleState();
    expect(state.equippedTitle).toEqual({ prefixId: 'E01', suffixId: 'E20' });
    expect(getEquippedTitleInfo(state.equippedTitle).fullName).toBe('光速の絶対者');
  });

  it('旧セットの効果を足した既存の進化（E04 獄炎の・E09 蒼溟の）', () => {
    const e04 = findEvo('E04').effects;
    expect(computeTitleComboModifiers({ matchedColors: ['fire'], enhancedErased: 30 }, e04).addedMult).toBeCloseTo(7.0);
    const e09 = findEvo('E09').effects;
    expect(computeTitleComboModifiers({ matchedColors: ['water'], timeLeftMs: 4000 }, e09).addedMult).toBeCloseTo(6.0);
  });
});

describe('詠唱者（B63）・苦行者（B64）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  const passive = { id: 'p1', instanceId: 'p1', type: 'passive', effect: 'time', values: [1, 2, 3] };
  const curse = { id: 'c1', instanceId: 'c1', type: 'passive', isCurse: true };
  const skill = { id: 's1', instanceId: 's1', type: 'skill', cost: 6 };
  const curseSkill = { id: 's2', instanceId: 's2', type: 'skill', cost: 6, isCurse: true };

  it('詠唱者: パッシブ（呪いを除く）を封印し、並び順は保つ。アクティブの消費エネルギーは1（呪いを除く）', () => {
    unlockAndEquip({ suffixes: ['B63'], suffixId: 'B63' });
    expect(applyTitlePassiveSeal([passive, skill, curse, null])).toEqual([null, skill, curse, null]);
    expect(getTitleSkillCostFixed(skill)).toBe(1);
    expect(getTitleSkillCostFixed(curseSkill)).toBeNull();
    expect(isTitleSealedActive(skill)).toBe(false);
  });

  it('苦行者: アクティブ（呪いを除く）を使えず、パッシブは50%で2回発動', () => {
    unlockAndEquip({ suffixes: ['B64'], suffixId: 'B64' });
    expect(isTitleSealedActive(skill)).toBe(true);
    expect(isTitleSealedActive(curseSkill)).toBe(false);
    const list = [passive, skill];
    expect(applyTitlePassiveSeal(list)).toBe(list);
    expect(getTitlePassiveDoubleChance()).toBe(0.5);
  });

  it('装備していなければ何も変わらない', () => {
    const list = [passive, skill];
    expect(applyTitlePassiveSeal(list)).toBe(list);
    expect(getTitleSkillCostFixed(skill)).toBeNull();
    expect(isTitleSealedActive(skill)).toBe(false);
    expect(getTitlePassiveDoubleChance()).toBe(0);
  });

  it('2回発動の抽選はパッシブ（呪いを除く）だけが対象', () => {
    const p2 = { ...passive, id: 'p2', instanceId: 'p2' };
    const always = rollTitleDoubledPassives([passive, p2, curse, skill, null], 0.5, () => 0);
    expect([...always]).toEqual(['p1', 'p2']);
    expect(rollTitleDoubledPassives([passive, p2], 0.5, () => 0.9).size).toBe(0);
    expect(rollTitleDoubledPassives([passive], 0).size).toBe(0);
  });

  it('解放条件: パッシブなし／アクティブ未使用でサイクル5をクリア', () => {
    recordTitleProgress({ max: { no_passive_cycle: 4, no_active_cycle: 4 } });
    expect(loadTitleState().unlockedTitles.suffixes).not.toContain('B63');
    recordTitleProgress({ max: { no_passive_cycle: 5 } });
    expect(loadTitleState().unlockedTitles.suffixes).toContain('B63');
    expect(loadTitleState().unlockedTitles.suffixes).not.toContain('B64');
    recordTitleProgress({ max: { no_active_cycle: 5 } });
    expect(loadTitleState().unlockedTitles.suffixes).toContain('B64');
  });
});

const findTitle = (id) => [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].find(t => t.id === id);

describe('B枠・進化の数値・名前・表記（グループ12）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('効果・解放条件の数値', () => {
    expect(findTitle('B01').effects).toEqual([{ type: 'add_mult', value: 2.0 }]);
    expect(findTitle('B08').effects).toEqual([{ type: 'base_mult', value: 1.5 }]);
    expect(findTitle('E05').effects).toContainEqual({ type: 'base_mult', value: 1.5, per: 'curse', max: 5 });
    expect(findTitle('E12').effects).toEqual([{ type: 'time_fixed', value: 4000 }, { type: 'base_mult', value: 2.0 }]);
    expect(findTitle('B12').targetValue).toBe(10);
    expect(findTitle('E01').trigger.when).toEqual({ time_left_ge: 5000 });
  });

  it('E48 停刻の: 操作時間が半分になり、最終コンボ倍率 2.0倍', () => {
    unlockAndEquip({ prefixes: ['A56'], suffixes: ['B40'], evolved: ['E48'], prefixId: 'E48' });
    expect(applyTitleTimeLimit(6000)).toBe(3000);
    expect(computeTitleComboModifiers({}).finalMult).toBeCloseTo(2.0);
  });

  it('B59 は「貯金上手」に改名（id はそのまま）', () => {
    expect(findTitle('B59').name).toBe('貯金上手');
  });

  it('B38・E14 のスタードロップの表記を B11 と揃える', () => {
    expect(findTitle('B38').desc).toContain('降ってくるドロップの 3% がスタードロップ化');
    expect(findTitle('E14').desc).toContain('降ってくるドロップの 10% がスタードロップ化');
  });

  it('B61 継承者 は削除。解放・装備済みのセーブデータを読み込んでも壊れない', () => {
    expect(findTitle('B61')).toBeUndefined();
    expect(SUFFIX_TITLES.some(t => t.effects.some(e => e.type === 'inherit_lv3'))).toBe(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedTitles: { prefixes: ['A01'], suffixes: ['B61', 'B01'], evolved: [] },
      equippedTitle: { prefixId: 'A01', suffixId: 'B61' },
      progress: { lv3_sold: 5 },
    }));
    resetTitleCache();
    const state = loadTitleState();
    expect(state.unlockedTitles.suffixes).not.toContain('B61');
    expect(state.unlockedTitles.suffixes).toContain('B01');
    expect(state.equippedTitle).toEqual({ prefixId: 'A01', suffixId: null });
    expect(getEquippedTitleInfo(state.equippedTitle).fullName).toBe('神速の――');
  });
});

describe('B枠・進化の解放条件（グループ13）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('trigger.count: 装備している間に累計N回満たすと解放し、図鑑用の進捗が数で読める', () => {
    const e25 = findTitle('E25');
    expect(e25.targetValue).toBe(10);
    const ctx = { matchedColors: new Set(['fire', 'water']), tc: 12 };
    // 装備していない間は数えない
    unlockAndEquip({ suffixes: ['B20'], suffixId: null });
    recordTitleTrigger('turn', ctx);
    expect(getTitleProgressValue(e25, loadTitleState().progress)).toBe(0);

    unlockAndEquip({ suffixes: ['B20'], suffixId: 'B20' });
    for (let i = 0; i < 9; i++) recordTitleTrigger('turn', ctx);
    // 条件を満たさない手番は数えない
    recordTitleTrigger('turn', { matchedColors: new Set(['fire', 'water']), tc: 11 });
    expect(getTitleProgressValue(e25, loadTitleState().progress)).toBe(9);
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E25');
    recordTitleTrigger('turn', ctx);
    expect(loadTitleState().unlockedTitles.evolved).toContain('E25');
  });

  it('trigger.sum: E06 闇市の帝王 は 節約家 を装備している間の消費スターの合計で解放', () => {
    expect(findTitle('E06').targetValue).toBe(500);
    unlockAndEquip({ suffixes: ['B09'], suffixId: null });
    recordTitleTrigger('shop', { starsSpent: 400 });
    expect(loadTitleState().progress.evo_E06 || 0).toBe(0);

    unlockAndEquip({ suffixes: ['B09'], suffixId: 'B09' });
    recordTitleTrigger('shop', { starsSpent: 300 });
    recordTitleTrigger('shop', { shopRerolls: 1 }); // 消費の無いショップ操作は数えない
    expect(loadTitleState().progress.evo_E06).toBe(300);
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E06');
    recordTitleTrigger('shop', { starsSpent: 200 });
    expect(loadTitleState().unlockedTitles.evolved).toContain('E06');
  });

  it('E32 聖十字の は十字消しの回数を累計100回、E33 絶方の は正方形消しを累計50回', () => {
    expect(findTitle('E32').targetValue).toBe(100);
    expect(findTitle('E33').targetValue).toBe(50);
    unlockAndEquip({ prefixes: ['A26'], prefixId: 'A26' });
    recordTitleTrigger('turn', { shapes: ['cross', 'cross', 'square'] });
    expect(loadTitleState().progress.evo_E32).toBe(2);
    for (let i = 0; i < 49; i++) recordTitleTrigger('turn', { shapes: ['cross', 'cross'] });
    expect(loadTitleState().unlockedTitles.evolved).toContain('E32');

    // E33 は 方形の と 方陣師 の両方を装備している間だけ数える
    unlockAndEquip({ prefixes: ['A27'], suffixes: ['B04'], prefixId: 'A27', suffixId: null });
    recordTitleTrigger('turn', { shapes: ['square'] });
    expect(loadTitleState().progress.evo_E33 || 0).toBe(0);
    unlockAndEquip({ prefixes: ['A27'], suffixes: ['B04'], prefixId: 'A27', suffixId: 'B04' });
    recordTitleTrigger('turn', { shapes: ['square', 'cross'] });
    expect(loadTitleState().progress.evo_E33).toBe(1);
  });

  it('B22・B31・B40・B58 の解放条件', () => {
    expect(findTitle('B22')).toMatchObject({ conditionType: 'skill_tokens_max', targetValue: 6 });
    expect(findTitle('B22').effects[0].when).toEqual({ skill_tokens_ge: 4 });
    expect(findTitle('B31')).toMatchObject({ conditionType: 'skills_used', targetValue: 100 });
    expect(findTitle('B40')).toMatchObject({ conditionType: 'time_limit_max', targetValue: 10 });
    expect(findTitle('B40').effects).toEqual([{ type: 'time_add', value: 5000 }]);
    expect(findTitle('B58')).toMatchObject({ conditionType: 'probability_tokens_max', targetValue: 4 });

    recordTitleProgress({ max: { time_limit_max: 9.9 } });
    expect(loadTitleState().unlockedTitles.suffixes).not.toContain('B40');
    recordTitleProgress({ max: { time_limit_max: 10 } });
    expect(loadTitleState().unlockedTitles.suffixes).toContain('B40');
  });

  it('E16 大魔導 は1手番でアクティブスキルを8回', () => {
    unlockAndEquip({ suffixes: ['B03'], suffixId: 'B03' });
    recordTitleTrigger('turn', { skillsThisTurn: 7 });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E16');
    recordTitleTrigger('turn', { skillsThisTurn: 8 });
    expect(loadTitleState().unlockedTitles.evolved).toContain('E16');
  });

  it('E30・E35 は同じサイクルの間のショップ操作で判定する', () => {
    unlockAndEquip({ prefixes: ['A10', 'A19'], suffixes: ['B12', 'B17'], prefixId: 'A19', suffixId: 'B17' });
    recordTitleTrigger('shop', { shopCursesSold: 2, cycleCursesSold: 1 });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E35');
    recordTitleTrigger('shop', { shopCursesSold: 1, cycleCursesSold: 2 });
    expect(loadTitleState().unlockedTitles.evolved).toContain('E35');

    unlockAndEquip({ prefixes: ['A10'], suffixes: ['B12'], prefixId: 'A10', suffixId: 'B12' });
    recordTitleTrigger('shop', { shopRerolls: 5, cycleRerolls: 4 });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E30');
    recordTitleTrigger('shop', { shopRerolls: 1, cycleRerolls: 5 });
    expect(loadTitleState().unlockedTitles.evolved).toContain('E30');
  });
});

describe('B枠・進化の効果の作り直し（グループ14）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('E30 ミダスの手: ショップを開くたびの無料リロールは無く、サイクルクリア時に +2', () => {
    unlockAndEquip({ prefixes: ['A10'], suffixes: ['B12'], evolved: ['E30'], suffixId: 'E30' });
    const effects = getActiveTitleEffects();
    expect(getTitleEffectTotal('free_reroll', {}, effects)).toBe(0);
    expect(getTitleEffectTotal('cycle_free_reroll', {}, effects)).toBe(2);
    expect(applyTitleRerollPrice(5, effects)).toBe(1);
  });

  it('ショップを開くたびに無料リロールを付ける二つ名は無い（開き直しで何度でも無料になるため）。博徒 はサイクルクリア時に +1', () => {
    const all = [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES];
    expect(all.filter(t => t.effects.some(e => e.type === 'free_reroll')).map(t => t.id)).toEqual([]);
    expect(findTitle('B32').effects).toEqual([{ type: 'cycle_free_reroll', value: 1 }]);
  });

  it('B10 狂乱者: 5% で不発（呪いは対象外）。E34 パンドラの解放者 には引き継がない', () => {
    unlockAndEquip({ suffixes: ['B10'], suffixId: 'B10' });
    expect(getTitleSkillFizzleChance({ type: 'skill' })).toBeCloseTo(0.05);
    expect(getTitleSkillFizzleChance({ type: 'skill', isCurse: true })).toBe(0);
    expect(getTitleEffectTotal('skill_refund_chance', {})).toBeCloseTo(0.2);

    unlockAndEquip({ prefixes: ['A13'], suffixes: ['B10'], evolved: ['E34'], suffixId: 'E34' });
    expect(getTitleSkillFizzleChance({ type: 'skill' })).toBe(0);
  });
});

describe('B枠・進化レビューの確認事項（グループ15）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  it('B14 調律師: 1手で5属性以上を消した手番だけ、最終コンボ倍率 ×1.5', () => {
    unlockAndEquip({ suffixes: ['B14'], suffixId: 'B14' });
    const five = computeTitleComboModifiers({ matchedColors: new Set(['fire', 'water', 'wood', 'light', 'heart']) });
    expect(five.finalMult).toBeCloseTo(1.5);
    const six = computeTitleComboModifiers({ matchedColors: new Set(['fire', 'water', 'wood', 'light', 'dark', 'heart']) });
    expect(six.finalMult).toBeCloseTo(1.5);
    const four = computeTitleComboModifiers({ matchedColors: new Set(['fire', 'water', 'wood', 'light']) });
    expect(four.finalMult).toBeCloseTo(1);
    // ドロップの出現率は変えない
    const weights = applyTitleSpawnWeights({ fire: 1, water: 2, wood: 1, light: 1, dark: 1, heart: 1 }, {});
    expect(weights).toEqual({ fire: 1, water: 2, wood: 1, light: 1, dark: 1, heart: 1 });
  });

  it('E19 万象の調律者: 調律師を装備している間に、6属性すべてを消す、を累計30回', () => {
    expect(findTitle('E19').targetValue).toBe(30);
    unlockAndEquip({ suffixes: ['B14'], suffixId: 'B14' });
    const six = { matchedColors: new Set(['fire', 'water', 'wood', 'light', 'dark', 'heart']) };
    recordTitleTrigger('turn', { matchedColors: new Set(['fire', 'water', 'wood', 'light', 'dark']) });
    expect(loadTitleState().progress.evo_E19 || 0).toBe(0);
    for (let i = 0; i < 29; i++) recordTitleTrigger('turn', six);
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E19');
    recordTitleTrigger('turn', six);
    expect(loadTitleState().unlockedTitles.evolved).toContain('E19');
  });

  it('B26 呪術師 は呪い1つにつき ×1.3 で、E05 禍神の（×1.5）より弱い', () => {
    const ctx = { tokenCounts: { curse: 5 } };
    unlockAndEquip({ suffixes: ['B26'], suffixId: 'B26' });
    const b26 = computeTitleComboModifiers(ctx).baseMult;
    expect(b26).toBeCloseTo(Math.pow(1.3, 5));
    unlockAndEquip({ prefixes: ['A13'], evolved: ['E05'], prefixId: 'E05' });
    const e05 = computeTitleComboModifiers(ctx).baseMult;
    expect(e05).toBeCloseTo(Math.pow(1.5, 5));
    expect(b26).toBeLessThan(e05);
  });

  it('E25・E26 は累計10回', () => {
    expect(findTitle('E25').trigger).toMatchObject({ count: 10, when: { tc_ge: 12 } });
    expect(findTitle('E26').trigger).toMatchObject({ count: 10, when: { tc_ge: 14 } });
    expect(findTitle('E26').targetValue).toBe(10);
  });
});
