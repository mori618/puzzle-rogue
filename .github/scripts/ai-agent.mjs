import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const ISSUE_TITLE = process.env.ISSUE_TITLE || '';
const ISSUE_BODY = process.env.ISSUE_BODY || '';
const COMMENT_BODY = process.env.COMMENT_BODY || '';

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set.');
  process.exit(1);
}

// GitHub API helper
async function postIssueComment(body) {
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !ISSUE_NUMBER) return;
  try {
    await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${ISSUE_NUMBER}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ai-issue-agent',
      },
      body: JSON.stringify({ body }),
    });
  } catch (err) {
    console.warn('Failed to post issue comment:', err.message);
  }
}

// AIが書き込んでよいパスか判定する（src/ 配下と index.html のみ許可）
function isWritablePath(p) {
  if (typeof p !== 'string' || p.length === 0) return false;
  const root = process.cwd();
  const abs = resolve(root, p);
  const rel = relative(root, abs);
  if (rel.startsWith('..') || rel.includes(`..${sep}`)) return false;
  return rel === 'index.html' || rel.startsWith(`src${sep}`);
}

// Helper to pause execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Collect relevant files from repository with size safety
function getProjectFiles(dir, baseDir = dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    if (file.startsWith('.') || file === 'node_modules' || file === 'dist' || file === 'build') continue;
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getProjectFiles(filePath, baseDir));
    } else {
      const relPath = relative(baseDir, filePath);
      if (
        relPath.startsWith('src/') ||
        relPath === 'package.json' ||
        relPath === 'vite.config.js' ||
        relPath === 'index.html'
      ) {
        try {
          let content = readFileSync(filePath, 'utf-8');
          let truncated = false;
          // 1ファイルあたり巨大すぎる場合はカットしてトークンを節約
          if (content.length > 20000) {
            content = content.slice(0, 20000) + '\n/* ...[ファイルサイズ超過のため省略]... */';
            truncated = true;
          }
          results.push({ path: relPath, content, truncated });
        } catch {
          // ignore binary or unreadable files
        }
      }
    }
  }
  return results;
}

// Call Gemini API with Retry & JSON Parsing Error Protection
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  const model = 'gemini-3.8-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // 温度を下げてフォーマット崩れを低減
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        console.warn(`Gemini API Temporary Error (${response.status}). Attempt ${attempt} of ${maxRetries}. Waiting...`);
        if (attempt < maxRetries) {
          await sleep(Math.pow(2, attempt) * 5000);
          continue;
        }
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned empty response');
      }

      // JSON文字列の整形（Markdownの```json ... ``` が混ざっている場合を除去）
      text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

      try {
        return JSON.parse(text);
      } catch (jsonErr) {
        console.warn(`JSON parse error on attempt ${attempt}: ${jsonErr.message}`);

        // パース失敗時、最後の試行でなければ再試行
        if (attempt < maxRetries) {
          console.log('Retrying API call due to malformed JSON response...');
          await sleep(3000);
          continue;
        }
        throw new Error(`Failed to parse JSON response from Gemini: ${jsonErr.message}`);
      }

    } catch (err) {
      if (attempt >= maxRetries) {
        throw err;
      }
      console.warn(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
      await sleep(5000);
    }
  }
}

async function main() {
  console.log(`Starting AI Agent for Issue #${ISSUE_NUMBER}`);
  await postIssueComment(`🤖 **AIが修正リクエストを受け付けました**\nコードを解析・修正して自動ビルドを行います。少々お待ちください...`);

  const userInstruction = COMMENT_BODY
    ? `追加指示: ${COMMENT_BODY}\n\n(元Issue: ${ISSUE_TITLE}\n${ISSUE_BODY})`
    : `Issueタイトル: ${ISSUE_TITLE}\n\nIssue内容:\n${ISSUE_BODY}`;

  const files = getProjectFiles(process.cwd());

  // 全体が20万文字（約5万〜6万トークン相当）を超えないようにファイル単位で詰める。
  // AIが全文を見られたファイルだけを「上書き可能」として記録する
  // （一部しか見ていないファイルを「完全な内容」で書き直させると、残りが消えてしまうため）。
  const CONTEXT_LIMIT = 200000;
  const fullyVisiblePaths = new Set();
  const existingPaths = new Set(files.map(f => resolve(process.cwd(), f.path)));
  const contextParts = [];
  const omittedPaths = [];
  let contextLength = 0;
  for (const f of files) {
    const part = `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`;
    if (contextLength + part.length > CONTEXT_LIMIT) {
      omittedPaths.push(f.path);
      continue;
    }
    contextParts.push(part);
    contextLength += part.length + 2;
    if (!f.truncated) fullyVisiblePaths.add(resolve(process.cwd(), f.path));
  }
  if (omittedPaths.length > 0) {
    console.warn(`Project context too large. Omitted files: ${omittedPaths.join(', ')}`);
    contextParts.push(`/* ...[プロジェクト全体サイズが大きいため以下のファイルを省略: ${omittedPaths.join(', ')}]... */`);
  }
  const filesContext = contextParts.join('\n\n');
  const notEditablePaths = files
    .filter(f => !fullyVisiblePaths.has(resolve(process.cwd(), f.path)))
    .map(f => f.path);

  let currentInstruction = userInstruction;
  let attempts = 0;
  const maxAttempts = 3;
  let lastBuildError = '';

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts} / ${maxAttempts}`);

    // 前回の試行で書き込んだ変更を破棄してから再試行する
    if (attempts > 1) {
      execFileSync('git', ['checkout', '--', '.']);
      execFileSync('git', ['clean', '-fd', '--', 'src']);
    }

    const prompt = `あなたは熟練のフロントエンドエンジニアです。
