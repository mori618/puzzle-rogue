import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';
import fs from 'fs';

const fileContent = fs.readFileSync('/Users/mori/Desktop/メモ/puzzle/src/constants/tokens.js', 'utf8');
const lines = fileContent.split('\n');

const targetWords = ["エンチャント", "enchant"];

const matched = ALL_TOKEN_BASES.filter(t => {
  const desc = t.desc || "";
  const name = t.name || "";
  return targetWords.some(w => desc.includes(w) || name.includes(w));
});

const result = matched.map(t => {
  let lineNum = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`id: "${t.id}"`) || lines[i].includes(`id: '${t.id}'`)) {
      lineNum = i + 1;
      break;
    }
  }
  return {
    ...t,
    lineNum
  };
});

console.log(JSON.stringify(result, null, 2));
