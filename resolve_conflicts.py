#!/usr/bin/env python3
"""App.jsx のコンフリクトを自動解決するスクリプト"""
import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# コンフリクトパターンを逆順で取得して後ろから置換
conflicts = list(re.finditer(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> main', content, re.DOTALL))
print(f"Total conflicts: {len(conflicts)}")

# 解決方針: HEAD = testブランチ優先, MAIN = mainブランチ優先, BOTH = 両方統合
# 番号は1始まり
strategies = {
    1: 'BOTH',    # import AITester + soundManager (両方必要)
    2: 'BOTH',    # initialCurrentRunStats に両方のフィールドを追加
    3: 'BOTH',    # autoPlayActive + isPracticeMode, isPureMode (両方必要)
    4: 'HEAD',    # getPreferredColorTypes (テスト専用) - timerTextRefもHEAD側でそのまま追加
    5: 'MAIN',    # hasSaintToken追加 (mainの新機能)
    6: 'HEAD',    # instanceStatsKey (テスト用)
    7: 'HEAD',    # instanceSettingsKey (テスト用)
    8: 'HEAD',    # instanceSaveKey (テスト用)
    9: 'HEAD',    # optional chain (安全側)
    10: 'HEAD',   # optional chain (安全側)
    11: 'HEAD',   # AIテストループ (testブランチの機能) - 依存配列付き
    12: 'MAIN',   # color_combo_add (mainの新機能)
    13: 'MAIN',   # 大きいブロック: mainの新機能
    14: 'MAIN',   # currentDropsErased等 (mainの新機能)
    15: 'MAIN',   # hasKingToken等 (mainの大きな新機能)
    16: 'HEAD',   # onStart + instanceSaveKey (テスト用)
    17: 'HEAD',   # cycleCount計算 (テスト統計)
    18: 'HEAD',   # optional chain (安全側)
    19: 'MAIN',   # buyItem with clickPos and sound (mainの新機能)
    20: 'MAIN',   # upgradeableTokens (mainが正しい)
    21: 'MAIN',   # enchant grant (mainの実装)
    22: 'MAIN',   # enchant grant (mainの実装)
    23: 'MAIN',   # 購入完了後の処理 (mainが詳細)
    24: 'MAIN',   # buyItem拡張
    25: 'HEAD',   # buyAwakeningItem with isMultiTest check (テスト用)
    26: 'MAIN',   # activeCount (mainが正しい)
    27: 'HEAD',   # aiControlRef (テスト専用)
    28: 'MAIN',   # UI表示 (mainの更新)
    29: 'HEAD',   # id属性 (テスト専用)
}

# 逆順で置換（位置がずれないように後ろから処理）
result = content
for i, m in enumerate(reversed(conflicts)):
    idx = len(conflicts) - i  # 1始まりのインデックス
    strategy = strategies.get(idx, 'MAIN')
    head = m.group(1)
    main = m.group(2)
    
    if strategy == 'HEAD':
        replacement = head
    elif strategy == 'MAIN':
        replacement = main
    elif strategy == 'BOTH':
        # 両方を改行で結合（重複を避けながら）
        replacement = head + '\n' + main
    else:
        replacement = main  # デフォルト
    
    # コンフリクトマーカー全体を置換
    result = result[:m.start()] + replacement + result[m.end():]

# コンフリクトマーカーが残っていないか確認
remaining = re.findall(r'<<<<<<< HEAD', result)
print(f"Remaining conflicts: {len(remaining)}")

with open('src/App.jsx', 'w') as f:
    f.write(result)

print("Done! App.jsx conflict resolved.")
