import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';
import fs from 'fs';

const fileContent = fs.readFileSync('/Users/mori/Desktop/メモ/puzzle/src/constants/tokens.js', 'utf8');
const lines = fileContent.split('\n');

const targetWords = ["L字", "十字", "正方形", "横列", "縦列", "横1列", "縦1列", "列消し", "一閃", "3x3"];

const matched = ALL_TOKEN_BASES.filter(t => {
  const desc = t.desc || "";
  const name = t.name || "";
  return targetWords.some(w => desc.includes(w) || name.includes(w));
});

const result = matched.map(t => {
  // id が定義されている行を探す
  let lineNum = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`id: "${t.id}"`) || lines[i].includes(`id: '${t.id}'`)) {
      lineNum = i + 1; // 1-indexed
      break;
    }
  }
  return {
    ...t,
    lineNum
  };
});

console.log(JSON.stringify(result, null, 2));
