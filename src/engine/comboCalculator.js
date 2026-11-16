/**
 * 1手番のコンボ計算（handleTurnEnd から切り出し）。
 *
 * 計算そのものは入力だけで決まる。盤面操作・通知・state 更新などの副作用は
 * すべて `fx` 経由で呼ぶので、ゲーム本体は実物を、テストやバランスシミュレータは
 * 記録用（createRecordingFx）や何もしない fx を渡せる。
 *
 * `rng` は確率判定に使う乱数（既定は Math.random）。テストでは固定値を渡す。
 *
 * 戻り値の `steps` は logData の bonusSteps / multiplierSteps を1本にまとめたもの
 * （内訳パネル・シミュレータ用）。
 */
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { applyTitleTokenBoosts, calcTitleTurnEffects } from './titleEffects.js';
import { ENCHANTMENTS } from '../constants/enchantments.js';
import { MAX_COMBO, INITIAL_TOKEN_SLOTS } from '../constants/gameConstants.js';

export const FX_METHODS = [
  'triggerPassive',
  'notify',
  'addTokenToast',
  'getAnimDelay',
  'setTimeout',
  'setCurrentRunStats',
  'setFreeRerolls',
  'setLastErasedColorCounts',
  'setLastTurnCombo',
  'setNextTurnTimeMultiplier',
  'setTokens',
];

const noop = () => {};

/** 副作用を何もしない fx。engineRef は盤面なし扱い。getAnimDelay は値をそのまま返す。 */
export function createNoopFx() {
  const fx = { engineRef: { current: null } };
  FX_METHODS.forEach(n => { fx[n] = noop; });
  fx.getAnimDelay = (ms) => ms;
  return fx;
}

/** 呼ばれた副作用を順番に記録する fx（テスト用）。setTimeout のコールバックは実行しない。 */
export function createRecordingFx() {
  const calls = [];
  const fx = { engineRef: { current: null }, calls };
  FX_METHODS.forEach(n => {
    fx[n] = (...args) => { calls.push({ name: n, args }); };
  });
  fx.getAnimDelay = (ms) => { calls.push({ name: 'getAnimDelay', args: [ms] }); return ms; };
  return fx;
}

/** logData の加算・倍率の内訳を、出現順を保ったまま1本の配列にする。 */
export function buildSteps(logData) {
  const bonusSteps = (logData.bonusSteps || []).map(s => ({ ...s, kind: 'bonus' }));
  const multiplierSteps = (logData.multiplierSteps || []).map(s => ({ ...s, kind: 'multiplier' }));
  return [...bonusSteps, ...multiplierSteps];
}

