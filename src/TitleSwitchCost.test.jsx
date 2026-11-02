import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TitleEncyclopediaScreen from './TitleEncyclopediaScreen';
import { saveTitleState, resetTitleCache, loadTitleState } from './utils/titleManager.js';
import { PREFIX_TITLES } from './constants/titles.js';
import { getTitleSwitchPrice } from './constants/gameConstants.js';
import playLog from './utils/playLogger.js';

vi.mock('./utils/SoundManager.js', () => ({ default: { playSE: () => {} } }));

const setup = () => {
  localStorage.clear();
  resetTitleCache();
  saveTitleState({
    unlockedTitles: { prefixes: [PREFIX_TITLES[0].id, PREFIX_TITLES[1].id], suffixes: [], evolved: [] },
    equippedTitle: { prefixId: null, suffixId: null },
    progress: {},
  });
};

describe('ラン中の二つ名切り替えコスト', () => {
  beforeEach(setup);

  it('価格は 5→10→15… と上がる', () => {
    expect([0, 1, 2, 3].map(getTitleSwitchPrice)).toEqual([5, 10, 15, 20]);
  });

  it('★が足りないと装備できず、不足分が表示される', () => {
    const onPaidSwitch = vi.fn();
    render(<TitleEncyclopediaScreen switchCost={5} stars={3} onPaidSwitch={onPaidSwitch} onClose={() => {}} />);
    expect(screen.getByTestId('title-switch-cost').textContent).toContain('あと★2');
    fireEvent.click(screen.getByText(PREFIX_TITLES[0].name));
    expect(onPaidSwitch).not.toHaveBeenCalled();
    expect(loadTitleState().equippedTitle.prefixId).toBeNull();
  });

  it('★が足りれば装備でき、コストと前後の二つ名が通知される', () => {
    const onPaidSwitch = vi.fn();
    render(<TitleEncyclopediaScreen switchCost={5} stars={10} onPaidSwitch={onPaidSwitch} onClose={() => {}} />);
    fireEvent.click(screen.getByText(PREFIX_TITLES[0].name));
    expect(onPaidSwitch).toHaveBeenCalledTimes(1);
    const arg = onPaidSwitch.mock.calls[0][0];
    expect(arg.cost).toBe(5);
    expect(arg.before.a).toBeNull();
    expect(arg.after.a).toBe(PREFIX_TITLES[0].id);
    expect(loadTitleState().equippedTitle.prefixId).toBe(PREFIX_TITLES[0].id);
  });

  it('switchCost 未指定（ラン開始前）は無料でコスト表示もない', () => {
    render(<TitleEncyclopediaScreen onClose={() => {}} />);
    expect(screen.queryByTestId('title-switch-cost')).toBeNull();
    fireEvent.click(screen.getByText(PREFIX_TITLES[0].name));
    expect(loadTitleState().equippedTitle.prefixId).toBe(PREFIX_TITLES[0].id);
  });

  it('playLog に titleChange イベントを記録できる', () => {
    playLog.start({});
    playLog.event('titleChange', { cost: 5 });
    expect(playLog.getCurrent().events.some(e => e.k === 'titleChange')).toBe(true);
  });
});
