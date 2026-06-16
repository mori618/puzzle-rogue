const ALL_TOKEN_BASES = [
  // ==========================================
  // ★ スキル
  // ==========================================

  // --- スキル: 変換（1色→1色）---
  { id: "fired", name: "焔変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "wood", to: "fire" }, rarity: 1, price: 5, desc: "風を炎に変換。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "waterd", name: "氷変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "water" }, rarity: 1, price: 5, desc: "炎を雨に変換。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "woodd", name: "嵐変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "water", to: "wood" }, rarity: 1, price: 5, desc: "雨を風に変換。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "lightd", name: "雷変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "dark", to: "light" }, rarity: 1, price: 5, desc: "月を雷に変換。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "darkd", name: "影変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "light", to: "dark" }, rarity: 1, price: 5, desc: "雷を月に変換。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "heartd", name: "癒変換", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "heart" }, rarity: 1, price: 5, desc: "炎をハートに変換。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "conv_h_f", name: "癒の劫炎", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "fire" }, rarity: 1, price: 5, desc: "ハートを炎に変換。消費E:{cost}", attributes: ["fire", "heart"], canBeInitial: true },
  { id: "conv_h_w", name: "癒の奔流", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "water" }, rarity: 1, price: 5, desc: "ハートを雨に変換。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "conv_h_g", name: "癒の深風", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "wood" }, rarity: 1, price: 5, desc: "ハートを風に変換。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "conv_h_l", name: "癒の聖雷", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "light" }, rarity: 1, price: 5, desc: "ハートを雷に変換。消費E:{cost}", attributes: ["light", "heart"], canBeInitial: true },
  { id: "conv_h_d", name: "癒の呪法", icon: "swap_horiz", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "dark" }, rarity: 1, price: 5, desc: "ハートを月に変換。消費E:{cost}", attributes: ["dark", "heart"], canBeInitial: true },

  // --- スキル: 消滅（1色を全消去） ---
  {
    id: "erase_fire",
    name: "焔の消滅",
    icon: "delete_forever",
    type: "skill",
    cost: 1,
    costLevels: false,
    action: "erase_color",
    params: { color: "fire" },
    values: [1, 2, 3],
    effectValues: [3, 4, 5],
    rarity: 3,
    price: 31,
    desc: "盤面上の炎ドロップを全て削除し、削除分コンボ追加（特殊は2倍、Lvに応じて1/2/3倍）。累計30個消去ごとに、盤面を全てプラス炎にし1ターン基礎コンボを[3/4/5]倍にする。消費E:{cost}",
    attributes: ["fire"]
  },
  {
    id: "erase_water",
    name: "雨の消滅",
    icon: "delete_forever",
    type: "skill",
    cost: 1,
    costLevels: false,
    action: "erase_color",
    params: { color: "water" },
    values: [1, 2, 3],
    effectValues: [3, 4, 5],
    rarity: 3,
    price: 31,
    desc: "盤面上の雨ドロップを全て削除し、削除分コンボ追加（特殊は2倍、Lvに応じて1/2/3倍）。累計30個消去ごとに、盤面を全てプラス雨にしリピートドロップを[3/4/5]個生成する。消費E:{cost}",
    attributes: ["water"]
  },
  {
    id: "erase_wood",
    name: "風の消滅",
    icon: "delete_forever",
    type: "skill",
    cost: 1,
    costLevels: false,
    action: "erase_color",
    params: { color: "wood" },
    values: [1, 2, 3],
    effectValues: [2, 2.5, 3],
    rarity: 3,
    price: 31,
    desc: "盤面上の風ドロップを全て削除し、削除分コンボ追加（特殊は2倍、Lvに応じて1/2/3倍）。累計30個消去ごとに、盤面を全てプラス風にし所持スター数を[2/2.5/3]倍にする。消費E:{cost}",
    attributes: ["wood"]
  },
  {
    id: "erase_light",
    name: "雷の消滅",
    icon: "delete_forever",
    type: "skill",
    cost: 1,
    costLevels: false,
    action: "erase_color",
    params: { color: "light" },
    values: [1, 2, 3],
    effectValues: [3, 4, 5],
    rarity: 3,
    price: 31,
    desc: "盤面上の雷ドロップを全て削除し、削除分コンボ追加（特殊は2倍、Lvに応じて1/2/3倍）。累計30個消去ごとに、盤面を全てプラス雷にしランダムなトークンを[3/4/5]個レベルアップする。消費E:{cost}",
    attributes: ["light"]
  },
  {
    id: "erase_dark",
    name: "月の消滅",
    icon: "delete_forever",
    type: "skill",
    cost: 1,
    costLevels: false,
    action: "erase_color",
    params: { color: "dark" },
    values: [1, 2, 3],
    effectValues: [1, 2, 3],
    rarity: 3,
    price: 31,
    desc: "盤面上の月ドロップを全て削除し、削除分コンボ追加（特殊は2倍、Lvに応じて1/2/3倍）。累計30個消去ごとに、盤面を全てプラス月にしサイクルの手番を[+1/+2/+3]回する。消費E:{cost}",
    attributes: ["dark"]
  },

  // --- スキル: 整理（1色を上部へ） ---
  { id: "org_fire", name: "焔の整理", icon: "sort", type: "skill", cost: 3, costLevels: true, action: "organize_color", params: { color: "fire" }, rarity: 1, price: 9, desc: "盤面上の炎ドロップを左上から順に整列させる。他のドロップは下・右に詰める。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: ["fire"], canBeInitial: true },
  { id: "org_water", name: "雨の整理", icon: "sort", type: "skill", cost: 3, costLevels: true, action: "organize_color", params: { color: "water" }, rarity: 1, price: 9, desc: "盤面上の雨ドロップを左上から順に整列させる。他のドロップは下・右に詰める。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: ["water"], canBeInitial: true },
  { id: "org_wood", name: "風の整理", icon: "sort", type: "skill", cost: 3, costLevels: true, action: "organize_color", params: { color: "wood" }, rarity: 1, price: 9, desc: "盤面上の風ドロップを左上から順に整列させる。他のドロップは下・右に詰める。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: ["wood"], canBeInitial: true },
  { id: "org_light", name: "雷の整理", icon: "sort", type: "skill", cost: 3, costLevels: true, action: "organize_color", params: { color: "light" }, rarity: 1, price: 9, desc: "盤面上の雷ドロップを左上から順に整列させる。他のドロップは下・右に詰める。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: ["light"], canBeInitial: true },
  { id: "org_dark", name: "月の整理", icon: "sort", type: "skill", cost: 3, costLevels: true, action: "organize_color", params: { color: "dark" }, rarity: 1, price: 9, desc: "盤面上の月ドロップを左上から順に整列させる。他のドロップは下・右に詰める。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: ["dark"], canBeInitial: true },
  { id: "org_heart", name: "癒の整理", icon: "sort", type: "skill", cost: 3, costLevels: true, action: "organize_color", params: { color: "heart" }, rarity: 1, price: 9, desc: "盤面上のハートドロップを左上から順に整列させる。他のドロップは下・右に詰める。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: ["heart"], canBeInitial: true },

  // --- スキル: 多色変換（2色→1色）---
  { id: "conv_m_fd_w", name: "業水の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "water" }, rarity: 1, price: 9, desc: "炎と月を雨に変換。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "conv_m_fd_l", name: "炎雷の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "light" }, rarity: 1, price: 9, desc: "炎と月を雷に変換。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "conv_m_wh_f", name: "紅蓮の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "fire" }, rarity: 1, price: 9, desc: "雨とハートを炎に変換。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "conv_m_wh_g", name: "蒼風の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "wood" }, rarity: 1, price: 9, desc: "雨とハートを風に変換。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "conv_m_gl_d", name: "神緑の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "dark" }, rarity: 1, price: 9, desc: "風と雷を月に変換。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "conv_m_gl_h", name: "天恵の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "heart" }, rarity: 1, price: 9, desc: "風と雷をハートに変換。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "conv_m_fw_g", name: "天地の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water"], to: "wood" }, rarity: 1, price: 9, desc: "炎と雨を風に変換。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "conv_m_ld_h", name: "黄昏の洗礼", icon: "swap_vert", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "heart" }, rarity: 1, price: 9, desc: "雷と月をハートに変換。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: 複合ペア変換（2色→それぞれ別色へ）---
  {
    id: "conv_p_harmony",
    name: "大自然の調和",
    icon: "swap_horiz",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "convert_pair",
    params: { mapping: { fire: "wood", water: "heart" } },
    rarity: 2,
    price: 15,
    desc: "炎ドロップを風に、雨ドロップをハートに同時に変換する。消費E:{cost}",
    attributes: ["wood", "heart"],
    canBeInitial: true
  },
  {
    id: "conv_p_reversal",
    name: "大自然の逆流",
    icon: "swap_horiz",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "convert_pair",
    params: { mapping: { wood: "fire", heart: "water" } },
    rarity: 2,
    price: 15,
    desc: "風ドロップを炎に、ハートドロップを雨に同時に変換する。消費E:{cost}",
    attributes: ["fire", "water"],
    canBeInitial: true
  },
  {
    id: "conv_p_chaos",
    name: "混沌の反転",
    icon: "swap_horiz",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "convert_pair",
    params: { mapping: { light: "heart", dark: "fire" } },
    rarity: 2,
    price: 15,
    desc: "雷ドロップをハートに、月ドロップを炎に同時に変換する。消費E:{cost}",
    attributes: ["heart", "fire"],
    canBeInitial: true
  },
  {
    id: "conv_p_order",
    name: "秩序の光",
    icon: "swap_horiz",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "convert_pair",
    params: { mapping: { heart: "light", fire: "dark" } },
    rarity: 2,
    price: 15,
    desc: "ハートドロップを雷に、炎ドロップを月に同時に変換する。消費E:{cost}",
    attributes: ["light", "dark"],
    canBeInitial: true
  },
  {
    id: "conv_p_flux",
    name: "星光の流転",
    icon: "swap_horiz",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "convert_pair",
    params: { mapping: { fire: "water", dark: "light" } },
    rarity: 2,
    price: 15,
    desc: "炎ドロップを雨に、月ドロップを雷に同時に変換する。消費E:{cost}",
    attributes: ["water", "light"],
    canBeInitial: true
  },
  {
    id: "conv_p_erosion",
    name: "影月の侵食",
    icon: "swap_horiz",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "convert_pair",
    params: { mapping: { water: "fire", light: "dark" } },
    rarity: 2,
    price: 15,
    desc: "雨ドロップを炎に、雷ドロップを月に同時に変換する。消費E:{cost}",
    attributes: ["fire", "dark"],
    canBeInitial: true
  },

  // --- スキル: 盤面変更（3色）---
  { id: "board_tri_fdw", name: "三色の真理・業水", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "water"] }, rarity: 1, price: 9, desc: "盤面を炎/月/雨に変更。消費E:{cost}", attributes: ["fire", "dark", "water"], canBeInitial: true },
  { id: "board_tri_fdl", name: "三色の真理・炎光", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "light"] }, rarity: 1, price: 9, desc: "盤面を炎/月/雷に変更。消費E:{cost}", attributes: ["fire", "dark", "light"], canBeInitial: true },
  { id: "board_tri_whf", name: "三色の真理・紅蓮", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "fire"] }, rarity: 1, price: 9, desc: "盤面を雨/ハート/炎に変更。消費E:{cost}", attributes: ["water", "heart", "fire"], canBeInitial: true },
  { id: "board_tri_whg", name: "三色の真理・蒼木", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "wood"] }, rarity: 1, price: 9, desc: "盤面を雨/ハート/風に変更。消費E:{cost}", attributes: ["water", "heart", "wood"], canBeInitial: true },
  { id: "board_tri_gld", name: "三色の真理・神緑", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "dark"] }, rarity: 1, price: 9, desc: "盤面を風/雷/月に変更。消費E:{cost}", attributes: ["wood", "light", "dark"], canBeInitial: true },
  { id: "board_tri_glh", name: "三色の真理・天恵", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "heart"] }, rarity: 1, price: 9, desc: "盤面を風/雷/ハートに変更。消費E:{cost}", attributes: ["wood", "light", "heart"], canBeInitial: true },
  { id: "board_tri_fwg", name: "三色の真理・天地", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "wood"] }, rarity: 1, price: 9, desc: "盤面を炎/雨/風に変更。消費E:{cost}", attributes: ["fire", "water", "wood"], canBeInitial: true },
  { id: "board_tri_ldh", name: "三色の真理・黄昏", icon: "grid_on", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "dark", "heart"] }, rarity: 1, price: 9, desc: "盤面を雷/月/ハートに変更。消費E:{cost}", attributes: ["light", "dark", "heart"], canBeInitial: true },

  // --- スキル: 盤面変更（2色）---
  { id: "board_bi_fd", name: "炎月の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark"] }, rarity: 1, price: 10, desc: "盤面を炎/月の2色に変更。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "board_bi_wh", name: "蒼海の至宝", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart"] }, rarity: 1, price: 10, desc: "盤面を雨/ハートの2色に変更。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "board_bi_gl", name: "風雷の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light"] }, rarity: 1, price: 10, desc: "盤面を風/雷の2色に変更。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "board_bi_wd", name: "雨月の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "dark"] }, rarity: 1, price: 10, desc: "盤面を雨/月の2色に変更。消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "board_bi_gh", name: "風癒の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "heart"] }, rarity: 1, price: 10, desc: "盤面を風/ハートの2色に変更。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "board_bi_fl", name: "炎雷の陣", icon: "grid_view", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "light"] }, rarity: 1, price: 10, desc: "盤面を炎/雷の2色に変更。消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: 盤面変更（1色）---
  { id: "board_mono1", name: "真・紅蓮の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["fire"] }, rarity: 2, price: 15, desc: "盤面すべてを炎に変更。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "board_mono2", name: "真・閃雷の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["light"] }, rarity: 2, price: 15, desc: "盤面すべてを雷に変更。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "board_mono3", name: "真・蒼海の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["water"] }, rarity: 2, price: 15, desc: "盤面すべてを雨に変更。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "board_mono4", name: "真・深翠の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["wood"] }, rarity: 2, price: 15, desc: "盤面すべてを風に変更。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "board_mono5", name: "真・常月の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["dark"] }, rarity: 2, price: 15, desc: "盤面すべてを月に変更。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "board_mono6", name: "真・生命の極致", icon: "apps", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["heart"] }, rarity: 2, price: 15, desc: "盤面すべてをハートに変更。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: 5属性均等配置 ---
  { id: "board_bal_5", name: "五行の理", icon: "balance", type: "skill", cost: 5, costLevels: true, action: "board_balance", rarity: 2, price: 14, desc: "全ドロップを5属性各6個に変化させる。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeInitial: true },

  // --- スキル: 行・列固定変換 ---
  { id: "row_f", name: "烈炎の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "fire" }, rarity: 1, price: 9, desc: "上段をすべて炎に。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "row_w", name: "清流の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "water" }, rarity: 1, price: 9, desc: "上段をすべて雨に。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "row_g", name: "深翠の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "wood" }, rarity: 1, price: 9, desc: "上段をすべて風に。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "row_l", name: "閃雷の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "light" }, rarity: 1, price: 9, desc: "上段をすべて雷に。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "row_d", name: "常月の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "dark" }, rarity: 1, price: 9, desc: "上段をすべて月に。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "row_h", name: "生命の横一文字", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "heart" }, rarity: 1, price: 9, desc: "上段をすべてハートに。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "row_b_f", name: "烈炎の底陣", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: -1, type: "fire" }, rarity: 1, price: 9, desc: "下段をすべて炎に。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "row_c_h", name: "生命の帯", icon: "view_stream", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: "center", type: "heart" }, rarity: 1, price: 9, desc: "中央行をすべてハートに。消費E:{cost}", attributes: ["heart"], canBeInitial: true },
  { id: "col_l_l", name: "閃雷の縦一閃", icon: "view_column", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: 0, type: "light" }, rarity: 1, price: 9, desc: "左端列をすべて雷に。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "col_r_d", name: "常月の縦一閃", icon: "view_column", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: -1, type: "dark" }, rarity: 1, price: 9, desc: "右端列をすべて月に。消費E:{cost}", attributes: ["dark"], canBeInitial: true },

  // --- スキル: ドロップ強化（1色）---
  { id: "enh_f", name: "星の導き・炎", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["fire"] }, rarity: 1, price: 10, desc: "盤面の炎を全て強化。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "enh_w", name: "星の導き・雨", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["water"] }, rarity: 1, price: 10, desc: "盤面の雨を全て強化。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "enh_g", name: "星の導き・風", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["wood"] }, rarity: 1, price: 10, desc: "盤面の風を全て強化。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "enh_l", name: "星の導き・雷", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["light"] }, rarity: 1, price: 10, desc: "盤面の雷を全て強化。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "enh_d", name: "星の導き・月", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["dark"] }, rarity: 1, price: 10, desc: "盤面の月を全て強化。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "enh_h", name: "星の導き・ハート", icon: "auto_fix_high", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["heart"] }, rarity: 1, price: 10, desc: "盤面のハートを全て強化。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: ドロップ強化（2色）---
  { id: "enh_fd", name: "星の導き・炎月", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "dark"] }, rarity: 2, price: 14, desc: "盤面の炎/月を全て強化。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "enh_wh", name: "星の導き・雨癒", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "heart"] }, rarity: 2, price: 14, desc: "盤面の雨/ハートを全て強化。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "enh_gl", name: "星の導き・風雷", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "light"] }, rarity: 2, price: 14, desc: "盤面の風/雷を全て強化。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "enh_wd", name: "星の導き・雨月", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "dark"] }, rarity: 2, price: 14, desc: "盤面の雨/月を全て強化. 消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "enh_gh", name: "星の導き・風癒", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "heart"] }, rarity: 2, price: 14, desc: "盤面の風/ハートを全て強化. 消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "enh_fl", name: "星の導き・炎雷", icon: "auto_fix_high", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "light"] }, rarity: 2, price: 14, desc: "盤面の炎/雷を全て強化. 消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: ランダム生成 ---
  { id: "gen_rand_fire", name: "炎の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "fire", count: 5 }, rarity: 1, price: 5, desc: "炎ドロップをランダムに5個生成。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "gen_rand_water", name: "雨の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "water", count: 5 }, rarity: 1, price: 5, desc: "雨ドロップをランダムに5個生成。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "gen_rand_wood", name: "森の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "wood", count: 5 }, rarity: 1, price: 5, desc: "風ドロップをランダムに5個生成。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "gen_rand_light", name: "雷の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "light", count: 5 }, rarity: 1, price: 5, desc: "雷ドロップをランダムに5個生成。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "gen_rand_dark", name: "月の創造", icon: "flare", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "dark", count: 5 }, rarity: 1, price: 5, desc: "月ドロップをランダムに5個生成。消費E:{cost}", attributes: ["dark"], canBeInitial: true },

  // --- スキル: ボムドロップ生成 ---
  { id: "gen_bomb_rand", name: "ボム", icon: "emergency", type: "skill", cost: 3, costLevels: true, action: "spawn_bomb_random", params: { count: 1 }, rarity: 1, price: 5, desc: "ランダムなドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [3, 2, 1], attributes: [], canBeInitial: true },
  { id: "conv_bomb_target_fire", name: "炎の火薬", icon: "emergency", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "fire" }, rarity: 2, price: 9, desc: "炎ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2], attributes: ["fire"], canBeInitial: true },
  { id: "conv_bomb_target_dark", name: "月の火薬", icon: "emergency", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "dark" }, rarity: 2, price: 9, desc: "月ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2], attributes: ["dark"], canBeInitial: true },

  // --- スキル: スカイフォール強化（1色）---
  { id: "sky_f1", name: "紅蓮の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 3, duration: 3 }, rarity: 1, price: 9, desc: "3手番、炎がかなり落ちやすくなる。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "sky_w1", name: "蒼海の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 3, duration: 3 }, rarity: 1, price: 9, desc: "3手番、雨がかなり落ちやすくなる。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "sky_g1", name: "深翠の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 3, duration: 3 }, rarity: 1, price: 9, desc: "3手番、風がかなり落ちやすくなる。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "sky_l1", name: "閃雷の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 3, duration: 3 }, rarity: 1, price: 9, desc: "3手番、雷がかなり落ちやすくなる。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "sky_d1", name: "常月の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 3, duration: 3 }, rarity: 1, price: 9, desc: "3手番、月がかなり落ちやすくなる。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "sky_h1", name: "癒の目覚め", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 3, duration: 3 }, rarity: 1, price: 9, desc: "3手番、ハートがかなり落ちやすくなる。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: スカイフォール強化（2色）---
  { id: "sky_fd_2", name: "炎月の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 2, duration: 2 }, rarity: 1, price: 9, desc: "2手番、炎と月が落ちやすくなる。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "sky_wh_2", name: "蒼海の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 2, duration: 2 }, rarity: 1, price: 9, desc: "2手番、雨とハートが落ちやすくなる。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "sky_gl_2", name: "風雷の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 2, duration: 2 }, rarity: 1, price: 9, desc: "2手番、風と雷が落ちやすくなる。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "sky_wd_2", name: "雨月の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 2, duration: 2 }, rarity: 1, price: 9, desc: "2手番、雨と月が落ちやすくなる。消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "sky_gh_2", name: "風癒の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 2, duration: 2 }, rarity: 1, price: 9, desc: "2手番、風とハートが落ちやすくなる。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "sky_fl_2", name: "炎雷の波紋", icon: "keyboard_double_arrow_down", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 2, duration: 2 }, rarity: 1, price: 9, desc: "2手番、炎と雷が落ちやすくなる. 消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: スカイフォール停止（1色）---
  { id: "sky_f_stop", name: "紅蓮の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 0, duration: 2 }, rarity: 1, price: 9, desc: "2手番、炎が落ちてこなくなる。消費E:{cost}", attributes: ["fire"], canBeInitial: true },
  { id: "sky_w_stop", name: "蒼海の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 0, duration: 2 }, rarity: 1, price: 9, desc: "2手番、雨が落ちてこなくなる。消費E:{cost}", attributes: ["water"], canBeInitial: true },
  { id: "sky_g_stop", name: "深翠の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 0, duration: 2 }, rarity: 1, price: 9, desc: "2手番、風が落ちてこなくなる。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "sky_l_stop", name: "閃雷の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 0, duration: 2 }, rarity: 1, price: 9, desc: "2手番、雷が落ちてこなくなる。消費E:{cost}", attributes: ["light"], canBeInitial: true },
  { id: "sky_d_stop", name: "常月の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 0, duration: 2 }, rarity: 1, price: 9, desc: "2手番、月が落ちてこなくなる。消費E:{cost}", attributes: ["dark"], canBeInitial: true },
  { id: "sky_h_stop", name: "癒の静寂", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 0, duration: 2 }, rarity: 1, price: 9, desc: "2手番、ハートが落ちてこなくなる。消費E:{cost}", attributes: ["heart"], canBeInitial: true },

  // --- スキル: スカイフォール停止（2色）---
  { id: "sky_fd_stop", name: "炎月の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 0, duration: 1 }, rarity: 1, price: 9, desc: "1手番、炎と月が落ちてこなくなる。消費E:{cost}", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "sky_wh_stop", name: "蒼海の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 0, duration: 1 }, rarity: 1, price: 9, desc: "1手番、雨とハートが落ちてこなくなる。消費E:{cost}", attributes: ["water", "heart"], canBeInitial: true },
  { id: "sky_gl_stop", name: "風雷の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 0, duration: 1 }, rarity: 1, price: 9, desc: "1手番、風と雷が落ちてこなくなる。消費E:{cost}", attributes: ["wood", "light"], canBeInitial: true },
  { id: "sky_wd_stop", name: "雨月の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 0, duration: 1 }, rarity: 1, price: 9, desc: "1手番、雨と月が落ちてこなくなる。消費E:{cost}", attributes: ["water", "dark"], canBeInitial: true },
  { id: "sky_gh_stop", name: "風癒の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 0, duration: 1 }, rarity: 1, price: 9, desc: "1手番、風とハートが落ちてこなくなる。消費E:{cost}", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "sky_fl_stop", name: "炎雷の凪", icon: "cloud_off", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 0, duration: 1 }, rarity: 1, price: 9, desc: "1手番、炎と雷が落ちてこなくなる. 消費E:{cost}", attributes: ["fire", "light"], canBeInitial: true },

  // --- スキル: スカイフォール色制限 ---
  { id: "sky_limit", name: "三色の結界", icon: "filter_list", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["fire", "water", "wood"], duration: 3 }, rarity: 1, price: 10, desc: "3手番、炎/雨/風しか落ちてこなくなる。消費E:{cost}", attributes: ["fire", "water", "wood"], canBeInitial: true },
  { id: "sky_limit_ldh", name: "三界の結界", icon: "filter_list", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["light", "dark", "heart"], duration: 3 }, rarity: 1, price: 10, desc: "3手番、雷/月/ハートしか落ちてこなくなる。消費E:{cost}", attributes: ["light", "dark", "heart"], canBeInitial: true },

  // --- スキル: リピートドロップ生成 ---
  { id: "gen_repeat_rand", name: "リピート", icon: "autorenew", type: "skill", cost: 3, costLevels: true, action: "spawn_repeat", params: { count: 1 }, rarity: 1, price: 14, desc: "ランダムなドロップ1つをリピートドロップにする。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "conv_repeat_water", name: "雨の輪廻", icon: "autorenew", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "water" }, rarity: 2, price: 24, desc: "ランダムな雨ドロップ2つをリピートドロップにする。消費E:{cost}", attributes: ["water"], canBeCurseReward: true },
  { id: "conv_repeat_heart", name: "生命の輪廻", icon: "autorenew", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "heart" }, rarity: 2, price: 24, desc: "ランダムなハートドロップ2つをリピートドロップにする。消費E:{cost}", attributes: ["heart"], canBeCurseReward: true },

  // --- スキル: スタードロップ生成 ---
  { id: "gen_star_rand", name: "スター", icon: "stars", type: "skill", cost: 3, costLevels: true, action: "spawn_star", params: { count: 5 }, rarity: 1, price: 15, desc: "ランダムなドロップ5つをスタードロップにする。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "conv_star_wood", name: "星降る森", icon: "stars", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "wood" }, rarity: 2, price: 24, desc: "風ドロップを全てスタードロップにする。消費E:{cost}", attributes: ["wood"], canBeInitial: true },
  { id: "conv_star_light", name: "星降る雷", icon: "stars", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "light" }, rarity: 2, price: 24, desc: "雷ドロップをすべてスタードロップにする。消費E:{cost}", attributes: ["light"], canBeInitial: true },

  // --- スキル: 虹ドロップ生成 ---
  // { id: "gen_rainbow_rand", name: "虹の創造", icon: "palette", type: "skill", cost: 2, costLevels: true, action: "spawn_rainbow", params: { count: 1 }, rarity: 1, price: 15, desc: "ランダムなドロップ1つをカウント3の虹ドロップにする。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeInitial: true },
  // { id: "rainbow_masterx", name: "虹の極致", icon: "palette", type: "skill", cost: 5, costLevels: true, action: "rainbow_master", params: { count: 1, to: 5 }, rarity: 3, price: 31, desc: "ランダムに虹ドロップを1つ生成し、盤面の全ての虹ドロップのカウントを5にする。消費E:{cost}", attributes: ["fire", "water", "wood", "light", "dark"], canBeCurseReward: true },

  // --- スキル: 特殊（時間・倍率・チャージ・再落下・ムーブドロップ）---
  {
    id: "move_drop_add_active",
    name: "カウント追加",
    icon: "fast_forward",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "move_drop_add",
    rarity: 2, price: 24,
    desc: "盤面にあるすべてのムーブドロップのカウントを+20する。消費E:{cost}",
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
    rarity: 1, price: 5,
    desc: "盤面を全消去する。消費E:{cost}",
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
    rarity: 1, price: 9,
    desc: "他のスキルのエネルギーを{values}チャージ。消費E:{cost}",
    attributes: [],
    canBeInitial: true
  },
  { id: "time_burst", name: "タイム・バースト", icon: "timer", type: "skill", cost: 3, action: "op_time_boost", params: { extraTime: 5000, duration: 3 }, rarity: 1, price: 14, desc: "3ターンの間、操作時間+5秒。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "eternal_moment", name: "エターナル・モーメント", icon: "timer", type: "skill", cost: 3, action: "op_time_boost", params: { extraTime: 10000, duration: 2 }, rarity: 1, price: 14, desc: "2ターンの間、操作時間+10秒。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "chronos_master", name: "クロノス・マスター", icon: "timer", type: "skill", cost: 3, action: "op_time_boost", params: { extraTime: 20000, duration: 1 }, rarity: 1, price: 14, desc: "1ターンの間、操作時間+20秒。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "active_mult_1", name: "覚醒の鼓動", icon: "trending_up", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 2, duration: 3 }, rarity: 2, price: 15, desc: "3手番、基礎コンボ数が2倍になる。消費E:{cost}", attributes: [], canBeInitial: true },
  { id: "active_mult_2", name: "一刃の極意", icon: "trending_up", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 5, duration: 1 }, rarity: 3, price: 26, desc: "1手番、基礎コンボ数が5倍になる。消費E:{cost}", attributes: [] },
  { id: "seal_of_power", name: "力の封印", icon: "dangerous", type: "skill", cost: 6, costLevels: true, action: "seal_of_power", params: { multiplier: 7, duration: 1 }, rarity: 3, price: 26, desc: "1手番、全エンチャント効果が無効になるが、基礎コンボ数が7倍になる。消費E:{cost}", attributes: [] },
  { id: "trial", name: "試練", icon: "offline_bolt", type: "skill", cost: 6, action: "trial_stage", params: { duration: 1 }, rarity: 3, price: 26, desc: "1手番プラス。使用後1ターン、特殊ドロップ・トークン・エンチャント効果が発動しない。このターンに8コンボ以上すると、ターン終了時に全ドロップがスタープラスリピート化、1ターン全てのトークン効果が2度発動＆確率系トークンの確率が+100%。消費E:{cost}", attributes: [] },
  { id: "gen_token_s1", name: "一星の招来", icon: "auto_awesome", type: "skill", cost: 3, action: "spawn_token_s1", rarity: 1, price: 14, desc: "自身以外のランダムな★1トークンを1つ生成する。消費E:{cost}", attributes: [] },
  { id: "gen_token_s2", name: "二星の招来", icon: "auto_awesome", type: "skill", cost: 5, action: "spawn_token_s2", rarity: 2, price: 20, desc: "自身以外のランダムな★2トークンを1つ生成する。消費E:{cost}", attributes: [] },
  { id: "gen_token_s3", name: "三星の代償", icon: "auto_awesome", type: "skill", cost: 6, action: "spawn_token_s3", rarity: 3, price: 31, desc: "ランダムな★3トークンを1つ生成する。30%の確率で呪いトークンが生成される。消費E:{cost}", attributes: [] },
  { id: "skill_levelup", name: "飛躍の輝き", icon: "upgrade", type: "skill", cost: 6, action: "random_levelup", rarity: 2, price: 20, desc: "自身以外のランダムなトークンを1つ選び、レベルアップさせる（最大Lv3）。消費E:{cost}", attributes: [], canBeInitial: true },
  {
    id: "active_double_probability",
    name: "確率の共鳴",
    icon: "insights",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "double_probability",
    params: { duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、確率系トークンの発動確率を2倍にする。消費E:{cost}",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "active_force_trigger",
    name: "因果の集約",
    icon: "flare",
    type: "skill",
    cost: 5,
    costLevels: true,
    action: "force_trigger_probabilities",
    params: { duration: 1 },
    rarity: 3,
    price: 31,
    desc: "このターン終了時、全ての確率系トークンを100%発動させる。消費E:{cost}",
    attributes: [],
    canBeInitial: true
  },
  // --- スキル: ターン終了時変換・生成（誓約） ---
  {
    id: "active_turn_end_spawn_f_5",
    name: "焦熱の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_spawn",
    params: { color: "fire", count: 3, duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2手番の間、ターン終了時に炎ドロップをランダムに3個生成する。消費E:{cost}",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "active_turn_end_spawn_w_5",
    name: "波濤の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_spawn",
    params: { color: "water", count: 3, duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2手番の間、ターン終了時に雨ドロップをランダムに3個生成する。消費E:{cost}",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "active_turn_end_spawn_g_5",
    name: "薫風の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_spawn",
    params: { color: "wood", count: 3, duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2手番の間、ターン終了時に風ドロップをランダムに3個生成する。消費E:{cost}",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "active_turn_end_spawn_l_5",
    name: "迅雷の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_spawn",
    params: { color: "light", count: 3, duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2手番の間、ターン終了時に雷ドロップをランダムに3個生成する。消費E:{cost}",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "active_turn_end_spawn_d_5",
    name: "常闇の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_spawn",
    params: { color: "dark", count: 3, duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2手番の間、ターン終了時に月ドロップをランダムに3個生成する。消費E:{cost}",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "active_turn_end_spawn_h_5",
    name: "豊穣の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_spawn",
    params: { color: "heart", count: 3, duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2手番の間、ターン終了時にハートドロップをランダムに3個生成する。消費E:{cost}",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "active_convert_g_f",
    name: "嵐炎の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_convert",
    params: { from: "wood", to: "fire", duration: 3 },
    rarity: 2,
    price: 15,
    desc: "3手番の間、ターン終了時に風を炎に変換する。消費E:{cost}",
    attributes: ["wood", "fire"],
    canBeInitial: true
  },
  {
    id: "active_convert_f_w",
    name: "炎雨の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_convert",
    params: { from: "fire", to: "water", duration: 3 },
    rarity: 2,
    price: 15,
    desc: "3手番の間、ターン終了時に炎を雨に変換する。消費E:{cost}",
    attributes: ["fire", "water"],
    canBeInitial: true
  },
  {
    id: "active_convert_w_g",
    name: "雨風の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_convert",
    params: { from: "water", to: "wood", duration: 3 },
    rarity: 2,
    price: 15,
    desc: "3手番の間、ターン終了時に雨を風に変換する。消費E:{cost}",
    attributes: ["water", "wood"],
    canBeInitial: true
  },
  {
    id: "active_convert_d_l",
    name: "月雷の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_convert",
    params: { from: "dark", to: "light", duration: 3 },
    rarity: 2,
    price: 15,
    desc: "3手番の間、ターン終了時に月を雷に変換する。消費E:{cost}",
    attributes: ["dark", "light"],
    canBeInitial: true
  },
  {
    id: "active_convert_l_d",
    name: "雷月の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_convert",
    params: { from: "light", to: "dark", duration: 3 },
    rarity: 2,
    price: 15,
    desc: "3手番の間、ターン終了時に雷を月に変換する。消費E:{cost}",
    attributes: ["light", "dark"],
    canBeInitial: true
  },
  {
    id: "active_convert_h_f",
    name: "生命炎の誓約",
    icon: "update",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "turn_end_convert",
    params: { from: "heart", to: "fire", duration: 3 },
    rarity: 2,
    price: 15,
    desc: "3手番の間、ターン終了時にハートを炎に変換する。消費E:{cost}",
    attributes: ["heart", "fire"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_fd_w",
    name: "業水の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["fire", "dark"], to: "water", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に炎と月を雨に変換する。消費E:{cost}",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_fd_l",
    name: "炎雷の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["fire", "dark"], to: "light", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に炎と月を雷に変換する。消費E:{cost}",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_wh_f",
    name: "紅蓮の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["water", "heart"], to: "fire", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に雨とハートを炎に変換する。消費E:{cost}",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_wh_g",
    name: "蒼風の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["water", "heart"], to: "wood", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に雨とハートを風に変換する。消費E:{cost}",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_gl_d",
    name: "神緑の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["wood", "light"], to: "dark", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に風と雷を月に変換する。消費E:{cost}",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_gl_h",
    name: "天恵の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["wood", "light"], to: "heart", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に風と雷をハートに変換する。消費E:{cost}",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_fw_g",
    name: "天地の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["fire", "water"], to: "wood", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に炎と雨を風に変換する. 消費E:{cost}",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "active_m_conv_ld_h",
    name: "黄昏の流転",
    icon: "update",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "turn_end_convert_multi",
    params: { types: ["light", "dark"], to: "heart", duration: 2 },
    rarity: 2,
    price: 20,
    desc: "2手番の間、ターン終了時に雷と月をハートに変換する. 消費E:{cost}",
    attributes: ["heart"],
    canBeInitial: true
  },


  // --- スキル: 即時ドロップ大量生成（招来） ---
  {
    id: "active_spawn_f_10",
    name: "烈火の招来",
    icon: "flare",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "spawn_random",
    params: { color: "fire", count: 10 },
    rarity: 2,
    price: 14,
    desc: "炎ドロップをランダムに10個生成。消費E:{cost}",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "active_spawn_w_10",
    name: "激流の招来",
    icon: "flare",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "spawn_random",
    params: { color: "water", count: 10 },
    rarity: 2,
    price: 14,
    desc: "雨ドロップをランダムに10個生成。消費E:{cost}",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "active_spawn_g_10",
    name: "暴風の招来",
    icon: "flare",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "spawn_random",
    params: { color: "wood", count: 10 },
    rarity: 2,
    price: 14,
    desc: "風ドロップをランダムに10個生成。消費E:{cost}",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "active_spawn_l_10",
    name: "雷撃の招来",
    icon: "flare",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "spawn_random",
    params: { color: "light", count: 10 },
    rarity: 2,
    price: 14,
    desc: "雷ドロップをランダムに10個生成。消費E:{cost}",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "active_spawn_d_10",
    name: "冥府の招来",
    icon: "flare",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "spawn_random",
    params: { color: "dark", count: 10 },
    rarity: 2,
    price: 14,
    desc: "月ドロップをランダムに10個生成。消費E:{cost}",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "active_spawn_h_10",
    name: "癒しの招来",
    icon: "flare",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "spawn_random",
    params: { color: "heart", count: 10 },
    rarity: 2,
    price: 14,
    desc: "ハートドロップをランダムに10個生成。消費E:{cost}",
    attributes: ["heart"],
    canBeInitial: true
  },

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
    rarity: 1, price: 14,
    desc: "★獲得に必要なコンボ数を{values}に短縮。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "time_ext",
    name: "時の砂",
    icon: "hourglass_bottom",
    type: "passive",
    effect: "time_permanent",
    price: 10,
    rarity: 1,
    desc: "操作時間を2秒延長。トークン枠を消費しない",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "exchange_star3",
    name: "神秘の昇華",
    icon: "auto_awesome",
    type: "passive",
    rarity: 2, price: 26,
    desc: "所持している星1・星2トークンからランダムに1つを失い、代わりに同じ種類(パッシブ/アクティブ)のランダムな星3トークンを獲得する。",
    attributes: [],
  },
  {
    id: "power_up",
    name: "力の鼓動",
    icon: "fitness_center",
    type: "passive",
    effect: "base_add",
    values: [2, 6, 15],
    rarity: 1, price: 10,
    desc: "{values}コンボ追加。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "forbidden",
    name: "禁忌の儀式",
    icon: "block",
    type: "passive",
    effect: "forbidden",
    values: [2, 3, 4],
    rarity: 2, price: 19,
    desc: "常時落ちコン停止。基礎コンボ数が{values}倍になる。",
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
    rarity: 1, price: 15,
    desc: "ショップに並ぶセール品（半額）の枠を +{values}枠 追加する。",
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
    rarity: 2, price: 20,
    desc: "ショップに並ぶエンチャントの数を{values}個増加させる。",
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
    rarity: 1, price: 20,
    desc: "ショップに並ぶ通常商品の枠を{values}枠拡張する。",
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
    rarity: 1, price: 20,
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
    values: [3, 5, 10],
    rarity: 2, price: 15,
    desc: "報酬倍率を{values}倍にする。",
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
    rarity: 3, price: 39,
    desc: "2つ以上でドロップが消える。コンボ倍率にプラス{values}。",
    attributes: [],
    canBeCurseReward: true
  },

  // --- パッシブ: コンボ倍率（1色）---
  {
    id: "bonus_1c_fire", name: "炎の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire"] }, values: [2, 3, 4], rarity: 1, price: 15,
    desc: "炎を消していると、コンボ倍率にプラス{values}。",
    attributes: ["fire"], canBeInitial: true
  },
  {
    id: "bonus_1c_water", name: "雨の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["water"] }, values: [2, 3, 4], rarity: 1, price: 15,
    desc: "雨を消していると、コンボ倍率にプラス{values}。",
    attributes: ["water"], canBeInitial: true
  },
  {
    id: "bonus_1c_wood", name: "風の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood"] }, values: [2, 3, 4], rarity: 1, price: 15,
    desc: "風を消していると、コンボ倍率にプラス{values}。",
    attributes: ["wood"], canBeInitial: true
  },
  {
    id: "bonus_1c_light", name: "雷の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["light"] }, values: [2, 3, 4], rarity: 1, price: 15,
    desc: "雷を消していると、コンボ倍率にプラス{values}。",
    attributes: ["light"], canBeInitial: true
  },
  {
    id: "bonus_1c_dark", name: "月の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["dark"] }, values: [2, 3, 4], rarity: 1, price: 15,
    desc: "月を消していると、コンボ倍率にプラス{values}。",
    attributes: ["dark"], canBeInitial: true
  },
  {
    id: "bonus_1c_heart", name: "癒の連舞", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["heart"] }, values: [2, 3, 4], rarity: 1, price: 15,
    desc: "ハートを消していると、コンボ倍率にプラス{values}。",
    attributes: ["heart"], canBeInitial: true
  },

  // --- パッシブ: 属性2コンボ倍率 ---
  {
    id: "combo2_mult_fire", name: "炎の二重奏", icon: "queue_play_next", type: "passive", effect: "color_combo_multiplier",
    params: { color: "fire" }, values: [1.5, 2.0, 3.0], rarity: 2, price: 20,
    desc: "炎ドロップで2コンボ以上すると、基礎コンボ数が{values}倍される。",
    attributes: ["fire"], canBeInitial: true
  },
  {
    id: "combo2_mult_water", name: "雨の二重奏", icon: "queue_play_next", type: "passive", effect: "color_combo_multiplier",
    params: { color: "water" }, values: [1.5, 2.0, 3.0], rarity: 2, price: 20,
    desc: "雨ドロップで2コンボ以上すると、基礎コンボ数が{values}倍される。",
    attributes: ["water"], canBeInitial: true
  },
  {
    id: "combo2_mult_wood", name: "風の二重奏", icon: "queue_play_next", type: "passive", effect: "color_combo_multiplier",
    params: { color: "wood" }, values: [1.5, 2.0, 3.0], rarity: 2, price: 20,
    desc: "風ドロップで2コンボ以上すると、基礎コンボ数が{values}倍される。",
    attributes: ["wood"], canBeInitial: true
  },
  {
    id: "combo2_mult_light", name: "雷の二重奏", icon: "queue_play_next", type: "passive", effect: "color_combo_multiplier",
    params: { color: "light" }, values: [1.5, 2.0, 3.0], rarity: 2, price: 20,
    desc: "雷ドロップで2コンボ以上すると、基礎コンボ数が{values}倍される。",
    attributes: ["light"], canBeInitial: true
  },
  {
    id: "combo2_mult_dark", name: "月の二重奏", icon: "queue_play_next", type: "passive", effect: "color_combo_multiplier",
    params: { color: "dark" }, values: [1.5, 2.0, 3.0], rarity: 2, price: 20,
    desc: "月ドロップで2コンボ以上すると、基礎コンボ数が{values}倍される。",
    attributes: ["dark"], canBeInitial: true
  },
  {
    id: "combo2_mult_heart", name: "癒の二重奏", icon: "queue_play_next", type: "passive", effect: "color_combo_multiplier",
    params: { color: "heart" }, values: [1.5, 2.0, 3.0], rarity: 2, price: 20,
    desc: "ハートドロップで2コンボ以上すると、基礎コンボ数が{values}倍される。",
    attributes: ["heart"], canBeInitial: true
  },

  // --- パッシブ: 属性4個以上連結倍率 ---
  {
    id: "connect4_mult_fire", name: "炎の四重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "fire" }, values: [1.2, 1.5, 2.0], rarity: 2, price: 20,
    desc: "炎ドロップを4個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["fire"], canBeInitial: true
  },
  {
    id: "connect4_mult_water", name: "雨の四重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "water" }, values: [1.2, 1.5, 2.0], rarity: 2, price: 20,
    desc: "雨ドロップを4個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["water"], canBeInitial: true
  },
  {
    id: "connect4_mult_wood", name: "風の四重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "wood" }, values: [1.2, 1.5, 2.0], rarity: 2, price: 20,
    desc: "風ドロップを4個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["wood"], canBeInitial: true
  },
  {
    id: "connect4_mult_light", name: "雷の四重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "light" }, values: [1.2, 1.5, 2.0], rarity: 2, price: 20,
    desc: "雷ドロップを4個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["light"], canBeInitial: true
  },
  {
    id: "connect4_mult_dark", name: "月の四重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "dark" }, values: [1.2, 1.5, 2.0], rarity: 2, price: 20,
    desc: "月ドロップを4個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["dark"], canBeInitial: true
  },
  {
    id: "connect4_mult_heart", name: "癒の四重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "heart" }, values: [1.2, 1.5, 2.0], rarity: 2, price: 20,
    desc: "ハートドロップを4個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["heart"], canBeInitial: true
  },

  // --- パッシブ: 属性6個以上連結倍率 ---
  {
    id: "connect6_mult_fire", name: "炎の六重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "fire", count: 6 }, values: [2.0, 3.0, 4.0], rarity: 3, price: 26,
    desc: "炎ドロップを6個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["fire"], canBeInitial: true
  },
  {
    id: "connect6_mult_water", name: "雨の六重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "water", count: 6 }, values: [2.0, 3.0, 4.0], rarity: 3, price: 26,
    desc: "雨ドロップを6個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["water"], canBeInitial: true
  },
  {
    id: "connect6_mult_wood", name: "風の六重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "wood", count: 6 }, values: [2.0, 3.0, 4.0], rarity: 3, price: 26,
    desc: "風ドロップを6個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["wood"], canBeInitial: true
  },
  {
    id: "connect6_mult_light", name: "雷の六重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "light", count: 6 }, values: [2.0, 3.0, 4.0], rarity: 3, price: 26,
    desc: "雷ドロップを6個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["light"], canBeInitial: true
  },
  {
    id: "connect6_mult_dark", name: "月の六重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "dark", count: 6 }, values: [2.0, 3.0, 4.0], rarity: 3, price: 26,
    desc: "月ドロップを6個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["dark"], canBeInitial: true
  },
  {
    id: "connect6_mult_heart", name: "癒の六重奏", icon: "link", type: "passive", effect: "color_connection_multiplier",
    params: { color: "heart", count: 6 }, values: [2.0, 3.0, 4.0], rarity: 3, price: 26,
    desc: "ハートドロップを6個以上繋げて消すと、基礎コンボ数が{values}倍される。",
    attributes: ["heart"], canBeInitial: true
  },

  // --- パッシブ: コンボ倍率（2色同時）---
  { id: "bonus_2c_fd", name: "炎月の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark"] }, values: [2, 3, 5], rarity: 2, price: 20, desc: "炎/月を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["fire", "dark"], canBeInitial: true },
  { id: "bonus_2c_wh", name: "蒼海の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart"] }, values: [2, 3, 5], rarity: 2, price: 20, desc: "雨/ハートを同時に消すと、コンボ倍率にプラス{values}。", attributes: ["water", "heart"], canBeInitial: true },
  { id: "bonus_2c_gl", name: "風雷の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light"] }, values: [2, 3, 5], rarity: 2, price: 20, desc: "風/雷を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["wood", "light"], canBeInitial: true },
  { id: "bonus_2c_wd", name: "雨月の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "dark"] }, values: [2, 3, 5], rarity: 2, price: 20, desc: "雨/月を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["water", "dark"], canBeInitial: true },
  { id: "bonus_2c_gh", name: "風癒の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "heart"] }, values: [2, 3, 5], rarity: 2, price: 20, desc: "風/ハートを同時に消すと、コンボ倍率にプラス{values}。", attributes: ["wood", "heart"], canBeInitial: true },
  { id: "bonus_2c_fl", name: "炎雷の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "light"] }, values: [2, 3, 5], rarity: 2, price: 20, desc: "炎/雷を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["fire", "light"], canBeInitial: true },

  // --- パッシブ: コンボ倍率（3色同時）---
  { id: "bonus_3c_fdw", name: "業水の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "water"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "炎/月/雨を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["fire", "dark", "water"], canBeInitial: true },
  { id: "bonus_3c_fdl", name: "炎雷月の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "light"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "炎/月/雷を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["fire", "dark", "light"], canBeInitial: true },
  { id: "bonus_3c_whf", name: "紅蓮の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "fire"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "雨/ハート/炎を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["water", "heart", "fire"], canBeInitial: true },
  { id: "bonus_3c_whg", name: "蒼風の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "wood"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "雨/ハート/風を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["water", "heart", "wood"], canBeInitial: true },
  { id: "bonus_3c_gld", name: "神緑の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "dark"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "風/雷/月を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["wood", "light", "dark"], canBeInitial: true },
  { id: "bonus_3c_glh", name: "天恵の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "heart"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "風/雷/ハートを同時に消すと、コンボ倍率にプラス{values}。", attributes: ["wood", "light", "heart"], canBeInitial: true },
  { id: "bonus_3c_fwg", name: "天地の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "water", "wood"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "炎/雨/風を同時に消すと、コンボ倍率にプラス{values}。", attributes: ["fire", "water", "wood"], canBeInitial: true },
  { id: "bonus_3c_ldh", name: "黄昏の律動", icon: "filter_vintage", type: "passive", effect: "color_multiplier", params: { colors: ["light", "dark", "heart"] }, values: [3, 7, 10], rarity: 2, price: 24, desc: "雷/月/ハートを同時に消すと、コンボ倍率にプラス{values}。", attributes: ["light", "dark", "heart"], canBeInitial: true },

  // --- パッシブ: コンボ倍率（4色以上・色数指定）---
  {
    id: "bonus_4c_fwlh", name: "四天の秘儀", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "water", "light", "heart"] }, values: [1.5, 2, 3], rarity: 2, price: 26,
    desc: "炎/雨/雷/ハートを同時に消すと、基礎コンボ数が{values}倍になる。",
    attributes: ["fire", "water", "light", "heart"],
    canBeInitial: true
  },
  {
    id: "bonus_5c", name: "五色の秘儀", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { count: 5 }, values: [2, 3, 4], rarity: 2, price: 31,
    desc: "5色以上を同時に消すと、基礎コンボ数が{values}倍になる。",
    attributes: ["fire", "water", "wood", "light", "dark"],
    canBeInitial: true
  },
  {
    id: "bonus_6c", name: "六色の秘儀", icon: "filter_vintage", type: "passive", effect: "color_multiplier",
    params: { count: 6 }, values: [3, 4, 5], rarity: 2, price: 39,
    desc: "6色すべてを同時に消すと、基礎コンボ数が{values}倍になる。",
    attributes: ["fire", "water", "wood", "light", "dark", "heart"],
    canBeInitial: true
  },

  // --- パッシブ: 色消し数ボーナス（6個以上）---
  { id: "req_6_fire", name: "炎の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 6 }, values: [3, 4, 7], rarity: 1, price: 24, desc: "炎を合計で6個以上消していると、コンボ倍率にプラス{values}。", attributes: ["fire"], canBeInitial: true },
  { id: "req_6_water", name: "雨の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 6 }, values: [3, 4, 7], rarity: 1, price: 24, desc: "雨を合計で6個以上消していると、コンボ倍率にプラス{values}。", attributes: ["water"], canBeInitial: true },
  { id: "req_6_wood", name: "風の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 6 }, values: [3, 4, 7], rarity: 1, price: 24, desc: "風を合計で6個以上消していると、コンボ倍率にプラス{values}。", attributes: ["wood"], canBeInitial: true },
  { id: "req_6_light", name: "雷の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 6 }, values: [3, 4, 7], rarity: 1, price: 24, desc: "雷を合計で6個以上消していると、コンボ倍率にプラス{values}。", attributes: ["light"], canBeInitial: true },
  { id: "req_6_dark", name: "月の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 6 }, values: [3, 4, 7], rarity: 1, price: 24, desc: "月を合計で6個以上消していると、コンボ倍率にプラス{values}。", attributes: ["dark"], canBeInitial: true },
  { id: "req_6_heart", name: "癒の真髄", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 6 }, values: [3, 4, 7], rarity: 1, price: 24, desc: "ハートを合計で6個以上消していると、コンボ倍率にプラス{values}。", attributes: ["heart"], canBeInitial: true },

  // --- パッシブ: 色消し数ボーナス（12個以上）---
  { id: "req_12_fire", name: "炎の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 12 }, values: [3, 4, 5], rarity: 2, price: 31, desc: "炎を合計で12個以上消していると、コンボ倍率にプラス{values}。", attributes: ["fire"], canBeInitial: true },
  { id: "req_12_water", name: "雨の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 12 }, values: [3, 4, 5], rarity: 2, price: 31, desc: "雨を合計で12個以上消していると、コンボ倍率にプラス{values}。", attributes: ["water"], canBeInitial: true },
  { id: "req_12_wood", name: "風の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 12 }, values: [3, 4, 5], rarity: 2, price: 31, desc: "風を合計で12個以上消していると、コンボ倍率にプラス{values}。", attributes: ["wood"], canBeInitial: true },
  { id: "req_12_light", name: "雷の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 12 }, values: [3, 4, 5], rarity: 2, price: 31, desc: "雷を合計で12個以上消していると、コンボ倍率にプラス{values}。", attributes: ["light"], canBeInitial: true },
  { id: "req_12_dark", name: "月の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 12 }, values: [3, 4, 5], rarity: 2, price: 31, desc: "月を合計で12個以上消していると、コンボ倍率にプラス{values}。", attributes: ["dark"], canBeInitial: true },
  { id: "req_12_heart", name: "癒の極致", icon: "query_stats", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 12 }, values: [3, 4, 5], rarity: 2, price: 31, desc: "ハートを合計で12個以上消していると、コンボ倍率にプラス{values}。", attributes: ["heart"], canBeInitial: true },

  // --- パッシブ: 属性別コンボ加算（1コンボにつき+N）---
  // 各属性のドロップを消した1コンボごとにコンボ数を固定値加算する（エンチャント「炎の加護」のトークン版）
  { id: "cc_add_fire", name: "炎の脈動", icon: "whatshot", type: "passive", effect: "color_combo_add", params: { color: "fire" }, values: [2, 5, 10], rarity: 1, price: 14, desc: "炎の1コンボにつきコンボ+{values}。", attributes: ["fire"], canBeInitial: true },
  { id: "cc_add_water", name: "雨の脈動", icon: "water_drop", type: "passive", effect: "color_combo_add", params: { color: "water" }, values: [2, 5, 10], rarity: 1, price: 14, desc: "雨の1コンボにつきコンボ+{values}。", attributes: ["water"], canBeInitial: true },
  { id: "cc_add_wood", name: "風の脈動", icon: "air", type: "passive", effect: "color_combo_add", params: { color: "wood" }, values: [2, 5, 10], rarity: 1, price: 14, desc: "風の1コンボにつきコンボ+{values}。", attributes: ["wood"], canBeInitial: true },
  { id: "cc_add_light", name: "雷の脈動", icon: "bolt", type: "passive", effect: "color_combo_add", params: { color: "light" }, values: [2, 5, 10], rarity: 1, price: 14, desc: "雷の1コンボにつきコンボ+{values}。", attributes: ["light"], canBeInitial: true },
  { id: "cc_add_dark", name: "月の脈動", icon: "nightlight_round", type: "passive", effect: "color_combo_add", params: { color: "dark" }, values: [2, 5, 10], rarity: 1, price: 14, desc: "月の1コンボにつきコンボ+{values}。", attributes: ["dark"], canBeInitial: true },
  { id: "cc_add_heart", name: "癒の脈動", icon: "favorite", type: "passive", effect: "color_combo_add", params: { color: "heart" }, values: [2, 5, 10], rarity: 1, price: 14, desc: "ハートの1コンボにつきコンボ+{values}。", attributes: ["heart"], canBeInitial: true },

  // --- パッシブ: コンボ数ちょうどボーナス ---
  {
    id: "combo_exact_3",
    name: "五連の巧技",
    icon: "query_stats",
    type: "passive",
    effect: "combo_if_le",
    params: { combo: 5 },
    values: [15, 40, 100],
    rarity: 1, price: 15,
    desc: "基礎コンボ数が5コンボ以下の時、コンボ+{values}。",
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
    values: [20, 60, 150],
    rarity: 2, price: 24,
    desc: "10コンボ以下でコンボ+{values}。",
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
    rarity: 2, price: 26,
    desc: "7コンボ以上で、コンボ倍率にプラス{values}。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 特殊消しボーナス ---
  {
    id: "len4", name: "四連の術", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "len4" }, values: [2, 6, 12], rarity: 1, price: 14,
    desc: "4個ちょうど連結でコンボ+{values}。",
    attributes: [], canBeInitial: true
  },
  {
    id: "row_clear", name: "横一閃", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "row" }, values: [5, 15, 35], rarity: 1, price: 20,
    desc: "横1列消しでコンボ+{values}。",
    attributes: [], canBeInitial: true
  },
  {
    id: "square", name: "四方の型", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "square" }, values: [2, 3, 5], maxMultipliers: [10, 20, 50], rarity: 1, price: 24,
    desc: "3x3正方形消し1回につき、基礎コンボ数が{values}倍される。",
    attributes: [], canBeInitial: true
  },
  {
    id: "len5", name: "五星の印", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "len5" }, values: [2, 3, 4], rarity: 1, price: 19,
    desc: "5個以上連結で次手の操作時間{values}倍。",
    attributes: [], canBeInitial: true
  },
  {
    id: "cross", name: "十字の祈り", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "cross" }, values: [2, 3, 5], rarity: 1, price: 24,
    desc: "十字型消しで次手の操作時間{values}倍。",
    attributes: [], canBeInitial: true
  },
  {
    id: "l_shape", name: "鉤十字の型", icon: "category", type: "passive", effect: "shape_bonus",
    params: { shape: "l_shape" }, values: [3, 6, 9], rarity: 1, price: 24,
    desc: "L字消しでコンボ+{values}。",
    attributes: [], canBeInitial: true
  },
  {
    id: "bonus_heart", name: "癒の波動", icon: "favorite", type: "passive", effect: "heart_combo_bonus",
    values: [3, 5, 7], rarity: 1, price: 15,
    desc: "ハートドロップを消したコンボ数分、追加でコンボ+{values}。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "giant",
    name: "巨人の領域",
    icon: "view_quilt",
    type: "passive",
    effect: "expand_board",
    values: [2, 3, 4],
    rarity: 3, price: 24,
    desc: "装備中、盤面が7x6に拡張。基礎コンボ数が{values}倍になる。",
    attributes: [],
    canBeCurseReward: true
  },

  // --- パッシブ: 強化ドロップ ---
  {
    id: "mana_crystal", name: "マナの結晶化", icon: "auto_fix_high", type: "passive", effect: "enhance_chance",
    values: [0.05, 0.1, 0.2], rarity: 1, price: 10,
    desc: "落下ドロップの[5/10/20]%が強化ドロップになる。",
    attributes: [], canBeInitial: true
  },
  {
    id: "enhance_amp", name: "強化増幅", icon: "flare", type: "passive", effect: "enhanced_orb_bonus",
    values: [2, 5, 12], rarity: 2, price: 20,
    desc: "強化1個あたりのコンボ加算を+{values}する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "over_link", name: "過剰結合", icon: "layers", type: "passive", effect: "enhanced_link_multiplier",
    params: { count: 5 }, values: [2, 3, 5], rarity: 2, price: 24,
    desc: "強化5個以上を消したら、コンボ倍率にプラス{values}。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 落ちコンボーナス ---
  {
    id: "bonus_skyfall", name: "天恵の追撃", icon: "keyboard_double_arrow_down", type: "passive", effect: "skyfall_bonus",
    values: [5, 15, 40], rarity: 3, price: 20,
    desc: "落ちコン発生時にコンボ+{values}。",
    attributes: [],
    canBeCurseReward: true
  },

  // --- パッシブ: ボムドロップ ---
  {
    id: "bomb_erase_mult", name: "爆熱の余韻", icon: "emergency", type: "passive", effect: "bomb_erase_mult",
    values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 24,
    desc: "基礎コンボ数が（1 + ボムの効果で消えたドロップ数 × {values}）倍になる。",
    attributes: []
  },
  {
    id: "ignited_drop_fire", name: "爆炎の兆し", icon: "emergency", type: "passive", effect: "bomb_chance_color", params: { color: "fire" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 24,
    desc: "炎ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "ignited_drop_dark", name: "暗黒の兆し", icon: "emergency", type: "passive", effect: "bomb_chance_color", params: { color: "dark" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 24,
    desc: "月ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
    attributes: ["dark"],
    canBeInitial: true
  },

  // --- パッシブ: リピートドロップ ---
  {
    id: "repeat_combo_mult", name: "連鎖の共鳴", icon: "autorenew", type: "passive", effect: "repeat_combo_mult",
    values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 24,
    desc: "基礎コンボ数が（1 + リピートドロップの消去数 × {values}）倍になる。",
    attributes: []
  },
  {
    id: "repeat_chance_water", name: "雨波の巡り", icon: "autorenew", type: "passive", effect: "repeat_chance_color", params: { color: "water" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 19,
    desc: "雨ドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "repeat_chance_heart", name: "生命の巡り", icon: "autorenew", type: "passive", effect: "repeat_chance_color", params: { color: "heart" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 19,
    desc: "ハートドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "repeat_erase_combo", name: "反響する輪舞", icon: "autorenew", type: "passive", effect: "repeat_erase_combo",
    values: [2, 3, 5], rarity: 3, price: 26,
    desc: "コンボ倍率にプラス（ターン中にリピートドロップが消えた数 × {values}）。",
    attributes: []
  },
  {
    id: "repeat_extra_activations", name: "無限の風霊", icon: "autorenew", type: "passive", effect: "extra_repeat_activations",
    values: [1, 2, 3], rarity: 3, price: 24,
    desc: "リピートドロップ消去時、リピート効果が追加で{values}回発動する。",
    attributes: []
  },

  // --- パッシブ: スタードロップ ---
  {
    id: "star_chance_wood", name: "星宿る風", icon: "stars", type: "passive", effect: "star_chance_color", params: { color: "wood" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 20,
    desc: "風ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "star_chance_light", name: "星宿る雷", icon: "stars", type: "passive", effect: "star_chance_color", params: { color: "light" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 20,
    desc: "雷ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "star_erase_mult", name: "星屑の共鳴", icon: "stars", type: "passive", effect: "star_erase_mult",
    values: [1, 2, 3], maxMultipliers: [10, 20, 50], rarity: 3, price: 26,
    desc: "基礎コンボ数が（1 + ターン中にスタードロップが消えた数 × {values}）倍になる。",
    attributes: []
  },
  {
    id: "star_earn_boost", name: "星の祝福", icon: "stars", type: "passive", effect: "star_earn_boost",
    values: [3, 5, 8], rarity: 2, price: 20,
    desc: "スタードロップが消えた時にもらえるスター（通貨）の数が{values}個増える。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 虹ドロップ ---
  // {
  //   id: "rainbow_chance", name: "虹の呼び声", icon: "palette", type: "passive", effect: "rainbow_chance",
  //   values: [0.02, 0.04, 0.07], rarity: 2, price: 20,
  //   desc: "ドロップが[2/4/7]%の確率で虹ドロップとして降ってくるようになる。",
  //   attributes: ["fire", "water", "wood", "light", "dark"], canBeInitial: true
  // },
  // {
  //   id: "rainbow_bridge", name: "虹の架け橋", icon: "palette", type: "passive", effect: "rainbow_combo_bonus",
  //   values: [1, 2, 5], rarity: 3, price: 26,
  //   desc: "虹ドロップがコンボに関与した際、コンボがさらに +{values} される。",
  //   attributes: ["fire", "water", "wood", "light", "dark"]
  // },

  // --- パッシブ: ムーブドロップ ---
  {
    id: "move_drop", name: "ムーブドロップ", icon: "control_camera", type: "passive", effect: "move_drop",
    values: [5, 3, 1], rarity: 2, price: 20,
    desc: "所持中盤面にムーブドロップを1つ追加。{values}マス移動毎にカウント＋1。ターン終了時カウント数分コンボ加算。",
    attributes: [], canBeInitial: true
  },
  {
    id: "move_drop_boost", name: "飛躍の歩法", icon: "directions_run", type: "passive", effect: "move_drop_boost",
    values: [1, 2, 5], rarity: 2, price: 24,
    desc: "ムーブドロップが規定マス移動した際、カウントの増加量が+{values}される。",
    attributes: [], canBeInitial: true
  },
  {
    id: "move_drop_lucky", name: "幸運の歩み", icon: "filter_7", type: "passive", effect: "move_drop_lucky",
    values: ["7", "5,7", "5,7,9"], rarity: 3, price: 31,
    desc: "コンボ終了時、カウントが{values}の倍数のムーブドロップがあれば、アクティブスキルをチャージMAXにする(カウント1以上限定)。",
    attributes: [], canBeInitial: true
  },

  // --- パッシブ: レジェンド ---
  {
    id: "legend_acrobat", name: "曲芸師", icon: "sports_gymnastics", type: "passive", effect: "acrobat",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "ハートドロップの2コンボ以上達成で、基礎コンボ数が7倍になる。",
    attributes: ["heart"]
  },
  {
    id: "legend_saint", name: "聖女", icon: "healing", type: "passive", effect: "saint",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "呪いトークンの負の効果が発動しなくなる（ロックのカウントは進み、解除は可能）。",
    attributes: []
  },
  {
    id: "legend_saint", name: "聖女", icon: "healing", type: "passive", effect: "saint",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "呪いトークンの負の効果が発動しなくなる（ロックのカウントは進み、解除は可能）。",
    attributes: []
  },
  {
    id: "legend_inugami", name: "犬神", icon: "pets", type: "passive", effect: "inugami",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "基礎コンボ数が100以上の時、基礎コンボ数が10倍になる。",
    attributes: []
  },
  {
    id: "legend_sky_god", name: "空の神", icon: "cloud", type: "passive", effect: "sky_god",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "所持トークンが合計10個以下のとき、基礎コンボ数が4倍になる。",
    attributes: []
  },
  {
    id: "legend_awakening", name: "覚醒", icon: "flare", type: "passive", effect: "awakening",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "全てのドロップが強化（プラス）ドロップとして落ちてくる。",
    attributes: []
  },
  {
    id: "legend_magician", name: "魔術師", icon: "auto_fix_high", type: "passive", effect: "magician",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "他のトークンがエンチャントを入手した際、このトークンにも同じエンチャントが付与される。",
    attributes: []
  },
  {
    id: "legend_king", name: "キング", icon: "sports_martial_arts", type: "passive", effect: "king",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "所持している全てのトークンがレベル3に強化される（新規入手分も含む）。",
    attributes: []
  },
  {
    id: "legend_vacation", name: "バカンス", icon: "beach_access", type: "passive", effect: "vacation",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "雷と月のドロップが降ってこなくなる。",
    attributes: []
  },
  {
    id: "legend_limit_breaker", name: "神ノ理", icon: "rocket_launch", type: "passive", effect: "absolute_limit_break",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "一部パッシブ効果による「動的コンボ倍率の最大上限」を撤廃する。",
    attributes: []
  },
  {
    id: "legend_celeb", name: "セレブ", icon: "diamond", type: "passive", effect: "celeb",
    rarity: 4, price: 77, noLevelUp: true,
    desc: "ショップに星1のトークンが出現しなくなる。",
    attributes: []
  },
  {
    id: "legend_chef", name: "料理人", icon: "restaurant", type: "passive", effect: "auto_charge",
    values: [1], rarity: 4, price: 77, noLevelUp: true,
    desc: "毎ターン、他のスキルのエネルギーが自動で追加で1回復する。",
    attributes: []
  },
  {
    id: "legend_magic_stone",
    name: "魔法の石",
    icon: "shield",
    type: "passive",
    effect: "revive",
    rarity: 4,
    price: 77,
    noLevelUp: true,
    desc: "ゲームオーバーになった時、このトークンが破壊され、手番が５復活する。",
    attributes: []
  },

  // --- パッシブ: トークン数・レベル依存 ---
  {
    id: "star1_combo_boost", name: "一星の共鳴", icon: "stars", type: "passive", effect: "star_count_combo_add",
    params: { rarity: 1 }, values: [2, 4, 8], rarity: 2, price: 15,
    desc: "所持している★1トークン数 × {values}をコンボ数に加算する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "star2_time_boost", name: "二星の延刻", icon: "timer", type: "passive", effect: "star_count_time_ext",
    params: { rarity: 2 }, values: [2, 3, 4], rarity: 2, price: 15,
    desc: "所持している★2トークン数 × {values}秒 操作時間を延長する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "star3_mult_boost", name: "三星の極雷", icon: "trending_up", type: "passive", effect: "star_count_combo_mult",
    params: { rarity: 3 }, values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 24,
    desc: "所持している★3トークン1個につき、基礎コンボ数が{values}倍される。",
    attributes: []
  },
  {
    id: "enchant_mult_boost", name: "魔導の共犯", icon: "auto_fix_normal", type: "passive", effect: "enchant_count_combo_mult",
    values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 24,
    desc: "所持しているエンチャント1個につき、基礎コンボ数が{values}倍される。",
    attributes: []
  },
  {
    id: "total_level_boost", name: "全霊の共鳴", icon: "upgrade", type: "passive", effect: "total_level_combo_add",
    values: [1, 2, 4], rarity: 3, price: 31,
    desc: "所持しているトークンのレベル数の合計 × {values} をコンボ数に加算する。",
    attributes: []
  },
  {
    id: "level3_count_mult", name: "三魂の極致", icon: "upgrade", type: "passive", effect: "level3_count_combo_mult",
    values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 39,
    desc: "コンボ倍率にプラス（所持しているレベル3トークンの数 × {values}）。",
    attributes: []
  },
  {
    id: "curse_count_mult", name: "厄災の祈り", icon: "psychology", type: "passive", effect: "curse_count_combo_mult",
    values: [2, 3, 5], maxMultipliers: [20, 50, 100], rarity: 3, price: 39,
    desc: "コンボ倍率にプラス（所持している呪いの数 × {values}）。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "copy_token", name: "模倣の魔鏡", icon: "content_copy", type: "passive", effect: "copy_left",
    values: [1], rarity: 3, price: 26,
    desc: "左隣のトークンの効果とエンチャントをコピーする。自身はレベルアップせず、エンチャントも付与されない。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "duration_booster", name: "刻の歯車", icon: "schedule", type: "passive", effect: "active_duration_boost",
    values: [1, 2, 3], rarity: 3, price: 39,
    desc: "効果手番があるアクティブスキルの持続時間を {values} 手番延長する。",
    attributes: []
  },

  // --- パッシブ: 統計依存（コンボ・倍率）---
  {
    id: "memory_of_combo", name: "コンボの記憶", icon: "history", type: "passive", effect: "stat_combo_記憶",
    values: [1, 2, 3], rarity: 2, price: 15,
    desc: "現在のゲーム中の「最大コンボ数」5コンボにつき、常にコンボ加算 + {values}。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "echo_of_max", name: "極大の余韻", icon: "layers", type: "passive", effect: "stat_mult_余韻",
    values: [0.1, 0.2, 0.5], maxMultipliers: [10, 20, 50], rarity: 3, price: 24,
    desc: "現在のゲーム中の「最大コンボ倍率」の[10/20/50]%を、コンボ倍率にプラスする。",
    attributes: []
  },
  {
    id: "thousand_arms", name: "千手観音", icon: "query_stats", type: "passive", effect: "stat_mult_千手",
    values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 26,
    desc: "現在のゲーム中の「累計コンボ数」100ごとに、基礎コンボ数が{values}倍される。",
    attributes: []
  },
  {
    id: "curse_eater", name: "呪い喰い", icon: "psychology", type: "passive", effect: "stat_curse_removed",
    values: [2, 3, 5], rarity: 3, price: 39,
    desc: "基礎コンボ数が（1 + 解除した呪いトークンの累計数 × {values}）倍になる。",
    attributes: []
  },
  {
    id: "chalice_of_life", name: "生命の器", icon: "favorite", type: "passive", effect: "stat_heart_chalice",
    values: [2, 3, 4], rarity: 2, price: 26,
    desc: "累計で消去したハートドロップ数30個ごとに、基礎コンボ数が{values}倍される。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "time_skipper", name: "早送りの極意", icon: "fast_forward", type: "passive", effect: "stat_time_skipper",
    values: [2, 3, 4], rarity: 2, price: 24,
    desc: "スキップしたターン数5回につき、コンボ倍率にプラス{values}。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 属性依存・条件付き強化 ---
  {
    id: "attr_res_fire", name: "紅炎の共鳴", icon: "layers", type: "passive", effect: "attribute_count_multiplier",
    params: { attribute: "fire" }, values: [0.1, 0.2, 0.5], rarity: 2, price: 20,
    desc: "基礎コンボ数が（1 + 所持している炎属性トークン数 × {values}）倍になる。",
    attributes: ["fire"], canBeInitial: true
  },
  {
    id: "attr_res_water", name: "蒼氷の共鳴", icon: "layers", type: "passive", effect: "attribute_count_multiplier",
    params: { attribute: "water" }, values: [0.1, 0.2, 0.5], rarity: 2, price: 20,
    desc: "基礎コンボ数が（1 + 所持している雨属性トークン数 × {values}）倍になる。",
    attributes: ["water"], canBeInitial: true
  },
  {
    id: "attr_res_wood", name: "翠嵐の共鳴", icon: "layers", type: "passive", effect: "attribute_count_multiplier",
    params: { attribute: "wood" }, values: [0.1, 0.2, 0.5], rarity: 2, price: 20,
    desc: "基礎コンボ数が（1 + 所持している風属性トークン数 × {values}）倍になる。",
    attributes: ["wood"], canBeInitial: true
  },
  {
    id: "attr_res_light", name: "閃光の共鳴", icon: "layers", type: "passive", effect: "attribute_count_multiplier",
    params: { attribute: "light" }, values: [0.1, 0.2, 0.5], rarity: 2, price: 20,
    desc: "基礎コンボ数が（1 + 所持している雷属性トークン数 × {values}）倍になる。",
    attributes: ["light"], canBeInitial: true
  },
  {
    id: "attr_res_dark", name: "常闇の共鳴", icon: "layers", type: "passive", effect: "attribute_count_multiplier",
    params: { attribute: "dark" }, values: [0.1, 0.2, 0.5], rarity: 2, price: 20,
    desc: "基礎コンボ数が（1 + 所持している月属性トークン数 × {values}）倍になる。",
    attributes: ["dark"], canBeInitial: true
  },
  {
    id: "attr_res_heart", name: "慈愛の共鳴", icon: "layers", type: "passive", effect: "attribute_count_multiplier",
    params: { attribute: "heart" }, values: [0.1, 0.2, 0.5], rarity: 2, price: 20,
    desc: "基礎コンボ数が（1 + 所持している心属性トークン数 × {values}）倍になる。",
    attributes: ["heart"], canBeInitial: true
  },
  {
    id: "pure_power", name: "純粋なる力", icon: "stars", type: "passive", effect: "no_attribute_multiplier",
    values: [4, 5, 6], maxMultipliers: [100, 500, 1000], rarity: 3, price: 39,
    desc: "「時の砂」以外の無属性トークンを所持していない場合、基礎コンボ数が{values}倍になる。",
    attributes: ["fire", "water", "wood", "light", "dark", "heart"],
    canBeInitial: false
  },


  // --- パッシブ: 統計依存（特殊消し）---
  {
    id: "seeker_of_cross", name: "十字の求道者", icon: "category", type: "passive", effect: "stat_shape_cross",
    values: [1, 2, 3], rarity: 2, price: 20,
    desc: "現在のゲーム中の「十字消し累計回数」5回につき、十字消しの際に追加でコンボ加算 +[1/2/3]。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "seeker_of_len4", name: "四連の探求者", icon: "category", type: "passive", effect: "stat_shape_len4",
    values: [1, 2, 3], rarity: 2, price: 15,
    desc: "現在のゲーム中の「4個消し累計回数」20回につき、4個消しの際に追加でコンボ加算 +[1/2/3]。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "polishing_claw", name: "鉤爪の研鑽", icon: "sell", type: "passive", effect: "stat_shape_l",
    values: [1, 2, 3], rarity: 2, price: 14,
    desc: "現在のゲーム中の「L字消し累計回数」1回につき、このトークンの売却値が[1/2/3]上がる。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "memory_of_flash", name: "一閃の記憶", icon: "category", type: "passive", effect: "stat_shape_row",
    values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 2, price: 24,
    desc: "現在のゲーム中の「横1列消し累計回数」5回につき、横1列消し1つにつきコンボ倍率にプラス[2/3/4]。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "artisan_of_square", name: "方陣の職人", icon: "category", type: "passive", effect: "stat_shape_square",
    values: [2, 3, 5], maxMultipliers: [10, 20, 50], rarity: 3, price: 26,
    desc: "現在のゲーム中の「四角消し累計回数」5回につき、コンボ倍率にプラス[2/3/5]。",
    attributes: []
  },
  {
    id: "guide_of_fivestar", name: "五星の導き手", icon: "category", type: "passive", effect: "stat_shape_len5",
    values: [1, 2, 3], rarity: 2, price: 20,
    desc: "現在のゲーム中の「5個以上連結消し累計回数」10回につき、5個消しの次手操作時間が +[0.5/1.0/1.5]秒 される。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: 統計依存（リソース・進行）---
  {
    id: "pride_of_spendthrift", name: "浪費家の意地", icon: "monetization_on", type: "passive", effect: "stat_spend_star",
    values: [2, 3, 4], maxMultipliers: [10, 20, 50], rarity: 3, price: 26,
    desc: "現在のゲーム中の「累計消費スター数」50★につき、コンボ倍率にプラス{values}。",
    attributes: []
  },
  {
    id: "proof_of_veteran", name: "歴戦の証明", icon: "verified", type: "passive", effect: "stat_progress_clear",
    values: [0.01, 0.02, 0.03], rarity: 3, price: 24,
    desc: "「現在のクリア回数」の進行ごとに、強化ドロップ確率が +[1/2/3]%。",
    attributes: []
  },
  {
    id: "end_of_thought", name: "熟考の果て", icon: "psychology", type: "passive", effect: "stat_time_move",
    values: [0.5, 1.0, 2.0], rarity: 2, price: 26,
    desc: "「合計操作時間」1分につき、報酬倍率が +[50/100/200]% 加算される。",
    attributes: [],
    canBeInitial: true
  },

  // --- パッシブ: ハイリスク・ハイリターン ---
  {
    id: "desperate_stance", name: "背水の陣", icon: "warning", type: "passive", effect: "desperate_stance",
    values: [2, 3, 4], rarity: 3, price: 31,
    desc: "操作時間が常に4秒固定。基礎コンボ数が{values}倍になる。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "greed_power", name: "金満の暴力", icon: "monetization_on", type: "passive", effect: "greed_power",
    values: [7, 5, 3], maxMultipliers: [10, 20, 50], rarity: 1, price: 26,
    desc: "★[20/15/10]個につきコンボ倍率にプラス1。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "picky_eater", name: "偏食家", icon: "restaurant", type: "passive", effect: "picky_eater",
    params: { excludeColors: ["heart", "light", "dark"] },
    values: [-2, -1, 0], rarity: 3, price: 24,
    desc: "ハート/雷/月が出現しなくなる。手番[−2/−1/±0]。",
    attributes: ["heart", "light", "dark"]
  },
  {
    id: "cursed_power", name: "呪われた力", icon: "psychology", type: "passive", effect: "cursed_power",
    values: [30, 60, 100], rarity: 1, price: 26,
    desc: "常にコンボ+[30/60/100]。操作時間−3秒。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "critical_passive",
    name: "会心の一撃",
    icon: "flash_on",
    type: "passive",
    effect: "critical_strike",
    values: [20, 50, 100],
    rarity: 3, price: 26,
    desc: "20%の確率で、コンボ倍率にプラス{values}。",
    attributes: []
  },
  {
    id: "shape_master",
    name: "百般の型の極意",
    icon: "category",
    type: "passive",
    effect: "shape_variety_mult",
    values: [3, 4, 5],
    rarity: 2, price: 31,
    desc: "1ターンの間に異なる特殊消しを2種類以上発動させると、コンボ倍率にプラス{values}。",
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
    rarity: 1, price: 24,
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
    rarity: 2, price: 15,
    desc: "コンボ加算にランダムな値を追加する",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "contract_of_void", name: "虚無の契約", icon: "history_edu", type: "passive", effect: "contract_of_void",
    values: [3, 4, 5], rarity: 3, price: 31,
    desc: "全エンチャント効果が無効になる代わりに、基礎コンボ数が{values}倍になる。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "limit_breaker", name: "限界突破", icon: "rocket_launch", type: "passive", effect: "limit_break",
    values: [2, 5, 20], rarity: 3, price: 39,
    desc: "一部のパッシブ効果による「動的コンボ倍率の最大上限」をLvで上昇させる(Lv1:x2/Lv2:x5)。Lv3で20倍になる。",
    attributes: [],
    canBeCurseReward: true
  },
  {
    id: "speed_of_light_thought",
    name: "神速の思考",
    icon: "bolt",
    type: "passive",
    effect: "speed_of_light_thought",
    values: [2, 3, 5],
    rarity: 2,
    price: 26,
    desc: "操作時間が「2秒以上」余った状態でドロップを離してターンを終えると、コンボ倍率が{values}倍になる。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "last_turn_burst",
    name: "最後の輝き",
    icon: "hourglass_bottom",
    type: "passive",
    effect: "last_turn_burst",
    values: [2, 3, 4],
    rarity: 2,
    price: 20,
    desc: "サイクルの最終ターン目のみ、基礎コンボ数が{values}倍になる。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "erosion_fire",
    name: "炎の浸食",
    icon: "grain",
    type: "passive",
    effect: "erosion_color",
    params: { color: "fire" },
    values: [30, 50, 70],
    rarity: 2,
    price: 24,
    desc: "ターン終了時、盤面にある炎ドロップの上下左右にある通常ドロップが、[30/50/70]%の確率で炎ドロップに変化する。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "erosion_water",
    name: "雨の浸食",
    icon: "grain",
    type: "passive",
    effect: "erosion_color",
    params: { color: "water" },
    values: [30, 50, 70],
    rarity: 2,
    price: 24,
    desc: "ターン終了時、盤面にある雨ドロップの上下左右にある通常ドロップが、[30/50/70]%の確率で雨ドロップに変化する。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "erosion_wood",
    name: "風の浸食",
    icon: "grain",
    type: "passive",
    effect: "erosion_color",
    params: { color: "wood" },
    values: [30, 50, 70],
    rarity: 2,
    price: 24,
    desc: "ターン終了時、盤面にある風ドロップの上下左右にある通常ドロップが、[30/50/70]%の確率で風ドロップに変化する。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "erosion_light",
    name: "雷の浸食",
    icon: "grain",
    type: "passive",
    effect: "erosion_color",
    params: { color: "light" },
    values: [30, 50, 70],
    rarity: 2,
    price: 24,
    desc: "ターン終了時、盤面にある雷ドロップの上下左右にある通常ドロップが、[30/50/70]%の確率で雷ドロップに変化する。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "erosion_dark",
    name: "月の浸食",
    icon: "grain",
    type: "passive",
    effect: "erosion_color",
    params: { color: "dark" },
    values: [30, 50, 70],
    rarity: 2,
    price: 24,
    desc: "ターン終了時、盤面にある月ドロップの上下左右にある通常ドロップが、[30/50/70]%の確率で月ドロップに変化する。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "erosion_heart",
    name: "癒の浸食",
    icon: "grain",
    type: "passive",
    effect: "erosion_color",
    params: { color: "heart" },
    values: [30, 50, 70],
    rarity: 2,
    price: 24,
    desc: "ターン終了時、盤面にあるハートドロップの上下左右にある通常ドロップが、[30/50/70]%の確率でハートドロップに変化する。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "turn_end_convert_f_d",
    name: "影への流転",
    icon: "transform",
    type: "passive",
    effect: "turn_end_convert",
    params: { from: "fire", to: "dark" },
    values: [50, 70, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[50/70/100]%の確率で盤面にある炎ドロップを月ドロップに変換する。",
    attributes: ["fire", "dark"],
    canBeInitial: true
  },
  {
    id: "turn_end_convert_w_f",
    name: "劫炎への流転",
    icon: "transform",
    type: "passive",
    effect: "turn_end_convert",
    params: { from: "water", to: "fire" },
    values: [50, 70, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[50/70/100]%の確率で盤面にある雨ドロップを炎ドロップに変換する。",
    attributes: ["water", "fire"],
    canBeInitial: true
  },
  {
    id: "turn_end_convert_g_w",
    name: "奔流への流転",
    icon: "transform",
    type: "passive",
    effect: "turn_end_convert",
    params: { from: "wood", to: "water" },
    values: [50, 70, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[50/70/100]%の確率で盤面にある風ドロップを雨ドロップに変換する。",
    attributes: ["wood", "water"],
    canBeInitial: true
  },
  {
    id: "turn_end_convert_l_g",
    name: "深風への流転",
    icon: "transform",
    type: "passive",
    effect: "turn_end_convert",
    params: { from: "light", to: "wood" },
    values: [50, 70, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[50/70/100]%の確率で盤面にある雷ドロップを風ドロップに変換する。",
    attributes: ["light", "wood"],
    canBeInitial: true
  },
  {
    id: "turn_end_convert_d_l",
    name: "聖雷への流転",
    icon: "transform",
    type: "passive",
    effect: "turn_end_convert",
    params: { from: "dark", to: "light" },
    values: [50, 70, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[50/70/100]%の確率で盤面にある月ドロップを雷ドロップに変換する。",
    attributes: ["dark", "light"],
    canBeInitial: true
  },
  {
    id: "turn_end_convert_h_f",
    name: "癒の劫火",
    icon: "transform",
    type: "passive",
    effect: "turn_end_convert",
    params: { from: "heart", to: "fire" },
    values: [50, 70, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[50/70/100]%の確率で盤面にあるハートドロップを炎ドロップに変換する。",
    attributes: ["heart", "fire"],
    canBeInitial: true
  },
  {
    id: "turn_end_full_board_f",
    name: "紅蓮の支配者",
    icon: "flaky",
    type: "passive",
    effect: "turn_end_full_board",
    params: { to: "fire" },
    values: [10, 30, 50],
    rarity: 3,
    price: 31,
    desc: "ターン終了時、[10/30/50]%の確率で盤面を全て炎ドロップに変換する。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "turn_end_full_board_w",
    name: "蒼海の支配者",
    icon: "flaky",
    type: "passive",
    effect: "turn_end_full_board",
    params: { to: "water" },
    values: [10, 30, 50],
    rarity: 3,
    price: 31,
    desc: "ターン終了時、[10/30/50]%の確率で盤面を全て雨ドロップに変換する。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "turn_end_full_board_g",
    name: "深翠の支配者",
    icon: "flaky",
    type: "passive",
    effect: "turn_end_full_board",
    params: { to: "wood" },
    values: [10, 30, 50],
    rarity: 3,
    price: 31,
    desc: "ターン終了時、[10/30/50]%の確率で盤面を全て風ドロップに変換する。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "turn_end_full_board_l",
    name: "閃雷の支配者",
    icon: "flaky",
    type: "passive",
    effect: "turn_end_full_board",
    params: { to: "light" },
    values: [10, 30, 50],
    rarity: 3,
    price: 31,
    desc: "ターン終了時、[10/30/50]%の確率で盤面を全て雷ドロップに変換する。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "turn_end_full_board_d",
    name: "常闇の支配者",
    icon: "flaky",
    type: "passive",
    effect: "turn_end_full_board",
    params: { to: "dark" },
    values: [10, 30, 50],
    rarity: 3,
    price: 31,
    desc: "ターン終了時、[10/30/50]%の確率で盤面を全て月ドロップに変換する。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "turn_end_full_board_h",
    name: "生命の支配者",
    icon: "flaky",
    type: "passive",
    effect: "turn_end_full_board",
    params: { to: "heart" },
    values: [10, 30, 50],
    rarity: 3,
    price: 31,
    desc: "ターン終了時、[10/30/50]%の確率で盤面を全てハートドロップに変換する。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_f",
    name: "炎の泉",
    icon: "add_circle",
    type: "passive",
    effect: "turn_end_spawn",
    params: { color: "fire", count: 5 },
    values: [70, 90, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[70/90/100]%の確率で炎ドロップをランダムに5個生成する。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_w",
    name: "雨の泉",
    icon: "add_circle",
    type: "passive",
    effect: "turn_end_spawn",
    params: { color: "water", count: 5 },
    values: [70, 90, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[70/90/100]%の確率で雨ドロップをランダムに5個生成する。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_g",
    name: "風の泉",
    icon: "add_circle",
    type: "passive",
    effect: "turn_end_spawn",
    params: { color: "wood", count: 5 },
    values: [70, 90, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[70/90/100]%の確率で風ドロップをランダムに5個生成する。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_l",
    name: "雷の泉",
    icon: "add_circle",
    type: "passive",
    effect: "turn_end_spawn",
    params: { color: "light", count: 5 },
    values: [70, 90, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[70/90/100]%の確率で雷ドロップをランダムに5個生成する。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_d",
    name: "月の泉",
    icon: "add_circle",
    type: "passive",
    effect: "turn_end_spawn",
    params: { color: "dark", count: 5 },
    values: [70, 90, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[70/90/100]%の確率で月ドロップをランダムに5個生成する。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_h",
    name: "生命の泉",
    icon: "add_circle",
    type: "passive",
    effect: "turn_end_spawn",
    params: { color: "heart", count: 5 },
    values: [70, 90, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[70/90/100]%の確率でハートドロップをランダムに5個生成する。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_bomb_1",
    name: "炸裂の刻印",
    icon: "emergency",
    type: "passive",
    effect: "turn_end_special_spawn",
    params: { types: [{ type: "bomb", count: 1 }] },
    values: [10, 30, 50],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[10/30/50]%の確率でボムドロップをランダムに1個生成。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_star_3",
    name: "流星の祝福",
    icon: "stars",
    type: "passive",
    effect: "turn_end_special_spawn",
    params: { types: [{ type: "star", count: 3 }] },
    values: [30, 40, 70],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[30/40/70]%の確率でスタードロップをランダムに3個生成。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_repeat_1",
    name: "無限の輪廻",
    icon: "autorenew",
    type: "passive",
    effect: "turn_end_special_spawn",
    params: { types: [{ type: "repeat", count: 1 }] },
    values: [10, 30, 50],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[10/30/50]%の確率でリピートドロップをランダムに1個生成。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_mixed_1",
    name: "魔導の三位一体",
    icon: "grain",
    type: "passive",
    effect: "turn_end_special_spawn",
    params: { types: [{ type: "bomb", count: 1 }, { type: "star", count: 1 }, { type: "repeat", count: 1 }] },
    values: [5, 10, 30],
    rarity: 3,
    price: 31,
    desc: "ターン終了時、[5/10/30]%の確率でボムドロップ、スタードロップ、リピートドロップをそれぞれランダムに1個生成。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "turn_end_spawn_plus_5",
    name: "豊穣の輝石",
    icon: "add_circle_outline",
    type: "passive",
    effect: "turn_end_special_spawn",
    params: { types: [{ type: "plus", count: 5 }] },
    values: [50, 70, 100],
    rarity: 2,
    price: 20,
    desc: "ターン終了時、[50/70/100]%の確率でプラスドロップをランダムに5個生成。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "passive_add_probability",
    name: "幸運の天秤",
    icon: "balance",
    type: "passive",
    effect: "add_probability",
    values: [10, 20, 30],
    rarity: 2,
    price: 20,
    desc: "所持している自身以外の確率系トークンの発動確率をプラス[10/20/30]%する。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "passive_probability_trigger_mult",
    name: "運命の反響",
    icon: "insights",
    type: "passive",
    effect: "probability_trigger_multiplier",
    values: [2, 3, 7],
    rarity: 2,
    price: 20,
    desc: "確率系トークンの効果が発動したターン、基礎コンボ数を[2/3/7]倍にする。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "passive_probability_trigger_add",
    name: "確率の集束",
    icon: "insights",
    type: "passive",
    effect: "probability_trigger_add_combo",
    values: [2, 3, 4],
    rarity: 2,
    price: 20,
    desc: "確率系トークンが累計発動した回数×[2/3/4]分、コンボ倍率に加算。",
    attributes: [],
    canBeInitial: true
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
    price: 1,
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
    price: 1,
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
    price: 1,
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
    price: 1,
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
    price: 1,
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
    price: 1,
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
    price: 1,
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
    price: 1,
    desc: "2ターン間、操作時間が1秒固定になる。チャージ4ターン。",
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
    price: 1,
    desc: "1ターン間、全てのパッシブトークンの効果が発動しない。チャージ5ターン。",
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
    price: 1,
    desc: "使用するたび「増殖された呪い」をスロットに生成する。解除条件：この呪いを3回使用する",
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
    price: 1,
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
    price: 1,
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
    price: 20,
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
    price: 20,
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
    price: 20,
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
    price: 20,
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
    price: 20,
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
    values: [2, 3, 4],
    rarity: 1,
    price: 10,
    desc: "ショップに炎属性のトークンが出現しやすくなる（×[2/3/4]倍）。",
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
    values: [2, 3, 4],
    rarity: 1,
    price: 10,
    desc: "ショップに雨属性のトークンが出現しやすくなる（×[2/3/4]倍）。",
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
    values: [2, 3, 4],
    rarity: 1,
    price: 10,
    desc: "ショップに風属性のトークンが出現しやすくなる（×[2/3/4]倍）。",
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
    values: [2, 3, 4],
    rarity: 1,
    price: 10,
    desc: "ショップに雷属性のトークンが出現しやすくなる（×[2/3/4]倍）。",
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
    values: [2, 3, 4],
    rarity: 1,
    price: 10,
    desc: "ショップに月属性のトークンが出現しやすくなる（×[2/3/4]倍）。",
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
    values: [2, 3, 4],
    rarity: 1,
    price: 10,
    desc: "ショップに心(癒)属性のトークンが出現しやすくなる（×[2/3/4]倍）。",
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
    values: [2, 3, 4],
    rarity: 1,
    price: 10,
    desc: "ショップに無属性のトークンが出現しやすくなる（×[2/3/4]倍）。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "additive_mastery",
    name: "加算の極意",
    icon: "rebase_edit",
    type: "passive",
    effect: "additive_mastery",
    values: [5, 20, 100],
    rarity: 3, price: 39,
    desc: "コンボ倍率系の効果が一切発動しなくなる代わり、すべての「コンボ加算値」が[5/20/100]倍になる。",
    attributes: [],
    canBeInitial: false
  },

  // ==========================================
  // ★ 新規追加トークン
  // ==========================================

  // --- パッシブ: からっぽの財布 ---
  {
    id: "empty_wallet",
    name: "からっぽの財布",
    icon: "wallet",
    type: "passive",
    effect: "empty_wallet",
    values: [1.5, 2.2, 3.5],
    params: { maxStars: [3, 5, 10] },
    rarity: 2, price: 20,
    desc: "所持スターが[3/5/10]個以下のとき、基礎コンボ数が[1.5/2.2/3.5]倍になる。",
    attributes: [],
    canBeInitial: false
  },

  // --- パッシブ: 星塵の起爆剤 ---
  {
    id: "stardust_catalyst",
    name: "星塵の起爆剤",
    icon: "auto_awesome",
    type: "passive",
    effect: "stardust_catalyst",
    values: [1, 2, 3],
    rarity: 3, price: 26,
    desc: "ボムドロップとスタードロップを同時に消去した場合、消去後にランダムなドロップ[1/2/3]個がボムドロップとして落下する。",
    attributes: [],
    canBeInitial: false,
    canBeCurseReward: true
  },

  // --- パッシブ: ムーブ・リピーター ---
  {
    id: "move_repeater",
    name: "ムーブ・リピーター",
    icon: "repeat",
    type: "passive",
    effect: "move_repeater",
    values: [30, 20, 10],
    rarity: 2, price: 24,
    desc: "ムーブドロップのカウントが[30/20/10]蓄積するごとに、盤面のランダムなドロップ1個をリピートドロップに変化させる。",
    attributes: [],
    canBeInitial: false
  },

  // --- パッシブ: 浪費の勲章 ---
  {
    id: "medal_of_spendthrift",
    name: "浪費の勲章",
    icon: "military_tech",
    type: "passive",
    effect: "medal_of_spendthrift",
    values: [5, 3, 2],
    rarity: 3, price: 26,
    desc: "現在のゲーム中にショップでリロールを行った累計回数[5/3/2]回につき、コンボ倍率に+0.5加算する。",
    attributes: [],
    canBeInitial: false,
    canBeCurseReward: true
  },

  // --- スキル: 重力逆転 ---
  {
    id: "gravity_overdrive",
    name: "重力逆転",
    icon: "vertical_align_top",
    type: "skill",
    cost: 5,
    costLevels: true,
    action: "gravity_overdrive",
    params: { direction: "up", duration: 1 },
    rarity: 3, price: 26,
    desc: "１ターンの間、ドロップの落下方向が「上」に逆転する。さらに基礎コンボ数が2倍になる。消費E:{cost}",
    attributes: [],
    canBeInitial: false,
    canBeCurseReward: true
  },

  // --- パッシブ: 一筆書きの誓約 ---
  {
    id: "one_stroke_seal",
    name: "一筆書きの誓約",
    icon: "gesture",
    type: "passive",
    effect: "one_stroke_seal",
    values: [4.0, 6.5, 10.0],
    rarity: 3, price: 31,
    desc: "ドラッグ操作中に一度通過したマスを二度と通過できなくなる（一筆書きルール）。その代わり、基礎コンボ数が[4.0/6.5/10.0]倍になる。",
    attributes: [],
    canBeInitial: false,
    canBeCurseReward: true
  },
  {
    id: "gale_gravity",
    name: "烈風の重力",
    icon: "swap_calls",
    type: "skill",
    cost: 5,
    costLevels: true,
    action: "gale_gravity",
    params: { duration: 1 },
    values: [2, 3, 4],
    rarity: 3,
    price: 26,
    desc: "１ターンの間、ドロップの落下方向が「右」に変化する（レベルアップで「左」も選択可能）。さらに基礎コンボ数が{values}倍になる。消費E:{cost}",
    attributes: [],
    canBeInitial: false,
    canBeCurseReward: true
  },
  // --- スロット1専用: 指揮・先導・号令 ---
  {
    id: "magical_leadership",
    name: "魔導教陣の指揮",
    icon: "leaderboard",
    type: "passive",
    effect: "magical_leadership",
    values: [1, 2, 3],
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。装備しているすべての「アクティブスキル」の消費エネルギーが -[1/2/3] される（最小1）。さらに、スキル使用時に10%の確率でエネルギーを消費しない。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "lead_fire",
    name: "炎王の先導",
    icon: "local_fire_department",
    type: "passive",
    effect: "element_lead",
    params: { color: "fire" },
    values: [2],
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。装備しているすべての炎属性の「パッシブスキル」の効果は2度発動する。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "lead_water",
    name: "蒼海の軍師",
    icon: "water_drop",
    type: "passive",
    effect: "element_lead",
    params: { color: "water" },
    values: [2],
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。装備しているすべての雨属性の「パッシブスキル」の効果は2度発動する。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "lead_wood",
    name: "深翠の導き手",
    icon: "forest",
    type: "passive",
    effect: "element_lead",
    params: { color: "wood" },
    values: [2],
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。装備しているすべての風属性の「パッシブスキル」の効果は2度発動する。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "lead_light",
    name: "迅雷の先導",
    icon: "bolt",
    type: "passive",
    effect: "element_lead",
    params: { color: "light" },
    values: [2],
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。装備しているすべての雷属性の「パッシブスキル」の効果は2度発動する。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "lead_dark",
    name: "常闇の先導",
    icon: "nights_stay",
    type: "passive",
    effect: "element_lead",
    params: { color: "dark" },
    values: [2],
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。装備しているすべての月属性の「パッシブスキル」の効果は2度発動する。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "lead_heart",
    name: "慈愛の先導",
    icon: "favorite",
    type: "passive",
    effect: "element_lead",
    params: { color: "heart" },
    values: [2],
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。装備しているすべての回復属性の「パッシブスキル」の効果は2度発動する。",
    attributes: ["heart"],
    canBeInitial: true
  },
  {
    id: "tyrant_decree",
    name: "暴君の号令",
    icon: "gavel",
    type: "passive",
    effect: "tyrant_decree",
    rarity: 3,
    price: 31,
    desc: "スロットの1番目に装備している時のみ、効果が発動する。操作時間が「常に2秒」になる代わりに、盤面がすべて強化（プラス）ドロップとして降ってくるようになる。",
    attributes: [],
    canBeInitial: true
  },

  // --- 新パッシブ: 〜の錬金術 ---
  {
    id: "passive_alchemy_fire",
    name: "炎の錬金術",
    icon: "science",
    type: "passive",
    effect: "alchemy",
    params: { color: "fire" },
    values: [3, 5, 10],
    rarity: 2,
    price: 20,
    desc: "アクティブスキルによって炎が生成・変換された時、プラスに。さらに[3/5/10]%の確率でボム/リピート/スタードロップになる。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "passive_alchemy_water",
    name: "雨の錬金術",
    icon: "science",
    type: "passive",
    effect: "alchemy",
    params: { color: "water" },
    values: [3, 5, 10],
    rarity: 2,
    price: 20,
    desc: "アクティブスキルによって雨が生成・変換された時、プラスに。さらに[3/5/10]%の確率でボム/リピート/スタードロップになる。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "passive_alchemy_wood",
    name: "風の錬金術",
    icon: "science",
    type: "passive",
    effect: "alchemy",
    params: { color: "wood" },
    values: [3, 5, 10],
    rarity: 2,
    price: 20,
    desc: "アクティブスキルによって風が生成・変換された時、プラスに。さらに[3/5/10]%の確率でボム/リピート/スタードロップになる。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "passive_alchemy_light",
    name: "雷の錬金術",
    icon: "science",
    type: "passive",
    effect: "alchemy",
    params: { color: "light" },
    values: [3, 5, 10],
    rarity: 2,
    price: 20,
    desc: "アクティブスキルによって雷が生成・変換された時、プラスに。さらに[3/5/10]%の確率でボム/リピート/スタードロップになる。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "passive_alchemy_dark",
    name: "月の錬金術",
    icon: "science",
    type: "passive",
    effect: "alchemy",
    params: { color: "dark" },
    values: [3, 5, 10],
    rarity: 2,
    price: 20,
    desc: "アクティブスキルによって月が生成・変換された時、プラスに。さらに[3/5/10]%の確率でボム/リピート/スタードロップになる。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "passive_alchemy_heart",
    name: "心の錬金術",
    icon: "science",
    type: "passive",
    effect: "alchemy",
    params: { color: "heart" },
    values: [3, 5, 10],
    rarity: 2,
    price: 20,
    desc: "アクティブスキルによってハートが生成・変換された時、プラスに。さらに[3/5/10]%の確率でボム/リピート/スタードロップになる。",
    attributes: ["heart"],
    canBeInitial: true
  },

  // --- 新アクティブ: 残滓（テンポコントロール） ---
  {
    id: "active_residual_wood",
    name: "烈風の残滓",
    icon: "wind_power",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "residual_wind",
    params: { color: "wood" },
    values: [1.0, 2.0, 3.0],
    effectValues: [1.5, 2.0, 2.5],
    rarity: 2,
    price: 20,
    desc: "スキル使用ターンに風を10個以上消すと、次のターン操作時間+[1.0/2.0/3.0]秒、基礎コンボ[1.5/2.0/2.5]倍。消費E:{cost}",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "active_residual_light",
    name: "迅雷の残滓",
    icon: "bolt",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "residual_thunder",
    params: { color: "light" },
    values: [1.0, 2.0, 3.0],
    effectValues: [1.5, 2.0, 2.5],
    rarity: 2,
    price: 20,
    desc: "スキル使用ターンに雷を10個以上消すと、次のターン操作時間+[1.0/2.0/3.0]秒、基礎コンボ[1.5/2.0/2.5]倍。消費E:{cost}",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "active_residual_fire",
    name: "業火の残滓",
    icon: "local_fire_department",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "residual_fire",
    params: { color: "fire" },
    values: [1.0, 2.0, 3.0],
    effectValues: [1.0, 1.5, 2.0],
    rarity: 2,
    price: 20,
    desc: "このターン炎がマッチしても消えなくなる。次のターン操作時間+[1.0/2.0/3.0]秒、炎消去数×[1.0/1.5/2.0]倍コンボ倍率加算。消費E:{cost}",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "active_residual_water",
    name: "蒼海の残滓",
    icon: "water_drop",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "residual_water",
    params: { color: "water" },
    values: [1.0, 2.0, 3.0],
    effectValues: [1.0, 1.5, 2.0],
    rarity: 2,
    price: 20,
    desc: "このターン雨がマッチしても消えなくなる。次のターン操作時間+[1.0/2.0/3.0]秒、雨消去数×[1.0/1.5/2.0]倍コンボ倍率加算。消費E:{cost}",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "active_residual_dark",
    name: "月の残滓",
    icon: "nightlight_round",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "residual_dark",
    params: { color: "dark" },
    values: [1.0, 2.0, 3.0],
    effectValues: [10, 15, 20],
    rarity: 2,
    price: 20,
    desc: "スキル使用ターンに月の消去数10個以下の時発動。次のターン操作時間+[1.0/2.0/3.0]秒、月消去時追加コンボ+[10/15/20]。消費E:{cost}",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "active_residual_heart",
    name: "心の残滓",
    icon: "favorite",
    type: "skill",
    cost: 4,
    costLevels: true,
    action: "residual_heart",
    params: { color: "heart" },
    values: [1.0, 2.0, 3.0],
    effectValues: [10, 15, 20],
    rarity: 2,
    price: 20,
    desc: "スキル使用ターンに回復の消去数10個以下の時発動。次のターン操作時間+[1.0/2.0/3.0]秒、回復消去時追加コンボ+[10/15/20]。消費E:{cost}",
    attributes: ["heart"],
    canBeInitial: true
  },

  // --- 新パッシブ: 特殊ドロップ連鎖 ---
  {
    id: "passive_chain_explosion",
    name: "爆炎の連鎖",
    icon: "layers",
    type: "passive",
    effect: "chain_explosion",
    values: [0.20, 0.30, 0.50],
    rarity: 2,
    price: 20,
    desc: "ボム爆発時、[20/30/50]%の確率で、消えたドロップ（通常）をターン終了後に再生成します（最大30個）。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "passive_meteor_shower",
    name: "流星群",
    icon: "auto_awesome",
    type: "passive",
    effect: "meteor_shower",
    values: [0.30, 0.50, 0.70],
    rarity: 2,
    price: 20,
    desc: "スタードロップ消去時、[30/50/70]%の確率で、消えた個数分「次に降ってくるドロップ」をスターにします。",
    attributes: [],
    canBeInitial: true
  },
  {
    id: "passive_repeat_regeneration",
    name: "再再生",
    icon: "replay",
    type: "passive",
    effect: "repeat_regeneration",
    values: [0.30, 0.50, 0.70],
    rarity: 2,
    price: 20,
    desc: "リピートドロップ消去時、[30/50/70]%の確率で、そのターン終了後にリピートドロップを1つ再生成します。",
    attributes: [],
    canBeInitial: true
  },

  // --- 新パッシブ: 属性の誓約 ---
  {
    id: "passive_contract_fire",
    name: "業火の誓約",
    icon: "gavel",
    type: "passive",
    effect: "element_contract",
    params: { color: "fire" },
    values: [3, 5, 8],
    rarity: 2,
    price: 20,
    desc: "炎ドロップを消すと基礎コンボ数[3/5/8]倍。雨ドロップを1コンボでも消すと、そのターンの基礎コンボ数が半分になる（両方消すと半分）。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "passive_contract_water",
    name: "蒼海の誓約",
    icon: "gavel",
    type: "passive",
    effect: "element_contract",
    params: { color: "water" },
    values: [3, 5, 8],
    rarity: 2,
    price: 20,
    desc: "雨ドロップを消すと基礎コンボ数[3/5/8]倍。炎ドロップを1コンボでも消すと、そのターンの基礎コンボ数が半分になる（両方消すと半分）。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "passive_contract_wood",
    name: "翠風の誓約",
    icon: "gavel",
    type: "passive",
    effect: "element_contract",
    params: { color: "wood" },
    values: [3, 5, 8],
    rarity: 2,
    price: 20,
    desc: "風ドロップを消すと基礎コンボ数[3/5/8]倍。雷ドロップを1コンボでも消すと、そのターンの基礎コンボ数が半分になる（両方消すと半分）。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "passive_contract_light",
    name: "狂雷の誓約",
    icon: "gavel",
    type: "passive",
    effect: "element_contract",
    params: { color: "light" },
    values: [3, 5, 8],
    rarity: 2,
    price: 20,
    desc: "雷ドロップを消すと基礎コンボ数[3/5/8]倍。風ドロップを1コンボでも消すと、そのターンの基礎コンボ数が半分になる（両方消すと半分）。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "passive_contract_dark",
    name: "常闇の誓約",
    icon: "gavel",
    type: "passive",
    effect: "element_contract",
    params: { color: "dark" },
    values: [3, 5, 8],
    rarity: 2,
    price: 20,
    desc: "月ドロップを消すと基礎コンボ数[3/5/8]倍。回復ドロップを1コンボでも消すと、そのターンの基礎コンボ数が半分になる（両方消すと半分）。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "passive_contract_heart",
    name: "慈愛の誓約",
    icon: "gavel",
    type: "passive",
    effect: "element_contract",
    params: { color: "heart" },
    values: [3, 5, 8],
    rarity: 2,
    price: 20,
    desc: "回復ドロップを消すと基礎コンボ数[3/5/8]倍。月ドロップを1コンボでも消すと、そのターンの基礎コンボ数が半分になる（両方消すと半分）。",
    attributes: ["heart"],
    canBeInitial: true
  },

  // --- 新アクティブ: 冷静 ---
  {
    id: "active_calm",
    name: "冷静",
    icon: "psychology",
    type: "skill",
    cost: 3,
    costLevels: false,
    action: "calm",
    rarity: 2,
    price: 17,
    desc: "発動後、残り手番を+1する。さらにこのターン、ドロップを揃えても消えなくなり、0コンボとして処理される。消費E:{cost}",
    attributes: [],
    canBeInitial: true
  },

  // --- 新パッシブ: 〜の手 ---
  {
    id: "passive_hand_fire",
    name: "炎の手",
    icon: "front_hand",
    type: "passive",
    effect: "finger_transform_passive",
    params: { color: "fire", limit: 4 },
    rarity: 2,
    price: 20,
    desc: "なぞり操作開始から最初にずらした4つのドロップを炎ドロップに変化させる。",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "passive_hand_water",
    name: "雨の手",
    icon: "front_hand",
    type: "passive",
    effect: "finger_transform_passive",
    params: { color: "water", limit: 4 },
    rarity: 2,
    price: 20,
    desc: "なぞり操作開始から最初にずらした4つのドロップを雨ドロップに変化させる。",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "passive_hand_wood",
    name: "風の手",
    icon: "front_hand",
    type: "passive",
    effect: "finger_transform_passive",
    params: { color: "wood", limit: 4 },
    rarity: 2,
    price: 20,
    desc: "なぞり操作開始から最初にずらした4つのドロップを風ドロップに変化させる。",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "passive_hand_light",
    name: "雷の手",
    icon: "front_hand",
    type: "passive",
    effect: "finger_transform_passive",
    params: { color: "light", limit: 4 },
    rarity: 2,
    price: 20,
    desc: "なぞり操作開始から最初にずらした4つのドロップを雷ドロップに変化させる。",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "passive_hand_dark",
    name: "月の手",
    icon: "front_hand",
    type: "passive",
    effect: "finger_transform_passive",
    params: { color: "dark", limit: 4 },
    rarity: 2,
    price: 20,
    desc: "なぞり操作開始から最初にずらした4つのドロップを月ドロップに変化させる。",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "passive_hand_heart",
    name: "心の手",
    icon: "front_hand",
    type: "passive",
    effect: "finger_transform_passive",
    params: { color: "heart", limit: 4 },
    rarity: 2,
    price: 20,
    desc: "なぞり操作開始から最初にずらした4つのドロップを回復ドロップに変化させる。",
    attributes: ["heart"],
    canBeInitial: true
  },

  // --- 新アクティブ: 〜の指 ---
  {
    id: "active_finger_fire",
    name: "炎の指",
    icon: "back_hand",
    type: "skill",
    cost: 3,
    costLevels: true,
    levelsConfig: [3, 2, 1],
    action: "finger_transform_active",
    params: { color: "fire", limit: 6 },
    rarity: 2,
    price: 20,
    desc: "このターン、なぞり操作開始から最初にずらした6つのドロップを炎ドロップに変化させる。消費E:{cost}",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "active_finger_water",
    name: "雨の指",
    icon: "back_hand",
    type: "skill",
    cost: 3,
    costLevels: true,
    levelsConfig: [3, 2, 1],
    action: "finger_transform_active",
    params: { color: "water", limit: 6 },
    rarity: 2,
    price: 20,
    desc: "このターン、なぞり操作開始から最初にずらした6つのドロップを雨ドロップに変化させる。消費E:{cost}",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "active_finger_wood",
    name: "風の指",
    icon: "back_hand",
    type: "skill",
    cost: 3,
    costLevels: true,
    levelsConfig: [3, 2, 1],
    action: "finger_transform_active",
    params: { color: "wood", limit: 6 },
    rarity: 2,
    price: 20,
    desc: "このターン、なぞり操作開始から最初にずらした6つのドロップを風ドロップに変化させる。消費E:{cost}",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "active_finger_light",
    name: "雷の指",
    icon: "back_hand",
    type: "skill",
    cost: 3,
    costLevels: true,
    levelsConfig: [3, 2, 1],
    action: "finger_transform_active",
    params: { color: "light", limit: 6 },
    rarity: 2,
    price: 20,
    desc: "このターン、なぞり操作開始から最初にずらした6つのドロップを雷ドロップに変化させる。消費E:{cost}",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "active_finger_dark",
    name: "月の指",
    icon: "back_hand",
    type: "skill",
    cost: 3,
    costLevels: true,
    levelsConfig: [3, 2, 1],
    action: "finger_transform_active",
    params: { color: "dark", limit: 6 },
    rarity: 2,
    price: 20,
    desc: "このターン、なぞり操作開始から最初にずらした6つのドロップを月ドロップに変化させる。消費E:{cost}",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "active_finger_heart",
    name: "心の指",
    icon: "back_hand",
    type: "skill",
    cost: 3,
    costLevels: true,
    levelsConfig: [3, 2, 1],
    action: "finger_transform_active",
    params: { color: "heart", limit: 6 },
    rarity: 2,
    price: 20,
    desc: "このターン、なぞり操作開始から最初にずらした6つのドロップを回復ドロップに変化させる。消費E:{cost}",
    attributes: ["heart"],
    canBeInitial: true
  },

  // --- 新アクティブ: 〜の魔指 ---
  {
    id: "active_magic_finger_fire",
    name: "炎の魔指",
    icon: "back_hand",
    type: "skill",
    cost: 5,
    costLevels: true,
    levelsConfig: [5, 4, 3],
    action: "finger_transform_active",
    params: { color: "fire", limit: 9 },
    rarity: 3,
    price: 26,
    desc: "このターン、なぞり操作開始から最初にずらした9つのドロップを炎ドロップに変化させる。消費E:{cost}",
    attributes: ["fire"],
    canBeInitial: true
  },
  {
    id: "active_magic_finger_water",
    name: "雨の魔指",
    icon: "back_hand",
    type: "skill",
    cost: 5,
    costLevels: true,
    levelsConfig: [5, 4, 3],
    action: "finger_transform_active",
    params: { color: "water", limit: 9 },
    rarity: 3,
    price: 26,
    desc: "このターン、なぞり操作開始から最初にずらした9つのドロップを雨ドロップに変化させる。消費E:{cost}",
    attributes: ["water"],
    canBeInitial: true
  },
  {
    id: "active_magic_finger_wood",
    name: "風の魔指",
    icon: "back_hand",
    type: "skill",
    cost: 5,
    costLevels: true,
    levelsConfig: [5, 4, 3],
    action: "finger_transform_active",
    params: { color: "wood", limit: 9 },
    rarity: 3,
    price: 26,
    desc: "このターン、なぞり操作開始から最初にずらした9つのドロップを風ドロップに変化させる。消費E:{cost}",
    attributes: ["wood"],
    canBeInitial: true
  },
  {
    id: "active_magic_finger_light",
    name: "雷の魔指",
    icon: "back_hand",
    type: "skill",
    cost: 5,
    costLevels: true,
    levelsConfig: [5, 4, 3],
    action: "finger_transform_active",
    params: { color: "light", limit: 9 },
    rarity: 3,
    price: 26,
    desc: "このターン、なぞり操作開始から最初にずらした9つのドロップを雷ドロップに変化させる。消費E:{cost}",
    attributes: ["light"],
    canBeInitial: true
  },
  {
    id: "active_magic_finger_dark",
    name: "月の魔指",
    icon: "back_hand",
    type: "skill",
    cost: 5,
    costLevels: true,
    levelsConfig: [5, 4, 3],
    action: "finger_transform_active",
    params: { color: "dark", limit: 9 },
    rarity: 3,
    price: 26,
    desc: "このターン、なぞり操作開始から最初にずらした9つのドロップを月ドロップに変化させる。消費E:{cost}",
    attributes: ["dark"],
    canBeInitial: true
  },
  {
    id: "active_magic_finger_heart",
    name: "心の魔指",
    icon: "back_hand",
    type: "skill",
    cost: 5,
    costLevels: true,
    levelsConfig: [5, 4, 3],
    action: "finger_transform_active",
    params: { color: "heart", limit: 9 },
    rarity: 3,
    price: 26,
    desc: "このターン、なぞり操作開始から最初にずらした9つのドロップを回復ドロップに変化させる。消費E:{cost}",
    attributes: ["heart"],
    canBeInitial: true
  },
  // --- 新規パッシブスキル ---
  {
    id: "devotion_fire",
    name: "狂神の偏愛 (炎)",
    icon: "favorite",
    type: "passive",
    values: [4, 7, 12],
    rarity: 3,
    price: 26,
    desc: "炎以外の属性を消すと獲得コンボが0になるが、炎のみを消したターンの基礎コンボ数が{values}倍になる。",
    attributes: ["fire"]
  },
  {
    id: "devotion_water",
    name: "狂神の偏愛 (雨)",
    icon: "favorite",
    type: "passive",
    values: [4, 7, 12],
    rarity: 3,
    price: 26,
    desc: "雨以外の属性を消すと獲得コンボが0になるが、雨のみを消したターンの基礎コンボ数が{values}倍になる。",
    attributes: ["water"]
  },
  {
    id: "magic_reflux_light",
    name: "魔力還流・雷",
    icon: "autorenew",
    type: "passive",
    values: [1, 2, 3],
    rarity: 2,
    price: 15,
    desc: "1ターンに雷ドロップを15個以上消すと、発動中の全アクティブスキルの効果持続手番が+{values}される。",
    attributes: ["light"]
  },
  {
    id: "magic_reflux_heart",
    name: "魔力還流・心",
    icon: "autorenew",
    type: "passive",
    values: [1, 2, 3],
    rarity: 2,
    price: 15,
    desc: "1ターンにハートドロップを15個以上消すと、発動中の全アクティブスキルの効果持続手番が+{values}される。",
    attributes: ["heart"]
  },
  // --- 新規アクティブスキル ---
  {
    id: "active_shape_len4",
    name: "四重奏の響き",
    icon: "grid_view",
    type: "skill",
    cost: 4,
    action: "buff_len4_mult",
    params: { duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2ターンの間、4個同時消しの数分コンボ倍率にプラス。消費E:{cost}",
    attributes: []
  },
  {
    id: "active_shape_row",
    name: "烈線の陣",
    icon: "view_stream",
    type: "skill",
    cost: 4,
    action: "buff_row_mult",
    params: { duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2ターンの間、横一列消しの数×2分コンボ倍率にプラス。消費E:{cost}",
    attributes: []
  },
  {
    id: "active_shape_l_shape",
    name: "屈折の魔角",
    icon: "turned_in",
    type: "skill",
    cost: 4,
    action: "buff_l_shape_mult",
    params: { duration: 2 },
    rarity: 2,
    price: 15,
    desc: "2ターンの間、L字消しの数分コンボ倍率にプラス。消費E:{cost}",
    attributes: []
  },
  {
    id: "active_shape_cross",
    name: "聖十字の導き",
    icon: "add",
    type: "skill",
    cost: 5,
    action: "buff_cross_mult",
    params: { duration: 2 },
    rarity: 3,
    price: 20,
    desc: "2ターンの間、基礎コンボ倍率を『十字消しの数プラス1』倍する。消費E:{cost}",
    attributes: []
  },
  {
    id: "active_shape_square",
    name: "魔方陣の極意",
    icon: "crop_square",
    type: "skill",
    cost: 5,
    action: "buff_square_mult",
    params: { duration: 2 },
    rarity: 3,
    price: 20,
    desc: "2ターンの間、基礎コンボ倍率を『正方形消しの数×3』倍する（1個以上消去時）。消費E:{cost}",
    attributes: []
  },
  {
    id: "star_cross_boost",
    name: "明星の十字架",
    icon: "grade",
    type: "passive",
    effect: "star_cross_boost",
    values: [3, 5, 10],
    rarity: 2,
    price: 8,
    desc: "十字消しを構成するドロップにスタードロップが含まれる場合、ターン獲得スター量が{values}倍になる。",
    attributes: []
  },
  {
    id: "four_match_restriction",
    name: "四連の制約",
    icon: "adjust",
    type: "passive",
    effect: "four_match_restriction",
    rarity: 3,
    price: 10,
    desc: "ドロップを4つ消しでしか消せなくなるが、基礎コンボ数が4つ消しをした回数倍される。",
    attributes: []
  },
  {
    id: "row_match_restriction",
    name: "横列の制約",
    icon: "menu",
    type: "passive",
    effect: "row_match_restriction",
    rarity: 3,
    price: 10,
    desc: "ドロップを横1列消しでしか消せなくなるが、基礎コンボ数が横1列消しをした回数倍される。",
    attributes: []
  },
  {
    id: "active_square_judgment",
    name: "方陣の審判",
    icon: "gavel",
    type: "skill",
    cost: 6,
    action: "buff_square_judgment",
    params: { duration: 1 },
    rarity: 3,
    price: 30,
    desc: "1手番、基礎コンボ数を10倍にする。しかし、正方形消しをしてなければ基礎コンボ数を4分の1にする。消費E:{cost}",
    attributes: []
  }
];

export { ALL_TOKEN_BASES };

