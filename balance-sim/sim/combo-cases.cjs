// 組み合わせテストのケース定義（combo.cjs が読む）
// key: 出力ファイル名 / group: 集計の分類 / label: 表示名 / tokens: 並び順どおりの所持トークン（lv 省略時は 1）
// runStats: currentRunStats に上書きする値（ラン中盤以降の状態の再現） / stars: 所持スター（既定 30）
// filler: 効果がほぼないトークン（★3の数・Lv3の数を数える系の比較用）
const T = (id, lv = 1) => ({ id, lv });
const F3 = ['duration_booster', 'cross_count_token', 'move_drop_lucky']; // ★3・コンボに直接効かない
const F1 = ['shop_rarity_boost', 'shop_expand', 'bargain'];             // ★1・コンボに直接効かない

module.exports = [
  // --- A. 加算の重ね vs 乗算の重ね（パッシブ枠4つを埋める） ---
  { key: 'A1_add1x2', group: 'A 加算と乗算の重ね', label: '★1 連舞×2（炎・雨）', tokens: [T('bonus_1c_fire'), T('bonus_1c_water')] },
  { key: 'A1_add1x4', group: 'A 加算と乗算の重ね', label: '★1 連舞×4（炎・雨・風・雷）', tokens: ['bonus_1c_fire', 'bonus_1c_water', 'bonus_1c_wood', 'bonus_1c_light'].map(i => T(i)) },
  { key: 'A1_add1best4', group: 'A 加算と乗算の重ね', label: '★1 上位4個（金満・呪われた力・雨の連舞・癒の連舞）', tokens: ['greed_power', 'cursed_power', 'bonus_1c_water', 'bonus_1c_heart'].map(i => T(i)) },
  { key: 'A2_mul3x2', group: 'A 加算と乗算の重ね', label: '★3 乗算×2（巨人・背水）', tokens: [T('giant'), T('desperate_stance')] },
  { key: 'A2_mul3x3', group: 'A 加算と乗算の重ね', label: '★3 乗算×3（巨人・背水・一筆書き）', tokens: [T('giant'), T('desperate_stance'), T('one_stroke_seal')] },
  { key: 'A2_mul3x4', group: 'A 加算と乗算の重ね', label: '★3 乗算×4（巨人・背水・一筆書き・三星の極雷）', tokens: [T('giant'), T('desperate_stance'), T('one_stroke_seal'), T('star3_mult_boost')] },
  { key: 'A3_mix', group: 'A 加算と乗算の重ね', label: '★1 連舞×2 + ★3 乗算×2（巨人・背水）', tokens: [T('bonus_1c_fire'), T('bonus_1c_water'), T('giant'), T('desperate_stance')] },
  { key: 'A3_pure_add', group: 'A 加算と乗算の重ね', label: '純粋なる力 + ★1 連舞×3', tokens: [T('pure_power'), T('bonus_1c_fire'), T('bonus_1c_water'), T('bonus_1c_heart')] },
  { key: 'A3_pure', group: 'A 加算と乗算の重ね', label: '純粋なる力（単体・比較用）', tokens: [T('pure_power')] },

  // --- B. ★3を複数所持（三星の極雷） ---
  { key: 'B_star3_0', group: 'B ★3の複数所持', label: '三星の極雷 単体（★3は自分のみ＝1個）', tokens: [T('star3_mult_boost')] },
  { key: 'B_star3_2', group: 'B ★3の複数所持', label: '三星の極雷 + ★3（効果なし）×1', tokens: [T('star3_mult_boost'), T(F3[0])] },
  { key: 'B_star3_3', group: 'B ★3の複数所持', label: '三星の極雷 + ★3（効果なし）×2', tokens: [T('star3_mult_boost'), T(F3[0]), T(F3[1])] },
  { key: 'B_star3_4', group: 'B ★3の複数所持', label: '三星の極雷 + ★3（効果なし）×3（2^4=16 → 上限10）', tokens: [T('star3_mult_boost'), ...F3.map(i => T(i))] },
  { key: 'B_star3_4lb', group: 'B ★3の複数所持', label: '三星の極雷 + ★3×2 + 限界突破（上限20）', tokens: [T('star3_mult_boost'), T(F3[0]), T(F3[1]), T('limit_breaker')] },
  { key: 'B_star3_lv3', group: 'B ★3の複数所持', label: '三星の極雷 Lv3 + ★3（効果なし）×3（4^4 → 上限50）', tokens: [T('star3_mult_boost', 3), ...F3.map(i => T(i))] },
  { key: 'B_f3x3', group: 'B ★3の複数所持', label: '★3（効果なし）×3 のみ（比較用）', tokens: F3.map(i => T(i)) },

  // --- C. レベル系（Lv3トークン数・合計レベル・キング） ---
  { key: 'C_lv3cnt_1', group: 'C レベル系', label: '三魂の極致 + Lv3（効果なし）×1', tokens: [T('level3_count_mult'), T(F1[0], 3)] },
  { key: 'C_lv3cnt_3', group: 'C レベル系', label: '三魂の極致 + Lv3（効果なし）×3', tokens: [T('level3_count_mult'), ...F1.map(i => T(i, 3))] },
  { key: 'C_lv3cnt_3self', group: 'C レベル系', label: '三魂の極致 Lv3 + Lv3（効果なし）×3', tokens: [T('level3_count_mult', 3), ...F1.map(i => T(i, 3))] },
  { key: 'C_totlv_3', group: 'C レベル系', label: '全霊の共鳴 + Lv3（効果なし）×3（合計Lv10）', tokens: [T('total_level_boost'), ...F1.map(i => T(i, 3))] },
  { key: 'C_king_add', group: 'C レベル系', label: 'キング + ★1 連舞×3（すべてLv3扱い）', tokens: [T('legend_king'), T('bonus_1c_fire'), T('bonus_1c_water'), T('bonus_1c_heart')] },
  { key: 'C_add_lv1x3', group: 'C レベル系', label: '★1 連舞×3 Lv1（キングとの比較用）', tokens: [T('bonus_1c_fire'), T('bonus_1c_water'), T('bonus_1c_heart')] },
  { key: 'C_add_lv3x3', group: 'C レベル系', label: '★1 連舞×3 Lv3（キングとの比較用）', tokens: [T('bonus_1c_fire', 3), T('bonus_1c_water', 3), T('bonus_1c_heart', 3)] },
  { key: 'C_king_lv3cnt', group: 'C レベル系', label: 'キング + 三魂の極致 + ★1 連舞×2', tokens: [T('legend_king'), T('level3_count_mult'), T('bonus_1c_fire'), T('bonus_1c_water')] },

  // --- D. 先導・コピー・殿 ---
  { key: 'D_fire3', group: 'D 先導・コピー・殿', label: '炎の★1×3（連舞・真髄・脈動）', tokens: [T('bonus_1c_fire'), T('req_6_fire'), T('cc_add_fire')] },
  { key: 'D_lead_fire3', group: 'D 先導・コピー・殿', label: '炎王の先導（1番目）+ 炎の★1×3', tokens: [T('lead_fire'), T('bonus_1c_fire'), T('req_6_fire'), T('cc_add_fire')] },
  { key: 'D_water3', group: 'D 先導・コピー・殿', label: '雨の★1×3（連舞・真髄・脈動）', tokens: [T('bonus_1c_water'), T('req_6_water'), T('cc_add_water')] },
  { key: 'D_lead_water3', group: 'D 先導・コピー・殿', label: '蒼海の軍師（1番目）+ 雨の★1×3', tokens: [T('lead_water'), T('bonus_1c_water'), T('req_6_water'), T('cc_add_water')] },
  { key: 'D_lead_rear', group: 'D 先導・コピー・殿', label: '蒼海の軍師 + 雨の連舞・真髄 + 殿の構え', tokens: [T('lead_water'), T('bonus_1c_water'), T('req_6_water'), T('rearguard_stance')] },
  { key: 'D_water2', group: 'D 先導・コピー・殿', label: '雨の連舞・真髄（殿との比較用）', tokens: [T('bonus_1c_water'), T('req_6_water')] },
  { key: 'D_copy_add', group: 'D 先導・コピー・殿', label: '雨の連舞 + 模倣の魔鏡', tokens: [T('bonus_1c_water'), T('copy_token')] },
  { key: 'D_copy_curse', group: 'D 先導・コピー・殿', label: '呪われた力 + 模倣の魔鏡', tokens: [T('cursed_power'), T('copy_token')] },
  { key: 'D_copy_giant', group: 'D 先導・コピー・殿', label: '背水の陣 + 模倣の魔鏡', tokens: [T('desperate_stance'), T('copy_token')] },
  { key: 'D_sandwich', group: 'D 先導・コピー・殿', label: '合わせ鏡 + 雨の連舞 + 模倣の魔鏡（3回発動）', tokens: [T('mirror_pair'), T('bonus_1c_water'), T('copy_token')] },
  { key: 'D_sandwich_mul', group: 'D 先導・コピー・殿', label: '合わせ鏡 + 背水の陣 + 模倣の魔鏡（3回発動）', tokens: [T('mirror_pair'), T('desperate_stance'), T('copy_token')] },
  { key: 'D_rear_curse', group: 'D 先導・コピー・殿', label: '呪われた力 + 殿の構え', tokens: [T('cursed_power'), T('rearguard_stance')] },

  // --- E. ラン中の累計値で伸びる系（中盤〜終盤の値を再現） ---
  { key: 'E_thousand_0', group: 'E 累計値（中盤以降を再現）', label: '千手観音（累計0コンボ＝序盤）', tokens: [T('thousand_arms')] },
  { key: 'E_thousand_300', group: 'E 累計値（中盤以降を再現）', label: '千手観音（累計300コンボ＝サイクル5前後）', tokens: [T('thousand_arms')], runStats: { currentTotalCombo: 300 } },
  { key: 'E_thousand_1000', group: 'E 累計値（中盤以降を再現）', label: '千手観音（累計1000コンボ）', tokens: [T('thousand_arms')], runStats: { currentTotalCombo: 1000 } },
  { key: 'E_pride_100', group: 'E 累計値（中盤以降を再現）', label: '浪費家の意地（累計消費100★）', tokens: [T('pride_of_spendthrift')], runStats: { currentStarsSpent: 100 } },
  { key: 'E_pride_200', group: 'E 累計値（中盤以降を再現）', label: '浪費家の意地（累計消費200★）', tokens: [T('pride_of_spendthrift')], runStats: { currentStarsSpent: 200 } },
  { key: 'E_medal_15', group: 'E 累計値（中盤以降を再現）', label: '浪費の勲章（リロール累計15回）', tokens: [T('medal_of_spendthrift')], runStats: { currentShopRerolls: 15 } },
  { key: 'E_echo_10', group: 'E 累計値（中盤以降を再現）', label: '極大の余韻（最大倍率10倍を記録済み）', tokens: [T('echo_of_max')], runStats: { maxComboMultiplier: 10 } },
  { key: 'E_echo_mul', group: 'E 累計値（中盤以降を再現）', label: '極大の余韻 + 巨人・背水（自前で倍率を作る）', tokens: [T('echo_of_max'), T('giant'), T('desperate_stance')] },
  { key: 'E_curse_eater_2', group: 'E 累計値（中盤以降を再現）', label: '呪い喰い（呪い解除2回済み）', tokens: [T('curse_eater')], runStats: { currentCursesRemoved: 2 } },

  // --- F. 所持数で弱くなる系 ---
  { key: 'F_empty_1', group: 'F 所持数で変わる系', label: '余白の美学 単体（空き枠7）', tokens: [T('empty_slot_beauty')] },
  { key: 'F_empty_4', group: 'F 所持数で変わる系', label: '余白の美学 + ★1×3（空き枠4）', tokens: [T('empty_slot_beauty'), T('bonus_1c_fire'), T('bonus_1c_water'), T('bonus_1c_heart')] },
  { key: 'F_sky_4', group: 'F 所持数で変わる系', label: '空の神 + ★1 連舞×3', tokens: [T('legend_sky_god'), T('bonus_1c_fire'), T('bonus_1c_water'), T('bonus_1c_heart')] },
];
