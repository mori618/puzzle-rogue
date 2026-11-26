/**
 * 虹ドロップの挙動テスト
 *
 * - 全色の代わりになる（ワイルド）
 * - 1グループに使われるごとにカウント -1、0 で消える。複数の色に同時に使われたら、その数だけ減る
 * - 虹ドロップだけで揃えたときは 1 コンボで、全カウントを使い切ってまとめて消える（6色ぶん重複しない）
 * - 試練中（特殊ドロップ停止）はどの色とも揃わない
 * - ボム・リピート・スター・プラスを兼ねない
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PuzzleEngine } from './engine/PuzzleEngine.js';
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
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};

const COLORS = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
const MATCH_CLASSES = ['orb-matching', 'orb-matching-len4', 'orb-matching-row', 'orb-matching-cross', 'orb-matching-l-shape', 'orb-matching-square', 'orb-matching-len5'];

function createEngine(overrides = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  container.getBoundingClientRect = () => ({ width: 360, height: 300, left: 0, top: 0 });
  const engine = new PuzzleEngine(container, document.createElement('div'), document.createElement('div'), {
    rows: 5, cols: 6, timeLimit: 5000, minMatchLength: 3,
    onTurnEnd: vi.fn(), onCombo: vi.fn(), onPassiveTrigger: vi.fn(), onStarErase: vi.fn(),
    totalMoveTimeRef: { current: 0 },
    ...overrides,
  });
  engine.init();
  return engine;
}

/** 揃いのない盤面にする（横も縦も同じ色が並ばない） */
function setNoMatchBoard(engine) {
  engine.state.forEach((row, r) => row.forEach((orb, c) => {
    orb.type = COLORS[(c + 2 * r) % 6];
    orb.isRainbow = false; orb.isBomb = false; orb.isRepeat = false; orb.isStar = false; orb.isEnhanced = false;
  }));
}
const setColor = (engine, r, c, color) => { engine.state[r][c].type = color; };
const setRainbow = (engine, r, c, count = 3) => engine._turnIntoRainbow(engine.state[r][c], count);
const allOrbs = (engine) => engine.state.flat().filter(Boolean);

async function runProcess(engine) {
  engine.process();
  await vi.advanceTimersByTimeAsync(20000);
}

describe('虹ドロップ: トークン', () => {
  it('虹ドロップのトークン4種が戻っている', () => {
    ['gen_rainbow_rand', 'rainbow_masterx', 'rainbow_chance', 'rainbow_bridge'].forEach(id => {
      expect(ALL_TOKEN_BASES.find(t => t.id === id), id).toBeTruthy();
    });
  });
});

describe('虹ドロップ: 揃い判定（findCombos）', () => {
  let engine;
  beforeEach(() => { vi.useFakeTimers(); engine = createEngine(); setNoMatchBoard(engine); });
  afterEach(() => { engine.destroy?.(); vi.clearAllTimers(); vi.useRealTimers(); document.body.innerHTML = ''; });

  it('揃いのない盤面ではコンボなし', () => {
    expect(engine.findCombos()).toHaveLength(0);
  });

  it('炎・虹・炎 は炎の1コンボになる', () => {
    setColor(engine, 0, 0, 'fire'); setRainbow(engine, 0, 1); setColor(engine, 0, 2, 'fire');
    const groups = engine.findCombos();
    expect(groups).toHaveLength(1);
    expect(groups[0].groupType).toBe('fire');
    expect(groups[0]).toHaveLength(3);
  });

  it('1つの虹が横の炎と縦の雨の両方に使われる', () => {
    setColor(engine, 0, 0, 'fire'); setColor(engine, 0, 1, 'fire'); setRainbow(engine, 0, 2);
    setColor(engine, 1, 2, 'water'); setColor(engine, 2, 2, 'water');
    const groups = engine.findCombos();
    expect(groups.map(g => g.groupType).sort()).toEqual(['fire', 'water']);
    groups.forEach(g => expect(g.some(o => o.isRainbow)).toBe(true));
  });

  it('虹だけの並び（横1列すべて虹）は1コンボだけ（6色ぶん重複しない）', () => {
    for (let c = 0; c < 6; c++) setRainbow(engine, 0, c);
    const groups = engine.findCombos();
    expect(groups).toHaveLength(1);
    expect(groups[0].isPureRainbow).toBe(true);
  });

  it('色つきのグループに使われた虹の並びは、虹だけのコンボとして二重に数えない', () => {
    setRainbow(engine, 0, 0); setRainbow(engine, 0, 1); setRainbow(engine, 0, 2); setColor(engine, 0, 3, 'fire');
    const groups = engine.findCombos();
    expect(groups).toHaveLength(1);
    expect(groups[0].groupType).toBe('fire');
    expect(groups[0]).toHaveLength(4);
  });

  it('ハートが消せない（呪い）ときも、虹だけの並びは別の色で1コンボになる', () => {
    engine.setNoEraseColors(['heart']);
    for (let c = 0; c < 6; c++) setRainbow(engine, 0, c);
    const groups = engine.findCombos();
    expect(groups).toHaveLength(1);
    expect(groups[0].groupType).not.toBe('heart');
  });

  it('試練中（特殊ドロップ停止）は虹がどの色とも揃わない', () => {
    engine.noSpecialEffects = true;
    setColor(engine, 0, 0, 'fire'); setRainbow(engine, 0, 1); setColor(engine, 0, 2, 'fire');
    setRainbow(engine, 2, 0); setRainbow(engine, 2, 1); setRainbow(engine, 2, 2);
    expect(engine.findCombos()).toHaveLength(0);
  });

  it('虹3つの並びの隣に色ドロップがあれば、その色の4個消しになる', () => {
    setRainbow(engine, 0, 0); setRainbow(engine, 0, 1); setRainbow(engine, 0, 2);
    const groups = engine.findCombos();
    expect(groups).toHaveLength(1);
    expect(groups[0].groupType).toBe(engine.state[0][3].type);
    expect(groups[0]).toHaveLength(4);
  });

  it('虹ドロップの type は "rainbow" で、どの色の消去・整理の対象にもならない', () => {
    setRainbow(engine, 0, 0);
    expect(engine.state[0][0].type).toBe('rainbow');
    COLORS.forEach(color => expect(engine.state[0][0].type).not.toBe(color));
  });
});

