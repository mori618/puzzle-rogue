// トークン効果の指標表を作る
//
//   最終コンボ = 基礎コンボ × コンボ倍率
//             = (盤面コンボ + ①コンボ加算) × (1 + ②加算倍率の合計) × ③乗算倍率の積
//
// 各トークンが ①②③ のどこに効くかを useGameState.js の handleTurnEnd の実装に合わせて手で分類し、
// 「発動したときに実際に入る値」を Lv1/Lv2/Lv3 で並べる（説明文の表記ではなく実装の値）。
// ほかに、ドロップ変換・生成、特殊ドロップ生成、操作時間を同じ形で比べる表も作る。
//
// 使い方（リポジトリ直下で）:
//   node balance-sim/sim/effect-index.mjs            → docs/token-effect-index.md と balance-sim/results/effect-index.json
//
// 分類:
//   fixed  … 常時 / 条件を満たしたら一定値（統計の対象）
//   unit   … 1回あたり（色コンボ・特殊消しなど、1手番に複数回入りうる）（別に統計を出す）
//   scale  … 所持数・累計・盤面の個数で伸びる（個別表示）
//   chance … 確率・ランダム（期待値つきで個別表示）
//   active … アクティブスキル（個別表示）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_TOKEN_BASES } from '../../src/constants/tokens.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const byId = Object.fromEntries(ALL_TOKEN_BASES.map(t => [t.id, t]));
const COLORS = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];

// ---- シミュレーション実測（単体テスト。トークン1個だけで15手番、ボットのプレイ） ----
const loadSim = (file) => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'balance-sim/results', file), 'utf8'));
    return Object.fromEntries(d.rows.map(r => [r.id, r]));
  } catch { return {}; }
};
const SIM1 = loadSim('sumA.json');
const SIM3 = loadSim('sumA3.json');

// ---- ① コンボ加算 / ② 加算倍率 / ③ 乗算倍率 ----
// ids: 同じ効果の色違いなどをまとめる。v: Lv1〜3 の実際の値（①は+N、②は+X、③は×X）
const E = [];
const add = (tier, kind, ids, v, cond, extra = {}) => E.push({ tier, kind, ids: [].concat(ids), v, cond, ...extra });
const ofColors = (fmt) => COLORS.map(c => fmt(c)).filter(id => byId[id]);

// ① コンボ加算
add(1, 'fixed', 'power_up', [2, 6, 15], '常時');
add(1, 'fixed', 'cursed_power', [30, 60, 100], '常時（操作時間−3秒）');
add(1, 'fixed', 'combo_exact_3', [15, 40, 100], '盤面のコンボが5以下');
add(1, 'fixed', 'combo_exact_10', [20, 60, 150], '盤面のコンボが10以下');
add(1, 'fixed', 'tempo_rhythm', [3, 5, 8], '操作時間4〜10秒（10秒超は②へ）');
add(1, 'unit', ofColors(c => `cc_add_${c}`), [2, 5, 10], 'その色1コンボごと');
add(1, 'unit', 'bonus_heart', [3, 5, 7], 'ハート1コンボごと');
add(1, 'unit', 'len4', [2, 6, 12], '4個消し1回ごと');
add(1, 'unit', 'row_clear', [5, 7, 10], '横1列消し1回ごと');
add(1, 'unit', 'l_shape', [3, 6, 9], 'L字消し1回ごと');
add(1, 'unit', 'col_slash_combo', [3, 7, 14], '縦1列消し1回ごと');
add(1, 'unit', 'square_combo_addition', [10, 15, 30], '正方形消し1回ごと');
add(1, 'unit', 'enhance_amp', [2, 5, 12], '強化ドロップ1個ごと（素の+1に上乗せ）');
add(1, 'unit', 'bonus_skyfall', [5, 15, 40], '落ちコン1回ごと', { note: '実測は修正前（発動していなかった）の値' });
add(1, 'scale', 'star1_combo_boost', [2, 4, 8], '★1トークン数 × 値', { ex: (v) => `★1が3個: +${v * 3} ／ 6個: +${v * 6}` });
add(1, 'scale', 'total_level_boost', [1, 2, 4], '全トークンのLv合計 × 値', { ex: (v) => `Lv合計12: +${v * 12} ／ 30: +${v * 30}` });
add(1, 'scale', 'memory_of_combo', [1, 2, 3], '最大基礎コンボ÷5 × 値', { ex: (v) => `最大30: +${v * 6} ／ 最大100: +${v * 20}` });
add(1, 'scale', 'seeker_of_cross', [1, 2, 3], '十字消しのとき、十字累計÷5 × 値', { ex: (v) => `累計10回: +${v * 2} ／ 30回: +${v * 6}` });
add(1, 'scale', 'seeker_of_len4', [1, 2, 3], '4個消しのとき、4個消し累計÷20 × 値', { ex: (v) => `累計40回: +${v * 2} ／ 100回: +${v * 5}` });
add(1, 'scale', 'move_drop', [5, 3, 1], 'ムーブドロップが値マス動くごとに+1', { unitLabel: 'マス/1', ex: (v) => `1手番20マス動かすと +${Math.floor(20 / v)}` });
add(1, 'chance', 'random_add', [25 / 7, 60 / 7, 145 / 7], '毎手番ランダム', { ex: (v, lv) => ['0〜10（期待3.6）', '0〜30（期待8.6）', '0〜100（期待20.7）'][lv - 1] });
add(1, 'active', 'erase_fire', [1, 2, 3], '指定色を全消去、消した数 × 値（特殊は2倍）', { ids: ofColors(c => `erase_${c}`), ex: (v) => `1色5個なら +${5 * v}（消費E1）` });
add(1, 'active', 'rabbit_active', [3, 5, 8], 'うさぎ数 × 値、2手番', { ex: (v) => `うさぎ2匹: +${v * 2}×2手番` });
add(1, 'active', 'minigame_janken', [5, 7, 10], '連勝数 × 値、3手番', { ex: (v) => `2連勝: +${v * 2}×3手番` });
add(1, 'active', 'minigame_mash', [0.4, 0.6, 0.8], '5秒の連打数 × 値、3手番', { ex: (v) => `40回: +${Math.floor(40 * v)}×3手番` });
add(1, 'active', 'minigame_mash_duo', [0.5, 0.7, 1], '交互連打数 × 値、3手番', { ex: (v) => `30回: +${Math.floor(30 * v)}×3手番` });
add(1, 'active', ['active_residual_dark', 'active_residual_heart'], [10, 15, 20], '次の手番、その色を消すと加算', { ex: (v) => `+${v}（1手番）` });
add(1, 'special', 'additive_mastery', [5, 20, 100], '①を全部 ×値。②③は全部無効');

