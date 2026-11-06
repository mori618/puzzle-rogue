// トークンのタグ（グループ）定義
// ---------------------------------------------------------------------------
// 1つのトークンに複数のタグが付く。ショップの「ランごとの傾向」(runTrends.js) などで、
// 出現しやすさを制御するために使う。
//
// タグは基本的にトークンの effect / action / 説明文から自動で判定する。
// 自動判定が合わないトークンは、トークン定義に `tags: [...]` を書くか、
// 下の TAG_OVERRIDES に追加・除外を書いて調整する。
// ---------------------------------------------------------------------------

/**
 * タグの一覧
 * - 大分類（parent なし）と、その中をさらに細かく分けた小分類（parent あり）がある
 * - 小分類が付いたトークンには、親の大分類も自動で付く（例: ボム → 特殊ドロップ）
 */
export const TOKEN_TAGS = {
  // ===== 大分類 =====
  attribute: { label: "属性" },            // 特定の属性（色）に関わる
  multiplier: { label: "倍率" },           // コンボ倍率を上げる
  combo_add: { label: "コンボ加算" },      // コンボ数を加算する
  probability: { label: "確率" },          // 確率で発動する / 確率系トークンに関わる
  fun: { label: "遊び" },                  // ミニゲーム・ギャンブル・クセの強いルール変更
  board: { label: "盤面操作" },            // 変換・生成・整列など盤面を直接いじる
  skyfall: { label: "落下" },              // 落ちてくるドロップ・落ちコンに関わる
  special_drop: { label: "特殊ドロップ" }, // ボム・リピート・スター・プラス・ムーブ
  shape: { label: "消し方" },              // 十字・L字・正方形・横1列・4個消し など
  economy: { label: "スター・ショップ" },  // スター（通貨）・ショップ・売却
  time: { label: "操作時間" },             // 操作時間を伸ばす・変える
  energy: { label: "エネルギー" },         // アクティブスキルのエネルギー・持続手番
  growth: { label: "成長" },               // 累計カウントで育つ・ラン中の記録を参照する
  build: { label: "構成" },                // 所持トークン数・レベル・スロット位置などを参照する

  // ===== 小分類: 特殊ドロップ =====
  bomb: { label: "ボム", parent: "special_drop" },
  repeat: { label: "リピート", parent: "special_drop" },
  star_drop: { label: "スタードロップ", parent: "special_drop" },
  plus: { label: "強化ドロップ", parent: "special_drop" },
  move: { label: "ムーブドロップ", parent: "special_drop" },

  // ===== 小分類: 消し方 =====
  cross: { label: "十字", parent: "shape" },
  l_shape: { label: "L字", parent: "shape" },
  square: { label: "正方形", parent: "shape" },
  row: { label: "横1列", parent: "shape" },
  column: { label: "縦1列", parent: "shape" },
  len4: { label: "4個消し", parent: "shape" },

  // ===== 小分類: 盤面操作 =====
  convert: { label: "変換", parent: "board" },     // ドロップの色を変える
  spawn: { label: "生成", parent: "board" },       // ドロップを新しく作る

  // ===== 小分類: 遊び =====
  minigame: { label: "ミニゲーム", parent: "fun" },

  // ===== 小分類: スター・ショップ =====
  money: { label: "スター稼ぎ", parent: "economy" }, // スター（通貨）を増やす・スターを参照する
  shop: { label: "ショップ", parent: "economy" },    // ショップの品揃え・価格・リロール

  // ===== 小分類: 構成 =====
  slot: { label: "配置", parent: "build" },          // スロットの位置・隣のトークンを参照する
  level: { label: "レベル", parent: "build" },       // トークンのレベルを上げる・参照する
  token_gen: { label: "トークン入手", parent: "build" }, // トークンを新しく手に入れる

  // ===== その他の切り口（親なし） =====
  big_erase: { label: "大量消し" },        // たくさん繋げる・たくさん消すと得をする
  turn_end: { label: "ターン終了時" },     // ターン終了時に発動する
  finger: { label: "なぞり" },             // なぞり操作（ドラッグ）に関わる
  buff: { label: "持続バフ" },             // 数手番のあいだ続くアクティブスキル
  multi_color: { label: "多色" },          // 複数の色を同時に消すと得をする
  mono_color: { label: "単色特化" },       // 1色に寄せると得をする
  combo_condition: { label: "コンボ数条件" }, // コンボ数が○以上／以下のときに発動
  risk: { label: "代償あり" },             // デメリットや失敗の可能性がある
  curse: { label: "呪い" },                // 呪いトークンに関わる
  skip: { label: "スキップ" },             // ターンのスキップに関わる
};

