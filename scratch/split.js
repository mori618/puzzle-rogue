import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appJsxPath = path.join(__dirname, '../src/App.jsx');
const hooksDir = path.join(__dirname, '../src/hooks');
const useGameStatePath = path.join(hooksDir, 'useGameState.js');

if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

const content = fs.readFileSync(appJsxPath, 'utf8');
const lines = content.split('\n');

// 1. 各行のインポートと定数の分離
const imports = [];
const outsideConsts = [];
const hookBody = [];
const jsxBody = [];

let inApp = false;
let inJsx = false;
let inToggleEnchantStatus = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('import ')) {
    imports.push(line);
    continue;
  }
  
  if (line.startsWith('const App = () => {')) {
    inApp = true;
    continue;
  }
  
  if (inApp) {
    // 3700行目以降の if (!isLoaded) { を探し、そこから JSX (UIレンダリング部分) とする
    if (line.trim() === 'if (!isLoaded) {' && i > 3700) {
      inJsx = true;
      inApp = false;
      jsxBody.push(line); // この行自体も JSXBody に含める
    } else {
      hookBody.push(line);
    }
  } else if (inJsx) {
    // App.jsx 末尾の不要なエクスポート文は jsxBody に含めない
    if (line.startsWith('export { PuzzleEngine')) {
      continue;
    }
    
    // toggleEnchantStatus の定義部分を検知して hookBody に逃がす
    if (line.replace(/\r$/, '') === '  const toggleEnchantStatus = (tokenInstanceId, enchantIndex) => {') {
      inToggleEnchantStatus = true;
    }
    
    if (inToggleEnchantStatus) {
      hookBody.push(line);
      if (line.replace(/\r$/, '') === '  };') {
        inToggleEnchantStatus = false;
      }
    } else {
      jsxBody.push(line);
    }
  } else if (!inApp && !line.startsWith('import ')) {
    outsideConsts.push(line);
  }
}

// 2. useGameState.js のコンテンツ生成
const hookContent = `// 自動生成されたゲーム状態フック
import React, { useState, useEffect, useRef, useCallback } from "react";
import ShopScreen from "../ShopScreen";
import TitleScreen from "../TitleScreen";
import PauseScreen from "../PauseScreen";
import HelpScreen from "../HelpScreen";
import StatsScreen from "../StatsScreen";
import CreditsScreen from "../CreditsScreen";
import SettingsScreen from "../SettingsScreen";
import StartOptionScreen from "../StartOptionScreen";
import TokenEncyclopediaScreen from "../TokenEncyclopediaScreen";
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { ENCHANT_DESCRIPTIONS, getEnchantDescription, ENCHANTMENTS } from '../constants/enchantments.js';
import { MAX_COMBO, MAX_TARGET, SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, TOKEN_PRICE_GROWTH_FACTOR, SHOP_REROLL_GROWTH_FACTOR, AWAKENING_TOKEN_SLOT_PRICES } from '../constants/gameConstants.js';
import { formatNum, getEffectiveCost, getTokenDescription, getTokenDynamicInfo, getTokenIcon, getAttributeBarStyles } from '../utils/tokenUtils';
import { formatJapaneseNumber } from '../utils/numberUtils.js';
import { PuzzleEngine } from '../engine/PuzzleEngine.js';
import soundManager from '../utils/SoundManager';
import { BGM_IDS, SE_IDS } from '../constants/sounds';

// 外部定数・ヘルパーの移行
${outsideConsts.join('\n')}

export const useGameState = () => {
  // フック本体のロジック
${hookBody.join('\n')}

  // JSX から参照されるすべての状態、Ref、関数を返却
  return {
    isLoaded, setIsLoaded,
    hasSaveData, setHasSaveData,
    tokens, setTokens,
    sandsOfTimeSeconds, setSandsOfTimeSeconds,
    isGameOver, setIsGameOver,
    target, setTarget,
    goalReached, setGoalReached,
    shopItems, setShopItems,
    turn, setTurn,
    cycleTotalCombo, setCycleTotalCombo,
    shopRerollBasePrice, setShopRerollBasePrice,
    shopRerollPrice, setShopRerollPrice,
    stars, setStars,
    activeBuffs, setActiveBuffs,
    skippedTurnsBonus, setSkippedTurnsBonus,
    nextTurnTimeMultiplier, setNextTurnTimeMultiplier,
    lastTurnCombo, setLastTurnCombo,
    lastErasedColorCounts, setLastErasedColorCounts,
    pendingShopItem, setPendingShopItem,
    showTitle, setShowTitle,
    showHelp, setShowHelp,
    showPause, setShowPause,
    showSettings, setShowSettings,
    showShop, setShowShop,
    showStats, setShowStats,
    showCredits, setShowCredits,
    showStartOption, setShowStartOption,
    showEncyclopedia, setShowEncyclopedia,
    savedBoard, setSavedBoard,
    settings, setSettings,
    currentRunTotalCombo, setCurrentRunTotalCombo,
    stats, setStats,
    currentRunStats, setCurrentRunStats,
    totalPurchases, setTotalPurchases,
    totalStarsSpent, setTotalStarsSpent,
    triggeredPassives, setTriggeredPassives,
    targetPulse, setTargetPulse,
    starPopups, setStarPopups,
    comboPopups, setComboPopups,
    toastQueue, setToastQueue,
    currentToast, setCurrentToast,
    purchasingParticles, setPurchasingParticles,
    levelUpTokenId, setLevelUpTokenId,
    isEndlessMode, setIsEndlessMode,
    starProgress, setStarProgress,
    selectedTokenDetail, setSelectedTokenDetail,
    selectedEnchantDetail, setSelectedEnchantDetail,
    tokenMoveInput, setTokenMoveInput,
    showGameClear, setShowGameClear,
    isPracticeMode, setIsPracticeMode,
    practiceTimeLimit, setPracticeTimeLimit,
    isPureMode, setIsPureMode,
    isEnchantShopUnlocked, setIsEnchantShopUnlocked,
    tokenSlotExpansionCount, setTokenSlotExpansionCount,
    isAwakeningLevelUpBought, setIsAwakeningLevelUpBought,
    showMaxComboWarpDialog, setShowMaxComboWarpDialog,
    draggedToken, setDraggedToken,
    
    // JSX から呼ばれるユーティリティ/状態/Ref
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
    prevStarsRef,
    prevComboRef,
    engineRef,
    handleTurnEndRef,
    onPassiveTriggerRef,
    onStarEraseRef,
    totalMoveTimeRef,
    skipTurnProgressRef,
    
    // 計算値/定数
    maxTurns,
    effectiveTarget,
    rows,
    cols,
    
    // 関数
    handleSettingsChange,
    getAnimDelay,
    triggerPassive,
    addTokenToast,
    triggerLevelUp,
    spawnParticles,
    notify,
    startNextCycle,
    getRewardMultiplier,
    skipTurns,
    resetGame,
    handleStartOptionSelection,
    handleGiveUp,
    generateShop,
    purifyCurse,
    sellToken,
    buyItem,
    buyAwakeningItem,
    moveToken,
    handleChoice,
    handleStartPractice,
    toggleEnchantStatus,
    getTimeLimit,
    openShop,
    refreshShop,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
};
`;

fs.writeFileSync(useGameStatePath, hookContent, 'utf8');
console.log('Successfully created useGameState.js!');

// 3. App.jsx の更新
const appNewContent = `// リファクタリング後の App.jsx
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

${jsxBody.join('\n')}
`;

fs.writeFileSync(appJsxPath, appNewContent, 'utf8');
console.log('Successfully updated App.jsx!');
