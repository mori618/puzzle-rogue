import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { getTokenDescription } from './utils/tokenUtils.js';
import {
  judgeJanken, getJankenRewards, FISH_TABLE, rollFish,
  getTargetResult, getMashRewards, getDiceRewards, DICE_FACES,
  describeRewards, getLevelValue, isAllPenalty,
} from './utils/minigames.js';
import MinigameModal from './MinigameModal.jsx';

const findBase = (id) => ALL_TOKEN_BASES.find(t => t.id === id);
const IDS = ['minigame_janken', 'minigame_fishing', 'minigame_target', 'minigame_mash', 'minigame_dice'];

describe('ミニゲームトークンの定義', () => {
  it.each(IDS)('%s はアクティブスキルで action が id と一致する', (id) => {
    const t = findBase(id);
    expect(t).toBeDefined();
    expect(t.type).toBe('skill');
    expect(t.action).toBe(id);
    expect(t.cost).toBe(3);
  });

  it('説明文のレベル別置換', () => {
    expect(getTokenDescription({ ...findBase('minigame_janken'), level: 2 }, 2)).toContain('連勝数 × 7');
    expect(getTokenDescription({ ...findBase('minigame_target'), level: 3 }, 3)).toContain('×5');
    expect(getTokenDescription({ ...findBase('minigame_mash'), level: 2 }, 2)).toContain('× 0.6');
    expect(getTokenDescription({ ...findBase('minigame_dice'), level: 3 }, 3)).toContain('2回まで振り直し');
    // 釣りの説明は数値が崩れない
    const fish = getTokenDescription({ ...findBase('minigame_fishing'), level: 1 }, 1);
    expect(fish).toContain('所持スター2倍');
    expect(fish).toContain('スター-15');
    expect(fish).toContain('トークン3つLvUP');
  });
});

describe('じゃんけん', () => {
  it('勝敗判定', () => {
    expect(judgeJanken('rock', 'scissors')).toBe(1);
    expect(judgeJanken('rock', 'paper')).toBe(-1);
    expect(judgeJanken('paper', 'paper')).toBe(0);
  });
  it('連勝数に応じた報酬', () => {
    // 0連勝は代償
    expect(isAllPenalty(getJankenRewards(0, 5))).toBe(true);
    expect(getJankenRewards(1, 5)).toEqual([{ type: 'combo_add', value: 5, duration: 3 }]);
    expect(getJankenRewards(2, 5)).toEqual([{ type: 'combo_add', value: 10, duration: 3 }, { type: 'stars_add', value: 20 }]);
    expect(getJankenRewards(3, 5).map(r => r.type)).toEqual(['combo_add', 'stars_add', 'levelup']);
    expect(getJankenRewards(5, 5)).toContainEqual({ type: 'mult', value: 3, duration: 3 });
    expect(getJankenRewards(5, 5)).toContainEqual({ type: 'levelup', value: 2 });
  });
});

describe('釣り', () => {
  it('重みの合計は100', () => {
    expect(FISH_TABLE.reduce((s, f) => s + f.weight, 0)).toBe(100);
  });
  it('乱数に応じて魚が決まる', () => {
    expect(rollFish(() => 0).id).toBe(FISH_TABLE[0].id);
    expect(rollFish(() => 0.9999).id).toBe('treasure');
  });
  it('ハズレの魚は代償がある', () => {
    ['boot', 'can', 'jellyfish'].forEach(id => {
      expect(isAllPenalty(FISH_TABLE.find(f => f.id === id).rewards)).toBe(true);
    });
  });
  it('魚ごとに効果が全て異なる', () => {
    const keys = FISH_TABLE.map(f => JSON.stringify(f.rewards));
    expect(new Set(keys).size).toBe(FISH_TABLE.length);
  });
  it('宝箱は効果てんこ盛り', () => {
    const treasure = FISH_TABLE.find(f => f.id === 'treasure');
    expect(treasure.rewards.length).toBeGreaterThanOrEqual(5);
    expect(describeRewards(treasure.rewards)).toContain('エネルギー全回復');
  });
});

