const ALL_TOKEN_BASES = [
  // ==========================================
  // ★ スキル
  // ==========================================

  // --- スキル: 変換（1色→1色）---
  { id: "fired", name: "焔の変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "wood", to: "fire" }, rarity: 1, price: 2, desc: "風を炎に変換。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "waterd", name: "氷の変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "water" }, rarity: 1, price: 2, desc: "炎を雨に変換。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "woodd", name: "嵐の変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "water", to: "wood" }, rarity: 1, price: 2, desc: "雨を風に変換。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "lightd", name: "雷の変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "dark", to: "light" }, rarity: 1, price: 2, desc: "月を雷に変換。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "darkd", name: "影の変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "light", to: "dark" }, rarity: 1, price: 2, desc: "雷を月に変換。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "heartd", name: "癒の変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "heart" }, rarity: 1, price: 2, desc: "炎をハートに変換。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "conv_h_f", name: "癒の劫炎", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "fire" }, rarity: 1, price: 2, desc: "ハートを炎に変換。消費E:{cost}", attributes: ["fire", "heart"], canBeInitial: true },
  { id: "conv_h_w", name: "癒の奔流", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "water" }, rarity: 1, price: 2, desc: "ハートを雨に変換。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "conv_h_g", name: "癒の深風", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "wood" }, rarity: 1, price: 2, desc: "ハートを風に変換。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "conv_h_l", name: "癒の聖雷", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "light" }, rarity: 1, price: 2, desc: "ハートを雷に変換。消費E:{cost}", attributes: ["light", "heart"], canBeInitial: true },
  { id: "conv_h_d", name: "癒の呪法", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "dark" }, rarity: 1, price: 2, desc: "ハートを月に変換。消費E:{cost}", attributes: ["dark", "heart"], canBeInitial: true },

  // --- スキル: 多色変換（2色→1色）---
  { id: "conv_m_fd_w", name: "業水の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "water" }, rarity: 1, price: 3, desc: "炎と月を雨に変換。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "conv_m_fd_l", name: "炎雷の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "light" }, rarity: 1, price: 3, desc: "炎と月を雷に変換。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "conv_m_wh_f", name: "紅蓮の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "fire" }, rarity: 1, price: 3, desc: "雨とハートを炎に変換。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "conv_m_wh_g", name: "蒼風の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "wood" }, rarity: 1, price: 3, desc: "雨とハートを風に変換。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "conv_m_gl_d", name: "神緑の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "dark" }, rarity: 1, price: 3, desc: "風と雷を月に変換。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "conv_m_gl_h", name: "天恵の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "heart" }, rarity: 1, price: 3, desc: "風と雷をハートに変換。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "conv_m_fw_g", name: "天地の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water"], to: "wood" }, rarity: 1, price: 3, desc: "炎と雨を風に変換。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "conv_m_ld_h", name: "黄昏の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "heart" }, rarity: 1, price: 3, desc: "雷と月をハートに変換。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: 盤面変更（3色）---
  { id: "board_tri_fdw", name: "三色の真理・業水", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "water"] }, rarity: 1, price: 3, desc: "盤面を炎/月/雨に変更。消費E:{cost}", attributes: ["fire", "dark", "water"], canBeInitial: true },
  { id: "board_tri_fdl", name: "三色の真理・炎光", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "light"] }, rarity: 1, price: 3, desc: "盤面を炎/月/雷に変更。消費E:{cost}", attributes: ["fire", "dark", "light"], canBeInitial: true },
  { id: "board_tri_whf", name: "三色の真理・紅蓮", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "fire"] }, rarity: 1, price: 3, desc: "盤面を雨/ハート/炎に変更。消費E:{cost}", attributes: ["water", "heart", "fire"], canBeInitial: true },
  { id: "board_tri_whg", name: "三色の真理・蒼木", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "wood"] }, rarity: 1, price: 3, desc: "盤面を雨/ハート/風に変更。消費E:{cost}", attributes: ["water", "heart", "wood"], canBeInitial: true },
  { id: "board_tri_gld", name: "三色の真理・神緑", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "dark"] }, rarity: 1, price: 3, desc: "盤面を風/雷/月に変更。消費E:{cost}", attributes: ["wood", "light", "dark"], canBeInitial: true },
  { id: "board_tri_glh", name: "三色の真理・天恵", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "heart"] }, rarity: 1, price: 3, desc: "盤面を風/雷/ハートに変更。消費E:{cost}", attributes: ["wood", "light", "heart"], canBeInitial: true },
  { id: "board_tri_fwg", name: "三色の真理・天地", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "wood"] }, rarity: 1, price: 3, desc: "盤面を炎/雨/風に変更。消費E:{cost}", attributes: ["fire", "water", "wood"], canBeInitial: true },
  { id: "board_tri_ldh", name: "三色の真理・黄昏", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "dark", "heart"] }, rarity: 1, price: 3, desc: "盤面を雷/月/ハートに変更。消費E:{cost}", attributes: ["light", "dark", "heart"], canBeInitial: true },

  // --- スキル: 盤面変更（2色）---
  { id: "board_bi_fd", name: "炎月の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark"] }, rarity: 1, price: 4, desc: "盤面を炎/月の2色に変更。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "board_bi_wh", name: "蒼海の至宝", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart"] }, rarity: 1, price: 4, desc: "盤面を雨/ハートの2色に変更。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "board_bi_gl", name: "風雷の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light"] }, rarity: 1, price: 4, desc: "盤面を風/雷の2色に変更。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "board_bi_wd", name: "雨月の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "dark"] }, rarity: 1, price: 4, desc: "盤面を雨/月の2色に変更。消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "board_bi_gh", name: "風癒の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "heart"] }, rarity: 1, price: 4, desc: "盤面を風/ハートの2色に変更。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "board_bi_fl", name: "炎雷の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "light"] }, rarity: 1, price: 4, desc: "盤面を炎/雷の2色に変更。消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: 盤面変更（1色）---
  { id: "board_mono1", name: "真・紅蓮の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["fire"] }, rarity: 2, price: 6, desc: "盤面すべてを炎に変更。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "board_mono2", name: "真・閃雷の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["light"] }, rarity: 2, price: 6, desc: "盤面すべてを雷に変更。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "board_mono3", name: "真・蒼海の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["water"] }, rarity: 2, price: 6, desc: "盤面すべてを雨に変更。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "board_mono4", name: "真・深翠の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["wood"] }, rarity: 2, price: 6, desc: "盤面すべてを風に変更。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "board_mono5", name: "真・常月の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["dark"] }, rarity: 2, price: 6, desc: "盤面すべてを月に変更。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "board_mono6", name: "真・生命の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["heart"] }, rarity: 2, price: 6, desc: "盤面すべてをハートに変更。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: 5属性均等配置 ---
  { id: "board_bal_5", name: "五行の理", icon: "balance", type: "skill", cost: 5, costLevels: true, action: "board_balance", rarity: 2, price: 5, desc: "全ドロップを5属性各6個に変化させる。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeInitial: true },

  // --- スキル: 行・列固定変換 ---
  { id: "row_f", name: "烈炎の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "fire" }, rarity: 1, price: 3, desc: "上段をすべて炎に。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "row_w", name: "清流の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "water" }, rarity: 1, price: 3, desc: "上段をすべて雨に。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "row_g", name: "深翠の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "wood" }, rarity: 1, price: 3, desc: "上段をすべて風に。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "row_l", name: "閃雷の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "light" }, rarity: 1, price: 3, desc: "上段をすべて雷に。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "row_d", name: "常月の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "dark" }, rarity: 1, price: 3, desc: "上段をすべて月に。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "row_h", name: "生命の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "heart" }, rarity: 1, price: 3, desc: "上段をすべてハートに。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "row_b_f", name: "烈炎の底陣", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: -1, type: "fire" }, rarity: 1, price: 3, desc: "下段をすべて炎に。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "row_c_h", name: "生命の帯", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: "center", type: "heart" }, rarity: 1, price: 3, desc: "中央行をすべてハートに。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "col_l_l", name: "閃雷の縦一閃", icon: "view_column", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: 0, type: "light" }, rarity: 1, price: 3, desc: "左端列をすべて雷に。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "col_r_d", name: "常月の縦一閃", icon: "view_column", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: -1, type: "dark" }, rarity: 1, price: 3, desc: "右端列をすべて月に。消費E:{cost}", attributes: ["dark"], canBeInitial: true },

  // --- スキル: ドロップ強化（1色）---
  { id: "enh_f", name: "星の導き・炎", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["fire"] }, rarity: 1, price: 4, desc: "盤面の炎を全て強化。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "enh_w", name: "星の導き・雨", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["water"] }, rarity: 1, price: 4, desc: "盤面の雨を全て強化。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "enh_g", name: "星の導き・風", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["wood"] }, rarity: 1, price: 4, desc: "盤面の風を全て強化。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "enh_l", name: "星の導き・雷", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["light"] }, rarity: 1, price: 4, desc: "盤面の雷を全て強化。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "enh_d", name: "星の導き・月", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["dark"] }, rarity: 1, price: 4, desc: "盤面の月を全て強化。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "enh_h", name: "星の導き・ハート", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["heart"] }, rarity: 1, price: 4, desc: "盤面のハートを全て強化。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: ドロップ強化（2色）---
  { id: "enh_fd", name: "星の導き・炎月", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "dark"] }, rarity: 2, price: 5, desc: "盤面の炎/月を全て強化。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "enh_wh", name: "星の導き・雨癒", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "heart"] }, rarity: 2, price: 5, desc: "盤面の雨/ハートを全て強化。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "enh_gl", name: "星の導き・風雷", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "light"] }, rarity: 2, price: 5, desc: "盤面の風/雷を全て強化。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "enh_wd", name: "星の導き・雨月", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "dark"] }, rarity: 2, price: 5, desc: "盤面の雨/月を全て強化. 消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "enh_gh", name: "星の導き・風癒", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "heart"] }, rarity: 2, price: 5, desc: "盤面の風/ハートを全て強化. 消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "enh_fl", name: "星の導き・炎雷", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "light"] }, rarity: 2, price: 5, desc: "盤面の炎/雷を全て強化. 消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: ランダム生成 ---
  { id: "gen_rand_fire", name: "炎の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "fire", count: 5 }, rarity: 1, price: 2, desc: "炎ドロップをランダムに5個生成。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "gen_rand_water", name: "雨の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "water", count: 5 }, rarity: 1, price: 2, desc: "雨ドロップをランダムに5個生成。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "gen_rand_wood", name: "森の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "wood", count: 5 }, rarity: 1, price: 2, desc: "風ドロップをランダムに5個生成。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "gen_rand_light", name: "雷の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "light", count: 5 }, rarity: 1, price: 2, desc: "雷ドロップをランダムに5個生成。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "gen_rand_dark", name: "月の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "dark", count: 5 }, rarity: 1, price: 2, desc: "月ドロップをランダムに5個生成。消費E:{cost}", attributes: ["dark"], canBeInitial: true },

  // --- スキル: ボムドロップ生成 ---
  { id: "gen_bomb_rand", name: "爆発の種", icon: "emergency", type: "skill", cost: 3, costLevels: true, action: "spawn_bomb_random", params: { count: 1 }, rarity: 1, price: 2, desc: "ランダムなドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: [], canBeInitial: true },
  { id: "conv_bomb_target_fire", name: "紅炎の火薬", icon: "emergency", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "fire" }, rarity: 2, price: 3, desc: "炎ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2], attributes: ["fire"], canBeInitial: true },
  { id: "conv_bomb_target_dark", name: "暗黒の火薬", icon: "emergency", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "dark" }, rarity: 2, price: 3, desc: "月ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2], attributes: ["dark"], canBeInitial: true },

  // --- スキル: スカイフォール強化（1色）---
  { id: "sky_f1", name: "紅蓮の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、炎がかなり落ちやすくなる。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "sky_w1", name: "蒼海の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雨がかなり落ちやすくなる。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "sky_g1", name: "深翠の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、風がかなり落ちやすくなる。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "sky_l1", name: "閃雷の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雷がかなり落ちやすくなる。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "sky_d1", name: "常月の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、月がかなり落ちやすくなる。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "sky_h1", name: "癒の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、ハートがかなり落ちやすくなる。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: スカイフォール強化（2色）---
  { id: "sky_fd_2", name: "炎月の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と月が落ちやすくなる。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "sky_wh_2", name: "蒼海の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨とハートが落ちやすくなる。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "sky_gl_2", name: "風雷の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風と雷が落ちやすくなる。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "sky_wd_2", name: "雨月の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨と月が落ちやすくなる。消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "sky_gh_2", name: "風癒の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風とハートが落ちやすくなる。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "sky_fl_2", name: "炎雷の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と雷が落ちやすくなる. 消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: スカイフォール停止（1色）---
  { id: "sky_f_stop", name: "紅蓮の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、炎が落ちてこなくなる。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "sky_w_stop", name: "蒼海の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雨が落ちてこなくなる。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "sky_g_stop", name: "深翠の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、風が落ちてこなくなる。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "sky_l_stop", name: "閃雷の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雷が落ちてこなくなる。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "sky_d_stop", name: "常月の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、月が落ちてこなくなる。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "sky_h_stop", name: "癒の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、ハートが落ちてこなくなる。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: スカイフォール停止（2色）---
  { id: "sky_fd_stop", name: "炎月の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と月が落ちてこなくなる。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "sky_wh_stop", name: "蒼海の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨とハートが落ちてこなくなる。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "sky_gl_stop", name: "風雷の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風と雷が落ちてこなくなる。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "sky_wd_stop", name: "雨月の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨と月が落ちてこなくなる。消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "sky_gh_stop", name: "風癒の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風とハートが落ちてこなくなる。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "sky_fl_stop", name: "炎雷の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と雷が落ちてこなくなる. 消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: スカイフォール色制限 ---
  { id: "sky_limit", name: "三色の結界", icon: "filter_list", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["fire", "water", "wood"], duration: 3 }, rarity: 1, price: 4, desc: "3手番、炎/雨/風しか落ちてこなくなる。消費E:{cost}", attributes: ["fire", "water", "wood"], canBeInitial: true },
  { id: "sky_limit_ldh", name: "三界の結界", icon: "filter_list", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["light", "dark", "heart"], duration: 3 }, rarity: 1, price: 4, desc: "3手番、雷/月/ハートしか落ちてこなくなる。消費E:{cost}", attributes: ["light", "dark", "heart"], canBeInitial: true },

  // --- スキル: リピートドロップ生成 ---
  { id: "gen_repeat_rand", name: "循環の理", icon: "autorenew", type: "skill", cost: 3, costLevels: true, action: "spawn_repeat", params: { count: 1 }, rarity: 1, price: 5, desc: "ランダムなドロップ1つをリピートドロップ（2回消える）にする。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "conv_repeat_water", name: "雨鏡の輪廻", icon: "autorenew", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "water" }, rarity: 3, price: 9, desc: "ランダムな雨ドロップ2つをリピートドロップにする。消費E:{cost}", attributes: ["water"], canBeCurseReward: true },
  { id: "conv_repeat_heart", name: "生命の輪廻", icon: "autorenew", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "heart" }, rarity: 3, price: 9, desc: "ランダムなハートドロップ2つをリピートドロップにする。消費E:{cost}", attributes: ["heart"], canBeCurseReward: true },

  // --- スキル: スタードロップ生成 ---
  { id: "gen_star_rand", name: "星の創造", icon: "stars", type: "skill", cost: 3, costLevels: true, action: "spawn_star", params: { count: 5 }, rarity: 1, price: 6, desc: "ランダムなドロップ5つをスタードロップにする。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "conv_star_wood", name: "星降る森", icon: "stars", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "wood" }, rarity: 2, price: 9, desc: "風ドロップを全てスタードロップにする。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "conv_star_light", name: "星降る雷", icon: "stars", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "light" }, rarity: 2, price: 9, desc: "雷ドロップをすべてスタードロップにする。消費E:{cost}", attributes: ["light"], canBeInitial: true },

  // --- スキル: 虹ドロップ生成 ---
  { id: "gen_rainbow_rand", name: "虹の創造", icon: "palette", type: "skill", cost: 2, costLevels: true, action: "spawn_rainbow", params: { count: 1 }, rarity: 1, price: 6, desc: "ランダムなドロップ1つをカウント3の虹ドロップにする。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeInitial: true },
  { id: "rainbow_masterx", name: "虹の極致", icon: "palette", type: "skill", cost: 5, costLevels: true, action: "rainbow_master", params: { count: 1, to: 5 }, rarity: 3, price: 12, desc: "ランダムに虹ドロップを1つ生成し、盤面の全ての虹ドロップのカウントを5にする。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeCurseReward: true },

  // --- スキル: 特殊（時間・倍率・チャージ・再落下・ムーブドロップ）---
  {
    id: "move_drop_add_active",
    name: "飛躍の号令",
    icon: "fast_forward",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "move_drop_add",
    rarity: 2, price: 9,
    desc: "盤面にあるすべてのムーブドロップのカウントを即座に+20する。消費E:{cost}",
    attributes: ["fire", "water", "wood", "light", "dark", "heart"],
    canBeInitial: true
  },
  {
    id: "refresh",
    name: "次元の再編",
    icon: "refresh",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "force_refresh",
    rarity: 1, price: 2,
    desc: "全消去して再落下。落ちコンあり。消費E:{cost}",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "charge_boost",
    name: "練気の波動",
    icon: "battery_charging_full",
    type: "skill",
    cost: 3,
    action: "charge_boost",
    values: [1, 2, 3],
    rarity: 1, price: 3,
    desc: "他のスキルのエネルギーを1/2/3チャージ。消費E:3",
    attributes: [],
    canBeInitial: true
  },
  { id: "time_burst", name: "タイム・バースト", icon: "timer", type: "skill", cost: 3, action: "op_time_boost", params: { extraTime: 5000, duration: 3 }, rarity: 1, price: 5, desc: "3ターンの間、操作時間+5秒。消費E:3", attributes: [], canBeInitial: true },
  { id: "eternal_moment", name: "エターナル・モーメント", icon: "timer", type: "skill", cost: 3, action: "op_time_boost", params: { extraTime: 10000, duration: 2 }, rarity: 1, price: 5, desc: "2ターンの間、操作時間+10秒。消費E:3", attributes: [], canBeInitial: true },
  { id: "chronos_master", name: "クロノス・マスター", icon: "timer", type: "skill", cost: 3, action: "op_time_boost", params: { extraTime: 20000, duration: 1 }, rarity: 1, price: 5, desc: "1ターンの間、操作時間+20秒。消費E:3", attributes: [], canBeInitial: true },
  { id: "active_mult_1", name: "覚醒の鼓動", icon: "trending_up", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 2, duration: 3 }, rarity: 2, price: 6, desc: "3手番、最終コンボ倍率が2倍になる。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "active_mult_2", name: "一刃の極意", icon: "trending_up", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 5, duration: 1 }, rarity: 3, price: 10, desc: "1手番、最終コンボ倍率が5倍になる。消費E:{cost}", attributes: [] },
  { id: "seal_of_power", name: "力の封印", icon: "dangerous", type: "skill", cost: 6, costLevels: true, action: "seal_of_power", params: { multiplier: 5, duration: 1 }, rarity: 3, price: 10, desc: "1手番、全エンチャント効果が無効になるが、コンボ倍率が5倍になる。消費E:{cost}", attributes: [] },
  { id: "gen_token_s1", name: "一星の招来", icon: "auto_awesome", type: "skill", cost: 3, action: "spawn_token_s1", rarity: 1, price: 5, desc: "自身以外のランダムな★1トークンを1つ生成する。消費E:{cost}", attributes: [] },
  { id: "gen_token_s2", name: "二星の招来", icon: "auto_awesome", type: "skill", cost: 5, action: "spawn_token_s2", rarity: 2, price: 8, desc: "自身以外のランダムな★2トークンを1つ生成する。消費E:{cost}", attributes: [] },
  { id: "gen_token_s3", name: "三星の代償", icon: "auto_awesome", type: "skill", cost: 6, action: "spawn_token_s3", rarity: 3, price: 12, desc: "ランダムな★3トークンを1つ生成する。ただし30%の確率で呪いトークンが生成される。消費E:{cost}", attributes: [] },
  { id: "skill_levelup", name: "飛躍の輝き", icon: "upgrade", type: "skill", cost: 6, action: "random_levelup", rarity: 2, price: 8, desc: "自身以外のランダムなトークンを1つ選び、レベルアップさせる（最大Lv3）。消費E:{cost}", attributes: [], canBeInitial: true },

  // ==========================================
  // ★ パッシブ
  // ==========================================

  // --- パッシブ: 汎用ユーティリティ（ショップ・時間・基礎強化）---
  {
    id: "collector",
    name: "黄金の収集者",
    icon: "stars",
    type: "passive",
    effect: "star_gain",
    values: [4, 2, 1],
    rarity: 1, price: 5,
    desc: "★獲得に必要なコンボ数を4/2/1に短縮。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "time_ext",
    name: "時の砂",
    icon: "hourglass_bottom",
    type: "passive",
    effect: "time_permanent",
    price: 4,
    rarity: 1,
    desc: "操作時間を2秒延長。（購入するごとに累積し、トークン枠を消費しない）",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "exchange_star3",
    name: "神秘の昇華",
    icon: "auto_awesome",
    type: "passive",
    rarity: 2, price: 10,
    desc: "【購入時に即消費】所持している星1・星2トークンからランダムに1つを失い、代わりに同じ種類(パッシブ/アクティブ)のランダムな星3トークンを獲得する。",
    attributes: [],
  },
  {
    id: "power_up",
    name: "力の鼓動",
    icon: "fitness_center",
    type: "passive",
    effect: "base_add",
    values: [2, 3, 5],
    rarity: 1, price: 4,
    desc: "コンボ加算に2/3/5の固定値を追加。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "forbidden",
    name: "禁忌の儀式",
    icon: "block",
    type: "passive",
    effect: "forbidden",
    values: [2, 3, 5],
    rarity: 2, price: 7,
    desc: "常時落ちコン停止。コンボ加算2/3/5倍。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "bargain",
    name: "商談の極意",
    icon: "sell",
    type: "passive",
    effect: "sale_boost",
    values: [1, 3, 5],
    rarity: 1, price: 6,
    desc: "ショップに並ぶセール品（半額）の枠を +[1/3/5]枠 追加する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "enchant_boost",
    name: "魔道の極意",
    icon: "auto_fix_normal",
    type: "passive",
    effect: "enchant_grant_boost",
    values: [1, 2, 3],
    rarity: 2, price: 8,
    desc: "ショップに並ぶエンチャントの数を1/2/3個増加させる。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "shop_expand",
    name: "陳列の極意",
    icon: "storefront",
    type: "passive",
    effect: "shop_expand",
    values: [1, 2, 3],
    rarity: 1, price: 8,
    desc: "ショップに並ぶ通常商品の枠を1/2/3枠拡張する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "shop_rarity_boost",
    name: "招福の鈴",
    icon: "stars",
    type: "passive",
    effect: "shop_rarity_weight",
    values: [1, 2, 3],
    rarity: 1, price: 8,
    desc: "ショップに★2以上のレアトークンが出現しやすくなる。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "skip_master",
    name: "時短の心得",
    icon: "fast_forward",
    type: "passive",
    effect: "skip_bonus_multiplier",
    values: [6, 8, 10],
    rarity: 2, price: 6,
    desc: "目標達成後のスキップボーナスを6/8/10倍にする。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "dual_match",
    name: "双連の極意",
    icon: "join_inner",
    type: "passive",
    effect: "min_match",
    values: [0.8, 1.2, 1.5],
    rarity: 3, price: 15,
    desc: "2つ以上でドロップが消える。コンボ倍率x[0.8/1.2/1.5]。",
    attributes: [],
    canBeCurseReward: true
  },

  // --- パッシブ: コンボ倍率（1色）---
  {
    id: "bonus_1c_fire", name: "炎の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "炎を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["fire"], canBeInitial: true
  },
  {
    id: "bonus_1c_water", name: "雨の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["water"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "雨を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["water"], canBeInitial: true
  },
  {
    id: "bonus_1c_wood", name: "風の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "風を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["wood"], canBeInitial: true
  },
  {
    id: "bonus_1c_light", name: "雷の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["light"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "雷を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["light"], canBeInitial: true
  },
  {
    id: "bonus_1c_dark", name: "月の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["dark"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "月を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["dark"], canBeInitial: true
  },
  {
    id: "bonus_1c_heart", name: "癒の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["heart"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "ハートを消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["heart"], canBeInitial: true
  },

  // --- パッシブ: コンボ倍率（2色同時）---
  { id: "bonus_2c_fd", name: "炎月の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "炎/月を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "bonus_2c_wh", name: "蒼海の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "雨/ハートを同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["water", "heart"], canBeInitial: true },
  { id: "bonus_2c_gl", name: "風雷の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "風/雷を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["wood", "light"], canBeInitial: true },
  { id: "bonus_2c_wd", name: "雨月の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "dark"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "雨/月を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["water", "dark"], canBeInitial: true },
  { id: "bonus_2c_gh", name: "風癒の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "heart"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "風/ハートを同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "bonus_2c_fl", name: "炎雷の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "light"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "炎/雷を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["fire", "light"], canBeInitial: true },

  // --- パッシブ: コンボ倍率（3色同時）---
  { id: "bonus_3c_fdw", name: "業水の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "water"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/月/雨を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["fire", "dark", "water"], canBeInitial: true },
  { id: "bonus_3c_fdl", name: "炎雷月の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "light"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/月/雷を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["fire", "dark", "light"], canBeInitial: true },
  { id: "bonus_3c_whf", name: "紅蓮の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "fire"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雨/ハート/炎を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["water", "heart", "fire"], canBeInitial: true },
  { id: "bonus_3c_whg", name: "蒼風の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "wood"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雨/ハート/風を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["water", "heart", "wood"], canBeInitial: true },
  { id: "bonus_3c_gld", name: "神緑の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "dark"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "風/雷/月を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["wood", "light", "dark"], canBeInitial: true },
  { id: "bonus_3c_glh", name: "天恵の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "heart"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "風/雷/ハートを同時に消すとコンボ数x[2/3/5]倍。", attributes: ["wood", "light", "heart"], canBeInitial: true },
  { id: "bonus_3c_fwg", name: "天地の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "water", "wood"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/雨/風を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["fire", "water", "wood"], canBeInitial: true },
  { id: "bonus_3c_ldh", name: "黄昏の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["light", "dark", "heart"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雷/月/ハートを同時に消すとコンボ数x[2/3/5]倍。", attributes: ["light", "dark", "heart"], canBeInitial: true },

  // --- パッシブ: コンボ倍率（4色以上・色数指定）---
  {
    id: "bonus_4c_fwlh", name: "四天の秘儀", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "water", "light", "heart"] }, values: [2.5, 4, 6], rarity: 2, price: 10,
    desc: "炎/雨/雷/ハートを同時に消すとコンボ数x[2.5/4/6]倍。",
    attributes: ["fire", "water", "light", "heart"],
    canBeInitial: true
  },
  {
    id: "bonus_5c", name: "五色の秘儀", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { count: 5 }, values: [3, 5, 8], rarity: 2, price: 12,
    desc: "5色以上を同時に消すとコンボ数x[3/5/8]倍。",
    attributes: ["fire", "water", "wood", "light", "dark"],
    canBeInitial: true
  },
  {
    id: "bonus_6c", name: "六色の秘儀", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { count: 6 }, values: [4, 7, 12], rarity: 2, price: 15,
    desc: "6色すべてを同時に消すとコンボ数x[4/7/12]倍。",
    attributes: ["fire", "water", "wood", "light", "dark", "heart"],
    canBeInitial: true
  },

  // --- パッシブ: 色消し数ボーナス（6個以上）---
  { id: "req_6_fire", name: "炎の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "炎を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["fire"], canBeInitial: true },
  { id: "req_6_water", name: "雨の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "雨を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["water"], canBeInitial: true },
  { id: "req_6_wood", name: "風の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "風を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["wood"], canBeInitial: true },
  { id: "req_6_light", name: "雷の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "雷を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["light"], canBeInitial: true },
  { id: "req_6_dark", name: "月の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "月を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["dark"], canBeInitial: true },
  { id: "req_6_heart", name: "癒の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "ハートを合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["heart"], canBeInitial: true },

  // --- パッシブ: 色消し数ボーナス（12個以上）---
  { id: "req_12_fire", name: "炎の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "炎を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["fire"], canBeInitial: true },
  { id: "req_12_water", name: "雨の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "雨を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["water"], canBeInitial: true },
  { id: "req_12_wood", name: "風の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "風を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["wood"], canBeInitial: true },
  { id: "req_12_light", name: "雷の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "雷を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["light"], canBeInitial: true },
  { id: "req_12_dark", name: "月の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "月を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["dark"], canBeInitial: true },
  { id: "req_12_heart", name: "癒の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "ハートを合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["heart"], canBeInitial: true },

  // --- パッシブ: コンボ数ちょうどボーナス ---
  {
    id: "combo_exact_3",
    name: "三連の巧技",
    icon: "query_stats",
    type: "passive",
    effect: "combo_if_le",
    params: { combo: 3 },
    values: [10, 15, 25],
    rarity: 1, price: 6,
    desc: "3コンボ以下でコンボ+[10/15/25]。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "combo_exact_10",
    name: "十連の極み",
    icon: "query_stats",
    type: "passive",
    effect: "combo_if_le",
    params: { combo: 10 },
    values: [15, 25, 40],
    rarity: 2, price: 9,
    desc: "10コンボ以下でコンボ+[15/25/40]。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: コンボ数閾値ボーナス ---
  {
    id: "combo_ge_7",
    name: "七連の闘気",
    icon: "query_stats",
    type: "passive",
    effect: "combo_if_ge",
    params: { combo: 7 },
    values: [2, 3, 5],
    rarity: 2, price: 10,
    desc: "7コンボ以上で最終コンボ[2/3/5]倍。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 特殊消しボーナス ---
  {
    id: "len4", name: "四連の術", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "len4" }, values: [2, 4, 6], rarity: 1, price: 5,
    desc: "4個ちょうど連結でコンボ+[2/4/6]。",
    attributes: [], canBeInitial: true
  },
  {
    id: "row_clear", name: "横一閃", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "row" }, values: [5, 10, 15], rarity: 1, price: 8,
    desc: "横1列消しでコンボ+[5/10/15]。",
    attributes: [], canBeInitial: true
  },
  {
    id: "square", name: "四方の型", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "square" }, values: [2, 3, 5], maxMultipliers: [10, 20, 50], rarity: 1, price: 9,
    desc: "3x3正方形消しでコンボ×[2/3/5]倍。",
    attributes: [], canBeInitial: true
  },
  {
    id: "len5", name: "五星の印", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "len5" }, values: [1.5, 2, 3], rarity: 1, price: 7,
    desc: "5個以上連結で次手の操作時間[1.5/2/3]倍。",
    attributes: [], canBeInitial: true
  },
  {
    id: "cross", name: "十字の祈り", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "cross" }, values: [2, 3, 5], rarity: 1, price: 9,
    desc: "十字型消しで次手の操作時間[2/3/5]倍。",
    attributes: [], canBeInitial: true
  },
  {
    id: "l_shape", name: "鉤十字の型", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "l_shape" }, values: [3, 6, 9], rarity: 1, price: 9,
    desc: "L字消しでコンボ+[3/6/9]。",
    attributes: [], canBeInitial: true
  },
  {
    id: "bonus_heart", name: "癒の波動", icon: "favorite", type: "passive", effect: "heart_combo_bonus",
    values: [3, 5, 7], rarity: 1, price: 6,
    desc: "ハートドロップを消したコンボ数分、追加でコンボ+[3/5/7]。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "giant",
    name: "巨人の領域",
    icon: "view_quilt",
    type: "passive",
    effect: "expand_board",
    values: [1.2, 1.5, 2],
    rarity: 3, price: 9,
    desc: "装備中、盤面が7x6に拡張。コンボ倍率[1.2/1.5/2]倍。",
    attributes: [],
    canBeCurseReward: true
  },

  // --- パッシブ: 強化ドロップ ---
  {
    id: "mana_crystal", name: "マナの結晶化", icon: "auto_fix_high", type: "passive", effect: "enhance_chance",
    values: [0.05, 0.1, 0.2], rarity: 1, price: 4,
    desc: "落下ドロップの[5/10/20]%が強化ドロップになる。",
    attributes: [], canBeInitial: true
  },
  {
    id: "enhance_amp", name: "強化増幅", icon: "flare", type: "passive", effect: "enhanced_orb_bonus",
    values: [2, 4, 6], rarity: 2, price: 8,
    desc: "強化1個あたりのコンボ加算を+[2/4/6]する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "over_link", name: "過剰結合", icon: "layers", type: "passive", effect: "enhanced_link_multiplier",
    params: { count: 5 }, values: [2, 3, 5], rarity: 2, price: 9,
    desc: "強化5個以上を消したら倍率x[2/3/5]。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 落ちコンボーナス ---
  {
    id: "bonus_skyfall", name: "天恵の追撃", icon: "keyboard_double_arrow_down", type: "passive", effect: "skyfall_bonus",
    values: [5, 8, 12], rarity: 3, price: 8,
    desc: "落ちコン発生時にコンボ+[5/8/12]。",
    attributes: [],
    canBeCurseReward: true
  },

  // --- パッシブ: ボムドロップ ---
  {
    id: "bomb_erase_mult", name: "爆熱の余韻", icon: "emergency", type: "passive", effect: "bomb_erase_mult",
    values: [1.2, 1.3, 1.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "ボムの効果で消えたドロップ数 × [1.2/1.3/1.5] 倍、コンボ倍率に乗算される。",
    attributes: []
  },
  {
    id: "ignited_drop_fire", name: "爆炎の兆し", icon: "emergency", type: "passive", effect: "bomb_chance_color", params: { color: "fire" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 9,
    desc: "炎ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "ignited_drop_dark", name: "暗黒の兆し", icon: "emergency", type: "passive", effect: "bomb_chance_color", params: { color: "dark" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 9,
    desc: "月ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
    attributes: ["dark"],
    canBeInitial: true
  },

  // --- パッシブ: リピートドロップ ---
  {
    id: "repeat_combo_mult", name: "連鎖の共鳴", icon: "autorenew", type: "passive", effect: "repeat_combo_mult",
    values: [1.3, 1.5, 2], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "リピートドロップの消去数 × [1.3/1.5/2] 倍、コンボ倍率に乗算される。",
    attributes: []
  },
  {
    id: "repeat_chance_water", name: "雨波の巡り", icon: "autorenew", type: "passive", effect: "repeat_chance_color", params: { color: "water" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 7,
    desc: "雨ドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "repeat_chance_heart", name: "生命の巡り", icon: "autorenew", type: "passive", effect: "repeat_chance_color", params: { color: "heart" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 7,
    desc: "ハートドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "repeat_erase_combo", name: "反響する輪舞", icon: "autorenew", type: "passive", effect: "repeat_erase_combo",
    values: [2, 3, 5], rarity: 3, price: 10,
    desc: "ターン中にリピートドロップが消えた数 × [2/3/5] コンボを加算する。",
    attributes: []
  },
  {
    id: "repeat_extra_activations", name: "無限の風霊", icon: "autorenew", type: "passive", effect: "extra_repeat_activations",
    values: [1, 2, 3], rarity: 3, price: 9,
    desc: "リピートドロップ消去時、リピート効果が追加で[1/2/3]回発動する。",
    attributes: []
  },

  // --- パッシブ: スタードロップ ---
  {
    id: "star_chance_wood", name: "星宿る風", icon: "stars", type: "passive", effect: "star_chance_color", params: { color: "wood" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 8,
    desc: "風ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "star_chance_light", name: "星宿る雷", icon: "stars", type: "passive", effect: "star_chance_color", params: { color: "light" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 8,
    desc: "雷ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "star_erase_mult", name: "星屑の共鳴", icon: "stars", type: "passive", effect: "star_erase_mult",
    values: [0.5, 1.0, 1.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "ターン中にスタードロップが消えた数 × [0.5/1/1.5] 倍、コンボ倍率に乗算される。",
    attributes: []
  },
  {
    id: "star_earn_boost", name: "星の祝福", icon: "stars", type: "passive", effect: "star_earn_boost",
    values: [3, 5, 8], rarity: 2, price: 8,
    desc: "スタードロップが消えた時にもらえるスター（通貨）の数が3/5/8個増える。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 虹ドロップ ---
  {
    id: "rainbow_chance", name: "虹の呼び声", icon: "palette", type: "passive", effect: "rainbow_chance",
    values: [0.02, 0.04, 0.07], rarity: 2, price: 8,
    desc: "ドロップが[2/4/7]%の確率で虹ドロップとして降ってくるようになる。",
    attributes: ["fire", "water", "wood", "light", "dark"], canBeInitial: true
  },
  {
    id: "rainbow_bridge", name: "虹の架け橋", icon: "palette", type: "passive", effect: "rainbow_combo_bonus",
    values: [1, 2, 5], rarity: 3, price: 10,
    desc: "虹ドロップがコンボに関与した際、コンボ加算がさらに +[1/2/5] される。",
    attributes: ["fire", "water", "wood", "light", "dark"]
  },

  // --- パッシブ: ムーブドロップ ---
  {
    id: "move_drop", name: "ムーブドロップ", icon: "control_camera", type: "passive", effect: "move_drop",
    values: [5, 3, 1], rarity: 2, price: 8,
    desc: "所持中盤面にムーブドロップを1つ追加。[5/3/1]マス移動毎にカウント＋1。ターン終了時カウント数分コンボ加算。",
    attributes: [], canBeInitial: true
  },
  {
    id: "move_drop_boost", name: "飛躍の歩法", icon: "directions_run", type: "passive", effect: "move_drop_boost",
    values: [1, 2, 5], rarity: 2, price: 9,
    desc: "ムーブドロップが規定マス移動した際、カウントの増加量が+[1/2/5]される。",
    attributes: [], canBeInitial: true
  },
  {
    id: "move_drop_lucky", name: "幸運の歩み", icon: "filter_7", type: "passive", effect: "move_drop_lucky",
    values: ["7", "5,7", "5,7,9"], rarity: 3, price: 12,
    desc: "コンボ終了時、カウントが[7 / 5,7 / 5,7,9]の倍数のムーブドロップがあれば、アクティブスキルをチャージMAXにする(カウント1以上限定)。",
    attributes: [], canBeInitial: true
  },

  // --- パッシブ: トークン数・レベル依存 ---
  {
    id: "star1_combo_boost", name: "一星の共鳴", icon: "stars", type: "passive", effect: "star_count_combo_add",
    params: { rarity: 1 }, values: [1, 2, 3], rarity: 2, price: 6,
    desc: "所持している★1トークン数 × [1/2/3]をコンボ数に加算する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "star2_time_boost", name: "二星の延刻", icon: "timer", type: "passive", effect: "star_count_time_ext",
    params: { rarity: 2 }, values: [2, 3, 4], rarity: 2, price: 6,
    desc: "所持している★2トークン数 × [2/3/4]秒 操作時間を延長する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "star3_mult_boost", name: "三星の極雷", icon: "trending_up", type: "passive", effect: "star_count_combo_mult",
    params: { rarity: 3 }, values: [1.2, 1.5, 2], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "所持している★3トークン数 × [1.2/1.5/2]倍 コンボ倍率を乗算する。",
    attributes: []
  },
  {
    id: "enchant_mult_boost", name: "魔導の共犯", icon: "auto_fix_normal", type: "passive", effect: "enchant_count_combo_mult",
    values: [1.1, 1.2, 1.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "所持しているエンチャント数 × [1.1/1.2/1.5]倍 コンボ倍率を乗算する。",
    attributes: []
  },
  {
    id: "total_level_boost", name: "全霊の共鳴", icon: "upgrade", type: "passive", effect: "total_level_combo_add",
    values: [1, 1.5, 2], rarity: 3, price: 12,
    desc: "所持しているトークンのレベル数の合計 × [1/1.5/2] をコンボ数に加算する。",
    attributes: []
  },
  {
    id: "level3_count_mult", name: "三魂の極致", icon: "upgrade", type: "passive", effect: "level3_count_combo_mult",
    values: [1, 1.5, 2], maxMultipliers: [10, 20, 50], rarity: 3, price: 15,
    desc: "所持しているレベル3トークンの数 × [1.5/2/3] 倍 コンボ倍率を乗算する。",
    attributes: []
  },
  {
    id: "curse_count_mult", name: "厄災の祈り", icon: "psychology", type: "passive", effect: "curse_count_combo_mult",
    values: [1.5, 2, 3], maxMultipliers: [20, 50, 100], rarity: 3, price: 15,
    desc: "所持している呪いの数 × [2/3/5] 倍 コンボ倍率を乗算する。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "copy_token", name: "模倣の魔鏡", icon: "content_copy", type: "passive", effect: "copy_left",
    values: [1], rarity: 3, price: 10,
    desc: "左隣のトークンの効果とエンチャントをコピーする。自身はレベルアップせず、エンチャントも付与されない。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "duration_booster", name: "刻の歯車", icon: "schedule", type: "passive", effect: "active_duration_boost",
    values: [1, 2, 3], rarity: 3, price: 15,
    desc: "効果手番があるアクティブスキルの持続時間を [+1/+2/+3] 手番延長する。",
    attributes: []
  },

  // --- パッシブ: 統計依存（コンボ・倍率）---
  {
    id: "memory_of_combo", name: "コンボの記憶", icon: "history", type: "passive", effect: "stat_combo_記憶",
    values: [1, 2, 3], rarity: 2, price: 6,
    desc: "現在のゲーム中の「最大コンボ数」5コンボにつき、常にコンボ加算 +[1/2/3]。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "echo_of_max", name: "極大の余韻", icon: "layers", type: "passive", effect: "stat_mult_余韻",
    values: [0.1, 0.2, 0.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "現在のゲーム中の「最大コンボ倍率」の[10/20/50]%を、常時コンボ倍率に乗算する。",
    attributes: []
  },
  {
    id: "thousand_arms", name: "千手観音", icon: "query_stats", type: "passive", effect: "stat_mult_千手",
    values: [1.1, 1.2, 1.3], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "現在のゲーム中の「累計コンボ数」100ごとに、コンボ倍率が x[1.1/1.2/1.3] 上昇する。",
    attributes: []
  },
  {
    id: "curse_eater", name: "呪い喰い", icon: "psychology", type: "passive", effect: "stat_curse_removed",
    values: [2, 3, 5], rarity: 3, price: 15,
    desc: "解除した呪いトークンの累計数1個につき、コンボ倍算に +[1/2/4] 加算する。",
    attributes: []
  },
  {
    id: "chalice_of_life", name: "生命の器", icon: "favorite", type: "passive", effect: "stat_heart_chalice",
    values: [1.2, 1.5, 2], rarity: 2, price: 10,
    desc: "累計で消去したハートドロップ数30個ごとに、コンボ倍率が x[1.2/1.5/2] 上昇する。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "time_skipper", name: "早送りの極意", icon: "fast_forward", type: "passive", effect: "stat_time_skipper",
    values: [1.3, 1.5, 2], rarity: 2, price: 9,
    desc: "スキップしたターン数5回につき、コンボ倍率が x[1.3/1.5/2] 上昇する。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 属性依存・条件付き強化 ---
  {
    id: "attr_res_fire", name: "紅炎の共鳴", icon: "layers", type: "passive", effect: "attribute_count_combo_add",
    params: { attribute: "fire" }, values: [5, 5, 5], rarity: 2, price: 8,
    desc: "所持している炎属性トークン数 × 5 コンボを加算する。",
    attributes: ["fire"], canBeInitial: true
  },
  {
    id: "attr_res_water", name: "蒼氷の共鳴", icon: "layers", type: "passive", effect: "attribute_count_combo_add",
    params: { attribute: "water" }, values: [5, 5, 5], rarity: 2, price: 8,
    desc: "所持している雨属性トークン数 × 5 コンボを加算する。",
    attributes: ["water"], canBeInitial: true
  },
  {
    id: "attr_res_wood", name: "翠嵐の共鳴", icon: "layers", type: "passive", effect: "attribute_count_combo_add",
    params: { attribute: "wood" }, values: [5, 5, 5], rarity: 2, price: 8,
    desc: "所持している風属性トークン数 × 5 コンボを加算する。",
    attributes: ["wood"], canBeInitial: true
  },
  {
    id: "attr_res_light", name: "閃光の共鳴", icon: "layers", type: "passive", effect: "attribute_count_combo_add",
    params: { attribute: "light" }, values: [5, 5, 5], rarity: 2, price: 8,
    desc: "所持している雷属性トークン数 × 5 コンボを加算する。",
    attributes: ["light"], canBeInitial: true
  },
  {
    id: "attr_res_dark", name: "常闇の共鳴", icon: "layers", type: "passive", effect: "attribute_count_combo_add",
    params: { attribute: "dark" }, values: [5, 5, 5], rarity: 2, price: 8,
    desc: "所持している月属性トークン数 × 5 コンボを加算する。",
    attributes: ["dark"], canBeInitial: true
  },
  {
    id: "attr_res_heart", name: "慈愛の共鳴", icon: "layers", type: "passive", effect: "attribute_count_combo_add",
    params: { attribute: "heart" }, values: [5, 5, 5], rarity: 2, price: 8,
    desc: "所持している心属性トークン数 × 5 コンボを加算する。",
    attributes: ["heart"], canBeInitial: true
  },
  {
    id: "pure_power", name: "純粋なる力", icon: "stars", type: "passive", effect: "no_attribute_multiplier",
    values: [10, 20, 50], maxMultipliers: [100, 500, 1000], rarity: 3, price: 15,
    desc: "「時の砂」以外の無属性トークンを所持していない場合、最終コンボ倍率を [10/20/50] 倍にする。",
    attributes: ["fire", "water", "wood", "light", "dark", "heart"],
    canBeInitial: false
  },


  // --- パッシブ: 統計依存（特殊消し）---
  {
    id: "seeker_of_cross", name: "十字の求道者", icon: "category", type: "passive", effect: "stat_shape_cross",
    values: [1, 2, 3], rarity: 2, price: 8,
    desc: "現在のゲーム中の「十字消し累計回数」5回につき、十字消しの際に追加でコンボ加算 +[1/2/3]。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "seeker_of_len4", name: "四連の探求者", icon: "category", type: "passive", effect: "stat_shape_len4",
    values: [1, 2, 3], rarity: 2, price: 6,
    desc: "現在のゲーム中の「4個消し累計回数」20回につき、4個消しの際に追加でコンボ加算 +[1/2/3]。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "polishing_claw", name: "鉤爪の研鑽", icon: "sell", type: "passive", effect: "stat_shape_l",
    values: [1, 2, 3], rarity: 2, price: 5,
    desc: "現在のゲーム中の「L字消し累計回数」1回につき、このトークンの売却値が[1/2/3]上がる。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "memory_of_flash", name: "一閃の記憶", icon: "category", type: "passive", effect: "stat_shape_row",
    values: [1.1, 1.3, 1.5], maxMultipliers: [10, 20, 50], rarity: 2, price: 9,
    desc: "現在のゲーム中の「横1列消し累計回数」5回につき、横1列消しのコンボ倍率が x[1.1/1.3/1.5] 上昇する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "artisan_of_square", name: "方陣の職人", icon: "category", type: "passive", effect: "stat_shape_square",
    values: [1.5, 2, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "現在のゲーム中の「四角消し累計回数」5回につき、コンボ倍率が x[1.5/2/4] 上昇する。",
    attributes: []
  },
  {
    id: "guide_of_fivestar", name: "五星の導き手", icon: "category", type: "passive", effect: "stat_shape_len5",
    values: [0.5, 1.0, 1.5], rarity: 2, price: 8,
    desc: "現在のゲーム中の「5個以上連結消し累計回数」10回につき、5個消しの次手操作時間が +[0.5/1.0/1.5]秒 される。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 統計依存（リソース・進行）---
  {
    id: "pride_of_spendthrift", name: "浪費家の意地", icon: "monetization_on", type: "passive", effect: "stat_spend_star",
    values: [1.1, 1.2, 1.3], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "現在のゲーム中の「累計消費スター数」50★につき、コンボ倍率 x[1.1/1.2/1.3] 上昇。",
    attributes: []
  },
  {
    id: "proof_of_veteran", name: "歴戦の証明", icon: "verified", type: "passive", effect: "stat_progress_clear",
    values: [0.01, 0.02, 0.03], rarity: 3, price: 9,
    desc: "「現在のクリア回数」の進行ごとに、強化ドロップ確率が +[1/2/3]%。",
    attributes: []
  },
  {
    id: "end_of_thought", name: "熟考の果て", icon: "psychology", type: "passive", effect: "stat_time_move",
    values: [0.05, 0.1, 0.15], rarity: 2, price: 7,
    desc: "「合計操作時間」1分につき、目標達成後のスキップボーナス獲得量が +[5/10/15]%。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: ハイリスク・ハイリターン ---
  {
    id: "desperate_stance", name: "背水の陣", icon: "warning", type: "passive", effect: "desperate_stance",
    values: [4, 6, 8], rarity: 3, price: 12,
    desc: "操作時間が常に4秒固定。最終コンボ倍率x[4/6/8]倍。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "greed_power", name: "金満の暴力", icon: "monetization_on", type: "passive", effect: "greed_power",
    values: [7, 5, 3], maxMultipliers: [10, 20, 50], rarity: 1, price: 10,
    desc: "★[20/15/10]個につきコンボ倍率+1加算。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "picky_eater", name: "偏食家", icon: "restaurant", type: "passive", effect: "picky_eater",
    params: { excludeColors: ["heart", "light", "dark"] },
    values: [-2, -1, 0], rarity: 3, price: 9,
    desc: "ハート/雷/月が出現しなくなる。手番[−2/−1/±0]。",
    attributes: ["heart", "light", "dark"]
  },
  {
    id: "cursed_power", name: "呪われた力", icon: "psychology", type: "passive", effect: "cursed_power",
    values: [15, 25, 40], rarity: 1, price: 10,
    desc: "常にコンボ+[15/25/40]。操作時間−3秒。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "critical_passive",
    name: "会心の一撃",
    icon: "flash_on",
    type: "passive",
    effect: "critical_strike",
    values: [15, 30, 50],
    rarity: 3, price: 10,
    desc: "20%の確率で、最終コンボ倍率が[15/30/50]倍になる。",
    attributes: []
  },
  {
    id: "shape_master",
    name: "百般の型の極意",
    icon: "category",
    type: "passive",
    effect: "shape_variety_mult",
    values: [3, 4, 5],
    rarity: 2, price: 12,
    desc: "1ターンの間に異なる特殊消しを2種類以上発動させると、コンボ数x[3/4/5]倍。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "zero_charge",
    name: "静寂の瞑想",
    icon: "self_improvement",
    type: "passive",
    effect: "zero_combo_charge",
    values: [3, 5, 7],
    rarity: 1, price: 9,
    desc: "0コンボの時、スキルのエネルギーを[3/5/7]チャージする。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "random_add",
    name: "気まぐれなダイス",
    icon: "casino",
    type: "passive",
    effect: "random_add",
    values: [
      [0, 1, 2, 3, 4, 5, 10],
      [0, 2, 4, 6, 8, 10, 30],
      [0, 3, 6, 9, 12, 15, 100]
    ],
    rarity: 2, price: 6,
    desc: "コンボ加算にランダムな値を追加する",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "contract_of_void", name: "虚無の契約", icon: "history_edu", type: "passive", effect: "contract_of_void",
    values: [3, 4, 5], rarity: 3, price: 12,
    desc: "全エンチャント効果が無効になる代わりに、コンボ倍率が常にx[3/4/5]倍になる。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "limit_breaker", name: "神ノ理", icon: "rocket_launch", type: "passive", effect: "limit_break",
    values: [2, 5, Infinity], rarity: 3, price: 15,
    desc: "一部のパッシブ効果による「動的コンボ倍率の最大上限」をLvで上昇させる(Lv1:x2/Lv2:x5)。Lv3で上限が撤廃される。",
    attributes: [],
    canBeCurseReward: true
  },
  // ==========================================
  // ★ 呪い（Challenge選択時に付与）
  // ==========================================
  {
    id: "curse_turns",
    name: "不運の枷",
    icon: "sentiment_very_dissatisfied",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "1サイクルの手番が1減る。",
    conditionDesc: "新たに5サイクル分クリアする",
    condition: "clears",
    targetValue: 5,
    attributes: []
  },
  {
    id: "curse_heart",
    name: "絶望の癒し",
    icon: "heart_broken",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "ハートドロップを消してもコンボが増えなくなる。",
    conditionDesc: "所持してからハートドロップを30個消す",
    condition: "heart_erase",
    targetValue: 30,
    attributes: ["heart"]
  },
  {
    id: "curse_time",
    name: "焦燥の刻印",
    icon: "timer_off",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "操作時間が4秒固定になる。",
    conditionDesc: "所持してから累計50コンボする",
    condition: "total_combo",
    targetValue: 50,
    attributes: []
  },
  {
    id: "curse_skyfall",
    name: "静寂の呪縛",
    icon: "cloud_off",
    type: "curse",
    effect: "forbidden",
    values: [1, 1, 1],
    rarity: 1,
    price: 0,
    isLocked: true,
    desc: "常時落ちコンが発生しなくなる。条件達成まで売却不可。",
    conditionDesc: "所持してから累計50スター獲得する",
    attributes: [],
    condition: "total_stars",
    targetValue: 50,
  },
  {
    id: "curse_half",
    name: "脆弱の断層",
    icon: "trending_down",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "コンボ数が半分になる（倍率0.5）。",
    conditionDesc: "所持してから1手番で30コンボ達成する",
    condition: "max_combo",
    targetValue: 30,
    attributes: []
  },
  {
    id: "curse_init",
    name: "無の対価",
    icon: "money_off",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "獲得時に所持スターが半分になり、スター獲得に必要なコンボ数が1増える。",
    conditionDesc: "所持してからトークンを累計5つ売却する",
    condition: "tokens_sold",
    targetValue: 5,
    attributes: []
  },
  {
    id: "curse_double_target",
    name: "倍加の呪い",
    icon: "priority_high",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "1サイクルの目標値が2倍になる。",
    conditionDesc: "所持してからスキップを3回行う",
    condition: "skips_performed",
    targetValue: 3,
    attributes: []
  },

  // ==========================================
  // ★ アクティブ呪いトークン（スキルスロット枠の呪い）
  // ==========================================
  {
    id: "curse_active_time",
    name: "刹那の呪縛",
    icon: "timer_off",
    type: "skill",          // アクティブスロットに入るためskill型
    isCurse: true,          // 呪いトークンフラグ
    isLocked: true,         // 売却不可
    action: "curse_op_time_fix", // 操作時間を1秒に固定する特殊アクション
    cost: 4,                // チャージ4ターン必要
    params: { duration: 2, timeMs: 1000 }, // 2ターン間、操作時間1000ms固定
    rarity: 0,
    price: 0,
    desc: "2ターン間、操作時間が1秒固定になる。\nチャージ4ターン。",
    conditionDesc: "このスキルを5回使用する",
    condition: "skill_uses", // このスキル自身の使用回数
    targetValue: 5,
    attributes: []
  },
  {
    id: "curse_active_passive_null",
    name: "虚無の封印",
    icon: "block",
    type: "skill",          // アクティブスロットに入るためskill型
    isCurse: true,          // 呪いトークンフラグ
    isLocked: true,         // 売却不可
    action: "curse_passive_null", // 全パッシブ効果を無効にする特殊アクション
    cost: 5,                // チャージ5ターン必要
    params: { duration: 1 }, // 1ターン間、全パッシブ無効
    rarity: 0,
    price: 0,
    desc: "1ターン間、全てのパッシブトークンの効果が発動しない。\nチャージ5ターン。",
    conditionDesc: "このスキルを3回使用する",
    condition: "skill_uses", // このスキル自身の使用回数
    targetValue: 3,
    attributes: []
  },
  {
    id: "curse_multiply",
    name: "増殖",
    icon: "library_add",
    type: "skill",
    isCurse: true,
    isLocked: true,
    action: "curse_multiply",
    cost: 5,
    rarity: 0,
    price: 0,
    desc: "使用するたび「増殖された呪い」をスロットに生成する。\n解除条件：この呪いを3回使用する",
    conditionDesc: "この呪いを3回使用する",
    condition: "skill_uses",
    targetValue: 3,
    attributes: []
  },
  {
    id: "curse_multiplied_p",
    name: "増殖された呪い",
    icon: "warning_amber",
    type: "passive",
    isCurse: true,
    isLocked: true,
    rarity: 0,
    price: 0,
    desc: "「増殖」によって生み出された呪い。効果はないが、スロットを圧迫する。",
    attributes: []
  },
  {
    id: "curse_multiplied_a",
    name: "増殖された呪い",
    icon: "warning_amber",
    type: "skill",
    isCurse: true,
    isLocked: true,
    cost: 99,
    rarity: 0,
    price: 0,
    desc: "「増殖」によって生み出された呪い。効果はなく、使用もできない。",
    attributes: []
  },

  // --- パッシブ: 累積消去数トリガー ---
  {
    id: "passive_fire_count",
    name: "紅炎の供物",
    icon: "inventory_2",
    type: "passive",
    rarity: 2,
    price: 8,
    isCountPassive: true,
    maxCharge: 30,
    values: [30, 25, 20],
    desc: "炎ドロップを[30/25/20]個消去するたびにランダムなトークンを入手する（枠が空いている時のみ）。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "passive_water_count",
    name: "蒼雨の供物",
    icon: "inventory_2",
    type: "passive",
    rarity: 2,
    price: 8,
    isCountPassive: true,
    maxCharge: 30,
    values: [30, 25, 20],
    desc: "雨ドロップを[30/25/20]個消去するたびにランダムなトークンにエンチャントを付与する。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "passive_wood_count",
    name: "翠風の供物",
    icon: "inventory_2",
    type: "passive",
    rarity: 2,
    price: 8,
    isCountPassive: true,
    maxCharge: 30,
    values: [30, 25, 20],
    desc: "風ドロップを[30/25/20]個消去するたびにスター所持数が1.2倍になる。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "passive_dark_count",
    name: "常月の供物",
    icon: "inventory_2",
    type: "passive",
    rarity: 2,
    price: 8,
    isCountPassive: true,
    maxCharge: 30,
    values: [30, 25, 20],
    desc: "月ドロップを[30/25/20]個消去するたびにランダムなトークンが1つレベルアップする（レベルアップ可能なものがある時のみ）。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "passive_light_count",
    name: "閃雷の供物",
    icon: "inventory_2",
    type: "passive",
    rarity: 2,
    price: 8,
    isCountPassive: true,
    maxCharge: 30,
    values: [30, 25, 20],
    desc: "雷ドロップを[30/25/20]個消去するたびにアクティブスキルのチャージが2たまる。",
    attributes: ["light"],
    canBeInitial: true
  },

  // --- ショップ属性出現率アップ ---
  {
    id: "shop_attr_fire",
    name: "炎の福音",
    icon: "storefront",
    type: "passive",
    effect: "shop_attribute_weight",
    params: { attribute: "fire" },
    values: [1.4, 1.8, 2.5],
    rarity: 1,
    price: 4,
    desc: "ショップに炎属性のトークンが出現しやすくなる（×[1.4/1.8/2.5]倍）。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "shop_attr_water",
    name: "雨の福音",
    icon: "storefront",
    type: "passive",
    effect: "shop_attribute_weight",
    params: { attribute: "water" },
    values: [1.4, 1.8, 2.5],
    rarity: 1,
    price: 4,
    desc: "ショップに雨属性のトークンが出現しやすくなる（×[1.4/1.8/2.5]倍）。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "shop_attr_wood",
    name: "風の福音",
    icon: "storefront",
    type: "passive",
    effect: "shop_attribute_weight",
    params: { attribute: "wood" },
    values: [1.4, 1.8, 2.5],
    rarity: 1,
    price: 4,
    desc: "ショップに風属性のトークンが出現しやすくなる（×[1.4/1.8/2.5]倍）。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "shop_attr_light",
    name: "雷の福音",
    icon: "storefront",
    type: "passive",
    effect: "shop_attribute_weight",
    params: { attribute: "light" },
    values: [1.4, 1.8, 2.5],
    rarity: 1,
    price: 4,
    desc: "ショップに雷属性のトークンが出現しやすくなる（×[1.4/1.8/2.5]倍）。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "shop_attr_dark",
    name: "月の福音",
    icon: "storefront",
    type: "passive",
    effect: "shop_attribute_weight",
    params: { attribute: "dark" },
    values: [1.4, 1.8, 2.5],
    rarity: 1,
    price: 4,
    desc: "ショップに月属性のトークンが出現しやすくなる（×[1.4/1.8/2.5]倍）。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "shop_attr_heart",
    name: "癒の福音",
    icon: "storefront",
    type: "passive",
    effect: "shop_attribute_weight",
    params: { attribute: "heart" },
    values: [1.4, 1.8, 2.5],
    rarity: 1,
    price: 4,
    desc: "ショップに心(癒)属性のトークンが出現しやすくなる（×[1.4/1.8/2.5]倍）。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "shop_attr_none",
    name: "無の福音",
    icon: "storefront",
    type: "passive",
    effect: "shop_attribute_weight",
    params: { attribute: "none" },
    values: [1.4, 1.8, 2.5],
    rarity: 1,
    price: 4,
    desc: "ショップに無属性のトークンが出現しやすくなる（×[1.4/1.8/2.5]倍）。",
    attributes: [],
    canBeInitial: true
  }
];

export { ALL_TOKEN_BASES };
