// 二つ名（称号）システム マスターデータ定義

// A枠パーツ（接頭辞）データリスト
export const PREFIX_TITLES = [
  {
    id: "p_speed",
    name: "神速の",
    category: "操作時間",
    desc: "操作時間 +2秒",
    conditionType: "time_left_turn_end",
    targetValue: 3,
    conditionDesc: "操作時間を3秒以上残してターン終了",
    effect: { type: "time_add", value: 2000 }
  },
  {
    id: "p_berserk",
    name: "狂戦士の",
    category: "リスク・火力",
    desc: "操作時間 -2秒、基礎コンボ数 1.5倍",
    conditionType: "time_limit_cycle_clear",
    targetValue: 2,
    conditionDesc: "操作時間2秒以下でサイクルクリア",
    effect: { type: "berserk", time_add: -2000, base_multiplier: 1.5 }
  },
  {
    id: "p_desperate",
    name: "背水の",
    category: "リスク・固定",
    desc: "操作時間4秒固定、基礎コンボ数 1.3倍",
    conditionType: "cycles_cleared_total",
    targetValue: 10,
    conditionDesc: "累計10サイクルクリア",
    effect: { type: "time_fix", fixedTime: 4000, base_multiplier: 1.3 }
  },
  {
    id: "p_fire",
    name: "紅蓮の",
    category: "属性（炎）",
    desc: "炎ドロップ出現率UP、炎コンボ倍率 +1.5",
    conditionType: "color_erase_total",
    targetColor: "fire",
    targetValue: 500,
    conditionDesc: "炎ドロップを累計500個消去",
    effect: { type: "color_multiplier", color: "fire", value: 1.5, skyfallWeight: 2.0 }
  },
  {
    id: "p_water",
    name: "蒼海の",
    category: "属性（雨）",
    desc: "雨ドロップ出現率UP、雨コンボ倍率 +1.5",
    conditionType: "color_erase_total",
    targetColor: "water",
    targetValue: 500,
    conditionDesc: "雨ドロップを累計500個消去",
    effect: { type: "color_multiplier", color: "water", value: 1.5, skyfallWeight: 2.0 }
  },
  {
    id: "p_wood",
    name: "深翠の",
    category: "属性（風）",
    desc: "風ドロップ出現率UP、風コンボ倍率 +1.5",
    conditionType: "color_erase_total",
    targetColor: "wood",
    targetValue: 500,
    conditionDesc: "風ドロップを累計500個消去",
    effect: { type: "color_multiplier", color: "wood", value: 1.5, skyfallWeight: 2.0 }
  },
  {
    id: "p_light",
    name: "迅雷の",
    category: "属性（雷）",
    desc: "雷ドロップ出現率UP、雷コンボ倍率 +1.5",
    conditionType: "color_erase_total",
    targetColor: "light",
    targetValue: 500,
    conditionDesc: "雷ドロップを累計500個消去",
    effect: { type: "color_multiplier", color: "light", value: 1.5, skyfallWeight: 2.0 }
  },
  {
    id: "p_dark",
    name: "常月の",
    category: "属性（月）",
    desc: "月ドロップ出現率UP、月コンボ倍率 +1.5",
    conditionType: "color_erase_total",
    targetColor: "dark",
    targetValue: 500,
    conditionDesc: "月ドロップを累計500個消去",
    effect: { type: "color_multiplier", color: "dark", value: 1.5, skyfallWeight: 2.0 }
  },
  {
    id: "p_heart",
    name: "慈愛の",
    category: "属性（心）",
    desc: "ハート出現率UP、回復コンボ加算 +10",
    conditionType: "color_erase_total",
    targetColor: "heart",
    targetValue: 300,
    conditionDesc: "ハートドロップを累計300個消去",
    effect: { type: "heart_boost", bonusCombo: 10, skyfallWeight: 2.0 }
  },
  {
    id: "p_gold",
    name: "黄金の",
    category: "経済",
    desc: "ゲーム開始時の初期スター +30",
    conditionType: "star_earned_single_run",
    targetValue: 100,
    conditionDesc: "1回のゲームで累計100スター獲得",
    effect: { type: "initial_stars_add", value: 30 }
  },
  {
    id: "p_empty",
    name: "からっぽの",
    category: "経済・逆境",
    desc: "所持スター0の時、コンボ倍率 +3.0",
    conditionType: "zero_star_cycle_clear",
    targetValue: 1,
    conditionDesc: "所持スター0でサイクルクリア",
    effect: { type: "zero_star_multiplier", value: 3.0 }
  },
  {
    id: "p_forbidden",
    name: "禁忌の",
    category: "制限",
    desc: "落ちコン停止、基礎コンボ数 1.4倍",
    conditionType: "no_skyfall_combos_total",
    targetValue: 100,
    conditionDesc: "落ちコンなしで通算100コンボ達成",
    effect: { type: "no_skyfall", base_multiplier: 1.4 }
  },
  {
    id: "p_curse",
    name: "厄災の",
    category: "呪い連携",
    desc: "装備中の呪い1つにつきコンボ倍率 +1.5",
    conditionType: "curses_equipped_simultaneous",
    targetValue: 3,
    conditionDesc: "呪いトークンを3つ同時に装備",
    effect: { type: "curse_multiplier", valuePerCurse: 1.5 }
  },
  {
    id: "p_stroke",
    name: "一筆の",
    category: "パズル",
    desc: "1手移動距離30マス以上でコンボ加算 +20",
    conditionType: "move_distance_single",
    targetValue: 50,
    conditionDesc: "1手で50マス以上移動してクリア",
    effect: { type: "stroke_bonus", minDistance: 30, bonusCombo: 20 }
  },
  {
    id: "p_first",
    name: "先制の",
    category: "ターン制限",
    desc: "各サイクルの1手目のみコンボ倍率 2.0倍",
    conditionType: "first_turn_cycle_clear",
    targetValue: 1,
    conditionDesc: "サイクルの1手目で目標達成",
    effect: { type: "first_turn_mult", value: 2.0 }
  },
  {
    id: "p_solo",
    name: "孤高の",
    category: "装備制限",
    desc: "トークン装備数3個以下でコンボ倍率 +2.5",
    conditionType: "solo_cycle3_clear",
    targetValue: 1,
    conditionDesc: "トークン3個以下でサイクル3突破",
    effect: { type: "solo_multiplier", maxTokens: 3, value: 2.5 }
  },
  {
    id: "p_chant_f",
    name: "紅蓮の詠唱",
    category: "スキル効率",
    desc: "炎属性スキルの消費エネルギーが常時 -1",
    conditionType: "fire_skill_converted_total",
    targetValue: 100,
    conditionDesc: "炎スキルで累計100個変換",
    effect: { type: "skill_cost_sub", color: "fire", value: 1 }
  },
  {
    id: "p_merchant",
    name: "密売人の",
    category: "ショップ",
    desc: "呪いトークン売却時、逆に +20スター獲得",
    conditionType: "curse_sold_total",
    targetValue: 3,
    conditionDesc: "呪いトークンを累計3回売却",
    effect: { type: "curse_sell_star", value: 20 }
  },
  {
    id: "p_master",
    name: "先達の",
    category: "育成",
    desc: "初期所持トークンが最初から Lv2 スタート",
    conditionType: "token_levelup_total",
    targetValue: 20,
    conditionDesc: "トークンレベルアップ累計20回",
    effect: { type: "initial_token_level", level: 2 }
  },
  {
    id: "p_amp",
    name: "増幅の",
    category: "効果拡張",
    desc: "全パッシブトークンの効果値が 1.3倍化",
    conditionType: "passive_combo_add_single",
    targetValue: 50,
    conditionDesc: "パッシブ効果のみでコンボ加算+50",
    effect: { type: "passive_amp", value: 1.3 }
  },
  {
    id: "p_bias",
    name: "偏愛の",
    category: "出現率操作",
    desc: "指定1属性の出現率が 50% 以上に急増",
    conditionType: "mono_color_board_count",
    targetValue: 20,
    conditionDesc: "単一属性で盤面20個以上埋める",
    effect: { type: "bias_skyfall", rate: 0.5 }
  },
  {
    id: "p_destroyer",
    name: "消滅者の",
    category: "累積消去",
    desc: "基礎コンボ数が 1.5倍 に強化",
    conditionType: "drops_erased_total",
    targetValue: 10000,
    conditionDesc: "ドロップを累計 10,000個 消去",
    effect: { type: "base_multiplier_add", value: 1.5 }
  },
  {
    id: "p_full",
    name: "満載の",
    category: "スロット",
    desc: "トークンスロット6個全埋めで基礎数 1.4倍",
    conditionType: "token_slots_full",
    targetValue: 6,
    conditionDesc: "トークンスロットを6個全埋めする",
    effect: { type: "full_slot_base_mult", value: 1.4 }
  },
  {
    id: "p_regular",
    name: "常連の",
    category: "ショップ",
    desc: "ショップの品揃え枠が常時 +1枠 増える",
    conditionType: "shop_visited_total",
    targetValue: 20,
    conditionDesc: "ショップ訪問回数累計20回",
    effect: { type: "shop_slots_add", value: 1 }
  }
];