describe('的当て', () => {
  it('中心に近いほど良い結果', () => {
    expect(getTargetResult(0.05, 2.5).id).toBe('bullseye');
    expect(getTargetResult(0.05, 4).rewards[0]).toEqual({ type: 'mult', value: 4, duration: 3 });
    expect(getTargetResult(0.3, 2).id).toBe('inner');
    expect(getTargetResult(0.5, 2).id).toBe('middle');
    expect(getTargetResult(0.9, 2).id).toBe('outer');
    expect(isAllPenalty(getTargetResult(1.2, 2).rewards)).toBe(true);
    expect(isAllPenalty(getTargetResult(0.9, 2).rewards)).toBe(false);
  });
});

describe('連打', () => {
  it('連打数×係数（切り捨て）＋40回以上でエネルギー', () => {
    expect(isAllPenalty(getMashRewards(19, 0.4))).toBe(true);
    expect(getMashRewards(33, 0.6)).toEqual([{ type: 'combo_add', value: 19, duration: 3 }]);
    expect(getMashRewards(40, 0.4).map(r => r.type)).toEqual(['combo_add', 'energy']);
    expect(getMashRewards(55, 0.4).map(r => r.type)).toEqual(['combo_add', 'energy', 'mult']);
  });
});

describe('サイコロ', () => {
  it('全ての目に効果がある', () => {
    for (let i = 1; i <= 6; i++) expect(getDiceRewards(i).length).toBeGreaterThan(0);
    expect(isAllPenalty(getDiceRewards(1))).toBe(true);
    expect(isAllPenalty(getDiceRewards(2))).toBe(true);
    expect(getDiceRewards(6).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(DICE_FACES)).toHaveLength(6);
  });
});

describe('ユーティリティ', () => {
  it('describeRewards', () => {
    expect(describeRewards([])).toBe('何も起きない');
    expect(describeRewards([{ type: 'stars_add', value: -5 }, { type: 'levelup', value: 1 }])).toBe('スター-5 / トークン1つLvUP');
    expect(describeRewards([{ type: 'stars_mult', value: 0.5 }, { type: 'energy', value: -3 }])).toBe('スター半減 / 他スキルのエネルギー-3');
  });
  it('getLevelValue', () => {
    expect(getLevelValue([1, 2, 3], 2)).toBe(2);
    expect(getLevelValue(undefined, 2, 9)).toBe(9);
  });
});

describe('MinigameModal', () => {
  it('じゃんけん: 負けたら連勝数に応じた報酬で onResolve が呼ばれる', () => {
    const calls = [];
    const state = { type: 'janken', level: 1, values: [5, 7, 10], tokenName: 'じゃんけん', resolved: false };
    const orig = Math.random;
    // 相手の手: 1回目チョキ（勝ち）→ 2回目パー（負け）
    const seq = [0.5, 0.9];
    Math.random = () => seq.shift() ?? 0;
    try {
      render(<MinigameModal state={state} onResolve={(r, info) => calls.push({ r, info })} onClose={() => {}} />);
      fireEvent.click(screen.getByTestId('janken-rock'));
      expect(screen.getByTestId('janken-streak').textContent).toBe('1');
      fireEvent.click(screen.getByTestId('janken-rock'));
    } finally {
      Math.random = orig;
    }
    expect(calls).toHaveLength(1);
    expect(calls[0].info.streak).toBe(1);
    expect(calls[0].r).toEqual([{ type: 'combo_add', value: 5, duration: 3 }]);
  });

  it('サイコロ: Lv1は振り直しなしで即確定', () => {
    const calls = [];
    const state = { type: 'dice', level: 1, values: [0, 1, 2], tokenName: 'サイコロ', resolved: false };
    vi.useFakeTimers();
    try {
      render(<MinigameModal state={state} onResolve={(r, info) => calls.push(info)} onClose={() => {}} />);
      fireEvent.click(screen.getByTestId('dice-roll'));
      act(() => { vi.advanceTimersByTime(1000); });
    } finally {
      vi.useRealTimers();
    }
    expect(calls).toHaveLength(1);
    expect(calls[0].face).toBeGreaterThanOrEqual(1);
  });

  it('結果確定後は閉じるボタンが表示される', () => {
    const onClose = vi.fn();
    render(<MinigameModal state={{ type: 'fishing', level: 1, resolved: true }} onResolve={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('minigame-close'));
    expect(onClose).toHaveBeenCalled();
  });
});
