import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { getTokenDescription, isPlayToken } from './utils/tokenUtils.js';
import {
  FISH_TABLE, FISH_SIZE_RANGE, rollFishSize, getFishSizeClass, scaleRewards, formatFishSize, rollBigFish, fishRecordKey,
  judgeDemonRound, pickDemonMove, getDemonRewards, DEMON_WIN_CHARGE,
  getPrecisionTargetResult, TARGET_CORE_RADIUS,
  countDuoTap, getDuoMashRewards,
  getDoubleDiceRewards, getDiceRewards,
  judgeHighLow, getHighLowRewards, dealHighLow,
  createRunnerState, runnerJump, stepRunner, runnerMeters, getRunningRewards, RUNNER,
  isAllPenalty, EXTRA_MINIGAME_TITLES,
} from './utils/minigames.js';
import MinigameModal from './MinigameModal.jsx';
import { resetTitleCache, saveTitleState } from './utils/titleManager.js';

const findBase = (id) => ALL_TOKEN_BASES.find(t => t.id === id);
const IDS = ['minigame_fishing_big', 'minigame_demon', 'minigame_target_pro', 'minigame_mash_duo', 'minigame_dice_duo', 'minigame_highlow', 'minigame_running'];

describe('★2 強化版ミニゲームの定義', () => {
  it.each(IDS)('%s: ★2のアクティブで遊び系、ダイアログのタイトルがある', (id) => {
    const t = findBase(id);
    expect(t).toBeDefined();
    expect(t.type).toBe('skill');
    expect(t.rarity).toBe(2);
    expect(t.action).toBe(id);
    expect(isPlayToken(t)).toBe(true);
    expect(EXTRA_MINIGAME_TITLES[id.replace('minigame_', '')]).toBeTruthy();
  });

  it('釣り・的当ての通常版は★1', () => {
    expect(findBase('minigame_fishing').rarity).toBe(1);
    expect(findBase('minigame_target').rarity).toBe(1);
  });

  it('説明文のレベル別置換', () => {
    expect(getTokenDescription({ ...findBase('minigame_target_pro'), level: 3 }, 3)).toContain('×15');
    expect(getTokenDescription({ ...findBase('minigame_demon'), level: 2 }, 2)).toContain('×4');
  });
});

describe('大物釣り', () => {
  it('全ての魚にサイズの範囲がある', () => {
    FISH_TABLE.forEach(f => expect(FISH_SIZE_RANGE[f.id], f.id).toBeDefined());
  });
  it('サイズは範囲内に収まり、ボーナスで大きくなる', () => {
    const lo = rollFishSize('tuna', 0, () => 0);
    const hi = rollFishSize('tuna', 0, () => 0.999999);
    expect(lo.cm).toBe(80);
    expect(hi.cm).toBeLessThanOrEqual(300);
    expect(rollFishSize('tuna', 0.5, () => 0).rank).toBeCloseTo(0.5);
  });
  it('サイズ区分', () => {
    expect(getFishSizeClass(0.1).id).toBe('small');
    expect(getFishSizeClass(0.97).id).toBe('monster');
  });
  it('大きいほど良い効果も代償も強くなる', () => {
    expect(scaleRewards([{ type: 'stars_add', value: 15 }], 2)).toEqual([{ type: 'stars_add', value: 30 }]);
    expect(scaleRewards([{ type: 'stars_mult', value: 2 }], 2.5)[0].value).toBe(3.5);
    expect(scaleRewards([{ type: 'mult', value: 0.5, duration: 2 }], 1.3)[0].value).toBeCloseTo(0.35);
    expect(scaleRewards([{ type: 'mult', value: 0.5, duration: 2 }], 2.5)[0].value).toBe(0.25);
    expect(scaleRewards([{ type: 'stars_add', value: -15 }], 2)[0].value).toBe(-30);
    expect(scaleRewards([{ type: 'energy', value: 99 }], 0.7)[0].value).toBe(99);
    expect(scaleRewards([{ type: 'token', rarity: 2 }], 1.8)[0].rarity).toBe(3);
  });
  it('サイズ表示', () => {
    expect(formatFishSize(56)).toBe('56cm');
    expect(formatFishSize(150)).toBe('1.5m');
    expect(formatFishSize(300)).toBe('3m');
  });
  it('rollBigFish は魚・サイズ・報酬を返す', () => {
    const r = rollBigFish(0);
    expect(FISH_TABLE).toContain(r.fish);
    expect(r.cm).toBeGreaterThan(0);
    expect(Array.isArray(r.rewards)).toBe(true);
    expect(fishRecordKey('tuna')).toBe('fish_max_tuna');
  });
});

