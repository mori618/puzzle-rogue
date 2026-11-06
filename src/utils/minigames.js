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

// 隠し要素: あいこ3回連続で「以心伝心」発動（説明文には記載しない）
// 発動ごとに以下の報酬が最終結果に追加され、勝負はそのまま続く。
export const JANKEN_DRAW_BONUS_COUNT = 3;
export const JANKEN_DRAW_BONUS = [
  { type: 'energy', value: 99 },
  { type: 'levelup', value: 1 },
  { type: 'stars_add', value: 20 },
];

/** 連勝数の報酬に、以心伝心の発動回数分のボーナスを加える */
export const getJankenFinalRewards = (streak, perWin, drawBonusCount = 0) => [
  ...getJankenRewards(streak, perWin),
  ...Array.from({ length: drawBonusCount }, () => JANKEN_DRAW_BONUS).flat(),
];

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

// =============================================================================
// ★2 強化版ミニゲーム
// =============================================================================

/** ダイアログのタイトル（minigameState.type → 名前） */
export const EXTRA_MINIGAME_TITLES = {
  fishing_big: '大物釣り',
  demon: 'デーモン',
  target_pro: '精密射撃',
  mash_duo: '交互連打',
  dice_duo: 'ダブルダイス',
  highlow: 'ハイアンドロー',
  running: 'ランニング',
};


// --- 大物釣り（魚のサイズで効果が変わる） ------------------------------------

/** 魚ごとのサイズの範囲（cm） */
export const FISH_SIZE_RANGE = {
  boot: [22, 32],
  can: [8, 16],
  jellyfish: [10, 80],
  small_fish: [5, 25],
  sea_bream: [20, 110],
  octopus: [30, 300],
  pufferfish: [15, 75],
  eel: [40, 160],
  swordfish: [100, 450],
  tuna: [80, 300],
  legend: [300, 1200],
  treasure: [30, 90],
};

/** サイズの表示（100cm 以上は m 表記） */
export const formatFishSize = (cm) => {
  if (!Number.isFinite(cm)) return '-';
  if (cm >= 100) return `${(Math.round(cm) / 100).toFixed(2).replace(/\.?0+$/, '')}m`;
  return `${Math.round(cm)}cm`;
};

/**
 * サイズを抽選する。rank（0〜1）が大きいほど大物。
 * sizeBonus（レベルで変化）だけ大物に寄せる。2乱数の最大値で「普通〜やや大きめ」が出やすい。
 */
export const rollFishSize = (fishId, sizeBonus = 0, rng = Math.random) => {
  const [min, max] = FISH_SIZE_RANGE[fishId] || [10, 50];
  const raw = Math.max(rng(), rng() * 0.8);
  const rank = Math.min(1, raw + sizeBonus * (1 - raw));
  return { cm: Math.round(min + (max - min) * rank), rank };
};

/** サイズ区分（rank → 名前と効果倍率） */
export const getFishSizeClass = (rank) => {
  if (rank >= 0.95) return { id: 'monster', name: '超特大', factor: 2.5 };
  if (rank >= 0.8) return { id: 'huge', name: '特大', factor: 1.8 };
  if (rank >= 0.55) return { id: 'big', name: '大型', factor: 1.3 };
  if (rank >= 0.25) return { id: 'normal', name: '中型', factor: 1 };
  return { id: 'small', name: '小型', factor: 0.7 };
};

/**
 * 報酬をサイズ倍率で強める（ハズレは大きいほど代償も重くなる）
 * 倍率系（stars_mult / mult）は「1 からの差」を倍率分だけ広げる
 */
