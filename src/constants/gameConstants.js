const MAX_COMBO = 2147483647;
const MAX_TARGET = 4294967294;
// 試練のターンの操作時間（固定）
const TRIAL_TIME_LIMIT_MS = 5000;
// 試練発動時に作る盤面のコンボ数
const TRIAL_BOARD_COMBOS = 10;

const SAVE_KEY = 'puzzle_rogue_save';
const SETTINGS_KEY = 'puzzle_rogue_settings';

/** 設定のデフォルト値 */
const DEFAULT_SETTINGS = {
  comboAnimationMode: 'step', // 'instant' | 'step'
  bgmVolume: 0.5,
  seVolume: 0.7,
  bgmMuted: false,
  seMuted: false,
  speedMultiplier: 3, // デフォルト3倍速
};

/**
 * トークン価格の段階上昇設定（所持トークン総数ベース）
 * - 所持数が startOwned 未満なら定価
 * - startOwned 以上で1段階目、以降 stepOwned 個増えるごとに1段階上昇
 * - 価格倍率 = 1 + multiplierPerStep × 段階数
 *   例: 5-6個 ×1.2 / 7-8個 ×1.4 / 9-10個 ×1.6 / 11-12個 ×1.8 / 13-14個 ×2.0 ...
 */
const TOKEN_PRICE_TIER = {
  startOwned: 5,
  stepOwned: 2,
  multiplierPerStep: 0.2,
};
const SHOP_REROLL_GROWTH_FACTOR = 1.3;
// 前提トークン（requires）を満たした関連トークンのショップ出現重み倍率（例: ムーブドロップ所持時の関連トークン）
const SYNERGY_WEIGHT_MULTIPLIER = 2;

/** 覚醒ショップでのトークン枠拡張に必要なスター数 */
const AWAKENING_TOKEN_SLOT_PRICES = [50, 200, 500, 1000, 2000];

/** 初期トークン枠（スロット）数 */
const INITIAL_TOKEN_SLOTS = 4;

/** 時の貯金箱: 貯められる操作時間の上限（ミリ秒） */
const TIME_BANK_MAX_MS = 20000;

/** ラン中の二つ名切り替え価格: 初回 BASE ★、切り替えるたびに STEP ★ ずつ上がる */
const TITLE_SWITCH_COST = { base: 5, step: 5 };
/** 切り替え回数から次回の価格を求める */
const getTitleSwitchCost = (switchCount = 0) => TITLE_SWITCH_COST.base + TITLE_SWITCH_COST.step * Math.max(0, switchCount);

export { TRIAL_TIME_LIMIT_MS, TRIAL_BOARD_COMBOS, TIME_BANK_MAX_MS, TITLE_SWITCH_COST, getTitleSwitchCost, MAX_COMBO, MAX_TARGET, SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, TOKEN_PRICE_TIER, SHOP_REROLL_GROWTH_FACTOR, SYNERGY_WEIGHT_MULTIPLIER, AWAKENING_TOKEN_SLOT_PRICES, INITIAL_TOKEN_SLOTS };


/**
 * コンボによるスター獲得のスケーリング（スターインフレ対策）
 * - 目標が refTarget 以下の序盤は従来通り「コンボ数そのまま」でスター進捗を計算する
 * - 目標が refTarget を超えると「目標に対する割合」で計算する（目標1回分 = refTarget コンボ相当）
 * - 1手番で数えるコンボは「capRatio × max(目標, refTarget)」まで（序盤は実質無制限）
 *   例: 目標10億の手番で10億コンボ → 100コンボ相当（★20）、上限は500コンボ相当（★100）
 */
const STAR_COMBO_SCALING = {
  refTarget: 100,
  capRatio: 5,
};

export { STAR_COMBO_SCALING };