// ② 加算倍率（説明文が「プラス{values}」でも、実装は values−1 を足すものが多い）
add(2, 'fixed', ofColors(c => `bonus_1c_${c}`), [1, 2, 3], 'その色を消す');
add(2, 'fixed', ['bonus_2c_fd', 'bonus_2c_wh', 'bonus_2c_gl', 'bonus_2c_wd', 'bonus_2c_gh', 'bonus_2c_fl'], [1, 2, 4], '指定2色を同時に消す');
add(2, 'fixed', ALL_TOKEN_BASES.filter(t => t.id.startsWith('bonus_3c_')).map(t => t.id), [2, 6, 9], '指定3色を同時に消す');
add(2, 'fixed', ofColors(c => `req_6_${c}`), [2, 3, 6], 'その色を6個以上消す');
add(2, 'fixed', ofColors(c => `req_12_${c}`), [2, 3, 4], 'その色を12個以上消す');
add(2, 'fixed', 'combo_ge_7', [1, 2, 4], '盤面7コンボ以上');
add(2, 'fixed', 'shape_master', [2, 3, 4], '異なる特殊消し2種類以上');
add(2, 'fixed', 'over_link', [1, 2, 4], '強化ドロップ5個以上を同時に消す');
add(2, 'fixed', 'dual_match', [-0.2, 0.2, 0.5], '常時（2個で消える）', { note: 'Lv1は倍率が下がる' });
add(2, 'scale', 'rabbit_passive', [1, 1.5, 2], 'うさぎ数 × 値 + 1', { ex: (v) => `うさぎ1匹: +${v + 1} ／ 3匹: +${v * 3 + 1}` });
add(2, 'scale', 'color_shift', [0.5, 1, 2], '前の手番に消さなかった色の数 × 値', { ex: (v) => `新色2: +${v * 2} ／ 新色4: +${v * 4}` });
add(2, 'scale', 'devil_loan', [5, 10, 20], '借金10★ごとに+1（値は借金上限での最大）', { ex: (v) => `最大 +${v}` });
add(2, 'scale', 'greed_power', [7, 5, 3], '所持★ ÷ 値（上限 +10/+20/+50）', { unitLabel: '★/1', ex: (v, lv) => `★30: +${Math.min(Math.floor(30 / v), [10, 20, 50][lv - 1])} ／ ★100: +${Math.min(Math.floor(100 / v), [10, 20, 50][lv - 1])}` });
add(2, 'scale', 'level3_count_mult', [2, 3, 4], 'Lv3トークン数 × 値 − 1（上限あり）', { ex: (v) => `Lv3が3個: +${v * 3 - 1} ／ 6個: +${v * 6 - 1}` });
add(2, 'scale', 'curse_count_mult', [2, 3, 5], '値^呪い数 − 1（上限あり）', { ex: (v) => `呪い1: +${v - 1} ／ 呪い3: +${v ** 3 - 1}` });
add(2, 'scale', 'repeat_erase_combo', [2, 3, 5], 'その手番にリピートドロップが消えた数 × 値', { ex: (v) => `2個: +${v * 2}` });
add(2, 'scale', 'play_count_mult', [1, 1.5, 2], '遊び系トークン数 × 値', { ex: (v) => `遊び3個: +${v * 3}` });
add(2, 'scale', 'play_loss_mult', [0.3, 0.5, 0.8], '遊び系の悪い結果の累計 × 値', { ex: (v) => `10回: +${+(v * 10).toFixed(1)}` });
add(2, 'scale', 'medal_of_spendthrift', [5, 3, 2], 'リロール累計 ÷ 値 × 0.5', { unitLabel: '回/0.5', ex: (v) => `リロール20回: +${Math.floor(20 / v) * 0.5}` });
add(2, 'scale', 'passive_probability_trigger_add', [2, 3, 4], '確率系の累計発動回数 × 値（上限なし）', { ex: (v) => `累計10回: +${v * 10} ／ 50回: +${v * 50}` });
add(2, 'scale', 'time_skipper', [2, 3, 4], '値^(スキップ数÷5) − 1', { ex: (v) => `スキップ10: +${v ** 2 - 1} ／ 20: +${v ** 4 - 1}` });
add(2, 'scale', 'echo_of_max', [0.1, 0.2, 0.5], 'ラン中の最大コンボ倍率 × 値（上限あり）', { ex: (v) => `最大倍率20: +${+(20 * v).toFixed(1)}` });
add(2, 'scale', 'memory_of_flash', [2, 3, 4], '(値^(横列累計÷5))^その手番の横列数 − 1（上限あり）', { ex: (v) => `累計10・横列1本: +${v ** 2 - 1}` });
add(2, 'scale', 'artisan_of_square', [2, 3, 5], '(値^(正方形累計÷5))^その手番の正方形数 − 1（上限あり）', { ex: (v) => `累計10・正方形1: +${v ** 2 - 1}` });
add(2, 'scale', 'pride_of_spendthrift', [2, 3, 4], '値^(消費★÷50) − 1（上限あり）', { ex: (v) => `消費150★: +${v ** 3 - 1}` });
add(2, 'scale', 'tempo_rhythm', [10, 10, 10], '操作時間10秒超: 操作秒数をそのまま加算', { ex: () => '12秒: +12', dup: true });
add(2, 'chance', 'critical_passive', [19, 49, 99], '20%で発動', { ex: (v) => `発動時 +${v}（期待値 +${+(v * 0.2).toFixed(1)}）` });
add(2, 'active', 'active_shape_len4', [1, 1, 1], '2手番、4個消しの数だけ加算', { ex: () => '4個消し2回: +2' });
add(2, 'active', 'active_shape_row', [2, 2, 2], '2手番、横列消しの数×2を加算', { ex: () => '横列1本: +2' });
add(2, 'active', 'active_shape_l_shape', [1, 1, 1], '2手番、L字消しの数だけ加算', { ex: () => 'L字1回: +1' });
add(2, 'active', 'wolf_active', [2, 3, 4], '2手番、捕食したうさぎ累計 × 値', { ex: (v) => `うさぎ3匹: +${v * 3}` });
add(2, 'active', ['active_residual_fire', 'active_residual_water'], [1, 1.5, 2], '次の手番、その色の消去数 × 値', { ex: (v) => `12個: +${12 * v}` });

