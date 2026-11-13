import React from 'react';
import { formatJapaneseNumber } from './utils/numberUtils.js';
import { formatNum } from './utils/tokenUtils';

/**
 * ターン内訳パネル（docs/balance-ui-design.md §6.3）。
 * 直前の手番で「どの札がどの層にいくら効いたか」と「発動しなかった札とその理由」を出す。
 * 色は盤面上の内訳演出に合わせる（加算: 黄 / 基礎倍: ピンク / 倍率プラス: 水色）。
 */
const Row = ({ label, value, className = '' }) => (
  <div className="flex justify-between gap-3 py-0.5 pl-3 text-xs">
    <span className="text-slate-300 truncate">{label}</span>
    <span className={`font-mono font-bold shrink-0 ${className}`}>{value}</span>
  </div>
);

const Section = ({ title, total, color, children, empty }) => (
  <div className="mb-3">
    <div className="flex justify-between items-baseline border-b border-white/10 pb-1 mb-1">
      <span className={`text-sm font-bold ${color}`}>{title}</span>
      <span className={`font-mono font-bold text-sm ${color}`}>{total}</span>
    </div>
    {empty ? <div className="pl-3 text-xs text-slate-500">なし</div> : children}
  </div>
);

const TurnBreakdownPanel = ({ breakdown, onClose }) => {
  if (!breakdown) return null;
  const b = breakdown;
  const fmtMult = (v) => `×${formatNum(Math.round(v * 100) / 100)}`;
  const baseMultTotal = b.baseMult * b.multAfterSigma;

  return (
    <div
      className="fixed inset-0 z-[460] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-label="前の手番の内訳"
    >
      <div
        className="bg-slate-800 w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-2xl p-5 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-white">前の手番の内訳</h3>
          <button onClick={onClose} className="text-slate-400 active:scale-95" aria-label="閉じる">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <Row label="素コンボ（連鎖中の加算を含む）" value={formatJapaneseNumber(b.rawCombo)} className="text-white" />
        {b.realtimeTokens.length > 0 && (
          <div className="pl-6 text-[11px] text-slate-500 mb-2">
            うち連鎖中に加算: {b.realtimeTokens.map(t => `${t.name} Lv${t.level}`).join('、')}
          </div>
        )}

        <Section title="＋加算" total={`+${formatJapaneseNumber(b.bonus)}`} color="text-amber-400" empty={b.bonusSteps.length === 0 && !b.masteryStep}>
          {b.bonusSteps.map((s, i) => (
            <Row key={i} label={s.label} value={typeof s.value === 'number' ? `+${formatNum(s.value)}` : s.value} className="text-amber-300" />
          ))}
        </Section>

        <Section title="×基礎倍" total={fmtMult(baseMultTotal)} color="text-pink-400" empty={b.multSteps.length === 0}>
          {b.masteryStep && (
            <div className="pl-3 text-[11px] text-slate-400 mb-1">加算の極意: 基礎倍・倍率プラスは無効（×1未満のペナルティは残る）</div>
          )}
          {b.multSteps.map((s, i) => (
            <Row key={i} label={s.label} value={fmtMult(s.value)} className={s.value < 1 ? 'text-red-400' : 'text-pink-300'} />
          ))}
        </Section>

        <Section title="倍率プラス" total={`1 + ${formatNum(Math.round(b.sigma * 100) / 100)} = ${fmtMult(1 + b.sigma)}`} color="text-sky-400" empty={b.sigmaSteps.length === 0}>
          {b.sigmaSteps.map((s, i) => (
            <Row key={i} label={s.label} value={`+${formatNum(Math.round((s.addedValue ?? (s.value - 1)) * 100) / 100)}`} className="text-sky-300" />
          ))}
        </Section>

        <div className="border-t border-white/10 pt-2 mb-3 text-xs font-mono text-slate-300 text-center">
          ({formatJapaneseNumber(b.rawCombo)} + {formatJapaneseNumber(b.bonus)}) {fmtMult(baseMultTotal)} {fmtMult(1 + b.sigma)}
          <div className="text-lg font-bold text-white mt-1">= {formatJapaneseNumber(b.effectiveCombo)}</div>
        </div>

        {b.notFired.length > 0 && (
          <details className="text-xs" open>
            <summary className="text-slate-400 font-bold cursor-pointer mb-1">発動しなかった効果（{b.notFired.length}）</summary>
            {b.notFired.map(n => (
              <div key={n.tokenId} className="flex justify-between gap-3 py-0.5 pl-3">
                <span className="text-slate-300 shrink-0">{n.name}</span>
                <span className="text-slate-500 text-right">{n.reason}</span>
              </div>
            ))}
          </details>
        )}
      </div>
    </div>
  );
};

export default TurnBreakdownPanel;
