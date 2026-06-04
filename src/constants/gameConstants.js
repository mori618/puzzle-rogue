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

const TOKEN_PRICE_GROWTH_FACTOR = 1.15;
const SHOP_REROLL_GROWTH_FACTOR = 1.3;

/** 覚醒ショップでのトークン枠拡張に必要なスター数 */
const AWAKENING_TOKEN_SLOT_PRICES = [100, 500, 2000, 10000, 50000];

export { MAX_COMBO, MAX_TARGET, SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, TOKEN_PRICE_GROWTH_FACTOR, SHOP_REROLL_GROWTH_FACTOR, AWAKENING_TOKEN_SLOT_PRICES };