// ③ 乗算倍率（旧「基礎コンボ×N」系もここ）
add(3, 'fixed', 'giant', [2, 3, 4], '常時（盤面7×6）');
add(3, 'fixed', 'forbidden', [2, 3, 4], '常時（落ちコンなし）');
add(3, 'fixed', 'desperate_stance', [2, 3, 4], '常時（操作時間4秒固定）');
add(3, 'fixed', 'one_stroke_seal', [4, 6.5, 10], '常時（一筆書きの制約）');
add(3, 'fixed', 'pure_power', [4, 5, 6], '「時の砂」以外の無属性トークンを持たない');
add(3, 'fixed', 'legend_sky_god', [4, 4, 4], 'トークン10個以下');
add(3, 'fixed', 'empty_wallet', [1.5, 2.2, 3.5], '所持★が3/5/10以下');
add(3, 'fixed', 'legend_acrobat', [7, 7, 7], 'ハート2コンボ以上');
add(3, 'fixed', ofColors(c => `combo2_mult_${c}`), [1.5, 2, 3], 'その色で2コンボ以上');
add(3, 'fixed', ofColors(c => `connect4_mult_${c}`), [1.2, 1.5, 2], 'その色を4個以上つなげて消す');
add(3, 'fixed', ofColors(c => `connect6_mult_${c}`), [2, 3, 4], 'その色を6個以上つなげて消す');
add(3, 'fixed', 'bonus_4c_fwlh', [1.5, 2, 3], '炎/雨/雷/ハートを同時に消す');
add(3, 'fixed', 'bonus_5c', [2, 3, 4], '5色以上を同時に消す');
add(3, 'fixed', 'bonus_6c', [3, 4, 5], '6色を同時に消す');
add(3, 'fixed', ['devotion_fire', 'devotion_water'], [4, 7, 12], 'その色だけを消す（他の色を消すと0コンボ）');
add(3, 'fixed', ofColors(c => `passive_contract_${c}`), [3, 5, 8], 'その色を消し、反対色を消さない（反対色で×0.5）');
add(3, 'fixed', 'last_turn_burst', [2, 3, 4], 'サイクルの最終手番');
add(3, 'fixed', 'speed_of_light_thought', [2, 3, 5], '操作時間を2秒以上残す');
add(3, 'fixed', 'passive_probability_trigger_mult', [2, 3, 7], '確率系が発動した手番');
add(3, 'fixed', 'l_cross_simultaneous_mult', [3, 4, 5], 'L字と十字を同時に');
add(3, 'fixed', 'col_double_mult', [2, 3, 4], '縦1列消しを2本同時に');
add(3, 'fixed', 'cross_double_base_mult', [2, 3, 4], '十字消しを2個同時に');
add(3, 'fixed', 'l_shape_double_base_mult', [1.5, 2, 3], 'L字消しを2個同時に');
add(3, 'fixed', 'len4_quad_base_mult', [2, 3, 4], '4個消しを4個同時に');
add(3, 'fixed', 'row_triple_base_mult', [2, 3, 4], '横1列消しを3本同時に');
add(3, 'fixed', 'legend_inugami', [10, 10, 10], '基礎コンボ100以上');
add(3, 'unit', 'square', [2, 3, 5], '正方形消し1回ごとに掛ける（上限あり）');
add(3, 'scale', ofColors(c => `attr_res_${c}`), [0.1, 0.2, 0.5], '1 + その属性のトークン数 × 値', { ex: (v) => `5個: ×${+(1 + v * 5).toFixed(1)} ／ 10個: ×${+(1 + v * 10).toFixed(1)}` });
add(3, 'scale', 'empty_slot_beauty', [1.3, 1.5, 2], '値^空き枠数（上限 10/30/100）', { ex: (v, lv) => `空き2: ×${+(v ** 2).toFixed(2)} ／ 空き5: ×${+Math.min(v ** 5, [10, 30, 100][lv - 1]).toFixed(2)}` });
add(3, 'scale', 'star3_mult_boost', [2, 3, 4], '値^★3トークン数（上限 10/20/50）', { ex: (v, lv) => `★3が2個: ×${Math.min(v ** 2, [10, 20, 50][lv - 1])} ／ 4個: ×${Math.min(v ** 4, [10, 20, 50][lv - 1])}` });
add(3, 'scale', 'star_erase_mult', [1, 2, 3], '1 + その手番のスター消去数 × 値（上限あり）', { ex: (v) => `3個: ×${1 + 3 * v}` });
add(3, 'scale', 'bomb_erase_mult', [2, 3, 4], '1 + その手番にボムで消えた数 × 値（上限あり）', { ex: (v, lv) => `9個: ×${Math.min(1 + 9 * v, [10, 20, 50][lv - 1])}` });
add(3, 'scale', 'repeat_combo_mult', [2, 3, 4], '1 + その手番のリピート消去数 × 値（上限あり）', { ex: (v) => `2個: ×${1 + 2 * v}` });
add(3, 'scale', 'curse_eater', [2, 3, 5], '1 + 解除した呪いの累計 × 値（上限なし）', { ex: (v) => `2個: ×${1 + 2 * v} ／ 5個: ×${1 + 5 * v}` });
add(3, 'scale', 'chalice_of_life', [2, 3, 4], '値^(ハート累計消去÷30)（上限なし）', { note: 'maxMultipliers が無く、限界突破なしでも青天井', ex: (v) => `ハート90個: ×${v ** 3} ／ 300個: ×${v ** 10}` });
add(3, 'scale', 'thousand_arms', [2, 3, 4], '値^(累計コンボ÷100)（上限 10/20/50）', { ex: (v, lv) => `累計300: ×${Math.min(v ** 3, [10, 20, 50][lv - 1])}` });
add(3, 'scale', 'same_color_streak', [0.3, 0.5, 1], '1 + 同じ色の組み合わせが続いた手番数 × 値', { ex: (v) => `3連続: ×${+(1 + 3 * v).toFixed(1)}` });
add(3, 'scale', 'four_match_restriction', [1, 1, 1], '×4個消しの回数（4個消しでしか消せない）', { ex: () => '4個消し5回: ×5' });
add(3, 'scale', 'row_match_restriction', [1, 1, 1], '×横列消しの回数（横列消しでしか消せない）', { ex: () => '横列3本: ×3' });
add(3, 'active', 'active_mult_1', [2, 2, 2], '3手番', { ex: () => '×2 を3手番' });
add(3, 'active', 'active_mult_2', [5, 5, 5], '1手番', { ex: () => '×5 を1手番' });
add(3, 'active', 'gravity_overdrive', [2, 2, 2], '1手番（落下方向が上）', { ex: () => '×2' });
add(3, 'active', 'gale_gravity', [2, 3, 4], '1手番（落下方向が横）', { ex: (v) => `×${v}` });
add(3, 'active', 'active_shape_cross', [1, 1, 1], '2手番、×(十字の数+1)', { ex: () => '十字1回: ×2' });
add(3, 'active', 'active_shape_square', [3, 3, 3], '2手番、×(正方形の数×3)', { ex: () => '正方形1回: ×3' });
add(3, 'active', 'active_square_judgment', [10, 10, 10], '1手番、正方形消しで×10・失敗で×0.25', { ex: () => '成功 ×10 ／ 失敗 ×0.25' });
add(3, 'active', ['active_residual_light', 'active_residual_wood'], [1.5, 2, 2.5], '使った手番にその色10個以上 → 次の手番', { ex: (v) => `×${v}` });
add(3, 'active', 'minigame_target', [3, 4, 5], '3手番（ど真ん中のとき）', { ex: (v) => `×${v}` });
add(3, 'active', 'minigame_target_pro', [8, 10, 15], '3手番（真芯のとき）', { ex: (v) => `×${v}` });
add(3, 'special', 'limit_breaker', [2, 5, 20], '上限つき倍率の上限を ×値');
add(3, 'special', 'legend_limit_breaker', [Infinity, Infinity, Infinity], '上限つき倍率の上限を撤廃');

