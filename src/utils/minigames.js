// =============================================================================
// ミニゲーム系スキルトークン（じゃんけん / 釣り / 的当て / 連打 / サイコロ）の
// 抽選・報酬計算ロジック。UI（MinigameModal.jsx）から呼ばれ、結果の報酬リストを
// useGameState.resolveMinigame に渡して適用する。
//
// 報酬オブジェクトの形式:
//   { type: 'stars_add', value }              所持スター +value（負数で減少、0未満にはならない）
//   { type: 'stars_mult', value }             所持スター ×value（切り捨て）
//   { type: 'combo_add', value, duration }    duration手番の間、コンボ +value
//   { type: 'mult_add', value, duration }     duration手番の間、コンボ倍率 +value
//   { type: 'mult', value, duration }         duration手番の間、コンボ倍率 ×value
//   { type: 'levelup', value }                ランダムなトークン value 個をレベルアップ
//   { type: 'energy', value }                 自身以外のスキルのエネルギー +value
//   { type: 'time', value, duration }         duration手番の間、操作時間 +value 秒
//   { type: 'token', rarity }                 ランダムな★rarity トークンを1つ獲得（枠に空きがある場合）
// =============================================================================

/** トークンのレベルに応じた values の値 */
export const getLevelValue = (values, level, fallback = 0) => {
  if (!Array.isArray(values)) return fallback;
  return values[(level || 1) - 1] ?? values[0] ?? fallback;
};

/** 報酬1つを表示用テキストにする */
export const describeReward = (r) => {
  if (!r) return '';
  switch (r.type) {
    case 'stars_add':
      return r.value >= 0 ? `スター+${r.value}` : `スター${r.value}`;
    case 'stars_mult':
      return r.value === 0.5 ? 'スター半減' : `スター×${r.value}`;
    case 'combo_add':
      return `${r.duration}手番 コンボ+${r.value}`;
    case 'mult_add':
      return `${r.duration}手番 倍率+${r.value}`;
    case 'mult':
      return `${r.duration}手番 倍率×${r.value}`;
    case 'levelup':
      return `トークン${r.value}つLvUP`;
    case 'energy':
      if (r.value >= 99) return '他スキルのエネルギー全回復';
      return r.value >= 0 ? `他スキルのエネルギー+${r.value}` : `他スキルのエネルギー${r.value}`;
    case 'time':
      return `${r.duration}手番 操作時間+${r.value}秒`;
    case 'token':
      return `★${r.rarity}トークン獲得`;
    default:
      return '';
  }
};

/** 代償（マイナス効果）か */
export const isPenaltyReward = (r) => {
  if (!r) return false;
  switch (r.type) {
    case 'stars_add':
    case 'energy':
    case 'combo_add':
    case 'mult_add':
    case 'time':
      return r.value < 0;
    case 'stars_mult':
    case 'mult':
      return r.value < 1;
    default:
      return false;
  }
};

/** 報酬リストが代償だけで構成されているか（空は含まない） */
export const isAllPenalty = (rewards = []) =>
  (rewards || []).length > 0 && rewards.every(isPenaltyReward);

/** 報酬リストを表示用テキストにする */
export const describeRewards = (rewards = []) => {
  const list = (rewards || []).map(describeReward).filter(Boolean);
  return list.length > 0 ? list.join(' / ') : '何も起きない';
};

// --- じゃんけん ---------------------------------------------------------------

export const JANKEN_HANDS = ['rock', 'scissors', 'paper'];

/** 勝敗判定: 1 = 勝ち, 0 = あいこ, -1 = 負け */
export const judgeJanken = (player, cpu) => {
  if (player === cpu) return 0;
  if (
    (player === 'rock' && cpu === 'scissors') ||
    (player === 'scissors' && cpu === 'paper') ||
    (player === 'paper' && cpu === 'rock')
  ) return 1;
  return -1;
};

export const randomJankenHand = (rng = Math.random) =>
  JANKEN_HANDS[Math.floor(rng() * JANKEN_HANDS.length)];

