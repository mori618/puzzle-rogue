/**
 * プレイログの指摘への修正のテスト
 * - 呪い「絶望の癒し」: ハートのコンボをリアルタイム表示から除く
 * - リピート連鎖などで消去が多いときの自動早送り
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PuzzleEngine } from './engine/PuzzleEngine.js';

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
  engine.noSkyfall = true;
  return engine;
}

// 3個並びができない盤面（4色を斜めにずらして並べる）
function setNoMatchBoard(engine) {
  const colors = ['fire', 'water', 'wood', 'dark'];
  engine.state.forEach((row, r) => row.forEach((orb, c) => {
    if (!orb) return;
    orb.type = colors[(r * 2 + c) % 4];
    orb.isBomb = false; orb.isRepeat = false; orb.isStar = false; orb.isEnhanced = false;
  }));
}

async function runProcess(engine) {
  engine.process();
  await vi.advanceTimersByTimeAsync(60000);
}

describe('呪い「絶望の癒し」: ハートのコンボ表示', () => {
  let engine;
  beforeEach(() => {
    vi.useFakeTimers();
    engine = createEngine();
    setNoMatchBoard(engine);
    // 1段目にハート3個、2段目に光3個を並べる（2コンボ）
    for (let c = 0; c < 3; c++) engine.state[0][c].type = 'heart';
    for (let c = 3; c < 6; c++) engine.state[1][c].type = 'light';
  });
  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = '';
  });

  it('呪いが無ければハートもコンボに数える', async () => {
    await runProcess(engine);
    const args = engine.onTurnEnd.mock.calls[0];
    expect(args[0]).toBe(2);
    expect(args[1].heart).toBe(1);
    expect(args[10].cursedComboRemoved).toBe(0);
  });

  it('呪い中はハートのコンボを表示の時点から数えない', async () => {
    engine.setNoComboColors(['heart']);
    const shown = [];
    engine.onCombo = (n) => shown.push(n);
    await runProcess(engine);
    const args = engine.onTurnEnd.mock.calls[0];
    expect(args[0]).toBe(1);
    expect(Math.max(...shown)).toBe(1);
    // ハートを消したこと自体は記録する（解除条件や統計に使う）
    expect(args[1].heart).toBe(1);
    expect(args[10].cursedComboRemoved).toBe(1);
  });
});

describe('消去が多いターンの自動早送り', () => {
  let engine;
  beforeEach(() => {
    vi.useFakeTimers();
    engine = createEngine();
  });
  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = '';
  });

  it('リピート連鎖で消去回数が20回を超えると自動で早送りになり、ターン終了で解除される', async () => {
    setNoMatchBoard(engine);
    for (let c = 0; c < 3; c++) {
      engine.state[0][c].type = 'light';
      engine.state[0][c].isRepeat = true;
    }
    // リピート回数を増やして25回消去させる
    engine.setRealtimeBonuses({ extra_repeat_activations: 21, tokenIds: { extra_repeat_activations: [] } });
    let fastSeen = false;
    engine.onCombo = () => { if (engine.autoFastForward && engine.isFastForward) fastSeen = true; };
    await runProcess(engine);
    expect(engine.onTurnEnd).toHaveBeenCalled();
    expect(engine.clearsThisTurn).toBeGreaterThan(20);
    expect(fastSeen).toBe(true);
    expect(engine.autoFastForward).toBe(false);
    expect(engine.isFastForward).toBe(false);
  });

  it('消去が少なければ自動早送りにならない', async () => {
    setNoMatchBoard(engine);
    for (let c = 0; c < 3; c++) engine.state[0][c].type = 'light';
    let fastSeen = false;
    engine.onCombo = () => { if (engine.isFastForward) fastSeen = true; };
    await runProcess(engine);
    expect(fastSeen).toBe(false);
  });
});
