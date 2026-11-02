import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PuzzleEngine } from './engine/PuzzleEngine.js';

class MockAudioContext {
  createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  createGain() { return { connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  destination = {};
  close() {}
  state = 'suspended';
  resume() { return Promise.resolve(); }
}
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

describe('ドロップ変換演出', () => {
  let container;
  let engine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = new PuzzleEngine(container, document.createElement('div'), document.createElement('div'), {
      rows: 5, cols: 6, timeLimit: 5000, minMatchLength: 3,
      onTurnEnd: vi.fn(), onCombo: vi.fn(), totalMoveTimeRef: { current: 0 },
    });
    engine.init();
  });
  afterEach(() => { engine.destroy(); container.remove(); });

  it('種類が変わったドロップに演出クラスが付き、遅延は合計0.5秒以内に収まる', async () => {
    const orbs = engine.state.flat().filter(Boolean);
    const from = orbs[0].type;
    const to = engine.types.find((t) => t !== from);
    engine.convertColor(from, to);
    await new Promise((r) => setTimeout(r, 0)); // MutationObserver の発火待ち
    const animated = container.querySelectorAll('.orb-converting');
    expect(animated.length).toBeGreaterThan(0);
    animated.forEach((el) => {
      const delay = parseInt(el.style.getPropertyValue('--convert-delay'), 10);
      const dur = parseInt(el.style.getPropertyValue('--convert-duration'), 10);
      expect(delay + dur).toBeLessThanOrEqual(500);
    });
    expect(engine.convertAnimUntil).toBeGreaterThan(Date.now() - 1);
  });

  it('種類が変わらない場合は演出しない', async () => {
    const orb = engine.state.flat().find(Boolean);
    orb.el.className = `${orb.el.className} extra`;
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelectorAll('.orb-converting').length).toBe(0);
  });
});