// ---- 統計 ----
const quant = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  return { n, mean: s.reduce((a, b) => a + b, 0) / n, median: med, min: s[0], max: s[n - 1] };
};
const geo = (arr) => Math.exp(arr.reduce((a, b) => a + Math.log(b), 0) / arr.length);

const entries = E.map(e => {
  const toks = e.ids.map(id => byId[id]).filter(Boolean);
  if (toks.length === 0) throw new Error(`unknown token: ${e.ids.join(',')}`);
  const t0 = toks[0];
  // ③のパッシブは values がそのまま倍率なので、tokens.js の値を使う（手書きの値とずれないように）
  if (e.tier === 3 && t0.type === 'passive' && ['fixed', 'unit', 'scale'].includes(e.kind)
    && Array.isArray(t0.values) && t0.values.length === 3 && t0.values.every(x => typeof x === 'number')) {
    e.v = t0.values;
  }
  const name = toks.length > 1 ? `${t0.name} ほか${toks.length - 1}種` : t0.name;
  const sim = (S) => {
    const xs = toks.map(t => S[t.id]?.gainPct).filter(x => x != null);
    return xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(0) : null;
  };
  return {
    tier: e.tier, kind: e.kind, ids: toks.map(t => t.id), name, count: toks.length,
    type: t0.type, rarity: t0.rarity, price: t0.price,
    v: e.v.map(x => Number.isFinite(x) ? +x.toFixed(2) : x), cond: e.cond,
    ex: e.ex ? [1, 2, 3].map(lv => e.ex(e.v[lv - 1], lv)) : null,
    note: e.note || null, bug: e.bug || null, unitLabel: e.unitLabel || null, dup: !!e.dup,
    sim1: sim(SIM1), sim3: sim(SIM3),
  };
});

