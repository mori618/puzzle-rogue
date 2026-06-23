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

describe('新規追加された正方形・列消しトークンの定義テスト', () => {
  const tokenIds = [
    'square_count_combo_mult',
    'square_convert_left_bottom',
    'square_spawn_repeat',
    'square_combo_addition',
    'row_count_convert_top',
    'row_triple_base_mult',
    'row_spawn_star',
    'row_free_reroll'
  ];

  it('新規トークンがすべて ALL_TOKEN_BASES に正しく定義されていること', () => {
    tokenIds.forEach(id => {
      const token = ALL_TOKEN_BASES.find(t => t.id === id);
      expect(token).toBeDefined();
      expect(token.type).toBe('passive');
    });
  });

  it('既存の「横一閃」のvaluesが[5, 7, 10]に変更されていること', () => {
    const t = ALL_TOKEN_BASES.find(t => t.id === 'row_clear');
    expect(t).toBeDefined();
    expect(t.values).toEqual([5, 7, 10]);
  });
});

describe('PuzzleEngine - convertAreaToColor メソッドのテスト', () => {
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

  it('指定した矩形範囲が正しく変換されること', () => {
    // 盤面の一部をテスト用にセットアップ
    // rows: 5, cols: 6 のうち、(0, 0) から 1行2列 を 'fire' に変換する
    engine.state[0][0].type = 'water';
    engine.state[0][1].type = 'water';
    engine.state[0][2].type = 'water';

    engine.convertAreaToColor(0, 0, 1, 2, 'fire');

    expect(engine.state[0][0].type).toBe('fire');
    expect(engine.state[0][1].type).toBe('fire');
    expect(engine.state[0][2].type).not.toBe('fire'); // 範囲外はそのまま
  });
});

describe('tokenUtils - getTokenDynamicInfo のテスト', () => {
  it('正方形消し累積トークン（square_count）の動的情報を取得できること', () => {
    const item = { id: 'square_count_combo_mult', level: 1, charge: 2 };
    const info = getTokenDynamicInfo(item, 1, { currentShapeSquare: 2 });
    const match = info.find(i => i.label === '正方形消し累積');
    expect(match).toBeDefined();
    expect(match.value).toBe('2 / 3 回');
  });

  it('横一列消し累積トークン（row_count）の動的情報を取得できること', () => {
    const item = { id: 'row_count_convert_top', level: 1, charge: 5 };
    const info = getTokenDynamicInfo(item, 1, { currentShapeRow: 5 });
    const match = info.find(i => i.label === '横一列消し累積');
    expect(match).toBeDefined();
    expect(match.value).toBe('5 / 12 回');
  });
});

// useGameState.js で使われる getInheritedAttribute のモックと検証
describe('getInheritedAttribute ヘルパー関数の動作検証', () => {
  const getInheritedAttribute = (tokenId, currentTokens) => {
    const idx = currentTokens.findIndex(t => t && (t.instanceId === tokenId || t.id === tokenId));
    if (idx <= 0) return null;
    for (let i = idx - 1; i >= 0; i--) {
      const prevToken = currentTokens[i];
      if (prevToken) {
        if (prevToken.attributes && prevToken.attributes.length > 0) {
          return prevToken.attributes[0];
        }
        return null;
      }
    }
    return null;
  };

  it('左隣のトークンの属性を正しく継承できること', () => {
    const tokens = [
      { id: 't1', instanceId: 'i1', attributes: ['fire'] },
      { id: 't2', instanceId: 'i2', attributes: ['water'] },
      { id: 'target', instanceId: 'i3', attributes: [] }
    ];
    // targetの左隣はt2（属性: water）
    const attr = getInheritedAttribute('i3', tokens);
    expect(attr).toBe('water');
  });

  it('左隣のトークンが多色の場合は一番上の属性を継承すること', () => {
    const tokens = [
      { id: 't1', instanceId: 'i1', attributes: ['wood', 'light'] },
      { id: 'target', instanceId: 'i2', attributes: [] }
    ];
    const attr = getInheritedAttribute('i2', tokens);
    expect(attr).toBe('wood');
  });

  it('最左（一番左端）にあるときは無属性（null）を返すこと', () => {
    const tokens = [
      { id: 'target', instanceId: 'i1', attributes: [] },
      { id: 't2', instanceId: 'i2', attributes: ['water'] }
    ];
    const attr = getInheritedAttribute('i1', tokens);
    expect(attr).toBeNull();
  });

  it('左にトークンがあるが無属性（attributesが空）の場合は無属性（null）を返すこと', () => {
    const tokens = [
      { id: 't1', instanceId: 'i1', attributes: ['fire'] },
      { id: 't2', instanceId: 'i2', attributes: [] }, // 無属性
      { id: 'target', instanceId: 'i3', attributes: [] }
    ];
    const attr = getInheritedAttribute('i3', tokens);
    expect(attr).toBeNull();
  });
});
