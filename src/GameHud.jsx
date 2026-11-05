import React, { useEffect, useState } from 'react';

/**
 * ゲーム画面 HUD 用の小さな表示部品
 * - ターン（数字＋残り手数の点）とサイクル表示
 */

/**
 * 残り手数の点。幅は固定で手番数に応じて等分する。
 * 7手以上は細く、13手以上は1本のバー（白線が現在のターン）にして、行の幅を変えない。
 */
export const TurnPips = ({ turn, maxTurns, danger }) => {
  const max = Math.max(1, maxTurns || 1);
  const now = Math.min(Math.max(1, turn || 1), max);
  if (max > 12) {
    const used = ((now - 1) / max) * 100;
    return (
      <span className={`hud-pips hud-pips-cont ${danger ? 'is-danger' : ''}`} aria-hidden="true">
        <b style={{ width: `${used}%` }} />
        <s style={{ left: `${used}%` }} />
      </span>
    );
  }
  return (
    <span className={`hud-pips ${max > 6 ? 'is-dense' : ''} ${danger ? 'is-danger' : ''}`} aria-hidden="true">
      {Array.from({ length: max }).map((_, i) => (
        <i key={i} className={i < now - 1 ? 'used' : i === now - 1 ? 'now' : ''} />
      ))}
    </span>
  );
};

/** ターン（数字＋点）とサイクル。最大手番が途中で増減したら数字を一瞬色替えして知らせる */
export const TurnCycleInfo = ({ displayTurn, maxTurns, isEndlessMode, cycle, danger }) => {
  // 最大手番の変化を描画中に検知して色替えを始める（effect 内で同期 setState しない）
  const [prevMax, setPrevMax] = useState(maxTurns);
  const [flash, setFlash] = useState('');
  if (prevMax !== maxTurns) {
    setPrevMax(maxTurns);
    setFlash(maxTurns > prevMax ? 'up' : 'down');
  }

  useEffect(() => {
    if (!flash) return undefined;
    const id = setTimeout(() => setFlash(''), 900);
    return () => clearTimeout(id);
  }, [flash, maxTurns]);

  return (
    <div className="hud-turncycle">
      {isEndlessMode ? (
        <span className="hud-tlab">ターン <b>{displayTurn}</b> ∞</span>
      ) : (
        <>
          <span className={`hud-tlab ${flash ? `is-flash-${flash}` : ''}`}>
            ターン <b>{displayTurn}</b>/ {maxTurns}
          </span>
          <TurnPips turn={displayTurn} maxTurns={maxTurns} danger={danger} />
        </>
      )}
      <span className="hud-tlab hud-cycle">サイクル <b>{cycle}</b></span>
    </div>
  );
};

export default TurnCycleInfo;