export const scaleRewards = (rewards, factor) => (rewards || []).map(r => {
  const roundTo = (v, d = 1) => Math.round(v / d) * d;
  switch (r.type) {
    case 'stars_add':
    case 'combo_add':
    case 'energy':
    case 'time':
      return { ...r, value: r.value >= 99 ? r.value : roundTo(r.value * factor) };
    case 'mult_add':
      return { ...r, value: roundTo(r.value * factor, 0.5) };
    case 'stars_mult':
    case 'mult': {
      if (r.value >= 1) return { ...r, value: roundTo(1 + (r.value - 1) * factor, 0.5) };
      // 代償: 大きいほど小さくなる（最低 0.25）
      return { ...r, value: Math.max(0.25, roundTo(1 - (1 - r.value) * factor, 0.05)) };
    }
    case 'levelup':
      return { ...r, value: Math.max(1, Math.round(r.value * factor)) };
    case 'token':
      return { ...r, rarity: factor >= 1.8 ? Math.min(3, (r.rarity || 1) + 1) : r.rarity };
    default:
      return r;
  }
});

/** 大物釣り: 魚とサイズを決めて報酬を返す */
export const rollBigFish = (sizeBonus = 0, rng = Math.random) => {
  const fish = rollFish(rng);
  const { cm, rank } = rollFishSize(fish.id, sizeBonus, rng);
  const sizeClass = getFishSizeClass(rank);
  return { fish, cm, rank, sizeClass, rewards: scaleRewards(fish.rewards, sizeClass.factor) };
};

/** 魚ごとの最大サイズ記録のキー（二つ名の進捗データに保存する） */
export const fishRecordKey = (fishId) => `fish_max_${fishId}`;

// --- デーモン（チャージ / 攻撃 / 防御） -------------------------------------

export const DEMON_MOVES = ['charge', 'attack', 'guard'];
export const DEMON_WIN_CHARGE = 5;
export const DEMON_MAX_ROUNDS = 20;

/**
 * 1ラウンドの判定
 * - 攻撃は1チャージ消費（チャージ0では攻撃できない）
 * - チャージ中の相手に攻撃を当てたら勝ち
 * - 攻撃 vs 攻撃は相殺、攻撃 vs 防御は防がれる
 * - 5チャージ貯めたら勝ち（同時なら引き分け）
 * @returns {{ player:number, demon:number, winner:'player'|'demon'|'draw'|null }}
 */
export const judgeDemonRound = (playerMove, demonMove, playerCharge, demonCharge) => {
  let p = playerCharge;
  let d = demonCharge;
  if (playerMove === 'attack') p -= 1;
  if (demonMove === 'attack') d -= 1;
  if (playerMove === 'charge') p += 1;
  if (demonMove === 'charge') d += 1;

  const playerHits = playerMove === 'attack' && demonMove === 'charge';
  const demonHits = demonMove === 'attack' && playerMove === 'charge';
  if (playerHits) return { player: p, demon: d, winner: 'player' };
  if (demonHits) return { player: p, demon: d, winner: 'demon' };
  const pFull = p >= DEMON_WIN_CHARGE;
  const dFull = d >= DEMON_WIN_CHARGE;
  if (pFull && dFull) return { player: p, demon: d, winner: 'draw' };
  if (pFull) return { player: p, demon: d, winner: 'player' };
  if (dFull) return { player: p, demon: d, winner: 'demon' };
  return { player: p, demon: d, winner: null };
};

/** デーモンの手（相手のチャージ状況を見て選ぶ） */
export const pickDemonMove = (demonCharge, playerCharge, rng = Math.random) => {
  const w = { charge: 4, attack: demonCharge > 0 ? 3 : 0, guard: playerCharge > 0 ? 3 : 1 };
  // あと1回で勝てるならチャージしたくなる
  if (demonCharge >= DEMON_WIN_CHARGE - 1) w.charge += 2;
  // プレイヤーがあと1回で勝ちそうなら攻撃で止めにいく
  if (playerCharge >= DEMON_WIN_CHARGE - 1 && demonCharge > 0) w.attack += 4;
  const total = w.charge + w.attack + w.guard;
  let r = rng() * total;
  for (const m of DEMON_MOVES) {
    r -= w[m];
    if (r < 0) return m;
  }
  return 'charge';
};

