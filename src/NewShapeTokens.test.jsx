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

describe('新規追加されたL字消し・十字消しトークンの定義テスト', () => {
  const tokenIds = [
    'l_shape_double_base_mult',
    'l_shape_count_star',
    'l_shape_spawn_repeat',
    'l_shape_skill_max',
    'l_cross_simultaneous_mult',
    'cross_double_base_mult',
    'cross_count_token',
    'cross_multiply_move_drop',
    'cross_enchant_self'
  ];

  it('新規トークンがすべて ALL_TOKEN_BASES に正しく定義されていること', () => {
    tokenIds.forEach(id => {
      const token = ALL_TOKEN_BASES.find(t => t.id === id);
      expect(token).toBeDefined();
      expect(token.type).toBe('passive');
    });
  });
});

describe('PuzzleEngine - multiplyMoveDropCounts メソッドのテスト', () => {
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

  it('盤面内のムーブドロップのカウントを正しく乗算できること', () => {
    // ムーブドロップを作成し、状態に割り当てる
    const orb = engine.state[0][0];
    orb.isMoveDrop = true;
    orb.moveCount = 4;
    orb.el = document.createElement('div');
    const textSpan = document.createElement('span');
    textSpan.className = 'move-count-text';
    orb.el.appendChild(textSpan);

    // カウントを2倍にする
    engine.multiplyMoveDropCounts(2.0);

    // 検証: カウントが8に増えていること
    expect(orb.moveCount).toBe(8);
  });
});

describe('tokenUtils - getTokenDynamicInfo のテスト', () => {
  it('L字消し累積トークン（l_shape_count）の動的情報を取得できること', () => {
    const item = { id: 'l_shape_count_star', level: 1, charge: 4 };
    const info = getTokenDynamicInfo(item, 1, { currentShapeLShape: 4 });
    const match = info.find(i => i.label === 'L字消し累積');
    expect(match).toBeDefined();
    expect(match.value).toBe('4 / 10 回');
  });

  it('十字消し累積トークン（cross_count）の動的情報を取得できること', () => {
    const item = { id: 'cross_count_token', level: 1, charge: 5 };
    const info = getTokenDynamicInfo(item, 1, { currentShapeCross: 5 });
    const match = info.find(i => i.label === '十字消し累積');
    expect(match).toBeDefined();
    expect(match.value).toBe('5 / 12 回');
  });
});
