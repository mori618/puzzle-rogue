/**
 * 追加の二つ名（出現率アップ ＋ 何かの効果）
 * titles.js の PREFIX_TITLES（A枠）/ SUFFIX_TITLES（B枠）の末尾に追加される。
 *
 * 1. 遊びトークンの二つ名（PLAY_*）
 *    釣り・ハイアンドロー・的当て・うさぎ/狼・じゃんけん などのミニゲームで解放され、
 *    その遊びトークンがショップに出やすくなる ＋ その遊びがちょっと強くなる。
 *
 * 2. タグの二つ名（TAG_*）
 *    トークンのタグ（tokenTags.js）ごとに1つずつ。
 *    「【タグ】のトークンを同時に N 個所持」で解放され、そのタグのトークンがショップに出やすくなる ＋ 小さな効果。
 *    （【遊び】は B76 遊び人、【確率】は B75 ギャンブラー、【属性】は各属性の二つ名があるので作らない）
 *
 * ■ この追加で増えた効果の種類（titleManager / useShop / useGameState で解釈する）
 *   shop_token_weight { ids, value } : 指定したトークンのショップ出現重み ×value（1未満で出にくくなる）
 *   shop_tag_weight   { tag, value } : そのタグのトークンのショップ出現重み ×value
 *   skill_cost_sub    { tag }        : そのタグのアクティブスキルだけ消費エネルギー -value（tag 指定は今回追加）
 *   per: 'tag_token'  { tag }        : 所持している、そのタグのトークンの数
 *   fish_double_chance   : 釣り・大物釣りで、value の確率で魚が2匹釣れる（効果も2回）
 *   highlow_win_levelup  : ハイアンドローで勝つ（ダブルアップ成功）たびに、ランダムなトークン value 個のレベル+1
 *   target_center_boost  : 的当て・精密射撃で中心（ど真ん中・真芯）に当てたときの効果 ×value
 *   wolf_eat_stars       : 狼がうさぎを1匹捕食するたびに +value★
 *   janken_win_stars     : じゃんけんの勝ち1回につき +value★（終了時）
 *   minigame_reward_boost { games } : そのミニゲーム（minigameState.type）の良い効果 ×value（代償はそのまま）
 *   gamble_win_stars     : ギャンブル・大博打で当たりを引くたびに +value★
 *
 *   ※ 遊びの二つ名は、遊び方（ルール・制限時間・確率・初期状態）を変えず、結果の効果だけを増やす。
 *     実績の記録（連打数・距離など）が二つ名で変わらないようにするため。
 */

// --- トークンID ---------------------------------------------------------------
export const FISHING_TOKEN_IDS = ['minigame_fishing', 'minigame_fishing_big'];
export const TARGET_TOKEN_IDS = ['minigame_target', 'minigame_target_pro'];
export const HIGHLOW_TOKEN_IDS = ['minigame_highlow'];
export const JANKEN_TOKEN_IDS = ['minigame_janken'];
export const DICE_TOKEN_IDS = ['minigame_dice', 'minigame_dice_duo'];
export const MASH_TOKEN_IDS = ['minigame_mash', 'minigame_mash_duo'];
export const RUNNING_TOKEN_IDS = ['minigame_running'];
export const DEMON_TOKEN_IDS = ['minigame_demon'];
export const GAMBLE_TOKEN_IDS = ['gamble', 'gamble_high'];
// うさぎ・狼（tokenUtils の RABBIT_TOKEN_IDS と同じ。循環 import を避けるためここにも書く）
export const RABBIT_IDS = ['rabbit_passive', 'rabbit_active'];
export const WOLF_IDS = ['wolf_active'];

// --- 1. 遊びトークンの二つ名 --------------------------------------------------

