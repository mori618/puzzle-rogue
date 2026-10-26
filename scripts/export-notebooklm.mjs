import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'notebooklm-docs');

/**
 * 分割グループの定義
 * パターンまたは固定相対パスで指定可能
 */
const GROUPS = [
  {
    id: '01_project_config_and_specs',
    title: 'プロジェクト概要・仕様・設定ファイル',
    description: 'ゲーム仕様書(SPECIFICATION.md)、README、Vite/Tailwind/PostCSS/ESLint設定、package.json、index.html',
    files: [
      'SPECIFICATION.md',
      'README.md',
      'package.json',
      'vite.config.js',
      'eslint.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'index.html',
    ]
  },
  {
    id: '02_game_data_and_constants',
    title: 'ゲーム定数・マスターデータ定義',
    description: '全トークン定義(tokens.js)、エンチャント定義(enchantments.js)、ゲーム定数、サウンド設定',
    files: [
      'src/constants/tokens.js',
      'src/constants/enchantments.js',
      'src/constants/gameConstants.js',
      'src/constants/sounds.js',
    ]
  },
  {
    id: '03_core_engine_and_utils',
    title: 'パズルエンジン・計算ロジック・ユーティリティ',
    description: 'パズル判定・盤面評価エンジン(PuzzleEngine.js)、トークン/数値計算ユーティリティ、サウンド管理',
    files: [
      'src/engine/PuzzleEngine.js',
      'src/utils/tokenUtils.js',
      'src/utils/numberUtils.js',
      'src/utils/SoundManager.js',
    ]
  },
  {
    id: '04_game_state_and_hooks',
    title: 'ゲーム状態管理・カスタムフック',
    description: 'ゲーム進行・ターン・戦闘・スコア管理(useGameState.js)、ショップロジック(useShop.js)、盤面操作フック',
    files: [
      'src/hooks/useGameState.js',
      'src/hooks/useShop.js',
      'src/hooks/usePuzzleBoard.js',
      'src/hooks/useGameSettings.js',
    ]
  },
  {
    id: '05_screens_and_ui',
    title: 'UI画面・コンポーネント・スタイル',
    description: 'メイン画面(App.jsx)、ショップ・設定・図鑑・ヘルプなどの各画面コンポーネント、index.css',
    files: [
      'src/App.jsx',
      'src/main.jsx',
      'src/index.css',
      'src/TitleScreen.jsx',
      'src/ShopScreen.jsx',
      'src/TokenEncyclopediaScreen.jsx',
      'src/StatsScreen.jsx',
      'src/SettingsScreen.jsx',
      'src/StartOptionScreen.jsx',
      'src/PauseScreen.jsx',
      'src/HelpScreen.jsx',
      'src/CreditsScreen.jsx',
      'src/UIPreviewScreen.jsx',
      'src/icon_preview_tmp.html',
    ]
  },
  {
    id: '06_test_suites',
    title: '全テストスイート (Vitest / Testing Library)',
    description: 'パズルエンジンの包括テスト、Appテスト、エンチャント・シェイプトークン等の単体/結合テスト',
    files: [
      'src/PuzzleEngine.comprehensive.test.jsx',
      'src/PuzzleEngine.test.jsx',
      'src/App.test.jsx',
      'src/NewEnchantmentTokens.test.jsx',
      'src/NewShapeTokens.test.jsx',
      'src/NewShapeTokens2.test.jsx',
      'src/NewShapeTokens3.test.jsx',
      'src/CurseTokens.test.jsx',
    ]
  },
  {
    id: '07_tools_and_workflows',
    title: '開発用スクリプト・デモ・CI/CDワークフロー',
    description: 'エクスポートスクリプト、scratch配下の解析/生成スクリプト、demo用HTML、GitHub Actionsワークフロー',
    files: [
      'scripts/export-notebooklm.mjs',
      'scratch/analyze_tokens.js',
      'scratch/extract_enchant_tokens.js',
      'scratch/extract_enchantments.js',
      'scratch/extract_five_tokens.js',
      'scratch/extract_four_tokens.js',
      'scratch/extract_shape_tokens.js',
      'scratch/extract_tokens.js',
      'scratch/generate_csv.js',
      'scratch/reduce_token_prices.js',
      'scratch/refactor.js',
      'scratch/split.js',
      'demo/code.html',
      'demo/shopcode.html',
      '.github/scripts/ai-agent.mjs',
      '.github/workflows/ai-issue-agent.yml',
      '.github/workflows/deploy.yml',
    ]
  }
];

