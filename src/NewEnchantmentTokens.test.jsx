import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './hooks/useGameState.js';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { ENCHANTMENTS } from './constants/enchantments.js';

// AudioContextのモック
class MockAudioContext {
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      }
    };
  }
  createGain() {
    return {
      connect: () => {},
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
  }
  destination = {};
  close() {}
  state = 'suspended';
  resume() { return Promise.resolve(); }
}
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

// Lucideのモック
vi.mock('lucide-react', () => ({
  Star: () => null,
  Settings: () => null,
  Play: () => null,
  Zap: () => null,
  Shield: () => null,
  Clock: () => null,
  Swords: () => null,
  BookOpen: () => null,
  Backpack: () => null,
  Sword: () => null,
  Heart: () => null,
  Coins: () => null,
  Timer: () => null,
  Trophy: () => null,
  RefreshCw: () => null,
  X: () => null,
  Info: () => null,
  BarChart2: () => null,
  ShoppingCart: () => null,
  RotateCcw: () => null,
  Home: () => null,
  HelpCircle: () => null,
  Cpu: () => null,
}));

describe('新規追加されたトークンおよびエンチャントの挙動テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    localStorage.clear();
  });

  it('魔導の過積載 (magic_overload) の効果がコンボ計算に適用されること', async () => {
    const { result } = renderHook(() => useGameState());

    // 盤面のクリーンアップ（他の特殊ドロップによる干渉を防ぐ）
    if (result.current.engineRef && result.current.engineRef.current) {
      result.current.engineRef.current.state.forEach(row => {
        row.forEach(orb => {
          if (orb) {
            orb.type = 'fire';
            orb.isMoveDrop = false;
            orb.isBomb = false;
            orb.isRepeat = false;
            orb.isStar = false;
            orb.isEnhanced = false;
            orb.isRainbow = false;
          }
        });
      });
    }

    // 初期トークンとエンチャントのセットアップ
    act(() => {
      result.current.setActiveBuffs([]);
      result.current.setTokens([
        {
          id: 'magic_overload',
          instanceId: 'tok-overload',
          effect: 'magic_overload',
          level: 1,
          values: [1.5, 2.0, 3.0],
          enchantments: []
        },
        {
          id: 'dummy_token',
          instanceId: 'tok-dummy',
          type: 'passive',
          effect: 'base_add',
          level: 1,
          values: [3],
          enchantments: [
            { id: 'chain', effect: 'fixed_add', value: 3 },
            { id: 'haste', effect: 'time_ext_enc', value: 2 },
            { id: 'rainbow', effect: 'multi_color', value: 5 }
          ]
        },
        null, null, null, null
      ]);
    });

    // Reactの状態更新を反映
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
    });

    console.log("TEST TOKENS BEFORE TURN END:", JSON.stringify(result.current.tokens, null, 2));

    // ターン終了させてコンボを計算させる
    await act(async () => {
      await result.current.handleTurnEndRef.current(
        4, // 4コンボ消去
        { fire: 1 },
        { fire: 3 },
        false
      );
    });

    // 期待する計算:
    // 基礎コンボ: 4 (消去数) + 3 (dummy_tokenのfixed_add) + 3 (chainエンチャントのfixed_add) = 10コンボ
    // 魔導の過積載による倍率: 1.5倍 (エンチャント3つ持ちの dummy_token が1つあるため)
    // 最終コンボ: 10 * 1.5 = 15コンボ
    expect(result.current.cycleTotalCombo).toBe(15);
  });

  it('諸刃の刻印 (double_edged) の効果により倍率が加算され、ターン終了時にスターが消費されること', async () => {
    const { result } = renderHook(() => useGameState());

    // 盤面のクリーンアップ（他の特殊ドロップによる干渉を防ぐ）
    if (result.current.engineRef && result.current.engineRef.current) {
      result.current.engineRef.current.state.forEach(row => {
        row.forEach(orb => {
          if (orb) {
            orb.type = 'fire';
            orb.isMoveDrop = false;
            orb.isBomb = false;
            orb.isRepeat = false;
            orb.isStar = false;
            orb.isEnhanced = false;
            orb.isRainbow = false;
          }
        });
      });
    }

    act(() => {
      result.current.setActiveBuffs([]);
      result.current.setStars(10); // スターを10個に設定
      result.current.setTokens([
        {
          id: 'dummy_token',
          instanceId: 'tok-dummy',
          effect: 'fixed_add',
          level: 1,
          value: 0,
          enchantments: [
            { id: 'double_edged', effect: 'double_edged' }
          ]
        },
        null, null, null, null, null
      ]);
    });

    // Reactの状態更新を反映
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleTurnEndRef.current(
        4,
        { fire: 1 },
        { fire: 3 },
        false
      );
    });

    // 期待する計算:
    // 諸刃の刻印によって、倍率に +4.0 加算される (初期 multiplier = 1.0 => 5.0)
    // 基礎コンボ: 4 (消去数)
    // 最終コンボ: 4 * 5.0 = 20コンボ
    expect(result.current.cycleTotalCombo).toBe(20);

    // スターが 3 減り、コンボ報酬(+7)が足されて 14 になっていること (10 - 3 + 7 = 14)
    expect(result.current.stars).toBe(14);
  });

  it('昇華のルーン (sublimation_rune) にエンチャントが3つ以上付いた時にエンチャントを消費して永続バフとなること', async () => {
    const { result } = renderHook(() => useGameState());

    // 初期状態: 昇華のルーンをセット
    act(() => {
      result.current.setActiveBuffs([]);
      result.current.setTokens([
        {
          id: 'sublimation_rune',
          instanceId: 'tok-sublimation',
          effect: 'sublimation_rune',
          level: 1,
          values: [1.0, 1.5, 2.0],
          enchantments: []
        },
        null, null, null, null, null
      ]);
    });

    // Reactの状態更新を反映
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
    });

    // エンチャントを3つ追加する
    act(() => {
      result.current.setTokens(prev => {
        const next = [...prev];
        next[0] = {
          ...next[0],
          enchantments: [
            { id: 'chain', effect: 'fixed_add', value: 3 },
            { id: 'haste', effect: 'time_ext_enc', value: 2 },
            { id: 'rainbow', effect: 'multi_color', value: 5 }
          ]
        };
        return next;
      });
    });

    // Reactの状態更新を反映（useEffectが走るのを待つ）
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
    });

    // 期待値: 3つ付いたことを useEffect が検知し、エンチャントを空にし、sublimationBonus を +1.0 加算する。
    expect(result.current.tokens[0].enchantments.length).toBe(0);
    expect(result.current.tokens[0].sublimationBonus).toBe(1.0);
  });
});
