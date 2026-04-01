const ALL_TOKEN_BASES = [
  // ==========================================
  // ★ スキル
  // ==========================================

  // --- スキル: 変換（1色→1色）---
  { id: "fired", name: "焔の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "wood", to: "fire" }, rarity: 1, price: 2, desc: "風を炎に変換。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "waterd", name: "氷の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "water" }, rarity: 1, price: 2, desc: "炎を雨に変換。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "woodd", name: "嵐の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "water", to: "wood" }, rarity: 1, price: 2, desc: "雨を風に変換。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "lightd", name: "雷の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "dark", to: "light" }, rarity: 1, price: 2, desc: "月を雷に変換。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "darkd", name: "影の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "light", to: "dark" }, rarity: 1, price: 2, desc: "雷を月に変換。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "heartd", name: "癒の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "heart" }, rarity: 1, price: 2, desc: "炎をハートに変換。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "conv_h_f", name: "癒の劫炎", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "fire" }, rarity: 1, price: 2, desc: "ハートを炎に変換。消費E:{cost}", attributes: ["fire", "heart"] },
  { id: "conv_h_w", name: "癒の奔流", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "water" }, rarity: 1, price: 2, desc: "ハートを雨に変換。消費E:{cost}", attributes: ["water", "heart"] },
  { id: "conv_h_g", name: "癒の深風", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "wood" }, rarity: 1, price: 2, desc: "ハートを風に変換。消費E:{cost}", attributes: ["wood", "heart"] },
  { id: "conv_h_l", name: "癒の聖雷", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "light" }, rarity: 1, price: 2, desc: "ハートを雷に変換。消費E:{cost}", attributes: ["light", "heart"] },
  { id: "conv_h_d", name: "癒の呪法", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "dark" }, rarity: 1, price: 2, desc: "ハートを月に変換。消費E:{cost}", attributes: ["dark", "heart"] },

  // --- スキル: 多色変換（2色→1色）---
  { id: "conv_m_fd_w", name: "業水の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "water" }, rarity: 1, price: 3, desc: "炎と月を雨に変換。消費E:{cost}", attributes: ["water"] },
  { id: "conv_m_fd_l", name: "炎雷の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "light" }, rarity: 1, price: 3, desc: "炎と月を雷に変換。消費E:{cost}", attributes: ["light"] },
  { id: "conv_m_wh_f", name: "紅蓮の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "fire" }, rarity: 1, price: 3, desc: "雨とハートを炎に変換。消費E:{cost}", attributes: ["fire"] },
  { id: "conv_m_wh_g", name: "蒼風の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "wood" }, rarity: 1, price: 3, desc: "雨とハートを風に変換。消費E:{cost}", attributes: ["wood"] },
  { id: "conv_m_gl_d", name: "神緑の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "dark" }, rarity: 1, price: 3, desc: "風と雷を月に変換。消費E:{cost}", attributes: ["dark"] },
  { id: "conv_m_gl_h", name: "天恵の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "heart" }, rarity: 1, price: 3, desc: "風と雷をハートに変換。消費E:{cost}", attributes: ["heart"] },
  { id: "conv_m_fw_g", name: "天地の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water"], to: "wood" }, rarity: 1, price: 3, desc: "炎と雨を風に変換。消費E:{cost}", attributes: ["wood"] },
  { id: "conv_m_ld_h", name: "黄昏の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "heart" }, rarity: 1, price: 3, desc: "雷と月をハートに変換。消費E:{cost}", attributes: ["heart"] },

  // --- スキル: 盤面変更（3色）---
  { id: "board_tri_fdw", name: "三色の真理・業水", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "water"] }, rarity: 1, price: 3, desc: "盤面を炎/月/雨に変更。消費E:{cost}", attributes: ["fire", "dark", "water"] },
  { id: "board_tri_fdl", name: "三色の真理・炎光", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "light"] }, rarity: 1, price: 3, desc: "盤面を炎/月/雷に変更。消費E:{cost}", attributes: ["fire", "dark", "light"] },
  { id: "board_tri_whf", name: "三色の真理・紅蓮", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "fire"] }, rarity: 1, price: 3, desc: "盤面を雨/ハート/炎に変更。消費E:{cost}", attributes: ["water", "heart", "fire"] },
  { id: "board_tri_whg", name: "三色の真理・蒼木", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "wood"] }, rarity: 1, price: 3, desc: "盤面を雨/ハート/風に変更。消費E:{cost}", attributes: ["water", "heart", "wood"] },
  { id: "board_tri_gld", name: "三色の真理・神緑", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "dark"] }, rarity: 1, price: 3, desc: "盤面を風/雷/月に変更。消費E:{cost}", attributes: ["wood", "light", "dark"] },
  { id: "board_tri_glh", name: "三色の真理・天恵", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "heart"] }, rarity: 1, price: 3, desc: "盤面を風/雷/ハートに変更。消費E:{cost}", attributes: ["wood", "light", "heart"] },
  { id: "board_tri_fwg", name: "三色の真理・天地", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "wood"] }, rarity: 1, price: 3, desc: "盤面を炎/雨/風に変更。消費E:{cost}", attributes: ["fire", "water", "wood"] },
  { id: "board_tri_ldh", name: "三色の真理・黄昏", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "dark", "heart"] }, rarity: 1, price: 3, desc: "盤面を雷/月/ハートに変更。消費E:{cost}", attributes: ["light", "dark", "heart"] },

  // --- スキル: 盤面変更（2色）---
  { id: "board_bi_fd", name: "炎月の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark"] }, rarity: 1, price: 4, desc: "盤面を炎/月の2色に変更。消費E:{cost}", attributes: ["fire", "dark"] },
  { id: "board_bi_wh", name: "蒼海の至宝", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart"] }, rarity: 1, price: 4, desc: "盤面を雨/ハートの2色に変更。消費E:{cost}", attributes: ["water", "heart"] },
  { id: "board_bi_gl", name: "風雷の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light"] }, rarity: 1, price: 4, desc: "盤面を風/雷の2色に変更。消費E:{cost}", attributes: ["wood", "light"] },
  { id: "board_bi_wd", name: "雨月の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "dark"] }, rarity: 1, price: 4, desc: "盤面を雨/月の2色に変更。消費E:{cost}", attributes: ["water", "dark"] },
  { id: "board_bi_gh", name: "風癒の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "heart"] }, rarity: 1, price: 4, desc: "盤面を風/ハートの2色に変更。消費E:{cost}", attributes: ["wood", "heart"] },
  { id: "board_bi_fl", name: "炎雷の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "light"] }, rarity: 1, price: 4, desc: "盤面を炎/雷の2色に変更。消費E:{cost}", attributes: ["fire", "light"] },

  // --- スキル: 盤面変更（1色）---
  { id: "board_mono1", name: "真・紅蓮の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["fire"] }, rarity: 2, price: 6, desc: "盤面すべてを炎に変更。消費E:{cost}", attributes: ["fire"] },
  { id: "board_mono2", name: "真・閃雷の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["light"] }, rarity: 2, price: 6, desc: "盤面すべてを雷に変更。消費E:{cost}", attributes: ["light"] },
  { id: "board_mono3", name: "真・蒼海の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["water"] }, rarity: 2, price: 6, desc: "盤面すべてを雨に変更。消費E:{cost}", attributes: ["water"] },
  { id: "board_mono4", name: "真・深翠の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["wood"] }, rarity: 2, price: 6, desc: "盤面すべてを風に変更。消費E:{cost}", attributes: ["wood"] },
  { id: "board_mono5", name: "真・常月の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["dark"] }, rarity: 2, price: 6, desc: "盤面すべてを月に変更。消費E:{cost}", attributes: ["dark"] },
  { id: "board_mono6", name: "真・生命の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["heart"] }, rarity: 2, price: 6, desc: "盤面すべてをハートに変更。消費E:{cost}", attributes: ["heart"] },

  // --- スキル: 5属性均等配置 ---
  { id: "board_bal_5", name: "五行の理", type: "skill", cost: 5, costLevels: true, action: "board_balance", rarity: 2, price: 5, desc: "全ドロップを5属性各6個に変化させる。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"] },

  // --- スキル: 行・列固定変換 ---
  { id: "row_f", name: "烈炎の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "fire" }, rarity: 1, price: 3, desc: "上段をすべて炎に。消費E:{cost}", attributes: ["fire"] },
  { id: "row_w", name: "清流の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "water" }, rarity: 1, price: 3, desc: "上段をすべて雨に。消費E:{cost}", attributes: ["water"] },
  { id: "row_g", name: "深翠の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "wood" }, rarity: 1, price: 3, desc: "上段をすべて風に。消費E:{cost}", attributes: ["wood"] },
  { id: "row_l", name: "閃雷の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "light" }, rarity: 1, price: 3, desc: "上段をすべて雷に。消費E:{cost}", attributes: ["light"] },
  { id: "row_d", name: "常月の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "dark" }, rarity: 1, price: 3, desc: "上段をすべて月に。消費E:{cost}", attributes: ["dark"] },
  { id: "row_h", name: "生命の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "heart" }, rarity: 1, price: 3, desc: "上段をすべてハートに。消費E:{cost}", attributes: ["heart"] },
  { id: "row_b_f", name: "烈炎の底陣", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: -1, type: "fire" }, rarity: 1, price: 3, desc: "下段をすべて炎に。消費E:{cost}", attributes: ["fire"] },
  { id: "row_c_h", name: "生命の帯", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: "center", type: "heart" }, rarity: 1, price: 3, desc: "中央行をすべてハートに。消費E:{cost}", attributes: ["heart"] },
  { id: "col_l_l", name: "閃雷の縦一閃", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: 0, type: "light" }, rarity: 1, price: 3, desc: "左端列をすべて雷に。消費E:{cost}", attributes: ["light"] },
  { id: "col_r_d", name: "常月の縦一閃", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: -1, type: "dark" }, rarity: 1, price: 3, desc: "右端列をすべて月に。消費E:{cost}", attributes: ["dark"] },

  // --- スキル: ドロップ強化（1色）---
  { id: "enh_f", name: "星の導き・炎", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["fire"] }, rarity: 1, price: 4, desc: "盤面の炎を全て強化。消費E:{cost}", attributes: ["fire"] },
  { id: "enh_w", name: "星の導き・雨", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["water"] }, rarity: 1, price: 4, desc: "盤面の雨を全て強化。消費E:{cost}", attributes: ["water"] },
  { id: "enh_g", name: "星の導き・風", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["wood"] }, rarity: 1, price: 4, desc: "盤面の風を全て強化。消費E:{cost}", attributes: ["wood"] },
  { id: "enh_l", name: "星の導き・雷", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["light"] }, rarity: 1, price: 4, desc: "盤面の雷を全て強化。消費E:{cost}", attributes: ["light"] },
  { id: "enh_d", name: "星の導き・月", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["dark"] }, rarity: 1, price: 4, desc: "盤面の月を全て強化。消費E:{cost}", attributes: ["dark"] },
  { id: "enh_h", name: "星の導き・ハート", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["heart"] }, rarity: 1, price: 4, desc: "盤面のハートを全て強化。消費E:{cost}", attributes: ["heart"] },

  // --- スキル: ドロップ強化（2色）---
  { id: "enh_fd", name: "星の導き・炎月", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "dark"] }, rarity: 2, price: 5, desc: "盤面の炎/月を全て強化。消費E:{cost}", attributes: ["fire", "dark"] },
  { id: "enh_wh", name: "星の導き・雨癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "heart"] }, rarity: 2, price: 5, desc: "盤面の雨/ハートを全て強化。消費E:{cost}", attributes: ["water", "heart"] },
  { id: "enh_gl", name: "星の導き・風雷", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "light"] }, rarity: 2, price: 5, desc: "盤面の風/雷を全て強化。消費E:{cost}", attributes: ["wood", "light"] },
  { id: "enh_wd", name: "星の導き・雨月", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "dark"] }, rarity: 2, price: 5, desc: "盤面の雨/月を全て強化. 消費E:{cost}", attributes: ["water", "dark"] },
  { id: "enh_gh", name: "星の導き・風癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "heart"] }, rarity: 2, price: 5, desc: "盤面の風/ハートを全て強化. 消費E:{cost}", attributes: ["wood", "heart"] },
  { id: "enh_fl", name: "星の導き・炎雷", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "light"] }, rarity: 2, price: 5, desc: "盤面の炎/雷を全て強化. 消費E:{cost}", attributes: ["fire", "light"] },

  // --- スキル: ランダム生成 ---
  { id: "gen_rand_fire", name: "炎の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "fire", count: 5 }, rarity: 1, price: 2, desc: "炎ドロップをランダムに5個生成。消費E:{cost}", attributes: ["fire"] },
  { id: "gen_rand_water", name: "雨の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "water", count: 5 }, rarity: 1, price: 2, desc: "雨ドロップをランダムに5個生成。消費E:{cost}", attributes: ["water"] },
  { id: "gen_rand_wood", name: "森の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "wood", count: 5 }, rarity: 1, price: 2, desc: "風ドロップをランダムに5個生成。消費E:{cost}", attributes: ["wood"] },
  { id: "gen_rand_light", name: "雷の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "light", count: 5 }, rarity: 1, price: 2, desc: "雷ドロップをランダムに5個生成。消費E:{cost}", attributes: ["light"] },
  { id: "gen_rand_dark", name: "月の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "dark", count: 5 }, rarity: 1, price: 2, desc: "月ドロップをランダムに5個生成。消費E:{cost}", attributes: ["dark"] },

  // --- スキル: ボムドロップ生成 ---
  { id: "gen_bomb_rand", name: "爆発の種", type: "skill", cost: 3, costLevels: true, action: "spawn_bomb_random", params: { count: 1 }, rarity: 1, price: 2, desc: "ランダムなドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: [] },
  { id: "conv_bomb_target_fire", name: "紅炎の火薬", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "fire" }, rarity: 2, price: 3, desc: "炎ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2], attributes: ["fire"] },
  { id: "conv_bomb_target_dark", name: "暗黒の火薬", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "dark" }, rarity: 2, price: 3, desc: "月ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2], attributes: ["dark"] },

  // --- スキル: スカイフォール強化（1色）---
  { id: "sky_f1", name: "紅蓮の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、炎がかなり落ちやすくなる。消費E:{cost}", attributes: ["fire"] },
  { id: "sky_w1", name: "蒼海の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雨がかなり落ちやすくなる。消費E:{cost}", attributes: ["water"] },
  { id: "sky_g1", name: "深翠の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、風がかなり落ちやすくなる。消費E:{cost}", attributes: ["wood"] },
  { id: "sky_l1", name: "閃雷の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雷がかなり落ちやすくなる。消費E:{cost}", attributes: ["light"] },
  { id: "sky_d1", name: "常月の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、月がかなり落ちやすくなる。消費E:{cost}", attributes: ["dark"] },
  { id: "sky_h1", name: "癒の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、ハートがかなり落ちやすくなる。消費E:{cost}", attributes: ["heart"] },

  // --- スキル: スカイフォール強化（2色）---
  { id: "sky_fd_2", name: "炎月の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と月が落ちやすくなる。消費E:{cost}", attributes: ["fire", "dark"] },
  { id: "sky_wh_2", name: "蒼海の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨とハートが落ちやすくなる。消費E:{cost}", attributes: ["water", "heart"] },
  { id: "sky_gl_2", name: "風雷の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風と雷が落ちやすくなる。消費E:{cost}", attributes: ["wood", "light"] },
  { id: "sky_wd_2", name: "雨月の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨と月が落ちやすくなる。消費E:{cost}", attributes: ["water", "dark"] },
  { id: "sky_gh_2", name: "風癒の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風とハートが落ちやすくなる。消費E:{cost}", attributes: ["wood", "heart"] },
  { id: "sky_fl_2", name: "炎雷の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と雷が落ちやすくなる. 消費E:{cost}", attributes: ["fire", "light"] },

  // --- スキル: スカイフォール停止（1色）---
  { id: "sky_f_stop", name: "紅蓮の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、炎が落ちてこなくなる。消費E:{cost}", attributes: ["fire"] },
  { id: "sky_w_stop", name: "蒼海の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雨が落ちてこなくなる。消費E:{cost}", attributes: ["water"] },
  { id: "sky_g_stop", name: "深翠の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、風が落ちてこなくなる。消費E:{cost}", attributes: ["wood"] },
  { id: "sky_l_stop", name: "閃雷の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雷が落ちてこなくなる。消費E:{cost}", attributes: ["light"] },
  { id: "sky_d_stop", name: "常月の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、月が落ちてこなくなる。消費E:{cost}", attributes: ["dark"] },
  { id: "sky_h_stop", name: "癒の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、ハートが落ちてこなくなる。消費E:{cost}", attributes: ["heart"] },

  // --- スキル: スカイフォール停止（2色）---
  { id: "sky_fd_stop", name: "炎月の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と月が落ちてこなくなる。消費E:{cost}", attributes: ["fire", "dark"] },
  { id: "sky_wh_stop", name: "蒼海の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨とハートが落ちてこなくなる。消費E:{cost}", attributes: ["water", "heart"] },
  { id: "sky_gl_stop", name: "風雷の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風と雷が落ちてこなくなる。消費E:{cost}", attributes: ["wood", "light"] },
  { id: "sky_wd_stop", name: "雨月の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨と月が落ちてこなくなる。消費E:{cost}", attributes: ["water", "dark"] },
  { id: "sky_gh_stop", name: "風癒の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風とハートが落ちてこなくなる。消費E:{cost}", attributes: ["wood", "heart"] },
  { id: "sky_fl_stop", name: "炎雷の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と雷が落ちてこなくなる. 消費E:{cost}", attributes: ["fire", "light"] },

  // --- スキル: スカイフォール色制限 ---
  { id: "sky_limit", name: "三色の結界", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["fire", "water", "wood"], duration: 3 }, rarity: 1, price: 4, desc: "3手番、炎/雨/風しか落ちてこなくなる。消費E:{cost}", attributes: ["fire", "water", "wood"] },
  { id: "sky_limit_ldh", name: "三界の結界", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["light", "dark", "heart"], duration: 3 }, rarity: 1, price: 4, desc: "3手番、雷/月/ハートしか落ちてこなくなる。消費E:{cost}", attributes: ["light", "dark", "heart"] },

  // --- スキル: リピートドロップ生成 ---
  { id: "gen_repeat_rand", name: "循環の理", type: "skill", cost: 3, costLevels: true, action: "spawn_repeat", params: { count: 1 }, rarity: 1, price: 5, desc: "ランダムなドロップ1つをリピートドロップ（2回消える）にする。消費E:{cost}", attributes: [] },
  { id: "conv_repeat_water", name: "雨鏡の輪廻", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "water" }, rarity: 3, price: 9, desc: "ランダムな雨ドロップ2つをリピートドロップにする。消費E:{cost}", attributes: ["water"], canBeCurseReward: true },
  { id: "conv_repeat_heart", name: "生命の輪廻", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "heart" }, rarity: 3, price: 9, desc: "ランダムなハートドロップ2つをリピートドロップにする。消費E:{cost}", attributes: ["heart"], canBeCurseReward: true },

  // --- スキル: スタードロップ生成 ---
  { id: "gen_star_rand", name: "星の創造", type: "skill", cost: 3, costLevels: true, action: "spawn_star", params: { count: 5 }, rarity: 1, price: 6, desc: "ランダムなドロップ5つをスタードロップにする。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "conv_star_wood", name: "星降る森", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "wood" }, rarity: 2, price: 9, desc: "風ドロップを全てスタードロップにする。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "conv_star_light", name: "星降る雷", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "light" }, rarity: 2, price: 9, desc: "雷ドロップをすべてスタードロップにする。消費E:{cost}", attributes: ["light"], canBeInitial: true },

  // --- スキル: 虹ドロップ生成 ---
  { id: "gen_rainbow_rand", name: "虹の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_rainbow", params: { count: 1 }, rarity: 1, price: 6, desc: "ランダムなドロップ1つをカウント3の虹ドロップにする。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeInitial: true },
  { id: "rainbow_masterx", name: "虹の極致", type: "skill", cost: 5, costLevels: true, action: "rainbow_master", params: { count: 1, to: 5 }, rarity: 3, price: 12, desc: "ランダムに虹ドロップを1つ生成し、盤面の全ての虹ドロップのカウントを5にする。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeCurseReward: true },

  // --- スキル: 特殊（時間・倍率・チャージ・再落下）---
  {
    id: "refresh",
    name: "次元の再編",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "force_refresh",
    rarity: 1, price: 2,
    desc: "全消去して再落下。落ちコンあり。消費E:{cost}",
    attributes: []
  },
  {
    id: "charge_boost",
    name: "練気の波動",
    type: "skill",
    cost: 3,
    action: "charge_boost",
    values: [1, 2, 3],
    rarity: 1, price: 3,
    desc: "他のスキルのエネルギーを1/2/3チャージ。消費E:3",
    attributes: []
  },
  { id: "chrono", name: "クロノス・ストップ", type: "skill", cost: 6, costLevels: true, action: "chronos_stop", params: { duration: 10000 }, rarity: 2, price: 7, desc: "10秒間、自由に操作可能になる。消費E:{cost}", attributes: [] },
  { id: "active_mult_1", name: "覚醒の鼓動", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 2, duration: 3 }, rarity: 2, price: 6, desc: "3手番、最終コンボ倍率が2倍になる。消費E:{cost}", attributes: [] },
  { id: "active_mult_2", name: "一刃の極意", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 5, duration: 1 }, rarity: 3, price: 10, desc: "1手番、最終コンボ倍率が5倍になる。消費E:{cost}", attributes: [] },
  { id: "seal_of_power", name: "力の封印", type: "skill", cost: 6, costLevels: true, action: "seal_of_power", params: { multiplier: 5, duration: 1 }, rarity: 3, price: 10, desc: "1手番、全エンチャント効果が無効になるが、コンボ倍率が5倍になる。消費E:{cost}", attributes: [] },

  // ==========================================
  // ★ パッシブ
  // ==========================================

  // --- パッシブ: 汎用ユーティリティ（ショップ・時間・基礎強化）---
  {
    id: "collector",
    name: "黄金の収集者",
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
    type: "passive",
    effect: "time_permanent",
    price: 4,
    rarity: 1,
    desc: "操作時間を2秒延長。（購入するごとに累積し、トークン枠を消費しない）",
    attributes: []
  },
  {
    id: "power_up",
    name: "力の鼓動",
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
    type: "passive",
    effect: "sale_boost",
    values: [2, 4, 6],
    rarity: 1, price: 6,
    desc: "ショップに並ぶセール品（半額）の数を2/4/6個に増加させる。",
    attributes: []
  },
  {
    id: "enchant_boost",
    name: "魔道の極意",
    type: "passive",
    effect: "enchant_grant_boost",
    values: [1, 2, 3],
    rarity: 2, price: 8,
    desc: "ショップに並ぶエンチャントの数を1/2/3個増加させる。",
    attributes: []
  },
  {
    id: "shop_expand",
    name: "陳列の極意",
    type: "passive",
    effect: "shop_expand",
    values: [1, 2, 3],
    rarity: 1, price: 8,
    desc: "ショップに並ぶ通常商品の枠を1/2/3枠拡張する。",
    attributes: []
  },
  {
    id: "skip_master",
    name: "時短の心得",
    type: "passive",
    effect: "skip_bonus_multiplier",
    values: [6, 8, 10],
    rarity: 2, price: 6,
    desc: "目標達成後のスキップボーナスを6/8/10倍にする。",
    attributes: []
  },
  {
    id: "dual_match",
    name: "双連の極意",
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
    id: "bonus_1c_fire", name: "炎の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "炎を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["fire"]
  },
  {
    id: "bonus_1c_water", name: "雨の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["water"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "雨を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["water"]
  },
  {
    id: "bonus_1c_wood", name: "風の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "風を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["wood"]
  },
  {
    id: "bonus_1c_light", name: "雷の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["light"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "雷を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["light"]
  },
  {
    id: "bonus_1c_dark", name: "月の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["dark"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "月を消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["dark"]
  },
  {
    id: "bonus_1c_heart", name: "癒の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["heart"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "ハートを消しているとコンボ数x[1.5/2/3]倍。",
    attributes: ["heart"]
  },

  // --- パッシブ: コンボ倍率（2色同時）---
  { id: "bonus_2c_fd", name: "炎月の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "炎/月を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["fire", "dark"] },
  { id: "bonus_2c_wh", name: "蒼海の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "雨/ハートを同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["water", "heart"] },
  { id: "bonus_2c_gl", name: "風雷の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "風/雷を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["wood", "light"] },
  { id: "bonus_2c_wd", name: "雨月の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "dark"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "雨/月を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["water", "dark"] },
  { id: "bonus_2c_gh", name: "風癒の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "heart"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "風/ハートを同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["wood", "heart"] },
  { id: "bonus_2c_fl", name: "炎雷の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "light"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "炎/雷を同時に消すとコンボ数x[1.8/2.5/4]倍。", attributes: ["fire", "light"] },

  // --- パッシブ: コンボ倍率（3色同時）---
  { id: "bonus_3c_fdw", name: "業水の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "water"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/月/雨を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["fire", "dark", "water"] },
  { id: "bonus_3c_fdl", name: "炎雷月の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "light"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/月/雷を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["fire", "dark", "light"] },
  { id: "bonus_3c_whf", name: "紅蓮の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "fire"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雨/ハート/炎を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["water", "heart", "fire"] },
  { id: "bonus_3c_whg", name: "蒼風の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "wood"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雨/ハート/風を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["water", "heart", "wood"] },
  { id: "bonus_3c_gld", name: "神緑の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "dark"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "風/雷/月を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["wood", "light", "dark"] },
  { id: "bonus_3c_glh", name: "天恵の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "heart"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "風/雷/ハートを同時に消すとコンボ数x[2/3/5]倍。", attributes: ["wood", "light", "heart"] },
  { id: "bonus_3c_fwg", name: "天地の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "water", "wood"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/雨/風を同時に消すとコンボ数x[2/3/5]倍。", attributes: ["fire", "water", "wood"] },
  { id: "bonus_3c_ldh", name: "黄昏の律動", type: "passive", effect: "color_multiplier", params: { colors: ["light", "dark", "heart"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雷/月/ハートを同時に消すとコンボ数x[2/3/5]倍。", attributes: ["light", "dark", "heart"] },

  // --- パッシブ: コンボ倍率（4色以上・色数指定）---
  {
    id: "bonus_4c_fwlh", name: "四天の秘儀", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "water", "light", "heart"] }, values: [2.5, 4, 6], rarity: 2, price: 10,
    desc: "炎/雨/雷/ハートを同時に消すとコンボ数x[2.5/4/6]倍。",
    attributes: ["fire", "water", "light", "heart"]
  },
  {
    id: "bonus_5c", name: "五色の秘儀", type: "passive", effect: "color_multiplier",
    params: { count: 5 }, values: [3, 5, 8], rarity: 2, price: 12,
    desc: "5色以上を同時に消すとコンボ数x[3/5/8]倍。",
    attributes: ["fire", "water", "wood", "light", "dark"]
  },
  {
    id: "bonus_6c", name: "六色の秘儀", type: "passive", effect: "color_multiplier",
    params: { count: 6 }, values: [4, 7, 12], rarity: 2, price: 15,
    desc: "6色すべてを同時に消すとコンボ数x[4/7/12]倍。",
    attributes: ["fire", "water", "wood", "light", "dark", "heart"]
  },

  // --- パッシブ: 色消し数ボーナス（6個以上）---
  { id: "req_6_fire", name: "炎の真髄", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "炎を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["fire"] },
  { id: "req_6_water", name: "雨の真髄", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "雨を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["water"] },
  { id: "req_6_wood", name: "風の真髄", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "風を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["wood"] },
  { id: "req_6_light", name: "雷の真髄", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "雷を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["light"] },
  { id: "req_6_dark", name: "月の真髄", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "月を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["dark"] },
  { id: "req_6_heart", name: "癒の真髄", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "ハートを合計で6個以上消しているとコンボ数x[2/2.5/3]倍。", attributes: ["heart"] },

  // --- パッシブ: 色消し数ボーナス（12個以上）---
  { id: "req_12_fire", name: "炎の極致", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "炎を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["fire"] },
  { id: "req_12_water", name: "雨の極致", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "雨を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["water"] },
  { id: "req_12_wood", name: "風の極致", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "風を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["wood"] },
  { id: "req_12_light", name: "雷の極致", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "雷を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["light"] },
  { id: "req_12_dark", name: "月の極致", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "月を合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["dark"] },
  { id: "req_12_heart", name: "癒の極致", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "ハートを合計で12個以上消しているとコンボ数x[3/4/5]倍。", attributes: ["heart"] },

  // --- パッシブ: コンボ数ちょうどボーナス ---
  {
    id: "combo_exact_3",
    name: "三連の巧技",
    type: "passive",
    effect: "combo_if_exact",
    params: { combo: 3 },
    values: [10, 15, 25],
    rarity: 1, price: 6,
    desc: "3コンボちょうどでコンボ+[10/15/25]。",
    attributes: []
  },
  {
    id: "combo_exact_10",
    name: "十連の極み",
    type: "passive",
    effect: "combo_if_exact",
    params: { combo: 10 },
    values: [15, 25, 40],
    rarity: 2, price: 9,
    desc: "10コンボちょうどでコンボ+[15/25/40]。",
    attributes: []
  },

  // --- パッシブ: コンボ数閾値ボーナス ---
  {
    id: "combo_ge_7",
    name: "七連の闘気",
    type: "passive",
    effect: "combo_if_ge",
    params: { combo: 7 },
    values: [2, 3, 5],
    rarity: 2, price: 10,
    desc: "7コンボ以上で最終コンボ[2/3/5]倍。",
    attributes: []
  },

  // --- パッシブ: 特殊消しボーナス ---
  {
    id: "len4", name: "四連の術", type: "passive", effect: "shape_bonus",
    params: { shape: "len4" }, values: [2, 4, 6], rarity: 1, price: 5,
    desc: "4個ちょうど連結でコンボ+[2/4/6]。",
    attributes: []
  },
  {
    id: "row_clear", name: "横一閃", type: "passive", effect: "shape_bonus",
    params: { shape: "row" }, values: [5, 10, 15], rarity: 1, price: 8,
    desc: "横1列消しでコンボ+[5/10/15]。",
    attributes: []
  },
  {
    id: "square", name: "四方の型", type: "passive", effect: "shape_bonus",
    params: { shape: "square" }, values: [2, 3, 5], maxMultipliers: [10, 20, 50], rarity: 1, price: 9,
    desc: "3x3正方形消しでコンボ×[2/3/5]倍。",
    attributes: []
  },
  {
    id: "len5", name: "五星の印", type: "passive", effect: "shape_bonus",
    params: { shape: "len5" }, values: [1.5, 2, 3], rarity: 1, price: 7,
    desc: "5個以上連結で次手の操作時間[1.5/2/3]倍。",
    attributes: []
  },
  {
    id: "cross", name: "十字の祈り", type: "passive", effect: "shape_bonus",
    params: { shape: "cross" }, values: [2, 3, 5], rarity: 1, price: 9,
    desc: "十字型消しで次手の操作時間[2/3/5]倍。",
    attributes: []
  },
  {
    id: "l_shape", name: "鉤十字の型", type: "passive", effect: "shape_bonus",
    params: { shape: "l_shape" }, values: [3, 6, 9], rarity: 1, price: 9,
    desc: "L字消しでコンボ+[3/6/9]。",
    attributes: []
  },
  {
    id: "bonus_heart", name: "癒の波動", type: "passive", effect: "heart_combo_bonus",
    values: [3, 5, 7], rarity: 1, price: 6,
    desc: "ハートドロップを消したコンボ数分、追加でコンボ+[3/5/7]。",
    attributes: ["heart"]
  },
  {
    id: "giant",
    name: "巨人の領域",
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
    id: "mana_crystal", name: "マナの結晶化", type: "passive", effect: "enhance_chance",
    values: [0.05, 0.1, 0.2], rarity: 1, price: 4,
    desc: "落下ドロップの[5/10/20]%が強化ドロップになる。",
    attributes: []
  },
  {
    id: "enhance_amp", name: "強化増幅", type: "passive", effect: "enhanced_orb_bonus",
    values: [2, 4, 6], rarity: 2, price: 8,
    desc: "強化1個あたりのコンボ加算を+[2/4/6]する。",
    attributes: []
  },
  {
    id: "over_link", name: "過剰結合", type: "passive", effect: "enhanced_link_multiplier",
    params: { count: 5 }, values: [2, 3, 5], rarity: 2, price: 9,
    desc: "強化5個以上を消したら倍率x[2/3/5]。",
    attributes: []
  },

  // --- パッシブ: 落ちコンボーナス ---
  {
    id: "bonus_skyfall", name: "天恵の追撃", type: "passive", effect: "skyfall_bonus",
    values: [5, 8, 12], rarity: 3, price: 8,
    desc: "落ちコン発生時にコンボ+[5/8/12]。",
    attributes: [],
    canBeCurseReward: true
  },

  // --- パッシブ: ボムドロップ ---
  {
    id: "bomb_erase_mult", name: "爆熱の余韻", type: "passive", effect: "bomb_erase_mult",
    values: [1.2, 1.3, 1.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "ボムの効果で消えたドロップ数 × [1.2/1.3/1.5] 倍、コンボ倍率に乗算される。",
    attributes: []
  },
  {
    id: "ignited_drop_fire", name: "爆炎の兆し", type: "passive", effect: "bomb_chance_color", params: { color: "fire" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 9,
    desc: "炎ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
    attributes: ["fire"]
  },
  {
    id: "ignited_drop_dark", name: "暗黒の兆し", type: "passive", effect: "bomb_chance_color", params: { color: "dark" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 9,
    desc: "月ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
    attributes: ["dark"]
  },

  // --- パッシブ: リピートドロップ ---
  {
    id: "repeat_combo_mult", name: "連鎖の共鳴", type: "passive", effect: "repeat_combo_mult",
    values: [1.3, 1.5, 2], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "リピートドロップの消去数 × [1.3/1.5/2] 倍、コンボ倍率に乗算される。",
    attributes: []
  },
  {
    id: "repeat_chance_water", name: "雨波の巡り", type: "passive", effect: "repeat_chance_color", params: { color: "water" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 7,
    desc: "雨ドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
    attributes: ["water"]
  },
  {
    id: "repeat_chance_heart", name: "生命の巡り", type: "passive", effect: "repeat_chance_color", params: { color: "heart" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 7,
    desc: "ハートドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
    attributes: ["heart"]
  },
  {
    id: "repeat_erase_combo", name: "反響する輪舞", type: "passive", effect: "repeat_erase_combo",
    values: [2, 3, 5], rarity: 3, price: 10,
    desc: "ターン中にリピートドロップが消えた数 × [2/3/5] コンボを加算する。",
    attributes: []
  },
  {
    id: "repeat_extra_activations", name: "無限の風霊", type: "passive", effect: "extra_repeat_activations",
    values: [1, 2, 3], rarity: 3, price: 9,
    desc: "リピートドロップ消去時、リピート効果が追加で[1/2/3]回発動する。",
    attributes: []
  },

  // --- パッシブ: スタードロップ ---
  {
    id: "star_chance_wood", name: "星宿る風", type: "passive", effect: "star_chance_color", params: { color: "wood" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 8,
    desc: "風ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
    attributes: ["wood"]
  },
  {
    id: "star_chance_light", name: "星宿る雷", type: "passive", effect: "star_chance_color", params: { color: "light" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 8,
    desc: "雷ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
    attributes: ["light"]
  },
  {
    id: "star_erase_mult", name: "星屑の共鳴", type: "passive", effect: "star_erase_mult",
    values: [0.5, 1.0, 1.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "ターン中にスタードロップが消えた数 × [0.5/1/1.5] 倍、コンボ倍率に乗算される。",
    attributes: []
  },
  {
    id: "star_earn_boost", name: "星の祝福", type: "passive", effect: "star_earn_boost",
    values: [3, 5, 8], rarity: 2, price: 8,
    desc: "スタードロップが消えた時にもらえるスター（通貨）の数が3/5/8個増える。",
    attributes: []
  },

  // --- パッシブ: 虹ドロップ ---
  {
    id: "rainbow_chance", name: "虹の呼び声", type: "passive", effect: "rainbow_chance",
    values: [0.02, 0.04, 0.07], rarity: 2, price: 8,
    desc: "ドロップが[2/4/7]%の確率で虹ドロップとして降ってくるようになる。",
    attributes: ["fire", "water", "wood", "light", "dark"]
  },
  {
    id: "rainbow_bridge", name: "虹の架け橋", type: "passive", effect: "rainbow_combo_bonus",
    values: [1, 2, 5], rarity: 3, price: 10,
    desc: "虹ドロップがコンボに関与した際、コンボ加算がさらに +[1/2/5] される。",
    attributes: ["fire", "water", "wood", "light", "dark"]
  },

  // --- パッシブ: トークン数・レベル依存 ---
  {
    id: "star1_combo_boost", name: "一星の共鳴", type: "passive", effect: "star_count_combo_add",
    params: { rarity: 1 }, values: [1, 2, 3], rarity: 2, price: 6,
    desc: "所持している★1トークン数 × [1/2/3]をコンボ数に加算する。",
    attributes: []
  },
  {
    id: "star2_time_boost", name: "二星の延刻", type: "passive", effect: "star_count_time_ext",
    params: { rarity: 2 }, values: [2, 3, 4], rarity: 2, price: 6,
    desc: "所持している★2トークン数 × [2/3/4]秒 操作時間を延長する。",
    attributes: []
  },
  {
    id: "star3_mult_boost", name: "三星の極雷", type: "passive", effect: "star_count_combo_mult",
    params: { rarity: 3 }, values: [1.2, 1.5, 2], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "所持している★3トークン数 × [1.2/1.5/2]倍 コンボ倍率を乗算する。",
    attributes: []
  },
  {
    id: "enchant_mult_boost", name: "魔導の共犯", type: "passive", effect: "enchant_count_combo_mult",
    values: [1.1, 1.2, 1.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "所持しているエンチャント数 × [1.1/1.2/1.5]倍 コンボ倍率を乗算する。",
    attributes: []
  },
  {
    id: "total_level_boost", name: "全霊の共鳴", type: "passive", effect: "total_level_combo_add",
    values: [1, 1.5, 2], rarity: 3, price: 12,
    desc: "所持しているトークンのレベル数の合計 × [1/1.5/2] をコンボ数に加算する。",
    attributes: []
  },
  {
    id: "level3_count_mult", name: "三魂の極致", type: "passive", effect: "level3_count_combo_mult",
    values: [1, 1.5, 2], maxMultipliers: [10, 20, 50], rarity: 3, price: 15,
    desc: "所持しているレベル3トークンの数 × [1/1.5/2] 倍 コンボ倍率を乗算する。",
    attributes: []
  },
  {
    id: "copy_token", name: "模倣の魔鏡", type: "passive", effect: "copy_left",
    values: [1], rarity: 3, price: 10,
    desc: "左隣のトークンの効果とエンチャントをコピーする。自身はレベルアップせず、エンチャントも付与されない。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "duration_booster", name: "刻の歯車", type: "passive", effect: "active_duration_boost",
    values: [1, 2, 3], rarity: 3, price: 15,
    desc: "効果手番があるアクティブスキルの持続時間を [+1/+2/+3] 手番延長する。",
    attributes: []
  },

  // --- パッシブ: 統計依存（コンボ・倍率）---
  {
    id: "memory_of_combo", name: "コンボの記憶", type: "passive", effect: "stat_combo_記憶",
    values: [1, 2, 3], rarity: 2, price: 6,
    desc: "現在のゲーム中の「最大コンボ数」5コンボにつき、常にコンボ加算 +[1/2/3]。",
    attributes: []
  },
  {
    id: "echo_of_max", name: "極大の余韻", type: "passive", effect: "stat_mult_余韻",
    values: [0.1, 0.2, 0.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 9,
    desc: "現在のゲーム中の「最大コンボ倍率」の[10/20/50]%を、常時コンボ倍率に乗算する。",
    attributes: []
  },
  {
    id: "thousand_arms", name: "千手観音", type: "passive", effect: "stat_mult_千手",
    values: [1.1, 1.2, 1.3], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "現在のゲーム中の「累計コンボ数」100ごとに、コンボ倍率が x[1.1/1.2/1.3] 上昇する。",
    attributes: []
  },

  // --- パッシブ: 統計依存（特殊消し）---
  {
    id: "seeker_of_cross", name: "十字の求道者", type: "passive", effect: "stat_shape_cross",
    values: [1, 2, 3], rarity: 2, price: 8,
    desc: "現在のゲーム中の「十字消し累計回数」5回につき、十字消しの際に追加でコンボ加算 +[1/2/3]。",
    attributes: []
  },
  {
    id: "seeker_of_len4", name: "四連の探求者", type: "passive", effect: "stat_shape_len4",
    values: [1, 2, 3], rarity: 2, price: 6,
    desc: "現在のゲーム中の「4個消し累計回数」20回につき、4個消しの際に追加でコンボ加算 +[1/2/3]。",
    attributes: []
  },
  {
    id: "polishing_claw", name: "鉤爪の研鑽", type: "passive", effect: "stat_shape_l",
    values: [1, 2, 3], rarity: 2, price: 5,
    desc: "現在のゲーム中の「L字消し累計回数」1回につき、このトークンの売却値が[1/2/3]上がる。",
    attributes: []
  },
  {
    id: "memory_of_flash", name: "一閃の記憶", type: "passive", effect: "stat_shape_row",
    values: [1.1, 1.3, 1.5], maxMultipliers: [10, 20, 50], rarity: 2, price: 9,
    desc: "現在のゲーム中の「横1列消し累計回数」5回につき、横1列消しのコンボ倍率が x[1.1/1.3/1.5] 上昇する。",
    attributes: []
  },
  {
    id: "artisan_of_square", name: "方陣の職人", type: "passive", effect: "stat_shape_square",
    values: [1.5, 2, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "現在のゲーム中の「四角消し累計回数」5回につき、コンボ倍率が x[1.5/2/4] 上昇する。",
    attributes: []
  },
  {
    id: "guide_of_fivestar", name: "五星の導き手", type: "passive", effect: "stat_shape_len5",
    values: [0.5, 1.0, 1.5], rarity: 2, price: 8,
    desc: "現在のゲーム中の「5個以上連結消し累計回数」10回につき、5個消しの次手操作時間が +[0.5/1.0/1.5]秒 される。",
    attributes: []
  },

  // --- パッシブ: 統計依存（リソース・進行）---
  {
    id: "pride_of_spendthrift", name: "浪費家の意地", type: "passive", effect: "stat_spend_star",
    values: [1.1, 1.2, 1.3], maxMultipliers: [10, 20, 50], rarity: 3, price: 10,
    desc: "現在のゲーム中の「累計消費スター数」50★につき、コンボ倍率 x[1.1/1.2/1.3] 上昇。",
    attributes: []
  },
  {
    id: "proof_of_veteran", name: "歴戦の証明", type: "passive", effect: "stat_progress_clear",
    values: [0.01, 0.02, 0.03], rarity: 3, price: 9,
    desc: "「現在のクリア回数」の進行ごとに、強化ドロップ確率が +[1/2/3]%。",
    attributes: []
  },
  {
    id: "end_of_thought", name: "熟考の果て", type: "passive", effect: "stat_time_move",
    values: [0.05, 0.1, 0.15], rarity: 2, price: 7,
    desc: "「合計操作時間」1分につき、目標達成後のスキップボーナス獲得量が +[5/10/15]%。",
    attributes: []
  },

  // --- パッシブ: ハイリスク・ハイリターン ---
  {
    id: "desperate_stance", name: "背水の陣", type: "passive", effect: "desperate_stance",
    values: [4, 6, 8], rarity: 3, price: 12,
    desc: "操作時間が常に4秒固定。最終コンボ倍率x[4/6/8]倍。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "greed_power", name: "金満の暴力", type: "passive", effect: "greed_power",
    values: [7, 5, 3], maxMultipliers: [10, 20, 50], rarity: 1, price: 10,
    desc: "★[20/15/10]個につきコンボ倍率+1加算。",
    attributes: []
  },
  {
    id: "picky_eater", name: "偏食家", type: "passive", effect: "picky_eater",
    params: { excludeColors: ["heart", "light", "dark"] },
    values: [-2, -1, 0], rarity: 3, price: 9,
    desc: "ハート/雷/月が出現しなくなる。手番[−2/−1/±0]。",
    attributes: ["heart", "light", "dark"]
  },
  {
    id: "cursed_power", name: "呪われた力", type: "passive", effect: "cursed_power",
    values: [15, 25, 40], rarity: 1, price: 10,
    desc: "常にコンボ+[15/25/40]。操作時間−3秒。",
    attributes: []
  },
  {
    id: "critical_passive",
    name: "会心の一撃",
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
    type: "passive",
    effect: "shape_variety_mult",
    values: [3, 4, 5],
    rarity: 2, price: 12,
    desc: "1ターンの間に異なる特殊消しを2種類以上発動させると、コンボ数x[3/4/5]倍。",
    attributes: []
  },
  {
    id: "zero_charge",
    name: "静寂の瞑想",
    type: "passive",
    effect: "zero_combo_charge",
    values: [3, 5, 7],
    rarity: 1, price: 9,
    desc: "0コンボの時、スキルのエネルギーを[3/5/7]チャージする。",
    attributes: []
  },
  {
    id: "random_add",
    name: "気まぐれなダイス",
    type: "passive",
    effect: "random_add",
    values: [
      [0, 1, 2, 3, 4, 5, 10],
      [0, 2, 4, 6, 8, 10, 30],
      [0, 3, 6, 9, 12, 15, 100]
    ],
    rarity: 2, price: 6,
    desc: "コンボ加算にランダムな値を追加する",
    attributes: []
  },
  {
    id: "contract_of_void", name: "虚無の契約", type: "passive", effect: "contract_of_void",
    values: [3, 4, 5], rarity: 3, price: 12,
    desc: "全エンチャント効果が無効になる代わりに、コンボ倍率が常にx[3/4/5]倍になる。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "limit_breaker", name: "神ノ理", type: "passive", effect: "limit_break",
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
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "1サイクルの手番が1減る。",
    conditionDesc: "5サイクル分クリアする",
    condition: "clears",
    targetValue: 5,
    attributes: []
  },
  {
    id: "curse_heart",
    name: "絶望の癒し",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "ハートドロップを消してもコンボが増えなくなる。",
    conditionDesc: "ハートドロップを30個消す",
    condition: "heart_erase",
    targetValue: 30,
    attributes: ["heart"]
  },
  {
    id: "curse_time",
    name: "焦燥の刻印",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "操作時間が4秒固定になる。",
    conditionDesc: "累計50コンボする",
    condition: "total_combo",
    targetValue: 50,
    attributes: []
  },
  {
    id: "curse_skyfall",
    name: "静寂の呪縛",
    type: "curse",
    effect: "forbidden",
    values: [1, 1, 1],
    rarity: 1,
    price: 0,
    isLocked: true,
    desc: "常時落ちコンが発生しなくなる。条件達成まで売却不可。",
    conditionDesc: "累計50スター獲得する",
    attributes: [],
    condition: "total_stars",
    targetValue: 50,
  },
  {
    id: "curse_half",
    name: "脆弱の断層",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "コンボ数が半分になる（倍率0.5）。",
    conditionDesc: "1手番で30コンボ達成する",
    condition: "max_combo",
    targetValue: 30,
    attributes: []
  },
  {
    id: "curse_init",
    name: "無の対価",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "初期スターが0になり、スター獲得に必要なコンボ数が1増える。",
    conditionDesc: "トークンを累計5つ売却する",
    condition: "tokens_sold",
    targetValue: 5,
    attributes: []
  },
  {
    id: "curse_double_target",
    name: "倍加の呪い",
    type: "curse",
    rarity: 0,
    price: 0,
    isLocked: true,
    desc: "1サイクルの目標値が2倍になる。",
    conditionDesc: "スキップを3回行う",
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
];

export { ALL_TOKEN_BASES };