ユーザーから以下の修正リクエストが届きました。
リポジトリのコードを分析し、修正が必要なファイルを完全な内容で出力してください。

【ユーザーのリクエスト】
${currentInstruction}

${lastBuildError ? `【前回のビルドエラー】\n${lastBuildError}\nこのエラーを解消するようにコードを修正してください。\n` : ''}

【現在のプロジェクトコード】
${filesContext}

【出力形式】
JSONスキーマ:
{
  "summary": "変更内容の日本語サマリー（1〜3行）",
  "files": [
    {
      "path": "修正する相対ファイルパス（例: src/App.jsx）",
      "content": "修正後の完全なファイル内容文字列"
    }
  ]
}
注意:
- 変更が必要なファイルのみを配列に含めてください。
- 変更できるのは src/ 配下のファイルと index.html のみです。
- 次のファイルは内容の一部しか提示されていないため、変更対象に含めないでください: ${notEditablePaths.length ? notEditablePaths.join(', ') : 'なし'}
- 各ファイルの内容は一部の省略（...など）をせず、完全な全体コードを記述してください。
- 構文エラーや未定義の変数・import漏れがないように注意してください。`;

    let result;
    try {
      result = await callGeminiWithRetry(prompt);
    } catch (err) {
      console.error('Gemini API call failed:', err);
      await postIssueComment(`❌ **AI解析エラー**: Gemini APIの呼び出しに失敗しました。\n\`\`\`\n${err.message}\n\`\`\``);
      process.exit(1);
    }

    if (!result.files || result.files.length === 0) {
      console.log('No files to modify.');
      await postIssueComment(`ℹ️ **変更不要または解析不能**: 変更対象のファイルが検出されませんでした。\nサマリー: ${result.summary || 'なし'}`);
      return;
    }

    // 書き込み先の検証（すべて問題ない場合のみ書き込む）
    const invalidFiles = result.files.filter((file) => {
      if (typeof file.content !== 'string' || !isWritablePath(file.path)) return true;
      const abs = resolve(process.cwd(), file.path);
      // 既存ファイルはAIが全文を見ていたものだけ上書きを許可する
      return existsSync(abs) && (!existingPaths.has(abs) || !fullyVisiblePaths.has(abs));
    });
    if (invalidFiles.length > 0) {
      lastBuildError = `次のファイルは変更できません（src/ 配下・index.html 以外、または全文が提示されていないファイル）: ${invalidFiles.map(f => f.path).join(', ')}`;
      console.warn(lastBuildError);
      if (attempts >= maxAttempts) {
        await postIssueComment(`⚠️ **変更できないファイルが指定されたため中止しました**\n${lastBuildError}`);
        process.exit(1);
      }
      continue;
    }

    // Apply file changes
    for (const file of result.files) {
      console.log(`Writing file: ${file.path}`);
      writeFileSync(resolve(process.cwd(), file.path), file.content, 'utf-8');
    }

    // Try building and testing
    console.log('Testing build: npm run build && npm test');
    try {
      execFileSync('npm', ['run', 'build'], { stdio: 'pipe' });
      console.log('Build succeeded!');
      execFileSync('npm', ['test'], { stdio: 'pipe' });
      console.log('Tests passed!');

      // Commit and push（シェルを介さず引数で渡し、Issueタイトル等によるコマンド注入を防ぐ）
      execFileSync('git', ['config', 'user.name', 'github-actions[bot]']);
      execFileSync('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);
      execFileSync('git', ['add', '--', ...result.files.map(f => f.path)]);

      const commitMessage = `fix: ${ISSUE_TITLE || 'auto update from issue'} (#${ISSUE_NUMBER})\n\n${result.summary || ''}`;
      execFileSync('git', ['commit', '-m', commitMessage]);
      execFileSync('git', ['push', 'origin', 'main']);

      const successComment = `✅ **修正が完了し、mainブランチに反映されました！**

### 変更サマリー
${result.summary || 'コードを修正しました。'}

### 変更されたファイル
${result.files.map(f => `- \`${f.path}\``).join('\n')}

🚀 **GitHub Pagesへの自動デプロイが開始されました。**
約1〜2分後に公開サイトに反映されます。追加の修正要望があればこのIssueに返信してください！`;

      await postIssueComment(successComment);
      return;
    } catch (buildErr) {
      const stdout = buildErr.stdout ? buildErr.stdout.toString() : '';
      const stderr = buildErr.stderr ? buildErr.stderr.toString() : '';
      lastBuildError = (stderr + '\n' + stdout).trim().slice(-8000) || buildErr.message;
      console.warn(`Build failed on attempt ${attempts}:`, lastBuildError);
      if (attempts >= maxAttempts) {
        await postIssueComment(`⚠️ **ビルドまたはテストが失敗しました（${maxAttempts}回試行）**\n自動修復できませんでした。エラー内容:\n\`\`\`\n${lastBuildError.slice(0, 1000)}\n\`\`\``);
        process.exit(1);
      }
    }
  }
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  await postIssueComment(`❌ **エラーが発生しました**: ${err.message}`);
  process.exit(1);
});