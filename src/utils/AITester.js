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
    const matched = Array.from({ length: rows }, () => Array(cols).fill(false));
    const prefColorTypes = (this.preferredColors || []).map(idx => basicTypes[idx]);

    // 1. マッチ判定 (水平・垂直)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - minMatchLength; c++) {
        const orb = state[r][c];
        if (!orb || (basicTypes.indexOf(orb.type) === -1 && !orb.isRainbow)) continue;
        const color = orb.isRainbow ? "rainbow" : orb.type;
        let matchLen = 1;
        for (let k = 1; c + k < cols; k++) {
          const nextOrb = state[r][c + k];
          if (!nextOrb) break;
          const nextColor = nextOrb.isRainbow ? "rainbow" : nextOrb.type;
          if (color !== "rainbow" && nextColor !== "rainbow" && nextColor !== color) break;
          matchLen++;
        }
        if (matchLen >= minMatchLength) {
          for (let k = 0; k < matchLen; k++) matched[r][c + k] = true;
        }
      }
    }
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r <= rows - minMatchLength; r++) {
        const orb = state[r][c];
        if (!orb || (basicTypes.indexOf(orb.type) === -1 && !orb.isRainbow)) continue;
        const color = orb.isRainbow ? "rainbow" : orb.type;
        let matchLen = 1;
        for (let k = 1; r + k < rows; k++) {
          const nextOrb = state[r + k][c];
          if (!nextOrb) break;
          const nextColor = nextOrb.isRainbow ? "rainbow" : nextOrb.type;
          if (color !== "rainbow" && nextColor !== "rainbow" && nextColor !== color) break;
          matchLen++;
        }
        if (matchLen >= minMatchLength) {
          for (let k = 0; k < matchLen; k++) matched[r + k][c] = true;
        }
      }
    }

    // 2. 連結成分の抽出 (実際のコンボ数カウント)
    let comboCount = 0;
    let totalMatchedOrbs = 0;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let prefBonus = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matched[r][c] && !visited[r][c]) {
          comboCount++;
          // BFSで連結成分を特定
          const q = [{ r, c }];
          visited[r][c] = true;
          let size = 0;
          while (q.length > 0) {
            const curr = q.shift();
            size++;
            totalMatchedOrbs++;
            
            const orb = state[curr.r][curr.c];
            const type = orb.isRainbow ? "rainbow" : orb.type;
            if (prefColorTypes.includes(type) || type === "rainbow") prefBonus += 2;

            const neighbors = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for (const [dr, dc] of neighbors) {
              const nr = curr.r + dr, nc = curr.c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && matched[nr][nc] && !visited[nr][nc]) {
                visited[nr][nc] = true;
                q.push({ r: nr, c: nc });
              }
            }
          }
        }
      }
    }

    if (comboCount === 0) return 0;
    
    // スコア計算: (コンボ数 ^ 1.8) * 10 + 消去数 + 優先属性ボーナス
    return Math.pow(comboCount, 1.8) * 20 + totalMatchedOrbs + prefBonus;
  }

  // 最適な経路を見つける
  findBestPath() {
    if (!this.engine || !this.engine.state || this.engine.state.length === 0) return [];
    
    const rows = this.engine.rows;
    const cols = this.engine.cols;
    const minMatchLength = this.engine.minMatchLength || 3;
    const state = this.engine.state;
    if (!state[0]) return []; // Check for first row existence
    
    let bestScore = -1;
    let bestPath = [];

    // N回ランダムウォークして一番スコアが高いものを採用
    // 試行回数と手数を増やし、より高度な経路を発見可能にする
    const ITERATIONS = 1500;
    const MAX_STEPS = 70;     // 移動距離をさらに強化

    for (let i = 0; i < ITERATIONS; i++) {
        const sr = Math.floor(Math.random() * rows);
        const sc = Math.floor(Math.random() * cols);
        const path = [{ r: sr, c: sc }];
        
        // Random walk
        for (let step = 0; step < MAX_STEPS; step++) {
            const curr = path[path.length - 1];
            const dirs = [[0,1], [1,0], [0,-1], [-1,0]];
            // Filter valid moves
            const validDirs = dirs.filter(([dr, dc]) => {
                const nr = curr.r + dr;
                const nc = curr.c + dc;
                return nr >= 0 && nr < rows && nc >= 0 && nc < cols;
            });
            if (validDirs.length === 0) break;
            const [dr, dc] = validDirs[Math.floor(Math.random() * validDirs.length)];
            path.push({ r: curr.r + dr, c: curr.c + dc });
        }

        const newState = this.applyPath(state, path);
        let score = this.evaluateBoard(newState, minMatchLength, cols, rows);
        
        // 移動距離ペナルティを軽減（長い方がコンボは組みやすいため）
        score -= path.length * 0.05;

        if (score > bestScore) {
            bestScore = score;
            bestPath = path;
        }
    }

    // fallback if no good path
    if (bestPath.length === 0) {
        bestPath = [{r: 0, c: 0}, {r: 0, c: 1}]; // just move one
    }
    
    return bestPath;
  }

  async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 見つけた経路を実際にPuzzleEngineのイベントを使って再生する
  async executeTurn() {
    if (!this.isPlaying || this._abort || !this.engine) return;
    if (this.engine.processing || this.isExecuting) return; // 処理中なら待つ

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

    try {
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