export function calcTurnResult(input, fx = createNoopFx()) {
  const {
    turnCombo,
    colorComboCounts,
    erasedColorCounts,
    finalErasedColorCounts,
    hasSkyfallCombo,
    shapes = [],
    overLinkMultiplier = 1,
    erasedByBombTotal = 0,
    erasedByRepeatTotal = 0,
    erasedByStarTotal = 0,
    isAllClear = false,
    extraStats = {},
    detailedShapes = [],
    remainingTimeMs = 0,
    tokens: rawTokens,
    activeBuffs = [],
    currentRunStats,
    hasSaintToken = false,
    isBeyondMode = false,
    maxTurns,
    settings,
    skippedTurnsBonus = 0,
    stars,
    tokenSlotExpansionCount = 0,
    turn,
    getStatByCondition = () => 0,
    probabilityTriggeredThisTurn = false,
    probabilityTriggeredTotalCount = 0,
    rng = Math.random,
    titleEffects = [],
  } = input;


  // 二つ名（増幅の・超越の極意・全能力覚醒）でトークンの値を変えてから計算する
  const tokens = applyTitleTokenBoosts(rawTokens, titleEffects);
  const { bombSelfErased = 0, repeatSelfErased = 0, starSelfErased = 0, rainbowSelfErased = 0 } = extraStats;
  let tc = Number(turnCombo) || 0;

  const isCurseHeartActive = tokens.some(t => t?.id === "curse_heart") && !hasSaintToken;
  if (isCurseHeartActive) {
    const heartMatches = colorComboCounts["heart"] || 0;
    tc = Math.max(0, tc - heartMatches);
  }

  fx.setLastTurnCombo(tc);
  fx.setLastErasedColorCounts(finalErasedColorCounts);

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
  if (fx.engineRef.current && fx.engineRef.current.state) {
    fx.engineRef.current.state.forEach(row => {
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
        if (isInstant) fx.triggerPassive(tokenId);
        const v = val || 10;
        bonus += v;
        logData.bonuses.push(`opener:+${v}`);
        logData.bonusSteps.push({ label: tokenName || '先制の心得', value: v, tokenId });
      }
      if (effect === "double_edged") {
        if (isInstant) fx.triggerPassive(tokenId);
        const v = val || 4.0;
        addedMultiplier += v;
        logData.multipliers.push(`double_edged:+${v.toFixed(1)}`);
        logData.multiplierSteps.push({ label: tokenName || '諸刃の刻印', value: 1.0 + v, addedValue: v, type: 'add', tokenId });
      }
      if (effect === "double_combo_chance") {
        const prob = val || 0.05;
        if (rng() < prob) {
          if (isInstant) fx.triggerPassive(tokenId);
          multMultiplier *= 2.0;
          logData.multipliers.push(`double_combo_chance:x2.0`);
          logData.multiplierSteps.push({ label: tokenName || '強撃の刻印', value: 2.0, type: 'mult', tokenId });
          fx.notify("強撃の刻印発動！基礎コンボ数が2倍になった！");
        }
      }
      if (effect === "last_turn_mult" && turn === maxTurns) {
        if (isInstant) fx.triggerPassive(tokenId);
        const v = val || 4.0;
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`clutch:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: tokenName || '土壇場の底力', value: v, addedValue: v - 1.0, type: 'add', tokenId });
      }
      if (effect === "multi_color" && matchedColorSet.size >= 4) {
        if (isInstant) fx.triggerPassive(tokenId);
        const v = val || 7;
        bonus += v;
        logData.bonuses.push(`rainbow:+${v}`);
        logData.bonusSteps.push({ label: tokenName || '虹色の加護', value: v, tokenId });
      }
      if (effect === "single_color" && matchedColorSet.size > 0 && matchedColorSet.size <= 2) {
        if (isInstant) fx.triggerPassive(tokenId);
        const v = val || 3.0;
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`sniper:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: tokenName || '一点突破', value: v, addedValue: v - 1.0, type: 'add', tokenId });
      }
      if (effect === "vertical_slash") {
        const colCount = shapes.filter(s => s === "column").length;
        if (colCount > 0) {
          if (isInstant) fx.triggerPassive(tokenId);
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
        if (isInstant) fx.triggerPassive(tokenId);
        const rand = Math.floor(rng() * 21) - 5;
        bonus += rand;
        logData.bonuses.push(`gamble:${rand > 0 ? '+' : ''}${rand}`);
        if (rand !== 0) logData.bonusSteps.push({ label: tokenName || '運命の悪戯', value: rand, tokenId });
      }
      if (effect === "berserk_mode") {
        if (isInstant) fx.triggerPassive(tokenId);
        const v = val || 4.0;
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`berserk:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: tokenName || '狂戦士', value: v, addedValue: v - 1.0, type: 'add', tokenId });
      }
      if (effect === "skyfall_mult" && hasSkyfallCombo) {
        if (isInstant) fx.triggerPassive(tokenId);
        const v = val || 4.0;
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`aftershock:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: tokenName || '追撃', value: v, addedValue: v - 1.0, type: 'add', tokenId });
      }
      if (effect === "critical_strike") {
        if (rng() < 0.2) {
          addedMultiplier += (val - 1.0);
          logData.multipliers.push(`CRITICAL!:+${(val - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: tokenName || '会心の一撃!', value: val, addedValue: val - 1.0, type: 'add', tokenId });
          fx.notify("会心の一撃！");
        }
      }
      if (effect === "color_multiplier_enc") {
        const color = params?.color;
        if (color && matchedColorSet.has(color)) {
          if (isInstant) fx.triggerPassive(tokenId);
          const v = val || 3.0;
          addedMultiplier += (v - 1.0);
          logData.multipliers.push(`color_enc_${color}:+${(v - 1.0).toFixed(2)}`);
          logData.multiplierSteps.push({ label: tokenName || `色別連舞(${color})`, value: v, addedValue: v - 1.0, type: 'add', tokenId });
        }
      }
      if (effect === "acrobat") {
        if (colorComboCounts['heart'] >= 2) {
          if (isInstant) fx.triggerPassive(tokenId);
          multMultiplier *= 7.0;
          logData.multipliers.push(`acrobat:x7.0`);
          logData.multiplierSteps.push({ label: tokenName || '曲芸師', value: 7.0, type: 'mult', tokenId });
        }
      }
      if (effect === "color_combo_multiplier") {
        const color = params?.color;
        if (color && colorComboCounts[color] >= 2) {
          if (isInstant) fx.triggerPassive(tokenId);
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
          if (isInstant) fx.triggerPassive(tokenId);
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
          if (isInstant) fx.triggerPassive(tokenId);
          baseMultiplier *= val;
          logData.multipliers.push(`noble_cross:x${val}`);
          logData.multiplierSteps.push({ label: tokenName || '孤高の十字架', value: val, type: 'mult', tokenId });
        }
      }
      if (effect === "quad_frenzy") {
        const len4Count = shapes.filter(s => s === "len4").length;
        if (len4Count >= 3) {
          if (isInstant) fx.triggerPassive(tokenId);
          multMultiplier *= val;
          logData.multipliers.push(`quad_frenzy:x${val}`);
          logData.multiplierSteps.push({ label: tokenName || '四連の狂騒', value: val, type: 'mult', tokenId });
        }
      }
      if (effect === "stardust_cross") {
        const crossCount = shapes.filter(s => s === "cross").length;
        if (crossCount > 0 && fx.engineRef.current) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || '星屑の十字陣'}発動！スタードロップを${val}個生成！`);
          fx.setTimeout(() => {
            if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
              fx.engineRef.current.spawnStarRandom(val);
            }
          }, 300);
        }
      }
      if (effect === "alchemy_square") {
        const squareCount = shapes.filter(s => s === "square").length;
        if (squareCount > 0 && fx.engineRef.current) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || '錬金の方陣'}発動！強化ドロップを${val}個生成！`);
          fx.setTimeout(() => {
            if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
              fx.engineRef.current.enhanceRandomOrbs(val);
            }
          }, 300);
        }
      }
      if (effect === "magic_l_shape") {
        const lCount = shapes.filter(s => s === "l_shape").length;
        if (lCount >= 2) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || '魔導のL字'}発動！全アクティブエネルギー+${val}！`);
          fx.setTokens(prev => prev.map(tok => {
            if (!tok || tok.type !== 'skill') return tok;
            const newCharge = Math.min(tok.cost || 0, (tok.charge || 0) + val);
            return { ...tok, charge: newCharge };
          }));
        }
      }
      if (effect === "eroding_row") {
        if (extraStats && extraStats.erasedRowInfos && extraStats.erasedRowInfos.length > 0 && fx.engineRef.current) {
          let triggered = false;
          extraStats.erasedRowInfos.forEach(info => {
            if (info && info.type) {
              if (!triggered) {
                if (isInstant) fx.triggerPassive(tokenId);
                fx.notify(`${tokenName || '侵食の横一陣'}発動！`);
                triggered = true;
              }
              fx.setTimeout(() => {
                if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
                  fx.engineRef.current.convertRowNeighbors(info.r, info.type, val);
                }
              }, 300);
            }
          });
        }
      }
      if (effect === "sky_god") {
        const totalTokens = tokens.filter(tok => tok).length;
        if (totalTokens <= 10) {
          if (isInstant) fx.triggerPassive(tokenId);
          multMultiplier *= 4.0;
          logData.multipliers.push(`sky_god:x4.0`);
          logData.multiplierSteps.push({ label: tokenName || '空の神', value: 4.0, type: 'mult', tokenId });
        }
      }
      // --- 特殊形状（L字・十字・正方形・列・4個・5個消し）の即時効果 ---
      if (effect === "shape_double_l_mult") {
        const lCount = shapes.filter(s => s === "l_shape").length;
        if (lCount >= 2) {
          if (isInstant) fx.triggerPassive(tokenId);
          baseMultiplier *= val;
          logData.multipliers.push(`double_l_mult:x${val}`);
          logData.multiplierSteps.push({ label: tokenName || "L字の共鳴", value: val, type: 'mult', tokenId });
        }
      }
      if (effect === "l_shape_repeat") {
        const lCount = shapes.filter(s => s === "l_shape").length;
        if (lCount > 0 && fx.engineRef.current) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || "L字の輪廻"}発動！リピートドロップを${val}個生成！`);
          fx.setTimeout(() => {
            if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
              fx.engineRef.current.spawnRepeatRandom(val);
            }
          }, 300);
        }
      }
      if (effect === "l_shape_skill_max") {
        const lCount = shapes.filter(s => s === "l_shape").length;
        if (lCount > 0 && rng() < val) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.setTokens(prev => {
            const skills = prev.filter(tok => tok && tok.type === 'skill');
            if (skills.length === 0) return prev;
            const targetSkill = skills[Math.floor(rng() * skills.length)];
            fx.notify(`${tokenName || "L字の脈動"}発動！「${targetSkill.name}」のエネルギーがMAXになった！`);
            return prev.map(tok => {
              if (tok && tok.instanceId === targetSkill.instanceId) {
                return { ...tok, charge: tok.cost || 0 };
              }
              return tok;
            });
          });
        }
      }
      if (effect === "l_cross_mult") {
        const hasL = shapes.includes("l_shape");
        const hasCross = shapes.includes("cross");
        if (hasL && hasCross) {
          if (isInstant) fx.triggerPassive(tokenId);
          baseMultiplier *= val;
          logData.multipliers.push(`l_cross_mult:x${val}`);
          logData.multiplierSteps.push({ label: tokenName || "交差する秘技", value: val, type: 'mult', tokenId });
        }
      }
      if (effect === "shape_double_cross_mult") {
        const crossCount = shapes.filter(s => s === "cross").length;
        if (crossCount >= 2) {
          if (isInstant) fx.triggerPassive(tokenId);
          baseMultiplier *= val;
          logData.multipliers.push(`double_cross_mult:x${val}`);
          logData.multiplierSteps.push({ label: tokenName || "十字の結界", value: val, type: 'mult', tokenId });
        }
      }
      if (effect === "cross_multiply_move_drop") {
        const crossCount = shapes.filter(s => s === "cross").length;
        if (crossCount > 0 && fx.engineRef.current) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || "十字の加速"}発動！ムーブドロップのカウントを${val}倍にする！`);
          fx.setTimeout(() => {
            if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
              fx.engineRef.current.multiplyMoveDropCounts(val);
            }
          }, 300);
        }
      }
      if (effect === "cross_enchant_self") {
        const crossCount = shapes.filter(s => s === "cross").length;
        if (crossCount > 0 && rng() < val) {
          if (isInstant) fx.triggerPassive(tokenId);
          const randomEnc = ENCHANTMENTS[Math.floor(rng() * ENCHANTMENTS.length)];
          const newEnc = { ...randomEnc, instanceId: Date.now() + Math.random() };
          fx.setTokens(prev => prev.map(tok => {
            if (tok && (tok.instanceId === tokenId || tok.id === tokenId)) {
              fx.notify(`${tokenName || "十字の加護"}発動！自身に「${randomEnc.name}」を付与した！`);
              return {
                ...tok,
                enchantments: [...(tok.enchantments || []), newEnc]
              };
            }
            return tok;
          }));
        }
      }
      if (effect === "square_repeat") {
        const sCount = shapes.filter(s => s === "square").length;
        if (sCount > 0 && fx.engineRef.current) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || "方陣 of 輪廻"}発動！リピートドロップを${val}個生成！`);
          fx.setTimeout(() => {
            if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
              fx.engineRef.current.spawnRepeatRandom(val);
            }
          }, 300);
        }
      }
      if (effect === "square_combo_add") {
        const sCount = shapes.filter(s => s === "square").length;
        if (sCount > 0) {
          if (isInstant) fx.triggerPassive(tokenId);
          const v = val * sCount;
          bonus += v;
          logData.bonuses.push(`square_combo_add:+${v}`);
          logData.bonusSteps.push({ label: tokenName || "方陣の極み", value: v, tokenId });
        }
      }
      if (effect === "square_convert_left_bottom") {
        const sCount = shapes.filter(s => s === "square").length;
        if (sCount > 0 && rng() < val) {
          if (isInstant) fx.triggerPassive(tokenId);
          extraStats.triggerSquareConvert = { tokenId };
        }
      }
      if (effect === "shape_triple_row_mult") {
        const rCount = shapes.filter(s => s === "row").length;
        if (rCount >= 3) {
          if (isInstant) fx.triggerPassive(tokenId);
          baseMultiplier *= val;
          logData.multipliers.push(`triple_row_mult:x${val}`);
          logData.multiplierSteps.push({ label: tokenName || "横列の共鳴", value: val, type: 'mult', tokenId });
        }
      }
      if (effect === "row_star") {
        const rCount = shapes.filter(s => s === "row").length;
        if (rCount > 0 && fx.engineRef.current) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || "横列の祝福"}発動！スタードロップを${val}個生成！`);
          fx.setTimeout(() => {
            if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
              fx.engineRef.current.spawnStarRandom(val);
            }
          }, 300);
        }
      }
      if (effect === "row_free_reroll") {
        const rCount = shapes.filter(s => s === "row").length;
        if (rCount > 0 && rng() < val) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.setFreeRerolls(f => {
            const nextFree = f + 1;
            fx.notify(`${tokenName || "横列 of 恩恵"}発動！ショップのリロールが1回無料になった！（現在蓄積: ${nextFree}回）`);
            return nextFree;
          });
        }
      }
      if (effect === "shape_quad_len4_mult") {
        const len4Count = shapes.filter(s => s === "len4").length;
        if (len4Count >= 4) {
          if (isInstant) fx.triggerPassive(tokenId);
          baseMultiplier *= val;
          logData.multipliers.push(`quad_len4_mult:x${val}`);
          logData.multiplierSteps.push({ label: tokenName || "4連の共鳴", value: val, type: 'mult', tokenId });
        }
      }
      if (effect === "len4_plus") {
        const len4Count = shapes.filter(s => s === "len4").length;
        if (len4Count > 0 && fx.engineRef.current) {
          if (isInstant) fx.triggerPassive(tokenId);
          fx.notify(`${tokenName || "4連の流星"}発動！プラスドロップを${val}個生成！`);
          fx.setTimeout(() => {
            if (fx.engineRef.current && !fx.engineRef.current._isDestroyed) {
              fx.engineRef.current.spawnPlusRandom(val);
            }
          }, 300);
        }
      }
      if (effect === "len4_token") {
        const len4Count = shapes.filter(s => s === "len4").length;
        if (len4Count > 0 && rng() < val) {
          if (isInstant) fx.triggerPassive(tokenId);
          const maxSlots = INITIAL_TOKEN_SLOTS + (tokenSlotExpansionCount || 0);
          const currentCount = tokens.filter(tok => tok !== null).length;
          if (currentCount < maxSlots) {
            const candidatePool = ALL_TOKEN_BASES.filter(b => b.type !== 'curse' && !b.isCurse);
            if (candidatePool.length > 0) {
              const randomBase = candidatePool[Math.floor(rng() * candidatePool.length)];
              const isSkill = randomBase.type === 'skill';
              const newToken = {
                ...randomBase,
                instanceId: Date.now() + Math.random(),
                level: 1,
                charge: isSkill ? (randomBase.cost || 0) : 0,
                startValue: randomBase.condition ? getStatByCondition(randomBase.condition) : 0
              };
              fx.setTokens(prev => {
                const nextTokens = [...prev];
                let emptySlotIdx = nextTokens.findIndex(tok => tok === null);
                if (emptySlotIdx !== -1) {
                  nextTokens[emptySlotIdx] = newToken;
                } else {
                  nextTokens.push(newToken);
                }
                return nextTokens;
              });
              fx.addTokenToast(newToken, "を入手した！ (4連の錬金)");
            }
          } else {
            fx.notify("4連の錬金: トークン枠がいっぱいです！");
          }
        }
      }
      if (effect === "len5_enchant") {
        const len5Count = detailedShapes.filter(ds => ds.length >= 5).length;
        if (len5Count > 0 && rng() < val) {
          if (isInstant) fx.triggerPassive(tokenId);
          const activeTokens = tokens.filter(tok => tok !== null);
          if (activeTokens.length > 0) {
            const targetToken = activeTokens[Math.floor(rng() * activeTokens.length)];
            const randomEnc = ENCHANTMENTS[Math.floor(rng() * ENCHANTMENTS.length)];
            const newEnc = { ...randomEnc, instanceId: Date.now() + Math.random() };
            fx.setTokens(prev => prev.map(tok => {
              if (tok && tok.instanceId === targetToken.instanceId) {
                fx.notify(`${tokenName || "5連の加護"}発動！「${targetToken.name}」に「${randomEnc.name}」を付与した！`);
                return {
                  ...tok,
                  enchantments: [...(tok.enchantments || []), newEnc]
                };
              }
              return tok;
            }));
          }
        }
      }

      let shapeType = null;
      if (effect === "shape_match4") shapeType = "len4";
      if (effect === "shape_cross") shapeType = "cross";
      if (effect === "shape_row") shapeType = "row";
      if (effect === "shape_l") shapeType = "l_shape";
      if (effect === "shape_square") shapeType = "square";
      if (effect === "shape_double_l_mult") shapeType = "l_shape";
      if (effect === "l_shape_repeat") shapeType = "l_shape";
      if (effect === "l_shape_skill_max") shapeType = "l_shape";
      if (effect === "l_cross_mult") shapeType = "l_shape";
      if (effect === "shape_double_cross_mult") shapeType = "cross";
      if (effect === "cross_multiply_move_drop") shapeType = "cross";
      if (effect === "cross_enchant_self") shapeType = "cross";
      if (effect === "square_repeat") shapeType = "square";
      if (effect === "square_combo_add") shapeType = "square";
      if (effect === "square_convert_left_bottom") shapeType = "square";
      if (effect === "shape_triple_row_mult") shapeType = "row";
      if (effect === "row_star") shapeType = "row";
      if (effect === "row_free_reroll") shapeType = "row";
      if (effect === "shape_quad_len4_mult") shapeType = "len4";
      if (effect === "len4_plus") shapeType = "len4";
      if (effect === "len4_token") shapeType = "len4";
      if (effect === "len5_enchant") shapeType = "len5_any";

      if (shapeType) {
        let count = 0;
        if (shapeType === "len5_any") {
          count = detailedShapes.filter(ds => ds.length >= 5).length;
        } else {
          count = shapes.filter(s => s === shapeType).length;
        }
        if (count > 0) {
          if (isInstant) {
            for (let i = 0; i < count; i++) {
              fx.setTimeout(() => fx.triggerPassive(tokenId), fx.getAnimDelay(i * 150));
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
      if (enc.effect === "star_add") { const mult = enc.value || 1; const b = stars * mult; bonus += b; logData.bonuses.push("star_add"); logData.bonusSteps.push({ label: t.name || 'スター加算', value: b, tokenId: tId }); }
      if (enc.effect === "skip_turn_combo") { const mult = enc.value || 1; const b = skippedTurnsBonus * mult; bonus += b; logData.bonuses.push("skip_add"); if (b > 0) logData.bonusSteps.push({ label: t.name || 'スキップボーナス', value: b, tokenId: tId }); }
      if (enc.effect === "rarity_down_combo") { bonus += 1; logData.bonuses.push("rarity_down_combo:1"); logData.bonusSteps.push({ label: t.name || 'レア度下げ', value: 1, tokenId: tId }); }
    });
    if (t.effect === "base_add") {
      const v = t.values?.[lv - 1] || 0;
      if (v > 0) {
        if (isInstant) fx.triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`base_add:${v}`);
        logData.bonusSteps.push({ label: t.name || 'ベース加算', value: v, tokenId: tId });
      }
    }
    if (t.effect === "contract_of_void") {
      const v = t.values?.[lv - 1] || 1;
      if (isInstant) fx.triggerPassive(tId);
      multMultiplier *= v;
      logData.multipliers.push(`contract_of_void:x${v.toFixed(2)}`);
      logData.multiplierSteps.push({ label: t.name || '契約の虚無', value: v, type: 'mult', tokenId: tId });
    }
    if (t.effect === "random_add") {
      const pool = t.values?.[lv - 1] || [0];
      const v = pool[Math.floor(rng() * pool.length)];
      if (isInstant) fx.triggerPassive(tId);
      bonus += v;
      logData.bonuses.push(`random_add:${v}`);
      if (v !== 0) logData.bonusSteps.push({ label: t.name || 'ランダム加算', value: v, tokenId: tId });
    }

    if (t.effect === "star_count_combo_add") {
      const rarity1Count = tokens.filter(tok => tok?.rarity === 1).length;
      const v = (t.values?.[lv - 1] || 1) * rarity1Count;
      if (v > 0) {
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
        multMultiplier *= v;
        logData.multipliers.push(`enchant_mult_boost:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || 'エンチャント数倍率', value: v, type: 'mult', tokenId: tId });
      }
    }

    if (t.effect === "magic_overload") {
      const overloadCount = isEnchantDisabled ? 0 : tokens.filter(tok => (tok?.enchantments?.length || 0) >= 3).length;
      const base = t.values?.[lv - 1] || 1.5;
      let v = Math.pow(base, overloadCount);
      v = applyMultiplierCap(v, t);
      if (v > 1) {
        if (isInstant) fx.triggerPassive(tId);
        multMultiplier *= v;
        logData.multipliers.push(`magic_overload:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '魔導の過積載', value: v, type: 'mult', tokenId: tId });
      }
    }

    if (t.effect === "sublimation_rune") {
      const bonusVal = t.sublimationBonus || 0;
      if (bonusVal > 0) {
        if (isInstant) fx.triggerPassive(tId);
        addedMultiplier += bonusVal;
        logData.multipliers.push(`sublimation_rune:+${bonusVal.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '昇華のルーン', value: 1.0 + bonusVal, addedValue: bonusVal, type: 'add', tokenId: tId });
      }
    }

    if (t.effect === "curse_count_combo_mult") {
      const curseCount = tokens.filter(tok => tok?.type === 'curse' || tok?.isCurse).length;
      let v = Math.pow(t.values?.[lv - 1] || 1, curseCount);
      v = applyMultiplierCap(v, t);
      if (v > 1) {
        if (isInstant) fx.triggerPassive(tId);
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`curse_mult_boost:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '呪い数倍率', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
      }
    }
    if (t.effect === "stat_curse_removed") {
      const removedCount = currentRunStats.currentCursesRemoved || 0;
      const v = (t.values?.[lv - 1] || 1) * removedCount;
      if (v > 0) {
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
        multMultiplier *= v;
        exponentialMultiplier += (v - 1.0);
        logData.multipliers.push(`heart_chalice:x${v.toFixed(2)}(hearts:${heartCount})`);
        logData.multiplierSteps.push({ label: t.name || '生命の器', value: v, type: 'mult', tokenId: tId });
      }
    }
    // ◯◯の器（D9）・五彩の器（§7.3）: 生命の器と同じく、累計に応じて指数で伸びるスケール枠
    if (t.effect === "stat_color_chalice" || t.effect === "stat_multicolor_chalice") {
      const isMulti = t.effect === "stat_multicolor_chalice";
      const total = isMulti
        ? (currentRunStats.fiveColorTurns || 0)
        : (currentRunStats.currentDropsErased?.[t.params?.color] || 0);
      const count = Math.floor(total / (isMulti ? 3 : 30));
      const base = t.values?.[lv - 1] || 2;
      if (count > 0) {
        let v = Math.pow(base, count);
        v = applyMultiplierCap(v, t);
        if (isInstant) fx.triggerPassive(tId);
        multMultiplier *= v;
        exponentialMultiplier += (v - 1.0);
        logData.multipliers.push(`${t.effect}:x${v.toFixed(2)}(count:${total})`);
        logData.multiplierSteps.push({ label: t.name, value: v, type: 'mult', tokenId: tId });
      }
    }
    if (t.effect === "stat_time_skipper") {
      const skipCount = currentRunStats.skipsPerformed || 0;
      const count = Math.floor(skipCount / 5);
      const base = t.values?.[lv - 1] || 1.3;
      if (count > 0) {
        let v = Math.pow(base, count);
        v = applyMultiplierCap(v, t);
        if (isInstant) fx.triggerPassive(tId);
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`time_skipper:+${(v - 1.0).toFixed(2)}(skips:${skipCount})`);
        logData.multiplierSteps.push({ label: t.name || '早送りの極意', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
      }
    }

    if (t.effect === "bomb_erase_mult" && erasedByBombTotal > 0) {
      const baseMult = t.values?.[lv - 1] || 1.2;
      let v = erasedByBombTotal * baseMult;
      v = applyMultiplierCap(v, t);
      if (isInstant) fx.triggerPassive(tId);
      multMultiplier *= (1.0 + v);
      logData.multipliers.push(`bomb_erase_mult:x${(1.0 + v).toFixed(2)}`);
      logData.multiplierSteps.push({ label: t.name || 'ボム消去倍率', value: 1.0 + v, type: 'mult', tokenId: tId });
    }

    if (t.effect === "repeat_combo_mult" && erasedByRepeatTotal > 0) {
      const baseMult = t.values?.[lv - 1] || 1.3;
      let v = erasedByRepeatTotal * baseMult;
      v = applyMultiplierCap(v, t);
      if (isInstant) fx.triggerPassive(tId);
      addedMultiplier += (v - 1.0);
      logData.multipliers.push(`repeat_combo_mult:+${(v - 1.0).toFixed(2)}`);
      logData.multiplierSteps.push({ label: t.name || 'リピート消去倍率', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
    }

    if (t.effect === "skyfall_bonus" && hasSkyfallCombo) {
      logData.bonuses.push(`skyfall:(applied)`);
    }

    if (t.effect === "combo_if_le" && turnCombo <= t.params?.combo) {
      const v = t.values?.[lv - 1] || 0;
      if (isInstant) fx.triggerPassive(tId);
      bonus += v;
      logData.bonuses.push(`combo_le_${t.params.combo}:${v}`);
      if (v > 0) logData.bonusSteps.push({ label: t.name || `${t.params.combo}コンボ以下`, value: v, tokenId: tId });
    }

    if (t.effect === "combo_if_ge" && turnCombo >= t.params?.combo) {
      const v = t.values?.[lv - 1] || 1;
      if (isInstant) fx.triggerPassive(tId);
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
            fx.setTimeout(() => fx.triggerPassive(t.instanceId || t.id), fx.getAnimDelay(i * 150));
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
      if (isInstant) fx.triggerPassive(t.instanceId || t.id);
      multMultiplier *= v;
      logData.multipliers.push(`forbidden:x${v.toFixed(2)}`);
      logData.multiplierSteps.push({ label: t.name || '禁忌', value: v, type: 'mult', tokenId: tId });
    }
    if (t.action === "forbidden_temp" && fx.engineRef.current?.noSkyfall) {
      if (isInstant) fx.triggerPassive(t.instanceId || t.id);
      addedMultiplier += 2.0;
      logData.multipliers.push("forbidden_temp:+2.0");
      logData.multiplierSteps.push({ label: t.name || '禁忌(一時)', value: 3, addedValue: 2.0, type: 'add', tokenId: tId });
    }
    enchList.forEach(enc => {
      if (enc.effect === "lvl_mult") {
        const mult = enc.value || 1.0;
        const added = (lv - 1.0) * mult;
        addedMultiplier += added;
        logData.multipliers.push(`lvl_mult:+${added.toFixed(2)}`);
        logData.multiplierSteps.push({ label: 'レベル倍率', value: 1.0 + added, addedValue: added, type: 'add', tokenId: tId });
      }
      if (enc.effect === "stat_shape_all") {
        const totalShape = (currentRunStats.currentShapeLen4 || 0) +
          (currentRunStats.currentShapeRow || 0) +
          (currentRunStats.currentShapeLShape || 0) +
          (currentRunStats.currentShapeCross || 0) +
          (currentRunStats.currentShapeSquare || 0) +
          (currentRunStats.currentShapeLen5 || 0);
        const b = Math.floor(totalShape / 20) * (enc.value || 1);
        if (b > 0) {
          if (isInstant) fx.triggerPassive(t.instanceId || t.id);
          bonus += b;
          logData.bonuses.push(`stat_shape_all(enc):+${b}`);
          logData.bonusSteps.push({ label: t.name || '万形の極意', value: b, tokenId: tId });
        }
      }
      if (enc.effect === "curse_catalyst") {
        const curseCount = tokens.filter(tok => tok != null && (tok.type === 'curse' || tok.isCurse)).length;
        if (curseCount > 0) {
          const base = enc.value || 2.0;
          const v = Math.pow(base, curseCount);
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
        if (isInstant) fx.triggerPassive(tId);
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
        if (isInstant) fx.triggerPassive(tId);
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`color_count_bonus_${color}_${requiredCount}:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || `色倍率(${color})`, value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
      }
    }

    if (t.effect === "shape_variety_mult") {
      const uniqueShapes = new Set(shapes).size;
      if (uniqueShapes >= 2) {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) fx.triggerPassive(tId);
        addedMultiplier += (v - 1.0);
        logData.multipliers.push(`shape_variety_mult_${uniqueShapes}:+${(v - 1.0).toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '形状多様性', value: v, addedValue: v - 1.0, type: 'add', tokenId: tId });
      }
    }

    if (t.id === "giant") {
      const v = t.values?.[lv - 1] || 1;
      if (isInstant) fx.triggerPassive(tId);
      multMultiplier *= v;
      logData.multipliers.push(`giant:x${v.toFixed(2)}`);
      logData.multiplierSteps.push({ label: t.name || '巨人の領域', value: v, type: 'mult', tokenId: tId });
    }

    if (t.effect === "desperate_stance") {
      const v = t.values?.[lv - 1] || 3;
      if (isInstant) fx.triggerPassive(tId);
      multMultiplier *= v;
      logData.multipliers.push(`desperate_stance:x${v.toFixed(2)}`);
      logData.multiplierSteps.push({ label: t.name || '背水の陣', value: v, type: 'mult', tokenId: tId });
    }

    if (t.effect === "greed_power") {
      const threshold = t.values?.[lv - 1] || 10;
      let greedBonus = Math.floor(stars / threshold);
      greedBonus = applyMultiplierCap(greedBonus, t);
      if (greedBonus > 0) {
        if (isInstant) fx.triggerPassive(tId);
        addedMultiplier += greedBonus;
        logData.multipliers.push(`greed_power:+${greedBonus}(stars:${stars}/threshold:${threshold})`);
        logData.multiplierSteps.push({ label: t.name || '金満の暴力', value: 1.0 + greedBonus, addedValue: greedBonus, type: 'add', tokenId: tId });
      }
    }

    if (t.effect === "cursed_power") {
      const v = t.values?.[lv - 1] || 10;
      if (isInstant) fx.triggerPassive(tId);
      bonus += v;
      logData.bonuses.push(`cursed_power:${v}`);
      logData.bonusSteps.push({ label: t.name || '呪われた力', value: v, tokenId: tId });
    }

    if (t.effect === "stat_combo_記憶") {
      const v = t.values?.[lv - 1] || 1;
      const b = Math.floor((currentRunStats.maxBaseCombo || 0) / 5) * v;
      if (b > 0) {
        if (isInstant) fx.triggerPassive(t.instanceId || t.id);
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
        if (isInstant) fx.triggerPassive(t.instanceId || t.id);
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
        if (isInstant) fx.triggerPassive(t.instanceId || t.id);
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
        if (isInstant) fx.triggerPassive(t.instanceId || t.id);
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
        if (isInstant) fx.triggerPassive(t.instanceId || t.id);
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
        if (isInstant) fx.triggerPassive(t.instanceId || t.id);
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
      if (isInstant) fx.triggerPassive(tId);
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
      if (isInstant) fx.triggerPassive(tId);
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
    if (isInstant) fx.triggerPassive(tId);
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
      if (isInstant) fx.triggerPassive(tId);
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
    if (probabilityTriggeredThisTurn) {
      if (isInstant) fx.triggerPassive(tId);
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
    const count = probabilityTriggeredTotalCount || 0;
    if (count > 0) {
      const addVal = count * stepVal;
      if (isInstant) fx.triggerPassive(tId);
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
      if (isInstant) fx.triggerPassive(tId);
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
      if (isInstant) fx.triggerPassive(tId2);
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

  fx.setNextTurnTimeMultiplier(timeMultiplier);

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
      if (isInstant) fx.triggerPassive(tId);
      baseMultiplier *= 0.5;
      logData.multipliers.push(`${t.name}(ペナルティ):x0.5`);
      logData.multiplierSteps.push({ label: `${t.name} (契約違反)`, value: 0.5, type: 'mult', tokenId: tId });
    } else if (myCombo > 0) {
      // 自色を消し、かつ敵対色を消していない場合：倍率アップ
      if (isInstant) fx.triggerPassive(tId);
      baseMultiplier *= multVal;
      logData.multipliers.push(`${t.name}:x${multVal}`);
      logData.multiplierSteps.push({ label: t.name, value: multVal, type: 'mult', tokenId: tId });
    }
  });

  // 二つ名の手番効果（加算・基礎倍・倍率プラス）。基礎倍と倍率プラスは直後の加算の極意で無効になる（D1・D5）
  {
    const te = calcTitleTurnEffects(titleEffects, {
      colorComboCounts, turn, maxTurns, stars, tokens,
      maxSlots: INITIAL_TOKEN_SLOTS + (tokenSlotExpansionCount || 0),
      remainingTimeMs, moveDistance: extraStats.moveDistance || 0,
    });
    te.bonusSteps.forEach(st => {
      bonus += st.value;
      logData.bonuses.push(`title:${st.label}:+${st.value}`);
      logData.bonusSteps.push({ label: st.label, value: st.value, tokenId: null, source: 'title' });
    });
    if (te.bonusMultiplier !== 1 && bonus > 0) {
      bonus = Math.floor(bonus * te.bonusMultiplier);
      logData.bonusSteps.push({ label: te.bonusMultiplierLabel, value: `x${te.bonusMultiplier}`, tokenId: null, source: 'title' });
    }
    te.baseSteps.forEach(st => {
      baseMultiplier *= st.value;
      logData.multiplierSteps.push({ label: st.label, value: st.value, type: 'mult', tokenId: null, source: 'title' });
    });
    te.sigmaSteps.forEach(st => {
      addedMultiplier += st.value;
      logData.multiplierSteps.push({ label: st.label, value: 1 + st.value, addedValue: st.value, type: 'add', tokenId: null, source: 'title' });
    });
  }

  if (hasMastery) {
    // 加算の極意（D1・D2）: 基礎倍（旧B層・D層）と倍率プラスの効果を無効にする。
    // ×1 未満のペナルティ（誓約の契約違反など）は残す。
    const penaltySteps = logData.multiplierSteps.filter(s => s.type === 'mult' && typeof s.value === 'number' && s.value < 1);
    baseMultiplier = penaltySteps.reduce((p, s) => p * s.value, 1.0);
    addedMultiplier = 0.0;
    multMultiplier = 1.0;
    exponentialMultiplier = 0.0;
    logData.multipliers = [`additive_mastery_active: multipliers disabled`];
    logData.multiplierSteps = [{ label: '加算の極意', value: masteryVal, isAdditiveMastery: true }, ...penaltySteps];

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
      fx.notify(`${token.name}のデメリット発動：他属性を消したため獲得コンボが0になります。`);
    } else if ((colorComboCounts[targetColor] || 0) > 0 && !hasMastery) {
      devotionMultiplier *= multVal;
      if (isInstant) fx.triggerPassive(token.instanceId || token.id);
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
  
  if (!isCursePassiveNull && !hasMastery) {
    if (fourMatchRestrToken) {
      const len4Count = shapes.filter(s => s === "len4").length;
      if (len4Count > 0) {
        restrictionMultiplier *= len4Count;
        if (isInstant) fx.triggerPassive(fourMatchRestrToken.instanceId || fourMatchRestrToken.id);
        logData.multipliers.push(`four_match_restriction:x${len4Count}`);
        logData.multiplierSteps.push({ label: fourMatchRestrToken.name, value: len4Count, type: 'mult', tokenId: fourMatchRestrToken.instanceId || fourMatchRestrToken.id });
      }
    }
    if (rowMatchRestrToken) {
      const rowCount = shapes.filter(s => s === "row").length;
      if (rowCount > 0) {
        restrictionMultiplier *= rowCount;
        if (isInstant) fx.triggerPassive(rowMatchRestrToken.instanceId || rowMatchRestrToken.id);
        logData.multipliers.push(`row_match_restriction:x${rowCount}`);
        logData.multiplierSteps.push({ label: rowMatchRestrToken.name, value: rowCount, type: 'mult', tokenId: rowMatchRestrToken.instanceId || rowMatchRestrToken.id });
      }
    }
  }

  // 指示に基づき、マイナス倍率は基礎コンボのほうに掛け算する
  const finalBaseComboBeforeDebuff = tc + bonus;
  const finalBaseCombo = (tc > 0) ? Math.floor(finalBaseComboBeforeDebuff * debuffMultiplier * baseMultiplier * devotionMultiplier * restrictionMultiplier) : 0;
  
  // 犬神（コンボ数100以上で倍率10倍）
  // 判定は「加算後・基礎倍の前」（D1）。加算の極意と併用できる。
  const inugamiToken = effectiveTokens.find(t => t?.effect === "inugami");
  const inugamiJudgeCombo = (tc > 0) ? Math.floor(finalBaseComboBeforeDebuff * debuffMultiplier) : 0;
  if (inugamiToken && inugamiJudgeCombo >= 100) {
    if (isInstant) fx.triggerPassive(inugamiToken.instanceId || inugamiToken.id);
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

  return {
    tc,
    bonus,
    multiplier,
    addedMultiplier,
    debuffMultiplier,
    finalBaseCombo,
    finalComboMultiplier,
    effectiveCombo,
    turnBaseCombo,
    turnBaseMultiplier,
    effectiveTokens,
    logData,
    isCursePassiveNull,
    isEnchantDisabled,
    isTrialActive,
    maxMoveDropThisTurn,
    moveDropBonus,
    bombSelfErased,
    repeatSelfErased,
    starSelfErased,
    rainbowSelfErased,
    steps: buildSteps(logData),
  };
}