/** デーモンの結果に応じた報酬 */
export const getDemonRewards = (winner, winMult) => {
  if (winner === 'player') {
    return [
      { type: 'mult', value: winMult, duration: 3 },
      { type: 'stars_add', value: 40 },
      { type: 'levelup', value: 1 },
    ];
  }
  if (winner === 'demon') {
    return [{ type: 'stars_add', value: -25 }, { type: 'mult', value: 0.5, duration: 2 }];
  }
  return [{ type: 'combo_add', value: 10, duration: 2 }];
};

// --- 精密射撃（的当ての強化版。ど真ん中のさらに中心「真芯」） ----------------

export const TARGET_CORE_RADIUS = 0.04;

export const getPrecisionTargetResult = (distance, bullseyeMult, coreMult) => {
  if (distance <= TARGET_CORE_RADIUS) {
    return {
      id: 'core', name: '真芯撃ち抜き！！', color: 'text-fuchsia-300',
      rewards: [
        { type: 'mult', value: coreMult, duration: 3 },
        { type: 'stars_add', value: 80 },
        { type: 'levelup', value: 2 },
        { type: 'energy', value: 99 },
      ],
    };
  }
  const base = getTargetResult(distance, bullseyeMult);
  if (base.id === 'miss') {
    return { ...base, rewards: [{ type: 'stars_add', value: -25 }, { type: 'mult', value: 0.5, duration: 2 }] };
  }
  return base;
};

/** 照準の位置（強化版は少し速い） */
export const getPrecisionAimPosition = (t) => getAimPosition(t * 1.25);

// --- 交互連打（ボタン2つ） ---------------------------------------------------

export const DUO_MASH_DURATION_MS = 5000;
export const DUO_MASH_FAIL_THRESHOLD = 25;
export const DUO_MASH_ENERGY_THRESHOLD = 50;
export const DUO_MASH_MULT_THRESHOLD = 70;
export const DUO_MASH_LEVELUP_THRESHOLD = 90;

/** 交互に押せたときだけカウントする（同じボタンの連続は数えない） */
export const countDuoTap = (lastSide, side) => lastSide !== side;

export const getDuoMashRewards = (taps, perTap) => {
  if (taps < DUO_MASH_FAIL_THRESHOLD) {
    return [{ type: 'stars_add', value: -15 }, { type: 'mult', value: 0.5, duration: 2 }];
  }
  const rewards = [];
  const combo = Math.floor(taps * perTap + 1e-9);
  if (combo > 0) rewards.push({ type: 'combo_add', value: combo, duration: 3 });
  if (taps >= DUO_MASH_ENERGY_THRESHOLD) rewards.push({ type: 'energy', value: 5 });
  if (taps >= DUO_MASH_MULT_THRESHOLD) rewards.push({ type: 'mult', value: 3, duration: 3 });
  if (taps >= DUO_MASH_LEVELUP_THRESHOLD) rewards.push({ type: 'levelup', value: 1 });
  return rewards;
};

// --- ダブルダイス（サイコロ2つ・ゾロ目ボーナス） -----------------------------

/** 悪い目のゾロ目は効果が反転する（1:スター半減→スター2倍 / 2:倍率×0.5→倍率×2） */
export const DICE_INVERTED_FACES = {
  1: { label: 'スター2倍', rewards: [{ type: 'stars_mult', value: 2 }] },
  2: { label: '倍率×2', rewards: [{ type: 'mult', value: 2, duration: 3 }] },
};

/** ゾロ目ボーナス */
export const DICE_DOUBLES_BONUS = {
  1: [{ type: 'levelup', value: 1 }],
  2: [{ type: 'levelup', value: 1 }],
  3: [{ type: 'combo_add', value: 20, duration: 3 }, { type: 'stars_add', value: 20 }],
  4: [{ type: 'energy', value: 99 }, { type: 'stars_add', value: 20 }],
  5: [{ type: 'mult_add', value: 4, duration: 3 }, { type: 'stars_add', value: 20 }],
  6: [{ type: 'mult', value: 5, duration: 3 }, { type: 'levelup', value: 3 }, { type: 'stars_add', value: 60 }],
};

