/**
 * 二つ名（称号）システム マスターデータ
 * - PREFIX_TITLES: A枠パーツ（接頭辞）
 * - SUFFIX_TITLES: B枠パーツ（接尾辞）
 * - TITLE_SET_BONUSES: 隠しセット効果（シナジー）
 * - EVOLVED_TITLES: 派生・進化二つ名（アンロックツリー）
 */

// A枠（接頭辞）パーツデータ定義 (24種)
export const PREFIX_TITLES = [
  {
    id: "p_speed",
    name: "神速の",
    category: "time",
    categoryName: "操作時間",
    desc: "操作時間 +2秒",
    conditionType: "time_left_turn_end",
    targetValue: 3,
    conditionDesc: "操作時間を3秒以上残してターン終了",
    effect: { type: "time_add", value: 2000 }
  },
  {
    id: "p_berserk",
    name: "狂戦士の",
    category: "risk",
    categoryName: "リスク・火力",
    desc: "操作時間 -2秒、基礎コンボ数 1.5倍",
    conditionType: "time_left_cycle_clear",
    targetValue: 2,
    conditionDesc: "操作時間2秒以下でサイクルクリア",
    effect: { type: "berserk", time_sub: 2000, base_multiplier: 1.5 }
  },
  {
    id: "p_desperate",
    name: "背水の",
    category: "risk",
    categoryName: "リスク・固定",
    desc: "操作時間4秒固定、基礎コンボ数 1.3倍",
    conditionType: "cycles_cleared_total",
    targetValue: 10,
    conditionDesc: "累計10サイクルクリア",
    effect: { type: "desperate", fixed_time: 4000, base_multiplier: 1.3 }
  },
  {
    id: "p_fire",
    name: "紅蓮の",
    category: "attribute",
    categoryName: "属性（炎）",
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
    category: "attribute",
    categoryName: "属性（雨）",
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
    category: "attribute",
    categoryName: "属性（風）",
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
    category: "attribute",
    categoryName: "属性（雷）",
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
    category: "attribute",
    categoryName: "属性（月）",
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
    category: "attribute",
    categoryName: "属性（心）",
    desc: "ハート出現率UP、回復コンボ加算 +10",
    conditionType: "color_erase_total",
    targetColor: "heart",
    targetValue: 300,
    conditionDesc: "ハートドロップを累計300個消去",
    effect: { type: "heart_boost", skyfallWeight: 2.0, heal_combo_add: 10 }
  },
  {
    id: "p_gold",
    name: "黄金の",
    category: "economy",
    categoryName: "経済",
    desc: "ゲーム開始時の初期スター +30",
    conditionType: "star_earned_single_run",
    targetValue: 100,
    conditionDesc: "1回のゲームで累計100スター獲得",
    effect: { type: "initial_star_add", value: 30 }
  },
  {
    id: "p_empty",
    name: "からっぽの",
    category: "economy",
    categoryName: "経済・逆境",
    desc: "所持スター0の時、コンボ倍率 +3.0",
    conditionType: "cycle_clear_with_zero_star",
    targetValue: 1,
    conditionDesc: "所持スター0でサイクルクリア",
    effect: { type: "zero_star_combo_mult", value: 3.0 }
  },
  {
    id: "p_forbidden",
    name: "禁忌の",
    category: "limit",
    categoryName: "制限",
    desc: "落ちコン停止、基礎コンボ数 1.4倍",
    conditionType: "no_fall_combo_total",
    targetValue: 100,
    conditionDesc: "落ちコンなしで通算100コンボ達成",
    effect: { type: "disable_skyfall", base_multiplier: 1.4 }
  },
  {
    id: "p_curse",
    name: "厄災の",
    category: "curse",
    categoryName: "呪い連携",
    desc: "装備中の呪い1つにつきコンボ倍率 +1.5",
    conditionType: "simultaneous_curses",
    targetValue: 3,
    conditionDesc: "呪いトークンを3つ同時に装備",
    effect: { type: "curse_multiplier", value: 1.5 }
  },
  {
    id: "p_stroke",
    name: "一筆の",
    category: "puzzle",
    categoryName: "パズル",
    desc: "1手移動距離30マス以上でコンボ加算 +20",
    conditionType: "move_distance_single",
    targetValue: 50,
    conditionDesc: "1手で50マス以上移動してクリア",
    effect: { type: "stroke_bonus", minDistance: 30, comboAdd: 20 }
  },
  {
    id: "p_first",
    name: "先制の",
    category: "turn",
    categoryName: "ターン制限",
    desc: "各サイクルの1手目のみコンボ倍率 2.0倍",
    conditionType: "first_turn_clear_cycle",
    targetValue: 1,
    conditionDesc: "サイクルの1手目で目標達成",
    effect: { type: "first_turn_multiplier", value: 2.0 }
  },
  {
    id: "p_solo",
    name: "孤高の",
    category: "equip",
    categoryName: "装備制限",
    desc: "トークン装備数3個以下でコンボ倍率 +2.5",
    conditionType: "solo_cycle_clear",
    targetValue: 3,
    conditionDesc: "トークン3個以下でサイクル3突破",
    effect: { type: "solo_multiplier", maxTokens: 3, value: 2.5 }
  },
  {
    id: "p_chant_f",
    name: "紅蓮の詠唱",
    category: "skill",
    categoryName: "スキル効率",
    desc: "炎属性スキルの消費エネルギーが常時 -1",
    conditionType: "fire_skill_converted_total",
    targetValue: 100,
    conditionDesc: "炎スキルで累計100個変換",
    effect: { type: "skill_cost_reduction", color: "fire", value: 1 }
  },
  {
    id: "p_merchant",
    name: "密売人の",
    category: "shop",
    categoryName: "ショップ",
    desc: "呪いトークン売却時、逆に +20スター獲得",
    conditionType: "sell_curse_total",
    targetValue: 3,
    conditionDesc: "呪いトークンを累計3回売却",
    effect: { type: "curse_sell_bonus", value: 20 }
  },
  {
    id: "p_master",
    name: "先達の",
    category: "train",
    categoryName: "育成",
    desc: "初期所持トークンが最初から Lv2 スタート",
    conditionType: "token_levelup_total",
    targetValue: 20,
    conditionDesc: "トークンレベルアップ累計20回",
    effect: { type: "initial_token_lv2" }
  },
  {
    id: "p_amp",
    name: "増幅の",
    category: "amp",
    categoryName: "効果拡張",
    desc: "全パッシブトークンの効果値が 1.3倍化",
    conditionType: "passive_combo_add_single",
    targetValue: 50,
    conditionDesc: "パッシブ効果のみでコンボ加算+50",
    effect: { type: "passive_boost", multiplier: 1.3 }
  },
  {
    id: "p_bias",
    name: "偏愛の",
    category: "rate",
    categoryName: "出現率操作",
    desc: "指定1属性の出現率が 50% 以上に急増",
    conditionType: "single_color_board_count",
    targetValue: 20,
    conditionDesc: "単一属性で盤面20個以上埋める",
    effect: { type: "bias_attribute", weight: 5.0 }
  },
  {
    id: "p_destroyer",
    name: "消滅者の",
    category: "destroy",
    categoryName: "累積消去",
    desc: "基礎コンボ数が 1.5倍 に強化",
    conditionType: "total_erased_drops",
    targetValue: 10000,
    conditionDesc: "ドロップを累計 10,000個 消去",
    effect: { type: "base_combo_multiplier", value: 1.5 }
  },
  {
    id: "p_full",
    name: "満載の",
    category: "slot",
    categoryName: "スロット",
    desc: "トークンスロット6個全埋めで基礎数 1.4倍",
    conditionType: "full_slot_equipped",
    targetValue: 6,
    conditionDesc: "トークンスロットを6個全埋めする",
    effect: { type: "full_slot_base_multiplier", value: 1.4 }
  },
  {
    id: "p_regular",
    name: "常連の",
    category: "shop",
    categoryName: "ショップ",
    desc: "ショップの品揃え枠が常時 +1枠 増える",
    conditionType: "shop_visits_total",
    targetValue: 20,
    conditionDesc: "ショップ訪問回数累計20回",
    effect: { type: "shop_slots_add", value: 1 }
  }
];

