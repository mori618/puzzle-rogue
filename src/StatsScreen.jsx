import React, { useState } from 'react';

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

const StatsScreen = ({ stats, currentRunStats, isActiveGame, onClose }) => {
    const [activeTab, setActiveTab] = useState(isActiveGame ? "current" : "lifetime");

    // タブに応じた表示用データをマッピング
    const displayData = {
        totalCombo: activeTab === "current" ? currentRunStats.currentTotalCombo : stats.lifetimeTotalCombo,
        maxCombo: activeTab === "current" ? currentRunStats.maxCombo : stats.maxComboAllTime,
        maxComboMultiplier: activeTab === "current" ? currentRunStats.maxComboMultiplier : stats.maxComboMultiplierAllTime,
        maxEnchants: activeTab === "current" ? currentRunStats.maxEnchants : stats.maxEnchantsAllTime,
        plays: activeTab === "current" ? currentRunStats.currentPlays : stats.lifetimePlays,
        clears: activeTab === "current" ? currentRunStats.currentClears : stats.lifetimeClears,
        starsSpent: activeTab === "current" ? currentRunStats.currentStarsSpent : stats.lifetimeStarsSpent,
        skillsUsed: activeTab === "current" ? currentRunStats.currentSkillsUsed : stats.lifetimeSkillsUsed,
        totalMoveTime: activeTab === "current" ? currentRunStats.currentTotalMoveTime : stats.lifetimeTotalMoveTime,

        // 特殊消し
        shapeLen4: activeTab === "current" ? currentRunStats.currentShapeLen4 : stats.lifetimeShapeLen4,
        shapeLen5: activeTab === "current" ? currentRunStats.currentShapeLen5 : stats.lifetimeShapeLen5,
        shapeRow: activeTab === "current" ? currentRunStats.currentShapeRow : stats.lifetimeShapeRow,
        shapeLShape: activeTab === "current" ? currentRunStats.currentShapeLShape : stats.lifetimeShapeLShape,
        shapeCross: activeTab === "current" ? currentRunStats.currentShapeCross : stats.lifetimeShapeCross,
        shapeSquare: activeTab === "current" ? currentRunStats.currentShapeSquare : stats.lifetimeShapeSquare,
    };

    return (
        <div className="w-full h-full bg-background-dark flex flex-col items-center justify-center p-6 animate-fade-in font-display relative z-50">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-black text-white mb-6 text-center tracking-widest flex items-center justify-center gap-2 sticky top-0 bg-slate-900 z-10 py-2">
                    <span className="material-icons-round text-amber-400">emoji_events</span>
                    STATS
                </h2>

                {/* Tabs */}
                <div className="flex w-full mb-6 bg-slate-800 rounded-xl p-1 shrink-0">
                    <button
                        onClick={() => setActiveTab("current")}
                        disabled={!isActiveGame}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === "current"
                            ? "bg-slate-600 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-400"
                            }`}
                    >
                        現在のゲーム
                    </button>
                    <button
                        onClick={() => setActiveTab("lifetime")}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === "lifetime"
                            ? "bg-slate-600 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-300"
                            }`}
                    >
                        累計記録
                    </button>
                </div>

                <div className="flex flex-col gap-4 text-slate-300">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                            {activeTab === "current" ? "今回の記録" : "歴代記録"}
                        </span>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">コンボ数</span>
                            <span className="font-black text-amber-500">{(displayData.totalCombo || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">プレイ回数</span>
                            <span className="font-black text-amber-500">{(displayData.plays || 0).toLocaleString()} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">クリア回数</span>
                            <span className="font-black text-amber-500">{(displayData.clears || 0).toLocaleString()} 回</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">最大コンボ</span>
                            <span className="font-black text-white">{(displayData.maxCombo || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">最大コンボ倍率</span>
                            <span className="font-black text-white">x{(displayData.maxComboMultiplier || 1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">最大エンチャント数</span>
                            <span className="font-black text-white">{displayData.maxEnchants || 0} 個</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">特殊消し回数</span>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">4個消し</span>
                            <span className="font-black text-white">{(displayData.shapeLen4 || 0).toLocaleString()} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">5個異常消し</span>
                            <span className="font-black text-white">{(displayData.shapeLen5 || 0).toLocaleString()} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">1列消し</span>
                            <span className="font-black text-white">{(displayData.shapeRow || 0).toLocaleString()} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">L字消し</span>
                            <span className="font-black text-white">{(displayData.shapeLShape || 0).toLocaleString()} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">十字消し</span>
                            <span className="font-black text-white">{(displayData.shapeCross || 0).toLocaleString()} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-400">四角消し(2x2)</span>
                            <span className="font-black text-white">{(displayData.shapeSquare || 0).toLocaleString()} 回</span>
                        </div>

                        <div className="border-t border-white/5 my-1"></div>

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">消費スター数</span>
                            <span className="font-black text-yellow-400">{(displayData.starsSpent || 0).toLocaleString()} ★</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">スキル使用回数</span>
                            <span className="font-black text-indigo-400">{(displayData.skillsUsed || 0).toLocaleString()} 回</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">操作時間</span>
                            <span className="font-black text-amber-500">{formatTime(displayData.totalMoveTime)}</span>
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