const statsFor = (tier, kinds) => [0, 1, 2].map(i => {
  const vals = entries.filter(e => e.tier === tier && kinds.includes(e.kind) && !e.bug).map(e => e.v[i]);
  const q = quant(vals);
  if (tier === 3) q.geomean = geo(vals);
  return q;
});
const STATS = {};
for (const tier of [1, 2, 3]) {
  STATS[tier] = { fixed: statsFor(tier, ['fixed']) };
  if (entries.some(e => e.tier === tier && e.kind === 'unit' && !e.bug)) STATS[tier].unit = statsFor(tier, ['unit']);
}

// ---- ドロップ変換・生成（盤面6×5=30個、各色の期待値5個として数える） ----
// per: 'use'（1回の使用）/ 'turn'（毎手番の期待値）
const cost = (t, lv) => t.levelsConfig ? t.levelsConfig[lv - 1] : Math.max(1, (t.cost || 0) - (lv - 1));
const D = [];
const drop = (group, ids, n, how, extra = {}) => D.push({ group, ids: [].concat(ids), n, how, ...extra });
const actionIds = (a) => ALL_TOKEN_BASES.filter(t => t.type === 'skill' && t.action === a).map(t => t.id);
const effectIds = (e) => ALL_TOKEN_BASES.filter(t => t.type === 'passive' && t.effect === e).map(t => t.id);

drop('変換', actionIds('convert'), [5, 5, 5], '1色 → 1色（1色ぶん）');
drop('変換', actionIds('convert_multi'), [10, 10, 10], '2色 → 1色（2色ぶん）');
drop('変換', actionIds('convert_pair'), [10, 10, 10], '2色をそれぞれ別の色へ（2色ぶん）');
drop('変換', ALL_TOKEN_BASES.filter(t => t.action === 'board_change' && t.params.colors.length === 2).map(t => t.id), [30, 30, 30], '盤面を2色に（狙いの2色は約20個増）', { gain: 20 });
drop('変換', ALL_TOKEN_BASES.filter(t => t.action === 'board_change' && t.params.colors.length === 3).map(t => t.id), [30, 30, 30], '盤面を3色に（狙いの3色は約15個増）', { gain: 15 });
drop('変換', actionIds('board_balance'), [30, 30, 30], '5属性×6個に並べ直し（ハートが消える）', { gain: 5 });
drop('変換', actionIds('row_fix'), [6, 6, 6], '横1段を1色に（もとから同色の約1個を除くと5個）', { gain: 5 });
drop('変換', actionIds('col_fix'), [5, 5, 5], '縦1列を1色に（もとから同色を除くと約4個）', { gain: 4 });
drop('生成', actionIds('spawn_random').filter(id => byId[id].params.count === 5), [5, 5, 5], 'ランダムな位置に5個（もとから同色を除くと約4個）', { gain: 4 });
drop('生成', actionIds('spawn_random').filter(id => byId[id].params.count === 10), [10, 10, 10], 'ランダムな位置に10個（約8個）', { gain: 8 });
drop('変換', actionIds('finger_transform_active'), [6, 6, 6], 'なぞった最初の6個を1色に（狙った位置に置ける）');
drop('変換', actionIds('turn_end_convert'), [15, 15, 15], '3手番、毎手番の終わりに1色→1色（5個×3）');
drop('変換', actionIds('turn_end_convert_multi'), [20, 20, 20], '2手番、毎手番の終わりに2色→1色（10個×2）');
drop('生成', actionIds('turn_end_spawn'), [6, 6, 6], '2手番、毎手番の終わりに3個生成（3個×2）');
drop('整列', actionIds('organize_color'), [0, 0, 0], '数は変わらない（1色を左上に集める）');
drop('変換', effectIds('finger_transform_passive'), [4, 4, 4], '毎手番、なぞった最初の4個を1色に', { per: 'turn' });
drop('変換', effectIds('turn_end_convert'), [2.5, 3.5, 5], '毎手番の終わり、50/70/100%で1色→1色（5個×確率）', { per: 'turn' });
drop('変換', effectIds('turn_end_full_board'), [3, 9, 15], '毎手番の終わり、10/30/50%で盤面全部を1色に（30個×確率）', { per: 'turn' });
drop('生成', effectIds('turn_end_spawn'), [3.5, 4.5, 5], '毎手番の終わり、70/90/100%で5個生成（5個×確率）', { per: 'turn' });
drop('変換', effectIds('erosion_color'), [3.6, 6, 8.4], '毎手番の終わり、その色の上下左右が30/50/70%で変化（隣接約12個×確率、概算）', { per: 'turn', rough: true });

const dropEntries = D.map(d => {
  const toks = d.ids.map(id => byId[id]).filter(Boolean);
  if (toks.length === 0) throw new Error(`unknown token: ${d.ids.join(',')}`);
  const t0 = toks[0];
  const per = d.per || 'use';
  const costs = per === 'use' ? [1, 2, 3].map(lv => cost(t0, lv)) : null;
  const n = d.gain ? [d.gain, d.gain, d.gain] : d.n;
  return {
    group: d.group, ids: toks.map(t => t.id), name: toks.length > 1 ? `${t0.name} ほか${toks.length - 1}種` : t0.name,
    count: toks.length, type: t0.type, rarity: t0.rarity, price: t0.price, per, how: d.how, rough: !!d.rough,
    n, costs, perE: costs ? n.map((x, i) => +(x / costs[i]).toFixed(2)) : null,
  };
});
const dropStats = (per, key) => [0, 1, 2].map(i => quant(dropEntries.filter(d => d.per === per && d.group !== '整列').map(d => d[key][i])));
const DROP_STATS = { use: dropStats('use', 'n'), useE: dropStats('use', 'perE'), turn: dropStats('turn', 'n') };

