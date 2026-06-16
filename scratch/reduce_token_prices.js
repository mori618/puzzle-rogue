import fs from 'fs';
import path from 'path';

const tokensFilePath = path.resolve('/Users/mori/Desktop/メモ/puzzle/src/constants/tokens.js');

try {
  let content = fs.readFileSync(tokensFilePath, 'utf8');

  // price: 123 のパターンを置換する
  const updatedContent = content.replace(/(?<=[\s,{])price:\s*(\d+)/g, (match, priceStr) => {
    const originalPrice = parseInt(priceStr, 10);
    // 15%引き下げ (0.85倍)
    const newPrice = Math.max(1, Math.round(originalPrice * 0.85));
    return `price: ${newPrice}`;
  });

  fs.writeFileSync(tokensFilePath, updatedContent, 'utf8');
  console.log('Successfully updated token prices in tokens.js');
} catch (error) {
  console.error('Error updating tokens.js:', error);
  process.exit(1);
}
