import React from 'react';
import { getEquippedTitleInfo } from './utils/titleManager.js';
import soundManager from './utils/SoundManager.js';
import { SE_IDS } from './constants/sounds.js';

/**
 * ゲームプレイ中のヘッダー等に表示する、装備中二つ名のコンパクトなバッジ
 */
export const EquippedTitleChip = ({ equippedTitle, onClick, className = '' }) => {
  const info = getEquippedTitleInfo(equippedTitle);
  const label = info.fullName !== '未設定' ? info.fullName : '二つ名未設定';

  return (
    <button
      type="button"
      onClick={() => {
        soundManager.playSE(SE_IDS.UI_CLICK);
        onClick();
      }}
      aria-label="装備中の二つ名を表示"
      className={`flex items-center gap-0.5 max-w-[170px] text-left active:scale-95 transition-transform ${className}`}
    >
      <span className={`material-icons-round text-[13px] shrink-0 ${info.activeSet ? 'text-yellow-300' : 'text-amber-400'}`}>
        military_tech
      </span>
      <span className={`text-[11px] font-bold tracking-wide truncate ${info.activeSet ? 'text-yellow-200' : 'text-amber-200'}`}>
        {label}
      </span>
      <span className="material-icons-round text-[12px] text-slate-500 shrink-0">chevron_right</span>
    </button>
  );
};

const EffectRow = ({ slotLabel, title, emptyText, onClick }) => (
  <button
    type="button"
    onClick={() => {
      soundManager.playSE(SE_IDS.UI_CLICK);
      onClick();
    }}
    aria-label={`${slotLabel}の二つ名を入れ替える`}
    className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-white/10 hover:border-indigo-400/50 active:scale-[0.98] transition-all flex items-center gap-2"
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest">{slotLabel}</span>
        {title?.category && (
          <span className="text-[9px] text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 px-1.5 py-0.5 rounded-full">
            {title.category}
          </span>
        )}
      </div>
      {title ? (
        <>
          <div className="text-sm font-black text-white">{title.name}</div>
          <div className="text-xs text-slate-300 mt-0.5">{title.desc}</div>
        </>
      ) : (
        <div className="text-xs text-slate-500">{emptyText}（タップで設定）</div>
      )}
    </div>
    <span className="material-icons-round text-lg text-slate-500 shrink-0">chevron_right</span>
  </button>
);

/**
 * 装備中二つ名の詳細（名前・効果）を表示するポップアップ
 */
const TitleInfoPanel = ({ equippedTitle, onClose, onChangeTitle }) => {
  const info = getEquippedTitleInfo(equippedTitle);

  return (
    <div
      className="absolute inset-0 z-[420] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in font-game-cyber"
      onClick={onClose}
    >
      <div
        className="game-panel-cyber rounded-2xl w-full max-w-sm p-5 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="装備中の二つ名"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold tracking-widest">
            <span className="material-icons-round text-amber-400 text-base">military_tech</span>
            EQUIPPED TITLE / 装備中の二つ名
          </div>
          <button
            type="button"
            onClick={() => {
              soundManager.playSE(SE_IDS.UI_CLICK);
              onClose();
            }}
            aria-label="閉じる"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
          >
            <span className="material-icons-round text-lg">close</span>
          </button>
        </div>

        <div className={`p-3 rounded-xl border text-center ${
          info.activeSet
            ? 'bg-gradient-to-r from-amber-950/60 via-purple-950/50 to-slate-900/80 border-amber-500/50'
            : 'bg-slate-900/80 border-white/10'
        }`}>
          <div className={`text-lg font-black tracking-wide ${info.activeSet ? 'text-amber-300' : 'text-indigo-200'}`}>
            {info.fullName !== '未設定' ? info.fullName : '二つ名未設定'}
          </div>
          {info.activeSet && (
            <span className="inline-block mt-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
              専用シナジー発動中
            </span>
          )}
        </div>

        {info.activeSet && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
            <div className="text-[10px] font-bold text-amber-400 tracking-widest mb-1">シナジー効果</div>
            <div className="text-xs text-amber-100">{info.activeSet.desc}</div>
          </div>
        )}

        <EffectRow slotLabel="A枠（接頭辞）" title={info.prefix} emptyText="A枠未設定" onClick={() => onChangeTitle('prefix')} />
        <EffectRow slotLabel="B枠（接尾辞）" title={info.suffix} emptyText="B枠未設定" onClick={() => onChangeTitle('suffix')} />

        <button
          type="button"
          onClick={() => {
            soundManager.playSE(SE_IDS.UI_CLICK);
            onChangeTitle('prefix');
          }}
          className="w-full btn-game-primary py-3 mt-1 flex justify-center items-center gap-2 text-sm"
        >
          <span className="material-icons-round text-lg">swap_horiz</span>
          二つ名を切り替える
        </button>
      </div>
    </div>
  );
};

export default TitleInfoPanel;
