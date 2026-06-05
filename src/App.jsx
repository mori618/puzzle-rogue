// リファクタリング後の App.jsx
import React from "react";
import ShopScreen from "./ShopScreen";
import TitleScreen from "./TitleScreen";
import PauseScreen from "./PauseScreen";
import HelpScreen from "./HelpScreen";
import StatsScreen from "./StatsScreen";
import CreditsScreen from "./CreditsScreen";
import SettingsScreen from "./SettingsScreen";
import StartOptionScreen from "./StartOptionScreen";
import TokenEncyclopediaScreen from "./TokenEncyclopediaScreen";
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { getEnchantDescription } from './constants/enchantments.js';
import { MAX_COMBO, MAX_TARGET, SAVE_KEY } from './constants/gameConstants.js';
import { formatJapaneseNumber } from './utils/numberUtils.js';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';
import { getEffectiveCost, getTokenDescription } from './utils/tokenUtils';
import { useGameState } from "./hooks/useGameState";

const App = () => {
  const gameState = useGameState();

  // JSX 内で使用するすべての状態や関数を展開
  const {
    isLoaded,
    hasSaveData,
    setHasSaveData,
    tokens,
    isGameOver,
    setIsGameOver,
    target,
    goalReached,
    shopItems,
    turn,
    cycleTotalCombo,
    shopRerollPrice,
    stars,
    activeBuffs,
    lastTurnCombo,
    lastErasedColorCounts,
    pendingShopItem,
    setPendingShopItem,
    showTitle, setShowTitle,
    showHelp, setShowHelp,
    showPause, setShowPause,
    showSettings, setShowSettings,
    showShop, setShowShop,
    showStats, setShowStats,
    showCredits, setShowCredits,
    showStartOption, setShowStartOption,
    showEncyclopedia, setShowEncyclopedia,
    settings,
    currentRunTotalCombo,
    currentRunStats,
    setCurrentRunStats,
    triggeredPassives,
    targetPulse,
    starPopups,
    comboPopups,
    currentToast,
    purchasingParticles,
    levelUpTokenId,
    isEndlessMode,
    selectedTokenDetail, setSelectedTokenDetail,
    selectedEnchantDetail, setSelectedEnchantDetail,
    tokenMoveInput, setTokenMoveInput,
    showGameClear, setShowGameClear,
    isPracticeMode, setIsPracticeMode,
    practiceTimeLimit, setPracticeTimeLimit,
    isPureMode, setIsPureMode,
    isEnchantShopUnlocked,
    tokenSlotExpansionCount,
    isAwakeningLevelUpBought,
    showMaxComboWarpDialog, setShowMaxComboWarpDialog,
    draggedToken, setDraggedToken,
    
    // ユーティリティ/Ref
    getTokenDynamicInfo,
    getTokenIcon,
    getAttributeBarStyles,
    isBeyondMode, setIsBeyondMode,
    passiveTokenPage, setPassiveTokenPage,
    activeTokenPage, setActiveTokenPage,
    passiveSwipeRef,
    activeSwipeRef,
    getCurseProgress,
    activateSkill,
    
    // Refs
    boardRef,
    timerRef,
    timerTextRef,
    comboRef,
    targetComboRef,
    
    // 計算値
    maxTurns,
    effectiveTarget,
    rows,
    cols,
    
    // 関数
    handleSettingsChange,
    notify,
    startNextCycle,
    skipTurns,
    resetGame,
    handleStartOptionSelection,
    handleGiveUp,
    purifyCurse,
    sellToken,
    buyItem,
    buyAwakeningItem,
    moveToken,
    handleChoice,
    handleStartPractice,
    toggleEnchantStatus,
    openShop,
    refreshShop,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = gameState;

  if (!isLoaded) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-primary font-bold">
        Loading...
      </div>
    );
  }

  if (showHelp) {
    return (
      <HelpScreen onClose={() => setShowHelp(false)} />
    );
  }

  if (showCredits) {
    return (
      <CreditsScreen onClose={() => setShowCredits(false)} />
    );
  }

  if (showSettings) {
    return (
      <SettingsScreen
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  if (showStats) {
    return (
      <StatsScreen
        currentRunStats={currentRunStats}
        onClose={() => setShowStats(false)}
      />
    );
  }

  if (showEncyclopedia) {
    return (
      <TokenEncyclopediaScreen onClose={() => setShowEncyclopedia(false)} />
    );
  }

  if (showTitle) {
    return (
      <TitleScreen
        hasSaveData={hasSaveData}
        onContinue={() => {
          setShowTitle(false);
          // if (engineRef.current && savedBoard) engineRef.current.init(savedBoard);
        }}
        onStart={() => {
          localStorage.removeItem(SAVE_KEY);
          setHasSaveData(false);
          resetGame();
          setShowStartOption(true);
          setShowTitle(false);
        }}
        onHelp={() => setShowHelp(true)}
        onStats={() => setShowStats(true)}
        onCredits={() => setShowCredits(true)}
        onSettings={() => setShowSettings(true)}
        onEncyclopedia={() => setShowEncyclopedia(true)}
        onPractice={handleStartPractice}
      />
    );
  }


  return (
    <div className="bg-background-dark font-display text-slate-100 h-screen overflow-hidden flex justify-center w-full">
      {showStartOption && (
        <StartOptionScreen onSelect={handleStartOptionSelection} />
      )}
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full flex flex-col relative bg-background-dark shadow-2xl overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Notification Banner (Top Left) - Refined and Larger */}
        <div className="absolute top-[86px] left-4 z-[200] pointer-events-none flex flex-col gap-3 max-w-[85%]">
          {currentToast && (
            <div key={currentToast.id} className="glass-panel border-white/20 p-3 rounded-2xl flex items-center gap-4 animate-token-toast shadow-2xl bg-slate-900/90 backdrop-blur-xl border-l-4 border-l-primary">
              <div className="relative w-12 h-12 shrink-0 border border-white/10 rounded-xl flex items-center justify-center bg-slate-800 shadow-inner">
                {currentToast.token && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg z-10" style={getAttributeBarStyles(currentToast.token?.attributes)}></div>
                    <span className={`material-icons-round text-2xl relative z-20 ${currentToast.token?.type === 'curse' || currentToast.token?.isCurse ? 'text-red-500' : 'text-slate-100'}`}>
                      {getTokenIcon(currentToast.token)}
                    </span>
                  </>
                )}
                {!currentToast.token && (
                  <span className="material-icons-round text-primary text-2xl">info</span>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0 pr-2 leading-snug">
                {currentToast.token && <span className="text-[13px] font-black text-white truncate drop-shadow-sm uppercase tracking-wider">{currentToast.token?.name}</span>}
                <span className={`${currentToast.token ? 'text-[11px] text-slate-300' : 'text-[13px] text-white'} font-bold leading-tight line-clamp-2`}>
                  {currentToast.actionText}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* --- Top Area Swipe Handler --- */}
        <div
          className="flex-none flex flex-col relative z-30"
        >
          {/* Top Status Bar */}
          <header className="relative z-10 px-4 pt-6 pb-2 flex justify-between items-center glass-panel border-b border-white/5 h-[76px] shrink-0">
            <div className="flex flex-col">
              {isPracticeMode ? (
                <>
                  <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">Mode</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white whitespace-nowrap tracking-wide">PRACTICE</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Current Stage</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white whitespace-nowrap">
                      <span className="text-[10px] uppercase text-slate-400 mr-1">Cycle</span>
                      {(currentRunStats?.currentClears || 0) + 1}
                    </span>
                    <span className="text-primary font-bold">/</span>
                    <span className="text-lg font-bold text-white whitespace-nowrap">
                      <span className="text-[10px] uppercase text-slate-400 mr-1">Turn</span>
                      {turn}{isEndlessMode ? ' ∞' : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPause(true)}
                className="flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/50 w-8 h-8 rounded-full border border-white/10 cursor-pointer active:scale-95 transition-all text-white"
                aria-label="Pause"
              >
                <span className="material-icons-round text-sm">pause</span>
              </button>
              {!isPracticeMode && (
                <>
                  <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded-full border border-white/10 relative">
                    <span className="material-icons-round text-yellow-400 text-sm">star</span>
                    <span className="font-bold text-sm tracking-wide">{formatJapaneseNumber(stars)}</span>
                    {starPopups.map((p) => (
                      <div key={p.id} className="value-popup text-yellow-300 left-1/2 -top-4 -translate-x-1/2 animate-float-up-fade text-sm">
                        +{formatJapaneseNumber(p.diff)}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={openShop}
                    className="flex items-center gap-1 bg-slate-800/50 hover:bg-slate-700/50 px-3 py-1 rounded-full border border-white/10 cursor-pointer active:scale-95 transition-all text-sm font-bold text-white"
                  >
                    <span className="material-icons-round text-primary text-sm">storefront</span>
                    <span>Shop</span>
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Main Stats Area */}
          {isPracticeMode ? (
            <section className="relative z-10 px-6 py-3 flex-none w-full animate-fade-in h-[104px] flex flex-col justify-center">
              <div className="bg-indigo-900/40 border border-indigo-500/30 p-2.5 rounded-2xl shadow-lg backdrop-blur-md flex flex-col gap-1.5">
                {/* Operation Time Control */}
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                      <span className="material-icons-round text-xs">timer</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Time</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-xl border border-white/5">
                    <button
                      onClick={() => {
                        setPracticeTimeLimit(prev => Math.max(1000, prev - 1000));
                        soundManager.playSE(SE_IDS.UI_CLICK);
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-all border border-white/5"
                    >
                      <span className="material-icons-round text-sm">remove</span>
                    </button>
                    <div className="w-12 flex flex-col items-center">
                      <span className="text-base font-mono font-black text-white leading-none">{(practiceTimeLimit / 1000).toFixed(0)}</span>
                      <span className="text-[7px] font-black text-indigo-400">SEC</span>
                    </div>
                    <button
                      onClick={() => {
                        setPracticeTimeLimit(prev => Math.min(60000, prev + 1000));
                        soundManager.playSE(SE_IDS.UI_CLICK);
                      }}
                      className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center active:scale-90 transition-all border border-white/5"
                    >
                      <span className="material-icons-round text-sm">add</span>
                    </button>
                  </div>
                </div>

                {/* Pure Mode Toggle */}
                <div className="flex items-center justify-between gap-2 border-t border-indigo-500/20 pt-1.5 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                      <span className="material-icons-round text-xs">psychology</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Pure Mode</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsPureMode(!isPureMode);
                      soundManager.playSE(SE_IDS.UI_CLICK);
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5 ${isPureMode ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-800 border border-white/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isPureMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="relative z-10 px-6 py-3 flex-none w-full">
              <div className={`flex items-center w-full p-2.5 rounded-2xl border transition-all duration-300 ${turn === maxTurns && !goalReached ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-shake-tension' : goalReached ? 'bg-green-950/20 border-green-500/30' : 'bg-slate-800/40 border-white/5 shadow-md'}`}>
                {/* Target Combo テキスト表示 (左) */}
                <div className="flex-1 flex items-center gap-2.5 min-w-0 pl-1 pr-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 shadow-inner transition-colors duration-300 ${turn === maxTurns && !goalReached ? 'bg-red-900 border-red-500/50 text-red-300' : goalReached ? 'bg-green-900/40 border-green-500/40 text-green-400' : 'bg-slate-800 border-white/10 text-primary'}`}>
                    <span className="material-icons-round text-xl">flag</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] uppercase font-bold text-left tracking-wider transition-colors duration-300 ${turn === maxTurns && !goalReached ? 'text-red-400' : goalReached ? 'text-green-400' : 'text-slate-400'}`}>Target Combo</span>
                    <span className={`text-lg font-mono font-bold truncate text-left leading-tight transition-colors duration-300 ${turn === maxTurns && !goalReached ? 'text-red-300 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : goalReached ? 'text-green-300 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : isBeyondMode ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.5)]' : 'text-slate-300'}`}>
                      {formatJapaneseNumber(isBeyondMode ? target : effectiveTarget)}
                    </span>
                  </div>
                </div>

                {/* 縦棒 (仕切り) 上下を少し開ける */}
                <div className={`w-[1px] h-8 flex-shrink-0 mx-1 rounded-full transition-colors duration-300 ${turn === maxTurns && !goalReached ? 'bg-red-500/30' : goalReached ? 'bg-green-500/30' : 'bg-white/10'}`}></div>

                {/* Current Combo テキスト表示 (右) */}
                <div className="flex-1 flex items-center gap-2.5 min-w-0 pl-2 pr-1 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 shadow-inner transition-colors duration-300 ${goalReached ? 'bg-green-900/40 border-green-500/40 text-green-400' : 'bg-slate-800 border-white/10 text-orange-500'}`}>
                    <span className="material-icons-round text-xl">whatshot</span>
                  </div>
                  <div className="flex flex-col min-w-0 relative">
                    <span className={`text-[10px] uppercase font-bold text-left tracking-wider transition-colors duration-300 ${goalReached ? 'text-green-400' : 'text-slate-400'}`}>Current Combo</span>
                    <span
                      ref={targetComboRef}
                      className={`text-lg font-mono font-bold truncate text-left leading-tight transition-colors duration-300 drop-shadow-sm ${targetPulse ? 'animate-target-pulse text-yellow-300' : goalReached ? 'text-green-300 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'text-white'}`}
                    >
                      {formatJapaneseNumber(cycleTotalCombo)}
                    </span>
                    {comboPopups.map((p) => (
                      <div key={p.id} className="value-popup text-orange-400 right-0 -top-2 animate-float-up-fade text-base">
                        +{formatJapaneseNumber(p.diff)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Token/Skill Belt */}
          {(() => {
            const TOKENS_PER_PAGE = 5;
            const maxSlots = 5 + (tokenSlotExpansionCount || 0);
            const passiveTokens = tokens.filter(t => t && t.type !== 'skill');
            const activeTokens = tokens.filter(t => t && t.type === 'skill');
            const passivePages = Math.ceil(Math.max(maxSlots, passiveTokens.length) / TOKENS_PER_PAGE);
            const activePages = Math.ceil(Math.max(maxSlots, activeTokens.length) / TOKENS_PER_PAGE);
            const safePassivePage = Math.min(passiveTokenPage, passivePages - 1);
            const safeActivePage = Math.min(activeTokenPage, activePages - 1);

            return (
              <section className={`relative z-30 px-6 py-1 flex-none mb-2 flex flex-col gap-1.5 justify-start ${isPracticeMode ? 'h-[110px]' : 'h-[196px]'}`}>
                {isPracticeMode ? (
                  <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center backdrop-blur-md shadow-inner h-full">
                    <div className="text-[10px] uppercase font-black text-slate-600 tracking-[0.3em] mb-3 flex items-center gap-2">
                      <span className="w-8 h-[1px] bg-slate-800"></span>
                      Practice Best
                      <span className="w-8 h-[1px] bg-slate-800"></span>
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-white/10 shadow-inner">
                        <span className="material-icons-round text-3xl text-slate-500">workspace_premium</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black font-mono text-white opacity-80">
                            {formatJapaneseNumber(currentRunStats.maxCombo || 0)}
                          </span>
                          <span className="text-xl font-black text-slate-500 uppercase tracking-tighter italic">Combo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Passive Tokens Row */}
                    <div>
                      <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider flex justify-between items-center">
                        <span>Passive Artifacts</span>
                        <div className="flex items-center gap-1">
                          {passivePages > 1 && (
                            <>
                              <button onClick={() => setPassiveTokenPage(p => Math.max(p - 1, 0))} disabled={safePassivePage === 0}
                                className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                                <span className="material-icons-round text-[12px]">chevron_left</span>
                              </button>
                              <span className="text-[9px] text-slate-600">{safePassivePage + 1}/{passivePages}</span>
                              <button onClick={() => setPassiveTokenPage(p => Math.min(p + 1, passivePages - 1))} disabled={safePassivePage === passivePages - 1}
                                className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                                <span className="material-icons-round text-[12px]">chevron_right</span>
                              </button>
                            </>
                          )}
                          <span className="text-[9px] ml-1">{passiveTokens.length}/{maxSlots}</span>
                        </div>
                      </h3>
                      <div className="overflow-hidden"
                        onTouchStart={e => { passiveSwipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                        onTouchEnd={e => {
                          if (!passiveSwipeRef.current) return;
                          const dx = e.changedTouches[0].clientX - passiveSwipeRef.current.x;
                          const dy = e.changedTouches[0].clientY - passiveSwipeRef.current.y;
                          passiveSwipeRef.current = null;
                          if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
                          if (dx < 0) setPassiveTokenPage(p => Math.min(p + 1, passivePages - 1));
                          else setPassiveTokenPage(p => Math.max(p - 1, 0));
                        }}
                        onMouseDown={e => {
                          const startX = e.clientX;
                          const onUp = eu => {
                            window.removeEventListener('mouseup', onUp);
                            const dx = eu.clientX - startX;
                            if (Math.abs(dx) < 30) return;
                            if (dx < 0) setPassiveTokenPage(p => Math.min(p + 1, passivePages - 1));
                            else setPassiveTokenPage(p => Math.max(p - 1, 0));
                          };
                          window.addEventListener('mouseup', onUp);
                        }}
                      >
                        <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${safePassivePage * 100}%)` }}>
                          {Array.from({ length: passivePages }).map((_, pageIdx) => (
                            <div key={pageIdx} className="grid grid-cols-5 gap-2 flex-shrink-0 w-full">
                              {Array.from({ length: TOKENS_PER_PAGE }).map((_, slotIdx) => {
                                const globalSlot = pageIdx * TOKENS_PER_PAGE + slotIdx;
                                const t = passiveTokens[globalSlot];
                                const isLocked = globalSlot >= maxSlots;
                                let borderColor = isLocked ? 'border-slate-800' : (t ? (t.rarity === 4 ? 'border-red-500/60' : t.rarity === 3 ? 'border-yellow-400/60' : t.rarity === 2 ? 'border-sky-400/60' : 'border-white/20') : 'border-white/5');
                                let shadowClass = '';
                                let animClass = '';
                                if (t && triggeredPassives.includes(t.instanceId || t.id)) {
                                  animClass = 'animate-bounce';
                                  shadowClass = 'shadow-[0_0_15px_rgba(255,255,255,0.8)]';
                                }
                                if (t && !animClass) {
                                  let conditionMet = false;
                                  switch (t.effect) {
                                    case 'color_count_bonus': {
                                      const countReq = t.params?.count || 0;
                                      const cColor = t.params?.color;
                                      conditionMet = cColor && (lastErasedColorCounts[cColor] || 0) >= countReq;
                                      break;
                                    }
                                    case 'combo_if_ge':
                                      conditionMet = lastTurnCombo >= (t.params?.combo || 0);
                                      break;
                                    case 'combo_if_le':
                                      conditionMet = lastTurnCombo <= (t.params?.combo || 0);
                                      break;
                                    default:
                                      break;
                                  }
                                  if (conditionMet) {
                                    borderColor = 'border-green-400/80';
                                    shadowClass = 'shadow-[0_0_15px_rgba(74,222,128,0.5)]';
                                  }
                                }
                                return (
                                  <div
                                    key={`passive-p${pageIdx}-${slotIdx}`}
                                    onClick={() => !isLocked && t && setSelectedTokenDetail({ token: t })}
                                    draggable={!!t && !isLocked}
                                    onDragStart={(e) => handleDragStart(e, t)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, globalSlot + 1, false)}
                                    onDragEnd={() => setDraggedToken(null)}
                                    className={`aspect-square rounded-tr-xl rounded-br-xl relative border transition-all duration-300 ${draggedToken === t ? 'opacity-40 scale-95 border-primary/50' : ''} ${animClass} ${shadowClass} ${levelUpTokenId === (t?.instanceId || t?.id) ? 'animate-token-levelup z-50' : ''} ${isLocked ? 'bg-slate-950/50 border-slate-800 opacity-40 cursor-not-allowed' : (t ? `bg-slate-800 ${borderColor} cursor-pointer hover:bg-white/5 hover:scale-105` : 'bg-slate-900/30 border-white/5 border-dashed')}`}
                                  >

                                    <div className="absolute inset-0 rounded-tr-xl rounded-br-xl overflow-hidden">
                                      {/* 属性バー */}
                                      {t && (
                                        <div
                                          className="absolute left-0 top-0 bottom-0 w-1 z-30"
                                          style={getAttributeBarStyles(t?.attributes)}
                                        />
                                      )}
                                      {isLocked ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <span className="material-icons-round text-slate-700 text-lg">lock</span>
                                        </div>
                                      ) : t ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          {t.isCountPassive && (
                                            <div className="absolute inset-0 bg-primary/5">
                                              <div
                                                className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-500"
                                                style={{ height: `${Math.min(100, ((t.charge || 0) / (t.values?.[(t.level || 1) - 1] || 30)) * 100)}%` }}
                                              />
                                            </div>
                                          )}
                                          <span className={`material-icons-round text-2xl relative z-10 ${t?.type === 'curse' || t?.isCurse ? 'text-red-500' : animClass ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : shadowClass ? 'text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-slate-400'}`}>
                                            {getTokenIcon(t)}
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                    {t && !isLocked && (
                                      <>
                                        {/* 属性丸は削除 */}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20">
                                          {t.level || 1}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                      {passivePages > 1 && (
                        <div className="flex justify-center gap-1 mt-1">
                          {Array.from({ length: passivePages }).map((_, i) => (
                            <button key={i} onClick={() => setPassiveTokenPage(i)}
                              className={`h-1 rounded-full transition-all duration-200 ${i === safePassivePage ? 'bg-primary w-3' : 'bg-slate-600 w-1'}`} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active Tokens Row */}
                    <div>
                      <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider flex justify-between items-center">
                        <span>Active Spells</span>
                        <div className="flex items-center gap-1">
                          {activePages > 1 && (
                            <>
                              <button onClick={() => setActiveTokenPage(p => Math.max(p - 1, 0))} disabled={safeActivePage === 0}
                                className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                                <span className="material-icons-round text-[12px]">chevron_left</span>
                              </button>
                              <span className="text-[9px] text-slate-600">{safeActivePage + 1}/{activePages}</span>
                              <button onClick={() => setActiveTokenPage(p => Math.min(p + 1, activePages - 1))} disabled={safeActivePage === activePages - 1}
                                className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                                <span className="material-icons-round text-[12px]">chevron_right</span>
                              </button>
                            </>
                          )}
                          <span className="text-[9px] ml-1">{activeTokens.length}/{maxSlots}</span>
                        </div>
                      </h3>
                      <div className="overflow-hidden"
                        onTouchStart={e => { activeSwipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                        onTouchEnd={e => {
                          if (!activeSwipeRef.current) return;
                          const dx = e.changedTouches[0].clientX - activeSwipeRef.current.x;
                          const dy = e.changedTouches[0].clientY - activeSwipeRef.current.y;
                          activeSwipeRef.current = null;
                          if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
                          if (dx < 0) setActiveTokenPage(p => Math.min(p + 1, activePages - 1));
                          else setActiveTokenPage(p => Math.max(p - 1, 0));
                        }}
                        onMouseDown={e => {
                          const startX = e.clientX;
                          const onUp = eu => {
                            window.removeEventListener('mouseup', onUp);
                            const dx = eu.clientX - startX;
                            if (Math.abs(dx) < 30) return;
                            if (dx < 0) setActiveTokenPage(p => Math.min(p + 1, activePages - 1));
                            else setActiveTokenPage(p => Math.max(p - 1, 0));
                          };
                          window.addEventListener('mouseup', onUp);
                        }}
                      >
                        <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${safeActivePage * 100}%)` }}>
                          {Array.from({ length: activePages }).map((_, pageIdx) => (
                            <div key={pageIdx} className="grid grid-cols-5 gap-2 flex-shrink-0 w-full">
                              {Array.from({ length: TOKENS_PER_PAGE }).map((_, slotIdx) => {
                                const globalSlot = pageIdx * TOKENS_PER_PAGE + slotIdx;
                                const t = activeTokens[globalSlot];
                                const isLocked = globalSlot >= maxSlots;
                                const isSkill = t?.type === 'skill';
                                const charge = t?.charge || 0;
                                const cost = getEffectiveCost(t, currentRunStats, tokens, activeBuffs);
                                const progress = isSkill ? Math.min(100, (charge / cost) * 100) : 100;
                                const isReady = isSkill && charge >= cost;
                                const relatedBuffs = t ? activeBuffs.filter(b => b.tokenId === (t.instanceId || t.id)) : [];
                                const activeBuff = relatedBuffs.length > 0 ? relatedBuffs[0] : null;
                                const stackCount = relatedBuffs.length;
                                const buffProgress = activeBuff ? Math.min(100, (activeBuff.duration / activeBuff.maxDuration) * 100) : 0;
                                let animClass = '';
                                let triggeredShadow = '';
                                if (t && triggeredPassives.includes(t.instanceId || t.id)) {
                                  animClass = 'animate-bounce';
                                  triggeredShadow = 'shadow-[0_0_15px_rgba(255,255,255,0.8)]';
                                }
                                const readyBorder = t?.isCurse
                                  ? 'border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.35)]'
                                  : (t && t.rarity === 3 ? 'border-yellow-400/60 shadow-[0_0_10px_rgba(250,204,21,0.25)]' : t && t.rarity === 2 ? 'border-sky-400/60 shadow-[0_0_10px_rgba(56,189,248,0.25)]' : 'border-primary/50 shadow-[0_0_10px_rgba(91,19,236,0.25)]');
                                const notReadyBorder = t?.isCurse
                                  ? 'border-red-500/30'
                                  : (t && t.rarity === 3 ? 'border-yellow-400/30' : t && t.rarity === 2 ? 'border-sky-400/30' : 'border-white/10');
                                const buffBorder = stackCount > 1 ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse' : stackCount === 1 ? 'border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : '';
                                let containerClasses = isLocked
                                  ? 'bg-slate-950/50 border-slate-800 opacity-40 cursor-not-allowed'
                                  : (t
                                    ? (stackCount > 0 ? `bg-slate-800 ${buffBorder} cursor-pointer group hover:scale-105` : (isReady ? `bg-slate-800 ${readyBorder} cursor-pointer group hover:scale-105` : `bg-slate-900 ${notReadyBorder} opacity-80 cursor-pointer`))
                                    : 'bg-slate-900/30 border-white/5 border-dashed');
                                containerClasses = `${containerClasses} ${animClass} ${triggeredShadow}`;
                                return (
                                  <div
                                    key={`active-p${pageIdx}-${slotIdx}`}
                                    onClick={() => !isLocked && t && setSelectedTokenDetail({ token: t })}
                                    draggable={!!t && !isLocked}
                                    onDragStart={(e) => handleDragStart(e, t)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, globalSlot + 1, true)}
                                    onDragEnd={() => setDraggedToken(null)}
                                    className={`aspect-square rounded-tr-xl rounded-br-xl relative border transition-all duration-300 ${draggedToken === t ? 'opacity-40 scale-95 border-primary/50' : ''} ${levelUpTokenId === (t?.instanceId || t?.id) ? 'animate-token-levelup z-50' : ''} ${containerClasses}`}
                                  >

                                    <div className="absolute inset-0 rounded-tr-xl rounded-br-xl overflow-hidden">
                                      {/* 属性バー */}
                                      {t && (
                                        <div
                                          className="absolute left-0 top-0 bottom-0 w-1 z-30 transition-all"
                                          style={getAttributeBarStyles(t?.attributes)}
                                        />
                                      )}
                                      {isLocked ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <span className="material-icons-round text-slate-700 text-lg">lock</span>
                                        </div>
                                      ) : t ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="absolute inset-0 bg-primary/10">
                                            {isSkill && <div
                                              className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${t?.isCurse ? 'bg-red-500/30' : 'bg-primary/20'}`}
                                              style={{ height: `${progress}%` }}
                                            />}
                                            {stackCount > 0 && activeBuff && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/60 to-blue-400/30 transition-all duration-500" style={{ height: `${buffProgress}%` }}></div>}
                                          </div>
                                          <span className={`material-icons-round text-2xl drop-shadow-md relative z-10 ${animClass ? 'text-white' : stackCount > 0 ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : (t?.isCurse || t?.type === 'curse') ? (isReady ? 'text-red-400' : 'text-red-700') : (isReady ? 'text-primary' : 'text-slate-500')}`}>
                                            {getTokenIcon(t)}
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>

                                    {t && !isLocked && (
                                      <>
                                        {/* 属性丸は削除 */}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20">
                                          {t.level || 1}
                                        </div>
                                        {isSkill && t.cost > 0 && (
                                          <div className="absolute top-[-4px] right-1 z-20">
                                            <span className="text-[10px] text-slate-300 font-mono font-bold drop-shadow-md">{charge}/{cost}</span>
                                          </div>
                                        )}
                                        {stackCount > 0 && activeBuff && (
                                          <div className="absolute top-[-4px] left-1 z-20">
                                            <span className="text-[10px] text-cyan-300 font-bold drop-shadow-md">{activeBuff.duration}t</span>
                                          </div>
                                        )}
                                        {stackCount > 1 && (
                                          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-cyan-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20 shadow-sm">
                                            x{stackCount}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                      {activePages > 1 && (
                        <div className="flex justify-center gap-1 mt-1">
                          {Array.from({ length: activePages }).map((_, i) => (
                            <button key={i} onClick={() => setActiveTokenPage(i)}
                              className={`h-1 rounded-full transition-all duration-200 ${i === safeActivePage ? 'bg-primary w-3' : 'bg-slate-600 w-1'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>

            );
          })()}



          {/* 操作時間ゲージ（トークンの下） */}
          <div className="relative z-30 px-6 mb-2 flex items-center gap-2">
            <span ref={timerTextRef} className="text-sm font-mono font-bold text-slate-300 min-w-[3ch] text-right"></span>
            <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
              <div ref={timerRef} className="h-full bg-gradient-to-r from-green-400 to-emerald-600 w-full transition-all duration-0 ease-linear shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-full"></div>
            </div>
          </div>

          {/* Contextual Action Button (Floating) */}
          <div className="absolute bottom-[50%] left-0 right-0 z-30 px-6 flex justify-center pointer-events-none">
            {goalReached && turn <= maxTurns && (
              <button
                onClick={skipTurns}
                className="pointer-events-auto bg-primary text-white font-bold py-3 px-8 rounded-full shadow-[0_4px_20px_rgba(91,19,236,0.5)] border border-white/20 flex items-center gap-2 transform transition hover:scale-105 active:scale-95 animate-bounce"
              >
                <span>NEXT GOAL REACHED</span>
                <span className="material-icons-round">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Puzzle Grid Area */}
          <section className="relative z-20 flex-1 bg-slate-900 rounded-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Grid Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black opacity-90"></div>



            <div className="relative w-full h-full p-4 pt-4 flex flex-col justify-start">
              {/* コンボ表示 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex justify-center w-full">
                <div ref={comboRef} className="combo-display"></div>
              </div>

              {/* Timer Bar はトークンベルトの下に移動済み */}

              {/* The 6x5 Grid Container with Overlays */}
              <div className="w-full relative" style={{ aspectRatio: `${cols} / ${rows}` }}>

                {/* Layer 1: Puzzle Board (Always rendered behind) */}
                <div
                  ref={boardRef}
                  className="w-full h-full absolute inset-0 z-0"
                  style={{ touchAction: "none" }}
                >
                  {/* PuzzleEngine renders orbs here */}
                </div>

                {/* Layer 2: Cycle Clear Overlay */}
                {turn > maxTurns && goalReached && !isGameOver && (
                  <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in px-8 text-center">
                    <h2 className="text-4xl text-yellow-400 font-black mb-2 tracking-widest font-display italic drop-shadow-glow w-full">
                      {isBeyondMode ? '∞ CLEARED!' : 'CLEARED!'}
                    </h2>
                    <p className="text-slate-300 text-sm mb-8 font-bold leading-relaxed">
                      目標達成！<br />装備を整えて次のサイクルへ挑もう
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                      <button
                        onClick={() => setShowShop(true)}
                        className="group bg-slate-800 text-white py-4 rounded-2xl font-bold border border-white/10 hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-3 w-full"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                          <span className="material-icons-round text-yellow-400 text-lg">storefront</span>
                        </div>
                        <span>ショップで強化</span>
                      </button>

                      {currentRunStats?.hasReachedMaxCombo && ((currentRunStats?.currentClears || 0) + 1 < 25) && (
                        <button
                          onClick={() => startNextCycle(25)}
                          className="bg-gradient-to-r from-red-600 to-purple-800 text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 w-full animate-pulse-slow"
                        >
                          <span className="material-icons-round">bolt</span>
                          <span>ラストステージへ挑む</span>
                        </button>
                      )}

                      {/* サイクル25クリア時に彼岸モードボタンを表示 */}
                      {!isBeyondMode && (currentRunStats?.currentClears || 0) + 1 >= 25 && (
                        <button
                          onClick={() => {
                            setIsBeyondMode(true);
                            startNextCycle();
                            notify('【彼岸】への扉が開かれた…');
                          }}
                          className="bg-gradient-to-r from-violet-900 via-fuchsia-700 to-violet-900 text-white py-4 rounded-2xl font-bold shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 w-full border border-fuchsia-400/30"
                        >
                          <span className="material-icons-round text-fuchsia-300">all_inclusive</span>
                          <span className="text-fuchsia-200">彼岸へ至る</span>
                        </button>
                      )}

                      <button
                        onClick={() => startNextCycle()}
                        className="bg-gradient-to-r from-primary to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 w-full animate-pulse-slow"
                      >
                        <span>次のエリアへ</span>
                        <span className="material-icons-round">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Layer X: Max Combo Warp Dialog */}
                {showMaxComboWarpDialog && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border-2 border-primary/50 rounded-2xl p-6 text-center max-w-sm w-full shadow-[0_0_50px_rgba(var(--color-primary),0.3)]">
                      <span className="material-icons-round text-5xl text-primary mb-4 block">bolt</span>
                      <h2 className="text-2xl font-bold text-white mb-2 whitespace-pre-wrap">限界突破</h2>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        あなたは神の領域（コンボ限界）に到達しました。<br />
                        全てを飛ばして、最終試練である「ラストステージ（サイクル25）」へ直行しますか？
                      </p>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setShowMaxComboWarpDialog(false);
                            startNextCycle(25);
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-all"
                        >
                          はい（ラストへ直行）
                        </button>
                        <button
                          onClick={() => setShowMaxComboWarpDialog(false)}
                          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 px-4 rounded-xl transition-all"
                        >
                          いいえ（そのまま続ける）
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Layer 3: Game Over Overlay */}
                {isGameOver && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in px-8 text-center">
                    <span className="material-icons-round text-7xl text-red-500 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">broken_image</span>
                    <h2 className="text-4xl font-black font-display text-white mb-2 tracking-tighter">GAME OVER</h2>
                    <p className="text-slate-400 mb-6 text-sm font-medium">目標未達成...<br />リトライして再挑戦しよう</p>

                    <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-4 mb-8 w-full max-w-[280px] grid grid-cols-2 gap-4 animate-fade-in">
                      <div className="text-center">
                        <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">最終到達サイクル</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">{(currentRunStats?.currentClears || 0) + 1}</div>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">最大コンボ</div>
                        <div className="text-2xl font-black text-yellow-400 font-mono mt-1">{currentRunStats?.maxCombo || 0}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                      <button onClick={handleGiveUp} className="w-full bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold text-sm active:scale-95 hover:bg-slate-700 transition-colors border border-white/5">
                        リトライ
                      </button>
                      <button
                        onClick={() => {
                          setIsGameOver(false);
                          setShowShop(false);
                          setIsPracticeMode(false);
                          setShowTitle(true);
                          setCurrentRunStats(prev => ({ ...prev, maxCombo: 0 }));
                        }}
                        className="w-full bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold text-sm active:scale-95 hover:bg-slate-700 transition-colors border border-white/5 flex items-center justify-center gap-1"
                      >
                        <span className="material-icons-round text-sm">home</span>
                        タイトルに戻る
                      </button>
                    </div>
                  </div>
                )}


              </div>


            </div>
          </section>

          {/* Shop Overlay */}
          {
            showShop && (
              <div className="absolute inset-0 z-50 bg-background-dark">
                <ShopScreen
                  items={shopItems}
                  stars={stars}
                  onBuy={buyItem}
                  onClose={() => setShowShop(false)}
                  onRefresh={refreshShop}
                  goalReached={goalReached}
                  rerollPrice={shopRerollPrice}
                  onPause={() => setShowPause(true)}
                  isEnchantShopUnlocked={isEnchantShopUnlocked}
                  tokenSlotExpansionCount={tokenSlotExpansionCount}
                  onAwakeningBuy={buyAwakeningItem}
                  isAwakeningLevelUpBought={isAwakeningLevelUpBought}
                />
              </div>
            )
          }

          {
            showPause && (
              <div className="absolute inset-0 z-[400] bg-background-dark">
                <PauseScreen
                  onResume={() => setShowPause(false)}
                  onTitle={() => {
                    setShowPause(false);
                    setShowShop(false);
                    setIsPracticeMode(false);
                    setShowTitle(true);
                    // 練習モード離脱時などに最大コンボをクリア
                    setCurrentRunStats(prev => ({ ...prev, maxCombo: 0 }));
                  }}
                  onHelp={() => setShowHelp(true)}
                  onStats={() => setShowStats(true)}
                  onCredits={() => setShowCredits(true)}
                  onSettings={() => setShowSettings(true)}
                />
              </div>
            )
          }

          {/* 設定画面 (ポーズ画面より上) */}
          {
            showSettings && (
              <div className="absolute inset-0 z-[450] bg-background-dark">
                <SettingsScreen
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  onClose={() => setShowSettings(false)}
                />
              </div>
            )
          }

          {
            showCredits && (
              <div className="absolute inset-0 z-[500] bg-background-dark">
                <CreditsScreen onClose={() => setShowCredits(false)} />
              </div>
            )
          }

          {/* Layer 0: Game Clear Screen (Full Overlay) */}
          {(showGameClear || (turn > maxTurns && goalReached && !isBeyondMode && (currentRunStats?.currentClears || 0) + 1 >= 25)) && (
            <div className="absolute inset-0 z-[1100] bg-slate-950/98 backdrop-blur-xl animate-fade-in flex flex-col items-center justify-start overflow-y-auto custom-scrollbar pt-12 pb-24 px-6 select-none shadow-2xl">
              <div className="flex flex-col items-center mb-10 mt-4 shrink-0">
                <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mb-6 border border-yellow-400/30 shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                  <span className="material-icons-round text-6xl text-yellow-400 drop-shadow-glow animate-pulse-slow">emoji_events</span>
                </div>
                <h1 className="text-5xl text-yellow-400 font-black tracking-widest font-display italic drop-shadow-glow text-center">GAME CLEARED!</h1>
                <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Cycle 25 Complete</p>
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-4 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
              </div>

              {/* Statistics Card */}
              <div className="w-full max-w-sm bg-slate-900/60 rounded-3xl p-8 mb-10 border border-white/10 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-icons-round text-6xl rotate-12">trending_up</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs font-black tracking-wider uppercase">End Game Result</span>
                  <span className="bg-yellow-400/10 text-yellow-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-yellow-400/20">UNBELIEVABLE</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-end justify-between border-b border-white/5 pb-4">
                    <span className="text-slate-500 text-xs font-bold">Total Combo Score</span>
                    <span className="text-3xl text-white font-black font-mono tracking-tighter drop-shadow-sm">{formatJapaneseNumber(cycleTotalCombo)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-slate-500 text-xs font-bold">Total Run Combo</span>
                    <span className="text-sm text-slate-300 font-mono font-bold">{formatJapaneseNumber(currentRunTotalCombo)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-slate-500 text-xs font-bold">Cycles Cleared</span>
                    <span className="text-sm text-slate-300 font-mono font-bold">{(currentRunStats?.currentClears || 0) + 1} / 25</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-bold">Stars Spent</span>
                    <span className="text-sm text-slate-300 font-mono font-bold">{currentRunStats?.currentStarsSpent || 0} ★</span>
                  </div>
                </div>
              </div>

              {/* Token Summary Header */}
              <div className="w-full max-w-sm flex items-center gap-3 mb-6 shrink-0 opacity-80">
                <span className="material-icons-round text-primary text-xl">workspace_premium</span>
                <h3 className="text-xs font-black text-slate-300 tracking-widest uppercase">Victory Artifacts</h3>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>

              {/* Tokens Collection Grid */}
              <div className="grid grid-cols-1 gap-4 w-full max-w-sm mb-12 shrink-0">
                {tokens.filter(t => t !== null).map((t, idx) => {
                  const lv = t.level || 1;
                  const isSkill = t.type === 'skill';
                  return (
                    <div key={idx} className="bg-slate-900/40 rounded-3xl p-4 border border-white/5 flex items-center gap-5 backdrop-blur-sm group hover:border-white/20 transition-all active:scale-[0.98]">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden ${(t.isCurse || t.type === 'curse') ? 'bg-red-600/20 text-red-400 border border-red-500/20 group-hover:bg-red-600/30' : isSkill ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600/30' : 'bg-purple-600/20 text-purple-400 border border-purple-500/20 group-hover:bg-purple-600/30'}`}>
                        <span className="material-icons-round text-3xl">
                          {getTokenIcon(t)}
                        </span>
                        {/* 属性丸は削除 */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white truncate italic group-hover:text-primary transition-colors">{t.name}</h4>
                          <span className="text-xs font-black text-amber-400">Lv.{lv}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex text-gold text-[10px]">
                            {Array.from({ length: t.rarity || 1 }).map((_, i) => (
                              <span key={i} className="material-icons-round drop-shadow-glow">star</span>
                            ))}
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${isSkill ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {isSkill ? 'Skill' : 'Passive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Victory Actions */}
              <div className="flex flex-col gap-4 w-full max-w-sm mt-auto mb-10 shrink-0">
                {/* 彼岸モードボタン (サイクル25クリア時のメインおすすめ) */}
                <button
                  onClick={() => {
                    setShowGameClear(false);
                    setIsBeyondMode(true);
                    startNextCycle();
                    notify('【彼岸】への扉が開かれた…');
                  }}
                  className="bg-gradient-to-r from-violet-900 via-fuchsia-700 to-violet-900 text-white py-5 rounded-3xl font-black shadow-[0_15px_30px_rgba(168,85,247,0.4)] hover:shadow-[0_20px_40px_rgba(168,85,247,0.5)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 w-full border border-fuchsia-400/30"
                >
                  <span className="material-icons-round text-fuchsia-300">all_inclusive</span>
                  <span className="font-display italic tracking-widest text-lg text-fuchsia-200">彼岸へ至る</span>
                </button>


                <button
                  onClick={() => {
                    setShowGameClear(false);
                    setShowTitle(true);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/5"
                >
                  <span className="material-icons-round">home</span>
                  <span>Title Menu</span>
                </button>
              </div>
            </div>
          )}

          {/* Pending Shop Item Modal */}
          {
            pendingShopItem && (
              <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <h3 className="text-xl font-bold font-display text-white mb-1 text-center italic">{pendingShopItem.name}</h3>
                  <div className="flex justify-center text-gold text-sm mb-2">
                    {Array.from({ length: pendingShopItem.rarity || 1 }).map((_, i) => (
                      <span key={i} className="material-icons-round drop-shadow-md">star</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 text-center mb-6">既に所持しています。</p>

                  <div className="flex flex-col gap-3">
                    {(() => {
                      const existingToken = tokens.find(t => t?.id === pendingShopItem.id);
                      const isMaxLevel = existingToken && (existingToken.level || 1) >= (existingToken.values?.length || 3);
                      return (
                        <button
                          onClick={() => !isMaxLevel && handleChoice("upgrade")}
                          disabled={isMaxLevel}
                          className={`py-3 rounded-xl font-bold active:scale-95 shadow-lg transition-opacity ${isMaxLevel ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50' : 'bg-primary text-white shadow-primary/25'}`}
                        >
                          {isMaxLevel ? `最大Lv到達済み` : `強化 (Lv UP)`}
                        </button>
                      );
                    })()}
                    <button onClick={() => handleChoice("new")} className="bg-slate-700 text-white py-3 rounded-xl font-bold active:scale-95">
                      2つ目を装備
                    </button>
                    <button onClick={() => setPendingShopItem(null)} className="text-slate-400 text-xs font-bold py-2 mt-2">
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {/* Token Detail Modal */}
          {
            selectedTokenDetail && (() => {
              const snapshotToken = selectedTokenDetail.token;
              const t = tokens.find(tok => tok.instanceId === snapshotToken.instanceId) || snapshotToken;
              const lv = t.level || 1;
              const isSkill = t.type === 'skill';
              const charge = t.charge || 0;
              const cost = getEffectiveCost(t);
              const isReady = isSkill && charge >= cost;
              const enchList = t.enchantments || [];
              return (
                <div className="fixed inset-0 z-[450] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6" onClick={() => setSelectedTokenDetail(null)}>
                  {selectedTokenDetail.actionText && (
                    <div className="text-xl md:text-3xl font-bold text-white text-center mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,1)] px-4 py-2 bg-black/40 rounded-xl border border-white/10">
                      {selectedTokenDetail.actionText}
                    </div>
                  )}
                  <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border border-primary/30 shadow-[0_0_40px_rgba(91,19,236,0.15)]" onClick={e => e.stopPropagation()}>
                    {/* ヘッダー */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-tr-xl rounded-br-xl relative flex items-center justify-center overflow-hidden ${(t.isCurse || t.type === 'curse') ? 'bg-red-500/20 border border-red-500/30' : isSkill ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-purple-500/20 border border-purple-500/30'}`}>
                        {/* 属性バー */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 z-30"
                          style={getAttributeBarStyles(t?.attributes)}
                        />
                        <span className={`material-icons-round text-2xl ${(t.isCurse || t.type === 'curse') ? 'text-red-400' : isSkill ? 'text-blue-400' : 'text-purple-400'}`}>
                          {getTokenIcon(t)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold font-display text-white italic leading-tight">{t.name}</h3>
                        <div className="flex text-gold text-[10px] mt-0.5">
                          {Array.from({ length: t.rarity || 1 }).map((_, i) => (
                            <span key={i} className="material-icons-round drop-shadow-md">star</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSkill ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {isSkill ? 'スキル' : 'パッシブ'}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400">Lv.{lv}</span>
                        </div>
                        {/* 属性丸は削除 */}
                      </div>
                    </div>

                    {/* 効果説明 */}
                    <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                      <p className="text-xs text-slate-300 leading-relaxed">{getTokenDescription(t, lv, currentRunStats, tokens, activeBuffs)}</p>

                      {/* 動的情報の表示 (メイン) */}
                      {(() => {
                        const dynamicInfos = getTokenDynamicInfo(t, lv, currentRunStats, tokens, activeBuffs, { stars });
                        if (dynamicInfos && dynamicInfos.length > 0) {
                          return (
                            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                              {dynamicInfos.map((info, idx) => (
                                <div key={`dyn-${idx}`} className="flex justify-between items-center text-[10px]">
                                  <span className={`px-2 py-0.5 rounded-sm font-bold tracking-wider ${info.type === 'buff' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                    {info.label}
                                  </span>
                                  <span className={`font-mono font-bold text-[11px] ${info.type === 'boost' ? 'text-green-400' : 'text-slate-200'}`}>
                                    {info.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* コピー状態の表示 */}
                      {t.effect === 'copy_left' && (() => {
                        const currentIndex = tokens.findIndex(tok => tok?.instanceId === t.instanceId);
                        const target = currentIndex > 0 ? tokens[currentIndex - 1] : null;
                        if (target) {
                          return (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                                  <span className="material-icons-round text-[10px] text-indigo-400">content_copy</span>
                                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-tight">コピー中</span>
                                </div>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
                              </div>
                              <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-lg border border-white/5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(target.isCurse || target.type === 'curse') ? 'bg-red-500/10' : target.type === 'skill' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                                  <span className={`material-icons-round text-lg ${(target.isCurse || target.type === 'curse') ? 'text-red-400' : target.type === 'skill' ? 'text-blue-400' : 'text-purple-400'}`}>
                                    {getTokenIcon(target)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-white truncate">{target.name}</p>
                                    <span className="text-[9px] font-bold text-amber-400 ml-2 whitespace-nowrap">Lv.{target.level || 1}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate opacity-80">{getTokenDescription(target, target.level || 1, currentRunStats, tokens, activeBuffs)}</p>
                                  {/* 動的情報の表示 (コピー対象) */}
                                  {(() => {
                                    const dynamicInfos = getTokenDynamicInfo(target, target.level || 1, currentRunStats, tokens, activeBuffs, { stars });
                                    if (dynamicInfos && dynamicInfos.length > 0) {
                                      return (
                                        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex flex-col gap-1">
                                          {dynamicInfos.map((info, idx) => (
                                            <div key={`copy-dyn-${idx}`} className="flex justify-between items-center text-[9px]">
                                              <span className={`px-1.5 py-0.5 rounded-sm font-bold ${info.type === 'buff' ? 'bg-amber-500/10 text-amber-400/80' : 'bg-indigo-500/10 text-indigo-300/80'}`}>
                                                {info.label}
                                              </span>
                                              <span className={`font-mono font-bold ${info.type === 'boost' ? 'text-green-400/90' : 'text-slate-300/90'}`}>
                                                {info.value}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex items-center gap-2 text-amber-500/60 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                                <span className="material-icons-round text-sm">warning</span>
                                <p className="text-[10px] font-medium leading-tight">左隣にトークンがありません。<br />右側に配置することで効果をコピーします。</p>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* スキルチャージ状態 */}
                    {isSkill && (
                      <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">チャージ</span>
                          <span className={`text-xs font-bold ${isReady ? 'text-green-400' : 'text-orange-400'}`}>{charge} / {cost}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${isReady ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, (charge / cost) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}

                    {/* エンチャント情報（複数表示対応） */}
                    {enchList.length > 0 ? (
                      enchList.map((enc, encIdx) => {
                        const encIsDisabled = enc.disabled;
                        return (
                          <div
                            key={encIdx}
                            onClick={() => setSelectedEnchantDetail({ tokenInstanceId: t.instanceId, enchantIndex: encIdx })}
                            className={`rounded-xl p-3 mb-3 border cursor-pointer hover:scale-[1.02] transition-transform ${encIsDisabled ? 'bg-slate-700/50 border-slate-600/50' : 'bg-amber-500/10 border-amber-500/20'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`material-icons-round text-sm ${encIsDisabled ? 'text-slate-400' : 'text-amber-400'}`}>auto_fix_high</span>
                              <span className={`text-xs font-bold ${encIsDisabled ? 'text-slate-400' : 'text-amber-400'}`}>{enc.name}</span>
                              {encIsDisabled && <span className="ml-auto text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-sm">無効</span>}
                            </div>
                            <p className={`text-[11px] leading-relaxed ${encIsDisabled ? 'text-slate-500' : 'text-amber-200/70'}`}>{getEnchantDescription(enc.id)}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-slate-900/40 rounded-xl p-3 mb-3 border border-dashed border-white/10">
                        <p className="text-[11px] text-slate-600 text-center">エンチャントなし</p>
                      </div>
                    )}

                    {/* 並び替えセクション */}
                    {(() => {
                      const sameTypeTokens = tokens.filter(tok => tok && (isSkill ? tok.type === 'skill' : tok.type !== 'skill'));
                      const currentPos = sameTypeTokens.findIndex(tok => tok.instanceId === t.instanceId) + 1;
                      const total = sameTypeTokens.length;
                      if (total <= 1) return null;
                      return (
                        <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">並び替え</span>
                            <span className="text-[10px] text-slate-600">現在: <span className="text-slate-300 font-bold">{currentPos}</span> / {total} 番目</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              max={total}
                              value={tokenMoveInput}
                              onChange={e => setTokenMoveInput(e.target.value)}
                              onFocus={e => e.target.select()}
                              placeholder={`1〜${total}`}
                              className="flex-1 bg-slate-700 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors text-center font-mono"
                            />
                            <button
                              onClick={() => {
                                const pos = parseInt(tokenMoveInput, 10);
                                if (!isNaN(pos) && pos >= 1 && pos <= total) {
                                  moveToken(t, pos);
                                  setTokenMoveInput('');
                                }
                              }}
                              disabled={(() => {
                                const pos = parseInt(tokenMoveInput, 10);
                                return isNaN(pos) || pos < 1 || pos > total || pos === currentPos;
                              })()}
                              className="px-4 py-2 rounded-lg bg-primary/80 hover:bg-primary text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              移動
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ボタン群 */}
                    <div className="flex flex-col gap-2 mt-4">
                      {isSkill && (
                        <button
                          onClick={() => { setSelectedTokenDetail(null); activateSkill(t, selectedTokenDetail.index); }}
                          disabled={!isReady}
                          className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${isReady ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                        >
                          {isReady ? 'スキル発動' : 'チャージ不足'}
                        </button>
                      )}
                      {/* 呪い解除条件の表示 */}
                      {(t.type === 'curse' || t.isCurse) && (() => {
                        const prog = getCurseProgress(t);
                        if (!prog) return null;
                        return (
                          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-3 mb-2 flex flex-col gap-2 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)] relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-red-400">
                                  <span className="material-icons-round text-sm">lock</span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider">呪い解除条件</span>
                                </div>
                                <p className="text-[11px] text-red-200/80 font-bold ml-5">{t.conditionDesc}</p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 self-start mt-0.5">{Math.floor(prog.current)} / {prog.target}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500"
                                style={{ width: `${prog.percent}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 italic text-center">条件達成で浄化され、星3の力に変わる...</p>
                            {/* 装飾 */}
                            <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-lg" />
                          </div>
                        );
                      })()}

                      {(() => {
                        const curseProg = (t.type === 'curse' || t.isCurse) ? getCurseProgress(t) : null;
                        const isPurifiable = curseProg && curseProg.percent >= 100;

                        if (isPurifiable) {
                          return (
                            <button
                              onClick={() => purifyCurse(t)}
                              className="w-full text-center py-3 rounded-lg font-bold transition-all bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)] animate-pulse active:scale-95"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span className="material-icons-round text-sm">auto_fix_high</span>
                                <span>呪いを解除する</span>
                              </div>
                            </button>
                          );
                        }

                        return (
                          <button
                            onClick={() => sellToken(t)}
                            className={`w-full text-center py-3 rounded-lg font-bold transition-all ${t.isLocked ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/5' : 'bg-red-600/20 hover:bg-red-600/40 text-red-300'}`}
                          >
                            {t.isLocked ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="material-icons-round text-sm">lock_person</span>
                                <span>売却不可</span>
                              </div>
                            ) : (
                              `売却 (+${Math.floor(t.price * (t.enchantments?.some(e => e.effect === "high_sell") ? 3.0 : 0.5))} ★)`
                            )}
                          </button>
                        );
                      })()}
                      <button onClick={() => setSelectedTokenDetail(null)} className="text-slate-400 text-xs font-bold py-2">
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          }

          {/* Enchant Detail Modal */}
          {
            selectedEnchantDetail && (() => {
              const t = tokens.find(tok => tok.instanceId === selectedEnchantDetail.tokenInstanceId);
              if (!t) {
                // schedule close
                setTimeout(() => setSelectedEnchantDetail(null), 0);
                return null;
              }
              const enc = t.enchantments?.[selectedEnchantDetail.enchantIndex];
              if (!enc) {
                setTimeout(() => setSelectedEnchantDetail(null), 0);
                return null;
              }
              const encIsDisabled = enc.disabled;

              return (
                <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedEnchantDetail(null)}>
                  <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border shadow-[0_0_40px_rgba(245,158,11,0.15)] border-amber-500/30" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${encIsDisabled ? 'bg-slate-700 border-slate-600' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                        <span className={`material-icons-round text-2xl ${encIsDisabled ? 'text-slate-400' : 'text-amber-400'}`}>
                          auto_fix_high
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold font-display italic leading-tight ${encIsDisabled ? 'text-slate-300' : 'text-amber-400'}`}>{enc.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${encIsDisabled ? 'bg-slate-700 text-slate-400' : 'bg-amber-500/20 text-amber-500'}`}>
                            {encIsDisabled ? '無効' : '有効'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-3 mb-6 border border-white/5">
                      <p className="text-xs text-slate-300 leading-relaxed">{getEnchantDescription(enc.id)}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          toggleEnchantStatus(selectedEnchantDetail.tokenInstanceId, selectedEnchantDetail.enchantIndex);
                        }}
                        className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${encIsDisabled
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/25'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                          }`}
                      >
                        {encIsDisabled ? '有効にする' : '無効にする'}
                      </button>

                      <button onClick={() => setSelectedEnchantDetail(null)} className="text-slate-400 text-xs font-bold py-2">
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          }

          {/* Particle Layer */}
          <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
            {purchasingParticles.map(p => (
              <div
                key={p.id}
                className="absolute text-gold animate-particle-fly"
                style={{
                  left: 0,
                  top: 0,
                  '--start-x': `${p.startX}px`,
                  '--start-y': `${p.startY}px`,
                  '--end-x': `${p.endX}px`,
                  '--end-y': `${p.endY}px`,
                  '--rand-x': `${p.randX}px`,
                  '--rand-y': `${p.randY}px`,
                  animationDelay: `${p.delay}s`,
                }}
              >
                <span className="material-icons-round text-xl">star</span>
              </div>
            ))}
          </div>

        </div >


      </div >
    </div>
  );
};

export default App;