export const PLAY_PREFIX_TITLES = [
  {
    id: 'A76', name: '釣り好きの', category: '遊び（釣り）',
    desc: '釣り・大物釣りがショップに出やすくなる（3倍）、30%の確率で魚が一度に2匹釣れる（効果も2回発動）',
    conditionType: 'fishing_tokens_max', targetValue: 2,
    conditionDesc: '釣り系のトークン（釣り・大物釣り）を一度に2つ所持',
    effects: [
      { type: 'shop_token_weight', ids: FISHING_TOKEN_IDS, value: 3 },
      { type: 'fish_double_chance', value: 0.3 },
    ],
  },
  {
    id: 'A77', name: 'ハイな', category: '遊び（ハイアンドロー）',
    desc: 'ハイアンドローがショップに出やすくなる（3倍）、ダブルアップに成功するたびにランダムなトークン1つのレベル+1',
    conditionType: 'highlow_wins_max', targetValue: 3,
    conditionDesc: 'ハイアンドローでダブルアップを3連続で成功させる',
    effects: [
      { type: 'shop_token_weight', ids: HIGHLOW_TOKEN_IDS, value: 3 },
      { type: 'highlow_win_levelup', value: 1 },
    ],
  },
  {
    id: 'A78', name: '負け知らずの', category: '遊び（じゃんけん）',
    desc: 'じゃんけんがショップに出やすくなる（3倍）、じゃんけんの勝ち1回につき +5★',
    conditionType: 'janken_streak_max', targetValue: 5,
    conditionDesc: 'じゃんけんで5連勝する',
    effects: [
      { type: 'shop_token_weight', ids: JANKEN_TOKEN_IDS, value: 3 },
      { type: 'janken_win_stars', value: 5 },
    ],
  },
  {
    id: 'A79', name: '韋駄天の', category: '遊び（ランニング）',
    desc: 'ランニングがショップに出やすくなる（3倍）、ランニングの良い効果 ×1.5',
    conditionType: 'running_meters_max', targetValue: 400,
    conditionDesc: 'ランニングで400m以上走る',
    effects: [
      { type: 'shop_token_weight', ids: RUNNING_TOKEN_IDS, value: 3 },
      { type: 'minigame_reward_boost', games: ['running'], value: 1.5 },
    ],
  },
  {
    id: 'A80', name: '連打の', category: '遊び（連打）',
    desc: '連打・交互連打がショップに出やすくなる（3倍）、連打・交互連打の良い効果 ×1.5',
    conditionType: 'mash_taps_max', targetValue: 60,
    conditionDesc: '連打・交互連打で60回以上押す',
    effects: [
      { type: 'shop_token_weight', ids: MASH_TOKEN_IDS, value: 3 },
      { type: 'minigame_reward_boost', games: ['mash', 'mash_duo'], value: 1.5 },
    ],
  },
];

export const PLAY_SUFFIX_TITLES = [
  {
    id: 'B77', name: 'スナイパー', category: '遊び（的当て）',
    desc: '的当て・精密射撃がショップに出やすくなる（3倍）、中心（ど真ん中・真芯）に当てたときの効果 ×1.5',
    conditionType: 'target_center_hits', targetValue: 10,
    conditionDesc: '的当て・精密射撃で中心（ど真ん中・真芯）に累計10回当てる',
    effects: [
      { type: 'shop_token_weight', ids: TARGET_TOKEN_IDS, value: 3 },
      { type: 'target_center_boost', value: 1.5 },
    ],
  },
  {
    id: 'B78', name: 'ブリーダー', category: '遊び（うさぎ）',
    desc: 'うさぎトークンがショップに出やすくなる（3倍）、狼トークンが出にくくなる（1/3）',
    conditionType: 'rabbit_held_max', targetValue: 5,
    conditionDesc: 'うさぎトークンを一度に5つ所持',
    effects: [
      { type: 'shop_token_weight', ids: RABBIT_IDS, value: 3 },
      { type: 'shop_token_weight', ids: WOLF_IDS, value: 1 / 3 },
    ],
  },
  {
    id: 'B79', name: '狩人', category: '遊び（狼）',
    desc: 'うさぎトークン・狼トークンがショップに出やすくなる（2倍）、狼がうさぎを1匹捕食するたびに +10★',
    conditionType: 'wolf_rabbits_eaten', targetValue: 4,
    conditionDesc: '狼トークンでうさぎトークンを累計4個捕食させる',
    effects: [
      { type: 'shop_token_weight', ids: [...RABBIT_IDS, ...WOLF_IDS], value: 2 },
      { type: 'wolf_eat_stars', value: 10 },
    ],
  },
  {
    id: 'B80', name: '賽振り', category: '遊び（サイコロ）',
    desc: 'サイコロ・ダブルダイスがショップに出やすくなる（3倍）、サイコロ・ダブルダイスの良い効果 ×1.5',
    conditionType: 'dice_doubles', targetValue: 3,
    conditionDesc: 'ダブルダイスで累計3回ゾロ目を出す',
    effects: [
      { type: 'shop_token_weight', ids: DICE_TOKEN_IDS, value: 3 },
      { type: 'minigame_reward_boost', games: ['dice', 'dice_duo'], value: 1.5 },
    ],
  },
  {
    id: 'B81', name: '悪魔祓い', category: '遊び（デーモン）',
    desc: 'デーモンがショップに出やすくなる（3倍）、デーモンに勝った・引き分けたときの効果 ×1.5',
    conditionType: 'demon_wins', targetValue: 3,
    conditionDesc: 'デーモンに累計3回勝つ',
    effects: [
      { type: 'shop_token_weight', ids: DEMON_TOKEN_IDS, value: 3 },
      { type: 'minigame_reward_boost', games: ['demon'], value: 1.5 },
    ],
  },
  {
    id: 'B82', name: '宝箱荒らし', category: '遊び（ギャンブル）',
    desc: 'ギャンブル・大博打がショップに出やすくなる（3倍）、当たりを引くたびに +20★',
    conditionType: 'gamble_doubleup_wins', targetValue: 2,
    conditionDesc: 'ギャンブル・大博打のダブルアップで累計2回当たりを引く',
    effects: [
      { type: 'shop_token_weight', ids: GAMBLE_TOKEN_IDS, value: 3 },
      { type: 'gamble_win_stars', value: 20 },
    ],
  },
];

