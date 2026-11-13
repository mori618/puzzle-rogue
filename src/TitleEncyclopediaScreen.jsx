import React, { useState, useMemo } from 'react';
import { PREFIX_TITLES, SUFFIX_TITLES, EVOLVED_TITLES, TITLE_SET_BONUSES, getSetBonus, getTitleDisplayName, getTitleProgress } from './constants/titles.js';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';

// Color map for category badges
const CATEGORY_COLORS = {
  time: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  risk: 'bg-red-500/20 text-red-300 border-red-500/30',
  attribute: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  economy: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  limit: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  curse: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  puzzle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  turn: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  equip: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  skill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  shop: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  train: 'bg-green-500/20 text-green-300 border-green-500/30',
  amp: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  rate: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  destroy: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  slot: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  multiplier: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  special: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  add: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  board: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  base: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  boss: 'bg-red-600/20 text-red-300 border-red-600/30',
  synergy: 'bg-indigo-600/20 text-indigo-200 border-indigo-600/30',
  charge: 'bg-cyan-600/20 text-cyan-200 border-cyan-600/30',
  level: 'bg-emerald-600/20 text-emerald-200 border-emerald-600/30',
  drop: 'bg-blue-600/20 text-blue-200 border-blue-600/30',
  evolved: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-200 border-yellow-500/40',
};

