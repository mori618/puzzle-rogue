import {
  PREFIX_TITLES,
  SUFFIX_TITLES,
  EVOLVED_TITLES
} from '../constants/titles.js';

const TITLE_STORAGE_KEY = 'pazuru_roguelike_title_state';

export const ALL_DROP_COLORS = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];

const findPrefix = (id) => PREFIX_TITLES.find(p => p.id === id) || null;
const findSuffix = (id) => SUFFIX_TITLES.find(s => s.id === id) || null;
const findEvolved = (id) => EVOLVED_TITLES.find(e => e.id === id) || null;
const findAnyTitle = (id) => findPrefix(id) || findSuffix(id) || findEvolved(id) || null;

/** 進化二つ名の元の二つ名（requiredTitleIds）。要素が配列なら「どれか1つ」のグループ */
const getRequiredEntries = (title) => (Array.isArray(title?.requiredTitleIds) ? title.requiredTitleIds : []);

/**
 * 今のゲームでは使えない二つ名か（disabled: true）。
 * 進化二つ名は、元の二つ名（グループでないもの）のどれかが無効なら無効。
 * 無効な二つ名は解放・装備・図鑑表示・効果の対象外（解放済みのセーブデータは消さずに残す）。
 */
export const isTitleDisabled = (titleOrId) => {
  const title = typeof titleOrId === 'string' ? findAnyTitle(titleOrId) : titleOrId;
  if (!title) return false;
  if (title.disabled) return true;
  return getRequiredEntries(title).some(entry => typeof entry === 'string' && isTitleDisabled(entry));
};

/** 図鑑・装備画面に出す二つ名の一覧（無効な二つ名を除く） */
export const VISIBLE_PREFIX_TITLES = PREFIX_TITLES.filter(t => !isTitleDisabled(t));
export const VISIBLE_SUFFIX_TITLES = SUFFIX_TITLES.filter(t => !isTitleDisabled(t));
export const VISIBLE_EVOLVED_TITLES = EVOLVED_TITLES.filter(t => !isTitleDisabled(t));

/** 二つ名の表示名（id から） */
export const getTitleName = (id) => findAnyTitle(id)?.name || '';

/** 最初から解放済みの二つ名（initial: true）。新しいセーブデータでは最初から装備する */
export const INITIAL_PREFIX_IDS = PREFIX_TITLES.filter(t => t.initial).map(t => t.id);
export const INITIAL_SUFFIX_IDS = SUFFIX_TITLES.filter(t => t.initial).map(t => t.id);
const INITIAL_TITLE_IDS = new Set([...INITIAL_PREFIX_IDS, ...INITIAL_SUFFIX_IDS]);

const createDefaultState = () => ({
  unlockedTitles: { prefixes: [...INITIAL_PREFIX_IDS], suffixes: [...INITIAL_SUFFIX_IDS], evolved: [] },
  equippedTitle: { prefixId: INITIAL_PREFIX_IDS[0] || null, suffixId: INITIAL_SUFFIX_IDS[0] || null },
  progress: {},
});

// ---------------------------------------------------------------------------
// 状態の読み書き
// ---------------------------------------------------------------------------

let cachedState = null;
let cachedEffects = null;

const uniqueStrings = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).filter(v => typeof v === 'string')));

/** 装備IDが指定スロットに装備可能か（解放済みかつ枠が一致するか） */
const isEquippableInSlot = (id, slot, unlocked) => {
  if (!id || isTitleDisabled(id)) return false;
  const evo = findEvolved(id);
  if (evo) return evo.slot === slot && unlocked.evolved.includes(id);
  if (slot === 'prefix') return !!findPrefix(id) && unlocked.prefixes.includes(id);
  return !!findSuffix(id) && unlocked.suffixes.includes(id);
};

const normalizeState = (parsed) => {
  const state = createDefaultState();
  if (!parsed || typeof parsed !== 'object') return state;

  state.unlockedTitles = {
    prefixes: uniqueStrings([...INITIAL_PREFIX_IDS, ...uniqueStrings(parsed.unlockedTitles?.prefixes)]).filter(id => findPrefix(id)),
    suffixes: uniqueStrings([...INITIAL_SUFFIX_IDS, ...uniqueStrings(parsed.unlockedTitles?.suffixes)]).filter(id => findSuffix(id)),
    evolved: uniqueStrings(parsed.unlockedTitles?.evolved).filter(id => findEvolved(id)),
  };

  const progress = {};
  if (parsed.progress && typeof parsed.progress === 'object') {
    Object.entries(parsed.progress).forEach(([k, v]) => {
      if (typeof v === 'number' && Number.isFinite(v)) progress[k] = v;
    });
  }
  state.progress = progress;

  // 明示的に外した状態 (null) を保持する。未解放・不正なIDは装備しない
  // 一度も装備を記録していない（undefined の）枠には、最初から解放済みの二つ名を装備する
  const eq = parsed.equippedTitle || {};
  const pick = (id, slot, fallback) => {
    if (id === undefined) return fallback;
    return isEquippableInSlot(id, slot, state.unlockedTitles) ? id : null;
  };
  state.equippedTitle = {
    prefixId: pick(eq.prefixId, 'prefix', INITIAL_PREFIX_IDS[0] || null),
    suffixId: pick(eq.suffixId, 'suffix', INITIAL_SUFFIX_IDS[0] || null),
  };
  return state;
};