// ---- 特殊ドロップの生成（1回あたり／毎手番の期待値） ----
const SP = [];
const sp = (kind, ids, n, how, per = 'use') => SP.push({ kind, ids: [].concat(ids), n, how, per });
sp('ボム', 'gen_bomb_rand', [1, 1, 1], 'ランダムな1個をボムに');
sp('ボム', ['conv_bomb_target_fire', 'conv_bomb_target_dark'], [1, 1, 1], '指定色1個をボムに');
sp('ボム', ['ignited_drop_fire', 'ignited_drop_dark'], [0.15, 0.25, 0.5], '落ちてくるその色の3/5/10%（落下約5個として）', 'turn');
sp('ボム', 'turn_end_spawn_bomb_1', [0.1, 0.3, 0.5], '10/30/50%で1個', 'turn');
sp('ボム', 'fuse_line', [3, 5, 8], 'ムーブドロップが通ったマスから（ムーブドロップがあるとき）', 'turn');
sp('リピート', 'gen_repeat_rand', [1, 1, 1], 'ランダムな1個');
sp('リピート', ['conv_repeat_water', 'conv_repeat_heart'], [2, 2, 2], '指定色2個');
sp('リピート', ['repeat_chance_water', 'repeat_chance_heart'], [0.15, 0.25, 0.5], '落ちてくるその色の3/5/10%（落下約5個として）', 'turn');
sp('リピート', 'turn_end_spawn_repeat_1', [0.1, 0.3, 0.5], '10/30/50%で1個', 'turn');
sp('リピート', 'l_shape_spawn_repeat', [1, 2, 3], 'L字消しのたび');
sp('リピート', 'square_spawn_repeat', [2, 3, 5], '正方形消しのたび');
sp('スター', 'gen_star_rand', [5, 5, 5], 'ランダムな5個');
sp('スター', ['conv_star_wood', 'conv_star_light'], [5, 5, 5], '指定色すべて（約5個）');
sp('スター', ['star_chance_wood', 'star_chance_light'], [0.5, 1.5, 2.5], '落ちてくるその色の10/30/50%（落下約5個として）', 'turn');
sp('スター', 'turn_end_spawn_star_3', [0.9, 1.2, 2.1], '30/40/70%で3個', 'turn');
sp('スター', 'row_spawn_star', [2, 3, 5], '横1列消しのたび（プラススター）');
sp('プラス', 'turn_end_spawn_plus_5', [2.5, 3.5, 5], '50/70/100%で5個', 'turn');
sp('プラス', 'mana_crystal', [0.75, 1.5, 3], '落下の5/10/20%（落下約15個として）', 'turn');
sp('プラス', 'len4_spawn_plus', [2, 3, 5], '4個消しのたび');
sp('プラス', 'col_thunder_plus', [2, 3, 5], '縦1列消しのたび');
sp('プラス', ALL_TOKEN_BASES.filter(t => t.action === 'enhance_color').map(t => t.id), [5, 5, 5], '指定色すべて（約5個、2色指定は約10個）');
sp('混合', 'turn_end_spawn_mixed_1', [0.15, 0.3, 0.9], '5/10/30%でボム・スター・リピート各1個', 'turn');

const spEntries = SP.map(s => {
  const toks = s.ids.map(id => byId[id]).filter(Boolean);
  if (toks.length === 0) throw new Error(`unknown token: ${s.ids.join(',')}`);
  const t0 = toks[0];
  const costs = t0.type === 'skill' ? [1, 2, 3].map(lv => cost(t0, lv)) : null;
  return {
    kind: s.kind, ids: toks.map(t => t.id), name: toks.length > 1 ? `${t0.name} ほか${toks.length - 1}種` : t0.name,
    type: t0.type, rarity: t0.rarity, price: t0.price, per: t0.type === 'skill' ? 'use' : s.per, how: s.how, n: s.n, costs,
    perE: costs ? s.n.map((x, i) => +(x / costs[i]).toFixed(2)) : null,
  };
});

// ---- 操作時間 ----
const TM = [
  { id: 'time_ext', v: [2, 2, 2], how: '常時 +2秒（枠を使わない）', per: 'turn' },
  { id: 'star2_time_boost', v: [2, 3, 4], how: '★2トークン数 × 値 秒（★2が3個として ×3 を表示）', per: 'turn', mul: 3 },
  { id: 'time_burst', v: [15, 15, 15], how: '3手番 +5秒', per: 'use' },
  { id: 'eternal_moment', v: [20, 20, 20], how: '2手番 +10秒', per: 'use' },
  { id: 'chronos_master', v: [20, 20, 20], how: '1手番 +20秒', per: 'use' },
  { id: 'len5', v: [7, 14, 21], how: '5個以上つなげると次の手番 ×2/×3/×4（基本7秒として増える分）', per: 'trigger' },
  { id: 'cross', v: [7, 14, 28], how: '十字消しで次の手番 ×2/×3/×5（基本7秒として増える分）', per: 'trigger' },
  { id: 'cursed_power', v: [-3, -3, -3], how: '常時 −3秒（①の代償）', per: 'turn' },
  { id: 'desperate_stance', v: [-3, -3, -3], how: '常時 4秒固定（基本7秒から −3秒、③の代償）', per: 'turn' },
].map(x => {
  const t = byId[x.id];
  if (!t) throw new Error(`unknown token: ${x.id}`);
  const v = x.mul ? x.v.map(a => a * x.mul) : x.v;
  const costs = t.type === 'skill' ? [1, 2, 3].map(lv => cost(t, lv)) : null;
  return { id: x.id, name: t.name, type: t.type, rarity: t.rarity, price: t.price, how: x.how, per: x.per, v, costs, perE: costs ? v.map((a, i) => +(a / costs[i]).toFixed(1)) : null };
});