// --- 2. タグの二つ名 ----------------------------------------------------------

/**
 * タグの二つ名の元データ
 * [tag, タグ名, 枠('A'|'B'), 二つ名, 解放に必要な同時所持数, 追加効果]
 * 追加効果:
 *   ['combo', v, max]  そのタグのトークン1つにつきコンボ +v（最大 max 個分）
 *   ['mult', v, max]   そのタグのトークン1つにつきコンボ倍率 +v（最大 max 個分）
 *   ['cost', v]        そのタグのアクティブスキルの消費エネルギー -v
 *   ['time', ms]       操作時間 +ms
 *   ['stars', v]       サイクルクリア時に +v★
 *   ['reroll', v]      リロール価格 -v★
 */
const TAG_TITLE_TABLE = [
  ['multiplier', '倍率', 'A', '倍々の', 5, ['mult', 0.1, 6]],
  ['combo_add', 'コンボ加算', 'B', '積み上げ職人', 4, ['combo', 2, 6]],
  ['board', '盤面操作', 'A', '盤上の', 5, ['cost', 1]],
  ['skyfall', '落下', 'B', '雨乞い師', 4, ['combo', 2, 6]],
  ['special_drop', '特殊ドロップ', 'A', '仕掛けの', 4, ['mult', 0.1, 6]],
  ['shape', '消し方', 'B', '型使い', 4, ['mult', 0.1, 6]],
  ['economy', 'スター・ショップ', 'A', '商い上手の', 3, ['stars', 5]],
  ['time', '操作時間', 'B', '時計職人', 3, ['time', 1000]],
  ['energy', 'エネルギー', 'A', '充電中の', 3, ['mult', 0.15, 4]],
  ['growth', '成長', 'B', '大器晩成', 3, ['mult', 0.15, 4]],
  ['build', '構成', 'A', '設計図の', 4, ['combo', 2, 6]],
  ['bomb', 'ボム', 'B', '花火師', 3, ['combo', 3, 5]],
  ['repeat', 'リピート', 'A', '繰り返す', 3, ['combo', 3, 5]],
  ['star_drop', 'スタードロップ', 'B', '星拾い', 3, ['stars', 5]],
  ['plus', '強化ドロップ', 'A', '鍛え抜かれた', 3, ['mult', 0.1, 5]],
  ['move', 'ムーブドロップ', 'B', '散歩好き', 2, ['combo', 4, 4]],
  ['cross', '十字', 'A', '交差する', 2, ['combo', 4, 4]],
  ['l_shape', 'L字', 'B', '曲がり屋', 2, ['combo', 4, 4]],
  ['square', '正方形', 'A', '四角四面の', 2, ['combo', 4, 4]],
  ['row', '横1列', 'B', '一文字', 2, ['combo', 4, 4]],
  ['column', '縦1列', 'A', '直立不動の', 2, ['combo', 4, 3]],
  ['len4', '4個消し', 'B', '四つ葉', 3, ['combo', 3, 5]],
  ['convert', '変換', 'A', '移ろいの', 4, ['cost', 1]],
  ['spawn', '生成', 'B', '創造主', 3, ['cost', 1]],
  ['minigame', 'ミニゲーム', 'A', '遊び心の', 3, ['mult', 0.1, 5]],
  ['money', 'スター稼ぎ', 'B', '守銭奴', 3, ['stars', 8]],
  ['shop', 'ショップ', 'A', 'お得意様の', 2, ['reroll', 1]],
  ['slot', '配置', 'B', '整頓係', 2, ['mult', 0.15, 4]],
  ['level', 'レベル', 'A', '育ち盛りの', 3, ['combo', 3, 5]],
  ['token_gen', 'トークン入手', 'B', '招き猫', 2, ['mult', 0.15, 4]],
  ['big_erase', '大量消し', 'A', '大掃除の', 3, ['combo', 3, 5]],
  ['turn_end', 'ターン終了時', 'B', '店じまい', 4, ['mult', 0.1, 5]],
  ['finger', 'なぞり', 'A', '指先の', 3, ['time', 1000]],
  ['buff', '持続バフ', 'B', '持久走者', 4, ['cost', 1]],
  ['multi_color', '多色', 'A', '彩り豊かな', 3, ['mult', 0.1, 5]],
  ['mono_color', '単色特化', 'B', '一途者', 3, ['mult', 0.15, 4]],
  ['combo_condition', 'コンボ数条件', 'A', '計算高い', 2, ['combo', 4, 3]],
  ['risk', '代償あり', 'B', '命知らず', 3, ['mult', 0.15, 5]],
  ['curse', '呪い', 'A', '呪われし', 2, ['mult', 0.2, 3]],
  ['skip', 'スキップ', 'B', '寄り道好き', 2, ['combo', 5, 2]],
];