const cloneState = (state) => ({
  unlockedTitles: {
    prefixes: [...state.unlockedTitles.prefixes],
    suffixes: [...state.unlockedTitles.suffixes],
    evolved: [...state.unlockedTitles.evolved],
  },
  equippedTitle: { ...state.equippedTitle },
  progress: { ...state.progress },
});

/**
 * ローカルストレージから二つ名状態を読み込み（呼び出し側で自由に変更できるようコピーを返す）
 */
export const loadTitleState = () => {
  if (!cachedState) {
    let parsed = null;
    try {
      const raw = localStorage.getItem(TITLE_STORAGE_KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load title state:', e);
    }
    cachedState = normalizeState(parsed);
  }
  return cloneState(cachedState);
};

/**
 * ローカルストレージに二つ名状態を保存
 */
export const saveTitleState = (titleState) => {
  const prevEquipped = cachedState ? JSON.stringify(cachedState.equippedTitle) : null;
  cachedState = normalizeState(titleState);
  // 効果は装備内容のみに依存するため、装備が変わった時だけ再計算する（参照の安定化）
  if (prevEquipped !== JSON.stringify(cachedState.equippedTitle)) {
    cachedEffects = null;
  }
  try {
    localStorage.setItem(TITLE_STORAGE_KEY, JSON.stringify(cachedState));
  } catch (e) {
    console.error('Failed to save title state:', e);
  }
};

/** テスト用: キャッシュを破棄して次回ストレージから読み直す */
export const resetTitleCache = () => {
  cachedState = null;
  cachedEffects = null;
};

// ---------------------------------------------------------------------------
// 解放通知の購読
// ---------------------------------------------------------------------------

const unlockListeners = new Set();

/** 二つ名解放時のコールバックを登録。戻り値は登録解除関数 */
export const subscribeTitleUnlock = (listener) => {
  unlockListeners.add(listener);
  return () => unlockListeners.delete(listener);
};

const emitUnlocks = (titles) => {
  if (titles.length === 0) return;
  unlockListeners.forEach(listener => {
    try {
      listener(titles);
    } catch (e) {
      console.error('Title unlock listener failed:', e);
    }
  });
};

// ---------------------------------------------------------------------------
// 装備情報
// ---------------------------------------------------------------------------

/**
 * 接頭辞と接尾辞を連結する。接頭辞が「の」で終わらない場合（例: 紅蓮の詠唱）は「・」で区切る
 */
export const joinTitleName = (prefixName, suffixName) => {
  if (!prefixName) return suffixName || '';
  if (!suffixName) return prefixName;
  return prefixName.endsWith('の') ? `${prefixName}${suffixName}` : `${prefixName}・${suffixName}`;
};

/** 枠に装備されたID（通常 or 進化）から二つ名データを解決する */
const resolveSlotTitle = (id, slot) => {
  if (!id || isTitleDisabled(id)) return null;
  const evo = findEvolved(id);
  if (evo) return evo.slot === slot ? evo : null;
  return slot === 'prefix' ? findPrefix(id) : findSuffix(id);
};

/**
 * 進化二つ名が、自分の枠で何の代わりになるか（同じ枠の元の二つ名の ID。グループ・別の枠のものは含まない）。
 * 例: E29 電撃の（A01＋B08、A枠）→ ['A01']
 */
const getSlotBaseIds = (title) => {
  if (!title?.slot) return [];
  const prefix = title.slot === 'prefix' ? 'A' : 'B';
  return getRequiredEntries(title).filter(e => typeof e === 'string' && e.startsWith(prefix));
};

/**
 * 装備中の二つ名を取得
 */
export const getEquippedTitleInfo = (equippedTitle = {}) => {
  const prefix = resolveSlotTitle(equippedTitle.prefixId, 'prefix');
  const suffix = resolveSlotTitle(equippedTitle.suffixId, 'suffix');

  let fullName = '未設定';
  if (prefix && suffix) {
    fullName = joinTitleName(prefix.name, suffix.name);
  } else if (prefix) {
    fullName = joinTitleName(prefix.name, '――');
  } else if (suffix) {
    fullName = `――の${suffix.name}`;
  }

  return {
    prefix,
    suffix,
    fullName,
  };
};

/** 指定IDの二つ名を装備しているか（同じ枠の元の二つ名として、その進化版を装備している場合も含む） */
export const isTitleEquipped = (titleId, equippedTitle = loadTitleState().equippedTitle) => {
  const info = getEquippedTitleInfo(equippedTitle);
  return [info.prefix, info.suffix].some(t => t && (t.id === titleId || getSlotBaseIds(t).includes(titleId)));
};

/**
 * 装備中の A枠の属性（属性のA枠 A04〜A09 か、その進化）。無ければ null
 */
export const getEquippedPrefixAttribute = (equippedTitle = loadTitleState().equippedTitle) => {
  const prefix = getEquippedTitleInfo(equippedTitle).prefix;
  if (!prefix) return null;
  if (prefix.attribute) return prefix.attribute;
  for (const baseId of getSlotBaseIds(prefix)) {
    const base = findPrefix(baseId);
    if (base?.attribute) return base.attribute;
  }
  return null;
};

const PREFIX_ATTR_TOKEN = '$prefix';

/**
 * when・効果の中の '$prefix' を装備中の A枠の属性に置き換える。属性が無ければ null（その効果・条件は不成立）
 */
const resolvePrefixAttr = (obj, attr) => {
  if (obj == null || typeof obj !== 'object') return obj === PREFIX_ATTR_TOKEN ? (attr || null) : obj;
  let missing = false;
  const walk = (o) => {
    if (Array.isArray(o)) return o.map(walk);
    if (o && typeof o === 'object') {
      const out = {};
      Object.entries(o).forEach(([k, v]) => { out[k] = walk(v); });
      return out;
    }
    if (o === PREFIX_ATTR_TOKEN) {
      if (!attr) missing = true;
      return attr;
    }
    return o;
  };
  const resolved = walk(obj);
  return missing ? null : resolved;
};

/**
 * 現在発動中の全効果を取得（装備中のA枠・B枠）。各効果には source（二つ名名）が付与される
 */
export const getActiveTitleEffects = () => {
  if (cachedEffects) return cachedEffects;
  const state = loadTitleState();
  const info = getEquippedTitleInfo(state.equippedTitle);
  const prefixAttr = getEquippedPrefixAttribute(state.equippedTitle);
  const effects = [];
  [info.prefix, info.suffix].forEach(title => {
    if (!title || !Array.isArray(title.effects)) return;
    const source = title.name;
    title.effects.forEach(effect => {
      const resolved = resolvePrefixAttr(effect, prefixAttr);
      if (resolved) effects.push({ ...resolved, source });
    });
  });
  cachedEffects = effects;
  return effects;
};

// ---------------------------------------------------------------------------
// 効果の判定
// ---------------------------------------------------------------------------

const SHAPE_KEYS = ['cross', 'square', 'l_shape', 'row', 'len4'];
const SPECIAL_SHAPES_NO_LEN4 = ['cross', 'square', 'l_shape', 'row'];

/**
 * トークン構成から二つ名判定用のカウントを算出
 */
export const getTokenTitleCounts = (tokens = []) => {
  const list = (tokens || []).filter(Boolean);
  const isCurse = (t) => t.type === 'curse' || t.isCurse === true;
  const attrCounts = {};
  list.forEach(t => {
    (t.attributes || []).forEach(a => {
      if (!a || a === 'none') return;
      attrCounts[a] = (attrCounts[a] || 0) + 1;
    });
  });
  return {
    token: list.length,
    curse: list.filter(isCurse).length,
    lv3: list.filter(t => !isCurse(t) && (t.level || 1) >= 3).length,
    lv2plus: list.filter(t => !isCurse(t) && (t.level || 1) >= 2).length,
    passive: list.filter(t => t.type === 'passive').length,
    skill: list.filter(t => t.type === 'skill').length,
    enchant: list.reduce((sum, t) => sum + (t.enchantments?.length || 0), 0),
    sameAttrMax: Object.values(attrCounts).reduce((m, v) => Math.max(m, v), 0),
    attrCounts,
  };
};

/**
 * 発動条件 (when) の判定。ctx に必要な値が無い条件は不成立として扱う
 */
export const evaluateTitleWhen = (when, ctx = {}) => {
  if (!when) return true;
  const counts = ctx.tokenCounts || {};
  const colors = ctx.matchedColors instanceof Set ? ctx.matchedColors : new Set(ctx.matchedColors || []);
  return Object.entries(when).every(([key, val]) => {
    switch (key) {
      case 'color': return colors.has(val);
      case 'first_turn': return (ctx.turn === 1) === val;
      case 'last_turn': return (ctx.turn != null && ctx.turn === ctx.maxTurns) === val;
      case 'stars_le': return ctx.stars != null && ctx.stars <= val;
      case 'stars_ge': return ctx.stars != null && ctx.stars >= val;
      case 'tokens_le': return (counts.token ?? Infinity) <= val;
      case 'tokens_ge': return (counts.token ?? 0) >= val;
      case 'curses_ge': return (counts.curse ?? 0) >= val;
      case 'same_attr_ge': return (counts.sameAttrMax ?? 0) >= val;
      case 'skill_tokens_ge': return (counts.skill ?? 0) >= val;
      case 'time_left_ge': return (ctx.timeLeftMs ?? -1) >= val;
      case 'time_left_lt': return ctx.timeLeftMs != null && ctx.timeLeftMs < val;
      case 'move_steps_ge': return (ctx.moveSteps ?? 0) >= val;
      case 'skill_used': return !!ctx.skillUsed === val;
      case 'prev_skill_used': return !!ctx.prevSkillUsed === val;
      // 手番の後半（残り手番が半分以下）で、目標達成率が50%未満
      case 'behind': return (ctx.turn != null && ctx.maxTurns != null && ctx.goalProgress != null
        && ctx.turn > ctx.maxTurns / 2 && ctx.goalProgress < 0.5) === val;
      case 'progress_ge': return (ctx.goalProgress ?? 0) >= val; // 王手の: この手番の前の目標達成率
      case 'no_purchase': return (ctx.purchasesThisCycle === 0) === val;
      case 'skills_this_turn_ge': return (ctx.skillsThisTurn ?? 0) >= val;
      case 'colors_ge': return colors.size >= val;
      case 'colors_le': return colors.size >= 1 && colors.size <= val;
      case 'colors_all': return (val || []).every(c => colors.has(c)); // 指定した属性をすべて消した
      case 'all_clear': return !!ctx.isAllClear === val;
      case 'tc_ge': return (ctx.tc ?? 0) >= val;
      case 'tc_le': return ctx.tc != null && ctx.tc >= 1 && ctx.tc <= val;
      case 'combo_ge': return (ctx.effectiveCombo ?? 0) >= val;
      case 'base_combo_ge': return (ctx.baseCombo ?? 0) >= val;
      case 'cycle_ge': return (ctx.cycle ?? 0) >= val;
      case 'shape': return (ctx.shapes || []).includes(val);
      case 'erased_ge': return ((ctx.erasedColorCounts || {})[val.color] || 0) >= val.n;
      case 'bomb_erased_ge': return (ctx.bombErased ?? 0) >= val;
      case 'enhanced_erased_ge': return (ctx.enhancedErased ?? 0) >= val;
      case 'star_erased_ge': return (ctx.starErased ?? 0) >= val;
      case 'time_left_le': return ctx.timeLeftMs != null && ctx.timeLeftMs <= val;
      case 'stars_gained_ge': return (ctx.starsGained ?? 0) >= val;
      case 'shape_count_ge': return (ctx.shapes || []).filter(s => s === val.shape).length >= val.n;
      case 'shape_kinds_ge': return new Set((ctx.shapes || []).filter(s => SPECIAL_SHAPES_NO_LEN4.includes(s))).size >= val;
      case 'lv3_ge': return (counts.lv3 ?? 0) >= val;
      case 'no_skyfall_turn': return (ctx.noSkyfall === true) === val;
      case 'shop_rerolls_ge': return (ctx.shopRerolls ?? 0) >= val;
      case 'shop_curses_sold_ge': return (ctx.shopCursesSold ?? 0) >= val;
      // 同じサイクルの間のショップ操作（ショップを開き直してもリセットしない）
      case 'cycle_rerolls_ge': return (ctx.cycleRerolls ?? 0) >= val;
      case 'cycle_curses_sold_ge': return (ctx.cycleCursesSold ?? 0) >= val;
      case 'shop_sales_bought_ge': return (ctx.shopSalesBought ?? 0) >= val;
      default: return false;
    }
  });
};

/**
 * 「〜1つにつき」(per) のカウント
 */
export const getTitlePerCount = (per, ctx = {}, effect = {}) => {
  const counts = ctx.tokenCounts || {};
  const colors = ctx.matchedColors instanceof Set ? ctx.matchedColors : new Set(ctx.matchedColors || []);
  switch (per) {
    case 'curse': return counts.curse || 0;
    case 'lv3': return counts.lv3 || 0;
    case 'lv2plus': return counts.lv2plus || 0;
    case 'passive': return counts.passive || 0;
    case 'token': return counts.token || 0;
    case 'enchant': return counts.enchant || 0;
    case 'time_left_sec': return Math.floor((ctx.timeLeftMs || 0) / 1000);
    case 'special_shape': return (ctx.shapes || []).filter(s => SHAPE_KEYS.includes(s)).length;
    case 'special_shape_nolen4': return (ctx.shapes || []).filter(s => SPECIAL_SHAPES_NO_LEN4.includes(s)).length;
    case 'len4': return (ctx.shapes || []).filter(s => s === 'len4').length;
    case 'len5': return ctx.len5Count || 0;
    case 'bomb_erased': return ctx.bombErased || 0;
    case 'repeat_erased': return ctx.repeatErased || 0;
    case 'rainbow_erased': return ctx.rainbowErased || 0;
    case 'enhanced_erased': return ctx.enhancedErased || 0;
    case 'heart_erased': return (ctx.erasedColorCounts || {}).heart || 0;
    case 'color_erased': return (ctx.erasedColorCounts || {})[effect.color] || 0;
    case 'attr_token': return (counts.attrCounts || {})[effect.attribute] || 0;
    case 'color_count': return colors.size;
    case 'clears': return ctx.clears || 0;
    case 'cycle': return ctx.cycle || 0;
    case 'move_steps': return ctx.moveSteps || 0;
    case 'tc': return ctx.tc || 0;
    case 'prev_combo': return ctx.prevCombo || 0;
    case 'stars_10': return Math.max(0, Math.floor((ctx.stars || 0) / 10)); // 借金（マイナス）は 0 扱い
    case 'stars_100': return Math.max(0, Math.floor((ctx.stars || 0) / 100));
    case 'shape_count': return (ctx.shapes || []).filter(s => s === effect.shape).length; // effect.shape の特殊消しの回数
    case 'stars_spent': return Math.max(0, ctx.starsSpent || 0); // 今回消費したスター
    default: return 0;
  }
};

/** 効果が発動する回数（when 不成立なら 0、per 無しなら 1） */
const getEffectCount = (effect, ctx) => {
  if (!evaluateTitleWhen(effect.when, ctx)) return 0;
  if (!effect.per) return 1;
  const count = getTitlePerCount(effect.per, ctx, effect);
  return effect.max != null ? Math.min(count, effect.max) : count;
};

/**
 * 指定タイプの効果値の合計（per/when 考慮）
 */
export const getTitleEffectTotal = (type, ctx = {}, effects = getActiveTitleEffects()) => {
  return effects
    .filter(e => e.type === type)
    .reduce((sum, e) => sum + (Number(e.value) || 0) * getEffectCount(e, ctx), 0);
};

/**
 * 指定タイプの効果値の積（per/when 考慮）。該当なしは 1
 */
export const getTitleEffectProduct = (type, ctx = {}, effects = getActiveTitleEffects()) => {
  return effects
    .filter(e => e.type === type)
    .reduce((prod, e) => {
      const count = getEffectCount(e, ctx);
      return count > 0 ? prod * Math.pow(Number(e.value), count) : prod;
    }, 1);
};

/** 指定タイプの効果リスト（when 成立分のみ） */
export const getTitleEffects = (type, ctx = {}, effects = getActiveTitleEffects()) => {
  return effects.filter(e => e.type === type && evaluateTitleWhen(e.when, ctx));
};

/** 指定タイプの効果が発動しているか */
export const hasTitleEffect = (type, ctx = {}, effects = getActiveTitleEffects()) => {
  return getTitleEffects(type, ctx, effects).length > 0;
};

/**
 * コンボ計算用の補正値を算出
 * @returns {{ comboAdd:number, addedMult:number, baseMult:number, finalMult:number, comboAddScale:number, steps:Array }}
 */
export const computeTitleComboModifiers = (ctx = {}, effects = getActiveTitleEffects()) => {
  const result = { comboAdd: 0, addedMult: 0, baseMult: 1, finalMult: 1, comboAddScale: 1, steps: [] };
  effects.forEach(effect => {
    const count = getEffectCount(effect, ctx);
    if (count <= 0) return;
    const v = Number(effect.value) || 0;
    const label = `二つ名: ${effect.source || ''}`;
    switch (effect.type) {
      case 'combo_add': {
        const add = Math.floor(v * count);
        if (add === 0) return;
        result.comboAdd += add;
        result.steps.push({ kind: 'bonus', label, value: add });
        break;
      }
      case 'add_mult': {
        const add = v * count;
        result.addedMult += add;
        result.steps.push({ kind: 'mult', label, value: 1 + add, addedValue: add, type: 'add' });
        break;
      }
      case 'base_mult': {
        const mult = Math.pow(v, count);
        result.baseMult *= mult;
        result.steps.push({ kind: 'mult', label, value: mult, type: 'mult' });
        break;
      }
      case 'base_mult_step': {
        const mult = 1 + v * count;
        result.baseMult *= mult;
        result.steps.push({ kind: 'mult', label, value: mult, type: 'mult' });
        break;
      }
      case 'final_mult': {
        const mult = Math.pow(v, count);
        result.finalMult *= mult;
        result.steps.push({ kind: 'mult', label, value: mult, type: 'mult' });
        break;
      }
      case 'combo_add_scale':
        result.comboAddScale *= Math.pow(v, count);
        break;
      case 'final_mult_gamble': {
        // 50% で ×value、50% で ×(1/value)
        const rand = typeof ctx.random === 'function' ? ctx.random : Math.random;
        const win = rand() < 0.5;
        const mult = win ? v : 1 / v;
        result.finalMult *= mult;
        result.steps.push({ kind: 'mult', label: `${label}（${win ? '勝ち' : '負け'}）`, value: mult, type: 'mult' });
        break;
      }
      default:
        break;
    }
  });
  return result;
};

/**
 * 操作時間への補正を適用
 * @param {number} baseMs 通常の操作時間
 * @param {boolean} isOverridden トークン効果で時間が固定されている場合 true（加算は行わない）
 */
/** 帳尻師: 目標の超過がこの割合以内ならスターがもらえる */
export const EXACT_CLEAR_MAX_OVERSHOOT = 0.1;

/** サイクルクリア時の目標超過率（0 = ちょうど、0.1 = 10%超過） */
export const getClearOvershootRatio = (total, target) => (target > 0 ? (total - target) / target : Infinity);

/**
 * 帳尻師: 目標の超過が少ないほど多くのスター（ちょうどなら maxStars、超過10%で0に近づく。最低1）。
 * 超過10%を超えた場合と、効果が無い場合は 0。
 */
export const getExactClearStars = (total, target, maxStars) => {
  if (!(maxStars > 0)) return 0;
  const ratio = getClearOvershootRatio(total, target);
  if (ratio < 0 || ratio > EXACT_CLEAR_MAX_OVERSHOOT) return 0;
  return Math.max(1, Math.round(maxStars * (1 - ratio / EXACT_CLEAR_MAX_OVERSHOOT)));
};

export const applyTitleTimeLimit = (baseMs, isOverridden = false, effects = getActiveTitleEffects()) => {
  if (isOverridden) return baseMs;
  const fixed = effects.filter(e => e.type === 'time_fixed').map(e => e.value);
  if (fixed.length > 0) return Math.min(...fixed);
  const scale = getTitleEffectProduct('time_scale', {}, effects);
  return baseMs * scale + getTitleEffectTotal('time_add', {}, effects);
};

/**
 * ドロップ出現重みへの補正を適用
 * @param {Object} weights { fire: 1, ... }（直接変更される）
 * @param {Object} progress 累計消去数の参照用（spawn_top_colors）
 */
export const applyTitleSpawnWeights = (weights, progress = loadTitleState().progress, effects = getActiveTitleEffects()) => {
  effects.forEach(e => {
    if (e.type === 'spawn_weight' && weights[e.color] !== undefined) {
      weights[e.color] *= e.value;
    }
    if (e.type === 'spawn_top_colors') {
      const ranked = [...ALL_DROP_COLORS].sort((a, b) => (progress[`erase_${b}`] || 0) - (progress[`erase_${a}`] || 0));
      ranked.slice(0, e.count || 1).forEach(c => { weights[c] *= e.value; });
    }
  });
  if (effects.some(e => e.type === 'spawn_equalize')) {
    Object.keys(weights).forEach(c => { if (weights[c] > 0) weights[c] = 1; });
  }
  effects.filter(e => e.type === 'spawn_only').forEach(e => {
    // 出現可能な色が残る場合のみ制限する（全色0になるのを防ぐ）
    if (e.colors.some(c => weights[c] > 0)) {
      Object.keys(weights).forEach(c => { if (!e.colors.includes(c)) weights[c] = 0; });
    }
  });
  effects.filter(e => e.type === 'spawn_exclude').forEach(e => {
    // 指定した色を降らせない（調律師）。ほかに出現可能な色が残る場合のみ（全色0になるのを防ぐ）
    const excluded = e.colors || [];
    if (Object.keys(weights).some(c => !excluded.includes(c) && weights[c] > 0)) {
      excluded.forEach(c => { if (weights[c] !== undefined) weights[c] = 0; });
    }
  });
  return weights;
};

/**
 * 新しく手に入れたトークンの初期レベル（new_token_level の最大値。該当なしは 1）
 */
export const getTitleNewTokenLevel = (effects = getActiveTitleEffects()) => {
  return getTitleEffects('new_token_level', {}, effects).reduce((m, e) => Math.max(m, Number(e.value) || 1), 1);
};

/**
 * ショップのリロール価格への補正（reroll_fixed で固定 → reroll_sub で値引き。1★未満にはならない）
 */
export const applyTitleRerollPrice = (basePrice, effects = getActiveTitleEffects()) => {
  const fixed = getTitleEffects('reroll_fixed', {}, effects).reduce((m, e) => Math.min(m, e.value), Infinity);
  let price = Number.isFinite(fixed) ? Math.min(fixed, basePrice) : basePrice;
  const sub = getTitleEffectTotal('reroll_sub', {}, effects);
  if (sub > 0) price = Math.max(1, price - sub);
  return price;
};

/**
 * アクティブスキルの効果が発動しない確率（狂乱者: skill_fizzle_chance）。呪いのアクティブは対象外。無ければ 0
 */
export const getTitleSkillFizzleChance = (token, effects = getActiveTitleEffects()) => {
  if (!token || token.isCurse || token.type === 'curse') return 0;
  return Math.min(1, getTitleEffectTotal('skill_fizzle_chance', {}, effects));
};

/**
 * スキルの消費エネルギー軽減量
 */
export const getTitleSkillCostReduction = (token, effects = getActiveTitleEffects()) => {
  if (!token) return 0;
  const attrs = token.attributes || [];
  return effects
    .filter(e => e.type === 'skill_cost_sub' && (!e.attribute || attrs.includes(e.attribute)))
    .reduce((sum, e) => sum + (e.value || 0), 0);
};

/**
 * スキルの消費エネルギーを固定する値（詠唱者）。固定しない場合は null
 */
export const getTitleSkillCostFixed = (token, effects = getActiveTitleEffects()) => {
  if (!token || token.isCurse || token.type === 'curse') return null;
  const fixed = getTitleEffects('skill_cost_fixed', {}, effects).reduce((m, e) => Math.min(m, e.value), Infinity);
  return Number.isFinite(fixed) ? fixed : null;
};

/** 二つ名で封印されるパッシブトークンか（呪いは封印しない） */
export const isTitleSealablePassive = (t) => !!t && t.type === 'passive' && !t.isCurse;

/** パッシブトークンの効果が発動しない（詠唱者） */
export const isTitlePassiveNull = (effects = getActiveTitleEffects()) => hasTitleEffect('passive_null', {}, effects);

/** アクティブスキルを使えない（苦行者）。呪いのアクティブトークンは使える */
export const isTitleActiveNull = (effects = getActiveTitleEffects()) => hasTitleEffect('active_null', {}, effects);
export const isTitleSealedActive = (token, effects = getActiveTitleEffects()) =>
  !!token && token.type === 'skill' && !token.isCurse && isTitleActiveNull(effects);

/**
 * 効果の計算に使うトークン一覧。パッシブが封印されているときは、封印されたパッシブを null にする
 * （並び順に意味がある効果があるため、要素は詰めない）
 */
export const applyTitlePassiveSeal = (tokens, effects = getActiveTitleEffects()) => {
  if (!Array.isArray(tokens) || !isTitlePassiveNull(effects)) return tokens;
  return tokens.map(t => (isTitleSealablePassive(t) ? null : t));
};

/** 手番ごとに各パッシブが2回発動する確率（苦行者）。無ければ 0 */
export const getTitlePassiveDoubleChance = (effects = getActiveTitleEffects()) =>
  getTitleEffects('passive_double_chance', {}, effects).reduce((m, e) => Math.max(m, e.value || 0), 0);

/**
 * 2回発動するパッシブトークンを抽選する（各トークンを chance の確率で選ぶ）
 * @returns {Set<string|number>} 選ばれたトークンの instanceId（無ければ id）
 */
export const rollTitleDoubledPassives = (tokens, chance, random = Math.random) => {
  const ids = new Set();
  if (!(chance > 0) || !Array.isArray(tokens)) return ids;
  tokens.forEach(t => {
    if (isTitleSealablePassive(t) && random() < chance) ids.add(t.instanceId || t.id);
  });
  return ids;
};

// ---------------------------------------------------------------------------
// 進捗と解放判定
// ---------------------------------------------------------------------------

const getAllTitleLists = () => [
  { kind: 'prefix', list: PREFIX_TITLES, key: 'prefixes' },
  { kind: 'suffix', list: SUFFIX_TITLES, key: 'suffixes' },
  { kind: 'evolved', list: EVOLVED_TITLES, key: 'evolved' },
];

/** 解放数（無効な二つ名は、解放済みでも数えない） */
const countUnlocked = (unlocked) => [...unlocked.prefixes, ...unlocked.suffixes, ...unlocked.evolved]
  .filter(id => !isTitleDisabled(id)).length;

/** 「合計○種解放」の条件（titles_unlocked）用の数。最初から解放済みの二つ名は数えない */
const countEarnedUnlocks = (unlocked) => [...unlocked.prefixes, ...unlocked.suffixes, ...unlocked.evolved]
  .filter(id => !isTitleDisabled(id) && !INITIAL_TITLE_IDS.has(id)).length;

/** 解放済みの二つ名の数（図鑑表示用。無効な二つ名は除く） */
export const countUnlockedTitles = (unlocked) => countUnlocked({
  prefixes: unlocked?.prefixes || [],
  suffixes: unlocked?.suffixes || [],
  evolved: unlocked?.evolved || [],
});

/**
 * 実績・条件達成状況のプログレス値を取得
 */
export const getTitleProgressValue = (title, progress = loadTitleState().progress) => {
  if (!title) return 0;
  if (title.conditionType === 'titles_unlocked') {
    return countEarnedUnlocks(loadTitleState().unlockedTitles);
  }
  return progress?.[title.conditionType] || 0;
};

const isIdUnlocked = (id, unlocked) => unlocked.prefixes.includes(id) || unlocked.suffixes.includes(id) || unlocked.evolved.includes(id);

/**
 * 元の二つ名の条件を満たしているか。
 * requiredMin 無し: すべて（グループはどれか1つ）が check を満たす。
 * requiredMin あり: グループを展開した ID のうち、check を満たすものが requiredMin 個以上
 *   （E47: 詠唱6種のうち3つ＋魔導士 → グループ外の ID は必須、グループ内で requiredMin 個）。
 */
const meetsRequired = (title, check) => {
  const entries = getRequiredEntries(title);
  if (title.requiredMin != null) {
    const singles = entries.filter(e => typeof e === 'string');
    const grouped = entries.filter(Array.isArray).flat();
    return singles.every(check) && grouped.filter(check).length >= title.requiredMin;
  }
  return entries.every(e => (Array.isArray(e) ? e.some(check) : check(e)));
};

const isRequirementMet = (title, unlocked) => meetsRequired(title, id => isIdUnlocked(id, unlocked));

/** 進化二つ名の元の二つ名がすべて解放済みか（図鑑表示用） */
export const isEvolvedBaseUnlocked = (title, unlocked) => isRequirementMet(title, {
  prefixes: unlocked?.prefixes || [],
  suffixes: unlocked?.suffixes || [],
  evolved: unlocked?.evolved || [],
});

/**
 * 進化二つ名の元の二つ名を表示用の文にする。未解放の二つ名は「？？？」で伏せる。
 * 例: 「神速の＋無双」「覇王＋属性のA枠（紅蓮の／蒼海の／…）」「〜の詠唱のうち3つ＋魔導士」
 */
export const describeRequiredTitles = (title, unlocked = null) => {
  const nameOf = (id) => (!unlocked || isIdUnlocked(id, {
    prefixes: unlocked.prefixes || [], suffixes: unlocked.suffixes || [], evolved: unlocked.evolved || [],
  }) ? getTitleName(id) : '？？？');
  const parts = getRequiredEntries(title).map(e => {
    if (!Array.isArray(e)) return nameOf(e);
    const names = e.map(nameOf).join('／');
    return title.requiredMin != null ? `（${names}）のうち${title.requiredMin}つ` : `（${names}）のどれか`;
  });
  return parts.join('＋');
};

/** state を直接変更して新規解放を判定する（連鎖解放に対応） */
const unlockEligibleTitles = (state) => {
  const newlyUnlocked = [];
  let changed = true;
  while (changed) {
    changed = false;
    state.progress.titles_unlocked = countEarnedUnlocks(state.unlockedTitles);
    getAllTitleLists().forEach(({ kind, list, key }) => {
      list.forEach(title => {
        if (state.unlockedTitles[key].includes(title.id)) return;
        if (isTitleDisabled(title)) return;
        if (!isRequirementMet(title, state.unlockedTitles)) return;
        const val = state.progress[title.conditionType] || 0;
        if (val >= title.targetValue) {
          state.unlockedTitles[key].push(title.id);
          newlyUnlocked.push({ ...title, kind });
          changed = true;
        }
      });
    });
  }
  state.progress.titles_unlocked = countEarnedUnlocks(state.unlockedTitles);
  return newlyUnlocked;
};

/**
 * 進捗を記録し、新たに解放された二つ名を返す（解放時は購読者へ通知）
 * @param {{ add?: Object<string, number>, max?: Object<string, number> }} updates
 *   add: 累計値に加算 / max: 最大値を更新
 */
export const recordTitleProgress = (updates = {}) => {
  const state = loadTitleState();
  let changed = false;

  Object.entries(updates.add || {}).forEach(([key, n]) => {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return;
    state.progress[key] = (state.progress[key] || 0) + v;
    changed = true;
  });
  Object.entries(updates.max || {}).forEach(([key, n]) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return;
    if (v > (state.progress[key] || 0)) {
      state.progress[key] = v;
      changed = true;
    }
  });

  if (!changed) return [];

  // 全属性の最小消去数（パズルマスター用）
  state.progress.erase_min_color = Math.min(...ALL_DROP_COLORS.map(c => state.progress[`erase_${c}`] || 0));

  const newlyUnlocked = unlockEligibleTitles(state);
  saveTitleState(state);
  emitUnlocks(newlyUnlocked);
  return newlyUnlocked;
};