export const TOKEN_TAG_IDS = Object.keys(TOKEN_TAGS);

// effect / action からタグを決めるルール
const EFFECT_TAGS = {
  // 盤面操作（アクティブ）
  convert: ["board"], convert_multi: ["board"], convert_pair: ["board"],
  organize_color: ["board"],
  erase_color: ["board", "combo_add"], force_refresh: ["board", "skyfall"],
  finger_transform_active: ["board"], finger_transform_passive: ["board"],
  turn_end_convert: ["board"], turn_end_convert_multi: ["board"], erosion_color: ["board"],
  // 落下
  skyfall: ["skyfall"], skyfall_limit: ["skyfall"], skyfall_bonus: ["skyfall", "combo_add"],
  forbidden: ["skyfall"], vacation: ["skyfall"], picky_eater: ["skyfall", "fun"],
  gravity_overdrive: ["skyfall", "fun"], gale_gravity: ["skyfall", "fun"],
  // 特殊ドロップ
  spawn_bomb_random: ["special_drop"], convert_bomb_targeted: ["special_drop"],
  spawn_repeat: ["special_drop"], convert_repeat: ["special_drop"],
  move_drop: ["special_drop", "combo_add"],
  move_drop_add: ["special_drop"],
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
  gamble: ["fun", "money", "probability", "risk", "minigame"], minigame_janken: ["minigame"], minigame_fishing: ["minigame"],
  minigame_target: ["minigame"], minigame_mash: ["minigame"], minigame_dice: ["minigame", "probability", "risk"],
  rabbit_combo: ["fun"], wolf_hunt: ["fun"], rabbit_count_combo_mult: ["fun"],
  random_add: ["fun", "probability"], trial_stage: ["fun"], calm: ["fun"],
  one_stroke_seal: ["fun"], four_match_restriction: ["fun"], row_match_restriction: ["fun"],
  desperate_stance: ["fun", "time"], tyrant_decree: ["fun", "time"], min_match: ["fun"],
  expand_board: ["fun"], additive_mastery: ["fun", "combo_add"], cursed_power: ["fun"],
  turn_end_star_gamble: ["fun", "economy"], turn_end_token_gamble: ["fun", "build"],
  curse_seal: ["fun", "build"],
  // 小分類
  enhance_color: ["plus"], awakening: ["plus"], enhance_chance: ["plus"],
  enhanced_orb_bonus: ["plus"], enhanced_link_multiplier: ["plus"],
  spawn_star: ["star_drop", "money"], convert_star: ["star_drop", "money"],
  spawn_random: ["spawn"], turn_end_spawn: ["spawn"], turn_end_special_spawn: ["spawn"],
  board_change: ["convert"], board_balance: ["convert"], row_fix: ["convert"], col_fix: ["convert"],
  turn_end_full_board: ["convert", "mono_color"], element_contract: ["fun", "mono_color", "risk"],
  same_color_streak: ["fun", "mono_color"], color_shift_bonus: ["multi_color"],
  combo_if_le: ["combo_condition"], combo_if_ge: ["combo_condition"], inugami: ["combo_condition"],
};