/** 失敗時（0連勝）の代償 */
export const JANKEN_PENALTY = [
  { type: 'stars_add', value: -10 },
  { type: 'mult', value: 0.5, duration: 2 },
];

/**
 * 連勝数に応じた報酬
 * - 0連勝（初戦で負け）: 代償 スター-10＆2手番コンボ倍率×0.5
 * - 1連勝以上: 3手番の間、連勝数 × perWin をコンボに加算
 * - 2連勝以上: スター+連勝数×10
 * - 3連勝以上: ランダムなトークン1つLvUP
 * - 5連勝以上: さらに3手番の間コンボ倍率×3＆トークン1つLvUP
 */
export const getJankenRewards = (streak, perWin) => {
  if (streak <= 0) return JANKEN_PENALTY;
  const rewards = [{ type: 'combo_add', value: streak * perWin, duration: 3 }];
  if (streak >= 2) rewards.push({ type: 'stars_add', value: streak * 10 });
  if (streak >= 5) {
    rewards.push({ type: 'levelup', value: 2 });
    rewards.push({ type: 'mult', value: 3, duration: 3 });
  } else if (streak >= 3) {
    rewards.push({ type: 'levelup', value: 1 });
  }
  return rewards;
};

// --- 釣り ---------------------------------------------------------------------

export const FISH_TABLE = [
  // ハズレ（代償）
  { id: 'boot', name: '長靴', icon: '👢', weight: 10, rewards: [{ type: 'mult', value: 0.5, duration: 2 }] },
  { id: 'can', name: '空き缶', icon: '🥫', weight: 6, rewards: [{ type: 'energy', value: -3 }] },
  { id: 'jellyfish', name: 'クラゲ', icon: '🪼', weight: 6, rewards: [{ type: 'stars_add', value: -15 }] },
  // アタリ
  { id: 'small_fish', name: '小魚', icon: '🐟', weight: 18, rewards: [{ type: 'stars_add', value: 15 }] },
  { id: 'sea_bream', name: 'タイ', icon: '🐠', weight: 10, rewards: [{ type: 'stars_mult', value: 2 }] },
  { id: 'octopus', name: 'タコ', icon: '🐙', weight: 11, rewards: [{ type: 'energy', value: 5 }] },
  { id: 'pufferfish', name: 'フグ', icon: '🐡', weight: 11, rewards: [{ type: 'combo_add', value: 15, duration: 3 }] },
  { id: 'eel', name: 'ウナギ', icon: '🐍', weight: 10, rewards: [{ type: 'time', value: 8, duration: 3 }] },
  { id: 'swordfish', name: 'カジキ', icon: '🗡️', weight: 7, rewards: [{ type: 'mult_add', value: 3, duration: 3 }] },
  { id: 'tuna', name: 'マグロ', icon: '🐋', weight: 6, rewards: [{ type: 'mult', value: 3, duration: 3 }] },
  { id: 'legend', name: '伝説の魚', icon: '🐉', weight: 3, rewards: [{ type: 'token', rarity: 3 }] },
  {
    id: 'treasure', name: '宝箱', icon: '🎁', weight: 2,
    rewards: [
      { type: 'stars_mult', value: 3 },
      { type: 'levelup', value: 3 },
      { type: 'energy', value: 99 },
      { type: 'mult', value: 3, duration: 3 },
      { type: 'combo_add', value: 20, duration: 3 },
      { type: 'time', value: 10, duration: 3 },
      { type: 'token', rarity: 2 },
    ],
  },
];

/** 釣れる魚を重み付きで抽選する */
export const rollFish = (rng = Math.random) => {
  const total = FISH_TABLE.reduce((s, f) => s + f.weight, 0);
  let r = rng() * total;
  for (const fish of FISH_TABLE) {
    r -= fish.weight;
    if (r < 0) return fish;
  }
  return FISH_TABLE[FISH_TABLE.length - 1];
};