// 無視するディレクトリ・パターン
const IGNORE_PATTERNS = [
  /(^|\/)\.git\//,
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)dist-ssr\//,
  /(^|\/)\.vite\//,
  /(^|\/)notebooklm-docs\//,
  /\.(png|jpg|jpeg|gif|svg|ico|webp|mp3|ogg|wav|zip|tar|gz)$/i,
  /(^|\/)\.DS_Store$/,
  /(^|\/)package-lock\.json$/, // サイズが極めて大きくNotebookLMには不要
  /\.gitkeep$/,
  /\.diff$/, // 一時的なパッチ
  /\.csv$/, // スクラッチデータ
];

// 対象とする拡張子
const TARGET_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.css', '.scss', '.html', '.json', '.md', '.yml', '.yaml'
]);

/**
 * プロジェクト内の全対象ファイルを再帰的に探索
 */
function scanAllProjectFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    // 無視パターンチェック
    if (IGNORE_PATTERNS.some(pattern => pattern.test(relPath))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanAllProjectFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTENSIONS.has(ext)) {
        fileList.push(relPath);
      }
    }
  }

  return fileList;
}

/**
 * 拡張子からマークダウンのコード言語指定を取得
 */
function getLanguageFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
      return 'javascript';
    case '.jsx':
      return 'jsx';
    case '.ts':
      return 'typescript';
    case '.tsx':
      return 'tsx';
    case '.css':
      return 'css';
    case '.html':
      return 'html';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    case '.yml':
    case '.yaml':
      return 'yaml';
    default:
      return '';
  }
}

/**
 * 1つのファイルをMarkdownセクションとしてフォーマット
 */
function formatFileToMarkdown(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[WARN] File not found: ${relPath}`);
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const lineCount = lines.length;
  const byteCount = Buffer.byteLength(content, 'utf8');
  const lang = getLanguageFromPath(relPath);

  // バッククォートの連続（例: ```）と衝突しないようガード
  let fence = '```';
  while (content.includes(fence)) {
    fence += '`';
  }

  return {
    relPath,
    lineCount,
    byteCount,
    markdown: `
## File: \`${relPath}\`
- **Path**: \`${relPath}\`
- **Lines**: ${lineCount.toLocaleString()}
- **Size**: ${(byteCount / 1024).toFixed(2)} KB

${fence}${lang}
${content}
${fence}
`
  };
}

/**
 * メインエクスポート処理
 */
