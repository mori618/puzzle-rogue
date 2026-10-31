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

const TitleEncyclopediaScreen = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('prefix'); // 'prefix' | 'suffix' | 'synergy'
  const [titleState, setTitleState] = useState(() => loadTitleState());

  useEffect(() => {
    saveTitleState(titleState);
  }, [titleState]);

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
              二つ名図鑑 (全140種)
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              TITLE ENCYCLOPEDIA (ALL 140 TITLES)
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
          <span>A枠（接頭辞 全50種）</span>
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
          <span>B枠（接尾辞 全50種）</span>
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
        {/* A枠一覧 */}
        {activeTab === 'prefix' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PREFIX_TITLES.map((title) => {
              const unlocked = isPrefixUnlocked(title.id);
              const isEquipped = equippedTitle.prefixId === title.id;
              const progress = getTitleProgressValue(title, titleState.progress);
              const percent = Math.min(100, Math.floor((progress / title.targetValue) * 100)) || 0;

              return (
                <div
                  key={title.id}
                  onClick={() => unlocked && handleEquip(title, 'prefix')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isEquipped
                      ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                      : unlocked
                      ? 'bg-slate-900/60 border-white/10 hover:border-indigo-400/50 hover:bg-slate-800/60'
                      : 'bg-slate-950/60 border-white/5 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`material-icons-round text-lg ${
                        unlocked ? 'text-indigo-400' : 'text-slate-500'
                      }`}>
                        {unlocked ? (isEquipped ? 'check_circle' : 'sell') : 'lock'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">[{title.id}]</span>
                      <span className={`text-sm font-black ${
                        unlocked ? 'text-white' : 'text-slate-400'
                      }`}>
                        {unlocked ? title.name : '？？？？の'}
                      </span>
                      <span className="text-[9px] bg-slate-800/80 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                        {title.category}
                      </span>
                    </div>
                    {unlocked && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                          {progress} / {title.targetValue}
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
        )}

        {/* B枠一覧 */}
        {activeTab === 'suffix' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUFFIX_TITLES.map((title) => {
              const unlocked = isSuffixUnlocked(title.id);
              const isEquipped = equippedTitle.suffixId === title.id;
              const progress = getTitleProgressValue(title, titleState.progress);
              const percent = Math.min(100, Math.floor((progress / title.targetValue) * 100)) || 0;

              return (
                <div
                  key={title.id}
                  onClick={() => unlocked && handleEquip(title, 'suffix')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isEquipped
                      ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                      : unlocked
                      ? 'bg-slate-900/60 border-white/10 hover:border-indigo-400/50 hover:bg-slate-800/60'
                      : 'bg-slate-950/60 border-white/5 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`material-icons-round text-lg ${
                        unlocked ? 'text-indigo-400' : 'text-slate-500'
                      }`}>
                        {unlocked ? (isEquipped ? 'check_circle' : 'loyalty') : 'lock'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">[{title.id}]</span>
                      <span className={`text-sm font-black ${
                        unlocked ? 'text-white' : 'text-slate-400'
                      }`}>
                        {unlocked ? title.name : '？？？'}
                      </span>
                      <span className="text-[9px] bg-slate-800/80 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                        {title.category}
                      </span>
                    </div>
                    {unlocked && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                          {progress} / {title.targetValue}
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
        )}

        {/* シナジー＆進化一覧 */}
        {activeTab === 'synergy' && (
          <div className="space-y-4">
            {/* セットボーナス（隠しシナジー） */}
            <div>
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="material-icons-round text-sm">flare</span>
                隠しセット効果（シナジー 全20種）
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TITLE_SET_BONUSES.map((set) => {
                  const pref = PREFIX_TITLES.find(p => p.id === set.prefixId);
                  const suff = SUFFIX_TITLES.find(s => s.id === set.suffixId);
                  const isPrefUnlocked = isPrefixUnlocked(set.prefixId);
                  const isSuffUnlocked = isSuffixUnlocked(set.suffixId);
                  const isActive = equippedTitle.prefixId === set.prefixId && equippedTitle.suffixId === set.suffixId;

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
                派生・進化二つ名（全20種）
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EVOLVED_TITLES.map((evo) => {
                  const unlocked = isEvolvedUnlocked(evo.id);

                  return (
                    <div
                      key={evo.id}
                      className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                        unlocked
                          ? 'bg-indigo-950/40 border-indigo-400/50 shadow-md'
                          : 'bg-slate-950/60 border-white/5 opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="material-icons-round text-base text-amber-400">
                            {unlocked ? 'verified' : 'lock'}
                          </span>
                          <span className="text-sm font-black text-white">
                            【{evo.name}】
                          </span>
                          <span className="text-[9px] bg-indigo-900/50 border border-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-300 font-bold">
                            {evo.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mb-2 leading-relaxed font-sans">
                        {evo.desc}
                      </p>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-white/5 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1 text-amber-300">
                          <span className="material-icons-round text-xs">flag</span>
                          <span>{evo.challengeDesc}</span>
                        </div>
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
