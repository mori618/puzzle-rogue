import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, ShoppingCart, Star, RotateCcw, TrendingUp, Maximize, Zap, Sparkles, Ghost, Award, Info } from 'lucide-react';

// --- Constants & Data Definitions ---
const ROWS_STD = 5;
const COLS_STD = 6;
const ROWS_EXT = 6;
const COLS_EXT = 7;
const ORB_SIZE = 56;
const TYPES = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
const TYPE_ICONS = { fire: '🔥', water: '💧', wood: '🌿', light: '✨', dark: '🌙', heart: '❤️' };
const TYPE_SHAPES = {
    fire: '50% 50% 30% 30%',
    water: '40% 60% 60% 40% / 50% 50% 50% 50%',
    wood: '50% 15% 50% 15%',
    light: '25%',
    dark: '15% 50% 15% 50%',
    heart: '50%'
};

const ALL_TOKEN_BASES = [
    { id: 'forbidden', name: '禁忌の儀式', type: 'passive', effect: 'forbidden', values: [3, 4, 10], price: 4, desc: "落ちコン消滅。コンボ加算がLvに応じ3/4/10倍に増幅。" },
    { id: 'collector', name: '黄金の収集者', type: 'passive', effect: 'star_gain', values: [4, 3, 2], price: 3, desc: "★獲得に必要なコンボ数をLvに応じ4/3/2に短縮。" },
    { id: 'refresh', name: '次元の再編', type: 'skill', cost: 0, action: 'refresh', price: 2, desc: "盤面をリフレッシュ。手数を消費しない。" },
    { id: 'time_ext', name: '時の砂', type: 'passive', effect: 'time', values: [1000, 2000, 3000], price: 2, desc: "操作時間をLvに応じ1/2/3秒延長。" },
    { id: 'power_up', name: '力の鼓動', type: 'passive', effect: 'base_add', values: [1, 2, 3], price: 2, desc: "コンボ加算にLv分の固定値を追加。" }
];

const ENCHANTMENTS = [
    { id: 'giant', name: '巨人の領域', effect: 'expand_board', price: 6, desc: "装備中、盤面が7x6に拡張される。" },
    { id: 'resonance', name: 'レベル共鳴', effect: 'lvl_mult', price: 8, desc: "トークンのLv分、コンボ加算値を乗算する。" },
    { id: 'greed', name: '強欲の輝き', effect: 'star_add', price: 9, desc: "現在の所持★数をコンボ加算値に加える。" },
    { id: 'chain', name: '連鎖の刻印', effect: 'fixed_add', value: 2, price: 5, desc: "コンボ加算値を一律+2する。" }
];

