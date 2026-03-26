import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Star as StarIcon,
} from "lucide-react";
import ShopScreen from "./ShopScreen";
import TitleScreen from "./TitleScreen";
import PauseScreen from "./PauseScreen";
import HelpScreen from "./HelpScreen";
import StatsScreen from "./StatsScreen";
import CreditsScreen from "./CreditsScreen";
import SettingsScreen from "./SettingsScreen";
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { ENCHANT_DESCRIPTIONS, getEnchantDescription, ENCHANTMENTS } from './constants/enchantments.js';
import { MAX_COMBO, MAX_TARGET, SAVE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS } from './constants/gameConstants.js';
import { formatNum, getEffectiveCost, getTokenDescription } from './utils/tokenUtils.js';
import { PuzzleEngine } from './engine/PuzzleEngine.js';

const App = () => {
  // Game State
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [tokens, setTokens] = useState(Array(6).fill(null));
  const [sandsOfTimeSeconds, setSandsOfTimeSeconds] = useState(0); // 永続強化: 時の砂
  const [isGameOver, setIsGameOver] = useState(false);
  const [target, setTarget] = useState(100);
  const [goalReached, setGoalReached] = useState(false);
  const [message, setMessage] = useState(null); // Centralized message toast
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
    lifetimePlays: 0,         // 累計プレイ回数
    lifetimeClears: 0,        // 累計サイクルクリア回数
    lifetimeStarsSpent: 0,    // 累計消費スター数
    lifetimeSkillsUsed: 0,    // 累計スキル使用回数
    lifetimeShapeLen4: 0,     // 4個消し累計回数
    lifetimeShapeCross: 0,    // 十字消し累計回数
    lifetimeShapeRow: 0,      // 1列消し累計回数
    lifetimeShapeLShape: 0,   // L字消し累計回数
    lifetimeShapeSquare: 0,   // 四角消し(2x2)累計回数
    lifetimeShapesLen5: 0,     // 5個消し累計回数
    maxCycleAllTime: 0,       // 歴代最大到達サイクル
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
  };
  const [currentRunStats, setCurrentRunStats] = useState(initialCurrentRunStats);
  // const [isLuxury, setIsLuxury] = useState(false); // Unused
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalStarsSpent, setTotalStarsSpent] = useState(0);
  const [triggeredPassives, setTriggeredPassives] = useState([]); // Visual feedback state

  const triggerPassive = (tokenId) => {
    if (!tokenId) return;
    setTriggeredPassives(prev => [...prev, tokenId]);
    setTimeout(() => {
      setTriggeredPassives(prev => prev.filter(id => id !== tokenId));
    }, 500);
  };

  const [targetPulse, setTargetPulse] = useState(false);
  const targetComboRef = useRef(null);

  // Refs
  const boardRef = useRef(null);

  const [isEndlessMode, setIsEndlessMode] = useState(false); // New: Endless Mode state
  const [starProgress, setStarProgress] = useState(0); // 累積スター進捗
  const [selectedTokenDetail, setSelectedTokenDetail] = useState(null);
  const [selectedEnchantDetail, setSelectedEnchantDetail] = useState(null);
  const [tokenMoveInput, setTokenMoveInput] = useState(''); // 並び替え用の入力値
  const [showGameClear, setShowGameClear] = useState(false); // 全画面クリア画面の表示フラグ

  // --- 覚醒ショップ State ---
  const [isEnchantShopUnlocked, setIsEnchantShopUnlocked] = useState(false); // エンチャントショップ解放フラグ
  const [tokenSlotExpansionCount, setTokenSlotExpansionCount] = useState(0);  // トークン枠拡張回数
  const [isAwakeningLevelUpBought, setIsAwakeningLevelUpBought] = useState(false); // 覚醒ショップ: ランダムレベルアップ購入済みフラグ
  // トークンベルトのページネーション用 State
  const [passiveTokenPage, setPassiveTokenPage] = useState(0);
  const [activeTokenPage, setActiveTokenPage] = useState(0);
  // スワイプ座標の管理（useRef でレンダー外管理）
  const passiveSwipeRef = useRef(null);
  const activeSwipeRef = useRef(null);


  const timerRef = useRef(null);
  const comboRef = useRef(null);
  const engineRef = useRef(null);
  const handleTurnEndRef = useRef(null);
  const onPassiveTriggerRef = useRef(null);
  const onStarEraseRef = useRef(null);
  const totalMoveTimeRef = useRef(0); // エンジン内での操作時間累積用
  const skipTurnProgressRef = useRef(false);

  // Derived
  const hasGiantDomain = tokens.some((t) => t?.id === "giant" || t?.enchantments?.some(e => e.effect === "expand_board"));
  // NOTE: Changing board size forces re-init.
  const rows = hasGiantDomain ? 6 : 5;
  const cols = hasGiantDomain ? 7 : 6;

  const maxTurns = Math.max(1, 3
    + tokens.reduce((acc, t) => acc + (t?.enchantments?.filter(e => e.effect === "add_turn").length || 0), 0)
    + tokens.reduce((acc, t) => {
      if (t?.effect === "picky_eater") return acc + (t.values[(t.level || 1) - 1] || 0);
      return acc;
    }, 0)
  );

  const minMatchLength = tokens.some(t => t?.effect === "min_match") ? 2 : 3;

  // --- Load Save Data ---
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

        // tokens は配列として復元
        if (parsed.tokens && Array.isArray(parsed.tokens)) {
          setTokens(parsed.tokens);
        }

        setTotalPurchases(parsed.totalPurchases || 0);
        setTotalStarsSpent(parsed.totalStarsSpent || 0);
        setIsGameOver(parsed.isGameOver || false);
        setShopRerollBasePrice(parsed.shopRerollBasePrice || 1);
        setShopRerollPrice(parsed.shopRerollPrice || 1);
        setCurrentRunTotalCombo(parsed.currentRunTotalCombo || 0);
        // 覚醒ショップのセーブデータを復元
        setIsEnchantShopUnlocked(parsed.isEnchantShopUnlocked || false);
        setTokenSlotExpansionCount(parsed.tokenSlotExpansionCount || 0);
        setIsAwakeningLevelUpBought(parsed.isAwakeningLevelUpBought || false);
        if (parsed.shopItems) {
          setShopItems(parsed.shopItems);
        } else if (!parsed.isGameOver) {
          // セーブデータはあるがショップ情報がない（古いデータ）場合のみ生成
          // (tokens等がセットされた後の次のサイクルで実行される必要があるため、ここではフラグを立てるかsetTimeout等で対応)
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
      // セーブデータが全くない場合のみ、初期ショップを生成
      generateShop();
    }

    // Load Stats
    const savedStats = localStorage.getItem('puzzle_rogue_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Stats data corrupted:", e);
      }
    }

    // 設定のロード
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error("Settings data corrupted:", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // --- Auto Save ---
  useEffect(() => {
    if (!isLoaded) return; // ロード完了前はセーブしない

    if (isGameOver) {
      // ゲームオーバー時はセーブデータを消去
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
      // 覚醒ショップのセーブデータ
      isEnchantShopUnlocked,
      tokenSlotExpansionCount,
      isAwakeningLevelUpBought,
      board: engineRef.current ? engineRef.current.getState() : (savedBoard || null)
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveObj));
    setHasSaveData(true);

  }, [turn, cycleTotalCombo, target, goalReached, stars, tokens, isGameOver, isLoaded, totalPurchases, totalStarsSpent, sandsOfTimeSeconds, shopRerollBasePrice, shopRerollPrice, currentRunTotalCombo, shopItems, savedBoard, isEnchantShopUnlocked, tokenSlotExpansionCount, isAwakeningLevelUpBought]);

  // --- Auto Save Stats ---
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('puzzle_rogue_stats', JSON.stringify(stats));
  }, [stats, isLoaded]);

  // --- Skyfall Weight Management ---
  useEffect(() => {
    if (!engineRef.current) return;
    const weights = {};
    const ALL_COLORS = ["fire", "water", "wood", "light", "dark", "heart"];
    ALL_COLORS.forEach((c) => (weights[c] = 1));
    const isEnchantDisabled = tokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");

    // 偏食家: 指定色の出現率を0にする
    tokens.forEach((t) => {
      if (t?.effect === "picky_eater" && t.params?.excludeColors) {
        t.params.excludeColors.forEach((c) => { weights[c] = 0; });
      }

      // エンチャントによる出現率変動
      if (!isEnchantDisabled && t?.enchantments) {
        t.enchantments.forEach(e => {
          if (e.effect === "skyfall_boost" && e.params?.color) {
            weights[e.params.color] += 0.5; // 加算 (Boost)
          } else if (e.effect === "skyfall_nerf" && e.params?.color) {
            weights[e.params.color] *= 0.5; // 乗算 (Nerf)
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
    const isEnchantDisabled = tokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
    // 背水の陣: 他の延長効果をすべて無視して4秒固定
    const hasDesperateStance = tokens.some(t => t?.effect === "desperate_stance");
    if (hasDesperateStance) {
      return 4000;
    }
    let base = 5000 + (sandsOfTimeSeconds * 1000);
    tokens.forEach((t) => {
      if (t?.effect === "time") base += (t.values[(t.level || 1) - 1] * 1000);
      // 呪われた力: 操作時間-2秒
      if (t?.effect === "cursed_power") base -= 2000;

      // --- 追加: エンチャントによる時間変動 ---
      if (!isEnchantDisabled) {
        t?.enchantments?.forEach(enc => {
          if (enc.effect === "time_ext_enc") base += (enc.value || 1) * 1000;
          if (enc.effect === "berserk_mode") base -= 1000; // 狂戦士: -1秒
        });
      }

      // --- 新規: 星2トークン数×操作時間延長 ---
      if (t?.effect === "star_count_time_ext") {
        const rarity2Count = tokens.filter(tok => tok?.rarity === 2).length;
        base += (t.values[(t.level || 1) - 1] * 1000) * rarity2Count;
      }

      // --- 五星の導き手 ---
      if (t?.effect === "stat_shape_len5") {
        const v = t.values[(t.level || 1) - 1]; // 0.5/1.0/1.5
        const count = Math.floor((currentRunStats.currentShapeLen5 || 0) / 10);
        if (count > 0) base += (v * 1000) * count;
      }
    });
    // 特殊消しボーナスによる操作時間延長（五星の印・十字の祈り）
    base *= nextTurnTimeMultiplier;
    return Math.max(1000, base); // 最低1秒
  }, [tokens, sandsOfTimeSeconds, nextTurnTimeMultiplier, currentRunStats.currentShapeLen5, activeBuffs]);

  // --- Init Engine ---
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
        onCombo: () => {
          // No-op for now to avoid re-renders
        },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, showTitle, showHelp, showStats, showCredits, showSettings]);

  // Update time limit and realtime bonuses live
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.timeLimit = getTimeLimit();
      engineRef.current.minMatchLength = minMatchLength;

      const effectiveTokens = tokens.map((t, index) => {
        if (!t) return t;
        if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
          return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
        }
        return t;
      });

      const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");

      // Calculate realtime bonuses from tokens
      const bonuses = {
        len4: 0, row: 0, l_shape: 0, color_combo: {}, heart_combo: 0, enhancedOrbBonus: 0, overLink: null,
        extra_repeat_activations: 0,
        stat_shape_additions: { cross: 0, len4: 0 },
        skyfall: 0,
        rainbow: 0,
        tokenIds: {
          len4: [], row: [], l_shape: [], heart_combo: [], enhancedOrbBonus: [], overLink: [],
          rainbow_combo_bonus: [], extra_repeat_activations: [], stat_shape_additions: { cross: [], len4: [] },
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

        // Add color combo enchantments to realtime bonuses
        const enchList = isEnchantDisabled ? [] : (t.enchantments || []);
        enchList.forEach(enc => {
          if (enc.effect === 'color_combo' && enc.params?.color) {
            const color = enc.params.color;
            bonuses.color_combo[color] = (bonuses.color_combo[color] || 0) + 1; // +1 per combo
          }
          if (enc.effect === 'bomb_burst_combo') {
            bonuses.bomb_burst_combo = (bonuses.bomb_burst_combo || 0) + 3;
          }
        });
      });
      engineRef.current.setRealtimeBonuses(bonuses);

      // 強化ドロップ確率の計算
      const rates = { global: [], colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'enhance_chance') {
          rates.global.push({ value: t.values[lv - 1] || 0, tokenId });
        }

        // 歴戦の証明: 現在ゲームのクリア回数分だけ強化ドロップ確率を加算
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

      // ボムドロップ確率の計算
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

      // リピートドロップ確率の計算
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

      // スタードロップ確率の計算
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

      // 虹ドロップ生成確率の計算
      let rainbowRate = [];
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        if (t.effect === 'rainbow_chance') {
          rainbowRate.push({ value: t.values[lv - 1] || 0, tokenId: t.instanceId || t.id });
        }
      });
      engineRef.current.setRainbowRates(rainbowRate);
    }
  }, [tokens, getTimeLimit, minMatchLength, activeBuffs]);

  // --- Init Shop on Start ---
  // (Removed separate useEffect to avoid race conditions with loading)

  // --- Game Logic ---
  // Debug State
  // const [debugLog, setDebugLog] = useState(null);

  const handleTurnEnd = async (turnCombo, colorComboCounts, erasedColorCounts, hasSkyfallCombo, shapes = [], overLinkMultiplier = 1, erasedByBombTotal = 0, erasedByRepeatTotal = 0, erasedByStarTotal = 0, isAllClear = false) => {
    const tc = Number(turnCombo) || 0;
    setLastTurnCombo(tc);
    setLastErasedColorCounts(erasedColorCounts);
    let bonus = 0;
    let multiplier = 1;
    let timeMultiplier = 1; // 次手の操作時間倍率
    const matchedColorSet = new Set(Object.keys(colorComboCounts).filter(k => colorComboCounts[k] > 0));

    const effectiveTokens = tokens.map((t, index) => {
      if (!t) return t;
      if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
        return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
      }
      return t;
    });

    const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
    const animationMode = settings?.comboAnimationMode || 'instant';
    const isInstant = animationMode === 'instant';

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
      // 段階度演出用: { label, value } のステップリスト
      bonusSteps: [],    // コンボ加算ステップ
      multiplierSteps: [], // コンボ倍率ステップ
    };

    if (isAllClear) {
      multiplier *= 2;
      logData.multipliers.push(`all_clear_multiplier:x2`);
      logData.multiplierSteps.push({ label: '全消しボーナス', value: 2 });
    }

    effectiveTokens.forEach((t) => {
      if (!t) return;

      const lv = t.level || 1;
      const enchList = isEnchantDisabled ? [] : (t.enchantments || []);

      // --- 共通処理関数 (トークン効果とエンチャント効果の両方をチェック) ---
      const checkEffect = (effect, params, val, tokenName, tokenId) => {
        // 1. 先制の心得 (Opener)
        if (effect === "turn_1_bonus" && turn === 1) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 10;
          bonus += v;
          logData.bonuses.push(`opener:+${v}`);
          logData.bonusSteps.push({ label: tokenName || '先制の心得', value: v, tokenId });
        }
        // 2. 土壇場の底力 (Clutch)
        if (effect === "last_turn_mult" && turn === maxTurns) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.5;
          multiplier *= v;
          logData.multipliers.push(`clutch:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '土壇場の底力', value: v, tokenId });
        }
        // 3. 虹色の加護 (Rainbow)
        if (effect === "multi_color" && matchedColorSet.size >= 4) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 3;
          bonus += v;
          logData.bonuses.push(`rainbow:+${v}`);
          logData.bonusSteps.push({ label: tokenName || '虹色の加護', value: v, tokenId });
        }
        // 4. 一点突破 (Sniper)
        if (effect === "single_color" && matchedColorSet.size > 0 && matchedColorSet.size <= 2) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.3;
          multiplier *= v;
          logData.multipliers.push(`sniper:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '一点突破', value: v, tokenId });
        }
        // 5. 形状の達人 (Geometry) -> 削除済み (代わりに個別形状エンチャント)
        // shapes: ["len4", "cross", "row", "l_shape", "square", ...]
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
            // 個数分だけ倍率を乗算 (例: 1.2のcount乗)
            const totalMult = Math.pow(val || 1.0, count);
            multiplier *= totalMult;
            logData.multipliers.push(`${effect}:${val}^${count}=x${totalMult.toFixed(2)}`);
            logData.multiplierSteps.push({ label: tokenName || effect, value: totalMult, tokenId });
          }
        }
        // 6. 運命の悪戯 (Gamble)
        if (effect === "random_bonus") {
          if (isInstant) triggerPassive(tokenId);
          const rand = Math.floor(Math.random() * 21) - 5; // -5 to +15
          bonus += rand;
          logData.bonuses.push(`gamble:${rand > 0 ? '+' : ''}${rand}`);
          if (rand !== 0) logData.bonusSteps.push({ label: tokenName || '運命の悪戯', value: rand, tokenId });
        }
        // 7. 狂戦士 (Berserk)
        if (effect === "berserk_mode") {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.5;
          multiplier *= v;
          logData.multipliers.push(`berserk:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '狂戦士', value: v, tokenId });
        }
        // 8. 追撃 (Aftershock)
        if (effect === "skyfall_mult" && hasSkyfallCombo) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.4;
          multiplier *= v;
          logData.multipliers.push(`aftershock:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '追撃', value: v, tokenId });
        }
        // 9. 会心の一撃 (Critical) - トークン/エンチャント共通
        if (effect === "critical_strike") {
          if (Math.random() < 0.2) { // 20%
            multiplier *= val;
            logData.multipliers.push(`CRITICAL!:x${val}`);
            logData.multiplierSteps.push({ label: tokenName || '会心の一撃!', value: val, tokenId });
            notify("会心の一撃！"); // 演出
          }
        }
        // 10. 色別連舞 (Color Multiplier Enchantment)
        if (effect === "color_multiplier_enc") {
          const color = params?.color;
          if (color && matchedColorSet.has(color)) {
            if (isInstant) triggerPassive(tokenId);
            const v = val || 1.2;
            multiplier *= v;
            logData.multipliers.push(`color_enc_${color}:x${v}`);
            logData.multiplierSteps.push({ label: tokenName || `色別連舞(${color})`, value: v, tokenId });
          }
        }

        // 11. 形状別極意 (Shape Split Enchantments)
        // shapes: ["len4", "cross", "row", "l_shape", "square", ...]
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
              // 消した回数分だけ跳ねさせる (見た目が壊れない程度に少しディレイを入れる)
              for (let i = 0; i < count; i++) {
                setTimeout(() => triggerPassive(tokenId), i * 150);
              }
            }
            // 個数分だけ倍率を乗算 (例: 1.2のcount乗)
            const totalMult = Math.pow(val || 1.0, count);
            multiplier *= totalMult;
            logData.multipliers.push(`${effect}:${val}^${count}=x${totalMult.toFixed(2)}`);
            logData.multiplierSteps.push({ label: tokenName || effect, value: totalMult, tokenId });
          }
        }
      };

      const tId = t.instanceId || t.id;

      // トークン自体の効果をチェック
      if (t.type === 'passive') {
        // valuesから現在レベルの値を取得
        const val = t.values ? t.values[lv - 1] : t.value;
        checkEffect(t.effect, t.params, val, t.name, tId);
      }

      // エンチャントの効果をチェック
      enchList.forEach(enc => {
        checkEffect(enc.effect, enc.params, enc.value, t.name, tId);
      });

      // Base bonuses
      // エンチャント効果（複数対応）
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
        multiplier *= v;
        logData.multipliers.push(`contract_of_void:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '契約の虚無', value: v, tokenId: tId });
      }
      if (t.effect === "random_add") {
        const pool = t.values?.[lv - 1] || [0];
        const v = pool[Math.floor(Math.random() * pool.length)];
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`random_add:${v}`);
        if (v !== 0) logData.bonusSteps.push({ label: t.name || 'ランダム加算', value: v, tokenId: tId });
      }

      // --- 新規: 星1トークン数×コンボ加算 ---
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

      // --- 新規: 星3トークン数×コンボ倍率 ---
      if (t.effect === "star_count_combo_mult") {
        const rarity3Count = tokens.filter(tok => tok?.rarity === 3).length;
        const v = Math.pow(t.values?.[lv - 1] || 1, rarity3Count);
        if (v > 1) {
          multiplier *= v;
          logData.multipliers.push(`star3_mult_boost:x${v.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '星3コンボ倍率', value: v, tokenId: tId });
        }
      }

      // --- 新規: 全レベル合計×コンボ加算 ---
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

      // --- 新規: レベル3トークン数×コンボ倍率 ---
      if (t.effect === "level3_count_combo_mult") {
        const level3Count = tokens.filter(tok => tok?.level === 3).length;
        const base = t.values?.[lv - 1] || 1;
        const v = level3Count * base;
        if (v > 1) {
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`level3_count_mult:x${v.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || 'レベル3数倍率', value: v, tokenId: tId });
        }
      }

      // --- 新規: スタードロップ消去数×倍率 (パッシブ) ---
      if (t.effect === "star_erase_mult" && erasedByStarTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.0;
        const multVal = erasedByStarTotal * baseMult;
        if (multVal > 1) {
          if (isInstant) triggerPassive(tId);
          multiplier *= multVal;
          logData.multipliers.push(`star_erase_mult:x${multVal.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || 'スター消去倍率', value: multVal, tokenId: tId });
        } else if (multVal > 0 && multVal <= 1) {
          if (isInstant) triggerPassive(tId);
          const m = Math.max(1, multVal);
          multiplier *= m;
          logData.multipliers.push(`star_erase_mult:x${m.toFixed(2)}`);
          if (m > 1) logData.multiplierSteps.push({ label: t.name || 'スター消去倍率', value: m, tokenId: tId });
        }
      }

      // エンチャントによる倍率アップ（全トークンのエンチャント数をカウントして適用）
      if (t.effect === "enchant_count_combo_mult") {
        const enchantCount = isEnchantDisabled ? 0 : tokens.reduce((sum, tok) => sum + (tok?.enchantments?.length || 0), 0);
        const v = Math.pow(t.values?.[lv - 1] || 1, enchantCount);
        if (v > 1) {
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`enchant_mult_boost:x${formatNum(v)}`);
          logData.multiplierSteps.push({ label: t.name || 'エンチャント数倍率', value: v, tokenId: tId });
        }
      }

      // --- 新規: ボム消去数×倍率 (パッシブ) ---
      if (t.effect === "bomb_erase_mult" && erasedByBombTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.2;
        const v = erasedByBombTotal * baseMult;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`bomb_erase_mult:x${formatNum(v)}`);
        logData.multiplierSteps.push({ label: t.name || 'ボム消去倍率', value: v, tokenId: tId });
      }

      // --- 新規: リピートドロップ消去数×倍率 (パッシブ) ---
      if (t.effect === "repeat_combo_mult" && erasedByRepeatTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.3;
        const v = erasedByRepeatTotal * baseMult;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`repeat_combo_mult:x${formatNum(v)}`);
        logData.multiplierSteps.push({ label: t.name || 'リピート消去倍率', value: v, tokenId: tId });
      }

      // Skyfall bonus - Already handled in PuzzleEngine
      if (t.effect === "skyfall_bonus" && hasSkyfallCombo) {
        logData.bonuses.push(`skyfall:(applied)`);
      }

      // New: Exact Combo Bonus
      if (t.effect === "combo_if_exact" && turnCombo === t.params?.combo) {
        const v = t.values?.[lv - 1] || 0;
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`combo_exact_${t.params.combo}:${v}`);
        if (v > 0) logData.bonusSteps.push({ label: t.name || `丁度${t.params.combo}コンボ`, value: v, tokenId: tId });
      }

      // New: Combo Threshold Multiplier
      if (t.effect === "combo_if_ge" && turnCombo >= t.params?.combo) {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`combo_ge_${t.params.combo}:${v}`);
        logData.multiplierSteps.push({ label: t.name || `${t.params.combo}コンボ以上`, value: v, tokenId: tId });
      }

      // --- 追加: Skill Combo Bonus (Active Skill Lv3 Effect) ---
      if (t.action === "skill_combo_bonus") {
        const val = t.params?.value || 0;
        bonus += val;
        logData.bonuses.push(`skill_lv3_bonus:+${val}`);
        if (val > 0) logData.bonusSteps.push({ label: t.name || 'スキルボーナス', value: val, tokenId: tId });
      }

      // --- 特殊消しボーナス（Shape Bonus） ---
      if (t.effect === "shape_bonus" && shapes.length > 0) {
        const shape = t.params?.shape;
        const v = t.values?.[lv - 1] || 0;
        // 該当形状が今回のターンで出現した回数分ボーナスを適用
        const matchCount = shapes.filter(s => s === shape).length;
        if (matchCount > 0) {
          if (isInstant) {
            // 消した回数分だけ跳ねさせる
            for (let i = 0; i < matchCount; i++) {
              setTimeout(() => triggerPassive(t.instanceId || t.id), i * 150);
            }
          }
          if (shape === "square") {
            // 四方の型: コンボ倍率
            const totalMult = Math.pow(v, matchCount);
            multiplier *= totalMult;
            logData.multipliers.push(`shape_square:mult_x${v}_count_${matchCount}`);
            logData.multiplierSteps.push({ label: t.name || '四方の型', value: totalMult, tokenId: tId });
          } else if (shape === "len5") {
            // 五星の印: 次手操作延長 (重複適用)
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_len5:time_x${v}_count_${matchCount}`);
            // 操作時間延長はコンボ表示には出さないが、跳ねる演出は上記で行っている
          } else if (shape === "cross") {
            // 十字の祈り: 次手操作延長 (重複適用)
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_cross:time_x${v}_count_${matchCount}`);
            // len4 / row / l_shape: すでに PuzzleEngine 内でリアルタイム加算済み
            // ここでの v は集計ロジック用であり、段階的演出（演出データ）には追加しない（リアルタイムで跳ねるため）
            logData.bonuses.push(`shape_${shape}:${v}x${matchCount}(applied)`);
          }
        }
      }

      // Multipliers
      if (t.id === "forbidden") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(t.instanceId || t.id);
        multiplier *= v;
        logData.multipliers.push(`forbidden:${v}`);
        logData.multiplierSteps.push({ label: t.name || '禁忌', value: v, tokenId: tId });
      }
      if (t.action === "forbidden_temp" && engineRef.current?.noSkyfall) {
        if (isInstant) triggerPassive(t.instanceId || t.id);
        multiplier *= 3;
        logData.multipliers.push("forbidden_temp:3");
        logData.multiplierSteps.push({ label: t.name || '禁忌(一時)', value: 3, tokenId: tId });
      }
      enchList.forEach(enc => {
        if (enc.effect === "lvl_mult") {
          multiplier *= lv;
          logData.multipliers.push(`lvl_mult:${lv}`);
        }
        if (enc.effect === "stat_shape_all") {
          const totalShape = (currentRunStats.currentShapeLen4 || 0) +
            (currentRunStats.currentShapeRow || 0) +
            (currentRunStats.currentShapeLShape || 0) +
            (currentRunStats.currentShapeCross || 0) +
            (currentRunStats.currentShapeSquare || 0) +
            (currentRunStats.currentShapeLen5 || 0); // Include len5!
          const b = Math.floor(totalShape / 20) * 1;
          if (b > 0) {
            if (isInstant) triggerPassive(t.instanceId || t.id);
            bonus += b;
            logData.bonuses.push(`stat_shape_all(enc):+${b}`);
            logData.bonusSteps.push({ label: t.name || '万形の極意', value: b, tokenId: tId });
          }
        }
      });

      // Color multiplier
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
          multiplier *= mv;
          logData.multiplierSteps.push({ label: t.name || '色倍率', value: mv, tokenId: tId });
        }
      }

      // Color Drop Count Multiplier
      if (t.effect === "color_count_bonus") {
        const color = t.params?.color;
        const requiredCount = t.params?.count || 0;
        if (color && erasedColorCounts[color] >= requiredCount) {
          const v = t.values?.[lv - 1] || 1;
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`color_count_bonus_${color}_${requiredCount}:${v}`);
          logData.multiplierSteps.push({ label: t.name || `色倍率(${color})`, value: v, tokenId: tId });
        }
      }

      // Shape Variety Multiplier (2+ unique shapes)
      if (t.effect === "shape_variety_mult") {
        const uniqueShapes = new Set(shapes).size;
        if (uniqueShapes >= 2) {
          const v = t.values?.[lv - 1] || 1;
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`shape_variety_mult_${uniqueShapes}:${v}`);
          logData.multiplierSteps.push({ label: t.name || '形状多様性', value: v, tokenId: tId });
        }
      }

      // Giant Domain Multiplier
      if (t.id === "giant") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`giant:${v}`);
        logData.multiplierSteps.push({ label: t.name || '巨人の領域', value: v, tokenId: tId });
      }

      // 背水の陣: 固定倍率
      if (t.effect === "desperate_stance") {
        const v = t.values?.[lv - 1] || 3;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`desperate_stance:${v}`);
        logData.multiplierSteps.push({ label: t.name || '背水の陣', value: v, tokenId: tId });
      }

      // 金満の暴力: スター数に依存した倍率加算
      if (t.effect === "greed_power") {
        const threshold = t.values?.[lv - 1] || 10;
        const greedBonus = Math.floor(stars / threshold);
        if (greedBonus > 0) {
          if (isInstant) triggerPassive(tId);
          multiplier += greedBonus;
          logData.multipliers.push(`greed_power:+${greedBonus}(stars:${stars}/threshold:${threshold})`);
          logData.multiplierSteps.push({ label: t.name || '金満の暴力', value: greedBonus, tokenId: tId });
        }
      }

      // 呪われた力: 固定コンボ加算
      if (t.effect === "cursed_power") {
        const v = t.values?.[lv - 1] || 10;
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`cursed_power:${v}`);
        logData.bonusSteps.push({ label: t.name || '呪われた力', value: v, tokenId: tId });
      }

      // --- 実績参照系パッシブ ---
      if (t.effect === "stat_combo_記憶") {
        const v = t.values?.[lv - 1] || 1;
        const b = Math.floor((currentRunStats.maxCombo || 0) / 5) * v;
        if (b > 0) {
          if (isInstant) triggerPassive(t.instanceId || t.id);
          bonus += b;
          logData.bonuses.push(`stat_combo_記憶:+${b}`);
          logData.bonusSteps.push({ label: t.name || '記憶', value: b, tokenId: tId });
        }
      }
      if (t.effect === "stat_mult_余韻") {
        const v = t.values?.[lv - 1] || 0.1;
        const maxMult = currentRunStats.maxComboMultiplier || 1;
        if (maxMult > 1) {
          const m = 1 + (maxMult * v);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_mult_余韻:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '余韻', value: m, tokenId: tId });
        }
      }
      if (t.effect === "stat_mult_千手") {
        const v = t.values?.[lv - 1] || 1.1;
        const count = Math.floor((currentRunStats.currentTotalCombo || 0) / 100);
        if (count > 0) {
          const m = Math.pow(v, count);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_mult_千手:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '千手', value: m, tokenId: tId });
        }
      }
      // 十字・4連は PuzzleEngine 内でリアルタイム加算済み
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
          const m = Math.pow(Math.pow(v, count), rowCountInTurn);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_shape_row:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '一列の叡智', value: m, tokenId: tId });
        }
      }
      if (t.effect === "stat_shape_square") {
        const v = t.values?.[lv - 1] || 1.5;
        const squareCountInTurn = shapes.filter(s => s === "square").length;
        const count = Math.floor((currentRunStats.currentShapeSquare || 0) / 5);
        if (count > 0 && squareCountInTurn > 0) {
          const m = Math.pow(Math.pow(v, count), squareCountInTurn);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_shape_square:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '四方の叡智', value: m, tokenId: tId });
        }
      }
      if (t.effect === "stat_spend_star") {
        const v = t.values?.[lv - 1] || 1.1;
        const count = Math.floor((currentRunStats.currentStarsSpent || 0) / 50);
        if (count > 0) {
          const m = Math.pow(v, count);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_spend_star:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '富の余韻', value: m, tokenId: tId });
        }
      }

      if (t.effect === 'rainbow_combo_bonus') {
        // Already handled in PuzzleEngine
        logData.bonuses.push(`rainbow:(applied)`);
      }
      if (t.effect === 'heart_combo_bonus') {
        // Already handled in PuzzleEngine
        logData.bonuses.push(`heart_combo:(applied)`);
      }
    });

    // 12. Min Match Multiplier (Dual Match)
    tokens.forEach((t) => {
      if (t?.effect === "min_match") {
        const lv = t.level || 1;
        const v = t.values?.[lv - 1] || 1;
        const tId2 = t.instanceId || t.id;
        if (isInstant) triggerPassive(tId2);
        multiplier *= v;
        logData.multipliers.push(`min_match:${v}`);
        logData.multiplierSteps.push({ label: t.name || 'デュアルマッチ', value: v, tokenId: tId2 });
      }
    });

    // 強化ドロップ overLink 倍率を適用
    if (overLinkMultiplier > 1) {
      multiplier *= overLinkMultiplier;
      logData.multipliers.push(`overlink:${overLinkMultiplier}`);
    }

    // 次手の操作時間倍率を設定（1ならリセット）
    setNextTurnTimeMultiplier(timeMultiplier);

    // アクティブスキル（時限コンボ倍率）Buffの適用
    activeBuffs.forEach(buff => {
      if (buff.action === "temp_mult") {
        multiplier *= buff.params.multiplier;
        logData.multipliers.push(`temp_mult:${buff.params.multiplier}`);
        logData.multiplierSteps.push({ label: 'スキル倍率', value: buff.params.multiplier });
      } else if (buff.action === "seal_of_power") {
        multiplier *= buff.params.multiplier;
        logData.multipliers.push(`seal_of_power:x${buff.params.multiplier}`);
        logData.multiplierSteps.push({ label: '封印の力', value: buff.params.multiplier });
      }
    });

    logData.finalMultiplier = multiplier;
    logData.finalBonus = bonus;
    // setDebugLog(logData);

    // turnCombo（盤面でのマッチ数）が0なら強制的に最終0コンボにする
    const effectiveCombo = (tc > 0) ? Math.min(Math.floor((tc + Number(bonus || 0)) * Number(multiplier || 1)), MAX_COMBO) : 0;

    // --- Update Stats ---
    setCurrentRunTotalCombo(prev => prev + effectiveCombo);

    const currentEnchantCount = isEnchantDisabled ? 0 : tokens.reduce((sum, tok) => sum + (tok?.enchantments?.length || 0), 0);
    const measuredTime = totalMoveTimeRef.current;
    totalMoveTimeRef.current = 0; // 次のターンのためにリセット

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
        maxEnchantsAllTime: Math.max(prev.maxEnchantsAllTime || 0, currentEnchantCount),
        lifetimeTotalMoveTime: (prev.lifetimeTotalMoveTime || 0) + measuredTime,
        lifetimeShapeLen4: (prev.lifetimeShapeLen4 || 0) + countLen4,
        lifetimeShapeCross: (prev.lifetimeShapeCross || 0) + countCross,
        lifetimeShapeRow: (prev.lifetimeShapeRow || 0) + countRow,
        lifetimeShapeLShape: (prev.lifetimeShapeLShape || 0) + countLShape,
        lifetimeShapeSquare: (prev.lifetimeShapeSquare || 0) + countSquare,
      };
    });
    setCurrentRunStats(prev => ({
      ...prev,
      currentTotalCombo: (prev.currentTotalCombo || 0) + effectiveCombo,
      maxCombo: Math.max(prev.maxCombo || 0, effectiveCombo),
      maxComboMultiplier: Math.max(prev.maxComboMultiplier || 1, multiplier),
      maxEnchants: Math.max(prev.maxEnchants || 0, currentEnchantCount),
      currentTotalMoveTime: (prev.currentTotalMoveTime || 0) + measuredTime,
      currentShapeLen4: (prev.currentShapeLen4 || 0) + countLen4,
      currentShapeCross: (prev.currentShapeCross || 0) + countCross,
      currentShapeRow: (prev.currentShapeRow || 0) + countRow,
      currentShapeLShape: (prev.currentShapeLShape || 0) + countLShape,
      currentShapeSquare: (prev.currentShapeSquare || 0) + countSquare,
    }));

    // --- effectiveCombo の段階的演出 ---
    // comboRefを使って、ボーナス加算・倍率適用を盤面上に表示
    const showComboBreakdown = async () => {
      const el = comboRef.current;
      if (!el) return;

      const mode = settings?.comboAnimationMode || 'instant';

      if (mode === 'step' && turnCombo > 0) {
        // --- 段階的演出 ---
        // 現在加算済みコンボ数を表示しながら段階的に積み上げる

        // ステップ1: コンボ加算を1つずつ表示
        let currentVal = tc;
        for (const step of logData.bonusSteps) {
          if (!comboRef.current) break;
          // トークン跳ねるアニメーションをトリガー
          if (step.tokenId) triggerPassive(step.tokenId);
          const stepValue = isNaN(step.value) ? 0 : step.value;
          currentVal = Math.min(currentVal + stepValue, MAX_COMBO);
          const eEl = comboRef.current;
          const sign = stepValue >= 0 ? '+' : '';
          const prevVal = Math.max(0, currentVal - stepValue);
          const safePrevVal = isNaN(prevVal) ? 0 : prevVal;
          eEl.innerHTML = `<span class="combo-number">${safePrevVal.toLocaleString()}</span><span class="combo-bonus-add">${sign}${stepValue.toLocaleString()}<span class="combo-step-label"> ${step.label}</span></span>`;
          eEl.classList.remove('animate-combo-pop');
          void eEl.offsetWidth;
          eEl.classList.add('animate-combo-pop');
          await new Promise(r => setTimeout(r, 900));
        }

        // ステップ2: コンボ倍率を1つずつ表示
        let currentMult = 1;
        for (const step of logData.multiplierSteps) {
          if (!comboRef.current) break;
          // トークン跳ねるアニメーションをトリガー
          if (step.tokenId) triggerPassive(step.tokenId);
          const safeStepValue = isNaN(step.value) ? 1 : step.value;
          const prevVal = isNaN(currentVal) ? 0 : currentVal;
          currentVal = Math.min(Math.floor(prevVal * safeStepValue), MAX_COMBO);
          const eEl = comboRef.current;
          const roundedV = formatNum(safeStepValue);
          eEl.innerHTML = `<span class="combo-number">${prevVal.toLocaleString()}</span><span class="combo-bonus-mult">×${roundedV}<span class="combo-step-label"> ${step.label}</span></span>`;
          eEl.classList.remove('animate-combo-pop');
          void eEl.offsetWidth;
          eEl.classList.add('animate-combo-pop');
          await new Promise(r => setTimeout(r, 900));
        }

        // ステップ3: 最終値をパルス演出で表示
        await new Promise(r => setTimeout(r, 300));
        if (comboRef.current) {
          const safeCombo = isNaN(effectiveCombo) ? 0 : effectiveCombo;
          comboRef.current.innerHTML = `<span class="combo-number combo-number-final">${safeCombo.toLocaleString()}</span><span class="combo-label">COMBO</span>`;
          comboRef.current.classList.remove('animate-combo-pop');
          comboRef.current.classList.add('animate-combo-pulse');
          void comboRef.current.offsetWidth;
        }

      } else {
        // --- 一括演出（従来通り）---

        // ステップ1: 素コンボ → ボーナス加算表示
        if (turnCombo > 0 && bonus > 0) {
          await new Promise(r => setTimeout(r, 400));
          const safeTurnCombo = isNaN(turnCombo) ? 0 : turnCombo;
          const safeBonus = isNaN(bonus) ? 0 : bonus;
          el.innerHTML = `<span class="combo-number">${safeTurnCombo}</span><span class="combo-bonus-add">+${safeBonus}</span>`;
          el.classList.remove('animate-combo-pop');
          void el.offsetWidth;
          el.classList.add('animate-combo-pop');
        }

        // ステップ2: 倍率表示
        if (turnCombo > 0 && multiplier > 1) {
          await new Promise(r => setTimeout(r, 500));
          const baseVal = (isNaN(turnCombo) ? 0 : turnCombo) + (isNaN(bonus) ? 0 : bonus);
          const roundedMultiplier = formatNum(isNaN(multiplier) ? 1 : multiplier);
          el.innerHTML = `<span class="combo-number">${baseVal}</span><span class="combo-bonus-mult">×${roundedMultiplier}</span>`;
          el.classList.remove('animate-combo-pop');
          void el.offsetWidth;
          el.classList.add('animate-combo-pop');
        }

        // ステップ3: 最終値をパルス演出で表示
        if (turnCombo > 0) {
          await new Promise(r => setTimeout(r, 600));
          const safeEffectiveCombo = isNaN(effectiveCombo) ? 0 : effectiveCombo;
          el.innerHTML = `<span class="combo-number combo-number-final">${safeEffectiveCombo}</span><span class="combo-label">COMBO</span>`;
          el.classList.remove('animate-combo-pop');
          el.classList.add('animate-combo-pulse');
          void el.offsetWidth;
        } else if (turnCombo === 0 && effectiveCombo === 0) {
          // 0コンボ時の表示
          await new Promise(r => setTimeout(r, 400));
          el.innerHTML = `<span class="combo-number combo-number-final">0</span><span class="combo-label">COMBO</span>`;
          el.classList.remove('animate-combo-pop');
          el.classList.add('animate-combo-pulse');
          void el.offsetWidth;
        }
      }

      // ターゲットコンボの数値パルス
      await new Promise(r => setTimeout(r, 400));
      setTargetPulse(true);
      setTimeout(() => setTargetPulse(false), 800);

      // 一定時間後にコンボ表示を消す
      setTimeout(() => {
        if (comboRef.current) {
          comboRef.current.classList.remove('animate-combo-pulse');
          comboRef.current.classList.add('animate-fade-out');
          setTimeout(() => {
            if (comboRef.current) comboRef.current.innerHTML = '';
          }, 500);
        }
      }, 1000);
    };

    await showComboBreakdown();

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
    const starThreshold = Math.max(1, 5 - totalReduction);

    // 累積方式に変更
    const currentProgress = starProgress + effectiveCombo;
    let totalStarsEarned = starThreshold > 0 ? Math.floor(currentProgress / starThreshold) : 0;
    const nextProgress = starThreshold > 0 ? currentProgress % starThreshold : 0;

    setStarProgress(nextProgress);

    if (totalStarsEarned > 0) {
      setStars((s) => s + totalStarsEarned);
      notify(`+ ${totalStarsEarned} STARS!`);

      // 黄金の収集者を跳ねさせる
      tokens.forEach(t => {
        if (t && t.id === "collector") {
          triggerPassive(t.instanceId || t.id);
        }
      });
    }

    setCycleTotalCombo(prev => {
      const updated = prev + effectiveCombo;
      if (updated >= target) {
        setGoalReached(prevGoalReached => {
          if (!prevGoalReached) {
            setShopRerollPrice(shopRerollBasePrice);
          }
          return true;
        });
      }
      return updated;
    });

    /* setEnergy((prev) => Math.min(maxEnergy, prev + 2)); // REMOVED */

    // --- Charge Skills ---
    // Zero Combo Charge check
    let zeroComboBonusCharge = 0;
    if (effectiveCombo === 0) {
      tokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        if (t.effect === "zero_combo_charge") {
          const chargeVal = t.values?.[lv - 1] || 0;
          if (chargeVal > 0) {
            triggerPassive(t.instanceId || t.id); // これは0コンボ時なので常に跳ねて良い（演出がないため）
            zeroComboBonusCharge += chargeVal;
          }
        }
      });
    }

    setTokens(prevTokens => {
      return prevTokens.map(t => {
        if (!t || t.type !== 'skill') return t;
        const currentCharge = t.charge || 0;
        const maxCharge = t.cost || 0;
        // Increment charge by 1 per turn, up to max cost

        // --- 変更: 急速チャージ (Quick Charge) ---
        const chargeBoostCount = t.enchantments?.filter(e => e.effect === "charge_boost_passive").length || 0;
        const chargeAmount = 1 + chargeBoostCount + zeroComboBonusCharge;

        const nextCharge = Math.min(maxCharge, currentCharge + chargeAmount);
        return { ...t, charge: nextCharge };
      });
    });

    if (!skipTurnProgressRef.current) {
      setActiveBuffs((prev) =>
        prev
          .map((b) => ({ ...b, duration: b.duration - 1 }))
          .filter((b) => b.duration > 0),
      );
    }

    // setGoalReached(true); // Moved inside setCycleTotalCombo above

    if (!skipTurnProgressRef.current) {
      setTurn((prev) => prev + 1);
    }

    // Reset or persist noSkyfall based on passive tokens
    if (engineRef.current) {
      const hasForbiddenLiteral = tokens.some((t) => t?.id === "forbidden");
      engineRef.current.noSkyfall = hasForbiddenLiteral;
    }

    skipTurnProgressRef.current = false;
  };

  // Keep handleTurnEndRef current
  useEffect(() => {
    handleTurnEndRef.current = handleTurnEnd;
    onPassiveTriggerRef.current = triggerPassive;
    onStarEraseRef.current = (count) => {
      // スタードロップ消去時の即時獲得処理
      // 獲得量の計算（handleTurnEnd内のロジックと同様のボーナスを適用）
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

      // スターブースト効果を持つトークンを跳ねさせる
      effectiveTokens.forEach(t => {
        if (t && t.effect === "star_earn_boost") {
          triggerPassive(t.instanceId || t.id);
        }
      });
    };
  });

  // Sanitize tokens on mount/update to remove nulls if any exist from legacy state
  useEffect(() => {
    if (tokens.some(t => t === null)) {
      setTokens(prev => prev.filter(t => t !== null));
    }
  }, [tokens]);

  // REMOVED: Automatic turn transition watcher
  /*******************************************************
   useEffect(() => {
     // エンドレスモードならターン制限によるゲームオーバー/クリア判定をスキップ
     if (isEndlessMode) return;
  
     if (turn > maxTurns) {
       if (goalReached) {
         handleCycleClear(0);
       } else {
         handleGameOver();
       }
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [turn, goalReached, maxTurns, isEndlessMode]);
  ********************************************************/

  // Also watch for game over state manually handled in render now
  useEffect(() => {
    if (isEndlessMode) return;
    if (turn > maxTurns && !goalReached && !isGameOver) {
      setIsGameOver(true);
    }
  }, [turn, goalReached, maxTurns, isEndlessMode, isGameOver]);

  // 詳細モーダルを開いたとき、並び替え入力欄をそのトークンの現在位置で初期化する
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

  const startNextCycle = () => {
    setTurn(1);
    setCycleTotalCombo(0);
    setTarget((t) => Math.min(Math.floor(t * 1.5) + 2, MAX_TARGET));
    setGoalReached(false);
    setSkippedTurnsBonus(0);
    setStarProgress(0); // Reset progress if needed or keep it? Keeping it feels better but usually resets per cycle

    // Update shop reroll prices
    const nextBase = Math.ceil(shopRerollBasePrice * 1.5);
    setShopRerollBasePrice(nextBase);
    setShopRerollPrice(nextBase);

    generateShop();
    setShowShop(false);

    // エンドレスモードでない場合のみ統計を更新
    if (!isEndlessMode) {
      setStats(prev => {
        const nextCycle = Math.ceil(turn / maxTurns) + 1; // App.jsxでのCycle表示ロジックに合わせる
        return {
          ...prev,
          lifetimeClears: (prev.lifetimeClears || 0) + 1,
          maxCycleAllTime: Math.max(prev.maxCycleAllTime || 0, nextCycle)
        };
      });
      setCurrentRunStats(prev => ({ ...prev, currentClears: (prev.currentClears || 0) + 1 }));
    }

    notify("NEXT CYCLE STARTED!");
  };

  const skipTurns = () => {
    const remainingTurns = maxTurns - turn + 1;
    if (remainingTurns <= 0) return; // Do nothing if already over

    let bonusMultiplier = 3;
    const skipTokens = tokens.filter(t => t?.id === 'skip_master');
    if (skipTokens.length > 0) {
      bonusMultiplier = skipTokens.reduce((acc, t) => acc + (t.values[(t.level || 1) - 1] || 0), 0);
    }

    // --- 熟考の果て ---
    const endOfThoughtTokens = tokens.filter(t => t?.effect === 'stat_time_move');
    if (endOfThoughtTokens.length > 0) {
      const timeBonusPct = endOfThoughtTokens.reduce((acc, t) => {
        const v = t.values[(t.level || 1) - 1] || 0.05;
        const minutes = Math.floor((currentRunStats.currentTotalMoveTime || 0) / 60000);
        return acc + (minutes * v);
      }, 0);
      bonusMultiplier = Math.floor(bonusMultiplier * (1 + timeBonusPct));
    }

    const bonus = remainingTurns * bonusMultiplier;
    setStars((s) => s + bonus);
    notify(`SKIP BONUS: +${bonus} STARS!`);
    setSkippedTurnsBonus(prev => prev + remainingTurns);

    // Force turn to end state to trigger Clear Overlay
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
    /* setEnergy(0); // REMOVED */
    setActiveBuffs([]);
    setSkippedTurnsBonus(0);
    setPendingShopItem(null);
    setGoalReached(false);
    setShowShop(false);
    setShowGameClear(false); // Game Clear画面をリセット
    setIsGameOver(false);
    setIsEndlessMode(false); // Reset endless mode
    setStarProgress(0); // Reset progress
    setTotalPurchases(0);
    setTotalStarsSpent(0);
    setShopItems([]);
    setSavedBoard(null);
    setHasSaveData(false); // 新規ゲーム時はセーブデータなし状態へ
    // 覚醒ショップのリセット（解放フラグは新規ゲーム開始時にリセット）
    setIsEnchantShopUnlocked(false);
    setTokenSlotExpansionCount(0);
    setIsAwakeningLevelUpBought(false);
    generateShop();
    if (engineRef.current) {
      engineRef.current.init(null);
    }
    setStats(prev => {
      const nextStats = { ...prev, lifetimePlays: (prev.lifetimePlays || 0) + 1 };
      // 新規ゲーム開始時、エンドレスでない場合は少なくともCycle 1を記録
      if (!isEndlessMode) {
        nextStats.maxCycleAllTime = Math.max(nextStats.maxCycleAllTime || 0, 1);
      }
      return nextStats;
    });
    setCurrentRunStats(initialCurrentRunStats);
    setCurrentRunStats(prev => ({ ...prev, currentPlays: 1 })); // Plays is always 1 for the current run
    notify("NEW GAME STARTED!");
  };


  const handleEndlessMode = () => {
    setIsGameOver(false);
    setIsEndlessMode(true);
    notify("ENDLESS MODE START!");
  };

  const handleGiveUp = () => {
    setIsGameOver(false);
    resetGame();
  };

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const generateShop = () => {
    const isLuxury = totalPurchases >= 6;

    let saleBonus = 0;
    let enchantGrantBonus = 0;
    let shopExpandBonus = 0;
    tokens.forEach((t) => {
      if (t?.id === "bargain") {
        const value = t.values[(t.level || 1) - 1];
        saleBonus += (value - 1);
      }
      if (t.effect === 'rainbow_combo_bonus') {
        // Already handled in PuzzleEngine
        // This is a shop generation loop, not star calculation.
        // The instruction "Remove redundant end-of-turn calculations for real-time additions"
        // implies this logData push should be removed from here if it's meant for star calculation.
        // However, the instruction also says "Update the calculation loop for these bonuses"
        // and provides this snippet. Given the context, I will keep it as provided in the snippet.
        // It's possible this is for debugging shop generation.
        // logData.bonuses.push(`rainbow:(applied)`); // This line was not in the original code, but in the instruction snippet.
      }
      if (t.effect === 'heart_combo_bonus') {
        // Already handled in PuzzleEngine
        // logData.bonuses.push(`heart_combo:(applied)`); // Same as above.
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

    // Determine target counts
    const upgradeCount = 1;
    const basePassiveCount = 3 + shopExpandBonus;
    const baseActiveCount = 4 + shopExpandBonus;
    const enchantCount = 3;
    const extraEnchantCount = enchantGrantBonus + (isLuxury ? 1 : 0);
    const saleCount = 1 + saleBonus;

    setIsAwakeningLevelUpBought(false);

    // Define rarity probabilities based on cycleCount
    const getRarityProbabilities = (cycle) => {
      if (cycle <= 5) return { 1: 0.60, 2: 0.30, 3: 0.10 };
      if (cycle <= 9) return { 1: 0.40, 2: 0.40, 3: 0.20 };
      return { 1: 0.30, 2: 0.40, 3: 0.30 }; // cycle 10+
    };

    const cycleCount = Math.ceil(turn / maxTurns);
    let probs = getRarityProbabilities(cycleCount);

    let rarityUpCount = 0;
    let rarityDownCount = 0;
    tokens.forEach((t) => {
      if (t?.enchantments) {
        t.enchantments.forEach((enc) => {
          if (enc.effect === "rarity_up") rarityUpCount++;
          if (enc.effect === "rarity_down_combo") rarityDownCount++;
        });
      }
    });

    const adjustProb = (base, upRate, downRate, max) =>
      Math.max(0, Math.min(max, base + upRate * rarityUpCount - downRate * rarityDownCount));

    let p3 = adjustProb(probs[3] || 0, 0.10, 0.10, 1);
    let p2 = adjustProb(probs[2] || 0, 0.10, 0.10, 1 - p3);
    let p1 = Math.max(0, 1 - p2 - p3);

    probs = { 1: p1, 2: p2, 3: p3 };

    const getRarity = () => {
      const rand = Math.random();
      if (rand < probs[1]) return 1;
      if (rand < probs[1] + probs[2]) return 2;
      return 3;
    };

    // Pool setup
    const passivesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "passive" && (t.rarity || 1) === 1),
      2: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 2),
      3: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 3),
    };
    if (passivesPools[2].length === 0) passivesPools[2] = passivesPools[1];
    if (passivesPools[3].length === 0) passivesPools[3] = passivesPools[2];

    const activesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "skill" && (t.rarity || 1) === 1),
      2: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 2),
      3: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 3),
    };
    if (activesPools[2].length === 0) activesPools[2] = activesPools[1];
    if (activesPools[3].length === 0) activesPools[3] = activesPools[2];

    const createTokenItem = (pools) => {
      const rarity = getRarity();
      const pool = pools[rarity];
      const base = pool[Math.floor(Math.random() * pool.length)];
      const item = { ...base, level: 1, charge: base.cost || 0 };
      item.desc = getTokenDescription(item, 1, currentRunStats, tokens, activeBuffs);
      // エンチャント付きでのトークン販売は廃止
      return item;
    };


    // 2. Passives
    const passiveItems = Array.from({ length: basePassiveCount }).map(() => createTokenItem(passivesPools));

    // 3. Enchants（エンチャントショップ専用。常時生成する）
    const enchantItems = [];
    {
      // 基本は常に2種類生成
      for (let i = 0; i < enchantCount; i++) {
        const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        const encDesc = getEnchantDescription(enc.id);
        enchantItems.push({
          ...enc,
          type: "enchant_random",
          name: enc.name,
          originalName: enc.name,
          // 効果説明をdescに直接含める
          desc: encDesc || `所持トークンにランダムに「${enc.name}」を付与する。`,
        });
      }

      // 「魔道の極意」等によるボーナス枠
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

    // 4. Actives
    const activeItems = Array.from({ length: baseActiveCount }).map(() => createTokenItem(activesPools));

    // Apply Sales only to Passives and Actives
    const candidatesForSale = [...passiveItems, ...activeItems];
    const saleIndices = Array.from({ length: candidatesForSale.length }, (_, i) => i);

    for (let i = 0; i < saleCount && saleIndices.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * saleIndices.length);
      const targetIdx = saleIndices.splice(randIdx, 1)[0];
      candidatesForSale[targetIdx].isSale = true;
      candidatesForSale[targetIdx].originalPrice = candidatesForSale[targetIdx].price;
      candidatesForSale[targetIdx].price = Math.floor(candidatesForSale[targetIdx].price / 2);
    }

    // Combine all in required order
    // Order: passive, enchant, active
    const finalItems = [...passiveItems, ...enchantItems, ...activeItems];
    setShopItems(finalItems);
    return finalItems;
  };

  const buyItem = (item) => {
    if (stars < item.price) return notify("★が足りません");

    // 永続強化: 時の砂
    if (item.id === "time_ext") {
      setSandsOfTimeSeconds(prev => prev + 2);
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      return notify("操作時間が2秒延長されました！");
    }

    if (item.type === "upgrade_random") {
      // Filter only tokens that are not max level (Max Lv 3) and not copy tokens
      const upgradeableTokens = tokens.filter(t => (t.level || 1) < 3 && t.effect !== 'copy_left');

      if (upgradeableTokens.length === 0) return notify("強化可能なトークンがありません");

      // Randomly select one from upgradeable tokens
      const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];
      // Find index in original array to update
      const targetIdx = tokens.findIndex(t => t.instanceId === targetToken.instanceId);

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
      notify(`${targetToken.name} が強化されました! (Lv${(targetToken.level || 1) + 1})`);

    } else if (item.type === "enchant_random") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), { id: item.id, effect: item.effect, name: item.originalName, params: item.params }],
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify(`${targetToken.name} に「${item.originalName}」を付与!`);

    } else if (item.type === "enchant_grant") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), { id: item.id, effect: item.effect, name: item.name, params: item.params }],
        };
        return next;
      });
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify("購入完了!");
    } else {
      // Normal Token Purchase
      const isActive = item.type === 'skill';
      const activeCount = tokens.filter(t => t?.type === 'skill').length;
      const passiveCount = tokens.filter(t => t && t?.type !== 'skill').length;
      const maxSlots = 5 + tokenSlotExpansionCount;
      if (isActive && activeCount >= maxSlots) return notify(`アクティブスキルは${maxSlots}個までです`);
      if (!isActive && passiveCount >= maxSlots) return notify(`パッシブアイテムは${maxSlots}個までです`);

      const existingIdx = tokens.findIndex((t) => t?.id === item.id);
      if (existingIdx !== -1) {
        // Double check if max level (Use values.length as reference, default to 3)
        const maxLv = tokens[existingIdx].values?.length || 3;
        if ((tokens[existingIdx].level || 1) >= maxLv) {
          return notify(`これ以上強化できません (Max Lv${maxLv})`);
        }
        setPendingShopItem(item);
      } else {
        setTokens((prev) => [
          ...prev,
          { ...item, instanceId: Date.now() + Math.random() } // Add unique instance ID
        ]);
        setStars((s) => s - item.price);
        setTotalPurchases((p) => p + 1);
        setTotalStarsSpent((prev) => prev + item.price);
        setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
        setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
        setShopItems((prev) => prev.filter((i) => i !== item));
        notify("購入完了!");
      }
    }
  };

  // --- \u899a\u9192\u30b7\u30e7\u30c3\u30d7\u306e\u8cfc\u5165\u51e6\u7406 ---
  const AWAKENING_TOKEN_SLOT_BASE_PRICE = 100; // \u30c8\u30fc\u30af\u30f3\u67a0\u62e1\u5f35\u306e\u521d\u671f\u4fa1\u683c
  const AWAKENING_TOKEN_SLOT_PRICE_STEP = 50;  // \u8cfc\u5165\u3054\u3068\u306b\u4e0a\u6607\u3059\u308b\u91d1\u984d

  const getTokenSlotExpandPrice = () =>
    AWAKENING_TOKEN_SLOT_BASE_PRICE + tokenSlotExpansionCount * AWAKENING_TOKEN_SLOT_PRICE_STEP;

  const buyAwakeningItem = (type) => {
    switch (type) {
      case 'random_levelup': {
        const price = 5;
        if (stars < price) return notify('\u2605\u304c\u8db3\u308a\u307e\u305b\u3093');
        const upgradeableTokens = tokens.filter(t => (t?.level || 1) < 3);
        if (upgradeableTokens.length === 0) return notify('\u5f37\u5316\u53ef\u80fd\u306a\u30c8\u30fc\u30af\u30f3\u304c\u3042\u308a\u307e\u305b\u3093 (Max Lv3)');
        const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];
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
        notify(`${targetToken.name} \u304c\u5f37\u5316\u3055\u308c\u307e\u3057\u305f! (Lv${(targetToken.level || 1) + 1})`);
        break;
      }
      case 'unlock_enchant_shop': {
        const price = 10;
        if (stars < price) return notify('\u2605\u304c\u8db3\u308a\u307e\u305b\u3093');
        if (isEnchantShopUnlocked) return notify('\u30a8\u30f3\u30c1\u30e3\u30f3\u30c8\u30b7\u30e7\u30c3\u30d7\u306f\u3059\u3067\u306b\u89e3\u653e\u6e08\u307f\u3067\u3059');
        setIsEnchantShopUnlocked(true);
        setStars(s => s - price);
        notify('\u30a8\u30f3\u30c1\u30e3\u30f3\u30c8\u30b7\u30e7\u30c3\u30d7\u304c\u89e3\u653e\u3055\u308c\u307e\u3057\u305f!');
        break;
      }
      case 'expand_token_slots': {
        const price = getTokenSlotExpandPrice();
        if (stars < price) return notify('\u2605\u304c\u8db3\u308a\u307e\u305b\u3093');
        setTokenSlotExpansionCount(prev => prev + 1);
        setStars(s => s - price);
        notify(`\u30c8\u30fc\u30af\u30f3\u67a0\u304c ${5 + tokenSlotExpansionCount + 1} / ${5 + tokenSlotExpansionCount + 1} \u306b\u62e1\u5f35\u3055\u308c\u307e\u3057\u305f!`);
        break;
      }
      default:
        break;
    }
  };

  const handleChoice = (choice) => {
    if (!pendingShopItem) return;
    const item = pendingShopItem;

    if (choice === "upgrade") {
      setTokens((prev) => {
        const next = [...prev];
        const idx = next.findIndex((t) => t?.id === item.id);
        if (idx !== -1) {
          const currentLevel = next[idx].level || 1;
          if (currentLevel >= 3) {
            // Should verify in UI but safe check here
            return next;
          }
          const nextLevel = currentLevel + 1;
          next[idx] = {
            ...next[idx],
            level: nextLevel,
            desc: getTokenDescription(next[idx], nextLevel, currentRunStats, next, activeBuffs)
          };
        }
        return next;
      });
      notify(`${item.name} を強化しました!`);
    } else {

      // "Equip Second" logic - check limits again
      const isActive = item.type === 'skill';
      const activeCount = tokens.filter(t => t.type === 'skill').length;
      const passiveCount = tokens.filter(t => t.type !== 'skill').length;

      if ((isActive && activeCount >= 5) || (!isActive && passiveCount >= 5)) {
        notify("スロットがいっぱいです。代わりに強化します。");
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
          }
          return next;
        });
      } else {
        setTokens((prev) => [
          ...prev,
          { ...item, instanceId: Date.now() + Math.random() }
        ]);
        notify("2つ目のトークンを装備しました。");
      }
    }

    setStars((s) => s - item.price);
    setTotalPurchases((p) => p + 1);
    setTotalStarsSpent((prev) => prev + item.price);
    setShopItems((prev) => prev.filter((i) => i !== item));
    setPendingShopItem(null);
  };

  const activateSkill = (token) => {
    if (!token || token.type !== "skill") return;

    // オーバーレイ表示時はスキル発動不可
    if (isGameOver) return notify("ゲームオーバー時は使用できません");
    if (turn > maxTurns && goalReached) return notify("クリア時は使用できません");
    if (showShop) return notify("ショップ画面では使用できません");

    // Check individual charge
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

    console.log("Using skill:", token);

    // --- 効果時間延長パッシブの計算 ---
    let extraDuration = 0;
    // calculateComboと同様、この時点でのtokens（またはリファクタリング後のeffectiveTokens相当）から取得
    tokens.forEach((t, index) => {
      if (!t) return;
      // コピートークンも考慮
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
      default:
        break;
    }

    // --- 追加: Lv3以上なら基礎コンボ値プラス効果 (Next Turn Bonus) ---
    // アクティブスキルをレベル3にすると基礎コンボ値プラスの効果がつく
    // 値は「基礎コンボ値プラスはレベル１時点でのエネルギー数分増やす」
    if ((token.level || 1) >= 3) {
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

    // Consume Charge
    setTokens(prev => prev.map(t => {
      if (t === token) {
        return { ...t, charge: 0 };
      }
      return t;
    }));
    /* setEnergy((prev) => prev - (token.cost || 0)); // REMOVED */
    notify(`${token.name} 発動!`);
  };

  const sellToken = (token) => {
    if (!token) return;

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

    setTokens(prev => prev.filter(t => t.instanceId !== token.instanceId));

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

    setSelectedTokenDetail(null);
    notify(`${token.name} を ${targetPos} 番目に移動しました`);
  };

  const openShop = () => {
    if (shopItems.length === 0) {
      generateShop();
    }
    setShowShop(true);
  };

  const refreshShop = () => {
    if (stars < shopRerollPrice) return notify("★が足りません");
    setStars(s => s - shopRerollPrice);
    setTotalStarsSpent((prev) => prev + shopRerollPrice);
    setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + shopRerollPrice }));
    setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + shopRerollPrice }));
    setShopRerollPrice(prev => Math.ceil(prev * 1.5));
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
        stats={stats}
        currentRunStats={currentRunStats}
        isActiveGame={!showTitle}
        onClose={() => setShowStats(false)}
      />
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
          setShowTitle(false);
        }}
        onHelp={() => setShowHelp(true)}
        onStats={() => setShowStats(true)}
        onCredits={() => setShowCredits(true)}
        onSettings={() => setShowSettings(true)}
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
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full flex flex-col relative bg-background-dark shadow-2xl overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* --- Top Area Swipe Handler --- */}
        <div
          className="flex-none flex flex-col relative z-30"
          onTouchStart={(e) => {
            // パズル盤面など必要な部分に影響しないように、画面上部のコンテナにのみ適用
            timerRef.current && (timerRef.current._swipeStartX = e.touches[0].clientX);
            timerRef.current && (timerRef.current._swipeStartY = e.touches[0].clientY);
            timerRef.current && (timerRef.current._swipeStartTime = Date.now());
          }}
          onTouchEnd={(e) => {
            if (!timerRef.current || !timerRef.current._swipeStartX) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - timerRef.current._swipeStartX;
            const dy = touchEndY - timerRef.current._swipeStartY;
            const dt = Date.now() - timerRef.current._swipeStartTime;

            // X方向（右）への移動量が十分大きく、Y方向のズレが少なく、短時間でのフリック判定
            // ※ shop画面を開くのは条件満たしている、かつ現在開いていない場合のみ（openShop内にロジックあり）
            if (dx < -50 && Math.abs(dy) < 50 && dt < 300) { // 右から左（左フリック）で開く？いや、「右フリックでショップ画面に」
              // ...要求は「画面上部を右フリックでショップ画面に」
              // dx > 50 が右フリック
            }
            if (dx > 50 && Math.abs(dy) < 50 && dt < 300) {
              openShop();
            }
            timerRef.current._swipeStartX = null;
          }}
        >
          {/* Top Status Bar */}
          <header className="relative z-10 px-4 pt-6 pb-2 flex justify-between items-center glass-panel border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Current Stage</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Cycle {Math.ceil(turn / maxTurns)}</span>
                <span className="text-primary font-bold">/</span>
                <span className="text-lg font-bold text-white">Turn {turn}{isEndlessMode ? ' (∞)' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded-full border border-white/10">
                <span className="material-icons-round text-yellow-400 text-sm">star</span>
                <span className="font-bold text-sm tracking-wide">{stars.toLocaleString()}</span>
              </div>
              <button
                onClick={openShop}
                className="flex items-center gap-1 bg-slate-800/50 hover:bg-slate-700/50 px-3 py-1 rounded-full border border-white/10 cursor-pointer active:scale-95 transition-all text-sm font-bold text-white"
              >
                <span className="material-icons-round text-primary text-sm">storefront</span>
                <span>Shop</span>
              </button>
            </div>
          </header>

          {/* Main Stats Area */}
          <section className="relative z-10 px-6 py-3 flex-none">
            <div className="flex justify-between items-center">
              {/* Target Combo テキスト表示 */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-primary">
                  <span className="material-icons-round text-xl">whatshot</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Target Combo</span>
                  <span
                    ref={targetComboRef}
                    className={`text-xl font-mono font-bold text-white inline-block ${targetPulse ? 'animate-target-pulse' : ''}`}
                  >
                    {cycleTotalCombo}<span className="text-slate-500 text-lg">/{target}</span>
                  </span>
                </div>
              </div>
              {/* 操作時間テキスト */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-primary">
                  <span className="material-icons-round text-xl">timer</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Move Time</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {Math.round((getTimeLimit() / 1000) * 100) / 100}<span className="text-xs text-slate-500 ml-0.5">s</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

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
              <section className="relative z-30 px-6 py-2 flex-none mb-4 flex flex-col gap-2">

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
                            let borderColor = isLocked ? 'border-slate-800' : (t ? (t.rarity === 3 ? 'border-yellow-400/60' : t.rarity === 2 ? 'border-sky-400/60' : 'border-white/20') : 'border-white/5');
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
                                case 'combo_if_exact':
                                  conditionMet = lastTurnCombo === (t.params?.combo || 0);
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
                                className={`aspect-square rounded-xl relative border transition-all duration-300 ${animClass} ${shadowClass} ${isLocked ? 'bg-slate-950/50 border-slate-800 opacity-40 cursor-not-allowed' : (t ? `bg-slate-800 ${borderColor} cursor-pointer hover:bg-white/5 hover:scale-105` : 'bg-slate-900/30 border-white/5 border-dashed')}`}
                              >
                                {isLocked ? (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-icons-round text-slate-700 text-lg">lock</span>
                                  </div>
                                ) : t ? (
                                  <>
                                    <div className="absolute inset-0 rounded-xl overflow-hidden flex items-center justify-center">
                                      <span className={`material-icons-round text-2xl relative z-10 ${animClass ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : shadowClass ? 'text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-slate-400'}`}>
                                        auto_awesome
                                      </span>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20">
                                      {t.level || 1}
                                    </div>
                                  </>
                                ) : null}
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
                            const readyBorder = t && t.rarity === 3 ? 'border-yellow-400/60 shadow-[0_0_10px_rgba(250,204,21,0.25)]' : t && t.rarity === 2 ? 'border-sky-400/60 shadow-[0_0_10px_rgba(56,189,248,0.25)]' : 'border-primary/50 shadow-[0_0_10px_rgba(91,19,236,0.25)]';
                            const notReadyBorder = t && t.rarity === 3 ? 'border-yellow-400/30' : t && t.rarity === 2 ? 'border-sky-400/30' : 'border-white/10';
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
                                className={`aspect-square rounded-xl relative border transition-all duration-300 ${containerClasses}`}
                              >
                                {isLocked ? (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-icons-round text-slate-700 text-lg">lock</span>
                                  </div>
                                ) : t ? (
                                  <>
                                    <div className="absolute inset-0 rounded-xl overflow-hidden flex items-center justify-center">
                                      <div className="absolute inset-0 bg-primary/10">
                                        {isSkill && <div className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-500" style={{ height: `${progress}%` }}></div>}
                                        {stackCount > 0 && activeBuff && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/60 to-blue-400/30 transition-all duration-500" style={{ height: `${buffProgress}%` }}></div>}
                                      </div>
                                      <span className={`material-icons-round text-2xl drop-shadow-md relative z-10 ${animClass ? 'text-white' : stackCount > 0 ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : isReady ? 'text-primary' : 'text-slate-500'}`}>
                                        sports_martial_arts
                                      </span>
                                    </div>
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
                                      <div className="absolute top-[8px] left-1 bg-cyan-600/80 text-white rounded-sm px-0.5 flex items-center justify-center text-[8px] font-black z-20 shadow-sm border border-white/10">
                                        x{stackCount}
                                      </div>
                                    )}
                                  </>
                                ) : null}
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
              </section>
            );
          })()}



          {/* 操作時間ゲージ（トークンの下） */}
          <div className="relative z-30 px-6 mb-2">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
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
                    <h2 className="text-4xl text-yellow-400 font-black mb-2 tracking-widest font-display italic drop-shadow-glow w-full">CLEARED!</h2>
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
                      <button
                        onClick={startNextCycle}
                        className="bg-gradient-to-r from-primary to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 w-full animate-pulse-slow"
                      >
                        <span>次のエリアへ</span>
                        <span className="material-icons-round">arrow_forward</span>
                      </button>
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

              {/* Touch Guide hint */}
              <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-50">
                <span className="text-[10px] text-white uppercase tracking-widest">Drag to connect</span>
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
                    setShowTitle(true);
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
          {(showGameClear || (turn > maxTurns && goalReached && target >= MAX_TARGET)) && (
            <div className="absolute inset-0 z-[1100] bg-slate-950/98 backdrop-blur-xl animate-fade-in flex flex-col items-center justify-start overflow-y-auto custom-scrollbar pt-12 pb-24 px-6 select-none shadow-2xl">
              <div className="flex flex-col items-center mb-10 mt-4 shrink-0">
                <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mb-6 border border-yellow-400/30 shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                  <span className="material-icons-round text-6xl text-yellow-400 drop-shadow-glow animate-pulse-slow">emoji_events</span>
                </div>
                <h1 className="text-5xl text-yellow-400 font-black tracking-widest font-display italic drop-shadow-glow text-center">GAME CLEARED!</h1>
                <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Max Target Reached</p>
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
                    <span className="text-3xl text-white font-black font-mono tracking-tighter drop-shadow-sm">{cycleTotalCombo.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-bold">Target Reached</span>
                    <span className="text-sm text-slate-300 font-mono font-bold">MAX ({MAX_TARGET.toLocaleString()})</span>
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
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isSkill ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600/30' : 'bg-purple-600/20 text-purple-400 border border-purple-500/20 group-hover:bg-purple-600/30'}`}>
                        <span className="material-icons-round text-3xl">
                          {isSkill ? 'sports_martial_arts' : 'auto_awesome'}
                        </span>
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
                <button
                  onClick={() => {
                    setShowGameClear(false);
                    startNextCycle();
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-5 rounded-3xl font-black shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.4)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 w-full"
                >
                  <span className="material-icons-round">all_inclusive</span>
                  <span className="font-display italic tracking-widest text-lg">Continue Playing</span>
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
                    <button onClick={() => handleChoice("upgrade")} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg shadow-primary/25">
                      強化 (Lv UP)
                    </button>
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
                <div className="fixed inset-0 z-[350] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedTokenDetail(null)}>
                  <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border border-primary/30 shadow-[0_0_40px_rgba(91,19,236,0.15)]" onClick={e => e.stopPropagation()}>
                    {/* ヘッダー */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSkill ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-purple-500/20 border border-purple-500/30'}`}>
                        <span className={`material-icons-round text-2xl ${isSkill ? 'text-blue-400' : 'text-purple-400'}`}>
                          {isSkill ? 'sports_martial_arts' : 'auto_awesome'}
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
                      </div>
                    </div>

                    {/* 効果説明 */}
                    <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                      <p className="text-xs text-slate-300 leading-relaxed">{getTokenDescription(t, lv, currentRunStats, tokens, activeBuffs)}</p>
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
                      <button
                        onClick={() => sellToken(t)}
                        className="w-full text-center bg-red-600/20 hover:bg-red-600/40 text-red-300 py-3 rounded-lg font-bold transition-colors"
                      >
                        売却 (+{Math.floor(t.price * (t.enchantments?.some(e => e.effect === "high_sell") ? 3.0 : 0.5))} ★)
                      </button>
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

          {/* Premium Notification Toast */}
          {
            message && (
              <div className="premium-toast">
                <div className="premium-toast-glow"></div>
                <div className="premium-toast-inner">
                  <span className="material-icons-round text-primary text-xl">info</span>
                  <div className="premium-toast-text">{message}</div>
                </div>
              </div>
            )
          }

        </div >

      </div >
    </div>
  );
};

export { PuzzleEngine, ALL_TOKEN_BASES };
export default App;
