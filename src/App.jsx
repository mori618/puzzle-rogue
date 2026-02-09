import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Star,
  RotateCcw,
  TrendingUp,
  Sparkles,
} from "lucide-react";

// --- Constants (RPG) ---
const ALL_TOKEN_BASES = [
  {
    id: "forbidden",
    name: "禁忌の儀式",
    type: "passive",
    effect: "forbidden",
    values: [3, 4, 10],
    price: 4,
    desc: "落ちコン消滅。コンボ加算がLvに応じ3/4/10倍に増幅。",
  },
  {
    id: "collector",
    name: "黄金の収集者",
    type: "passive",
    effect: "star_gain",
    values: [4, 3, 2],
    price: 3,
    desc: "★獲得に必要なコンボ数をLvに応じ4/3/2に短縮。",
  },
  {
    id: "refresh",
    name: "次元の再編",
    type: "skill",
    cost: 0,
    action: "refresh",
    price: 2,
    desc: "盤面をリフレッシュ。手数を消費しない。",
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
    this.onTurnEnd = options.onTurnEnd || (() => {});
    this.onCombo = options.onCombo || (() => {});

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
      type = this.types[Math.floor(Math.random() * this.types.length)];
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

  async process() {
    this.processing = true;
    this.currentCombo = 0;
    this.comboEl.innerText = "";
    const visitedCombos = new Set();

    while (true) {
      const groups = this.findCombos();
      if (groups.length === 0) break;

      for (const group of groups) {
        this.currentCombo++;
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
  const [stars, setStars] = useState(0);
  const [turn, setTurn] = useState(1);
  const [cycleTotalCombo, setCycleTotalCombo] = useState(0);
  const [target, setTarget] = useState(8);

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
    tokens.forEach((t) => {
      if (!t) return;
      const lv = t.level || 1;
      if (t.enchantment === "fixed_add") bonus += 2;
      if (t.effect === "base_add") bonus += t.values[lv - 1];
      if (t.enchantment === "star_add") bonus += stars;
    });

    const effectiveCombo = turnCombo + bonus;

    // Star generation logic
    const collector = tokens.find((t) => t?.id === "collector");
    const starThreshold = collector
      ? collector.values[(collector.level || 1) - 1]
      : 5;
    const totalStarsEarned = Math.floor(effectiveCombo / starThreshold);

    if (totalStarsEarned > 0) {
      setStars((s) => s + totalStarsEarned);
      notify(`+${totalStarsEarned} STARS!`);
    }

    setCycleTotalCombo((prev) => prev + effectiveCombo);
    setTurn((t) => t + 1);
  };

  useEffect(() => {
    if (turn > 3) {
      if (cycleTotalCombo >= target) {
        notify("CYCLE CLEAR!");
        setTimeout(() => {
          setTurn(1);
          setCycleTotalCombo(0);
          setTarget((t) => Math.floor(t * 1.5) + 2);
          generateShop();
          setShowShop(true);
        }, 1000);
      } else {
        notify("GOAL MISSED... RELOADING");
        setTimeout(() => window.location.reload(), 3000);
      }
    }
  }, [turn, cycleTotalCombo, target]);

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  const generateShop = () => {
    const isLuxury = totalPurchases >= 6;
    const items = [];
    for (let i = 0; i < 4; i++) {
      const base =
        ALL_TOKEN_BASES[Math.floor(Math.random() * ALL_TOKEN_BASES.length)];
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
    } else {
      const emptyIdx = tokens.indexOf(null);
      if (emptyIdx === -1) return notify("スロットがいっぱいです");
      setTokens((prev) => {
        const next = [...prev];
        next[emptyIdx] = item;
        return next;
      });
    }
    setStars((s) => s - item.price);
    setTotalPurchases((p) => p + 1);
    setShopItems((prev) => prev.filter((i) => i !== item));
    notify("購入完了!");
  };

  const resetBoard = () => {
    if (engineRef.current) engineRef.current.init();
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full px-4 py-8 overflow-hidden">
      <div className="text-xs font-bold text-slate-500 tracking-[0.4em] mb-1">
        PUZZLE SIMULATOR
      </div>

      {/* HUD */}
      <div className="w-full max-w-[360px] flex justify-between items-end mb-4">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Target Combo
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-400 tabular-nums">
              {cycleTotalCombo}
            </span>
            <span className="text-slate-500 font-bold">/ {target}</span>
          </div>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3].map((t) => (
              <div
                key={t}
                className={`h-1.5 w-8 rounded-full ${turn >= t ? "bg-indigo-500" : "bg-slate-800"}`}
              />
            ))}
            <span className="text-[9px] text-slate-400 font-bold ml-1">
              TURN {Math.min(3, turn)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Stars
          </div>
          <div className="flex items-center gap-1.5 text-3xl font-black text-yellow-400">
            <Star className="w-6 h-6 fill-current animate-pulse" />
            <span className="tabular-nums">{stars}</span>
          </div>
        </div>
      </div>

      {/* Combo Display */}
      <div className="combo-info h-16 flex justify-center items-center">
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

      {/* Controls */}
      <div className="ui-panel mt-6 flex gap-4">
        <button
          onClick={resetBoard}
          className="btn bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-6 rounded-lg font-bold text-sm"
        >
          RESTART BOARD
        </button>
      </div>

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
                  {t.enchantment && (
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-purple-400 drop-shadow-sm" />
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
          <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black italic tracking-tighter text-indigo-400">
                SHOP
              </h2>
              <div className="flex items-center gap-2 text-2xl font-black text-yellow-400">
                <Star className="w-6 h-6 fill-current" /> {stars}
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {shopItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => buyItem(item)}
                  className="w-full glass p-4 rounded-2xl flex justify-between items-center group hover:border-indigo-500/50 transition-all text-left"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-100">
                        {item.name}
                      </span>
                      {item.enchantment && (
                        <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30">
                          ✦ {item.enchantName}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold leading-tight max-w-[200px]">
                      {item.desc}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl font-black shrink-0">
                    <span className="text-sm">{item.price}</span>
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (stars >= 1) {
                    setStars(s - 1);
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