describe('虹ドロップ: 消去とカウント（process）', () => {
  let engine;
  beforeEach(() => { vi.useFakeTimers(); engine = createEngine(); setNoMatchBoard(engine); engine.noSkyfall = true; });
  afterEach(() => { engine.destroy?.(); vi.clearAllTimers(); vi.useRealTimers(); document.body.innerHTML = ''; });

  it('2色に同時に使われた虹はカウントが2減り、見えたまま盤面に残る', async () => {
    // 一番下の行で使う（消えたあと落下で新しい揃いができない配置）
    setColor(engine, 4, 0, 'fire'); setColor(engine, 4, 1, 'fire'); setRainbow(engine, 4, 2, 3);
    setColor(engine, 3, 2, 'water'); setColor(engine, 2, 2, 'water');
    const rainbow = engine.state[4][2];
    const onTurnEnd = vi.fn();
    engine.onTurnEnd = onTurnEnd;

    await runProcess(engine);

    expect(onTurnEnd).toHaveBeenCalled();
    const surviving = allOrbs(engine).filter(o => o.isRainbow);
    expect(surviving).toContain(rainbow);
    expect(rainbow.rainbowCount).toBe(1);
    // 表示の数字も合っていて、消滅アニメーションのクラスが残っていない（透明な虹が残らない）
    expect(rainbow.el.querySelector('.rainbow-count-text').innerText).toBe(1);
    MATCH_CLASSES.forEach(cls => expect(rainbow.el.classList.contains(cls), cls).toBe(false));
    expect(rainbow.el.isConnected).toBe(true);
    // 虹そのものは消えていないので、虹消去数は0
    expect(onTurnEnd.mock.calls[0][10].rainbowSelfErased).toBe(0);
  });

  it('カウント1の虹は使われると消え、虹消去数に数えられる', async () => {
    setColor(engine, 4, 0, 'fire'); setRainbow(engine, 4, 1, 1); setColor(engine, 4, 2, 'fire');
    const rainbow = engine.state[4][1];
    const onTurnEnd = vi.fn();
    engine.onTurnEnd = onTurnEnd;

    await runProcess(engine);

    expect(allOrbs(engine)).not.toContain(rainbow);
    expect(rainbow.el.isConnected).toBe(false);
    expect(onTurnEnd.mock.calls[0][10].rainbowSelfErased).toBe(1);
  });

  it('虹だけの並びは1コンボで、カウントが残っていても全部消える', async () => {
    for (let c = 0; c < 6; c++) setRainbow(engine, 4, c, c === 0 ? 5 : 3);
    const onTurnEnd = vi.fn();
    engine.onTurnEnd = onTurnEnd;

    await runProcess(engine);

    expect(allOrbs(engine).filter(o => o.isRainbow)).toHaveLength(0);
    expect(onTurnEnd.mock.calls[0][10].rainbowSelfErased).toBe(6);
    expect(onTurnEnd.mock.calls[0][0]).toBeLessThanOrEqual(3); // 1コンボ＋横1列ボーナスのみ（6色ぶん重複しない）
  });

  it('試練中は虹が揃わず、無限に消え続けない', async () => {
    engine.noSpecialEffects = true;
    setRainbow(engine, 4, 0); setRainbow(engine, 4, 1); setRainbow(engine, 4, 2);
    const onTurnEnd = vi.fn();
    engine.onTurnEnd = onTurnEnd;

    await runProcess(engine);

    expect(allOrbs(engine).filter(o => o.isRainbow)).toHaveLength(3);
  });
});

