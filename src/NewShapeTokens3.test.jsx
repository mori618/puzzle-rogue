import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { PuzzleEngine } from './engine/PuzzleEngine.js';
import { getTokenDynamicInfo } from './utils/tokenUtils.js';

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

describe('新規追加された4つ消し・5つ消しトークンの定義テスト', () => {
  const tokenIds = [
    'len4_quad_base_mult',
    'len4_spawn_plus',
    'len4_spawn_token',
    'len4_count_all_plus',
    'len5_random_enchant',
    'len5_count_level_up'
  ];

  it('新規トークンがすべて ALL_TOKEN_BASES に正しく定義されていること', () => {
    tokenIds.forEach(id => {
      const token = ALL_TOKEN_BASES.find(t => t.id === id);
      expect(token).toBeDefined();
      expect(token.type).toBe('passive');
    });
  });

  it('既存の「四連の術」の説明文言が「4個消しでコンボ+{values}。」であること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'len4');
    expect(t).toBeDefined();
    expect(t.desc).toBe('4個消しでコンボ+{values}。');
  });
});

describe('PuzzleEngine - spawnPlusRandom と makeAllOrbsPlus メソッドのテスト', () => {
  let container;
  let timerBar;
  let comboEl;
  let engine;

  beforeEach(() => {
    container = document.createElement('div');
    timerBar = document.createElement('div');
    comboEl = document.createElement('div');
    document.body.appendChild(container);

    engine = new PuzzleEngine(container, timerBar, comboEl, {
      rows: 5,
      cols: 6,
      timeLimit: 5000,
      minMatchLength: 3,
      totalMoveTimeRef: { current: 0 }
    });
    engine.init();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('spawnPlusRandom がランダムなドロップを指定数プラスドロップ（isEnhanced）にすること', () => {
    // 全オーブを非Enhancedにする
    engine.state.forEach(row => row.forEach(orb => { if (orb) orb.isEnhanced = false; }));
    
    engine.spawnPlusRandom(3);

    let enhancedCount = 0;
    engine.state.forEach(row => row.forEach(orb => {
      if (orb && orb.isEnhanced) enhancedCount++;
    }));

    expect(enhancedCount).toBe(3);
  });

  it('makeAllOrbsPlus が盤面の全ドロップをプラスドロップにすること', () => {
    // 全オーブを非Enhancedにする
    engine.state.forEach(row => row.forEach(orb => { if (orb) orb.isEnhanced = false; }));

    engine.makeAllOrbsPlus();

    let allEnhanced = true;
    engine.state.forEach(row => row.forEach(orb => {
      if (orb && !orb.isEnhanced) allEnhanced = false;
    }));

    expect(allEnhanced).toBe(true);
  });
});

describe('tokenUtils - getTokenDynamicInfo のテスト (4つ消し・5つ消し)', () => {
  it('4個消し累積トークン（len4_count）の動的情報を取得できること', () => {
    const item = { id: 'len4_count_all_plus', level: 1, charge: 5 };
    const info = getTokenDynamicInfo(item, 1, { currentShapeLen4: 5 });
    const match = info.find(i => i.label === '4個消し累積');
    expect(match).toBeDefined();
    expect(match.value).toBe('5 / 15 回');
  });

  it('5個以上連結消し累積トークン（len5_count）の動的情報を取得できること', () => {
    const item = { id: 'len5_count_level_up', level: 1, charge: 3 };
    const info = getTokenDynamicInfo(item, 1, { currentShapeLen5: 3 });
    const match = info.find(i => i.label === '5個以上連結消し累積');
    expect(match).toBeDefined();
    expect(match.value).toBe('3 / 10 回');
  });
});
