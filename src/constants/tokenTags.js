// トークンのタグ（グループ）定義
// ---------------------------------------------------------------------------
// 1つのトークンに複数のタグが付く。ショップの「ランごとの傾向」(runTrends.js) などで、
// 出現しやすさを制御するために使う。
//
// タグは基本的にトークンの effect / action / 説明文から自動で判定する。
// 自動判定が合わないトークンは、トークン定義に `tags: [...]` を書くか、
// 下の TAG_OVERRIDES に追加・除外を書いて調整する。
// ---------------------------------------------------------------------------

/** タグの一覧（表示名つき） */
export const TOKEN_TAGS = {
  attribute: { label: "属性" },          // 特定の属性（色）に関わる
  multiplier: { label: "倍率" },         // コンボ倍率を上げる
  combo_add: { label: "コンボ加算" },    // コンボ数を加算する
  probability: { label: "確率" },        // 確率で発動する / 確率系トークンに関わる
  fun: { label: "遊び" },                // ミニゲーム・ギャンブル・クセの強いルール変更
  board: { label: "盤面操作" },          // 変換・生成・整列など盤面を直接いじる
  skyfall: { label: "落下" },            // 落ちてくるドロップ・落ちコンに関わる
  special_drop: { label: "特殊ドロップ" }, // ボム・リピート・スター・プラス・ムーブ
  shape: { label: "消し方" },            // 十字・L字・正方形・横1列・4個消し など
  economy: { label: "スター・ショップ" }, // スター（通貨）・ショップ・売却
  time: { label: "操作時間" },           // 操作時間を伸ばす・変える
  energy: { label: "エネルギー" },       // アクティブスキルのエネルギー・持続手番
  growth: { label: "成長" },             // 累計カウントで育つ・ラン中の記録を参照する
  build: { label: "構成" },              // 所持トークン数・レベル・スロット位置などを参照する
};

export const TOKEN_TAG_IDS = Object.keys(TOKEN_TAGS);

// effect / action からタグを決めるルール
const EFFECT_TAGS = {
  // 盤面操作（アクティブ）
  convert: ["board"], convert_multi: ["board"], convert_pair: ["board"],
  board_change: ["board"], board_balance: ["board"], organize_color: ["board"],
  row_fix: ["board"], col_fix: ["board"], spawn_random: ["board"],
  erase_color: ["board", "combo_add"], force_refresh: ["board", "skyfall"],
  finger_transform_active: ["board"], finger_transform_passive: ["board"],
  turn_end_convert: ["board"], turn_end_convert_multi: ["board"], turn_end_spawn: ["board"],
  turn_end_full_board: ["board"], erosion_color: ["board"],
  // 落下
  skyfall: ["skyfall"], skyfall_limit: ["skyfall"], skyfall_bonus: ["skyfall", "combo_add"],
  forbidden: ["skyfall"], vacation: ["skyfall"], picky_eater: ["skyfall", "fun"],
  gravity_overdrive: ["skyfall", "fun"], gale_gravity: ["skyfall", "fun"],
  // 特殊ドロップ
  spawn_bomb_random: ["special_drop"], convert_bomb_targeted: ["special_drop"],
  spawn_repeat: ["special_drop"], convert_repeat: ["special_drop"],
  spawn_star: ["special_drop", "economy"], convert_star: ["special_drop", "economy"],
  enhance_color: ["special_drop"], move_drop: ["special_drop", "combo_add"],
  move_drop_add: ["special_drop"], awakening: ["special_drop"],
  // エネルギー
  charge_boost: ["energy"], auto_charge: ["energy"], zero_combo_charge: ["energy"],
  active_duration_boost: ["energy"], heart_to_energy: ["energy"],
  magical_leadership: ["energy", "build"],
  // 操作時間
  op_time_boost: ["time"], time_permanent: ["time"], time_bank: ["time"], time_bank_release: ["time"],
  // スター・ショップ
  star_gain: ["economy"], sale_boost: ["economy"], shop_expand: ["economy"],
  shop_rarity_weight: ["economy"], shop_attribute_weight: ["economy"], celeb: ["economy"],
  skip_bonus_multiplier: ["economy"], greed_power: ["economy"], empty_wallet: ["economy"],
  debt_credit: ["economy"], star_earn_boost: ["economy"], row_free_reroll: ["economy"],
  medal_of_spendthrift: ["economy", "growth"], stat_spend_star: ["economy", "growth"],
  // 構成（所持トークンを参照）
  copy_left: ["build"], copy_right: ["build"], rearguard: ["build"], element_lead: ["build"],
  king: ["build"], sky_god: ["build"], empty_slot_mult: ["build"],
  star_count_combo_add: ["build"], star_count_time_ext: ["build"], star_count_combo_mult: ["build"],
  total_level_combo_add: ["build"], level3_count_combo_mult: ["build"],
  attribute_count_multiplier: ["build"], no_attribute_multiplier: ["build"],
  curse_count_combo_mult: ["build"], random_levelup: ["build"],
  spawn_token_s1: ["build"], spawn_token_s2: ["build"], spawn_token_s3: ["build"],
  // 確率
  double_probability: ["probability"], force_trigger_probabilities: ["probability"],
  add_probability: ["probability"], probability_trigger_multiplier: ["probability"],
  probability_trigger_add_combo: ["probability"], critical_strike: ["probability"],
  // 遊び
  gamble: ["fun", "economy", "probability"], minigame_janken: ["fun"], minigame_fishing: ["fun"],
  minigame_target: ["fun"], minigame_mash: ["fun"], minigame_dice: ["fun", "probability"],
  rabbit_combo: ["fun"], wolf_hunt: ["fun"], rabbit_count_combo_mult: ["fun"],
  random_add: ["fun", "probability"], trial_stage: ["fun"], calm: ["fun"],
  one_stroke_seal: ["fun"], four_match_restriction: ["fun"], row_match_restriction: ["fun"],
  desperate_stance: ["fun", "time"], tyrant_decree: ["fun", "time"], min_match: ["fun"],
  expand_board: ["fun"], additive_mastery: ["fun", "combo_add"], cursed_power: ["fun"],
  turn_end_star_gamble: ["fun", "economy"], turn_end_token_gamble: ["fun", "build"],
  element_contract: ["fun"], curse_seal: ["fun", "build"], same_color_streak: ["fun"],
};