// Progress bar component
const ProgressBar = ({ current, target, percent }) => (
  <div className="w-full mt-1.5">
    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
      <span>{current.toLocaleString()} / {target.toLocaleString()}</span>
      <span>{percent}%</span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-slate-800/60 overflow-hidden border border-white/5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

// Single title card
const TitleCard = ({
  title,
  isUnlocked,
  isEquipped,
  onEquip,
  progress,
  showEquipButton = true,
  accentColor = 'from-primary/20 to-indigo-600/20',
  isEvolved = false,
}) => {
  const categoryColor = CATEGORY_COLORS[title.category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden
        ${isEquipped
          ? 'border-yellow-400/60 bg-gradient-to-br from-yellow-500/10 to-amber-600/10 shadow-[0_0_18px_rgba(251,191,36,0.3)]'
          : isUnlocked
            ? 'border-white/10 bg-gradient-to-br ' + accentColor
            : 'border-white/5 bg-slate-900/40 opacity-60'
        }
      `}
    >
      {/* Equipped glow stripe */}
      {isEquipped && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 opacity-80" />
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!isUnlocked && (
              <span className="material-icons-round text-slate-500 text-base shrink-0">lock</span>
            )}
            {isEvolved && isUnlocked && (
              <span className="material-icons-round text-yellow-400 text-base shrink-0 animate-pulse">auto_awesome</span>
            )}
            <span className={`text-base font-black tracking-wide truncate ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
              {isUnlocked ? title.name : '???'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isEquipped && (
              <span className="text-[9px] font-black text-yellow-300 bg-yellow-500/20 border border-yellow-400/40 px-1.5 py-0.5 rounded-full">
                装備中
              </span>
            )}
            <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-full ${categoryColor}`}>
              {title.categoryName || title.category}
            </span>
          </div>
        </div>

        {isUnlocked ? (
          <>
            <p className="text-[11px] text-indigo-200 leading-snug mb-1.5">{title.desc}</p>
            {showEquipButton && (
              <button
                onClick={() => { onEquip(title.id); soundManager.playSE(SE_IDS.UI_CLICK); }}
                className={`w-full text-[11px] font-bold py-1.5 rounded-xl border transition-all active:scale-95
                  ${isEquipped
                    ? 'bg-yellow-500/10 border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/20'
                    : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                  }`}
              >
                {isEquipped ? '✓ 装備中（タップで外す）' : '装備する'}
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-[10px] text-slate-500 leading-snug mb-1 italic">— 解放前 —</p>
            <p className="text-[10px] text-slate-400 leading-snug mb-1">
              <span className="text-slate-500 font-semibold">条件: </span>
              {title.conditionDesc}
            </p>
            {progress && (
              <ProgressBar
                current={progress.current}
                target={progress.target}
                percent={progress.percent}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Set bonus card
const SetBonusCard = ({ setBonus, isActive, prefixName, suffixName }) => (
  <div
    className={`relative rounded-2xl border overflow-hidden transition-all duration-300
      ${isActive
        ? 'border-fuchsia-400/70 bg-gradient-to-br from-fuchsia-900/30 to-purple-900/30 shadow-[0_0_24px_rgba(192,38,211,0.4)]'
        : 'border-white/10 bg-gradient-to-br from-purple-900/10 to-fuchsia-900/10'
      }
    `}
  >
    {isActive && (
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fuchsia-400 via-purple-300 to-fuchsia-400 animate-pulse" />
    )}
    <div className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-icons-round text-fuchsia-300 text-base">
          {isActive ? 'flare' : 'join_inner'}
        </span>
        <span className={`text-sm font-black tracking-wide ${isActive ? 'text-fuchsia-200' : 'text-purple-300'}`}>
          {setBonus.titleName}
        </span>
        {isActive && (
          <span className="text-[9px] font-black text-fuchsia-300 bg-fuchsia-500/20 border border-fuchsia-400/40 px-1.5 py-0.5 rounded-full ml-auto">
            発動中！
          </span>
        )}
      </div>
      <div className="flex gap-1 flex-wrap mb-1.5">
        <span className="text-[10px] bg-slate-800/60 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
          A: {prefixName}
        </span>
        <span className="text-[10px] text-slate-500 self-center">+</span>
        <span className="text-[10px] bg-slate-800/60 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
          B: {suffixName}
        </span>
      </div>
      <p className="text-[11px] text-purple-200 leading-snug">{setBonus.desc}</p>
    </div>
  </div>
);

// Evolved title card
const EvolvedCard = ({ evo, isUnlocked, isEquipped, onEquip, progress, stats, currentRunStats, equippedTitle }) => {
  const prereqLabel = evo.requiredSet
    ? `セット効果「${TITLE_SET_BONUSES.find(s => s.id === evo.requiredSet)?.titleName || evo.requiredSet}」装備中`
    : evo.requiredPrefix
      ? `A枠「${PREFIX_TITLES.find(p => p.id === evo.requiredPrefix)?.name || '?'}」解放済`
      : evo.requiredSuffix
        ? `B枠「${SUFFIX_TITLES.find(s => s.id === evo.requiredSuffix)?.name || '?'}」解放済`
        : '';

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300
        ${isEquipped
          ? 'border-amber-400/70 bg-gradient-to-br from-amber-900/30 to-yellow-900/20 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
          : isUnlocked
            ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-amber-900/10'
            : 'border-white/5 bg-slate-900/40 opacity-55'
        }
      `}
    >
      {isUnlocked && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 opacity-60" />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`material-icons-round text-base ${isUnlocked ? 'text-yellow-400' : 'text-slate-600'}`}>
              {isUnlocked ? 'military_tech' : 'lock'}
            </span>
            <span className={`text-base font-black ${isUnlocked ? 'text-yellow-200' : 'text-slate-500'}`}>
              {isUnlocked ? `『${evo.name}』` : '???'}
            </span>
          </div>
          <span className="text-[10px] font-bold border px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border-amber-500/30 shrink-0">
            {evo.categoryName}
          </span>
        </div>

        {prereqLabel && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="material-icons-round text-[10px] text-slate-500">arrow_forward</span>
            <span className="text-[10px] text-slate-400">{prereqLabel}</span>
          </div>
        )}

        {isUnlocked ? (
          <>
            <p className="text-[11px] text-amber-100 leading-snug mb-2">{evo.desc}</p>
            <button
              onClick={() => { onEquip(evo.id); soundManager.playSE(SE_IDS.UI_CLICK); }}
              className={`w-full text-[11px] font-bold py-1.5 rounded-xl border transition-all active:scale-95
                ${isEquipped
                  ? 'bg-amber-500/10 border-amber-400/40 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-yellow-500/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/20'
                }`}
            >
              {isEquipped ? '✓ 装備中' : '装備する'}
            </button>
          </>
        ) : (
          <>
            <p className="text-[10px] text-slate-500 italic mb-1">— 解放前 —</p>
            <p className="text-[10px] text-slate-400 mb-1">
              <span className="text-slate-500 font-semibold">条件: </span>
              {evo.conditionDesc}
            </p>
            {progress && (
              <ProgressBar
                current={progress.current}
                target={progress.target}
                percent={progress.percent}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Screen Component ---
const TitleEncyclopediaScreen = ({
  onClose,
  unlockedTitles = { prefixes: [], suffixes: [], evolved: [] },
  equippedTitle = { prefixId: null, suffixId: null, evolvedId: null },
  equipTitlePrefix,
  equipTitleSuffix,
  equipEvolvedTitle,
  stats = {},
  currentRunStats = {},
}) => {
  const [activeTab, setActiveTab] = useState('prefix');

  const activeSetBonus = useMemo(
    () => getSetBonus(equippedTitle.prefixId, equippedTitle.suffixId),
    [equippedTitle.prefixId, equippedTitle.suffixId]
  );

  const titleDisplayName = useMemo(
    () => getTitleDisplayName(equippedTitle),
    [equippedTitle]
  );

  const handleEquipPrefix = (id) => {
    if (!equipTitlePrefix) return;
    const isAlreadyEquipped = equippedTitle.prefixId === id;
    equipTitlePrefix(isAlreadyEquipped ? null : id);
  };

  const handleEquipSuffix = (id) => {
    if (!equipTitleSuffix) return;
    const isAlreadyEquipped = equippedTitle.suffixId === id;
    equipTitleSuffix(isAlreadyEquipped ? null : id);
  };

  const handleEquipEvolved = (id) => {
    if (!equipEvolvedTitle) return;
    equipEvolvedTitle(id);
  };

  const TABS = [
    { key: 'prefix', label: 'A枠', icon: 'text_fields', count: PREFIX_TITLES.length },
    { key: 'suffix', label: 'B枠', icon: 'title', count: SUFFIX_TITLES.length },
    { key: 'set', label: 'セット', icon: 'join_inner', count: TITLE_SET_BONUSES.length },
    { key: 'evolved', label: '進化', icon: 'military_tech', count: EVOLVED_TITLES.length },
  ];

  const unlockedCount = (unlockedTitles.prefixes?.length || 0) + (unlockedTitles.suffixes?.length || 0) + (unlockedTitles.evolved?.length || 0);
  const totalCount = PREFIX_TITLES.length + SUFFIX_TITLES.length + EVOLVED_TITLES.length;

  return (
    <div className="fixed inset-0 z-50 bg-background-dark flex flex-col font-game-cyber">
      {/* Header */}
      <div className="relative px-4 pt-[calc(12px+env(safe-area-inset-top,16px))] pb-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex-none">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-yellow-400 text-xl">stars</span>
            <h1 className="text-lg font-black text-white tracking-wide">二つ名 図鑑</h1>
          </div>
          <button
            onClick={() => { onClose(); soundManager.playSE(SE_IDS.UI_CLICK); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/60 border border-white/10 text-slate-300 active:scale-90 transition-all"
          >
            <span className="material-icons-round text-base">close</span>
          </button>
        </div>

        {/* Current equipped title display */}
        <div className={`rounded-xl px-3 py-2 border flex items-center gap-2 mb-2
          ${activeSetBonus
            ? 'bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border-fuchsia-500/40 shadow-[0_0_12px_rgba(192,38,211,0.25)]'
            : equippedTitle.prefixId || equippedTitle.suffixId || equippedTitle.evolvedId
              ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-yellow-500/30'
              : 'bg-slate-800/30 border-white/5'
          }
        `}>
          <span className={`material-icons-round text-base ${activeSetBonus ? 'text-fuchsia-300 animate-pulse' : 'text-yellow-400'}`}>
            {activeSetBonus ? 'flare' : 'badge'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">現在の称号</p>
            <p className={`text-sm font-black truncate ${activeSetBonus ? 'text-fuchsia-200' : 'text-yellow-200'}`}>
              {titleDisplayName}
            </p>
            {activeSetBonus && (
              <p className="text-[9px] text-fuchsia-400 font-bold">セット効果 発動中！</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-slate-400">解放数</p>
            <p className="text-sm font-black text-white">{unlockedCount}<span className="text-[10px] text-slate-400 font-normal">/{totalCount}</span></p>
          </div>
        </div>

        {/* A枠 + B枠 quick chips */}
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-800/40 border border-white/5 rounded-lg px-2 py-1">
            <p className="text-[8px] text-slate-500 font-bold uppercase">A枠（接頭辞）</p>
            <p className="text-[11px] font-bold text-cyan-200 truncate">
              {equippedTitle.prefixId
                ? (PREFIX_TITLES.find(p => p.id === equippedTitle.prefixId)
                  || EVOLVED_TITLES.find(e => e.id === equippedTitle.prefixId))?.name || '—'
                : '—'}
            </p>
          </div>
          <div className="flex-1 bg-slate-800/40 border border-white/5 rounded-lg px-2 py-1">
            <p className="text-[8px] text-slate-500 font-bold uppercase">B枠（接尾辞）</p>
            <p className="text-[11px] font-bold text-indigo-200 truncate">
              {equippedTitle.suffixId
                ? (SUFFIX_TITLES.find(s => s.id === equippedTitle.suffixId)
                  || EVOLVED_TITLES.find(e => e.id === equippedTitle.suffixId))?.name || '—'
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/5 bg-slate-900/60 flex-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); soundManager.playSE(SE_IDS.UI_CLICK); }}
            className={`flex-1 flex flex-col items-center py-1.5 rounded-xl border text-[10px] font-bold transition-all active:scale-95
              ${activeTab === tab.key
                ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                : 'bg-slate-800/30 border-white/5 text-slate-400 hover:text-slate-200'
              }
            `}
          >
            <span className="material-icons-round text-sm mb-0.5">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 no-scrollbar">

        {/* A枠タブ */}
        {activeTab === 'prefix' && (
          <>
            <p className="text-[10px] text-slate-400 px-1">
              A枠は称号の接頭辞です。1つのみ装備できます。
              <span className="text-cyan-400 ml-1">（解放済: {unlockedTitles.prefixes?.length || 0}/{PREFIX_TITLES.length}）</span>
            </p>
            {PREFIX_TITLES.map(title => {
              const isUnlocked = unlockedTitles.prefixes?.includes(title.id);
              const isEquipped = equippedTitle.prefixId === title.id;
              const progress = !isUnlocked ? getTitleProgress(title, stats, currentRunStats, equippedTitle) : null;
              return (
                <TitleCard
                  key={title.id}
                  title={title}
                  isUnlocked={isUnlocked}
                  isEquipped={isEquipped}
                  onEquip={handleEquipPrefix}
                  progress={progress}
                  accentColor="from-cyan-900/20 to-indigo-900/20"
                />
              );
            })}
          </>
        )}

        {/* B枠タブ */}
        {activeTab === 'suffix' && (
          <>
            <p className="text-[10px] text-slate-400 px-1">
              B枠は称号の接尾辞です。1つのみ装備できます。
              <span className="text-indigo-400 ml-1">（解放済: {unlockedTitles.suffixes?.length || 0}/{SUFFIX_TITLES.length}）</span>
            </p>
            {SUFFIX_TITLES.map(title => {
              const isUnlocked = unlockedTitles.suffixes?.includes(title.id);
              const isEquipped = equippedTitle.suffixId === title.id;
              const progress = !isUnlocked ? getTitleProgress(title, stats, currentRunStats, equippedTitle) : null;
              return (
                <TitleCard
                  key={title.id}
                  title={title}
                  isUnlocked={isUnlocked}
                  isEquipped={isEquipped}
                  onEquip={handleEquipSuffix}
                  progress={progress}
                  accentColor="from-indigo-900/20 to-violet-900/20"
                />
              );
            })}
          </>
        )}

        {/* セット効果タブ */}
        {activeTab === 'set' && (
          <>
            <p className="text-[10px] text-slate-400 px-1">
              特定のA枠とB枠の組み合わせで発動する隠し効果です。
            </p>
            {TITLE_SET_BONUSES.map(set => {
              const prefix = PREFIX_TITLES.find(p => p.id === set.prefixId);
              const suffix = SUFFIX_TITLES.find(s => s.id === set.suffixId);
              const isActive = equippedTitle.prefixId === set.prefixId && equippedTitle.suffixId === set.suffixId;
              const prefixUnlocked = unlockedTitles.prefixes?.includes(set.prefixId);
              const suffixUnlocked = unlockedTitles.suffixes?.includes(set.suffixId);
              return (
                <SetBonusCard
                  key={set.id}
                  setBonus={set}
                  isActive={isActive}
                  prefixName={prefixUnlocked ? (prefix?.name || set.prefixId) : '???'}
                  suffixName={suffixUnlocked ? (suffix?.name || set.suffixId) : '???'}
                />
              );
            })}
          </>
        )}

        {/* 進化二つ名タブ */}
        {activeTab === 'evolved' && (
          <>
            <p className="text-[10px] text-slate-400 px-1">
              特定の称号を装備して極限条件を達成すると解放される上位称号です。
              <span className="text-yellow-400 ml-1">（解放済: {unlockedTitles.evolved?.length || 0}/{EVOLVED_TITLES.length}）</span>
            </p>
            {EVOLVED_TITLES.map(evo => {
              const isUnlocked = unlockedTitles.evolved?.includes(evo.id);
              const isEquipped = equippedTitle.prefixId === evo.id
                || equippedTitle.suffixId === evo.id
                || equippedTitle.evolvedId === evo.id;
              const progress = !isUnlocked ? getTitleProgress(evo, stats, currentRunStats, equippedTitle) : null;
              return (
                <EvolvedCard
                  key={evo.id}
                  evo={evo}
                  isUnlocked={isUnlocked}
                  isEquipped={isEquipped}
                  onEquip={handleEquipEvolved}
                  progress={progress}
                  stats={stats}
                  currentRunStats={currentRunStats}
                  equippedTitle={equippedTitle}
                />
              );
            })}
          </>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
};

export default TitleEncyclopediaScreen;
