// ミニゲームの結果表示（MinigameModal / MinigameExtraGames で共通に使う）
import React from 'react';
import { describeRewards, isAllPenalty } from './utils/minigames.js';

const ResultBox = ({ title, titleClass, rewards, note }) => {
  const penalty = isAllPenalty(rewards);
  const tClass = titleClass || (penalty ? 'text-red-400' : 'text-amber-300');
  return (
    <div className={`bg-slate-900/70 rounded-xl p-3 text-center border ${penalty ? 'border-red-500/40' : 'border-white/10'}`}>
      <div className={`text-lg font-bold ${tClass}`}>{title}</div>
      {note && <div className="text-[11px] text-fuchsia-300 font-bold mt-1">{note}</div>}
      {penalty && <div className="text-[10px] text-red-300 font-bold mt-1">代償</div>}
      <div className={`text-sm mt-1 font-bold ${penalty ? 'text-red-300' : rewards.length > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
        {describeRewards(rewards)}
      </div>
    </div>
  );
};

export default ResultBox;