/**
 * 進化二つ名のトリガー判定
 *   trigger.count 無し : 条件を1回満たしたら解放（evo_<id> = 1）
 *   trigger.count あり : 条件を満たすたびに evo_<id> に 1 を加算し、count に達したら解放
 *   trigger.sum あり   : 1 ではなく getTitlePerCount(sum) の量を加算する（例: 'stars_spent'・'shape_count'）
 * 数えるのは requireMode の条件（装備中など）を満たしている間だけ。
 * @param {'turn'|'clear'|'state'|'shop'} event
 * @param {Object} ctx evaluateTitleWhen と同じ文脈
 */
export const recordTitleTrigger = (event, ctx = {}) => {
  const state = loadTitleState();
  const max = {};
  const add = {};
  EVOLVED_TITLES.forEach(title => {
    const trigger = title.trigger;
    if (!trigger || trigger.event !== event) return;
    if (state.unlockedTitles.evolved.includes(title.id)) return;
    if (isTitleDisabled(title)) return;
    if (!isRequirementMet(title, state.unlockedTitles)) return;
    if (title.requireMode === 'equipped' && !meetsRequired(title, id => isTitleEquipped(id, state.equippedTitle))) return;
    const prefixAttr = getEquippedPrefixAttribute(state.equippedTitle);
    let when = null;
    if (trigger.when) {
      when = resolvePrefixAttr(trigger.when, prefixAttr);
      if (!when) return;
    }
    if (!evaluateTitleWhen(when, ctx)) return;
    if (trigger.count == null) {
      max[title.conditionType] = 1;
      return;
    }
    const amount = trigger.sum ? getTitlePerCount(trigger.sum, ctx, trigger) : 1;
    if (amount > 0) add[title.conditionType] = amount;
  });
  if (Object.keys(max).length === 0 && Object.keys(add).length === 0) return [];
  return recordTitleProgress({ max, add });
};

/**
 * 現在の進捗で解放可能な二つ名をまとめて解放する（データ更新後の再判定用）
 */
export const checkAndUnlockTitles = () => {
  const state = loadTitleState();
  const newlyUnlocked = unlockEligibleTitles(state);
  if (newlyUnlocked.length > 0) {
    saveTitleState(state);
    emitUnlocks(newlyUnlocked);
  }
  return state;
};

/** 解放通知用の表示名 */
export const getTitleKindLabel = (title) => {
  if (!title) return '';
  if (title.kind === 'evolved' || title.requiredTitleIds) return '進化二つ名';
  if (title.kind === 'prefix' || title.id?.startsWith('A')) return 'A枠';
  return 'B枠';
};
