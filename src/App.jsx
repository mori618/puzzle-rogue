import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Star,
  RotateCcw,
  Sparkles,
} from "lucide-react";

// --- Constants (RPG) ---
const ALL_TOKEN_BASES = [
  // --- Skills: Conversion ---
  { id: "fired", name: "焔の変換", type: "skill", cost: 3, action: "convert", params: { from: "wood", to: "fire" }, price: 3, desc: "木を火に変換。消費E:3" },
  { id: "waterd", name: "氷の変換", type: "skill", cost: 3, action: "convert", params: { from: "fire", to: "water" }, price: 3, desc: "火を水に変換。消費E:3" },
  { id: "woodd", name: "嵐の変換", type: "skill", cost: 3, action: "convert", params: { from: "water", to: "wood" }, price: 3, desc: "水を木に変換。消費E:3" },
  { id: "lightd", name: "雷の変換", type: "skill", cost: 3, action: "convert", params: { from: "dark", to: "light" }, price: 3, desc: "闇を光に変換。消費E:3" },
  { id: "darkd", name: "影の変換", type: "skill", cost: 3, action: "convert", params: { from: "light", to: "dark" }, price: 3, desc: "光を闇に変換。消費E:3" },
  { id: "heartd", name: "癒の変換", type: "skill", cost: 3, action: "convert", params: { from: "fire", to: "heart" }, price: 3, desc: "火を回復に変換。消費E:3" },

  // --- Skills: Board Change (3-Color) ---
  { id: "board_tri1", name: "三色の真理・紅蓮", type: "skill", cost: 7, action: "board_change", params: { colors: ["fire", "water", "wood"] }, price: 5, desc: "盤面を火/水/木に変更。消費E:7" },
  { id: "board_tri2", name: "三色の真理・天地", type: "skill", cost: 7, action: "board_change", params: { colors: ["light", "dark", "heart"] }, price: 5, desc: "盤面を光/闇/回復に変更。消費E:7" },
  { id: "board_tri3", name: "三色の真理・黄昏", type: "skill", cost: 7, action: "board_change", params: { colors: ["fire", "water", "dark"] }, price: 5, desc: "盤面を火/水/闇に変更。消費E:7" },
  { id: "board_tri4", name: "三色の真理・神緑", type: "skill", cost: 7, action: "board_change", params: { colors: ["light", "wood", "heart"] }, price: 5, desc: "盤面を光/木/回復に変更。消費E:7" },

  // --- Skills: Board Change (2-Color) ---
  { id: "board_bi1", name: "双龍の陣", type: "skill", cost: 8, action: "board_change", params: { colors: ["fire", "water"] }, price: 6, desc: "盤面を火/水の2色に変更。消費E:8" },
  { id: "board_bi2", name: "明暗の陣", type: "skill", cost: 8, action: "board_change", params: { colors: ["light", "dark"] }, price: 6, desc: "盤面を光/闇の2色に変更。消費E:8" },
  { id: "board_bi3", name: "風癒の陣", type: "skill", cost: 8, action: "board_change", params: { colors: ["wood", "heart"] }, price: 6, desc: "盤面を木/回復の2色に変更。消費E:8" },

  // --- Skills: Board Change (1-Color) ---
  { id: "board_mono1", name: "真・紅蓮の極致", type: "skill", cost: 10, action: "board_change", params: { colors: ["fire"] }, price: 8, desc: "盤面すべてを火に変更。消費E:10" },
  { id: "board_mono2", name: "真・閃光の極致", type: "skill", cost: 10, action: "board_change", params: { colors: ["light"] }, price: 8, desc: "盤面すべてを光に変更。消費E:10" },

  // --- Skills: Skyfall Manipulation ---
  { id: "sky_f1", name: "紅蓮の目覚め", type: "skill", cost: 4, action: "skyfall", params: { colors: ["fire"], weight: 5, duration: 3 }, price: 4, desc: "3手番、火がかなり落ちやすくなる。消費E:4" },
  { id: "sky_w2", name: "双流の波紋", type: "skill", cost: 4, action: "skyfall", params: { colors: ["water", "wood"], weight: 3, duration: 2 }, price: 4, desc: "2手番、水と木が落ちやすくなる。消費E:4" },
  { id: "sky_limit", name: "三色の結界", type: "skill", cost: 6, action: "skyfall_limit", params: { colors: ["fire", "water", "wood"], duration: 3 }, price: 5, desc: "3手番、火/水/木しか落ちてこなくなる。消費E:6" },

  // --- Skills: Multi-Conversion ---
  { id: "conv_m1", name: "大地の恵み", type: "skill", cost: 5, action: "convert_multi", params: { types: ["fire", "water"], to: "wood" }, price: 4, desc: "火と水を木に変換。消費E:5" },
  { id: "conv_m2", name: "福音の祈り", type: "skill", cost: 5, action: "convert_multi", params: { types: ["light", "dark"], to: "heart" }, price: 4, desc: "光と闇を回復に変換。消費E:5" },
  { id: "conv_m3", name: "冥風の烈火", type: "skill", cost: 5, action: "convert_multi", params: { types: ["water", "dark"], to: "fire" }, price: 4, desc: "水と闇を火に変換。消費E:5" },
  { id: "conv_m4", name: "天啓の閃光", type: "skill", cost: 5, action: "convert_multi", params: { types: ["wood", "heart"], to: "light" }, price: 4, desc: "木と回復を光に変換。消費E:5" },

  // --- Skills: Row Fix ---
  { id: "row_f", name: "烈火の横一文字", type: "skill", cost: 5, action: "row_fix", params: { row: 0, type: "fire" }, price: 4, desc: "上段をすべて火に。消費E:5" },
  { id: "row_w", name: "清流の横一文字", type: "skill", cost: 5, action: "row_fix", params: { row: 0, type: "water" }, price: 4, desc: "上段をすべて水に。消費E:5" },
  { id: "row_g", name: "深翠の横一文字", type: "skill", cost: 5, action: "row_fix", params: { row: 0, type: "wood" }, price: 4, desc: "上段をすべて木に。消費E:5" },
  { id: "row_l", name: "閃光の横一文字", type: "skill", cost: 5, action: "row_fix", params: { row: 0, type: "light" }, price: 4, desc: "上段をすべて光に。消費E:5" },
  { id: "row_d", name: "常闇の横一文字", type: "skill", cost: 5, action: "row_fix", params: { row: 0, type: "dark" }, price: 4, desc: "上段をすべて闇に。消費E:5" },
  { id: "row_h", name: "生命の横一文字", type: "skill", cost: 5, action: "row_fix", params: { row: 0, type: "heart" }, price: 4, desc: "上段をすべて回復に。消費E:5" },

  {
    id: "refresh",
    name: "次元の再編",
    type: "skill",
    cost: 3,
    action: "force_refresh",
    price: 3,
    desc: "全消去して再落下。落ちコンあり。消費E:3",
  },
  {
    id: "collector",
    name: "黄金の収集者",
    type: "passive",
    effect: "star_gain",
    values: [4, 3, 1],
    price: 3,
    desc: "★獲得に必要なコンボ数をLvに応じ4/3/1に短縮。",
  },
  {
    id: "time_ext",
    name: "時の砂",
    type: "passive",
    effect: "time",
    values: [1000, 2000, 3000],
    price: 2,
    desc: "操作時間をLvに応じ1/2/3秒延長。",
  },
  {
    id: "power_up",
    name: "力の鼓動",
    type: "passive",
    effect: "base_add",
    values: [1, 2, 3],
    price: 2,
    desc: "コンボ加算にLv分の固定値を追加。",
  },
  {
    id: "forbidden",
    name: "禁忌の儀式(パッシブ)",
    type: "passive",
    effect: "forbidden",
    values: [3, 4, 10],
    price: 5,
    desc: "常時落ちコン停止。Lvに応じコンボ加算3/4/10倍。",
  },
  {
    id: "bargain",
    name: "商談の極意",
    type: "passive",
    effect: "sale_boost",
    values: [2, 3, 4],
    price: 4,
    desc: "ショップに並ぶセール品（半額）の数をLvに応じ2/3/4個に増加させる。",
  },
];