// --- 的当て -------------------------------------------------------------------

/**
 * 中心からの距離（的の半径を1とした割合）に応じた結果
 * bullseyeMult はブルズアイ時のコンボ倍率（レベルで変化）
 */
export const getTargetResult = (distance, bullseyeMult) => {
  if (distance <= 0.12) {
    return {
      id: 'bullseye', name: 'ど真ん中！', color: 'text-amber-300',
      rewards: [
        { type: 'mult', value: bullseyeMult, duration: 3 },
        { type: 'stars_add', value: 30 },
        { type: 'levelup', value: 1 },
      ],
    };
  }
  if (distance <= 0.35) {
    return {
      id: 'inner', name: '内側', color: 'text-red-300',
      rewards: [{ type: 'mult_add', value: 2, duration: 3 }, { type: 'stars_add', value: 10 }],
    };
  }
  if (distance <= 0.65) {
    return { id: 'middle', name: '中間', color: 'text-sky-300', rewards: [{ type: 'combo_add', value: 10, duration: 3 }] };
  }
  if (distance <= 1) {
    return { id: 'outer', name: '外側', color: 'text-slate-200', rewards: [{ type: 'stars_add', value: 5 }] };
  }
  return {
    id: 'miss', name: '外れ…', color: 'text-red-400',
    rewards: [{ type: 'stars_add', value: -15 }, { type: 'mult', value: 0.5, duration: 2 }],
  };
};

/**
 * 照準の位置（-1.1〜1.1 の正規化座標）。x と y を異なる周期で往復させる
 * t はミリ秒
 */
export const getAimPosition = (t) => ({
  x: Math.sin(t / 430) * 1.1,
  y: Math.sin(t / 610 + 1.3) * 1.1,
});

// --- 連打 ---------------------------------------------------------------------

export const MASH_DURATION_MS = 5000;
export const MASH_FAIL_THRESHOLD = 20;
export const MASH_ENERGY_THRESHOLD = 40;
export const MASH_MULT_THRESHOLD = 55;

/**
 * 連打回数に応じた報酬
 * - 20回未満: 代償 2手番コンボ倍率×0.5（コンボ加算なし）
 * - 3手番の間、連打数 × perTap（切り捨て）をコンボに加算
 * - 40回以上: 他スキルのエネルギー+3
 * - 55回以上: さらに3手番コンボ倍率×2
 */
export const getMashRewards = (taps, perTap) => {
  if (taps < MASH_FAIL_THRESHOLD) return [{ type: 'mult', value: 0.5, duration: 2 }];
  const rewards = [];
  const combo = Math.floor(taps * perTap + 1e-9);
  if (combo > 0) rewards.push({ type: 'combo_add', value: combo, duration: 3 });
  if (taps >= MASH_ENERGY_THRESHOLD) rewards.push({ type: 'energy', value: 3 });
  if (taps >= MASH_MULT_THRESHOLD) rewards.push({ type: 'mult', value: 2, duration: 3 });
  return rewards;
};

// --- サイコロ -----------------------------------------------------------------

export const DICE_FACES = {
  1: { label: 'スター半減', rewards: [{ type: 'stars_mult', value: 0.5 }] },
  2: { label: '倍率×0.5', rewards: [{ type: 'mult', value: 0.5, duration: 2 }] },
  3: { label: 'コンボ+12', rewards: [{ type: 'combo_add', value: 12, duration: 3 }] },
  4: { label: 'エネルギー+5', rewards: [{ type: 'energy', value: 5 }] },
  5: { label: '倍率+2', rewards: [{ type: 'mult_add', value: 2, duration: 3 }] },
  6: {
    label: '大当たり',
    rewards: [{ type: 'levelup', value: 2 }, { type: 'stars_add', value: 30 }, { type: 'mult', value: 2, duration: 3 }],
  },
};

export const rollDie = (rng = Math.random) => 1 + Math.floor(rng() * 6);

export const getDiceRewards = (face) => DICE_FACES[face]?.rewards || [];
