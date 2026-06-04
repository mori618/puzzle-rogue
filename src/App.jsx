import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { ENCHANT_DESCRIPTIONS, getEnchantDescription, ENCHANTMENTS } from './constants/enchantments.js';
import { MAX_COMBO, MAX_TARGET, SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, TOKEN_PRICE_GROWTH_FACTOR, SHOP_REROLL_GROWTH_FACTOR, AWAKENING_TOKEN_SLOT_PRICES } from './constants/gameConstants.js';
import { formatNum, getEffectiveCost, getTokenDescription, getTokenDynamicInfo, getTokenIcon, getAttributeBarStyles } from './utils/tokenUtils';
import { formatJapaneseNumber } from './utils/numberUtils.js';
import { PuzzleEngine } from './engine/PuzzleEngine.js';
import soundManager from './utils/SoundManager';
import { BGM_IDS, SE_IDS } from './constants/sounds';

const App = () => {
  // Game State
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [tokens, setTokens] = useState(Array(6).fill(null));
  const [sandsOfTimeSeconds, setSandsOfTimeSeconds] = useState(0); // 永続強化: 時の砂
  const [isGameOver, setIsGameOver] = useState(false);
  const [target, setTarget] = useState(100);
  const [goalReached, setGoalReached] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [turn, setTurn] = useState(1);
  const [cycleTotalCombo, setCycleTotalCombo] = useState(0);
  const [shopRerollBasePrice, setShopRerollBasePrice] = useState(1);
  const [shopRerollPrice, setShopRerollPrice] = useState(1);
  const [stars, setStars] = useState(5);
  /* const [energy, setEnergy] = useState(0); // REMOVED: Global Energy */
  /* const [maxEnergy] = useState(10); // REMOVED: Global Energy */

  const [activeBuffs, setActiveBuffs] = useState([]);
  const [skippedTurnsBonus, setSkippedTurnsBonus] = useState(0);
  const [nextTurnTimeMultiplier, setNextTurnTimeMultiplier] = useState(1);
  const [lastTurnCombo, setLastTurnCombo] = useState(0);
  const [lastErasedColorCounts, setLastErasedColorCounts] = useState({});

  // Shop choice state
  const [pendingShopItem, setPendingShopItem] = useState(null);

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
  const [savedBoard, setSavedBoard] = useState(null);

  // --- ゲーム設定 ---
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  /** 設定を変更し localStorage に即時保存 */
  const handleSettingsChange = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Stats State
  const [currentRunTotalCombo, setCurrentRunTotalCombo] = useState(0);
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
  };
  const [currentRunStats, setCurrentRunStats] = useState(initialCurrentRunStats);
  // const [isLuxury, setIsLuxury] = useState(false); // Unused
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalStarsSpent, setTotalStarsSpent] = useState(0);
  const [triggeredPassives, setTriggeredPassives] = useState([]); // Visual feedback state

  const getAnimDelay = useCallback((baseDelay) => {
    if (engineRef.current && engineRef.current.isFastForward) {
      return Math.max(0, baseDelay * 0.2);
    }
    return baseDelay;
  }, []);

  const triggerPassive = (tokenId) => {
    if (!tokenId) return;
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
  const [tokenMoveInput, setTokenMoveInput] = useState(''); // 並び替え用の入力値
  const [showGameClear, setShowGameClear] = useState(false); // 全画面クリア画面の表示フラグ
  const [isPracticeMode, setIsPracticeMode] = useState(false); // 練習モードフラグ
  const [practiceTimeLimit, setPracticeTimeLimit] = useState(10000); // 練習モード用操作時間 (10s初期)
  const [isPureMode, setIsPureMode] = useState(false); // 純粋モード (特殊消しボーナス無効)

  // --- 覚醒ショップ State ---
  const [isEnchantShopUnlocked, setIsEnchantShopUnlocked] = useState(false); // エンチャントショップ解放フラグ
  const [tokenSlotExpansionCount, setTokenSlotExpansionCount] = useState(0);  // トークン枠拡張回数
  const [isAwakeningLevelUpBought, setIsAwakeningLevelUpBought] = useState(false); // 覚醒ショップ: ランダムレベルアップ購入済みフラグ
  const [showMaxComboWarpDialog, setShowMaxComboWarpDialog] = useState(false);
  const [isBeyondMode, setIsBeyondMode] = useState(false); // 彼岸モード: サイクル25クリア後の無限モード
  const [passiveTokenPage, setPassiveTokenPage] = useState(0);
  const [activeTokenPage, setActiveTokenPage] = useState(0);
  // スワイプ座標の管理（useRef でレンダー外管理）
  const passiveSwipeRef = useRef(null);
  const activeSwipeRef = useRef(null);

  // --- Drag and Drop State ---
  const [draggedToken, setDraggedToken] = useState(null);


  const timerRef = useRef(null);
  const timerTextRef = useRef(null);
  const comboRef = useRef(null);

  const getStatByCondition = useCallback((cond) => {
    switch (cond) {
      case 'clears': return currentRunStats.currentClears || 0;
      case 'heart_erase': return currentRunStats.totalHeartsErased || 0;
      case 'total_combo': return currentRunStats.currentTotalCombo || 0;
      case 'total_stars': return currentRunStats.totalStarsEarned || 0;
      case 'max_combo': return currentRunStats.maxCombo || 0;
      case 'tokens_sold': return currentRunStats.tokensSold || 0;
      case 'skips_performed': return currentRunStats.skipsPerformed || 0;
      default: return 0;
    }
  }, [currentRunStats]);

  const getCurseProgress = (t) => {
    // type:'curse' もしくは isCurse:true のトークンが対象
    if (!t || (t.type !== 'curse' && !t.isCurse)) return null;
    const cond = t.condition;
    const target = t.targetValue || 1;

    let current = 0;
    if (cond === 'skill_uses') {
      current = t.curseUses || 0;
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

  const getTokenDynamicPrice = useCallback((baseToken, currentTokens) => {
    if (!baseToken || baseToken.price === undefined) return 0;

    let possessionCount = 0;
    if (baseToken.type === 'skill' || baseToken.type === 'curse' || baseToken.isCurse) {
      possessionCount = currentTokens.filter(t => t && (t.type === 'skill' || t.type === 'curse' || t.isCurse)).length;
    } else if (baseToken.type === 'passive') {
      possessionCount = currentTokens.filter(t => t && t.type === 'passive').length;
    }

    const dynamicPrice = Math.floor(baseToken.price * Math.pow(TOKEN_PRICE_GROWTH_FACTOR, possessionCount));
    return Math.max(1, dynamicPrice);
  }, []);

  const hasGiantDomain = tokens.some((t) => t?.id === "giant" || t?.enchantments?.some(e => e.effect === "expand_board"));
  const hasSaintToken = tokens.some((t) => t?.id === "legend_saint");
  const hasDoubleTargetCurse = tokens.some((t) => t?.id === "curse_double_target") && !hasSaintToken;
  const effectiveTarget = hasDoubleTargetCurse ? target * 2 : target;

  const rows = hasGiantDomain ? 6 : 5;
  const cols = hasGiantDomain ? 7 : 6;

  const maxTurns = Math.max(1, 3
    + tokens.reduce((acc, t) => acc + (t?.enchantments?.filter(e => e.effect === "add_turn").length || 0), 0)
    + tokens.reduce((acc, t) => {
      if (t?.effect === "picky_eater") return acc + (t.values[(t.level || 1) - 1] || 0);
      return acc;
    }, 0)
    - (tokens.some(t => t?.id === "curse_turns") && !hasSaintToken ? 1 : 0)
  );

  const minMatchLength = tokens.some(t => t?.effect === "min_match") ? 2 : 3;

  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTurn(parsed.turn || 1);
        setCycleTotalCombo(parsed.cycleTotalCombo || 0);
        setTarget(parsed.target || 8);
        setGoalReached(parsed.goalReached || false);
        setStars(parsed.stars || 0);
        setSandsOfTimeSeconds(parsed.sandsOfTimeSeconds || 0);

        if (parsed.tokens && Array.isArray(parsed.tokens)) {
          setTokens(parsed.tokens);
        }

        setTotalPurchases(parsed.totalPurchases || 0);
        setTotalStarsSpent(parsed.totalStarsSpent || 0);
        setIsGameOver(parsed.isGameOver || false);
        setShopRerollBasePrice(parsed.shopRerollBasePrice || 1);
        setShopRerollPrice(parsed.shopRerollPrice || 1);
        setCurrentRunTotalCombo(parsed.currentRunTotalCombo || 0);
        setIsEnchantShopUnlocked(parsed.isEnchantShopUnlocked || false);
        setTokenSlotExpansionCount(parsed.tokenSlotExpansionCount || 0);
        setIsAwakeningLevelUpBought(parsed.isAwakeningLevelUpBought || false);
        if (parsed.currentRunStats) {
          setCurrentRunStats(parsed.currentRunStats);
        }
        if (parsed.shopItems) {
          setShopItems(parsed.shopItems);
        } else if (!parsed.isGameOver) {
          setTimeout(() => {
            setShopItems(prev => {
              if (prev.length === 0) {
                return generateShop();
              }
              return prev;
            });
          }, 0);
        }
        if (parsed.board) setSavedBoard(parsed.board);
        setHasSaveData(true);
      } catch (e) {
        console.error("Save data corrupted:", e);
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
    soundManager.updateSettings(settings);
  }, [settings]);

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
  }, [activeBuffs, tokens]);

  const getTimeLimit = useCallback(() => {
    if (isPracticeMode) return practiceTimeLimit;
    const isEnchantDisabled = tokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
    const hasDesperateStance = tokens.some(t => t?.effect === "desperate_stance");
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
      if (t?.effect === "cursed_power" && !hasSaintToken) base -= 2000;

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
  }, [tokens, sandsOfTimeSeconds, nextTurnTimeMultiplier, currentRunStats.currentShapeLen5, activeBuffs, isPracticeMode, practiceTimeLimit]);

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
        onTurnEnd: async (total, colorComboCounts, erasedColorCounts, skyfall, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isAllClear) => {
          if (handleTurnEndRef.current) {
            await handleTurnEndRef.current(total, colorComboCounts, erasedColorCounts, skyfall, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isAllClear);
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
  }, [rows, cols, showTitle, showHelp, showStats, showCredits, showSettings]);

  useEffect(() => {
    if (engineRef.current) {
      const limit = getTimeLimit();
      engineRef.current.timeLimit = limit;
      engineRef.current.minMatchLength = minMatchLength;
      engineRef.current.pureMode = isPureMode;

      if (engineRef.current.updateTimerDisplay) {
        engineRef.current.updateTimerDisplay(limit);
      }

      const effectiveTokens = tokens.map((t, index) => {
        if (!t) return t;
        if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
          return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
        }
        return t;
      });

      const hasForbiddenLiteral = effectiveTokens.some((t) => t?.id === "forbidden" || t?.effect === "forbidden");
      const hasCurseSkyfall = effectiveTokens.some((t) => (t?.id === "curse_skyfall" || t?.effect === "curse_skyfall") && !hasSaintToken);
      engineRef.current.noSkyfall = hasForbiddenLiteral || hasCurseSkyfall;

      const hasVacation = effectiveTokens.some((t) => t?.effect === "vacation");
      engineRef.current.vacationMode = hasVacation;

      const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");

      const masteryToken = effectiveTokens.find(t => t?.effect === "additive_mastery");
      const hasMastery = !!masteryToken;
      const masteryMultiplier = hasMastery ? masteryToken.values[(masteryToken.level || 1) - 1] : 1;

      const bonuses = {
        len4: 0, row: 0, l_shape: 0, color_combo: {}, heart_combo: 0, enhancedOrbBonus: 0, overLink: null,
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
          bonuses.heart_combo += val;
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
          bonuses.color_combo[color] = (bonuses.color_combo[color] || 0) + val;
        }

        const enchList = isEnchantDisabled ? [] : (t.enchantments || []);
        enchList.forEach(enc => {
          if (enc.effect === 'color_combo' && enc.params?.color) {
            const color = enc.params.color;
            bonuses.color_combo[color] = (bonuses.color_combo[color] || 0) + 1;
          }
          if (enc.effect === 'bomb_burst_combo') {
            bonuses.bomb_burst_combo = (bonuses.bomb_burst_combo || 0) + 3;
          }
        });
      });
      engineRef.current.setRealtimeBonuses(bonuses);

      const rates = { global: [], colors: {} };
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
    }
  }, [tokens, getTimeLimit, minMatchLength, activeBuffs]);

  const handleTurnEnd = async (turnCombo, colorComboCounts, erasedColorCounts, hasSkyfallCombo, shapes = [], overLinkMultiplier = 1, erasedByBombTotal = 0, erasedByRepeatTotal = 0, erasedByStarTotal = 0, isAllClear = false, extraStats = {}) => {
    const showComboBreakdownLocal = async (params) => {
      const {
        tc, logData, turnCombo, bonus, multiplier, effectiveCombo, isBeyondMode, MAX_COMBO,
        finalBaseCombo, finalComboMultiplier, debuffMultiplier, addedMultiplier
      } = params;
      const el = comboRef.current;
      if (!el) return;

      const mode = settings?.comboAnimationMode || 'instant';

      if (mode === 'step' && turnCombo > 0) {
        let currentBase = tc;
        let currentMult = 1.0;

        // 初期描画
        el.innerHTML = `
          <div class="combo-formula">
            <div class="combo-formula-expr">
              <div class="combo-formula-part">
                <span class="combo-number">${formatJapaneseNumber(currentBase)}</span>
                <span class="combo-label">BASE</span>
              </div>
              <div class="combo-formula-op">×</div>
              <div class="combo-formula-part">
                <span class="combo-number">${formatNum(currentMult)}</span>
                <span class="combo-label">MULT</span>
              </div>
            </div>
          </div>
        `;
        el.classList.remove('animate-combo-pop');
        void el.offsetWidth;
        el.classList.add('animate-combo-pop');
        await new Promise(r => setTimeout(r, getAnimDelay(900)));

        // 1. 基礎コンボ加算フェーズ
        for (const step of logData.bonusSteps) {
          if (!comboRef.current) break;
          if (step.tokenId) triggerPassive(step.tokenId);
          const stepValue = isNaN(step.value) ? 0 : step.value;
          currentBase += stepValue;
          
          const eEl = comboRef.current;
          const sign = stepValue >= 0 ? '+' : '';
          const prevBase = Math.max(0, currentBase - stepValue);
          
          eEl.innerHTML = `
            <div class="combo-formula">
              <div class="combo-formula-expr">
                <div class="combo-formula-part">
                  <span class="combo-number">${formatJapaneseNumber(prevBase)}</span>
                  <span class="combo-bonus-add">${sign}${formatJapaneseNumber(stepValue)}<span class="combo-step-label"> ${step.label}</span></span>
                </div>
                <div class="combo-formula-op">×</div>
                <div class="combo-formula-part">
                  <span class="combo-number">${formatNum(currentMult)}</span>
                  <span class="combo-label">MULT</span>
                </div>
              </div>
            </div>
          `;
          eEl.classList.remove('animate-combo-pop');
          void eEl.offsetWidth;
          eEl.classList.add('animate-combo-pop');
          await new Promise(r => setTimeout(r, getAnimDelay(900)));
        }

        // 2. 呪い（デバフ）適用フェーズ
        if (logData.debuffSteps && logData.debuffSteps.length > 0) {
          for (const step of logData.debuffSteps) {
            if (!comboRef.current) break;
            const prevBase = currentBase;
            currentBase = Math.floor(currentBase * step.value);
            
            const eEl = comboRef.current;
            eEl.innerHTML = `
              <div class="combo-formula">
                <div class="combo-formula-expr">
                  <div class="combo-formula-part">
                    <span class="combo-number">${formatJapaneseNumber(prevBase)}</span>
                    <span class="combo-bonus-mult">×${step.value}<span class="combo-step-label"> ${step.label}</span></span>
                  </div>
                  <div class="combo-formula-op">×</div>
                  <div class="combo-formula-part">
                    <span class="combo-number">${formatNum(currentMult)}</span>
                    <span class="combo-label">MULT</span>
                  </div>
                </div>
              </div>
            `;
            eEl.classList.remove('animate-combo-pop');
            void eEl.offsetWidth;
            eEl.classList.add('animate-combo-pop');
            await new Promise(r => setTimeout(r, getAnimDelay(900)));
          }
        }

        // 3. コンボ倍率加算・乗算フェーズ
        for (const step of logData.multiplierSteps) {
          if (!comboRef.current) break;
          if (step.tokenId) triggerPassive(step.tokenId);
          
          const prevMult = currentMult;
          if (step.type === 'add') {
            const addedVal = isNaN(step.addedValue) ? 0 : step.addedValue;
            currentMult += addedVal;
            const sign = addedVal >= 0 ? '+' : '';
            
            const eEl = comboRef.current;
            eEl.innerHTML = `
              <div class="combo-formula">
                <div class="combo-formula-expr">
                  <div class="combo-formula-part">
                    <span class="combo-number">${formatJapaneseNumber(currentBase)}</span>
                    <span class="combo-label">BASE</span>
                  </div>
                  <div class="combo-formula-op">×</div>
                  <div class="combo-formula-part">
                    <span class="combo-number">${formatNum(prevMult)}</span>
                    <span class="combo-bonus-add">${sign}${addedVal.toFixed(1)}<span class="combo-step-label"> ${step.label}</span></span>
                  </div>
                </div>
              </div>
            `;
            eEl.classList.remove('animate-combo-pop');
            void eEl.offsetWidth;
            eEl.classList.add('animate-combo-pop');
          } else {
            const multVal = isNaN(step.value) ? 1.0 : step.value;
            const prevBase = currentBase;
            currentBase = Math.floor(currentBase * multVal);
            
            const eEl = comboRef.current;
            eEl.innerHTML = `
              <div class="combo-formula">
                <div class="combo-formula-expr">
                  <div class="combo-formula-part">
                    <span class="combo-number">${formatJapaneseNumber(prevBase)}</span>
                    <span class="combo-bonus-mult">×${multVal.toFixed(1)}<span class="combo-step-label"> ${step.label}</span></span>
                  </div>
                  <div class="combo-formula-op">×</div>
                  <div class="combo-formula-part">
                    <span class="combo-number">${formatNum(currentMult)}</span>
                    <span class="combo-label">MULT</span>
                  </div>
                </div>
              </div>
            `;
            eEl.classList.remove('animate-combo-pop');
            void eEl.offsetWidth;
            eEl.classList.add('animate-combo-pop');
          }
          await new Promise(r => setTimeout(r, getAnimDelay(900)));
        }

        await new Promise(r => setTimeout(r, getAnimDelay(300)));
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
    setLastErasedColorCounts(erasedColorCounts);

    let bonus = 0;
    let multiplier = 1;
    let addedMultiplier = 0.0;
    let multMultiplier = 1.0;
    let debuffMultiplier = 1.0;
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

    const effectiveTokens = tokens.map((t, index) => {
      if (!t) return t;
      if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
        return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
      }
      return t;
    });

    const masteryToken = effectiveTokens.find(t => t?.effect === "additive_mastery");
    const hasMastery = !!masteryToken;
    const masteryVal = hasMastery ? masteryToken.values[(masteryToken.level || 1) - 1] : 1;

    const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
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
      erasedColorCounts,
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
        if (color && erasedColorCounts[color] >= requiredCount) {
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

    // 指示に基づき、マイナス倍率は基礎コンボのほうに掛け算する
    const finalBaseComboBeforeDebuff = tc + bonus;
    const finalBaseCombo = (tc > 0) ? Math.floor(finalBaseComboBeforeDebuff * debuffMultiplier) : 0;
    
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
    if (isBeyondMode) {
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
      totalHeartsErased: (prev.totalHeartsErased || 0) + (erasedColorCounts.heart || 0),
      maxMoveDrop: Math.max(prev.maxMoveDrop || 0, maxMoveDropThisTurn),
      maxBombEraseOnce: Math.max(prev.maxBombEraseOnce || 0, erasedByBombTotal),
      maxRepeatOnce: Math.max(prev.maxRepeatOnce || 0, erasedByRepeatTotal),
      totalBombsErased: (prev.totalBombsErased || 0) + bombSelfErased,
      totalRepeatsErased: (prev.totalRepeatsErased || 0) + repeatSelfErased,
      totalStarDropsErased: (prev.totalStarDropsErased || 0) + starSelfErased,
      totalRainbowsErased: (prev.totalRainbowsErased || 0) + rainbowSelfErased,
    }));

    await showComboBreakdownLocal({
      tc, logData, turnCombo, bonus, multiplier, effectiveCombo, isBeyondMode, MAX_COMBO,
      finalBaseCombo, finalComboMultiplier, debuffMultiplier, addedMultiplier
    });

    let totalReduction = 0;
    let extraStarsPerStarDropErase = 0;
    tokens.forEach((t) => {
      if (!t) return;
      if (t.id === "collector") {
        const threshold = t.values?.[(t.level || 1) - 1] || 5;
        totalReduction += (5 - threshold);
      }
      if (t.effect === "star_earn_boost") {
        extraStarsPerStarDropErase += t.values?.[(t.level || 1) - 1] || 0;
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
      notify(`+ ${totalStarsEarned} STARS!`);
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
          const erasedCount = erasedColorCounts[attr] || 0;
          nt.charge = (nt.charge || 0) + erasedCount;
        }

        return nt;
      });

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
                  const maxSlots = 5 + (tokenSlotExpansionCount || 0);
                  const currentCount = nextTokens.filter(tok => tok !== null).length;
                  if (currentCount < maxSlots) {
                    const candidatePool = ALL_TOKEN_BASES.filter(b => b.type !== 'curse' && !b.isCurse && b.rarity <= 2 && b.id !== "passive_fire_count");
                    const randomBase = candidatePool[Math.floor(Math.random() * candidatePool.length)];
                    const isSkill = randomBase.type === 'skill';
                    const isCp = randomBase.isCountPassive;
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
                    target.level = (target.level || 1) + 1;
                    addTokenToast(target, `が Lv${target.level} に上がった！ (常月の供物)`);
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

    const heartsErasedThisTurn = erasedColorCounts["heart"] || 0;
    setCurrentRunStats(prev => {
      const nextHearts = (prev.totalHeartsErased || 0) + heartsErasedThisTurn;

      const nextDrops = { ...(prev.currentDropsErased || { fire: 0, water: 0, wood: 0, light: 0, dark: 0, heart: 0 }) };
      Object.keys(erasedColorCounts).forEach(color => {
        if (nextDrops[color] !== undefined) {
          nextDrops[color] += erasedColorCounts[color];
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
      Object.keys(erasedColorCounts).forEach(color => {
        if (nextLifetimeDrops[color] !== undefined) {
          nextLifetimeDrops[color] += erasedColorCounts[color];
        }
      });
      return { ...prev, lifetimeDropsErased: nextLifetimeDrops };
    });

    if (!skipTurnProgressRef.current) {
      setActiveBuffs((prev) =>
        prev
          .map((b) => ({ ...b, duration: b.duration - 1 }))
          .filter((b) => b.duration > 0),
      );
    }

    if (!skipTurnProgressRef.current) {
      setTurn((prev) => prev + 1);
    }

    if (engineRef.current) {
      const hasForbiddenLiteral = tokens.some((t) => t?.id === "forbidden" || t?.effect === "forbidden");
      const hasCurseSkyfall = tokens.some((t) => (t?.id === "curse_skyfall" || t?.effect === "curse_skyfall") && !hasSaintToken);
      engineRef.current.noSkyfall = hasForbiddenLiteral || hasCurseSkyfall;
    }

    skipTurnProgressRef.current = false;
  };

  useEffect(() => {
    handleTurnEndRef.current = handleTurnEnd;
    onPassiveTriggerRef.current = triggerPassive;
    onStarEraseRef.current = (count) => {
      const effectiveTokens = tokens.map((t, index) => {
        if (!t) return t;
        if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
          return { ...tokens[index - 1], instanceId: t.instanceId };
        }
        return t;
      });

      let extraStarsPerStarDropErase = 0;
      effectiveTokens.forEach((t) => {
        if (t && t.effect === "star_earn_boost") {
          extraStarsPerStarDropErase += t.values?.[(t.level || 1) - 1] || 0;
        }
      });
      const amount = (2 + extraStarsPerStarDropErase) * count;
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
  }, [selectedTokenDetail]);

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
    setStars(5);
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
      setStars(10);

      let star1PassivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'passive' && t.canBeInitial && t.type !== 'curse');
      if (star1PassivePool.length === 0) star1PassivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'passive' && t.type !== 'curse');
      const passiveToken = star1PassivePool[Math.floor(Math.random() * star1PassivePool.length)];

      let star1ActivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'skill' && t.canBeInitial && t.type !== 'curse');
      if (star1ActivePool.length === 0) star1ActivePool = ALL_TOKEN_BASES.filter(t => t.rarity === 1 && t.type === 'skill' && t.type !== 'curse');
      const activeToken = star1ActivePool[Math.floor(Math.random() * star1ActivePool.length)];

      const pToken = { ...passiveToken, instanceId: Date.now() + Math.random(), level: 1 };
      const aToken = { ...activeToken, instanceId: Date.now() + Math.random() + 1, level: 1, charge: activeToken.cost || 0 };
      setTokens([pToken, aToken]);

      notify("「安全」スタイルで開始しました (+3s, 10★)");
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
      setStars(5);
      notify("「堅実」スタイルで開始しました (5★)");
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

      const initialStars = randomCurse.id === 'curse_init' ? Math.floor(5 / 2) : 5;
      setStars(initialStars);
      notify(`「挑戦」スタイルで開始しました (${initialStars}★)`);
      addTokenToast(initToken, "の呪いを受けて開始...");
    }

    if (engineRef.current) {
      engineRef.current.init(null);
    }
  };


  const handleEndlessMode = () => {
    setIsGameOver(false);
    setIsEndlessMode(true);
    notify("ENDLESS MODE START!");
  };

  const handleGiveUp = () => {
    setIsGameOver(false);
    resetGame();
    setShowStartOption(true);
  };

  const generateShop = (overrideCycleCount = null) => {
    const isLuxury = totalPurchases >= 6;

    let saleBonus = 0;
    let enchantGrantBonus = 0;
    let shopExpandBonus = 0;
    tokens.forEach((t) => {
      if (t?.id === "bargain") {
        const value = t.values[(t.level || 1) - 1];
        saleBonus += value;
      }
      if (t?.effect === "enchant_grant_boost") {
        const value = t.values[(t.level || 1) - 1];
        enchantGrantBonus += value;
      }
      if (t?.effect === "shop_expand") {
        const value = t.values[(t.level || 1) - 1];
        shopExpandBonus += value;
      }
    });

    const upgradeCount = 1;
    const basePassiveCount = 4 + shopExpandBonus;
    const baseActiveCount = 4 + shopExpandBonus;
    const enchantCount = 3;
    const extraEnchantCount = enchantGrantBonus + (isLuxury ? 1 : 0);
    const saleCount = 1 + saleBonus;

    setIsAwakeningLevelUpBought(false);

    const attrWeights = { fire: 1, water: 1, wood: 1, light: 1, dark: 1, heart: 1, none: 1 };
    tokens.forEach(t => {
      if (t && t.effect === 'shop_attribute_weight' && t.params?.attribute) {
        const val = t.values[(t.level || 1) - 1] || 1;
        attrWeights[t.params.attribute] *= val;
      }
    });

    const getRarityProbabilities = (cycle) => {
      if (cycle <= 5) return { 1: 0.60, 2: 0.30, 3: 0.10, 4: 0.00 };
      if (cycle <= 9) return { 1: 0.40, 2: 0.40, 3: 0.20, 4: 0.00 };
      if (cycle <= 15) return { 1: 0.30, 2: 0.38, 3: 0.30, 4: 0.02 };
      return { 1: 0.20, 2: 0.30, 3: 0.40, 4: 0.10 };
    };

    const cycleCount = overrideCycleCount ?? ((currentRunStats?.currentClears || 0) + 1);
    let probs = getRarityProbabilities(cycleCount);

    let rarityUpCount = 0;
    let rarityDownCount = 0;
    tokens.forEach((t) => {
      if (!t) return;
      if (t.effect === "shop_rarity_weight") {
        rarityUpCount += (t.values[(t.level || 1) - 1] || 0);
      }
      if (t.enchantments) {
        t.enchantments.forEach((enc) => {
          if (enc.effect === "rarity_up") rarityUpCount++;
          if (enc.effect === "rarity_down_combo") rarityDownCount++;
        });
      }
    });

    const adjustProb = (base, upRate, downRate, max) =>
      Math.max(0, Math.min(max, base + upRate * rarityUpCount - downRate * rarityDownCount));

    let p4 = adjustProb(probs[4] || 0, 0.05, 0.05, 1);
    let p3 = adjustProb(probs[3] || 0, 0.10, 0.10, 1 - p4);
    let p2 = adjustProb(probs[2] || 0, 0.10, 0.10, 1 - p3 - p4);
    let p1 = Math.max(0, 1 - p2 - p3 - p4);

    const hasCeleb = tokens.some(t => t?.effect === "celeb");
    if (hasCeleb) {
      const halfP1 = p1 / 2;
      p2 += halfP1;
      p3 += halfP1;
      p1 = 0;
    }

    probs = { 1: p1, 2: p2, 3: p3, 4: p4 };

    const getRarity = () => {
      const rand = Math.random();
      if (rand < probs[1]) return 1;
      if (rand < probs[1] + probs[2]) return 2;
      if (rand < probs[1] + probs[2] + probs[3]) return 3;
      return 4;
    };

    const passivesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "passive" && (t.rarity || 1) === 1 && !t.isCurse),
      2: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 2 && !t.isCurse),
      3: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 3 && !t.isCurse),
      4: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 4 && !t.isCurse && !tokens.some(own => own?.id === t.id)),
    };
    if (passivesPools[2].length === 0) passivesPools[2] = passivesPools[1];
    if (passivesPools[3].length === 0) passivesPools[3] = passivesPools[2];
    if (passivesPools[4].length === 0) passivesPools[4] = passivesPools[3];

    const activesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "skill" && (t.rarity || 1) === 1 && !t.isCurse),
      2: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 2 && !t.isCurse),
      3: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 3 && !t.isCurse),
      4: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 4 && !t.isCurse && !tokens.some(own => own?.id === t.id)),
    };
    if (activesPools[2].length === 0) activesPools[2] = activesPools[1];
    if (activesPools[3].length === 0) activesPools[3] = activesPools[2];
    if (activesPools[4].length === 0) activesPools[4] = activesPools[3];

    const createTokenItem = (pools) => {
      const rarity = getRarity();
      const pool = pools[rarity];

      const weightedPool = pool.map(base => {
        let weight = 1;
        if (!base.attributes || base.attributes.length === 0) {
          weight *= attrWeights.none;
        } else {
          base.attributes.forEach(a => {
            if (attrWeights[a]) weight *= attrWeights[a];
          });
        }
        return { base, weight };
      });

      const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
      let r = Math.random() * totalWeight;
      let selectedBase = pool[0];
      for (const entry of weightedPool) {
        r -= entry.weight;
        if (r <= 0) {
          selectedBase = entry.base;
          break;
        }
      }

      const item = { ...selectedBase, level: 1, charge: selectedBase.cost || 0 };
      item.price = getTokenDynamicPrice(selectedBase, tokens);
      item.desc = getTokenDescription(item, 1, currentRunStats, tokens, activeBuffs);
      return item;
    };

    const passiveItems = Array.from({ length: basePassiveCount }).map(() => createTokenItem(passivesPools));

    const enchantItems = [];
    {
      for (let i = 0; i < enchantCount; i++) {
        const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        const encDesc = getEnchantDescription(enc.id);
        enchantItems.push({
          ...enc,
          type: "enchant_random",
          name: enc.name,
          originalName: enc.name,
          desc: encDesc || `所持トークンにランダムに「${enc.name}」を付与する。`,
        });
      }

      for (let i = 0; i < extraEnchantCount; i++) {
        const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        const encDesc = getEnchantDescription(enc.id);
        enchantItems.push({
          ...enc,
          type: "enchant_random",
          name: enc.name,
          originalName: enc.name,
          price: Math.max(1, enc.price - 2),
          desc: encDesc || `所持トークンにランダムに「${enc.name}」を付与する。`,
        });
      }
    }

    const activeItems = Array.from({ length: baseActiveCount }).map(() => createTokenItem(activesPools));

    const candidatesForSale = [...passiveItems, ...activeItems];
    const saleIndices = Array.from({ length: candidatesForSale.length }, (_, i) => i);

    for (let i = 0; i < saleCount && saleIndices.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * saleIndices.length);
      const targetIdx = saleIndices.splice(randIdx, 1)[0];
      candidatesForSale[targetIdx].isSale = true;
      candidatesForSale[targetIdx].originalPrice = candidatesForSale[targetIdx].price;
      candidatesForSale[targetIdx].price = Math.floor(candidatesForSale[targetIdx].price / 2);
    }

    const finalItems = [...passiveItems, ...enchantItems, ...activeItems];

    if (cycleCount >= 5 && Math.random() < 0.3) {
      finalItems.push({
        id: "grant_random_curse",
        type: "grant_random_curse",
        name: "呪いの契約",
        desc: "ランダムな呪いを1つ獲得する。代償を払い、より高みへ至るための試練。",
        price: 0,
        rarity: 1
      });
    }

    setShopItems(finalItems);
    return finalItems;
  };

  const buyItem = (item, clickPos) => {
    if (stars < item.price) {
      soundManager.playSE(SE_IDS.ERROR);
      return notify("★が足りません");
    }

    if (clickPos) {
      spawnParticles(8, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
    }
    soundManager.playSE(SE_IDS.BUY_STAR);

    if (item.id === "time_ext") {
      setSandsOfTimeSeconds(prev => prev + 2);
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      soundManager.playSE(SE_IDS.BUY_STAR);
      return notify("操作時間が2秒延長されました！");
    }

    if (item.id === "exchange_star3") {
      const targets = tokens.filter(t => t && t.type !== 'curse' && t.effect !== 'copy_left' && !t.isCurse && (t.rarity === 1 || t.rarity === 2 || !t.rarity));
      if (targets.length === 0) return notify("交換可能な星1・星2トークンがありません");

      const targetToLose = targets[Math.floor(Math.random() * targets.length)];
      const loseIdx = tokens.findIndex(t => t.instanceId === targetToLose.instanceId);

      const targetType = targetToLose.type === "skill" ? "skill" : "passive";
      const star3Pool = ALL_TOKEN_BASES.filter(t => t.type === targetType && t.rarity === 3 && !t.isCurse);

      if (star3Pool.length === 0) return notify("交換可能な星3が見つかりません");

      const gainBase = star3Pool[Math.floor(Math.random() * star3Pool.length)];
      const gainItem = {
        ...gainBase,
        level: 1,
        charge: gainBase.cost || 0,
        instanceId: Date.now() + Math.random(),
        price: getTokenDynamicPrice(gainBase, tokens),
        desc: getTokenDescription({ ...gainBase, level: 1 }, 1, currentRunStats, tokens, activeBuffs)
      };

      setTokens((prev) => {
        const next = [...prev];
        next[loseIdx] = gainItem;
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      addTokenToast(gainItem, `に昇華しました！`);
      return;
    }

    if (item.type === "upgrade_random") {
      const upgradeableTokens = tokens.filter(t => (t.level || 1) < 3 && t.effect !== 'copy_left');

      if (upgradeableTokens.length === 0) return notify("強化可能なトークンがありません");

      const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];
      const targetIdx = tokens.findIndex(t => t.instanceId === targetToken.instanceId);

      triggerLevelUp(targetToken.instanceId);

      setTokens((prev) => {

        const next = [...prev];
        const nextLevel = (next[targetIdx].level || 1) + 1;
        next[targetIdx] = {
          ...next[targetIdx],
          level: nextLevel,
          desc: getTokenDescription(next[targetIdx], nextLevel, currentRunStats, next, activeBuffs)
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));

      const nextLevel = (targetToken.level || 1) + 1;
      const updatedToken = { ...targetToken, level: nextLevel, desc: getTokenDescription(targetToken, nextLevel, currentRunStats, tokens, activeBuffs) };
      addTokenToast(updatedToken, "が強化されました！");

    } else if (item.type === "enchant_random") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        const newEnc = { id: item.id, effect: item.effect, name: item.originalName, params: item.params };
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), newEnc],
        };
        next.forEach((t, i) => {
          if (t && t.id === 'legend_magician' && i !== targetIdx) {
            next[i] = {
              ...next[i],
              enchantments: [...(next[i].enchantments || []), { ...newEnc }]
            };
          }
        });
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));

      const updatedToken = {
        ...targetToken,
        enchantments: [...(targetToken.enchantments || []), { id: item.id, effect: item.effect, name: item.originalName, params: item.params }]
      };
      addTokenToast(targetToken, `に「${item.originalName}」を付与しました！`);

    } else if (item.type === "enchant_grant") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        const newEnc = { id: item.id, effect: item.effect, name: item.name, params: item.params };
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), newEnc],
        };
        next.forEach((t, i) => {
          if (t && t.id === 'legend_magician' && i !== targetIdx) {
            next[i] = {
              ...next[i],
              enchantments: [...(next[i].enchantments || []), { ...newEnc }]
            };
          }
        });
        return next;
      });
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));

      const updatedToken = {
        ...targetToken,
        enchantments: [...(targetToken.enchantments || []), { id: item.id, effect: item.effect, name: item.name, params: item.params }]
      };
      addTokenToast(updatedToken, `に「${item.name}」を付与しました！`);
    } else if (item.type === "grant_random_curse") {
      const activeCount = tokens.filter(t => t?.type === 'skill' || t?.isCurse).length;
      const passiveCount = tokens.filter(t => t && t?.type !== 'skill' && !t?.isCurse).length;
      const maxSlots = 5 + tokenSlotExpansionCount;

      const cursePool = ALL_TOKEN_BASES.filter(t => t.type === 'curse' || t.isCurse);
      if (cursePool.length === 0) return notify("呪いが見つかりません");

      const randomCurseBase = cursePool[Math.floor(Math.random() * cursePool.length)];
      const isCurseActive = randomCurseBase.type === 'skill' || randomCurseBase.isCurse;

      if (isCurseActive && activeCount >= maxSlots) return notify(`アクティブ枠がいっぱいで呪いを受け取れません`);
      if (!isCurseActive && passiveCount >= maxSlots) return notify(`パッシブ枠がいっぱいで呪いを受け取れません`);

      const curseItem = {
        ...randomCurseBase,
        level: 1,
        charge: 0,
        instanceId: Date.now() + Math.random(),
        startValue: randomCurseBase.condition ? getStatByCondition(randomCurseBase.condition) : 0
      };
      if (isCurseActive && randomCurseBase.action && randomCurseBase.action.startsWith('curse_')) {
        curseItem.curseUses = 0;
      }

      if (randomCurseBase.id === 'curse_multiply') {
        const passiveDummy = ALL_TOKEN_BASES.find(t => t.id === 'curse_multiplied_p');
        const dummy = { ...passiveDummy, instanceId: Date.now() + Math.random(), parentId: curseItem.instanceId, level: 1, charge: 0 };
        setTokens(prev => [...prev, curseItem, dummy]);
      } else {
        setTokens(prev => [...prev, curseItem]);
      }
      setStars(s => {
        const nextStars = s - item.price;
        return randomCurseBase.id === 'curse_init' && !hasSaintToken ? Math.floor(nextStars / 2) : nextStars;
      });
      setTotalPurchases(p => p + 1);
      setShopItems(prev => prev.filter(i => i !== item));
      addTokenToast(curseItem, "の呪いを得た…！");
    } else {
      const isActive = item.type === 'skill';
      const maxSlots = 5 + tokenSlotExpansionCount;

      const existingIdx = tokens.findIndex((t) => t?.id === item.id);
      if (existingIdx !== -1) {
        if (item.noLevelUp) {
          return notify("このトークンは複数所持・強化できません");
        }
        const maxLv = tokens[existingIdx].values?.length || 3;
        const currentLevel = tokens[existingIdx].level || 1;
        const activeCount = tokens.filter(t => t?.type === 'skill').length;
        const passiveCount = tokens.filter(t => t && t?.type !== 'skill').length;

        if (currentLevel < maxLv) {
          setPendingShopItem(item);
        } else {
          if ((isActive && activeCount >= maxSlots) || (!isActive && passiveCount >= maxSlots)) {
            return notify(`これ以上強化できません (Max Lv${maxLv})`);
          }
          setPendingShopItem(item);
        }
      } else {
        const activeCount = tokens.filter(t => t?.type === 'skill').length;
        const passiveCount = tokens.filter(t => t && t?.type !== 'skill').length;
        const maxSlotsCurrent = 5 + tokenSlotExpansionCount;
        if (isActive && activeCount >= maxSlotsCurrent) return notify(`アクティブスキルは${maxSlotsCurrent}個までです`);
        if (!isActive && passiveCount >= maxSlotsCurrent) return notify(`パッシブアイテムは${maxSlotsCurrent}個までです`);

        const obtainedToken = {
          ...item,
          instanceId: Date.now() + Math.random(),
          startValue: item.condition ? getStatByCondition(item.condition) : 0
        };
        setTokens((prev) => [
          ...prev,
          obtainedToken
        ]);
        setStars((s) => s - item.price);
        setTotalPurchases((p) => p + 1);
        setTotalStarsSpent((prev) => prev + item.price);
        setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
        setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
        setShopItems((prev) => prev.filter((i) => i !== item));
        notify("購入完了!");
        addTokenToast(obtainedToken, "を獲得しました！");
      }
    }
  };



  const getTokenSlotExpandPrice = () => {
    return AWAKENING_TOKEN_SLOT_PRICES[Math.min(tokenSlotExpansionCount, 4)] || 50000;
  };

  const buyAwakeningItem = (type, clickPos) => {
    switch (type) {
      case 'random_levelup': {
        const price = 5;
        if (stars < price) {
          soundManager.playSE(SE_IDS.ERROR);
          return notify('★が足りません');
        }
        const upgradeableTokens = tokens.filter(t => (t?.level || 1) < 3);
        if (upgradeableTokens.length === 0) return notify('強化可能なトークンがありません (Max Lv3)');
        const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];

        if (clickPos) {
          spawnParticles(12, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
        }
        soundManager.playSE(SE_IDS.AWAKEN_BUY);
        triggerLevelUp(targetToken.instanceId);

        const targetIdx = tokens.findIndex(t => t?.instanceId === targetToken.instanceId);

        setTokens(prev => {
          const next = [...prev];
          const nextLevel = (next[targetIdx].level || 1) + 1;
          next[targetIdx] = {
            ...next[targetIdx],
            level: nextLevel,
            desc: getTokenDescription(next[targetIdx], nextLevel, currentRunStats, next, activeBuffs)
          };
          return next;
        });
        setStars(s => s - price);
        setTotalPurchases(p => p + 1);
        setTotalStarsSpent(prev => prev + price);
        setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + price }));
        setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + price }));
        setIsAwakeningLevelUpBought(true);
        soundManager.playSE(SE_IDS.AWAKEN_BUY);

        const nextLevel = (targetToken.level || 1) + 1;
        const updatedToken = { ...targetToken, level: nextLevel, desc: getTokenDescription(targetToken, nextLevel, currentRunStats, tokens, activeBuffs) };
        notify(`${targetToken.name} が強化されました! (Lv${nextLevel})`);
        addTokenToast(updatedToken, "が覚醒強化されました！");
        break;
      }
      case 'unlock_enchant_shop': {
        const price = 10;
        if (stars < price) {
          soundManager.playSE(SE_IDS.ERROR);
          return notify('★が足りません');
        }
        if (isEnchantShopUnlocked) return notify('エンチャントショップはすでに解放済みです');
        setIsEnchantShopUnlocked(true);
        setStars(s => s - price);
        soundManager.playSE(SE_IDS.AWAKEN_BUY);
        if (clickPos) {
          spawnParticles(15, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
        }
        notify('エンチャントショップが解放されました!');
        break;
      }
      case 'expand_token_slots': {
        const beyondSlotMax = isBeyondMode ? 10 : 5;
        if (tokenSlotExpansionCount >= beyondSlotMax) return notify(`これ以上拡張できません (最大${5 + beyondSlotMax}枠)`);
        const price = getTokenSlotExpandPrice();
        if (stars < price) {
          soundManager.playSE(SE_IDS.ERROR);
          return notify('★が足りません');
        }
        if (clickPos) {
          spawnParticles(15, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
        }
        setTokenSlotExpansionCount(prev => prev + 1);
        setStars(s => s - price);
        soundManager.playSE(SE_IDS.AWAKEN_BUY);
        notify(`トークン枠が ${5 + tokenSlotExpansionCount + 1} / ${5 + tokenSlotExpansionCount + 1} に拡張されました!`);
        break;
      }

      default:
        break;
    }
  };

  const handleChoice = (choice) => {
    if (!pendingShopItem) return;
    const item = pendingShopItem;

    let updatedToken = null;
    let actionText = "";

    if (choice === "upgrade") {
      setTokens((prev) => {
        const next = [...prev];
        const idx = next.findIndex((t) => t?.id === item.id);
        if (idx !== -1) {
          const currentLevel = next[idx].level || 1;
          if (currentLevel >= 3) {
            return next;
          }
          const nextLevel = currentLevel + 1;
          next[idx] = {
            ...next[idx],
            level: nextLevel,
            desc: getTokenDescription(next[idx], nextLevel, currentRunStats, next, activeBuffs)
          };
          updatedToken = next[idx];
          actionText = `強化されました！`;
        }
        return next;
      });
      addTokenToast(item, "を強化した！");
    } else {

      const isActive = item.type === 'skill';
      const activeCount = tokens.filter(t => t.type === 'skill').length;
      const passiveCount = tokens.filter(t => t.type !== 'skill').length;

      const maxSlots = 5 + tokenSlotExpansionCount;
      if ((isActive && activeCount >= maxSlots) || (!isActive && passiveCount >= maxSlots)) {
        notify("スロットがいっぱいです。強制的に強化を適用します。");
        setTokens((prev) => {
          const next = [...prev];
          const idx = next.findIndex((t) => t?.id === item.id);
          if (idx !== -1) {
            const nextLevel = (next[idx].level || 1) + 1;
            next[idx] = {
              ...next[idx],
              level: nextLevel,
              desc: getTokenDescription(next[idx], nextLevel, currentRunStats, next, activeBuffs)
            };
            updatedToken = next[idx];
            actionText = `スロット一杯のため自動強化されました！`;
          }
          return next;
        });
      } else {
        const newToken = { ...item, instanceId: Date.now() + Math.random() };
        setTokens((prev) => [
          ...prev,
          newToken
        ]);
        updatedToken = newToken;
        actionText = `2つ目を装備しました！`;
        notify("2つ目のトークンを装備しました。");
      }
    }

    setStars((s) => s - item.price);
    setTotalPurchases((p) => p + 1);
    setTotalStarsSpent((prev) => prev + item.price);
    setShopItems((prev) => prev.filter((i) => i !== item));
    setPendingShopItem(null);
    if (updatedToken) {
      addTokenToast(updatedToken, actionText);
    }
  };

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
      case "convert":
        engine.convertColor(token.params.from, token.params.to);
        break;
      case "convert_multi":
        engine.convertMultiColor(token.params.types, token.params.to);
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
              const maxSlots = 5 + tokenSlotExpansionCount;
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
      case "skyfall":
      case "skyfall_limit":
      case "temp_mult":
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
        const maxSlots = 5 + tokenSlotExpansionCount;

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
      const skipConsume = hasMagicEcho && Math.random() < 0.25;
      if (skipConsume) {
        notify("魔力反響！エネルギーを消費しませんでした。");
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

  const purifyCurse = (token) => {
    if (!token || (token.type !== 'curse' && !token.isCurse)) return;

    // 解除報酬の星3トークンを抽選
    const rewardPool = ALL_TOKEN_BASES.filter(t => t.rarity === 3 && t.canBeCurseReward);
    const rewardBase = rewardPool[Math.floor(Math.random() * rewardPool.length)] || rewardPool[0];

    const rewardToken = {
      ...rewardBase,
      instanceId: Date.now() + Math.random(),
      level: 1,
      charge: rewardBase.cost || 0
    };

    setTokens(prev => prev
      .map(t => (t && t.instanceId === token.instanceId) ? rewardToken : t)
      .filter(t => !t || t.parentId !== token.instanceId) // 親に紐付く増殖された呪いを削除
    );

    // カウントアップ
    setCurrentRunStats(prev => ({ ...prev, currentCursesRemoved: (prev.currentCursesRemoved || 0) + 1 }));
    setStats(prev => ({ ...prev, lifetimeCursesRemoved: (prev.lifetimeCursesRemoved || 0) + 1 }));

    setSelectedTokenDetail(null);
    addTokenToast(rewardToken, "を獲得しました！ (呪い解除報酬)");
  };

  const sellToken = (token) => {
    if (!token) return;
    if (token.isLocked) return notify("このトークンは売却できません");

    // --- 変更: 資産価値 (Investment) ---
    let sellRate = 0.5;
    if (token.enchantments?.some(e => e.effect === "high_sell")) {
      sellRate = 3.0; // 300%
    }
    let sellPrice = Math.floor(token.price * sellRate);

    // --- 追加: 鉤爪の研鑽 (polishing_claw) ---
    if (token.effect === "stat_shape_l") {
      const v = token.values?.[(token.level || 1) - 1] || 1;
      const lCount = currentRunStats.currentShapeLShape || 0;
      sellPrice += (lCount * v);
    }

    setStars(s => s + sellPrice);

    // エフェクト発火（トークンベルト付近から発生）
    spawnParticles(10, window.innerWidth / 2, window.innerHeight * 0.4, window.innerWidth * 0.8, 40, 'star');
    soundManager.playSE(SE_IDS.SELL_STAR);


    setTokens(prev => prev.filter(t => t.instanceId !== token.instanceId));
    setCurrentRunStats(prev => ({
      ...prev,
      tokensSold: (prev.tokensSold || 0) + 1,
      totalStarsEarned: (prev.totalStarsEarned || 0) + sellPrice
    }));

    setSelectedTokenDetail(null);
    notify(`${token.name} を売却しました (+${sellPrice} ★)`);
  };

  // トークンを同一タイプの中で指定番号の位置に移動する
  const moveToken = (token, targetPos) => {
    if (!token) return;
    const isSkill = token.type === 'skill';

    setTokens(prev => {
      // スキルとパッシブを分離
      const sameType = prev.filter(t => t != null && (isSkill ? t.type === 'skill' : t.type !== 'skill'));
      const otherType = prev.filter(t => t == null || (isSkill ? t.type !== 'skill' : t.type === 'skill'));
      // 対象トークンを取り除いた同タイプリスト
      const withoutSelf = sameType.filter(t => t.instanceId !== token.instanceId);
      // 指定位置（1始まり）に挿入
      const clampedPos = Math.max(0, Math.min(targetPos - 1, withoutSelf.length));
      withoutSelf.splice(clampedPos, 0, token);
      // 同タイプを前に、別タイプを後ろに結合
      return [...withoutSelf, ...otherType];
    });

    // 移動後も詳細を表示し続けるために setSelectedTokenDetail(null) を削除
    // setSelectedTokenDetail(null);
    soundManager.playSE(SE_IDS.EQUIP_TOKEN);
    notify(`${token.name} を ${targetPos} 番目に移動しました`);
  };

  const handleDragStart = (e, token) => {
    if (!token) return;
    setDraggedToken(token);
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent image or just use default browser ghosting
    // e.dataTransfer.setData('text/plain', token.instanceId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetPos, isSkill) => {
    e.preventDefault();
    if (!draggedToken) return;

    // Different types cannot be swapped in this implementation logic
    if ((draggedToken.type === 'skill') !== isSkill) {
      setDraggedToken(null);
      return;
    }

    moveToken(draggedToken, targetPos);
    setDraggedToken(null);
  };

  const openShop = () => {
    if (shopItems.length === 0) {
      generateShop();
    }
    setShowShop(true);
  };

  const refreshShop = (clickPos) => {
    if (stars < shopRerollPrice) {
      soundManager.playSE(SE_IDS.ERROR);
      return notify("★が足りません");
    }

    if (clickPos) {
      spawnParticles(5, clickPos.x, clickPos.y, window.innerWidth * 0.8, 50, 'star');
    }

    setStars(s => s - shopRerollPrice);
    soundManager.playSE(SE_IDS.SHOP_REFRESH);
    setTotalStarsSpent((prev) => prev + shopRerollPrice);
    setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + shopRerollPrice }));
    setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + shopRerollPrice }));
    setShopRerollPrice(prev => Math.ceil(prev * SHOP_REROLL_GROWTH_FACTOR));
    generateShop();
    notify("商品を入荷しました");
  };


  // ロード中の画面
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
          <section className="relative z-20 flex-1 bg-slate-900 rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
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
                    <p className="text-slate-400 mb-8 text-sm font-medium">目標未達成...<br />リトライして再挑戦しよう</p>

                    <div className="flex flex-col gap-3 w-full">
                      <button onClick={handleEndlessMode} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 w-full">
                        <span className="material-icons-round">all_inclusive</span>
                        エンドレスモードで継続
                      </button>
                      <button onClick={handleGiveUp} className="bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold text-sm active:scale-95 hover:bg-slate-700 transition-colors w-full border border-white/5">
                        リトライ
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
                        const enchDef = ENCHANTMENTS.find(e => e.id === enc.id);
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

export { PuzzleEngine, ALL_TOKEN_BASES };
export default App;