describe('デーモン', () => {
  it('チャージ中の相手に攻撃を当てたら勝ち', () => {
    expect(judgeDemonRound('attack', 'charge', 1, 0).winner).toBe('player');
    expect(judgeDemonRound('charge', 'attack', 0, 1).winner).toBe('demon');
  });
  it('攻撃は1チャージ消費。防御・相殺では決着しない', () => {
    const r = judgeDemonRound('attack', 'guard', 2, 0);
    expect(r).toEqual({ player: 1, demon: 0, winner: null });
    expect(judgeDemonRound('attack', 'attack', 1, 1)).toEqual({ player: 0, demon: 0, winner: null });
  });
  it('5チャージで勝ち、同時なら引き分け', () => {
    expect(judgeDemonRound('charge', 'guard', DEMON_WIN_CHARGE - 1, 0).winner).toBe('player');
    expect(judgeDemonRound('guard', 'charge', 0, DEMON_WIN_CHARGE - 1).winner).toBe('demon');
    expect(judgeDemonRound('charge', 'charge', 4, 4).winner).toBe('draw');
  });
  it('デーモンはチャージ0では攻撃しない', () => {
    for (let i = 0; i < 50; i++) expect(pickDemonMove(0, 3)).not.toBe('attack');
  });
  it('報酬', () => {
    expect(getDemonRewards('player', 4)).toContainEqual({ type: 'mult', value: 4, duration: 3 });
    expect(isAllPenalty(getDemonRewards('demon', 4))).toBe(true);
  });
});

describe('精密射撃', () => {
  it('真芯は小さく、当たると最強の効果', () => {
    const core = getPrecisionTargetResult(TARGET_CORE_RADIUS, 3, 10);
    expect(core.id).toBe('core');
    expect(core.rewards).toContainEqual({ type: 'mult', value: 10, duration: 3 });
    expect(getPrecisionTargetResult(0.1, 3, 10).id).toBe('bullseye');
    expect(getPrecisionTargetResult(1.05, 3, 10).rewards).toContainEqual({ type: 'stars_add', value: -25 });
  });
});

describe('交互連打', () => {
  it('同じボタンの連続は数えない', () => {
    expect(countDuoTap(null, 'left')).toBe(true);
    expect(countDuoTap('left', 'left')).toBe(false);
    expect(countDuoTap('left', 'right')).toBe(true);
  });
  it('回数に応じた報酬', () => {
    expect(isAllPenalty(getDuoMashRewards(10, 0.5))).toBe(true);
    expect(getDuoMashRewards(90, 0.5).map(r => r.type)).toEqual(['combo_add', 'energy', 'mult', 'levelup']);
  });
});

