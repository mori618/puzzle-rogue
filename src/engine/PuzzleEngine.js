import { MAX_COMBO, MAX_TARGET } from '../constants/gameConstants.js';
import { ALL_TOKEN_BASES } from '../constants/tokens.js';
import { formatJapaneseNumber } from '../utils/numberUtils.js';
import soundManager from '../utils/SoundManager';
import { SE_IDS } from '../constants/sounds';

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
    this.timerText = options.timerText || null; // 残り時間表示用要素
    this.pureMode = options.pureMode || false; // 特殊消しボーナス無効モード
    this.vacationMode = false;
    this.calmActive = false;
    this.fingerTransformConfig = null;
    this.fingerTransformHistory = [];

    // Will be calculated in init()
    this.orbSize = 0;
    this.gap = 0; // Will be set relative to orb size or container

    this.types = ["fire", "water", "wood", "light", "dark", "heart"];
    this.icons = {
      fire: "whatshot",
      water: "water_drop",
      wood: "air",
      light: "bolt",
      dark: "nightlight_round",
      heart: "favorite",
    };

    this.state = [];
    this.dragging = null;
    this.moveStart = null;
    this.timerId = null;
    this.processing = false;
    this.currentCombo = 0;
    this.noSkyfall = false;
    this.noSpecialEffects = false;
    this.gravityDirection = 'down'; // 重力方向（'down' または 'up'）
    this.hasOneStrokeSeal = false;  // 一筆書きの誓約が有効か
    this.oneStrokeVisited = null;   // ドラッグ中の訪問済みセル（Set で管理）
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
    this.activeTimeouts = new Set();
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

    // 錬金術パッシブと消去禁止設定
    this.alchemyPassives = {};
    this.noEraseColors = [];
    this.meteorShowerPendingStars = 0;
    this.erasedByBombColors = [];

    // 高速化（ファストフォワード）機能用ステートとバインド
    this.isPointerDown = false;
    this.isFastForward = false;
    this.speedMultiplier = options.speedMultiplier || 3;

    this.onPointerDownForSpeed = (e) => {
      if (e.type === 'mousedown' && e.button !== 0) return;
      this.isPointerDown = true;
      this.updateFastForwardState();
    };

    this.onPointerUpForSpeed = () => {
      this.isPointerDown = false;
      this.updateFastForwardState();
    };

    window.addEventListener('mousedown', this.onPointerDownForSpeed);
    window.addEventListener('mouseup', this.onPointerUpForSpeed);
    window.addEventListener('touchstart', this.onPointerDownForSpeed, { passive: true });
    window.addEventListener('touchend', this.onPointerUpForSpeed);
    window.addEventListener('touchcancel', this.onPointerUpForSpeed);
  }

  setCalmActive(active) {
    this.calmActive = !!active;
  }

  setFingerTransformConfig(config) {
    this.fingerTransformConfig = config;
  }

  applyFingerTransform(orb) {
    if (!orb || !this.fingerTransformConfig) return;
    const { color, limit } = this.fingerTransformConfig;

    if (this.fingerTransformHistory.includes(orb)) return;
    if (this.fingerTransformHistory.length >= limit) return;

    this.fingerTransformHistory.push(orb);

    if (orb.type !== color) {
      orb.type = color;

      const inner = orb.el.querySelector('.orb-inner');
      if (inner) {
        inner.className = `orb-inner orb-${color} shadow-lg`;

        orb.isMoveDrop = false;
        orb.isRainbow = false;
        const countSpan = inner.querySelector('.move-count-text, .rainbow-count-text');
        if (countSpan) countSpan.remove();

        let iconSpan = inner.querySelector('.material-icons-round');
        if (!iconSpan) {
          iconSpan = document.createElement("span");
          iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
          inner.appendChild(iconSpan);
        }
        iconSpan.innerText = this.icons[color];
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${color}`;
      }

      if (this.alchemyPassives && this.alchemyPassives[color]) {
        orb.isEnhanced = true;
        this.addPlusMark(orb.el);

        const { bombChance, repeatChance, starChance } = this.alchemyPassives[color];
        const rVal = Math.random();
        if (rVal < bombChance) {
          orb.isBomb = true;
          this.addBombMark(orb.el);
        } else if (rVal < bombChance + repeatChance) {
          orb.isRepeat = true;
          this.addRepeatMark(orb.el);
        } else if (rVal < bombChance + repeatChance + starChance) {
          orb.isStar = true;
          this.addStarMark(orb.el);
        }
      }
    }
  }

  setAlchemyPassives(passives) {
    this.alchemyPassives = passives || {};
  }

  setNoEraseColors(colors) {
    this.noEraseColors = colors || [];
  }

  setRealtimeBonuses(bonuses) {
    this.realtimeBonuses = { len4: 0, row: 0, l_shape: 0, ...bonuses };
  }

  getAvailableTypes(includeHeart = true) {
    let types = this.types.filter(t => includeHeart || t !== "heart");
    if (this.vacationMode) {
      types = types.filter(t => t !== "light" && t !== "dark");
    }
    return types;
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
          isMoveDrop: !!orb.isMoveDrop,
          moveTokenId: orb.moveTokenId,
          moveCount: orb.moveCount,
          moveSteps: orb.moveSteps,
          moveRequired: orb.moveRequired,
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

    if (this.timerBar) this.timerBar.style.width = "100%";
    this.updateTimerDisplay(this.timeLimit);

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
          orb.el.style.transform = this.getOrbTransform(orb, 0, 0);
        }
      });
    });
  }

  getOrbTransform(orb, dx, dy, scale = 1.0) {
    const scaleStr = scale !== 1.0 ? ` scale(${scale})` : '';
    return `translate3d(${dx}px, ${dy}px, 0)${scaleStr}`;
  }

  spawnOrb(r, c, isNew, startRowOffset = 0, savedData = null) {
    let type;
    if (savedData) {
      type = savedData.type;
    } else if (!isNew) {
      let availableTypes = this.getAvailableTypes(true);
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
      if (!type) {
        const aTypes = this.getAvailableTypes(true);
        type = aTypes[Math.floor(Math.random() * aTypes.length)]; // Fallback
      }
    } else {
      // Weighted Random
      const aTypes = this.getAvailableTypes(true);
      const weights = this.spawnWeights || {};
      const totalWeight = aTypes.reduce(
        (acc, t) => acc + (weights[t] || 0),
        0,
      );
      let rVal = Math.random() * totalWeight;
      for (const t of aTypes) {
        rVal -= weights[t] || 0;
        if (rVal <= 0) {
          type = t;
          break;
        }
      }
      if (!type) type = aTypes[0];
    }

    const el = document.createElement("div");
    el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;

    const inner = document.createElement("div");
    inner.className = `orb-inner orb-${type} shadow-lg`;

    // ムーブドロップかどうか
    let isMoveDrop = false;
    let moveTokenId = null;
    let moveCount = 0;
    let moveSteps = 0;
    let moveRequired = 5;

    if (savedData && savedData.isMoveDrop) {
      isMoveDrop = true;
      moveTokenId = savedData.moveTokenId;
      moveCount = savedData.moveCount || 0;
      moveSteps = savedData.moveSteps || 0;
      moveRequired = savedData.moveRequired || 5;
      type = "move"; // 内部処理・描画上で独立させるため
      inner.className = `orb-inner orb-move shadow-lg`;
    }

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
    iconSpan.innerText = isRainbow || isMoveDrop ? "" : this.icons[type];

    if (isMoveDrop) {
      const countSpan = document.createElement("span");
      countSpan.className = "move-count-text";
      countSpan.innerText = moveCount;
      inner.appendChild(countSpan);
    } else if (isRainbow) {
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
      const aTypes = this.getAvailableTypes(true);
      type = aTypes[Math.floor(Math.random() * aTypes.length)]; // ランダムな色にする
    } else if (isNew && !savedData && this.meteorShowerPendingStars > 0) {
      isStar = true;
      this.meteorShowerPendingStars--;
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
    const orb = { type, el, r, c, isSkyfall: isNew, baseTop, baseLeft, isEnhanced, isBomb, isRepeat, isStar, isRainbow, rainbowCount, isMoveDrop, moveTokenId, moveCount, moveSteps, moveRequired };

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
      // 重力方向に応じて盤面外からの落下アニメーションを設定
      let offsetX = 0;
      let offsetY = 0;
      if (this.gravityDirection === 'up') {
        offsetY = (startRowOffset + 1) * (this.orbSize + this.gap);
      } else if (this.gravityDirection === 'left') {
        offsetX = (startRowOffset + 1) * (this.orbSize + this.gap);
      } else if (this.gravityDirection === 'right') {
        offsetX = -(startRowOffset + 1) * (this.orbSize + this.gap);
      } else {
        offsetY = -(startRowOffset + 1) * (this.orbSize + this.gap);
      }
      el.style.transition = 'none';
      orb.el.style.transform = this.getOrbTransform(orb, offsetX, offsetY);
      el.classList.add('orb-falling');
      orb.currentDx = offsetX;
      orb.currentDy = offsetY;
    } else {
      orb.el.style.transform = this.getOrbTransform(orb, 0, 0); // 初期状態の位置を明示的にインラインtransformで設定（ブラウザの描画バグ対策）
      orb.currentDx = 0;
      orb.currentDy = 0;
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
          
          if (animClass === 'orb-falling') {
            const prevDx = orb.currentDx !== undefined ? orb.currentDx : 0;
            const prevDy = orb.currentDy !== undefined ? orb.currentDy : 0;
            const moveX = dx - prevDx;
            const moveY = dy - prevDy;
            const dist = Math.sqrt(moveX * moveX + moveY * moveY);
            const gridDist = Math.max(1, dist / (this.orbSize + this.gap));
            
            // 落下距離に応じた動的な落下時間 (1マスあたり約160msの平方根比例)
            const duration = Math.round(160 * Math.sqrt(gridDist));
            
            // 高速化（ファストフォワード）時は transition-duration をスケール
            const speed = this.speedMultiplier || 3;
            const factor = this.isFastForward ? (1.0 / speed) : 1.0;
            const finalDuration = duration * factor;

            orb.el.style.transition = `transform ${finalDuration}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${finalDuration}ms ease`;
            
            // 既存の落下クリーンアップ用タイマーがあればクリア
            if (orb._fallingTimeout) {
              clearTimeout(orb._fallingTimeout);
              this.activeTimeouts.delete(orb._fallingTimeout);
            }
            
            // アニメーション完了後にクラスとインラインtransitionをクリーンアップ
            const timeoutId = setTimeout(() => {
              this.activeTimeouts.delete(timeoutId);
              if (orb && orb.el && !this._isDestroyed) {
                orb.el.classList.remove('orb-falling');
                orb.el.style.transition = '';
                orb._fallingTimeout = null;
              }
            }, finalDuration);
            this.activeTimeouts.add(timeoutId);
            orb._fallingTimeout = timeoutId;
            
            orb.el.classList.add('orb-falling');

            orb.el.style.transform = this.getOrbTransform(orb, dx, dy);
            orb.currentDx = dx;
            orb.currentDy = dy;
          } else {
            // 位置が実際に変わった場合のみスタイル更新処理を実行（不要な再描画を防ぐ）
            if (dx !== orb.currentDx || dy !== orb.currentDy) {
              if (animClass) {
                orb.el.classList.add(animClass);
              } else {
                orb.el.classList.remove('orb-falling');
                if (orb._fallingTimeout) {
                  clearTimeout(orb._fallingTimeout);
                  this.activeTimeouts.delete(orb._fallingTimeout);
                  orb._fallingTimeout = null;
                }
              }

              if (this.dragging) {
                // ドラッグ中の入れ替え: スワップ頻度（操作速度）に応じて transition 時間を 75ms から 120ms の間で動的に変更
                const duration = Math.max(75, Math.min(120, this.timeSinceLastSwap || 120));
                orb.el.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
              } else {
                orb.el.style.transition = '';
              }

              orb.el.style.transform = this.getOrbTransform(orb, dx, dy);
              orb.currentDx = dx;
              orb.currentDy = dy;
            } else {
              // 位置が変わっていないが、animClassが指定された場合はクラスの付与等のみ行う
              if (animClass) {
                orb.el.classList.add(animClass);
              }
            }
          }
          orb.r = r;
          orb.c = c;
        }
      });
    });
  }

  onStart(e, orbOrR, c) {
    if (this.processing) return;
    this._boardRect = this.container.getBoundingClientRect(); // ボード位置をキャッシュ
    this.isPointerDown = false;
    this.updateFastForwardState();
    this.erasedByBombColors = [];

    // 操作開始前に、盤面の全ドロップの skyfall フラグをリセットする
    this.state.forEach(row => {
      row.forEach(orb => {
        if (orb) {
          orb.isSkyfall = false;
          // 残留している可能性のある落下用クラスとスタイルを完全にクリーンアップする
          orb.el.classList.remove('orb-falling');
          orb.el.style.transition = '';
          if (orb._fallingTimeout) {
            clearTimeout(orb._fallingTimeout);
            this.activeTimeouts.delete(orb._fallingTimeout);
            orb._fallingTimeout = null;
          }
        }
      });
    });

    let target;
    if (typeof orbOrR === 'object') {
      target = orbOrR;
    } else {
      // Fallback (old signature support)
      target = this.state[orbOrR][c];
    }

    if (!target) return;

    this.fingerTransformHistory = [];
    if (this.fingerTransformConfig) {
      this.applyFingerTransform(target);
    }

    this.lastSwapTime = null;
    this.timeSinceLastSwap = null;

    soundManager.playSE(SE_IDS.DRAG_START);
    this.dragging = target;
    this.dragging.el.classList.add("orb-grabbing");
    this.dragging.el.style.zIndex = "100";

    // 一筆書きの誓約: ドラッグ開始時に訪問済みセットを初期化
    if (this.hasOneStrokeSeal) {
      this.oneStrokeVisited = new Set();
      this.oneStrokeVisited.add(`${target.r},${target.c}`);
      this._createOneStrokeIndicator(target.r, target.c);
    }

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

        const rect = this._boardRect || this.container.getBoundingClientRect(); // キャッシュ優先
        const x = this._lastMovePoint.clientX - rect.left;
        const y = this._lastMovePoint.clientY - rect.top;

        // ドラッグ中のオーブの位置をtransformで直接設定
        const dx = x - this.orbSize / 2 - this.dragging.baseLeft;
        const dy = y - this.orbSize / 2 - this.dragging.baseTop;
        this.dragging.el.style.transform = this.getOrbTransform(this.dragging, dx, dy, 1.2);

        const nr = Math.max(
          0,
          Math.min(this.rows - 1, Math.floor(y / (this.orbSize + this.gap))),
        );
        const nc = Math.max(
          0,
          Math.min(this.cols - 1, Math.floor(x / (this.orbSize + this.gap))),
        );

        if (nr !== this.dragging.r || nc !== this.dragging.c) {
          const now = Date.now();
          this.timeSinceLastSwap = this.lastSwapTime ? (now - this.lastSwapTime) : 120;
          this.lastSwapTime = now;

          // Start timer only when the orb is actually moved to another cell
          if (!this.moveStart) {
            this.moveStart = Date.now();
            this.timerId = setInterval(this.updateTimer, 20);
          }

          // 一筆書きの誓約: 通過済みセルへの移動をブロック
          if (this.hasOneStrokeSeal && this.oneStrokeVisited) {
            const visitKey = `${nr},${nc}`;
            if (this.oneStrokeVisited.has(visitKey)) {
              return; // このマスは既に通過済みなので移動を拒否
            }
            this.oneStrokeVisited.add(visitKey);
            this._createOneStrokeIndicator(nr, nc);
          }

          const target = this.state[nr][nc];
          this.state[nr][nc] = this.dragging;
          this.state[this.dragging.r][this.dragging.c] = target;

          target.r = this.dragging.r;
          target.c = this.dragging.c;
          this.dragging.r = nr;
          this.dragging.c = nc;

          this._incrementMoveDropCount(this.dragging);
          if (target) {
            this._incrementMoveDropCount(target);
            this.applyFingerTransform(target);
          }

          soundManager.playSE(SE_IDS.DRAG_MOVE);
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
    this.updateTimerDisplay(remain);
    
    // 残り3秒からカウントダウン音
    if (remain > 0 && remain <= 3000 && Math.floor(remain / 1000) !== Math.floor((remain + 20) / 1000)) {
      soundManager.playSE(SE_IDS.TIME_TICK);
    }

    if (remain <= 0) {
      soundManager.playSE(SE_IDS.TIME_OVER);
      this.onEnd();
    }
  }

  _incrementMoveDropCount(orb) {
    if (!orb || !orb.isMoveDrop) return;
    orb.moveSteps++;
    const required = orb.moveRequired || 5;
    if (orb.moveSteps >= required) {
      const boost = this.realtimeBonuses?.moveDropBoost || 0;
      orb.moveCount += (1 + boost);
      orb.moveSteps = 0;
      const textEl = orb.el.querySelector('.move-count-text');
      if (textEl) {
        textEl.innerText = orb.moveCount;
        textEl.classList.remove('rainbow-hit-pulse');
        void textEl.offsetWidth;
        textEl.classList.add('rainbow-hit-pulse'); // ポップアニメーションを流用
      }
    }
  }

  updateTimerDisplay(remainMs) {
    if (!this.timerText) return;
    const seconds = remainMs / 1000;
    // 操作中（remainMs < timeLimit かつ remainMs > 0）は小数点第1位まで表示
    // それ以外（初期状態や終了時）は、端数がある場合のみ小数点表示
    if (remainMs > 0 && remainMs < this.timeLimit) {
      this.timerText.innerText = `${seconds.toFixed(1)}s`;
    } else {
      // 整数なら整数表示、そうでなければ小数点第1位
      const displaySec = Math.round(seconds * 10) / 10;
      this.timerText.innerText = `${displaySec}s`;
    }
  }

  onEnd() {
    if (!this.dragging) return;
    soundManager.playSE(SE_IDS.DRAG_END);
    clearInterval(this.timerId);
    this.timerProgress = 1; // Reset progress
    if (this.timerBar) this.timerBar.style.width = "100%";
    this.updateTimerDisplay(this.timeLimit);

    // rAFをキャンセル
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastMovePoint = null;
    this._boardRect = null; // キャッシュをクリア

    // --- 操作時間の計測と記録 ---
    this.lastTurnRemainingTimeMs = 0;
    if (this.moveStart) {
      const elapsed = Date.now() - this.moveStart;
      this.totalMoveTimeRef.current += elapsed;
      this.lastTurnRemainingTimeMs = Math.max(0, this.timeLimit - elapsed);
    }

    const target = this.dragging;
    const hasMoved = !!this.moveStart;

    // ドラッグしていたオーブを元のマスの位置に滑らかにスナップさせる
    target.el.classList.remove("orb-grabbing");
    target.el.classList.add("orb-returning");
    
    const targetTop = (target.r * (this.orbSize + this.gap));
    const targetLeft = (target.c * (this.orbSize + this.gap));
    const dx = targetLeft - target.baseLeft;
    const dy = targetTop - target.baseTop;
    
    target.el.style.transition = 'transform 120ms cubic-bezier(0.25, 1, 0.5, 1)';
    target.el.style.transform = this.getOrbTransform(target, dx, dy);
    target.el.style.zIndex = "";
    
    this.dragging = null;

    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);

    // 一筆書きインジケーターのクリーンアップ
    this._clearOneStrokeIndicators();
    this.oneStrokeVisited = null;

    // ドラッグ終了時に盤面全体の transition/クラスを一旦リセット
    this.state.forEach(row => {
      row.forEach(orb => {
        if (orb && orb !== target) {
          orb.el.classList.remove('orb-falling');
          orb.el.style.transition = '';
          if (orb._fallingTimeout) {
            clearTimeout(orb._fallingTimeout);
            this.activeTimeouts.delete(orb._fallingTimeout);
            orb._fallingTimeout = null;
          }
        }
      });
    });

    this.render();

    // クロノス・ストップ中はprocess()に進まない
    if (this.chronosStopActive) {
      // スナップアニメーションのクラスのクリーンアップはクロノス・ストップ中であっても行う
      setTimeout(() => {
        if (target && target.el) {
          target.el.classList.remove("orb-returning");
          target.el.style.transition = '';
        }
      }, 120);
      return;
    }

    // パズル操作が終了したので、倍速用ポインターのタッチ状態をリセットする
    this.isPointerDown = false;
    this.updateFastForwardState();

    // スナップアニメーションの完了を待ってから、必要に応じて process() を実行する
    setTimeout(() => {
      if (target && target.el) {
        target.el.classList.remove("orb-returning");
        target.el.style.transition = '';
      }
      
      // 修正: 動かしていない（スワップしていない）場合はターンを進めない
      // hasMoved はスワップが発生した時点でセットされる
      if (!hasMoved) {
        return;
      }
      
      if (!this._isDestroyed) {
        this.process();
      }
    }, 120);
  }

  setSpawnWeights(weights) {
    this.spawnWeights = { ...weights };
  }

  // --- Skill Actions ---
  // 指定された色のドロップを左上から順に整列させ、他のドロップを下・右に詰める
  organizeColor(targetColor) {
    if (this.processing) return;

    const D_list = [];
    const O_list = [];

    // 下から上、右から左の順に走査して分類
    for (let r = this.rows - 1; r >= 0; r--) {
      for (let c = this.cols - 1; c >= 0; c--) {
        const orb = this.state[r][c];
        if (orb) {
          if (orb.type === targetColor) {
            D_list.push(orb);
          } else {
            O_list.push(orb);
          }
        }
      }
    }

    // 新しい盤面状態を初期化
    const newState = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

    // 他のドロップ（O_list）を下から上、右から左の順に配置
    let oIdx = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      for (let c = this.cols - 1; c >= 0; c--) {
        if (oIdx < O_list.length) {
          newState[r][c] = O_list[oIdx++];
        }
      }
    }

    // 整理対象ドロップ（D_list）を残りの空きスペース（上部・左側）に左上から右の順に配置
    let dIdx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (newState[r][c] === null && dIdx < D_list.length) {
          newState[r][c] = D_list[dIdx++];
        }
      }
    }

    // 状態を更新
    this.state = newState;

    // 再描画（落下アニメーション付きで各ドロップの移動を表現）
    this.render('orb-falling');
  }

  // 指定された色のドロップを全て削除し、コンボ換算消去数と生の個数を返す非同期メソッド
  async eraseColor(targetColor) {
    if (this.processing) return { erasedCount: 0, rawCount: 0 };
    this.processing = true;

    const matchedOrbs = [];
    let erasedCount = 0; // 特殊ドロップ2倍換算の消去数
    let rawCount = 0;    // 実際の消去個数

    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && orb.type === targetColor) {
          matchedOrbs.push(orb);
          // ボム、リピート、スター、虹、ムーブドロップなどの特殊ドロップ判定
          const isSpecial = orb.isBomb || orb.isRepeat || orb.isStar || orb.isRainbow || orb.isMoveDrop;
          erasedCount += isSpecial ? 2 : 1;
          rawCount += 1;
        }
      });
    });

    if (matchedOrbs.length === 0) {
      this.processing = false;
      return { erasedCount: 0, rawCount: 0 };
    }

    // 消去アニメーションクラスの付与とエフェクト生成
    matchedOrbs.forEach((orb) => {
      orb.el.classList.add("orb-matching");
      this.createOrbEffect('len5', orb.r, orb.c);
    });

    soundManager.playSE(SE_IDS.BOMB_EXPLODE);

    // アニメーション完了を待つ (300ms)
    await this.sleep(300);
    if (this._isDestroyed) return { erasedCount, rawCount };

    // DOMからドロップ要素を削除し、盤面状態をクリア
    matchedOrbs.forEach((orb) => {
      orb.el.remove();
      this.state[orb.r][orb.c] = null;
    });

    // 少し待機してから落下処理を実行
    await this.sleep(100);
    if (this._isDestroyed) return { erasedCount, rawCount };

    // 落下および新規ドロップ補充
    await this.simultaneousGravity();
    if (this._isDestroyed) return { erasedCount, rawCount };

    // 落下アニメーションの完了を待機
    await this.sleep(450);
    if (this._isDestroyed) return { erasedCount, rawCount };

    this.processing = false;
    return { erasedCount, rawCount };
  }

  // 盤面上のすべてのドロップを指定した色の強化（プラス）ドロップに変換する
  changeBoardToEnhancedColor(targetColor) {
    if (this._isDestroyed) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && !orb.isMoveDrop) {
          orb.type = targetColor;
          orb.isEnhanced = true;
          // DOM要素のクラスと見た目の更新
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${targetColor}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${targetColor} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[targetColor];
          // プラス（強化）マークを追加
          this.addPlusMark(orb.el);
        }
      });
    });
    // 再描画
    this.render();
  }

  convertColor(fromType, toType) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && orb.type === fromType && !orb.isRainbow && !orb.isMoveDrop) {
          orb.type = toType;
          // Update shape and color
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
          this.applyAlchemyToOrb(orb, toType);
        }
      });
    });
  }

  convertMultiColor(types, toType) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && types.includes(orb.type) && !orb.isRainbow && !orb.isMoveDrop) {
          orb.type = toType;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
          this.applyAlchemyToOrb(orb, toType);
        }
      });
    });
  }

  convertPairColors(mapping) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && mapping[orb.type] && !orb.isRainbow && !orb.isMoveDrop) {
          const toType = mapping[orb.type];
          orb.type = toType;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
          this.applyAlchemyToOrb(orb, toType);
        }
      });
    });
  }

  applyAlchemyToOrb(orb, color) {
    if (!orb || orb.isRainbow || orb.isMoveDrop) return;
    const level = this.alchemyPassives?.[color];
    if (!level) return;

    // 1. 強化ドロップにする
    if (!orb.isEnhanced) {
      orb.isEnhanced = true;
      this.addPlusMark(orb.el);
    }

    // 2. 確率で特殊化
    const prob = [0.03, 0.05, 0.10][level - 1] || 0;
    if (Math.random() < prob) {
      if (!orb.isStar && !orb.isBomb && !orb.isRepeat) {
        const rand = Math.random();
        if (rand < 1/3) {
          orb.isBomb = true;
          this.addBombMark(orb.el);
        } else if (rand < 2/3) {
          orb.isRepeat = true;
          this.addRepeatMark(orb.el);
        } else {
          orb.isStar = true;
          this.addStarMark(orb.el);
        }
      }
    }
  }

  spawnRegeneratedDrops(colorList) {
    if (this.processing || !colorList || colorList.length === 0) return;
    const targets = colorList.slice(0, 30);
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isRainbow && !orb.isMoveDrop) {
          candidates.push(orb);
        }
      }
    }
    // Shuffle candidates
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const count = Math.min(targets.length, candidates.length);
    for (let i = 0; i < count; i++) {
      const orb = candidates[i];
      const type = targets[i];
      orb.type = type;
      if (orb.el) {
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-${type} shadow-lg`;
          const star = inner.querySelector('.enhanced-mark');
          const bomb = inner.querySelector('.bomb-mark');
          const repeat = inner.querySelector('.repeat-mark');
          const starMark = inner.querySelector('.star-mark');
          inner.innerHTML = '';
          const iconSpan = document.createElement("span");
          iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
          iconSpan.innerText = this.icons[type];
          inner.appendChild(iconSpan);
          if (star) inner.appendChild(star);
          if (bomb) inner.appendChild(bomb);
          if (repeat) inner.appendChild(repeat);
          if (starMark) inner.appendChild(starMark);
        }
      }
      this.applyAlchemyToOrb(orb, type);
    }
  }

  makeAllOrbsStarPlusRepeat() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb) {
          orb.isStar = true;
          orb.isEnhanced = true;
          orb.isRepeat = true;
          if (orb.el) {
            this.addStarMark(orb.el);
            this.addPlusMark(orb.el);
            this.addRepeatMark(orb.el);
          }
        }
      }
    }
  }

  // --- Star Drop Skills ---
  spawnStarRandom(count) {
    if (this.processing) return;
    const normalOrbs = [];
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && !orb.isStar && !orb.isBomb && !orb.isRepeat && !orb.isRainbow && !orb.isMoveDrop) {
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
        if (orb && orb.type === targetColor && !orb.isStar && !orb.isBomb && !orb.isRepeat && !orb.isRainbow && !orb.isMoveDrop) {
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

  // tokenInfo: { name: string, id: string } が渡るとパズル後演出と同じスタイルのトークンバナーを表示する
  async animateComboAdd(amount, tokenInfo = null) {
    if (amount <= 0) return;

    // --- トークン演出モード ---
    if (tokenInfo) {
      if (this.currentCombo >= MAX_COMBO) return;
      this.currentCombo = Math.min(this.currentCombo + amount, MAX_COMBO);
      this.onCombo(this.currentCombo);

      // onPassiveTriggerでトークンを跳ねさせる
      if (tokenInfo.id && this.onPassiveTrigger) {
        this.onPassiveTrigger(tokenInfo.id);
      }

      // コンボ音再生
      const pitch = Math.min(2.0, 1.0 + (this.currentCombo * 0.05));
      soundManager.playSE(SE_IDS.MATCH_NORMAL, pitch);

      if (this.comboEl) {
        const safeCombo = isNaN(this.currentCombo) ? 0 : this.currentCombo;

        // 先に comboEl の HTML をコンボ数で更新（既存のコンボカウンタ自体は更新）
        this.comboEl.innerHTML = `<span class="combo-number" id="rt-combo-num">${formatJapaneseNumber(safeCombo)}</span><span class="combo-label">COMBO</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');

        // トークンバナー: combo-bonus-add + combo-step-label 形式（パズル後演出と同じ CSS）
        const numEl = this.comboEl.querySelector('#rt-combo-num');
        if (numEl) {
          // 古いバナーを削除
          this.comboEl.querySelectorAll('.combo-bonus-add').forEach(el => el.remove());

          const bonusEl = document.createElement('span');
          // 5超えの場合は --large クラスで大きめに表示
          bonusEl.className = `combo-bonus-add${amount > 5 ? ' combo-bonus-add--large' : ''}`;
          bonusEl.innerHTML = `+${formatJapaneseNumber(amount)}<span class="combo-step-label">${tokenInfo.name}</span>`;
          numEl.parentNode.appendChild(bonusEl);

          // アニメーション完了後にバナーを削除
          await this.sleep(amount > 5 ? 650 : 500);
          if (!this._isDestroyed) {
            this.comboEl.querySelectorAll('.combo-bonus-add').forEach(el => el.remove());
          }
        } else {
          await this.sleep(300);
        }
      } else {
        await this.sleep(300);
      }
      return;
    }

    // --- 通常モード（トークン情報なし）---

    // 5より多い場合は一括で加算する簡略演出
    if (amount > 5) {
      if (this.currentCombo >= MAX_COMBO) return;
      this.currentCombo = Math.min(this.currentCombo + amount, MAX_COMBO);
      this.onCombo(this.currentCombo);

      // コンボ音の再生（新しいコンボ数に応じたピッチで1回のみ再生）
      const pitch = Math.min(2.0, 1.0 + (this.currentCombo * 0.05));
      soundManager.playSE(SE_IDS.MATCH_NORMAL, pitch);

      if (this.comboEl) {
        const safeCombo = isNaN(this.currentCombo) ? 0 : this.currentCombo;
        this.comboEl.innerHTML = `<span class="combo-number">${formatJapaneseNumber(safeCombo)}</span><span class="combo-label">COMBO</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(150); // ぽんと加算された後の短い余韻ウェイト
      return;
    }

    // 5以下の場合は従来通りの段階的な演出
    const stepDelay = Math.max(50, Math.min(250, 600 / amount)); // 段階的に増えるように速度調整
    for (let i = 0; i < amount; i++) {
      if (this.currentCombo >= MAX_COMBO) break;
      this.currentCombo = Math.min(this.currentCombo + 1, MAX_COMBO);
      this.onCombo(this.currentCombo);
      
      // コンボ音の再生（ピッチを段階的に上げる）
      const pitch = Math.min(2.0, 1.0 + (this.currentCombo * 0.05));
      soundManager.playSE(SE_IDS.MATCH_NORMAL, pitch);

      if (this.comboEl) {
        const safeCombo = isNaN(this.currentCombo) ? 0 : this.currentCombo;
        this.comboEl.innerHTML = `<span class="combo-number">${formatJapaneseNumber(safeCombo)}</span><span class="combo-label">COMBO</span>`;
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
        if (orb && !orb.isRainbow && !orb.isMoveDrop) {
          const type = types[Math.floor(Math.random() * types.length)];
          orb.type = type;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[type];
          this.applyAlchemyToOrb(orb, type);
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
      if (orb && !orb.isRainbow && !orb.isMoveDrop) {
        orb.type = type;
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
        const span = orb.el.querySelector("span");
        if (span) span.innerText = this.icons[type];
        this.applyAlchemyToOrb(orb, type);
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
      if (orb && !orb.isRainbow && !orb.isMoveDrop) {
        orb.type = type;
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
        const span = orb.el.querySelector("span");
        if (span) span.innerText = this.icons[type];
        this.applyAlchemyToOrb(orb, type);
      }
    });
  }

  // --- Step 4: 強化ドロップ操作 ---
  enhanceColorOrbs(colors) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && colors.includes(orb.type) && !orb.isEnhanced && !orb.isMoveDrop) {
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

  /** 特殊消し形状に応じたエフェクトを生成 */
  createShapeEffect(shape, group) {
    if (!group || group.length === 0) return;

    // 各ドロップに形状別の消滅用クラスを付与
    const animationClass = `orb-matching-${shape.replace('_', '-')}`;
    group.forEach(orb => {
      if (orb && orb.el) {
        orb.el.classList.add(animationClass);
      }
    });
  }

  /** 特殊ドロップ消滅時のエフェクト生成 (ボム、スター、虹用) */
  createOrbEffect(type, r, c) {
    const effectEl = document.createElement('div');
    effectEl.className = `shape-effect effect-${type}`;

    const top = r * (this.orbSize + this.gap) + this.orbSize / 2;
    const left = c * (this.orbSize + this.gap) + this.orbSize / 2;

    effectEl.style.top = `${top}px`;
    effectEl.style.left = `${left}px`;

    this.container.appendChild(effectEl);
    effectEl.addEventListener('animationend', () => effectEl.remove(), { once: true });
    setTimeout(() => { if (effectEl.parentNode) effectEl.remove(); }, 1000);
  }

  async forceRefresh() {
    if (this.processing) return;
    this.processing = true;

    // 1. Clear all orbs with animation
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && !orb.isMoveDrop) orb.el.classList.add("orb-matching");
      });
    });

    await this.sleep(300);
    if (this._isDestroyed) return;

    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb && !orb.isMoveDrop) {
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
    this.starCrossBoostActive = false;
    const shapes = []; // 特殊消し形状判定結果を蓄積
    const detailedShapes = []; // 新設: マッチごとの詳細情報 { shape, color, length }
    let overLinkMultiplier = 1; // 過剰結合倍率

    // --- 全消し判定用のカウンター ---
    const initialOrbCount = this.state.flat().filter(orb => orb !== null).length;
    let clearedInitialOrbs = 0;

    // --- ボムで消えたドロップ数のカウンター ---
    let erasedByBombTotal = 0;
    const erasedRowInfos = [];

    // --- リピートドロップで消えた回数のカウンター ---
    let erasedByRepeatTotal = 0;

    // --- スタードロップで消えた数のカウンター ---
    let erasedByStarTotal = 0;

    // --- 特殊ドロップ自体の消滅数のカウンター ---
    let bombSelfErased = 0;
    let repeatSelfErased = 0;
    let starSelfErased = 0;
    let rainbowSelfErased = 0;

    let loopGuard = 0;
    const MAX_LOOP = 50; // 無限ループ防止（1色100%など極端な状況の安全弁）
    while (loopGuard++ < MAX_LOOP) {
      const iterationErasedColors = new Set(); // このイテレーションで消えた色を追跡
      const groups = this.findCombos();
      if (groups.length === 0) break;

      // --- ボム処理を一番初めに行う ---
      const bombGroups = this.noSpecialEffects ? [] : groups.filter(g => g.some(o => o.isBomb));
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
            if (orb && targetColors.has(orb.type) && !orb.isMoveDrop) {
              bombTargets.push(orb);
            }
          });
        });

        if (bombTargets.length > 0) {
          erasedByBombTotal += bombTargets.length;
          erasedByStarTotal += bombTargets.filter(o => o.isStar).length;
          bombTargets.forEach(orb => this.erasedByBombColors.push(orb.type));

          const enhancedBonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);

          let totalAddition = 0;

          for (const targetOrb of bombTargets) {
            targetOrb.el.classList.add("orb-matching");
            this.createOrbEffect('len5', targetOrb.r, targetOrb.c);

            let addition = 1;
            // プラスドロップ効果は発動する（特殊消し効果は乗らない）
            if (targetOrb.isEnhanced) {
              addition += enhancedBonusPerOrb;
            }
            totalAddition += addition;

            const type = targetOrb.type;
            if (colorComboCounts[type] !== undefined) {
              colorComboCounts[type]++;
              erasedColorCounts[type]++; // NOTE: This adds +1 per orb, not per group. Compatible with color combo.
              iterationErasedColors.add(type);
            }
            if (!targetOrb.isSkyfall) clearedInitialOrbs++;
          }

          soundManager.playSE(SE_IDS.BOMB_EXPLODE);

          await this.sleep(300);
          if (this._isDestroyed) return;

          for (const targetOrb of bombTargets) {
            targetOrb.el.remove();
            this.state[targetOrb.r][targetOrb.c] = null;
          }

          await this.animateComboAdd(totalAddition);
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
          if (!this.noSpecialEffects) {
            group.filter(o => o.isRainbow).forEach(o => {
              // Mark for decrement
              o._pendingRainbowHits = (o._pendingRainbowHits || 0) + 1;
              rainbowOrbsToUpdate.add(o);
            });
          }
        }

        // グループ内のリピートドロップ数をカウント
        const repeatCount = this.noSpecialEffects ? 0 : group.filter(o => o.isRepeat).length;
        // リピート回数は最低1回（通常の消去）＋リピートドロップ数
        let extraRepeat = 0;
        if (repeatCount > 0 && this.realtimeBonuses?.extra_repeat_activations) {
          extraRepeat = this.realtimeBonuses.extra_repeat_activations;
          if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.extra_repeat_activations) {
            this.realtimeBonuses.tokenIds.extra_repeat_activations.forEach(id => this.onPassiveTrigger(id));
          }
        }
        const totalClears = 1 + repeatCount + extraRepeat;
        const shape = this.classifyShape(group);
        if (shape === "row") {
          const rowsInGroup = new Set(group.map(o => o.r));
          const minR = Math.min(...rowsInGroup);
          const type = group.groupType || (group.length > 0 ? group[0].type : null);
          erasedRowInfos.push({ r: minR, type });
        }
        if (shape === "cross" && group.some(o => o.isStar)) {
          this.starCrossBoostActive = true;
        }

        for (let clearNum = 0; clearNum < totalClears; clearNum++) {
          if (clearNum > 0) {
            // 2回目以降の消去時：復活アニメーション（アイコンを消して再度準備）
            group.forEach((o) => {
              o.isRepeat = false;
              if (o.el) {
                // すべての消滅アニメーション用クラスを削除
                o.el.classList.remove("orb-matching");
                o.el.classList.remove("orb-matching-len4");
                o.el.classList.remove("orb-matching-row");
                o.el.classList.remove("orb-matching-cross");
                o.el.classList.remove("orb-matching-l-shape");
                o.el.classList.remove("orb-matching-square");
                o.el.classList.remove("orb-matching-len5");
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
            soundManager.playSE(SE_IDS.ORB_REVIVE);
            await this.sleep(220);
            if (this._isDestroyed) return;
            erasedByRepeatTotal += repeatCount; // 消えたリピートドロップ数を加算
          }
          const starsMatched = this.noSpecialEffects ? 0 : group.filter(o => o.isStar).length;
          erasedByStarTotal += starsMatched; // スタードロップ消去数を加算
          if (starsMatched > 0 && this.onStarErase) {
            soundManager.playSE(SE_IDS.MATCH_STAR);
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

          if (clearNum === 0 && type) {
            detailedShapes.push({ shape: shape || null, color: type, length: group.length });
          }

          if (shape && clearNum === 0) {
            shapes.push(shape);
            this.createShapeEffect(shape, group);
            soundManager.playSE(SE_IDS.SHAPE_BONUS);
          }

          // --- 特殊消しリアルタイム加算 ---
          let addition = 1;
          // トークン演出用ボーナス（通常加算後に個別表示）
          const tokenBonuses = [];


          if (!this.pureMode) {
            // Rainbow Combo Bonus
            if (hasRainbow && !this.noSpecialEffects && this.realtimeBonuses?.rainbow_combo_bonus) {
              addition += this.realtimeBonuses.rainbow_combo_bonus;
              if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.rainbow_combo_bonus) {
                this.realtimeBonuses.tokenIds.rainbow_combo_bonus.forEach(id => this.onPassiveTrigger(id));
              }
            }

            // 強化ドロップボーナス（1回目のみ加算するのが自然だが、リピートという性質上毎回適用する）
            const enhancedCount = this.noSpecialEffects ? 0 : group.filter(o => o.isEnhanced).length;
            const enhancedBonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);
            if (enhancedCount > 0 && this.realtimeBonuses?.enhancedOrbBonus > 0 && this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.enhancedOrbBonus) {
              this.realtimeBonuses.tokenIds.enhancedOrbBonus.forEach(id => this.onPassiveTrigger(id));
              soundManager.playSE(SE_IDS.MATCH_PLUS);
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

            // Color Combo Bonus: トークン情報付き配列形式に対応
            if (type && this.realtimeBonuses?.color_combo?.[type]) {
              const colorEntries = this.realtimeBonuses.color_combo[type];
              // tokenBonusInfo: 合算値 + 代表トークン情報
              const tokenBonusValue = colorEntries.reduce((s, e) => s + (e.value || 0), 0);
              const tokenBonusInfo = colorEntries.length > 0
                ? { name: colorEntries[0].tokenName, id: colorEntries[0].tokenId }
                : null;
              if (tokenBonusValue > 0) {
                tokenBonuses.push({ amount: tokenBonusValue, info: tokenBonusInfo });
              }
            }

            // Heart Combo Bonus: トークン情報付き配列形式に対応
            if (type === 'heart' && this.realtimeBonuses?.heart_combo?.length > 0) {
              const heartEntries = this.realtimeBonuses.heart_combo;
              const heartBonusValue = heartEntries.reduce((s, e) => s + (e.value || 0), 0);
              const heartBonusInfo = { name: heartEntries[0].tokenName, id: heartEntries[0].tokenId };
              if (heartBonusValue > 0) {
                tokenBonuses.push({ amount: heartBonusValue, info: heartBonusInfo });
              }
              if (this.onPassiveTrigger) {
                heartEntries.forEach(e => this.onPassiveTrigger(e.tokenId));
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
              soundManager.playSE(SE_IDS.MATCH_RAINBOW);
            }

            // Apply Mastery Multiplier (Real-time)
            if (this.realtimeBonuses?.masteryMultiplier) {
              addition *= this.realtimeBonuses.masteryMultiplier;
            }
          }

          group.forEach((o) => {
            if (o.el) {
              void o.el.offsetWidth; // force reflow
              // 虹ドロップ以外のみ消滅アニメーションを適用（ガタつき防止）
              if (!o.isRainbow) {
                o.el.classList.add("orb-matching");
                orbsToEraseThisTurn.add(o); // Mark for deferred deletion
              }
            }
          });

          // 通常コンボ加算（トークンボーナスなし）
          groupComboPromises.push(this.animateComboAdd(addition));

          await this.sleep(300);
          if (this._isDestroyed) return;
          // We no longer remove DOM immediately here!

          await groupComboPromises[groupComboPromises.length - 1]; // Wait for this specific combo
          await this.sleep(50);
          if (this._isDestroyed) return;

          // トークン演出（color_combo / heart_combo によるボーナス）
          for (const tb of tokenBonuses) {
            if (this._isDestroyed) break;
            await this.animateComboAdd(tb.amount, tb.info);
            await this.sleep(100);
            if (this._isDestroyed) break;
          }
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
        if (orb.isBomb) bombSelfErased++;
        if (orb.isRepeat) repeatSelfErased++;
        if (orb.isStar) starSelfErased++;
        if (orb.isRainbow) rainbowSelfErased++;

        if (orb.el) {
          // スタードロップ消滅時の固有エフェクト
          if (orb.isStar) {
            this.createOrbEffect('len4', orb.r, orb.c); // len4エフェクトを流用
          }
          // 虹ドロップ消滅時の固有エフェクト
          if (orb.isRainbow) {
            this.createOrbEffect('len5', orb.r, orb.c); // len5エフェクトを流用
          }
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
      if (!this.realtimeBonuses?.hasMastery) {
        this.currentCombo = Math.min(this.currentCombo * 2, MAX_COMBO);
      }
      if (this.comboEl) {
        const safeCombo = isNaN(this.currentCombo) ? 0 : this.currentCombo;
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ ALL CLEAR ✦</div><span class="combo-number combo-number-final">${formatJapaneseNumber(safeCombo)}</span><span class="combo-label">×2</span>`;
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
      soundManager.playSE(SE_IDS.PERFECT_CLEAR);
      // 全消しボーナス: +10コンボ
      let pBonus = 10;
      if (this.realtimeBonuses?.masteryMultiplier) {
        pBonus *= this.realtimeBonuses.masteryMultiplier;
      }
      this.currentCombo = Math.min(this.currentCombo + pBonus, MAX_COMBO);
      if (!this.realtimeBonuses?.hasMastery) {
        this.currentCombo = Math.min(this.currentCombo * 2, MAX_COMBO);
      }
      if (this.comboEl) {
        const safeCombo = isNaN(this.currentCombo) ? 0 : this.currentCombo;
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ PERFECT CLEAR ✦</div><span class="combo-number combo-number-final">${formatJapaneseNumber(safeCombo)}</span><span class="combo-label">+10 & ×2</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(1000);
      if (this._isDestroyed) return;
    }

    if (this.onTurnEnd) {
      await this.onTurnEnd(
        this.currentCombo,
        colorComboCounts,
        erasedColorCounts,
        hasSkyfallCombo,
        shapes,
        overLinkMultiplier,
        erasedByBombTotal,
        erasedByRepeatTotal,
        erasedByStarTotal,
        isPerfect || allInitialOrbsCleared,
        { bombSelfErased, repeatSelfErased, starSelfErased, rainbowSelfErased, erasedRowInfos },
        detailedShapes,
        this.lastTurnRemainingTimeMs || 0
      );
    }

    // ターン終了したため、盤面上のすべてのムーブドロップのカウントとステップをリセットする
    this.state.forEach(row => {
      row.forEach(orb => {
        if (orb && orb.isMoveDrop) {
          orb.moveCount = 0;
          orb.moveSteps = 0;
          const textEl = orb.el.querySelector('.move-count-text');
          if (textEl) textEl.innerText = orb.moveCount;
        }
      });
    });

    this.processing = false;
  }

  findCombos() {
    if (this.calmActive) {
      return [];
    }
    // Instead of matching by exact type, we check for each basic color
    const basicTypes = ["fire", "water", "wood", "light", "dark", "heart"];
    const allGroups = [];

    // Keep track of visited nodes per color to avoid duplicate groups per color
    const visitedPerColor = {};
    basicTypes.forEach(t => {
      visitedPerColor[t] = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    });

    for (const color of basicTypes) {
      if (this.noEraseColors && this.noEraseColors.includes(color)) continue;
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

    let filteredGroups = allGroups;
    if (this.fourMatchRestriction) {
      filteredGroups = filteredGroups.filter(g => this.classifyShape(g) === "len4");
    } else if (this.rowMatchRestriction) {
      filteredGroups = filteredGroups.filter(g => this.classifyShape(g) === "row");
    }

    return filteredGroups;
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

      // 縦1列: 盤面高さ（行数）分のオーブが同じ列にある
      if (len === this.rows && cols.size === 1) return "column";

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
        const orb = this.state[r][c];
        if (orb && orb.type !== type && !orb.isRainbow && !orb.isMoveDrop) {
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
      this.applyAlchemyToOrb(orb, type);
    });
  }

  changeBoardBalanced() {
    let basicTypes = ["fire", "water", "wood", "light", "dark"];
    if (this.vacationMode) {
      basicTypes = ["fire", "water", "wood"];
    }
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
        if (orb && orb.isRainbow) {
          idx++;
          continue;
        }
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
        this.applyAlchemyToOrb(orb, type);
      }
    }
  }

  spawnBombRandom(count) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isBomb && !orb.isRainbow) {
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
      const aTypes = this.getAvailableTypes(true);
      const type = aTypes[Math.floor(Math.random() * aTypes.length)];
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
        if (orb && !orb.isBomb && !orb.isRainbow && (!targetType || orb.type === targetType)) {
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
        if (orb && !orb.isRepeat && !orb.isRainbow) {
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
        if (orb && !orb.isRepeat && !orb.isRainbow && (!targetType || orb.type === targetType)) {
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
        if (orb && !orb.isRainbow && !orb.isMoveDrop) {
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
    if (this.gravityDirection === 'up') {
      // 上方向重力: オーブを上へ詰める
      for (let c = 0; c < this.cols; c++) {
        let emptySlots = 0;
        for (let r = 0; r < this.rows; r++) {
          if (this.state[r][c] === null) {
            emptySlots++;
          } else if (emptySlots > 0) {
            const orb = this.state[r][c];
            this.state[r - emptySlots][c] = orb;
            this.state[r][c] = null;
            orb.r = r - emptySlots;
          }
        }
      }
    } else if (this.gravityDirection === 'left') {
      // 左方向重力: オーブを左へ詰める
      for (let r = 0; r < this.rows; r++) {
        let emptySlots = 0;
        for (let c = 0; c < this.cols; c++) {
          if (this.state[r][c] === null) {
            emptySlots++;
          } else if (emptySlots > 0) {
            const orb = this.state[r][c];
            this.state[r][c - emptySlots] = orb;
            this.state[r][c] = null;
            orb.c = c - emptySlots;
          }
        }
      }
    } else if (this.gravityDirection === 'right') {
      // 右方向重力: オーブを右へ詰める
      for (let r = 0; r < this.rows; r++) {
        let emptySlots = 0;
        for (let c = this.cols - 1; c >= 0; c--) {
          if (this.state[r][c] === null) {
            emptySlots++;
          } else if (emptySlots > 0) {
            const orb = this.state[r][c];
            this.state[r][c + emptySlots] = orb;
            this.state[r][c] = null;
            orb.c = c + emptySlots;
          }
        }
      }
    } else {
      // 下方向重力（デフォルト）
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
      }
    }
    // 強制的にリフローを発生させ、既存のstyle変更をブラウザに認識させる
    void this.container.offsetHeight;

    // 落下アニメーションクラスを付与してrender
    await this.sleep(10);
    if (this._isDestroyed) return;
    this.render('orb-falling');
  }

  async simultaneousGravity() {
    if (this.gravityDirection === 'up') {
      // 上方向重力: オーブを上へ詰め、下端から新規オーブを生成
      for (let c = 0; c < this.cols; c++) {
        let emptySlots = 0;
        for (let r = 0; r < this.rows; r++) {
          if (this.state[r][c] === null) {
            emptySlots++;
          } else if (emptySlots > 0) {
            const orb = this.state[r][c];
            this.state[r - emptySlots][c] = orb;
            this.state[r][c] = null;
            orb.r = r - emptySlots;
          }
        }
        // 下端（rows-1 から上方向）に空きスロット分の新規オーブを生成
        for (let i = 0; i < emptySlots; i++) {
          const targetRow = this.rows - 1 - i;
          this.spawnOrb(targetRow, c, true, emptySlots - 1 - i);
        }
      }
    } else if (this.gravityDirection === 'left') {
      // 左方向重力: オーブを左へ詰め、右端から新規オーブを生成
      for (let r = 0; r < this.rows; r++) {
        let emptySlots = 0;
        for (let c = 0; c < this.cols; c++) {
          if (this.state[r][c] === null) {
            emptySlots++;
          } else if (emptySlots > 0) {
            const orb = this.state[r][c];
            this.state[r][c - emptySlots] = orb;
            this.state[r][c] = null;
            orb.c = c - emptySlots;
          }
        }
        // 右端（cols-1 から左方向）に空きスロット分の新規オーブを生成
        for (let i = 0; i < emptySlots; i++) {
          const targetCol = this.cols - 1 - i;
          this.spawnOrb(r, targetCol, true, emptySlots - 1 - i);
        }
      }
    } else if (this.gravityDirection === 'right') {
      // 右方向重力: オーブを右へ詰め、左端から新規オーブを生成
      for (let r = 0; r < this.rows; r++) {
        let emptySlots = 0;
        for (let c = this.cols - 1; c >= 0; c--) {
          if (this.state[r][c] === null) {
            emptySlots++;
          } else if (emptySlots > 0) {
            const orb = this.state[r][c];
            this.state[r][c + emptySlots] = orb;
            this.state[r][c] = null;
            orb.c = c + emptySlots;
          }
        }
        // 左端（0 から右方向）に空きスロット分の新規オーブを生成
        for (let i = 0; i < emptySlots; i++) {
          this.spawnOrb(r, i, true, emptySlots - 1 - i);
        }
      }
    } else {
      // 下方向重力（デフォルト）
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
    }
    // 強制的にリフローを発生させ、初期のtransform位置をブラウザに確実に認識させる
    void this.container.offsetHeight;

    // 少し待ってから落下アニメーションを開始
    await this.sleep(10);
    if (this._isDestroyed) return;
    this.render('orb-falling');
  }


  /** 一筆書きの誓約: 通過セルのビジュアルインジケーターを生成 */
  _createOneStrokeIndicator(r, c) {
    const indicator = document.createElement('div');
    indicator.className = 'one-stroke-tile';
    // オーブと同じサイズ・位置に絶対配置
    const baseTop = r * (this.orbSize + this.gap);
    const baseLeft = c * (this.orbSize + this.gap);
    indicator.style.width = `${this.orbSize}px`;
    indicator.style.height = `${this.orbSize}px`;
    indicator.style.top = `${baseTop}px`;
    indicator.style.left = `${baseLeft}px`;
    this.container.appendChild(indicator);
  }

  /** 一筆書きの誓約: 全インジケーターを削除 */
  _clearOneStrokeIndicators() {
    if (!this.container) return;
    const indicators = this.container.querySelectorAll('.one-stroke-tile');
    indicators.forEach(el => el.remove());
  }

  // --- 単色全消しチェック（ヘルパー） ---
  // 盤面が空 かつ このイテレーションで消えた色がちょうど1種類なら +20コンボ
  async _checkMonoClear(iterationErasedColors) {
    if (iterationErasedColors.size !== 1) return;
    const boardEmpty = this.state.every(row => row.every(orb => orb === null));
    if (!boardEmpty || this.currentCombo <= 0) return;

    this.currentCombo = Math.min(this.currentCombo + 20, MAX_COMBO);
    if (this.comboEl) {
      const safeCombo = isNaN(this.currentCombo) ? 0 : this.currentCombo;
      this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ MONO CLEAR ✦</div><span class="combo-number combo-number-final">${formatJapaneseNumber(safeCombo)}</span><span class="combo-label">+20</span>`;
      this.comboEl.classList.remove('animate-combo-pop');
      void this.comboEl.offsetWidth;
      this.comboEl.classList.add('animate-combo-pop');
    }
    await this.sleep(800);
  }

  updateFastForwardState() {
    const shouldFast = this.processing && this.isPointerDown && !this.dragging;
    if (shouldFast) {
      if (!this.isFastForward) {
        this.isFastForward = true;
        this.container.classList.add('is-fast-forward');
        this.container.setAttribute('data-speed-multiplier', `${this.speedMultiplier || 3}x`);
      }
    } else {
      if (this.isFastForward) {
        this.isFastForward = false;
        this.container.classList.remove('is-fast-forward');
        this.container.removeAttribute('data-speed-multiplier');
      }
    }
  }

  sleep(ms) {
    this.updateFastForwardState();
    const speed = this.speedMultiplier || 3;
    const factor = this.isFastForward ? (1.0 / speed) : 1.0;
    return new Promise((res) => setTimeout(res, ms * factor));
  }

  // --- ムーブドロップの同期処理 ---
  syncMoveDrops(moveDropConfigs) {
    if (this._isDestroyed || !this.state || this.state.length === 0) return;

    const currentMoveDrops = [];
    const normalOrbs = [];

    // 現在の盤面を走査
    this.state.forEach(row => {
      row.forEach(orb => {
        if (!orb) return;
        if (orb.isMoveDrop) {
          currentMoveDrops.push(orb);
        } else if (!orb.isRainbow && !orb.isBomb && !orb.isRepeat && !orb.isStar) {
          normalOrbs.push(orb);
        }
      });
    });

    // config に存在しないものを削除（通常のドロップに戻す）
    const configIds = moveDropConfigs.map(c => c.tokenId);
    currentMoveDrops.forEach(orb => {
      if (!configIds.includes(orb.moveTokenId)) {
        // 通常ドロップに書き換える
        orb.isMoveDrop = false;
        orb.moveTokenId = null;
        const aTypes = this.getAvailableTypes(true);
        orb.type = aTypes[Math.floor(Math.random() * aTypes.length)];
        
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${orb.type}`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-${orb.type} shadow-lg`;
          inner.innerHTML = ''; // span等をクリア
          const iconSpan = document.createElement("span");
          iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
          iconSpan.innerText = this.icons[orb.type];
          inner.appendChild(iconSpan);
        }
      }
    });

    // 新たに追加すべきものをさがす
    const existingIds = currentMoveDrops.filter(o => o.isMoveDrop && configIds.includes(o.moveTokenId)).map(o => o.moveTokenId);
    moveDropConfigs.forEach(config => {
      if (!existingIds.includes(config.tokenId)) {
        // 新規追加
        if (normalOrbs.length > 0) {
          // ランダムな位置の通常ドロップを選ぶ
          const targetIdx = Math.floor(Math.random() * normalOrbs.length);
          const orb = normalOrbs.splice(targetIdx, 1)[0];
          
          orb.isMoveDrop = true;
          orb.moveTokenId = config.tokenId;
          orb.moveCount = 0;
          orb.moveSteps = 0;
          orb.moveRequired = config.requiredWalks || 5;
          orb.type = "move"; // 内部処理用
          
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-move`;
          const inner = orb.el.querySelector('.orb-inner');
          if (inner) {
            inner.className = `orb-inner orb-move shadow-lg`;
            inner.innerHTML = '';
            const countSpan = document.createElement("span");
            countSpan.className = "move-count-text";
            countSpan.innerText = orb.moveCount;
            inner.appendChild(countSpan);
          }
        }
      } else {
        // 既存のドロップの設定更新（レベルアップ等でrequiredWalksが変わった場合など）
        const orb = currentMoveDrops.find(o => o.isMoveDrop && o.moveTokenId === config.tokenId);
        if (orb) {
          orb.moveRequired = config.requiredWalks || 5;
        }
      }
    });
  }

  convertRowNeighbors(r, toType, probability) {
    const targetRows = [r - 1, r + 1].filter(tr => tr >= 0 && tr < this.rows);
    targetRows.forEach(tr => {
      this.state[tr].forEach(orb => {
        if (orb && !orb.isRainbow && !orb.isMoveDrop && Math.random() < probability) {
          orb.type = toType;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          const inner = orb.el.querySelector(".orb-inner");
          if (inner) inner.className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
          this.applyAlchemyToOrb(orb, toType);
        }
      });
    });
  }

  enhanceRandomOrbs(count) {
    const candidates = [];
    this.state.forEach(row => {
      row.forEach(orb => {
        if (orb && !orb.isEnhanced && !orb.isMoveDrop) {
          candidates.push(orb);
        }
      });
    });

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach(orb => {
      orb.isEnhanced = true;
      if (orb.el) {
        this.addPlusMark(orb.el);
      }
    });
  }

  destroy() {
    this._isDestroyed = true;
    clearInterval(this.timerId);
    clearTimeout(this.chronosTimerId);
    
    // アクティブなタイマー（落下アニメーションのクリーンアップ用など）をすべてクリア
    if (this.activeTimeouts) {
      this.activeTimeouts.forEach(id => clearTimeout(id));
      this.activeTimeouts.clear();
    }
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
    window.removeEventListener("touchcancel", this.onEnd);
    window.removeEventListener('mousedown', this.onPointerDownForSpeed);
    window.removeEventListener('mouseup', this.onPointerUpForSpeed);
    window.removeEventListener('touchstart', this.onPointerDownForSpeed);
    window.removeEventListener('touchend', this.onPointerUpForSpeed);
    window.removeEventListener('touchcancel', this.onPointerUpForSpeed);
  }
}

export { PuzzleEngine };