// B枠パーツ（接尾辞）データリスト
export const SUFFIX_TITLES = [
  {
    id: "s_king",
    name: "覇王",
    category: "倍率強化",
    desc: "最終コンボ倍率 +2.0",
    conditionType: "max_combo_single",
    targetValue: 50,
    conditionDesc: "1手番で 50コンボ 達成",
    effect: { type: "combo_multiplier_add", value: 2.0 }
  },
  {
    id: "s_flash",
    name: "閃光",
    category: "時間・速度",
    desc: "手番終了時、残り操作時間1秒につき倍率 +0.3",
    conditionType: "time_left_turn_end",
    targetValue: 2,
    conditionDesc: "操作時間を2秒以上残してターン終了",
    effect: { type: "time_left_bonus", value: 0.3 }
  },
  {
    id: "s_collector",
    name: "収集家",
    category: "経済",
    desc: "★（スター）獲得に必要なコンボ数 -1",
    conditionType: "star_earned_total",
    targetValue: 50,
    conditionDesc: "★を累計50回獲得",
    effect: { type: "star_threshold_sub", value: 1 }
  },
  {
    id: "s_mage",
    name: "魔導士",
    category: "スキル",
    desc: "全アクティブスキルの初期エネルギー +2",
    conditionType: "skill_used_total",
    targetValue: 30,
    conditionDesc: "スキルを累計30回使用",
    effect: { type: "initial_skill_energy", value: 2 }
  },
  {
    id: "s_square_p",
    name: "方陣師",
    category: "特殊消し",
    desc: "全特殊消し（十字・L字等）ボーナス 1.5倍",
    conditionType: "special_shape_erase_total",
    targetValue: 50,
    conditionDesc: "特殊消しを累計50回達成",
    effect: { type: "shape_bonus_multiplier", value: 1.5 }
  },
  {
    id: "s_seeker",
    name: "探求者",
    category: "加算強化",
    desc: "すべてのコンボ加算値（+N）の効果 1.5倍",
    conditionType: "total_combo_add_achieved",
    targetValue: 100,
    conditionDesc: "コンボ加算の合計が+100達成",
    effect: { type: "combo_add_amp", value: 1.5 }
  },
  {
    id: "s_alchemist",
    name: "錬金術士",
    category: "盤面強化",
    desc: "降ってくるドロップの 10% が強化ドロップ化",
    conditionType: "enhanced_drops_erased_total",
    targetValue: 100,
    conditionDesc: "強化ドロップを累計100個消去",
    effect: { type: "enhanced_skyfall_rate", rate: 0.1 }
  },
  {
    id: "s_rich",
    name: "大富豪",
    category: "経済・利息",
    desc: "サイクルクリア時、所持スターの 10% 獲得",
    conditionType: "stars_held_max",
    targetValue: 200,
    conditionDesc: "所持スター 200以上 達成",
    effect: { type: "interest_rate", rate: 0.1 }
  },
  {
    id: "s_unmatched",
    name: "無双",
    category: "基礎数強化",
    desc: "基礎コンボ数 1.3倍",
    conditionType: "base_combo_single",
    targetValue: 30,
    conditionDesc: "1手で基礎コンボ30達成",
    effect: { type: "base_multiplier_add", value: 1.3 }
  },
  {
    id: "s_thrifty",
    name: "節約家",
    category: "ショップ",
    desc: "ショップの商品価格が全品 20% 引き",
    conditionType: "shop_purchases_total",
    targetValue: 10,
    conditionDesc: "ショップで10回購入",
    effect: { type: "shop_discount", rate: 0.2 }
  },
  {
    id: "s_frenzy",
    name: "狂乱者",
    category: "スキル",
    desc: "スキル使用時、20%の確率でエネルギー還元",
    conditionType: "skills_used_single_turn",
    targetValue: 3,
    conditionDesc: "1手番でスキルを3回使用",
    effect: { type: "skill_energy_refund", chance: 0.2 }
  },
  {
    id: "s_star_gazer",
    name: "星詠み",
    category: "特殊ドロップ",
    desc: "降ってくるドロップの 5% がスタードロップ化",
    conditionType: "star_drops_erased_total",
    targetValue: 30,
    conditionDesc: "スタードロップを累計30個消去",
    effect: { type: "star_drop_skyfall_rate", rate: 0.05 }
  },
  {
    id: "s_expert",
    name: "見切り屋",
    category: "ショップ",
    desc: "ショップのリロール（更新）価格が 2★固定",
    conditionType: "rerolls_performed_total",
    targetValue: 5,
    conditionDesc: "ショップでリロールを5回実行",
    effect: { type: "fixed_reroll_price", price: 2 }
  },
  {
    id: "s_slayer",
    name: "討伐者",
    category: "ボス特化",
    desc: "各サイクルの最終手番（ボス戦）で倍率 +4.0",
    conditionType: "bosses_defeated_total",
    targetValue: 5,
    conditionDesc: "ボスを累計5体撃破",
    effect: { type: "boss_turn_multiplier", value: 4.0 }
  },
  {
    id: "s_tuner",
    name: "調律師",
    category: "盤面",
    desc: "降ってくるドロップの全属性出現確率が均等化",
    conditionType: "five_colors_simultaneous_erase",
    targetValue: 1,
    conditionDesc: "5属性を同時に消す",
    effect: { type: "balanced_skyfall" }
  },
  {
    id: "s_leader",
    name: "統率者",
    category: "属性統一",
    desc: "同属性トークン3個以上装備でコンボ倍率 +2.5",
    conditionType: "mono_attribute_tokens_equipped",
    targetValue: 3,
    conditionDesc: "単一属性でトークンを揃える",
    effect: { type: "mono_token_mult", count: 3, value: 2.5 }
  },
  {
    id: "s_quick_charge",
    name: "即応陣",
    category: "スキルチャージ",
    desc: "各サイクルの1手目開始時、全スキルエネ満タン",
    conditionType: "cycle1_one_turn_clear",
    targetValue: 1,
    conditionDesc: "1サイクル目を1手でクリア",
    effect: { type: "first_turn_full_charge" }
  },
  {
    id: "s_appraiser",
    name: "鑑定士",
    category: "ショップ売却",
    desc: "トークン売却価格が購入価格と同額（100%返金）",
    conditionType: "tokens_sold_total",
    targetValue: 10,
    conditionDesc: "トークンを累計10個売却",
    effect: { type: "token_full_refund" }
  },
  {
    id: "s_master_p",
    name: "極致者",
    category: "レベル連携",
    desc: "装備中の Lv3（最大）トークン1つにつき倍率 +1.5",
    conditionType: "level3_tokens_equipped",
    targetValue: 3,
    conditionDesc: "Lv3トークンを同時に3個装備",
    effect: { type: "level3_token_multiplier", valuePerToken: 1.5 }
  },
  {
    id: "s_awakener",
    name: "覚醒術士",
    category: "スキル強化",
    desc: "アクティブスキルの変換・生成数が +50% 増加",
    conditionType: "skill_convert_count_single",
    targetValue: 10,
    conditionDesc: "スキル1回で10個以上変換",
    effect: { type: "skill_output_boost", rate: 0.5 }
  },
  {
    id: "s_duo",
    name: "二極化",
    category: "属性出現",
    desc: "盤面に降ってくるドロップが指定2属性に偏る",
    conditionType: "two_colors_30_combos",
    targetValue: 30,
    conditionDesc: "2属性のみで30コンボ達成",
    effect: { type: "duo_skyfall_bias" }
  },
  {
    id: "s_pioneer",
    name: "星の開拓者",
    category: "累積消去",
    desc: "★獲得に必要なコンボ閾値が -2 短縮",
    conditionType: "star_drops_erased_total_pioneer",
    targetValue: 200,
    conditionDesc: "スタードロップ累計200個消去",
    effect: { type: "star_threshold_sub", value: 2 }
  },
  {
    id: "s_specialist",
    name: "スペシャリスト",
    category: "スロット",
    desc: "スロット全6個をアクティブにするとチャージ2倍",
    conditionType: "all_active_skills_equipped",
    targetValue: 6,
    conditionDesc: "スキルトークンのみで6個装備",
    effect: { type: "all_skill_double_charge" }
  },
  {
    id: "s_salesman",
    name: "セールスマン",
    category: "ショップ",
    desc: "各ショップでランダム1商品が常に 50% オフ",
    conditionType: "sale_items_bought_total",
    targetValue: 5,
    conditionDesc: "セール商品を累計5回購入",
    effect: { type: "guaranteed_sale_item", discountRate: 0.5 }
  }
];

