import React, { useState, useEffect, useMemo } from 'react';
import {
  PREFIX_TITLES,
  SUFFIX_TITLES,
  TITLE_SET_BONUSES,
  EVOLVED_TITLES
} from './constants/titles.js';
import {
  loadTitleState,
  saveTitleState,
  getEquippedTitleInfo,
  getTitleProgressValue
} from './utils/titleManager.js';
import soundManager from './utils/SoundManager.js';
import { SE_IDS } from './constants/sounds.js';

// 並び順の選択肢
const SORT_OPTIONS = [
  { key: 'unlocked', label: '解放順', icon: 'lock_open' },
  { key: 'number', label: '図鑑番号', icon: 'tag' },
  { key: 'name', label: '名前', icon: 'sort_by_alpha' },
];
const SORT_STORAGE_KEY = 'puzzle-rogue:title-sort';

const loadSortPref = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) || 'null');
    if (parsed && SORT_OPTIONS.some(o => o.key === parsed.key)) {
      return { key: parsed.key, desc: !!parsed.desc };
    }
  } catch { /* 保存領域が使えない場合は既定値 */ }
  return { key: 'unlocked', desc: false };
};

// 図鑑番号の比較用（A01〜 → E01〜 の順）
const compareId = (a, b) => a.id.localeCompare(b.id, 'en', { numeric: true });