// B枠（接尾辞）パーツデータ定義 (24種)
export const SUFFIX_TITLES = [
  {
    id: "s_king",
    name: "覇王",
    category: "multiplier",
    categoryName: "倍率強化",
    desc: "最終コンボ倍率 +2.0",
    conditionType: "max_combo_single",
    targetValue: 50,
    conditionDesc: "1手番で 50コンボ 達成",
    effect: { type: "combo_multiplier_add", value: 2.0 }
  },
  {
    id: "s_collector",
    name: "収集家",
    category: "economy",
    categoryName: "経済",
    desc: "★獲得に必要なコンボ数 -1",
    conditionType: "star_earned_total",
    targetValue: 50,
    conditionDesc: "★を累計50回獲得",
    effect: { type: "star_threshold_sub", value: 1 }
  },
  {
    id: "s_mage",
    name: "魔導士",
    category: "skill",
    categoryName: "スキル",
    desc: "全アクティブスキルの初期エネルギー +2",
    conditionType: "skill_used_total",
    targetValue: 30,
    conditionDesc: "スキルを累計30回使用",
    effect: { type: "initial_skill_energy_add", value: 2 }
  },
  {
    id: "s_square_p",
    name: "方陣師",
    category: "special",
    categoryName: "特殊消し",
    desc: "全特殊消し（十字・L字等）ボーナス 1.5倍",
    conditionType: "special_erases_total",
    targetValue: 50,
    conditionDesc: "特殊消しを累計50回達成",
    effect: { type: "special_erase_boost", multiplier: 1.5 }
  },
  {
    id: "s_seeker",
    name: "探求者",
    category: "add",
    categoryName: "加算強化",
    desc: "すべてのコンボ加算値（+N）の効果 1.5倍",
    conditionType: "combo_add_total_single",
    targetValue: 100,
    conditionDesc: "コンボ加算の合計が+100達成",
    effect: { type: "combo_addition_multiplier", multiplier: 1.5 }
  },
  {
    id: "s_alchemist",
    name: "錬金術士",
    category: "board",
    categoryName: "盤面強化",
    desc: "降ってくるドロップの 10% が強化ドロップ化",
    conditionType: "plus_drops_erased_total",
    targetValue: 100,
    conditionDesc: "強化ドロップを累計100個消去",
    effect: { type: "skyfall_plus_rate", rate: 0.10 }
  },
  {
    id: "s_rich",
    name: "大富豪",
    category: "economy",
    categoryName: "経済・利息",
    desc: "サイクルクリア時、所持スターの 10% 獲得",
    conditionType: "held_stars_reach",
    targetValue: 200,
    conditionDesc: "所持スター 200以上 達成",
    effect: { type: "cycle_clear_interest", rate: 0.10 }
  },
  {
    id: "s_unmatched",
    name: "無双",
    category: "base",
    categoryName: "基礎数強化",
    desc: "基礎コンボ数 1.3倍",
    conditionType: "base_combo_single",
    targetValue: 30,
    conditionDesc: "1手で基礎コンボ30達成",
    effect: { type: "base_combo_multiplier", value: 1.3 }
  },
  {
    id: "s_thrifty",
    name: "節約家",
    category: "shop",
    categoryName: "ショップ",
    desc: "ショップの商品価格が全品 20% 引き",
    conditionType: "shop_purchases_total",
    targetValue: 10,
    conditionDesc: "ショップで10回購入",
    effect: { type: "shop_discount", rate: 0.20 }
  },
  {
    id: "s_frenzy",
    name: "狂乱者",
    category: "skill",
    categoryName: "スキル",
    desc: "スキル使用時、20%の確率でエネルギー還元",
    conditionType: "skill_used_single_turn",
    targetValue: 3,
    conditionDesc: "1手番でスキルを3回使用",
    effect: { type: "skill_energy_refund_chance", rate: 0.20 }
  },
  {
    id: "s_star_gazer",
    name: "星詠み",
    category: "drop",
    categoryName: "特殊ドロップ",
    desc: "降ってくるドロップの 5% がスタードロップ化",
    conditionType: "star_drops_erased_total",
    targetValue: 30,
    conditionDesc: "スタードロップを累計30個消去",
    effect: { type: "skyfall_star_rate", rate: 0.05 }
  },
  {
    id: "s_expert",
    name: "見切り屋",
    category: "shop",
    categoryName: "ショップ",
    desc: "ショップのリロール価格が 2★固定",
    conditionType: "shop_reroll_total",
    targetValue: 5,
    conditionDesc: "ショップでリロールを5回実行",
    effect: { type: "fixed_reroll_cost", cost: 2 }
  },
  {
    id: "s_slayer",
    name: "討伐者",
    category: "boss",
    categoryName: "ボス特化",
    desc: "各サイクルの最終手番（ボス戦）で倍率 +4.0",
    conditionType: "bosses_defeated_total",
    targetValue: 5,
    conditionDesc: "ボスを累計5体撃破",
    effect: { type: "boss_turn_multiplier", value: 4.0 }
  },
  {
    id: "s_tuner",
    name: "調律師",
    category: "board",
    categoryName: "盤面",
    desc: "降ってくるドロップの全属性出現確率が均等化",
    conditionType: "erase_5_colors_single",
    targetValue: 5,
    conditionDesc: "5属性を同時に消す",
    effect: { type: "even_spawn_weights" }
  },
  {
    id: "s_leader",
    name: "統率者",
    category: "synergy",
    categoryName: "属性統一",
    desc: "同属性トークン3個以上装備でコンボ倍率 +2.5",
    conditionType: "same_attr_tokens_equipped",
    targetValue: 3,
    conditionDesc: "単一属性でトークンを揃える",
    effect: { type: "mono_attribute_bonus", minTokens: 3, value: 2.5 }
  },
  {
    id: "s_quick_charge",
    name: "即応陣",
    category: "charge",
    categoryName: "スキルチャージ",
    desc: "各サイクルの1手目開始時、全スキルエネ満タン",
    conditionType: "cycle1_one_turn_clear",
    targetValue: 1,
    conditionDesc: "1サイクル目を1手でクリア",
    effect: { type: "cycle_start_full_energy" }
  },
  {
    id: "s_appraiser",
    name: "鑑定士",
    category: "shop",
    categoryName: "ショップ売却",
    desc: "トークン売却価格が購入価格と同額（100%返金）",
    conditionType: "tokens_sold_total",
    targetValue: 10,
    conditionDesc: "トークンを累計10個売却",
    effect: { type: "full_sell_price" }
  },
  {
    id: "s_master_p",
    name: "極致者",
    category: "level",
    categoryName: "レベル連携",
    desc: "装備中の Lv3（最大）トークン1つにつき倍率 +1.5",
    conditionType: "lv3_tokens_equipped",
    targetValue: 3,
    conditionDesc: "Lv3トークンを同時に3個装備",
    effect: { type: "lv3_token_multiplier", value: 1.5 }
  },
  {
    id: "s_awakener",
    name: "覚醒術士",
    category: "skill",
    categoryName: "スキル強化",
    desc: "アクティブスキルの変換・生成数が +50% 増加",
    conditionType: "skill_convert_single",
    targetValue: 10,
    conditionDesc: "スキル1回で10個以上変換",
    effect: { type: "skill_convert_boost", multiplier: 1.5 }
  },
  {
    id: "s_duo",
    name: "二極化",
    category: "board",
    categoryName: "属性出現",
    desc: "盤面に降ってくるドロップが指定2属性に偏る",
    conditionType: "two_color_30_combo",
    targetValue: 30,
    conditionDesc: "2属性のみで30コンボ達成",
    effect: { type: "duo_attributes_weight" }
  },
  {
    id: "s_pioneer",
    name: "星の開拓者",
    category: "economy",
    categoryName: "累積消去",
    desc: "★獲得に必要なコンボ閾値が -2 短縮",
    conditionType: "star_drops_erased_total",
    targetValue: 200,
    conditionDesc: "スタードロップ累計200個消去",
    effect: { type: "star_threshold_sub", value: 2 }
  },
  {
    id: "s_specialist",
    name: "スペシャリスト",
    category: "slot",
    categoryName: "スロット",
    desc: "スロット全6個をアクティブにするとチャージ2倍",
    conditionType: "all_active_skills_equipped",
    targetValue: 6,
    conditionDesc: "スキルトークンのみで6個装備",
    effect: { type: "all_active_skills_charge_boost", multiplier: 2.0 }
  },
  {
    id: "s_salesman",
    name: "セールスマン",
    category: "shop",
    categoryName: "ショップ",
    desc: "各ショップでランダム1商品が常に 50% オフ",
    conditionType: "sale_items_bought_total",
    targetValue: 5,
    conditionDesc: "セール商品を累計5回購入",
    effect: { type: "shop_sale_item", discountRate: 0.50 }
  },
  {
    id: "s_flash",
    name: "閃光",
    category: "time",
    categoryName: "操作時間",
    desc: "操作時間を5秒以上残してクリア時、コンボ加算 +10",
    conditionType: "quick_finish_total",
    targetValue: 10,
    conditionDesc: "操作時間を5秒以上残して10回クリア",
    effect: { type: "flash_speed", bonus: 10 }
  }
];

