export class AITester {
  constructor(engine) {
    this.engine = engine;
    this.isPlaying = false;
    this._abort = false;
    this.isExecuting = false;
  }

  // 外部から状態を同期させる
  updateState(data) {
    Object.assign(this, data);
  }

  // AIループ開始
  start() {
    this.isPlaying = true;
    this._abort = false;
  }

  // AIループ停止
  stop() {
    this.isPlaying = false;
    this._abort = true;
  }

  // 現在の盤面をディープコピーするユーティリティ
  cloneState(state) {
    return state.map(row => row.map(orb => orb ? { ...orb } : null));
  }

  // 経路 (path = [{r,c}, {r,c}, ...]) に従って仮想盤面をスワップした結果を返す
  applyPath(state, path) {
    const newState = this.cloneState(state);
    if (path.length === 0) return newState;

    for (let i = 0; i < path.length - 1; i++) {
        const curr = path[i];
        const next = path[i+1];
        const temp = newState[curr.r][curr.c];
        newState[curr.r][curr.c] = newState[next.r][next.c];
        newState[next.r][next.c] = temp;
    }
    return newState;
  }

  // 仮想盤面内のコンボ数を計算する
  evaluateBoard(state, minMatchLength, cols, rows) {
    const basicTypes = ["fire", "water", "wood", "light", "dark", "heart"];
    const prefColorTypes = (this.preferredColors || []).map(idx => basicTypes[idx]);
    let comboCount = 0;
    let totalMatchedOrbs = 0;
    let prefBonus = 0;

    // 各属性（色）ごとに独立してマッチ判定と連結抽出を行う
    for (const color of basicTypes) {
      const matched = Array.from({ length: rows }, () => Array(cols).fill(false));

      // 1. マッチ判定 (水平)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= cols - minMatchLength; c++) {
          const orb = state[r][c];
          if (!orb || (orb.type !== color && !orb.isRainbow)) continue;

          let isMatch = true;
          for (let k = 1; k < minMatchLength; k++) {
            const nextOrb = state[r][c + k];
            if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            for (let k = 0; k < minMatchLength; k++) matched[r][c + k] = true;
            let k = c + minMatchLength;
            while (k < cols && state[r][k] && (state[r][k].type === color || state[r][k].isRainbow)) {
              matched[r][k++] = true;
            }
          }
        }
      }

