import React, { useState } from 'react';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';
import TitleEncyclopediaScreen from './TitleEncyclopediaScreen';
import { loadTitleState, getEquippedTitleInfo } from './utils/titleManager';

// --- 開発用更新情報設定（不要になったら false に変更、または本ブロックごと削除可能） ---
const SHOW_DEV_UPDATE_INFO = true;
// 日時・概要はビルド時に最新コミットから自動生成される（vite.config.js の getLastUpdateInfo）
/* global __LAST_UPDATE_INFO__ */
const DEV_UPDATE_INFO = typeof __LAST_UPDATE_INFO__ !== 'undefined'
    ? __LAST_UPDATE_INFO__
    : { date: '', time: '', summary: '' };

const DevUpdateInfo = () => {
    if (!SHOW_DEV_UPDATE_INFO) return null;
    return (
        <div className="mt-2 pt-2 border-t border-white/10 w-full flex flex-col items-center text-center select-none bg-slate-950/60 rounded-xl px-3 py-1.5 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400">
                <span className="material-icons-round text-[13px]">update</span>
                <span>最終更新: {DEV_UPDATE_INFO.date} {DEV_UPDATE_INFO.time}</span>
            </div>
            {DEV_UPDATE_INFO.summary && (
                <p className="text-[10px] text-slate-300 mt-0.5 leading-tight font-sans line-clamp-2">
                    {DEV_UPDATE_INFO.summary}
                </p>
            )}
        </div>
    );
};

