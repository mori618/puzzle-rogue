/**
 * パズル中（手を離す前の連鎖中）に1グループ消えるごとに加算されるコンボの計算。
 *
 * - buildRealtimeBonuses: 所持トークンから「型・脈動・落ちコン・虹・加算の極意」などの
 *   加算テーブルを作る（useGameState から切り出し）。
 * - calcGroupAddition: 1グループ消去で加算される値を計算する（PuzzleEngine から切り出し）。
 *   発動演出・効果音は events として返し、呼び出し側が順番どおりに再生する。
 *
 * ここで加算された値が handleTurnEnd / calcTurnResult の turnCombo（素コンボ）になる。
 */

export function buildRealtimeBonuses({
  effectiveTokens,
  currentRunStats = {},
  activeBuffs = [],
  isEnchantDisabled = false,
  hasMastery = false,
  masteryMultiplier = 1,
}) {
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
        bonuses.color_combo[color].push({ value: enc.value || 1, tokenId: tId, tokenName: t.name || '色コンボ' });
      }
      if (enc.effect === 'bomb_burst_combo') {
        bonuses.bomb_burst_combo = (bonuses.bomb_burst_combo || 0) + (enc.value || 3);
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

  return bonuses;
}

/**
 * @param {object} rb buildRealtimeBonuses の戻り値（PuzzleEngine.realtimeBonuses）
 * @param {object} group { shape, type, hasRainbow, involvedRainbow, isSkyfall, enhancedCount }
 * @param {object} flags { pureMode, noSpecialEffects, overLinkMultiplier }
 * @returns {{ addition: number, tokenBonuses: Array, overLinkMultiplier: number, events: Array }}
 *   events: { kind: 'trigger', id } | { kind: 'se', id: 'MATCH_PLUS' | 'MATCH_RAINBOW' }
 */
export function calcGroupAddition(rb, group, flags = {}) {
  const { shape, type, hasRainbow = false, involvedRainbow = false, isSkyfall = false } = group;
  const { pureMode = false, noSpecialEffects = false } = flags;
  let overLinkMultiplier = flags.overLinkMultiplier ?? 1;
  const events = [];
  const trigger = (ids) => (ids || []).forEach(id => events.push({ kind: 'trigger', id }));

  let addition = 1;
  const tokenBonuses = [];

  if (!pureMode) {
    // Rainbow Combo Bonus
    if (hasRainbow && !noSpecialEffects && rb?.rainbow_combo_bonus) {
      addition += rb.rainbow_combo_bonus;
      trigger(rb.tokenIds?.rainbow_combo_bonus);
    }

    // 強化ドロップボーナス
    const enhancedCount = noSpecialEffects ? 0 : (group.enhancedCount || 0);
    const enhancedBonusPerOrb = 1 + (rb?.enhancedOrbBonus || 0);
    if (enhancedCount > 0 && rb?.enhancedOrbBonus > 0 && rb.tokenIds?.enhancedOrbBonus) {
      trigger(rb.tokenIds.enhancedOrbBonus);
      events.push({ kind: 'se', id: 'MATCH_PLUS' });
    }
    addition += enhancedCount * enhancedBonusPerOrb;

    // 過剰結合チェック
    if (enhancedCount >= (rb?.overLink?.count || 999)) {
      if (!overLinkMultiplier || overLinkMultiplier < (rb?.overLink?.value || 1)) {
        overLinkMultiplier = rb?.overLink?.value || 1;
        trigger(rb.tokenIds?.overLink);
      }
    }

    // Base Bonuses
    if (shape === "len5") addition += 1;
    if (shape === "l_shape") addition += 1;
    if (shape === "cross") addition += 2;
    if (shape === "row") addition += 2;

    if (shape === "len4" && rb?.len4) {
      addition += rb.len4;
      trigger(rb.tokenIds?.len4);
    }
    if (shape === "len4" && rb?.stat_shape_additions?.len4) {
      addition += rb.stat_shape_additions.len4;
      trigger(rb.tokenIds?.stat_shape_additions?.len4);
    }
    if (shape === "row" && rb?.row) {
      addition += rb.row;
      trigger(rb.tokenIds?.row);
    }
    if (shape === "l_shape" && rb?.l_shape) {
      addition += rb.l_shape;
      trigger(rb.tokenIds?.l_shape);
    }
    if (shape === "cross" && rb?.stat_shape_additions?.cross) {
      addition += rb.stat_shape_additions.cross;
      trigger(rb.tokenIds?.stat_shape_additions?.cross);
    }

    // Color Combo Bonus
    if (type && rb?.color_combo?.[type]) {
      const colorEntries = rb.color_combo[type];
      const tokenBonusValue = colorEntries.reduce((s, e) => s + (e.value || 0), 0);
      const tokenBonusInfo = colorEntries.length > 0
        ? { name: colorEntries[0].tokenName, id: colorEntries[0].tokenId }
        : null;
      if (tokenBonusValue > 0) {
        tokenBonuses.push({ amount: tokenBonusValue, info: tokenBonusInfo });
      }
    }

    // Heart Combo Bonus
    if (type === 'heart' && rb?.heart_combo?.length > 0) {
      const heartEntries = rb.heart_combo;
      const heartBonusValue = heartEntries.reduce((s, e) => s + (e.value || 0), 0);
      const heartBonusInfo = { name: heartEntries[0].tokenName, id: heartEntries[0].tokenId };
      if (heartBonusValue > 0) {
        tokenBonuses.push({ amount: heartBonusValue, info: heartBonusInfo });
      }
      heartEntries.forEach(e => events.push({ kind: 'trigger', id: e.tokenId }));
    }

    // Skyfall Bonus
    if (isSkyfall && rb?.skyfall) {
      addition += rb.skyfall;
      trigger(rb.tokenIds?.skyfall);
    }

    // Rainbow Bridge
    if (involvedRainbow && rb?.rainbow) {
      addition += Number(rb.rainbow || 0);
      trigger(rb.tokenIds?.rainbow);
      events.push({ kind: 'se', id: 'MATCH_RAINBOW' });
    }

    // Apply Mastery Multiplier (Real-time)
    if (rb?.masteryMultiplier) {
      addition *= rb.masteryMultiplier;
    }
  }

  return { addition, tokenBonuses, overLinkMultiplier, events };
}
