import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// パスの設定
const tokensJsPath = path.join(__dirname, '../src/constants/tokens.js');
const csvOutputPath = path.join(__dirname, 'token_balance_sheet.csv');
const mdOutputPath = '/Users/mori/.gemini/antigravity/brain/bb2bec40-56cf-4281-b6a0-391586d3ba20/token_balance_sheet.md';

function main() {
  if (!fs.existsSync(tokensJsPath)) {
    console.error('Error: tokens.js not found at', tokensJsPath);
    process.exit(1);
  }

  const code = fs.readFileSync(tokensJsPath, 'utf8');

  // --- 1. コメントからカテゴリ情報を抽出 ---
  const lines = code.split('\n');
  let currentCategory = '未分類';
  const idToCategory = {};

  for (let line of lines) {
    const commentMatch = line.match(/\/\/\s*---\s*(.*?)\s*---/);
    if (commentMatch) {
      currentCategory = commentMatch[1].trim();
      continue;
    }
    
    const idMatch = line.match(/id:\s*["']([a-zA-Z0-9_]+)["']/);
    if (idMatch) {
      const id = idMatch[1];
      idToCategory[id] = currentCategory;
    }
  }

  // --- 2. VMを使用して安全にJSオブジェクトとして評価 ---
  // export 構文を除去
  const cleanCode = code.replace(/export\s+\{\s*ALL_TOKEN_BASES\s*\};/, 'ALL_TOKEN_BASES;');
  const sandbox = {};
  vm.createContext(sandbox);
  
  let ALL_TOKEN_BASES;
  try {
    ALL_TOKEN_BASES = vm.runInNewContext(cleanCode + '\nALL_TOKEN_BASES;', sandbox);
  } catch (e) {
    console.error('Failed to parse tokens.js via VM:', e);
    process.exit(1);
  }

  // --- 3. データのカテゴリ分類と加工 ---
  const categories = {};
  
  ALL_TOKEN_BASES.forEach(token => {
    const cat = idToCategory[token.id] || '未分類';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(token);
  });

  // --- 4. CSVの生成 ---
  let csvContent = '\uFEFF'; // Excelで文字化けしないようにBOMを追加
  csvContent += 'カテゴリ,ID,名前,レア度,タイプ,コスト(Lv1/2/3),価格,属性,説明\n';

  // --- 5. Markdownの生成 ---
  let mdContent = `# トークン効果値バランスシート\n\n`;
  mdContent += `このシートは、ゲーム内のすべてのトークンを効果カテゴリごとにグループ化し、効果値とコストを一覧化したものです。\n`;
  mdContent += `バランス調整時の比較・検討にご活用ください。\n\n`;

  // 目次の生成
  mdContent += `## カテゴリ一覧\n\n`;
  Object.keys(categories).forEach((cat, idx) => {
    mdContent += `${idx + 1}. [${cat}](#category-${idx})\n`;
  });
  mdContent += `\n---\n\n`;

  // 各カテゴリのテーブルを生成
  Object.keys(categories).forEach((cat, idx) => {
    mdContent += `<a id="category-${idx}"></a>\n`;
    mdContent += `## ${cat}\n\n`;
    mdContent += `| 名前 (ID) | レア度 | タイプ | コスト | 価格 | 属性 | 効果・説明 (Lv1 / Lv2 / Lv3) |\n`;
    mdContent += `| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

    categories[cat].forEach(token => {
      // コスト文字列の作成
      let costStr = '-';
      if (token.cost !== undefined) {
        if (token.costLevels && token.levelsConfig) {
          costStr = token.levelsConfig.join('/');
        } else {
          costStr = String(token.cost);
        }
      }

      // レア度（星マーク）
      const stars = '★'.repeat(token.rarity || 1);

      // 属性
      const attrs = token.attributes ? token.attributes.join(', ') : '-';

      // 説明文のプレースホルダー置換
      let desc = token.desc || '';
      desc = desc.replace(/{cost}/g, costStr);
      if (token.values) {
        desc = desc.replace(/{values}/g, `[${token.values.join(' / ')}]`);
      }
      if (token.effectValues) {
        desc = desc.replace(/{effectValues}/g, `[${token.effectValues.join(' / ')}]`);
      }
      if (token.maxMultipliers) {
        desc = desc.replace(/{maxMultipliers}/g, `[${token.maxMultipliers.join(' / ')}]`);
      }

      // Markdownテーブルへの追加
      mdContent += `| **${token.name}**<br>\`(${token.id})\` | ${stars} | ${token.type} | ${costStr} | ${token.price || 0} | ${attrs} | ${desc} |\n`;

      // CSVへの追加 (ダブルクォーティング処理)
      const csvRow = [
        cat,
        token.id,
        token.name,
        token.rarity || 1,
        token.type,
        costStr,
        token.price || 0,
        attrs,
        desc.replace(/"/g, '""')
      ].map(val => `"${val}"`).join(',');
      csvContent += csvRow + '\n';
    });

    mdContent += `\n\n`;
  });

  // ファイル出力
  fs.writeFileSync(csvOutputPath, csvContent, 'utf8');
  console.log('CSV balance sheet generated at:', csvOutputPath);

  // Markdownのディレクトリが存在することを確認して出力
  const mdDir = path.dirname(mdOutputPath);
  if (!fs.existsSync(mdDir)) {
    fs.mkdirSync(mdDir, { recursive: true });
  }
  fs.writeFileSync(mdOutputPath, mdContent, 'utf8');
  console.log('Markdown balance sheet generated at:', mdOutputPath);
}

main();