const out = { generatedFrom: 'src/constants/tokens.js と src/hooks/useGameState.js（handleTurnEnd）', entries, STATS, dropEntries, DROP_STATS, spEntries, TM };
fs.writeFileSync(path.join(ROOT, 'balance-sim/results/effect-index.json'), JSON.stringify(out, null, 1));

// ---- Markdown ----
const f = (x) => x === Infinity ? '∞' : (Math.round(x * 100) / 100).toString();
const sign = (tier, x) => tier === 1 ? (x >= 0 ? `+${f(x)}` : f(x)) : tier === 2 ? (x >= 0 ? `+${f(x)}` : f(x)) : `×${f(x)}`;
const lv3 = (tier, v) => v.map(x => sign(tier, x)).join(' / ');
const typeJa = (t) => t === 'skill' ? 'アクティブ' : 'パッシブ';
const simCell = (e) => (e.sim1 == null && e.sim3 == null) ? '−' : `${e.sim1 ?? '−'}% / ${e.sim3 ?? '−'}%`;
const TIER = { 1: '① コンボ加算（基礎コンボに足す）', 2: '② 加算倍率（1 + 合計 の「合計」に足す）', 3: '③ 乗算倍率（コンボ倍率に掛ける）' };
const L = [];
L.push('# トークン効果の指標表', '');
L.push('`node balance-sim/sim/effect-index.mjs` で作り直せます（数値は `src/constants/tokens.js` から読み、分類は `useGameState.js` の handleTurnEnd の実装に合わせています）。', '');
L.push('## 計算式', '');
L.push('```');
L.push('最終コンボ = (盤面のコンボ + ①コンボ加算) × (1 + ②加算倍率の合計) × ③乗算倍率の積');
L.push('```', '');
L.push('- ① は「+N コンボ」、② は「コンボ倍率にプラス X」、③ は「コンボ倍率が ×X」。');
L.push('- ② は同じ段どうしで足し算なので、持てば持つほど1個あたりの伸びが小さくなる。③ は掛け算なので、持つほど伸びが大きくなる。');
L.push('- 値は「発動したときに実際に入る値」。説明文の「プラス{values}」は、実装では values−1 を足しているものが多い（例: 炎の力 values=[2,3,4] → 実際は +1/+2/+3）。');
L.push('- 色違いなど同じ効果のトークンは1行にまとめ、統計も1件として数えています（「ほかN種」）。');
L.push('- 「実測」は balance-sim の単体テスト（トークン1個だけで15手番、ボットのプレイ）での平均コンボの増加率（Lv1 / 最大Lv）。条件をボットが狙わないトークンは低く出ます。③の実測は、Lv3を旧Lv2の値に下げる前の測定です。');
L.push('- エンチャントは廃止済みなので対象外。', '');
L.push('### 段ごとの効き方の目安', '');
L.push('盤面8コンボ、②の合計 +3（倍率4）、③なし のときに、各段の「中央値の1個」を足すと:', '');
const base = { tc: 8, add: 3 };
const base0 = base.tc * (1 + base.add);
for (const tier of [1, 2, 3]) {
  const m = STATS[tier].fixed.map(s => s.median);
  const vals = m.map(x => tier === 1 ? (base.tc + x) * (1 + base.add) : tier === 2 ? base.tc * (1 + base.add + x) : base0 * x);
  L.push(`- ${TIER[tier].split('（')[0]}: 中央値 ${m.map(x => sign(tier, x)).join(' / ')} → ${base0} が ${vals.map(v => Math.floor(v)).join(' / ')}（Lv1 / Lv2 / Lv3）`);
}
L.push('');
for (const tier of [1, 2, 3]) {
  L.push(`## ${TIER[tier]}`, '');
  L.push('### 統計（常時・条件達成で一定値のもの）', '');
  const hdr = tier === 3 ? '| | 件数 | 平均 | 幾何平均 | 中央値 | 最低 | 最高 |\n|---|---|---|---|---|---|---|' : '| | 件数 | 平均 | 中央値 | 最低 | 最高 |\n|---|---|---|---|---|---|';
  const rowsOf = (label, arr) => arr.map((s, i) => tier === 3
    ? `| ${label} Lv${i + 1} | ${s.n} | ${sign(tier, s.mean)} | ${sign(tier, s.geomean)} | ${sign(tier, s.median)} | ${sign(tier, s.min)} | ${sign(tier, s.max)} |`
    : `| ${label} Lv${i + 1} | ${s.n} | ${sign(tier, s.mean)} | ${sign(tier, s.median)} | ${sign(tier, s.min)} | ${sign(tier, s.max)} |`);
  L.push(hdr, ...rowsOf('一定値', STATS[tier].fixed));
  if (STATS[tier].unit) L.push(...rowsOf('1回あたり', STATS[tier].unit));
  L.push('');
  const sect = (kind, title, withEx) => {
    const list = entries.filter(e => e.tier === tier && e.kind === kind);
    if (!list.length) return;
    L.push(`### ${title}`, '');
    L.push(withEx ? '| トークン | 種別 | ★ | 価格 | 値 Lv1/2/3 | 条件・式 | 例（Lv3） | 備考 |\n|---|---|---|---|---|---|---|---|'
      : '| トークン | 種別 | ★ | 価格 | 値 Lv1/2/3 | 条件 | 実測 Lv1/最大 | 備考 |\n|---|---|---|---|---|---|---|---|');
    const sorted = withEx ? list : [...list].sort((a, b) => a.v[2] - b.v[2]);
    for (const e of sorted) {
      const valStr = e.unitLabel ? e.v.map(f).join(' / ') + `（${e.unitLabel}）` : e.kind === 'scale' ? e.v.map(f).join(' / ') : lv3(tier, e.v);
      const note = [e.bug ? `⚠ ${e.bug}` : '', e.note || ''].filter(Boolean).join(' ');
      L.push(withEx
        ? `| ${e.name} | ${typeJa(e.type)} | ${e.rarity} | ${e.price} | ${valStr} | ${e.cond} | ${e.ex ? e.ex[2] : ''} | ${note} |`
        : `| ${e.name} | ${typeJa(e.type)} | ${e.rarity} | ${e.price} | ${valStr} | ${e.cond} | ${simCell(e)} | ${note} |`);
    }
    L.push('');
  };
  sect('fixed', '一定値のトークン（Lv3の値が小さい順）', false);
  sect('unit', '1回あたりのトークン（1手番に何回も入りうる）', false);
  sect('scale', '条件で伸びるトークン（個別）', true);
  sect('chance', '確率・ランダム（個別）', true);
  sect('active', 'アクティブスキル（個別）', true);
  sect('special', '段全体に効く特殊なもの', false);
}
L.push('## 気になった点（数値の偏り）', '');
const issues = [
  '篝火などの「12個以上」系（+2/+3/+4）が、条件の軽い「6個以上」系（+2/+3/+6）より Lv3 で弱く、価格は高い（31 vs 24）。',
  'リトルワールド Lv1 は ② が −0.2 で、持つと倍率が下がる。',
  '癒の器（chalice_of_life）は上限（maxMultipliers）が無く、ハートを消すほど ×値^n で青天井。',
  '同じパッシブを2回発動させる効果（コピー鏡・合わせ鏡・先導・殿の構え）は、③に使うと ×X が ×X² になる。②に使うと +X が +2X になるだけなので、③との相性が段違い。',
];
issues.forEach(s => L.push(`- ${s}`));
L.push('');