// 隠しセット効果（シナジー）データ定義 (10種)
export const TITLE_SET_BONUSES = [
  {
    id: "S01",
    key: "set_red_king",
    prefixId: "p_fire",
    suffixId: "s_king",
    titleName: "【真・紅蓮覇王】",
    desc: "【業火の覚醒】盤面の炎ドロップがすべて強化（プラス）ドロップとして出現する。",
    effect: { type: "all_fire_plus" }
  },
  {
    id: "S02",
    key: "set_flash_blitz",
    prefixId: "p_speed",
    suffixId: "s_flash",
    titleName: "【神速の電撃戦】",
    desc: "【電光石火】手番終了時、残った操作時間1秒につき基礎コンボ数が +0.2倍 加算。",
    effect: { type: "time_left_base_multiplier", ratePerSec: 0.2 }
  },
  {
    id: "S03",
    key: "set_midas",
    prefixId: "p_gold",
    suffixId: "s_rich",
    titleName: "【ミダス王の再来】",
    desc: "【黄金律】ショップでの初回リロール（更新）費用が毎回無料（0スター）になる。",
    effect: { type: "first_reroll_free" }
  },
  {
    id: "S04",
    key: "set_reversal",
    prefixId: "p_empty",
    suffixId: "s_rich",
    titleName: "【逆転の演出家】",
    desc: "【背水の逆転劇】所持スター0で手番を終えた際、★（スター）獲得量が 2倍 に増加。",
    effect: { type: "zero_star_double_earn" }
  },
  {
    id: "S05",
    key: "set_demon_god",
    prefixId: "p_berserk",
    suffixId: "s_unmatched",
    titleName: "【鬼神降臨】",
    desc: "【闘気爆燃】基礎コンボ数の乗算補正がさらに 1.2倍 加算される。",
    effect: { type: "base_combo_multiplier_add", value: 1.2 }
  },
  {
    id: "S06",
    key: "set_aegis_square",
    prefixId: "p_desperate",
    suffixId: "s_square_p",
    titleName: "【絶対障壁の方陣】",
    desc: "【聖護方陣】3x3正方形消し達成時、受けているすべての呪いデバフをその手番のみ無効化。",
    effect: { type: "square_curse_nullify" }
  },
  {
    id: "S07",
    key: "set_pandora",
    prefixId: "p_curse",
    suffixId: "s_frenzy",
    titleName: "【パンドラの解放者】",
    desc: "【厄災昇華】呪いトークンを装備しているほど、スキルのエネルギー還元率が +10% 加算。",
    effect: { type: "curse_energy_refund_rate", ratePerCurse: 0.10 }
  },
  {
    id: "S08",
    key: "set_red_array",
    prefixId: "p_chant_f",
    suffixId: "s_quick_charge",
    titleName: "【紅蓮の即応陣】",
    desc: "【炎陣展開】各サイクルの1手目開始時、盤面の全ドロップが強化（プラス）炎に変化。",
    effect: { type: "turn1_all_fire_plus" }
  },
  {
    id: "S09",
    key: "set_black_market",
    prefixId: "p_merchant",
    suffixId: "s_appraiser",
    titleName: "【闇市の売買術】",
    desc: "【暴利調達】トークン売却時、購入時価格の 150%（1.5倍額）が払い戻される。",
    effect: { type: "token_sell_multiplier", value: 1.5 }
  },
  {
    id: "S10",
    key: "set_all_awakening",
    prefixId: "p_amp",
    suffixId: "s_awakener",
    titleName: "【全能力覚醒】",
    desc: "【限界突破】装備中の全トークンの効果レベルが一時的に上限突破（Lv4扱い）となる。",
    effect: { type: "all_tokens_lv4" }
  }
];

