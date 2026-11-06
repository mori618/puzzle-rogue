// ギャンブル: 豪華な宝箱（中身とは別にプラス効果が発動する）の統合テスト
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './hooks/useGameState.js';
import { ALL_TOKEN_BASES } from './constants/tokens.js';

class MockAudioContext {
  createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  createGain() { return { connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  destination = {};
  close() {}
  state = 'suspended';
  resume() { return Promise.resolve(); }
}
global.AudioContext = MockAudioContext;
window.AudioContext = MockAudioContext;

const STAR_MULT = { double: 2, nothing: 1, half: 0.5 };

const setupGamble = async () => {
  const { result } = renderHook(() => useGameState());
  const base = ALL_TOKEN_BASES.find(t => t.id === 'gamble');
  act(() => {
    result.current.setStars(100);
    result.current.setTokens([{ ...base, instanceId: 'tok-gamble', level: 1, charge: 99 }, null, null, null]);
    // 盤面のエンジンが無い環境（renderHook）でもスキルを使えるようにする
    if (!result.current.engineRef.current) {
      result.current.engineRef.current = new Proxy({ processing: false, state: [] }, {
        get: (target, key) => (key in target ? target[key] : () => {}),
      });
    }
  });
  await act(async () => { vi.runAllTimers(); await Promise.resolve(); });
  act(() => { result.current.activateSkill(result.current.tokens[0]); });
  return result;
};

describe('豪華な宝箱', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllTimers(); localStorage.clear(); });

  it('ギャンブル開始時に豪華になる確率（基本10%）を持つ', async () => {
    const result = await setupGamble();
    expect(result.current.gambleState.luxuryChance).toBeCloseTo(0.1);
  });

  it('豪華になると、中身とは別にプラス効果が発動する', async () => {
    const result = await setupGamble();
    const chest = result.current.gambleState.chests[0];
    // 豪華の抽選（0.01 < 10%）と効果の抽選（先頭 = スター+20）を当てる
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    act(() => { result.current.pickGambleChest(0); });
    expect(result.current.gambleState.luxury).toEqual([{ type: 'stars_add', value: 20 }]);
    expect(result.current.stars).toBe(Math.floor(100 * STAR_MULT[chest]) + 20);
  });

  it('豪華にならなければ追加効果なし', async () => {
    const result = await setupGamble();
    const chest = result.current.gambleState.chests[0];
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    act(() => { result.current.pickGambleChest(0); });
    expect(result.current.gambleState.luxury).toBeNull();
    expect(result.current.stars).toBe(Math.floor(100 * STAR_MULT[chest]));
  });
});