/** 2つの目の報酬（それぞれの目の効果＋ゾロ目ボーナス） */
export const getDoubleDiceRewards = (a, b) => {
  if (a === b) {
    const face = DICE_INVERTED_FACES[a] || DICE_FACES[a];
    return [...face.rewards, ...face.rewards, ...(DICE_DOUBLES_BONUS[a] || [])];
  }
  return [...getDiceRewards(a), ...getDiceRewards(b)];
};

// --- ハイアンドロー -----------------------------------------------------------

export const drawCard = (rng = Math.random) => 1 + Math.floor(rng() * 10);

/** 新しく配る（自分と相手に2枚ずつ。1枚目は公開、2枚目は伏せる） */
export const dealHighLow = (rng = Math.random) => ({
  player: [drawCard(rng), drawCard(rng)],
  dealer: [drawCard(rng), drawCard(rng)],
});

/**
 * 判定: guess は 'high'（自分の合計が相手より大きい）/ 'low'（小さい）
 * @returns 'win' | 'lose' | 'draw'（合計が同じ）
 */
export const judgeHighLow = (hand, guess) => {
  const p = hand.player[0] + hand.player[1];
  const d = hand.dealer[0] + hand.dealer[1];
  if (p === d) return 'draw';
  const isHigh = p > d;
  return (guess === 'high') === isHigh ? 'win' : 'lose';
};

/** 連勝数に応じて積み上がる報酬（負けると全て失う） */
export const getHighLowRewards = (wins, perWin) => {
  if (wins <= 0) return [];
  const rewards = [{ type: 'combo_add', value: wins * perWin, duration: 3 }];
  if (wins >= 2) rewards.push({ type: 'stars_add', value: wins * 15 });
  if (wins >= 6) rewards.push({ type: 'mult', value: 5, duration: 3 });
  else if (wins >= 4) rewards.push({ type: 'mult', value: 3, duration: 3 });
  else if (wins >= 3) rewards.push({ type: 'mult', value: 2, duration: 3 });
  if (wins >= 5) rewards.push({ type: 'levelup', value: wins >= 7 ? 3 : 1 });
  if (wins >= 8) rewards.push({ type: 'token', rarity: 3 });
  return rewards;
};

/** 1勝もできずに負けたときの代償 */
export const HIGHLOW_PENALTY = [{ type: 'stars_add', value: -15 }, { type: 'mult', value: 0.5, duration: 2 }];

// --- ランニング ---------------------------------------------------------------

export const RUNNER = {
  groundY: 0,
  gravity: -0.006, // 1ms あたりの速度変化（単位: px/ms²）
  jumpVelocity: 1.15, // px/ms
  playerX: 40,
  playerSize: 26,
  obstacleW: 18,
  obstacleH: 28,
  startSpeed: 0.28, // px/ms
  maxSpeed: 0.7,
  accel: 0.000012, // px/ms²
  pxPerMeter: 20,
  minGapMs: 650,
  maxGapMs: 1700,
  maxDistance: 1000,
};

export const createRunnerState = () => ({
  y: 0, vy: 0, speed: RUNNER.startSpeed, distancePx: 0, obstacles: [], nextSpawnMs: 900, elapsed: 0, over: false,
});

/** ジャンプ（地面にいるときだけ） */
export const runnerJump = (s) => (s.y <= 0 && !s.over ? { ...s, vy: RUNNER.jumpVelocity } : s);

/**
 * dt ミリ秒ぶん進める。width は画面の幅（障害物の出現位置）
 */
