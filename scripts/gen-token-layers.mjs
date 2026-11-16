#!/usr/bin/env node
/**
 * トークンが「コンボ加算 / 加算倍率 / 乗算倍率」のどこに効くかを計算エンジンから求め、
 * src/constants/tokenLayers.js に書き出す（カードの層バッジ用）。
 *
 *   npm run gen:layers
 *
 * 各パッシブを Lv3 で代表的な盤面パターンに入れて calcTurnResult を回し、その札自身の内訳（steps）が
 * どこに出たかを集める。連鎖中（手を離す前）に加算される札は calcTurnResult を通らないため、
 * REALTIME_ADD_EFFECTS で「コンボ加算」とする。どこにも出なかった札（経済・盤面・スキル系）は書き出さない。
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';
import { calcTurnResult, createNoopFx } from '../src/engine/comboCalculator.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 連鎖中に1グループ消えるごとに加算される札（useGameState の setRealtimeBonuses）
const REALTIME_ADD_EFFECTS = new Set([
  'shape_bonus', 'color_combo_add', 'heart_combo_bonus', 'enhanced_orb_bonus',
  'rainbow_combo_bonus', 'move_drop_boost', 'skyfall_bonus', 'stat_shape_cross', 'stat_shape_len4',
]);
// 単体の試行では条件に届かない札
const MANUAL = { legend_inugami: ['mult'], legend_acrobat: ['mult'] };

const COLORS = ['fire', 'dark', 'water', 'wood', 'light', 'heart'];
const g = (color, length = 3, shape = null) => ({ color, length, shape });
const PATTERNS = [
  [g('fire'), g('fire'), g('water'), g('water'), g('wood'), g('light'), g('dark')],
  [g('fire'), g('fire'), g('fire'), g('fire'), g('fire'), g('dark'), g('dark'), g('dark'), g('dark'), g('dark')],
  [g('fire', 30)],
  [g('fire', 6, 'row'), g('fire', 6, 'row'), g('fire', 6, 'row'), g('fire', 6, 'row'), g('fire', 6, 'row')],
  [g('fire', 5, 'cross'), g('water', 5, 'l_shape'), g('wood', 4, 'len4'), g('light', 4, 'len4'), g('fire')],
  [g('fire', 9, 'square'), g('water'), g('water'), g('wood'), g('light')],
  [g('fire'), g('fire'), g('water'), g('water'), g('wood'), g('wood'), g('light'), g('light'), g('dark'), g('heart'), g('heart')],
];
const RUN_STATS = {
  currentClears: 14, totalHeartsErased: 300, currentTotalCombo: 50000, maxCombo: 200,
  currentShapeRow: 15, currentShapeCross: 8, currentShapeLShape: 8, currentShapeSquare: 6, currentShapeLen4: 20, currentShapeLen5: 8,
  currentShopRerolls: 25, currentStarsSpent: 600, currentCursesRemoved: 2, skipsPerformed: 2, maxBaseCombo: 60, maxComboMultiplier: 50,
  currentDropsErased: { fire: 400, water: 400, wood: 400, light: 400, dark: 400, heart: 300 },
};

/** 札の色を炎（2色目は月…）に寄せて、パターンの色で発動するようにする */
const normalizeColors = (t) => {
  const p = t.params || {};
  const own = [...new Set([p.color, ...(p.colors || []), p.attribute, p.from, p.to].filter(c => COLORS.includes(c)))];
  if (own.length === 0 && t.attributes?.length === 1 && COLORS.includes(t.attributes[0])) own.push(t.attributes[0]);
  if (own.length === 0) return t;
  const map = {};
  [...own, ...COLORS.filter(c => !own.includes(c))].forEach((c, i) => { map[c] = COLORS[i]; });
  const swap = (v) => (typeof v === 'string' ? (map[v] || v)
    : Array.isArray(v) ? v.map(swap)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)])) : v);
  const effect = typeof t.effect === 'string' ? t.effect.replace(/_(fire|water|wood|light|dark|heart)$/, (_, c) => `_${map[c]}`) : t.effect;
  return { ...t, effect, params: swap(t.params), attributes: swap(t.attributes) };
};

const run = (token, groups, rng) => {
  const colorComboCounts = {};
  const erasedColorCounts = {};
  groups.forEach(x => {
    colorComboCounts[x.color] = (colorComboCounts[x.color] || 0) + 1;
    erasedColorCounts[x.color] = (erasedColorCounts[x.color] || 0) + x.length;
  });
  return calcTurnResult({
    turnCombo: groups.length, colorComboCounts, erasedColorCounts, finalErasedColorCounts: { ...erasedColorCounts },
    shapes: groups.map(x => x.shape).filter(Boolean),
    detailedShapes: groups.map(x => ({ shape: x.shape, color: x.color, length: x.length })),
    tokens: [token], currentRunStats: RUN_STATS, settings: { comboAnimationMode: 'instant' },
    stars: 80, turn: 3, maxTurns: 3, tokenSlotExpansionCount: 3, rng,
  }, createNoopFx());
};

const layers = {};
ALL_TOKEN_BASES.filter(t => t.type === 'passive').forEach(base => {
  const found = new Set();
  if (REALTIME_ADD_EFFECTS.has(base.effect)) found.add('add');
  const token = normalizeColors({ ...base, level: Array.isArray(base.values) && base.values.length >= 3 ? 3 : 1, instanceId: 'probe' });
  PATTERNS.forEach(groups => {
    [() => 0, () => 0.999999].forEach(rng => {
      try {
        run(token, groups, rng).steps.filter(s => s.tokenId === 'probe').forEach(s => {
          if (s.kind === 'bonus') found.add('add');
          else if (s.type === 'mult') found.add('mult');
          else found.add('sigma');
        });
      } catch { /* 単体で回せない札は層なし */ }
    });
  });
  if (found.size) layers[base.id] = ['add', 'sigma', 'mult'].filter(l => found.has(l));
});
Object.assign(layers, MANUAL);

const body = Object.entries(layers).map(([id, ls]) => `  ${JSON.stringify(id)}: ${JSON.stringify(ls)},`).join('\n');
writeFileSync(join(ROOT, 'src/constants/tokenLayers.js'), `// このファイルは scripts/gen-token-layers.mjs が生成する。手で編集しない（npm run gen:layers）。
// 各トークンがどこに効くか: add = コンボ加算 / sigma = 加算倍率 / mult = 乗算倍率
export const TOKEN_LAYERS = {
${body}
};
`);
const counts = { add: 0, sigma: 0, mult: 0 };
Object.values(layers).forEach(ls => ls.forEach(l => counts[l]++));
console.log(`層を付けた札: ${Object.keys(layers).length} 種（コンボ加算 ${counts.add} / 加算倍率 ${counts.sigma} / 乗算倍率 ${counts.mult}）`);
