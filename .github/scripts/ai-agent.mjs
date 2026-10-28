import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

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
          // 1ファイルあたり巨大すぎる場合はカットしてトークンを節約
          if (content.length > 20000) {
            content = content.slice(0, 20000) + '\n/* ...[ファイルサイズ超過のため省略]... */';
          }
          results.push({ path: relPath, content });
        } catch {
          // ignore binary or unreadable files
        }
      }
    }
  }
  return results;
}

// Call Gemini API with Retry & Exponential Backoff for 429
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
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.status === 429) {
        const errorText = await response.text();
        console.warn(`Rate limit hit (429). Attempt ${attempt} of ${maxRetries}. Waiting before retry...`);

        // 429発生時は60秒待機して枠のリセットを待つ
        if (attempt < maxRetries) {
          console.log('Waiting 60 seconds for token rate limit reset...');
          await sleep(60000);
          continue;
        }
        throw new Error(`Gemini API Rate Limit Exceeded (429): ${errorText}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned empty response');
      }
      return JSON.parse(text);
    } catch (err) {
      if (attempt >= maxRetries || !err.message.includes('429')) {
        throw err;
      }
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
  let filesContext = files
    .map(f => `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`)
    .join('\n\n');

  // 全体トークン数が20万文字（約5万〜6万トークン相当）を超える場合は全体を縮小
  if (filesContext.length > 200000) {
    console.warn('Project context too large. Truncating context size...');
    filesContext = filesContext.slice(0, 200000) + '\n\n/* ...[プロジェクト全体サイズが大きいため一部ファイルを省略]... */';
  }

  let currentInstruction = userInstruction;
  let attempts = 0;
  const maxAttempts = 3;
  let lastBuildError = '';

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts} / ${maxAttempts}`);

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

    // Apply file changes
    for (const file of result.files) {
      console.log(`Writing file: ${file.path}`);
      writeFileSync(file.path, file.content, 'utf-8');
    }

    // Try building
    console.log('Testing build: npm run build');
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log('Build succeeded!');

      // Commit and push
      execSync('git config user.name "github-actions[bot]"');
      execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
      execSync('git add -A');

      const commitMessage = `fix: ${ISSUE_TITLE || 'auto update from issue'} (#${ISSUE_NUMBER})\n\n${result.summary || ''}`;
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
      execSync('git push origin main');

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
      lastBuildError = buildErr.stderr ? buildErr.stderr.toString() : buildErr.message;
      console.warn(`Build failed on attempt ${attempts}:`, lastBuildError);
      if (attempts >= maxAttempts) {
        await postIssueComment(`⚠️ **ビルドエラーが発生しました（${maxAttempts}回試行）**\n自動修復できませんでした。エラー内容:\n\`\`\`\n${lastBuildError.slice(0, 1000)}\n\`\`\``);
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