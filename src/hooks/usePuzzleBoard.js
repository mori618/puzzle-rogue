// 盤面のサイズおよびドラッグ＆ドロップ・並び替えを管理するカスタムフック
import { useState, useCallback } from "react";
import soundManager from "../utils/SoundManager";
import { SE_IDS } from "../constants/sounds";

export const usePuzzleBoard = ({ tokens, setTokens, notify }) => {
  const [draggedToken, setDraggedToken] = useState(null);
  const [tokenMoveInput, setTokenMoveInput] = useState('');

  // 巨大ドメインが存在するかどうかで盤面サイズを計算
  const hasGiantDomain = tokens.some(
    (t) => t?.id === "giant" || t?.enchantments?.some(e => e.effect === "expand_board")
  );
  const rows = hasGiantDomain ? 6 : 5;
  const cols = hasGiantDomain ? 7 : 6;

  /** トークンを同一タイプの中で指定番号の位置に移動する */
  const moveToken = useCallback((token, targetPos) => {
    if (!token) return;
    const isSkill = token.type === 'skill';

    setTokens(prev => {
      // スキルとパッシブを分離
      const sameType = prev.filter(t => t != null && (isSkill ? t.type === 'skill' : t.type !== 'skill'));
      const otherType = prev.filter(t => t == null || (isSkill ? t.type !== 'skill' : t.type === 'skill'));
      // 対象トークンを取り除いた同タイプリスト
      const withoutSelf = sameType.filter(t => t.instanceId !== token.instanceId);
      // 指定位置（1始まり）に挿入
      const clampedPos = Math.max(0, Math.min(targetPos - 1, withoutSelf.length));
      withoutSelf.splice(clampedPos, 0, token);
      // 同タイプを前に、別タイプを後ろに結合
      return [...withoutSelf, ...otherType];
    });

    soundManager.playSE(SE_IDS.EQUIP_TOKEN);
    notify(`${token.name} を ${targetPos} 番目に移動しました`);
  }, [setTokens, notify]);

  /** ドラッグ開始 */
  const handleDragStart = useCallback((e, token) => {
    if (!token) return;
    setDraggedToken(token);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  /** ドラッグオーバー */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  /** ドロップ */
  const handleDrop = useCallback((e, targetPos, isSkill) => {
    e.preventDefault();
    if (!draggedToken) return;

    // 異なるタイプ同士の入れ替えは制限
    if ((draggedToken.type === 'skill') !== isSkill) {
      setDraggedToken(null);
      return;
    }

    moveToken(draggedToken, targetPos);
    setDraggedToken(null);
  }, [draggedToken, moveToken]);

  return {
    draggedToken,
    setDraggedToken,
    tokenMoveInput,
    setTokenMoveInput,
    rows,
    cols,
    moveToken,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
};
