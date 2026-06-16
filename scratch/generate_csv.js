import fs from 'fs';
import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';
import { getEffectiveCost, getTokenDescription } from '../src/utils/tokenUtils.js';

// カテゴリマッピングの作成
const tokensFileContent = fs.readFileSync('src/constants/tokens.js', 'utf8');
const lines = tokensFileContent.split('\n');
let currentCategory = "";
const idToCategory = {};

// 前後の行バッファ（★形式は行をまたぐ）
let prevLine = "";
for (const line of lines) {
  // パターン1: // --- xxx --- 形式
  const catMatch = line.match(/\/\/\s*---\s*(.*?)\s*---/);
  if (catMatch) {
    currentCategory = catMatch[1].trim();
  }
  // パターン2: // ★ xxx 形式（直前行が ====== のブロックヘッダー）
  const starMatch = line.match(/\/\/\s*★\s*(.*)/);
  if (starMatch && prevLine.includes('====')) {
    currentCategory = starMatch[1].trim();
  }

  const idMatch = line.match(/id:\s*["']([^"']+)["']/);
  if (idMatch && currentCategory) {
    idToCategory[idMatch[1]] = currentCategory;
  }
  prevLine = line;
}

const csvRows = [
  ['カテゴリ', 'ID', '名前', 'レア度', 'タイプ', 'コスト(Lv1/2/3)', '価格', '属性', '説明', '効果値(Lv1/2/3)']
];

for (const t of ALL_TOKEN_BASES) {
  const category = idToCategory[t.id] || "";
  const id = t.id;
  const name = t.name;
  const rarity = t.rarity || "";
  const type = t.type || "";
  
  let costStr = "";
  if (t.type === 'skill') {
    if (t.costLevels) {
      const baseCost = t.cost || 0;
      const c1 = getEffectiveCost({ ...t, cost: baseCost, level: 1 });
      const c2 = getEffectiveCost({ ...t, cost: baseCost, level: 2 });
      const c3 = getEffectiveCost({ ...t, cost: baseCost, level: 3 });
      costStr = `${c1}/${c2}/${c3}`;
    } else {
      costStr = String(t.cost || 0);
    }
  }
  
  const price = t.price || "";
  const attributes = t.attributes ? t.attributes.join(', ') : "";
  const desc = getTokenDescription(t);
  
  let valueStr = "";
  if (t.values) {
    valueStr = t.values.join('/');
  } else if (t.value !== undefined) {
    valueStr = String(t.value);
  }
  
  csvRows.push([
    category,
    id,
    name,
    String(rarity),
    type,
    costStr,
    String(price),
    attributes,
    desc,
    valueStr
  ]);
}

// CSVエスケープ関数
const escapeCsv = (str) => {
  if (str === null || str === undefined) return '';
  let val = String(str);
  if (val.includes('"') || val.includes(',') || val.includes('\n')) {
    val = '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
};

const csvContent = csvRows.map(row => row.map(escapeCsv).join(',')).join('\n');
fs.writeFileSync('scratch/token_balance_sheet.csv', csvContent, 'utf8');
console.log('CSV generated successfully.');
