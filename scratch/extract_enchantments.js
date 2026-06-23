import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// パスの設定
const enchantmentsJsPath = path.join(__dirname, '../src/constants/enchantments.js');
const csvOutputPath = path.join(__dirname, 'enchantment_balance_sheet.csv');
const mdOutputPath = '/Users/mori/.gemini/antigravity/brain/c723ecb3-41b6-4f24-bbd1-3cd66be276d6/enchantment_balance_sheet.md';

function main() {
  if (!fs.existsSync(enchantmentsJsPath)) {
    console.error('Error: enchantments.js not found at', enchantmentsJsPath);
    process.exit(1);
  }

  const code = fs.readFileSync(enchantmentsJsPath, 'utf8');

  // export 構文を除去して VM で評価できるようにする
  const cleanCode = code.replace(/export\s+\{[\s\S]*?\};/, '');
  const sandbox = {};
  vm.createContext(sandbox);

  let ENCHANTMENTS;
  let ENCHANT_DESCRIPTIONS;
  try {
    // 最後に評価する値としてオブジェクトを返すようにする
    const result = vm.runInNewContext(cleanCode + '\n({ ENCHANTMENTS, ENCHANT_DESCRIPTIONS });', sandbox);
    ENCHANTMENTS = result.ENCHANTMENTS;
    ENCHANT_DESCRIPTIONS = result.ENCHANT_DESCRIPTIONS;
  } catch (e) {
    console.error('Failed to parse enchantments.js via VM:', e);
    process.exit(1);
  }

  if (!ENCHANTMENTS || !ENCHANT_DESCRIPTIONS) {
    console.error('Error: Failed to retrieve ENCHANTMENTS or ENCHANT_DESCRIPTIONS');
    process.exit(1);
  }

  // --- CSVの生成 ---
  let csvContent = '\uFEFF'; // Excelで文字化けしないようにBOMを追加
  csvContent += 'ID,名前,レア度,価格,効果タイプ,効果値,パラメータ,アイコン,説明\n';

  // --- Markdownの生成 ---
  let mdContent = `# エンチャント効果値バランスシート\n\n`;
  mdContent += `このシートは、ゲーム内のすべてのエンチャント（効果・レア度・価格・説明）を一覧化したものです。\n`;
  mdContent += `バランス調整時の比較・検討にご活用ください。\n\n`;

  mdContent += `| 名前 (ID) | レア度 | 価格 | 効果タイプ | 効果値 | パラメータ | 説明 |\n`;
  mdContent += `| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

  ENCHANTMENTS.forEach(enchant => {
    const desc = ENCHANT_DESCRIPTIONS[enchant.id] || '';
    const stars = '★'.repeat(enchant.rarity || 1);
    const value = enchant.value !== undefined ? String(enchant.value) : '-';
    const params = enchant.params ? JSON.stringify(enchant.params) : '-';

    // Markdownテーブルへの追加
    mdContent += `| **${enchant.name}**<br>\`(${enchant.id})\` | ${stars} | ${enchant.price || 0} | ${enchant.effect || '-'} | ${value} | \`${params}\` | ${desc} |\n`;

    // CSVへの追加
    const csvRow = [
      enchant.id,
      enchant.name,
      enchant.rarity || 1,
      enchant.price || 0,
      enchant.effect || '',
      value,
      params.replace(/"/g, '""'),
      enchant.icon || '',
      desc.replace(/"/g, '""')
    ].map(val => `"${val}"`).join(',');
    csvContent += csvRow + '\n';
  });

  // ファイル出力
  fs.writeFileSync(csvOutputPath, csvContent, 'utf8');
  console.log('CSV balance sheet generated at:', csvOutputPath);

  const mdDir = path.dirname(mdOutputPath);
  if (!fs.existsSync(mdDir)) {
    fs.mkdirSync(mdDir, { recursive: true });
  }
  fs.writeFileSync(mdOutputPath, mdContent, 'utf8');
  console.log('Markdown balance sheet generated at:', mdOutputPath);
}

main();