/** タグの二つ名で、その二つ名の条件の進捗キー */
export const tagTitleProgressKey = (tag) => `tag_${tag}_max`;

const describeExtra = (label, [kind, v, max]) => {
  const t = `【${label}】`;
  switch (kind) {
    case 'combo': return `${t}のトークン1つにつきコンボ +${v}（最大 +${v * max}）`;
    case 'mult': return `${t}のトークン1つにつきコンボ倍率 +${v}（最大 +${Math.round(v * max * 100) / 100}）`;
    case 'cost': return `${t}のアクティブスキルの消費エネルギー -${v}`;
    case 'time': return `操作時間 +${v / 1000}秒`;
    case 'stars': return `サイクルクリア時に +${v}★`;
    case 'reroll': return `リロール価格 -${v}★`;
    default: return '';
  }
};

const extraEffect = (tag, [kind, v, max]) => {
  switch (kind) {
    case 'combo': return { type: 'combo_add', value: v, per: 'tag_token', tag, max };
    case 'mult': return { type: 'add_mult', value: v, per: 'tag_token', tag, max };
    case 'cost': return { type: 'skill_cost_sub', value: v, tag };
    case 'time': return { type: 'time_add', value: v };
    case 'stars': return { type: 'cycle_clear_stars', value: v };
    case 'reroll': return { type: 'reroll_sub', value: v };
    default: return null;
  }
};

let prefixNo = 81;
let suffixNo = 83;
const buildTagTitle = ([tag, label, slot, name, target, extra]) => {
  const id = slot === 'A' ? `A${prefixNo++}` : `B${suffixNo++}`;
  return {
    id, name, category: `タグ（${label}）`,
    tag,
    desc: `【${label}】のトークンがショップに出やすくなる（3倍）、${describeExtra(label, extra)}`,
    conditionType: tagTitleProgressKey(tag), targetValue: target,
    conditionDesc: `【${label}】のトークンを同時に${target}個所持`,
    effects: [{ type: 'shop_tag_weight', tag, value: 3 }, extraEffect(tag, extra)],
  };
};

const TAG_TITLES = TAG_TITLE_TABLE.map(buildTagTitle);

export const TAG_PREFIX_TITLES = TAG_TITLES.filter(t => t.id.startsWith('A'));
export const TAG_SUFFIX_TITLES = TAG_TITLES.filter(t => t.id.startsWith('B'));

/** タグの二つ名があるタグの一覧（解放条件の進捗記録用） */
export const TITLE_TAGS = TAG_TITLE_TABLE.map(row => row[0]);

export const EXTRA_PREFIX_TITLES = [...PLAY_PREFIX_TITLES, ...TAG_PREFIX_TITLES];
export const EXTRA_SUFFIX_TITLES = [...PLAY_SUFFIX_TITLES, ...TAG_SUFFIX_TITLES];