describe('ダブルダイス', () => {
  it('ゾロ目でないときは2つの目の効果', () => {
    expect(getDoubleDiceRewards(3, 4)).toEqual([...getDiceRewards(3), ...getDiceRewards(4)]);
  });
  it('悪い目のゾロ目は反転して良い効果になる', () => {
    expect(isAllPenalty(getDoubleDiceRewards(1, 1))).toBe(false);
    expect(getDoubleDiceRewards(1, 1)).toContainEqual({ type: 'stars_mult', value: 2 });
    expect(getDoubleDiceRewards(2, 2).some(r => r.type === 'mult' && r.value < 1)).toBe(false);
  });
  it('6のゾロ目は大当たり', () => {
    expect(getDoubleDiceRewards(6, 6)).toContainEqual({ type: 'mult', value: 5, duration: 3 });
  });
  it('目は1つずつ決まる', () => {
    vi.useFakeTimers();
    try {
      const state = { type: 'dice_duo', level: 1, values: [0, 1, 2], tokenName: 'ダブルダイス', resolved: false };
      const onResolve = vi.fn();
      render(<MinigameModal state={state} onResolve={onResolve} onClose={() => {}} />);
      fireEvent.click(screen.getByTestId('dice-roll'));
      act(() => { vi.advanceTimersByTime(750); });
      expect(screen.getByTestId('dice-face-0').textContent).not.toBe('🎲');
      expect(screen.getByTestId('dice-face-1').textContent).toBe('🎲');
      act(() => { vi.advanceTimersByTime(2000); });
      expect(onResolve).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('ハイアンドロー', () => {
  it('判定', () => {
    const hand = { player: [5, 6], dealer: [3, 4] };
    expect(judgeHighLow(hand, 'high')).toBe('win');
    expect(judgeHighLow(hand, 'low')).toBe('lose');
    expect(judgeHighLow({ player: [5, 5], dealer: [3, 7] }, 'high')).toBe('draw');
  });
  it('カードは1〜10', () => {
    for (let i = 0; i < 30; i++) {
      const h = dealHighLow();
      [...h.player, ...h.dealer].forEach(c => { expect(c).toBeGreaterThanOrEqual(1); expect(c).toBeLessThanOrEqual(10); });
    }
  });
  it('連勝数で報酬が積み上がる', () => {
    expect(getHighLowRewards(0, 10)).toEqual([]);
    expect(getHighLowRewards(1, 10)).toEqual([{ type: 'combo_add', value: 10, duration: 3 }]);
    expect(getHighLowRewards(4, 10)).toContainEqual({ type: 'mult', value: 3, duration: 3 });
  });
  it('勝ったあとに負けると積み上げを全て失う（悪い結果として扱う）', () => {
    vi.useFakeTimers();
    const orig = Math.random;
    try {
      // 1回目: 自分 10+10 / 相手 1+1 → ハイで勝ち。2回目: 自分 1+1 / 相手 10+10 → ハイで負け
      const seq = [0.99, 0.99, 0, 0, 0, 0, 0.99, 0.99];
      Math.random = () => seq.shift() ?? 0.5;
      const state = { type: 'highlow', level: 1, values: [8, 12, 16], tokenName: 'ハイアンドロー', resolved: false };
      const onResolve = vi.fn();
      render(<MinigameModal state={state} onResolve={onResolve} onClose={() => {}} />);
      fireEvent.click(screen.getByTestId('highlow-high'));
      act(() => { vi.advanceTimersByTime(1500); });
      expect(screen.getByTestId('highlow-wins').textContent).toBe('1');
      fireEvent.click(screen.getByTestId('highlow-continue'));
      fireEvent.click(screen.getByTestId('highlow-high'));
      act(() => { vi.advanceTimersByTime(1500); });
      expect(onResolve).toHaveBeenCalledWith([], expect.objectContaining({ wins: 1, lost: true, bad: true }));
    } finally {
      Math.random = orig;
      vi.useRealTimers();
    }
  });
});

describe('ランニング', () => {
  it('ジャンプは地面にいるときだけ', () => {
    const s = runnerJump(createRunnerState());
    expect(s.vy).toBe(RUNNER.jumpVelocity);
    const air = stepRunner(s, 16, 300);
    expect(air.y).toBeGreaterThan(0);
    expect(runnerJump(air).vy).toBe(air.vy);
  });
  it('障害物に当たると終了する', () => {
    const s = { ...createRunnerState(), obstacles: [{ x: RUNNER.playerX + 5, h: 30 }], nextSpawnMs: 9999 };
    expect(stepRunner(s, 16, 300).over).toBe(true);
  });
  it('ジャンプすれば障害物を越えられる', () => {
    let s = runnerJump({ ...createRunnerState(), obstacles: [{ x: RUNNER.playerX + RUNNER.playerSize + 20, h: 28 }], nextSpawnMs: 99999 });
    for (let i = 0; i < 20; i++) s = stepRunner(s, 16, 300);
    expect(s.over).toBe(false);
  });
  it('距離に応じた報酬', () => {
    expect(isAllPenalty(getRunningRewards(30, 1))).toBe(true);
    expect(getRunningRewards(100, 1)).toEqual([{ type: 'combo_add', value: 10, duration: 3 }]);
    expect(getRunningRewards(1000, 2)).toContainEqual({ type: 'mult', value: 5, duration: 3 });
    expect(runnerMeters({ distancePx: RUNNER.pxPerMeter * 123 })).toBe(123);
  });
});

describe('大物釣りの記録表示', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });
  it('保存されている最大サイズを表示する', () => {
    saveTitleState({ unlockedTitles: { prefixes: [], suffixes: [], evolved: [] }, equippedTitle: {}, progress: { [fishRecordKey('tuna')]: 256 } });
    const state = { type: 'fishing_big', level: 1, values: [0, 0.15, 0.3], tokenName: '大物釣り', resolved: false };
    render(<MinigameModal state={state} onResolve={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('fishing-records-toggle'));
    expect(screen.getByTestId('fishing-records').textContent).toContain('2.56m');
  });
});

afterEach(() => {
  vi.useRealTimers();
});