      // 2. マッチ判定 (垂直)
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r <= rows - minMatchLength; r++) {
          const orb = state[r][c];
          if (!orb || (orb.type !== color && !orb.isRainbow)) continue;

          let isMatch = true;
          for (let k = 1; k < minMatchLength; k++) {
            const nextOrb = state[r + k][c];
            if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            for (let k = 0; k < minMatchLength; k++) matched[r + k][c] = true;
            let k = r + minMatchLength;
            while (k < rows && state[k][c] && (state[k][c].type === color || state[k][c].isRainbow)) {
              matched[k++][c] = true;
            }
          }
        }
      }

      // 3. 連結成分の抽出 (実際のコンボ数カウント)
      const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (matched[r][c] && !visited[r][c]) {
            comboCount++;
            
            // BFSで連結成分を特定
            const q = [{ r, c }];
            visited[r][c] = true;
            let hasBomb = false;
            let groupColor = null;

            while (q.length > 0) {
              const curr = q.shift();
              totalMatchedOrbs++;

              const orb = state[curr.r][curr.c];
              if (orb.isBomb) {
                hasBomb = true;
                groupColor = orb.type;
              }
              if (orb.isStar) prefBonus += 50; // スタードロップは優先的に消す

              const type = orb.isRainbow ? "rainbow" : orb.type;
              if (prefColorTypes.includes(type) || type === "rainbow") prefBonus += 2;

              const neighbors = [[0, 1], [1, 0], [0, -1], [-1, 0]];
              for (const [dr, dc] of neighbors) {
                const nr = curr.r + dr, nc = curr.c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && matched[nr][nc] && !visited[nr][nc]) {
                  // 同色または虹色の場合のみ同じグループとして繋げる
                  if (state[nr][nc].type === color || state[nr][nc].isRainbow) {
                    visited[nr][nc] = true;
                    q.push({ r: nr, c: nc });
                  }
                }
              }
            }

            // ボムが含まれる場合、同色の他ドロップもスコアに加重
            if (hasBomb && groupColor) {
              for (let br = 0; br < rows; br++) {
                for (let bc = 0; bc < cols; bc++) {
                  const bOrb = state[br][bc];
                  if (bOrb && bOrb.type === groupColor && !matched[br][bc]) {
                    totalMatchedOrbs += 0.8; // 同色全消しの擬似評価
                  }
                }
              }
              prefBonus += 30; // ボム起爆自体のボーナス
            }
          }
        }
      }
    }

    // 4. 隣接ボーナス (コンボになっていなくても、同じ色が隣り合っている状態をわずかに評価する)
    let adjacencyBonus = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const orb1 = state[r][c];
        const orb2 = state[r][c + 1];
        if (orb1 && orb2 && !orb1.isRainbow && !orb2.isRainbow && orb1.type === orb2.type) {
          adjacencyBonus += 0.2;
        }
      }
    }
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows - 1; r++) {
        const orb1 = state[r][c];
        const orb2 = state[r + 1][c];
        if (orb1 && orb2 && !orb1.isRainbow && !orb2.isRainbow && orb1.type === orb2.type) {
          adjacencyBonus += 0.2;
        }
      }
    }

    if (comboCount === 0) return adjacencyBonus;

    // スコア計算: (コンボ数 ^ 1.8) * 20 + 消去数 + 優先属性ボーナス + 隣接ボーナス
    return Math.pow(comboCount, 1.8) * 20 + totalMatchedOrbs + prefBonus + adjacencyBonus;
  }

  // 最適な経路を見つける (ビームサーチ版)
  findBestPath() {
    if (!this.engine || !this.engine.state || this.engine.state.length === 0) return [];
    
    const rows = this.engine.rows;
    const cols = this.engine.cols;
    const minMatchLength = this.engine.minMatchLength || 3;
    const initialState = this.engine.state;
    if (!initialState[0]) return []; // 最初の行が存在するかチェック
    
    const isMulti = this.isMultiTest;
    // マルチテスト時と通常プレイ時で探索パラメータを動的に調整
    const BEAM_WIDTH = isMulti ? 15 : 40;
    const MAX_STEPS = isMulti ? 25 : 35;
    
    // 開始点の決定
    const startPoints = [];
    if (isMulti) {
      // 10分割テスト時はCPU負荷を抑えるためにランダムに8箇所選ぶ
      const count = 8;
      const allCoords = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          allCoords.push({ r, c });
        }
      }
      // シャッフルして8点抽出
      for (let i = allCoords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = allCoords[i];
        allCoords[i] = allCoords[j];
        allCoords[j] = temp;
      }
      for (let i = 0; i < Math.min(count, allCoords.length); i++) {
        startPoints.push(allCoords[i]);
      }
    } else {
      // 通常プレイ時は全マスを開始点とする
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          startPoints.push({ r, c });
        }
      }
    }

    // ビームサーチのデータ構造:
    // {
    //   path: [{r, c}, ...],
    //   board: state, // このパス適用後の盤面状態 (キャッシュ)
    //   score: number
    // }
    let beams = startPoints.map(pt => {
      const path = [pt];
      const board = this.cloneState(initialState);
      const score = this.evaluateBoard(board, minMatchLength, cols, rows);
      return { path, board, score };
    });

    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    // 各ステップでビームを伸ばしていく
    for (let step = 0; step < MAX_STEPS; step++) {
      const nextCandidates = [];

      for (const beam of beams) {
        const curr = beam.path[beam.path.length - 1];
        const prev = beam.path.length > 1 ? beam.path[beam.path.length - 2] : null;

        for (const [dr, dc] of dirs) {
          const nr = curr.r + dr;
          const nc = curr.c + dc;

          // 境界内チェック
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          // 直前のマスに戻るUターンはスキップ
          if (prev && prev.r === nr && prev.c === nc) continue;

          // パスのコピーと拡張
          const newPath = [...beam.path, { r: nr, c: nc }];

          // 親の盤面状態をクローンし、最後の1マスだけスワップを適用 (O(1)スワップで高速化)
          const newBoard = this.cloneState(beam.board);
          const temp = newBoard[curr.r][curr.c];
          newBoard[curr.r][curr.c] = newBoard[nr][nc];
          newBoard[nr][nc] = temp;

          // 盤面の評価
          let score = this.evaluateBoard(newBoard, minMatchLength, cols, rows);

          // 移動距離に対するわずかなペナルティ (無駄な動きを抑制)
          score -= newPath.length * 0.05;

          nextCandidates.push({
            path: newPath,
            board: newBoard,
            score: score
          });
        }
      }

      if (nextCandidates.length === 0) break;

      // 重複排除 (同じ末尾位置で同じ評価スコアの候補を刈り取り、ビーム内の多様性を維持)
      const seen = new Set();
      const uniqueCandidates = [];
      for (const cand of nextCandidates) {
        const last = cand.path[cand.path.length - 1];
        const key = `${last.r},${last.c},${cand.score.toFixed(2)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCandidates.push(cand);
        }
      }

      // スコアの高い順にソート
      uniqueCandidates.sort((a, b) => b.score - a.score);

      // 上位 K 個を次のビーム候補とする
      beams = uniqueCandidates.slice(0, BEAM_WIDTH);
    }

    if (beams.length === 0) {
      return [{ r: 0, c: 0 }, { r: 0, c: 1 }]; // フォールバック
    }

    // 最もスコアの高い経路を返す
    beams.sort((a, b) => b.score - a.score);
    return beams[0].path;
  }

  async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 見つけた経路を実際にPuzzleEngineのイベントを使って再生する
  async executeTurn() {
    if (!this.isPlaying || this._abort || !this.engine) return;
    if (this.engine.processing || this.isExecuting) return; // 処理中なら待つ

    try {
        this.isExecuting = true;
        
        // AIの「優先属性」を更新
        this.preferredColors = this.preferredColors || [];
        if (this.engine.tokens) {
          const newPref = [];
          this.engine.tokens.forEach(t => {
            if (!t) return;
            const name = t.name || "";
            const effect = t.effect || "";
            const combined = (name + effect).toLowerCase();
            
            if (combined.includes("炎") || combined.includes("火") || combined.includes("fire") || combined.includes("赤")) newPref.push(0);
            if (combined.includes("水") || combined.includes("青") || combined.includes("water") || combined.includes("ice")) newPref.push(1);
            if (combined.includes("風") || combined.includes("緑") || combined.includes("wind") || combined.includes("green")) newPref.push(2);
            if (combined.includes("光") || combined.includes("黄") || combined.includes("light") || combined.includes("yellow")) newPref.push(3);
            if (combined.includes("闇") || combined.includes("紫") || combined.includes("dark") || combined.includes("shadow")) newPref.push(4);
            if (combined.includes("命") || combined.includes("ハート") || combined.includes("heart") || combined.includes("heal")) newPref.push(5);
          });
          this.preferredColors = [...new Set(newPref)];
        }

        const path = this.findBestPath();
        if (path.length === 0) return;

        const startNode = path[0];
        if (!this.engine.state[startNode.r]) return;
        const targetOrb = this.engine.state[startNode.r][startNode.c];
        if (!targetOrb) return;

        // Simulate mouse down
        this.engine.onStart({ type: 'mousedown' }, targetOrb);
        
        await this.sleep(150); // Wait a bit before moving

        const rect = this.engine.container.getBoundingClientRect();

        // Iterate through the path and simulate mouse move
        for (let i = 1; i < path.length; i++) {
            if (this._abort || !this.engine.dragging) break;
            
            const node = path[i];
            
            // Calculate center of target cell
            const targetX = rect.left + (node.c * (this.engine.orbSize + this.engine.gap)) + this.engine.orbSize / 2;
            const targetY = rect.top + (node.r * (this.engine.orbSize + this.engine.gap)) + this.engine.orbSize / 2;

            const fakeEvent = {
                type: 'mousemove',
                clientX: targetX,
                clientY: targetY,
                preventDefault: () => {}
            };
            
            this.engine.onMove(fakeEvent);
            await this.sleep(40); // speed of dragging
        }

        // Simulate mouse up
        if (this.engine.dragging && !this._abort) {
            this.engine.onEnd();
        }
    } finally {
        this.isExecuting = false;
    }
  }

  // UI要素をクリックする（実際の座標を使ってイベントを発火）
  clickUIElement(id) {
    const el = document.getElementById(id);
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const mouseDown = new MouseEvent('mousedown', {
      clientX: x, clientY: y, view: window, bubbles: true, cancelable: true
    });
    const mouseUp = new MouseEvent('mouseup', {
      clientX: x, clientY: y, view: window, bubbles: true, cancelable: true
    });
    const click = new MouseEvent('click', {
      clientX: x, clientY: y, view: window, bubbles: true, cancelable: true
    });

    el.dispatchEvent(mouseDown);
    el.dispatchEvent(mouseUp);
    el.dispatchEvent(click);
    
    // ReactのonClickイベントを確実に発火させるため
    if (el.click) el.click();
    
    return true;
  }
}
