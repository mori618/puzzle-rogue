import React from 'react';

const TitleScreen = ({ onStart, onHelp, onStats, hasSaveData, onContinue, onCredits, onSettings }) => {
    return (
        <div className="w-full h-screen bg-background-dark flex flex-col items-center justify-center relative overflow-hidden font-display">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
                <h1 className="text-5xl font-black text-white mb-2 tracking-widest italic drop-shadow-[0_0_15px_rgba(91,19,236,0.6)] flex items-center gap-2">
                    <span className="material-icons-round text-primary text-5xl">auto_awesome</span>
                    PUZZLE
                </h1>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-12">
                    ROGUE-LIKE
                </p>

                <div className="w-full space-y-4">
                    {hasSaveData ? (
                        <>
                            <button
                                onClick={onContinue}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transform transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                            >
                                <span className="material-icons-round text-xl">play_circle</span>
                                続きから
                            </button>
                            <button
                                onClick={onStart}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl border border-white/10 transform transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-xl">refresh</span>
                                初めから
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onStart}
                            className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(91,19,236,0.4)] transform transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                        >
                            <span className="material-icons-round text-xl">play_arrow</span>
                            始める
                        </button>
                    )}
                    <button
                        onClick={onHelp}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/10 transform transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-xl">help_outline</span>
                        ヘルプ画面
                    </button>
                    <button
                        onClick={onStats}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/10 transform transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                        <span className="material-icons-round text-xl">emoji_events</span>
                        実績画面
                    </button>
                    <button
                        onClick={onSettings}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/10 transform transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                        <span className="material-icons-round text-xl">settings</span>
                        設定
                    </button>
                    <button
                        onClick={onCredits}
                        className="w-full bg-slate-900/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-xl border border-white/5 transform transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
                    >
                        <span className="material-icons-round text-xl">info</span>
                        クレジット
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TitleScreen;
