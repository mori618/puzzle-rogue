// 緩急の心得: 手番の操作時間（ドロップを掴んでから離すまで）に応じて効果を決める
export const MOVE_TIME_RHYTHM_FAST_MS = 2000; // これ以下ならエネルギーチャージ
export const MOVE_TIME_RHYTHM_MID_MIN_MS = 4000; // ここから
export const MOVE_TIME_RHYTHM_MID_MAX_MS = 10000; // ここまではコンボ加算。これを超えると倍率加算
export const MOVE_TIME_RHYTHM_CHARGE = 1;

/**
 * @param {number} elapsedMs 操作時間（ミリ秒）
 * @param {number} comboAddValue 4〜10秒のときに加算するコンボ数（トークンのレベル値）
 * @returns {{ kind: 'charge', charge: number } | { kind: 'combo', bonus: number } | { kind: 'multiplier', addMultiplier: number } | { kind: 'none' }}
 */
export function getMoveTimeRhythmEffect(elapsedMs, comboAddValue = 0) {
  const ms = Number(elapsedMs);
  if (!Number.isFinite(ms) || ms <= 0) return { kind: 'none' };
  if (ms <= MOVE_TIME_RHYTHM_FAST_MS) {
    return { kind: 'charge', charge: MOVE_TIME_RHYTHM_CHARGE };
  }
  if (ms >= MOVE_TIME_RHYTHM_MID_MIN_MS && ms <= MOVE_TIME_RHYTHM_MID_MAX_MS) {
    return comboAddValue > 0 ? { kind: 'combo', bonus: comboAddValue } : { kind: 'none' };
  }
  if (ms > MOVE_TIME_RHYTHM_MID_MAX_MS) {
    // 操作時間の秒数（小数第1位で切り捨て）をそのままコンボ倍率に加算する
    return { kind: 'multiplier', addMultiplier: Math.floor(ms / 100) / 10 };
  }
  return { kind: 'none' };
}
