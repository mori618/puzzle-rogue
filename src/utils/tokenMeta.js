/**
 * カード表示用のメタ情報（層バッジ・条件チップ）。
 * 層は scripts/gen-token-layers.mjs が計算エンジンから生成した TOKEN_LAYERS を使う。
 */
import { TOKEN_LAYERS } from '../constants/tokenLayers.js';

export const LAYER_LABELS = {
  add: { label: 'コンボ加算', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  sigma: { label: '加算倍率', className: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  mult: { label: '乗算倍率', className: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
};

const C = { fire: '炎', water: '雨', wood: '風', light: '雷', dark: '月', heart: 'ハート' };
const SHAPE = { len4: '4個消し', len5: '5個消し', l_shape: 'L字', cross: '十字', row: '横一列', column: '縦一列', square: '正方形' };

export const getTokenLayers = (token) => (token && TOKEN_LAYERS[token.id]) || [];

/**
 * 条件チップ。{ text, kind: 'cond' | 'cost' } の配列。条件のない札は空配列。
 */
export function getConditionChips(token) {
  if (!token) return [];
  const p = token.params || {};
  const chips = [];
  const cond = (text) => chips.push({ text, kind: 'cond' });
  const cost = (text) => chips.push({ text, kind: 'cost' });

  switch (token.effect) {
    case 'color_multiplier':
      if (p.count) cond(`${p.count}色同時`);
      else if (p.colors?.length > 1) cond(`${p.colors.map(c => C[c]).join('+')} 同時`);
      else if (p.colors?.length === 1) cond(`${C[p.colors[0]]}を消す`);
      break;
    case 'color_count_bonus': cond(`${C[p.color]} ${p.count}個以上`); break;
    case 'color_combo_multiplier': cond(`${C[p.color]} 2コンボ`); break;
    case 'color_connection_multiplier': cond(`${C[p.color]} ${p.count || 4}個つなげる`); break;
    case 'color_combo_add': cond(`${C[p.color]} 1コンボごと`); break;
    case 'combo_if_ge': cond(`${p.combo}コンボ以上`); break;
    case 'combo_if_le': cond(`${p.combo}コンボ以下`); break;
    case 'shape_bonus': cond(SHAPE[p.shape] || p.shape); break;
    case 'shape_variety_mult': cond('特殊消し2種類'); break;
    case 'skyfall_bonus': cond('落ちコン'); break;
    case 'last_turn_burst': cond('最終手番'); break;
    case 'element_contract': cond(`${C[p.color]}を消す`); cost('対立色で半減'); break;
    case 'forbidden': cost('落ちコン停止'); break;
    case 'desperate_stance': cost('操作4秒固定'); break;
    case 'cursed_power': cost('操作−3秒'); break;
    case 'one_stroke_seal': cost('一筆書き'); break;
    case 'four_match_restriction': cost('4個消しのみ'); break;
    case 'row_match_restriction': cost('横一列のみ'); break;
    case 'additive_mastery': cost('倍率系が無効'); break;
    case 'inugami': cond('加算後100以上'); break;
    default: break;
  }
  if (token.id?.startsWith('devotion_')) { cond(`${C[token.id.replace('devotion_', '')] || ''}のみ`); cost('他色で0'); }
  return chips;
}
