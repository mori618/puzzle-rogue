import { MAX_COMBO, MAX_TARGET } from '../constants/gameConstants.js';

// --- Puzzle Engine (Imperative Logic) ---
// --- Puzzle Engine (Imperative Logic) ---
class PuzzleEngine {
  constructor(container, timerBar, comboEl, options = {}) {
    this.container = container;
    this.timerBar = timerBar;
    this.comboEl = comboEl;
    this.rows = options.rows || 5;
    this.cols = options.cols || 6;
    this.timeLimit = options.timeLimit || 5000;
    this.minMatchLength = options.minMatchLength || 3;
    this.onTurnEnd = options.onTurnEnd || (() => { });
    this.onCombo = options.onCombo || (() => { });
    this.onPassiveTrigger = options.onPassiveTrigger || null;
    this.onStarErase = options.onStarErase || null;
    this.totalMoveTimeRef = options.totalMoveTimeRef || { current: 0 }; // 操作時間加算用Ref

    // Will be calculated in init()
    this.orbSize = 0;
    this.gap = 0; // Will be set relative to orb size or container

    this.types = ["fire", "water", "wood", "light", "dark", "heart"];
    this.icons = {
      fire: "local_fire_department",
      water: "water_drop",
      wood: "grass",
      light: "light_mode",
      dark: "dark_mode",
      heart: "favorite",
    };

    this.state = [];
    this.dragging = null;
    this.moveStart = null;
    this.timerId = null;
    this.processing = false;
    this.currentCombo = 0;
    this.noSkyfall = false;
    this.spawnWeights = {};
    this.types.forEach((t) => (this.spawnWeights[t] = 1));
    this.timerProgress = 1; // Added for external display

    // Bindings
    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.updateTimer = this.updateTimer.bind(this);

    this._isDestroyed = false;
    this._rafId = null; // requestAnimationFrame ID
    this.realtimeBonuses = {
      len4: 0,
      row: 0,
      l_shape: 0,
      rainbow_combo_bonus: 0,
      heart_combo: 0,
      skyfall_bonus: 0,
      enhancedOrbBonus: 0,
      rainbow: 0,
      skyfall: 0
    };
    this.enhanceRates = { global: [], colors: {} };
    this.rainbowRates = []; // chance to spawn rainbow drop
    this.chronosStopActive = false;
    this.chronosTimerId = null;
  }

  setRealtimeBonuses(bonuses) {
    this.realtimeBonuses = { len4: 0, row: 0, l_shape: 0, ...bonuses };
  }

  setEnhanceRates(rates) {
    this.enhanceRates = rates;
  }

  setBombRates(rates) {
    this.bombRates = rates;
  }

  setRainbowRates(rates) {
    this.rainbowRates = rates;
  }

  addPlusMark(el) {
    if (el.querySelector('.enhanced-mark')) return;
    const enhancedMark = document.createElement('div');
    enhancedMark.className = "enhanced-mark absolute top-0 right-0 w-4 h-4 bg-yellow-400 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white";
    enhancedMark.innerText = '+';
    el.appendChild(enhancedMark);
  }

  /** 現在の盤面状態をシリアライズ可能なオブジェクトとして取得 */
  getState() {
    return this.state.map(row =>
      row.map(orb => {
        if (!orb) return null;
        return {
          type: orb.type,
          isEnhanced: !!orb.isEnhanced,
          isBomb: !!orb.isBomb,
          isRepeat: !!orb.isRepeat,
          isRainbow: !!orb.isRainbow,
          rainbowCount: orb.rainbowCount,
          isStar: !!orb.isStar,
        };
      })
    );
  }

