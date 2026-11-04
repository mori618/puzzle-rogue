import { STAR_COMBO_SCALING } from '../constants/gameConstants.js';

/**
 * 1手番のコンボ数を、スター進捗に加算する「コンボ相当値」に変換する。
 * 目標が refTarget 以下なら（上限内で）コンボ数そのまま。
 * それを超える目標では、目標に対する割合 × refTarget に換算する。
 * @param {number} combo 1手番のコンボ数（倍率適用後）
 * @param {number} target 現在のサイクル目標
 * @param {{refTarget:number, capRatio:number}} [scaling]
 * @returns {number} スター進捗に加算する値（小数あり）
 */
export const getComboStarUnits = (combo, target, scaling = STAR_COMBO_SCALING) => {
  const c = Math.max(0, Number(combo) || 0);
  if (c === 0) return 0;
  const { refTarget, capRatio } = scaling;
  const t = Math.max(1, Number(target) || 0);
  const cappedCombo = Math.min(c, capRatio * Math.max(t, refTarget));
  return t <= refTarget ? cappedCombo : (cappedCombo / t) * refTarget;
};
