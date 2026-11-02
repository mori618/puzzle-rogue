/**
 * ビルド拡張トークン（縦一列・色ローテーション・余白・借金・ハート電池・持ち越し・鏡写し・
 * 特殊ドロップ融合・呪印・導火線）と、新しい二つ名（王手の・帳尻師・債務者）のテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PuzzleEngine } from './engine/PuzzleEngine.js';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { PREFIX_TITLES, SUFFIX_TITLES } from './constants/titles.js';
import { buildEffectiveTokens, resolveCopiedToken, getRearguardTargetIndex } from './utils/effectiveTokens.js';
import { getDebtCreditLimit, canAffordWithCredit, isTokenRequirementMet } from './utils/tokenUtils.js';
import { evaluateTitleWhen, getTitlePerCount, getExactClearStars, getClearOvershootRatio, computeTitleComboModifiers } from './utils/titleManager.js';

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

const base = (id) => ALL_TOKEN_BASES.find(t => t.id === id);
const make = (id, extra = {}) => ({ ...base(id), level: 1, instanceId: `${id}_${extra.n ?? 0}`, ...extra });

describe('ビルド拡張トークンの定義', () => {
  const NEW_IDS = [
    'col_slash_combo', 'col_double_mult', 'col_thunder_plus', 'color_shift', 'same_color_streak',
    'empty_slot_beauty', 'devil_loan', 'heart_charge', 'heart_conversion', 'time_bank', 'time_release',
    'mirror_pair', 'rearguard_stance', 'meteor_bomb', 'rebirth_fuse', 'curse_engraver', 'fuse_line',
  ];

  it('17種すべてが定義されている', () => {
    NEW_IDS.forEach(id => expect(base(id), id).toBeTruthy());
  });

  it('時の解放は時の貯金箱、導火線はムーブドロップを持っていないとショップに出ない', () => {
    expect(isTokenRequirementMet(base('time_release'), [])).toBe(false);
    expect(isTokenRequirementMet(base('time_release'), [make('time_bank')])).toBe(true);
    expect(isTokenRequirementMet(base('fuse_line'), [])).toBe(false);
    expect(isTokenRequirementMet(base('fuse_line'), [make('move_drop')])).toBe(true);
  });
});

describe('buildEffectiveTokens（コピー・先導・殿・呪印）', () => {
  it('コピー系も複製も無ければ、そのままの一覧を返す', () => {
    const tokens = [make('power_up'), make('fired')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.map(t => t.id)).toEqual(['power_up', 'fired']);
  });

  it('合わせ鏡はパッシブ欄の右隣（間にアクティブがあっても）をコピーする', () => {
    const tokens = [make('mirror_pair'), make('fired'), make('forbidden')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result[0].effect).toBe('forbidden');
    expect(result[0].instanceId).toBe('mirror_pair_0');
    expect(result[0].name).toContain('合わせ鏡');
  });

  it('パッシブ欄の最後にある合わせ鏡は何もコピーしない', () => {
    const tokens = [make('forbidden'), make('mirror_pair')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result[1].effect).toBe('copy_right');
  });

  it('「合わせ鏡・トークン・模倣の魔鏡」と並べると、真ん中のトークンが3回発動する', () => {
    const tokens = [make('mirror_pair'), make('forbidden'), make('copy_token')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.filter(t => t.effect === 'forbidden')).toHaveLength(3);
  });

  it('模倣の魔鏡もパッシブ欄の左隣をコピーする（間にアクティブがあってもよい）', () => {
    const tokens = [make('forbidden'), make('fired'), make('copy_token')];
    expect(resolveCopiedToken(tokens, tokens, 2).effect).toBe('forbidden');
  });

  it('鏡どうしが隣り合うと、お互いをコピーできない', () => {
    const tokens = [make('mirror_pair'), make('copy_token')];
    expect(resolveCopiedToken(tokens, tokens, 0)).toBeNull();
    expect(resolveCopiedToken(tokens, tokens, 1)).toBeNull();
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.map(t => t.effect)).toEqual(['copy_right', 'copy_left']);
  });

  it('殿の構えはパッシブ欄の最後のとき、1番目のパッシブをもう1回発動させる', () => {
    const tokens = [make('forbidden'), make('power_up'), make('rearguard_stance')];
    expect(getRearguardTargetIndex(tokens, tokens)).toBe(0);
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.filter(t => t.effect === 'forbidden')).toHaveLength(2);
  });

  it('殿の構えが最後でなければ発動しない', () => {
    const tokens = [make('forbidden'), make('rearguard_stance'), make('power_up')];
    expect(getRearguardTargetIndex(tokens, tokens)).toBe(-1);
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.filter(t => t.effect === 'forbidden')).toHaveLength(1);
  });

  it('アクティブはパッシブ欄の並びに入らない（最後がアクティブでも殿は発動する）', () => {
    const tokens = [make('forbidden'), make('rearguard_stance'), make('fired')];
    expect(getRearguardTargetIndex(tokens, tokens)).toBe(0);
  });

  it('殿の構えの対象が先導なら、先導の複製が2回になる（同属性パッシブが3回発動）', () => {
    const tokens = [make('lead_fire'), make('passive_contract_fire'), make('rearguard_stance')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.filter(t => t.effect === 'element_contract')).toHaveLength(3);
  });

  it('殿の構えが無ければ先導は1回分の複製（2回発動）', () => {
    const tokens = [make('lead_fire'), make('passive_contract_fire')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.filter(t => t.effect === 'element_contract')).toHaveLength(2);
  });

  it('呪印を刻まれたパッシブは curseSeal 回発動する', () => {
    const tokens = [make('forbidden', { curseSeal: 3 }), make('power_up')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens });
    expect(result.filter(t => t.effect === 'forbidden')).toHaveLength(3);
    expect(result.filter(t => t.effect === 'base_add')).toHaveLength(1);
  });

  it('試練中は何も発動しない', () => {
    const tokens = [make('forbidden')];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens, activeBuffs: [{ action: 'trial_stage_active' }] });
    expect(result).toEqual([]);
  });

  it('試練の合格中は全体がさらに2倍になる', () => {
    const tokens = [make('forbidden', { curseSeal: 2 })];
    const result = buildEffectiveTokens({ effectTokens: tokens, tokens, activeBuffs: [{ action: 'trial_success' }] });
    expect(result).toHaveLength(4);
  });

  it('二つ名で封印されたパッシブ（effectTokens が null）は発動しない', () => {
    const tokens = [make('forbidden', { curseSeal: 2 }), make('rearguard_stance')];
    const effectTokens = [null, null];
    expect(buildEffectiveTokens({ effectTokens, tokens })).toEqual([]);
  });
});

describe('悪魔の融資（借金枠）', () => {
  it('融資トークンのレベルに応じた借金枠を返す', () => {
    expect(getDebtCreditLimit([])).toBe(0);
    expect(getDebtCreditLimit([make('devil_loan')])).toBe(50);
    expect(getDebtCreditLimit([make('devil_loan', { level: 3 })])).toBe(200);
    expect(getDebtCreditLimit([null, make('devil_loan', { level: 2 })])).toBe(100);
  });

  it('借金枠の範囲内なら買える', () => {
    expect(canAffordWithCredit(10, 20, 0)).toBe(false);
    expect(canAffordWithCredit(10, 20, 50)).toBe(true);
    expect(canAffordWithCredit(10, 60, 50)).toBe(true);  // 10 - 60 = -50
    expect(canAffordWithCredit(10, 61, 50)).toBe(false); // -51
    expect(canAffordWithCredit(-50, 1, 50)).toBe(false);
  });
});

describe('新しい二つ名', () => {
  const find = (id) => [...PREFIX_TITLES, ...SUFFIX_TITLES].find(t => t.id === id);

  it('王手の・帳尻師・債務者が定義されている', () => {
    expect(find('A63').name).toBe('王手の');
    expect(find('B65').name).toBe('帳尻師');
    expect(find('B66').name).toBe('債務者');
  });

  it('王手の: 目標達成率80%以上で最終倍率1.5倍', () => {
    const effects = find('A63').effects;
    expect(computeTitleComboModifiers({ goalProgress: 0.8 }, effects).finalMult).toBeCloseTo(1.5);
    expect(computeTitleComboModifiers({ goalProgress: 0.79 }, effects).finalMult).toBeCloseTo(1);
    expect(evaluateTitleWhen({ progress_ge: 0.8 }, { goalProgress: 0.9 })).toBe(true);
  });

  it('債務者: 所持スターがマイナスの間だけ最終倍率1.5倍', () => {
    const effects = find('B66').effects;
    expect(computeTitleComboModifiers({ stars: -1 }, effects).finalMult).toBeCloseTo(1.5);
    expect(computeTitleComboModifiers({ stars: 0 }, effects).finalMult).toBeCloseTo(1);
    expect(effects.some(e => e.type === 'debt_interest' && e.value === 0.1)).toBe(true);
  });

  it('帳尻師: 超過が少ないほど多くのスター（超過10%を超えると0）', () => {
    expect(getClearOvershootRatio(110, 100)).toBeCloseTo(0.1);
    expect(getExactClearStars(100, 100, 30)).toBe(30);
    expect(getExactClearStars(105, 100, 30)).toBe(15);
    expect(getExactClearStars(110, 100, 30)).toBe(1);
    expect(getExactClearStars(111, 100, 30)).toBe(0);
    expect(getExactClearStars(100, 100, 0)).toBe(0);
  });

  it('所持スター数で数える二つ名は、借金（マイナス）を0として扱う', () => {
    expect(getTitlePerCount('stars_10', { stars: -50 })).toBe(0);
    expect(getTitlePerCount('stars_100', { stars: -500 })).toBe(0);
    expect(getTitlePerCount('stars_10', { stars: 55 })).toBe(5);
  });
});

// ------------------------------------------------------------
// エンジン
// ------------------------------------------------------------
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

/** 揃わない市松模様（雨/ハート）にする */
function setCheckerboard(engine) {
  engine.state.forEach((row, r) => row.forEach((orb, c) => {
    if (!orb) return;
    orb.type = (r + c) % 2 === 0 ? 'water' : 'heart';
    orb.isBomb = false; orb.isRepeat = false; orb.isStar = false; orb.isEnhanced = false;
  }));
}