export function exportToNotebookLM(options = {}) {
  const startTime = Date.now();
  console.log('🚀 NotebookLM用ソースコードエクスポートを開始します...');

  // 1. 全対象ファイルの検出
  const allProjectFiles = scanAllProjectFiles(ROOT_DIR).sort();
  console.log(`📁 検出された対象ファイル数: ${allProjectFiles.length} ファイル`);

  // 出力先ディレクトリの確保と古いmdのクリーンアップ
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  } else {
    // 既存のmdファイルをクリア
    const oldFiles = fs.readdirSync(OUTPUT_DIR);
    for (const file of oldFiles) {
      if (file.endsWith('.md')) {
        fs.unlinkSync(path.join(OUTPUT_DIR, file));
      }
    }
  }

  const categorizedFiles = new Set();
  const generatedDocs = [];

  // 2. 各定義グループのMarkdownファイルを生成
  for (const group of GROUPS) {
    const existingGroupFiles = [];

    for (const filePattern of group.files) {
      if (allProjectFiles.includes(filePattern)) {
        existingGroupFiles.push(filePattern);
        categorizedFiles.add(filePattern);
      }
    }

    if (existingGroupFiles.length === 0) continue;

    const fileResults = [];
    let totalLines = 0;
    let totalBytes = 0;

    for (const relPath of existingGroupFiles) {
      const res = formatFileToMarkdown(relPath);
      if (res) {
        fileResults.push(res);
        totalLines += res.lineCount;
        totalBytes += res.byteCount;
      }
    }

    // Markdown文書の組み立て
    const header = [
      `# ${group.title}`,
      `> **ID**: \`${group.id}\`  `,
      `> **説明**: ${group.description}  `,
      `> **総ファイル数**: ${fileResults.length} | **総行数**: ${totalLines.toLocaleString()} 行 | **総サイズ**: ${(totalBytes / 1024).toFixed(2)} KB  `,
      `> **生成日時**: ${new Date().toISOString()}  `,
      '',
      '## 収録ファイル一覧',
      ...fileResults.map((f, i) => `${i + 1}. \`${f.relPath}\` (${f.lineCount.toLocaleString()} lines, ${(f.byteCount / 1024).toFixed(2)} KB)`),
      '',
      '---',
      ''
    ].join('\n');

    const body = fileResults.map(f => f.markdown).join('\n---\n');
    const fullDoc = `${header}\n${body}\n`;

    const outFileName = `${group.id}.md`;
    const outFilePath = path.join(OUTPUT_DIR, outFileName);
    fs.writeFileSync(outFilePath, fullDoc, 'utf8');

    generatedDocs.push({
      fileName: outFileName,
      title: group.title,
      description: group.description,
      filesCount: fileResults.length,
      lines: totalLines,
      bytes: totalBytes,
    });

    console.log(`✅ [生成完了] ${outFileName} (${fileResults.length} files, ${totalLines.toLocaleString()} lines, ${(totalBytes / 1024).toFixed(1)} KB)`);
  }

  // 3. 漏れ防止（どのグループにも属さなかった未分類ファイルの自動検出）
  const uncategorizedFiles = allProjectFiles.filter(f => !categorizedFiles.has(f));
  if (uncategorizedFiles.length > 0) {
    console.log(`⚠️ 未分類ファイルが ${uncategorizedFiles.length} 件検出されました。'99_unclassified_files.md' に出力します。`);

    const fileResults = [];
    let totalLines = 0;
    let totalBytes = 0;

    for (const relPath of uncategorizedFiles) {
      const res = formatFileToMarkdown(relPath);
      if (res) {
        fileResults.push(res);
        totalLines += res.lineCount;
        totalBytes += res.byteCount;
      }
    }

    const header = [
      '# その他のソースコード・設定ファイル（自動検出・未分類）',
      '> **説明**: 定義グループに含まれなかった追加ファイルをもれなく収録しています。',
      `> **総ファイル数**: ${fileResults.length} | **総行数**: ${totalLines.toLocaleString()} 行 | **総サイズ**: ${(totalBytes / 1024).toFixed(2)} KB`,
      `> **生成日時**: ${new Date().toISOString()}`,
      '',
      '## 収録ファイル一覧',
      ...fileResults.map((f, i) => `${i + 1}. \`${f.relPath}\` (${f.lineCount.toLocaleString()} lines, ${(f.byteCount / 1024).toFixed(2)} KB)`),
      '',
      '---',
      ''
    ].join('\n');

    const body = fileResults.map(f => f.markdown).join('\n---\n');
    const outFileName = '99_unclassified_files.md';
    fs.writeFileSync(path.join(OUTPUT_DIR, outFileName), `${header}\n${body}\n`, 'utf8');

    generatedDocs.push({
      fileName: outFileName,
      title: 'その他ファイル（自動検出）',
      description: '未分類の追加ファイル',
      filesCount: fileResults.length,
      lines: totalLines,
      bytes: totalBytes,
    });
  }

  // 4. 全ファイルを1つにまとめた統合版（00_full_source_bundle.md）も生成
  {
    console.log('📦 統合ファイル (00_full_source_bundle.md) を生成中...');
    const allFileResults = [];
    let totalLines = 0;
    let totalBytes = 0;

    for (const relPath of allProjectFiles) {
      const res = formatFileToMarkdown(relPath);
      if (res) {
        allFileResults.push(res);
        totalLines += res.lineCount;
        totalBytes += res.byteCount;
      }
    }

    const header = [
      '# puzzle-rogue 全ソースコード統合バンドル',
      '> **説明**: 本プロジェクトの全ソースコード、設定、仕様書、テストを一元化した完全版ドキュメントです。',
      `> **総ファイル数**: ${allFileResults.length} | **総行数**: ${totalLines.toLocaleString()} 行 | **総サイズ**: ${(totalBytes / 1024).toFixed(2)} KB`,
      `> **生成日時**: ${new Date().toISOString()}`,
      '',
      '## 収録ファイル一覧',
      ...allFileResults.map((f, i) => `${i + 1}. \`${f.relPath}\` (${f.lineCount.toLocaleString()} lines, ${(f.byteCount / 1024).toFixed(2)} KB)`),
      '',
      '---',
      ''
    ].join('\n');

    const body = allFileResults.map(f => f.markdown).join('\n---\n');
    const fullOutPath = path.join(OUTPUT_DIR, '00_full_source_bundle.md');
    fs.writeFileSync(fullOutPath, `${header}\n${body}\n`, 'utf8');

    console.log(`✅ [生成完了] 00_full_source_bundle.md (${allFileResults.length} files, ${totalLines.toLocaleString()} lines, ${(totalBytes / 1024).toFixed(1)} KB)`);
  }

  // 5. notebooklm-docs/README.md（取扱説明書）の生成
  const totalAllFiles = allProjectFiles.length;
  const guideMarkdown = [
    '# NotebookLM ソースコードドキュメント集',
    '',
    'このディレクトリは、Google NotebookLM に本プロジェクトのソースコードを読み込ませるための Markdown ファイル群です。',
    '',
    '## 📑 生成ファイル一覧',
    '',
    '| ファイル名 | カテゴリ / 役割 | ファイル数 | 行数 | サイズ |',
    '|---|---|---|---|---|',
    ...generatedDocs.map(d => `| [${d.fileName}](./${d.fileName}) | **${d.title}**<br>${d.description} | ${d.filesCount} | ${d.lines.toLocaleString()}行 | ${(d.bytes / 1024).toFixed(1)} KB |`),
    `| [00_full_source_bundle.md](./00_full_source_bundle.md) | **全ファイル統合バンドル**<br>上記全ファイルを1つに結合したもの | ${totalAllFiles} | - | 全体結合版 |`,
    '',
    '---',
    '',
    '## 🚀 NotebookLM への登録手順',
    '',
    '### おすすめの使い方（分割アップロード）',
    'NotebookLM ではファイルを分けて登録することで、回答の引用元（ソース番号）が明確になり、検索精度が向上します。',
    '',
    '1. [Google NotebookLM](https://notebooklm.google.com/) を開く。',
    '2. 「新しいノートブックを作成」をクリック。',
    '3. 「ソースを追加」→「ファイルをアップロード」を選択。',
    '4. `notebooklm-docs/` フォルダ内の以下のファイルをドラッグ＆ドロップ：',
    '   - `01_project_config_and_specs.md`（仕様・設定）',
    '   - `02_game_data_and_constants.md`（トークン・データ定義）',
    '   - `03_core_engine_and_utils.md`（パズルエンジン）',
    '   - `04_game_state_and_hooks.md`（状態管理・フック）',
    '   - `05_screens_and_ui.md`（UI・画面）',
    '   - `06_test_suites.md`（テストコード）',
    '   - *(必要に応じて)* `07_tools_and_workflows.md`',
    '',
    '> **Tip**: 1ファイルだけにまとめたい場合は `00_full_source_bundle.md` を1つだけアップロードすることも可能です。',
    '',
    '---',
    '',
    '## 🔄 これからコードを更新した時の再生成手順',
    '',
    'プロジェクトルートで以下のコマンドを実行するだけで、いつでも最新のコードが反映されます：',
    '',
    '```bash',
    'npm run export:notebooklm',
    '```',
    '',
    '### 漏れ防止の仕組み',
    '- 新しいコードファイル（`.jsx`, `.js`, `.css` など）を追加した場合でも、スクリプトがプロジェクト全体を自動走査します。',
    '- グループ定義から漏れたファイルは自動的に `99_unclassified_files.md` に格納されるため、**コードの漏れが絶対に発生しません**。',
    '- 分割グループの定義を調整したい場合は `scripts/export-notebooklm.mjs` の `GROUPS` 配列を編集してください。',
    ''
  ].join('\n');

  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), guideMarkdown, 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 すべてのエクスポートが正常に完了しました！ (${elapsed}秒)`);
  console.log(`📂 出力先: ${OUTPUT_DIR}\n`);
}

// CLIから直接実行された場合
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  exportToNotebookLM();
}
