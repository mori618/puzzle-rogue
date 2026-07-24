import React from 'react';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';

const PauseScreen = ({ onResume, onTitle, onHelp, onStats, onCredits, onSettings }) => {
    return (
        <div 
            className="w-full h-full bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in font-game-cyber"
            onClick={onResume}
        >
            <div 
                className="game-panel-cyber rounded-2xl w-full max-w-xs flex flex-col p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-3xl font-game-header text-indigo-300 mb-8 text-center tracking-widest flex items-center justify-center gap-2">
                    <span className="material-icons-round text-indigo-400">pause</span>
                    PAUSE
                </h2>

                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={() => {
                            onResume();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-primary py-3.5 flex justify-center items-center gap-2 text-base"
                    >
                        <span className="material-icons-round text-xl">play_arrow</span>
                        続ける
                    </button>
                    <button
                        onClick={() => {
                            onHelp();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">help_outline</span>
                        ヘルプ
                    </button>
                    <button
                        onClick={() => {
                            onStats();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">emoji_events</span>
                        実績 (Stats)
                    </button>
                    <button
                        onClick={() => {
                            onCredits();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">info</span>
                        クレジット
                    </button>
                    <button
                        onClick={() => {
                            onSettings();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-cyber py-3 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-lg text-indigo-300">settings</span>
                        設定
                    </button>
                    
                    <div className="my-2 border-b border-white/10 w-full"></div>
                    
                    <button
                        onClick={() => {
                            onTitle();
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        className="w-full btn-game-danger py-3 flex justify-center items-center gap-2 mt-2"
                    >
                        <span className="material-icons-round text-xl">home</span>
                        タイトルに戻る
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PauseScreen;