// 隠しセット効果（シナジー）データリスト
export const TITLE_SET_BONUSES = [
  {
    id: "S01",
    prefixId: "p_fire",
    suffixId: "s_king",
    titleName: "【真・紅蓮覇王】",
    desc: "【業火の覚醒】盤面の炎ドロップがすべて強化（プラス）ドロップとして出現する。",
    effect: { type: "all_fire_plus" }
  },
  {
    id: "S02",
    prefixId: "p_speed",
    suffixId: "s_flash",
    titleName: "【神速の電撃戦】",
    desc: "手番終了時、残った操作時間1秒につき基礎コンボ数が +0.2倍 加算。",
    effect: { type: "time_left_base_mult", value: 0.2 }
  },
  {
    id: "S03",
    prefixId: "p_gold",
    suffixId: "s_rich",
    titleName: "【ミダス王の再来】",
    desc: "ショップでの初回リロール（更新）費用が毎回無料（0スター）になる。",
    effect: { type: "first_reroll_free" }
  },
  {
    id: "S04",
    prefixId: "p_empty",
    suffixId: "s_rich",
    titleName: "【逆転の演出家】",
    desc: "所持スター0で手番を終えた際、★（スター）獲得量が 2倍 に増加。",
    effect: { type: "zero_star_double_star" }
  },
  {
    id: "S05",
    prefixId: "p_berserk",
    suffixId: "s_unmatched",
    titleName: "【鬼神降臨】",
    desc: "基礎コンボ数の乗算補正がさらに 1.2倍 加算される。",
    effect: { type: "base_multiplier_add", value: 1.2 }
  },
  {
    id: "S06",
    prefixId: "p_desperate",
    suffixId: "s_square_p",
    titleName: "【絶対障壁の方陣】",
    desc: "3x3正方形消し達成時、受けているすべての呪いデバフをその手番のみ無効化。",
    effect: { type: "nullify_curses_on_square" }
  },
  {
    id: "S07",
    prefixId: "p_curse",
    suffixId: "s_frenzy",
    titleName: "【パンドラの解放者】",
    desc: "呪いトークンを装備しているほど、スキルのエネルギー還元率が +10% 加算。",
    effect: { type: "curse_energy_refund_add", ratePerCurse: 0.1 }
  },
  {
    id: "S08",
    prefixId: "p_chant_f",
    suffixId: "s_quick_charge",
    titleName: "【紅蓮の即応陣】",
    desc: "各サイクルの1手目開始時、盤面の全ドロップが強化（プラス）炎に変化。",
    effect: { type: "first_turn_all_plus_fire" }
  },
  {
    id: "S09",
    prefixId: "p_merchant",
    suffixId: "s_appraiser",
    titleName: "【闇市の売買術】",
    desc: "トークン売却時、購入時価格の 150%（1.5倍額）が払い戻される。",
    effect: { type: "refund_rate", rate: 1.5 }
  },
  {
    id: "S10",
    prefixId: "p_amp",
    suffixId: "s_awakener",
    titleName: "【全能力覚醒】",
    desc: "装備中の全トークンの効果レベルが一時的に上限突破（Lv4扱い）となる。",
    effect: { type: "all_tokens_lv4" }
  }
];

