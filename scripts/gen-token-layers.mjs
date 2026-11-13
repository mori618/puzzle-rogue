#!/usr/bin/env node
/**
 * トークンの「層」（加算 / 基礎倍 / 倍率プラス）を計算エンジンから自動で求め、
 * src/constants/tokenLayers.js に書き出す（docs/balance-ui-design.md §4.3・§6.4）。
 *
 *   npm run gen:layers
 *
 * 各パッシブを Lv3 で基準パターン全部に入れて回し、その札自身の内訳（steps）が
 * どの層に出たかを集める。連鎖中に加算される札（型・脈動など）は「加算」とする。
 * どの層にも出なかった札（経済・盤面・スキル系）は書き出さない。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';
import { makeToken, normalizeColors, runSteps } from './lib/turnRunner.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const { patterns } = readJson('balance/patterns.json');
const { stages } = readJson('balance/builds.json');
const runState = stages.late.runState;

const layers = {};
ALL_TOKEN_BASES.filter(t => t.type === 'passive').forEach(t => {
  const found = new Set();
  const cand = normalizeColors(makeToken(t.id, 3, 0));
  patterns.forEach(p => {
    [() => 0, () => 0.999999].forEach(rng => {
      const { result, realtimeFired } = runSteps([cand], p, runState, rng);
      if (realtimeFired.has(cand.instanceId)) found.add('add');
      result.steps.filter(s => s.tokenId === cand.instanceId).forEach(s => {
        if (s.kind === 'bonus') found.add('add');
        else if (s.type === 'mult') found.add('base');
        else found.add('sigma');
      });
    });
  });
  if (found.size) layers[t.id] = ['add', 'base', 'sigma'].filter(l => found.has(l));
});

// 単体の試行では条件に届かない札（犬神: 加算後の基礎コンボ数100以上 / 曲芸師: ハート2コンボ）
const MANUAL = { legend_inugami: ['base'], legend_acrobat: ['base'] };
Object.assign(layers, MANUAL);

const body = Object.entries(layers).map(([id, ls]) => `  ${JSON.stringify(id)}: ${JSON.stringify(ls)},`).join('\n');
const out = `// このファイルは scripts/gen-token-layers.mjs が生成する。手で編集しない（npm run gen:layers）。
// 各トークンがどの層に効くか: add = ＋加算 / base = ×基礎倍 / sigma = 倍率プラス
export const TOKEN_LAYERS = {
${body}
};
`;
writeFileSync(join(ROOT, 'src/constants/tokenLayers.js'), out);
const counts = { add: 0, base: 0, sigma: 0 };
Object.values(layers).forEach(ls => ls.forEach(l => counts[l]++));
console.log(`層を付けた札: ${Object.keys(layers).length} 種（加算 ${counts.add} / 基礎倍 ${counts.base} / 倍率プラス ${counts.sigma}）`);
