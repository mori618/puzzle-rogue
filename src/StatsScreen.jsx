import React from 'react';
import { formatJapaneseNumber } from './utils/numberUtils.js';
import ScreenShell, { UiSection } from './ScreenShell';

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
        fire: { label: "炎", icon: "whatshot", color: "text-red-500" },
        water: { label: "雨", icon: "water_drop", color: "text-blue-400" },
        wood: { label: "風", icon: "air", color: "text-emerald-500" },
        light: { label: "雷", icon: "bolt", color: "text-yellow-400" },
        dark: { label: "月", icon: "nightlight_round", color: "text-purple-400" },
        heart: { label: "心", icon: "favorite", color: "text-pink-400" },
    };

    const n = formatJapaneseNumber;
    const multiplier = (v) => `x${Math.round(v * 100) / 100}`;

    // 大きく見せる主要な記録
    const highlights = [
        { label: 'コンボ数', icon: 'bolt', iconColor: 'text-amber-400', value: n(displayData.totalCombo) },
        { label: 'サイクルクリア', icon: 'flag', iconColor: 'text-emerald-400', value: n(displayData.clears), unit: '回' },
        { label: '消費スター', icon: 'star', iconColor: 'text-yellow-400', value: n(displayData.starsSpent), unit: '★' },
        { label: '操作時間', icon: 'timer', iconColor: 'text-sky-400', value: formatTime(displayData.totalMoveTime) },
    ];

    // グループごとの一覧（label, value, unit）
    const groups = [
        {
            title: 'プレイ', icon: 'sports_esports', rows: [
                ['スキップターン数', n(displayData.skipsPerformed), '回'],
                ['呪い解除数', n(displayData.cursesRemoved), '回'],
                ['アクティブスキル発動数', n(displayData.skillsUsed), '回'],
                ['ベース最大コンボ', n(displayData.maxBaseCombo)],
                ['ベース最大倍率', multiplier(displayData.maxBaseComboMultiplier)],
            ],
        },
        {
            title: '特殊消し', icon: 'grid_view', rows: [
                ['4個消し', n(displayData.shapeLen4), '回'],
                ['5個以上消し', n(displayData.shapeLen5), '回'],
                ['1列消し', n(displayData.shapeRow), '回'],
                ['L字消し', n(displayData.shapeLShape), '回'],
                ['十字消し', n(displayData.shapeCross), '回'],
                ['四角消し(2x2)', n(displayData.shapeSquare), '回'],
            ],
        },
        {
            title: '特殊ドロップ・ギミック', icon: 'auto_awesome', rows: [
                ['ムーブドロップ最高カウント', n(displayData.maxMoveDrop)],
                ['一度のボム最高消去数', n(displayData.maxBombEraseOnce), '個'],
                ['一度のリピート最高回数', n(displayData.maxRepeatOnce), '回'],
                ['スタードロップで得たスター', n(displayData.totalStarEarnedByDrops), '★'],
                ['虹ドロップ消去数', n(displayData.totalRainbowsErased), '個'],
                ['ボムドロップ消去数', n(displayData.totalBombsErased), '個'],
                ['リピートドロップ消去数', n(displayData.totalRepeatsErased), '個'],
                ['スタードロップ消去数', n(displayData.totalStarDropsErased), '個'],
            ],
        },
    ];

    return (
        <ScreenShell icon="emoji_events" accent="amber" title="実績" subtitle="今回のゲームの記録" onClose={onClose}>
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-2">
                    {highlights.map((h) => (
                        <div key={h.label} className="ui-stat-tile">
                            <span className="ui-stat-tile-label">
                                <span className={`material-icons-round ${h.iconColor}`}>{h.icon}</span>
                                {h.label}
                            </span>
                            <span className="ui-stat-tile-value truncate">
                                {h.value}
                                {h.unit && <span className="ui-row-unit">{h.unit}</span>}
                            </span>
                        </div>
                    ))}
                </div>

                <UiSection title="ドロップ消去数" icon="bubble_chart">
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(colorConfig).map(([color, config]) => (
                            <div key={color} className="ui-card px-2.5 py-2 flex flex-col items-center gap-0.5">
                                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                    <span className={`material-icons-round text-[15px] ${config.color}`}>{config.icon}</span>
                                    {config.label}
                                </span>
                                <span className="font-mono font-black text-white text-sm">{n(displayData.dropsErased[color] || 0)}</span>
                            </div>
                        ))}
                    </div>
                </UiSection>

                {groups.map((g) => (
                    <UiSection key={g.title} title={g.title} icon={g.icon}>
                        <div className="ui-card overflow-hidden">
                            {g.rows.map(([label, value, unit]) => (
                                <div key={label} className="ui-row">
                                    <span className="text-slate-300 font-semibold">{label}</span>
                                    <span className="ui-row-value">
                                        {value}
                                        {unit && <span className="ui-row-unit">{unit}</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </UiSection>
                ))}
            </div>
        </ScreenShell>
    );
};

export default StatsScreen;
