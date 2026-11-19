import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { usePuzzleBoard } from './usePuzzleBoard';

vi.mock('../utils/SoundManager', () => ({ default: { playSE: vi.fn() } }));

const setup = (initial) => renderHook(() => {
  const [tokens, setTokens] = useState(initial);
  const board = usePuzzleBoard({ tokens, setTokens, notify: () => {} });
  return { tokens, setTokens, ...board };
});

const p = (id, extra = {}) => ({ instanceId: id, id, name: id, type: 'passive', level: 1, ...extra });
const s = (id) => ({ instanceId: id, id, name: id, type: 'skill', level: 1 });

describe('moveToken（トークン並び替え）', () => {
  it('指定位置に差し込み、後ろのトークンがずれる', () => {
    const { result } = setup([p('a'), p('b'), p('c'), s('x')]);
    act(() => result.current.moveToken(result.current.tokens[0], 3));
    expect(result.current.tokens.map(t => t.id)).toEqual(['b', 'c', 'a', 'x']);
  });

  it('スキルとパッシブは混ざらない', () => {
    const { result } = setup([p('a'), s('x'), s('y')]);
    act(() => result.current.moveToken(result.current.tokens[2], 1));
    const ts = result.current.tokens.filter(Boolean);
    expect(ts.filter(t => t.type === 'skill').map(t => t.id)).toEqual(['y', 'x']);
    expect(ts.filter(t => t.type !== 'skill').map(t => t.id)).toEqual(['a']);
  });

  it('ドラッグ開始時の古いオブジェクトで最新の状態を上書きしない', () => {
    const { result } = setup([p('a'), p('b')]);
    const stale = result.current.tokens[0];
    // 並び替え中にレベルアップした想定
    act(() => result.current.setTokens(prev => prev.map(t => (t.id === 'a' ? { ...t, level: 3 } : t))));
    act(() => result.current.moveToken(stale, 2));
    expect(result.current.tokens.map(t => [t.id, t.level])).toEqual([['b', 1], ['a', 3]]);
  });
});