// 派生・進化二つ名（アンロックツリー）データリスト
export const EVOLVED_TITLES = [
  {
    id: "E01",
    name: "光速の",
    category: "A枠上位",
    type: "prefix",
    requiredPrefix: "p_speed",
    desc: "常時操作時間 +4秒。残り1秒につきコンボ倍率 +2.0 加算。",
    conditionType: "time_left_turn_end_equipped",
    requiredEquippedPrefix: "p_speed",
    targetValue: 4,
    conditionDesc: "「神速の」を装備して操作時間4秒以上残してクリア",
    effect: { type: "time_add", value: 4000, time_left_bonus: 2.0 }
  },
  {
    id: "E02",
    name: "修羅の",
    category: "A枠上位",
    type: "prefix",
    requiredPrefix: "p_berserk",
    desc: "常時操作時間 -3秒、基礎コンボ数 3.0倍、獲得スコア2倍化。",
    conditionType: "shura_condition",
    requiredEquippedPrefix: "p_berserk",
    targetValue: 20,
    conditionDesc: "「狂戦士の」を装備し、操作時間1秒未満の極限状態で20コンボ",
    effect: { type: "shura", time_add: -3000, base_multiplier: 3.0, score_multiplier: 2.0 }
  },
  {
    id: "E03",
    name: "無一文の",
    category: "A枠上位",
    type: "prefix",
    requiredPrefix: "p_empty",
    desc: "常時スター獲得不可（0固定）、最終コンボ倍率が常時 10.0倍 固定。",
    conditionType: "empty_cycle3_boss_clear",
    requiredEquippedPrefix: "p_empty",
    targetValue: 1,
    conditionDesc: "「からっぽの」を装備し、スター0のままサイクル3のボス撃破",
    effect: { type: "penniless", fixed_combo_mult: 10.0, star_gain_zero: true }
  },
  {
    id: "E04",
    name: "煉獄皇",
    category: "専用超称号",
    type: "special",
    requiredSetId: "S01",
    desc: "盤面が「炎」と「ハート」の2色のみになり、炎倍率 +10.0。",
    conditionType: "board_all_fire_plus_clear",
    requiredEquippedSet: "S01",
    targetValue: 30,
    conditionDesc: "【真・紅蓮覇王】装備で盤面30マスをすべて強化炎で全消し",
    effect: { type: "inferno_emperor", colors: ["fire", "heart"], fire_mult: 10.0 }
  },
  {
    id: "E05",
    name: "厄災の神",
    category: "専用超称号",
    type: "special",
    requiredSetId: "S07",
    desc: "全呪いのデバフが消滅し、呪い1つにつき基礎数2.0倍＆エネ全回復。",
    conditionType: "curse_5_boss_one_turn",
    requiredEquippedSet: "S07",
    targetValue: 1,
    conditionDesc: "【パンドラの解放者】装備で呪いを5つ同時装備してボス1手撃破",
    effect: { type: "curse_god", remove_curse_debuffs: true, mult_per_curse: 2.0, full_charge: true }
  },
  {
    id: "E06",
    name: "闇市の帝王",
    category: "B枠上位",
    type: "suffix",
    requiredSuffix: "s_thrifty",
    desc: "ショップでの全トークン購入価格が常時 50% オフ（半額）化。",
    conditionType: "thrifty_hold_500_stars",
    requiredEquippedSuffix: "s_thrifty",
    targetValue: 500,
    conditionDesc: "『節約家』装備中に所持金500★達成",
    effect: { type: "shop_discount", rate: 0.5 }
  },
  {
    id: "E07",
    name: "超越の極意",
    category: "A枠上位",
    type: "prefix",
    requiredPrefix: "p_amp",
    desc: "装備中の全トークン（スキル・パッシブ）の効果値が 2.0倍（2倍）化。",
    conditionType: "amp_100_combos",
    requiredEquippedPrefix: "p_amp",
    targetValue: 100,
    conditionDesc: "『増幅の』装備で1手100コンボ達成",
    effect: { type: "token_amp", rate: 2.0 }
  },
  {
    id: "E08",
    name: "パズルマスター",
    category: "伝説称号",
    type: "special",
    requiredPrefix: "p_destroyer",
    desc: "常時最終コンボ倍率が +5.0 加算される。",
    conditionType: "all_attributes_2000_erase",
    requiredEquippedPrefix: "p_destroyer",
    targetValue: 2000,
    conditionDesc: "全6属性のドロップを各2,000個以上消去",
    effect: { type: "combo_multiplier_add", value: 5.0 }
  }
];
