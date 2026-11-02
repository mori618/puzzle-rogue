import { describe, it, expect, beforeEach } from 'vitest';
import { pickTokensForFreeSlots, applyNewTokenLevel, isNewTokenLevelTarget } from './tokenUtils.js';
import { saveTitleState, resetTitleCache } from './titleManager.js';

const skill = (id) => ({ id, type: 'skill' });
const passive = (id) => ({ id, type: 'passive' });

describe('pickTokensForFreeSlots（継承者で戻すトークンの空き枠判定）', () => {
  it('アクティブとパッシブの空き枠を別々に数える', () => {
    // 枠は各4。アクティブ4個（満杯）・パッシブ1個（空き3）＝合計5個所持
    const tokens = [skill('a1'), skill('a2'), skill('a3'), skill('a4'), passive('p1')];
    const { accepted, rejected } = pickTokensForFreeSlots([passive('ret1'), skill('ret2')], tokens, 4);
    expect(accepted.map(t => t.id)).toEqual(['ret1']);
    expect(rejected.map(t => t.id)).toEqual(['ret2']);
  });

  it('合計4個以上持っていても、該当する枠が空いていれば戻る（旧実装の不具合）', () => {
    const tokens = [passive('p1'), passive('p2'), skill('a1'), skill('a2')];
    const { accepted } = pickTokensForFreeSlots([passive('ret1'), skill('ret2')], tokens, 4);
    expect(accepted.map(t => t.id)).toEqual(['ret1', 'ret2']);
  });

  it('空き枠の数を超える分は入らない', () => {
    const tokens = [passive('p1'), passive('p2'), passive('p3')];
    const { accepted, rejected } = pickTokensForFreeSlots([passive('r1'), passive('r2'), skill('r3')], tokens, 4);
    expect(accepted.map(t => t.id)).toEqual(['r1', 'r3']);
    expect(rejected.map(t => t.id)).toEqual(['r2']);
  });

  it('呪い（パッシブ側）や null を含んでいても正しく数える', () => {
    const tokens = [null, { id: 'c1', type: 'curse', isCurse: true }, passive('p1'), passive('p2'), passive('p3')];
    const { accepted } = pickTokensForFreeSlots([passive('r1')], tokens, 4);
    expect(accepted).toHaveLength(0);
  });
});

describe('applyNewTokenLevel（二つ名「先達の」）', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTitleCache();
  });

  const base = { id: 'x', type: 'passive', name: 'テスト', values: [1, 2, 3], level: 1 };

  it('初期レベル 2 を適用する', () => {
    const t = applyNewTokenLevel(base, { level: 2 });
    expect(t.level).toBe(2);
    expect(t).not.toBe(base);
  });

  it('初期レベル 1（二つ名なし）なら変えない', () => {
    expect(applyNewTokenLevel(base, { level: 1 })).toBe(base);
  });

  it('装備中の二つ名から初期レベルを読む', () => {
    expect(applyNewTokenLevel(base).level).toBe(1);
    saveTitleState({
      unlockedTitles: { prefixes: ['A20'], suffixes: [], evolved: [] },
      equippedTitle: { prefixId: 'A20', suffixId: null },
      progress: {},
    });
    expect(applyNewTokenLevel(base).level).toBe(2);
  });

  it('呪い・noLevelUp・copy_left・ダミートークンは対象外', () => {
    const excluded = [
      { ...base, type: 'curse' },
      { ...base, isCurse: true, type: 'skill' },
      { ...base, noLevelUp: true },
      { ...base, effect: 'copy_left' },
      { ...base, parentId: 123 },
    ];
    excluded.forEach(t => {
      expect(isNewTokenLevelTarget(t)).toBe(false);
      expect(applyNewTokenLevel(t, { level: 2 }).level).toBe(1);
    });
  });

  it('最大レベルを超えない', () => {
    expect(applyNewTokenLevel({ ...base, values: [5] }, { level: 2 }).level).toBe(1);
    expect(applyNewTokenLevel({ ...base, level: 3 }, { level: 2 }).level).toBe(3);
  });
});
