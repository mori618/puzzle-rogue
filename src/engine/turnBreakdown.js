/**
 * 直前の手番の内訳（ターン内訳パネル）。
 *
 * 計算式（src/utils/comboFormula.js）:
 *   最終コンボ = (盤面のコンボ + コンボ加算) × (1 + 加算倍率の合計) × 乗算倍率
 * calcTurnResult の結果を「コンボ加算 / 加算倍率 / 乗算倍率」の3つに分け、
 * 条件を満たさず発動しなかった札とその理由（不足分）を添える。
 */

const COLOR_NAMES = { fire: '炎', water: '雨', wood: '風', light: '雷', dark: '月', heart: 'ハート' };
const SHAPE_NAMES = { len4: '4個消し', len5: '5個消し', l_shape: 'L字消し', cross: '十字消し', row: '横一列消し', column: '縦一列消し', square: '正方形消し' };
const colorName = (c) => COLOR_NAMES[c] || c;

/**
 * 条件つきの札が発動しなかった理由を、今回の数値つきで返す。条件の分からない札は null。
 * @param {object} t トークン
 * @param {object} turn { turnCombo, colorComboCounts, erasedColorCounts, shapes, detailedShapes, hasSkyfallCombo, turn, maxTurns }
 */
export function explainNotFired(t, turn) {
  const p = t.params || {};
  const combos = turn.colorComboCounts || {};
  const erased = turn.erasedColorCounts || {};
  const shapes = turn.shapes || [];
  const matched = Object.keys(combos).filter(c => combos[c] > 0);

  switch (t.effect) {
    case 'color_multiplier': {
      if (p.count) {
        return matched.length >= p.count ? null : `${p.count}色を同時に消す必要あり（今回${matched.length}色）`;
      }
      const missing = (p.colors || []).filter(c => !(combos[c] > 0));
      return missing.length ? `${missing.map(colorName).join('・')}を消していない` : null;
    }
    case 'color_count_bonus': {
      const n = erased[p.color] || 0;
      return n >= p.count ? null : `${colorName(p.color)}を${p.count}個以上（今回${n}個・あと${p.count - n}個）`;
    }
    case 'color_combo_multiplier': {
      const n = combos[p.color] || 0;
      return n >= 2 ? null : `${colorName(p.color)}を2コンボ以上（今回${n}コンボ）`;
    }
    case 'color_connection_multiplier': {
      const need = p.count || 4;
      const best = Math.max(0, ...(turn.detailedShapes || []).filter(s => s.color === p.color).map(s => s.length));
      return best >= need ? null : `${colorName(p.color)}を${need}個以上つなげる（今回最大${best}個）`;
    }
    case 'color_combo_add': {
      return (combos[p.color] || 0) > 0 ? null : `${colorName(p.color)}を消していない`;
    }
    case 'combo_if_ge':
      return turn.turnCombo >= p.combo ? null : `${p.combo}コンボ以上（今回${turn.turnCombo}コンボ）`;
    case 'combo_if_le':
      return turn.turnCombo <= p.combo ? null : `${p.combo}コンボ以下（今回${turn.turnCombo}コンボ）`;
    case 'shape_bonus':
      return shapes.includes(p.shape) ? null : `${SHAPE_NAMES[p.shape] || p.shape}をしていない`;
    case 'shape_variety_mult': {
      const kinds = new Set(shapes).size;
      return kinds >= 2 ? null : `特殊消しを2種類以上（今回${kinds}種類）`;
    }
    case 'skyfall_bonus':
      return turn.hasSkyfallCombo ? null : '落ちコンが発生していない';
    case 'last_turn_burst':
      return turn.turn === turn.maxTurns ? null : `サイクルの最終手番のみ（今回${turn.turn}/${turn.maxTurns}手目）`;
    default:
      return null;
  }
}

/** 連鎖中（手を離す前）に加算される札。calcTurnResult の steps には出ない。 */
const REALTIME_EFFECTS = new Set(['shape_bonus', 'color_combo_add', 'heart_combo_bonus', 'bonus_skyfall', 'enhanced_orb_bonus', 'rainbow_combo_bonus', 'stat_shape_cross', 'stat_shape_len4']);

/**
 * @param {object} result calcTurnResult の戻り値
 * @param {object} turn   explainNotFired と同じ入力
 */
export function buildTurnBreakdown(result, turn) {
  const steps = result.steps || [];
  const bonusSteps = steps.filter(s => s.kind === 'bonus');
  const masteryStep = steps.find(s => s.isAdditiveMastery) || null;
  const multSteps = steps.filter(s => s.kind === 'multiplier' && !s.isAdditiveMastery && s.type === 'mult');
  const sigmaSteps = steps.filter(s => s.kind === 'multiplier' && !s.isAdditiveMastery && s.type !== 'mult');
  const firedIds = new Set(steps.map(s => s.tokenId).filter(Boolean));

  const notFired = [];
  (result.effectiveTokens || []).forEach(t => {
    if (!t || t.type !== 'passive') return;
    const id = t.instanceId || t.id;
    if (firedIds.has(id)) return;
    const reason = explainNotFired(t, turn);
    if (reason) notFired.push({ tokenId: id, name: t.name, level: t.level || 1, reason });
  });

  const sigmaTotal = 1 + (result.addedMultiplier || 0);
  return {
    rawCombo: result.tc,
    bonus: result.bonus,
    finalBaseCombo: result.finalBaseCombo,
    sigma: result.addedMultiplier || 0,
    // 乗算倍率の合計（呪いなど ×1 未満の減少系も含む）
    multTotal: sigmaTotal > 0 ? result.finalComboMultiplier / sigmaTotal : 1,
    finalComboMultiplier: result.finalComboMultiplier,
    effectiveCombo: result.effectiveCombo,
    bonusSteps,
    multSteps,
    sigmaSteps,
    masteryStep,
    notFired,
    realtimeTokens: (result.effectiveTokens || [])
      .filter(t => t && REALTIME_EFFECTS.has(t.effect) && !explainNotFired(t, turn))
      .map(t => ({ tokenId: t.instanceId || t.id, name: t.name, level: t.level || 1 })),
  };
}
