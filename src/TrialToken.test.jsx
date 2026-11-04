/**
 * 試練トークンのテスト
 * - 発動時に盤面を10コンボ盤面に変える
 * - 試練のターン中は試練以外のバフの効果が止まり、残り手番も減らない
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PuzzleEngine } from './engine/PuzzleEngine.js';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { TRIAL_BOARD_COMBOS, TRIAL_TIME_LIMIT_MS } from './constants/gameConstants.js';
import { getBuffsInEffect, decrementBuffDurations, isTrialStageActive } from './utils/effectiveTokens.js';

class MockAudioContext {
  createOscillator() {
    return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } };
  }
  createGain() {
    return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } };
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
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.load = () => {};

function createEngine(overrides = {}) {
  const container = document.createElement('div');
  const timerBar = document.createElement('div');
  const comboEl = document.createElement('div');
  document.body.appendChild(container);
  container.getBoundingClientRect = () => ({ width: 360, height: 300, left: 0, top: 0 });
  const engine = new PuzzleEngine(container, timerBar, comboEl, {
    rows: 5, cols: 6, timeLimit: 5000, minMatchLength: 3,
    onTurnEnd: vi.fn(), onCombo: vi.fn(), onPassiveTrigger: vi.fn(), onStarErase: vi.fn(),
    totalMoveTimeRef: { current: 0 },
    ...overrides,
  });
  engine.init();
  return engine;
}

const countTypes = (engine) => {
  const counts = {};
  engine.state.forEach(row => row.forEach(orb => { counts[orb.type] = (counts[orb.type] || 0) + 1; }));
  return counts;
};

// 各属性の個数から、理論上組めるコンボ数（3個1組）を数える
const theoreticalCombos = (counts) => Object.values(counts).reduce((sum, n) => sum + Math.floor(n / 3), 0);

describe('試練トークンの定義', () => {
  it('説明文に10コンボ盤面・操作5秒・バフ停止が書かれている', () => {
    const trial = ALL_TOKEN_BASES.find(t => t.id === 'trial');
    expect(trial.desc).toContain('10コンボ盤面');
    expect(trial.desc).toContain('5秒');
    expect(trial.desc).toContain('バフ');
  });

  it('定数が仕様どおり', () => {
    expect(TRIAL_BOARD_COMBOS).toBe(10);
    expect(TRIAL_TIME_LIMIT_MS).toBe(5000);
  });
});

describe('エンジン: 10コンボ盤面', () => {
  let engine;
  beforeEach(() => {
    vi.useFakeTimers();
    engine = createEngine();
  });
  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = '';
  });

  it('5属性×6個の盤面になり、理論上ちょうど10コンボ', () => {
    engine.changeBoardToComboCount(10);
    const counts = countTypes(engine);
    expect(counts).toEqual({ fire: 6, water: 6, wood: 6, light: 6, dark: 6 });
    expect(theoreticalCombos(counts)).toBe(10);
  });

  it('特殊ドロップの印が外れる', () => {
    engine.makeAllOrbsStarPlusRepeat();
    engine.state[0][0].isBomb = true;
    engine.changeBoardToComboCount(10);
    engine.state.forEach(row => row.forEach(orb => {
      expect(orb.isStar).toBe(false);
      expect(orb.isRepeat).toBe(false);
      expect(orb.isEnhanced).toBe(false);
      expect(orb.isBomb).toBe(false);
      expect(orb.el.querySelector('.star-mark, .repeat-mark, .enhanced-mark, .bomb-mark')).toBeNull();
    }));
  });

  it('休暇モード（3属性）でも理論上10コンボ', () => {
    engine.vacationMode = true;
    engine.changeBoardToComboCount(10);
    const counts = countTypes(engine);
    expect(Object.keys(counts).sort()).toEqual(['fire', 'water', 'wood']);
    expect(theoreticalCombos(counts)).toBe(10);
  });
});

describe('試練中のバフ', () => {
  const trialBuff = { action: 'trial_stage_active', duration: 1 };
  const skyfall = { action: 'skyfall', duration: 2, params: { colors: ['light'], weight: 3 } };
  const comboBonus = { action: 'skill_combo_bonus', duration: 1, params: { value: 60 } };

  it('試練中でなければバフはそのまま効く', () => {
    const buffs = [skyfall, comboBonus];
    expect(isTrialStageActive(buffs)).toBe(false);
    expect(getBuffsInEffect(buffs)).toBe(buffs);
  });

  it('試練中は試練以外のバフの効果が止まる', () => {
    const buffs = [skyfall, comboBonus, trialBuff];
    expect(getBuffsInEffect(buffs)).toEqual([trialBuff]);
  });

  it('試練中は試練以外のバフの残り手番が減らず、試練のバフだけが切れる', () => {
    const next = decrementBuffDurations([skyfall, comboBonus, trialBuff]);
    expect(next).toEqual([skyfall, comboBonus]);
    expect(isTrialStageActive(next)).toBe(false);
  });

  it('試練合格のバフは試練中でも通常どおり減る', () => {
    const success = { action: 'trial_success', duration: 2 };
    const next = decrementBuffDurations([skyfall, trialBuff, success]);
    expect(next).toEqual([skyfall, { ...success, duration: 1 }]);
  });

  it('試練中でなければ全バフの残り手番が1減る', () => {
    const next = decrementBuffDurations([skyfall, comboBonus]);
    expect(next).toEqual([{ ...skyfall, duration: 1 }]);
  });
});