const ENCHANTMENTS = [
  {
    id: "giant",
    name: "巨人の領域",
    effect: "expand_board",
    price: 6,
    desc: "装備中、盤面が7x6に拡張される。",
  },
  {
    id: "resonance",
    name: "レベル共鳴",
    effect: "lvl_mult",
    price: 8,
    desc: "トークンのLv分、コンボ加算値を乗算する。",
  },
  {
    id: "greed",
    name: "強欲の輝き",
    effect: "star_add",
    price: 9,
    desc: "現在の所持★数をコンボ加算値に加える。",
  },
  {
    id: "chain",
    name: "連鎖の刻印",
    effect: "fixed_add",
    value: 2,
    price: 5,
    desc: "コンボ加算値を一律+2する。",
  },
  {
    id: "extra_turn",
    name: "時の刻印",
    effect: "add_turn",
    price: 7,
    desc: "目標達成までの手番が +1 される。",
  },
];

// --- Puzzle Engine (Imperative Logic) ---
class PuzzleEngine {
  constructor(container, timerBar, comboEl, options = {}) {
    this.container = container;
    this.timerBar = timerBar;
    this.comboEl = comboEl;
    this.rows = options.rows || 5;
    this.cols = options.cols || 6;
    this.timeLimit = options.timeLimit || 5000;
    this.onTurnEnd = options.onTurnEnd || (() => { });
    this.onCombo = options.onCombo || (() => { });

    this.orbSize = 60;

    this.types = ["fire", "water", "wood", "light", "dark", "heart"];
    this.icons = {
      fire: "🔥",
      water: "💧",
      wood: "🌿",
      light: "✨",
      dark: "🌙",
      heart: "❤️",
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

    // Bindings
    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.updateTimer = this.updateTimer.bind(this);
  }

  init() {
    if (this.processing) return;
    this.state = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(null),
    );
    this.container.innerHTML = "";
    this.currentCombo = 0;
    this.comboEl.innerText = "";

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.spawnOrb(r, c, false);
      }
    }
    this.render();
  }

  spawnOrb(r, c, isNew, startRowOffset = 0) {
    let type;
    if (!isNew) {
      let availableTypes = [...this.types];
      while (availableTypes.length > 0) {
        const idx = Math.floor(Math.random() * availableTypes.length);
        type = availableTypes[idx];
        const matchHorizontal =
          c >= 2 &&
          this.state[r][c - 1]?.type === type &&
          this.state[r][c - 2]?.type === type;
        const matchVertical =
          r >= 2 &&
          this.state[r - 1][c]?.type === type &&
          this.state[r - 2][c]?.type === type;
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
    el.className = `orb orb-${type} orb-shape-${type}`;
    el.innerHTML = this.icons[type];

    const handler = (e) => {
      // Prevent default only for touch to avoid scrolling
      if (e.type === "touchstart") e.preventDefault();
      this.onStart(e.type === "touchstart" ? e.touches[0] : e, r, c);
    };
    el.onmousedown = handler;
    el.ontouchstart = handler;

    const orb = { type, el, r, c };
    this.state[r][c] = orb;
    this.container.appendChild(el);

    if (isNew) {
      el.style.top = `-${(startRowOffset + 1) * this.orbSize}px`;
      el.style.left = `${c * this.orbSize}px`;
    }
  }

  render() {
    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb && orb !== this.dragging) {
          orb.el.style.top = `${r * this.orbSize}px`;
          orb.el.style.left = `${c * this.orbSize}px`;
          orb.r = r;
          orb.c = c;
        }
      });
    });
  }

  onStart(e, r, c) {
    if (this.processing) return;
    // Find current orb at this position in case state drifted (shouldn't happen but safe)
    const target = this.state[r][c];
    if (!target) return;

    this.dragging = target;
    this.dragging.el.classList.add("orb-grabbing");
    this.moveStart = null;

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
    const rect = this.container.getBoundingClientRect();
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;

    this.dragging.el.style.left = `${x - 30}px`; // -30 is half size approx
    this.dragging.el.style.top = `${y - 30}px`;

    if (!this.moveStart) {
      this.moveStart = Date.now();
      this.timerId = setInterval(this.updateTimer, 20);
    }

    const nc = Math.max(
      0,
      Math.min(this.cols - 1, Math.floor(x / this.orbSize)),
    );
    const nr = Math.max(
      0,
      Math.min(this.rows - 1, Math.floor(y / this.orbSize)),
    );

    if (nr !== this.dragging.r || nc !== this.dragging.c) {
      const target = this.state[nr][nc];
      this.state[nr][nc] = this.dragging;
      this.state[this.dragging.r][this.dragging.c] = target;

      target.r = this.dragging.r;
      target.c = this.dragging.c;
      this.dragging.r = nr;
      this.dragging.c = nc;

      this.render();
    }
  }

  updateTimer() {
    const elapsed = Date.now() - this.moveStart;
    const remain = Math.max(0, this.timeLimit - elapsed);
    if (this.timerBar) {
      this.timerBar.style.width = `${(remain / this.timeLimit) * 100}%`;
    }
    if (remain <= 0) this.onEnd();
  }

  onEnd() {
    if (!this.dragging) return;
    clearInterval(this.timerId);
    if (this.timerBar) this.timerBar.style.width = "100%";
    this.dragging.el.classList.remove("orb-grabbing");
    this.dragging = null;

    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);

    this.render();
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
          orb.el.className = `orb orb-${toType} orb-shape-${toType}`;
          orb.el.innerHTML = this.icons[toType];
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
          orb.el.className = `orb orb-${toType} orb-shape-${toType}`;
          orb.el.innerHTML = this.icons[toType];
        }
      });
    });
  }

  changeBoardColors(types) {
    if (this.processing) return;
    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb) {
          const type = types[Math.floor(Math.random() * types.length)];
          orb.type = type;
          orb.el.className = `orb orb-${type} orb-shape-${type}`;
          orb.el.innerHTML = this.icons[type];
        }
      });
    });
  }

  fixRowColor(rowIdx, type) {
    if (this.processing || rowIdx < 0 || rowIdx >= this.rows) return;
    this.state[rowIdx].forEach((orb) => {
      if (orb) {
        orb.type = type;
        orb.el.className = `orb orb-${type} orb-shape-${type}`;
        orb.el.innerHTML = this.icons[type];
      }
    });
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

    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb) {
          orb.el.remove();
          this.state[r][c] = null;
        }
      });
    });

    await this.sleep(100);

    // 2. Gravity naturally spawns new orbs
    await this.simultaneousGravity();
    await this.sleep(450);

    this.processing = false;
    this.process(); // Start natural combo sequence
  }

  async process() {
    this.processing = true;
    this.currentCombo = 0;
    this.comboEl.innerText = "";
    const visitedCombos = new Set();

    while (true) {
      const groups = this.findCombos();
      if (groups.length === 0) break;

      for (const group of groups) {
        // --- Special Bonus: Monocolor Full Board ---
        if (group.length === this.rows * this.cols) {
          this.currentCombo += 10;
        } else {
          this.currentCombo++;
        }

        // Notify React
        this.onCombo(this.currentCombo);
        // Update UI directly
        this.comboEl.innerText = `${this.currentCombo} COMBO!`;

        group.forEach((o) => o.el.classList.add("orb-matching"));
        await this.sleep(300);
        group.forEach((o) => {
          o.el.remove();
          this.state[o.r][o.c] = null;
        });
        await this.sleep(50);
      }

      await this.simultaneousGravity();
      await this.sleep(450);

      if (this.noSkyfall) break;
    }

    // --- Special Bonus: Perfect Clear ---
    const isPerfect = this.state.every((row) =>
      row.every((orb) => orb === null),
    );
    if (isPerfect && this.currentCombo > 0) {
      this.currentCombo *= 2;
      this.comboEl.innerText = `PERFECT CLEAR! x2 COMBO (${this.currentCombo} total)`;
      await this.sleep(1000);
    }

    this.processing = false;
    this.onTurnEnd(this.currentCombo);
  }

  findCombos() {
    const matched = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false),
    );
    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const t = this.state[r][c]?.type;
        if (
          t &&
          this.state[r][c + 1]?.type === t &&
          this.state[r][c + 2]?.type === t
        ) {
          matched[r][c] = matched[r][c + 1] = matched[r][c + 2] = true;
          let k = c + 3;
          while (k < this.cols && this.state[r][k]?.type === t)
            matched[r][k++] = true;
        }
      }
    }
    // Vertical
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const t = this.state[r][c]?.type;
        if (
          t &&
          this.state[r + 1][c]?.type === t &&
          this.state[r + 2][c]?.type === t
        ) {
          matched[r][c] = matched[r + 1][c] = matched[r + 2][c] = true;
          let k = r + 3;
          while (k < this.rows && this.state[k][c]?.type === t)
            matched[k++][c] = true;
        }
      }
    }

    const groups = [];
    const visited = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false),
    );

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (matched[r][c] && !visited[r][c]) {
          const group = [];
          const q = [{ r, c }];
          const type = this.state[r][c].type;
          visited[r][c] = true;
          while (q.length > 0) {
            const curr = q.shift();
            group.push(this.state[curr.r][curr.c]);
            [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
            ].forEach(([dr, dc]) => {
              const nr = curr.r + dr,
                nc = curr.c + dc;
              if (
                nr >= 0 &&
                nr < this.rows &&
                nc >= 0 &&
                nc < this.cols &&
                matched[nr][nc] &&
                !visited[nr][nc] &&
                this.state[nr][nc].type === type
              ) {
                visited[nr][nc] = true;
                q.push({ r: nr, c: nc });
              }
            });
          }
          groups.push(group);
        }
      }
    }
    return groups;
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
    await this.sleep(20);
    this.render();
  }

  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  destroy() {
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);
  }
}