  init(initialState = null) {
    if (this.processing) return;
    this._isDestroyed = false;

    this.gap = 8;
    // Calculate responsive orb size
    const rect = this.container.getBoundingClientRect();
    if (rect.width > 0) {
      this.orbSize = (rect.width - (this.cols - 1) * this.gap) / this.cols;
    } else {
      // Fallback
      this.orbSize = 60;
    }

    // Ensure height matches grid
    // Important: container height should not force layout shift if possible, but for absolute positioning we need it?
    // Actually, App.jsx sets aspect-ratio, so height is already determined by CSS.
    // We just need to make sure we don't overflow.

    this.state = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(null);
      }
      this.state.push(row);
    }
    this.container.innerHTML = "";
    this.currentCombo = 0;
    if (this.comboEl) {
      this.comboEl.innerText = "";
      this.comboEl.style.display = "none";
    }

    if (initialState && Array.isArray(initialState)) {
      // 保存された状態から復元
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const savedOrb = initialState[r] && initialState[r][c];
          if (savedOrb) {
            this.spawnOrb(r, c, false, 0, savedOrb);
          }
        }
      }
    } else {
      // 新規盤面を生成
      this.spawnInitialBoard();
    }
    this.render();

    // Resize listener with debounce
    if (!this.resizeListener) {
      this.resizeListener = this.handleResize.bind(this);
      window.addEventListener('resize', this.resizeListener);
    }
  }

  // 初期盤面を生成する（マッチを避けてオーブを配置）
  spawnInitialBoard() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.spawnOrb(r, c, false);
      }
    }
  }

  handleResize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width <= 0) return;

    this.gap = 8;
    this.orbSize = (rect.width - (this.cols - 1) * this.gap) / this.cols;
    // リサイズ時はbaseTop/baseLeftも再計算
    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb) {
          orb.baseTop = (r * (this.orbSize + this.gap));
          orb.baseLeft = (c * (this.orbSize + this.gap));
          orb.el.style.width = `${this.orbSize}px`;
          orb.el.style.height = `${this.orbSize}px`;
          orb.el.style.top = `${orb.baseTop}px`;
          orb.el.style.left = `${orb.baseLeft}px`;
          orb.el.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    });
  }



  spawnOrb(r, c, isNew, startRowOffset = 0, savedData = null) {
    let type;
    if (savedData) {
      type = savedData.type;
    } else if (!isNew) {
      let availableTypes = [...this.types];
      while (availableTypes.length > 0) {
        const idx = Math.floor(Math.random() * availableTypes.length);
        type = availableTypes[idx];
        let matchHorizontal = false;
        if (c >= this.minMatchLength - 1) {
          matchHorizontal = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            if (this.state[r][c - k]?.type !== type) {
              matchHorizontal = false;
              break;
            }
          }
        }
        let matchVertical = false;
        if (r >= this.minMatchLength - 1) {
          matchVertical = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            if (this.state[r - k][c]?.type !== type) {
              matchVertical = false;
              break;
            }
          }
        }
        if (!matchHorizontal && !matchVertical) break;
        else availableTypes.splice(idx, 1);
      }
      if (!type)
        type = this.types[Math.floor(Math.random() * this.types.length)]; // Fallback
    } else {
      // Weighted Random
      const weights = this.spawnWeights || {};
      const totalWeight = this.types.reduce(
        (acc, t) => acc + (weights[t] || 0),
        0,
      );
      let rVal = Math.random() * totalWeight;
      for (const t of this.types) {
        rVal -= weights[t] || 0;
        if (rVal <= 0) {
          type = t;
          break;
        }
      }
      if (!type) type = this.types[0];
    }

    const el = document.createElement("div");
    el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;

    const inner = document.createElement("div");
    inner.className = `orb-inner orb-${type} shadow-lg`;

    // 虹ドロップかどうか（スキル等で確定生成する場合はtypeが'rainbow'で来るか、isNewのパッシブ判定）
    let isRainbow = false;
    let rainbowCount = 3;
    if (savedData && savedData.isRainbow) {
      isRainbow = true;
      rainbowCount = savedData.rainbowCount || 3;
      type = "heart"; // 内部的なフォールバック（表示用）
      inner.className = `orb-inner orb-rainbow shadow-lg`;
    } else if (type === "rainbow") {
      isRainbow = true;
      type = "heart"; // 内部的なフォールバック（表示用）
      inner.className = `orb-inner orb-rainbow shadow-lg`;
    } else if (isNew && this.rainbowRates && Array.isArray(this.rainbowRates) && this.rainbowRates.length > 0) {
      for (const rate of this.rainbowRates) {
        if (Math.random() < rate.value) {
          isRainbow = true;
          inner.className = `orb-inner orb-rainbow shadow-lg`;
          if (this.onPassiveTrigger && rate.tokenId) {
            this.onPassiveTrigger(rate.tokenId);
          }
          break;
        }
      }
    }

    const iconSpan = document.createElement("span");
    iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
    iconSpan.innerText = isRainbow ? "" : this.icons[type];

    if (isRainbow) {
      const countSpan = document.createElement("span");
      countSpan.className = "rainbow-count-text text-white font-bold text-xl drop-shadow-md select-none";
      countSpan.innerText = rainbowCount;
      inner.appendChild(countSpan);
    } else {
      inner.appendChild(iconSpan);
    }
    el.appendChild(inner);

    // ボムかどうか
    let isBomb = false;
    if (savedData && savedData.isBomb) {
      isBomb = true;
    } else if (isNew && this.bombRates && this.bombRates.colors && this.bombRates.colors[type]) {
      const rates = this.bombRates.colors[type];
      for (const tokenRate of rates) {
        if (Math.random() < tokenRate.value) {
          isBomb = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break; // Avoid triggering multiple times if we only need one bomb
        }
      }
    }

    // リピートドロップかどうか
    let isRepeat = false;
    if (savedData && savedData.isRepeat) {
      isRepeat = true;
    } else if (isNew && this.repeatRates && this.repeatRates.colors && this.repeatRates.colors[type]) {
      const rates = this.repeatRates.colors[type];
      for (const tokenRate of rates) {
        if (Math.random() < tokenRate.value) {
          isRepeat = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break;
        }
      }
    }

    // スタードロップかどうか（スキル等で確定生成する場合はtypeが'star'で来るか、isNewのパッシブ判定）
    let isStar = false;
    if (savedData && savedData.isStar) {
      isStar = true;
    } else if (type === "star") {
      isStar = true;
      type = this.types[Math.floor(Math.random() * this.types.length)]; // ランダムな色にする
    } else if (isNew && this.starRates && this.starRates.colors && this.starRates.colors[type]) {
      const rates = this.starRates.colors[type];
      for (const tokenRate of rates) {
        if (Math.random() < tokenRate.value) {
          isStar = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break;
        }
      }
    }

    // 基準位置を設定（top/leftは一度だけ設定し、以降transformで移動）
    const baseTop = (r * (this.orbSize + this.gap));
    const baseLeft = (c * (this.orbSize + this.gap));
    el.style.width = `${this.orbSize}px`;
    el.style.height = `${this.orbSize}px`;
    el.style.top = `${baseTop}px`;
    el.style.left = `${baseLeft}px`;

    const isEnhanced = savedData ? !!savedData.isEnhanced : false;
    const orb = { type, el, r, c, isSkyfall: isNew, baseTop, baseLeft, isEnhanced, isBomb, isRepeat, isStar, isRainbow, rainbowCount };

    if (isBomb) {
      this.addBombMark(el);
    }
    if (isRepeat) {
      this.addRepeatMark(el);
    }
    if (isStar) {
      this.addStarMark(el);
    }
    if (isEnhanced) {
      this.addPlusMark(el);
    }

    const handler = (e) => {
      if (e.type === "touchstart") e.preventDefault();
      // 修正: クロージャの r, c ではなく、orb オブジェクトを直接渡す
      this.onStart(e.type === "touchstart" ? e.touches[0] : e, orb);
    };
    el.onmousedown = handler;
    el.ontouchstart = handler;

    // 強化ドロップ判定（新規生成時のみ）
    if (isNew && this.enhanceRates) {
      let enhanced = false;
      const globalRates = this.enhanceRates.global || [];
      const colorRates = this.enhanceRates.colors?.[type] || [];
      const combinedRates = [...globalRates, ...colorRates];

      for (const tokenRate of combinedRates) {
        if (Math.random() < tokenRate.value) {
          enhanced = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break;
        }
      }

      if (enhanced) {
        orb.isEnhanced = true;
        this.addPlusMark(el);
      }
    }

    this.state[r][c] = orb;
    this.container.appendChild(el);

    if (isNew) {
      // 新規オーブ: 盤面外(上方)からの落下アニメーション
      const offsetY = -((startRowOffset + 1) * (this.orbSize + this.gap));
      // transitionなしで上方にセット
      el.style.transition = 'none';
      el.style.transform = `translate3d(0, ${offsetY}px, 0)`;
      el.classList.add('orb-falling');
    }
  }

  render(animClass = '') {
    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb && orb !== this.dragging) {
          const targetTop = (r * (this.orbSize + this.gap));
          const targetLeft = (c * (this.orbSize + this.gap));
          // transformで移動量を計算
          const dx = targetLeft - orb.baseLeft;
          const dy = targetTop - orb.baseTop;
          // transitionを有効化してからtransformを設定
          orb.el.style.transition = '';
          if (animClass) {
            orb.el.classList.add(animClass);
          }
          orb.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
          orb.r = r;
          orb.c = c;
        }
      });
    });
  }

  onStart(e, orbOrR, c) {
    if (this.processing) return;

    let target;
    if (typeof orbOrR === 'object') {
      target = orbOrR;
    } else {
      // Fallback (old signature support)
      target = this.state[orbOrR][c];
    }

    if (!target) return;

    this.dragging = target;
    this.dragging.el.classList.add("orb-grabbing");
    this.dragging.el.style.zIndex = "100";

    if (this.comboEl) this.comboEl.style.display = "none";

    this.moveStart = null;
    this._lastMovePoint = null; // rAF用

    // クロノス・ストップ中はタイマーを起動しない
    if (!this.chronosStopActive) {
      // 通常モード
    }

    window.addEventListener("mousemove", this.onMove);
    window.addEventListener("mouseup", this.onEnd);
    window.addEventListener("touchmove", this.onMove, { passive: false });
    window.addEventListener("touchend", this.onEnd);
  }

  onMove(e) {
    if (!this.dragging) return;
    if (e.type === "touchmove") e.preventDefault();

    const point =
      e.type === "touchmove" || e.type === "touchstart" ? e.touches[0] : e;

    // rAFでドラッグ位置を更新（フレームに同期して滑らかに追従）
    this._lastMovePoint = { clientX: point.clientX, clientY: point.clientY };

    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        if (!this.dragging || !this._lastMovePoint) return;

        const rect = this.container.getBoundingClientRect();
        const x = this._lastMovePoint.clientX - rect.left;
        const y = this._lastMovePoint.clientY - rect.top;

        // ドラッグ中のオーブの位置をtransformで直接設定
        const dx = x - this.orbSize / 2 - this.dragging.baseLeft;
        const dy = y - this.orbSize / 2 - this.dragging.baseTop;
        this.dragging.el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.2)`;

        const nr = Math.max(
          0,
          Math.min(this.rows - 1, Math.floor(y / (this.orbSize + this.gap))),
        );
        const nc = Math.max(
          0,
          Math.min(this.cols - 1, Math.floor(x / (this.orbSize + this.gap))),
        );

        if (nr !== this.dragging.r || nc !== this.dragging.c) {
          // Start timer only when the orb is actually moved to another cell
          if (!this.moveStart) {
            this.moveStart = Date.now();
            this.timerId = setInterval(this.updateTimer, 20);
          }

          const target = this.state[nr][nc];
          this.state[nr][nc] = this.dragging;
          this.state[this.dragging.r][this.dragging.c] = target;

          target.r = this.dragging.r;
          target.c = this.dragging.c;
          this.dragging.r = nr;
          this.dragging.c = nc;

          // 入れ替わるオーブにスワップアニメーションクラスを付与
          if (target && target.el) {
            target.el.classList.add('orb-swapping');
            setTimeout(() => {
              if (target && target.el) target.el.classList.remove('orb-swapping');
            }, 160);
          }
          this.render(); // Update positions
        }
      });
    }
  }

  updateTimer() {
    const elapsed = Date.now() - this.moveStart;
    const remain = Math.max(0, this.timeLimit - elapsed);
    this.timerProgress = remain / this.timeLimit; // Update progress for external display
    // If timerBar exists (it might not in new design), update it
    if (this.timerBar) {
      this.timerBar.style.width = `${this.timerProgress * 100}%`;
    }
    if (remain <= 0) this.onEnd();
  }

  onEnd() {
    if (!this.dragging) return;
    clearInterval(this.timerId);
    this.timerProgress = 1; // Reset progress
    if (this.timerBar) this.timerBar.style.width = "100%";

    // rAFをキャンセル
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastMovePoint = null;

    this.dragging.el.classList.remove("orb-grabbing");
    this.dragging.el.style.zIndex = "";
    this.dragging = null;

    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);

    // --- 操作時間の計測と記録 ---
    if (this.moveStart) {
      const elapsed = Date.now() - this.moveStart;
      this.totalMoveTimeRef.current += elapsed;
    }

    this.render();

    // クロノス・ストップ中はprocess()に進まない
    if (this.chronosStopActive) {
      return;
    }

    // 修正: 動かしていない（スワップしていない）場合はターンを進めない
    // moveStart はスワップが発生した時点でセットされる
    if (!this.moveStart) {
      return;
    }

    this.process();
  }

  setSpawnWeights(weights) {
    this.spawnWeights = { ...weights };
  }

  // --- Skill Actions ---
  convertColor(fromType, toType) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && orb.type === fromType) {
          orb.type = toType;
          // Update shape and color
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
        }
      });
    });
  }

  convertMultiColor(types, toType) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && types.includes(orb.type)) {
          orb.type = toType;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
        }
      });
    });
  }

  // --- Star Drop Skills ---
  spawnStarRandom(count) {
    if (this.processing) return;
    const normalOrbs = [];
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && !orb.isStar && !orb.isBomb && !orb.isRepeat && !orb.isRainbow) {
          normalOrbs.push(orb);
        }
      });
    });

    // Shuffle and pick
    for (let i = normalOrbs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normalOrbs[i], normalOrbs[j]] = [normalOrbs[j], normalOrbs[i]];
    }

    const targets = normalOrbs.slice(0, count);
    targets.forEach(orb => {
      orb.isStar = true;
      this.addStarMark(orb.el);
    });
  }

  convertStarTargeted(count, targetColor) {
    if (this.processing) return;
    const targetOrbs = [];
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && orb.type === targetColor && !orb.isStar && !orb.isBomb && !orb.isRepeat && !orb.isRainbow) {
          targetOrbs.push(orb);
        }
      });
    });

    if (count !== "all") {
      // Shuffle and pick if limit exists
      for (let i = targetOrbs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetOrbs[i], targetOrbs[j]] = [targetOrbs[j], targetOrbs[i]];
      }
      targetOrbs.splice(count);
    }

    targetOrbs.forEach(orb => {
      orb.isStar = true;
      this.addStarMark(orb.el);
    });
  }

  async animateComboAdd(amount) {
    if (amount <= 0) return;
    const stepDelay = Math.max(50, Math.min(250, 600 / amount)); // 段階的に増えるように速度調整
    for (let i = 0; i < amount; i++) {
      if (this.currentCombo >= MAX_COMBO) break;
      this.currentCombo = Math.min(this.currentCombo + 1, MAX_COMBO);
      this.onCombo(this.currentCombo);
      if (this.comboEl) {
        this.comboEl.innerHTML = `<span class="combo-number">${this.currentCombo.toLocaleString()}</span><span class="combo-label">COMBO</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(stepDelay);
      if (this._isDestroyed) return;
    }
  }

  changeBoardColors(types) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb) {
          const type = types[Math.floor(Math.random() * types.length)];
          orb.type = type;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[type];
        }
      });
    });
  }

  fixRowColor(rowIdx, type) {
    if (this.processing) return;

    let targetRow = rowIdx;
    if (rowIdx === -1) {
      targetRow = this.rows - 1;
    } else if (rowIdx === 'center') {
      targetRow = Math.floor(this.rows / 2);
    }

    if (targetRow < 0 || targetRow >= this.rows) return;

    this.state[targetRow].forEach((orb) => {
      if (orb) {
        orb.type = type;
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
        const span = orb.el.querySelector("span");
        if (span) span.innerText = this.icons[type];
      }
    });
  }

  fixColColor(colIdx, type) {
    if (this.processing) return;

    let targetCol = colIdx;
    if (colIdx === -1) {
      targetCol = this.cols - 1;
    } else if (colIdx === 'center') {
      targetCol = Math.floor(this.cols / 2);
    }

    if (targetCol < 0 || targetCol >= this.cols) return;

    this.state.forEach(row => {
      const orb = row[targetCol];
      if (orb) {
        orb.type = type;
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
        const span = orb.el.querySelector("span");
        if (span) span.innerText = this.icons[type];
      }
    });
  }

  // --- Step 4: 強化ドロップ操作 ---
  enhanceColorOrbs(colors) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && colors.includes(orb.type) && !orb.isEnhanced) {
          orb.isEnhanced = true;
          this.addPlusMark(orb.el);
        }
      });
    });
  }

  // --- Step 4: クロノス・ストップ ---
  activateChronosStop(duration = 10000) {
    if (this.processing) return;
    this.chronosStopActive = true;
    clearInterval(this.timerId);
    this.moveStart = null;
    clearTimeout(this.chronosTimerId);
    this.chronosTimerId = setTimeout(() => {
      this.endChronosStop();
    }, duration);
  }

  endChronosStop() {
    this.chronosStopActive = false;
    clearTimeout(this.chronosTimerId);
    this.chronosTimerId = null;
    clearInterval(this.timerId);
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this.dragging) {
      this.dragging.el.classList.remove("orb-grabbing");
      this.dragging.el.style.zIndex = "";
      this.dragging = null;
    }
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);
    this.render();
    this.process();
  }

  addBombMark(el) {
    if (el.querySelector('.bomb-mark')) return;
    const bombSpan = document.createElement('span');
    bombSpan.className = 'bomb-mark material-icons-round';
    bombSpan.style.color = 'white';
    bombSpan.innerText = 'cyclone';
    el.appendChild(bombSpan);
  }

  addRepeatMark(el) {
    if (el.querySelector('.repeat-mark')) return;
    const repeatSpan = document.createElement('span');
    repeatSpan.className = 'repeat-mark material-icons-round absolute bottom-0 left-0 text-white text-xs drop-shadow-md font-bold z-10';
    repeatSpan.style.color = 'white';
    repeatSpan.innerText = 'autorenew';
    el.appendChild(repeatSpan);
  }

  addStarMark(el) {
    if (el.querySelector('.star-mark')) return;
    const starSpan = document.createElement('span');
    starSpan.className = 'star-mark material-icons-round absolute bottom-0 right-0 text-yellow-300 text-sm drop-shadow-md font-bold z-10';
    starSpan.innerText = 'star';
    el.appendChild(starSpan);
  }

  async forceRefresh() {
    if (this.processing) return;
    this.processing = true;

    // 1. Clear all orbs with animation
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb) orb.el.classList.add("orb-matching");
      });
    });

    await this.sleep(300);
    if (this._isDestroyed) return;

    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb) {
          orb.el.remove();
          this.state[r][c] = null;
        }
      });
    });

    await this.sleep(100);
    if (this._isDestroyed) return;

    // 2. Gravity naturally spawns new orbs
    await this.simultaneousGravity();
    if (this._isDestroyed) return;
    await this.sleep(450);
    if (this._isDestroyed) return;

    // this.processing = false; // process() にロック管理を委ねる
    this.process(); // Start natural combo sequence
  }

  async process() {
    this.processing = true;
    this.currentCombo = 0;
    if (this.comboEl) {
      this.comboEl.innerText = "";
      this.comboEl.style.display = "block";
    }
    const colorComboCounts = {};
    const erasedColorCounts = {};
    this.types.forEach(t => {
      colorComboCounts[t] = 0;
      erasedColorCounts[t] = 0;
    });
    let hasSkyfallCombo = false;
    const shapes = []; // 特殊消し形状判定結果を蓄積
    let overLinkMultiplier = 1; // 過剰結合倍率

    // --- 全消し判定用のカウンター ---
    const initialOrbCount = this.state.flat().filter(orb => orb !== null).length;
    let clearedInitialOrbs = 0;

    // --- ボムで消えたドロップ数のカウンター ---
    let erasedByBombTotal = 0;

    // --- リピートドロップで消えた回数のカウンター ---
    let erasedByRepeatTotal = 0;

    // --- スタードロップで消えた数のカウンター ---
    let erasedByStarTotal = 0;

    let loopGuard = 0;
    const MAX_LOOP = 50; // 無限ループ防止（1色100%など極端な状況の安全弁）
    while (loopGuard++ < MAX_LOOP) {
      const iterationErasedColors = new Set(); // このイテレーションで消えた色を追跡
      const groups = this.findCombos();
      if (groups.length === 0) break;

      // --- ボム処理を一番初めに行う ---
      const bombGroups = groups.filter(g => g.some(o => o.isBomb));
      if (bombGroups.length > 0) {
        // ボムの起爆色をすべて収集
        const targetColors = new Set();
        bombGroups.forEach(g => {
          if (g.length > 0 && g.groupType) { // Access virt type for bombs
            targetColors.add(g.groupType);
          } else if (g.length > 0) {
            targetColors.add(g[0].type); // Fallback
          }
        });

        // 盤面から起爆色のドロップをすべて収集
        const bombTargets = [];
        this.state.forEach(row => {
          row.forEach(orb => {
            if (orb && targetColors.has(orb.type)) {
              bombTargets.push(orb);
            }
          });
        });

        if (bombTargets.length > 0) {
          erasedByBombTotal += bombTargets.length;
          erasedByStarTotal += bombTargets.filter(o => o.isStar).length;

          const enhancedBonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);

          for (const targetOrb of bombTargets) {
            targetOrb.el.classList.add("orb-matching");
            await this.sleep(100);
            if (this._isDestroyed) return;

            let addition = 1;
            // プラスドロップ効果は発動する（特殊消し効果は乗らない）
            if (targetOrb.isEnhanced) {
              addition += enhancedBonusPerOrb;
            }
            await this.animateComboAdd(addition);

            await this.sleep(200);
            if (this._isDestroyed) return;

            targetOrb.el.remove();
            this.state[targetOrb.r][targetOrb.c] = null;

            const type = targetOrb.type;
            if (colorComboCounts[type] !== undefined) {
              colorComboCounts[type]++;
              erasedColorCounts[type]++; // NOTE: This adds +1 per orb, not per group. Compatible with color combo.
              iterationErasedColors.add(type);
            }
            if (!targetOrb.isSkyfall) clearedInitialOrbs++;
          }
          await this.sleep(50);
          if (this._isDestroyed) return;

          // --- ボム消去ボーナス (エンチャント) ---
          const destroyedBombsCount = bombTargets.filter(o => o.isBomb).length;
          const bombBurstCombo = this.realtimeBonuses?.bomb_burst_combo || 0;
          if (destroyedBombsCount > 0 && bombBurstCombo > 0) {
            await this.animateComboAdd(destroyedBombsCount * bombBurstCombo);
          }

          // ボム処理後の落下処理
          // --- 単色全消しチェック（ボムパス）---
          await this._checkMonoClear(iterationErasedColors);
          if (this._isDestroyed) return;
          if (this.noSkyfall) {
            await this.gravityOnly();
            if (this._isDestroyed) return;
            await this.sleep(450);
            if (this._isDestroyed) return;
          } else {
            await this.simultaneousGravity();
            if (this._isDestroyed) return;
            await this.sleep(450);
            if (this._isDestroyed) return;
          }
        }

        // ボム処理を行った場合、盤面が変わったので最初からコンボ判定をやり直す
        continue;
      }

      // To handle Rainbow drops being matched in multiple color combos at the same time,
      // we need to gather all drops scheduled for matching in this turn, reduce their counts,
      // and defer actual deletion from the DOM/state until all combos for this turn are processed.
      const orbsToEraseThisTurn = new Set();
      const rainbowOrbsToUpdate = new Set();
      const groupComboPromises = [];

      for (const group of groups) {
        // Find if this group has a meaningful property
        const hasRainbow = group.some(o => o.isRainbow);

        // Calculate count decrement rules.
        // We do this per group. So one group = one "hit".
        if (hasRainbow) {
          group.filter(o => o.isRainbow).forEach(o => {
            // Mark for decrement
            o._pendingRainbowHits = (o._pendingRainbowHits || 0) + 1;
            rainbowOrbsToUpdate.add(o);
          });
        }

        // グループ内のリピートドロップ数をカウント
        const repeatCount = group.filter(o => o.isRepeat).length;
        // リピート回数は最低1回（通常の消去）＋リピートドロップ数
        let extraRepeat = 0;
        if (repeatCount > 0 && this.realtimeBonuses?.extra_repeat_activations) {
          extraRepeat = this.realtimeBonuses.extra_repeat_activations;
          if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.extra_repeat_activations) {
            this.realtimeBonuses.tokenIds.extra_repeat_activations.forEach(id => this.onPassiveTrigger(id));
          }
        }
        const totalClears = 1 + repeatCount + extraRepeat;

        for (let clearNum = 0; clearNum < totalClears; clearNum++) {
          if (clearNum > 0) {
            // 2回目以降の消去時：復活アニメーション（アイコンを消して再度準備）
            group.forEach((o) => {
              o.isRepeat = false;
              if (o.el) {
                o.el.classList.remove("orb-matching"); // 前回のアニメーションを解除
                const repeatMark = o.el.querySelector('.repeat-mark');
                if (repeatMark) repeatMark.remove();

                // --- 復活演出 ---
                // 光のリングを追加（アニメーション後に自動削除）
                const ring = document.createElement('div');
                ring.className = 'orb-revive-ring';
                o.el.appendChild(ring);
                ring.addEventListener('animationend', () => ring.remove(), { once: true });

                // オーブ本体をバウンス＋グローさせる
                o.el.classList.add('orb-reviving');
                const innerEl = o.el.querySelector('.orb-inner');
                if (innerEl) {
                  innerEl.addEventListener('animationend', () => {
                    if (o.el) o.el.classList.remove('orb-reviving');
                  }, { once: true });
                }
              }
            });
            // 復活演出の表示時間
            await this.sleep(220);
            if (this._isDestroyed) return;
            erasedByRepeatTotal += repeatCount; // 消えたリピートドロップ数を加算
          }
          const starsMatched = group.filter(o => o.isStar).length;
          erasedByStarTotal += starsMatched; // スタードロップ消去数を加算
          if (starsMatched > 0 && this.onStarErase) {
            this.onStarErase(starsMatched);
          }

          // 消した色とコンボ数を記録
          const type = group.groupType || (group.length > 0 ? group[0].type : null);
          if (type) {
            if (colorComboCounts[type] !== undefined) {
              colorComboCounts[type]++;
              erasedColorCounts[type] += group.length;
              // Add to iteration tracking
              iterationErasedColors.add(type);
            }
          }

          // 落ちコンで消えたグループかチェック（skyfall_bonus判定用、1回目のみ判定）
          if (clearNum === 0 && group.some(o => o.isSkyfall)) {
            hasSkyfallCombo = true;
          }

          // --- カウント：初期盤のドロップがどれだけ消えたか ---
          if (clearNum === 0) { // 1回目だけカウント
            const nonSkyfallCount = group.filter(o => !o.isSkyfall).length;
            clearedInitialOrbs += nonSkyfallCount;
          }

          const shape = this.classifyShape(group);
          if (shape && clearNum === 0) shapes.push(shape);

          // --- 特殊消しリアルタイム加算 ---
          let addition = 1;

          // Rainbow Combo Bonus
          if (hasRainbow && this.realtimeBonuses?.rainbow_combo_bonus) {
            addition += this.realtimeBonuses.rainbow_combo_bonus;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.rainbow_combo_bonus) {
              this.realtimeBonuses.tokenIds.rainbow_combo_bonus.forEach(id => this.onPassiveTrigger(id));
            }
          }

          // 強化ドロップボーナス（1回目のみ加算するのが自然だが、リピートという性質上毎回適用する）
          const enhancedCount = group.filter(o => o.isEnhanced).length;
          const enhancedBonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);
          if (enhancedCount > 0 && this.realtimeBonuses?.enhancedOrbBonus > 0 && this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.enhancedOrbBonus) {
            this.realtimeBonuses.tokenIds.enhancedOrbBonus.forEach(id => this.onPassiveTrigger(id));
          }
          addition += enhancedCount * enhancedBonusPerOrb;

          // 過剰結合チェック
          if (enhancedCount >= (this.realtimeBonuses?.overLink?.count || 999)) {
            if (!overLinkMultiplier || overLinkMultiplier < (this.realtimeBonuses?.overLink?.value || 1)) {
              overLinkMultiplier = this.realtimeBonuses?.overLink?.value || 1;
              if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.overLink) {
                this.realtimeBonuses.tokenIds.overLink.forEach(id => this.onPassiveTrigger(id));
              }
            }
          }

          // Base Bonuses
          if (shape === "len5") addition += 1;
          if (shape === "l_shape") addition += 1;
          if (shape === "cross") addition += 2;
          if (shape === "row") addition += 2;

          if (shape === "len4" && this.realtimeBonuses?.len4) {
            addition += this.realtimeBonuses.len4;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.len4) {
              this.realtimeBonuses.tokenIds.len4.forEach(id => this.onPassiveTrigger(id));
            }
          }
          if (shape === "len4" && this.realtimeBonuses?.stat_shape_additions?.len4) {
            addition += this.realtimeBonuses.stat_shape_additions.len4;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.stat_shape_additions?.len4) {
              this.realtimeBonuses.tokenIds.stat_shape_additions.len4.forEach(id => this.onPassiveTrigger(id));
            }
          }
          if (shape === "row" && this.realtimeBonuses?.row) {
            addition += this.realtimeBonuses.row;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.row) {
              this.realtimeBonuses.tokenIds.row.forEach(id => this.onPassiveTrigger(id));
            }
          }
          if (shape === "l_shape" && this.realtimeBonuses?.l_shape) {
            addition += this.realtimeBonuses.l_shape;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.l_shape) {
              this.realtimeBonuses.tokenIds.l_shape.forEach(id => this.onPassiveTrigger(id));
            }
          }
          if (shape === "cross" && this.realtimeBonuses?.stat_shape_additions?.cross) {
            addition += this.realtimeBonuses.stat_shape_additions.cross;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.stat_shape_additions?.cross) {
              this.realtimeBonuses.tokenIds.stat_shape_additions.cross.forEach(id => this.onPassiveTrigger(id));
            }
          }

          // Color Combo Bonus (Enchantment)
          if (type && this.realtimeBonuses?.color_combo?.[type]) {
            addition += this.realtimeBonuses.color_combo[type];
          }

          // Heart Combo Bonus (Passive)
          if (type === 'heart' && this.realtimeBonuses?.heart_combo) {
            addition += this.realtimeBonuses.heart_combo;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.heart_combo) {
              this.realtimeBonuses.tokenIds.heart_combo.forEach(id => this.onPassiveTrigger(id));
            }
          }

          // Skyfall Bonus
          const isSkyfall = group.some(o => o.isSkyfall);
          if (isSkyfall && this.realtimeBonuses?.skyfall) {
            addition += this.realtimeBonuses.skyfall;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.skyfall) {
              this.realtimeBonuses.tokenIds.skyfall.forEach(id => this.onPassiveTrigger(id));
            }
          }

          // Rainbow Bridge (虹ドロップがコンボに関与した際のボーナス)
          const involvedRainbow = group.some(o => o.isRainbow);
          if (involvedRainbow && this.realtimeBonuses?.rainbow) {
            addition += Number(this.realtimeBonuses.rainbow || 0);
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.rainbow) {
              this.realtimeBonuses.tokenIds.rainbow.forEach(id => this.onPassiveTrigger(id));
            }
          }

          group.forEach((o) => {
            if (o.el) {
              void o.el.offsetWidth; // force reflow
              o.el.classList.add("orb-matching");
            }
            if (!o.isRainbow) {
              orbsToEraseThisTurn.add(o); // Mark for deferred deletion
            }
          });

          // Queue combo animations instead of waiting serially if possible (though existing logic awaits)
          groupComboPromises.push(this.animateComboAdd(addition));

          await this.sleep(300);
          if (this._isDestroyed) return;
          // We no longer remove DOM immediately here!

          await groupComboPromises[groupComboPromises.length - 1]; // Wait for this specific combo
          await this.sleep(50);
          if (this._isDestroyed) return;
        }
      }

      // Defer DOM/State cleanup for Rainbow drops
      for (const ro of rainbowOrbsToUpdate) {
        if (ro._pendingRainbowHits) {
          ro.rainbowCount -= ro._pendingRainbowHits;
          ro._pendingRainbowHits = 0; // Reset

          if (ro.rainbowCount <= 0) {
            orbsToEraseThisTurn.add(ro); // It's completely destroyed, queue for normal deletion
          } else if (ro.el) {
            // Survive: update UI
            const countText = ro.el.querySelector('.rainbow-count-text');
            if (countText) countText.innerText = ro.rainbowCount;
            ro.el.classList.remove("orb-matching"); // Undo the matching animation state visually so it can be matched again

            // Add a hit animation (pulse) instead of deletion
            ro.el.classList.add("rainbow-hit-pulse");
            setTimeout(() => { if (ro && ro.el) ro.el.classList.remove("rainbow-hit-pulse") }, 300);
          }
        }
      }

      // Proceed with actual deletion
      for (const orb of orbsToEraseThisTurn) {
        if (orb.el) {
          orb.el.remove();
        }
        // Safeguard: only nullify if the reference is still matching, to avoid overlaps
        if (this.state[orb.r][orb.c] === orb) {
          this.state[orb.r][orb.c] = null;
          // 消えた色をイテレーション追跡に追加
          if (orb.type && this.types.includes(orb.type)) {
            iterationErasedColors.add(orb.type);
          }
        }
      }

      // --- 単色全消しチェック（通常パス）---
      await this._checkMonoClear(iterationErasedColors);
      if (this._isDestroyed) return;

      // noSkyfall時はオーブを落下させるが新規オーブは生成しない
      if (this.noSkyfall) {
        await this.gravityOnly();
        if (this._isDestroyed) return;
        await this.sleep(450);
        if (this._isDestroyed) return;
        // ループを継続し、落下後の配置でコンボ判定を行う
        continue;
      }

      await this.simultaneousGravity();
      if (this._isDestroyed) return;
      await this.sleep(450);
      if (this._isDestroyed) return;
    }

    // noSkyfallの場合、コンボ連鎖が完全に終了した後で盤面を補充する
    if (this.noSkyfall) {
      await this.simultaneousGravity();
      if (this._isDestroyed) return;
      await this.sleep(200);
    }

    // --- Special Bonus: All Initial Orbs Cleared ---
    const allInitialOrbsCleared = initialOrbCount > 0 && clearedInitialOrbs >= initialOrbCount;
    if (allInitialOrbsCleared && this.currentCombo > 0) {
      this.currentCombo = Math.min(this.currentCombo * 2, MAX_COMBO);
      if (this.comboEl) {
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ ALL CLEAR ✦</div><span class="combo-number combo-number-final">${this.currentCombo.toLocaleString()}</span><span class="combo-label">×2</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(1000);
      if (this._isDestroyed) return;
    }


    // --- Special Bonus: Perfect Clear ---
    const isPerfect = this.state.every((row) =>
      row.every((orb) => orb === null),
    );
    if (isPerfect && this.currentCombo > 0) {
      // 全消しボーナス: +10コンボ
      this.currentCombo = Math.min(this.currentCombo + 10, MAX_COMBO);
      this.currentCombo = Math.min(this.currentCombo * 2, MAX_COMBO);
      if (this.comboEl) {
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ PERFECT CLEAR ✦</div><span class="combo-number combo-number-final">${this.currentCombo.toLocaleString()}</span><span class="combo-label">+10 & ×2</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(1000);
      if (this._isDestroyed) return;
    }

    if (this.onTurnEnd) {
      await this.onTurnEnd(this.currentCombo, colorComboCounts, erasedColorCounts, hasSkyfallCombo, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isPerfect || allInitialOrbsCleared);
    }
    this.processing = false;
  }

  findCombos() {
    // Instead of matching by exact type, we check for each basic color
    const basicTypes = ["fire", "water", "wood", "light", "dark", "heart"];
    const allGroups = [];

    // Keep track of visited nodes per color to avoid duplicate groups per color
    const visitedPerColor = {};
    basicTypes.forEach(t => {
      visitedPerColor[t] = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    });

    for (const color of basicTypes) {
      const matched = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

      // Horizontal
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c <= this.cols - this.minMatchLength; c++) {
          const orb = this.state[r][c];
          if (!orb) continue;
          if (orb.type !== color && !orb.isRainbow) continue;

          let isMatch = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            const nextOrb = this.state[r][c + k];
            if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            for (let k = 0; k < this.minMatchLength; k++) matched[r][c + k] = true;
            let k = c + this.minMatchLength;
            while (k < this.cols && this.state[r][k] && (this.state[r][k].type === color || this.state[r][k].isRainbow)) {
              matched[r][k++] = true;
            }
          }
        }
      }

      // Vertical
      for (let c = 0; c < this.cols; c++) {
        for (let r = 0; r <= this.rows - this.minMatchLength; r++) {
          const orb = this.state[r][c];
          if (!orb) continue;
          if (orb.type !== color && !orb.isRainbow) continue;

          let isMatch = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            const nextOrb = this.state[r + k][c];
            if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            for (let k = 0; k < this.minMatchLength; k++) matched[r + k][c] = true;
            let k = r + this.minMatchLength;
            while (k < this.rows && this.state[k][c] && (this.state[k][c].type === color || this.state[k][c].isRainbow)) {
              matched[k++][c] = true;
            }
          }
        }
      }

      // Extract groups for this color
      const visited = visitedPerColor[color];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (matched[r][c] && !visited[r][c]) {
            const group = [];
            const q = [{ r, c }];
            visited[r][c] = true;
            let hasBaseColor = false; // A valid group must contain at least one non-rainbow orb of the target color, or be pure rainbows

            while (q.length > 0) {
              const curr = q.shift();
              const orb = this.state[curr.r][curr.c];
              group.push(orb);
              if (!orb.isRainbow && orb.type === color) hasBaseColor = true;

              [
                [0, 1], [0, -1], [1, 0], [-1, 0]
              ].forEach(([dr, dc]) => {
                const nr = curr.r + dr, nc = curr.c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                  if (matched[nr][nc] && !visited[nr][nc] && (this.state[nr][nc].type === color || this.state[nr][nc].isRainbow)) {
                    visited[nr][nc] = true;
                    q.push({ r: nr, c: nc });
                  }
                }
              });
            }

            // A group is only valid if it contains at least one base color orb, OR if we are processing "heart"
            // and the entire group is pure rainbow drops (we process pure rainbows only once under "heart" to avoid 6x duplication).
            if (hasBaseColor) {
              // Assign a virtual groupType so we know which color combo this was
              group.groupType = color;
              allGroups.push(group);
            } else if (color === "heart") {
              // Pure rainbow group, counts as heart combo for processing to not give 6x combos for free
              group.groupType = "heart";
              allGroups.push(group);
            }
          }
        }
      }
    }

    return allGroups;
  }

  // グループの形状を判定する
  classifyShape(group) {
    const checkShape = (coords) => {
      const len = coords.length;
      const rows = new Set(coords.map(c => c.r));
      const cols = new Set(coords.map(c => c.c));
      const coordSet = new Set(coords.map(c => `${c.r},${c.c}`));

      // 十字型: ちょうど5個で、中心があり上下左右がある
      if (len === 5) {
        for (const { r, c } of coords) {
          if (coordSet.has(`${r - 1},${c}`) && coordSet.has(`${r + 1},${c}`) &&
            coordSet.has(`${r},${c - 1}`) && coordSet.has(`${r},${c + 1}`)) {
            return "cross";
          }
        }
      }

      // L字型: ちょうど5個で、3x3の範囲に収まり、十字ではない
      if (len === 5 && rows.size === 3 && cols.size === 3) {
        return "l_shape";
      }

      // 3x3正方形: ちょうど9個で3行3列
      if (len === 9 && rows.size === 3 && cols.size === 3) {
        const minR = Math.min(...rows);
        const minC = Math.min(...cols);
        let isSquare = true;
        for (let dr = 0; dr < 3; dr++)
          for (let dc = 0; dc < 3; dc++)
            if (!coordSet.has(`${minR + dr},${minC + dc}`)) isSquare = false;
        if (isSquare) return "square";
      }

      // 横1列: 盤面幅分のオーブが同じ行にある
      if (len === this.cols && rows.size === 1) return "row";

      // 4個ちょうど
      if (len === 4) return "len4";

      // 5個以上連結（L字含む）
      if (len >= 5) return "len5";

      return null;
    };

    // 1. 全体での判定 (虹ドロップを含めて形を作るケース)
    let shape = checkShape(group.map(o => ({ r: o.r, c: o.c })));
    if (shape) return shape;

    // 2. 虹ドロップを除外したサブセットでの判定 (純粋な色ドロップのみで形ができているケース)
    const baseColorOrbs = group.filter(o => !o.isRainbow);
    if (baseColorOrbs.length > 0 && baseColorOrbs.length < group.length) {
      shape = checkShape(baseColorOrbs.map(o => ({ r: o.r, c: o.c })));
    }

    return shape;
  }

  spawnRandom(type, count) {
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Exclude cells that are already of the target type
        // Also check if state exists (it should)
        if (this.state[r][c]?.type && this.state[r][c].type !== type) {
          candidates.push({ r, c });
        }
      }
    }
    // Shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    // Select
    const targets = candidates.slice(0, count);
    targets.forEach(({ r, c }) => {
      const orb = this.state[r][c];
      orb.type = type;
      // Update DOM directly for performance and visual effect
      if (orb.el) {
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-${type} shadow-lg`;
          // Preserve marking if present (e.g. enhanced)
          const star = inner.querySelector('.enhanced-mark');
          // For rainbow drops, we need to create/preserve the count instead of an icon
          inner.innerHTML = '';
          if (type === "rainbow") {
            inner.className = `orb-inner orb-rainbow shadow-lg`;
            orb.isRainbow = true;
            orb.rainbowCount = 5; // By default rainbow_master sets count to 5
            const countSpan = document.createElement("span");
            countSpan.className = "rainbow-count-text text-white font-bold text-xl drop-shadow-md select-none";
            countSpan.innerText = orb.rainbowCount;
            inner.appendChild(countSpan);
          } else {
            orb.isRainbow = false; // in case it was a rainbow, reset it
            const iconSpan = document.createElement("span");
            iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
            iconSpan.innerText = this.icons[type];
            inner.appendChild(iconSpan);
          }
          if (star) inner.appendChild(star);
        }
      }
    });
  }

  changeBoardBalanced() {
    const basicTypes = ["fire", "water", "wood", "light", "dark"];
    let deck = [];
    basicTypes.forEach(t => {
      for (let i = 0; i < 6; i++) deck.push(t);
    });

    // Fill remainder with random types if board is larger than 30
    const totalSlots = this.rows * this.cols;
    while (deck.length < totalSlots) {
      deck.push(basicTypes[Math.floor(Math.random() * basicTypes.length)]);
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const type = deck[idx++] || "heart"; // Fallback to heart if deck empty (shouldn't happen)
        const orb = this.state[r][c];
        orb.type = type;
        orb.isBomb = false;

        if (orb.el) {
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
          const inner = orb.el.querySelector('.orb-inner');
          if (inner) {
            inner.className = `orb-inner orb-${type} shadow-lg`;
            const star = inner.querySelector('.enhanced-mark');
            inner.innerHTML = '';
            const iconSpan = document.createElement("span");
            iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
            iconSpan.innerText = this.icons[type];
            inner.appendChild(iconSpan);
            if (star) inner.appendChild(star);
          }
          const bombMark = orb.el.querySelector('.bomb-mark');
          if (bombMark) bombMark.remove();
        }
      }
    }
  }

  spawnBombRandom(count) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isBomb) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      // ランダムな色に変更してボム化
      const type = this.types[Math.floor(Math.random() * this.types.length)];
      orb.type = type;
      orb.isBomb = true;

      if (orb.el) {
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-${type} shadow-lg`;
          const star = inner.querySelector('.enhanced-mark');
          inner.innerHTML = '';
          const iconSpan = document.createElement("span");
          iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
          iconSpan.innerText = this.icons[type];
          inner.appendChild(iconSpan);
          if (star) inner.appendChild(star);
        }
        this.addBombMark(orb.el);
      }
    });
  }

  convertBombTargeted(count, targetType) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isBomb && (!targetType || orb.type === targetType)) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      // 色は維持したままボム化
      orb.isBomb = true;
      if (orb.el) {
        this.addBombMark(orb.el);
      }
    });
  }

  spawnRepeatRandom(count) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isRepeat) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      orb.isRepeat = true;
      if (orb.el) {
        this.addRepeatMark(orb.el);
      }
    });
  }

  convertRepeatTargeted(count, targetType) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isRepeat && (!targetType || orb.type === targetType)) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      orb.isRepeat = true;
      if (orb.el) {
        this.addRepeatMark(orb.el);
      }
    });
  }

  spawnRainbowRandom(count) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isRainbow) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      orb.isRainbow = true;
      orb.rainbowCount = 3; // Basic gen sets it to 3
      orb.type = "heart"; // internal fallback type for rainbow rendering

      if (orb.el) {
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-heart`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-rainbow shadow-lg`;
          const star = inner.querySelector('.enhanced-mark');
          inner.innerHTML = '';
          const countSpan = document.createElement("span");
          countSpan.className = "rainbow-count-text text-white font-bold text-xl drop-shadow-md select-none";
          countSpan.innerText = orb.rainbowCount;
          inner.appendChild(countSpan);
          if (star) inner.appendChild(star);
        }
      }
    });
  }

  setAllRainbowCounts(count) {
    if (this.processing) return;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && orb.isRainbow) {
          orb.rainbowCount = count;
          if (orb.el) {
            const countText = orb.el.querySelector('.rainbow-count-text');
            if (countText) countText.innerText = orb.rainbowCount;
          }
        }
      }
    }
  }

  // 重力処理のみ（新規オーブ生成なし）- noSkyfall時に使用
  async gravityOnly() {
    for (let c = 0; c < this.cols; c++) {
      let emptySlots = 0;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.state[r][c] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          const orb = this.state[r][c];
          this.state[r + emptySlots][c] = orb;
          this.state[r][c] = null;
          orb.r = r + emptySlots;
        }
      }
      // noSkyfall: 空きスロットは null のまま（新規オーブを生成しない）
    }
    // 強制的にリフローを発生させ、既存のstyle変更をブラウザに認識させる
    void this.container.offsetHeight;

    // 落下アニメーションクラスを付与してrender
    await this.sleep(10);
    if (this._isDestroyed) return;
    this.render('orb-falling');
  }

  async simultaneousGravity() {
    for (let c = 0; c < this.cols; c++) {
      let emptySlots = 0;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.state[r][c] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          const orb = this.state[r][c];
          this.state[r + emptySlots][c] = orb;
          this.state[r][c] = null;
          orb.r = r + emptySlots;
        }
      }
      for (let i = 0; i < emptySlots; i++) {
        this.spawnOrb(i, c, true, emptySlots - 1 - i);
      }
    }
    // 強制的にリフローを発生させ、初期のtransform位置をブラウザに確実に認識させる
    void this.container.offsetHeight;

    // 少し待ってから落下アニメーションを開始
    await this.sleep(10);
    if (this._isDestroyed) return;
    this.render('orb-falling');
  }

  // --- 単色全消しチェック（ヘルパー） ---
  // 盤面が空 かつ このイテレーションで消えた色がちょうど1種類なら +20コンボ
  async _checkMonoClear(iterationErasedColors) {
    if (iterationErasedColors.size !== 1) return;
    const boardEmpty = this.state.every(row => row.every(orb => orb === null));
    if (!boardEmpty || this.currentCombo <= 0) return;

    this.currentCombo = Math.min(this.currentCombo + 20, MAX_COMBO);
    if (this.comboEl) {
      this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ MONO CLEAR ✦</div><span class="combo-number combo-number-final">${this.currentCombo.toLocaleString()}</span><span class="combo-label">+20</span>`;
      this.comboEl.classList.remove('animate-combo-pop');
      void this.comboEl.offsetWidth;
      this.comboEl.classList.add('animate-combo-pop');
    }
    await this.sleep(800);
  }

  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  destroy() {
    this._isDestroyed = true;
    clearInterval(this.timerId);
    clearTimeout(this.chronosTimerId);
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);
  }
}

export { PuzzleEngine };
