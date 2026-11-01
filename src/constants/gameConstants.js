const MAX_COMBO = 2147483647;
const MAX_TARGET = 4294967294;

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

/** 覚醒ショップでのトークン枠拡張に必要なスター数 */
const AWAKENING_TOKEN_SLOT_PRICES = [50, 500, 2000, 10000, 50000];

/** 初期トークン枠（スロット）数 */
const INITIAL_TOKEN_SLOTS = 4;

export { MAX_COMBO, MAX_TARGET, SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, TOKEN_PRICE_TIER, SHOP_REROLL_GROWTH_FACTOR, AWAKENING_TOKEN_SLOT_PRICES, INITIAL_TOKEN_SLOTS };