const TitleScreen = ({
    onStart,
    onHelp,
    onStats,
    hasSaveData,
    onContinue,
    onCredits,
    onSettings,
    onEncyclopedia,
    onPractice,
    onUIPreview,
    onEndless
}) => {
    const [showTitleEncyclopedia, setShowTitleEncyclopedia] = useState(false);
    const titleState = loadTitleState();
    const equippedInfo = getEquippedTitleInfo(titleState.equippedTitle);

    return (
        <div className="w-full h-[100dvh] bg-background-dark flex flex-col items-center justify-between relative overflow-hidden font-game-cyber px-4 py-[calc(10px+env(safe-area-inset-top,0px))] pb-[calc(10px+env(safe-area-inset-bottom,0px))]">
            {/* Cyber Grid Background */}
            <div className="cyber-grid-bg"></div>

            {/* Background effects overlay */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>

            {/* 二つ名図鑑モーダル */}
            {showTitleEncyclopedia && (
                <TitleEncyclopediaScreen onClose={() => setShowTitleEncyclopedia(false)} />
            )}

            {/* メインエリア */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm flex-1 min-h-0 justify-center">
                <div className="w-full flex flex-col items-center overflow-y-auto no-scrollbar py-1 max-h-full">
                    <h1 className="text-4xl md:text-5xl font-game-header text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 mb-1 tracking-widest drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center gap-2">
                        <span className="material-icons-round text-yellow-400 text-4xl md:text-5xl animate-pulse">auto_awesome</span>
                        PUZZLE
                    </h1>
                    <p className="text-indigo-300 font-bold tracking-[0.25em] uppercase text-xs mb-3">
                        ROGUE-LIKE
                    </p>

                    {/* 装備中二つ名バッジ */}
                    <div
                        onClick={() => {
                            soundManager.playSE(SE_IDS.UI_CLICK);
                            setShowTitleEncyclopedia(true);
                        }}
                        className="mb-4 cursor-pointer group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 transition-all shadow-md active:scale-95"
                    >
                        <span className="material-icons-round text-amber-400 text-sm group-hover:scale-110 transition-transform">military_tech</span>
                        <span className="text-xs font-bold text-amber-200 tracking-wide">
                            {equippedInfo.fullName !== '未設定' ? equippedInfo.fullName : '二つ名未設定'}
                        </span>
                        <span className="material-icons-round text-slate-500 text-xs">chevron_right</span>
                    </div>

                    <div className="w-full space-y-2 pb-1">
                        {hasSaveData ? (
                            <>
                                <button
                                    onClick={() => {
                                        onContinue();
                                        soundManager.playSE(SE_IDS.UI_CLICK);
                                    }}
                                    className="w-full btn-game-primary py-3 flex items-center justify-center gap-2 text-base"
                                >
                                    <span className="material-icons-round text-xl">play_circle</span>
                                    続きから
                                </button>
                                <button
                                    onClick={() => {
                                        onStart();
                                        soundManager.playSE(SE_IDS.UI_CLICK);
                                    }}
                                    className="w-full btn-game-secondary py-2.5 flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons-round text-xl">refresh</span>
                                    初めから (スタート)
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    onStart();
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                }}
                                className="w-full btn-game-primary py-3 flex items-center justify-center gap-2 text-base"
                            >
                                <span className="material-icons-round text-xl">play_arrow</span>
                                GAME START
                            </button>
                        )}

                        {/* エンドレスモードボタン */}
                        <button
                            onClick={() => {
                                soundManager.playSE(SE_IDS.UI_CLICK);
                                if (onEndless) {
                                    onEndless();
                                } else if (onStart) {
                                    onStart();
                                }
                            }}
                            className="w-full btn-game-cyber py-2.5 flex items-center justify-center gap-2 text-amber-300 hover:text-amber-200"
                        >
                            <span className="material-icons-round text-xl">all_inclusive</span>
                            エンドレスモード
                        </button>

                        {/* 練習モードボタン */}
                        {onPractice && (
                            <button
                                onClick={() => {
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                    onPractice();
                                }}
                                className="w-full btn-game-cyber py-2.5 flex items-center justify-center gap-2 text-indigo-300 hover:text-white"
                            >
                                <span className="material-icons-round text-xl">fitness_center</span>
                                練習モード
                            </button>
                        )}

                        {/* 図鑑ボタン */}
                        {onEncyclopedia && (
                            <button
                                onClick={() => {
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                    onEncyclopedia();
                                }}
                                className="w-full btn-game-cyber py-2.5 flex items-center justify-center gap-2 text-slate-300 hover:text-white"
                            >
                                <span className="material-icons-round text-xl">menu_book</span>
                                トークン図鑑
                            </button>
                        )}

                        {/* 実績ボタン */}
                        {onStats && (
                            <button
                                onClick={() => {
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                    onStats();
                                }}
                                className="w-full btn-game-cyber py-2.5 flex items-center justify-center gap-2 text-slate-300 hover:text-white"
                            >
                                <span className="material-icons-round text-xl">emoji_events</span>
                                実績 (Stats)
                            </button>
                        )}

                        {/* サブメニュー (ヘルプ・設定・クレジット) */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                            {onHelp && (
                                <button
                                    onClick={() => {
                                        soundManager.playSE(SE_IDS.UI_CLICK);
                                        onHelp();
                                    }}
                                    className="btn-game-cyber py-2 flex flex-col items-center justify-center gap-0.5 text-xs text-slate-400 hover:text-white"
                                >
                                    <span className="material-icons-round text-base text-indigo-300">help_outline</span>
                                    <span>ヘルプ</span>
                                </button>
                            )}
                            {onSettings && (
                                <button
                                    onClick={() => {
                                        soundManager.playSE(SE_IDS.UI_CLICK);
                                        onSettings();
                                    }}
                                    className="btn-game-cyber py-2 flex flex-col items-center justify-center gap-0.5 text-xs text-slate-400 hover:text-white"
                                >
                                    <span className="material-icons-round text-base text-indigo-300">settings</span>
                                    <span>設定</span>
                                </button>
                            )}
                            {onCredits && (
                                <button
                                    onClick={() => {
                                        soundManager.playSE(SE_IDS.UI_CLICK);
                                        onCredits();
                                    }}
                                    className="btn-game-cyber py-2 flex flex-col items-center justify-center gap-0.5 text-xs text-slate-400 hover:text-white"
                                >
                                    <span className="material-icons-round text-base text-indigo-300">info</span>
                                    <span>クレジット</span>
                                </button>
                            )}
                        </div>

                        {/* UI Preview (デバッグ用) */}
                        {onUIPreview && (
                            <button
                                onClick={() => {
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                    onUIPreview();
                                }}
                                className="w-full btn-game-cyber py-1.5 flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 mt-1"
                            >
                                <span className="material-icons-round text-sm">visibility</span>
                                UI Preview
                            </button>
                        )}

                        <DevUpdateInfo />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TitleScreen;