// ドロップ系
L.push('## ドロップ変換・生成', '');
L.push('盤面は6×5=30個、6色なので1色あたり約5個として、「狙った色が何個増えるか」で比べています。アクティブは消費E（1手番に1たまる）あたりの数も出しています。', '');
L.push('### 統計', '', '| | 件数 | 平均 | 中央値 | 最低 | 最高 |', '|---|---|---|---|---|---|');
const dsRow = (label, arr) => arr.map((s, i) => `| ${label} Lv${i + 1} | ${s.n} | ${f(s.mean)} | ${f(s.median)} | ${f(s.min)} | ${f(s.max)} |`);
L.push(...dsRow('アクティブ 1回あたり', DROP_STATS.use), ...dsRow('アクティブ 消費E1あたり', DROP_STATS.useE), ...dsRow('パッシブ 1手番あたり', DROP_STATS.turn), '');
L.push('### アクティブ（1回あたり）', '', '| トークン | ★ | 価格 | 内容 | 増える数 Lv1/2/3 | 消費E Lv1/2/3 | 消費E1あたり |', '|---|---|---|---|---|---|---|');
for (const d of dropEntries.filter(d => d.per === 'use').sort((a, b) => b.perE[2] - a.perE[2])) L.push(`| ${d.name} | ${d.rarity} | ${d.price} | ${d.how} | ${d.n.map(f).join(' / ')} | ${d.costs.join(' / ')} | ${d.perE.map(f).join(' / ')} |`);
L.push('', '### パッシブ（毎手番の期待値）', '', '| トークン | ★ | 価格 | 内容 | 増える数 Lv1/2/3 |', '|---|---|---|---|---|');
for (const d of dropEntries.filter(d => d.per === 'turn').sort((a, b) => b.n[2] - a.n[2])) L.push(`| ${d.name} | ${d.rarity} | ${d.price} | ${d.how} | ${d.n.map(f).join(' / ')} |`);
L.push('', '## 特殊ドロップの生成', '', '| 種類 | トークン | 種別 | ★ | 価格 | 内容 | 数 Lv1/2/3 | 単位 | 消費E1あたり |', '|---|---|---|---|---|---|---|---|---|');
const perJa = { use: '1回', turn: '毎手番（期待値）' };
for (const s of spEntries) L.push(`| ${s.kind} | ${s.name} | ${typeJa(s.type)} | ${s.rarity} | ${s.price} | ${s.how} | ${s.n.map(f).join(' / ')} | ${s.type === 'skill' ? '1回' : (s.how.includes('のたび') ? '条件1回' : perJa[s.per])} | ${s.perE ? s.perE.map(f).join(' / ') : '−'} |`);
L.push('', '## 操作時間', '', '| トークン | 種別 | ★ | 価格 | 内容 | 秒 Lv1/2/3 | 単位 | 消費E1あたり |', '|---|---|---|---|---|---|---|---|');
const tmPer = { turn: '毎手番', use: '1回の合計', trigger: '条件1回' };
for (const t of TM) L.push(`| ${t.name} | ${typeJa(t.type)} | ${t.rarity} | ${t.price} | ${t.how} | ${t.v.map(f).join(' / ')} | ${tmPer[t.per]} | ${t.perE ? t.perE.join(' / ') : '−'} |`);
L.push('');
fs.writeFileSync(path.join(ROOT, 'docs/token-effect-index.md'), L.join('\n'));
console.log('wrote docs/token-effect-index.md, balance-sim/results/effect-index.json');
for (const tier of [1, 2, 3]) console.log(tier, JSON.stringify(STATS[tier].fixed.map(s => [s.n, +s.mean.toFixed(2), s.median, s.min, s.max])));
