// コンボ数の最終計算式
//
//   最終コンボ = 基礎コンボ × コンボ倍率
//   基礎コンボ = 盤面のコンボ + コンボ加算
//   コンボ倍率 = (1 + 加算倍率の合計) × 乗算倍率 × 旧「基礎コンボ ×N」系の倍率 × 減少系の倍率
//
// ×N 系の倍率（呪いやペナルティなどの減少系も含む）は、すべてコンボ倍率側に掛かる。

export const INUGAMI_THRESHOLD = 100;

/** 基礎コンボ（盤面のコンボ + コンボ加算）。盤面のコンボが 0 なら 0 */
export function calcBaseCombo(tc, bonus) {
  if (!(tc > 0)) return 0;
  return Math.floor(tc + (bonus || 0));
}

/** コンボ倍率 = (1 + 加算) × 乗算 × 旧基礎側の倍率 × 減少系 */
export function calcComboMultiplier({ addedMultiplier = 0, multMultiplier = 1, movedMultiplier = 1, penaltyMultiplier = 1 } = {}) {
  return (1.0 + addedMultiplier) * multMultiplier * movedMultiplier * penaltyMultiplier;
}

/**
 * 最終コンボ。切り捨ては最後に1回だけ行う。
 * 浮動小数点の誤差（2.9999… → 2）で1コンボ落ちないよう、ごく小さな値を足してから切り捨てる。
 */
export function applyComboMultiplier(baseCombo, comboMultiplier, { maxCombo = Infinity } = {}) {
  if (!(baseCombo > 0)) return 0;
  const value = Math.floor(baseCombo * comboMultiplier + 1e-9);
  return Math.min(value, maxCombo);
}