export const stepRunner = (s, dt, width, rng = Math.random) => {
  if (s.over) return s;
  let { y, vy, speed, distancePx, nextSpawnMs, elapsed } = s;
  elapsed += dt;
  vy += RUNNER.gravity * dt;
  y = Math.max(0, y + vy * dt);
  if (y === 0 && vy < 0) vy = 0;
  speed = Math.min(RUNNER.maxSpeed, speed + RUNNER.accel * dt);
  distancePx += speed * dt;
  let obstacles = s.obstacles.map(o => ({ ...o, x: o.x - speed * dt })).filter(o => o.x > -RUNNER.obstacleW);
  nextSpawnMs -= dt;
  if (nextSpawnMs <= 0) {
    const h = RUNNER.obstacleH * (0.7 + rng() * 0.5);
    obstacles = [...obstacles, { x: width, h }];
    // 速くなるほど間隔は詰まる（ただし最低間隔は守る）
    const slow = 1 - (speed - RUNNER.startSpeed) / (RUNNER.maxSpeed - RUNNER.startSpeed) * 0.25;
    nextSpawnMs = (RUNNER.minGapMs + rng() * (RUNNER.maxGapMs - RUNNER.minGapMs)) * slow;
  }
  // 当たり判定（プレイヤーの四角と障害物の四角）
  const px1 = RUNNER.playerX + 4;
  const px2 = RUNNER.playerX + RUNNER.playerSize - 4;
  const hit = obstacles.some(o => o.x < px2 && o.x + RUNNER.obstacleW > px1 && y < o.h - 2);
  const meters = distancePx / RUNNER.pxPerMeter;
  const over = hit || meters >= RUNNER.maxDistance;
  return { y, vy, speed, distancePx, obstacles, nextSpawnMs, elapsed, over, cleared: !hit && over };
};

export const runnerMeters = (s) => Math.min(RUNNER.maxDistance, Math.floor(s.distancePx / RUNNER.pxPerMeter));

export const RUN_FAIL_METERS = 50;

/** 走った距離に応じた報酬 */
export const getRunningRewards = (meters, perTenMeters) => {
  if (meters < RUN_FAIL_METERS) return [{ type: 'stars_add', value: -15 }, { type: 'mult', value: 0.5, duration: 2 }];
  const rewards = [{ type: 'combo_add', value: Math.floor((meters / 10) * perTenMeters), duration: 3 }];
  if (meters >= 150) rewards.push({ type: 'stars_add', value: Math.floor(meters / 10) });
  if (meters >= 300) rewards.push({ type: 'energy', value: 5 });
  if (meters >= 1000) rewards.push({ type: 'mult', value: 5, duration: 3 }, { type: 'levelup', value: 3 });
  else if (meters >= 600) rewards.push({ type: 'mult', value: 3, duration: 3 }, { type: 'levelup', value: 1 });
  else if (meters >= 400) rewards.push({ type: 'mult', value: 2, duration: 3 });
  return rewards;
};

// =============================================================================
// 実績（遊びトークンの記録）
// ランをまたいで残る記録として、二つ名の進捗データ（titleManager の progress）に保存する。
// 実績画面（StatsScreen の「遊びトークン」タブ）と二つ名の解放条件で使う。
// =============================================================================

/** 釣った魚の数の記録キー */
export const fishCountKey = (fishId) => `fish_count_${fishId}`;
/** 的当ての結果（bullseye / inner / …）ごとの回数の記録キー */
export const targetHitKey = (resultId) => `target_hit_${resultId}`;
/** サイコロの目ごとの回数の記録キー */
export const diceFaceKey = (face) => `dice_face_${face}`;
/** ミニゲームを遊んだ回数の記録キー（minigameState.type ごと） */
export const minigamePlayKey = (type) => `mg_plays_${type}`;

/** 結果から釣れた魚の一覧を取り出す（[{ id, size? }]） */
export const getCaughtFishes = (info = {}) => {
  if (Array.isArray(info.fishes)) return info.fishes.filter(f => f && f.id);
  if (info.fish) return [{ id: info.fish, size: info.fishSize }];
  return [];
};

/**
 * ミニゲームの結果（type と logInfo）から、記録する進捗を返す
 * @returns {{ add: Object<string, number>, max: Object<string, number> }}
 */