// id 単位の上書き（add: 追加, remove: 除外）
const TAG_OVERRIDES = {
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
  // 小分類の調整
  skip_master: { add: ["skip"] },
  copy_token: { remove: ["level"] },
  mirror_pair: { remove: ["level"] },
  gale_gravity: { remove: ["level"] },
  legend_celeb: { remove: ["risk"] },
  legend_vacation: { add: ["mono_color"] },
  picky_eater: { add: ["risk", "mono_color"] },
  devotion_fire: { add: ["fun", "mono_color", "risk"] },
  devotion_water: { add: ["fun", "mono_color", "risk"] },
  legend_acrobat: { add: ["mono_color"] },
  forbidden: { add: ["risk"] },
  desperate_stance: { add: ["risk"] },
  cursed_power: { add: ["risk"] },
  one_stroke_seal: { add: ["risk", "finger"] },
  four_match_restriction: { add: ["risk", "len4"] },
  row_match_restriction: { add: ["risk"] },
  additive_mastery: { add: ["risk"] },
  tyrant_decree: { add: ["risk", "plus"] },
  active_square_judgment: { add: ["risk"] },
  devil_loan: { add: ["risk"] },
  active_calm: { add: ["risk"] },
  trial: { add: ["risk"] },
  legend_king: { add: ["level"] },
  legend_saint: { add: ["build", "curse"] },
  legend_sky_god: { add: ["slot"] },
  empty_slot_beauty: { add: ["slot"] },
  exchange_star3: { add: ["build", "fun", "token_gen"] },
  board_mono1: { add: ["mono_color"] },
  board_mono2: { add: ["mono_color"] },
  board_mono3: { add: ["mono_color"] },
  board_mono4: { add: ["mono_color"] },
  board_mono5: { add: ["mono_color"] },
  board_mono6: { add: ["mono_color"] },
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
  // 小分類
  { tag: "bomb", re: /ボム/ },
  { tag: "repeat", re: /リピート/ },
  { tag: "star_drop", re: /スタードロップ|スターにします|プラススター/ },
  { tag: "plus", re: /プラスドロップ|プラス(炎|雨|風|雷|月|ハート|スター)|プラスに|強化（|強化\d|強化ドロップ|全て強化/ },
  { tag: "move", re: /ムーブ/ },
  { tag: "cross", re: /十字/ },
  { tag: "l_shape", re: /L字/ },
  { tag: "square", re: /正方形|方陣|四角消し|3x3/ },
  { tag: "row", re: /横1列|横一列|横列/ },
  { tag: "column", re: /縦1列/ },
  { tag: "len4", re: /4個消し|4つ消し|4個同時|4個以上繋げ/ },
  { tag: "convert", re: /変換|変化させ|に変化|に変更|浸食|侵食/ },
  { tag: "spawn", re: /(ドロップ|ボム|スター|リピート)[^。]{0,12}生成|再生成|招来/ },
  { tag: "money", re: /スター（通貨）|所持スター|★獲得|スターを獲得|スター所持数|スター量|スター\+|★\[|借金|売却値|報酬倍率/ },
  { tag: "shop", re: /ショップ|リロール|セール/ },
  { tag: "slot", re: /スロットの1番目|最後に装備|左隣|右隣/ },
  { tag: "level", re: /レベル|LvUP/ },
  { tag: "token_gen", re: /トークンを(1つ)?(生成|入手|獲得)|トークンを入手|トークンが生成/ },
  { tag: "big_erase", re: /5個以上|6個以上繋げ|12個以上|15個以上|10個以上消す/ },
  { tag: "turn_end", re: /ターン終了(時|後)|手番を終えた/ },
  { tag: "finger", re: /なぞり|ドラッグ|通過/ },
  { tag: "multi_color", re: /同時に消す|色以上|6色|色すべて|消さなかった属性|5属性/ },
  { tag: "combo_condition", re: /基礎コンボ数が|\d+コンボ(以下|以上)で|0コンボの時/ },
  { tag: "risk", re: /ただし|しかし|代わりに|代わり、|半減|半分になる|消せなくなる|出現しなくなる|獲得コンボが0|操作時間−|操作時間が常に|操作時間が「常に|呪いトークンが生成/ },
  { tag: "curse", re: /呪い|呪印/ },
  { tag: "skip", re: /スキップ/ },
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

  // 数手番のあいだ続くアクティブスキル
  if (token.type === "skill" && /\d(手番|ターン)の間|\d手番、/.test(desc)) tags.add("buff");

  const ov = TAG_OVERRIDES[token.id];
  if (ov) {
    (ov.add || []).forEach(t => tags.add(t));
    (ov.remove || []).forEach(t => tags.delete(t));
  }

  // 小分類が付いていれば、親の大分類も付ける
  [...tags].forEach(t => { const parent = TOKEN_TAGS[t]?.parent; if (parent) tags.add(parent); });
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