// 派生・進化二つ名（アンロックツリー）データ定義 (8種)
export const EVOLVED_TITLES = [
  {
    id: "evo_light_speed",
    name: "光速の",
    category: "evolved",
    categoryName: "A枠上位",
    slotType: "prefix",
    requiredPrefix: "p_speed",
    requiredEquippedPrefix: "p_speed",
    desc: "常時操作時間 +4秒。残り時間1秒につきコンボ倍率 +2.0",
    conditionType: "time_left_turn_end_equipped",
    targetValue: 4,
    conditionDesc: "「神速の」を装備して操作時間4秒以上残してクリア",
    effect: { type: "time_add", value: 4000, time_left_bonus: 2.0 }
  },
  {
    id: "evo_asura",
    name: "修羅の",
    category: "evolved",
    categoryName: "A枠上位",
    slotType: "prefix",
    requiredPrefix: "p_berserk",
    requiredEquippedPrefix: "p_berserk",
    desc: "常時操作時間 -3秒、基礎コンボ数 3.0倍、獲得スコア2倍化",
    conditionType: "asura_challenge",
    targetValue: 20,
    conditionDesc: "「狂戦士の」を装備し操作時間1秒未満の極限状態で20コンボ",
    effect: { type: "asura", time_sub: 3000, base_multiplier: 3.0, score_multiplier: 2.0 }
  },
  {
    id: "evo_penniless",
    name: "無一文の",
    category: "evolved",
    categoryName: "A枠上位",
    slotType: "prefix",
    requiredPrefix: "p_empty",
    requiredEquippedPrefix: "p_empty",
    desc: "常時スター獲得不可（0固定）、最終コンボ倍率が常時 10.0倍 固定",
    conditionType: "zero_star_boss_clear_equipped",
    targetValue: 3,
    conditionDesc: "「からっぽの」を装備しスター0のままサイクル3のボス撃破",
    effect: { type: "fixed_multiplier_no_stars", multiplier: 10.0 }
  },
  {
    id: "evo_purgatory",
    name: "煉獄皇",
    category: "evolved",
    categoryName: "専用超称号",
    slotType: "special",
    requiredSet: "S01",
    desc: "盤面が「炎」と「ハート」の2色のみになり、炎倍率 +10.0",
    conditionType: "all_board_enhanced_fire_clear",
    targetValue: 30,
    conditionDesc: "【真・紅蓮覇王】装備中に盤面30マスをすべて強化炎で全消し",
    effect: { type: "purgatory_board", colors: ["fire", "heart"], fireMultiplierAdd: 10.0 }
  },
  {
    id: "evo_calamity_god",
    name: "厄災の神",
    category: "evolved",
    categoryName: "専用超称号",
    slotType: "special",
    requiredSet: "S07",
    desc: "全呪いのデバフが消滅し、呪い1つにつき基礎数2.0倍＆エネ全回復",
    conditionType: "five_curses_boss_1turn",
    targetValue: 1,
    conditionDesc: "【パンドラの解放者】装備中に呪いを5つ同時装備してボス1手撃破",
    effect: { type: "calamity_god_power", basePerCurse: 2.0 }
  },
  {
    id: "evo_black_emperor",
    name: "闇市の帝王",
    category: "evolved",
    categoryName: "B枠上位",
    slotType: "suffix",
    requiredSuffix: "s_thrifty",
    requiredEquippedSuffix: "s_thrifty",
    desc: "ショップでの全トークン購入価格が常時 50% オフ（半額）化",
    conditionType: "reach_500_stars_equipped",
    targetValue: 500,
    conditionDesc: "「節約家」装備中に所持金500★達成",
    effect: { type: "shop_discount", rate: 0.50 }
  },
  {
    id: "evo_transcend",
    name: "超越の極意",
    category: "evolved",
    categoryName: "A枠上位",
    slotType: "prefix",
    requiredPrefix: "p_amp",
    requiredEquippedPrefix: "p_amp",
    desc: "装備中の全トークン（スキル・パッシブ）の効果値が 2.0倍（2倍）化",
    conditionType: "combo_100_single_equipped",
    targetValue: 100,
    conditionDesc: "「増幅の」装備で1手100コンボ達成",
    effect: { type: "all_tokens_boost", multiplier: 2.0 }
  },
  {
    id: "evo_puzzle_master",
    name: "パズルマスター",
    category: "evolved",
    categoryName: "伝説称号",
    slotType: "special",
    requiredPrefix: "p_destroyer",
    desc: "常時最終コンボ倍率が +5.0 加算される",
    conditionType: "all_six_colors_2000_erase",
    targetValue: 2000,
    conditionDesc: "全6属性のドロップを各2,000個以上消去",
    effect: { type: "combo_multiplier_add", value: 5.0 }
  }
];

