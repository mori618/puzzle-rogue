import React from 'react';

const PauseScreen = ({ onResume, onTitle, onHelp, onStats }) => {
    return (
        <div className="w-full h-full bg-background-dark flex flex-col items-center justify-center p-6 animate-fade-in font-display">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xs shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative p-6">
                <h2 className="text-3xl font-black text-white mb-8 text-center tracking-widest flex items-center justify-center gap-2">
                    <span className="material-icons-round text-primary">pause</span>
                    PAUSE
                </h2>

                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={onResume}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-primary/30 flex justify-center items-center gap-2 text-lg"
                    >
                        <span className="material-icons-round text-xl">play_arrow</span>
                        続ける
                    </button>
                    <button
                        onClick={onHelp}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl font-bold border border-white/10 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-xl">help_outline</span>
                        ヘルプ
                    </button>
                    <button
                        onClick={onStats}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-amber-200 py-3.5 rounded-xl font-bold border border-white/10 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-xl">emoji_events</span>
                        実績 (Stats)
                    </button>
                    <div className="my-2 border-b border-white/5 w-full"></div>
                    <button
                        onClick={onTitle}
                        className="w-full bg-slate-900/50 hover:bg-red-600/20 text-red-400 py-3.5 rounded-xl font-bold border border-red-500/20 transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
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
