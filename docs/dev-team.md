# 開発チーム（Claude Code サブエージェント）

`.claude/agents/` に、このプロジェクト用のサブエージェントを定義しています。
Claude Code のセッションで「game-designer に〜を考えてもらって」のように名前を指定すると、その役割で作業します。

| 名前 | 役割 | コード変更 |
|---|---|---|
| `game-designer` | トークン・二つ名などの企画、仕様の整合確認、SPECIFICATION.md / README.md の更新 | ドキュメントのみ |
| `engine-dev` | パズルエンジン・コンボ計算・トークン効果・サイクル / ショップのロジック | する |
| `ui-dev` | React 画面・HUD・Tailwind・スマホ対応・演出・PWA | する |
| `qa-tester` | Vitest のテスト設計と追加、不具合の再現、リグレッション確認 | テスト中心 |
| `balance-analyst` | balance-sim での自動プレイ・集計・調整案 | しない（本体は触らない） |
| `code-reviewer` | 差分のレビュー（不具合・仕様ずれ・テスト不足） | しない |

## 基本の流れ

1. **企画**: game-designer が案と実装メモを出す
2. **実装**: engine-dev（ロジック）/ ui-dev（見た目）が実装する
3. **テスト**: qa-tester がテストを追加し、`npm run lint` / `npm test` / `npm run build` を確認する
4. **バランス確認**（数値に関わる変更のみ）: balance-analyst がシミュレーションで測る
5. **レビュー**: code-reviewer が差分を確認してから PR を出す

## 依頼の例

```
game-designer と engine-dev と qa-tester で、雷ドロップを使う★2トークンを1つ追加して。
最後に code-reviewer にレビューさせてから PR を作って。
```