// --- Utilities ---
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const App = () => {
    // --- Game State ---
    const [board, setBoard] = useState([]);
    const [tokens, setTokens] = useState(Array(6).fill(null));
    const [stars, setStars] = useState(0);
    const [turn, setTurn] = useState(1);
    const [cycleTotalCombo, setCycleTotalCombo] = useState(0);
    const [target, setTarget] = useState(8);
    const [processing, setProcessing] = useState(false);
    const [comboCount, setComboCount] = useState(0);
    const [timer, setTimer] = useState(0);
    const [showShop, setShowShop] = useState(false);
    const [shopItems, setShopItems] = useState([]);
    const [totalPurchases, setTotalPurchases] = useState(0);
    const [message, setMessage] = useState(null);
    const [lastComboPower, setLastComboPower] = useState(null);

    const boardRef = useRef(null);
    const draggingRef = useRef(null);
    const comboSinceStarRef = useRef(0);
    const timerIntervalRef = useRef(null);

    const isRitualActive = tokens.some(t => t?.id === 'forbidden');
    const hasGiantDomain = tokens.some(t => t?.enchantment === 'expand_board');
    const rows = hasGiantDomain ? ROWS_EXT : ROWS_STD;
    const cols = hasGiantDomain ? COLS_EXT : COLS_STD;

    const baseTime = 5000;
    const getTimeLimit = useCallback(() => {
        let extra = 0;
        tokens.forEach(t => {
            if (t?.effect === 'time') extra += t.values[(t.level || 1) - 1];
        });
        return baseTime + extra;
    }, [tokens]);

    // --- Initialization ---
    const spawnOrb = useCallback((r, c, noMatch = false) => {
        let type;
        const avail = [...TYPES];
        while (avail.length > 0) {
            type = avail[Math.floor(Math.random() * avail.length)];
            if (!noMatch) break;
            const mH = c >= 2 && board[r]?.[c - 1]?.type === type && board[r]?.[c - 2]?.type === type;
            const mV = r >= 2 && board[r - 1]?.[c]?.type === type && board[r - 2]?.[c]?.type === type;
            if (!mH && !mV) break;
            avail.splice(avail.indexOf(type), 1);
        }
        return { type, id: Math.random(), r, c, x: c * ORB_SIZE, y: r * ORB_SIZE, matched: false };
    }, [board]);

    const initBoard = useCallback(() => {
        const newBoard = Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
                let type;
                const avail = [...TYPES];
                type = avail[Math.floor(Math.random() * avail.length)];
                return { type, id: Math.random(), r, c, x: c * ORB_SIZE, y: r * ORB_SIZE, matched: false };
            })
        );
        setBoard(newBoard);
    }, [rows, cols]);

    useEffect(() => { initBoard(); }, [rows, cols]);

    const notify = (text) => {
        setMessage(text);
        setTimeout(() => setMessage(null), 2500);
    };

    // --- Combo Engine ---
    const detectMatches = (grid) => {
        const toMatch = Array.from({ length: rows }, () => Array(cols).fill(false));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 2; c++) {
                if (grid[r][c] && grid[r][c + 1] && grid[r][c + 2] &&
                    grid[r][c].type === grid[r][c + 1].type && grid[r][c].type === grid[r][c + 2].type) {
                    toMatch[r][c] = toMatch[r][c + 1] = toMatch[r][c + 2] = true;
                }
            }
        }
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows - 2; r++) {
                if (grid[r][c] && grid[r + 1][c] && grid[r + 2][c] &&
                    grid[r][c].type === grid[r + 1][c].type && grid[r][c].type === grid[r + 2][c].type) {
                    toMatch[r][c] = toMatch[r + 1][c] = toMatch[r + 2][c] = true;
                }
            }
        }

        const groups = [];
        const grouped = Array.from({ length: rows }, () => Array(cols).fill(false));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (toMatch[r][c] && !grouped[r][c]) {
                    const type = grid[r][c].type;
                    const cluster = [];
                    const q = [[r, c]];
                    grouped[r][c] = true;
                    while (q.length > 0) {
                        const [currR, currC] = q.shift();
                        cluster.push({ r: currR, c: currC });
                        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                            const nr = currR + dr, nc = currC + dc;
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && toMatch[nr][nc] && !grouped[nr][nc] && grid[nr][nc].type === type) {
                                grouped[nr][nc] = true;
                                q.push([nr, nc]);
                            }
                        });
                    }
                    groups.push(cluster);
                }
            }
        }
        return groups;
    };

    const calculateShapeBonus = (cluster) => {
        let bonus = 0;
        const count = cluster.length;
        if (count === 4) bonus += 1;
        const rSet = new Set(cluster.map(o => o.r));
        for (let r of rSet) {
            if (cluster.filter(o => o.r === r).length >= 6) bonus += 3;
        }
        const minR = Math.min(...cluster.map(o => o.r)), maxR = Math.max(...cluster.map(o => o.r));
        const minC = Math.min(...cluster.map(o => o.c)), maxC = Math.max(...cluster.map(o => o.c));
        if (maxR - minR === 2 && maxC - minC === 2 && count >= 9) bonus += 5;
        if (count === 5) {
            const centerR = minR + 1, centerC = minC + 1;
            const hasCenter = cluster.some(o => o.r === centerR && o.c === centerC);
            const hasAdj = cluster.some(o => o.r === centerR - 1 && o.c === centerC) &&
                cluster.some(o => o.r === centerR + 1 && o.c === centerC) &&
                cluster.some(o => o.r === centerR && o.c === centerC - 1) &&
                cluster.some(o => o.r === centerR && o.c === centerC + 1);
            if (hasCenter && hasAdj) bonus += 2;
        }
        return bonus;
    };

    const processBoard = async (isManual = true) => {
        setProcessing(true);
        let localBoard = [...board.map(row => [...row])];
        let stepCombo = 0;

        while (true) {
            const groups = detectMatches(localBoard);
            if (groups.length === 0) break;

            for (const cluster of groups) {
                let comboPower = 1;
                comboPower += calculateShapeBonus(cluster);

                tokens.forEach(t => {
                    if (!t) return;
                    const lv = t.level || 1;
                    if (t.enchantment === 'fixed_add') comboPower += 2;
                    if (t.effect === 'base_add') comboPower += t.values[lv - 1];
                    if (t.enchantment === 'star_add') comboPower += stars;
                    if (t.enchantment === 'lvl_mult') comboPower *= lv;
                });

                const ritual = tokens.find(t => t?.id === 'forbidden');
                if (ritual) comboPower *= ritual.values[(ritual.level || 1) - 1];

                setLastComboPower(comboPower);

                // Deep copy localBoard before mutating for UI
                localBoard = localBoard.map(row => row.map(o => o ? { ...o } : null));
                cluster.forEach(o => {
                    if (localBoard[o.r][o.c]) localBoard[o.r][o.c].matched = true;
                });
                setBoard(localBoard);

                // Allow user to see the match before fading
                await sleep(250);

                for (let i = 0; i < comboPower; i++) {
                    setComboCount(prev => prev + 1);
                    setCycleTotalCombo(prev => prev + 1);

                    const collector = tokens.find(t => t?.id === 'collector');
                    const starThreshold = collector ? collector.values[(collector.level || 1) - 1] : 5;
                    comboSinceStarRef.current++;
                    if (comboSinceStarRef.current >= starThreshold) {
                        setStars(s => s + 1);
                        comboSinceStarRef.current = 0;
                    }
                    await sleep(Math.max(10, 150 / comboPower));
                }

                // Remove matched orbs from memory (Deep copy again to be safe)
                localBoard = localBoard.map(row => row.map(o => (o && o.matched) ? null : o));
                setBoard(localBoard);
                await sleep(100);
            }

            const newGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
            for (let c = 0; c < cols; c++) {
                let writeIdx = rows - 1;
                for (let r = rows - 1; r >= 0; r--) {
                    if (localBoard[r][c] && !localBoard[r][c].matched) {
                        newGrid[writeIdx][c] = { ...localBoard[r][c], r: writeIdx, x: c * ORB_SIZE, y: writeIdx * ORB_SIZE };
                        writeIdx--;
                    }
                }
                if (!isRitualActive) {
                    while (writeIdx >= 0) {
                        newGrid[writeIdx][c] = { ...spawnOrb(writeIdx, c, true), y: -ORB_SIZE * (rows - writeIdx) };
                        writeIdx--;
                    }
                }
            }
            localBoard = newGrid.map(row => row.map(o => o ? ({ ...o, matched: false }) : null));
            setBoard(localBoard);
            // Sync with CSS transition duration
            await sleep(500);
            if (isRitualActive) break;
        }

        if (isRitualActive) {
            const refilled = localBoard.map((row, r) => row.map((o, c) => o ? o : spawnOrb(r, c, true)));
            setBoard(refilled);
            await sleep(300);
        }

        if (isManual) setTurn(t => t + 1);
        setProcessing(false);
    };

    useEffect(() => {
        if (turn > 3 && !processing) {
            if (cycleTotalCombo >= target) {
                notify("CYCLE CLEAR!");
                setTurn(1);
                setCycleTotalCombo(0);
                setTarget(t => Math.floor(t * 1.5) + 2);
                generateShop();
                setTimeout(() => setShowShop(true), 1500);
            } else {
                notify("GOAL MISSED... RELOADING");
                setTimeout(() => window.location.reload(), 3000);
            }
        }
    }, [turn, processing, cycleTotalCombo, target]);

    // --- Interaction ---
    const handleStart = (e, orb) => {
        if (processing || turn > 3) return;
        const rect = boardRef.current.getBoundingClientRect();
        const px = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const py = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        draggingRef.current = {
            orb,
            offsetX: px - orb.c * ORB_SIZE,
            offsetY: py - orb.r * ORB_SIZE,
            swapped: false
        };

        const limit = getTimeLimit();
        setTimer(100);
        const startTime = Date.now();
        timerIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remain = Math.max(0, 100 - (elapsed / limit) * 100);
            setTimer(remain);
            if (remain <= 0) handleEnd();
        }, 16);
    };

    const handleMove = (e) => {
        if (!draggingRef.current) return;
        const rect = boardRef.current.getBoundingClientRect();
        const px = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const py = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        const dx = px - draggingRef.current.offsetX;
        const dy = py - draggingRef.current.offsetY;

        setBoard(prev => prev.map(row => row.map(o => {
            if (o && o.id === draggingRef.current.orb.id) return { ...o, x: dx, y: dy };
            return o;
        })));

        const curC = Math.max(0, Math.min(cols - 1, Math.floor(px / ORB_SIZE)));
        const curR = Math.max(0, Math.min(rows - 1, Math.floor(py / ORB_SIZE)));

        if (curC !== draggingRef.current.orb.c || curR !== draggingRef.current.orb.r) {
            draggingRef.current.swapped = true;
            const oldR = draggingRef.current.orb.r;
            const oldC = draggingRef.current.orb.c;

            setBoard(prev => {
                const next = prev.map(row => [...row]);
                const source = next[oldR][oldC];
                const target = next[curR][curC];

                if (source) {
                    next[curR][curC] = { ...source, r: curR, c: curC };
                    next[oldR][oldC] = target ? { ...target, r: oldR, c: oldC, x: oldC * ORB_SIZE, y: oldR * ORB_SIZE } : null;
                }
                return next;
            });
            draggingRef.current.orb.r = curR;
            draggingRef.current.orb.c = curC;
        }
    };

    const handleEnd = () => {
        if (!draggingRef.current) return;
        clearInterval(timerIntervalRef.current);
        const swapped = draggingRef.current.swapped;
        draggingRef.current = null;
        setTimer(0);
        setBoard(prev => prev.map(row => row.map(o => o ? ({ ...o, x: o.c * ORB_SIZE, y: o.r * ORB_SIZE }) : null)));
        if (swapped) {
            setComboCount(0);
            processBoard(true);
        }
    };

    const generateShop = () => {
        const isLuxury = totalPurchases >= 6;
        const items = [];
        for (let i = 0; i < 4; i++) {
            const base = ALL_TOKEN_BASES[Math.floor(Math.random() * ALL_TOKEN_BASES.length)];
            const item = { ...base, level: 1 };
            if (isLuxury && Math.random() < 0.3) {
                const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
                item.enchantment = enc.effect;
                item.enchantName = enc.name;
                item.price += 4;
            }
            items.push(item);
        }
        if (isLuxury) {
            const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
            items.push({ ...enc, type: 'enchant_grant', price: enc.price - 2 });
        }
        setShopItems(items);
    };

    const buyItem = (item) => {
        if (stars < item.price) return notify("★が足りません");
        if (item.type === 'enchant_grant') {
            const targetIdx = tokens.findIndex(t => t && !t.enchantment);
            if (targetIdx === -1) return notify("付与可能なトークンがありません");
            setTokens(prev => {
                const next = [...prev];
                next[targetIdx] = { ...next[targetIdx], enchantment: item.effect, enchantName: item.name };
                return next;
            });
        } else {
            const emptyIdx = tokens.indexOf(null);
            if (emptyIdx === -1) return notify("スロットがいっぱいです");
            setTokens(prev => {
                const next = [...prev];
                next[emptyIdx] = item;
                return next;
            });
        }
        setStars(s => s - item.price);
        setTotalPurchases(p => p + 1);
        setShopItems(prev => prev.filter(i => i !== item));
        notify("購入完了!");
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full px-4 py-8 overflow-hidden">

            {/* HUD */}
            <div className="w-full max-w-[360px] flex justify-between items-end mb-6">
                <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Combo</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-amber-400 tabular-nums">{cycleTotalCombo}</span>
                        <span className="text-slate-500 font-bold">/ {target}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3].map(t => (
                            <div key={t} className={`h-1.5 w-8 rounded-full ${turn >= t ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                        ))}
                        <span className="text-[9px] text-slate-400 font-bold ml-1">TURN {Math.min(3, turn)}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stars</div>
                    <div className="flex items-center gap-1.5 text-3xl font-black text-yellow-400">
                        <Star className="w-6 h-6 fill-current animate-pulse" />
                        <span className="tabular-nums">{stars}</span>
                    </div>
                </div>
            </div>

            {/* Timer Bar */}
            <div className="w-full max-w-[360px] h-1.5 bg-slate-900 rounded-full mb-3 overflow-hidden">
                <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${timer}%`, boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}
                />
            </div>

            {/* Board Container */}
            <div className="relative mb-8 group">
                <div className={`absolute -top-16 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none
          ${comboCount > 0 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
                    <div className="combo-text text-5xl font-black italic text-amber-500 flex flex-col items-center">
                        {comboCount}
                        <span className="text-xs not-italic tracking-[0.2em] -mt-1 opacity-80">COMBO!</span>
                    </div>
                </div>

                <div
                    ref={boardRef}
                    className="glass p-2 rounded-2xl shadow-2xl relative"
                    style={{ width: cols * ORB_SIZE + 16, height: rows * ORB_SIZE + 16 }}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                >
                    {board.flat().map(orb => orb && (
                        <div
                            key={orb.id}
                            className={`absolute flex items-center justify-center p-1 transition-opacity duration-300
                ${orb.matched ? 'opacity-0 scale-50' : 'opacity-100'}`}
                            style={{
                                width: ORB_SIZE, height: ORB_SIZE,
                                left: orb.x + 8, top: orb.y + 8,
                                zIndex: draggingRef.current?.orb.id === orb.id ? 100 : 10,
                                cursor: draggingRef.current ? 'grabbing' : 'grab',
                                transform: draggingRef.current?.orb.id === orb.id ? 'scale(1.15)' : 'scale(1)',
                                transition: draggingRef.current?.orb.id === orb.id ? 'none' : 'top 0.4s cubic-bezier(0.25, 1, 0.5, 1), left 0.1s ease-out, opacity 0.3s ease, transform 0.2s ease'
                            }}
                            onMouseDown={(e) => handleStart(e, orb)}
                            onTouchStart={(e) => handleStart(e, orb)}
                        >
                            <div
                                className={`w-full h-full flex items-center justify-center text-3xl orb-shadow transition-all duration-300
                                    ${orb.type === 'fire' ? 'bg-radial-fire' : ''}
                                    ${orb.type === 'water' ? 'bg-radial-water' : ''}
                                    ${orb.type === 'wood' ? 'bg-radial-wood' : ''}
                                    ${orb.type === 'light' ? 'bg-radial-light text-yellow-900' : ''}
                                    ${orb.type === 'dark' ? 'bg-radial-dark' : ''}
                                    ${orb.type === 'heart' ? 'bg-radial-heart' : ''}
                                `}
                                style={{ borderRadius: TYPE_SHAPES[orb.type] }}
                            >
                                <div className="orb-gloss" />
                                {TYPE_ICONS[orb.type]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Token Slots */}
            <div className="w-full max-w-[360px]">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">Active Tokens</div>
                <div className="grid grid-cols-6 gap-2">
                    {tokens.map((t, i) => (
                        <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border-2 transition-all p-1
              ${t ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-slate-900/30 border-slate-800 border-dashed'}
            `}>
                            {t ? (
                                <>
                                    <div className="text-[8px] font-black text-indigo-300 truncate w-full text-center">{t.name}</div>
                                    <div className="text-xs font-black text-white">L{t.level || 1}</div>
                                    {t.enchantment && <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-purple-400 drop-shadow-sm" />}
                                </>
                            ) : (
                                <div className="w-1 h-3 bg-slate-800 rounded-full" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto w-full max-w-[360px] pt-8 flex gap-4">
                <button
                    onClick={() => { generateShop(); setShowShop(true); }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all active:scale-95"
                >
                    <ShoppingCart className="w-5 h-5 text-indigo-400" /> MARKET
                </button>
            </div>

            {showShop && (
                <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-4xl font-black italic tracking-tighter text-indigo-400">SHOP</h2>
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
                                            <span className="font-black text-slate-100">{item.name}</span>
                                            {item.enchantment && (
                                                <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30">
                                                    ✦ {item.enchantName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold leading-tight max-w-[200px]">{item.desc}</div>
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
                                onClick={() => { if (stars >= 1) { setStars(s - 1); generateShop(); } }}
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

            {message && (
                <div className="fixed top-12 glass px-6 py-3 rounded-2xl font-black text-amber-500 shadow-2xl animate-pop z-[2000]">
                    {message}
                </div>
            )}

            <style>{`
        .orb-shadow { 
            box-shadow: 
                inset 2px 2px 4px rgba(255,255,255,0.4), 
                inset -4px -4px 8px rgba(0,0,0,0.3), 
                0 6px 12px rgba(0,0,0,0.3); 
        }
        .orb-gloss {
            position: absolute;
            top: 10%;
            left: 15%;
            width: 50%;
            height: 30%;
            background: linear-gradient(to bottom, rgba(255,255,255,0.6), transparent);
            border-radius: 50%;
            pointer-events: none;
        }
        .orb:active { transform: scale(1.1); }
        .bg-radial-fire  { background: radial-gradient(circle at 40% 40%, #ff5e5e, #880000); }
        .bg-radial-water { background: radial-gradient(circle at 40% 40%, #5eb2ff, #003399); }
        .bg-radial-wood  { background: radial-gradient(circle at 40% 40%, #70e470, #005500); }
        .bg-radial-light { background: radial-gradient(circle at 40% 40%, #ffef80, #b28900); }
        .bg-radial-dark  { background: radial-gradient(circle at 40% 40%, #c480ff, #3a0066); }
        .bg-radial-heart { background: radial-gradient(circle at 40% 40%, #ff95af, #880022); }
      `}</style>
        </div>
    );
};

export default App;