// ユーティリティ: A枠・B枠の組み合わせからセット効果を判定
export function getSetBonus(prefixId, suffixId) {
  if (!prefixId || !suffixId) return null;
  return TITLE_SET_BONUSES.find(
    s => s.prefixId === prefixId && s.suffixId === suffixId
  ) || null;
}

// ユーティリティ: 装備中二つ名の完全な表示名を取得
export function getTitleDisplayName(equippedTitle) {
  if (!equippedTitle) return "【未装備】";

  // 専用超称号（evolvedId）が指定されている場合
  if (equippedTitle.evolvedId) {
    const evo = EVOLVED_TITLES.find(e => e.id === equippedTitle.evolvedId);
    if (evo) return `【${evo.name}】`;
  }

  // 隠しセット効果が成立している場合
  const set = getSetBonus(equippedTitle.prefixId, equippedTitle.suffixId);
  if (set) {
    return set.titleName;
  }

  // A枠 + B枠 の合成名
  const prefix = PREFIX_TITLES.find(p => p.id === equippedTitle.prefixId)
    || EVOLVED_TITLES.find(e => e.id === equippedTitle.prefixId);
  const suffix = SUFFIX_TITLES.find(s => s.id === equippedTitle.suffixId)
    || EVOLVED_TITLES.find(e => e.id === equippedTitle.suffixId);

  const prefixName = prefix ? prefix.name : "";
  const suffixName = suffix ? suffix.name : "";

  if (prefixName && suffixName) {
    return `『${prefixName}${suffixName}』`;
  } else if (prefixName) {
    return `『${prefixName}…』`;
  } else if (suffixName) {
    return `『…${suffixName}』`;
  }
  return "【未装備】";
}

