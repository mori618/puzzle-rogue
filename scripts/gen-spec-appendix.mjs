#!/usr/bin/env node
/**
 * SPECIFICATION.md の「附録: 全トークン詳細データ表」を tokens.js から生成し直す（§3.7・ステップ8）。
 *
 *   npm run gen:spec
 *
 * 「## 附録: 全トークン詳細データ表」以降をすべて置き換える。附録は手で編集しない。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';
import { TOKEN_LAYERS } from '../src/constants/tokenLayers.js';
import { getTokenDescription } from '../src/utils/tokenUtils.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(ROOT, 'SPECIFICATION.md');
const HEADING = '## 附録: 全トークン詳細データ表';
const LAYER = { add: '＋加算', base: '×基礎倍', sigma: '倍率＋' };

const cell = (v) => String(v ?? '').replace(/\|/g, '／').replace(/\n/g, ' ');
const stars = (r) => (r ? `★${r}` : '—');
const desc = (t) => {
  try { return getTokenDescription(t) || t.desc || ''; } catch { return t.desc || ''; }
};
const values = (t) => (Array.isArray(t.values) && typeof t.values[0] === 'number' ? t.values.join(' / ') : '—');

const skills = ALL_TOKEN_BASES.filter(t => t.type === 'skill');
const passives = ALL_TOKEN_BASES.filter(t => t.type === 'passive');
const curses = ALL_TOKEN_BASES.filter(t => t.type === 'curse');

const lines = [
  HEADING,
  '',
  '> このセクションは `npm run gen:spec`（`scripts/gen-spec-appendix.mjs`）が `src/constants/tokens.js` から生成する。手で編集しない。',
  '> 「層」は `npm run gen:layers` が計算エンジンから求めた値（docs/balance-ui-design.md §6.4）。',
  '',
  `### SKILL トークン（${skills.length}）`,
  '',
  '| ID | 名称 | レアリティ | 価格 | 消費E | 効果 |',
  '|---|---|:---:|:---:|:---:|---|',
  ...skills.map(t => `| \`${t.id}\` | **${cell(t.name)}** | ${stars(t.rarity)} | ${t.price} | ${t.cost ?? '—'}${t.costLevels ? '(Lv毎変)' : ''} | ${cell(desc(t))} |`),
  '',
  `### PASSIVE トークン（${passives.length}）`,
  '',
  '| ID | 名称 | レアリティ | 価格 | 層 | 値（Lv1 / 2 / 3） | 効果 |',
  '|---|---|:---:|:---:|:---:|:---:|---|',
  ...passives.map(t => `| \`${t.id}\` | **${cell(t.name)}** | ${stars(t.rarity)} | ${t.price} | ${(TOKEN_LAYERS[t.id] || []).map(l => LAYER[l]).join('・') || '—'} | ${values(t)} | ${cell(desc(t))} |`),
  '',
  `### CURSE トークン（${curses.length}）`,
  '',
  '| ID | 名称 | 効果 |',
  '|---|---|---|',
  ...curses.map(t => `| \`${t.id}\` | **${cell(t.name)}** | ${cell(desc(t))} |`),
  '',
];

const spec = readFileSync(SPEC, 'utf8');
const idx = spec.indexOf(HEADING);
if (idx < 0) throw new Error(`見出しが見つからない: ${HEADING}`);
writeFileSync(SPEC, spec.slice(0, idx) + lines.join('\n'));
console.log(`附録を生成: スキル ${skills.length} / パッシブ ${passives.length} / 呪い ${curses.length}`);
