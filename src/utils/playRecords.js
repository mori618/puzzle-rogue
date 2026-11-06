// 実績画面「遊びトークン」タブに出す記録の一覧（PlayRecordsPanel.jsx で表示する）
import {
  FISH_TABLE, formatFishSize, fishRecordKey, fishCountKey, targetHitKey, diceFaceKey, minigamePlayKey,
} from './minigames.js';

const TARGET_RESULTS = [
  ['core', '真芯'],
  ['bullseye', 'ど真ん中'],
  ['inner', '内側'],
  ['middle', '中間'],
  ['outer', '外側'],
  ['miss', '外れ'],
];
const DIE_FACE_CHARS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/**
 * 記録のセクション定義
 * - plays: 遊んだ回数（0 なら「？？？」で伏せる）
 * - rows:  [ラベル, 値, 単位]（値が 0 / 未記録の行は表示しない）
 */
export const buildPlayRecordSections = (p = {}) => {
  const v = (key) => p[key] || 0;
  const sum = (...keys) => keys.reduce((s, k) => s + v(k), 0);

  const caughtFish = FISH_TABLE
    .map(f => ({ ...f, count: v(fishCountKey(f.id)), best: v(fishRecordKey(f.id)) }))
    // 旧データ（大物釣りの最大サイズだけ記録されていた魚）も「釣ったことがある」とみなす
    .filter(f => f.count > 0 || f.best > 0);

  return [
    {
      id: 'janken', title: 'じゃんけん', icon: '✊',
      plays: v(minigamePlayKey('janken')),
      rows: [
        ['最大連勝数', v('janken_streak_max'), '連勝'],
        ['累計の勝ち数', v('janken_wins_total'), '勝'],
        ['以心伝心', v('janken_draw_bonus'), '回'],
        ['1回も勝てなかった', v('janken_zero_wins'), '回'],
      ],
    },
    {
      id: 'fishing', title: '釣り', icon: '🎣',
      plays: sum(minigamePlayKey('fishing'), minigamePlayKey('fishing_big')) || (caughtFish.length > 0 ? 1 : 0),
      rows: [
        ['釣った数', v('fish_caught_total'), '匹'],
        ['見つけた種類', caughtFish.length > 0 ? `${caughtFish.length} / ${FISH_TABLE.length}` : 0, '種'],
        ['2匹同時に釣れた', v('fish_double_catches'), '回'],
        ['いちばん大きな獲物', v('fish_size_max') ? formatFishSize(v('fish_size_max')) : 0],
      ],
      fish: caughtFish,
    },
    {
      id: 'target', title: '的当て', icon: '🎯',
      plays: sum(minigamePlayKey('target'), minigamePlayKey('target_pro')),
      rows: [
        ['中心に当てた', v('target_center_hits'), '回'],
        ...TARGET_RESULTS.map(([id, label]) => [label, v(targetHitKey(id)), '回']),
      ],
    },
    {
      id: 'mash', title: '連打', icon: '👆',
      plays: sum(minigamePlayKey('mash'), minigamePlayKey('mash_duo')),
      rows: [
        ['連打の最高記録', v('mash_single_taps_max'), '回'],
        ['交互連打の最高記録', v('mash_duo_taps_max'), '回'],
      ],
    },
    {
      id: 'dice', title: 'サイコロ', icon: '🎲',
      plays: sum(minigamePlayKey('dice'), minigamePlayKey('dice_duo')),
      rows: [
        ['ゾロ目', v('dice_doubles'), '回'],
        ...[1, 2, 3, 4, 5, 6].map(f => [`${DIE_FACE_CHARS[f]} ${f}の目`, v(diceFaceKey(f)), '回']),
      ],
    },
    {
      id: 'demon', title: 'デーモン', icon: '😈',
      plays: v(minigamePlayKey('demon')),
      rows: [
        ['勝ち', v('demon_wins'), '回'],
        ['負け', v('demon_losses'), '回'],
        ['引き分け', v('demon_draws'), '回'],
      ],
    },
    {
      id: 'highlow', title: 'ハイアンドロー', icon: '🃏',
      plays: v(minigamePlayKey('highlow')),
      rows: [
        ['最大連勝数', v('highlow_wins_max'), '連勝'],
        ['勝ち逃げした最大連勝数', v('highlow_cashout_max'), '連勝'],
        ['累計の勝ち数', v('highlow_wins_total'), '勝'],
        ['勝ち逃げ', v('highlow_cashouts'), '回'],
        ['積み上げを全て失った', v('highlow_busts'), '回'],
      ],
    },
    {
      id: 'running', title: 'ランニング', icon: '🏃',
      plays: v(minigamePlayKey('running')),
      rows: [
        ['最長距離', v('running_meters_max'), 'm'],
        ['累計距離', v('running_meters_total'), 'm'],
        ['完走', v('running_clears'), '回'],
      ],
    },
    {
      id: 'gamble', title: 'ギャンブル', icon: '🎁',
      plays: v('gamble_plays'),
      rows: [
        ['当たり', v('gamble_wins'), '回'],
        ['ハズレ', v('gamble_losses'), '回'],
        ['ダブルアップ挑戦', v('gamble_doubleup_plays'), '回'],
        ['ダブルアップ当たり', v('gamble_doubleup_wins'), '回'],
      ],
    },
    {
      id: 'star_gamble', title: '星屑のダイス', icon: '✨',
      plays: sum('star_gamble_good', 'star_gamble_bad'),
      rows: [
        ['スターが増えた', v('star_gamble_good'), '回'],
        ['厄災', v('star_gamble_bad'), '回'],
      ],
    },
    {
      id: 'token_gamble', title: '砥石', icon: '🪨',
      plays: sum('token_gamble_good', 'token_gamble_bad'),
      rows: [
        ['レベルが最大になった', v('token_gamble_good'), '回'],
        ['厄災', v('token_gamble_bad'), '回'],
      ],
    },
    {
      id: 'rabbit', title: 'うさぎと狼', icon: '🐇',
      plays: sum('rabbits_joined', 'rabbit_held_max', 'wolf_hunts'),
      rows: [
        ['うさぎの最大同時所持数', v('rabbit_held_max'), '匹'],
        ['仲間になったうさぎ', v('rabbits_joined'), '匹'],
        ['狼に捕食させたうさぎ', v('wolf_rabbits_eaten'), '匹'],
        ['一度に捕食させた最大数', v('wolf_eaten_once_max'), '匹'],
      ],
    },
  ].map(sec => ({ ...sec, rows: sec.rows.filter(([, value]) => value) }));
};