// ユーティリティ: 各パーツの進行度計算
export function getTitleProgress(title, stats = {}, currentRunStats = {}, equippedTitle = {}) {
  const target = title.targetValue || 1;
  let current = 0;

  switch (title.conditionType) {
    case "time_left_turn_end":
      // 操作時間を3秒以上残してターン終了
      current = currentRunStats?.maxRemainingTimeSec || 0;
      break;

    case "time_left_cycle_clear":
      current = (currentRunStats?.clearedWithLowTime) ? target : 0;
      break;

    case "cycles_cleared_total":
      current = stats?.lifetimeClears || 0;
      break;

    case "color_erase_total": {
      const color = title.targetColor;
      current = (stats?.lifetimeDropsErased && stats.lifetimeDropsErased[color]) || 0;
      break;
    }

    case "star_earned_single_run":
      current = currentRunStats?.totalStarsEarned || 0;
      break;

    case "cycle_clear_with_zero_star":
      current = (currentRunStats?.clearedWithZeroStar) ? target : 0;
      break;

    case "no_fall_combo_total":
      current = stats?.lifetimeNoSkyfallCombo || 0;
      break;

    case "simultaneous_curses":
      current = currentRunStats?.maxCursesEquipped || 0;
      break;

    case "move_distance_single":
      current = currentRunStats?.maxMoveDistance || 0;
      break;

    case "first_turn_clear_cycle":
      current = (currentRunStats?.firstTurnClearCycle) ? target : 0;
      break;

    case "solo_cycle_clear":
      current = currentRunStats?.soloMaxCycle || 0;
      break;

    case "fire_skill_converted_total":
      current = stats?.lifetimeFireSkillConverted || 0;
      break;

    case "sell_curse_total":
      current = stats?.lifetimeCursesSold || 0;
      break;

    case "token_levelup_total":
      current = stats?.lifetimeTokenLevelUps || 0;
      break;

    case "passive_combo_add_single":
      current = currentRunStats?.maxPassiveBonus || 0;
      break;

    case "single_color_board_count":
      current = currentRunStats?.maxSingleColorBoard || 0;
      break;

    case "total_erased_drops": {
      const drops = stats?.lifetimeDropsErased || {};
      current = Object.values(drops).reduce((a, b) => a + (b || 0), 0);
      break;
    }

    case "full_slot_equipped":
      current = currentRunStats?.maxTokensEquipped || 0;
      break;

    case "shop_visits_total":
      current = stats?.lifetimeShopVisits || 0;
      break;

    case "max_combo_single":
      current = Math.max(stats?.maxComboAllTime || 0, currentRunStats?.maxCombo || 0);
      break;

    case "star_earned_total":
      current = stats?.lifetimeStarsEarned || 0;
      break;

    case "skill_used_total":
      current = stats?.lifetimeSkillsUsed || 0;
      break;

    case "special_erases_total": {
      const s = stats || {};
      current = (s.lifetimeShapeLen4 || 0) + (s.lifetimeShapeCross || 0) +
                (s.lifetimeShapeRow || 0) + (s.lifetimeShapeLShape || 0) +
                (s.lifetimeShapeSquare || 0) + (s.lifetimeShapesLen5 || 0);
      break;
    }

    case "combo_add_total_single":
      current = currentRunStats?.maxComboAddSingle || 0;
      break;

    case "plus_drops_erased_total":
      current = stats?.lifetimePlusDropsErased || 0;
      break;

    case "held_stars_reach":
      current = currentRunStats?.maxStarsHeld || 0;
      break;

    case "base_combo_single":
      current = Math.max(stats?.maxBaseComboAllTime || 0, currentRunStats?.maxBaseCombo || 0);
      break;

    case "shop_purchases_total":
      current = stats?.lifetimeShopPurchases || 0;
      break;

    case "skill_used_single_turn":
      current = currentRunStats?.maxSkillsUsedSingleTurn || 0;
      break;

    case "star_drops_erased_total":
      current = stats?.lifetimeStarDropsErased || 0;
      break;

    case "shop_reroll_total":
      current = stats?.lifetimeShopRerolls || 0;
      break;

    case "bosses_defeated_total":
      current = stats?.lifetimeBossesDefeated || 0;
      break;

    case "erase_5_colors_single":
      current = currentRunStats?.maxColorsErasedSingle || 0;
      break;

    case "same_attr_tokens_equipped":
      current = currentRunStats?.maxSameAttrTokens || 0;
      break;

    case "cycle1_one_turn_clear":
      current = (currentRunStats?.cycle1OneTurnClear) ? target : 0;
      break;

    case "tokens_sold_total":
      current = stats?.lifetimeTokensSold || 0;
      break;

    case "lv3_tokens_equipped":
      current = currentRunStats?.maxLv3Tokens || 0;
      break;

    case "skill_convert_single":
      current = currentRunStats?.maxSkillConvertSingle || 0;
      break;

    case "two_color_30_combo":
      current = (currentRunStats?.achievedTwoColor30Combo) ? target : 0;
      break;

    case "all_active_skills_equipped":
      current = currentRunStats?.maxActiveSkillsEquipped || 0;
      break;

    case "sale_items_bought_total":
      current = stats?.lifetimeSalePurchases || 0;
      break;

    case "quick_finish_total":
      current = stats?.lifetimeQuickFinishes || 0;
      break;

    // 進化系条件
    case "time_left_turn_end_equipped":
      current = currentRunStats?.maxTimeLeftWithPrefix || 0;
      break;

    case "asura_challenge":
      current = currentRunStats?.asuraChallengeCombo || 0;
      break;

    case "zero_star_boss_clear_equipped":
      current = currentRunStats?.zeroStarBossClearCycle || 0;
      break;

    case "all_board_enhanced_fire_clear":
      current = (currentRunStats?.allEnhancedFireClear) ? target : 0;
      break;

    case "five_curses_boss_1turn":
      current = (currentRunStats?.fiveCursesBoss1Turn) ? target : 0;
      break;

    case "reach_500_stars_equipped":
      current = currentRunStats?.maxStarsWithSuffix || 0;
      break;

    case "combo_100_single_equipped":
      current = currentRunStats?.maxComboWithPrefix || 0;
      break;

    case "all_six_colors_2000_erase": {
      const drops = stats?.lifetimeDropsErased || {};
      const colors = ["fire", "water", "wood", "light", "dark", "heart"];
      const minVal = Math.min(...colors.map(c => drops[c] || 0));
      current = minVal;
      break;
    }

    default:
      current = 0;
      break;
  }

  const isAchieved = current >= target;
  const percent = Math.min(100, Math.floor((current / target) * 100));

  return {
    current: Math.min(current, target),
    rawCurrent: current,
    target,
    isAchieved,
    percent
  };
}
