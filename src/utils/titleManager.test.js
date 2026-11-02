import { describe, it, expect, beforeEach } from 'vitest';
import {
  PREFIX_TITLES,
  SUFFIX_TITLES,
  TITLE_SET_BONUSES,
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
  joinTitleName,
  isTitleDisabled,
  countUnlockedTitles,
  getTitleNewTokenLevel,
  applyTitleRerollPrice,
  VISIBLE_PREFIX_TITLES,
  VISIBLE_SUFFIX_TITLES,
  VISIBLE_TITLE_SET_BONUSES,
  VISIBLE_EVOLVED_TITLES,
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
  it('全196件・ID重複なし', () => {
    const all = [...PREFIX_TITLES, ...SUFFIX_TITLES, ...TITLE_SET_BONUSES, ...EVOLVED_TITLES];
    expect(all).toHaveLength(196);
    expect(new Set(all.map(t => t.id)).size).toBe(196);
  });

  it('6属性すべてが同じ構成（A枠・詠唱・B枠・進化・セット3種）を持つ', () => {
    const colors = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
    const mentions = (t, c) => JSON.stringify([t.effects, t.trigger]).includes(`"${c}"`);
    const prefixOf = Object.fromEntries(colors.map(c => [c, PREFIX_TITLES.find(t => t.effects.some(e => e.type === 'spawn_weight' && e.color === c))]));
    colors.forEach(c => {
      expect(prefixOf[c], c).toBeTruthy();
      expect(PREFIX_TITLES.filter(t => t.effects.some(e => e.type === 'skill_cost_sub' && e.attribute === c)), c).toHaveLength(1);
      expect(SUFFIX_TITLES.filter(t => t.effects.some(e => e.per === 'attr_token' && e.attribute === c)), c).toHaveLength(1);
      const evo = EVOLVED_TITLES.filter(t => t.requiredTitleId === prefixOf[c].id);
      expect(evo, c).toHaveLength(1);
      expect(evo[0].effects.some(e => e.type === 'add_mult' && e.value === 5.0 && e.when?.color === c), c).toBe(true);
      expect(TITLE_SET_BONUSES.filter(st => st.prefixId === prefixOf[c].id && mentions(st, c) || st.prefixId === prefixOf[c].id && st.suffixId === 'B01'), c).toHaveLength(3);
      const chant = PREFIX_TITLES.find(t => t.effects.some(e => e.type === 'skill_cost_sub' && e.attribute === c));
      expect(TITLE_SET_BONUSES.filter(st => mentions(st, c)), c).toHaveLength(4);
      expect(TITLE_SET_BONUSES.filter(st => st.prefixId === chant.id && st.suffixId === 'B03'), c).toHaveLength(1);
    });
  });

  it('仮置きデータが残っていない', () => {
    const all = [...PREFIX_TITLES, ...SUFFIX_TITLES, ...TITLE_SET_BONUSES, ...EVOLVED_TITLES];
    all.forEach(t => {
      const text = `${t.name || ''}${t.titleName || ''}${t.desc}${t.conditionDesc || ''}`;
      expect(text).not.toMatch(/特殊達成条件|特殊シナジー|超越称号|パターン #|_\d+$/);
    });
  });

  it('全ての二つ名が効果と正の目標値を持つ', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...EVOLVED_TITLES].forEach(t => {
      expect(t.effects?.length, t.id).toBeGreaterThan(0);
      expect(t.targetValue, t.id).toBeGreaterThan(0);
      expect(typeof t.conditionType, t.id).toBe('string');
    });
    TITLE_SET_BONUSES.forEach(s => expect(s.effects?.length, s.id).toBeGreaterThan(0));
  });

  it('シナジーと進化の参照先が存在し、組み合わせが重複しない', () => {
    const pids = new Set(PREFIX_TITLES.map(p => p.id));
    const sids = new Set(SUFFIX_TITLES.map(s => s.id));
    TITLE_SET_BONUSES.forEach(s => {
      expect(pids.has(s.prefixId), s.id).toBe(true);
      expect(sids.has(s.suffixId), s.id).toBe(true);
    });
    const pairs = TITLE_SET_BONUSES.map(s => `${s.prefixId}-${s.suffixId}`);
    expect(new Set(pairs).size).toBe(pairs.length);
    EVOLVED_TITLES.forEach(e => {
      expect(pids.has(e.requiredTitleId) || sids.has(e.requiredTitleId), e.id).toBe(true);
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

  it('初期状態は未解放・未装備', () => {
    const state = loadTitleState();
    expect(state.unlockedTitles.prefixes).toEqual([]);
    expect(state.equippedTitle).toEqual({ prefixId: null, suffixId: null });
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
    recordTitleProgress({ add: { erase_fire: 300 } });
    expect(loadTitleState().unlockedTitles.prefixes).not.toContain('A04');
    recordTitleProgress({ add: { erase_fire: 200 } });
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
    recordTitleTrigger('clear', { timeLeftMs: 5000 });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E01');

    unlockAndEquip({ prefixes: ['A01'], prefixId: 'A01' });
    recordTitleTrigger('clear', { timeLeftMs: 3000 });
    expect(loadTitleState().unlockedTitles.evolved).not.toContain('E01');
    recordTitleTrigger('clear', { timeLeftMs: 4000 });
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

  it('シナジーは進化版を装備していても元の二つ名として発動する', () => {
    unlockAndEquip({ prefixes: ['A01'], suffixes: ['B08'], evolved: ['E20'], prefixId: 'A01', suffixId: 'E20' });
    const info = getEquippedTitleInfo(loadTitleState().equippedTitle);
    expect(info.suffix.id).toBe('E20');
    expect(info.activeSet?.id).toBe('S02');
  });

  it('進化二つ名は対応する枠にしか装備できない', () => {
    unlockAndEquip({ evolved: ['E01'], prefixId: null, suffixId: 'E01' });
    expect(loadTitleState().equippedTitle.suffixId).toBeNull();
  });

  it('コンボ補正: 条件・回数・上限を考慮する', () => {
    unlockAndEquip({ prefixes: ['A04'], suffixes: ['B01'], prefixId: 'A04', suffixId: 'B01' });
    const effects = getActiveTitleEffects();
    // 紅蓮の(ショップ・出現率のみ) + 覇王(+1.5) + 真・紅蓮覇王(強化出現)
    expect(effects.some(e => e.type === 'shop_attr_weight' && e.attribute === 'fire')).toBe(true);
    const withFire = computeTitleComboModifiers({ matchedColors: new Set(['fire']), tc: 5 }, effects);
    expect(withFire.addedMult).toBeCloseTo(1.5);
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

  it('独りの極地: 刹那の/隠者のセットが発動する', () => {
    unlockAndEquip({ prefixes: ['A16'], suffixes: ['B57'], prefixId: 'A16', suffixId: 'B57' });
    const info = getEquippedTitleInfo(loadTitleState().equippedTitle);
    expect(info.activeSet?.id).toBe('S44');
    const mods = computeTitleComboModifiers({ tokenCounts: { token: 0 }, tc: 3 }, getActiveTitleEffects());
    expect(mods.finalMult).toBeCloseTo(5.4);
  });
});

describe('二つ名の整理（グループ7）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  const findAny = (id) => [...PREFIX_TITLES, ...SUFFIX_TITLES, ...TITLE_SET_BONUSES, ...EVOLVED_TITLES].find(t => t.id === id);

  it('ゲーム開始時の効果（start_stars / start_token_level）を持つ二つ名がない', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...TITLE_SET_BONUSES, ...EVOLVED_TITLES].forEach(t => {
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

  it('S16 黄金律: 利子 +20%、初期スターなし', () => {
    const effects = findAny('S16').effects;
    expect(getTitleEffectTotal('cycle_interest', {}, effects)).toBeCloseTo(0.2);
    expect(effects.some(e => e.type === 'start_stars')).toBe(false);
  });

  it('A20 先達の: 新しく手に入れたトークンの初期レベルが 2', () => {
    expect(getTitleNewTokenLevel(findAny('A20').effects)).toBe(2);
    expect(getTitleNewTokenLevel([])).toBe(1);
    unlockAndEquip({ prefixes: ['A20'], prefixId: 'A20' });
    expect(getTitleNewTokenLevel()).toBe(2);
  });

  it('エンチャント・虹ドロップを使う二つ名（A33・A45・S20・S39）は無効', () => {
    ['A33', 'A45', 'S20', 'S39'].forEach(id => expect(isTitleDisabled(id), id).toBe(true));
    ['A01', 'B01', 'S01', 'E01'].forEach(id => expect(isTitleDisabled(id), id).toBe(false));
    // 図鑑・装備画面の一覧に出ない
    expect(VISIBLE_PREFIX_TITLES.map(t => t.id)).not.toContain('A33');
    expect(VISIBLE_PREFIX_TITLES.map(t => t.id)).not.toContain('A45');
    expect(VISIBLE_TITLE_SET_BONUSES.map(t => t.id)).not.toContain('S20');
    expect(VISIBLE_TITLE_SET_BONUSES.map(t => t.id)).not.toContain('S39');
    expect(VISIBLE_PREFIX_TITLES).toHaveLength(PREFIX_TITLES.length - 2);
    expect(VISIBLE_SUFFIX_TITLES).toHaveLength(SUFFIX_TITLES.length);
    expect(VISIBLE_EVOLVED_TITLES).toHaveLength(EVOLVED_TITLES.length);
    // エンチャントを条件・効果に使う二つ名は、すべて無効になっている
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...TITLE_SET_BONUSES, ...EVOLVED_TITLES].forEach(t => {
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
    expect(countUnlockedTitles(state.unlockedTitles)).toBe(2);
    // セット（魔導工房）も発動しない
    const info = getEquippedTitleInfo({ prefixId: 'A45', suffixId: 'B28' });
    expect(info.prefix).toBeNull();
    expect(info.activeSet).toBeNull();
    expect(getActiveTitleEffects().some(e => e.per === 'enchant')).toBe(false);
  });

  it('「スキル」の表記をアクティブに揃えている', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...TITLE_SET_BONUSES, ...EVOLVED_TITLES].forEach(t => {
      ['desc', 'conditionDesc', 'challengeDesc', 'category'].forEach(key => {
        const text = t[key];
        if (typeof text !== 'string') return;
        // 「スキル」は「アクティブスキル」としてだけ使う
        expect(text.replace(/アクティブスキル/g, ''), `${t.id}.${key}`).not.toMatch(/スキル/);
      });
    });
  });

  it('「コンボ加算(+N)」の表記を使っていない', () => {
    [...PREFIX_TITLES, ...SUFFIX_TITLES, ...TITLE_SET_BONUSES, ...EVOLVED_TITLES].forEach(t => {
      ['desc', 'conditionDesc'].forEach(key => {
        expect(t[key] || '', `${t.id}.${key}`).not.toMatch(/\+N/);
      });
    });
  });
});
