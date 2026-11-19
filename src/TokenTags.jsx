import React from 'react';
import { getTokenLayers, getConditionChips, LAYER_LABELS } from './utils/tokenMeta.js';

/**
 * 層バッジ（コンボ加算 / 加算倍率 / 乗算倍率）と条件チップ（炎 12個以上・落ちコン停止 など）。
 */
const TokenTags = ({ token, className = '' }) => {
  const layers = getTokenLayers(token);
  const chips = getConditionChips(token);
  if (layers.length === 0 && chips.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {layers.map(l => (
        <span key={l} className={`text-[10px] leading-none font-bold px-1.5 py-0.5 rounded border ${LAYER_LABELS[l].className}`}>
          {LAYER_LABELS[l].label}
        </span>
      ))}
      {chips.map((c, i) => (
        <span
          key={i}
          className={`text-[10px] leading-none px-1.5 py-0.5 rounded border ${c.kind === 'cost' ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-slate-700/60 text-slate-200 border-white/10'}`}
        >
          {c.text}
        </span>
      ))}
    </div>
  );
};

export default TokenTags;
