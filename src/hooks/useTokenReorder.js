// トークン欄の「長押し → ドラッグ → 離して配置」による並び替えを管理するフック
//
// 操作方法:
//   1. トークンを長押し（約0.35秒）すると持ち上がる（振動・効果音つき）
//   2. 指を離さずに置きたいスロットへ動かす（置き先が光る）
//   3. 指を離すとその位置に差し込まれる（後ろのトークンは1つずつずれる）
//   - 欄の左右の端で少し止めると前後のページへ切り替わる
//   - 長押しの前に指が動いた場合は、これまで通りページ送りのスワイプになる
//   - 短くタップした場合は、これまで通りトークン詳細を開く
//
// スマホでは HTML5 の draggable が動かないため、Pointer Events で自前実装している。
import { useState, useRef, useCallback, useEffect } from "react";

export const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 10; // 長押し成立前にこれ以上動いたらスワイプとみなす
const EDGE_PX = 28; // 欄の端からこの距離以内でページ送り
const EDGE_DWELL_MS = 450; // 端で止まってからページ送りまでの時間

/**
 * @param {object} p
 * @param {(token:object, pos:number) => void} p.moveToken 1始まりの位置へ移動
 * @param {object} p.pages { passive: {count, set}, active: {count, set} }
 * @param {() => void} [p.onPickUp] 持ち上げた時の演出（効果音など）
 */
export const useTokenReorder = ({ moveToken, pages, onPickUp }) => {
  // drag: { token, kind, fromSlot, x, y, overSlot }
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const pressRef = useRef(null); // 長押し判定中の情報
  const suppressClickRef = useRef(false);
  const lastEndRef = useRef(0); // 直前に並び替えを終えた時刻（スワイプ誤判定防止）
  const edgeRef = useRef({ side: null, since: 0, timer: null });
  const pagesRef = useRef(pages);
  const moveTokenRef = useRef(moveToken);
  useEffect(() => {
    pagesRef.current = pages;
    moveTokenRef.current = moveToken;
  });

  const clearEdge = () => {
    if (edgeRef.current.timer) clearTimeout(edgeRef.current.timer);
    edgeRef.current = { side: null, since: 0, timer: null };
  };

  const findSlot = (x, y, kind) => {
    const el = document.elementFromPoint(x, y);
    const slotEl = el && el.closest ? el.closest('[data-token-slot]') : null;
    if (!slotEl || slotEl.dataset.tokenKind !== kind) return null;
    if (slotEl.dataset.tokenLocked === 'true') return null;
    return parseInt(slotEl.dataset.tokenSlot, 10);
  };

  const handleEdge = (x, y, kind) => {
    const row = document.querySelector(`[data-token-row="${kind}"]`);
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const inRowY = y >= rect.top - 40 && y <= rect.bottom + 40;
    let side = null;
    if (inRowY && x <= rect.left + EDGE_PX) side = -1;
    else if (inRowY && x >= rect.right - EDGE_PX) side = 1;
    if (side === edgeRef.current.side) return;
    clearEdge();
    if (side === null) return;
    const pg = pagesRef.current?.[kind];
    if (!pg || pg.count <= 1) return;
    edgeRef.current.side = side;
    edgeRef.current.timer = setTimeout(() => {
      pg.set(p => Math.max(0, Math.min(pg.count - 1, p + side)));
      edgeRef.current = { side: null, since: 0, timer: null };
    }, EDGE_DWELL_MS);
  };

  const finish = useCallback((commit) => {
    const d = dragRef.current;
    dragRef.current = null;
    lastEndRef.current = Date.now();
    clearEdge();
    setDrag(null);
    // 離した位置で click が起きなかった場合に備え、抑止フラグは少し後に解除
    setTimeout(() => { suppressClickRef.current = false; }, 400);
    if (commit && d && d.overSlot != null && d.overSlot !== d.fromSlot) {
      moveTokenRef.current(d.token, d.overSlot + 1);
    }
  }, []);

  // ドラッグ中はウィンドウ全体で指を追跡する
  useEffect(() => {
    if (!drag) return undefined;
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      e.preventDefault();
      const overSlot = findSlot(e.clientX, e.clientY, d.kind);
      handleEdge(e.clientX, e.clientY, d.kind);
      const next = { ...d, x: e.clientX, y: e.clientY, overSlot };
      dragRef.current = next;
      setDrag(next);
    };
    const onUp = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      finish(e.type === 'pointerup');
    };
    // スクロールやスワイプを止めるため passive: false
    const onTouchMove = (e) => { if (dragRef.current) e.preventDefault(); };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [drag ? drag.pointerId : null, finish]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelPress = () => {
    const p = pressRef.current;
    if (p?.timer) clearTimeout(p.timer);
    if (p?.cleanup) p.cleanup();
    pressRef.current = null;
  };

  useEffect(() => () => { cancelPress(); clearEdge(); }, []);

  /** スロット要素に渡す props を返す */
  const getSlotProps = (token, kind, slot, locked) => ({
    'data-token-slot': slot,
    'data-token-kind': kind,
    'data-token-locked': locked ? 'true' : 'false',
    onContextMenu: (e) => e.preventDefault(),
    onPointerDown: (e) => {
      if (!token || locked) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancelPress();
      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;
      const onEarlyMove = (ev) => {
        if (ev.pointerId !== pointerId) return;
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > MOVE_CANCEL_PX) cancelPress();
      };
      const onEarlyUp = (ev) => { if (ev.pointerId === pointerId) cancelPress(); };
      window.addEventListener('pointermove', onEarlyMove);
      window.addEventListener('pointerup', onEarlyUp);
      window.addEventListener('pointercancel', onEarlyUp);
      const cleanup = () => {
        window.removeEventListener('pointermove', onEarlyMove);
        window.removeEventListener('pointerup', onEarlyUp);
        window.removeEventListener('pointercancel', onEarlyUp);
      };
      const timer = setTimeout(() => {
        cleanup();
        pressRef.current = null;
        suppressClickRef.current = true;
        try { navigator.vibrate?.(15); } catch { /* 非対応端末は無視 */ }
        onPickUp?.();
        const d = { token, kind, fromSlot: slot, x: startX, y: startY, overSlot: slot, pointerId };
        dragRef.current = d;
        setDrag(d);
      }, LONG_PRESS_MS);
      pressRef.current = { timer, cleanup };
    },
  });

  /** 長押し後に発生する click（詳細表示）を1回だけ無効化する */
  const consumeClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return true;
    }
    return false;
  };

  /** ページ送りスワイプを止めるべきか */
  const isDragging = () => !!dragRef.current || Date.now() - lastEndRef.current < 300;

  return { drag, getSlotProps, consumeClick, isDragging };
};