// id 単位の上書き（add: 追加, remove: 除外）
const TAG_OVERRIDES = {
  exchange_star3: { add: ["build", "fun"] },
  devotion_fire: { add: ["fun"] },
  devotion_water: { add: ["fun"] },
  passive_fire_count: { add: ["build"] },
  passive_wood_count: { add: ["economy"] },
  passive_dark_count: { add: ["build"] },
  passive_light_count: { add: ["energy"] },
  heart_charge: { add: ["energy"] },
  magic_reflux_light: { add: ["energy"] },
  magic_reflux_heart: { add: ["energy"] },
  legend_limit_breaker: { add: ["multiplier"] },
  limit_breaker: { add: ["multiplier"] },
  legend_magic_stone: { add: ["fun"] },
  legend_saint: { add: ["build"] },
  rabbit_active: { add: ["probability"] },
  bonus_skyfall: { add: ["skyfall"] },
  mana_crystal: { add: ["special_drop", "skyfall"] },
  proof_of_veteran: { add: ["special_drop"] },
  pure_power: { remove: ["attribute"], add: ["build"] },
  move_drop_add_active: { remove: ["attribute"] },
  bonus_5c: { remove: ["attribute"] },
  bonus_6c: { remove: ["attribute"] },
  board_bal_5: { remove: ["attribute"] },
  magical_leadership: { remove: ["probability"] },
};

// 説明文のキーワードからタグを決めるルール
const DESC_RULES = [
  { tag: "multiplier", re: /コンボ倍率|倍率を|倍率が|倍率に/ },
  { tag: "combo_add", re: /コンボ\+|コンボ＋|コンボ加算|コンボ数に加算|コンボに加算|コンボ追加|コンボ数を\[|基礎コンボ\+/ },
  { tag: "probability", re: /%の確率|％の確率|確率系/ },
  { tag: "special_drop", re: /ボム|リピート|スタードロップ|プラスドロップ|強化（|強化\d|強化ドロップ|ムーブドロップ|全て強化|全て炎|全て雨|全て風|全て雷|全て月|全てハート/ },
  { tag: "shape", re: /十字|L字|正方形|方陣|四角消し|横1列|横一列|縦1列|特殊消し|4個消し|4つ消し|5個以上連結|4個同時/ },
  { tag: "economy", re: /スター（通貨）|所持スター|★獲得|スターを獲得|ショップ|リロール|売却値|報酬倍率|★\[/ },
  { tag: "time", re: /操作時間/ },
  { tag: "energy", re: /エネルギー|チャージ|持続手番|効果手番/ },
  { tag: "growth", re: /累計|現在のゲーム中|現在のクリア回数|合計操作時間/ },
  { tag: "skyfall", re: /落ちコン|降ってく|落ちてこな|落下/ },
];

const cache = new Map();

const stripCostText = (desc) => (desc || "").replace(/消費E:\{cost\}/g, "");

/** トークンのタグを自動判定する（キャッシュしない生の計算） */
export const computeTokenTags = (token) => {
  if (!token) return [];
  if (Array.isArray(token.tags)) return [...token.tags];

  const tags = new Set();
  const key = token.effect || token.action;
  (EFFECT_TAGS[key] || []).forEach(t => tags.add(t));

  const desc = stripCostText(token.desc);
  DESC_RULES.forEach(({ tag, re }) => { if (re.test(desc)) tags.add(tag); });

  const attrs = token.attributes || [];
  if (attrs.length > 0 && attrs.length <= 4) tags.add("attribute");

  const ov = TAG_OVERRIDES[token.id];
  if (ov) {
    (ov.add || []).forEach(t => tags.add(t));
    (ov.remove || []).forEach(t => tags.delete(t));
  }
  return TOKEN_TAG_IDS.filter(t => tags.has(t));
};

/** トークンのタグ一覧（id ごとにキャッシュ） */
export const getTokenTags = (token) => {
  if (!token) return [];
  const id = token.id;
  if (id && cache.has(id)) return cache.get(id);
  const tags = computeTokenTags(token);
  if (id) cache.set(id, tags);
  return tags;
};

/** トークンが指定タグを持つか */
export const hasTokenTag = (token, tag) => getTokenTags(token).includes(tag);
