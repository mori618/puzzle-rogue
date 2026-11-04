# トークンバランス調査（自動プレイシミュレーション）

ボットに実際のゲームをヘッドレスブラウザ（Playwright + Chromium）で遊ばせて、トークンの効果を数値で集めるための道具と、その結果です。
ゲームのソースは変更しません。開発サーバーが配信するときにだけ、ゲーム状態（`window.__gs`）とパズルエンジン（`window.__engine`）を外から触れるようにしています。

結果のダッシュボード: https://claude.ai/artifact/SUU46bMxoau6F2evKi1JzV （非公開。共有メニューから共有すると他の人も見られます）

## 中身

| パス | 内容 |
|---|---|
| `sim/server.mjs` | シミュレーション用の開発サーバー（ポート 5180） |
| `sim/bot.js` | ページに注入するボット。盤面をビームサーチで探索し、1マス0.2秒の速さで実際にドラッグする。アニメーションは無効化、演出の待ち時間は1/12に短縮 |
| `sim/exp.cjs` | 単体効果テスト。トークン1個だけを持たせて N 手番プレイする |
| `sim/run.cjs` | フルラン（ショップでランダム寄りに購入しながらゲームオーバーまで） |
| `sim/run_smart.cjs` | フルラン（単体テストの中央値が高いトークンを優先して購入） |
| `sim/analyzeA.cjs` | 単体テストの集計 → `sumA*.json` / `sumA*.csv` |
| `sim/analyzeB.cjs` | フルランの集計 → `sumB.json` / `sumS.json` |
| `sim/build-dashboard-data.cjs` | ダッシュボード用 CSV を作る |
| `sim/desc.mjs` | トークンの説明文を表示する（`node sim/desc.mjs <id>...`） |
| `results/sumA.csv` `sumA.json` | 単体テスト Lv1（476トークン × 15手番、基準はトークンなし 12回 × 15手番） |
| `results/sumA3.csv` `sumA3.json` | 単体テスト 最大Lv |
| `results/sumB.json` | フルラン ランダム購入 240本 |
| `results/sumS.json` | フルラン 強いトークン優先 150本 |
| `results/dashboard-data/*.csv` | ダッシュボードに添付したデータ |
| `results/raw/*.tar.gz` | 全ランのプレイログ（ゲーム内蔵のプレイログ形式）と単体テストの手番ごとの記録 |
| `dashboard/index.html` | ダッシュボードのページ本体（claude.ai の Dashboard 上で動くもの。単体のブラウザでは開けません） |

## 使い方

リポジトリ直下で `npm install` 済みの状態から。

```bash
node balance-sim/sim/server.mjs
```

別のターミナルで、出力先のディレクトリを決めて実行します（例は `out/` 以下）。

```bash
# 単体効果テスト: 並列数 出力dir 手番数 レベル 対象(all またはカンマ区切りのID) 基準の回数
node balance-sim/sim/exp.cjs 6 out/single_lv1 15 1 all 12
node balance-sim/sim/analyzeA.cjs out/single_lv1 $PWD/out/sumA.json
```

```bash
# フルラン: 並列数 ラン数 出力dir スタート(mix/safety/solid/challenge)
node balance-sim/sim/run.cjs 6 240 out/runs_random mix
node balance-sim/sim/analyzeB.cjs out/runs_random $PWD/out/sumB.json
```

- `run_smart.cjs` は `results/sumA.json` の評価を使って購入します。
- 4コアで並列数6〜8が目安です。単体テスト476件は約40分、フルラン240本は約20分でした。
- 1マスの操作時間は、ページの `localStorage` の `__sim_step_ms` で変えられます（既定 200ms）。

## 結果の要点（2026-11-04 時点のコード）

- トークンなしの平均は 7.9 コンボ／手番（ブレ ±1.5）。
- サイクル6（目標 56 → 228）が大きな壁。クリア率はランダム購入 11%、強いトークン優先 26%。全390ランの66%がサイクル4〜6で終了。
- 突出して強い: 「〇の消滅」系スキル（★3・消費E1で毎手番使え、数手番に1回1000〜2000コンボ）、余白の美学、金満の暴力（★1）、双連の極意、生命の器（上限なしの指数成長）、十連の極み、呪われた力、真・〇〇の極致。
- レアリティと強さが逆転: Lv1単体の増加率の中央値は ★1パッシブ +40%、★2 +4%、★3 +4%、★4 +1%。
- 加算の極意は倍率ビルドの途中で買うと倍率がすべて消える（サイクル22まで来ていたランが全滅）。

## 注意点

- ボットは形消しを少し優先するだけで、L字や十字などは狙い撃ちしません。形消し系・変換スキルは過小評価の可能性があります。
- 〇の手・〇の誓約・横列の制約・四連の制約のマイナスは、ボットがそのルールを考慮して手を探していないためです。
- 単体テストは序盤の条件（スター30・トークン1個・枠が空き）なので、所持数・累計値・スター残高で伸びるトークンは強めに出ます。
- 偏食家は手番数が変わる影響で1手番分しかデータがありません。
- `server.mjs` は `src/hooks/useGameState.js` の特定の行を目印に差し込みます。そこが変わると起動時に `inject failed` で止まるので、目印を合わせて直してください。