export const getMinigameProgressUpdates = (type, info = {}) => {
  const add = { [minigamePlayKey(type)]: 1, minigame_plays: 1 };
  const max = {};
  const inc = (key, n = 1) => { if (n > 0) add[key] = (add[key] || 0) + n; };
  const best = (key, v) => { if (Number.isFinite(v)) max[key] = Math.max(max[key] ?? -Infinity, v); };

  switch (type) {
    case 'janken':
      best('janken_streak_max', info.streak || 0);
      inc('janken_wins_total', info.streak || 0);
      inc('janken_draw_bonus', info.drawBonus || 0);
      if (!(info.streak > 0)) inc('janken_zero_wins');
      break;
    case 'fishing':
    case 'fishing_big': {
      const fishes = getCaughtFishes(info);
      fishes.forEach(f => {
        inc(fishCountKey(f.id));
        inc('fish_caught_total');
        if (Number.isFinite(f.size)) {
          best(fishRecordKey(f.id), f.size);
          best('fish_size_max', f.size);
        }
      });
      if (fishes.length >= 2) inc('fish_double_catches');
      break;
    }
    case 'target':
    case 'target_pro':
      if (info.result) inc(targetHitKey(info.result));
      if (info.result === 'bullseye' || info.result === 'core') inc('target_center_hits');
      break;
    case 'mash':
    case 'mash_duo':
      best(type === 'mash' ? 'mash_single_taps_max' : 'mash_duo_taps_max', info.taps || 0);
      best('mash_taps_max', info.taps || 0);
      break;
    case 'dice':
      if (info.face) inc(diceFaceKey(info.face));
      break;
    case 'dice_duo': {
      const [a, b] = info.faces || [];
      if (a) inc(diceFaceKey(a));
      if (b) inc(diceFaceKey(b));
      if (a && a === b) inc('dice_doubles');
      break;
    }
    case 'demon':
      if (info.winner === 'player') inc('demon_wins');
      else if (info.winner === 'demon') inc('demon_losses');
      else if (info.winner === 'draw') inc('demon_draws');
      break;
    case 'highlow':
      best('highlow_wins_max', info.wins || 0);
      inc('highlow_wins_total', info.wins || 0);
      if (info.lost && info.wins > 0) inc('highlow_busts');
      if (!info.lost && info.wins > 0) inc('highlow_cashouts');
      if (!info.lost) best('highlow_cashout_max', info.wins || 0);
      break;
    case 'running':
      best('running_meters_max', info.meters || 0);
      inc('running_meters_total', info.meters || 0);
      if (info.cleared) inc('running_clears');
      break;
    default:
      break;
  }
  return { add, max };
};

// --- 二つ名で強くなるミニゲーム -------------------------------------------------

/**
 * 的当て・精密射撃: 中心（ど真ん中・真芯）に当てたときの効果を強める
 * スター・コンボ等は boost 倍、倍率は「1 からの差」を boost 倍、レベルアップは切り上げ
 */
export const boostCenterRewards = (rewards, boost = 1) => {
  if (!(boost > 1)) return rewards;
  return (rewards || []).map(r => {
    switch (r.type) {
      case 'stars_add':
      case 'combo_add':
        return { ...r, value: Math.round(r.value * boost) };
      case 'mult_add':
        return { ...r, value: Math.round(r.value * boost * 2) / 2 };
      case 'mult':
        return r.value >= 1 ? { ...r, value: Math.round((1 + (r.value - 1) * boost) * 2) / 2 } : r;
      case 'levelup':
        return { ...r, value: Math.ceil(r.value * boost) };
      default:
        return r;
    }
  });
};

/** サイコロで1の目が出たか（ダブルダイスのゾロ目の1は良い効果に反転するので除く） */
export const hasDiceOne = (info = {}) => {
  if (info.face === 1) return true;
  const [a, b] = info.faces || [];
  return (a === 1 || b === 1) && a !== b;
};

/** 二つ名「賽振り」: 1の目が出たときは代償を取り除く */
export const applyDiceOneNull = (rewards, info, enabled) => (
  enabled && hasDiceOne(info) ? (rewards || []).filter(r => !isPenaltyReward(r)) : rewards
);

/** 二つ名「負け知らずの」: じゃんけんの勝ち1回につきスター */
export const addJankenWinStars = (rewards, streak, starsPerWin = 0) => (
  starsPerWin > 0 && streak > 0
    ? [...(rewards || []), { type: 'stars_add', value: Math.floor(starsPerWin * streak) }]
    : rewards
);
