const ENCHANT_DESCRIPTIONS = {
  resonance: "トークンのLv分、コンボ加算値を乗算する。",
  greed: "現在の所持★数をコンボ加算値に加える。",
  chain: "コンボ加算値を一律+3する。",
  extra_turn: "目標達成までの手番が +1 される。",
  time_leap: "前のサイクルでスキップしたターン数分、次のサイクルの全ターンでコンボ加算。",
  combo_fire: "炎の1コンボにつきコンボ+1。",
  combo_water: "雨の1コンボにつきコンボ+1。",
  combo_wood: "風の1コンボにつきコンボ+1。",
  combo_light: "雷の1コンボにつきコンボ+1。",
  combo_dark: "月の1コンボにつきコンボ+1。",
  combo_heart: "ハートの1コンボにつきコンボ+1。",
  enh_drop_fire: "炎ドロップが15%強化で落下。",
  enh_drop_water: "雨ドロップが15%強化で落下。",
  enh_drop_wood: "風ドロップが15%強化で落下。",
  enh_drop_light: "雷ドロップが15%強化で落下。",
  enh_drop_dark: "月ドロップが15%強化で落下。",
  enh_drop_heart: "ハートドロップが15%強化で落下。",
  sf_up_fire: "炎ドロップが少し落ちやすくなる。",
  sf_up_water: "雨ドロップが少し落ちやすくなる。",
  sf_up_wood: "風ドロップが少し落ちやすくなる。",
  sf_up_light: "雷ドロップが少し落ちやすくなる。",
  sf_up_dark: "月ドロップが少し落ちやすくなる。",
  sf_up_heart: "ハートドロップが少し落ちやすくなる。",
  sf_down_fire: "炎ドロップが少し落ちにくくなる。",
  sf_down_water: "雨ドロップが少し落ちにくくなる。",
  sf_down_wood: "風ドロップが少し落ちにくくなる。",
  sf_down_light: "雷ドロップが少し落ちにくくなる。",
  sf_down_dark: "月ドロップが少し落ちにくくなる。",
  sf_down_heart: "ハートドロップが少し落ちにくくなる。",
  opener: "サイクルの1ターン目のみ、コンボ+20。",
  clutch: "サイクルの最終ターンのみ、コンボ倍率x2.5。",
  rainbow: "4色以上同時消しで、コンボ+5。",
  sniper: "消した色が2色以下の場合、コンボ倍率x1.8。",
  haste: "操作時間を+2秒延長する。",
  quick_charge: "スキルのチャージ速度が2倍になる。",
  critical: "20%の確率で、この補正倍率が15倍になる。",
  gamble: "ターンごとに -5〜+15 のランダムなコンボ加算。",
  rarity_up: "ショップにレア度の高いトークンが出やすくなる。",
  rarity_down_combo: "ショップにレア度の高いトークンが出にくくなるが、コンボ数+1。",
  shape_match4: "4つ消し1つにつき、コンボ倍率x1.5。",
  shape_cross: "十字消し1つにつき、コンボ倍率x1.8。",
  shape_row: "横一列消し1つにつき、コンボ倍率x2。",
  shape_l: "L字消し1つにつき、コンボ倍率x1.8。",
  shape_square: "正方形消し1つにつき、コンボ倍率x2.5。",
  efficiency: "このスキルの消費エネルギーを-1する(最小1)。",
  berserk: "操作時間-1秒、コンボ倍率x2。",
  aftershock: "落ちコン発生時、最終コンボ倍率x2。",
  investment: "このトークンの売却価格が購入価格の300%になる。",
  enc_bonus_fire: "炎を消しているとコンボ倍率x1.5。",
  enc_bonus_water: "雨を消しているとコンボ倍率x1.5。",
  enc_bonus_wood: "風を消しているとコンボ倍率x1.5。",
  enc_bonus_light: "雷を消しているとコンボ倍率x1.5。",
  enc_bonus_dark: "月を消しているとコンボ倍率x1.5。",
  enc_bonus_heart: "ハートを消しているとコンボ倍率x1.5。",
  bomb_burst_combo: "ボムドロップが消えた時、追加で3コンボ加算する。",
  accum_technique: "「合計特殊消し回数(4個+1列+L字+十字+四角)」20回につき、コンボ加算+1。",
  magic_resonance: "「スキル使用回数」10回につき、全アクティブスキルの消費エネルギー-1。",
  curse_catalyst: "所持している「呪いトークン」1つにつき、コンボ倍率x1.5。",
  magic_echo: "アクティブスキル使用時、25%の確率でチャージを消費しない。",
  compound_interest: "サイクルクリア時、現在の所持スターの5%を追加で獲得する。"
};


const getEnchantDescription = (id) => ENCHANT_DESCRIPTIONS[id] || "";

