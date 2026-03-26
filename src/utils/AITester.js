export class AITester {
  constructor(engine) {
    this.engine = engine;
    this.isPlaying = false;
    this._abort = false;
    this.isExecuting = false;
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

  // 仮想盤面内のコンボ数を計算する (test_find_combos.cjs のロジックを簡略化)
  evaluateBoard(state, minMatchLength, cols, rows) {
    let score = 0;
    const basicTypes = ["fire", "water", "wood", "light", "dark", "heart"];
    const matched = Array.from({ length: rows }, () => Array(cols).fill(false));

    // Horizontal matches
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - minMatchLength; c++) {
        const orb = state[r][c];
        if (!orb || (basicTypes.indexOf(orb.type) === -1 && !orb.isRainbow)) continue;
        const color = orb.isRainbow ? "rainbow" : orb.type;
        
        let isMatch = true;
        for (let k = 1; k < minMatchLength; k++) {
          const nextOrb = state[r][c + k];
          if (!nextOrb) { isMatch = false; break; }
          const nextColor = nextOrb.isRainbow ? "rainbow" : nextOrb.type;
          // rainbow matches anything, or color matches color
          if (color !== "rainbow" && nextColor !== "rainbow" && nextColor !== color) {
             isMatch = false; break;
          }
        }
        if (isMatch) {
            for (let k = 0; k < minMatchLength; k++) matched[r][c + k] = true;
            score += 10;
        }
      }
    }

    // Vertical matches
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r <= rows - minMatchLength; r++) {
        const orb = state[r][c];
        if (!orb || (basicTypes.indexOf(orb.type) === -1 && !orb.isRainbow)) continue;
        const color = orb.isRainbow ? "rainbow" : orb.type;
        
        let isMatch = true;
        for (let k = 1; k < minMatchLength; k++) {
          const nextOrb = state[r + k][c];
          if (!nextOrb) { isMatch = false; break; }
          const nextColor = nextOrb.isRainbow ? "rainbow" : nextOrb.type;
          if (color !== "rainbow" && nextColor !== "rainbow" && nextColor !== color) {
             isMatch = false; break;
          }
        }
        if (isMatch) {
            for (let k = 0; k < minMatchLength; k++) matched[r + k][c] = true;
            score += 10;
        }
      }
    }

    // 評価を強化：複数のコンボが繋がる場合、その数の2乗でスコアを倍増させる（同時消しの価値を高める）
    if (score > 0) {
        // score / 10 は見つけたコンボの数
        const comboCount = score / 10;
        return score * Math.pow(1.5, comboCount - 1);
    }
    return score;
  }

  // 最適な経路（簡単なランダムウォーク＋評価によるヒューリスティック）を見つける
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
    const ITERATIONS = 800;
    const MAX_STEPS = 25;

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
        
        // 追加: 移動距離が短くてスコアが高いルートをわずかに優遇するため、手数によるペナルティを課す
        score -= path.length * 0.1;

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
}
