import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
vi.mock('./utils/SoundManager', () => ({ default: { playSE: vi.fn(), playBGM: vi.fn() }, soundManager: { playSE: vi.fn() } }));
import { getTitleSwitchCost, TITLE_SWITCH_COST } from './constants/gameConstants';
import TitleEncyclopediaScreen from './TitleEncyclopediaScreen';
import { loadTitleState, saveTitleState, resetTitleCache } from './utils/titleManager';

describe('二つ名切り替え価格', () => {
  it('初回5★、切り替えるたびに+5★', () => {
    expect(TITLE_SWITCH_COST).toEqual({ base: 5, step: 5 });
    expect([0, 1, 2, 3].map(getTitleSwitchCost)).toEqual([5, 10, 15, 20]);
  });
});

describe('TitleEncyclopediaScreen（ラン中の切り替え）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
    const st = loadTitleState();
    st.unlockedTitles.prefixes = ['A01', 'A02'];
    st.equippedTitle = { prefixId: 'A01', suffixId: null };
    saveTitleState(st);
  });

  const clickA02 = () => fireEvent.click(screen.getAllByText('[A02]')[0]);

  it('スター不足なら切り替えられず支払いも呼ばれない', () => {
    const pay = vi.fn(() => true);
    render(<TitleEncyclopediaScreen onClose={() => {}} switchCost={5} stars={4} onPaySwitch={pay} />);
    expect(screen.getByTestId('title-switch-cost').textContent).toContain('不足');
    clickA02();
    expect(pay).not.toHaveBeenCalled();
    expect(loadTitleState().equippedTitle.prefixId).toBe('A01');
  });

  it('スターが足りれば支払い、装備が変わる', () => {
    const pay = vi.fn(() => true);
    render(<TitleEncyclopediaScreen onClose={() => {}} switchCost={5} stars={10} onPaySwitch={pay} />);
    clickA02();
    expect(pay).toHaveBeenCalledTimes(1);
    expect(pay.mock.calls[0][0].prefixId).toBe('A01');
    expect(pay.mock.calls[0][1].prefixId).toBe('A02');
    expect(loadTitleState().equippedTitle.prefixId).toBe('A02');
  });

  it('switchCost 未指定（タイトル画面）では無料で切り替えられる', () => {
    render(<TitleEncyclopediaScreen onClose={() => {}} />);
    expect(screen.queryByTestId('title-switch-cost')).toBeNull();
    clickA02();
    expect(loadTitleState().equippedTitle.prefixId).toBe('A02');
  });
});

describe('TitleEncyclopediaScreen（進化タブ）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
    saveTitleState({
      unlockedTitles: { prefixes: ['A01'], suffixes: ['B08'], evolved: ['E29'] },
      equippedTitle: { prefixId: 'E29', suffixId: 'B08' },
      progress: {},
    });
  });

  it('セット効果の欄が無く、進化二つ名を元の二つ名（複数）つきで表示する', () => {
    render(<TitleEncyclopediaScreen onClose={() => {}} initialTab="synergy" />);
    expect(screen.queryByText(/隠しセット効果/)).toBeNull();
    expect(screen.getByText(/派生・進化二つ名（全50種）/)).toBeTruthy();
    expect(screen.getByText('【電撃の】')).toBeTruthy();
    expect(screen.getAllByText(/A枠・装備: 神速の＋無双/).length).toBeGreaterThan(0);
    // 未解放の元の二つ名は伏せる
    expect(screen.getAllByText(/B枠・解放: ？？？＋？？？/).length).toBeGreaterThan(0);
  });
});
