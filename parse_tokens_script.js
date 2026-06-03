const fs = require('fs');
const path = require('path');

const originalCode = fs.readFileSync(path.join(__dirname, 'src', 'constants', 'tokens.js'), 'utf-8');
const modifiedCode = originalCode.replace(/export\s+\{\s*ALL_TOKEN_BASES\s*\};?/g, 'module.exports = { ALL_TOKEN_BASES };');
const tmpPath = path.join(__dirname, 'tmp_tokens.js');
fs.writeFileSync(tmpPath, modifiedCode, 'utf-8');

const { ALL_TOKEN_BASES } = require('./tmp_tokens.js');

let output = "# 全トークン レベル1効果一覧\n\n";
output += "ここで、現在の全トークンのレベル1における効果を整理しています。見直したいトークンについてご指摘ください。\n\n";

const types = [...new Set(ALL_TOKEN_BASES.map(t => t.type))];

for (const type of types) {
  output += `## ${type.toUpperCase()}\n\n`;
  output += `| ID | トークン名 | レベル1効果説明 |\n`;
  output += `|---|---|---|\n`;

  const tokens = ALL_TOKEN_BASES.filter(t => t.type === type);
  for (const t of tokens) {
    let desc = t.desc || "";
    
    // {cost} の置換
    let cost = t.cost !== undefined ? t.cost : "-";
    if (t.levelsConfig && Array.isArray(t.levelsConfig)) {
      cost = t.levelsConfig[0];
    }
    desc = desc.replace(/{cost}/g, cost);
    
    // [a/b/c] の置換 (レベル1の値を抽出)
    desc = desc.replace(/\[([^\]]+)\]/g, (match, p1) => {
      const parts = p1.split('/');
      return parts[0];
    });

    output += `| \`${t.id}\` | ${t.name} | ${desc} |\n`;
  }
  output += "\n";
}

fs.writeFileSync(path.join(__dirname, 'token_level1_list.md'), output, 'utf-8');
fs.unlinkSync(tmpPath);
console.log("Extraction complete.");