async function runProcess(engine) {
  engine.process();
  await vi.advanceTimersByTimeAsync(15000);
}

describe('エンジン: 縦一列・ボム・ムーブドロップの通過マス', () => {
  let engine;
  beforeEach(() => {
    vi.useFakeTimers();
    engine = createEngine();
  });
  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = '';
  });

  it('縦一列消しの列番号が onTurnEnd の extraStats に渡される', async () => {
    setCheckerboard(engine);
    for (let r = 0; r < 5; r++) engine.state[r][0].type = 'light';
    await runProcess(engine);
    expect(engine.onTurnEnd).toHaveBeenCalled();
    const args = engine.onTurnEnd.mock.calls[0];
    expect(args[4]).toContain('column');
    expect(args[10].erasedColumnInfos.some(info => info.c === 0)).toBe(true);
  });

  it('makeColumnPlus は指定した列だけをプラスドロップにする', () => {
    setCheckerboard(engine);
    engine.makeColumnPlus(2, 3);
    let inCol = 0; let others = 0;
    engine.state.forEach(row => row.forEach(orb => {
      if (!orb?.isEnhanced) return;
      if (orb.c === 2) inCol++; else others++;
    }));
    expect(inCol).toBe(3);
    expect(others).toBe(0);
  });

  it('convertCellsToBomb は指定したマスのドロップを色を変えずにボムにする', () => {
    setCheckerboard(engine);
    const before = engine.state[1][2].type;
    engine.convertCellsToBomb(['1,2', '3,4']);
    expect(engine.state[1][2].isBomb).toBe(true);
    expect(engine.state[1][2].type).toBe(before);
    expect(engine.state[3][4].isBomb).toBe(true);
    expect(engine.state[0][0].isBomb).toBe(false);
  });

  it('処理中の盤面操作は処理後にまとめて適用される', () => {
    setCheckerboard(engine);
    engine.processing = true;
    engine.convertCellsToBomb(['0,0']);
    expect(engine.state[0][0].isBomb).toBe(false);
    engine.processing = false;
    engine._flushPendingBoardOps();
    expect(engine.state[0][0].isBomb).toBe(true);
  });

  it('輪廻の火種（確率100%）: ボムに巻き込まれたリピートは消えずにボムになる', async () => {
    setCheckerboard(engine);
    engine.setRealtimeBonuses({ ...engine.realtimeBonuses, repeat_to_bomb: 1 });
    [0, 1, 2].forEach(c => { engine.state[0][c].type = 'fire'; });
    engine.state[0][0].isBomb = true;
    const repeatOrb = engine.state[4][5];
    repeatOrb.type = 'fire';
    repeatOrb.isRepeat = true;
    await runProcess(engine);
    expect(repeatOrb.isRepeat).toBe(false);
    expect(repeatOrb.isBomb).toBe(true);
  });

  it('流星爆弾: ボムに巻き込まれたスタードロップからも倍率付きで★を獲得する', async () => {
    setCheckerboard(engine);
    engine.setRealtimeBonuses({ ...engine.realtimeBonuses, bomb_star_mult: 3 });
    [0, 1, 2].forEach(c => { engine.state[0][c].type = 'fire'; });
    engine.state[0][0].isBomb = true;
    const starOrb = engine.state[2][3];
    starOrb.type = 'fire';
    starOrb.isStar = true;
    await runProcess(engine);
    expect(engine.onStarErase).toHaveBeenCalledWith(3);
  });

  it('流星爆弾が無ければ、ボムに巻き込まれたスターで★は増えない（従来どおり）', async () => {
    setCheckerboard(engine);
    [0, 1, 2].forEach(c => { engine.state[0][c].type = 'fire'; });
    engine.state[0][0].isBomb = true;
    const starOrb = engine.state[2][3];
    starOrb.type = 'fire';
    starOrb.isStar = true;
    await runProcess(engine);
    expect(engine.onStarErase).not.toHaveBeenCalledWith(1);
  });

  it('ムーブドロップが通ったマスを記録する', () => {
    const orb = engine.state[1][1];
    orb.isMoveDrop = true;
    engine.moveDropPath = new Set();
    engine._recordMoveDropPath(orb);
    orb.r = 1; orb.c = 2;
    engine._recordMoveDropPath(orb);
    engine._recordMoveDropPath(engine.state[0][0]); // ムーブドロップでないものは記録しない
    expect([...engine.moveDropPath].sort()).toEqual(['1,1', '1,2']);
  });
});