const TitleEncyclopediaScreen = ({ onClose, initialTab = 'prefix' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'prefix' | 'suffix' | 'synergy'
  const [sortPref, setSortPref] = useState(loadSortPref);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortPref));
    } catch { /* 保存できなくても表示には影響しない */ }
  }, [sortPref]);
  const [titleState, setTitleState] = useState(() => loadTitleState());

  // 装備の変更のみを最新の保存状態へ反映する（進捗・解放状況は上書きしない）
  useEffect(() => {
    saveTitleState({ ...loadTitleState(), equippedTitle: titleState.equippedTitle });
  }, [titleState.equippedTitle]);

  const { unlockedTitles, equippedTitle } = titleState;
  const equippedInfo = useMemo(() => getEquippedTitleInfo(equippedTitle), [equippedTitle]);

  // 装備切り替え
  const handleEquip = (item, slot) => {
    soundManager.playSE(SE_IDS.UI_CLICK);
    setTitleState(prev => {
      const nextEquipped = { ...prev.equippedTitle };
      if (slot === 'prefix') {
        nextEquipped.prefixId = nextEquipped.prefixId === item.id ? null : item.id;
      } else if (slot === 'suffix') {
        nextEquipped.suffixId = nextEquipped.suffixId === item.id ? null : item.id;
      }
      return { ...prev, equippedTitle: nextEquipped };
    });
  };

  const isPrefixUnlocked = (id) => unlockedTitles.prefixes?.includes(id);
  const isSuffixUnlocked = (id) => unlockedTitles.suffixes?.includes(id);
  const isEvolvedUnlocked = (id) => unlockedTitles.evolved?.includes(id);
  const unlockedCount = (unlockedTitles.prefixes?.length || 0) + (unlockedTitles.suffixes?.length || 0) + (unlockedTitles.evolved?.length || 0);

  // A枠/B枠タブの一覧（解放済みの進化二つ名も入れ替え候補として含める）
  const slotList = useMemo(() => {
    if (activeTab !== 'prefix' && activeTab !== 'suffix') return [];
    const slot = activeTab;
    const baseList = slot === 'prefix' ? PREFIX_TITLES : SUFFIX_TITLES;
    const isBaseUnlocked = (id) => (slot === 'prefix' ? unlockedTitles.prefixes : unlockedTitles.suffixes)?.includes(id);
    const items = [
      ...baseList.map(t => ({ title: t, unlocked: !!isBaseUnlocked(t.id), evolved: false })),
      ...EVOLVED_TITLES
        .filter(e => e.slot === slot && unlockedTitles.evolved?.includes(e.id))
        .map(e => ({ title: e, unlocked: true, evolved: true })),
    ];
    const dir = sortPref.desc ? -1 : 1;
    const byKey = (a, b) => {
      if (sortPref.key === 'name') {
        // 未解放は名前が伏せられているため、常に末尾へ
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        const r = a.title.name.localeCompare(b.title.name, 'ja');
        return r !== 0 ? r * dir : compareId(a.title, b.title);
      }
      if (sortPref.key === 'unlocked') {
        if (a.unlocked !== b.unlocked) return (a.unlocked ? -1 : 1) * dir;
        return compareId(a.title, b.title);
      }
      return compareId(a.title, b.title) * dir;
    };
    return items.sort(byKey);
  }, [activeTab, unlockedTitles, sortPref]);

  const handleSortChange = (key) => {
    soundManager.playSE(SE_IDS.UI_CLICK);
    setSortPref(prev => (prev.key === key ? { key, desc: !prev.desc } : { key, desc: false }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background-dark font-game-cyber text-slate-100 flex flex-col animate-fade-in select-none">
      {/* Cyber Grid Background */}
      <div className="cyber-grid-bg opacity-40" />

      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex-none px-5 py-3.5 bg-slate-950/80 border-b border-white/10 backdrop-blur-md z-20 flex justify-between items-center relative">
        <div className="flex items-center gap-2.5">
          <span className="material-icons-round text-amber-400 text-2xl">military_tech</span>
          <div>
            <h1 className="text-base font-game-header tracking-wider text-amber-300">
              二つ名図鑑 (全{PREFIX_TITLES.length + SUFFIX_TITLES.length + TITLE_SET_BONUSES.length + EVOLVED_TITLES.length}種・解放 {unlockedCount}/{PREFIX_TITLES.length + SUFFIX_TITLES.length + EVOLVED_TITLES.length})
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              TITLE ENCYCLOPEDIA (ALL {PREFIX_TITLES.length + SUFFIX_TITLES.length + TITLE_SET_BONUSES.length + EVOLVED_TITLES.length} TITLES)
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            soundManager.playSE(SE_IDS.UI_CLICK);
            onClose();
          }}
          className="btn-game-cyber rounded-xl w-9 h-9 p-0 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-icons-round text-lg">close</span>
        </button>
      </header>

      {/* 現在装備中のバッジ表示バー */}
      <div className="flex-none px-4 py-3 bg-slate-900/90 border-b border-white/10 z-10 backdrop-blur-sm">
        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center justify-between">
          <span>EQUIPPED TITLE / 現在装備中の二つ名</span>
          {equippedInfo.activeSet && (
            <span className="text-xs text-amber-300 font-black animate-pulse flex items-center gap-1">
              <span className="material-icons-round text-sm text-yellow-400">auto_awesome</span>
              SYNERGY ACTIVE
            </span>
          )}
        </div>
        <div className={`p-3 rounded-xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-2 ${
          equippedInfo.activeSet
            ? 'bg-gradient-to-r from-amber-950/60 via-purple-950/50 to-slate-900/80 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
            : 'bg-slate-950/60 border-white/10'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-base font-black tracking-wide ${
              equippedInfo.activeSet
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : 'text-indigo-200'
            }`}>
              {equippedInfo.fullName}
            </span>
            {equippedInfo.activeSet && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                専用シナジー発動中
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 line-clamp-1">
            {equippedInfo.activeSet
              ? equippedInfo.activeSet.desc
              : `${equippedInfo.prefix?.desc || 'A枠未設定'} ｜ ${equippedInfo.suffix?.desc || 'B枠未設定'}`}
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex-none px-4 pt-3 pb-2 z-10 flex gap-2">
        <button
          onClick={() => {
            soundManager.playSE(SE_IDS.UI_CLICK);
            setActiveTab('prefix');
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'prefix'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
              : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <span className="material-icons-round text-sm">label</span>
          <span>A枠（接頭辞 全{PREFIX_TITLES.length}種）</span>
        </button>
        <button
          onClick={() => {
            soundManager.playSE(SE_IDS.UI_CLICK);
            setActiveTab('suffix');
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'suffix'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
              : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <span className="material-icons-round text-sm">loyalty</span>
          <span>B枠（接尾辞 全{SUFFIX_TITLES.length}種）</span>
        </button>
        <button
          onClick={() => {
            soundManager.playSE(SE_IDS.UI_CLICK);
            setActiveTab('synergy');
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'synergy'
              ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30'
              : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <span className="material-icons-round text-sm">flare</span>
          <span>シナジー＆進化 (40種)</span>
        </button>
      </div>

      {/* 一覧リストエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar z-10 space-y-3">
        {/* A枠・B枠一覧 */}
        {(activeTab === 'prefix' || activeTab === 'suffix') && (
          <>
            {/* 並び替え */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                <span className="material-icons-round text-sm">sort</span>
                並び順
              </span>
              {SORT_OPTIONS.map(opt => {
                const active = sortPref.key === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSortChange(opt.key)}
                    aria-pressed={active}
                    className={`flex items-center gap-0.5 px-2.5 py-1 rounded-full border font-bold transition-all ${
                      active
                        ? 'bg-indigo-600/80 border-indigo-400/60 text-white'
                        : 'bg-slate-950/50 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                    {active && (
                      <span className="material-icons-round text-sm">
                        {sortPref.desc ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {slotList.map(({ title, unlocked, evolved }) => {
                const slot = activeTab;
                const isEquipped = (slot === 'prefix' ? equippedTitle.prefixId : equippedTitle.suffixId) === title.id;
                const progress = getTitleProgressValue(title, titleState.progress);
                const percent = Math.min(100, Math.floor((progress / title.targetValue) * 100)) || 0;
                const hiddenName = slot === 'prefix' ? '？？？？の' : '？？？';
                const unlockedIcon = evolved ? 'verified' : (slot === 'prefix' ? 'sell' : 'loyalty');

                return (
                  <div
                    key={title.id}
                    onClick={() => unlocked && handleEquip(title, slot)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isEquipped
                        ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                        : unlocked
                        ? 'bg-slate-900/60 border-white/10 hover:border-indigo-400/50 hover:bg-slate-800/60'
                        : 'bg-slate-950/60 border-white/5 opacity-75'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={`material-icons-round text-lg ${
                          unlocked ? (evolved ? 'text-amber-400' : 'text-indigo-400') : 'text-slate-500'
                        }`}>
                          {unlocked ? (isEquipped ? 'check_circle' : unlockedIcon) : 'lock'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">[{title.id}]</span>
                        <span className={`text-sm font-black ${
                          unlocked ? 'text-white' : 'text-slate-400'
                        }`}>
                          {unlocked ? title.name : hiddenName}
                        </span>
                        <span className={`text-[9px] border px-1.5 py-0.5 rounded font-bold ${
                          evolved
                            ? 'bg-amber-900/30 border-amber-500/30 text-amber-300'
                            : 'bg-slate-800/80 border-white/10 text-slate-400'
                        }`}>
                          {evolved ? '進化' : title.category}
                        </span>
                      </div>
                      {unlocked && (
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isEquipped ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isEquipped ? '装着中' : '装着する'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mb-2 leading-relaxed font-sans">
                      {unlocked ? title.desc : '条件を達成すると常時発動効果が解放されます。'}
                    </p>

                    {/* 解放条件とプログレスバー */}
                    <div className="bg-slate-950/70 p-2 rounded-xl border border-white/5 text-[11px]">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <span className="material-icons-round text-xs text-amber-400">emoji_events</span>
                          {title.conditionDesc}
                        </span>
                        {!unlocked && (
                          <span className="font-mono font-bold text-amber-300">
                            {progress.toLocaleString()} / {title.targetValue.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {!unlocked && (
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* シナジー＆進化一覧 */}
        {activeTab === 'synergy' && (
          <div className="space-y-4">
            {/* セットボーナス（隠しシナジー） */}
            <div>
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="material-icons-round text-sm">flare</span>
                隠しセット効果（シナジー 全{TITLE_SET_BONUSES.length}種）
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TITLE_SET_BONUSES.map((set) => {
                  const pref = PREFIX_TITLES.find(p => p.id === set.prefixId);
                  const suff = SUFFIX_TITLES.find(s => s.id === set.suffixId);
                  const isPrefUnlocked = isPrefixUnlocked(set.prefixId);
                  const isSuffUnlocked = isSuffixUnlocked(set.suffixId);
                  const isActive = equippedInfo.activeSet?.id === set.id;

                  return (
                    <div
                      key={set.id}
                      className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-950/60 via-purple-950/40 to-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-900/60 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-sm font-black ${
                          isActive ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-white'
                        }`}>
                          {isPrefUnlocked && isSuffUnlocked ? set.titleName : '【？？？？？】'}
                        </span>
                        {isActive && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                            発動中
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                        <span className={isPrefUnlocked ? 'text-indigo-300 font-bold' : 'text-slate-600'}>
                          {isPrefUnlocked ? pref?.name : '？？？'}
                        </span>
                        <span>×</span>
                        <span className={isSuffUnlocked ? 'text-indigo-300 font-bold' : 'text-slate-600'}>
                          {isSuffUnlocked ? suff?.name : '？？？'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/50 p-2 rounded-xl border border-white/5">
                        {isPrefUnlocked && isSuffUnlocked ? set.desc : '対応するA枠・B枠の二つ名を両方解放すると効果が判明します。'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 派生・進化二つ名 */}
            <div className="pt-2">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="material-icons-round text-sm">account_tree</span>
                派生・進化二つ名（全{EVOLVED_TITLES.length}種）
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EVOLVED_TITLES.map((evo) => {
                  const unlocked = isEvolvedUnlocked(evo.id);
                  const slot = evo.slot;
                  const isEquipped = (slot === 'prefix' ? equippedTitle.prefixId : equippedTitle.suffixId) === evo.id;
                  const baseTitle = slot === 'prefix'
                    ? PREFIX_TITLES.find(p => p.id === evo.requiredTitleId)
                    : SUFFIX_TITLES.find(p => p.id === evo.requiredTitleId);
                  const baseUnlocked = slot === 'prefix' ? isPrefixUnlocked(evo.requiredTitleId) : isSuffixUnlocked(evo.requiredTitleId);
                  const progress = getTitleProgressValue(evo, titleState.progress);
                  const isCounter = !evo.trigger; // 累計系（進捗バーを表示）
                  const percent = Math.min(100, Math.floor((progress / evo.targetValue) * 100)) || 0;

                  return (
                    <div
                      key={evo.id}
                      onClick={() => unlocked && handleEquip(evo, slot)}
                      className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                        isEquipped
                          ? 'bg-indigo-900/50 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer'
                          : unlocked
                          ? 'bg-indigo-950/40 border-indigo-400/50 shadow-md cursor-pointer hover:border-amber-400/60'
                          : 'bg-slate-950/60 border-white/5 opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5 gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="material-icons-round text-base text-amber-400">
                            {unlocked ? (isEquipped ? 'check_circle' : 'verified') : 'lock'}
                          </span>
                          <span className="text-sm font-black text-white">
                            【{evo.name}】
                          </span>
                          <span className="text-[9px] bg-indigo-900/50 border border-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-300 font-bold">
                            {slot === 'prefix' ? 'A枠' : 'B枠'}・{baseTitle ? `${baseTitle.name}の進化` : evo.category}
                          </span>
                        </div>
                        {unlocked && (
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isEquipped ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isEquipped ? '装着中' : '装着する'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mb-2 leading-relaxed font-sans">
                        {evo.desc}
                      </p>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-white/5 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center gap-1 text-amber-300">
                          <span className="material-icons-round text-xs">flag</span>
                          <span>{evo.challengeDesc}</span>
                        </div>
                        {!unlocked && !baseUnlocked && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="material-icons-round text-xs">lock</span>
                            <span>前提: 元の二つ名を先に解放してください</span>
                          </div>
                        )}
                        {!unlocked && isCounter && (
                          <>
                            <div className="text-right font-mono font-bold text-amber-300">
                              {progress.toLocaleString()} / {evo.targetValue.toLocaleString()}
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleEncyclopediaScreen;
