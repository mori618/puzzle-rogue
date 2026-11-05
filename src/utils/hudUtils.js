/**
 * ゲーム画面 HUD 用のユーティリティ
 */

/** アクティブトークン（丸ボタン）左側の属性弧を conic-gradient で返す。複数属性は弧を等分する */
export const getAttributeArc = (attributes) => {
  const SPAN = 150; // 弧の角度（左側）
  const list = attributes && attributes.length > 0 ? attributes : null;
  if (!list) return `conic-gradient(from 195deg, #ffffff 0deg ${SPAN}deg, transparent ${SPAN}deg)`;
  const seg = SPAN / list.length;
  const stops = list
    .map((a, i) => `var(--color-attr-${a}) ${i * seg}deg ${(i + 1) * seg}deg`)
    .join(', ');
  return `conic-gradient(from 195deg, ${stops}, transparent ${SPAN}deg)`;
};