const ENCHANTMENTS = [

  {
    id: "resonance",
    name: "レベル共鳴",
    effect: "lvl_mult",
    rarity: 2, price: 10,
    icon: "layers"
  },
  {
    id: "greed",
    name: "強欲の輝き",
    effect: "star_add",
    rarity: 3, price: 11,
    icon: "monetization_on"
  },
  {
    id: "chain",
    name: "連鎖の刻印",
    effect: "fixed_add",
    value: 3,
    rarity: 1, price: 7,
    icon: "link"
  },
  {
    id: "extra_turn",
    name: "時の刻印",
    effect: "add_turn",
    rarity: 2, price: 9,
    icon: "add_alarm"
  },
  {
    id: "time_leap",
    name: "時の跳躍",
    effect: "skip_turn_combo",
    rarity: 2, price: 9,
    icon: "restore"
  },
  // --- New: Color Combo Bonus Enchantments ---
  { id: "combo_fire", name: "炎の加護", effect: "color_combo", params: { color: "fire" }, rarity: 3, price: 8, icon: "whatshot" },
  { id: "combo_water", name: "雨の加護", effect: "color_combo", params: { color: "water" }, rarity: 3, price: 8, icon: "water_drop" },
  { id: "combo_wood", name: "森の加護", effect: "color_combo", params: { color: "wood" }, rarity: 3, price: 8, icon: "eco" },
  { id: "combo_light", name: "雷の加護", effect: "color_combo", params: { color: "light" }, rarity: 3, price: 8, icon: "bolt" },
  { id: "combo_dark", name: "月の加護", effect: "color_combo", params: { color: "dark" }, rarity: 3, price: 8, icon: "brightness_2" },
  { id: "combo_heart", name: "癒の加護", effect: "color_combo", params: { color: "heart" }, rarity: 3, price: 8, icon: "favorite" },
  // --- Enhanced Drop Enchantments ---
  { id: "enh_drop_fire", name: "炎の強化落下", effect: "enhance_chance_color", params: { color: "fire" }, value: 0.15, rarity: 3, price: 8, icon: "auto_fix_high" },
  { id: "enh_drop_water", name: "雨の強化落下", effect: "enhance_chance_color", params: { color: "water" }, value: 0.15, rarity: 3, price: 8, icon: "auto_fix_high" },
  { id: "enh_drop_wood", name: "風の強化落下", effect: "enhance_chance_color", params: { color: "wood" }, value: 0.15, rarity: 3, price: 8, icon: "auto_fix_high" },
  { id: "enh_drop_light", name: "雷の強化落下", effect: "enhance_chance_color", params: { color: "light" }, value: 0.15, rarity: 3, price: 8, icon: "auto_fix_high" },
  { id: "enh_drop_dark", name: "月の強化落下", effect: "enhance_chance_color", params: { color: "dark" }, value: 0.15, rarity: 3, price: 8, icon: "auto_fix_high" },
  { id: "enh_drop_heart", name: "ハートの強化落下", effect: "enhance_chance_color", params: { color: "heart" }, value: 0.15, rarity: 3, price: 8, icon: "auto_fix_high" },
  // --- Skyfall Boost (Probability Up) ---
  { id: "sf_up_fire", name: "炎の呼び声", effect: "skyfall_boost", params: { color: "fire" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_down" },
  { id: "sf_up_water", name: "雨の呼び声", effect: "skyfall_boost", params: { color: "water" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_down" },
  { id: "sf_up_wood", name: "森の呼び声", effect: "skyfall_boost", params: { color: "wood" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_down" },
  { id: "sf_up_light", name: "雷の呼び声", effect: "skyfall_boost", params: { color: "light" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_down" },
  { id: "sf_up_dark", name: "月の呼び声", effect: "skyfall_boost", params: { color: "dark" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_down" },
  { id: "sf_up_heart", name: "癒の呼び声", effect: "skyfall_boost", params: { color: "heart" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_down" },
  // --- Skyfall Nerf (Probability Down) ---
  { id: "sf_down_fire", name: "炎の静寂", effect: "skyfall_nerf", params: { color: "fire" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_up" },
  { id: "sf_down_water", name: "雨の静寂", effect: "skyfall_nerf", params: { color: "water" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_up" },
  { id: "sf_down_wood", name: "森の静寂", effect: "skyfall_nerf", params: { color: "wood" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_up" },
  { id: "sf_down_light", name: "雷の静寂", effect: "skyfall_nerf", params: { color: "light" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_up" },
  { id: "sf_down_dark", name: "月の静寂", effect: "skyfall_nerf", params: { color: "dark" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_up" },
  { id: "sf_down_heart", name: "癒の静寂", effect: "skyfall_nerf", params: { color: "heart" }, rarity: 3, price: 8, icon: "keyboard_double_arrow_up" },
  { id: "opener", name: "先制の心得", effect: "turn_1_bonus", value: 20, rarity: 3, price: 9, icon: "login" },
  { id: "clutch", name: "土壇場の底力", effect: "last_turn_mult", value: 2.5, rarity: 3, price: 10, icon: "emergency" },
  { id: "rainbow", name: "虹色の加護", effect: "multi_color", value: 5, rarity: 3, price: 10, icon: "palette" },
  { id: "sniper", name: "一点突破", effect: "single_color", value: 1.8, rarity: 3, price: 9, icon: "gps_fixed" },
  { id: "haste", name: "疾風の刻印", effect: "time_ext_enc", value: 2, rarity: 3, price: 9, icon: "speed" },
  { id: "quick_charge", name: "急速チャージ", effect: "charge_boost_passive", rarity: 3, price: 10, icon: "bolt" },
  { id: "critical", name: "会心の一撃", effect: "critical_strike", value: 15, rarity: 3, price: 10, icon: "flash_on" },
  { id: "gamble", name: "運命の悪戯", effect: "random_bonus", rarity: 2, price: 7, icon: "casino" },

  // --- Rarity Modifier Enchantments ---
  { id: "rarity_up", name: "幸運の星", effect: "rarity_up", rarity: 1, price: 9, icon: "stars" },
  { id: "rarity_down_combo", name: "流星の約束", effect: "rarity_down_combo", rarity: 1, price: 9, icon: "brightness_low" },

  // --- 形状別極意エンチャント (Geometry Split) ---
  { id: "shape_match4", name: "四連の極意", effect: "shape_match4", value: 1.5, rarity: 3, price: 8, icon: "category" },
  { id: "shape_cross", name: "十字の極意", effect: "shape_cross", value: 1.8, rarity: 3, price: 8, icon: "category" },
  { id: "shape_row", name: "一列の極意", effect: "shape_row", value: 2.0, rarity: 3, price: 8, icon: "category" },
  { id: "shape_l", name: "L字の極意", effect: "shape_l", value: 1.8, rarity: 3, price: 8, icon: "category" },
  { id: "shape_square", name: "正方形の極意", effect: "shape_square", value: 2.5, rarity: 3, price: 8, icon: "category" },

  { id: "efficiency", name: "魔力節約", effect: "cost_down", rarity: 3, price: 10, icon: "savings" },
  { id: "berserk", name: "狂戦士の刻印", effect: "berserk_mode", value: 2, rarity: 3, price: 10, icon: "dangerous" },
  { id: "aftershock", name: "追撃の心得", effect: "skyfall_mult", value: 2, rarity: 3, price: 9, icon: "waves" },
  { id: "investment", name: "資産価値", effect: "high_sell", rarity: 2, price: 6, icon: "account_balance_wallet" },
  // --- 色別連舞エンチャント (1.2倍) ---
  { id: "enc_bonus_fire", name: "炎の連舞", effect: "color_multiplier_enc", params: { color: "fire" }, value: 1.5, rarity: 3, price: 8, icon: "animation" },
  { id: "enc_bonus_water", name: "雨の連舞", effect: "color_multiplier_enc", params: { color: "water" }, value: 1.5, rarity: 3, price: 8, icon: "animation" },
  { id: "enc_bonus_wood", name: "風の連舞", effect: "color_multiplier_enc", params: { color: "wood" }, value: 1.5, rarity: 3, price: 8, icon: "animation" },
  { id: "enc_bonus_light", name: "雷の連舞", effect: "color_multiplier_enc", params: { color: "light" }, value: 1.5, rarity: 3, price: 8, icon: "animation" },
  { id: "enc_bonus_dark", name: "月の連舞", effect: "color_multiplier_enc", params: { color: "dark" }, value: 1.5, rarity: 3, price: 8, icon: "animation" },
  { id: "enc_bonus_heart", name: "癒の連舞", effect: "color_multiplier_enc", params: { color: "heart" }, value: 1.5, rarity: 3, price: 8, icon: "animation" },

  // --- New Stat-Based Enchantments ---
  { id: "magic_echo", name: "魔力反響", effect: "magic_echo", rarity: 3, price: 12, icon: "repeat" },
  { id: "compound_interest", name: "複利の導き", effect: "compound_interest", rarity: 3, price: 10, icon: "trending_up" },
  { id: "curse_catalyst", name: "呪力変換", effect: "curse_catalyst", rarity: 3, price: 12, icon: "auto_awesome_motion" },
  { id: "bomb_burst_combo", name: "誘爆の雷管", effect: "bomb_burst_combo", rarity: 3, price: 9, icon: "explosive" },
  { id: "accum_technique", name: "技巧の蓄積", effect: "stat_shape_all", rarity: 3, price: 9, icon: "history_edu" },
  { id: "magic_resonance", name: "魔力共鳴", effect: "stat_skill_use", rarity: 3, price: 10, icon: "record_voice_over" }
];

export { ENCHANT_DESCRIPTIONS, getEnchantDescription, ENCHANTMENTS };