describe('虹ドロップ: 生成・変換', () => {
  let engine;
  beforeEach(() => { vi.useFakeTimers(); engine = createEngine(); setNoMatchBoard(engine); });
  afterEach(() => { engine.destroy?.(); vi.clearAllTimers(); vi.useRealTimers(); document.body.innerHTML = ''; });

  it('虹の創造: ボム等の印を外して、カウント3の虹ドロップにする', () => {
    allOrbs(engine).forEach(o => { o.isBomb = true; engine.addBombMark(o.el); });
    engine.spawnRainbowRandom(1);
    const rainbows = allOrbs(engine).filter(o => o.isRainbow);
    expect(rainbows).toHaveLength(1);
    const r = rainbows[0];
    expect(r.type).toBe('rainbow');
    expect(r.rainbowCount).toBe(3);
    expect(r.isBomb).toBe(false);
    expect(r.el.querySelector('.bomb-mark')).toBeNull();
    expect(r.el.classList.contains('orb-shape-rainbow')).toBe(true);
    expect(r.el.querySelector('.rainbow-count-text').innerText).toBe(3);
  });

  it('虹の極致: 処理中に使っても失われず、処理後に虹1つ生成＋全虹カウント5になる', () => {
    setRainbow(engine, 0, 0, 1);
    engine.processing = true;
    engine.spawnRainbowRandom(1);
    engine.setAllRainbowCounts(5);
    expect(allOrbs(engine).filter(o => o.isRainbow)).toHaveLength(1);
    engine.processing = false;
    engine._flushPendingBoardOps();
    const rainbows = allOrbs(engine).filter(o => o.isRainbow);
    expect(rainbows).toHaveLength(2);
    rainbows.forEach(o => expect(o.rainbowCount).toBe(5));
  });

  it('虹の呼び声: 降ってくる虹はボム・リピート・スターを兼ねない', () => {
    engine.setRainbowRates([{ value: 1, tokenId: 'rainbow_chance' }]);
    const all = COLORS.reduce((acc, c) => ({ ...acc, [c]: [{ value: 1, tokenId: 'x' }] }), {});
    engine.bombRates = { colors: all };
    engine.repeatRates = { colors: all };
    engine.starRates = { colors: all };
    engine.starfallChance = 1;
    engine.state[0][0].el.remove();
    engine.spawnOrb(0, 0, true);
    const orb = engine.state[0][0];
    expect(orb.isRainbow).toBe(true);
    expect(orb.type).toBe('rainbow');
    expect(orb.isBomb || orb.isRepeat || orb.isStar).toBe(false);
    expect(engine.onPassiveTrigger).toHaveBeenCalledWith('rainbow_chance');
  });

  it('保存した盤面から復元しても虹のカウントが残る（古い保存データの type "heart" も虹になる）', () => {
    engine.state[0][0].el.remove();
    engine.spawnOrb(0, 0, false, 0, { type: 'heart', isRainbow: true, rainbowCount: 2 });
    const orb = engine.state[0][0];
    expect(orb.isRainbow).toBe(true);
    expect(orb.type).toBe('rainbow');
    expect(orb.rainbowCount).toBe(2);

    setRainbow(engine, 1, 1, 4);
    const saved = engine.getState();
    expect(saved[1][1]).toMatchObject({ type: 'rainbow', isRainbow: true, rainbowCount: 4 });
  });

  it('変換スキル・なぞり変換・全強化で虹が壊れない', () => {
    setRainbow(engine, 0, 0, 3);
    const r = engine.state[0][0];
    engine.changeBoardToEnhancedColor('fire');
    engine.makeAllOrbsPlus();
    engine.makeAllOrbsStarPlus();
    engine.setFingerTransformConfig({ color: 'water', limit: 30 });
    engine.applyFingerTransform(r);
    expect(r.isRainbow).toBe(true);
    expect(r.type).toBe('rainbow');
    expect(r.isEnhanced || r.isStar).toBe(false);
    expect(r.el.querySelector('.rainbow-count-text')).not.toBeNull();
  });

  it('盤面バランス変更: 虹は残し、他のドロップは5色で埋まる', () => {
    setRainbow(engine, 0, 0, 3);
    engine.changeBoardBalanced();
    expect(engine.state[0][0].isRainbow).toBe(true);
    allOrbs(engine).filter(o => !o.isRainbow).forEach(o => {
      expect(['fire', 'water', 'wood', 'light', 'dark']).toContain(o.type);
    });
  });
});
