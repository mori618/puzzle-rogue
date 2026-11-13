/**
 * 二つ名の効果のうち、コンボ計算に関わるもの（docs/balance-ui-design.md §5・ステップ4）。
 * calcTurnResult から呼ばれる純関数。
 *
 * - applyTitleTokenBoosts: 増幅の（1.3倍）・超越の極意（2倍）・全能力覚醒（Lv4扱い）でトークンの値を変える
 * - calcTitleTurnEffects: 手番ごとの加算・基礎倍・倍率プラスを返す
 *   基礎倍と倍率プラスは加算の極意で無効になる（D1・D5。calcTurnResult 側の極意処理で消える）
 */
import { TOKEN_LAYERS } from '../constants/tokenLayers.js';

/** 値の配列が Lv とともに小さくなる札（★7/5/3個ごと など）は「閾値」とみなす */
const isThreshold = (values) => values.length >= 2 && values.every((v, i) => i === 0 || v < values[i - 1]);

/** 1つの値を「強くなる方向に m 倍」する */
const boostValue = (v, m, layer, threshold) => {
  if (typeof v !== 'number') return v;
  if (threshold) return v / m;
  if (layer === 'add') return v * m;
  return v > 1 ? 1 + (v - 1) * m : v * m;
};

export function applyTitleTokenBoosts(tokens, titleEffects = []) {
  const boost = titleEffects.reduce((m, e) => {
    if (e.type === 'passive_boost') return m * (e.multiplier || 1);
    if (e.type === 'all_tokens_boost') return m * (e.multiplier || 1);
    return m;
  }, 1);
  const lv4 = titleEffects.some(e => e.type === 'all_tokens_lv4');
  if (boost === 1 && !lv4) return tokens;

  return tokens.map(t => {
    if (!t || t.type !== 'passive' || !Array.isArray(t.values) || typeof t.values[0] !== 'number') return t;
    // 増幅の は passive のみ・超越の極意 はスキルにも掛かるが、スキルの値はコンボ計算に入らないため passive だけを変える
    let values = t.values;
    let level = t.level || 1;
    if (lv4 && values.length === 3 && !t.noLevelUp) {
      const v4 = values[2] + (values[2] - values[1]);
      values = [...values, v4];
      level = 4;
    }
    if (boost !== 1) {
      const layer = (TOKEN_LAYERS[t.id] || [])[0];
      const threshold = isThreshold(t.values);
      values = values.map(v => boostValue(v, boost, layer, threshold));
    }
    return { ...t, values, level };
  });
}

/**
 * @param {Array} titleEffects useGameState の activeTitleEffects（{ type, name, ... }）
 * @param {object} c { colorComboCounts, turn, maxTurns, stars, tokens, maxSlots, remainingTimeMs, moveDistance }
 * @returns {{ bonusSteps: Array, baseSteps: Array, sigmaSteps: Array, bonusMultiplier: number, bonusMultiplierLabel: string|null }}
 */
export function calcTitleTurnEffects(titleEffects = [], c) {
  const bonusSteps = [];
  const baseSteps = [];
  const sigmaSteps = [];
  let bonusMultiplier = 1;
  let bonusMultiplierLabel = null;
  const tokens = (c.tokens || []).filter(Boolean);
  const curseCount = tokens.filter(t => t.type === 'curse').length;
  const remainSec = Math.floor((c.remainingTimeMs || 0) / 1000);
  const combos = c.colorComboCounts || {};

  titleEffects.forEach(e => {
    const label = e.name ? `『${e.name}』` : '二つ名';
    const base = (v) => { if (v && v !== 1) baseSteps.push({ label, value: v }); };
    const sigma = (v) => { if (v > 0) sigmaSteps.push({ label, value: v }); };
    const add = (v) => { if (v > 0) bonusSteps.push({ label, value: v }); };

    switch (e.type) {
      // ---- 倍率プラス ----
      case 'combo_multiplier_add': sigma(e.value); break; // 覇王・パズルマスター
      case 'color_multiplier': sigma((e.value || 0) * (combos[e.color] || 0)); break; // 紅蓮の 等
      case 'zero_star_combo_mult': if (c.stars === 0) sigma(e.value); break; // からっぽの
      case 'boss_turn_multiplier': if (c.turn === c.maxTurns) sigma(e.value); break; // 討伐者
      case 'curse_multiplier': sigma((e.value || 0) * curseCount); break; // 厄災の
      case 'solo_multiplier': if (tokens.length <= (e.maxTokens || 3)) sigma(e.value); break; // 孤高の
      case 'mono_attribute_bonus': { // 統率者
        const counts = {};
        tokens.forEach(t => (t.attributes || []).forEach(a => { counts[a] = (counts[a] || 0) + 1; }));
        if (Math.max(0, ...Object.values(counts)) >= (e.minTokens || 3)) sigma(e.value);
        break;
      }
      case 'lv3_token_multiplier': sigma((e.value || 0) * tokens.filter(t => (t.level || 1) >= 3).length); break; // 極致者
      case 'purgatory_board': if ((combos.fire || 0) > 0) sigma(e.fireMultiplierAdd || 0); break; // 煉獄皇
      // ---- 基礎倍 ----
      case 'berserk': base(e.base_multiplier); break; // 狂戦士の
      case 'desperate': base(e.base_multiplier); break; // 背水の
      case 'disable_skyfall': base(e.base_multiplier); break; // 禁忌の
      case 'base_combo_multiplier': base(e.value); break; // 消滅者の・無双
      case 'base_combo_multiplier_add': base(e.value); break; // 鬼神降臨
      case 'full_slot_base_multiplier': if (tokens.length >= (c.maxSlots || 0)) base(e.value); break; // 満載の
      case 'first_turn_multiplier': if (c.turn === 1) base(e.value); break; // 先制の
      case 'asura': base(e.base_multiplier); break; // 修羅の
      case 'fixed_multiplier_no_stars': base(e.multiplier); break; // 無一文の（固定ではなく乗算: §5.5）
      case 'calamity_god_power': if (curseCount > 0) base(Math.pow(e.basePerCurse || 2, curseCount)); break; // 厄災の神
      case 'time_left_base_multiplier': if (remainSec > 0) base(1 + (e.ratePerSec || 0) * remainSec); break; // 神速の電撃戦
      case 'time_add': if (e.time_left_bonus && remainSec > 0) sigma(e.time_left_bonus * remainSec); break; // 光速の
      // ---- 加算 ----
      case 'heart_boost': add((e.heal_combo_add || 0) * (combos.heart || 0)); break; // 慈愛の
      case 'stroke_bonus': { // 一筆の: 30マス以上で +20、以降10マスごとに +10（§5.4）
        const d = c.moveDistance || 0;
        const min = e.minDistance || 30;
        if (d >= min) add((e.comboAdd || 0) + Math.floor((d - min) / 10) * 10);
        break;
      }
      case 'flash_speed': if ((c.remainingTimeMs || 0) >= 5000) add(e.bonus); break; // 閃光
      case 'combo_addition_multiplier': bonusMultiplier *= (e.multiplier || 1); bonusMultiplierLabel = label; break; // 探求者
      default: break;
    }
  });
  return { bonusSteps, baseSteps, sigmaSteps, bonusMultiplier, bonusMultiplierLabel };
}