// --- React App ---
const App = () => {
  // Game State
  const [tokens, setTokens] = useState(Array(6).fill(null));
  const [stars, setStars] = useState(5);
  const [target, setTarget] = useState(8);
  const [turn, setTurn] = useState(1);
  const [cycleTotalCombo, setCycleTotalCombo] = useState(0);

  const [energy, setEnergy] = useState(0);
  const [maxEnergy, setMaxEnergy] = useState(10);

  const [activeBuffs, setActiveBuffs] = useState([]);

  // Shop choice state
  const [pendingShopItem, setPendingShopItem] = useState(null);

  // UI State
  const [showShop, setShowShop] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [message, setMessage] = useState(null);

  // Refs
  const boardRef = useRef(null);
  const timerRef = useRef(null);
  const comboRef = useRef(null);
  const engineRef = useRef(null);

  // Derived
  const hasGiantDomain = tokens.some((t) => t?.enchantment === "expand_board");
  // NOTE: Changing board size forces re-init.
  const rows = hasGiantDomain ? 6 : 5;
  const cols = hasGiantDomain ? 7 : 6;

  const maxTurns = 3 + tokens.filter((t) => t?.enchantment === "add_turn").length;

  // --- Skyfall Weight Management ---
  useEffect(() => {
    if (!engineRef.current) return;
    const weights = {};
    const ALL_COLORS = ["fire", "water", "wood", "light", "dark", "heart"];
    ALL_COLORS.forEach((c) => (weights[c] = 1));

    activeBuffs.forEach((buff) => {
      if (buff.action === "skyfall") {
        buff.params.colors.forEach((c) => {
          weights[c] *= buff.params.weight;
        });
      } else if (buff.action === "skyfall_limit") {
        ALL_COLORS.forEach((c) => {
          if (!buff.params.colors.includes(c)) {
            weights[c] = 0;
          }
        });
      }
    });
    engineRef.current.setSpawnWeights(weights);
  }, [activeBuffs]);

  const getTimeLimit = useCallback(() => {
    let base = 5000;
    tokens.forEach((t) => {
      if (t?.effect === "time") base += t.values[(t.level || 1) - 1];
    });
    return base;
  }, [tokens]);

  // --- Init Engine ---
  useEffect(() => {
    if (!boardRef.current) return;

    const engine = new PuzzleEngine(
      boardRef.current,
      timerRef.current,
      comboRef.current,
      {
        rows,
        cols,
        timeLimit: getTimeLimit(),
        onCombo: (count) => {
          // No-op for now to avoid re-renders
        },
        onTurnEnd: (total) => {
          handleTurnEnd(total);
          // Auto-reset temporary forbidden ritual effect
          if (engineRef.current) engineRef.current.noSkyfall = false;
        },
      },
    );

    engine.init();
    engineRef.current = engine;

    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols]);

  // Update time limit live
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.timeLimit = getTimeLimit();
    }
  }, [tokens, getTimeLimit]);

  // --- Game Logic ---
  const handleTurnEnd = (turnCombo) => {
    let bonus = 0;
    let multiplier = 1;
    tokens.forEach((t) => {
      if (!t) return;
      const lv = t.level || 1;
      if (t.enchantment === "fixed_add") bonus += 2;
      if (t.effect === "base_add") bonus += t.values[lv - 1];
      if (t.enchantment === "star_add") bonus += stars;

      // Forbidden Ritual multiplier
      if (t.id === "forbidden") {
        multiplier *= t.values[lv - 1];
      }
      if (t.action === "forbidden_temp" && engineRef.current?.noSkyfall) {
        multiplier *= 10;
      }
      // Resonance enchantment: Multiply by token level
      if (t.enchantment === "lvl_mult") {
        multiplier *= lv;
      }
    });

    const effectiveCombo = Math.floor((turnCombo + bonus) * multiplier);

    // Cumulative Star generation logic
    let totalReduction = 0;
    tokens.forEach((t) => {
      if (t?.id === "collector") {
        const threshold = t.values[(t.level || 1) - 1];
        totalReduction += (5 - threshold);
      }
    });
    const starThreshold = Math.max(1, 5 - totalReduction);
    const totalStarsEarned = Math.floor(effectiveCombo / starThreshold);

    if (totalStarsEarned > 0) {
      setStars((s) => s + totalStarsEarned);
      notify(`+${totalStarsEarned} STARS!`);
    }

    setCycleTotalCombo((prev) => prev + effectiveCombo);
    // Gain Energy per turn
    setEnergy((prev) => Math.min(maxEnergy, prev + 2));

    // Update active buffs
    setActiveBuffs((prev) =>
      prev
        .map((b) => ({ ...b, duration: b.duration - 1 }))
        .filter((b) => b.duration > 0),
    );

    const isTargetMet = cycleTotalCombo + effectiveCombo >= target;

    // Check for cycle end or game over
    if (turn >= maxTurns) {
      if (isTargetMet) {
        handleCycleClear();
      } else {
        handleGameOver();
      }
    } else {
      setTurn((prev) => prev + 1);
    }
  };

  const skipTurns = () => {
    const remainingTurns = maxTurns - turn;
    if (remainingTurns > 0) {
      const bonus = remainingTurns * 2;
      setStars((s) => s + bonus);
      notify(`SKIP BONUS: +${bonus} STARS!`);
    }
    handleCycleClear();
  };

  const handleCycleClear = () => {
    notify("CYCLE CLEAR!");
    setTimeout(() => {
      setTurn(1);
      setCycleTotalCombo(0);
      setTarget((t) => Math.floor(t * 1.5) + 2);
      generateShop();
      setShowShop(true);
    }, 1000);
  };

  const handleGameOver = () => {
    notify("GOAL MISSED... RELOADING");
    setTimeout(() => window.location.reload(), 3000);
  };

  useEffect(() => {
    // This useEffect is now primarily for triggering game over/cycle clear
    // based on turn progression, after handleTurnEnd has updated state.
    // The logic for checking conditions is now primarily in handleTurnEnd.
    // This can be simplified or removed if handleTurnEnd fully covers it.
    // For now, keeping it to ensure any edge cases are caught, though it might be redundant.
    if (turn > maxTurns && cycleTotalCombo < target) {
      handleGameOver();
    }
  }, [turn, cycleTotalCombo, target, maxTurns]);


  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  const generateShop = () => {
    const isLuxury = totalPurchases >= 6;

    // Calculate total sale count based on all bargain tokens
    let saleBonus = 0;
    tokens.forEach((t) => {
      if (t?.id === "bargain") {
        const value = t.values[(t.level || 1) - 1];
        saleBonus += (value - 1); // Bonus amount over the base 1
      }
    });
    const saleCount = 1 + saleBonus;

    const items = [];
    const pool = [...ALL_TOKEN_BASES];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const base = pool[idx];
      const item = { ...base, level: 1 };

      if (isLuxury && Math.random() < 0.3) {
        const enc =
          ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        item.enchantment = enc.effect;
        item.enchantName = enc.name;
        item.price += 4;
      }
      items.push(item);
    }

    // Assign Sales
    const indices = [0, 1, 2, 3];
    for (let i = 0; i < saleCount && indices.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * indices.length);
      const targetIdx = indices.splice(randIdx, 1)[0];
      items[targetIdx].isSale = true;
      items[targetIdx].originalPrice = items[targetIdx].price;
      items[targetIdx].price = Math.floor(items[targetIdx].price / 2);
    }

    if (isLuxury) {
      const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
      items.push({ ...enc, type: "enchant_grant", price: enc.price - 2 });
    }
    setShopItems(items);
  };

  const buyItem = (item) => {
    if (stars < item.price) return notify("★が足りません");

    if (item.type === "enchant_grant") {
      const targetIdx = tokens.findIndex((t) => t && !t.enchantment);
      if (targetIdx === -1) return notify("付与可能なトークンがありません");
      setTokens((prev) => {
        const next = [...prev];
        next[targetIdx] = {
          ...next[targetIdx],
          enchantment: item.effect,
          enchantName: item.name,
        };
        return next;
      });
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify("購入完了!");
    } else {
      // Check for duplicate
      const existingIdx = tokens.findIndex((t) => t?.id === item.id);
      if (existingIdx !== -1) {
        setPendingShopItem(item);
      } else {
        const emptyIdx = tokens.indexOf(null);
        if (emptyIdx === -1) return notify("スロットがいっぱいです");
        setTokens((prev) => {
          const next = [...prev];
          next[emptyIdx] = item;
          return next;
        });
        setStars((s) => s - item.price);
        setTotalPurchases((p) => p + 1);
        setShopItems((prev) => prev.filter((i) => i !== item));
        notify("購入完了!");
      }
    }
  };

  const handleChoice = (choice) => {
    if (!pendingShopItem) return;
    const item = pendingShopItem;

    if (choice === "upgrade") {
      setTokens((prev) => {
        const next = [...prev];
        const idx = next.findIndex((t) => t?.id === item.id);
        if (idx !== -1) {
          next[idx] = { ...next[idx], level: (next[idx].level || 1) + 1 };
        }
        return next;
      });
      notify(`${item.name} を強化しました!`);
    } else {
      const emptyIdx = tokens.indexOf(null);
      if (emptyIdx === -1) {
        notify("スロットがいっぱいです。代わりに強化します。");
        setTokens((prev) => {
          const next = [...prev];
          const idx = next.findIndex((t) => t?.id === item.id);
          if (idx !== -1) {
            next[idx] = { ...next[idx], level: (next[idx].level || 1) + 1 };
          }
          return next;
        });
      } else {
        setTokens((prev) => {
          const next = [...prev];
          next[emptyIdx] = item;
          return next;
        });
        notify("2つ目のトークンを装備しました。");
      }
    }

    setStars((s) => s - item.price);
    setTotalPurchases((p) => p + 1);
    setShopItems((prev) => prev.filter((i) => i !== item));
    setPendingShopItem(null);
  };

  const useSkill = (token, index) => {
    if (!token || token.type !== "skill") return;
    if (energy < (token.cost || 0)) return notify("エネルギーが足りません");
    if (engineRef.current?.processing) return notify("処理中です");

    const engine = engineRef.current;
    if (!engine) return;

    switch (token.action) {
      case "refresh":
        engine.init();
        break;
      case "force_refresh":
        engine.forceRefresh();
        break;
      case "convert":
        engine.convertColor(token.params.from, token.params.to);
        break;
      case "convert_multi":
        engine.convertMultiColor(token.params.types, token.params.to);
        break;
      case "board_change":
        engine.changeBoardColors(token.params.colors);
        break;
      case "skyfall":
      case "skyfall_limit":
        setActiveBuffs((prev) => [
          ...prev.filter((b) => b.action !== token.action), // Remove same type
          {
            id: Date.now(),
            action: token.action,
            params: token.params,
            duration: token.params.duration,
          },
        ]);
        notify(`${token.name} 発動！ (${token.params.duration}手番)`);
        break;
      case "row_fix":
        engine.fixRowColor(token.params.row, token.params.type);
        break;
      case "forbidden_temp":
        engine.noSkyfall = true;
        notify("禁忌の儀式発動！(落ちコン停止)");
        break;
      default:
        break;
    }

    setEnergy((prev) => prev - (token.cost || 0));
    notify(`${token.name} 発動!`);
  };

  const openShop = () => {
    setShowShop(true);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full px-4 py-8 overflow-hidden">
      <div className="text-sm font-black text-amber-500 tracking-[0.4em] mb-2 drop-shadow-md">
        PUZZLE QUEST
      </div>

      {/* HUD */}
      <div className="w-full max-w-[360px] flex justify-between items-end mb-4">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest drop-shadow-sm">
            Target Combo
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-400 tabular-nums">
              {cycleTotalCombo}
            </span>
            <span className="text-slate-500 font-bold">/ {target}</span>
          </div>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: maxTurns }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border border-white/30 ${turn > i ? "bg-white" : "bg-white/10"
                  }`}
              />
            ))}
            <span className="text-[9px] text-slate-400 font-bold ml-1">
              TURN {turn} / {maxTurns}
            </span>
          </div>
          {/* Energy Bar */}
          <div className="flex flex-col gap-1 mt-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] text-indigo-400 font-bold tracking-widest uppercase">
                Energy
              </span>
              <span className="text-[10px] text-indigo-300 font-black">
                {energy} / {maxEnergy}
              </span>
            </div>
            <div className="h-2 w-48 bg-slate-900 rounded-full overflow-hidden border border-indigo-500/20">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(energy / maxEnergy) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            <button
              onClick={openShop}
              className="group p-2.5 glass border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10 transition-all rounded-xl shadow-lg shadow-amber-900/10 active:scale-95"
            >
              <ShoppingCart className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest drop-shadow-sm">
                Stars
              </div>
              <div className="flex items-center gap-1.5 text-3xl font-black text-yellow-400">
                <Star className="w-6 h-6 fill-current animate-pulse" />
                <span className="tabular-nums">{stars}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combo Display & Skip Button */}
      <div className="combo-info h-16 flex flex-col justify-center items-center gap-2">
        {cycleTotalCombo >= target && turn < maxTurns && (
          <button
            onClick={skipTurns}
            className="group relative px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl font-black text-slate-900 text-xs tracking-tighter shadow-xl shadow-amber-500/20 active:scale-95 transition-all overflow-hidden animate-in zoom-in duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              NEXT GOAL (+{(maxTurns - turn) * 2} <Star className="w-3 h-3 fill-current" />)
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:animate-shimmer" />
          </button>
        )}
        <div id="combo-count" ref={comboRef}></div>
      </div>

      {/* Timer Bar */}
      <div className="timer-container">
        <div id="timer-bar" ref={timerRef}></div>
      </div>

      {/* Board */}
      <div className="board-wrapper">
        <div id="board" className="board" ref={boardRef}></div>
      </div>

      {/* Controls - Removed Restart Board Button */}

      <div className="hint mt-6 text-center text-[10px] text-slate-600 uppercase tracking-widest">
        Drag to move • Match 3+ • Combos stack
      </div>

      {/* Token Slots */}
      <div className="w-full max-w-[360px] mt-8">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">
          Active Tokens
        </div>
        <div className="grid grid-cols-6 gap-2">
          {tokens.map((t, i) => (
            <div
              key={i}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border-2 transition-all p-1
                            ${t ? "bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10" : "bg-slate-900/30 border-slate-800 border-dashed"}
                        `}
            >
              {t ? (
                <>
                  <div className="text-[8px] font-black text-indigo-300 truncate w-full text-center">
                    {t.name}
                  </div>
                  <div className="text-xs font-black text-white">
                    L{t.level || 1}
                  </div>
                  {t.type === "skill" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        useSkill(t, i);
                      }}
                      disabled={
                        energy < (t.cost || 0) || engineRef.current?.processing
                      }
                      className={`mt-1 text-[9px] font-black px-2 py-1 rounded shadow-sm
                                  ${energy >= (t.cost || 0) &&
                          !engineRef.current?.processing
                          ? "rpg-btn text-white border-b-2 border-indigo-900"
                          : "bg-slate-700 text-slate-500 cursor-not-allowed"
                        }
                                `}
                    >
                      SKILL {t.cost}E
                    </button>
                  )}
                  {t.enchantment && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="text-[7px] font-black bg-purple-600 text-white px-1 rounded-full whitespace-nowrap shadow-sm">
                        {t.enchantName}
                      </div>
                      <Sparkles className="w-3 h-3 text-purple-400 drop-shadow-sm" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-1 h-3 bg-slate-800 rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shop Overlay */}
      {showShop && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-indigo-300 drop-shadow-lg tracking-widest">
                SHOP
              </h2>
              <div className="flex items-center gap-2 text-2xl font-black text-amber-400 drop-shadow-sm">
                <Star className="w-6 h-6 fill-current" /> {stars}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {shopItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => buyItem(item)}
                  className="w-full shop-item p-6 rounded-3xl flex justify-between items-center group transition-all text-left"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-white tracking-tight">
                        {item.name}
                      </span>
                      {item.isSale && (
                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-md shadow-lg shadow-red-900/20 border border-red-400/30 animate-pulse">
                          SALE 50% OFF
                        </span>
                      )}
                      {item.enchantment && (
                        <span className="text-[10px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2.5 py-1 rounded-full shadow-lg shadow-purple-900/20 border border-purple-400/30">
                          ✦ {item.enchantName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-bold leading-relaxed max-w-[240px]">
                      {item.desc}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {item.isSale && (
                      <span className="text-[10px] text-slate-500 font-bold line-through">
                        ★{item.originalPrice}
                      </span>
                    )}
                    <div className="flex items-center gap-2 bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 px-5 py-3 rounded-2xl font-black border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all shadow-xl shadow-amber-900/20">
                      <span className="text-lg">{item.price}</span>
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (stars >= 1) {
                    setStars((prev) => prev - 1);
                    generateShop();
                  }
                }}
                className="bg-slate-900 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-slate-800"
              >
                <RotateCcw className="w-4 h-4" /> REROLL (1★)
              </button>
              <button
                onClick={() => setShowShop(false)}
                className="bg-indigo-600 py-4 rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/30"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Choice Modal */}
      {pendingShopItem && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="w-full max-w-xs glass p-6 rounded-3xl text-center">
            <h3 className="text-xl font-black mb-2">重複トークン</h3>
            <p className="text-sm text-slate-400 mb-6 font-bold">
              すでに「{pendingShopItem.name}」を所持しています。どうしますか？
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleChoice("upgrade")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl font-black text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                強化する (Lv UP)
              </button>
              <button
                onClick={() => handleChoice("new")}
                className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-black text-slate-200 border border-slate-700 transition-all active:scale-95"
              >
                2つ目として装備する
              </button>
              <button
                onClick={() => setPendingShopItem(null)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {message && (
        <div className="fixed top-12 glass px-6 py-3 rounded-2xl font-black text-amber-500 shadow-2xl animate-pop z-[2000]">
          {message}
        </div>
      )}
    </div>
  );
};

export default App;
