import React, { useState } from 'react';
import { formatJapaneseNumber } from './utils/numberUtils.js';

const formatTime = (ms) => {
    if (!ms || ms < 0) return "0s";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

const StatsScreen = ({ currentRunStats, onClose }) => {
    // 表示用データをマッピング
    const displayData = {
        totalCombo: currentRunStats.currentTotalCombo || 0,
        maxCombo: currentRunStats.maxCombo || 0,
        maxComboMultiplier: currentRunStats.maxComboMultiplier || 1,
        maxBaseCombo: currentRunStats.maxBaseCombo || 0,
        maxBaseComboMultiplier: currentRunStats.maxBaseComboMultiplier || 1,
        maxEnchants: currentRunStats.maxEnchants || 0,
        clears: currentRunStats.currentClears || 0,
        starsSpent: currentRunStats.currentStarsSpent || 0,
        skillsUsed: currentRunStats.currentSkillsUsed || 0,
        totalMoveTime: currentRunStats.currentTotalMoveTime || 0,
        cursesRemoved: currentRunStats.currentCursesRemoved || 0,
        dropsErased: currentRunStats.currentDropsErased || {},
        skipsPerformed: currentRunStats.skipsPerformed || 0,

        // 特殊消し
        shapeLen4: currentRunStats.currentShapeLen4 || 0,
        shapeLen5: currentRunStats.currentShapeLen5 || 0,
        shapeRow: currentRunStats.currentShapeRow || 0,
        shapeLShape: currentRunStats.currentShapeLShape || 0,
        shapeCross: currentRunStats.currentShapeCross || 0,
        shapeSquare: currentRunStats.currentShapeSquare || 0,

        // 追加ギミック実績
        maxMoveDrop: currentRunStats.maxMoveDrop || 0,
        maxBombEraseOnce: currentRunStats.maxBombEraseOnce || 0,
        maxRepeatOnce: currentRunStats.maxRepeatOnce || 0,
        totalStarDropsErased: currentRunStats.totalStarDropsErased || 0,
        totalBombsErased: currentRunStats.totalBombsErased || 0,
        totalRepeatsErased: currentRunStats.totalRepeatsErased || 0,
        totalRainbowsErased: currentRunStats.totalRainbowsErased || 0,
        totalStarEarnedByDrops: currentRunStats.totalStarEarnedByDrops || 0,
    };

    const colorConfig = {
        fire: { label: "炎", icon: "local_fire_department", color: "text-red-500" },
        water: { label: "雨", icon: "water_drop", color: "text-blue-400" },
        wood: { label: "風", icon: "forest", color: "text-emerald-500" },
        light: { label: "雷", icon: "bolt", color: "text-yellow-400" },
        dark: { label: "月", icon: "dark_mode", color: "text-purple-400" },
        heart: { label: "心", icon: "favorite", color: "text-pink-400" },
    };

    return (
        <div className="w-full h-full bg-background-dark flex flex-col items-center justify-center p-6 animate-fade-in font-display relative z-50">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-black text-white mb-6 text-center tracking-widest flex items-center justify-center gap-2 sticky top-0 bg-slate-900 z-10 py-2">
                    <span className="material-icons-round text-amber-400">emoji_events</span>
                    STATS
                </h2>

                <div className="flex flex-col gap-4 text-slate-300">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                            今回のゲームの記録
                        </span>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">コンボ数</span>
                            <span className="font-black text-amber-500">{formatJapaneseNumber(displayData.totalCombo)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">サイクルクリア数</span>
                            <span className="font-black text-amber-500">{formatJapaneseNumber(displayData.clears)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">スキップターン数</span>
                            <span className="font-black text-amber-500">{formatJapaneseNumber(displayData.skipsPerformed)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">呪い解除数</span>
                            <span className="font-black text-amber-500">{formatJapaneseNumber(displayData.cursesRemoved)} 回</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">ベース最大コンボ</span>
                            <span className="font-black text-slate-400">{formatJapaneseNumber(displayData.maxBaseCombo)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="font-bold text-sm">ベース最大倍率</span>
                            <span className="font-black">x{Math.round((displayData.maxBaseComboMultiplier) * 100) / 100}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">最大エンチャント数</span>
                            <span className="font-black text-white">{displayData.maxEnchants} 個</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">特殊消し回数</span>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">4個消し</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.shapeLen4)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">5個異常消し</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.shapeLen5)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">1列消し</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.shapeRow)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">L字消し</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.shapeLShape)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">十字消し</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.shapeCross)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">四角消し(2x2)</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.shapeSquare)} 回</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">消費スター数</span>
                            <span className="font-black text-yellow-400">{formatJapaneseNumber(displayData.starsSpent)} ★</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">アクティブスキル発動数</span>
                            <span className="font-black text-indigo-400">{formatJapaneseNumber(displayData.skillsUsed)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">操作時間</span>
                            <span className="font-black text-amber-500">{formatTime(displayData.totalMoveTime)}</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">特殊ドロップ・ギミック記録</span>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">ムーブドロップ最高カウント</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.maxMoveDrop)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">一度のボム最高消去数</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.maxBombEraseOnce)} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">一度のリピート最高回数</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.maxRepeatOnce)} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">スタードロップで得たスター</span>
                            <span className="font-black text-yellow-400">{formatJapaneseNumber(displayData.totalStarEarnedByDrops)} ★</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">虹ドロップ消去数</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.totalRainbowsErased)} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">ボムドロップ消去数</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.totalBombsErased)} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">リピートドロップ消去数</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.totalRepeatsErased)} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">スタードロップ消去数</span>
                            <span className="font-black text-white">{formatJapaneseNumber(displayData.totalStarDropsErased)} 個</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ドロップ消去数</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {Object.entries(colorConfig).map(([color, config]) => (
                                <div key={color} className="flex justify-between items-center py-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`material-icons-round text-lg ${config.color}`}>{config.icon}</span>
                                        <span className="font-bold text-xs text-slate-400">{config.label}</span>
                                    </div>
                                    <span className="font-black text-sm text-white">{formatJapaneseNumber(displayData.dropsErased[color] || 0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 sticky bottom-0 bg-slate-900 pt-2 pb-2 z-10">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold border border-white/10 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-xl">close</span>
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatsScreen;
