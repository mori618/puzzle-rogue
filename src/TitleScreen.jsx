import React from 'react';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';

const TitleScreen = ({ onStart, onHelp, onStats, hasSaveData, onContinue, onCredits, onSettings, onEncyclopedia, onPractice, onUIPreview }) => {
    return (
        <div className="w-full h-screen bg-background-dark flex flex-col items-center justify-center relative overflow-hidden font-game-cyber">
            {/* Cyber Grid Background */}
            <div className="cyber-grid-bg"></div>

            {/* Background effects overlay */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 max-h-[95vh] overflow-y-auto no-scrollbar py-4">
                <h1 className="text-5xl font-game-header text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 mb-2 tracking-widest drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center gap-2">
                    <span className="material-icons-round text-yellow-400 text-5xl animate-pulse">auto_awesome</span>
                    PUZZLE
                </h1>
                <p className="text-indigo-300 font-bold tracking-[0.25em] uppercase text-xs mb-8">
                    ROGUE-LIKE
                </p>

                <div className="w-full space-y-3 pb-4">
                    {hasSaveData ? (
                        <>
                            <button
                                onClick={() => {
                                    onContinue();
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                }}
                                className="w-full btn-game-primary py-3.5 flex items-center justify-center gap-2 text-base"
                            >
                                <span className="material-icons-round text-xl">play_circle</span>
                                続きから
                            </button>
                            <button
                                onClick={() => {
                                    onStart();
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                }}
                                className="w-full btn-game-secondary py-3 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-xl">refresh</span>
                                初めから
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                onStart();
                                soundManager.playSE(SE_IDS.UI_CLICK);
                            }}
                            className="w-full btn-game-primary py-3.5 flex items-center justify-center gap-2 text-base"
                        >
                            <span className="material-icons-round text-xl">play_arrow</span>
                            始める
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onHelp();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">help_outline</span>
                        ヘルプ画面
                    </button>
                    <button
                        onClick={() => {
                            onStats();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">emoji_events</span>
                        実績画面
                    </button>
                    <button
                        onClick={() => {
                            onEncyclopedia();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex items-center justify-center gap-2 font-japanese"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">menu_book</span>
                        トークン図鑑
                    </button>
                    <button
                        onClick={() => {
                            onSettings();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">settings</span>
                        設定
                    </button>
                    <button
                        onClick={() => {
                            onPractice();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">extension</span>
                        パズル練習
                    </button>
                    
                    {/* UIプレビュー画面への遷移ボタン */}
                    <button
                        onClick={() => {
                            onUIPreview();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 font-bold py-2.5 rounded-xl border border-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-lg">palette</span>
                        UIプレビュー画面
                    </button>

                    <button
                        onClick={() => {
                            onCredits();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-2.5 text-slate-400 text-sm flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-base">info</span>
                        クレジット
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TitleScreen;
