// 自動生成されたゲーム状態フック
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
import { ENCHANT_DESCRIPTIONS, ENCHANTMENTS } from '../constants/enchantments.js';
import { MAX_COMBO, MAX_TARGET, SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, TOKEN_PRICE_GROWTH_FACTOR, SHOP_REROLL_GROWTH_FACTOR, AWAKENING_TOKEN_SLOT_PRICES, INITIAL_TOKEN_SLOTS } from '../constants/gameConstants.js';
import { formatNum, getEffectiveCost, getTokenDescription, getTokenDynamicInfo, getTokenIcon, getAttributeBarStyles } from '../utils/tokenUtils';
import { formatJapaneseNumber } from '../utils/numberUtils.js';
import { PuzzleEngine } from '../engine/PuzzleEngine.js';
import soundManager from '../utils/SoundManager';
import { useGameSettings } from './useGameSettings';
import { usePuzzleBoard } from './usePuzzleBoard';
import { useShop } from './useShop';
import { BGM_IDS, SE_IDS } from '../constants/sounds';

// 外部定数・ヘルパーの移行


export const useGameState = () => {
  // フック本体のロジック
  // セーブデータをマウント前に同期的にロード（初期表示時のフラッシュ防止およびパズル盤面の確実な復元のため）
  const savedData = (() => {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to parse saved data from localStorage:", e);
      return null;
    }
  })();

  // Game State
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(!!savedData);
  const [tokens, setTokens] = useState(() => savedData?.tokens || Array(6).fill(null));
  const [sandsOfTimeSeconds, setSandsOfTimeSeconds] = useState(() => savedData?.sandsOfTimeSeconds || 0);
  const [isGameOver, setIsGameOver] = useState(() => savedData?.isGameOver || false);
  const [target, setTarget] = useState(() => savedData?.target || 100);
  const [goalReached, setGoalReached] = useState(() => savedData?.goalReached || false);
  const [turn, setTurn] = useState(() => savedData?.turn || 1);
  const [cycleTotalCombo, setCycleTotalCombo] = useState(() => savedData?.cycleTotalCombo || 0);
  const [stars, setStars] = useState(() => savedData?.stars || 10);
  /* const [energy, setEnergy] = useState(0); // REMOVED: Global Energy */
  /* const [maxEnergy] = useState(10); // REMOVED: Global Energy */

  const [activeBuffs, setActiveBuffs] = useState([]);
  const [skippedTurnsBonus, setSkippedTurnsBonus] = useState(0);
  const [nextTurnTimeMultiplier, setNextTurnTimeMultiplier] = useState(1);
  const [lastTurnCombo, setLastTurnCombo] = useState(0);
  const [lastErasedColorCounts, setLastErasedColorCounts] = useState({});
  const [hasUsedActiveSkillThisTurn, setHasUsedActiveSkillThisTurn] = useState(false);
  // スキル使用によって消去されたドロップ数をターン終了時にマージするための一時的な状態
  const [skillErasedCounts, setSkillErasedCounts] = useState({});

  // Shop choice state

  // UI State
  const [showTitle, setShowTitle] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showStartOption, setShowStartOption] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [savedBoard, setSavedBoard] = useState(() => savedData?.board || null);


  // settings と handleSettingsChange は useGameSettings フックから取得します

  // Stats State
  const [currentRunTotalCombo, setCurrentRunTotalCombo] = useState(() => savedData?.currentRunTotalCombo || 0);
  const [stats, setStats] = useState({
    lifetimeTotalCombo: 0,
    maxComboAllTime: 0,
    maxComboMultiplierAllTime: 1,
    maxEnchantsAllTime: 0,
    lifetimeTotalMoveTime: 0, // 累計操作時間(ms)
    lifetimeClears: 0,        // 累計サイクルクリア回数
    lifetimeShapeLen4: 0,     // 4個消し累計回数
    lifetimeShapeCross: 0,    // 十字消し累計回数
    lifetimeShapeRow: 0,      // 1列消し累計回数
    lifetimeShapeLShape: 0,   // L字消し累計回数
    lifetimeShapeSquare: 0,   // 四角消し(2x2)累計回数
    lifetimeShapesLen5: 0,     // 5個消し累計回数
    maxCycleAllTime: 0,       // 歴代最大到達サイクル
    lifetimeStarsSpent: 0,    // 累計消費スター数
    lifetimeSkillsUsed: 0,    // 累計スキル使用回数
    lifetimeCursesRemoved: 0,  // 累計呪い解除数
    lifetimeDropsErased: { fire: 0, water: 0, wood: 0, light: 0, dark: 0, heart: 0 }, // 累計各ドロップ消去数
    maxBaseComboAllTime: 0,
    maxBaseComboMultiplierAllTime: 1,
  });
  const initialCurrentRunStats = {
    currentTotalCombo: 0,
    maxCombo: 0,
    maxComboMultiplier: 1,
    maxEnchants: 0,
    currentTotalMoveTime: 0,
    currentPlays: 0,
    currentClears: 0,
    currentStarsSpent: 0,
    currentSkillsUsed: 0,
    currentShapeLen4: 0,
    currentShapeLen5: 0,
    currentShapeCross: 0,
    currentShapeRow: 0,
    currentShapeLShape: 0,
    currentShapeSquare: 0,
    totalHeartsErased: 0,
    totalStarsEarned: 0,
    tokensSold: 0,
    skipsPerformed: 0,
    currentCursesRemoved: 0,  // 今回の呪い解除数
    currentDropsErased: { fire: 0, water: 0, wood: 0, light: 0, dark: 0, heart: 0 }, // 今回の各ドロップ消去数
    maxBaseCombo: 0,
    maxBaseComboMultiplier: 1,
    currentShopRerolls: 0,      // ショップリロール累計回数（浪費の勲章用）
    currentMoveDropTotal: 0,    // ムーブドロップ累計カウント（ムーブ・リピーター用）
  };
  const [currentRunStats, setCurrentRunStats] = useState(() => savedData?.currentRunStats || initialCurrentRunStats);
  // const [isLuxury, setIsLuxury] = useState(false); // Unused
  const [totalPurchases, setTotalPurchases] = useState(() => savedData?.totalPurchases || 0);
  const [totalStarsSpent, setTotalStarsSpent] = useState(() => savedData?.totalStarsSpent || 0);
  const [triggeredPassives, setTriggeredPassives] = useState([]); // Visual feedback state

  const getAnimDelay = useCallback((baseDelay) => {
    if (engineRef.current && engineRef.current.isFastForward) {
      return Math.max(0, baseDelay * 0.2);
    }
    return baseDelay;
  }, []);

  const triggerPassive = (tokenId) => {
    if (!tokenId) return;
    // 発動したトークンIDのベースIDを取得し、確率系トークンに該当するかを判定する
    const tok = tokens.find(t => t && (t.instanceId === tokenId || t.id === tokenId));
    if (tok) {
      const isProbabilityToken = [
        "turn_end_spawn_h", "turn_end_spawn_bomb_1", "turn_end_spawn_star_3",
        "turn_end_spawn_repeat_1", "turn_end_spawn_mixed_1", "turn_end_spawn_plus_5",
        "erosion_fire", "erosion_dark", "turn_end_convert_f_d", "turn_end_full_board_w"
      ].includes(tok.id) || tok.effect === "turn_end_special_spawn" ||
        tok.effect === "turn_end_spawn" || tok.effect === "turn_end_convert" ||
        tok.effect === "erosion_color" || tok.effect === "turn_end_full_board" ||
        tok.effect === "turn_end_star_gamble" || tok.effect === "turn_end_token_gamble";

      if (isProbabilityToken) {
        // 現在のターンで確率系が発動したかのフラグを立てる
        window.probabilityTriggeredThisTurn = true;
        // 累計発動回数をインクリメント
        window.probabilityTriggeredTotalCount = (window.probabilityTriggeredTotalCount || 0) + 1;
      }
    }

    setTriggeredPassives(prev => [...prev, tokenId]);
    setTimeout(() => {
      setTriggeredPassives(prev => prev.filter(id => id !== tokenId));
    }, getAnimDelay(500));
  };

  const [targetPulse, setTargetPulse] = useState(false);
  const targetComboRef = useRef(null);

  // --- Animation State ---
  const prevStarsRef = useRef(stars);
  const prevComboRef = useRef(cycleTotalCombo);
  const [starPopups, setStarPopups] = useState([]);
  const [comboPopups, setComboPopups] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const [purchasingParticles, setPurchasingParticles] = useState([]); // 購入・売却時のパーティクル
  const [levelUpTokenId, setLevelUpTokenId] = useState(null); // レベルアップ演出用

  const addTokenToast = useCallback((token, actionText) => {
    const id = Date.now() + Math.random();
    setToastQueue(prev => [...prev, { id, token, actionText }]);
  }, []);

  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      const nextToast = toastQueue[0];
      setCurrentToast(nextToast);
      setToastQueue(prev => prev.slice(1));
      // キューの詰まり具合に応じて表示速度を動的に調整 (たまっているときは早送り)
      const duration = toastQueue.length > 3 ? 1000 : toastQueue.length > 1 ? 1600 : 2500;
      setTimeout(() => {
        setCurrentToast(null);
      }, duration);
    }
  }, [currentToast, toastQueue]);

  const triggerLevelUp = (instanceId) => {
    setLevelUpTokenId(instanceId);
    setTimeout(() => setLevelUpTokenId(null), 1000);
  };

  const spawnParticles = (count, startX, startY, endX, endY, type = 'star') => {
    const newParticles = Array.from({ length: count }).map(() => ({
      id: Math.random(),
      startX,
      startY,
      endX,
      endY,
      randX: (Math.random() - 0.5) * 100,
      randY: (Math.random() - 0.5) * 100,
      delay: Math.random() * 0.3,
      type
    }));
    setPurchasingParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setPurchasingParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);
  };


  const notify = useCallback((text) => {
    addTokenToast(null, text);
  }, [addTokenToast]);

  useEffect(() => {
    if (stars > prevStarsRef.current) {
      const diff = stars - prevStarsRef.current;
      const id = Date.now() + Math.random();
      setStarPopups(prev => [...prev, { id, diff }]);
      setTimeout(() => {
        setStarPopups(prev => prev.filter(p => p.id !== id));
      }, 800);
    }
    prevStarsRef.current = stars;
  }, [stars]);

  useEffect(() => {
    if (cycleTotalCombo > prevComboRef.current) {
      const diff = cycleTotalCombo - prevComboRef.current;
      const id = Date.now() + Math.random();
      setComboPopups(prev => [...prev, { id, diff }]);
      setTimeout(() => {
        setComboPopups(prev => prev.filter(p => p.id !== id));
      }, 800);
    }
    prevComboRef.current = cycleTotalCombo;
  }, [cycleTotalCombo]);

  // Refs
  const boardRef = useRef(null);

  const [isEndlessMode, setIsEndlessMode] = useState(false); // New: Endless Mode state
  const [starProgress, setStarProgress] = useState(0); // 累積スター進捗
  const [selectedTokenDetail, setSelectedTokenDetail] = useState(null);
  const [selectedEnchantDetail, setSelectedEnchantDetail] = useState(null);
  const [showGameClear, setShowGameClear] = useState(false); // 全画面クリア画面の表示フラグ
  const [isPracticeMode, setIsPracticeMode] = useState(false); // 練習モードフラグ
  const [practiceTimeLimit, setPracticeTimeLimit] = useState(10000); // 練習モード用操作時間 (10s初期)
  const [isPureMode, setIsPureMode] = useState(false); // 純粋モード (特殊消しボーナス無効)

  // --- 覚醒ショップ State ---
  const [isEnchantShopUnlocked, setIsEnchantShopUnlocked] = useState(() => savedData?.isEnchantShopUnlocked || false); // エンチャントショップ解放フラグ
  const [isAwakeningLevelUpBought, setIsAwakeningLevelUpBought] = useState(() => savedData?.isAwakeningLevelUpBought || false); // 覚醒ショップ: ランダムレベルアップ購入済みフラグ
  const [showMaxComboWarpDialog, setShowMaxComboWarpDialog] = useState(false);
  const [isBeyondMode, setIsBeyondMode] = useState(false); // 彼岸モード: サイクル25クリア後の無限モード
  const [passiveTokenPage, setPassiveTokenPage] = useState(0);
  const [activeTokenPage, setActiveTokenPage] = useState(0);
  // スワイプ座標の管理（useRef でレンダー外管理）
  const passiveSwipeRef = useRef(null);
  const activeSwipeRef = useRef(null);

  // --- Drag and Drop State ---


  const timerRef = useRef(null);
  const timerTextRef = useRef(null);
  const comboRef = useRef(null);
  const tokenSlotExpansionCountRef = useRef(0);

  const getStatByCondition = useCallback((cond) => {
    switch (cond) {
      case 'clears': return currentRunStats.currentClears || 0;
      case 'heart_erase': return currentRunStats.totalHeartsErased || 0;
      case 'total_combo': return currentRunStats.currentTotalCombo || 0;
      case 'total_stars': return currentRunStats.totalStarsEarned || 0;
      case 'max_combo': return currentRunStats.maxCombo || 0;
      case 'tokens_sold': return currentRunStats.tokensSold || 0;
      case 'skips_performed': return currentRunStats.skipsPerformed || 0;
      case 'token_slot_expansion': return tokenSlotExpansionCountRef.current;
      case 'level3_tokens_count': return tokens.filter(t => t && t.level >= 3).length;
      case 'shop_purchases': return totalPurchases || 0;
      case 'rerolls_performed': return currentRunStats.currentShopRerolls || 0;
      case 'fire_erase_count': return currentRunStats.currentDropsErased?.fire || 0;
      case 'light_erase_count': return currentRunStats.currentDropsErased?.light || 0;
      default: return 0;
    }
  }, [currentRunStats, tokens, totalPurchases]);

  const getCurseProgress = (t) => {
    // type:'curse' もしくは isCurse:true のトークンが対象
    if (!t || (t.type !== 'curse' && !t.isCurse)) return null;
    const cond = t.condition;
    const target = t.targetValue || 1;

    let current = 0;
    if (cond === 'skill_uses') {
      current = t.curseUses || 0;
    } else if (cond === 'level3_tokens_count') {
      current = getStatByCondition(cond); // レベル3トークン所持数は絶対値で判定
    } else {
      const currentRaw = getStatByCondition(cond);
      const startValue = t.startValue || 0;
      current = Math.max(0, currentRaw - startValue);
    }

    return { current, target, percent: Math.min(100, (current / target) * 100) };
  };
  const engineRef = useRef(null);
  const handleTurnEndRef = useRef(null);
  const onPassiveTriggerRef = useRef(null);
  const onStarEraseRef = useRef(null);
  const totalMoveTimeRef = useRef(0);
  const skipTurnProgressRef = useRef(false);

  // hasGiantDomain は usePuzzleBoard フックへ移行されました
  const hasSaintToken = tokens.some((t) => t?.id === "legend_saint");
  const hasDoubleTargetCurse = tokens.some((t) => t?.id === "curse_double_target") && !hasSaintToken;
  const effectiveTarget = hasDoubleTargetCurse ? target * 2 : target;

  // --- 各種機能のカスタムフックの呼び出し ---
  const settingsHook = useGameSettings();
  const { settings, setSettings, handleSettingsChange } = settingsHook;

  const boardHook = usePuzzleBoard({ tokens, setTokens, notify: (text) => addTokenToast(null, text) });
  const {
    draggedToken,
    setDraggedToken,
    tokenMoveInput,
    setTokenMoveInput,
    rows,
    cols,
    moveToken,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = boardHook;

  const shopHook = useShop({
    tokens,
    setTokens,
    stars,
    setStars,
    activeBuffs,
    isBeyondMode,
    totalPurchases,
    setTotalPurchases,
    totalStarsSpent,
    setTotalStarsSpent,
    stats,
    setStats,
    currentRunStats,
    setCurrentRunStats,
    notify,
    addTokenToast,
    triggerLevelUp,
    spawnParticles,
    getStatByCondition,
    setSelectedTokenDetail,
    setIsAwakeningLevelUpBought,
    isEnchantShopUnlocked,
    setIsEnchantShopUnlocked,
    setSandsOfTimeSeconds,
    hasSaintToken,
  });
  const {
    shopItems,
    setShopItems,
    shopRerollBasePrice,
    setShopRerollBasePrice,
    shopRerollPrice,
    setShopRerollPrice,
    pendingShopItem,
    setPendingShopItem,
    tokenSlotExpansionCount,
    setTokenSlotExpansionCount,
    generateShop,
    purifyCurse,
    sellToken,
    buyItem,
    buyAwakeningItem,
    handleChoice,
    openShop,
    refreshShop,
    getTokenSlotExpandPrice,
  } = shopHook;

  // Refを最新の値に同期
  tokenSlotExpansionCountRef.current = tokenSlotExpansionCount || 0;


  // rows, cols は usePuzzleBoard フックへ移行されました

  const maxTurns = Math.max(1, 3
    + tokens.reduce((acc, t) => acc + (t?.enchantments?.filter(e => e.effect === "add_turn").length || 0), 0)
    + tokens.reduce((acc, t) => {
      if (t?.effect === "picky_eater") return acc + (t.values[(t.level || 1) - 1] || 0);
      return acc;
    }, 0)
  );

  const prevMaxTurnsRef = useRef(maxTurns);
  useEffect(() => {
    // 最大手番（maxTurns）が前回から減少しており、かつそれによって現在の手番（turn）が上回ってしまった場合
    const prevMaxTurns = prevMaxTurnsRef.current;
    prevMaxTurnsRef.current = maxTurns;

    // パズルプレイ中（ショップ、タイトル、ゲームオーバーでない）のみ補正と通知を実行
    if (!showShop && !showTitle && !isGameOver && maxTurns < prevMaxTurns && turn > maxTurns) {
      setTurn(maxTurns);
      notify("手番制限の減少に伴い、残り手番が1に調整されました。");
    }
  }, [maxTurns, turn, showShop, showTitle, isGameOver, notify]);

  const minMatchLength = tokens.some(t => t?.effect === "min_match") ? 2 : 3;

  useEffect(() => {
    // セーブデータのロード
    if (savedData) {
      // useGameState内で直接初期化できないフック管理下のステートを復元
      setShopRerollBasePrice(savedData.shopRerollBasePrice || 1);
      setShopRerollPrice(savedData.shopRerollPrice || 1);
      setTokenSlotExpansionCount(savedData.tokenSlotExpansionCount || 0);

      if (savedData.shopItems) {
        setShopItems(savedData.shopItems);
      } else if (!savedData.isGameOver) {
        setTimeout(() => {
          setShopItems(prev => {
            if (prev.length === 0) {
              return generateShop();
            }
            return prev;
          });
        }, 0);
      }
    } else {
      generateShop();
    }

    const savedStats = localStorage.getItem('puzzle_rogue_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Stats data corrupted:", e);
      }
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        soundManager.updateSettings(parsed);
      } catch (e) {
        console.error("Settings data corrupted:", e);
      }
    }

    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartPractice = useCallback(() => {
    setIsPracticeMode(true);
    setShowTitle(false);
    setTurn(1);
    setTarget(0);
    setGoalReached(false);
    setTokens(Array(6).fill(null));
    setActiveBuffs([]);
    setCurrentRunStats(prev => ({ ...prev, maxCombo: 0 }));
    if (engineRef.current) {
      engineRef.current.init(null);
    }
  }, []);



  useEffect(() => {
    if (!isLoaded) return;
    if (showTitle) {
      soundManager.playBGM(BGM_IDS.TITLE);
    } else if (isGameOver) {
      soundManager.playBGM(BGM_IDS.GAMEOVER);
    } else if (showShop) {
      soundManager.playBGM(BGM_IDS.SHOP);
    } else if (isBeyondMode) {
      soundManager.playBGM(BGM_IDS.BEYOND);
    } else {
      soundManager.playBGM(BGM_IDS.GAME);
    }
  }, [isLoaded, showTitle, isGameOver, showShop, isBeyondMode]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isGameOver) {
      localStorage.removeItem(SAVE_KEY);
      setHasSaveData(false);
      return;
    }

    const saveObj = {
      turn,
      cycleTotalCombo,
      target,
      goalReached,
      stars,
      tokens,
      totalPurchases,
      totalStarsSpent,
      isGameOver,
      sandsOfTimeSeconds,
      shopRerollBasePrice,
      shopRerollPrice,
      currentRunTotalCombo,
      shopItems,
      isEnchantShopUnlocked,
      tokenSlotExpansionCount,
      isAwakeningLevelUpBought,
      currentRunStats,
      board: engineRef.current ? engineRef.current.getState() : (savedBoard || null)
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveObj));
    setHasSaveData(true);

  }, [turn, cycleTotalCombo, target, goalReached, stars, tokens, isGameOver, isLoaded, totalPurchases, totalStarsSpent, sandsOfTimeSeconds, shopRerollBasePrice, shopRerollPrice, currentRunTotalCombo, shopItems, savedBoard, isEnchantShopUnlocked, tokenSlotExpansionCount, isAwakeningLevelUpBought, currentRunStats]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('puzzle_rogue_stats', JSON.stringify(stats));
  }, [stats, isLoaded]);

  useEffect(() => {
    if (!engineRef.current) return;
    const weights = {};
    const ALL_COLORS = ["fire", "water", "wood", "light", "dark", "heart"];
    ALL_COLORS.forEach((c) => (weights[c] = 1));
    const isEnchantDisabled = tokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");

    tokens.forEach((t) => {
      if (t?.effect === "picky_eater" && t.params?.excludeColors) {
        t.params.excludeColors.forEach((c) => { weights[c] = 0; });
      }

      if (!isEnchantDisabled && t?.enchantments) {
        t.enchantments.forEach(e => {
          if (e.effect === "skyfall_boost" && e.params?.color) {
            weights[e.params.color] += 0.2;
          } else if (e.effect === "skyfall_nerf" && e.params?.color) {
            weights[e.params.color] *= 0.5;
          }
        });
      }
    });

    activeBuffs.forEach((buff) => {
      if (buff.action === "skyfall") {
        buff.params.colors.forEach((c) => {
          weights[c] *= buff.params.weight;
        });
      } else if (buff.action === "skyfall_limit") {
        ALL_COLORS.forEach((c) => {
          if (!buff.params.colors.includes(c)) {
            weights[c] = 0;
          }
        });
      }
    });
    engineRef.current.setSpawnWeights(weights);

    // 錬金術パッシブと消去禁止設定の同期
    const isCursePassiveNull = activeBuffs.some(b => b?.action === "curse_passive_null") && !hasSaintToken;
    const alchPassives = {};
    if (!isCursePassiveNull) {
      tokens.forEach(t => {
        if (t && t.effect === 'alchemy' && t.params?.color) {
          alchPassives[t.params.color] = Math.max(alchPassives[t.params.color] || 0, t.level || 1);
        }
      });
    }
    engineRef.current.setAlchemyPassives(alchPassives);

    const noEraseColors = [];
    activeBuffs.forEach(b => {
      if (b.action === "no_match_erase" && b.params?.color) {
        noEraseColors.push(b.params.color);
      }
    });
    engineRef.current.setNoEraseColors(noEraseColors);
  }, [activeBuffs, tokens, hasSaintToken]);

  const getTimeLimit = useCallback(() => {
    if (isPracticeMode) return practiceTimeLimit;
    const isEnchantDisabled = tokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
    const hasDesperateStance = tokens.some(t => t?.effect === "desperate_stance");
    // 暴君の号令 (tyrant_decree): 1番目スロットに装備時、操作時間が常に2秒(2000ms)になる
    const isTyrantDecreeActive = tokens[0] && tokens[0].effect === "tyrant_decree";
    if (isTyrantDecreeActive) {
      return 2000;
    }
    if (hasDesperateStance) {
      return 4000;
    }
    const curseTimeFixBuff = activeBuffs.find(b => b?.action === "curse_op_time_fix");
    if (curseTimeFixBuff) {
      return curseTimeFixBuff.params?.timeMs ?? 1000;
    }
    if (tokens.some(t => t?.id === "curse_time") && !hasSaintToken) {
      return 4000;
    }

    let base = 5000 + (sandsOfTimeSeconds * 1000);
    tokens.forEach((t) => {
      if (t?.effect === "time") base += (t.values[(t.level || 1) - 1] * 1000);
      if (t?.effect === "cursed_power" && !hasSaintToken) base -= 3000;

      if (!isEnchantDisabled) {
        t?.enchantments?.forEach(enc => {
          if (enc.effect === "time_ext_enc") base += (enc.value || 1) * 1000;
          if (enc.effect === "berserk_mode") base -= 1000;
        });
      }

      if (t?.effect === "star_count_time_ext") {
        const rarity2Count = tokens.filter(tok => tok?.rarity === 2).length;
        base += (t.values[(t.level || 1) - 1] * 1000) * rarity2Count;
      }

      if (t?.effect === "stat_shape_len5") {
        const v = t.values[(t.level || 1) - 1];
        const count = Math.floor((currentRunStats.currentShapeLen5 || 0) / 10);
        if (count > 0) base += (v * 1000) * count;
      }
    });
    activeBuffs.forEach(b => {
      if (b.action === "op_time_boost") {
        base += (b.params?.extraTime || 0);
      }
    });

    base *= nextTurnTimeMultiplier;
    return Math.max(1000, base);
  }, [tokens, sandsOfTimeSeconds, nextTurnTimeMultiplier, currentRunStats.currentShapeLen5, activeBuffs, isPracticeMode, practiceTimeLimit, hasSaintToken]);

  useEffect(() => {
    if (!boardRef.current || !timerRef.current) return;

    const engine = new PuzzleEngine(
      boardRef.current,
      timerRef.current,
      comboRef.current,
      {
        rows,
        cols,
        timeLimit: getTimeLimit(),
        minMatchLength,
        timerText: timerTextRef.current,
        pureMode: isPureMode,
        onCombo: () => {},
        onTurnEnd: async (total, colorComboCounts, erasedColorCounts, skyfall, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isAllClear, extraStats, detailedShapes, remainingTimeMs) => {
          if (handleTurnEndRef.current) {
            await handleTurnEndRef.current(total, colorComboCounts, erasedColorCounts, skyfall, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isAllClear, extraStats, detailedShapes, remainingTimeMs);
          }
        },
        onPassiveTrigger: (tokenId) => {
          if (onPassiveTriggerRef.current) onPassiveTriggerRef.current(tokenId);
        },
        onStarErase: (count) => {
          if (onStarEraseRef.current) onStarEraseRef.current(count);
        }
      },
    );

    engine.init(savedBoard);
    engineRef.current = engine;

    return () => {
      if (engineRef.current) {
        setSavedBoard(engineRef.current.getState());
      }
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, showTitle, showHelp, showStats, showCredits, showSettings]);

  useEffect(() => {
    if (engineRef.current) {
      const limit = getTimeLimit();
      engineRef.current.timeLimit = limit;
      engineRef.current.minMatchLength = minMatchLength;
      engineRef.current.pureMode = isPureMode;
      engineRef.current.speedMultiplier = settings?.speedMultiplier || 3;

      if (engineRef.current.updateTimerDisplay) {
        engineRef.current.updateTimerDisplay(limit);
      }

      const baseEffective = tokens.map((t, index) => {
        if (!t) return t;
        if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
          return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
        }
        return t;
      });

      const isTrialActive = activeBuffs.some(b => b?.action === "trial_stage_active");
      const hasTrialSuccess = activeBuffs.some(b => b?.action === "trial_success");

      const leadToken = tokens[0];
      const leadColor = (leadToken && leadToken.effect === 'element_lead') ? leadToken.params?.color : null;
      const effectiveTokens = [];
      if (!isTrialActive) {
        baseEffective.forEach(t => {
          if (!t) return;
          effectiveTokens.push(t);
          if (leadColor && t.type === 'passive') {
            const isMatched = (t.attributes && t.attributes.includes(leadColor)) || (t.params?.color === leadColor);
            if (isMatched) {
              effectiveTokens.push({ ...t, instanceId: `${t.instanceId || t.id}_dup` });
            }
          }
        });

        if (hasTrialSuccess) {
          const duplicated = [];
          effectiveTokens.forEach(t => {
            duplicated.push({ ...t, instanceId: `${t.instanceId || t.id}_trial_dup` });
          });
          effectiveTokens.push(...duplicated);
        }
      }

      const hasForbiddenLiteral = effectiveTokens.some((t) => t?.id === "forbidden" || t?.effect === "forbidden");
      const hasCurseSkyfall = effectiveTokens.some((t) => (t?.id === "curse_skyfall" || t?.effect === "curse_skyfall") && !hasSaintToken);
      engineRef.current.noSkyfall = hasForbiddenLiteral || hasCurseSkyfall;

      const hasVacation = effectiveTokens.some((t) => t?.effect === "vacation");
      engineRef.current.vacationMode = hasVacation;
      engineRef.current.fourMatchRestriction = effectiveTokens.some(t => t?.effect === "four_match_restriction");
      engineRef.current.rowMatchRestriction = effectiveTokens.some(t => t?.effect === "row_match_restriction");

      const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power") || isTrialActive;

      const masteryToken = effectiveTokens.find(t => t?.effect === "additive_mastery");
      const hasMastery = !!masteryToken;
      const masteryMultiplier = hasMastery ? masteryToken.values[(masteryToken.level || 1) - 1] : 1;

      const bonuses = {
        len4: 0, row: 0, l_shape: 0,
        // color_combo: { fire: [{ value, tokenId, tokenName }], ... } 形式
        color_combo: {},
        // heart_combo: [{ value, tokenId, tokenName }] 形式
        heart_combo: [],
        enhancedOrbBonus: 0, overLink: null,
        extra_repeat_activations: 0, moveDropBoost: 0,
        stat_shape_additions: { cross: 0, len4: 0 },
        skyfall: 0,
        rainbow: 0,
        hasMastery,
        masteryMultiplier,
        tokenIds: {
          len4: [], row: [], l_shape: [], heart_combo: [], enhancedOrbBonus: [], overLink: [],
          rainbow_combo_bonus: [], extra_repeat_activations: [], moveDropBoost: [], stat_shape_additions: { cross: [], len4: [] },
          skyfall: [], rainbow: []
        }
      };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tId = t.instanceId || t.id;

        if (t.effect === 'shape_bonus') {
          const val = t.values[lv - 1];
          if (t.params?.shape === 'len4') {
            bonuses.len4 += val;
            bonuses.tokenIds.len4.push(tId);
          }
          if (t.params?.shape === 'row') {
            bonuses.row += val;
            bonuses.tokenIds.row.push(tId);
          }
          if (t.params?.shape === 'l_shape') {
            bonuses.l_shape += val;
            bonuses.tokenIds.l_shape.push(tId);
          }
        }

        if (t.effect === 'heart_combo_bonus') {
          const val = t.values[lv - 1];
          // heart_combo は配列形式で { value, tokenId, tokenName } を積む
          bonuses.heart_combo.push({ value: val, tokenId: tId, tokenName: t.name || 'ハートコンボ' });
          bonuses.tokenIds.heart_combo.push(tId);
        }

        if (t.effect === 'enhanced_orb_bonus') {
          bonuses.enhancedOrbBonus += t.values[lv - 1] || 0;
          bonuses.tokenIds.enhancedOrbBonus.push(tId);
        }

        if (t.effect === 'enhanced_link_multiplier') {
          if (!bonuses.overLink || t.values[lv - 1] > bonuses.overLink.value) {
            bonuses.overLink = { count: t.params.count, value: t.values[lv - 1] };
          }
          bonuses.tokenIds.overLink.push(tId);
        }

        if (t.effect === 'rainbow_combo_bonus') {
          bonuses.rainbow += (t.values[lv - 1] || 0);
          bonuses.tokenIds.rainbow.push(tId);
        }

        if (t.effect === 'move_drop_boost') {
          bonuses.moveDropBoost += (t.values[lv - 1] || 0);
          bonuses.tokenIds.moveDropBoost.push(tId);
        }

        if (t.effect === 'bonus_skyfall') {
          bonuses.skyfall += (t.values[lv - 1] || 0);
          bonuses.tokenIds.skyfall.push(tId);
        }

        if (t.effect === 'extra_repeat_activations') {
          bonuses.extra_repeat_activations += t.values[lv - 1] || 0;
          bonuses.tokenIds.extra_repeat_activations.push(tId);
        }

        if (t.effect === "stat_shape_cross") {
          const v = t.values?.[lv - 1] || 1;
          const b = Math.floor((currentRunStats.currentShapeCross || 0) / 5) * v;
          bonuses.stat_shape_additions.cross += b;
          bonuses.tokenIds.stat_shape_additions.cross.push(tId);
        }
        if (t.effect === "stat_shape_len4") {
          const v = t.values?.[lv - 1] || 1;
          const b = Math.floor((currentRunStats.currentShapeLen4 || 0) / 20) * v;
          bonuses.stat_shape_additions.len4 += b;
          bonuses.tokenIds.stat_shape_additions.len4.push(tId);
        }

        if (t.effect === 'color_combo_add' && t.params?.color) {
          const color = t.params.color;
          const lv = t.level || 1;
          const val = t.values?.[lv - 1] || 1;
          // color_combo は配列形式で { value, tokenId, tokenName } を積む
          if (!bonuses.color_combo[color]) bonuses.color_combo[color] = [];
          bonuses.color_combo[color].push({ value: val, tokenId: tId, tokenName: t.name || '色コンボ' });
        }

        const enchList = isEnchantDisabled ? [] : (t.enchantments || []);
        enchList.forEach(enc => {
          if (enc.effect === 'color_combo' && enc.params?.color) {
            const color = enc.params.color;
            if (!bonuses.color_combo[color]) bonuses.color_combo[color] = [];
            bonuses.color_combo[color].push({ value: 1, tokenId: tId, tokenName: t.name || '色コンボ' });
          }
          if (enc.effect === 'bomb_burst_combo') {
            bonuses.bomb_burst_combo = (bonuses.bomb_burst_combo || 0) + 3;
          }
        });
      });

      activeBuffs.forEach(buff => {
        if (buff.action === "color_combo_add_residual" && buff.params?.color) {
          const color = buff.params.color;
          const val = buff.params.value;
          if (!bonuses.color_combo[color]) bonuses.color_combo[color] = [];
          bonuses.color_combo[color].push({ value: val, tokenId: buff.tokenId || 'residual', tokenName: buff.name || '残滓の脈動' });
        }
      });

      engineRef.current.setRealtimeBonuses(bonuses);

      const rates = { global: [], colors: {} };
      const isTyrantDecreeActive = tokens[0] && tokens[0].effect === "tyrant_decree";
      if (isTyrantDecreeActive) {
        rates.global.push({ value: 1.0, tokenId: tokens[0].instanceId || tokens[0].id });
      }
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'enhance_chance') {
          rates.global.push({ value: t.values[lv - 1] || 0, tokenId });
        }
        if (t.effect === 'awakening') {
          rates.global.push({ value: 1.0, tokenId });
        }
        if (t.effect === 'legend_awakening') {
          rates.global.push({ value: 1.0, tokenId });
        }

        if (t.effect === 'stat_progress_clear') {
          const clearCount = currentRunStats.currentClears || 0;
          if (clearCount > 0) {
            const bonusRate = (t.values[lv - 1] || 0.01) * clearCount;
            rates.global.push({ value: bonusRate, tokenId });
          }
        }

        const enchList = t.enchantments || [];
        enchList.forEach(enc => {
          if (enc.effect === 'enhance_chance_color' && enc.params?.color) {
            const color = enc.params.color;
            if (!rates.colors[color]) rates.colors[color] = [];
            rates.colors[color].push({ value: enc.value || 0.1, tokenId });
          }
        });
      });
      engineRef.current.setEnhanceRates(rates);

      const bombRates = { colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'bomb_chance_color' && t.params?.color) {
          const color = t.params.color;
          if (!bombRates.colors[color]) bombRates.colors[color] = [];
          bombRates.colors[color].push({ value: t.values[lv - 1] || 0, tokenId });
        }
      });
      engineRef.current.setBombRates(bombRates);

      const repeatRates = { colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'repeat_chance_color' && t.params?.color) {
          const color = t.params.color;
          if (!repeatRates.colors[color]) repeatRates.colors[color] = [];
          repeatRates.colors[color].push({ value: t.values[lv - 1] || 0, tokenId });
        }
      });
      engineRef.current.repeatRates = repeatRates;

      const starRates = { colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'star_chance_color' && t.params?.color) {
          const color = t.params.color;
          if (!starRates.colors[color]) starRates.colors[color] = [];
          starRates.colors[color].push({ value: t.values[lv - 1] || 0, tokenId });
        }
      });
      engineRef.current.starRates = starRates;

      let rainbowRate = [];
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        if (t.effect === 'rainbow_chance') {
          rainbowRate.push({ value: t.values[lv - 1] || 0, tokenId: t.instanceId || t.id });
        }
      });
      engineRef.current.setRainbowRates(rainbowRate);

      const moveDropConfigs = [];
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        if (t.effect === 'move_drop') {
          moveDropConfigs.push({
            tokenId: t.instanceId || t.id,
            requiredWalks: t.values[lv - 1] || 5
          });
        }
      });
      engineRef.current.syncMoveDrops(moveDropConfigs);

      // 一筆書きの誓約: 有効かどうかをエンジンに通知
      engineRef.current.hasOneStrokeSeal = effectiveTokens.some(t => t?.effect === 'one_stroke_seal');

      // 冷静の同期
      const calmActive = activeBuffs.some(b => b?.action === "calm");
      engineRef.current.setCalmActive(calmActive);

      // 指・魔指・手の同期
      let fingerConfig = null;
      const activeFingerBuff = activeBuffs.find(b => b?.action === "finger_transform_active");
      if (activeFingerBuff && activeFingerBuff.params) {
        fingerConfig = {
          color: activeFingerBuff.params.color,
          limit: activeFingerBuff.params.limit
        };
      } else {
        const passiveHand = effectiveTokens.find(t => t?.effect === "finger_transform_passive");
        if (passiveHand && passiveHand.params) {
          fingerConfig = {
            color: passiveHand.params.color,
            limit: passiveHand.params.limit
          };
        }
      }
      engineRef.current.setFingerTransformConfig(fingerConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, getTimeLimit, minMatchLength, activeBuffs, settings?.speedMultiplier]);

  const handleTurnEnd = async (turnCombo, colorComboCounts, erasedColorCounts, hasSkyfallCombo, shapes = [], overLinkMultiplier = 1, erasedByBombTotal = 0, erasedByRepeatTotal = 0, erasedByStarTotal = 0, isAllClear = false, extraStats = {}, detailedShapes = [], remainingTimeMs = 0) => {
    // スキルによって消去されたドロップ数をマージ
    const finalErasedColorCounts = { ...erasedColorCounts };
    Object.keys(skillErasedCounts).forEach(color => {
      finalErasedColorCounts[color] = (finalErasedColorCounts[color] || 0) + skillErasedCounts[color];
    });
    // 一時ステートをクリア
    setSkillErasedCounts({});

    const showComboBreakdownLocal = async (params) => {
      const {
        tc, logData, turnCombo, bonus, effectiveCombo, MAX_COMBO,
        finalBaseCombo, finalComboMultiplier, debuffMultiplier, addedMultiplier
      } = params;
      const el = comboRef.current;
      if (!el) return;

      const mode = settings?.comboAnimationMode || 'instant';

      if (mode === 'step' && turnCombo > 0) {
        let currentBase = tc;
        let currentMult = 1.0;

        // 演出リズムを作るための動的ディレイ決定ヘルパー
        const getStepDelay = (step, stepType) => {
          if (stepType === 'debuff') {
            return 750; // 呪いデバフ（重みのあるタメ）
          }
          if (stepType === 'multiplier_mult') {
            return 950; // 倍率乗算（最大の見せ場のタメ）
          }
          if (stepType === 'multiplier_add') {
            return 700; // 倍率加算（中程度のタメ）
          }
          // 基礎コンボ加算
          const val = step.value || 0;
          if (val >= 5) {
            return 800; // 大きな加算（タメ）
          }
          return 650; // 小さな加算（表示時間を長くして認識しやすくする）
        };

        // 初期描画
        el.innerHTML = `
          <div class="combo-formula is-step-mode">
            <div class="combo-formula-expr">
              <div class="combo-formula-part">
                <span class="combo-number" id="formula-base">${formatJapaneseNumber(currentBase)}</span>
                <span class="combo-label">BASE</span>
              </div>
              <div class="combo-formula-op">×</div>
              <div class="combo-formula-part">
                <span class="combo-number" id="formula-mult">${formatNum(currentMult)}</span>
                <span class="combo-label">MULT</span>
              </div>
            </div>
          </div>
        `;
        el.classList.remove('animate-combo-pop');
        void el.offsetWidth;
        el.classList.add('animate-combo-pop');
        await new Promise(r => setTimeout(r, getAnimDelay(500))); // 初期ウェイトを500msに調整

        // 1. 基礎コンボ加算フェーズ
        for (const step of logData.bonusSteps) {
          if (!comboRef.current) break;
          if (step.tokenId) triggerPassive(step.tokenId);
          const stepValue = isNaN(step.value) ? 0 : step.value;
          
          const eEl = comboRef.current;
          const sign = stepValue >= 0 ? '+' : '';
          currentBase += stepValue;
          
          const baseEl = eEl.querySelector('#formula-base');
          if (baseEl) {
            baseEl.className = 'combo-number';
            // 古い演出要素をすべて削除して重複を防ぐ
            baseEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
            
            void baseEl.offsetWidth;
            
            baseEl.innerText = formatJapaneseNumber(currentBase);
            baseEl.className = 'combo-number text-yellow-glow animate-number-bounce';
            
            const newBonus = document.createElement('span');
            newBonus.className = 'combo-bonus-add';
            newBonus.innerHTML = `${sign}${formatJapaneseNumber(stepValue)}<span class="combo-step-label"> ${step.label}</span>`;
            baseEl.parentNode.appendChild(newBonus);
          }
          
          // 動的ディレイの適用
          await new Promise(r => setTimeout(r, getAnimDelay(getStepDelay(step, 'bonus'))));
          if (!comboRef.current) break;
        }
        {
          const baseEl = comboRef.current?.querySelector('#formula-base');
          if (baseEl) {
            baseEl.className = 'combo-number';
            // ループ終了時に残った演出要素を削除
            baseEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
          }
        }

        // 2. 呪い（デバフ）適用フェーズ
        if (logData.debuffSteps && logData.debuffSteps.length > 0) {
          for (const step of logData.debuffSteps) {
            if (!comboRef.current) break;
            currentBase = Math.floor(currentBase * step.value);
            
            const eEl = comboRef.current;
            const baseEl = eEl.querySelector('#formula-base');
            
            if (baseEl) {
              baseEl.className = 'combo-number';
              // 古い演出要素をすべて削除して重複を防ぐ
              baseEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
              
              void baseEl.offsetWidth;
              
              baseEl.innerText = formatJapaneseNumber(currentBase);
              baseEl.className = 'combo-number text-red-glow animate-number-bounce';
              
              const newBonus = document.createElement('span');
              newBonus.className = 'combo-bonus-mult text-red-400';
              newBonus.innerHTML = `×${step.value}<span class="combo-step-label"> ${step.label}</span>`;
              baseEl.parentNode.appendChild(newBonus);
            }
            
            // 呪い用の動的ディレイの適用
            await new Promise(r => setTimeout(r, getAnimDelay(getStepDelay(step, 'debuff'))));
            if (!comboRef.current) break;
          }
          const baseEl = comboRef.current?.querySelector('#formula-base');
          if (baseEl) {
            baseEl.className = 'combo-number';
            baseEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
          }
        }

        // 3. コンボ倍率加算・乗算フェーズ
        for (const step of logData.multiplierSteps) {
          if (!comboRef.current) break;
          if (step.tokenId) triggerPassive(step.tokenId);
          
          const eEl = comboRef.current;
          
          if (step.type === 'add') {
            const addedVal = isNaN(step.addedValue) ? 0 : step.addedValue;
            currentMult += addedVal;
            const sign = addedVal >= 0 ? '+' : '';
            
            const multEl = eEl.querySelector('#formula-mult');
            if (multEl) {
              multEl.className = 'combo-number';
              // 古い演出要素をすべて削除して重複を防ぐ
              multEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
              
              void multEl.offsetWidth;
              
              multEl.innerText = formatNum(currentMult);
              multEl.className = 'combo-number text-yellow-glow animate-number-bounce';
              
              const newBonus = document.createElement('span');
              newBonus.className = 'combo-bonus-add';
              newBonus.innerHTML = `${sign}${addedVal.toFixed(1)}<span class="combo-step-label"> ${step.label}</span>`;
              multEl.parentNode.appendChild(newBonus);
            }

            // 倍率加算用の動的ディレイの適用
            await new Promise(r => setTimeout(r, getAnimDelay(getStepDelay(step, 'multiplier_add'))));
            if (!comboRef.current) break;
          } else {
            const multVal = isNaN(step.value) ? 1.0 : step.value;
            currentBase = Math.floor(currentBase * multVal);
            
            const baseEl = eEl.querySelector('#formula-base');
            if (baseEl) {
              baseEl.className = 'combo-number';
              // 古い演出要素をすべて削除して重複を防ぐ
              baseEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
              
              void baseEl.offsetWidth; // リフロー
              
              baseEl.innerText = formatJapaneseNumber(currentBase);
              baseEl.className = 'combo-number text-yellow-glow animate-number-bounce';
              
              const newBonus = document.createElement('span');
              newBonus.className = 'combo-bonus-mult';
              newBonus.innerHTML = `×${multVal.toFixed(1)}<span class="combo-step-label"> ${step.label}</span>`;
              baseEl.parentNode.appendChild(newBonus);
            }

            // 倍率乗算用の動的ディレイの適用
            await new Promise(r => setTimeout(r, getAnimDelay(getStepDelay(step, 'multiplier_mult'))));
            if (!comboRef.current) break;
          }
        }

        // すべてのループフェーズが完了したら、数値を通常色に戻し、すべての加算演出要素を削除
        {
          const baseEl = comboRef.current?.querySelector('#formula-base');
          const multEl = comboRef.current?.querySelector('#formula-mult');
          if (baseEl) {
            baseEl.className = 'combo-number';
            baseEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
          }
          if (multEl) {
            multEl.className = 'combo-number';
            multEl.parentNode.querySelectorAll('.combo-bonus-add, .combo-bonus-mult').forEach(item => item.remove());
          }
        }

        await new Promise(r => setTimeout(r, getAnimDelay(200))); // 最終確定前のウェイトを200msに調整
        if (comboRef.current) {
          const safeCombo = isNaN(effectiveCombo) ? 0 : effectiveCombo;
          comboRef.current.innerHTML = `
            <span class="combo-number combo-number-final">${formatJapaneseNumber(safeCombo)}</span>
            <span class="combo-label">COMBO</span>
          `;
          comboRef.current.classList.remove('animate-combo-pop');
          comboRef.current.classList.add('animate-combo-pulse');
          void comboRef.current.offsetWidth;
        }
      } else {
        if (turnCombo > 0) {
          const multMultiplier = (1.0 + addedMultiplier) > 0 ? (finalComboMultiplier / (1.0 + addedMultiplier)) : 1.0;
          const displayBaseCombo = Math.floor(finalBaseCombo * multMultiplier);
          const displayComboMultiplier = 1.0 + addedMultiplier;

          el.innerHTML = `
            <div class="combo-formula">
              <div class="combo-formula-expr">
                <div class="combo-formula-part">
                  <span class="combo-number">${formatJapaneseNumber(displayBaseCombo)}</span>
                  ${bonus > 0 ? `<span class="combo-bonus-add">+${bonus}</span>` : ''}
                  ${debuffMultiplier < 1 ? `<span class="combo-bonus-mult">×${debuffMultiplier}</span>` : ''}
                  ${multMultiplier > 1.01 || multMultiplier < 0.99 ? `<span class="combo-bonus-mult">×${multMultiplier.toFixed(1)}</span>` : ''}
                </div>
                <div class="combo-formula-op">×</div>
                <div class="combo-formula-part">
                  <span class="combo-number">${formatNum(displayComboMultiplier)}</span>
                  ${addedMultiplier > 0 ? `<span class="combo-bonus-add">+${addedMultiplier.toFixed(1)}</span>` : ''}
                </div>
              </div>
            </div>
          `;
          el.classList.remove('animate-combo-pulse', 'animate-combo-pop');
          void el.offsetWidth;
          el.classList.add('animate-combo-pop');

          await new Promise(r => setTimeout(r, getAnimDelay(900)));

          if (comboRef.current) {
            const safeCombo = isNaN(effectiveCombo) ? 0 : effectiveCombo;
            comboRef.current.innerHTML = `
              <span class="combo-number combo-number-final">${formatJapaneseNumber(safeCombo)}</span>
              <span class="combo-label">COMBO</span>
            `;
            comboRef.current.classList.remove('animate-combo-pop');
            comboRef.current.classList.add('animate-combo-pulse');
            void comboRef.current.offsetWidth;
          }
        } else {
          el.innerHTML = `
            <div class="combo-formula">
              <div class="combo-formula-expr">
                <div class="combo-formula-part">
                  <span class="combo-number">0</span>
                  <span class="combo-label">BASE</span>
                </div>
                <div class="combo-formula-op">×</div>
                <div class="combo-formula-part">
                  <span class="combo-number">1.0</span>
                  <span class="combo-label">MULT</span>
                </div>
              </div>
            </div>
          `;
          el.classList.remove('animate-combo-pulse', 'animate-combo-pop');
          void el.offsetWidth;
          el.classList.add('animate-combo-pop');

          await new Promise(r => setTimeout(r, getAnimDelay(900)));

          if (comboRef.current) {
            comboRef.current.innerHTML = `
              <span class="combo-number combo-number-final">0</span>
              <span class="combo-label">COMBO</span>
            `;
            comboRef.current.classList.remove('animate-combo-pop');
            comboRef.current.classList.add('animate-combo-pulse');
            void comboRef.current.offsetWidth;
          }
        }
      }

      await new Promise(r => setTimeout(r, getAnimDelay(400)));
      setTargetPulse(true);
      setTimeout(() => setTargetPulse(false), getAnimDelay(800));
      setTimeout(() => {
        if (comboRef.current) {
          comboRef.current.classList.remove('animate-combo-pulse');
          comboRef.current.classList.add('animate-fade-out');
          setTimeout(() => { if (comboRef.current) comboRef.current.innerHTML = ''; }, getAnimDelay(500));
        }
      }, getAnimDelay(1500));
    };

    const { bombSelfErased = 0, repeatSelfErased = 0, starSelfErased = 0, rainbowSelfErased = 0 } = extraStats;
    let tc = Number(turnCombo) || 0;

    const isCurseHeartActive = tokens.some(t => t?.id === "curse_heart") && !hasSaintToken;
    if (isCurseHeartActive) {
      const heartMatches = colorComboCounts["heart"] || 0;
      tc = Math.max(0, tc - heartMatches);
    }

    setLastTurnCombo(tc);
    setLastErasedColorCounts(finalErasedColorCounts);

    let bonus = 0;
    let multiplier = 1;
    let addedMultiplier = 0.0;
    let multMultiplier = 1.0;
    let debuffMultiplier = 1.0;
    let baseMultiplier = 1.0; // 新規追加: からっぽの財布、重力逆転、一筆書きの誓約用の基礎コンボ倍率
    let exponentialBonus = 0;
    let exponentialMultiplier = 0.0;
    let timeMultiplier = 1;
    const matchedColorSet = new Set(Object.keys(colorComboCounts).filter(k => colorComboCounts[k] > 0));
    if (isCurseHeartActive) matchedColorSet.delete("heart");

    let moveDropBonus = 0;
    let maxMoveDropThisTurn = 0;
    if (engineRef.current && engineRef.current.state) {
      engineRef.current.state.forEach(row => {
        row.forEach(orb => {
          if (orb && orb.isMoveDrop) {
            moveDropBonus += (orb.moveCount || 0);
            if ((orb.moveCount || 0) > maxMoveDropThisTurn) {
              maxMoveDropThisTurn = orb.moveCount || 0;
            }
          }
        });
      });
    }

    const baseEffective = tokens.map((t, index) => {
      if (!t) return t;
      if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
        return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
      }
      return t;
    });

    const isTrialActive = activeBuffs.some(b => b?.action === "trial_stage_active");
    const hasTrialSuccess = activeBuffs.some(b => b?.action === "trial_success");

    const leadToken = tokens[0];
    const leadColor = (leadToken && leadToken.effect === 'element_lead') ? leadToken.params?.color : null;
    const effectiveTokens = [];
    if (!isTrialActive) {
      baseEffective.forEach(t => {
        if (!t) return;
        effectiveTokens.push(t);
        if (leadColor && t.type === 'passive') {
          const isMatched = (t.attributes && t.attributes.includes(leadColor)) || (t.params?.color === leadColor);
          if (isMatched) {
            effectiveTokens.push({ ...t, instanceId: `${t.instanceId || t.id}_dup` });
          }
        }
      });

      if (hasTrialSuccess) {
        const duplicated = [];
        effectiveTokens.forEach(t => {
          duplicated.push({ ...t, instanceId: `${t.instanceId || t.id}_trial_dup` });
        });
        effectiveTokens.push(...duplicated);
      }
    }

    const masteryToken = effectiveTokens.find(t => t?.effect === "additive_mastery");
    const hasMastery = !!masteryToken;
    const masteryVal = hasMastery ? masteryToken.values[(masteryToken.level || 1) - 1] : 1;

    const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power") || isTrialActive;
    const isCursePassiveNull = activeBuffs.some(b => b?.action === "curse_passive_null") && !hasSaintToken;
    const animationMode = settings?.comboAnimationMode || 'instant';
    const isInstant = animationMode === 'instant';

    let limitBreakerLevel = 0;
    let hasAbsoluteLimitBreak = false;
    effectiveTokens.forEach(t => {
      if (t && t.effect === "limit_break") {
        const lv = t.level || 1;
        if (lv > limitBreakerLevel) limitBreakerLevel = lv;
      }
      if (t && t.effect === "absolute_limit_break") {
        hasAbsoluteLimitBreak = true;
      }
    });

    const applyMultiplierCap = (baseVal, token) => {
      if (hasAbsoluteLimitBreak) return baseVal;
      if (!token || !token.maxMultipliers) return baseVal;
      const lv = token.level || 1;
      let limit = token.maxMultipliers[lv - 1];
      if (limit === undefined) return baseVal;

      if (limitBreakerLevel === 1) limit *= 2;
      else if (limitBreakerLevel === 2) limit *= 5;
      else if (limitBreakerLevel >= 3) limit *= 20;

      if (baseVal > limit) {
        return limit;
      }
      return baseVal;
    };

    const logData = {
      tokens: effectiveTokens,
      matchedColors: Array.from(matchedColorSet),
      colorComboCounts,
      erasedColorCounts: finalErasedColorCounts,
      turnCombo: tc,
      shapes,
      isAllClear,
      bonuses: [],
      multipliers: [],
      bonusSteps: [],
      multiplierSteps: [],
    };

    if (isAllClear) {
      addedMultiplier += 1.0;
      logData.multipliers.push(`all_clear_multiplier:+1.0`);
      logData.multiplierSteps.push({ label: '全消しボーナス', value: 2, addedValue: 1.0, type: 'add' });
    }

    if (moveDropBonus > 0) {
      bonus += moveDropBonus;
      logData.bonuses.push(`move_drop:+${moveDropBonus}`);
      logData.bonusSteps.push({ label: 'ムーブドロップボーナス', value: moveDropBonus });
    }

    const squareCount = shapes.filter(s => s === 'square').length;
    if (squareCount > 0) {
      const baseSquareMult = Math.pow(2, squareCount);
      const addVal = baseSquareMult - 1.0;
      addedMultiplier += addVal;
      logData.multipliers.push(`base_square_bonus:+${addVal.toFixed(2)}`);
      logData.multiplierSteps.push({ label: '正方形消し(基礎)', value: baseSquareMult, addedValue: addVal, type: 'add' });
    }

    effectiveTokens.forEach((t) => {
      if (!t) return;
      if (isCursePassiveNull && t.type === 'passive') return;

      const lv = t.level || 1;
      const enchList = isEnchantDisabled ? [] : (t.enchantments || []);

      const checkEffect = (effect, params, val, tokenName, tokenId) => {
        if (effect === "turn_1_bonus" && turn === 1) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 10;
          bonus += v;
          logData.bonuses.push(`opener:+${v}`);
          logData.bonusSteps.push({ label: tokenName || '先制の心得', value: v, tokenId });
        }
        if (effect === "last_turn_mult" && turn === maxTurns) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.5;
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`clutch:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: tokenName || '土壇場の底力', value: v, addedValue: v - 1.0, type: 'add', tokenId });
        }
        if (effect === "multi_color" && matchedColorSet.size >= 4) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 3;
          bonus += v;
          logData.bonuses.push(`rainbow:+${v}`);
          logData.bonusSteps.push({ label: tokenName || '虹色の加護', value: v, tokenId });
        }
        if (effect === "single_color" && matchedColorSet.size > 0 && matchedColorSet.size <= 2) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.3;
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`sniper:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: tokenName || '一点突破', value: v, addedValue: v - 1.0, type: 'add', tokenId });
        }
        if (effect === "vertical_slash") {
          const colCount = shapes.filter(s => s === "column").length;
          if (colCount > 0) {
            if (isInstant) triggerPassive(tokenId);
            const v = val * colCount;
            bonus += v;
            logData.bonuses.push(`vertical_slash:+${v}`);
            logData.bonusSteps.push({ label: tokenName || '縦一閃', value: v, tokenId });
          }
        }
        const shapeMap = {
          "shape_match4": "len4",
          "shape_cross": "cross",
          "shape_row": "row",
          "shape_l": "l_shape",
          "shape_square": "square"
        };
        const targetShape = shapeMap[effect];
        if (targetShape) {
          const count = shapes.filter(s => s === targetShape).length;
          if (count > 0) {
            let totalMult = Math.pow(val || 1.0, count);
            totalMult = applyMultiplierCap(totalMult, t);
            addedMultiplier += (totalMult - 1.0);
            logData.multipliers.push(`${effect}:${val}^${count}=+${(totalMult - 1.0).toFixed(2)}`);
            logData.multiplierSteps.push({ label: tokenName || effect, value: totalMult, addedValue: totalMult - 1.0, type: 'add', tokenId });
          }
        }
        if (effect === "random_bonus") {
          if (isInstant) triggerPassive(tokenId);
          const rand = Math.floor(Math.random() * 21) - 5;
          bonus += rand;
          logData.bonuses.push(`gamble:${rand > 0 ? '+' : ''}${rand}`);
          if (rand !== 0) logData.bonusSteps.push({ label: tokenName || '運命の悪戯', value: rand, tokenId });
        }
        if (effect === "berserk_mode") {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.5;
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`berserk:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: tokenName || '狂戦士', value: v, addedValue: v - 1.0, type: 'add', tokenId });
        }
        if (effect === "skyfall_mult" && hasSkyfallCombo) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.4;
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`aftershock:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: tokenName || '追撃', value: v, addedValue: v - 1.0, type: 'add', tokenId });
        }
        if (effect === "critical_strike") {
          if (Math.random() < 0.2) {
            addedMultiplier += (val - 1.0);
            logData.multipliers.push(`CRITICAL!:+${(val - 1.0).toFixed(2)}`);
            logData.multiplierSteps.push({ label: tokenName || '会心の一撃!', value: val, addedValue: val - 1.0, type: 'add', tokenId });
            notify("会心の一撃！");
          }
        }
        if (effect === "color_multiplier_enc") {
          const color = params?.color;
          if (color && matchedColorSet.has(color)) {
            if (isInstant) triggerPassive(tokenId);
            const v = val || 1.2;
            addedMultiplier += (v - 1.0);
            logData.multipliers.push(`color_enc_${color}:+${(v - 1.0).toFixed(2)}`);
            logData.multiplierSteps.push({ label: tokenName || `色別連舞(${color})`, value: v, addedValue: v - 1.0, type: 'add', tokenId });
          }
        }
        if (effect === "acrobat") {
          if (colorComboCounts['heart'] >= 2) {
            if (isInstant) triggerPassive(tokenId);
            multMultiplier *= 7.0;
            logData.multipliers.push(`acrobat:x7.0`);
            logData.multiplierSteps.push({ label: tokenName || '曲芸師', value: 7.0, type: 'mult', tokenId });
          }
        }
        if (effect === "color_combo_multiplier") {
          const color = params?.color;
          if (color && colorComboCounts[color] >= 2) {
            if (isInstant) triggerPassive(tokenId);
            const v = val || 1.0;
            multMultiplier *= v;
            logData.multipliers.push(`${tokenId}:x${v}`);
            logData.multiplierSteps.push({ label: tokenName || '属性コンボ倍率', value: v, type: 'mult', tokenId });
          }
        }
        if (effect === "color_connection_multiplier") {
          const color = params?.color;
          const count = params?.count || 4;
          const hasConnection = detailedShapes && detailedShapes.some(s => s.color === color && s.length >= count);
          if (color && hasConnection) {
            if (isInstant) triggerPassive(tokenId);
            const v = val || 1.0;
            multMultiplier *= v;
            logData.multipliers.push(`${tokenId}:x${v}`);
            logData.multiplierSteps.push({ label: tokenName || '属性連結倍率', value: v, type: 'mult', tokenId });
          }
        }
        if (effect === "noble_cross") {
          const hasCross = shapes.includes("cross");
          const otherSpecialShapes = ["len4", "l_shape", "row", "column", "square", "len5"];
          const hasOtherSpecial = shapes.some(s => otherSpecialShapes.includes(s));
          if (hasCross && !hasOtherSpecial) {
            if (isInstant) triggerPassive(tokenId);
            baseMultiplier *= val;
            logData.multipliers.push(`noble_cross:x${val}`);
            logData.multiplierSteps.push({ label: tokenName || '孤高の十字架', value: val, type: 'mult', tokenId });
          }
        }
        if (effect === "quad_frenzy") {
          const len4Count = shapes.filter(s => s === "len4").length;
          if (len4Count >= 3) {
            if (isInstant) triggerPassive(tokenId);
            multMultiplier *= val;
            logData.multipliers.push(`quad_frenzy:x${val}`);
            logData.multiplierSteps.push({ label: tokenName || '四連の狂騒', value: val, type: 'mult', tokenId });
          }
        }
        if (effect === "stardust_cross") {
          const crossCount = shapes.filter(s => s === "cross").length;
          if (crossCount > 0 && engineRef.current) {
            if (isInstant) triggerPassive(tokenId);
            notify(`${tokenName || '星屑の十字陣'}発動！スタードロップを${val}個生成！`);
            setTimeout(() => {
              if (engineRef.current && !engineRef.current._isDestroyed) {
                engineRef.current.spawnStarRandom(val);
              }
            }, 300);
          }
        }
        if (effect === "alchemy_square") {
          const squareCount = shapes.filter(s => s === "square").length;
          if (squareCount > 0 && engineRef.current) {
            if (isInstant) triggerPassive(tokenId);
            notify(`${tokenName || '錬金の方陣'}発動！強化ドロップを${val}個生成！`);
            setTimeout(() => {
              if (engineRef.current && !engineRef.current._isDestroyed) {
                engineRef.current.enhanceRandomOrbs(val);
              }
            }, 300);
          }
        }
        if (effect === "magic_l_shape") {
          const lCount = shapes.filter(s => s === "l_shape").length;
          if (lCount >= 2) {
            if (isInstant) triggerPassive(tokenId);
            notify(`${tokenName || '魔導のL字'}発動！全アクティブエネルギー+${val}！`);
            setTokens(prev => prev.map(tok => {
              if (!tok || tok.type !== 'skill') return tok;
              const newCharge = Math.min(tok.cost || 0, (tok.charge || 0) + val);
              return { ...tok, charge: newCharge };
            }));
          }
        }
        if (effect === "eroding_row") {
          if (extraStats && extraStats.erasedRowInfos && extraStats.erasedRowInfos.length > 0 && engineRef.current) {
            let triggered = false;
            extraStats.erasedRowInfos.forEach(info => {
              if (info && info.type) {
                if (!triggered) {
                  if (isInstant) triggerPassive(tokenId);
                  notify(`${tokenName || '侵食の横一陣'}発動！`);
                  triggered = true;
                }
                setTimeout(() => {
                  if (engineRef.current && !engineRef.current._isDestroyed) {
                    engineRef.current.convertRowNeighbors(info.r, info.type, val);
                  }
                }, 300);
              }
            });
          }
        }
        if (effect === "sky_god") {
          const totalTokens = tokens.filter(tok => tok).length;
          if (totalTokens <= 10) {
            if (isInstant) triggerPassive(tokenId);
            multMultiplier *= 4.0;
            logData.multipliers.push(`sky_god:x4.0`);
            logData.multiplierSteps.push({ label: tokenName || '空の神', value: 4.0, type: 'mult', tokenId });
          }
        }
        let shapeType = null;
        if (effect === "shape_match4") shapeType = "len4";
        if (effect === "shape_cross") shapeType = "cross";
        if (effect === "shape_row") shapeType = "row";
        if (effect === "shape_l") shapeType = "l_shape";
        if (effect === "shape_square") shapeType = "square";
 
        if (shapeType) {
          const count = shapes.filter(s => s === shapeType).length;
          if (count > 0) {
            if (isInstant) {
              for (let i = 0; i < count; i++) {
                setTimeout(() => triggerPassive(tokenId), getAnimDelay(i * 150));
              }
            }
          }
        }
      };

      const tId = t.instanceId || t.id;

      if (t.type === 'passive') {
        const val = t.values ? t.values[lv - 1] : t.value;
        checkEffect(t.effect, t.params, val, t.name, tId);
      }

      enchList.forEach(enc => {
        checkEffect(enc.effect, enc.params, enc.value, t.name, tId);
      });

      enchList.forEach(enc => {
        if (enc.effect === "fixed_add") { const v = enc.value || 3; bonus += v; logData.bonuses.push(`fixed_add:${v}`); logData.bonusSteps.push({ label: t.name || '固定加算', value: v, tokenId: tId }); }
        if (enc.effect === "star_add") { bonus += stars; logData.bonuses.push("star_add"); logData.bonusSteps.push({ label: t.name || 'スター加算', value: stars, tokenId: tId }); }
        if (enc.effect === "skip_turn_combo") { bonus += skippedTurnsBonus; logData.bonuses.push("skip_add"); if (skippedTurnsBonus > 0) logData.bonusSteps.push({ label: t.name || 'スキップボーナス', value: skippedTurnsBonus, tokenId: tId }); }
        if (enc.effect === "rarity_down_combo") { bonus += 1; logData.bonuses.push("rarity_down_combo:1"); logData.bonusSteps.push({ label: t.name || 'レア度下げ', value: 1, tokenId: tId }); }
      });
      if (t.effect === "base_add") {
        const v = t.values?.[lv - 1] || 0;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          bonus += v;
          logData.bonuses.push(`base_add:${v}`);
          logData.bonusSteps.push({ label: t.name || 'ベース加算', value: v, tokenId: tId });
        }
      }
      if (t.effect === "contract_of_void") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        multMultiplier *= v;
        logData.multipliers.push(`contract_of_void:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '契約の虚無', value: v, type: 'mult', tokenId: tId });
      }
      if (t.effect === "random_add") {
        const pool = t.values?.[lv - 1] || [0];
        const v = pool[Math.floor(Math.random() * pool.length)];
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`random_add:${v}`);
        if (v !== 0) logData.bonusSteps.push({ label: t.name || 'ランダム加算', value: v, tokenId: tId });
      }

      if (t.effect === "star_count_combo_add") {
        const rarity1Count = tokens.filter(tok => tok?.rarity === 1).length;
        const v = (t.values?.[lv - 1] || 1) * rarity1Count;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          bonus += v;
          logData.bonuses.push(`star1_combo_boost:${v}`);
          logData.bonusSteps.push({ label: t.name || '星1コンボ加算', value: v, tokenId: tId });
        }
      }

      if (t.effect === "attribute_count_multiplier") {
        const attr = t.params?.attribute;
        const attrCount = tokens.filter(tok => tok?.attributes?.includes(attr)).length;
        const v = (t.values?.[lv - 1] || 0.1) * attrCount;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          multMultiplier *= (1.0 + v);
          logData.multipliers.push(`${t.id}:x${(1.0 + v).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name, value: 1.0 + v, type: 'mult', tokenId: tId });
        }
      }

      if (t.effect === "no_attribute_multiplier") {
        const colorlessTokens = tokens.filter(tok => tok && (!tok.attributes || tok.attributes.length === 0));
        const otherColorless = colorlessTokens.filter(tok => tok.id !== "time_ext");

        if (otherColorless.length === 0) {
          let v = t.values?.[lv - 1] || 10;
          v = applyMultiplierCap(v, t);
          if (isInstant) triggerPassive(tId);
          multMultiplier *= v;
          logData.multipliers.push(`pure_power:x${v.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name, value: v, type: 'mult', tokenId: tId });
        }
      }

      if (t.effect === "star_count_combo_mult") {
        const rarity3Count = tokens.filter(tok => tok?.rarity === 3).length;
        let v = Math.pow(t.values?.[lv - 1] || 1, rarity3Count);
        v = applyMultiplierCap(v, t);
        if (v > 1) {
          multMultiplier *= v;
          logData.multipliers.push(`star3_mult_boost:x${v.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '星3コンボ倍率', value: v, type: 'mult', tokenId: tId });
        }
      }

      if (t.effect === "total_level_combo_add") {
        const totalLevel = tokens.reduce((sum, tok) => sum + (tok?.level || 0), 0);
        const v = (t.values?.[lv - 1] || 1) * totalLevel;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          bonus += v;
          logData.bonuses.push(`total_level_boost:${v.toFixed(1)}`);
          logData.bonusSteps.push({ label: t.name || '全レベル加算', value: v, tokenId: tId });
        }
      }

      if (t.effect === "level3_count_combo_mult") {
        const level3Count = tokens.filter(tok => tok?.level === 3).length;
        const base = t.values?.[lv - 1] || 1;
        let v = level3Count * base;
        v = applyMultiplierCap(v, t);
        if (v > 1) {
          if (isInstant) triggerPassive(tId);
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`level3_count_mult:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || 'レベル3数倍率', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
        }
      }

      if (t.effect === "star_erase_mult" && erasedByStarTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.0;
        let multVal = erasedByStarTotal * baseMult;
        multVal = applyMultiplierCap(multVal, t);
        if (multVal > 0) {
          if (isInstant) triggerPassive(tId);
          multMultiplier *= (1.0 + multVal);
          logData.multipliers.push(`star_erase_mult:x${(1.0 + multVal).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || 'スター消去倍率', value: 1.0 + multVal, type: 'mult', tokenId: tId });
        }
      }

      if (t.effect === "enchant_count_combo_mult") {
        const enchantCount = isEnchantDisabled ? 0 : tokens.reduce((sum, tok) => sum + (tok?.enchantments?.length || 0), 0);
        let v = Math.pow(t.values?.[lv - 1] || 1, enchantCount);
        v = applyMultiplierCap(v, t);
        if (v > 1) {
          if (isInstant) triggerPassive(tId);
          multMultiplier *= v;
          logData.multipliers.push(`enchant_mult_boost:x${v.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || 'エンチャント数倍率', value: v, type: 'mult', tokenId: tId });
        }
      }

      if (t.effect === "curse_count_combo_mult") {
        const curseCount = tokens.filter(tok => tok?.type === 'curse' || tok?.isCurse).length;
        let v = Math.pow(t.values?.[lv - 1] || 1, curseCount);
        v = applyMultiplierCap(v, t);
        if (v > 1) {
          if (isInstant) triggerPassive(tId);
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`curse_mult_boost:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '呪い数倍率', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
        }
      }
      if (t.effect === "stat_curse_removed") {
        const removedCount = currentRunStats.currentCursesRemoved || 0;
        const v = (t.values?.[lv - 1] || 1) * removedCount;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          addedMultiplier += v;
          logData.multipliers.push(`curse_eater:+${v}(removed:${removedCount})`);
          logData.multiplierSteps.push({ label: t.name || '呪い喰い', value: 1.0 + v, addedValue: v, type: 'add', tokenId: tId });
        }
      }
      if (t.effect === "stat_heart_chalice") {
        const heartCount = currentRunStats.totalHeartsErased || 0;
        const count = Math.floor(heartCount / 30);
        const base = t.values?.[lv - 1] || 2;
        if (count > 0) {
          let v = Math.pow(base, count);
          v = applyMultiplierCap(v, t);
          if (isInstant) triggerPassive(tId);
          multMultiplier *= v;
          exponentialMultiplier += (v - 1.0);
          logData.multipliers.push(`heart_chalice:x${v.toFixed(2)}(hearts:${heartCount})`);
          logData.multiplierSteps.push({ label: t.name || '生命の器', value: v, type: 'mult', tokenId: tId });
        }
      }
      if (t.effect === "stat_time_skipper") {
        const skipCount = currentRunStats.skipsPerformed || 0;
        const count = Math.floor(skipCount / 5);
        const base = t.values?.[lv - 1] || 1.3;
        if (count > 0) {
          let v = Math.pow(base, count);
          v = applyMultiplierCap(v, t);
          if (isInstant) triggerPassive(tId);
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`time_skipper:+${(v - 1.0).toFixed(2)}(skips:${skipCount})`);
          logData.multiplierSteps.push({ label: t.name || '早送りの極意', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
        }
      }

      if (t.effect === "bomb_erase_mult" && erasedByBombTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.2;
        let v = erasedByBombTotal * baseMult;
        v = applyMultiplierCap(v, t);
        if (isInstant) triggerPassive(tId);
        multMultiplier *= (1.0 + v);
        logData.multipliers.push(`bomb_erase_mult:x${(1.0 + v).toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || 'ボム消去倍率', value: 1.0 + v, type: 'mult', tokenId: tId });
      }

      if (t.effect === "repeat_combo_mult" && erasedByRepeatTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.3;
        let v = erasedByRepeatTotal * baseMult;
        v = applyMultiplierCap(v, t);
        if (isInstant) triggerPassive(tId);
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`repeat_combo_mult:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || 'リピート消去倍率', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
      }

      if (t.effect === "skyfall_bonus" && hasSkyfallCombo) {
        logData.bonuses.push(`skyfall:(applied)`);
      }

      if (t.effect === "combo_if_le" && turnCombo <= t.params?.combo) {
        const v = t.values?.[lv - 1] || 0;
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`combo_le_${t.params.combo}:${v}`);
        if (v > 0) logData.bonusSteps.push({ label: t.name || `${t.params.combo}コンボ以下`, value: v, tokenId: tId });
      }

      if (t.effect === "combo_if_ge" && turnCombo >= t.params?.combo) {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`combo_ge_${t.params.combo}:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || `${t.params.combo}コンボ以上`, value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
      }

      if (t.action === "skill_combo_bonus") {
        const val = t.params?.value || 0;
        bonus += val;
        logData.bonuses.push(`skill_lv3_bonus:+${val}`);
        if (val > 0) logData.bonusSteps.push({ label: t.name || 'スキルボーナス', value: val, tokenId: tId });
      }

      if (t.effect === "shape_bonus" && shapes.length > 0) {
        const shape = t.params?.shape;
        const v = t.values?.[lv - 1] || 0;
        const matchCount = shapes.filter(s => s === shape).length;
        if (matchCount > 0) {
          if (isInstant) {
            for (let i = 0; i < matchCount; i++) {
              setTimeout(() => triggerPassive(t.instanceId || t.id), getAnimDelay(i * 150));
            }
          }
          if (shape === "square") {
            let totalMult = Math.pow(v, matchCount);
            totalMult = applyMultiplierCap(totalMult, t);
            multMultiplier *= totalMult;
            logData.multipliers.push(`shape_square:mult_x${v}_count_${matchCount}`);
            logData.multiplierSteps.push({ label: t.name || '四方の型', value: totalMult, type: 'mult', tokenId: tId });
          } else if (shape === "len5") {
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_len5:time_x${v}_count_${matchCount}`);
          } else if (shape === "cross") {
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_cross:time_x${v}_count_${matchCount}`);
            logData.bonuses.push(`shape_${shape}:${v}x${matchCount}(applied)`);
          }
        }
      }

      if (t.id === "forbidden" || t.effect === "forbidden") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(t.instanceId || t.id);
        multMultiplier *= v;
        logData.multipliers.push(`forbidden:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '禁忌', value: v, type: 'mult', tokenId: tId });
      }
      if (t.action === "forbidden_temp" && engineRef.current?.noSkyfall) {
        if (isInstant) triggerPassive(t.instanceId || t.id);
        addedMultiplier += 2.0;
        logData.multipliers.push("forbidden_temp:+2.0");
        logData.multiplierSteps.push({ label: t.name || '禁忌(一時)', value: 3, addedValue: 2.0, type: 'add', tokenId: tId });
      }
      enchList.forEach(enc => {
        if (enc.effect === "lvl_mult") {
          addedMultiplier += (lv - 1.0);
          logData.multipliers.push(`lvl_mult:+${(lv - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: 'レベル倍率', value: lv, addedValue: lv - 1.0, type: 'add', tokenId: tId });
        }
        if (enc.effect === "stat_shape_all") {
          const totalShape = (currentRunStats.currentShapeLen4 || 0) +
            (currentRunStats.currentShapeRow || 0) +
            (currentRunStats.currentShapeLShape || 0) +
            (currentRunStats.currentShapeCross || 0) +
            (currentRunStats.currentShapeSquare || 0) +
            (currentRunStats.currentShapeLen5 || 0);
          const b = Math.floor(totalShape / 20) * 1;
          if (b > 0) {
            if (isInstant) triggerPassive(t.instanceId || t.id);
            bonus += b;
            logData.bonuses.push(`stat_shape_all(enc):+${b}`);
            logData.bonusSteps.push({ label: t.name || '万形の極意', value: b, tokenId: tId });
          }
        }
        if (enc.effect === "curse_catalyst") {
          const curseCount = tokens.filter(tok => tok != null && (tok.type === 'curse' || tok.isCurse)).length;
          if (curseCount > 0) {
            const v = Math.pow(1.5, curseCount);
            addedMultiplier += (v - 1.0);
            logData.multipliers.push(`curse_catalyst:+${(v - 1.0).toFixed(2)}`);
            logData.multiplierSteps.push({ label: '呪力変換', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
          }
        }
      });

      if (t.effect === "color_multiplier") {
        const colors = t.params?.colors;
        const count = t.params?.count;
        let match = false;
        if (colors && colors.every(c => matchedColorSet.has(c))) {
          match = true;
          logData.multipliers.push(`color_match:${t.id}`);
        } else if (count && matchedColorSet.size >= count) {
          match = true;
          logData.multipliers.push(`count_match:${t.id}`);
        }

        if (match) {
          if (isInstant) triggerPassive(tId);
          const mv = t.values?.[lv - 1] || 1;
          const isSecretArt = ["bonus_4c_fwlh", "bonus_5c", "bonus_6c"].includes(t.id);
          if (isSecretArt) {
            multMultiplier *= mv;
            logData.multiplierSteps.push({ label: t.name || '色倍率', value: mv, type: 'mult', tokenId: tId });
          } else {
            const addedVal = mv - 1.0;
            addedMultiplier += addedVal;
            logData.multipliers.push(`${t.id}:+${addedVal.toFixed(1)}`);
            logData.multiplierSteps.push({ label: t.name || '色倍率', value: mv, addedValue: addedVal, type: 'add', tokenId: tId });
          }
        }
      }

      if (t.effect === "color_count_bonus") {
        const color = t.params?.color;
        const requiredCount = t.params?.count || 0;
        if (color && finalErasedColorCounts[color] >= requiredCount) {
          const v = t.values?.[lv - 1] || 1;
          if (isInstant) triggerPassive(tId);
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`color_count_bonus_${color}_${requiredCount}:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || `色倍率(${color})`, value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
        }
      }

      if (t.effect === "shape_variety_mult") {
        const uniqueShapes = new Set(shapes).size;
        if (uniqueShapes >= 2) {
          const v = t.values?.[lv - 1] || 1;
          if (isInstant) triggerPassive(tId);
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`shape_variety_mult_${uniqueShapes}:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '形状多様性', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
        }
      }

      if (t.id === "giant") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        multMultiplier *= v;
        logData.multipliers.push(`giant:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '巨人の領域', value: v, type: 'mult', tokenId: tId });
      }

      if (t.effect === "desperate_stance") {
        const v = t.values?.[lv - 1] || 3;
        if (isInstant) triggerPassive(tId);
        multMultiplier *= v;
        logData.multipliers.push(`desperate_stance:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '背水の陣', value: v, type: 'mult', tokenId: tId });
      }

      if (t.effect === "greed_power") {
        const threshold = t.values?.[lv - 1] || 10;
        let greedBonus = Math.floor(stars / threshold);
        greedBonus = applyMultiplierCap(greedBonus, t);
        if (greedBonus > 0) {
          if (isInstant) triggerPassive(tId);
          addedMultiplier += greedBonus;
          logData.multipliers.push(`greed_power:+${greedBonus}(stars:${stars}/threshold:${threshold})`);
          logData.multiplierSteps.push({ label: t.name || '金満の暴力', value: 1.0 + greedBonus, addedValue: greedBonus, type: 'add', tokenId: tId });
        }
      }

      if (t.effect === "cursed_power") {
        const v = t.values?.[lv - 1] || 10;
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`cursed_power:${v}`);
        logData.bonusSteps.push({ label: t.name || '呪われた力', value: v, tokenId: tId });
      }

      if (t.effect === "stat_combo_記憶") {
        const v = t.values?.[lv - 1] || 1;
        const b = Math.floor((currentRunStats.maxBaseCombo || 0) / 5) * v;
        if (b > 0) {
          if (isInstant) triggerPassive(t.instanceId || t.id);
          bonus += b;
          exponentialBonus += b;
          logData.bonuses.push(`stat_combo_記憶:+${b}`);
          logData.bonusSteps.push({ label: t.name || '記憶', value: b, tokenId: tId });
        }
      }
      if (t.effect === "stat_mult_余韻") {
        const v = t.values?.[lv - 1] || 0.1;
        const maxMult = currentRunStats.maxComboMultiplier || 1;
        if (maxMult > 1) {
          let m = 1 + (maxMult * v);
          m = applyMultiplierCap(m, t);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          addedMultiplier += (m - 1.0);
          exponentialMultiplier += (m - 1.0);
          logData.multipliers.push(`stat_mult_余韻:+${(m - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '余韻', value: m, addedValue: m - 1.0, type: 'add', tokenId: tId });
        }
      }
      if (t.effect === "stat_mult_千手") {
        const v = t.values?.[lv - 1] || 1.1;
        const count = Math.floor((currentRunStats.currentTotalCombo || 0) / 100);
        if (count > 0) {
          let m = Math.pow(v, count);
          m = applyMultiplierCap(m, t);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multMultiplier *= m;
          exponentialMultiplier += (m - 1.0);
          logData.multipliers.push(`stat_mult_千手:x${m.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '千手', value: m, type: 'mult', tokenId: tId });
        }
      }
      if (t.effect === "stat_shape_cross" && shapes.includes("cross")) {
        logData.bonuses.push(`stat_shape_cross:(applied)`);
      }
      if (t.effect === "stat_shape_len4" && shapes.includes("len4")) {
        logData.bonuses.push(`stat_shape_len4:(applied)`);
      }
      if (t.effect === "stat_shape_row" && shapes.includes("row")) {
        const v = t.values?.[lv - 1] || 1.1;
        const rowCountInTurn = shapes.filter(s => s === "row").length;
        const count = Math.floor((currentRunStats.currentShapeRow || 0) / 5);
        if (count > 0 && rowCountInTurn > 0) {
          let m = Math.pow(Math.pow(v, count), rowCountInTurn);
          m = applyMultiplierCap(m, t);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          addedMultiplier += (m - 1.0);
          logData.multipliers.push(`stat_shape_row:+${(m - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '一列の叡智', value: m, addedValue: m - 1.0, type: 'add', tokenId: tId });
        }
      }
      if (t.effect === "stat_shape_square") {
        const v = t.values?.[lv - 1] || 1.5;
        const squareCountInTurn = shapes.filter(s => s === "square").length;
        const count = Math.floor((currentRunStats.currentShapeSquare || 0) / 5);
        if (count > 0 && squareCountInTurn > 0) {
          let m = Math.pow(Math.pow(v, count), squareCountInTurn);
          m = applyMultiplierCap(m, t);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          addedMultiplier += (m - 1.0);
          logData.multipliers.push(`stat_shape_square:+${(m - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '四方の叡智', value: m, addedValue: m - 1.0, type: 'add', tokenId: tId });
        }
      }
      if (t.effect === "stat_spend_star") {
        const v = t.values?.[lv - 1] || 1.1;
        const count = Math.floor((currentRunStats.currentStarsSpent || 0) / 50);
        if (count > 0) {
          let m = Math.pow(v, count);
          m = applyMultiplierCap(m, t);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          addedMultiplier += (m - 1.0);
          logData.multipliers.push(`stat_spend_star:+${(m - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '富の余韻', value: m, addedValue: m - 1.0, type: 'add', tokenId: tId });
        }
      }

      if (t.effect === 'rainbow_combo_bonus') {
        logData.bonuses.push(`rainbow:(applied)`);
      }
      if (t.effect === 'heart_combo_bonus') {
        logData.bonuses.push(`heart_combo:(applied)`);
      }
    });

    // --- からっぽの財布: 所持スターが規定数以下で基礎コンボ乗算 ---
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'empty_wallet') return;
      if (isCursePassiveNull && t.type === 'passive') return;
      const lv = t.level || 1;
      const tId = t.instanceId || t.id;
      const maxStars = (t.params?.maxStars || [3, 5, 10])[lv - 1];
      const multVal = t.values[lv - 1];
      if (stars <= maxStars) {
        if (isInstant) triggerPassive(tId);
        baseMultiplier *= multVal;
        logData.multipliers.push(`empty_wallet:x${multVal}`);
        logData.multiplierSteps.push({ label: t.name || 'からっぽの財布', value: multVal, type: 'mult', tokenId: tId });
      }
    });

    // --- 浪費の勲章: リロール累計回数に応じてコンボ倍率加算 ---
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'medal_of_spendthrift') return;
      if (isCursePassiveNull && t.type === 'passive') return;
      const lv = t.level || 1;
      const tId = t.instanceId || t.id;
      const threshold = t.values[lv - 1]; // 5 / 3 / 2
      const rerollCount = currentRunStats.currentShopRerolls || 0;
      const stacks = Math.floor(rerollCount / threshold);
      if (stacks > 0) {
        const addVal = stacks * 0.5;
        if (isInstant) triggerPassive(tId);
        addedMultiplier += addVal;
        logData.multipliers.push(`medal_of_spendthrift:+${addVal.toFixed(1)}`);
        logData.multiplierSteps.push({ label: t.name || '浪費の勲章', value: 1.0 + addVal, addedValue: addVal, type: 'add', tokenId: tId });
      }
    });

    // --- 一筆書きの誓約: 基礎コンボ乗算 ---
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'one_stroke_seal') return;
      if (isCursePassiveNull && t.type === 'passive') return;
      const lv = t.level || 1;
      const tId = t.instanceId || t.id;
      const multVal = t.values[lv - 1];
      if (isInstant) triggerPassive(tId);
      baseMultiplier *= multVal;
      logData.multipliers.push(`one_stroke_seal:x${multVal.toFixed(1)}`);
      logData.multiplierSteps.push({ label: t.name || '一筆書きの誓約', value: multVal, type: 'mult', tokenId: tId });
    });

    // --- 神速の思考: 操作時間2秒(2000ms)以上残しでコンボ倍率乗算 ---
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'speed_of_light_thought') return;
      if (isCursePassiveNull && t.type === 'passive') return;
      const lv = t.level || 1;
      const tId = t.instanceId || t.id;
      const multVal = t.values[lv - 1]; // 2 / 3 / 5
      if (remainingTimeMs >= 2000) {
        if (isInstant) triggerPassive(tId);
        multMultiplier *= multVal;
        logData.multipliers.push(`speed_of_light_thought:x${multVal.toFixed(1)}`);
        logData.multiplierSteps.push({ label: t.name || '神速の思考', value: multVal, type: 'mult', tokenId: tId });
      }
    });

    // --- 確率系発動基礎コンボ乗算 ---
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'probability_trigger_multiplier') return;
      if (isCursePassiveNull && t.type === 'passive') return;
      const lv = t.level || 1;
      const tId = t.instanceId || t.id;
      const multVal = t.values[lv - 1]; // 2 / 3 / 7
      if (window.probabilityTriggeredThisTurn) {
        if (isInstant) triggerPassive(tId);
        baseMultiplier *= multVal;
        logData.multipliers.push(`probability_trigger_multiplier:x${multVal}`);
        logData.multiplierSteps.push({ label: t.name || '運命の反響', value: multVal, type: 'mult', tokenId: tId });
      }
    });

    // --- 確率系累計発動回数コンボ倍率加算 ---
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'probability_trigger_add_combo') return;
      if (isCursePassiveNull && t.type === 'passive') return;
      const lv = t.level || 1;
      const tId = t.instanceId || t.id;
      const stepVal = t.values[lv - 1]; // 2 / 3 / 4
      const count = window.probabilityTriggeredTotalCount || 0;
      if (count > 0) {
        const addVal = count * stepVal;
        if (isInstant) triggerPassive(tId);
        addedMultiplier += addVal;
        logData.multipliers.push(`probability_trigger_add_combo:+${addVal}`);
        logData.multiplierSteps.push({ label: t.name || '確率の集束', value: 1.0 + addVal, addedValue: addVal, type: 'add', tokenId: tId });
      }
    });

    // --- 最後の輝き: サイクルの最終ターンのみ、基礎コンボ数乗算 ---
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'last_turn_burst') return;
      if (isCursePassiveNull && t.type === 'passive') return;
      const lv = t.level || 1;
      const tId = t.instanceId || t.id;
      const multVal = t.values[lv - 1]; // 2 / 3 / 4
      if (turn === maxTurns) {
        if (isInstant) triggerPassive(tId);
        baseMultiplier *= multVal;
        logData.multipliers.push(`last_turn_burst:x${multVal.toFixed(1)}`);
        logData.multiplierSteps.push({ label: t.name || '最後の輝き', value: multVal, type: 'mult', tokenId: tId });
      }
    });

    tokens.forEach((t) => {
      if (t?.effect === "min_match") {
        const lv = t.level || 1;
        const v = t.values?.[lv - 1] || 1;
        const tId2 = t.instanceId || t.id;
        if (isInstant) triggerPassive(tId2);
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`min_match:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || 'デュアルマッチ', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId2 });
      }
    });

    if (overLinkMultiplier > 1) {
      addedMultiplier += (overLinkMultiplier - 1.0);
      logData.multipliers.push(`overlink:+${(overLinkMultiplier - 1.0).toFixed(2)}`);
      logData.multiplierSteps.push({ label: 'オーバーリンク', value: overLinkMultiplier, addedValue: overLinkMultiplier - 1.0, type: 'add' });
    }

    setNextTurnTimeMultiplier(timeMultiplier);

    activeBuffs.forEach(buff => {
      if (buff.action === "temp_mult") {
        multMultiplier *= buff.params.multiplier;
        logData.multipliers.push(`temp_mult:x${buff.params.multiplier.toFixed(2)}`);
        logData.multiplierSteps.push({ label: 'スキル倍率', value: buff.params.multiplier, type: 'mult' });
      } else if (buff.action === "seal_of_power") {
        multMultiplier *= buff.params.multiplier;
        logData.multipliers.push(`seal_of_power:x${buff.params.multiplier.toFixed(2)}`);
        logData.multiplierSteps.push({ label: '封印の力', value: buff.params.multiplier, type: 'mult' });
      } else if (buff.action === "buff_len4_mult") {
        const count = shapes.filter(s => s === 'len4').length;
        if (count > 0) {
          const addVal = count;
          addedMultiplier += addVal;
          logData.multipliers.push(`buff_len4_mult:+${addVal}`);
          logData.multiplierSteps.push({ label: '四重奏の響き', value: 1.0 + addVal, addedValue: addVal, type: 'add' });
        }
      } else if (buff.action === "buff_row_mult") {
        const count = shapes.filter(s => s === 'row').length;
        if (count > 0) {
          const addVal = count * 2;
          addedMultiplier += addVal;
          logData.multipliers.push(`buff_row_mult:+${addVal}`);
          logData.multiplierSteps.push({ label: '烈線の陣', value: 1.0 + addVal, addedValue: addVal, type: 'add' });
        }
      } else if (buff.action === "buff_l_shape_mult") {
        const count = shapes.filter(s => s === 'l_shape').length;
        if (count > 0) {
          const addVal = count;
          addedMultiplier += addVal;
          logData.multipliers.push(`buff_l_shape_mult:+${addVal}`);
          logData.multiplierSteps.push({ label: '屈折の魔角', value: 1.0 + addVal, addedValue: addVal, type: 'add' });
        }
      } else if (buff.action === "buff_cross_mult") {
        const count = shapes.filter(s => s === 'cross').length;
        const multVal = count + 1;
        if (multVal > 1) {
          multMultiplier *= multVal;
          logData.multipliers.push(`buff_cross_mult:x${multVal}`);
          logData.multiplierSteps.push({ label: '聖十字の導き', value: multVal, type: 'mult' });
        }
      } else if (buff.action === "buff_square_mult") {
        const count = shapes.filter(s => s === 'square').length;
        if (count > 0) {
          const multVal = count * 3;
          multMultiplier *= multVal;
          logData.multipliers.push(`buff_square_mult:x${multVal}`);
          logData.multiplierSteps.push({ label: '魔方陣の極意', value: multVal, type: 'mult' });
        }
      } else if (buff.action === "buff_square_judgment") {
        // 正方形消し（3x3）が成立しているかチェック
        const hasSquare = shapes.includes("square");
        if (hasSquare) {
          baseMultiplier *= 10.0;
          logData.multipliers.push(`buff_square_judgment(success):x10.0`);
          logData.multiplierSteps.push({ label: '方陣の審判（成功）', value: 10.0, type: 'mult' });
        } else {
          baseMultiplier *= 0.25;
          logData.multipliers.push(`buff_square_judgment(fail):x0.25`);
          logData.multiplierSteps.push({ label: '方陣の審判（失敗）', value: 0.25, type: 'mult' });
        }
      } else if (buff.action === 'gravity_overdrive') {
        // 重力逆転発動ターンの基礎コンボ数×2
        baseMultiplier *= 2.0;
        logData.multipliers.push(`gravity_overdrive:x2.0`);
        logData.multiplierSteps.push({ label: '重力逆転', value: 2.0, type: 'mult' });
      } else if (buff.action === 'gale_gravity') {
        // 烈風の重力発動ターンの基礎コンボ数倍率適用
        const mult = buff.params.multiplier || 2.0;
        baseMultiplier *= mult;
        logData.multipliers.push(`gale_gravity:x${mult.toFixed(1)}`);
        logData.multiplierSteps.push({ label: '烈風の重力', value: mult, type: 'mult' });
      } else if (buff.action === "residual_multiplier_boost" && buff.params?.color) {
        const color = buff.params.color;
        const multVal = buff.params.multiplier;
        const erasedCount = erasedColorCounts[color] || 0;
        if (erasedCount > 0) {
          const addVal = erasedCount * multVal;
          addedMultiplier += addVal;
          logData.multipliers.push(`residual_multiplier_boost(${color}):+${addVal.toFixed(2)}`);
          logData.multiplierSteps.push({ label: buff.name || '残滓の爆発', value: 1.0 + addVal, addedValue: addVal, type: 'add' });
        }
      }
    });

    // --- 属性の誓約パッシブの倍率計算 ---
    const oppositions = {
      fire: "water",
      water: "fire",
      wood: "light",
      light: "wood",
      dark: "heart",
      heart: "dark"
    };
    effectiveTokens.forEach(t => {
      if (!t || t.effect !== 'element_contract' || !t.params?.color) return;
      if (isCursePassiveNull && t.type === 'passive') return;
      
      const myColor = t.params.color;
      const enemyColor = oppositions[myColor];
      const lv = t.level || 1;
      const multVal = t.values[lv - 1]; // 3 / 5 / 8
      const tId = t.instanceId || t.id;

      const myCombo = colorComboCounts[myColor] || 0;
      const enemyCombo = colorComboCounts[enemyColor] || 0;

      if (enemyCombo > 0) {
        // 敵対色を1コンボでも消した場合：半分
        if (isInstant) triggerPassive(tId);
        baseMultiplier *= 0.5;
        logData.multipliers.push(`${t.name}(ペナルティ):x0.5`);
        logData.multiplierSteps.push({ label: `${t.name} (契約違反)`, value: 0.5, type: 'mult', tokenId: tId });
      } else if (myCombo > 0) {
        // 自色を消し、かつ敵対色を消していない場合：倍率アップ
        if (isInstant) triggerPassive(tId);
        baseMultiplier *= multVal;
        logData.multipliers.push(`${t.name}:x${multVal}`);
        logData.multiplierSteps.push({ label: t.name, value: multVal, type: 'mult', tokenId: tId });
      }
    });

    if (hasMastery) {
      addedMultiplier = 0.0;
      multMultiplier = 1.0;
      exponentialMultiplier = 0.0;
      logData.multipliers = [`additive_mastery_active: multipliers disabled`];
      logData.multiplierSteps = [{ label: '加算の極意', value: masteryVal, isAdditiveMastery: true }];

      bonus *= masteryVal;
      exponentialBonus *= masteryVal;
      logData.bonuses.push(`additive_mastery:x${masteryVal}`);
      logData.bonusSteps.push({ label: '極意・加算増幅', value: `x${masteryVal}`, tokenId: masteryToken.instanceId || masteryToken.id });
    }

    // デバフである「半減の呪い」は基礎コンボに掛ける
    if (tokens.some(t => t?.id === "curse_half") && !hasSaintToken) {
      debuffMultiplier *= 0.5;
      logData.debuffMultiplier = debuffMultiplier;
      logData.debuffSteps = logData.debuffSteps || [];
      logData.debuffSteps.push({ label: '半減の呪い', value: 0.5 });
    }

    logData.finalBonus = bonus;

    // --- パッシブ: 狂神の偏愛 (炎 / 雨) の処理 ---
    let isZeroComboDueToDevotion = false;
    let devotionMultiplier = 1.0;
    
    const devotionFireToken = effectiveTokens.find(t => t && t.effect === 'devotion_fire');
    const devotionWaterToken = effectiveTokens.find(t => t && t.effect === 'devotion_water');

    const checkDevotion = (token, targetColor) => {
      if (!token) return;
      const lv = token.level || 1;
      const multVal = token.values[lv - 1] || 1;
      
      // 他属性が1コンボでも消えているかチェック
      const otherColors = ["fire", "water", "wood", "light", "dark", "heart"].filter(c => c !== targetColor);
      const hasOtherCombo = otherColors.some(c => (colorComboCounts[c] || 0) > 0);
      
      if (hasOtherCombo) {
        isZeroComboDueToDevotion = true;
        notify(`${token.name}のデメリット発動：他属性を消したため獲得コンボが0になります。`);
      } else if ((colorComboCounts[targetColor] || 0) > 0) {
        devotionMultiplier *= multVal;
        if (isInstant) triggerPassive(token.instanceId || token.id);
        logData.multipliers.push(`${token.effect}:x${multVal}`);
        logData.multiplierSteps.push({ label: token.name, value: multVal, type: 'mult', tokenId: token.instanceId || token.id });
      }
    };

    if (!isCursePassiveNull) {
      checkDevotion(devotionFireToken, 'fire');
      checkDevotion(devotionWaterToken, 'water');
    }

    // --- パッシブ: 四連の制約 / 横列の制約 の倍率処理 ---
    let restrictionMultiplier = 1;
    const fourMatchRestrToken = effectiveTokens.find(t => t && t.effect === 'four_match_restriction');
    const rowMatchRestrToken = effectiveTokens.find(t => t && t.effect === 'row_match_restriction');
    
    if (!isCursePassiveNull) {
      if (fourMatchRestrToken) {
        const len4Count = shapes.filter(s => s === "len4").length;
        if (len4Count > 0) {
          restrictionMultiplier *= len4Count;
          if (isInstant) triggerPassive(fourMatchRestrToken.instanceId || fourMatchRestrToken.id);
          logData.multipliers.push(`four_match_restriction:x${len4Count}`);
          logData.multiplierSteps.push({ label: fourMatchRestrToken.name, value: len4Count, type: 'mult', tokenId: fourMatchRestrToken.instanceId || fourMatchRestrToken.id });
        }
      }
      if (rowMatchRestrToken) {
        const rowCount = shapes.filter(s => s === "row").length;
        if (rowCount > 0) {
          restrictionMultiplier *= rowCount;
          if (isInstant) triggerPassive(rowMatchRestrToken.instanceId || rowMatchRestrToken.id);
          logData.multipliers.push(`row_match_restriction:x${rowCount}`);
          logData.multiplierSteps.push({ label: rowMatchRestrToken.name, value: rowCount, type: 'mult', tokenId: rowMatchRestrToken.instanceId || rowMatchRestrToken.id });
        }
      }
    }

    // 指示に基づき、マイナス倍率は基礎コンボのほうに掛け算する
    const finalBaseComboBeforeDebuff = tc + bonus;
    const finalBaseCombo = (tc > 0) ? Math.floor(finalBaseComboBeforeDebuff * debuffMultiplier * baseMultiplier * devotionMultiplier * restrictionMultiplier) : 0;
    
    // 犬神（コンボ数100以上で倍率10倍）
    const inugamiToken = effectiveTokens.find(t => t?.effect === "inugami");
    if (inugamiToken && finalBaseCombo >= 100) {
      if (isInstant) triggerPassive(inugamiToken.instanceId || inugamiToken.id);
      multMultiplier *= 10.0;
      logData.multipliers.push(`inugami:x10.0`);
      logData.multiplierSteps.push({ label: inugamiToken.name || '犬神', value: 10.0, type: 'mult', tokenId: inugamiToken.instanceId || inugamiToken.id });
    }

    // コンボ倍率の計算
    const finalComboMultiplier = (1.0 + addedMultiplier) * multMultiplier;
    multiplier = finalComboMultiplier; // 念のため multiplier 変数にも入れておく

    logData.finalMultiplier = finalComboMultiplier;
    logData.finalBaseCombo = finalBaseCombo;
    logData.finalComboMultiplier = finalComboMultiplier;
    logData.debuffMultiplier = debuffMultiplier;
    logData.addedMultiplier = addedMultiplier;

    const turnBaseCombo = (tc > 0) ? Math.floor(finalBaseComboBeforeDebuff - exponentialBonus) : 0;
    const turnBaseMultiplier = 1.0 + addedMultiplier - exponentialMultiplier;

    let effectiveCombo;
    if (isZeroComboDueToDevotion) {
      effectiveCombo = 0;
    } else if (isBeyondMode) {
      effectiveCombo = (tc > 0) ? Math.floor(finalBaseCombo * finalComboMultiplier) : 0;
    } else {
      effectiveCombo = (tc > 0) ? Math.min(Math.floor(finalBaseCombo * finalComboMultiplier), MAX_COMBO) : 0;
    }

    if (effectiveCombo >= MAX_COMBO) {
      setCurrentRunStats(prev => {
        if (!prev.hasReachedMaxCombo && !isPracticeMode) {
          setShowMaxComboWarpDialog(true);
        }
        return { ...prev, hasReachedMaxCombo: true };
      });
    }

    if (isPracticeMode) {
      setCurrentRunStats(prev => ({
        ...prev,
        maxCombo: Math.max(prev.maxCombo || 0, effectiveCombo)
      }));
      await showComboBreakdownLocal({
        tc, logData, turnCombo, bonus, multiplier, effectiveCombo, isBeyondMode, MAX_COMBO,
        finalBaseCombo, finalComboMultiplier, debuffMultiplier, addedMultiplier
      });
      return;
    }

    setCurrentRunTotalCombo(prev => prev + effectiveCombo);

    const currentEnchantCount = isEnchantDisabled ? 0 : tokens.reduce((sum, tok) => sum + (tok?.enchantments?.length || 0), 0);
    const measuredTime = totalMoveTimeRef.current;
    totalMoveTimeRef.current = 0;

    const countLen4 = shapes.filter(s => s === 'len4').length;
    const countCross = shapes.filter(s => s === 'cross').length;
    const countRow = shapes.filter(s => s === 'row').length;
    const countLShape = shapes.filter(s => s === 'l_shape').length;
    const countSquare = shapes.filter(s => s === 'square').length;

    setStats(prev => {
      return {
        ...prev,
        lifetimeTotalCombo: (prev.lifetimeTotalCombo || 0) + effectiveCombo,
        maxComboAllTime: Math.max(prev.maxComboAllTime || 0, effectiveCombo),
        maxComboMultiplierAllTime: Math.max(prev.maxComboMultiplierAllTime || 1, multiplier),
        maxBaseComboAllTime: Math.max(prev.maxBaseComboAllTime || 0, turnBaseCombo),
        maxBaseComboMultiplierAllTime: Math.max(prev.maxBaseComboMultiplierAllTime || 1, turnBaseMultiplier),
        maxEnchantsAllTime: Math.max(prev.maxEnchantsAllTime || 0, currentEnchantCount),
        lifetimeTotalMoveTime: (prev.lifetimeTotalMoveTime || 0) + measuredTime,
        lifetimeShapeLen4: (prev.lifetimeShapeLen4 || 0) + countLen4,
        lifetimeShapeCross: (prev.lifetimeShapeCross || 0) + countCross,
        lifetimeShapeRow: (prev.lifetimeShapeRow || 0) + countRow,
        lifetimeShapeLShape: (prev.lifetimeShapeLShape || 0) + countLShape,
        lifetimeShapeSquare: (prev.lifetimeShapeSquare || 0) + countSquare,
        maxMoveDropAllTime: Math.max(prev.maxMoveDropAllTime || 0, maxMoveDropThisTurn),
        maxBombEraseOnceAllTime: Math.max(prev.maxBombEraseOnceAllTime || 0, erasedByBombTotal),
        maxRepeatOnceAllTime: Math.max(prev.maxRepeatOnceAllTime || 0, erasedByRepeatTotal),
        lifetimeBombsErased: (prev.lifetimeBombsErased || 0) + bombSelfErased,
        lifetimeRepeatsErased: (prev.lifetimeRepeatsErased || 0) + repeatSelfErased,
        lifetimeStarDropsErased: (prev.lifetimeStarDropsErased || 0) + starSelfErased,
        lifetimeRainbowsErased: (prev.lifetimeRainbowsErased || 0) + rainbowSelfErased,
      };
    });
    setCurrentRunStats(prev => ({
      ...prev,
      currentTotalCombo: (prev.currentTotalCombo || 0) + effectiveCombo,
      maxCombo: Math.max(prev.maxCombo || 0, effectiveCombo),
      maxComboMultiplier: Math.max(prev.maxComboMultiplier || 1, multiplier),
      maxBaseCombo: Math.max(prev.maxBaseCombo || 0, turnBaseCombo),
      maxBaseComboMultiplier: Math.max(prev.maxBaseComboMultiplier || 1, turnBaseMultiplier),
      maxEnchants: Math.max(prev.maxEnchants || 0, currentEnchantCount),
      currentTotalMoveTime: (prev.currentTotalMoveTime || 0) + measuredTime,
      currentShapeLen4: (prev.currentShapeLen4 || 0) + countLen4,
      currentShapeCross: (prev.currentShapeCross || 0) + countCross,
      currentShapeRow: (prev.currentShapeRow || 0) + countRow,
      currentShapeLShape: (prev.currentShapeLShape || 0) + countLShape,
      currentShapeSquare: (prev.currentShapeSquare || 0) + countSquare,
      totalHeartsErased: (prev.totalHeartsErased || 0) + (finalErasedColorCounts.heart || 0),
      maxMoveDrop: Math.max(prev.maxMoveDrop || 0, maxMoveDropThisTurn),
      maxBombEraseOnce: Math.max(prev.maxBombEraseOnce || 0, erasedByBombTotal),
      maxRepeatOnce: Math.max(prev.maxRepeatOnce || 0, erasedByRepeatTotal),
      totalBombsErased: (prev.totalBombsErased || 0) + bombSelfErased,
      totalRepeatsErased: (prev.totalRepeatsErased || 0) + repeatSelfErased,
      totalStarDropsErased: (prev.totalStarDropsErased || 0) + starSelfErased,
      totalRainbowsErased: (prev.totalRainbowsErased || 0) + rainbowSelfErased,
    }));

    await showComboBreakdownLocal({
      tc, logData, turnCombo, bonus, effectiveCombo, MAX_COMBO,
      finalBaseCombo, finalComboMultiplier, debuffMultiplier, addedMultiplier
    });

    let totalReduction = 0;
    tokens.forEach((t) => {
      if (!t) return;
      if (t.id === "collector") {
        const threshold = t.values?.[(t.level || 1) - 1] || 5;
        totalReduction += (5 - threshold);
      }
    });
    const isCurseInitActive = tokens.some(t => t?.id === "curse_init") && !hasSaintToken;
    const baseStarThreshold = Math.max(1, 5 - totalReduction);
    const starThreshold = isCurseInitActive ? baseStarThreshold + 1 : baseStarThreshold;

    const currentProgress = starProgress + effectiveCombo;
    const totalStarsEarned = starThreshold > 0 ? Math.floor(currentProgress / starThreshold) : 0;
    const nextProgress = starThreshold > 0 ? currentProgress % starThreshold : 0;

    setStarProgress(nextProgress);

    if (totalStarsEarned > 0) {
      setStars((s) => s + totalStarsEarned);
      setCurrentRunStats(prev => ({ ...prev, totalStarsEarned: (prev.totalStarsEarned || 0) + totalStarsEarned }));
      // コンボ数によるスター獲得の通知は不要なため非表示
      soundManager.playSE(SE_IDS.MATCH_STAR);

      tokens.forEach(t => {
        if (t && t.id === "collector") {
          triggerPassive(t.instanceId || t.id);
        }
      });
    }

    setCycleTotalCombo(prev => {
      const updated = prev + effectiveCombo;
      if (updated >= effectiveTarget) {
        setGoalReached(prevGoalReached => {
          if (!prevGoalReached) {
            setShopRerollPrice(shopRerollBasePrice);
            soundManager.playSE(SE_IDS.GOAL_REACHED);
            const rewardMult = getRewardMultiplier();
            const rewardAmount = Math.floor(3 * rewardMult);
            setStars(s => s + rewardAmount);
            setCurrentRunStats(prevStats => ({
              ...prevStats,
              totalStarsEarned: (prevStats.totalStarsEarned || 0) + rewardAmount
            }));
            notify(`クリア報酬: ★+${rewardAmount}`);
          }
          return true;
        });
      }
      return updated;
    });

    let moveDropLuckyTriggered = false;
    let luckyTokenId = null;
    let luckyTokenName = "";
    tokens.forEach(t => {
      if (!t) return;
      const lv = t.level || 1;
      if (t.effect === "move_drop_lucky") {
        const validMultiples = [];
        if (lv >= 1) validMultiples.push(7);
        if (lv >= 2) validMultiples.push(5);
        if (lv >= 3) validMultiples.push(9);

        let match = false;
        if (engineRef.current && engineRef.current.state) {
          engineRef.current.state.forEach(row => {
            row.forEach(orb => {
              if (orb && orb.isMoveDrop && orb.moveCount > 0) {
                if (validMultiples.some(m => orb.moveCount % m === 0)) {
                  match = true;
                }
              }
            });
          });
        }

        if (match) {
          moveDropLuckyTriggered = true;
          luckyTokenId = t.instanceId || t.id;
          luckyTokenName = t.name;
        }
      }
    });

    if (moveDropLuckyTriggered) {
      logData.bonuses.push(`move_drop_lucky_max_charge`);
      logData.bonusSteps.push({ label: luckyTokenName || '幸運の歩み', value: 0, tokenId: luckyTokenId });
      setTimeout(() => soundManager.playSE(SE_IDS.SKILL_READY), 500);
    }

    let zeroComboBonusCharge = 0;
    if (effectiveCombo === 0) {
      tokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        if (t.effect === "zero_combo_charge") {
          const chargeVal = t.values?.[lv - 1] || 0;
          if (chargeVal > 0) {
            triggerPassive(t.instanceId || t.id);
            zeroComboBonusCharge += chargeVal;
          }
        }
      });
    }

    let extraAutoCharge = 0;
    tokens.forEach(t => {
      if (!t) return;
      const lv = t.level || 1;
      if (t.effect === "auto_charge") {
        const chargeVal = t.values?.[lv - 1] || 1;
        if (chargeVal > 0) {
          triggerPassive(t.instanceId || t.id);
          extraAutoCharge += chargeVal;
        }
      }
    });

    // --- ターン終了時の呪い処理 ---
    const hasRoulette = tokens.some(t => t?.id === "curse_roulette") && !hasSaintToken;
    const triggerRoulette = hasRoulette && Math.random() < 0.30;

    const hasDecay = tokens.some(t => t?.id === "curse_decay") && !hasSaintToken;
    const triggerDecay = hasDecay && Math.random() < 0.25;
    let decayTargetInstanceId = null;
    let decayTargetName = "";

    if (triggerDecay) {
      const upgradeable = tokens.filter(t => t && t.level > 1 && t.id !== "curse_decay");
      if (upgradeable.length > 0) {
        const chosen = upgradeable[Math.floor(Math.random() * upgradeable.length)];
        decayTargetInstanceId = chosen.instanceId;
        decayTargetName = chosen.name;
      }
    }

    setTokens(prevTokens => {
      let nextTokens = prevTokens.map(t => {
        if (!t) return t;
        let nt = { ...t };

        if (nt.type === 'skill') {
          const currentCharge = nt.charge || 0;
          const maxCharge = nt.cost || 0;
          const chargeBoostCount = nt.enchantments?.filter(e => e.effect === "charge_boost_passive").length || 0;

          if (moveDropLuckyTriggered) {
            nt.charge = maxCharge;
          } else {
            const chargeAmount = 1 + chargeBoostCount + zeroComboBonusCharge + extraAutoCharge;
            nt.charge = Math.min(maxCharge, currentCharge + chargeAmount);
            if (nt.charge === maxCharge && currentCharge < maxCharge) {
              soundManager.playSE(SE_IDS.SKILL_READY);
            }
          }
        }

        if (nt.isCountPassive) {
          const attr = nt.attributes?.[0];
          const erasedCount = finalErasedColorCounts[attr] || 0;
          nt.charge = (nt.charge || 0) + erasedCount;
        }

        return nt;
      });

      // 死神のルーレット発動：アクティブトークンのエネルギーを全て失う
      if (triggerRoulette) {
        nextTokens = nextTokens.map(t => (t && t.type === 'skill') ? { ...t, charge: 0 } : t);
      }

      // 侵食する影発動：ランダムなトークンのレベルを1にする
      if (decayTargetInstanceId) {
        nextTokens = nextTokens.map(t => (t && t.instanceId === decayTargetInstanceId) ? { ...t, level: 1 } : t);
      }

      nextTokens.forEach(t => {
        if (t && t.isCountPassive) {
          const threshold = t.values?.[(t.level || 1) - 1] || 30;
          if (t.charge >= threshold) {
            const triggerCount = Math.floor(t.charge / threshold);
            t.charge %= threshold;

            for (let i = 0; i < triggerCount; i++) {
              triggerPassive(t.instanceId || t.id);
              soundManager.playSE(SE_IDS.SKILL_READY);

              switch (t.id) {
                case "passive_fire_count": {
                  const maxSlots = INITIAL_TOKEN_SLOTS + (tokenSlotExpansionCount || 0);
                  const currentCount = nextTokens.filter(tok => tok !== null).length;
                  if (currentCount < maxSlots) {
                    const candidatePool = ALL_TOKEN_BASES.filter(b => b.type !== 'curse' && !b.isCurse && b.rarity <= 2 && b.id !== "passive_fire_count");
                    const randomBase = candidatePool[Math.floor(Math.random() * candidatePool.length)];
                    const isSkill = randomBase.type === 'skill';
                    const newToken = {
                      ...randomBase,
                      instanceId: Date.now() + Math.random(),
                      level: 1,
                      charge: isSkill ? (randomBase.cost || 0) : 0,
                      startValue: randomBase.condition ? getStatByCondition(randomBase.condition) : 0
                    };
                    addTokenToast(newToken, "を入手した！ (紅炎の供物)");
                  } else {
                    notify("紅炎の供物: トークン枠がいっぱいです！");
                  }
                  break;
                }
                case "passive_water_count": {
                  const targets = nextTokens.filter(tok => tok !== null && !tok.isCurse && tok.type !== 'curse');
                  if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    const randomEnc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
                    const newEnc = { ...randomEnc, instanceId: Date.now() + Math.random() };
                    target.enchantments = [...(target.enchantments || []), newEnc];
                    nextTokens.forEach(tok => {
                      if (tok && tok.id === 'legend_magician' && tok !== target) {
                        tok.enchantments = [...(tok.enchantments || []), { ...newEnc, instanceId: Date.now() + Math.random() }];
                      }
                    });
                    addTokenToast(target, `に「${randomEnc.name}」を付与した！ (蒼雨の供物)`);
                  }
                  break;
                }
                case "passive_wood_count": {
                  setStars(prevStars => {
                    const nextStars = Math.floor(prevStars * 1.2);
                    notify(`翠風の供物: スター所持数が ${formatJapaneseNumber(nextStars)} になった！`);
                    return nextStars;
                  });
                  break;
                }
                case "passive_dark_count": {
                  const upgradeable = nextTokens.filter(tok => tok !== null && (tok.level || 1) < 3 && !tok.isCurse && tok.type !== 'curse' && tok.id !== "passive_dark_count");
                  if (upgradeable.length > 0) {
                    const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                    const isFire = (target.attributes || []).includes("fire");
                    const isLight = (target.attributes || []).includes("light");
                    const hasFireFail = tokens.some(t => t?.id === "curse_level_fail_fire") && !hasSaintToken;
                    const hasLightFail = tokens.some(t => t?.id === "curse_level_fail_light") && !hasSaintToken;
                    
                    let success = true;
                    if (isFire && hasFireFail && Math.random() < 0.50) success = false;
                    if (isLight && hasLightFail && Math.random() < 0.50) success = false;

                    if (success) {
                      target.level = (target.level || 1) + 1;
                      addTokenToast(target, `が Lv${target.level} に上がった！ (常月の供物)`);
                    } else {
                      notify(`レベルアップ失敗！呪いにより ${target.name} の強化に失敗しました。`);
                    }
                  }
                  break;
                }
                case "passive_light_count": {
                  nextTokens.forEach(tok => {
                    if (tok && tok.type === 'skill') {
                      tok.charge = Math.min(tok.cost || 0, (tok.charge || 0) + 2);
                    }
                  });
                  notify("閃雷の供物: 全スキルのチャージが貯まった！");
                  break;
                }
              }
            }
          }
        }
      });

      return nextTokens;
    });

    if (triggerRoulette) {
      notify("死神のルーレット：アクティブトークンのエネルギーが全て失われた！");
    }
    if (decayTargetInstanceId && decayTargetName) {
      notify(`侵食する影：${decayTargetName} のレベルが1になった！`);
    }

    // --- 星塵の起爆剤: ボムとスターが同時消去された場合、ボムドロップを追加する ---
    if (bombSelfErased > 0 && starSelfErased > 0 && engineRef.current) {
      effectiveTokens.forEach(t => {
        if (!t || t.effect !== 'stardust_catalyst') return;
        const lv = t.level || 1;
        const spawnCount = t.values[lv - 1];
        triggerPassive(t.instanceId || t.id);
        notify(`星塵の起爆剤発動！ボムドロップが${spawnCount}個落下する！`);
        setTimeout(() => {
          if (engineRef.current && !engineRef.current._isDestroyed) {
            engineRef.current.spawnBombRandom(spawnCount);
          }
        }, 300);
      });
    }

    // --- ムーブ・リピーター: ムーブドロップ累計が閾値を越えるたびにリピートドロップを変換 ---
    if (moveDropBonus > 0) {
      effectiveTokens.forEach(t => {
        if (!t || t.effect !== 'move_repeater') return;
        const lv = t.level || 1;
        const threshold = t.values[lv - 1]; // 30 / 20 / 10
        const prevTotal = currentRunStats.currentMoveDropTotal || 0;
        const newTotal = prevTotal + moveDropBonus;
        const prevStacks = Math.floor(prevTotal / threshold);
        const newStacks = Math.floor(newTotal / threshold);
        const gained = newStacks - prevStacks;
        if (gained > 0 && engineRef.current) {
          triggerPassive(t.instanceId || t.id);
          notify(`ムーブ・リピーター発動！リピートドロップが${gained}個変換！`);
          setTimeout(() => {
            if (engineRef.current && !engineRef.current._isDestroyed) {
              engineRef.current.spawnRepeatRandom(gained);
            }
          }, 300);
        }
        setCurrentRunStats(prev => ({ ...prev, currentMoveDropTotal: newTotal }));
      });
    }

    const heartsErasedThisTurn = finalErasedColorCounts["heart"] || 0;
    setCurrentRunStats(prev => {
      const nextHearts = (prev.totalHeartsErased || 0) + heartsErasedThisTurn;

      const nextDrops = { ...(prev.currentDropsErased || { fire: 0, water: 0, wood: 0, light: 0, dark: 0, heart: 0 }) };
      Object.keys(finalErasedColorCounts).forEach(color => {
        if (nextDrops[color] !== undefined) {
          nextDrops[color] += finalErasedColorCounts[color];
        }
      });

      const nextStats = {
        ...prev,
        totalHeartsErased: nextHearts,
        currentDropsErased: nextDrops
      };

      return nextStats;
    });

    setStats(prev => {
      const nextLifetimeDrops = { ...(prev.lifetimeDropsErased || { fire: 0, water: 0, wood: 0, light: 0, dark: 0, heart: 0 }) };
      Object.keys(finalErasedColorCounts).forEach(color => {
        if (nextLifetimeDrops[color] !== undefined) {
          nextLifetimeDrops[color] += finalErasedColorCounts[color];
        }
      });
      return { ...prev, lifetimeDropsErased: nextLifetimeDrops };
    });

    // --- パッシブ: 魔力還流・雷 / 魔力還流・心 の処理 ---
    const refluxLightToken = effectiveTokens.find(t => t && t.effect === 'magic_reflux_light');
    const refluxHeartToken = effectiveTokens.find(t => t && t.effect === 'magic_reflux_heart');

    const handleReflux = (token, count) => {
      if (!token || count < 15) return;
      const lv = token.level || 1;
      const refluxAddVal = token.values[lv - 1] || 0;
      if (refluxAddVal > 0) {
        triggerPassive(token.instanceId || token.id);
        notify(`${token.name}発動！発動中スキルの持続手番を+${refluxAddVal}手番延長！`);
        setActiveBuffs(prev => prev.map(b => {
          if (b.action && b.action.startsWith("curse_")) return b;
          if (b.action === "trial_stage_active" || b.action === "trial_success") return b;
          const newDur = b.duration + refluxAddVal;
          return { ...b, duration: newDur, maxDuration: Math.max(b.maxDuration || 0, newDur) };
        }));
      }
    };

    if (!isCursePassiveNull) {
      const lightErasedCount = finalErasedColorCounts["light"] || 0;
      const heartErasedCount = finalErasedColorCounts["heart"] || 0;
      handleReflux(refluxLightToken, lightErasedCount);
      handleReflux(refluxHeartToken, heartErasedCount);
    }

    // 試練の合格判定
    if (isTrialActive) {
      if (effectiveCombo >= 8) {
        notify("試練合格！全ドロップがスタープラスリピート化し、1ターン効果2倍＆確率+100%！");
        if (engineRef.current) {
          engineRef.current.makeAllOrbsStarPlusRepeat();
        }
        // trial_success バフを追加。次の減衰処理で duration 1 になるように 2 で追加
        setActiveBuffs(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: "trial_success",
            params: {},
            duration: 2,
            maxDuration: 2,
            name: "試練の合格",
          }
        ]);
      } else {
        notify("試練失敗... 8コンボに到達しませんでした。");
      }
    }

    if (!skipTurnProgressRef.current) {
      setActiveBuffs((prev) => {
        let nextBuffs = prev
          .map((b) => ({ ...b, duration: b.duration - 1 }))
          .filter((b) => b.duration > 0);

        if (hasUsedActiveSkillThisTurn) {
          prev.forEach(b => {
            // 風・雷 (10個以上消去)
            if (b.action === "residual_wind_active") {
              const woodCount = finalErasedColorCounts["wood"] || 0;
              if (woodCount >= 10) {
                const lv = b.level || 1;
                const extraTimeSec = b.values[lv - 1] || 1.0;
                const baseMult = b.effectValues[lv - 1] || 1.5;
                nextBuffs.push({
                  id: Date.now() + Math.random(),
                  action: "op_time_boost",
                  params: { extraTime: extraTimeSec * 1000 },
                  duration: 1,
                  name: `${b.name} (操作時間延長)`
                });
                nextBuffs.push({
                  id: Date.now() + Math.random() + 0.1,
                  action: "temp_mult",
                  params: { multiplier: baseMult },
                  duration: 1,
                  name: `${b.name} (コンボ倍率)`
                });
                notify(`烈風の残滓発動！次ターンの操作時間+${extraTimeSec}秒、基礎コンボ${baseMult}倍！`);
              }
            }
            if (b.action === "residual_thunder_active") {
              const lightCount = finalErasedColorCounts["light"] || 0;
              if (lightCount >= 10) {
                const lv = b.level || 1;
                const extraTimeSec = b.values[lv - 1] || 1.0;
                const baseMult = b.effectValues[lv - 1] || 1.5;
                nextBuffs.push({
                  id: Date.now() + Math.random(),
                  action: "op_time_boost",
                  params: { extraTime: extraTimeSec * 1000 },
                  duration: 1,
                  name: `${b.name} (操作時間延長)`
                });
                nextBuffs.push({
                  id: Date.now() + Math.random() + 0.1,
                  action: "temp_mult",
                  params: { multiplier: baseMult },
                  duration: 1,
                  name: `${b.name} (コンボ倍率)`
                });
                notify(`迅雷の残滓発動！次ターンの操作時間+${extraTimeSec}秒、基礎コンボ${baseMult}倍！`);
              }
            }
            // 月・心 (10個以下消去)
            if (b.action === "residual_dark_active") {
              const darkCount = finalErasedColorCounts["dark"] || 0;
              if (darkCount <= 10) {
                const lv = b.level || 1;
                const extraTimeSec = b.values[lv - 1] || 1.0;
                const comboAdd = b.effectValues[lv - 1] || 10;
                nextBuffs.push({
                  id: Date.now() + Math.random(),
                  action: "op_time_boost",
                  params: { extraTime: extraTimeSec * 1000 },
                  duration: 1,
                  name: `${b.name} (操作時間延長)`
                });
                nextBuffs.push({
                  id: Date.now() + Math.random() + 0.1,
                  action: "color_combo_add_residual",
                  params: { color: "dark", value: comboAdd },
                  duration: 1,
                  name: `${b.name} (コンボ加算)`
                });
                notify(`月の残滓発動！次ターンの操作時間+${extraTimeSec}秒、月消去時コンボ+${comboAdd}！`);
              }
            }
            if (b.action === "residual_heart_active") {
              const heartCount = finalErasedColorCounts["heart"] || 0;
              if (heartCount <= 10) {
                const lv = b.level || 1;
                const extraTimeSec = b.values[lv - 1] || 1.0;
                const comboAdd = b.effectValues[lv - 1] || 10;
                nextBuffs.push({
                  id: Date.now() + Math.random(),
                  action: "op_time_boost",
                  params: { extraTime: extraTimeSec * 1000 },
                  duration: 1,
                  name: `${b.name} (操作時間延長)`
                });
                nextBuffs.push({
                  id: Date.now() + Math.random() + 0.1,
                  action: "color_combo_add_residual",
                  params: { color: "heart", value: comboAdd },
                  duration: 1,
                  name: `${b.name} (コンボ加算)`
                });
                notify(`心の残滓発動！次ターンの操作時間+${extraTimeSec}秒、回復消去時コンボ+${comboAdd}！`);
              }
            }
          });
        }

        if (engineRef.current) {
          engineRef.current.noSpecialEffects = nextBuffs.some(b => b.action === "trial_stage_active");
        }

        return nextBuffs;
      });

      // --- パッシブ: 流星群 (スタードロップ追加落下) ---
      const meteorShowerToken = effectiveTokens.find(t => t && t.effect === 'meteor_shower');
      if (meteorShowerToken && erasedByStarTotal > 0) {
        const lv = meteorShowerToken.level || 1;
        const prob = meteorShowerToken.values[lv - 1]; // 0.30 / 0.50 / 0.70
        let pendingStars = 0;
        for (let i = 0; i < erasedByStarTotal; i++) {
          if (Math.random() < prob) {
            pendingStars++;
          }
        }
        if (pendingStars > 0) {
          triggerPassive(meteorShowerToken.instanceId || meteorShowerToken.id);
          engineRef.current.meteorShowerPendingStars = (engineRef.current.meteorShowerPendingStars || 0) + pendingStars;
          notify(`流星群！ スタードロップが ${pendingStars} 個追加で降り注ぐ！`);
        }
      }

      // --- パッシブ: 再再生 (リピート再生成) ---
      const repeatRegenToken = effectiveTokens.find(t => t && t.effect === 'repeat_regeneration');
      if (repeatRegenToken && erasedByRepeatTotal > 0) {
        const lv = repeatRegenToken.level || 1;
        const prob = repeatRegenToken.values[lv - 1]; // 0.30 / 0.50 / 0.70
        let regenCount = 0;
        for (let i = 0; i < erasedByRepeatTotal; i++) {
          if (Math.random() < prob) {
            regenCount++;
          }
        }
        if (regenCount > 0) {
          triggerPassive(repeatRegenToken.instanceId || repeatRegenToken.id);
          notify(`再再生！ リピートドロップを ${regenCount} 個再生成します。`);
          setTimeout(() => {
            if (engineRef.current && !engineRef.current._isDestroyed) {
              engineRef.current.spawnRepeatRandom(regenCount);
            }
          }, 300);
        }
      }

      // --- パッシブ: 爆炎の連鎖 (ボム爆発で消えた通常ドロップを再生成) ---
      const chainExplosionToken = effectiveTokens.find(t => t && t.effect === 'chain_explosion');
      if (chainExplosionToken && erasedByBombTotal > 0 && engineRef.current.erasedByBombColors?.length > 0) {
        const lv = chainExplosionToken.level || 1;
        const prob = chainExplosionToken.values[lv - 1]; // 0.20 / 0.30 / 0.50
        if (Math.random() < prob) {
          triggerPassive(chainExplosionToken.instanceId || chainExplosionToken.id);
          const colorList = [...engineRef.current.erasedByBombColors];
          notify(`爆炎の連鎖！ 消滅した通常ドロップを ${Math.min(colorList.length, 30)} 個再生成します。`);
          setTimeout(() => {
            if (engineRef.current && !engineRef.current._isDestroyed) {
              engineRef.current.spawnRegeneratedDrops(colorList);
            }
          }, 300);
        }
      }

      setHasUsedActiveSkillThisTurn(false);
    }

    if (!skipTurnProgressRef.current) {
      setTurn((prev) => prev + 1);
    }

    if (engineRef.current) {
      const hasForbiddenLiteral = tokens.some((t) => t?.id === "forbidden" || t?.effect === "forbidden");
      const hasCurseSkyfall = tokens.some((t) => (t?.id === "curse_skyfall" || t?.effect === "curse_skyfall") && !hasSaintToken);
      engineRef.current.noSkyfall = hasForbiddenLiteral || hasCurseSkyfall;
      // 重力逆転バフや烈風の重力バフがターン終了で失效した場合は重力方向をリセット
      const gravityOverdriveBuff = activeBuffs.find(b => b.action === 'gravity_overdrive' && b.duration > 1);
      const galeGravityBuff = activeBuffs.find(b => b.action === 'gale_gravity' && b.duration > 1);
      if (galeGravityBuff) {
        engineRef.current.gravityDirection = galeGravityBuff.params?.direction || 'right';
      } else if (gravityOverdriveBuff) {
        engineRef.current.gravityDirection = 'up';
      } else {
        engineRef.current.gravityDirection = 'down';
      }

      // --- ターン終了時パッシブによる盤面変化効果の処理 ---
      let boardChanged = false;
      const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
      const isCursePassiveNull = activeBuffs.some(b => b?.action === "curse_passive_null") && !hasSaintToken;

      // 確率系トークンの確率計算用ヘルパー
      const getModifiedProbability = (baseProb, tokenInstanceId) => {
        // パッシブ効果による加算
        let addedProb = 0;
        effectiveTokens.forEach(tok => {
          if (tok && tok.effect === "add_probability" && tok.instanceId !== tokenInstanceId) {
            const lv = tok.level || 1;
            addedProb += tok.values[lv - 1] || 0;
          }
        });
        let result = baseProb + addedProb;
        // バフによる倍増
        if (activeBuffs.some(b => b.action === "double_probability")) {
          result *= 2;
        }
        // 試練合格バフによる確率+100%
        if (activeBuffs.some(b => b.action === "trial_success")) {
          result += 100;
        }
        // 即時発動バフ
        if (activeBuffs.some(b => b.action === "force_trigger_probabilities")) {
          return 100;
        }
        return result;
      };

      if (!isCursePassiveNull) {
        // 1. 全変換 (turn_end_full_board)
        effectiveTokens.forEach(t => {
          if (!t || t.effect !== 'turn_end_full_board') return;
          const lv = t.level || 1;
          const prob = getModifiedProbability(t.values[lv - 1], t.instanceId || t.id); // 10 / 30 / 50
          const toColor = t.params?.to || 'water';
          if (Math.random() * 100 < prob) {
            triggerPassive(t.instanceId || t.id);
            engineRef.current.state.forEach(row => {
              row.forEach(orb => {
                if (orb && !orb.isMoveDrop) {
                  orb.type = toColor;
                  orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toColor}`;
                  const inner = orb.el.querySelector('.orb-inner');
                  if (inner) {
                    inner.className = `orb-inner orb-${toColor} shadow-lg`;
                    const span = inner.querySelector('span');
                    if (span) span.innerText = engineRef.current.icons[toColor] || '';
                  }
                }
              });
            });
            boardChanged = true;
          }
        });

        // 2. 確率変換 (turn_end_convert)
        effectiveTokens.forEach(t => {
          if (!t || t.effect !== 'turn_end_convert') return;
          const lv = t.level || 1;
          const prob = getModifiedProbability(t.values[lv - 1], t.instanceId || t.id); // 50 / 70 / 100
          const fromColor = t.params?.from || 'fire';
          const toColor = t.params?.to || 'dark';
          if (Math.random() * 100 < prob) {
            let triggered = false;
            engineRef.current.state.forEach(row => {
              row.forEach(orb => {
                if (orb && orb.type === fromColor && !orb.isRainbow && !orb.isMoveDrop) {
                  if (!triggered) {
                    triggerPassive(t.instanceId || t.id);
                    triggered = true;
                  }
                  orb.type = toColor;
                  orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toColor}`;
                  const inner = orb.el.querySelector('.orb-inner');
                  if (inner) {
                    inner.className = `orb-inner orb-${toColor} shadow-lg`;
                    const span = inner.querySelector('span');
                    if (span) span.innerText = engineRef.current.icons[toColor] || '';
                  }
                  boardChanged = true;
                }
              });
            });
          }
        });

        // 2b. アクティブバフによる確率変換 (turn_end_convert)
        activeBuffs.forEach(buff => {
          if (!buff || buff.action !== 'turn_end_convert') return;
          const fromColor = buff.params?.from;
          const toColor = buff.params?.to;
          if (fromColor && toColor) {
            engineRef.current.state.forEach(row => {
              row.forEach(orb => {
                if (orb && orb.type === fromColor && !orb.isRainbow && !orb.isMoveDrop) {
                  orb.type = toColor;
                  orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toColor}`;
                  const inner = orb.el.querySelector('.orb-inner');
                  if (inner) {
                    inner.className = `orb-inner orb-${toColor} shadow-lg`;
                    const span = inner.querySelector('span');
                    if (span) span.innerText = engineRef.current.icons[toColor] || '';
                  }
                  boardChanged = true;
                }
              });
            });
          }
        });

        // 2c. アクティブバフによる多色確率変換 (turn_end_convert_multi)
        activeBuffs.forEach(buff => {
          if (!buff || buff.action !== 'turn_end_convert_multi') return;
          const fromTypes = buff.params?.types;
          const toColor = buff.params?.to;
          if (fromTypes && toColor) {
            engineRef.current.state.forEach(row => {
              row.forEach(orb => {
                if (orb && fromTypes.includes(orb.type) && !orb.isRainbow && !orb.isMoveDrop) {
                  orb.type = toColor;
                  orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toColor}`;
                  const inner = orb.el.querySelector('.orb-inner');
                  if (inner) {
                    inner.className = `orb-inner orb-${toColor} shadow-lg`;
                    const span = inner.querySelector('span');
                    if (span) span.innerText = engineRef.current.icons[toColor] || '';
                  }
                  boardChanged = true;
                }
              });
            });
          }
        });

        // 3. 浸食 (erosion_color)
        effectiveTokens.forEach(t => {
          if (!t || t.effect !== 'erosion_color') return;
          const lv = t.level || 1;
          const prob = getModifiedProbability(t.values[lv - 1], t.instanceId || t.id); // 30 / 50 / 70
          const targetColor = t.params?.color || 'fire';
          
          // まず浸食元となるドロップの位置を記憶する
          const sourceCoords = [];
          engineRef.current.state.forEach((row, r) => {
            row.forEach((orb, c) => {
              if (orb && orb.type === targetColor && !orb.isMoveDrop && !orb.isRainbow) {
                sourceCoords.push({ r, c });
              }
            });
          });

          // 浸食元の周囲（上下左右）のドロップを確率で同化
          const dirs = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
          ];

          let triggered = false;
          sourceCoords.forEach(({ r, c }) => {
            dirs.forEach(({ dr, dc }) => {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < engineRef.current.rows && nc >= 0 && nc < engineRef.current.cols) {
                const neighbor = engineRef.current.state[nr][nc];
                if (neighbor && neighbor.type !== targetColor && !neighbor.isMoveDrop && !neighbor.isRainbow && !neighbor.isBomb && !neighbor.isRepeat && !neighbor.isStar) {
                  if (Math.random() * 100 < prob) {
                    if (!triggered) {
                      triggerPassive(t.instanceId || t.id);
                      triggered = true;
                    }
                    neighbor.type = targetColor;
                    neighbor.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${targetColor}`;
                    const inner = neighbor.el.querySelector('.orb-inner');
                    if (inner) {
                      inner.className = `orb-inner orb-${targetColor} shadow-lg`;
                      const span = inner.querySelector('span');
                      if (span) span.innerText = engineRef.current.icons[targetColor] || '';
                    }
                    boardChanged = true;
                  }
                }
              }
            });
          });
        });

        // 4. ランダム生成 (turn_end_spawn)
        effectiveTokens.forEach(t => {
          if (!t || t.effect !== 'turn_end_spawn') return;
          const lv = t.level || 1;
          const prob = getModifiedProbability(t.values[lv - 1], t.instanceId || t.id); // 70 / 90 / 100
          const color = t.params?.color || 'heart';
          const count = t.params?.count || 5;
          if (Math.random() * 100 < prob) {
            const normalOrbs = [];
            engineRef.current.state.forEach((row, r) => {
              row.forEach((orb, c) => {
                if (orb && orb.type !== color && !orb.isRainbow && !orb.isMoveDrop && !orb.isBomb && !orb.isRepeat && !orb.isStar) {
                  normalOrbs.push(orb);
                }
              });
            });

            if (normalOrbs.length > 0) {
              triggerPassive(t.instanceId || t.id);
              // シャッフル
              for (let i = normalOrbs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [normalOrbs[i], normalOrbs[j]] = [normalOrbs[j], normalOrbs[i]];
              }
              const targets = normalOrbs.slice(0, count);
              targets.forEach(orb => {
                orb.type = color;
                orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${color}`;
                const inner = orb.el.querySelector('.orb-inner');
                if (inner) {
                  inner.className = `orb-inner orb-${color} shadow-lg`;
                  const span = inner.querySelector('span');
                  if (span) span.innerText = engineRef.current.icons[color] || '';
                }
              });
              boardChanged = true;
            }
          }
        });

        // 4b. アクティブバフによるターン終了後ランダム生成 (turn_end_spawn)
        activeBuffs.forEach(buff => {
          if (!buff || buff.action !== 'turn_end_spawn') return;
          const color = buff.params?.color || 'heart';
          const count = buff.params?.count || 5;
          const normalOrbs = [];
          engineRef.current.state.forEach((row, r) => {
            row.forEach((orb, c) => {
              if (orb && orb.type !== color && !orb.isRainbow && !orb.isMoveDrop && !orb.isBomb && !orb.isRepeat && !orb.isStar) {
                normalOrbs.push(orb);
              }
            });
          });

          if (normalOrbs.length > 0) {
            for (let i = normalOrbs.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [normalOrbs[i], normalOrbs[j]] = [normalOrbs[j], normalOrbs[i]];
            }
            const targets = normalOrbs.slice(0, count);
            targets.forEach(orb => {
              orb.type = color;
              orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${color}`;
              const inner = orb.el.querySelector('.orb-inner');
              if (inner) {
                inner.className = `orb-inner orb-${color} shadow-lg`;
                const span = inner.querySelector('span');
                if (span) span.innerText = engineRef.current.icons[color] || '';
              }
            });
            boardChanged = true;
          }
        });

        // 5. 特殊ドロップ生成 (turn_end_special_spawn)
        effectiveTokens.forEach(t => {
          if (!t || t.effect !== 'turn_end_special_spawn') return;
          const lv = t.level || 1;
          const prob = getModifiedProbability(t.values[lv - 1], t.instanceId || t.id);
          if (Math.random() * 100 < prob) {
            const types = t.params?.types || []; // array of { type: 'bomb'|'repeat'|'star'|'plus', count: number }
            let spawnedAny = false;
            
            types.forEach(spawnSpec => {
              const count = spawnSpec.count || 1;
              const type = spawnSpec.type;
              
              // 空き候補を探す（対象の特殊属性をすでに持っておらず、かつ非虹・非ムーブドロップ）
              const candidates = [];
              engineRef.current.state.forEach((row) => {
                row.forEach((orb) => {
                  if (orb && !orb.isRainbow && !orb.isMoveDrop) {
                    if (type === 'bomb' && !orb.isBomb) candidates.push(orb);
                    else if (type === 'repeat' && !orb.isRepeat) candidates.push(orb);
                    else if (type === 'star' && !orb.isStar) candidates.push(orb);
                    else if (type === 'plus' && !orb.isEnhanced) candidates.push(orb);
                  }
                });
              });

              if (candidates.length > 0) {
                if (!spawnedAny) {
                  triggerPassive(t.instanceId || t.id);
                  spawnedAny = true;
                }
                // シャッフルして適用
                for (let i = candidates.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
                }
                const targets = candidates.slice(0, count);
                targets.forEach(orb => {
                  if (type === 'bomb') {
                    orb.isBomb = true;
                    if (orb.el) {
                      engineRef.current.addBombMark(orb.el);
                    }
                  } else if (type === 'repeat') {
                    orb.isRepeat = true;
                    if (orb.el) {
                      engineRef.current.addRepeatMark(orb.el);
                    }
                  } else if (type === 'star') {
                    orb.isStar = true;
                    if (orb.el) {
                      engineRef.current.addStarMark(orb.el);
                    }
                  } else if (type === 'plus') {
                    orb.isEnhanced = true;
                    if (orb.el) {
                      const inner = orb.el.querySelector('.orb-inner');
                      if (inner && !inner.querySelector('.enhanced-mark')) {
                        const star = document.createElement("div");
                        star.className = "enhanced-mark absolute top-1 right-1 text-yellow-300 font-bold text-xs select-none pointer-events-none drop-shadow-md";
                        star.innerText = "+";
                        inner.appendChild(star);
                      }
                    }
                  }
                });
                boardChanged = true;
              }
            });
          }
        });

        // 6. スターのギャンブル (turn_end_star_gamble)
        effectiveTokens.forEach(t => {
          if (!t || t.effect !== 'turn_end_star_gamble') return;
          const lv = t.level || 1;
          const prob = getModifiedProbability(t.values[lv - 1], t.instanceId || t.id); // 5 / 7 / 10
          
          // 良い効果の判定 (確率操作系が乗る)
          if (Math.random() * 100 < prob) {
            triggerPassive(t.instanceId || t.id);
            soundManager.playSE(SE_IDS.MATCH_STAR);
            setStars(s => Math.floor(s * 1.5));
            notify(`${t.name}発動！所持スターが1.5倍になった！`);
          }
          
          // 悪い効果の判定 (確率操作系は乗らないので、素の 1%)
          if (Math.random() * 100 < 1) {
            triggerPassive(t.instanceId || t.id);
            soundManager.playSE(SE_IDS.CURSE_GET);
            setStars(s => Math.floor(s * 0.5));
            notify(`${t.name}の厄災！所持スターが半分になってしまった…`);
          }
        });

        // 7. トークンレベルのギャンブル (turn_end_token_gamble)
        effectiveTokens.forEach(t => {
          if (!t || t.effect !== 'turn_end_token_gamble') return;
          const lv = t.level || 1;
          const prob = getModifiedProbability(t.values[lv - 1], t.instanceId || t.id); // 5 / 7 / 10
          
          const targetTokens = tokens.filter(tok => tok !== null);
          if (targetTokens.length > 0) {
            // 良い効果 (確率操作系が乗る)
            if (Math.random() * 100 < prob) {
              const randIdx = Math.floor(Math.random() * targetTokens.length);
              const targetToken = targetTokens[randIdx];
              
              triggerPassive(t.instanceId || t.id);
              soundManager.playSE(SE_IDS.EQUIP_TOKEN);
              
              setTokens(prev => {
                const next = prev.map(tok => {
                  if (tok && tok.instanceId === targetToken.instanceId) {
                    const newLevel = 3;
                    return {
                      ...tok,
                      level: newLevel,
                      desc: getTokenDescription({ ...tok, level: newLevel }, newLevel, currentRunStats, prev, activeBuffs)
                    };
                  }
                  return tok;
                });
                return next;
              });
              notify(`${t.name}発動！[${targetToken.name}]のレベルが最大になった！`);
            }
            
            // 悪い効果 (確率操作系は乗らないので、素の 1%)
            if (Math.random() * 100 < 1) {
              const randIdx = Math.floor(Math.random() * targetTokens.length);
              const targetToken = targetTokens[randIdx];
              
              triggerPassive(t.instanceId || t.id);
              soundManager.playSE(SE_IDS.CURSE_GET);
              
              setTokens(prev => {
                const next = prev.map(tok => {
                  if (tok && tok.instanceId === targetToken.instanceId) {
                    const newLevel = 1;
                    return {
                      ...tok,
                      level: newLevel,
                      desc: getTokenDescription({ ...tok, level: newLevel }, newLevel, currentRunStats, prev, activeBuffs)
                    };
                  }
                  return tok;
                });
                return next;
              });
              notify(`${t.name}の厄災！[${targetToken.name}]のレベルが1になってしまった…`);
            }
          }
        });
      }

      if (boardChanged) {
        engineRef.current.render();
      }
    }

    skipTurnProgressRef.current = false;
  };

  useEffect(() => {
    handleTurnEndRef.current = handleTurnEnd;
    onPassiveTriggerRef.current = triggerPassive;
    onStarEraseRef.current = (count) => {
      const baseEffective = tokens.map((t, index) => {
        if (!t) return t;
        if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
          return { ...tokens[index - 1], instanceId: t.instanceId };
        }
        return t;
      });

      const isTrialActive = activeBuffs.some(b => b?.action === "trial_stage_active");
      const hasTrialSuccess = activeBuffs.some(b => b?.action === "trial_success");

      const leadToken = tokens[0];
      const leadColor = (leadToken && leadToken.effect === 'element_lead') ? leadToken.params?.color : null;
      const effectiveTokens = [];
      if (!isTrialActive) {
        baseEffective.forEach(t => {
          if (!t) return;
          effectiveTokens.push(t);
          if (leadColor && t.type === 'passive') {
            const isMatched = (t.attributes && t.attributes.includes(leadColor)) || (t.params?.color === leadColor);
            if (isMatched) {
              effectiveTokens.push({ ...t, instanceId: `${t.instanceId || t.id}_dup` });
            }
          }
        });

        if (hasTrialSuccess) {
          const duplicated = [];
          effectiveTokens.forEach(t => {
            duplicated.push({ ...t, instanceId: `${t.instanceId || t.id}_trial_dup` });
          });
          effectiveTokens.push(...duplicated);
        }
      }

      let extraStarsPerStarDropErase = 0;
      effectiveTokens.forEach((t) => {
        if (t && t.effect === "star_earn_boost") {
          extraStarsPerStarDropErase += t.values?.[(t.level || 1) - 1] || 0;
        }
      });
      // 明星の十字架 (star_cross_boost) の倍率処理
      let starEraseMultiplier = 1;
      const starCrossBoostToken = effectiveTokens.find(t => t && t.effect === "star_cross_boost");
      if (starCrossBoostToken && engineRef.current && engineRef.current.starCrossBoostActive) {
        const lv = starCrossBoostToken.level || 1;
        const multVal = starCrossBoostToken.values[lv - 1] || 1;
        starEraseMultiplier *= multVal;
        triggerPassive(starCrossBoostToken.instanceId || starCrossBoostToken.id);
        notify(`${starCrossBoostToken.name}発動！このターン獲得するすべてのスター量が${multVal}倍！`);
      }

      const amount = (2 + extraStarsPerStarDropErase) * count * starEraseMultiplier;
      setStars((s) => s + amount);
      notify(`+ ${amount} STARS!`);
      setCurrentRunStats(prev => ({
        ...prev,
        totalStarEarnedByDrops: (prev.totalStarEarnedByDrops || 0) + amount
      }));
      setStats(prev => ({
        ...prev,
        lifetimeStarEarnedByDrops: (prev.lifetimeStarEarnedByDrops || 0) + amount
      }));

      effectiveTokens.forEach(t => {
        if (t && t.effect === "star_earn_boost") {
          triggerPassive(t.instanceId || t.id);
        }
      });
    };
  });

  useEffect(() => {
    let needsUpdate = false;
    let nextTokens = [...tokens];

    if (nextTokens.some(t => t === null)) {
      nextTokens = nextTokens.filter(t => t !== null);
      needsUpdate = true;
    }

    const hasKingToken = nextTokens.some(t => t?.id === "legend_king");
    if (hasKingToken) {
      nextTokens = nextTokens.map(t => {
        if (!t || t.noLevelUp || t.level === 3) return t;
        needsUpdate = true;
        const newLevel = 3;
        return {
          ...t,
          level: newLevel,
          desc: getTokenDescription({ ...t, level: newLevel }, newLevel, currentRunStats, nextTokens, activeBuffs)
        };
      });
    }

    if (needsUpdate) {
      setTokens(nextTokens);
    }
  }, [tokens, currentRunStats, activeBuffs]);

  useEffect(() => {
    if (isEndlessMode) return;
    if (turn > maxTurns && !goalReached && !isGameOver) {
      // 魔法の石（id: legend_magic_stone）を所持しているかチェック
      const stoneIndex = tokens.findIndex(t => t?.id === "legend_magic_stone");
      if (stoneIndex !== -1) {
        // 魔法の石を破壊（tokens配列から削除）
        setTokens(prev => {
          const next = [...prev];
          next.splice(stoneIndex, 1);
          return next;
        });
        // 手番を 5 復活（turn を戻す。現在の turn は maxTurns + 1 なので、5引くと maxTurns - 4 になる）
        setTurn(prev => prev - 5);
        notify("魔法の石が砕け散り、手番が5回分復活した！");
        soundManager.playSE(SE_IDS.CURSE_BREAK); // トークンが壊れる「パリーン！」音
        setTimeout(() => {
          soundManager.playSE(SE_IDS.SKILL_READY); // 復活時のチャージ完了音
        }, 300);
        return;
      }

      setIsGameOver(true);
      soundManager.playSE(SE_IDS.GAME_OVER);
    }
  }, [turn, goalReached, maxTurns, isEndlessMode, isGameOver, tokens, notify]);

  useEffect(() => {
    if (!selectedTokenDetail) {
      setTokenMoveInput('');
      return;
    }
    const t = selectedTokenDetail.token;
    if (!t) return;
    const isSkill = t.type === 'skill';
    const sameTypeTokens = tokens.filter(tok => tok != null && (isSkill ? tok.type === 'skill' : tok.type !== 'skill'));
    const currentPos = sameTypeTokens.findIndex(tok => tok.instanceId === t.instanceId) + 1;
    if (currentPos > 0) setTokenMoveInput(String(currentPos));
  }, [selectedTokenDetail, tokens, setTokenMoveInput]);

  const startNextCycle = (warpToCycle = null) => {
    setTurn(1);
    setCycleTotalCombo(0);

    let baseClears = currentRunStats.currentClears || 0;
    if (typeof warpToCycle === 'number') {
      baseClears = warpToCycle - 2;
    }

    const nextCycle = baseClears + 2;
    let newTarget;

    if (isBeyondMode) {
      const beyondCycle = nextCycle - 25;
      let base = MAX_TARGET;
      for (let j = 1; j <= beyondCycle; j++) {
        const isBeyondJump = j > 0 && j % 5 === 0;
        base = Math.floor(base * (isBeyondJump ? 3.0 : 1.5));
      }
      newTarget = base;
    } else {
      newTarget = 8;
      for (let i = 2; i <= nextCycle; i++) {
        let mult = 1.5;
        let add = 2;
        if (i === 6) { mult = 3.0; add = 200; }
        else if (i === 11) { mult = 4.0; add = 5000; }
        else if (i === 16) { mult = 5.0; add = 200000; }
        else if (i === 21) { mult = 6.0; add = 10000000; }
        else if (i === 25) { mult = 10.0; add = 2000000000; }
        else if (i > 25) { mult = 2.5; add = 0; }
        else if (i > 21) { mult = 2.0; add = 0; }
        else if (i > 16) { mult = 2.0; add = 0; }
        else if (i > 11) { mult = 1.8; add = 0; }
        else if (i > 6) { mult = 1.6; add = 0; }
        newTarget = Math.floor(newTarget * mult) + add;
      }
      newTarget = Math.min(newTarget, MAX_TARGET);
    }

    setTarget(newTarget);
    setGoalReached(false);
    setSkippedTurnsBonus(0);
    setCurrentRunStats(prev => ({ ...prev, currentClears: baseClears + 1 }));
    setStarProgress(0);

    const nextBase = Math.ceil(shopRerollBasePrice * SHOP_REROLL_GROWTH_FACTOR);
    setShopRerollBasePrice(nextBase);
    setShopRerollPrice(nextBase);

    generateShop(nextCycle);
    setShowShop(false);

    if (!isEndlessMode) {
      setStats(prev => {
        const nextCycleStats = baseClears + 2;
        return {
          ...prev,
          lifetimeClears: (prev.lifetimeClears || 0) + 1,
          maxCycleAllTime: Math.max(prev.maxCycleAllTime || 0, nextCycleStats)
        };
      });
    }

    notify("NEXT CYCLE STARTED!");
    const interestEnchants = tokens.flatMap(t => t?.enchantments || []).filter(e => e.effect === 'compound_interest');
    if (interestEnchants.length > 0) {
      const interestRate = 0.05 * interestEnchants.length;
      const extraStars = Math.floor(stars * interestRate);
      if (extraStars > 0) {
        setStars(s => s + extraStars);
        notify(`複利の導き: ★+${extraStars} (5%利子)`);
      }
    }
  };

  const getRewardMultiplier = () => {
    let skipMasterMultiplier = 1;

    tokens.forEach(t => {
      if (!t) return;
      if (t.id === 'skip_master' || t.effect === 'skip_bonus_multiplier') {
        const val = t.values?.[(t.level || 1) - 1] || 1;
        skipMasterMultiplier *= val;
      }
    });

    let timeBonusPct = 0;
    tokens.forEach(t => {
      if (!t) return;
      if (t.effect === 'stat_time_move') {
        const v = t.values?.[(t.level || 1) - 1] || 0.5;
        const minutes = Math.floor((currentRunStats.currentTotalMoveTime || 0) / 60000);
        timeBonusPct += (minutes * v);
      }
    });

    return skipMasterMultiplier * (1 + timeBonusPct);
  };

  const skipTurns = () => {
    const remainingTurns = maxTurns - turn + 1;
    if (remainingTurns <= 0) return;

    const rewardMult = getRewardMultiplier();
    const starsPerTurn = Math.floor(3 * rewardMult);
    const bonus = remainingTurns * starsPerTurn;

    setStars((s) => s + bonus);
    notify(`SKIP BONUS: +${bonus} STARS! (+${starsPerTurn}/回)`);
    setSkippedTurnsBonus(prev => prev + remainingTurns);
    setCurrentRunStats(prev => ({ ...prev, skipsPerformed: (prev.skipsPerformed || 0) + 1 }));

    setTurn(maxTurns + 1);
  };



  const resetGame = () => {
    setStars(10);
    setTarget(8);
    setTurn(1);
    setCycleTotalCombo(0);
    setCurrentRunTotalCombo(0);
    setShopRerollBasePrice(1);
    setShopRerollPrice(1);
    setTokens([]);
    setSandsOfTimeSeconds(0);
    setActiveBuffs([]);
    setSkippedTurnsBonus(0);
    setPendingShopItem(null);
    setGoalReached(false);
    setShowShop(false);
    setShowGameClear(false);
    setIsGameOver(false);
    setIsEndlessMode(false);
    setStarProgress(0);
    setTotalPurchases(0);
    setTotalStarsSpent(0);
    setShopItems([]);
    setSavedBoard(null);
    setHasSaveData(false);
    setIsEnchantShopUnlocked(false);
    setTokenSlotExpansionCount(0);
    setIsAwakeningLevelUpBought(false);
    generateShop();
    if (engineRef.current) {
      engineRef.current.init(null);
    }
    setStats(prev => {
      const nextStats = { ...prev };
      if (!isEndlessMode) {
        nextStats.maxCycleAllTime = Math.max(nextStats.maxCycleAllTime || 0, 1);
      }
      return nextStats;
    });
    setCurrentRunStats(initialCurrentRunStats);
  };

  const handleStartOptionSelection = (option) => {
    resetGame();
    setShowStartOption(false);
    setShowTitle(false);

    if (option === 'safety') {
      setSandsOfTimeSeconds(3);
      setStars(20);

      let star1PassivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'passive' && t.canBeInitial && t.type !== 'curse');
      if (star1PassivePool.length === 0) star1PassivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'passive' && t.type !== 'curse');
      const passiveToken = star1PassivePool[Math.floor(Math.random() * star1PassivePool.length)];

      let star1ActivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'skill' && t.canBeInitial && t.type !== 'curse');
      if (star1ActivePool.length === 0) star1ActivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'skill' && t.type !== 'curse');
      const activeToken = star1ActivePool[Math.floor(Math.random() * star1ActivePool.length)];

      const pToken = { ...passiveToken, instanceId: Date.now() + Math.random(), level: 1 };
      const aToken = { ...activeToken, instanceId: Date.now() + Math.random() + 1, level: 1, charge: activeToken.cost || 0 };
      setTokens([pToken, aToken]);

      notify("「安全」スタイルで開始しました (+3s, 20★)");
      addTokenToast(pToken, "を獲得した！");
      addTokenToast(aToken, "を獲得した！");
    } else if (option === 'solid') {
      let star2PassivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 2 && t.type === 'passive' && t.canBeInitial && t.type !== 'curse');
      if (star2PassivePool.length === 0) star2PassivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 2 && t.type === 'passive' && t.type !== 'curse');
      const passiveToken = star2PassivePool[Math.floor(Math.random() * star2PassivePool.length)];

      let star1ActivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'skill' && t.canBeInitial && t.type !== 'curse');
      if (star1ActivePool.length === 0) star1ActivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'skill' && t.type !== 'curse');
      const activeToken = star1ActivePool[Math.floor(Math.random() * star1ActivePool.length)];

      const pToken = { ...passiveToken, instanceId: Date.now() + Math.random(), level: 1 };
      const aToken = { ...activeToken, instanceId: Date.now() + Math.random() + 1, level: 1, charge: activeToken.cost || 0 };
      setTokens([pToken, aToken]);
      setStars(10);
      notify("「堅実」スタイルで開始しました (10★)");
      addTokenToast(pToken, "を獲得した！");
      addTokenToast(aToken, "を獲得した！");
    } else if (option === 'challenge') {
      const cursePool = ALL_TOKEN_BASES.filter(t => t.type === 'curse' || t.isCurse === true);
      const randomCurse = cursePool[Math.floor(Math.random() * cursePool.length)];
      const initToken = {
        ...randomCurse,
        instanceId: Date.now() + Math.random(),
        startValue: randomCurse.condition ? getStatByCondition(randomCurse.condition) : 0
      };
      if (randomCurse.id === 'curse_multiply') {
        initToken.charge = 0;
        const passiveDummy = ALL_TOKEN_BASES.find(t => t.id === 'curse_multiplied_p');
        const dummy = { ...passiveDummy, instanceId: Date.now() + Math.random(), parentId: initToken.instanceId, level: 1, charge: 0 };
        setTokens([initToken, dummy]);
      } else {
        if (randomCurse.isCurse) initToken.charge = 0;
        setTokens([initToken]);
      }

      const initialStars = randomCurse.id === 'curse_init' ? Math.floor(10 / 2) : 10;
      setStars(initialStars);
      notify(`「挑戦」スタイルで開始しました (${initialStars}★)`);
      addTokenToast(initToken, "の呪いを受けて開始...");
    }

    if (engineRef.current) {
      engineRef.current.init(null);
    }
  };


  const handleGiveUp = () => {
    setIsGameOver(false);
    resetGame();
    setShowStartOption(true);
  };

  // 指定された個数だけランダムなトークンのレベルを上げるヘルパー関数
  const levelUpRandomTokens = (count) => {
    setTokens(prev => {
      let next = [...prev];
      for (let i = 0; i < count; i++) {
        // 毎回フィルタリングして、その時点でレベルアップ可能なものを選ぶ
        const upgradeable = next.filter(t =>
          t &&
          (t.level || 1) < 3 &&
          t.effect !== 'copy_left' &&
          !t.isCurse &&
          t.type !== 'curse'
        );
        if (upgradeable.length === 0) break;
        const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
        const targetIdx = next.findIndex(t => t?.instanceId === target.instanceId);
        if (targetIdx !== -1) {
          const nextLevel = (next[targetIdx].level || 1) + 1;
          const nextToken = {
            ...next[targetIdx],
            level: nextLevel
          };
          nextToken.desc = getTokenDescription(nextToken, nextLevel, currentRunStats, next, activeBuffs);
          next[targetIdx] = nextToken;
          notify(`${next[targetIdx].name} が Lv${nextLevel} に上がった！`);
          soundManager.playSE(SE_IDS.EQUIP_TOKEN);
        }
      }
      return next;
    });
  };

  // generateShop, buyItem, handleChoice 等は useShop フックへ移行されました
  const activateSkill = (token) => {
    if (!token || token.type !== "skill") return;

    if (isGameOver) return notify("ゲームオーバー時は使用できません");
    if (turn > maxTurns && goalReached) return notify("クリア時は使用できません");
    if (showShop) return notify("ショップ画面では使用できません");

    const currentCharge = token.charge || 0;
    const cost = getEffectiveCost(token, currentRunStats, tokens, activeBuffs);

    if (currentCharge < cost) {
      return notify(`チャージ不足です (${currentCharge}/${cost})`);
    }

    if (engineRef.current?.processing) return notify("処理中です");

    const engine = engineRef.current;
    if (!engine) return;

    setHasUsedActiveSkillThisTurn(true);

    setStats(prev => ({ ...prev, lifetimeSkillsUsed: (prev.lifetimeSkillsUsed || 0) + 1 }));
    setCurrentRunStats(prev => ({ ...prev, currentSkillsUsed: (prev.currentSkillsUsed || 0) + 1 }));

    soundManager.playSE(SE_IDS.SKILL_USE);
    if (token.effect === "convert_color" || token.effect === "convert_multi") {
      soundManager.playSE(SE_IDS.CONVERT);
    }
    if (token.id === "curse_chronos") {
      soundManager.playSE(SE_IDS.CHRONOS_STOP);
    }

    let extraDuration = 0;
    tokens.forEach((t, index) => {
      if (!t) return;
      let workToken = t;
      if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
        workToken = tokens[index - 1];
      }
      if (workToken.effect === 'active_duration_boost') {
        const lv = workToken.level || 1;
        extraDuration += (workToken.values?.[lv - 1] || 0);
      }
    });

    switch (token.action) {
      case "refresh":
        engine.init();
        break;
      case "force_refresh":
        skipTurnProgressRef.current = true;
        engine.forceRefresh();
        break;
      case "move_drop_add": {
        const addArray = token.values || [20, 40, 60];
        const addAmount = addArray[(token.level || 1) - 1] || 20;
        engine.state.forEach(row => {
          row.forEach(orb => {
            if (orb && orb.isMoveDrop) {
              orb.moveCount += addAmount;
              const textEl = orb.el.querySelector('.move-count-text');
              if (textEl) {
                textEl.innerText = orb.moveCount;
                textEl.classList.remove('rainbow-hit-pulse');
                void textEl.offsetWidth;
                textEl.classList.add('rainbow-hit-pulse');
              }
            }
          });
        });
        break;
      }
      case "erase_color":
        if (engine) {
          engine.eraseColor(token.params.color).then(({ erasedCount, rawCount }) => {
            if (rawCount > 0) {
              // 1. スキル使用で消去された生の個数を一時ステートに記録（ターン終了時にマージ）
              setSkillErasedCounts(prev => ({
                ...prev,
                [token.params.color]: (prev[token.params.color] || 0) + rawCount
              }));

              // 2. このトークン個別の累積消去数を更新し、30個突破時効果を判定
              setTokens(prev => prev.map(t => {
                if (t && t.instanceId === token.instanceId) {
                  const oldCount = t.erasedCount || 0;
                  const newCount = oldCount + rawCount;

                  const oldTriggers = Math.floor(oldCount / 30);
                  const newTriggers = Math.floor(newCount / 30);
                  const triggerTimes = newTriggers - oldTriggers;

                  if (triggerTimes > 0) {
                    const level = t.level || 1;
                    const effectVal = t.effectValues?.[level - 1] || 1;

                    for (let i = 0; i < triggerTimes; i++) {
                      // 属性別の追加効果をトリガー
                      switch (t.params.color) {
                        case "fire":
                          // 盤面を全てプラス炎にし、1ターンの間基礎コンボ数倍率アップ
                          engine.changeBoardToEnhancedColor("fire");
                          setActiveBuffs(prevBuffs => [
                            ...prevBuffs,
                            {
                              id: Date.now() + Math.random(),
                              action: "temp_mult",
                              params: { multiplier: effectVal, duration: 1 },
                              duration: 1,
                              maxDuration: 1,
                              tokenId: t.instanceId,
                              name: `焔の滅尽 (基礎コンボx${effectVal})`
                            }
                          ]);
                          notify(`追加効果発動！ 盤面をプラス炎ドロップにし、1ターン基礎コンボを${effectVal}倍！`);
                          break;

                        case "water":
                          // 盤面を全てプラス雨にし、ランダムにリピートドロップ生成
                          engine.changeBoardToEnhancedColor("water");
                          engine.spawnRepeatRandom(effectVal);
                          notify(`追加効果発動！ 盤面をプラス雨ドロップにし、リピートドロップを${effectVal}個生成！`);
                          break;

                        case "wood":
                          // 盤面を全てプラス風にし、所持スター数を倍にする
                          engine.changeBoardToEnhancedColor("wood");
                          setStars(s => Math.floor(s * effectVal));
                          notify(`追加効果発動！ 盤面をプラス風ドロップにし、所持スター数を${effectVal}倍に！`);
                          break;

                        case "light":
                          // 盤面を全てプラス雷にし、ランダムなトークンのレベルを上げる
                          engine.changeBoardToEnhancedColor("light");
                          levelUpRandomTokens(effectVal);
                          notify(`追加効果発動！ 盤面をプラス雷ドロップにし、ランダムなトークンを${effectVal}個レベルアップ！`);
                          break;

                        case "dark":
                          // 盤面を全てプラス月にし、残り手番を増やす
                          engine.changeBoardToEnhancedColor("dark");
                          setTurn(prevTurn => Math.max(1, prevTurn - effectVal));
                          notify(`追加効果発動！ 盤面をプラス月ドロップにし、今回のサイクルの手番を+${effectVal}回！`);
                          break;

                        default:
                          break;
                      }
                    }
                  }
                  return { ...t, erasedCount: newCount };
                }
                return t;
              }));

              // 3. コンボ追加バフ（1ターン）の登録
              // レベル別倍率: Lv1: 1倍, Lv2: 2倍, Lv3: 3倍
              const level = token.level || 1;
              const comboMultiplier = token.values?.[level - 1] || 1;
              const comboBonus = erasedCount * comboMultiplier;

              setActiveBuffs(prev => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  action: "skill_combo_bonus",
                  params: { value: comboBonus },
                  duration: 1,
                  name: `${token.name} (+${comboBonus}コンボ)`
                }
              ]);
              notify(`${token.name}の効果により、次ターンのコンボ数 +${comboBonus}!`);
            } else {
              notify("消去対象のドロップがありませんでした");
            }
          });
        }
        break;

      case "organize_color":
        engine.organizeColor(token.params.color);
        break;
      case "convert":
        engine.convertColor(token.params.from, token.params.to);
        break;
      case "convert_multi":
        engine.convertMultiColor(token.params.types, token.params.to);
        break;
      case "convert_pair":
        engine.convertPairColors(token.params.mapping);
        break;
      case "board_change":
        engine.changeBoardColors(token.params.colors);
        break;
      case "spawn_random":
        engine.spawnRandom(token.params.color, token.params.count);
        break;
      case "board_balance":
        engine.changeBoardBalanced();
        break;
      case "curse_passive_null": {
          if (hasSaintToken) {
            notify("聖女の加護により呪いの効果を無効化！");
          } else {
            const duration = token.params?.duration || 2;
            setActiveBuffs(prev => [
              ...prev,
              {
                action: "curse_passive_null",
                params: { duration },
                remaining: duration,
                sourceTokenId: token.instanceId,
                name: "受難の呪い(パッシブ無効)"
              }
            ]);
            notify("受難の呪いが発動…（数手番パッシブ無効）");
            addTokenToast(token, "パッシブ無効化…");
          }
          break;
        }

      case "curse_multiply": {
          if (hasSaintToken) {
            notify("聖女の加護により呪いの増殖を阻止！");
          } else {
            const spawnType = token.params?.spawnType || 'passive';
            const dummyBase = ALL_TOKEN_BASES.find(t => t.id === (spawnType === 'passive' ? 'curse_multiplied_p' : 'curse_multiplied_a'));
            if (dummyBase) {
              const maxSlots = INITIAL_TOKEN_SLOTS + tokenSlotExpansionCount;
              const currentCount = tokens.filter(t => t && t.type === (spawnType === 'passive' ? 'passive' : 'skill')).length;
              if (currentCount < maxSlots) {
                const newDummy = { ...dummyBase, instanceId: Date.now() + Math.random(), parentId: token.instanceId, level: 1, charge: 0 };
                setTokens(prev => [...prev, newDummy]);
                notify("呪いが増殖した…！");
                addTokenToast(token, "増殖！");
              } else {
                notify("枠が一杯で呪いは増殖できなかった");
              }
            }
          }
          break;
        }

      case "curse_time_reduction": {
          if (hasSaintToken) {
            notify("聖女の加護により時間の消失を無効化！");
          } else {
            const duration = token.params?.duration || 2;
            setActiveBuffs(prev => [
              ...prev,
              {
                action: "curse_op_time_fix",
                params: { timeMs: token.params?.timeMs || 1000 },
                remaining: duration,
                sourceTokenId: token.instanceId,
                name: "刹那の呪縛"
              }
            ]);
            notify("刹那の呪縛が発動…（数手番操作時間短縮）");
            addTokenToast(token, "時間が奪われる…");
          }
          break;
        }
      case "spawn_bomb_random":
        engine.spawnBombRandom(token.params.count);
        break;
      case "convert_bomb_targeted":
        engine.convertBombTargeted(token.params.count, token.params.type);
        break;
      case "spawn_repeat":
        engine.spawnRepeatRandom(token.params.count);
        break;
      case "convert_repeat":
        engine.convertRepeatTargeted(token.params.count, token.params.color);
        break;
      case "spawn_rainbow":
        engine.spawnRainbowRandom(token.params.count);
        break;
      case "rainbow_master":
        engine.spawnRainbowRandom(token.params.count);
        engine.setAllRainbowCounts(token.params.to);
        break;
      case "spawn_star":
        engine.spawnStarRandom(token.params.count);
        break;
      case "convert_star":
        engine.convertStarTargeted(token.params.count, token.params.color);
        break;
      case "buff_square_judgment":
      case "buff_len4_mult":
      case "buff_row_mult":
      case "buff_l_shape_mult":
      case "buff_cross_mult":
      case "buff_square_mult":
      case "skyfall":
      case "skyfall_limit":
      case "temp_mult":
      case "double_probability":
      case "force_trigger_probabilities":
      case "turn_end_convert":
      case "turn_end_convert_multi":
      case "turn_end_spawn":
      case "finger_transform_active":
      case "seal_of_power": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: token.action,
            params: token.params,
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          },
        ]);
        notify(`${token.name} 発動！ (${finalDuration}手番)`);
        break;
      }
      case "row_fix":
        engine.fixRowColor(token.params.row, token.params.type);
        break;
      case "col_fix":
        engine.fixColColor(token.params.col, token.params.type);
        break;
      case "trial_stage": {
        setTurn(prev => Math.max(1, prev - 1));
        const finalDuration = 1;
        setActiveBuffs(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: "trial_stage_active",
            params: {},
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          }
        ]);
        if (engine) {
          engine.noSpecialEffects = true;
        }
        notify(`${token.name} 発動！ (試練のターン)`);
        break;
      }
      case "calm": {
        setTurn(prev => Math.max(1, prev - 1));
        const finalDuration = 1;
        setActiveBuffs(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: "calm",
            params: {},
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          }
        ]);
        notify(`${token.name} 発動！ 手番を+1し、このターンのドロップ消去を無効化！`);
        break;
      }
      case "forbidden_temp":
        engine.noSkyfall = true;
        notify("禁忌の儀式発動！(落ちコン停止)");
        break;
      case "enhance_color":
        engine.enhanceColorOrbs(token.params.colors);
        break;
      case "chronos_stop": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        engine.activateChronosStop(finalDuration);
        notify(`${token.name} 発動！ (${finalDuration}手番)`);
        break;
      }
      case 'gravity_overdrive': {
        // 重力逆転: エンジンの重力方向を上に切り替え、コンボ倍率×2のバフを追加
        if (engine) {
          engine.gravityDirection = 'up';
        }
        const finalDuration = (token.params?.duration || 1) + extraDuration;
        setActiveBuffs(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: 'gravity_overdrive',
            params: { direction: 'up' },
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          }
        ]);
        notify(`${token.name} 発動！ドロップが上に落下する！ (コンボ倍率×2)`);
        break;
      }
      case 'gale_gravity': {
        // 烈風の重力: レベルに応じて落下方向（右または左）を決定。Lv1: 右固定, Lv2以上: 右か左をランダムに決定
        const lv = token.level || 1;
        let dir = 'right';
        if (lv >= 2) {
          dir = Math.random() < 0.5 ? 'left' : 'right';
        }
        if (engine) {
          engine.gravityDirection = dir;
        }
        const finalDuration = (token.params?.duration || 1) + extraDuration;
        const val = token.values?.[lv - 1] || 2;
        setActiveBuffs(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: 'gale_gravity',
            params: { direction: dir, multiplier: val },
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          }
        ]);
        const dirJapanese = dir === 'right' ? '右' : '左';
        notify(`${token.name} 発動！ドロップが「${dirJapanese}」に落下する！ (基礎コンボ数×${val}倍)`);
        break;
      }
      case "op_time_boost": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        const extraTime = token.params.extraTime || 5000;
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: "op_time_boost",
            params: { extraTime },
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          },
        ]);
        notify(`${token.name} 発動！ 操作時間+${extraTime / 1000}秒 (${finalDuration}ターン)`);
        break;
      }
      case "residual_wind":
      case "residual_thunder": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: `${token.action}_active`,
            params: token.params,
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
            level: token.level || 1,
            values: token.values,
            effectValues: token.effectValues
          },
        ]);
        notify(`${token.name} 発動！風/雷を大量に消して力を溜める… (${finalDuration}手番)`);
        break;
      }
      case "residual_fire":
      case "residual_water": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        const lv = token.level || 1;
        const extraTimeSeconds = token.values[lv - 1] || 1.0;
        const multiplierVal = token.effectValues[lv - 1] || 1.0;

        // このターン消えなくなるバフと、次ターン発動するバフを登録
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: "no_match_erase",
            params: { color: token.params.color },
            duration: 1, // このターンのみ
            name: `${token.name} (消去停止)`
          },
          {
            id: Date.now() + Math.random() + 0.1,
            action: "op_time_boost",
            params: { extraTime: extraTimeSeconds * 1000 },
            duration: 2, // このターン終了で1減るため2ターン
            name: `${token.name} (操作時間延長)`
          },
          {
            id: Date.now() + Math.random() + 0.2,
            action: "residual_multiplier_boost",
            params: { color: token.params.color, multiplier: multiplierVal },
            duration: 2, // このターン終了で1減るため2ターン
            name: `${token.name} (倍率加算)`
          }
        ]);
        notify(`${token.name} 発動！このターンはドロップが消えず、次ターンに力を解放！`);
        break;
      }
      case "residual_dark":
      case "residual_heart": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: `${token.action}_active`,
            params: token.params,
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
            level: token.level || 1,
            values: token.values,
            effectValues: token.effectValues
          },
        ]);
        notify(`${token.name} 発動！消去数を抑えて次ターンに備える… (${finalDuration}手番)`);
        break;
      }
      case "charge_boost": {
        const boostAmount = token.values?.[(token.level || 1) - 1] || 1;
        // 他のスキルトークンのchargeを加算し、自身のchargeを0にリセット
        setTokens(prev => prev.map(t => {
          if (!t) return t;
          // 自身のchargeを0にリセット
          if (t === token) return { ...t, charge: 0 };
          // 他のスキルトークンのchargeを加算
          if (t.type !== 'skill') return t;
          const newCharge = Math.min(t.cost || 0, (t.charge || 0) + boostAmount);
          return { ...t, charge: newCharge };
        }));
        notify(`他スキルのエネルギー +${boostAmount}!`);
        return; // 共通のchargeリセット処理をスキップ
      }
      // --- 刹那の呪縛: 操作時間を1秒固定にするバフを追加 ---
      case "curse_op_time_fix": {
        const finalDuration = (token.params?.duration || 2) + extraDuration;
        const timeMs = token.params?.timeMs ?? 1000;
        setActiveBuffs(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: "curse_op_time_fix",
            params: { timeMs },
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          },
        ]);
        notify(`${token.name} 発動！ 操作時間1秒固定 (${finalDuration}ターン)`);
        break;
      }

      case "random_levelup": {
        const upgradeable = tokens.filter(t =>
          t &&
          t.instanceId !== token.instanceId &&
          (t.level || 1) < 3 &&
          t.effect !== 'copy_left' &&
          !t.isCurse &&
          t.type !== 'curse'
        );

        if (upgradeable.length > 0) {
          const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
          setTokens(prev => {
            const next = [...prev];
            const targetIdx = next.findIndex(t => t?.instanceId === target.instanceId);
            if (targetIdx !== -1) {
              const nextLevel = (next[targetIdx].level || 1) + 1;
              const nextToken = {
                ...next[targetIdx],
                level: nextLevel
              };
              nextToken.desc = getTokenDescription(nextToken, nextLevel, currentRunStats, next, activeBuffs);
              next[targetIdx] = nextToken;
              notify(`${next[targetIdx].name} が Lv${nextLevel} に上がった！`);
              soundManager.playSE(SE_IDS.EQUIP_TOKEN);
            }
            return next;
          });
        } else {
          notify("強化可能なトークンがありません");
        }
        break;
      }
      case "spawn_token_s1":
      case "spawn_token_s2":
      case "spawn_token_s3": {
        const activeCount = tokens.filter(t => t?.type === 'skill' || t?.isCurse).length;
        const passiveCount = tokens.filter(t => t && t?.type !== 'skill' && !t?.isCurse).length;
        const maxSlots = INITIAL_TOKEN_SLOTS + tokenSlotExpansionCount;

        // 生成するレアリティと呪い判定
        let targetRarity = 1;
        if (token.action === "spawn_token_s2") targetRarity = 2;
        if (token.action === "spawn_token_s3") targetRarity = 3;

        let selectedBase = null;
        const isCurseTriggered = (token.action === "spawn_token_s3" && Math.random() < 0.30);

        if (isCurseTriggered) {
          const cursePool = ALL_TOKEN_BASES.filter(b => b.type === 'curse' || b.isCurse);
          selectedBase = cursePool[Math.floor(Math.random() * cursePool.length)];
        } else {
          // 「招来」系スキル自身を除外したプールから抽選
          const pool = ALL_TOKEN_BASES.filter(b =>
            b.rarity === targetRarity &&
            b.type !== 'curse' && !b.isCurse &&
            !["gen_token_s1", "gen_token_s2", "gen_token_s3"].includes(b.id)
          );
          selectedBase = pool[Math.floor(Math.random() * pool.length)];
        }

        if (!selectedBase) break;

        const isSkill = selectedBase.type === 'skill' || selectedBase.isCurse;
        if (isSkill && activeCount >= maxSlots) {
          notify(`アクティブ枠がいっぱいで ${selectedBase.name} を生成できませんでした`);
          break;
        }
        if (!isSkill && passiveCount >= maxSlots) {
          notify(`パッシブ枠がいっぱいで ${selectedBase.name} を生成できませんでした`);
          break;
        }

        const newToken = {
          ...selectedBase,
          instanceId: Date.now() + Math.random(),
          level: 1,
          charge: isSkill ? (selectedBase.cost || 0) : 0,
          startValue: selectedBase.condition ? getStatByCondition(selectedBase.condition) : 0
        };

        setTokens(prev => [...prev.filter(t => t !== null), newToken]);
        addTokenToast(newToken, `を生成した！ (${token.name})`);
        break;
      }

      default:
        break;
    }

    // --- 追加: Lv3以上なら基礎コンボ値プラス効果 (Next Turn Bonus) ---
    // 呪いトークン (isCurse) にはLv3ボーナスは適用しない
    if (!token.isCurse && (token.level || 1) >= 3) {
      const bonusValue = token.cost || 0; // レベル1時点でのエネルギー数 = 基本コスト
      if (bonusValue > 0) {
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + 1, // ユニークIDずらす
            action: "skill_combo_bonus",
            params: { value: bonusValue },
            duration: 1, // 1ターン (このターン終了時)
            name: `Lv3ボーナス(+${bonusValue})`
          },
        ]);
        notify(`Lv3ボーナス: コンボ+${bonusValue} (次ターン)`);
      }
    }

    // Consume Charge + アクティブ呪いトークンの使用回数インクリメント
    setTokens(prev => prev.map(t => {
      if (t !== token) return t;

      // --- 魔力反響 (Magic Echo) ---
      const hasMagicEcho = (t.enchantments || []).some(e => e.effect === 'magic_echo');
      const hasMagicalLeadership = tokens[0] && tokens[0].effect === 'magical_leadership';
      const skipConsume = (hasMagicEcho && Math.random() < 0.25) || (hasMagicalLeadership && Math.random() < 0.10);
      if (skipConsume) {
        if (hasMagicEcho && !hasMagicalLeadership) {
          notify("魔力反響！エネルギーを消費しませんでした。");
        } else if (hasMagicalLeadership && !hasMagicEcho) {
          notify("魔導教陣の指揮！エネルギーを消費しませんでした。");
        } else {
          notify("エネルギーを消費しませんでした。");
        }
        return t; // 何も変更せずに返す（チャージ維持）
      }

      // チャージをリセット
      let updated = { ...t, charge: 0 };
      // isCurseトークン: curseUsesをインクリメント
      if (t.isCurse) {
        const newUses = (t.curseUses || 0) + 1;
        updated = { ...updated, curseUses: newUses };
      }
      return updated;
    }));
    /* setEnergy((prev) => prev - (token.cost || 0)); // REMOVED */
    if (!token.isCurse) notify(`${token.name} 発動!`);
  };

  // purifyCurse は useShop フックへ移行されました
  // sellToken は useShop フックへ移行されました
  // moveToken, handleDrag/Drop 等は usePuzzleBoard フックへ移行されました
  // openShop, refreshShop は useShop フックへ移行されました

  const toggleEnchantStatus = (tokenInstanceId, enchantIndex) => {
    setTokens(prev => {
      const next = [...prev];
      const tIdx = next.findIndex(t => t.instanceId === tokenInstanceId);
      if (tIdx === -1) return next;
      const newEnchants = [...(next[tIdx].enchantments || [])];
      if (newEnchants[enchantIndex]) {
        newEnchants[enchantIndex] = {
          ...newEnchants[enchantIndex],
          disabled: !newEnchants[enchantIndex].disabled
        };
      }
      next[tIdx] = { ...next[tIdx], enchantments: newEnchants };
      return next;
    });
  };

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
    getTokenSlotExpandPrice,
  };
};
