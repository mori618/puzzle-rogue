import React from 'react';

/**
 * SettingsScreen - ゲーム設定画面
 * ポーズ画面から遷移する設定画面。コンボ演出モード等の設定を管理する。
 *
 * Props:
 *   settings: { comboAnimationMode: 'instant' | 'step' }
 *   onSettingsChange: (key, value) => void - 設定変更コールバック
 *   onClose: () => void - 閉じるコールバック
 */
const SettingsScreen = ({ settings, onSettingsChange, onClose }) => {
    const { comboAnimationMode = 'instant' } = settings || {};

    return (
        <div className="w-full h-full bg-background-dark flex flex-col items-center justify-center p-6 animate-fade-in font-display">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xs shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative p-6">

                {/* ヘッダー */}
                <h2 className="text-3xl font-black text-white mb-8 text-center tracking-widest flex items-center justify-center gap-2">
                    <span className="material-icons-round text-primary">settings</span>
                    設定
                </h2>

                <div className="w-full flex flex-col gap-5">

                    {/* コンボ演出モード */}
                    <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                        <p className="text-slate-300 text-sm font-bold mb-3 flex items-center gap-1.5">
                            <span className="material-icons-round text-base text-primary">auto_awesome</span>
                            コンボ演出
                        </p>
                        <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                            コンボ終了後のボーナス計算をどのように表示するかを選択します。
                        </p>

                        {/* 一括演出ボタン */}
                        <button
                            onClick={() => onSettingsChange('comboAnimationMode', 'instant')}
                            className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-3 px-4 mb-2 text-sm ${comboAnimationMode === 'instant'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-slate-700/60 text-slate-400 border border-white/5 hover:bg-slate-700'
                                }`}
                        >
                            <span className="material-icons-round text-lg">flash_on</span>
                            <div className="text-left">
                                <div className="font-black text-base">一括演出</div>
                                <div className={`text-xs font-normal ${comboAnimationMode === 'instant' ? 'text-white/70' : 'text-slate-500'}`}>
                                    ボーナス → 倍率 → 最終値 をまとめて表示
                                </div>
                            </div>
                            {comboAnimationMode === 'instant' && (
                                <span className="material-icons-round text-white ml-auto text-base">check_circle</span>
                            )}
                        </button>

                        {/* 段階的演出ボタン */}
                        <button
                            onClick={() => onSettingsChange('comboAnimationMode', 'step')}
                            className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-3 px-4 text-sm ${comboAnimationMode === 'step'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-slate-700/60 text-slate-400 border border-white/5 hover:bg-slate-700'
                                }`}
                        >
                            <span className="material-icons-round text-lg">filter_none</span>
                            <div className="text-left">
                                <div className="font-black text-base">段階的演出</div>
                                <div className={`text-xs font-normal ${comboAnimationMode === 'step' ? 'text-white/70' : 'text-slate-500'}`}>
                                    トークンの効果ごとに1つずつ表示
                                </div>
                            </div>
                            {comboAnimationMode === 'step' && (
                                <span className="material-icons-round text-white ml-auto text-base">check_circle</span>
                            )}
                        </button>
                    </div>

                    <div className="my-1 border-b border-white/5 w-full"></div>

                    {/* 戻るボタン */}
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl font-bold border border-white/10 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-xl">arrow_back</span>
                        戻る
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
