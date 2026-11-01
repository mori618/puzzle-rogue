/* global global */
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

// 新規ドロップは「空きマス数」ぶん盤面外へずらした位置から落ちてくるべき。
// つまり見た目上の開始位置は (最終位置 - 空きマス数) となり、全て盤面外に収まる。
describe('Skyfall spawn offset', () => {
  let container;
  let engine;
  const ROWS = 5;
  const COLS = 6;
  const CELL = 10; // orbSize + gap

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new PuzzleEngine(container, document.createElement('div'), document.createElement('div'), {
      rows: ROWS, cols: COLS, timeLimit: 5000, minMatchLength: 3,
      onTurnEnd: vi.fn(), onCombo: vi.fn(), totalMoveTimeRef: { current: 0 },
    });
    engine.init();
    engine.orbSize = 8;
    engine.gap = 2;
  });

  afterEach(() => {
    engine.destroy();
    container.remove();
    vi.useRealTimers();
  });

  const clearCells = (cells) => {
    cells.forEach(([r, c]) => {
      engine.state[r][c].el.remove();
      engine.state[r][c] = null;
    });
  };

  const parseTranslate = (el) => {
    const m = el.style.transform.match(/translate3d\((-?[\d.]+)px, (-?[\d.]+)px/);
    return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
  };

  // simultaneousGravity の render 直前（sleep 中）の初期 transform を検証する
  const runAndCaptureSpawn = async (direction, cells, pick) => {
    engine.gravityDirection = direction;
    clearCells(cells);
    const p = engine.simultaneousGravity();
    const spawned = pick().map((orb) => ({ orb, start: parseTranslate(orb.el) }));
    await vi.advanceTimersByTimeAsync(20);
    await p;
    return spawned;
  };

  it('down: 3マス空きの新規ドロップは全て -3 マスずれた位置から落下する', async () => {
    const spawned = await runAndCaptureSpawn('down', [[0, 0], [1, 0], [2, 0]],
      () => [0, 1, 2].map((r) => engine.state[r][0]));
    spawned.forEach(({ start }) => expect(start.y).toBeCloseTo(-3 * CELL));
    spawned.forEach(({ orb }, i) => expect(orb.r + parseTranslate(orb.el).y / CELL).toBeCloseTo(i));
  });

  it('up: 新規ドロップは全て +3 マスずれた位置から落下する', async () => {
    const spawned = await runAndCaptureSpawn('up', [[2, 0], [3, 0], [4, 0]],
      () => [2, 3, 4].map((r) => engine.state[r][0]));
    spawned.forEach(({ start }) => expect(start.y).toBeCloseTo(3 * CELL));
  });

  it('left: 新規ドロップは全て +2 マスずれた位置から落下する', async () => {
    const spawned = await runAndCaptureSpawn('left', [[0, 4], [0, 5]],
      () => [4, 5].map((c) => engine.state[0][c]));
    spawned.forEach(({ start }) => expect(start.x).toBeCloseTo(2 * CELL));
  });

  it('right: 新規ドロップは全て -2 マスずれた位置から落下する', async () => {
    const spawned = await runAndCaptureSpawn('right', [[0, 0], [0, 1]],
      () => [0, 1].map((c) => engine.state[0][c]));
    spawned.forEach(({ start }) => expect(start.x).toBeCloseTo(-2 * CELL));
  });
});
